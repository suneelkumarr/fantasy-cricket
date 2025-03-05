import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaStar } from "react-icons/fa";

function MatchInsights() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const matchInSights = location.state?.matchInSights;
  console.log(matchInSights);

  const getCountdownTime = (scheduledDate) => {
    const now = new Date();
    const targetDate = new Date(scheduledDate);
    const diff = targetDate - now;

    if (diff <= 0) {
      return "Event Started";
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  useEffect(() => {
    if (!matchInSights?.season_game_uid) {
      console.warn("season_game_uid is undefined or null");
      return;
    }

    console.log(
      "Fetching data for season_game_uid:",
      matchInSights.season_game_uid
    );

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
              {new Date(matchInSights.season_scheduled_date).toLocaleString()}
            </div>
            <div className="text-gray-500 text-xs sm:text-sm">
              {matchInSights.league_name} -{" "}
              {matchInSights.format === "1" ? "ODI" : matchInSights.format}
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
      <div className="w-full flex justify-center -mt-4">
        {matchInSights.playing_announce === 0 ? (
          <div className="px-3 py-1 text-sm text-gray-700 bg-gray-100 rounded-md">
            Playing 11 is not announced
          </div>
        ) : (
          <div className="px-3 py-1 text-sm text-green-700 bg-green-100 rounded-md">
            Playing 11 is announced
          </div>
        )}
      </div>
      {/* Loading & Error Messages */}
      {loading && <div className="text-center text-gray-600">Loading...</div>}
      {error && <div className="text-red-500 text-center">Error: {error}</div>}

      {data &&
        data.map((item) => (
          <>
            {item.data.fixture_info.toss_data.length !== 0 && (
              <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-xl shadow-md w-full max-w-screen-lg mx-auto">
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
                            100 -
                            item.data.fixture_info.win_probability
                              .winning_percentage
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
                              item.data.fixture_info.win_probability
                                .winning_percentage}
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
                          width: `${item.data.fixture_info.win_probability.winning_percentage}%`,
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
                            {
                              item.data.fixture_info.win_probability
                                .winning_percentage
                            }
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

                  <div className="flex justify-center items-start space-x-12 bg-white p-4 rounded-lg shadow-md w-full max-w-screen-lg mx-auto">
                    {/* Left Team */}

                    <div className="text-gray-900">
                      <img
                        src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${matchInSights.home_flag}`}
                        alt={`${matchInSights.home} flag`}
                        className="w-8 h-8 mx-auto mb-2"
                      />
                      {homePlayers &&
                        homePlayers.map((item) => (
                          <ul
                            key={item.player_order}
                            className="text-sm font-semibold space-y-2"
                          >
                            <li className="flex items-center justify-between">
                              <span>
                                {item.player_order}. {item.nick_name}
                              </span>
                              <FaStar className="text-gray-400" />
                            </li>
                          </ul>
                        ))}
                      ;
                    </div>

                    {/* Right Team */}
                    <div className="text-gray-900">
                      <img
                        src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${matchInSights.away_flag}`}
                        alt={`${matchInSights.away} flag`}
                        className="w-8 h-8 mx-auto mb-2"
                      />
                      {awayPlayers &&
                        awayPlayers.map((item) => (
                          <ul
                            key={item.player_order}
                            className="text-sm font-semibold space-y-2"
                          >
                            <li className="flex items-center justify-between">
                              <span>
                                {item.player_order}. {item.nick_name}
                              </span>
                              <FaStar className="text-gray-400" />
                            </li>
                          </ul>
                        ))}
                      ;
                    </div>
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
