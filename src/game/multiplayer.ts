import Peer, { DataConnection } from 'peerjs';
import { GameState } from './types';

export type MultiplayerRole = 'host' | 'guest' | null;

export interface MultiplayerState {
  status: 'idle' | 'creating' | 'waiting' | 'joining' | 'connected' | 'error';
  role: MultiplayerRole;
  roomCode: string | null;
  error: string | null;
  opponentName: string | null;
}

export type GameMessage =
  | { type: 'join'; name: string }
  | { type: 'welcome'; name: string }
  | { type: 'move'; pit: number }
  | { type: 'state'; gameState: GameState }
  | { type: 'restart' }
  | { type: 'leave' };

type Listener = (state: MultiplayerState, msg?: GameMessage) => void;

const PREFIX = 'songo-game-';

function makeCode(): string {
  const c = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let r = '';
  for (let i = 0; i < 5; i++) r += c[Math.floor(Math.random() * c.length)];
  return r;
}

class Multiplayer {
  private peer: Peer | null = null;
  private conn: DataConnection | null = null;
  private listener: Listener | null = null;
  public state: MultiplayerState = {
    status: 'idle', role: null, roomCode: null, error: null, opponentName: null,
  };
  public myName = '';

  subscribe(fn: Listener) {
    this.listener = fn;
  }

  private emit(msg?: GameMessage) {
    this.listener?.(this.state, msg);
  }

  private set(updates: Partial<MultiplayerState>, msg?: GameMessage) {
    this.state = { ...this.state, ...updates };
    this.emit(msg);
  }

  send(msg: GameMessage) {
    if (this.conn?.open) this.conn.send(msg);
  }

  private wire(conn: DataConnection) {
    this.conn = conn;
    conn.on('data', (raw) => {
      const msg = raw as GameMessage;
      if (msg.type === 'join') {
        this.set({ status: 'connected', opponentName: msg.name }, msg);
      } else if (msg.type === 'welcome') {
        this.set({ status: 'connected', opponentName: msg.name }, msg);
      } else if (msg.type === 'leave') {
        this.set({ status: 'error', error: 'L\'adversaire a quitte la partie.' }, msg);
      } else {
        this.emit(msg);
      }
    });
    conn.on('close', () => {
      if (this.state.status === 'connected') {
        this.set({ status: 'error', error: 'Connexion perdue.' });
      }
    });
    conn.on('error', () => {
      this.set({ status: 'error', error: 'Erreur de connexion.' });
    });
  }

  createRoom(name: string) {
    this.cleanup();
    this.myName = name;
    const code = makeCode();
    this.set({ status: 'creating', role: 'host', roomCode: code, error: null });

    const peer = new Peer(PREFIX + code);
    this.peer = peer;

    const timeout = setTimeout(() => {
      if (this.state.status === 'creating') {
        this.set({ status: 'error', error: 'Le serveur ne repond pas. Reessayez.' });
        peer.destroy();
      }
    }, 12000);

    peer.on('open', () => {
      clearTimeout(timeout);
      this.set({ status: 'waiting' });
    });

    peer.on('connection', (conn) => {
      conn.on('open', () => {
        this.wire(conn);
      });
    });

    peer.on('error', (err) => {
      clearTimeout(timeout);
      if (err.type === 'unavailable-id') {
        // Code deja pris, on reessaie
        peer.destroy();
        this.createRoom(name);
      } else {
        this.set({ status: 'error', error: 'Impossible de creer la partie.' });
      }
    });
  }

  joinRoom(code: string, name: string) {
    this.cleanup();
    this.myName = name;
    this.set({ status: 'joining', role: 'guest', roomCode: code.toUpperCase(), error: null });

    const peer = new Peer(PREFIX + 'g-' + Date.now().toString(36));
    this.peer = peer;

    const timeout = setTimeout(() => {
      if (this.state.status === 'joining') {
        this.set({ status: 'error', error: 'Connexion impossible. Verifiez le code.' });
        peer.destroy();
      }
    }, 12000);

    peer.on('open', () => {
      const conn = peer.connect(PREFIX + code.toUpperCase(), { reliable: true });

      conn.on('open', () => {
        clearTimeout(timeout);
        this.wire(conn);
        this.send({ type: 'join', name });
      });

      conn.on('error', () => {
        clearTimeout(timeout);
        this.set({ status: 'error', error: 'Impossible de rejoindre cette partie.' });
      });
    });

    peer.on('error', (err) => {
      clearTimeout(timeout);
      if (err.type === 'peer-unavailable') {
        this.set({ status: 'error', error: 'Partie introuvable. Verifiez le code.' });
      } else {
        this.set({ status: 'error', error: 'Erreur de connexion.' });
      }
    });
  }

  cleanup() {
    if (this.conn?.open) this.send({ type: 'leave' });
    try { this.conn?.close(); } catch (_e) { /* ignore */ }
    try { this.peer?.destroy(); } catch (_e) { /* ignore */ }
    this.peer = null;
    this.conn = null;
  }

  reset() {
    this.cleanup();
    this.state = { status: 'idle', role: null, roomCode: null, error: null, opponentName: null };
    this.emit();
  }
}

export const mp = new Multiplayer();
