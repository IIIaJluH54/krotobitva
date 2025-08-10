// Игра: враги с HP, боссы и ежедневные задания с прогресс-барами

// --- Player & Enemy ---
let player = {
  coins: 0,
  damage: 1,
  level: 1,
  kills: 0,
  lastUpdate: Date.now()
};

let enemy = {
  maxHP: 10,
  hp: 10,
  isBoss: false
};

const $ = id => document.getElementById(id);

// --- Storage keys ---
const SAVE_KEY = 'krotobitva';
const TASKS_KEY = 'krotobitva_tasks';
const TASKS_STATE_KEY = 'krotobitva_tasks_state';
const TASKS_PANEL_STATE = 'krotobitva_tasks_panel_open';

// --- Save/load player ---
let saveTimeout = null;
function scheduleSave(delay = 800) {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveGameImmediate, delay);
}
function saveGameImmediate() {
  player.lastUpdate = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(player)); }
  catch (e) { console.warn('Save failed', e); }
  saveTimeout = null;
}
function saveGame() { scheduleSave(1000); }

function loadGame() {
  const saved = localStorage.getItem(SAVE_KEY);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (data && typeof data === 'object') {
        if (typeof data.coins === 'number') player.coins = Math.max(0, data.coins);
        if (typeof data.damage === 'number') player.damage = Math.max(1, data.damage);
        if (typeof data.level === 'number') player.level = Math.max(1, data.level);
        if (typeof data.kills === 'number') player.kills = Math.max(0, data.kills);
      }
    } catch (e) { console.warn('Load failed', e); }
  }
}

// --- Tasks system ---
/*
Task structure:
{ id, type: 'level'|'kills'|'coins', target: number, progress: number, reward: number, done: boolean }
*/
let tasks = [];
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

function genRandomTasks() {
  // fixed three types with ranges
  const levelTarget = randBetween(5, 20);
  const killsTarget = randBetween(10, 50);
  const coinsTarget = randBetween(200, 2000);

  const t1 = { id: 't1', type: 'level', target: levelTarget, progress: 0, reward: levelTarget * 10, done: false };
  const t2 = { id: 't2', type: 'kills', target: killsTarget, progress: 0, reward: killsTarget * 5, done: false };
  const t3 = { id: 't3', type: 'coins', target: coinsTarget, progress: 0, reward: Math.floor(coinsTarget * 0.2), done: false };

  return [t1, t2, t3];
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    const stateRaw = localStorage.getItem(TASKS_STATE_KEY);
    const day = todayKey();
    if (raw && stateRaw) {
      const state = JSON.parse(stateRaw);
      if (state?.day === day && raw) {
        tasks = JSON.parse(raw);
        return;
      }
    }
  } catch (e) { console.warn('Load tasks fail', e); }
  // otherwise generate new tasks for today
  tasks = genRandomTasks();
  saveTasks();
  localStorage.setItem(TASKS_STATE_KEY, JSON.stringify({ day: todayKey() }));
}

function saveTasks() {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (e) { console.warn('Save tasks fail', e); }
}

function refreshTasksForced() {
  tasks = genRandomTasks();
  saveTasks();
  localStorage.setItem(TASKS_STATE_KEY, JSON.stringify({ day: todayKey() }));
  renderTasks();
  showNotification('Задания обновлены', 1400);
}

