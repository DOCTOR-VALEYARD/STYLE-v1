/* =================================================
   🎵 ZARA BOT — YTAPI
   📁 src/ytapi.js
   👑 DOCTOR VALEYARD

   Download de ÁUDIO por API (único método do /play para áudio).
   Sem yt-dlp: cada provedor tem tempo de sobra e é tentado de novo
   antes de passar pro próximo.

   Provedores, nesta ordem:
     1) Savetube  (media.savetube.vip)
     2) Vreden    (api.vreden.my.id)
     3) YouTube direto (youtubei.js — reserva, não depende de API de terceiros)

   ✅ Só usa axios + crypto (já fazem parte do projeto)
   ✅ Não depende da versão do pacote @vreden/youtube_scraper
   ✅ Valida o arquivo baixado (tamanho e tipo) antes de aceitar
   ✅ Nunca ignora certificado SSL: se expirar, o provedor falha e passa pro próximo
================================================= */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { createDecipheriv } = require('crypto');

// 🔄 Downloader yt-dlp com auto-atualização (nunca derruba o boot).
// Só de dar require já deixa a rotina de atualização agendada em background.
let autoUpdate = null;
try { autoUpdate = require('./auto-update'); autoUpdate.iniciarRotinaUpdate(); } catch (e) { console.log('🔄 auto-update indisponível:', e?.message || e); }

const QUALIDADES_AUDIO = [92, 128, 256, 320];
const QUALIDADES_VIDEO = [144, 240, 360, 480, 720, 1080];

const UA_MOBILE =
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36';

// Tempo máximo de cada etapa (ms). Generoso: hospedagem com internet lenta
// precisa de tempo, então a API NÃO é abandonada por demorar uns segundos.
const TIMEOUT_INFO = 25000;
const TIMEOUT_ARQUIVO = 120000;
// Prazo TOTAL pra um provedor entregar o link (somando todas as etapas).
const PRAZO_LINK_MS = 60000;
// Áudios MUITO longos (horas): a API precisa converter tudo antes de entregar, então o prazo é bem maior.
const TIMEOUT_ARQUIVO_LONGO = 20 * 60000;
const PRAZO_LINK_LONGO_MS = 12 * 60000;
// Quantas vezes cada provedor é tentado quando falha por lentidão/queda de conexão.
const TENTATIVAS_POR_PROVEDOR = 2;

// =================================================
// 🩺 SAÚDE DOS PROVEDORES (evita perder tempo toda música)
// =================================================
// Se um provedor falhou agora há pouco, ele é PULADO por um tempo.
//   • Fora do ar de vez (domínio não existe, recusou conexão, certificado):  5 min
//   • Lento / estourou o tempo / erro 5xx:                                    não pausa (tenta de novo)
// Erros ligados ao vídeo específico (4xx, "sem link") não pausam nada.
const emPausa = new Map(); // nome -> timestamp até quando fica pausado

const ERROS_DEFINITIVOS = new Set([
    'ENOTFOUND', 'ECONNREFUSED', 'EAI_AGAIN',
    'CERT_HAS_EXPIRED', 'DEPTH_ZERO_SELF_SIGNED_CERT',
    'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'ERR_TLS_CERT_ALTNAME_INVALID'
]);
const ERROS_LENTIDAO = new Set(['ECONNABORTED', 'ETIMEDOUT', 'ECONNRESET', 'EPIPE']);

function minutosDePausa(erro) {
    const codigo = erro?.code;
    const status = Number(erro?.response?.status || 0);
    if (ERROS_DEFINITIVOS.has(codigo)) return 5;
    return 0;
}

function comPrazo(promessa, ms, nome) {
    let timer;
    const limite = new Promise((_, rejeitar) => {
        timer = setTimeout(() => {
            const e = new Error(`${nome} demorou mais de ${Math.round(ms / 1000)}s`);
            e.code = 'ETIMEDOUT';
            rejeitar(e);
        }, ms);
    });
    return Promise.race([promessa, limite]).finally(() => clearTimeout(timer));
}

// Chave pública usada pelo Savetube para criptografar a resposta de /v2/info
const SAVETUBE_CHAVE_HEX = 'C5D58EF67A7584E4A29F6C35BBC4EB12';

// =================================================
// 🔧 UTILITÁRIOS
// =================================================

