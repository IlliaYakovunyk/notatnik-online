import React, { useState, useEffect } from 'react';

// Mock data for demonstration
const mockNotes = [
  {
    id: 1,
    title: "Lista zakupów",
    content: "- Mleko\n- Chleb\n- Jajka\n- Masło\n- Jabłka",
    created_at: "2025-06-10T10:00:00Z",
    updated_at: "2025-06-11T08:30:00Z",
    category: "personal",
    priority: "medium"
  },
  {
    id: 2,
    title: "Pomysły na projekt",
    content: "1. Aplikacja do zarządzania zadaniami\n2. Blog o technologii\n3. E-commerce dla lokalnych sklepów",
    created_at: "2025-06-09T15:30:00Z",
    updated_at: "2025-06-11T09:15:00Z",
    category: "work",
    priority: "high"
  },
  {
    id: 3,
    title: "Przepis na pierogi",
    content: "Składniki:\n- Mąka 500g\n- Woda 250ml\n- Sól 1 łyżeczka\n\nFarsz:\n- Ziemniaki 1kg\n- Twaróg 200g\n- Cebula 1 sztuka",
    created_at: "2025-06-08T12:00:00Z",
    updated_at: "2025-06-10T18:45:00Z",
    category: "personal",
    priority: "low"
  }
];

const mockUser = {
  username: "TestUser",
  email: "test@example.com",
  avatar: "👤"
};

