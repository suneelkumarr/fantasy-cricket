import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import debounce from "lodash/debounce";

// const debounce = (func, delay) => {
//   let timeoutId;
//   return function (...args) {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => {
//       func.apply(this, args);
//     }, delay);
//   }
// };



function getOverallChanges(original, updated) {
  let overall = {};

  for (const key in original) {
      if (!updated[key]) {
          overall[key] = original[key]; // Key is missing in updated object
      } else if (original[key].min !== updated[key].min || original[key].max !== updated[key].max) {
          overall[key] = updated[key]; // Store only changed values
      }
  }

  return { "overall": Object.keys(overall).length ? overall : {} };
}

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

// const TierBasedTeamFormation = ({matchInSights, onTierPicksUpdate }) => {
//   // State declarations
//   const [selected, setSelected] = useState("default");
//   const [tierData, setTierData] = useState([]);
//   const [allPlayers, setAllPlayers] = useState([]);
//   const [showModal, setShowModal] = useState(false);
//   const [showModalCount, setShowModalCount] = useState(false);
//   const [selectedTier, setSelectedTier] = useState(null);

//   // For API calls
//   const [fixtureInfo, setFixtureInfo] = useState(null);

//   // Toggling states
//   const [preferredPlayers, setPreferredPlayers] = useState({});
//   const [excludedMap, setExcludedMap] = useState({});
//   const [lockedMap, setLockedMap] = useState({});

//   // Tier range (min / max) for each tier
//   const [tierRanges, setTierRanges] = useState({});

//   // Options for the pick range (MIN/MAX)
//   const options = ["-", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

//   // Helper: Update tier range (min and max) in a single object
//   const updateTierRange = (tierKey, newMin, newMax) => {
//     setTierRanges((prev) => ({
//       ...prev,
//       [tierKey]: { min: newMin, max: newMax },
//     }));
//   };

//   // Toggle handlers
//   const toggleLock = (uid) =>
//     setLockedMap((prev) => ({ ...prev, [uid]: !prev[uid] }));
//   const toggleExclude = (uid) =>
//     setExcludedMap((prev) => ({ ...prev, [uid]: !prev[uid] }));
//   const togglePreferred = (playerUid) =>
//     setPreferredPlayers((prev) => ({
//       ...prev,
//       [playerUid]: !prev[playerUid],
//     }));

//   // API call to fetch players when "Choose Your Own" is selected
//   const handleChooseOwn = async () => {
//     setSelected("custom");
//     try {
//       const response = await axios.post(
//         "https://plapi.perfectlineup.in/fantasy/stats/get_fixture_players",
//         {
//           season_game_uid: matchInSights?.season_game_uid,
//           website_id: "1",
//           sports_id: "7",
//         },
//         {
//           headers: {
//             sessionkey: "3cd0fb996816c37121c765f292dd3f78",
//             moduleaccess: "7",
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       const players = response.data?.data?.players || [];
//       setAllPlayers(players);
//       setFixtureInfo(response.data?.data?.fixture_info);

//       const categorizePlayers = () => {
//         // Sort helper
//         const sortPlayers = (arr) =>
//           arr.sort(
//             (a, b) =>
//               parseFloat(b.selected_percentage) -
//               parseFloat(a.selected_percentage)
//           );

//         // Tiers based on selected_percentage
//         const topTier = sortPlayers(
//           players.filter((p) => parseFloat(p.selected_percentage) >= 66.66)
//         ).length;
//         const middleTier = sortPlayers(
//           players.filter(
//             (p) =>
//               parseFloat(p.selected_percentage) >= 33.33 &&
//               parseFloat(p.selected_percentage) < 66.66
//           )
//         ).length;
//         const lowerTier = sortPlayers(
//           players.filter((p) => parseFloat(p.selected_percentage) < 33.33)
//         ).length;

//         return [
//           { name: "Top Tier", key: "top", players: topTier },
//           { name: "Middle Tier", key: "middle", players: middleTier },
//           { name: "Lower Tier", key: "lower", players: lowerTier },
//         ];
//       };

//       setTierData(categorizePlayers());
//     } catch (error) {
//       console.error("API call failed", error);
//     }
//   };

//   // Memoized function to get sorted players by tier
//   const getPlayersByTier = useMemo(
//     () => (tierKey) => {
//       const sortPlayers = (arr) =>
//         arr.sort(
//           (a, b) =>
//             parseFloat(b.selected_percentage) - parseFloat(a.selected_percentage)
//         );

//       if (!allPlayers?.length) return [];

//       switch (tierKey) {
//         case "top":
//           return sortPlayers(
//             allPlayers.filter((p) => parseFloat(p.selected_percentage) >= 66.66)
//           );
//         case "middle":
//           return sortPlayers(
//             allPlayers.filter(
//               (p) =>
//                 parseFloat(p.selected_percentage) >= 33.33 &&
//                 parseFloat(p.selected_percentage) < 66.66
//             )
//           );
//         case "lower":
//           return sortPlayers(
//             allPlayers.filter((p) => parseFloat(p.selected_percentage) < 33.33)
//           );
//         default:
//           return [];
//       }
//     },
//     [allPlayers]
//   );

//   // Extract array of IDs for each category
//   const getActiveIds = (map) =>
//     Object.keys(map).filter((uid) => map[uid] === true);

//   const preferredPlayerIds = useMemo(() => getActiveIds(preferredPlayers), [
//     preferredPlayers,
//   ]);
//   const lockedPlayerIds = useMemo(() => getActiveIds(lockedMap), [lockedMap]);
//   const excludedPlayerIds = useMemo(() => getActiveIds(excludedMap), [
//     excludedMap,
//   ]);

//   // Sync toggles (locked, preferred, excluded) with API
//   useEffect(() => {
//     // Avoid firing if no fixture or no toggled players
//     if (!fixtureInfo) return;

//     const payload = {
//       season_game_uid: fixtureInfo.season_game_uid,
//       website_id: 1,
//       sports_id: "7",
//       league_id: fixtureInfo.league_id,
//       locked_players: lockedPlayerIds,
//       preferred_players: preferredPlayerIds,
//       excluded_players: excludedPlayerIds,
//     };

//     const savePreferredPlayers = async () => {
//       try {
//         const response = await axios.post(
//           "https://plapi.perfectlineup.in/fantasy/stats/save_lock_execlude",
//           payload,
//           {
//             headers: {
//               sessionkey: "3cd0fb996816c37121c765f292dd3f78",
//               moduleaccess: "7",
//               "Content-Type": "application/json",
//             },
//           }
//         );
//         console.log("Preferred/excluded/locked updated:", response.data);
//       } catch (err) {
//         console.error("Error updating preferred/excluded/locked players:", err);
//       }
//     };

//     savePreferredPlayers();
//   }, [preferredPlayerIds, lockedPlayerIds, excludedPlayerIds, fixtureInfo]);


