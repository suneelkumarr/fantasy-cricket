import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

// Format map for match formats
const formatMap = {
  4: "T10",
  3: "T20",
  2: "ODI",
  1: "TEST",
};

// Countdown timer logic
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

// Reusable Tab Button Component
const TabButton = ({ label, isActive, onClick }) => (
  <motion.button
    onClick={onClick}
    className={`flex-1 px-3 py-2 text-xs sm:text-sm md:text-base font-medium rounded-full transition-all duration-300 ${
      isActive
        ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg"
        : "bg-transparent text-gray-600 hover:bg-gray-200"
    }`}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    {label}
  </motion.button>
);

// Skeleton Loader Component
const SkeletonLoader = () => (
  <div className="w-full space-y-4 p-4">
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className="h-16 bg-gray-200 rounded-lg animate-pulse"
      ></div>
    ))}
  </div>
);

// Fixture Header Component
function FixtureHeader({ fixtureDetails, getCountdownTime, data }) {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(
    getCountdownTime(fixtureDetails.season_scheduled_date)
  );
  const [showLineup, setShowLineup] = useState(true);

  let tossText = "";
  if (data?.toss_data && data.toss_data !== "[]") {
    try {
      tossText = JSON.parse(data.toss_data)?.text || "";
    } catch (error) {
      console.error("Failed to parse toss_data JSON:", error);
    }
  }

  useEffect(() => {
    let interval;
    if (data?.playing_announce === "1" && data.toss_data !== "[]") {
      interval = setInterval(() => setShowLineup((prev) => !prev), 1000);
    }
    return () => clearInterval(interval);
  }, [data?.playing_announce, data?.toss_data]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdownTime(fixtureDetails.season_scheduled_date));
    }, 1000);
    return () => clearInterval(timer);
  }, [fixtureDetails.season_scheduled_date]);

  const bubbleText =
    data?.playing_announce === "1"
      ? data.toss_data === "[]"
        ? "Lineup Out"
        : tossText && showLineup
        ? "Lineup Out"
        : tossText || "Lineup Out"
      : "Playing 11 is not announced";

  if (!data) return null;

  return (
    <motion.div
      className="sticky top-0 z-10 w-full bg-gradient-to-b from-white to-gray-50 shadow-md px-4 py-6"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* 
        Centering container, but we give one child a 'relative' position 
        so we can pin the button on the left using absolute positioning. 
      */}
      <div className="w-full max-w-4xl mx-auto text-center">
        {/* This wrapper is 'relative' so the button can be placed on the left */}
        <div className="relative flex flex-col items-center">
          {/* Navigation Button pinned to the left */}
          <motion.button
            onClick={() => navigate("/")}
            className="p-2 rounded-full hover:bg-gray-200 transition-colors absolute left-0 top-0"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
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
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </motion.button>

          {/* Main title / flags (still centered) */}
          <div className="mt-2 flex items-center justify-center space-x-3">
            <img
              src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${fixtureDetails.home_flag}`}
              alt={fixtureDetails.home}
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full shadow-sm"
              loading="lazy"
            />
            <span className="text-base sm:text-lg md:text-xl font-bold text-gray-800">
              {fixtureDetails.home} vs {fixtureDetails.away}
            </span>
            <img
              src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${fixtureDetails.away_flag}`}
              alt={fixtureDetails.away}
              className="w-6 h-6 sm:w-8 sm:h-8 rounded-full shadow-sm"
              loading="lazy"
            />
          </div>

          {/* Countdown Timer */}
          <motion.div
            className="mt-4 text-red-600 font-semibold text-xs sm:text-sm md:text-base"
            animate={{ scale: countdown === "Event Started" ? 1.1 : 1 }}
            transition={{ duration: 0.3 }}
          >
            {countdown}
          </motion.div>

          {/* Bubble Text */}
          <motion.div
            className="flex justify-center mt-3"
            key={bubbleText}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-full shadow-sm text-xs sm:text-sm">
              {bubbleText}
            </span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}


