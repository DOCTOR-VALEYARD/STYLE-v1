/* =================================================
   ✨ STYLE-v1 — NICK (nomes estilizados)
   📁 Arquivo: nick.js

   <prefixo>nick <nome>  → manda o nome em dezenas de estilos, por categoria
   <prefixo>tabela       → mostra todos os estilos com um exemplo

   Tudo em Unicode (funciona em qualquer celular, sem precisar de nada).
================================================= */
const config = require("../../config");

// -------------------------------------------------
// 🔤 FONTES
// -------------------------------------------------
function fonteMat(M, m, d, ex = {}) {
    return (ch) => {
        if (ex[ch]) return ex[ch];
        const c = ch.codePointAt(0);
        if (c >= 65 && c <= 90 && M) return String.fromCodePoint(M + c - 65);
        if (c >= 97 && c <= 122 && m) return String.fromCodePoint(m + c - 97);
        if (c >= 48 && c <= 57 && d) return String.fromCodePoint(d + c - 48);
        return ch;
    };
}
function mapa(de, para) {
    const a = [...de], b = [...para], o = {};
    a.forEach((ch, i) => { o[ch] = b[i]; });
    return (ch) => o[ch] ?? o[ch.toLowerCase()] ?? ch;
}
const ap = (t, fn) => [...t].map(fn).join("");
const mk = (t, c) => [...t].map(ch => ch === " " ? ch : ch + c).join("");

const F = {
    negrito: fonteMat(0x1D400, 0x1D41A, 0x1D7CE),
    italico: fonteMat(0x1D434, 0x1D44E, 0, { h: "ℎ" }),
    negItal: fonteMat(0x1D468, 0x1D482),
    curs: fonteMat(0x1D49C, 0x1D4B6, 0, { B: "ℬ", E: "ℰ", F: "ℱ", H: "ℋ", I: "ℐ", L: "ℒ", M: "ℳ", R: "ℛ", e: "ℯ", g: "ℊ", o: "ℴ" }),
    cursNeg: fonteMat(0x1D4D0, 0x1D4EA),
    got: fonteMat(0x1D504, 0x1D51E, 0, { C: "ℭ", H: "ℌ", I: "ℑ", R: "ℜ", Z: "ℨ" }),
    gotNeg: fonteMat(0x1D56C, 0x1D586),
    dup: fonteMat(0x1D538, 0x1D552, 0x1D7D8, { C: "ℂ", H: "ℍ", N: "ℕ", P: "ℙ", Q: "ℚ", R: "ℝ", Z: "ℤ" }),
    sans: fonteMat(0x1D5A0, 0x1D5BA, 0x1D7E2),
    sansNeg: fonteMat(0x1D5D4, 0x1D5EE, 0x1D7EC),
    sansItal: fonteMat(0x1D608, 0x1D622),
    sansNegItal: fonteMat(0x1D63C, 0x1D656),
    mono: fonteMat(0x1D670, 0x1D68A, 0x1D7F6),
    largo: fonteMat(0xFF21, 0xFF41, 0xFF10),
    bolha: fonteMat(0x24B6, 0x24D0, 0, { "0": "⓪", "1": "①", "2": "②", "3": "③", "4": "④", "5": "⑤", "6": "⑥", "7": "⑦", "8": "⑧", "9": "⑨" }),
    bolhaP: (ch) => /[a-z]/i.test(ch) ? String.fromCodePoint(0x1F150 + ch.toUpperCase().charCodeAt(0) - 65) : ch,
    quad: (ch) => /[a-z]/i.test(ch) ? String.fromCodePoint(0x1F130 + ch.toUpperCase().charCodeAt(0) - 65) : ch,
    quadP: (ch) => /[a-z]/i.test(ch) ? String.fromCodePoint(0x1F170 + ch.toUpperCase().charCodeAt(0) - 65) : ch,
    paren: (ch) => /[a-z]/i.test(ch) ? String.fromCodePoint(0x249C + ch.toLowerCase().charCodeAt(0) - 97) : ch,
    vers: mapa("abcdefghijklmnopqrstuvwxyz", "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ"),
    peq: mapa("abcdefghijklmnopqrstuvwxyz0123456789", "ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖᑫʳˢᵗᵘᵛʷˣʸᶻ⁰¹²³⁴⁵⁶⁷⁸⁹"),
    subN: mapa("abcdefghijklmnopqrstuvwxyz", "ₐᵦᵪdₑfgₕᵢⱼₖₗₘₙₒₚqᵣₛₜᵤᵥwₓᵧz"),
    orient: mapa("abcdefghijklmnopqrstuvwxyz", "卂乃匚ᗪ乇千Ꮆ卄丨ﾌҜㄥ爪几ㄖ卩Ɋ尺丂ㄒㄩᐯ山乂ㄚ乙"),
    grego: mapa("abcdefghijklmnopqrstuvwxyz", "αв¢∂єƒgнιנкℓмησρqяѕтυνωχуz"),
    estranho: mapa("abcdefghijklmnopqrstuvwxyz", "ąცƈɖɛʄɠɧıʝƙƖɱŋơ℘զཞʂɬųυῳҳყʑ"),
    inv: mapa("abcdefghijklmnopqrstuvwxyz", "ɐqɔpǝɟƃɥᴉɾʞlɯuodbɹsʇnʌʍxʎz"),
    bem: mapa("abcdefghijklmnopqrstuvwxyz", "ᗩᗷᑕᗪEᖴGᕼIᒍKᒪᗰᑎOᑭᑫᖇᔕTᑌᐯᗯ᙭Yᘔ")
};

