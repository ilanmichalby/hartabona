import { useTheme } from '../context/ThemeContext'

// Confetti pieces config for carnival
const CONFETTI = [
  { color: '#ff3d8b', size: 14, left: '8%',  dur: 7,  delay: 0,   shape: 'circle' },
  { color: '#2de2e6', size: 10, left: '18%', dur: 9,  delay: 1.5, shape: 'square' },
  { color: '#ffd338', size: 12, left: '30%', dur: 6,  delay: 0.7, shape: 'circle' },
  { color: '#ff3d8b', size: 8,  left: '44%', dur: 8,  delay: 2.2, shape: 'square' },
  { color: '#64f58d', size: 16, left: '56%', dur: 10, delay: 0.3, shape: 'circle' },
  { color: '#2de2e6', size: 9,  left: '68%', dur: 7,  delay: 1.8, shape: 'square' },
  { color: '#ffd338', size: 11, left: '78%', dur: 8,  delay: 0.9, shape: 'circle' },
  { color: '#ff3d8b', size: 13, left: '88%', dur: 6,  delay: 2.5, shape: 'square' },
  { color: '#64f58d', size: 10, left: '12%', dur: 9,  delay: 3.1, shape: 'circle' },
  { color: '#ffd338', size: 8,  left: '92%', dur: 7,  delay: 1.2, shape: 'square' },
  { color: '#2de2e6', size: 12, left: '36%', dur: 11, delay: 0.5, shape: 'circle' },
  { color: '#ff3d8b', size: 9,  left: '72%', dur: 8,  delay: 2.8, shape: 'square' },
  { color: '#ffd338', size: 7,  left: '52%', dur: 9,  delay: 4.0, shape: 'circle' },
  { color: '#64f58d', size: 11, left: '24%', dur: 7,  delay: 3.5, shape: 'square' },
  { color: '#ff3d8b', size: 8,  left: '60%', dur: 10, delay: 1.0, shape: 'circle' },
]

export default function AnimatedBg({ children, className = '' }) {
  const { theme } = useTheme()

  if (theme === 'carnival') {
    return (
      <div
        className={`relative min-h-screen overflow-hidden ${className}`}
        style={{ background: '#fff3c9' }}
      >
        {/* Slow-rotating stripe overlay */}
        <div className="carnival-stripes" aria-hidden="true" />

        {/* Corner accent circles */}
        <div className="carnival-corner carnival-corner-tr" aria-hidden="true" />
        <div className="carnival-corner carnival-corner-tl" aria-hidden="true" />
        <div className="carnival-corner carnival-corner-br" aria-hidden="true" />

        {/* Rising confetti */}
        <div className="carnival-confetti-wrap" aria-hidden="true">
          {CONFETTI.map((p, i) => (
            <div
              key={i}
              className="carnival-piece"
              style={{
                background: p.color,
                width: p.size,
                height: p.size,
                left: p.left,
                borderRadius: p.shape === 'circle' ? '50%' : '3px',
                animationDuration: `${p.dur}s`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      </div>
    )
  }

  // Default (current) theme — unchanged
  return (
    <div className={`animated-bg min-h-screen relative overflow-hidden ${className}`}>
      <div className="blob1 absolute top-[-10%] right-[-10%] w-80 h-80 bg-purple-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="blob2 absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="blob1 absolute top-[40%] left-[30%] w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  )
}
