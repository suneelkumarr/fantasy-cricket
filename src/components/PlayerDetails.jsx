import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios";
import { FaStar, FaLock, FaTimes } from "react-icons/fa";
import Format from "./Format";
import OppositeTeam from "./OppositeTeam";
import ThisVenue from "./ThisVenue";
import OverAllForm from "./OverAllForm";

function PlayerDetails() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const location = useLocation();

  // Pulled from location.state
  const playerInfo = location.state?.playerInfo;
  const matchID = location.state?.matchID;
  const matchInSights = location.state?.matchInSights;

  // Define the tab labels based on format
  const formatLabel = (format) => {
    switch (format) {
      case "1":
        return "Test";
      case "2":
        return "ODI";
      case "3":
        return "T20";
      case "4":
        return "T10";
      default:
        return format || "N/A";
    }
  };

  // Construct your top-level tabs
  const tabs = [
    formatLabel(matchInSights?.format),
    `VS ${matchInSights?.away_abbr ?? "???"}`,
    "THIS VENUE",
    "OVERALL FORM",
  ];

  // Active sub-nav tab
  const [activeTab, setActiveTab] = useState(tabs[0]); // default: first

  // For highlighting top nav links
  const pathname = location.pathname;
  const isActive = (routePath) => pathname.includes(routePath);

  // Fetch the data
  useEffect(() => {
    if (!matchID) {
      console.warn("season_game_uid (matchID) is undefined or null");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.post(
          "https://plapi.perfectlineup.in/fantasy/stats/get_perfectlineup_playercard",
          {
            season_game_uid: matchID,
            sports_id: null, // or 7 if you have it set
            fav_detail: 1,
            player_uid: playerInfo?.player_uid,
            power_rank_detail: 1,
            tab_info: "form",
            website_id: 1,
            year: null,
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

        // If the API structure is:
        // { data: {...someObject} }
        // then store it in state as an object:
        setData(response.data.data);
      } catch (err) {
        console.error("API Error:", err);
        setError(err.message || "An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [matchID, playerInfo?.player_uid]);

  const formatState = data?.stats_data?.form?.format_stats;

  // -------------------------------- Render UI --------------------------------

  return (
    <div className="w-full min-h-screen flex flex-col bg-white overflow-hidden items-center justify-start">
      {/* Navigation Bar */}
      <div className="relative w-full max-w-screen-lg border-b flex items-center py-4">
        {/* Back Button (Left-Aligned) */}
        <Link
          to={`/insight-match/Cricket/${matchInSights?.season_game_uid}/${matchInSights?.home}_vs_${matchInSights?.away}/${matchInSights?.league_id}`}
          state={{ matchInSights }}
          className="absolute left-4 p-2 rounded-lg hover:bg-gray-100 flex items-center transition duration-300 ease-in-out"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6 text-gray-700"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>

        {/* Centered Header Title */}
        <h1 className="text-lg font-semibold text-center text-gray-800 mx-auto">
          Player Information
        </h1>
      </div>

      {loading && (
        <div className="text-center text-gray-600 my-4">Loading...</div>
      )}
      {error && (
        <div className="text-red-500 text-center my-4">Error: {error}</div>
      )}

      {data && (
        // Main card wrapper
        <div className="w-full max-w-4xl mx-auto bg-gray-100 shadow-lg rounded-lg p-4 my-4">
          {/* Player Header */}
          <div className="flex justify-between items-start">
            {/* Player Details */}
            <div className="flex flex-col space-y-1">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                {data?.player_detail?.full_name}{" "}
                {/* example: rank lightning icon + rank number */}
                <span className="text-orange-500 ml-1">⚡</span>
                <span className="ml-1">
                  {data?.player_power_rank?.power_rank}
                </span>
              </h2>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {/* Flag */}
                {data?.player_detail?.flag && (
                  <img
                    src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${data.player_detail.flag}`}
                    alt="Player's Flag"
                    className="w-5 h-5 rounded-full"
                  />
                )}
                <span>{data?.player_detail?.team_name}</span>
                <span>|</span>
                <span>
                  {data?.player_detail?.position === "BAT"
                    ? "Batsman"
                    : data?.player_detail?.position === "BOW"
                    ? "Bowler"
                    : data?.player_detail?.position === "AR"
                    ? "All Rounder"
                    : "Batsman"}
                </span>
                <span>|</span>
                <span>
                  {data?.player_detail?.batting_style === "Right Hand Bat"
                    ? "RH Bat"
                    : data?.player_detail?.batting_style === "Left Hand Bat"
                    ? "LH Bat"
                    : "Right Hand Bat"}
                </span>
                <span>|</span>
                <span>{data?.player_detail?.bowling_style}</span>
              </div>

              {/* Last Match Info */}
              {playerInfo?.last_match_played === "1" && (
                <div className="flex items-center space-x-2 text-gray-500 italic text-xs mt-2">
                  <span className="bg-gray-200 px-2 py-1 rounded">
                    In last match
                  </span>
                  <span className="bg-gray-200 px-3 py-1 rounded font-medium text-gray-900">
                    Batting order{" "}
                    <span className="font-bold">
                      {data?.player_detail?.batting_order}
                    </span>
                  </span>
                  <span className="bg-gray-200 px-3 py-1 rounded font-medium text-gray-900">
                    Bowling order{" "}
                    <span className="font-bold">
                      {data?.player_detail?.bowling_order}
                    </span>
                  </span>
                </div>
              )}

              {/* Action Icons */}
              <div className="flex items-center space-x-6 text-gray-500 mt-3">
                <div className="flex flex-col items-center cursor-pointer hover:text-gray-700">
                  <FaStar className="text-xl" />
                  <span className="text-xs">Preferred</span>
                </div>
                <div className="flex flex-col items-center cursor-pointer hover:text-gray-700">
                  <FaLock className="text-xl" />
                  <span className="text-xs">Lock</span>
                </div>
                <div className="flex flex-col items-center cursor-pointer hover:text-gray-700">
                  <FaTimes className="text-xl" />
                  <span className="text-xs">Exclude</span>
                </div>
              </div>
            </div>

            {/* Player Image (jersey) */}
            {data?.player_detail?.jersey && (
              <img
                src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/${data.player_detail.jersey}`}
                alt="Player's Jersey"
                className="w-20 h-20 object-cover"
              />
            )}
          </div>

          {/* Main navigation (FORM / POWER RANKING / GRAPH / BY FORMAT / COMPETITION / NEWS) */}
          <div className="mt-6 border-b">
            <nav className="flex space-x-6 text-gray-600">
              <Link
                to={`/player/${
                  playerInfo?.player_uid
                }/${playerInfo?.full_name?.replace(/\s+/g, "_")}/${
                  matchInSights?.season_game_uid
                }/form`}
                state={{ playerInfo, matchID, matchInSights }}
                className={`py-2 ${
                  isActive("/form")
                    ? "border-b-2 border-blue-500 text-gray-900 font-semibold"
                    : "hover:text-gray-900"
                }`}
              >
                FORM
              </Link>

              <Link
                to={`/player/${
                  playerInfo?.player_uid
                }/${playerInfo?.full_name?.replace(/\s+/g, "_")}/${
                  matchInSights?.season_game_uid
                }/powerranking`}
                state={{ playerInfo, matchID, matchInSights }}
                className={`py-2 ${
                  isActive("/powerranking")
                    ? "border-b-2 border-blue-500 text-gray-900 font-semibold"
                    : "hover:text-gray-900"
                }`}
              >
                POWER RANKING
              </Link>

              <Link
                to={`/player/${
                  playerInfo?.player_uid
                }/${playerInfo?.full_name?.replace(/\s+/g, "_")}/${
                  matchInSights?.season_game_uid
                }/graph`}
                state={{ playerInfo, matchID, matchInSights }}
                className={`py-2 ${
                  isActive("/graph")
                    ? "border-b-2 border-blue-500 text-gray-900 font-semibold"
                    : "hover:text-gray-900"
                }`}
              >
                GRAPH
              </Link>

              <Link
                to={`/player/${
                  playerInfo?.player_uid
                }/${playerInfo?.full_name?.replace(/\s+/g, "_")}/${
                  matchInSights?.season_game_uid
                }/format`}
                state={{ playerInfo, matchID, matchInSights }}
                className={`py-2 ${
                  isActive("/format")
                    ? "border-b-2 border-blue-500 text-gray-900 font-semibold"
                    : "hover:text-gray-900"
                }`}
              >
                BY FORMAT
              </Link>

              <Link
                to={`/player/${
                  playerInfo?.player_uid
                }/${playerInfo?.full_name?.replace(/\s+/g, "_")}/${
                  matchInSights?.season_game_uid
                }/competition`}
                state={{ playerInfo, matchID, matchInSights }}
                className={`py-2 ${
                  isActive("/competition")
                    ? "border-b-2 border-blue-500 text-gray-900 font-semibold"
                    : "hover:text-gray-900"
                }`}
              >
                BY COMPETITION
              </Link>

              <Link
                to={`/player/${
                  playerInfo?.player_uid
                }/${playerInfo?.full_name?.replace(/\s+/g, "_")}/${
                  matchInSights?.season_game_uid
                }/news`}
                state={{ playerInfo, matchID, matchInSights }}
                className={`py-2 ${
                  isActive("/news")
                    ? "border-b-2 border-blue-500 text-gray-900 font-semibold"
                    : "hover:text-gray-900"
                }`}
              >
                NEWS
              </Link>
            </nav>
          </div>

          {/* Sub navigation (based on 'tabs' array) */}
          <div className="mt-6 border-b">
            <nav className="flex space-x-6 text-gray-600">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-6 text-sm font-medium ${
                    activeTab === tab
                      ? "border-b-2 border-blue-500 text-gray-900 font-semibold"
                      : "hover:text-gray-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Dynamic Content Based on Active Tab */}
          <div className="p-4">
            {/* EXAMPLE: If tab = T20 */}
            {activeTab === tabs[0] && data?.stats_data?.graph?.format_stats && (
              <Format
                data={data}
                matchInSights={matchInSights}
                playerInfo={playerInfo}
                formatState={formatState}
              />
            )}

            {activeTab === `VS ${matchInSights?.away_abbr}` &&
              data?.stats_data?.graph?.opposition_stats && (
                <OppositeTeam
                  data={data}
                  matchInSights={matchInSights}
                  playerInfo={playerInfo}
                  formatState={formatState}
                />
              )}

            {activeTab === "THIS VENUE" &&
              data?.stats_data?.graph?.venue_stats && (
                <ThisVenue
                  data={data}
                  matchInSights={matchInSights}
                  playerInfo={playerInfo}
                  formatState={formatState}
                />
              )}

            {activeTab === "OVERALL FORM" &&
              data?.stats_data?.graph?.recent_stats && (
                <OverAllForm
                  data={data}
                  matchInSights={matchInSights}
                  playerInfo={playerInfo}
                  formatState={formatState}
                />
              )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerDetails;