const NotesApp = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedNote, setSelectedNote] = useState(null);
  const [notes, setNotes] = useState(mockNotes);
  const [user, setUser] = useState(mockUser);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredNotes, setFilteredNotes] = useState(mockNotes);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Filter notes based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredNotes(notes);
    } else {
      const filtered = notes.filter(note => 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredNotes(filtered);
    }
  }, [searchTerm, notes]);

  // Show notification
  const showAlert = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // Format date
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

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Dzień dobry';
    if (hour < 18) return '☀️ Miłego dnia';
    return '🌙 Dobry wieczór';
  };

  // Save note
  const saveNote = () => {
    if (!newNoteTitle.trim()) {
      showAlert('❌ Wprowadź tytuł notatki');
      return;
    }

    if (selectedNote) {
      // Update existing note
      const updatedNotes = notes.map(note => 
        note.id === selectedNote.id 
          ? { ...note, title: newNoteTitle, content: newNoteContent, updated_at: new Date().toISOString() }
          : note
      );
      setNotes(updatedNotes);
      showAlert('✅ Notatka zaktualizowana!');
    } else {
      // Create new note
      const newNote = {
        id: Math.max(...notes.map(n => n.id)) + 1,
        title: newNoteTitle,
        content: newNoteContent,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: 'personal',
        priority: 'medium'
      };
      setNotes([newNote, ...notes]);
      showAlert('✅ Nowa notatka utworzona!');
    }

    setNewNoteTitle('');
    setNewNoteContent('');
    setSelectedNote(null);
    setCurrentView('dashboard');
  };

  // Delete note
  const deleteNote = (noteId) => {
    if (window.confirm('Czy na pewno chcesz usunąć tę notatkę?')) {
      setNotes(notes.filter(note => note.id !== noteId));
      showAlert('🗑️ Notatka usunięta!');
    }
  };

  // Edit note
  const editNote = (note) => {
    setSelectedNote(note);
    setNewNoteTitle(note.title);
    setNewNoteContent(note.content);
    setCurrentView('editor');
  };

  // Menu items
  const menuItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard', desc: 'Przegląd główny' },
    { id: 'notes', icon: '📝', label: 'Notatki', desc: `${notes.length} notatek` },
    { id: 'editor', icon: '✏️', label: 'Nowa Notatka', desc: 'Utwórz nową' },
    { id: 'search', icon: '🔍', label: 'Wyszukaj', desc: 'Znajdź notatki' },
    { id: 'settings', icon: '⚙️', label: 'Ustawienia', desc: 'Konfiguracja' }
  ];

  // Dashboard View
  const renderDashboard = () => {
    const stats = {
      total: notes.length,
      today: notes.filter(note => {
        const today = new Date().toDateString();
        const noteDate = new Date(note.created_at).toDateString();
        return today === noteDate;
      }).length,
      thisWeek: notes.filter(note => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(note.created_at) > weekAgo;
      }).length,
      characters: notes.reduce((total, note) => total + (note.content?.length || 0), 0)
    };

    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className={`${darkMode ? 'bg-gradient-to-r from-purple-900 to-blue-900' : 'bg-gradient-to-r from-blue-500 to-purple-600'} rounded-2xl p-8 text-white shadow-2xl`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {getGreeting()}, {user.username}! 👋
              </h1>
              <p className="text-blue-100 text-lg">
                Masz {stats.total} notatek w swojej kolekcji. Czas na twórczość! ✨
              </p>
            </div>
            <div className="text-6xl opacity-20">📚</div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: '📝', label: 'Wszystkich notatek', value: stats.total, color: 'blue', gradient: 'from-blue-400 to-blue-600' },
            { icon: '🌟', label: 'Utworzonych dzisiaj', value: stats.today, color: 'green', gradient: 'from-green-400 to-green-600' },
            { icon: '📅', label: 'W tym tygodniu', value: stats.thisWeek, color: 'purple', gradient: 'from-purple-400 to-purple-600' },
            { icon: '🔤', label: 'Znaków łącznie', value: stats.characters, color: 'orange', gradient: 'from-orange-400 to-orange-600' }
          ].map((stat, index) => (
            <div 
              key={index} 
              className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border shadow-lg transition-smooth hover-lift group`}
              style={{ transition: 'all 0.3s ease' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-3xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-1`}>
                    {stat.value.toLocaleString()}
                  </div>
                  <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {stat.label}
                  </div>
                </div>
                <div 
                  className="text-4xl opacity-60 transition-smooth"
                  style={{ transition: 'transform 0.3s ease' }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6 flex items-center`}>
            🚀 <span className="ml-2">Szybkie akcje</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '📝', title: 'Nowa Notatka', desc: 'Utwórz nową notatkę', action: () => setCurrentView('editor'), color: 'blue' },
              { icon: '🔍', title: 'Wyszukaj', desc: 'Znajdź swoje notatki', action: () => setCurrentView('search'), color: 'green' },
              { icon: '📊', title: 'Statystyki', desc: 'Zobacz szczegóły', action: () => showAlert('📊 Funkcja statystyk będzie dostępna wkrótce!'), color: 'purple' },
              { icon: '📤', title: 'Eksportuj', desc: 'Pobierz notatki', action: () => showAlert('📤 Funkcja eksportu będzie dostępna wkrótce!'), color: 'orange' }
            ].map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={`${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-50'} border rounded-xl p-6 text-left transition-smooth hover-lift group`}
                style={{ transition: 'all 0.3s ease' }}
              >
                <div 
                  className="text-3xl mb-3 transition-smooth"
                  style={{ transition: 'transform 0.3s ease' }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  {action.icon}
                </div>
                <div className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                  {action.title}
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {action.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Notes */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border shadow-lg`}>
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
                📋 <span className="ml-2">Ostatnie notatki</span>
              </h2>
              <button
                onClick={() => setCurrentView('notes')}
                className="text-blue-500 hover:text-blue-600 font-medium transition-colors"
              >
                Zobacz wszystkie →
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {notes.slice(0, 5).map((note, index) => (
              <div key={note.id} className={`${index !== 0 ? 'border-t border-gray-100 pt-4' : ''} ${index !== 4 ? 'pb-4' : ''} group`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 cursor-pointer" onClick={() => editNote(note)}>
                    <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2 group-hover:text-blue-600 transition-colors`}>
                      {note.title}
                    </h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2 line-clamp-2`}>
                      {note.content?.substring(0, 100)}...
                    </p>
                    <div className={`flex items-center text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'} space-x-4`}>
                      <span>📅 {formatDate(note.updated_at)}</span>
                      <span>🔤 {note.content?.length || 0} znaków</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => editNote(note)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edytuj"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Usuń"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Notes List View
  const renderNotesList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          📝 Wszystkie notatki ({notes.length})
        </h2>
        <button
          onClick={() => setCurrentView('editor')}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center"
        >
          ➕ Nowa notatka
        </button>
      </div>

      <div className="grid gap-6">
        {notes.map(note => (
          <div 
            key={note.id} 
            className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6 transition-smooth hover-lift group`}
            style={{ transition: 'all 0.3s ease' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 cursor-pointer" onClick={() => editNote(note)}>
                <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3 group-hover:text-blue-600 transition-smooth`}>
                  {note.title}
                </h3>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}
                   style={{ 
                     display: '-webkit-box',
                     WebkitLineClamp: 3,
                     WebkitBoxOrient: 'vertical',
                     overflow: 'hidden'
                   }}
                >
                  {note.content?.substring(0, 200)}...
                </p>
                <div className={`flex items-center text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'} space-x-6`}>
                  <span>📅 {formatDate(note.updated_at)}</span>
                  <span>🔤 {note.content?.length || 0} znaków</span>
                  <span>⏱️ ~{Math.ceil((note.content?.split(' ').length || 0) / 200)} min czytania</span>
                </div>
              </div>
              <div 
                className="flex space-x-2 ml-6 opacity-0 group-hover:opacity-100"
                style={{ transition: 'opacity 0.3s ease' }}
              >
                <button
                  onClick={() => editNote(note)}
                  className="p-3 text-blue-500 hover:bg-blue-50 rounded-xl transition-smooth"
                  title="Edytuj"
                >
                  ✏️
                </button>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-smooth"
                  title="Usuń"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Editor View
  const renderEditor = () => (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg h-full flex flex-col`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {selectedNote ? '✏️ Edytuj notatkę' : '📝 Nowa notatka'}
          </h2>
          <div className="flex space-x-3">
            <button
              onClick={saveNote}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center"
            >
              💾 Zapisz
            </button>
            <button
              onClick={() => {
                setCurrentView('dashboard');
                setSelectedNote(null);
                setNewNoteTitle('');
                setNewNoteContent('');
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-medium transition-colors flex items-center"
            >
              ❌ Anuluj
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-6 flex flex-col space-y-6">
        <div>
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            Tytuł notatki
          </label>
          <input
            type="text"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            placeholder="Wprowadź fascynujący tytuł..."
            className={`w-full px-4 py-3 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold`}
          />
        </div>
        
        <div className="flex-1 flex flex-col">
          <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
            Treść notatki
          </label>
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Zacznij pisać swoją historię..."
            className={`flex-1 w-full px-4 py-3 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
            style={{ minHeight: '400px' }}
          />
        </div>
        
        <div className={`flex justify-between items-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <div className="flex space-x-6">
            <span>📝 Słów: {newNoteContent.trim().split(/\s+/).filter(w => w.length > 0).length}</span>
            <span>🔤 Znaków: {newNoteContent.length}</span>
            <span>⏱️ ~{Math.ceil(newNoteContent.trim().split(/\s+/).filter(w => w.length > 0).length / 200)} min czytania</span>
          </div>
          <div>💡 Ctrl+S aby zapisać</div>
        </div>
      </div>
    </div>
  );

  // Search View
  const renderSearch = () => (
    <div className="space-y-6">
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border p-6`}>
        <div className="flex items-center mb-6">
          <div className="text-4xl mr-4">🔍</div>
          <div>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
              Wyszukaj w notatkach
            </h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Znajdź swoje notatki po tytule lub treści
            </p>
          </div>
        </div>
        
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Wpisz słowo kluczowe..."
            className={`w-full pl-12 pr-4 py-4 ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'border-gray-300 placeholder-gray-500'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg`}
            autoComplete="off"
            spellCheck="false"
          />
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className={`${darkMode ? 'text-gray-400' : 'text-gray-400'} text-xl`}>🔍</span>
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
            >
              <span className="text-xl">✖️</span>
            </button>
          )}
        </div>
        
        <div className={`mt-3 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
          {searchTerm ? `Znaleziono ${filteredNotes.length} wyników` : `Przeszukuj ${notes.length} notatek`}
        </div>

        {/* Quick filters */}
        {!searchTerm && (
          <div className="mt-4">
            <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              Szybkie filtry:
            </p>
            <div className="flex flex-wrap gap-2">
              {['dzisiaj', 'wczoraj', 'długie notatki', 'krótkie notatki'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSearchTerm(filter)}
                  className={`px-3 py-1 text-sm rounded-full transition-smooth ${
                    darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {filteredNotes.map(note => (
          <div
            key={note.id}
            onClick={() => editNote(note)}
            className={`${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-50'} border rounded-xl p-6 cursor-pointer transition-smooth hover-lift`}
            style={{ transition: 'all 0.3s ease' }}
          >
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              {searchTerm ? (
                <span dangerouslySetInnerHTML={{
                  __html: note.title.replace(
                    new RegExp(`(${searchTerm})`, 'gi'),
                    '<mark style="background-color: #fef08a; padding: 2px 4px; border-radius: 4px;">$1</mark>'
                  )
                }} />
              ) : (
                note.title
              )}
            </h3>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}
               style={{ 
                 display: '-webkit-box',
                 WebkitLineClamp: 2,
                 WebkitBoxOrient: 'vertical',
                 overflow: 'hidden'
               }}
            >
              {searchTerm && note.content ? (
                <span dangerouslySetInnerHTML={{
                  __html: (note.content.substring(0, 150) + '...').replace(
                    new RegExp(`(${searchTerm})`, 'gi'),
                    '<mark style="background-color: #fef08a; padding: 2px 4px; border-radius: 4px;">$1</mark>'
                  )
                }} />
              ) : (
                note.content?.substring(0, 150) + '...'
              )}
            </p>
            <div className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'} flex items-center gap-4`}>
              <span>📅 {formatDate(note.updated_at)}</span>
              <span>🔤 {note.content?.length || 0} znaków</span>
              <span>⏱️ ~{Math.ceil((note.content?.split(' ').length || 0) / 200)} min</span>
            </div>
          </div>
        ))}
      </div>

      {searchTerm && filteredNotes.length === 0 && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-12 text-center`}>
          <div className="text-6xl mb-4">🔍</div>
          <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            Brak wyników
          </h3>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
            Nie znaleziono notatek zawierających "{searchTerm}"
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className={`px-4 py-2 rounded-lg transition-smooth ${
              darkMode 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Wyczyść wyszukiwanie
          </button>
        </div>
      )}

      {!searchTerm && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-12 text-center`}>
          <div className="text-6xl mb-4">💡</div>
          <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            Rozpocznij wyszukiwanie
          </h3>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
            Wpisz słowo kluczowe w polu powyżej, aby znaleźć swoje notatki
          </p>
          <div className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Możesz wyszukiwać po tytule lub treści notatki
          </div>
        </div>
      )}
    </div>
  );

  // Settings View
  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
        ⚙️ Ustawienia
      </h2>
      
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}>
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
          Wygląd
        </h3>
        
        <div className="flex items-center justify-between">
          <div>
            <label className={`text-base font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Tryb ciemny
            </label>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Przełącz na ciemny motyw interfejsu
            </p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              darkMode ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}>
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
          Informacje o aplikacji
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Wersja:</span>
            <span className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Autor:</span>
            <span className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>Claude</span>
          </div>
          <div className="flex justify-between">
            <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Technologia:</span>
            <span className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>React + Tailwind CSS</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Render current view
  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return renderDashboard();
      case 'notes':
        return renderNotesList();
      case 'editor':
        return renderEditor();
      case 'search':
        return renderSearch();
      case 'settings':
        return renderSettings();
      default:
        return renderDashboard();
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      {/* Notification */}
      {showNotification && (
        <div 
          className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-xl p-4 shadow-lg"
          style={{
            transform: 'translateX(0)',
            transition: 'all 0.3s ease',
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          <div className="flex items-center">
            <span className="text-lg mr-3">📢</span>
            <span className="font-medium text-gray-900">{notificationMessage}</span>
            <button
              onClick={() => setShowNotification(false)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              ✖️
            </button>
          </div>
        </div>
      )}

      {/* CSS Styles for animations */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }
        
        .hover-scale:hover {
          transform: scale(1.05);
        }
        
        .transition-smooth {
          transition: all 0.3s ease;
        }
      `}</style>

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-16'} ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r transition-all duration-300 flex flex-col`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 min-h-[73px]">
            {sidebarOpen && (
              <div className="flex items-center">
                <div className="text-3xl">📝</div>
                <div className="ml-3">
                  <h1 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Notatnik
                  </h1>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Enhanced v2.0
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg hover:bg-gray-100 ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500'} transition-colors`}
            >
              {sidebarOpen ? '◀️' : '▶️'}
            </button>
          </div>

          {/* User Info */}
          {sidebarOpen && (
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {user.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="ml-3">
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user.username}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center px-3 py-3 rounded-xl text-left transition-all duration-200 ${
                  currentView === item.id
                    ? `${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-50 text-blue-700'} shadow-lg border-l-4 border-blue-500`
                    : `${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'}`
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && (
                  <div className="ml-3">
                    <div className="font-medium">{item.label}</div>
                    <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {item.desc}
                    </div>
                  </div>
                )}
              </button>
            ))}
          </nav>

          {/* Stats */}
          {sidebarOpen && (
            <div className="p-4 border-t border-gray-100">
              <h3 className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-500'} uppercase tracking-wider mb-3`}>
                Statystyki
              </h3>
              <div className="space-y-2">
                <div className={`flex justify-between text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span>Wszystkich:</span>
                  <span className="font-bold">{notes.length}</span>
                </div>
                <div className={`flex justify-between text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span>Dzisiaj:</span>
                  <span className="font-bold text-green-500">
                    {notes.filter(note => {
                      const today = new Date().toDateString();
                      const noteDate = new Date(note.created_at).toDateString();
                      return today === noteDate;
                    }).length}
                  </span>
                </div>
                <div className={`flex justify-between text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span>W tym tyg.:</span>
                  <span className="font-bold text-blue-500">
                    {notes.filter(note => {
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return new Date(note.created_at) > weekAgo;
                    }).length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Dark Mode Toggle */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-full flex items-center px-3 py-3 rounded-xl transition-colors ${
                sidebarOpen ? 'justify-start' : 'justify-center'
              } ${darkMode ? 'text-yellow-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="text-xl">{darkMode ? '🌙' : '☀️'}</span>
              {sidebarOpen && (
                <span className="ml-3 text-sm font-medium">
                  {darkMode ? 'Tryb ciemny' : 'Tryb jasny'}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Top Bar */}
          <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4 shadow-sm flex-shrink-0`}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                  {currentView === 'dashboard' && '🏠 Dashboard'}
                  {currentView === 'notes' && '📝 Moje Notatki'}
                  {currentView === 'editor' && '✏️ Edytor Notatek'}
                  {currentView === 'search' && '🔍 Wyszukiwanie'}
                  {currentView === 'settings' && '⚙️ Ustawienia'}
                </h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1 truncate`}>
                  {currentView === 'dashboard' && 'Przegląd aktywności i szybki dostęp do funkcji'}
                  {currentView === 'notes' && `Zarządzaj swoimi ${notes.length} notatkami`}
                  {currentView === 'editor' && 'Twórz i edytuj swoje notatki z zaawansowanymi opcjami'}
                  {currentView === 'search' && 'Przeszukuj wszystkie swoje notatki błyskawicznie'}
                  {currentView === 'settings' && 'Dostosuj aplikację do swoich preferencji'}
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} hidden lg:block`}>
                  {new Date().toLocaleDateString('pl-PL', { 
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric'
                  })}
                </div>
                {currentView !== 'editor' && (
                  <button
                    onClick={() => setCurrentView('editor')}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-5 py-2 rounded-xl font-medium shadow-lg transition-smooth hover-scale"
                    style={{ transition: 'all 0.2s ease' }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05) translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1) translateY(0)'}
                  >
                    ➕ <span className="ml-1 hidden sm:inline">Nowa Notatka</span>
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* Content Area - Fixed height and scrollable */}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-full">
              {renderCurrentView()}
            </div>
          </main>

          {/* Status Bar */}
          <footer className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t px-6 py-3 flex-shrink-0`}>
            <div className={`flex items-center justify-between text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                  Aplikacja działa
                </span>
                <span className="hidden sm:inline">⚛️ React Enhanced</span>
                <span className="hidden md:inline">🎨 Tailwind CSS</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="hidden sm:inline">💾 Auto-zapis włączony</span>
                <span>{notes.length} notatek</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default NotesApp;