import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { generateGameCode } from '../lib/gameUtils'
import AnimatedBg from '../components/AnimatedBg'

export default function HomePage() {
  const navigate = useNavigate()
  const [view, setView] = useState('home') // home | join | questions-setup
  const [joinCode, setJoinCode] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function createClassicGame() {
    setLoading(true); setError('')
    try {
      const code = generateGameCode()
      const { data, error: err } = await supabase
        .from('games').insert({ code, status: 'lobby', current_round: 0, mode: 'classic' })
        .select().single()
      if (err) throw err
      navigate(`/game/${data.code}?host=1`)
    } catch { setError('שגיאה ביצירת המשחק. נסה שוב.') }
    setLoading(false)
  }

  async function createQuestionsGame() {
    if (!subjectName.trim()) { setError('נא להזין שם'); return }
    setLoading(true); setError('')
    try {
      const code = generateGameCode()
      const contributorCode = generateGameCode()
      const { data, error: err } = await supabase
        .from('games').insert({
          code, status: 'lobby', current_round: 0,
          mode: 'questions',
          subject_name: subjectName.trim(),
          contributor_code: contributorCode,
        })
        .select().single()
      if (err) throw err
      navigate(`/game/${data.code}?host=1`)
    } catch { setError('שגיאה ביצירת המשחק. נסה שוב.') }
    setLoading(false)
  }

  async function joinGame() {
    if (!joinCode.trim()) return
    setLoading(true); setError('')
    try {
      const code = joinCode.trim().toUpperCase()
      const { data, error: err } = await supabase
        .from('games').select('*').eq('code', code).single()
      if (err || !data) { setError('קוד משחק לא נמצא. בדוק שוב!'); setLoading(false); return }
      if (data.status === 'finished') { setError('המשחק הזה כבר הסתיים.'); setLoading(false); return }
      navigate(`/game/${data.code}`)
    } catch { setError('שגיאה. נסה שוב.') }
    setLoading(false)
  }

  return (
    <AnimatedBg>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
        {/* Logo */}
        <div className="float-anim mb-8 text-center">
          <div className="text-7xl mb-2">🎭</div>
          <h1 className="text-5xl font-black text-white tracking-tight">חרטבונה</h1>
          <p className="text-purple-300 text-lg mt-2 font-medium">מי יכול לזהות את האמת?</p>
        </div>

        <div className="w-full max-w-sm space-y-3">

          {/* ── Home ── */}
          {view === 'home' && (
            <>
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-2xl space-y-3">
                {/* Classic game */}
                <button onClick={createClassicGame} disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-60 text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0">
                  {loading ? '⏳ יוצר...' : '✨ משחק האמת והשקר'}
                </button>
                <p className="text-white/40 text-xs text-center px-2">כל שחקן כותב משפט אמת על עצמו</p>

                <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/15" /></div><div className="relative flex justify-center"><span className="bg-transparent px-3 text-white/30 text-xs">או</span></div></div>

                {/* Questions game */}
                <button onClick={() => { setView('questions-setup'); setError('') }} disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 disabled:opacity-60 text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0">
                  🎂 משחק שאלות (יום הולדת וכו׳)
                </button>
                <p className="text-white/40 text-xs text-center px-2">שאלות מוכנות מראש על בן/בת המזל</p>

                <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/15" /></div><div className="relative flex justify-center"><span className="bg-transparent px-3 text-white/30 text-xs">או</span></div></div>

                {/* Join */}
                <button onClick={() => { setView('join'); setError('') }}
                  className="w-full bg-white/10 hover:bg-white/18 text-white font-bold text-lg py-4 rounded-2xl border border-white/20 transition-all hover:-translate-y-0.5">
                  🔗 הצטרף למשחק קיים
                </button>
              </div>
              {error && <p className="text-red-400 text-center text-sm bg-red-500/10 rounded-2xl px-4 py-2 border border-red-500/20">{error}</p>}
            </>
          )}

          {/* ── Join ── */}
          {view === 'join' && (
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-2xl space-y-4">
              <button onClick={() => { setView('home'); setError('') }} className="text-purple-300 hover:text-white text-sm flex items-center gap-1 transition-colors">← חזרה</button>
              <div>
                <label className="text-white/70 text-sm font-medium block mb-2">הכנס קוד משחק</label>
                <input type="text" value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && joinGame()}
                  placeholder="ABCD12" maxLength={6}
                  className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-4 text-white text-center text-2xl font-bold tracking-widest placeholder:text-white/30 focus:outline-none focus:border-purple-400 focus:bg-white/15 transition-all"
                  autoFocus
                />
              </div>
              <button onClick={joinGame} disabled={loading || !joinCode.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-lg hover:-translate-y-0.5">
                {loading ? '⏳ מחפש...' : '🎮 כניסה למשחק'}
              </button>
              {error && <p className="text-red-400 text-center text-sm">{error}</p>}
            </div>
          )}

          {/* ── Questions game setup ── */}
          {view === 'questions-setup' && (
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-2xl space-y-4">
              <button onClick={() => { setView('home'); setError('') }} className="text-purple-300 hover:text-white text-sm flex items-center gap-1 transition-colors">← חזרה</button>

              <div className="text-center">
                <div className="text-3xl mb-1">🎂</div>
                <h2 className="text-white font-black text-xl">משחק שאלות</h2>
                <p className="text-white/50 text-xs mt-1">שאלות על אדם מסוים — מגניב ליום הולדת, ריונט וכו׳</p>
              </div>

              <div>
                <label className="text-white/70 text-sm font-medium block mb-2">על מי השאלות?</label>
                <input type="text" value={subjectName}
                  onChange={e => setSubjectName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createQuestionsGame()}
                  placeholder="שם בן/בת המזל" maxLength={30}
                  className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white text-center text-lg font-bold placeholder:text-white/30 focus:outline-none focus:border-cyan-400 focus:bg-white/15 transition-all"
                  autoFocus
                />
              </div>

              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-3 text-xs text-cyan-300 space-y-1">
                <p>📋 אחרי היצירה תקבל:</p>
                <p>• <strong>לינק שחקנים</strong> — לשלוח לכולם ביום האירוע</p>
                <p>• <strong>לינק כותבי שאלות</strong> — לשלוח לחברים קרובים לפני</p>
              </div>

              {error && <p className="text-red-400 text-center text-sm">{error}</p>}

              <button onClick={createQuestionsGame} disabled={loading || !subjectName.trim()}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-lg hover:-translate-y-0.5">
                {loading ? '⏳ יוצר...' : '🚀 צור משחק'}
              </button>
            </div>
          )}

          {/* How to play */}
          {view === 'home' && (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <h3 className="text-white/70 font-bold text-sm mb-3 text-center">איך משחקים?</h3>
              <div className="space-y-2 text-white/50 text-xs">
                <div className="flex gap-2"><span>📝</span><span>כל שחקן כותב משפט/תשובה — אמת אחת, שאר ממציאים</span></div>
                <div className="flex gap-2"><span>🗳️</span><span>כולם מצביעים על מה שנראה הכי אמיתי</span></div>
                <div className="flex gap-2"><span>🏆</span><span>200 על ניחוש נכון · 100 על כל מי שהפלת בפח</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AnimatedBg>
  )
}
