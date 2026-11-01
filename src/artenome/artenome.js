/* =================================================
   🎨 ARTE COM NOME NA IMAGEM — 100% CANVAS, SEM IA
   - !artenome [estilo] Nome     → escreve o nome na parte de BAIXO da foto (imagem parada)
   - !artenomegif [estilo] Nome  → mesma arte animada (o brilho desliza pelo texto)

   Exemplos:  !artenome Doctor Valeyard            (estilo dourado, o padrão)
              !artenome neon Doctor Valeyard
              !artenome estilos                    (mostra todos os estilos)
   ================================================= */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const config = require('../../config');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const { carregarImagemComDiagnostico } = require('../cardGenerator/cardGenerator');

// 🔤 Fonte própria do bot (hospedagem quase nunca tem fonte instalada)
const FAMILIA_ARTE = "MK Arte Nome";
(function registrarFonteArte() {
    const candidatos = [
        path.join(__dirname, '../midias/assets/fonts/Poppins-Bold.ttf'),
        path.join(__dirname, '../midias/assets/fonts/LiberationSerif-Bold.ttf')
    ];
    for (const arq of candidatos) {
        try { if (fs.existsSync(arq) && GlobalFonts.registerFromPath(arq, FAMILIA_ARTE)) return; } catch {}
    }
})();
const FONTE = (px) => `bold ${px}px "${FAMILIA_ARTE}", sans-serif`;

// 🎨 ESTILOS — cores do brilho, contorno e (opcional) luz em volta das letras
const ESTILOS = {
    dourado:  { nome: "Dourado",   cores: ['#ff9d00', '#fff6c8', '#ffd700'],                       contorno: '#000000' },
    neon:     { nome: "Neon",      cores: ['#00f0ff', '#ffffff', '#ff00e5'],                       contorno: '#12002e', luz: '#00f0ff' },
    fogo:     { nome: "Fogo",      cores: ['#ff1a00', '#ff9d00', '#fff200'],                       contorno: '#2a0000', luz: '#ff5a00' },
    gelo:     { nome: "Gelo",      cores: ['#7fd8ff', '#ffffff', '#4db8ff'],                       contorno: '#002a4d', luz: '#9be4ff' },
    rosa:     { nome: "Rosa",      cores: ['#ff4fd8', '#ffffff', '#ff9bdc'],                       contorno: '#3d0033' },
    verde:    { nome: "Verde",     cores: ['#00ff6a', '#eaffea', '#00c853'],                       contorno: '#00240e', luz: '#00ff6a' },
    sangue:   { nome: "Sangue",    cores: ['#7a0000', '#ff1a1a', '#5c0000'],                       contorno: '#000000', luz: '#ff0000' },
    branco:   { nome: "Branco",    cores: ['#ffffff', '#d9d9d9', '#ffffff'],                       contorno: '#000000' },
    arcoiris: { nome: "Arco-íris", cores: ['#ff0000', '#ffe600', '#00e676', '#00e5ff', '#d500f9'], contorno: '#000000' },
    cromado:  { nome: "Cromado",   cores: ['#8a97a6', '#ffffff', '#566170'],                       contorno: '#000000' },
    roxo:     { nome: "Roxo",      cores: ['#8b3dff', '#f3e8ff', '#ff3fb4'],                       contorno: '#12002e', luz: '#8b3dff' },
    azul:     { nome: "Azul",      cores: ['#1e6bff', '#d6e6ff', '#00b4ff'],                       contorno: '#00122e', luz: '#2a7bff' },
    vermelho: { nome: "Vermelho",  cores: ['#ff1f1f', '#ffd0d0', '#c20000'],                       contorno: '#2a0000' },
    laranja:  { nome: "Laranja",   cores: ['#ff6a00', '#ffe0b8', '#ff9d00'],                       contorno: '#2e1200' },
    amarelo:  { nome: "Amarelo",   cores: ['#ffe600', '#ffffff', '#ffc400'],                       contorno: '#2e2600' },
    ciano:    { nome: "Ciano",     cores: ['#00e5ff', '#e0ffff', '#00b8d4'],                       contorno: '#00222e', luz: '#00e5ff' },
    lilas:    { nome: "Lilás",     cores: ['#c77dff', '#ffffff', '#e0aaff'],                       contorno: '#240046' },
    preto:    { nome: "Preto",     cores: ['#0d0d0d', '#4a4a4a', '#0d0d0d'],                       contorno: '#ffffff' },
    galaxia:  { nome: "Galáxia",   cores: ['#4361ee', '#b5179e', '#7209b7', '#4cc9f0'],            contorno: '#0b0030', luz: '#7209b7' },
    poente:   { nome: "Pôr do sol",cores: ['#ff7b00', '#ff2e93', '#7b2cbf'],                       contorno: '#1a0033' },
    matrix:   { nome: "Matrix",    cores: ['#00ff41', '#b8ffcb', '#008f11'],                       contorno: '#001a05', luz: '#00ff41' },
    glitch:   { nome: "Glitch",    cores: ['#00ffff', '#ffffff', '#ff00ff'],                       contorno: '#000000', luz: '#ff00ff' },
    brasil:   { nome: "Brasil",    cores: ['#00a859', '#ffdf00', '#0033a0'],                       contorno: '#001a0d' },
    vampiro:  { nome: "Vampiro",   cores: ['#3a0000', '#d90429', '#8d0000'],                       contorno: '#000000', luz: '#d90429' },
    ouroneon: { nome: "Ouro neon", cores: ['#ffb300', '#fffbe0', '#ff6f00'],                       contorno: '#2a1500', luz: '#ffb300' }
};
const ESTILO_PADRAO = 'dourado';

