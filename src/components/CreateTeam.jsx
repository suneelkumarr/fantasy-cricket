import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import axios from "axios";

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

const FixtureHeader = ({ matchInSights }) => {
  const navigate = useNavigate();

  // Parse toss_data only when it changes
  const tossText = useMemo(() => {
    if (matchInSights.toss_data && matchInSights.toss_data !== "[]") {
      try {
        const parsed = JSON.parse(matchInSights.toss_data);
        return parsed?.text || "";
      } catch (error) {
        console.error("Failed to parse toss_data JSON:", error);
      }
    }
    return "";
  }, [matchInSights.toss_data]);

  // Toggle text every second if conditions are met
  const [showLineup, setShowLineup] = useState(true);
  useEffect(() => {
    if (
      matchInSights.playing_announce === "1" &&
      matchInSights.toss_data !== "[]"
    ) {
      const interval = setInterval(() => setShowLineup((prev) => !prev), 1000);
      return () => clearInterval(interval);
    }
  }, [matchInSights.playing_announce, matchInSights.toss_data]);

  // Countdown state updated every second
  const [countdown, setCountdown] = useState(
    getCountdownTime(matchInSights.season_scheduled_date)
  );
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdownTime(matchInSights.season_scheduled_date));
    }, 1000);
    return () => clearInterval(timer);
  }, [matchInSights.season_scheduled_date]);

  // Determine the bubble text based on conditions
  const bubbleText = useMemo(() => {
    if (matchInSights.playing_announce !== "1")
      return "Playing 11 is not announced";
    if (matchInSights.toss_data === "[]") return "Lineup Out";
    return tossText ? (showLineup ? "Lineup Out" : tossText) : "Lineup Out";
  }, [
    matchInSights.playing_announce,
    matchInSights.toss_data,
    tossText,
    showLineup,
  ]);

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
            src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${matchInSights.home_flag}`}
            alt={matchInSights.home}
            className="w-6 h-6 rounded-full"
          />
          <span className="font-semibold text-base sm:text-lg text-gray-800">
            {matchInSights.home} vs {matchInSights.away}
          </span>
          <img
            src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${matchInSights.away_flag}`}
            alt={matchInSights.away}
            className="w-6 h-6 rounded-full"
          />
        </div>
      </div>
      <div className="text-center mt-1 text-red-500 font-semibold text-sm sm:text-base">
        {countdown}
      </div>
      <div className="flex justify-center mt-2">
        <div
          className="bg-white border border-gray-300 text-gray-600 px-3 py-1
                         rounded shadow text-sm text-center transition-all duration-1000 ease-in-out"
        >
          {bubbleText}
        </div>
      </div>
    </div>
  );
};

