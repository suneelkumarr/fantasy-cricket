import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios";
import { AiOutlineMenuFold } from "react-icons/ai";
import { motion, AnimatePresence } from "framer-motion";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

// Constants
const FLAG_BASE_URL = "https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/";
const JERSEY_BASE_URL = "https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/";
const positionMap = { WK: "Wicket Keeper", BAT: "Batsman", BOW: "Bowler", AR: "All Rounder" };
const positionOrder = ["Wicket Keeper", "Batsman", "All Rounder", "Bowler"];

// Utility Functions
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  });
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

// TopPlayers Component
const TopPlayers = ({ matchData, stats_details }) => {
  const [activeTab, setActiveTab] = useState("FANTASY POINTS");

  const data = useMemo(() => {
    return activeTab === "FANTASY POINTS"
      ? [...stats_details.player_list].sort((a, b) => Number(b.fantasy_points) - Number(a.fantasy_points))
      : [...stats_details.player_list].sort((a, b) => Number(b.value) - Number(a.value));
  }, [activeTab, stats_details.player_list]);

  const maxFantasyPoints = Math.max(...data.map((player) => Number(player.fantasy_points)), 0);
  const maxValue = Math.max(...data.map((player) => Number(player.value)), 0);

  return (
    <motion.div
      className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-lg mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-4">Top Players</h2>
      <div className="flex flex-col sm:flex-row items-center bg-gray-100 p-1 rounded-full mb-6 space-y-2 sm:space-y-0">
        <TabButton
          label="FANTASY POINTS"
          isActive={activeTab === "FANTASY POINTS"}
          onClick={() => setActiveTab("FANTASY POINTS")}
        />
        <TabButton
          label="Value"
          isActive={activeTab === "Value"}
          onClick={() => setActiveTab("Value")}
        />
      </div>
      <div className="flex items-center gap-2 mb-4">
        <img
          src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic-mark-fav-enable.png"
          alt="Favorite Icon"
          className="w-4 h-4"
          loading="lazy"
        />
        <span className="text-xs sm:text-sm text-gray-600">
          Mark a player as favorite and be reminded next time they play
        </span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {data.map((player) => {
            const currentValue = activeTab === "FANTASY POINTS" ? Number(player.fantasy_points) : Number(player.value);
            const maxForTab = activeTab === "FANTASY POINTS" ? maxFantasyPoints : maxValue;
            const progressWidth = maxForTab ? (currentValue / maxForTab) * 100 : 0;
            const progressColor = player.team_abbr === matchData?.home ? "from-green-400 to-green-600" : "from-blue-400 to-blue-600";

            return (
              <motion.div
                key={player.player_uid}
                className="flex flex-col sm:flex-row items-center p-4 bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-100 mb-3"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-full sm:w-40 flex-shrink-0 mb-2 sm:mb-0">
                  <div className="font-medium text-gray-800 truncate max-w-[80px] sm:max-w-[100px] text-sm sm:text-base">
                    {player.display_name}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 flex items-center">
                    {player.player_position}
                    <span className="mx-1 w-1 h-1 bg-gray-400 rounded-full inline-block"></span>
                    {player.team_abbr}
                  </div>
                </div>
                <div className="flex items-center flex-grow px-0 sm:px-4 w-full sm:w-auto">
                  <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${progressColor}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressWidth}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <span className="ml-3 text-xs sm:text-sm font-medium text-gray-700 w-24 text-right">
                    {currentValue}
                  </span>
                </div>
                <div className="ml-0 sm:ml-2 w-5 flex-shrink-0 mt-2 sm:mt-0">
                  <img
                    src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic-mark-fav-disable.png"
                    alt="Favorite Icon"
                    className="w-5 h-5"
                    loading="lazy"
                  />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

// DreamTeamChart Component
const DreamTeamChart = ({ matchData, stats_details }) => {
  const { BOW, AR, BAT, WK } = stats_details.position_breakdown;
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
          { name: "WK", y: WK, color: "#4CAF50" },
          { name: "BAT", y: BAT, color: "#FF5722" },
          { name: "AR", y: AR, color: "#2196F3" },
          { name: "BOWL", y: BOW, color: "#FFC107" },
        ],
      },
    ],
  };

  const chartData = chartOptions.series[0].data;

  return (
    <motion.div
      className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-lg mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 text-center mb-2">
        Fantasy Points by Position in Dream Team
      </h2>
      <p className="text-xs sm:text-sm text-gray-600 text-center mb-4">
        Breakdown of fantasy points based on positions for players in the Dream Team
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
};

// DreamTeamChartFielding Component
const DreamTeamChartFielding = ({ matchData, stats_details }) => {
  const { BATTING, BOWLING, FIELDING } = stats_details.category_breakdown;
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
          { name: "BATTING", y: BATTING, color: "#4CAF50" },
          { name: "BOWLING", y: BOWLING, color: "#FF5722" },
          { name: "FIELDING", y: FIELDING, color: "#2196F3" },
        ],
      },
    ],
  };

  const chartData = chartOptions.series[0].data;

  return (
    <motion.div
      className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-lg mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 text-center mb-2">
        Dream Team Points Breakdown
      </h2>
      <p className="text-xs sm:text-sm text-gray-600 text-center mb-4">
        Breakdown of fantasy points into Batting, Bowling, and Fielding
      </p>
      <div className="overflow-hidden mb-6">
        <HighchartsReact highcharts={Highcharts} options={chartOptions} />
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-800 text-center">Points Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
};

