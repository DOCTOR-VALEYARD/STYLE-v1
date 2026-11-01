/* =================================================
   🙋 STYLE-v1 — MENSAGENS DE SOLICITAÇÃO DE ENTRADA
   📁 Arquivo: solicitacao-mensagens.js

   Duas categorias:
   - pendente: quando alguém pede pra entrar (agradável, mas debochada)
   - recusada: quando um admin recusa (bem mais debochada/afiada)
================================================= */

const pendentes = [
    "🙏 Olha que cena: @{nome} tá de joelhos na porta implorando pra entrar. ADMs, vão ter pena ou não?",
    "😂 @{nome} mandou pedido de entrada com a mesma esperança de quem compra rifa. Decidam aí, ADMs.",
    "🚪 Toc toc! É @{nome}, implorando com olhinho brilhando. Eu deixava esperar mais um pouco… brincadeira. Ou não.",
    "🥺 @{nome} tá lá fora fazendo carinha de cachorro abandonado. ADMs, aguentam essa?",
    "📋 Novo currículo pra vaga de membro: @{nome}. Experiência: nenhuma. Vontade: absurda. Analisem.",
    "🙇 @{nome} pediu pra entrar com tanta educação que até eu desconfiei. ADMs, decidam.",
    "😏 @{nome} tá batendo na porta faz um tempinho. Vamos ver se algum ADM acorda hoje.",
    "🎰 @{nome} apostou tudo nesse pedido. Vai dar jackpot ou vai ficar chupando dedo? ADMs, rodem a roleta.",
    "🕯️ @{nome} acendeu vela, fez promessa e mandou pedido. Agora só falta um ADM com coração mole.",
    "🧎 Implorando nível máximo: @{nome} quer MUITO entrar. Tá até feio, ADMs, decidam logo.",
    "👀 @{nome} tá olhando pela fresta da porta igual vizinho fofoqueiro. Entra ou fica aí?",
    "🔔 Campainha tocando sem parar: é @{nome}. ADMs, alguém atende antes que quebre o botão.",
    "💌 @{nome} mandou pedido de entrada mais apaixonado que mensagem de 3h da manhã. Respondam com carinho (ou não).",
    "🪑 @{nome} puxou uma cadeira e sentou na porta. Pelo visto não vai embora tão cedo. ADMs?",
    "🐶 @{nome} tá abanando o rabinho na porta. Deixa entrar ou manda pra casinha, ADMs?",
    "⏳ Fila de espera: @{nome}. Tempo estimado: depende da preguiça dos ADMs.",
    "🤲 @{nome} juntou as mãozinhas e pediu por favor. Eu achei fofo. Os ADMs vão achar?",
    "📣 Atenção, ADMs: @{nome} quer entrar e tá fazendo drama na portaria.",
    "🍿 Pega a pipoca: @{nome} pediu pra entrar e agora o grupo inteiro vai assistir os ADMs decidirem.",
    "😩 @{nome} tá implorando tanto que eu já tô com vergonha alheia. ADMs, acabem com esse sofrimento.",
    "🎟️ @{nome} quer ingresso pro grupo mas veio sem convite. ADMs, liberam na pena?",
    "🧳 @{nome} já chegou com a mala na porta, certo de que vai entrar. Que confiança, hein? ADMs?",
    "🙈 @{nome} pediu pra entrar e agora tá fingindo que não tá ansioso(a). Tá sim. ADMs, decidam.",
    "📞 Ligação a cobrar da portaria: é @{nome} pedindo pra entrar. Aceitam a chamada, ADMs?",
    "🥹 @{nome} jurou que é legal, que participa e que não some. Todo mundo fala isso. ADMs, confiam?",
];

