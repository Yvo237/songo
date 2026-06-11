import { GameState, Player, MoveRecord } from './types';

/*
  Board layout (visual):
  
  NORTH:  N1   N2   N3   N4   N5   N6   N7
  SOUTH:  S7   S6   S5   S4   S3   S2   S1
  
  Index mapping:
  South: S1=0, S2=1, S3=2, S4=3, S5=4, S6=5, S7=6
  North: N1=7, N2=8, N3=9, N4=10, N5=11, N6=12, N7=13
  
  Distribution: counter-clockwise loop 0->1->...->13->0->...
  South plays right-to-left in own camp, then left-to-right in opponent's.
*/

export function createInitialState(): GameState {
  return {
    board: new Array(14).fill(5),
    scores: { south: 0, north: 0 },
    currentPlayer: 'south',
    gameOver: false,
    winner: null,
    moveHistory: [],
    lastMove: null,
    message: '',
  };
}

export function getPlayerPits(player: Player): number[] {
  return player === 'south' ? [0, 1, 2, 3, 4, 5, 6] : [7, 8, 9, 10, 11, 12, 13];
}

export function getOpponentPits(player: Player): number[] {
  return player === 'south' ? [7, 8, 9, 10, 11, 12, 13] : [0, 1, 2, 3, 4, 5, 6];
}

export function getCaseNumber(pitIndex: number): number {
  return pitIndex <= 6 ? pitIndex + 1 : pitIndex - 6;
}

function nextPit(current: number): number {
  return (current + 1) % 14;
}

function isOpponentPit(pit: number, currentPlayer: Player): boolean {
  return currentPlayer === 'south' ? (pit >= 7 && pit <= 13) : (pit >= 0 && pit <= 6);
}

function getOpponentCase1(currentPlayer: Player): number {
  return currentPlayer === 'south' ? 7 : 0;
}

function getPlayerCase7(currentPlayer: Player): number {
  return currentPlayer === 'south' ? 6 : 13;
}

function isOpponentCampEmpty(board: number[], currentPlayer: Player): boolean {
  return getOpponentPits(currentPlayer).every(p => board[p] === 0);
}

function countPlayerSeeds(board: number[], player: Player): number {
  return getPlayerPits(player).reduce((sum, p) => sum + board[p], 0);
}

function simulateSow(board: number[], pit: number): {
  newBoard: number[];
  lastPit: number;
  visitedPits: number[];
  seedsDistributed: number;
} {
  const newBoard = [...board];
  const seeds = newBoard[pit];
  newBoard[pit] = 0;

  let current = pit;
  const visitedPits: number[] = [];

  for (let i = 0; i < seeds; i++) {
    current = nextPit(current);
    if (seeds > 13 && current === pit) {
      current = nextPit(current);
    }
    newBoard[current]++;
    visitedPits.push(current);
  }

  return { newBoard, lastPit: current, visitedPits, seedsDistributed: seeds };
}

function performCaptures(
  board: number[],
  lastPit: number,
  currentPlayer: Player,
  seedsDistributed: number
): { newBoard: number[]; captured: number; capturedPits: number[] } {
  const newBoard = [...board];
  let captured = 0;
  const capturedPits: number[] = [];
  const opponentCase1 = getOpponentCase1(currentPlayer);

  if (!isOpponentPit(lastPit, currentPlayer)) {
    return { newBoard, captured, capturedPits };
  }

  // Special: last seed in opponent case 1 after full loop
  if (lastPit === opponentCase1 && seedsDistributed >= 14) {
    newBoard[lastPit]--;
    captured = 1;
    capturedPits.push(lastPit);
    return { newBoard, captured, capturedPits };
  }

  // Chain capture backwards
  let current = lastPit;

  while (isOpponentPit(current, currentPlayer)) {
    const seeds = newBoard[current];

    if (seeds >= 2 && seeds <= 4) {
      // No direct capture from case 1 (only allowed in chain)
      if (current === opponentCase1 && current === lastPit) {
        break;
      }

      captured += seeds;
      capturedPits.push(current);
      newBoard[current] = 0;
      current = (current - 1 + 14) % 14;
    } else {
      break;
    }
  }

  // Cannot completely empty opponent camp
  if (capturedPits.length > 0) {
    const remaining = getOpponentPits(currentPlayer).reduce((sum, p) => sum + newBoard[p], 0);
    if (remaining === 0) {
      return { newBoard: [...board], captured: 0, capturedPits: [] };
    }
  }

  return { newBoard, captured, capturedPits };
}

