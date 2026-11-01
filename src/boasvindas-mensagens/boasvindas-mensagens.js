/* =================================================
   🌀 STYLE-v1 — MENSAGENS DE ENTRADA E SAÍDA DO GRUPO
   📁 Arquivo: boasvindas-mensagens.js

   A ARTE (card) já traz o título "BEM-VINDO AO GRUPO" / "ATÉ A PRÓXIMA".
   Aqui ficam só os TEXTOS que vão na LEGENDA abaixo do card: a frase curta
   no tom da Rose Tyler, quem aceitou e as regras do grupo.
================================================= */

// 🌀 Chamadas de entrada — curtas, espertas, no universo Doctor Who / Rose Tyler
const chamadasEntrada = [
    "🌀 A TARDIS PAROU AQUI E TROUXE MAIS UM VIAJANTE.",
    "⏳ UMA NOVA LINHA TEMPORAL ACABA DE SE ABRIR.",
    "🚀 DETECTEI UM SINAL NOVO ATRAVESSANDO O VÓRTICE.",
    "💫 CHEGOU GENTE DE OUTRA DIMENSÃO — SEJA BEM-VINDO(A).",
    "🛸 MAIS UM TRIPULANTE EMBARCOU NESSA VIAGEM.",
    "🔮 O TEMPO MUDOU DE DIREÇÃO: ALGUÉM NOVO APARECEU.",
    "⚡ ENERGIA TEMPORAL DETECTADA — TEMOS COMPANHIA.",
    "🧭 AS COORDENADAS TROUXERAM UM ROSTO NOVO ATÉ NÓS.",
    "🌌 MAIS UMA ESTRELA ENTROU NESSA GALÁXIA.",
    "🕰️ O RELÓGIO GIROU E VOCÊ APARECEU. BOA ESCOLHA.",
    "🌀 BEM-VINDO(A) À VIAGEM — A TARDIS NÃO FAZ DEVOLUÇÕES.",
    "💥 UM PARADOXO A MENOS: CHEGOU QUEM FALTAVA.",
    "✨ A FENDA DO TEMPO SE ABRIU SÓ PRA TE DEIXAR ENTRAR.",
    "🚪 ATRAVESSOU A PORTA AZUL. AGORA JÁ ERA, É DOS NOSSOS.",
    "⏱️ CHEGOU NO TEMPO CERTO. COINCIDÊNCIA? NO TEMPO, NUNCA.",
];

// 🥀 Saídas — deboche fino estilo Rose Tyler, com referência temporal
const zoeirasSaida = [
    "🌀 @{nome} saltou pra outra linha temporal. Boa viagem... eu acho.",
    "⏳ @{nome} entrou no vórtice e não voltou. Acontece.",
    "🛸 @{nome} foi abduzido(a) por uma dimensão mais calma.",
    "💫 @{nome} se dissolveu no tempo. Nem a TARDIS rastreia.",
    "🚀 @{nome} pegou carona pra bem longe daqui.",
    "🕰️ @{nome} resetou a própria linha do tempo e sumiu.",
    "🔮 Previ: @{nome} ia embora. E olha só, previ certo.",
    "🌌 Mais uma estrela se apagou: @{nome} deixou a órbita.",
    "⚡ @{nome} queimou os circuitos e desapareceu no vórtice.",
    "🚪 @{nome} atravessou a porta de volta. Sem drama, sem saudade.",
    "🧭 @{nome} perdeu as coordenadas e se perdeu no tempo.",
    "🍃 @{nome} virou poeira estelar. Típico de quem não aguenta a viagem.",
    "🎬 Corta! @{nome} saiu de cena no meio do episódio.",
    "🥶 Nem um 'até mais': @{nome} escorregou por uma fenda temporal.",
    "📉 A frequência caiu: @{nome} saiu do ar do multiverso.",
    "🪐 @{nome} mudou de planeta. A gravidade daqui era muita.",
    "😏 @{nome} achou que ia fazer falta no continuum. Spoiler: não fez.",
    "🛰️ @{nome} perdeu o sinal com a TARDIS e flutuou pra longe.",
    "⌛ O tempo de @{nome} nesse grupo colapsou. Fim de transmissão.",
    "🌠 @{nome} virou lenda de outra era. Aqui já é passado.",
];

// 🖋️ Assinatura temporal
const SIG = "🌀";

function preencher(texto, nome) {
    return texto.replace(/\{nome\}/g, nome);
}

function gerarChamadaEntrada() {
    return chamadasEntrada[Math.floor(Math.random() * chamadasEntrada.length)];
}

