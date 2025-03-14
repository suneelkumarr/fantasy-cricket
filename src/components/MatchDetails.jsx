import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Link } from "react-router-dom";

function MatchDetails() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const fixtureDetails = location.state?.fixtureDetails;

  // Function to get the current timestamp in IST
  const getCurrentTimestampInIST = () => {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds (5 hours 30 minutes)
    const istTime = new Date(now.getTime() + istOffset);
    return istTime.getTime(); // Return timestamp in milliseconds
  };

  useEffect(() => {
    if (!fixtureDetails?.season_game_uid) return;
  
    const fetchData = async () => {
      setLoading(true);
      try {
        const timestamp = getCurrentTimestampInIST();
        const response = await axios.get(
          `https://plineup-prod.blr1.digitaloceanspaces.com/appstatic/plprod_match_7_${fixtureDetails.season_game_uid}.json?${timestamp}`
        );
        console.log("API Response:", response.data); // Add this line
        setData([response.data]);
      } catch (error) {
        setError(error.message || "An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [fixtureDetails?.season_game_uid]);

  const getCountdownTime = (scheduledDate) => {
    const now = new Date();
  
    // Convert scheduledDate from UTC to IST (UTC +5:30)
    const targetDate = new Date(scheduledDate);
    targetDate.setHours(targetDate.getHours() + 5);
    targetDate.setMinutes(targetDate.getMinutes() + 30);
  
    const diff = targetDate - now;
  
    if (diff <= 0) {
      return 'Event Started';
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
    <div className="w-screen h-screen flex flex-col bg-white overflow-hidden  items-center justify-center">
      {/* Navigation Bar */}
      <div className="flex items-center p-4 border-b w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 justify-center mt-40">
        <button className="mr-4" onClick={() => navigate("/")}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="flex items-center flex-grow justify-between">
          <div className="flex items-center space-x-2">
            <img
              src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${fixtureDetails.home_flag}`}
              alt={`${fixtureDetails.home} flag`}
              className="w-10 h-10 rounded-full"
            />
            <span className="font-semibold text-lg">{fixtureDetails.home}</span>
          </div>

          <div className="text-center">
            <div className="text-red-500 font-bold text-lg sm:text-xl">
              {getCountdownTime(fixtureDetails.season_scheduled_date)}
            </div>
            <div className="text-gray-600 text-sm mt-1">
  {(() => {
    const utcDate = new Date(fixtureDetails.season_scheduled_date); // Parse UTC date
    const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000)); // Add 5 hours 30 minutes
    return istDate.toLocaleString("en-IN"); // Convert to readable IST format
  })()}
</div>


            <div className="text-gray-500 text-xs sm:text-sm">
  {fixtureDetails.league_name} - 
  {fixtureDetails.format === "1" ? "Test" : 
   fixtureDetails.format === "2" ? "ODI" : 
   fixtureDetails.format === "3" ? "T20" : 
   fixtureDetails.format === "4" ? "T10" : fixtureDetails.format}
</div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-semibold text-lg">{fixtureDetails.away}</span>
            <img
              src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${fixtureDetails.away_flag}`}
              alt={`${fixtureDetails.away} flag`}
              className="w-10 h-10 rounded-full"
            />
          </div>
        </div>
      </div>

      {loading && <div className="text-center">Loading...</div>}
      {error && <div className="text-red-500 text-center">Error: {error}</div>}

      {/* Key Match Insights */}

      {data &&
        data.map((item) => (
          <Link
            key={item.season_game_uid}
            to={`/insight-match/Cricket/${item.season_game_uid}/${item.home}_vs_${item.away}/${item.league_id}`}
            state={{ matchInSights: item }}
            className="flex justify-between items-center border rounded-lg p-4 shadow-md mb-4 bg-white"
          >
            <div className="w-screen h-screen flex flex-col bg-white overflow-hidden items-center">
              <div className="bg-white w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                <div className="flex items-center justify-between px-4 py-3 bg-[#F5F7FA] h-32 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <img
                      src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_stopwatch.svg"
                      alt="Stopwatch"
                      className="w-24 h-24"
                    />

                    <div className="flex flex-col justify-center">
                      <span className="text-[#1D2B4F] text-4xl font-bold italic">
                        KEY MATCH INSIGHTS
                      </span>
                      <span className="text-[#1D2B4F] text-2xl font-bold italic">
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
              </div>
            </div>
          </Link>
        ))}
    </div>
  );
}

export default MatchDetails;
