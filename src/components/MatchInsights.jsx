import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import Getlocation from "./Getlocation.jsx";

function MatchInsights() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const matchInSights = location.state?.matchInSights;
  console.log(Getlocation());

  // Function to get the countdown time in a formatted string
  const getCountdownTime = (scheduledDate) => {
    const now = new Date();
    const targetDate = new Date(scheduledDate);
    // Convert from UTC to IST by adding 5 hours 30 minutes
    targetDate.setHours(targetDate.getHours() + 5);
    targetDate.setMinutes(targetDate.getMinutes() + 30);

    const diff = targetDate - now;
    if (diff <= 0) return "Event Started";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  // Data fetching effect
  useEffect(() => {
    if (!matchInSights?.season_game_uid) {
      console.warn("season_game_uid is undefined or null");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.post(
          "https://plapi.perfectlineup.in/fantasy/stats/match_insight",
          {
            season_game_uid: matchInSights.season_game_uid,
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
        console.log("API Response:", response.data);
        setData([response.data]);
      } catch (err) {
        console.error("API Error:", err);
        setError(err.message || "An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [matchInSights?.season_game_uid]);

  // Memoized calculation for win percentages
  const win = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.map((item) => {
      const tossTrend = item.data.venue_info.toss_trend_per;
      return (tossTrend.toss_win_match_win / tossTrend.total_matches) * 100;
    });
  }, [data]);

  const getFormatLabel = () => {
    switch (matchInSights.format) {
      case "1":
        return "Test";
      case "2":
        return "ODI";
      case "3":
        return "T20";
      case "4":
        return "T10";
      default:
        return matchInSights.format;
    }
  };

  // Memoized extraction of fixture players
  const fixturePlayers = useMemo(() => {
    return Array.isArray(data) ? data[0].data.fixture_players : [];
  }, [data]);

  // Memoized home and away UIDs
  const homeUid = useMemo(() => {
    return Array.isArray(data) ? data[0].data.fixture_info.home_uid : [];
  }, [data]);

  const awayUid = useMemo(() => {
    return Array.isArray(data) ? data[0].data.fixture_info.away_uid : [];
  }, [data]);

  // Memoized filtered home players (sorted by player_order)
  const homePlayers = useMemo(() => {
    return fixturePlayers
      .filter((player) => player.team_uid === homeUid && player.avg_batting_order > 0)
      .sort((a, b) => parseInt(a.avg_batting_order) - parseInt(b.avg_batting_order))
      .slice(0, 5);
  }, [fixturePlayers, homeUid]);

  // Memoized filtered away players (sorted by player_order)
  const awayPlayers = useMemo(() => {
    return fixturePlayers
      .filter((player) => player.team_uid === awayUid && player.avg_batting_order > 0)
      .sort((a, b) => parseInt(a.avg_batting_order) - parseInt(b.avg_batting_order))
      .slice(0, 5);
  }, [fixturePlayers, awayUid]);

  // Memoized sorted arrays for various metrics
  const top5 = useMemo(() => {
    return [...fixturePlayers]
      .sort((a, b) => b.avg_bat_first_fpts - a.avg_bat_first_fpts)
      .slice(0, 5);
  }, [fixturePlayers]);

  const topChase = useMemo(() => {
    return [...fixturePlayers]
      .sort((a, b) => b.avg_chase_fpts - a.avg_chase_fpts)
      .slice(0, 5);
  }, [fixturePlayers]);

  const topH2H = useMemo(() => {
    return [...fixturePlayers]
      .sort((a, b) => b.avg_h2h_fpts - a.avg_h2h_fpts)
      .slice(0, 5);
  }, [fixturePlayers]);

  const topVenue = useMemo(() => {
    return [...fixturePlayers]
      .sort((a, b) => b.avg_venue_fpts - a.avg_venue_fpts)
      .slice(0, 5);
  }, [fixturePlayers]);

  const filteredPlayers = useMemo(() => {
    return fixturePlayers.filter(
      (player) => player.x_factor && player.x_factor.trim().length > 0
    );
  }, [fixturePlayers]);

  const powerPlayBat = useMemo(() => {
    return [...fixturePlayers]
      .sort((a, b) => b.power_play_bat_fpts - a.power_play_bat_fpts)
      .slice(0, 5);
  }, [fixturePlayers]);

  const powerPlayBowl = useMemo(() => {
    return [...fixturePlayers]
      .sort((a, b) => b.power_play_bowl_fpts - a.power_play_bowl_fpts)
      .slice(0, 5);
  }, [fixturePlayers]);

  const deathOverBowl = useMemo(() => {
    return [...fixturePlayers]
      .sort((a, b) => b.death_over_bowl_fpts - a.death_over_bowl_fpts)
      .slice(0, 5);
  }, [fixturePlayers]);

  const filteredTopFormPlayers = useMemo(() => {
    return [...fixturePlayers]
      .filter((player) => player.top_category === "top_form")
      .sort((a, b) => b.avg_fpts - a.avg_fpts)
      .slice(0, 5);
  }, [fixturePlayers]);

  const teamNews = useMemo(() => {
    return Array.isArray(data) ? data[0].data.team_news : [];
  }, [data]);

  return (
    <div className="w-full min-h-screen flex flex-col bg-white overflow-hidden items-start justify-start">
      {/* Navigation Bar */}
      <div className="flex items-center p-2 sm:p-4 border-b w-full max-w-full sm:max-w-screen-lg mx-auto justify-between sm:justify-center mt-2 sm:mt-4">
        {/* Back Button */}
        <Link
          key={matchInSights.season_game_uid}
          to={`/fixture-info/Cricket/${matchInSights.season_game_uid}/${matchInSights.home}_vs_${matchInSights.away}/${matchInSights.league_id}`}
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

        {/* Match Details */}
        <div className="flex items-center flex-grow justify-between w-full px-2 sm:px-6">
          {/* Home Team */}
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

          {/* Match Status */}
          <div className="text-center">
            <div className="text-red-500 font-bold text-sm sm:text-lg">
              {getCountdownTime(matchInSights.season_scheduled_date)}
            </div>
            <div className="text-gray-600 text-xs sm:text-sm mt-1">
              {(() => {
                const utcDate = new Date(matchInSights.season_scheduled_date); // Parse UTC date
                const istDate = new Date(
                  utcDate.getTime() + 5.5 * 60 * 60 * 1000
                ); // Add 5 hours 30 minutes
                return istDate.toLocaleString("en-IN"); // Convert to readable IST format
              })()}
            </div>

            <div className="text-gray-500 text-xs sm:text-sm">
              {matchInSights.league_name} -
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

          {/* Away Team */}
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

      {/* Playing 11 Status - Centered Below Match Details */}
      <div
        className={`w-full flex justify-center -mt-1 sm:-mt-4 px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md ${
          Number(matchInSights.playing_announce) === 1
            ? "text-green-700 bg-green-100"
            : "text-gray-700 bg-gray-100"
        }`}
      >
        {Number(matchInSights.playing_announce) === 1
          ? "Playing 11 is announced"
          : "Playing 11 is not announced"}
      </div>

      {/* Loading & Error Messages */}
      {loading && <div className="text-center text-gray-600">Loading...</div>}
      {error && <div className="text-red-500 text-center">Error: {error}</div>}

      {data &&
        data.map((item) => (
          <>
            {item.data.fixture_info.toss_data.length !== 0 && (
              <div className="flex items-center space-x-2 sm:space-x-3 bg-gray-50 p-2 sm:p-4 rounded-xl shadow-md w-full max-w-full sm:max-w-screen-lg mx-auto mt-4">
                <img
                  alt="Toss Icon"
                  className="w-8 h-8 sm:w-10 sm:h-10"
                  src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/toss.png"
                />
                <div>
                  <span className="text-gray-900 font-bold uppercase text-xs sm:text-sm">
                    Toss
                  </span>
                  <div className="text-gray-600 text-xxs sm:text-sm">
                    {item.data.fixture_info.toss_data.text}
                  </div>
                </div>
              </div>
            )}

            <div className="w-full max-w-full sm:max-w-screen-lg mx-auto py-2 sm:py-4">
              <div className="win-container flex flex-col items-center w-full p-2 sm:p-4 -mt-2">
                {/* Header Section */}
                <div className="view-win-container w-full flex items-center">
                  <div className="flex items-center w-full">
                    <span className="text-lg sm:text-xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                      WIN PROBABILITY
                    </span>
                    <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
                  </div>
                </div>

                {/* Progress Containers */}
                <div className="main-progress-container w-full">
                  <div className="progress-container">
                    {/* Home Team Progress */}
                    <div className="view-progress flex items-center mb-4 sm:mb-6">
                      <div
                        className="filled-view-progress h-8 sm:h-12 rounded-l-full transition-all duration-300"
                        style={{
                          width: `${
                            item?.data?.fixture_info?.win_probability
                              ?.winning_percentage != null
                              ? 100 -
                                item.data.fixture_info.win_probability
                                  .winning_percentage
                              : 100
                          }%`,
                          backgroundColor: "rgb(111, 200, 248)",
                        }}
                      ></div>
                      <div className="view-circle flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-md -ml-4 sm:-ml-6">
                        <img
                          src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${matchInSights.home_flag}`}
                          alt={`${matchInSights.home} flag`}
                          className="w-6 h-6 sm:w-8 sm:h-8"
                        />
                      </div>
                      <div className="perc-container ml-2 sm:ml-4 flex flex-col">
                        <div className="per-container flex items-baseline">
                          <span className="txt-percentage text-lg sm:text-2xl font-bold text-gray-800">
                            {100 -
                              (item?.data?.fixture_info?.win_probability
                                ?.winning_percentage ?? 0)}
                          </span>
                          <span className="txt-percentage1 text-base sm:text-lg font-medium text-gray-800">
                            %
                          </span>
                        </div>
                        <span className="txt-team-name text-sm sm:text-base font-medium text-gray-600">
                          {item.data.fixture_info.home}
                        </span>
                      </div>
                    </div>

                    {/* Away Team Progress */}
                    <div className="view-progress flex items-center">
                      <div
                        className="filled-view-progress h-8 sm:h-12 rounded-l-full transition-all duration-300"
                        style={{
                          width: `${
                            item?.data?.fixture_info?.win_probability
                              ?.winning_percentage ?? 0
                          }%`,
                          backgroundColor: "rgb(250, 180, 165)",
                        }}
                      ></div>
                      <div className="view-circle flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-md -ml-4 sm:-ml-6">
                        <img
                          src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${matchInSights.away_flag}`}
                          alt={`${matchInSights.away} flag`}
                          className="w-6 h-6 sm:w-8 sm:h-8"
                        />
                      </div>
                      <div className="perc-container ml-2 sm:ml-4 flex flex-col">
                        <div className="per-container flex items-baseline">
                          <span className="txt-percentage text-lg sm:text-2xl font-bold text-gray-800">
                            {item?.data?.fixture_info?.win_probability
                              ?.winning_percentage ?? "N/A"}
                          </span>
                          <span className="txt-percentage1 text-base sm:text-lg font-medium text-gray-800">
                            %
                          </span>
                        </div>
                        <span className="txt-team-name text-sm sm:text-base font-medium text-gray-600">
                          {item.data.fixture_info.away}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Header Section   GROUND CONDITIONS*/}
              <div className="win-container flex flex-col items-center w-full max-w-full sm:max-w-screen-lg mx-auto p-4 -mt-6">
                {/* Header Section */}
                <div className="view-win-container w-full">
                  <div className="flex items-center w-full">
                    <span className="text-xl sm:text-2xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                      GROUND CONDITIONS
                    </span>
                    <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
                  </div>
                  <span className="text-lg sm:text-xl font-bold text-gray-500 italic">
                    Last 5{" "}
                    {matchInSights.format === "1"
                      ? "Test"
                      : matchInSights.format === "2"
                      ? "ODI"
                      : matchInSights.format === "3"
                      ? "T20"
                      : matchInSights.format === "4"
                      ? "T10"
                      : matchInSights.format}
                    's
                  </span>
                </div>

                <div className="flex items-center w-full mt-2">
                  <span className="text-lg sm:text-xl font-bold text-gray-500 uppercase tracking-wide italic">
                    SCORING PATTERN
                  </span>
                </div>

                {/* Score and Wickets Section */}
                <div className="flex flex-col sm:flex-row items-center w-full max-w-full sm:max-w-screen-lg mx-auto p-4">
                  <div className="bg-white p-4 rounded-lg shadow-md w-full">
                    <div className="flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 sm:space-x-4">
                      <div className="flex-1 bg-gray-100 p-4 rounded-lg text-center">
                        <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                          {item.data.venue_info.avg_score}
                        </span>
                        <p className="text-gray-500 text-sm">Avg. Score</p>
                      </div>
                      <div className="flex-1 bg-gray-100 p-4 rounded-lg text-center">
                        <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                          {item.data.venue_info.avg_wicket}
                        </span>
                        <p className="text-gray-500 text-sm">Avg. Wkts</p>
                      </div>
                    </div>

                    {/* Score Distribution Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs sm:text-sm text-gray-500 px-2">
                        <span>
                          &lt;{item.data.venue_info.avg_distribution.low.value}
                        </span>
                        <span>
                          {item.data.venue_info.avg_distribution.mid.low_value}-
                          {item.data.venue_info.avg_distribution.mid.high_value}
                        </span>
                        <span>
                          {item.data.venue_info.avg_distribution.high.value}+
                        </span>
                      </div>
                      <div className="flex mt-1 rounded-full overflow-hidden">
                        {(() => {
                          // Extract distribution numbers
                          const { low, mid, high } =
                            item.data.venue_info.avg_distribution;
                          const total = low.no + mid.no + high.no;
                          // Calculate dynamic widths
                          const lowWidth = total ? (low.no / total) * 100 : 0;
                          const midWidth = total ? (mid.no / total) * 100 : 0;
                          const highWidth = total ? (high.no / total) * 100 : 0;
                          return (
                            <>
                              <div
                                className="bg-green-400 text-white text-xs font-bold px-2 py-1 text-center"
                                style={{ width: `${lowWidth}%` }}
                              >
                                {low.no}
                              </div>
                              <div
                                className="bg-green-500 text-white text-xs font-bold px-2 py-1 text-center"
                                style={{ width: `${midWidth}%` }}
                              >
                                {mid.no}
                              </div>
                              <div
                                className="bg-green-700 text-white text-xs font-bold px-2 py-1 text-center"
                                style={{ width: `${highWidth}%` }}
                              >
                                {high.no}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Header Section   Toss Trends*/}
              <div className="win-container flex flex-col items-center w-full max-w-full sm:max-w-screen-lg mx-auto p-2 sm:p-4 -mt-6">
                {/* Header Section */}
                <div className="view-win-container w-full">
                  <div className="flex items-center w-full">
                    <span className="text-xl sm:text-2xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                      Toss Trends
                    </span>
                    <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
                  </div>
                  <span className="text-lg sm:text-xl font-bold text-gray-500 italic">
                    At this venue
                  </span>
                </div>

                <div className="bg-white p-2 sm:p-4 rounded-xl shadow-md space-y-4 w-full max-w-full sm:max-w-screen-lg mx-auto -mt-6">
                  {/* Decision after winning the toss */}
                  <div>
                    <h3 className="text-gray-900 font-bold uppercase text-sm sm:text-base">
                      Decision After Winning the Toss
                    </h3>
                    <div className="flex justify-between text-xs sm:text-sm text-gray-500 mt-1">
                      <span>Choose to Bat First</span>
                      <span>Choose to Chase</span>
                    </div>
                    {(() => {
                      const batFirst =
                        item.data.venue_info.toss_trend_per.choose_bat_first;
                      const bowlFirst =
                        item.data.venue_info.toss_trend_per.choose_bowl_first;
                      const total = batFirst + bowlFirst;
                      const batFirstPercent = total
                        ? (batFirst / total) * 100
                        : 0;
                      const bowlFirstPercent = total
                        ? (bowlFirst / total) * 100
                        : 0;
                      return (
                        <div className="flex mt-1 rounded-full overflow-hidden bg-gray-500 text-white text-xs sm:text-sm font-bold transition-all duration-300">
                          <div
                            className="text-center bg-gray-800 py-1"
                            style={{ width: `${batFirstPercent}%` }}
                          >
                            {batFirst}
                          </div>
                          <div
                            className="text-center py-1"
                            style={{ width: `${bowlFirstPercent}%` }}
                          >
                            {bowlFirst}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Wins batting vs chasing */}
                  <div>
                    <div className="flex justify-between text-xs sm:text-sm text-gray-500 mt-1">
                      <span>Wins Batting First</span>
                      <span>Wins Chasing</span>
                    </div>
                    {(() => {
                      const batFirstWin =
                        item.data.venue_info.toss_trend_per.bat_first_win;
                      const batSecondWin =
                        item.data.venue_info.toss_trend_per.bat_second_win;
                      const totalWins = batFirstWin + batSecondWin;
                      const batFirstWinPercent = totalWins
                        ? (batFirstWin / totalWins) * 100
                        : 0;
                      const batSecondWinPercent = totalWins
                        ? (batSecondWin / totalWins) * 100
                        : 0;
                      return (
                        <div className="flex mt-1 rounded-full overflow-hidden bg-gray-500 text-white text-xs sm:text-sm font-bold transition-all duration-300">
                          <div
                            className="text-center bg-gray-800 py-1"
                            style={{ width: `${batFirstWinPercent}%` }}
                          >
                            {batFirstWin}
                          </div>
                          <div
                            className="text-center py-1"
                            style={{ width: `${batSecondWinPercent}%` }}
                          >
                            {batSecondWin}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Wins after winning toss */}
                  <div>
                    <h3 className="text-gray-900 font-bold uppercase text-sm sm:text-base">
                      Wins After Winning Toss -{" "}
                      <span className="font-normal">
                        {item.data.venue_info.toss_trend_per.toss_win_match_win}
                        /{item.data.venue_info.toss_trend_per.total_matches}{" "}
                        Matches
                      </span>
                    </h3>
                    <div className="flex justify-between text-xs sm:text-sm text-gray-500 mt-1">
                      <span>Win</span>
                      <span>Loss</span>
                    </div>
                    {(() => {
                      const tossWin =
                        item.data.venue_info.toss_trend_per.toss_win_match_win;
                      const totalMatches =
                        item.data.venue_info.toss_trend_per.total_matches;
                      const winPercent = totalMatches
                        ? (tossWin / totalMatches) * 100
                        : 0;
                      const lossPercent = 100 - winPercent;
                      return (
                        <div className="flex mt-1 rounded-full overflow-hidden bg-gray-500 text-white text-xs sm:text-sm font-bold transition-all duration-300">
                          <div
                            className="text-center bg-gray-800 py-1"
                            style={{ width: `${winPercent}%` }}
                          >
                            {winPercent.toFixed(0)}%
                          </div>
                          <div
                            className="text-center py-1"
                            style={{ width: `${lossPercent}%` }}
                          >
                            {lossPercent.toFixed(0)}%
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex flex-col w-full max-w-full sm:max-w-screen-lg mx-auto">
                    <span className="text-lg sm:text-xl font-bold text-gray-500 uppercase tracking-wide mt-2 italic">
                      PITCH TRENDS
                    </span>

                    {/* Batting vs Bowling */}
                    <div className="w-full max-w-full sm:max-w-screen-lg mx-auto mt-4">
                      <h3 className="text-gray-900 font-bold uppercase text-sm sm:text-base">
                        Batting vs Bowling
                      </h3>
                      <div className="flex justify-between text-xs sm:text-sm text-gray-500 mt-1">
                        <span>Batting FPts</span>
                        <span>Bowling FPts</span>
                      </div>
                      {(() => {
                        // Get raw values from your data
                        const batting =
                          item.data.venue_info.points_breakdown_per.BAT;
                        const bowling =
                          item.data.venue_info.points_breakdown_per.BOWL;
                        const total = batting + bowling;
                        // Calculate widths in percentages
                        const battingWidth = total
                          ? (batting / total) * 100
                          : 0;
                        const bowlingWidth = total
                          ? (bowling / total) * 100
                          : 0;
                        return (
                          <div className="flex mt-1 rounded-full overflow-hidden bg-gray-500 text-white text-xs sm:text-sm font-bold">
                            <div
                              className="text-center bg-gray-800 py-1"
                              style={{ width: `${battingWidth}%` }}
                            >
                              {batting}%
                            </div>
                            <div
                              className="text-center py-1"
                              style={{ width: `${bowlingWidth}%` }}
                            >
                              {bowling}%
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Pace vs Spin */}
                    <div className="w-full max-w-full sm:max-w-screen-lg mx-auto mt-4">
                      <h3 className="text-gray-900 font-bold uppercase text-sm sm:text-base">
                        Pace vs Spin
                      </h3>
                      <div className="flex justify-between text-xs sm:text-sm text-gray-500 mt-1">
                        <span>Pace FPts</span>
                        <span>Spin FPts</span>
                      </div>
                      {(() => {
                        const spin =
                          item.data.venue_info.bowling_analysis_per.SPIN;
                        const pace =
                          item.data.venue_info.bowling_analysis_per.PACE;
                        const total = spin + pace;
                        const spinWidth = total ? (spin / total) * 100 : 0;
                        const paceWidth = total ? (pace / total) * 100 : 0;
                        return (
                          <div className="flex mt-1 rounded-full overflow-hidden bg-gray-500 text-white text-xs sm:text-sm font-bold">
                            <div
                              className="text-center bg-gray-800 py-1"
                              style={{ width: `${spinWidth}%` }}
                            >
                              {spin}%
                            </div>
                            <div
                              className="text-center py-1"
                              style={{ width: `${paceWidth}%` }}
                            >
                              {pace}%
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Team News Section */}
                <div className="win-container flex flex-col items-center w-full md:max-w-screen-lg mx-auto p-4 sm:p-6 -mt-2">
                {/* Header Section */}
                <div className="view-win-container w-full">
                  <div className="flex items-center w-full">
                    <span className="text-lg sm:text-xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                    Team News Section
                    </span>

                    <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
                  </div>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-lg w-full space-y-4">
                  {teamNews.map((player) => (
                      <div
                        key={player.player_uid}
                        className="flex items-center shadow-md justify-between border-b pb-3 last:border-b-0"
                      >
                        {/* Left: Player Info */}
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="text-black font-bold text-sm">
                              {player.full_name}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {player.description}
                            </div>
                          </div>
                        </div>
                      </div>
                  ))}
                </div>
              </div>

                {/* Batting Order */}
                <div className="win-container flex flex-col items-center w-full max-w-full sm:max-w-screen-lg mx-auto p-2 sm:p-4 -mt-2">
                  {/* Header Section */}
                  <div className="view-win-container w-full mb-4">
                    <div className="flex items-center w-full">
                      <span className="text-lg sm:text-xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                        Batting Order
                      </span>
                      <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
                    </div>
                  </div>

                  {/* Teams Section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-2 sm:p-4 rounded-lg w-full max-w-full sm:max-w-screen-lg mx-auto">
                    {/* Left Team */}
                    <div className="flex flex-col items-center text-gray-900">
                      <img
                        src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${matchInSights.home_flag}`}
                        alt={`${matchInSights.home} flag`}
                        className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2"
                      />
                      {/* Player List */}
                      <ul className="w-full space-y-2">
                        {homePlayers?.map((player) => (
                          <Link
                            key={player.player_uid}
                            to={`/player/${
                              player.player_uid
                            }/${player.full_name.replace(/\s+/g, "_")}/${
                              matchInSights.season_game_uid
                            }/form`}
                            state={{
                              playerInfo: player,
                              matchID: matchInSights.season_game_uid,
                              matchInSights: matchInSights,
                            }}
                            className="flex justify-between items-center p-2 sm:p-3 rounded-lg shadow-md bg-white hover:bg-gray-100 w-full"
                          >
                            <li className="flex items-center justify-between w-full">
                              <span className="text-sm sm:text-base font-semibold">
                                {player.avg_batting_order}. {player.nick_name}
                              </span>
                              <FaStar className="text-gray-400" />
                            </li>
                          </Link>
                        ))}
                      </ul>
                    </div>

                    {/* Right Team */}
                    <div className="flex flex-col items-center text-gray-900">
                      <img
                        src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${matchInSights.away_flag}`}
                        alt={`${matchInSights.away} flag`}
                        className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2"
                      />
                      {/* Player List */}
                      <ul className="w-full space-y-2">
                        {awayPlayers?.map((player) => (
                          <Link
                            key={player.player_uid}
                            to={`/player/${
                              player.player_uid
                            }/${player.full_name.replace(/\s+/g, "_")}/${
                              matchInSights.season_game_uid
                            }/form`}
                            state={{
                              playerInfo: player,
                              matchID: matchInSights.season_game_uid,
                              matchInSights: matchInSights,
                            }}
                            className="flex justify-between items-center p-2 sm:p-3 rounded-lg shadow-md bg-white hover:bg-gray-100 w-full"
                          >
                            <li className="flex items-center justify-between w-full">
                              <span className="text-sm sm:text-base font-semibold">
                                {player.avg_batting_order}. {player.nick_name}
                              </span>
                              <FaStar className="text-gray-400" />
                            </li>
                          </Link>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Players in Top Form */}

                <div className="win-container flex flex-col items-center w-full md:max-w-screen-lg mx-auto p-4 sm:p-6 -mt-2">
                  {/* Header Section */}
                  <div className="view-win-container w-full">
                    <div className="flex items-center w-full">
                      <span className="text-lg sm:text-xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                        Players in Top Form
                      </span>

                      <div className="relative inline-block group">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="w-6 h-6 text-gray-600 cursor-pointer"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                          />
                        </svg>

                        <div className="absolute hidden group-hover:block bottom-full left-1/2 mb-2 transform -translate-x-1/2 px-3 py-2 bg-black text-white text-base rounded shadow-lg whitespace-nowrap">
                          Players who are in top form in the recent matches.
                        </div>
                      </div>

                      <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
                    </div>
                    <span className="text-sm md:text-base font-bold text-gray-500 italic">
                      Last 5{" "}
                      {matchInSights.format === "1"
                        ? "Test"
                        : matchInSights.format === "2"
                        ? "ODI"
                        : matchInSights.format === "3"
                        ? "T20"
                        : matchInSights.format === "4"
                        ? "T10"
                        : matchInSights.format}
                      's
                    </span>
                  </div>

                  <div className="bg-white p-4 sm:p-6 rounded-lg w-full space-y-4">
                    <div className="flex justify-end text-gray-500 text-sm font-semibold">
                      Avg. FPTS
                    </div>

                    {filteredTopFormPlayers.map((player) => (
                      <Link
                        key={player.player_uid}
                        to={`/player/${
                          player.player_uid
                        }/${player.full_name.replace(/\s+/g, "_")}/${
                          matchInSights.season_game_uid
                        }/form`}
                        state={{
                          playerInfo: player,
                          matchID: matchInSights.season_game_uid,
                          matchInSights: matchInSights,
                        }}
                        className="block"
                      >
                        <div
                          key={player.player_id}
                          className="flex items-center shadow-md justify-between border-b pb-3 last:border-b-0"
                        >
                          {/* Left: Player Info */}
                          <div className="flex items-center space-x-3">
                            <img
                              src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/${player.jersey}`}
                              alt={player.full_name}
                              className="w-10 h-10 rounded-full bg-gray-200"
                            />
                            <div>
                              <div className="text-black font-bold text-sm">
                                {player.full_name}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {player.batting_style} | {player.bowling_style}
                              </div>
                            </div>
                          </div>

                          {/* Right: Points & Star */}
                          <div className="flex items-center space-x-4">
                            <span className="text-black font-semibold text-lg">
                              {player.avg_fpts}
                            </span>
                            {/* Favorite Star Icon */}
                            <div className="cursor-pointer">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5 text-gray-400 hover:text-yellow-500"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M11.998 4.5l1.948 3.947 4.354.632-3.151 3.067.744 4.34-3.895-2.047-3.895 2.047.744-4.34-3.151-3.067 4.354-.632L11.998 4.5z"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Top Player Batting First */}

                <div className="win-container flex flex-col items-center w-full md:max-w-screen-lg mx-auto p-4 sm:p-6 -mt-2">
                  {/* Header Section */}
                  <div className="view-win-container w-full">
                    <div className="flex items-center w-full">
                      <span className="text-xl sm:text-2xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                        TOP PLAYERS BATTING FIRST
                      </span>

                      <div className="relative inline-block group">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="w-6 h-6 text-gray-600 cursor-pointer"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                          />
                        </svg>

                        <div className="absolute hidden group-hover:block bottom-full left-1/2 mb-2 transform -translate-x-1/2 px-3 py-2 bg-black text-white text-base rounded shadow-lg whitespace-nowrap">
                          Players who perform extremely well when their team
                          bats first
                        </div>
                      </div>

                      <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
                    </div>
                    <span className="text-lg md:text-base font-bold text-gray-500 italic">
                      Last 5{" "}
                      {matchInSights.format === "1"
                        ? "Test"
                        : matchInSights.format === "2"
                        ? "ODI"
                        : matchInSights.format === "3"
                        ? "T20"
                        : matchInSights.format === "4"
                        ? "T10"
                        : matchInSights.format}
                      's
                    </span>
                  </div>

                  <div className="bg-white p-4 sm:p-6 rounded-lg w-full space-y-4">
                    {top5.map((player) => (
                      <Link
                        key={player.player_uid}
                        to={`/player/${
                          player.player_uid
                        }/${player.full_name.replace(/\s+/g, "_")}/${
                          matchInSights.season_game_uid
                        }/form`}
                        state={{
                          playerInfo: player,
                          matchID: matchInSights.season_game_uid,
                          matchInSights: matchInSights,
                        }}
                        className="block"
                      >
                        <div className="flex flex-col md:flex-row items-center justify-between shadow-md border-b pb-3 last:border-b-0 mt-2 bg-white hover:bg-gray-100 p-3 rounded-md h-auto md:h-14">
                          {/* Left: Player Info */}
                          <div className="flex items-center gap-x-4 w-full md:w-1/3">
                            <img
                              src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/${player.jersey}`}
                              alt={player.full_name}
                              className="w-10 h-10 rounded-full object-cover border border-gray-300 bg-gray-200"
                            />
                            <div>
                              <div className="text-black font-bold text-sm">
                                {player.full_name}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {player.batting_style} | {player.bowling_style}
                              </div>
                            </div>
                          </div>

                          {/* Middle: Batting First & Chasing Indicators */}
                          <div className="flex items-center gap-x-3 w-full md:w-1/3 mt-2 md:mt-0 justify-center">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
                              <span className="text-gray-600 text-xs">
                                Batting First
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <span className="text-gray-600 text-xs">
                                Chasing
                              </span>
                            </div>
                          </div>

                          {/* Right: Points & Progress Bar */}
                          <div className="flex items-center gap-x-4 w-full md:w-1/3 mt-2 md:mt-0">
                            {/* Batting First Points */}
                            <span className="text-black font-medium text-sm w-10 text-right">
                              {player.avg_bat_first_fpts}
                            </span>

                            {/* Progress Bar Container */}
                            <div className="relative flex-grow h-2 bg-gray-300 rounded-full">
                              <div
                                className="absolute left-0 h-2 bg-gray-800 rounded-full"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (player.avg_bat_first_fpts /
                                      Math.max(
                                        player.avg_bat_first_fpts +
                                          player.avg_chase_fpts,
                                        1
                                      )) *
                                      100
                                  )}%`,
                                }}
                              ></div>
                            </div>

                            {/* Chasing Points */}
                            <span className="text-gray-500 text-sm w-10 text-left">
                              {player.avg_chase_fpts}
                            </span>
                          </div>

                          {/* Favorite Star Icon */}
                          <div className="cursor-pointer flex justify-end w-10 mt-2 md:mt-0">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-5 h-5 text-gray-400 hover:text-yellow-500"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11.998 4.5l1.948 3.947 4.354.632-3.151 3.067.744 4.34-3.895-2.047-3.895 2.047.744-4.34-3.151-3.067 4.354-.632L11.998 4.5z"
                              />
                            </svg>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* TOP PLAYERS CHASING */}

                <div className="win-container flex flex-col items-center w-full max-w-screen-lg mx-auto p-4 sm:p-6 lg:p-8">
                {/* Header Section */}
                <div className="view-win-container w-full mb-4">
                  <div className="flex items-center w-full">
                    <span className="text-xl sm:text-2xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                      TOP PLAYERS CHASING
                    </span>
          
                    <div className="relative inline-block group">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="w-6 h-6 text-gray-600 cursor-pointer"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                        />
                      </svg>
          
                      {/* Tooltip */}
                      <div className="absolute hidden group-hover:block bottom-full left-1/2 mb-2 transform -translate-x-1/2 px-3 py-2 bg-black text-white text-base rounded shadow-lg whitespace-nowrap">
                        Players who perform extremely well when their team is chasing.
                      </div>
                    </div>
          
                    <div className="border-t border-dotted border-gray-300 flex-1 h-px ml-2"></div>
                  </div>
          
                  <span className="text-base md:text-lg font-bold text-gray-500 italic">
                    Last 5{" "}
                    {matchInSights.format === "1"
                      ? "Test"
                      : matchInSights.format === "2"
                      ? "ODI"
                      : matchInSights.format === "3"
                      ? "T20"
                      : matchInSights.format === "4"
                      ? "T10"
                      : matchInSights.format}
                    's
                  </span>
                </div>
          
                <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-lg w-full space-y-4">
                  {topChase.map((player) => (
                    <Link
                      key={player.player_uid}
                      to={`/player/${player.player_uid}/${player.full_name.replace(
                        /\s+/g,
                        "_"
                      )}/${matchInSights.season_game_uid}/form`}
                      state={{
                        playerInfo: player,
                        matchID: matchInSights.season_game_uid,
                        matchInSights: matchInSights,
                      }}
                      className="block"
                    >
                      <div
                        className="flex flex-col md:flex-row items-center justify-between shadow-md border-b pb-3 last:border-b-0 bg-white hover:bg-gray-100 p-3 rounded-md h-auto"
                      >
                        {/* Left: Player Info */}
                        <div className="flex items-center gap-x-4 w-full md:w-1/3">
                          <img
                            src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/${player.jersey}`}
                            alt={player.full_name}
                            className="w-10 h-10 rounded-full object-cover border border-gray-300 bg-gray-200"
                          />
                          <div>
                            <div className="text-black font-bold text-sm">
                              {player.full_name}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {player.batting_style} | {player.bowling_style}
                            </div>
                          </div>
                        </div>
          
                        {/* Middle: Batting First & Chasing Indicators */}
                        <div className="flex items-center gap-x-3 w-full md:w-1/3 mt-2 md:mt-0 justify-center">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
                            <span className="text-gray-600 text-xs">Batting First</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <span className="text-gray-500 text-xs">Chasing</span>
                          </div>
                        </div>
          
                        {/* Right: Points & Progress Bar */}
                        <div className="flex items-center gap-x-4 w-full md:w-1/3 mt-2 md:mt-0">
                          {/* Batting First Points */}
                          <span className="text-black font-medium text-sm w-10 text-right">
                            {player.avg_bat_first_fpts}
                          </span>
          
                          {/* Progress Bar Container */}
                          <div className="relative w-full h-2 bg-gray-300 rounded-full">
                            <div
                              className="absolute left-0 h-2 bg-gray-800 rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (player.avg_bat_first_fpts /
                                    Math.max(
                                      player.avg_bat_first_fpts + player.avg_chase_fpts,
                                      1
                                    )) *
                                    100
                                )}%`,
                              }}
                            ></div>
                          </div>
          
                          {/* Chasing Points */}
                          <span className="text-gray-500 text-sm w-10 text-left">
                            {player.avg_chase_fpts}
                          </span>
                        </div>
          
                        {/* Favorite Star Icon */}
                        <div className="cursor-pointer flex justify-end w-10 mt-2 md:mt-0">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5 text-gray-400 hover:text-yellow-500"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11.998 4.5l1.948 3.947 4.354.632-3.151 3.067.744 4.34-3.895-2.047-3.895 2.047.744-4.34-3.151-3.067 4.354-.632L11.998 4.5z"
                            />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

                {/* TOP H2H PERFORMERS */}

                <div className="win-container flex flex-col items-center w-full max-w-full sm:max-w-screen-lg mx-auto p-4 sm:p-6 -mt-2">
                  {/* Header Section */}
                  <div className="view-win-container w-full mb-4">
                    <div className="flex items-center w-full">
                      <span className="text-xl sm:text-2xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                        TOP H2H PERFORMERS
                      </span>
                      <div className="relative inline-block group">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                          className="w-6 h-6 text-gray-600 cursor-pointer"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                          />
                        </svg>
                        <div className="absolute hidden group-hover:block bottom-full left-1/2 mb-2 transform -translate-x-1/2 px-3 py-2 bg-black text-white text-base rounded shadow-lg whitespace-nowrap">
                          Top performers from previous matches between the two
                          teams.
                        </div>
                      </div>
                      <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
                    </div>
                    <span className="text-lg md:text-base font-bold text-gray-500 italic">
                      Last 5{" "}
                      {matchInSights.format === "1"
                        ? "Test"
                        : matchInSights.format === "2"
                        ? "ODI"
                        : matchInSights.format === "3"
                        ? "T20"
                        : matchInSights.format === "4"
                        ? "T10"
                        : matchInSights.format}
                      's
                    </span>
                  </div>

                  {/* Players List */}
                  <div className="bg-white p-4 sm:p-6 rounded-lg w-full space-y-4">
                    <div className="flex justify-end text-gray-500 text-sm font-semibold">
                      Avg. FPTS
                    </div>
                    {topH2H.map((player) => (
                      <Link
                        key={player.player_uid}
                        to={`/player/${
                          player.player_uid
                        }/${player.full_name.replace(/\s+/g, "_")}/${
                          matchInSights.season_game_uid
                        }/form`}
                        state={{
                          playerInfo: player,
                          matchID: matchInSights.season_game_uid,
                          matchInSights: matchInSights,
                        }}
                        className="block"
                      >
                        <div
                          key={player.player_id}
                          className="flex flex-col md:flex-row items-center shadow-md justify-between border-b pb-3 last:border-b-0"
                        >
                          {/* Left: Player Info */}
                          <div className="flex items-center space-x-3">
                            <img
                              src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/${player.jersey}`}
                              alt={player.full_name}
                              className="w-10 h-10 rounded-full bg-gray-200"
                            />
                            <div>
                              <div className="text-black font-bold text-sm">
                                {player.full_name}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {player.batting_style} | {player.bowling_style}
                              </div>
                            </div>
                          </div>
                          {/* Right: Points & Star */}
                          <div className="flex items-center space-x-4 mt-2 md:mt-0">
                            <span className="text-black font-semibold text-lg">
                              {player.avg_h2h_fpts}
                            </span>
                            <div className="cursor-pointer">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5 text-gray-400 hover:text-yellow-500"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M11.998 4.5l1.948 3.947 4.354.632-3.151 3.067.744 4.34-3.895-2.047-3.895 2.047.744-4.34-3.151-3.067 4.354-.632L11.998 4.5z"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* TOP PERFORMERS AT THIS VENUE */}

                <div className="win-container flex flex-col items-center w-full max-w-screen-lg mx-auto p-4 -mt-2">
                  {/* Header Section */}
                  <div className="view-win-container w-full">
                    <div className="flex items-center w-full">
                      <span className="text-xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                        TOP PERFORMERS AT THIS VENUE
                      </span>

                      <div class="relative inline-block group">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="w-6 h-6 text-gray-600 cursor-pointer"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                          />
                        </svg>

                        <div
                          class="
                      absolute
                      hidden
                      group-hover:block
                      bottom-full
                      left-1/2
                      mb-2
                      transform
                      -translate-x-1/2
                      px-3
                      py-2
                      bg-black
                      text-white
                      text-base
                      rounded
                      shadow-lg
                      whitespace-nowrap
                    "
                        >
                          Players who have a strong performance track record at
                          this venue.
                        </div>
                      </div>

                      <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
                    </div>
                    <span className="text-l font-bold md:text-gray-500 italic">
                      Last 5{" "}
                      {matchInSights.format === "1"
                        ? "Test"
                        : matchInSights.format === "2"
                        ? "ODI"
                        : matchInSights.format === "3"
                        ? "T20"
                        : matchInSights.format === "4"
                        ? "T10"
                        : matchInSights.format}
                      's
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-lg w-full space-y-4">
                    <div className="flex justify-end text-gray-500 text-sm font-semibold">
                      Avg. FPTS
                    </div>

                    {topVenue.map((player) => (
                      <Link
                        key={player.player_uid}
                        to={`/player/${
                          player.player_uid
                        }/${player.full_name.replace(/\s+/g, "_")}/${
                          matchInSights.season_game_uid
                        }/form`}
                        state={{
                          playerInfo: player,
                          matchID: matchInSights.season_game_uid,
                          matchInSights: matchInSights,
                        }}
                        className="block"
                      >
                        <div
                          key={player.player_id}
                          className="flex items-center shadow-md justify-between border-b pb-3 last:border-b-0"
                        >
                          {/* Left: Player Info */}
                          <div className="flex items-center space-x-3">
                            <img
                              src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/${player.jersey}`} // Ensure the image is available in public folder
                              alt={player.full_name}
                              className="w-10 h-10 rounded-full bg-gray-200"
                            />
                            <div>
                              <div className="text-black font-bold text-sm">
                                {player.full_name}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {player.batting_style} | {player.bowling_style}
                              </div>
                            </div>
                          </div>

                          {/* Right: Points & Star */}
                          <div className="flex items-center space-x-4">
                            <span className="text-black font-semibold text-lg">
                              {player.avg_venue_fpts}
                            </span>

                            {/* Favorite Star Icon */}
                            <div className="cursor-pointer">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5 text-gray-400 hover:text-yellow-500"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M11.998 4.5l1.948 3.947 4.354.632-3.151 3.067.744 4.34-3.895-2.047-3.895 2.047.744-4.34-3.151-3.067 4.354-.632L11.998 4.5z"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* PLAYERS WITH X FACTOR */}

                <div className="win-container flex flex-col items-center w-full max-w-screen-lg mx-auto p-4 -mt-2">
                  {/* Header Section */}
                  <div className="view-win-container w-full">
                    <div className="flex items-center w-full">
                      <span className="text-xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                        PLAYERS WITH X FACTOR
                      </span>

                      <div class="relative inline-block group">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="w-6 h-6 text-gray-600 cursor-pointer"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                          />
                        </svg>

                        <div
                          class="
                       absolute
                       hidden
                       group-hover:block
                       bottom-full
                       left-1/2
                       mb-2
                       transform
                       -translate-x-1/2
                       px-3
                       py-2
                       bg-black
                       text-white
                       text-base
                       rounded
                       shadow-lg
                       whitespace-nowrap
                     "
                        >
                          Players who have the potential to win the match single
                          handedly on their day.
                        </div>
                      </div>

                      <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
                    </div>
                    <span className="text-l font-bold md:text-gray-500 italic">
                      Last 5{" "}
                      {matchInSights.format === "1"
                        ? "Test"
                        : matchInSights.format === "2"
                        ? "ODI"
                        : matchInSights.format === "3"
                        ? "T20"
                        : matchInSights.format === "4"
                        ? "T10"
                        : matchInSights.format}
                      's
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-lg w-full space-y-4">
                    <div className="flex justify-end text-gray-500 text-sm font-semibold">
                      Avg. FPTS
                    </div>

                    {filteredPlayers.map((player) => (
                      <Link
                        key={player.player_uid}
                        to={`/player/${
                          player.player_uid
                        }/${player.full_name.replace(/\s+/g, "_")}/${
                          matchInSights.season_game_uid
                        }/form`}
                        state={{
                          playerInfo: player,
                          matchID: matchInSights.season_game_uid,
                          matchInSights: matchInSights,
                        }}
                        className="block"
                      >
                        <div
                          key={player.player_id}
                          className="flex items-center shadow-md justify-between border-b pb-3 last:border-b-0"
                        >
                          {/* Left: Player Info */}
                          <div className="flex items-center space-x-3">
                            <img
                              src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/${player.jersey}`} // Ensure the image is available in public folder
                              alt={player.full_name}
                              className="w-10 h-10 rounded-full bg-gray-200"
                            />
                            <div>
                              <div className="text-black font-bold text-sm">
                                {player.full_name}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {player.batting_style} | {player.bowling_style}
                              </div>
                            </div>
                          </div>

                          {/* Right: Points & Star */}
                          <div className="flex items-center space-x-4">
                            <span className="text-black font-semibold text-lg">
                              {player.avg_venue_fpts}
                            </span>

                            {/* Favorite Star Icon */}
                            <div className="cursor-pointer">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5 text-gray-400 hover:text-yellow-500"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M11.998 4.5l1.948 3.947 4.354.632-3.151 3.067.744 4.34-3.895-2.047-3.895 2.047.744-4.34-3.151-3.067 4.354-.632L11.998 4.5z"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Power plays (batters) */}

                <div className="win-container flex flex-col items-center w-full max-w-screen-lg mx-auto p-4 -mt-2">
                  {/* Header Section */}
                  <div className="view-win-container w-full">
                    <div className="flex items-center w-full">
                      <span className="text-xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                        Power plays (batters)
                      </span>

                      <div class="relative inline-block group">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke-width="1.5"
                          stroke="currentColor"
                          class="w-6 h-6 text-gray-600 cursor-pointer"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                          />
                        </svg>

                        <div
                          class="
                                    absolute
                                    hidden
                                    group-hover:block
                                    bottom-full
                                    left-1/2
                                    mb-2
                                    transform
                                    -translate-x-1/2
                                    px-3
                                    py-2
                                    bg-black
                                    text-white
                                    text-base
                                    rounded
                                    shadow-lg
                                    whitespace-nowrap
                                  "
                        >
                          Fielding restricitions during powerplay overs (first 6
                          overs) encourage batsmans to take more risk and hit
                          more boundaries.
                        </div>
                      </div>

                      <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
                    </div>
                    <span className="text-l font-bold md:text-gray-500 italic">
                      Last 5{" "}
                      {matchInSights.format === "1"
                        ? "Test"
                        : matchInSights.format === "2"
                        ? "ODI"
                        : matchInSights.format === "3"
                        ? "T20"
                        : matchInSights.format === "4"
                        ? "T10"
                        : matchInSights.format}
                      's
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-lg shadow-md w-full space-y-4">
                    <div className="flex justify-end text-gray-500 text-sm font-semibold">
                      Avg. FPTS
                    </div>

                    {powerPlayBat.map((player) => (
                      <Link
                        key={player.player_uid}
                        to={`/player/${
                          player.player_uid
                        }/${player.full_name.replace(/\s+/g, "_")}/${
                          matchInSights.season_game_uid
                        }/form`}
                        state={{
                          playerInfo: player,
                          matchID: matchInSights.season_game_uid,
                          matchInSights: matchInSights,
                        }}
                        className="block"
                      >
                        <div
                          key={player.player_id}
                          className="flex items-center shadow-md justify-between border-b pb-3 last:border-b-0"
                        >
                          {/* Left: Player Info */}
                          <div className="flex items-center space-x-3">
                            <img
                              src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/${player.jersey}`} // Ensure the image is available in public folder
                              alt={player.full_name}
                              className="w-10 h-10 rounded-full bg-gray-200"
                            />
                            <div>
                              <div className="text-black font-bold text-sm">
                                {player.full_name}
                              </div>
                              <div className="text-gray-500 text-xs">
                                {player.batting_style} | {player.bowling_style}
                              </div>
                            </div>
                          </div>

                          {/* Right: Points & Star */}
                          <div className="flex items-center space-x-4">
                            <span className="text-black font-semibold text-lg">
                              {player.power_play_bat_fpts
                                ? player.power_play_bat_fpts.toFixed(2)
                                : "0.00"}
                            </span>

                            {/* Favorite Star Icon */}
                            <div className="cursor-pointer">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5 text-gray-400 hover:text-yellow-500"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M11.998 4.5l1.948 3.947 4.354.632-3.151 3.067.744 4.34-3.895-2.047-3.895 2.047.744-4.34-3.151-3.067 4.354-.632L11.998 4.5z"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Power plays (bowlers) */}
                <div className="win-container flex flex-col items-center w-full max-w-screen-lg mx-auto p-4 sm:p-6 md:p-8 lg:p-10 -mt-2">
                {/* Header Section */}
                <div className="view-win-container w-full">
                  <div className="flex flex-row md:flex-row items-center w-full">
                    <span className="text-xl md:text-2xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                      Power plays (bowlers)
                    </span>
          
                    <div className="relative inline-flex items-end mt-2 md:mt-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6 text-gray-600 cursor-pointer"
                        onClick={() => setTooltipVisible(!tooltipVisible)}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                        />
                      </svg>
          
                      {tooltipVisible && (
                        <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-2 bg-black text-white text-base rounded shadow-lg">
                          Powerplay overs (first 6 overs) are a good time for bowlers to take advantage of any assistance in the pitch to take early wickets and boost fantasy points.
                        </div>
                      )}
                    </div>
          
                    <div className="border-t border-dotted border-gray-300 flex-1 h-px mt-2 md:mt-0 md:ml-4"></div>
                  </div>
                  <span className="text-base md:text-lg font-bold text-gray-500 italic mt-2 block">
                    Last 5{" "}
                    {matchInSights.format === "1"
                      ? "Test"
                      : matchInSights.format === "2"
                      ? "ODI"
                      : matchInSights.format === "3"
                      ? "T20"
                      : matchInSights.format === "4"
                      ? "T10"
                      : matchInSights.format}
                    's
                  </span>
                </div>
          
                <div className="bg-white p-4 rounded-lg w-full space-y-4 mt-4">
                  <div className="flex justify-end text-gray-500 text-sm font-semibold">
                    Avg. FPTS
                  </div>
          
                  {powerPlayBowl.map((player) => (
                    <Link
                      key={player.player_uid}
                      to={`/player/${player.player_uid}/${player.full_name.replace(/\s+/g, "_")}/${matchInSights.season_game_uid}/form`}
                      state={{
                        playerInfo: player,
                        matchID: matchInSights.season_game_uid,
                        matchInSights: matchInSights,
                      }}
                      className="block"
                    >
                      <div
                        key={player.player_id}
                        className="flex flex-col sm:flex-row items-center shadow-md justify-between border-b pb-3 last:border-b-0"
                      >
                        {/* Left: Player Info */}
                        <div className="flex items-center space-x-3">
                          <img
                            src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/${player.jersey}`}
                            alt={player.full_name}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200"
                          />
                          <div>
                            <div className="text-black font-bold text-sm sm:text-base">
                              {player.full_name}
                            </div>
                            <div className="text-gray-500 text-xs sm:text-sm">
                              {player.batting_style} | {player.bowling_style}
                            </div>
                          </div>
                        </div>
          
                        {/* Right: Points & Star */}
                        <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                          <span className="text-black font-semibold text-lg">
                            {player.power_play_bowl_fpts
                              ? player.power_play_bowl_fpts.toFixed(2)
                              : "0.00"}
                          </span>
          
                          {/* Favorite Star Icon */}
                          <div className="cursor-pointer">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-5 h-5 text-gray-400 hover:text-yellow-500"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11.998 4.5l1.948 3.947 4.354.632-3.151 3.067.744 4.34-3.895-2.047-3.895 2.047.744-4.34-3.151-3.067 4.354-.632L11.998 4.5z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

                {/* Death overs (Bowlers) */}

                <div className="win-container flex flex-col items-center w-full max-w-screen-lg mx-auto p-4 sm:p-6 md:p-8 lg:p-10 -mt-2">
                {/* Header Section */}
                <div className="view-win-container w-full">
                  <div className="flex flex-row md:flex-row items-center w-full">
                    <span className="text-xl md:text-2xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                      Death overs (Bowlers)
                    </span>
              
                    <div className="relative inline-block group mt-2 md:mt-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6 text-gray-600 cursor-pointer"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
                        />
                      </svg>
              
                      <div className="absolute hidden group-hover:block bottom-full left-1/2 mb-2 transform -translate-x-1/2 px-3 py-2 bg-black text-white text-base rounded shadow-lg whitespace-nowrap">
                        Player's performance in death overs
                      </div>
                    </div>
              
                    <div className="border-t border-dotted border-gray-300 flex-1 h-px mt-2 md:mt-0 md:ml-4"></div>
                  </div>
                  <span className="text-base md:text-lg font-bold text-gray-500 italic mt-2 block">
                    Last 5{" "}
                    {matchInSights.format === "1"
                      ? "Test"
                      : matchInSights.format === "2"
                      ? "ODI"
                      : matchInSights.format === "3"
                      ? "T20"
                      : matchInSights.format === "4"
                      ? "T10"
                      : matchInSights.format}
                    's
                  </span>
                </div>
              
                <div className="bg-white p-4 rounded-lg w-full space-y-4 mt-4">
                  <div className="flex justify-end text-gray-500 text-sm font-semibold">
                    Avg. FPTS
                  </div>
              
                  {deathOverBowl.map((player) => (
                    <Link
                      key={player.player_uid}
                      to={`/player/${player.player_uid}/${player.full_name.replace(/\s+/g, "_")}/${matchInSights.season_game_uid}/form`}
                      state={{
                        playerInfo: player,
                        matchID: matchInSights.season_game_uid,
                        matchInSights: matchInSights,
                      }}
                      className="block"
                    >
                      <div
                        key={player.player_id}
                        className="flex flex-col sm:flex-row items-center shadow-md justify-between border-b pb-3 last:border-b-0"
                      >
                        {/* Left: Player Info */}
                        <div className="flex items-center space-x-3">
                          <img
                            src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/${player.jersey}`}
                            alt={player.full_name}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200"
                          />
                          <div>
                            <div className="text-black font-bold text-sm sm:text-base">
                              {player.full_name}
                            </div>
                            <div className="text-gray-500 text-xs sm:text-sm">
                              {player.batting_style} | {player.bowling_style}
                            </div>
                          </div>
                        </div>
              
                        {/* Right: Points & Star */}
                        <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                          <span className="text-black font-semibold text-lg">
                            {player.death_over_bowl_fpts
                              ? player.death_over_bowl_fpts.toFixed(2)
                              : "0.00"}
                          </span>
              
                          {/* Favorite Star Icon */}
                          <div className="cursor-pointer">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-5 h-5 text-gray-400 hover:text-yellow-500"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11.998 4.5l1.948 3.947 4.354.632-3.151 3.067.744 4.34-3.895-2.047-3.895 2.047.744-4.34-3.151-3.067 4.354-.632L11.998 4.5z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              </div>
            </div>
          </>
        ))}
    </div>
  );
}

export default MatchInsights;
