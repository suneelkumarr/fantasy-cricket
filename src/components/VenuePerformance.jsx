import React, { useState, useEffect, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios";
import { AiOutlineStar } from "react-icons/ai";
import Getlocation from "./Getlocation.jsx";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
const COLORS = ["#D0ECF6", "#F9DACF"];

// Base URL for flags
const FLAG_BASE_URL = 'https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/';

// Helper function to format date to "DD MMM YYYY"
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Group matches by formatted date
const groupMatchesByDate = (matches) => {
  return matches.reduce((groups, match) => {
    const formattedDate = formatDate(match.season_scheduled_date);
    if (!groups[formattedDate]) {
      groups[formattedDate] = [];
    }
    groups[formattedDate].push(match);
    return groups;
  }, {});
};


function MatchDetails({ matchData }) {
  // Group data and sort by date descending
  const groupedMatches = groupMatchesByDate(matchData);
  const sortedDates = Object.keys(groupedMatches).sort((a, b) => new Date(b) - new Date(a));


  return (
    <div className="team-wise-match-container p-4 max-w-4xl">
    <div className="header-text text-lg font-semibold mb-4">
      Click on below recent matches to view RMC's performance on this venue.
    </div>
    <div className="past-fixture-list space-y-4">
      {sortedDates.map((date) => (
        <div key={date} className="match-group">
          {/* Header for the date group */}
          <div className="header-box flex items-center mb-2">
            <div className="div-line flex-1 border-t border-gray-300"></div>
            <div className="schedule-date mx-2 text-sm font-medium text-gray-700">{date}</div>
            <div className="div-line flex-1 border-t border-gray-300"></div>
          </div>
          {groupedMatches[date].map((match, index) => (
            <Link
            to={`/match-report/Cricket/${match.es_season_game_uid}/${match.home}_vs_${match.away}/${match.league_id}/scorecard`}
            state={{
              matchInSights: match,
              matchSessionIDs: match.es_season_game_uid,
              matchleageIDs: match.league_id,
            }}
            className=""
          >
            <div
              key={index}
              onClick={() => console.log(match.title)}
              className="past-fixture-item cursor-pointer bg-white p-4 rounded-md shadow-sm hover:shadow-md transition flex flex-col sm:flex-row items-center justify-between"
            >
              {/* Home team */}
              <div className="team-info-box flex items-center space-x-2">
                <img
                  className="w-8 h-8 rounded-full"
                  src={`${FLAG_BASE_URL}${match.home_flag}`}
                  alt={`${match.home} flag`}
                />
                <div className="team-name font-medium">{match.home}</div>
              </div>
              {/* Center VS info */}
              <div className="center-vs-box my-2 sm:my-0 text-center">
                <div className="text-sm font-bold">VS</div>
                <div className="league-name text-xs text-gray-500">{match.league_name}</div>
              </div>
              {/* Away team */}
              <div className="team-info-box flex items-center space-x-2">
                <div className="team-name font-medium">{match.away}</div>
                <img
                  className="w-8 h-8 rounded-full"
                  src={`${FLAG_BASE_URL}${match.away_flag}`}
                  alt={`${match.away} flag`}
                />
              </div>
            </div>
           </Link>
          ))}
        </div>
      ))}
    </div>
  </div>
  );
}


function Playerinformations({ players, matchInSights }) {
  const [activeTab, setActiveTab] = useState("Top Players");

  // Change the active tab
  const handleTabClick = (tab) => setActiveTab(tab);

  // Calculate average for a player based on active tab
  const getAverage = (player) => {
    if (activeTab === "Top Players") {
      return player.total_matches > 0
        ? player.total_fantasy_points / player.total_matches
        : 0;
    } else if (activeTab === "Batting First") {
      return player.batting_first_matches > 0
        ? player.batting_first_fpts / player.batting_first_matches
        : 0;
    } else if (activeTab === "Chasing") {
      return player.chasing_matches > 0
        ? player.chasing_fpts / player.chasing_matches
        : 0;
    }
    return 0;
  };

  // Filter players who have played at least one match in the relevant category
  let filteredPlayers = [];
  if (activeTab === "Top Players") {
    filteredPlayers = players.filter(p => p.total_matches > 0);
    filteredPlayers.sort((a, b) => getAverage(b) - getAverage(a));
  } else if (activeTab === "Batting First") {
    filteredPlayers = players.filter(p => p.batting_first_matches > 0);
    filteredPlayers.sort((a, b) => getAverage(b) - getAverage(a));
  } else if (activeTab === "Chasing") {
    filteredPlayers = players.filter(p => p.chasing_matches > 0);
    filteredPlayers.sort((a, b) => getAverage(b) - getAverage(a));
  }

  // Determine maximum average for slider calculation (fallback to 86 if none)
  let maxPoints;
  if (activeTab === "Top Players") {
    maxPoints = Math.max(...filteredPlayers.map(p =>
      p.total_matches > 0 ? p.total_fantasy_points / p.total_matches : 0
    ), 0);
  } else if (activeTab === "Batting First") {
    maxPoints = Math.max(...filteredPlayers.map(p =>
      p.batting_first_matches > 0 ? p.batting_first_fpts / p.batting_first_matches : 0
    ), 0);
  } else if (activeTab === "Chasing") {
    maxPoints = Math.max(...filteredPlayers.map(p =>
      p.chasing_matches > 0 ? p.chasing_fpts / p.chasing_matches : 0
    ), 0);
  }

  return (
    <div className="p-4 w-full max-w-4xl">
      <div className="top-player-container max-w-4xl mx-auto">
        {/* Tabs */}
        <div className="child-tab-container border-b mb-4">
          <div className="child-tab-list flex space-x-4 item-center justify-center">
            {["Top Players", "Batting First", "Chasing"].map((tab) => (
              <div
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={`child-tab-item cursor-pointer pb-2 ${
                  activeTab === tab
                    ? "border-b-2 border-blue-500 text-blue-500"
                    : "text-gray-500"
                }`}
              >
                {tab}
              </div>
            ))}
          </div>
        </div>

        {/* Players List */}
        <div className="player-category-item">
          <div className="players-list space-y-4">
            {filteredPlayers.map(player => {
              const average = getAverage(player);
              const matches =
                activeTab === "Top Players"
                  ? player.total_matches
                  : activeTab === "Batting First"
                  ? player.batting_first_matches
                  : player.chasing_matches;
              const sliderWidth = maxPoints ? (average / maxPoints) * 100 : 0;
              return (
                <Link
                key={player.player_uid}
                to={`/player/${player.player_uid}/${
                  player.display_name?.replace(/\s+/g, "_") ||
                  player.full_name?.replace(/\s+/g, "_") ||
                  "unknown"
                }/${matchInSights.season_game_uid}/form`}
                state={{
                  playerInfo: player,
                  matchID: matchInSights.season_game_uid,
                  matchInSights: matchInSights,
                }}
              >
                <div
                  key={player.player_id}
                  className="matchreport-players-list flex flex-col sm:flex-row items-center justify-between bg-white p-4 shadow rounded"
                >
                  <div className="player-graph-team flex flex-col sm:flex-row w-full">
                    {/* Player Info */}
                    <div className="player-info-box w-full sm:w-1/3">
                      <div className="name-style font-bold text-lg">
                        {player.nick_name}
                      </div>
                      <div className="position-style text-sm text-gray-500 flex items-center">
                        {player.position}
                        <span className="dot inline-block w-2 h-2 bg-gray-500 rounded-full mx-1"></span>
                        {player.team_abbr}
                      </div>
                    </div>
                    {/* Slider */}
                    
                    {/* Progress bar */}
                    <div className="relative flex-grow h-8 bg-gray-300 rounded self-center">
                      <div
                        className="absolute top-0 left-0 h-8 rounded"
                        style={{
                          width: `${sliderWidth}%`,
                          backgroundColor: "rgba(80, 193, 232, 0.8)", // away team color
                        }}
                      />
                    </div>

                    {/* Display text for each tab */}
                    <div className="text-sm text-gray-600 flex-shrink-0 w-32 text-right self-center">
                    {average.toFixed(2)} Avg Pts in {matches} matches
                    </div>
                  </div>
                  {/* Lock Icon */}
                  <div className="player-lock-box mt-2 sm:mt-0">
                    <div className="lock-unlock-item">
                      <img
                        className="icon-ic_unlocked w-6 h-6"
                        src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_prefer_inactive.svg"
                        alt="lock icon"
                      />
                    </div>
                  </div>
                </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function DreamTeamChart({data, matchInSights, total_matches}) {

  const  {BOW, AR, BAT, WK} = data
  // Example chart options:
  const chartOptions = {
    chart: {
      type: "pie",
    },
    title: {
      text: "",
    },
    tooltip: {
      pointFormat: "{series.name}: <b>{point.y}</b>",
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        dataLabels: {
          enabled: true,
          format: "<b>{point.name}</b>: {point.y}",
        },
      },
    },
    series: [
      {
        name: "Points",
        colorByPoint: true,
        data: [
          {
            name: "WK",
            y: WK,
            color: "rgb(208,236,246)",
          },
          {
            name: "BAT",
            y: BAT,
            color: "rgb(249,218,207)",
          },
          {
            name: "AR",
            y: AR,
            color: "rgb(95,165,145)",
          },
          {
            name: "BOWL",
            y: BOW,
            color: "rgb(89,130,237)",
          },
        ],
      },
    ],
  };

  // 2. We'll store the data array separately for easy use below
  const chartData = chartOptions.series[0].data;


  return (
    <div className="w-full max-w-4xl mx-auto border rounded-md bg-white p-4 shadow-sm">
    {/* Header */}
    <h2 className="text-base font-bold mb-1">
       Fantasy Points For {matchInSights.home}
    </h2>
    <p className="text-sm text-gray-600 mb-4">
    Showing data for {matchInSights.home}'s team based on recent {total_matches} matches
    </p>

    {/* Chart Container */}
    <div className="overflow-hidden mb-6">
      <HighchartsReact highcharts={Highcharts} options={chartOptions} />
    </div>

    {/* 3. Data Below the Chart */}
    <div className="space-y-2">
      <div className="font-semibold text-gray-800">Points Breakdown</div>

      {/* For a quick card/list style: */}
      <div className="flex flex-col gap-2">
        {chartData.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between rounded-md bg-gray-50 p-2 shadow-sm"
          >
            <div className="flex items-center space-x-2">
              {/* Color Swatch */}
              <div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {/* Position Name */}
              <span className="font-medium text-gray-700">{item.name}</span>
            </div>
            {/* Points */}
            <div className="text-gray-800 font-semibold">{item.y} pts</div>
          </div>
        ))}
      </div>
    </div>
  </div>
  );
}

const VenueTossTrends = ({ data }) => {
  const {
    bat_first_total,
    bat_first_win,
    bowl_first_total,
    bowl_first_win,
  } = data;

  // Calculate overall totals (e.g., last 10 matches)
  const totalMatches = bat_first_total + bowl_first_total;
  const totalWins = bat_first_win + bowl_first_win;
  const overallWinPercentage = totalMatches ? (totalWins / totalMatches) * 100 : 0;

  // Batting first percentages
  const batWinPercentage = bat_first_total ? (bat_first_win / bat_first_total) * 100 : 0;
  const batLossPercentage = 100 - batWinPercentage;

  // Chasing percentages
  const bowlWinPercentage = bowl_first_total ? (bowl_first_win / bowl_first_total) * 100 : 0;
  const bowlLossPercentage = 100 - bowlWinPercentage;

  return (
    <div className="-mt-[5px] p-4 w-full max-w-4xl">
      {/* Header */}
      <div className="flex items-center mb-2">
        <h3 className="text-lg font-semibold">In Recent Matches</h3>
        <div className="flex-1 border-t border-gray-300 ml-2"></div>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        At this venue in the last {totalMatches} matches
      </p>

      {/* Overall Progress */}
      <div className="flex items-center mb-2">
        <span className="text-sm">last {totalMatches} matches -</span>
        <span className="text-sm text-gray-500 ml-1">{totalWins} Wins</span>
      </div>
      <div className="mb-4">
        <div className="relative h-4 rounded overflow-hidden bg-gray-200">
          <div
            className="h-full rounded-l"
            style={{
              width: `${overallWinPercentage}%`,
              backgroundColor: "rgb(76, 78, 102)",
            }}
          ></div>
          <div
            className="h-full rounded-r"
            style={{
              width: `${100 - overallWinPercentage}%`,
              backgroundColor: "rgb(149, 151, 164)",
            }}
          ></div>
        </div>
      </div>

      {/* Batting First Section */}
      <div className="flex items-center mb-2">
        <span className="text-sm">batting first -</span>
        <span className="text-sm text-gray-500 ml-1">
          {bat_first_win} Wins in {bat_first_total} matches
        </span>
      </div>
      <div className="mb-4">
        <div className="relative h-4 rounded overflow-hidden bg-gray-200">
          <div
            className="h-full rounded-l"
            style={{
              width: `${batWinPercentage}%`,
              backgroundColor: "rgb(76, 78, 102)",
            }}
          ></div>
          <div
            className="h-full rounded-r"
            style={{
              width: `${batLossPercentage}%`,
              backgroundColor: "rgb(149, 151, 164)",
            }}
          ></div>
        </div>
      </div>

      {/* Chasing Section */}
      <div className="flex items-center mb-2">
        <span className="text-sm">Chasing -</span>
        <span className="text-sm text-gray-500 ml-1">
          {bowl_first_win} Wins in {bowl_first_total} matches
        </span>
      </div>
      <div>
        <div className="relative h-4 rounded overflow-hidden bg-gray-200">
          <div
            className="h-full rounded-l"
            style={{
              width: `${bowlWinPercentage}%`,
              backgroundColor: "rgb(76, 78, 102)",
            }}
          ></div>
          <div
            className="h-full rounded-r"
            style={{
              width: `${bowlLossPercentage}%`,
              backgroundColor: "rgb(149, 151, 164)",
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

const HomeTeam = ({matchInSights}) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (!matchInSights?.season_game_uid) {
      console.warn("season_game_uid is undefined or null");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.post(
          "https://plapi.perfectlineup.in/fantasy/stats/teams_venue_stats",
          {
            season_game_uid: matchInSights.season_game_uid,
            league_id: matchInSights.league_id,
            sports_id: "7", // Assuming sports_id is always 7
            team_uid : matchInSights.home_uid
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
        setData(response.data.data);
      } catch (error) {
        console.error("API Error:", error);
        setError(error.message || "An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [matchInSights?.season_game_uid]);

   // Render error/loading states if needed
   if (loading) {
    return <div className="text-center text-gray-600">Loading...</div>;
  }
  if (error) {
    return <div className="text-red-500 text-center">Error: {error}</div>;
  }

  console.log("+++++++++++++++++++++++++++++data", data)

  
  return (
    <>
{data && (
  <div className="w-full flex max-w-4xl mx-auto mt-4">
  <div className="flex flex-col items-center w-full">
    {/* winning trend */}
    <VenueTossTrends data ={data.win_stats} />

    {/* pei chart */}
    <DreamTeamChart data ={data.position_wise_fpts} matchInSights={matchInSights} total_matches ={data.total_matches}/>

    <Playerinformations players ={data.player_list} matchInSights = {matchInSights}/>

     <MatchDetails matchData ={data.matches_on_venue} />
  </div>

</div>
)}

</>

)}

const AwayTeam = ({matchInSights}) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (!matchInSights?.season_game_uid) {
      console.warn("season_game_uid is undefined or null");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.post(
          "https://plapi.perfectlineup.in/fantasy/stats/teams_venue_stats",
          {
            season_game_uid: matchInSights.season_game_uid,
            league_id: matchInSights.league_id,
            sports_id: "7", // Assuming sports_id is always 7
            team_uid : matchInSights.away_uid
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
        setData(response.data.data);
      } catch (error) {
        console.error("API Error:", error);
        setError(error.message || "An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [matchInSights?.season_game_uid]);

   // Render error/loading states if needed
   if (loading) {
    return <div className="text-center text-gray-600">Loading...</div>;
  }
  if (error) {
    return <div className="text-red-500 text-center">Error: {error}</div>;
  }
  
  return (

    <h1>AwayTeam</h1>

)}

const RechartsPieChart = ({ bat, bowl, width = 200, height = 200 }) => {
  const data = [
    { name: "BAT", value: bat },
    { name: "BOWL", value: bowl },
  ];

  return (
    <div style={{ width: `${width}px`, height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={width / 4}
            outerRadius={width / 2}
            dataKey="value"
            label
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const VenueMatchCard = ({ matchData }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
  };

  const getScore = (team, scoreData) => {
    const inning = scoreData["1"];
    const overs = team === "home" ? inning.home_overs : inning.away_overs;
    const wickets = team === "home" ? inning.home_wickets : inning.away_wickets;
    const runs =
      team === "home" ? inning.home_team_score : inning.away_team_score;
    return `${runs}/${wickets} (${overs} Overs)`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-4 p-4 bg-white rounded-lg shadow-md">
      {/* League Name and Date */}
      <div className="flex justify-center items-center mb-4 flex-col">
        <div className="text-lg font-semibold text-gray-800">
          {matchData.league_name}
        </div>
        <div className="text-sm text-gray-500">
          {formatDate(matchData.season_scheduled_date)}
        </div>
      </div>

      {/* Fixture Card */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0">
        {/* Home Team */}
        <div className="flex flex-col items-center w-full sm:w-1/3">
          <img
            className="w-12 h-12 mb-2"
            src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${matchData.home_flag}`}
            alt={`${matchData.home} flag`}
          />
          <div className="text-lg font-bold text-gray-900">
            {matchData.home}
          </div>
          <div className="text-sm text-gray-600">
            {getScore("home", JSON.parse(matchData.score_data))}
          </div>
        </div>

        {/* VS and Result */}
        <div className="flex flex-col items-center">
          <div className="text-xl font-bold text-gray-700">VS</div>
          <div className="text-sm text-green-600 mt-1">
            {matchData.result_label}
          </div>
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center w-full sm:w-1/3">
          <img
            className="w-12 h-12 mb-2"
            src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${matchData.away_flag}`}
            alt={`${matchData.away} flag`}
          />
          <div className="text-lg font-bold text-gray-900">
            {matchData.away}
          </div>
          <div className="text-sm text-gray-600">
            {getScore("away", JSON.parse(matchData.score_data))}
          </div>
        </div>
      </div>

      {/* Dream Team Fantasy Points */}
      <div className="text-center mb-4">
        <div className="text-lg font-semibold text-gray-800">
          Dream Team Fantasy Points
        </div>
      </div>

      {/* Fantasy Points Graph */}
      <div className="flex flex-col items-center mb-6">
        <RechartsPieChart
          bat={matchData.position_breakdown.BAT}
          bowl={matchData.position_breakdown.BOWL}
          width={300}
          height={300}
        />
        <div className="text-sm text-gray-600 mt-2">Total Fantasy Points</div>
        <div className="flex space-x-4 mt-2">
          <div className="text-xs">
            <span className="text-gray-700">BAT: </span>
            <span className="font-bold text-[#D0ECF6]">
              {matchData.position_breakdown.BAT}
            </span>
          </div>
          <div className="text-xs">
            <span className="text-gray-700">BOWL: </span>
            <span className="font-bold text-[#F9DACF]">
              {matchData.position_breakdown.BOWL}
            </span>
          </div>
        </div>
      </div>

      {/* Inning-wise Fantasy Points */}
      <div className="flex flex-col sm:flex-row justify-center space-y-6 sm:space-y-0 sm:space-x-6 mb-6">
        {/* 1st Inning */}
        <div className="flex flex-col items-center">
          <RechartsPieChart
            bat={matchData.inning_match_breakdown["1"].BAT}
            bowl={matchData.inning_match_breakdown["1"].BOWL}
            width={200}
            height={200}
          />
          <div className="text-sm text-gray-600 mt-2">
            1st Inning Fantasy Points
          </div>
          <div className="flex space-x-2 mt-1 text-xs">
            <span className="text-[#D0ECF6] font-bold">
              {matchData.inning_match_breakdown["1"].BAT}
            </span>
            <span className="text-[#F9DACF] font-bold">
              {matchData.inning_match_breakdown["1"].BOWL}
            </span>
          </div>
        </div>

        {/* 2nd Inning */}
        <div className="flex flex-col items-center">
          <RechartsPieChart
            bat={matchData.inning_match_breakdown["2"].BAT}
            bowl={matchData.inning_match_breakdown["2"].BOWL}
            width={200}
            height={200}
          />
          <div className="text-sm text-gray-600 mt-2">
            2nd Inning Fantasy Points
          </div>
          <div className="flex space-x-2 mt-1 text-xs">
            <span className="text-[#D0ECF6] font-bold">
              {matchData.inning_match_breakdown["2"].BAT}
            </span>
            <span className="text-[#F9DACF] font-bold">
              {matchData.inning_match_breakdown["2"].BOWL}
            </span>
          </div>
        </div>
      </div>

      {/* Match Report Link */}
      <div className="text-center">
        <Link
          to={`/match-report/Cricket/${matchData.es_season_game_uid}/${matchData.home}_vs_${matchData.away}/${matchData.league_id}/scorecard`}
          state={{
            matchInSights: matchData,
            matchSessionIDs: matchData.es_season_game_uid,
            matchleageIDs: matchData.league_id,
          }}
          className="text-blue-600 hover:underline"
        >
          {" "}
          Match Report
        </Link>
      </div>
    </div>
  );
};

const VenueMatchCardList = ({ matches }) => {
  return (
    <div className="space-y-6">
      {matches.map((match, index) => (
        <VenueMatchCard key={index} matchData={match} />
      ))}
    </div>
  );
};

const FantasyPointsGraph = ({ data }) => {
  if (
    !data ||
    !data.overall_pts_brkdn ||
    !data.first_inn_pts_brkdn ||
    !data.second_inn_pts_brkdn
  ) {
    console.log("FantasyPointsGraph Data is missing:", data);
    return <div>Loading...</div>;
  }

  // Common chart styling
  const commonOptions = {
    chart: {
      type: "pie",
      backgroundColor: "transparent",
      style: { fontFamily: '"Exo2-Medium", sans-serif' },
    },
    credits: { enabled: false },
    tooltip: { pointFormat: "{series.name}: <b>{point.percentage:.1f}%</b>" },
    accessibility: { point: { valueSuffix: "%" } },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        dataLabels: {
          enabled: true,
          format: "<b>{point.name}</b><br>{point.y}",
          style: { color: "#212341", fontSize: "14px", fontWeight: "500" },
          distance: -30,
        },
        showInLegend: false,
        borderWidth: 0,
      },
    },
  };

  // Overall points breakdown chart
  const overallOptions = {
    ...commonOptions,
    chart: { ...commonOptions.chart, height: "300px" },
    title: {
      text: "BAT & BOWL strength in %",
      align: "center",
      verticalAlign: "bottom",
      y: 15,
      style: { fontSize: "16px", fontWeight: "500", color: "#212341" },
    },
    series: [
      {
        name: "Percentage",
        colorByPoint: true,
        innerSize: "0%",
        data: [
          {
            name: "BAT",
            y: data.overall_pts_brkdn.bat_percent,
            color: "#D0ECF6",
          },
          {
            name: "BOWL",
            y: data.overall_pts_brkdn.bow_percent,
            color: "#F9DACF",
          },
        ],
      },
    ],
  };

  // Function to create innings charts
  const createInningsOptions = (title, bat, bowl) => ({
    ...commonOptions,
    chart: { ...commonOptions.chart, height: "220px" },
    title: {
      text: title,
      align: "center",
      verticalAlign: "bottom",
      y: 15,
      style: { fontSize: "14px", fontWeight: "500", color: "#212341" },
    },
    series: [
      {
        name: "Points",
        colorByPoint: true,
        innerSize: "0%",
        data: [
          { name: "BAT", y: bat || 0, color: "#D0ECF6" },
          { name: "BOWL", y: bowl || 0, color: "#F9DACF" },
        ],
      },
    ],
  });

  return (
    <div className="w-full flex flex-col items-center justify-center text-center gap-8 mt-4 mx-auto max-w-4xl">
      {/* Overall Points Breakdown */}
      <div className="w-full md:w-3/5 mx-auto">
        <HighchartsReact highcharts={Highcharts} options={overallOptions} />
      </div>

      {/* Innings Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <div className="flex flex-col items-center">
          <HighchartsReact
            highcharts={Highcharts}
            options={createInningsOptions(
              "1st Inning",
              data.first_inn_pts_brkdn.BAT,
              data.first_inn_pts_brkdn.BOWL
            )}
          />
          <div className="text-center mt-2 text-gray-700">Fantasy Points</div>
        </div>
        <div className="flex flex-col items-center">
          <HighchartsReact
            highcharts={Highcharts}
            options={createInningsOptions(
              "2nd Inning",
              data.second_inn_pts_brkdn.BAT,
              data.second_inn_pts_brkdn.BOWL
            )}
          />
          <div className="text-center mt-2 text-gray-700">Fantasy Points</div>
        </div>
      </div>
    </div>
  );
};

const FantasyPointsBolwGraph = ({ data }) => {
  if (!data || (!data["1"] && !data["2"]) || !data.SPIN || !data.PACE) {
    console.log("FantasyPointsGraph Data is missing or incomplete:", data);
    return <div>Loading...</div>;
  }

  // Function to calculate percentage
  const getPercentage = (value, total) => (total ? (value / total) * 100 : 0);

  // Common chart styling
  const commonOptions = {
    chart: {
      type: "pie",
      backgroundColor: "transparent",
      style: { fontFamily: '"Exo2-Medium", sans-serif' },
    },
    credits: { enabled: false },
    tooltip: { pointFormat: "{series.name}: <b>{point.percentage:.1f}%</b>" },
    accessibility: { point: { valueSuffix: "%" } },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: "pointer",
        dataLabels: {
          enabled: true,
          format: "<b>{point.name}</b><br>{point.y}",
          style: { color: "#212341", fontSize: "14px", fontWeight: "500" },
          distance: -30,
        },
        showInLegend: false,
        borderWidth: 0,
      },
    },
  };

  // Overall points breakdown chart
  const overallOptions = {
    ...commonOptions,
    chart: { ...commonOptions.chart, height: "300px" },
    title: {
      text: "Fantasy Points per Over Earned by Pacer vs Spinner",
      align: "center",
      verticalAlign: "bottom",
      y: 15,
      style: { fontSize: "16px", fontWeight: "500", color: "#212341" },
    },
    series: [
      {
        name: "Percentage",
        colorByPoint: true,
        innerSize: "0%",
        data: [
          {
            name: "SPIN",
            y: data.SPIN || 0,
            color: "#D0ECF6",
          },
          {
            name: "PACE",
            y: data.PACE || 0,
            color: "#F9DACF",
          },
        ],
      },
    ],
  };

  // Function to create innings charts
  const createInningsOptions = (title, SPIN = 0, PACE = 0) => ({
    ...commonOptions,
    chart: { ...commonOptions.chart, height: "220px" },
    title: {
      text: title,
      align: "center",
      verticalAlign: "bottom",
      y: 15,
      style: { fontSize: "14px", fontWeight: "500", color: "#212341" },
    },
    series: [
      {
        name: "Points",
        colorByPoint: true,
        innerSize: "0%",
        data: [
          { name: "SPIN", y: SPIN, color: "#D0ECF6" },
          { name: "PACE", y: PACE, color: "#F9DACF" },
        ],
      },
    ],
  });

  return (
    <div className="w-full flex flex-col items-center justify-center text-center gap-8 mt-4 mx-auto max-w-4xl">
      {/* Overall Points Breakdown */}
      <div className="w-full md:w-3/5 mx-auto">
        <HighchartsReact highcharts={Highcharts} options={overallOptions} />
      </div>

      {/* Innings Breakdown - Render only if available */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {data["1"] && (
          <div className="flex flex-col items-center">
            <HighchartsReact
              highcharts={Highcharts}
              options={createInningsOptions(
                "1st Inning",
                data["1"].SPIN || 0,
                data["1"].PACE || 0
              )}
            />
            <div className="text-center mt-2 text-gray-700">Fantasy Points</div>
          </div>
        )}
        {data["2"] && (
          <div className="flex flex-col items-center">
            <HighchartsReact
              highcharts={Highcharts}
              options={createInningsOptions(
                "2nd Inning",
                data["2"].SPIN || 0,
                data["2"].PACE || 0
              )}
            />
            <div className="text-center mt-2 text-gray-700">Fantasy Points</div>
          </div>
        )}
      </div>
    </div>
  );
};

function TossStatistics({ data }) {
  const getPercentage = (value, total) => (total ? (value / total) * 100 : 0);

  return (
    <div className="flex justify-center items-center w-full mt-2">
      <div className="bg-white p-6 rounded-lg shadow-md space-y-4 w-full max-w-2xl">
        {/* Decision after winning the toss */}
        <div>
          <h3 className="text-gray-900 font-bold uppercase text-sm text-center">
            Decision After Winning the Toss
          </h3>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Choose to Bat First</span>
            <span>Choose to Chase</span>
          </div>
          <div className="flex mt-1 rounded-full overflow-hidden bg-gray-500 text-white text-xs font-bold">
            <div
              className="text-center bg-gray-800 py-1"
              style={{
                width: `${getPercentage(
                  data.toss_trend.choose_bat_first,
                  data.toss_trend.choose_bat_first +
                    data.toss_trend.choose_bowl_first
                )}%`,
              }}
            >
              {data.toss_trend.choose_bat_first}
            </div>
            <div
              className="text-center py-1"
              style={{
                width: `${getPercentage(
                  data.toss_trend.choose_bowl_first,
                  data.toss_trend.choose_bat_first +
                    data.toss_trend.choose_bowl_first
                )}%`,
              }}
            >
              {data.toss_trend.choose_bowl_first}
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
            <div
              className="text-center bg-gray-800 py-1"
              style={{
                width: `${getPercentage(
                  data.toss_trend.bat_first_win,
                  data.toss_trend.bat_first_win + data.toss_trend.bat_second_win
                )}%`,
              }}
            >
              {data.toss_trend.bat_first_win}
            </div>
            <div
              className="text-center py-1"
              style={{
                width: `${getPercentage(
                  data.toss_trend.bat_second_win,
                  data.toss_trend.bat_first_win + data.toss_trend.bat_second_win
                )}%`,
              }}
            >
              {data.toss_trend.bat_second_win}
            </div>
          </div>
        </div>

        {/* Wins after winning toss */}
        <div>
          <h3 className="text-gray-900 font-bold uppercase text-sm text-center">
            Wins After Winning Toss -{" "}
            <span className="font-normal">
              {data.toss_trend.toss_win_match_win}/
              {data.toss_trend.total_matches} Matches
            </span>
          </h3>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Win</span>
            <span>Loss</span>
          </div>
          <div className="flex mt-1 rounded-full overflow-hidden bg-gray-500 text-white text-xs font-bold">
            <div
              className="text-center bg-gray-800 py-1"
              style={{
                width: `${getPercentage(
                  data.toss_trend.toss_win_match_win,
                  data.toss_trend.total_matches
                )}%`,
              }}
            >
              {getPercentage(
                data.toss_trend.toss_win_match_win,
                data.toss_trend.total_matches
              ).toFixed(1)}
              %
            </div>
            <div
              className="text-center py-1"
              style={{
                width: `${
                  100 -
                  getPercentage(
                    data.toss_trend.toss_win_match_win,
                    data.toss_trend.total_matches
                  )
                }%`,
              }}
            >
              {(
                100 -
                getPercentage(
                  data.toss_trend.toss_win_match_win,
                  data.toss_trend.total_matches
                )
              ).toFixed(1)}
              %
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Leaderboard = ({ playersData, matchInSights, className }) => {
  const [activeTab, setActiveTab] = useState("TOTAL");

  // 1. Grab top 7 for each category, sorted by averages or total points (highest to lowest)
  const topBat = useMemo(() => {
    return [...playersData]
      .map((player) => ({
        ...player,
        bat_avg:
          Number(player.bat_pt) / (Number(player.total_match_count) || 1),
      }))
      .sort((a, b) => b.bat_avg - a.bat_avg) // Sort by batting average
      .slice(0, 7);
  }, [playersData]);

  const topBow = useMemo(() => {
    return [...playersData]
      .map((player) => ({
        ...player,
        bowl_avg:
          Number(player.bowl_pt) / (Number(player.total_match_count) || 1),
      }))
      .sort((a, b) => b.bowl_avg - a.bowl_avg) // Sort by bowling average
      .slice(0, 7);
  }, [playersData]);

  const topTotal = useMemo(() => {
    return [...playersData]
      .sort((a, b) => Number(b.fantasy_points) - Number(a.fantasy_points)) // Sort by total fantasy points
      .slice(0, 7);
  }, [playersData]);

  // 2. Determine which data set is displayed
  const displayedData =
    activeTab === "BAT" ? topBat : activeTab === "BOW" ? topBow : topTotal;

  // 3. Compute the maximum value needed for the progress bar in each tab
  const maxBatAvg = useMemo(() => {
    return topBat.reduce((acc, player) => Math.max(acc, player.bat_avg), 0);
  }, [topBat]);

  const maxBowAvg = useMemo(() => {
    return topBow.reduce((acc, player) => Math.max(acc, player.bowl_avg), 0);
  }, [topBow]);

  const maxTotalPoints = useMemo(() => {
    return topTotal.reduce((acc, player) => {
      const total = Number(player.fantasy_points);
      return Math.max(acc, total);
    }, 0);
  }, [topTotal]);

  return (
    <div
      className={`flex flex-col items-center justify-center w-full ${className}`}
    >
      <div className="w-full flex flex-col justify-center items-center">
        {/* Tabs (centered) */}
        <div className="flex justify-center space-x-2 mb-4 w-full">
          <button
            onClick={() => setActiveTab("BAT")}
            className={`px-4 py-2 rounded ${
              activeTab === "BAT"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            BAT Points
          </button>
          <button
            onClick={() => setActiveTab("BOW")}
            className={`px-4 py-2 rounded ${
              activeTab === "BOW"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            BOW Points
          </button>
          <button
            onClick={() => setActiveTab("TOTAL")}
            className={`px-4 py-2 rounded ${
              activeTab === "TOTAL"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            TOTAL Points
          </button>
        </div>

        {/* List of Players */}
        <div className="space-y-4 w-full">
          {displayedData.map((player) => {
            // Decide what to display and how to scale the progress bar
            let displayText = "";
            let progressWidth = 0;

            if (activeTab === "BAT") {
              // Use precomputed batting average
              displayText = `Avg ${player.bat_avg.toFixed(2)} Pts/Match`;
              progressWidth = maxBatAvg
                ? (player.bat_avg / maxBatAvg) * 100
                : 0;
            } else if (activeTab === "BOW") {
              // Use precomputed bowling average
              displayText = `Avg ${player.bowl_avg.toFixed(2)} Pts/Match`;
              progressWidth = maxBowAvg
                ? (player.bowl_avg / maxBowAvg) * 100
                : 0;
            } else {
              // Total fantasy points
              const totalPts = Number(player.fantasy_points);
              displayText = `Fantasy ${totalPts} Pts`;
              progressWidth = maxTotalPoints
                ? (totalPts / maxTotalPoints) * 100
                : 0;
            }

            return (
              <Link
                key={player.player_uid}
                to={`/player/${player.player_uid}/${
                  player.display_name?.replace(/\s+/g, "_") ||
                  player.full_name?.replace(/\s+/g, "_") ||
                  "unknown"
                }/${matchInSights.season_game_uid}/form`}
                state={{
                  playerInfo: player,
                  matchID: matchInSights.season_game_uid,
                  matchInSights: matchInSights,
                }}
                className="flex w-full items-center justify-between space-x-6"
              >
                <div
                  key={player.player_id}
                  className="border-b pb-3 last:border-b-0 w-full"
                >
                  <div className="flex items-center gap-2 w-full">
                    {/* Player info (name, position, team) */}
                    <div className="flex-shrink-0 w-48">
                      <div className="font-semibold text-lg truncate">
                        {player.full_name}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center">
                        {player.position}
                        <span className="mx-2">•</span>
                        {player.team_abbr}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="relative flex-grow h-8 bg-gray-300 rounded self-center">
                      <div
                        className="absolute top-0 left-0 h-8 rounded"
                        style={{
                          width: `${progressWidth}%`,
                          backgroundColor:
                            player.team_abbr === matchInSights?.home
                              ? "rgba(244, 118, 76, 0.8)" // home team color
                              : "rgba(80, 193, 232, 0.8)", // away team color
                        }}
                      />
                    </div>

                    {/* Display text for each tab */}
                    <div className="text-sm text-gray-600 flex-shrink-0 w-32 text-right self-center">
                      {displayText}
                    </div>

                    {/* Star (Favorite) Icon */}
                    <div className="w-10 h-10 flex-shrink-0 flex justify-center items-center">
                      <img
                        alt="Favorite icon"
                        src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_prefer_inactive.svg"
                        className="w-6 h-6"
                      />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const PlayerList = ({ players, matchInSights }) => {
  const filteredPlayers = players
    .filter((player) => player.captain_count !== "0")
    .sort((a, b) => b.captain_count - a.captain_count)
    .slice(0, 5);
  const maxCaptainCount = filteredPlayers.reduce(
    (max, player) => Math.max(max, Number(player.captain_count)),
    0
  );
  return (
    <div className="mt-4 border rounded-lg p-4 bg-white shadow-md max-w-4xl mx-auto">
      {filteredPlayers.map((player, index) => (
        <PlayerCard
          key={index}
          player={player}
          matchInSights={matchInSights}
          maxCaptainCount={maxCaptainCount}
        />
      ))}
    </div>
  );
};

const PlayerCard = ({ player, matchInSights, maxCaptainCount }) => {
  const playerUrl = `/player/${player.player_uid}/${
    player.display_name?.replace(/\s+/g, "_") ||
    player.full_name?.replace(/\s+/g, "_") ||
    "unknown"
  }/${matchInSights.season_game_uid}/form`;

  // Dynamic width calculation for progress bar (max width = 100%)
  const progressWidth = Math.min(
    (player.captain_count / maxCaptainCount) * 100,
    100
  );

  return (
    <div className="border p-4 rounded-lg mb-3 flex items-center bg-gray-100 w-full max-w-4xl mx-auto px-6 shadow-md">
      <Link
        key={player.player_uid}
        to={playerUrl}
        state={{
          playerInfo: player,
          matchID: matchInSights.season_game_uid,
          matchInSights: matchInSights,
        }}
        className="flex w-full items-center justify-between space-x-6"
      >
        {/* Player Info */}
        <div className="flex items-center w-1/3 space-x-4">
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-gray-800">
              {player.full_name}
            </span>
            <span className="text-sm text-gray-600">
              {player.position} • {player.team_abbr}
            </span>
          </div>
        </div>

        {/* Performance Bar */}

        <div className="flex-1 px-4">
          <div className="bg-gray-200 h-6 rounded-lg overflow-hidden w-full">
            <div
              className="bg-[#f4764c] opacity-50 h-full transition-all"
              style={{
                width: `${progressWidth}%`,
                backgroundColor:
                  player.team_abbr === matchInSights.home
                    ? "rgba(244, 118, 76, 0.8)"
                    : "rgba(80, 193, 232, 0.8)",
              }}
            ></div>
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {player.captain_count}x Captain in {player.total_match_count} Match{" "}
            {player.total_match_count > 1 ? "es" : ""}
          </div>
        </div>

        {/* Star (Favorite) Icon */}
        <div className="w-10 h-10 flex justify-center items-center">
          <img
            alt="Favorite icon"
            src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_prefer_inactive.svg"
            className="w-6 h-6"
          />
        </div>
      </Link>
    </div>
  );
};

const TossStatisticsChart = ({ data }) => {
  if (!data) {
    return <div className="text-center text-gray-700">Loading...</div>;
  }

  const batFirstWinPercent = data.bat_first_win;
  const batSecondWinPercent = data.bat_second_win;

  // Common options for gauge-style pie chart
  const getChartOptions = (title, percentage) => ({
    chart: {
      type: "pie",
      backgroundColor: "transparent",
    },
    title: { text: "", align: "center" },
    credits: { enabled: false },
    tooltip: { enabled: false },
    plotOptions: {
      pie: {
        startAngle: -90,
        endAngle: 90,
        center: ["50%", "75%"],
        size: "90%",
        dataLabels: {
          enabled: true,
          format: "<b>{point.y}%</b>",
          style: { fontSize: "16px", fontWeight: "bold", color: "#212341" },
          y: -10, // Adjust text position
        },
      },
    },
    series: [
      {
        name: "Win %",
        innerSize: "65%", // Creates the donut effect
        data: [
          { name: "Wins", y: percentage, color: "#FA274E" },
          { name: "Losses", y: 100 - percentage, color: "#EFEFEF" },
        ],
      },
    ],
  });

  return (
    <div className="w-full flex flex-col items-center justify-center text-center mt-4 mx-auto max-w-4xl p-4 bg-white shadow-md rounded-lg">
      {/* Header */}
      <div className="flex items-center bg-gray-100 px-4 py-2 rounded-md w-full">
        <img
          className="w-6 h-6 mr-2"
          src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic-tip.png"
          alt="Tip"
        />
        <div className="text-sm font-semibold text-gray-700">
          Pick players evenly from both teams
        </div>
      </div>

      {/* Charts Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 w-full">
        {/* Wins Batting First */}
        <div className="flex flex-col items-center bg-gray-50 p-4 rounded-lg shadow">
          <HighchartsReact
            highcharts={Highcharts}
            options={getChartOptions("Wins Batting First", batFirstWinPercent)}
          />
          <div className="text-gray-700 font-semibold mt-2">
            Wins Batting First
          </div>
        </div>

        {/* Wins While Chasing */}
        <div className="flex flex-col items-center bg-gray-50 p-4 rounded-lg shadow">
          <HighchartsReact
            highcharts={Highcharts}
            options={getChartOptions("Wins While Chasing", batSecondWinPercent)}
          />
          <div className="text-gray-700 font-semibold mt-2">
            Wins While Chasing
          </div>
        </div>
      </div>
    </div>
  );
};

function VenuePerformance() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const matchInSights = location.state?.matchInSights;
  const [activeTab, setActiveTab] = useState("OVERVIEW");
  console.log(Getlocation());
  const Tabs = [
    "OVERVIEW",
    `LAST 10 ${
      matchInSights.format === "1"
        ? "Test"
        : matchInSights.format === "2"
        ? "ODI"
        : matchInSights.format === "3"
        ? "T20"
        : matchInSights.format === "4"
        ? "T10"
        : matchInSights.format
    } MATCH`,
    matchInSights.home,
    matchInSights.away,
  ];

  useEffect(() => {
    if (!matchInSights?.season_game_uid) {
      console.warn("season_game_uid is undefined or null");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.post(
          "https://plapi.perfectlineup.in/fantasy/stats/venue_and_pitch_analysis",
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
        setData(response.data.data);
      } catch (error) {
        console.error("API Error:", error);
        setError(error.message || "An error occurred while fetching data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [matchInSights?.season_game_uid]);

  // Countdown function that gets recalculated on each re-render
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

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  // Render error/loading states if needed
  if (loading) {
    return <div className="text-center text-gray-600">Loading...</div>;
  }
  if (error) {
    return <div className="text-red-500 text-center">Error: {error}</div>;
  }
  if (!matchInSights) {
    return null;
  }

  console.log("++++++++++++++++++++++++++++++++data", data);
  console.log("++++++++++++++++++++++++++++++++matchInSights", matchInSights);
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

      {data && data.venue_info && (
        <div className="w-full flex justify-center px-3 py-1 font-bold font-[Exo2-Bold] text-xl rounded-md mt-2 ">
          {data.venue_info.ground_name}
        </div>
      )}

      <div className="w-full flex justify-center items-center max-w-4xl mx-auto p-4 border-b bg-[#28282829] text-center shadow-md">
        {matchInSights.format === "1"
          ? "Test"
          : matchInSights.format === "2"
          ? "ODI"
          : matchInSights.format === "3"
          ? "T20"
          : matchInSights.format === "4"
          ? "T10"
          : matchInSights.format}{" "}
        on this venue over the last 6 months. Points are displayed only for
        batting & bowling efforts, fielding related points are not calculated.
      </div>

      <div className="mt-6 border-b flex justify-center w-full">
        <nav className="flex gap-6 text-gray-600 justify-center w-full">
          {Tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-6 text-sm font-medium ${
                activeTab === tab
                  ? "border-b-2 border-blue-500 text-gray-900 font-semibold"
                  : "hover:text-gray-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "OVERVIEW" && data && (
        <>
          <div className="w-full flex max-w-4xl mx-auto">
            <div className="flex items-center w-full">
              <span className="text-xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                Venue Stats
              </span>
              <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
            </div>
          </div>

          <div className="w-full flex justify-center items-center max-w-3xl mx-auto p-4  text-center shadow-md mt-4">
            <FantasyPointsGraph data={data.fp_breakdown_graph} />
          </div>

          <div className="w-full flex max-w-4xl mx-auto mt-4">
            <div className="flex flex-col items-center w-full">
              {/* Heading and Subtitle */}
              <div className="view-win-container w-full">
                <div className="flex items-center w-full">
                  <span className="text-xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                    WIN PROBABILITY
                  </span>
                  <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
                </div>
                <span className="text-l font-bold md:text-gray-500 italic">
                  Make even selection of batsman and bowlers
                </span>
              </div>

              {/* Stats Section */}
              <div className="flex justify-between space-x-4 mt-2">
                <div className="flex-1 bg-gray-100 p-4 rounded-lg text-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {data.avg_first_inning_score}
                  </span>
                  <p className="text-gray-500 text-sm">
                    Avg First Innings Score
                  </p>
                </div>
                <div className="flex-1 bg-gray-100 p-4 rounded-lg text-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {data.avg_wicket_lost_per_inning}
                  </span>
                  <p className="text-gray-500 text-sm">
                    Avg Wickets Lost per Inning
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full flex max-w-4xl mx-auto mt-4 flex-col items-center">
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

            {/* Centering and Increasing Width of TossStatistics */}
            <div className="w-full max-w-3xl flex justify-center items-center px-3 py-1 font-bold font-[Exo2-Bold] text-xl rounded-md">
              <TossStatistics data={data} className="w-full" />
            </div>
          </div>

          <div className="w-full flex max-w-4xl mx-auto">
            <div className="flex items-center w-full">
              <span className="text-xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                Pacers perform better
              </span>
              <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
            </div>
          </div>

          <div className="w-full flex justify-center items-center max-w-3xl mx-auto p-4  text-center shadow-md mt-4">
            <FantasyPointsBolwGraph data={data.bowling_analysis} />
          </div>

          <div className="w-full flex max-w-4xl mx-auto mt-4">
            <div className="flex flex-col items-center w-full">
              {/* Heading and Subtitle */}
              <div className="view-win-container w-full">
                <div className="flex items-center w-full">
                  <span className="text-xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                    Equal chance of winning
                  </span>
                  <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
                </div>
                <span className="text-l font-bold md:text-gray-500 italic">
                  batting first or second
                </span>
              </div>

              <div className="w-full max-w-3xl flex justify-center items-center px-3 py-1 font-bold font-[Exo2-Bold] text-xl rounded-md">
                <TossStatisticsChart
                  data={data.toss_trend}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="w-full flex max-w-4xl mx-auto mt-4">
            <div className="flex flex-col items-center w-full">
              {/* Heading and Subtitle */}
              <div className="view-win-container w-full">
                <div className="flex items-center w-full">
                  <span className="text-xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                    Frequent captain and vice captain
                  </span>
                  <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
                </div>
                <span className="text-l font-bold md:text-gray-500 italic">
                  appearances on this venue
                </span>
              </div>

              <div className="w-full max-w-3xl flex justify-center items-center px-3 py-1 font-bold font-[Exo2-Bold] text-xl rounded-md">
                <PlayerList
                  players={data.player_list}
                  matchInSights={matchInSights}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="w-full flex max-w-4xl mx-auto mt-4">
            <div className="flex flex-col items-center w-full">
              {/* Heading and Subtitle */}
              <div className="view-win-container w-full">
                <div className="flex items-center w-full">
                  <span className="text-xl font-bold text-gray-800 uppercase tracking-wide mr-2 italic">
                    Top Players on this venue
                  </span>
                  <div className="border-t border-dotted border-gray-300 flex-1 h-px"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full flex justify-center items-center mt-4">
            <div className="w-full max-w-3xl mx-auto px-3 py-1 font-bold font-[Exo2-Bold] text-xl rounded-md">
              <Leaderboard
                playersData={data.player_list}
                matchInSights={matchInSights}
                className="w-full"
              />
            </div>
          </div>
        </>
      )}

      {activeTab ===
        `LAST 10 ${
          matchInSights.format === "1"
            ? "Test"
            : matchInSights.format === "2"
            ? "ODI"
            : matchInSights.format === "3"
            ? "T20"
            : matchInSights.format === "4"
            ? "T10"
            : matchInSights.format
        } MATCH` &&
        data && (
          <>
            <div className="w-full flex max-w-4xl mx-auto mt-4 justify-center">
              <div className="flex space-x-4 mt-2 max-w-lg">
                <div className="flex-1 bg-gray-100 p-4 rounded-lg text-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {data.avg_first_inning_score}
                  </span>
                  <p className="text-gray-500 text-sm">
                    Avg First Innings Score
                  </p>
                </div>
                <div className="flex-1 bg-gray-100 p-4 rounded-lg text-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {data.avg_wicket_lost_per_inning}
                  </span>
                  <p className="text-gray-500 text-sm">
                    Avg Wickets Lost per Inning
                  </p>
                </div>
              </div>
            </div>

            {/* Top 10 results in this venue */}
            <div className="w-full flex justify-center items-center mt-4">
              <div className="w-full max-w-3xl mx-auto px-3 py-1 font-bold font-[Exo2-Bold] text-xl rounded-md">
                <VenueMatchCardList
                  matches={data.matches_on_venue}
                  matchInSights={matchInSights}
                  className="w-full"
                />
              </div>
            </div>
          </>
        )}



        {activeTab ===  matchInSights.home  && (
        < HomeTeam matchInSights={matchInSights}   />
        )}

        {activeTab ===  matchInSights.away  && (
        < AwayTeam matchInSights={matchInSights} />
        )}
    </div> 
  );
}

export default VenuePerformance;