function extrairIdYoutube(entrada) {
    const texto = String(entrada || '');
    const m = texto.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|v\/|live\/))([A-Za-z0-9_-]{11})/i
    );
    if (m) return m[1];
    return /^[A-Za-z0-9_-]{11}$/.test(texto) ? texto : null;
}

function escolherQualidade(q, tipo = 'audio') {
    if (tipo === 'video') return QUALIDADES_VIDEO.includes(Number(q)) ? Number(q) : 360;
    return QUALIDADES_AUDIO.includes(Number(q)) ? Number(q) : 128;
}

function descriptografarSavetube(base64) {
    const dados = Buffer.from(base64, 'base64');
    const iv = dados.subarray(0, 16);
    const conteudo = dados.subarray(16);
    const chave = Buffer.from(SAVETUBE_CHAVE_HEX, 'hex');
    const decipher = createDecipheriv('aes-128-cbc', chave, iv);
    const aberto = Buffer.concat([decipher.update(conteudo), decipher.final()]);
    return JSON.parse(aberto.toString());
}

function motivoDoErro(erro) {
    return erro?.code || erro?.response?.status || erro?.message || 'erro desconhecido';
}

// =================================================
// 1️⃣ SAVETUBE → devolve { url, titulo }
// =================================================

async function obterLinkSavetube(videoUrl, qualidade, tipo = 'audio') {
    const cdn = (await axios.get('https://media.savetube.vip/api/random-cdn', {
        timeout: TIMEOUT_INFO,
        headers: { 'User-Agent': UA_MOBILE }
    })).data?.cdn;

    if (!cdn) throw new Error('Savetube não informou o servidor (cdn).');

    const info = (await axios.post(`https://${cdn}/v2/info`, { url: videoUrl }, {
        timeout: TIMEOUT_INFO,
        headers: {
            'User-Agent': UA_MOBILE,
            'Referer': 'https://media.savetube.vip/1kejjj1?id=362796039'
        }
    })).data;

    if (!info?.data) throw new Error('Savetube não retornou informações do vídeo.');
    const detalhes = descriptografarSavetube(info.data);
    if (!detalhes?.key) throw new Error('Savetube não retornou a chave de download.');

    const resposta = (await axios.post(`https://${cdn}/download`, {
        downloadType: tipo === 'video' ? 'video' : 'audio',
        quality: String(qualidade),
        key: detalhes.key
    }, {
        timeout: TIMEOUT_INFO,
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': UA_MOBILE,
            'Referer': 'https://media.savetube.vip/start-download?from=1kejjj1%3Fid%3D362796039'
        }
    })).data;

    const url = resposta?.data?.downloadUrl;
    if (!url) throw new Error('Savetube não gerou o link de download.');

    return { url, titulo: detalhes.title || null };
}

// =================================================
// 2️⃣ VREDEN → devolve { url, titulo }
// =================================================

