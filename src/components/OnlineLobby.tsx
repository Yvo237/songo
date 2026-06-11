import { useState, useEffect, useCallback, useRef } from 'react';
import { mp, MultiplayerState, GameMessage } from '../game/multiplayer';

interface Props {
  playerName: string;
  onGameStart: (opponentName: string, isHost: boolean) => void;
  onBack: () => void;
}

type Tab = 'create' | 'join';

export default function OnlineLobby({ playerName, onGameStart, onBack }: Props) {
  const [tab, setTab] = useState<Tab>('create');
  const [joinCode, setJoinCode] = useState('');
  const [status, setStatus] = useState<MultiplayerState>(mp.state);
  const [copied, setCopied] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    mp.subscribe((st: MultiplayerState, msg?: GameMessage) => {
      setStatus({ ...st });

      // Opponent connected
      if (startedRef.current) return;
      if (msg?.type === 'join' && st.role === 'host' && st.status === 'connected') {
        startedRef.current = true;
        // Small delay to let state settle
        setTimeout(() => onGameStart(msg.name, true), 100);
      }
      if (msg?.type === 'welcome' && st.role === 'guest' && st.status === 'connected') {
        startedRef.current = true;
        setTimeout(() => onGameStart(msg.name, false), 100);
      }
    });

    return () => {
      mp.subscribe(() => {});
      // If we leave lobby before connected, clean up
      if (mp.state.status !== 'connected') {
        mp.reset();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = useCallback(() => {
    mp.createRoom(playerName);
  }, [playerName]);

  const handleJoin = useCallback(() => {
    if (joinCode.length < 4) return;
    mp.joinRoom(joinCode, playerName);
  }, [joinCode, playerName]);

  const handleCopyCode = useCallback(() => {
    if (status.roomCode) {
      navigator.clipboard.writeText(status.roomCode).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [status.roomCode]);

  const handleCancel = useCallback(() => {
    mp.reset();
    setJoinCode('');
    setStatus(mp.state);
  }, []);

  const handleBack = useCallback(() => {
    mp.reset();
    onBack();
  }, [onBack]);

  const loading = status.status === 'creating' || status.status === 'joining';
  const waiting = status.status === 'waiting';
  const error = status.status === 'error';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative" style={{ background: '#2A180A' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "url('/images/wood-bg.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      <div className="relative z-10 w-full max-w-[400px] px-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 xs:mb-6">
          <button onClick={handleBack}
            className="flex items-center gap-1 px-2 xs:px-2.5 py-1 xs:py-1.5 rounded-lg text-amber-400/60 hover:text-amber-300 text-[10px] xs:text-xs font-medium transition-colors hover:bg-white/5">
            <svg className="w-3.5 h-3.5 xs:w-4 xs:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </button>
          <h1 className="text-base xs:text-lg font-bold text-amber-300/80" style={{ fontFamily: 'Cinzel, Georgia, serif' }}>
            Partie en ligne
          </h1>
          <div className="w-12 xs:w-16" />
        </div>

        {/* Player name */}
        <div className="text-center mb-3 xs:mb-4">
          <span className="text-amber-400/50 text-[10px] xs:text-xs">Vous jouez en tant que</span>
          <div className="text-amber-200 font-semibold text-sm xs:text-base">{playerName}</div>
        </div>

        {/* Card */}
        <div className="bg-black/35 backdrop-blur-md rounded-2xl border border-amber-700/15 overflow-hidden">

          {/* Tabs (only if idle) */}
          {status.status === 'idle' && (
            <div className="flex border-b border-amber-800/15">
              <button onClick={() => setTab('create')}
                className={`flex-1 py-2.5 xs:py-3 text-xs xs:text-sm font-semibold transition-all ${
                  tab === 'create' ? 'text-amber-200 bg-amber-800/20 border-b-2 border-amber-500' : 'text-amber-400/40 hover:text-amber-300/60'
                }`}>
                Creer
              </button>
              <button onClick={() => setTab('join')}
                className={`flex-1 py-2.5 xs:py-3 text-xs xs:text-sm font-semibold transition-all ${
                  tab === 'join' ? 'text-amber-200 bg-amber-800/20 border-b-2 border-amber-500' : 'text-amber-400/40 hover:text-amber-300/60'
                }`}>
                Rejoindre
              </button>
            </div>
          )}

          <div className="p-4 xs:p-5">

            {/* IDLE - Create */}
            {status.status === 'idle' && tab === 'create' && (
              <div className="text-center">
                <svg className="w-10 h-10 xs:w-12 xs:h-12 mx-auto mb-3 xs:mb-4 text-amber-500/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <p className="text-amber-300/60 text-xs xs:text-sm mb-4 xs:mb-5">Creez une partie et partagez le code avec votre ami.</p>
                <button onClick={handleCreate}
                  className="w-full py-2.5 xs:py-3 bg-gradient-to-b from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-amber-100 font-bold text-xs xs:text-sm rounded-xl transition-all active:scale-[0.98]">
                  Creer une partie
                </button>
              </div>
            )}

            {/* IDLE - Join */}
            {status.status === 'idle' && tab === 'join' && (
              <div className="text-center">
                <svg className="w-10 h-10 xs:w-12 xs:h-12 mx-auto mb-3 xs:mb-4 text-amber-500/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                <p className="text-amber-300/60 text-xs xs:text-sm mb-3 xs:mb-4">Entrez le code de la partie.</p>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))}
                  placeholder="CODE"
                  className="w-full text-center text-xl xs:text-2xl font-mono font-bold tracking-[0.3em] bg-black/20 border border-amber-800/20 rounded-xl px-3 xs:px-4 py-2.5 xs:py-3 text-amber-200 placeholder-amber-700/30 focus:outline-none focus:border-amber-600/30 mb-3 xs:mb-4 uppercase"
                  maxLength={5}
                  autoFocus
                />
                <button onClick={handleJoin} disabled={joinCode.length < 5}
                  className="w-full py-2.5 xs:py-3 bg-gradient-to-b from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-amber-100 font-bold text-xs xs:text-sm rounded-xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed">
                  Rejoindre
                </button>
              </div>
            )}

            {/* CREATING / JOINING */}
            {loading && (
              <div className="text-center py-4 xs:py-6">
                <div className="w-8 h-8 xs:w-10 xs:h-10 mx-auto mb-3 xs:mb-4 border-[3px] border-amber-700/30 border-t-amber-400 rounded-full animate-spin" />
                <p className="text-amber-300/60 text-xs xs:text-sm">
                  {status.status === 'creating' ? 'Creation en cours...' : 'Connexion en cours...'}
                </p>
              </div>
            )}

            {/* WAITING for opponent */}
            {waiting && status.roomCode && (
              <div className="text-center">
                <p className="text-amber-300/60 text-xs xs:text-sm mb-2 xs:mb-3">Partagez ce code avec votre ami :</p>

                <button onClick={handleCopyCode}
                  className="relative w-full bg-black/30 rounded-xl px-4 xs:px-6 py-4 xs:py-5 mb-2 hover:bg-black/40 transition-colors group text-left">
                  <div className="text-center text-2xl xs:text-3xl font-mono font-bold tracking-[0.3em] xs:tracking-[0.5em] text-amber-200 break-all">
                    {status.roomCode}
                  </div>
                  <div className="absolute right-2 xs:right-3 top-1/2 -translate-y-1/2 text-amber-500/30 group-hover:text-amber-400/60 transition-colors">
                    {copied ? (
                      <svg className="w-4 h-4 xs:w-5 xs:h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 xs:w-5 xs:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                      </svg>
                    )}
                  </div>
                </button>

                <p className="text-amber-600/30 text-[9px] xs:text-[10px] mb-4 xs:mb-5">
                  {copied ? 'Code copie !' : 'Cliquez pour copier le code'}
                </p>

                <div className="flex items-center justify-center gap-2 text-amber-400/50 text-xs xs:text-sm mb-4 xs:mb-5">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                  En attente de l'adversaire...
                </div>

                <button onClick={handleCancel}
                  className="text-amber-500/40 hover:text-amber-400/60 text-[11px] xs:text-xs underline transition-colors">
                  Annuler
                </button>
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div className="text-center py-2">
                <svg className="w-10 h-10 xs:w-12 xs:h-12 mx-auto mb-3 xs:mb-4 text-red-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-red-300/70 text-xs xs:text-sm mb-4 xs:mb-5">{status.error}</p>
                <button onClick={handleCancel}
                  className="w-full py-2.5 xs:py-3 bg-white/5 hover:bg-white/10 text-amber-300/60 font-semibold text-xs xs:text-sm rounded-xl transition-all border border-amber-800/10">
                  Reessayer
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
