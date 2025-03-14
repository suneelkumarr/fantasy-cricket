import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timerTrigger, setTimerTrigger] = useState(0); // State to trigger countdown updates


  // Function to get the current timestamp in IST
  const getCurrentTimestampInIST = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds (5 hours 30 minutes)
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.getTime(); // Return timestamp in milliseconds
  };

  useEffect(() => {
    setLoading(true);
    // Generate the dynamic timestamp in IST
    const timestamp = getCurrentTimestampInIST();

    axios
      .get(
        `https://plineup-prod.blr1.digitaloceanspaces.com/appstatic/plprod_lobby_fixture_list_7.json?${timestamp}`
      )
      .then((response) => {
        setData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message || "An error occurred while fetching data.");
        setLoading(false);
      });
  }, []);

  // Set up a timer to update the countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTrigger((prev) => prev + 1); // Increment the trigger to force re-render
    }, 1000);

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  const getCountdownTime = (scheduledDate) => {
    const now = new Date();

    // Convert scheduledDate from UTC to IST (UTC +5:30)
    const targetDate = new Date(scheduledDate);
    targetDate.setHours(targetDate.getHours() + 5);
    targetDate.setMinutes(targetDate.getMinutes() + 30);

    const diff = targetDate - now;

    if (diff <= 0) {
      return "Event Started";
    }

    // Calculate days, hours, minutes, and seconds
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // Return formatted countdown string
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {loading && <div className="text-center">Loading...</div>}
      {error && <div className="text-red-500 text-center">Error: {error}</div>}

      {data &&
        data.map((item) => (
          <Link
            key={item.season_game_uid}
            to={`/fixture-info/Cricket/${item.season_game_uid}/${item.home}_vs_${item.away}/${item.league_id}`}
            state={{ fixtureDetails: item }}
            className="flex justify-between items-center border rounded-lg p-4 shadow-md mb-4 bg-white"
          >
            <div className="flex items-center space-x-2">
              <img
                src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${item.home_flag}`}
                alt={`${item.home} flag`}
                className="w-8 h-8"
              />
              <span className="font-bold text-lg">{item.home}</span>
            </div>
            <div className="text-center flex-1">
              <div className="text-red-500 font-bold">
                {getCountdownTime(item.season_scheduled_date)}
              </div>
              <div className="text-gray-600 text-sm mt-1">
                {(() => {
                  const utcDate = new Date(item.season_scheduled_date); // Parse UTC date
                  const istDate = new Date(
                    utcDate.getTime() + 5.5 * 60 * 60 * 1000
                  ); // Add 5 hours 30 minutes
                  return istDate.toLocaleString("en-IN"); // Convert to readable IST format
                })()}
              </div>
              <div className="text-gray-500 text-xs">
                {item.league_name} -
                {item.format === "1"
                  ? "Test"
                  : item.format === "2"
                  ? "ODI"
                  : item.format === "3"
                  ? "T20"
                  : item.format === "4"
                  ? "T10"
                  : item.format}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg">{item.away}</span>
              <img
                src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${item.away_flag}`}
                alt={`${item.away} flag`}
                className="w-8 h-8"
              />
            </div>
          </Link>
        ))}
    </div>
  );
}

export default Home;
