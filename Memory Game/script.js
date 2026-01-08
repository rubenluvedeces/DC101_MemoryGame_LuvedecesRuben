const icons = ['🍎','🍌','🍓','🍇','🍉','🥝','🍒','🍍'];
const grid = document.getElementById('grid');
const movesEl = document.getElementById('moves');
const timerEl = document.getElementById('timer');
const resetBtn = document.getElementById('resetBtn');
const modal = document.getElementById('modalOverlay');
const finalScoreText = document.getElementById('finalScoreText');
const nameInput = document.getElementById('playerNameInput');
const submitBtn = document.getElementById('submitScoreBtn');
const leaderboardList = document.getElementById('leaderboardList');

const canvas = document.getElementById('confettiCanvas');
const ctx = canvas.getContext('2d');

let first = null, second = null, lock = false;
let moves = 0, matches = 0, seconds = 0;
let timer = null, particles = [];

const LB_KEY = 'memory_top_scores';

/* 📳 VIBRATION (safe fallback) */
function vibrate(pattern) {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function startGame() {
  grid.innerHTML = '';
  moves = matches = seconds = 0;
  movesEl.textContent = 0;
  timerEl.textContent = '00:00';
  resetBtn.disabled = true;
  clearInterval(timer);
  timer = null;

  shuffle([...icons, ...icons]).forEach(icon => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<div class="content">${icon}</div>`;
    card.dataset.icon = icon;
    card.onclick = () => flip(card);
    grid.appendChild(card);
  });
}

function flip(card) {
  if (lock || card === first || card.classList.contains('matched')) return;

  vibrate(30); // short tap

  if (!timer) {
    timer = setInterval(() => {
      seconds++;
      timerEl.textContent =
        String(Math.floor(seconds / 60)).padStart(2,'0') + ':' +
        String(seconds % 60).padStart(2,'0');
    }, 1000);
    resetBtn.disabled = false;
  }

  card.classList.add('revealed');

  if (!first) {
    first = card;
    return;
  }

  second = card;
  moves++;
  movesEl.textContent = moves;
  checkMatch();
}

function checkMatch() {
  if (first.dataset.icon === second.dataset.icon) {
    vibrate([50, 50, 50]); // success vibration
    first.classList.add('matched');
    second.classList.add('matched');
    matches += 2;
    resetPick();
    if (matches === icons.length * 2) win();
  } else {
    vibrate([100]); // wrong match
    lock = true;
    setTimeout(() => {
      first.classList.remove('revealed');
      second.classList.remove('revealed');
      resetPick();
    }, 800);
  }
}

function resetPick() {
  first = second = null;
  lock = false;
}

function win() {
  clearInterval(timer);
  vibrate([200, 100, 200, 100, 300]); // celebration vibration
  launchConfetti();
  const score = Math.max(0, 10000 - seconds * 10 - moves * 50);
  finalScoreText.textContent =
    `Time: ${timerEl.textContent} | Moves: ${moves} | Score: ${score}`;
  modal.style.display = 'flex';
}

submitBtn.onclick = () => {
  const name = nameInput.value.trim().toUpperCase();
  if (!name) return;
  const score = Math.max(0, 10000 - seconds * 10 - moves * 50);
  const lb = JSON.parse(localStorage.getItem(LB_KEY)) || [];
  lb.push({ name, score });
  lb.sort((a, b) => b.score - a.score);
  localStorage.setItem(LB_KEY, JSON.stringify(lb.slice(0, 10)));
  modal.style.display = 'none';
  nameInput.value = '';
  renderLeaderboard();
  startGame();
};

nameInput.oninput = () => {
  submitBtn.disabled = !nameInput.value.trim();
};

function renderLeaderboard() {
  leaderboardList.innerHTML = '';
  const lb = JSON.parse(localStorage.getItem(LB_KEY)) || [];
  lb.slice(0, 3).forEach((p, i) => {
    const li = document.createElement('li');
    li.innerHTML = `${i + 1}. ${p.name} <span>${p.score} PTS</span>`;
    leaderboardList.appendChild(li);
  });
}

/* 🎊 CONFETTI */
function launchConfetti() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  particles = Array.from({ length: 150 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    r: Math.random() * 6 + 3,
    c: `hsl(${Math.random() * 360},100%,50%)`,
    v: Math.random() * 3 + 2
  }));
  animate();
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.y += p.v;
    ctx.fillStyle = p.c;
    ctx.fillRect(p.x, p.y, p.r, p.r);
  });
  if (particles.some(p => p.y < canvas.height)) {
    requestAnimationFrame(animate);
  }
}

resetBtn.onclick = startGame;
renderLeaderboard();
startGame();
