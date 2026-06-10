const API = (window.API_URL || '').replace(/\/+$/, '');
let playerNum = null;
let state = null;
let busy = false;
let polling = false;
const LAB = 'ABCDEFGHIJKLMN';

function dims(c) {
  const s = Math.min(c.offsetWidth, c.offsetHeight, 440);
  return { r: s * 0.39, cs: Math.max(40, Math.min(62, s * 0.14)) };
}

function draw() {
  const c = document.getElementById('cells');
  c.innerHTML = '';
  const w = c.offsetWidth, h = c.offsetHeight;
  if (!w || !h) { requestAnimationFrame(draw); return; }
  const d = dims(c), cx = w / 2, cy = h / 2;
  if (!state) return;

  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + Math.PI / 2;
    const x = cx + Math.cos(a) * d.r - d.cs / 2;
    const y = cy + Math.sin(a) * d.r - d.cs / 2;

    const el = document.createElement('div');
    el.className = 'cell';
    el.style.width = d.cs + 'px';
    el.style.height = d.cs + 'px';
    el.dataset.i = i;
    el.classList.add(i <= 6 ? 'p1' : 'p2');

    const ok = !state.over && !busy && playerNum !== null && state.turn === playerNum && state.validMoves.includes(i);
    if (ok) {
      el.classList.add('ok');
      el.addEventListener('click', () => click(i));
    }

    el.style.left = x + 'px';
    el.style.top = y + 'px';

    const sc = document.createElement('span');
    sc.className = 'sc';
    sc.textContent = state.board[i];
    sc.style.fontSize = Math.max(.65, Math.min(1.2, d.cs * .022)) + 'rem';
    el.appendChild(sc);

    const lb = document.createElement('span');
    lb.className = 'cl';
    lb.textContent = LAB[i];
    el.appendChild(lb);

    c.appendChild(el);
  }

  document.getElementById('cap-0').textContent = state.captured[0];
  document.getElementById('cap-1').textContent = state.captured[1];

  const tt = document.getElementById('turn-txt');
  if (state.over) {
    tt.textContent = 'Partie terminée';
    endGame();
  } else if (playerNum === null) {
    tt.textContent = 'Choisissez votre camp';
  } else {
    tt.textContent = state.turn === playerNum ? 'À vous de jouer' : 'Tour adverse';
    document.getElementById('p1-info').classList.toggle('active', state.turn === 0);
    document.getElementById('p2-info').classList.toggle('active', state.turn === 1);
  }
}

function click(i) {
  if (busy || playerNum === null) return;
  busy = true;
  fetch(API + '/play', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player: playerNum, cell: i }),
  })
  .then(r => r.json())
  .then(data => {
    if (data.error) { msg(data.error, true); busy = false; return; }
    state = data.state;
    hideMsg();
    const el = document.querySelector('.cell[data-i="' + i + '"]');
    if (el) { el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 350); }
    draw();
    if (data.move.captured > 0) { msg('+' + data.move.captured + ' capturée(s)'); setTimeout(hideMsg, 1500); }
    if (data.move.isCell7V) { msg('Case 7: graines rendues'); setTimeout(hideMsg, 2000); }
    busy = false;
  })
  .catch(() => { msg('Erreur de connexion', true); busy = false; });
}

function msg(t, e) {
  const el = document.getElementById('msg');
  el.textContent = t;
  el.classList.remove('hidden', 'err');
  if (e) el.classList.add('err');
}
function hideMsg() { document.getElementById('msg').classList.add('hidden'); }

function endGame() {
  const reasons = { '40': ' (40 graines)', 'low': ' (< 10 graines)', 'blocked': ' (bloqué)' };
  document.getElementById('end-title').textContent = state.winner === -1 ? 'Match nul!' :
    (state.winner === playerNum ? 'Vous gagnez!' : 'Adversaire gagne!');
  document.getElementById('end-text').textContent = 'J1: ' + state.captured[0] + ' | J2: ' + state.captured[1] + (reasons[state.winReason] || '');
  document.getElementById('modal-end').classList.remove('hidden');
}

function startPolling() {
  if (polling) return;
  polling = true;
  setInterval(() => {
    if (state && state.over) return;
    fetch(API + '/get-board')
      .then(r => r.json())
      .then(s => {
        const oldTurn = state ? state.turn : -1;
        state = s;
        draw();
      })
      .catch(() => {});
  }, 2000);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-p0').addEventListener('click', () => {
    playerNum = 0;
    document.getElementById('btn-p0').classList.add('active-player');
    document.getElementById('btn-p1').classList.remove('active-player');
    draw();
    if (!polling) startPolling();
  });
  document.getElementById('btn-p1').addEventListener('click', () => {
    playerNum = 1;
    document.getElementById('btn-p1').classList.add('active-player');
    document.getElementById('btn-p0').classList.remove('active-player');
    draw();
    if (!polling) startPolling();
  });
  document.getElementById('btn-replay').addEventListener('click', () => {
    fetch(API + '/reset', { method: 'POST' }).then(r => r.json()).then(s => {
      state = s;
      document.getElementById('modal-end').classList.add('hidden');
      draw();
    });
  });
  const rm = document.getElementById('modal-rules');
  document.getElementById('btn-rules').addEventListener('click', () => rm.classList.remove('hidden'));
  document.getElementById('close-rules').addEventListener('click', () => rm.classList.add('hidden'));
  rm.addEventListener('click', e => { if (e.target === rm) rm.classList.add('hidden'); });
  document.getElementById('modal-end').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden'); });
  window.addEventListener('resize', draw);
  window.addEventListener('orientationchange', () => setTimeout(draw, 300));
  draw();
});
