/* =====================================================================
   🌀 STYLE-v1 — MOTOR DE MENSAGENS (COMBINATÓRIO) — tema Doctor Who / Rose Tyler
   Em vez de milhares de frases fixas, cada categoria tem "gavetas" que se
   combinam (abertura × núcleo × fecho × emoji) → de milhares a MILHÕES de
   mensagens únicas. Trava anti-repetição por categoria (não repete até rodar
   bastante). Só ADICIONAR itens nas gavetas pra ampliar à vontade.
   ===================================================================== */

const EMOJIS = ["🌀", "⏳", "🚀", "💫", "🔮", "⚡", "🛸", "🕰️", "🌌", "✨", "🪐", "🧭"];

// Gavetas por categoria. Cada uma: { ab: aberturas, nu: núcleos, fe: fechos }.
const G = {
    bom_dia: {
        ab: ["Ei, viajante!", "Olha quem materializou na TARDIS:", "Fenda temporal aberta —", "Detectei energia nova no vórtice:", "Boas-vindas de volta a esta linha temporal:", "O console da TARDIS piscou:", "Alguém reapareceu no espaço-tempo:", "Sinal captado através das eras:", "Cronômetro reiniciado —", "A manhã atravessou o vórtice:"],
        nu: ["bom dia pra quem corre contra o tempo", "bom dia, e que sua timeline hoje seja lendária", "bom dia, viajante do tempo e do espaço", "bom dia; a aventura começou de novo", "bom dia, a TARDIS já está aquecendo os motores", "bom dia pra quem não teme paradoxos", "bom dia, o universo inteiro cabe no seu dia", "bom dia, Senhor(a) do Tempo", "bom dia, e que nada apague a sua coragem", "bom dia, o tempo é relativo mas o café é obrigatório", "bom dia, mais um dia pra reescrever o destino", "bom dia, o vórtice está calmo hoje"],
        fe: ["O tempo não espera.", "Allons-y!", "Bora explorar antes que o vórtice feche.", "Fantástico, não?", "Corre, que a aventura não dura pra sempre.", "Mantenha a linha temporal firme.", "Nove vidas e nenhuma pra desperdiçar.", "O impossível é só o possível com atraso.", "A TARDIS está sempre de portas abertas.", "Que as estrelas te guiem."]
    },
    boa_tarde: {
        ab: ["Ei, viajante!", "O relógio da TARDIS marcou:", "Energia temporal estável —", "Olha quem cruzou o vórtice:", "Transmissão captada:", "O Big Ben ecoou pelas eras:", "Fluxo temporal ativo —", "Boa leitura nos sensores:"],
        nu: ["boa tarde pra quem domina o tempo", "boa tarde, a linha temporal segue firme", "boa tarde, viajante das estrelas", "boa tarde; que a jornada continue épica", "boa tarde, o vórtice está tranquilo agora", "boa tarde, metade da missão já foi vencida", "boa tarde, Senhor(a) do Tempo", "boa tarde, o universo ainda tem muito pra você", "boa tarde, que a próxima parada seja lendária", "boa tarde, nem o tempo segura a sua vibe"],
        fe: ["Mantenha o ritmo.", "A aventura continua.", "Allons-y!", "O impossível é logo ali.", "Que a tarde renda séculos.", "A TARDIS segue no rumo.", "Fantástico, não?", "Sem medo de paradoxo.", "O tempo corre, aproveite.", "Que as engrenagens girem a seu favor."]
    },
    boa_noite: {
        ab: ["Ei, viajante!", "As luzes da TARDIS baixaram:", "Fim de ciclo temporal —", "O vórtice silenciou:", "Sensores em modo noturno:", "A Lua atravessou o espaço-tempo:", "Transmissão final do dia:", "O console entrou em repouso:"],
        nu: ["boa noite pra quem viaja entre mundos", "boa noite, descanse — amanhã há novas eras pra explorar", "boa noite, viajante do tempo e do espaço", "boa noite; que seus sonhos cruzem galáxias", "boa noite, a TARDIS vela por você", "boa noite, recarregue as energias temporais", "boa noite, Senhor(a) do Tempo", "boa noite, até o próximo salto no tempo", "boa noite, o universo guarda o seu lugar", "boa noite, nem nos sonhos o tempo te alcança"],
        fe: ["Durma, viajante.", "Até o próximo salto.", "Que o vórtice te embale.", "Amanhã a aventura recomeça.", "As estrelas ficam de guarda.", "Bons sonhos através do tempo.", "A TARDIS espera o amanhecer.", "Descanse, herói(na).", "Boa viagem pelo mundo dos sonhos.", "Que nada perturbe a sua linha temporal."]
    },
    oi: {
        ab: ["Ei, viajante!", "Olha quem apareceu no vórtice:", "Sinal detectado —", "A TARDIS captou sua presença:", "Opa, energia temporal chegando:", "Fala comigo, viajante:", "Alguém cruzou o portal:", "Transmissão recebida:"],
        nu: ["e aí, pronto pra mais uma aventura?", "diga, em que posso ajudar nesta linha temporal?", "chegou chegando, hein? bora", "salve! o universo tava sentindo sua falta", "fala tu, viajante — a TARDIS está de prontidão", "oi! o tempo é curto, mas pra você eu abro uma exceção", "e aí, preparado(a) pra desafiar o impossível?", "opa! novas eras não se exploram sozinhas", "diga lá, parceiro(a) de viagem", "chegou! já pode apertar os cintos"],
        fe: ["Allons-y!", "A aventura te chama.", "Bora nessa.", "Fantástico te ver por aqui.", "O vórtice está aberto.", "Sem medo do impossível.", "A TARDIS é sua.", "Corre que o tempo voa.", "Que comece a jornada.", "Pra onde vamos hoje?"]
    },
    tudo_bem: {
        ab: ["Nos meus sensores:", "Pela leitura do console:", "Status da linha temporal:", "Verifiquei o vórtice e digo:", "Diagnóstico temporal:", "Olha, viajante,", "Pelo que o universo me conta,", "Resposta direto da TARDIS:"],
        nu: ["tudo em ordem no espaço-tempo, e com você?", "tudo nos conformes, sem paradoxos à vista", "tudo certo — a TARDIS nunca falha (quase)", "de boa, só viajando entre as eras", "tudo tranquilo, o vórtice está calmo hoje", "na paz, cruzando galáxias como sempre", "tudo ótimo, pronto pra mais uma aventura", "firme e forte através do tempo", "tudo sob controle, viajante", "na correria do costume: salvando linhas temporais"],
        fe: ["E você, como vai nessa linha?", "Bora que o tempo não para.", "Allons-y!", "Conta comigo.", "Sempre à disposição.", "O impossível é rotina por aqui.", "Firme na jornada.", "Que as estrelas te acompanhem.", "Partiu próxima era?", "Tudo flui no vórtice."]
    },
    tchau: {
        ab: ["Ei, viajante!", "A TARDIS liga os motores —", "Portal de saída aberto:", "Fim desta parada temporal:", "O vórtice te chama de volta:", "Despedida através das eras:", "O console pisca em despedida:", "Até a próxima linha temporal:"],
        nu: ["até a próxima, e que o tempo te seja gentil", "boa viagem pelas suas próprias eras", "vai com cuidado — paradoxos não perdoam", "até mais, viajante do tempo e do espaço", "que a próxima aventura seja épica", "fui! mas a TARDIS fica de portas abertas", "até logo; o universo é grande, a gente se cruza", "parte em paz, Senhor(a) do Tempo", "até breve, não suma por séculos", "boa jornada — e não mexa em linhas temporais fixas"],
        fe: ["Allons-y!", "A TARDIS te espera na volta.", "Boa viagem.", "Até o próximo salto.", "Que as estrelas te guiem.", "Sem saudade, só até logo.", "O vórtice guarda o seu lugar.", "Corre, viajante.", "Fantástico te ver por aqui.", "Até a próxima era."]
    },
    obrigado: {
        ab: ["Imagina, viajante!", "A TARDIS agradece de volta:", "Que nada —", "Honra minha, Senhor(a) do Tempo:", "Fico feliz, companheiro(a) de viagem:", "De coração, através das eras:", "Tranquilo —", "É pra isso que cruzo o tempo:"],
        nu: ["ajudar é a minha missão em qualquer linha temporal", "sempre que precisar, é só chamar no vórtice", "é um prazer servir a um(a) viajante de verdade", "conte comigo em qualquer era", "estou aqui pra isso, do passado ao futuro", "a aventura é melhor acompanhada", "não há tempo nem espaço que me impeçam de ajudar", "disponha — a TARDIS nunca fecha", "fazer isso é fantástico demais", "servir viajantes é o meu propósito"],
        fe: ["Allons-y!", "Bora pra próxima.", "Sempre à disposição.", "O tempo é nosso.", "Fantástico, não?", "A jornada continua.", "Conte comigo.", "Que as estrelas te guiem.", "Firme na missão.", "Até o próximo salto."]
    },
    elogio: {
        ab: ["Awn, viajante!", "A TARDIS corou:", "Olha ele(a) sendo gente boa:", "Fico lisonjeada através das eras:", "Modéstia à parte,", "Rose Tyler aprovaria:", "Energia positiva captada:", "Isso aqueceu meus circuitos temporais:"],
        nu: ["obrigada! feito com carinho em todas as linhas temporais", "que bom que curtiu, viajante", "fico feliz — a gente capricha de era em era", "é, eu me esforço pra ser fantástica mesmo", "valeu! você também é brilhante", "elogio de viajante vale ouro cósmico", "a TARDIS inteira agradece", "feito pra impressionar através do tempo", "você tem bom gosto intergaláctico", "assim você me deixa sem combustível temporal"],
        fe: ["Allons-y!", "Bora pra mais.", "Fantástico, não?", "O impossível é só o começo.", "Que venham as próximas eras.", "Você é dos bons.", "A jornada só melhora.", "Obrigada, viajante.", "Firme na nave.", "Até a próxima aventura."]
    },
    palavrao: {
        ab: ["Calma lá, viajante —", "Oh, que boca:", "A TARDIS ouviu isso:", "Olha o linguajar, humano:", "Baixa a bola:", "Rose Tyler nem piscaria:", "Energia de birra detectada:", "Palavrão? Sério mesmo?"],
        nu: ["já enfrentei Daleks, seu palavrão não me arranha", "900 anos de universo e é isso que você traz?", "respeita quem controla o tempo e o espaço", "xingar não acelera nenhuma linha temporal", "guarda essa energia pra algo que preste", "nem o Mestre falava assim comigo", "o vórtice não tem paciência pra grosseria", "educação atravessa dimensões — tenta uma hora dessas", "isso aí não me move nem um segundo no tempo", "a TARDIS já viu coisa bem mais assustadora que você"],
        fe: ["Fim de transmissão.", "Próximo.", "Allons-y, com respeito.", "Respira e tenta de novo.", "O tempo cura até a grosseria.", "Volta quando evoluir.", "Segue a linha temporal.", "Sem crise.", "A nave continua.", "Educação é de graça."]
    },
    provocacao: {
        ab: ["Calma, viajante —", "Oh, um paradoxo ambulante:", "A TARDIS ouviu, e sorriu:", "Olha, humano:", "Interessante tentativa:", "Rose Tyler riria disso:", "Processando sua provocação... e ignorando:", "Energia de birra detectada:"],
        nu: ["já atravessei o fim do universo, sua alfinetada não me abala", "sou mais velha que a sua galáxia, maneja o respeito", "até um Dalek argumenta melhor, viajante", "tenho 900 anos de paciência, não gaste à toa", "paradoxo é comigo mesmo, provocação não", "insista — o vórtice adora uma boa comédia", "errou o alvo por algumas eras aí", "a TARDIS já viu coisa mais assustadora que você", "respeita quem controla o tempo, pequeno(a)", "nem o Mestre me irritou, você vai conseguir?"],
        fe: ["Allons-y, se tiver coragem.", "Próximo.", "Fantástico esforço... quase.", "O tempo cura até isso.", "Respira e tenta de novo.", "Volta quando evoluir.", "Segue a linha temporal.", "Sem crise, viajante.", "A nave continua.", "Fim de transmissão."]
    },
    risada: {
        ab: ["Hahaha!", "Essa foi boa, viajante:", "A TARDIS riu junto:", "Até o vórtice vibrou:", "Rose Tyler aprovaria a piada:", "Captei o humor cósmico:", "Kkk, boa:", "Ri através das eras:"],
        nu: ["bom senso de humor pra quem viaja no tempo", "rir é o melhor combustível da TARDIS", "você e eu numa comédia intergaláctica", "humor assim atravessa dimensões", "até os Senhores do Tempo precisam rir", "essa merece entrar pros anais do vórtice", "mantém esse astral que a jornada fica leve", "piada boa dobra o espaço-tempo"],
        fe: ["Allons-y!", "Bora que tem mais.", "Fantástico!", "Segue o riso.", "A aventura fica leve assim.", "Que venham as próximas.", "O vórtice curtiu.", "Rindo pelas eras.", "Top demais.", "Até a próxima piada."]
    },
    curiosidade: {
        ab: ["Sabia, viajante?", "Direto dos arquivos de Gallifrey:", "A TARDIS me contou:", "Curiosidade temporal:", "Dos confins do universo:", "Rose anotaria essa:", "Fato captado no vórtice:", "Segredo do espaço-tempo:"],
        nu: ["o tempo não é uma linha reta — é mais um emaranhado", "a TARDIS é maior por dentro, assim como as boas ideias", "existe mais estrela no céu do que grão de areia na Terra", "um dia em outro planeta pode durar anos aqui", "o som do universo é quase um sussurro grave e eterno", "viajar no tempo muda o viajante, não só o destino", "até o impossível tem data marcada pra acontecer", "a coragem de um humano já salvou galáxias inteiras", "cada escolha abre uma nova linha temporal", "o maior mistério do universo ainda é a gentileza"],
        fe: ["Fantástico, não?", "Allons-y pra descobrir mais.", "O universo é generoso.", "Pensa nisso.", "A jornada ensina.", "Que venham mais mistérios.", "O vórtice guarda segredos.", "Curiosidade move o tempo.", "Até a próxima descoberta.", "Guarda essa."]
    }
};

