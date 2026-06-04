export function getSessionToken() {
  let token = localStorage.getItem('hartabona_session_token')
  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem('hartabona_session_token', token)
  }
  return token
}

export function savePlayerForGame(gameCode, playerId) {
  localStorage.setItem(`hartabona_player_${gameCode}`, playerId)
}

export function getPlayerForGame(gameCode) {
  return localStorage.getItem(`hartabona_player_${gameCode}`)
}

export function generateGameCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function getAvatarUrl(seed) {
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
}

export const AVATAR_SEEDS = [
  'Felix', 'Aneka', 'Kiki', 'Patches', 'Salem', 'Mimi', 'Cleo', 'Cookie',
  'Jasper', 'Buddy', 'Luna', 'Oscar', 'Nala', 'Simba', 'Bella', 'Max',
  'Tiger', 'Shadow', 'Oreo', 'Pumpkin', 'Gizmo', 'Bear', 'Zeus', 'Apollo',
  'Coco', 'Loki', 'Mochi', 'Pepper', 'Biscuit', 'Maple', 'Sage', 'Ember',
]

export function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