// -------------------------------------------------
// 🎨 ESTILOS POR CATEGORIA
// -------------------------------------------------
const CATEGORIAS = [
    ["🔤 FONTES", [
        ["Negrito", t => ap(t, F.negrito)],
        ["Itálico", t => ap(t, F.italico)],
        ["Negrito itálico", t => ap(t, F.negItal)],
        ["Cursiva", t => ap(t, F.curs)],
        ["Cursiva negrito", t => ap(t, F.cursNeg)],
        ["Gótica", t => ap(t, F.got)],
        ["Gótica negrito", t => ap(t, F.gotNeg)],
        ["Contorno", t => ap(t, F.dup)],
        ["Moderna", t => ap(t, F.sans)],
        ["Moderna negrito", t => ap(t, F.sansNeg)],
        ["Moderna itálico", t => ap(t, F.sansItal)],
        ["Moderna forte", t => ap(t, F.sansNegItal)],
        ["Máquina de escrever", t => ap(t, F.mono)],
        ["Largo", t => ap(t, F.largo)],
        ["Versalete", t => ap(t, F.vers)],
        ["Pequenininho", t => ap(t, F.peq)],
        ["Subscrito", t => ap(t, F.subN)]
    ]],
    ["🅰️ EM CÍRCULOS E CAIXAS", [
        ["Bolhas", t => ap(t, F.bolha)],
        ["Bolhas pretas", t => ap(t, F.bolhaP)],
        ["Quadrados", t => ap(t, F.quad)],
        ["Quadrados pretos", t => ap(t, F.quadP)],
        ["Parênteses", t => ap(t, F.paren)],
        ["Caixa BR", t => ap(t, F.bem)]
    ]],
    ["🌍 ESTRANGEIRO E DIFERENTE", [
        ["Oriental", t => ap(t, F.orient)],
        ["Grego", t => ap(t, F.grego)],
        ["Estranho", t => ap(t, F.estranho)],
        ["De cabeça pra baixo", t => [...ap(t, F.inv)].reverse().join("")]
    ]],
    ["〰️ RISCADOS E LINHAS", [
        ["Riscado", t => mk(t, "̶")],
        ["Riscado ondulado", t => mk(t, "̴")],
        ["Sublinhado", t => mk(t, "̲")],
        ["Sublinhado duplo", t => mk(t, "̳")],
        ["Linha em cima", t => mk(t, "̅")],
        ["Setinha em cima", t => mk(t, "⃗")],
        ["Glitch", t => mk(ap(t, F.negrito), "͒")]
    ]],
    ["✨ ESPAÇADOS", [
        ["Espaçado", t => [...ap(t.toUpperCase(), F.largo)].join(" ")],
        ["Pontos entre letras", t => [...t].join("•")],
        ["Traços entre letras", t => [...t].join("-")],
        ["Estrelas entre letras", t => [...t].join("✦")],
        ["Corações entre letras", t => [...t].join("♡")]
    ]],
    ["🎮 GAMER E FREE FIRE", [
        ["Gamer", t => `꧁༒☬ ${ap(t, F.gotNeg)} ☬༒꧂`],
        ["Gamer caixa", t => `『${ap(t, F.sansNeg)}』`],
        ["Gamer blocos", t => `▛▘${ap(t, F.negrito)}▝▟`],
        ["Free Fire", t => `乂${ap(t, F.vers)}乂`],
        ["Free Fire 2", t => `꧁${ap(t, F.gotNeg)}꧂`],
        ["Tribal", t => `⫷ ${ap(t, F.orient)} ⫸`],
        ["Royal", t => `♔ ${ap(t, F.gotNeg)} ♔`],
        ["Pixel", t => `▓ ${ap(t, F.mono)} ▓`],
        ["Néon", t => `✧ ${ap(t, F.sansNeg)} ✧`]
    ]],
    ["👑 COM SÍMBOLOS", [
        ["Rei", t => `♛ ${ap(t, F.negrito)} ♛`],
        ["Coroa", t => `👑 ${ap(t, F.sansNeg)} 👑`],
        ["Asas", t => `𓆩 ${ap(t, F.sansNeg)} 𓆪`],
        ["Estrela", t => `★彡 ${ap(t, F.cursNeg)} 彡★`],
        ["Fogo", t => `🔥 ${ap(t, F.negrito)} 🔥`],
        ["Raio", t => `⚡ ${ap(t, F.orient)} ⚡`],
        ["Espada", t => `⚔️ ${ap(t, F.gotNeg)} ⚔️`],
        ["Caveira", t => `☠️ ${ap(t, F.vers)} ☠️`],
        ["Diamante", t => `◆ ${ap(t, F.sansNeg)} ◆`],
        ["Coração", t => `♡ ${ap(t, F.curs)} ♡`],
        ["Lua", t => `☾ ${ap(t, F.curs)} ☽`],
        ["Borboleta", t => `🦋 ${ap(t, F.cursNeg)} 🦋`],
        ["Cereja", t => `🍒 ${ap(t, F.sans)} 🍒`],
        ["Trevo", t => `☘️ ${ap(t, F.negrito)} ☘️`],
        ["Setas", t => `➸ ${ap(t, F.sansNeg)} ➸`],
        ["Ondas", t => `∿ ${ap(t, F.sansNeg)} ∿`]
    ]],
    ["🌸 FLORES E FOFO", [
        ["Flor", t => `✿ ${ap(t, F.curs)} ✿`],
        ["Flor 2", t => `❀ ${ap(t, F.cursNeg)} ❀`],
        ["Colchetes", t => `「 ${ap(t, F.vers)} 」`],
        ["Colchetes cheios", t => `【 ${ap(t, F.negrito)} 】`],
        ["Chaves enfeitadas", t => `꧁ ${ap(t, F.curs)} ꧂`],
        ["Clássico", t => `•°• ${ap(t, F.curs)} •°•`],
        ["Linha dupla", t => `║ ${ap(t, F.negrito)} ║`]
    ]]
];

