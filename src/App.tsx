import { useState, useCallback } from 'react';
import GameMenu from './components/GameMenu';
import Game from './components/Game';
import OnlineLobby from './components/OnlineLobby';
import OnlineGame from './components/OnlineGame';
import RulesModal from './components/RulesModal';
import { GameConfig } from './game/types';

type Screen = 'menu' | 'game' | 'online-lobby' | 'online-game';

interface OnlineGameInfo {
  myName: string;
  opponentName: string;
  isHost: boolean;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [showMenuRules, setShowMenuRules] = useState(false);
  const [config, setConfig] = useState<GameConfig>({
    mode: 'pve',
    difficulty: 'medium',
    southName: 'Joueur 1',
    northName: 'IA (Moyen)',
  });
  const [gameKey, setGameKey] = useState(0);
  const [onlinePlayerName, setOnlinePlayerName] = useState('');
  const [onlineInfo, setOnlineInfo] = useState<OnlineGameInfo | null>(null);

  const handleStartGame = useCallback((newConfig: GameConfig) => {
    setConfig(newConfig);
    setGameKey(k => k + 1);
    setScreen('game');
  }, []);

  const handleBackToMenu = useCallback(() => {
    setScreen('menu');
  }, []);

  const handleStartOnline = useCallback((playerName: string) => {
    setOnlinePlayerName(playerName);
    setScreen('online-lobby');
  }, []);

  const handleOnlineGameStart = useCallback((opponentName: string, isHost: boolean) => {
    setOnlineInfo({
      myName: onlinePlayerName,
      opponentName,
      isHost,
    });
    setScreen('online-game');
  }, [onlinePlayerName]);

  const handleLeaveOnline = useCallback(() => {
    setOnlineInfo(null);
    setScreen('menu');
  }, []);

  if (screen === 'game') {
    return (
      <Game
        key={gameKey}
        mode={config.mode}
        difficulty={config.difficulty}
        southName={config.southName}
        northName={config.northName}
        onBackToMenu={handleBackToMenu}
      />
    );
  }

  if (screen === 'online-lobby') {
    return (
      <OnlineLobby
        playerName={onlinePlayerName}
        onGameStart={handleOnlineGameStart}
        onBack={handleBackToMenu}
      />
    );
  }

  if (screen === 'online-game' && onlineInfo) {
    return (
      <OnlineGame
        myName={onlineInfo.myName}
        opponentName={onlineInfo.opponentName}
        isHost={onlineInfo.isHost}
        onLeave={handleLeaveOnline}
      />
    );
  }

  return (
    <>
      <GameMenu
        onStartGame={handleStartGame}
        onShowRules={() => setShowMenuRules(true)}
        onStartOnline={handleStartOnline}
      />
      <RulesModal isOpen={showMenuRules} onClose={() => setShowMenuRules(false)} />
    </>
  );
}
