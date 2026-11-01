/* =====================================================================
   🌀 STYLE-v1 — RPG TEMPORAL (universo Doctor Who)
   📁 src/rpg/rpg.js

   Um RPG leve e divertido embutido no bot, no tema Doctor Who / Rose Tyler.
   Reaproveita a economia que já existe (ouro / nível em database/usuarios.json)
   e guarda os dados de RPG num sub-objeto ".rpg" de cada jogador.

   O que tem:
     • Criar personagem escolhendo uma CLASSE (Senhor do Tempo, Companheiro,
       Dalek, Cyberman, Guardião da TARDIS).
     • LOJA DE VESTUÁRIO temática (compra com ouro e dá bônus de atributo).
     • BATALHA entre participantes DO GRUPO (marcando alguém).
     • ARENA GLOBAL: uma central que cruza TODOS os grupos — você registra seu
       personagem e desafia gente de outros grupos pelo código.
     • RANKING global, perfil, equipar, curar.

   🔓 TODOS os comandos são LIBERADOS: qualquer pessoa executa (membro, admin
   ou dono). Não tem nada de segurança aqui.

   🛡️ Tudo é best-effort e com try/catch: nunca derruba o bot.
   ===================================================================== */
const fs = require("fs");
const path = require("path");
const config = require("../../config");

const dbPath = path.join(__dirname, "../../database/usuarios.json");
const arenaPath = path.join(__dirname, "../../database/rpg-arena.json");

// ───────────────────────── util de banco ─────────────────────────
function getDB() {
    try { if (fs.existsSync(dbPath)) return JSON.parse(fs.readFileSync(dbPath, "utf8")); } catch {}
    return {};
}
function saveDB(d) { try { fs.writeFileSync(dbPath, JSON.stringify(d, null, 2)); } catch {} }
function getArena() {
    try { if (fs.existsSync(arenaPath)) return JSON.parse(fs.readFileSync(arenaPath, "utf8")); } catch {}
    return {};
}
function saveArena(d) { try { fs.writeFileSync(arenaPath, JSON.stringify(d, null, 2)); } catch {} }
function norm(id) { return String(id || "").split("@")[0].split(":")[0]; }
const rnd = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rnd(a.length)];
const fmt = (n) => { try { return Number(n || 0).toLocaleString("pt-BR"); } catch { return String(n || 0); } };

