const API = (window.API_URL || '').replace(/\/+$/, '');
let playerNum = null;
let state = null;
let busy = false;
let polling = false;
let room = null;
let isLocal = false;
let players = null;
const LAB = 'ABCDEFGHIJKLMN';

// ── Sound engine (Web Audio) ──
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let actx = null;
function initAudio() {
  if (!actx) actx = new AudioCtx();
}
function playTone(freq, dur, type, vol) {
  try {
    initAudio();
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime((vol || 0.15), actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
    o.connect(g);
    g.connect(actx.destination);
    o.start(actx.currentTime);
    o.stop(actx.currentTime + dur);
  } catch (e) {}
}
function sfxMove()   { playTone(520, 0.08, 'sine', 0.12); }
function sfxCapture(){ playTone(880, 0.12, 'triangle', 0.15); setTimeout(() => playTone(1100, 0.15, 'triangle', 0.1), 80); }
function sfxWin()    { [0,100,200,300].forEach((d,i) => setTimeout(() => playTone(660+i*110, 0.18, 'sine', 0.12), d)); }
function sfxLose()   { playTone(300, 0.3, 'sawtooth', 0.08); }
function sfxInvalid(){ playTone(200, 0.12, 'square', 0.06); }

// ── UI helpers ──
function $(id) { return document.getElementById(id); }
function msg(t, e) {
  const el = $('msg');
  el.textContent = t;
  el.classList.remove('hidden', 'err');
  if (e) el.classList.add('err');
  if (el.timer) clearTimeout(el.timer);
  el.timer = setTimeout(() => el.classList.add('hidden'), e ? 4000 : 2200);
}
function hideMsg() { $('msg').classList.add('hidden'); }

function showLobby() {
  $('lobby').classList.remove('hidden');
  $('game-container').classList.add('hidden');
  $('main-options').classList.remove('hidden');
  $('local-options').classList.add('hidden');
  $('online-options').classList.add('hidden');
  if (polling) { polling = false; }
  room = null; playerNum = null; state = null; players = null;
}

// ── Board drawing ──
function dims(c) {
  const s = Math.min(c.offsetWidth, c.offsetHeight, 380);
  return { r: s * 0.39, cs: Math.max(34, Math.min(56, s * 0.14)) };
}

function draw() {
  if (!state || !state.board) return;
  const c = $('cells');
  c.innerHTML = '';
  const w = c.offsetWidth, h = c.offsetHeight;
  if (!w || !h) { requestAnimationFrame(draw); return; }
  const d = dims(c), cx = w / 2, cy = h / 2;

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
    sc.style.fontSize = Math.max(.55, Math.min(1.1, d.cs * .02)) + 'rem';
    el.appendChild(sc);

    const lb = document.createElement('span');
    lb.className = 'cl';
    lb.textContent = LAB[i];
    el.appendChild(lb);

    c.appendChild(el);
  }

  $('cap-0').textContent = state.captured[0];
  $('cap-1').textContent = state.captured[1];

  const tt = $('turn-txt');
  if (state.over) {
    tt.textContent = 'Partie terminée';
    endGame();
  } else if (playerNum === null) {
    tt.textContent = 'Choisissez votre camp';
  } else {
    tt.textContent = state.turn === playerNum ? 'À vous de jouer' : 'Tour adverse';
    $('p1-info').classList.toggle('active', state.turn === 0);
    $('p2-info').classList.toggle('active', state.turn === 1);
  }

  drawHistory();
}

function drawHistory() {
  const list = $('history-list');
  if (!state.history || state.history.length === 0) {
    list.innerHTML = '<div class="hist-item" style="color:var(--tx2);font-size:.6rem;padding:6px;background:transparent">Aucun coup</div>';
    return;
  }
  list.innerHTML = state.history.map(h => {
    const pn = h.player === 0 ? 'Nord' : 'Sud';
    const extra = h.captured > 0 ? ` +${h.captured}` : h.forcedDonation ? ' (don)' : '';
    return `<div class="hist-item"><span class="hn">#${h.n}</span><span class="hp p${h.player}">${pn}</span><span>${LAB[h.cell]}${extra}</span></div>`;
  }).join('');
  list.scrollTop = list.scrollHeight;
}

