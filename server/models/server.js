const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('../client'));

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Маршруты
const Player = require('./models/Player');

// Вход
app.post('/api/players/login', async (req, res) => {
  let player = await Player.findOne({ name: req.body.name });
  if (!player) player = await Player.create(req.body);
  res.json(player);
});

// Получить игрока
app.get('/api/players/:id', async (req, res) => {
  const player = await Player.findById(req.params.id);
  res.json(player);
});

// Обновить
app.put('/api/players/:id', async (req, res) => {
  const player = await Player.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(player);
});

// Все игроки
app.get('/api/players', async (req, res) => {
  const players = await Player.find().sort({ coins: -1 });
  res.json(players);
});

// Выдать монеты
app.patch('/api/players/:id/coins', async (req, res) => {
  const player = await Player.findById(req.params.id);
  player.coins += req.body.amount;
  await player.save();
  res.json(player);
});

// Запуск
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
