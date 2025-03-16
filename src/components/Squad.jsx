import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios";
import { AiOutlineStar } from "react-icons/ai";
import Getlocation from './Getlocation.jsx';

/**
 * Sample component for displaying players from two teams (BAN-L and GAT)
 * with filter dropdowns for position, batting style, and bowling style.
 */
function PlayersListing({ teamsData, fixture_info }) {
  // State for filters
  const [positionFilter, setPositionFilter] = useState("All");
  const [battingFilter, setBattingFilter] = useState("All");
  const [bowlingFilter, setBowlingFilter] = useState("All");

  // Safely retrieve arrays for each team from the teamsData prop
  const banPlayers = teamsData["BAN-L"] || [];
  const gatPlayers = teamsData["GAT"] || [];

  /**
   * Filter a given list of players based on the user's dropdown selections.
   */
  const filterPlayers = (players) => {
    return players.filter((player) => {
      // 1) Position filter
      if (positionFilter !== "All" && player.position !== positionFilter) {
        return false;
      }

      // 2) Batting style filter
      // Note: Some players have empty batting_style, so we check for that as well.
      if (battingFilter !== "All" && player.batting_style !== battingFilter) {
        return false;
      }

      // 3) Bowling style filter
      if (bowlingFilter !== "All" && player.bowling_style !== bowlingFilter) {
        return false;
      }

      return true;
    });
  };

  // Filtered arrays
  const filteredBanPlayers = filterPlayers(banPlayers);
  const filteredGatPlayers = filterPlayers(gatPlayers);

  return (
    <div className="w-full max-w-4xl mx-auto bg-gray-100 shadow-lg rounded-lg p-4 my-4 items-center justify-center">
      {/* Title */}
      <h2 className="text-xl font-bold mb-4 text-center">
      Players Featuring in this Match
    </h2>
    
    {/* Dropdown Filters */}
    <div className="flex flex-wrap gap-4 mb-6 justify-center">
      {/* Position Filter */}
      <div>
        <label className="block font-semibold mb-1">Position</label>
        <select
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value)}
          className="border border-gray-300 rounded p-1"
        >
          <option value="All">All</option>
          <option value="BAT">BAT</option>
          <option value="BOW">BOW</option>
          <option value="AR">AR</option>
          <option value="WK">WK</option>
        </select>
      </div>
    
      {/* Batting Style Filter */}
      <div>
        <label className="block font-semibold mb-1">Batting Style</label>
        <select
          value={battingFilter}
          onChange={(e) => setBattingFilter(e.target.value)}
          className="border border-gray-300 rounded p-1"
        >
          <option value="All">All</option>
          <option value="Right Hand Bat">Right Hand Bat</option>
          <option value="Left Hand Bat">Left Hand Bat</option>
        </select>
      </div>
    
      {/* Bowling Style Filter */}
      <div>
        <label className="block font-semibold mb-1">Bowling Style</label>
        <select
          value={bowlingFilter}
          onChange={(e) => setBowlingFilter(e.target.value)}
          className="border border-gray-300 rounded p-1"
        >
          <option value="All">All</option>
          <option value="Right Arm Medium">Right Arm Medium</option>
          <option value="Left Arm Medium">Left Arm Medium</option>
        </select>
      </div>
    </div>
    

      {/* Two-Column Layout */}
      <div className="grid grid-cols-2 gap-12 bg-white p-4 rounded-lg w-full  mx-auto">
        {/* Left Column: BAN-L */}
        <div className="flex flex-col items-center text-gray-900">
        <div className="flex items-center mb-2">
        {/* Example: Team Flag or Icon */}
        <img
          src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${fixture_info.home_flag}`}
          alt={`${fixture_info.home} flag`}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
        />
        <span className="ml-2 font-semibold text-sm sm:text-lg">
          {fixture_info.home}
        </span>
      </div>
          <ul className="w-full space-y-2">
            {filteredBanPlayers.map((player) => (
              <Link
                key={player.player_uid}
                to={`/player/${player.player_uid}/${player.full_name.replace(
                  /\s+/g,
                  "_"
                )}/${fixture_info.season_game_uid}/form`}
                state={{
                  playerInfo: player,
                  matchID: fixture_info.season_game_uid,
                  matchInSights: fixture_info,
                }}
                className="flex justify-between items-center p-3 rounded-lg shadow-md bg-white hover:bg-gray-100 w-full"
              >
                <li
                  key={player.player_id}
                  className="w-full flex flex-row w-full items-center justify-between"
                >
                  <span className="text-sm font-semibold">
                    {player.nick_name || player.full_name} ({player.position})
                  </span>
                  <AiOutlineStar className="text-gray-400 justify-end" />
                </li>
              </Link>
            ))}
          </ul>
        </div>

        {/* Right Column: GAT */}
        <div className="flex flex-col items-center text-gray-900">
          <div className="flex items-center mb-2">
            {/* Example: Team Flag or Icon */}
            <img
              src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${fixture_info.away_flag}`}
              alt={`${fixture_info.away} flag`}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
            />
            <span className="ml-2 font-semibold text-sm sm:text-lg">
              {fixture_info.away}
            </span>
          </div>

          <ul className="w-full space-y-2">
          {filteredGatPlayers.map((player) => (
            <Link
              key={player.player_uid}
              to={`/player/${player.player_uid}/${player.full_name.replace(
                /\s+/g,
                "_"
              )}/${fixture_info.season_game_uid}/form`}
              state={{
                playerInfo: player,
                matchID: fixture_info.season_game_uid,
                matchInSights: fixture_info,
              }}
              className="flex justify-between items-center p-3 rounded-lg shadow-md bg-white hover:bg-gray-100 w-full"
            >
              <li
                key={player.player_id}
                className="w-full flex flex-row w-full items-center justify-between"
              >
                <span className="text-sm font-semibold">
                  {player.nick_name || player.full_name} ({player.position})
                </span>
                <AiOutlineStar className="text-gray-400 justify-end" />
              </li>
            </Link>
          ))}
        </ul>
        </div>
      </div>
    </div>
  );
}

function Squad() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const matchInSights = location.state?.matchInSights;
  console.log(Getlocation())

  useEffect(() => {
    if (!matchInSights?.season_game_uid) {
      console.warn("season_game_uid is undefined or null");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.post(
          "https://plapi.perfectlineup.in/fantasy/stats/get_fixture_players",
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

      {data && data.players && (
        <PlayersListing
          teamsData={data.players.reduce((group, player) => {
            const team = player.team_abbr;
            if (!group[team]) {
              group[team] = [];
            }
            group[team].push(player);
            return group;
          }, {})}
          fixture_info={data.fixture_info}
        />
      )}
    </div>
  );
}

export default Squad;
