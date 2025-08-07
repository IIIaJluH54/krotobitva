// === Глобальные переменные ===
let user = "Player";
let coins = 0;
let diamonds = 0;
let clickPower = 1;
let autoCPS = 0;
let lastSave = Date.now();

let dailyRewardClaimedAt = 0;
let chestClaimedAt = 0;

let upgrades = [
  { name: "Когти", desc: "Сила клика +1", cost: 10, type: "click", level: 0 },
  { name: "Кирка", desc: "Сила клика +1", cost: 25, type: "click", level: 0 },
  { name: "Автогенератор", desc: "+1 монета/сек", cost: 50, type: "auto", level: 0 },
  { name: "Ядерный реактор", desc: "+5 монет/сек", cost: 500, type: "auto", level: 0 },
  { name: "Лазерные глаза", desc: "Сила клика +5", cost: 100, type: "click", level: 0 },
  { name: "Гравитационный бур", desc: "Сила клика +10", cost: 500, type: "click", level: 0 },
  { name: "Нано-генератор", desc: "+10 монет/сек", cost: 1000, type: "auto", level: 0 },
  { name: "Кибер-лапы", desc: "Сила клика x2", cost: 10000, type: "click", level: 0 },
  { name: "Чёрная дыра", desc: "+100 монет/сек", cost: 50000, type: "auto", level: 0 },
  { name: "Квантовый крот", desc: "Сила клика x5", cost: 50000, type: "click", level: 0 }
];

let skins = [
  { src: "assets/krot.png", name: "Обычный", unlocked: true },
  { src: "assets/krot_hat.png", name: "Каска", unlocked: false },
  { src: "assets/krot_glasses.png", name: "Очки", unlocked: false }
];
let currentSkin = 0;

let adminCode = "";
const ADMIN_SECRET = "KROT";

// === Загрузка игры ===
function loadGame() {
  try {
    const saved = localStorage.getItem("krotobitva_v4");
    if (saved) {
      const data = JSON.parse(saved);
      user = data.user || "Player";
      coins = data.coins || 0;
      diamonds = data.diamonds || 0;
      clickPower = data.clickPower || 1;
      autoCPS = data.autoCPS || 0;
      lastSave = data.lastSave || Date.now();
      dailyRewardClaimedAt = data.dailyRewardClaimedAt || 0;
      chestClaimedAt = data.chestClaimedAt || 0;
      upgrades = data.upgrades || upgrades;
      skins = data.skins || skins;
      currentSkin = data.currentSkin || 0;

      // Восстановление монет за время отсутствия
      const secondsPassed = (Date.now() - lastSave) / 1000;
      if (autoCPS > 0 && secondsPassed > 0) {
        coins += autoCPS * secondsPassed;
        coins = Math.floor(coins);
      }
    }
  } catch (e) {
    console.error("Ошибка загрузки прогресса:", e);
  }
}

// === Сохранение ===
function saveGame() {
  const data = {
    user, coins, diamonds, clickPower, autoCPS, lastSave: Date.now(),
    dailyRewardClaimedAt, chestClaimedAt, upgrades, skins, currentSkin
  };
  try {
    localStorage.setItem("krotobitva_v4", JSON.stringify(data));
  } catch (e) {
    console.error("Ошибка сохранения:", e);
  }
}

// === Вход через Telegram ===
function connectTelegram() {
  const btn = document.getElementById("connectBtn");
  btn.disabled = true;
  btn.textContent = "Загрузка...";

  // Имитация входа
  setTimeout(() => {
    user = "Телеграм-Игрок";
    document.getElementById("telegramScreen").classList.add("hidden");
    document.getElementById("gameScreen").classList.remove("hidden");
    loadGame();
    updateDisplay();
    setInterval(saveGame, 15000); // Автосохранение
  }, 500);
}

