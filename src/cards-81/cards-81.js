/* =================================================
   🎨 STYLE-v1 8.1 — CARDS NOVOS (canvas)
   • Menu principal (com prefixo)
   • Pedido de entrada  → "implorando pra entrar"
   • Pedido recusado    → deboche de quem ficou na porta
   • Entrada no grupo   → "olha quem chegou"
   • Saída do grupo     → "fugiu" / "foi expulso(a)"
   Foto da pessoa sempre QUADRADA e INTEIRA (sem cortar): o espaço que
   sobra é preenchido com a própria foto desfocada.
   Fontes vão junto no projeto (src/midias/assets/fonts).
================================================= */
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const fs = require("fs");
const path = require("path");

const PASTA_FONTES = path.join(__dirname, "../midias/assets/fonts");
(function fontes() {
    const reg = (arq, fam) => { try { const p = path.join(PASTA_FONTES, arq); if (fs.existsSync(p)) GlobalFonts.registerFromPath(p, fam); } catch {} };
    reg("Poppins-Bold.ttf", "MK81 Bold");
    reg("Poppins-Regular.ttf", "MK81 Reg");
    reg("LiberationSerif-BoldItalic.ttf", "MK81 Serif");
})();
const B = "MK81 Bold, DejaVu Sans, sans-serif";
const R = "MK81 Reg, DejaVu Sans, sans-serif";
const S = "MK81 Serif, DejaVu Serif, serif";

// 🖼️ Fundo dos cards de lista: usa a FOTO DO GRUPO (passada) esmaecida; se não
// vier, cai na arte da STYLE-v1. Sempre com um véu escuro por cima pra o texto
// ficar 100% legível.
function _lerArteFundo() {
    const cands = [
        path.join(__dirname, "../midias/imagens/perfil-banner.png"),
        path.join(__dirname, "../midias/imagens/menu.png"),
        path.join(__dirname, "../midias/imagens/fundo.png")
    ];
    for (const c of cands) { try { if (fs.existsSync(c)) return fs.readFileSync(c); } catch {} }
    return null;
}
async function fundoCard(ctx, W, H, buf) {
    try {
        let im = buf ? await carregar(buf) : null;
        if (!im) im = await carregar(_lerArteFundo());
        if (im) {
            ctx.save();
            const esc = Math.max(W / im.width, H / im.height);
            ctx.globalAlpha = 0.50;
            ctx.drawImage(im, (W - im.width * esc) / 2, (H - im.height * esc) / 2, im.width * esc, im.height * esc);
            ctx.restore();
        }
        // véu leve só pra dar contraste (a foto continua aparecendo)
        ctx.fillStyle = "rgba(8,4,16,0.42)"; ctx.fillRect(0, 0, W, H);
    } catch {}
}

// 🟦 Painel escuro atrás da LISTA: a foto aparece em volta, e os nomes ficam
// num "quadro" escuro, bem legíveis (foi o que o dono pediu).
function painelLista(ctx, W, topo, rowH, n) {
    const y = topo - 12, h = rowH * n + 18;
    rr(ctx, 42, y, W - 84, h, 22);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 20;
    ctx.fillStyle = "rgba(9,5,16,0.88)"; ctx.fill();
    ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1.5; ctx.stroke();
}