const semAcento = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// separa "estilo" do texto: o 1º argumento só vira estilo se for o nome de um estilo
function lerPedido(args) {
    const lista = (args || []).filter(Boolean);
    if (lista.length && semAcento(lista[0]) === 'estilos') return { pedirLista: true };
    const primeiro = semAcento(lista[0]);
    if (ESTILOS[primeiro]) return { estilo: primeiro, texto: lista.slice(1).join(' ').trim() };
    return { estilo: ESTILO_PADRAO, texto: lista.join(' ').trim() };
}

function pegarImagemAlvo(msg) {
    const midiaDireta = msg.message?.imageMessage;
    const midiaResposta = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    return midiaDireta || midiaResposta || null;
}

async function baixarImagemMsg(midia) {
    const stream = await downloadContentFromMessage(midia, 'image');
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    return buffer;
}

// quebra em até 2 linhas quando o nome é grande
function quebrarLinhas(texto) {
    const t = texto.replace(/\s+/g, ' ').trim();
    if (t.length <= 16 || !t.includes(' ')) return [t];
    const meio = t.length / 2;
    let corte = -1, melhor = Infinity;
    for (let i = 0; i < t.length; i++) if (t[i] === ' ' && Math.abs(i - meio) < melhor) { melhor = Math.abs(i - meio); corte = i; }
    return [t.slice(0, corte).trim(), t.slice(corte + 1).trim()];
}

// maior fonte que cabe na largura (a partir de uma altura máxima proporcional à foto)
function calcularFontSize(ctxMedida, linhas, W, H) {
    const nLinhas = linhas.length;
    let fontSize = Math.floor(H * (nLinhas === 1 ? 0.12 : 0.09));
    ctxMedida.font = FONTE(fontSize);
    const larguraMax = () => Math.max(...linhas.map(l => ctxMedida.measureText(l).width));
    while (larguraMax() > W * 0.9 && fontSize > 20) {
        fontSize -= 3;
        ctxMedida.font = FONTE(fontSize);
    }
    return fontSize;
}

// escurece de leve a parte de baixo para o nome sempre ficar legível
function desenharFaixaBaixo(ctx, W, H) {
    const g = ctx.createLinearGradient(0, H * 0.6, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = g;
    ctx.fillRect(0, H * 0.6, W, H * 0.4);
}

// desenha o texto na parte de baixo. "deslocamentoBrilho" (0 a 1) faz o brilho deslizar (gif)
function desenharTextoArte(ctx, linhas, W, H, fontSize, estiloId, escala = 1, deslocamentoBrilho = 0.5) {
    const est = ESTILOS[estiloId] || ESTILOS[ESTILO_PADRAO];
    const alturaLinha = fontSize * 1.12;
    const yUltima = H - Math.max(H * 0.045, fontSize * 0.4) - alturaLinha / 2;
    const yPrimeira = yUltima - (linhas.length - 1) * alturaLinha;

    ctx.save();
    ctx.translate(W / 2, yPrimeira);
    ctx.scale(escala, escala);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = FONTE(fontSize);
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;

    const largura = Math.max(...linhas.map(l => ctx.measureText(l).width)); // o degradê acompanha o tamanho do texto
    const centroX = -largura + deslocamentoBrilho * largura * 2;
    const grad = ctx.createLinearGradient(centroX - largura / 2, 0, centroX + largura / 2, 0);
    est.cores.forEach((c, i) => grad.addColorStop(est.cores.length === 1 ? 0 : i / (est.cores.length - 1), c));

    linhas.forEach((linha, i) => {
        const y = i * alturaLinha;
        // luz em volta das letras (estilos neon/fogo/gelo...)
        if (est.luz) {
            ctx.shadowColor = est.luz; ctx.shadowBlur = fontSize * 0.45; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
            ctx.fillStyle = est.luz; ctx.fillText(linha, 0, y);
        }
        // sombra + contorno
        ctx.shadowColor = 'rgba(0,0,0,0.65)'; ctx.shadowBlur = fontSize * 0.12;
        ctx.shadowOffsetX = fontSize * 0.03; ctx.shadowOffsetY = fontSize * 0.05;
        ctx.lineWidth = fontSize * 0.14; ctx.strokeStyle = est.contorno;
        ctx.strokeText(linha, 0, y);
        // letra com o gradiente
        ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; ctx.shadowColor = 'transparent';
        ctx.fillStyle = grad;
        ctx.fillText(linha, 0, y);
    });
    ctx.restore();
}

const listaEstilos = () => Object.keys(ESTILOS).map(id => `• ${id}`).join('\n');

const AJUDA_ARTENOME = (comando) => `🌸┈┈┈┈┈┈┈┈┈┈┈┈┈┈🌸
🎨 𝑨𝑹𝑻𝑬 𝑪𝑶𝑴 𝑵𝑶𝑴𝑬
🌸┈┈┈┈┈┈┈┈┈┈┈┈┈┈🌸

Envie uma imagem (ou responda em cima
de uma) junto com:

🌷 ${config.PREFIX}${comando} SeuNome
🌷 ${config.PREFIX}${comando} neon SeuNome

💡 O nome fica na parte de baixo da foto.
Para escolher o estilo, escreva o estilo
antes do nome.

✨ ESTILOS:
${listaEstilos()}`;

// ══════════════════════════════════════════════════
// 🖌️ VERSÃO PARADA
// ══════════════════════════════════════════════════
async function artenome(sock, msg, args) {
    const from = msg.key.remoteJid;
    const pedido = lerPedido(args);
    if (pedido.pedirLista) return sock.sendMessage(from, { text: AJUDA_ARTENOME("artenome") }, { quoted: msg });
    const midia = pegarImagemAlvo(msg);

    if (!midia || !pedido.texto) {
        return sock.sendMessage(from, { text: AJUDA_ARTENOME("artenome") }, { quoted: msg });
    }

    try {
        const bufferImagem = await baixarImagemMsg(midia);
        const img = await carregarImagemComDiagnostico(bufferImagem, "artenome");

        const W = img.width, H = img.height;
        const canvas = createCanvas(W, H);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, W, H);

        const linhas = quebrarLinhas(pedido.texto);
        const fontSize = calcularFontSize(ctx, linhas, W, H);
        desenharFaixaBaixo(ctx, W, H);
        desenharTextoArte(ctx, linhas, W, H, fontSize, pedido.estilo, 1, 0.5);

        const resultado = await canvas.encode('jpeg');
        await sock.sendMessage(from, { image: resultado }, { quoted: msg });

    } catch (erro) {
        console.error("❌ Erro em artenome:", erro.message);
        await sock.sendMessage(from, { text: "❌ Não consegui gerar a arte nessa imagem. Tenta com outra foto." }, { quoted: msg });
    }
}

