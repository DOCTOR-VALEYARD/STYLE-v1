/* =================================================
   🔞 STYLE-v1 — ANTI-NSFW / ANTI-NUDES (SEM IA, SEM API)
   📁 Arquivo: antinsfw.js

   Liga/desliga por grupo:  !antinsfw   ou   !antinudes
   (os dois fazem a MESMA coisa — basta um deles ligado no grupo)

   Como funciona: o bot aprende com EXEMPLOS.
     🛡️ Um ADM (ou o dono) responde a figurinha/foto/vídeo proibido com
        !bloquearfig  → o bot guarda a "impressão digital" dela
        (só um código, NÃO guarda a imagem) e apaga a mensagem.
     🚨 Daí pra frente, em QUALQUER grupo com o anti ligado, se alguém
        mandar a mesma figurinha/foto/vídeo (mesmo reencaminhada ou
        repostada), o bot apaga na hora e remove quem mandou.

   Outros comandos (ADM/dono):
     !desbloquearfig  (respondendo)  → tira da lista
     !figbloqueadas                  → quantas estão na lista

   Não usa memória extra nem internet: é só comparar códigos.
================================================= */

const fs = require("fs");
const path = require("path");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const config = require("../../config");
const { getDB, saveDB } = require("../grupo-db/grupo-db");

// ─────────────────────────────────────────────
// 📂 LISTA DE BLOQUEADAS (vale pra todos os grupos)
// ─────────────────────────────────────────────
const LISTA_PATH = path.join(__dirname, "../../database/nsfw-bloqueadas.json");

function lerLista() {
    try {
        const d = JSON.parse(fs.readFileSync(LISTA_PATH, "utf8"));
        return { exatas: d.exatas || {}, parecidas: Array.isArray(d.parecidas) ? d.parecidas : [] };
    } catch { return { exatas: {}, parecidas: [] }; }
}
function salvarLista(l) {
    try { fs.mkdirSync(path.dirname(LISTA_PATH), { recursive: true }); fs.writeFileSync(LISTA_PATH, JSON.stringify(l, null, 2)); }
    catch (e) { console.error("❌ Anti-NSFW: não salvei a lista:", e?.message || e); }
}

// quão parecida a imagem precisa ser pra contar como a mesma (0 = idêntica)
const DISTANCIA_MAX = 6;

// ─────────────────────────────────────────────
// 🔑 IMPRESSÕES DIGITAIS
//   exata    → o código do arquivo que o WhatsApp já manda (fileSha256)
//   parecida → um "resumo" de 64 bits da imagem (pega a mesma figurinha
//              recomprimida/reenviada por outro app)
// ─────────────────────────────────────────────
function shaExato(no) {
    const s = no?.fileSha256;
    if (!s || !s.length) return null;
    try { return (typeof s === "string" ? Buffer.from(s, "base64") : Buffer.from(s)).toString("hex"); } catch { return null; }
}

async function baixar(no, tipo) {
    const stream = await downloadContentFromMessage(no, tipo);
    const partes = [];
    for await (const p of stream) partes.push(p);
    return Buffer.concat(partes);
}

// dHash 9x8 → 64 bits em hexadecimal
async function resumoDaImagem(buffer) {
    const { createCanvas, loadImage } = require("@napi-rs/canvas");
    const img = await loadImage(buffer);
    const cv = createCanvas(9, 8), ctx = cv.getContext("2d");
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, 9, 8);
    ctx.drawImage(img, 0, 0, 9, 8);
    const d = ctx.getImageData(0, 0, 9, 8).data;
    const cinza = (x, y) => { const i = (y * 9 + x) * 4; return d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114; };
    let bits = "";
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += cinza(x, y) > cinza(x + 1, y) ? "1" : "0";
    return BigInt("0b" + bits).toString(16).padStart(16, "0");
}

function distancia(a, b) {
    let x = BigInt("0x" + a) ^ BigInt("0x" + b), n = 0;
    while (x) { n += Number(x & 1n); x >>= 1n; }
    return n;
}

// ─────────────────────────────────────────────
// 📦 TIRA OS "ENVELOPES" (temporária, visualização única...)
// ─────────────────────────────────────────────
function desembrulhar(m) {
    for (let i = 0; i < 6 && m; i++) {
        if (m.ephemeralMessage?.message) { m = m.ephemeralMessage.message; continue; }
        if (m.viewOnceMessageV2Extension?.message) { m = m.viewOnceMessageV2Extension.message; continue; }
        if (m.viewOnceMessageV2?.message) { m = m.viewOnceMessageV2.message; continue; }
        if (m.viewOnceMessage?.message) { m = m.viewOnceMessage.message; continue; }
        if (m.documentWithCaptionMessage?.message) { m = m.documentWithCaptionMessage.message; continue; }
        break;
    }
    return m;
}

