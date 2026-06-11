import { GameState } from '../game/types';

interface Props {
  state: GameState;
  topName: string;
  bottomName: string;
  onRestart: () => void;
  onMenu: () => void;
}

export default function GameOverlay({ state, topName, bottomName, onRestart, onMenu }: Props) {
  if (!state.gameOver) return null;

  const isDraw = state.winner === 'draw';
  const winnerName = state.winner === 'south' ? bottomName : state.winner === 'north' ? topName : '';

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div className="relative rounded-2xl border border-amber-700/20 p-6 sm:p-8 max-w-sm w-full shadow-2xl animate-pop"
        style={{ background: 'linear-gradient(180deg, #3A2610 0%, #2A180A 100%)' }}
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg border border-amber-500/15">
            {isDraw ? (
              <svg className="w-8 h-8 text-amber-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-amber-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-2.52.952m0 0a6.003 6.003 0 01-2.52-.952" />
              </svg>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-amber-200 mb-1" style={{ fontFamily: 'Cinzel, Georgia, serif' }}>
            {isDraw ? 'Match Nul' : 'Victoire !'}
          </h2>

          {!isDraw && (
            <p className="text-amber-300/70 text-sm font-medium">{winnerName}</p>
          )}

          <div className="flex justify-center items-center gap-5 my-5 py-3 px-4 bg-black/20 rounded-xl border border-amber-800/10">
            <div className="text-center">
              <div className="text-2xl font-extrabold font-mono text-amber-300">{state.scores.north}</div>
              <div className="text-[10px] text-amber-500/40 font-medium mt-0.5">{topName}</div>
            </div>
            <div className="text-amber-700/30 font-bold text-lg">-</div>
            <div className="text-center">
              <div className="text-2xl font-extrabold font-mono text-amber-300">{state.scores.south}</div>
              <div className="text-[10px] text-amber-500/40 font-medium mt-0.5">{bottomName}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onRestart}
              className="flex-1 py-2.5 bg-gradient-to-b from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-amber-100 font-semibold text-sm rounded-xl transition-all shadow-sm active:scale-[0.97]"
            >
              Rejouer
            </button>
            <button
              onClick={onMenu}
              className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-amber-300/60 font-semibold text-sm rounded-xl transition-all active:scale-[0.97] border border-amber-800/10"
            >
              Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
