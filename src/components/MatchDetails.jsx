import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronRight } from "react-icons/fi";

// FixtureHeader Component
const FixtureHeader = ({ fixtureDetails, getCountdownTime, data }) => {
  const navigate = useNavigate();
  const [showLineup, setShowLineup] = useState(true);

  // Parse toss_data safely
  const tossText = useMemo(() => {
    if (!data?.toss_data || data.toss_data === "[]") return "";
    try {
      return JSON.parse(data.toss_data)?.text || "";
    } catch (error) {
      console.error("Failed to parse toss_data:", error);
      return "";
    }
  }, [data?.toss_data]);

  // Toggle lineup/toss text
  useEffect(() => {
    if (data?.playing_announce !== "1" || !tossText) return;
    const interval = setInterval(() => setShowLineup((prev) => !prev), 1000);
    return () => clearInterval(interval);
  }, [data?.playing_announce, tossText]);

  // Determine bubble text
  const bubbleText = useMemo(() => {
    if (data?.playing_announce !== "1") return "Playing 11 is not announced";
    return tossText && !showLineup ? tossText : "Lineup Out";
  }, [data?.playing_announce, showLineup, tossText]);

  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 bg-gradient-to-r from-blue-50 to-gray-50 rounded-lg shadow-lg"
    >
      <div className="flex items-center">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate("/")}
          className="mr-3 p-2 rounded-full hover:bg-gray-200 transition"
          aria-label="Go back"
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
        <div className="flex-1 flex items-center justify-center space-x-2">
          <img
            src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${fixtureDetails.home_flag}`}
            alt={fixtureDetails.home}
            className="w-6 h-6 rounded-full"
            loading="lazy"
            onError={(e) => (e.target.src = "/fallback-flag.png")}
          />
          <span className="font-semibold text-base sm:text-lg text-gray-800">
            {fixtureDetails.home} vs {fixtureDetails.away}
          </span>
          <img
            src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${fixtureDetails.away_flag}`}
            alt={fixtureDetails.away}
            className="w-6 h-6 rounded-full"
            loading="lazy"
            onError={(e) => (e.target.src = "/fallback-flag.png")}
          />
        </div>
      </div>

      <motion.div
        className="text-center mt-1 text-red-500 font-semibold text-sm sm:text-base"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        {getCountdownTime(fixtureDetails.season_scheduled_date)}
      </motion.div>

      <div className="flex justify-center mt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={bubbleText}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-full shadow-md text-sm sm:text-base font-medium"
          >
            {bubbleText}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// TeamCard Component
const POSITION_MAP = {
  WK: "Wicket Keeper",
  BAT: "Batsman",
  AR: "All Rounder",
  BOW: "Bowler",
};

