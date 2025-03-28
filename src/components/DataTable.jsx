import React, { useState, useEffect, useMemo } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell } from "recharts";


const COLORS = ["#16a34a", "#0ea5e9", "#facc15", "#ef4444", "#6366f1"];


const FantasyBreakdown = ({ bowlingData, totalPoints }) => {
  const formattedData = Object.entries(bowlingData).map(([key, value]) => ({
    name: key.replace(/_/g, " "),
    value: value || 0
  }));

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Fantasy Points Breakdown</h3>
      <PieChart width={350} height={250}>
        <Pie 
          data={formattedData} 
          dataKey="value" 
          nameKey="name" 
          cx="50%" 
          cy="50%" 
          outerRadius={80}
          fill="#16a34a"
          label
        >
          {formattedData.map((_, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLORS[index % COLORS.length]} 
            />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
      <div className="text-center mt-4">
        Total Points: <span className="font-bold">{totalPoints}</span>
      </div>
    </div>
  );
};


const BowlingStats = ({ er, wickets, lbw, dotBalls }) => {
  const data = [
    { metric: "Economy Rate", value: er },
    { metric: "Wickets", value: wickets },
    { metric: "LBW", value: lbw },
    { metric: "Dot Balls", value: dotBalls },
  ];

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Bowling Performance</h3>
      <BarChart width={350} height={250} data={data}>
        <XAxis dataKey="metric" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
      </BarChart>
    </div>
  );
};


const PointsComposition = ({ breakdown }) => {
  const data = [{
    name: "Points",
    ...breakdown.bowling,
    ...breakdown.batting,
    ...breakdown.others
  }];

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Points Composition</h3>
      <BarChart width={350} height={250} data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        {Object.keys(data[0]).map((key, index) => 
          key !== "name" && (
            <Bar 
              key={key} 
              dataKey={key} 
              fill={`hsl(${index * 60}, 70%, 50%)`} 
              radius={[4, 4, 0, 0]}
            />
          )
        )}
      </BarChart>
    </div>
  );
};


const StatCard = ({ label, value, icon }) => (
  <div className="flex items-center space-x-2 p-4 bg-white rounded-lg shadow-sm">
    <span className="text-xl">{icon}</span>
    <div>
      <div className="text-gray-500 text-sm">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  </div>
);




const getCountdownTime = (scheduledDate) => {
  const now = new Date();
  const targetDate = new Date(scheduledDate);
  targetDate.setHours(targetDate.getHours() + 5);
  targetDate.setMinutes(targetDate.getMinutes() + 30);

  const diff = targetDate - now;
  if (diff <= 0) return "Event Started";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

const FixtureHeader = ({ matchInSights }) => {
  const navigate = useNavigate();

  // Parse toss_data only when it changes
  const tossText = useMemo(() => {
    if (matchInSights.toss_data && matchInSights.toss_data !== "[]") {
      try {
        const parsed = JSON.parse(matchInSights.toss_data);
        return parsed?.text || "";
      } catch (error) {
        console.error("Failed to parse toss_data JSON:", error);
      }
    }
    return "";
  }, [matchInSights.toss_data]);

  // Toggle text every second if conditions are met
  const [showLineup, setShowLineup] = useState(true);
  useEffect(() => {
    if (
      matchInSights.playing_announce === "1" &&
      matchInSights.toss_data !== "[]"
    ) {
      const interval = setInterval(() => setShowLineup((prev) => !prev), 1000);
      return () => clearInterval(interval);
    }
  }, [matchInSights.playing_announce, matchInSights.toss_data]);

  // Countdown state updated every second
  const [countdown, setCountdown] = useState(
    getCountdownTime(matchInSights.season_scheduled_date)
  );
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdownTime(matchInSights.season_scheduled_date));
    }, 1000);
    return () => clearInterval(timer);
  }, [matchInSights.season_scheduled_date]);

  // Determine the bubble text based on conditions
  const bubbleText = useMemo(() => {
    if (matchInSights.playing_announce !== "1")
      return "Playing 11 is not announced";
    if (matchInSights.toss_data === "[]") return "Lineup Out";
    return tossText ? (showLineup ? "Lineup Out" : tossText) : "Lineup Out";
  }, [
    matchInSights.playing_announce,
    matchInSights.toss_data,
    tossText,
    showLineup,
  ]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 bg-white">
      <div className="flex items-center">
        <button onClick={() => navigate("/")} className="mr-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex-1 flex items-center justify-center space-x-2">
          <img
            src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${matchInSights.home_flag}`}
            alt={matchInSights.home}
            className="w-6 h-6 rounded-full"
          />
          <span className="font-semibold text-base sm:text-lg text-gray-800">
            {matchInSights.home} vs {matchInSights.away}
          </span>
          <img
            src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${matchInSights.away_flag}`}
            alt={matchInSights.away}
            className="w-6 h-6 rounded-full"
          />
        </div>
      </div>
      <div className="text-center mt-1 text-red-500 font-semibold text-sm sm:text-base">
        {countdown}
      </div>
      <div className="flex justify-center mt-2">
        <div
          className="bg-white border border-gray-300 text-gray-600 px-3 py-1
                       rounded shadow text-sm text-center transition-all duration-1000 ease-in-out"
        >
          {bubbleText}
        </div>
      </div>
    </div>
  );
};


