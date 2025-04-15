import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios";
import { FaStar, FaLock, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
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
  const playerInfo = location.state?.playerInfo;
  const matchID = location.state?.matchID;
  const matchInSights = location.state?.matchInSights;

  // Format labels
  const formatLabels = {
    1: "Test",
    2: "ODI",
    3: "T20",
    4: "T10",
  };
  const formatLabel = (format) => formatLabels[format] || format || "N/A";

  const vsAwayTeamLabel = `VS ${matchInSights?.away_abbr || matchInSights?.away || "???"}`;
  const tabs = [formatLabel(matchInSights?.format), vsAwayTeamLabel, "THIS VENUE", "OVERALL FORM"];
  const mainNavItems = [
    { label: "FORM", path: "form" },
    { label: "POWER RANKING", path: "powerranking" },
    { label: "GRAPH", path: "graph" },
    { label: "BY FORMAT", path: "format" },
    { label: "BY COMPETITION", path: "competition" },
    { label: "NEWS", path: "news" },
  ];

  const [activeNav, setActiveNav] = useState(mainNavItems[0].path);
  const [activeTab, setActiveTab] = useState(tabs[0]);

  // Fetch player data
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
        setData(response.data.data);
      } catch (err) {
        setError(err.message || "An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [matchID, playerInfo?.player_uid, activeNav]);

  const { player_detail = {}, player_power_rank = {}, stats_data = {} } = data || {};
  const { graph = {}, form = {} } = stats_data;
  const { format_stats, opposition_stats, venue_stats, recent_stats } = graph;

  const positionMap = {
    BAT: "Batsman",
    BOW: "Bowler",
    AR: "All Rounder",
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const tabVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 overflow-hidden">
      {/* Navigation Bar */}
      <motion.div
        className="flex flex-col sm:flex-row items-center p-4 border-b w-full max-w-screen-xl mx-auto mt-4 bg-white shadow-sm"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full flex justify-between items-center">
          <Link
            to={`/insight-match/Cricket/${matchInSights?.season_game_uid}/${matchInSights?.home}_vs_${matchInSights?.away}/${matchInSights?.league_id}`}
            state={{ matchInSights }}
            className="p-2 rounded-lg hover:bg-gray-200 flex items-center transition duration-300"
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
          <h1 className="text-lg sm:text-xl font-bold text-gray-800 flex-1 text-center">
            Player Information
          </h1>
        </div>
      </motion.div>

      {/* Loading & Error States */}
      {loading && (
        <motion.div
          className="text-center text-gray-600 my-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Loading...
        </motion.div>
      )}
      {error && (
        <motion.div
          className="text-red-500 text-center my-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Error: {error}
        </motion.div>
      )}

      {/* Main Content */}
      {data && (
        <motion.div
          className="w-full max-w-5xl mx-auto bg-white shadow-xl rounded-2xl p-4 sm:p-6 my-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Player Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6">
            {/* Player Details */}
            <div className="flex flex-col space-y-3 w-full">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 flex items-center flex-wrap">
                <span className="mr-2">{player_detail.full_name}</span>
                <span className="text-orange-500 mr-2">⚡</span>
                <span>{player_power_rank.power_rank}</span>
              </h2>

              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600">
                {player_detail.flag && (
                  <img
                    src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${player_detail.flag}`}
                    alt="Player's Flag"
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full shadow-sm"
                  />
                )}
                <span>{player_detail.team_name}</span>
                <span className="mx-1">|</span>
                <span>{positionMap[player_detail.position] || "Batsman"}</span>
                <span className="mx-1">|</span>
                <span>
                  {player_detail.batting_style === "Right Hand Bat"
                    ? "RH Bat"
                    : player_detail.batting_style === "Left Hand Bat"
                    ? "LH Bat"
                    : "RH Bat"}
                </span>
                <span className="mx-1">|</span>
                <span>{player_detail.bowling_style}</span>
                {player_detail.injury_status && (
                  <>
                    <span className="mx-1">|</span>
                    <span className="text-red-600">Injured {player_detail.injury_status}</span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-2 text-gray-500 italic text-xs sm:text-sm mt-2">
                <span className="bg-gray-100 px-3 py-1 rounded-full">In last match</span>
                {player_detail.batting_order !== "0" && (
                  <span className="bg-gray-100 px-3 py-1 rounded-full font-medium text-gray-900">
                    Batting order <span className="font-bold">{player_detail.batting_order}</span>
                  </span>
                )}
                {player_detail.bowling_order !== "0" && (
                  <span className="bg-gray-100 px-3 py-1 rounded-full font-medium text-gray-900">
                    Bowling order <span className="font-bold">{player_detail.bowling_order}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 sm:gap-6 text-gray-500 mt-3">
                <motion.div
                  className="flex flex-col items-center cursor-pointer hover:text-orange-500 transition"
                  whileHover={{ scale: 1.1 }}
                >
                  <FaStar className="text-lg sm:text-xl" />
                  <span className="text-xs">Preferred</span>
                </motion.div>
                <motion.div
                  className="flex flex-col items-center cursor-pointer hover:text-blue-500 transition"
                  whileHover={{ scale: 1.1 }}
                >
                  <FaLock className="text-lg sm:text-xl" />
                  <span className="text-xs">Lock</span>
                </motion.div>
                <motion.div
                  className="flex flex-col items-center cursor-pointer hover:text-red-500 transition"
                  whileHover={{ scale: 1.1 }}
                >
                  <FaTimes className="text-lg sm:text-xl" />
                  <span className="text-xs">Exclude</span>
                </motion.div>
              </div>
            </div>

            {/* Player Image */}
            {player_detail.jersey && (
              <motion.div
                className="flex-shrink-0"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <img
                  src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/${player_detail.jersey}`}
                  alt="Player's Jersey"
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover shadow-lg border-4 border-white"
                />
              </motion.div>
            )}
          </div>

          {/* Main Navigation */}
          <motion.div
            className="mt-6 border-b border-gray-200"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent pb-2">
              <nav className="flex flex-nowrap min-w-max justify-start space-x-2 sm:space-x-4">
                {mainNavItems.map(({ label, path }) => (
                  <Link
                    key={path}
                    to={`/player/${playerInfo?.player_uid}/${(playerInfo?.full_name || playerInfo?.display_name).replace(
                      /\s+/g,
                      "_"
                    )}/${matchInSights?.season_game_uid}/${path}`}
                    state={{ playerInfo, matchID, matchInSights }}
                    onClick={() => setActiveNav(path)}
                    className={`py-2 px-4 text-sm font-medium whitespace-nowrap rounded-t-lg transition duration-300 ${
                      activeNav === path
                        ? "bg-blue-500 text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div className="p-4 sm:p-6" variants={containerVariants} initial="hidden" animate="visible">
            {activeNav === "form" && (
              <>
                {/* Sub Navigation */}
                <motion.div className="mt-6 border-b border-gray-200" variants={containerVariants}>
                  <div className="w-full overflow-x-auto scrollbar-thin pb-1">
                    <nav className="flex flex-nowrap min-w-max justify-start md:justify-center space-x-2 sm:space-x-4">
                      {tabs.map((tab) => (
                        <motion.button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`py-2 px-4 text-sm font-medium whitespace-nowrap rounded-t-lg transition duration-300 ${
                            activeTab === tab
                              ? "bg-blue-500 text-white shadow-md"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                          }`}
                          variants={tabVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          {tab}
                        </motion.button>
                      ))}
                    </nav>
                  </div>
                </motion.div>

                {/* Sub Content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    className="mt-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
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
                  </motion.div>
                </AnimatePresence>
              </>
            )}

            {activeNav === "powerranking" && <PowerRanking />}
            {activeNav === "graph" && <Graph />}
            {activeNav === "format" && <Byformat />}
            {activeNav === "competition" && <ByCometition />}
            {activeNav === "news" && <News />}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

export default PlayerDetails;