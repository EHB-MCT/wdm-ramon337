import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchUserProfile } from '../api/auth';

function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
        // Eventueel uitloggen bij error
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userUID');
    navigate('/');
    window.location.reload();
  };

  if (loading) return <div className="page-container">Loading profile...</div>;
  if (!user) return <div className="page-container">User not found.</div>;

  const prefs = user.initialPreferences || {};

  // --- BEREKENING: VRIJE TIJD ---
  // 1 week = 168 uur
  // Werk = workHours
  // Slaap = sleepHours * 7
  // Commute = (commuteTime * 2 * 5) / 60 (heen en terug, 5 dagen)
  const totalHours = 168;
  const weeklySleep = (prefs.sleepHours || 8) * 7;
  const weeklyWork = prefs.workHours || 40;
  const weeklyCommute = ((prefs.commuteTime || 0) * 2 * 5) / 60;
  
  const committedTime = weeklySleep + weeklyWork + weeklyCommute;
  const freeTime = Math.round(totalHours - committedTime);
  const freeTimePerDay = (freeTime / 7).toFixed(1);

  return (
    <div className="page-container">
      
      {/* HEADER MET NAAM & EMAIL */}
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
        
        {/* KOLOM 1: LIFESTYLE STATS */}
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

        

      </div>
    </div>
  );
}

export default ProfilePage;