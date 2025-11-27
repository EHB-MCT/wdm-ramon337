import React, { useState, useEffect } from 'react';
import RegisterForm from './components/RegisterForm';
import PlannerApp from './components/PlannerApp';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // checks if token exists
    const token = localStorage.getItem('userToken');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleAuthSuccess = () => {
    setIsLoggedIn(true);
  };
  
  return (
    <div className="App">
      <h1>Weapon of Math Destruction Planner</h1>
      
      {/* Condition Rendering */}
      {isLoggedIn ? (
        <PlannerApp />
      ) : (
        // Gives the RegisterForm a callback to update the App-state.
        <RegisterForm onAuthSuccess={handleAuthSuccess} /> 
      )}
    </div>
  );
}
// 🚨 Pas de RegisterForm aan om de onAuthSuccess prop te accepteren en aan te roepen!
// Dit is een kleine aanpassing in RegisterForm.jsx

export default App;