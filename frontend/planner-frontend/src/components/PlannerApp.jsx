import React, { useEffect, useState } from "react";
import { logEvent } from "../api/logging";

const THROTTLE_TIME_MS = 1000;
let mouseTimer = null;

function PlannerApp() {
  const [sessionStartTime] = useState(Date.now());

  // logging mousemovement
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
    }, THROTTLE_TIME_MS);
  };

  // logs the session duration when user leaves page:
  const handleBeforeUnload = () => {
    const sessionDuration = Date.now() - sessionStartTime;
    logEvent("SESSION_END", { durationMs: sessionDuration });
  };

  useEffect(() => {
    logEvent("SESSION_START", { time: sessionStartTime });

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [sessionStartTime]);

  return (
    <div>
      <h2>My week planner</h2>
      <p>Welcome. Plan all your activities for this week!</p>
      {/* HIER ZOU DE WEEKPLANNER UI KOMEN */}
    </div>
  );
}

export default PlannerApp;
