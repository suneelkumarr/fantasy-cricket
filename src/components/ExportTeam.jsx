import React, { useState, useEffect, useMemo, useCallback , useRef } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";


const getCountdownTime = (scheduledDate) => {
  const now = new Date();
  const targetDate = new Date(scheduledDate);
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

const FixtureHeader = ({ matchInSights }) => {
  const navigate = useNavigate();

  // Parse toss_data only when it changes
  const tossText = useMemo(() => {
    if (matchInSights.toss_data && matchInSights.toss_data !== "[]") {
      try {
        const parsed = JSON.parse(matchInSights.toss_data);
        return parsed?.text || "";
      } catch (error) {
        console.error("Failed to parse toss_data JSON:", error);
      }
    }
    return "";
  }, [matchInSights.toss_data]);

  // Toggle text every second if conditions are met
  const [showLineup, setShowLineup] = useState(true);
  useEffect(() => {
    if (
      matchInSights.playing_announce === "1" &&
      matchInSights.toss_data !== "[]"
    ) {
      const interval = setInterval(() => setShowLineup((prev) => !prev), 1000);
      return () => clearInterval(interval);
    }
  }, [matchInSights.playing_announce, matchInSights.toss_data]);

  // Countdown state updated every second
  const [countdown, setCountdown] = useState(
    getCountdownTime(matchInSights.season_scheduled_date)
  );
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getCountdownTime(matchInSights.season_scheduled_date));
    }, 1000);
    return () => clearInterval(timer);
  }, [matchInSights.season_scheduled_date]);

  // Determine the bubble text based on conditions
  const bubbleText = useMemo(() => {
    if (matchInSights.playing_announce !== "1")
      return "Playing 11 is not announced";
    if (matchInSights.toss_data === "[]") return "Lineup Out";
    return tossText ? (showLineup ? "Lineup Out" : tossText) : "Lineup Out";
  }, [
    matchInSights.playing_announce,
    matchInSights.toss_data,
    tossText,
    showLineup,
  ]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 bg-white">
      <div className="flex items-center">
        <button onClick={() => navigate("/")} className="mr-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex-1 flex items-center justify-center space-x-2">
          <img
            src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${matchInSights.home_flag}`}
            alt={matchInSights.home}
            className="w-6 h-6 rounded-full"
          />
          <span className="font-semibold text-base sm:text-lg text-gray-800">
            {matchInSights.home} vs {matchInSights.away}
          </span>
          <img
            src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${matchInSights.away_flag}`}
            alt={matchInSights.away}
            className="w-6 h-6 rounded-full"
          />
        </div>
      </div>
      <div className="text-center mt-1 text-red-500 font-semibold text-sm sm:text-base">
        {countdown}
      </div>
      <div className="flex justify-center mt-2">
        <div
          className="bg-white border border-gray-300 text-gray-600 px-3 py-1
                         rounded shadow text-sm text-center transition-all duration-1000 ease-in-out"
        >
          {bubbleText}
        </div>
      </div>
    </div>
  );
};


