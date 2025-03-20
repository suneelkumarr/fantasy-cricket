import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FiChevronRight } from "react-icons/fi";

// Function to get the current timestamp in IST
const getCurrentTimestampInIST = () => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes offset
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.getTime();
};

// Example: parse the date string "2025-02-26 12:00:00" into something like "26 Feb 2025"
function formatMatchDate(dateStr) {
  if (!dateStr) return "";
  const dateObj = new Date(dateStr);
  const options = { day: "2-digit", month: "short", year: "numeric" };
  return dateObj.toLocaleDateString(undefined, options); // e.g. "26 Feb 2025"
}

// We map the season.format => T10, T20, etc.
// Adjust as needed if your format codes differ
const formatMap = {
  4: "T10",
  3: "T20",
  2: "ODI",
  1: "TEST",
};

function PopupContainer({ playerData, onClick }) {
  const { item, player } = playerData;
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const playerName = player.full_name;

  useEffect(() => {
    if (!item?.stats_player_id) {
      console.warn("season_game_uid is undefined or null");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.post(
          "https://plapi.perfectlineup.in/fantasy/stats/get_fantasy_breakdown",
          {
            stats_season_id: item.stats_season_id,
            stats_player_id: item.stats_player_id,
          },
          {
            headers: {
              sessionkey: "3cd0fb996816c37121c765f292dd3f78",
              moduleaccess: "7",
              "Content-Type": "application/json",
            },
          }
        );

        console.log("API Response:", response.data.data);
        setData(response.data.data);
      } catch (error) {
        console.error("API Error:", error);
        setError(error.message || "An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [item?.stats_player_id]);

  // Handle Loading & Error States
  if (loading) {
    return <div className="text-center text-gray-600">Loading...</div>;
  }
  if (error) {
    return <div className="text-red-500 text-center">Error: {error}</div>;
  }
  if (!data) {
    return <div className="text-center text-gray-600">No data available.</div>;
  }

  // Extract main fields from the data
  const { season, stats, in_perfect_lineup, salary, total_fantasy_points } =
    data;
  const matchFormat = formatMap[season.format] || "T10"; // fallback to T10
  const matchDate = formatMatchDate(season.season_scheduled_date);

  // Usually only 1 stats entry in your example; take the first
  const stat = stats[0];
  const battingOrder = stat.batting_order || "-";

  // We'll show the sum of "Batting" breakdown as the "Bat. Pts"
  let battingPointsSum = 0;
  let battingRows = [];

  if (stat.breakdown && stat.breakdown.Batting) {
    const b = stat.breakdown.Batting;
    // Sum up all the batting points
    battingPointsSum = Object.values(b).reduce(
      (sum, item) => sum + (item.points || 0),
      0
    );

    // Build row data for specific batting events
    battingRows = [
      {
        label: "Runs",
        value: b["Runs"]?.value ?? "-",
        points: b["Runs"]?.points ?? "-",
      },
      {
        label: "4's",
        value: b["4's"]?.value ?? "-",
        points: b["4's"]?.points ?? "-",
      },
      {
        label: "6's",
        value: b["6's"]?.value ?? "-",
        points: b["6's"]?.points ?? "-",
      },
      {
        label: "Strike Rate",
        value: b["SR"]?.value ?? "-",
        points: b["SR"]?.points ?? "-",
      },
      {
        label: "30/50/100",
        // e.g. "0/0/0" for both value & points
        value: `${b["30"]?.value ?? 0}/${b["50"]?.value ?? 0}/${
          b["100"]?.value ?? 0
        }`,
        points: `${b["30"]?.points ?? 0}/${b["50"]?.points ?? 0}/${
          b["100"]?.points ?? 0
        }`,
      },
      {
        label: "Duck",
        value: b["Duck"]?.value ?? "-",
        points: b["Duck"]?.points ?? "-",
      },
    ];
  }

  const isPerfectLineup = in_perfect_lineup === "1";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Popup container */}
      <div className="bg-white w-full max-w-md rounded shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h2 className="text-base font-semibold">Batting Player Card</h2>
          <button
            onClick={onClick}
            className="text-gray-500 hover:text-gray-700"
          >
            {/* You could use any icon here (e.g. heroicons X icon) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586 
                     l4.293-4.293a1 1 0 011.414 1.414L11.414 
                     10l4.293 4.293a1 1 0 01-1.414 1.414L10 
                     11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 
                     10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Player & match info */}
          <div className="flex justify-between items-start">
            <div>
              <div className="font-bold text-base">{playerName}</div>
              <div className="text-sm text-gray-600">
                {season.away} vs {season.home} ({matchFormat}) - {matchDate}
              </div>
              <div className="text-sm text-gray-600">{season.ground_name}</div>
            </div>
            <div>
              {/* Example image from your snippet */}
              <img
                src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic-batting-order-bg.png"
                alt="Batting order bg"
                className="h-12 w-12 object-contain"
              />
            </div>
          </div>

          {/* Status strip (Perfect lineup + Salary) */}
          <div className="bg-gray-50 p-2 rounded flex items-center space-x-3">
            {isPerfectLineup && (
              <div className="flex items-center space-x-1 text-green-600 font-medium">
                <span>In PerfectLineup</span>
                {/* or an icon: <i className="icon-ic-perfect" /> */}
              </div>
            )}
            <div className="text-sm font-medium text-gray-800">
              Salary: {salary}
            </div>
          </div>

          {/* Batting order & points */}
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
            <div className="text-sm">
              Bat. Order <i className="icon-ic-bat inline-block" />{" "}
              <span className="font-semibold">{battingOrder}</span>
            </div>
            <div className="text-sm">
              Bat. Pts <span className="font-semibold">{battingPointsSum}</span>
            </div>
          </div>

          {/* Table Header */}
          <div className="flex text-sm font-semibold border-b pb-1">
            <div className="w-1/2">Event</div>
            <div className="w-1/4 text-center">Actual</div>
            <div className="w-1/4 text-center">Points</div>
          </div>

          {/* Batting breakdown rows */}
          <div className="space-y-1">
            {battingRows.map((row, idx) => (
              <div key={idx} className="flex text-sm">
                <div className="w-1/2">{row.label}</div>
                <div className="w-1/4 text-center">
                  {row.value === "0" ? "0" : row.value}
                </div>
                <div className="w-1/4 text-center">
                  {row.points === "0" ? "0" : row.points}
                </div>
              </div>
            ))}
          </div>

          {/* Footer - total batting points */}
          <div className="flex items-center justify-between bg-gray-100 p-2 rounded">
            <span className="text-sm font-medium">
              Total Batting fantasy points
            </span>
            <span className="text-sm font-bold">{battingPointsSum}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper to decide which color bar to show on the right side of each cell.
 * - If item is empty (no object) => we return gray bar
 * - If in_perfect_lineup = "1" => red bar (dream team)
 * - If in_bottom_lineup = "1" => orange bar (bottom 20%)
 * Otherwise => gray bar
 */
function getBarClass(item) {
  // If no item, empty object, or batting_order is "0" (i.e., DNP or DNB) then show gray
  if (
    !item ||
    Array.isArray(item) ||
    Object.keys(item).length === 0 ||
    item.batting_order === "0"
  ) {
    return "bg-gray-300";
  }
  if (item.in_perfect_lineup === "1") {
    // Dream Team => green
    return "bg-green-500";
  }
  if (item.in_bottom_lineup === "1") {
    // Bottom 20% => red
    return "bg-red-500";
  }
  // Otherwise, gray
  return "bg-gray-300";
}

/**
 * Returns the text to display in each of the 5 columns:
 * - If no item => "DNP"
 * - If batting_order === "0" => "DNB"
 * - Otherwise => show the batting order number, plus "Chase" if is_chase === 1
 */
// Helper: decides the text we display in the cell
function getCellDisplay(item) {
  if (!item || Array.isArray(item) || Object.keys(item).length === 0) {
    return { main: "DNP", sub: "" }; // Did Not Play
  }
  if (item.batting_order === "0") {
    return { main: "DNB", sub: "" }; // Did Not Bat
  }
  // Otherwise show #<batting_order> + "Chase" if is_chase === 1
  const main = `${item.batting_order}`;
  const sub = item.is_chase === 1 ? "Chase" : "";
  return { main, sub };
}

// A tiny date formatter that returns "DD MMM YY" (e.g., "19 Mar 25").
function formatDate(dateStr) {
  const d = new Date(dateStr);
  // Safely handle invalid dates:
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

// Calculate strike rate: (runs / balls) * 100
function getStrikeRate(runs, balls) {
  if (!balls || balls === 0) return "0.00";
  return ((runs / balls) * 100).toFixed(2);
}

function getEconaomy(runs, over) {
  if (!over || over === 0) return "0.00";
  return (runs / over).toFixed(2);
}

/**
 * Determine the opponent name for each batting_data entry.
 * If the player's team_uid === item.home_uid, then opponent is item.away.
 * Otherwise, if the player's team_uid === item.away_uid, then opponent is item.home.
 */
function getOpponentName(player, item) {
  if (player.team_uid === item.home_uid) return item.away;
  if (player.team_uid === item.away_uid) return item.home;
  return "";
}

// Returns top 5 players by descending avg_fantasy_points
function top5ByFantasyPoints(players) {
  return [...players]
    .sort((a, b) => b.avg_fantasy_points - a.avg_fantasy_points)
    .slice(0, 5);
}

function PowerPlayBat({ playersData, matchInSights }) {
  // We have three tabs: Overall, home, away
  const [activeTab, setActiveTab] = useState("Overall");
  // Track which player is expanded to show recent performance
  const [expandedPlayer, setExpandedPlayer] = useState(null);

  // Toggle expand/collapse for a given player
  const toggleExpand = (playerId) => {
    setExpandedPlayer((prev) => (prev === playerId ? null : playerId));
  };

  // For the progress bar, find the highest avg_fantasy_points among all players
  const MAX_VALUE = Math.max(
    ...playersData.map((p) => p.avg_fantasy_points),
    1
  );

  // Decide which players to show based on the active tab
  let finalPlayers = [];
  if (activeTab === "Overall") {
    // Top 5 from ALL players
    finalPlayers = top5ByFantasyPoints(playersData);
  } else if (activeTab === matchInSights.home) {
    // Filter home team only, then take top 5
    const homePlayers = playersData.filter(
      (p) => p.team_uid === matchInSights.home_uid
    );
    finalPlayers = top5ByFantasyPoints(homePlayers);
  } else if (activeTab === matchInSights.away) {
    // Filter away team only, then take top 5
    const awayPlayers = playersData.filter(
      (p) => p.team_uid === matchInSights.away_uid
    );
    finalPlayers = top5ByFantasyPoints(awayPlayers);
  }

  return (
    <div className="player-specification-list w-full max-w-3xl mx-auto">
      {/* Tabs */}
      <div className="tab-container mb-4  mt-4">
        {/* 
    flex items-center => sets up a flex container
    bg-gray-100 p-1 => a light gray background with padding
    rounded-full => rounded "pill" shape
  */}
        <div className="flex items-center bg-gray-100 p-1 rounded-full">
          {["Overall", matchInSights.home, matchInSights.away].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
          flex-1                /* Each button fills an equal portion of the row */
          text-center           /* Center text within each button */
          px-4 py-2 text-sm font-medium focus:outline-none 
          transition-colors duration-200
          ${
            activeTab === tab
              ? "bg-white text-gray-900 shadow rounded-full" /* Active tab styling */
              : "bg-transparent text-gray-500" /* Inactive tab styling */
          }
        `}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Player List */}
      <div className="player-items-list -mx-4">
        {finalPlayers.map((player) => {
          const matchesCount = player.batting_data?.length || 0;
          const avgPoints = player.avg_fantasy_points || 0;

          // Calculate the width percentage for the progress bar
          const barPercentage = Math.min(
            (avgPoints / MAX_VALUE) * 100,
            100
          ).toFixed(2);

          // Color logic: if player's team is home => "home" style, else "away" style
          const isHome = player.team_uid === matchInSights.home_uid;
          const barColor = isHome ? "bg-blue-200" : "bg-pink-200";

          return (
            <div key={player.player_uid}>
              {/* Main row */}
              <div className="player-detail-section flex items-center justify-between px-4 py-3 border-b border-gray-200">
                {/* Left Player Info */}
                <div className="player-graph-team flex items-center">
                  <img
                    alt=""
                    src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_prefer_inactive.svg"
                    className="w-5 h-5 mr-2 cursor-pointer"
                  />
                  <div className="player-name-box">
                    <div className="name-style font-medium text-gray-800">
                      {player.nick_name}
                    </div>
                    {player.batting_style && (
                      <div className="position-style text-xs text-gray-500">
                        {player.batting_style}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Slider + Points + Arrow */}
                <div
                  className={`player-graph-box ${
                    isHome ? "player-graph-box-home" : "player-graph-box-away"
                  } flex items-center space-x-3`}
                >
                  {/* Progress Bar */}
                  <div className="relative w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`${barColor} h-full transition-all duration-300`}
                      style={{ width: `${barPercentage}%` }}
                    ></div>
                  </div>

                  {/* Matches and Points */}
                  <div className="points-style text-sm text-gray-700">
                    {matchesCount} M | {avgPoints.toFixed(2)} Pts
                  </div>

                  {/* Expand/Collapse Arrow */}
                  <div
                    className="right-icon-container text-gray-400 cursor-pointer"
                    onClick={() => toggleExpand(player.player_uid)}
                  >
                    <i
                      className={`icon-arrow-down transform transition-transform duration-300 ${
                        expandedPlayer === player.player_uid ? "rotate-180" : ""
                      }`}
                    >
                      ▼
                    </i>
                  </div>
                </div>
              </div>

              {/* Expanded Panel (Recent performance) */}
              {expandedPlayer === player.player_uid && (
                <div className="player-inning-distribution px-4 py-3 bg-gray-50">
                  <div className="header font-medium text-sm mb-2">
                    Recent performance in overs 1st-6th
                  </div>

                  {/* Table header */}
                  <div className="scorring-header hidden md:flex text-xs font-semibold text-gray-500 border-b border-gray-200 pb-1 mb-2">
                    <div className="flex-1">Opponent &amp; Date</div>
                    <div className="w-12 text-center">RUNS</div>
                    <div className="w-10 text-center">4S</div>
                    <div className="w-10 text-center">6S</div>
                    <div className="w-12 text-center">SR</div>
                    <div className="w-12 text-center">FPTS</div>
                  </div>

                  {/* Each performance row */}
                  <div className="scoring-list space-y-2">
                    {player.batting_data.map((item, idx) => {
                      const dateStr = formatDate(item.season_scheduled_date);
                      const opponent = getOpponentName(player, item);
                      const sr = getStrikeRate(item.run, item.ball);

                      return (
                        <div
                          key={idx}
                          className="scorring-item flex flex-col md:flex-row text-sm"
                        >
                          <div className="flex-1 flex items-center">
                            <div className="text-abbr font-semibold">
                              vs {opponent}
                            </div>
                            <div className="text-date text-gray-400 ml-2">
                              ({dateStr})
                            </div>
                          </div>
                          <div className="flex md:w-12 md:justify-center">
                            {item.run}
                          </div>
                          <div className="flex md:w-10 md:justify-center">
                            {item.four}
                          </div>
                          <div className="flex md:w-10 md:justify-center">
                            {item.six}
                          </div>
                          <div className="flex md:w-12 md:justify-center">
                            {sr}
                          </div>
                          <div className="flex md:w-12 md:justify-center text-fpts">
                            {item.fantasy_points}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Gray separator at the bottom */}
                  <div className="gray-clr mt-2 h-px bg-gray-200" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PowerPlayBow({ playersData, matchInSights }) {
  // We have three tabs: Overall, home, away
  const [activeTab, setActiveTab] = useState("Overall");
  // Track which player is expanded to show recent performance
  const [expandedPlayer, setExpandedPlayer] = useState(null);

  // Toggle expand/collapse for a given player
  const toggleExpand = (playerId) => {
    setExpandedPlayer((prev) => (prev === playerId ? null : playerId));
  };

  // For the progress bar, find the highest avg_fantasy_points among all players
  const MAX_VALUE = Math.max(
    ...playersData.map((p) => p.avg_fantasy_points),
    1
  );

  // Decide which players to show based on the active tab
  let finalPlayers = [];
  if (activeTab === "Overall") {
    // Top 5 from ALL players
    finalPlayers = top5ByFantasyPoints(playersData);
  } else if (activeTab === matchInSights.home) {
    // Filter home team only, then take top 5
    const homePlayers = playersData.filter(
      (p) => p.team_uid === matchInSights.home_uid
    );
    finalPlayers = top5ByFantasyPoints(homePlayers);
  } else if (activeTab === matchInSights.away) {
    // Filter away team only, then take top 5
    const awayPlayers = playersData.filter(
      (p) => p.team_uid === matchInSights.away_uid
    );
    finalPlayers = top5ByFantasyPoints(awayPlayers);
  }

  return (
    <div className="player-specification-list w-full max-w-3xl mx-auto">
      {/* Tabs */}
      <div className="tab-container mb-4 mt-4">
        {/* 
    flex items-center => sets up a flex container
    bg-gray-100 p-1 => a light gray background with padding
    rounded-full => rounded "pill" shape
  */}
        <div className="flex items-center bg-gray-100 p-1 rounded-full">
          {["Overall", matchInSights.home, matchInSights.away].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
          flex-1                /* Each button fills an equal portion of the row */
          text-center           /* Center text within each button */
          px-4 py-2 text-sm font-medium focus:outline-none 
          transition-colors duration-200
          ${
            activeTab === tab
              ? "bg-white text-gray-900 shadow rounded-full" /* Active tab styling */
              : "bg-transparent text-gray-500" /* Inactive tab styling */
          }
        `}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Player List */}
      <div className="player-items-list -mx-4">
        {finalPlayers.map((player) => {
          const matchesCount = player.bowling_data?.length || 0;
          const avgPoints = player.avg_fantasy_points || 0;

          // Calculate the width percentage for the progress bar
          const barPercentage = Math.min(
            (avgPoints / MAX_VALUE) * 100,
            100
          ).toFixed(2);

          // Color logic: if player's team is home => "home" style, else "away" style
          const isHome = player.team_uid === matchInSights.home_uid;
          const barColor = isHome ? "bg-blue-200" : "bg-pink-200";

          return (
            <div key={player.player_uid}>
              {/* Main row */}
              <div className="player-detail-section flex items-center justify-between px-4 py-3 border-b border-gray-200">
                {/* Left Player Info */}
                <div className="player-graph-team flex items-center">
                  <img
                    alt=""
                    src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_prefer_inactive.svg"
                    className="w-5 h-5 mr-2 cursor-pointer"
                  />
                  <div className="player-name-box">
                    <div className="name-style font-medium text-gray-800">
                      {player.nick_name}
                    </div>
                    {player.bowling_style && (
                      <div className="position-style text-xs text-gray-500">
                        {player.bowling_style} |{" "}
                        {player.bowling_type ? player.bowling_type : ""}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Slider + Points + Arrow */}
                <div
                  className={`player-graph-box ${
                    isHome ? "player-graph-box-home" : "player-graph-box-away"
                  } flex items-center space-x-3`}
                >
                  {/* Progress Bar */}
                  <div className="relative w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`${barColor} h-full transition-all duration-300`}
                      style={{ width: `${barPercentage}%` }}
                    ></div>
                  </div>

                  {/* Matches and Points */}
                  <div className="points-style text-sm text-gray-700">
                    {matchesCount} M | {avgPoints.toFixed(2)} Pts
                  </div>

                  {/* Expand/Collapse Arrow */}
                  <div
                    className="right-icon-container text-gray-400 cursor-pointer"
                    onClick={() => toggleExpand(player.player_uid)}
                  >
                    <i
                      className={`icon-arrow-down transform transition-transform duration-300 ${
                        expandedPlayer === player.player_uid ? "rotate-180" : ""
                      }`}
                    >
                      ▼
                    </i>
                  </div>
                </div>
              </div>

              {/* Expanded Panel (Recent performance) */}
              {expandedPlayer === player.player_uid && (
                <div className="player-inning-distribution px-4 py-3 bg-gray-50">
                  <div className="header font-medium text-sm mb-2">
                    Recent performance in overs 1st-6th
                  </div>

                  {/* Table header */}
                  <div className="scorring-header hidden md:flex text-xs font-semibold text-gray-500 border-b border-gray-200 pb-1 mb-2">
                    <div className="flex-1">Opponent &amp; Date</div>
                    <div className="w-12 text-center">OV</div>
                    <div className="w-10 text-center">WK</div>
                    <div className="w-10 text-center">RUNS</div>
                    <div className="w-12 text-center">ER</div>
                    <div className="w-12 text-center">FPTS</div>
                  </div>

                  {/* Each performance row */}
                  <div className="scoring-list space-y-2">
                    {player.bowling_data.map((item, idx) => {
                      const dateStr = formatDate(item.season_scheduled_date);
                      const opponent = getOpponentName(player, item);
                      const sr = getEconaomy(item.run, item.over);

                      return (
                        <div
                          key={idx}
                          className="scorring-item flex flex-col md:flex-row text-sm"
                        >
                          <div className="flex-1 flex items-center">
                            <div className="text-abbr font-semibold">
                              vs {opponent}
                            </div>
                            <div className="text-date text-gray-400 ml-2">
                              ({dateStr})
                            </div>
                          </div>
                          <div className="flex md:w-12 md:justify-center">
                            {item.over}
                          </div>
                          <div className="flex md:w-10 md:justify-center">
                            {item.wk}
                          </div>
                          <div className="flex md:w-10 md:justify-center">
                            {item.run}
                          </div>
                          <div className="flex md:w-12 md:justify-center">
                            {sr}
                          </div>
                          <div className="flex md:w-12 md:justify-center text-fpts">
                            {item.fantasy_points}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Gray separator at the bottom */}
                  <div className="gray-clr mt-2 h-px bg-gray-200" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DeathOverBow({ playersData, matchInSights }) {
  // We have three tabs: Overall, home, away
  const [activeTab, setActiveTab] = useState("Overall");
  // Track which player is expanded to show recent performance
  const [expandedPlayer, setExpandedPlayer] = useState(null);

  // Toggle expand/collapse for a given player
  const toggleExpand = (playerId) => {
    setExpandedPlayer((prev) => (prev === playerId ? null : playerId));
  };

  // For the progress bar, find the highest avg_fantasy_points among all players
  const MAX_VALUE = Math.max(
    ...playersData.map((p) => p.avg_fantasy_points),
    1
  );

  // Decide which players to show based on the active tab
  let finalPlayers = [];
  if (activeTab === "Overall") {
    // Overall: sort descending by avg_fantasy_points and take top 5
    finalPlayers = [...playersData]
      .sort((a, b) => b.avg_fantasy_points - a.avg_fantasy_points)
      .slice(0, 5);
  } else if (activeTab === matchInSights.home) {
    // Home team: filter, sort by avg_fantasy_points, and take top 5
    finalPlayers = playersData
      .filter((p) => p.team_uid === matchInSights.home_uid)
      .sort((a, b) => b.avg_fantasy_points - a.avg_fantasy_points)
      .slice(0, 5);
  } else if (activeTab === matchInSights.away) {
    // Away team: filter, sort by avg_fantasy_points, and take top 5
    finalPlayers = playersData
      .filter((p) => p.team_uid === matchInSights.away_uid)
      .sort((a, b) => b.avg_fantasy_points - a.avg_fantasy_points)
      .slice(0, 5);
  }

  return (
    <div className="player-specification-list w-full max-w-3xl mx-auto">
      {/* Tabs */}
      <div className="tab-container mb-4 mt-4">
        {/* 
    flex items-center => sets up a flex container
    bg-gray-100 p-1 => a light gray background with padding
    rounded-full => rounded "pill" shape
  */}
        <div className="flex items-center bg-gray-100 p-1 rounded-full">
          {["Overall", matchInSights.home, matchInSights.away].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
          flex-1                /* Each button fills an equal portion of the row */
          text-center           /* Center text within each button */
          px-4 py-2 text-sm font-medium focus:outline-none 
          transition-colors duration-200
          ${
            activeTab === tab
              ? "bg-white text-gray-900 shadow rounded-full" /* Active tab styling */
              : "bg-transparent text-gray-500" /* Inactive tab styling */
          }
        `}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Player List */}
      <div className="player-items-list -mx-4">
        {finalPlayers.map((player) => {
          const matchesCount = player.bowling_data?.length || 0;
          const avgPoints = player.avg_fantasy_points || 0;

          // Calculate the width percentage for the progress bar
          const barPercentage = Math.min(
            (avgPoints / MAX_VALUE) * 100,
            100
          ).toFixed(2);

          // Color logic: if player's team is home => "home" style, else "away" style
          const isHome = player.team_uid === matchInSights.home_uid;
          const barColor = isHome ? "bg-blue-200" : "bg-pink-200";

          return (
            <div key={player.player_uid}>
              {/* Main row */}
              <div className="player-detail-section flex items-center justify-between px-4 py-3 border-b border-gray-200">
                {/* Left Player Info */}
                <div className="player-graph-team flex items-center">
                  <img
                    alt=""
                    src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_prefer_inactive.svg"
                    className="w-5 h-5 mr-2 cursor-pointer"
                  />
                  <div className="player-name-box">
                    <div className="name-style font-medium text-gray-800">
                      {player.nick_name}
                    </div>
                    {player.bowling_style && (
                      <div className="position-style text-xs text-gray-500">
                        {player.bowling_style} |{" "}
                        {player.bowling_type ? player.bowling_type : ""}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Slider + Points + Arrow */}
                <div
                  className={`player-graph-box ${
                    isHome ? "player-graph-box-home" : "player-graph-box-away"
                  } flex items-center space-x-3`}
                >
                  {/* Progress Bar */}
                  <div className="relative w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`${barColor} h-full transition-all duration-300`}
                      style={{ width: `${barPercentage}%` }}
                    ></div>
                  </div>

                  {/* Matches and Points */}
                  <div className="points-style text-sm text-gray-700">
                    {matchesCount} M | {avgPoints.toFixed(2)} Pts
                  </div>

                  {/* Expand/Collapse Arrow */}
                  <div
                    className="right-icon-container text-gray-400 cursor-pointer"
                    onClick={() => toggleExpand(player.player_uid)}
                  >
                    <i
                      className={`icon-arrow-down transform transition-transform duration-300 ${
                        expandedPlayer === player.player_uid ? "rotate-180" : ""
                      }`}
                    >
                      ▼
                    </i>
                  </div>
                </div>
              </div>

              {/* Expanded Panel (Recent performance) */}
              {expandedPlayer === player.player_uid && (
                <div className="player-inning-distribution px-4 py-3 bg-gray-50">
                  <div className="header font-medium text-sm mb-2">
                    Recent performance in overs 1st-6th
                  </div>

                  {/* Table header */}
                  <div className="scorring-header hidden md:flex text-xs font-semibold text-gray-500 border-b border-gray-200 pb-1 mb-2">
                    <div className="flex-1">Opponent &amp; Date</div>
                    <div className="w-12 text-center">OV</div>
                    <div className="w-10 text-center">WK</div>
                    <div className="w-10 text-center">RUNS</div>
                    <div className="w-12 text-center">ER</div>
                    <div className="w-12 text-center">FPTS</div>
                  </div>

                  {/* Each performance row */}
                  <div className="scoring-list space-y-2">
                    {player.bowling_data.map((item, idx) => {
                      const dateStr = formatDate(item.season_scheduled_date);
                      const opponent = getOpponentName(player, item);
                      const sr = getEconaomy(item.run, item.over);

                      return (
                        <div
                          key={idx}
                          className="scorring-item flex flex-col md:flex-row text-sm"
                        >
                          <div className="flex-1 flex items-center">
                            <div className="text-abbr font-semibold">
                              vs {opponent}
                            </div>
                            <div className="text-date text-gray-400 ml-2">
                              ({dateStr})
                            </div>
                          </div>
                          <div className="flex md:w-12 md:justify-center">
                            {item.over}
                          </div>
                          <div className="flex md:w-10 md:justify-center">
                            {item.wk}
                          </div>
                          <div className="flex md:w-10 md:justify-center">
                            {item.run}
                          </div>
                          <div className="flex md:w-12 md:justify-center">
                            {sr}
                          </div>
                          <div className="flex md:w-12 md:justify-center text-fpts">
                            {item.fantasy_points}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Gray separator at the bottom */}
                  <div className="gray-clr mt-2 h-px bg-gray-200" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlayersTable({ allPlayers, matchInSights }) {
  const TEAMS = [
    { label: matchInSights.home, teamId: matchInSights.home_uid },
    { label: matchInSights.away, teamId: matchInSights.away_uid },
  ];

  const [selectedTeam, setSelectedTeam] = useState(TEAMS[0].teamId);
  const [selectedItem, setSelectedItem] = useState(null);

  // Filter players based on the currently selected team
  const filteredPlayers = allPlayers.filter(
    (player) => player.team_uid === selectedTeam
  );

  const handleNumberClick = (item, player) => {
    setSelectedItem({ item, player });
  };

  return (
    <div className="w-full px-4 py-4">
      {/* --- Team Tabs --- */}
      <div className="flex items-center justify-center bg-gray-100 p-1 rounded-full space-x-1">
        {TEAMS.map((team) => {
          const isActive = selectedTeam === team.teamId;
          return (
            <button
              key={team.teamId}
              onClick={() => setSelectedTeam(team.teamId)}
              className={`
                  px-4 py-1.5 rounded-full font-medium transition-colors 
                  ${
                    isActive ? "bg-white text-gray-900 shadow" : "text-gray-500"
                  }
                `}
            >
              {team.label}
            </button>
          );
        })}
      </div>

      {/* --- Legends --- */}
      <div className="mt-4 flex flex-col sm:flex-row sm:space-x-8 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded-sm" />
          <span className="text-sm">Was in dream team</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500 rounded-sm" />
          <span className="text-sm">Bottom 20%</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-300 rounded-sm" />
          <span className="text-sm">No special color (neither)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-bold">DNB</span>
          <span className="text-sm text-gray-600">(Did not bat)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-bold">DNP</span>
          <span className="text-sm text-gray-600">(Did not play)</span>
        </div>
      </div>

      {/* --- List Header for LATEST / OLD --- */}
      <div className="flex justify-between items-center mt-6">
        <div className="left-container" style={{ width: "40%" }}></div>
        <div
          className="right-container-display flex items-center justify-end"
          style={{ width: "60%" }}
        >
          <span className="mr-1">LATEST</span>
          <img
            alt=""
            src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_batting_order.svg"
            className="mx-1 h-4"
          />
          <span className="ml-1">OLD</span>
        </div>
      </div>

      {/* --- Table Header (Column Numbers) --- */}
      <div className="mt-2 bg-gray-100 p-2 rounded flex justify-between items-center">
        <div className="w-1/3" />
        <div className="w-2/3 flex justify-between text-sm font-semibold">
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
          <span>5</span>
        </div>
      </div>

      {/* --- Players List --- */}
      <div className="mt-2">
        {filteredPlayers.map((player) => (
          <div
            key={player.player_uid}
            className="flex border-b last:border-0 py-3 items-center"
          >
            {/* Left side: Player name + role */}
            <div className="w-1/3 flex items-center">
              <img
                src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_prefer_inactive.svg"
                alt=""
                className="w-5 h-5 mr-2"
              />
              <div>
                <div className="font-semibold">{player.nick_name}</div>
                <div className="text-xs text-gray-600">{player.position}</div>
              </div>
            </div>

            {/* Right side: 5 columns for batting_order_data */}
            <div className="w-2/3 flex justify-between items-center">
              {player.batting_order_data.map((item, idx) => {
                const { main, sub } = getCellDisplay(item);
                const barClass = getBarClass(item);

                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center cursor-pointer"
                    onClick={() => {
                      // Only show popup if item represents Dream Team or Bottom 20%
                      if (
                        item &&
                        (item.in_perfect_lineup === "1" ||
                          item.in_bottom_lineup === "1")
                      ) {
                        handleNumberClick(item, player);
                      }
                    }}
                  >
                    {main === "DNP" || main === "DNB" ? (
                      <div className="text-sm text-gray-800 font-medium">
                        {main}
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <div className="text-sm font-medium">{main}</div>
                        {sub && (
                          <div className="text-xs text-gray-500 italic">
                            {sub}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="mt-1">
                      <div className={`${barClass} w-4 h-2 rounded-sm`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* --- Popup (Modal) --- */}
      {selectedItem && (
        <PopupContainer
          playerData={selectedItem}
          onClick={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}

// Single getCountdownTime definition used throughout
const getCountdownTime = (scheduledDate) => {
  const now = new Date();
  const targetDate = new Date(scheduledDate);
  targetDate.setHours(targetDate.getHours() + 5);
  targetDate.setMinutes(targetDate.getMinutes() + 30);

  const diff = targetDate - now;
  if (diff <= 0) {
    return "Event Started";
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};

function FixtureHeader({ fixtureDetails, getCountdownTime, data }) {
  const navigate = useNavigate();

  if (!data) return null;

  // Parse toss_data
  let tossText = "";
  if (data.toss_data && data.toss_data !== "[]") {
    try {
      const parsed = JSON.parse(data.toss_data);
      tossText = parsed?.text || "";
    } catch (error) {
      console.error("Failed to parse toss_data JSON:", error);
    }
  }

  // State for toggling bubble text
  const [showLineup, setShowLineup] = useState(true);

  useEffect(() => {
    let interval;
    if (data.playing_announce === "1" && data.toss_data !== "[]") {
      interval = setInterval(() => {
        setShowLineup((prev) => !prev);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [data.playing_announce, data.toss_data]);

  // State for countdown
  const [countdown, setCountdown] = useState(
    getCountdownTime(fixtureDetails.season_scheduled_date)
  );

  // Update the countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdownTime(fixtureDetails.season_scheduled_date));
    }, 1000);
    return () => clearInterval(timer);
  }, [fixtureDetails.season_scheduled_date]);

  // Decide which text to show in the bubble
  let bubbleText = "Playing 11 is not announced";
  if (data.playing_announce === "1") {
    if (data.toss_data === "[]") {
      bubbleText = "Lineup Out";
    } else if (tossText) {
      bubbleText = showLineup ? "Lineup Out" : tossText;
    } else {
      bubbleText = "Lineup Out";
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 bg-white">
      {/* Top row: back arrow + center info */}
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
            src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${fixtureDetails.home_flag}`}
            alt={fixtureDetails.home}
            className="w-6 h-6 rounded-full"
          />
          <span className="font-semibold text-base sm:text-lg text-gray-800">
            {fixtureDetails.home} vs {fixtureDetails.away}
          </span>
          <img
            src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${fixtureDetails.away_flag}`}
            alt={fixtureDetails.away}
            className="w-6 h-6 rounded-full"
          />
        </div>
      </div>

      {/* Countdown updated every second */}
      <div className="text-center mt-1 text-red-500 font-semibold text-sm sm:text-base">
        {countdown}
      </div>

      {/* Bubble underneath - toggling text */}
      <div className="flex justify-center mt-2">
        <div
          className="
                  bg-white border border-gray-300 text-gray-600 px-3 py-1
                  rounded shadow text-sm text-center
                  transition-all duration-1000 ease-in-out
                "
        >
          {bubbleText}
        </div>
      </div>
    </div>
  );
}

function BattingOrder() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const matchInSights = location.state?.matchInSights;

  useEffect(() => {
    if (!matchInSights?.season_game_uid) {
      console.warn("season_game_uid is undefined or null");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.post(
          "https://plapi.perfectlineup.in/fantasy/stats/player_batting_order_details",
          {
            season_game_uid: matchInSights.season_game_uid,
            website_id: 1,
            sports_id: "7", // Assuming sports_id is always 7
          },
          {
            headers: {
              sessionkey: "3cd0fb996816c37121c765f292dd3f78",
              moduleaccess: "7",
              "Content-Type": "application/json",
            },
          }
        );

        console.log("API Response:", response.data.data);
        setData(response.data.data);
      } catch (error) {
        console.error("API Error:", error);
        setError(error.message || "An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [matchInSights?.season_game_uid]);

  // Handle Loading & Error States
  if (loading) {
    return <div className="text-center text-gray-600">Loading...</div>;
  }
  if (error) {
    return <div className="text-red-500 text-center">Error: {error}</div>;
  }
  if (!data) {
    return <div className="text-center text-gray-600">No data available.</div>;
  }

  return (
    <>
      {data && (
        <div className="w-full min-h-screen flex flex-col bg-white overflow-hidden items-start justify-start">
          <div className="w-full flex flex-col bg-white">
            {data && (
              <FixtureHeader
                fixtureDetails={matchInSights}
                getCountdownTime={getCountdownTime}
                data={data.season_data}
              />
            )}
          </div>

          <div className="flex flex-col items-center w-full max-w-screen-lg mx-auto p-4 -mt-2">
            {/* Header Section */}
            <div className="view-win-container w-full">
              <div className="flex items-center w-full">
                <span className="text-xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                  Historical batting order
                </span>

                <div class="relative inline-block group">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-6 h-6 text-gray-600 cursor-pointer"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                    />
                  </svg>

                  <div
                    class="
                              absolute
                              hidden
                              group-hover:block
                              bottom-full
                              left-1/2
                              mb-2
                              transform
                              -translate-x-1/2
                              px-3
                              py-2
                              bg-black
                              text-white
                              text-base
                              rounded
                              shadow-lg
                              whitespace-nowrap
                            "
                  >
                    Last 5 T20 batting order & FPts
                  </div>
                </div>

                <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
              </div>
            </div>

            <PlayersTable
              allPlayers={data.expected_batting_order}
              matchInSights={matchInSights}
            />
          </div>

          <div className="flex flex-col items-center w-full max-w-screen-lg mx-auto p-4 -mt-2">
            {/* Header Section */}
            <div className="view-win-container w-full">
              <div className="flex items-center w-full">
                <span className="text-xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                  Power plays (batters)
                </span>

                <div class="relative inline-block group">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-6 h-6 text-gray-600 cursor-pointer"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                    />
                  </svg>

                  <div
                    class="
                              absolute
                              hidden
                              group-hover:block
                              bottom-full
                              left-1/2
                              mb-2
                              transform
                              -translate-x-1/2
                              px-3
                              py-2
                              bg-black
                              text-white
                              text-base
                              rounded
                              shadow-lg
                              whitespace-nowrap
                            "
                  >
                    Fielding restricitions during powerplay overs (first 6
                    overs) encourage batsmans to take more risk and hit more
                    boundaries
                  </div>
                </div>

                <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
              </div>
            </div>

            <PowerPlayBat
              playersData={data.power_play_batting}
              matchInSights={matchInSights}
            />
          </div>

          <div className="flex flex-col items-center w-full max-w-screen-lg mx-auto p-4 -mt-2">
            {/* Header Section */}
            <div className="view-win-container w-full">
              <div className="flex items-center w-full">
                <span className="text-xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                  Power plays (bowlers)
                </span>

                <div class="relative inline-block group">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-6 h-6 text-gray-600 cursor-pointer"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                    />
                  </svg>

                  <div
                    class="
                              absolute
                              hidden
                              group-hover:block
                              bottom-full
                              left-1/2
                              mb-2
                              transform
                              -translate-x-1/2
                              px-3
                              py-2
                              bg-black
                              text-white
                              text-base
                              rounded
                              shadow-lg
                              whitespace-nowrap
                            "
                  >
                    Powerplay overs (first 6 overs) are good time for bowlers to
                    take advantage of any assistance in the pitch to take early
                    wickets and boost fantasy points
                  </div>
                </div>

                <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
              </div>
            </div>

            <PowerPlayBow
              playersData={data.power_play_bowling}
              matchInSights={matchInSights}
            />
          </div>

          <div className="flex flex-col items-center w-full max-w-screen-lg mx-auto p-4 -mt-2">
            {/* Header Section */}
            <div className="view-win-container w-full">
              <div className="flex items-center w-full">
                <span className="text-xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                  Death overs (Bowlers)
                </span>

                <div class="relative inline-block group">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-6 h-6 text-gray-600 cursor-pointer"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                    />
                  </svg>

                  <div
                    class="
                              absolute
                              hidden
                              group-hover:block
                              bottom-full
                              left-1/2
                              mb-2
                              transform
                              -translate-x-1/2
                              px-3
                              py-2
                              bg-black
                              text-white
                              text-base
                              rounded
                              shadow-lg
                              whitespace-nowrap
                            "
                  >
                    Player's performance in death overs
                  </div>
                </div>

                <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
              </div>
            </div>

            <DeathOverBow
              playersData={data.death_over_bowling}
              matchInSights={matchInSights}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default BattingOrder;
