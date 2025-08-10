// Исправленная версия script.js — валидация загрузки, throttled save, предохранители на авто-клик и звуки.

let player = {
  coins: 0,
  damage: 1,
  autoClick: false,
  autoClickDamage: 1,
  autoClickInterval: 1000, // ms
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

// --- Валидация загруженных данных ---
function validateLoaded(data) {
  if (typeof data !== 'object' || data === null) return false;
  // Проверяем ключевые поля и типы
  const numFields = ['coins', 'damage', 'autoClickDamage', 'autoClickInterval', 'level', 'lastUpdate'];
  for (const f of numFields) {
    if (!(f in data) || typeof data[f] !== 'number' || !isFinite(data[f])) return false;
  }
  if (typeof data.autoClick !== 'boolean') return false;
  if (typeof data.upgrades !== 'object' || data.upgrades === null) return false;
  return true;
}

// --- Загрузка/сохранение (throttle) ---
let saveTimeout = null;
function scheduleSave(delay = 1500) {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveGameImmediate, delay);
}

function saveGameImmediate() {
  player.lastUpdate = Date.now();
  try {
    localStorage.setItem('krotobitva', JSON.stringify(player));
  } catch (e) {
    console.warn("Не удалось сохранить прогресс:", e);
  }
  saveTimeout = null;
}

function saveGame() {
  // Планируем отложенное сохранение, чтобы не дергать localStorage слишком часто
  scheduleSave(1200);
}

function loadGame() {
  const saved = localStorage.getItem('krotobitva');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (validateLoaded(data)) {
        Object.assign(player, data);
        // Приведение типов и диапазонов
        player.coins = Math.max(0, Number(player.coins));
        player.damage = Math.max(1, Math.floor(Number(player.damage)));
        player.autoClickInterval = Math.max(300, Math.floor(Number(player.autoClickInterval))); // min 300ms
        player.autoClickDamage = Math.max(1, Math.floor(Number(player.autoClickDamage)));
        player.level = Math.max(1, Math.floor(Number(player.level)));
        player.lastUpdate = Date.now();
      } else {
        console.warn("Данные сохранения не прошли валидацию, сбрасываем.");
      }
    } catch (e) {
      console.warn("Ошибка чтения сохранения:", e);
    }
  }
  updateUI();
  if (player.autoClick) startAutoClick();
}

// --- UI ---
function updateUI() {
  const coinsEl = $('coins');
  if (coinsEl) coinsEl.textContent = Math.floor(player.coins);

  const damageEl = $('damage');
  if (damageEl) damageEl.textContent = player.damage;

  const levelEl = $('level');
  if (levelEl) levelEl.textContent = player.level;

  const upgradeAuto = $('upgrade-auto');
  const btnAutoPurchaseEl = $('btn-auto-purchase');
  if (upgradeAuto && btnAutoPurchaseEl) {
    upgradeAuto.style.display = player.autoClick ? 'block' : 'none';
    btnAutoPurchaseEl.style.display = player.autoClick ? 'none' : 'block';
  }

  const autoDamageCost = $('auto-damage-cost');
  const autoSpeedCost = $('auto-speed-cost');
  const damageCost = $('damage-cost');

  if (autoDamageCost) autoDamageCost.textContent = getAutoDamageCost();
  if (autoSpeedCost) autoSpeedCost.textContent = getAutoSpeedCost();
  if (damageCost) damageCost.textContent = getDamageCost();

  const btnAutoDamage = $('btn-auto-damage');
  const btnAutoSpeed = $('btn-auto-speed');
  const btnDamage = $('btn-damage');

  if (btnAutoDamage) btnAutoDamage.disabled = player.coins < getAutoDamageCost();
  if (btnAutoSpeed) btnAutoSpeed.disabled = player.coins < getAutoSpeedCost();
  if (btnDamage) btnDamage.disabled = player.coins < getDamageCost();
}

// --- Цены ---
function getDamageCost() {
  return 5 + player.upgrades.damage * 10;
}

function getAutoDamageCost() {
  return 100 + player.upgrades.autoDamage * 50;
}

function getAutoSpeedCost() {
  return 150 + player.upgrades.autoSpeed * 75;
}

