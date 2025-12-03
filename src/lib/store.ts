import { create } from 'zustand';
import { supabase } from './supabase';

interface Player {
    id: string;
    name: string;
    avatar_seed: string;
    score: number;
    is_host: boolean;
    true_statement?: string;
}

interface GameState {
    gameId: string | null;
    gameCode: string | null;
    playerId: string | null;
    players: Player[];
    status: 'lobby' | 'writing_truths' | 'playing' | 'finished';
    currentRoundIndex: number;
    setGameId: (id: string) => void;
    setGameCode: (code: string) => void;
    setPlayerId: (id: string) => void;
    setPlayers: (players: Player[]) => void;
    setStatus: (status: GameState['status']) => void;
    setCurrentRoundIndex: (index: number) => void;
    reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
    gameId: null,
    gameCode: null,
    playerId: null,
    players: [],
    status: 'lobby',
    currentRoundIndex: 0,
    setGameId: (id) => set({ gameId: id }),
    setGameCode: (code) => set({ gameCode: code }),
    setPlayerId: (id) => set({ playerId: id }),
    setPlayers: (players) => set({ players }),
    setStatus: (status) => set({ status }),
    setCurrentRoundIndex: (index) => set({ currentRoundIndex: index }),
    reset: () => set({
        gameId: null,
        gameCode: null,
        playerId: null,
        players: [],
        status: 'lobby',
        currentRoundIndex: 0
    }),
}));
