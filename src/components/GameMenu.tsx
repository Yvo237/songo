import { useState } from 'react';
import { GameMode, Difficulty, GameConfig } from '../game/types';

interface Props {
  onStartGame: (config: GameConfig) => void;
  onShowRules: () => void;
  onStartOnline: (playerName: string) => void;
}

const DIFF_LABELS: Record<Difficulty, string> = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
};

export default function GameMenu({ onStartGame, onShowRules, onStartOnline }: Props) {
  const [mode, setMode] = useState<GameMode>('pve');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [player1, setPlayer1] = useState('Joueur 1');
  const [player2, setPlayer2] = useState('');

  const handleStart = () => {
    onStartGame({
      mode,
      difficulty,
      southName: player1 || 'Joueur 1',
      northName: mode === 'pve' ? `IA (${DIFF_LABELS[difficulty]})` : (player2 || 'Joueur 2'),
    });
  };

  const handleOnline = () => {
    onStartOnline(player1 || 'Joueur 1');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" style={{ background: '#2A180A' }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "url('/images/wood-bg.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      <div className="relative z-10 w-full max-w-[400px] animate-fade-up px-0">
        {/* Title */}
        <div className="text-center mb-6 xs:mb-8">
          <h1 className="text-4xl xs:text-5xl sm:text-6xl font-black text-amber-200/90 tracking-tight drop-shadow-lg leading-tight" style={{ fontFamily: 'Cinzel, Georgia, serif' }}>
            SONGO
          </h1>
          <p className="text-amber-400/50 text-[11px] xs:text-sm mt-0.5 xs:mt-1">Jeu de Semailles Africain</p>
        </div>

        {/* Card */}
        <div className="bg-black/35 backdrop-blur-md rounded-2xl border border-amber-700/15 p-4 xs:p-5 space-y-4 xs:space-y-5 shadow-2xl">

          <fieldset>
            <legend className="text-amber-400/50 text-[9px] xs:text-[10px] font-bold uppercase tracking-widest mb-1.5 xs:mb-2">Mode de jeu</legend>
            <div className="grid grid-cols-2 gap-1.5 xs:gap-2">
              <TabBtn active={mode === 'pve'} onClick={() => setMode('pve')}>
                <svg className="w-3.5 h-3.5 xs:w-4 xs:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25z" />
                </svg>
                Contre l'IA
              </TabBtn>
              <TabBtn active={mode === 'pvp'} onClick={() => setMode('pvp')}>
                <svg className="w-3.5 h-3.5 xs:w-4 xs:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                2 Joueurs
              </TabBtn>
            </div>
          </fieldset>

          {mode === 'pve' && (
            <fieldset>
              <legend className="text-amber-400/50 text-[9px] xs:text-[10px] font-bold uppercase tracking-widest mb-1.5 xs:mb-2">Difficulte</legend>
              <div className="grid grid-cols-3 gap-1.5">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`py-2 rounded-lg text-[11px] xs:text-xs font-semibold transition-all border ${
                      difficulty === d
                        ? 'bg-amber-700/50 text-amber-100 border-amber-500/30'
                        : 'bg-white/5 text-amber-300/40 border-amber-800/10 hover:text-amber-200/60 hover:bg-white/8'
                    }`}
                  >
                    {DIFF_LABELS[d]}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div className="space-y-2 xs:space-y-2.5">
            <Field label="Votre nom" value={player1} onChange={setPlayer1} placeholder="Joueur 1" />
            {mode === 'pvp' && (
              <Field label="Adversaire" value={player2} onChange={setPlayer2} placeholder="Joueur 2" />
            )}
          </div>

          <button
            onClick={handleStart}
            className="w-full py-2.5 xs:py-3 bg-gradient-to-b from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-amber-100 font-bold text-xs xs:text-sm rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] border border-amber-600/20"
          >
            Jouer
          </button>

          {/* Online play button */}
          <button
            onClick={handleOnline}
            className="w-full py-2.5 xs:py-3 bg-gradient-to-b from-emerald-700 to-emerald-800 hover:from-emerald-600 hover:to-emerald-700 text-emerald-100 font-bold text-xs xs:text-sm rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] border border-emerald-600/20 flex items-center justify-center gap-2"
          >
            <svg className="w-3.5 h-3.5 xs:w-4 xs:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            Jouer en ligne
          </button>

          <button
            onClick={onShowRules}
            className="w-full py-2 xs:py-2.5 text-amber-400/40 hover:text-amber-300/60 text-[11px] xs:text-xs font-semibold rounded-xl bg-white/5 hover:bg-white/8 transition-all border border-amber-800/10"
          >
            Consulter les regles
          </button>
        </div>

        <p className="text-center mt-4 xs:mt-5 text-amber-600/25 text-[9px] xs:text-[10px]">
          Tradition des peuples Ekang
        </p>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
        active
          ? 'bg-amber-700/50 text-amber-100 border-amber-500/30'
          : 'bg-white/5 text-amber-300/40 border-amber-800/10 hover:text-amber-200/60'
      }`}
    >
      {children}
    </button>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="text-amber-400/40 text-[10px] font-semibold uppercase tracking-wider mb-1 block">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-black/20 border border-amber-800/15 rounded-lg px-3 py-2 text-amber-100 placeholder-amber-700/30 text-sm focus:outline-none focus:border-amber-600/30 focus:ring-1 focus:ring-amber-600/15 transition-colors"
      />
    </div>
  );
}
