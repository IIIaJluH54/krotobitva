// === Крото Битва — Авто-крот работает ВСЕГДА ===

let player = {
  coins: 0,
  damage: 1,
  autoClickLevel: 0,  // 0 = выкл, 1+ = вкл
  level: 1,
  upgrades: { damage: 0 },
  lastUpdate: Date.now()  // Время последнего обновления
};

const $ = id => document.getElementById(id);

// Загрузка прогресса
function loadGame() {
  const saved = localStorage.getItem('krotobitva');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      Object.assign(player, data);

      // 🔁 Восстанавливаем монеты за время отсутствия
      const now = Date.now();
      const elapsedSec = Math.floor((now - player.lastUpdate) / 1000);
      if (elapsedSec > 0 && player.autoClickLevel > 0) {
        player.coins += player.damage * elapsedSec;
        player.level = Math.floor(Math.log2(player.coins + 1)) + 1;
      }

      // Обновляем время
      player.lastUpdate = now;
    } catch (e) {
      console.warn("Ошибка загрузки", e);
    }
  }
  updateUI();

  // ✅ Запускаем автоклик, если включён
  if (player.autoClickLevel > 0) {
    startAutoClick();
  }
}

// Сохранение
function saveGame() {
  player.lastUpdate = Date.now();
  localStorage.setItem('krotobitva', JSON.stringify(player));
}

// Обновление UI
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
  return 50 + player.autoClickLevel * 100;
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

  // Звук и вибрация
  playSound('assets/click.mp3', 0.3);
  if (navigator.vibrate) navigator.vibrate(10);

  saveGame();
  updateUI();
}

// Улучшения
$('btn-damage').addEventListener('click', () => {
  const cost = getDamageCost();
  if (player.coins >= cost) {
    player.coins -= cost;
    player.damage += 1;
    player.upgrades.damage++;
    playSound('assets/upgrade.mp3', 0.5);
    showMsg(`+1 урон! 💪`);
    saveGame();
    updateUI();
  }
});

// ✅ КНОПКА "АВТО-КРОТ" — РАБОТАЕТ!
$('btn-auto').addEventListener('click', () => {
  const cost = getAutoCost();
  if (player.coins >= cost) {
    player.coins -= cost;
    player.autoClickLevel++;

    // Первый запуск
    if (player.autoClickLevel === 1) {
      startAutoClick();
    }

    playSound('assets/upgrade.mp3', 0.5);
    showMsg(`Авто-крот запущен! 🤖`);
    saveGame();
    updateUI();
  }
});

// 🔁 ГАРАНТИРОВАННЫЙ автоклик
let autoInterval = null;

function startAutoClick() {
  if (autoInterval) clearInterval(autoInterval);

  autoInterval = setInterval(() => {
    if (player.autoClickLevel > 0) {
      player.coins += player.damage;
      player.level = Math.floor(Math.log2(player.coins + 1)) + 1;
      updateUI();
      saveGame();
    }
  }, 1000);
}

// Воспроизведение звука
function playSound(src, vol = 1) {
  try {
    const sound = new Audio(src);
    sound.volume = vol;
    sound.play().catch(() => {});
  } catch (err) {}
}

// Показ сообщения
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
