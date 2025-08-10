// === Крото Битва — Полностью исправленная версия ===

let player = {
  carrots: 0,
  damage: 1,
  autoClick: false,
  autoClickLevel: 0,
  level: 1,
  upgrades: { damage: 0, auto: 0 }
};

const $ = id => document.getElementById(id);

function loadGame() {
  const saved = localStorage.getItem('krotobitva');
  if (saved) Object.assign(player, JSON.parse(saved));
  updateUI();
}

function saveGame() {
  localStorage.setItem('krotobitva', JSON.stringify(player));
}

function updateUI() {
  $('carrots').textContent = Math.floor(player.carrots);
  $('damage').textContent = player.damage;
  $('level').textContent = player.level;

  // Обновляем цены улучшений
  $('damage-cost').textContent = getDamageCost();
  $('auto-cost').textContent = getAutoCost();

  $('btn-damage').disabled = player.carrots < getDamageCost();
  $('btn-auto').disabled = player.carrots < getAutoCost();
}

function getDamageCost() {
  return 5 + player.upgrades.damage * 10;
}

function getAutoCost() {
  return 50 + player.upgrades.auto * 100;
}

// Звуки
const soundClick = new Audio('assets/click.mp3');
const soundUpgrade = new Audio('assets/upgrade.mp3');
soundClick.volume = 0.3;
soundUpgrade.volume = 0.5;

// Клик по кроту
$('krot').addEventListener('click', (e) => {
  player.carrots += player.damage;
  player.level = Math.floor(Math.log2(player.carrots + 1)) + 1;

  // Эффект клика
  const click = document.createElement('div');
  click.className = 'click-effect';
  click.textContent = `-${player.damage}`;
  click.style.left = `${e.clientX - 30}px`;
  click.style.top = `${e.clientY - 30}px`;
  document.body.appendChild(click);
  setTimeout(() => click.remove(), 1000);

  // Звук
  try {
    soundClick.currentTime = 0;
    soundClick.play().catch(() => {});
  } catch (err) {}

  // Вибрация (на поддерживаемых устройствах)
  if ('vibrate' in navigator && navigator.vibrate) {
    navigator.vibrate([50, 50, 50]);
  } else if ('mozVibrate' in navigator && navigator.mozVibrate) {
    navigator.mozVibrate(50);
  }

  updateUI();
  saveGame();
});

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
    soundUpgrade.currentTime = 0;
    soundUpgrade.play().catch(() => {});
  } catch (err) {}
}

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

// Telegram: раскрыть на весь экран
if (window.Telegram?.WebApp) {
  Telegram.WebApp.expand();
  Telegram.WebApp.ready();
}

// Загрузка
document.addEventListener('DOMContentLoaded', loadGame);
