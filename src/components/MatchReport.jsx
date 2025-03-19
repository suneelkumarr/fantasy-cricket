import React, { useState, useEffect, useCallback  } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios";
import { AiOutlineMenuFold } from "react-icons/ai";
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';


// import { AiOutlineStar } from "react-icons/ai"; // Unused import
// import Getlocation from './Getlocation.jsx'; // Unused import
// Example data structure

const TopPlayers = ({ matchData, stats_details }) => {
  const [activeTab, setActiveTab] = useState("FANTASY POINTS");

  // Derive sorted data based on activeTab (to avoid mutating the original array, use spread)
  const data =
    activeTab === "FANTASY POINTS"
      ? [...stats_details.player_list].sort(
          (a, b) => b.fantasy_points - a.fantasy_points
        )
      : [...stats_details.player_list].sort((a, b) => b.value - a.value);

  // Extract the team abbreviations from matchData (adjust if named differently)
  const homeTeamAbbr = matchData?.home;
  const awayTeamAbbr = matchData?.away;

  // Compute max for the currently selected tab
  const maxFantasyPoints = Math.max(
    ...data.map((player) => Number(player.fantasy_points))
  );
  const maxValue = Math.max(...data.map((player) => Number(player.value)));

  return (
    <div className="top-player-container bg-white p-4 shadow-md rounded-md w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="header text-xl font-bold mb-2 text-gray-700">
        Top Player
      </div>

      {/* Tabs */}
      <div className="child-tab-container border-b border-gray-300 mb-4">
        <div className="child-tab-list flex">
          <button
            onClick={() => setActiveTab("FANTASY POINTS")}
            className={`child-tab-item px-4 py-2 text-sm font-medium mr-2 ${
              activeTab === "FANTASY POINTS"
                ? "bg-blue-500 text-white rounded-t"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            FANTASY POINTS
          </button>
          <button
            onClick={() => setActiveTab("Value")}
            className={`child-tab-item px-4 py-2 text-sm font-medium ${
              activeTab === "Value"
                ? "bg-blue-500 text-white rounded-t"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            Value
          </button>
        </div>
      </div>

      {/* Favorite info */}
      <div className="fav-info-container flex items-center gap-2 mb-4">
        <img
          src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic-mark-fav-enable.png"
          alt="fav-icon"
          className="w-4 h-4"
        />
        <span className="text-sm text-gray-600">
          Mark a player as favourite and be reminded next time they play
        </span>
      </div>

      {/* Player list */}
      <div className="player-category-item">
        {data.map((player) => {
          // Current value based on which tab is active
          const currentValue =
            activeTab === "FANTASY POINTS"
              ? Number(player.fantasy_points)
              : Number(player.value);

          // Decide the max for the current tab
          const maxForTab =
            activeTab === "FANTASY POINTS" ? maxFantasyPoints : maxValue;

          // Calculate progress width
          const progressWidth = (currentValue / maxForTab) * 100;

          // Decide color based on team
          const progressColor =
            player.team_abbr === homeTeamAbbr
              ? "rgba(244, 118, 76, .25)"
              : "rgba(80, 193, 232, .25)";

          return (
            <div
              key={player.player_uid}
              className="matchreport-players-list border-b border-gray-100 py-3 last:border-b-0"
            >
              <div className="player-graph-team flex items-center justify-between">
                {/* Left: Player Info */}
                <div className="player-info-box w-1/4">
                  <div className="name-style font-medium text-gray-700">
                    {player.display_name}
                  </div>
                  <div className="position-style text-sm text-gray-500 flex items-center">
                    {player.player_position}
                    <div className="dot w-2 h-2 rounded-full bg-gray-400 mx-1"></div>
                    {player.team_abbr}
                  </div>
                </div>

                {/* Middle: Progress bar & points/value */}
                <div className="flex flex-1 items-center px-4">
                  <div className="relative w-full h-8 bg-gray-200 rounded overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full"
                      style={{
                        width: `${progressWidth}%`,
                        backgroundColor: progressColor,
                      }}
                    />
                  </div>
                  <div className="points-style text-sm text-gray-700 ml-2 font-medium">
                    {currentValue}
                  </div>
                </div>

                {/* Right: Favorite icon */}
                <div className="player-fav-box ml-2">
                  <div className="fav-unfav-item w-4 h-4">
                    <img
                      src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic-mark-fav-disable.png"
                      alt="fav-icon"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function DreamTeamChart({ matchData ,stats_details }) {

  const  {BOW, AR, BAT, WK} = stats_details.position_breakdown
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
    <div className="max-w-4xl mx-auto border rounded-md bg-white p-4 shadow-sm">
    {/* Header */}
    <h2 className="text-base font-bold mb-1">
      Fantasy points contribution by position in Dream Team
    </h2>
    <p className="text-sm text-gray-600 mb-4">
      Breakdown of fantasy points based on positions for players appearing in
      the Dream Team of the last played at this venue
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


function DreamTeamChartfildeing({ matchData ,stats_details }) {

  const  {BATTING, BOWLING, FIELDING} = stats_details.category_breakdown
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
            name: "BATTING",
            y: BATTING,
            color: "rgb(208,236,246)",
          },
          {
            name: "BOWLING",
            y: BOWLING,
            color: "rgb(249,218,207)",
          },
          {
            name: "FIELDING",
            y: FIELDING,
            color: "rgb(95,165,145)",
          }
        ],
      },
    ],
  };

  // 2. We'll store the data array separately for easy use below
  const chartData = chartOptions.series[0].data;


  return (
    <div className="max-w-4xl mx-auto border rounded-md bg-white p-4 shadow-sm">
    {/* Header */}
    <h2 className="text-base font-bold mb-1">
    Dream Team Points Breakdown
    </h2>
    <p className="text-sm text-gray-600 mb-4">
    Breakdown of fantasy points into Batting, Bowling and Fielding points for players appearing in the Dream Teams of the last played at this venue
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

 function DreamTeam({ matchData ,stats_details }) {
// 1) Filter players in perfect lineup
const dreamTeamPlayers = stats_details.player_list.filter(
  (player) => player.in_perfect_lineup === "1"
);

// 2) State to toggle between Salary and Fantasy Points
const [activeTab, setActiveTab] = useState("FantasyPoints");

// 3) Sum total based on the active tab
const totalValue = dreamTeamPlayers.reduce((sum, player) => {
  const value =
    activeTab === "FantasyPoints"
      ? Number(player.pl_fantasy_points ?? 0)
      : Number(player.player_salary ?? 0);
  return sum + value;
}, 0);

// 4) Map short position codes to user-friendly labels
const positionMap = {
  WK: "Wicket Keeper",
  BAT: "Batsman",
  BOW: "Bowler",
  AR: "All Rounder",
};

// 5) Group players by position
const groupedByPosition = dreamTeamPlayers.reduce((acc, player) => {
  const positionLabel = positionMap[player.player_position] || player.player_position;
  if (!acc[positionLabel]) acc[positionLabel] = [];
  acc[positionLabel].push(player);
  return acc;
}, {});

// 6) Define the order we want to display positions in
const positionOrder = ["Wicket Keeper", "Batsman", "All Rounder", "Bowler"];

return (
  <div className="max-w-4xl mx-auto p-4">
    {/* Title & Points */}
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-xl font-bold">Dream Team</h1>
      <div className="flex items-center">
        <div className="text-2xl font-semibold mr-2">{totalValue}</div>
        <div className="text-sm leading-tight">
          Dream team
          <br />
          {activeTab === "FantasyPoints" ? "points" : "salary"}
        </div>
      </div>
    </div>

    {/* Tabs: Salary / Fantasy Points */}
    <div className="mb-4 flex space-x-4 border-b border-gray-200 pb-2">
      <button
        className={
          activeTab === "Salary"
            ? "border-b-2 border-blue-600 text-blue-600 font-medium"
            : "text-gray-500 hover:text-gray-700"
        }
        onClick={() => setActiveTab("Salary")}
      >
        Salary
      </button>
      <button
        className={
          activeTab === "FantasyPoints"
            ? "border-b-2 border-blue-600 text-blue-600 font-medium"
            : "text-gray-500 hover:text-gray-700"
        }
        onClick={() => setActiveTab("FantasyPoints")}
      >
        Fantasy Points
      </button>
    </div>

    {/* Stadium background container */}
    <div
      className="
        relative 
        bg-no-repeat bg-cover bg-center 
        rounded-md p-4
        min-h-[400px]
      "
      style={{
        backgroundImage:
          'url("https://www.perfectlineup.in/static/media/ic_cricket_stadium.7d551e28.png")',
      }}
    >
      {/* Positions & Players */}
      <div className="relative space-y-8">
        {positionOrder.map((posLabel) => {
          const players = groupedByPosition[posLabel];
          if (!players) return null; // No players for this position
          return (
            <div key={posLabel} className="mb-6">
              <div className="font-bold text-lg mb-2">{posLabel}</div>

              {/* Display players in a responsive grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {players.map((player) => (
                  <div
                    key={player.stats_player_id}
                    className="flex items-center bg-white/80 p-2 rounded shadow"
                  >
                    {/* Jersey image */}
                    <img
                      className="w-8 h-8 mr-2"
                      alt={player.display_name + " Jersey"}
                      src={
                        "https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/" +
                        player.jersey
                      }
                    />

                    {/* Captain or Vice-captain */}
                    {player.C === 1 && (
                      <span className="text-red-600 font-semibold mr-2">
                        C
                      </span>
                    )}
                    {player.C === 2 && (
                      <span className="text-blue-600 font-semibold mr-2">
                        VC
                      </span>
                    )}

                    {/* Player Name */}
                    <div className="flex-1">{player.display_name}</div>

                    {/* Value (Fantasy Points or player_salary) based on activeTab */}
                    <div className="font-bold">
                      {activeTab === "FantasyPoints"
                        ? player.pl_fantasy_points
                        : player.player_salary}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);
}




const Overview = ({ matchData }) => {

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch Data
  const fetchData = useCallback(async () => {
    if (!matchData?.season_game_uid || !matchData?.league_id) {
      console.warn("Missing required matchData properties.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "https://plapi.perfectlineup.in/fantasy/completed_match/get_match_dream_team",
        {
          season_game_uid: matchData.season_game_uid,
          league_id: matchData.league_id,
          sports_id: "7",
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
  }, [matchData?.season_game_uid, matchData?.league_id]);

  // Run Fetch on Dependency Change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Loading & Error States
  if (loading) {
    return <div className="text-center text-gray-600">Loading...</div>;
  }
  if (error) {
    return <div className="text-red-500 text-center">Error: {error}</div>;
  }
  if (!data) {
    return <div className="text-center text-gray-600">No data available.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
    {data && data.stats && (
      <DreamTeam
        matchData={data.fixture_details} 
        stats_details={data.stats }
      />
    )}


    {data && data.stats && (
      <DreamTeamChart
        matchData={data.fixture_details} 
        stats_details={data.stats }
      />
    )}

    {data && data.stats && (
      <DreamTeamChartfildeing
        matchData={data.fixture_details} 
        stats_details={data.stats }
      />
    )}

    {data && data.stats && (
      <TopPlayers
        matchData={data.fixture_details} 
        stats_details={data.stats}
      />
    )}
    

  </div>
  );
};


const Table = ({ headers = [], rows = [] }) => {
  return (
    <div className="overflow-x-auto mb-4">
      <table className="w-full border-collapse bg-white text-sm">
        <thead className="bg-gray-100">
          <tr>
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="p-2 font-semibold text-gray-700 border-b text-left"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className="border-b hover:bg-gray-50">
              {row.map((col, cIdx) => (
                <td key={cIdx} className="p-2 text-gray-700">
                  {col}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


const Accordion = ({ title, score, overs, children }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border rounded bg-white mb-4">
      {/* Accordion Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold text-gray-800">{title}</span>
        <div className="flex items-center space-x-4">
          {/* Score Box */}
          <div className="text-gray-700">
            {score} <span className="text-sm text-gray-500">[{overs}]</span>
          </div>
          {/* Arrow/Chevron icon (rotate when open) */}
          <i
            className={`transform transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            ▼
          </i>
        </div>
      </div>

      {/* Accordion Body */}
      {isOpen && (
        <div className="p-4 border-t">
          {children}
        </div>
      )}
    </div>
  );
};


const Scorecard = ({ matchData, stats_details }) => {
  // Parse the top-level match info
  const parsedScoreData = JSON.parse(matchData.score_data);
  const inningKey = "1";

  // Extract IDs and names
  const homeTeamId = matchData.home_uid;
  const awayTeamId = matchData.away_uid;
  const homeTeamName = matchData.home_team_name; 
  const awayTeamName = matchData.away_team_name; 

  // Score data (home vs. away)
  const homeScore = parsedScoreData[inningKey].home_team_score;
  const homeWickets = parsedScoreData[inningKey].home_wickets;
  const homeOvers = parsedScoreData[inningKey].home_overs;

  const awayScore = parsedScoreData[inningKey].away_team_score;
  const awayWickets = parsedScoreData[inningKey].away_wickets;
  const awayOvers = parsedScoreData[inningKey].away_overs;

  // Detailed stats
  const homeTeamData = stats_details.scoring_stats[inningKey][homeTeamId];
  const awayTeamData = stats_details.scoring_stats[inningKey][awayTeamId];

  // Helper to build table rows
  const buildBattingRows = (batters = []) =>
    batters.map((player) => [
      <div key={player.player_uid}>
        <span className="block font-medium">{player.player_name}</span>
        <span className="block text-xs text-gray-500">{player.out_string}</span>
      </div>,
      player.batting_runs,
      player.batting_balls_faced,
      player.batting_fours,
      player.batting_sixes,
      player.batting_strike_rate,
    ]);

  const buildBowlingRows = (bowlers = []) =>
    bowlers.map((player) => {
      const oversFloat = parseFloat(player.bowling_overs || 0);
      const economy =
        oversFloat > 0
          ? (Number(player.bowling_runs_given) / oversFloat).toFixed(2)
          : "0.00";
      return [
        <div key={player.player_uid}>
          <span className="block font-medium">{player.player_name}</span>
        </div>,
        player.bowling_overs,
        player.bowling_maiden_overs,
        player.bowling_runs_given,
        player.bowling_wickets,
        economy,
      ];
    });

  const buildFoWRows = (fows = []) =>
    fows.map((item, idx) => [
      <div key={idx}>
        <span className="block font-medium">{item.name}</span>
        <span className="block text-xs text-gray-500">{item.how_out}</span>
      </div>,
      item.score_at_dismissal,
      item.overs_at_dismissal,
    ]);

  // Headers & Rows for HOME
  const homeBattingHeaders = ["Batsman", "R", "B", "4s", "6s", "SR"];
  const homeBowlingHeaders = ["Bowler", "O", "M", "R", "W", "ECON"];
  const homeFoWHeaders = ["Fall of Wicket", "Score", "Over"];

  const homeBattingRows = buildBattingRows(homeTeamData?.batting);
  const homeBowlingRows = buildBowlingRows(homeTeamData?.bowling);
  const homeFoWRows = buildFoWRows(homeTeamData?.fall_of_wickets);

  // Headers & Rows for AWAY
  const awayBattingHeaders = ["Batsman", "R", "B", "4s", "6s", "SR"];
  const awayBowlingHeaders = ["Bowler", "O", "M", "R", "W", "ECON"];
  const awayFoWHeaders = ["Fall of Wicket", "Score", "Over"];

  const awayBattingRows = buildBattingRows(awayTeamData?.batting);
  const awayBowlingRows = buildBowlingRows(awayTeamData?.bowling);
  const awayFoWRows = buildFoWRows(awayTeamData?.fall_of_wickets);

  return (
    <div className="bg-gray-100 min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* HOME TEAM ACCORDION */}
        <Accordion
          title={homeTeamName}
          score={`${homeScore}/${homeWickets}`}
          overs={`${homeOvers} Ovs`}
        >
          <Table headers={homeBattingHeaders} rows={homeBattingRows} />
          <Table headers={homeBowlingHeaders} rows={homeBowlingRows} />
          <Table headers={homeFoWHeaders} rows={homeFoWRows} />
        </Accordion>

        {/* AWAY TEAM ACCORDION */}
        <Accordion
          title={awayTeamName}
          score={`${awayScore}/${awayWickets}`}
          overs={`${awayOvers} Ovs`}
        >
          <Table headers={awayBattingHeaders} rows={awayBattingRows} />
          <Table headers={awayBowlingHeaders} rows={awayBowlingRows} />
          <Table headers={awayFoWHeaders} rows={awayFoWRows} />
        </Accordion>
      </div>
    </div>
  );
};

function ProjectedVsActual({ fixture_details, fantasy_data }) {
  // Dropdown open/close state
  const [filterOpen, setFilterOpen] = useState(false);

  // Which filter is currently selected?
  const [selectedFilter, setSelectedFilter] = useState("All");

  // 1. Handle picking a filter from the dropdown
  const handleFilterSelect = (filterValue) => {
    setSelectedFilter(filterValue);
    setFilterOpen(false); // close the dropdown once we pick
  };

  // 2. Function to filter a list of players based on `selectedFilter`
  const applyFilter = (playerArray) => {
    if (!playerArray) return [];

    if (selectedFilter === "All") {
      return playerArray;
    }

    // If filter is one of the roles (BATSMAN, WICKET-KEEPER, ALL ROUNDER, BOWLER)
    // we assume your data has:
    //   "BAT" for Batsman
    //   "WK" for Wicket-Keeper
    //   "AR" for All Rounder
    //   "BOW" for Bowler
    // If your data is different, adjust the logic accordingly.
    if (["BATSMAN", "WICKET-KEEPER", "ALL ROUNDER", "BOWLER"].includes(selectedFilter)) {
      // Map from the filter label to the data’s `player_position`
      const filterMap = {
        BATSMAN: "BAT",
        "WICKET-KEEPER": "WK",
        "ALL ROUNDER": "AR",
        BOWLER: "BOW",
      };
      const requiredPos = filterMap[selectedFilter];
      return playerArray.filter((p) => p.player_position === requiredPos);
    }

    // If the filter is a team (e.g. EMD, SAP)
    // we compare with `player.team_abbr`.
    if ([fixture_details.home, fixture_details.away].includes(selectedFilter)) {
      return playerArray.filter((p) => p.team_abbr === selectedFilter);
    }

    // If we somehow get here, return unfiltered
    return playerArray;
  };

  // 3. Helper to calculate bar widths (Projected vs Actual)
  const getBarWidths = (proj, actual) => {
    const p = Number(proj);
    const a = Number(actual);
    const total = p + a;
    if (total === 0) {
      return { projPercent: 0, actualPercent: 0 };
    }
    const projPercent = (p / total) * 100;
    const actualPercent = (a / total) * 100;
    return { projPercent, actualPercent };
  };

  // 4. Render a single row in any of the three categories
  const renderPlayerRow = (player) => {
    const { projPercent, actualPercent } = getBarWidths(
      player.player_fppg,
      player.fantasy_points
    );
  
    return (
      <div
        key={`${player.player_uid}-${player.team_abbr}`}
        className="table_points_view flex flex-col border-b last:border-0 py-3"
      >
        {/* Player Info */}
        <div className="flex flex-row items-start mb-2">
          <div className="first_table_column w-1/4">
            <div className="players_name font-semibold text-gray-800">
              {player.full_name}
            </div>
            <div className="players_matches text-sm text-gray-500 flex items-center">
              {player.player_position}
              <div className="small_dot w-1 h-1 bg-gray-400 rounded-full mx-2"></div>
              {player.team_abbr}
            </div>
          </div>
  
          {/* Bars Container */}
          <div className="second_table_column w-3/4 flex flex-col space-y-1">
            {/* Projected bar - top bar */}
            <div className="flex items-center">
              <div
                className="first_range h-8 bg-[#F0E5C2] flex items-center justify-end"
                style={{
                  width: `${projPercent.toFixed(1)}%`,
                  minWidth: player.player_fppg ? "2.5rem" : "0",
                }}
              >
                <div className="point_first text-sm text-gray-700 pr-2">
                  {player.player_fppg}
                </div>
              </div>
            </div>
  
            {/* Actual bar - bottom bar */}
            <div className="flex items-center">
              <div
                className="second_range h-8 bg-[#c2e4f0] flex items-center justify-end"
                style={{
                  width: `${actualPercent.toFixed(1)}%`,
                  minWidth: player.fantasy_points ? "2.5rem" : "0",
                }}
              >
                <div className="point_first text-sm text-gray-700 pr-2">
                  {player.fantasy_points}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 5. Prepare each category data with filter
  const underData = applyFilter(fantasy_data.under);
  const withinData = applyFilter(fantasy_data.within);
  const overData = applyFilter(fantasy_data.over);

  return (
    <div className="matchreport-overall-container bg-white p-4 sm:p-6 rounded shadow">
      <div className="format_container">
        {/* TOP TEXTS */}
        <h2 className="proj_and_Act_text text-lg font-bold text-gray-800">
          Projected vs actual fantasy points
        </h2>
        <p className="details_text text-sm text-gray-600 mt-1">
          PL projected points estimated before the match with actual fantasy
          points earned by the player in the match
        </p>

        {/* LEGEND + FILTER SECTION */}
        <div className="filter_icons_button_text mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
          {/* Legend */}
          <div className="flex items-center space-x-6">
            {/* Actual Points */}
            <div className="actual_points flex items-center space-x-2">
              <div className="small_circle w-3 h-3 rounded-full bg-[#c2e4f0]"></div>
              <div className="actual_text text-gray-700" style={{ width: "135px" }}>
                Actual Points
              </div>
            </div>
            {/* Projected Points */}
            <div className="actual_points flex items-center space-x-2">
              <div
                className="small_circle w-3 h-3 rounded-full"
                style={{ backgroundColor: "#F0E5C2" }}
              ></div>
              <div className="actual_text text-gray-700">Projected Points</div>
            </div>
          </div>

          {/* Filter Dropdown */}
          <div className="filter_icon self-end sm:self-auto" style={{ textAlign: "right" }}>
          <div className="createteam-drop-btn-style relative inline-block">
            <button
              type="button"
              className="dropdown-toggle btn btn-primary bg-blue-600 text-white px-3 py-1 rounded flex items-center"
              onClick={() => setFilterOpen((prev) => !prev)}
            >
              {/* Replace your <i className="icon-filter" ...> with the AiOutlineMenuFold icon */}
              <AiOutlineMenuFold className="mr-1 text-xl" />
            </button>
  
            {/* Dropdown Menu */}
            {filterOpen && (
              <div
                className="dropdown-menu absolute right-0 mt-2 w-48 bg-white border rounded shadow py-1 z-10"
                style={{ top: "100%", opacity: 1 }}
              >
                <button
                  onClick={() => handleFilterSelect("All")}
                  className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  All
                </button>
                <button
                  onClick={() => handleFilterSelect("BATSMAN")}
                  className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  BATSMAN
                </button>
                <button
                  onClick={() => handleFilterSelect("WICKET-KEEPER")}
                  className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  WICKET-KEEPER
                </button>
                <button
                  onClick={() => handleFilterSelect("ALL ROUNDER")}
                  className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  ALL ROUNDER
                </button>
                <button
                  onClick={() => handleFilterSelect("BOWLER")}
                  className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  BOWLER
                </button>
                <button
                  onClick={() => handleFilterSelect(fixture_details.home)}
                  className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  {fixture_details.home}
                </button>
                <button
                  onClick={() => handleFilterSelect(fixture_details.away)}
                  className="dropdown-item w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  {fixture_details.away}
                </button>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* UNDERESTIMATED SECTION */}
        <div className="points_view_container mt-6">
          <div className="header_text_view text-md font-semibold text-gray-800 mb-3">
            <span>Underestimated</span>
          </div>
          {underData.length > 0 ? (
            underData.map((player) => renderPlayerRow(player))
          ) : (
            <div className="text-sm text-gray-500">No data found.</div>
          )}
        </div>

        {/* WITHIN RANGE SECTION */}
        <div className="points_view_container mt-8">
          <div className="header_text_view text-md font-semibold text-gray-800 mb-3">
            <span>Within Range</span>
          </div>
          {withinData.length > 0 ? (
            withinData.map((player) => renderPlayerRow(player))
          ) : (
            <div className="text-sm text-gray-500">No data found.</div>
          )}
        </div>

        {/* OVERESTIMATED SECTION */}
        <div className="points_view_container mt-8">
          <div className="header_text_view text-md font-semibold text-gray-800 mb-3">
            <span>Overestimated</span>
          </div>
          {overData.length > 0 ? (
            overData.map((player) => renderPlayerRow(player))
          ) : (
            <div className="text-sm text-gray-500">No data found.</div>
          )}
        </div>
      </div>
    </div>
  );
}

const Fantasy = ({ matchData }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch Data
  const fetchData = useCallback(async () => {
    if (!matchData?.season_game_uid || !matchData?.league_id) {
      console.warn("Missing required matchData properties.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "https://plapi.perfectlineup.in/fantasy/completed_match/get_fixture_fantasy",
        {
          season_game_uid: matchData.season_game_uid,
          league_id: matchData.league_id,
          sports_id: "7",
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
  }, [matchData?.season_game_uid, matchData?.league_id]);

  // Run Fetch on Dependency Change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Loading & Error States
  if (loading) {
    return <div className="text-center text-gray-600">Loading...</div>;
  }
  if (error) {
    return <div className="text-red-500 text-center">Error: {error}</div>;
  }
  if (!data) {
    return <div className="text-center text-gray-600">No data available.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
            {data && data.fixture_details && (
<ProjectedVsActual
        fixture_details={data?.fixture_details}
        fantasy_data={data?.fantasy_data}
      />

      )}
    </div>
  );
};

const MatchCard = ({ matchData, stats_details }) => {

  // Safely parse score data (it’s stored as a JSON string in matchData.score_data)
  const scoreData = JSON.parse(matchData.score_data);
  const {
    away_overs,
    home_overs,
    away_wickets,
    home_wickets,
    away_team_score,
    home_team_score,
  } = scoreData["1"];

const [activeTab, setActiveTab] = useState("SCORECARD");
const toggleList =["OVERVIEW", "SCORECARD", "FANTASY"]
  // You can format the date/time however you prefer. Below is a simplistic approach:
  // matchData.season_scheduled_date = "2025-03-04 18:01:00"
  // For the screenshot, you mentioned "04 March 11:31 pm" but we'll keep it simple here.
  const dateTime = new Date(matchData.season_scheduled_date);
  const options = { day: "numeric", month: "long", hour: "numeric", minute: "2-digit" };
  const formattedDate = dateTime.toLocaleString("en-GB", options);

  return (
    <>
    <div className="w-full max-w-4xl mx-auto bg-gray-100 shadow-lg rounded-lg p-4 my-4 flex flex-col">
    {/* League Title */}
    <h2 className="text-xl font-semibold text-center mb-1">
      {matchData.league_name}
    </h2>

    {/* Date and Venue Info */}
    <div className="text-sm text-gray-500 text-center">
      {formattedDate} | {matchData.ground_name}
    </div>

    {/* Main Scoreboard Section */}
    <div className="flex items-center justify-between mt-4">
      {/* Home Team */}
      <div className="flex flex-col -pr-40">
        {/* If you have actual images, swap the src below with your own */}

        <img
        src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${matchData.home_flag}`}
        alt={`${matchData.home_team_name} flag`}
        className="w-12 h-12 mb-2 sm:h-10 rounded-full"
      />
        <h3 className="font-bold">{matchData.home_team_name}</h3>
        <p className="text-sm text-gray-600">
          {home_team_score}/{home_wickets} ({home_overs} Overs)
        </p>
      </div>

      {/* VS and Result */}
      <div className="flex flex-col items-center">
        <p className="text-gray-400">Vs</p>
        {matchData.result_info && (
          <p className="text-green-600 font-semibold mt-1">
            {matchData.result_info}
          </p>
        )}
      </div>

      {/* Away Team */}
      <div className="flex flex-col items-center">
        <img
        src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${matchData.away_flag}`}
        alt={`${matchData.away} flag`}
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full"
      />
        <h3 className="font-bold">{matchData.away_team_name}</h3>
        <p className="text-sm text-gray-600">
          {away_team_score}/{away_wickets} ({away_overs} Overs)
        </p>
      </div>
    </div>
  </div>

     <div className="w-full max-w-4xl mx-auto bg-gray-100 shadow-lg rounded-lg p-4 my-4 flex flex-col items-center">
        <div className="w-full bg-white rounded shadow p-4 mt-4">
          {/* Heading */}
          {/* Main Tabs */}
          <div className="flex justify-center items-center mb-4">
          {toggleList.map((tab) => (
            <div
              key={tab}
              className={`text-tabItem px-4 py-1 cursor-pointer ${
                activeTab === tab
                  ? "border-b-2 border-[#212341] font-semibold text-[#999]"
                  : "text-gray-600"
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </div>
          ))}
          </div>

          {/* Tab Content */}
          <div className="mt-4">
            {activeTab === "OVERVIEW" && <Overview  matchData={matchData}  />}
            {activeTab === "SCORECARD" && <Scorecard matchData={matchData} stats_details= {stats_details}/>}
            {activeTab === "FANTASY" && <Fantasy matchData={matchData} />}
          </div>

        </div>
      </div>
    
    </>
  );
};

function MatchReport() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const matchInSights = location.state?.matchInSights;
  const matchSessionIDs = location.state?.matchSessionIDs
  const matchleageIDs = location.state?.matchleageIDs

 useEffect(() => {
  // Check if at least one of season_game_uid or es_season_game_uid exists, and league_id is required
  const hasSeasonGameUid = matchInSights?.season_game_uid || matchInSights?.es_season_game_uid;

  if (!hasSeasonGameUid || !matchInSights?.league_id) {
    console.warn(
      "Neither season_game_uid nor es_season_game_uid is defined, or league_id is undefined or null"
    );
    return;
  }

  // Use the available season_game_uid (primary or fallback)
  const gameUid = matchInSights?.season_game_uid || matchInSights?.es_season_game_uid;

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "https://plapi.perfectlineup.in/fantasy/completed_match/get_fixture_scorecard",
        {
          season_game_uid: gameUid, // Use the resolved value
          league_id: matchInSights?.league_id, // Required field
          sports_id: "7",
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
}, [matchInSights?.season_game_uid, matchInSights?.es_season_game_uid, matchInSights?.league_id]);

  // Countdown function (if you need it)
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
    const hours = Math.floor(
      (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  // Handle loading & error states
  if (loading) {
    return <div className="text-center text-gray-600">Loading...</div>;
  }
  if (error) {
    return <div className="text-red-500 text-center">Error: {error}</div>;
  }

  // If there's no match data at all, don't render
  if (!matchInSights) {
    return null;
  }


  return (
    <div className="w-full min-h-screen flex flex-col bg-white overflow-hidden items-start justify-start">
      {/* Navigation Bar */}
      <div className="relative flex items-center p-4 border-b w-full max-w-screen-lg mx-auto mt-4">
      {/* Back Button, absolutely positioned on the left */}
      <Link
        key={matchInSights?.season_game_uid ? matchInSights?.season_game_uid : matchInSights?.es_season_game_uid}
        to={`/stats-playground/Cricket/${matchInSights?.season_game_uid ? matchInSights?.season_game_uid : matchInSights?.es_season_game_uid}/${matchInSights.home}_vs_${matchInSights.away}/${matchInSights.league_id}`}
        state={{ matchInSights: matchInSights }}
        className="absolute left-4 flex items-center p-2 rounded-lg shadow-md bg-white hover:bg-gray-100"
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
    
      {/* Centered title */}
      <span className="mx-auto font-semibold text-lg">Match Report</span>
    </div>

      {/* Render match data, scorecard, etc. here */}
      {/* Example: <pre>{JSON.stringify(data, null, 2)}</pre> */}


      {data && data.fixture_details && (
        <MatchCard
          matchData={data.fixture_details} 
          stats_details={data.stats_details}
        />
      )}
    </div>
  );
}

export default MatchReport;