// DreamTeam Component
const DreamTeam = ({ matchData, stats_details }) => {
  const dreamTeamPlayers = stats_details.player_list.filter((player) => player.in_perfect_lineup === "1");
  const [activeTab, setActiveTab] = useState("FantasyPoints");

  const totalValue = dreamTeamPlayers.reduce((sum, player) => {
    const value = activeTab === "FantasyPoints" ? Number(player.pl_fantasy_points ?? 0) : Number(player.player_salary ?? 0);
    return sum + value;
  }, 0);

  const groupedByPosition = dreamTeamPlayers.reduce((acc, player) => {
    const positionLabel = positionMap[player.player_position] || player.player_position;
    if (!acc[positionLabel]) acc[positionLabel] = [];
    acc[positionLabel].push(player);
    return acc;
  }, {});

  return (
    <motion.div
      className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto p-4 sm:p-6 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">Dream Team</h1>
        <div className="flex items-center">
          <div className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 mr-2">{totalValue}</div>
          <div className="text-xs sm:text-sm text-gray-600 leading-tight">
            Dream Team<br />
            {activeTab === "FantasyPoints" ? "Points" : "Salary"}
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-center bg-gray-100 p-1 rounded-full mb-6 space-y-2 sm:space-y-0">
        <TabButton
          label="Salary"
          isActive={activeTab === "Salary"}
          onClick={() => setActiveTab("Salary")}
        />
        <TabButton
          label="Fantasy Points"
          isActive={activeTab === "FantasyPoints"}
          onClick={() => setActiveTab("FantasyPoints")}
        />
      </div>
      <div
        className="relative bg-no-repeat bg-cover bg-center rounded-xl p-4 sm:p-6 min-h-[400px]"
        style={{
          backgroundImage: 'url("https://www.perfectlineup.in/static/media/ic_cricket_stadium.7d551e28.png")',
        }}
      >
        <div className="relative space-y-8">
          {positionOrder.map((posLabel) => {
            const players = groupedByPosition[posLabel];
            if (!players) return null;
            return (
              <div key={posLabel} className="mb-6">
                <div className="font-bold text-lg sm:text-xl text-white mb-2">{posLabel}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {players.map((player) => (
                    <motion.div
                      key={player.stats_player_id}
                      className="flex items-center bg-white/90 p-3 rounded-lg shadow-md"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3 }}
                    >
                      <img
                        className="w-8 h-8 mr-2 rounded-full"
                        alt={`${player.display_name} Jersey`}
                        src={`${JERSEY_BASE_URL}${player.jersey}`}
                        loading="lazy"
                      />
                      {player.C === 1 && (
                        <span className="text-red-600 font-semibold mr-2">C</span>
                      )}
                      {player.C === 2 && (
                        <span className="text-blue-600 font-semibold mr-2">VC</span>
                      )}
                      <div className="flex-1 text-sm sm:text-base text-gray-800">{player.display_name}</div>
                      <div className="font-bold text-sm sm:text-base text-gray-800">
                        {activeTab === "FantasyPoints" ? player.pl_fantasy_points : player.player_salary}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

// Overview Component
const Overview = ({ matchData }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!matchData?.season_game_uid || !matchData?.league_id) return;
    setLoading(true);
    try {
      const response = await axios.post(
        "https://plapi.perfectlineup.in/fantasy/completed_match/get_match_dream_team",
        {
          season_game_uid: matchData.season_game_uid,
          league_id: matchData.league_id,
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
  }, [matchData?.season_game_uid, matchData?.league_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <SkeletonLoader />;
  if (error) return <div className="text-red-500 text-center">Error: {error}</div>;
  if (!data) return <div className="text-center text-gray-600">No data available.</div>;

  return (
    <div className="w-full">
      <DreamTeam matchData={data.fixture_details} stats_details={data.stats} />
      <DreamTeamChart matchData={data.fixture_details} stats_details={data.stats} />
      <DreamTeamChartFielding matchData={data.fixture_details} stats_details={data.stats} />
      <TopPlayers matchData={data.fixture_details} stats_details={data.stats} />
    </div>
  );
};

// Table Component
const Table = ({ headers = [], rows = [] }) => (
  <div className="overflow-x-auto mb-4">
    <table className="w-full border-collapse bg-white text-xs sm:text-sm">
      <thead className="bg-gray-100">
        <tr>
          {headers.map((header, idx) => (
            <th key={idx} className="p-2 font-semibold text-gray-700 border-b text-left">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rIdx) => (
          <tr key={rIdx} className="border-b hover:bg-gray-50">
            {row.map((col, cIdx) => (
              <td key={cIdx} className="p-2 text-gray-700">
                {col}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Accordion Component
const Accordion = ({ title, score, overs, children }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <motion.div
      className="border rounded-lg bg-white mb-4 shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold text-gray-800 text-sm sm:text-base">{title}</span>
        <div className="flex items-center space-x-4">
          <div className="text-gray-700 text-sm sm:text-base">
            {score} <span className="text-xs sm:text-sm text-gray-500">[{overs}]</span>
          </div>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4 border-t overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Scorecard Component
const Scorecard = ({ matchData, stats_details }) => {
  const parsedScoreData = JSON.parse(matchData.score_data);
  const inningKey = "1";
  const homeTeamId = matchData.home_uid;
  const awayTeamId = matchData.away_uid;
  const homeTeamName = matchData.home_team_name;
  const awayTeamName = matchData.away_team_name;

  const homeScore = parsedScoreData[inningKey].home_team_score;
  const homeWickets = parsedScoreData[inningKey].home_wickets;
  const homeOvers = parsedScoreData[inningKey].home_overs;
  const awayScore = parsedScoreData[inningKey].away_team_score;
  const awayWickets = parsedScoreData[inningKey].away_wickets;
  const awayOvers = parsedScoreData[inningKey].away_overs;

  const homeTeamData = stats_details.scoring_stats[inningKey][homeTeamId];
  const awayTeamData = stats_details.scoring_stats[inningKey][awayTeamId];

  const buildBattingRows = (batters = []) =>
    batters.map((player) => [
      <div key={player.player_uid}>
        <span className="block font-medium text-gray-800">{player.player_name}</span>
        <span className="block text-xs text-gray-500">{player.out_string}</span>
      </div>,
      player.batting_runs,
      player.batting_balls_faced,
      player.batting_fours,
      player.batting_sixes,
      player.batting_strike_rate,
    ]);

  const buildBowlingRows = (bowlers = []) =>
    bowlers.map((player) => {
      const oversFloat = parseFloat(player.bowling_overs || 0);
      const economy = oversFloat > 0 ? (Number(player.bowling_runs_given) / oversFloat).toFixed(2) : "0.00";
      return [
        <div key={player.player_uid}>
          <span className="block font-medium text-gray-800">{player.player_name}</span>
        </div>,
        player.bowling_overs,
        player.bowling_maiden_overs,
        player.bowling_runs_given,
        player.bowling_wickets,
        economy,
      ];
    });

  const buildFoWRows = (fows = []) =>
    fows.map((item, idx) => [
      <div key={idx}>
        <span className="block font-medium text-gray-800">{item.name}</span>
        <span className="block text-xs text-gray-500">{item.how_out}</span>
      </div>,
      item.score_at_dismissal,
      item.overs_at_dismissal,
    ]);

  const homeBattingHeaders = ["Batsman", "R", "B", "4s", "6s", "SR"];
  const homeBowlingHeaders = ["Bowler", "O", "M", "R", "W", "ECON"];
  const homeFoWHeaders = ["Fall of Wicket", "Score", "Over"];
  const homeBattingRows = buildBattingRows(homeTeamData?.batting);
  const homeBowlingRows = buildBowlingRows(homeTeamData?.bowling);
  const homeFoWRows = buildFoWRows(homeTeamData?.fall_of_wickets);

  const awayBattingHeaders = ["Batsman", "R", "B", "4s", "6s", "SR"];
  const awayBowlingHeaders = ["Bowler", "O", "M", "R", "W", "ECON"];
  const awayFoWHeaders = ["Fall of Wicket", "Score", "Over"];
  const awayBattingRows = buildBattingRows(awayTeamData?.batting);
  const awayBowlingRows = buildBowlingRows(awayTeamData?.bowling);
  const awayFoWRows = buildFoWRows(awayTeamData?.fall_of_wickets);

  return (
    <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto py-8 px-4">
      <Accordion
        title={homeTeamName}
        score={`${homeScore}/${homeWickets}`}
        overs={`${homeOvers} Ovs`}
      >
        <Table headers={homeBattingHeaders} rows={homeBattingRows} />
        <Table headers={homeBowlingHeaders} rows={homeBowlingRows} />
        <Table headers={homeFoWHeaders} rows={homeFoWRows} />
      </Accordion>
      <Accordion
        title={awayTeamName}
        score={`${awayScore}/${awayWickets}`}
        overs={`${awayOvers} Ovs`}
      >
        <Table headers={awayBattingHeaders} rows={awayBattingRows} />
        <Table headers={awayBowlingHeaders} rows={awayBowlingRows} />
        <Table headers={awayFoWHeaders} rows={awayFoWRows} />
      </Accordion>
    </div>
  );
};

// ProjectedVsActual Component
const ProjectedVsActual = ({ fixture_details, fantasy_data }) => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");

  const handleFilterSelect = (filterValue) => {
    setSelectedFilter(filterValue);
    setFilterOpen(false);
  };

  const applyFilter = (playerArray) => {
    if (!playerArray) return [];
    if (selectedFilter === "All") return playerArray;

    const filterMap = {
      BATSMAN: "BAT",
      "WICKET-KEEPER": "WK",
      "ALL ROUNDER": "AR",
      BOWLER: "BOW",
    };

    if (["BATSMAN", "WICKET-KEEPER", "ALL ROUNDER", "BOWLER"].includes(selectedFilter)) {
      const requiredPos = filterMap[selectedFilter];
      return playerArray.filter((p) => p.player_position === requiredPos);
    }

    if ([fixture_details.home, fixture_details.away].includes(selectedFilter)) {
      return playerArray.filter((p) => p.team_abbr === selectedFilter);
    }

    return playerArray;
  };

  const getBarWidths = (proj, actual) => {
    const p = Number(proj);
    const a = Number(actual);
    const total = Math.max(p, a, 1);
    return { projPercent: (p / total) * 100, actualPercent: (a / total) * 100 };
  };

  const renderPlayerRow = (player) => {
    const { projPercent, actualPercent } = getBarWidths(player.player_fppg, player.fantasy_points);

    return (
      <motion.div
        key={`${player.player_uid}-${player.team_abbr}`}
        className="flex flex-col border-b last:border-0 py-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row items-start mb-2">
          <div className="w-full sm:w-40 flex-shrink-0 mb-2 sm:mb-0">
            <div className="font-medium text-gray-800 truncate max-w-[80px] sm:max-w-[100px] text-sm sm:text-base">
              {player.full_name}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 flex items-center">
              {player.player_position}
              <span className="mx-1 w-1 h-1 bg-gray-400 rounded-full inline-block"></span>
              {player.team_abbr}
            </div>
          </div>
          <div className="w-full sm:w-auto flex flex-col space-y-1 flex-1">
            <div className="flex items-center">
              <motion.div
                className="h-8 bg-yellow-200 flex items-center justify-end rounded-r"
                initial={{ width: 0 }}
                animate={{ width: `${projPercent}%` }}
                transition={{ duration: 0.5 }}
                style={{ minWidth: player.player_fppg ? "2.5rem" : "0" }}
              >
                <div className="text-xs sm:text-sm text-gray-700 pr-2">{player.player_fppg}</div>
              </motion.div>
            </div>
            <div className="flex items-center">
              <motion.div
                className="h-8 bg-blue-200 flex items-center justify-end rounded-r"
                initial={{ width: 0 }}
                animate={{ width: `${actualPercent}%` }}
                transition={{ duration: 0.5 }}
                style={{ minWidth: player.fantasy_points ? "2.5rem" : "0" }}
              >
                <div className="text-xs sm:text-sm text-gray-700 pr-2">{player.fantasy_points}</div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const underData = applyFilter(fantasy_data.under);
  const withinData = applyFilter(fantasy_data.within);
  const overData = applyFilter(fantasy_data.over);

  return (
    <motion.div
      className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-lg mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2">
        Projected vs Actual Fantasy Points
      </h2>
      <p className="text-xs sm:text-sm text-gray-600 mb-4">
        PL projected points estimated before the match with actual fantasy points earned
      </p>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 mb-6">
        <div className="flex items-center space-x-4 sm:space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-200"></div>
            <div className="text-xs sm:text-sm text-gray-700">Actual Points</div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-200"></div>
            <div className="text-xs sm:text-sm text-gray-700">Projected Points</div>
          </div>
        </div>
        <div className="relative">
          <motion.button
            className="bg-blue-600 text-white px-3 py-1 rounded flex items-center"
            onClick={() => setFilterOpen((prev) => !prev)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AiOutlineMenuFold className="mr-1 text-xl" />
          </motion.button>
          <AnimatePresence>
            {filterOpen && (
              <motion.div
                className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg py-1 z-10"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {["All", "BATSMAN", "WICKET-KEEPER", "ALL ROUNDER", "BOWLER", fixture_details.home, fixture_details.away].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => handleFilterSelect(filter)}
                    className="w-full text-left px-4 py-2 text-xs sm:text-sm hover:bg-gray-100"
                  >
                    {filter}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {["Underestimated", "Within Range", "Overestimated"].map((category, idx) => {
        const data = idx === 0 ? underData : idx === 1 ? withinData : overData;
        return (
          <div key={category} className="mt-6">
            <div className="text-md sm:text-lg font-semibold text-gray-800 mb-3">{category}</div>
            {data.length > 0 ? (
              data.map((player) => renderPlayerRow(player))
            ) : (
              <div className="text-xs sm:text-sm text-gray-500">No data found.</div>
            )}
          </div>
        );
      })}
    </motion.div>
  );
};

// Fantasy Component
const Fantasy = ({ matchData }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!matchData?.season_game_uid || !matchData?.league_id) return;
    setLoading(true);
    try {
      const response = await axios.post(
        "https://plapi.perfectlineup.in/fantasy/completed_match/get_fixture_fantasy",
        {
          season_game_uid: matchData.season_game_uid,
          league_id: matchData.league_id,
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
  }, [matchData?.season_game_uid, matchData?.league_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <SkeletonLoader />;
  if (error) return <div className="text-red-500 text-center">Error: {error}</div>;
  if (!data) return <div className="text-center text-gray-600">No data available.</div>;

  return (
    <div className="w-full">
      <ProjectedVsActual fixture_details={data?.fixture_details} fantasy_data={data?.fantasy_data} />
    </div>
  );
};

// MatchCard Component
const MatchCard = ({ matchData, stats_details }) => {
  const scoreData = JSON.parse(matchData.score_data);
  const {
    away_overs,
    home_overs,
    away_wickets,
    home_wickets,
    away_team_score,
    home_team_score,
  } = scoreData["1"];

  const [activeTab, setActiveTab] = useState("SCORECARD");
  const toggleList = ["OVERVIEW", "SCORECARD", "FANTASY"];
  const formattedDate = formatDate(matchData.season_scheduled_date);

  return (
    <>
      {/* Match Summary Card */}
      <motion.div
        className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto bg-white shadow-lg rounded-xl p-4 sm:p-6 my-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-center text-gray-800 mb-1">
          {matchData.league_name}
        </h2>
        <div className="text-xs sm:text-sm text-gray-500 text-center mb-4">
          {formattedDate} | {matchData.ground_name}
        </div>
        <div className="flex items-center justify-between">
          <motion.div
            className="flex flex-col items-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <img
              src={`${FLAG_BASE_URL}${matchData.home_flag}`}
              alt={`${matchData.home_team_name} flag`}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-sm mb-2"
              loading="lazy"
            />
            <h3 className="font-bold text-sm sm:text-base text-gray-800">{matchData.home_team_name}</h3>
            <p className="text-xs sm:text-sm text-gray-600">
              {home_team_score}/{home_wickets} ({home_overs} Overs)
            </p>
          </motion.div>
          <div className="flex flex-col items-center">
            <p className="text-gray-400 text-sm sm:text-base">Vs</p>
            {matchData.result_info && (
              <p className="text-green-600 font-semibold mt-1 text-xs sm:text-sm">{matchData.result_info}</p>
            )}
          </div>
          <motion.div
            className="flex flex-col items-center"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <img
              src={`${FLAG_BASE_URL}${matchData.away_flag}`}
              alt={`${matchData.away} flag`}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full shadow-sm mb-2"
              loading="lazy"
            />
            <h3 className="font-bold text-sm sm:text-base text-gray-800">{matchData.away_team_name}</h3>
            <p className="text-xs sm:text-sm text-gray-600">
              {away_team_score}/{away_wickets} ({away_overs} Overs)
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Tabs and Content */}
      <motion.div
        className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto bg-white shadow-lg rounded-xl p-4 sm:p-6 my-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 mb-6">
          {toggleList.map((tab) => (
            <TabButton
              key={tab}
              label={tab}
              isActive={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            />
          ))}
        </div>
        <AnimatePresence mode="wait">
          {activeTab === "OVERVIEW" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Overview matchData={matchData} />
            </motion.div>
          )}
          {activeTab === "SCORECARD" && (
            <motion.div
              key="scorecard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Scorecard matchData={matchData} stats_details={stats_details} />
            </motion.div>
          )}
          {activeTab === "FANTASY" && (
            <motion.div
              key="fantasy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Fantasy matchData={matchData} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

// Main MatchReport Component
function MatchReport() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const matchInSights = location.state?.matchInSights;
  const matchSessionIDs = location.state?.matchSessionIDs;

  useEffect(() => {
    const hasSeasonGameUid = matchInSights?.season_game_uid || matchInSights?.es_season_game_uid;
    if (!hasSeasonGameUid || !matchInSights?.league_id) return;

    const gameUid = matchInSights?.season_game_uid || matchInSights?.es_season_game_uid;

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.post(
          "https://plapi.perfectlineup.in/fantasy/completed_match/get_fixture_scorecard",
          {
            season_game_uid: matchSessionIDs,
            league_id: matchInSights?.league_id,
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
  }, [matchInSights?.season_game_uid, matchInSights?.es_season_game_uid, matchInSights?.league_id, matchSessionIDs]);

  if (loading) return <SkeletonLoader />;
  if (error) return <div className="text-red-500 text-center">Error: {error}</div>;
  if (!matchInSights) return null;
  if (!data) return <div className="text-center text-gray-600">No data available.</div>;

  return (
    <motion.div
      className="w-full min-h-screen bg-gray-50 flex flex-col items-center justify-start"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Navigation Bar */}
      <div className="relative flex items-center p-4 border-b w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto mt-4 bg-white rounded-b-lg shadow-md">
        <Link
          key={matchInSights?.season_game_uid || matchInSights?.es_season_game_uid}
          to={`/stats-playground/Cricket/${matchInSights?.season_game_uid || matchInSights?.es_season_game_uid}/${matchInSights.home}_vs_${matchInSights.away}/${matchInSights.league_id}`}
          state={{ matchInSights: matchInSights }}
        >
          <motion.div
            className="absolute left-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200"
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
        <span className="mx-auto font-semibold text-lg sm:text-xl text-gray-800">Match Report</span>
      </div>

      {/* Match Card */}
      {data && data.fixture_details && (
        <MatchCard matchData={data.fixture_details} stats_details={data.stats_details} />
      )}
    </motion.div>
  );
}

export default MatchReport;