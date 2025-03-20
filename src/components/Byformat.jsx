import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import Getlocation from "./Getlocation.jsx";

function Byformat() {
  const location = useLocation();

  // Store details in state to preserve them on reload
  const [playerDetails] = useState(location.state?.playerInfo || null);
  const [matchDetails] = useState(location.state?.matchID || null);

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeFormat, setActiveFormat] = useState(null);
  console.log(Getlocation());

  // Helper function to toggle accordion
  const handleToggle = (formatId) => {
    setActiveFormat((prev) => (prev === formatId ? null : formatId));
  };

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
            sports_id: 7, // real sports ID
            fav_detail: 0,
            player_uid: playerDetails.player_uid,
            power_rank_detail: 0,
            tab_info: "format",
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

  if (!data) {
    return <div>Loading...</div>;
  }

  const { player_detail, stats_data } = data;
  const { format: formats } = stats_data;

  // Helper function to render a single table (batting, bowling, or fielding)
  const renderTable = (sectionData, title) => {
    // If there's no header or stats, don't render a table
    if (!sectionData.header?.length || !sectionData.stats?.length) {
      return null;
    }

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between border-b pb-2 mb-2">
          <h2 className="font-bold text-gray-700">{title}</h2>
          {/* 
            If you want to show the "season" from each row, 
            you can decide how to handle multiple rows. 
            For simplicity, we'll display the first row's "SEAS." 
          */}
          <span className="text-sm text-gray-500">
            {sectionData.stats[0]["SEAS."] || ""}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="text-gray-600 border-b">
                {sectionData.header.map((head, index) => (
                  <th key={index} className="py-2 px-4">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sectionData.stats.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b">
                  {sectionData.header.map((head, colIndex) => (
                    <td key={colIndex} className="py-2 px-4">
                      {row[head] !== undefined && row[head] !== null
                        ? row[head]
                        : "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const abbreviations = [
    { short: "SR", full: "Strike Rate" },
    { short: "R", full: "Runs" },
    { short: "M", full: "Matches" },
    { short: "RO", full: "Run Out" },
    { short: "INN", full: "Inning" },
    { short: "WKT", full: "Wicket" },
    { short: "NB", full: "No Ball" },
    { short: "WD", full: "Wide Ball" },
  ];

  return (
    <>
      {loading && (
        <div className="text-center text-gray-600 my-4">Loading...</div>
      )}
      {error && (
        <div className="text-red-500 text-center my-4">Error: {error}</div>
      )}

      <div className="bg-gray-100 min-h-screen p-4">
        {/* Player Name */}
        <div className="border-b pb-3 mb-3 justify-center">
          <p className="text-sm text-gray-600 mt-1">
            Showing stats based on the formats played by the player.
          </p>
        </div>
        <div className="max-w-4xl mx-auto bg-white shadow-md rounded-md p-4">
          {/* Loop through each format (TEST, ODI, T20, T10) */}
          {formats.map((fmt) => (
            <div key={fmt.format} className="mb-2">
              <button
                onClick={() => handleToggle(fmt.format)}
                className="w-full flex justify-between items-center py-2 px-4 text-left"
              >
                <span className="text-lg font-medium">{fmt.format_text}</span>
                <span className="text-lg font-medium">
                  {activeFormat === fmt.format ? "-" : "+"}
                </span>
              </button>

              {/* If the accordion is active, show the stats */}
              {activeFormat === fmt.format && (
                <div className="px-4 py-3 border-t border-b space-y-6">
                  {/* Render Batting, Bowling, and Fielding tables dynamically */}
                  {renderTable(fmt.all_stats.batting, "Batting")}
                  {renderTable(fmt.all_stats.bowling, "Bowling")}
                  {renderTable(fmt.all_stats.fielding, "Fielding")}

                  {/* If all three are empty, you could show a fallback */}
                  {!fmt.all_stats.batting.header.length &&
                    !fmt.all_stats.bowling.header.length &&
                    !fmt.all_stats.fielding.header.length && (
                      <p className="text-gray-600">
                        No stats available for {fmt.format_text}.
                      </p>
                    )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 text-xs text-gray-500 flex flex-wrap">
          {abbreviations.map((abbr, index) => (
            <span key={abbr.short} className="mr-2 mb-1">
              <strong>{abbr.short}</strong> - {abbr.full}
              {index < abbreviations.length - 1 && ", "}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

export default Byformat;
