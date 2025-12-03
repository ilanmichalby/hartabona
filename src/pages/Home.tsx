import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { useGameStore } from '../lib/store';
import { motion } from 'framer-motion';

export const Home: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [joinCode, setJoinCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { setGameId, setGameCode } = useGameStore();

    // Auto-join if code is in URL
    useEffect(() => {
        const codeFromUrl = searchParams.get('code');
        if (codeFromUrl) {
            setJoinCode(codeFromUrl.toUpperCase());
            // Auto-join after a short delay
            setTimeout(() => {
                joinGameWithCode(codeFromUrl.toUpperCase());
            }, 500);
        }
    }, [searchParams]);

    const createGame = async () => {
        setIsLoading(true);
        try {
            // Generate a random 6-character code
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();

            const { data, error } = await supabase
                .from('games')
                .insert([{ code, status: 'lobby' }])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setGameId(data.id);
                setGameCode(data.code);
                navigate('/setup');
            }
        } catch (error: any) {
            console.error('Error creating game:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            alert(`Failed to create game: ${error?.message || 'Unknown error'}. Check console for details.`);
        } finally {
            setIsLoading(false);
        }
    };

    const joinGameWithCode = async (code?: string) => {
        const gameCode = code || joinCode;
        if (!gameCode) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('games')
                .select()
                .eq('code', gameCode.toUpperCase())
                .single();

            if (error || !data) {
                alert('משחק לא נמצא!');
                return;
            }

            if (data.status !== 'lobby') {
                alert('המשחק כבר התחיל!');
                return;
            }

            setGameId(data.id);
            setGameCode(data.code);
            navigate('/setup');
        } catch (error) {
            console.error('Error joining game:', error);
            alert('נכשל בהצטרפות למשחק. נסה שוב.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-12">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center space-y-4"
            >
                <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-secondary via-primary to-accent drop-shadow-lg">
                    חרטבונה
                </h1>
                <p className="text-xl text-white/80 font-medium">
                    המשחק שבו השקר הטוב ביותר מנצח
                </p>
            </motion.div>

            <div className="w-full space-y-6">
                <Card className="space-y-6">
                    <Button
                        onClick={createGame}
                        disabled={isLoading}
                        className="w-full text-lg h-16 bg-gradient-to-r from-primary to-accent"
                    >
                        {isLoading ? 'יוצר משחק...' : 'צור משחק חדש'}
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-surface px-2 text-white/40">או</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Input
                            placeholder="קוד משחק"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            className="text-center tracking-widest text-2xl uppercase font-mono"
                            maxLength={6}
                        />
                        <Button
                            onClick={() => joinGameWithCode()}
                            disabled={!joinCode || isLoading}
                            variant="secondary"
                            className="w-full"
                        >
                            הצטרף למשחק
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};