function midiaDaMensagem(m) {
    m = desembrulhar(m);
    if (m?.stickerMessage) return { no: m.stickerMessage, tipo: "figurinha", download: "sticker" };
    if (m?.imageMessage) return { no: m.imageMessage, tipo: "foto", download: "image" };
    if (m?.videoMessage) return { no: m.videoMessage, tipo: m.videoMessage.gifPlayback ? "gif" : "video", download: "video" };
    if (m?.documentMessage && /^(image|video)\//.test(m.documentMessage.mimetype || ""))
        return { no: m.documentMessage, tipo: m.documentMessage.mimetype.startsWith("video") ? "video" : "foto", download: "document" };
    return null;
}

// Confere se a mídia está na lista
async function estaBloqueada(midia) {
    const lista = lerLista();
    const sha = shaExato(midia.no);
    if (sha && lista.exatas[sha]) return true;
    // comparação "parecida" só pra figurinha/foto (vídeo vai só pelo código exato)
    if (!lista.parecidas.length || !["figurinha", "foto"].includes(midia.tipo)) return false;
    try {
        const resumo = await resumoDaImagem(await baixar(midia.no, midia.download));
        return lista.parecidas.some(r => distancia(r, resumo) <= DISTANCIA_MAX);
    } catch { return false; }
}

// ─────────────────────────────────────────────
// 🔌 LIGA/DESLIGA (!antinsfw)
// ─────────────────────────────────────────────
function gerenciarAntiNSFW(chatId) {
    const db = getDB();
    if (!db[chatId]) db[chatId] = {};
    const novoEstado = !db[chatId].antinsfw;
    db[chatId].antinsfw = novoEstado;
    saveDB(db);
    const total = Object.keys(lerLista().exatas).length;
    const P = config.PREFIX;
    return novoEstado
        ? `🔞 *ANTI-NSFW ATIVADO*\n\nToda figurinha, foto, vídeo ou GIF que estiver na lista de proibidas será *apagado* e quem mandou será *removido*.\n\n🛡️ Pra ensinar o bot: responda a mídia proibida com *${P}bloquearfig*\n📋 Na lista agora: *${total}*`
        : `❌ *ANTI-NSFW DESATIVADO*\n\nAs mídias não serão mais conferidas aqui.`;
}

// ─────────────────────────────────────────────
// 🛡️ !bloquearfig / !desbloquearfig / !figbloqueadas
// ─────────────────────────────────────────────
async function comandoListaNSFW(sock, msg, command) {
    const from = msg.key.remoteJid;
    const P = config.PREFIX;
    if (command === "figbloqueadas") {
        const l = lerLista();
        return sock.sendMessage(from, { text: `🔞 *LISTA DE PROIBIDAS*\n\n📋 Mídias bloqueadas: *${Object.keys(l.exatas).length}*\n\n➕ ${P}bloquearfig (respondendo a mídia)\n➖ ${P}desbloquearfig (respondendo a mídia)` }, { quoted: msg });
    }

    const ctx = desembrulhar(msg.message)?.extendedTextMessage?.contextInfo;
    const citada = ctx?.quotedMessage ? midiaDaMensagem(ctx.quotedMessage) : null;
    if (!citada) {
        return sock.sendMessage(from, { text: `↩️ Responda a *figurinha, foto, vídeo ou GIF* com *${P}${command}*.` }, { quoted: msg });
    }
    const sha = shaExato(citada.no);
    let resumo = null;
    if (["figurinha", "foto"].includes(citada.tipo)) {
        try { resumo = await resumoDaImagem(await baixar(citada.no, citada.download)); } catch {}
    }
    if (!sha && !resumo) return sock.sendMessage(from, { text: "❌ Não consegui ler essa mídia. Tenta responder ela de novo." }, { quoted: msg });

    const l = lerLista();
    if (command === "desbloquearfig") {
        if (sha) delete l.exatas[sha];
        if (resumo) {
            delete l.exatas["resumo_" + resumo];
            l.parecidas = l.parecidas.filter(r => distancia(r, resumo) > DISTANCIA_MAX);
        }
        salvarLista(l);
        return sock.sendMessage(from, { text: `✅ ${citada.tipo === "figurinha" ? "Figurinha" : "Mídia"} tirada da lista de proibidas.` }, { quoted: msg });
    }

    // bloquearfig
    const chave = sha || "resumo_" + resumo;
    l.exatas[chave] = { tipo: citada.tipo, em: new Date().toISOString() };
    if (resumo && !l.parecidas.some(r => distancia(r, resumo) <= 1)) l.parecidas.push(resumo);
    salvarLista(l);

    // apaga a mídia original que foi respondida
    if (ctx.stanzaId) {
        try { await sock.sendMessage(from, { delete: { remoteJid: from, id: ctx.stanzaId, participant: ctx.participant, fromMe: false } }); } catch {}
    }
    return sock.sendMessage(from, { text: `🔞 *BLOQUEADA!*\n\nEssa ${citada.tipo} entrou na lista de proibidas (total: *${Object.keys(l.exatas).length}*).\nSe alguém mandar ela de novo num grupo com *${P}antinsfw* ligado, eu apago e removo.` }, { quoted: msg });
}

// ─────────────────────────────────────────────
// 🚨 TODA MENSAGEM DE GRUPO (chamado no style-v1.js)
// Vale pro !antinsfw E pro !antinudes. Retorna true se apagou.
// ─────────────────────────────────────────────
const NOMES = { figurinha: "uma *figurinha* proibida", foto: "uma *foto* proibida", video: "um *vídeo* proibido", gif: "um *GIF* proibido" };

// ===================================================================
// 🤖 DETECÇÃO AUTOMÁTICA DE NUDEZ (IA nsfwjs) — roda DENTRO do bot.
// Carga preguiçosa (só carrega quando precisa), isolada e à prova de
// erro: se a biblioteca não instalar ou o modelo não baixar, a proteção
// fica inativa e o bot segue 100% normal (não quebra nada).
// ===================================================================
let _tf = null, _modelo = null, _modeloPromise = null, _iaQuebrada = false;
const LIMIAR = Number(config.NSFW?.LIMIAR ?? 0.62);       // Porn/Hentai acima disso = bloqueia
const LIMIAR_SEXY = Number(config.NSFW?.LIMIAR_SEXY ?? 0.85); // "Sexy" é mais leve, exige mais certeza

async function carregarIA() {
    if (_modelo) return _modelo;
    if (_iaQuebrada) return null;
    if (_modeloPromise) return _modeloPromise;
    _modeloPromise = (async () => {
        try {
            _tf = require("@tensorflow/tfjs");
            const nsfw = require("nsfwjs");
            const url = config.NSFW?.MODELO_URL;
            console.log("⬇️ Anti-nudes: carregando o modelo de IA (só na 1ª vez)...");
            _modelo = url ? await nsfw.load(url, { size: 224 }) : await nsfw.load();
            console.log("✅ Anti-nudes (IA) pronto.");
            return _modelo;
        } catch (e) {
            _iaQuebrada = true;
            console.error("❌ Anti-nudes (IA) não carregou:", e?.message || e);
            console.error("   A proteção automática fica inativa, mas o bot segue normal.");
            return null;
        }
    })();
    return _modeloPromise;
}

async function bufferParaTensor(buffer) {
    const { createCanvas, loadImage } = require("@napi-rs/canvas");
    const img = await loadImage(buffer);
    const L = 224;
    const cv = createCanvas(L, L), ctx = cv.getContext("2d");
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, L, L);
    ctx.drawImage(img, 0, 0, L, L);
    const d = ctx.getImageData(0, 0, L, L).data; // RGBA
    const rgb = new Int32Array(L * L * 3);
    for (let i = 0, j = 0; i < d.length; i += 4, j += 3) { rgb[j] = d[i]; rgb[j + 1] = d[i + 1]; rgb[j + 2] = d[i + 2]; }
    return _tf.tensor3d(rgb, [L, L, 3], "int32");
}

