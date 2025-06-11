import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Layout from './components/Layout';
import DashboardView from './components/DashboardView';
import NotesList from './components/NotesList';
import NoteEditor from './components/NoteEditor';
import SearchView from './components/SearchView';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedNote, setSelectedNote] = useState(null);
  const [notification, setNotification] = useState(null);

  // Sprawdź czy użytkownik jest zalogowany przy starcie
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Błąd parsowania danych użytkownika:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // Pokaż powiadomienie
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Obsługa logowania
  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsLoggedIn(true);
    showNotification(`Witaj, ${userData.username}! 🎉`);
  };

  // Obsługa wylogowania
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setCurrentView('dashboard');
    setSelectedNote(null);
    showNotification('Zostałeś wylogowany', 'info');
  };

  // Zmiana widoku
  const handleViewChange = (view, note = null) => {
    setCurrentView(view);
    if (note) {
      setSelectedNote(note);
      setCurrentView('editor');
    } else if (view !== 'editor') {
      setSelectedNote(null);
    }
  };

  // Wybór notatki do edycji
  const handleSelectNote = (note) => {
    setSelectedNote(note);
    setCurrentView('editor');
  };

  // Utworzenie nowej notatki
  const handleCreateNote = () => {
    setSelectedNote(null);
    setCurrentView('editor');
  };

  // Zapisanie notatki
  const handleNoteSave = (savedNote) => {
    showNotification(
      selectedNote ? 'Notatka zaktualizowana! ✅' : 'Nowa notatka utworzona! 🎉'
    );
    setCurrentView('dashboard');
    setSelectedNote(null);
  };

  // Anulowanie edycji
  const handleEditorCancel = () => {
    setCurrentView('dashboard');
    setSelectedNote(null);
  };

  // Renderowanie głównej treści
  const renderMainContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <DashboardView 
            onViewChange={handleViewChange}
            onSelectNote={handleSelectNote}
            onCreateNote={handleCreateNote}
          />
        );
      
      case 'notes':
      case 'list':
        return (
          <NotesList 
            onSelectNote={handleSelectNote}
            onCreateNote={handleCreateNote}
          />
        );
      
      case 'editor':
        return (
          <NoteEditor 
            note={selectedNote}
            onSave={handleNoteSave}
            onCancel={handleEditorCancel}
          />
        );
      
      case 'search':
        return (
          <SearchView 
            onSelectNote={handleSelectNote}
          />
        );
      
      case 'shared':
        return (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-xl font-semibold mb-2">Udostępnione notatki</h2>
            <p className="text-gray-500">Funkcja współdzielenia będzie dostępna w następnej wersji</p>
          </div>
        );
      
      case 'settings':
        return (
          <div className="bg-white rounded-lg p-8">
            <h2 className="text-xl font-semibold mb-4">⚙️ Ustawienia</h2>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-medium mb-2">Informacje o aplikacji</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Wersja: 1.0.0</p>
                  <p>Autor: Node.js Developer Course</p>
                  <p>Technologie: React + Node.js + SQLite</p>
                </div>
              </div>
              
              <div className="border-b pb-4">
                <h3 className="font-medium mb-2">Konto użytkownika</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Nazwa: {user?.username}</p>
                  <p>Email: {user?.email}</p>
                  <p>ID: {user?.id}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Akcje</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleViewChange('export')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                  >
                    📤 Eksportuj notatki
                  </button>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors ml-2"
                  >
                    🚪 Wyloguj się
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'export':
        return (
          <ExportView onBack={() => handleViewChange('settings')} />
        );
      
      default:
        return (
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">🤔</div>
            <h2 className="text-xl font-semibold mb-2">Nieznany widok</h2>
            <p className="text-gray-500 mb-4">Wystąpił błąd w nawigacji</p>
            <button
              onClick={() => handleViewChange('dashboard')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
            >
              🏠 Powrót do Dashboard
            </button>
          </div>
        );
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Ładowanie aplikacji...</p>
        </div>
      </div>
    );
  }

  // Login screen
  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Main app
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-100 border-green-400 text-green-800' :
          notification.type === 'error' ? 'bg-red-100 border-red-400 text-red-800' :
          'bg-blue-100 border-blue-400 text-blue-800'
        } border`}>
          <div className="flex items-center">
            <span className="text-lg mr-2">
              {notification.type === 'success' ? '✅' :
               notification.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span className="font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-lg hover:opacity-70 transition-opacity"
            >
              ✖️
            </button>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <Layout
        currentView={currentView}
        onViewChange={handleViewChange}
        user={user}
        onLogout={handleLogout}
      >
        {renderMainContent()}
      </Layout>
    </div>
  );
};

// Export View Component
const ExportView = ({ onBack }) => {
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);

  const handleExport = async (format) => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/notes/export/${format}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notatki_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        setExportResult({ success: true, message: `Notatki wyeksportowane do pliku ${format.toUpperCase()}` });
      } else {
        setExportResult({ success: false, message: 'Błąd eksportu notatek' });
      }
    } catch (error) {
      console.error('Błąd eksportu:', error);
      setExportResult({ success: false, message: 'Błąd połączenia z serwerem' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">📤 Eksport notatek</h2>
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Powrót
        </button>
      </div>

      <div className="space-y-4">
        <p className="text-gray-600">
          Wybierz format w jakim chcesz wyeksportować swoje notatki:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => handleExport('json')}
            disabled={exporting}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white p-4 rounded-lg transition-colors flex items-center justify-center"
          >
            <span className="text-2xl mr-2">📄</span>
            <div className="text-left">
              <div className="font-medium">JSON</div>
              <div className="text-sm opacity-90">Format strukturalny</div>
            </div>
          </button>

          <button
            onClick={() => handleExport('txt')}
            disabled={exporting}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white p-4 rounded-lg transition-colors flex items-center justify-center"
          >
            <span className="text-2xl mr-2">📝</span>
            <div className="text-left">
              <div className="font-medium">TXT</div>
              <div className="text-sm opacity-90">Prosty tekst</div>
            </div>
          </button>
        </div>

        {exporting && (
          <div className="text-center py-4">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-gray-600">Eksportowanie notatek...</p>
          </div>
        )}

        {exportResult && (
          <div className={`p-4 rounded-lg ${
            exportResult.success 
              ? 'bg-green-100 border-green-400 text-green-800' 
              : 'bg-red-100 border-red-400 text-red-800'
          } border`}>
            <div className="flex items-center">
              <span className="text-lg mr-2">
                {exportResult.success ? '✅' : '❌'}
              </span>
              <span>{exportResult.message}</span>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">ℹ️ Informacje o eksporcie</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>JSON:</strong> Zawiera wszystkie dane notatek w formacie JSON</li>
            <li>• <strong>TXT:</strong> Prosty tekst z tytułami i treścią notatek</li>
            <li>• Eksportowane są wszystkie Twoje notatki</li>
            <li>• Pliki zawierają datę eksportu w nazwie</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default App;