import React, { useState, useEffect } from 'react';
import NotesList from './NotesList';
import NoteEditor from './NoteEditor';

const Dashboard = () => {
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'editor'
  const [selectedNote, setSelectedNote] = useState(null);
  const [user, setUser] = useState(null);

  // Pobierz dane użytkownika z localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Błąd parsowania danych użytkownika:', error);
      }
    }
  }, []);

  // Funkcje nawigacji
  const showNotesList = () => {
    setCurrentView('list');
    setSelectedNote(null);
  };

  const showNoteEditor = (note = null) => {
    setSelectedNote(note);
    setCurrentView('editor');
  };

  const handleNoteSave = (savedNote) => {
    console.log('Notatka zapisana:', savedNote);
    // Wróć do listy po zapisaniu
    setCurrentView('list');
    setSelectedNote(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload(); // Odśwież stronę
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo i tytuł */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                📝 Notatnik Online
              </h1>
              {currentView === 'editor' && (
                <button
                  onClick={showNotesList}
                  className="ml-4 text-blue-600 hover:text-blue-800"
                >
                  ← Powrót do listy
                </button>
              )}
            </div>

            {/* User info i nawigacja */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                👋 Witaj, {user?.username || 'Użytkownik'}!
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
              >
                🚪 Wyloguj
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {currentView === 'list' ? (
          <NotesList
            onSelectNote={showNoteEditor}
            onCreateNote={() => showNoteEditor(null)}
          />
        ) : (
          <div className="h-[calc(100vh-12rem)]">
            <NoteEditor
              note={selectedNote}
              onSave={handleNoteSave}
              onCancel={showNotesList}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div>
              🚀 Notatnik Online v1.0 - System zarządzania notatkami
            </div>
            <div className="flex space-x-4">
              <span>🔗 Backend: localhost:5000</span>
              <span>⚛️ Frontend: localhost:3000</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;