import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import DashboardView from './DashboardView';
import NotesList from './NotesList';
import NoteEditor from './NoteEditor';
import SearchView from './SearchView';


const Dashboard = () => {
  const [currentView, setCurrentView] = useState('dashboard');
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
  const handleViewChange = (view, note = null) => {
    setCurrentView(view);
    if (note) {
      setSelectedNote(note);
    } else if (view !== 'editor') {
      setSelectedNote(null);
    }
  };

  const handleNoteSelect = (note) => {
    setSelectedNote(note);
    setCurrentView('editor');
  };

  const handleCreateNote = () => {
    setSelectedNote(null);
    setCurrentView('editor');
  };

  const handleNoteSave = (savedNote) => {
    console.log('Notatka zapisana:', savedNote);
    setCurrentView('notes');
    setSelectedNote(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  // Renderuj zawartość w zależności od aktualnego widoku
  const renderContent = () => {
  switch (currentView) {
    case 'dashboard':
      return <DashboardView onViewChange={handleViewChange} />;
    
    case 'notes':
    case 'list':
      return (
        <NotesList
          onSelectNote={handleNoteSelect}
          onCreateNote={handleCreateNote}
        />
      );
    
    case 'editor':
      return (
        <div className="h-full">
          <NoteEditor
            note={selectedNote}
            onSave={handleNoteSave}
            onCancel={() => setCurrentView('notes')}
          />
        </div>
      );
    
    case 'search':
      return <SearchView onSelectNote={handleNoteSelect} />; // ← ВОТ ЭТА СТРОКА
    
    case 'shared':
      return (
        <div className="bg-white rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h2 className="text-xl font-semibold mb-2">Udostępnione Notatki</h2>
          <p className="text-gray-500">Funkcja współdzielenia będzie dostępna w następnych zajęciach</p>
        </div>
      );
    
    default:
      return <DashboardView onViewChange={handleViewChange} />;
  }
};

  return (
    <Layout
      currentView={currentView}
      onViewChange={handleViewChange}
      user={user}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
};

export default Dashboard;