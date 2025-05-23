import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Home from './components/Home.jsx'
import MatchDetails from './components/MatchDetails.jsx'
import MatchInsights from './components/MatchInsights.jsx'
import PlayerDetails from './components/PlayerDetails.jsx'
import Squad from './components/Squad.jsx'
import StatsPlayground from './components/StatsPlayground.jsx'
import MatchReport from './components/MatchReport.jsx'
import PlayerPerformance from './components/PlayerPerformance.jsx'
import VenuePerformance from './components/VenuePerformance.jsx'
import BattingOrder from './components/BattingOrder.jsx'
import CheatSheet from './components/CheatSheet.jsx'
import TeamH2H from './components/TeamH2H.jsx'
import PlayerPerformancelist from './components/PlayerPerformancelist.jsx'
import BowlerCornar from './components/BowlerCornar.jsx'
import CreateTeamBasedOnScore from './components/CreateTeamBasedOnScore.jsx'
import Plabs from './components/Plabs.jsx'
import CaptainSuggestion from './components/CaptainSuggestion.jsx'
import PlayerCombination from './components/PlayerCombination.jsx'
import CoverageIndex from './components/CoverageIndex.jsx'
import ScorePredictor from './components/ScorePredictor.jsx'
import DataTable from './components/DataTable.jsx'
import CreateTeamSetting from './components/CreateTeamSetting.jsx'
import CreateTeamCvc from './components/CreateTeamCvc.jsx'
import PlayerBattle from './components/PlayerBattle.jsx'
import PlayerComparation from './components/PlayerComparation.jsx'
import CreateTeam from './components/CreateTeam.jsx'
import CreateTeamChart from './components/CreateTeamChart.jsx'
import ExportTeam from './components/ExportTeam.jsx'
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
        <Route path="/player/:playerId/:fullName/:matchId/competition" element={<PlayerDetails />} />
        <Route path="/player/:playerId/:fullName/:matchId/format" element={<PlayerDetails />} />
        <Route path="/player/:playerId/:fullName/:matchId/graph" element={<PlayerDetails />} /> 
        <Route path="/player/:playerId/:fullName/:matchId/news" element={<PlayerDetails />} />
        <Route path="/player/:playerId/:fullName/:matchId/powerranking" element={<PlayerDetails />} />
        <Route path="/squad/:sport/:matchId/:homeTeam_vs_awayTeam/:eventId" element={<Squad />} />
        <Route path="/stats-playground/:sport/:matchId/:homeTeam_vs_awayTeam/:eventId" element={<StatsPlayground />} />
        <Route path="/match-report/:sport/:matchId/:homeTeam_vs_awayTeam/:eventId/scorecard" element={<MatchReport />} />
        <Route path="/players-performace/:sport/:matchId/:homeTeam_vs_awayTeam/:eventId" element={<PlayerPerformance />} />
        <Route path="/venue/:sport/:matchId/:homeTeam_vs_awayTeam/:eventId" element={<VenuePerformance />} />
        <Route path="/batting-order/:sport/:matchId/:homeTeam_vs_awayTeam/:eventId" element={<BattingOrder />} />
        <Route path="/players-analyzer/:sport/:matchId/:homeTeam_vs_awayTeam/:eventId" element={<CheatSheet />} />
        <Route path="/team-h2h/:sport/:matchId/:homeTeam_vs_awayTeam/:eventId" element={<TeamH2H />} />
        <Route path="/player-pick/:sport/:matchId/:homeTeam_vs_awayTeam/:eventId" element={<PlayerPerformancelist />} />
        <Route path="/bowler-corner/:sport/:matchId/:homeTeam_vs_awayTeam/:eventId" element={<BowlerCornar />} />
        <Route path="/create-team-score-based/:sport/:matchId/:homeTeam_vs_awayTeam/:eventId" element={<CreateTeamBasedOnScore />} />
        <Route path="/pl-labs/app/:sport/:matchId/:homeTeam_vs_awayTeam/:eventId" element={<Plabs />} />
        <Route path="/pl-labs-mobile/score-predictor/:homeTeam_vs_awayTeam/:matchId/:eventId" element={<ScorePredictor />} />
        <Route path="/pl-labs-mobile/coverage-index/:homeTeam_vs_awayTeam/:matchId/:eventId" element={<CoverageIndex />} />
        <Route path="/pl-labs-mobile/player-combination/:homeTeam_vs_awayTeam/:matchId/:eventId" element={<PlayerCombination />} />
        <Route path="/pl-labs-mobile/captain-suggestion/:homeTeam_vs_awayTeam/:matchId/:eventId" element={<CaptainSuggestion />} />
        <Route path="/datatable/:sport/:matchId/:homeTeam_vs_awayTeam/:eventId" element={<DataTable />} />
        <Route path="/create-team-setting/:sport/:matchId/:homeTeam_vs_awayTeam/:eventId" element={<CreateTeamSetting />} />
        <Route path="/create-team-cvc/:sport/:matchId/:homeTeam_vs_awayTeam/:eventId/overall" element={<CreateTeamCvc />} />
        <Route path="/player-battle/:sport/:matchId/:homeTeam_vs_awayTeam/:eventId" element={<PlayerBattle />} />
        <Route path="/popular-comparisons/:sport/:matchId/:homeTeam_vs_awayTeam/:eventId" element={<PlayerComparation />} />
        <Route path="/create-team/:sport/:matchId/:homeTeam_vs_awayTeam/:eventId" element={<CreateTeam />} />
        <Route path="/create-team-chart/:sport/:matchId/:homeTeam_vs_awayTeam/:eventId" element={<CreateTeamChart />} />
        <Route path="/export-team" element={<ExportTeam />} />
      </Routes>
    </Router>
  )
}

export default App
