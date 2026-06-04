import { useState } from 'react'
import AvatarDisplay from '../../components/AvatarDisplay'
import QuestionSetupPanel from '../../components/QuestionSetupPanel'

export default function LobbyPhase({ game, players, myPlayer, isHost, onStartGame, gameCode, allQuestions }) {
  const [copied, setCopied] = useState(null) // 'player' | 'contributor' | null
  const [starting, setStarting] = useState(false)
  const [tab, setTab] = useState('players') // 'players' | 'questions'

  const isQuestionsMode = game.mode === 'questions'
  const selectedQuestionsCount = (allQuestions || []).filter(q => q.is_selected).length

  const inviteLink = `${window.location.origin}/game/${gameCode}`
  const contributorLink = game.contributor_code
    ? `${window.location.origin}/contribute/${game.contributor_code}`
    : null

  async function copyToClipboard(text, key) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleStart() {
    setStarting(true)
    await onStartGame()
    setStarting(false)
  }

  const canStartClassic = players.length >= 2
  const canStartQuestions = players.length >= 2 && selectedQuestionsCount >= 1
  const canStart = isQuestionsMode ? canStartQuestions : canStartClassic

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6 pb-28">
      {/* Header */}
      <div className="text-center slide-up w-full mb-4">
        <div className="text-4xl mb-1">{isQuestionsMode ? '🎂' : '🎭'}</div>
        <h1 className="text-3xl font-black text-white">
          {isQuestionsMode ? `שאלות על ${game.subject_name}` : 'חרטבונה'}
        </h1>
        <p className="text-purple-300 text-sm mt-0.5">ממתינים לשחקנים...</p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        {/* Game code */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center">
          <p className="text-white/50 text-xs mb-1">קוד המשחק</p>
          <div className="text-3xl font-black text-white tracking-widest mb-3">{gameCode}</div>
          <button onClick={() => copyToClipboard(inviteLink, 'player')}
            className="w-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-2 rounded-xl border border-white/15 transition-all flex items-center justify-center gap-2">
            {copied === 'player' ? '✅ הועתק!' : '🔗 העתק לינק שחקנים'}
          </button>
          {isQuestionsMode && contributorLink && (
            <button onClick={() => copyToClipboard(contributorLink, 'contributor')}
              className="w-full mt-2 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-sm font-medium py-2 rounded-xl border border-cyan-500/20 transition-all flex items-center justify-center gap-2">
              {copied === 'contributor' ? '✅ הועתק!' : '✍️ העתק לינק כותבי שאלות'}
            </button>
          )}
        </div>

        {/* Tabs (questions mode) */}
        {isQuestionsMode && isHost && (
          <div className="flex rounded-2xl overflow-hidden border border-white/15 bg-white/5">
            <button onClick={() => setTab('players')}
              className={`flex-1 py-2 text-sm font-bold transition-all ${tab === 'players' ? 'bg-purple-600 text-white' : 'text-white/50 hover:text-white/80'}`}>
              👥 שחקנים ({players.length})
            </button>
            <button onClick={() => setTab('questions')}
              className={`flex-1 py-2 text-sm font-bold transition-all ${tab === 'questions' ? 'bg-cyan-600 text-white' : 'text-white/50 hover:text-white/80'}`}>
              ❓ שאלות ({selectedQuestionsCount})
            </button>
          </div>
        )}

        {/* Players list */}
        {(!isQuestionsMode || !isHost || tab === 'players') && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <h3 className="text-white/70 text-sm font-medium mb-3 flex items-center justify-between">
              <span>שחקנים מחוברים</span>
              <span className="bg-purple-600/50 text-purple-200 text-xs px-2 py-0.5 rounded-full">{players.length}</span>
            </h3>
            <div className="space-y-2">
              {players.map(player => (
                <div key={player.id} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2 border border-white/10">
                  <AvatarDisplay seed={player.avatar_seed} size={36} />
                  <span className="text-white font-medium flex-1">{player.name}</span>
                  {player.id === game.host_id && (
                    <span className="text-yellow-400 text-xs bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">מארח</span>
                  )}
                  {player.id === myPlayer?.id && (
                    <span className="text-purple-300 text-xs">← אתה</span>
                  )}
                </div>
              ))}
              {players.length === 0 && <p className="text-white/40 text-sm text-center py-2">אין שחקנים עדיין...</p>}
            </div>
          </div>
        )}

        {/* Questions panel (host, questions mode) */}
        {isQuestionsMode && isHost && tab === 'questions' && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <QuestionSetupPanel
              game={game}
              questions={allQuestions || []}
              isHost={true}
              authorName={myPlayer?.name || 'מנהל המשחק'}
            />
          </div>
        )}

        {/* Non-host waiting message for questions mode */}
        {isQuestionsMode && !isHost && (
          <div className="bg-cyan-500/10 rounded-2xl p-3 border border-cyan-500/20 text-center">
            <p className="text-cyan-300 text-sm">🎂 משחק שאלות על <strong>{game.subject_name}</strong></p>
            <p className="text-white/40 text-xs mt-1">המנהל מכין שאלות...</p>
          </div>
        )}

        {/* Start button */}
        {isHost ? (
          <div>
            {!canStart && (
              <p className="text-white/50 text-xs text-center mb-2">
                {isQuestionsMode && selectedQuestionsCount === 0
                  ? 'הוסף לפחות שאלה אחת כדי להתחיל'
                  : 'צריך לפחות 2 שחקנים'}
              </p>
            )}
            <button onClick={handleStart} disabled={!canStart || starting}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-40 text-white font-black text-xl py-4 rounded-2xl transition-all shadow-lg hover:-translate-y-0.5 glow-pulse">
              {starting ? '⏳ מתחיל...' : '🚀 התחל משחק!'}
            </button>
          </div>
        ) : (
          <div className="text-center bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="text-2xl mb-2 animate-bounce">⏳</div>
            <p className="text-white/60 text-sm">ממתין למארח שיתחיל...</p>
          </div>
        )}
      </div>
    </div>
  )
}
