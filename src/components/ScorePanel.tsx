import { GameState } from '../game/types';

interface Props {
  state: GameState;
  topName: string;
  bottomName: string;
  flipped?: boolean;
}

export default function ScorePanel({ state, topName, bottomName, flipped }: Props) {
  const total = state.board.reduce((a, b) => a + b, 0);

  return (
    <div className="flex items-stretch gap-1.5 xs:gap-2 sm:gap-3 w-full max-w-xl mx-auto">
      <ScoreCard
        name={flipped ? bottomName : topName}
        score={flipped ? state.scores.south : state.scores.north}
        isActive={flipped
          ? state.currentPlayer === 'south' && !state.gameOver
          : state.currentPlayer === 'north' && !state.gameOver}
      />

      <div className="flex flex-col items-center justify-center px-0.5 xs:px-1 shrink-0">
        <span className="text-amber-600/30 text-[8px] xs:text-[10px] font-bold">VS</span>
        <span className="text-amber-700/20 text-[7px] xs:text-[9px] mt-0.5">{total}</span>
      </div>

      <ScoreCard
        name={flipped ? topName : bottomName}
        score={flipped ? state.scores.north : state.scores.south}
        isActive={flipped
          ? state.currentPlayer === 'north' && !state.gameOver
          : state.currentPlayer === 'south' && !state.gameOver}
      />
    </div>
  );
}

function ScoreCard({
  name,
  score,
  isActive,
}: {
  name: string;
  score: number;
  isActive: boolean;
}) {
  const progress = Math.min((score / 40) * 100, 100);

  return (
    <div className={`flex-1 rounded-xl p-2 xs:p-3 sm:p-3.5 transition-all duration-300 border ${
      isActive
        ? 'bg-amber-900/30 border-amber-600/25 shadow-[0_0_15px_rgba(180,130,50,0.08)]'
        : 'bg-black/15 border-amber-800/10'
    }`}>
      <div className="flex items-center justify-between mb-1 xs:mb-2">
        <div className="flex items-center gap-1 xs:gap-2 min-w-0">
          {isActive && <span className="w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />}
          <span className="text-amber-200/80 text-[10px] xs:text-xs sm:text-sm font-semibold truncate">{name}</span>
        </div>
        <span className="text-lg xs:text-2xl sm:text-3xl font-extrabold font-mono tabular-nums pl-1 xs:pl-2 text-amber-300">
          {score}
        </span>
      </div>

      <div className="w-full h-[3px] xs:h-[4px] bg-black/20 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-amber-600 to-amber-400"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-[7px] xs:text-[9px] text-amber-600/30 text-right mt-0.5 font-medium">{score} / 40</div>
    </div>
  );
}
