import { useState } from 'react'
import AvatarDisplay from '../../components/AvatarDisplay'

const MEDALS = ['🥇', '🥈', '🥉']

export default function LeaderboardPhase({ game, players, myPlayer, isHost, onNextRound }) {
  const [loading, setLoading] = useState(false)

  const sorted = [...players].sort((a, b) => b.score - a.score)
  const isLastRound = game.current_round + 1 >= players.length
  const nextRoundNum = game.current_round + 2

  async function handleNext() {
    setLoading(true)
    await onNextRound()
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 pb-28">
      <div className="w-full max-w-sm slide-up">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="text-4xl mb-1">📊</div>
          <h2 className="text-3xl font-black text-white">לוח תוצאות</h2>
          <p className="text-purple-300 text-sm mt-1">
            לאחר סבב {game.current_round + 1} מתוך {players.length}
          </p>
        </div>

        {/* Leaderboard */}
        <div className="space-y-2">
          {sorted.map((player, idx) => {
            const isMe = player.id === myPlayer?.id
            const medal = MEDALS[idx] || `${idx + 1}`
            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 rounded-2xl p-3 border transition-all ${
                  isMe
                    ? 'bg-purple-500/25 border-purple-400/60 shadow-lg shadow-purple-500/20'
                    : idx === 0
                    ? 'bg-yellow-500/15 border-yellow-400/40'
                    : 'bg-white/8 border-white/15'
                } bounce-in`}
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <span className="text-2xl w-8 text-center shrink-0">{medal}</span>
                <AvatarDisplay seed={player.avatar_seed} size={40} />
                <div className="flex-1 min-w-0">
                  <p className={`font-bold truncate ${isMe ? 'text-purple-200' : 'text-white'}`}>
                    {player.name} {isMe && <span className="text-xs text-purple-300">(אתה)</span>}
                  </p>
                  <p className="text-white/40 text-xs">
                    ✓ {player.correct_count} נכון · 🎭 הפיל {player.fooled_count}
                  </p>
                </div>
                <div className="text-left shrink-0">
                  <p className={`font-black text-xl ${idx === 0 ? 'text-yellow-300' : isMe ? 'text-purple-300' : 'text-white'}`}>
                    {player.score}
                  </p>
                  <p className="text-white/40 text-xs text-left">נקודות</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Continue button */}
      {isHost && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4">
          <button
            onClick={handleNext}
            disabled={loading}
            className="w-full max-w-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-60 text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-xl hover:-translate-y-0.5"
          >
            {loading ? '⏳...' : isLastRound ? '🏆 לתוצאות הסופיות!' : `➡️ סבב ${nextRoundNum}`}
          </button>
        </div>
      )}
      {!isHost && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center">
          <p className="text-white/40 text-sm">ממתין למארח...</p>
        </div>
      )}
    </div>
  )
}
