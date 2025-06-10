import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sprawdź czy użytkownik jest już zalogowany
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsLoggedIn(true);
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  if (loading) {
    return <div style={{ padding: "20px", textAlign: "center" }}>⏳ Ładowanie...</div>;
  }

  return isLoggedIn ? <Dashboard /> : <Login onLoginSuccess={handleLoginSuccess} />;
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);