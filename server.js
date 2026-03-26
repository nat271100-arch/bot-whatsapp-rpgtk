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
function gerarEvento(tipo = "geral") {
  return `🌑 EVENTO

Algo estranho acontece...

🎭 Situação:
Instabilidade na região

⚠️ Complicação:
Ninguém entende a origem

🎯 Ação:
Investigar ou evitar

✨ Consequência:
Pode afetar personagens`;
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

// 🤖 BOT
app.post("/bot", (req, res) => {

  const msgOriginal = req.body.Body || "";
  const msg = msgOriginal.toLowerCase();
  const numero = req.body.From;

  let resposta = "";

  // =========================
  // COMANDOS BÁSICOS
  // =========================

  if (msg === "!criar") {

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

          let a1 = sortearAfinidade();
          let a2 = sortearAfinidade();

          let p = {
            ...e.dados,
            id: gerarID("P",6),
            afinidade1: a1,
            afinidade2: a2,
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
  // PLAYER
  // =========================

  else if (msg.startsWith("!perfil")) {
    let i = parseInt(msg.split(" ")[1]) - 1;
    let p = jogadores[numero]?.personagens[i];

    if (!p) resposta = "❌ Não encontrado";
    else {
      resposta = `${p.nome} (${p.id})`;
    }
  }

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
  // EVENTOS
  // =========================

  else if (msg.startsWith("!evento") && isAdmin(numero)) {
    resposta = gerarEvento();
  }

  // =========================
  // MISSÕES
  // =========================

  else if (msg === "!missao criar" && isAdmin(numero)) {
    let m = gerarMissao();
    missoes.push(m);
    resposta = `${m.nome} (${m.id})`;
  }

  else if (msg.startsWith("!missao concluir") && isAdmin(numero)) {
    let id = msg.split(" ")[2];
    let m = missoes.find(x => x.id === id);
    if (m) {
      m.concluida = true;
      resposta = "Missão concluída";
    } else resposta = "Erro";
  }

  // =========================
  // ADM
  // =========================

  else if (msg.startsWith("!del") && isAdmin(numero)) {
    let id = msg.split(" ")[1];

    for (let j in jogadores) {
      jogadores[j].personagens = jogadores[j].personagens.filter(p => p.id !== id);
    }

    resposta = "Deletado";
  }

  else if (msg.startsWith("!addadm") && isAdmin(numero)) {
    let novo = msgOriginal.split(" ")[1];
    admins.push(novo);
    resposta = "Novo ADM";
  }

  else if (msg === "!painel" && isAdmin(numero)) {

    let total = Object.keys(jogadores).length;

    resposta = `📊 RPG

Jogadores: ${total}
Missões: ${missoes.length}

Comandos:
!missao criar
!evento
!del
!lista`;
  }

  else {
    resposta = "Use !criar";
  }

  res.set("Content-Type", "text/xml");
  res.send(`<Response><Message>${resposta}</Message></Response>`);
});

app.listen(3000);
