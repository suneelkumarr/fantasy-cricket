import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Home from './components/Home.jsx'
import MatchDetails from './components/MatchDetails.jsx'
import MatchInsights from './components/MatchInsights.jsx'
import PlayerDetails from './components/PlayerDetails.jsx'
import ByCometition from './components/ByCometition.jsx'
import Byformat from './components/Byformat.jsx'
import Graph from './components/Graph.jsx'
import News from './components/News.jsx'
import PowerRanking from './components/PowerRanking.jsx'
// import FantasyBreakDown from './components/FantasyBreakDown.jsx'
// <Route path="/player/:playerId/:fullName/:matchId/form" element={<FantasyBreakDown />} />


function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/fixture-info/:sport/:matchId/:homeTeam_vs_awayTeam/:eventId" element={<MatchDetails />} />
        <Route path="/insight-match/:sport/:matchId/:homeTeam_vs_awayTeam/:eventId" element={<MatchInsights />} />
        <Route path="/player/:playerId/:fullName/:matchId/form" element={<PlayerDetails />} />
        <Route path="/player/:playerId/:fullName/:matchId/competition" element={<ByCometition />} />
        <Route path="/player/:playerId/:fullName/:matchId/format" element={<PlayerDetails />} />
        <Route path="/player/:playerId/:fullName/:matchId/graph" element={<PlayerDetails />} /> 
        <Route path="/player/:playerId/:fullName/:matchId/news" element={<News />} />
        <Route path="/player/:playerId/:fullName/:matchId/powerranking" element={<PlayerDetails />} />
      </Routes>
    </Router>
  )
}

export default App
