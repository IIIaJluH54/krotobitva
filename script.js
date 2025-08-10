// === Крото Битва — Полная версия с корректными ценами и работающими кнопками ===

let player = {
  coins: 0,
  damage: 1,
  autoClick: false,
  autoClickDamage: 1,
  autoClickInterval: 1000,
  level: 1,
  upgrades: {
    autoPurchased: false,
    autoDamage: 0,
    autoSpeed: 0,
    damage: 0
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

  if (player.autoClick) {
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

  // Показываем/скрываем блоки
  const upgradeAuto = $('upgrade-auto');
  const btnAutoPurchase = $('btn-auto-purchase');

  if (upgradeAuto && btnAutoPurchase) {
    upgradeAuto.style.display = player.autoClick ? 'block' : 'none';
    btnAutoPurchase.style.display = player.autoClick ? 'none' : 'block';
  }

  // Цены
  const autoDamageCost = $('auto-damage-cost');
  const autoSpeedCost = $('auto-speed-cost');
  const damageCost = $('damage-cost');

  if (autoDamageCost) autoDamageCost.textContent = getAutoDamageCost();
  if (autoSpeedCost) autoSpeedCost.textContent = getAutoSpeedCost();
  if (damageCost) damageCost.textContent = getDamageCost();

  // Кнопки
  const btnAutoDamage = $('btn-auto-damage');
  const btnAutoSpeed = $('btn-auto-speed');
  const btnDamage = $('btn-damage');

  if (btnAutoDamage) btnAutoDamage.disabled = player.coins < getAutoDamageCost();
  if (btnAutoSpeed) btnAutoSpeed.disabled = player.coins < getAutoSpeedCost();
  if (btnDamage) btnDamage.disabled = player.coins < getDamageCost();
}

// === УЛУЧШЕНИЯ ===

// Покупка автокрота (1 раз)
const btnAutoPurchase = $('btn-auto-purchase');
if (btnAutoPurchase) {
  btnAutoPurchase.addEventListener('click', () => {
    if (player.coins >= 50 && !player.autoClick) {
      player.coins -= 50;
      player.autoClick = true;
      player.upgrades.autoPurchased = true;
      startAutoClick();
      showMsg('Авто-крот активирован! 🤖');
      updateUI();
      saveGame();
    } else if (player.autoClick) {
      showMsg('Уже куплено!');
    } else {
      showMsg('Недостаточно монет!');
    }
  });
}

// Увеличение урона автоклика
const btnAutoDamage = $('btn-auto-damage');
if (btnAutoDamage) {
  btnAutoDamage.addEventListener('click', () => {
    const cost = getAutoDamageCost();
    if (player.coins >= cost) {
      player.coins -= cost;
      player.autoClickDamage += 1;
      player.upgrades.autoDamage++;
      showMsg(`+${player.autoClickDamage - 1} → +${player.autoClickDamage} 💥`, 'green');
      updateUI();
      saveGame();
    }
  });
}

// Увеличение скорости автоклика
const btnAutoSpeed = $('btn-auto-speed');
if (btnAutoSpeed) {
  btnAutoSpeed.addEventListener('click', () => {
    const cost = getAutoSpeedCost();
    if (player.coins >= cost) {
      player.coins -= cost;
      player.autoClickInterval = Math.max(100, player.autoClickInterval - 100);
      player.upgrades.autoSpeed++;
      clearInterval(autoInterval);
      startAutoClick();
      showMsg(`Скорость + ⚡ (${(1000 / player.autoClickInterval).toFixed(1)}/сек)`, 'green');
      updateUI();
      saveGame();
    }
  });
}

// Увеличение урона ручного клика
const btnDamage = $('btn-damage');
if (btnDamage) {
  btnDamage.addEventListener('click', () => {
    const cost = getDamageCost();
    if (player.coins >= cost) {
      player.coins -= cost;
      player.damage += 1;
      player.upgrades.damage++;
      showMsg(`+${player.damage} 💪`, 'green');
      updateUI();
      saveGame();
    }
  });
}

// === ЦЕНЫ ===
function getDamageCost() {
  return 5 + player.upgrades.damage * 10;
}

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
if (krot) {
  krot.addEventListener('touchstart', onHit, { passive: false });
  krot.addEventListener('click', onHit);
}

function onHit(e) {
  if (!soundsEnabled) enableSounds();

  player.coins += player.damage;
  player.level = Math.floor(Math.log2(player.coins + 1)) + 1;

  // Эффект
  const click = document.createElement('div');
  click.className = 'click-effect';
  const rect = krot.getBoundingClientRect();
  click.textContent = `+${player.damage}`;
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

// === СООБЩЕНИЯ (с цветом) ===
function showMsg(text, color = 'yellow') {
  const msg = $('message');
  if (msg) {
    msg.textContent = text;
    msg.style.color = color;
    msg.classList.add('visible');
    setTimeout(() => msg.classList.remove('visible'), 1500);
  }
}

// === TELEGRAM ===
if (window.Telegram?.WebApp) {
  window.Telegram.WebApp.expand();
  window.Telegram.WebApp.ready();
}

// === ЗАГРУЗКА ===
document.addEventListener('DOMContentLoaded', loadGame);
