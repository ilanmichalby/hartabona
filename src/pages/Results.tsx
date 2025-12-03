import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AvatarDisplay } from '../components/ui/AvatarDisplay';
import { supabase } from '../lib/supabase';
import { useGameStore } from '../lib/store';
import { motion } from 'framer-motion';
import { Trophy, Crown, Brain, Zap } from 'lucide-react';

export const Results: React.FC = () => {
    const navigate = useNavigate();
    const { gameId, players, reset } = useGameStore();
    const [sortedPlayers, setSortedPlayers] = useState<any[]>([]);

    useEffect(() => {
        if (!gameId) {
            navigate('/');
            return;
        }

        // Sort players by score
        const sorted = [...players].sort((a, b) => b.score - a.score);
        setSortedPlayers(sorted);
    }, [players, gameId, navigate]);

    const handleNewGame = () => {
        reset();
        navigate('/');
    };

    const WinnerCard = ({ player, rank, icon: Icon, title, delay }: any) => (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay }}
            className={`relative flex flex-col items-center p-4 rounded-xl border-2 ${rank === 1
                    ? 'bg-yellow-500/20 border-yellow-500 scale-110 z-10'
                    : 'bg-white/5 border-white/10'
                }`}
        >
            <div className="absolute -top-6">
                <Icon className={`w-12 h-12 ${rank === 1 ? 'text-yellow-400' : 'text-white/40'
                    }`} />
            </div>
            <div className="mt-6 mb-2">
                <AvatarDisplay seed={player?.avatar_seed || ''} size={rank === 1 ? 'lg' : 'md'} />
            </div>
            <div className="font-bold text-lg">{player?.name}</div>
            <div className="text-2xl font-black">{player?.score}</div>
            <div className="text-xs uppercase tracking-wider opacity-60 mt-1">{title}</div>
        </motion.div>
    );

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-12 pb-20">
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500">
                    המשחק נגמר!
                </h1>
                <p className="text-white/60">והזוכים הם...</p>
            </div>

            <div className="flex items-end justify-center gap-4 w-full max-w-md px-4">
                {sortedPlayers[1] && (
                    <WinnerCard
                        player={sortedPlayers[1]}
                        rank={2}
                        icon={Zap}
                        title="סגן חרטטן"
                        delay={0.2}
                    />
                )}
                {sortedPlayers[0] && (
                    <WinnerCard
                        player={sortedPlayers[0]}
                        rank={1}
                        icon={Crown}
                        title="מלך החרטבונה"
                        delay={0.4}
                    />
                )}
                {sortedPlayers[2] && (
                    <WinnerCard
                        player={sortedPlayers[2]}
                        rank={3}
                        icon={Brain}
                        title="חביב הקהל"
                        delay={0.6}
                    />
                )}
            </div>

            <Card className="w-full max-w-md">
                <h3 className="font-bold mb-4 border-b border-white/10 pb-2">טבלת ניקוד מלאה</h3>
                <div className="space-y-3">
                    {sortedPlayers.map((player, index) => (
                        <div key={player.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="font-mono text-white/40 w-6">#{index + 1}</span>
                                <AvatarDisplay seed={player.avatar_seed} size="sm" className="w-8 h-8" />
                                <span>{player.name}</span>
                            </div>
                            <span className="font-bold">{player.score}</span>
                        </div>
                    ))}
                </div>
            </Card>

            <Button onClick={handleNewGame} className="w-full max-w-md text-lg">
                משחק חדש
            </Button>
        </div>
    );
};
