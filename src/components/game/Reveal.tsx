import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { AvatarDisplay } from '../ui/AvatarDisplay';
import { supabase } from '../../lib/supabase';
import { useGameStore } from '../../lib/store';
import { motion } from 'framer-motion';
import { Check, X, Trophy } from 'lucide-react';

interface VoteResult {
    answer_id: string;
    voter_id: string;
    voter_name: string;
    voter_avatar: string;
}

interface AnswerResult {
    id: string;
    text: string;
    player_id: string;
    player_name: string;
    is_truth: boolean;
    votes: VoteResult[];
}

export const Reveal: React.FC<{ roundId: string; subjectId: string }> = ({ roundId, subjectId }) => {
    const { playerId, players, currentRoundIndex } = useGameStore();
    const [results, setResults] = useState<AnswerResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const subject = players.find(p => p.id === subjectId);
    const currentPlayer = players.find(p => p.id === playerId);
    const isHost = currentPlayer?.is_host;

    useEffect(() => {
        calculateResults();
    }, [roundId]);

    const calculateResults = async () => {
        // Fetch answers, votes, and players
        const { data: answers } = await supabase
            .from('answers')
            .select('*, player:players(name)')
            .eq('round_id', roundId);

        const { data: votes } = await supabase
            .from('votes')
            .select('*, voter:players(name, avatar_seed)')
            .eq('round_id', roundId);

        if (answers && votes) {
            const processedResults: AnswerResult[] = answers.map(answer => ({
                id: answer.id,
                text: answer.text,
                player_id: answer.player_id,
                player_name: (answer.player as any).name,
                is_truth: answer.is_truth,
                votes: votes
                    .filter(v => v.answer_id === answer.id)
                    .map(v => ({
                        answer_id: v.answer_id,
                        voter_id: v.voter_id,
                        voter_name: (v.voter as any).name,
                        voter_avatar: (v.voter as any).avatar_seed
                    }))
            }));

            // Sort: Truth first, then by vote count
            processedResults.sort((a, b) => {
                if (a.is_truth) return -1;
                if (b.is_truth) return 1;
                return b.votes.length - a.votes.length;
            });

            setResults(processedResults);

            // Calculate scores only once (host does it)
            if (isHost) {
                await updateScores(processedResults);
            }
        }
        setIsLoading(false);
    };

    const updateScores = async (roundResults: AnswerResult[]) => {
        // Logic:
        // +200 for correct vote
        // +100 for fooling someone (if you wrote the fake answer)

        const scores: Record<string, number> = {};

        roundResults.forEach(result => {
            if (result.is_truth) {
                // Voters get points
                result.votes.forEach(vote => {
                    scores[vote.voter_id] = (scores[vote.voter_id] || 0) + 200;
                });
            } else {
                // Author gets points for each vote
                scores[result.player_id] = (scores[result.player_id] || 0) + (result.votes.length * 100);
            }
        });

        // Update DB
        for (const [pid, scoreToAdd] of Object.entries(scores)) {
            // Get current score first
            const { data } = await supabase
                .from('players')
                .select('score')
                .eq('id', pid)
                .single();

            if (data) {
                await supabase
                    .from('players')
                    .update({ score: data.score + scoreToAdd })
                    .eq('id', pid);
            }
        }
    };

    const nextRound = async () => {
        // Check if there are more rounds
        const nextIndex = currentRoundIndex + 1;

        // Check if we have a round for this index
        const { count } = await supabase
            .from('rounds')
            .select('*', { count: 'exact', head: true })
            .eq('game_id', subject?.game_id)
            .eq('round_order', nextIndex);

        if (count && count > 0) {
            // Go to next round
            await supabase
                .from('games')
                .update({ current_round_index: nextIndex })
                .eq('id', subject?.game_id);

            // Also need to update the round status? 
            // Actually GameLoop listens to current_round_index change.
            // But we also need to ensure the next round is in 'fabricating' status (default).
        } else {
            // End game
            await supabase
                .from('games')
                .update({ status: 'finished' })
                .eq('id', subject?.game_id);
        }
    };

    if (isLoading) return <div className="text-center">מחשב תוצאות...</div>;

    return (
        <div className="space-y-6 pb-20">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">תוצאות הסיבוב!</h2>
                <p className="text-white/60">האמת של {subject?.name}</p>
            </div>

            <div className="space-y-4">
                {results.map((result) => (
                    <motion.div
                        key={result.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`relative rounded-xl p-4 border-2 ${result.is_truth
                            ? 'bg-green-500/20 border-green-500'
                            : 'bg-white/5 border-white/10'
                            }`}
                    >
                        {result.is_truth && (
                            <div className="absolute -top-3 -right-3 bg-green-500 text-white p-1 rounded-full shadow-lg">
                                <Check className="w-4 h-4" />
                            </div>
                        )}

                        <p className="text-lg font-medium mb-3 pr-2">{result.text}</p>

                        <div className="flex items-center justify-between text-sm">
                            <div className="text-white/40">
                                {result.is_truth ? 'האמת לאמיתה' : `נכתב ע"י ${result.player_name}`}
                            </div>

                            {result.votes.length > 0 && (
                                <div className="flex -space-x-2 space-x-reverse">
                                    {result.votes.map((vote) => (
                                        <div key={vote.voter_id} className="relative group">
                                            <AvatarDisplay
                                                seed={vote.voter_avatar}
                                                size="sm"
                                                className="border-2 border-surface"
                                            />
                                            <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-xs p-1 rounded whitespace-nowrap">
                                                {vote.voter_name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {isHost && (
                <div className="fixed bottom-8 left-0 right-0 px-4 flex justify-center z-20">
                    <Button
                        onClick={nextRound}
                        className="w-full max-w-md shadow-2xl shadow-primary/50 text-lg py-6"
                    >
                        לסיבוב הבא
                    </Button>
                </div>
            )}
        </div>
    );
};
