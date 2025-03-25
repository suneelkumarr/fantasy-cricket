import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import axios from "axios";

// Countdown function with IST offset (5 hours 30 minutes)
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

/**
 * Sample data to render each selection box.
 * iconClass can be replaced with your actual icon classes or inline SVG.
 * iconUrl can be used for image-based icons.
 */
const selectionOptions = [
  {
    id: 1,
    label: "Selection Percentage",
    tooltip:
      "Select players based on how many times they are being picked in lineups made on popular fantasy platforms",
    iconClass: "icon-offers", // or dreplace with a real icon
    active: false,
    lineup_logic: 4,
  },
  {
    id: 2,
    label: "Perfect Lineup Prediction",
    tooltip:
      "Generate lineups on the basis of our analysis of various fantasy cricket data points",
    iconClass: "icon-PLPredictions", // or replace with a real icon
    active: true, // example default active
    lineup_logic: 5,
  },
  {
    id: 3,
    label: "Recent Performances",
    tooltip:
      "Select players on the basis of their performances in the last 5 matches.",
    iconClass: "icon-Recent-per", // or replace with a real icon
    active: true, // example default active
    lineup_logic: 1,
  },
  {
    id: 4,
    label: "Your Custom List",
    tooltip: "Generate lineups on the basis of player ordering list",
    iconUrl:
      "https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_custom_order.svg",
    active: true, // example default active
    lineup_logic: 2,
  },
];

const PlayerList = ({ players }) => {
  const filledMarkImage =
    "https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/filled_mark.svg";

  const [selectedPlayerUids, setSelectedPlayerUids] = useState([]);

  // Select all by default
  useEffect(() => {
    if (players?.length) {
      const allUids = players.map((p) => p.player_uid);
      setSelectedPlayerUids(allUids);
    }
  }, [players]);

  const toggleSelection = (uid) => {
    setSelectedPlayerUids((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  return (
    <div className="w-full px-4 py-4">
      <div
        className={`grid gap-4 justify-center`}
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(100px, 1fr))`,
        }}
      >
        {players.map((player) => {
          const isSelected = selectedPlayerUids.includes(player.player_uid);

          return (
            <div
              key={player.player_uid}
              className="flex flex-col items-center cursor-pointer"
              onClick={() => toggleSelection(player.player_uid)}
            >
              {/* Jersey + Badge */}
              <div className="relative mb-2 w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] rounded-full border-2 border-gray-300 flex items-center justify-center bg-white overflow-hidden">
                <img
                  src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/${player.jersey}`}
                  alt={player.nick_name}
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
                />
                <div className="absolute top-0 right-0 rounded-full w-7 h-7 border-2 border-white flex items-center justify-center bg-white">
                  {isSelected ? (
                    <img
                      src={filledMarkImage}
                      alt="Selected"
                      className="w-4 h-4"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-400" />
                  )}
                </div>
              </div>

              {/* Player Name */}
              <div className="text-xs sm:text-sm font-bold text-center whitespace-nowrap">
                {player.nick_name}
              </div>

              {/* Team | Role */}
              <div className="text-xs text-gray-500 text-center whitespace-nowrap">
                {`${player.team_abbr} | ${player.position}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TierModal = ({ title, subtitle, players, onClose }) => (
  <div className="modal-content">
    <div className="modal-header">
      <div className="modal-title">{title}</div>
      <div className="modal-subtitle">{subtitle}</div>
      <a className="modal-close" onClick={onClose}>
        <i className="icon-close"></i>
      </a>
    </div>

    <div className="player-list">
      {players.map((p, i) => (
        <div className="player-item-container" key={p.player_uid}>
          <div className={p.team_abbr === "DEL" ? "home-bg" : "away-bg"}></div>
          <div className="ct-player-item-large">
            <div className="logo-mask">
              <span>{i + 1}</span>
              <img
                src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/${p.jersey}`}
              />
            </div>
            <div className="player-data">
              <div className="player-name">{p.nick_name}</div>
              <div className="player-pos">
                <span>{p.child_position}</span> <div className="dot"></div>{" "}
                <span>{p.team_abbr}</span>
              </div>
            </div>
          </div>
          <div className="player-item-medium-new">
            <div className="projected-pts-view bgTransparent">
              {parseFloat(p.selected_percentage).toFixed(2)}%
            </div>
          </div>
          <div className="player-item-salary-box">{p.salary}</div>
        </div>
      ))}
    </div>
  </div>
);

