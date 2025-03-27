import React, { useState, useEffect , useMemo} from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Pie, PieChart } from 'recharts';

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


  const PlayerBattles = ({ data, matchInSights }) => {
    const [activeTab, setActiveTab] = useState("BATSMAN vs BOWLER");
    const [innerTab, setInnerTab] = useState("OVERALL");
    const [preferredPlayers, setPreferredPlayers] = useState(new Set()); // Track preferred players
  
    const tabs = ["BATSMAN vs BOWLER", "BOWLER vs BATSMAN"];
    const innerTabs = ["OVERALL",  `${matchInSights.home}`, `${matchInSights.away}`];
  
    // Function to toggle preference
    const togglePreference = (playerUid) => {
      setPreferredPlayers((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(playerUid)) {
          newSet.delete(playerUid); // Remove if already preferred
        } else {
          newSet.add(playerUid); // Add if not preferred
        }
        return newSet;
      });
    };
  
    // Filter data based on activeTab and innerTab
    const filteredData = data.filter((player) => {
      const hasBattles =
        activeTab === "BATSMAN vs BOWLER"
          ? player.battle_bowl.length > 0
          : player.battle_bat.length > 0;
      if (innerTab === "OVERALL") {
        return hasBattles;
      }
      return hasBattles && player.team_abbr === innerTab;
    });
  
    return (
      <div className="container mx-auto mt-[-20px] p-4">
        {/* Header */}
        <div className="text-center mt-5">
          <h2 className="text-2xl font-bold text-gray-800">KEY PLAYER BATTLES</h2>
          <p className="text-sm text-gray-600">
            Key match ups between top batsman and bowlers since May 2022
          </p>
        </div>
  
        {/* Main Tabs */}
        <div className="flex justify-center mt-4 border-b">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === tab
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
  
        {/* Inner Tabs and Content */}
        <div className="mt-4">
          <div className="flex justify-center space-x-4 border-b">
            {innerTabs.map((tab) => (
              <button
                key={tab}
                className={`px-3 py-1 text-sm ${
                  innerTab === tab
                    ? "text-blue-600 border-b-2 border-blue-600 font-semibold"
                    : "text-gray-600"
                }`}
                onClick={() => setInnerTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
  
          {/* Legend */}
          <div className="flex justify-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <img
                src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_bat.png"
                alt="Bat Icon"
                className="w-5 h-5"
              />
              <span className="text-sm text-gray-700">Batsman Dominates</span>
            </div>
            <div className="flex items-center space-x-2">
              <img
                src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic-ball.png"
                alt="Ball Icon"
                className="w-5 h-5"
              />
              <span className="text-sm text-gray-700">Bowler Dominates</span>
            </div>
          </div>
  
          {/* Player Battles */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredData.map((player) => {
              const battles =
                activeTab === "BATSMAN vs BOWLER"
                  ? player.battle_bowl
                  : player.battle_bat;
              const sortedBattles = [...battles].sort((a, b) => {
                if (activeTab === "BATSMAN vs BOWLER") {
                  return b.sr - a.sr;
                } else {
                  return b.wk - a.wk;
                }
              });
              const isPreferred = preferredPlayers.has(player.player_uid); // Check if player is preferred
  
              return (
                <div
                  key={player.player_uid}
                  className="border rounded-lg shadow-md p-4 bg-white"
                >
                  {/* Player Header */}
                  <div className="flex items-center justify-between">
                    <div>
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
                      <h3 className="text-lg font-bold">{player.full_name}</h3>
                      </Link>
                      <p className="text-sm text-gray-600">
                        {player.team_abbr} • {player.batting_style}{" "}
                        {player.bowling_style && `• ${player.bowling_style}`} • Sal ₹
                        {player.salary}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold">
                        Rank {player.power_rank}
                      </span>
                      <img
                        src={
                          isPreferred
                            ? "https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_prefer.svg"
                            : "https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_prefer_inactive.svg"
                        }
                        alt="Prefer Icon"
                        className="w-6 h-6 cursor-pointer"
                        onClick={() => togglePreference(player.player_uid)}
                      />
                    </div>
                  </div>
  
                  <div className="text-center my-2">
                    <span className="text-xl font-bold text-gray-500">VS</span>
                  </div>
  
                  {/* Battle Stats */}
                  <div className="mt-2">
                    <div className="grid grid-cols-6 gap-2 text-center font-semibold text-gray-700 text-sm">
                      <div></div>
                      <div>RUNS</div>
                      <div>4S/6S</div>
                      <div>SR</div>
                      <div>BALLS</div>
                      <div>WK</div>
                    </div>
                    {sortedBattles.map((battle, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-6 gap-2 text-center text-sm mt-2"
                      >
                        <div className="flex items-center">
                          {(battle.bat_dominate === 1 || battle.bowl_dominate === 1) && (
                            <img
                              src={
                                battle.bat_dominate === 1
                                  ? "https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_bat.png"
                                  : "https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic-ball.png"
                              }
                              alt={battle.bat_dominate === 1 ? "Bat" : "Ball"}
                              className="w-4 h-4 mr-1"
                            />
                          )}
                          <span>{battle.player_name}</span>
                        </div>
                        <div>{battle.runs}</div>
                        <div>{`${battle.fours}/${battle.sixs}`}</div>
                        <div
                          className={`${
                            battle.sr < 100
                              ? "text-red-600"
                              : battle.sr < 130
                              ? "text-yellow-600"
                              : battle.sr < 150
                              ? "text-blue-600"
                              : "text-green-600"
                          }`}
                        >
                          {battle.sr}
                        </div>
                        <div>{battle.balls}</div>
                        <div
                          className={`${
                            battle.wk === 0
                              ? "text-gray-600"
                              : battle.wk === 1
                              ? "text-orange-600"
                              : "text-red-600"
                          }`}
                        >
                          {battle.wk}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  

function PlayerBattle() {
     const [data, setData] = useState(null);
     const [error, setError] = useState(null);
     const [loading, setLoading] = useState(false);
     const location = useLocation();
     const matchInSights = location.state?.matchInSights;


     useEffect(() => {
        if (!matchInSights?.season_game_uid) {
          console.warn("season_game_uid is undefined or null");
          return;
        }
    
        const fetchData = async () => {
          setLoading(true);
          try {
            const response = await axios.post(
              "https://plapi.perfectlineup.in/fantasy/stats/player_battle",
              {
                season_game_uid: matchInSights.season_game_uid,
                league_id: matchInSights.league_id,
                website_id: 1,
                sports_id: "7", // Assuming sports_id is always 7
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
          } catch (error) {
            console.error("API Error:", error);
            setError(error.message || "An error occurred while fetching data.");
          } finally {
            setLoading(false);
          }
        };
    
        fetchData();
      }, [matchInSights?.season_game_uid]);

      const playerData = data?.player_battle.sort((a,b)=> a.power_rank - b.power_rank)

        // Render error/loading states if needed
  if (loading) {
    return <div className="text-center text-gray-600">Loading...</div>;
  }
  if (error) {
    return <div className="text-red-500 text-center">Error: {error}</div>;
  }
  if (!matchInSights) {
    return null;
  }


  return (
    <main className="flex-grow container mx-auto px-4 sm:px-6 py-6">
    <header className="w-full">
      <FixtureHeader matchInSights={matchInSights} />
    </header>

        {data && (
            <PlayerBattles data={playerData} matchInSights={matchInSights} />
        )}
    </main>
  )
}

// <PlayerList players={data} onSelect={setSelectedPlayer} />

export default PlayerBattle
