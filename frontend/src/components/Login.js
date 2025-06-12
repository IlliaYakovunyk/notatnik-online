import React, { useState } from "react";

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Walidacja po stronie klienta
    if (!email || !password) {
      setMessage("❌ Email i hasło są wymagane");
      setLoading(false);
      return;
    }

    if (isRegisterMode && !username) {
      setMessage("❌ Nazwa użytkownika jest wymagana");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setMessage("❌ Hasło musi mieć co najmniej 6 znaków");
      setLoading(false);
      return;
    }

    const endpoint = isRegisterMode ? "/api/auth/register" : "/api/auth/login";
    const body = isRegisterMode 
      ? { username, email, password }
      : { email, password };
    
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      
      const data = await response.json();
      
      if (data.success) {
        if (isRegisterMode) {
          setMessage("✅ Rejestracja zakończona sukcesem! Logowanie...");
          // Po rejestracji automatycznie zaloguj
          setTimeout(() => {
            setIsRegisterMode(false);
            setMessage("Teraz możesz się zalogować");
          }, 2000);
        } else {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          setMessage("✅ Zalogowano pomyślnie!");
          setTimeout(() => onLoginSuccess(data.user), 1000);
        }
      } else {
        setMessage("❌ " + data.message);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setMessage("❌ Błąd połączenia z serwerem");
    } finally {
      setLoading(false);
    }
  };

  const fillTestData = () => {
    setEmail("test@example.com");
    setPassword("password123");
    setUsername("TestUser");
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '1rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '28rem',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
          <h1 style={{ 
            fontSize: '1.875rem', 
            fontWeight: 'bold', 
            color: '#1f2937', 
            marginBottom: '0.5rem' 
          }}>
            Notatnik Online
          </h1>
          <p style={{ color: '#6b7280' }}>
            {isRegisterMode ? 'Utwórz nowe konto' : 'Zaloguj się do swojego konta'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
          {/* Username field - tylko dla rejestracji */}
          {isRegisterMode && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.875rem', 
                fontWeight: '500', 
                color: '#374151', 
                marginBottom: '0.5rem' 
              }}>
                👤 Nazwa użytkownika
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Wprowadź nazwę użytkownika"
                required={isRegisterMode}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  transition: 'border-color 0.15s ease-in-out',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>
          )}
          
          {/* Email field */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '0.5rem' 
            }}>
              📧 Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="twoj@email.com"
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '0.5rem',
                transition: 'border-color 0.15s ease-in-out',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>
          
          {/* Password field */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '0.875rem', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '0.5rem' 
            }}>
              🔒 Hasło
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Wprowadź hasło (min. 6 znaków)"
                required
                minLength="6"
                style={{
                  width: '100%',
                  padding: '0.75rem 3rem 0.75rem 1rem',
                  fontSize: '1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  transition: 'border-color 0.15s ease-in-out',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  padding: '0.25rem'
                }}
                title={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          
          {/* Submit button */}
          <button 
            type="submit" 
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? '#9ca3af' : (isRegisterMode ? '#059669' : '#2563eb'),
              color: 'white',
              fontWeight: '600',
              fontSize: '1rem',
              padding: '0.875rem 1rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease-in-out',
              marginBottom: '1rem'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = isRegisterMode ? '#047857' : '#1d4ed8';
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = isRegisterMode ? '#059669' : '#2563eb';
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  width: '1rem',
                  height: '1rem',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '0.5rem'
                }}></div>
                {isRegisterMode ? "Rejestrowanie..." : "Logowanie..."}
              </div>
            ) : (
              <>
                {isRegisterMode ? "📝 Utwórz konto" : "🔑 Zaloguj się"}
              </>
            )}
          </button>
        </form>
        
        {/* Switch mode */}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            {isRegisterMode ? 'Masz już konto?' : 'Nie masz konta?'}
          </p>
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setMessage('');
              setEmail('');
              setPassword('');
              setUsername('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              fontWeight: '500',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '0.875rem'
            }}
          >
            {isRegisterMode ? '🔑 Zaloguj się' : '📝 Zarejestruj się'}
          </button>
        </div>
        
        {/* Test data button */}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={fillTestData}
            style={{
              background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
              border: '1px solid #d1d5db',
              color: '#374151',
              fontSize: '0.75rem',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f9fafb';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f3f4f6';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            🧪 Wypełnij danymi testowymi
          </button>
        </div>
        
        {/* Message */}
        {message && (
          <div style={{
            padding: '0.875rem',
            backgroundColor: message.includes('❌') ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${message.includes('❌') ? '#fecaca' : '#bbf7d0'}`,
            borderRadius: '0.5rem',
            textAlign: 'center',
            marginBottom: '1rem',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            {message}
          </div>
        )}
        
        {/* Test credentials info */}
        <div style={{ 
          textAlign: 'center', 
          fontSize: '0.75rem', 
          color: '#9ca3af',
          backgroundColor: '#f9fafb',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ marginBottom: '0.5rem', fontWeight: '600' }}>💡 Dane testowe:</p>
          <p>📧 Email: test@example.com</p>
          <p>🔒 Hasło: password123</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.625rem' }}>
            Lub utwórz nowe konto za pomocą przycisku rejestracji
          </p>
        </div>

        {/* CSS Animation */}
        <style>
          {`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default Login;