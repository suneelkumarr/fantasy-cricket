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
            sports_id: null,
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

  const {
    player_detail = {},
    player_power_rank = {},
    stats_data = {},
  } = data || {};
  const { graph = {}, form = {} } = stats_data;
  const { format_stats, opposition_stats, venue_stats, recent_stats } = graph;

  const positionMap = {
    BAT: "Batsman",
    BOW: "Bowler",
    AR: "All Rounder",
  };

  console.log(Getlocation());

  return (
    <div className="w-full min-h-screen flex flex-col bg-white overflow-hidden">
      {/* Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-center p-4 border-b w-full max-w-screen-lg mx-auto mt-4 justify-between">
        <div className="w-full flex justify-between items-center">
          {/* Back Button */}
          <Link
            to={`/insight-match/Cricket/${matchInSights?.season_game_uid}/${matchInSights?.home}_vs_${matchInSights?.away}/${matchInSights?.league_id}`}
            state={{ matchInSights }}
            className="p-2 rounded-lg hover:bg-gray-100 flex items-center transition duration-300 ease-in-out"
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
          <h1 className="text-lg font-semibold text-center text-gray-800 flex-1">
            Player Information
          </h1>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="text-center text-gray-600 my-4">Loading...</div>
      )}
      {error && (
        <div className="text-red-500 text-center my-4">Error: {error}</div>
      )}

      {/* Main Content */}
      {data && (
        <div className="w-full max-w-4xl mx-auto bg-gray-100 shadow-lg rounded-lg p-4 my-4">
          {/* Player Header */}
          <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4">
            <div className="flex flex-row sm:flex-row justify-between items-start gap-4">
              {/* Player Details */}
              <div className="flex flex-col space-y-2 w-full">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 flex items-center flex-wrap">
                  <span className="mr-1 whitespace-nowrap">
                    {player_detail.full_name}
                  </span>
                  <span className="text-orange-500 mr-1">⚡</span>
                  <span>{player_power_rank.power_rank}</span>
                </h2>

                <div className="flex flex-nowrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                  {player_detail.flag && (
                    <img
                      src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${player_detail.flag}`}
                      alt="Player's Flag"
                      className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full"
                    />
                  )}
                  <span>{player_detail.team_name}</span>
                  <span>|</span>
                  <span>
                    {positionMap[player_detail.position] || "Batsman"}
                  </span>
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
                  {player_detail.injury_status && (
                    <>
                      <span>|</span>
                      <span className="text-red-600">
                        Injured {player_detail.injury_status}
                      </span>
                    </>
                  )}
                </div>

<div className="flex items-center flex-nowrap gap-2 text-gray-500 italic text-xs sm:text-sm mt-1">
  {/* Always show "In last match" */}
  <span className="bg-gray-200 px-2 py-1 rounded">
    In last match
  </span>

  {/* Conditionally show batting order if it's not "0" */}
  {player_detail.batting_order !== "0" && (
    <span className="bg-gray-200 px-2 py-1 rounded font-medium text-gray-900">
      Batting order{" "}
      <span className="font-bold">
        {player_detail.batting_order}
      </span>
    </span>
  )}

  {/* Conditionally show bowling order if it's not "0" */}
  {player_detail.bowling_order !== "0" && (
    <span className="bg-gray-200 px-2 py-1 rounded font-medium text-gray-900">
      Bowling order{" "}
      <span className="font-bold">
        {player_detail.bowling_order}
      </span>
    </span>
  )}
</div>

                <div className="flex items-center gap-3 sm:gap-4 md:gap-6 text-gray-500 mt-2">
                  <div className="flex flex-col items-center cursor-pointer hover:text-gray-700">
                    <FaStar className="text-base sm:text-lg md:text-xl" />
                    <span className="text-xs">Preferred</span>
                  </div>
                  <div className="flex flex-col items-center cursor-pointer hover:text-gray-700">
                    <FaLock className="text-base sm:text-lg md:text-xl" />
                    <span className="text-xs">Lock</span>
                  </div>
                  <div className="flex flex-col items-center cursor-pointer hover:text-gray-700">
                    <FaTimes className="text-base sm:text-lg md:text-xl" />
                    <span className="text-xs">Exclude</span>
                  </div>
                </div>
              </div>

              {/* Player Image */}
              {player_detail.jersey && (
                <div className="flex-shrink-0 -pl-120 sm:-pl-120 md:-pl-120 lg:-pl-120">
                  <img
                    src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/${player_detail.jersey}`}
                    alt="Player's Jersey"
                    className="w-[162px] h-[156px] object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Main Navigation */}
<div className="mt-6 border-b">
  <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pb-2">
    <nav className="flex flex-nowrap min-w-max justify-start space-x-4 text-gray-600">
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
          className={`py-2 px-4 text-sm font-medium whitespace-nowrap ${
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
</div>

          {/* Main Content */}
          <div className="p-4">
            {activeNav === "form" && (
              <>
                {/* Sub Navigation */}
                <div className="mt-6 border-b">
                <div className="w-full overflow-x-auto scrollbar-thin pb-1">
                  <nav className="flex flex-nowrap min-w-max justify-start md:justify-center space-x-4 text-gray-600">
                    {tabs.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-2 px-4 text-sm font-medium whitespace-nowrap ${
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
              </div>
                <div className="mt-2 -ml-10">
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
