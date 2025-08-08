const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: String,
  coins: { type: Number, default: 0 },
  diamonds: { type: Number, default: 0 },
  clickPower: { type: Number, default: 1 },
  autoCPS: { type: Number, default: 0 },
  upgrades: { type: Array, default: [] },
  skins: { type: Array, default: [] },
  currentSkin: { type: Number, default: 0 },
  isAdmin: { type: Boolean, default: false },
  banned: { type: Boolean, default: false },
  muted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);
