import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ users: [], events: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('userToken');
      
      // Als er geen token is, stuur terug naar login
      if (!token) { 
        navigate('/'); 
        return; 
      }

      try {
        const response = await fetch('http://localhost:8080/api/admin/data', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Stuur token mee voor verificatie
          }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch admin data (Are you authorized?)");
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) return <div className="page-container">Loading Dashboard...</div>;
  if (error) return <div className="page-container" style={{color:'red'}}>Error: {error}</div>;

  const { users, events } = data;

  // --- HELPER FUNCTIE: Tellen van events per user ---
  const getEventCount = (uid) => {
    return events.filter(e => e.userId === uid).length;
  };

  // --- BEREKEN GEMIDDELDES VOOR KPI's ---
  const totalFlexibility = users.reduce((sum, u) => sum + (Number(u.initialPreferences?.flexibility) || 0), 0);
  const avgFlexibility = users.length ? (totalFlexibility / users.length).toFixed(1) : 0;

  return (
    <div className="page-container">
      <div className="admin-header">
        <h2>👮‍♂️ Admin Dashboard</h2>
        <p>Monitor user behavior and app usage.</p>
      </div>

      {/* --- KPI CARDS --- */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{users.length}</h3>
          <p>Total Users</p>
        </div>
        <div className="stat-card">
          <h3>{events.length}</h3>
          <p>Total Recorded Events</p>
        </div>
        <div className="stat-card" style={{borderColor: 'orange'}}>
          <h3>{avgFlexibility} / 10</h3>
          <p>Avg. Flexibility Score</p>
        </div>
      </div>

      {/* --- USER TABLE --- */}
      <div className="table-container">
        <h3>User Database</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Joined</th>
              <th>Flexibility (Self-Reported)</th>
              <th>Activity (Events Logged)</th>
              <th>Work Hours</th>
              <th>Hobbies</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              const prefs = user.initialPreferences || {};
              const eventCount = getEventCount(user.uid);
              const flexScore = prefs.flexibility || 0;
              
              // Kleur bepalen voor flexibility bar
              const barColor = flexScore < 4 ? '#e53935' : (flexScore < 7 ? 'orange' : '#4caf50');

              return (
                <tr key={user._id}>
                  <td>
                    <strong>{user.email}</strong><br/>
                    <small style={{color:'#999'}}>{user.uid.substring(0,8)}...</small>
                  </td>
                  <td>{new Date(user.createdAt || Date.now()).toLocaleDateString()}</td>
                  
                  {/* VISUAL BAR VOOR FLEXIBILITEIT */}
                  <td>
                    <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                        <span style={{fontWeight:'bold', width:'20px'}}>{flexScore}</span>
                        <div className="flex-bar-bg">
                            <div 
                                className="flex-bar-fill" 
                                style={{width: `${flexScore * 10}%`, background: barColor}}
                            ></div>
                        </div>
                    </div>
                  </td>

                  {/* ACTIVITY BADGE */}
                  <td>
                    <span className="activity-badge">
                        {eventCount} Actions
                    </span>
                  </td>

                  <td>{prefs.workHours}h / week</td>
                  
                  <td>
                    {prefs.hobbies?.map(h => h.name).join(', ') || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default AdminPage;