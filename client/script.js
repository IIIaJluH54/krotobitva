let playerId = null;
let coins = 0;
let diamonds = 0;
let clickPower = 1;
let autoCPS = 0;

let dailyRewardClaimedAt = 0;
let chestClaimedAt = 0;

let upgrades = [
  { name: "Когти", cost: 10, type: "click", level: 0 },
  { name: "Автогенератор", cost: 50, type: "auto", level: 0 }
];

let skins = [
  { src: "../assets/krot.png", unlocked: true },
  { src: "../assets/krot_hat.png", unlocked: false }
];
let currentSkin = 0;

function login() {
  const name = document.getElementById("playerName").value.trim();
  if (!name) return alert("Введите имя!");
  fetch("/api/players/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  })
  .then(r => r.json())
  .then(data => {
    playerId = data._id;
    Object.assign(this, data);
    document.getElementById("authScreen").classList.add("hidden");
    document.getElementById("gameScreen").classList.remove("hidden");
    updateDisplay();
    startSync();
  });
}

function updateDisplay() {
  document.getElementById("coins").textContent = Math.floor(coins);
  document.getElementById("diamonds").textContent = diamonds;
}

document.getElementById("krot").addEventListener("click", () => {
  coins += clickPower;
  updateDisplay();
  syncToServer();
});

function syncToServer() {
  if (!playerId) return;
  fetch(`/api/players/${playerId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ coins, diamonds, clickPower, autoCPS })
  });
}

function startSync() {
  setInterval(syncToServer, 5000);
  loadAdminPanel();
}

function switchPage(page) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById(page).classList.remove("hidden");
  if (page === "admin") loadAdminPanel();
}

function loadAdminPanel() {
  fetch("/api/players")
  .then(r => r.json())
  .then(players => {
    const container = document.getElementById("playersList");
    container.innerHTML = "";
    players.forEach(p => {
      const div = document.createElement("div");
      div.innerHTML = `<b>${p.name}</b>: ${p.coins} 💰 <button onclick="giveCoins('${p._id}', 1000)">+1000</button>`;
      container.appendChild(div);
    });
  });
}

function giveCoins(id, amount) {
  fetch(`/api/players/${id}/coins`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount })
  }).then(loadAdminPanel);
}
