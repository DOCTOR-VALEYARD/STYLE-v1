/* =================================================
   🌀 STYLE-v1 — NÚCLEO TEMPORAL DE RESPOSTA (auto-resposta de TEXTO)
   📁 Arquivo: style-auto.js

   O coração conversacional do STYLE-v1. Lê cada mensagem do grupo, entende
   a INTENÇÃO (mesmo com abreviação, gíria da geração Z, erro de digitação,
   letra repetida e sem acento) e devolve uma frase curta no tom da Rose
   Tyler — inteligente, corajosa, espontânea, com aquele toque de deboche.

   Dois sistemas INDEPENDENTES, cada um com seu interruptor:
     ☀️ SAUDAÇÃO  → responde bom dia / oi / obrigado / elogio / risada /
        despedida / curiosidade. Interruptor:  <prefixo>saudacao
        (guardado em getDB()[grupo].styleSaudacao — ausente = LIGADO)
     🤬 PALAVRÃO  → quando alguém xinga (palavra OU abreviação: vsf, pqp,
        krl, fdp...), devolve uma alfinetada estilo Rose Tyler — SEM repetir
        o palavrão. Vem LIGADO por padrão.  Interruptor: <prefixo>palavrao
        (guardado em getDB()[grupo].stylePalavrao — ausente = LIGADO)

   NÃO usa áudio. Tudo é texto, e sai em letrinha pequena pelo estilo-texto.
   A detecção vem de  style-variacoes.js  e as respostas do MOTOR
   COMBINATÓRIO  style-mensagens.js  (centenas de milhares de combinações,
   com anti-repetição).
================================================= */
const { getDB, saveDB } = require("../grupo-db/grupo-db");
const { detectar } = require("../style-variacoes/style-variacoes");
const { responder } = require("../style-mensagens/style-mensagens");

// Categorias que contam como "saudação/conversa" (vão pelo toggle styleSaudacao)
const CATS_SAUDACAO = new Set([
    "bom_dia", "boa_tarde", "boa_noite", "oi", "tudo_bem",
    "tchau", "obrigado", "elogio", "risada", "provocacao", "curiosidade"
]);

// ─────────────────────────────────────────────
// 🔛 interruptores (ausente = ligado por padrão)
// ─────────────────────────────────────────────
function saudacaoLigada(from) {
    const g = getDB()[from] || {};
    // Alinhado ao comando  <prefixo>saudacao  (desligado por padrão; o
    // administrador ativa). styleSaudacao é um apelido alternativo opcional.
    if (g.styleSaudacao === true) return true;
    return g.saudacao === true;
}
function palavraoLigado(from) {
    const g = getDB()[from] || {};
    return g.stylePalavrao !== false;
}

// ─────────────────────────────────────────────
// 🧠 PROCESSADOR — chamado no fluxo de mensagem (não-comando)
//   Retorna:
//     "curse" → devolveu a alfinetada de palavrão (handler deve PARAR aqui)
//     "greet" → respondeu uma saudação/frase
//     null    → não fez nada
// ─────────────────────────────────────────────
async function processarStyleAuto(sock, msg, body) {
    try {
        const from = msg?.key?.remoteJid;
        if (!from) return null;
        const texto = String(body || "");
        if (!texto.trim()) return null;

        const autor = msg.key.participant || msg.key.participantAlt || from;
        const categoria = detectar(texto);
        if (!categoria) return null;

        // 🤬 PALAVRÃO → alfinetada Rose Tyler, marcando a pessoa (prioridade máxima)
        if (categoria === "palavrao") {
            if (!palavraoLigado(from)) return null;
            await sock.sendMessage(from, {
                text: `@${String(autor).split("@")[0].split(":")[0]} ${responder("palavrao")}`,
                mentions: [autor]
            }, { quoted: msg });
            return "curse";
        }

        // ☀️ SAUDAÇÃO / CONVERSA
        if (CATS_SAUDACAO.has(categoria)) {
            if (!saudacaoLigada(from)) return null;

            // "oi/salve" genérico só responde em mensagem CURTA (não corta um textão)
            if (categoria === "oi") {
                const palavras = texto.trim().split(/\s+/).length;
                if (palavras > 4) return null;
            }

            await sock.sendMessage(from, { text: responder(categoria) }, { quoted: msg });
            return "greet";
        }

        return null;
    } catch (e) {
        console.error("style-auto:", e?.message || e);
        return null;
    }
}

// ⚙️ Liga/desliga SAUDAÇÃO (comando <prefixo>saudacao)
async function toggleSaudacao(sock, msg) {
    const from = msg.key.remoteJid;
    const db = getDB(); db[from] ||= {};
    const ligadoAgora = db[from].styleSaudacao !== false;
    db[from].styleSaudacao = !ligadoAgora;
    saveDB(db);
    const resp = db[from].styleSaudacao
        ? `🌀 *SAUDAÇÕES TEMPORAIS: ONLINE*\n\nA TARDIS voltou a responder as mensagens do grupo — bom dia, oi, agradecimento, elogio e companhia. Cada resposta é única. 💫`
        : `⏳ *SAUDAÇÕES TEMPORAIS: EM PAUSA*\n\nParei de responder as mensagens de texto do grupo. É só me reativar quando quiser. 🛸`;
    await sock.sendMessage(from, { text: resp }, { quoted: msg });
}

// ⚙️ Liga/desliga PALAVRÃO (comando <prefixo>palavrao) — vem ligado por padrão
async function togglePalavrao(sock, msg) {
    const from = msg.key.remoteJid;
    const db = getDB(); db[from] ||= {};
    const ligadoAgora = db[from].stylePalavrao !== false;
    db[from].stylePalavrao = !ligadoAgora;
    saveDB(db);
    const resp = db[from].stylePalavrao
        ? `⚡ *PROTOCOLO DE RÉPLICA: ATIVO*\n\nSe alguém vier com palavrão, eu devolvo na mesma moeda — com classe e sem baixar o nível. 😏`
        : `🔮 *PROTOCOLO DE RÉPLICA: DESATIVADO*\n\nNão vou mais alfinetar quem xinga. Paz nas linhas temporais. 🌌`;
    await sock.sendMessage(from, { text: resp }, { quoted: msg });
}

// detector de palavrão exposto (compat com quem importava temPalavrao)
function temPalavrao(txt) { return detectar(txt) === "palavrao"; }

module.exports = {
    processarStyleAuto,
    toggleSaudacao,
    togglePalavrao,
    temPalavrao
};
