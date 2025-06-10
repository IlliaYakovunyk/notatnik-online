import React, { useState, useEffect } from 'react';

const DashboardView = ({ onViewChange }) => {
  const [recentNotes, setRecentNotes] = useState([]);
  const [stats, setStats] = useState({ total_notes: 0, notes_today: 0, notes_this_week: 0 });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Pobierz dane użytkownika
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

  // Pobierz ostatnie notatki i statystyki
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Pobierz ostatnie notatki
      const notesResponse = await fetch('/api/notes', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (notesResponse.ok) {
        const notesData = await notesResponse.json();
        if (notesData.success) {
          // Weź tylko 5 najnowszych notatek
          setRecentNotes(notesData.notes.slice(0, 5));
        }
      }

      // Pobierz statystyki
      const statsResponse = await fetch('/api/notes/stats/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.stats);
        }
      }
    } catch (error) {
      console.error('Błąd pobierania danych dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Formatuj datę
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'dzisiaj';
    if (diffDays === 2) return 'wczoraj';
    if (diffDays <= 7) return `${diffDays} dni temu`;
    
    return date.toLocaleDateString('pl-PL');
  };

  // Powitanie w zależności od pory dnia
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Dzień dobry';
    if (hour < 18) return '☀️ Miłego dnia';
    return '🌙 Dobry wieczór';
  };

  const quickActions = [
    {
      icon: '📝',
      title: 'Nowa Notatka',
      description: 'Utwórz nową notatkę',
      action: () => onViewChange('editor'),
      color: 'bg-blue-500'
    },
    {
      icon: '📋',
      title: 'Wszystkie Notatki',
      description: `Przeglądaj ${stats.total_notes} notatek`,
      action: () => onViewChange('notes'),
      color: 'bg-green-500'
    },
    {
      icon: '🔍',
      title: 'Wyszukaj',
      description: 'Znajdź swoje notatki',
      action: () => onViewChange('search'),
      color: 'bg-purple-500'
    },
    {
      icon: '👥',
      title: 'Udostępnione',
      description: 'Współdzielone notatki',
      action: () => onViewChange('shared'),
      color: 'bg-orange-500'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Powitanie */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          {getGreeting()}, {user?.username || 'Użytkownik'}! 👋
        </h1>
        <p className="text-blue-100">
          Masz {stats.total_notes} notatek, w tym {stats.notes_today} utworzonych dzisiaj.
        </p>
      </div>

      {/* Statystyki */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <span className="text-2xl">📝</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Wszystkie notatki</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_notes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <span className="text-2xl">🌟</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Dzisiaj</p>
              <p className="text-2xl font-bold text-green-600">{stats.notes_today}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <span className="text-2xl">📅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">W tym tygodniu</p>
              <p className="text-2xl font-bold text-purple-600">{stats.notes_this_week}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Szybkie akcje */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🚀 Szybkie akcje</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow text-left group"
            >
              <div className={`inline-flex p-3 rounded-lg ${action.color} text-white mb-4 group-hover:scale-110 transition-transform`}>
                <span className="text-xl">{action.icon}</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">{action.title}</h3>
              <p className="text-sm text-gray-500">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Ostatnie notatki */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">📋 Ostatnie notatki</h2>
          {recentNotes.length > 0 && (
            <button
              onClick={() => onViewChange('notes')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Zobacz wszystkie →
            </button>
          )}
        </div>

        {recentNotes.length === 0 ? (
          <div className="bg-white rounded-lg p-8 border border-gray-200 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Brak notatek</h3>
            <p className="text-gray-500 mb-4">Rozpocznij od utworzenia swojej pierwszej notatki</p>
            <button
              onClick={() => onViewChange('editor')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Utwórz pierwszą notatkę
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200">
            {recentNotes.map((note, index) => (
              <div
                key={note.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  index !== recentNotes.length - 1 ? 'border-b border-gray-100' : ''
                }`}
                onClick={() => onViewChange('notes')}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{note.title}</h4>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {note.content 
                        ? (note.content.length > 100 
                            ? note.content.substring(0, 100) + '...' 
                            : note.content
                          )
                        : 'Pusta notatka'
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      Aktualizowana {formatDate(note.updated_at)}
                    </p>
                  </div>
                  <div className="ml-4 text-gray-400">
                    ▶️
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardView;