// src/rank.js - VER RANKING DO BANCO DE DADOS
const fs = require("fs");
const path = require("path");
const config = require("../../config");

const dbPath = path.join(__dirname, "../../database/usuarios.json");

function lerDB() {
    if (!fs.existsSync(dbPath)) return {};
    try { return JSON.parse(fs.readFileSync(dbPath, "utf8")); } catch { return {}; }
}

function fmt(n) {
    try { return Number(n || 0).toLocaleString("pt-BR"); } catch { return String(n || 0); }
}

// 😏 Mensagens debochadas do ranking (vão como legenda, abaixo do card)
const DEB_RANK = [
    "🏆 Olha o ranking! Uns mandam ver no grupo... outros só enfeitam. Cadê você aí? 😏",
    "📊 Subiu de nível? Então aparece. Tá no fim da lista? Senta e chora. Kkk.",
    "👑 O topo é dos fortes. O resto fica no aquecimento.",
    "🔥 Esse é o ranking dos que realmente existem no grupo. Os fantasmas que se cuidem.",
    "😎 Quem tá no topo manda, quem tá embaixo obedece. Simples assim.",
    "📈 Bora subir de nível, ou vai ficar aí embaixo enfeitando a lista?",
    "💪 Os brabos do grupo estão marcados. E você, tá fazendo por onde?",
    "🥇 Olha os campeões! O resto é só figurante da novela."
];
const debRank = () => DEB_RANK[Math.floor(Math.random() * DEB_RANK.length)];

// 🏆 Texto de reserva (se o card falhar)
function montarTextoRanking(usuarios) {
    const medalhas = ["🥇", "🥈", "🥉"];
    const linhas = [`〔 🏆 ʀᴀɴᴋɪɴɢ ᴅᴏ ɢʀᴜᴘᴏ 〕`, ""];
    usuarios.slice(0, 10).forEach((u, i) => {
        const pos = i < 3 ? medalhas[i] : `🔹 ${i + 1}º`;
        linhas.push(`${pos} ${u.nome || "Sem nome"}`);
        linhas.push(`      ⭐ Nível ${u.nivel || 1}  •  💰 ${fmt(u.ouro)} ouro`);
        linhas.push("");
    });
    linhas.push(debRank(), "", `🌀 ${config.BOT_NAME}`, `👑 ${config.OWNER_NAME}`);
    return linhas.join("\n");
}

async function rank(sock, msg, args) {
    const from = msg.key.remoteJid;
    const ehGrupo = String(from).endsWith("@g.us");
    const db = lerDB();
    const usuarios = Object.values(db).sort((a, b) => (b.nivel || 0) - (a.nivel || 0) || (b.xp || 0) - (a.xp || 0));

    if (usuarios.length === 0) {
        return sock.sendMessage(from, {
            text: `〔 🏆 ʀᴀɴᴋɪɴɢ ᴅᴏ ɢʀᴜᴘᴏ 〕\n\n😴 Ninguém pontuou ainda! Vai conversando que uma hora aparece aqui. 😏\n\n🌀 ${config.BOT_NAME}\n👑 ${config.OWNER_NAME}`
        }, { quoted: msg });
    }

    // 🖼️ foto do grupo (fundo do card) + 👥 marcação INVISÍVEL de todos (só em grupo)
    let fotoGrupo = null, todos = [];
    if (ehGrupo) {
        try { const { baixarBuffer } = require("../cardGenerator/cardGenerator"); fotoGrupo = await baixarBuffer(await sock.profilePictureUrl(from, "image")); } catch {}
        try { const m = await sock.groupMetadata(from); todos = (m.participants || []).map(p => p.id).filter(Boolean); } catch {}
    }

    const legenda = `${debRank()}\n\n🌀 ${config.BOT_NAME}\n👑 ${config.OWNER_NAME}`;
    const textoReserva = montarTextoRanking(usuarios);

    // 🎨 Card de imagem (foto do grupo esmaecida de fundo). Se falhar, cai pro texto.
    try {
        const { criarCardRanking } = require("../cards-81/cards-81");
        const png = await criarCardRanking({
            titulo: "RANKING",
            subtitulo: "quem mais manda ver no grupo",
            botName: config.BOT_NAME,
            fundoBuffer: fotoGrupo,
            lista: usuarios.slice(0, 10).map(u => ({ nome: u.nome, nivel: u.nivel || 1, ouro: u.ouro || 0 }))
        });
        // card + legenda debochada + marcação INVISÍVEL de todos
        if (png) return await sock.sendMessage(from, { image: png, caption: legenda, mentions: todos }, { quoted: msg });
    } catch (e) {
        console.error("⚠️ [rank] card falhou, enviando texto:", e?.message || e);
    }

    await sock.sendMessage(from, { text: textoReserva, mentions: todos }, { quoted: msg });
}

module.exports = { rank };