// --- АВТОКЛИК ---
let autoInterval = null;
function startAutoClick() {
  if (!player.autoClick) return;
  if (autoInterval) clearInterval(autoInterval);

  // Ограничение минимальной частоты (во избежание перегруза)
  const interval = Math.max(300, Math.floor(player.autoClickInterval));
  autoInterval = setInterval(() => {
    if (player.autoClick) {
      player.coins += player.autoClickDamage;
      player.level = Math.floor(Math.log2(player.coins + 1)) + 1;
      updateUI();
      saveGame();
    }
  }, interval);
}

function stopAutoClick() {
  if (autoInterval) {
    clearInterval(autoInterval);
    autoInterval = null;
  }
}

// --- РУЧНОЙ КЛИК ---
const krot = $('krot');
if (krot) {
  // оптимизация: один слушатель, поддержка touch и mouse
  krot.addEventListener('touchstart', onHit, { passive: true });
  krot.addEventListener('click', onHit);
}

let lastClickTs = 0;
function onHit(e) {
  const now = Date.now();
  // простой дебаунс — 30ms
  if (now - lastClickTs < 30) return;
  lastClickTs = now;

  if (!soundsEnabled) enableSounds();

  player.coins += player.damage;
  player.level = Math.floor(Math.log2(player.coins + 1)) + 1;

  // Эффект клика
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

// --- ЗВУКИ ---
// Пул аудио — переиспользуем один элемент, чтобы не создавать много объектов
let soundsEnabled = false;
let clickAudio = null;

function enableSounds() {
  if (soundsEnabled) return;
  soundsEnabled = true;
  try {
    clickAudio = new Audio('assets/click.mp3');
    // Попытка "подготовить" аудио (может быть заблокирована), не критично
    clickAudio.volume = 0.3;
    const p = clickAudio.play();
    if (p && p.then) p.then(() => { clickAudio.pause(); clickAudio.currentTime = 0; }).catch(() => {});
  } catch (e) {
    console.warn("Ошибка инициализации звуков:", e);
  }
}

function playSound(src, vol = 1) {
  try {
    if (!soundsEnabled) return;
    if (clickAudio && clickAudio.src && clickAudio.paused !== undefined) {
      clickAudio.volume = vol;
      // клонируем элемент, чтобы можно было играть наложениями
      const clone = clickAudio.cloneNode();
      clone.volume = vol;
      clone.play().catch(() => {});
      return;
    }
    // fallback
    const s = new Audio(src);
    s.volume = vol;
    s.play().catch(() => {});
  } catch (err) {
    // silent
  }
}

// --- СООБЩЕНИЯ ---
function showMsg(text, color = 'yellow') {
  const msg = $('message');
  if (msg) {
    msg.textContent = text;
    msg.style.color = color;
    msg.classList.add('visible');
    setTimeout(() => msg.classList.remove('visible'), 1500);
  }
}

// --- КНОПКИ УЛУЧШЕНИЙ ---
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

const btnAutoSpeed = $('btn-auto-speed');
if (btnAutoSpeed) {
  btnAutoSpeed.addEventListener('click', () => {
    const cost = getAutoSpeedCost();
    if (player.coins >= cost) {
      player.coins -= cost;
      // уменьшаем интервал, но не ниже 300мс
      player.autoClickInterval = Math.max(300, player.autoClickInterval - 100);
      player.upgrades.autoSpeed++;
      stopAutoClick();
      startAutoClick();
      showMsg(`Скорость + ⚡ (${(1000 / player.autoClickInterval).toFixed(1)}/сек)`, 'green');
      updateUI();
      saveGame();
    }
  });
}

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

// --- TELEGRAM WEB APP INTEGRATION ---
if (window.Telegram?.WebApp) {
  try {
    window.Telegram.WebApp.expand();
    window.Telegram.WebApp.ready();
  } catch (e) {
    console.warn("Telegram WebApp init error:", e);
  }
}

// --- ЗАГРУЗКА/ВЫГРУЗКА ---
document.addEventListener('DOMContentLoaded', loadGame);
window.addEventListener('beforeunload', () => {
  // принудительное сохранение перед уходом
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveGameImmediate();
  } else {
    saveGameImmediate();
  }
  stopAutoClick();
});