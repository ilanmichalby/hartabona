import { useState } from 'react'
import AvatarDisplay from '../../components/AvatarDisplay'

const MEDALS = ['🥇', '🥈', '🥉']

export default function FinalPhase({ players }) {
  const [confettiDone, setConfettiDone] = useState(false)

  const sorted = [...players].sort((a, b) => b.score - a.score)
  const topScore = sorted[0]
  const topTrickster = [...players].sort((a, b) => b.fooled_count - a.fooled_count)[0]
  const topGenius = [...players].sort((a, b) => b.correct_count - a.correct_count)[0]

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      {/* Confetti effect via CSS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute w-2 h-2 rounded-full opacity-70"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-${Math.random() * 20}%`,
              background: ['#f59e0b','#ec4899','#8b5cf6','#06b6d4','#10b981'][i % 5],
              animation: `fall ${2 + Math.random() * 3}s linear ${Math.random() * 2}s infinite`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>

      <div className="w-full max-w-sm relative z-10 slide-up">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-2 float-anim">🏆</div>
          <h1 className="text-4xl font-black shimmer-text">המשחק נגמר!</h1>
          <p className="text-purple-300 mt-1">הנה הזוכים הגדולים</p>
        </div>

        {/* Winner cards */}
        <div className="space-y-4 mb-6">
          {/* King of Hartabona */}
          {topScore && (
            <div className="bg-gradient-to-br from-yellow-500/25 to-orange-500/20 rounded-3xl p-5 border border-yellow-400/50 shadow-xl bounce-in">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">👑</span>
                <div>
                  <p className="text-yellow-300 text-xs font-bold uppercase tracking-wide">מלך החרטבונה</p>
                  <p className="text-white/60 text-xs">הניקוד הגבוה ביותר</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-yellow-400/60 overflow-hidden bg-yellow-500/20">
                    <AvatarDisplay seed={topScore.avatar_seed} size={64} />
                  </div>
                  <div className="absolute -top-1 -right-1 text-lg">👑</div>
                </div>
                <div>
                  <p className="text-white font-black text-xl">{topScore.name}</p>
                  <p className="text-yellow-300 font-bold text-2xl">{topScore.score} נק׳</p>
                </div>
              </div>
            </div>
          )}

          {/* Ultimate Trickster */}
          {topTrickster && topTrickster.fooled_count > 0 && (
            <div className="bg-gradient-to-br from-pink-500/20 to-red-500/15 rounded-3xl p-5 border border-pink-400/40 bounce-in" style={{ animationDelay: '150ms' }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">🎭</span>
                <div>
                  <p className="text-pink-300 text-xs font-bold uppercase tracking-wide">חרטטן על</p>
                  <p className="text-white/60 text-xs">הפיל הכי הרבה משתתפים</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full border-2 border-pink-400/60 overflow-hidden bg-pink-500/20">
                  <AvatarDisplay seed={topTrickster.avatar_seed} size={56} />
                </div>
                <div>
                  <p className="text-white font-black text-lg">{topTrickster.name}</p>
                  <p className="text-pink-300 font-bold">הפיל {topTrickster.fooled_count} שחקנים בפח 😈</p>
                </div>
              </div>
            </div>
          )}

          {/* Mom's Genius */}
          {topGenius && topGenius.correct_count > 0 && (
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/15 rounded-3xl p-5 border border-blue-400/40 bounce-in" style={{ animationDelay: '300ms' }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">🧠</span>
                <div>
                  <p className="text-blue-300 text-xs font-bold uppercase tracking-wide">גאון של אמא</p>
                  <p className="text-white/60 text-xs">ניחש הכי הרבה נכון</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full border-2 border-blue-400/60 overflow-hidden bg-blue-500/20">
                  <AvatarDisplay seed={topGenius.avatar_seed} size={56} />
                </div>
                <div>
                  <p className="text-white font-black text-lg">{topGenius.name}</p>
                  <p className="text-blue-300 font-bold">ניחש נכון {topGenius.correct_count} פעמים 🎯</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Full leaderboard */}
        <div className="bg-white/8 rounded-2xl p-4 border border-white/15 mb-6">
          <h3 className="text-white/70 text-sm font-bold mb-3 text-center">טבלת ניקוד סופית</h3>
          <div className="space-y-2">
            {sorted.map((player, idx) => (
              <div key={player.id} className="flex items-center gap-2">
                <span className="text-lg w-7 text-center">{MEDALS[idx] || `${idx + 1}`}</span>
                <AvatarDisplay seed={player.avatar_seed} size={28} />
                <span className="text-white text-sm flex-1">{player.name}</span>
                <span className="text-white font-bold text-sm">{player.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Play again */}
        <a href="/"
          className="block w-full text-center bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg py-4 rounded-2xl transition-all hover:-translate-y-0.5 shadow-lg"
        >
          🎮 משחק חדש!
        </a>
      </div>
    </div>
  )
}
