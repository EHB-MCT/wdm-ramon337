import React, { useState, useEffect } from "react";
import RegisterForm from "./components/RegisterForm";
import PlannerApp from "./components/PlannerApp";
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("userToken");
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

      {isLoggedIn ? <PlannerApp /> : <RegisterForm onAuthSuccess={handleAuthSuccess} />}
    </div>
  );
}

export default App;
