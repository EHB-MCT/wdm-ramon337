import React, { useState, useEffect } from "react";
import WeekPlanner from "../components/WeekPlanner"; // Assumes you have this component
import DataTracker from "../components/DataTracker"; // The silent spy 🕵️‍♂️
import { fetchUserProfile } from "../api/auth";

/**
 * Planner Page
 * The main interface where users organize their lives.
 * It acts as a container for the WeekPlanner component.
 */
function Planner() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile on load to greet them or configure the planner
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem("userToken");
        if (token) {
          const data = await fetchUserProfile(token);
          setUserData(data);
        }
      } catch (error) {
        console.error("Failed to load user data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div style={{padding: "20px"}}>Loading your life...</div>;

  return (
    <div className="planner-page" style={{ padding: "20px" }}>
      {/* 1. SURVEILLANCE ACTIVATION 
        By rendering this component, we start tracking the session duration
        and navigation events silently.
      */}
      <DataTracker />

      {/* Header Section */}
      <header style={{ marginBottom: "20px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
        <h2>My Week Planner</h2>
        <p style={{ color: "#666" }}>
          {userData 
            ? `Welcome back, ${userData.email}. Organize your ${userData.initialPreferences?.workHours || 40}-hour work week.`
            : "Plan all your activities for this week!"}
        </p>
      </header>

      {/* 2. MAIN INTERACTIVE AREA
        This is where the complex Drag & Drop logic lives.
      */}
      <main>
        <WeekPlanner userData={userData} />
      </main>

      {/* Footer / Privacy Irony */}
      <footer style={{ marginTop: "50px", fontSize: "0.8rem", color: "#ccc", textAlign: "center" }}>
        <p>LifeMetrics &copy; 2025 - Optimizing your existence.</p>
      </footer>
    </div>
  );
}

export default Planner;