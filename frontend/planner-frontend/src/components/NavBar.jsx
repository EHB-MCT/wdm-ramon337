import React from "react";
import { NavLink } from "react-router-dom";

function Navbar({ isLoggedIn, onLogout }) {
  const navStyle = {
    padding: "15px",
    background: "#333",
    color: "white",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  };

  const linkStyle = {
    color: "white",
    textDecoration: "none",
    marginRight: "15px",
    fontWeight: "bold",
  };

  const activeStyle = {
    textDecoration: "underline",
    color: "#4caf50",
  };

  const getLinkClass = ({ isActive }) => (isActive ? { ...linkStyle, ...activeStyle } : linkStyle);

  return (
    <nav style={navStyle}>
      <div className="nav-left">
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
          </>
        )}
      </div>

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
