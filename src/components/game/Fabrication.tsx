import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { supabase } from '../../lib/supabase';
import { useGameStore } from '../../lib/store';
import { motion } from 'framer-motion';

export const Fabrication: React.FC<{ roundId: string; subjectId: string }> = ({ roundId, subjectId }) => {
    const { playerId, players } = useGameStore();
    const [fakeTruth, setFakeTruth] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [waitingCount, setWaitingCount] = useState(0);

    const subject = players.find(p => p.id === subjectId);
    const isSubject = playerId === subjectId;

    useEffect(() => {
        // Subscribe to answers to check progress
        const subscription = supabase
            .channel('round_answers')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'answers',
                filter: `round_id=eq.${roundId}`
            }, () => {
                checkProgress();
            })
            .subscribe();

        checkProgress();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [roundId]);

    const checkProgress = async () => {
        const { count } = await supabase
            .from('answers')
            .select('*', { count: 'exact', head: true })
            .eq('round_id', roundId);

        console.log('[Fabrication] checkProgress:', { count, playersLength: players.length, expectedAnswers: players.length - 1 });

        // Total expected answers = players - 1 (subject doesn't write)
        const expectedAnswers = players.length - 1;
        setWaitingCount(expectedAnswers - (count || 0));

        if (count === expectedAnswers) {
            // Host triggers next phase (voting)
            const currentPlayer = players.find(p => p.id === playerId);
            console.log('[Fabrication] All answers submitted! Is host?', currentPlayer?.is_host);

            if (currentPlayer?.is_host) {
                // First, insert the true statement into answers
                const { data: subjectPlayer } = await supabase
                    .from('players')
                    .select('true_statement')
                    .eq('id', subjectId)
                    .single();

                console.log('[Fabrication] Inserting true statement:', subjectPlayer?.true_statement);

                if (subjectPlayer?.true_statement) {
                    await supabase.from('answers').insert([{
                        round_id: roundId,
                        player_id: subjectId,
                        text: subjectPlayer.true_statement,
                        is_truth: true
                    }]);
                }

                // Then update status
                console.log('[Fabrication] Updating round status to voting...');
                const { error } = await supabase
                    .from('rounds')
                    .update({ status: 'voting' })
                    .eq('id', roundId);

                if (error) {
                    console.error('[Fabrication] Error updating round status:', error);
                } else {
                    console.log('[Fabrication] Round status updated successfully!');
                }
            }
        }
    };

    const submitFake = async () => {
        if (!fakeTruth.trim()) return;

        try {
            const { error } = await supabase
                .from('answers')
                .insert([{
                    round_id: roundId,
                    player_id: playerId,
                    text: fakeTruth,
                    is_truth: false
                }]);

            if (error) throw error;
            setIsSubmitted(true);
        } catch (error) {
            console.error('Error submitting fake:', error);
            alert('Failed to submit. Please try again.');
        }
    };

    if (isSubject) {
        return (
            <div className="text-center space-y-8">
                <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="relative inline-block"
                >
                    <AvatarDisplay seed={subject?.avatar_seed || ''} size="xl" />
                    <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-black font-bold px-3 py-1 rounded-full shadow-lg transform rotate-12">
                        זה אתה!
                    </div>
                </motion.div>

                <Card className="p-8">
                    <h2 className="text-2xl font-bold mb-4">הירגע, כולם עובדים עליך עכשיו...</h2>
                    <p className="text-white/60">
                        החברים שלך מנסים להמציא משפט שיישמע כמוך.<br />
                        {waitingCount > 0 ? `ממתין ל-${waitingCount} שקרנים...` : 'כולם סיימו! מעבר לשלב הבא...'}
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-4">
                <div className="flex flex-col items-center gap-2">
                    <AvatarDisplay seed={subject?.avatar_seed || ''} size="lg" />
                    <h2 className="text-2xl font-bold">תורו של {subject?.name}</h2>
                </div>
                <p className="text-white/80">
                    כתוב משפט שקרי שיישמע כאילו {subject?.name} כתב אותו.
                </p>
            </div>

            <Card>
                {!isSubmitted ? (
                    <div className="space-y-4">
                        <textarea
                            value={fakeTruth}
                            onChange={(e) => setFakeTruth(e.target.value)}
                            placeholder="למשל: הייתי מלך הפלאפל בתל אביב..."
                            className="w-full h-32 rounded-xl border-2 border-white/10 bg-white/5 p-4 text-lg text-white placeholder:text-white/40 focus:border-primary focus:outline-none resize-none"
                            maxLength={100}
                        />
                        <Button
                            onClick={submitFake}
                            disabled={!fakeTruth.trim()}
                            className="w-full text-lg"
                        >
                            שלח חירטוט
                        </Button>
                    </div>
                ) : (
                    <div className="text-center py-8 space-y-4">
                        <div className="text-4xl">😈</div>
                        <h3 className="text-xl font-bold">החירטוט נשלח!</h3>
                        <p className="text-white/60">
                            {waitingCount > 0 ? `ממתין ל-${waitingCount} שקרנים נוספים...` : 'כולם סיימו! מעבר לשלב הבא...'}
                        </p>
                    </div>
                )}
            </Card>
        </div>
    );
};
