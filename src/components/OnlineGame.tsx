import { useState, useCallback, useEffect } from 'react';
import Board from './Board';
import ScorePanel from './ScorePanel';
import RulesModal from './RulesModal';
import GameOverlay from './GameOverlay';
import { GameState, Player } from '../game/types';
import { createInitialState, makeMove, isValidMove, getValidMoves } from '../game/engine';
import { mp, MultiplayerState, GameMessage } from '../game/multiplayer';

interface Props {
  myName: string;
  opponentName: string;
  isHost: boolean;
  onLeave: () => void;
}

function resolveMsg(raw: string, names: Record<string, string>): string {
  if (!raw) return `${names.south}, c'est a vous de jouer.`;
  if (raw.startsWith('capture:')) {
    const p = raw.split(':');
    return `${names[p[1]]} capture ${p[2]} graine(s) !`;
  }
  if (raw.startsWith('turn:')) return `${names[raw.split(':')[1]]}, c'est a vous.`;
  if (raw.startsWith('win:')) return `${names[raw.split(':')[1]]} remporte la partie !`;
  if (raw === 'end:draw') return 'Match nul !';
  if (raw.startsWith('interdit:')) {
    const p = raw.split(':');
    return `${names[p[1]]} : case 7 interdite.`;
  }
  return raw;
}

