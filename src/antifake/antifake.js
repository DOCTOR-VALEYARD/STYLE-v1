const { getDB, saveDB } = require("../grupo-db/grupo-db");

// 🌎 ANTI-FAKE — liga/desliga por grupo. Quando ligado, número que NÃO for
// do Brasil (não começa com 55) é removido automaticamente ao entrar.
// Quem faz a remoção na entrada é o handler de group-participants (src/grupo).
async function antifake(sock, msg, args) {
    const from = msg.key.remoteJid;
    const db = getDB(); db[from] ||= {};
    db[from].antifake = !db[from].antifake;
    saveDB(db);
    const estado = db[from].antifake;
    const resp = estado
        ? `✅ *ANTI-FAKE ATIVADO*\n\n🌎 Agora, número que NÃO seja do Brasil (que não comece com *55*) é *removido automaticamente* ao entrar no grupo.\n\n⚠️ Eu preciso ser *admin* do grupo pra conseguir remover.`
        : `❌ *ANTI-FAKE DESATIVADO*\n\n🌎 Números de qualquer país podem entrar normalmente.`;
    await sock.sendMessage(from, { text: resp }, { quoted: msg });
}
module.exports = { antifake };