// Lista achatada (todos os estilos em sequência), usada pra numerar.
const TODOS = CATEGORIAS.flatMap(([, estilos]) => estilos);

function prefixo() {
    try {
        const db = JSON.parse(require("fs").readFileSync(require("path").join(__dirname, "../../database/botconfig.json"), "utf8"));
        if (typeof db.PREFIX === "string" && db.PREFIX.trim()) return db.PREFIX.trim();
    } catch {}
    return config.PREFIX;
}

// Tira acento (fontes especiais não têm letra acentuada) e limita o tamanho.
function limparNome(texto) {
    return String(texto || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim().slice(0, 20);
}

// -------------------------------------------------
// ✨ <prefixo>nick <nome>
// -------------------------------------------------
async function cmdNick(sock, msg, args) {
    const from = msg.key.remoteJid;
    const P = prefixo();
    const nome = limparNome(args.join(" "));
    if (!nome) {
        return sock.sendMessage(from, {
            text: `✨ *GERADOR DE NICK*\n\nDigite o nome junto com o comando.\nEx.: *${P}nick Lucas*\n\nPra ver os estilos: *${P}tabela*`
        }, { quoted: msg });
    }

    let n = 0;
    const blocos = CATEGORIAS.map(([cat, estilos]) => {
        const linhas = estilos.map(([, fn]) => {
            n++;
            let r; try { r = fn(nome); } catch { r = nome; }
            return `*${String(n).padStart(2, "0")}* ➜ ${r}`;
        });
        return `${cat}\n${linhas.join("\n")}`;
    });

    return sock.sendMessage(from, {
        text: `✨ *NICKS PARA:* ${nome}\n(${TODOS.length} estilos)\n\n${blocos.join("\n\n")}\n\n✨ Segure em cima do nick pra copiar.\n✨ ${config.BOT_NAME}`
    }, { quoted: msg });
}

// -------------------------------------------------
// 📋 <prefixo>tabela
// -------------------------------------------------
async function cmdTabela(sock, msg) {
    const from = msg.key.remoteJid;
    const P = prefixo();
    const exemplo = "Nick";
    let n = 0;
    const blocos = CATEGORIAS.map(([cat, estilos]) => {
        const linhas = estilos.map(([titulo, fn]) => {
            n++;
            let r; try { r = fn(exemplo); } catch { r = exemplo; }
            return `*${String(n).padStart(2, "0")}* ${titulo}\n       ${r}`;
        });
        return `${cat}\n${linhas.join("\n")}`;
    });
    return sock.sendMessage(from, {
        text: `📋 *TABELA DE ESTILOS DE NICK*\n${TODOS.length} estilos, exemplo com "${exemplo}":\n\n${blocos.join("\n\n")}\n\n✨ Pra gerar com o seu nome: *${P}nick seu nome*\n✨ ${config.BOT_NAME}`
    }, { quoted: msg });
}

module.exports = { cmdNick, cmdTabela, TODOS };
