import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown, ChevronUp } from "lucide-react";

// A small helper for date formatting – so it’s consistent throughout.
function formatDate(dateObj) {
  // Adjust format to whatever you prefer
  return dateObj.toDateString(); // e.g. "Mon Mar 20 2023"
}

// A reusable chart “section” component that shows
// - Title, subTitle
// - A <LineChart> with consistent styling
// - Optional domain for Y-axis, and custom tooltip logic if needed
function ChartSection({
  title,
  subTitle,
  data,
  dataKey,
  yLabel = "",
  domain = ["dataMin - 1", "dataMax + 1"],
  color = "#1f3b64",
  tooltipFormatter,
}) {

  const [showMatchList, setShowMatchList] = useState(false);
  const toggleMatchList = () => {
    setShowMatchList((prev) => !prev);
  };

  // Safely handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="mb-8 max-w-screen-lg mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <p className="text-gray-600 mt-2">{subTitle}</p>
        <div className="text-gray-500 text-center mt-4">
          No data to display.
        </div>
      </div>
    );
  }

  // For an axis label, we might want to show first -> last date range
  const firstDate = data[0].dateObj;
  const lastDate = data[data.length - 1].dateObj;

  // Recharts <Tooltip> allows a custom formatter and labelFormatter
  const customTooltip = {
    formatter: tooltipFormatter || ((value) => [value, dataKey]),
    labelFormatter: (label) => `Date: ${formatDate(label)}`,
  };

  return (
    <div className="mb-16 max-w-screen-lg mx-auto px-4">
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      <p className="text-gray-600 mt-2">{subTitle}</p>

      <div className="h-64 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data.sort((a, b) => a.dataKey - b.dataKey)}
            margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
            <XAxis
              dataKey="dateObj"
              tick={false} // Hide ticks if you only want a single bottom label
              label={{
                value: `${formatDate(firstDate)} to ${formatDate(lastDate)}`,
                position: "insideBottom",
                offset: -10,
              }}
            />
            <YAxis
              domain={domain}
              label={{
                value: yLabel,
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip {...customTooltip} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 5, fill: color }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="border-t border-b py-4 my-4">
        <button
          className="flex items-center justify-between w-full text-left"
          onClick={toggleMatchList}
        >
          <span className="text-gray-500 font-medium">View Match List</span>
          {showMatchList ? (
            <ChevronUp size={20} className="text-blue-500" />
          ) : (
            <ChevronDown size={20} />
          )}
        </button>
      </div>
      
      {showMatchList && data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left border-b">
                <th className="py-4 px-4 font-medium text-gray-700">Date</th>
                <th className="py-4 px-4 font-medium text-gray-700">Title</th>
                <th className="py-4 px-4 font-medium text-gray-700">{title}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((match, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-4 text-gray-700">
                    {formatDate(match.dateObj)}
                  </td>
                  <td className="py-4 px-4 font-medium text-gray-700">
                    {match.title}
                  </td>
                  <td className="py-4 px-4 text-gray-700">{match[dataKey]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showMatchList && data.length === 0 && (
        <div className="text-gray-500 text-center mt-4">
          No matches to display.
        </div>
      )}
    </div>
  );
}


function Graph() {
  const location = useLocation();

  // Store details in state to preserve them on reload
  const [playerDetails] = useState(location.state?.playerInfo || null);
  const [matchDetails] = useState(location.state?.matchID || null);

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Helper to label format
  const formatLabels = {
    1: "Test",
    2: "ODI",
    3: "T20",
    4: "T10",
  };
  const formatLabel = (fmt) => formatLabels[fmt] || fmt || "N/A";

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
            sports_id: 7,
            fav_detail: 1,
            player_uid: playerDetails.player_uid,
            power_rank_detail: 1,
            tab_info: "graph",
            website_id: 1,
            year: new Date().getFullYear(),
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

  const MatchStats = data?.stats_data?.stats || [];
  const matchCount = MatchStats.length;

  // Format the stats data
  const formatData = (rawData) => {
    return rawData
      .map((item) => {
        const dateObj = new Date(item.season_scheduled_date.split(" ")[0]);
        return {
          home: item.home,
          away: item.away,
          title: `${item.home} vs ${item.away}`,
          dateObj,
          salary: Number(item.player_salary),
          position_rank: Number(item.position_rank),
          team_rank: Number(item.team_rank),
          overall_rank: Number(item.overall_rank),
          value: Number(item.value),
          fantasy_points: Number(item.fantasy_points),
        };
      }).sort((a, b) => b.dateObj - a.dateObj);
  };

  const matchData = formatData(MatchStats);

  // We can build an array of chart configs if we want multiple charts
  // In this example, we’ll only show “Salary.” Add more items as needed.
  const chartSections = [
    {
      title: "SALARY",
      subTitle:
        "This graph shows the player's salary movement as used in fantasy games. An increase usually indicates improved performance.",
      dataKey: "salary",
      yLabel: "SALARY", // Y-axis label
      domain: ["dataMin - 1", "dataMax + 1"],
    },
    {
      title: "Fantasy Point",
      subTitle:
        "This graph shows how many fantasy points are received to a player as per his/her performance in the match. Increasing fantasy points means player is performing better.",
      dataKey: "fantasy_points",
      yLabel: "Fantasy Points", // Y-axis label
      domain: ["dataMin - 1", "dataMax + 1"],
    },

    {
      title: "Team Rank",
      subTitle:
        "This graph shows the rank of player in his team according to fantasy points. Increasing rank means player's performance is improving.",
      dataKey: "team_rank",
      yLabel: "Team Rank", // Y-axis label
      domain: ["dataMin - 1", "dataMax + 1"],
    },

    {
      title: "Position Rank",
      subTitle:
        "This graph shows position rank between player spots/position (BAT BOW, AR, WK), like if a team has 4 batsman than out of 4 batsman where the player is lying according to performance in the match.",
      dataKey: "position_rank",
      yLabel: "Position Rank", // Y-axis label
      domain: ["dataMin - 1", "dataMax + 1"],
    },

    {
      title: "Overall Rank",
      subTitle:
        "This Graph shows the player's rank for the fixture (both teams) based on fantasy points scored. For eg. If there are 11 players playing from both teams so out of those total 22 players of that fixture what's the rank of the selected player.",
      dataKey: "overall_rank",
      yLabel: "Overall Rank", // Y-axis label
      domain: ["dataMin - 1", "dataMax + 1"],
    },
    {
      title: "Value",
      subTitle:
        "This graph shows the importance of the player in the match. Greater value means better performing player.",
      dataKey: "value",
      yLabel: "Value", // Y-axis label
      domain: ["dataMin - 1", "dataMax + 1"],
    },
  ];

  return (
    <>
      {loading && (
        <div className="text-center text-gray-600 my-4">Loading...</div>
      )}
      {error && (
        <div className="text-red-500 text-center my-4">Error: {error}</div>
      )}

      <div className="mb-8 mt-4 w-full max-w-4xl px-4 ">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          Last {matchCount} {formatLabel(data?.player_detail?.format ?? "")}{" "}
          Match Performances
        </h2>
      </div>
      <div className="max-w-4xl mx-auto p-4 bg-white rounded-lg mb-10">
      {/* Render each chart section dynamically */}
      {chartSections.map(({ title, subTitle, dataKey, yLabel, domain }, idx) => (
        <div key={idx} className="shadow-md mb-16"> {/* Add margin bottom for spacing */}
          <ChartSection
            title={title}
            subTitle={subTitle}
            data={matchData}
            dataKey={dataKey}
            yLabel={yLabel}
            domain={domain}
          />
        </div>
      ))}
    </div>
    
    </>
  );
}

export default Graph;
