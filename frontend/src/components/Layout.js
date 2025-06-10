import React, { useState, useEffect } from 'react';

const Layout = ({ children, currentView, onViewChange, user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({ total_notes: 0, notes_today: 0, notes_this_week: 0 });
  const [loading, setLoading] = useState(true);

  // Pobierz statystyki użytkownika
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/notes/stats/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Błąd pobierania statystyk:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [currentView]); // Odśwież stats przy zmianie widoku

  const menuItems = [
    {
      id: 'dashboard',
      label: '🏠 Dashboard',
      description: 'Przegląd główny',
      active: currentView === 'dashboard'
    },
    {
      id: 'notes',
      label: '📝 Moje Notatki',
      description: `${stats.total_notes} notatek`,
      active: currentView === 'notes' || currentView === 'list'
    },
    {
      id: 'editor',
      label: '✏️ Nowa Notatka',
      description: 'Utwórz nową',
      active: currentView === 'editor'
    },
    {
      id: 'search',
      label: '🔍 Wyszukaj',
      description: 'Znajdź notatki',
      active: currentView === 'search'
    },
    {
      id: 'shared',
      label: '👥 Udostępnione',
      description: 'Współdzielone',
      active: currentView === 'shared'
    }
  ];

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {sidebarOpen && (
            <div className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">📝</div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">Notatnik</h1>
                <p className="text-xs text-gray-500">Online v1.0</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
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
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                item.active
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{item.label.split(' ')[0]}</span>
              {sidebarOpen && (
                <div className="ml-3">
                  <div className="text-sm font-medium">{item.label.substring(2)}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* Stats */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Statystyki
            </h3>
            {loading ? (
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Wszystkich:</span>
                  <span className="font-medium">{stats.total_notes}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Dzisiaj:</span>
                  <span className="font-medium text-green-600">{stats.notes_today}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">W tym tyg.:</span>
                  <span className="font-medium text-blue-600">{stats.notes_this_week}</span>
                </div>
              </div>
            )}
          </div>
        )}

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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {currentView === 'dashboard' && '🏠 Dashboard'}
                {(currentView === 'notes' || currentView === 'list') && '📝 Moje Notatki'}
                {currentView === 'editor' && '✏️ Edytor Notatek'}
                {currentView === 'search' && '🔍 Wyszukiwanie'}
                {currentView === 'shared' && '👥 Udostępnione'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {currentView === 'dashboard' && 'Przegląd aktywności i szybki dostęp'}
                {(currentView === 'notes' || currentView === 'list') && `Zarządzaj swoimi ${stats.total_notes} notatkami`}
                {currentView === 'editor' && 'Twórz i edytuj swoje notatki'}
                {currentView === 'search' && 'Przeszukuj wszystkie swoje notatki'}
                {currentView === 'shared' && 'Notatki udostępnione przez innych'}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => fetchStats()}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Odśwież"
              >
                🔄
              </button>
              {currentView !== 'editor' && (
                <button
                  onClick={() => onViewChange('editor')}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                >
                  ➕ Nowa Notatka
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>

        {/* Status Bar */}
        <footer className="bg-white border-t border-gray-200 px-6 py-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-4">
              <span>🔗 Backend: localhost:5000</span>
              <span>⚛️ Frontend: localhost:3000</span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                Połączono
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
  );
};

export default Layout;