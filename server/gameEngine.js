class SongoGame {
  static TOTAL = 14;
  static INIT = 5;

  constructor() {
    this.board = Array(SongoGame.TOTAL).fill(SongoGame.INIT);
    this.turn = 0;
    this.captured = [0, 0];
    this.over = false;
    this.winner = null;
    this.winReason = null;
  }

  nextIdx(i, p) { return p === 0 ? (i + 1) % 14 : (i - 1 + 14) % 14; }
  prevIdx(i, p) { return p === 0 ? (i - 1 + 14) % 14 : (i + 1) % 14; }
  own(i, p) { return p === 0 ? i <= 6 : i >= 7; }
  opp(i, p) { return !this.own(i, p); }
  oppCells(p) { return p === 0 ? [7,8,9,10,11,12,13] : [0,1,2,3,4,5,6]; }
  ownCells(p) { return p === 0 ? [0,1,2,3,4,5,6] : [7,8,9,10,11,12,13]; }
  entryCell(p) { return p === 0 ? 7 : 6; }
  cell7(p) { return p === 0 ? 6 : 7; }
  totalOnBoard() { return this.board.reduce((a, b) => a + b, 0); }

  getValidMoves(p) {
    const cells = this.ownCells(p).filter(i => this.board[i] > 0);
    if (cells.length === 0) return [];
    const oppEmpty = this.oppCells(p).every(i => this.board[i] === 0);
    if (!oppEmpty) {
      return cells.filter(i => {
        if (i !== this.cell7(p)) return true;
        const info = this._simulate(i, p);
        return !(info.oppSeeds >= 1 && info.oppSeeds <= 2);
      });
    }
    const scored = cells.map(i => ({ idx: i, info: this._simulate(i, p) }));
    const best = Math.max(...scored.map(s => s.info.oppSeeds), 0);
    return scored.filter(s => s.info.oppSeeds === best).map(s => s.idx);
  }

  _simulate(idx, p) {
    const seeds = this.board[idx];
    let pos = idx, oppSeeds = 0, rem = seeds;
    while (rem > 0) {
      pos = this.nextIdx(pos, p);
      if (seeds > 13 && pos === idx) continue;
      if (this.opp(pos, p)) oppSeeds++;
      rem--;
    }
    return { lastPos: pos, oppSeeds };
  }

  play(cellIndex) {
    if (this.over) return null;
    if (!this.own(cellIndex, this.turn)) return null;
    if (this.board[cellIndex] === 0) return null;
    if (!this.getValidMoves(this.turn).includes(cellIndex)) return null;

    const p = this.turn;
    const seeds = this.board[cellIndex];
    const entry = this.entryCell(p);
    this.board[cellIndex] = 0;
    let pos = cellIndex, rem = seeds, oppSeedsPlaced = 0;

    while (rem > 0) {
      pos = this.nextIdx(pos, p);
      if (seeds > 13 && pos === cellIndex) continue;
      this.board[pos]++;
      if (this.opp(pos, p)) oppSeedsPlaced++;
      rem--;
    }

    let captured = 0, cleared = [];
    const isCell7V = cellIndex === this.cell7(p) && oppSeedsPlaced >= 1 && oppSeedsPlaced <= 2;

    if (isCell7V) {
      let n = oppSeedsPlaced;
      for (const ci of this.oppCells(p)) {
        while (this.board[ci] > 0 && n > 0) { this.board[ci]--; n--; this.captured[1-p]++; }
      }
    } else if (this.opp(pos, p)) {
      const cnt = this.board[pos];
      if (pos === entry) {
        if (seeds >= 14) { captured = 1; this.board[pos] = 0; cleared.push(pos); }
      } else if (cnt >= 2 && cnt <= 4) { captured = cnt; this.board[pos] = 0; cleared.push(pos); }
      if (captured > 0) {
        let prev = this.prevIdx(pos, p);
        while (this.opp(prev, p)) {
          const c = this.board[prev];
          if (c >= 2 && c <= 4) { captured += c; this.board[prev] = 0; cleared.push(prev); prev = this.prevIdx(prev, p); }
          else break;
        }
      }
      if (captured > 0 && this.oppCells(p).every(i => this.board[i] === 0)) {
        for (const ci of cleared) { this.board[ci] = 1; captured--; }
      }
    }
    this.captured[p] += captured;
    this.turn = 1 - p;
    this._checkEnd();
    return { cell: cellIndex, captured, isCell7V, over: this.over, winner: this.winner };
  }

  _checkEnd() {
    if (this.captured[0] >= 40 || this.captured[1] >= 40) {
      this.over = true; this.winner = this.captured[0] >= 40 ? 0 : 1; this.winReason = '40';
      return;
    }
    if (this.totalOnBoard() < 10) {
      this.over = true; this.winReason = 'low';
      for (let i = 0; i < 14; i++) this.captured[this.own(i,0) ? 0 : 1] += this.board[i];
      this.board.fill(0);
      this.winner = this.captured[0] >= 40 ? 0 : (this.captured[1] >= 40 ? 1 : -1);
      return;
    }
    if (this.getValidMoves(this.turn).length === 0) {
      this.over = true; this.winReason = 'blocked';
      for (let i = 0; i < 14; i++) this.captured[this.own(i,0) ? 0 : 1] += this.board[i];
      this.board.fill(0);
      this.winner = this.captured[0] >= 40 ? 0 : (this.captured[1] >= 40 ? 1 : -1);
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
