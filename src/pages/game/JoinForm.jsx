import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { getAvatarUrl, AVATAR_SEEDS } from '../../lib/gameUtils'
import AnimatedBg from '../../components/AnimatedBg'
import AvatarDisplay from '../../components/AvatarDisplay'

export default function JoinForm({ game, sessionToken, onJoined }) {
  const [name, setName] = useState('')
  const [avatarSeed, setAvatarSeed] = useState(AVATAR_SEEDS[Math.floor(Math.random() * AVATAR_SEEDS.length)])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [seedIndex, setSeedIndex] = useState(AVATAR_SEEDS.indexOf(avatarSeed))

  function prevAvatar() {
    const idx = (seedIndex - 1 + AVATAR_SEEDS.length) % AVATAR_SEEDS.length
    setSeedIndex(idx)
    setAvatarSeed(AVATAR_SEEDS[idx])
  }
  function nextAvatar() {
    const idx = (seedIndex + 1) % AVATAR_SEEDS.length
    setSeedIndex(idx)
    setAvatarSeed(AVATAR_SEEDS[idx])
  }

  async function handleJoin() {
    if (!name.trim()) { setError('נא להזין שם'); return }
    if (name.trim().length > 20) { setError('השם ארוך מדי (עד 20 תווים)'); return }
    setLoading(true)
    setError('')
    try {
      const { data: existing } = await supabase
        .from('players').select('id').eq('game_id', game.id).eq('name', name.trim()).single()
      if (existing) { setError('השם הזה כבר תפוס — בחר שם אחר'); setLoading(false); return }

      const { data, error: err } = await supabase
        .from('players')
        .insert({ game_id: game.id, name: name.trim(), avatar_seed: avatarSeed, session_token: sessionToken })
        .select().single()
      if (err) throw err
      onJoined(data)
    } catch (e) {
      setError('שגיאה בהצטרפות למשחק')
    }
    setLoading(false)
  }

  return (
    <AnimatedBg>
      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">🎭</div>
            <h1 className="text-3xl font-black text-white">הצטרף למשחק</h1>
            <p className="text-purple-300 mt-1">קוד משחק: <span className="font-bold text-white">{game.code}</span></p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-2xl space-y-5">
            {/* Avatar picker */}
            <div>
              <label className="text-white/70 text-sm font-medium block mb-3 text-center">בחר אוואטר</label>
              <div className="flex items-center justify-center gap-4">
                <button onClick={prevAvatar} className="text-2xl text-white/60 hover:text-white transition-colors w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                  ›
                </button>
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-2 border-purple-400/50 flex items-center justify-center overflow-hidden glow-pulse">
                    <AvatarDisplay seed={avatarSeed} size={88} />
                  </div>
                </div>
                <button onClick={nextAvatar} className="text-2xl text-white/60 hover:text-white transition-colors w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
                  ‹
                </button>
              </div>
              <p className="text-center text-white/40 text-xs mt-2">{seedIndex + 1} / {AVATAR_SEEDS.length}</p>
            </div>

            {/* Name input */}
            <div>
              <label className="text-white/70 text-sm font-medium block mb-2">השם שלך במשחק</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="למשל: יוסי הגיבור"
                maxLength={20}
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white text-center text-lg font-bold placeholder:text-white/30 focus:outline-none focus:border-purple-400 focus:bg-white/15 transition-all"
              />
            </div>

            {error && (
              <p className="text-red-400 text-center text-sm bg-red-500/10 rounded-xl px-4 py-2 border border-red-500/20">
                {error}
              </p>
            )}

            <button
              onClick={handleJoin}
              disabled={loading || !name.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-bold text-lg py-4 rounded-2xl transition-all duration-200 shadow-lg hover:-translate-y-0.5"
            >
              {loading ? '⏳ מצטרף...' : '🎮 כניסה למשחק!'}
            </button>
          </div>
        </div>
      </div>
    </AnimatedBg>
  )
}
