import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FaCheckCircle, FaBolt } from "react-icons/fa";

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

const FixtureHeader = ({ matchInSights, setting }) => {
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
        <Link
          to={`/create-team-setting/Cricket/${matchInSights.season_game_uid}/${matchInSights.home}_vs_${matchInSights.away}/${matchInSights.league_id}`}
          state={{
            matchID: matchInSights.season_game_uid,
            matchInSights: matchInSights,
            setting:setting
          }}
          className="mr-3"
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
        </Link>
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

function CreateTeamCvc() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState("OVERALL");
  const [selectedPlayers, setSelectedPlayers] = useState([]);

  const location = useLocation();
  const matchInSights = location.state?.matchInSights;
  const setting = location.state?.setting;
  const playerData = location.state?.playerData;

  if (!matchInSights) {
    return <div className="text-center text-gray-600">No match data provided.</div>;
  }

  const { home, away, season_game_uid } = matchInSights;
  const mainTabs = ["OVERALL", home, away];

  // Fetch player stats
  useEffect(() => {
    const fetchData = async () => {
      if (!season_game_uid) return;
      setLoading(true);
      try {
        const response = await axios.post(
          "https://plapi.perfectlineup.in/fantasy/stats/get_fixture_players",
          {
            season_game_uid,
            website_id: 1,
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
        setData(response.data.data);
      } catch (err) {
        setError(err.message || "An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [season_game_uid]);

  // Initialize selected players from passed playerData
  useEffect(() => {
    if (playerData && Array.isArray(playerData)) {
      const uids = playerData.map((p) => p.player_uid);
      setSelectedPlayers(uids);
    }
  }, [playerData]);

  // Filter players based on tab
  const filteredPlayers = useMemo(() => {
    if (!data?.players) return [];
    return data.players
      .filter((player) => {
        if (activeMainTab === home) return player.team_abbr === home;
        if (activeMainTab === away) return player.team_abbr === away;
        return true;
      })
      .sort((a, b) => b.selected_percentage - a.selected_percentage);
  }, [data, activeMainTab, home, away]);

  // Toggle selection (max 10)
  const toggleSelection = (playerId) => {
    setSelectedPlayers((prev) => {
      const isAlreadySelected = prev.includes(playerId);
      if (isAlreadySelected) {
        return prev.filter((id) => id !== playerId);
      } else if (prev.length < 10) {
        return [...prev, playerId];
      } else {
        return prev;
      }
    });
  };

  // Get selected player objects
  const selectedPlayerObjects = useMemo(() => {
    return data?.players?.filter((player) =>
      selectedPlayers.includes(player.player_uid)
    ) || [];
  }, [data, selectedPlayers]);

  // UI States
  if (loading) return <div className="text-center text-gray-600">Loading...</div>;
  if (error) return <div className="text-red-500 text-center">Error: {error}</div>;
  if (!data) return <div className="text-center text-gray-600">No data available.</div>;

  return (
    <div className="w-full min-h-screen bg-white flex flex-col items-center">
      {/* Header */}
      <header className="w-full">
        <FixtureHeader matchInSights={matchInSights} setting={setting} />
      </header>

      {/* Tabs */}
      <div className="flex mt-4 mb-6 space-x-6 text-lg font-semibold">
        {mainTabs.map((tab) => (
          <div
            key={tab}
            onClick={() => setActiveMainTab(tab)}
            className={`cursor-pointer pb-1 ${
              activeMainTab === tab
                ? "border-b-2 border-black text-black"
                : "text-gray-500"
            }`}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Player List */}
      <div className="w-full px-4 space-y-3">
        {filteredPlayers.map((player) => {
          const isSelected = selectedPlayers.includes(player.player_uid);
          return (
            <div
              key={player.player_uid}
              className={`flex items-center justify-between px-4 py-3 bg-white shadow-md rounded-xl cursor-pointer ${
                selectedPlayers.length >= 10 && !isSelected
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => toggleSelection(player.player_uid)}
            >
            <div className="flex items-center gap-4">
            <FaBolt className="text-yellow-500" />
            <div className="text-xl font-semibold w-5">{player.afc_rank}</div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <div className="text-md font-bold">{player.nick_name}</div>
                <span
                  className={`h-3 w-3 rounded-full ${
                    player.playing_11 === "0" ? "bg-red-500" : "bg-green-500"
                  }`}
                  title={player.playing_11 === "0" ? "Not in Playing XI" : "Playing XI"}
                />
              </div>
              <div className="text-sm text-gray-500">
                {player.child_position} • {player.team_abbr}
              </div>
            </div>
          </div>
          
              <div className="flex items-center gap-2">
                <div className="text-green-600 font-semibold">
                  {Number(player.selected_percentage).toFixed(2)}%
                </div>
                {isSelected && <FaCheckCircle className="text-blue-500 text-lg" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Done Button */}
      <div className="fixed bottom-6 w-full px-6">
        <Link
          to={`/create-team-setting/Cricket/${matchInSights.season_game_uid}/${matchInSights.home}_vs_${matchInSights.away}/${matchInSights.league_id}`}
          state={{
            matchID: matchInSights.season_game_uid,
            matchInSights: matchInSights,
            playerData: selectedPlayerObjects,
            setting: setting,
          }}
        >
          <button className="w-full py-3 bg-[#1a1a3f] text-white text-lg rounded-xl font-semibold">
            DONE ({selectedPlayers.length})
          </button>
        </Link>
      </div>
    </div>
  );
}

export default CreateTeamCvc;
