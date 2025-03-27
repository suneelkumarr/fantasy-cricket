import React, { useState, useEffect , useMemo} from "react";
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


  const PlayerComparisonData = ({ data , matchInSights}) => {
    const [selectedPlayers, setSelectedPlayers] = useState([null, null]);
    
    const getPlayerData = (playerUid) => {
      return data.player_list.find(player => player.player_uid === playerUid.toString());
    };
  
    const handlePlayerSelect = (player, index) => {
      const newSelected = [...selectedPlayers];
      newSelected[index] = player;
      setSelectedPlayers(newSelected);
    };
  
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-6">
        {/* Comparison Section */}
        <div className="bg-gray-100 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-center mb-6">Try your own comparison</h2>
          
          <div className="flex flex-col md:flex-row justify-center gap-6 mb-6">
            {[0, 1].map(index => (
              <div key={index} className="w-full md:w-64">
                <div className="bg-white rounded-lg shadow-md p-4 text-center">
                  <img 
                    src={selectedPlayers[index]?.jersey 
                      ? `https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/${selectedPlayers[index].jersey}`
                      : "https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/comparison-gray-tsht.png"
                    } 
                    alt="Player" 
                    className="w-32 h-32 mx-auto mb-4"
                  />
                  {!selectedPlayers[index] && (
                    <button className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-4">
                      <i className="icon-plus-ic">+</i>
                    </button>
                  )}
                  <div className="font-semibold">
                    {selectedPlayers[index]?.full_name || `Player ${index + 1}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <button className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600">
              Compare Your Player
            </button>
          </div>
        </div>
  
        {/* Suggested Comparisons */}
        <div>
          <h3 className="text-xl font-bold mb-2">Suggested Comparisons</h3>
          <p className="text-gray-600 mb-6">These are A.I suggested comparisons of players</p>
  
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.comparison.map((pair, index) => {
              const player1 = getPlayerData(pair[0]);
              const player2 = getPlayerData(pair[1]);
  
              return (
                <div key={index} className="bg-white rounded-lg shadow-md p-4 flex flex-col md:flex-row items-center">
                  {[player1, player2].map((player, idx) => (
                    <div key={idx} className={`flex-1 ${idx === 0 ? 'md:pr-4' : 'md:pl-4'} w-full md:w-auto`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-sm truncate">{player.full_name}</div>
                        <img 
                          src={`https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_prefer${idx === 0 ? '' : '_inactive'}.svg`}
                          alt="prefer"
                          className="w-6 h-6 cursor-pointer"
                        />
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="bg-gray-200 px-2 py-1 rounded text-xs">{player.position}</span>
                        <span className="text-sm">Sal ₹{player.salary}</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center text-sm">
                          <i className="icon-power-ranking mr-1"></i>
                          {player.power_rank}
                        </div>
                        <span className="text-sm">{player.team_abbr}</span>
                      </div>
                      <img 
                        src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/${player.jersey}`}
                        alt="jersey"
                        className="w-24 h-24 mx-auto"
                      />
                      <button 
                        className="mt-2 w-full bg-blue-500 text-white py-1 rounded text-sm"
                        onClick={() => handlePlayerSelect(player, idx)}
                      >
                        Select
                      </button>
                    </div>
                  ))}
                  <div className="my-4 md:my-0 md:mx-4 font-bold text-gray-500">VS</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  

function PlayerComparation() {
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
              "https://plapi.perfectlineup.in/fantasy/stats/get_comparison_player_list",
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
        <PlayerComparisonData data={data} matchInSights={matchInSights} />
    )}
    </main>
  )
}

export default PlayerComparation
