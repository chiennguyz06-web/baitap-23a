// ====== CẤU HÌNH ======
const MA_SV = '241A010218';          // <-- thay bằng mã sinh viên của bạn
const LEVELS = {
  easy:   { size: 54, move: 1200 },
  normal: { size: 44, move: 1000 },
  hard:   { size: 34, move: 700 }
};

// ====== PHẦN TỬ DOM ======
const $ = id => document.getElementById(id);
const arena = $('arena'), target = $('target');
const startBtn = $('startBtn'), levelSel = $('level'), durationSel = $('duration');

// ====== TRẠNG THÁI ======
let score, timeLeft, totalTime = 30, playing = false;
let streak, hits, misses, reactionSum, spawnAt, cfg, isGold;
let moveTimer = null, countTimer = null, best = {};

try { best = JSON.parse(localStorage.getItem('reflexBest') || '{}'); } catch (e) { best = {}; }

// ====== HIỂN THỊ ======
const bestKey = () => levelSel.value + '_' + durationSel.value;
function showBest() { $('best').textContent = best[bestKey()] || 0; }
function showTimeOption() { if (!playing) { $('time').textContent = durationSel.value; $('bar').style.width = '100%'; } }
const multiplier = () => 1 + Math.min(Math.floor(streak / 5), 4); // x1 … x5

function updateHud() {
  $('score').textContent = score;
  $('time').textContent = timeLeft;
  $('comboVal').textContent = 'x' + multiplier();
  $('bar').style.width = (timeLeft / totalTime * 100) + '%';
}

levelSel.addEventListener('change', showBest);
durationSel.addEventListener('change', () => { showBest(); showTimeOption(); });
showBest(); showTimeOption();

// ====== MỤC TIÊU ======
function moveTarget() {
  isGold = Math.random() < 0.1;
  target.classList.toggle('gold', isGold);
  target.style.display = 'block';
  target.style.animation = 'none'; void target.offsetWidth; target.style.animation = '';
  target.style.width = target.style.height = cfg.size + 'px';
  target.style.top = Math.floor(Math.random() * (arena.clientHeight - cfg.size)) + 'px';
  target.style.left = Math.floor(Math.random() * (arena.clientWidth - cfg.size)) + 'px';
  spawnAt = performance.now();
}
function restartMoveTimer() {
  clearInterval(moveTimer);
  moveTimer = setInterval(moveTarget, cfg.move);
}
function floatText(text, x, y) {
  const f = document.createElement('div');
  f.className = 'float'; f.textContent = text;
  f.style.left = x + 'px'; f.style.top = y + 'px';
  arena.appendChild(f);
  setTimeout(() => f.remove(), 700);
}

// ====== BẮT ĐẦU / KẾT THÚC ======
function startGame() {
  cfg = LEVELS[levelSel.value];
  totalTime = parseInt(durationSel.value, 10);   // thời gian đếm ngược tùy chọn
  score = 0; streak = 0; hits = 0; misses = 0; reactionSum = 0;
  timeLeft = totalTime; playing = true;

  $('overlay').style.display = 'none';
  startBtn.disabled = true; levelSel.disabled = true; durationSel.disabled = true;
  $('bar').style.transition = 'none'; $('bar').style.width = '100%';
  setTimeout(() => { $('bar').style.transition = 'width 1s linear'; }, 50);

  updateHud(); moveTarget(); restartMoveTimer();
  countTimer = setInterval(() => {
    timeLeft--; updateHud();
    if (timeLeft <= 0) endGame();
  }, 1000);
}

function endGame() {
  playing = false;                                // khóa toàn bộ thao tác chơi
  clearInterval(moveTimer); clearInterval(countTimer);
  target.style.display = 'none';

  const key = bestKey();
  let msg = '';
  if (score > (best[key] || 0)) {
    best[key] = score; msg = '🏆 Kỷ lục mới!';
    try { localStorage.setItem('reflexBest', JSON.stringify(best)); } catch (e) {}
  }
  const total = hits + misses;
  const acc = total ? Math.round(hits / total * 100) : 0;
  const avg = hits ? Math.round(reactionSum / hits) : 0;

  $('finalScore').textContent = score;
  $('newBest').textContent = msg;
  $('stats').textContent = 'Trúng: ' + hits + ' | Trượt: ' + misses +
    ' | Chính xác: ' + acc + '% | Phản xạ TB: ' + avg + ' ms';
  $('overlay').style.display = 'flex';

  startBtn.disabled = false; levelSel.disabled = false; durationSel.disabled = false;
  startBtn.textContent = 'Chơi lại';
  showBest();
}

// ====== SỰ KIỆN CLICK ======
target.addEventListener('mousedown', e => {
  e.stopPropagation();
  if (!playing) return;
  const pts = (isGold ? 3 : 1) * multiplier();
  score += pts; hits++; streak++;
  reactionSum += performance.now() - spawnAt;
  const r = arena.getBoundingClientRect();
  floatText('+' + pts, e.clientX - r.left, e.clientY - r.top);
  updateHud();
  moveTarget();            // đổi vị trí ngay lập tức
  restartMoveTimer();
});

arena.addEventListener('mousedown', () => {
  if (!playing) return;
  misses++; streak = 0; updateHud();
  arena.classList.remove('miss'); void arena.offsetWidth; arena.classList.add('miss');
});

startBtn.addEventListener('click', startGame);

// ====== YÊU CẦU 1: ĐỔI MÀU NỀN NGẪU NHIÊN ======
$('colorBtn').addEventListener('click', () => {
  const h = Math.floor(Math.random() * 360);
  const s = 55 + Math.floor(Math.random() * 30);
  const l = 70 + Math.floor(Math.random() * 18);
  arena.style.background = 'hsl(' + h + ', ' + s + '%, ' + l + '%)';
});

// ====== YÊU CẦU 2: NÚT NGƯỜI CHƠI ======
$('playerBtn').addEventListener('click', () => {
  const box = $('playerInfo');
  box.textContent = 'Người chơi - Mã sinh viên: ' + MA_SV;
  box.hidden = !box.hidden;
});
