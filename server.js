const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: false }));

const ADMIN = "whatsapp:+5541991656120";

// 💾 MEMÓRIA
let jogadores = {};
let aparenciasUsadas = [];
let estados = {};

// 🧚 Afinidades + buffs
const afinidades = {
  "Natureza 🌿": { defesa: 2, vitalidade: 1 },
  "Água 💧": { vitalidade: 2, magia: 1 },
  "Animais 🐾": { destreza: 2, forca: 1 },
  "Luz ✨": { magia: 2, defesa: 1 },
  "Vento 🌬️": { destreza: 2, magia: 1 },
  "Arte 🎨": { magia: 2, destreza: 1 },
  "Culinária 🧁": { vitalidade: 2, defesa: 1 },
  "Tecnologia ⚙️": { defesa: 2, magia: 1 },
  "Fogo 🔥": { forca: 2, destreza: 1 },
  "Inverno ❄️": { defesa: 2, magia: 1 },
  "Cura 🌿": { vitalidade: 2, magia: 1 },
  "Pó mágico ✨": { magia: 2, destreza: 1 },
  "Sonhos 🌙": { magia: 2, defesa: 1 },
  "Tempo ⏳": { destreza: 2, magia: 1 }
};

const listaAfinidades = Object.keys(afinidades);

function sortearAfinidade() {
  return listaAfinidades[Math.floor(Math.random() * listaAfinidades.length)];
}

function gerarID() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// 🤖 BOT
app.post("/bot", (req, res) => {
  const msgOriginal = req.body.Body || "";
  const msg = msgOriginal.toLowerCase();
  const numero = req.body.From;

  let resposta = "";

  // CANCELAR
  if (msg === "!cancelar") {
    delete estados[numero];
    resposta = "❌ Criação cancelada.";
  }

  // CRIAR
  else if (msg === "!criar") {

    if (!jogadores[numero]) {
      jogadores[numero] = { personagens: [] };
    }

    if (jogadores[numero].personagens.length >= 2) {
      resposta = "❌ Você já possui 2 personagens.";
    } else {
      estados[numero] = {
        etapa: "nome",
        dados: {},
        pontosRestantes: 20
      };
      resposta = "🧚 Vamos criar sua fada!\nQual o nome?";
    }
  }

  // FLUXO GUIADO
  else if (estados[numero]) {
    let estado = estados[numero];

    // NOME
    if (estado.etapa === "nome") {
      estado.dados.nome = msgOriginal;
      estado.etapa = "idade";
      resposta = "🎂 Qual a idade?";
    }

    // IDADE
    else if (estado.etapa === "idade") {
      estado.dados.idade = msgOriginal;
      estado.etapa = "aparencia";
      resposta = "🎭 Descreva a aparência:";
    }

    // APARÊNCIA
    else if (estado.etapa === "aparencia") {

      if (aparenciasUsadas.includes(msgOriginal.toLowerCase())) {
        resposta = "❌ Aparência já usada. Escolha outra.";
      } else {
        estado.dados.aparencia = msgOriginal;
        aparenciasUsadas.push(msgOriginal.toLowerCase());
        estado.etapa = "item";
        resposta = "🎒 Qual seu item inicial?";
      }
    }

    // ITEM
    else if (estado.etapa === "item") {
      estado.dados.item = msgOriginal;
      estado.etapa = "vitalidade";
      resposta = "❤️ Vitalidade? (Restam 20)";
    }

    // ATRIBUTOS
    else {
      const atributos = ["vitalidade", "forca", "magia", "defesa", "destreza"];
      let atual = atributos.find(a => estado.etapa === a);

      let valor = parseInt(msgOriginal);

      if (isNaN(valor) || valor < 1 || valor > estado.pontosRestantes) {
        resposta = `❌ Valor inválido. Restam ${estado.pontosRestantes}`;
      } else {
        estado.dados[atual] = valor;
        estado.pontosRestantes -= valor;

        let index = atributos.indexOf(atual);

        if (index < atributos.length - 1) {
          estado.etapa = atributos[index + 1];
          resposta = `➡️ ${estado.etapa}? (Restam ${estado.pontosRestantes})`;
        } else {

          // AFINIDADES
          let afinidade1 = sortearAfinidade();
          let afinidade2;

          do {
            afinidade2 = sortearAfinidade();
          } while (afinidade2 === afinidade1);

          // BUFFS
          let buffs1 = afinidades[afinidade1];
          let buffs2 = afinidades[afinidade2];

          for (let key in buffs1) {
            estado.dados[key] += buffs1[key];
          }

          for (let key in buffs2) {
            estado.dados[key] += 1;
          }

          // CRIAR PERSONAGEM
          let personagem = {
            ...estado.dados,
            id: gerarID(),
            afinidade1,
            afinidade2,
            historia: "",
            inventario: [estado.dados.item]
          };

          jogadores[numero].personagens.push(personagem);

          resposta = `🧚 FICHA CRIADA!

👤 ${personagem.nome}
🆔 ${personagem.id}

🎂 ${personagem.idade}

🎭 ${personagem.aparencia}

✨ ${afinidade1}
🌟 ${afinidade2}

📊
❤️ ${personagem.vitalidade}
⚔️ ${personagem.forca}
✨ ${personagem.magia}
🛡️ ${personagem.defesa}
💨 ${personagem.destreza}

🎒 ${personagem.inventario.join(", ")}`;

          delete estados[numero];
        }
      }
    }
  }

  // PERFIL
  else if (msg.startsWith("!perfil")) {
    let index = parseInt(msg.split(" ")[1]) - 1;

    if (!jogadores[numero] || !jogadores[numero].personagens[index]) {
      resposta = "❌ Personagem não encontrado.";
    } else {
      let p = jogadores[numero].personagens[index];

      resposta = `📜 ${p.nome}

🆔 ${p.id}
🎂 ${p.idade}

🎭 ${p.aparencia}

✨ ${p.afinidade1}
🌟 ${p.afinidade2}

📊
❤️ ${p.vitalidade}
⚔️ ${p.forca}
✨ ${p.magia}
🛡️ ${p.defesa}
💨 ${p.destreza}

🎒 ${p.inventario.join(", ")}

📖 ${p.historia || "Sem história"}`;
    }
  }

  // HISTÓRIA
  else if (msg.startsWith("!historia")) {
    estados[numero] = { etapa: "historia", texto: msgOriginal.slice(10) };
    resposta = "Qual personagem? 1 ou 2?";
  }

  else if (estados[numero]?.etapa === "historia") {
    let index = parseInt(msgOriginal) - 1;

    if (jogadores[numero]?.personagens[index]) {
      jogadores[numero].personagens[index].historia = estados[numero].texto;
      resposta = "📖 História salva!";
      delete estados[numero];
    } else {
      resposta = "❌ Personagem inválido.";
    }
  }

  // DEFAULT
  else {
    resposta = `🧚 Comandos:

!criar
!perfil 1
!perfil 2
!historia texto
!cancelar`;
  }

  res.set("Content-Type", "text/xml");
  res.send(`<Response><Message>${resposta}</Message></Response>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor rodando"));
