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
      data =  data.fixture_detail
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
  
    console.log(bubbleText);
  
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


 // Helper function to render stat cells with matches
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
  
  // Helper to display "graph" cells (value + total_matches)
  const renderGraphCell = (graphData) => {
    if (graphData?.value !== undefined && graphData?.total_matches !== undefined) {
      return renderTwoLineCell(graphData.value, graphData.total_matches);
    }
    return renderTwoLineCell("-", null);
  };
  
  // Helper to display "stats" cells (value + matches)
  const renderStatsCell = (value, matches) => {
    if (value !== undefined && matches !== undefined) {
      return renderTwoLineCell(value, matches);
    }
    return renderTwoLineCell("-", null);
  };
  
  const DynamicTable = ({ sampleData, matchInSights }) => {
    // Global filter: "Overall" shows all, "PAK" for Team 1 and "NZ" for Team 2.
    const [filter, setFilter] = useState("Overall");
  
    // Sorting state: key is the property to sort by, direction is "asc" or "desc"
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  
    // Filter data by team_abbr
    const filteredData = useMemo(() => {
      return sampleData.filter((item) => {
        if (filter === "Overall") return true;
        return item.team_abbr === filter;
      });
    }, [filter, sampleData]);
  
    // Sorting logic
    const sortedData = useMemo(() => {
      const sortableData = [...filteredData];
      if (sortConfig.key) {
        sortableData.sort((a, b) => {
          let aValue, bValue;
          switch (sortConfig.key) {
            case "playerName":
              aValue = a.full_name.toLowerCase();
              bValue = b.full_name.toLowerCase();
              break;
            case "averageFpts":
              aValue = parseFloat(a.stats?.avg_fantasy_points) || 0;
              bValue = parseFloat(b.stats?.avg_fantasy_points) || 0;
              break;
            case "fptsOpposition":
              aValue = parseFloat(a.stats?.avg_opp_fpts) || 0;
              bValue = parseFloat(b.stats?.avg_opp_fpts) || 0;
              break;
            case "fptsVenue":
              aValue = parseFloat(a.stats?.avg_venue_fpts) || 0;
              bValue = parseFloat(b.stats?.avg_venue_fpts) || 0;
              break;
            case "batFirstFpts":
              aValue = parseFloat(a.graph?.bat_first_fpts?.value) || 0;
              bValue = parseFloat(b.graph?.bat_first_fpts?.value) || 0;
              break;
            case "fptsInChase":
              aValue = parseFloat(a.graph?.bowl_first_fpts?.value) || 0;
              bValue = parseFloat(b.graph?.bowl_first_fpts?.value) || 0;
              break;
            case "inDreamTeam":
              aValue = parseFloat(a.graph?.dream_team?.value) || 0;
              bValue = parseFloat(b.graph?.dream_team?.value) || 0;
              break;
            case "bottom20":
              aValue = parseFloat(a.graph?.underperformed?.value) || 0;
              bValue = parseFloat(b.graph?.underperformed?.value) || 0;
              break;
            case "avgPositionRank":
              aValue = parseFloat(a.graph?.avg_position_rank?.value) || 0;
              bValue = parseFloat(b.graph?.avg_position_rank?.value) || 0;
              break;
            case "avgTeamRank":
              aValue = parseFloat(a.graph?.avg_team_rank?.value) || 0;
              bValue = parseFloat(b.graph?.avg_team_rank?.value) || 0;
              break;
            default:
              aValue = 0;
              bValue = 0;
          }
          if (aValue < bValue) {
            return sortConfig.direction === "asc" ? -1 : 1;
          }
          if (aValue > bValue) {
            return sortConfig.direction === "asc" ? 1 : -1;
          }
          return 0;
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
        {/* Global Filter */}
        <div className="mb-4 flex items-center">
          <label className="mr-2 font-semibold">Filter:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded p-1"
          >
            <option value="Overall">Overall</option>
            <option value={matchInSights.home}>{matchInSights.home}</option>
            <option value={matchInSights.away}>{matchInSights.away}</option>
          </select>
        </div>
  
        {/* Table Container */}
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
                  onClick={() => requestSort("averageFpts")}
                  className="px-3 py-2 text-center cursor-pointer font-semibold"
                >
                  Average Fpts {sortArrow("averageFpts")}
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
                  onClick={() => requestSort("batFirstFpts")}
                  className="px-3 py-2 text-center cursor-pointer font-semibold"
                >
                  Avg. Fpts Bat First {sortArrow("batFirstFpts")}
                </th>
                <th
                  onClick={() => requestSort("fptsInChase")}
                  className="px-3 py-2 text-center cursor-pointer font-semibold"
                >
                  Avg. Fpts in Chase {sortArrow("fptsInChase")}
                </th>
                <th
                  onClick={() => requestSort("inDreamTeam")}
                  className="px-3 py-2 text-center cursor-pointer font-semibold"
                >
                  In Dream Team {sortArrow("inDreamTeam")}
                </th>
                <th
                  onClick={() => requestSort("bottom20")}
                  className="px-3 py-2 text-center cursor-pointer font-semibold"
                >
                  Bottom 20% {sortArrow("bottom20")}
                </th>
                <th
                  onClick={() => requestSort("avgPositionRank")}
                  className="px-3 py-2 text-center cursor-pointer font-semibold"
                >
                  Avg. Position Rank {sortArrow("avgPositionRank")}
                </th>
                <th
                  onClick={() => requestSort("avgTeamRank")}
                  className="px-3 py-2 text-center cursor-pointer font-semibold"
                >
                  Avg. Team Rank {sortArrow("avgTeamRank")}
                </th>
              </tr>
            </thead>
  
            <tbody className="divide-y divide-gray-100">
              {sortedData.map((player) => (
                <tr key={player.player_id} className="hover:bg-gray-50">
                  {/* Player Name & Info */}
                  <td className="px-3 py-2 text-center">
                    <div className="flex flex-col items-center">
                      <div className="text-sm font-semibold text-gray-900">
                        {player.full_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {player.position} . {player.team_abbr}{" "}
                        {/* If you have style/bowling info: e.g. "Left Arm Orthodox" */}
                        {player.bowling_style
                          ? ` . ${player.bowling_style}`
                          : ""}
                      </div>
                    </div>
                  </td>
  
                  {/* Average Fpts */}
                  <td className="px-3 py-2 text-center">
                    {renderStatsCell(
                      player.stats?.avg_fantasy_points,
                      player.stats?.tm
                    )}
                  </td>
  
                  {/* Average Fpts vs Opposition */}
                  <td className="px-3 py-2 text-center">
                    {renderStatsCell(
                      player.stats?.avg_opp_fpts,
                      player.stats?.opp_tm
                    )}
                  </td>
  
                  {/* Average Fpts at Venue */}
                  <td className="px-3 py-2 text-center">
                    {renderStatsCell(
                      player.stats?.avg_venue_fpts,
                      player.stats?.venue_tm
                    )}
                  </td>
  
                  {/* Avg. Fpts Bat First */}
                  <td className="px-3 py-2 text-center">
                    {renderGraphCell(player.graph?.bat_first_fpts)}
                  </td>
  
                  {/* Avg. Fpts in Chase */}
                  <td className="px-3 py-2 text-center">
                    {renderGraphCell(player.graph?.bowl_first_fpts)}
                  </td>
  
                  {/* In Dream Team */}
                  <td className="px-3 py-2 text-center">
                    {renderGraphCell(player.graph?.dream_team)}
                  </td>
  
                  {/* Bottom 20% */}
                  <td className="px-3 py-2 text-center">
                    {renderGraphCell(player.graph?.underperformed)}
                  </td>
  
                  {/* Avg. Position Rank */}
                  <td className="px-3 py-2 text-center">
                    {renderGraphCell(player.graph?.avg_position_rank)}
                  </td>
  
                  {/* Avg. Team Rank */}
                  <td className="px-3 py-2 text-center">
                    {renderGraphCell(player.graph?.avg_team_rank)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  


  function PlayerPerformancelist() {
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
            league_id: "4083",
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
            "https://plapi.perfectlineup.in/fantasy/stats/player_performance_list",
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
  
    // Render the UI
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
            <DynamicTable sampleData={data.player_list} matchInSights={matchInSights}/>
          )}

          {activeTab === `Last 10 MATCH` && data && <DynamicTable sampleData={data.player_list} matchInSights={matchInSights}/>}

          {activeTab === `THIS SERIES` && data && (
            <DynamicTable sampleData={data.player_list} matchInSights={matchInSights}/>
          )}
        </div>
      )}
    </>
    );
  }
  

export default PlayerPerformancelist
