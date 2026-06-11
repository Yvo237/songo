import Pit from './Pit';
import { GameState, Player } from '../game/types';
import { getValidMoves } from '../game/engine';

interface BoardProps {
  state: GameState;
  onMove: (pit: number) => void;
  humanPlayer: Player | 'both';
  topName: string;
  bottomName: string;
}

export default function Board({ state, onMove, humanPlayer, topName, bottomName }: BoardProps) {
  const validMoves = getValidMoves(state);
  const isHumanTurn = humanPlayer === 'both' || state.currentPlayer === humanPlayer;
  const lastMove = state.lastMove;

  const topRow = [7, 8, 9, 10, 11, 12, 13];
  const bottomRow = [6, 5, 4, 3, 2, 1, 0];
  const lastLanded = lastMove?.visitedPits[lastMove.visitedPits.length - 1] ?? -1;

  const topActive = state.currentPlayer === 'north' && !state.gameOver;
  const bottomActive = state.currentPlayer === 'south' && !state.gameOver;

  return (
    <div className="w-full max-w-[680px] mx-auto">
      {/* Board: the whole oval wooden piece */}
      <div
        className="relative rounded-[40px] sm:rounded-[50px] overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #B07840 0%, #8B5C30 30%, #6E4420 70%, #5A3618 100%)',
          boxShadow: '0 12px 50px rgba(40,20,5,0.55), 0 4px 12px rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,220,160,0.1), inset 0 -2px 0 rgba(0,0,0,0.15)',
          padding: '14px 12px',
        }}
      >
        {/* Wood photo texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.15] mix-blend-overlay"
          style={{ backgroundImage: "url('/images/board-texture.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        {/* Second layer grain */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: "url('/images/wood-bg.jpg')", backgroundSize: 'cover' }}
        />
        {/* Rim highlight */}
        <div className="absolute inset-[2px] rounded-[38px] sm:rounded-[48px] border border-white/[0.06] pointer-events-none" />

        {/* Top player name strip */}
        <div className="relative z-10 flex items-center justify-center pt-1 pb-3 sm:pb-4">
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-300 ${
            topActive
              ? 'bg-black/25 backdrop-blur-sm'
              : 'bg-transparent'
          }`}>
            {topActive && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />}
            <span className={`text-xs sm:text-sm font-bold tracking-wide transition-colors ${
              topActive ? 'text-amber-200' : 'text-amber-900/30'
            }`}>
              {topName}
            </span>
          </div>
        </div>

        {/* Top pits - in a curved tray */}
        <div className="relative z-10">
          <div
            className="mx-auto rounded-[30px] sm:rounded-[36px] px-2 sm:px-4 py-3 sm:py-4"
            style={{
              background: 'linear-gradient(180deg, rgba(30,15,5,0.45) 0%, rgba(30,15,5,0.25) 100%)',
              boxShadow: 'inset 0 3px 12px rgba(0,0,0,0.35)',
            }}
          >
            <div className="flex justify-center gap-[4px] sm:gap-[8px] md:gap-[12px]">
              {topRow.map(idx => (
                <Pit
                  key={idx}
                  seeds={state.board[idx]}
                  isPlayable={isHumanTurn && validMoves.includes(idx) && !state.gameOver}
                  isLastLanded={lastLanded === idx}
                  isCaptured={lastMove?.capturedPits.includes(idx) ?? false}
                  onClick={() => onMove(idx)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Carved center groove */}
        <div className="relative z-10 flex items-center gap-4 my-2 sm:my-3 px-6 sm:px-10">
          <div className="flex-1 h-[2px] rounded-full" style={{ background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.25) 80%, transparent)' }} />
          <div className="flex-1 h-[2px] rounded-full" style={{ background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.25) 80%, transparent)' }} />
        </div>

        {/* Bottom pits */}
        <div className="relative z-10">
          <div
            className="mx-auto rounded-[30px] sm:rounded-[36px] px-2 sm:px-4 py-3 sm:py-4"
            style={{
              background: 'linear-gradient(180deg, rgba(30,15,5,0.25) 0%, rgba(30,15,5,0.45) 100%)',
              boxShadow: 'inset 0 -3px 12px rgba(0,0,0,0.35)',
            }}
          >
            <div className="flex justify-center gap-[4px] sm:gap-[8px] md:gap-[12px]">
              {bottomRow.map(idx => (
                <Pit
                  key={idx}
                  seeds={state.board[idx]}
                  isPlayable={isHumanTurn && validMoves.includes(idx) && !state.gameOver}
                  isLastLanded={lastLanded === idx}
                  isCaptured={lastMove?.capturedPits.includes(idx) ?? false}
                  onClick={() => onMove(idx)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom player name strip */}
        <div className="relative z-10 flex items-center justify-center pt-3 sm:pt-4 pb-1">
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all duration-300 ${
            bottomActive
              ? 'bg-black/25 backdrop-blur-sm'
              : 'bg-transparent'
          }`}>
            {bottomActive && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />}
            <span className={`text-xs sm:text-sm font-bold tracking-wide transition-colors ${
              bottomActive ? 'text-amber-200' : 'text-amber-900/30'
            }`}>
              {bottomName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
