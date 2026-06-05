import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'
import AnimatedBg from '../components/AnimatedBg'
import LoadingSpinner from '../components/LoadingSpinner'
import QuestionSetupPanel from '../components/QuestionSetupPanel'

export default function ContributorPage() {
  const { contributorCode } = useParams()
  const { setTheme } = useTheme()
  const [game, setGame] = useState(null)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [contributorName, setContributorName] = useState(
    localStorage.getItem('hartabona_contributor_name') || ''
  )
  const [nameSet, setNameSet] = useState(!!localStorage.getItem('hartabona_contributor_name'))

  useEffect(() => { loadGame() }, [contributorCode])

  async function loadGame() {
    setLoading(true)
    try {
      const { data, error: err } = await supabase
        .from('games')
        .select('*')
        .eq('contributor_code', contributorCode?.toUpperCase())
        .single()
      if (err || !data) { setError('קוד תרומה לא נמצא'); setLoading(false); return }
      if (data.status !== 'lobby') { setError('המשחק כבר התחיל, לא ניתן להוסיף שאלות'); setLoading(false); return }
      setGame(data)
      setTheme(data.theme || 'current')

      // טוען רק את השאלות של התורם הנוכחי — כך שלא יראה שאלות של אחרים
      const storedName = localStorage.getItem('hartabona_contributor_name')
      if (storedName) {
        const { data: qs } = await supabase
          .from('questions').select('*')
          .eq('game_id', data.id)
          .eq('author_name', storedName)
          .order('order_index', { ascending: true })
        setQuestions(qs || [])
      }
      // אם אין שם — לא טוענים שאלות כלל (הטופס לבחירת שם יוצג במקום)
    } catch { setError('שגיאה בטעינה') }
    setLoading(false)
  }

  // Realtime for questions
  useEffect(() => {
    if (!game) return
    const channel = supabase.channel(`contributor-qs-${game.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions', filter: `game_id=eq.${game.id}` },
        payload => {
          const myName = localStorage.getItem('hartabona_contributor_name')
          if (payload.eventType === 'INSERT') {
            // מציג רק שאלות שהתורם הזה כתב
            if (myName && payload.new.author_name !== myName) return
            setQuestions(prev => prev.find(q => q.id === payload.new.id) ? prev : [...prev, payload.new])
          } else if (payload.eventType === 'UPDATE') {
            // מעדכן רק שאלות שמופיעות אצלנו כבר
            setQuestions(prev => prev.map(q => q.id === payload.new.id ? payload.new : q))
          } else if (payload.eventType === 'DELETE') {
            setQuestions(prev => prev.filter(q => q.id !== payload.old.id))
          }
        })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [game?.id])

  async function saveName() {
    const trimmed = contributorName.trim()
    if (!trimmed) return
    localStorage.setItem('hartabona_contributor_name', trimmed)
    setContributorName(trimmed)
    setNameSet(true)
    // טוענים את השאלות של התורם הזה (אחרי שהשם נקבע)
    if (game) {
      const { data: qs } = await supabase
        .from('questions').select('*')
        .eq('game_id', game.id)
        .eq('author_name', trimmed)
        .order('order_index', { ascending: true })
      setQuestions(qs || [])
    }
  }

  if (loading) return (
    <AnimatedBg>
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="טוען..." />
      </div>
    </AnimatedBg>
  )

  if (error) return (
    <AnimatedBg>
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div>
          <div className="text-5xl mb-3">😕</div>
          <p className="text-white text-lg font-bold">{error}</p>
          <a href="/" className="text-purple-300 hover:text-white text-sm mt-4 block transition-colors">חזרה לדף הבית</a>
        </div>
      </div>
    </AnimatedBg>
  )

  return (
    <AnimatedBg>
      <div className="min-h-screen flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-sm slide-up">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-2 float-anim">✍️</div>
            <h1 className="text-2xl font-black text-white">כתוב שאלות</h1>
            <p className="text-purple-300 text-sm mt-1">
              עבור: <span className="font-bold text-white">{game.subject_name || 'המשחק'}</span>
            </p>
            <p className="text-white/40 text-xs mt-1">
              השאלות שלך יופיעו למנהל המשחק לאישור
            </p>
          </div>

          {!nameSet ? (
            /* Name entry */
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 space-y-4">
              <p className="text-white/70 text-sm text-center">
                איך לקרוא לך? (יופיע ליד השאלות שלך)
              </p>
              <input
                type="text"
                value={contributorName}
                onChange={e => setContributorName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveName()}
                placeholder="השם שלך"
                maxLength={20}
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white text-center text-lg placeholder:text-white/30 focus:outline-none focus:border-purple-400 transition-all"
                autoFocus
              />
              <button
                onClick={saveName}
                disabled={!contributorName.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition-all"
              >
                המשך →
              </button>
            </div>
          ) : (
            /* Question panel */
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                <span className="text-white/60 text-sm">שלום,</span>
                <span className="text-white font-bold text-sm">{contributorName}</span>
                <button
                  onClick={() => setNameSet(false)}
                  className="mr-auto text-white/30 hover:text-white/60 text-xs transition-colors"
                >
                  שנה שם
                </button>
              </div>

              <p className="text-white/60 text-xs text-center">
                כתוב שאלות שרק אתה יודע את תשובתן 🤫<br />
                התשובה הנכונה <strong className="text-white">לא תיחשף</strong> לשחקנים
              </p>

              <QuestionSetupPanel
                game={game}
                questions={questions}
                isHost={false}
                authorName={contributorName}
              />

              <div className="pt-3 border-t border-white/10 space-y-2">
                {game.allow_contributor_join !== false && (
                  <a
                    href={`/game/${game.code}`}
                    className="block w-full text-center bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-2xl transition-all shadow-lg hover:-translate-y-0.5"
                  >
                    🎮 כניסה למשחק כשחקן
                  </a>
                )}
                <p className="text-white/30 text-xs text-center">
                  מנהל המשחק יבחר אילו שאלות להכניס
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AnimatedBg>
  )
}
