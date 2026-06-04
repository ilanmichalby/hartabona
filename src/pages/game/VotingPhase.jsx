import { useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { shuffleArray } from '../../lib/gameUtils'
import AvatarDisplay from '../../components/AvatarDisplay'

export default function VotingPhase({ game, players, myPlayer, roundStatements, votes, currentQuestion }) {
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isQuestionsMode = game.mode === 'questions'

  const subjectPlayer = !isQuestionsMode ? players[game.current_round] : null
  const isSubject = !isQuestionsMode && myPlayer?.id === subjectPlayer?.id

  const myVote = votes.find(v => v.voter_id === myPlayer?.id && v.round_number === game.current_round)

  // Statements for this round, shuffled once (stable via useMemo)
  // In questions mode: everyone votes (no subject), filter only own statement out
  const shuffledStatements = useMemo(() => {
    const stmts = roundStatements.filter(
      s => s.round_number === game.current_round && s.author_id !== myPlayer?.id
    )
    return shuffleArray(stmts)
  }, [roundStatements.length, game.current_round])

  const votedCount = votes.filter(v => v.round_number === game.current_round).length
  const expectedVotes = isQuestionsMode ? players.length : players.length - 1

  const totalRounds = isQuestionsMode ? undefined : players.length
  const roundLabel = `שאלה ${game.current_round + 1}${isQuestionsMode ? '' : ` מתוך ${totalRounds}`}`

  async function handleVote() {
    if (!selectedId) return
    setLoading(true)
    setError('')
    try {
      const { error: err } = await supabase.from('votes').insert({
        game_id: game.id,
        round_number: game.current_round,
        voter_id: myPlayer.id,
        statement_id: selectedId,
      })
      if (err) throw err
    } catch {
      setError('שגיאה בהצבעה')
    }
    setLoading(false)
  }

  // ── Questions mode UI ──────────────────────────────────────────
  if (isQuestionsMode) {
    return (
      <div className="min-h-screen flex flex-col items-center px-4 py-6">
        <div className="w-full max-w-sm slide-up">
          <div className="text-center mb-3">
            <span className="text-cyan-400 text-sm font-medium bg-cyan-500/20 px-3 py-1 rounded-full border border-cyan-500/30">
              {roundLabel}
            </span>
          </div>

          {/* Question card */}
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-3xl p-5 border border-cyan-400/30 mb-4 glow-pulse">
            <p className="text-cyan-300 text-xs font-bold mb-2 text-center uppercase tracking-wide">❓ השאלה</p>
            <p className="text-white font-bold text-lg text-center leading-snug">
              {currentQuestion?.text || '...'}
            </p>
          </div>

          {myVote ? (
            <div className="bg-white/10 rounded-3xl p-6 border border-white/20 text-center space-y-3">
              <div className="text-5xl">✅</div>
              <h3 className="text-white font-bold text-lg">הצבעת!</h3>
              <p className="text-white/50 text-sm">ממתין לשאר...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-white/70 text-sm text-center mb-2">
                איזו תשובה לדעתך היא האמיתית?
              </p>
              {shuffledStatements.map((stmt, idx) => (
                <button
                  key={stmt.id}
                  onClick={() => setSelectedId(stmt.id)}
                  className={`w-full text-right p-4 rounded-2xl border transition-all duration-200 card-hover ${
                    selectedId === stmt.id
                      ? 'selected-card'
                      : 'bg-white/8 border-white/15 hover:bg-white/12 hover:border-white/25'
                  }`}
                >
                  <div className="flex gap-3 items-start">
                    <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border ${
                      selectedId === stmt.id
                        ? 'bg-cyan-500 border-cyan-400 text-white'
                        : 'bg-white/10 border-white/20 text-white/60'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-white text-sm leading-relaxed">{stmt.content}</span>
                  </div>
                </button>
              ))}

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}

              <button
                onClick={handleVote}
                disabled={!selectedId || loading}
                className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-lg py-4 rounded-2xl transition-all hover:-translate-y-0.5"
              >
                {loading ? '⏳ שולח...' : '🗳️ הצבע!'}
              </button>
            </div>
          )}

          {/* Progress */}
          <div className="mt-4 bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/60 text-xs">הצביעו</span>
              <span className="text-white font-bold text-sm">{votedCount} / {expectedVotes}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${expectedVotes > 0 ? (votedCount / expectedVotes) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Classic mode UI ────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6">
      <div className="w-full max-w-sm slide-up">
        {/* Round indicator */}
        <div className="text-center mb-3">
          <span className="text-purple-400 text-sm font-medium bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30">
            {roundLabel}
          </span>
        </div>

        {/* Subject header */}
        <div className="flex items-center gap-3 bg-white/10 rounded-2xl p-3 border border-white/20 mb-4">
          <AvatarDisplay seed={subjectPlayer?.avatar_seed} size={48} />
          <div>
            <p className="text-white/60 text-xs">מי הוא/היא באמת?</p>
            <h2 className="text-white font-black text-xl">{subjectPlayer?.name}</h2>
          </div>
          <div className="mr-auto text-2xl">🗳️</div>
        </div>

        {isSubject ? (
          <div className="bg-white/10 rounded-3xl p-6 border border-white/20 text-center space-y-3">
            <div className="text-5xl float-anim">⏳</div>
            <h3 className="text-white font-bold text-lg">מצביעים עליך!</h3>
            <p className="text-purple-300 text-sm">השחקנים בוחרים מה לדעתם אמיתי</p>
          </div>
        ) : myVote ? (
          <div className="bg-white/10 rounded-3xl p-6 border border-white/20 text-center space-y-3">
            <div className="text-5xl">✅</div>
            <h3 className="text-white font-bold text-lg">הצבעת!</h3>
            <p className="text-white/50 text-sm">ממתין לשאר...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-white/70 text-sm text-center mb-2">
              איזה משפט לדעתך הוא האמיתי?
            </p>
            {shuffledStatements.map((stmt, idx) => (
              <button
                key={stmt.id}
                onClick={() => setSelectedId(stmt.id)}
                className={`w-full text-right p-4 rounded-2xl border transition-all duration-200 card-hover ${
                  selectedId === stmt.id
                    ? 'selected-card'
                    : 'bg-white/8 border-white/15 hover:bg-white/12 hover:border-white/25'
                }`}
              >
                <div className="flex gap-3 items-start">
                  <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold border ${
                    selectedId === stmt.id
                      ? 'bg-purple-500 border-purple-400 text-white'
                      : 'bg-white/10 border-white/20 text-white/60'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="text-white text-sm leading-relaxed">{stmt.content}</span>
                </div>
              </button>
            ))}

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              onClick={handleVote}
              disabled={!selectedId || loading}
              className="w-full mt-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white font-bold text-lg py-4 rounded-2xl transition-all hover:-translate-y-0.5"
            >
              {loading ? '⏳ שולח...' : '🗳️ הצבע!'}
            </button>
          </div>
        )}

        {/* Progress */}
        <div className="mt-4 bg-white/5 rounded-2xl p-3 border border-white/10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/60 text-xs">הצביעו</span>
            <span className="text-white font-bold text-sm">{votedCount} / {expectedVotes}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${expectedVotes > 0 ? (votedCount / expectedVotes) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
