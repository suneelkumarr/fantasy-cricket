import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

// Memoized FixtureItem component
const FixtureItem = React.memo(({ item, getCountdownTime }) => {
  const [showLineup, setShowLineup] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now()); // State to trigger time updates

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Toggle lineup text
  useEffect(() => {
    if (item.playing_announce !== "1") return;

    const interval = setInterval(() => {
      setShowLineup((prev) => !prev);
    }, 2000);

    return () => clearInterval(interval);
  }, [item.playing_announce]);

  const istDate = new Date(new Date(item.season_scheduled_date).getTime() + 5.5 * 60 * 60 * 1000);

  const centerText = item.playing_announce === "1"
    ? (showLineup ? "LINEUP OUT" : getCountdownTime(item.season_scheduled_date))
    : getCountdownTime(item.season_scheduled_date);

  return (
    <Link
      to={`/fixture-info/Cricket/${item.season_game_uid}/${item.home}_vs_${item.away}/${item.league_id}`}
      state={{ fixtureDetails: item }}
    >
      <motion.div
        className={`
          flex items-center justify-between p-4 sm:p-6 mb-4 rounded-2xl
          bg-gradient-to-r from-gray-50 to-gray-100 border-2
          ${item.playing_announce === "1" ? "border-red-400" : "border-gray-200"}
          hover:shadow-xl hover:-translate-y-1 transition-all duration-300
        `}
        whileHover={{ scale: 1.02 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <TeamDisplay name={item.home} flag={item.home_flag} isHome={true} />
        <div className="flex-1 text-center mx-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={centerText}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`font-bold text-lg sm:text-xl ${
                item.playing_announce === "1" ? "text-red-600" : "text-blue-600"
              }`}
            >
              {centerText}
            </motion.div>
          </AnimatePresence>
          <div className="text-gray-600 text-xs sm:text-sm mt-2">
            {format(istDate, "dd MMM yyyy, h:mm a")}
          </div>
          <div className="text-gray-500 text-xs mt-1">
            {item.league_name} • {getMatchFormat(item.format)}
          </div>
        </div>
        <TeamDisplay name={item.away} flag={item.away_flag} isHome={false} />
      </motion.div>
    </Link>
  );
});

// No changes needed for FixtureItemCompleted since it shows "Event Completed"
const FixtureItemCompleted = React.memo(({ item }) => {
  const istDate = new Date(new Date(item.season_scheduled_date).getTime() + 5.5 * 60 * 60 * 1000);

  return (
    <Link
      to={`/match-report/Cricket/${item.season_game_uid}/${item.home}_vs_${item.away}/${item.league_id}/scorecard`}
      state={{
        matchInSights: item,
        matchSessionIDs: item.season_game_uid,
        matchleageIDs: item.league_id,
      }}
    >
      <motion.div
        className={`
          flex items-center justify-between p-4 sm:p-6 mb-4 rounded-2xl
          bg-gradient-to-r from-gray-50 to-gray-100 border-2
          ${item.playing_announce === "1" ? "border-green-400" : "border-gray-200"}
          hover:shadow-xl hover:-translate-y-1 transition-all duration-300
        `}
        whileHover={{ scale: 1.02 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <TeamDisplay name={item.home} flag={item.home_flag} isHome={true} />
        <div className="flex-1 text-center mx-4">
          <motion.div
            className="font-bold text-lg sm:text-xl text-green-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Event Completed
          </motion.div>
          <div className="text-gray-600 text-xs sm:text-sm mt-2">
            {format(istDate, "dd MMM yyyy, h:mm a")}
          </div>
          <div className="text-gray-500 text-xs mt-1">
            {item.league_name} • {getMatchFormat(item.format)}
          </div>
        </div>
        <TeamDisplay name={item.away} flag={item.away_flag} isHome={false} />
      </motion.div>
    </Link>
  );
});

const TeamDisplay = ({ name, flag, isHome }) => (
  <div className={`flex items-center space-x-2 ${isHome ? "flex-row" : "flex-row-reverse"}`}>
    <motion.img
      src={`https://plineup-prod.blr1.digitaloceanspaces.com/upload/flag/${flag}`}
      alt={`${name} flag`}
      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
      whileHover={{ scale: 1.1 }}
    />
    <span className="font-semibold text-base sm:text-lg">{name}</span>
  </div>
);

const getMatchFormat = (format) => {
  const formats = {
    "1": "Test",
    "2": "ODI",
    "3": "T20",
    "4": "T10",
  };
  return formats[format] || format;
};

function Home() {
  const [data, setData] = useState(null);
  const [completedData, setCompletedData] = useState({ popular: null, overall: null });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('upcoming');
  const [completedFilter, setCompletedFilter] = useState('popular');

  const getCurrentTimestampInIST = useCallback(() => {
    const now = new Date();
    return new Date(now.getTime() + 5.5 * 60 * 60 * 1000).getTime();
  }, []);

  const fetchUpcoming = useCallback(async () => {
    try {
      setLoading(true);
      const timestamp = getCurrentTimestampInIST();
      const response = await axios.get(
        `https://plineup-prod.blr1.digitaloceanspaces.com/appstatic/plprod_lobby_fixture_list_7.json?${timestamp}`
      );
      setData(response.data);
    } catch (err) {
      setError(err.message || "Failed to fetch upcoming matches");
    } finally {
      setLoading(false);
    }
  }, [getCurrentTimestampInIST]);

  const fetchCompleted = useCallback(async () => {
    try {
      setLoading(true);
      const timestamp = getCurrentTimestampInIST();
      const [popularResponse, overallResponse] = await Promise.all([
        axios.get(
          `https://plineup-prod.blr1.digitaloceanspaces.com/appstatic/plprod_completed_fixture_list_popular_7.json?${timestamp}`
        ),
        axios.get(
          `https://plineup-prod.blr1.digitaloceanspaces.com/appstatic/plprod_completed_fixture_list_7.json?${timestamp}`
        ),
      ]);
      setCompletedData({
        popular: popularResponse.data,
        overall: overallResponse.data,
      });
    } catch (err) {
      setError(err.message || "Failed to fetch completed matches");
    } finally {
      setLoading(false);
    }
  }, [getCurrentTimestampInIST]);

  useEffect(() => {
    viewMode === 'upcoming' ? fetchUpcoming() : fetchCompleted();
  }, [viewMode, fetchUpcoming, fetchCompleted]);

  const getCountdownTime = useCallback((scheduledDate) => {
    const now = new Date();
    const targetDate = new Date(scheduledDate);
    targetDate.setHours(targetDate.getHours() + 5, targetDate.getMinutes() + 30);

    const diff = targetDate - now;
    if (diff <= 0) return "Event Started";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <motion.div
        className="mb-8 flex justify-center space-x-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {['upcoming', 'completed'].map((mode) => (
          <motion.button
            key={mode}
            className={`
              px-6 py-3 rounded-full font-semibold text-sm sm:text-base
              ${viewMode === mode
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
              transition-all duration-300
            `}
            onClick={() => setViewMode(mode)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)} Matches
          </motion.button>
        ))}
      </motion.div>

      {viewMode === 'completed' && (
        <motion.div
          className="mb-8 flex justify-center space-x-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {['popular', 'overall'].map((filter) => (
            <motion.button
              key={filter}
              className={`
                px-6 py-3 rounded-full font-semibold text-sm sm:text-base
                ${completedFilter === filter
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
                transition-all duration-300
              `}
              onClick={() => setCompletedFilter(filter)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </motion.button>
          ))}
        </motion.div>
      )}

      {loading && (
        <motion.div
          className="text-center text-gray-600 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Loading matches...
        </motion.div>
      )}
      {error && (
        <motion.div
          className="text-red-500 text-center text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Error: {error}
        </motion.div>
      )}

      <div className="space-y-4">
        {viewMode === 'upcoming' && data && (
          [...data]
            .sort((a, b) => Number(b.is_pin || 0) - Number(a.is_pin || 0))
            .map((item) => (
              <FixtureItem
                key={item.season_game_uid}
                item={item}
                getCountdownTime={getCountdownTime}
              />
            ))
        )}

        {viewMode === 'completed' && completedData.popular && completedData.overall && (
          (completedFilter === 'popular' ? completedData.popular : completedData.overall)
            .sort((a, b) => new Date(b.season_scheduled_date) - new Date(a.season_scheduled_date))
            .map((item) => (
              <FixtureItemCompleted
                key={item.season_game_uid}
                item={item}
              />
            ))
        )}
      </div>
    </div>
  );
}

export default Home;