import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser, checkEmailExists } from "../api/auth";
import { logEvent } from "../api/logging";

/**
 * Onboarding Component (Wizard Form)
 * Guides new users through 3 steps to set up their profile.
 * - Step 1: Account (Email/Password)
 * - Step 2: Metrics (Work/Sleep/Commute) -> Inputs for the Algorithm
 * - Step 3: Hobbies -> Data for the Scheduler
 */
function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Main User State
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    workHours: 40,
    sleepHours: 8,
    location: "", // General location (e.g., City)
    commuteTime: 0,
    flexibility: 5,
    hobbies: [],
  });

  // Temporary state for the hobby currently being added
  const [newHobby, setNewHobby] = useState({ 
    name: "", 
    frequency: 1, 
    duration: 1, 
    location: "" 
  });

  // Handle generic input changes
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    // Auto-convert numbers to actual Number type
    const val = type === "number" || type === "range" ? Number(value) : value;
    setFormData({ ...formData, [name]: val });
  };

  /**
   * Validates current step and moves to the next.
   * Includes server-side email check on Step 1.
   */
  const nextStep = async () => {
    setError("");

    // --- STEP 1 VALIDATION ---
    if (step === 1) {
      if (!formData.email || !formData.password) {
        setError("Please fill in all fields.");
        return;
      }

      setLoading(true);
      try {
        // Check if user already exists before moving to step 2
        const exists = await checkEmailExists(formData.email);
        setLoading(false);

        if (exists) {
          setError("Email is already registered. Please login instead.");
          return;
        }
      } catch (err) {
        setLoading(false);
        setError("Could not verify email. Please try again.");
        return;
      }
    }

    // Log progress for analytics (Abandonment rate tracking)
    logEvent("ONBOARDING_STEP_COMPLETE", { step: step });
    setStep(step + 1);
  };

  const prevStep = () => {
    setError("");
    setStep(step - 1);
  };

  // Handle Hobby Input
  const handleHobbyChange = (e) => {
    const { name, value } = e.target;
    setNewHobby({
      ...newHobby,
      [name]: (name === "name" || name === "location") ? value : Number(value),
    });
  };

  // Add Hobby to the list
  const addHobby = (e) => {
    e.preventDefault();
    if (newHobby.name.trim()) {
      setFormData({
        ...formData,
        hobbies: [...formData.hobbies, { ...newHobby }],
      });
      // Reset hobby inputs
      setNewHobby({ name: "", frequency: 1, duration: 1, location: "" });
    }
  };

  const removeHobby = (index) => {
    const updated = formData.hobbies.filter((_, i) => i !== index);
    setFormData({ ...formData, hobbies: updated });
  };

  // Final Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await registerUser(formData);

      // Store Auth Data
      localStorage.setItem("userToken", result.token);
      localStorage.setItem("userUID", result.uid);
      localStorage.setItem("userRole", result.role);

      logEvent("ONBOARDING_COMPLETE", { uid: result.uid });

      navigate("/planner");
      window.location.reload(); // Refresh to update Navbar state
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="wizard-container">
      {/* Header with Progress */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>Profile Setup</h2>
        <span style={{ color: "#888" }}>Step {step} / 3</span>
      </div>

      {error && <div style={{ background: "#ffebee", color: "#c62828", padding: "10px", borderRadius: "4px", marginBottom: "15px" }}>{error}</div>}

      {/* --- STEP 1: ACCOUNT --- */}
      {step === 1 && (
        <div className="form-group">
          <h3>Login Details</h3>
          <label>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} autoFocus />
          
          <label>Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} />
          
          <button className="btn-primary" onClick={nextStep} disabled={loading} style={{marginTop: '20px', width: '100%'}}>
            {loading ? "Checking..." : "Next"}
          </button>
        </div>
      )}

      {/* --- STEP 2: METRICS (ALGORITHM INPUTS) --- */}
      {step === 2 && (
        <div className="form-group">
          <h3>Your Rhythm</h3>
          <p style={{fontSize: '0.9rem', color: '#666'}}>Help our algorithm optimize your schedule.</p>

          <label>Home Location (City)</label>
          <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g., Brussels" />

          <label>Commute Time (mins one way):</label>
          <input type="number" name="commuteTime" value={formData.commuteTime} onChange={handleChange} />

          <div style={{ display: "flex", gap: "15px" }}>
            <div style={{ flex: 1 }}>
              <label>Work Hours / week</label>
              <input type="number" name="workHours" value={formData.workHours} onChange={handleChange} />
            </div>
            <div style={{ flex: 1 }}>
              <label>Sleep Hours / night</label>
              <input type="number" name="sleepHours" value={formData.sleepHours} onChange={handleChange} />
            </div>
          </div>

          <label style={{marginTop: '15px'}}>
            Flexibility Preference: {formData.flexibility}/10
            <span style={{ display: "block", fontSize: "0.8rem", color: "#666", fontWeight: "normal", marginTop: "5px" }}>
              1 = Strict Structure <br />
              10 = Spontaneous / Last-minute
            </span>
          </label>
          <input type="range" name="flexibility" min="1" max="10" value={formData.flexibility} onChange={handleChange} style={{width: '100%'}} />

          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button className="btn-secondary" onClick={prevStep}>Back</button>
            <button className="btn-primary" onClick={nextStep} style={{flex: 1}}>Next</button>
          </div>
        </div>
      )}

      {/* --- STEP 3: HOBBIES --- */}
      {step === 3 && (
        <div className="form-group">
          <h3>Hobbies & Free Time</h3>
          <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "15px" }}>Add activities so we can auto-schedule them.</p>

          {/* Add Hobby Form */}
          <div style={{ background: "#f9f9f9", padding: "15px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #eee" }}>
            <label>Activity Name</label>
            <input type="text" name="name" placeholder="e.g. Tennis, Gaming..." value={newHobby.name} onChange={handleHobbyChange} style={{ marginBottom: "10px", width: "100%" }} />
            
            <input
              type="text"
              name="location"
              placeholder="Specific Location (Gym, Club...)"
              value={newHobby.location || ""}
              onChange={handleHobbyChange}
              style={{ width: "100%", marginBottom: "10px" }}
            />

            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <label>Times/week</label>
                <input type="number" name="frequency" min="1" value={newHobby.frequency} onChange={handleHobbyChange} />
              </div>
              <div style={{ flex: 1 }}>
                <label>Duration (hrs)</label>
                <input type="number" name="duration" min="0.5" step="0.5" value={newHobby.duration} onChange={handleHobbyChange} />
              </div>
            </div>

            <button className="btn-secondary" onClick={addHobby} style={{ width: "100%", marginTop: "10px" }}>
              + Add Activity
            </button>
          </div>

          {/* List of Added Hobbies */}
          {formData.hobbies.length > 0 ? (
            <ul style={{ listStyle: "none", padding: 0, marginBottom: "20px" }}>
              {formData.hobbies.map((h, index) => (
                <li key={index} style={{ background: "white", border: "1px solid #ddd", padding: "10px", marginBottom: "8px", borderRadius: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong>{h.name}</strong> <span style={{fontSize: '0.9em', color: '#555'}}>({h.frequency}x/week, {h.duration}h)</span>
                    {h.location && <div style={{fontSize: "0.8em", color: "#666"}}>📍 {h.location}</div>}
                  </div>
                  <button onClick={() => removeHobby(index)} style={{ background: "transparent", color: "red", border: "none", cursor: "pointer", fontSize: "1.2rem" }}>
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "#999", fontStyle: "italic", marginBottom: "20px", textAlign: "center" }}>No activities added yet.</p>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button className="btn-secondary" onClick={prevStep}>Back</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{flex: 1}}>
              {loading ? "Creating Profile..." : "Finish & Start"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Onboarding;