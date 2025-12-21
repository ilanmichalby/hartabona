import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AvatarDisplay } from '../components/ui/AvatarDisplay';
import { supabase } from '../lib/supabase';
import { useGameStore } from '../lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Users, Share2, Plus } from 'lucide-react';
import { QuestionManager } from '../components/game/QuestionManager';

export const Lobby: React.FC = () => {
    const navigate = useNavigate();
    const { gameId, gameCode, playerId, players, setPlayers, setStatus, mode } = useGameStore();
    const [allowSkip, setAllowSkip] = useState(true);
    const [questionsCount, setQuestionsCount] = useState(0);
    const currentPlayer = players.find(p => p.id === playerId);
    const isHost = currentPlayer?.is_host;

    useEffect(() => {
        if (!gameId) {
            navigate('/');
            return;
        }

        // Subscribe to players changes
        const playersSubscription = supabase
            .channel('players')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'players',
                filter: `game_id=eq.${gameId}`
            }, () => {
                fetchPlayers();
            })
            .subscribe();

        // Subscribe to game status changes
        const gameSubscription = supabase
            .channel('game_status')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'games',
                filter: `id=eq.${gameId}`
            }, (payload) => {
                if (payload.new.status === 'writing_truths') {
                    setStatus('writing_truths');
                    navigate('/write-truth');
                } else if (payload.new.status === 'playing') {
                    setStatus('playing');
                    navigate('/game');
                }
            })
            .subscribe();

        fetchPlayers();

        return () => {
            supabase.removeChannel(playersSubscription);
            supabase.removeChannel(gameSubscription);
        };
    }, [gameId, navigate, setStatus]);

    // Fetch questions count for Trivia mode validation
    useEffect(() => {
        if (mode === 'trivia' && isHost) {
            const fetchCount = async () => {
                const { count } = await supabase
                    .from('trivia_questions')
                    .select('*', { count: 'exact', head: true })
                    .eq('game_id', gameId)
                    .eq('status', 'approved');
                setQuestionsCount(count || 0);
            };

            fetchCount();

            // Subscribe to questions updates
            const sub = supabase.channel('lobby_questions')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'trivia_questions', filter: `game_id=eq.${gameId}` },
                    () => fetchCount())
                .subscribe();

            return () => { supabase.removeChannel(sub); };
        }
    }, [gameId, mode, isHost]);



    const fetchPlayers = async () => {
        const { data } = await supabase
            .from('players')
            .select('*')
            .eq('game_id', gameId);

        if (data) {
            setPlayers(data);
        }
    };

    const startGame = async () => {
        if (!isHost) return;

        if (mode === 'trivia') {
            // 1. Fetch approved questions
            const { data: questions } = await supabase
                .from('trivia_questions')
                .select('id')
                .eq('game_id', gameId)
                .eq('status', 'approved'); // Only approved questions

            if (!questions || questions.length === 0) {
                alert('אין שאלות מאושרות למשחק!');
                return;
            }

            // 2. Create rounds
            const rounds = questions.map((q, index) => ({
                game_id: gameId,
                round_order: index,
                status: 'fabricating', // Start in fabrication
                question_id: q.id,
                subject_player_id: null // No specific subject in trivia
            }));

            const { error: roundsError } = await supabase
                .from('rounds')
                .insert(rounds);

            if (roundsError) {
                console.error('Error creating rounds:', roundsError);
                return;
            }

            // 3. Start game (skip writing truths)
            await supabase
                .from('games')
                .update({
                    status: 'playing',
                    current_round_index: 0,
                    allow_skip: false // Skip logic doesn't apply to trivia usually
                })
                .eq('id', gameId);

        } else {
            // Classic mode flow
            await supabase
                .from('games')
                .update({
                    status: 'writing_truths',
                    allow_skip: allowSkip
                })
                .eq('id', gameId);
        }
    };

    const copyCode = () => {
        if (gameCode) {
            navigator.clipboard.writeText(gameCode);
        }
    };

    const shareLink = () => {
        const gameUrl = `${window.location.origin}/?code=${gameCode}`;
        navigator.clipboard.writeText(gameUrl);
        alert('קישור למשחק הועתק! שתפו אותו עם חברים.');
    };

    const shareSuggestionLink = () => {
        const link = `${window.location.origin}/suggest/${gameId}`;
        navigator.clipboard.writeText(link);
        alert('קישור להצעת שאלות הועתק! שלחו לחברים שרוצים להוסיף שאלות.');
    };

    return (
        <div className="flex flex-col min-h-[80vh] space-y-8">
            <Card className="text-center space-y-4 bg-primary/10 border-primary/20">
                <p className="text-sm text-white/60 uppercase tracking-wider font-bold">קוד המשחק</p>
                <div
                    onClick={copyCode}
                    className="text-5xl font-mono font-black tracking-widest cursor-pointer hover:scale-105 transition-transform flex items-center justify-center gap-4"
                >
                    {gameCode}
                    <Copy className="w-6 h-6 opacity-50" />
                </div>
                <Button
                    onClick={shareLink}
                    variant="secondary"
                    className="w-full flex items-center justify-center gap-2"
                >
                    <Share2 className="w-4 h-4" />
                    שתפו קישור ישיר
                </Button>
            </Card>

            {mode === 'trivia' && (
                <Card className="text-center p-4 bg-accent/10 border-accent/20">
                    <h3 className="font-bold text-accent mb-2">🧠 בניית המשחק</h3>
                    <p className="text-sm text-white/60 mb-3">
                        {isHost
                            ? 'שלח קישור לחברים כדי שיעזרו להמציא שאלות!'
                            : 'יש לך שאלה טובה? שלח אותה למנהל!'}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => navigate(`/suggest/${gameId}?suggestedBy=${playerId}`)}
                            variant="secondary"
                            className="flex-1 flex items-center justify-center gap-2 border-accent/20 hover:bg-accent/10"
                        >
                            <Plus className="w-4 h-4" />
                            הצע שאלה
                        </Button>
                        {isHost && (
                            <Button
                                onClick={shareSuggestionLink}
                                variant="outline"
                                className="px-3 border-accent/20"
                                title="העתק קישור להצעת שאלות"
                            >
                                <Share2 className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </Card>
            )}

            <div className="flex-1">
                <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        משתתפים ({players.length})
                    </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <AnimatePresence>
                        {players.map((player) => (
                            <motion.div
                                key={player.id}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                className="bg-white/5 rounded-xl p-4 flex flex-col items-center gap-2 border border-white/5"
                            >
                                <AvatarDisplay seed={player.avatar_seed} size="md" />
                                <span className="font-bold truncate w-full text-center">
                                    {player.name}
                                    {player.is_host && <span className="text-xs text-yellow-400 block">👑 מנהל</span>}
                                </span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {mode === 'trivia' && isHost && (
                <div className="mb-4">
                    <QuestionManager />
                </div>
            )}

            {isHost ? (
                <div className="space-y-4">
                    {mode === 'classic' && (
                        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                            <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                    <div className="font-bold text-white">אפשר לשחקנים לדלג</div>
                                    <div className="text-sm text-white/60">שחקנים יוכלו לדלג על התור שלהם</div>
                                </div>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={allowSkip}
                                        onChange={(e) => setAllowSkip(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </div>
                            </label>
                        </div>
                    )}

                    <Button
                        onClick={startGame}
                        className="w-full text-lg py-6 shadow-xl shadow-primary/20 animate-pulse"
                        disabled={players.length < 2 || (mode === 'trivia' && questionsCount === 0)}
                    >
                        {players.length < 2
                            ? 'ממתין לעוד שחקנים...'
                            : mode === 'trivia' && questionsCount === 0
                                ? 'הוסף שאלות כדי להתחיל'
                                : 'התחל משחק!'}
                    </Button>
                </div>
            ) : (
                <div className="text-center text-white/60 animate-pulse">
                    ממתין למנהל המשחק שיתחיל...
                </div>
            )}
        </div>
    );
};