//   const newObj = {};

// if (tierRanges.hasOwnProperty("top")) {
//     newObj["1"] = tierRanges.top;
// }

// if (tierRanges.hasOwnProperty("middle")) {
//     newObj["2"] = tierRanges.middle;
// }

// if (tierRanges.hasOwnProperty("lower")) {
//     newObj["3"] = tierRanges.lower;
// }

// // Call the callback whenever tierRanges updates or modal closes
// useEffect(() => {
//   if (onTierPicksUpdate) {
//     onTierPicksUpdate(newObj);
//   }
// }, [tierRanges, onTierPicksUpdate, newObj]);

//   return (
//     <div className="container mx-auto p-4 max-w-7xl">
//       <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6">
//         4. Tier Based Team Formation
//       </h2>

//       {/* Option Cards */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
//         <div
//           onClick={() => setSelected("default")}
//           className={`cursor-pointer border rounded-lg p-4 text-center transition-all duration-200 ${
//             selected === "default"
//               ? "border-blue-800 shadow-lg"
//               : "border-gray-300 hover:border-blue-500"
//           }`}
//         >
//           <p className="font-semibold text-blue-900 text-lg">Pick Top Player</p>
//           <p className="text-sm text-gray-600">Default</p>
//         </div>

//         <div
//           onClick={handleChooseOwn}
//           className={`cursor-pointer border rounded-lg p-4 text-center transition-all duration-200 ${
//             selected === "custom"
//               ? "border-blue-800 shadow-lg"
//               : "border-gray-300 hover:border-blue-500"
//           }`}
//         >
//           <p className="font-semibold text-blue-900 text-lg">
//             Choose Your Own
//           </p>
//         </div>
//       </div>

//       {/* Instruction */}
//       {selected === "custom" && (
//         <div className="bg-gray-100 p-4 rounded-lg mb-6 text-sm text-gray-700">
//           Pick how many players you want from each tier based on selection
//           percentage
//         </div>
//       )}

//       {/* Tier List */}
//       {selected === "custom" && tierData.length > 0 && (
//         <div className="space-y-2">
//           <div className="hidden md:grid grid-cols-12 text-sm font-semibold text-gray-500 px-2 mb-2">
//             <span className="col-span-4">Tier</span>
//             <span className="col-span-4 text-center">No. of Players</span>
//             <span className="col-span-4 text-right">In Every Lineup</span>
//           </div>
//           {tierData.map((tier) => (
//             <div
//               key={tier.key}
//               className="grid grid-cols-1 md:grid-cols-12 items-center border-b py-3 px-2 hover:bg-gray-50 transition-colors"
//             >
//               <div className="col-span-4 text-gray-800 font-medium md:mb-0 mb-2">
//                 {tier.name}
//               </div>
//               <div
//                 onClick={() => {
//                   setSelectedTier(tier.key);
//                   setShowModal(true);
//                 }}
//                 className="col-span-4 text-center text-gray-600 font-semibold cursor-pointer md:mb-0 mb-2"
//               >
//                 {tier.players} Players
//               </div>
//               <div
//                 onClick={() => {
//                   setSelectedTier(tier.key);
//                   setShowModalCount(true);
//                 }}
//                 className="col-span-4 flex justify-end items-center cursor-pointer"
//               >
//                 <div className="border px-3 py-1 rounded-md flex items-center gap-2">
//                   <span className="text-gray-500">
//                     {tierRanges[tier.key]?.min && tierRanges[tier.key]?.max
//                       ? `${tierRanges[tier.key].min} - ${
//                           tierRanges[tier.key].max
//                         }`
//                       : "--"}
//                   </span>
//                   <img
//                     src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_up_down_arrow.svg"
//                     alt="toggle"
//                     className="w-4 h-4"
//                   />
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Players Modal */}
//       {showModal && selectedTier && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
//             <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
//               <div className="flex-1 text-center">
//                 <h3 className="text-xl font-semibold">
//                   Players in{" "}
//                   {selectedTier.charAt(0).toUpperCase() +
//                     selectedTier.slice(1)}{" "}
//                   Tier
//                 </h3>
//                 {fixtureInfo && (
//                   <p className="text-sm text-gray-500">
//                     {fixtureInfo?.home_abbr} vs {fixtureInfo?.away_abbr}
//                   </p>
//                 )}
//               </div>
//               <button
//                  onClick={() => {
//                   setShowModal(false);
//                   if (onTierPicksUpdate) {
//                     onTierPicksUpdate(newObj); // Send newObj to parent when modal closes
//                   }
//                 }}
//                 className="text-gray-500 hover:text-red-500 text-2xl"
//               >
//                 ×
//               </button>
//             </div>

//             <div className="p-4 space-y-3">
//               <div className="hidden md:grid grid-cols-12 items-center px-2 text-xs text-gray-500 font-medium border-b pb-2">
//                 <div className="col-span-6">Player</div>
//                 <div className="col-span-3 text-center">Sel By</div>
//                 <div className="col-span-1 text-center">₹</div>
//                 <div className="col-span-2 text-right"></div>
//               </div>

//               {getPlayersByTier(selectedTier).map((p) => (
//                 <div
//                   key={p.player_uid}
//                   className="grid grid-cols-1 md:grid-cols-12 items-center px-2 py-3 rounded hover:bg-gray-50 border-b"
//                 >
//                   <div className="col-span-6 flex items-center gap-3 mb-2 md:mb-0">
//                     <div
//                       className={`w-1 h-10 rounded-sm ${
//                         p.team_abbr === fixtureInfo?.home_abbr
//                           ? "bg-blue-500"
//                           : "bg-red-500"
//                       }`}
//                     />
//                     <img
//                       src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/${p.jersey}`}
//                       alt="jersey"
//                       className="w-8 h-8 object-contain"
//                       onError={(e) => (e.target.src = "/fallback-jersey.png")}
//                     />
//                     <div>
//                       <div className="font-medium text-sm">{p.nick_name}</div>
//                       <div className="text-xs text-gray-500">
//                         {p.child_position} • {p.team_abbr}
//                       </div>
//                     </div>
//                   </div>

//                   <div className="col-span-3 text-center text-sm font-semibold text-gray-700 mb-2 md:mb-0">
//                     {parseFloat(p.selected_percentage).toFixed(2)}%
//                   </div>

//                   <div className="col-span-1 text-center text-sm font-medium mb-2 md:mb-0">
//                     {p.salary}
//                   </div>

