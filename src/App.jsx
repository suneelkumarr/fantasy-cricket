import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Home from './components/Home.jsx'
import MatchDetails from './components/MatchDetails.jsx'
import MatchInsights from './components/MatchInsights.jsx'

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/fixture-info/:sport/:matchId/:homeTeam_vs_awayTeam/:eventId" element={<MatchDetails />} />
        <Route path="/insight-match/:sport/:matchId/:homeTeam_vs_awayTeam/:eventId" element={<MatchInsights />} />
      </Routes>
    </Router>
  )
}

export default App
