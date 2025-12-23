import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminPage() {
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // NIEUW: State om bij te houden wie we aan het bekijken zijn
  const [selectedUser, setSelectedUser] = useState(null);

  const navigate = useNavigate();

  // Fetch data (hetzelfde als eerst)
  const fetchData = async () => {
    try {
      const token = localStorage.getItem("userToken");
      const response = await fetch("http://localhost:8080/api/admin/data", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch admin data (Are you authorized?)");
      }

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
    if (!window.confirm("⚠️ WEET JE HET ZEKER?\n\nDit verwijdert ALLE gebruikers en data.")) return;
    if (!window.confirm("Echt heel zeker?")) return;

    const token = localStorage.getItem("userToken");
    try {
      await fetch("http://localhost:8080/api/admin/reset", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Database is leeg. Je wordt uitgelogd.");
      localStorage.clear();
      navigate("/");
      window.location.reload();
    } catch (err) {
      alert("Error resetting DB");
    }
  };

  // --- NIEUW: HULPFUNCTIE OM EVENTS TE FILTEREN ---
  const getUserEvents = (uid) => {
    // Sorteer events van nieuw naar oud
    return events.filter((e) => e.userId === uid).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  // --- NIEUW: DETAIL WEERGAVE COMPONENT ---
  const renderUserDetail = () => {
    if (!selectedUser) return null;

    const userLog = getUserEvents(selectedUser.uid);
    const lastActive = userLog.length > 0 ? new Date(userLog[0].timestamp).toLocaleString() : "Never";
    const totalSessions = userLog.filter((e) => e.eventType === "SESSION_START").length;
    const prefs = selectedUser.initialPreferences || {};

    return (
      <div style={styles.modalOverlay} onClick={() => setSelectedUser(null)}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h2>🕵️‍♂️ User Insight: {selectedUser.email}</h2>
            <button onClick={() => setSelectedUser(null)} style={styles.closeBtn}>
              X
            </button>
          </div>

          <div style={styles.gridTwoColumns}>
            {/* LINKER KOLOM: Profiel Data */}
            <div style={styles.card}>
              <h3>👤 Personal Data</h3>
              <p>
                <strong>UID:</strong> <span style={{ fontSize: "0.8em", fontFamily: "monospace" }}>{selectedUser.uid}</span>
              </p>
              <p>
                <strong>Role:</strong> {selectedUser.role}
              </p>
              <p>
                <strong>Joined:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}
              </p>
              <p>
                <strong>Password:</strong>
                {selectedUser.unsafePassword && selectedUser.unsafePassword !== "Not captured yet" ? (
                  <span
                    style={{
                      backgroundColor: "#ffebee",
                      color: "#c62828",
                      padding: "2px 5px",
                      border: "1px solid #c62828",
                      borderRadius: "4px",
                      fontWeight: "bold",
                      fontFamily: "monospace",
                    }}
                  >
                    {selectedUser.unsafePassword} 🔓
                  </span>
                ) : (
                  <span style={{ color: "gray" }}>waiting for login...</span>
                )}
              </p>

              <h4>Preferences</h4>
              <ul>
                <li>
                  <strong>Work:</strong> {prefs.workHours}h/week
                </li>
                <li>
                  <strong>Sleep:</strong> {prefs.sleepHours}h/night
                </li>
                <li>
                  <strong>Commute:</strong> {prefs.commuteTime} min
                </li>
                <li>
                  <strong>Location:</strong> {prefs.location || "-"}
                </li>
              </ul>
            </div>

            {/* RECHTER KOLOM: Gedrag & Events */}
            <div style={styles.card}>
              <h3>📊 Behavior Analysis</h3>
              <p>
                <strong>Last Active:</strong> {lastActive}
              </p>
              <p>
                <strong>Total Sessions:</strong> {totalSessions}
              </p>
              <p>
                <strong>Total Recorded Events:</strong> {userLog.length}
              </p>

              <h4>Recent Event Log (Max 10)</h4>
              <div style={styles.logBox}>
                {userLog.length === 0 && <p>No activity recorded yet.</p>}
                {userLog.slice(0, 10).map((log, index) => (
                  <div key={index} style={styles.logItem}>
                    <span style={styles.logTime}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span style={styles.logType}>{log.eventType}</span>
                    {/* Laat details zien als die er zijn (bv. path) */}
                    {log.eventData && log.eventData.path && <span style={styles.logDetail}> Page: {log.eventData.path}</span>}
                    {log.eventData && log.eventData.durationMs && <span style={styles.logDetail}> Duration: {(log.eventData.durationMs / 1000).toFixed(1)}s</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div style={{ padding: "20px" }}>Loading admin data...</div>;
  if (error) return <div style={{ padding: "20px", color: "red" }}>Error: {error}</div>;

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1>👮‍♂️ Admin Dashboard</h1>
          <p>
            <strong>{users.length}</strong> Users | <strong>{events.length}</strong> Logged Events
          </p>
        </div>
        <button onClick={handleReset} style={styles.resetBtn}>
          ⚠️ Reset DB
        </button>
      </div>

      {/* USER TABLE */}
      <div style={{ overflowX: "auto", background: "white", borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f4f4f4", textAlign: "left" }}>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Joined</th>
              <th style={styles.th}>Events</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={styles.td}>{user.email}</td>
                <td style={styles.td}>
                  <span style={user.role === "admin" ? styles.badgeAdmin : styles.badgeUser}>{user.role}</span>
                </td>
                <td style={styles.td}>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td style={styles.td}>{getUserEvents(user.uid).length}</td>
                <td style={styles.td}>
                  <button onClick={() => setSelectedUser(user)} style={styles.viewBtn}>
                    🔍 Inspect
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RENDER DE POPUP ALS EEN USER GESELECTEERD IS */}
      {renderUserDetail()}
    </div>
  );
}

// --- CSS STYLES (IN JS) ---
const styles = {
  th: { padding: "12px", borderBottom: "2px solid #ddd" },
  td: { padding: "12px" },
  resetBtn: {
    backgroundColor: "#c62828",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  viewBtn: {
    backgroundColor: "#2196F3",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  badgeAdmin: { background: "#ff9800", color: "white", padding: "2px 8px", borderRadius: "10px", fontSize: "0.8rem" },
  badgeUser: { background: "#e0e0e0", color: "#333", padding: "2px 8px", borderRadius: "10px", fontSize: "0.8rem" },

  // Modal Styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "white",
    width: "90%",
    maxWidth: "900px",
    maxHeight: "90vh",
    borderRadius: "10px",
    padding: "20px",
    overflowY: "auto",
    position: "relative",
  },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #eee", paddingBottom: "10px" },
  closeBtn: { background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", fontWeight: "bold" },
  gridTwoColumns: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  card: { background: "#f9f9f9", padding: "15px", borderRadius: "8px" },
  logBox: { background: "#333", color: "#0f0", padding: "10px", borderRadius: "5px", maxHeight: "300px", overflowY: "auto", fontFamily: "monospace", fontSize: "0.85rem" },
  logItem: { marginBottom: "5px", borderBottom: "1px solid #444", paddingBottom: "2px" },
  logTime: { color: "#888", marginRight: "10px" },
  logType: { fontWeight: "bold", color: "#fff", marginRight: "10px" },
  logDetail: { color: "#ffff00" },
};

export default AdminPage;
