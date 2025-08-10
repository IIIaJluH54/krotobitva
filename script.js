// === Крото Битва — Улучшенная версия ===

let player = {
  carrots: 0,
  damage: 1,
  autoClick: false,
  autoClickLevel: 0,
  level: 1,
  upgrades: {
    damage: 0,
    auto: 0
  }
};

const $ = id => document.getElementById(id);
const save = () => localStorage.setItem('krotobitva', JSON.stringify(player));
const load = () => {
  const data = localStorage.getItem('krotobitva');
  if (data) Object.assign(player, JSON.parse(data));
};

// UI
const updateUI = () => {
  $('carrots').textContent = Math.floor(player.carrots);
  $('damage').textContent = player.damage;
  $('level').textContent = player.level;
  $('btn-damage').disabled = player.carrots < getDamageCost();
  $('btn-auto').disabled = player.carrots < getAutoCost();
};

// Клик по кроту
$('krot').addEventListener('click', () => {
  player.carrots += player.damage;
  player.level = Math.floor(Math.log2(player.carrots + 1)) + 1;

  // Анимация клика
  const click = document.createElement('div');
  click.className = 'click-effect';
  click.textContent = `-${player.damage}`;
  click.style.left = `${event.clientX - 50}px`;
  click.style.top = `${event.clientY - 100}px`;
  document.body.appendChild(click);
  setTimeout(() => click.remove(), 1000);

  updateUI();
  save();
});

// Улучшения
function getDamageCost() {
  return 5 + player.upgrades.damage * 10;
}

function getAutoCost() {
  return 50 + player.upgrades.auto * 100;
}

$('btn-damage').addEventListener('click', () => {
  const cost = getDamageCost();
  if (player.carrots >= cost) {
    player.carrots -= cost;
    player.damage += 1;
    player.upgrades.damage++;
    showMsg(`+1 урон!`);
    updateUI();
    save();
  }
});

$('btn-auto').addEventListener('click', () => {
  const cost = getAutoCost();
  if (player.carrots >= cost) {
    player.carrots -= cost;
    if (!player.autoClick) startAutoClick();
    player.autoClickLevel++;
    player.upgrades.auto++;
    showMsg(`Авто-крот активирован! 🤖`);
    updateUI();
    save();
  }
});

function startAutoClick() {
  setInterval(() => {
    if (player.autoClickLevel > 0) {
      player.carrots += player.damage;
      player.level = Math.floor(Math.log2(player.carrots + 1)) + 1;
      updateUI();
      save();
    }
  }, 1000);
}

function showMsg(text) {
  const msg = $('message');
  msg.textContent = text;
  setTimeout(() => msg.textContent = '', 1500);
}

// Загрузка
load();
updateUI();
