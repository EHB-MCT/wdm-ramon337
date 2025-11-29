import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../api/auth';
import { logEvent } from '../api/logging';

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    workHours: 40,
    sleepHours: 8,
    location: '',
    commuteTime: 0,
    flexibility: 5,
    hobbies: [] 
  });

  const [hobbyInput, setHobbyInput] = useState('');

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const val = type === 'number' || type === 'range' ? Number(value) : value;
    setFormData({ ...formData, [name]: val });
  };

  const nextStep = () => {
    if (step === 1 && (!formData.email || !formData.password)) {
      setError("Please fill in all fields");
      return;
    }
    setError('');
    logEvent('ONBOARDING_STEP_COMPLETE', { step: step });
    setStep(step + 1);
  };

  const addHobby = (e) => {
    e.preventDefault();
    if (hobbyInput.trim()) {
      setFormData({
        ...formData,
        hobbies: [...formData.hobbies, { name: hobbyInput, frequency: 'Weekly' }]
      });
      setHobbyInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const result = await registerUser(formData);
      
      localStorage.setItem('userToken', result.token);
      localStorage.setItem('userUID', result.uid);
      
      logEvent('ONBOARDING_COMPLETE', { uid: result.uid });

      navigate('/planner');
      window.location.reload(); 
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2>Setup Profile - Step {step} / 3</h2>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {step === 1 && (
        <div>
          <h3>Login Details</h3>
          <input 
            type="email" name="email" placeholder="Email" 
            value={formData.email} onChange={handleChange} 
            style={{ display: 'block', width: '100%', marginBottom: '10px' }}
          />
          <input 
            type="password" name="password" placeholder="Password" 
            value={formData.password} onChange={handleChange} 
            style={{ display: 'block', width: '100%', marginBottom: '10px' }}
          />
          <button onClick={nextStep} style={{ width: '100%' }}>Next: Lifestyle</button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3>Your Routine</h3>
          <label style={{display:'block', marginBottom: '10px'}}>
            Home Location (City):
            <input type="text" name="location" value={formData.location} onChange={handleChange} style={{marginLeft: '10px'}}/>
          </label>
          <label style={{display:'block', marginBottom: '10px'}}>
             Commute time (mins/day):
            <input type="number" name="commuteTime" value={formData.commuteTime} onChange={handleChange} style={{marginLeft: '10px', width: '60px'}}/>
          </label>
          <div style={{display:'flex', gap: '20px', marginBottom: '10px'}}>
             <label>Work hours/week: <input type="number" name="workHours" value={formData.workHours} onChange={handleChange} style={{width: '50px'}}/></label>
             <label>Sleep hours/day: <input type="number" name="sleepHours" value={formData.sleepHours} onChange={handleChange} style={{width: '50px'}}/></label>
          </div>
          <label style={{display:'block', marginBottom: '10px'}}>
             Flexibility (1=Rigid, 10=Flow): {formData.flexibility}
             <br/>
            <input type="range" name="flexibility" min="1" max="10" value={formData.flexibility} onChange={handleChange} style={{width: '100%'}}/>
          </label>
          <button onClick={nextStep} style={{ width: '100%' }}>Next: Hobbies</button>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3>What do you like?</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input 
                type="text" 
                placeholder="Add a hobby (e.g. Tennis)" 
                value={hobbyInput} 
                onChange={(e) => setHobbyInput(e.target.value)}
                style={{ flex: 1 }}
            />
            <button onClick={addHobby} style={{ background: '#ddd' }}>Add</button>
          </div>

          <ul style={{ marginBottom: '20px', background: '#f9f9f9', padding: '10px' }}>
            {formData.hobbies.map((h, index) => (
                <li key={index}>{h.name} ({h.frequency})</li>
            ))}
            {formData.hobbies.length === 0 && <span style={{color:'#999'}}>No hobbies added yet.</span>}
          </ul>

          <button onClick={handleSubmit} style={{ width: '100%', background: '#28a745', color: 'white', fontWeight: 'bold' }}>
            Complete Registration
          </button>
        </div>
      )}
    </div>
  );
}

export default Onboarding;