import React, { useEffect, useState } from 'react';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';

interface Player {
    id: string;
    name: string;
    avatar_seed: string;
    score: number;
}

interface ScoreboardProps {
    players: Player[];
    previousScores?: Record<string, number>;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({ players, previousScores = {} }) => {
    const [sortedPlayers, setSortedPlayers] = useState<Player[]>([]);

    useEffect(() => {
        // Sort players by score (highest first)
        const sorted = [...players].sort((a, b) => b.score - a.score);
        setSortedPlayers(sorted);
    }, [players]);

    const getScoreChange = (playerId: string, currentScore: number) => {
        const prevScore = previousScores[playerId] || 0;
        const change = currentScore - prevScore;
        return change > 0 ? `+${change}` : '';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6"
        >
            <div className="flex items-center gap-2 mb-3 text-yellow-400">
                <Trophy className="w-5 h-5" />
                <h3 className="font-bold text-lg">ניקוד נוכחי</h3>
            </div>

            <div className="space-y-2">
                <AnimatePresence>
                    {sortedPlayers.map((player, index) => {
                        const scoreChange = getScoreChange(player.id, player.score);

                        return (
                            <motion.div
                                key={player.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`flex items-center justify-between p-2 rounded-lg ${index === 0
                                        ? 'bg-yellow-500/10 border border-yellow-500/30'
                                        : 'bg-white/5'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-white/40 font-mono text-sm w-6">
                                        #{index + 1}
                                    </span>
                                    <AvatarDisplay seed={player.avatar_seed} size="sm" />
                                    <span className="font-medium">{player.name}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {scoreChange && (
                                        <motion.span
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="text-green-400 text-sm font-bold"
                                        >
                                            {scoreChange}
                                        </motion.span>
                                    )}
                                    <span className="font-bold text-lg min-w-[60px] text-right">
                                        {player.score}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
