import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios";

function PlayerList({ playersData, fixture_info, matchInSights }) {
  // Our three tabs: OVERALL, HOME, AWAY
  const TABS = [
    { label: "OVERALL", value: "OVERALL" },
    { label: fixture_info.home, value: fixture_info.home },
    { label: fixture_info.away, value: fixture_info.away },
  ];

  // State for active tab and sorting order
  const [activeTab, setActiveTab] = useState("OVERALL");
  const [sortOrder, setSortOrder] = useState("desc");

  // Filter and sort players based on the active tab
  let displayedPlayers =
    activeTab === "OVERALL"
      ? playersData
      : playersData.filter((p) => p.team_abbr === activeTab);

  // Sorting logic
  displayedPlayers = [...displayedPlayers].sort((a, b) => {
    return sortOrder === "asc"
      ? a.power_rate - b.power_rate
      : b.power_rate - a.power_rate;
  });

  // Function to toggle sorting order
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <div className="top-player-container bg-white p-4 shadow-md rounded-md w-full max-w-4xl mx-auto">
      <div className="rating-main-container mt-10">
        <div className="performance-message text-gray-700 font-semibold mb-4">
          Tap on any player to view detailed player card
        </div>

        {/* Tabs */}
        <div className="tab-container flex items-center justify-center space-x-6 mb-4">
          {TABS.map((tab) => (
            <div
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`tab-item cursor-pointer pb-2 ${
                activeTab === tab.value
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500"
              }`}
            >
              {tab.label}
            </div>
          ))}
        </div>

        {/* List Header */}
        <div className="list-header hidden md:grid md:grid-cols-4 border-b border-gray-200 pb-2 font-semibold text-gray-600">
          <div className="rank-item">Rank</div>
          <div className="player-item">Player</div>
          <div
            className="graph-item flex items-center cursor-pointer"
            onClick={toggleSortOrder}
          >
            Rating <i className="ml-1 icon-arrow-down"></i>
          </div>
          <div className="action-item text-right mr-6">Action</div>
        </div>

        {/* Player Listing */}
        <div className="player-listing space-y-4 mt-4">
          {displayedPlayers.map((player) => (
            <Link
              key={player.player_uid}
              to={`/player/${player?.player_uid || "unknown"}/${
                player?.display_name
                  ? player.display_name.replace(/\s+/g, "_")
                  : player?.full_name?.replace(/\s+/g, "_") || "unknown"
              }/${matchInSights.season_game_uid || "unknown"}/form`}
              state={{
                playerInfo: player,
                matchID: matchInSights.season_game_uid,
                matchInSights: matchInSights,
              }}
            >
              <div
                key={player.player_id}
                className="player-item bg-white p-4 rounded shadow-sm flex flex-col md:grid md:grid-cols-4 items-center"
              >
                {/* Rank */}
                <div className="player-rank-box flex items-center justify-start md:justify-start w-full md:w-auto">
                  <i className="icon-power-ranking text-xl text-blue-600 mr-2" />
                  <span className="text-orange-500 ml-1">⚡</span>
                  <span className="text-gray-700 font-semibold">
                    {player.power_rank}
                  </span>
                </div>

                {/* Player Info */}
                <div className="player-info-box mt-2 md:mt-0 w-full md:w-auto">
                  <div className="name-style font-semibold text-gray-800">
                    {player.nick_name}
                  </div>
                  <div className="position-style text-sm text-gray-600 flex items-center">
                    {player.position}
                    <span className="dot w-1 h-1 bg-gray-600 rounded-full inline-block mx-2"></span>
                    {player.team_abbr}
                  </div>
                </div>

                {/* Rating Bar */}
                <div className="player-graph-box-home mt-2 md:mt-0 w-full flex flex-col">
                  <div className="relative h-8 bg-gray-300 rounded mb-1 overflow-hidden">
                    <div
                      className="absolute h-8 left-0 top-0 rounded transition-all duration-500 ease-in-out flex items-center justify-center"
                      style={{
                        width: `${player.power_rate || 0}%`,
                        backgroundColor:
                          player.team_abbr === fixture_info.home
                            ? "rgba(244, 118, 76, 0.8)" // Darker for better visibility
                            : "rgba(80, 193, 232, 0.8)",
                        color: "white", // Ensure text contrast
                      }}
                    >
                      {player.power_rate}
                    </div>
                  </div>
                </div>

                {/* Lock/Unlock Icon */}
                <div className="player-lock-box mt-2 md:mt-0 w-full md:w-auto flex justify-end">
                  <div className="lock-unlock-item">
                    <img
                      alt="Unlock icon"
                      className="w-6 h-6"
                      src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_prefer_inactive.svg"
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlayerPerformance() {
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
          "https://plapi.perfectlineup.in/fantasy/stats/player_power_ranking",
          {
            season_game_uid: matchInSights.season_game_uid,
            league_id: matchInSights.league_id,
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

        console.log("API Response:", response.data);
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

  // Render error/loading states if needed
  if (loading) {
    return <div className="text-center text-gray-600">Loading...</div>;
  }
  if (error) {
    return <div className="text-red-500 text-center">Error: {error}</div>;
  }
  if (!matchInSights) {
    return null;
  }

  // Countdown function that gets recalculated on each re-render
  const getCountdownTime = (scheduledDate) => {
    const now = new Date();
    // Convert scheduledDate from UTC to IST (UTC +5:30)
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

  return (
    <div className="w-full min-h-screen flex flex-col bg-white overflow-hidden items-start justify-start">
      {/* Navigation Bar */}
      <div className="flex items-center p-4 border-b w-full max-w-screen-lg mx-auto justify-between sm:justify-center mt-4">
        {/* Back Button */}
        <Link
          key={matchInSights.season_game_uid}
          to={`/fixture-info/Cricket/${matchInSights.season_game_uid}/${matchInSights.home}_vs_${matchInSights.away}/${matchInSights.league_id}`}
          state={{ fixtureDetails: matchInSights }}
          className="p-2 rounded-lg shadow-md bg-white hover:bg-gray-100 flex items-center"
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
        </Link>

        {/* Match Details */}
        <div className="flex items-center flex-grow justify-between w-full px-2 sm:px-6">
          {/* Home Team */}
          <div className="flex items-center space-x-2">
            <img
              src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${matchInSights.home_flag}`}
              alt={`${matchInSights.home} flag`}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
            />
            <span className="font-semibold text-sm sm:text-lg">
              {matchInSights.home}
            </span>
          </div>

          {/* Match Status */}
          <div className="text-center">
            <div className="text-red-500 font-bold text-sm sm:text-lg">
              {getCountdownTime(matchInSights.season_scheduled_date)}
            </div>
            <div className="text-gray-600 text-xs sm:text-sm mt-1">
              {(() => {
                const utcDate = new Date(matchInSights.season_scheduled_date);
                const istDate = new Date(
                  utcDate.getTime() + 5.5 * 60 * 60 * 1000
                );
                return istDate.toLocaleString("en-IN");
              })()}
            </div>
            <div className="text-gray-500 text-xs sm:text-sm">
              {matchInSights.league_name} -{" "}
              {matchInSights.format === "1"
                ? "Test"
                : matchInSights.format === "2"
                ? "ODI"
                : matchInSights.format === "3"
                ? "T20"
                : matchInSights.format === "4"
                ? "T10"
                : matchInSights.format}
            </div>
          </div>

          {/* Away Team */}
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sm sm:text-lg">
              {matchInSights.away}
            </span>
            <img
              src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${matchInSights.away_flag}`}
              alt={`${matchInSights.away} flag`}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Playing 11 Status - Centered Below Match Details */}
      <div
        className={`w-full flex justify-center -mt-4 px-3 py-1 text-sm rounded-md 
          ${
            Number(matchInSights.playing_announce) === 1
              ? "text-green-700 bg-green-100"
              : "text-gray-700 bg-gray-100"
          }`}
      >
        {Number(matchInSights.playing_announce) === 1
          ? "Playing 11 is announced"
          : "Playing 11 is not announced"}
      </div>

      {data && data.player_list && (
        <PlayerList
          playersData={data.player_list}
          fixture_info={data.season_info}
          matchInSights={matchInSights}
        />
      )}
    </div>
  );
}

export default PlayerPerformance;