// Helper function to calculate team details
const getTeamDetails = (team, players, matchInSights) => {
    const teamPlayers = team.players.map((p) =>
      players.find((player) => player.tp_player_uid === p.id.toString())
    );
    const teamCount = {
      GOR: teamPlayers.filter((p) => p.display_team_abbr === matchInSights.home).length,
      GAM: teamPlayers.filter((p) => p.display_team_abbr === matchInSights.away).length,
    };
    const positionCount = {
      WK: teamPlayers.filter((p) => p.position === 'WK').length,
      BAT: teamPlayers.filter((p) => p.position === 'BAT').length,
      AR: teamPlayers.filter((p) => p.position === 'AR').length,
      BOW: teamPlayers.filter((p) => p.position === 'BOW').length,
    };
    const captain = teamPlayers.find((p) =>
      p.tp_player_uid === team.players.find((pl) => pl.player_role === 1)?.id.toString()
    );
    const viceCaptain = teamPlayers.find((p) =>
      p.tp_player_uid === team.players.find((pl) => pl.player_role === 2)?.id.toString()
    );
  
    return { teamCount, positionCount, captain, viceCaptain };
  };
  
  // TeamCard Component
  const TeamCard = ({ team, players, isSelected, onToggle , matchInSights }) => {
    const { teamCount, positionCount, captain, viceCaptain } = getTeamDetails(team, players, matchInSights);
  
    return (
      <div
        className={`field-view-team-container bg-white shadow rounded-lg p-4 transition-all duration-300 ${
          isSelected ? 'border-2 border-blue-500 scale-102' : 'border border-gray-200'
        }`}
      >
        <div className="field-header flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggle}
              className="w-4 h-4 accent-blue-500"
            />
            <span className="font-medium">Replace Team {team.tname}</span>
          </div>
          <div className="text-exported text-sm text-green-600 mt-1 sm:mt-0">
            Exported to Dream11
          </div>
        </div>
  
        <div className="field-center flex flex-col md:flex-row gap-4">
          <div className="left-contain flex gap-2">
            <div className="view-team bg-gray-100 p-2 rounded text-center min-w-[60px]">
              <div className="header font-bold">GOR</div>
              <div className="text-abbr">{teamCount.GOR}</div>
            </div>
            <div className="view-team bg-gray-100 p-2 rounded text-center min-w-[60px]">
              <div className="header font-bold">GAM</div>
              <div className="text-abbr">{teamCount.GAM}</div>
            </div>
          </div>
          <div className="right-contain flex-1 flex flex-col sm:flex-row gap-2">
            {[captain, viceCaptain].map((player, index) => (
              player && (
                <div
                  key={index}
                  className="view-jersy flex items-center gap-2 bg-gray-50 p-2 rounded flex-1"
                >
                  <img
                    src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/${player.jersey}`}
                    alt={player.display_name}
                    className="w-8 h-8 object-cover"
                    onError={(e) => (e.target.src = '/fallback-jersey.png')} // Fallback image
                  />
                  <div className="view-name flex-1 truncate">
                    <span>{player.display_name}</span>
                  </div>
                  <span className="c-style font-bold text-blue-600">
                    {index === 0 ? 'C' : 'V'}
                  </span>
                </div>
              )
            ))}
          </div>
        </div>
  
        <div className="field-footer flex flex-wrap gap-4 mt-2 text-sm text-gray-700">
          <span>WK {positionCount.WK}</span>
          <span>BAT {positionCount.BAT}</span>
          <span>AR {positionCount.AR}</span>
          <span>BOW {positionCount.BOW}</span>
        </div>
      </div>
    );
  };

function ExportTeam() {

        const location = useLocation();
        const params = location.state || {};
        const [data, setData] = useState(null);
        const [error, setError] = useState(null);
        const [loading, setLoading] = useState(false);

        const { players, tp_teams, tp_team_count, pl_exported_teams } = params.matchData;
        const convertedData = params.convertedData;
        const matchInSights = params.matchInSights;
        const [selectedTeams, setSelectedTeams] = useState([]);
        const selectAllRef = useRef(null);
        console.log("+++++++++++++++++++++++++++++++++++++++++++++newdata", convertedData)
        console.log("+++++++++++++++++++++++++++++++++++++++++++++matchInSights", matchInSights)
        console.log("+++++++++++++++++++++++++++++++++++++++++++++tp_teams", tp_teams)
        console.log("+++++++++++++++++++++++++++++++++++++++++++++pl_exported_teams", pl_exported_teams)
        console.log("+++++++++++++++++++++++++++++++++++++++++++++players", players)
        console.log("+++++++++++++++++++++++++++++++++++++++++++++tp_team_count", tp_team_count)

        // Update "Select All" checkbox indeterminate state
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedTeams.length > 0 && selectedTeams.length < tp_teams.length;
    }
  }, [selectedTeams, tp_teams.length]);

  // Handle "Replace All Teams" checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedTeams(tp_teams.map((team) => team.tid));
    } else {
      setSelectedTeams([]);
    }
  };

  // Calculate dynamic counts
  const teamsOnDream11 = Object.keys(pl_exported_teams).length;
  const teamsToBeReplaced = selectedTeams.length;
  const newTeamsToBeAdded = selectedTeams.length; // New teams replace selected ones

  console.log("+++++++++++++++++++++++++++++++++++++++++++++selectedTeams", selectedTeams)

  return (
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-white">
        <FixtureHeader matchInSights={params.matchInSights} />
  
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 ">
          <h2 className="text-xl font-semibold">Export to Dream11*</h2>
          <p className="text-gray-600">Based on your lineup predictions</p>
        </div>


        <div className="replace-team-container max-w-4xl mx-auto p-4">
        {/* Top Section */}
        <div className="box-showing-container bg-white shadow rounded-lg mb-4">
          <div className="top-header-view flex flex-col sm:flex-row justify-between p-4 border-b">
            <div className="text-lineup-genrate font-semibold">
              {tp_team_count} Lineups Generated
            </div>
            <div className="active-view flex items-center gap-2 mt-2 sm:mt-0">
              <div className="oval w-2 h-2 bg-green-500 rounded-full"></div>
              <span>8058841294</span>
            </div>
          </div>
          <div className="detail-team-container flex flex-wrap justify-center gap-4 p-4">
            <div className="detail-box text-center min-w-[100px]">
              <div className="count-team text-2xl font-bold">{teamsOnDream11}</div>
              <div className="count-team-desc text-sm text-gray-600">Teams on Dream11</div>
            </div>
            <div className="vertical-line hidden sm:block w-px h-10 bg-gray-300 mx-4"></div>
            <div className="detail-box text-center min-w-[100px]">
              <div className="count-team text-2xl font-bold">{teamsToBeReplaced}</div>
              <div className="count-team-desc text-sm text-gray-600">Teams to be replaced</div>
            </div>
            <div className="vertical-line hidden sm:block w-px h-10 bg-gray-300 mx-4"></div>
            <div className="detail-box text-center min-w-[100px]">
              <div className="count-team text-2xl font-bold">{newTeamsToBeAdded}</div>
              <div className="count-team-desc text-sm text-gray-600">New teams to be added</div>
            </div>
          </div>
        </div>
  
        {/* Replace All Teams */}
        <div className="replace-all-container flex items-center gap-2 mb-4 p-2 bg-gray-100 rounded transition-colors duration-200 hover:bg-gray-200">
          <input
            type="checkbox"
            ref={selectAllRef}
            checked={selectedTeams.length === tp_teams.length}
            onChange={handleSelectAll}
            className="w-4 h-4 accent-blue-500"
          />
          <span className="font-medium">Replace All Teams</span>
        </div>
  
        {/* Team List */}
        <div className="list-container space-y-4">
          {tp_teams.map((team) => (
            <TeamCard
              key={team.tid}
              team={team}
              players={players}
              isSelected={selectedTeams.includes(team.tid)}
              onToggle={() =>
                setSelectedTeams((prev) =>
                  prev.includes(team.tid)
                    ? prev.filter((id) => id !== team.tid)
                    : [...prev, team.tid]
                )
              }
              matchInSights={params.matchInSights}
            />
          ))}
        </div>
  
        {/* Footer */}
        <div className="footer-btn flex justify-between items-center mt-4 p-4 bg-gray-100 rounded">
          <span>Export to Dream11*</span>
          <div className="arrow-icon-custmised-export flex gap-1 text-blue-500">
            <span>→</span>
            <span>→</span>
            <span>→</span>
          </div>
        </div>
      </div>
      </main>
  )
}

export default ExportTeam
