import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { useGameStore } from '../lib/store';
import { motion } from 'framer-motion';

export const WriteTruth: React.FC = () => {
    const navigate = useNavigate();
    const { gameId, playerId, players, setStatus } = useGameStore();
    const [truth, setTruth] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [waitingCount, setWaitingCount] = useState(0);
    const [allowSkip, setAllowSkip] = useState(true);
    const [hasSkipped, setHasSkipped] = useState(false);

    useEffect(() => {
        if (!gameId || !playerId) {
            navigate('/');
            return;
        }

        // Fetch game settings
        const fetchGameSettings = async () => {
            const { data } = await supabase
                .from('games')
                .select('allow_skip')
                .eq('id', gameId)
                .single();

            if (data) {
                setAllowSkip(data.allow_skip);
            }
        };

        fetchGameSettings();

        // Subscribe to players to check if everyone submitted
        const subscription = supabase
            .channel('players_truth')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'players',
                filter: `game_id=eq.${gameId}`
            }, () => {
                checkAllSubmitted();
            })
            .subscribe();

        checkAllSubmitted();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [gameId, playerId, navigate]);

    const checkAllSubmitted = async () => {
        const { data: currentPlayers } = await supabase
            .from('players')
            .select('true_statement')
            .eq('game_id', gameId);

        if (currentPlayers) {
            const submittedCount = currentPlayers.filter(p => p.true_statement).length;
            setWaitingCount(currentPlayers.length - submittedCount);

            if (submittedCount === currentPlayers.length && currentPlayers.length > 0) {
                // All submitted, host triggers next phase
                const currentPlayer = players.find(p => p.id === playerId);
                if (currentPlayer?.is_host) {
                    await startFirstRound();
                }
            }
        }
    };

    const startFirstRound = async () => {
        // Get all players with their statements
        const { data: allPlayers } = await supabase
            .from('players')
            .select('*')
            .eq('game_id', gameId);

        if (!allPlayers) return;

        // Filter out players who skipped (true_statement === 'SKIP')
        const playingPlayers = allPlayers.filter(p => p.true_statement && p.true_statement !== 'SKIP');

        // If no one is playing, go straight to results
        if (playingPlayers.length === 0) {
            await supabase
                .from('games')
                .update({ status: 'finished' })
                .eq('id', gameId);
            return;
        }

        // Create rounds only for players who didn't skip
        const roundsData = playingPlayers.map((player, index) => ({
            game_id: gameId,
            subject_player_id: player.id,
            round_order: index,
            status: 'fabricating'
        }));

        // Insert rounds
        const { error } = await supabase
            .from('rounds')
            .insert(roundsData)
            .select();

        if (error) {
            console.error('Error creating rounds:', error);
            return;
        }

        // Update game status
        await supabase
            .from('games')
            .update({ status: 'playing', current_round_index: 0 })
            .eq('id', gameId);
    };

    // Listen for game status change to 'playing'
    useEffect(() => {
        if (!gameId) return;

        const subscription = supabase
            .channel('game_start')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'games',
                filter: `id=eq.${gameId}`
            }, (payload) => {
                if (payload.new.status === 'playing') {
                    setStatus('playing');
                    navigate('/game');
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [gameId, navigate, setStatus]);

    const submitTruth = async () => {
        if (!truth.trim()) return;

        try {
            const { error } = await supabase
                .from('players')
                .update({ true_statement: truth })
                .eq('id', playerId);

            if (error) throw error;
            setIsSubmitted(true);
        } catch (error) {
            console.error('Error submitting truth:', error);
            alert('Failed to submit. Please try again.');
        }
    };

    const skipTurn = async () => {
        try {
            const { error } = await supabase
                .from('players')
                .update({ true_statement: 'SKIP' })
                .eq('id', playerId);

            if (error) throw error;
            setHasSkipped(true);
            setIsSubmitted(true);
        } catch (error) {
            console.error('Error skipping turn:', error);
            alert('Failed to skip. Please try again.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8">
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center space-y-2"
            >
                <h2 className="text-3xl font-bold text-white">זה הזמן לאמת!</h2>
                <p className="text-white/60">כתוב משפט אמת אחד על עצמך.</p>
                <p className="text-white/40 text-sm">זה צריך להיות משהו מפתיע או מצחיק.</p>
            </motion.div>

            <Card className="w-full space-y-6">
                {!isSubmitted ? (
                    <>
                        <textarea
                            value={truth}
                            onChange={(e) => setTruth(e.target.value)}
                            placeholder="למשל: כשהייתי ילד זכיתי בתחרות אכילת פלאפל..."
                            className="w-full h-32 rounded-xl border-2 border-white/10 bg-white/5 p-4 text-lg text-white placeholder:text-white/40 focus:border-primary focus:outline-none resize-none"
                            maxLength={100}
                        />
                        <div className="space-y-3">
                            <Button
                                onClick={submitTruth}
                                disabled={!truth.trim()}
                                className="w-full text-lg"
                            >
                                שלח אמת
                            </Button>
                            {allowSkip && (
                                <Button
                                    onClick={skipTurn}
                                    variant="secondary"
                                    className="w-full text-lg"
                                >
                                    דלג על התור שלי
                                </Button>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8 space-y-4">
                        <div className="text-4xl">{hasSkipped ? '⏭️' : '🤫'}</div>
                        <h3 className="text-xl font-bold">
                            {hasSkipped ? 'דילגת על התור!' : 'האמת שלך נשמרה!'}
                        </h3>
                        <p className="text-white/60">
                            ממתין ל-{waitingCount} שחקנים נוספים...
                        </p>
                    </div>
                )}
            </Card>
        </div>
    );
};