// === Обновление интерфейса ===
function updateDisplay() {
  document.getElementById("coins").textContent = format(coins);
  document.getElementById("diamonds").textContent = diamonds;
  if (document.getElementById("profileName")) {
    document.getElementById("profileName").textContent = user;
    document.getElementById("profileCoins").textContent = format(coins);
    document.getElementById("profileDiamonds").textContent = diamonds;
  }
  updateTimers();
  renderUpgrades();
  renderSkins();

  // Показ админ-вкладки, если активирована
  if (window.adminVisible && !document.querySelector('#admin-tab')) {
    const nav = document.querySelector('.bottom-nav');
    const adminBtn = document.createElement('button');
    adminBtn.id = 'admin-tab';
    adminBtn.innerHTML = '🛠️';
    adminBtn.onclick = () => switchPage('admin');
    nav.appendChild(adminBtn);
  }
}

// Формат чисел
function format(num) {
  return Math.floor(num).toLocaleString();
}

// === Переключение страниц ===
function switchPage(page) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.add("hidden");
  });
  document.getElementById(page).classList.remove("hidden");
}

// === Таймеры ===
function updateTimers() {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  // Ежедневная награда
  if (now - dailyRewardClaimedAt < day) {
    const hours = Math.ceil((day - (now - dailyRewardClaimedAt)) / 3600000);
    const btn = document.getElementById("dailyBtn");
    if (btn) {
      btn.disabled = true;
      document.getElementById("dailyTimer").textContent = `Доступно через: ${hours} ч`;
    }
  } else {
    const btn = document.getElementById("dailyBtn");
    if (btn) {
      btn.disabled = false;
      document.getElementById("dailyTimer").textContent = "";
    }
  }

  // Сундук
  if (now - chestClaimedAt < day) {
    const hours = Math.ceil((day - (now - chestClaimedAt)) / 3600000);
    const btn = document.getElementById("chestBtn");
    if (btn) {
      btn.disabled = true;
      document.getElementById("chestTimer").textContent = `Доступно через: ${hours} ч`;
    }
  } else {
    const btn = document.getElementById("chestBtn");
    if (btn) {
      btn.disabled = false;
      document.getElementById("chestTimer").textContent = "";
    }
  }
}

// === Клик по кроту ===
document.addEventListener("click", (e) => {
  if (e.target.id === "krot") {
    coins += clickPower;
    updateDisplay();
    saveGame();

    const pop = document.createElement("div");
    pop.textContent = `+${clickPower}`;
    pop.style.cssText = `
      position: absolute;
      color: #0f0;
      font-weight: bold;
      pointer-events: none;
      animation: pop-up 1s ease-out forwards;
    `;
    pop.style.left = e.clientX - 20 + "px";
    pop.style.top = e.clientY - 20 + "px";
    document.body.appendChild(pop);
    setTimeout(() => document.body.removeChild(pop), 1000);
  }
});

// === Улучшения ===
function renderUpgrades() {
  const container = document.getElementById("upgradesList");
  if (!container) return;
  container.innerHTML = "";
  upgrades.forEach((u, i) => {
    const div = document.createElement("div");
    div.className = "upgrade-item";
    div.innerHTML = `
      <strong>${u.name}</strong> (${u.level})
      <p>${u.desc}</p>
      <button onclick="buyUpgrade(${i})">${u.cost} 💰</button>
    `;
    container.appendChild(div);
  });
}

function buyUpgrade(index) {
  const u = upgrades[index];
  if (coins >= u.cost) {
    coins -= u.cost;
    u.level++;
    u.cost = Math.floor(u.cost * 1.5);
    if (u.type === "click") clickPower += (u.level % 5 === 0) ? 5 : 1;
    if (u.type === "auto") autoCPS += (u.level % 5 === 0) ? 10 : 1;
    updateDisplay();
    saveGame();
    showToast(`Улучшено: ${u.name}`);
  } else {
    showToast("Недостаточно монет!");
  }
}

