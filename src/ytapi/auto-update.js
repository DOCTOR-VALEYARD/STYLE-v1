/* =================================================
   🔄 AUTO-ATUALIZAÇÃO DO DOWNLOADER (yt-dlp)
   📁 src/ytapi/auto-update.js

   Garante que o yt-dlp esteja SEMPRE presente e atualizado, pra o YouTube
   nunca "quebrar" o download quando mudar alguma coisa do lado deles.

   🛡️ REGRA DE OURO: isto NUNCA pode derrubar o bot. Tudo é best-effort,
   embrulhado em try/catch. Se não der pra baixar/atualizar, o bot segue
   normal e os outros provedores (youtubei.js + APIs) cobrem.

   Como funciona:
     • Procura o yt-dlp em: ./bin/yt-dlp  →  yt-dlp do sistema (PATH).
     • Se não achar, baixa o binário standalone (não precisa de Python)
       da última release oficial do GitHub pra ./bin/yt-dlp.
     • De tempos em tempos (e no boot), roda o auto-update do próprio
       yt-dlp (-U). Se falhar, tenta rebaixar a última versão.
================================================= */
const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawn, spawnSync } = require('child_process');

const RAIZ = process.cwd();
const PASTA_BIN = path.join(RAIZ, 'bin');
const BIN_LOCAL = path.join(PASTA_BIN, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');

// Qual binário standalone baixar por plataforma (sem depender de Python)
function nomeReleaseBinario() {
    if (process.platform === 'win32') return 'yt-dlp.exe';
    if (process.platform === 'darwin') return 'yt-dlp_macos';
    // linux: usa o build standalone que não precisa de Python instalado
    return 'yt-dlp_linux';
}
const URL_RELEASE = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${nomeReleaseBinario()}`;

let _prontoPromise = null;      // promessa de "garantir yt-dlp" (cacheada)
let _caminhoResolvido = null;   // caminho que funciona, depois de testado
const INTERVALO_UPDATE_MS = 12 * 60 * 60 * 1000; // revisa atualização a cada 12h

// ── util: um binário responde a --version? ───────────────────────
function funciona(caminho) {
    try {
        const r = spawnSync(caminho, ['--version'], { timeout: 15000 });
        return r.status === 0 && String(r.stdout || '').trim().length > 0;
    } catch { return false; }
}

// ── acha um yt-dlp já disponível (local ou no PATH) ──────────────
function procurarExistente() {
    try { if (fs.existsSync(BIN_LOCAL) && funciona(BIN_LOCAL)) return BIN_LOCAL; } catch {}
    for (const nome of ['yt-dlp', 'yt-dlp_linux', 'youtube-dl']) {
        try { if (funciona(nome)) return nome; } catch {}
    }
    return null;
}

// ── baixa um arquivo seguindo redirecionamentos (GitHub → CDN) ───
function baixarArquivo(url, destino, saltos = 5) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { headers: { 'User-Agent': 'style-v1-downloader' } }, (res) => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && saltos > 0) {
                res.resume();
                return resolve(baixarArquivo(res.headers.location, destino, saltos - 1));
            }
            if (res.statusCode !== 200) { res.resume(); return reject(new Error(`HTTP ${res.statusCode}`)); }
            const tmp = destino + '.baixando';
            const ws = fs.createWriteStream(tmp);
            res.pipe(ws);
            ws.on('finish', () => ws.close(() => {
                try { fs.renameSync(tmp, destino); fs.chmodSync(destino, 0o755); resolve(destino); }
                catch (e) { reject(e); }
            }));
            ws.on('error', (e) => { try { fs.unlinkSync(tmp); } catch {} reject(e); });
        });
        req.on('error', reject);
        req.setTimeout(120000, () => req.destroy(new Error('timeout ao baixar yt-dlp')));
    });
}

// ── baixa a última versão do yt-dlp pra ./bin ────────────────────
async function baixarYtDlp() {
    try {
        if (!fs.existsSync(PASTA_BIN)) fs.mkdirSync(PASTA_BIN, { recursive: true });
        await baixarArquivo(URL_RELEASE, BIN_LOCAL);
        if (funciona(BIN_LOCAL)) { console.log('🔄 [yt-dlp] binário baixado/atualizado com sucesso.'); return BIN_LOCAL; }
        console.log('🔄 [yt-dlp] binário baixado não respondeu — ignorando.');
    } catch (e) {
        console.log('🔄 [yt-dlp] não consegui baixar o binário:', e?.message || e);
    }
    return null;
}

// ── GARANTE que exista um yt-dlp utilizável (cacheado) ───────────
function garantirYtDlp() {
    if (_caminhoResolvido) return Promise.resolve(_caminhoResolvido);
    if (_prontoPromise) return _prontoPromise;
    _prontoPromise = (async () => {
        let caminho = procurarExistente();
        if (!caminho) caminho = await baixarYtDlp();
        _caminhoResolvido = caminho; // pode ser null (aí yt-dlp fica indisponível, sem drama)
        return caminho;
    })().catch(() => { _caminhoResolvido = null; return null; });
    return _prontoPromise;
}

// ── atualiza em segundo plano (nunca trava nem derruba o boot) ───
function atualizarEmBackground() {
    setTimeout(async () => {
        try {
            const caminho = await garantirYtDlp();
            if (!caminho) { await baixarYtDlp(); return; }
            // tenta o auto-update nativo do yt-dlp; se falhar, rebaixa o binário
            const p = spawn(caminho, ['-U'], { stdio: 'ignore' });
            p.on('error', () => { baixarYtDlp().catch(() => {}); });
            p.on('close', (code) => { if (code !== 0) baixarYtDlp().catch(() => {}); });
        } catch { /* nunca propaga */ }
    }, 4000); // espera o boot assentar antes de mexer
}

// agenda revisões periódicas de atualização (fail-safe)
function iniciarRotinaUpdate() {
    try {
        atualizarEmBackground();
        setInterval(atualizarEmBackground, INTERVALO_UPDATE_MS).unref?.();
    } catch { /* ignora */ }
}

function caminhoAtual() { return _caminhoResolvido; }

module.exports = { garantirYtDlp, iniciarRotinaUpdate, atualizarEmBackground, caminhoAtual, BIN_LOCAL };
