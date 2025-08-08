// === Данные ===
let coins = 0;
let diamonds = 0;
let clickPower = 1;
let autoCPS = 0;

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
  { src: "assets/krot_hat.png", name: "Каска", unlocked: true },  // Разблокированы для теста
  { src: "assets/krot_glasses.png", name: "Очки", unlocked: true }
];
let currentSkin = 0;

let adminCode = "";
const ADMIN_SECRET = "KROT";

// === Загрузка прогресса ===
function loadGame() {
  try {
    const saved = localStorage.getItem("krotobitva_v6");
    if (saved) {
      const data = JSON.parse(saved);
      coins = data.coins || 0;
      diamonds = data.diamonds || 0;
      clickPower = data.clickPower || 1;
      autoCPS = data.autoCPS || 0;
      dailyRewardClaimedAt = data.dailyRewardClaimedAt || 0;
      chestClaimedAt = data.chestClaimedAt || 0;
      upgrades = data.upgrades || upgrades;
      skins = data.skins || skins;
      currentSkin = data.currentSkin || 0;

      // Восстановление монет за время отсутствия
      const secondsPassed = (Date.now() - (data.lastSave || Date.now())) / 1000;
      if (autoCPS > 0 && secondsPassed > 0) {
        coins += autoCPS * secondsPassed;
        coins = Math.floor(coins);
      }
    }
  } catch (e) {
    console.error("Ошибка загрузки:", e);
  }

  // Убедиться, что крот и скины загружены
  updateDisplay();
}

// === Сохранение ===
function saveGame() {
  const data = {
    coins, diamonds, clickPower, autoCPS,
    dailyRewardClaimedAt, chestClaimedAt,
    upgrades, skins, currentSkin,
    lastSave: Date.now()
  };
  try {
    localStorage.setItem("krotobitva_v6", JSON.stringify(data));
  } catch (e) {
    console.error("Ошибка сохранения:", e);
  }
}

// === Старт игры ===
window.onload = () => {
  loadGame();
  updateDisplay();
  setInterval(saveGame, 15000);
  setInterval(updateTimers, 60000);
};

// === Обновление интерфейса ===
function updateDisplay() {
  // Обновление баланса
  const coinsEl = document.getElementById("coins");
  const diamondsEl = document.getElementById("diamonds");
  if (coinsEl) coinsEl.textContent = Math.floor(coins);
  if (diamondsEl) diamondsEl.textContent = diamonds;

  // Обновление профиля
  const profileCoinsEl = document.getElementById("profileCoins");
  const profileDiamondsEl = document.getElementById("profileDiamonds");
  if (profileCoinsEl) profileCoinsEl.textContent = Math.floor(coins);
  if (profileDiamondsEl) profileDiamondsEl.textContent = diamonds;

  // Обновление таймеров
  updateTimers();

  // Обновление улучшений и скинов
  renderUpgrades();
  renderSkins();

  // Обновление крота на главной
  const krotImg = document.getElementById("krot");
  if (krotImg && skins[currentSkin]) {
    krotImg.src = skins[currentSkin].src;
  }

  // Показ админ-вкладки
  if (window.adminVisible && !document.getElementById("admin-tab")) {
    const btn = document.createElement("button");
    btn.id = "admin-tab";
    btn.innerHTML = "🛠️";
    btn.onclick = () => switchPage("admin");
    const nav = document.querySelector(".bottom-nav");
    if (nav) nav.appendChild(btn);
  }
}

// === Переключение страниц ===
function switchPage(pageId) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.add("hidden");
  });

  const target = document.getElementById(pageId);
  if (target) {
    target.classList.remove("hidden");
  } else {
    document.getElementById("gameScreen").classList.remove("hidden");
  }
}

// === Таймеры ===
function updateTimers() {
  const now = Date.now();
  const day = 86400000;

  const dailyBtn = document.getElementById("dailyBtn");
  if (dailyBtn) {
    dailyBtn.disabled = now - dailyRewardClaimedAt < day;
    const timer = document.getElementById("dailyTimer");
    if (timer) {
      timer.textContent = now - dailyRewardClaimedAt < day
        ? `Через ${Math.ceil((day - (now - dailyRewardClaimedAt)) / 3600000)} ч`
        : "";
    }
  }

  const chestBtn = document.getElementById("chestBtn");
  if (chestBtn) {
    chestBtn.disabled = now - chestClaimedAt < day;
    const timer = document.getElementById("chestTimer");
    if (timer) {
      timer.textContent = now - chestClaimedAt < day
        ? `Через ${Math.ceil((day - (now - chestClaimedAt)) / 3600000)} ч`
        : "";
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
  if (now - dailyRewardClaimedAt < 86400000) {
    const h = Math.ceil((86400000 - (now - dailyRewardClaimedAt)) / 3600000);
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
  if (now - chestClaimedAt < 86400000) {
    const h = Math.ceil((86400000 - (now - chestClaimedAt)) / 3600000);
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

  skins.forEach((skin, index) => {
    if (skin.unlocked) {
      const img = document.createElement("img");
      img.src = skin.src;
      img.alt = skin.name;
      img.title = skin.name;
      img.className = index === currentSkin ? "active" : "";
      img.onclick = () => equipSkin(index);
      container.appendChild(img);
    }
  });
}

// === ВАЖНО: Функция, которая меняет крота на главной ===
function equipSkin(index) {
  if (!skins[index] || !skins[index].unlocked) return;

  currentSkin = index;

  // Обновляем изображение на главной
  const krotImg = document.getElementById("krot");
  if (krotImg) {
    krotImg.src = skins[index].src;
  }

  // Обновляем выделение в меню
  renderSkins();

  // Сохраняем
  saveGame();
  showToast(`Скин: ${skins[index].name}`);
}

// === Админ-панель ===
document.addEventListener("keydown", (e) => {
  adminCode += e.key.toUpperCase();
  if (adminCode.length > ADMIN_SECRET.length) {
    adminCode = adminCode.slice(-ADMIN_SECRET.length);
  }
  if (adminCode === ADMIN_SECRET) {
    window.adminVisible = true;
    switchPage("admin");
    showToast("🔓 Админ-режим");
    adminCode = "";
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
  if (confirm("Сбросить прогресс?")) {
    localStorage.removeItem("krotobitva_v6");
    location.reload();
  }
}

// === Уведомления ===
function showToast(msg) {
  const toast = document.getElementById("toast");
  if (toast) {
    toast.textContent = msg;
    toast.style.opacity = "1";
    setTimeout(() => {
      toast.style.opacity = "0";
    }, 2000);
  }
}
