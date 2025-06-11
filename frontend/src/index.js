import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

// Импорт компонентов
import Login from "./components/Login";
// Используем главный Dashboard компонент вместо DashboardView
import NotesApp from "./components/Dashboard"; // Это основной компонент приложения

// Главный компонент приложения
const App = () => {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState(null);

  // Sprawdź czy użytkownik jest zalogowany przy starcie
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    console.log('🔍 Sprawdzanie autoryzacji przy starcie...');
    console.log('Token:', token ? 'EXISTS' : 'MISSING');
    console.log('User data:', userData ? 'EXISTS' : 'MISSING');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsLoggedIn(true);
        console.log('✅ Użytkownik zalogowany:', parsedUser.username);
      } catch (error) {
        console.error('❌ Błąd parsowania danych użytkownika:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else {
      console.log('ℹ️ Użytkownik nie zalogowany');
    }
    setLoading(false);
  }, []);

  // Obsługa logowania
  const handleLoginSuccess = (userData) => {
    console.log('✅ Logowanie zakończone sukcesem:', userData);
    setUser(userData);
    setIsLoggedIn(true);
  };

  // Obsługa wylogowania
  const handleLogout = () => {
    console.log('🚪 Wylogowywanie użytkownika...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Ładowanie aplikacji...</p>
          <p className="text-gray-400 text-sm mt-2">Sprawdzanie autoryzacji</p>
        </div>
      </div>
    );
  }

  // Login screen
  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Main app - używamy główny NotesApp komponent
  return (
    <NotesApp 
      user={user} 
      onLogout={handleLogout} 
    />
  );
};

// Render the app
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);