// --- UI: Tasks panel ---
function renderTasks() {
  const list = $('tasks-list');
  if (!list) return;
  list.innerHTML = '';
  let allDone = true;
  tasks.forEach(t => {
    const item = document.createElement('div');
    item.className = 'task-item' + (t.done ? ' done' : '');
    const icon = document.createElement('div');
    icon.className = 'task-icon';
    icon.textContent = t.type === 'level' ? '🏆' : t.type === 'kills' ? '⚔️' : '💰';
    const body = document.createElement('div');
    body.className = 'task-body';
    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = t.type === 'level' ? `Достигни уровня ${t.target}` :
                        t.type === 'kills' ? `Победи ${t.target} врагов` :
                        `Заработай ${t.target} монет`;
    const progressWrap = document.createElement('div');
    progressWrap.className = 'task-progress-wrap';
    const progressBar = document.createElement('div');
    progressBar.className = 'task-progress';
    const percent = Math.min(100, Math.floor((t.progress / t.target) * 100));
    progressBar.style.width = percent + '%';
    progressWrap.appendChild(progressBar);
    body.appendChild(title);
    body.appendChild(progressWrap);

    const rewardWrap = document.createElement('div');
    rewardWrap.className = 'task-reward';
    if (!t.done) {
      rewardWrap.innerHTML = `🪙 <span class="reward-amount">${t.reward}</span>`;
      const btn = document.createElement('button');
      btn.className = 'claim-btn';
      btn.textContent = 'Забрать';
      btn.disabled = true; // enabled only when done
      // store reference to enable later
      rewardWrap.appendChild(btn);
    } else {
      rewardWrap.innerHTML = '✅';
    }

    item.appendChild(icon);
    item.appendChild(body);
    item.appendChild(rewardWrap);
    list.appendChild(item);

    if (!t.done) allDone = false;
  });
  // panel opacity if all done
  const panel = $('tasks-panel');
  if (panel) panel.style.opacity = allDone ? '0.6' : '1.0';

  // attach claim handlers enabling/disabling buttons
  updateTaskButtonsState();
}

function updateTaskButtonsState() {
  const list = $('tasks-list');
  if (!list) return;
  const items = list.querySelectorAll('.task-item');
  items.forEach((item, idx) => {
    const btn = item.querySelector('.claim-btn');
    if (!btn) return;
    const t = tasks[idx];
    if (t.done) {
      btn.disabled = false;
      btn.textContent = 'Забрать';
      btn.onclick = () => claimTask(idx);
    } else {
      btn.disabled = true;
      btn.textContent = 'Забрать';
      btn.onclick = null;
    }
  });
}

function claimTask(idx) {
  const t = tasks[idx];
  if (!t || !t.done) return;
  player.coins += t.reward;
  t.done = true; // already should be true
  saveTasks();
  saveGameImmediate();
  renderTasks();
  showNotification(`Задание выполнено! +${t.reward} 🪙`, 1500);
  // check all done
  if (tasks.every(x => x.done)) {
    showNotification('Все задания на сегодня выполнены!', 1800);
  }
}

// --- Helpers ---
function randBetween(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

// --- Enemy spawn and HP ---
function spawnEnemy() {
  const baseHP = 10;
  const growth = 1.25;
  enemy.isBoss = (player.level % 10 === 0);
  let hp = Math.floor(baseHP * Math.pow(growth, player.level - 1));
  if (enemy.isBoss) hp *= 5;
  enemy.maxHP = hp;
  enemy.hp = hp;
  updateHPBar();
  // update tasks (in case level-based task target equals new level)
  checkTasksOnLevelUp();
}

function updateHPBar() {
  const hpText = $('hp-text');
  const hpBar = $('hp-bar');
  const bossLabel = $('boss-label');
  if (hpText) hpText.textContent = `HP: ${enemy.hp}/${enemy.maxHP}`;
  if (hpBar) {
    const percent = Math.max(0, (enemy.hp / enemy.maxHP) * 100);
    hpBar.style.width = percent + '%';
    if (enemy.isBoss) {
      hpBar.style.background = 'gold';
      if (bossLabel) {
        bossLabel.style.display = 'block';
        bossLabel.textContent = `БОСС УРОВНЯ ${player.level}`;
      }
    } else {
      hpBar.style.background = '#e74c3c';
      if (bossLabel) bossLabel.style.display = 'none';
    }
  }
}

// --- Update UI ---
function updateUI() {
  const coinsEl = $('coins'); if (coinsEl) coinsEl.textContent = Math.floor(player.coins);
  const levelEl = $('level'); if (levelEl) levelEl.textContent = player.level;
  updateHPBar();
  renderTasks();
  saveGame();
}

// --- Click handling ---
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

  enemy.hp -= player.damage;
  if (enemy.hp <= 0) {
    // reward
    let reward = enemy.maxHP;
    if (enemy.isBoss) reward *= 3;
    player.coins += reward;
    player.kills = (player.kills || 0) + 1;
    player.level++;
    spawnEnemy();
    // check tasks for level and kills/coins
    checkTasksAfterAction(reward, true);
  } else {
    // regular hit
    checkTasksAfterAction(0, false);
  }

  // click effect
  const click = document.createElement('div');
  click.className = 'click-effect';
  const rect = krot.getBoundingClientRect();
  click.textContent = `-${player.damage}`;
  click.style.left = `${rect.left + rect.width/2 - 30}px`;
  click.style.top = `${rect.top + rect.height/2 - 30}px`;
  document.body.appendChild(click);
  setTimeout(() => click.remove(), 900);

  playSound('assets/click.mp3', 0.3);
  if (navigator.vibrate) navigator.vibrate(10);

  updateUI();
}

