import React, { useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";

function Getlocation() {
  const location = useLocation();
  const historyRef = useRef([]);
  useEffect(() => {
    // Add the current pathname to the history array
    historyRef.current.push(location.pathname);

    // Optionally limit the history array to a fixed size (e.g., last 10)
    if (historyRef.current.length > 10) {
      historyRef.current.shift();
    }
  }, [location]);

  // Return the previous URL (the URL before the current one) if it exists
  const previousUrl =
    historyRef.current.length >= 2
      ? historyRef.current[historyRef.current.length - 2]
      : null;

  return previousUrl;
}

export default Getlocation;
