// Игровые данные
let coins = 0;
let clickPower = 1;
let autoCPS = 0;
let lastSave = Date.now();
let dailyClaimed = false;
let adminCode = ""; // для ввода кода
const ADMIN_SECRET = "KROT"; // код для активации
// Загрузка прогресса
function loadGame() {
  const saved = localStorage.getItem("krotobitva");
  if (saved) {
    const data = JSON.parse(saved);
    coins = data.coins || 0;
    clickPower = data.clickPower || 1;
    autoCPS = data.autoCPS || 0;
    lastSave = data.lastSave || Date.now();
    dailyClaimed = data.dailyClaimed || false;
    if (data.krotSrc) document.getElementById("krot").src = data.krotSrc;
  }
  updateDisplay();

  // Восстановление автогенерации с учётом времени
  const now = Date.now();
  const secondsPassed = (now - lastSave) / 1000;
  if (secondsPassed > 0 && autoCPS > 0) {
    coins += autoCPS * secondsPassed;
    coins = Math.floor(coins);
    updateDisplay();
  }
}

// Сохранение прогресса
function saveGame() {
  const data = {
    coins,
    clickPower,
    autoCPS,
    lastSave: Date.now(),
    dailyClaimed,
    krotSrc: document.getElementById("krot").src.split("/").pop()
  };
  localStorage.setItem("krotobitva", JSON.stringify(data));
}

// Обновление интерфейса
function updateDisplay() {
  document.getElementById("coins").textContent = Math.floor(coins);
  document.getElementById("clickPower").textContent = clickPower;
  document.getElementById("autoCPS").textContent = autoCPS;
  document.getElementById("clickPowerText").textContent = clickPower; // новая строка
  document.getElementById("daily-btn").disabled = dailyClaimed;
}

// Клик по кроту
document.getElementById("krot").addEventListener("click", () => {
  coins += clickPower;
  updateDisplay();
  saveGame();

  // Эффект всплывающего числа
  const pop = document.createElement("div");
  pop.textContent = `+${clickPower}`;
  pop.style.cssText = `
    position: absolute;
    color: #FFD700;
    font-weight: bold;
    pointer-events: none;
    animation: pop-up 1s ease-out forwards;
  `;
  pop.style.left = event.clientX - 20 + "px";
  pop.style.top = event.clientY - 20 + "px";
  document.body.appendChild(pop);
  setTimeout(() => document.body.removeChild(pop), 1000);
});

// Покупка улучшений
function buyUpgrade(type, cost) {
  if (coins >= cost) {
    coins -= cost;
    if (type === "click") clickPower++;
    if (type === "auto") autoCPS++;
    updateDisplay();
    saveGame();
  } else {
    alert("Недостаточно монет!");
  }
}

// Открытие сундука
function openChest() {
  const rewards = [
    { msg: "10 монет", value: 10 },
    { msg: "50 монет", value: 50 },
    { msg: "Сила клика +1", effect: () => { clickPower++; } },
    { msg: "Автогенерация +1", effect: () => { autoCPS++; } },
  ];
  const rand = Math.floor(Math.random() * rewards.length);
  const reward = rewards[rand];
  coins += reward.value || 0;
  if (reward.effect) reward.effect();
  alert("Сундук! Ты получил: " + reward.msg);
  updateDisplay();
  saveGame();
}

// Ежедневная награда
function claimDaily() {
  if (dailyClaimed) {
    alert("Награда уже получена!");
    return;
  }
  coins += 100;
  dailyClaimed = true;
  updateDisplay();
  saveGame();
  alert("Вы получили 100 монет! Возвращайтесь завтра.");
}

// Смена скина
function equipSkin(src) {
  document.getElementById("krot").src = src;
  saveGame();
}

// Админ-команды
function adminAddCoins(amount) {
  coins += amount;
  updateDisplay();
  saveGame();
}

function adminOpenChest() {
  openChest();
}

// Автосохранение и автогенерация
setInterval(() => {
  if (autoCPS > 0) {
    coins += autoCPS / 10; // 10 раз в секунду
    updateDisplay();
  }
}, 100);

// Авто-сохранение каждые 10 сек
setInterval(saveGame, 10000);

// Загрузка при старте
window.onload = loadGame;
// Слушаем нажатия клавиш для активации админки
window.addEventListener("keydown", function (e) {
  // Добавляем символ к коду
  if (e.key.length === 1 && e.key.match(/[a-zA-Z]/i)) {
    adminCode += e.key.toUpperCase();
    // Оставляем только последние 4 символа
    if (adminCode.length > ADMIN_SECRET.length) {
      adminCode = adminCode.slice(-ADMIN_SECRET.length);
    }
    // Проверяем код
    if (adminCode === ADMIN_SECRET) {
      showAdminPanel();
      adminCode = ""; // сбрасываем
    }
  } else {
    // Если не буква — сбрасываем (опционально)
    // adminCode = ""; // раскомментировать, если хочешь строгий ввод
  }
});
// Показать панель
function showAdminPanel() {
  document.getElementById("adminPanel").classList.add("admin-panel-visible");
  document.getElementById("adminOverlay").classList.add("active");
  // Запрещаем скролл
  document.body.style.overflow = "hidden";
}

// Скрыть панель
function toggleAdminPanel() {
  document.getElementById("adminPanel").classList.remove("admin-panel-visible");
  document.getElementById("adminOverlay").classList.remove("active");
  document.body.style.overflow = ""; // возвращаем скролл
}

// Админ-функции
function adminAddCoins(amount) {
  coins += amount;
  updateDisplay();
  saveGame();
  showToast(`+${amount} монет`);
}

function adminOpenChest() {
  openChest(); // используем существующую функцию
}

function adminGiveSkin(index) {
  const skins = [
    "assets/krot.png",
    "assets/krot_hat.png",
    "assets/krot_glasses.png"
  ];
  if (skins[index]) {
    document.getElementById("krot").src = skins[index];
    saveGame();
    showToast(`Скин ${index} активирован`);
  }
}

function unlockAllSkins() {
  // В реальной игре можно добавить систему "разблокировано"
  // Здесь просто показываем уведомление
  const skinImgs = document.querySelectorAll(".skin");
  skinImgs.forEach(img => {
    img.style.filter = "none";
    img.title = "Разблокирован";
  });
  showToast("Все скины разблокированы!");
}

function resetProgress() {
  if (confirm("Вы уверены, что хотите сбросить весь прогресс?")) {
    localStorage.removeItem("krotobitva");
    location.reload(); // перезагрузка с чистого листа
  }
}

// Всплывающее уведомление (опционально)
function showToast(message) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #333;
    color: #FFD700;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 0.9em;
    z-index: 2000;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    opacity: 0;
    transition: opacity 0.3s;
  `;
  document.body.appendChild(toast);
  setTimeout(() => (toast.style.opacity = "1"), 100);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 2000);
}
function updateDisplay() {
  document.getElementById("coins").textContent = Math.floor(coins);
  document.getElementById("clickPower").textContent = clickPower;
  document.getElementById("autoCPS").textContent = Math.floor(autoCPS);
  document.getElementById("clickPowerText").textContent = clickPower;
  document.getElementById("daily-btn").disabled = dailyClaimed;
}
