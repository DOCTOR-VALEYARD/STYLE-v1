/* =================================================
   🎨 STYLE-v1 — CRIAR IMAGEM COM IA
   📁 Arquivo: imagem-ia.js

   Uso:  !imagem um gato astronauta roxo      (também: !arte, !criararte, !criarimagem, !img-ia)
         !imagem anime um gato astronauta     ← o 1º palavra pode ser um ESTILO
         !imagem estilos                      ← lista os estilos
   Responda uma mensagem de texto com !imagem para usar o texto dela.

   Fonte principal: Pollinations (grátis, sem chave).
   Segunda opção:   Gemini — só se você preencher GEMINI_API_KEY no config.js
                    (precisa de faturamento ativo; no plano grátis a imagem vem com cota 0).
================================================= */
const config = require("../../config");

const ESPERA_SEG = 20;          // tempo mínimo entre imagens da mesma pessoa
const LIMITE_TEXTO = 400;
const ultimo = new Map();       // número -> timestamp

// 🎨 ESTILOS: a 1ª palavra do pedido pode ser um destes. O resto é a descrição que a pessoa escreve.
const ESTILOS = {
    anime:      "anime style, detailed illustration, vibrant colors, studio quality",
    realista:   "photorealistic, ultra detailed, natural lighting, 8k photo",
    "3d":       "3d render, pixar style, soft lighting, high detail",
    pixel:      "pixel art, 16-bit retro game style",
    desenho:    "hand drawn illustration, clean line art, colorful",
    aquarela:   "watercolor painting, soft brush strokes, pastel colors",
    cyberpunk:  "cyberpunk, neon lights, futuristic city, dark atmosphere",
    sombrio:    "dark fantasy, gothic, moody lighting, dramatic shadows, highly detailed",
    neon:       "neon glow, vivid purple and pink lights, dark background, digital art",
    cartoon:    "cartoon style, bold outlines, bright colors, funny",
    pintura:    "oil painting, classical art, rich textures",
    logo:       "minimal logo design, vector, flat, clean, centered on plain background"
};
const semAcento = t => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const msgErro = t => `❌ *NÃO CONSEGUI CRIAR!*\n\n${t}`;

async function viaPollinations(prompt) {
    const seed = Math.floor(Math.random() * 1e9);
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${seed}`;
    const r = await fetch(url, { signal: AbortSignal.timeout(90000) });
    if (!r.ok) throw new Error("Pollinations " + r.status);
    const tipo = String(r.headers.get("content-type") || "");
    if (!/^image\//i.test(tipo)) throw new Error("Pollinations não devolveu imagem");
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 5000) throw new Error("imagem vazia");
    return buf;
}

async function viaGemini(prompt) {
    const chave = String(config.GEMINI_API_KEY || process.env.GEMINI_API_KEY || "").trim();
    if (!chave) throw new Error("sem chave Gemini");
    const modelo = String(config.GEMINI_MODELO_IMAGEM || "gemini-2.5-flash-image");
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${chave}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: AbortSignal.timeout(90000)
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error("Gemini " + r.status);
    const p = (j.candidates?.[0]?.content?.parts || []).find(x => x.inlineData);
    if (!p) throw new Error("Gemini sem imagem");
    return Buffer.from(p.inlineData.data, "base64");
}

async function criarImagem(sock, msg, args) {
    const from = msg.key.remoteJid;
    const quem = (msg.key.participant || msg.key.remoteJid || "").split("@")[0].split(":")[0];

    let lista = (args || []).filter(Boolean);
    if (lista.length && semAcento(lista[0]) === "estilos") {
        return sock.sendMessage(from, {
            text: `🎨 *ESTILOS DE IMAGEM*\n\n${Object.keys(ESTILOS).map(e => "• " + e).join("\n")}\n\nExemplo:\n*${config.PREFIX}imagem anime um gato astronauta*\n\nSem estilo também vale: descreva do seu jeito.`
        }, { quoted: msg });
    }
    let estilo = "";
    if (lista.length > 1 && ESTILOS[semAcento(lista[0])]) { estilo = semAcento(lista[0]); lista = lista.slice(1); }
    let texto = lista.join(" ").trim();
    if (!texto) {
        const q = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        texto = (q?.conversation || q?.extendedTextMessage?.text || "").trim();
    }
    if (!texto) {
        return sock.sendMessage(from, {
            text: `🎨 *CRIAR IMAGEM COM IA*\n\nDescreva a arte que você quer ver:\n*${config.PREFIX}imagem um gato astronauta roxo com raios neon*\n\nCom estilo:\n*${config.PREFIX}imagem anime um gato astronauta*\n(veja os estilos com *${config.PREFIX}imagem estilos*)\n\nOu responda uma mensagem de texto com *${config.PREFIX}imagem*.`
        }, { quoted: msg });
    }
    texto = texto.slice(0, LIMITE_TEXTO);
    const pedido = estilo ? `${texto}, ${ESTILOS[estilo]}` : texto;

    const agora = Date.now();
    const falta = Math.ceil((ESPERA_SEG * 1000 - (agora - (ultimo.get(quem) || 0))) / 1000);
    if (falta > 0) return sock.sendMessage(from, { text: `⏳ Calma! Espere *${falta}s* para criar outra imagem.` }, { quoted: msg });
    ultimo.set(quem, agora);

    await sock.sendMessage(from, { text: "🎨 Criando sua imagem… pode levar alguns segundos." }, { quoted: msg });

    let buffer = null, erro1 = null;
    try { buffer = await viaPollinations(pedido); }
    catch (e) {
        erro1 = e;
        try { buffer = await viaGemini(pedido); } catch { /* sem segunda opção */ }
    }
    if (!buffer) {
        ultimo.delete(quem);
        console.error("❌ imagem-ia:", erro1?.message || erro1);
        return sock.sendMessage(from, { text: msgErro("O serviço de imagem está fora do ar ou ocupado agora.\nTente de novo em instantes.") }, { quoted: msg });
    }
    return sock.sendMessage(from, { image: buffer, caption: `🎨 *${texto.slice(0, 150)}*` }, { quoted: msg });
}

module.exports = { criarImagem };
