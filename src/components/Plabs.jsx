import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
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

function FixtureHeader({ fixtureDetails }) {
  const navigate = useNavigate();

  // Handle missing data
  if (!fixtureDetails) return null;

  // (A) Parse toss_data if it's not "[]"
  let tossText = "";
  if (fixtureDetails.toss_data && fixtureDetails.toss_data !== "[]") {
    try {
      const parsed = JSON.parse(fixtureDetails.toss_data);
      tossText = parsed?.text || "";
    } catch (error) {
      console.error("Failed to parse toss_data JSON:", error);
    }
  }

  // (B) Toggle between "Lineup Out" and tossText every 1s (if conditions match)
  const [showLineup, setShowLineup] = useState(true);
  useEffect(() => {
    let interval;
    if (
      fixtureDetails.playing_announce === "1" &&
      fixtureDetails.toss_data !== "[]"
    ) {
      interval = setInterval(() => {
        setShowLineup((prev) => !prev);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fixtureDetails.playing_announce, fixtureDetails.toss_data]);

  // (C) Decide which text to show in the bubble
  let bubbleText = "Playing 11 is not announced";
  if (fixtureDetails.playing_announce === "1") {
    if (fixtureDetails.toss_data === "[]") {
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

const DynamicCard = ({
  link,
  title,
  description,
  imageSrc,
  backgroundColor,
  matchInSights,
}) => {
  // Choose a random background color if none is provided.
  const bgColor = useMemo(() => {
    if (backgroundColor) return backgroundColor;
    const colors = ["#CDE9D5", "#FDEABF", "#D4F0FA", "#E1C6FF", "#FFDFDF"];
    return colors[Math.floor(Math.random() * colors.length)];
  }, [backgroundColor]);
  // Split description by <br> to support line breaks.
  const descriptionLines = description.split("<br>");
  console.log(matchInSights)

  return (
    <Link
      key={matchInSights.season_game_uid}
      to={`${link}/${matchInSights.home}_vs_${matchInSights.away}/${matchInSights.season_game_uid}/${matchInSights.league_id}`}
      state={{ matchInSights: matchInSights, matchLink:`https://www.perfectlineup.in/${link}/${matchInSights.home}_vs_${matchInSights.away}/${matchInSights.season_game_uid}/${matchInSights.league_id}` }}
      className="block"
    >
      <div
        className="w-full p-6 rounded-lg shadow-md transition-transform transform hover:scale-105 hover:shadow-xl"
        style={{ backgroundColor: bgColor }}
      >
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <img src={imageSrc} alt={title} className="h-12 w-12 mb-3" />

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>

          {/* Description */}
          <p className="text-gray-700">
            {descriptionLines.map((line, idx) => (
              <React.Fragment key={idx}>
                {line.trim()}
                {idx < descriptionLines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        </div>
      </div>
    </Link>
  );
};

const CardContainer = ({ matchInSights }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      <DynamicCard
        link="/pl-labs-mobile/score-predictor"
        title="Score and Win Predictor"
        description="Get forecasts of match scores and <br>victory margins with our AI-driven, <br>user friendly tools"
        imageSrc="https://www.perfectlineup.in/web/assets/front/images/pl-ic2.svg"
        backgroundColor="#E1C6FF"
        matchInSights={matchInSights}
      />

      <DynamicCard
        link="/pl-labs-mobile/coverage-index"
        title="PL Coverage Index"
        description="Discover high impact players easily <br>based on potential for significant <br>game involvement"
        imageSrc="https://www.perfectlineup.in/web/assets/front/images/pl-ic1.svg"
        backgroundColor="#CDE9D5"
        matchInSights={matchInSights}
      />

      <DynamicCard
        link="/pl-labs-mobile/player-combination"
        title="Player Combinations"
        description="This guide is super useful for identifying <br>player combinations that are likely to score big."
        imageSrc="https://www.perfectlineup.in/web/assets/front/images/player-combination.svg"
        backgroundColor="#FDEABF"
        matchInSights={matchInSights}
      />

      <DynamicCard
        link="/pl-labs-mobile/captain-suggestion"
        title="Captain Suggestions"
        description="Identify the perfect captain pick for your fantasy<br> team by answering 5 quick questions on<br> your team strategy and match conditions."
        imageSrc="https://www.perfectlineup.in/web/assets/front/images/pl-ic1.svg"
        backgroundColor="#D4F0FA"
        matchInSights={matchInSights}
      />
    </div>
  );
};

function Plabs() {
    const location = useLocation();
    const matchInSights = location.state?.matchInSights;
  
    // useEffect(() => {
    //     window.location.reload(); // This is called every time the component mounts
    //   }, []);
  
    return (
      <div className="min-h-screen w-full flex flex-col bg-white">
        {/* Navigation Bar & Fixture Header */}
        {matchInSights && (
          <FixtureHeader
            fixtureDetails={matchInSights}
            getCountdownTime={getCountdownTime}
          />
        )}
  
        <div className="flex flex-col items-center text-center p-4">
          <span className="text-xl font-semibold text-gray-800 mb-2">
            Perfect Labs
          </span>
        </div>
  
        <CardContainer matchInSights={matchInSights} />
      </div>
    );
  }

export default Plabs;