const TierBasedTeamFormation = () => {
  // State declarations
  const [selected, setSelected] = useState("default");
  const [tierData, setTierData] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [fixtureInfo, setFixtureInfo] = useState(null);
  const [preferredPlayers, setPreferredPlayers] = useState({});
  const [excludedMap, setExcludedMap] = useState({});
  const [lockedMap, setLockedMap] = useState({});
  const [showModalCount, setShowModalCount] = useState(false);
  const [min, setMin] = useState("-");
  const [max, setMax] = useState("-");

  const options = ["-", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

  // Toggle handlers
  const toggleLock = (uid) => setLockedMap(prev => ({ ...prev, [uid]: !prev[uid] }));
  const toggleExclude = (uid) => setExcludedMap(prev => ({ ...prev, [uid]: !prev[uid] }));
  const togglePreferred = (playerUid) => setPreferredPlayers(prev => ({ ...prev, [playerUid]: !prev[playerUid] }));

  // API call to fetch players
  const handleChooseOwn = async () => {
    setSelected("custom");
    try {
      const response = await axios.post(
        "https://plapi.perfectlineup.in/fantasy/stats/get_fixture_players",
        {
          season_game_uid: "87703",
          website_id: "1",
          sports_id: "7",
        },
        {
          headers: {
            sessionkey: "3cd0fb996816c37121c765f292dd3f78",
            moduleaccess: "7",
            "Content-Type": "application/json",
          },
        }
      );

      const players = response.data.data.players || [];
      setAllPlayers(players);
      setFixtureInfo(response.data.data.fixture_info);

      const categorizePlayers = () => {
        const getSortedPlayers = (players, condition) => 
          players.filter(condition).sort((a, b) => 
            parseFloat(b.selected_percentage) - parseFloat(a.selected_percentage)
          );

        return [
          { name: "Top Tier", key: "top", players: getSortedPlayers(players, p => parseFloat(p.selected_percentage) >= 66.66).length },
          { name: "Middle Tier", key: "middle", players: getSortedPlayers(players, p => parseFloat(p.selected_percentage) >= 33.33 && parseFloat(p.selected_percentage) < 66.66).length },
          { name: "Lower Tier", key: "lower", players: getSortedPlayers(players, p => parseFloat(p.selected_percentage) < 33.33).length },
        ];
      };

      setTierData(categorizePlayers());
    } catch (error) {
      console.error("API call failed", error);
    }
  };

  // Player filtering by tier
  const getPlayersByTier = useMemo(() => (tierKey) => {
    const sortPlayers = (players) => 
      players.sort((a, b) => parseFloat(b.selected_percentage) - parseFloat(a.selected_percentage));
    
    const filters = {
      top: p => parseFloat(p.selected_percentage) >= 66.66,
      middle: p => parseFloat(p.selected_percentage) >= 33.33 && parseFloat(p.selected_percentage) < 66.66,
      lower: p => parseFloat(p.selected_percentage) < 33.33
    };
    
    return sortPlayers(allPlayers.filter(filters[tierKey] || (() => false)));
  }, [allPlayers]);

  // Memoized player ID arrays
  const getPlayerIds = (map) => Object.keys(map).filter(uid => map[uid]);
  const preferredPlayerIds = useMemo(() => getPlayerIds(preferredPlayers), [preferredPlayers]);
  const lockedPlayerIds = useMemo(() => getPlayerIds(lockedMap), [lockedMap]);
  const excludedPlayerIds = useMemo(() => getPlayerIds(excludedMap), [excludedMap]);

  // Sync preferred players with API
  useEffect(() => {
    if (!preferredPlayerIds.length || !fixtureInfo) return;

    const payload = {
      season_game_uid: fixtureInfo.season_game_uid,
      website_id: 1,
      sports_id: "7",
      league_id: fixtureInfo.league_id,
      locked_players: lockedPlayerIds,
      preferred_players: preferredPlayerIds,
      excluded_players: excludedPlayerIds,
    };

    const savePreferredPlayers = async () => {
      try {
        const response = await axios.post(
          "https://plapi.perfectlineup.in/fantasy/stats/save_lock_execlude",
          payload,
          {
            headers: {
              sessionkey: "3cd0fb996816c37121c765f292dd3f78",
              moduleaccess: "7",
              "Content-Type": "application/json",
            },
          }
        );
        console.log("Preferred players updated:", response.data);
      } catch (err) {
        console.error("Error updating preferred players:", err);
      }
    };

    savePreferredPlayers();
  }, [preferredPlayerIds, lockedPlayerIds, excludedPlayerIds, fixtureInfo]);

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6">
        4. Tier Based Team Formation
      </h2>

      {/* Option Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {[
          { value: "default", label: "Pick Top Player", subtext: "Default" },
          { value: "custom", label: "Choose Your Own", onClick: handleChooseOwn }
        ].map(({ value, label, subtext, onClick }) => (
          <div
            key={value}
            onClick={onClick || (() => setSelected(value))}
            className={`cursor-pointer border rounded-lg p-4 text-center transition-all duration-200 ${
              selected === value ? "border-blue-800 shadow-lg" : "border-gray-300 hover:border-blue-500"
            }`}
          >
            <p className="font-semibold text-blue-900 text-lg">{label}</p>
            {subtext && <p className="text-sm text-gray-600">{subtext}</p>}
          </div>
        ))}
      </div>

      {/* Instruction */}
      {selected === "custom" && (
        <div className="bg-gray-100 p-4 rounded-lg mb-6 text-sm text-gray-700">
          Pick the number of players you want from each tier based on selection percentage
        </div>
      )}

      {/* Tier List */}
      {selected === "custom" && tierData.length > 0 && (
        <div className="space-y-2">
          <div className="hidden md:grid grid-cols-12 text-sm font-semibold text-gray-500 px-2 mb-2">
            <span className="col-span-4">Tier</span>
            <span className="col-span-4 text-center">No. of Players</span>
            <span className="col-span-4 text-right">In Every Lineup</span>
          </div>
          {tierData.map((tier) => (
            <div
              key={tier.key}
              className="grid grid-cols-1 md:grid-cols-12 items-center border-b py-3 px-2 hover:bg-gray-50 transition-colors"
            >
              <div className="col-span-4 text-gray-800 font-medium md:mb-0 mb-2">{tier.name}</div>
              <div
                onClick={() => { setSelectedTier(tier.key); setShowModal(true); }}
                className="col-span-4 text-center text-gray-600 font-semibold cursor-pointer md:mb-0 mb-2"
              >
                {tier.players} Players
              </div>
              <div
                onClick={() => { setSelectedTier(tier.key); setShowModalCount(true); }}
                className="col-span-4 flex justify-end items-center cursor-pointer"
              >
                <div className="border px-3 py-1 rounded-md flex items-center gap-2">
                  <span className="text-gray-500">--</span>
                  <img
                    src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_up_down_arrow.svg"
                    alt="toggle"
                    className="w-4 h-4"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Players Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <div className="flex-1 text-center">
                <h3 className="text-xl font-semibold">
                  Players in {selectedTier?.charAt(0).toUpperCase() + selectedTier?.slice(1)} Tier
                </h3>
                <p className="text-sm text-gray-500">
                  {fixtureInfo?.home_abbr} vs {fixtureInfo?.away_abbr}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-red-500 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="hidden md:grid grid-cols-12 items-center px-2 text-xs text-gray-500 font-medium border-b pb-2">
                <div className="col-span-6">Player</div>
                <div className="col-span-3 text-center">Sel By</div>
                <div className="col-span-1 text-center">₹</div>
                <div className="col-span-2 text-right"></div>
              </div>

              {getPlayersByTier(selectedTier).map((p) => (
                <div
                  key={p.player_uid}
                  className="grid grid-cols-1 md:grid-cols-12 items-center px-2 py-3 rounded hover:bg-gray-50 border-b"
                >
                  <div className="col-span-6 flex items-center gap-3 mb-2 md:mb-0">
                    <div
                      className={`w-1 h-10 rounded-sm ${
                        p.team_abbr === fixtureInfo?.home_abbr ? "bg-blue-500" : "bg-red-500"
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
                        preferredPlayers[p.player_uid]
                          ? "https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_prefer.svg"
                          : "https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_prefer_inactive.svg"
                      }
                      alt="favorite toggle"
                      className="w-5 h-5 cursor-pointer hover:opacity-75"
                      onClick={() => togglePreferred(p.player_uid)}
                    />
                    <i
                      className={`cursor-pointer text-xl ${lockedMap[p.player_uid] ? "text-red-500" : "text-gray-500"}`}
                      onClick={() => toggleLock(p.player_uid)}
                    >
                      {lockedMap[p.player_uid] ? "🔒" : "🔓"}
                    </i>
                    <i
                      className={`text-xl cursor-pointer ${excludedMap[p.player_uid] ? "text-red-500" : "text-gray-500"}`}
                      onClick={() => toggleExclude(p.player_uid)}
                    >
                      ✖️
                    </i>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Range Selection Modal */}
      {showModalCount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <div className="flex-1 text-center">
                <h3 className="text-xl font-semibold">Pick Range From Tier</h3>
                <p className="text-sm text-gray-500">
                  {fixtureInfo?.home_abbr} vs {fixtureInfo?.away_abbr}
                </p>
              </div>
              <button
                onClick={() => setShowModalCount(false)}
                className="text-gray-500 hover:text-red-500 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-8 bg-gray-50 p-4 justify-center">
              {["MIN", "MAX"].map((label, idx) => (
                <div key={label} className="w-24 flex flex-col items-center">
                  <h2 className="text-gray-500 font-bold uppercase mb-4">{label}</h2>
                  <div className="flex flex-col space-y-2 w-full max-h-64 overflow-y-auto">
                    {options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`px-4 py-2 text-black rounded w-full transition-colors ${
                          (label === "MIN" ? min : max) === option ? "bg-blue-100 text-blue-800" : "hover:bg-gray-100"
                        }`}
                        onClick={() => (label === "MIN" ? setMin(option) : setMax(option))}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CreateTeamSetting = () => {
  const [data, setData] = useState(null);
  const [sportData, setSportData] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [loadingCount, setLoadingCount] = useState(0);
  const [error, setError] = useState(null);

  const [activeIndex, setActiveIndex] = useState(4);
  const [teamsCount, setTeamsCount] = useState(0);
  const [distribution, setDistribution] = useState(1);
  const [cvcPool, setCvcPool] = useState(3);
  useEffect(() => {
    if (distribution === 1) {
      setCvcPool(3); // force 'High' when 'Equal' is selected
    }
  }, [distribution]);

  const location = useLocation();
  const matchInSights = location.state?.matchInSights;
  const playerInfo = location.state?.playerData;
  const settingData = location.state?.setting;

  const seasonGameUid = useMemo(
    () => matchInSights?.season_game_uid || matchInSights?.es_season_game_uid,
    [matchInSights]
  );

  useEffect(() => {
    if (settingData) {
      setTeamsCount(settingData.teamsCount);
      setActiveIndex(settingData.activeIndex);
      setDistribution(settingData.distribution);
      setCvcPool(settingData.cvcPool);
    }
  }, [settingData]);

  const setting = {
    teamsCount: teamsCount,
    seasonGameUid: seasonGameUid,
    excluded_players: [],
    activeIndex: activeIndex,
    fetch_excluded: 1,
    distribution: distribution,
    cvcPool: cvcPool,
  };

  const getCurrentTimestampInIST = () => Date.now() + 5.5 * 3600000;

  const incrementLoading = () => setLoadingCount((prev) => prev + 1);
  const decrementLoading = () =>
    setLoadingCount((prev) => Math.max(prev - 1, 0));

  const fetchMatchData = useCallback(async () => {
    if (!seasonGameUid) return;
    incrementLoading();
    try {
      const res = await axios.get(
        `https://plineup-prod.blr1.digitaloceanspaces.com/appstatic/plprod_match_7_${seasonGameUid}.json?${getCurrentTimestampInIST()}`
      );
      setData(res.data);
    } catch (err) {
      setError(err.message || "Error fetching match data.");
    } finally {
      decrementLoading();
    }
  }, [seasonGameUid]);

  const fetchSportData = useCallback(async () => {
    incrementLoading();
    try {
      const res = await axios.get(
        `https://plineup-prod.blr1.digitaloceanspaces.com/appstatic/plprod_sport_master_data_7.json`
      );
      setSportData(res.data);
    } catch (err) {
      setError(err.message || "Error fetching sport master data.");
    } finally {
      decrementLoading();
    }
  }, []);

  const fetchCvcData = useCallback(async () => {
    if (!teamsCount || !seasonGameUid) return;

    incrementLoading();
    try {
      const res = await axios.post(
        "https://plapi.perfectlineup.in/fantasy/lineup_generator/cvc_allocations",
        {
          number_of_lineups: teamsCount,
          season_game_uid: seasonGameUid,
          excluded_players: [],
          lineup_logic: activeIndex,
          fetch_excluded: 1,
          lmh_method: distribution,
          variation_code: cvcPool,
        },
        {
          headers: {
            sessionkey: "3cd0fb996816c37121c765f292dd3f78",
            moduleaccess: "7",
            "Content-Type": "application/json",
          },
        }
      );
      setPlayerData(res.data.data);
    } catch (err) {
      setError(err.message || "Error fetching CVC allocations.");
    } finally {
      decrementLoading();
    }
  }, [teamsCount, seasonGameUid, activeIndex, distribution, cvcPool]);

  useEffect(() => {
    fetchMatchData();
    fetchSportData();
  }, [fetchMatchData, fetchSportData]);

  useEffect(() => {
    fetchCvcData();
  }, [fetchCvcData]);

  const tooltip = useMemo(
    () => sportData?.cvc_settings?.tooltip_msg?.[distribution]?.[cvcPool] || "",
    [sportData, distribution, cvcPool]
  );

  const distributionData = useMemo(() => sportData?.cvc_settings, [sportData]);

  if (!matchInSights) {
    return (
      <div className="text-center text-gray-600">No match data provided.</div>
    );
  }

  if (loadingCount > 0) {
    return <div className="text-center text-gray-600">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">Error: {error}</div>;
  }

  if (!data || !sportData) {
    return <div className="text-center text-gray-600">No data available.</div>;
  }

  return (
    <main className="flex-grow container mx-auto px-4 sm:px-6 py-6">
      <header className="w-full">
        <FixtureHeader matchInSights={matchInSights} />
      </header>

      <section className="bg-white text-gray-800 mt-2">
        <div className="w-full max-w-5xl mx-auto">
          {/* Step 1: Team logic options */}
          <div className="mb-6 flex items-center space-x-2 text-base sm:text-lg font-semibold text-gray-800 mr-100">
            <span className="text-indigo-600">1.</span>
            <span>Create teams on the basis of</span>
          </div>
          {/* Selection Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {selectionOptions.map((option) => (
              <div
                key={option.lineup_logic}
                onClick={() => setActiveIndex(option.lineup_logic)}
                className={`flex flex-col items-center justify-center rounded-md border cursor-pointer p-4 transition-colors text-center
                ${
                  activeIndex === option.lineup_logic
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "border-gray-200 hover:border-indigo-300"
                }`}
                title={option.tooltip}
              >
                <span className="text-sm font-medium">{option.label}</span>
              </div>
            ))}
          </div>

          {/* Step 2: Number of teams */}
          <div className="mt-10">
            <h2 className="text-base sm:text-lg font-semibold">
              2. NUMBER OF TEAMS
            </h2>
            <p className="text-sm sm:text-base text-gray-500">
              Select the number of lineups you would like to generate
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
              <input
                type="range"
                min="0"
                max="20"
                value={teamsCount}
                onChange={(e) => setTeamsCount(Number(e.target.value))}
                className="w-full sm:flex-1 accent-indigo-600"
              />
              <span className="text-sm font-medium text-gray-700">
                {teamsCount}
              </span>
            </div>
          </div>

          {/* Step 3: CVC Settings */}
          <div className="mt-10 border rounded-lg p-4">
            <div className="font-semibold text-gray-800 mb-1">
              3. C & VC SETTINGS
            </div>
            <div className="text-sm text-gray-600 mb-4">
              What's your strategy?
            </div>

            {/* Headers */}
            <div className="flex flex-row justify-between mb-3 font-medium text-gray-700 text-sm">
              <span>Distribution</span>
              <span className="pr-2">C/VC Pool</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              {/* Distribution Options */}
              <div className="flex-1 border rounded-md overflow-hidden">
                {distributionData?.distribution?.options.map((opt) => (
                  <div
                    key={opt.key_value}
                    className={`p-3 text-center cursor-pointer text-sm font-medium ${
                      Number(distribution) === Number(opt.key_value)
                        ? "bg-gray-200"
                        : "bg-gray-100"
                    }`}
                    onClick={() => setDistribution(opt.key_value)}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>

              {/* CVC Pool Options */}
              <div className="flex-1 border rounded-md p-3">
                {distributionData?.cvc_pool?.options.map((opt) => (
                  <div
                    key={opt.key_value}
                    className={`flex items-center mb-2 cursor-pointer text-sm ${
                      Number(cvcPool) === Number(opt.key_value)
                        ? "font-semibold text-gray-800"
                        : "text-gray-600"
                    }`}
                    onClick={() => setCvcPool(opt.key_value)}
                  >
                    <div className="w-5 h-5 border-2 border-gray-400 rounded-full mr-2 flex items-center justify-center">
                      {Number(cvcPool) === Number(opt.key_value) && (
                        <div className="w-3 h-3 bg-gray-800 rounded-full" />
                      )}
                    </div>
                    <span>{opt.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tooltip / Info Text */}
            {tooltip && (
              <div className="mt-4 text-sm text-center text-gray-600 italic bg-gray-100 p-2 rounded-md">
                {tooltip}
              </div>
            )}
          </div>

          {/* Player Data List */}
          {playerData && (
            <div className="mt-6">
              <PlayerList players={playerInfo || playerData} />
            </div>
          )}

          {/* Customize Button */}
          <Link
            to={`/create-team-cvc/Cricket/${seasonGameUid}/${matchInSights.home}_vs_${matchInSights.away}/${matchInSights.league_id}/overall`}
            state={{ matchInSights, setting, playerData }}
          >
            <div className="mt-6 bg-gray-100 rounded-lg p-4 cursor-pointer hover:bg-gray-200 transition duration-300 flex justify-between items-center shadow-md">
              <span className="text-base sm:text-lg font-bold text-gray-700">
                Customize
              </span>
              <div className="flex space-x-1">
                <i className="w-4 h-4 bg-gray-500 rounded-full" />
                <i className="w-4 h-4 bg-gray-500 rounded-full" />
                <i className="w-4 h-4 bg-gray-500 rounded-full" />
              </div>
            </div>
          </Link>

          {/* Player Data List */}
          <TierBasedTeamFormation />
          {/* Next Button */}
          <div className="mt-10 flex justify-end">
            <button
              onClick={() => alert("Next clicked!")}
              className="bg-gray-800 text-white px-6 py-2 rounded-md font-semibold hover:bg-gray-900 transition-colors"
            >
              NEXT
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};
export default CreateTeamSetting;
