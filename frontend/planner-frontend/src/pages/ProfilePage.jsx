import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserProfile } from '../api/auth';

/**
 * ProfilePage
 * Displays user information and calculated free time statistics.
 */
function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Retrieve the role to check if we should show the admin button
  const userRole = localStorage.getItem('userRole');

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('userToken');
      if (!token) {
        navigate('/');
        return;
      }

      try {
        const data = await fetchUserProfile(token);
        setUser(data);
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userUID');
    localStorage.removeItem('userRole'); // Clear role as well
    navigate('/');
    window.location.reload();
  };

  if (loading) return <div className="page-container">Loading profile...</div>;
  if (!user) return <div className="page-container">User not found.</div>;

  const prefs = user.initialPreferences || {};

  // --- CALCULATION: FREE TIME ---
  const totalHours = 168;
  const weeklySleep = (prefs.sleepHours || 8) * 7;
  const weeklyWork = prefs.workHours || 40;
  const weeklyCommute = ((prefs.commuteTime || 0) * 2 * 5) / 60;
  
  const committedTime = weeklySleep + weeklyWork + weeklyCommute;
  const freeTime = Math.round(totalHours - committedTime);
  const freeTimePerDay = (freeTime / 7).toFixed(1);

  return (
    <div className="page-container">
      
      {/* HEADER WITH NAME & EMAIL */}
      <div className="profile-header">
        <div className="avatar-placeholder">
          {user.email.charAt(0).toUpperCase()}
        </div>
        <div className="profile-info">
          <h2>My Profile</h2>
          <p>{user.email}</p>
          <span style={{ fontSize: '0.8rem', color: '#999' }}>ID: {user.uid}</span>
        </div>
        <div style={{ marginLeft: 'auto' }}>
            <button className="logout-btn" onClick={handleLogout}>Log Out</button>
        </div>
      </div>

      <div className="profile-grid">
        
        {/* COLUMN 1: LIFESTYLE STATS */}
        <div className="profile-card">
          <h3>⚡ Lifestyle Settings</h3>
          
          <div className="stat-row">
            <span className="stat-label">Location</span>
            <span className="stat-val">{prefs.location || "Not set"}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Commute (one-way)</span>
            <span className="stat-val">{prefs.commuteTime} min</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Work Hours / week</span>
            <span className="stat-val">{prefs.workHours}h</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Sleep / night</span>
            <span className="stat-val">{prefs.sleepHours}h</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Flexibility Score</span>
            <span className="stat-val">{prefs.flexibility}/10</span>
          </div>

          <div className="free-time-box">
            <span>Potential Free Time</span>
            <h1>{freeTime}h</h1>
            <small>per week (~{freeTimePerDay}h / day)</small>
          </div>
        </div>

        {/* COLUMN 2: HOBBIES & INFO & ADMIN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="profile-card">
              <h3>Your Interests</h3>
              {prefs.hobbies && prefs.hobbies.length > 0 ? (
                <div className="hobby-list">
                  {prefs.hobbies.map((h, i) => (
                    <div key={i} className="hobby-tag">
                      <strong>{h.name}</strong> 
                      <span style={{opacity: 0.7, fontSize: '0.8em', marginLeft: '5px'}}>
                        ({h.frequency}x/wk, {h.duration}h)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#999', fontStyle: 'italic' }}>No hobbies added yet.</p>
              )}
            </div>

            <div className="profile-card">
                <h3>⚙️ Account Details</h3>
                <div className="stat-row">
                    <span className="stat-label">Timezone</span>
                    <span className="stat-val">{user.timezone}</span>
                </div>
                <div className="stat-row">
                    <span className="stat-label">Member Since</span>
                    <span className="stat-val">{new Date(user.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
            </div>

            {/* --- ADMIN BUTTON (ONLY FOR ADMINS) --- */}
            {userRole === 'admin' && (
              <div className="profile-card" style={{ borderTop: '4px solid #ff9800', background: '#fff3e0' }}>
                <h3 style={{ color: '#e65100', marginTop: 0 }}>👮‍♂️ Admin Zone</h3>
                <p style={{ fontSize: '0.9rem', marginBottom: '15px' }}>
                    You have administrative access to the system data.
                </p>
                <button 
                    onClick={() => navigate('/admin')}
                    style={{
                        backgroundColor: '#ff9800',
                        color: 'white',
                        border: 'none',
                        padding: '12px 20px',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        width: '100%',
                        fontSize: '1rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                >
                    Go to Admin Dashboard →
                </button>
              </div>
            )}
            {/* --- END ADMIN BUTTON --- */}

        </div>

      </div>
    </div>
  );
}

export default ProfilePage;