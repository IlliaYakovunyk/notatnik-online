import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SharedNoteViewer = ({ token }) => {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Pobierz udostępnioną notatkę
  const fetchSharedNote = async () => {
    try {
      setLoading(true);
      setError('');
     
      const response = await fetch(`/api/shared/${token}`);
      const data = await response.json();
      
      if (data.success) {
        setNote(data.note);
        setEditTitle(data.note.title);
        setEditContent(data.note.content);
      } else {
        setError(data.message || 'Nie można załadować notatki');
      }
    } catch (error) {
      console.error('Błąd pobierania notatki:', error);
      setError('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  // Zapisz zmiany (tylko jeśli można edytować)
  const saveChanges = async () => {
    if (!note.can_edit) return;
    
    try {
      setSaving(true);
      setSaveMessage('');
      
      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
          shared_token: token
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNote({ ...note, title: editTitle, content: editContent });
        setEditing(false);
        setSaveMessage('✅ Zmiany zostały zapisane!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('❌ ' + (data.message || 'Błąd zapisywania'));
      }
    } catch (error) {
      console.error('Błąd zapisywania:', error);
      setSaveMessage('❌ Błąd połączenia z serwerem');
    } finally {
      setSaving(false);
    }
  };

  // Anuluj edycję
  const cancelEdit = () => {
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditing(false);
    setSaveMessage('');
  };

  // Format daty
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Oblicz statystyki tekstu
  const getTextStats = (text) => {
    if (!text) return { words: 0, characters: 0, readTime: 0 };
   
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const characters = text.length;
    const readTime = Math.ceil(words / 200); // 200 słów na minutę
   
    return { words, characters, readTime };
  };

  useEffect(() => {
    if (token) {
      fetchSharedNote();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Ładowanie udostępnionej notatki...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-4">
            <h2 className="text-xl font-semibold mb-2">Błąd ładowania notatki</h2>
            <p>{error}</p>
          </div>
          <button
            onClick={fetchSharedNote}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Notatka nie została znaleziona</p>
        </div>
      </div>
    );
  }

  const stats = getTextStats(note.content);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm text-gray-500">Udostępniona notatka</span>
              </div>
              {note.can_edit && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  Można edytować
                </span>
              )}
            </div>
            
            {note.can_edit && (
              <div className="flex space-x-2">
                {!editing ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Edytuj</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={saveChanges}
                      disabled={saving}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                          <span>Zapisywanie...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Zapisz</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Anuluj
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Komunikat o zapisie */}
          {saveMessage && (
            <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm">{saveMessage}</p>
            </div>
          )}

          {/* Tytuł */}
          {editing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-2xl font-bold border-b-2 border-gray-300 focus:border-blue-500 outline-none pb-2"
              placeholder="Tytuł notatki..."
            />
          ) : (
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{note.title}</h1>
          )}

          {/* Metadane */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-4">
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Autor: {note.author_name}</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Utworzono: {formatDate(note.created_at)}</span>
            </div>
            {note.updated_at !== note.created_at && (
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Zaktualizowano: {formatDate(note.updated_at)}</span>
              </div>
            )}
          </div>

          {/* Statystyki */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-2">
            <span>{stats.words} słów</span>
            <span>{stats.characters} znaków</span>
            <span>~{stats.readTime} min czytania</span>
          </div>
        </div>

        {/* Treść notatki */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {editing ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Treść notatki
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Wpisz treść notatki... (obsługuje Markdown)"
              />
              <p className="text-sm text-gray-500 mt-2">
                💡 Tip: Możesz używać Markdown do formatowania tekstu
              </p>
            </div>
          ) : (
            <div className="prose prose-lg max-w-none">
              {note.content ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-3xl font-bold mb-4 text-gray-900" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-2xl font-semibold mb-3 text-gray-900" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-xl font-medium mb-2 text-gray-900" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4 text-gray-700 leading-relaxed" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 text-gray-700" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 text-gray-700" {...props} />,
                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-600 mb-4" {...props} />,
                    code: ({node, inline, ...props}) => 
                      inline ? (
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800" {...props} />
                      ) : (
                        <code className="block bg-gray-100 p-4 rounded-lg text-sm font-mono text-gray-800 overflow-x-auto" {...props} />
                      ),
                    pre: ({node, ...props}) => <pre className="bg-gray-100 p-4 rounded-lg mb-4 overflow-x-auto" {...props} />,
                    a: ({node, ...props}) => <a className="text-blue-600 hover:text-blue-800 underline" {...props} />,
                    table: ({node, ...props}) => <table className="w-full border-collapse border border-gray-300 mb-4" {...props} />,
                    th: ({node, ...props}) => <th className="border border-gray-300 bg-gray-50 px-4 py-2 text-left font-semibold" {...props} />,
                    td: ({node, ...props}) => <td className="border border-gray-300 px-4 py-2" {...props} />
                  }}
                >
                  {note.content}
                </ReactMarkdown>
              ) : (
                <p className="text-gray-500 italic">Ta notatka jest pusta.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Ta notatka została udostępniona przez {note.author_name}</p>
          {!note.can_edit && (
            <p className="mt-1">Masz dostęp tylko do odczytu tej notatki.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharedNoteViewer;