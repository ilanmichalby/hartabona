import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { supabase } from '../../lib/supabase';
import { useGameStore } from '../../lib/store';
import { motion } from 'framer-motion';

export const Fabrication: React.FC<{ roundId: string; subjectId: string }> = ({ roundId, subjectId }) => {
    const { playerId, players, mode } = useGameStore();
    const [fakeTruth, setFakeTruth] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [waitingCount, setWaitingCount] = useState(0);
    const [question, setQuestion] = useState<{ text: string, answer: string, suggested_by?: string } | null>(null);

    const subject = players.find(p => p.id === subjectId);
    const isSubject = mode === 'classic' && playerId === subjectId;

    useEffect(() => {
        // Fetch question if in trivia mode
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

                    if (questionData) setQuestion({
                        text: questionData.text,
                        answer: questionData.answer,
                        suggested_by: questionData.suggested_by
                    });
                }
            };
            fetchQuestion();
        }

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
    }, [roundId, mode]);

    const checkProgress = async () => {
        const { count } = await supabase
            .from('answers')
            .select('*', { count: 'exact', head: true })
            .eq('round_id', roundId);

        const currentCount = count || 0;
        console.log('[Fabrication] checkProgress:', { currentCount, playersLength: players.length });

        // Total expected answers:
        // Classic: players - 1 (subject doesn't write)
        // Trivia: players (everyone writes)
        const expectedAnswers = mode === 'classic' ? players.length - 1 : players.length;
        setWaitingCount(expectedAnswers - currentCount);

        if (currentCount >= expectedAnswers) {
            // Host triggers next phase (voting)
            const currentPlayer = players.find(p => p.id === playerId);
            if (currentPlayer?.is_host) {
                // Check if truth already exists to avoid duplicates
                const { data: existingTruth } = await supabase
                    .from('answers')
                    .select('id')
                    .eq('round_id', roundId)
                    .eq('is_truth', true)
                    .single();

                if (!existingTruth) {
                    console.log('[Fabrication] All answers submitted! Host is inserting truth...');
                    let truthText = '';
                    let truthPlayerId = subjectId;

                    if (mode === 'classic') {
                        const { data: subjectPlayer } = await supabase
                            .from('players')
                            .select('true_statement')
                            .eq('id', subjectId)
                            .single();
                        truthText = subjectPlayer?.true_statement || '';
                    } else if (mode === 'trivia') {
                        const { data: roundData } = await supabase
                            .from('rounds')
                            .select('question_id')
                            .eq('id', roundId)
                            .single();

                        if (roundData?.question_id) {
                            const { data: qData } = await supabase
                                .from('trivia_questions')
                                .select('answer')
                                .eq('id', roundData.question_id)
                                .single();
                            truthText = qData?.answer || '';
                            // Use host ID as placeholder for truth in trivia, 
                            // but we'll filter it out in the UI later
                            truthPlayerId = currentPlayer.id;
                        }
                    }

                    if (truthText) {
                        await supabase.from('answers').insert([{
                            round_id: roundId,
                            player_id: truthPlayerId,
                            text: truthText,
                            is_truth: true
                        }]);
                    }

                    // Then update status
                    await supabase
                        .from('rounds')
                        .update({ status: 'voting' })
                        .eq('id', roundId);
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

    // Trivia Mode UI
    if (mode === 'trivia') {
        const isSuggester = question?.suggested_by === playerId;

        return (
            <div className="space-y-6">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold text-accent">שאלה לשקרנים:</h2>
                    <Card className="p-6 bg-accent/10 border-accent/20">
                        <p className="text-xl font-bold">{question?.text || 'טוען שאלה...'}</p>
                    </Card>
                    {isSuggester && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
                            <p className="text-yellow-400 text-sm font-bold">
                                אתה כתבת את השאלה הזו!
                                <br />
                                התשובה הנכונה היא: <span className="underline">{question?.answer}</span>
                                <br />
                                כתוב "חירטוט" (שקר) אחר כדי לבלבל את כולם.
                            </p>
                        </div>
                    )}
                </div>

                <Card>
                    {!isSubmitted ? (
                        <div className="space-y-4">
                            <textarea
                                value={fakeTruth}
                                onChange={(e) => setFakeTruth(e.target.value)}
                                placeholder="המצא תשובה משכנעת..."
                                className="w-full h-32 rounded-xl border-2 border-white/10 bg-white/5 p-4 text-lg text-white placeholder:text-white/40 focus:border-primary focus:outline-none resize-none"
                                maxLength={100}
                            />
                            {isSuggester && fakeTruth.trim().toLowerCase() === question?.answer?.toLowerCase() && (
                                <p className="text-red-400 text-xs text-center">
                                    אסור לכתוב את התשובה הנכונה כחירטוט!
                                </p>
                            )}
                            <Button
                                onClick={submitFake}
                                disabled={!fakeTruth.trim() || (isSuggester && fakeTruth.trim().toLowerCase() === question?.answer?.toLowerCase())}
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
    }

    // Classic Mode UI
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