const PlayerPerformanceChart = ({ data }) => {
  // Processed data example
  const chartData = data
    .filter(player => player.formatData.individual.length > 0)
    .map(player => {
      const match = player.formatData.individual[0];
      const breakdown = match.pts_breakdown;
      const batting = Object.values(breakdown.batting || {}).reduce((sum, val) => sum + (val || 0), 0);
      const bowling = Object.values(breakdown.bowling || {}).reduce((sum, val) => sum + (val || 0), 0);
      const fielding = Object.values(breakdown.fielding || {}).reduce((sum, val) => sum + (val || 0), 0);
      const others = breakdown.others?.starting_points || 0;
      return {
        name: player.player_name,
        Batting: batting,
        Bowling: bowling,
        Fielding: fielding,
        Others: others,
      };
    });

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
        Player Fantasy Points Breakdown
      </h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} />
          <YAxis />
          <Tooltip />
          <Legend verticalAlign="top" height={36} />
          <Bar dataKey="Batting" stackId="a" fill="#4CAF50" />
          <Bar dataKey="Bowling" stackId="a" fill="#2196F3" />
          <Bar dataKey="Fielding" stackId="a" fill="#FF9800" />
          <Bar dataKey="Others" stackId="a" fill="#9E9E9E" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};




const PlayerStatisticsTable = ({ data }) => {
  const [expandedRows, setExpandedRows] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: 'player_name', direction: 'asc' });

  // Helper function to flatten nested data
  const getSortableData = (player) => ({
    player_name: player.player_name,
    player_team: player.player_team,
    position: player.position,
    salary: player.salary,
    fantasy_points: player.formatData?.overall?.fantasy_points || 0,
    value: player.formatData?.overall?.Avg_value || 0,
    no_of_stats: player.formatData?.overall?.no_of_stats || 0,
    runs: player.formatData?.overall?.runs || 0,
    century: player.formatData?.overall?.century || 0,
    half_century: player.formatData?.overall?.half_century || 0,
    sixes: player.formatData?.overall?.sixes || 0,
    fours: player.formatData?.overall?.fours || 0,
    wickets: player.formatData?.overall?.wickets || 0,
    bowled: player.formatData?.overall?.bowled || 0,
    lbw: player.formatData?.overall?.lbw || 0,
    catches: player.formatData?.overall?.catches || 0,
    economy: player.formatData?.overall?.Avg_ER || 0,
    strike_rate: player.formatData?.overall?.Avg_SR || 0,
  });

  // Sort the data based on the current sort configuration
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const valA = getSortableData(a)[sortConfig.key];
      const valB = getSortableData(b)[sortConfig.key];

      if (typeof valA === 'string') {
        return valA.localeCompare(valB) * (sortConfig.direction === 'asc' ? 1 : -1);
      } else if (typeof valA === 'number') {
        return (valA - valB) * (sortConfig.direction === 'asc' ? 1 : -1);
      }
      return 0; // Fallback for unsupported types
    });
  }, [data, sortConfig]);

  // Toggle row expansion
  const toggleRow = (player_uid) => {
    setExpandedRows((prev) => ({ ...prev, [player_uid]: !prev[player_uid] }));
  };

  // Update sort configuration
  const requestSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <div className="overflow-x-auto mt-2">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2"></th>
            {[
              "Player Name",
              "Team",
              "Position",
              "Salary",
              "Fantasy Points",
              "Value",
              "Stats",
              "Runs",
              "Century",
              "Half Century",
              "Sixes",
              "Fours",
              "Wickets",
              "Bowled",
              "LBW",
              "Catches",
              "Economy",
              "Strike Rate",
            ].map((header) => (
              <th
                key={header}
                className="px-4 py-2 cursor-pointer text-xs font-semibold text-gray-700 uppercase tracking-wider"
                onClick={() => requestSort(header.replace(/\s+/g, '_').toLowerCase())}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sortedData.map((player) => (
            <React.Fragment key={player.player_uid}>
              <tr className="hover:bg-gray-50 text-sm">
                <td className="px-4 py-2 cursor-pointer" onClick={() => toggleRow(player.player_uid)}>
                  {expandedRows[player.player_uid] ? '▼' : '▶'}
                </td>
                <td className="px-4 py-2">{player.player_name}</td>
                <td className="px-4 py-2">{player.player_team}</td>
                <td className="px-4 py-2">{player.position}</td>
                <td className="px-4 py-2">{player.salary}</td>
                <td className="px-4 py-2">{player.formatData.overall.fantasy_points}</td>
                <td className="px-4 py-2">{player.formatData.overall.Avg_value.toFixed(2)}</td>
                <td className="px-4 py-2">{player.formatData.overall.no_of_stats}</td>
                <td className="px-4 py-2">{player.formatData.overall.runs}</td>
                <td className="px-4 py-2">{player.formatData.overall.century}</td>
                <td className="px-4 py-2">{player.formatData.overall.half_century}</td>
                <td className="px-4 py-2">{player.formatData.overall.sixes}</td>
                <td className="px-4 py-2">{player.formatData.overall.fours}</td>
                <td className="px-4 py-2">{player.formatData.overall.wickets}</td>
                <td className="px-4 py-2">{player.formatData.overall.bowled}</td>
                <td className="px-4 py-2">{player.formatData.overall.lbw}</td>
                <td className="px-4 py-2">{player.formatData.overall.catches}</td>
                <td className="px-4 py-2">{player.formatData.overall.Avg_ER.toFixed(2)}</td>
                <td className="px-4 py-2">{player.formatData.overall.Avg_SR.toFixed(2)}</td>
              </tr>
              {expandedRows[player.player_uid] && (
                <tr>
                  <td colSpan="19" className="px-4 py-2">
                    <table className="min-w-full bg-gray-50 border">
                      <thead>
                        <tr className="text-xs bg-gray-200">
                          {[
                            "Title",
                            "Date",
                            "Salary",
                            "Fantasy Points",
                            "Value",
                            "Runs",
                            "Century",
                            "Half Century",
                            "Sixes",
                            "Fours",
                            "Duck",
                            "Wickets",
                            "Bowled",
                            "LBW",
                            "Catches",
                            "Run Out Catch",
                            "Run Out Throw",
                            "Stumpings",
                            "Average Economy",
                            "Average Strike Rate",
                          ].map((header) => (
                            <th key={header} className="px-4 py-1">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {player.formatData.individual.map((match, idx) => (
                          <tr key={idx} className="text-xs">
                            <td className="px-4 py-1">{match.title}</td>
                            <td className="px-4 py-1">{match.season_date}</td>
                            <td className="px-4 py-1">{match.salary}</td>
                            <td className="px-4 py-1">{match.fantasy_points}</td>
                            <td className="px-4 py-1">{match.value.toFixed(2)}</td>
                            <td className="px-4 py-1">{match.runs}</td>
                            <td className="px-4 py-1">{match.century}</td>
                            <td className="px-4 py-1">{match.half_century}</td>
                            <td className="px-4 py-1">{match.sixes}</td>
                            <td className="px-4 py-1">{match.fours}</td>
                            <td className="px-4 py-1">{match.duck}</td>
                            <td className="px-4 py-1">{match.wickets}</td>
                            <td className="px-4 py-1">{match.bowled}</td>
                            <td className="px-4 py-1">{match.lbw}</td>
                            <td className="px-4 py-1">{match.catches}</td>
                            <td className="px-4 py-1">{match.run_out_catch}</td>
                            <td className="px-4 py-1">{match.run_out_throw}</td>
                            <td className="px-4 py-1">{match.stumpings}</td>
                            <td className="px-4 py-1">{match.Avg_ER}</td>
                            <td className="px-4 py-1">{match.Avg_SR}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};


const PlayerDashboard = ({ player }) => {
  // Handle empty array or multiple match data entries
  const matchDataArray = player.formatData.individual || [];
  
  // Aggregate stats if there are multiple matches
  const aggregatedStats = matchDataArray.reduce(
    (acc, data) => ({
      fantasy_points: acc.fantasy_points + (data.fantasy_points || 0),
      wickets: acc.wickets + (data.wickets || 0),
      ER: data.ER ? (acc.ER + data.ER) / (acc.matchCount + 1) : acc.ER, // Average ER
      lbw: acc.lbw + (data.lbw || 0),
      dotBalls: acc.dotBalls + (data.pts_breakdown?.bowling?.DOT_BALL || 0),
      matchCount: acc.matchCount + 1,
      pts_breakdown: {
        bowling: {
          ...acc.pts_breakdown.bowling,
          DOT_BALL: acc.dotBalls + (data.pts_breakdown?.bowling?.DOT_BALL || 0)
        }
      }
    }),
    {
      fantasy_points: 0,
      wickets: 0,
      ER: 0,
      lbw: 0,
      dotBalls: 0,
      matchCount: 0,
      pts_breakdown: { bowling: { DOT_BALL: 0 } }
    }
  );

  const quickStats = [
    { 
      label: "Total Fantasy Points", 
      value: aggregatedStats.fantasy_points, 
      icon: "⭐" 
    },
    { 
      label: "Salary", 
      value: `₹${player.salary} Cr`, 
      icon: "💰" 
    },
    { 
      label: "Total Wickets", 
      value: aggregatedStats.wickets, 
      icon: "🏏" 
    },
    { 
      label: "Avg Economy Rate", 
      value: aggregatedStats.matchCount > 0 
        ? aggregatedStats.ER.toFixed(2) 
        : "N/A", 
      icon: "📊" 
    }
  ];

  const bowlingStats = {
    er: aggregatedStats.ER,
    wickets: aggregatedStats.wickets,
    lbw: aggregatedStats.lbw,
    dotBalls: aggregatedStats.dotBalls
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <h2 className="text-2xl font-bold">{player.player_name}</h2>
        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
          {player.position}
        </span>
      </div>

      {/* Matches Played Info */}
      <div className="text-sm text-gray-600">
        Based on {matchDataArray.length} match
        {matchDataArray.length !== 1 ? "es" : ""}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {quickStats.map((stat, index) => (
          <StatCard
            key={index}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
      </div>

      {/* Fantasy Breakdown - Using aggregated data */}
      <FantasyBreakdown
        bowlingData={aggregatedStats.pts_breakdown.bowling}
        totalPoints={aggregatedStats.fantasy_points}
      />

      {/* Bowling Performance */}
      <BowlingStats {...bowlingStats} />

      {/* Points Composition */}
      <PointsComposition breakdown={aggregatedStats.pts_breakdown} />
    </div>
  );
};







function DataTable() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [noOfStats, setNoOfStats] = useState("1");
  const [leagueFilter, setLeagueFilter] = useState("0");
  const [selectedFormat, setSelectedFormat] = useState("T20");
  const [selectedStatsType, setSelectedStatsType] = useState("Form");

  const location = useLocation();
  const matchInSights = location.state?.matchInSights;

  // Arrays defining the filter options
  const formats = ["T20", "ODI", "Test", "T10"];
  const statsTypes = ["Form", "Opposition", "Venue"];

  useEffect(() => {
    if (!matchInSights?.season_game_uid) {
      console.warn("season_game_uid is undefined or null");
      return;
    }

    const fetchStatsData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.post(
          "https://plapi.perfectlineup.in/fantasy/stats/get_game_stats",
          {
            season_game_uid: matchInSights.season_game_uid,
            no_of_matches: noOfStats,
            by_league: leagueFilter,
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
      } catch (err) {
        setError("Failed to fetch stats data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatsData();
  }, [matchInSights?.season_game_uid, noOfStats, leagueFilter]);

  if (!matchInSights) {
    return null; // Handle cases where matchInSights is not available
  }

  const filterData = Array.isArray(data)
    ? data
        .filter(
          (item) =>
            item &&
            selectedFormat &&
            selectedStatsType &&
            item[selectedFormat]?.[selectedStatsType.toLowerCase()]
        )
        .map((item) => ({
          player_name: item.player_name,
          player_team: item.player_team,
          player_uid: item.player_uid,
          position: item.position,
          salary: item.salary,
          formatData: item[selectedFormat][selectedStatsType.toLowerCase()],
        }))
    : [];

  console.log("Filtered Data:", filterData);

  

  return (
    <main className="flex-grow container mx-auto px-4 py-6">
      <header className="w-full">
        {/* Assuming FixtureHeader is defined elsewhere */}
        <FixtureHeader matchInSights={matchInSights} />
      </header>

      <div className="flex flex-col md:flex-row gap-4 p-4">
        {/* Filters Section */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* No. of Stats Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              NO. OF STATS
            </label>
            <div className="relative">
              <select
                value={noOfStats}
                onChange={(e) => setNoOfStats(e.target.value)}
                className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-gray-700"
              >
                {[1, 5, 10, 15, 30].map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* League Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              League Filter
            </label>
            <div className="relative">
              <select
                value={leagueFilter}
                onChange={(e) => setLeagueFilter(e.target.value)}
                className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-gray-700"
              >
                <option value="0">All</option>
                <option value="1">This League</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Loading and Error States */}
        <div className="flex-1">
          {loading && (
            <div className="text-center text-gray-600">Loading...</div>
          )}
          {error && <div className="text-red-500 text-center">{error}</div>}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:space-x-6 p-4">
        {/* Format Type Filter */}
        <div className="flex flex-col mb-4 md:mb-0">
          <div className="text-sm font-semibold text-gray-700 mb-2">
            FORMAT TYPE
          </div>
          <div className="flex flex-wrap gap-2">
            {formats.map((format) => (
              <button
                key={format}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedFormat === format
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                onClick={() => setSelectedFormat(format)}
              >
                {format.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Type Filter */}
        <div className="flex flex-col">
          <div className="text-sm font-semibold text-gray-700 mb-2">
            STATS TYPE
          </div>
          <div className="flex flex-wrap gap-2">
            {statsTypes.map((statsType) => (
              <button
                key={statsType}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedStatsType === statsType
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                onClick={() => setSelectedStatsType(statsType)}
              >
                {statsType.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-4">
        <h6
          id="fixture-info"
          className="text-lg font-semibold text-gray-800 mb-2"
        >
          Showing Stats for the last {noOfStats} {selectedFormat} matches of all
          Players.
        </h6>
        <h6 id="value-legend" className="text-base text-gray-700 mb-2">
          <span className="font-semibold text-blue-600">Value</span> - This
          'Value' shows the importance of the player in the match. Greater value
          means better performing player.
        </h6>
        <h6 id="stats-legend" className="text-base text-gray-700">
          <span className="font-semibold text-green-600">Number of Stats</span>{" "}
          - Number of matches you want to see the data for.
        </h6>
      </div>


      {filterData && (
        <PlayerPerformanceChart data={filterData} />
      )}


      
      {filterData && (

      <PlayerStatisticsTable data={filterData} />
      )}


      {filterData && (
        <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-8">Player Performance Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filterData.map((player) => (
            <PlayerDashboard key={player.player_uid} player={player} />
          ))}
        </div>
      </div>
        )}
    </main>
  );
}

export default DataTable;
