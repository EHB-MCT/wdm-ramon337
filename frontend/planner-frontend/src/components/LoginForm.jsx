import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // --- HIER SLAAN WE ALLES OP ---
      localStorage.setItem('userToken', data.token);
      localStorage.setItem('userUID', data.uid);
      
      // 👇 DEZE REGEL IS CRUCIAAL VOOR DE KNOP!
      localStorage.setItem('userRole', data.role); 

      // Navigeer naar de planner
      navigate('/planner');
      window.location.reload(); // Zorgt dat de Navbar update

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{maxWidth: '300px', margin: '0 auto', display:'flex', flexDirection:'column', gap:'10px'}}>
      {error && <div style={{color: 'red'}}>{error}</div>}
      
      <input 
        type="email" 
        placeholder="Email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        required 
      />
      <input 
        type="password" 
        placeholder="Password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
        required 
      />
      <button type="submit" style={{cursor:'pointer', padding:'10px'}}>Login</button>
    </form>
  );
}

export default LoginForm;