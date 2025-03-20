import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios";
import FantasyFilters from "./FantasyFilters.jsx"; // Adjust the path if necessary

function StatsPlayground() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const matchInSights = location.state?.matchInSights;
  console.log(matchInSights);

  useEffect(() => {
    const hasSeasonGameUid =
      matchInSights?.season_game_uid || matchInSights?.es_season_game_uid;
    if (!hasSeasonGameUid) {
      console.warn("season_game_uid is undefined or null");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.post(
          "https://plapi.perfectlineup.in/fantasy/stats/stats_playground_master_data",
          {
            season_game_uid: matchInSights?.season_game_uid
              ? matchInSights?.season_game_uid
              : matchInSights?.es_season_game_uid,
            league_id: matchInSights.league_id,
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

        setData(response.data.data);
      } catch (error) {
        console.error("API Error:", error);
        setError(error.message || "An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [matchInSights?.season_game_uid, matchInSights?.es_season_game_uid]);

  const getCountdownTime = (scheduledDate) => {
    const now = new Date();
    const targetDate = new Date(scheduledDate);
    targetDate.setHours(targetDate.getHours() + 5); // Convert to IST (UTC +5:30)
    targetDate.setMinutes(targetDate.getMinutes() + 30);

    const diff = targetDate - now;

    if (diff <= 0) return "Event Started";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  if (loading) {
    return <div className="text-center text-gray-600">Loading...</div>;
  }
  if (error) {
    return <div className="text-red-500 text-center">Error: {error}</div>;
  }
  if (!matchInSights) {
    return null;
  }

  console.log("++++++++++++++++++++++", data);

  return (
    <div className="w-full min-h-screen flex flex-col bg-white overflow-hidden items-start justify-start">
      <div className="flex items-center p-4 border-b w-full max-w-screen-lg mx-auto justify-between sm:justify-center mt-4">
        <Link
          key={
            matchInSights?.season_game_uid
              ? matchInSights?.season_game_uid
              : matchInSights?.es_season_game_uid
          }
          to={`/fixture-info/Cricket/${
            matchInSights?.season_game_uid
              ? matchInSights?.season_game_uid
              : matchInSights?.es_season_game_uid
          }/${matchInSights.home}_vs_${matchInSights.away}/${
            matchInSights.league_id
          }`}
          state={{ fixtureDetails: matchInSights }}
          className="p-2 rounded-lg shadow-md bg-white hover:bg-gray-100 flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>

        <div className="flex items-center flex-grow justify-between w-full px-2 sm:px-6">
          <div className="flex items-center space-x-2">
            <img
              src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${matchInSights.home_flag}`}
              alt={`${matchInSights.home} flag`}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
            />
            <span className="font-semibold text-sm sm:text-lg">
              {matchInSights.home}
            </span>
          </div>

          <div className="text-center">
            <div className="text-red-500 font-bold text-sm sm:text-lg">
              {getCountdownTime(matchInSights.season_scheduled_date)}
            </div>
            <div className="text-gray-600 text-xs sm:text-sm mt-1">
              {(() => {
                const utcDate = new Date(matchInSights.season_scheduled_date);
                const istDate = new Date(
                  utcDate.getTime() + 5.5 * 60 * 60 * 1000
                );
                return istDate.toLocaleString("en-IN");
              })()}
            </div>
            <div className="text-gray-500 text-xs sm:text-sm">
              {matchInSights.league_name} -{" "}
              {matchInSights.format === "1"
                ? "Test"
                : matchInSights.format === "2"
                ? "ODI"
                : matchInSights.format === "3"
                ? "T20"
                : matchInSights.format === "4"
                ? "T10"
                : matchInSights.format}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sm sm:text-lg">
              {matchInSights.away}
            </span>
            <img
              src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${matchInSights.away_flag}`}
              alt={`${matchInSights.away} flag`}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
            />
          </div>
        </div>
      </div>

      <div
        className={`w-full flex justify-center -mt-4 px-3 py-1 text-sm rounded-md ${
          Number(matchInSights.playing_announce) === 1
            ? "text-green-700 bg-green-100"
            : "text-gray-700 bg-gray-100"
        }`}
      >
        {Number(matchInSights.playing_announce) === 1
          ? "Playing 11 is announced"
          : "Playing 11 is not announced"}
      </div>

      {data && <FantasyFilters data={data} matchInSights={matchInSights} />}
    </div>
  );
}

export default StatsPlayground;
