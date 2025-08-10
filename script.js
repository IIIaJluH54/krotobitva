// === Крото Битва — Продвинутая система улучшений ===

let player = {
  coins: 0,
  damage: 1,
  autoClick: false,           // true после покупки автокрота
  autoClickDamage: 1,         // урон от автоклика
  autoClickInterval: 1000,    // интервал в мс (меньше = чаще)
  level: 1,
  upgrades: {
    autoPurchased: false,     // куплен автокрот
    autoDamage: 0,            // уровень урона автоклика
    autoSpeed: 0              // уровень скорости
  },
  lastUpdate: Date.now()
};

const $ = id => document.getElementById(id);

// Загрузка прогресса
function loadGame() {
  const saved = localStorage.getItem('krotobitva');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      Object.assign(player, data);
      player.lastUpdate = Date.now();
    } catch (e) {
      console.warn("Ошибка загрузки", e);
    }
  }
  updateUI();

  // Запускаем автоклик, если куплен
  if (player.autoClick) {
    startAutoClick();
  }
}

// Сохранение
function saveGame() {
  player.lastUpdate = Date.now();
  localStorage.setItem('krotobitva', JSON.stringify(player));
}

// Обновление интерфейса
function updateUI() {
  $('coins').textContent = Math.floor(player.coins);
  $('damage').textContent = player.damage;
  $('level').textContent = player.level;

  // Показываем/скрываем улучшения
  $('upgrade-auto').style.display = player.autoClick ? 'block' : 'none';
  $('btn-auto-purchase').style.display = player.autoClick ? 'none' : 'block';

  // Цены
  $('auto-damage-cost').textContent = getAutoDamageCost();
  $('auto-speed-cost').textContent = getAutoSpeedCost();

  // Кнопки
  $('btn-auto-damage').disabled = player.coins < getAutoDamageCost();
  $('btn-auto-speed').disabled = player.coins < getAutoSpeedCost();
}

// === УЛУЧШЕНИЯ ===

// Покупка автокрота (только 1 раз)
$('btn-auto-purchase').addEventListener('click', () => {
  if (player.coins >= 50 && !player.autoClick) {
    player.coins -= 50;
    player.autoClick = true;
    player.upgrades.autoPurchased = true;
    startAutoClick();
    showMsg('Авто-крот активирован! 🤖');
    updateUI();
    saveGame();
  }
});

// Увеличение урона автоклика
$('btn-auto-damage').addEventListener('click', () => {
  const cost = getAutoDamageCost();
  if (player.coins >= cost) {
    player.coins -= cost;
    player.autoClickDamage += 1;
    player.upgrades.autoDamage++;
    showMsg(`+1 урон автоклика! 💥`);
    updateUI();
    saveGame();
  }
});

// Увеличение скорости автоклика (уменьшаем интервал)
$('btn-auto-speed').addEventListener('click', () => {
  const cost = getAutoSpeedCost();
  if (player.coins >= cost) {
    player.coins -= cost;
    player.autoClickInterval = Math.max(100, player.autoClickInterval - 100); // мин. 100 мс
    player.upgrades.autoSpeed++;
    clearInterval(autoInterval); // перезапускаем
    startAutoClick();
    showMsg(`Скорость автоклика увеличена! ⚡`);
    updateUI();
    saveGame();
  }
});

function getAutoDamageCost() {
  return 100 + player.upgrades.autoDamage * 50;
}

function getAutoSpeedCost() {
  return 150 + player.upgrades.autoSpeed * 75;
}

// === АВТОКЛИК ===
let autoInterval = null;

function startAutoClick() {
  if (autoInterval) clearInterval(autoInterval);

  autoInterval = setInterval(() => {
    if (player.autoClick) {
      player.coins += player.autoClickDamage;
      player.level = Math.floor(Math.log2(player.coins + 1)) + 1;
      updateUI();
      saveGame();
    }
  }, player.autoClickInterval);
}

// === РУЧНОЙ КЛИК ===
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

  playSound('assets/click.mp3', 0.3);
  if (navigator.vibrate) navigator.vibrate(10);

  saveGame();
  updateUI();
}

// === ЗВУКИ ===
let soundsEnabled = false;
function enableSounds() {
  if (soundsEnabled) return;
  soundsEnabled = true;
  new Audio('assets/click.mp3').play().then(a => a.pause()).catch(() => {});
}

function playSound(src, vol = 1) {
  try {
    const sound = new Audio(src);
    sound.volume = vol;
    sound.play().catch(() => {});
  } catch (err) {}
}

// === СООБЩЕНИЯ ===
function showMsg(text) {
  const msg = $('message');
  msg.textContent = text;
  msg.classList.add('visible');
  setTimeout(() => msg.classList.remove('visible'), 1500);
}

// === TELEGRAM ===
if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.expand();
  window.Telegram.WebApp.ready();
}

// === ЗАГРУЗКА ===
document.addEventListener('DOMContentLoaded', loadGame);
