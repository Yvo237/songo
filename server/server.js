const express = require('express');
const cors = require('cors');
const { SongoGame } = require('./gameEngine');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static('../client'));

const game = new SongoGame();

app.get('/get-board', (req, res) => {
  res.json(game.getState());
});

app.post('/play', (req, res) => {
  const { player, cell } = req.body;
  if (player === undefined || cell === undefined) {
    return res.status(400).json({ error: 'Paramètres manquants' });
  }
  if (game.turn !== player) {
    return res.status(400).json({ error: 'Pas votre tour' });
  }
  const result = game.play(cell);
  if (!result) return res.status(400).json({ error: 'Coup invalide' });
  res.json({ state: game.getState(), move: result });
});

app.post('/reset', (req, res) => {
  Object.assign(game, new SongoGame());
  res.json(game.getState());
});

app.listen(PORT, () => console.log(`Songo server on http://localhost:${PORT}`));
