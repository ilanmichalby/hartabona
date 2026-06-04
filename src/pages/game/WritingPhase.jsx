import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import AvatarDisplay from '../../components/AvatarDisplay'

const EXAMPLES = [
  'כשהייתי ילד/ה הייתי אלוף/ה רעננה בג\'ודו',
  'פעם ניצחתי שחקן מקצועי בשחמט',
  'יש לי כישרון מוסיקלי נסתר — מנגן/ת על 3 כלים',
  'פגשתי ידוען מפורסם בתור מקרי',
  'פעם אחת הגעתי לטלוויזיה בטעות',
]

export default function WritingPhase({ game, players, myPlayer, trueStatements }) {
  const [statement, setStatement] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const myStatement = trueStatements.find(s => s.player_id === myPlayer?.id)
  const submittedCount = trueStatements.length
  const totalPlayers = players.length

  async function handleSubmit() {
    if (!statement.trim()) { setError('נא לכתוב משפט'); return }
    if (statement.trim().length < 5) { setError('המשפט קצר מדי'); return }
    if (statement.trim().length > 150) { setError('המשפט ארוך מדי (עד 150 תווים)'); return }
    setLoading(true)
    setError('')
    try {
      const { error: err } = await supabase.from('true_statements').insert({
        player_id: myPlayer.id,
        game_id: game.id,
        content: statement.trim(),
      })
      if (err) throw err
      setSubmitted(true)
    } catch (e) {
      setError('שגיאה בשמירת המשפט')
    }
    setLoading(false)
  }

  const alreadySubmitted = myStatement || submitted

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm slide-up">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">📝</div>
          <h2 className="text-3xl font-black text-white">כתוב משפט אמת</h2>
          <p className="text-purple-300 mt-1 text-sm">
            משפט מגניב ומפתיע שרק אתה יודע שהוא אמיתי
          </p>
        </div>

        {/* My avatar */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/40 to-pink-500/40 border-2 border-purple-400/60 overflow-hidden">
              <AvatarDisplay seed={myPlayer?.avatar_seed} size={80} />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              {myPlayer?.name}
            </div>
          </div>
        </div>

        {!alreadySubmitted ? (
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 shadow-2xl space-y-4">
            <textarea
              value={statement}
              onChange={e => setStatement(e.target.value)}
              placeholder="למשל: פעם ניצחתי אלוף שחמט..."
              maxLength={150}
              rows={3}
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-400 focus:bg-white/15 transition-all resize-none text-base"
            />
            <div className="flex justify-between items-center">
              <span className="text-white/40 text-xs">{statement.length}/150</span>
              {error && <span className="text-red-400 text-xs">{error}</span>}
            </div>

            {/* Example suggestions */}
            <div>
              <p className="text-white/50 text-xs mb-2">💡 רעיונות לדוגמה:</p>
              <div className="flex flex-wrap gap-1">
                {EXAMPLES.slice(0, 3).map((ex, i) => (
                  <button key={i} onClick={() => setStatement(ex)}
                    className="text-xs text-purple-300 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 rounded-lg px-2 py-1 transition-colors text-right">
                    {ex.substring(0, 30)}...
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !statement.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold text-lg py-4 rounded-2xl transition-all hover:-translate-y-0.5"
            >
              {loading ? '⏳ שומר...' : '✅ שלח משפט'}
            </button>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 text-center space-y-3">
            <div className="text-5xl">✅</div>
            <h3 className="text-white font-bold text-lg">המשפט נשמר!</h3>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
              <p className="text-purple-200 text-sm italic">"{myStatement?.content || statement}"</p>
            </div>
            <p className="text-white/50 text-sm">ממתין לשאר השחקנים...</p>
          </div>
        )}

        {/* Progress */}
        <div className="mt-5 bg-white/5 rounded-2xl p-3 border border-white/10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/60 text-xs">הגישו משפט</span>
            <span className="text-white font-bold text-sm">{submittedCount} / {totalPlayers}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${totalPlayers > 0 ? (submittedCount / totalPlayers) * 100 : 0}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {players.map(player => {
              const hasSubmitted = trueStatements.some(s => s.player_id === player.id)
              return (
                <div key={player.id} className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs border ${hasSubmitted ? 'bg-green-500/20 border-green-500/40 text-green-300' : 'bg-white/5 border-white/10 text-white/40'}`}>
                  <AvatarDisplay seed={player.avatar_seed} size={16} />
                  <span>{player.name}</span>
                  {hasSubmitted && <span>✓</span>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
