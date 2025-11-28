import React, { useState } from "react";
import { registerUser } from "../api/auth"; // Import API-service

function RegisterForm({ onAuthSuccess }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    timezone: "Europe/Brussels",
    workHours: 40,
    sleepHours: 8,
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const value = e.target.name.includes("Hours") ? Number(e.target.value) : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("registering...");

    try {
      const result = await registerUser(formData);

      localStorage.setItem("userToken", result.token);
      localStorage.setItem("userUID", result.uid);

      setMessage(`Registration successful! UID: ${result.uid}. Token saved.`);

      onAuthSuccess();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "400px", margin: "auto" }}>
      <h2>Register your Profile</h2>

      {/* 1. user info */}
      <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" required />
      <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="password" required />

      {/* 2. Initial preferences for planning */}
      <h3>your ideal week (Start Data)</h3>
      <label>
        Ideal working hours/week:
        <input type="number" name="workHours" value={formData.workHours} onChange={handleChange} min="0" required />
      </label>
      <label>
        Ideal sleep time/day:
        <input type="number" name="sleepHours" value={formData.sleepHours} onChange={handleChange} min="0" max="24" required />
      </label>
      <button type="submit">Register & Generate plan</button>
      <p style={{ marginTop: "10px" }}>{message}</p>
    </form>
  );
}

export default RegisterForm;
