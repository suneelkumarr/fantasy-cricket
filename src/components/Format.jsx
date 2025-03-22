import React, { useState } from "react";
import { TrendingUp, ArrowRight, Star } from "lucide-react";
import FantasyBreakDown from "./FantasyBreakDown"; // Import your modal component
import { Link } from "react-router-dom";
import Getlocation from "./Getlocation.jsx";

function Format({ data, matchInSights, playerInfo, formatState }) {
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Define the tab labels based on format
  const formatLabel = (format) => {
    switch (format) {
      case "1":
        return "Test";
      case "2":
        return "ODI";
      case "3":
        return "T20";
      case "4":
        return "T10";
      default:
        return format || "N/A";
    }
  };

  // Function to determine bar width based on points
  const getBarWidth = (points) => {
    const pointsValue = parseInt(points);
    const maxPoints = Math.max(
      ...data.stats_data.form.format_stats.map((item) =>
        parseInt(item.fantasy_points)
      )
    );

    // Set negative points to display minimally
    if (pointsValue <= 0) return "0%";

    // Calculate percentage width, with maximum points being 100%
    const percentage = Math.max(5, (pointsValue / maxPoints) * 100);
    return `${percentage}%`;
  };

  // Function to determine bar color
  const getBarColor = (team) => {
    // Different color for BCC team
    if (team === 1) return "bg-sky-300";
    return "bg-sky-600";
  };

  // Format date from "2024-08-23 09:00:00" to "Aug 23"
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Uncomment if you need to see the returned value
  // console.log(Getlocation());

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Title */}
        <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-center text-gray-700 mb-2">
          Last {data.stats_data.graph.format_stats.dream_team?.total_matches} Matches Performance -{" "}
          {formatLabel(data.player_detail?.format)}
        </h2>
        <span className="block text-xs sm:text-sm text-gray-700 text-center mx-auto mb-4">
          Tap on the graph to see more details
        </span>

        {/* Top Stats Row */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* In Dream Team */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700">
                In Dream Team
              </h3>
              <TrendingUp className="ml-2 h-4 w-4 text-emerald-500" />
            </div>
            <div className="relative h-5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`absolute top-0 left-0 h-full rounded-l-full ${
                  (() => {
                    const value = data.stats_data.graph.format_stats.dream_team.value;
                    const maxMatches =
                      data.stats_data.graph.format_stats.dream_team.total_matches;
                    const percentage = (value / maxMatches) * 100;
                    if (percentage < 33) return "bg-red-500";
                    if (percentage < 66) return "bg-yellow-500";
                    return "bg-emerald-500";
                  })()
                }`}
                style={{
                  width: `${
                    (data.stats_data.graph.format_stats.dream_team.value /
                      data.stats_data.graph.format_stats.dream_team.total_matches) *
                    100
                  }%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 mt-1">
              {Array.from(
                {
                  length:
                    data.stats_data.graph.format_stats.dream_team?.total_matches + 1 || 0,
                },
                (_, i) => (
                  <span key={i}>{i}</span>
                )
              )}
            </div>
            <div className="text-center mt-1 text-xs sm:text-sm font-semibold whitespace-nowrap">
              {data.stats_data.graph.format_stats.dream_team?.value} Times
            </div>
          </div>

          {/* Bottom 20% */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700">
                Bottom 20%
              </h3>
              <TrendingUp className="ml-2 h-4 w-4 text-emerald-500" />
            </div>
            <div className="relative h-5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`absolute top-0 left-0 h-full rounded-l-full ${
                  (() => {
                    const value =
                      data.stats_data.graph.format_stats.underperformed.value;
                    const maxMatches =
                      data.stats_data.graph.format_stats.underperformed.total_matches;
                    const percentage = (value / maxMatches) * 100;
                    if (percentage < 33) return "bg-emerald-500";
                    if (percentage < 66) return "bg-yellow-500";
                    return "bg-red-500";
                  })()
                }`}
                style={{
                  width: `${
                    (data.stats_data.graph.format_stats.underperformed.value /
                      data.stats_data.graph.format_stats.underperformed.total_matches) *
                    100
                  }%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 mt-1">
              {Array.from(
                {
                  length:
                    data.stats_data.graph.format_stats.underperformed?.total_matches + 1 ||
                    0,
                },
                (_, i) => (
                  <span key={i}>{i}</span>
                )
              )}
            </div>
            <div className="text-center mt-1 text-xs sm:text-sm font-semibold whitespace-nowrap">
              {data.stats_data.graph.format_stats.underperformed?.value} Times
            </div>
          </div>
        </div>

        {/* Bottom Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {/* Batting First */}
          <div className="bg-gray-100 p-4 rounded-lg w-full">
            <div className="flex items-center mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700">
                Batting First
              </h3>
              <TrendingUp className="ml-2 h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-center shadow-md h-16 sm:h-20 flex flex-col items-center justify-center">
              <div className="text-2xl sm:text-3xl font-bold text-gray-800">
                {data.stats_data.graph.format_stats.bat_first_fpts?.value}
              </div>
              <div className="text-xs text-gray-500">Avg FPts</div>
            </div>
          </div>

          {/* Chasing */}
          <div className="bg-gray-100 p-4 rounded-lg w-full">
            <div className="flex items-center mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700">
                Chasing
              </h3>
              <ArrowRight className="ml-2 h-4 w-4 text-amber-500" />
            </div>
            <div className="text-center shadow-md h-16 sm:h-20 flex flex-col items-center justify-center">
              <div className="text-2xl sm:text-3xl font-bold text-gray-800">
                {data.stats_data.graph.format_stats.bowl_first_fpts?.value}
              </div>
              <div className="text-xs text-gray-500">Avg FPts</div>
            </div>
          </div>

          {/* Position Rank */}
          <div className="bg-gray-100 p-4 rounded-lg w-full">
            <div className="flex items-center mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-700">
                Position Rank
              </h3>
              <TrendingUp className="ml-2 h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-center shadow-md h-16 sm:h-20 flex flex-col items-center justify-center">
              <div className="text-2xl sm:text-3xl font-bold text-gray-800">
                {data.stats_data.graph.format_stats.avg_position_rank?.value}
              </div>
              <div className="text-xs text-gray-500">
                / {data.stats_data.graph.format_stats.avg_position_rank?.graph_total}{" "}
                {data?.player_detail?.position === "BAT"
                  ? "Batsman"
                  : data?.player_detail?.position === "BOW"
                  ? "Bowler"
                  : data?.player_detail?.position === "AR"
                  ? "All Rounder"
                  : "Batsman"}
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-gray-600 mb-6 text-xs sm:text-base">
          Tap on the bar to see detailed Stats
        </div>

        {/* Filter Tags */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#0cbfeb" }}></div>
            <span className="text-xs sm:text-sm text-gray-600">
              {formatLabel(matchInSights?.format)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#6ad5ef" }}></div>
            <span className="text-xs sm:text-sm text-gray-600">Batting First</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#0792b4" }}></div>
            <span className="text-xs sm:text-sm text-gray-600">Chasing</span>
          </div>
          <div className="flex items-center space-x-2">
            <Star className="h-3 w-3 text-yellow-500" />
            <span className="text-xs sm:text-sm text-gray-600">PerfectLineup</span>
          </div>
        </div>

        {/* Similar Matches Table */}
        <div className="w-full bg-white rounded-lg shadow-lg p-4 overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-left min-w-[300px]">
            <thead className="text-gray-500 border-b">
              <tr>
                <th className="py-2 px-2 sm:px-4">Versus</th>
                <th className="py-2 px-2 sm:px-4 text-center">Fantasy Points</th>
                <th className="py-2 px-2 sm:px-4 text-center">Overall Rank</th>
                <th className="py-2 px-2 sm:px-4 text-center">Position Rank</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-gray-100">
                <td
                  colSpan="4"
                  className="py-2 px-2 sm:px-4 font-semibold text-gray-700 text-left"
                >
                  Similar Matches
                </td>
              </tr>
              {formatState.map((match, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-2 sm:px-4">
                    <Link
                      to={`/player/${playerInfo?.player_uid}/${
                        (playerInfo?.full_name
                          ? playerInfo.full_name
                          : playerInfo.display_name
                        ).replace(/\s+/g, "_")}/${matchInSights?.season_game_uid}/form`}
                      state={{
                        stats_player_id: match.player_id,
                        stats_season_id: match.stats_season_id,
                        matchInSights: matchInSights,
                      }}
                      className="text-blue-500 hover:underline"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedPlayer(match);
                      }}
                    >
                      <div className="font-medium">{match.against_team_abbr}</div>
                      <div className="text-[10px] text-gray-500">
                        {formatDate(match.season_scheduled_date)}
                      </div>
                    </Link>
                  </td>
                  <td className="py-2 px-2 sm:px-4 relative">
                    <div className="flex items-center relative w-full">
                      <div
                        className={`h-4 sm:h-5 ${getBarColor(
                          match.batting_first
                        )} rounded-md`}
                        style={{ width: getBarWidth(match.fantasy_points), minWidth: "8px" }}
                      />
                      <span className="absolute right-1 flex items-center font-semibold text-[10px] sm:text-xs">
                        {match.in_perfect_lineup === "1" && (
                          <span className="text-yellow-400 mr-1">★</span>
                        )}
                        {match.fantasy_points}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-2 sm:px-4 text-center font-medium">
                    {match.player_rank}
                  </td>
                  <td className="py-2 px-2 sm:px-4 text-center font-medium">
                    {match.position_rank}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Popup Modal */}
        {selectedPlayer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto relative">
              <button
                className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-lg"
                onClick={() => setSelectedPlayer(null)}
              >
                ✖
              </button>
              <FantasyBreakDown selectedPlayer={selectedPlayer} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Format;
