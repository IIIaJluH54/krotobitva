let coins = 0;
let diamonds = 0;
let clickPower = 1;
let autoCPS = 0;
let lastSave = Date.now();
let dailyClaimed = false;
let adminCode = "";
const ADMIN_SECRET = "KROT";

let seasonPoints = 0;
let seasonLevel = 1;
let seasonStart = Date.now();
let dungeon = { level: 1, maxLevel: 5, lastReset: 0 };

let dailyQuests = {
  clicks: { current: 0, goal: 100, reward: 500, claimed: false },
  chests: { current: 0, goal: 3, reward: "chest", claimed: false },
  coins: { current: 0, goal: 5000, reward: 2, claimed: false }
};

let clan = {
  name: "Грызуны 88",
  members: 12,
  tasks: {
    coins: { current: 1200000, goal: 10000000, claimed: false }
  }
};

let leaderboard = [
  { name: "Крот-Мастер", coins: 1250000 },
  { name: "DigDug", coins: 980000 },
  { name: "Землерой", coins: 750000 }
];

let chatMessages = [
  { user: "Грызлик", msg: "Привет! Кто в подземелье?" },
  { user: "КротоБот", msg: "🎉 Новый сезон: Подземный бунт!" }
];

let currentTheme = "dark";

const sounds = {
  click: new Audio("https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3"),
  chest: new Audio("https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3"),
  levelup: new Audio("https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3")
};

function vibrate() {
  if ("vibrate" in navigator) navigator.vibrate(50);
}

function loadGame() {
  const saved = localStorage.getItem("krotobitva_v2");
  if (saved) {
    const data = JSON.parse(saved);
    Object.assign(this, data);
    const secondsPassed = (Date.now() - lastSave) / 1000;
    if (autoCPS > 0) coins += autoCPS * secondsPassed;
  }
  updateDisplay();
  applyTheme();
}

function saveGame() {
  const data = { coins, diamonds, clickPower, autoCPS, lastSave: Date.now(), dailyClaimed,
    seasonPoints, seasonLevel, seasonStart, dailyQuests, clan, chatMessages, currentTheme };
  localStorage.setItem("krotobitva_v2", JSON.stringify(data));
}

function updateDisplay() {
  document.getElementById("coins").textContent = Math.floor(coins);
  document.getElementById("diamonds").textContent = diamonds;
  document.getElementById("clickPower").textContent = clickPower;
  document.getElementById("autoCPS").textContent = Math.floor(autoCPS);
  document.getElementById("clickPowerText").textContent = clickPower;
  document.getElementById("seasonPoints").textContent = Math.floor(seasonPoints);
  document.getElementById("seasonLevel").textContent = seasonLevel;
  document.getElementById("daily-btn").disabled = dailyClaimed;

  for (let key in dailyQuests) {
    const q = dailyQuests[key];
    document.getElementById(`quest-${key}-current`).textContent = q.current;
    document.getElementById(`quest-${key}-goal`).textContent = q.goal;
    document.getElementById(`quest-${key}-btn`).disabled = q.current < q.goal || q.claimed;
  }

  document.getElementById("clan-coins").textContent = formatNumber(clan.tasks.coins.current);
  document.getElementById("clan-goal").textContent = formatNumber(clan.tasks.coins.goal);

  const hoursLeft = 24 - Math.floor((Date.now() - dungeon.lastReset) / (1000 * 60 * 60));
  document.getElementById("dungeon-timer").textContent = hoursLeft > 0 ? `${hoursLeft} ч` : "Готово!";

  const chatEl = document.getElementById("chat-list");
  chatEl.innerHTML = "";
  [...chatMessages.slice(-5)].forEach(m => {
    const item = document.createElement("div");
    item.innerHTML = `<b>${m.user}</b>: ${m.msg}`;
    chatEl.appendChild(item);
  });

  const leadEl = document.getElementById("leaderboard");
  leadEl.innerHTML = "";
  leaderboard.forEach(p => {
    const item = document.createElement("div");
    item.innerHTML = `${p.name}: <b>${formatNumber(p.coins)}</b>`;
    leadEl.appendChild(item);
  });
}

document.getElementById("krot").addEventListener("click", () => {
  coins += clickPower;
  seasonPoints += 0.1;
  dailyQuests.clicks.current++;
  dailyQuests.coins.current += clickPower;
  vibrate(); playSound("click");
  updateDisplay(); saveGame();

  const pop = document.createElement("div");
  pop.textContent = `+${clickPower}`;
  pop.style.cssText = `position: absolute; color: #FFD700; font-weight: bold;
    pointer-events: none; animation: pop-up 1s ease-out forwards;`;
  pop.style.left = event.clientX - 20 + "px";
  pop.style.top = event.clientY - 20 + "px";
  document.body.appendChild(pop);
  setTimeout(() => document.body.removeChild(pop), 1000);
});

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
  updateDisplay(); saveGame();
}

function buyUpgrade(type, cost) {
  if (coins >= cost) {
    coins -= cost;
    if (type === "click") clickPower++;
    if (type === "auto") autoCPS++;
    updateDisplay(); saveGame();
  }
}

