// Данные
let user = null;
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

// Загрузка
function loadGame() {
  const saved = localStorage.getItem("krotobitva_v3");
  if (saved) {
    const data = JSON.parse(saved);
    Object.assign(this, data);
    // Восстановление автогенерации
    const secondsPassed = (Date.now() - lastSave) / 1000;
    if (autoCPS > 0) coins += autoCPS * secondsPassed;
    coins = Math.floor(coins);
  }
  renderUpgrades();
  renderSkins();
}

// Сохранение
function saveGame() {
  const data = {
    coins, diamonds, clickPower, autoCPS, lastSave: Date.now(),
    dailyRewardClaimedAt, chestClaimedAt, upgrades, skins, currentSkin
  };
  localStorage.setItem("krotobitva_v3", JSON.stringify(data));
}

// Регистрация
function register() {
  const name = document.getElementById("username").value.trim();
  if (!name) return alert("Введите имя!");
  user = name;
  document.getElementById("registerScreen").classList.add("hidden");
  document.getElementById("gameScreen").classList.remove("hidden");
  loadGame();
  updateDisplay();
  setInterval(saveGame, 15000);
}

// Обновление баланса
function updateDisplay() {
  document.getElementById("coins").textContent = format(coins);
  document.getElementById("diamonds").textContent = diamonds;
  if (user) {
    document.getElementById("profileName").textContent = user;
    document.getElementById("profileCoins").textContent = format(coins);
    document.getElementById("profileDiamonds").textContent = diamonds;
  }
  updateTimers();
}

// Формат чисел
function format(num) {
  return Math.floor(num).toLocaleString();
}

// Таймеры
function updateTimers() {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  // Ежедневная награда
  if (now - dailyRewardClaimedAt < day) {
    document.getElementById("dailyBtn").disabled = true;
    const left = Math.ceil((day - (now - dailyRewardClaimedAt)) / (60 * 60 * 1000));
    document.getElementById("dailyTimer").textContent = `Доступно через: ${left} ч`;
  } else {
    document.getElementById("dailyBtn").disabled = false;
    document.getElementById("dailyTimer").textContent = "";
  }

  // Сундук
  if (now - chestClaimedAt < day) {
    document.getElementById("chestBtn").disabled = true;
    const left = Math.ceil((day - (now - chestClaimedAt)) / (60 * 60 * 1000));
    document.getElementById("chestTimer").textContent = `Доступно через: ${left} ч`;
  } else {
    document.getElementById("chestBtn").disabled = false;
    document.getElementById("chestTimer").textContent = "";
  }
}

// Меню
function openTab(id) {
  document.querySelectorAll(".menu").forEach(m => m.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

function back() {
  document.querySelectorAll(".menu").forEach(m => m.classList.add("hidden"));
  document.getElementById("gameScreen").classList.remove("hidden");
}

// Клик
document.getElementById("krot").addEventListener("click", () => {
  coins += clickPower;
  updateDisplay();
  saveGame();

  const pop = document.createElement("div");
  pop.textContent = `+${clickPower}`;
  pop.style.cssText = `
    position: absolute; color: #0f0; font-weight: bold;
    pointer-events: none; animation: pop-up 1s ease-out forwards;
  `;
  pop.style.left = event.clientX - 20 + "px";
  pop.style.top = event.clientY - 20 + "px";
  document.body.appendChild(pop);
  setTimeout(() => document.body.removeChild(pop), 1000);
});

// Улучшения
function renderUpgrades() {
  const container = document.getElementById("upgradesList");
  container.innerHTML = "";
  upgrades.forEach(u => {
    const div = document.createElement("div");
    div.className = "upgrade-item";
    div.innerHTML = `
      <strong>${u.name}</strong> (${u.level})
      <p>${u.desc}</p>
      <button onclick="buyUpgrade(${upgrades.indexOf(u)})">${u.cost} 💰</button>
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
    if (u.type === "click") clickPower += u.level % 5 === 0 ? 5 : 1;
    if (u.type === "auto") autoCPS += u.level % 5 === 0 ? 10 : 1;
    updateDisplay();
    renderUpgrades();
    saveGame();
    showToast(`Улучшено: ${u.name}`);
  } else {
    showToast("Недостаточно монет!");
  }
}

// Награды
function claimDaily() {
  const now = Date.now();
  if (now - dailyRewardClaimedAt < 24 * 60 * 60 * 1000) {
    const left = Math.ceil((24 * 60 * 60 * 1000 - (now - dailyRewardClaimedAt)) / (60 * 60 * 1000));
    showToast(`Награда доступна через ${left} ч`);
    return;
  }
  coins += 100;
  dailyRewardClaimedAt = now;
  updateDisplay();
  saveGame();
  showToast("Получено 100 монет!");
  updateTimers();
}

function openChest() {
  const now = Date.now();
  if (now - chestClaimedAt < 24 * 60 * 60 * 1000) {
    const left = Math.ceil((24 * 60 * 60 * 1000 - (now - chestClaimedAt)) / (60 * 60 * 1000));
    showToast(`Сундук доступен через ${left} ч`);
    return;
  }
  chestClaimedAt = now;
  const rewards = [
    { msg: "50 монет", effect: () => coins += 50 },
    { msg: "100 монет", effect: () => coins += 100 },
    { msg: "Алмаз!", effect: () => diamonds++ },
    { msg: "Сила +1", effect: () => { clickPower++; upgrades[0].level++; } },
    { msg: "Разблокирован скин", effect: () => { skins[1].unlocked = true; renderSkins(); } }
  ];
  const r = rewards[Math.floor(Math.random() * rewards.length)];
  r.effect();
  updateDisplay();
  saveGame();
  showToast("Сундук: " + r.msg);
  updateTimers();
}

// Скины
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

// Админ
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

function adminOpenChest() {
  openChest();
}

function resetProgress() {
  if (confirm("Сбросить прогресс?")) {
    localStorage.removeItem("krotobitva_v3");
    location.reload();
  }
}

// Уведомления
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.style.opacity = "1";
  setTimeout(() => toast.style.opacity = "0", 2000);
}

// Авто-генерация
setInterval(() => {
  if (autoCPS > 0) {
    coins += autoCPS / 10;
    updateDisplay();
  }
}, 100);

// Авто-обновление таймеров
setInterval(updateTimers, 60000);

// Загрузка
window.onload = () => {
  const saved = localStorage.getItem("krotobitva_v3");
  if (saved) {
    document.getElementById("registerScreen").classList.add("hidden");
    document.getElementById("gameScreen").classList.remove("hidden");
    loadGame();
    updateDisplay();
    setInterval(saveGame, 15000);
  }
};
