import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import AvatarDisplay from '../../components/AvatarDisplay'

function normalizeAnswer(str) {
  return str.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.,!?;:'"()\-]/g, '')
}

export default function FabricatingPhase({ game, players, myPlayer, isHost, onForceAdvance, roundStatements, currentQuestion }) {
  const [statement, setStatement] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isQuestionsMode = game.mode === 'questions'

  // Classic mode
  const subjectPlayer = !isQuestionsMode ? players[game.current_round] : null
  const isSubject = !isQuestionsMode && myPlayer?.id === subjectPlayer?.id

  const myFake = roundStatements.find(
    s => s.author_id === myPlayer?.id && s.round_number === game.current_round && !s.is_true
  )

  const fakesCount = roundStatements.filter(s => s.round_number === game.current_round && !s.is_true).length
  const expectedFakes = isQuestionsMode ? players.length : players.length - 1

  const totalRounds = isQuestionsMode ? undefined : players.length
  const roundLabel = `שאלה ${game.current_round + 1}${isQuestionsMode ? '' : ` מתוך ${totalRounds}`}`

  async function handleSubmit() {
    const trimmed = statement.trim()
    if (!trimmed) { setError('נא לכתוב תשובה'); return }
    if (trimmed.length < 2) { setError('הקצר מדי'); return }
    if (trimmed.length > 150) { setError('ארוך מדי (עד 150 תווים)'); return }

    // Validate: not the correct answer
    if (isQuestionsMode && currentQuestion) {
      if (normalizeAnswer(trimmed) === normalizeAnswer(currentQuestion.correct_answer)) {
        setError('😄 זאת התשובה הנכונה! תמציא חירטוט אחר')
        return
      }
    }

    setLoading(true); setError('')
    try {
      const { error: err } = await supabase.from('round_statements').insert({
        game_id: game.id,
        round_number: game.current_round,
        subject_player_id: isQuestionsMode ? null : subjectPlayer?.id,
        author_id: myPlayer.id,
        content: trimmed,
        is_true: false,
        ...(isQuestionsMode && currentQuestion ? { question_id: currentQuestion.id } : {}),
      })
      if (err) throw err
    } catch { setError('שגיאה בשמירה') }
    setLoading(false)
  }

  // ── Questions mode UI ──────────────────────────────────────────
  if (isQuestionsMode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm slide-up">
          <div className="text-center mb-2">
            <span className="text-cyan-400 text-sm font-medium bg-cyan-500/20 px-3 py-1 rounded-full border border-cyan-500/30">
              {roundLabel}
            </span>
          </div>

          {/* Question card */}
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-3xl p-5 border border-cyan-400/30 mb-5 glow-pulse">
            <p className="text-cyan-300 text-xs font-bold mb-2 text-center uppercase tracking-wide">❓ השאלה</p>
            <p className="text-white font-bold text-lg text-center leading-snug">
              {currentQuestion?.text || '...'}
            </p>
          </div>

          {myFake ? (
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 text-center space-y-3">
              <div className="text-5xl">🎭</div>
              <h3 className="text-white font-bold text-lg">החירטוט שלך נשמר!</h3>
              <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <p className="text-cyan-200 text-sm italic">"{myFake.content}"</p>
              </div>
              <p className="text-white/50 text-sm">ממתין לשאר...</p>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 space-y-4">
              <p className="text-white/70 text-sm text-center">
                כתוב תשובה מפוברקת שתישמע אמיתית 😈
              </p>
              <input
                type="text"
                value={statement}
                onChange={e => { setStatement(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="התשובה המפוברקת שלך..."
                maxLength={150}
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400 focus:bg-white/15 transition-all text-base"
                autoFocus
              />
              <div className="flex justify-between items-center">
                <span className="text-white/40 text-xs">{statement.length}/150</span>
                {error && <span className="text-red-400 text-xs text-left">{error}</span>}
              </div>
              <button onClick={handleSubmit} disabled={loading || !statement.trim()}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-lg py-4 rounded-2xl transition-all hover:-translate-y-0.5">
                {loading ? '⏳ שולח...' : '🎭 שלח חירטוט!'}
              </button>
            </div>
          )}

          <div className="mt-4 bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/60 text-xs">חירטוטים שהתקבלו</span>
              <span className="text-white font-bold text-sm">{fakesCount} / {expectedFakes}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${expectedFakes > 0 ? (fakesCount / expectedFakes) * 100 : 0}%` }} />
            </div>
            {isHost && fakesCount < expectedFakes && (
              <button
                onClick={onForceAdvance}
                className="w-full mt-3 border border-white/20 bg-white/5 hover:bg-white/12 text-white/50 hover:text-white/80 text-xs py-2 rounded-xl transition-all"
              >
                ⚡ עבור להצבעה עכשיו · {expectedFakes - fakesCount} לא הגישו
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Classic mode UI ────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm slide-up">
        <div className="text-center mb-1">
          <span className="text-purple-400 text-sm font-medium bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30">
            {roundLabel}
          </span>
        </div>

        <div className="text-center my-5">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border-2 border-yellow-400/60 overflow-hidden glow-pulse">
            <AvatarDisplay seed={subjectPlayer?.avatar_seed} size={96} />
          </div>
          <h2 className="text-2xl font-black text-white mt-3">
            {isSubject ? 'זה הסבב שלך!' : (
              <>כתוב משפט על <span className="text-yellow-300">{subjectPlayer?.name}</span></>
            )}
          </h2>
        </div>

        {isSubject ? (
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 text-center space-y-3">
            <div className="text-5xl float-anim">⏳</div>
            <h3 className="text-white font-bold text-lg">עכשיו מחרטבים עליך!</h3>
            <p className="text-purple-300 text-sm">שאר השחקנים ממציאים עליך סיפורים</p>
            <p className="text-white/40 text-xs">שב/י בשקט ואל תרמוז על האמת 😄</p>
          </div>
        ) : myFake ? (
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 text-center space-y-3">
            <div className="text-5xl">🎭</div>
            <h3 className="text-white font-bold text-lg">החירטוט שלך נשמר!</h3>
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
              <p className="text-purple-200 text-sm italic">"{myFake.content}"</p>
            </div>
            <p className="text-white/50 text-sm">ממתין לשאר להגיש...</p>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 shadow-2xl space-y-4">
            <p className="text-white/70 text-sm text-center">
              כתוב משפט שנשמע אמיתי — כאילו <span className="text-yellow-300 font-bold">{subjectPlayer?.name}</span> כתב/ה אותו
            </p>
            <textarea value={statement} onChange={e => setStatement(e.target.value)}
              placeholder={`"כשהייתי ילד/ה..."`} maxLength={150} rows={3}
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-yellow-400 focus:bg-white/15 transition-all resize-none text-base"
            />
            <div className="flex justify-between items-center">
              <span className="text-white/40 text-xs">{statement.length}/150</span>
              {error && <span className="text-red-400 text-xs">{error}</span>}
            </div>
            <button onClick={handleSubmit} disabled={loading || !statement.trim()}
              className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 disabled:opacity-50 text-white font-bold text-lg py-4 rounded-2xl transition-all hover:-translate-y-0.5">
              {loading ? '⏳ שולח...' : '🎭 שלח חירטוט!'}
            </button>
          </div>
        )}

        <div className="mt-4 bg-white/5 rounded-2xl p-3 border border-white/10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/60 text-xs">חירטוטים שהתקבלו</span>
            <span className="text-white font-bold text-sm">{fakesCount} / {expectedFakes}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${expectedFakes > 0 ? (fakesCount / expectedFakes) * 100 : 0}%` }} />
          </div>
          {isHost && fakesCount < expectedFakes && (
            <button
              onClick={onForceAdvance}
              className="w-full mt-3 border border-white/20 bg-white/5 hover:bg-white/12 text-white/50 hover:text-white/80 text-xs py-2 rounded-xl transition-all"
            >
              ⚡ עבור להצבעה עכשיו · {expectedFakes - fakesCount} לא הגישו
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