// Vídeo/GIF: tira 1 quadro com o ffmpeg (que o bot já usa) pra analisar.
async function quadroDeVideo(buffer) {
    const os = require("os"), fs2 = require("fs"), path2 = require("path");
    const { exec } = require("child_process");
    const base = path2.join(os.tmpdir(), `nsfw_${Date.now()}_${Math.floor(Math.random() * 1e6)}`);
    const inp = base + ".bin", out = base + ".jpg";
    try { fs2.writeFileSync(inp, buffer); } catch { return null; }
    await new Promise((res) => exec(`ffmpeg -y -loglevel error -i "${inp}" -frames:v 1 -q:v 3 "${out}"`, () => res()));
    let b = null; try { b = fs2.readFileSync(out); } catch {}
    try { fs2.unlinkSync(inp); } catch {}
    try { fs2.unlinkSync(out); } catch {}
    return b;
}

async function detectarNudez(buffer, tipo) {
    try {
        const modelo = await carregarIA();
        if (!modelo) return false;
        let imgBuffer = buffer;
        if (tipo === "video" || tipo === "gif") {
            imgBuffer = await quadroDeVideo(buffer);
            if (!imgBuffer) return false;
        }
        const t = await bufferParaTensor(imgBuffer);
        let preds;
        try { preds = await modelo.classify(t); } finally { try { t.dispose(); } catch {} }
        const p = {}; for (const x of preds) p[x.className] = x.probability;
        const porn = p.Porn || 0, hentai = p.Hentai || 0, sexy = p.Sexy || 0;
        const bloqueia = porn >= LIMIAR || hentai >= LIMIAR || sexy >= LIMIAR_SEXY;
        if (bloqueia) console.log(`🔞 IA detectou nudez (porn ${porn.toFixed(2)} / hentai ${hentai.toFixed(2)} / sexy ${sexy.toFixed(2)})`);
        return bloqueia;
    } catch (e) {
        console.error("⚠️ Anti-nudes: falha ao analisar a mídia:", e?.message || e);
        return false;
    }
}

