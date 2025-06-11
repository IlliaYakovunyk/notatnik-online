import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const EnhancedNotesList = ({ onSelectNote, onCreateNote }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', 'compact'
  const [sortBy, setSortBy] = useState('updated_at'); // 'updated_at', 'created_at', 'title'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc', 'asc'
  const [filterBy, setFilterBy] = useState('all'); // 'all', 'recent', 'favorites'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotes, setSelectedNotes] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  const getToken = () => localStorage.getItem('token');

  // Pobierz wszystkie notatki
  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError('');
      const token = getToken();
      
      if (!token) {
        setError('Brak autoryzacji. Zaloguj się ponownie.');
        return;
      }

      // Dodaj parametry sortowania i filtrowania
      const params = new URLSearchParams({
        sortBy,
        order: sortOrder
      });

      if (filterBy === 'favorites') {
        params.append('favorite', 'true');
      } else if (filterBy === 'recent') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.append('dateFrom', weekAgo.toISOString().split('T')[0]);
      }

      const response = await fetch(`/api/notes/filter?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        setNotes(data.notes || []);
      } else {
        setError(data.message || 'Błąd pobierania notatek');
      }
    } catch (error) {
      console.error('Błąd pobierania notatek:', error);
      setError('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  // Usuń notatkę
  const deleteNote = async (noteId, noteTitle) => {
    if (!window.confirm(`Czy na pewno chcesz usunąć notatkę "${noteTitle}"?`)) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        setNotes(notes.filter(note => note.id !== noteId));
        setSelectedNotes(prev => {
          const newSet = new Set(prev);
          newSet.delete(noteId);
          return newSet;
        });
        
        // Show success notification
        showNotification('Notatka usunięta pomyślnie! 🗑️', 'success');
      } else {
        showNotification(data.message || 'Błąd usuwania notatki', 'error');
      }
    } catch (error) {
      console.error('Błąd usuwania notatki:', error);
      showNotification('Błąd połączenia z serwerem', 'error');
    }
  };

  // Bulk delete
  const deleteBulkNotes = async () => {
    if (selectedNotes.size === 0) return;
    
    if (!window.confirm(`Czy na pewno chcesz usunąć ${selectedNotes.size} notatek?`)) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch('/api/notes/bulk/delete', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          noteIds: Array.from(selectedNotes)
        })
      });

      const data = await response.json();

      if (data.success) {
        setNotes(notes.filter(note => !selectedNotes.has(note.id)));
        setSelectedNotes(new Set());
        setShowBulkActions(false);
        showNotification(`Usunięto ${data.deletedCount} notatek! 🗑️`, 'success');
      } else {
        showNotification(data.message || 'Błąd bulk delete', 'error');
      }
    } catch (error) {
      console.error('Błąd bulk delete:', error);
      showNotification('Błąd połączenia z serwerem', 'error');
    }
  };

  // Toggle note selection
  const toggleNoteSelection = (noteId) => {
    setSelectedNotes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
      } else {
        newSet.add(noteId);
      }
      setShowBulkActions(newSet.size > 0);
      return newSet;
    });
  };

  // Select all notes
  const selectAllNotes = () => {
    const filteredNoteIds = filteredNotes.map(note => note.id);
    setSelectedNotes(new Set(filteredNoteIds));
    setShowBulkActions(true);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedNotes(new Set());
    setShowBulkActions(false);
  };

  // Simple notification system
  const showNotification = (message, type = 'info') => {
    // This would typically use a toast library or app-level notification system
    alert(message);
  };

  // Ładuj notatki przy starcie i przy zmianie filtrów
  useEffect(() => {
    fetchNotes();
  }, [sortBy, sortOrder, filterBy]);

  // Filtruj notatki na podstawie wyszukiwania
  const filteredNotes = notes.filter(note => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query)
    );
  });

  // Format daty
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'dzisiaj';
    if (diffDays === 2) return 'wczoraj';
    if (diffDays <= 7) return `${diffDays} dni temu`;
    
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Extract markdown preview
  const getMarkdownPreview = (content, maxLength = 150) => {
    if (!content) return 'Pusta notatka';
    
    // Remove markdown syntax for preview
    const cleanContent = content
      .replace(/#{1,6}\s+/g, '') // Headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1') // Italic
      .replace(/`(.*?)`/g, '$1') // Inline code
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Links
      .replace(/>\s+/g, '') // Quotes
      .replace(/[-*+]\s+/g, '') // Lists
      .replace(/\d+\.\s+/g, '') // Numbered lists
      .replace(/```[\s\S]*?```/g, '[kod]') // Code blocks
      .trim();

    return cleanContent.length > maxLength 
      ? cleanContent.substring(0, maxLength) + '...'
      : cleanContent;
  };

  // Get note type badge
  const getNoteTypeBadge = (content) => {
    if (!content) return null;
    
    if (content.includes('- [ ]') || content.includes('- [x]')) {
      return { label: 'Lista zadań', emoji: '✅', color: 'bg-green-100 text-green-800' };
    }
    if (content.includes('```')) {
      return { label: 'Kod', emoji: '💻', color: 'bg-blue-100 text-blue-800' };
    }
    if (content.includes('# ') && content.includes('## ')) {
      return { label: 'Artykuł', emoji: '📄', color: 'bg-purple-100 text-purple-800' };
    }
    if (content.includes('|') && content.includes('---')) {
      return { label: 'Tabela', emoji: '📊', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { label: 'Notatka', emoji: '📝', color: 'bg-gray-100 text-gray-800' };
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="mb-4 lg:mb-0">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            📝 <span className="ml-2">Moje Notatki</span>
            <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {filteredNotes.length}
            </span>
          </h2>
          <p className="text-gray-600 mt-1">
            Zarządzaj swoimi notatkami z obsługą Markdown
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Szukaj notatek..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>

          {/* View mode */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { mode: 'grid', icon: '⊞', title: 'Siatka' },
              { mode: 'list', icon: '☰', title: 'Lista' },
              { mode: 'compact', icon: '≡', title: 'Kompaktowy' }
            ].map(({ mode, icon, title }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === mode 
                    ? 'bg-white shadow-sm text-blue-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                title={title}
              >
                {icon}
              </button>
            ))}
          </div>

          {/* Filters */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">🗂️ Wszystkie</option>
            <option value="recent">🆕 Ostatnie</option>
            <option value="favorites">⭐ Ulubione</option>
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="updated_at-desc">🕐 Ostatnio aktualizowane</option>
            <option value="created_at-desc">📅 Najnowsze</option>
            <option value="title-asc">🔤 A-Z</option>
            <option value="title-desc">🔤 Z-A</option>
          </select>

          <button
            onClick={onCreateNote}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center"
          >
            ➕ <span className="ml-1 hidden sm:inline">Nowa Notatka</span>
          </button>
        </div>
      </div>

      {/* Bulk actions */}
      {showBulkActions && (
        <div className="px-6 py-3 bg-blue-50 border-b flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-blue-900">
              Wybrano {selectedNotes.size} notatek
            </span>
            <button
              onClick={selectAllNotes}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Zaznacz wszystkie
            </button>
            <button
              onClick={clearSelection}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Wyczyść zaznaczenie
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={deleteBulkNotes}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              🗑️ Usuń wybrane
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-6 bg-red-50 border-l-4 border-red-400">
          <div className="flex items-center">
            <span className="text-xl mr-2">⚠️</span>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="p-6">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {searchQuery ? 'Brak wyników wyszukiwania' : 'Brak notatek'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery 
                ? `Nie znaleziono notatek zawierających "${searchQuery}"`
                : 'Rozpocznij od utworzenia swojej pierwszej notatki z obsługą Markdown'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={onCreateNote}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                ➕ Utwórz pierwszą notatkę
              </button>
            )}
          </div>
        ) : (
          <div className={`
            ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' :
              viewMode === 'list' ? 'space-y-4' :
              'space-y-2'
            }
          `}>
            {filteredNotes.map((note) => {
              const typeBadge = getNoteTypeBadge(note.content);
              const preview = getMarkdownPreview(note.content);
              const isSelected = selectedNotes.has(note.id);

              return (
                <div
                  key={note.id}
                  className={`
                    ${viewMode === 'compact' ? 'p-3' : 'p-6'}
                    border rounded-xl transition-all duration-200 cursor-pointer group relative
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'
                    }
                  `}
                >
                  {/* Selection checkbox */}
                  <div className="absolute top-3 left-3 z-10">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleNoteSelection(note.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <div
                    onClick={() => onSelectNote(note)}
                    className="ml-8"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className={`
                          ${viewMode === 'compact' ? 'text-lg' : 'text-xl'} 
                          font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2
                        `}>
                          {note.title}
                        </h3>
                        
                        {typeBadge && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeBadge.color}`}>
                            <span className="mr-1">{typeBadge.emoji}</span>
                            {typeBadge.label}
                          </span>
                        )}
                      </div>

                      <div className="flex space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectNote(note);
                          }}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edytuj"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNote(note.id, note.title);
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Usuń"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Content preview */}
                    {viewMode !== 'compact' && (
                      <div className="mb-4">
                        {note.content && note.content.includes('```') ? (
                          // Code block preview
                          <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm text-gray-700">
                            {getMarkdownPreview(note.content, 100)}
                          </div>
                        ) : note.content && (note.content.includes('- [ ]') || note.content.includes('- [x]')) ? (
                          // Task list preview
                          <div className="space-y-1">
                            {note.content.split('\n')
                              .filter(line => line.includes('- ['))
                              .slice(0, 3)
                              .map((task, i) => (
                                <div key={i} className="flex items-center text-sm">
                                  <span className="mr-2">
                                    {task.includes('- [x]') ? '✅' : '☐'}
                                  </span>
                                  <span className={task.includes('- [x]') ? 'line-through text-gray-500' : 'text-gray-700'}>
                                    {task.replace(/- \[[x ]\]\s*/, '')}
                                  </span>
                                </div>
                              ))}
                          </div>
                        ) : (
                          // Regular markdown preview
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => <p className="text-gray-600 mb-2 line-clamp-3">{children}</p>,
                                h1: ({ children }) => <h1 className="text-lg font-bold text-gray-800 mb-1">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-base font-semibold text-gray-800 mb-1">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-sm font-medium text-gray-800 mb-1">{children}</h3>,
                                code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{children}</code>,
                                blockquote: ({ children }) => <blockquote className="border-l-2 border-gray-300 pl-2 italic text-gray-600">{children}</blockquote>,
                              }}
                            >
                              {preview}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <span className="mr-1">📅</span>
                          {formatDate(note.updated_at)}
                        </span>
                        <span className="flex items-center">
                          <span className="mr-1">🔤</span>
                          {note.content?.length || 0} znaków
                        </span>
                        {viewMode !== 'compact' && (
                          <span className="flex items-center">
                            <span className="mr-1">⏱️</span>
                            ~{Math.ceil((note.content?.split(' ').length || 0) / 200)} min
                          </span>
                        )}
                      </div>
                      
                      {note.is_favorite && (
                        <span className="text-yellow-500" title="Ulubiona">⭐</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          📊 Wyświetlone: {filteredNotes.length} z {notes.length} notatek
        </div>
        
        <button
          onClick={fetchNotes}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors flex items-center"
        >
          <span className="mr-1">🔄</span>
          Odśwież listę
        </button>
      </div>
    </div>
  );
};

export default EnhancedNotesList;