// ── Game actions ──
function click(i) {
  if (busy || playerNum === null) return;
  busy = true;
  sfxMove();
  fetch(API + '/play', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room, player: playerNum, cell: i }),
  })
  .then(r => r.json())
  .then(data => {
    if (data.error) { sfxInvalid(); msg(data.error, true); busy = false; return; }
    const oldBoard = state ? [...state.board] : null;
    state = data.state;
    if (data.players) players = data.players;
    hideMsg();

    // Highlight last move cell
    const el = document.querySelector('.cell[data-i="' + i + '"]');
    if (el) { el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 350); }

    // Highlight destination cell
    if (data.move && data.move.captured > 0) {
      sfxCapture();
      msg('+' + data.move.captured + ' capturée(s)');
    } else if (data.move && data.move.isCell7V) {
      msg('Don forcé à l\'adversaire');
    }

    draw();
    updateLastMove(i);
    busy = false;
  })
  .catch(() => { sfxInvalid(); msg('Erreur de connexion', true); busy = false; });
}

function updateLastMove(i) {
  const txt = $('last-move-txt');
  if (!state || !state.moveCount) { txt.textContent = '—'; return; }
  const last = state.history[state.history.length - 1];
  if (!last) { txt.textContent = '—'; return; }
  const pn = last.player === 0 ? 'Nord' : 'Sud';
  txt.textContent = `${pn} → ${LAB[last.cell]}${last.captured > 0 ? ' 🏆' : ''}${last.forcedDonation ? ' (don)' : ''}`;
}

function endGame() {
  const reasons = { '40': ' (40 graines)', 'low': ' (< 10 graines)', 'blocked': ' (bloqué)' };
  const win = state.winner;
  if (win === -1) {
    $('end-title').textContent = 'Match nul !';
    sfxLose();
  } else if (win === playerNum) {
    $('end-title').textContent = '🎉 Vous gagnez !';
    sfxWin();
  } else {
    $('end-title').textContent = '😞 Adversaire gagne !';
    sfxLose();
  }
  const pn0 = players ? players[0].name : 'J1';
  const pn1 = players ? players[1].name : 'J2';
  $('end-text').textContent = `${pn0}: ${state.captured[0]} | ${pn1}: ${state.captured[1]}${reasons[state.winReason] || ''}`;
  $('modal-end').classList.remove('hidden');
}

function startPolling() {
  if (polling) return;
  polling = true;
  const interval = setInterval(() => {
    if (!room) { clearInterval(interval); polling = false; return; }
    if (state && state.over) return;
    fetch(API + '/get-board?room=' + room)
      .then(r => r.json())
      .then(s => {
        if (s.board) {
          state = s;
          if (s.players) players = s.players;
          draw();
          updateLastMove();
        }
      })
      .catch(() => {});
  }, 2000);
}

function startGame(pnum, r, s, local, pls) {
  room = r;
  playerNum = pnum;
  state = s;
  isLocal = local;
  players = pls || s.players || null;
  $('lobby').classList.add('hidden');
  $('game-container').classList.remove('hidden');
  if (local) {
    $('room-label').textContent = '🏠 Mode local';
    $('btn-copy').classList.add('hidden');
  } else {
    $('room-label').textContent = '🔗 ' + r;
    $('btn-copy').classList.remove('hidden');
  }
  updatePlayerNames();
  draw();
  updateLastMove();
  if (!local) startPolling();
}

