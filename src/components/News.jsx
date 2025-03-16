import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import Getlocation from './Getlocation.jsx';

// Helper to format "YYYY-MM-DD HH:mm:ss" -> "July 20, 2022", etc.
function formatDate(dateTimeString) {
  if (!dateTimeString) return "Unknown Date";
  const date = new Date(dateTimeString.replace(" ", "T"));
  if (isNaN(date)) return "Invalid Date"; // Handle invalid dates
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// A small inline SVG component resembling your "no news" illustration
function NoNewsIllustration() {
  return (
    <svg
      width="200"
      height="200"
      viewBox="0 0 300 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto mb-4"
    >
      {/* A simplified placeholder illustration.
          You can tweak shapes/colors as you prefer. */}
      <circle cx="150" cy="150" r="150" fill="#f5f5f5" />
      <g>
        <circle cx="150" cy="100" r="30" fill="#d9d9d9" />
        <rect x="120" y="140" width="60" height="80" rx="8" fill="#fff" stroke="#ccc" />
        <rect x="125" y="145" width="50" height="20" rx="4" fill="#f5f5f5" />
        <path
          d="M140 175 a10 10 0 0 1 20 0"
          stroke="#ccc"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M175 180 L190 195"
          stroke="#F87171"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <text x="145" y="105" fill="#333" fontSize="20" fontWeight="bold">
          ?
        </text>
      </g>
    </svg>
  );
}

function News() {
  const location = useLocation();
  console.log(Getlocation())

  // Store details in state to preserve them on reload
  const [playerDetails] = useState(location.state?.playerInfo || null);
  const [matchDetails] = useState(location.state?.matchID || null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!matchDetails || !playerDetails?.player_uid) {
      console.warn("MatchID or PlayerID is missing. Skipping API call.");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.post(
          "https://plapi.perfectlineup.in/fantasy/stats/get_perfectlineup_playercard",
          {
            season_game_uid: matchDetails,
            sports_id: null,
            fav_detail: 0,
            player_uid: playerDetails.player_uid,
            power_rank_detail: 0,
            tab_info: "news",
            website_id: 1,
            year: null,
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
  }, [matchDetails, playerDetails?.player_uid]);

  const stats_news = data?.stats_data?.news || []; // Ensure it's an array

  return (
    <>
      {loading && <div className="text-center text-gray-600 my-4">Loading...</div>}
      {error && <div className="text-red-500 text-center my-4">Error: {error}</div>}

      <div className="max-w-3xl mx-auto p-4">
        {stats_news.length > 0 ? (
          stats_news.map((item, index) => (
            <div key={index} className="bg-white shadow rounded p-4 mb-6">
              {/* Headline */}
              <h2 className="text-xl font-semibold text-gray-800 mb-1">
                {item.headline || "No headline available"}
              </h2>

              {/* Meta info */}
              <div className="flex items-center text-sm text-gray-500 space-x-3 mb-2">
                <span className="font-semibold text-gray-600">
                  {item.team_name || "Unknown Team"}
                </span>
                <span>{formatDate(item.news_date_time)}</span>
              </div>

              {/* Notes */}
              {item.notes && <p className="text-sm text-gray-700 mb-3">{item.notes}</p>}

              {/* Analysis */}
              {item.analysis && (
                <div>
                  <p className="text-sm font-bold text-gray-600 mb-1">Analysis</p>
                  <p className="text-sm text-gray-700">{item.analysis}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center mt-8">
            {/* Our illustration */}
            <NoNewsIllustration />
            <p className="text-gray-600 text-center">
              No news available for selected player
            </p>
          </div>
        )}
      </div>
    </>
  );
}

export default News;
