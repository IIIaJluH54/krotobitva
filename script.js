// 🧠 Основные переменные
let coins = 0;
let diamonds = 0; // Премиум-валюта
let clickPower = 1;
let autoCPS = 0;
let lastSave = Date.now();
let dailyClaimed = false;
let adminCode = "";
const ADMIN_SECRET = "KROT";

// 🏆 Сезон
let seasonPoints = 0;
let seasonLevel = 1;
const SEASON_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 дней
let seasonStart = Date.now();

// 🎯 Ежедневные цели
let dailyQuests = {
  clicks: { current: 0, goal: 100, reward: 500, claimed: false },
  chests: { current: 0, goal: 3, reward: "chest", claimed: false },
  coins: { current: 0, goal: 5000, reward: 2, claimed: false } // 2 алмаза
};

// 🏰 Клан
let clan = {
  name: "Грызуны 88",
  members: 12,
  totalCoins: 0,
  tasks: {
    coins: { current: 1200000, goal: 10000000, claimed: false }
  }
};

// 🏅 Рейтинг
let leaderboard = [
  { name: "Крот-Мастер", coins: 1250000 },
  { name: "DigDug", coins: 980000 },
  { name: "Землерой", coins: 750000 }
];

// 🕹️ Подземелье
let dungeon = {
  level: 1,
  maxLevel: 5,
  lastReset: 0,
  reward: "Монеты + Сундук"
};

// 💬 Чат
let chatMessages = [
  { user: "Грызлик", msg: "Привет! Кто в подземелье?" },
  { user: "КротоБот", msg: "🎉 Новый сезон: Подземный бунт!" }
];

// 🎨 Тема
let currentTheme = "dark"; // "dark", "light", "cyber"

// 🔊 Звуки
const sounds = {
  click: new Audio("https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3"),
  chest: new Audio("https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3"),
  levelup: new Audio("https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3")
};

// 📤 Вибрация
function vibrate() {
  if ("vibrate" in navigator) navigator.vibrate(50);
}

// 🚀 Загрузка
function loadGame() {
  const saved = localStorage.getItem("krotobitva_v2");
  if (saved) {
    const data = JSON.parse(saved);
    Object.assign(this, data);
    // Восстановление автогенерации
    const secondsPassed = (Date.now() - lastSave) / 1000;
    if (autoCPS > 0) coins += autoCPS * secondsPassed;
  }
  updateDisplay();
  applyTheme();
}

// 💾 Сохранение
function saveGame() {
  const data = { coins, diamonds, clickPower, autoCPS, lastSave: Date.now(), dailyClaimed, 
    seasonPoints, seasonLevel, seasonStart, dailyQuests, clan, chatMessages, currentTheme };
  localStorage.setItem("krotobitva_v2", JSON.stringify(data));
}

// 🖥️ Обновление интерфейса
function updateDisplay() {
  document.getElementById("coins").textContent = Math.floor(coins);
  document.getElementById("diamonds").textContent = diamonds;
  document.getElementById("clickPower").textContent = clickPower;
  document.getElementById("autoCPS").textContent = Math.floor(autoCPS);
  document.getElementById("seasonPoints").textContent = seasonPoints;
  document.getElementById("seasonLevel").textContent = seasonLevel;

  // Цели
  for (let key in dailyQuests) {
    const q = dailyQuests[key];
    document.getElementById(`quest-${key}-current`).textContent = q.current;
    document.getElementById(`quest-${key}-goal`).textContent = q.goal;
    document.getElementById(`quest-${key}-btn`).disabled = q.current < q.goal || q.claimed;
  }

  // Клан
  document.getElementById("clan-coins").textContent = formatNumber(clan.tasks.coins.current);
  document.getElementById("clan-goal").textContent = formatNumber(clan.tasks.coins.goal);

  // Подземелье
  const hoursLeft = 24 - Math.floor((Date.now() - dungeon.lastReset) / (1000 * 60 * 60));
  document.getElementById("dungeon-timer").textContent = hoursLeft > 0 ? `${hoursLeft} ч` : "Готово!";

  // Чат
  const chatEl = document.getElementById("chat-list");
  chatEl.innerHTML = "";
  [...chatMessages.slice(-5)].forEach(m => {
    const item = document.createElement("div");
    item.innerHTML = `<b>${m.user}</b>: ${m.msg}`;
    chatEl.appendChild(item);
  });

  // Рейтинг
  const leadEl = document.getElementById("leaderboard");
  leadEl.innerHTML = "";
  leaderboard.forEach(p => {
    const item = document.createElement("div");
    item.innerHTML = `${p.name}: <b>${formatNumber(p.coins)}</b>`;
    leadEl.appendChild(item);
  });
}

