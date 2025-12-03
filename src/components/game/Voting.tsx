import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { supabase } from '../../lib/supabase';
import { useGameStore } from '../../lib/store';
import { motion } from 'framer-motion';

interface Answer {
    id: string;
    text: string;
    player_id: string;
    is_truth: boolean;
}

export const Voting: React.FC<{ roundId: string; subjectId: string }> = ({ roundId, subjectId }) => {
    const { playerId, players } = useGameStore();
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [waitingCount, setWaitingCount] = useState(0);

    const subject = players.find(p => p.id === subjectId);
    const isSubject = playerId === subjectId;

    useEffect(() => {
        fetchAnswers();

        // Subscribe to votes to check progress
        const subscription = supabase
            .channel('round_votes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'votes',
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

    const fetchAnswers = async () => {
        // 1. Get fake answers
        const { data: fakeAnswers } = await supabase
            .from('answers')
            .select('*')
            .eq('round_id', roundId);

        // 2. Get true statement
        const { data: subjectPlayer } = await supabase
            .from('players')
            .select('true_statement')
            .eq('id', subjectId)
            .single();

        if (fakeAnswers && subjectPlayer?.true_statement) {
            // Create a "true" answer object (it's not in the answers table yet, or maybe we should insert it? 
            // Plan said "is_truth" in answers table. Let's insert it if not exists or just handle it in memory.
            // Actually, for simplicity and scoring, it's better if the true answer is also in the 'answers' table.
            // But wait, the subject wrote it in 'players' table.
            // Let's create a temporary Answer object for the truth.
            // Ideally, the host should have inserted the true answer into 'answers' table at start of round or voting phase.
            // Let's do it in memory for now, but for voting we need an ID.
            // Better approach: Host inserts the true answer into 'answers' table when switching to voting phase.
            // Let's assume the host did that in GameLoop transition. 
            // If not, we can just fetch all answers including the truth if it was inserted.

            // Let's check if truth is in answers.
            const truthInAnswers = fakeAnswers.find(a => a.is_truth);
            let allAnswers = [...fakeAnswers];

            if (!truthInAnswers) {
                // This implies the host logic in GameLoop needs to insert the truth.
                // I will implement that in GameLoop. For now, let's assume it's there.
            }

            // Shuffle
            setAnswers(allAnswers.sort(() => Math.random() - 0.5));
        }
    };

    const checkProgress = async () => {
        const { count } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('round_id', roundId);

        // Total expected votes = players - 1 (subject doesn't vote)
        const expectedVotes = players.length - 1;
        setWaitingCount(expectedVotes - (count || 0));

        if (count === expectedVotes) {
            // Host triggers next phase (reveal)
            const currentPlayer = players.find(p => p.id === playerId);
            if (currentPlayer?.is_host) {
                await supabase
                    .from('rounds')
                    .update({ status: 'reveal' })
                    .eq('id', roundId);
            }
        }
    };

    const submitVote = async () => {
        if (!selectedAnswerId) return;

        try {
            const { error } = await supabase
                .from('votes')
                .insert([{
                    round_id: roundId,
                    voter_id: playerId,
                    answer_id: selectedAnswerId
                }]);

            if (error) throw error;
            setIsSubmitted(true);
        } catch (error) {
            console.error('Error submitting vote:', error);
            alert('Failed to submit vote.');
        }
    };

    if (isSubject) {
        return (
            <div className="text-center space-y-8">
                <AvatarDisplay seed={subject?.avatar_seed || ''} size="xl" className="mx-auto" />
                <Card className="p-8">
                    <h2 className="text-2xl font-bold mb-4">האמת שלך עומדת למבחן!</h2>
                    <p className="text-white/60">
                        החברים מנסים לנחש מה האמת ומה חירטוט.<br />
                        ממתין ל-{waitingCount} מצביעים...
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <AvatarDisplay seed={subject?.avatar_seed || ''} size="lg" className="mx-auto" />
                <h2 className="text-2xl font-bold">מה האמת של {subject?.name}?</h2>
            </div>

            <div className="grid gap-4">
                {!isSubmitted ? (
                    <>
                        {answers.map((answer) => (
                            <motion.button
                                key={answer.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedAnswerId(answer.id)}
                                className={`p-6 rounded-xl text-right text-lg transition-all ${selectedAnswerId === answer.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/25 ring-2 ring-white'
                                    : 'bg-white/10 text-white/90 hover:bg-white/20'
                                    }`}
                            >
                                {answer.text}
                            </motion.button>
                        ))}
                        <Button
                            onClick={submitVote}
                            disabled={!selectedAnswerId}
                            className="w-full text-lg mt-4"
                        >
                            הצבע!
                        </Button>
                    </>
                ) : (
                    <Card className="text-center py-8">
                        <div className="text-4xl mb-4">🗳️</div>
                        <h3 className="text-xl font-bold">ההצבעה נקלטה!</h3>
                        <p className="text-white/60">
                            ממתין ל-{waitingCount} מצביעים נוספים...
                        </p>
                    </Card>
                )}
            </div>
        </div>
    );
};
