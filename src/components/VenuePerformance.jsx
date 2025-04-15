import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// Constants
const FLAG_BASE_URL = "https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/";
const COLORS = ["#4CAF50", "#FF5722"];
const formatMap = { 1: "Test", 2: "ODI", 3: "T20", 4: "T10" };

// Utility Functions
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const groupMatchesByDate = (matches) => {
  return matches.reduce((groups, match) => {
    const formattedDate = formatDate(match.season_scheduled_date);
    if (!groups[formattedDate]) groups[formattedDate] = [];
    groups[formattedDate].push(match);
    return groups;
  }, {});
};

const getCountdownTime = (scheduledDate) => {
  const now = new Date();
  const targetDate = new Date(scheduledDate);
  targetDate.setHours(targetDate.getHours() + 5, targetDate.getMinutes() + 30);

  const diff = targetDate - now;
  if (diff <= 0) return "Event Started";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="w-full space-y-4 p-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
    ))}
  </div>
);

// Reusable Tab Button Component
const TabButton = ({ label, isActive, onClick }) => (
  <motion.button
    onClick={onClick}
    className={`px-3 py-2 text-xs sm:text-sm md:text-base font-medium rounded-full transition-all duration-300 ${
      isActive
        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
        : "bg-transparent text-gray-600 hover:bg-gray-200"
    }`}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    {label}
  </motion.button>
);

