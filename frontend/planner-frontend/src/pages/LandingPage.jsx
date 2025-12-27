import React from 'react';
import { Link } from 'react-router-dom';

/**
 * LandingPage
 * Simple entry page with options to login or register.
 */
function LandingPage() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Weapon of Math Destruction Planner</h1>
      <p style={{ fontSize: '1.2rem', color: '#555' }}>
        Plan your week, optimize your time, and let us analyze your habits.
      </p>
      
      <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
        <Link to="/login" style={{ 
          padding: '10px 20px', 
          background: '#007bff', 
          color: 'white', 
          textDecoration: 'none', 
          borderRadius: '5px' 
        }}>
          Login
        </Link>
        <Link to="/register" style={{ 
          padding: '10px 20px', 
          background: '#28a745', 
          color: 'white', 
          textDecoration: 'none', 
          borderRadius: '5px' 
        }}>
          Register
        </Link>
      </div>
    </div>
  );
}

export default LandingPage;