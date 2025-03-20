import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import axios from "axios";

const formatMap = {
  4: "T10",
  3: "T20",
  2: "ODI",
  1: "TEST",
};

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

// A reusable section component// Reusable section component
// A reusable section component
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
  // Define team colors
  const teamColors = {
    [fixture_info.home]: "bg-green-500", // Home team color
    [fixture_info.away]: "bg-purple-500", // Away team color
  };

  const tabs = innerTabs || ["Overall", fixture_info.home, fixture_info.away];
  const [activeTab, setActiveTab] = useState(tabs[0]);

  const processedPlayers = useMemo(() => {
    let filteredData = filterFn ? playersData.filter(filterFn) : playersData;

    if (!innerTabs) {
      filteredData =
        activeTab === "Overall"
          ? filteredData
          : filteredData.filter((player) => player.team_abbr === activeTab);
    } else if (activeTab !== "Overall" && innerTabs.includes(activeTab)) {
      filteredData = filteredData.filter(
        (player) => player.child_position === activeTab
      );
    }

    return [...filteredData]
      .sort((a, b) => {
        return sortOrder === "desc"
          ? b[metric] - a[metric]
          : a[metric] - b[metric];
      })
      .slice(0, 8);
  }, [activeTab, playersData, metric, sortOrder, filterFn, innerTabs]);

  const maxValue = useMemo(() => {
    if (processedPlayers.length === 0) return 1;
    return Math.max(...processedPlayers.map((p) => p[metric] || 0));
  }, [processedPlayers, metric]);

  return (
    <div className="mb-8 shadow-md rounded-lg overflow-hidden">
      <div className="p-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      {tabs.length > 1 && (
        <div className="flex items-center bg-gray-100 p-1 mx-4 rounded-full mb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-center px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 focus:outline-none ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow"
                  : "bg-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {processedPlayers.length === 0 && (
        <div className="p-6 text-center text-gray-500">
          No players found matching the criteria
        </div>
      )}

      <div className="space-y-3 p-4">
        {processedPlayers.map((player) => {
          const value = player[metric] || 0;
          const percentage = Math.min((value / maxValue) * 100, 100).toFixed(2);
          // Determine the progress bar color based on player's team
          const progressBarColor =
            teamColors[player.team_abbr] || "bg-blue-500"; // Fallback color

          return (
            <div
              key={player.player_uid}
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Link
                key={player.player_uid}
                to={`/player/${player.player_uid}/${player.full_name.replace(
                  /\s+/g,
                  "_"
                )}/${matchInSights.season_game_uid}/form`}
                state={{
                  playerInfo: player,
                  matchID: matchInSights.season_game_uid,
                  matchInSights: matchInSights,
                }}
              >
                <div className="flex items-center w-36 flex-shrink-0">
                  <img
                    src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/${player.jersey}`}
                    alt={player.nick_name}
                    className="w-10 h-10 rounded-full mr-3 bg-gray-100"
                    onError={(e) => {
                      e.target.src =
                        "https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/default_player.png";
                    }}
                  />
                  <div>
                    <div className="font-medium text-gray-800 truncate max-w-[80px]">
                      {player.nick_name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center">
                      {player.child_position}
                      <span className="mx-1 w-1 h-1 bg-gray-400 rounded-full inline-block"></span>
                      {player.team_abbr}
                    </div>
                  </div>
                </div>
              </Link>

              <div className="flex items-center flex-grow px-4">
                <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${progressBarColor} transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="ml-3 text-xs font-medium text-gray-700 w-14 text-right">
                  {formatLabel(value)}
                </span>
              </div>

              <div className="text-xs text-gray-600 w-32 text-right flex-shrink-0">
                {unitText(player)}
              </div>

              <div className="ml-2 w-5 flex-shrink-0">
                <img
                  src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_prefer_inactive.svg"
                  alt="lock"
                  className="w-5 h-5"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Main component with performance optimizations
const PlayerCategories = ({ players, fixture_info }) => {
  // Make sure we have valid fixture_info
  const safeFixtureInfo = {
    home: fixture_info?.home || "HOME",
    away: fixture_info?.away || "AWAY",
  };

  // Memoize the sections configuration to avoid recreating on each render
  const sections = useMemo(
    () => [
      {
        title: "Total Fantasy Points",
        description:
          "Top players on the basis of fantasy points earned in the 5 matches played by the team",
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
          "Top players on the basis of fantasy points earned in the last 5 matches",
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
        description: `Top ${safeFixtureInfo.home} players based on team rank over the last 5 matches`,
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
        description: `Top ${safeFixtureInfo.away} players based on team rank over the last 5 matches`,
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
        description: "Top performers by position in the team's last 5 matches",
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
        description:
          "Players who performed below their potential in the last 5 matches",
        metric: "fantasy_pts",
        sortOrder: "desc",
        filterFn: (player) => {
          const threshold = (() => {
            const sorted = [...players].sort(
              (a, b) => a.fantasy_pts - b.fantasy_pts
            );
            const thresholdIndex = Math.ceil(players.length * 0.2) - 1;
            return (
              sorted[thresholdIndex >= 0 ? thresholdIndex : 0]?.fantasy_pts || 0
            );
          })();
          return player.fantasy_pts <= threshold;
        },
        formatLabel: (val) => val.toFixed(0),
        unitText: (player) =>
          `${player.fantasy_pts} Pts in ${player.match_count} match${
            player.match_count > 1 ? "es" : ""
          }`,
      },
      {
        title: "Players with X Factor",
        description:
          "Players who can win the match single handedly on their day",
        metric: "value",
        filterFn: (player) => {
          // Debug log to verify x_factor values in console
          return player.x_factor && player.x_factor.trim().length > 0;
        },
        formatLabel: (val) => val.toFixed(2),
        unitText: (player) => player.x_factor || "",
      },
    ],
    [players, safeFixtureInfo]
  );

  return (
    <div className="container mx-auto p-4 space-y-8">
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

function Last5Match({ data }) {
  const { fixture_info, players } = data;
  const tabs = [
    "Based on Overall Performance",
    `${fixture_info.home} Bat First`,
    `${fixture_info.away} Bat First`,
  ];

  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [apiDataCache, setApiDataCache] = useState({}); // Cache for API responses
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_CONFIG = {
    baseUrl: "https://plapi.perfectlineup.in/fantasy/stats/get_player_analysis",
    headers: {
      sessionkey: "3cd0fb996816c37121c765f292dd3f78",
      moduleaccess: "7",
      "Content-Type": "application/json",
    },
    defaultPayload: {
      season_game_uid: fixture_info.season_game_uid,
      website_id: 1,
      sports_id: "7",
      type: "last_five",
    },
  };

  const fetchData = useCallback(
    async (firstBatUid) => {
      // Check if we already have data for this UID
      if (apiDataCache[firstBatUid]) {
        return; // Data already exists, no need to fetch
      }

      setLoading(true);
      try {
        const response = await axios.post(
          API_CONFIG.baseUrl,
          { ...API_CONFIG.defaultPayload, first_bat_uid: firstBatUid },
          { headers: API_CONFIG.headers }
        );

        // Store the response in cache
        setApiDataCache((prev) => ({
          ...prev,
          [firstBatUid]: response.data.data,
        }));
      } catch (err) {
        setError(err.message || "An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    },
    [fixture_info.season_game_uid, apiDataCache]
  );

  useEffect(() => {
    if (activeTab === tabs[0]) {
      return; // No API call needed for first tab
    }

    const firstBatUid =
      activeTab === tabs[1] ? fixture_info.home_uid : fixture_info.away_uid;

    // Only fetch if we don't have the data yet
    if (!apiDataCache[firstBatUid]) {
      fetchData(firstBatUid);
    }
  }, [
    activeTab,
    fetchData,
    fixture_info.home_uid,
    fixture_info.away_uid,
    tabs,
    apiDataCache,
  ]);

  const renderContent = () => {
    if (loading)
      return <div className="text-center text-gray-600">Loading...</div>;
    if (error)
      return <div className="text-red-500 text-center">Error: {error}</div>;

    const getPlayerData = () => {
      if (activeTab === tabs[0]) {
        return { players, fixture_info };
      }

      const firstBatUid =
        activeTab === tabs[1] ? fixture_info.home_uid : fixture_info.away_uid;

      const apiData = apiDataCache[firstBatUid];
      if (!apiData) return null;

      return { players: apiData.players, fixture_info: apiData.fixture_info };
    };

    const playerData = getPlayerData();
    if (!playerData)
      return <div className="text-center text-gray-600">No data available</div>;

    return <PlayerCategories {...playerData} />;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col items-center w-full max-w-screen-lg mx-auto p-4 -mt-2">
        <span>
          Please select a possible outcome of the toss to see top performers
          according to different scenarios
        </span>
      </div>

      <div className="flex items-center bg-gray-100 p-1 rounded-full">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 text-center px-4 py-2 text-sm font-medium focus:outline-none 
                transition-colors duration-200 ${
                  activeTab === tab
                    ? "bg-white text-gray-900 shadow rounded-full"
                    : "bg-transparent text-gray-500"
                }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="results">{renderContent()}</div>
    </div>
  );
}

function LastMatch({ matchInSights }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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
            sports_id: "7", // Assuming sports_id is always 7
            first_bat_uid: "",
            type: "recent",
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
    <div className="w-full max-w-4xl mx-auto">
      {data && <Last5Match data={data} />}
    </div>
  );
}

function ThisSeries({ matchInSights }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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
            sports_id: "7", // Assuming sports_id is always 7
            first_bat_uid: "",
            type: "recent",
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
    <div className="w-full max-w-4xl mx-auto">
      {data && <Last5Match data={data} />}
    </div>
  );
}

function CheatSheet() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const matchInSights = location.state?.matchInSights;
  console.log(matchInSights);
  const matchFormat = formatMap[matchInSights.format] || "T10"; // fallback to T10
  const Tab = ["LAST MATCH", `LAST 5 ${matchFormat}`, "THIS SERIES"];
  const [activeTab, setActiveTab] = useState(Tab[1]);

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
            sports_id: "7", // Assuming sports_id is always 7
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
                data={data.fixture_info}
              />
            )}
          </div>

          <div className="flex flex-col items-center w-full max-w-screen-lg mx-auto p-4 -mt-2">
            <spen>
              Data shown is based on the same format played from the same team
            </spen>
          </div>

          <div className="player-specification-list w-full max-w-4xl mx-auto">
            <div className="tab-container mb-4  mt-4">
              {/* 
      flex items-center => sets up a flex container
      bg-gray-100 p-1 => a light gray background with padding
      rounded-full => rounded "pill" shape
    */}
              <div className="flex items-center bg-gray-100 p-1 rounded-full">
                {Tab.map((tab) => (
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

          {activeTab === `LAST 5 ${matchFormat}` && data && (
            <Last5Match data={data} />
          )}

          {activeTab === `LAST MATCH` && data && (
            <LastMatch matchInSights={matchInSights} />
          )}

          {activeTab === `THIS SERIES` && data && (
            <ThisSeries matchInSights={matchInSights} />
          )}
        </div>
      )}
    </>
  );
}

export default CheatSheet;
