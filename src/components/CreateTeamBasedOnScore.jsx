import React, { useState, useEffect, useCallback, useMemo  } from "react";
import { useLocation, Link , useNavigate} from "react-router-dom";
import axios from "axios";


 // 1) Keep your getCountdownTime function
const getCountdownTime = (scheduledDate) => {
    const now = new Date();
    const targetDate = new Date(scheduledDate);
  
    // Adjust for +5:30 if needed
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
  
  function FixtureHeader({ fixtureDetails, data }) {
    const navigate = useNavigate();
  
    // Handle missing data
    if (!data) return null;
  
    // (A) Parse toss_data if it's not "[]"
    let tossText = "";
    if (data.toss_data && data.toss_data !== "[]") {
      try {
        const parsed = JSON.parse(data.toss_data);
        tossText = parsed?.text || "";
      } catch (error) {
        console.error("Failed to parse toss_data JSON:", error);
      }
    }
  
    // (B) Toggle between "Lineup Out" and tossText every 1s (if conditions match)
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
  
    // (C) Decide which text to show in the bubble
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
  
    // (D) Create a state for the countdown and update it every second
    const [countdown, setCountdown] = useState("");
  
    useEffect(() => {
      // Set the initial countdown immediately
      setCountdown(getCountdownTime(fixtureDetails.season_scheduled_date));
  
      // Update the countdown every second
      const countdownInterval = setInterval(() => {
        setCountdown(getCountdownTime(fixtureDetails.season_scheduled_date));
      }, 1000);
  
      // Cleanup on unmount
      return () => clearInterval(countdownInterval);
    }, [fixtureDetails.season_scheduled_date]);
  
    return (
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 bg-white">
        {/* Top row: back arrow + center (home icon, "Home vs Away", away icon) */}
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
  
        {/* Live-updating countdown in red, centered */}
        <div className="text-center mt-1 text-red-500 font-semibold text-sm sm:text-base">
          {countdown}
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


  const CreateTeamScore = ({ fixtureDetails, matchDataArray }) => {
    // We'll assume matchDataArray has at least one element
    const matchData = matchDataArray[0];
  
    // Memoize homeTeam and awayTeam so they don't change on every render
    const homeTeam = useMemo(() => ({
      id: matchData.home_uid,
      abbr: matchData.home_abbr,
      name: matchData.home_team,
      flag: matchData.home_flag,
    }), [matchData]);
  
    const awayTeam = useMemo(() => ({
      id: matchData.away_uid,
      abbr: matchData.away_abbr,
      name: matchData.away_team,
      flag: matchData.away_flag,
    }), [matchData]);
  
    // Put them in an array for easy mapping
    const teams = [homeTeam, awayTeam];
  
    // State: Which team is selected to bat first? Default to homeTeam
    const [selectedTeam, setSelectedTeam] = useState(homeTeam);
  
    // State: user inputs for Runs/Wickets
    const [runsInning1, setRunsInning1] = useState("");
    const [wicketsInning1, setWicketsInning1] = useState("");
    const [runsInning2, setRunsInning2] = useState("");
    const [wicketsInning2, setWicketsInning2] = useState("");
  
    // State: recommended possibilities (derived from score_predictions)
    const [recommendedPossibilities, setRecommendedPossibilities] = useState([]);
  
    // State: slider for number of teams
    const [numTeams, setNumTeams] = useState(1);
  
    // Compute recommended possibilities whenever selectedTeam or matchData changes.
    useEffect(() => {
      if (!matchData.score_predictions) return;
  
      // The second-innings team is the one *not* selected
      const secondTeam = selectedTeam.id === homeTeam.id ? awayTeam : homeTeam;
  
      // Get predictions using the selectedTeam's ID
      const predictions = matchData.score_predictions[selectedTeam.id];
  
      if (predictions && predictions.length) {
        const newPossibilities = predictions.map((pred, index) => {
          const firstInningsData = pred[selectedTeam.id];
          const secondInningsData = pred[secondTeam.id];
  
          return {
            id: index + 1,
            title: `${index + 1} Possibility`,
            scores: {
              firstInnings: `${selectedTeam.abbr} ${firstInningsData.score}/${firstInningsData.wickets}`,
              secondInnings: `${secondTeam.abbr} ${secondInningsData.score}/${secondInningsData.wickets}`,
            },
          };
        });
  
        setRecommendedPossibilities(newPossibilities);
      } else {
        setRecommendedPossibilities([]);
      }
    }, [selectedTeam, matchData, homeTeam, awayTeam]);
  
    // Handler: Apply a recommended possibility to the input fields
    const handleApplyPossibility = (scores) => {
      const [teamA, scoreA] = scores.firstInnings.split(" ");
      const [runsA, wicketsA] = scoreA.split("/");
      const [teamB, scoreB] = scores.secondInnings.split(" ");
      const [runsB, wicketsB] = scoreB.split("/");
  
      setRunsInning1(runsA || "");
      setWicketsInning1(wicketsA || "");
      setRunsInning2(runsB || "");
      setWicketsInning2(wicketsB || "");
    };
  
    // Simple "Next" handler
    const handleNext = () => {
      alert("Proceeding to next step...");
    };
  
    return (
      <div className="min-h-screen w-full bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* (A) TOSS SCENARIO */}
          <div className="bg-white rounded shadow p-4">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-blue-600 font-bold text-lg">1.</span>
              <span className="font-semibold text-gray-700">
                Toss Scenario (bat first)
              </span>
            </div>
            <div className="flex space-x-4">
              {teams.map((team) => (
                <div
                  key={team.id}
                  onClick={() => setSelectedTeam(team)}
                  className={`cursor-pointer flex flex-col items-center justify-center p-3 rounded border-2 transition ${
                    selectedTeam.id === team.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <img
                    src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${team.flag}`}
                    alt={team.name}
                    className="w-8 h-8 mb-1 rounded-full"
                  />
                  <span
                    className={`text-sm font-medium ${
                      selectedTeam.id === team.id
                        ? "text-blue-600"
                        : "text-gray-600"
                    }`}
                  >
                    {team.abbr}
                  </span>
                </div>
              ))}
            </div>
          </div>
  
          {/* (B) YOUR PREDICTED SCORE */}
          <div className="bg-white rounded shadow p-4">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-blue-600 font-bold text-lg">2.</span>
              <span className="font-semibold text-gray-700">
                Your Predicted Score
              </span>
            </div>
  
            {/* Innings Container */}
            <div className="space-y-4">
              {/* 1st Innings */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border p-3 rounded">
                <div className="mb-2 sm:mb-0 text-gray-700">
                  1st Innings - <span className="font-semibold">{selectedTeam.abbr}</span>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Runs"
                    value={runsInning1}
                    onChange={(e) => setRunsInning1(e.target.value)}
                    className="border rounded px-2 py-1 w-20"
                  />
                  <input
                    type="number"
                    placeholder="Wkts"
                    value={wicketsInning1}
                    onChange={(e) => setWicketsInning1(e.target.value)}
                    className="border rounded px-2 py-1 w-20"
                  />
                </div>
              </div>
  
              {/* 2nd Innings */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border p-3 rounded">
                <div className="mb-2 sm:mb-0 text-gray-700">
                  2nd Innings -{" "}
                  <span className="font-semibold">
                    {selectedTeam.id === homeTeam.id ? awayTeam.abbr : homeTeam.abbr}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Runs"
                    value={runsInning2}
                    onChange={(e) => setRunsInning2(e.target.value)}
                    className="border rounded px-2 py-1 w-20"
                  />
                  <input
                    type="number"
                    placeholder="Wkts"
                    value={wicketsInning2}
                    onChange={(e) => setWicketsInning2(e.target.value)}
                    className="border rounded px-2 py-1 w-20"
                  />
                </div>
              </div>
            </div>
  
            {/* (C) Recommended Possibilities */}
            <div className="mt-4 p-4 bg-white rounded-lg shadow-md">
              <div className="flex items-center space-x-2 mb-4">
                <img
                  src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/icon_AI.webp"
                  alt="AI"
                  className="w-5 h-5"
                />
                <span className="text-sm font-semibold text-gray-600">PL Recommends</span>
              </div>
              {recommendedPossibilities.map((poss) => (
                <div
                  key={poss.id}
                  className="flex items-center justify-between border-t border-gray-200 first:border-t-0 py-3"
                >
                  <div>
                    <div className="text-sm font-semibold text-gray-700">{poss.title}</div>
                    <div className="flex space-x-4 text-sm text-gray-600">
                      <span>{poss.scores.firstInnings}</span>
                      <span>{poss.scores.secondInnings}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleApplyPossibility(poss.scores)}
                    className="px-4 py-1 text-sm font-semibold text-blue-600 border border-blue-600 rounded-full hover:bg-blue-50 transition"
                  >
                    APPLY
                  </button>
                </div>
              ))}
            </div>
          </div>
  
          {/* (D) NUMBER OF TEAMS */}
          <div className="bg-white rounded shadow p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600 font-bold text-lg">3.</span>
                  <span className="font-semibold text-gray-700">Number of Teams</span>
                </div>
                <div className="text-sm text-gray-500">
                  Select the number of lineups you would like to generate
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <input
                type="range"
                min="1"
                max="5"
                value={numTeams}
                onChange={(e) => setNumTeams(e.target.value)}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between w-full text-sm text-gray-500">
                <span>1</span>
                <span>5</span>
              </div>
              <div className="text-sm text-gray-700 font-semibold">
                Generate {numTeams} Teams
              </div>
            </div>
          </div>
  
          {/* (E) NEXT BUTTON */}
          <div className="flex justify-end">
            <button
              onClick={handleNext}
              className="bg-blue-500 text-white px-6 py-2 rounded flex items-center space-x-2 hover:bg-blue-600 transition"
            >
              <span>Next</span>
              <div className="flex space-x-1">
                <span>→</span>
                <span>→</span>
                <span>→</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  };


function CreateTeamBasedOnScore() {

      const location = useLocation();
      const matchInSights = location.state?.matchInSights;
      const data = location.state?.data;

      console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++matchInSights", matchInSights)
      console.log("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++data", data)
  return (
    <div className="min-h-screen w-full flex flex-col bg-white">
    {/* Navigation Bar & Fixture Header */}

    {data && (
      <FixtureHeader
        fixtureDetails={matchInSights}
        getCountdownTime={getCountdownTime}
        data={data[0]}
      />
    )}


    <div className="flex flex-col items-center text-center p-4">
    <span className="text-xl font-semibold text-gray-800 mb-2">
      create Team Based on Team Scores
    </span>
    <span className="text-base text-gray-600 max-w-md">
      Pick a toss scenario &amp; predict the score - we’ll build your fantasy lineup based on your predictions
    </span>

    <CreateTeamScore fixtureDetails ={matchInSights }  matchDataArray ={data}/>
  </div>
    </div>
  )
}

export default CreateTeamBasedOnScore