const recusadas = [
    "😂 Toma essa, @{nome}! @{quemRecusou} chegou e disse: NÃO. Sem choro.",
    "🚫 @{quemRecusou} bateu o martelo: @{nome} fica de fora mesmo!",
    "🤡 Foi pro vinagre, @{nome}! @{quemRecusou} não quis nem saber.",
    "🎯 Recusado na cara dura: @{quemRecusou} disse que @{nome} não entra hoje... nem amanhã.",
    "🧊 Gelo puro: @{quemRecusou} congelou o pedido de @{nome} sem dó.",
    "🥊 Nocaute! @{quemRecusou} derrubou o pedido de @{nome} logo de cara.",
    "🛑 Pare tudo! @{quemRecusou} bloqueou a entrada de @{nome} sem pestanejar.",
    "😬 Que vexame, @{nome}... @{quemRecusou} recusou igual quem já esperava isso.",
    "🚪 Porta na cara: @{quemRecusou} não deixou @{nome} nem chegar perto.",
    "🙅 Nem começou e já acabou: @{quemRecusou} disse não pra @{nome}.",
    "💔 Sofreu, @{nome}! @{quemRecusou} recusou sem nem ler direito.",
    "🎬 Corta! @{quemRecusou} encerrou a cena de @{nome} antes de começar.",
    "🐢 Nem devagar entrou: @{quemRecusou} já cortou @{nome} de cara.",
    "🧨 Explodiu o sonho, @{nome}: @{quemRecusou} não deixou passar.",
    "🎭 Aplausos pra decisão de @{quemRecusou}, que mandou @{nome} de volta.",
    "🐍 Traição? Não, só @{quemRecusou} fazendo o trabalho e recusando @{nome}.",
    "📉 Ação de @{nome} despencou: @{quemRecusou} recusou o pedido na hora.",
    "🥶 Recusa gelada: @{quemRecusou} nem esquentou pra dizer não pra @{nome}.",
    "🎪 Show de recusa: @{quemRecusou} não deixou @{nome} nem tirar o chapéu.",
    "🐐 Bode expiatório da vez: @{nome}, recusado por @{quemRecusou} sem dó.",
    "🎲 Rolou o dado e deu recusa: @{quemRecusou} baniu a chance de @{nome} entrar.",
    "🍂 Caiu como folha de outono: pedido de @{nome} recusado por @{quemRecusou}.",
    "🐌 Nem deu tempo de tentar de novo: @{quemRecusou} já recusou @{nome}.",
    "🎈 Estourou o balão: @{quemRecusou} furou o sonho de @{nome} de entrar.",
    "🚷 Acesso negado igual catraca emperrada: @{quemRecusou} barrou @{nome}.",
    "🪦 RIP pedido de entrada de @{nome}. Causa da morte: @{quemRecusou}.",
    "🧻 @{quemRecusou} usou o pedido de @{nome} igual papel de rascunho: jogou fora.",
    "🐒 @{quemRecusou} não pensou duas vezes e chutou o pedido de @{nome} pra escanteio.",
    "🎟️ Ingresso negado: @{quemRecusou} não deixou @{nome} nem chegar na catraca.",
    "🧯 @{quemRecusou} apagou de vez a esperança de @{nome} entrar nesse grupo.",
    "🐙 @{quemRecusou} usou todos os braços pra empurrar @{nome} pra fora da fila.",
    "🎢 Que decepção, @{nome}: @{quemRecusou} não deixou nem a montanha-russa começar.",
    "🐦 Voou a esperança de @{nome} — @{quemRecusou} espantou igual quem afasta pombo.",
    "🥔 @{quemRecusou} tratou o pedido de @{nome} igual batata quente: largou na hora.",
    "🛎️ Ding dong, mas ninguém abriu: @{quemRecusou} deixou @{nome} do lado de fora.",
    "🤣 KKKKK @{nome} implorou, chorou e @{quemRecusou} fechou a porta na cara. Tchau, querido(a)!",
    "😹 @{nome} achou que ia entrar? @{quemRecusou} riu e recusou. Eu também ri.",
    "🚫 Recusado com sucesso! @{quemRecusou} mandou @{nome} implorar em outro grupo.",
    "🫡 @{quemRecusou} fez o serviço: @{nome} fica do lado de fora. Pode chorar ali no cantinho.",
    "😂 @{nome} passou horas implorando pra levar um NÃO de @{quemRecusou}. Valeu a pena? Não.",
    "🧹 @{quemRecusou} varreu o pedido de @{nome} pra debaixo do tapete. Próximo!",
];

function preencher(texto, valores) {
    let resultado = texto;
    for (const chave of Object.keys(valores)) {
        resultado = resultado.replace(new RegExp(`\\{${chave}\\}`, "g"), valores[chave]);
    }
    return resultado;
}

function gerarMensagemSolicitacao(nome) {
    const escolhida = pendentes[Math.floor(Math.random() * pendentes.length)];
    return preencher(escolhida, { nome });
}

function gerarMensagemRecusa(nome, quemRecusou) {
    const escolhida = recusadas[Math.floor(Math.random() * recusadas.length)];
    return preencher(escolhida, { nome, quemRecusou });
}

module.exports = { gerarMensagemSolicitacao, gerarMensagemRecusa };