function acharUrlNaResposta(r) {
    if (!r || typeof r !== 'object') return null;
    const candidatos = [
        r.download?.url,
        r.download?.downloadUrl,
        r.download_url,
        r.downloadUrl,
        r.url,
        r.link,
        r.data?.download?.url,
        r.data?.url
    ];
    return candidatos.find(v => typeof v === 'string' && /^https?:\/\//i.test(v)) || null;
}

async function obterLinkVreden(videoUrl, qualidade, tipo = 'audio') {
    const resposta = await axios.get(
        `https://api.vreden.my.id/api/v1/download/youtube/${tipo === 'video' ? 'video' : 'audio'}`,
        {
            timeout: TIMEOUT_INFO,
            params: { url: videoUrl, quality: qualidade },
            headers: {
                'user-agent':
                    'VredenCloud/1.0 (+https://api.vreden.my.id; vreden@stayhome.li)'
            }
        }
    );

    const resultado = resposta.data?.result;
    const url = acharUrlNaResposta(resultado);
    if (!url) throw new Error('Vreden não retornou link de download.');

    return {
        url,
        titulo: resultado?.metadata?.title || resultado?.title || null
    };
}

// =================================================
// 3️⃣ YOUTUBE DIRETO (youtubei.js) → baixa e salva no disco
// =================================================
// Reserva: só é usado se Savetube e Vreden falharem.
// Usa o youtubei.js que o bot já tem instalado (o mesmo da busca).

let _innertube = null;

function versaoYoutubei() {
    try {
        const pkg = path.join(process.cwd(), 'node_modules', 'youtubei.js', 'package.json');
        return parseInt(JSON.parse(fs.readFileSync(pkg, 'utf8')).version, 10) || 0;
    } catch { return 0; }
}

function obterInnertube() {
    if (!_innertube) {
        _innertube = (async () => {
            const mod = await import('youtubei.js');
            const lib = mod.Innertube ? mod : (mod.default || mod);
            // Versões 14+ do youtubei.js precisam disso pra decifrar os links do YouTube
            if (versaoYoutubei() >= 14 && lib.Platform?.shim) {
                lib.Platform.shim.eval = async (data, env) => {
                    const props = [];
                    if (env.n) props.push(`n: exportedVars.nFunction(${JSON.stringify(env.n)})`);
                    if (env.sig) props.push(`sig: exportedVars.sigFunction(${JSON.stringify(env.sig)})`);
                    return new Function(`${data.output}\nreturn { ${props.join(', ')} }`)();
                };
            }
            const yt = await lib.Innertube.create({ retrieve_player: true, generate_session_locally: true });
            return { yt, lib };
        })().catch(e => { _innertube = null; throw e; });
    }
    return _innertube;
}

function converterParaMp3(origem, destino) {
    return new Promise(resolve => {
        let ok = false;
        try {
            const ff = spawn('ffmpeg', ['-y', '-i', origem, '-vn', '-c:a', 'libmp3lame', '-b:a', '128k', destino]);
            ff.on('error', () => resolve(false)); // ffmpeg não instalado
            ff.on('close', code => { ok = code === 0; resolve(ok); });
        } catch { resolve(false); }
    });
}

async function baixarDiretoYoutube(id, destino, tipo = 'audio') {
    const { yt, lib } = await obterInnertube();
    const temp = tipo === 'video' ? destino : destino.replace(/\.mp3$/i, '') + '.m4a';
    const clientes = ['IOS', 'ANDROID', 'TV', 'WEB_EMBEDDED', 'WEB'];
    let ultimoErro;

    for (const client of clientes) {
        try {
            const stream = await yt.download(id, {
                type: tipo === 'video' ? 'video+audio' : 'audio',
                quality: tipo === 'video' ? '360p' : 'best',
                format: 'mp4',
                client
            });

            const iter = lib.Utils?.streamToIterable ? lib.Utils.streamToIterable(stream) : stream;
            const ws = fs.createWriteStream(temp);
            let total = 0;
            for await (const pedaco of iter) {
                total += pedaco.length;
                if (!ws.write(pedaco)) await new Promise(r => ws.once('drain', r));
            }
            await new Promise((r, j) => { ws.on('error', j); ws.end(r); });

            if (total < 10000) throw new Error('O arquivo baixado veio vazio ou incompleto.');

            if (tipo === 'audio') {
                const convertido = await converterParaMp3(temp, destino);
                if (!convertido) fs.renameSync(temp, destino); // sem ffmpeg: manda o m4a mesmo
            }
            try { if (temp !== destino && fs.existsSync(temp)) fs.unlinkSync(temp); } catch {}

            return { bytes: fs.statSync(destino).size, titulo: null };
        } catch (erro) {
            ultimoErro = erro;
            try { if (temp !== destino && fs.existsSync(temp)) fs.unlinkSync(temp); } catch {}
            console.log(`🎵 [YTAPI] ⚠️ YouTube direto (${client}) falhou: ${motivoDoErro(erro)}`);
        }
    }
    throw ultimoErro || new Error('YouTube direto não conseguiu baixar.');
}

// =================================================
// ⬇️ BAIXA O ARQUIVO DO LINK E SALVA NO DISCO
// =================================================

async function baixarParaArquivo(url, destino, longo = false) {
    const resposta = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: longo ? TIMEOUT_ARQUIVO_LONGO : TIMEOUT_ARQUIVO,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        maxRedirects: 5,
        headers: { 'User-Agent': UA_MOBILE },
        validateStatus: s => s >= 200 && s < 300
    });

    const tipo = String(resposta.headers?.['content-type'] || '').toLowerCase();
    if (tipo.includes('text/html') || tipo.includes('application/json')) {
        throw new Error(`O link devolveu "${tipo}" em vez de mídia.`);
    }

    const buffer = Buffer.from(resposta.data);
    if (buffer.length < 10000) {
        throw new Error('O arquivo baixado veio vazio ou incompleto.');
    }

    fs.writeFileSync(destino, buffer);
    return buffer.length;
}