// MatchDetails Component
function MatchDetails({ matchData }) {
  const groupedMatches = groupMatchesByDate(matchData);
  const sortedDates = Object.keys(groupedMatches).sort((a, b) => new Date(b) - new Date(a));

  return (
    <motion.div
      className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 text-center mb-4">
        Recent Matches at This Venue
      </h2>
      <div className="space-y-6">
        {sortedDates.map((date) => (
          <div key={date}>
            <div className="flex items-center mb-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-300"></div>
              <span className="mx-3 text-sm sm:text-base font-medium text-gray-700">{date}</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-300"></div>
            </div>
            <div className="space-y-3">
              {groupedMatches[date].map((match, index) => (
                <Link
                  key={index}
                  to={`/match-report/Cricket/${match.es_season_game_uid}/${match.home}_vs_${match.away}/${match.league_id}/scorecard`}
                  state={{ matchInSights: match, matchSessionIDs: match.es_season_game_uid, matchleageIDs: match.league_id }}
                >
                  <motion.div
                    className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-all flex flex-col sm:flex-row items-center justify-between border border-gray-100"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow-sm"
                        src={`${FLAG_BASE_URL}${match.home_flag}`}
                        alt={`${match.home} flag`}
                        loading="lazy"
                      />
                      <span className="font-medium text-sm sm:text-base text-gray-800">{match.home}</span>
                    </div>
                    <div className="text-center my-2 sm:my-0">
                      <div className="text-sm sm:text-base font-bold text-gray-700">VS</div>
                      <div className="text-xs sm:text-sm text-gray-500">{match.league_name}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-sm sm:text-base text-gray-800">{match.away}</span>
                      <img
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow-sm"
                        src={`${FLAG_BASE_URL}${match.away_flag}`}
                        alt={`${match.away} flag`}
                        loading="lazy"
                      />
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        ))}
        </div>
    </motion.div>
  );
}

// PlayerInformations Component
function PlayerInformations({ players, matchInSights }) {
  const [activeTab, setActiveTab] = useState("Top Players");

  const tabs = ["Top Players", "Batting First", "Chasing"];

  const getAverage = useCallback((player) => {
    if (activeTab === "Top Players") return player.total_matches > 0 ? player.total_fantasy_points / player.total_matches : 0;
    if (activeTab === "Batting First") return player.batting_first_matches > 0 ? player.batting_first_fpts / player.batting_first_matches : 0;
    return player.chasing_matches > 0 ? player.chasing_fpts / player.chasing_matches : 0;
  }, [activeTab]);

  const filteredPlayers = useMemo(() => {
    let data = [];
    if (activeTab === "Top Players") data = players.filter((p) => p.total_matches > 0);
    else if (activeTab === "Batting First") data = players.filter((p) => p.batting_first_matches > 0);
    else data = players.filter((p) => p.chasing_matches > 0);
    return data.sort((a, b) => getAverage(b) - getAverage(a));
  }, [activeTab, players, getAverage]);

  const maxPoints = useMemo(() => {
    if (activeTab === "Top Players") return Math.max(...filteredPlayers.map((p) => p.total_matches > 0 ? p.total_fantasy_points / p.total_matches : 0), 0);
    if (activeTab === "Batting First") return Math.max(...filteredPlayers.map((p) => p.batting_first_matches > 0 ? p.batting_first_fpts / p.batting_first_matches : 0), 0);
    return Math.max(...filteredPlayers.map((p) => p.chasing_matches > 0 ? p.chasing_fpts / p.chasing_matches : 0), 0);
  }, [activeTab, filteredPlayers]);

  return (
    <motion.div
      className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row items-center bg-gray-100 p-1 rounded-full mb-6 space-y-2 sm:space-y-0">
        {tabs.map((tab) => (
          <TabButton
            key={tab}
            label={tab}
            isActive={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="space-y-4">
            {filteredPlayers.map((player) => {
              const average = getAverage(player);
              const matches = activeTab === "Top Players" ? player.total_matches : activeTab === "Batting First" ? player.batting_first_matches : player.chasing_matches;
              const sliderWidth = maxPoints ? (average / maxPoints) * 100 : 0;

              return (
                <Link
                  key={player.player_uid}
                  to={`/player/${player.player_uid}/${(player.display_name || player.full_name || "unknown").replace(/\s+/g, "_")}/${matchInSights.season_game_uid}/form`}
                  state={{ playerInfo: player, matchID: matchInSights.season_game_uid, matchInSights }}
                >
                  <motion.div
                    className="flex flex-col sm:flex-row items-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-100"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-full sm:w-40 flex-shrink-0 mb-2 sm:mb-0">
                      <div className="font-medium text-gray-800 truncate max-w-[80px] sm:max-w-[100px] text-sm sm:text-base">
                        {player.nick_name}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 flex items-center">
                        {player.position}
                        <span className="mx-1 w-1 h-1 bg-gray-400 rounded-full inline-block"></span>
                        {player.team_abbr}
                      </div>
                    </div>
                    <div className="flex items-center flex-grow px-0 sm:px-4 w-full sm:w-auto">
                      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${sliderWidth}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                      <span className="ml-3 text-xs sm:text-sm font-medium text-gray-700 w-24 text-right">
                        {average.toFixed(2)} Pts
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 w-full sm:w-32 text-right flex-shrink-0 mt-2 sm:mt-0">
                      in {matches} match{matches > 1 ? "es" : ""}
                    </div>
                    <div className="ml-0 sm:ml-2 w-5 flex-shrink-0 mt-2 sm:mt-0">
                      <img
                        src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_prefer_inactive.svg"
                        alt="lock"
                        className="w-5 h-5"
                        loading="lazy"
                      />
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// DreamTeamChart Component
function DreamTeamChart({ data, matchInSights, total_matches }) {
  const chartOptions = {
    chart: { type: "pie", backgroundColor: "transparent" },
    title: { text: "" },
    tooltip: { pointFormat: "{series.name}: <b>{point.y}</b>" },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        dataLabels: {
          enabled: true,
          format: "<b>{point.name}</b>: {point.y}",
          style: { fontSize: "12px", color: "#333" },
        },
      },
    },
    series: [
      {
        name: "Points",
        colorByPoint: true,
        data: [
          { name: "WK", y: data.WK, color: "#4CAF50" },
          { name: "BAT", y: data.BAT, color: "#FF5722" },
          { name: "AR", y: data.AR, color: "#2196F3" },
          { name: "BOWL", y: data.BOW, color: "#FFC107" },
        ],
      },
    ],
  };

  const chartData = chartOptions.series[0].data;

  return (
    <motion.div
      className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 text-center mb-2">
        Fantasy Points for {matchInSights.home}
      </h2>
      <p className="text-xs sm:text-sm text-gray-600 text-center mb-4">
        Based on recent {total_matches} matches
      </p>
      <div className="overflow-hidden mb-6">
        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-800 text-center">Points Breakdown</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {chartData.map((item) => (
            <motion.div
              key={item.name}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-3 shadow-sm"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="font-medium text-gray-700 text-xs sm:text-sm">{item.name}</span>
              </div>
              <span className="text-gray-800 font-semibold text-xs sm:text-sm">{item.y} pts</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// VenueTossTrends Component
function VenueTossTrends({ data }) {
  const { bat_first_total, bat_first_win, bowl_first_total, bowl_first_win } = data;
  const totalMatches = bat_first_total + bowl_first_total;
  const totalWins = bat_first_win + bowl_first_win;
  const overallWinPercentage = totalMatches ? (totalWins / totalMatches) * 100 : 0;
  const batWinPercentage = bat_first_total ? (bat_first_win / bat_first_total) * 100 : 0;
  const bowlWinPercentage = bowl_first_total ? (bowl_first_win / bowl_first_total) * 100 : 0;

  return (
    <motion.div
      className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-lg mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 text-center mb-2">
        Venue Toss Trends
      </h3>
      <p className="text-xs sm:text-sm text-gray-600 text-center mb-4">
        At this venue in the last {totalMatches} matches
      </p>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-700">Overall ({totalMatches} matches)</span>
            <span className="text-xs sm:text-sm text-gray-500">{totalWins} Wins</span>
          </div>
          <motion.div
            className="relative h-4 rounded-full overflow-hidden bg-gray-200"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${overallWinPercentage}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </motion.div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-700">Batting First</span>
            <span className="text-xs sm:text-sm text-gray-500">{bat_first_win} Wins in {bat_first_total} matches</span>
          </div>
          <motion.div
            className="relative h-4 rounded-full overflow-hidden bg-gray-200"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${batWinPercentage}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </motion.div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-700">Chasing</span>
            <span className="text-xs sm:text-sm text-gray-500">{bowl_first_win} Wins in {bowl_first_total} matches</span>
          </div>
          <motion.div
            className="relative h-4 rounded-full overflow-hidden bg-gray-200"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${bowlWinPercentage}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// HomeTeam and AwayTeam Components
function TeamStats({ matchInSights, teamUid, teamName }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!matchInSights?.season_game_uid) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.post(
          "https://plapi.perfectlineup.in/fantasy/stats/teams_venue_stats",
          {
            season_game_uid: matchInSights.season_game_uid,
            league_id: matchInSights.league_id,
            sports_id: "7",
            team_uid: teamUid,
          },
          {
            headers: {
              sessionkey: "3cd0fb996816c37121c765f292dd3f78",
              moduleaccess: "7",
              "Content-Type": "application/json",
            },
          }
        );
        setData(response.data.data);
      } catch (error) {
        setError(error.message || "An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [matchInSights?.season_game_uid, teamUid]);

  if (loading) return <SkeletonLoader />;
  if (error) return <div className="text-red-500 text-center">Error: {error}</div>;

  return (
    data && (
      <div className="w-full">
        <VenueTossTrends data={data.win_stats} />
        <DreamTeamChart data={data.position_wise_fpts} matchInSights={{ home: teamName }} total_matches={data.total_matches} />
        <PlayerInformations players={data.player_list} matchInSights={matchInSights} />
        <MatchDetails matchData={data.matches_on_venue} />
      </div>
    )
  );
}

const HomeTeam = ({ matchInSights }) => (
  <TeamStats matchInSights={matchInSights} teamUid={matchInSights.home_uid} teamName={matchInSights.home} />
);

const AwayTeam = ({ matchInSights }) => (
  <TeamStats matchInSights={matchInSights} teamUid={matchInSights.away_uid} teamName={matchInSights.away} />
);

// RechartsPieChart Component
const RechartsPieChart = ({ bat, bowl, width = 200, height = 200 }) => {
  const data = [
    { name: "BAT", value: bat },
    { name: "BOWL", value: bowl },
  ];

  return (
    <motion.div
      style={{ width: `${width}px`, height: `${height}px` }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={width / 4}
            outerRadius={width / 2}
            dataKey="value"
            label={({ name, value }) => `${name}: ${value}`}
            labelLine={false}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

// VenueMatchCard Component
const VenueMatchCard = ({ matchData }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "2-digit" });
  };

  const getScore = (team, scoreData) => {
    const inning = scoreData["1"];
    const overs = team === "home" ? inning.home_overs : inning.away_overs;
    const wickets = team === "home" ? inning.home_wickets : inning.away_wickets;
    const runs = team === "home" ? inning.home_team_score : inning.away_team_score;
    return `${runs}/${wickets} (${overs} Overs)`;
  };

  return (
    <motion.div
      className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-lg mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col items-center mb-4">
        <div className="text-base sm:text-lg font-semibold text-gray-800">{matchData.league_name}</div>
        <div className="text-xs sm:text-sm text-gray-500">{formatDate(matchData.season_scheduled_date)}</div>
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
        <div className="flex flex-col items-center w-full sm:w-1/3">
          <img
            className="w-10 h-10 sm:w-12 sm:h-12 mb-2 rounded-full shadow-sm"
            src={`${FLAG_BASE_URL}${matchData.home_flag}`}
            alt={`${matchData.home} flag`}
            loading="lazy"
          />
          <div className="text-sm sm:text-lg font-bold text-gray-900">{matchData.home}</div>
          <div className="text-xs sm:text-sm text-gray-600">{getScore("home", JSON.parse(matchData.score_data))}</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-lg sm:text-xl font-bold text-gray-700">VS</div>
          <div className="text-xs sm:text-sm text-green-600 mt-1">{matchData.result_label}</div>
        </div>
        <div className="flex flex-col items-center w-full sm:w-1/3">
          <img
            className="w-10 h-10 sm:w-12 sm:h-12 mb-2 rounded-full shadow-sm"
            src={`${FLAG_BASE_URL}${matchData.away_flag}`}
            alt={`${matchData.away} flag`}
            loading="lazy"
          />
          <div className="text-sm sm:text-lg font-bold text-gray-900">{matchData.away}</div>
          <div className="text-xs sm:text-sm text-gray-600">{getScore("away", JSON.parse(matchData.score_data))}</div>
        </div>
      </div>
      <div className="text-center mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800">Dream Team Fantasy Points</h3>
      </div>
      <div className="flex flex-col items-center mb-6">
        <RechartsPieChart bat={matchData.position_breakdown.BAT} bowl={matchData.position_breakdown.BOWL} width={200} height={200} />
        <div className="text-xs sm:text-sm text-gray-600 mt-2">Total Fantasy Points</div>
        <div className="flex space-x-4 mt-2">
          <div className="text-xs sm:text-sm">
            <span className="text-gray-700">BAT: </span>
            <span className="font-bold text-[#4CAF50]">{matchData.position_breakdown.BAT}</span>
          </div>
          <div className="text-xs sm:text-sm">
            <span className="text-gray-700">BOWL: </span>
            <span className="font-bold text-[#FF5722]">{matchData.position_breakdown.BOWL}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-center space-y-6 sm:space-y-0 sm:space-x-6 mb-6">
        <div className="flex flex-col items-center">
          <RechartsPieChart bat={matchData.inning_match_breakdown["1"].BAT} bowl={matchData.inning_match_breakdown["1"].BOWL} width={150} height={150} />
          <div className="text-xs sm:text-sm text-gray-600 mt-2">1st Inning Fantasy Points</div>
          <div className="flex space-x-2 mt-1 text-xs sm:text-sm">
            <span className="text-[#4CAF50] font-bold">{matchData.inning_match_breakdown["1"].BAT}</span>
            <span className="text-[#FF5722] font-bold">{matchData.inning_match_breakdown["1"].BOWL}</span>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <RechartsPieChart bat={matchData.inning_match_breakdown["2"].BAT} bowl={matchData.inning_match_breakdown["2"].BOWL} width={150} height={150} />
          <div className="text-xs sm:text-sm text-gray-600 mt-2">2nd Inning Fantasy Points</div>
          <div className="flex space-x-2 mt-1 text-xs sm:text-sm">
            <span className="text-[#4CAF50] font-bold">{matchData.inning_match_breakdown["2"].BAT}</span>
            <span className="text-[#FF5722] font-bold">{matchData.inning_match_breakdown["2"].BOWL}</span>
          </div>
        </div>
      </div>
      <div className="text-center">
        <Link
          to={`/match-report/Cricket/${matchData.es_season_game_uid}/${matchData.home}_vs_${matchData.away}/${matchData.league_id}/scorecard`}
          state={{ matchInSights: matchData, matchSessionIDs: matchData.es_season_game_uid, matchleageIDs: matchData.league_id }}
          className="text-blue-600 hover:underline text-sm sm:text-base"
        >
          Match Report
        </Link>
      </div>
    </motion.div>
  );
};

// VenueMatchCardList Component
const VenueMatchCardList = ({ matches }) => (
  <div className="space-y-6">
    {matches.map((match, index) => (
      <VenueMatchCard key={index} matchData={match} />
    ))}
  </div>
);

// FantasyPointsGraph Component
const FantasyPointsGraph = ({ data }) => {
  if (!data || !data.overall_pts_brkdn || !data.first_inn_pts_brkdn || !data.second_inn_pts_brkdn) {
    return <SkeletonLoader />;
  }

  const commonOptions = {
    chart: { type: "pie", backgroundColor: "transparent" },
    credits: { enabled: false },
    tooltip: { pointFormat: "{series.name}: <b>{point.percentage:.1f}%</b>" },
    accessibility: { point: { valueSuffix: "%" } },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        dataLabels: {
          enabled: true,
          format: "<b>{point.name}</b>: {point.y}%",
          style: { color: "#333", fontSize: "12px" },
          distance: -30,
        },
        borderWidth: 0,
      },
    },
  };

  const overallOptions = {
    ...commonOptions,
    chart: { ...commonOptions.chart, height: "300px" },
    title: { text: "BAT & BOWL Strength (%)", style: { fontSize: "16px", color: "#333" } },
    series: [
      {
        name: "Percentage",
        colorByPoint: true,
        data: [
          { name: "BAT", y: data.overall_pts_brkdn.bat_percent, color: "#4CAF50" },
          { name: "BOWL", y: data.overall_pts_brkdn.bow_percent, color: "#FF5722" },
        ],
      },
    ],
  };

  const createInningsOptions = (title, bat, bowl) => ({
    ...commonOptions,
    chart: { ...commonOptions.chart, height: "220px" },
    title: { text: title, style: { fontSize: "14px", color: "#333" } },
    series: [
      {
        name: "Points",
        colorByPoint: true,
        data: [
          { name: "BAT", y: bat || 0, color: "#4CAF50" },
          { name: "BOWL", y: bowl || 0, color: "#FF5722" },
        ],
      },
    ],
  });

  return (
    <motion.div
      className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-lg mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full md:w-3/5 mx-auto mb-6">
        <HighchartsReact highcharts={Highcharts} options={overallOptions} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div className="flex flex-col items-center" whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}>
          <HighchartsReact highcharts={Highcharts} options={createInningsOptions("1st Inning", data.first_inn_pts_brkdn.BAT, data.first_inn_pts_brkdn.BOWL)} />
          <div className="text-center mt-2 text-gray-700 text-xs sm:text-sm">Fantasy Points</div>
        </motion.div>
        <motion.div className="flex flex-col items-center" whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}>
          <HighchartsReact highcharts={Highcharts} options={createInningsOptions("2nd Inning", data.second_inn_pts_brkdn.BAT, data.second_inn_pts_brkdn.BOWL)} />
          <div className="text-center mt-2 text-gray-700 text-xs sm:text-sm">Fantasy Points</div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// FantasyPointsBowGraph Component
const FantasyPointsBowGraph = ({ data }) => {
  if (!data || (!data["1"] && !data["2"]) || !data.SPIN || !data.PACE) {
    return <SkeletonLoader />;
  }

  const commonOptions = {
    chart: { type: "pie", backgroundColor: "transparent" },
    credits: { enabled: false },
    tooltip: { pointFormat: "{series.name}: <b>{point.percentage:.1f}%</b>" },
    accessibility: { point: { valueSuffix: "%" } },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        dataLabels: {
          enabled: true,
          format: "<b>{point.name}</b>: {point.y}",
          style: { color: "#333", fontSize: "12px" },
          distance: -30,
        },
        borderWidth: 0,
      },
    },
  };

  const overallOptions = {
    ...commonOptions,
    chart: { ...commonOptions.chart, height: "300px" },
    title: { text: "Pacer vs Spinner Fantasy Points", style: { fontSize: "16px", color: "#333" } },
    series: [
      {
        name: "Points",
        colorByPoint: true,
        data: [
          { name: "SPIN", y: data.SPIN || 0, color: "#4CAF50" },
          { name: "PACE", y: data.PACE || 0, color: "#FF5722" },
        ],
      },
    ],
  };

  const createInningsOptions = (title, SPIN = 0, PACE = 0) => ({
    ...commonOptions,
    chart: { ...commonOptions.chart, height: "220px" },
    title: { text: title, style: { fontSize: "14px", color: "#333" } },
    series: [
      {
        name: "Points",
        colorByPoint: true,
        data: [
          { name: "SPIN", y: SPIN, color: "#4CAF50" },
          { name: "PACE", y: PACE, color: "#FF5722" },
        ],
      },
    ],
  });

  return (
    <motion.div
      className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-lg mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full md:w-3/5 mx-auto mb-6">
        <HighchartsReact highcharts={Highcharts} options={overallOptions} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data["1"] && (
          <motion.div className="flex flex-col items-center" whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}>
            <HighchartsReact highcharts={Highcharts} options={createInningsOptions("1st Inning", data["1"].SPIN, data["1"].PACE)} />
            <div className="text-center mt-2 text-gray-700 text-xs sm:text-sm">Fantasy Points</div>
          </motion.div>
        )}
        {data["2"] && (
          <motion.div className="flex flex-col items-center" whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}>
            <HighchartsReact highcharts={Highcharts} options={createInningsOptions("2nd Inning", data["2"].SPIN, data["2"].PACE)} />
            <div className="text-center mt-2 text-gray-700 text-xs sm:text-sm">Fantasy Points</div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// TossStatistics Component
function TossStatistics({ data }) {
  const getPercentage = (value, total) => (total ? (value / total) * 100 : 0);

  return (
    <motion.div
      className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-lg mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 text-center mb-4">
        Toss Statistics
      </h3>
      <div className="space-y-6">
        <div>
          <h4 className="text-sm sm:text-base font-semibold text-gray-700 text-center mb-2">
            Decision After Winning the Toss
          </h4>
          <div className="flex justify-between text-xs sm:text-sm text-gray-500 mb-2">
            <span>Choose to Bat First</span>
            <span>Choose to Chase</span>
          </div>
          <motion.div
            className="flex rounded-full overflow-hidden bg-gray-300 text-white text-xs sm:text-sm font-bold"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="text-center bg-gradient-to-r from-blue-500 to-blue-700 py-2"
              style={{ width: `${getPercentage(data.toss_trend.choose_bat_first, data.toss_trend.choose_bat_first + data.toss_trend.choose_bowl_first)}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${getPercentage(data.toss_trend.choose_bat_first, data.toss_trend.choose_bat_first + data.toss_trend.choose_bowl_first)}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {data.toss_trend.choose_bat_first}
            </motion.div>
            <motion.div
              className="text-center bg-gradient-to-r from-gray-500 to-gray-700 py-2"
              style={{ width: `${getPercentage(data.toss_trend.choose_bowl_first, data.toss_trend.choose_bat_first + data.toss_trend.choose_bowl_first)}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${getPercentage(data.toss_trend.choose_bowl_first, data.toss_trend.choose_bat_first + data.toss_trend.choose_bowl_first)}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {data.toss_trend.choose_bowl_first}
            </motion.div>
          </motion.div>
        </div>
        <div>
          <div className="flex justify-between text-xs sm:text-sm text-gray-500 mb-2">
            <span>Wins Batting First</span>
            <span>Wins Chasing</span>
          </div>
          <motion.div
            className="flex rounded-full overflow-hidden bg-gray-300 text-white text-xs sm:text-sm font-bold"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="text-center bg-gradient-to-r from-green-500 to-green-700 py-2"
              style={{ width: `${getPercentage(data.toss_trend.bat_first_win, data.toss_trend.bat_first_win + data.toss_trend.bat_second_win)}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${getPercentage(data.toss_trend.bat_first_win, data.toss_trend.bat_first_win + data.toss_trend.bat_second_win)}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {data.toss_trend.bat_first_win}
            </motion.div>
            <motion.div
              className="text-center bg-gradient-to-r from-gray-500 to-gray-700 py-2"
              style={{ width: `${getPercentage(data.toss_trend.bat_second_win, data.toss_trend.bat_first_win + data.toss_trend.bat_second_win)}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${getPercentage(data.toss_trend.bat_second_win, data.toss_trend.bat_first_win + data.toss_trend.bat_second_win)}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {data.toss_trend.bat_second_win}
            </motion.div>
          </motion.div>
        </div>
        <div>
          <h4 className="text-sm sm:text-base font-semibold text-gray-700 text-center mb-2">
            Wins After Winning Toss - {data.toss_trend.toss_win_match_win}/{data.toss_trend.total_matches} Matches
          </h4>
          <div className="flex justify-between text-xs sm:text-sm text-gray-500 mb-2">
            <span>Win</span>
            <span>Loss</span>
          </div>
          <motion.div
            className="flex rounded-full overflow-hidden bg-gray-300 text-white text-xs sm:text-sm font-bold"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="text-center bg-gradient-to-r from-purple-500 to-purple-700 py-2"
              style={{ width: `${getPercentage(data.toss_trend.toss_win_match_win, data.toss_trend.total_matches)}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${getPercentage(data.toss_trend.toss_win_match_win, data.toss_trend.total_matches)}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {getPercentage(data.toss_trend.toss_win_match_win, data.toss_trend.total_matches).toFixed(1)}%
            </motion.div>
            <motion.div
              className="text-center bg-gradient-to-r from-gray-500 to-gray-700 py-2"
              style={{ width: `${100 - getPercentage(data.toss_trend.toss_win_match_win, data.toss_trend.total_matches)}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${100 - getPercentage(data.toss_trend.toss_win_match_win, data.toss_trend.total_matches)}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {(100 - getPercentage(data.toss_trend.toss_win_match_win, data.toss_trend.total_matches)).toFixed(1)}%
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// Leaderboard Component
const Leaderboard = ({ playersData, matchInSights }) => {
  const [activeTab, setActiveTab] = useState("TOTAL");

  const topBat = useMemo(() => {
    return [...playersData]
      .map((player) => ({
        ...player,
        bat_avg: Number(player.bat_pt) / (Number(player.total_match_count) || 1),
      }))
      .sort((a, b) => b.bat_avg - a.bat_avg)
      .slice(0, 7);
  }, [playersData]);

  const topBow = useMemo(() => {
    return [...playersData]
      .map((player) => ({
        ...player,
        bowl_avg: Number(player.bowl_pt) / (Number(player.total_match_count) || 1),
      }))
      .sort((a, b) => b.bowl_avg - a.bowl_avg)
      .slice(0, 7);
  }, [playersData]);

  const topTotal = useMemo(() => {
    return [...playersData]
      .sort((a, b) => Number(b.fantasy_points) - Number(a.fantasy_points))
      .slice(0, 7);
  }, [playersData]);

  const displayedData = activeTab === "BAT" ? topBat : activeTab === "BOW" ? topBow : topTotal;

  const maxBatAvg = useMemo(() => topBat.reduce((acc, player) => Math.max(acc, player.bat_avg), 0), [topBat]);
  const maxBowAvg = useMemo(() => topBow.reduce((acc, player) => Math.max(acc, player.bowl_avg), 0), [topBow]);
  const maxTotalPoints = useMemo(() => topTotal.reduce((acc, player) => Math.max(acc, Number(player.fantasy_points)), 0), [topTotal]);

  return (
    <motion.div
      className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-lg mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row items-center bg-gray-100 p-1 rounded-full mb-6 space-y-2 sm:space-y-0">
        <TabButton label="BAT Points" isActive={activeTab === "BAT"} onClick={() => setActiveTab("BAT")} />
        <TabButton label="BOW Points" isActive={activeTab === "BOW"} onClick={() => setActiveTab("BOW")} />
        <TabButton label="TOTAL Points" isActive={activeTab === "TOTAL"} onClick={() => setActiveTab("TOTAL")} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="space-y-4">
            {displayedData.map((player) => {
              let displayText = "";
              let progressWidth = 0;
              const teamColor = player.team_abbr === matchInSights?.home ? "from-green-400 to-green-600" : "from-blue-400 to-blue-600";

              if (activeTab === "BAT") {
                displayText = `Avg ${player.bat_avg.toFixed(2)} Pts/Match`;
                progressWidth = maxBatAvg ? (player.bat_avg / maxBatAvg) * 100 : 0;
              } else if (activeTab === "BOW") {
                displayText = `Avg ${player.bowl_avg.toFixed(2)} Pts/Match`;
                progressWidth = maxBowAvg ? (player.bowl_avg / maxBowAvg) * 100 : 0;
              } else {
                const totalPts = Number(player.fantasy_points);
                displayText = `Fantasy ${totalPts} Pts`;
                progressWidth = maxTotalPoints ? (totalPts / maxTotalPoints) * 100 : 0;
              }

              return (
                <Link
                  key={player.player_uid}
                  to={`/player/${player.player_uid}/${(player.display_name || player.full_name || "unknown").replace(/\s+/g, "_")}/${matchInSights.season_game_uid}/form`}
                  state={{ playerInfo: player, matchID: matchInSights.season_game_uid, matchInSights }}
                >
                  <motion.div
                    className="flex flex-col sm:flex-row items-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-100"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-full sm:w-40 flex-shrink-0 mb-2 sm:mb-0">
                      <div className="font-medium text-gray-800 truncate max-w-[80px] sm:max-w-[100px] text-sm sm:text-base">
                        {player.full_name}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 flex items-center">
                        {player.position}
                        <span className="mx-1 w-1 h-1 bg-gray-400 rounded-full inline-block"></span>
                        {player.team_abbr}
                      </div>
                    </div>
                    <div className="flex items-center flex-grow px-0 sm:px-4 w-full sm:w-auto">
                      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full bg-gradient-to-r ${teamColor}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${progressWidth}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                      <span className="ml-3 text-xs sm:text-sm font-medium text-gray-700 w-24 text-right">{displayText}</span>
                    </div>
                    <div className="ml-0 sm:ml-2 w-5 flex-shrink-0 mt-2 sm:mt-0">
                      <img
                        src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_prefer_inactive.svg"
                        alt="lock"
                        className="w-5 h-5"
                        loading="lazy"
                      />
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

// PlayerList and PlayerCard Components
const PlayerList = ({ players, matchInSights }) => {
  const filteredPlayers = useMemo(() => {
    return players
      .filter((player) => player.captain_count !== "0")
      .sort((a, b) => b.captain_count - a.captain_count)
      .slice(0, 5);
  }, [players]);

  const maxCaptainCount = useMemo(() => {
    return filteredPlayers.reduce((max, player) => Math.max(max, Number(player.captain_count)), 0);
  }, [filteredPlayers]);

  return (
    <motion.div
      className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-lg mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="space-y-4">
        {filteredPlayers.map((player, index) => (
          <PlayerCard key={index} player={player} matchInSights={matchInSights} maxCaptainCount={maxCaptainCount} />
        ))}
      </div>
    </motion.div>
  );
};

const PlayerCard = ({ player, matchInSights, maxCaptainCount }) => {
  const progressWidth = Math.min((player.captain_count / maxCaptainCount) * 100, 100);
  const teamColor = player.team_abbr === matchInSights.home ? "from-green-400 to-green-600" : "from-blue-400 to-blue-600";

  return (
    <Link
      to={`/player/${player.player_uid}/${(player.display_name || player.full_name || "unknown").replace(/\s+/g, "_")}/${matchInSights.season_game_uid}/form`}
      state={{ playerInfo: player, matchID: matchInSights.season_game_uid, matchInSights }}
    >
      <motion.div
        className="flex flex-col sm:flex-row items-center p-4 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-100"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-full sm:w-40 flex-shrink-0 mb-2 sm:mb-0">
          <div className="font-medium text-gray-800 truncate max-w-[80px] sm:max-w-[100px] text-sm sm:text-base">
            {player.full_name}
          </div>
          <div className="text-xs sm:text-sm text-gray-500 flex items-center">
            {player.position}
            <span className="mx-1 w-1 h-1 bg-gray-400 rounded-full inline-block"></span>
            {player.team_abbr}
          </div>
        </div>
        <div className="flex items-center flex-grow px-0 sm:px-4 w-full sm:w-auto">
          <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r ${teamColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${progressWidth}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span className="ml-3 text-xs sm:text-sm font-medium text-gray-700 w-24 text-right">
            {player.captain_count}x
          </span>
        </div>
        <div className="text-xs sm:text-sm text-gray-600 w-full sm:w-32 text-right flex-shrink-0 mt-2 sm:mt-0">
          in {player.total_match_count} match{player.total_match_count > 1 ? "es" : ""}
        </div>
        <div className="ml-0 sm:ml-2 w-5 flex-shrink-0 mt-2 sm:mt-0">
          <img
            src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_prefer_inactive.svg"
            alt="lock"
            className="w-5             h-5"
            loading="lazy"
          />
        </div>
      </motion.div>
    </Link>
  );
};

// TossStatisticsChart Component
const TossStatisticsChart = ({ data }) => {
  if (!data) return <SkeletonLoader />;

  const batFirstWinPercent = data.bat_first_win;
  const batSecondWinPercent = data.bat_second_win;

  const getChartOptions = (title, percentage) => ({
    chart: { type: "pie", backgroundColor: "transparent" },
    title: { text: "", align: "center" },
    credits: { enabled: false },
    tooltip: { enabled: false },
    plotOptions: {
      pie: {
        startAngle: -90,
        endAngle: 90,
        center: ["50%", "75%"],
        size: "90%",
        dataLabels: {
          enabled: true,
          format: "<b>{point.y}%</b>",
          style: { fontSize: "14px", fontWeight: "bold", color: "#333" },
          y: -10,
        },
      },
    },
    series: [
      {
        name: "Win %",
        innerSize: "65%",
        data: [
          { name: "Wins", y: percentage, color: "#4CAF50" },
          { name: "Losses", y: 100 - percentage, color: "#EFEFEF" },
        ],
      },
    ],
  });

  return (
    <motion.div
      className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-lg mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center bg-gray-100 px-4 py-2 rounded-md mb-6">
        <img
          className="w-5 h-5 mr-2"
          src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic-tip.png"
          alt="Tip"
          loading="lazy"
        />
        <div className="text-xs sm:text-sm font-semibold text-gray-700">
          Pick players evenly from both teams
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          className="flex flex-col items-center bg-gray-50 p-4 rounded-lg shadow"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
        >
          <HighchartsReact
            highcharts={Highcharts}
            options={getChartOptions("Wins Batting First", batFirstWinPercent)}
          />
          <div className="text-gray-700 font-semibold mt-2 text-xs sm:text-sm">
            Wins Batting First
          </div>
        </motion.div>
        <motion.div
          className="flex flex-col items-center bg-gray-50 p-4 rounded-lg shadow"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
        >
          <HighchartsReact
            highcharts={Highcharts}
            options={getChartOptions("Wins While Chasing", batSecondWinPercent)}
          />
          <div className="text-gray-700 font-semibold mt-2 text-xs sm:text-sm">
            Wins While Chasing
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Main VenuePerformance Component
function VenuePerformance() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const matchInSights = location.state?.matchInSights;
  const [activeTab, setActiveTab] = useState("OVERVIEW");

  const formatLabel = formatMap[matchInSights?.format] || matchInSights?.format;
  const Tabs = [
    "OVERVIEW",
    `LAST 10 ${formatLabel} MATCH`,
    matchInSights?.home,
    matchInSights?.away,
  ];

  useEffect(() => {
    if (!matchInSights?.season_game_uid) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.post(
          "https://plapi.perfectlineup.in/fantasy/stats/venue_and_pitch_analysis",
          {
            season_game_uid: matchInSights.season_game_uid,
            league_id: matchInSights.league_id,
            sports_id: "7",
          },
          {
            headers: {
              sessionkey: "3cd0fb996816c37121c765f292dd3f78",
              moduleaccess: "7",
              "Content-Type": "application/json",
            },
          }
        );
        setData(response.data.data);
      } catch (error) {
        setError(error.message || "An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [matchInSights?.season_game_uid]);

  if (loading) return <SkeletonLoader />;
  if (error) return <div className="text-red-500 text-center">Error: {error}</div>;
  if (!matchInSights) return null;

  return (
    <motion.div
      className="w-full min-h-screen bg-gray-50 flex flex-col items-center justify-start"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header Section */}
      <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto p-4 border-b bg-white rounded-b-lg shadow-md">
        <div className="flex items-center justify-between">
          <Link
            to={`/fixture-info/Cricket/${matchInSights.season_game_uid}/${matchInSights.home}_vs_${matchInSights.away}/${matchInSights.league_id}`}
            state={{ fixtureDetails: matchInSights }}
          >
            <motion.div
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </motion.div>
          </Link>
          <div className="flex flex-col sm:flex-row items-center justify-between w-full px-2 sm:px-4">
            <div className="flex items-center space-x-2 mb-2 sm:mb-0">
              <img
                src={`${FLAG_BASE_URL}${matchInSights.home_flag}`}
                alt={`${matchInSights.home} flag`}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow-sm"
                loading="lazy"
              />
              <span className="font-semibold text-sm sm:text-lg text-gray-800">{matchInSights.home}</span>
            </div>
            <div className="text-center">
              <div className="text-red-500 font-bold text-sm sm:text-lg">{getCountdownTime(matchInSights.season_scheduled_date)}</div>
              <div className="text-gray-600 text-xs sm:text-sm mt-1">
                {(() => {
                  const utcDate = new Date(matchInSights.season_scheduled_date);
                  const istDate = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000);
                  return istDate.toLocaleString("en-IN");
                })()}
              </div>
              <div className="text-gray-500 text-xs sm:text-sm">{matchInSights.league_name} - {formatLabel}</div>
            </div>
            <div className="flex items-center space-x-2 mt-2 sm:mt-0">
              <span className="font-semibold text-sm sm:text-lg text-gray-800">{matchInSights.away}</span>
              <img
                src={`${FLAG_BASE_URL}${matchInSights.away_flag}`}
                alt={`${matchInSights.away} flag`}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shadow-sm"
                loading="lazy"
              />
            </div>
          </div>
        </div>
        <div
          className={`w-full text-center py-2 mt-2 rounded-md text-xs sm:text-sm ${
            Number(matchInSights.playing_announce) === 1 ? "text-green-700 bg-green-100" : "text-gray-700 bg-gray-100"
          }`}
        >
          {Number(matchInSights.playing_announce) === 1 ? "Playing 11 is announced" : "Playing 11 is not announced"}
        </div>
      </div>

      {/* Venue Info */}
      {data?.venue_info && (
        <motion.div
          className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto text-center py-3 font-bold text-lg sm:text-xl md:text-2xl text-gray-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {data.venue_info.ground_name}
        </motion.div>
      )}

      {/* Match Format Info */}
      <motion.div
        className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto p-4 text-center bg-gray-100 rounded-lg shadow-md text-xs sm:text-sm text-gray-600"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {formatLabel} on this venue over the last 6 months. Points are displayed only for batting & bowling efforts, fielding related points are not calculated.
      </motion.div>

      {/* Tabs Navigation */}
      <motion.div
        className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto mt-6 border-b flex justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <nav className="flex flex-wrap justify-center gap-2 sm:gap-4 py-2">
          {Tabs.map((tab) => (
            <TabButton
              key={tab}
              label={tab}
              isActive={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            />
          ))}
        </nav>
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "OVERVIEW" && data && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            {/* Venue Stats */}
            <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto mt-6">
              <div className="flex items-center mb-4">
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                  Venue Stats
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
              </div>
              <FantasyPointsGraph data={data.fp_breakdown_graph} />
            </div>

            {/* Win Probability */}
            <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto mt-6">
              <div className="flex items-center mb-2">
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                  Win Probability
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 italic mb-4">Make even selection of batsman and bowlers</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <motion.div
                  className="bg-gray-100 p-4 rounded-lg text-center shadow"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{data.avg_first_inning_score}</span>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Avg First Innings Score</p>
                </motion.div>
                <motion.div
                  className="bg-gray-100 p-4 rounded-lg text-center shadow"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{data.avg_wicket_lost_per_inning}</span>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Avg Wickets Lost per Inning</p>
                </motion.div>
              </div>
            </div>

            {/* Toss Trends */}
            <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto mt-6">
              <div className="flex items-center mb-2">
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                  Toss Trends
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 italic mb-4">At this venue</p>
              <TossStatistics data={data} />
            </div>

            {/* Pacers Perform Better */}
            <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto mt-6">
              <div className="flex items-center mb-4">
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                  Pacers Perform Better
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
              </div>
              <FantasyPointsBowGraph data={data.bowling_analysis} />
            </div>

            {/* Equal Chance of Winning */}
            <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto mt-6">
              <div className="flex items-center mb-2">
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                  Equal Chance of Winning
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 italic mb-4">Batting first or second</p>
              <TossStatisticsChart data={data.toss_trend} />
            </div>

            {/* Frequent Captain and Vice Captain */}
            <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto mt-6">
              <div className="flex items-center mb-2">
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                  Frequent Captain & Vice Captain
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 italic mb-4">Appearances on this venue</p>
              <PlayerList players={data.player_list} matchInSights={matchInSights} />
            </div>

            {/* Top Players */}
            <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto mt-6">
              <div className="flex items-center mb-4">
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                  Top Players on This Venue
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
              </div>
              <Leaderboard playersData={data.player_list} matchInSights={matchInSights} />
            </div>
          </motion.div>
        )}

        {activeTab === `LAST 10 ${formatLabel} MATCH` && data && (
          <motion.div
            key="last10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <motion.div
                  className="bg-gray-100 p-4 rounded-lg text-center shadow"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{data.avg_first_inning_score}</span>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Avg First Innings Score</p>
                </motion.div>
                <motion.div
                  className="bg-gray-100 p-4 rounded-lg text-center shadow"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{data.avg_wicket_lost_per_inning}</span>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Avg Wickets Lost per Inning</p>
                </motion.div>
              </div>
              <VenueMatchCardList matches={data.matches_on_venue} />
            </div>
          </motion.div>
        )}

        {activeTab === matchInSights.home && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <HomeTeam matchInSights={matchInSights} />
          </motion.div>
        )}

        {activeTab === matchInSights.away && (
          <motion.div
            key="away"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <AwayTeam matchInSights={matchInSights} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default VenuePerformance;