// 🖱️ Клик
document.getElementById("krot").addEventListener("click", () => {
  coins += clickPower;
  seasonPoints += 0.1;
  dailyQuests.clicks.current++;
  dailyQuests.coins.current += clickPower;
  vibrate();
  playSound("click");
  updateDisplay();
  saveGame();

  const pop = document.createElement("div");
  pop.textContent = `+${clickPower}`;
  pop.style.cssText = `
    position: absolute; color: #FFD700; font-weight: bold;
    pointer-events: none; animation: pop-up 1s ease-out forwards;
  `;
  pop.style.left = event.clientX - 20 + "px";
  pop.style.top = event.clientY - 20 + "px";
  document.body.appendChild(pop);
  setTimeout(() => document.body.removeChild(pop), 1000);
});

// 🎁 Сундук
function openChest() {
  dailyQuests.chests.current++;
  const rewards = [
    { msg: "10 монет", value: 10 },
    { msg: "50 монет", value: 50 },
    { msg: "Алмаз!", effect: () => { diamonds++; playSound("chest"); } },
    { msg: "Сила +1", effect: () => { clickPower++; } }
  ];
  const r = rewards[Math.floor(Math.random() * rewards.length)];
  coins += r.value || 0;
  if (r.effect) r.effect();
  alert("Сундук! Ты получил: " + r.msg);
  updateDisplay();
  saveGame();
}

// 🛠️ Улучшения
function buyUpgrade(type, cost) {
  if (coins >= cost) {
    coins -= cost;
    if (type === "click") clickPower++;
    if (type === "auto") autoCPS++;
    updateDisplay();
    saveGame();
  }
}

// 🌟 Сезон
function claimSeasonReward() {
  if (seasonPoints >= 100 && seasonLevel < 10) {
    seasonLevel++;
    diamonds += 5;
    playSound("levelup");
    alert(`🎉 Новый уровень сезона: ${seasonLevel}! +5 алмазов`);
  }
  updateDisplay();
  saveGame();
}

// 🎯 Цели
function claimQuest(type) {
  const q = dailyQuests[type];
  if (q.current >= q.goal && !q.claimed) {
    q.claimed = true;
    if (q.reward === "chest") openChest();
    else if (q.reward > 1) diamonds += q.reward;
    else coins += q.reward;
    playSound("chest");
    alert(`Цель выполнена! Награда: ${q.reward} ${q.reward === "chest" ? "сундук" : "алмазов/монет"}`);
    updateDisplay();
    saveGame();
  }
}

// 🏰 Клан
function claimClanTask() {
  if (clan.tasks.coins.current >= clan.tasks.coins.goal && !clan.tasks.coins.claimed) {
    clan.tasks.coins.claimed = true;
    coins += 50000;
    diamonds += 3;
    alert("Задание клана выполнено! +50к монет и 3 алмаза");
    updateDisplay();
    saveGame();
  }
}

// 🕹️ Подземелье
function enterDungeon() {
  const now = Date.now();
  if (now - dungeon.lastReset > 24 * 60 * 60 * 1000 || dungeon.lastReset === 0) {
    dungeon.lastReset = now;
    coins += 10000;
    openChest();
    alert("Вы прошли подземелье! +10к монет и сундук");
    updateDisplay();
    saveGame();
  } else {
    alert("Подземелье доступно раз в 24 часа");
  }
}

// 💬 Чат
function sendChat() {
  const input = document.getElementById("chat-input");
  const msg = input.value.trim();
  if (msg) {
    chatMessages.push({ user: "Вы", msg });
    updateDisplay();
    saveGame();
    input.value = "";
  }
}

// 🎨 Темы
function applyTheme() {
  document.body.className = currentTheme;
  document.getElementById("theme-btn").textContent = 
    currentTheme === "dark" ? "💡" : currentTheme === "light" ? "🌙" : "🎮";
}

function switchTheme() {
  currentTheme = currentTheme === "dark" ? "light" : currentTheme === "light" ? "cyber" : "dark";
  applyTheme();
  saveGame();
}

// 🔊 Звук
function playSound(name) {
  sounds[name].currentTime = 0;
  sounds[name].play().catch(() => {});
}

// 🧮 Формат чисел
function formatNumber(num) {
  return num.toLocaleString();
}

// ⏳ Авто-сохранение
setInterval(() => {
  if (autoCPS > 0) coins += autoCPS / 10;
  updateDisplay();
}, 100);
setInterval(saveGame, 15000);
window.onload = loadGame;
