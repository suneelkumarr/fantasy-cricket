import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FiChevronRight } from "react-icons/fi";
import Getlocation from "./Getlocation.jsx";

function FixtureHeader({ fixtureDetails, getCountdownTime, data }) {
  const navigate = useNavigate();

  // Ensure data is defined before processing
  if (!data) return null;

  // 1) Parse toss_data if it's not "[]"
  let tossText = "";
  if (data.toss_data && data.toss_data !== "[]") {
    try {
      const parsed = JSON.parse(data.toss_data);
      tossText = parsed?.text || "";
    } catch (error) {
      console.error("Failed to parse toss_data JSON:", error);
    }
  }

  // 2) State & interval to toggle between "Lineup Out" and tossText every 1 second
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

  // 3) Decide which text to show in the bubble
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
      {/* Top row: arrow + center (home icon, "Home vs Away", away icon) */}
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

      {/* Countdown in red, centered */}
      <div className="text-center mt-1 text-red-500 font-semibold text-sm sm:text-base">
        {getCountdownTime(fixtureDetails.season_scheduled_date)}
      </div>

      {/* Bubble underneath - toggling text with 1s transition */}
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


// Helper hook to update number of slides based on window width
// Mapping for position abbreviations to full position names
const POSITION_MAP = {
  WK: "Wicket Keeper",
  BAT: "Batsman",
  AR: "All Rounder",
  BOW: "Bowler",
};

/** TeamCard: Renders a single team's data */
/** Renders a single team's data */
function TeamCard({ team, teamIndex, totalTeams, glHeadings }) {
  // Remaining salary if total is 100
  const remainingSalary = 100 - team.salary_costs;

  // Group players by position
  const groupedPlayers = {};
  team.players.forEach((player) => {
    if (!groupedPlayers[player.position]) {
      groupedPlayers[player.position] = [];
    }
    groupedPlayers[player.position].push(player);
  });

  // Order in which we display positions
  const orderedPositions = ["WK", "BAT", "AR", "BOW"];

  return (
    <div className="relative bg-white bg-opacity-90 shadow p-4 rounded w-full max-w-md mx-auto text-center">
      <div className="mb-2">
        <h2 className="text-lg font-bold">
          TEAM {teamIndex + 1} ({glHeadings[team.algo_applied]})
        </h2>
      </div>
      <div className="mb-4">
        <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded inline-block">
          ₹{remainingSalary} Remaining
        </span>
      </div>

      {/* Grouped players */}
      {orderedPositions.map((pos) => {
        const players = groupedPlayers[pos] || [];
        if (players.length === 0) return null;

        return (
          <div key={pos} className="mb-3">
            <div className="font-medium text-sm mb-1">
              {POSITION_MAP[pos] || pos}
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {players.map((player) => (
                <div
                  key={player.player_id}
                  className="flex flex-col items-center text-xs"
                >
                  <div className="relative">
                    <img
                      className="w-10 h-10 object-cover rounded-full"
                      src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/${player.jersey}`}
                      alt={player.display_name}
                    />
                    {/* C/VC labels */}
                    {player.C === 1 && (
                      <span className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] px-1 rounded">
                        C
                      </span>
                    )}
                    {player.C === 2 && (
                      <span className="absolute top-0 right-0 bg-green-500 text-white text-[10px] px-1 rounded">
                        VC
                      </span>
                    )}
                  </div>
                  <div className="text-center">{player.display_name}</div>
                  <div className="text-gray-500">₹{player.salary}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="mt-4 flex justify-center gap-4">
        <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
          Save to my team
        </button>
        <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
          EXPORT TO
        </button>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        {teamIndex + 1} / {totalTeams}
      </div>
    </div>
  );
}

function TeamCardSL({ team, teamIndex, totalTeams}) {
  // Remaining salary if total is 100
  const remainingSalary = 100 - team.salary_costs;

  // Group players by position
  const groupedPlayers = {};
  team.players.forEach((player) => {
    if (!groupedPlayers[player.position]) {
      groupedPlayers[player.position] = [];
    }
    groupedPlayers[player.position].push(player);
  });

  // Order in which we display positions
  const orderedPositions = ["WK", "BAT", "AR", "BOW"];

  return (
    <div className="relative bg-white bg-opacity-90 shadow p-4 rounded w-full max-w-md mx-auto text-center">
      <div className="mb-2">
      </div>
      <div className="mb-4">
        <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded inline-block">
          ₹{remainingSalary} Remaining
        </span>
      </div>

      {/* Grouped players */}
      {orderedPositions.map((pos) => {
        const players = groupedPlayers[pos] || [];
        if (players.length === 0) return null;

        return (
          <div key={pos} className="mb-3">
            <div className="font-medium text-sm mb-1">
              {POSITION_MAP[pos] || pos}
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {players.map((player) => (
                <div
                  key={player.player_id}
                  className="flex flex-col items-center text-xs"
                >
                  <div className="relative">
                    <img
                      className="w-10 h-10 object-cover rounded-full"
                      src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/${player.jersey}`}
                      alt={player.display_name}
                    />
                    {/* C/VC labels */}
                    {player.C === 1 && (
                      <span className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] px-1 rounded">
                        C
                      </span>
                    )}
                    {player.C === 2 && (
                      <span className="absolute top-0 right-0 bg-green-500 text-white text-[10px] px-1 rounded">
                        VC
                      </span>
                    )}
                  </div>
                  <div className="text-center">{player.display_name}</div>
                  <div className="text-gray-500">₹{player.salary}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="mt-4 flex justify-center gap-4">
        <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
          Save to my team
        </button>
        <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
          EXPORT TO
        </button>
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        {teamIndex + 1} / {totalTeams}
      </div>
    </div>
  );
}


/** Displays exactly ONE team at a time, with left/right arrows */
function Carousel({ teams, glHeadings }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalTeams = teams.length;

  const nextSlide = () => {
    if (currentIndex < totalTeams - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!teams || teams.length === 0) {
    return <div className="text-center text-gray-500">No teams available</div>;
  }

  return (
    <div className="relative flex items-center justify-center w-full mt-6">
      {/* Single TeamCard */}
      <TeamCard
        team={teams[currentIndex]}
        teamIndex={currentIndex}
        totalTeams={totalTeams}
        glHeadings={glHeadings}
      />

      {/* Left arrow */}
      <button
        onClick={prevSlide}
        disabled={currentIndex === 0}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-300 p-2 rounded disabled:opacity-50"
        aria-label="previous"
      >
        &lt;
      </button>

      {/* Right arrow */}
      <button
        onClick={nextSlide}
        disabled={currentIndex === totalTeams - 1}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-300 p-2 rounded disabled:opacity-50"
        aria-label="next"
      >
        &gt;
      </button>
    </div>
  );
}


function CarouselSL({ teams }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalTeams = teams.length;

  const nextSlide = () => {
    if (currentIndex < totalTeams - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!teams || teams.length === 0) {
    return <div className="text-center text-gray-500">No teams available</div>;
  }

  return (
    <div className="relative flex items-center justify-center w-full mt-6">
      {/* Single TeamCard */}
      <TeamCardSL
        team={teams[currentIndex]}
        teamIndex={currentIndex}
        totalTeams={totalTeams}
      />

      {/* Left arrow */}
      <button
        onClick={prevSlide}
        disabled={currentIndex === 0}
        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-300 p-2 rounded disabled:opacity-50"
        aria-label="previous"
      >
        &lt;
      </button>

      {/* Right arrow */}
      <button
        onClick={nextSlide}
        disabled={currentIndex === totalTeams - 1}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-300 p-2 rounded disabled:opacity-50"
        aria-label="next"
      >
        &gt;
      </button>
    </div>
  );
}



function Glmatch({fixtureDetails}){

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fixtureDetails?.season_game_uid) {
      console.warn("season_game_uid is undefined or null");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.post(
          "https://plapi.perfectlineup.in/fantasy/lobby/get_user_fixture_data",
          {
            season_game_uid: fixtureDetails.season_game_uid,
            website_id: 1,
            sports_id: "7", // Assuming sports_id is always 7
            fixture_detail: "",
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
  }, [fixtureDetails?.season_game_uid]);

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
    
    {data &&data.gl_count > 0 &&

      (
        <Carousel teams={data.gl_team} glHeadings={data.gl_headings} />
      )
    }
    
    </>


  )
}

function SLmatch({fixtureDetails}){

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fixtureDetails?.season_game_uid) {
      console.warn("season_game_uid is undefined or null");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.post(
          "https://plapi.perfectlineup.in/fantasy/lobby/get_sl_teams",
          {
            season_game_uid: fixtureDetails.season_game_uid,
            no_of_teams: 2
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
  }, [fixtureDetails?.season_game_uid]);

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
    
    {data &&

      (
        <CarouselSL teams={data.sl_teams}/>
      )
    }
    
    </>


  )
}


function MatchDetails() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const fixtureDetails = location.state?.fixtureDetails;
  const [selectedLeague, setSelectedLeague] = useState("GL");

  const Leage= ["GL", "SL"]

  // Function to get the current timestamp in IST
  const getCurrentTimestampInIST = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes offset
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.getTime();
  };

  useEffect(() => {
    const hasSeasonGameUid =
      fixtureDetails?.season_game_uid || fixtureDetails?.es_season_game_uid;
    if (!hasSeasonGameUid) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const timestamp = getCurrentTimestampInIST();
        const response = await axios.get(
          `https://plineup-prod.blr1.digitaloceanspaces.com/appstatic/plprod_match_7_${
            fixtureDetails?.season_game_uid
              ? fixtureDetails?.season_game_uid
              : fixtureDetails?.es_season_game_uid
          }.json?${timestamp}`
        );

        console.log("API response: ", response.data);
        // Store response.data in an array for mapping convenience
        setData([response.data]);
      } catch (error) {
        setError(error.message || "An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fixtureDetails?.season_game_uid, fixtureDetails?.es_season_game_uid]);

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

  // Render loading and error states
  if (loading) {
    return (
      <div className="text-center mt-4 text-lg font-semibold">Loading...</div>
    );
  }
  if (error) {
    return <div className="text-red-500 text-center mt-4">Error: {error}</div>;
  }
  if (!data || data.length === 0) {
    return null;
  }

  const menuItems = [
    { label: "Squad", icon: "📋", header: "squad" },
    {
      label: "Stats Playground",
      icon: "📊",
      isNew: true,
      header: "stats-playground",
    },
    { label: "Cheat Sheet", icon: "📝", header: "players-analyzer" },
    { label: "PL Power Ranking", icon: "⚡", header: "players-performace" },
    {
      label: "Venue & Pitch Report",
      icon: "🏟️",
      subLabel: data[0].ground_name,
      header: "venue",
    },
    {
      label: "Batting Order, Powerplay and Death Bowling",
      icon: "🏏",
      header: "batting-order",
    },
    { label: "Team H2H", icon: "🤝", header: "team-h2h" },
    { label: "All Player Overview", icon: "👥", header: "player-pick" },
    { label: "Bowler Corner", icon: "🎯", header: "bowler-corner" },
    {
      label: "Team Stats",
      icon: "📈",
      note: "Use Laptop / Desktop to open this",
      header: "datatable",
    },
  ];



  return (
    <div className="min-h-screen w-full flex flex-col bg-white">
      {/* Navigation Bar & Fixture Header */}

      {data && (
        <FixtureHeader
          fixtureDetails={fixtureDetails}
          getCountdownTime={getCountdownTime}
          data={data[0]}
        />
      )}

      {/* KEY MATCH INSIGHTS */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        {data.map((item) => (
          <Link
            key={item.season_game_uid}
            to={`/insight-match/Cricket/${item.season_game_uid}/${item.home}_vs_${item.away}/${item.league_id}`}
            state={{ matchInSights: item }}
            className="block"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-[#F5F7FA] h-32 shadow-lg rounded-md">
              <div className="flex items-center space-x-3">
                <img
                  src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_stopwatch.svg"
                  alt="Stopwatch"
                  className="w-20 h-20"
                />
                <div className="flex flex-col justify-center">
                  <span className="text-[#1D2B4F] text-3xl sm:text-4xl font-bold italic">
                    KEY MATCH INSIGHTS
                  </span>
                  <span className="text-[#1D2B4F] text-xl sm:text-2xl font-bold italic">
                    IN 2 MINS
                  </span>
                </div>
              </div>
              <div>
                <img
                  src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/arrow.svg"
                  alt="Arrow"
                  className="w-5 h-5"
                />
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      
      
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Lineup Generator
        </h2>
        <div className="mb-4">
        <h3 className="text-2xl font-bold">Algorithm Suggested Teams</h3>
        <p className="text-gray-600">
          A selection of 11 teams, which have a good chance of winning according to our algorithm, are ready.
        </p>
      </div>

       {/* League Tabs */}
          <div className="player-specification-list w-full max-w-4xl mx-auto">
            <div className="tab-container mb-4  mt-4">
              {/* 
      flex items-center => sets up a flex container
      bg-gray-100 p-1 => a light gray background with padding
      rounded-full => rounded "pill" shape
    */}
              <div className="flex items-center bg-gray-100 p-1 rounded-full">
                {Leage.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedLeague(tab)}
                    className={`
            flex-1                /* Each button fills an equal portion of the row */
            text-center           /* Center text within each button */
            px-4 py-2 text-sm font-medium focus:outline-none 
            transition-colors duration-200
            ${
              selectedLeague === tab
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


        {selectedLeague  === "GL" && (
          <Glmatch fixtureDetails={fixtureDetails}/>
        )}

        {selectedLeague  === "SL" && (
          <SLmatch fixtureDetails={fixtureDetails}/>
        )}

        </div>



      {/* DATA AND ANALYTICS SECTION */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          DATA AND ANALYTICS
        </h2>
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <Link
              key={`menu-${item.header}-${data[0].season_game_uid}-${index}`}
              to={`/${item.header}/Cricket/${data[0].season_game_uid}/${data[0].home}_vs_${data[0].away}/${data[0].league_id}`}
              state={{ matchInSights: data[0] }}
              className="block"
            >
              <li className="flex items-center justify-between bg-white rounded-lg shadow p-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                  <div className="text-2xl">{item.icon}</div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-800">
                      {item.label}
                      {item.isNew && (
                        <span className="ml-2 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                          NEW
                        </span>
                      )}
                    </span>
                    {item.subLabel && (
                      <span className="text-sm text-gray-500">
                        {item.subLabel}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <FiChevronRight className="text-gray-400" />
                  {item.note && (
                    <span className="text-xs text-gray-400 mt-1 italic">
                      {item.note}
                    </span>
                  )}
                </div>
              </li>
            </Link>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default MatchDetails;