//                   <div className="col-span-2 flex justify-end gap-2">
//                     <img
//                       src={
//                         preferredPlayers[p.player_uid]
//                           ? "https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_prefer.svg"
//                           : "https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_prefer_inactive.svg"
//                       }
//                       alt="favorite toggle"
//                       className="w-5 h-5 cursor-pointer hover:opacity-75"
//                       onClick={() => togglePreferred(p.player_uid)}
//                     />
//                     <i
//                       className={`cursor-pointer text-xl ${
//                         lockedMap[p.player_uid]
//                           ? "text-red-500"
//                           : "text-gray-500"
//                       }`}
//                       onClick={() => toggleLock(p.player_uid)}
//                     >
//                       {lockedMap[p.player_uid] ? "🔒" : "🔓"}
//                     </i>
//                     <i
//                       className={`text-xl cursor-pointer ${
//                         excludedMap[p.player_uid]
//                           ? "text-red-500"
//                           : "text-gray-500"
//                       }`}
//                       onClick={() => toggleExclude(p.player_uid)}
//                     >
//                       ✖️
//                     </i>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Range Selection Modal */}
//       {showModalCount && selectedTier && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white w-full max-w-md rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
//             <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
//               <div className="flex-1 text-center">
//                 <h3 className="text-xl font-semibold">Pick Range From Tier</h3>
//                 {fixtureInfo && (
//                   <p className="text-sm text-gray-500">
//                     {fixtureInfo.home_abbr} vs {fixtureInfo.away_abbr}
//                   </p>
//                 )}
//               </div>
//               <button
//                 onClick={() => setShowModalCount(false)}
//                 className="text-gray-500 hover:text-red-500 text-2xl"
//                     state={{
//                              tier_pick: newObj
//                             }}
//               >
//                 ×
//               </button>
//             </div>

//             <div className="flex flex-col sm:flex-row gap-8 bg-gray-50 p-4 justify-center">
//               {["MIN", "MAX"].map((label) => (
//                 <div key={label} className="w-24 flex flex-col items-center">
//                   <h2 className="text-gray-500 font-bold uppercase mb-4">
//                     {label}
//                   </h2>
//                   <div className="flex flex-col space-y-2 w-full max-h-64 overflow-y-auto">
//                     {options.map((option) => (
//                       <button
//                         key={option}
//                         type="button"
//                         className={`px-4 py-2 text-black rounded w-full transition-colors ${
//                           (label === "MIN"
//                             ? tierRanges[selectedTier]?.min
//                             : tierRanges[selectedTier]?.max) === option
//                             ? "bg-blue-100 text-blue-800"
//                             : "hover:bg-gray-100"
//                         }`}
//                         onClick={() => {
//                           if (label === "MIN") {
//                             updateTierRange(
//                               selectedTier,
//                               option,
//                               tierRanges[selectedTier]?.max
//                             );
//                           } else {
//                             updateTierRange(
//                               selectedTier,
//                               tierRanges[selectedTier]?.min,
//                               option
//                             );
//                           }
//                         }}
//                       >
//                         {option}
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };


// Wrap the component with React.memo to prevent re-renders when props don't change



