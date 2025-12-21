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
    const { playerId, players, mode } = useGameStore();
    const [answers, setAnswers] = useState<Answer[]>([]);
    const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [waitingCount, setWaitingCount] = useState(0);

    const subject = players.find(p => p.id === subjectId);
    const isSubject = mode === 'classic' && playerId === subjectId;
    const [question, setQuestion] = useState<{ text: string, answer: string, suggested_by?: string } | null>(null);

    useEffect(() => {
        fetchAnswers();

        if (mode === 'trivia') {
            const fetchQuestion = async () => {
                const { data: roundData } = await supabase
                    .from('rounds')
                    .select('question_id')
                    .eq('id', roundId)
                    .single();

                if (roundData?.question_id) {
                    const { data: questionData } = await supabase
                        .from('trivia_questions')
                        .select('text, answer, suggested_by:suggested_by_player_id')
                        .eq('id', roundData.question_id)
                        .single();

                    if (questionData) {
                        setQuestion({
                            text: questionData.text,
                            answer: questionData.answer,
                            suggested_by: questionData.suggested_by
                        });
                    }
                }
            };
            fetchQuestion();
        }

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

    useEffect(() => {
        if (mode === 'trivia' && question) {
            checkProgress();
        }
    }, [question]);

    const fetchAnswers = async () => {
        console.log('[Voting] fetchAnswers called for roundId:', roundId);

        // 1. Get fake answers
        const { data: fakeAnswers } = await supabase
            .from('answers')
            .select('*')
            .eq('round_id', roundId);

        console.log('[Voting] Fetched answers from DB:', fakeAnswers);



        if (fakeAnswers) {
            // Filter empty answers just in case
            const validAnswers = fakeAnswers.filter(a => a.text);

            // Shuffle
            setAnswers(validAnswers.sort(() => Math.random() - 0.5));
        }
    };




    const checkProgress = async () => {
        const { count } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('round_id', roundId);

        // Total expected votes:
        // Classic: players - 1 (subject doesn't vote)
        // Trivia: players (everyone votes) UNLESS the question author is playing
        let expectedVotes = players.length;

        if (mode === 'classic') {
            expectedVotes = players.length - 1;
        }

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
            <div className="space-y-6">
                <div className="text-center space-y-2">
                    <AvatarDisplay seed={subject?.avatar_seed || ''} size="xl" className="mx-auto" />
                    <h2 className="text-2xl font-bold">האמת שלך עומדת למבחן!</h2>
                    <p className="text-white/60">
                        החברים מנסים לנחש מה האמת ומה חירטוט
                    </p>
                </div>

                <Card className="p-6 bg-primary/10 border-primary/20">
                    <h3 className="text-lg font-bold mb-4">💭 מה כתבו עליך:</h3>
                    <div className="space-y-3">
                        {answers.filter(a => !a.is_truth).map((answer, index) => (
                            <motion.div
                                key={answer.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-4 bg-white/5 rounded-lg text-right"
                            >
                                {answer.text}
                            </motion.div>
                        ))}
                    </div>
                </Card>

                <Card className="text-center py-6">
                    <div className="text-4xl mb-2">🗳️</div>
                    <p className="text-white/60">
                        ממתין ל-{waitingCount} מצביעים...
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                {mode === 'classic' ? (
                    <>
                        <AvatarDisplay seed={subject?.avatar_seed || ''} size="lg" className="mx-auto" />
                        <h2 className="text-2xl font-bold">מה האמת של {subject?.name}?</h2>
                    </>
                ) : (
                    <>
                        <h2 className="text-2xl font-bold text-accent">השאלה:</h2>
                        <Card className="p-4 bg-accent/10 border-accent/20">
                            <p className="text-xl font-bold">{question?.text || 'טוען...'}</p>
                        </Card>
                    </>
                )}
            </div>

            <div className="grid gap-4">
                {!isSubmitted ? (
                    <>
                        {answers.map((answer) => {
                            const isOwnAnswer = answer.player_id === playerId && !answer.is_truth;

                            return (
                                <motion.button
                                    key={answer.id}
                                    whileHover={!isOwnAnswer ? { scale: 1.02 } : {}}
                                    whileTap={!isOwnAnswer ? { scale: 0.98 } : {}}
                                    onClick={() => !isOwnAnswer && setSelectedAnswerId(answer.id)}
                                    disabled={isOwnAnswer}
                                    className={`p-6 rounded-xl text-right text-lg transition-all relative ${isOwnAnswer
                                        ? 'bg-white/5 text-white/40 cursor-not-allowed border-2 border-white/10'
                                        : selectedAnswerId === answer.id
                                            ? 'bg-primary text-white shadow-lg shadow-primary/25 ring-2 ring-white'
                                            : 'bg-white/10 text-white/90 hover:bg-white/20'
                                        }`}
                                >
                                    {answer.text}
                                    {isOwnAnswer && (
                                        <span className="absolute top-2 left-2 text-xs bg-white/10 px-2 py-1 rounded">
                                            החירטוט שלך
                                        </span>
                                    )}
                                </motion.button>
                            );
                        })}
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
        </div >
    );
};
