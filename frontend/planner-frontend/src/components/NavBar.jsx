import React from "react";
import { NavLink } from "react-router-dom";

/**
 * Navbar Component
 * Displays the navigation links based on authentication state.
 * * @param {boolean} isLoggedIn - Determines if user-specific links (Profile, Planner) are shown.
 * @param {function} onLogout - Function to handle the logout process (clear storage & redirect).
 */
function Navbar({ isLoggedIn, onLogout }) {
  // Retrieve role directly from storage to determine if Admin link should be shown
  const userRole = localStorage.getItem("userRole");

  // --- STYLES ---
  const navStyle = {
    padding: "15px",
    background: "#333", // Dark theme header
    color: "white",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between", // Pushes left and right sections apart
  };

  const linkStyle = {
    color: "white",
    textDecoration: "none",
    marginRight: "15px",
    fontWeight: "bold",
    fontSize: "1rem",
  };

  const activeStyle = {
    textDecoration: "underline",
    color: "#4caf50", // Green highlight for active page
  };

  // Helper function for React Router v6 NavLink styling
  const getLinkClass = ({ isActive }) => (isActive ? { ...linkStyle, ...activeStyle } : linkStyle);

  return (
    <nav style={navStyle}>
      {/* LEFT SECTION: Logo & Main Navigation */}
      <div className="nav-left" style={{ display: 'flex', alignItems: 'center' }}>
        <NavLink to="/" style={getLinkClass}>
          Weapon of Math Destruction
        </NavLink>

        {isLoggedIn && (
          <>
            <span style={{ margin: "0 10px", color: "#666" }}>|</span>
            
            <NavLink to="/planner" style={getLinkClass}>
              My Planner
            </NavLink>
            
            <NavLink to="/profile" style={getLinkClass}>
              Profile
            </NavLink>

            {/* RBAC: Only show Admin link if user has 'admin' role */}
            {userRole === 'admin' && (
              <NavLink to="/admin" style={{ ...linkStyle, color: "#ffcc80" }}>
                Admin Dashboard
              </NavLink>
            )}
          </>
        )}
      </div>

      {/* RIGHT SECTION: Auth Actions (Login/Register/Logout) */}
      <div className="nav-right">
        {!isLoggedIn ? (
          <>
            <NavLink to="/login" style={getLinkClass}>
              Login
            </NavLink>
            <NavLink
              to="/register"
              style={{
                ...linkStyle,
                background: "#4caf50",
                padding: "8px 15px",
                borderRadius: "5px",
              }}
            >
              Register
            </NavLink>
          </>
        ) : (
          <button
            onClick={onLogout}
            style={{
              background: "#e53935",
              color: "white",
              border: "none",
              padding: "8px 15px",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;