// === Награды ===
function claimDaily() {
  const now = Date.now();
  const day = 86400000;
  if (now - dailyRewardClaimedAt < day) {
    const h = Math.ceil((day - (now - dailyRewardClaimedAt)) / 3600000);
    showToast(`Через ${h} ч`);
    return;
  }
  coins += 100;
  dailyRewardClaimedAt = now;
  updateDisplay();
  saveGame();
  showToast("100 монет получено!");
  updateTimers();
}

function openChest() {
  const now = Date.now();
  const day = 86400000;
  if (now - chestClaimedAt < day) {
    const h = Math.ceil((day - (now - chestClaimedAt)) / 3600000);
    showToast(`Сундук через ${h} ч`);
    return;
  }
  chestClaimedAt = now;
  const rewards = [
    { msg: "50 монет", effect: () => coins += 50 },
    { msg: "100 монет", effect: () => coins += 100 },
    { msg: "Алмаз!", effect: () => diamonds++ },
    { msg: "Сила +1", effect: () => clickPower += 1 },
    { msg: "Разблокирован скин", effect: () => skins[1].unlocked = true }
  ];
  const r = rewards[Math.floor(Math.random() * rewards.length)];
  r.effect();
  updateDisplay();
  saveGame();
  showToast("Сундук: " + r.msg);
  updateTimers();
}

function adminForceChest() {
  chestClaimedAt = 0;
  openChest();
}

// === Скины ===
function renderSkins() {
  const container = document.getElementById("skinList");
  if (!container) return;
  container.innerHTML = "";
  skins.forEach((s, i) => {
    if (s.unlocked) {
      const img = document.createElement("img");
      img.src = s.src;
      img.onclick = () => equipSkin(i);
      if (i === currentSkin) img.classList.add("active");
      container.appendChild(img);
    }
  });
}

function equipSkin(index) {
  currentSkin = index;
  document.getElementById("krot").src = skins[index].src;
  renderSkins();
  saveGame();
  showToast(`Скин: ${skins[index].name}`);
}

// === Админ-панель ===
document.addEventListener("keydown", (e) => {
  if (e.key.length === 1) {
    adminCode += e.key.toUpperCase();
    if (adminCode.length > ADMIN_SECRET.length) {
      adminCode = adminCode.slice(-ADMIN_SECRET.length);
    }
    if (adminCode === ADMIN_SECRET) {
      window.adminVisible = true;
      switchPage("admin");
      showToast("🔓 Админ-режим активирован");
      adminCode = "";
    }
  }
});

function adminAddCoins(amount) {
  coins += amount;
  updateDisplay();
  saveGame();
  showToast(`+${amount} монет`);
}

function adminAddDiamonds(amount) {
  diamonds += amount;
  updateDisplay();
  saveGame();
  showToast(`+${amount} алмазов`);
}

function resetProgress() {
  if (confirm("Сбросить весь прогресс?")) {
    localStorage.removeItem("krotobitva_v4");
    location.reload();
  }
}

// === Уведомления ===
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.style.opacity = "1";
  setTimeout(() => {
    toast.style.opacity = "0";
  }, 2000);
}

// === Авто-генерация ===
setInterval(() => {
  if (autoCPS > 0) {
    coins += autoCPS / 10;
    updateDisplay();
  }
}, 100);

// === Обновление таймеров ===
setInterval(updateTimers, 60000);

// === Загрузка при старте ===
window.onload = function () {
  const saved = localStorage.getItem("krotobitva_v4");
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (data.user) {
        document.getElementById("telegramScreen").classList.add("hidden");
        document.getElementById("gameScreen").classList.remove("hidden");
        loadGame();
        updateDisplay();
        setInterval(saveGame, 15000);
        return;
      }
    } catch (e) {
      console.error("Ошибка парсинга:", e);
    }
  }
  // Если нет сохранённого прогресса — показываем экран входа
  document.getElementById("telegramScreen").classList.remove("hidden");
};
