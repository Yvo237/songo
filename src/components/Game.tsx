import { useState, useCallback, useEffect, useRef } from 'react';
import Board from './Board';
import ScorePanel from './ScorePanel';
import RulesModal from './RulesModal';
import GameOverlay from './GameOverlay';
import { GameState, GameMode, Difficulty, Player } from '../game/types';
import { createInitialState, makeMove, isValidMove, getAIMove, getValidMoves } from '../game/engine';

interface Props {
  mode: GameMode;
  difficulty: Difficulty;
  southName: string;
  northName: string;
  onBackToMenu: () => void;
}

function resolveMessage(raw: string, names: Record<string, string>): string {
  if (!raw) return `${names.south}, c'est a vous de jouer.`;

  if (raw.startsWith('capture:')) {
    const parts = raw.split(':');
    const who = names[parts[1]] || parts[1];
    return `${who} capture ${parts[2]} graine(s) !`;
  }
  if (raw.startsWith('turn:')) {
    const who = names[raw.split(':')[1]] || raw.split(':')[1];
    return `${who}, c'est a vous de jouer.`;
  }
  if (raw.startsWith('win:')) {
    const who = names[raw.split(':')[1]] || raw.split(':')[1];
    return `${who} remporte la partie !`;
  }
  if (raw === 'end:draw') return 'Match nul !';
  if (raw.startsWith('interdit:')) {
    const parts = raw.split(':');
    const who = names[parts[1]] || parts[1];
    return `${who} : case 7 interdite, ${parts[2]} graine(s) pour l'adversaire.`;
  }
  return raw;
}

export default function Game({ mode, difficulty, southName, northName, onBackToMenu }: Props) {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [showRules, setShowRules] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [undoStack, setUndoStack] = useState<GameState[]>([]);
  const aiRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const humanPlayer: Player | 'both' = mode === 'pvp' ? 'both' : 'south';
  const names: Record<string, string> = { south: southName, north: northName };

  useEffect(() => {
    if (mode === 'pve' && gameState.currentPlayer === 'north' && !gameState.gameOver) {
      setIsAIThinking(true);
      const snap = gameState;
      aiRef.current = setTimeout(() => {
        const pit = getAIMove(snap, difficulty);
        if (pit >= 0) {
          setUndoStack(prev => [...prev, snap]);
          setGameState(makeMove(snap, pit));
        }
        setIsAIThinking(false);
      }, 450 + Math.random() * 650);
    }
    return () => { if (aiRef.current) clearTimeout(aiRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.currentPlayer, gameState.gameOver, mode, difficulty]);

  const handleMove = useCallback((pit: number) => {
    if (gameState.gameOver || isAIThinking) return;
    if (!isValidMove(gameState, pit)) return;
    setUndoStack(prev => [...prev, gameState]);
    setGameState(makeMove(gameState, pit));
  }, [gameState, isAIThinking]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    if (mode === 'pve' && undoStack.length >= 2) {
      setGameState(undoStack[undoStack.length - 2]);
      setUndoStack(prev => prev.slice(0, -2));
    } else {
      setGameState(undoStack[undoStack.length - 1]);
      setUndoStack(prev => prev.slice(0, -1));
    }
  }, [undoStack, mode]);

  const handleRestart = useCallback(() => {
    setGameState(createInitialState());
    setUndoStack([]);
  }, []);

  const moveCount = getValidMoves(gameState).length;
  const myTurn = !gameState.gameOver && !isAIThinking && (humanPlayer === 'both' || gameState.currentPlayer === humanPlayer);
  const displayMessage = resolveMessage(gameState.message, names);

  return (
    <div className="min-h-screen relative" style={{ background: '#3A2610' }}>
      {/* Full background image */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{ backgroundImage: "url('/images/wood-bg.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      {/* Warm overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(120,80,30,0.15), transparent 70%)' }} />

      <div className="relative z-10 max-w-2xl mx-auto px-3 py-3 sm:py-4 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between mb-4">
          <button
            onClick={onBackToMenu}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-amber-400/60 hover:text-amber-300 text-xs font-medium transition-colors hover:bg-white/5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Menu
          </button>

          <h1 className="text-sm sm:text-base font-bold text-amber-400/70 tracking-widest" style={{ fontFamily: 'Cinzel, Georgia, serif' }}>
            SONGO
          </h1>

          <button
            onClick={() => setShowRules(true)}
            className="p-1.5 rounded-lg text-amber-400/60 hover:text-amber-300 transition-colors hover:bg-white/5"
            aria-label="Regles"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </button>
        </header>

        {/* Scores */}
        <div className="mb-4">
          <ScorePanel state={gameState} topName={northName} bottomName={southName} />
        </div>

        {/* Status */}
        <div className={`text-center mb-4 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
          gameState.gameOver
            ? 'bg-amber-900/40 text-amber-200 border border-amber-600/30'
            : isAIThinking
              ? 'bg-amber-900/20 text-amber-300/80 border border-amber-700/20'
              : 'bg-black/20 text-amber-300/70 border border-amber-800/15'
        }`}>
          {isAIThinking ? (
            <span className="flex items-center justify-center gap-2">
              <span className="flex gap-0.5">
                <span className="w-1 h-1 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              L'adversaire reflechit...
            </span>
          ) : (
            displayMessage
          )}
        </div>

        {/* Board */}
        <div className="mb-4">
          <Board
            state={gameState}
            onMove={handleMove}
            humanPlayer={humanPlayer}
            topName={northName}
            bottomName={southName}
          />
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-2 mb-2">
          <ActionBtn onClick={handleUndo} disabled={undoStack.length === 0 || isAIThinking} label="Annuler">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
          </ActionBtn>
          <ActionBtn onClick={handleRestart} disabled={false} label="Recommencer">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
          </ActionBtn>
        </div>

        {myTurn && (
          <p className="text-center text-[10px] text-amber-600/40 mb-3">
            {moveCount} coup{moveCount !== 1 ? 's' : ''} disponible{moveCount !== 1 ? 's' : ''}
          </p>
        )}

        <div className="flex-1" />
      </div>

      <GameOverlay state={gameState} topName={northName} bottomName={southName} onRestart={handleRestart} onMenu={onBackToMenu} />
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}

function ActionBtn({ onClick, disabled, label, children }: { onClick: () => void; disabled: boolean; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-amber-400/60 hover:text-amber-300 text-xs font-medium transition-all bg-black/15 hover:bg-black/25 border border-amber-800/15 disabled:opacity-25 disabled:cursor-not-allowed active:scale-95"
    >
      {children}
      {label}
    </button>
  );
}
