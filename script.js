// Исправленная версия script.js с фиксом NaN на кнопках апгрейда

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

function validateLoaded(data) {
  if (typeof data !== 'object' || data === null) return false;
  const numFields = ['coins', 'damage', 'autoClickDamage', 'autoClickInterval', 'level', 'lastUpdate'];
  for (const f of numFields) {
    if (!(f in data) || typeof data[f] !== 'number' || !isFinite(data[f])) return false;
  }
  if (typeof data.autoClick !== 'boolean') return false;
  if (typeof data.upgrades !== 'object' || data.upgrades === null) return false;
  return true;
}

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
  scheduleSave(1200);
}

function loadGame() {
  const saved = localStorage.getItem('krotobitva');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (validateLoaded(data)) {
        Object.assign(player, data);
        if (!player.upgrades) player.upgrades = {};
        if (typeof player.upgrades.autoDamage !== 'number') player.upgrades.autoDamage = 0;
        if (typeof player.upgrades.autoSpeed !== 'number') player.upgrades.autoSpeed = 0;
        if (typeof player.upgrades.damage !== 'number') player.upgrades.damage = 0;
        if (typeof player.upgrades.autoPurchased !== 'boolean') player.upgrades.autoPurchased = false;
        player.coins = Math.max(0, Number(player.coins));
        player.damage = Math.max(1, Math.floor(Number(player.damage)));
        player.autoClickInterval = Math.max(300, Math.floor(Number(player.autoClickInterval)));
        player.autoClickDamage = Math.max(1, Math.floor(Number(player.autoClickDamage)));
        player.level = Math.max(1, Math.floor(Number(player.level)));
        player.lastUpdate = Date.now();
      }
    } catch (e) {
      console.warn("Ошибка чтения сохранения:", e);
    }
  }
  updateUI();
  if (player.autoClick) startAutoClick();
}

function updateUI() {
  $('coins').textContent = Math.floor(player.coins);
  $('damage').textContent = player.damage;
  $('level').textContent = player.level;

  const autoDamageCost = getAutoDamageCost();
  const autoSpeedCost = getAutoSpeedCost();

  const costElAD = $('auto-damage-cost');
  const costElAS = $('auto-speed-cost');
  if (costElAD) costElAD.textContent = autoDamageCost;
  if (costElAS) costElAS.textContent = autoSpeedCost;

  const btnAutoDamage = $('btn-auto-damage');
  if (btnAutoDamage) {
    btnAutoDamage.textContent = `Увеличить урон автоклика (${autoDamageCost})`;
    btnAutoDamage.disabled = player.coins < autoDamageCost;
  }

  const btnAutoSpeed = $('btn-auto-speed');
  if (btnAutoSpeed) {
    btnAutoSpeed.textContent = `Ускорить автоклик (${autoSpeedCost})`;
    btnAutoSpeed.disabled = player.coins < autoSpeedCost;
  }

  const btnDamage = $('btn-damage');
  if (btnDamage) {
    btnDamage.disabled = player.coins < getDamageCost();
  }
}

function getDamageCost() {
  return 5 + player.upgrades.damage * 10;
}

function getAutoDamageCost() {
  return 100 + player.upgrades.autoDamage * 50;
}

function getAutoSpeedCost() {
  return 150 + player.upgrades.autoSpeed * 75;
}

let autoInterval = null;
function startAutoClick() {
  if (!player.autoClick) return;
  if (autoInterval) clearInterval(autoInterval);
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

const krot = $('krot');
if (krot) {
  krot.addEventListener('touchstart', onHit, { passive: true });
  krot.addEventListener('click', onHit);
}

let lastClickTs = 0;
function onHit(e) {
  const now = Date.now();
  if (now - lastClickTs < 30) return;
  lastClickTs = now;

  if (!soundsEnabled) enableSounds();

  player.coins += player.damage;
  player.level = Math.floor(Math.log2(player.coins + 1)) + 1;

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

let soundsEnabled = false;
let clickAudio = null;

function enableSounds() {
  if (soundsEnabled) return;
  soundsEnabled = true;
  try {
    clickAudio = new Audio('assets/click.mp3');
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
      const clone = clickAudio.cloneNode();
      clone.volume = vol;
      clone.play().catch(() => {});
      return;
    }
    const s = new Audio(src);
    s.volume = vol;
    s.play().catch(() => {});
  } catch (err) {}
}

function showMsg(text, color = 'yellow') {
  const msg = $('message');
  if (msg) {
    msg.textContent = text;
    msg.style.color = color;
    msg.classList.add('visible');
    setTimeout(() => msg.classList.remove('visible'), 1500);
  }
}

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

if (window.Telegram?.WebApp) {
  try {
    window.Telegram.WebApp.expand();
    window.Telegram.WebApp.ready();
  } catch (e) {
    console.warn("Telegram WebApp init error:", e);
  }
}

document.addEventListener('DOMContentLoaded', loadGame);
window.addEventListener('beforeunload', () => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveGameImmediate();
  } else {
    saveGameImmediate();
  }
  stopAutoClick();
});