// --- Tasks progress updates ---
function checkTasksAfterAction(rewardGained=0, leveled=false) {
  let changed = false;
  tasks.forEach(t => {
    if (t.done) return;
    if (t.type === 'level') {
      // progress is current level
      t.progress = player.level;
      if (t.progress >= t.target) { t.done = true; changed = true; }
    } else if (t.type === 'kills') {
      // progress counts total kills
      t.progress = player.kills || 0;
      if (t.progress >= t.target) { t.done = true; changed = true; }
    } else if (t.type === 'coins') {
      // progress counts coins earned today: we'll approximate by player.coins (could be total)
      // use progress cumulative: increase by rewardGained on enemy kill, or by damage on hit? We'll increase by rewardGained only for accuracy
      t.progress = Math.min(t.target, (t.progress || 0) + rewardGained);
      if (t.progress >= t.target) { t.done = true; changed = true; }
    }
    // clamp progress
    t.progress = clamp(t.progress, 0, t.target);
    if (t.done) {
      // enable claim immediately
      showNotification(`Задание выполнено! +${t.reward} 🪙`, 1500);
      // auto-claim: give reward immediately and mark claimed to prevent double-claim
      // to avoid giving reward multiple times, we'll set a special flag 'claimed'
      if (!t.claimed) {
        player.coins += t.reward;
        t.claimed = true;
        changed = true;
      }
    }
  });
  if (changed) {
    saveTasks();
    saveGameImmediate();
    renderTasks();
    // if all done, show special message
    if (tasks.every(x => x.done)) {
      showNotification('Все задания на сегодня выполнены!', 1800);
    }
  }
}

function checkTasksOnLevelUp() {
  checkTasksAfterAction(0, true);
}

// --- Notifications (left-top) ---
let notifTimeout = null;
function showNotification(text, ms=1500) {
  const n = $('notif');
  if (!n) return;
  n.textContent = text;
  n.style.display = 'block';
  if (notifTimeout) clearTimeout(notifTimeout);
  notifTimeout = setTimeout(() => { n.style.display = 'none'; notifTimeout = null; }, ms);
}

// --- Audio ---
let soundsEnabled = false;
let clickAudio = null;
function enableSounds() {
  if (soundsEnabled) return;
  soundsEnabled = true;
  try {
    clickAudio = new Audio('assets/click.mp3');
    clickAudio.volume = 0.3;
    const p = clickAudio.play();
    if (p && p.then) p.then(() => { clickAudio.pause(); clickAudio.currentTime = 0; }).catch(()=>{});
  } catch (e) { console.warn('Audio init failed', e); }
}
function playSound(src, vol = 1) {
  try {
    if (!soundsEnabled) enableSounds();
    if (clickAudio) {
      const clone = clickAudio.cloneNode();
      clone.volume = vol;
      clone.play().catch(()=>{});
      return;
    }
    const s = new Audio(src); s.volume = vol; s.play().catch(()=>{});
  } catch (e) {}
}

// --- Tasks panel toggle & refresh ---
function setupTasksUI() {
  const toggle = $('toggle-tasks');
  const panel = $('tasks-panel');
  if (!toggle || !panel) return;
  // restore state
  const open = localStorage.getItem(TASKS_PANEL_STATE) === '1';
  panel.style.display = open ? 'block' : 'none';
  toggle.onclick = () => {
    const nowOpen = panel.style.display !== 'none';
    panel.style.display = nowOpen ? 'none' : 'block';
    localStorage.setItem(TASKS_PANEL_STATE, nowOpen ? '0' : '1');
  };
  const refresh = $('refresh-tasks');
  if (refresh) refresh.onclick = () => { refreshTasksForced(); };
}

// --- Initialization ---
function init() {
  loadGame();
  loadTasks();
  setupTasksUI();
  spawnEnemy();
  updateUI();
}

document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', () => { if (saveTimeout) { clearTimeout(saveTimeout); saveGameImmediate(); } else { saveGameImmediate(); } });