const aleat = (a) => a[Math.floor(Math.random() * a.length)];

// 🔁 Trava anti-repetição: guarda as últimas N mensagens por categoria e
// re-sorteia se cair numa repetida recente (o espaço é tão grande que raramente
// repete). Memória leve (não guarda milhões, só o histórico recente).
const historico = new Map(); // categoria -> Set recente
const LIMITE_HIST = 300;

function registrar(cat, msg) {
    if (!historico.has(cat)) historico.set(cat, []);
    const h = historico.get(cat);
    h.push(msg);
    if (h.length > LIMITE_HIST) h.shift();
}
function repetiuRecente(cat, msg) {
    const h = historico.get(cat);
    return h ? h.includes(msg) : false;
}

function responder(categoria) {
    const g = G[categoria];
    if (!g) return null;
    let msg = "";
    for (let tentativa = 0; tentativa < 8; tentativa++) {
        msg = `${aleat(g.ab)} ${aleat(g.nu)}. ${aleat(g.fe)} ${aleat(EMOJIS)}`.replace(/\s+/g, " ").trim();
        if (!repetiuRecente(categoria, msg)) break;
    }
    registrar(categoria, msg);
    return msg;
}

// 📊 Quantas combinações únicas cada categoria consegue gerar
function combinacoes() {
    const out = {};
    let total = 0;
    for (const [cat, g] of Object.entries(G)) {
        const n = g.ab.length * g.nu.length * g.fe.length * EMOJIS.length;
        out[cat] = n; total += n;
    }
    out.TOTAL = total;
    return out;
}

module.exports = { responder, combinacoes, categorias: Object.keys(G), EMOJIS, G };