function CreateTeam() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preferredPlayers, setPreferredPlayers] = useState({});
  const [excludedMap, setExcludedMap] = useState({});
  const [lockedMap, setLockedMap] = useState({});
  const [selectedTab, setSelectedTab] = useState("All");

  const location = useLocation();
  const matchInSights = location.state?.matchInSights;
  const lineupLogic = location.state?.lineup_logic;
  const number_of_lineups = location.state?.number_of_lineups;
  const lmh_method = location.state?.lmh_method;
  const variation_code = location.state?.variation_code;
  const tier_picks = location.state?.tier_picks;
  const position_check = location.state?.position_check;
  const similar_team_flag = location.state?.similar_team_flag;
  const team_player = location.state?.team_player;
  const selected_cvc = location.state?.selected_cvc;
  // Memoized toggle functions with exclusivity
  // Toggle functions with mutual exclusivity
  const togglePreferred = useCallback((uid) => {
    setPreferredPlayers((prev) => {
      const isCurrentlyPreferred = prev[uid];
      const newPreferredMap = { ...prev, [uid]: !isCurrentlyPreferred };
      if (!isCurrentlyPreferred) {
        // Adding to Preferred
        setLockedMap((prevLock) => ({ ...prevLock, [uid]: false }));
        setExcludedMap((prevExcl) => ({ ...prevExcl, [uid]: false }));
      }
      return newPreferredMap;
    });
  }, []);

  const toggleLock = useCallback((uid) => {
    setLockedMap((prev) => {
      const isCurrentlyLocked = prev[uid];
      const newLockedMap = { ...prev, [uid]: !isCurrentlyLocked };
      if (!isCurrentlyLocked) {
        // Adding to Locked
        setPreferredPlayers((prevPref) => ({ ...prevPref, [uid]: false }));
        setExcludedMap((prevExcl) => ({ ...prevExcl, [uid]: false }));
      }
      return newLockedMap;
    });
  }, []);

  const toggleExclude = useCallback((uid) => {
    setExcludedMap((prev) => {
      const isCurrentlyExcluded = prev[uid];
      const newExcludedMap = { ...prev, [uid]: !isCurrentlyExcluded };
      if (!isCurrentlyExcluded) {
        // Adding to Excluded
        setPreferredPlayers((prevPref) => ({ ...prevPref, [uid]: false }));
        setLockedMap((prevLock) => ({ ...prevLock, [uid]: false }));
      }
      return newExcludedMap;
    });
  }, []);

  // Extract active IDs
  const getActiveIds = (map) => Object.keys(map).filter((uid) => map[uid]);

  const preferredPlayerIds = useMemo(
    () => getActiveIds(preferredPlayers),
    [preferredPlayers]
  );
  const lockedPlayerIds = useMemo(() => getActiveIds(lockedMap), [lockedMap]);
  const excludedPlayerIds = useMemo(
    () => getActiveIds(excludedMap),
    [excludedMap]
  );

  // Fetch player data
  useEffect(() => {
    if (!matchInSights || !lineupLogic) {
      setError("Match information or lineup logic is missing.");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.post(
          "https://plapi.perfectlineup.in/fantasy/stats/get_fixture_players",
          {
            season_game_uid: matchInSights?.season_game_uid,
            lineup_logic: lineupLogic,
            sports_id: "7",
            website_id: "1",
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
  }, [matchInSights, lineupLogic]);

  // Save player states with debouncing
  const savePlayerStates = useCallback(() => {
    if (!matchInSights) return;

    const payload = {
      season_game_uid: matchInSights.season_game_uid,
      website_id: 1,
      sports_id: "7",
      league_id: matchInSights.league_id,
      locked_players: lockedPlayerIds,
      preferred_players: preferredPlayerIds,
      excluded_players: excludedPlayerIds,
    };

    axios
      .post(
        "https://plapi.perfectlineup.in/fantasy/stats/save_lock_execlude",
        payload,
        {
          headers: {
            sessionkey: "3cd0fb996816c37121c765f292dd3f78",
            moduleaccess: "7",
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        console.log("Preferred/excluded/locked updated:", response.data);
      })
      .catch((err) => {
        console.error("Error updating preferred/excluded/locked players:", err);
      });
  }, [matchInSights, lockedPlayerIds, preferredPlayerIds, excludedPlayerIds]);

  useEffect(() => {
    const timer = setTimeout(() => {
      savePlayerStates();
    }, 500); // 500ms debounce

    return () => clearTimeout(timer); // Cleanup to cancel previous timer
  }, [savePlayerStates]);

  // Memoized parsing of selected_player
  const { pData, lData, eData } = useMemo(() => {
    if (!data || !data.selected_player) {
      return { pData: [], lData: [], eData: [] };
    }
    try {
      const parsed = JSON.parse(data.selected_player);
      return {
        pData: parsed.p?.map(String) ?? [],
        lData: parsed.l?.map(String) ?? [],
        eData: parsed.e?.map(String) ?? [],
      };
    } catch (error) {
      console.error("Error parsing selected_player:", error);
      return { pData: [], lData: [], eData: [] };
    }
  }, [data]);

  // Memoized combined sets
  const { combinedPreferredSet, combinedLockedSet, combinedExcludedSet } =
    useMemo(() => {
      const preferredSet = new Set([
        ...pData,
        ...getActiveIds(preferredPlayers),
      ]);
      const lockedSet = new Set([...lData, ...getActiveIds(lockedMap)]);
      const excludedSet = new Set([...eData, ...getActiveIds(excludedMap)]);
      return {
        combinedPreferredSet: preferredSet,
        combinedLockedSet: lockedSet,
        combinedExcludedSet: excludedSet,
      };
    }, [pData, lData, eData, preferredPlayers, lockedMap, excludedMap]);

  // Memoized tab counts
  const { preferredCount, lockedCount, excludedCount } = useMemo(() => {
    let preferred = 0;
    let locked = 0;
    let excluded = 0;

    (data?.players || []).forEach((player) => {
      const uid = String(player.player_uid);
      const isPreferred = combinedPreferredSet.has(uid);
      const isLocked = combinedLockedSet.has(uid);
      const isExcluded = combinedExcludedSet.has(uid);

      if (isPreferred && !isLocked && !isExcluded) preferred++;
      if (isLocked && !isPreferred && !isExcluded) locked++;
      if (isExcluded && !isPreferred && !isLocked) excluded++;
    });

    return {
      preferredCount: preferred,
      lockedCount: locked,
      excludedCount: excluded,
    };
  }, [
    data?.players,
    combinedPreferredSet,
    combinedLockedSet,
    combinedExcludedSet,
  ]);

  // Memoized filtered players
  const filteredPlayers = useMemo(() => {
    return (data?.players || [])
      .sort((a, b) => b.selected_percentage - a.selected_percentage)
      .filter((player) => {
        const uid = String(player.player_uid);
        const isPreferred = combinedPreferredSet.has(uid);
        const isLocked = combinedLockedSet.has(uid);
        const isExcluded = combinedExcludedSet.has(uid);

        if (selectedTab === "Preferred")
          return isPreferred && !isLocked && !isExcluded;
        if (selectedTab === "Locked")
          return isLocked && !isPreferred && !isExcluded;
        if (selectedTab === "Excluded")
          return isExcluded && !isPreferred && !isLocked;
        if (selectedTab === "All") return !isExcluded;
        return false;
      });
  }, [
    data?.players,
    selectedTab,
    combinedPreferredSet,
    combinedLockedSet,
    combinedExcludedSet,
  ]);

  // Tabs definition
  const tabs = [
    { name: "All", count: null },
    { name: "Preferred", count: preferredCount },
    { name: "Locked", count: lockedCount },
    { name: "Excluded", count: excludedCount },
  ];

  // Early returns for loading, error, or missing data
  if (loading)
    return <div className="text-center text-gray-600">Loading...</div>;
  if (error)
    return <div className="text-red-500 text-center">Error: {error}</div>;
  if (!matchInSights) return null;
  if (!data)
    return <div className="text-center text-gray-600">No data available.</div>;

   const prefererdPlayer = [...combinedPreferredSet]; 
   const lockedPlayer = [...combinedLockedSet]; 
   const excludedPlayer = [...combinedExcludedSet]; 

  // Render
  return (
    <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 bg-white">
      <header className="w-full">
        <FixtureHeader matchInSights={matchInSights} />
      </header>

      <div className="border-b border-gray-200 pb-4 mt-4">
        <div className="flex items-center">
          <span className="text-blue-600 font-bold mr-2">7.</span>
          <h2 className="text-lg font-semibold">Player Selection</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Lock or exclude players to generate your own personalised teams
        </p>
      </div>

      {/* Tab Header */}
      <div className="createteam-tab-header-container flex space-x-4 mb-4">
        {tabs.map((tab) => (
          <div
            key={tab.name}
            className={`tab-item cursor-pointer ${
              selectedTab === tab.name ? "selected" : ""
            }`}
            onClick={() => setSelectedTab(tab.name)}
          >
            <span className={selectedTab === tab.name ? "selected" : ""}>
              {tab.name}
              {tab.count !== null && <span> ({tab.count})</span>}
            </span>
          </div>
        ))}
      </div>

      {/* Player List Header */}
      <div className="player-header-container grid grid-cols-12 items-center px-2 py-3 rounded border-b bg-gray-100">
        <div className="col-span-6">
          <div className="ct-player-item-large">Player</div>
        </div>
        <div className="col-span-3 text-center">
          <div className="ct-player-item-medium">
            Rating <i className="icon-arrow-down"></i>
          </div>
        </div>
        <div className="col-span-1 text-center">
          <div className="ct-player-item-salary">₹</div>
        </div>
        <div className="col-span-2 text-center">
          <div className="ct-player-item-actions">Actions</div>
        </div>
      </div>

      {/* Player List */}
      {filteredPlayers.map((p) => {
        const uid = String(p.player_uid);
        const isPreferred = combinedPreferredSet.has(uid);
        const isLocked = combinedLockedSet.has(uid);
        const isExcluded = combinedExcludedSet.has(uid);

        return (
          <div
            key={p.player_uid}
            className="grid grid-cols-1 md:grid-cols-12 items-center px-2 py-3 rounded hover:bg-gray-50 border-b"
          >
            <div className="col-span-6 flex items-center gap-3 mb-2 md:mb-0">
              <div
                className={`w-1 h-10 rounded-sm ${
                  p.team_abbr === matchInSights?.home_abbr
                    ? "bg-blue-500"
                    : "bg-red-500"
                }`}
              />
              <img
                src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/${p.jersey}`}
                alt="jersey"
                className="w-8 h-8 object-contain"
                onError={(e) => (e.target.src = "/fallback-jersey.png")}
              />
              <div>
                <div className="font-medium text-sm">{p.nick_name}</div>
                <div className="text-xs text-gray-500">
                  {p.child_position} • {p.team_abbr}
                </div>
              </div>
            </div>

            <div className="col-span-3 text-center text-sm font-semibold text-gray-700 mb-2 md:mb-0">
              {parseFloat(p.selected_percentage).toFixed(2)}%
            </div>

            <div className="col-span-1 text-center text-sm font-medium mb-2 md:mb-0">
              {p.salary}
            </div>

            <div className="col-span-2 flex justify-end gap-2">
              <img
                src={
                  isPreferred
                    ? "https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_prefer.svg"
                    : "https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_prefer_inactive.svg"
                }
                alt="favorite toggle"
                className="w-5 h-5 cursor-pointer hover:opacity-75"
                onClick={() => togglePreferred(p.player_uid)}
              />
              <i
                className={`cursor-pointer text-xl ${
                  isLocked ? "text-red-500" : "text-gray-500"
                }`}
                onClick={() => toggleLock(p.player_uid)}
              >
                {isLocked ? "🔒" : "🔓"}
              </i>
              <i
                className={`text-xl cursor-pointer ${
                  isExcluded ? "text-red-500" : "text-gray-500"
                }`}
                onClick={() => toggleExclude(p.player_uid)}
              >
                ✖️
              </i>
            </div>
          </div>
        );
      })}

      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4 z-10 flex w-full max-w-xl">
        <Link
          to={`/create-team-chart/Cricket/${matchInSights.season_game_uid}/${matchInSights.home}_vs_${matchInSights.away}/${matchInSights.league_id}`}
          state={{
            matchInSights,
            lineup_logic: lineupLogic,
            number_of_lineups: number_of_lineups,
            lmh_method: lmh_method,
            variation_code: variation_code,
            tier_picks: tier_picks,
            position_check: position_check,
            team_player: team_player,
            similar_team_flag: similar_team_flag,
            preferred_players:prefererdPlayer,
            locked_players: lockedPlayer,
            excluded_players: excludedPlayer,
            selected_cvc: selected_cvc
          }}
          className="bg-[#212341] text-white px-4 py-2 rounded font-semibold w-full max-w-full sm:max-w-screen-lg mx-auto justify-center flex items-center"
        >
          Generate {number_of_lineups} Teams
        </Link>
      </div>
    </main>
  );
}

export default CreateTeam;
