/* =================================================
   💣 DEMONNY BOT — NUKE (limpar o grupo)
   📁 Arquivo: nuke.js

   <prefixo>nuke     → remove TODO MUNDO do grupo (por remessas, com pausa,
                        pra não tomar bloqueio do WhatsApp), deixando só:
                            • o dono do bot
                            • o próprio bot
                            • o criador do grupo

   ⚠️ SÓ O DONO DO BOT pode usar. SEM confirmação: executou, limpa.
   Ação irreversível: quem sai só volta sendo adicionado ou pelo link.
================================================= */
const config = require("../../config");
const { ehDono } = require("../utils-validacao/utils-validacao");

const norm = (id) => String(id || "").split(":")[0].split("@")[0];

async function cmdNuke(sock, msg, args) {
    const from = msg.key.remoteJid;
    const autor = msg.key.participant || msg.key.participantAlt || from;

    if (!from.endsWith("@g.us")) {
        return sock.sendMessage(from, { text: "💣 O *nuke* só funciona dentro de um grupo." }, { quoted: msg });
    }

    // 🔐 Só o dono do bot
    if (!msg.key.fromMe && !ehDono([autor, msg.key.participantAlt, from], config.OWNER_NUMBER)) {
        return sock.sendMessage(from, { text: "🚫 Só o *dono do bot* pode usar o nuke." }, { quoted: msg });
    }

    let meta;
    try { meta = await sock.groupMetadata(from); }
    catch { return sock.sendMessage(from, { text: "❌ Não consegui ler os dados do grupo agora. Tente de novo." }, { quoted: msg }); }

    // 🤖 O bot é admin aqui?
    const eusJids = [sock.user?.id, sock.user?.lid].filter(Boolean).map(norm);
    const souAdmin = meta.participants.some(p => eusJids.includes(norm(p.id)) || eusJids.includes(norm(p.lid)) ? !!p.admin : false);
    if (!souAdmin) {
        return sock.sendMessage(from, { text: "❌ Eu preciso ser *admin* do grupo pra remover os membros." }, { quoted: msg });
    }

    // 🛡️ Quem NUNCA é removido: dono do bot, o próprio bot e o criador do grupo
    const donoNums = norm(config.OWNER_NUMBER);
    const criador = norm(meta.owner || meta.founder || "");
    const protegidos = new Set([...eusJids, donoNums, criador, norm(autor)].filter(Boolean));

    const alvos = meta.participants
        .map(p => ({ id: p.id, lid: p.lid }))
        .filter(p => !protegidos.has(norm(p.id)) && !protegidos.has(norm(p.lid)))
        .map(p => p.id);

    if (!alvos.length) {
        return sock.sendMessage(from, { text: "ℹ️ Não há ninguém pra remover (só sobraram você, o bot e o criador do grupo)." }, { quoted: msg });
    }

    await sock.sendMessage(from, { text: `💣 Limpando o grupo... removendo ${alvos.length} membro(s) por remessas. Aguarde.` }, { quoted: msg });

    // Remove em lotes pequenos, com pausa, pra não tomar bloqueio do WhatsApp.
    let removidos = 0, falhas = 0;
    const LOTE = 5;
    for (let i = 0; i < alvos.length; i += LOTE) {
        const parte = alvos.slice(i, i + LOTE);
        try {
            await sock.groupParticipantsUpdate(from, parte, "remove");
            removidos += parte.length;
        } catch (e) {
            // tenta um por um antes de desistir desse lote
            for (const alvo of parte) {
                try { await sock.groupParticipantsUpdate(from, [alvo], "remove"); removidos++; }
                catch { falhas++; }
                await new Promise(r => setTimeout(r, 400));
            }
        }
        if (i + LOTE < alvos.length) await new Promise(r => setTimeout(r, 1200));
    }

    return sock.sendMessage(from, {
        text:
            `💣 *NUKE CONCLUÍDO*\n\n` +
            `✅ Removidos: *${removidos}*\n` +
            (falhas ? `⚠️ Não consegui remover: *${falhas}* (provável admin ou criador)\n` : "") +
            `\n🌸 ${config.BOT_NAME}`
    }, { quoted: msg });
}

module.exports = { cmdNuke };