// ───────────── utilitários ─────────────
function limpar(t) { return String(t || "").replace(/[\u0334-\u0338\u035c-\u0362\u20d0-\u20ff]/g, "").replace(/[*_~`]/g, "").replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, "").replace(/\s+/g, " ").trim(); }
function sorteio(lista) { return lista[Math.floor(Math.random() * lista.length)]; }
function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function fit(ctx, texto, fonte, max, ini, min = 14) {
    let t = ini;
    do { ctx.font = `${t}px ${fonte}`; if (ctx.measureText(texto).width <= max) break; t -= 2; } while (t > min);
    return t;
}
function cortar(ctx, texto, max) {
    let t = String(texto);
    if (ctx.measureText(t).width <= max) return t;
    while (t.length > 1 && ctx.measureText(t + "…").width > max) t = t.slice(0, -1);
    return t + "…";
}
function quebrar(ctx, texto, max, maxLinhas = 3) {
    const palavras = String(texto).split(" "), linhas = [];
    let atual = "";
    for (const p of palavras) {
        const teste = atual ? atual + " " + p : p;
        if (ctx.measureText(teste).width > max && atual) { linhas.push(atual); atual = p; } else atual = teste;
    }
    if (atual) linhas.push(atual);
    if (linhas.length > maxLinhas) { linhas.length = maxLinhas; linhas[maxLinhas - 1] = cortar(ctx, linhas[maxLinhas - 1] + "…", max); }
    return linhas;
}
async function carregar(buf) { try { return buf ? await loadImage(buf) : null; } catch { return null; } }
function dataHoraBR() {
    try { return new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).replace(",", " às"); }
    catch { return new Date().toISOString().slice(0, 16).replace("T", " "); }
}
function nomeBonito(n) {
    const t = limpar(n);
    if (!t) return "@alguém";
    return /^\+?\d{8,16}$/.test(t.replace(/\s/g, "")) ? "@" + t.replace(/\D/g, "") : t;
}

// fundo escuro com brilho das cores do tema + linhas diagonais
function fundo(ctx, W, H, c1, c2) {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#0c0616"); g.addColorStop(0.55, "#120a22"); g.addColorStop(1, "#07040d");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (const [x, y, r, cor, a] of [[W * 0.12, H * 0.1, W * 0.55, c1, 0.30], [W * 0.95, H * 0.95, W * 0.6, c2, 0.26]]) {
        const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
        rg.addColorStop(0, hexA(cor, a)); rg.addColorStop(1, hexA(cor, 0));
        ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
    }
    ctx.save(); ctx.globalAlpha = 0.05; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
    for (let i = -H; i < W; i += 26) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke(); }
    ctx.restore();
}
function hexA(hex, a) {
    const h = hex.replace("#", ""); const n = parseInt(h.length === 3 ? h.split("").map(x => x + x).join("") : h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function moldura(ctx, W, H, c1, c2) {
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.save(); ctx.shadowColor = c1; ctx.shadowBlur = 24;
    rr(ctx, 14, 14, W - 28, H - 28, 30); ctx.strokeStyle = g; ctx.lineWidth = 4; ctx.stroke();
    ctx.restore();
    rr(ctx, 28, 28, W - 56, H - 56, 22); ctx.strokeStyle = "rgba(255,255,255,0.10)"; ctx.lineWidth = 1.5; ctx.stroke();
}
function etiqueta(ctx, x, y, texto, c1, c2, tam = 20) {
    ctx.font = `${tam}px ${B}`;
    const w = ctx.measureText(texto).width + tam * 2.2, h = tam * 1.9;
    rr(ctx, x, y, w, h, h / 2);
    const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fill();
    ctx.fillStyle = "#fff"; ctx.textBaseline = "middle"; ctx.textAlign = "left";
    ctx.fillText(texto, x + tam * 1.1, y + h / 2 + 1); ctx.textBaseline = "alphabetic";
    return w;
}
function carimbo(ctx, cx, cy, texto, cor, ang = -0.14) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
    const tam = fit(ctx, texto, B, 300, 34, 18);
    ctx.font = `${tam}px ${B}`;
    const w = ctx.measureText(texto).width + 40, h = tam + 30;
    ctx.globalAlpha = 0.92;
    rr(ctx, -w / 2, -h / 2, w, h, 10); ctx.strokeStyle = cor; ctx.lineWidth = 5; ctx.stroke();
    rr(ctx, -w / 2 + 7, -h / 2 + 7, w - 14, h - 14, 6); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = cor; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(texto, 0, 2);
    ctx.restore(); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
}
// 📸 foto QUADRADA e INTEIRA (contain), fundo = mesma foto desfocada
async function fotoQuadrada(ctx, buf, x, y, tam, c1, c2, pb = false) {
    const im = await carregar(buf);
    ctx.save();
    ctx.shadowColor = c1; ctx.shadowBlur = 36;
    rr(ctx, x, y, tam, tam, 26); ctx.fillStyle = "#0b0614"; ctx.fill();
    ctx.shadowBlur = 0;
    rr(ctx, x, y, tam, tam, 26); ctx.clip();
    if (im) {
        if (pb) ctx.filter = "grayscale(100%) contrast(110%)";
        // fundo desfocado (cobre tudo)
        const esc = Math.max(tam / im.width, tam / im.height);
        try { ctx.filter = (pb ? "grayscale(100%) " : "") + "blur(18px) brightness(55%)"; } catch {}
        ctx.drawImage(im, x + (tam - im.width * esc) / 2, y + (tam - im.height * esc) / 2, im.width * esc, im.height * esc);
        try { ctx.filter = pb ? "grayscale(100%) contrast(110%)" : "none"; } catch {}
        // foto inteira por cima
        const e2 = Math.min(tam / im.width, tam / im.height);
        ctx.drawImage(im, x + (tam - im.width * e2) / 2, y + (tam - im.height * e2) / 2, im.width * e2, im.height * e2);
        try { ctx.filter = "none"; } catch {}
    } else {
        const g = ctx.createLinearGradient(x, y, x + tam, y + tam); g.addColorStop(0, hexA(c1, 0.6)); g.addColorStop(1, "#0b0614");
        ctx.fillStyle = g; ctx.fillRect(x, y, tam, tam);
        // silhueta
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.beginPath(); ctx.arc(x + tam / 2, y + tam * 0.40, tam * 0.17, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x + tam / 2, y + tam * 0.92, tam * 0.32, tam * 0.27, 0, Math.PI, 0); ctx.fill();
    }
    ctx.restore();
    const g = ctx.createLinearGradient(x, y, x + tam, y + tam); g.addColorStop(0, c1); g.addColorStop(1, c2);
    rr(ctx, x, y, tam, tam, 26); ctx.strokeStyle = g; ctx.lineWidth = 6; ctx.stroke();
}
function linhaInfo(ctx, x, y, rotulo, valor, cor, larg) {
    ctx.fillStyle = cor; ctx.font = `17px ${B}`; ctx.fillText(rotulo.toUpperCase(), x, y);
    ctx.fillStyle = "#ffffff"; const t = fit(ctx, valor, R, larg, 27, 16); ctx.font = `${t}px ${R}`;
    ctx.fillText(cortar(ctx, valor, larg), x, y + 34);
}
function caixaFrase(ctx, x, y, w, h, frase, c1, c2) {
    rr(ctx, x, y, w, h, 22);
    const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, hexA(c1, 0.20)); g.addColorStop(1, hexA(c2, 0.14));
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = hexA(c1, 0.55); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = hexA(c2, 0.9); ctx.font = `110px ${S}`; ctx.fillText("“", x + 18, y + 96);
    ctx.fillStyle = "#fff";
    let tam = 30, linhas;
    do { ctx.font = `${tam}px ${S}`; linhas = quebrar(ctx, frase, w - 130, 3); tam -= 2; }
    while (tam > 18 && (linhas.length * (tam + 12) > h - 30 || linhas.some(l => ctx.measureText(l).width > w - 130)));
    tam += 2; ctx.font = `${tam}px ${S}`;
    const alt = linhas.length * (tam + 10);
    linhas.forEach((l, i) => ctx.fillText(l, x + 90, y + (h - alt) / 2 + tam + i * (tam + 10) - 4));
}
function barraInferior(ctx, W, H, texto, c1, c2) {
    const h = 70, y = H - 28 - h;
    ctx.save(); rr(ctx, 28, y, W - 56, h, 18); ctx.clip();
    const g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fillRect(28, y, W - 56, h); ctx.restore();
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    fit(ctx, texto, B, W - 120, 26, 14); ctx.fillText(texto, W / 2, y + h / 2 + 1);
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
}

// ───────────── molde dos cards de pessoa (1000 x 1000) ─────────────
async function cardPessoa(o) {
    const W = 1000, H = 1000, c = createCanvas(W, H), ctx = c.getContext("2d");
    const { c1, c2 } = o;
    fundo(ctx, W, H, c1, c2);
    moldura(ctx, W, H, c1, c2);

    // topo: etiqueta + hora
    const ew = etiqueta(ctx, 60, 58, o.etiqueta, c1, c2, 19);
    ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = `17px ${R}`; ctx.textBaseline = "middle";
    ctx.fillText(dataHoraBR(), 60 + ew + 18, 58 + 19 * 1.9 / 2 + 1); ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.font = `19px ${B}`; ctx.textAlign = "right";
    ctx.fillText(limpar(o.botName || "STYLE-v1").toUpperCase(), W - 60, 88); ctx.textAlign = "left";

    // manchete
    const tTit = fit(ctx, o.titulo, B, W - 120, 92, 40);
    const gt = ctx.createLinearGradient(60, 0, W - 60, 0); gt.addColorStop(0, "#ffffff"); gt.addColorStop(1, o.corTitulo || "#e7d4ff");
    ctx.save(); ctx.shadowColor = c1; ctx.shadowBlur = 26; ctx.fillStyle = gt; ctx.font = `${tTit}px ${B}`;
    ctx.fillText(o.titulo, 60, 120 + tTit); ctx.restore();
    const ySub = 120 + tTit + 44;
    ctx.fillStyle = "rgba(255,255,255,0.78)"; fit(ctx, o.subtitulo, R, W - 120, 25, 16); ctx.fillText(o.subtitulo, 60, ySub);

    // foto + nome
    const fy = ySub + 34, tam = 400;
    await fotoQuadrada(ctx, o.foto, 60, fy, tam, c1, c2, o.pb);
    rr(ctx, 60, fy + tam + 16, tam, 58, 16); ctx.fillStyle = "rgba(255,255,255,0.10)"; ctx.fill();
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; fit(ctx, o.nome, B, tam - 30, 28, 14);
    ctx.fillText(cortar(ctx, o.nome, tam - 30), 60 + tam / 2, fy + tam + 56); ctx.textAlign = "left";

    // informações à direita
    const ix = 500, il = W - ix - 60;
    let iy = fy + 30;
    for (const [rot, val] of o.infos) { linhaInfo(ctx, ix, iy, rot, String(val ?? "-"), c2, il); iy += 92; }
    carimbo(ctx, ix + il / 2, fy + tam - 18, o.carimbo, o.corCarimbo || c2, o.angulo ?? -0.13);

    // frase de deboche
    const qy = fy + tam + 96;
    caixaFrase(ctx, 60, qy, W - 120, H - 28 - 70 - 22 - qy, o.frase, c1, c2);

    barraInferior(ctx, W, H, o.rodape, c1, c2);
    return c.encode("png");
}

// ═════════════ MOLDES DO DOCTOR VALEYARD (arte pronta) ═════════════
// src/midias/cards81/solicitacao.jpg e recusa.jpg (2x). Só preenche: foto, número,
// nome do grupo e participantes. Medidas em pixels do molde 1x (multiplicadas por 2).
const PASTA_MOLDES = path.join(__dirname, "../midias/cards81");
const MOLDES = {
    solicitacao: {
        arquivo: "solicitacao.jpg", corTexto: "#b14dff",
        foto: [[82, 260], [362, 260], [362, 482], [82, 482]],
        numero: { cx: 248.5, base: 521, larg: 178, ang: 0 },
        grupo: { x: 163, base: 625, larg: 600, apagar: [158, 601, 615, 30] },
        part: { x: 893, base: 625, larg: 300, apagar: [888, 601, 310, 30] }
    },
    recusa: {
        arquivo: "recusa.jpg", corTexto: "#e01b1b",
        foto: [[129, 269.5], [382, 260], [382, 442], [129, 458]],
        numero: { cx: 280.5, base: 488.5, larg: 155, ang: -0.0618 },
        grupo: { x: 163, base: 602, larg: 600, apagar: [158, 578, 615, 30] },
        part: { x: 888, base: 602, larg: 300, apagar: [883, 578, 315, 30] }
    }
};
function formatarNumero(n) {
    const d = String(n || "").replace(/\D/g, "");
    if (/^55\d{10,11}$/.test(d)) return `+55 ${d.slice(2, 4)} ${d.slice(4, d.length - 4)}-${d.slice(-4)}`;
    return d ? `+${d}` : "número oculto";
}
async function preencherMolde(chave, { fotoBuffer, numero, nomeGrupo, totalMembros }) {
    const m = MOLDES[chave];
    const fundoImg = await carregar(fs.readFileSync(path.join(PASTA_MOLDES, m.arquivo)));
    if (!fundoImg) throw new Error("molde não encontrado");
    const K = 2, W = fundoImg.width, H = fundoImg.height;
    const c = createCanvas(W, H), ctx = c.getContext("2d");
    ctx.drawImage(fundoImg, 0, 0, W, H);

    // 📸 foto: preenche o quadro (desfocada) + foto inteira quadrada no meio
    const pts = m.foto.map(([x, y]) => [x * K, y * K]);
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const bx = Math.min(...xs), by = Math.min(...ys), bw = Math.max(...xs) - bx, bh = Math.max(...ys) - by;
    const cxF = bx + bw / 2, cyF = by + bh / 2;
    const ang = Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0]) * 0.9;
    const im = await carregar(fotoBuffer);
    ctx.save();
    ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip();
    if (im) {
        const e1 = Math.max(bw / im.width, bh / im.height) * 1.15;
        try { ctx.filter = "blur(22px) brightness(45%)"; } catch {}
        ctx.drawImage(im, cxF - im.width * e1 / 2, cyF - im.height * e1 / 2, im.width * e1, im.height * e1);
        try { ctx.filter = "none"; } catch {}
        const lado = Math.min(bw, bh) * 0.9;
        ctx.translate(cxF, cyF); ctx.rotate(ang);
        ctx.save(); rr(ctx, -lado / 2, -lado / 2, lado, lado, 14); ctx.clip();
        ctx.fillStyle = "#000"; ctx.fillRect(-lado / 2, -lado / 2, lado, lado);
        const e2 = Math.min(lado / im.width, lado / im.height);
        ctx.drawImage(im, -im.width * e2 / 2, -im.height * e2 / 2, im.width * e2, im.height * e2);
        ctx.restore();
        rr(ctx, -lado / 2, -lado / 2, lado, lado, 14); ctx.strokeStyle = hexA(m.corTexto, 0.9); ctx.lineWidth = 4; ctx.stroke();
    } else {
        ctx.translate(cxF, cyF); ctx.rotate(ang);
        const t = Math.min(bw, bh);
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.beginPath(); ctx.arc(0, -t * 0.12, t * 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, t * 0.48, t * 0.36, t * 0.3, 0, Math.PI, 0); ctx.fill();
    }
    ctx.restore();

    // 📞 número centralizado em cima da linha
    const n = m.numero, txtNum = formatarNumero(numero);
    ctx.save(); ctx.translate(n.cx * K, n.base * K); ctx.rotate(Math.atan(n.ang));
    ctx.fillStyle = "#ffffff"; ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,0.9)"; ctx.shadowBlur = 8;
    fit(ctx, txtNum, B, n.larg * K, 38, 18); ctx.fillText(txtNum, 0, 0);
    ctx.restore();

    // 👥 grupo e participantes (apaga o "NOME DO GRUPO AQUI" / "000/000" do molde)
    for (const [campo, valor] of [["grupo", (limpar(nomeGrupo) || "GRUPO").toUpperCase()], ["part", totalMembros ? `${totalMembros}/1024` : "—"]]) {
        const f = m[campo], [ax, ay, aw, ah] = f.apagar;
        ctx.fillStyle = "#020003"; ctx.fillRect(ax * K, ay * K, aw * K, ah * K);
        ctx.fillStyle = m.corTexto; ctx.textAlign = "left";
        fit(ctx, valor, B, f.larg * K, 40, 20);
        ctx.fillText(cortar(ctx, valor, f.larg * K), f.x * K, f.base * K);
    }
    return c.encode("jpeg", 92);
}
function temMolde(chave) { try { return fs.existsSync(path.join(PASTA_MOLDES, MOLDES[chave].arquivo)); } catch { return false; } }

// ═════════════ MOLDES DE RANKING / SAÍDA (arte do Doctor Valeyard) ═════════════
// Artes prontas com as barrinhas neon. Só escrevo o nome (e o valor) dentro de
// cada barra. Coordenadas na resolução nativa da arte (1254 x 627).
const MOLDES_RANK = {
    level: { arquivo: "ranking-level.png", x0: 812, x1: 1068, slots: [297, 353, 411, 467, 521], corVal: "#ffd36b" },
    saida: { arquivo: "ranking-saida.png", x0: 772, x1: 1005, slots: [409, 489], corVal: "#ff8a8a" }
};
function temMoldeRank(chave) { try { return fs.existsSync(path.join(PASTA_MOLDES, MOLDES_RANK[chave].arquivo)); } catch { return false; } }
async function preencherMoldeRank(chave, dados = []) {
    const m = MOLDES_RANK[chave];
    const fundoImg = await carregar(fs.readFileSync(path.join(PASTA_MOLDES, m.arquivo)));
    if (!fundoImg) throw new Error("molde de ranking não encontrado");
    const W = fundoImg.width, H = fundoImg.height;
    const c = createCanvas(W, H), ctx = c.getContext("2d");
    ctx.drawImage(fundoImg, 0, 0, W, H);
    const pad = 18, valReserva = 70;
    ctx.textBaseline = "middle"; ctx.lineJoin = "round";
    for (let i = 0; i < m.slots.length && i < dados.length; i++) {
        const yc = m.slots[i];
        const nome = limpar(dados[i]?.nome || "") || "—";
        const valor = String(dados[i]?.valor || "");
        if (valor) {
            ctx.font = `20px ${B}`; ctx.textAlign = "right";
            ctx.lineWidth = 4; ctx.strokeStyle = "rgba(0,0,0,0.85)"; ctx.strokeText(valor, m.x1 - pad, yc);
            ctx.fillStyle = m.corVal; ctx.fillText(valor, m.x1 - pad, yc);
        }
        const nameMax = (m.x1 - m.x0) - pad * 2 - (valor ? valReserva : 0);
        const fn = fit(ctx, nome, B, nameMax, 24, 13); ctx.font = `${fn}px ${B}`;
        const txt = cortar(ctx, nome, nameMax);
        ctx.textAlign = "left";
        ctx.lineWidth = 4; ctx.strokeStyle = "rgba(0,0,0,0.85)"; ctx.strokeText(txt, m.x0 + pad, yc);
        ctx.fillStyle = "#ffffff"; ctx.fillText(txt, m.x0 + pad, yc);
    }
    ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
    return c.encode("png");
}

// ═════════════ PEDIDO DE ENTRADA — implorando ═════════════
// 🌀 STYLE-v1: molde DW de solicitação (arte pronta em style-arts). Só foto + número.
const ARTE_SOLIC = {
    implorando: { arte: "solicitacao-entrada.png",   foto: { x: 1326, y: 116, w: 479, h: 499 }, barra: { x: 1245, y: 672, w: 576, h: 114 } },
    barrado:    { arte: "solicitacao-cancelada.png", foto: { x: 1301, y: 89,  w: 528, h: 530 }, barra: { x: 1246, y: 675, w: 577, h: 122 } }
};
function numeroCardDW(n) {
    const d = String(n || "").replace(/\D/g, "");
    if (d.length >= 12) return `+${d.slice(0,2)} ${d.slice(2,4)} ${d.slice(4,5)}****-${d.slice(-4)}`;
    if (d.length >= 8)  return `+${d.slice(0,-4).replace(/\d(?=\d{2})/g,"*")}-${d.slice(-4)}`;
    return d ? `+${d}` : "viajante";
}
async function cardSolicitacaoDW(tipo, { fotoBuffer, numero }) {
    const m = ARTE_SOLIC[tipo];
    const arte = await carregar(fs.readFileSync(path.join(__dirname, "../midias/style-arts", m.arte)));
    if (!arte) throw new Error("arte DW de solicitação não encontrada");
    const W = arte.width, H = arte.height;
    const c = createCanvas(W, H), ctx = c.getContext("2d");
    ctx.drawImage(arte, 0, 0, W, H);
    const im = await carregar(fotoBuffer), f = m.foto;
    ctx.save(); rr(ctx, f.x, f.y, f.w, f.h, 10); ctx.clip();
    if (im) { const e = Math.max(f.w/im.width, f.h/im.height); ctx.drawImage(im, f.x+(f.w-im.width*e)/2, f.y+(f.h-im.height*e)/2, im.width*e, im.height*e); }
    else { ctx.fillStyle = "#1a0a2a"; ctx.fillRect(f.x, f.y, f.w, f.h); }
    ctx.restore();
    const b = m.barra;
    ctx.save(); ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(190,90,255,0.9)"; ctx.shadowBlur = Math.round(b.h*0.18);
    let fz = Math.round(b.h*0.5); ctx.font = `bold ${fz}px sans-serif`;
    const txt = numeroCardDW(numero), maxW = b.w*0.9;
    while (ctx.measureText(txt).width > maxW && fz > 12) { fz -= 2; ctx.font = `bold ${fz}px sans-serif`; }
    ctx.fillText(txt, b.x + b.w/2, b.y + b.h/2);
    ctx.restore();
    return c.toBuffer("image/png");
}

async function criarCardImplorando({ fotoSolicitanteBuffer, nomeSolicitante, nomeGrupo, botName, totalMembros }) {
    try { return await cardSolicitacaoDW("implorando", { fotoBuffer: fotoSolicitanteBuffer, numero: nomeSolicitante }); }
    catch (e) { console.error("⚠️ molde DW implorando falhou:", e?.message || e); }
    return cardPessoa({
        c1: "#f59e0b", c2: "#ff3fb4", corTitulo: "#ffe2a8",
        etiqueta: "PORTARIA • PEDIDO DE ENTRADA", botName,
        titulo: "IMPLORANDO PRA ENTRAR",
        subtitulo: "Bateu na porta, ajoelhou e agora espera os ADMs terem pena.",
        foto: fotoSolicitanteBuffer, nome: nomeBonito(nomeSolicitante),
        infos: [["Quer entrar em", limpar(nomeGrupo) || "o grupo"], ["Situação", "De joelhos na porta"], ["Chance de entrar", sorteio(["Depende do humor dos ADMs", "Baixa, mas a fé é grande", "50% sorte, 50% pena"])]],
        carimbo: "NA FILA DO DESESPERO",
        frase: sorteio([
            "Por favooor, me deixa entrar... eu juro que sou legal.",
            "Tá com cara de quem vai mandar 'oi sumido' no primeiro dia.",
            "Implorou com tanta força que eu quase fiquei com pena. Quase.",
            "ADMs, decidam logo. Essa pessoa já tá chorando na porta."
        ]),
        rodape: "ADMS: APROVEM OU DEIXEM IMPLORANDO MAIS UM POUCO"
    });
}

// ═════════════ PEDIDO RECUSADO — deboche ═════════════
async function criarCardBarrado({ fotoSolicitanteBuffer, nomeSolicitante, nomeGrupo, nomeQuemRecusou, botName, totalMembros }) {
    try { return await cardSolicitacaoDW("barrado", { fotoBuffer: fotoSolicitanteBuffer, numero: nomeSolicitante }); }
    catch (e) { console.error("⚠️ molde DW barrado falhou:", e?.message || e); }
    return cardPessoa({
        c1: "#ef4444", c2: "#8b3dff", corTitulo: "#ffc2c2", pb: false,
        etiqueta: "PORTARIA • PEDIDO RECUSADO", botName,
        titulo: "BARRADO(A) NA PORTA",
        subtitulo: "Implorou, chorou, esperou... e ficou do lado de fora.",
        foto: fotoSolicitanteBuffer, nome: nomeBonito(nomeSolicitante),
        infos: [["Tentou entrar em", limpar(nomeGrupo) || "o grupo"], ["Quem fechou a porta", nomeQuemRecusou ? nomeBonito(nomeQuemRecusou) : "Os ADMs"], ["Motivo oficial", sorteio(["Não passou no teste da vibe", "Cara de quem some no grupo", "A STYLE-v1 não foi com a cara", "Vaga só pra gente interessante"])]],
        carimbo: "RECUSADO KKKK", angulo: -0.16,
        frase: sorteio([
            "Bateu, bateu, bateu... e a porta continuou fechada. Kkkkk.",
            "Pode tentar de novo, mas eu já avisei a portaria.",
            "Não foi dessa vez. Nem da próxima, provavelmente.",
            "O pedido foi analisado com carinho... e jogado no lixo."
        ]),
        rodape: "A PORTA TÁ FECHADA • VOLTA OUTRO DIA (OU NÃO)"
    });
}

// ═════════════ ENTRADA NO GRUPO ═════════════
async function criarCardChegou({ fotoBuffer, nomeUsuario, nomeGrupo, totalMembros, botName }) {
    return cardPessoa({
        c1: "#8b3dff", c2: "#22d3a6", corTitulo: "#c9fff0",
        etiqueta: "CHEGOU GENTE NOVA", botName,
        titulo: "OLHA QUEM CHEGOU",
        subtitulo: "Mais uma pessoa pra eu ficar de olho. Comporte-se.",
        foto: fotoBuffer, nome: nomeBonito(nomeUsuario),
        infos: [["Entrou em", limpar(nomeGrupo) || "o grupo"], ["Membro número", String(totalMembros || "?")], ["Primeira missão", sorteio(["Ler as regras (ninguém lê)", "Se apresentar sem mandar 'oi'", "Não sumir em 2 dias"])]],
        carimbo: "SOB VIGILÂNCIA",
        frase: sorteio([
            "Seja bem-vindo(a)... e não me faça passar vergonha.",
            "Chegou chegando. Agora vamos ver quanto tempo você dura.",
            "Entrou? Ótimo. As regras existem, finge que leu.",
            "Mais um(a) pra lista de quem eu vou zoar. Bem-vindo(a)!"
        ]),
        rodape: `AGORA SOMOS ${totalMembros || "?"} • LEIA AS REGRAS (EU SEI QUE VOCÊ NÃO VAI)`
    });
}

// ═════════════ SAÍDA DO GRUPO ═════════════
async function criarCardFugiu({ fotoBuffer, nomeUsuario, nomeGrupo, totalMembros, tempoNoGrupo, motivo, botName }) {
    const removido = motivo === "removido";
    return cardPessoa({
        c1: removido ? "#ef4444" : "#64748b", c2: "#8b3dff", corTitulo: removido ? "#ffc2c2" : "#e2e8f0", pb: true,
        etiqueta: removido ? "EXPULSÃO REGISTRADA" : "SAÍDA REGISTRADA", botName,
        titulo: removido ? "FOI EXPULSO(A)" : "ARREGOU E FUGIU",
        subtitulo: removido ? "Os ADMs cansaram e mostraram a saída." : "Saiu sem se despedir. Ninguém vai notar... talvez.",
        foto: fotoBuffer, nome: nomeBonito(nomeUsuario),
        infos: [["Saiu de", limpar(nomeGrupo) || "o grupo"], ["Aguentou", tempoNoGrupo || "pouco tempo"], ["Restam", `${totalMembros || "?"} membros`]],
        carimbo: removido ? "CHUTADO(A)" : "NÃO AGUENTOU",
        frase: removido ? sorteio([
            "Tchau! A porta é serventia da casa. Kkkk.",
            "Expulso(a) com estilo. Vai fazer falta? Não.",
            "Os ADMs fizeram o trabalho deles. De nada, grupo."
        ]) : sorteio([
            "Foi tarde. Se arrepender, a porta continua no mesmo lugar.",
            "Saiu de fininho achando que ninguém ia ver. Eu vi.",
            "Não aguentou o nível do grupo. Normal, nem todo mundo aguenta.",
            "Sumiu sem dar tchau. Que falta de educação, hein?"
        ]),
        rodape: removido ? "REMOVIDO(A) PELOS ADMS • GRUPO MAIS LEVE" : `RESTAM ${totalMembros || "?"} MEMBROS • O GRUPO SEGUE FIRME`
    });
}

// ═════════════ RANKING DO GRUPO (leaderboard 1000 x variável) ═════════════
// Sem emoji dentro do canvas (não há fonte de emoji registrada): as posições
// viram medalhas coloridas (ouro/prata/bronze) e badges numeradas.
async function criarCardRanking({ titulo, subtitulo, lista = [], botName, fundoBuffer }) {
    const linhas = (lista || []).slice(0, 10);
    const n = Math.max(linhas.length, 1);
    const W = 1000, topo = 250, rowH = 76, H = topo + rowH * n + 112;
    const c = createCanvas(W, H), ctx = c.getContext("2d");
    const c1 = "#8b3dff", c2 = "#ffb02e";
    fundo(ctx, W, H, c1, c2);
    await fundoCard(ctx, W, H, fundoBuffer);
    moldura(ctx, W, H, c1, c2);

    // topo: etiqueta + nome do bot
    etiqueta(ctx, 60, 58, "RANKING DO GRUPO", c1, c2, 18);
    ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.font = `18px ${B}`; ctx.textAlign = "right";
    ctx.fillText(limpar(botName || "STYLE-v1").toUpperCase(), W - 60, 86); ctx.textAlign = "left";

    // título + subtítulo
    const tit = (titulo || "RANKING").toString();
    const tTit = fit(ctx, tit, B, W - 120, 74, 36);
    const gt = ctx.createLinearGradient(60, 0, W - 60, 0); gt.addColorStop(0, "#ffffff"); gt.addColorStop(1, "#ffe6ad");
    ctx.save(); ctx.shadowColor = c1; ctx.shadowBlur = 24; ctx.fillStyle = gt; ctx.font = `${tTit}px ${B}`;
    ctx.fillText(tit, 60, 108 + tTit); ctx.restore();
    if (subtitulo) { ctx.fillStyle = "rgba(255,255,255,0.72)"; fit(ctx, subtitulo, R, W - 120, 23, 15); ctx.fillText(subtitulo, 60, 108 + tTit + 30); }

    // linhas do ranking
    painelLista(ctx, W, topo, rowH, linhas.length);
    const medal = ["#f6c945", "#d8dee9", "#e08a3c"];
    let y = topo;
    for (let i = 0; i < linhas.length; i++) {
        const u = linhas[i] || {};
        const destaque = i < 3;
        rr(ctx, 60, y, W - 120, 64, 16);
        ctx.fillStyle = destaque ? hexA(medal[i], 0.16) : "rgba(255,255,255,0.05)"; ctx.fill();
        ctx.strokeStyle = destaque ? hexA(medal[i], 0.60) : "rgba(255,255,255,0.10)"; ctx.lineWidth = 1.5; ctx.stroke();

        const by = y + 32;
        // badge da posição
        const bx = 100, br = 26;
        ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2);
        if (destaque) { const gg = ctx.createLinearGradient(bx - br, by - br, bx + br, by + br); gg.addColorStop(0, medal[i]); gg.addColorStop(1, hexA(medal[i], 0.72)); ctx.fillStyle = gg; }
        else ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.fill();
        ctx.fillStyle = destaque ? "#1a0f24" : "#ffffff"; ctx.font = `24px ${B}`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(i + 1), bx, by + 1);

        // nome (centralizado na vertical)
        const nx = 152, nLarg = W - 120 - (nx - 60) - 250;
        ctx.textAlign = "left";
        const nome = limpar(u.nome) || "Sem nome";
        const tn = fit(ctx, nome, B, nLarg, 27, 16); ctx.font = `${tn}px ${B}`;
        ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.75)"; ctx.shadowBlur = 6;
        ctx.fillStyle = "#ffffff"; ctx.fillText(cortar(ctx, nome, nLarg), nx, by);
        ctx.restore();

        // estatísticas à direita (ouro em destaque, nível embaixo)
        const nivel = u.nivel != null ? u.nivel : 1, ouro = u.ouro != null ? u.ouro : 0;
        ctx.textAlign = "right";
        ctx.font = `23px ${B}`; ctx.fillStyle = "#ffe6ad"; ctx.fillText(Number(ouro).toLocaleString("pt-BR"), W - 82, by - 11);
        ctx.font = `16px ${R}`; ctx.fillStyle = "rgba(255,255,255,0.65)"; ctx.fillText(`nivel ${nivel}`, W - 82, by + 13);

        ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
        y += rowH;
    }

    barraInferior(ctx, W, H, "QUEM MANDA MAIS VER NO GRUPO • SUBA DE NIVEL E APAREÇA AQUI", c1, c2);
    return c.encode("png");
}

// ═════════════ ÚLTIMAS SAÍDAS (lista — NÃO é card de pessoa) ═════════════
// Mostra a LISTA dos últimos que saíram (nome/número + saiu/removido + quando),
// no mesmo estilo do ranking. Sem emoji dentro do canvas.
async function criarCardSaidas({ titulo, subtitulo, lista = [], botName, fundoBuffer }) {
    const linhas = (lista || []).slice(0, 10);
    const n = Math.max(linhas.length, 1);
    const W = 1000, topo = 250, rowH = 80, H = topo + rowH * n + 112;
    const c = createCanvas(W, H), ctx = c.getContext("2d");
    const c1 = "#ef4444", c2 = "#8b3dff";
    fundo(ctx, W, H, c1, c2);
    await fundoCard(ctx, W, H, fundoBuffer);
    moldura(ctx, W, H, c1, c2);

    etiqueta(ctx, 60, 58, "ULTIMAS SAIDAS", c1, c2, 18);
    ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.font = `18px ${B}`; ctx.textAlign = "right";
    ctx.fillText(limpar(botName || "STYLE-v1").toUpperCase(), W - 60, 86); ctx.textAlign = "left";

    const tit = (titulo || "ÚLTIMAS SAÍDAS").toString();
    const tTit = fit(ctx, tit, B, W - 120, 72, 32);
    const gt = ctx.createLinearGradient(60, 0, W - 60, 0); gt.addColorStop(0, "#ffffff"); gt.addColorStop(1, "#ffc2c2");
    ctx.save(); ctx.shadowColor = c1; ctx.shadowBlur = 24; ctx.fillStyle = gt; ctx.font = `${tTit}px ${B}`;
    ctx.fillText(tit, 60, 108 + tTit); ctx.restore();
    if (subtitulo) { ctx.fillStyle = "rgba(255,255,255,0.72)"; fit(ctx, subtitulo, R, W - 120, 23, 15); ctx.fillText(subtitulo, 60, 108 + tTit + 30); }

    painelLista(ctx, W, topo, rowH, linhas.length);
    let y = topo;
    for (let i = 0; i < linhas.length; i++) {
        const u = linhas[i] || {};
        const removido = u.removido === true || u.como === "removido";
        const cor = removido ? "#ef4444" : "#94a3b8";
        rr(ctx, 60, y, W - 120, 68, 16);
        ctx.fillStyle = hexA(cor, removido ? 0.14 : 0.07); ctx.fill();
        ctx.strokeStyle = hexA(cor, removido ? 0.55 : 0.25); ctx.lineWidth = 1.5; ctx.stroke();

        const by = y + 34;
        // badge da posição (número da ordem de saída)
        const bx = 100, br = 26;
        ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fillStyle = hexA(cor, 0.30); ctx.fill();
        ctx.strokeStyle = hexA(cor, 0.7); ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = "#ffffff"; ctx.font = `23px ${B}`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(i + 1), bx, by + 1);

        // nome/número
        ctx.textAlign = "left";
        const nx = 152, nLarg = W - 120 - (nx - 60) - 250;
        const nome = u.nome ? limpar(u.nome) : formatarNumero(u.numero);
        const tn = fit(ctx, nome, B, nLarg, 26, 15); ctx.font = `${tn}px ${B}`;
        ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.75)"; ctx.shadowBlur = 6;
        ctx.fillStyle = "#ffffff"; ctx.fillText(cortar(ctx, nome, nLarg), nx, by);
        ctx.restore();

        // direita: saiu/removido + quando
        ctx.textAlign = "right";
        ctx.font = `20px ${B}`; ctx.fillStyle = removido ? "#ff8a8a" : "#cbd5e1";
        ctx.fillText(removido ? "REMOVIDO(A)" : "SAIU", W - 82, by - 12);
        ctx.font = `16px ${R}`; ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fillText(u.quando ? `há ${u.quando}` : "agora", W - 82, by + 13);

        ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
        y += rowH;
    }

    barraInferior(ctx, W, H, "QUEM DEU NO PE POR ULTIMO • A PORTA CONTINUA ABERTA (OU NAO)", c1, c2);
    return c.encode("png");
}

// ═════════════ MENU PRINCIPAL (com prefixo) — 1000 x 640 ═════════════
async function criarCardMenu81({ botName, ownerName, prefix, totalComandos, categorias = [], arteBuffer }) {
    const W = 1000, H = 640, c = createCanvas(W, H), ctx = c.getContext("2d");
    const c1 = "#8b3dff", c2 = "#ff3fb4";
    fundo(ctx, W, H, c1, c2);
    moldura(ctx, W, H, c1, c2);

    // arte da bot (inteira, quadrada)
    await fotoQuadrada(ctx, arteBuffer, 52, 60, 340, c1, c2);
    rr(ctx, 52, 418, 340, 102, 20); ctx.fillStyle = "rgba(255,255,255,0.07)"; ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = `23px ${B}`; ctx.fillText("VERSÃO 8.1", 222, 458);
    ctx.fillStyle = "rgba(255,255,255,0.65)"; ctx.font = `17px ${R}`; ctx.fillText("by DOCTOR VALEYARD", 222, 490); ctx.textAlign = "left";

    const tx = 426, larg = W - tx - 52;
    const ew = etiqueta(ctx, tx, 56, "MENU PRINCIPAL", c1, c2, 18);
    ctx.fillStyle = "#3dff9a"; ctx.beginPath(); ctx.arc(tx + ew + 26, 56 + 17, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#b8ffd9"; ctx.font = `17px ${B}`; ctx.textBaseline = "middle"; ctx.fillText("ONLINE", tx + ew + 42, 56 + 18); ctx.textBaseline = "alphabetic";

    const nome = (limpar(botName) || "STYLE-v1").toUpperCase();
    const tam = fit(ctx, nome, B, larg, 80, 34);
    const gt = ctx.createLinearGradient(tx, 0, tx + larg, 0); gt.addColorStop(0, "#ffffff"); gt.addColorStop(1, "#e2c8ff");
    ctx.save(); ctx.shadowColor = c1; ctx.shadowBlur = 22; ctx.fillStyle = gt; ctx.font = `${tam}px ${B}`; ctx.fillText(nome, tx, 104 + tam); ctx.restore();
    ctx.fillStyle = "rgba(255,255,255,0.8)"; fit(ctx, "Escolhe logo, que eu não tenho o dia todo.", S, larg, 26, 16);
    ctx.fillText("Escolhe logo, que eu não tenho o dia todo.", tx, 104 + tam + 40);

    // categorias em chips
    const cats = (categorias || []).filter(x => x && x.nome).slice(0, 9);
    let cx = tx, cy = 104 + tam + 70;
    const altChip = 40;
    for (const ct of cats) {
        const txt = `${limpar(ct.nome).toUpperCase()}${ct.qtd ? "  " + ct.qtd : ""}`;
        ctx.font = `15px ${B}`;
        const w = ctx.measureText(txt).width + 30;
        if (cx + w > tx + larg) { cx = tx; cy += altChip + 10; }
        if (cy + altChip > 466) break;
        rr(ctx, cx, cy, w, altChip, altChip / 2); ctx.fillStyle = hexA(ct.cor || c1, 0.28); ctx.fill();
        ctx.strokeStyle = hexA(ct.cor || c1, 0.85); ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = "#fff"; ctx.textBaseline = "middle"; ctx.fillText(txt, cx + 15, cy + altChip / 2 + 1); ctx.textBaseline = "alphabetic";
        cx += w + 10;
    }

    // estatísticas
    const ys = 458, sw = (larg - 20) / 3;
    [[String(totalComandos || 0), "COMANDOS"], [prefix || "!", "PREFIXO"], [(limpar(ownerName) || "DONO").split(" ").slice(0, 2).join(" ").toUpperCase(), "DONO"]].forEach(([v, l], i) => {
        const x = tx + i * (sw + 10);
        rr(ctx, x, ys, sw, 62, 16); ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fill();
        ctx.textAlign = "center"; ctx.fillStyle = "#fff"; fit(ctx, v, B, sw - 16, 28, 13); ctx.fillText(v, x + sw / 2, ys + 34);
        ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = `12px ${B}`; ctx.fillText(l, x + sw / 2, ys + 54); ctx.textAlign = "left";
    });

    barraInferior(ctx, W, H, "TOQUE EM  VER TUDO  E ESCOLHA • SEM PRESSA (MENTIRA, COM PRESSA)", c1, c2);
    return c.encode("png");
}

module.exports = { criarCardImplorando, criarCardBarrado, criarCardChegou, criarCardFugiu, criarCardMenu81, criarCardRanking, criarCardSaidas };