function updatePlayerNames() {
  if (players && players[0]) $('p1-name').textContent = players[0].name;
  if (players && players[1]) $('p2-name').textContent = players[1].name;
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  initAudio();
  const params = new URLSearchParams(window.location.search);
  const roomParam = params.get('room');

  // Direct join via URL
  if (roomParam) {
    $('lobby').classList.add('hidden');
    const pnum = params.get('p') === '0' ? 0 : 1;
    msg('Connexion...', false);
    (function retryJoin(attempts) {
      fetch(API + '/join-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomParam }),
      })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        hideMsg();
        startGame(pnum, roomParam, data.state, false, data.players);
      })
      .catch(() => {
        if (attempts > 0) {
          setTimeout(() => retryJoin(attempts - 1), 5000);
        } else {
          msg('Partie introuvable — le serveur a redémarré.', true);
        }
      });
    })(6);
    return;
  }

  // ── Event listeners ──
  $('btn-local').addEventListener('click', () => {
    $('main-options').classList.add('hidden');
    $('local-options').classList.remove('hidden');
  });
  $('btn-online').addEventListener('click', () => {
    $('main-options').classList.add('hidden');
    $('online-options').classList.remove('hidden');
  });
  $('btn-back-local').addEventListener('click', showLobby);
  $('btn-back-online').addEventListener('click', showLobby);
  $('btn-quit').addEventListener('click', showLobby);

  // Local mode
  $('btn-p0').addEventListener('click', () => {
    if (playerNum !== null) return;
    playerNum = 0;
    $('btn-p0').classList.add('active-player');
    fetch(API + '/create-game', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      .then(r => r.json())
      .then(data => startGame(0, data.room, data.state, true, data.players))
      .catch(() => { msg('Erreur serveur', true); playerNum = null; });
  });
  $('btn-p1').addEventListener('click', () => {
    if (playerNum !== null) return;
    playerNum = 1;
    $('btn-p1').classList.add('active-player');
    fetch(API + '/create-game', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      .then(r => r.json())
      .then(data => startGame(1, data.room, data.state, true, data.players))
      .catch(() => { msg('Erreur serveur', true); playerNum = null; });
  });

  // Online mode
  $('btn-create').addEventListener('click', () => {
    const btn = $('btn-create');
    const name = $('online-name').value.trim() || 'Joueur 1';
    btn.textContent = 'Création...';
    btn.disabled = true;
    fetch(API + '/create-game', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    .then(r => r.json())
    .then(data => {
      history.replaceState(null, '', '?room=' + data.room + '&p=0');
      startGame(0, data.room, data.state, false, data.players);
    })
    .catch(() => {
      btn.textContent = 'Créer une partie';
      btn.disabled = false;
      msg('Erreur de connexion', true);
    });
  });

  $('btn-join').addEventListener('click', () => {
    const code = $('room-input').value.trim().toUpperCase();
    if (!code) return;
    const name = $('online-name').value.trim() || 'Joueur 2';
    const btn = $('btn-join');
    btn.textContent = 'Connexion...';
    btn.disabled = true;
    fetch(API + '/join-game', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: code, name }),
    })
    .then(r => { if (!r.ok) throw new Error(); return r.json(); })
    .then(data => {
      history.replaceState(null, '', '?room=' + code + '&p=1');
      startGame(1, code, data.state, false, data.players);
    })
    .catch(() => {
      btn.textContent = 'Rejoindre';
      btn.disabled = false;
      msg('Partie introuvable', true);
    });
  });

  $('room-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') $('btn-join').click();
  });

  $('btn-copy').addEventListener('click', () => {
    const url = window.location.origin + window.location.pathname + '?room=' + room;
    navigator.clipboard.writeText(url).then(() => msg('Lien copié !'));
  });

  $('btn-replay').addEventListener('click', () => {
    fetch(API + '/reset', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room }),
    }).then(r => r.json()).then(s => {
      state = s;
      if (s.players) players = s.players;
      $('modal-end').classList.add('hidden');
      draw();
      updateLastMove();
    });
  });

  // Rules modal
  const rm = $('modal-rules');
  $('btn-rules').addEventListener('click', () => rm.classList.remove('hidden'));
  $('close-rules').addEventListener('click', () => rm.classList.add('hidden'));
  rm.addEventListener('click', e => { if (e.target === rm) rm.classList.add('hidden'); });
  $('modal-end').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden'); });

  window.addEventListener('resize', draw);
  window.addEventListener('orientationchange', () => setTimeout(draw, 300));
  draw();
});
