import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import GameRouter from './pages/game/GameRouter'
import ContributorPage from './pages/ContributorPage'

function NotFound() {
  return (
    <div className="animated-bg min-h-screen flex items-center justify-center text-white text-center p-6">
      <div>
        <div className="text-6xl mb-4">🎭</div>
        <h1 className="text-3xl font-bold mb-2">עמוד לא נמצא</h1>
        <p className="text-purple-300 mb-6">הדף שחיפשת לא קיים</p>
        <a href="/" className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold transition-colors">
          חזרה לדף הבית
        </a>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/game/:code" element={<GameRouter />} />
        <Route path="/contribute/:contributorCode" element={<ContributorPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
