import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { supabase } from '../../lib/supabase';
import { useGameStore } from '../../lib/store';
import { Plus, Trash2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Question {
    id: string;
    text: string;
    answer: string;
    status: 'pending' | 'approved' | 'used';
    suggested_by_player_id?: string;
}

export const QuestionManager: React.FC = () => {
    const { gameId, playerId, players } = useGameStore();
    const isHost = players.find(p => p.id === playerId)?.is_host ?? false;
    const [questions, setQuestions] = useState<Question[]>([]);
    const [newQuestion, setNewQuestion] = useState({ text: '', answer: '' });
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        fetchQuestions();

        const subscription = supabase
            .channel('questions')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'trivia_questions',
                filter: `game_id=eq.${gameId}`
            }, () => {
                fetchQuestions();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameId, playerId, isHost]);

    const fetchQuestions = async () => {
        let query = supabase
            .from('trivia_questions')
            .select('*')
            .eq('game_id', gameId)
            .order('created_at', { ascending: false });

        // Players only ever see the questions they wrote themselves, so they
        // can still play fairly with everyone else's questions. The host moderates all.
        if (!isHost) {
            query = query.eq('suggested_by_player_id', playerId);
        }

        const { data } = await query;
        if (data) setQuestions(data);
    };

    const addQuestion = async () => {
        if (!newQuestion.text || !newQuestion.answer) return;
        setIsAdding(true);

        const { error } = await supabase
            .from('trivia_questions')
            .insert([{
                game_id: gameId,
                text: newQuestion.text,
                answer: newQuestion.answer,
                // Host questions are approved immediately; player questions await host approval.
                status: isHost ? 'approved' : 'pending',
                suggested_by_player_id: playerId
            }]);

        if (error) {
            console.error('Error adding question:', error);
            alert(`שגיאה בהוספת שאלה: ${error.message}`);
        } else {
            setNewQuestion({ text: '', answer: '' });
        }
        setIsAdding(false);
    };

    const deleteQuestion = async (id: string) => {
        await supabase.from('trivia_questions').delete().eq('id', id);
    };

    const approveQuestion = async (id: string) => {
        await supabase
            .from('trivia_questions')
            .update({ status: 'approved' })
            .eq('id', id);
    };

    const approvedQuestions = questions.filter(q => q.status === 'approved');

    const statusLabel = (status: Question['status']) => {
        switch (status) {
            case 'pending': return 'ממתין לאישור';
            case 'approved': return 'אושר ✓';
            case 'used': return 'שומש';
        }
    };

    return (
        <Card className="p-4 bg-white/5 border-white/10 max-h-[60vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-1 sticky top-0 bg-[#1a1a2e] z-10 py-2">
                {isHost
                    ? `ניהול שאלות (${approvedQuestions.length} מאושרות)`
                    : `השאלות שלי (${questions.length})`}
            </h3>
            {!isHost && (
                <p className="text-sm text-white/50 mb-4">
                    אתה רואה רק את השאלות שאתה כתבת — כך תוכל גם לשחק. השאר מוסתרות ממך.
                </p>
            )}

            <div className="space-y-4 mb-8">
                <div className="space-y-2">
                    <Input
                        placeholder="השאלה..."
                        value={newQuestion.text}
                        onChange={(e) => setNewQuestion(prev => ({ ...prev, text: e.target.value }))}
                    />
                    <Input
                        placeholder="התשובה הנכונה..."
                        value={newQuestion.answer}
                        onChange={(e) => setNewQuestion(prev => ({ ...prev, answer: e.target.value }))}
                    />
                    <Button
                        onClick={addQuestion}
                        disabled={!newQuestion.text || !newQuestion.answer || isAdding}
                        className="w-full"
                        variant="secondary"
                    >
                        <Plus className="w-4 h-4 ml-2" />
                        {isHost ? 'הוסף שאלה' : 'הוסף שאלה משלי'}
                    </Button>
                </div>
            </div>

            <div className="space-y-3">
                <AnimatePresence>
                    {questions.map((q) => (
                        <motion.div
                            key={q.id}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`p-3 rounded-lg flex justify-between items-start group border transition-colors ${q.status === 'pending'
                                    ? 'bg-yellow-500/5 border-yellow-500/20'
                                    : 'bg-white/5 border-transparent hover:border-white/10'
                                }`}
                        >
                            <div className="text-right">
                                <div className="font-bold">{q.text}</div>
                                <div className="text-sm text-green-400">{q.answer}</div>
                                <div className={`text-xs mt-1 ${q.status === 'pending' ? 'text-yellow-400' : 'text-white/40'}`}>
                                    {statusLabel(q.status)}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {isHost && q.status === 'pending' && (
                                    <button
                                        onClick={() => approveQuestion(q.id)}
                                        className="text-green-500 hover:text-green-400 transition-colors p-1"
                                        title="אשר שאלה"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    onClick={() => deleteQuestion(q.id)}
                                    className="text-white/20 hover:text-red-400 transition-colors p-1"
                                    title="מחק שאלה"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {questions.length === 0 && (
                    <div className="text-center text-white/40 py-4">
                        {isHost ? 'עדיין אין שאלות. הוסף אחת!' : 'עדיין לא הצעת שאלות. הוסף אחת!'}
                    </div>
                )}
            </div>
        </Card>
    );
};
