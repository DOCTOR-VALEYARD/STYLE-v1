/* =====================================================================
   🌀 STYLE-v1 — DICIONÁRIO DE VARIAÇÕES (DETECÇÃO)
   Arquivo dedicado só pra RECONHECER o que a pessoa quis dizer, mesmo com
   abreviação, gíria da geração Z, erro de digitação, letra repetida e sem
   acento. Pra o bot entender mais jeitos de falar, é só ADICIONAR itens
   nas listas (frases = multi-palavra; tokens = palavra/abreviação solta).
   ===================================================================== */

// Normaliza: minúsculo, sem acento, sem pontuação, e colapsa letras
// repetidas (oiiii -> oi, boom -> bom). Risadas são tratadas por regex à parte.
function normalizar(txt) {
    let t = String(txt || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    t = t.replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
    t = t.replace(/([a-z])\1{1,}/g, "$1"); // colapsa 2+ repetidas
    return t;
}

// Tudo já em forma normalizada (sem acento e sem letra repetida).
const CATEGORIAS = {
    bom_dia: {
        frases: ["bom dia", "bon dia", "boa dia", "bom dai", "b dia", "linda manha", "otimo dia", "dia abencoado", "bom diah", "dia de sol", "bom dia a todos", "bom dia galera", "bom dia grupo"],
        tokens: ["bomdia", "bd", "bdia", "bmd", "gm", "goodmorning", "diaa"]
    },
    boa_tarde: {
        frases: ["boa tarde", "bon tarde", "otima tarde", "boa tard", "tarde abencoada", "boa tarde a todos", "boa tarde galera", "b tarde"],
        tokens: ["boatarde", "bt", "btarde", "gt"]
    },
    boa_noite: {
        frases: ["boa noite", "bon noite", "otima noite", "boa noit", "bos sonhos", "bons sonhos", "noite abencoada", "boa noite a todos", "boa noite galera", "b noite"],
        tokens: ["boanoite", "bn", "bnoite", "gn", "noitee"]
    },
    oi: {
        frases: ["e ai", "eai", "e ae", "fala tu", "fala ai", "fala comigo", "salve salve", "to de volta", "voltei", "alguem ai", "qr saber", "bao", "e noix", "fala mano", "fala mina", "e ai galera", "boa pra todos", "bom fds", "bom fim de semana"],
        tokens: ["oi", "oie", "oii", "ola", "opa", "eae", "eai", "salve", "iai", "fala", "coe", "cohe", "dale", "hey", "hi", "hello", "e", "aew", "sdd", "bb", "psps", "oia", "ola"]
    },
    tudo_bem: {
        frases: ["tudo bem", "td bem", "td bm", "tudo certo", "tudo tranquilo", "como vc esta", "como voce esta", "como vai", "ta bem", "de boa", "na paz", "tudo joia", "como ta", "tranquilo ai", "ta tudo bem", "tudo ok", "beleza ai", "como que ta", "tudo blz", "ta de boa"],
        tokens: ["tdbm", "tdb", "tdc", "deboa", "sussa", "numa", "sq", "tranks", "blz", "bls", "blza", "beleza", "belezura", "suave", "susa"]
    },
    tchau: {
        frases: ["ate mais", "ate logo", "ate depois", "ja vou", "to indo", "vou nessa", "fui nessa", "ate a proxima", "boa viagem", "falou e disparou", "vou indo", "ja to indo", "to saindo", "ate amanha", "boa noite a todos vou dormir"],
        tokens: ["tchau", "flw", "falou", "fui", "xau", "xauzinho", "bye", "adeus", "vlws", "fss", "flws", "byee"]
    },
    obrigado: {
        frases: ["muito obrigado", "muito obrigada", "obrigado por", "obrigada por", "valeu mesmo", "gratidao total", "agradeco", "mt obg", "mto obrigado", "valeu demais", "deus te pague", "obg por tudo"],
        tokens: ["obrigado", "obrigada", "obg", "obgd", "obgada", "obgdo", "vlw", "valeu", "vls", "grato", "grata", "gratidao", "ty", "thanks", "thx", "brigado", "brigada", "brigadao"]
    },
    elogio: {
        frases: ["muito bom", "bom demais", "top demais", "que massa", "ficou show", "ficou top", "voce e demais", "que legal", "da hora", "ta de mais", "arrasou", "melhor bot", "voce e incrivel", "bot top", "mt bom", "que bot bom", "amei esse bot", "voce manda bem"],
        tokens: ["top", "massa", "show", "incrivel", "perfeito", "amei", "adorei", "sensacional", "fera", "genial", "foda", "monstro", "brabo", "braba", "chave", "goat", "mito", "lendario", "topzera"]
    },
    palavrao: {
        // Resposta estilo Rose Tyler (sem repetir o palavrao). Vem LIGADO por padrão.
        frases: ["vai se fuder", "vai se foder", "foda se", "foda ce", "vai tomar no cu", "vai a merda", "filho da puta", "que porra e essa", "que merda", "sua besta", "vai pra pqp", "toma no cu", "vtnc seu bot", "seu lixo"],
        tokens: [
            // abreviações geração Z
            "pqp", "vsf", "vtnc", "vtmnc", "tnc", "tmnc", "krl", "krlh", "crl", "crlh", "fdp", "pnc",
            "fds", "fodase", "vsfd", "vtfc",
            // palavras (normalizadas: sem acento, repetidas colapsadas)
            "merda", "bosta", "pora", "carai", "caralho", "cacete", "puta", "putaria", "viado", "viada", "corno", "arombado", "arombada",
            "otario", "otaria", "idiota", "imbecil", "babaca", "escroto", "escrota", "desgraca", "desgracado", "lixo", "buro", "bura",
            "retardado", "retardada", "animal", "jumento", "trouxa", "palhaco", "cuzao", "fdputa", "piranha", "vagabundo", "vagabunda"
        ]
    },
    provocacao: {
        frases: ["bot buro", "bot lixo", "voce e fraco", "bot ruim", "ta travado", "nao sabe nada", "robo zuado", "bot quebrado", "voce nao presta", "duvido voce", "bot inutil", "bot ruim demais", "que bot ruim"],
        tokens: ["bugado", "travado", "noob", "lixo", "fraco", "ruim", "inutil", "zuado", "lerdo"]
    },
    risada: { frases: [], tokens: [] },
    curiosidade: {
        frases: ["me conta algo", "fala uma curiosidade", "me conta uma curiosidade", "voce sabe", "me ensina", "quem e voce", "o que voce faz", "voce e real", "voce pensa", "voce dorme", "de onde voce veio", "me surpreenda", "fala algo legal"],
        tokens: ["curiosidade"]
    }
};

// Risadas: kkk, rsrs, haha/hehe/hihi, auhsa, kd...
const RE_RISADA = /\b(k{2,}|(?: k){2,}|rs{1,}(?:rs)*|(?:ha){2,}|(?:he){2,}|(?:hi){2,}|a*(?:hua|uha|auh|hsa){1,}h*|kd+)\b/i;

function detectar(textoBruto) {
    const original = String(textoBruto || "");
    if (RE_RISADA.test(original.toLowerCase())) return "risada";

    const n = normalizar(original);
    if (!n) return null;
    const tokens = new Set(n.split(" "));

    // "fds" é ambíguo: em contexto de fim de semana é SAUDAÇÃO (não palavrão).
    // Checado ANTES do palavrão pra "bom fds" não virar alfinetada.
    const WEEKEND = ["bom fds", "otimo fds", "bom fim de semana", "bom final de semana", "otimo fim de semana", "feliz fds", "bom fds a todos", "otimo final de semana"];
    if (WEEKEND.some(w => n.includes(w))) return "oi";

    // Prioridade: palavrão e saudações específicas antes das genéricas.
    const ordem = ["palavrao", "bom_dia", "boa_tarde", "boa_noite", "tchau", "obrigado", "elogio", "provocacao", "tudo_bem", "curiosidade", "oi"];
    for (const cat of ordem) {
        const { frases, tokens: toks } = CATEGORIAS[cat];
        if (frases.some(f => n === f || n.includes(f))) return cat;
        if (toks.some(t => tokens.has(t))) return cat;
    }
    return null;
}

module.exports = { detectar, normalizar, CATEGORIAS };
