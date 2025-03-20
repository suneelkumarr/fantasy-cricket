import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

// Helper: format date as "Mar 7’" from "YYYY-MM-DD HH:mm:ss"
function formatLeagueDate(dateString) {
  if (!dateString) return "";
  const dateObj = new Date(dateString);
  const options = { month: "short", day: "numeric" };
  return `${dateObj.toLocaleString("en-US", options)}’`; // add the apostrophe
}

// Helper: generate an array of years from the current year down to 2020
function getYearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i);
}

/** A reusable table component for batting/bowling/fielding stats */
const StatsTable = ({ headers, data }) => {
  if (!headers?.length || !data?.length) {
    return <p className="text-gray-500 text-sm mt-2">No data available.</p>;
  }

  return (
    <div className="overflow-x-auto border rounded mt-2">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-gray-100 border-b">
          <tr>
            {headers.map((head, i) => (
              <th key={i} className="py-2 px-3 font-medium text-gray-700">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-b last:border-0">
              {headers.map((head, colIdx) => (
                <td key={colIdx} className="py-2 px-3">
                  {row[head] !== undefined ? row[head] : "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function ByCompetition() {
  const location = useLocation();

  // Store details in state to preserve them on reload
  const [playerDetails] = useState(location.state?.playerInfo || null);
  const [matchDetails] = useState(location.state?.matchID || null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState("2025");
  const [openSection, setOpenSection] = useState(null);

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
            fav_detail: 1,
            player_uid: playerDetails.player_uid,
            power_rank_detail: 1,
            tab_info: "competition",
            website_id: 1,
            year: selectedYear || null, // FIXED: Using selectedYear
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
  }, [matchDetails, playerDetails?.player_uid, selectedYear]); // FIXED: added selectedYear dependency

  if (loading)
    return <div className="text-center text-gray-600 my-4">Loading...</div>;
  if (error)
    return <div className="text-red-500 text-center my-4">Error: {error}</div>;
  if (!data) return null;

  const stats_data = data?.stats_data || {};
  const compData = stats_data?.competition || {};
  const leagueStats = compData?.stats || [];

  const handleToggle = (section) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const years = getYearOptions();

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded p-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b pb-3 mb-3">
          <h1 className="text-base font-semibold text-gray-800">
            Showing player stats based on the leagues played by the player.
          </h1>
          <div className="mt-2 sm:mt-0">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Header Row (League, Rank, Fantasy Pts) */}
        <div className="hidden sm:flex text-gray-600 font-medium text-sm border-b pb-2 justify-between">
          <div className="w-2/5">League</div>
          <div className="w-1/5 text-center">Rank</div>
          <div className="w-1/5 text-right">Fantasy Pts</div>
        </div>

        {leagueStats.map((league, idx) => (
          <div key={idx} className="py-2 text-sm">
            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center justify-between">
              <div className="w-2/5 truncate">
                {league.league_display_name || "N/A"}
              </div>
              <div className="w-1/5 text-center">
                {league.total_rank || "-"}
              </div>
              <div className="w-1/5 text-right">{league.total_fp || "0"}</div>
            </div>

            {/* Mobile Layout */}
            <div className="sm:hidden flex flex-col space-y-1">
              <div className="flex justify-between">
                <span className="font-medium text-gray-800 truncate">
                  {league.league_display_name || "N/A"}
                </span>
                <span className="text-gray-600">{league.total_fp || "0"}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Rank: {league.total_rank || "-"}</span>
              </div>
            </div>

            {/* Sub-row: Date + Team */}
            <div className="mt-1 text-xs text-gray-500">
              {formatLeagueDate(league.league_schedule_date)} |{" "}
              {league.team_name}
            </div>

            {/* Batting/Bowling/Fielding rows */}
            <div className="flex flex-col w-full mt-3 border-t border-gray-200">
              {/* Batting */}
              <div
                className="flex items-center justify-between py-2 px-4 cursor-pointer"
                onClick={() => handleToggle("batting")}
              >
                <div className="font-medium text-gray-600 w-2/5 text-left">
                  Batting
                </div>
                <div className="text-gray-800 font-medium text-center w-1/5">
                  {league.batting_rank}
                </div>
                <div className="flex items-center justify-end w-1/5">
                  <div className="font-medium text-gray-800 mr-4">
                    {league.batting_fp}
                  </div>
                  <div className="text-lg text-gray-400">
                    {openSection === "batting" ? "-" : "+"}
                  </div>
                </div>
              </div>

              {/* Bowling */}
              <div
                className="flex items-center justify-between py-2 px-4 cursor-pointer"
                onClick={() => handleToggle("bowling")}
              >
                <div className="font-medium text-gray-600 w-2/5 text-left">
                  Bowling
                </div>
                <div className="text-gray-800 font-medium text-center w-1/5">
                  {league.bowling_rank}
                </div>
                <div className="flex items-center justify-end w-1/5">
                  <div className="font-medium text-gray-800 mr-4">
                    {league.bowling_fp}
                  </div>
                  <div className="text-lg text-gray-400">
                    {openSection === "bowling" ? "-" : "+"}
                  </div>
                </div>
              </div>

              {/* Fielding */}
              <div
                className="flex items-center justify-between py-2 px-4 cursor-pointer"
                onClick={() => handleToggle("fielding")}
              >
                <div className="font-medium text-gray-600 w-2/5 text-left">
                  Fielding
                </div>
                <div className="text-gray-800 font-medium text-center w-1/5">
                  {league.fielding_rank}
                </div>
                <div className="flex items-center justify-end w-1/5">
                  <div className="font-medium text-gray-800 mr-4">
                    {league.fielding_fp}
                  </div>
                  <div className="text-lg text-gray-400">
                    {openSection === "fielding" ? "-" : "+"}
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Stats (if clicked) */}
            {openSection === "batting" && (
              <StatsTable
                headers={compData.batting_header}
                data={league.batting_stats}
              />
            )}

            {openSection === "bowling" && (
              <StatsTable
                headers={compData.bowling_header}
                data={league.bowling_stats}
              />
            )}

            {openSection === "fielding" && (
              <StatsTable
                headers={compData.fielding_header}
                data={league.fielding_stats}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
