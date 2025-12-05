import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser, checkEmailExists } from '../api/auth';
import { logEvent } from '../api/logging';

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // FORM DATA - Bevat alle velden die we naar de backend sturen
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

  // TIJDELIJKE STATE VOOR NIEUWE HOBBY
  const [newHobby, setNewHobby] = useState({ name: '', frequency: 1, duration: 1 });

  // ALGEMENE CHANGE HANDLER
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    // Zet nummers om van string naar number
    const val = type === 'number' || type === 'range' ? Number(value) : value;
    setFormData({ ...formData, [name]: val });
  };

  // --- NAVIGATIE LOGICA ---

  const nextStep = async () => {
    setError('');
    
    // Validatie Stap 1 + Email Check
    if (step === 1) {
        if (!formData.email || !formData.password) {
            setError("Vul alle velden in.");
            return;
        }
        
        // Backend check: bestaat email al?
        setLoading(true);
        try {
            const exists = await checkEmailExists(formData.email);
            setLoading(false);
            
            if (exists) {
                setError("Dit e-mailadres is al in gebruik. Log in plaats daarvan in.");
                return;
            }
        } catch (err) {
            setLoading(false);
            setError("Kon email niet controleren. Probeer later opnieuw.");
            return;
        }
    }

    logEvent('ONBOARDING_STEP_COMPLETE', { step: step });
    setStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  // --- HOBBY LOGICA ---

  const handleHobbyChange = (e) => {
      const { name, value } = e.target;
      // 'name' is tekst, de rest zijn getallen
      setNewHobby({ 
          ...newHobby, 
          [name]: name === 'name' ? value : Number(value) 
      });
  };

  const addHobby = (e) => {
    e.preventDefault();
    if (newHobby.name.trim()) {
      setFormData({
        ...formData,
        hobbies: [...formData.hobbies, { ...newHobby }]
      });
      // Reset naar standaardwaarden
      setNewHobby({ name: '', frequency: 1, duration: 1 });
    }
  };

  const removeHobby = (index) => {
      const updated = formData.hobbies.filter((_, i) => i !== index);
      setFormData({ ...formData, hobbies: updated });
  };

  // --- SUBMIT ---

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await registerUser(formData);
      
      localStorage.setItem('userToken', result.token);
      localStorage.setItem('userUID', result.uid);
      
      logEvent('ONBOARDING_COMPLETE', { uid: result.uid });

      // Navigeer naar de planner en herlaad om in te loggen
      navigate('/planner');
      window.location.reload(); 
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="wizard-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Profiel Setup</h2>
          <span style={{ color: '#888' }}>Stap {step} / 3</span>
      </div>
      
      {error && <div style={{ background: '#ffebee', color: '#c62828', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{error}</div>}

      {/* --- STAP 1: ACCOUNT --- */}
      {step === 1 && (
        <div>
          <h3>Login Gegevens</h3>
          <label>Email</label>
          <input 
            type="email" name="email" 
            value={formData.email} onChange={handleChange} 
          />
          <label>Wachtwoord</label>
          <input 
            type="password" name="password" 
            value={formData.password} onChange={handleChange} 
          />
          <button className="btn-primary" onClick={nextStep} disabled={loading}>
              {loading ? 'Checken...' : 'Volgende'}
          </button>
        </div>
      )}

      {/* --- STAP 2: LEVENSSTIJL --- */}
      {step === 2 && (
        <div>
          <h3>Jouw Ritme</h3>
          
          <label>Woon-werkverkeer (minuten enkele rit):</label>
          <input 
            type="number" name="commuteTime" 
            value={formData.commuteTime} onChange={handleChange} 
            style={{ width: '80px' }}
          />

          <div style={{ display: 'flex', gap: '15px' }}>
             <div style={{ flex: 1 }}>
                <label>Werkuren / week</label>
                <input 
                    type="number" name="workHours" 
                    value={formData.workHours} onChange={handleChange} 
                />
             </div>
             <div style={{ flex: 1 }}>
                <label>Slaapuren / nacht</label>
                <input 
                    type="number" name="sleepHours" 
                    value={formData.sleepHours} onChange={handleChange} 
                />
             </div>
          </div>

          <label>
             Flexibiliteit: {formData.flexibility}/10
             <span style={{ display: 'block', fontSize: '0.8rem', color: '#666', fontWeight: 'normal', marginTop: '5px' }}>
                 1 = Ik wil vaste tijdstippen (structuur). <br/>
                 10 = Ik beslis last-minute (spontaan).
             </span>
          </label>
          <input 
            type="range" name="flexibility" min="1" max="10" 
            value={formData.flexibility} onChange={handleChange} 
          />

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button className="btn-secondary" onClick={prevStep}>Terug</button>
            <button className="btn-primary" onClick={nextStep}>Volgende</button>
          </div>
        </div>
      )}

      {/* --- STAP 3: HOBBIES --- */}
      {step === 3 && (
        <div>
          <h3>Hobby's & Vrije Tijd</h3>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
              Voeg je activiteiten toe zodat we ze kunnen inplannen.
          </p>

          <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <label>Naam activiteit</label>
            <input 
                type="text" name="name" placeholder="bv. Tennis, Gamen..." 
                value={newHobby.name} onChange={handleHobbyChange} 
                style={{ marginBottom: '10px' }}
            />
            
            <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                    <label>Keer per week</label>
                    <input type="number" name="frequency" min="1" value={newHobby.frequency} onChange={handleHobbyChange} />
                </div>
                <div style={{ flex: 1 }}>
                    <label>Uur per keer</label>
                    <input type="number" name="duration" min="0.5" step="0.5" value={newHobby.duration} onChange={handleHobbyChange} />
                </div>
            </div>
            
            <button className="btn-secondary" onClick={addHobby} style={{ width: '100%', marginTop: '10px' }}>+ Voeg toe</button>
          </div>

          {/* LIJST MET TOEGEVOEGDE HOBBIES */}
          {formData.hobbies.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '20px' }}>
                {formData.hobbies.map((h, index) => (
                    <li key={index} style={{ 
                        background: 'white', border: '1px solid #eee', padding: '8px', 
                        marginBottom: '5px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <span><strong>{h.name}</strong> ({h.frequency}x/week, {h.duration}u)</span>
                        <button onClick={() => removeHobby(index)} style={{ background: 'transparent', color: 'red', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                    </li>
                ))}
              </ul>
          ) : (
              <p style={{ color: '#999', fontStyle: 'italic', marginBottom: '20px' }}>Nog geen hobby's toegevoegd.</p>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button className="btn-secondary" onClick={prevStep}>Terug</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Bezig...' : 'Afronden & Starten'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Onboarding;