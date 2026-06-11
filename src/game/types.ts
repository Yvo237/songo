export type Player = 'south' | 'north';

export interface GameState {
  board: number[];
  scores: { south: number; north: number };
  currentPlayer: Player;
  gameOver: boolean;
  winner: Player | 'draw' | null;
  moveHistory: MoveRecord[];
  lastMove: LastMoveInfo | null;
  message: string;
}

export interface MoveRecord {
  player: Player;
  pit: number;
  captured: number;
  boardBefore: number[];
  boardAfter: number[];
}

export interface LastMoveInfo {
  fromPit: number;
  visitedPits: number[];
  capturedPits: number[];
}

export type GameMode = 'pvp' | 'pve';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type AppScreen = 'menu' | 'game';

export interface GameConfig {
  mode: GameMode;
  difficulty: Difficulty;
  southName: string;
  northName: string;
}
