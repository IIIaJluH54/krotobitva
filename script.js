// === Глобальные переменные ===
let user = null;
let coins = 0;
let diamonds = 0;
let clickPower = 1;
let autoCPS = 0;
let lastSave = Date.now();

let dailyRewardClaimedAt = 0;
let chestClaimedAt = 0;

// Улучшения
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

// Скины
let skins = [
  { src: "assets/krot.png", name: "Обычный", unlocked: true },
  { src: "assets/krot_hat.png", name: "Каска", unlocked: false },
  { src: "assets/krot_glasses.png", name: "Очки", unlocked: false }
];
let currentSkin = 0;

// === Загрузка игры ===
function loadGame() {
  const saved = localStorage.getItem("krotobitva_v3");
  if (saved) {
    try {
      const data = JSON.parse(saved);
      user = data.user || null;
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

      // Восстановление автогенерации
      const secondsPassed = (Date.now() - lastSave) / 1000;
      if (autoCPS > 0 && secondsPassed > 0) {
        coins += autoCPS * secondsPassed;
        coins = Math.floor(coins);
      }
    } catch (e) {
      console.error("Ошибка загрузки:", e);
    }
  }
}

// === Сохранение ===
function saveGame() {
  const data = {
    user, coins, diamonds, clickPower, autoCPS, lastSave: Date.now(),
    dailyRewardClaimedAt, chestClaimedAt, upgrades, skins, currentSkin
  };
  localStorage.setItem("krotobitva_v3", JSON.stringify(data));
}

// === Регистрация ===
function register() {
  const name = document.getElementById("username").value.trim();
  if (!name) return showToast("Введите имя!");
  user = name;
  document.getElementById("registerScreen").classList.add("hidden");
  document.getElementById("gameScreen").classList.remove("hidden");
  loadGame();
  updateDisplay();
  setInterval(saveGame, 15000); // Автосохранение
}

// === Обновление интерфейса ===
function updateDisplay() {
  document.getElementById("coins").textContent = format(coins);
  document.getElementById("diamonds").textContent = diamonds;
  if (user) {
    document.getElementById("profileName").textContent = user;
    document.getElementById("profileCoins").textContent = format(coins);
    document.getElementById("profileDiamonds").textContent = diamonds;
  }
  updateTimers();
  renderUpgrades();
  renderSkins();
}

// Формат чисел
function format(num) {
  return Math.floor(num).toLocaleString();
}

// === Таймеры для наград ===
function updateTimers() {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  // Ежедневная награда
  if (now - dailyRewardClaimedAt < day) {
    document.getElementById("dailyBtn").disabled = true;
    const hoursLeft = Math.ceil((day - (now - dailyRewardClaimedAt)) / (60 * 60 * 1000));
    document.getElementById("dailyTimer").textContent = `Доступно через: ${hoursLeft} ч`;
  } else {
    document.getElementById("dailyBtn").disabled = false;
    document.getElementById("dailyTimer").textContent = "";
  }

  // Сундук
  if (now - chestClaimedAt < day) {
    document.getElementById("chestBtn").disabled = true;
    const hoursLeft = Math.ceil((day - (now - chestClaimedAt)) / (60 * 60 * 1000));
    document.getElementById("chestTimer").textContent = `Доступно через: ${hoursLeft} ч`;
  } else {
    document.getElementById("chestBtn").disabled = false;
    document.getElementById("chestTimer").textContent = "";
  }
}

// === Меню ===
function openTab(id) {
  document.querySelectorAll(".menu").forEach(menu => menu.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function back() {
  document.querySelectorAll(".menu").forEach(menu => menu.classList.add("hidden"));
  document.getElementById("gameScreen").classList.remove("hidden");
}

// === Клик по кроту ===
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
  upgrades.forEach((upgrade, index) => {
    const div = document.createElement("div");
    div.className = "upgrade-item";
    div.innerHTML = `
      <strong>${upgrade.name}</strong> (${upgrade.level})
      <p>${upgrade.desc}</p>
      <button onclick="buyUpgrade(${index})">${upgrade.cost} 💰</button>
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

// === Ежедневная награда ===
function claimDaily() {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  if (now - dailyRewardClaimedAt < day) {
    const hoursLeft = Math.ceil((day - (now - dailyRewardClaimedAt)) / (60 * 60 * 1000));
    showToast(`Награда доступна через ${hoursLeft} ч`);
    return;
  }
  coins += 100;
  dailyRewardClaimedAt = now;
  updateDisplay();
  saveGame();
  showToast("Получено 100 монет!");
  updateTimers();
}

// === Сундук ===
function openChest() {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  if (now - chestClaimedAt < day) {
    const hoursLeft = Math.ceil((day - (now - chestClaimedAt)) / (60 * 60 * 1000));
    showToast(`Сундук доступен через ${hoursLeft} ч`);
    return;
  }
  chestClaimedAt = now;
  const rewards = [
    { msg: "50 монет", effect: () => coins += 50 },
    { msg: "100 монет", effect: () => coins += 100 },
    { msg: "Алмаз!", effect: () => diamonds++ },
    { msg: "Сила +1", effect: () => { clickPower++; upgrades[0].level++; } },
    { msg: "Разблокирован скин", effect: () => { skins[1].unlocked = true; } }
  ];
  const r = rewards[Math.floor(Math.random() * rewards.length)];
  r.effect();
  updateDisplay();
  saveGame();
  showToast("Сундук: " + r.msg);
  updateTimers();
}

// Принудительное открытие сундука (админ)
function adminForceChest() {
  chestClaimedAt = 0;
  openChest();
  showToast("Сундук принудительно открыт");
}

// === Скины ===
function renderSkins() {
  const container = document.getElementById("skinList");
  container.innerHTML = "";
  skins.forEach((skin, index) => {
    if (skin.unlocked) {
      const img = document.createElement("img");
      img.src = skin.src;
      img.onclick = () => equipSkin(index);
      if (index === currentSkin) img.classList.add("active");
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
    localStorage.removeItem("krotobitva_v3");
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
window.onload = () => {
  loadGame();
  const saved = localStorage.getItem("krotobitva_v3");
  if (saved && user) {
    document.getElementById("registerScreen").classList.add("hidden");
    document.getElementById("gameScreen").classList.remove("hidden");
    updateDisplay();
  }
};
