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
      setMessage("❌ Błąd połączenia z serwerem");
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #eff6ff 0%, #faf5ff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '1rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        padding: '2rem',
        width: '100%',
        maxWidth: '28rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.25rem', marginBottom: '1rem' }}>📝</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
            Notatnik Online
          </h1>
          <p style={{ color: '#6b7280' }}>Zaloguj się do swojego konta</p>
        </div>
        
        <form onSubmit={handleLogin} style={{ marginBottom: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
              Hasło
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password123"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              type="submit" 
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: loading ? '#9ca3af' : '#2563eb',
                color: 'white',
                fontWeight: '500',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.target.style.backgroundColor = '#1d4ed8';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.target.style.backgroundColor = '#2563eb';
              }}
            >
              {loading ? "⏳ Logowanie..." : "🔑 Zaloguj"}
            </button>
            
            <button 
              type="button" 
              onClick={handleRegister} 
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: loading ? '#9ca3af' : '#16a34a',
                color: 'white',
                fontWeight: '500',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s'
              }}
              onMouseEnter={(e) => {
                if (!loading) e.target.style.backgroundColor = '#15803d';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.target.style.backgroundColor = '#16a34a';
              }}
            >
              📝 Rejestruj
            </button>
          </div>
        </form>
        
        {message && (
          <div style={{
            padding: '0.75rem',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            textAlign: 'center',
            marginBottom: '1rem'
          }}>
            {message}
          </div>
        )}
        
        <div style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
          <p>Testowe dane:</p>
          <p>Email: test@example.com</p>
          <p>Hasło: password123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;