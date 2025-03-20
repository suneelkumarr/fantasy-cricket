import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import axios from "axios";

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
  data = data.fixture_detail;
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

  const [countdown, setCountdown] = useState(
    getCountdownTime(fixtureDetails.season_scheduled_date)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdownTime(fixtureDetails.season_scheduled_date));
    }, 1000);
    return () => clearInterval(timer);
  }, [fixtureDetails.season_scheduled_date]);

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

      <div className="text-center mt-1 text-red-500 font-semibold text-sm sm:text-base">
        {countdown}
      </div>

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

// Helper to display value + matches in two lines
const renderTwoLineCell = (value, matches) => {
  return (
    <div className="flex flex-col items-center">
      <div className="text-base font-semibold text-gray-800">
        {value !== undefined && value !== null ? value : "-"}
      </div>
      <div className="text-xs text-gray-500">
        {matches !== undefined && matches !== null ? `${matches} Matches` : "-"}
      </div>
    </div>
  );
};

// Helper to display "stats" cells (value + matches) in two lines
const renderStatsCell = (value, matches) => {
  if (value !== undefined && matches !== undefined) {
    return renderTwoLineCell(value, matches);
  }
  return renderTwoLineCell("-", null);
};

const AdvancedDynamicTable = ({ sampleData, matchInSights }) => {
  // 1) Team filter
  const [teamFilter, setTeamFilter] = useState("Overall");
  // 2) Bowling style filter
  const [bowlingFilter, setBowlingFilter] = useState("All");
  // 3) Position filter
  const [positionFilter, setPositionFilter] = useState("All");

  // Sorting state: key is the property to sort by, direction is "asc" or "desc"
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Filtering logic
  const filteredData = useMemo(() => {
    return sampleData.filter((player) => {
      // Team filter
      let passTeam = true;
      if (teamFilter !== "Overall") {
        passTeam = player.team_abbr === teamFilter;
      }
      // Bowling style filter
      let passBowling = true;
      if (bowlingFilter !== "All") {
        passBowling = player.bowling_style === bowlingFilter;
      }
      // Position filter
      let passPosition = true;
      if (positionFilter !== "All") {
        passPosition = player.position === positionFilter;
      }
      return passTeam && passBowling && passPosition;
    });
  }, [sampleData, teamFilter, bowlingFilter, positionFilter]);

  // Sorting logic
  const sortedData = useMemo(() => {
    const sortableData = [...filteredData];
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        let aValue = 0;
        let bValue = 0;

        switch (sortConfig.key) {
          case "playerName":
            aValue = a.full_name.toLowerCase();
            bValue = b.full_name.toLowerCase();
            break;
          case "bowlingStyle":
            aValue = a.bowling_style || "";
            bValue = b.bowling_style || "";
            break;
          case "averageFpts":
            aValue = parseFloat(a.stats?.avg_fantasy_points) || 0;
            bValue = parseFloat(b.stats?.avg_fantasy_points) || 0;
            break;
          case "averageBow1Fpts":
            aValue = parseFloat(a.stats?.avg_bow1_fpts) || 0;
            bValue = parseFloat(b.stats?.avg_bow1_fpts) || 0;
            break;
          case "averageBow2Fpts":
            aValue = parseFloat(a.stats?.avg_bow2_fpts) || 0;
            bValue = parseFloat(b.stats?.avg_bow2_fpts) || 0;
            break;
          case "fptsOpposition":
            aValue = parseFloat(a.stats?.avg_opp_fpts) || 0;
            bValue = parseFloat(b.stats?.avg_opp_fpts) || 0;
            break;
          case "fptsVenue":
            aValue = parseFloat(a.stats?.avg_venue_fpts) || 0;
            bValue = parseFloat(b.stats?.avg_venue_fpts) || 0;
            break;
          case "wickets":
            aValue = parseFloat(a.stats?.wickets) || 0;
            bValue = parseFloat(b.stats?.wickets) || 0;
            break;
          case "pWickets":
            aValue = parseFloat(a.stats?.p_wickets) || 0;
            bValue = parseFloat(b.stats?.p_wickets) || 0;
            break;
          case "dWickets":
            aValue = parseFloat(a.stats?.d_wickets) || 0;
            bValue = parseFloat(b.stats?.d_wickets) || 0;
            break;
          case "overs":
            aValue = parseFloat(a.stats?.overs) || 0;
            bValue = parseFloat(b.stats?.overs) || 0;
            break;
          case "pOvers":
            aValue = parseFloat(a.stats?.p_overs) || 0;
            bValue = parseFloat(b.stats?.p_overs) || 0;
            break;
          case "dOvers":
            aValue = parseFloat(a.stats?.d_overs) || 0;
            bValue = parseFloat(b.stats?.d_overs) || 0;
            break;
          default:
            aValue = 0;
            bValue = 0;
        }

        // Compare as either string or number
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        } else {
          if (aValue < bValue) {
            return sortConfig.direction === "asc" ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === "asc" ? 1 : -1;
          }
          return 0;
        }
      });
    }
    return sortableData;
  }, [filteredData, sortConfig]);

  // Toggle sorting for a given column key
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Renders the sort arrow if this column is the current sort key
  const sortArrow = (columnKey) => {
    if (sortConfig.key === columnKey) {
      return sortConfig.direction === "asc" ? "▲" : "▼";
    }
    return null;
  };

  return (
    <div className="p-4">
      {/* FILTERS */}
      <div className="mb-4 flex flex-wrap items-center space-x-4">
        {/* Team Filter */}
        <div>
          <label className="mr-2 font-semibold">Team:</label>
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="border rounded p-1"
          >
            <option value="Overall">Overall</option>
            <option value={matchInSights.home}>{matchInSights.home}</option>
            <option value={matchInSights.away}>{matchInSights.away}</option>
          </select>
        </div>

        {/* Bowling Style Filter */}
        <div>
          <label className="mr-2 font-semibold">Bowling Style:</label>
          <select
            value={bowlingFilter}
            onChange={(e) => setBowlingFilter(e.target.value)}
            className="border rounded p-1"
          >
            <option value="All">All</option>
            <option value="Right Arm Leg Spin">Right Arm Leg Spin</option>
            <option value="Right Arm Medium">Right Arm Medium</option>
            <option value="Left Arm Fast">Left Arm Fast</option>
            <option value="Right Arm Fast">Right Arm Fast</option>
            <option value="Right Arm Off Spin">Right Arm Off Spin</option>
            <option value="Left Arm Orthodox">Left Arm Orthodox</option>
          </select>
        </div>

        {/* Position Filter */}
        <div>
          <label className="mr-2 font-semibold">Position:</label>
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="border rounded p-1"
          >
            <option value="All">All</option>
            <option value="AR">AR</option>
            <option value="BOW">BOW</option>
            <option value="BAT">BAT</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 uppercase text-xs">
              <th
                onClick={() => requestSort("playerName")}
                className="px-3 py-2 text-center cursor-pointer font-semibold"
              >
                Player Name {sortArrow("playerName")}
              </th>
              <th
                onClick={() => requestSort("bowlingStyle")}
                className="px-3 py-2 text-center cursor-pointer font-semibold"
              >
                Bowling Style {sortArrow("bowlingStyle")}
              </th>
              <th
                onClick={() => requestSort("averageFpts")}
                className="px-3 py-2 text-center cursor-pointer font-semibold"
              >
                Average Fpts {sortArrow("averageFpts")}
              </th>
              <th
                onClick={() => requestSort("averageBow1Fpts")}
                className="px-3 py-2 text-center cursor-pointer font-semibold"
              >
                Average Fpts Bowling 1st {sortArrow("averageBow1Fpts")}
              </th>
              <th
                onClick={() => requestSort("averageBow2Fpts")}
                className="px-3 py-2 text-center cursor-pointer font-semibold"
              >
                Average Fpts Bowling 2nd {sortArrow("averageBow2Fpts")}
              </th>
              <th
                onClick={() => requestSort("fptsOpposition")}
                className="px-3 py-2 text-center cursor-pointer font-semibold"
              >
                Average Fpts vs Opposition {sortArrow("fptsOpposition")}
              </th>
              <th
                onClick={() => requestSort("fptsVenue")}
                className="px-3 py-2 text-center cursor-pointer font-semibold"
              >
                Average Fpts at Venue {sortArrow("fptsVenue")}
              </th>
              <th
                onClick={() => requestSort("wickets")}
                className="px-3 py-2 text-center cursor-pointer font-semibold"
              >
                Wickets Taken {sortArrow("wickets")}
              </th>
              <th
                onClick={() => requestSort("pWickets")}
                className="px-3 py-2 text-center cursor-pointer font-semibold"
              >
                Powerplay Wickets Taken {sortArrow("pWickets")}
              </th>
              <th
                onClick={() => requestSort("dWickets")}
                className="px-3 py-2 text-center cursor-pointer font-semibold"
              >
                Death Overs Wickets Taken {sortArrow("dWickets")}
              </th>
              <th
                onClick={() => requestSort("overs")}
                className="px-3 py-2 text-center cursor-pointer font-semibold"
              >
                Overs Bowled {sortArrow("overs")}
              </th>
              <th
                onClick={() => requestSort("pOvers")}
                className="px-3 py-2 text-center cursor-pointer font-semibold"
              >
                Powerplay Overs Bowled {sortArrow("pOvers")}
              </th>
              <th
                onClick={() => requestSort("dOvers")}
                className="px-3 py-2 text-center cursor-pointer font-semibold"
              >
                Death Overs Bowled {sortArrow("dOvers")}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {sortedData.map((player) => (
              <tr key={player.player_id} className="hover:bg-gray-50">
                {/* 1) Player Name */}
                <td className="px-3 py-2 text-center">
                  <div className="flex flex-col items-center">
                    <div className="text-sm font-semibold text-gray-900">
                      {player.full_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {player.position} . {player.team_abbr}
                    </div>
                  </div>
                </td>

                {/* 2) Bowling Style */}
                <td className="px-3 py-2 text-center">
                  {player.bowling_style || "-"}
                </td>

                {/* 3) Average Fpts */}
                <td className="px-3 py-2 text-center">
                  {renderStatsCell(
                    player.stats?.avg_fantasy_points,
                    player.stats?.tm
                  )}
                </td>

                {/* 4) Average Fpts Bowling 1st */}
                <td className="px-3 py-2 text-center">
                  {renderStatsCell(
                    player.stats?.avg_bow1_fpts,
                    player.stats?.bow1_tm
                  )}
                </td>

                {/* 5) Average Fpts Bowling 2nd */}
                <td className="px-3 py-2 text-center">
                  {renderStatsCell(
                    player.stats?.avg_bow2_fpts,
                    player.stats?.bow2_tm
                  )}
                </td>

                {/* 6) Average Fpts vs Opposition */}
                <td className="px-3 py-2 text-center">
                  {renderStatsCell(
                    player.stats?.avg_opp_fpts,
                    player.stats?.opp_tm
                  )}
                </td>

                {/* 7) Average Fpts at Venue */}
                <td className="px-3 py-2 text-center">
                  {renderStatsCell(
                    player.stats?.avg_venue_fpts,
                    player.stats?.venue_tm
                  )}
                </td>

                {/* 8) Wickets Taken */}
                <td className="px-3 py-2 text-center">
                  {player.stats?.wickets ?? "-"}
                </td>

                {/* 9) Powerplay Wickets Taken */}
                <td className="px-3 py-2 text-center">
                  {player.stats?.p_wickets ?? "-"}
                </td>

                {/* 10) Death Overs Wickets Taken */}
                <td className="px-3 py-2 text-center">
                  {player.stats?.d_wickets ?? "-"}
                </td>

                {/* 11) Overs Bowled */}
                <td className="px-3 py-2 text-center">
                  {player.stats?.overs ?? "-"}
                </td>

                {/* 12) Powerplay Overs Bowled */}
                <td className="px-3 py-2 text-center">
                  {player.stats?.p_overs ?? "-"}
                </td>

                {/* 13) Death Overs Bowled */}
                <td className="px-3 py-2 text-center">
                  {player.stats?.d_overs ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function BowlerCornar() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const matchInSights = location.state?.matchInSights;

  // The tabs
  const tabs = ["LAST MATCH", "Last 10 MATCH", "THIS SERIES"];
  const [activeTab, setActiveTab] = useState(tabs[1]); // default to first tab

  useEffect(() => {
    if (!matchInSights?.season_game_uid) {
      console.warn("season_game_uid is undefined or null");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Base payload (shared fields)
        const payload = {
          season_game_uid: matchInSights.season_game_uid,
          sports_id: "7",
          league_id: matchInSights.league_id,
        };

        // Set 'type' based on activeTab
        if (activeTab === "LAST MATCH") {
          payload.type = "recent";
        } else if (activeTab === "Last 10 MATCH") {
          payload.type = "same_format";
        } else if (activeTab === "THIS SERIES") {
          payload.type = "this_series";
        }

        const response = await axios.post(
          "https://plapi.perfectlineup.in/fantasy/stats/player_bowling_corner",
          payload,
          {
            headers: {
              sessionkey: "3cd0fb996816c37121c765f292dd3f78",
              moduleaccess: "7",
              "Content-Type": "application/json",
            },
          }
        );

        console.log("API Response:", response.data);
        setData(response.data.data);
      } catch (err) {
        console.error("API Error:", err);
        setError(err.message || "An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [matchInSights?.season_game_uid, activeTab]);

  // Handle loading, error, or no-data states
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
                data={data}
              />
            )}
          </div>

          <div className="player-specification-list w-full max-w-4xl mx-auto">
            <div className="tab-container mb-4  mt-4">
              {/* 
    flex items-center => sets up a flex container
    bg-gray-100 p-1 => a light gray background with padding
    rounded-full => rounded "pill" shape
  */}
              <div className="flex items-center bg-gray-100 p-1 rounded-full">
                {tabs.map((tab) => (
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
          </div>

          {activeTab === `LAST MATCH` && data && (
            <AdvancedDynamicTable
              sampleData={data.player_list}
              matchInSights={matchInSights}
            />
          )}

          {activeTab === `Last 10 MATCH` && data && (
            <AdvancedDynamicTable
              sampleData={data.player_list}
              matchInSights={matchInSights}
            />
          )}

          {activeTab === `THIS SERIES` && data && (
            <AdvancedDynamicTable
              sampleData={data.player_list}
              matchInSights={matchInSights}
            />
          )}
        </div>
      )}
    </>
  );
}

export default BowlerCornar;
