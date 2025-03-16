import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import Getlocation from './Getlocation.jsx';

// Constants
const FORMAT_LABELS = {
  1: "Test",
  2: "ODI",
  3: "T20",
  4: "T10",
};

// API configuration
const API_CONFIG = {
  url: "https://plapi.perfectlineup.in/fantasy/stats/get_fantasy_breakdown",
  headers: {
    sessionkey: "3cd0fb996816c37121c765f292dd3f78",
    moduleaccess: "7",
    "Content-Type": "application/json",
  },
};

function FantasyBreakDown({ selectedPlayer }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const location = useLocation();

  const playerInfo = location.state?.playerInfo;
  const statsPlayerId = selectedPlayer?.player_id;
  const statsSeasonId = selectedPlayer?.season_id;
  console.log(Getlocation())

  // Memoized request body
  const requestBody = useMemo(
    () => ({
      stats_player_id: statsPlayerId,
      stats_season_id: statsSeasonId,
    }),
    [statsPlayerId, statsSeasonId]
  );

  // Fetch Data Function (Optimized with useCallback)
  const fetchData = useCallback(async () => {
    if (!statsPlayerId || !statsSeasonId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(API_CONFIG.url, requestBody, {
        headers: API_CONFIG.headers,
      });

      if (response.data?.data) {
        setData(response.data.data);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("API Error:", err);
      setError(err.response?.data?.message || "Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  }, [requestBody]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Format label helper function
  const formatLabel = (format) => FORMAT_LABELS[format] || "N/A";

  if (loading)
    return <div className="text-center text-gray-600 p-4">Loading...</div>;
  if (error)
    return <div className="text-red-500 text-center p-4">Error: {error}</div>;
  if (!data)
    return (
      <div className="text-center text-gray-600 p-4">No data available</div>
    );

  return (
    <div className="max-w-screen-md lg:max-w-screen-lg mx-auto bg-white rounded shadow-md overflow-auto max-h-[80vh]">
      <div className="p-4">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-800">
          {playerInfo?.full_name || "Player Name"}
        </h1>

        <p className="text-gray-600">
          {data.season?.away || "Away Team"} VS{" "}
          {data.season?.home || "Home Team"}({formatLabel(data.season?.format)})
          - {data.season?.season_scheduled_date || "Scheduled Date"}
        </p>

        <p className="text-gray-500">
          {selectedPlayer?.league_name || "League Name"}
        </p>
        <p className="text-gray-500">
          {data.season?.ground_name || "Ground Name"}
        </p>

        {/* Stats Summary */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center">
            {data.in_perfect_lineup === "1" && (
              <span className="text-yellow-400 text-2xl mr-1">★</span>
            )}
            <span className="text-gray-500">PerfectLineup</span>
          </div>

          <div className="text-center">
            <div className="text-2xl font-semibold">{data.salary || "N/A"}</div>
            <div className="text-gray-500">Salary</div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-semibold">16.47</div>
            <div className="text-gray-500">Player Value</div>
          </div>
        </div>

        {/* Stats Table */}

        <table className="w-full border-collapse table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-center text-gray-700 font-semibold">
                Event
              </th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold">
                Actual
              </th>
              <th className="px-4 py-2 text-center text-gray-700 font-semibold">
                Points
              </th>
            </tr>
          </thead>
          <tbody>
            {data.stats?.map((stat, index) => (
              <React.Fragment key={index}>
                {Object.entries(stat?.breakdown || {}).map(
                  ([category, data]) => (
                    <React.Fragment key={category}>
                      {/* Section Header */}
                      <tr className="bg-gray-200">
                        <td
                          colSpan="3"
                          className="px-4 py-2 text-left font-semibold text-gray-700"
                        >
                          {category}
                        </td>
                      </tr>

                      {/* Stats Rows */}
                      {Object.entries(data).map(([statName, values]) => (
                        <tr key={statName} className="border-b">
                          <td className="px-4 py-2 text-center text-gray-700">
                            {statName}
                          </td>
                          <td className="px-4 py-2 text-center text-gray-700">
                            {values?.value ?? "-"}
                          </td>
                          <td className="px-4 py-2 text-center text-gray-700">
                            {values?.points ?? "-"}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  )
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FantasyBreakDown;