const TierBasedTeamFormation = React.memo(({ matchInSights, onTierPicksUpdate }) => {
  // State declarations
  const [selected, setSelected] = useState("default");
  const [tierData, setTierData] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showModalCount, setShowModalCount] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [fixtureInfo, setFixtureInfo] = useState(null);
  const [preferredPlayers, setPreferredPlayers] = useState({});
  const [excludedMap, setExcludedMap] = useState({});
  const [lockedMap, setLockedMap] = useState({});
  const [tierRanges, setTierRanges] = useState({});

  const options = ["-", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

  // Memoized function to get sorted players by tier
  const getPlayersByTier = useMemo(() => {
    return (tierKey) => {
      const sortPlayers = (arr) =>
        arr.sort((a, b) => parseFloat(b.selected_percentage) - parseFloat(a.selected_percentage));

      if (!allPlayers?.length) return [];

      switch (tierKey) {
        case "top":
          return sortPlayers(allPlayers.filter((p) => parseFloat(p.selected_percentage) >= 66.66));
        case "middle":
          return sortPlayers(
            allPlayers.filter(
              (p) => parseFloat(p.selected_percentage) >= 33.33 && parseFloat(p.selected_percentage) < 66.66
            )
          );
        case "lower":
          return sortPlayers(allPlayers.filter((p) => parseFloat(p.selected_percentage) < 33.33));
        default:
          return [];
      }
    };
  }, [allPlayers]);

  // Stabilize toggle handlers with useCallback
  const toggleLock = useCallback((uid) => {
    setLockedMap((prev) => ({ ...prev, [uid]: !prev[uid] }));
  }, []);

  const toggleExclude = useCallback((uid) => {
    setExcludedMap((prev) => ({ ...prev, [uid]: !prev[uid] }));
  }, []);

  const togglePreferred = useCallback((playerUid) => {
    setPreferredPlayers((prev) => ({ ...prev, [playerUid]: !prev[playerUid] }));
  }, []);

  // Stabilize updateTierRange with useCallback
  const updateTierRange = useCallback((tierKey, newMin, newMax) => {
    setTierRanges((prev) => ({
      ...prev,
      [tierKey]: { min: newMin, max: newMax },
    }));
  }, []);

  // Stabilize handleChooseOwn with useCallback
  const handleChooseOwn = useCallback(async () => {
    setSelected("custom");
    try {
      const response = await axios.post(
        "https://plapi.perfectlineup.in/fantasy/stats/get_fixture_players",
        {
          season_game_uid: matchInSights?.season_game_uid,
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

      const players = response.data?.data?.players || [];
      setAllPlayers(players);
      setFixtureInfo(response.data?.data?.fixture_info);

      const categorizePlayers = () => {
        const sortPlayers = (arr) =>
          arr.sort((a, b) => parseFloat(b.selected_percentage) - parseFloat(a.selected_percentage));

        const topTier = sortPlayers(players.filter((p) => parseFloat(p.selected_percentage) >= 66.66)).length;
        const middleTier = sortPlayers(
          players.filter(
            (p) => parseFloat(p.selected_percentage) >= 33.33 && parseFloat(p.selected_percentage) < 66.66
          )
        ).length;
        const lowerTier = sortPlayers(players.filter((p) => parseFloat(p.selected_percentage) < 33.33)).length;

        return [
          { name: "Top Tier", key: "top", players: topTier },
          { name: "Middle Tier", key: "middle", players: middleTier },
          { name: "Lower Tier", key: "lower", players: lowerTier },
        ];
      };

      setTierData(categorizePlayers());
    } catch (error) {
      console.error("API call failed", error);
    }
  }, [matchInSights]);

  // Memoize active IDs extraction
  const getActiveIds = useCallback((map) => Object.keys(map).filter((uid) => map[uid] === true), []);
  const preferredPlayerIds = useMemo(() => getActiveIds(preferredPlayers), [preferredPlayers, getActiveIds]);
  const lockedPlayerIds = useMemo(() => getActiveIds(lockedMap), [lockedMap, getActiveIds]);
  const excludedPlayerIds = useMemo(() => getActiveIds(excludedMap), [excludedMap, getActiveIds]);

  // Debounced API sync for toggles
  useEffect(() => {
    if (!fixtureInfo) return;

    const payload = {
      season_game_uid: fixtureInfo.season_game_uid,
      website_id: 1,
      sports_id: "7",
      league_id: fixtureInfo.league_id,
      locked_players: lockedPlayerIds,
      preferred_players: preferredPlayerIds,
      excluded_players: excludedPlayerIds,
    };

    const savePreferredPlayers = debounce(async () => {
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
        console.log("Preferred/excluded/locked updated:", response.data);
      } catch (err) {
        console.error("Error updating preferred/excluded/locked players:", err);
      }
    }, 500); // Debounce for 500ms

    savePreferredPlayers();
    return () => savePreferredPlayers.cancel(); // Cleanup debounce on unmount
  }, [preferredPlayerIds, lockedPlayerIds, excludedPlayerIds, fixtureInfo]);

  // Memoize newObj to prevent reference changes
  const newObj = useMemo(() => {
    const obj = {};
    if (tierRanges.hasOwnProperty("top")) obj["1"] = tierRanges.top;
    if (tierRanges.hasOwnProperty("middle")) obj["2"] = tierRanges.middle;
    if (tierRanges.hasOwnProperty("lower")) obj["3"] = tierRanges.lower;
    return obj;
  }, [tierRanges]);

  // Trigger onTierPicksUpdate only when newObj changes
  useEffect(() => {
    if (onTierPicksUpdate) {
      onTierPicksUpdate(newObj);
    }
  }, [newObj, onTierPicksUpdate]);

  // JSX remains largely the same, so I'll omit it for brevity
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6">
        4. Tier Based Team Formation
      </h2>

      {/* Option Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div
          onClick={() => setSelected("default")}
          className={`cursor-pointer border rounded-lg p-4 text-center transition-all duration-200 ${
            selected === "default"
              ? "border-blue-800 shadow-lg"
              : "border-gray-300 hover:border-blue-500"
          }`}
        >
          <p className="font-semibold text-blue-900 text-lg">Pick Top Player</p>
          <p className="text-sm text-gray-600">Default</p>
        </div>

        <div
          onClick={handleChooseOwn}
          className={`cursor-pointer border rounded-lg p-4 text-center transition-all duration-200 ${
            selected === "custom"
              ? "border-blue-800 shadow-lg"
              : "border-gray-300 hover:border-blue-500"
          }`}
        >
          <p className="font-semibold text-blue-900 text-lg">
            Choose Your Own
          </p>
        </div>
      </div>

      {/* Instruction */}
      {selected === "custom" && (
        <div className="bg-gray-100 p-4 rounded-lg mb-6 text-sm text-gray-700">
          Pick how many players you want from each tier based on selection
          percentage
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
              <div className="col-span-4 text-gray-800 font-medium md:mb-0 mb-2">
                {tier.name}
              </div>
              <div
                onClick={() => {
                  setSelectedTier(tier.key);
                  setShowModal(true);
                }}
                className="col-span-4 text-center text-gray-600 font-semibold cursor-pointer md:mb-0 mb-2"
              >
                {tier.players} Players
              </div>
              <div
                onClick={() => {
                  setSelectedTier(tier.key);
                  setShowModalCount(true);
                }}
                className="col-span-4 flex justify-end items-center cursor-pointer"
              >
                <div className="border px-3 py-1 rounded-md flex items-center gap-2">
                  <span className="text-gray-500">
                    {tierRanges[tier.key]?.min && tierRanges[tier.key]?.max
                      ? `${tierRanges[tier.key].min} - ${
                          tierRanges[tier.key].max
                        }`
                      : "--"}
                  </span>
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
      {showModal && selectedTier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <div className="flex-1 text-center">
                <h3 className="text-xl font-semibold">
                  Players in{" "}
                  {selectedTier.charAt(0).toUpperCase() +
                    selectedTier.slice(1)}{" "}
                  Tier
                </h3>
                {fixtureInfo && (
                  <p className="text-sm text-gray-500">
                    {fixtureInfo?.home_abbr} vs {fixtureInfo?.away_abbr}
                  </p>
                )}
              </div>
              <button
                 onClick={() => {
                  setShowModal(false);
                }}
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
                        p.team_abbr === fixtureInfo?.home_abbr
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
                        preferredPlayers[p.player_uid]
                          ? "https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_prefer.svg"
                          : "https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_prefer_inactive.svg"
                      }
                      alt="favorite toggle"
                      className="w-5 h-5 cursor-pointer hover:opacity-75"
                      onClick={() => togglePreferred(p.player_uid)}
                    />
                    <i
                      className={`cursor-pointer text-xl ${
                        lockedMap[p.player_uid]
                          ? "text-red-500"
                          : "text-gray-500"
                      }`}
                      onClick={() => toggleLock(p.player_uid)}
                    >
                      {lockedMap[p.player_uid] ? "🔒" : "🔓"}
                    </i>
                    <i
                      className={`text-xl cursor-pointer ${
                        excludedMap[p.player_uid]
                          ? "text-red-500"
                          : "text-gray-500"
                      }`}
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
      {showModalCount && selectedTier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <div className="flex-1 text-center">
                <h3 className="text-xl font-semibold">Pick Range From Tier</h3>
                {fixtureInfo && (
                  <p className="text-sm text-gray-500">
                    {fixtureInfo.home_abbr} vs {fixtureInfo.away_abbr}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowModalCount(false)}
                className="text-gray-500 hover:text-red-500 text-2xl"
                    state={{
                             tier_pick: newObj
                            }}
              >
                ×
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-8 bg-gray-50 p-4 justify-center">
              {["MIN", "MAX"].map((label) => (
                <div key={label} className="w-24 flex flex-col items-center">
                  <h2 className="text-gray-500 font-bold uppercase mb-4">
                    {label}
                  </h2>
                  <div className="flex flex-col space-y-2 w-full max-h-64 overflow-y-auto">
                    {options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`px-4 py-2 text-black rounded w-full transition-colors ${
                          (label === "MIN"
                            ? tierRanges[selectedTier]?.min
                            : tierRanges[selectedTier]?.max) === option
                            ? "bg-blue-100 text-blue-800"
                            : "hover:bg-gray-100"
                        }`}
                        onClick={() => {
                          if (label === "MIN") {
                            updateTierRange(
                              selectedTier,
                              option,
                              tierRanges[selectedTier]?.max
                            );
                          } else {
                            updateTierRange(
                              selectedTier,
                              tierRanges[selectedTier]?.min,
                              option
                            );
                          }
                        }}
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
});


const TeamFormation = ({ matchInSights, onPositionCheckUpdate }) => {
  // State for managing the active tab (Overall or Team Specific)
  const [activeTab, setActiveTab] = useState("Overall");

  // State for managing range values in "Overall" tab
  const [ranges, setRanges] = useState({
    WK: { min: 1, max: 8 },
    BAT: { min: 1, max: 8 },
    AR: { min: 1, max: 8 },
    BOW: { min: 1, max: 8 },
  });

  // Define team names with fallbacks
  const home = matchInSights?.home || "HomeTeam";
  const away = matchInSights?.away || "AwayTeam";

  // State for managing range values in "Team Specific" tab
  const [teamRanges, setTeamRanges] = useState({
    WK: { [home]: { min: null, max: null }, [away]: { min: null, max: null } },
    BAT: { [home]: { min: null, max: null }, [away]: { min: null, max: null } },
    AR: { [home]: { min: null, max: null }, [away]: { min: null, max: null } },
    BOW: { [home]: { min: null, max: null }, [away]: { min: null, max: null } },
  });

  // State for managing the modal
  const [showModalCount, setShowModalCount] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null); // e.g., { position: "WK", team: "HomeTeam" }
  const fixtureInfo = { home_abbr: home, away_abbr: away }; // Fixture info using team names
  const options = [0, 1, 2, 3, 4, 5, 6, 7, 8]; // Options for range selection

  // Handle range changes in "Overall" tab
  const handleRangeChange = (position, type, value) => {
    const newValue = parseInt(value);
    setRanges((prev) => {
      const current = prev[position];
      if (type === "min") {
        if (newValue <= current.max) {
          return { ...prev, [position]: { ...current, min: newValue } };
        }
      } else {
        if (newValue >= current.min) {
          return { ...prev, [position]: { ...current, max: newValue } };
        }
      }
      return prev;
    });
  };

  // Update range for a specific team in "Team Specific" tab
  const updateTierRange = (tier, min, max) => {
    const { position, team } = tier;
    setTeamRanges((prev) => ({
      ...prev,
      [position]: {
        ...prev[position],
        [team]: { min, max },
      },
    }));
  };

  // Open modal for team range selection
  const handleTeamClick = (position, team) => {
    setSelectedTier({ position, team });
    setShowModalCount(true);
  };

  // Reset all ranges to initial values
  const handleReset = () => {
    setRanges({
      WK: { min: 1, max: 8 },
      BAT: { min: 1, max: 8 },
      AR: { min: 1, max: 8 },
      BOW: { min: 1, max: 8 },
    });
    setTeamRanges({
      WK: { [home]: { min: null, max: null }, [away]: { min: null, max: null } },
      BAT: { [home]: { min: null, max: null }, [away]: { min: null, max: null } },
      AR: { [home]: { min: null, max: null }, [away]: { min: null, max: null } },
      BOW: { [home]: { min: null, max: null }, [away]: { min: null, max: null } },
    });
  };



  // Memoize newObj to prevent reference changes
  const newObj = useMemo(() => {

    if(activeTab === "Overall"){
      const originalObject = {
        "WK": { "min": 1, "max": 8 },
        "BAT": { "min": 1, "max": 8 },
        "AR": { "min": 1, "max": 8 },
        "BOW": { "min": 1, "max": 8 }
    };
    const obj = getOverallChanges(originalObject, ranges)
    return obj;
  }
  }, [ranges]);

    // Trigger onTierPicksUpdate only when newObj changes
    useEffect(() => {
      if (onPositionCheckUpdate) {
        onPositionCheckUpdate(newObj);
      }
    }, [newObj, onPositionCheckUpdate]);
  // Array of positions for rendering
  const positions = ["WK", "BAT", "AR", "BOW"];

  return (
    <div className="container mx-auto p-4">
      {/* Title, Description, and Reset Button */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            <span className="text-blue-500">5.</span> Pick Team Formation
          </h2>
          <p className="text-gray-600 text-sm">
            Build teams with your favoured lineup configurations
          </p>
        </div>
        <button onClick={handleReset} className="text-gray-600 hover:text-gray-800">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Tabs for Switching Between Overall and Team Specific */}
      <div className="flex space-x-4 mb-6">
        <button
          className={`px-4 py-2 border rounded-lg font-medium ${
            activeTab === "Overall"
              ? "border-blue-500 text-blue-500"
              : "border-gray-300 text-gray-600"
          }`}
          onClick={() => setActiveTab("Overall")}
        >
          Overall
        </button>
        <button
          className={`px-4 py-2 border rounded-lg font-medium ${
            activeTab === "Team Specific"
              ? "border-blue-500 text-blue-500"
              : "border-gray-300 text-gray-600"
          }`}
          onClick={() => setActiveTab("Team Specific")}
        >
          Team Specific
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "Overall" ? (
        <div className="space-y-6">
          {positions.map((position) => (
            <div key={position} className="flex items-center space-x-4">
              <div className="w-12 text-gray-700 font-medium">{position}</div>
              <div className="flex-1">
                <div className="relative">
                  <div className="relative h-2 bg-gray-300 rounded-full">
                    <div
                      className="absolute h-2 bg-blue-600 rounded-full"
                      style={{
                        left: `${((ranges[position].min - 1) / 7) * 100}%`,
                        width: `${
                          ((ranges[position].max - ranges[position].min) / 7) * 100
                        }%`,
                      }}
                    ></div>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      value={ranges[position].min}
                      onChange={(e) => handleRangeChange(position, "min", e.target.value)}
                      className="absolute w-full h-2 appearance-none cursor-pointer"
                      style={{ zIndex: 5, background: "transparent" }}
                    />
                    <input
                      type="range"
                      min="1"
                      max="8"
                      value={ranges[position].max}
                      onChange={(e) => handleRangeChange(position, "max", e.target.value)}
                      className="absolute w-full h-2 appearance-none cursor-pointer"
                      style={{ zIndex: 4, background: "transparent" }}
                    />
                    <div className="absolute w-full flex justify-between top-[-6px]">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-5 h-5 rounded-full border-2 ${
                            i + 1 >= ranges[position].min && i + 1 <= ranges[position].max
                              ? "border-blue-600 bg-blue-600"
                              : "border-gray-300 bg-white"
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>
                  <style jsx>{`
                    input[type="range"]::-webkit-slider-thumb {
                      -webkit-appearance: none;
                      appearance: none;
                      width: 20px;
                      height: 20px;
                      background: #3b82f6;
                      border: 2px solid #ffffff;
                      border-radius: 50%;
                      cursor: pointer;
                      box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
                      z-index: 10;
                    }
                    input[type="range"]::-moz-range-thumb {
                      width: 20px;
                      height: 20px;
                      background: #3b82f6;
                      border: 2px solid #ffffff;
                      border-radius: 50%;
                      cursor: pointer;
                      box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
                      z-index: 10;
                    }
                    input[type="range"] {
                      pointer-events: none;
                    }
                    input[type="range"]::-webkit-slider-thumb {
                      pointer-events: auto;
                    }
                    input[type="range"]::-moz-range-thumb {
                      pointer-events: auto;
                    }
                  `}</style>
                </div>
              </div>
              <div className="w-12 text-gray-700 font-medium">
                {ranges[position].min}-{ranges[position].max}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div className="flex mb-4">
            <div className="w-12"></div>
            <div className="flex-1 flex justify-between">
              <div className="w-1/2 text-center font-medium text-gray-700">{home}</div>
              <div className="w-1/2 text-center font-medium text-gray-700">{away}</div>
            </div>
          </div>
          {positions.map((position) => (
            <div key={position} className="flex items-center space-x-4 mb-4">
              <div className="w-12 text-gray-700 font-medium">{position}</div>
              <div className="flex-1 flex space-x-4">
                {[home, away].map((team) => {
                  const range = teamRanges[position]?.[team];
                  return (
                    <div key={team} className="w-1/2">
                      <button
                        onClick={() => handleTeamClick(position, team)}
                        className="flex items-center justify-between w-full px-4 py-2 border rounded-lg bg-white hover:bg-gray-50"
                      >
                        <span className="text-gray-700">
                          {range && range.min !== null && range.max !== null
                            ? `${range.min}-${range.max}`
                            : "-"}
                        </span>
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for Range Selection */}
      {showModalCount && selectedTier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <div className="flex-1 text-center">
                <h3 className="text-xl font-semibold">Pick Range From Tier</h3>
                <p className="text-sm text-gray-500">
                  {fixtureInfo.home_abbr} vs {fixtureInfo.away_abbr}
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
              {["MIN", "MAX"].map((label) => (
                <div key={label} className="w-24 flex flex-col items-center">
                  <h2 className="text-gray-500 font-bold uppercase mb-4">{label}</h2>
                  <div className="flex flex-col space-y-2 w-full max-h-64 overflow-y-auto">
                    {options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={`px-4 py-2 text-black rounded w-full transition-colors ${
                          (label === "MIN"
                            ? teamRanges[selectedTier.position]?.[selectedTier.team]?.min
                            : teamRanges[selectedTier.position]?.[selectedTier.team]?.max) === option
                            ? "bg-blue-100 text-blue-800"
                            : "hover:bg-gray-100"
                        }`}
                        onClick={() => {
                          if (label === "MIN") {
                            updateTierRange(
                              selectedTier,
                              option,
                              teamRanges[selectedTier.position]?.[selectedTier.team]?.max ?? 8
                            );
                          } else {
                            updateTierRange(
                              selectedTier,
                              teamRanges[selectedTier.position]?.[selectedTier.team]?.min ?? 1,
                              option
                            );
                          }
                        }}
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


const TeamSelectionPreferences = ({matchInSights, onTempCheckUpdate}) => {
    // Define team names with fallbacks
  const home = matchInSights?.home || "HomeTeam";
  const away = matchInSights?.away || "AwayTeam";
  // State for selected team preference
  const [selectedTeam, setSelectedTeam] = useState("NONE");

  // State for the double range slider (min and max number of players)
  const [playerRange, setPlayerRange] = useState({ min: 1, max: 10 });

  // Handle team selection
  const handleTeamSelect = (team) => {
    setSelectedTeam(team);
    // Reset range when switching teams
    setPlayerRange({ min: 1, max: 10 });
  };

  // Handle range input changes for the double slider
  const handleRangeChange = (type, value) => {
    const newValue = parseInt(value);
    setPlayerRange((prev) => {
      if (type === "min") {
        if (newValue <= prev.max) {
          return { ...prev, min: newValue };
        }
      } else {
        if (newValue >= prev.min) {
          return { ...prev, max: newValue };
        }
      }
      return prev;
    });
  };

  // Memoize newObj to prevent reference changes
  const newObj = useMemo(() => {
    let obj
    if(selectedTeam === home) {
      const homeTeamId = matchInSights.home_uid
  
       obj = {
        [homeTeamId]:playerRange
      }
  
    }else if(selectedTeam === away){
      const awayTeamId = matchInSights.away_uid
       obj = {
        [awayTeamId]:playerRange
      }
      
    }else{
       obj = []
    }

    return obj;
  }
  , [playerRange, matchInSights]);

    // Trigger onTierPicksUpdate only when newObj changes
    useEffect(() => {
      if (onTempCheckUpdate) {
        onTempCheckUpdate(newObj);
      }
    }, [newObj, onTempCheckUpdate]);

  return (
    <div className="container mx-auto p-4">
      {/* Header Section */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          <span className="text-blue-500">6.</span> Team Selection Preferences
        </h2>
        <p className="text-gray-600 text-sm">
          Pick more players from one team
        </p>
      </div>

      {/* Team Preference Buttons */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => handleTeamSelect("NONE")}
          className={`flex items-center space-x-2 px-4 py-2 border rounded-lg ${
            selectedTeam === "NONE"
              ? "border-blue-500 text-blue-500"
              : "border-gray-300 text-gray-600"
          }`}
        >
          <img
            src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_minus_setting.svg"
            alt="None Icon"
            className="w-6 h-6"
          />
          <span>NONE</span>
        </button>
        <button
          onClick={() => handleTeamSelect(home)}
          className={`flex items-center space-x-2 px-4 py-2 border rounded-lg ${
            selectedTeam === home
              ? "border-blue-500 text-blue-500"
              : "border-gray-300 text-gray-600"
          }`}
        >
          <img
          src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${matchInSights.home_flag}`}
          alt={matchInSights.home}
          className="w-6 h-6 rounded-full"
        />
          <span>{matchInSights.home}</span>
        </button>
        <button
          onClick={() => handleTeamSelect(away)}
          className={`flex items-center space-x-2 px-4 py-2 border rounded-lg ${
            selectedTeam === away
              ? "border-blue-500 text-blue-500"
              : "border-gray-300 text-gray-600"
          }`}
        >

          <img
          src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${matchInSights.away_flag}`}
          alt={matchInSights.away}
          className="w-6 h-6 rounded-full"
        />
          <span>{matchInSights.away}</span>
        </button>
      </div>

      {/* Double Range Slider (Visible when FRD or LSG is selected) */}
      {selectedTeam !== "NONE" && (
        <div className="mt-6">
          <label className="block text-gray-700 font-medium mb-2">
            No. of Players: {playerRange.min}-{playerRange.max}
          </label>
          <div className="relative">
            {/* Slider Track */}
            <div className="relative h-2 bg-gray-300 rounded-full">
              {/* Selected Range */}
              <div
                className="absolute h-2 bg-blue-600 rounded-full"
                style={{
                  left: `${((playerRange.min - 1) / 9) * 100}%`,
                  width: `${((playerRange.max - playerRange.min) / 9) * 100}%`,
                }}
              ></div>

              {/* Min Thumb */}
              <input
                type="range"
                min="1"
                max="10"
                value={playerRange.min}
                onChange={(e) => handleRangeChange("min", e.target.value)}
                className="absolute w-full h-2 appearance-none cursor-pointer focus:outline-none"
                style={{ zIndex: 5, background: "transparent" }}
              />

              {/* Max Thumb */}
              <input
                type="range"
                min="1"
                max="10"
                value={playerRange.max}
                onChange={(e) => handleRangeChange("max", e.target.value)}
                className="absolute w-full h-2 appearance-none cursor-pointer focus:outline-none"
                style={{ zIndex: 4, background: "transparent" }}
              />

              {/* Circles for Visual Representation */}
              <div className="absolute w-full flex justify-between top-[-6px]">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-5 h-5 rounded-full border-2 ${
                      i + 1 >= playerRange.min && i + 1 <= playerRange.max
                        ? "border-blue-600 bg-blue-600"
                        : "border-gray-300 bg-white"
                    }`}
                  ></div>
                ))}
              </div>
            </div>

            {/* Labels for Min and Max */}
            <div className="flex justify-between mt-2 text-gray-600">
              <span>1</span>
              <span>10</span>
            </div>

            {/* Custom Thumb Styling */}
            <style jsx>{`
              input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 20px;
                height: 20px;
                background: #3b82f6;
                border: 2px solid #ffffff;
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
                z-index: 10;
              }

              input[type="range"]::-moz-range-thumb {
                width: 20px;
                height: 20px;
                background: #3b82f6;
                border: 2px solid #ffffff;
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
                z-index: 10;
              }

              input[type="range"] {
                pointer-events: none;
              }

              input[type="range"]::-webkit-slider-thumb {
                pointer-events: auto;
              }

              input[type="range"]::-moz-range-thumb {
                pointer-events: auto;
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
};



const TeamVariation = ({onTeamFlagCheckUpdate}) => {
  // State to track the selected strategy, initialized to "Different Teams"
  const [selectedStrategy, setSelectedStrategy] = useState('Different Teams');



    // Memoize newObj to prevent reference changes
    const newObj = useMemo(() => {
        let newValue
        if(selectedStrategy === "Different Teams"){
          newValue =""
        }else{
          newValue ="1"
        }

        return newValue
    }
    , [selectedStrategy]);
  
      // Trigger onTierPicksUpdate only when newObj changes
      useEffect(() => {
        if (onTeamFlagCheckUpdate) {
          onTeamFlagCheckUpdate(newObj);
        }
      }, [newObj, onTeamFlagCheckUpdate]);

  

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-3xl mx-auto p-4">
        {/* Title Section */}
        <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          <span className="text-blue-500">7.</span> TEAM VARIATION
        </h2>
        <p className="text-gray-600 text-sm">
        What’s your strategy?
        </p>
      </div>

        {/* Strategy Options */}
        <div className="flex justify-center space-x-4 mb-4">
          <div
            className={`px-4 py-2 border rounded-lg cursor-pointer hover:border-blue-300 hover:text-blue-400 ${
              selectedStrategy === 'Different Teams'
                ? 'border-blue-500 text-blue-500'
                : 'border-gray-300 text-gray-600'
            }`}
            onClick={() => setSelectedStrategy('Different Teams')}
          >
            Different Teams
          </div>
          <div
            className={`px-4 py-2 border rounded-lg cursor-pointer hover:border-blue-300 hover:text-blue-400 ${
              selectedStrategy === 'Similar Teams'
                ? 'border-blue-500 text-blue-500'
                : 'border-gray-300 text-gray-600'
            }`}
            onClick={() => setSelectedStrategy('Similar Teams')}
          >
            Similar Teams
            <span className="ml-2 text-sm">Different C & VC</span>
          </div>
        </div>

        {/* Dynamic Description */}
        <div className="text-center text-gray-600">
          {selectedStrategy === 'Different Teams'
            ? 'Get more player matches with Dream Team'
            : 'Higher chances of getting C & VC right'}
        </div>
      </div>
    </div>
  );
};


const CreateTeamSetting = () => {
  // State declarations
  const [data, setData] = useState(null);
  const [sportData, setSportData] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [loadingCount, setLoadingCount] = useState(0);
  const [error, setError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(4);
  const [teamsCount, setTeamsCount] = useState(0);
  const [distribution, setDistribution] = useState(1);
  const [cvcPool, setCvcPool] = useState(3);
  const [tierPicks, setTierPicks] = useState({});
  const [positionCheck, setPositionCheck] = useState({});
  const [tempPlayers, setTempPlayers] = useState({})
  const [SimilarTeamFlag, setSimilarTeamFlag] = useState("");

  const HIGH_CVC_POOL = 3;

  // Location and memoized derived data
  const location = useLocation();
  const matchInSights = useMemo(() => location.state?.matchInSights, [location.state]);
  const playerInfo = location.state?.playerData;
  const settingData = location.state?.setting;

  const seasonGameUid = useMemo(
    () => matchInSights?.season_game_uid || matchInSights?.es_season_game_uid,
    [matchInSights]
  );

  // Memoized callback functions
  const handleTierPicksUpdate = useCallback((newTierPicks) => {
    setTierPicks(newTierPicks);
  }, []); // Empty dependency array since it only uses setTierPicks

  const handlePositionCheckUpdate = useCallback((newPositionCheck) => {
    setPositionCheck(newPositionCheck);
  }, []); // Empty dependency array since it only uses setPositionCheck


  const handleTempCheckUpdate = useCallback((newPositionCheck) => {
    setTempPlayers(newPositionCheck);
  }, []); // Empty dependency array since it only uses setPositionCheck

  const handleTeamFlagCheckUpdate = useCallback((newPositionCheck) => {
    setSimilarTeamFlag(newPositionCheck);
  }, []); // Empty dependency array since it only uses setPositionCheck

  // Effect to sync state with settingData
  useEffect(() => {
    if (settingData) {
      setTeamsCount(settingData.teamsCount);
      setActiveIndex(settingData.activeIndex);
      setDistribution(settingData.distribution);
      setCvcPool(settingData.cvcPool);
    }
  }, [settingData]);

  // Effect to enforce cvcPool based on distribution
  useEffect(() => {
    if (distribution === 1) {
      setCvcPool(HIGH_CVC_POOL);
    }
  }, [distribution]);

  // Utility functions
  const getCurrentTimestampInIST = () => Date.now() + 5.5 * 3600000;
  const incrementLoading = () => setLoadingCount((prev) => prev + 1);
  const decrementLoading = () => setLoadingCount((prev) => Math.max(prev - 1, 0));

  // API fetch functions
  const fetchMatchData = useCallback(async () => {
    if (!seasonGameUid) return;
    incrementLoading();
    try {
      const res = await axios.get(
        `https://plineup-prod.blr1.digitaloceanspaces.com/appstatic/plprod_match_7_${seasonGameUid}.json?${getCurrentTimestampInIST()}`
      );
      setData(res.data);
    } catch (err) {
      if (!axios.isCancel(err)) {
        setError(err.message || "Error fetching match data.");
      }
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
      if (!axios.isCancel(err)) {
        setError(err.message || "Error fetching sport master data.");
      }
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
      if (!axios.isCancel(err)) {
        setError(err.message || "Error fetching CVC allocations.");
      }
    } finally {
      decrementLoading();
    }
  }, [teamsCount, seasonGameUid, activeIndex, distribution, cvcPool]);

  const debouncedFetchCvcData = useMemo(
    () => debounce(fetchCvcData, 500),
    [fetchCvcData]
  );

  // Fetch initial data
  useEffect(() => {
    fetchMatchData();
    fetchSportData();
  }, [fetchMatchData, fetchSportData]);

  // Fetch CVC data with debounce
  useEffect(() => {
    debouncedFetchCvcData();
    return () => debouncedFetchCvcData.cancel();
  }, [debouncedFetchCvcData]);

  // Memoized computed values
  const tooltip = useMemo(
    () => sportData?.cvc_settings?.tooltip_msg?.[distribution]?.[cvcPool] || "",
    [sportData, distribution, cvcPool]
  );
  const distributionData = useMemo(() => sportData?.cvc_settings, [sportData]);
  const getCvCPlayerIds = useMemo(
    () =>
      playerInfo
        ? playerInfo.map((player) => player.player_uid)
        : playerData?.map((player) => player.player_uid),
    [playerInfo, playerData]
  );
  const selectedPlayerCvC = useMemo(() => playerInfo || playerData, [playerInfo, playerData]);

  // Early returns
  if (!matchInSights) return <div className="text-center text-gray-600">No match data provided.</div>;
  if (loadingCount > 0) return <div className="text-center text-gray-600">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">Error: {error}</div>;
  if (!data || !sportData) return <div className="text-center text-gray-600">No data available.</div>;

  return (
    <main className="flex-grow container mx-auto px-4 sm:px-6 py-6">
      <header className="w-full">
        <FixtureHeader matchInSights={matchInSights} />
      </header>
      <section className="bg-white text-gray-800 mt-2">
        <div className="w-full max-w-5xl mx-auto">
          <div className="mb-6 flex items-center space-x-2 text-base sm:text-lg font-semibold text-gray-800">
            <span className="text-indigo-600">1.</span>
            <span>Create teams on the basis of</span>
          </div>
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

          <div className="mt-10">
            <h2 className="text-base sm:text-lg font-semibold">2. NUMBER OF TEAMS</h2>
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
              <span className="text-sm font-medium text-gray-700">{teamsCount}</span>
            </div>
          </div>

          <div className="mt-10 border rounded-lg p-4">
            <div className="font-semibold text-gray-800 mb-1">3. C & VC SETTINGS</div>
            <div className="text-sm text-gray-600 mb-4">What's your strategy?</div>
            <div className="flex flex-row justify-between mb-3 font-medium text-gray-700 text-sm">
              <span>Distribution</span>
              <span className="pr-2">C/VC Pool</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="flex-1 border rounded-md overflow-hidden">
                {distributionData?.distribution?.options.map((opt) => (
                  <div
                    key={opt.key_value}
                    className={`p-3 text-center cursor-pointer text-sm font-medium ${
                      Number(distribution) === Number(opt.key_value) ? "bg-gray-200" : "bg-gray-100"
                    }`}
                    onClick={() => setDistribution(opt.key_value)}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
              <div className="flex-1 border rounded-md p-3">
                {distributionData?.cvc_pool?.options.map((opt) => (
                  <div
                    key={opt.key_value}
                    className={`flex items-center mb-2 cursor-pointer text-sm ${
                      Number(cvcPool) === Number(opt.key_value) ? "font-semibold text-gray-800" : "text-gray-600"
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
            {tooltip && (
              <div className="mt-4 text-sm text-center text-gray-600 italic bg-gray-100 p-2 rounded-md">
                {tooltip}
              </div>
            )}
          </div>

          {playerData && (
            <div className="mt-6">
              <PlayerList players={selectedPlayerCvC} />
            </div>
          )}

          <Link
            to={`/create-team-cvc/Cricket/${seasonGameUid}/${matchInSights.home}_vs_${matchInSights.away}/${matchInSights.league_id}/overall`}
            state={{
              matchInSights,
              setting: {
                teamsCount,
                seasonGameUid,
                excluded_players: [],
                activeIndex,
                fetch_excluded: 1,
                distribution,
                cvcPool,
              },
              playerData: selectedPlayerCvC,
              selected_cvc: getCvCPlayerIds,
            }}
          >
            <div className="mt-6 bg-gray-100 rounded-lg p-4 cursor-pointer hover:bg-gray-200 transition duration-300 flex justify-between items-center shadow-md">
              <span className="text-base sm:text-lg font-bold text-gray-700">Customize</span>
              <div className="flex space-x-1">
                <i className="w-4 h-4 bg-gray-500 rounded-full" />
                <i className="w-4 h-4 bg-gray-500 rounded-full" />
                <i className="w-4 h-4 bg-gray-500 rounded-full" />
              </div>
            </div>
          </Link>

          <TierBasedTeamFormation
            matchInSights={matchInSights}
            onTierPicksUpdate={handleTierPicksUpdate}
          />
          <TeamFormation
            matchInSights={matchInSights}
            onPositionCheckUpdate={handlePositionCheckUpdate}
          />
          <TeamSelectionPreferences matchInSights={matchInSights} onTempCheckUpdate={handleTempCheckUpdate} />
          <TeamVariation onTeamFlagCheckUpdate={handleTeamFlagCheckUpdate} />

          <div className="mt-10 flex w-full max-w-4xl">
            <Link
              to={`/create-team/Cricket/${matchInSights.season_game_uid}/${matchInSights.home}_vs_${matchInSights.away}/${matchInSights.league_id}`}
              state={{
                matchInSights,
                lineup_logic: activeIndex,
                number_of_lineups: teamsCount,
                lmh_method: distribution,
                variation_code: cvcPool,
                tier_picks: tierPicks,
                position_check:positionCheck,
                team_player:tempPlayers,
                similar_team_flag:SimilarTeamFlag,
                selected_cvc:getCvCPlayerIds
              }}
              className="bg-[#212341] text-white px-4 py-2 rounded font-semibold w-full max-w-full sm:max-w-screen-lg mx-auto justify-center flex items-center"
            >
              NEXT
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};



export default CreateTeamSetting;
