import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/auth'; // Import the centralized API helper

/**
 * LoginForm Component
 * Handles user authentication.
 * Stores the JWT token, UID, and Role in LocalStorage upon success.
 */
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Use the API helper function instead of raw fetch
      const data = await loginUser({ email, password });

      // --- SESSION STORAGE ---
      // We store the critical auth data in LocalStorage so it persists on refresh.
      localStorage.setItem('userToken', data.token);
      localStorage.setItem('userUID', data.uid);
      localStorage.setItem('userRole', data.role); // Vital for RBAC (Admin/User check)

      // Navigate to the planner
      navigate('/planner');

      // ⚠️ FORCE REFRESH
      // We trigger a page reload to ensure the Navbar and other components 
      // re-check LocalStorage and update their UI state (e.g., showing "Logout").
      window.location.reload(); 

    } catch (err) {
      // Display the error message from the backend (or a default one)
      setError(err.message);
    }
  };

  // Simple inline styles are acceptable for this assignment's scope
  return (
    <form onSubmit={handleSubmit} style={{maxWidth: '300px', margin: '0 auto', display:'flex', flexDirection:'column', gap:'10px'}}>
      {error && <div style={{color: 'red', textAlign: 'center'}}>{error}</div>}
      
      <input 
        type="email" 
        placeholder="Email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        required 
        style={{padding: '8px'}}
      />
      <input 
        type="password" 
        placeholder="Password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
        required 
        style={{padding: '8px'}}
      />
      <button type="submit" style={{cursor:'pointer', padding:'10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px'}}>
        Login
      </button>
    </form>
  );
}

export default LoginForm;