// Player Category Section Component
const PlayerCategorySection = ({
  title,
  description,
  metric,
  playersData,
  formatLabel = (val) => val.toString(),
  unitText = () => "",
  fixture_info,
  sortOrder = "desc",
  filterFn,
  innerTabs,
  matchInSights,
}) => {
  const [activeTab, setActiveTab] = useState(
    innerTabs ? innerTabs[0] : "Overall"
  );

  const teamColors = {
    [fixture_info.home]: "bg-green-500",
    [fixture_info.away]: "bg-purple-500",
  };

  const tabs = innerTabs || ["Overall", fixture_info.home, fixture_info.away];

  const processedPlayers = useMemo(() => {
    let filteredData = filterFn ? playersData.filter(filterFn) : playersData;
    if (!innerTabs) {
      filteredData =
        activeTab === "Overall"
          ? filteredData
          : filteredData.filter((player) => player.team_abbr === activeTab);
    } else if (activeTab !== "Overall") {
      filteredData = filteredData.filter(
        (player) => player.child_position === activeTab
      );
    }
    return [...filteredData]
      .sort((a, b) =>
        sortOrder === "desc" ? b[metric] - a[metric] : a[metric] - b[metric]
      )
      .slice(0, 8);
  }, [activeTab, playersData, metric, sortOrder, filterFn, innerTabs]);

  const maxValue = useMemo(
    () =>
      processedPlayers.length
        ? Math.max(...processedPlayers.map((p) => p[metric] || 0))
        : 1,
    [processedPlayers, metric]
  );

  return (
    <motion.div
      className="mb-8 bg-white rounded-xl shadow-lg overflow-hidden w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">{description}</p>
      </div>
      {tabs.length > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-center bg-gray-100 p-1 mx-4 rounded-full mb-6 space-y-2 sm:space-y-0">
          {tabs.map((tab) => (
            <TabButton
              key={tab}
              label={tab}
              isActive={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            />
          ))}
        </div>
      )}
      {processedPlayers.length === 0 && (
        <div className="p-6 text-center text-gray-500 text-sm">
          No players found matching the criteria
        </div>
      )}
      <div className="space-y-4 p-4">
        <AnimatePresence>
          {processedPlayers.map((player) => {
            const value = player[metric] || 0;
            const percentage = Math.min((value / maxValue) * 100, 100).toFixed(
              2
            );
            const progressBarColor =
              teamColors[player.team_abbr] || "bg-blue-500";

            return (
              <motion.div
                key={player.player_uid}
                className="flex flex-col sm:flex-row items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <Link
                  to={`/player/${player.player_uid}/${player.full_name.replace(
                    /\s+/g,
                    "_"
                  )}/${matchInSights.season_game_uid}/form`}
                  state={{
                    playerInfo: player,
                    matchID: matchInSights.season_game_uid,
                    matchInSights,
                  }}
                  className="flex items-center w-full sm:w-40 flex-shrink-0 mb-2 sm:mb-0 justify-center"
                >
                  <img
                    src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/${player.jersey}`}
                    alt={player.nick_name}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full mr-3 bg-gray-100"
                    loading="lazy"
                    onError={(e) =>
                      (e.target.src =
                        "https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/default_player.png")
                    }
                  />
                  <div className="text-left">
                    <div className="font-medium text-gray-800 truncate max-w-[80px] sm:max-w-[100px]">
                      {player.nick_name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center">
                      {player.child_position}
                      <span className="mx-1 w-1 h-1 bg-gray-400 rounded-full inline-block"></span>
                      {player.team_abbr}
                    </div>
                  </div>
                </Link>
                <div className="flex items-center flex-grow px-0 sm:px-4 w-full sm:w-auto justify-center">
                  <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full ${progressBarColor}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <span className="ml-3 text-xs font-medium text-gray-700 w-14 text-right">
                    {formatLabel(value)}
                  </span>
                </div>
                <div className="text-xs text-gray-600 w-full sm:w-32 text-right flex-shrink-0 mt-2 sm:mt-0">
                  {unitText(player)}
                </div>
                <div className="ml-0 sm:ml-2 w-5 flex-shrink-0 mt-2 sm:mt-0">
                  <img
                    src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_prefer_inactive.svg"
                    alt="lock"
                    className="w-5 h-5 mx-auto"
                    loading="lazy"
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Player Categories Component
const PlayerCategories = ({ players, fixture_info }) => {
  const safeFixtureInfo = {
    home: fixture_info?.home || "HOME",
    away: fixture_info?.away || "AWAY",
  };

  const sections = useMemo(
    () => [
      {
        title: "Total Fantasy Points",
        description:
          "Top players based on fantasy points in the last 5 matches",
        metric: "fantasy_pts",
        formatLabel: (val) => val.toFixed(0),
        unitText: (player) =>
          `${player.fantasy_pts} Pts in ${player.match_count} match${
            player.match_count > 1 ? "es" : ""
          }`,
      },
      {
        title: "Avg Fantasy Points",
        description:
          "Top players based on average fantasy points in the last 5 matches",
        metric: "avg_fantasy_pts",
        formatLabel: (val) => val.toFixed(2),
        unitText: (player) =>
          `${player.avg_fantasy_pts} Pts in ${player.match_count} match${
            player.match_count > 1 ? "es" : ""
          }`,
      },
      {
        title: "Part of Perfectlineup",
        description: "Players frequently featuring in DreamTeams",
        metric: "in_perfect_lineup",
        formatLabel: (val) => val.toString(),
        unitText: (player) =>
          `${player.in_perfect_lineup} Time${
            player.in_perfect_lineup > 1 ? "s" : ""
          }`,
      },
      {
        title: "Most Valuable Player",
        description: "Players with good returns against their salary",
        metric: "value",
        formatLabel: (val) => val.toFixed(2),
        unitText: (player) => `${player.value}`,
      },
      {
        title: `Team Rank (${safeFixtureInfo.home})`,
        description: `Top ${safeFixtureInfo.home} players based on team rank`,
        metric: "avg_team_rank",
        sortOrder: "desc",
        filterFn: (player) => player.team_abbr === safeFixtureInfo.home,
        innerTabs: null,
        formatLabel: (val) => val.toFixed(1),
        unitText: (player) =>
          `Rank ${player.avg_team_rank} in ${player.match_count} match${
            player.match_count > 1 ? "es" : ""
          }`,
      },
      {
        title: `Team Rank (${safeFixtureInfo.away})`,
        description: `Top ${safeFixtureInfo.away} players based on team rank`,
        metric: "avg_team_rank",
        sortOrder: "desc",
        filterFn: (player) => player.team_abbr === safeFixtureInfo.away,
        innerTabs: null,
        formatLabel: (val) => val.toFixed(1),
        unitText: (player) =>
          `Rank ${player.avg_team_rank} in ${player.match_count} match${
            player.match_count > 1 ? "es" : ""
          }`,
      },
      {
        title: "Position Rank",
        description: "Top performers by position in the last 5 matches",
        metric: "avg_overall_rank",
        sortOrder: "desc",
        innerTabs: ["Overall", "WK", "BAT", "AR", "BOW"],
        formatLabel: (val) => val.toFixed(1),
        unitText: (player) =>
          `Rank ${player.avg_overall_rank} in ${player.match_count} match${
            player.match_count > 1 ? "es" : ""
          }`,
      },
      {
        title: "Bottom 20%",
        description: "Players who underperformed in the last 5 matches",
        metric: "fantasy_pts",
        sortOrder: "desc",
        filterFn: (player) => {
          const sorted = [...players].sort(
            (a, b) => a.fantasy_pts - b.fantasy_pts
          );
          const thresholdIndex = Math.ceil(players.length * 0.2) - 1;
          return (
            sorted[thresholdIndex >= 0 ? thresholdIndex : 0]?.fantasy_pts || 0
          );
        },
        formatLabel: (val) => val.toFixed(0),
        unitText: (player) =>
          `${player.fantasy_pts} Pts in ${player.match_count} match${
            player.match_count > 1 ? "es" : ""
          }`,
      },
      {
        title: "Players with X Factor",
        description: "Players who can win matches single-handedly",
        metric: "value",
        filterFn: (player) => player.x_factor && player.x_factor.trim().length > 0,
        formatLabel: (val) => val.toFixed(2),
        unitText: (player) => player.x_factor || "",
      },
    ],
    [players, safeFixtureInfo]
  );

  return (
    <div className="w-full space-y-8 p-4 text-center">
      {sections.map((section, index) => (
        <PlayerCategorySection
          key={index}
          {...section}
          playersData={players}
          fixture_info={safeFixtureInfo}
          matchInSights={fixture_info}
        />
      ))}
    </div>
  );
};

// Consolidated Match Data Component
const MatchData = ({ matchInSights, type, tabsOverride }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiDataCache, setApiDataCache] = useState({});

  const API_CONFIG = {
    baseUrl: "https://plapi.perfectlineup.in/fantasy/stats/get_player_analysis",
    headers: {
      sessionkey: "3cd0fb996816c37121c765f292dd3f78",
      moduleaccess: "7",
      "Content-Type": "application/json",
    },
    defaultPayload: {
      season_game_uid: matchInSights.season_game_uid,
      website_id: 1,
      sports_id: "7",
      type,
    },
  };

  const fetchData = useCallback(
    async (firstBatUid = "") => {
      if (apiDataCache[firstBatUid]) return;

      setLoading(true);
      try {
        const response = await axios.post(
          API_CONFIG.baseUrl,
          { ...API_CONFIG.defaultPayload, first_bat_uid: firstBatUid },
          { headers: API_CONFIG.headers }
        );
        setApiDataCache((prev) => ({
          ...prev,
          [firstBatUid]: response.data.data,
        }));
        if (!firstBatUid) setData(response.data.data);
      } catch (err) {
        setError(err.message || "An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    },
    [apiDataCache, API_CONFIG]
  );

  useEffect(() => {
    if (!matchInSights?.season_game_uid) {
      console.warn("season_game_uid is undefined or null");
      return;
    }
    fetchData();
  }, [matchInSights?.season_game_uid, fetchData]);

  const defaultTabs = [
    "Based on Overall Performance",
    `${matchInSights.home} Bat First`,
    `${matchInSights.away} Bat First`,
  ];
  const tabs = tabsOverride || defaultTabs;
  const [activeTab, setActiveTab] = useState(tabs[0]);

  useEffect(() => {
    if (activeTab === tabs[0] || type !== "last_five") return;
    const firstBatUid =
      activeTab === tabs[1]
        ? matchInSights.home_uid
        : matchInSights.away_uid;
    if (!apiDataCache[firstBatUid]) {
      fetchData(firstBatUid);
    }
  }, [activeTab, fetchData, matchInSights, tabs, apiDataCache, type]);

  const renderContent = () => {
    if (loading) return <SkeletonLoader />;
    if (error) return <div className="text-red-500 text-center">Error: {error}</div>;

    const getPlayerData = () => {
      if (type !== "last_five" || activeTab === tabs[0]) {
        return data ? { players: data.players, fixture_info: data.fixture_info } : null;
      }
      const firstBatUid =
        activeTab === tabs[1]
          ? matchInSights.home_uid
          : matchInSights.away_uid;
      const apiData = apiDataCache[firstBatUid];
      return apiData ? { players: apiData.players, fixture_info: apiData.fixture_info } : null;
    };

    const playerData = getPlayerData();
    if (!playerData)
      return <div className="text-center text-gray-600">No data available</div>;

    return <PlayerCategories {...playerData} />;
  };

  return (
    <motion.div
      className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {type === "last_five" && (
        <motion.div
          className="text-center mb-6 text-gray-600 text-xs sm:text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Please select a possible outcome of the toss to see top performers
        </motion.div>
      )}
      {type === "last_five" && (
        <div className="flex flex-col sm:flex-row items-center justify-center bg-gray-100 p-1 rounded-full mb-8 space-y-2 sm:space-y-0">
          {tabs.map((tab) => (
            <TabButton
              key={tab}
              label={tab}
              isActive={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            />
          ))}
        </div>
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

// Last5Match Component
const Last5Match = ({ data }) => (
  <PlayerCategories players={data.players} fixture_info={data.fixture_info} />
);

// LastMatch Component
const LastMatch = ({ matchInSights }) => (
  <MatchData matchInSights={matchInSights} type="recent" tabsOverride={["Overall"]} />
);

// ThisSeries Component
const ThisSeries = ({ matchInSights }) => (
  <MatchData matchInSights={matchInSights} type="recent" tabsOverride={["Overall"]} />
);

// Main CheatSheet Component
function CheatSheet() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const matchInSights = location.state?.matchInSights;
  const matchFormat = formatMap[matchInSights?.format] || "T10";
  const tabs = ["LAST MATCH", `LAST 5 ${matchFormat}`, "THIS SERIES"];
  const [activeTab, setActiveTab] = useState(tabs[1]);

  useEffect(() => {
    if (!matchInSights?.season_game_uid) {
      console.warn("season_game_uid is undefined or null");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.post(
          "https://plapi.perfectlineup.in/fantasy/stats/get_player_analysis",
          {
            season_game_uid: matchInSights.season_game_uid,
            website_id: 1,
            sports_id: "7",
            first_bat_uid: "",
            type: "last_five",
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
      } catch (error) {
        setError(error.message || "An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [matchInSights?.season_game_uid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-center">
        <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto">
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-center">
        <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto text-red-500">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-center">
        <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto text-gray-600">
          No data available.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center text-center mx-auto max-w-6xl">
      <FixtureHeader
        fixtureDetails={matchInSights}
        getCountdownTime={getCountdownTime}
        data={data.fixture_info}
      />
      <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-4xl xl:max-w-5xl mx-auto p-4 sm:p-6">
        <motion.div
          className="text-center mb-6 text-gray-600 text-xs sm:text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Data shown is based on the same format played from the same team
        </motion.div>
        <div className="flex flex-col sm:flex-row items-center justify-center bg-gray-100 p-1 rounded-full mb-8 space-y-2 sm:space-y-0">
          {tabs.map((tab) => (
            <TabButton
              key={tab}
              label={tab}
              isActive={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            />
          ))}
        </div>
        <AnimatePresence mode="wait">
          {activeTab === `LAST 5 ${matchFormat}` && (
            <motion.div
              key="last5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Last5Match data={data} />
            </motion.div>
          )}
          {activeTab === "LAST MATCH" && (
            <motion.div
              key="lastMatch"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <LastMatch matchInSights={matchInSights} />
            </motion.div>
          )}
          {activeTab === "THIS SERIES" && (
            <motion.div
              key="thisSeries"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ThisSeries matchInSights={matchInSights} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default CheatSheet;