const TeamCard = ({ team, teamIndex, totalTeams, glHeadings, isGL = false }) => {
  const remainingSalary = 100 - team.salary_costs;

  // Group players by position
  const groupedPlayers = useMemo(() => {
    const groups = {};
    team.players.forEach((player) => {
      groups[player.position] = groups[player.position] || [];
      groups[player.position].push(player);
    });
    return groups;
  }, [team.players]);

  const orderedPositions = ["WK", "BAT", "AR", "BOW"];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative bg-white bg-opacity-95 shadow-lg p-4 sm:p-6 rounded-xl w-full max-w-md sm:max-w-lg mx-auto text-center"
    >
      {isGL && glHeadings && (
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">
            TEAM {teamIndex + 1} ({glHeadings[team.algo_applied]})
          </h2>
        </div>
      )}
      <div className="mb-4">
        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
          ₹{remainingSalary} Remaining
        </span>
      </div>

      {orderedPositions.map((pos) => {
        const players = groupedPlayers[pos] || [];
        if (!players.length) return null;

        return (
          <div key={pos} className="mb-4">
            <div className="font-semibold text-sm sm:text-base text-gray-700 mb-2">
              {POSITION_MAP[pos] || pos}
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
              {players.map((player) => (
                <motion.div
                  key={player.player_id}
                  whileHover={{ scale: 1.05 }}
                  className="flex flex-col items-center text-xs sm:text-sm"
                >
                  <div className="relative">
                    <img
                      className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-full border border-gray-200"
                      src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/${player.jersey}`}
                      alt={player.display_name}
                      loading="lazy"
                      onError={(e) => (e.target.src = "/fallback-player.png")}
                    />
                    {player.C === 1 && (
                      <span className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] sm:text-xs px-1 rounded-full">
                        C
                      </span>
                    )}
                    {player.C === 2 && (
                      <span className="absolute top-0 right-0 bg-green-500 text-white text-[10px] sm:text-xs px-1 rounded-full">
                        VC
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-gray-800">{player.display_name}</div>
                  <div className="text-gray-500">₹{player.salary}</div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="mt-4 flex flex-col sm:flex-row justify-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm sm:text-base font-medium hover:bg-blue-700 transition"
          onClick={() => alert("Save to My Team functionality TBD")} // Placeholder
        >
          Save to My Team
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm sm:text-base font-medium hover:bg-blue-700 transition"
          onClick={() => alert("Export functionality TBD")} // Placeholder
        >
          Export
        </motion.button>
      </div>

      <div className="mt-4 text-xs sm:text-sm text-gray-500">
        {teamIndex + 1} / {totalTeams}
      </div>
    </motion.div>
  );
};

// Carousel Component
const Carousel = ({ teams, glHeadings, isGL = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalTeams = teams?.length || 0;

  const nextSlide = useCallback(() => {
    if (currentIndex < totalTeams - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, totalTeams]);

  const prevSlide = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  if (!teams || !totalTeams) {
    return (
      <div className="text-center text-gray-500 py-6">No teams available</div>
    );
  }

  return (
    <div className="relative flex items-center justify-center w-full mt-6 sm:mt-8">
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.4 }}
      >
        <TeamCard
          team={teams[currentIndex]}
          teamIndex={currentIndex}
          totalTeams={totalTeams}
          glHeadings={glHeadings}
          isGL={isGL}
        />
      </motion.div>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={prevSlide}
        disabled={currentIndex === 0}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-gray-700 text-white p-2 sm:p-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Previous team"
      >
        &lt;
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={nextSlide}
        disabled={currentIndex === totalTeams - 1}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-gray-700 text-white p-2 sm:p-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Next team"
      >
        &gt;
      </motion.button>
    </div>
  );
};

// Glmatch Component
const Glmatch = ({ fixtureDetails }) => {
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
            sports_id: "7",
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
        setData(response.data.data);
      } catch (error) {
        console.error("API Error:", error);
        setError("Failed to load GL teams.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fixtureDetails?.season_game_uid]);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }
  if (error) {
    return <div className="text-center text-red-500 py-4">{error}</div>;
  }
  if (!data || data.gl_count === 0) {
    return <div className="text-center text-gray-600 py-4">No GL teams available.</div>;
  }

  return <Carousel teams={data.gl_team} glHeadings={data.gl_headings} isGL={true} />;
};

// SLmatch Component
const SLmatch = ({ fixtureDetails }) => {
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
            no_of_teams: 2,
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
        console.error("API Error:", error);
        setError("Failed to load SL teams.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fixtureDetails?.season_game_uid]);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }
  if (error) {
    return <div className="text-center text-red-500 py-4">{error}</div>;
  }
  if (!data) {
    return <div className="text-center text-gray-600 py-4">No SL teams available.</div>;
  }

  return <Carousel teams={data.sl_teams} />;
};

// MatchDetails Component
const MatchDetails = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { state } = useLocation();
  const fixtureDetails = state?.fixtureDetails;
  const [selectedLeague, setSelectedLeague] = useState("GL");

  const getCurrentTimestampInIST = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    return new Date(now.getTime() + istOffset).getTime();
  };

  useEffect(() => {
    if (!fixtureDetails?.season_game_uid && !fixtureDetails?.es_season_game_uid) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const timestamp = getCurrentTimestampInIST();
        const response = await axios.get(
          `https://plineup-prod.blr1.digitaloceanspaces.com/appstatic/plprod_match_7_${
            fixtureDetails.season_game_uid || fixtureDetails.es_season_game_uid
          }.json?${timestamp}`
        );
        setData([response.data]);
      } catch (error) {
        setError("Failed to load match details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fixtureDetails]);

  const getCountdownTime = useCallback((scheduledDate) => {
    const now = new Date();
    const targetDate = new Date(scheduledDate);
    targetDate.setHours(targetDate.getHours() + 5, targetDate.getMinutes() + 30);

    const diff = targetDate - now;
    if (diff <= 0) return "Event Started";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }
  if (error) {
    return <div className="text-center mt-8 text-red-500 text-lg">{error}</div>;
  }
  if (!data) {
    return null;
  }

  const menuItems = [
    { label: "Squad", icon: "📋", header: "squad" },
    { label: "Stats Playground", icon: "📊", isNew: true, header: "stats-playground" },
    { label: "Cheat Sheet", icon: "📝", header: "players-analyzer" },
    { label: "PL Power Ranking", icon: "⚡", header: "players-performace" },
    { label: "Venue & Pitch Report", icon: "🏟️", subLabel: data[0].ground_name, header: "venue" },
    { label: "Batting Order, Powerplay and Death Bowling", icon: "🏏", header: "batting-order" },
    { label: "Team H2H", icon: "🤝", header: "team-h2h" },
    { label: "All Player Overview", icon: "👥", header: "player-pick" },
    { label: "Bowler Corner", icon: "🎯", header: "bowler-corner" },
    { label: "Team Stats", icon: "📈", note: "Use Laptop / Desktop to open this", header: "datatable" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen w-full flex flex-col bg-gray-100"
    >
      <FixtureHeader fixtureDetails={fixtureDetails} getCountdownTime={getCountdownTime} data={data[0]} />

      {/* Key Match Insights */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {data.map((item) => (
          <Link
            key={item.season_game_uid}
            to={`/insight-match/Cricket/${item.season_game_uid}/${item.home}_vs_${item.away}/${item.league_id}`}
            state={{ matchInSights: item }}
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-gray-50 rounded-lg shadow-lg mb-4"
            >
              <div className="flex items-center space-x-4">
                <img
                  src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_stopwatch.svg"
                  alt="Stopwatch"
                  className="w-16 h-16"
                  loading="lazy"
                />
                <div>
                  <span className="text-2xl sm:text-3xl font-bold text-gray-800">KEY MATCH INSIGHTS</span>
                  <span className="block text-lg sm:text-xl font-bold text-gray-600">IN 2 MINS</span>
                </div>
              </div>
              <img
                src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/arrow.svg"
                alt="Arrow"
                className="w-6 h-6"
              />
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Lineup Generator */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Lineup Generator</h2>
        <p className="text-gray-600 mb-4">A selection of teams with high winning potential, curated by our algorithm.</p>

        <div className="flex gap-2 mb-4">
          {["GL", "SL"].map((tab) => (
            <motion.button
              key={tab}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedLeague(tab)}
              className={`flex-1 p-2 rounded-full text-sm font-medium ${
                selectedLeague === tab ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              {tab}
            </motion.button>
          ))}
        </div>

        {selectedLeague === "GL" && <Glmatch fixtureDetails={fixtureDetails} />}
        {selectedLeague === "SL" && <SLmatch fixtureDetails={fixtureDetails} />}
      </div>

      {/* Team Generator */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Team Generator</h2>
        <p className="text-gray-600 mb-4">Use these tools to create your custom teams.</p>

        <div className="space-y-4">
          <Link
            to={`/create-team-score-based/Cricket/${
              fixtureDetails?.season_game_uid || fixtureDetails?.es_season_game_uid
            }/${fixtureDetails.home}_vs_${fixtureDetails.away}/${fixtureDetails.league_id}`}
            state={{ matchInSights: fixtureDetails, data }}
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex flex-col md:flex-row items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition"
            >
              <img
                alt="Team Score Icon"
                src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_team_score.svg"
                className="h-12 w-12 mr-4"
                loading="lazy"
              />
              <div className="flex-grow">
                <div className="font-semibold text-base sm:text-lg">Create Team Based on Team Scores</div>
                <div className="text-gray-600 text-sm">Draft lineups by predicting final team scores</div>
              </div>
              <span className="text-xs font-semibold text-white bg-gray-700 py-1 px-2 rounded mt-2 md:mt-0">
                BETA
              </span>
            </motion.div>
          </Link>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex flex-col md:flex-row items-start md:items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition"
          >
            <div className="flex items-start md:items-center flex-grow">
              <span className="text-2xl mr-3">🏏</span>
              <div>
                <div className="text-blue-500 font-semibold text-base sm:text-lg">Custom Team Builder</div>
                <div className="text-gray-600 text-sm">Create custom lineups with your favorite players</div>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center">
                    <img
                      className="h-4 w-4"
                      src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_prefer_inactive.svg"
                      alt="Lock Icon"
                    />
                    <span className="ml-2 text-sm">0</span>
                  </div>
                  <div className="flex items-center">
                    <span className="icon-ic_locked mr-1"></span>
                    <span className="text-sm">0</span>
                  </div>
                  <div className="flex items-center">
                    <span className="icon-close text-sm mr-1"></span>
                    <span className="text-sm">0</span>
                  </div>
                </div>
              </div>
            </div>
            <img
              src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/jersey-CTB.png"
              alt="CTB Jersey"
              className="h-12 w-auto mt-2 md:mt-0 md:ml-4"
              loading="lazy"
            />
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition"
          >
            <span className="text-xl mr-4">👕</span>
            <div className="flex-grow">
              <div className="font-semibold text-base sm:text-lg">My Teams</div>
            </div>
            <img
              alt="Arrow"
              src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/arrow.svg"
              className="h-4 w-4"
            />
          </motion.div>
        </div>
      </div>

      {/* Perfect Match Insights */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {data.map((item) => (
          <Link
            key={item.season_game_uid}
            to={`/pl-labs/app/Cricket/${item.season_game_uid}/${item.home}_vs_${item.away}/${item.league_id}`}
            state={{ matchInSights: item }}
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-gray-50 rounded-lg shadow-lg"
            >
              <div className="flex items-center space-x-4">
                <img
                  src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_stopwatch.svg"
                  alt="Stopwatch"
                  className="w-16 h-16"
                  loading="lazy"
                />
                <div>
                  <span className="text-2xl sm:text-3xl font-bold text-gray-800">PERFECT MATCH INSIGHTS</span>
                  <span className="block text-lg sm:text-xl font-bold text-gray-600">Improve games</span>
                </div>
              </div>
              <img
                src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/arrow.svg"
                alt="Arrow"
                className="w-6 h-6"
              />
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Data and Analytics */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Data and Analytics</h2>
        <ul className="grid gap-3">
          {menuItems.map((item) => (
            <Link
              key={item.header}
              to={`/${item.header}/Cricket/${data[0].season_game_uid}/${data[0].home}_vs_${data[0].away}/${data[0].league_id}`}
              state={{ matchInSights: data[0] }}
            >
              <motion.li
                whileHover={{ scale: 1.02, backgroundColor: "#f1f5f9" }}
                className="flex items-center justify-between p-3 bg-white rounded-lg shadow"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <span className="font-semibold text-gray-800">
                      {item.label}
                      {item.isNew && (
                        <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">NEW</span>
                      )}
                    </span>
                    {item.subLabel && <span className="block text-sm text-gray-500">{item.subLabel}</span>}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <FiChevronRight className="text-gray-400 text-xl" />
                  {item.note && <span className="text-xs text-gray-400 italic">{item.note}</span>}
                </div>
              </motion.li>
            </Link>
          ))}
        </ul>
      </div>
    </motion.div>
  );
};

export default MatchDetails;