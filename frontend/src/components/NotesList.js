import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NotesList = ({ onSelectNote, onCreateNote }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pobierz token z localStorage
  const getToken = () => localStorage.getItem('token');

  // Pobierz wszystkie notatki
  const fetchNotes = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      if (!token) {
        setError('Brak autoryzacji. Zaloguj się ponownie.');
        return;
      }

      const response = await axios.get('/api/notes', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setNotes(response.data.notes);
        setError('');
      }
    } catch (error) {
      console.error('Błąd pobierania notatek:', error);
      setError('Błąd pobierania notatek');
    } finally {
      setLoading(false);
    }
  };

  // Usuń notatkę
  const deleteNote = async (noteId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć tę notatkę?')) {
      return;
    }

    try {
      const token = getToken();
      const response = await axios.delete(`/api/notes/${noteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setNotes(notes.filter(note => note.id !== noteId));
        alert('Notatka usunięta pomyślnie!');
      }
    } catch (error) {
      console.error('Błąd usuwania notatki:', error);
      alert('Błąd usuwania notatki');
    }
  };

  // Ładuj notatki przy starcie
  useEffect(() => {
    fetchNotes();
  }, []);

  // Formatuj datę
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-800">
          📝 Moje Notatki ({notes.length})
        </h2>
        <button
          onClick={onCreateNote}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          ➕ Nowa Notatka
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
          {error}
        </div>
      )}

      {/* Lista notatek */}
      <div className="p-4">
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Brak notatek
            </h3>
            <p className="text-gray-500 mb-4">
              Rozpocznij od utworzenia swojej pierwszej notatki
            </p>
            <button
              onClick={onCreateNote}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Utwórz pierwszą notatkę
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onSelectNote(note)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">
                      {note.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                      {note.content ? 
                        (note.content.length > 100 ? 
                          note.content.substring(0, 100) + '...' : 
                          note.content
                        ) : 
                        'Pusta notatka'
                      }
                    </p>
                    <div className="flex items-center text-xs text-gray-500">
                      <span>📅 {formatDate(note.updated_at)}</span>
                      <span className="mx-2">•</span>
                      <span>🔤 {note.content?.length || 0} znaków</span>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectNote(note);
                      }}
                      className="text-blue-500 hover:text-blue-700 text-sm"
                      title="Edytuj"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                      title="Usuń"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Odśwież button */}
      <div className="p-4 border-t bg-gray-50">
        <button
          onClick={fetchNotes}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          🔄 Odśwież listę
        </button>
      </div>
    </div>
  );
};

export default NotesList;