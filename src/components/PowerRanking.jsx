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
import Getlocation from './Getlocation.jsx';

// Reusable chart component:
function MetricChart({
  data,
  title,
  subTitle,
  dataKey,
  customTooltip,
  yDomain = [0, "auto"],
  reversedY = false,
  yLabel, // optional label for the Y-axis
}) {
  return (
    <div className="mb-8">
      {title && (
        <h3 className="text-base font-bold text-gray-800 mb-1">{title}</h3>
      )}
      {subTitle && <p className="text-sm text-gray-600 mb-4">{subTitle}</p>}

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="dateLabel" tickMargin={10} />
            <YAxis
              domain={yDomain}
              reversed={reversedY}
              label={
                yLabel
                  ? {
                      value: yLabel,
                      angle: -90,
                      position: "insideLeft",
                      style: {
                        textAnchor: "middle",
                        fontSize: "12px",
                        fill: "#666",
                      },
                    }
                  : undefined
              }
            />
            {customTooltip && <Tooltip content={customTooltip} />}
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="#2B3467"
              strokeWidth={3}
              dot={{
                stroke: "#2B3467",
                strokeWidth: 2,
                r: 4,
                fill: "#2B3467",
              }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PowerRanking() {
  const location = useLocation();
  console.log(Getlocation())
  // Store details in state to preserve them on reload
  const [playerDetails] = useState(location.state?.playerInfo || null);
  const [matchDetails] = useState(location.state?.matchID || null);

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Month names used for date formatting
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

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
            fav_detail: 1,
            player_uid: playerDetails.player_uid,
            power_rank_detail: 1,
            tab_info: "power_ranking",
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

  // --- Data arrays from API ---
  const rankingData = data?.stats_data?.power_rank_over_time || [];
  const recentMatchData = data?.stats_data?.recent_match_overview || [];

  // --- FORMATTERS ---

  // 1) For "Power Ranking Over Time" (its own unique chart)
  function formatPowerRankData(rawData) {
    return rawData.map((item) => {
      const dateObj = new Date(item.season_scheduled_date);
      const day = String(dateObj.getDate()).padStart(2, "0");
      const monthAbbr = monthNames[dateObj.getMonth()];

      return {
        home: item.home,
        away: item.away,
        // e.g. "16/03"
        dateLabel: `${day}/${(dateObj.getMonth() + 1).toString().padStart(2, "0")}`,
        power_rank: Number(item.power_rank),
        fullDateLabel: `${monthAbbr} ${day}`, // for tooltip
      };
    });
  }

  // 2) For "recent match overview" charts (player_contribution, etc.)
  function formatOverviewData(rawData) {
    return rawData
      .map((item) => {
        const dateObj = new Date(item.season_scheduled_date);
        const day = String(dateObj.getDate()).padStart(2, "0");
        const monthNum = dateObj.getMonth() + 1;
        const monthAbr = monthNames[dateObj.getMonth()];

        return {
          home: item.home,
          away: item.away,
          dateObj,
          dateLabel: `${day}/${String(monthNum).padStart(2, "0")}`,
          dateForTooltip: `${monthAbr} ${day}`,
          player_contribution: +item.player_contribution,
          recent_form: +item.normalised_recent_form,
          dream_team: +item.dream_team,
          overall_rank: +item.overall_rank,
          value: +item.value,
        };
      })
      .sort((a, b) => a.dateObj - b.dateObj);
  }

  const powerRankData = formatPowerRankData(rankingData);
  const overviewData = formatOverviewData(recentMatchData);

  // --- TOOLTIP COMPONENTS ---
  const PowerRankTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const { home, away, power_rank, fullDateLabel } = payload[0].payload;
      return (
        <div className="p-2 bg-white border shadow text-xs rounded">
          <p>{`${home} vs ${away} on ${fullDateLabel}`}</p>
          <p>Player Power Ranking: {power_rank}</p>
        </div>
      );
    }
    return null;
  };

  const ContributionTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const { home, away, dateForTooltip, player_contribution } = payload[0].payload;
      return (
        <div className="bg-white border border-gray-300 rounded p-2 text-xs shadow-md">
          <p>{`${home} vs ${away} on ${dateForTooltip}`}</p>
          <p>Player Contribution: {player_contribution}</p>
        </div>
      );
    }
    return null;
  };

  const RecentFormTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const { home, away, dateForTooltip, recent_form } = payload[0].payload;
      return (
        <div className="bg-white border border-gray-300 rounded p-2 text-xs shadow-md">
          <p>{`${home} vs ${away} on ${dateForTooltip}`}</p>
          <p>Recent Form: {recent_form}</p>
        </div>
      );
    }
    return null;
  };

  const OverallRankTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const { home, away, dateForTooltip, overall_rank } = payload[0].payload;
      return (
        <div className="bg-white border border-gray-300 rounded p-2 text-xs shadow-md">
          <p>{`${home} vs ${away} on ${dateForTooltip}`}</p>
          <p>Overall Rank: {overall_rank}</p>
        </div>
      );
    }
    return null;
  };

  const ValueTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const { home, away, dateForTooltip, value } = payload[0].payload;
      return (
        <div className="bg-white border border-gray-300 rounded p-2 text-xs shadow-md">
          <p>{`${home} vs ${away} on ${dateForTooltip}`}</p>
          <p>Value: {value}</p>
        </div>
      );
    }
    return null;
  };

  const DreamTeamAppearancesTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      const { home, away, dateForTooltip, dream_team } = payload[0].payload;
      return (
        <div className="bg-white border border-gray-300 rounded p-2 text-xs shadow-md">
          <p>{`${home} vs ${away} on ${dateForTooltip}`}</p>
          <p>Dream Team Appearances: {dream_team}</p>
        </div>
      );
    }
    return null;
  };

  // --- DEFINE A LIST OF CHART CONFIGS FOR DYNAMIC RENDER ---
  const chartConfigs = [
    {
      title: "Player Contribution",
      subTitle:
        "Relative contribution to the team's overall fantasy points tally in the last 5 matches.",
      dataKey: "player_contribution",
      customTooltip: <ContributionTooltip />,
      yDomain: [0, "auto"],
    },
    {
      title: "Recent Form",
      subTitle: "Percentile for fantasy points earned in the last 5 matches.",
      dataKey: "recent_form",
      customTooltip: <RecentFormTooltip />,
      yDomain: [0, "auto"],
    },
    {
      title: "Overall Rank",
      subTitle: "Overall rank in the last 5 matches.",
      dataKey: "overall_rank",
      customTooltip: <OverallRankTooltip />,
      yDomain: [0, "auto"],
    },
    {
      title: "Value",
      subTitle: "Relative value delivered in the last 5 matches.",
      dataKey: "value",
      customTooltip: <ValueTooltip />,
      yDomain: [0, "auto"],
    },
    {
      title: "Dream Team Appearances",
      subTitle:
        "Number of times the player made the Dream Team in the last 5 matches.",
      dataKey: "dream_team",
      customTooltip: <DreamTeamAppearancesTooltip />,
      yDomain: [0, "auto"],
    },
  ];

  return (
    <>
      {loading && <div className="text-center text-gray-600 my-4">Loading...</div>}
      {error && <div className="text-red-500 text-center my-4">Error: {error}</div>}

      <div className="w-full min-h-screen flex flex-col overflow-hidden items-center justify-start">
        {/* Rank & Rating Box */}
        <div className="flex items-center justify-center bg-yellow-50 border border-yellow-200 rounded-md p-4 w-[300px] mt-2">
          {/* Rank */}
          <div className="flex-1 flex flex-col items-center">
            <div className="flex items-center">
              <span className="text-orange-500 text-xl mr-1">⚡</span>
              <span className="text-3xl font-bold text-gray-800">
                {data?.player_power_rank?.power_rank || "N/A"}
              </span>
            </div>
            <p className="text-sm text-gray-600">Rank</p>
          </div>

          <div className="border-l border-yellow-300 h-12"></div>

          {/* Rating */}
          <div className="flex-1 flex flex-col items-center">
            <span className="text-3xl font-bold text-gray-800">
              {data?.player_power_rank?.power_rate || "N/A"}
            </span>
            <p className="text-sm text-gray-600">Rating</p>
          </div>
        </div>

        {/* Power Ranking Over Time */}
        <div className="mb-8 mt-4 w-full max-w-4xl px-4">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Power Ranking Over Time
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            This graph shows the changes in power ranking of the player over the
            last 6 months.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={powerRankData}
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="dateLabel" tickMargin={10} />
                <YAxis
                  domain={[40, 0]}
                  reversed={true}
                  ticks={[40, 30, 20, 10, 0]}
                  label={{
                    value: "PLAYER POWER RANKING",
                    angle: -90,
                    position: "insideLeft",
                    style: {
                      textAnchor: "middle",
                      fontSize: "12px",
                      fill: "#666",
                    },
                  }}
                />
                <Tooltip content={<PowerRankTooltip />} />
                <Line
                  type="monotone"
                  dataKey="power_rank"
                  stroke="#2B3467"
                  strokeWidth={2}
                  dot={{
                    stroke: "#2B3467",
                    strokeWidth: 2,
                    r: 4,
                    fill: "#2B3467",
                  }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* OVERVIEW CHARTS (dynamically rendered) */}
        <div className="space-y-6 w-full max-w-4xl px-4 pb-10">
          {/* Overview heading */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Overview</h2>
            <p className="text-sm text-gray-600">
              Movement of key metrics used to calculate power ranking over time
            </p>
          </div>
          <hr className="border-gray-200" />

          {/* Map through each chart config to render MetricChart */}
          {chartConfigs.map((cfg) => (
            <React.Fragment key={cfg.dataKey}>
              <MetricChart
                data={overviewData}
                title={cfg.title}
                subTitle={cfg.subTitle}
                dataKey={cfg.dataKey}
                customTooltip={cfg.customTooltip}
                yDomain={cfg.yDomain}
                reversedY={false} // all normal for overview
              />
              <hr className="border-gray-200" />
            </React.Fragment>
          ))}
        </div>
      </div>
    </>
  );
}

export default PowerRanking;
