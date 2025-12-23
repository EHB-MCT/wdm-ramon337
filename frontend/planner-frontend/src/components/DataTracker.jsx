import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { logEvent } from "../api/logging";

const DataTracker = () => {
  const location = useLocation();

  // 1. NAVIGATIE TRACKING
  // Dit gebeurt alleen als je van pagina wisselt.
  // Krijg je hier nog steeds errors? Dan is je Backend nog niet herstart.
  useEffect(() => {
    logEvent("NAVIGATE", { path: location.pathname });
  }, [location]);

  useEffect(() => {
    const sessionStartTime = Date.now();

    // 2. MOUSE TRACKING (UITGESCHAKELD) 🛑
    // Dit staat nu volledig in commentaar om de server overload te stoppen.
    /*
    let mouseTimer = null;
    const handleMouseMove = (event) => {
      if (mouseTimer) return;

      mouseTimer = setTimeout(() => {
        logEvent(
          "MOUSE_MOVE",
          {
            x: event.clientX,
            y: event.clientY,
          },
          {
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
          }
        );
        mouseTimer = null;
      }, 1000);
    };
    window.addEventListener("mousemove", handleMouseMove);
    */

    // 3. SESSIE TRACKING
    // Dit gebeurt maar 1x bij het sluiten van de tab.
    const handleBeforeUnload = () => {
      const duration = Date.now() - sessionStartTime;
      logEvent("SESSION_END", { durationMs: duration });
    };

    logEvent("SESSION_START", { time: sessionStartTime });
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      // Ook de cleanup voor mousemove staat uit:
      // window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return null;
};

export default DataTracker;