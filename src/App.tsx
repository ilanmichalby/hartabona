import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { GameSetup } from './pages/GameSetup';
import { Lobby } from './pages/Lobby';
import { WriteTruth } from './pages/WriteTruth';
import { GameLoop } from './pages/GameLoop';
import { Results } from './pages/Results';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/setup" element={<GameSetup />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/write-truth" element={<WriteTruth />} />
          <Route path="/game" element={<GameLoop />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
