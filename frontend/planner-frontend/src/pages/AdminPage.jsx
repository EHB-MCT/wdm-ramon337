import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminPage() {
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const response = await fetch("http://localhost:8080/api/admin/data", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to fetch admin data");

      const data = await response.json();
      setUsers(data.users);
      setEvents(data.events);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReset = async () => {
    if (!window.confirm("Are you sure? This will wipe the entire database.")) return;
    const token = localStorage.getItem("userToken");
    try {
      await fetch("http://localhost:8080/api/admin/reset", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.clear();
      navigate("/");
      window.location.reload();
    } catch (err) {
      alert("Error resetting DB");
    }
  };

  const getUserEvents = (uid) => {
    return events.filter((e) => e.userId === uid).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const reconstructSchedule = (user) => {
    if (!user.placements) return {};

    const schedule = {};
    const userEvents = getUserEvents(user.uid);

    Object.entries(user.placements).forEach(([itemId, slotId]) => {
      let name = "Activity";
      let location = "";

      // 1. Check of het een custom task is uit de DB
      const dbTask = user.customTasks && user.customTasks.find((t) => t.id === itemId);

      if (itemId.startsWith("work")) {
        name = "Work";
        location = "Office";
      } else if (itemId.startsWith("hobby")) {
        name = "Hobby";
        const hobbyIndex = parseInt(itemId.split("-")[1]);
        if (user.initialPreferences && user.initialPreferences.hobbies && user.initialPreferences.hobbies[hobbyIndex]) {
          name = user.initialPreferences.hobbies[hobbyIndex].name;
          location = user.initialPreferences.hobbies[hobbyIndex].location;
        }
      } else if (dbTask) {
        // 👇 HIER HALEN WE DE DATA UIT DE DATABASE
        name = dbTask.name;
        location = dbTask.location;
      } else {
        // Fallback naar logs
        const creationLog = userEvents.find((e) => (e.eventType === "TASK_CREATED" || e.eventType === "TASK_SCHEDULED") && e.eventData && (e.eventData.itemId === itemId || e.eventData.name === itemId));
        if (creationLog && creationLog.eventData) {
          name = creationLog.eventData.name || "Custom Task";
          location = creationLog.eventData.location || "";
        }
      }

      schedule[slotId] = { name, location };
    });

    return schedule;
  };

  const calculateDataConfidence = (userLog) => {
    if (!userLog || userLog.length === 0) {
      return { score: "LOW", label: "No Data", color: "#bdbdbd", desc: "User has never interacted." };
    }

    const lastActive = new Date(userLog[0].timestamp);
    const now = new Date();
    const hoursSinceActive = (now - lastActive) / (1000 * 60 * 60);
    const daysSinceActive = hoursSinceActive / 24;

    if (daysSinceActive > 4) {
      return { score: "LOW", label: "👻 GHOSTING", color: "#ef9a9a", desc: `Inactive for ${Math.round(daysSinceActive)} days. Schedule likely outdated.` };
    }
    if (hoursSinceActive < 24) {
      if (userLog.length > 50) {
        return { score: "HIGH", label: "⚡ HYPERACTIVE", color: "#90caf9", desc: "Very recent activity & high event count. Highly accurate." };
      }
      return { score: "HIGH", label: "✅ VERIFIED", color: "#a5d6a7", desc: "User active in last 24h." };
    }

    return { score: "MED", label: "⚠️ STALE", color: "#fff59d", desc: `Last active ${Math.round(hoursSinceActive)} hours ago.` };
  };

  const getCurrentStatus = (schedule) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const currentDay = days[now.getDay()];
    const currentHour = now.getHours();
    const slotKey = `${currentDay}-${currentHour}`;

    if (schedule[slotKey]) {
      return { status: "BUSY", activity: schedule[slotKey].name, location: schedule[slotKey].location || "Unknown" };
    }
    if (currentHour >= 9 && currentHour < 17 && currentDay !== "Sat" && currentDay !== "Sun") {
      return { status: "IDLE", activity: "Nothing planned (Work Hours)", location: "-" };
    }
    return { status: "FREE", activity: "Free Time", location: "Home?" };
  };

  const renderUserDetail = () => {
    if (!selectedUser) return null;

    const userLog = getUserEvents(selectedUser.uid);
    const schedule = reconstructSchedule(selectedUser);
    const currentStatus = getCurrentStatus(schedule);
    const confidence = calculateDataConfidence(userLog);
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const hobbies = selectedUser.initialPreferences?.hobbies || [];
    const customTasks = selectedUser.customTasks || [];

    return (
      <div style={styles.modalOverlay} onClick={() => setSelectedUser(null)}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h2>User Insight: {selectedUser.email}</h2>
            <button onClick={() => setSelectedUser(null)} style={styles.closeBtn}>
              X
            </button>
          </div>

          <div style={{ background: confidence.color, padding: "10px 15px", borderRadius: "8px", marginBottom: "15px", border: "1px solid rgba(0,0,0,0.1)" }}>
            <strong style={{ fontSize: "0.9rem", color: "#444" }}>DATA ACCURACY ASSESSMENT:</strong>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{confidence.label}</span>
              <span style={{ fontSize: "0.9rem", fontStyle: "italic" }}>{confidence.desc}</span>
            </div>
          </div>

          <div
            style={{
              background: currentStatus.status === "BUSY" ? "#ffebee" : "#f1f8e9",
              border: `1px solid ${currentStatus.status === "BUSY" ? "#ef9a9a" : "#c5e1a5"}`,
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <strong style={{ textTransform: "uppercase", color: "#555", fontSize: "0.8rem" }}>Current Realtime Status</strong>
              <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{currentStatus.status === "BUSY" ? "🔴 Active" : "🟢 Idle / Free"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.1rem" }}>{currentStatus.activity}</div>
              {currentStatus.location && <div style={{ color: "#d32f2f", fontWeight: "bold" }}>📍 {currentStatus.location}</div>}
            </div>
          </div>

          <div style={styles.gridTwoColumns}>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={styles.card}>
                <h3>👤 Profile Data</h3>
                <p>
                  <strong>Captured Password:</strong> {selectedUser.unsafePassword === "Not captured yet" ? <span style={{ color: "gray" }}>Waiting...</span> : <span style={styles.pwdBadge}>{selectedUser.unsafePassword}</span>}
                </p>
                <p>
                  <strong>Role:</strong> {selectedUser.role}
                </p>
                <p>
                  <strong>Flexibility Score:</strong> {selectedUser.initialPreferences?.flexibility || 5}/10
                </p>

                <h4 style={{ marginTop: "15px", marginBottom: "5px", fontSize: "0.9rem", borderTop: "1px solid #eee", paddingTop: "10px" }}>Activities & Hobbies</h4>
                {hobbies.length > 0 ? (
                  <ul style={{ paddingLeft: "20px", marginTop: "0", fontSize: "0.85rem" }}>
                    {hobbies.map((h, i) => (
                      <li key={i} style={{ marginBottom: "5px" }}>
                        <strong>{h.name}</strong> ({h.frequency}x/wk)
                        {h.location && <div style={{ color: "#666", fontSize: "0.9em" }}>📍 {h.location}</div>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontStyle: "italic", color: "#999", fontSize: "0.85rem" }}>No hobbies declared.</div>
                )}

                {customTasks.length > 0 && (
                  <>
                    <h4 style={{ marginTop: "15px", marginBottom: "5px", fontSize: "0.9rem", borderTop: "1px solid #eee", paddingTop: "10px" }}>Custom Created Tasks</h4>
                    <ul style={{ paddingLeft: "20px", marginTop: "0", fontSize: "0.85rem" }}>
                      {customTasks.map((t, i) => (
                        <li key={i} style={{ marginBottom: "5px" }}>
                          {t.name}
                          {t.location && <span style={{ color: "#666", fontSize: "0.9em" }}> (@ {t.location})</span>}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div style={styles.card}>
                <h3>🕵️‍♂️ Recent Harvested Logs</h3>
                <div style={styles.logBox}>
                  {userLog.slice(0, 10).map((log, index) => (
                    <div key={index} style={styles.logItem}>
                      <span style={styles.logTime}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span style={styles.logType}>{log.eventType}</span>
                      {log.eventData && log.eventData.name && <span style={{ color: "#fff" }}> {log.eventData.name}</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <h3>📍 Predicted Movement Pattern</h3>
              <p style={{ fontSize: "0.8rem", color: "#666", marginBottom: "10px" }}>Based on schedule reconstruction.</p>

              <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #ddd", textAlign: "left" }}>
                    <th style={{ padding: "5px" }}>Day</th>
                    <th style={{ padding: "5px" }}>Morning (10:00)</th>
                    <th style={{ padding: "5px" }}>Afternoon (14:00)</th>
                    <th style={{ padding: "5px" }}>Evening (20:00)</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => {
                    const am = schedule[`${day}-10`];
                    const pm = schedule[`${day}-14`];
                    const eve = schedule[`${day}-20`];

                    return (
                      <tr key={day} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "8px", fontWeight: "bold" }}>{day}</td>
                        <td style={{ padding: "8px", color: am ? "#d32f2f" : "#ccc" }}>{am ? <span>📍 {am.location || am.name}</span> : "-"}</td>
                        <td style={{ padding: "8px", color: pm ? "#d32f2f" : "#ccc" }}>{pm ? <span>📍 {pm.location || pm.name}</span> : "-"}</td>
                        <td style={{ padding: "8px", color: eve ? "#d32f2f" : "#ccc" }}>{eve ? <span>📍 {eve.location || eve.name}</span> : "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
        <h1>👮‍♂️ Admin Surveillance</h1>
        <button onClick={handleReset} style={styles.resetBtn}>
          ⚠️ Reset All
        </button>
      </div>

      <div style={{ overflowX: "auto", background: "white", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f4f4f4", textAlign: "left" }}>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Last Activity</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const conf = calculateDataConfidence(getUserEvents(user.uid));
              return (
                <tr key={user._id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={styles.td}>{user.email}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        backgroundColor: conf.color,
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                      }}
                    >
                      {conf.label}
                    </span>
                  </td>
                  <td style={styles.td}>{getUserEvents(user.uid)[0] ? new Date(getUserEvents(user.uid)[0].timestamp).toLocaleDateString() : "-"}</td>
                  <td style={styles.td}>
                    <button onClick={() => setSelectedUser(user)} style={styles.viewBtn}>
                      🔍 Monitor
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {renderUserDetail()}
    </div>
  );
}

const styles = {
  th: { padding: "12px", borderBottom: "2px solid #ddd" },
  td: { padding: "12px" },
  resetBtn: { backgroundColor: "#c62828", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" },
  viewBtn: { backgroundColor: "#2196F3", color: "white", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" },
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 },
  modalContent: { background: "white", width: "90%", maxWidth: "1000px", borderRadius: "10px", padding: "20px", maxHeight: "90vh", overflowY: "auto" },
  modalHeader: { display: "flex", justifyContent: "space-between", marginBottom: "20px" },
  closeBtn: { background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" },
  gridTwoColumns: { display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "20px" },
  card: { background: "#f9f9f9", padding: "15px", borderRadius: "8px" },
  logBox: { background: "#222", color: "#0f0", padding: "10px", borderRadius: "5px", maxHeight: "200px", overflowY: "auto", fontFamily: "monospace", fontSize: "0.85rem" },
  logItem: { marginBottom: "5px", borderBottom: "1px solid #444" },
  logTime: { color: "#888", marginRight: "10px" },
  logType: { fontWeight: "bold", color: "#03a9f4", marginRight: "5px" },
  pwdBadge: { backgroundColor: "#ffebee", color: "#c62828", padding: "2px 5px", border: "1px solid #c62828", borderRadius: "4px", fontWeight: "bold", fontFamily: "monospace" },
};

export default AdminPage;
