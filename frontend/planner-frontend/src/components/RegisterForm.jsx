import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api/auth';

function RegisterForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    timezone: 'Europe/Brussels',
    workHours: 40,
    sleepHours: 8,
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const value = e.target.name.includes('Hours') ? Number(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Registering...');

    try {
      const result = await registerUser(formData);
      localStorage.setItem('userToken', result.token);
      localStorage.setItem('userUID', result.uid);
      
      setMessage('Registration successful!');
      navigate('/planner');
      window.location.reload();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: 'auto' }}>
      <h2>Register</h2>
      <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required style={{ display: 'block', width: '100%', marginBottom: '10px' }} />
      <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" required style={{ display: 'block', width: '100%', marginBottom: '10px' }} />
      
      <h3>Preferences</h3>
      <label style={{ display: 'block', marginBottom: '10px' }}>
        Work hours/week:
        <input type="number" name="workHours" value={formData.workHours} onChange={handleChange} min="0" required />
      </label>
      <label style={{ display: 'block', marginBottom: '10px' }}>
        Sleep hours/day:
        <input type="number" name="sleepHours" value={formData.sleepHours} onChange={handleChange} min="0" max="24" required />
      </label>
      
      <button type="submit" style={{ padding: '10px 20px' }}>Register & Start</button>
      <p>{message}</p>
    </form>
  );
}

export default RegisterForm;