async function processarMidiaNSFW(sock, msg) {
    const from = msg?.key?.remoteJid;
    if (!from?.endsWith("@g.us") || msg.key.fromMe) return false;
    const g = getDB()[from];
    if (!g?.antinsfw && !g?.antinudes) return false;
    const midia = midiaDaMensagem(msg.message);
    if (!midia) return false;

    // 1) Lista manual (bloquearfig) — continua valendo como camada extra.
    if (await estaBloqueada(midia).catch(() => false)) {
        console.log(`🔞 Anti-NSFW: ${midia.tipo} da lista de proibidas em ${from}`);
        await punir(sock, msg, NOMES[midia.tipo] || "uma *mídia* proibida");
        return true;
    }

    // 2) 🤖 DETECÇÃO AUTOMÁTICA (IA) — foto, figurinha, vídeo e GIF.
    if (["foto", "figurinha", "video", "gif"].includes(midia.tipo)) {
        let buffer = null;
        try { buffer = await baixar(midia.no, midia.download); } catch {}
        if (buffer && await detectarNudez(buffer, midia.tipo)) {
            await punir(sock, msg, NOMES[midia.tipo] || "conteúdo adulto");
            return true;
        }
    }
    return false;
}

async function punir(sock, msg, oQue) {
    const from = msg.key.remoteJid;
    const autor = msg.key.participant;
    const exibir = msg.key.participantAlt || autor;
    const numero = String(exibir).split("@")[0].split(":")[0];

    try { await sock.sendMessage(from, { delete: msg.key }); } catch {}

    let removido = false, motivoFicou = "";
    try {
        const { isAdmin, isBotAdmin } = require("../grupo/grupo");
        const { ehDono } = require("../utils-validacao/utils-validacao");
        const ehDoDono = ehDono([autor, msg.key.participantAlt], config.OWNER_NUMBER);
        const ehAdm = !ehDoDono && await isAdmin(sock, from, autor).catch(() => false);
        const souAdm = await isBotAdmin(sock, from).catch(() => false);
        if (ehDoDono || ehAdm) motivoFicou = "é ADM/dono, então só apaguei";
        else if (!souAdm) motivoFicou = "não sou ADM, então não consigo remover";
        else { await sock.groupParticipantsUpdate(from, [autor], "remove"); removido = true; }
    } catch (e) {
        motivoFicou = "o WhatsApp não deixou remover";
    }

    await sock.sendMessage(from, {
        text: `〔 🔞 ᴄᴏɴᴛᴇᴜ́ᴅᴏ ᴘʀᴏɪʙɪᴅᴏ 〕\n\n🗑️ Apaguei ${oQue} de @${numero}.\n${removido ? "👢 Usuário *removido* do grupo." : `⚠️ Não removi: ${motivoFicou}.`}\n\n🚫 Conteúdo adulto é proibido aqui.\n\n🌀 ${config.BOT_NAME}`,
        mentions: [exibir]
    }).catch(() => {});
}

// Compatibilidade com quem ainda chama as funções antigas
async function processarFigurinhaNSFW(sock, msg) { return processarMidiaNSFW(sock, msg); }
async function ehConteudoImproprio() { return false; }
function carregarModelo() { return Promise.resolve(true); }

module.exports = {
    gerenciarAntiNSFW,
    comandoListaNSFW,
    processarFigurinhaNSFW,
    processarMidiaNSFW,
    ehConteudoImproprio,
    carregarModelo,
};
