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
  const [user] = useState(mockUser);
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

  // Скачать одну нотатку как TXT
  const downloadNote = (note) => {
    const content = `${note.title}\n\n${note.content || ''}\n\nUtworzona: ${new Date(note.created_at).toLocaleDateString('pl-PL')}\nZaktualizowana: ${new Date(note.updated_at).toLocaleDateString('pl-PL')}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[\\/:*?"<>|]/g, '') || 'notatka'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showAlert('📥 Notatka pobrana jako plik TXT!');
  };

  // Поделиться ссылкой (копировать)
  const copyShareLink = (noteId) => {
    const shareLink = `${window.location.origin}/shared/${noteId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareLink).then(() => {
        showAlert('🔗 Link udostępniania skopiowany do schowka!');
      });
    } else {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = shareLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showAlert('🔗 Link udostępniania skopiowany do schowka!');
    }
  };

  // Export functions
  const exportToJson = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `notatki_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showAlert('📥 Notatki wyeksportowane do pliku JSON!');
  };

  const exportToText = () => {
    let textContent = `MOJE NOTATKI - EKSPORT\n`;
    textContent += `Data eksportu: ${new Date().toLocaleDateString('pl-PL')}\n`;
    textContent += `Liczba notatek: ${notes.length}\n\n`;
    textContent += '='.repeat(50) + '\n\n';
    notes.forEach((note, index) => {
      textContent += `${index + 1}. ${note.title}\n`;
      textContent += `Utworzona: ${new Date(note.created_at).toLocaleDateString('pl-PL')}\n`;
      textContent += `Zaktualizowana: ${new Date(note.updated_at).toLocaleDateString('pl-PL')}\n`;
      textContent += '-'.repeat(30) + '\n';
      textContent += `${note.content || 'Brak treści'}\n\n`;
      textContent += '='.repeat(50) + '\n\n';
    });
    const dataUri = 'data:text/plain;charset=utf-8,' + encodeURIComponent(textContent);
    const exportFileDefaultName = `notatki_${new Date().toISOString().split('T')[0]}.txt`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showAlert('📄 Notatki wyeksportowane do pliku tekstowego!');
  };

  const exportToMarkdown = () => {
    let mdContent = `# Moje Notatki\n\n`;
    mdContent += `**Data eksportu:** ${new Date().toLocaleDateString('pl-PL')}\n`;
    mdContent += `**Liczba notatek:** ${notes.length}\n\n`;
    mdContent += '---\n\n';
    notes.forEach((note, index) => {
      mdContent += `## ${index + 1}. ${note.title}\n\n`;
      mdContent += `**Utworzona:** ${new Date(note.created_at).toLocaleDateString('pl-PL')}\n`;
      mdContent += `**Zaktualizowana:** ${new Date(note.updated_at).toLocaleDateString('pl-PL')}\n\n`;
      mdContent += `${note.content || '*Brak treści*'}\n\n`;
      mdContent += '---\n\n';
    });
    const dataUri = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(mdContent);
    const exportFileDefaultName = `notatki_${new Date().toISOString().split('T')[0]}.md`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    showAlert('📝 Notatki wyeksportowane do formatu Markdown!');
  };

  const exportToPdf = () => {
    // Для PDF используем window.print() с кастомным CSS
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Moje Notatki - ${new Date().toLocaleDateString('pl-PL')}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
            h2 { color: #374151; margin-top: 30px; }
            .note { margin-bottom: 30px; page-break-inside: avoid; }
            .note-meta { font-size: 12px; color: #666; margin-bottom: 10px; }
            .note-content { background: #f9f9f9; padding: 15px; border-radius: 5px; white-space: pre-wrap; }
            hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>📝 Moje Notatki</h1>
          <p><strong>Data eksportu:</strong> ${new Date().toLocaleDateString('pl-PL')}</p>
          <p><strong>Liczba notatek:</strong> ${notes.length}</p>
          <hr>
          ${notes.map((note, index) => `
            <div class="note">
              <h2>${index + 1}. ${note.title}</h2>
              <div class="note-meta">
                Utworzona: ${new Date(note.created_at).toLocaleDateString('pl-PL')} | 
                Zaktualizowana: ${new Date(note.updated_at).toLocaleDateString('pl-PL')}
              </div>
              <div class="note-content">${note.content || 'Brak treści'}</div>
            </div>
          `).join('')}
        </body>
      </html>
    `;
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
    showAlert('🖨️ Otwarto okno drukowania - zapisz jako PDF!');
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
    { id: 'export', icon: '📤', label: 'Eksport', desc: 'Eksportuj notatki' },
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
            { icon: '📝', label: 'Wszystkich notatek', value: stats.total, gradient: 'from-blue-400 to-blue-600' },
            { icon: '🌟', label: 'Utworzonych dzisiaj', value: stats.today, gradient: 'from-green-400 to-green-600' },
            { icon: '📅', label: 'W tym tygodniu', value: stats.thisWeek, gradient: 'from-purple-400 to-purple-600' },
            { icon: '🔤', label: 'Znaków łącznie', value: stats.characters, gradient: 'from-orange-400 to-orange-600' }
          ].map((stat, index) => (
            <div
              key={index}
              className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl p-6 border shadow-lg`}
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
                <div className="text-4xl opacity-60">{stat.icon}</div>
              </div>
            </div>
          ))}
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
                    <button onClick={() => editNote(note)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="Edytuj">✏️</button>
                    <button onClick={() => downloadNote(note)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg" title="Pobierz">⬇️</button>
                    <button onClick={() => copyShareLink(note.id)} className="p-2 text-green-500 hover:bg-green-50 rounded-lg" title="Udostępnij">👥</button>
                    <button onClick={() => deleteNote(note.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Usuń">🗑️</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Notes List View (с кнопками скачать и поделиться)
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
            className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6 group`}
            style={{ transition: 'all 0.3s ease' }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 cursor-pointer" onClick={() => editNote(note)}>
                <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3 group-hover:text-blue-600`}>
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
                </div>
              </div>
              <div className="flex space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => editNote(note)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="Edytuj">✏️</button>
                <button onClick={() => downloadNote(note)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg" title="Pobierz">⬇️</button>
                <button onClick={() => copyShareLink(note.id)} className="p-2 text-green-500 hover:bg-green-50 rounded-lg" title="Udostępnij">👥</button>
                <button onClick={() => deleteNote(note.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Usuń">🗑️</button>
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
        </div>
      </div>
    </div>
  );

  // Export View
  const renderExportView = () => (
    <div className="space-y-6">
      <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        📤 Eksportuj notatki
      </h2>
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}>
        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
          Wybierz format eksportu dla swoich {notes.length} notatek:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={exportToJson}
            className="p-6 border rounded-lg hover:shadow-md transition-all text-left group"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📊</div>
            <h3 className="font-semibold text-lg mb-2">JSON</h3>
            <p className="text-sm text-gray-500">Strukturalny format danych, idealny do archiwizacji</p>
          </button>
          <button
            onClick={exportToText}
            className="p-6 border rounded-lg hover:shadow-md transition-all text-left group"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📄</div>
            <h3 className="font-semibold text-lg mb-2">Tekst (.txt)</h3>
            <p className="text-sm text-gray-500">Prosty format tekstowy, kompatybilny z każdym edytorem</p>
          </button>
          <button
            onClick={exportToMarkdown}
            className="p-6 border rounded-lg hover:shadow-md transition-all text-left group"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📝</div>
            <h3 className="font-semibold text-lg mb-2">Markdown (.md)</h3>
            <p className="text-sm text-gray-500">Format z podstawowym formatowaniem, popularny wśród programistów</p>
          </button>
          <button
            onClick={exportToPdf}
            className="p-6 border rounded-lg hover:shadow-md transition-all text-left group"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🖨️</div>
            <h3 className="font-semibold text-lg mb-2">PDF</h3>
            <p className="text-sm text-gray-500">Uniwersalny format do drukowania i udostępniania</p>
          </button>
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
      </div>
      <div className="grid gap-4">
        {filteredNotes.map(note => (
          <div
            key={note.id}
            className={`${darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-50'} border rounded-xl p-6 cursor-pointer`}
          >
            <div className="flex justify-between items-start">
              <div onClick={() => editNote(note)} className="flex-1">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                  {note.title}
                </h3>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
                  {note.content?.substring(0, 150)}...
                </p>
                <div className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'} flex items-center gap-4`}>
                  <span>📅 {formatDate(note.updated_at)}</span>
                  <span>🔤 {note.content?.length || 0} znaków</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 ml-4">
                <button onClick={() => downloadNote(note)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg" title="Pobierz">⬇️</button>
                <button onClick={() => copyShareLink(note.id)} className="p-2 text-green-500 hover:bg-green-50 rounded-lg" title="Udostępnij">👥</button>
                <button onClick={() => deleteNote(note.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Usuń">🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>
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
            <span className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>2.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Autor:</span>
            <span className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>Illia Yakovunyk</span>
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
      case 'export':
        return renderExportView();
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
            transition: 'all 0.3s ease'
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
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Enhanced v2.0</p>
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
                    <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{item.desc}</div>
                  </div>
                )}
              </button>
            ))}
          </nav>
          {/* Dark Mode Toggle */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-full flex items-center px-3 py-3 rounded-xl transition-colors ${sidebarOpen ? 'justify-start' : 'justify-center'} ${darkMode ? 'text-yellow-400 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'}`}
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
                  {currentView === 'export' && '📤 Eksport'}
                  {currentView === 'settings' && '⚙️ Ustawienia'}
                </h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1 truncate`}>
                  {currentView === 'dashboard' && 'Przegląd aktywności i szybki dostęp do funkcji'}
                  {currentView === 'notes' && `Zarządzaj swoimi ${notes.length} notatkami`}
                  {currentView === 'editor' && 'Twórz i edytuj swoje notatki z zaawansowanymi opcjami'}
                  {currentView === 'search' && 'Przeszukuj wszystkie swoje notatki błyskawicznie'}
                  {currentView === 'export' && 'Eksportuj swoje notatki do pliku'}
                  {currentView === 'settings' && 'Dostosuj aplikację do swoich preferencji'}
                </p>
              </div>
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
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-5 py-2 rounded-xl font-medium shadow-lg transition"
                  >
                    ➕ <span className="ml-1 hidden sm:inline">Nowa Notatka</span>
                  </button>
                )}
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-full">
              {renderCurrentView()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default NotesApp;