// ───────────────────────── CLASSES (DW) ──────────────────────────
// hp/atk/def = base. cada classe tem um "truque" usado na batalha.
const CLASSES = {
    senhor: {
        nome: "Senhor do Tempo", emoji: "🌀", aliases: ["senhor", "timelord", "senhordotempo", "lord", "1"],
        hp: 120, atk: 22, def: 16, truque: "regenera",
        desc: "Equilibrado. Pode REGENERAR no meio da luta (cura uma vez quando cai)."
    },
    companheiro: {
        nome: "Companheiro(a)", emoji: "💫", aliases: ["companheiro", "companion", "rose", "2"],
        hp: 110, atk: 20, def: 14, truque: "sorte",
        desc: "Corajoso e sortudo. Chance alta de GOLPE CRÍTICO (dano dobrado)."
    },
    dalek: {
        nome: "Dalek", emoji: "🛸", aliases: ["dalek", "3"],
        hp: 100, atk: 30, def: 10, truque: "exterminar",
        desc: "Puro ataque. EXTERMINAR: dano altíssimo, mas defesa fraca."
    },
    cyberman: {
        nome: "Cyberman", emoji: "⚙️", aliases: ["cyberman", "cyber", "4"],
        hp: 140, atk: 16, def: 24, truque: "blindagem",
        desc: "Tanque de metal. BLINDAGEM reduz o dano recebido. Difícil de cair."
    },
    guardiao: {
        nome: "Guardião da TARDIS", emoji: "🧭", aliases: ["guardiao", "guardião", "tardis", "piloto", "5"],
        hp: 115, atk: 21, def: 18, truque: "esquiva",
        desc: "Piloto ágil. ESQUIVA: chance de desviar completamente de um golpe."
    }
};
function acharClasse(txt) {
    const t = norm(String(txt || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")).trim();
    for (const k in CLASSES) if (k === t || CLASSES[k].aliases.includes(t)) return k;
    return null;
}

// ────────────────────── LOJA DE VESTUÁRIO (DW) ───────────────────
// tipo: arma (+atk) | armadura (+def) | traje (+hp) | reliquia (+crit%)
const VESTUARIO = {
    "1":  { nome: "Chave de Fenda Sônica", tipo: "arma", preco: 400, bonus: 12, emoji: "🔧" },
    "2":  { nome: "Blaster de Vórtice", tipo: "arma", preco: 900, bonus: 26, emoji: "⚡" },
    "3":  { nome: "Núcleo da TARDIS", tipo: "arma", preco: 1800, bonus: 48, emoji: "🌀" },
    "4":  { nome: "Jaqueta de Couro da Rose", tipo: "armadura", preco: 450, bonus: 14, emoji: "🧥" },
    "5":  { nome: "Casaco do Doutor", tipo: "armadura", preco: 950, bonus: 30, emoji: "🧣" },
    "6":  { nome: "Blindagem Cyber", tipo: "armadura", preco: 1900, bonus: 55, emoji: "⚙️" },
    "7":  { nome: "Terno de Gala Temporal", tipo: "traje", preco: 600, bonus: 30, emoji: "🤵" },
    "8":  { nome: "Traje Anti-Vácuo", tipo: "traje", preco: 1400, bonus: 70, emoji: "🧑‍🚀" },
    "9":  { nome: "Gravata Borboleta + Fez", tipo: "reliquia", preco: 700, bonus: 8, emoji: "🎩" },
    "10": { nome: "Óculos 3D do Doutor", tipo: "reliquia", preco: 1200, bonus: 14, emoji: "🕶️" }
};
const SLOT = { arma: "arma", armadura: "armadura", traje: "traje", reliquia: "reliquia" };

// ───────────────────── ESTRUTURA DO JOGADOR ──────────────────────
function garantirConta(db, id) {
    if (!db[id]) db[id] = { nivel: 1, xp: 0, ouro: 0 };
    if (typeof db[id].ouro !== "number") db[id].ouro = 0;
    if (typeof db[id].nivel !== "number") db[id].nivel = 1;
    return db[id];
}
function temPersonagem(db, id) { return !!(db[id] && db[id].rpg && db[id].rpg.classe); }
function novoRpg(classeKey, nome) {
    return {
        classe: classeKey, nome: nome || CLASSES[classeKey].nome,
        nivel: 1, xp: 0, vitorias: 0, derrotas: 0, pontos: 0,
        inventario: {}, equip: { arma: null, armadura: null, traje: null, reliquia: null },
        criadoEm: Date.now()
    };
}

// ───────────────── ATRIBUTOS CALCULADOS (classe + nível + vestuário) ─────────
function atributos(r) {
    const base = CLASSES[r.classe] || CLASSES.senhor;
    const lv = r.nivel || 1;
    let hp = base.hp + (lv - 1) * 14;
    let atk = base.atk + (lv - 1) * 4;
    let def = base.def + (lv - 1) * 3;
    let crit = base.truque === "sorte" ? 28 : 12; // % base de crítico
    const eq = r.equip || {};
    for (const slot of ["arma", "armadura", "traje", "reliquia"]) {
        const it = eq[slot] && VESTUARIO[eq[slot]];
        if (!it) continue;
        if (it.tipo === "arma") atk += it.bonus;
        else if (it.tipo === "armadura") def += it.bonus;
        else if (it.tipo === "traje") hp += it.bonus;
        else if (it.tipo === "reliquia") crit += it.bonus;
    }
    return { hp, atk, def, crit, classe: base };
}
function poderTotal(r) { const a = atributos(r); return Math.round(a.hp * 0.5 + a.atk * 2 + a.def * 1.5 + a.crit); }

// ───────────────────────── BATALHA ───────────────────────────────
// Simula uma luta por turnos entre dois personagens. Devolve { vencedor:0|1, log:[] }.
function batalhar(nomeA, rA, nomeB, rB) {
    const A = atributos(rA), B = atributos(rB);
    const lut = [
        { nome: nomeA, hp: A.hp, max: A.hp, a: A, regenerou: false },
        { nome: nomeB, hp: B.hp, max: B.hp, a: B, regenerou: false }
    ];
    const log = [];
    let vez = A.atk + rnd(10) >= B.atk + rnd(10) ? 0 : 1; // quem é mais rápido começa
    let turno = 0;

    while (lut[0].hp > 0 && lut[1].hp > 0 && turno < 30) {
        turno++;
        const at = lut[vez], df = lut[1 - vez];
        const cls = at.a.classe;

        // esquiva (Guardião)
        if (cls.truque === "esquiva" && rnd(100) < 22) {
            log.push(`🧭 ${df.nome} some e ${at.nome} erra o golpe no vórtice!`);
            vez = 1 - vez; continue;
        }

        // dano base
        let dano = Math.max(3, at.a.atk - Math.floor(df.a.def * 0.5) + rnd(10));
        let critico = rnd(100) < at.a.crit;
        if (cls.truque === "exterminar" && rnd(100) < 25) { dano = Math.round(dano * 2.1); log.push(`🛸 ${at.nome}: "EXTERMINAR!" — golpe devastador!`); critico = false; }
        if (critico) dano = Math.round(dano * 2);

        // blindagem (Cyberman) reduz o que recebe
        if (df.a.classe.truque === "blindagem" && rnd(100) < 40) dano = Math.round(dano * 0.55);

        df.hp -= dano;
        log.push(`${critico ? "💥 CRÍTICO! " : "⚔️ "}${at.nome} causa *${dano}* em ${df.nome}.`);

        // regeneração (Senhor do Tempo) quando cai pela 1ª vez
        if (df.hp <= 0 && df.a.classe.truque === "regenera" && !df.regenerou) {
            df.regenerou = true;
            df.hp = Math.round(df.max * 0.45);
            log.push(`🌀 ${df.nome} REGENERA e volta à luta com ${df.hp} de vida!`);
        }
        vez = 1 - vez;
    }

    let vencedor;
    if (lut[0].hp <= 0 && lut[1].hp <= 0) vencedor = rnd(2);
    else if (lut[1].hp <= 0) vencedor = 0;
    else if (lut[0].hp <= 0) vencedor = 1;
    else vencedor = lut[0].hp >= lut[1].hp ? 0 : 1; // tempo esgotou: vence quem tem mais vida

    // mantém o log curto (não cansar): primeiros + últimos lances
    let logCurto = log;
    if (log.length > 7) logCurto = [...log.slice(0, 4), "…", ...log.slice(-3)];
    return { vencedor, log: logCurto, vidaA: Math.max(0, lut[0].hp), vidaB: Math.max(0, lut[1].hp) };
}

// ───────────────── registra/atualiza na arena global ─────────────
function codigoDe(id) {
    // código curto e estável por jogador
    let h = 0; const s = norm(id);
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return "T" + (h % 100000).toString().padStart(5, "0");
}
function registrarArena(id, r, grupo) {
    const arena = getArena();
    const cod = codigoDe(id);
    arena[cod] = {
        codigo: cod, jid: id, nome: r.nome, classe: r.classe,
        nivel: r.nivel, pontos: r.pontos || 0, poder: poderTotal(r),
        grupo: grupo || "", atualizadoEm: Date.now(),
        snapshot: { classe: r.classe, nivel: r.nivel, equip: r.equip }
    };
    saveArena(arena);
    return cod;
}

// ───────────────────────── RÓTULOS / CARD ────────────────────────
const SIG = `🌀 ${config.BOT_NAME}`;
function barra(nome, prefixo = config.PREFIX) {
    return `╭───「 🌀 *RPG TEMPORAL* 」
│ 🎬 STYLE-v1 • TIME AND SPACE
╰───
${nome}`;
}
function painelMenu(P) {
    return `╭───「 🌀 *RPG TEMPORAL — PAINEL DA TARDIS* 」
│ Universo *Doctor Who* • aventure-se no tempo
╰───

🧬 *COMECE AQUI*
│ ${P}rpg criar <classe>  — cria seu viajante
│ ${P}rpg classes          — ver as classes
│ ${P}rpg perfil           — sua ficha

🧥 *VESTUÁRIO (loja temática)*
│ ${P}rpg loja             — ver vitrine
│ ${P}rpg comprar <id>     — comprar com ouro
│ ${P}rpg equipar <id>     — equipar item

⚔️ *BATALHA*
│ ${P}rpg batalhar @alguém — duelo no grupo
│ ${P}rpg arena            — entrar na *central global*
│ ${P}rpg desafiar <código>— lutar com gente de OUTROS grupos
│ ${P}rpg ranking          — os maiores do multiverso

💡 _Ganhe ouro e pontos vencendo batalhas. O ouro é o mesmo da sua conta — dá pra comprar vestuário melhor e ficar mais forte._

╰───「 ${SIG} 」`;
}

// ───────────────────────── COMANDO PRINCIPAL ─────────────────────
async function rpg(sock, msg, args) {
    args = Array.isArray(args) ? args : [];
    const from = msg.key.remoteJid;
    const isGroup = String(from).endsWith("@g.us");
    const autorJid = msg.key.participant || msg.key.remoteJid;
    const id = norm(autorJid);
    const P = config.PREFIX;
    const sub = (args[0] || "").toLowerCase().trim();

    const db = getDB();
    garantirConta(db, id);

    try {
        // ── MENU / PAINEL (card) ──
        if (!sub || sub === "menu" || sub === "ajuda" || sub === "help") {
            const legenda = painelMenu(P);
            try {
                const arte = path.join(__dirname, "../midias/style-arts/style-poster.png");
                if (fs.existsSync(arte)) return await sock.sendMessage(from, { image: fs.readFileSync(arte), caption: legenda }, { quoted: msg });
            } catch {}
            return sock.sendMessage(from, { text: legenda }, { quoted: msg });
        }

        // ── CLASSES ──
        if (sub === "classes" || sub === "classe") {
            let t = `╭───「 🧬 *CLASSES TEMPORAIS* 」\n╰───\n\n`;
            for (const k in CLASSES) {
                const c = CLASSES[k];
                t += `${c.emoji} *${c.nome}*\n│ ${c.desc}\n│ ❤️ ${c.hp}  ⚔️ ${c.atk}  🛡️ ${c.def}\n│ criar: ${P}rpg criar ${k}\n\n`;
            }
            t += `╰───「 ${SIG} 」`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }

        // ── CRIAR ──
        if (sub === "criar" || sub === "novo" || sub === "start") {
            if (temPersonagem(db, id)) {
                return sock.sendMessage(from, { text: `🌀 Você já tem um viajante: *${db[id].rpg.nome}* (${CLASSES[db[id].rpg.classe].nome}).\nVeja em ${P}rpg perfil.` }, { quoted: msg });
            }
            const ck = acharClasse(args[1]);
            if (!ck) {
                return sock.sendMessage(from, { text: `🧬 Escolha uma classe pra começar:\n\n${Object.values(CLASSES).map(c => `${c.emoji} ${c.nome} — ${P}rpg criar ${Object.keys(CLASSES).find(k => CLASSES[k] === c)}`).join("\n")}\n\n👉 Veja detalhes em ${P}rpg classes` }, { quoted: msg });
            }
            const nomePers = args.slice(2).join(" ").trim().slice(0, 24) || null;
            db[id].rpg = novoRpg(ck, nomePers);
            db[id].ouro = (db[id].ouro || 0) + 300; // kit inicial de ouro
            saveDB(db);
            const c = CLASSES[ck];
            return sock.sendMessage(from, { text: `${c.emoji} *VIAJANTE CRIADO!*\n\n${barra(`│ 👤 ${db[id].rpg.nome}\n│ 🧬 ${c.nome}\n│ ❤️ ${c.hp}  ⚔️ ${c.atk}  🛡️ ${c.def}\n│ 💰 +300 de ouro de boas-vindas`)}\n\n⚡ ${c.desc}\n\n👉 Compre vestuário em *${P}rpg loja* e lute em *${P}rpg batalhar @alguém* ou *${P}rpg arena*.\n\n╰───「 ${SIG} 」` }, { quoted: msg });
        }

        // comandos abaixo precisam de personagem
        const precisaPersonagem = ["perfil", "ficha", "loja", "comprar", "equipar", "batalhar", "duelar", "arena", "desafiar", "curar", "ranking"];
        if (precisaPersonagem.includes(sub) && !temPersonagem(db, id) && sub !== "ranking") {
            return sock.sendMessage(from, { text: `🌀 Você ainda não é um viajante do tempo!\nCrie seu personagem: *${P}rpg criar <classe>*\n(veja as classes em ${P}rpg classes)` }, { quoted: msg });
        }

        const r = db[id] && db[id].rpg;

        // ── PERFIL ──
        if (sub === "perfil" || sub === "ficha" || sub === "me") {
            const a = atributos(r);
            const eqTxt = ["arma", "armadura", "traje", "reliquia"].map(s => {
                const it = r.equip[s] && VESTUARIO[r.equip[s]];
                return `│ ${s === "arma" ? "⚔️" : s === "armadura" ? "🛡️" : s === "traje" ? "🧥" : "✨"} ${s}: ${it ? it.emoji + " " + it.nome : "—"}`;
            }).join("\n");
            const xpNec = r.nivel * 100;
            const t = `╭───「 📜 *FICHA TEMPORAL* 」\n╰───
│ 👤 ${r.nome}
│ ${CLASSES[r.classe].emoji} ${CLASSES[r.classe].nome}  •  nível ${r.nivel}
│ ❤️ ${a.hp}   ⚔️ ${a.atk}   🛡️ ${a.def}   🎯 ${a.crit}% crit
│ 🔋 Poder: *${poderTotal(r)}*
│ 🏅 ${r.vitorias}V / ${r.derrotas}D  •  🏆 ${fmt(r.pontos)} pts
│ ✨ XP: ${r.xp}/${xpNec}
│ 💰 Ouro: ${fmt(db[id].ouro)}
├─── 🎒 Equipado
${eqTxt}
╰───「 ${SIG} 」`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }

        // ── LOJA ──
        if (sub === "loja" || sub === "vestuario" || sub === "vestuário" || sub === "shop") {
            const grupos = { arma: "⚔️ ARMAS (+ataque)", armadura: "🛡️ ARMADURAS (+defesa)", traje: "🧥 TRAJES (+vida)", reliquia: "✨ RELÍQUIAS (+crítico)" };
            let t = `╭───「 🧥 *VESTUÁRIO TEMPORAL* 」\n│ 💰 Seu ouro: ${fmt(db[id].ouro)}\n╰───\n`;
            for (const tipo in grupos) {
                t += `\n${grupos[tipo]}\n`;
                for (const idv in VESTUARIO) if (VESTUARIO[idv].tipo === tipo) {
                    const v = VESTUARIO[idv];
                    t += `│ 🆔 ${idv} ${v.emoji} ${v.nome} — +${v.bonus} • 💲${fmt(v.preco)}\n`;
                }
            }
            t += `\n│ Comprar: ${P}rpg comprar <id>\n│ Equipar: ${P}rpg equipar <id>\n╰───「 ${SIG} 」`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }

        // ── COMPRAR ──
        if (sub === "comprar" || sub === "buy") {
            const v = VESTUARIO[args[1]];
            if (!v) return sock.sendMessage(from, { text: `❌ Item inválido. Veja a vitrine em ${P}rpg loja.` }, { quoted: msg });
            if ((db[id].ouro || 0) < v.preco) return sock.sendMessage(from, { text: `💸 Ouro insuficiente!\nVocê tem ${fmt(db[id].ouro)}, o item custa ${fmt(v.preco)}.\nVença batalhas pra juntar mais.` }, { quoted: msg });
            db[id].ouro -= v.preco;
            r.inventario[args[1]] = (r.inventario[args[1]] || 0) + 1;
            saveDB(db);
            return sock.sendMessage(from, { text: `✅ *COMPRADO!* ${v.emoji} ${v.nome} (+${v.bonus})\n💰 Ouro restante: ${fmt(db[id].ouro)}\n\n👉 Equipe com: ${P}rpg equipar ${args[1]}` }, { quoted: msg });
        }

        // ── EQUIPAR ──
        if (sub === "equipar" || sub === "usar") {
            const idv = args[1];
            const v = VESTUARIO[idv];
            if (!v) return sock.sendMessage(from, { text: `❌ Item inválido. Veja ${P}rpg loja.` }, { quoted: msg });
            if (!r.inventario[idv]) return sock.sendMessage(from, { text: `📦 Você não tem esse item. Compre com ${P}rpg comprar ${idv}.` }, { quoted: msg });
            r.equip[SLOT[v.tipo]] = idv;
            saveDB(db);
            return sock.sendMessage(from, { text: `✅ Equipado: ${v.emoji} *${v.nome}* (+${v.bonus} ${v.tipo})\n🔋 Novo poder: *${poderTotal(r)}*` }, { quoted: msg });
        }

        // ── BATALHAR (no grupo, marcando alguém) ──
        if (sub === "batalhar" || sub === "duelar" || sub === "lutar") {
            if (!isGroup) return sock.sendMessage(from, { text: `⚔️ Batalha de grupo só funciona em grupo. No PV, use a *${P}rpg arena* pra lutar com gente de outros grupos.` }, { quoted: msg });
            const mencionados = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            const alvoJid = mencionados[0];
            if (!alvoJid) return sock.sendMessage(from, { text: `⚔️ Marque quem você quer desafiar:\n${P}rpg batalhar @fulano` }, { quoted: msg });
            const alvoId = norm(alvoJid);
            if (alvoId === id) return sock.sendMessage(from, { text: `🌀 Você não pode duelar consigo mesmo — paradoxo temporal!` }, { quoted: msg });
            if (!temPersonagem(db, alvoId)) return sock.sendMessage(from, { text: `👤 @${alvoId} ainda não tem personagem. Diga pra criar com *${P}rpg criar*.`, mentions: [alvoJid] }, { quoted: msg });

            const rB = db[alvoId].rpg;
            const res = batalhar(r.nome, r, rB.nome, rB);
            const venceuEu = res.vencedor === 0;
            const premio = 60 + rnd(90) + (r.nivel + rB.nivel) * 5;

            // recompensas
            const vJid = venceuEu ? autorJid : alvoJid, pJid = venceuEu ? alvoJid : autorJid;
            const vId = norm(vJid), pId = norm(pJid);
            db[vId].ouro = (db[vId].ouro || 0) + premio;
            db[vId].rpg.vitorias++; db[vId].rpg.pontos += 20; db[vId].rpg.xp += 45;
            db[pId].ouro = (db[pId].ouro || 0) + Math.round(premio * 0.25);
            db[pId].rpg.derrotas++; db[pId].rpg.pontos += 5; db[pId].rpg.xp += 15;
            subirNivel(db[vId].rpg); subirNivel(db[pId].rpg);
            saveDB(db);

            const t = `╭───「 ⚔️ *DUELO TEMPORAL* 」\n│ ${CLASSES[r.classe].emoji} ${r.nome}  ✖️  ${CLASSES[rB.classe].emoji} ${rB.nome}\n╰───\n\n${res.log.join("\n")}\n\n🏆 *Vencedor: ${venceuEu ? r.nome : rB.nome}*\n💰 +${fmt(premio)} ouro • +20 pts\n\n╰───「 ${SIG} 」`;
            return sock.sendMessage(from, { text: t, mentions: [autorJid, alvoJid] }, { quoted: msg });
        }

        // ── ARENA GLOBAL (registrar + listar) ──
        if (sub === "arena" || sub === "global" || sub === "central") {
            const cod = registrarArena(id, r, from);
            const arena = getArena();
            const outros = Object.values(arena)
                .filter(x => x.jid !== autorJid && norm(x.jid) !== id)
                .sort((a, b) => (b.atualizadoEm || 0) - (a.atualizadoEm || 0))
                .slice(0, 8);
            let lista = outros.length
                ? outros.map(x => `│ ${CLASSES[x.classe]?.emoji || "🌀"} *${x.nome}* — código *${x.codigo}* • 🔋${x.poder} • nv ${x.nivel}`).join("\n")
                : "│ _Ninguém mais na arena ainda. Chame a galera pra entrar!_";
            const t = `╭───「 🛸 *CENTRAL GLOBAL DA TARDIS* 」\n│ Uma arena que cruza TODOS os grupos.\n╰───\n\n✅ Você está na arena! Seu código: *${cod}*\n_(outros grupos podem te desafiar por ele)_\n\n🎯 *Desafiantes disponíveis:*\n${lista}\n\n│ Lutar com alguém: ${P}rpg desafiar <código>\n│ Ranking geral: ${P}rpg ranking\n╰───「 ${SIG} 」`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }

        // ── DESAFIAR (arena global, por código, cruzando grupos) ──
        if (sub === "desafiar" || sub === "desafio") {
            const cod = String(args[1] || "").toUpperCase().trim();
            if (!cod) return sock.sendMessage(from, { text: `🎯 Use: ${P}rpg desafiar <código>\nVeja os códigos em ${P}rpg arena.` }, { quoted: msg });
            const arena = getArena();
            const alvo = arena[cod];
            if (!alvo) return sock.sendMessage(from, { text: `❌ Código *${cod}* não existe na arena. Veja ${P}rpg arena.` }, { quoted: msg });
            if (norm(alvo.jid) === id) return sock.sendMessage(from, { text: `🌀 Esse código é o SEU. Desafie outro viajante!` }, { quoted: msg });

            // reconstrói o personagem do alvo a partir do snapshot da arena (ou do db, se for do mesmo bot)
            const dbAlvo = db[norm(alvo.jid)]?.rpg;
            const rB = dbAlvo || { classe: alvo.snapshot?.classe || alvo.classe || "senhor", nome: alvo.nome, nivel: alvo.snapshot?.nivel || alvo.nivel || 1, equip: alvo.snapshot?.equip || {}, pontos: alvo.pontos || 0, vitorias: 0, derrotas: 0, inventario: {} };

            const res = batalhar(r.nome, r, rB.nome, rB);
            const venceuEu = res.vencedor === 0;
            const premio = 90 + rnd(120) + (r.nivel + (rB.nivel || 1)) * 6;

            if (venceuEu) { db[id].ouro += premio; r.vitorias++; r.pontos += 35; r.xp += 70; }
            else { db[id].ouro += Math.round(premio * 0.3); r.derrotas++; r.pontos += 8; r.xp += 20; }
            subirNivel(r);
            // credita pontos ao alvo também (mantém a arena viva entre grupos)
            if (dbAlvo) { if (venceuEu) { dbAlvo.derrotas++; dbAlvo.pontos += 8; } else { dbAlvo.vitorias++; dbAlvo.pontos += 25; } }
            saveDB(db);
            registrarArena(id, r, from);
            if (dbAlvo) registrarArena(norm(alvo.jid), dbAlvo, alvo.grupo);

            const t = `╭───「 🛸 *DESAFIO INTERDIMENSIONAL* 」\n│ ${CLASSES[r.classe].emoji} ${r.nome}  ✖️  ${CLASSES[rB.classe]?.emoji || "🌀"} ${rB.nome} _(cód ${cod})_\n╰───\n\n${res.log.join("\n")}\n\n🏆 *Vencedor: ${venceuEu ? r.nome : rB.nome}*\n💰 ${venceuEu ? "+" + fmt(premio) + " ouro • +35 pts" : "+" + fmt(Math.round(premio * 0.3)) + " ouro (consolação)"}\n\n╰───「 ${SIG} 」`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }

        // ── RANKING GLOBAL ──
        if (sub === "ranking" || sub === "rank" || sub === "top") {
            const todos = Object.entries(getDB())
                .filter(([, u]) => u && u.rpg && u.rpg.classe)
                .map(([jid, u]) => ({ jid, nome: u.rpg.nome, cls: u.rpg.classe, pontos: u.rpg.pontos || 0, nivel: u.rpg.nivel || 1, poder: poderTotal(u.rpg), v: u.rpg.vitorias || 0 }))
                .sort((a, b) => b.pontos - a.pontos || b.poder - a.poder)
                .slice(0, 10);
            if (!todos.length) return sock.sendMessage(from, { text: `🏆 Ninguém no ranking ainda. Seja o primeiro: ${P}rpg criar!` }, { quoted: msg });
            const medal = ["🥇", "🥈", "🥉"];
            let t = `╭───「 🏆 *RANKING DO MULTIVERSO* 」\n╰───\n\n`;
            todos.forEach((u, i) => {
                t += `${i < 3 ? medal[i] : "🔹 " + (i + 1) + "º"} *${u.nome}* ${CLASSES[u.cls]?.emoji || ""}\n│   🏆 ${fmt(u.pontos)} pts • 🔋${u.poder} • nv ${u.nivel} • ${u.v}V\n`;
            });
            t += `\n╰───「 ${SIG} 」`;
            return sock.sendMessage(from, { text: t }, { quoted: msg });
        }

        // ── CURAR (barato, só pra dar função ao ouro; batalha já começa com vida cheia) ──
        if (sub === "curar" || sub === "descansar") {
            return sock.sendMessage(from, { text: `🌀 Na TARDIS você já entra em cada batalha com a vida cheia, viajante — não precisa curar. Gaste seu ouro em *${P}rpg loja* pra ficar mais forte!` }, { quoted: msg });
        }

        // desconhecido
        return sock.sendMessage(from, { text: `🌀 Não entendi esse comando do RPG. Abra o painel: *${P}rpg*` }, { quoted: msg });

    } catch (e) {
        console.error("RPG:", e?.message || e);
        return sock.sendMessage(from, { text: `⚠️ Deu um ruído temporal no RPG. Tenta de novo em instantes.` }, { quoted: msg });
    }
}

// sobe de nível do RPG quando acumula XP (cresce o atributo base via nível)
function subirNivel(r) {
    if (!r) return;
    let nec = r.nivel * 100;
    while (r.xp >= nec) { r.xp -= nec; r.nivel += 1; nec = r.nivel * 100; }
}

module.exports = { rpg, CLASSES, VESTUARIO, poderTotal };
