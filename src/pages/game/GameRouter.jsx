import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { getSessionToken, getPlayerForGame, savePlayerForGame } from '../../lib/gameUtils'
import AnimatedBg from '../../components/AnimatedBg'
import LoadingSpinner from '../../components/LoadingSpinner'
import JoinForm from './JoinForm'
import LobbyPhase from './LobbyPhase'
import WritingPhase from './WritingPhase'
import FabricatingPhase from './FabricatingPhase'
import VotingPhase from './VotingPhase'
import RevealPhase from './RevealPhase'
import LeaderboardPhase from './LeaderboardPhase'
import FinalPhase from './FinalPhase'

export default function GameRouter() {
  const { code } = useParams()
  const [searchParams] = useSearchParams()
  const isCreator = searchParams.get('host') === '1'
  const sessionToken = getSessionToken()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [game, setGame] = useState(null)
  const [players, setPlayers] = useState([])
  const [myPlayer, setMyPlayer] = useState(null)
  const [showJoinForm, setShowJoinForm] = useState(false)
  const [trueStatements, setTrueStatements] = useState([])
  const [roundStatements, setRoundStatements] = useState([])
  const [votes, setVotes] = useState([])
  const [questions, setQuestions] = useState([]) // questions mode only

  const advancingRef = useRef(false)
  const gameRef = useRef(null)
  const playersRef = useRef([])
  const trueStatementsRef = useRef([])
  const roundStatementsRef = useRef([])
  const votesRef = useRef([])
  const myPlayerRef = useRef(null)
  const questionsRef = useRef([])

  useEffect(() => { gameRef.current = game }, [game])
  useEffect(() => { playersRef.current = players }, [players])
  useEffect(() => { trueStatementsRef.current = trueStatements }, [trueStatements])
  useEffect(() => { roundStatementsRef.current = roundStatements }, [roundStatements])
  useEffect(() => { votesRef.current = votes }, [votes])
  useEffect(() => { myPlayerRef.current = myPlayer }, [myPlayer])
  useEffect(() => { questionsRef.current = questions }, [questions])

  const isHost = !!(myPlayer && game && myPlayer.id === game.host_id)
  const isQuestionsMode = game?.mode === 'questions'

  // ─── Load initial data ─────────────────────────────────────────
  useEffect(() => { loadGameData() }, [code])

  async function loadGameData() {
    setLoading(true)
    try {
      const upperCode = code.toUpperCase()
      const { data: gameData, error: gameErr } = await supabase
        .from('games').select('*').eq('code', upperCode).single()
      if (gameErr || !gameData) { setError('משחק לא נמצא'); setLoading(false); return }
      setGame(gameData)

      const { data: playersData } = await supabase
        .from('players').select('*').eq('game_id', gameData.id).order('created_at', { ascending: true })
      setPlayers(playersData || [])

      // Find my player
      let myP = null
      const savedId = getPlayerForGame(upperCode)
      if (savedId) myP = (playersData || []).find(p => p.id === savedId)
      if (!myP) myP = (playersData || []).find(p => p.session_token === sessionToken)

      if (myP) {
        setMyPlayer(myP)
        savePlayerForGame(upperCode, myP.id)
        if (isCreator && !gameData.host_id) {
          await supabase.from('games').update({ host_id: myP.id }).eq('id', gameData.id)
          setGame(g => ({ ...g, host_id: myP.id }))
        }
      } else {
        if (gameData.status === 'lobby') setShowJoinForm(true)
        else setError('המשחק כבר התחיל ולא ניתן להצטרף')
      }

      await loadRoundData(gameData.id, gameData.current_round)

      if (gameData.mode !== 'questions') {
        const { data: tsData } = await supabase
          .from('true_statements').select('*').eq('game_id', gameData.id)
        setTrueStatements(tsData || [])
      } else {
        const { data: qsData } = await supabase
          .from('questions').select('*').eq('game_id', gameData.id)
          .order('order_index', { ascending: true })
        setQuestions(qsData || [])
      }
    } catch { setError('שגיאה בטעינת המשחק') }
    setLoading(false)
  }

  async function loadRoundData(gameId, roundNumber) {
    const [rsRes, votesRes] = await Promise.all([
      supabase.from('round_statements').select('*').eq('game_id', gameId).eq('round_number', roundNumber),
      supabase.from('votes').select('*').eq('game_id', gameId).eq('round_number', roundNumber),
    ])
    setRoundStatements(rsRes.data || [])
    setVotes(votesRes.data || [])
  }

  // ─── Realtime ──────────────────────────────────────────────────
  useEffect(() => {
    if (!game) return
    const gameId = game.id

    const channel = supabase.channel(`hartabona-${gameId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
        async payload => {
          if (!payload.new) return
          const newGame = payload.new
          const prevGame = gameRef.current
          setGame(newGame)
          if (newGame.current_round !== prevGame?.current_round ||
            (newGame.status !== prevGame?.status && ['fabricating', 'voting', 'reveal'].includes(newGame.status))) {
            await loadRoundData(gameId, newGame.current_round)
          }
        })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${gameId}` },
        payload => {
          if (payload.eventType === 'INSERT')
            setPlayers(prev => prev.find(p => p.id === payload.new.id) ? prev : [...prev, payload.new])
          else if (payload.eventType === 'UPDATE') {
            setPlayers(prev => prev.map(p => p.id === payload.new.id ? payload.new : p))
            if (payload.new.id === myPlayerRef.current?.id) setMyPlayer(payload.new)
          } else if (payload.eventType === 'DELETE')
            setPlayers(prev => prev.filter(p => p.id !== payload.old.id))
        })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'true_statements', filter: `game_id=eq.${gameId}` },
        payload => setTrueStatements(prev => prev.find(s => s.id === payload.new.id) ? prev : [...prev, payload.new]))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'round_statements', filter: `game_id=eq.${gameId}` },
        payload => setRoundStatements(prev => prev.find(s => s.id === payload.new.id) ? prev : [...prev, payload.new]))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes', filter: `game_id=eq.${gameId}` },
        payload => setVotes(prev => prev.find(v => v.id === payload.new.id) ? prev : [...prev, payload.new]))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions', filter: `game_id=eq.${gameId}` },
        payload => {
          if (payload.eventType === 'INSERT')
            setQuestions(prev => prev.find(q => q.id === payload.new.id) ? prev : [...prev, payload.new].sort((a, b) => a.order_index - b.order_index))
          else if (payload.eventType === 'UPDATE')
            setQuestions(prev => prev.map(q => q.id === payload.new.id ? payload.new : q).sort((a, b) => a.order_index - b.order_index))
          else if (payload.eventType === 'DELETE')
            setQuestions(prev => prev.filter(q => q.id !== payload.old.id))
        })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [game?.id])

  // ─── Auto-advance (host only) ──────────────────────────────────
  useEffect(() => {
    if (!isHost || !game || advancingRef.current) return
    const g = game
    const ps = playersRef.current
    const ts = trueStatementsRef.current
    const rs = roundStatementsRef.current
    const vs = votesRef.current
    const qs = questionsRef.current

    const selectedQuestions = qs.filter(q => q.is_selected)

    if (g.mode === 'classic') {
      // Classic: subject is a player
      const subjectPlayer = ps[g.current_round]
      if (!subjectPlayer) return
      const nonSubject = ps.filter(p => p.id !== subjectPlayer.id)
      const fakes = rs.filter(s => s.round_number === g.current_round && !s.is_true)
      const roundVotes = vs.filter(v => v.round_number === g.current_round)

      if (g.status === 'writing') {
        const submittedIds = new Set(ts.map(s => s.player_id))
        if (ps.length >= 2 && ps.every(p => submittedIds.has(p.id))) advanceWritingToFabricating()
      } else if (g.status === 'fabricating') {
        if (nonSubject.length > 0 && fakes.length >= nonSubject.length) advanceFabricatingToVoting()
      } else if (g.status === 'voting') {
        if (nonSubject.length > 0 && roundVotes.length >= nonSubject.length) calculateScoresAndReveal()
      }
    } else {
      // Questions mode: all players write + vote
      const fakes = rs.filter(s => s.round_number === g.current_round && !s.is_true)
      const roundVotes = vs.filter(v => v.round_number === g.current_round)

      if (g.status === 'fabricating') {
        if (ps.length > 0 && fakes.length >= ps.length) advanceFabricatingToVoting()
      } else if (g.status === 'voting') {
        if (ps.length > 0 && roundVotes.length >= ps.length) calculateScoresAndReveal()
      }
    }
  }, [game?.status, trueStatements.length, roundStatements.length, votes.length, players.length, isHost])

  // ─── Advance functions ─────────────────────────────────────────
  async function advanceWritingToFabricating() {
    if (advancingRef.current) return
    advancingRef.current = true
    try {
      const g = gameRef.current
      const ps = playersRef.current
      const ts = trueStatementsRef.current
      const subjectPlayer = ps[0]
      if (!subjectPlayer) return
      const trueSt = ts.find(s => s.player_id === subjectPlayer.id)
      if (trueSt) {
        const exists = roundStatementsRef.current.find(s => s.round_number === 0 && s.is_true)
        if (!exists) await supabase.from('round_statements').insert({
          game_id: g.id, round_number: 0,
          subject_player_id: subjectPlayer.id, author_id: null,
          content: trueSt.content, is_true: true,
        })
      }
      await supabase.from('games').update({ status: 'fabricating', current_round: 0 }).eq('id', g.id)
    } finally { setTimeout(() => { advancingRef.current = false }, 2000) }
  }

  async function advanceFabricatingToVoting() {
    if (advancingRef.current) return
    advancingRef.current = true
    try {
      await supabase.from('games').update({ status: 'voting' }).eq('id', gameRef.current.id)
    } finally { setTimeout(() => { advancingRef.current = false }, 2000) }
  }

  async function calculateScoresAndReveal() {
    if (advancingRef.current) return
    advancingRef.current = true
    try {
      const g = gameRef.current
      const ps = playersRef.current
      const rs = roundStatementsRef.current
      const vs = votesRef.current
      const roundVotes = vs.filter(v => v.round_number === g.current_round)
      const roundRS = rs.filter(s => s.round_number === g.current_round)
      const changes = {}

      for (const vote of roundVotes) {
        const stmt = roundRS.find(s => s.id === vote.statement_id)
        if (!stmt) continue
        if (stmt.is_true) {
          if (!changes[vote.voter_id]) changes[vote.voter_id] = { score: 0, correct_count: 0, fooled_count: 0 }
          changes[vote.voter_id].score += 200
          changes[vote.voter_id].correct_count += 1
        } else if (stmt.author_id) {
          if (!changes[stmt.author_id]) changes[stmt.author_id] = { score: 0, correct_count: 0, fooled_count: 0 }
          changes[stmt.author_id].score += 100
          changes[stmt.author_id].fooled_count += 1
        }
      }
      for (const [pid, delta] of Object.entries(changes)) {
        const player = ps.find(p => p.id === pid)
        if (player) await supabase.from('players').update({
          score: player.score + delta.score,
          correct_count: player.correct_count + delta.correct_count,
          fooled_count: player.fooled_count + delta.fooled_count,
        }).eq('id', pid)
      }
      await supabase.from('games').update({ status: 'reveal' }).eq('id', g.id)
    } finally { setTimeout(() => { advancingRef.current = false }, 2000) }
  }

  async function advanceRevealToLeaderboard() {
    await supabase.from('games').update({ status: 'leaderboard' }).eq('id', game.id)
  }

  async function advanceToNextRound() {
    const nextRound = game.current_round + 1
    const selectedQuestions = questions.filter(q => q.is_selected)
    const totalRounds = isQuestionsMode ? selectedQuestions.length : players.length

    if (nextRound >= totalRounds) {
      await supabase.from('games').update({ status: 'finished' }).eq('id', game.id)
      return
    }

    if (isQuestionsMode) {
      // Insert true statement for next question
      const nextQ = selectedQuestions[nextRound]
      if (nextQ) {
        const exists = roundStatements.find(s => s.round_number === nextRound && s.is_true)
        if (!exists) await supabase.from('round_statements').insert({
          game_id: game.id, round_number: nextRound,
          subject_player_id: null, author_id: null,
          content: nextQ.correct_answer, is_true: true,
          question_id: nextQ.id,
        })
      }
    } else {
      // Classic: insert true statement for next player
      const nextSubject = players[nextRound]
      const trueSt = trueStatements.find(s => s.player_id === nextSubject.id)
      if (trueSt) {
        const exists = roundStatements.find(s => s.round_number === nextRound && s.is_true)
        if (!exists) await supabase.from('round_statements').insert({
          game_id: game.id, round_number: nextRound,
          subject_player_id: nextSubject.id, author_id: null,
          content: trueSt.content, is_true: true,
        })
      }
    }
    await supabase.from('games').update({ status: 'fabricating', current_round: nextRound }).eq('id', game.id)
  }

  async function startGame() {
    if (isQuestionsMode) {
      // Questions mode: go directly to fabricating, copy first question's answer
      const selectedQuestions = questions.filter(q => q.is_selected).sort((a, b) => a.order_index - b.order_index)
      if (selectedQuestions.length === 0) return
      const firstQ = selectedQuestions[0]
      const exists = roundStatements.find(s => s.round_number === 0 && s.is_true)
      if (!exists) {
        await supabase.from('round_statements').insert({
          game_id: game.id, round_number: 0,
          subject_player_id: null, author_id: null,
          content: firstQ.correct_answer, is_true: true,
          question_id: firstQ.id,
        })
      }
      await supabase.from('games').update({ status: 'fabricating', current_round: 0 }).eq('id', game.id)
    } else {
      await supabase.from('games').update({ status: 'writing' }).eq('id', game.id)
    }
  }

  async function handleJoined(player) {
    setMyPlayer(player)
    savePlayerForGame(code.toUpperCase(), player.id)
    setShowJoinForm(false)
    const { data: allPlayers } = await supabase.from('players').select('*').eq('game_id', game.id).order('created_at', { ascending: true })
    setPlayers(allPlayers || [])
    if (isCreator || (allPlayers && allPlayers.length === 1)) {
      await supabase.from('games').update({ host_id: player.id }).eq('id', game.id)
      setGame(g => ({ ...g, host_id: player.id }))
    }
  }

  // ─── Render ───────────────────────────────────────────────────
  if (loading) return (
    <AnimatedBg><div className="min-h-screen flex items-center justify-center"><LoadingSpinner text="טוען את המשחק..." /></div></AnimatedBg>
  )
  if (error) return (
    <AnimatedBg><div className="min-h-screen flex items-center justify-center px-4"><div className="text-center"><div className="text-6xl mb-4">😕</div><h2 className="text-2xl font-bold text-white mb-2">{error}</h2><a href="/" className="text-purple-300 hover:text-white transition-colors">חזרה לדף הבית</a></div></div></AnimatedBg>
  )
  if (showJoinForm) return <JoinForm game={game} sessionToken={sessionToken} onJoined={handleJoined} />

  const selectedQuestions = questions.filter(q => q.is_selected).sort((a, b) => a.order_index - b.order_index)
  const currentQuestion = isQuestionsMode ? selectedQuestions[game.current_round] : null

  const sharedProps = {
    game, players, myPlayer, isHost,
    trueStatements, roundStatements, votes,
    questions: selectedQuestions, currentQuestion,
  }

  return (
    <AnimatedBg>
      {game.status === 'lobby' && (
        <LobbyPhase {...sharedProps} onStartGame={startGame} gameCode={code.toUpperCase()} allQuestions={questions} />
      )}
      {game.status === 'writing' && <WritingPhase {...sharedProps} />}
      {game.status === 'fabricating' && <FabricatingPhase {...sharedProps} />}
      {game.status === 'voting' && <VotingPhase {...sharedProps} />}
      {game.status === 'reveal' && <RevealPhase {...sharedProps} onContinue={advanceRevealToLeaderboard} />}
      {game.status === 'leaderboard' && <LeaderboardPhase {...sharedProps} onNextRound={advanceToNextRound} />}
      {game.status === 'finished' && <FinalPhase {...sharedProps} />}
    </AnimatedBg>
  )
}
