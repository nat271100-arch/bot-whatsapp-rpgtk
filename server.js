const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: false }));

// =========================
// 👑 ADM
// =========================
let admins = ["whatsapp:+55SEUNUMERO"];

// =========================
// 💾 MEMÓRIA
// =========================
let jogadores = {};
let estados = {};
let aparenciasUsadas = [];
let missoes = [];
let logs = [];
let solicitacoes = [];

// =========================
// 🧬 AFINIDADES
// =========================
const afinidades = {
  "Natureza 🌿": { defesa: 2, vitalidade: 1 },
  "Água 💧": { vitalidade: 2, magia: 1 },
  "Fogo 🔥": { forca: 2, destreza: 1 },
  "Luz ✨": { magia: 2, defesa: 1 },
  "Vento 🌬️": { destreza: 2, magia: 1 }
};

const simbolosAfinidade = {
  "Natureza 🌿": "🌿🍃",
  "Água 💧": "💧🌊",
  "Fogo 🔥": "🔥🗡️",
  "Luz ✨": "✨🌟",
  "Vento 🌬️": "🌬️🌀"
};

const listaAfinidades = Object.keys(afinidades);

// =========================
// 🔧 FUNÇÕES
// =========================
function sortearAfinidade() {
  return listaAfinidades[Math.floor(Math.random() * listaAfinidades.length)];
}

function gerarID(prefixo, tamanho = 6) {
  return prefixo + "-" + Math.random().toString(36).substring(2, 2 + tamanho).toUpperCase();
}

function isAdmin(numero) {
  return admins.includes(numero);
}

function buscarPersonagem(id) {
  for (let num in jogadores) {
    let p = jogadores[num].personagens.find(x => x.id === id);
    if (p) return p;
  }
  return null;
}

