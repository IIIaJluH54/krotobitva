// === Крото Битва — Полная исправленная версия ===

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
      console.warn("Ошибка загрузки данных");
    }
  }
  updateUI();
}

// Сохранение
function saveGame() {
  localStorage.setItem('krotobitva', JSON.stringify(player));
}

// Обновление интерфейса
function updateUI() {
  $('carrots').textContent = Math.floor(player.carrots);
  $('damage').textContent = player.damage;
  $('level').textContent = player.level;

  // Обновляем цены
  $('damage-cost').textContent = getDamageCost();
  $('auto-cost').textContent = getAutoCost();

  // Проверка доступности
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

  // Эффект
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

  // Вибрация
  if ('vibrate' in navigator && navigator.vibrate) {
    navigator.vibrate(10);
  }

  updateUI();
  saveGame();
});

// Улучшение урона
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

// Автоклик
$('btn-auto').addEventListener('click', () => {
  const cost = getAutoCost();
  if (player.carrots >= cost) {
    player.carrots -= cost;
    player.autoClickLevel++;
    player.upgrades.auto++;

    // Запуск авто-клика при первом нажатии
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

// ✅ Авто-клик работает
function startAutoClick() {
  setInterval(() => {
    if (player.autoClick) {
      player.carrots += player.damage;
      player.level
