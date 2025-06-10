import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NoteEditor = ({ note, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Pobierz token z localStorage
  const getToken = () => localStorage.getItem('token');

  // Ustaw dane notatki przy zmianie
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
    } else {
      setTitle('');
      setContent('');
    }
    setError('');
    setSaved(false);
  }, [note]);

  // Zapisz notatkę
  const saveNote = async () => {
    if (!title.trim()) {
      setError('Tytuł notatki jest wymagany');
      return;
    }

    try {
      setSaving(true);
      setError('');
      const token = getToken();

      if (!token) {
        setError('Brak autoryzacji. Zaloguj się ponownie.');
        return;
      }

      let response;
      
      if (note && note.id) {
        // Aktualizuj istniejącą notatkę
        response = await axios.put(`/api/notes/${note.id}`, {
          title: title.trim(),
          content: content.trim()
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Utwórz nową notatkę
        response = await axios.post('/api/notes', {
          title: title.trim(),
          content: content.trim()
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (response.data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        onSave(response.data.note);
      }
    } catch (error) {
      console.error('Błąd zapisywania notatki:', error);
      setError(error.response?.data?.message || 'Błąd zapisywania notatki');
    } finally {
      setSaving(false);
    }
  };

  // Auto-save co 10 sekund
  useEffect(() => {
    if (!title && !content) return;

    const autoSaveTimer = setTimeout(() => {
      if (title.trim() && (note?.id || content.trim())) {
        saveNote();
      }
    }, 10000);

    return () => clearTimeout(autoSaveTimer);
  }, [title, content]);

  const handleKeyDown = (e) => {
    // Ctrl+S do zapisywania
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveNote();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow h-full flex flex-col" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-800">
          {note ? '✏️ Edytuj Notatkę' : '📝 Nowa Notatka'}
        </h2>
        <div className="flex space-x-2">
          {saved && (
            <span className="text-green-600 text-sm flex items-center">
              ✅ Zapisano
            </span>
          )}
          <button
            onClick={saveNote}
            disabled={saving || !title.trim()}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-4 py-2 rounded transition-colors"
          >
            {saving ? '💾 Zapisywanie...' : '💾 Zapisz'}
          </button>
          <button
            onClick={onCancel}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            ❌ Anuluj
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <div className="flex-1 p-4 flex flex-col">
        {/* Tytuł */}
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Tytuł notatki *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Wprowadź tytuł notatki..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Treść */}
        <div className="flex-1 flex flex-col">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Treść notatki
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Rozpocznij pisanie swojej notatki..."
            className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            style={{ minHeight: '300px' }}
          />
        </div>

        {/* Statystyki */}
        <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
          <div>
            🔤 Znaków: {content.length} | 📝 Słów: {content.trim().split(/\s+/).filter(word => word.length > 0).length}
          </div>
          <div>
            💡 Wskazówka: Użyj Ctrl+S aby zapisać
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <div>
            {note ? `📅 Utworzona: ${new Date(note.created_at).toLocaleDateString('pl-PL')}` : 'Nowa notatka'}
          </div>
          <div>
            Auto-zapis co 10 sekund
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;