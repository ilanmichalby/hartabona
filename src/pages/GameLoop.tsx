import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useGameStore } from '../lib/store';
import { Fabrication } from '../components/game/Fabrication';
import { Voting } from '../components/game/Voting';
import { Reveal } from '../components/game/Reveal';
import { motion, AnimatePresence } from 'framer-motion';

export const GameLoop: React.FC = () => {
    const navigate = useNavigate();
    const { gameId, currentRoundIndex, setStatus, setCurrentRoundIndex } = useGameStore();
    const [currentRound, setCurrentRound] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!gameId) {
            navigate('/');
            return;
        }

        fetchCurrentRound();

        // Subscribe to game changes (for round index updates)
        const gameSub = supabase
            .channel('game_loop')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'games',
                filter: `id=eq.${gameId}`
            }, (payload) => {
                if (payload.new.status === 'finished') {
                    setStatus('finished');
                    navigate('/results');
                } else if (payload.new.current_round_index !== currentRoundIndex) {
                    setCurrentRoundIndex(payload.new.current_round_index);
                }
            })
            .subscribe();

        // Subscribe to round changes (for status updates)
        const roundSub = supabase
            .channel('round_status')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'rounds',
                filter: `game_id=eq.${gameId}`
            }, () => {
                // Re-fetch the current round when any round updates
                fetchCurrentRound();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(gameSub);
            supabase.removeChannel(roundSub);
        };
    }, [gameId, currentRoundIndex, navigate]);

    const fetchCurrentRound = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('rounds')
            .select('*')
            .eq('game_id', gameId)
            .eq('round_order', currentRoundIndex)
            .single();

        if (data) {
            setCurrentRound(data);
        }
        setLoading(false);
    };

    if (loading || !currentRound) {
        return <div className="flex items-center justify-center min-h-[50vh]">טוען...</div>;
    }

    return (
        <div className="w-full max-w-lg mx-auto">
            <div className="mb-6 flex justify-between items-center text-white/40 text-sm font-mono">
                <span>סיבוב {currentRoundIndex + 1}</span>
                <span>{currentRound.status.toUpperCase()}</span>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={`${currentRound.id}-${currentRound.status}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {currentRound.status === 'fabricating' && (
                        <Fabrication
                            roundId={currentRound.id}
                            subjectId={currentRound.subject_player_id}
                        />
                    )}
                    {currentRound.status === 'voting' && (
                        <Voting
                            roundId={currentRound.id}
                            subjectId={currentRound.subject_player_id}
                        />
                    )}
                    {currentRound.status === 'reveal' && (
                        <Reveal
                            roundId={currentRound.id}
                            subjectId={currentRound.subject_player_id}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
