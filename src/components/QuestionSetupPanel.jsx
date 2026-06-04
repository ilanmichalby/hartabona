import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function QuestionSetupPanel({ game, questions, isHost, authorName }) {
  const [form, setForm] = useState({ text: '', correct_answer: '' })
  const [showForm, setShowForm] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')

  const selected = questions.filter(q => q.is_selected)

  async function addQuestion() {
    if (!form.text.trim()) { setError('חסרה השאלה'); return }
    if (!form.correct_answer.trim()) { setError('חסרה התשובה הנכונה'); return }
    setAdding(true); setError('')
    try {
      const maxOrder = questions.length > 0 ? Math.max(...questions.map(q => q.order_index)) : -1
      const { error: err } = await supabase.from('questions').insert({
        game_id: game.id,
        text: form.text.trim(),
        correct_answer: form.correct_answer.trim(),
        author_name: authorName || 'מנהל המשחק',
        is_selected: true,
        order_index: maxOrder + 1,
      })
      if (err) throw err
      setForm({ text: '', correct_answer: '' })
      setShowForm(false)
    } catch { setError('שגיאה בהוספה') }
    setAdding(false)
  }

  async function toggleSelected(q) {
    await supabase.from('questions').update({ is_selected: !q.is_selected }).eq('id', q.id)
  }

  async function moveUp(q, idx) {
    if (idx === 0) return
    const prev = questions[idx - 1]
    await Promise.all([
      supabase.from('questions').update({ order_index: prev.order_index }).eq('id', q.id),
      supabase.from('questions').update({ order_index: q.order_index }).eq('id', prev.id),
    ])
  }

  async function moveDown(q, idx) {
    if (idx === questions.length - 1) return
    const next = questions[idx + 1]
    await Promise.all([
      supabase.from('questions').update({ order_index: next.order_index }).eq('id', q.id),
      supabase.from('questions').update({ order_index: q.order_index }).eq('id', next.id),
    ])
  }

  async function deleteQuestion(q) {
    await supabase.from('questions').delete().eq('id', q.id)
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-bold text-sm">שאלות למשחק</p>
          {isHost && <p className="text-white/40 text-xs">{selected.length} נבחרו</p>}
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError('') }}
          className="bg-purple-600/60 hover:bg-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-purple-500/40 transition-all"
        >
          + הוסף שאלה
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white/5 rounded-2xl p-4 border border-purple-500/30 space-y-3">
          <textarea
            value={form.text}
            onChange={e => setForm(p => ({ ...p, text: e.target.value }))}
            placeholder="מה השאלה? למשל: מה הצבע האהוב של נועה?"
            rows={2}
            maxLength={200}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-400 resize-none"
          />
          <input
            type="text"
            value={form.correct_answer}
            onChange={e => setForm(p => ({ ...p, correct_answer: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && addQuestion()}
            placeholder="✓ התשובה הנכונה"
            maxLength={100}
            className="w-full bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-green-400"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={addQuestion}
              disabled={adding || !form.text.trim() || !form.correct_answer.trim()}
              className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-bold py-2 rounded-xl transition-all"
            >
              {adding ? '⏳...' : '✅ הוסף'}
            </button>
            <button onClick={() => { setShowForm(false); setError('') }}
              className="px-4 bg-white/10 hover:bg-white/20 text-white/70 text-sm rounded-xl transition-all">
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Questions list */}
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {questions.length === 0 && (
          <p className="text-white/40 text-sm text-center py-6">
            אין שאלות עדיין.<br />הוסף את הראשונה! 👆
          </p>
        )}
        {questions.map((q, idx) => (
          <div key={q.id}
            className={`rounded-xl p-3 border transition-all ${
              q.is_selected
                ? 'bg-white/8 border-white/20'
                : 'bg-white/3 border-white/8 opacity-50'
            }`}
          >
            <div className="flex gap-2 items-start">
              {/* Checkbox (host only) */}
              {isHost && (
                <input type="checkbox" checked={q.is_selected}
                  onChange={() => toggleSelected(q)}
                  className="mt-0.5 w-4 h-4 shrink-0 rounded accent-purple-500 cursor-pointer"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs leading-relaxed">{q.text}</p>
                <p className="text-green-400 text-xs mt-1 font-medium">✓ {q.correct_answer}</p>
                <p className="text-white/30 text-xs mt-0.5">— {q.author_name}</p>
              </div>
              {/* Controls */}
              <div className="flex flex-col gap-1 shrink-0 items-center">
                {isHost && (
                  <>
                    <button onClick={() => moveUp(q, idx)} disabled={idx === 0}
                      className="text-white/40 hover:text-white disabled:opacity-20 text-xs px-1 py-0.5 rounded hover:bg-white/10 transition-all">↑</button>
                    <button onClick={() => moveDown(q, idx)} disabled={idx === questions.length - 1}
                      className="text-white/40 hover:text-white disabled:opacity-20 text-xs px-1 py-0.5 rounded hover:bg-white/10 transition-all">↓</button>
                  </>
                )}
                <button onClick={() => deleteQuestion(q)}
                  className="text-red-400/50 hover:text-red-400 text-xs px-1 py-0.5 rounded hover:bg-red-500/10 transition-all">✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
