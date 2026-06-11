import Pit from './Pit';
import { GameState, Player } from '../game/types';
import { getValidMoves } from '../game/engine';

interface BoardProps {
  state: GameState;
  onMove: (pit: number) => void;
  humanPlayer: Player | 'both';
  topName: string;
  bottomName: string;
  flipped?: boolean;
}

export default function Board({ state, onMove, humanPlayer, topName, bottomName, flipped }: BoardProps) {
  const validMoves = getValidMoves(state);
  const isHumanTurn = humanPlayer === 'both' || state.currentPlayer === humanPlayer;
  const lastMove = state.lastMove;

  const topRow = flipped
    ? [0, 1, 2, 3, 4, 5, 6]
    : [7, 8, 9, 10, 11, 12, 13];
  const bottomRow = flipped
    ? [13, 12, 11, 10, 9, 8, 7]
    : [6, 5, 4, 3, 2, 1, 0];
  const lastLanded = lastMove?.visitedPits[lastMove.visitedPits.length - 1] ?? -1;

  const topActive = flipped
    ? state.currentPlayer === 'south' && !state.gameOver
    : state.currentPlayer === 'north' && !state.gameOver;
  const bottomActive = flipped
    ? state.currentPlayer === 'north' && !state.gameOver
    : state.currentPlayer === 'south' && !state.gameOver;

  return (
    <div className="w-full max-w-[680px] mx-auto overflow-x-hidden px-0">
      {/* Board: the whole oval wooden piece */}
      <div
        className="relative rounded-[24px] 2xs:rounded-[30px] xs:rounded-[36px] sm:rounded-[50px] overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #B07840 0%, #8B5C30 30%, #6E4420 70%, #5A3618 100%)',
          boxShadow: '0 12px 50px rgba(40,20,5,0.55), 0 4px 12px rgba(0,0,0,0.3), inset 0 2px 0 rgba(255,220,160,0.1), inset 0 -2px 0 rgba(0,0,0,0.15)',
          padding: '10px 8px',
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
        <div className="absolute inset-[2px] rounded-[22px] 2xs:rounded-[28px] xs:rounded-[34px] sm:rounded-[48px] border border-white/[0.06] pointer-events-none" />

        {/* Top player name strip */}
        <div className="relative z-10 flex items-center justify-center pt-0.5 pb-2 xs:pt-1 xs:pb-3 sm:pb-4">
          <div className={`flex items-center gap-1.5 xs:gap-2 px-2 xs:px-4 py-1 xs:py-1.5 rounded-full transition-all duration-300 ${
            topActive
              ? 'bg-black/25 backdrop-blur-sm'
              : 'bg-transparent'
          }`}>
            {topActive && <span className="w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />}
            <span className={`text-[10px] 2xs:text-xs xs:text-xs sm:text-sm font-bold tracking-wide transition-colors ${
              topActive ? 'text-amber-200' : 'text-amber-900/30'
            }`}>
              {flipped ? bottomName : topName}
            </span>
          </div>
        </div>

        {/* Top pits - in a curved tray */}
        <div className="relative z-10">
          <div
            className="mx-auto rounded-[20px] 2xs:rounded-[24px] xs:rounded-[28px] sm:rounded-[36px] px-1.5 xs:px-2 sm:px-4 py-2 xs:py-3 sm:py-4"
            style={{
              background: 'linear-gradient(180deg, rgba(30,15,5,0.45) 0%, rgba(30,15,5,0.25) 100%)',
              boxShadow: 'inset 0 3px 12px rgba(0,0,0,0.35)',
            }}
          >
            <div className="flex justify-center gap-[2px] 2xs:gap-[3px] xs:gap-[4px] sm:gap-[8px] md:gap-[12px]">
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
        <div className="relative z-10 flex items-center gap-2 xs:gap-4 my-1 xs:my-2 sm:my-3 px-3 xs:px-6 sm:px-10">
          <div className="flex-1 h-[1px] xs:h-[2px] rounded-full" style={{ background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.25) 80%, transparent)' }} />
          <div className="flex-1 h-[1px] xs:h-[2px] rounded-full" style={{ background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.2) 20%, rgba(0,0,0,0.25) 80%, transparent)' }} />
        </div>

        {/* Bottom pits */}
        <div className="relative z-10">
          <div
            className="mx-auto rounded-[20px] 2xs:rounded-[24px] xs:rounded-[28px] sm:rounded-[36px] px-1.5 xs:px-2 sm:px-4 py-2 xs:py-3 sm:py-4"
            style={{
              background: 'linear-gradient(180deg, rgba(30,15,5,0.25) 0%, rgba(30,15,5,0.45) 100%)',
              boxShadow: 'inset 0 -3px 12px rgba(0,0,0,0.35)',
            }}
          >
            <div className="flex justify-center gap-[2px] 2xs:gap-[3px] xs:gap-[4px] sm:gap-[8px] md:gap-[12px]">
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
        <div className="relative z-10 flex items-center justify-center pt-2 xs:pt-3 sm:pt-4 pb-0.5 xs:pb-1">
          <div className={`flex items-center gap-1.5 xs:gap-2 px-2 xs:px-4 py-1 xs:py-1.5 rounded-full transition-all duration-300 ${
            bottomActive
              ? 'bg-black/25 backdrop-blur-sm'
              : 'bg-transparent'
          }`}>
            {bottomActive && <span className="w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />}
            <span className={`text-[10px] 2xs:text-xs xs:text-xs sm:text-sm font-bold tracking-wide transition-colors ${
              bottomActive ? 'text-amber-200' : 'text-amber-900/30'
            }`}>
              {flipped ? topName : bottomName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