export default function OnlineGame({ myName, opponentName, isHost, onLeave }: Props) {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [showRules, setShowRules] = useState(false);
  const [lost, setLost] = useState(false);

  const myRole: Player = isHost ? 'south' : 'north';
  const bottomName = isHost ? myName : opponentName;
  const topName = isHost ? opponentName : myName;
  const names: Record<string, string> = { south: bottomName, north: topName };
  const isMyTurn = gameState.currentPlayer === myRole && !gameState.gameOver;

  useEffect(() => {
    mp.subscribe((st: MultiplayerState, msg?: GameMessage) => {
      if (st.status === 'error') {
        setLost(true);
        return;
      }
      if (!msg) return;

      if (msg.type === 'move') {
        setGameState(prev => makeMove(prev, msg.pit));
      } else if (msg.type === 'restart') {
        setGameState(createInitialState());
      } else if (msg.type === 'leave') {
        setLost(true);
      }
    });

    // Host sends welcome to guest
    if (isHost) {
      mp.send({ type: 'welcome', name: myName });
    }

    return () => { mp.subscribe(() => {}); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMove = useCallback((pit: number) => {
    if (!isMyTurn || gameState.gameOver) return;
    if (!isValidMove(gameState, pit)) return;
    const next = makeMove(gameState, pit);
    setGameState(next);
    mp.send({ type: 'move', pit });
  }, [gameState, isMyTurn]);

  const handleRestart = useCallback(() => {
    setGameState(createInitialState());
    mp.send({ type: 'restart' });
  }, []);

  const handleLeave = useCallback(() => {
    mp.reset();
    onLeave();
  }, [onLeave]);

  const moveCount = getValidMoves(gameState).length;
  const displayMsg = resolveMsg(gameState.message, names);

  // Connection lost screen
  if (lost) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#2A180A' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "url('/images/wood-bg.jpg')", backgroundSize: 'cover' }} />
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />
        <div className="relative z-10 bg-black/40 backdrop-blur-md rounded-2xl border border-amber-700/15 p-5 xs:p-6 max-w-sm w-full text-center mx-2 xs:mx-0">
          <svg className="w-10 h-10 xs:w-12 xs:h-12 mx-auto mb-3 xs:mb-4 text-red-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <h2 className="text-base xs:text-lg font-bold text-amber-200 mb-1 xs:mb-2">Connexion perdue</h2>
          <p className="text-amber-300/50 text-xs xs:text-sm mb-4 xs:mb-5">La connexion avec l'adversaire a ete interrompue.</p>
          <button onClick={handleLeave}
            className="w-full py-2.5 xs:py-3 bg-gradient-to-b from-amber-700 to-amber-800 text-amber-100 font-bold text-xs xs:text-sm rounded-xl">
            Retour au menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ background: '#3A2610' }}>
      <div className="fixed inset-0 pointer-events-none opacity-30" style={{ backgroundImage: "url('/images/wood-bg.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }} />

      <div className="relative z-10 max-w-2xl mx-auto px-2 xs:px-3 py-2 xs:py-3 sm:py-4 flex flex-col min-h-dvh">
        {/* Header */}
        <header className="flex items-center justify-between mb-2 xs:mb-3 sm:mb-4">
          <button onClick={handleLeave}
            className="flex items-center gap-1 px-2 xs:px-2.5 py-1 xs:py-1.5 rounded-lg text-amber-400/60 hover:text-amber-300 text-[10px] xs:text-xs font-medium transition-colors hover:bg-white/5">
            <svg className="w-3.5 h-3.5 xs:w-4 xs:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Quitter
          </button>
          <div className="text-center">
            <h1 className="text-[11px] xs:text-sm sm:text-base font-bold text-amber-400/70 tracking-widest" style={{ fontFamily: 'Cinzel, Georgia, serif' }}>SONGO</h1>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <span className="w-1 h-1 xs:w-1.5 xs:h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[8px] xs:text-[10px] text-green-400/60">En ligne</span>
            </div>
          </div>
          <button onClick={() => setShowRules(true)}
            className="p-1 xs:p-1.5 rounded-lg text-amber-400/60 hover:text-amber-300 transition-colors hover:bg-white/5" aria-label="Regles">
            <svg className="w-4 h-4 xs:w-5 xs:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </button>
        </header>

        <div className="mb-2 xs:mb-3 sm:mb-4">
          <ScorePanel state={gameState} topName={topName} bottomName={bottomName} flipped={!isHost} />
        </div>

        {/* Status */}
        <div className={`text-center mb-2 xs:mb-3 sm:mb-4 px-3 xs:px-4 py-2 xs:py-2.5 rounded-xl text-[10px] xs:text-xs sm:text-sm font-medium transition-all ${
          gameState.gameOver
            ? 'bg-amber-900/40 text-amber-200 border border-amber-600/30'
            : isMyTurn
              ? 'bg-amber-900/30 text-amber-200 border border-amber-600/20'
              : 'bg-black/20 text-amber-300/60 border border-amber-800/15'
        }`}>
          {isMyTurn && !gameState.gameOver ? (
            <span className="flex items-center justify-center gap-1.5 xs:gap-2">
              <span className="w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full bg-amber-400 animate-pulse" />
              C'est votre tour
            </span>
          ) : gameState.gameOver ? displayMsg : (
            <span className="flex items-center justify-center gap-1.5 xs:gap-2">
              <span className="flex gap-0.5">
                <span className="w-1 h-1 bg-amber-400/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 bg-amber-400/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 bg-amber-400/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              {opponentName} joue...
            </span>
          )}
        </div>

        <div className="mb-2 xs:mb-3 sm:mb-4">
          <Board state={gameState} onMove={handleMove} humanPlayer={myRole} topName={topName} bottomName={bottomName} flipped={!isHost} />
        </div>

        {gameState.gameOver && isHost && (
          <div className="flex justify-center mb-2">
            <button onClick={handleRestart}
              className="flex items-center gap-1.5 px-3 xs:px-4 py-1.5 xs:py-2 rounded-lg text-amber-300 text-[10px] xs:text-xs font-medium bg-amber-800/30 hover:bg-amber-800/50 border border-amber-700/20 transition-all">
              <svg className="w-3 h-3 xs:w-3.5 xs:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              Nouvelle partie
            </button>
          </div>
        )}

        {isMyTurn && !gameState.gameOver && (
          <p className="text-center text-[8px] xs:text-[10px] text-amber-600/40 mb-2 xs:mb-3">
            {moveCount} coup{moveCount !== 1 ? 's' : ''} disponible{moveCount !== 1 ? 's' : ''}
          </p>
        )}

        <div className="flex-1" />
      </div>

      <GameOverlay state={gameState} topName={topName} bottomName={bottomName} onRestart={handleRestart} onMenu={handleLeave} />
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}
