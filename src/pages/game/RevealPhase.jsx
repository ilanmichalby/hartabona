import { useState, useEffect } from 'react'
import AvatarDisplay from '../../components/AvatarDisplay'

export default function RevealPhase({ game, players, myPlayer, isHost, roundStatements, votes, onContinue, currentQuestion }) {
  const [revealed, setRevealed] = useState(false)
  const [continuing, setContinuing] = useState(false)

  const isQuestionsMode = game.mode === 'questions'
  const subjectPlayer = !isQuestionsMode ? players[game.current_round] : null

  const roundRS = roundStatements.filter(s => s.round_number === game.current_round)
  const roundVotes = votes.filter(v => v.round_number === game.current_round)
  const trueStatement = roundRS.find(s => s.is_true)

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 800)
    return () => clearTimeout(timer)
  }, [])

  // Enrich statements with vote info
  const enrichedStatements = roundRS.map(stmt => {
    const stmtVotes = roundVotes.filter(v => v.statement_id === stmt.id)
    const author = stmt.author_id ? players.find(p => p.id === stmt.author_id) : null
    const voters = stmtVotes.map(v => players.find(p => p.id === v.voter_id)).filter(Boolean)
    const myVoteHere = stmtVotes.find(v => v.voter_id === myPlayer?.id)
    return { ...stmt, author, voters, myVoteHere }
  }).sort((a, b) => b.voters.length - a.voters.length)

  const myVote = roundVotes.find(v => v.voter_id === myPlayer?.id)
  const myVotedStmt = myVote ? roundRS.find(s => s.id === myVote.statement_id) : null
  const iGotItRight = myVotedStmt?.is_true
  const isSubject = !isQuestionsMode && myPlayer?.id === subjectPlayer?.id

  async function handleContinue() {
    setContinuing(true)
    await onContinue()
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 pb-24">
      <div className="w-full max-w-sm slide-up">
        {/* Header */}
        <div className="text-center mb-4">
          <span className={`text-sm font-medium px-3 py-1 rounded-full border ${
            isQuestionsMode
              ? 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30'
              : 'text-orange-400 bg-orange-500/20 border-orange-500/30'
          }`}>
            {isQuestionsMode
              ? `שאלה ${game.current_round + 1} — גילוי`
              : `סבב ${game.current_round + 1} — גילוי`}
          </span>
        </div>

        {/* Question / Subject display */}
        {isQuestionsMode ? (
          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-3xl p-5 border border-cyan-400/30 mb-4">
            <p className="text-cyan-300 text-xs font-bold mb-2 text-center uppercase tracking-wide">❓ השאלה</p>
            <p className="text-white font-bold text-lg text-center leading-snug">
              {currentQuestion?.text || '...'}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-white/10 rounded-2xl p-3 border border-white/20 mb-4">
            <AvatarDisplay seed={subjectPlayer?.avatar_seed} size={48} />
            <div>
              <p className="text-white/60 text-xs">המשפט האמיתי של</p>
              <h2 className="text-white font-black text-xl">{subjectPlayer?.name}</h2>
            </div>
            <div className="mr-auto text-2xl">🔍</div>
          </div>
        )}

        {/* My result banner */}
        {!isSubject && myVote && (
          <div className={`rounded-2xl p-3 mb-4 border text-center font-bold ${
            iGotItRight
              ? 'bg-green-500/20 border-green-500/40 text-green-300'
              : 'bg-red-500/20 border-red-500/40 text-red-300'
          }`}>
            {iGotItRight ? '🎉 +200 ניחשת נכון!' : '😅 נפלת בפח!'}
          </div>
        )}

        {/* Statements reveal */}
        <div className="space-y-3">
          {enrichedStatements.map((stmt, idx) => (
            <div
              key={stmt.id}
              className={`rounded-2xl border p-4 transition-all duration-500 ${
                stmt.is_true
                  ? 'bg-green-500/20 border-green-400/60 shadow-lg shadow-green-500/20'
                  : 'bg-white/8 border-white/15'
              } ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${idx * 150}ms` }}
            >
              {/* Statement text */}
              <div className="flex gap-2 items-start mb-3">
                <span className="text-xl shrink-0">{stmt.is_true ? '✅' : '🎭'}</span>
                <p className="text-white text-sm leading-relaxed flex-1">{stmt.content}</p>
              </div>

              {/* Author */}
              {stmt.author && !stmt.is_true && (
                <div className="flex items-center gap-1.5 mb-2">
                  <AvatarDisplay seed={stmt.author.avatar_seed} size={18} />
                  <span className="text-white/60 text-xs">כתב/ה: {stmt.author.name}</span>
                  {stmt.voters.length > 0 && (
                    <span className="mr-auto text-orange-300 text-xs font-bold">
                      +{stmt.voters.length * 100} נק׳
                    </span>
                  )}
                </div>
              )}
              {stmt.is_true && (
                <div className="flex items-center gap-1.5 mb-2">
                  {isQuestionsMode ? (
                    <span className="text-green-300 text-xs font-bold">✓ התשובה הנכונה!</span>
                  ) : (
                    <>
                      <AvatarDisplay seed={subjectPlayer?.avatar_seed} size={18} />
                      <span className="text-green-300 text-xs font-bold">✓ המשפט האמיתי!</span>
                    </>
                  )}
                  {stmt.voters.length > 0 && (
                    <span className="mr-auto text-green-300 text-xs font-bold">
                      {stmt.voters.length} ניחשו נכון ✓
                    </span>
                  )}
                </div>
              )}

              {/* Voters */}
              {stmt.voters.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-white/10">
                  {stmt.voters.map(voter => (
                    <div key={voter.id} className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5">
                      <AvatarDisplay seed={voter.avatar_seed} size={14} />
                      <span className="text-white/70 text-xs">{voter.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Continue button (host only) */}
        {isHost && (
          <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4">
            <button
              onClick={handleContinue}
              disabled={continuing}
              className="w-full max-w-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-60 text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-xl hover:-translate-y-0.5"
            >
              {continuing ? '⏳...' : '📊 לתוצאות →'}
            </button>
          </div>
        )}
        {!isHost && (
          <div className="mt-6 text-center text-white/40 text-sm">
            ממתין למארח להמשיך...
          </div>
        )}
      </div>
    </div>
  )
}
