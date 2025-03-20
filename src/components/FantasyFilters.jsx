import React, { useState } from "react";
import { AiOutlineStar } from "react-icons/ai";
import { Link } from "react-router-dom";

// Helper function to replace placeholders like {home}, {away}, etc.
const replacePlaceholders = (str, data) => {
  if (!str) return "";
  return str
    .replace("{home}", data.match_details.home_team_name)
    .replace("{away}", data.match_details.away_team_name)
    .replace("{ground_name}", data.match_details.ground_name)
    .replace("{venue_country}", data.match_details.venue_country)
    .replace("{current_opposition}", "Current Opposition");
};

const FantasyFilters = ({ data, matchInSights }) => {
  const { q1, q2, q3, q4, q5 } = data.filters;
  // If you're using react-router and need navigation, you can keep useHistory,
  // but here we are using state change to switch views.
  // const history = useHistory();

  // State for each dropdown (defaults)
  const [selectedQ1, setSelectedQ1] = useState(q1[0].filter_key); // Use first value from q1
  const [selectedQ2, setSelectedQ2] = useState(q2[0].filter_key); // Use first value from q2
  const [selectedQ3, setSelectedQ3] = useState(q3[0].filter_key); // Use first value from q3
  const [selectedQ4, setSelectedQ4] = useState(q4[0].filter_key); // Use first value from q4
  const [selectedQ5, setSelectedQ5] = useState(q5[0].filter_key); // Use first value from q5

  const [showResults, setShowResults] = useState(false);
  const [players, setPlayers] = useState([]);

  // Sample tabs (top-level)
  const mainTabs = [
    "OVERALL",
    `${data.match_details.home_team_name}`,
    `${data.match_details.away_team_name}`,
  ];
  const [activeMainTab, setActiveMainTab] = useState("OVERALL");

  // Sample tabs (second-level)
  const secondaryTabs = ["ALL", "WK", "BAT", "AR", "BOW"];
  const [activeSecondaryTab, setActiveSecondaryTab] = useState("ALL");

  // Sample icons row data
  const iconsData = [
    {
      label: "Order",
      src: "https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_stats_bat.svg",
    },
    {
      label: "DT",
      src: "https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_star_stats.svg",
    },
    {
      label: "Bat First",
      src: "https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_bat_frst_stats.svg",
    },
    {
      label: "Chase",
      src: "https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_chase_stats.svg",
    },
    {
      label: "Impact",
      src: "https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_impcat_stats.svg",
    },
  ];

  // Summary text with an Edit icon that switches back to the Filters page.
  const summaryText = (
    <div className="flex ">
      <p className="text-sm text-left font-medium text-[#333] font-[Exo2-Regular]">
        Top players based in{" "}
        <span className="font-bold">
          {q1.find((item) => item.filter_key === selectedQ1)?.filter_value}
        </span>{" "}
        from
        <span className="font-bold ml-1">
          {q2.find((item) => item.filter_key === selectedQ2)?.filter_value}
        </span>{" "}
        played at
        <span className="font-bold ml-1">
          {replacePlaceholders(
            q3.find((item) => item.filter_key === selectedQ3)?.filter_value,
            data
          )}
        </span>{" "}
        when
        <span className="font-bold ml-1">
          {replacePlaceholders(
            q4.find((item) => item.filter_key === selectedQ4)?.filter_value,
            data
          )}
        </span>{" "}
        against
        <span className="font-bold ml-1">
          {replacePlaceholders(
            q5.find((item) => item.filter_key === selectedQ5)?.filter_value,
            data
          )}
        </span>
      </p>
      <button
        className="ml-2 text-blue-500 hover:text-blue-700"
        onClick={() => setShowResults(false)} // Go back to filter page
      >
        <img
          src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/edit.svg"
          alt=""
        ></img>
      </button>
    </div>
  );

  const handleSubmit = async () => {
    try {
      const requestBody = {
        sports_id: "7",
        league_id: data.match_details.league_id,
        season_game_uid: data.match_details.season_game_uid,
        filter_q1: selectedQ1,
        filter_q2: selectedQ2,
        filter_q3: selectedQ3,
        filter_q4: selectedQ4,
        filter_q5: selectedQ5,
      };

      const response = await fetch(
        "https://plapi.perfectlineup.in/fantasy/stats/stats_playground_result",
        {
          method: "POST",
          headers: {
            sessionkey: "3cd0fb996816c37121c765f292dd3f78",
            moduleaccess: "7",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) throw new Error("API request failed.");

      const jsonData = await response.json();
      if (!jsonData?.data) throw new Error("No players data returned.");

      setPlayers(jsonData.data);
      setShowResults(true);
    } catch (error) {
      console.error("Error fetching players:", error);
      alert("Failed to fetch data. Please try again later.");
    }
  };

  const filteredPlayers = players.filter((player) => {
    // Team filter
    let teamFilter = true;
    if (activeMainTab === `${data.match_details.home_team_name}`) {
      teamFilter = player.team_abbr === `${data.match_details.home}`;
    } else if (activeMainTab === `${data.match_details.away_team_name}`) {
      teamFilter = player.team_abbr === `${data.match_details.away}`;
    }

    // Role filter
    let roleFilter = true;
    if (activeSecondaryTab !== "ALL") {
      roleFilter = player.player_position === activeSecondaryTab;
    }

    return teamFilter && roleFilter;
  });

  const [isActive, setIsActive] = useState(false);

  const handleClickStar = () => {
    setIsActive(!isActive);
  };

  // For dynamic bar calculation
  const maxAvgPoints = Math.max(...players.map((p) => p.ttl_fpts), 1);

  const [expandedPlayer, setExpandedPlayer] = useState(null);
  // Toggle player expansion
  const togglePlayerExpansion = (playerId) => {
    if (expandedPlayer === playerId) {
      setExpandedPlayer(null);
    } else {
      setExpandedPlayer(playerId);
    }
  };

  console.log("+++++++++++++++filteredPlayers", filteredPlayers);

  function formatDate(inputDate) {
    const date = new Date(inputDate);

    const options = { day: "2-digit", month: "short", year: "2-digit" };
    return date.toLocaleDateString("en-GB", options).replace(",", "");
  }

  const renderTopPlayersPage = () => {
    return (
      <div className="w-full max-w-4xl mx-auto bg-gray-100 shadow-lg rounded-lg p-4 my-4 flex flex-col items-center">
        {/* Summary Row */}
        <div className="flex items-center p-4 border-b bg-[#28282829] w-full justify-center text-center">
          {summaryText}
        </div>

        <div className="w-full bg-white rounded shadow p-4 mt-4">
          {/* Heading */}
          <h2 className="text-base font-bold mb-4 uppercase text-center">
            TOP PLAYERS
          </h2>

          {/* Main Tabs */}
          <div className="flex justify-center items-center mb-4">
            {mainTabs.map((tab) => (
              <div
                key={tab}
                className={`text-tabItem px-4 py-1 cursor-pointer ${
                  activeMainTab === tab
                    ? "border-b-2 border-blue-500 font-semibold text-blue-600"
                    : "text-gray-600"
                }`}
                onClick={() => setActiveMainTab(tab)}
              >
                {tab}
              </div>
            ))}
          </div>

          {/* Secondary Tabs */}
          <div className="flex justify-center items-center mb-4">
            {secondaryTabs.map((tab) => (
              <div
                key={tab}
                className={`text-tabItem px-3 py-1 cursor-pointer ${
                  activeSecondaryTab === tab
                    ? "border-b-2 border-blue-500 font-semibold text-blue-600"
                    : "text-gray-600"
                }`}
                onClick={() => setActiveSecondaryTab(tab)}
              >
                {tab}
              </div>
            ))}
          </div>

          {/* Icons Row */}
          <div className="flex justify-center items-center space-x-4 mb-4">
            {iconsData.map((iconItem) => (
              <div key={iconItem.label} className="flex items-center space-x-2">
                <img
                  src={iconItem.src}
                  alt={iconItem.label}
                  className="w-4 h-4 object-contain"
                />
                <span className="text-xs text-gray-600">{iconItem.label}</span>
              </div>
            ))}
          </div>

          {/* Players List */}
          <div className="space-y-3 w-full">
            {filteredPlayers.map((player, idx) => {
              const barWidth = (player.ttl_fpts / maxAvgPoints) * 100;
              const countMatch = player.filtered_match.length;
              const isExpanded = expandedPlayer === player.player_uid;

              return (
                <div
                  key={idx}
                  className="bg-gray-50 rounded overflow-hidden w-full justify-between shadow-md hover:bg-gray-100"
                >
                  {/* Player main row */}
                  <div className="p-3 flex flex-wrap items-center justify-between w-full border-b border-gray-200">
                    {/* Player Info */}
                    <Link
                      key={player.player_uid}
                      to={`/player/${player?.player_uid || "unknown"}/${
                        player?.display_name
                          ? player.display_name.replace(/\s+/g, "_")
                          : player?.full_name?.replace(/\s+/g, "_") || "unknown"
                      }/${
                        data?.match_details?.season_game_uid || "unknown"
                      }/form`}
                      state={{
                        playerInfo: player,
                        matchID: data.match_details.season_game_uid,
                        matchInSights: matchInSights,
                      }}
                      className="flex items-center w-full sm:w-1/3"
                    >
                      <div>
                        <div className="font-medium text-lg">
                          {player.display_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {player.player_position} • {player.team_abbr}
                        </div>
                      </div>
                    </Link>

                    {/* Progress Bar & Points */}
                    <div className="flex-1 px-4">
                      <div className="bg-gray-200 h-6 rounded-lg overflow-hidden w-full">
                        <div
                          className="bg-[#f4764c] opacity-50 h-full transition-all"
                          style={{ width: `${barWidth}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {player.ttl_fpts} pts ({countMatch})
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 items-center">
                      <button
                        className="text-gray-500 hover:text-gray-700"
                        onClick={handleClickStar}
                      >
                        <img
                          alt="Star"
                          src={
                            isActive
                              ? "https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_star_stats.svg"
                              : "https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/ic_prefer_inactive.svg"
                          }
                          className="w-5 h-5"
                        />
                      </button>
                      <button className="text-gray-500 hover:text-gray-700">
                        🔒
                      </button>
                      <button
                        className="text-gray-500 hover:text-gray-700"
                        onClick={() => togglePlayerExpansion(player.player_uid)}
                      >
                        {isExpanded ? "▲" : "▼"}
                      </button>
                    </div>
                  </div>

                  {/* Expanded match history */}
                  {isExpanded && player.filtered_match.length > 0 && (
                    <div className="border-t pt-2 px-3 pb-3 bg-white">
                      <div className="flex justify-around text-xs text-gray-500 mb-2">
                        <div>Team</div>
                        <div>FPts</div>
                      </div>
                      {player.filtered_match.map((match, idx) => (
                        <Link
                          key={idx}
                          to={`/match-report/Cricket/${match.season_game_uid}/${match.home}_vs_${match.away}/${match.league_id}/scorecard`}
                          state={{
                            matchInSights: matchInSights,
                            matchSessionIDs: match.season_game_uid,
                            matchleageIDs: match.league_id,
                          }}
                          className="block"
                        >
                          <div
                            key={idx}
                            className="flex flex-wrap items-center justify-between text-sm py-1 border-b border-gray-200 px-3"
                          >
                            {/* Match Details */}
                            <div className="flex items-center space-x-2">
                              <span>
                                VS{" "}
                                {match.home === player.team_abbr
                                  ? match.away
                                  : match.home}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({formatDate(match.season_scheduled_date)})
                              </span>

                              {/* Conditional Icons Rendering */}
                              {match.bat_first_team_uid === player.team_uid &&
                                match.dt_appearances === "1" && (
                                  <>
                                    <img
                                      src={iconsData[1].src}
                                      alt={iconsData[1].label}
                                      className="w-4 h-4 object-contain"
                                    />
                                    <img
                                      src={iconsData[2].src}
                                      alt={iconsData[2].label}
                                      className="w-4 h-4 object-contain"
                                    />
                                  </>
                                )}

                              {match.bat_first_team_uid !== player.team_uid &&
                                match.dt_appearances === "1" && (
                                  <>
                                    <img
                                      src={iconsData[1].src}
                                      alt={iconsData[1].label}
                                      className="w-4 h-4 object-contain"
                                    />
                                    <img
                                      src={iconsData[3].src}
                                      alt={iconsData[3].label}
                                      className="w-4 h-4 object-contain"
                                    />
                                  </>
                                )}

                              {match.bat_first_team_uid === player.team_uid &&
                                match.dt_appearances !== "1" && (
                                  <img
                                    src={iconsData[2].src}
                                    alt={iconsData[2].label}
                                    className="w-4 h-4 object-contain"
                                  />
                                )}

                              {match.bat_first_team_uid !== player.team_uid &&
                                match.dt_appearances !== "1" && (
                                  <img
                                    src={iconsData[3].src}
                                    alt={iconsData[3].label}
                                    className="w-4 h-4 object-contain"
                                  />
                                )}
                            </div>

                            {/* Fantasy Points */}
                            <div className="text-gray-700 font-medium">
                              {match.fantasy_points}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderFiltersPage = () => {
    return (
      <div className="w-full flex flex-col bg-gray-50 ">
        <div className="flex-1 px-4 py-8 max-w-md mx-auto">
          <h1 className="text-center text-lg font-semibold mb-6">
            Find the best players by customizing data views for your fantasy
            research
          </h1>

          <div className="mb-6">
            <label className="block mb-1 font-medium text-gray-700">
              View top players based on
            </label>
            <select
              className="block w-full appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedQ1}
              onChange={(e) => setSelectedQ1(e.target.value)}
            >
              {q1.map((item) => (
                <option key={item.filter_key} value={item.filter_key}>
                  {item.filter_value}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block mb-1 font-medium text-gray-700">From</label>
            <select
              className="block w-full appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedQ2}
              onChange={(e) => setSelectedQ2(e.target.value)}
            >
              {q2.map((item) => (
                <option key={item.filter_key} value={item.filter_key}>
                  {item.filter_value}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block mb-1 font-medium text-gray-700">
              Played at
            </label>
            <select
              className="block w-full appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedQ3}
              onChange={(e) => setSelectedQ3(e.target.value)}
            >
              {q3.map((item) => (
                <option key={item.filter_key} value={item.filter_key}>
                  {replacePlaceholders(item.filter_value, data)}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block mb-1 font-medium text-gray-700">When</label>
            <select
              className="block w-full appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedQ4}
              onChange={(e) => setSelectedQ4(e.target.value)}
            >
              {q4.map((item) => (
                <option key={item.filter_key} value={item.filter_key}>
                  {replacePlaceholders(item.filter_value, data)}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block mb-1 font-medium text-gray-700">
              Against
            </label>
            <select
              className="block w-full appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedQ5}
              onChange={(e) => setSelectedQ5(e.target.value)}
            >
              {q5.map((item) => (
                <option key={item.filter_key} value={item.filter_key}>
                  {replacePlaceholders(item.filter_value, data)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white p-4">
          <button
            onClick={handleSubmit}
            className="w-full bg-gray-900 text-white text-center uppercase py-3 text-sm font-semibold tracking-wider"
          >
            Submit
          </button>
        </div>
      </div>
    );
  };

  return <>{showResults ? renderTopPlayersPage() : renderFiltersPage()}</>;
};

export default FantasyFilters;
