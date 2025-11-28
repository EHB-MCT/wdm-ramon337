import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('userToken');

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userUID');
    navigate('/login');
    window.location.reload();
  };

  const navStyle = {
    padding: '15px',
    background: '#f4f4f4',
    marginBottom: '20px',
    display: 'flex',
    gap: '20px',
    alignItems: 'center'
  };

  return (
    <nav style={navStyle}>
      <NavLink to="/" style={{ fontWeight: 'bold', textDecoration: 'none' }}>Home</NavLink>
      
      {isLoggedIn && (
        <>
          <NavLink to="/planner" style={{ textDecoration: 'none' }}>Planner</NavLink>
          <NavLink to="/profile" style={{ textDecoration: 'none' }}>Profile</NavLink>
        </>
      )}

      <div style={{ marginLeft: 'auto', display: 'flex', gap: '15px' }}>
        {!isLoggedIn ? (
          <>
            <NavLink to="/login" style={{ textDecoration: 'none' }}>Login</NavLink>
            <NavLink to="/register" style={{ textDecoration: 'none' }}>Register</NavLink>
          </>
        ) : (
          <button onClick={handleLogout} style={{ background: 'red', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;