const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: false }));

// 👑 ADM
let admins = ["whatsapp:+554191656120"];

// 💾 MEMÓRIA
let jogadores = {};
let estados = {};
let aparenciasUsadas = [];
let missoes = [];
let arcos = [];
let logs = [];
let solicitacoes = [];

// 🧬 AFINIDADES
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

// 🌑 EVENTO
function gerarEvento() {
  return `🌑 EVENTO

Algo estranho acontece...

🎭 Situação:
Instabilidade na região

⚠️ Complicação:
Origem desconhecida

🎯 Ação:
Investigar ou evitar

✨ Consequência:
Pode afetar o equilíbrio`;
}

// 🧾 MISSÃO
function gerarMissao() {
  return {
    id: gerarID("M", 4),
    nome: "Sussurros na Floresta",
    contexto: "Uma fada desapareceu",
    objetivo: "Investigar",
    concluida: false
  };
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

📩 !solicitar [pedido]

━━━━━━━━━━

👑 ADM

!painel
!missao criar
!evento
!del P-ID`;
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
// 🧠 FLUXO
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
      resposta = "❌ Aparência repetida.";
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
    let atual = atb.find(x => x === e.etapa);
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

        let p = {
          ...e.dados,
          id: gerarID("P",6),
          afinidade1: sortearAfinidade(),
          afinidade2: sortearAfinidade(),
          historia: "",
          inventario: [e.dados.item],
          visual: {}
        };

        jogadores[numero].personagens.push(p);

        resposta = `🧚 Criado!

${p.nome}
${p.id}`;

        delete estados[numero];
      }
    }
  }
}

// =========================
// 🧾 PERFIL
// =========================

else if (msg.startsWith("!perfil")) {
  let i = parseInt(msg.split(" ")[1]) - 1;
  let p = jogadores[numero]?.personagens[i];

  resposta = p ? `${p.nome} (${p.id})` : "❌ Não encontrado";
}

// =========================
// 🎨 PLACA
// =========================

else if (msg.startsWith("!placa")) {

  let id = msgOriginal.split(" ")[1];
  let p = buscarPersonagem(id);

  if (!p) resposta = "❌ Não encontrado";
  else {

    let simbolo = p.visual.simbolo || simbolosAfinidade[p.afinidade1] || "✨🧚";
    let titulo = p.visual.titulo || "Fada";
    let frase = p.visual.frase || "";

    resposta = `𖥸𓆰${simbolo}𓆰𖥸

${p.nome} (${p.id})
${p.idade} anos

${p.aparencia}

${p.afinidade1} | ${p.afinidade2}

${titulo}

${frase}`;
  }
}

// =========================
// 🎨 PLAYER EDIT
// =========================

else if (msg.startsWith("!minhaplaca")) {

  let partes = msgOriginal.split(" ");
  let campo = partes[1];
  let valor = partes.slice(2).join(" ");

  let p = jogadores[numero]?.personagens[0];

  if (!p) resposta = "❌ Sem personagem";
  else {
    if (!p.visual) p.visual = {};
    p.visual[campo] = valor;
    resposta = "🎨 Atualizado";
  }
}

// =========================
// 🎲 D20
// =========================

else if (msg === "!d20") {

  let r = Math.floor(Math.random() * 20) + 1;

  resposta = `🎲 Resultado: ${r}`;

  logs.push(`${numero} rolou ${r}`);
}

// =========================
// 📩 SOLICITAÇÕES
// =========================

else if (msg.startsWith("!solicitar")) {

  let texto = msgOriginal.replace("!solicitar ", "");

  let id = gerarID("S", 4);

  solicitacoes.push({
    id,
    jogador: numero,
    texto,
    status: "pendente"
  });

  resposta = `📩 Pedido enviado!

ID: ${id}`;
}

// =========================
// 👑 VER SOLICITAÇÕES
// =========================

else if (msg === "!solicitacoes" && isAdmin(numero)) {

  let lista = solicitacoes
    .filter(s => s.status === "pendente")
    .map(s => `${s.id} | ${s.texto}`)
    .join("\n") || "Nenhuma";

  resposta = lista;
}

// =========================
// ✅ APROVAR
// =========================

else if (msg.startsWith("!aprovar") && isAdmin(numero)) {

  let id = msg.split(" ")[1];
  let s = solicitacoes.find(x => x.id === id);

  if (!s) resposta = "Erro";
  else {
    s.status = "aprovado";
    resposta = "Aprovado";
  }
}

// =========================
// ❌ RECUSAR
// =========================

else if (msg.startsWith("!recusar") && isAdmin(numero)) {

  let id = msg.split(" ")[1];
  let s = solicitacoes.find(x => x.id === id);

  if (!s) resposta = "Erro";
  else {
    s.status = "recusado";
    resposta = "Recusado";
  }
}

// =========================
// 🧾 MISSÕES
// =========================

else if (msg === "!missao criar" && isAdmin(numero)) {
  let m = gerarMissao();
  missoes.push(m);
  resposta = `${m.nome} (${m.id})`;
}

// =========================
// 🌑 EVENTO
// =========================

else if (msg.startsWith("!evento") && isAdmin(numero)) {
  resposta = gerarEvento();
}

// =========================
// ❌ DELETAR
// =========================

else if (msg.startsWith("!del") && isAdmin(numero)) {

  let id = msg.split(" ")[1];

  for (let j in jogadores) {
    jogadores[j].personagens =
      jogadores[j].personagens.filter(p => p.id !== id);
  }

  resposta = "Deletado";
}

// =========================
// 👑 PAINEL
// =========================

else if (msg === "!painel" && isAdmin(numero)) {

  resposta = `📊 RPG

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