// =========================
// 🤖 BOT
// =========================
app.post("/bot", (req, res) => {

  const msgOriginal = req.body.Body || "";
  const msg = msgOriginal.toLowerCase();
  const numero = req.body.From;

  let resposta = "";

// =========================
// 📜 MENU
// =========================
if (msg === "!menu") {
  resposta = `📖 MENU

🧚 !criar
🧾 !perfil 1 / 2
🎨 !placa P-ID
🎲 !d20
📩 !solicitar texto

━━━━━━━━━━
👑 ADM

!painel
!lista
!ver P-ID
!solicitacoes
!aprovar S-ID
!recusar S-ID
!missao criar
!evento`;
}

// =========================
// 🧚 CRIAÇÃO
// =========================
else if (msg === "!criar") {

  if (!jogadores[numero]) {
    jogadores[numero] = { personagens: [], nomeJogador: "" };
  }

  if (jogadores[numero].personagens.length >= 2) {
    resposta = "❌ Limite de personagens.";
  } else {
    estados[numero] = {
      etapa: jogadores[numero].nomeJogador ? "nome" : "nomeJogador",
      dados: {},
      pontos: 20
    };

    resposta = jogadores[numero].nomeJogador
      ? "Nome da personagem?"
      : "Nome do jogador?";
  }
}

// =========================
// 🧠 FLUXO DE CRIAÇÃO
// =========================
else if (estados[numero]) {

  let e = estados[numero];

  if (e.etapa === "nomeJogador") {
    jogadores[numero].nomeJogador = msgOriginal;
    e.etapa = "nome";
    resposta = "Nome da personagem?";
  }

  else if (e.etapa === "nome") {
    e.dados.nome = msgOriginal;
    e.etapa = "idade";
    resposta = "Idade?";
  }

  else if (e.etapa === "idade") {
    e.dados.idade = msgOriginal;
    e.etapa = "aparencia";
    resposta = "Aparência?";
  }

  else if (e.etapa === "aparencia") {
    if (aparenciasUsadas.includes(msgOriginal.toLowerCase())) {
      resposta = "❌ Aparência já usada.";
    } else {
      e.dados.aparencia = msgOriginal;
      aparenciasUsadas.push(msgOriginal.toLowerCase());
      e.etapa = "item";
      resposta = "Item inicial?";
    }
  }

  else if (e.etapa === "item") {
    e.dados.item = msgOriginal;
    e.etapa = "vitalidade";

    resposta = `Distribua 20 pontos:

❤️ Vitalidade
⚔️ Força
✨ Magia
🛡️ Defesa
💨 Destreza

Mínimo 1

Vitalidade?`;
  }

  else {
    const atb = ["vitalidade","forca","magia","defesa","destreza"];
    let atual = e.etapa;
    let valor = parseInt(msgOriginal);

    if (isNaN(valor) || valor < 1 || valor > e.pontos) {
      resposta = "❌ Valor inválido";
    } else {

      e.dados[atual] = valor;
      e.pontos -= valor;

      let i = atb.indexOf(atual);

      if (i < atb.length - 1) {
        e.etapa = atb[i+1];
        resposta = `${e.etapa}? (${e.pontos})`;
      } else {

        let a1 = sortearAfinidade();
        let a2 = sortearAfinidade();

        let buffs = { vitalidade:0, forca:0, magia:0, defesa:0, destreza:0 };

        [a1, a2].forEach(a => {
          let b = afinidades[a];
          for (let k in b) buffs[k] += b[k];
        });

        let finais = {
          vitalidade: e.dados.vitalidade + buffs.vitalidade,
          forca: e.dados.forca + buffs.forca,
          magia: e.dados.magia + buffs.magia,
          defesa: e.dados.defesa + buffs.defesa,
          destreza: e.dados.destreza + buffs.destreza
        };

        let p = {
          ...e.dados,
          id: gerarID("P",6),
          afinidade1: a1,
          afinidade2: a2,
          buffs,
          finais,
          historia: "",
          inventario: [e.dados.item],
          visual: {}
        };

        jogadores[numero].personagens.push(p);

        let simbolo = simbolosAfinidade[a1] || "✨🧚";

        resposta = `𖥸𓆰${simbolo}𓆰𖥸

🧚 ${p.nome}
🆔 ${p.id}

✨ ${a1} | ${a2}

📊 FINAL:
❤️ ${p.finais.vitalidade}
⚔️ ${p.finais.forca}
✨ ${p.finais.magia}
🛡️ ${p.finais.defesa}
💨 ${p.finais.destreza}

🎒 ${p.inventario[0]}

𖥸𓆰${simbolo}𓆰𖥸`;

        delete estados[numero];
      }
    }
  }
}

// =========================
// 🎲 D20
// =========================
else if (msg === "!d20") {
  let r = Math.floor(Math.random() * 20) + 1;
  logs.push(`${numero} rolou ${r}`);
  resposta = `🎲 Resultado: ${r}`;
}

// =========================
// 📩 SOLICITAÇÕES
// =========================
else if (msg.startsWith("!solicitar")) {

  let texto = msgOriginal.replace("!solicitar ", "");
  let id = gerarID("S",4);

  solicitacoes.push({
    id,
    jogador: numero,
    texto,
    status: "pendente"
  });

  resposta = `📩 Enviado (${id})`;
}

// =========================
// 👑 APROVAÇÃO
// =========================
else if (msg === "!solicitacoes" && isAdmin(numero)) {
  resposta = solicitacoes.map(s => `${s.id} | ${s.texto}`).join("\n") || "Nenhuma";
}

else if (msg.startsWith("!aprovar") && isAdmin(numero)) {
  let id = msg.split(" ")[1];
  let s = solicitacoes.find(x => x.id === id);
  if (s) {
    s.status = "aprovado";
    resposta = "Aprovado";
  }
}

else if (msg.startsWith("!recusar") && isAdmin(numero)) {
  let id = msg.split(" ")[1];
  let s = solicitacoes.find(x => x.id === id);
  if (s) {
    s.status = "recusado";
    resposta = "Recusado";
  }
}

// =========================
// 📊 LISTA
// =========================
else if (msg === "!lista" && isAdmin(numero)) {

  let lista = "";

  for (let num in jogadores) {
    let j = jogadores[num];

    j.personagens.forEach(p => {
      lista += `👤 ${j.nomeJogador || "Sem nome"}
🧚 ${p.nome}
🆔 ${p.id}\n\n`;
    });
  }

  resposta = lista || "Nenhum personagem.";
}

// =========================
// 🔍 VER
// =========================
else if (msg.startsWith("!ver") && isAdmin(numero)) {

  let id = msg.split(" ")[1];
  let p = buscarPersonagem(id);

  if (!p) resposta = "❌ Não encontrado";
  else {
    resposta = `🧚 ${p.nome}
🆔 ${p.id}

Base:
❤️ ${p.vitalidade}
⚔️ ${p.forca}
✨ ${p.magia}
🛡️ ${p.defesa}
💨 ${p.destreza}

Buff:
❤️ +${p.buffs.vitalidade}
⚔️ +${p.buffs.forca}
✨ +${p.buffs.magia}
🛡️ +${p.buffs.defesa}
💨 +${p.buffs.destreza}

Final:
❤️ ${p.finais.vitalidade}
⚔️ ${p.finais.forca}
✨ ${p.finais.magia}
🛡️ ${p.finais.defesa}
💨 ${p.finais.destreza}`;
  }
}

// =========================
// 🌑 EVENTO
// =========================
else if (msg === "!evento" && isAdmin(numero)) {
  resposta = "🌑 Um evento foi iniciado...";
}

// =========================
// 🧾 MISSÃO
// =========================
else if (msg === "!missao criar" && isAdmin(numero)) {
  let m = { id: gerarID("M",4), nome: "Missão", concluida:false };
  missoes.push(m);
  resposta = `Missão criada (${m.id})`;
}

// =========================
// 👑 PAINEL
// =========================
else if (msg === "!painel" && isAdmin(numero)) {
  resposta = `📊 Painel

Jogadores: ${Object.keys(jogadores).length}
Missões: ${missoes.length}
Solicitações: ${solicitacoes.length}`;
}

// =========================
// PADRÃO
// =========================
else {
  resposta = "Use !menu";
}

res.set("Content-Type", "text/xml");
res.send(`<Response><Message>${resposta}</Message></Response>`);

});

app.listen(3000);
