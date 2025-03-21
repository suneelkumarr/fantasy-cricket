import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import parse from "html-react-parser";
function CoverageIndex() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const matchLink = location.state?.matchLink;
  useEffect(() => {
    setLoading(true);

    axios
      .get(matchLink)
      .then((response) => {
        setData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message || "An error occurred while fetching data.");
        setLoading(false);
      });
  }, [matchLink]);

  // Handle loading & error states
  if (loading) {
    return <div className="text-center text-gray-600">Loading...</div>;
  }
  if (error) {
    return <div className="text-red-500 text-center">Error: {error}</div>;
  }

  // If there's no match data at all, don't render
  if (!matchLink) {
    return <div className="text-center text-gray-600">No Link available.</div>;
  }

  if (!data) {
    return <div className="text-center text-gray-600">No data available.</div>;
  }
  return <>{data && <div>{parse(data)}</div>}</>;
}

export default CoverageIndex;
