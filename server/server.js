const express = require('express');
const cors = require('cors');
const { SongoGame } = require('./gameEngine');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static('client'));

const games = new Map();

function generateRoom() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  } while (games.has(code));
  return code;
}

app.post('/create-game', (req, res) => {
  const room = generateRoom();
  games.set(room, { game: new SongoGame(), players: [{ name: req.body.name || 'Joueur 1', connected: true }, { name: 'Joueur 2', connected: false }] });
  res.json({ room, state: games.get(room).game.getState(), players: games.get(room).players });
});

app.post('/join-game', (req, res) => {
  const { room } = req.body;
  const entry = games.get(room);
  if (!entry) return res.status(404).json({ error: 'Partie introuvable' });
  entry.players[1].name = req.body.name || 'Joueur 2';
  entry.players[1].connected = true;
  res.json({ state: entry.game.getState(), players: entry.players });
});

app.get('/get-board', (req, res) => {
  const { room } = req.query;
  const entry = games.get(room);
  if (!entry) return res.status(404).json({ error: 'Partie introuvable' });
  res.json({ ...entry.game.getState(), players: entry.players });
});

app.post('/play', (req, res) => {
  const { room, player, cell } = req.body;
  const entry = games.get(room);
  if (!entry) return res.status(404).json({ error: 'Partie introuvable' });
  const game = entry.game;
  if (game.turn !== player) {
    return res.status(400).json({ error: 'Pas votre tour' });
  }
  const result = game.play(cell);
  if (!result) return res.status(400).json({ error: 'Coup invalide' });
  res.json({ state: game.getState(), move: result, players: entry.players });
});

app.post('/reset', (req, res) => {
  const { room } = req.body;
  const entry = games.get(room);
  if (!entry) return res.status(404).json({ error: 'Partie introuvable' });
  const names = entry.players.map(p => p.name);
  Object.assign(entry.game, new SongoGame());
  entry.players = names.map((n, i) => ({ name: n, connected: i === 0 }));
  res.json({ ...entry.game.getState(), players: entry.players });
});

app.listen(PORT, () => console.log(`Songo server on http://localhost:${PORT}`));
