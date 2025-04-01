import React, { useState, useEffect, useMemo, useCallback } from "react";
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

const calculatePlayerStats = (players, lineups) => {
  const totalLineups = lineups.length;
  const playerMap = players.reduce((map, player) => {
    map[player.player_uid] = {
      ...player,
      selected_count: 0,
      c_count: 0,
      vc_count: 0,
    };
    return map;
  }, {});

  lineups.forEach((lineup) => {
    lineup.players.forEach((uid) => {
      if (playerMap[uid]) playerMap[uid].selected_count += 1;
    });
    if (playerMap[lineup.C]) playerMap[lineup.C].c_count += 1;
    if (playerMap[lineup.VC]) playerMap[lineup.VC].vc_count += 1;
  });

  return Object.values(playerMap)
    .map((player) => ({
      ...player,
      selection_percentage: (player.selected_count / totalLineups) * 100,
    }))
    .sort((a, b) => b.selection_percentage - a.selection_percentage);
};

const TeamDetailChart = ({ players }) => {
  // Calculate counts for each position
  const positionCounts = players.reduce((acc, player) => {
    acc[player.position] = (acc[player.position] || 0) + 1;
    return acc;
  }, {});

  const positions = ["WK", "BAT", "AR", "BOW"];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-around p-4 bg-gray-100 rounded-lg mb-4 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 ">
      {positions.map((pos, index) => (
        <React.Fragment key={pos}>
          <div className="text-center mb-2 sm:mb-0">
            <div className="text-lg font-bold text-gray-800">{pos}</div>
            <div className="text-sm text-gray-600">
              {positionCounts[pos] || 0}
            </div>
          </div>
          {index < positions.length - 1 && (
            <div className="h-8 w-px bg-gray-300 sm:mx-2"></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const ManagePlayerSelection = ({ players, lineups }) => {
  const [showAll, setShowAll] = useState(false);
  const playerStats = calculatePlayerStats(players, lineups);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 ">
      {/* Title Section */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-blue-900">
            Manage Player Selection
          </h2>
          <p className="text-sm text-gray-500">
            Control appearance of players in your lineups
          </p>
        </div>
        <button className="text-red-500 uppercase font-semibold">MANAGE</button>
      </div>

      {/* Table Header */}
      <div className="flex mb-2 text-gray-700 font-semibold">
        <div className="flex-1">Player</div>
        <div className="w-16 text-center">C</div>
        <div className="w-16 text-center">VC</div>
      </div>

      {/* Player List */}
      <div
        className={`${
          showAll ? "h-auto" : "h-[230px] overflow-hidden"
        } transition-all`}
      >
        {playerStats
          .slice(0, showAll ? playerStats.length : 5)
          .map((player, index) => (
            <div
              key={player.player_uid}
              className={`flex mb-4 p-2 ${
                index % 2 === 0 ? "bg-red-50" : "bg-blue-50"
              }`}
            >
              <div className="flex-1">
                <div className="text-gray-700">
                  {player.nick_name} •{" "}
                  <span className="text-gray-500 text-sm">
                    {player.position}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="relative h-2 bg-gray-200 rounded-full flex-1">
                    <div
                      className={`absolute h-2 rounded-full ${
                        player.selection_percentage === 100
                          ? "bg-gradient-to-r from-orange-400 to-orange-600"
                          : "bg-gradient-to-r from-blue-400 to-blue-600"
                      }`}
                      style={{ width: `${player.selection_percentage}%` }}
                    ></div>
                  </div>
                  <div className="ml-2 text-sm text-gray-600">
                    {player.selection_percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="w-16 text-center text-gray-700">
                {player.c_count > 0 ? player.c_count : "—"}
              </div>
              <div className="w-16 text-center text-gray-700">
                {player.vc_count > 0 ? player.vc_count : "—"}
              </div>
            </div>
          ))}
      </div>

      {/* Footer */}
      <div className="text-center mt-2">
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-blue-500 hover:underline uppercase flex items-center justify-center mx-auto"
        >
          {showAll ? "Show Less" : "Show More"}
          <svg
            className={`w-4 h-4 inline ml-1 ${
              showAll ? "transform rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {showAll && (
          <button className="mt-2 text-blue-500 hover:underline uppercase">
            Manage exposure
          </button>
        )}
      </div>
    </div>
  );
};

const Tabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 bg-white">
      {["Field View", "List View"].map((tab) => (
        <button
          key={tab}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${
            activeTab === tab
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};



const ChangeAccountPopup = ({ isOpen, onClose, platform , convertedData}) => {
  const [phoneNumber, setPhoneNumber] = useState("8058848294"); // Default value
  const [otp, setOtp] = useState(""); // OTP input
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState(null); // Error state
  const [otpSent, setOtpSent] = useState(false); // Track if OTP was sent
  const [timer, setTimer] = useState(60); // 60-second timer for resend
  const [login, setLogin] = useState(null);

  // Website ID mapping
  const websiteIdMap = {
    Dream11: "1",
    My11Circle: "3",
    Vision11: "4",
    MyFab11: "5",
  };
  const websiteId = websiteIdMap[platform] || "1";

  // Timer logic
  useEffect(() => {
    let interval;
    if (otpSent && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval); // Cleanup on unmount or timer reset
  }, [otpSent, timer]);

  // Request OTP
  const handleGetOTP = async () => {
    const payload = {
      website_id: websiteId,
      mobile: phoneNumber,
    };

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        "https://plapi.perfectlineup.in/fantasy/api/login",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            sessionkey: "3cd0fb996816c37121c765f292dd3f78",
            moduleaccess: "7",
          }
        }
      );

      if (parseInt(response.data.response_code) === 200) {
        setLogin(response.data.data)
        console.log("OTP requested successfully:", response.data.data);
        setOtpSent(true); // Show OTP input
        setTimer(60); // Reset timer
        alert("OTP sent successfully!");
      } else {
        throw new Error(response.data.message || "Failed to request OTP");
      }
    } catch (err) {
      console.error("Error requesting OTP:", err);
      setError(err.message || "An error occurred while requesting OTP");
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    const payload = {
      website_id: websiteId,
      otp: otp,
      mobile: login?.mobile,
      device_id: login.device_id,
    };

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        "https://plapi.perfectlineup.in/fantasy/api/verify_otp",
        payload,
        {
                    headers: {
              "Content-Type": "application/json",
              sessionkey: "3cd0fb996816c37121c765f292dd3f78",
              moduleaccess: "7",
            },
        }
      );

      if (response.data.response_code === 200) {
        console.log("OTP verified successfully:", response.data);
        alert("Login successful!");
        onClose(); // Close popup on success
        // Optionally update account data in TeamList via a callback
      } else {
        throw new Error(response.data.message || "Failed to verify OTP");
      }
    } catch (err) {
      console.error("Error verifying OTP:", err);
      setError(err.message || "An error occurred while verifying OTP");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = () => {
    if (timer === 0) {
      setOtp(""); // Clear previous OTP
      handleGetOTP(); // Request OTP again
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-black">
                {platform} Login OTP
              </span>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <img
                  src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/cross.png"
                  alt="Close"
                  className="w-5 h-5"
                />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-6">
              {!otpSent ? (
                <>
                  <div className="text-center text-gray-700">
                    Kindly enter your mobile number used for {platform} account.
                  </div>
                  <div className="flex items-center border border-gray-300 rounded p-2">
                    <span className="text-gray-500 mr-2">+91</span>
                    <input
                      type="text"
                      maxLength="10"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                      className="flex-1 bg-transparent outline-none text-black"
                      placeholder="Enter mobile number"
                      disabled={loading}
                    />
                  </div>
                  <button
                    onClick={handleGetOTP}
                    className={`w-full py-2 rounded text-white ${
                      loading || phoneNumber.length !== 10
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                    disabled={loading || phoneNumber.length !== 10}
                  >
                    {loading ? "Requesting OTP..." : "Get OTP"}
                  </button>
                </>
              ) : (
                <>
                  <div className="text-center text-gray-700">
                    Kindly enter the received {platform} login OTP
                  </div>
                  <div className="flex items-center border border-gray-300 rounded p-2">
                    <input
                      type="text"
                      maxLength="6"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="flex-1 bg-transparent outline-none text-black"
                      placeholder="Enter OTP"
                      disabled={loading}
                    />
                  </div>
                  <div className="text-center text-gray-600">
                    <span className="timer-resend">
                      <small>RESEND IN </small>
                      {Math.floor(timer / 60)}:
                      {String(timer % 60).padStart(2, "0")}
                    </span>
                    {timer === 0 && (
                      <button
                        onClick={handleResendOTP}
                        className="text-blue-500 ml-2 hover:underline"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleVerifyOTP}
                    className={`w-full py-2 rounded text-white ${
                      loading || otp.length !== 6
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? "Verifying..." : "Login"}
                  </button>
                </>
              )}

              {/* Error Message */}
              {error && (
                <div className="text-red-500 text-center">{error}</div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// AccountPopup Component
const AccountPopup = ({
  isOpen,
  onClose,
  platform,
  phoneNumber,
  onChangeAccount,
  convertedData,
  matchInSights
}) => {

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

    useEffect(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          const response = await axios.post(
            "https://plapi.perfectlineup.in/fantasy/api/tp_myteam_list",
            {
    "website_id": "1",
    "season_game_uid": matchInSights.season_game_uid,
    "league_id": matchInSights.league_id,
}
            ,
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
          setError(err.message || "Error fetching data.");
        } finally {
          setLoading(false);
        }
      };
  
      fetchData();
    }, [matchInSights]);


    if (loading) return <div className="text-center py-4">Loading...</div>;
    if (error) return <div className="text-center text-red-500 py-4">{error}</div>;
    if (!data) return <div className="text-center py-4">No data available.</div>;

  const handleExport = async () => {
    try {
      const apiClient = axios.create({
        baseURL: 'https://plapi.perfectlineup.in/fantasy/api',
        headers: {
          'Content-Type': 'application/json',
          'sessionkey': '3cd0fb996816c37121c765f292dd3f78',
          'moduleaccess': '7',
        },
      });

      // First API Call: Save teams
      const teamPromises = convertedData.map((teamData) =>
        apiClient.post('/save_team', {
          website_id: teamData.website_id.toString(),
          season_game_uid: teamData.season_game_uid,
          league_id: teamData.league_id,
          player_ids: teamData.player_ids,
          c_id: teamData.c_id,
          vc_id: teamData.vc_id,
        })
      );

      const savedTeamsResponses = await Promise.all(teamPromises);
      console.log('Teams saved successfully:', savedTeamsResponses);

      onClose();
    } catch (error) {
      console.error('Error during export:', error);
      // Additional UI error handling could be placed here
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-black text-center flex-1">
                Export to {platform}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
                aria-label="Close popup"
              >
                ×
              </button>
            </div>

            <div className="mb-4 text-center text-gray-700">
              {convertedData.length} team
              {convertedData.length !== 1 ? 's' : ''} will be exported to {platform} for
              the account below
              <div className="mt-4 flex items-center border border-gray-300 rounded p-2">
                <span className="text-gray-500 mr-2">+91</span>
                <input
                  disabled
                  type="text"
                  value={phoneNumber}
                  className="flex-1 bg-transparent outline-none"
                />
                <div className="flex items-center ml-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                  <span>Active</span>
                </div>
              </div>
            </div>

            {data.players.length > 0 ? (
              <Link
                to="/export-team"
                state={{
                  matchInSights,
                  convertedData,
                  matchData:data
                }}
                className="w-full"
              >
                <button className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Okay
                </button>
              </Link>
            ) : (
              <button
                onClick={handleExport}
                className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Okay
              </button>
            )}
            

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                To use a different {platform} account,{' '}
                <span
                  className="text-blue-500 font-semibold cursor-pointer"
                  onClick={onChangeAccount}
                >
                  click here
                </span>
                .
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ExportPopup Component (unchanged)
const ExportPopup = ({ isOpen, onClose, onExport , convertedData }) => {
    const [selectedPlatform, setSelectedPlatform] = useState("");
    const platforms = ["Dream11", "My11Circle", "Vision11", "MyFab11"];
  
    const handleExportClick = () => {
      if (selectedPlatform) {
        onExport(selectedPlatform);
        onClose(); // Close this popup after triggering the export
      }
    };
  
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={onClose} // Close on outside click
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
              {/* Title and Close Button */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-black text-center flex-1">
                  Select Platform to Export
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                  aria-label="Close popup"
                >
                  ×
                </button>
              </div>
  
              {/* Platform Options */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {platforms.map((platform) => (
                  <label key={platform} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="platform"
                      value={platform}
                      checked={selectedPlatform === platform}
                      onChange={() => setSelectedPlatform(platform)}
                      className="form-radio text-blue-500"
                    />
                    <span className="text-black">{platform}</span>
                  </label>
                ))}
              </div>
  
              {/* Export Button */}
              <button
                onClick={handleExportClick}
                disabled={!selectedPlatform}
                className={`w-full py-2 rounded transition-colors duration-300 ${
                  selectedPlatform
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-400 text-gray-700 cursor-not-allowed"
                }`}
              >
                EXPORT
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

const TeamList = React.memo(({ teams, activeTab , matchInSights}) => {
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isAccountPopupOpen, setIsAccountPopupOpen] = useState(false);
  const [accountData, setAccountData] = useState(null);
  const [isChangeAccountPopupOpen, setIsChangeAccountPopupOpen] = useState(false);
  const [loginData, setLoginData] = useState(null);

  // Check if a team is selected by its ID
  const isSelected = (teamId) => {
    return selectedTeams.some((team) => team.id === teamId);
  };

  // Toggle team selection (add/remove full team object)
  const toggleTeamSelection = (teamId) => {
    const teamToToggle = teams.find((team) => team.id === teamId);
    if (isSelected(teamId)) {
      setSelectedTeams(selectedTeams.filter((team) => team.id !== teamId));
    } else {
      setSelectedTeams([...selectedTeams, teamToToggle]);
    }
  };

  // Check if all teams are selected
  const areAllSelected = teams.length > 0 && selectedTeams.length === teams.length;

  // Handle "Select All" checkbox
  const handleSelectAll = () => {
    if (areAllSelected) {
      setSelectedTeams([]);
    } else {
      setSelectedTeams([...teams]); // Add all team objects
    }
  };

  const handleChangeAccount = () => {
    setIsChangeAccountPopupOpen(true);
  };


  const convertedData = selectedTeams && selectedTeams.length > 0 &&  selectedTeams?.map((team) => {
  const captain = team.players.find((p) => p.isCaptain);
  const viceCaptain = team.players.find((p) => p.isViceCaptain);

  return {
    website_id: 1,
    season_game_uid: matchInSights.season_game_uid, // you can dynamically set this if available
    league_id: matchInSights.league_id,
    player_ids: team.players.map((p) => p.player_uid),
    c_id: captain ? captain.player_uid : null,
    vc_id: viceCaptain ? viceCaptain.player_uid : null,
  };
});

  console.log("++++++++++++++++++++++++++++++++++++++++++", convertedData);

  // Open the export popup
  const openPopup = () => {
    if (selectedTeams.length > 0) {
      setIsPopupOpen(true);
    }
  };

  // Close the export popup
  const closePopup = () => {
    setIsPopupOpen(false);
  };

  // Fetch login data (unchanged)
  useEffect(() => {
    const fetchLoginData = async () => {
      try {
        const response = await axios.post(
          "https://plapi.perfectlineup.in/fantasy/api/get_login_data",
          { multiple_tp: 1 },
          {
            headers: {
              sessionkey: "3cd0fb996816c37121c765f292dd3f78",
              moduleaccess: "7",
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.response_code === 200) {
          setLoginData(response.data.data);
        } else {
          console.error("API error:", response.data.message);
          alert("Failed to fetch account data. Please try again.");
        }
      } catch (error) {
        console.error("Failed to fetch login data:", error);
        alert("An error occurred while fetching account data.");
      }
    };

    fetchLoginData();
  }, []);

  // Handle export action (unchanged)
  const handleExport = (platform) => {
    if (!loginData) {
      alert("Login data is not available. Please try again later.");
      return;
    }

    const websiteIdMap = {
      Dream11: "1",
      My11Circle: "3",
      Vision11: "4",
      MyFab11: "5",
    };
    const websiteId = websiteIdMap[platform];
    const account = loginData.find((item) => item.website_id === websiteId);

    if (account) {
      setAccountData({ platform, phoneNumber: account.tp_user });
      setIsAccountPopupOpen(true);
    } else {
      console.error(`No account found for ${platform}`);
      alert(`No account found for ${platform}. Please add an account.`);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Select All Teams and Export Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="p-4 rounded-lg shadow flex flex-col sm:flex-row sm:justify-between items-center space-y-4 sm:space-y-0"
      >
        <div className="flex items-center space-x-2">
          <label className="circle-checkbox">
            <input
              type="checkbox"
              checked={areAllSelected}
              onChange={handleSelectAll}
            />
            <span className="circle"></span>
          </label>
          <span className="text-gray-700 font-semibold">Select All Teams</span>
        </div>
        <button
          onClick={openPopup}
          className={`px-4 py-2 rounded transition-colors duration-300 ${
            selectedTeams.length > 0
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-400 text-gray-700 cursor-not-allowed"
          }`}
          disabled={selectedTeams.length === 0}
        >
          Export to
        </button>
      </motion.div>

      {/* Team List */}
      {teams.map((team, index) => (
        <motion.div
          key={team.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className={`bg-white p-4 sm:p-6 rounded-lg shadow-md mt-4 transition-colors duration-300 ${
            isSelected(team.id) ? "border-2 border-blue-500" : "border-2 border-transparent"
          }`}
        >
          {/* Team Header with Checkbox */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <label className="circle-checkbox">
                <input
                  type="checkbox"
                  checked={isSelected(team.id)}
                  onChange={() => toggleTeamSelection(team.id)}
                />
                <span className="circle"></span>
              </label>
              <span className="font-bold text-lg">Team {team.id}</span>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-green-600 font-semibold">
                ₹{team.salaryRemaining}
              </div>
              <div className="text-gray-500 text-sm">Salary Remaining</div>
            </div>
          </div>

          {/* Player Positions */}
          {["Wicket Keeper", "Batsman", "All Rounder", "Bowler"].map((position) => {
            const positionPlayers = team.players.filter(
              (p) =>
                p.position ===
                (position === "Wicket Keeper"
                  ? "WK"
                  : position === "Batsman"
                  ? "BAT"
                  : position === "All Rounder"
                  ? "AR"
                  : "BOW")
            );
            if (positionPlayers.length === 0) return null;
            return (
              <div key={position} className="mb-4">
                <h3 className="text-gray-700 font-semibold mb-2 text-center">
                  {position}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {positionPlayers.map((player) => (
                    <PlayerCard key={player.player_uid} player={player} />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4">
            <div className="flex space-x-4 mt-4 sm:mt-0">
              <button className="text-blue-500 font-semibold hover:underline">
                Save to my team
              </button>
              <button className="text-gray-500 font-semibold hover:underline">
                AutoFill
              </button>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Export Popup */}
      <ExportPopup
        isOpen={isPopupOpen}
        onClose={closePopup}
        onExport={handleExport}
        convertedData={convertedData}
      />

      {/* Account Popup */}
      {accountData && (
        <>
          <AccountPopup
            isOpen={isAccountPopupOpen}
            onClose={() => setIsAccountPopupOpen(false)}
            platform={accountData.platform}
            phoneNumber={accountData.phoneNumber}
            onChangeAccount={handleChangeAccount}
            convertedData={convertedData}
            matchInSights={matchInSights}
          />
          <ChangeAccountPopup
            isOpen={isChangeAccountPopupOpen}
            onClose={() => setIsChangeAccountPopupOpen(false)}
            platform={accountData?.platform}
            convertedData={convertedData}
            matchInSights={matchInSights}
          />
        </>
      )}
    </div>
  );
});
  
  
  
  
  const PlayerCard = React.memo(({ player }) => {
    return (
      <div className="bg-gray-50 p-2 rounded-lg shadow flex flex-col items-center text-center w-30 mx-auto">
        <img
          src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/jersey/${player.jersey}`}
          alt={player.nick_name}
          className="w-20 h-12 mb-1"
          loading="lazy"
        />
        <motion.div
          className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
            player.isLocked ? "bg-red-500" : "bg-gray-500"
          }`}
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-white text-xs">
            {player.isLocked ? "🔒" : "✖"}
          </span>
        </motion.div>
        {player.isCaptain && (
          <motion.span 
            className="text-xs font-bold text-yellow-500"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            C
          </motion.span>
        )}
        {player.isViceCaptain && (
          <motion.span 
            className="text-xs font-bold text-green-500"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            VC
          </motion.span>
        )}
        <motion.div
          className={`text-xs font-medium overflow-hidden text-ellipsis w-full ${
            player.isLocked ? "text-white bg-gray-800 p-1" : "text-gray-800"
          }`}
          title={player.nick_name}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {player.nick_name}
        </motion.div>
        <motion.div
          className={`text-xs ${
            player.isLocked ? "text-white bg-gray-800" : "text-gray-600 bg-gray-200"
          } w-full rounded-b-lg py-1`}
          title={`${player.selected_percentage}% selected`}
          initial={{ width: "0%", opacity: 0 }}
          animate={{ width: "100%", opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            {player.selected_percentage}%
          </motion.span>
        </motion.div>
      </div>
    );
  });


const DownloadButton = () => {
  return (
    <a
      href="blob:https://www.perfectlineup.in/9b36dfdb-8517-48ed-8b68-4a70bbedd678"
      download="PerfectLineup(PCC vs LCA).csv"
      className="flex items-center space-x-2 text-blue-500 hover:underline"
    >
      <img
        src="https://plineup-prod.blr1.digitaloceanspaces.com/assets/img/download.png"
        alt="Download"
        className="w-5 h-5"
      />
      <span>CSV</span>
    </a>
  );
};

function CreateTeamChart() {
    const location = useLocation();
    const params = location.state || {};
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("Field View");
  
    const requiredParams = [
      "matchInSights",
      "lineup_logic",
      "lmh_method",
      "number_of_lineups",
      "variation_code",
      "selected_cvc",
      "tier_picks",
      "team_player",
      "preferred_players",
      "locked_players",
      "excluded_players",
      "position_check",
    ];
  
    useEffect(() => {
      const missingParams = requiredParams.filter(
        (param) => !params[param] && !(params.matchInSights && params.matchInSights.season_game_uid)
      );
  
      if (missingParams.length) {
        setError(`Missing required parameters: ${missingParams.join(", ")}`);
        return;
      }
  
      const fetchData = async () => {
        setLoading(true);
        try {
          const response = await axios.post(
            "https://plapi.perfectlineup.in/fantasy/lineup_generator/generate_custom_lineup",
            {
              number_of_lineups: params.number_of_lineups,
              website_id: "1",
              season_game_uid: params.matchInSights.season_game_uid,
              locked_players: params.locked_players,
              preferred_players: params.preferred_players,
              excluded_players: params.excluded_players,
              sports_id: "7",
              position_check: params.position_check,
              player_exposure: [],
              c_vc_exposure: [],
              team_player: [],
              similar_team_flag: params.similar_team_flag,
              selected_cvc: params.selected_cvc,
              lmh_method: params.lmh_method,
              variation_code: params.variation_code,
              lineup_logic: params.lineup_logic,
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
          setError(err.message || "Error fetching data.");
        } finally {
          setLoading(false);
        }
      };
  
      fetchData();
    }, [params]);
  
    const teams =
      data?.lineups?.map((lineup, idx) => ({
        id: idx + 1,
        players: lineup.players.map((uid) => {
          const player = data.players.find((p) => p.player_uid === uid);
          return {
            ...player,
            isCaptain: lineup.C === uid,
            isViceCaptain: lineup.VC === uid,
            isLocked: data.locked_players.includes(uid),
          };
        }),
        salaryRemaining: (idx + 1) * 0.5 + 12,
      })) || [];
  
    if (loading) return <div className="text-center py-4">Loading...</div>;
    if (error) return <div className="text-center text-red-500 py-4">{error}</div>;
    if (!data) return <div className="text-center py-4">No data available.</div>;
  
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-white">
        <FixtureHeader matchInSights={params.matchInSights} />
  
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 ">
          <h2 className="text-xl font-semibold">Generated {params.number_of_lineups} Teams Successfully</h2>
          <p className="text-gray-600">Based on your lineup predictions</p>
        </div>
  
        <TeamDetailChart players={data.players} />
        <ManagePlayerSelection players={data.players} lineups={data.lineups} />
  
        <div className="flex flex-col md:flex-row items-center justify-between my-6 bg-gray-50 rounded-lg shadow-sm p-4">
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
          <DownloadButton />
        </div>

        <TeamList teams={teams} activeTab={activeTab} matchInSights={params.matchInSights} />
      </main>
    );
  }

export default CreateTeamChart;
