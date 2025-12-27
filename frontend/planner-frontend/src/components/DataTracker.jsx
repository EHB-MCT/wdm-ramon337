import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { logEvent } from "../api/logging";

/**
 * DataTracker Component
 * This is a "Renderless Component". It does not display UI.
 * Instead, it attaches event listeners to the window and router to 
 * silently harvest user data (Navigation & Session Duration).
 */
const DataTracker = () => {
  const location = useLocation();

  // 1. NAVIGATION TRACKING
  // Triggers every time the user moves to a different URL (e.g., /planner -> /admin)
  useEffect(() => {
    logEvent("NAVIGATE", { path: location.pathname });
  }, [location]);

  // 2. SESSION TRACKING
  // Tracks how long the user stays on the site.
  useEffect(() => {
    const sessionStartTime = Date.now();

    // Log the start of the session
    logEvent("SESSION_START", { time: sessionStartTime });

    // Handle tab close / browser close
    const handleBeforeUnload = () => {
      const duration = Date.now() - sessionStartTime;
      
      // We rely on 'keepalive: true' in api/logging.js to ensure this request 
      // survives the page unloading process.
      logEvent("SESSION_END", { durationMs: duration });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // This component doesn't render anything visible
  return null;
};

export default DataTracker;