function claimDaily() {
  if (dailyClaimed) return alert("Награда уже получена!");
  coins += 100;
  dailyClaimed = true;
  updateDisplay(); saveGame();
  alert("🎉 Вы получили 100 монет!");
}

function equipSkin(src) {
  document.getElementById("krot").src = src;
  document.querySelectorAll(".skin").forEach(img => img.classList.remove("active"));
  event.target.classList.add("active");
  saveGame();
}

function claimSeasonReward() {
  if (seasonPoints >= 100 && seasonLevel < 10) {
    seasonLevel++;
    diamonds += 5;
    playSound("levelup");
    alert(`🎉 Новый уровень сезона: ${seasonLevel}! +5 алмазов`);
  }
  updateDisplay(); saveGame();
}

function claimQuest(type) {
  const q = dailyQuests[type];
  if (q.current >= q.goal && !q.claimed) {
    q.claimed = true;
    if (q.reward === "chest") openChest();
    else if (q.reward > 1) diamonds += q.reward;
    else coins += q.reward;
    playSound("chest");
    alert(`Цель выполнена! Награда: ${q.reward} ${q.reward === "chest" ? "сундук" : "алмазов/монет"}`);
    updateDisplay(); saveGame();
  }
}

function claimClanTask() {
  if (clan.tasks.coins.current >= clan.tasks.coins.goal && !clan.tasks.coins.claimed) {
    clan.tasks.coins.claimed = true;
    coins += 50000;
    diamonds += 3;
    alert("Задание клана выполнено! +50к монет и 3 алмаза");
    updateDisplay(); saveGame();
  }
}

function enterDungeon() {
  const now = Date.now();
  if (now - dungeon.lastReset > 24 * 60 * 60 * 1000 || dungeon.lastReset === 0) {
    dungeon.lastReset = now;
    coins += 10000;
    openChest();
    alert("Вы прошли подземелье! +10к монет и сундук");
    updateDisplay(); saveGame();
  } else {
    alert("Подземелье доступно раз в 24 часа");
  }
}

function sendChat() {
  const input = document.getElementById("chat-input");
  const msg = input.value.trim();
  if (msg) {
    chatMessages.push({ user: "Вы", msg });
    updateDisplay(); saveGame();
    input.value = "";
  }
}

function applyTheme() {
  document.body.className = currentTheme;
  document.getElementById("theme-btn").textContent = 
    currentTheme === "dark" ? "💡" : currentTheme === "light" ? "🌙" : "🎮";
}

function switchTheme() {
  currentTheme = currentTheme === "dark" ? "light" : currentTheme === "light" ? "cyber" : "dark";
  applyTheme(); saveGame();
}

function playSound(name) {
  sounds[name].currentTime = 0;
  sounds[name].play().catch(() => {});
}

function formatNumber(num) {
  return num.toLocaleString();
}

// Админ
window.addEventListener("keydown", e => {
  if (e.key.length === 1) {
    adminCode += e.key.toUpperCase();
    if (adminCode.length > ADMIN_SECRET.length) adminCode = adminCode.slice(-ADMIN_SECRET.length);
    if (adminCode === ADMIN_SECRET) showAdminPanel();
  }
});

function showAdminPanel() {
  document.getElementById("adminPanel").classList.add("admin-panel-visible");
  document.getElementById("adminOverlay").classList.add("active");
  document.body.style.overflow = "hidden";
}

function toggleAdminPanel() {
  document.getElementById("adminPanel").classList.remove("admin-panel-visible");
  document.getElementById("adminOverlay").classList.remove("active");
  document.body.style.overflow = "";
}

function adminAddCoins(amount) {
  coins += amount;
  updateDisplay(); saveGame();
  showToast(`+${amount} монет`);
}

function adminAddDiamonds(amount) {
  diamonds += amount;
  updateDisplay(); saveGame();
  showToast(`+${amount} алмазов`);
}

function adminOpenChest() {
  openChest();
}

function adminGiveSkin(index) {
  const skins = ["assets/krot.png", "assets/krot_hat.png", "assets/krot_glasses.png"];
  if (skins[index]) {
    document.getElementById("krot").src = skins[index];
    document.querySelectorAll(".skin")[index].click();
    saveGame();
    showToast(`Скин ${index + 1} активирован`);
  }
}

function resetProgress() {
  if (confirm("Сбросить прогресс?")) {
    localStorage.removeItem("krotobitva_v2");
    location.reload();
  }
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    background: #333; color: #FFD700; padding: 10px 20px; border-radius: 8px;
    z-index: 2000; box-shadow: 0 4px 15px rgba(0,0,0,0.3); opacity: 0;
    transition: opacity 0.3s; font-size: 0.9em;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.style.opacity = "1", 100);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 2000);
}

setInterval(() => {
  if (autoCPS > 0) coins += autoCPS / 10;
  updateDisplay();
}, 100);

setInterval(saveGame, 15000);
window.onload = loadGame;
