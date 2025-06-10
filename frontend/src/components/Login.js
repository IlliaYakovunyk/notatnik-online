import React, { useState } from "react";

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setMessage("✅ Zalogowano pomyślnie!");
        setTimeout(() => onLoginSuccess(data.user), 1000);
      } else {
        setMessage("❌ " + data.message);
      }
    } catch (error) {
      setMessage("❌ Błąd połączenia");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: "testuser", 
          email: email || "test@example.com", 
          password: password || "password123" 
        })
      });
      const data = await response.json();
      setMessage(data.success ? "✅ Zarejestrowano!" : "❌ " + data.message);
    } catch (error) {
      setMessage("❌ Błąd rejestracji");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "50px auto", border: "1px solid #ddd" }}>
      <h2>🔐 Notatnik Online - Logowanie</h2>
      
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: "10px" }}>
          <input
            type="email"
            placeholder="Email (test@example.com)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "8px", border: "1px solid #ccc" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <input
            type="password" 
            placeholder="Hasło (password123)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "8px", border: "1px solid #ccc" }}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ width: "48%", padding: "10px", backgroundColor: "#007bff", color: "white", border: "none", marginRight: "4%" }}
        >
          {loading ? "⏳" : "Zaloguj"}
        </button>
        
        <button 
          type="button" 
          onClick={handleRegister} 
          disabled={loading}
          style={{ width: "48%", padding: "10px", backgroundColor: "#28a745", color: "white", border: "none" }}
        >
          Rejestruj Test
        </button>
      </form>
      
      {message && <div style={{ marginTop: "10px", padding: "10px", backgroundColor: "#f8f9fa", border: "1px solid #dee2e6" }}>{message}</div>}
    </div>
  );
};

export default Login;