export default function AnimatedBg({ children, className = '' }) {
  return (
    <div className={`animated-bg min-h-screen relative overflow-hidden ${className}`}>
      {/* Decorative blobs */}
      <div className="blob1 absolute top-[-10%] right-[-10%] w-80 h-80 bg-purple-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="blob2 absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="blob1 absolute top-[40%] left-[30%] w-64 h-64 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      {/* Content */}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  )
}
