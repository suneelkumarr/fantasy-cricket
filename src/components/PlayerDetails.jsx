import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios";
import { FaStar, FaLock, FaTimes } from "react-icons/fa";
import Format from "./Format";
import OppositeTeam from "./OppositeTeam";
import ThisVenue from "./ThisVenue";
import OverAllForm from "./OverAllForm";
import PowerRanking from "./PowerRanking";
import Graph from "./Graph";
import Byformat from "./Byformat";
import ByCometition from "./ByCometition";
import News from "./News";
import Getlocation from "./Getlocation.jsx";

function PlayerDetails() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const location = useLocation();

  // Pulled from location.state
  const playerInfo = location.state?.playerInfo;
  const matchID = location.state?.matchID;
  const matchInSights = location.state?.matchInSights;

  // Helper to label format
  const formatLabels = {
    1: "Test",
    2: "ODI",
    3: "T20",
    4: "T10",
  };
  const formatLabel = (format) => formatLabels[format] || format || "N/A";

  // Predefine the label for the second tab so it’s consistent
  const vsAwayTeamLabel = `VS ${
    matchInSights?.away_abbr || matchInSights?.away || "???"
  }`;

  // Construct your top-level (sub) tabs for “FORM”
  const tabs = [
    formatLabel(matchInSights?.format),
    vsAwayTeamLabel,
    "THIS VENUE",
    "OVERALL FORM",
  ];

  // Main navigation data
  const mainNavItems = [
    { label: "FORM", path: "form" },
    { label: "POWER RANKING", path: "powerranking" },
    { label: "GRAPH", path: "graph" },
    { label: "BY FORMAT", path: "format" },
    { label: "BY COMPETITION", path: "competition" },
    { label: "NEWS", path: "news" },
  ];

  const [activeNav, setActiveNav] = useState(mainNavItems[0].path);
  const [activeTab, setActiveTab] = useState(tabs[0]); // default sub-tab

  // Fetch the data
  useEffect(() => {
    // We need matchID and player UID to fetch data
    if (!matchID || !playerInfo?.player_uid) {
      console.warn("Either matchID or player UID is missing");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.post(
          "https://plapi.perfectlineup.in/fantasy/stats/get_perfectlineup_playercard",
          {
            season_game_uid: matchID,
            sports_id: null, // or 7 if you have it
            fav_detail: 1,
            player_uid: playerInfo?.player_uid,
            power_rank_detail: 1,
            tab_info: activeNav,
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
        // API structure: { data: { ... } }
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

  // Easier destructuring from data
  const {
    player_detail = {},
    player_power_rank = {},
    stats_data = {},
  } = data || {};
  const { graph = {}, form = {} } = stats_data;
  const { format_stats, opposition_stats, venue_stats, recent_stats } = graph;

  // Mapping for positions
  const positionMap = {
    BAT: "Batsman",
    BOW: "Bowler",
    AR: "All Rounder",
  };

  console.log(Getlocation());

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

      {/* Loading & Error States */}
      {loading && (
        <div className="text-center text-gray-600 my-4">Loading...</div>
      )}
      {error && (
        <div className="text-red-500 text-center my-4">Error: {error}</div>
      )}

      {/* Main content if we have data */}
      {data && (
        <div className="w-full max-w-4xl mx-auto bg-gray-100 shadow-lg rounded-lg p-4 my-4">
          {/* Player Header */}
          <div className="flex justify-between items-start">
            {/* Player Details */}
            <div className="flex flex-col space-y-1">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                {player_detail.full_name}
                <span className="text-orange-500 ml-1">⚡</span>
                <span className="ml-1">{player_power_rank.power_rank}</span>
              </h2>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {player_detail.flag && (
                  <img
                    src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${player_detail.flag}`}
                    alt="Player's Flag"
                    className="w-5 h-5 rounded-full"
                  />
                )}
                <span>{player_detail.team_name}</span>
                <span>|</span>
                <span>{positionMap[player_detail.position] || "Batsman"}</span>
                <span>|</span>
                <span>
                  {player_detail.batting_style === "Right Hand Bat"
                    ? "RH Bat"
                    : player_detail.batting_style === "Left Hand Bat"
                    ? "LH Bat"
                    : "RH Bat"}
                </span>
                <span>|</span>
                <span>{player_detail.bowling_style}</span>
                <span>|</span>
                <span className="text-red-600">
                  Injured {player_detail.injury_status}
                </span>
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
                      {player_detail.batting_order}
                    </span>
                  </span>
                  <span className="bg-gray-200 px-3 py-1 rounded font-medium text-gray-900">
                    Bowling order{" "}
                    <span className="font-bold">
                      {player_detail.bowling_order}
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
            {player_detail.jersey && (
              <img
                src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/${player_detail.jersey}`}
                alt="Player's Jersey"
                className="w-20 h-20 object-cover"
              />
            )}
          </div>

          {/* Main navigation */}
          <div className="mt-6 border-b">
            <nav className="flex space-x-6 text-gray-600">
              {mainNavItems.map(({ label, path }) => (
                <Link
                  key={path}
                  to={`/player/${
                    playerInfo?.player_uid
                  }/${(playerInfo?.full_name
                    ? playerInfo.full_name
                    : playerInfo.display_name
                  ).replace(/\s+/g, "_")}/${
                    matchInSights?.season_game_uid
                  }/${path}`}
                  state={{ playerInfo, matchID, matchInSights }}
                  onClick={() => setActiveNav(path)}
                  className={`py-2 px-6 text-sm font-medium ${
                    activeNav === path
                      ? "border-b-2 border-blue-500 text-gray-900 font-semibold"
                      : "hover:text-gray-900"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Main Content based on activeNav */}
          <div className="p-4">
            {activeNav === "form" && (
              <>
                {/* Sub navigation (FORM tabs) */}
                <div className="mt-6 border-b justify-center">
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
                  {activeTab === tabs[0] && format_stats && (
                    <Format
                      data={data}
                      matchInSights={matchInSights}
                      playerInfo={playerInfo}
                      formatState={form?.format_stats}
                    />
                  )}

                  {activeTab === vsAwayTeamLabel && opposition_stats && (
                    <OppositeTeam
                      data={data}
                      matchInSights={matchInSights}
                      playerInfo={playerInfo}
                      formatState={form?.format_stats}
                    />
                  )}

                  {activeTab === "THIS VENUE" && venue_stats && (
                    <ThisVenue
                      data={data}
                      matchInSights={matchInSights}
                      playerInfo={playerInfo}
                      formatState={form?.format_stats}
                    />
                  )}

                  {activeTab === "OVERALL FORM" && recent_stats && (
                    <OverAllForm
                      data={data}
                      matchInSights={matchInSights}
                      playerInfo={playerInfo}
                      formatState={form?.format_stats}
                    />
                  )}
                </div>
              </>
            )}

            {activeNav === "powerranking" && <PowerRanking />}

            {activeNav === "graph" && <Graph />}

            {activeNav === "format" && <Byformat />}

            {activeNav === "competition" && <ByCometition />}

            {activeNav === "news" && <News />}
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerDetails;
