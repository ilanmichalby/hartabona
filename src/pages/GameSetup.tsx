import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { AvatarDisplay } from '../components/ui/AvatarDisplay';
import { supabase } from '../lib/supabase';
import { useGameStore } from '../lib/store';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export const GameSetup: React.FC = () => {
    const navigate = useNavigate();
    const { gameId, setPlayerId } = useGameStore();
    const [name, setName] = useState('');
    const [avatarSeed, setAvatarSeed] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!gameId) {
            navigate('/');
            return;
        }
        randomizeAvatar();
    }, [gameId, navigate]);

    const randomizeAvatar = () => {
        setAvatarSeed(Math.random().toString(36).substring(7));
    };

    const joinLobby = async () => {
        if (!name || !gameId) return;
        setIsLoading(true);

        try {
            // Check if this is the first player (host)
            const { count } = await supabase
                .from('players')
                .select('*', { count: 'exact', head: true })
                .eq('game_id', gameId);

            const isHost = count === 0;

            const { data, error } = await supabase
                .from('players')
                .insert([{
                    game_id: gameId,
                    name,
                    avatar_seed: avatarSeed,
                    is_host: isHost
                }])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setPlayerId(data.id);
                navigate('/lobby');
            }
        } catch (error) {
            console.error('Error joining lobby:', error);
            alert('Failed to join lobby. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8">
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center"
            >
                <h2 className="text-3xl font-bold text-white mb-2">מי אתה?</h2>
                <p className="text-white/60">בחר שם ודמות למשחק</p>
            </motion.div>

            <Card className="w-full space-y-8">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative group">
                        <AvatarDisplay seed={avatarSeed} size="xl" />
                        <button
                            onClick={randomizeAvatar}
                            className="absolute bottom-0 right-0 p-2 bg-secondary rounded-full shadow-lg hover:bg-secondary/90 transition-colors"
                        >
                            <RefreshCw className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <Input
                        placeholder="הכנס את השם שלך"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="text-center text-xl"
                        maxLength={12}
                    />
                    <Button
                        onClick={joinLobby}
                        disabled={!name || isLoading}
                        className="w-full text-lg"
                    >
                        {isLoading ? 'נכנס...' : 'המשך למשחק'}
                    </Button>
                </div>
            </Card>
        </div>
    );
};
