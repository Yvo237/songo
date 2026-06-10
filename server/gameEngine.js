class SongoGame {
  static TOTAL = 14;
  static INIT = 5;
  static CAPTURE = [2, 3, 4];
  static VICTORY = 40;
  static LOW = 10;

  static NEXT = [1, 2, 3, 4, 5, 6, 13, 0, 7, 8, 9, 10, 11, 12];
  static PREV = [7, 0, 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13, 6];

  static OPP_PATH = [
    [13, 12, 11, 10, 9, 8, 7],
    [0, 1, 2, 3, 4, 5, 6],
  ];

  static FIRST_OPP = [13, 0];
  static ATTACK = [6, 7];

  constructor() {
    this.board = Array(SongoGame.TOTAL).fill(SongoGame.INIT);
    this.turn = 0;
    this.captured = [0, 0];
    this.over = false;
    this.winner = null;
    this.winReason = null;
  }

  next(i) { return SongoGame.NEXT[i]; }
  prev(i) { return SongoGame.PREV[i]; }
  own(i, p) { return p === 0 ? i <= 6 : i >= 7; }
  opp(i, p) { return !this.own(i, p); }
  oppCells(p) { return p === 0 ? [7, 8, 9, 10, 11, 12, 13] : [0, 1, 2, 3, 4, 5, 6]; }
  ownCells(p) { return p === 0 ? [0, 1, 2, 3, 4, 5, 6] : [7, 8, 9, 10, 11, 12, 13]; }
  attackCell(p) { return SongoGame.ATTACK[p]; }
  firstOppCell(p) { return SongoGame.FIRST_OPP[p]; }
  oppPath(p) { return SongoGame.OPP_PATH[p]; }
  totalOnBoard() { return this.board.reduce((a, b) => a + b, 0); }

  _sow(board, idx, p) {
    const seeds = board[idx];
    const nb = [...board];
    nb[idx] = 0;
    let pos = idx;
    let oppSeeds = 0;
    let specialCapture = 0;

    if (seeds <= 13) {
      for (let i = 0; i < seeds; i++) {
        pos = this.next(pos);
        nb[pos]++;
        if (this.opp(pos, p)) oppSeeds++;
      }
    } else {
      let rem = seeds;
      for (let i = 0; i < 13; i++) {
        pos = this.next(pos);
        nb[pos]++;
        if (this.opp(pos, p)) oppSeeds++;
        rem--;
      }
      const path = this.oppPath(p);
      const firstOpp = this.firstOppCell(p);
      for (let i = 0; i < rem; i++) {
        const cell = path[i % 7];
        if (i === rem - 1 && cell === firstOpp) {
          specialCapture = 1;
        } else {
          nb[cell]++;
        }
        pos = cell;
        oppSeeds++;
      }
    }

    return { board: nb, lastPos: pos, oppSeeds, specialCapture };
  }

  _moveWouldCapture(idx, p) {
    const r = this._sow(this.board, idx, p);
    if (r.specialCapture) return true;
    const last = r.lastPos;
    if (last === this.firstOppCell(p)) return false;
    if (!this.opp(last, p)) return false;
    return SongoGame.CAPTURE.includes(r.board[last]);
  }

  _isAttackForbidden(idx, p) {
    if (idx !== this.attackCell(p)) return false;
    const s = this.board[idx];
    if (s === 1) return true;
    if (s === 2) return !this._moveWouldCapture(idx, p);
    return false;
  }

  _wouldEmptyOpponent(p, cleared) {
    const remaining = this.oppCells(p)
      .reduce((sum, i) => sum + this.board[i], 0);
    const removed = cleared.reduce((sum, i) => sum + this.board[i], 0);
    return remaining - removed === 0;
  }

  _resolveCapture(board, lastPos, p) {
    if (!this.opp(lastPos, p)) return { captured: 0, cleared: [] };
    if (lastPos === this.firstOppCell(p)) return { captured: 0, cleared: [] };
    if (!SongoGame.CAPTURE.includes(board[lastPos])) return { captured: 0, cleared: [] };

    const cleared = [];
    let pos = lastPos;
    while (this.opp(pos, p) && SongoGame.CAPTURE.includes(board[pos])) {
      cleared.push(pos);
      pos = this.prev(pos);
    }

    if (this._wouldEmptyOpponent(p, cleared)) return { captured: 0, cleared: [] };

    let total = 0;
    for (const ci of cleared) {
      total += board[ci];
      board[ci] = 0;
    }

    return { captured: total, cleared };
  }

  _getLegalMoves() {
    const p = this.turn;
    if (this.over) return [];

    const ownCells = this.ownCells(p).filter(i => this.board[i] > 0);
    if (ownCells.length === 0) return [];

    const oppEmpty = this.oppCells(p).every(i => this.board[i] === 0);

    if (oppEmpty) return this._getSolidarityMoves(p, ownCells);

    return ownCells
      .filter(i => !this._isAttackForbidden(i, p))
      .map(i => ({ pitIndex: i, forcedDonation: false }));
  }

  _getSolidarityMoves(p, candidates) {
    const oppBefore = this.oppCells(p).reduce((s, i) => s + this.board[i], 0);

    const enriched = candidates.map(idx => {
      const r = this._sow(this.board, idx, p);
      const after = r.board;
      const delivered = this.oppCells(p).reduce((s, i) => s + after[i], 0) - oppBefore;
      return { pitIndex: idx, delivered, forcedDonation: false };
    });

    const ordinary = enriched.filter(m => !this._isAttackForbidden(m.pitIndex, p));

    const atLeastSeven = ordinary.filter(m => m.delivered >= 7);
    if (atLeastSeven.length > 0) return atLeastSeven;

    const positive = ordinary.filter(m => m.delivered > 0);
    if (positive.length > 0) {
      const maxD = Math.max(...positive.map(m => m.delivered));
      return positive.filter(m => m.delivered === maxD);
    }

    const forced = candidates
      .filter(idx => idx === this.attackCell(p) && [1, 2].includes(this.board[idx]))
      .map(idx => ({ pitIndex: idx, delivered: 0, forcedDonation: true }));

    return forced;
  }

  getValidMoves(p) {
    return this._getLegalMoves().map(m => m.pitIndex);
  }

  play(cellIndex) {
    if (this.over) return null;
    if (!this.own(cellIndex, this.turn)) return null;
    if (this.board[cellIndex] === 0) return null;
    if (!this.getValidMoves(this.turn).includes(cellIndex)) return null;

    const p = this.turn;
    const moves = this._getLegalMoves();
    const move = moves.find(m => m.pitIndex === cellIndex);
    let isCell7V = false;
    let totalCaptured = 0;

    if (move && move.forcedDonation) {
      const seeds = this.board[cellIndex];
      this.board[cellIndex] = 0;
      this.captured[1 - p] += seeds;
      isCell7V = true;
    } else {
      const result = this._sow(this.board, cellIndex, p);
      this.board = result.board;

      if (result.specialCapture) {
        totalCaptured = result.specialCapture;
        this.captured[p] += totalCaptured;
      } else {
        const cr = this._resolveCapture(this.board, result.lastPos, p);
        totalCaptured = cr.captured;
        this.captured[p] += totalCaptured;
      }
    }

    this._resolveEndGameAfterMove();

    if (!this.over) {
      this.turn = 1 - p;
      this._resolveEndGameBeforeTurn();
    }

    return { cell: cellIndex, captured: totalCaptured, isCell7V, over: this.over, winner: this.winner };
  }

  _resolveEndGameAfterMove() {
    if (this.captured[0] >= SongoGame.VICTORY || this.captured[1] >= SongoGame.VICTORY) {
      this.over = true;
      this.winner = this.captured[0] >= SongoGame.VICTORY ? 0 : 1;
      this.winReason = '40';
      return;
    }
    if (this.totalOnBoard() < SongoGame.LOW) {
      this.over = true;
      this.winReason = 'low';
      for (let i = 0; i < SongoGame.TOTAL; i++) this.captured[this.own(i, 0) ? 0 : 1] += this.board[i];
      this.board.fill(0);
      this.winner = this.captured[0] >= SongoGame.VICTORY ? 0 : (this.captured[1] >= SongoGame.VICTORY ? 1 : -1);
    }
  }

  _resolveEndGameBeforeTurn() {
    const moves = this._getLegalMoves();
    if (moves.length === 0) {
      this.over = true;
      this.winReason = 'blocked';
      for (let i = 0; i < SongoGame.TOTAL; i++) this.captured[this.own(i, 0) ? 0 : 1] += this.board[i];
      this.board.fill(0);
      this.winner = this.captured[0] >= SongoGame.VICTORY ? 0 : (this.captured[1] >= SongoGame.VICTORY ? 1 : -1);
    }
  }

  getState() {
    return {
      board: [...this.board],
      turn: this.turn,
      captured: [...this.captured],
      over: this.over,
      winner: this.winner,
      winReason: this.winReason,
      validMoves: this.getValidMoves(this.turn),
    };
  }
}

module.exports = { SongoGame };