// ══════════════════════════════════════════════════
// 🎬 VERSÃO ANIMADA (gif)
// ══════════════════════════════════════════════════
async function artenomegif(sock, msg, args) {
    const from = msg.key.remoteJid;
    const pedido = lerPedido(args);
    if (pedido.pedirLista) return sock.sendMessage(from, { text: AJUDA_ARTENOME("artenomegif") }, { quoted: msg });
    const midia = pegarImagemAlvo(msg);

    if (!midia || !pedido.texto) {
        return sock.sendMessage(from, { text: AJUDA_ARTENOME("artenomegif") }, { quoted: msg });
    }

    const FRAMES = 14;
    const DURACAO = 1.6; // segundos
    const pastaTemp = path.join(__dirname, `artenomegif_${Date.now()}_${Math.floor(Math.random() * 9999)}`);

    try {
        const bufferImagem = await baixarImagemMsg(midia);
        const img = await carregarImagemComDiagnostico(bufferImagem, "artenomegif");
        const W = img.width, H = img.height;

        const linhas = quebrarLinhas(pedido.texto);
        const canvasMedida = createCanvas(W, H);
        const fontSize = calcularFontSize(canvasMedida.getContext('2d'), linhas, W, H);

        fs.mkdirSync(pastaTemp, { recursive: true });

        for (let i = 0; i < FRAMES; i++) {
            const t = i / FRAMES;
            const canvas = createCanvas(W, H);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, W, H);
            desenharFaixaBaixo(ctx, W, H);

            const escala = 1 + Math.sin(t * Math.PI * 2) * 0.03; // pulso leve
            desenharTextoArte(ctx, linhas, W, H, fontSize, pedido.estilo, escala, t);

            const bufFrame = await canvas.encode('png');
            fs.writeFileSync(path.join(pastaTemp, `f_${String(i).padStart(3, '0')}.png`), bufFrame);
        }

        const saida = path.join(pastaTemp, 'saida.mp4');
        const fps = (FRAMES / DURACAO).toFixed(2);
        await execAsync(`ffmpeg -y -framerate ${fps} -i "${path.join(pastaTemp, 'f_%03d.png')}" -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -profile:v baseline -level 3.1 -pix_fmt yuv420p -movflags faststart "${saida}"`);

        if (!fs.existsSync(saida)) throw new Error("O ffmpeg não gerou o vídeo final.");

        await sock.sendMessage(from, {
            video: fs.readFileSync(saida),
            gifPlayback: true
        }, { quoted: msg });

    } catch (erro) {
        console.error("❌ Erro em artenomegif:", erro.message);
        await sock.sendMessage(from, { text: "❌ Não consegui gerar a arte animada nessa imagem. Tenta com outra foto." }, { quoted: msg });
    } finally {
        fs.rmSync(pastaTemp, { recursive: true, force: true });
    }
}

module.exports = { artenome, artenomegif, ESTILOS };