// =================================================
// 🍪 COOKIES (OPCIONAL) — só usa se existir um cookies.txt no projeto
// =================================================
// O bot funciona SEM cookies. Se houver um cookies.txt (ex.: o seu),
// o yt-dlp usa automaticamente pra passar por vídeo com login/idade.
function acharCookies() {
    const cands = [
        process.env.YT_COOKIES,
        path.join(process.cwd(), 'cookies.txt'),
        path.join(process.cwd(), 'src', 'ytapi', 'cookies.txt'),
        path.join(process.cwd(), 'bin', 'cookies.txt'),
        path.join(process.cwd(), 'youtube.txt'),
        path.join(__dirname, 'cookies.txt')
    ].filter(Boolean);
    for (const c of cands) {
        try { if (fs.existsSync(c) && fs.statSync(c).size > 0) return c; } catch {}
    }
    return null;
}

// =================================================
// 🧰 yt-dlp (robusto, cancelável) → baixa direto do YouTube
// =================================================
// Devolve { done, kill }: done resolve com { bytes, titulo }; kill mata o
// processo (usado quando outro provedor ganha a corrida).
function baixarComYtDlp(id, destino, tipo = 'audio') {
    let child = null;
    const done = (async () => {
        const bin = autoUpdate ? await autoUpdate.garantirYtDlp() : null;
        if (!bin) throw new Error('yt-dlp indisponível');
        const url = `https://www.youtube.com/watch?v=${id}`;
        const base = destino.replace(/\.(mp3|mp4|m4a|webm|opus)$/i, '');
        const outTmpl = `${base}.%(ext)s`;
        const cookies = acharCookies();
        const comum = ['--no-playlist', '--no-warnings', '--no-progress', '--quiet',
            '--retries', '5', '--fragment-retries', '5', '--socket-timeout', '30',
            '-o', outTmpl, url];
        if (cookies) comum.unshift('--cookies', cookies);
        const args = tipo === 'video'
            ? ['-f', 'bv*[height<=720]+ba/b[height<=720]/b', '--merge-output-format', 'mp4', ...comum]
            : ['-f', 'bestaudio/best', '-x', '--audio-format', 'mp3', '--audio-quality', '0', ...comum];

        await new Promise((resolve, reject) => {
            child = spawn(bin, args, { stdio: ['ignore', 'ignore', 'pipe'] });
            let err = '';
            child.stderr?.on('data', d => { err += d.toString(); if (err.length > 2000) err = err.slice(-2000); });
            child.on('error', reject);
            child.on('close', code => code === 0 ? resolve()
                : reject(new Error('yt-dlp código ' + code + (err ? ': ' + err.trim().split('\n').pop() : ''))));
        });

        const dir = path.dirname(base), pref = path.basename(base) + '.';
        const irmaos = fs.readdirSync(dir).filter(f => f.startsWith(pref));
        const finais = irmaos.filter(f => !f.endsWith('.part')).map(f => path.join(dir, f));
        if (!finais.length) throw new Error('yt-dlp não gerou arquivo');
        const gerado = finais.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)[0];
        const bytes = fs.statSync(gerado).size;
        if (bytes < 10000) { try { fs.unlinkSync(gerado); } catch {} throw new Error('arquivo yt-dlp veio vazio'); }
        if (gerado !== destino) { try { fs.renameSync(gerado, destino); } catch { fs.copyFileSync(gerado, destino); try { fs.unlinkSync(gerado); } catch {} } }
        for (const f of irmaos) { const p = path.join(dir, f); if (p !== destino) { try { fs.unlinkSync(p); } catch {} } }
        return { bytes, titulo: null };
    })();
    return { done, kill: () => { try { child && child.kill('SIGKILL'); } catch {} } };
}

