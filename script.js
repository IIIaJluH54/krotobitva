// === Крото Битва — Полная версия с РАБОТАЮЩИМ автокликом ===

let player = {
  coins: 0,
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
      console.warn("Ошибка загрузки данных");
    }
  }
  updateUI();

  // 🔁 Проверяем, нужно ли запустить автоклик после перезагрузки
  if (player.autoClick && player.autoClickLevel > 0) {
    startAutoClick();
  }
}

// Сохранение
function saveGame() {
  localStorage.setItem('krotobitva', JSON.stringify(player));
}

// Обновление интерфейса
function updateUI() {
  $('coins').textContent = Math.floor(player.coins);
  $('damage').textContent = player.damage;
  $('level').textContent = player.level;

  // Цены
  $('damage-cost').textContent = getDamageCost();
  $('auto-cost').textContent = getAutoCost();

  // Кнопки
  $('btn-damage').disabled = player.coins < getDamageCost();
  $('btn-auto').disabled = player.coins < getAutoCost();
}

function getDamageCost() {
  return 5 + player.upgrades.damage * 10;
}

function getAutoCost() {
  return 50 + player.upgrades.auto * 100;
}

// Разрешение звуков
let soundsEnabled = false;

function enableSounds() {
  if (soundsEnabled) return;
  soundsEnabled = true;
  new Audio('assets/click.mp3').play().then(a => a.pause()).catch(() => {});
}

// Клик по кроту
const krot = $('krot');

krot.addEventListener('touchstart', onHit, { passive: false });
krot.addEventListener('click', onHit);

function onHit(e) {
  if (!soundsEnabled) enableSounds();

  player.coins += player.damage;
  player.level = Math.floor(Math.log2(player.coins + 1)) + 1;

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

  // Вибрация
  if (navigator.vibrate) navigator.vibrate(10);

  updateUI();
  saveGame();
}

// Улучшения
$('btn-damage').addEventListener('click', () => {
  const cost = getDamageCost();
  if (player.coins >= cost) {
    player.coins -= cost;
    player.damage += 1;
    player.upgrades.damage++;
    playUpgradeSound();
    showMsg(`+1 урон! 💪`);
    updateUI();
    saveGame();
  }
});

// ✅ ИСПРАВЛЕННЫЙ автоклик
let autoClickInterval = null;  // Сохраняем ссылку на интервал

$('btn-auto').addEventListener('click', () => {
  const cost = getAutoCost();
  if (player.coins >= cost) {
    player.coins -= cost;
    player.autoClickLevel++;
    player.upgrades.auto = player.autoClickLevel;

    // Если автоклик ещё не включён — включаем
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

// 🔁 Автоклик — запускается один раз
function startAutoClick() {
  if (autoClickInterval) clearInterval(autoClickInterval);  // Защита от дублирования

  autoClickInterval = setInterval(() => {
    if (player.autoClick && player.autoClickLevel > 0) {
      player.coins += player.damage;
      player.level = Math.floor(Math.log2(player.coins + 1)) + 1;
      updateUI();
      saveGame();
    }
  }, 1000);
}

// Звук улучшения
function playUpgradeSound() {
  try {
    const sound = new Audio('assets/upgrade.mp3');
    sound.volume = 0.5;
    sound.play().catch(() => {});
  } catch (err) {}
}

// Сообщения
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
