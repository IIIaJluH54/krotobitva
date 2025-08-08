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
  { src: "assets/krot_hat.png", name: "Каска", unlocked: false },
  { src: "assets/krot_glasses.png", name: "Очки", unlocked: false }
];
let currentSkin = 0;

let adminCode = "";
const ADMIN_SECRET = "KROT";

// === Загрузка ===
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

      const secondsPassed = (Date.now() - (data.lastSave || Date.now())) / 1000;
      if (autoCPS > 0 && secondsPassed > 0) {
        coins += autoCPS * secondsPassed;
        coins = Math.floor(coins);
      }
    }
  } catch (e) {
    console.error("Ошибка загрузки:", e);
  }
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

// === Старт ===
window.onload = () => {
  loadGame();
  updateDisplay();
  setInterval(saveGame, 15000);
  setInterval(updateTimers, 60000);
};

// === Обновление интерфейса ===
function updateDisplay() {
  document.getElementById("coins").textContent = Math.floor(coins);
  document.getElementById("diamonds").textContent = diamonds;
  document.getElementById("profileCoins").textContent = Math.floor(coins);
  document.getElementById("profileDiamonds").textContent = diamonds;
  updateTimers();
  renderUpgrades();
  renderSkins();

  if (window.adminVisible && !document.getElementById("admin-tab")) {
    const btn = document.createElement("button");
    btn.id = "admin-tab";
    btn.innerHTML = "🛠️";
    btn.onclick = () => switchPage("admin");
    document.querySelector(".bottom-nav").appendChild(btn);
  }
}

// === Переключение страниц — ИСПРАВЛЕНО ===
function switchPage(pageId) {
  // Скрыть все экраны
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.add("hidden");
  });

  // Показать нужный
  const target = document.getElementById(pageId);
  if (target) {
    target.classList.remove("hidden");
  } else {
    console.error("Страница не найдена:", pageId);
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
    document.getElementById("dailyTimer").textContent = 
      now - dailyRewardClaimedAt < day 
        ? `Через ${Math.ceil((day - (now - dailyRewardClaimedAt)) / 3600000)} ч` 
        : "";
  }

  const chestBtn = document.getElementById("chestBtn");
  if (chestBtn) {
    chestBtn.disabled = now - chestClaimedAt < day;
    document.getElementById("chestTimer").textContent = 
      now - chestClaimedAt < day 
        ? `Через ${Math.ceil((day - (now - chestClaimedAt)) / 3600000)} ч` 
        : "";
  }
}

// === Клик ===
document.getElementById("krot").addEventListener("click", () => {
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
  pop.style.left = event.clientX - 20 + "px";
  pop.style.top = event.clientY - 20 + "px";
  document.body.appendChild(pop);
  setTimeout(() => document.body.removeChild(pop), 1000);
});

// === Улучшения ===
function renderUpgrades() {
  const container = document.getElementById("upgradesList");
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
  adminCode += e.key.toUpperCase();
  if (adminCode.length > ADMIN_SECRET.length) adminCode = adminCode.slice(-ADMIN_SECRET.length);
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
  toast.textContent = msg;
  toast.style.opacity = "1";
  setTimeout(() => {
    toast.style.opacity = "0";
  }, 2000);
}