export function isValidMove(state: GameState, pit: number): boolean {
  const { board, currentPlayer } = state;
  const playerPits = getPlayerPits(currentPlayer);

  if (!playerPits.includes(pit)) return false;
  if (board[pit] === 0) return false;

  if (isOpponentCampEmpty(board, currentPlayer)) {
    const { newBoard } = simulateSow(board, pit);
    const opponentPits = getOpponentPits(currentPlayer);
    const seedsInOpponent = opponentPits.reduce((sum, p) => sum + newBoard[p], 0);

    if (seedsInOpponent === 0) {
      const canFeed = playerPits.some(p => {
        if (board[p] === 0) return false;
        const sim = simulateSow(board, p);
        return opponentPits.reduce((s, op) => s + sim.newBoard[op], 0) > 0;
      });
      if (canFeed) return false;
    }

    if (seedsInOpponent > 0 && seedsInOpponent < 7) {
      const canDistribute7 = playerPits.some(p => {
        if (board[p] === 0) return false;
        const sim = simulateSow(board, p);
        return opponentPits.reduce((s, op) => s + sim.newBoard[op], 0) >= 7;
      });
      if (canDistribute7) return false;

      let maxSeeds = 0;
      playerPits.forEach(p => {
        if (board[p] === 0) return;
        const sim = simulateSow(board, p);
        const oppSeeds = opponentPits.reduce((s, op) => s + sim.newBoard[op], 0);
        maxSeeds = Math.max(maxSeeds, oppSeeds);
      });
      if (seedsInOpponent < maxSeeds) return false;
    }
  }

  return true;
}

export function getValidMoves(state: GameState): number[] {
  return getPlayerPits(state.currentPlayer).filter(pit => isValidMove(state, pit));
}

export function makeMove(state: GameState, pit: number): GameState {
  if (state.gameOver || !isValidMove(state, pit)) return state;

  const { board, currentPlayer, scores, moveHistory } = state;
  const boardBefore = [...board];
  const opponent: Player = currentPlayer === 'south' ? 'north' : 'south';

  // Case 7 interdit: 1 or 2 seeds from case 7 go to opponent
  const case7 = getPlayerCase7(currentPlayer);
  if (pit === case7 && board[pit] <= 2 && board[pit] > 0) {
    const seedCount = board[pit];
    const newBoard = [...board];
    newBoard[pit] = 0;
    const newScores = { ...scores };
    newScores[opponent] += seedCount;

    const record: MoveRecord = {
      player: currentPlayer,
      pit,
      captured: 0,
      boardBefore,
      boardAfter: newBoard,
    };

    return checkGameEnd({
      board: newBoard,
      scores: newScores,
      currentPlayer: opponent,
      gameOver: false,
      winner: null,
      moveHistory: [...moveHistory, record],
      lastMove: { fromPit: pit, visitedPits: [], capturedPits: [] },
      message: `interdit:${currentPlayer}:${seedCount}`,
    });
  }

  const { newBoard: boardAfterSow, lastPit, visitedPits, seedsDistributed } =
    simulateSow(board, pit);

  const { newBoard: boardAfterCapture, captured, capturedPits } =
    performCaptures(boardAfterSow, lastPit, currentPlayer, seedsDistributed);

  const newScores = { ...scores };
  newScores[currentPlayer] += captured;

  const record: MoveRecord = {
    player: currentPlayer,
    pit,
    captured,
    boardBefore,
    boardAfter: boardAfterCapture,
  };

  const message = captured > 0
    ? `capture:${currentPlayer}:${captured}`
    : `turn:${opponent}`;

  return checkGameEnd({
    board: boardAfterCapture,
    scores: newScores,
    currentPlayer: opponent,
    gameOver: false,
    winner: null,
    moveHistory: [...moveHistory, record],
    lastMove: { fromPit: pit, visitedPits, capturedPits },
    message,
  });
}

