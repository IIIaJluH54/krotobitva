// Инициализация Telegram WebApp
const tg = window.Telegram?.WebApp;
tg.expand(); // раскрыть на весь экран

// Данные игрока
let player = {
  carrots: 0,
  damage: 1,
  level: 1,
  autoClick: false,
};

// DOM элементы
const $ = (id) => document.getElementById(id);
const carrotsEl = $('carrots');
const damageEl = $('damage');
const levelEl = $('level');
const krotBtn = $('krot');
const upgradeDamageBtn = $('upgrade-damage');
const unlockAutoBtn = $('unlock-autoclick');
const messageEl = $('message');

// Загрузка прогресса
function loadGame() {
  const saved = localStorage.getItem('krotobitva');
  if (saved) {
    player = JSON.parse(saved);
    updateUI();
  }
  checkUpgrades();
}

// Сохранение
function saveGame() {
  localStorage.setItem('krotobitva', JSON.stringify(player));
  if (tg) tg.MainButton.text = `Морковки: ${player.carrots}`;
}

// Обновление интерфейса
function updateUI() {
  carrotsEl.textContent = player.carrots;
  damageEl.textContent = player.damage;
  levelEl.textContent = player.level;
  unlockAutoBtn.disabled = player.carrots < 50 || player.autoClick;
}

// Показ сообщения
function showMsg(text, time = 2000) {
  messageEl.textContent = text;
  setTimeout(() => (messageEl.textContent = ''), time);
}

// Клик по кроту
krotBtn.addEventListener('click', () => {
  player.carrots += player.damage;
  player.level = Math.floor(Math.log2(player.carrots + 1)) + 1;
  updateUI();
  saveGame();

  // Эффект вибрации (на поддерживаемых устройствах)
  if (navigator.vibrate) navigator.vibrate(10);

  showMsg(`+${player.damage} морковки!`, 800);
});

// Улучшение урона
upgradeDamageBtn.addEventListener('click', () => {
  if (player.carrots >= 5) {
    player.carrots -= 5;
    player.damage += 1;
    updateUI();
    saveGame();
    showMsg('Когти усилены! 💪');
  } else {
    showMsg('Не хватает морковок!');
  }
});

// Автоклик
unlockAutoBtn.addEventListener('click', () => {
  if (player.carrots >= 50 && !player.autoClick) {
    player.carrots -= 50;
    player.autoClick = true;
    unlockAutoBtn.disabled = true;
    startAutoClick();
    updateUI();
    saveGame();
    showMsg('Автоклик активирован! 🤖');
  }
});

function startAutoClick() {
  setInterval(() => {
    if (player.autoClick) {
      player.carrots += player.damage;
      player.level = Math.floor(Math.log2(player.carrots + 1)) + 1;
      updateUI();
      saveGame();
    }
  }, 1000);
}

// Проверка доступности улучшений
function checkUpgrades() {
  unlockAutoBtn.disabled = player.carrots < 50 || player.autoClick;
}

// Запуск
loadGame();
checkUpgrades();
if (player.autoClick) startAutoClick();

// Настройка кнопки в Telegram
if (tg) {
  tg.MainButton.setText('Сохранить').show();
  tg.MainButton.onClick(saveGame);
}