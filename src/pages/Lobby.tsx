import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AvatarDisplay } from '../components/ui/AvatarDisplay';
import { supabase } from '../lib/supabase';
import { useGameStore } from '../lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Users, Share2 } from 'lucide-react';

export const Lobby: React.FC = () => {
    const navigate = useNavigate();
    const { gameId, gameCode, playerId, players, setPlayers, setStatus } = useGameStore();
    const currentPlayer = players.find(p => p.id === playerId);
    const isHost = currentPlayer?.is_host;

    useEffect(() => {
        if (!gameId) {
            navigate('/');
            return;
        }

        // Subscribe to players changes
        const playersSubscription = supabase
            .channel('players')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'players',
                filter: `game_id=eq.${gameId}`
            }, () => {
                fetchPlayers();
            })
            .subscribe();

        // Subscribe to game status changes
        const gameSubscription = supabase
            .channel('game_status')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'games',
                filter: `id=eq.${gameId}`
            }, (payload) => {
                if (payload.new.status === 'writing_truths') {
                    setStatus('writing_truths');
                    navigate('/write-truth');
                }
            })
            .subscribe();

        fetchPlayers();

        return () => {
            supabase.removeChannel(playersSubscription);
            supabase.removeChannel(gameSubscription);
        };
    }, [gameId, navigate, setStatus]);

    const fetchPlayers = async () => {
        const { data } = await supabase
            .from('players')
            .select('*')
            .eq('game_id', gameId);

        if (data) {
            setPlayers(data);
        }
    };

    const startGame = async () => {
        if (!isHost) return;

        await supabase
            .from('games')
            .update({ status: 'writing_truths' })
            .eq('id', gameId);
    };

    const copyCode = () => {
        if (gameCode) {
            navigator.clipboard.writeText(gameCode);
        }
    };

    const shareLink = () => {
        const gameUrl = `${window.location.origin}/?code=${gameCode}`;
        navigator.clipboard.writeText(gameUrl);
        alert('קישור למשחק הועתק! שתפו אותו עם חברים.');
    };

    return (
        <div className="flex flex-col min-h-[80vh] space-y-8">
            <Card className="text-center space-y-4 bg-primary/10 border-primary/20">
                <p className="text-sm text-white/60 uppercase tracking-wider font-bold">קוד המשחק</p>
                <div
                    onClick={copyCode}
                    className="text-5xl font-mono font-black tracking-widest cursor-pointer hover:scale-105 transition-transform flex items-center justify-center gap-4"
                >
                    {gameCode}
                    <Copy className="w-6 h-6 opacity-50" />
                </div>
                <Button
                    onClick={shareLink}
                    variant="secondary"
                    className="w-full flex items-center justify-center gap-2"
                >
                    <Share2 className="w-4 h-4" />
                    שתפו קישור ישיר
                </Button>
            </Card>

            <div className="flex-1">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        משתתפים ({players.length})
                    </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <AnimatePresence>
                        {players.map((player) => (
                            <motion.div
                                key={player.id}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="bg-white/5 rounded-xl p-4 flex flex-col items-center gap-2 border border-white/5"
                            >
                                <AvatarDisplay seed={player.avatar_seed} size="md" />
                                <span className="font-bold truncate w-full text-center">
                                    {player.name}
                                    {player.is_host && <span className="text-xs text-yellow-400 block">👑 מנהל</span>}
                                </span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {isHost ? (
                <Button
                    onClick={startGame}
                    className="w-full text-lg py-6 shadow-xl shadow-primary/20 animate-pulse"
                    disabled={players.length < 2}
                >
                    {players.length < 2 ? 'ממתין לעוד שחקנים...' : 'התחל משחק!'}
                </Button>
            ) : (
                <div className="text-center text-white/60 animate-pulse">
                    ממתין למנהל המשחק שיתחיל...
                </div>
            )}
        </div>
    );
};
