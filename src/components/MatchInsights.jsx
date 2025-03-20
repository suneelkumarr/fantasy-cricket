import React, { useState, useEffect } from "react";
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
  const matchInSights = location.state?.matchInSights;
  console.log(Getlocation());

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
      } catch (error) {
        console.error("API Error:", error);
        setError(error.message || "An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [matchInSights?.season_game_uid]);

  const win = Array.isArray(data)
    ? data.map((matchInSights) => {
        const win =
          (matchInSights.data.venue_info.toss_trend_per.toss_win_match_win /
            matchInSights.data.venue_info.toss_trend_per.total_matches) *
          100;
        return win;
      })
    : [];

  // Extract the fixture_players array
  const fixturePlayers = Array.isArray(data)
    ? data[0].data.fixture_players
    : [];

  // Grab the home_uid and away_uid from fixture_info
  const homeUid = Array.isArray(data) ? data[0].data.fixture_info.home_uid : [];
  const awayUid = Array.isArray(data) ? data[0].data.fixture_info.away_uid : [];

  // Filter and sort home team players
  const homePlayers = Array.isArray(fixturePlayers)
    ? fixturePlayers
        .filter((player) => player.team_uid === homeUid)
        .sort((a, b) => parseInt(a.player_order) - parseInt(b.player_order))
        .slice(0, 5)
    : [];

  // Filter and sort away team players
  const awayPlayers = Array.isArray(fixturePlayers)
    ? fixturePlayers
        .filter((player) => player.team_uid === awayUid)
        .sort((a, b) => parseInt(a.player_order) - parseInt(b.player_order))
        .slice(0, 5)
    : [];

  fixturePlayers.sort((a, b) => b.avg_bat_first_fpts - a.avg_bat_first_fpts);

  // 2. Slice the top 5 players
  const top5 = fixturePlayers.slice(0, 5);
  // Find the maximum batting first points to scale properly
  fixturePlayers.sort((a, b) => b.avg_chase_fpts - a.avg_chase_fpts);

  const topChase = fixturePlayers.slice(0, 5);

  fixturePlayers.sort((a, b) => b.avg_h2h_fpts - a.avg_h2h_fpts);
  const topH2H = fixturePlayers.slice(0, 5);

  fixturePlayers.sort((a, b) => b.avg_venue_fpts - a.avg_venue_fpts);
  const topVenue = fixturePlayers.slice(0, 5);

  // Function to filter players with non-empty x_factor
  const filteredPlayers = fixturePlayers.filter(
    (player) => player.x_factor && player.x_factor.trim().length > 0
  );

  fixturePlayers.sort((a, b) => b.power_play_bat_fpts - a.power_play_bat_fpts);
  const powerPlayBat = fixturePlayers.slice(0, 5);

  fixturePlayers.sort(
    (a, b) => b.power_play_bowl_fpts - a.power_play_bowl_fpts
  );
  const powerPlayBowl = fixturePlayers.slice(0, 5);

  fixturePlayers.sort(
    (a, b) => b.death_over_bowl_fpts - a.death_over_bowl_fpts
  );
  const deathOverBowl = fixturePlayers.slice(0, 5);

  const filteredTopFormPlayers = fixturePlayers.filter(
    (player) => player.top_category === "top_form"
  );
  filteredTopFormPlayers.sort((a, b) => b.avg_fpts - a.avg_fpts).slice(0, 5);

  return (
    <div className="w-full min-h-screen flex flex-col bg-white overflow-hidden items-start justify-start">
      {/* Navigation Bar */}
      <div className="flex items-center p-4 border-b w-full max-w-screen-lg mx-auto justify-between sm:justify-center mt-4">
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
        className={`w-full flex justify-center -mt-4 px-3 py-1 text-sm rounded-md 
        ${
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
              <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-xl shadow-md w-full max-w-screen-lg mx-auto mt-4">
                <img
                  alt="Toss Icon"
                  className="w-10 h-10"
                  src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/toss.png"
                />
                <div>
                  <span className="text-gray-900 font-bold uppercase">
                    Toss
                  </span>
                  <div className="text-gray-600 text-sm">
                    {item.data.fixture_info.toss_data.text}
                  </div>
                </div>
              </div>
            )}

            <div className="w-full max-w-screen-lg mx-auto py-4">
              <div className="win-container flex flex-col items-center w-full max-w-screen-lg mx-auto p-4 -mt-6">
                {/* Header Section */}
                <div className="view-win-container w-full">
                  <div className="flex items-center w-full">
                    <span className="text-xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                      WIN PROBABILITY
                    </span>
                    <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
                  </div>
                </div>

                {/* Progress Containers */}
                <div className="main-progress-container w-full">
                  <div className="progress-container">
                    {/* South Africa Progress */}
                    <div className="view-progress flex items-center mb-6">
                      <div
                        className="filled-view-progress h-12 rounded-l-full"
                        style={{
                          width: `${
                            item?.data?.fixture_info?.win_probability
                              ?.wining_percentage != null
                              ? 100 -
                                item.data.fixture_info.win_probability
                                  .winning_percentage
                              : 100 // Fallback value when the percentage is null or undefined
                          }%`,
                          backgroundColor: "rgb(111, 200, 248)",
                        }}
                      ></div>
                      <div className="view-circle flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-md -ml-6">
                        <img
                          src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${matchInSights.home_flag}`}
                          alt={`${matchInSights.home} flag`}
                          className="w-8 h-8"
                        />
                      </div>
                      <div className="perc-container ml-4 flex flex-col">
                        <div className="per-container flex items-baseline">
                          <span className="txt-percentage text-2xl font-bold text-gray-800">
                            {100 -
                              (item?.data?.fixture_info?.win_probability
                                ?.winning_percentage ?? 0)}
                          </span>
                          <span className="txt-percentage1 text-lg font-medium text-gray-800">
                            %
                          </span>
                        </div>
                        <span className="txt-team-name text-sm font-medium text-gray-600">
                          {item.data.fixture_info.home}
                        </span>
                      </div>
                    </div>

                    {/* New Zealand Progress */}
                    <div className="view-progress flex items-center">
                      <div
                        className="filled-view-progress h-12 rounded-l-full"
                        style={{
                          width: `${
                            item?.data?.fixture_info?.win_probability
                              ?.winning_percentage ?? 0
                          }%`,
                          backgroundColor: "rgb(250, 180, 165)",
                        }}
                      ></div>
                      <div className="view-circle flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-md -ml-6">
                        <img
                          src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${matchInSights.away_flag}`}
                          alt={`${matchInSights.away} flag`}
                          className="w-8 h-8"
                        />
                      </div>
                      <div className="perc-container ml-4 flex flex-col">
                        <div className="per-container flex items-baseline">
                          <span className="txt-percentage text-2xl font-bold text-gray-800">
                            {item?.data?.fixture_info?.win_probability
                              ?.winning_percentage ?? "N/A"}
                          </span>
                          <span className="txt-percentage1 text-lg font-medium text-gray-800">
                            %
                          </span>
                        </div>
                        <span className="txt-team-name text-sm font-medium text-gray-600">
                          {item.data.fixture_info.away}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Header Section   GROUND CONDITIONS*/}
              <div className="win-container flex flex-col items-center w-full max-w-screen-lg mx-auto p-4 -mt-6">
                {/* Header Section */}
                <div className="view-win-container w-full">
                  <div className="flex items-center w-full">
                    <span className="text-xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                      GROUND CONDITIONS
                    </span>
                    <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
                  </div>
                  <span className="text-l font-bold md:text-gray-500 italic">
                    Last 5 ODI's
                  </span>
                </div>

                <div className="flex items-center w-full">
                  <span className="text-l font-bold text-gray-500 uppercase tracking-wide mt-2 italic">
                    SCORING PATTERN
                  </span>
                </div>

                {/* Score and Wickets Section */}
                <div className="flex items-center w-full max-w-screen-lg mx-auto p-4 ">
                  <div className="bg-white p-4 rounded-lg shadow-md w-full max-w-screen-lg mx-auto p-4 ">
                    {/* Score and Wickets Section */}
                    <div className="flex justify-between space-x-4">
                      <div className="flex-1 bg-gray-100 p-4 rounded-lg text-center">
                        <span className="text-2xl font-bold text-gray-900">
                          {item.data.venue_info.avg_score}
                        </span>
                        <p className="text-gray-500 text-sm">Avg. Score</p>
                      </div>
                      <div className="flex-1 bg-gray-100 p-4 rounded-lg text-center">
                        <span className="text-2xl font-bold text-gray-900">
                          {item.data.venue_info.avg_wicket}
                        </span>
                        <p className="text-gray-500 text-sm">Avg. Wkts</p>
                      </div>
                    </div>

                    {/* Score Distribution Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-gray-500 px-2">
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
                        <div className="bg-green-400 text-white text-xs font-bold px-2 py-1 w-1/5 text-center">
                          {item.data.venue_info.avg_distribution.low.no}
                        </div>
                        <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 w-2/5 text-center">
                          {item.data.venue_info.avg_distribution.mid.no}
                        </div>
                        <div className="bg-green-700 text-white text-xs font-bold px-2 py-1 w-2/5 text-center">
                          {item.data.venue_info.avg_distribution.high.no}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Header Section   Toss Trends*/}
              <div className="win-container flex flex-col items-center w-full max-w-screen-lg mx-auto p-4 -mt-6">
                {/* Header Section */}
                <div className="view-win-container w-full">
                  <div className="flex items-center w-full">
                    <span className="text-xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                      Toss Trends
                    </span>
                    <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
                  </div>
                  <span className="text-l font-bold md:text-gray-500 italic">
                    At this venue
                  </span>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-md space-y-4 w-full max-w-screen-lg mx-auto p-4 -mt-6">
                  {/* Decision after winning the toss */}
                  <div>
                    <h3 className="text-gray-900 font-bold uppercase text-sm">
                      Decision After Winning the Toss
                    </h3>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Choose to Bat First</span>
                      <span>Choose to Chase</span>
                    </div>

                    <div className="flex mt-1 rounded-full overflow-hidden bg-gray-500 text-white text-xs font-bold">
                      <div className="w-1/5 text-center bg-gray-800 py-1">
                        {item.data.venue_info.toss_trend_per.choose_bat_first}
                      </div>
                      <div className="w-4/5 text-center py-1">
                        {item.data.venue_info.toss_trend_per.choose_bowl_first}
                      </div>
                    </div>
                  </div>

                  {/* Wins batting vs chasing */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Wins Batting First</span>
                      <span>Wins Chasing</span>
                    </div>
                    <div className="flex mt-1 rounded-full overflow-hidden bg-gray-500 text-white text-xs font-bold">
                      <div className="w-1/5 text-center bg-gray-800 py-1">
                        {item.data.venue_info.toss_trend_per.bat_first_win}
                      </div>
                      <div className="w-4/5 text-center py-1">
                        {" "}
                        {item.data.venue_info.toss_trend_per.bat_second_win}
                      </div>
                    </div>
                  </div>

                  {/* Wins after winning toss */}
                  <div>
                    <h3 className="text-gray-900 font-bold uppercase text-sm">
                      Wins After Winning Toss -{" "}
                      <span className="font-normal">
                        {item.data.venue_info.toss_trend_per.toss_win_match_win}
                        /{item.data.venue_info.toss_trend_per.total_matches}{" "}
                        Matches
                      </span>
                    </h3>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Win</span>
                      <span>Loss</span>
                    </div>
                    <div className="flex mt-1 rounded-full overflow-hidden bg-gray-500 text-white text-xs font-bold">
                      <div className="w-1/5 text-center bg-gray-800 py-1">
                        {win}%
                      </div>
                      <div className="w-4/5 text-center py-1">{100 - win}%</div>
                    </div>
                  </div>

                  <div className="flex flex-col w-full max-w-screen-lg mx-auto">
                    <span className="text-l font-bold text-gray-500 uppercase tracking-wide mt-2 italic">
                      PITCH TRENDS
                    </span>

                    {/* Wins after PITCH TRENDS */}
                    <div className="w-full max-w-screen-lg mx-auto">
                      <h3 className="text-gray-900 font-bold uppercase text-sm itelic">
                        Batting vs Bowling
                      </h3>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Batting FPts</span>
                        <span>Bowling FPts</span>
                      </div>
                      <div className="flex mt-1 rounded-full overflow-hidden bg-gray-500 text-white text-xs font-bold">
                        <div className="w-1/5 text-center bg-gray-800 py-1">
                          {item.data.venue_info.points_breakdown_per.BAT}%
                        </div>
                        <div className="w-4/5 text-center py-1">
                          {item.data.venue_info.points_breakdown_per.BOWL}%
                        </div>
                      </div>

                      <h3 className="text-gray-900 font-bold uppercase text-sm itelic">
                        Pace vs Spin
                      </h3>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Pace FPts</span>
                        <span>Spin FPts</span>
                      </div>
                      <div className="flex mt-1 rounded-full overflow-hidden bg-gray-500 text-white text-xs font-bold">
                        <div className="w-1/5 text-center bg-gray-800 py-1">
                          {item.data.venue_info.bowling_analysis_per.SPIN}%
                        </div>
                        <div className="w-4/5 text-center py-1">
                          {item.data.venue_info.bowling_analysis_per.PACE}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Batting Order */}
                <div className="win-container flex flex-col items-center w-full max-w-screen-lg mx-auto p-4 -mt-2">
                  {/* Header Section */}
                  <div className="view-win-container w-full">
                    <div className="flex items-center w-full">
                      <span className="text-xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                        Batting Order
                      </span>
                      <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
                    </div>
                  </div>

                  {/* Teams Section */}
                  <div className="grid grid-cols-2 gap-12 bg-white p-4 rounded-lg w-full max-w-screen-lg mx-auto">
                    {/* Left Team */}
                    <div className="flex flex-col items-center text-gray-900">
                      <img
                        src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${matchInSights.home_flag}`}
                        alt={`${matchInSights.home} flag`}
                        className="w-8 h-8 mx-auto mb-2"
                      />
                      {/* Player List */}
                      <ul className="w-full space-y-2">
                        {homePlayers?.map((item) => (
                          <Link
                            key={item.player_uid}
                            to={`/player/${
                              item.player_uid
                            }/${item.full_name.replace(/\s+/g, "_")}/${
                              matchInSights.season_game_uid
                            }/form`}
                            state={{
                              playerInfo: item,
                              matchID: matchInSights.season_game_uid,
                              matchInSights: matchInSights,
                            }}
                            className="flex justify-between items-center p-3 rounded-lg shadow-md bg-white hover:bg-gray-100 w-full"
                          >
                            <li
                              key={item.player_order}
                              className="w-full flex flex-row w-full items-center justify-between"
                            >
                              <span className="text-sm font-semibold">
                                {item.player_order}. {item.nick_name}
                              </span>
                              <FaStar className="text-gray-400 justify-end" />
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
                        className="w-8 h-8 mx-auto mb-2"
                      />
                      {/* Player List */}
                      <ul className="w-full space-y-2">
                        {awayPlayers?.map((item) => (
                          <Link
                            key={item.player_uid}
                            to={`/player/${
                              item.player_uid
                            }/${item.full_name.replace(/\s+/g, "_")}/${
                              matchInSights.season_game_uid
                            }/form`}
                            state={{
                              playerInfo: item,
                              matchID: matchInSights.season_game_uid,
                              matchInSights: matchInSights,
                            }}
                            className="flex justify-between items-center p-3 rounded-lg shadow-md bg-white hover:bg-gray-100 w-full"
                          >
                            <li
                              key={item.player_order}
                              className="w-full flex flex-row w-full items-center justify-between"
                            >
                              <span className="text-sm font-semibold">
                                {item.player_order}. {item.nick_name}
                              </span>
                              <FaStar className="text-gray-400 justify-end" />
                            </li>
                          </Link>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Players in Top Form */}

                <div className="win-container flex flex-col items-center w-full max-w-screen-lg mx-auto p-4 -mt-2">
                  {/* Header Section */}
                  <div className="view-win-container w-full">
                    <div className="flex items-center w-full">
                      <span className="text-xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                        Players in Top Form
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
                          Players who are in top form in the recent matches.
                        </div>
                      </div>

                      <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
                    </div>
                    <span className="text-l font-bold md:text-gray-500 italic">
                      Last 5 ODI's
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-lg w-full space-y-4">
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

                <div className="win-container flex flex-col items-center w-full max-w-screen-lg mx-auto p-4 -mt-2">
                  {/* Header Section */}
                  <div className="view-win-container w-full">
                    <div className="flex items-center w-full">
                      <span className="text-xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                        TOP PLAYERS BATTING FIRST
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
                          Players who perform extremely well when their team
                          bats first
                        </div>
                      </div>

                      <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
                    </div>
                    <span className="text-l font-bold md:text-gray-500 italic">
                      Last 5 ODI's
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-lg w-full space-y-4">
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
                        <div className="flex items-center justify-between shadow-md border-b pb-3 last:border-b-0 mt-2 bg-white hover:bg-gray-100 p-3 rounded-md h-14">
                          {/* Left: Player Info */}
                          <div className="flex items-center gap-x-4 w-1/3">
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
                          <div className="flex items-center gap-x-3 w-1/3">
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
                          <div className="flex items-center gap-x-4 w-1/3">
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
                          <div className="cursor-pointer flex justify-end w-10">
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

                <div className="win-container flex flex-col items-center w-full max-w-screen-lg mx-auto p-4 -mt-2">
                  {/* Header Section */}
                  <div className="view-win-container w-full">
                    <div className="flex items-center w-full">
                      <span className="text-xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                        TOP PLAYERS CHASING
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
                          Players who perform extremely well when their team is
                          chasing.
                        </div>
                      </div>

                      <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
                    </div>
                    <span className="text-l font-bold md:text-gray-500 italic">
                      Last 5 ODI's
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-lg w-full space-y-4">
                    {topChase.map((player) => (
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
                          className="flex items-center justify-between shadow-md border-b pb-3 last:border-b-0 mt-2 bg-white hover:bg-gray-100 p-3 rounded-md h-14"
                        >
                          {/* Left: Player Info */}
                          <div className="flex items-center gap-x-4 w-1/3">
                            <img
                              src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/${player.jersey}`} // Ensure the image is available in public folder
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
                          <div className="flex items-center gap-x-3 w-1/3">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
                              <span className="text-gray-600 text-xs">
                                Batting First
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <span className="text-gray-500 text-xs">
                                Chasing
                              </span>
                            </div>
                          </div>

                          {/* Right: Points & Progress Bar */}
                          <div className="flex items-center gap-x-4 w-1/3">
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
                          <div className="cursor-pointer flex justify-end w-10">
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

                <div className="win-container flex flex-col items-center w-full max-w-screen-lg mx-auto p-4 -mt-2">
                  {/* Header Section */}
                  <div className="view-win-container w-full">
                    <div className="flex items-center w-full">
                      <span className="text-xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                        TOP H2H PERFORMERS
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
                          Top performers from previous matches between the two
                          teams.
                        </div>
                      </div>

                      <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
                    </div>
                    <span className="text-l font-bold md:text-gray-500 italic">
                      Last 5 ODI's
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-lg w-full space-y-4">
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
                      Last 5 ODI's
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
                      Last 5 ODI's
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
                      Last 5 ODI's
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
                <div className="win-container flex flex-col items-center w-full max-w-screen-lg mx-auto p-4 -mt-2">
                  {/* Header Section */}
                  <div className="view-win-container w-full">
                    <div className="flex items-center w-full">
                      <span className="text-xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                        Power plays (bowlers)
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
                          Powerplay overs (first 6 overs) are good time for
                          bowlers to take advantage of any assistance in the
                          pitch to take early wickets and boost fantasy points
                        </div>
                      </div>

                      <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
                    </div>
                    <span className="text-l font-bold md:text-gray-500 italic">
                      Last 5 ODI's
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-lg w-full space-y-4">
                    <div className="flex justify-end text-gray-500 text-sm font-semibold">
                      Avg. FPTS
                    </div>

                    {powerPlayBowl.map((player) => (
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

                <div className="win-container flex flex-col items-center w-full max-w-screen-lg mx-auto p-4 -mt-2">
                  {/* Header Section */}
                  <div className="view-win-container w-full">
                    <div className="flex items-center w-full">
                      <span className="text-xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                        Death overs (Bowlers)
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
                          Player's performance in death overs
                        </div>
                      </div>

                      <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
                    </div>
                    <span className="text-l font-bold md:text-gray-500 italic">
                      Last 5 ODI's
                    </span>
                  </div>

                  <div className="bg-white p-4 rounded-lg w-full space-y-4">
                    <div className="flex justify-end text-gray-500 text-sm font-semibold">
                      Avg. FPTS
                    </div>

                    {deathOverBowl.map((player) => (
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
              </div>
            </div>
          </>
        ))}
    </div>
  );
}

export default MatchInsights;
