import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { useGameStore } from '../lib/store';
import { Send, CheckCircle } from 'lucide-react';

export const SuggestQuestion: React.FC = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Get suggestedBy from query params
    const queryParams = new URLSearchParams(location.search);
    const suggestedBy = queryParams.get('suggestedBy');

    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [gameCode, setGameCode] = useState<string | null>(null);

    useEffect(() => {
        const fetchGameCode = async () => {
            if (!gameId) return;
            const { data } = await supabase
                .from('games')
                .select('code')
                .eq('id', gameId)
                .single();
            if (data) setGameCode(data.code);
        };
        fetchGameCode();
    }, [gameId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || !answer.trim() || !gameId) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('trivia_questions')
                .insert([{
                    game_id: gameId,
                    text: question,
                    answer: answer,
                    status: 'pending', // Pending approval for suggestions
                    suggested_by_player_id: suggestedBy
                }]);

            if (error) throw error;
            setIsSuccess(true);
            setQuestion('');
            setAnswer('');

            // Reset success message after 3 seconds
            setTimeout(() => {
                setIsSuccess(false);
            }, 3000);

        } catch (error) {
            console.error('Error submitting question:', error);
            alert('אירעה שגיאה בשליחת השאלה');
        } finally {
            setIsSubmitting(false);
        }
    };

    const { gameId: storedGameId, playerId: storedPlayerId } = useGameStore();
    const isAlreadyInGame = storedGameId === gameId && storedPlayerId;

    const handleJoinGame = async () => {
        if (isAlreadyInGame) {
            navigate('/lobby');
        } else if (gameCode) {
            navigate(`/?code=${gameCode}`);
        } else {
            navigate('/');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-secondary via-primary to-accent drop-shadow-lg">
                    הצעת שאלה
                </h1>
                <p className="text-xl text-white/80 font-medium">
                    יש לכם רעיון לשאלת טריוויה מעולה?<br />
                    שלחו אותה למנהל המשחק!
                </p>
            </div>

            <Card className="w-full max-w-md p-6 space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-white/60">השאלה</label>
                        <Input
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="למשל: מהי בירת אוסטרליה?"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-white/60">התשובה הנכונה</label>
                        <Input
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="למשל: קנברה"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting || !question || !answer}
                        className={`w-full text-lg h-14 transition-all ${isSuccess
                            ? 'bg-green-500 hover:bg-green-600'
                            : 'bg-gradient-to-r from-primary to-accent'
                            }`}
                    >
                        {isSuccess ? (
                            <span className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                נשלח בהצלחה!
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <Send className="w-5 h-5" />
                                שלח למנהל
                            </span>
                        )}
                    </Button>
                </form>

                <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
                    <Button
                        onClick={handleJoinGame}
                        className="bg-primary hover:bg-primary/80"
                    >
                        {isAlreadyInGame ? 'חזרה ללובי המשחק' : `כניסה למשחק ${gameCode ? `(${gameCode})` : ''}`}
                    </Button>
                    {!isAlreadyInGame && (
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/')}
                            className="text-white/40 hover:text-white"
                        >
                            חזרה למסך הראשי
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
};
