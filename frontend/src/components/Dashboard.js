import React, { useState, useEffect } from 'react';
import DashboardView from './DashboardView';
import NotesList from './NotesList';
import NoteEditor from './NoteEditor';
import SearchView from './SearchView';
import ShareNotesView from './ShareNotesView';
import ShareModal from './ShareModal';
import ExportModal from './ExportModal';

const NotesApp = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedNote, setSelectedNote] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notification, setNotification] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [noteToShare, setNoteToShare] = useState(null);

  // Funkcja pokazywania powiadomień
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
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

  // Otwórz modal udostępniania
  const handleShareNote = (note) => {
    setNoteToShare(note);
    setShareModalOpen(true);
  };

  // Sukces udostępniania
  const handleShareSuccess = (message, type = 'success') => {
    showNotification(message, type);
    setShareModalOpen(false);
    setNoteToShare(null);
  };

  // Otwórz modal eksportu
  const handleExport = () => {
    setExportModalOpen(true);
  };

  // Sukces eksportu
  const handleExportSuccess = (message, type = 'success') => {
    showNotification(message, type);
    setExportModalOpen(false);
  };

  // Menu items
  const menuItems = [
    { 
      id: 'dashboard', 
      icon: '🏠', 
      label: 'Dashboard', 
      desc: 'Przegląd główny',
      active: currentView === 'dashboard'
    },
    { 
      id: 'notes', 
      icon: '📝', 
      label: 'Notatki', 
      desc: 'Wszystkie notatki',
      active: currentView === 'notes' || currentView === 'list'
    },
    { 
      id: 'editor', 
      icon: '✏️', 
      label: 'Nowa Notatka', 
      desc: 'Utwórz nową',
      active: currentView === 'editor'
    },
    { 
      id: 'search', 
      icon: '🔍', 
      label: 'Wyszukaj', 
      desc: 'Znajdź notatki',
      active: currentView === 'search'
    },
    { 
      id: 'shared', 
      icon: '👥', 
      label: 'Udostępnione', 
      desc: 'Współdzielone',
      active: currentView === 'shared'
    },
    { 
      id: 'export', 
      icon: '📤', 
      label: 'Eksport', 
      desc: 'Pobierz notatki',
      active: currentView === 'export'
    },
    { 
      id: 'settings', 
      icon: '⚙️', 
      label: 'Ustawienia', 
      desc: 'Konfiguracja',
      active: currentView === 'settings'
    }
  ];

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
            onShareNote={handleShareNote}
          />
        );
      
      case 'editor':
        return (
          <NoteEditor 
            note={selectedNote}
            onSave={handleNoteSave}
            onCancel={handleEditorCancel}
            onShare={handleShareNote}
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
          <ShareNotesView 
            onViewChange={handleViewChange}
          />
        );
      
      case 'export':
        setExportModalOpen(true);
        setCurrentView('dashboard');
        return (
          <DashboardView 
            onViewChange={handleViewChange}
            onSelectNote={handleSelectNote}
            onCreateNote={handleCreateNote}
          />
        );
      
      case 'settings':
        return (
          <SettingsView 
            user={user}
            onViewChange={handleViewChange}
            onLogout={onLogout}
            onExport={handleExport}
          />
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Powiadomienia */}
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

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 min-h-[73px]">
            {sidebarOpen && (
              <div className="flex items-center">
                <div className="text-3xl">📝</div>
                <div className="ml-3">
                  <h1 className="text-lg font-bold text-gray-900">Notatnik</h1>
                  <p className="text-xs text-gray-500">Online v1.0</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              {sidebarOpen ? '◀️' : '▶️'}
            </button>
          </div>

          {/* User Info */}
          {sidebarOpen && (
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{user?.username || 'User'}</p>
                  <p className="text-xs text-gray-500">{user?.email || 'email@example.com'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleViewChange(item.id)}
                className={`w-full flex items-center px-3 py-3 rounded-xl text-left transition-all duration-200 ${
                  item.active
                    ? 'bg-blue-50 text-blue-700 shadow-lg border-l-4 border-blue-500'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && (
                  <div className="ml-3">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                )}
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={onLogout}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors ${
                sidebarOpen ? 'justify-start' : 'justify-center'
              }`}
            >
              <span className="text-lg">🚪</span>
              {sidebarOpen && <span className="ml-3 text-sm font-medium">Wyloguj się</span>}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Top Bar */}
          <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-gray-900 truncate">
                  {currentView === 'dashboard' && '🏠 Dashboard'}
                  {(currentView === 'notes' || currentView === 'list') && '📝 Moje Notatki'}
                  {currentView === 'editor' && '✏️ Edytor Notatek'}
                  {currentView === 'search' && '🔍 Wyszukiwanie'}
                  {currentView === 'shared' && '👥 Udostępnione'}
                  {currentView === 'settings' && '⚙️ Ustawienia'}
                </h2>
                <p className="text-sm text-gray-500 mt-1 truncate">
                  {currentView === 'dashboard' && 'Przegląd aktywności i szybki dostęp do funkcji'}
                  {(currentView === 'notes' || currentView === 'list') && 'Zarządzaj swoimi notatkami'}
                  {currentView === 'editor' && 'Twórz i edytuj swoje notatki z obsługą Markdown'}
                  {currentView === 'search' && 'Przeszukuj wszystkie swoje notatki błyskawicznie'}
                  {currentView === 'shared' && 'Notatki udostępnione przez innych użytkowników'}
                  {currentView === 'settings' && 'Dostosuj aplikację do swoich preferencji'}
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                <div className="text-sm text-gray-500 hidden lg:block">
                  {new Date().toLocaleDateString('pl-PL', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                {currentView !== 'editor' && (
                  <button
                    onClick={handleCreateNote}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-5 py-2 rounded-xl font-medium shadow-lg transition"
                  >
                    ➕ <span className="ml-1 hidden sm:inline">Nowa Notatka</span>
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-full">
              {renderMainContent()}
            </div>
          </main>

          {/* Status Bar */}
          <footer className="bg-white border-t border-gray-200 px-6 py-2 flex-shrink-0">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span>🔗 Backend: API połączony</span>
                <span>⚛️ Frontend: React App</span>
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                  Online
                </span>
              </div>
              <div>
                📅 {new Date().toLocaleDateString('pl-PL', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Modal udostępniania */}
      {shareModalOpen && noteToShare && (
        <ShareModal
          note={noteToShare}
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          onSuccess={handleShareSuccess}
        />
      )}

      {/* Modal eksportu */}
      {exportModalOpen && (
        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          onSuccess={handleExportSuccess}
        />
      )}
    </div>
  );
};

// Komponent ustawień
const SettingsView = ({ user, onViewChange, onLogout, onExport }) => (
  <div className="bg-white rounded-lg p-8">
    <h2 className="text-xl font-semibold mb-6">⚙️ Ustawienia</h2>
    
    <div className="space-y-6">
      {/* Informacje o koncie */}
      <div className="border-b pb-4">
        <h3 className="font-medium mb-3">👤 Informacje o koncie</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Nazwa użytkownika:</span>
              <p className="font-medium">{user?.username}</p>
            </div>
            <div>
              <span className="text-gray-500">Email:</span>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <span className="text-gray-500">ID użytkownika:</span>
              <p className="font-medium">{user?.id}</p>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <p className="font-medium text-green-600">Aktywny</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Funkcje */}
      <div className="border-b pb-4">
        <h3 className="font-medium mb-3">🛠️ Funkcje</h3>
        <div className="space-y-3">
          <button
            onClick={onExport}
            className="w-full md:w-auto bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center"
          >
            <span className="mr-2">📤</span>
            Eksportuj wszystkie notatki
          </button>
          
          <button
            onClick={() => onViewChange('shared')}
            className="w-full md:w-auto bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center ml-0 md:ml-3"
          >
            <span className="mr-2">👥</span>
            Zarządzaj udostępnianiem
          </button>
        </div>
      </div>
      
      {/* Informacje o aplikacji */}
      <div className="border-b pb-4">
        <h3 className="font-medium mb-3">📱 Informacje o aplikacji</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <div className="flex justify-between">
            <span>Wersja:</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Autor:</span>
            <span className="font-medium">Illia Yakovunyk</span>
          </div>
          <div className="flex justify-between">
            <span>Technologie:</span>
            <span className="font-medium">React + Node.js + SQLite</span>
          </div>
          <div className="flex justify-between">
            <span>Ostatnia aktualizacja:</span>
            <span className="font-medium">Czerwiec 2025</span>
          </div>
        </div>
      </div>
      
      {/* Akcje */}
      <div>
        <h3 className="font-medium mb-3">🚨 Akcje konta</h3>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-red-700 mb-3">
            Wylogowanie zakończy bieżącą sesję. Będziesz musiał ponownie się zalogować.
          </p>
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors flex items-center"
          >
            <span className="mr-2">🚪</span>
            Wyloguj się
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default NotesApp;