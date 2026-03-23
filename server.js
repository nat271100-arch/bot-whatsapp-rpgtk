const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: false }));

const afinidades = [
  "Natureza 🌿", "Água 💧", "Animais 🐾", "Luz ✨",
  "Vento 🌬️", "Arte 🎨", "Culinária 🧁",
  "Tecnologia ⚙️", "Fogo 🔥", "Inverno ❄️",
  "Cura 🌿", "Pó mágico ✨", "Sonhos 🌙", "Tempo ⏳"
];

function sortear() {
  return afinidades[Math.floor(Math.random() * afinidades.length)];
}

function gerarAfinidade() {
  let principal = sortear();
  let secundaria;

  do {
    secundaria = sortear();
  } while (secundaria === principal);

  return `🧚 O pó mágico gira ao seu redor...

✨ Afinidade Principal: ${principal}
🌟 Afinidade Secundária: ${secundaria}

Sua magia começa a despertar...`;
}

app.post("/bot", (req, res) => {
  const msg = req.body.Body;

  let resposta = "";

  if (msg && msg.toLowerCase() === "!afinidade") {
    resposta = gerarAfinidade();
  } else {
    resposta = "Digite !afinidade para descobrir sua magia 🧚";
  }

  res.set("Content-Type", "text/xml");
  res.send(`
    <Response>
      <Message>${resposta}</Message>
    </Response>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor rodando"));