function gerarZoeiraSaida(nome) {
    const escolhida = zoeirasSaida[Math.floor(Math.random() * zoeirasSaida.length)];
    return preencher(escolhida, nome);
}

// ─────────────────────────────────────────────────
// 📐 MONTAGEM DAS MENSAGENS (vão na legenda abaixo do card)
// ─────────────────────────────────────────────────
const LIMITE_LEGENDA = 950;

function limparRegras(texto) {
    return String(texto || "")
        .replace(/\r/g, "")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

function montarTextoRegras(regras, { nomeBot, nomeDono } = {}) {
    const rodape = nomeBot ? `\n\n${SIG} ${nomeBot}${nomeDono ? `\n👑 ${nomeDono}` : ""}` : "";
    return `〔 📜 ᴘʀᴏᴛᴏᴄᴏʟᴏs ᴅᴀ ʟɪɴʜᴀ ᴛᴇᴍᴘᴏʀᴀʟ 〕\n\n${limparRegras(regras)}${rodape}`;
}

// Devolve { legenda, regrasExtra }
function montarBemVindoPartes({ chamada, nomeUsuario, nomeGrupo, totalMembros, regras, autorAceite, semFoto, nomeBot, nomeDono }) {
    const topo = [
        `〔 🌀 ɴᴏᴠᴏ ᴠɪᴀᴊᴀɴᴛᴇ ɴᴀ ᴛᴀʀᴅɪs 〕`,
        "",
        chamada,
        "",
        `> 🧳 @${nomeUsuario}`,
        `> 🏷️ ${nomeGrupo}`,
        `> 👥 ${totalMembros} viajantes a bordo`
    ];
    if (autorAceite) topo.push(`> ✅ Autorizado(a) por @${autorAceite}`);

    const fim = ["", `💬 Se apresenta aí, viajante — ninguém gosta de passageiro invisível.`];
    if (semFoto) fim.push(`📸 _Sem foto de perfil — até os Senhores do Tempo têm um rosto._`);
    fim.push("", `${SIG} ${nomeBot}\n👑 ${nomeDono}`);

    const regrasLimpas = limparRegras(regras);
    const blocoRegras = regrasLimpas ? ["", `〔 📜 ᴘʀᴏᴛᴏᴄᴏʟᴏs ᴅᴀ ʟɪɴʜᴀ ᴛᴇᴍᴘᴏʀᴀʟ 〕`, "", regrasLimpas] : [];

    const completo = [...topo, ...blocoRegras, ...fim].join("\n");
    if (completo.length <= LIMITE_LEGENDA || !regrasLimpas) {
        return { legenda: completo, regrasExtra: null };
    }
    return {
        legenda: [...topo, "", `📜 _Os protocolos completos vêm logo abaixo_ 👇`, ...fim].join("\n"),
        regrasExtra: montarTextoRegras(regrasLimpas, { nomeBot, nomeDono })
    };
}

function montarMensagemBemVindo(dados) {
    return montarBemVindoPartes(dados).legenda;
}

// 📰 Saída. motivo: "saiu" | "removido"
function montarMensagemSaida({ zoeira, nomeGrupo, totalMembros, nomeBot, nomeDono, nomeUsuario, tempoNoGrupo, motivo, autor }) {
    const removido = motivo === "removido";
    const linhas = [
        `〔 ⏳ ʀᴜᴘᴛᴜʀᴀ ɴᴀ ʟɪɴʜᴀ ᴛᴇᴍᴘᴏʀᴀʟ 〕`,
        removido ? `🔨 *EXPULSO(A) DO CONTINUUM!*` : `🌀 *SALTOU PRA OUTRA DIMENSÃO!*`,
        "",
        zoeira,
        ""
    ];
    if (nomeUsuario) linhas.push(`> 🧳 @${nomeUsuario}`);
    linhas.push(`> 🏷️ ${nomeGrupo}`);
    if (tempoNoGrupo) linhas.push(`> ⏱️ Viajou ${tempoNoGrupo} com a gente`);
    if (removido && autor) linhas.push(`> 🔨 Removido(a) por @${autor}`);
    linhas.push(`> 👥 Restam ${totalMembros} viajantes`, "", `${SIG} ${nomeBot}\n👑 ${nomeDono}`);
    return linhas.join("\n");
}

module.exports = { gerarChamadaEntrada, gerarZoeiraSaida, montarMensagemBemVindo, montarBemVindoPartes, montarTextoRegras, montarMensagemSaida };