// =================================================
// 🎯 FUNÇÃO PRINCIPAL — todos os métodos EM PARALELO (quem entrega primeiro, ganha)
// =================================================
// Sem tempo de espera entre métodos: Savetube, Vreden, YouTube direto
// (youtubei.js) e yt-dlp disputam ao mesmo tempo. O primeiro que terminar
// vence, os outros são cancelados. Nenhum provedor fica "em pausa".
//   → { arquivo, titulo, provedor }   (sucesso)
//   → lança Error só se TODOS falharem
async function baixarMidiaApi(videoUrlOuId, destinoSemExtensao, opcoes = {}) {
    const tipo = opcoes.tipo === 'video' ? 'video' : 'audio';
    const id = extrairIdYoutube(videoUrlOuId);
    if (!id) throw new Error('Link do YouTube inválido para a API.');

    const videoUrl = `https://www.youtube.com/watch?v=${id}`;
    const qualidade = escolherQualidade(opcoes.qualidade, tipo);
    const ext = tipo === 'video' ? 'mp4' : 'mp3';
    const destino = `${destinoSemExtensao}.${ext}`;

    // Prazo generoso só pra limpar pendências — a corrida devolve no 1º sucesso,
    // então o usuário NUNCA espera pelo mais lento.
    const prazo = opcoes.longo ? TIMEOUT_ARQUIVO_LONGO : 3 * 60000;

    const tmps = [];
    const canceladores = [];
    const tmpDe = (nome) => { const t = `${destinoSemExtensao}.${nome}.part.${ext}`; tmps.push(t); return t; };

    const corredores = [];

    // 1) yt-dlp (cancelável)
    corredores.push((async () => {
        const t = tmpDe('ytdlp');
        const h = baixarComYtDlp(id, t, tipo);
        canceladores.push(h.kill);
        await comPrazo(h.done, prazo, 'yt-dlp');
        return { arquivo: t, titulo: null, provedor: 'yt-dlp' };
    })());

    // 2) APIs de link (Savetube / Vreden) — cada uma corre sozinha
    for (const api of [{ nome: 'Savetube', obter: obterLinkSavetube }, { nome: 'Vreden', obter: obterLinkVreden }]) {
        corredores.push((async () => {
            const link = await comPrazo(api.obter(videoUrl, qualidade, tipo), opcoes.longo ? PRAZO_LINK_LONGO_MS : PRAZO_LINK_MS, api.nome);
            const t = tmpDe(api.nome);
            await comPrazo(baixarParaArquivo(link.url, t, !!opcoes.longo), prazo, api.nome);
            return { arquivo: t, titulo: link.titulo, provedor: api.nome };
        })());
    }

    // 3) YouTube direto (youtubei.js)
    corredores.push((async () => {
        const t = tmpDe('youtubei');
        const r = await comPrazo(baixarDiretoYoutube(id, t, tipo), prazo, 'YouTube direto');
        return { arquivo: t, titulo: r?.titulo || null, provedor: 'YouTube direto' };
    })());

    const limpar = () => {
        for (const k of canceladores) { try { k && k(); } catch {} }
        for (const t of tmps) { if (t !== destino) { try { if (fs.existsSync(t)) fs.unlinkSync(t); } catch {} } }
    };

    let vencedor;
    try {
        vencedor = await Promise.any(corredores);
    } catch (agg) {
        limpar();
        const motivos = (agg && agg.errors ? agg.errors : []).map(e => motivoDoErro(e)).filter(Boolean);
        const resumo = motivos.length ? [...new Set(motivos)].join(' | ') : 'todos os métodos falharam';
        throw new Error(`Não consegui baixar de nenhuma fonte (${resumo})`);
    }

    // move o arquivo vencedor pro destino final e cancela/limpa os perdedores
    try {
        if (vencedor.arquivo !== destino) {
            try { fs.renameSync(vencedor.arquivo, destino); }
            catch { fs.copyFileSync(vencedor.arquivo, destino); try { fs.unlinkSync(vencedor.arquivo); } catch {} }
        }
    } catch (e) {
        limpar();
        throw new Error('Baixei, mas não consegui salvar o arquivo: ' + (e?.message || e));
    }
    // cancela os outros corredores e apaga os temporários que sobraram
    for (const k of canceladores) { try { k && k(); } catch {} }
    for (const t of tmps) { if (t !== destino) { try { if (fs.existsSync(t)) fs.unlinkSync(t); } catch {} } }
    // os perdedores que ainda estão rodando não quebram nada: seus temporários
    // serão apagados por eles mesmos ou ignorados.
    corredores.forEach(p => p.catch(() => {}));

    console.log(`🎵 [YTAPI] ✅ ${vencedor.provedor} entregou primeiro.`);
    return { arquivo: destino, titulo: vencedor.titulo, provedor: vencedor.provedor };
}

const baixarAudioApi = (v, d, o = {}) => baixarMidiaApi(v, d, { ...o, tipo: 'audio' });
const baixarVideoApi = (v, d, o = {}) => baixarMidiaApi(v, d, { ...o, tipo: 'video' });

module.exports = { baixarAudioApi, baixarVideoApi, baixarMidiaApi, extrairIdYoutube };