function checkGameEnd(state: GameState): GameState {
  const { board, scores } = state;
  const totalOnBoard = board.reduce((a, b) => a + b, 0);

  if (scores.south >= 40) {
    return { ...state, gameOver: true, winner: 'south', message: 'win:south' };
  }
  if (scores.north >= 40) {
    return { ...state, gameOver: true, winner: 'north', message: 'win:north' };
  }

  if (totalOnBoard < 10) {
    const finalSouth = countPlayerSeeds(board, 'south') + scores.south;
    const finalNorth = countPlayerSeeds(board, 'north') + scores.north;
    const winner = finalSouth > finalNorth ? 'south' as const
      : finalNorth > finalSouth ? 'north' as const : 'draw' as const;
    const endMsg = winner === 'draw' ? 'end:draw' : `win:${winner}`;

    return {
      ...state,
      gameOver: true,
      winner,
      scores: { south: finalSouth, north: finalNorth },
      message: endMsg,
    };
  }

  const validMoves = getValidMoves(state);
  if (validMoves.length === 0) {
    const finalSouth = countPlayerSeeds(board, 'south') + scores.south;
    const finalNorth = countPlayerSeeds(board, 'north') + scores.north;
    const winner = finalSouth > finalNorth ? 'south' as const
      : finalNorth > finalSouth ? 'north' as const : 'draw' as const;
    const noMoveMsg = winner === 'draw' ? 'end:draw' : `win:${winner}`;

    return {
      ...state,
      gameOver: true,
      winner,
      scores: { south: finalSouth, north: finalNorth },
      message: noMoveMsg,
    };
  }

  return state;
}

// === AI ===

export function getAIMove(state: GameState, difficulty: 'easy' | 'medium' | 'hard'): number {
  const validMoves = getValidMoves(state);
  if (validMoves.length === 0) return -1;

  if (difficulty === 'easy') {
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }
  if (difficulty === 'medium') {
    return getMediumAIMove(state, validMoves);
  }
  return getHardAIMove(state, validMoves);
}

function getMediumAIMove(state: GameState, validMoves: number[]): number {
  let bestMove = validMoves[0];
  let bestCapture = -1;

  for (const move of validMoves) {
    const result = makeMove(state, move);
    const captured = result.scores[state.currentPlayer] - state.scores[state.currentPlayer];
    if (captured > bestCapture) {
      bestCapture = captured;
      bestMove = move;
    }
  }

  if (Math.random() < 0.3) {
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  return bestMove;
}

function getHardAIMove(state: GameState, validMoves: number[]): number {
  let bestMove = validMoves[0];
  let bestScore = -Infinity;

  for (const move of validMoves) {
    const result = makeMove(state, move);
    const score = minimax(result, 3, false, -Infinity, Infinity, state.currentPlayer);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

function minimax(
  state: GameState,
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number,
  aiPlayer: Player
): number {
  if (depth === 0 || state.gameOver) {
    return evaluateState(state, aiPlayer);
  }

  const validMoves = getValidMoves(state);
  if (validMoves.length === 0) {
    return evaluateState(state, aiPlayer);
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of validMoves) {
      const result = makeMove(state, move);
      const score = minimax(result, depth - 1, false, alpha, beta, aiPlayer);
      maxEval = Math.max(maxEval, score);
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of validMoves) {
      const result = makeMove(state, move);
      const score = minimax(result, depth - 1, true, alpha, beta, aiPlayer);
      minEval = Math.min(minEval, score);
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

function evaluateState(state: GameState, aiPlayer: Player): number {
  const opponent: Player = aiPlayer === 'south' ? 'north' : 'south';

  if (state.gameOver) {
    if (state.winner === aiPlayer) return 1000;
    if (state.winner === opponent) return -1000;
    return 0;
  }

  const scoreDiff = state.scores[aiPlayer] - state.scores[opponent];
  const ownSeeds = countPlayerSeeds(state.board, aiPlayer);
  const oppSeeds = countPlayerSeeds(state.board, opponent);

  return scoreDiff * 10 + (ownSeeds - oppSeeds) * 0.5;
}
