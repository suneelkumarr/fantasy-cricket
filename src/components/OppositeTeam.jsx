import React, { useState } from "react";
import { TrendingUp, ArrowRight, Star } from "lucide-react";
import FantasyBreakDown from "./FantasyBreakDown"; // Import your modal component
import { Link } from "react-router-dom";

function OppositeTeam({ data, matchInSights, playerInfo }) {
  const [enabled, setEnabled] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const toggleSwitch = () => {
    setEnabled(!enabled);
  };

  // Format label mapping
  const formatLabel = (format = "") => {
    const labels = { 1: "Test", 2: "ODI", 3: "T20", 4: "T10" };
    return labels[format.toString()] || "N/A";
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
    // If team is 1, use rgb(183, 154, 228), else use rgb(114, 67, 186)
    return team === 1 ? "bg-[rgb(183,154,228)]" : "bg-[rgb(114,67,186)]";
  };

  // Format date from "2024-08-23 09:00:00" to "Aug 23"
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };


  const oppositionFormatOverall =
    data?.stats_data?.form?.opposition_overall_stats;
  const oppositionFormat = data?.stats_data?.form?.opposition_stats;

  return (
    <div className="max-w-screen-lg mx-auto min-h-screen flex flex-col overflow-hidden items-center gap-4">
      {/* Toggle Switch */}
      <div className="w-full flex items-center justify-center gap-3">
        <span className="text-sm font-medium">
          {formatLabel(data?.player_detail?.format)}
        </span>
        <button
          type="button"
          className={`relative inline-flex h-6 w-11 items-center rounded-full ${
            enabled ? "bg-indigo-900" : "bg-gray-200"
          }`}
          onClick={toggleSwitch}
          aria-pressed={enabled}
        >
          <span className="sr-only">Toggle setting</span>
          <span
            className={`${
              enabled ? "translate-x-6" : "translate-x-1"
            } inline-block h-4 w-4 transform rounded-full bg-white transition`}
          />
        </button>
        <span className="text-sm text-gray-500">Overall</span>
      </div>

      {/* Display Conditional Data */}
      <div className="max-w-screen-lg mx-auto min-h-screen p-4 bg-gray-100 rounded-lg w-full text-center">
        <h3 className="text-lg font-semibold mb-2">
          {enabled ? "Overall Stats" : "Opposition Stats"}
        </h3>
        {enabled ? (
          <div className="max-w-screen-lg mx-auto min-h-screen w-full min-h-screen text-gray-700">
            <h2 className="text-xl font-semibold text-center text-gray-700">
              Last{" "}
              {data.stats_data.graph.format_stats.dream_team?.total_matches}{" "}
              Matches Performance - {data.player_detail?.opp_abbr}
            </h2>
            <span className="block text-gray-700 text-center mx-auto">
              Tap on the graph to see more details
            </span>

            <div className="max-w-3xl mx-auto p-4 font-sans">
              {/* Top Stats Row */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                {/* In Dream Team */}
                <div>
                  <div className="flex items-center mb-1">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">
                      In Dream Team
                    </h3>
                    <TrendingUp className="ml-2 h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full rounded-l-full ${(() => {
                        const value =
                          data.stats_data.graph.opposition_overall_stats
                            .dream_team.value;
                        const maxMatches =
                          data.stats_data.graph.opposition_overall_stats
                            .dream_team.total_matches;

                        // Calculate percentage for more dynamic color assignment
                        const percentage = (value / maxMatches) * 100;

                        if (percentage < 33) return "bg-red-500";
                        if (percentage < 66) return "bg-yellow-500";
                        return "bg-emerald-500";
                      })()}`}
                      style={{
                        width: `${
                          (data.stats_data.graph.opposition_overall_stats
                            .dream_team.value /
                            data.stats_data.graph.opposition_overall_stats
                              .dream_team.total_matches) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    {Array.from(
                      {
                        length:
                          data.stats_data.graph.opposition_overall_stats
                            .dream_team?.total_matches + 1 || 0,
                      },
                      (_, i) => (
                        <span key={i}>{i}</span>
                      )
                    )}
                  </div>
                  <div className="text-center mt-1 text-sm font-semibold">
                    {
                      data.stats_data.graph.opposition_overall_stats.dream_team
                        ?.value
                    }{" "}
                    Times
                  </div>
                </div>

                {/* Bottom 20% */}
                <div>
                  <div className="flex items-center mb-1">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">
                      Bottom 20%
                    </h3>
                    <TrendingUp className="ml-2 h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full rounded-l-full ${(() => {
                        const value =
                          data.stats_data.graph.opposition_overall_stats
                            .underperformed.value;
                        const maxMatches =
                          data.stats_data.graph.opposition_overall_stats
                            .underperformed.total_matches;

                        // Calculate percentage for more dynamic color assignment
                        const percentage = (value / maxMatches) * 100;

                        if (percentage < 33) return "bg-emerald-500";
                        if (percentage < 66) return "bg-yellow-500";
                        return "bg-red-500";
                      })()}`}
                      style={{
                        width: `${
                          (data.stats_data.graph.opposition_overall_stats
                            .underperformed.value /
                            data.stats_data.graph.opposition_overall_stats
                              .underperformed.total_matches) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    {Array.from(
                      {
                        length:
                          data.stats_data.graph.opposition_overall_stats
                            .dream_team?.total_matches + 1 || 0,
                      },
                      (_, i) => (
                        <span key={i}>{i}</span>
                      )
                    )}
                  </div>
                  <div className="text-center mt-1 text-sm font-semibold">
                    {
                      data.stats_data.graph.opposition_overall_stats
                        .underperformed?.value
                    }{" "}
                    Times
                  </div>
                </div>
              </div>

              {/* Bottom Stats Cards */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* Batting First */}
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="flex items-center mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">
                      Batting First
                    </h3>
                    <TrendingUp className="ml-2 h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="text-center shadow-md h-20">
                    <div className="text-4xl font-bold text-gray-800 pt-2">
                      {
                        data.stats_data.graph.opposition_overall_stats
                          .bat_first_fpts?.value
                      }
                    </div>
                    <div className="text-xs text-gray-500">Avg FPts</div>
                  </div>
                </div>

                {/* Chasing */}
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="flex items-center mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">
                      Chasing
                    </h3>
                    <ArrowRight className="ml-2 h-4 w-4 text-amber-500" />
                  </div>
                  <div className="text-center shadow-md h-20">
                    <div className="text-4xl font-bold text-gray-800 pt-2">
                      {
                        data.stats_data.graph.opposition_overall_stats
                          .bowl_first_fpts?.value
                      }
                    </div>
                    <div className="text-xs text-gray-500">Avg FPts</div>
                  </div>
                </div>

                {/* Position Rank */}
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="flex items-center mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">
                      Position Rank
                    </h3>
                    <TrendingUp className="ml-2 h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="text-center shadow-md h-20">
                    <div className="text-4xl font-bold text-gray-800 pt-2">
                      {
                        data.stats_data.graph.opposition_overall_stats
                          .avg_position_rank?.value
                      }
                    </div>
                    <div className="text-xs text-gray-500">
                      /{" "}
                      {
                        data.stats_data.graph.opposition_overall_stats
                          .avg_position_rank?.graph_total
                      }{" "}
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

              <div className="text-center text-gray-600 mb-6">
                Tap on the bar to see detailed Stats
              </div>

              {/* Filter Tags */}
              <div className="flex justify-center space-x-4">
                {/* T10 Format */}
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: "#D4A1F7" }}
                  ></div>
                  <span className="text-sm text-gray-600">
                    {formatLabel(matchInSights?.format)}
                  </span>
                </div>

                {/* Batting First */}
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: "#b79ae4" }}
                  ></div>
                  <span className="text-sm text-gray-600">Batting First</span>
                </div>

                {/* Chasing */}
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: "#7243ba" }}
                  ></div>
                  <span className="text-sm text-gray-600">Chasing</span>
                </div>

                {/* Perfect Lineup */}
                <div className="flex items-center space-x-2">
                  <Star className="h-3 w-3 text-yellow-500" />
                  <span className="text-sm text-gray-600">PerfectLineup</span>
                </div>
              </div>

              {/* Similar Matches */}
              <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg mt-6 w-full p-4">
                <table className="w-full text-sm text-left">
                  <thead className="text-gray-500 border-b">
                    <tr>
                      <th className="py-3 px-4">Versus</th>
                      <th className="py-3 px-4 text-center">Fantasy Points</th>
                      <th className="py-3 px-4 text-center">Overall Rank</th>
                      <th className="py-3 px-4 text-center">Position Rank</th>
                    </tr>
                  </thead>

                  <tbody>
                    {/* Similar Matches Header */}
                    <tr className="bg-gray-100">
                      <td
                        colSpan="4"
                        className="py-2 px-4 font-semibold text-gray-700 text-left"
                      >
                        Similar Matches
                      </td>
                    </tr>

                    {/* Data Rows */}
                    {oppositionFormatOverall.map((match, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        {/* Versus Column */}
                        <td className="py-3 px-4">
                          <Link
                            to={`/player/${
                              playerInfo?.player_uid
                            }/${playerInfo?.full_name.replace(/\s+/g, "_")}/${
                              matchInSights?.season_game_uid
                            }/form`}
                            state={{
                              stats_player_id: match.player_id,
                              stats_season_id: match.stats_season_id,
                              matchInSights: matchInSights,
                            }}
                            className="text-blue-500 hover:underline"
                            onClick={(e) => {
                              e.preventDefault(); // Prevent navigation
                              setSelectedPlayer(match);
                            }}
                          >
                            <div className="font-medium">
                              {match.against_team_abbr}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(match.season_scheduled_date)}
                            </div>
                          </Link>
                        </td>

                        {/* Fantasy Points with Progress Bar */}
                        <td className="py-3 px-4 relative">
                          <div className="flex items-center relative w-full">
                            <div
                              className={`h-6 ${getBarColor(
                                match.batting_first
                              )} rounded-md`}
                              style={{
                                width: getBarWidth(match.fantasy_points),
                                minWidth: "10px",
                              }}
                            ></div>
                            <span className="absolute right-2 flex items-center font-semibold">
                              {match.in_perfect_lineup === "1" && (
                                <span className="text-yellow-400 mr-1">★</span>
                              )}
                              {match.fantasy_points}
                            </span>
                          </div>
                        </td>

                        {/* Overall Rank */}
                        <td className="py-3 px-4 text-center font-medium">
                          {match.player_rank}
                        </td>

                        {/* Position Rank */}
                        <td className="py-3 px-4 text-center font-medium">
                          {match.position_rank}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Popup Modal */}
              {selectedPlayer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
                  <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg md:max-w-2xl lg:max-w-3xl relative max-h-[90vh] overflow-y-auto">
                    <button
                      className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
                      onClick={() => setSelectedPlayer(null)}
                    >
                      ✖
                    </button>

                    {/* Render FantasyBreakDown Component Inside Modal */}
                    <FantasyBreakDown selectedPlayer={selectedPlayer} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-gray-700">
            <h2 className="text-xl font-semibold text-center text-gray-700">
              Last{" "}
              {data.stats_data.graph.format_stats.dream_team?.total_matches}{" "}
              Matches Performance - {data.player_detail?.opp_abbr}
            </h2>
            <span className="block text-gray-700 text-center mx-auto">
              Tap on the graph to see more details
            </span>

            <div className="max-w-3xl mx-auto p-4 font-sans">
              {/* Top Stats Row */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                {/* In Dream Team */}
                <div>
                  <div className="flex items-center mb-1">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">
                      In Dream Team
                    </h3>
                    <TrendingUp className="ml-2 h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full rounded-l-full ${(() => {
                        const value =
                          data.stats_data.graph.opposition_stats.dream_team
                            .value;
                        const maxMatches =
                          data.stats_data.graph.opposition_stats.dream_team
                            .total_matches;

                        // Calculate percentage for more dynamic color assignment
                        const percentage = (value / maxMatches) * 100;

                        if (percentage < 33) return "bg-red-500";
                        if (percentage < 66) return "bg-yellow-500";
                        return "bg-emerald-500";
                      })()}`}
                      style={{
                        width: `${
                          (data.stats_data.graph.opposition_stats.dream_team
                            .value /
                            data.stats_data.graph.opposition_stats.dream_team
                              .total_matches) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    {Array.from(
                      {
                        length:
                          data.stats_data.graph.opposition_stats.dream_team
                            ?.total_matches + 1 || 0,
                      },
                      (_, i) => (
                        <span key={i}>{i}</span>
                      )
                    )}
                  </div>
                  <div className="text-center mt-1 text-sm font-semibold">
                    {data.stats_data.graph.opposition_stats.dream_team?.value}{" "}
                    Times
                  </div>
                </div>

                {/* Bottom 20% */}
                <div>
                  <div className="flex items-center mb-1">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">
                      Bottom 20%
                    </h3>
                    <TrendingUp className="ml-2 h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full rounded-l-full ${(() => {
                        const value =
                          data.stats_data.graph.opposition_stats.underperformed
                            .value;
                        const maxMatches =
                          data.stats_data.graph.opposition_stats.underperformed
                            .total_matches;

                        // Calculate percentage for more dynamic color assignment
                        const percentage = (value / maxMatches) * 100;

                        if (percentage < 33) return "bg-emerald-500";
                        if (percentage < 66) return "bg-yellow-500";
                        return "bg-red-500";
                      })()}`}
                      style={{
                        width: `${
                          (data.stats_data.graph.opposition_stats.underperformed
                            .value /
                            data.stats_data.graph.opposition_stats
                              .underperformed.total_matches) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    {Array.from(
                      {
                        length:
                          data.stats_data.graph.opposition_stats.dream_team
                            ?.total_matches + 1 || 0,
                      },
                      (_, i) => (
                        <span key={i}>{i}</span>
                      )
                    )}
                  </div>
                  <div className="text-center mt-1 text-sm font-semibold">
                    {
                      data.stats_data.graph.opposition_stats.underperformed
                        ?.value
                    }{" "}
                    Times
                  </div>
                </div>
              </div>

              {/* Bottom Stats Cards */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* Batting First */}
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="flex items-center mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">
                      Batting First
                    </h3>
                    <TrendingUp className="ml-2 h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="text-center shadow-md h-20">
                    <div className="text-4xl font-bold text-gray-800 pt-2">
                      {
                        data.stats_data.graph.opposition_stats.bat_first_fpts
                          ?.value
                      }
                    </div>
                    <div className="text-xs text-gray-500">Avg FPts</div>
                  </div>
                </div>

                {/* Chasing */}
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="flex items-center mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">
                      Chasing
                    </h3>
                    <ArrowRight className="ml-2 h-4 w-4 text-amber-500" />
                  </div>
                  <div className="text-center shadow-md h-20">
                    <div className="text-4xl font-bold text-gray-800 pt-2">
                      {
                        data.stats_data.graph.opposition_stats.bowl_first_fpts
                          ?.value
                      }
                    </div>
                    <div className="text-xs text-gray-500">Avg FPts</div>
                  </div>
                </div>

                {/* Position Rank */}
                <div className="bg-gray-100 p-4 rounded-lg">
                  <div className="flex items-center mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">
                      Position Rank
                    </h3>
                    <TrendingUp className="ml-2 h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="text-center shadow-md h-20">
                    <div className="text-4xl font-bold text-gray-800 pt-2">
                      {
                        data.stats_data.graph.opposition_stats.avg_position_rank
                          ?.value
                      }
                    </div>
                    <div className="text-xs text-gray-500">
                      /{" "}
                      {
                        data.stats_data.graph.opposition_stats.avg_position_rank
                          ?.graph_total
                      }{" "}
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

              <div className="text-center text-gray-600 mb-6">
                Tap on the bar to see detailed Stats
              </div>

              {/* Filter Tags */}
              <div className="flex justify-center space-x-4">
                {/* T10 Format */}
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: "#D4A1F7" }}
                  ></div>
                  <span className="text-sm text-gray-600">
                    {formatLabel(matchInSights?.format)}
                  </span>
                </div>

                {/* Batting First */}
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: "#b79ae4" }}
                  ></div>
                  <span className="text-sm text-gray-600">Batting First</span>
                </div>

                {/* Chasing */}
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: "#7243ba" }}
                  ></div>
                  <span className="text-sm text-gray-600">Chasing</span>
                </div>

                {/* Perfect Lineup */}
                <div className="flex items-center space-x-2">
                  <Star className="h-3 w-3 text-yellow-500" />
                  <span className="text-sm text-gray-600">PerfectLineup</span>
                </div>
              </div>

              {/* Similar Matches */}
              <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg mt-6 w-full p-4">
                <table className="w-full text-sm text-left">
                  <thead className="text-gray-500 border-b">
                    <tr>
                      <th className="py-3 px-4">Versus</th>
                      <th className="py-3 px-4 text-center">Fantasy Points</th>
                      <th className="py-3 px-4 text-center">Overall Rank</th>
                      <th className="py-3 px-4 text-center">Position Rank</th>
                    </tr>
                  </thead>

                  <tbody>
                    {/* Similar Matches Header */}
                    <tr className="bg-gray-100">
                      <td
                        colSpan="4"
                        className="py-2 px-4 font-semibold text-gray-700 text-left"
                      >
                        Similar Matches
                      </td>
                    </tr>

                    {/* Data Rows */}
                    {oppositionFormat.map((match, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        {/* Versus Column */}
                        <td className="py-3 px-4">
                          <Link
                            to={`/player/${
                              playerInfo?.player_uid
                            }/${playerInfo?.full_name.replace(/\s+/g, "_")}/${
                              matchInSights?.season_game_uid
                            }/form`}
                            state={{
                              stats_player_id: match.player_id,
                              stats_season_id: match.stats_season_id,
                              matchInSights: matchInSights,
                            }}
                            className="text-blue-500 hover:underline"
                            onClick={(e) => {
                              e.preventDefault(); // Prevent navigation
                              setSelectedPlayer(match);
                            }}
                          >
                            <div className="font-medium">
                              {match.against_team_abbr}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDate(match.season_scheduled_date)}
                            </div>
                          </Link>
                        </td>

                        {/* Fantasy Points with Progress Bar */}
                        <td className="py-3 px-4 relative">
                          <div className="flex items-center relative w-full">
                            <div
                              className={`h-6 ${getBarColor(
                                match.batting_first
                              )} rounded-md`}
                              style={{
                                width: getBarWidth(match.fantasy_points),
                                minWidth: "10px",
                              }}
                            ></div>
                            <span className="absolute right-2 flex items-center font-semibold">
                              {match.in_perfect_lineup === "1" && (
                                <span className="text-yellow-400 mr-1">★</span>
                              )}
                              {match.fantasy_points}
                            </span>
                          </div>
                        </td>

                        {/* Overall Rank */}
                        <td className="py-3 px-4 text-center font-medium">
                          {match.player_rank}
                        </td>

                        {/* Position Rank */}
                        <td className="py-3 px-4 text-center font-medium">
                          {match.position_rank}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Popup Modal */}
              {selectedPlayer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
                  <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg md:max-w-2xl lg:max-w-3xl relative max-h-[90vh] overflow-y-auto">
                    <button
                      className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
                      onClick={() => setSelectedPlayer(null)}
                    >
                      ✖
                    </button>

                    {/* Render FantasyBreakDown Component Inside Modal */}
                    <FantasyBreakDown selectedPlayer={selectedPlayer} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OppositeTeam;
