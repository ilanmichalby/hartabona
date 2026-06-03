import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { useGameStore } from '../lib/store';
import { Send, CheckCircle } from 'lucide-react';

/**
 * מחזיר מזהה תורם עקבי לשימוש הנוכחי:
 * 1. אם הגיעו עם suggestedBy בURL – משתמשים בו.
 * 2. אחרת – מחפשים/יוצרים UUID ב-localStorage לפי gameId.
 * כשהתורם מצטרף למשחק, GameSetup יקרא למפתח הזה ויקשר את השאלות.
 */
function getOrCreateContributorId(gameId: string, urlSuggestedBy: string | null): string {
    const key = `hartabona_contributor_${gameId}`;
    if (urlSuggestedBy) {
        localStorage.setItem(key, urlSuggestedBy);
        return urlSuggestedBy;
    }
    const stored = localStorage.getItem(key);
    if (stored) return stored;
    const newId = crypto.randomUUID();
    localStorage.setItem(key, newId);
    return newId;
}

export const SuggestQuestion: React.FC = () => {
    const { gameId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Get suggestedBy from query params (optional – existing players may pass their playerId)
    const queryParams = new URLSearchParams(location.search);
    const urlSuggestedBy = queryParams.get('suggestedBy');

    // contributorId is stable for this browser/game combination
    const contributorId = useRef<string>(
        gameId ? getOrCreateContributorId(gameId, urlSuggestedBy) : (urlSuggestedBy ?? '')
    ).current;

    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [gameCode, setGameCode] = useState<string | null>(null);
    const [myQuestions, setMyQuestions] = useState<{ id: string; text: string; answer: string; status: string }[]>([]);

    const fetchMyQuestions = async () => {
        if (!gameId || !contributorId) return;
        const { data } = await supabase
            .from('trivia_questions')
            .select('id, text, answer, status')
            .eq('game_id', gameId)
            .eq('suggested_by_player_id', contributorId)
            .order('created_at', { ascending: false });
        if (data) setMyQuestions(data);
    };

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
        fetchMyQuestions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameId, contributorId]);

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
                    suggested_by_player_id: contributorId
                }]);

            if (error) throw error;
            setIsSuccess(true);
            setQuestion('');
            setAnswer('');
            fetchMyQuestions();

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

                {contributorId && myQuestions.length > 0 && (
                    <div className="border-t border-white/10 pt-4 space-y-3">
                        <div className="flex items-baseline justify-between">
                            <h3 className="font-bold text-white/80">השאלות שלך ({myQuestions.length})</h3>
                            <span className="text-xs text-white/40">רק אתה רואה אותן</span>
                        </div>
                        {myQuestions.map((q) => (
                            <div key={q.id} className="bg-white/5 rounded-lg p-3 text-right">
                                <div className="font-bold">{q.text}</div>
                                <div className="text-sm text-green-400">{q.answer}</div>
                                <div className={`text-xs mt-1 ${q.status === 'pending' ? 'text-yellow-400' : 'text-white/40'}`}>
                                    {q.status === 'pending' ? 'ממתין לאישור' : q.status === 'approved' ? 'אושר ✓' : 'שומש'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

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
