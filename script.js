// === Крото Битва — 100% РАБОЧАЯ ВЕРСИЯ ===

let player = {
  carrots: 0,
  damage: 1,
  autoClick: false,
  autoClickLevel: 0,
  level: 1,
  upgrades: { damage: 0, auto: 0 }
};

const $ = id => document.getElementById(id);

// Загрузка прогресса
function loadGame() {
  const saved = localStorage.getItem('krotobitva');
  if (saved) {
    try {
      Object.assign(player, JSON.parse(saved));
    } catch (e) {
      console.warn("Ошибка парсинга данных");
    }
  }
  updateUI();
}

// Сохранение
function saveGame() {
  localStorage.setItem('krotobitva', JSON.stringify(player));
}

// Обновление UI
function updateUI() {
  $('carrots').textContent = Math.floor(player.carrots);
  $('damage').textContent = player.damage;
  $('level').textContent = player.level;

  // Цены
  $('damage-cost').textContent = getDamageCost();
  $('auto-cost').textContent = getAutoCost();

  // Кнопки
  $('btn-damage').disabled = player.carrots < getDamageCost();
  $('btn-auto').disabled = player.carrots < getAutoCost();
}

function getDamageCost() {
  return 5 + player.upgrades.damage * 10;
}

function getAutoCost() {
  return 50 + player.upgrades.auto * 100;
}

// Звуки — разрешаем только после первого касания
let soundsEnabled = false;

function enableSounds() {
  if (soundsEnabled) return;
  soundsEnabled = true;
  // Предзагрузка звуков
  new Audio('assets/click.mp3').play().then(a => a.pause()).catch(() => {});
}

// Клик
const krot = $('krot');

krot.addEventListener('touchstart', onTouch, { passive: false });
krot.addEventListener('click', onTouch);

function onTouch(e) {
  // Разрешаем звуки и вибрацию после первого касания
  if (!soundsEnabled) {
    enableSounds();
  }

  // Клик
  player.carrots += player.damage;
  player.level = Math.floor(Math.log2(player.carrots + 1)) + 1;

  // Эффект
  const click = document.createElement('div');
  click.className = 'click-effect';
  const rect = krot.getBoundingClientRect();
  click.textContent = `-${player.damage}`;
  click.style.left = `${rect.left + rect.width / 2 - 30}px`;
  click.style.top = `${rect.top + rect.height / 2 - 30}px`;
  document.body.appendChild(click);
  setTimeout(() => click.remove(), 1000);

  // Звук
  try {
    const sound = new Audio('assets/click.mp3');
    sound.volume = 0.3;
    sound.play().catch(() => {});
  } catch (err) {}

  // Вибрация (работает после первого касания)
  if (navigator.vibrate) {
    navigator.vibrate(10);
  }

  updateUI();
  saveGame();
}

// Улучшения
$('btn-damage').addEventListener('click', () => {
  const cost = getDamageCost();
  if (player.carrots >= cost) {
    player.carrots -= cost;
    player.damage += 1;
    player.upgrades.damage++;
    playUpgradeSound();
    showMsg(`+1 урон! 💪`);
    updateUI();
    saveGame();
  }
});

$('btn-auto').addEventListener('click', () => {
  const cost = getAutoCost();
  if (player.carrots >= cost) {
    player.carrots -= cost;
    player.autoClickLevel++;
    player.upgrades.auto++;

    if (!player.autoClick) {
      player.autoClick = true;
      startAutoClick();
    }

    playUpgradeSound();
    showMsg(`Авто-крот запущен! 🤖`);
    updateUI();
    saveGame();
  }
});

function playUpgradeSound() {
  try {
    const sound = new Audio('assets/upgrade.mp3');
    sound.volume = 0.5;
    sound.play().catch(() => {});
  } catch (err) {}
}

// Автоклик — работает
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

function showMsg(text) {
  const msg = $('message');
  msg.textContent = text;
  msg.classList.add('visible');
  setTimeout(() => msg.classList.remove('visible'), 1500);
}

// Telegram
if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.expand();
  window.Telegram.WebApp.ready();
}

// Загрузка
document.addEventListener('DOMContentLoaded', loadGame);
