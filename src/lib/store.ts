import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Player {
    id: string;
    game_id: string;
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
    mode: 'classic' | 'trivia';
    currentRoundIndex: number;
    setGameId: (id: string) => void;
    setGameCode: (code: string) => void;
    setPlayerId: (id: string) => void;
    setPlayers: (players: Player[]) => void;
    setStatus: (status: GameState['status']) => void;
    setMode: (mode: GameState['mode']) => void;
    setCurrentRoundIndex: (index: number) => void;
    reset: () => void;
}

export const useGameStore = create<GameState>()(
    persist(
        (set) => ({
            gameId: null,
            gameCode: null,
            playerId: null,
            players: [],
            status: 'lobby',
            mode: 'classic',
            currentRoundIndex: 0,
            setGameId: (id) => set({ gameId: id }),
            setGameCode: (code) => set({ gameCode: code }),
            setPlayerId: (id) => set({ playerId: id }),
            setPlayers: (players) => set({ players }),
            setStatus: (status) => set({ status }),
            setMode: (mode) => set({ mode }),
            setCurrentRoundIndex: (index) => set({ currentRoundIndex: index }),
            reset: () => set({
                gameId: null,
                gameCode: null,
                playerId: null,
                players: [],
                status: 'lobby',
                mode: 'classic',
                currentRoundIndex: 0
            }),
        }),
        {
            name: 'game-storage',
        }
    )
);
