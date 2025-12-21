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
    const { gameId, playerId } = useGameStore();
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
    }, [gameId]);

    const fetchQuestions = async () => {
        const { data } = await supabase
            .from('trivia_questions')
            .select('*')
            .eq('game_id', gameId)
            .order('created_at', { ascending: false });

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
                status: 'approved', // Host added questions are approved by default
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
    // const pendingQuestions = questions.filter(q => q.status === 'pending');

    return (
        <Card className="p-4 bg-white/5 border-white/10 max-h-[60vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 sticky top-0 bg-[#1a1a2e] z-10 py-2">ניהול שאלות ({approvedQuestions.length})</h3>

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
                        הוסף שאלה
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
                            </div>
                            <div className="flex gap-2">
                                {q.status === 'pending' && (
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
                        עדיין אין שאלות. הוסף אחת!
                    </div>
                )}
            </div>
        </Card>
    );
};
