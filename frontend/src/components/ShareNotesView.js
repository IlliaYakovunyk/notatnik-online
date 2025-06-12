import React, { useState, useEffect } from 'react';

const ShareNotesView = ({ onViewChange }) => {
  const [myShares, setMyShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareSettings, setShareSettings] = useState({
    canEdit: false,
    expiresIn: 7
  });
  const [shareResult, setShareResult] = useState(null);
  const [creating, setCreating] = useState(false);

  const getToken = () => localStorage.getItem('token');

  // Pobierz moje udostępnione notatki
  const fetchMyShares = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch('/api/my-shares', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setMyShares(data.shares || []);
      } else {
        setError(data.message || 'Błąd pobierania udostępnionych notatek');
      }
    } catch (error) {
      console.error('Błąd pobierania shares:', error);
      setError('Błąd połączenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  // Utwórz link do udostępnienia
  const createShareLink = async (noteId) => {
    try {
      setCreating(true);
      const token = getToken();
      const response = await fetch(`/api/notes/${noteId}/share`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(shareSettings)
      });

      const data = await response.json();
      if (data.success) {
        setShareResult(data.shareLink);
        setShareModalOpen(false);
        fetchMyShares(); // Odśwież listę
      } else {
        setError(data.message || 'Błąd tworzenia linku');
      }
    } catch (error) {
      console.error('Błąd tworzenia linku:', error);
      setError('Błąd połączenia z serwerem');
    } finally {
      setCreating(false);
    }
  };

  // Usuń link do udostępnienia
  const deleteShareLink = async (shareId) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten link?')) return;

    try {
      const token = getToken();
      const response = await fetch(`/api/shares/${shareId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        setMyShares(myShares.filter(share => share.id !== shareId));
      } else {
        setError(data.message || 'Błąd usuwania linku');
      }
    } catch (error) {
      console.error('Błąd usuwania linku:', error);
      setError('Błąd połączenia z serwerem');
    }
  };

  // Skopiuj link do schowka
  const copyToClipboard = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setShareResult({ ...shareResult, copied: true });
      setTimeout(() => {
        setShareResult({ ...shareResult, copied: false });
      }, 2000);
    } catch (error) {
      // Fallback dla starszych przeglądarek
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShareResult({ ...shareResult, copied: true });
      setTimeout(() => {
        setShareResult({ ...shareResult, copied: false });
      }, 2000);
    }
  };

  // Format daty
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

  // Sprawdź czy link wygasł
  const isExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
  };

  useEffect(() => {
    fetchMyShares();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className="mr-3">👥</span>
              Współdzielone notatki
            </h1>
            <p className="text-gray-600 mt-1">
              Zarządzaj linkami do swoich notatek
            </p>
          </div>
          <button
            onClick={() => onViewChange('notes')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
          >
            <span className="mr-2">📝</span>
            Wybierz notatkę do udostępnienia
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
          <div className="flex items-center">
            <span className="text-xl mr-2">⚠️</span>
            <span className="text-red-700">{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              ✖️
            </button>
          </div>
        </div>
      )}

      {/* Share Result Modal */}
      {shareResult && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShareResult(null)}></div>
            
            <div className="relative bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  🔗 Link utworzony!
                </h3>
                <button
                  onClick={() => setShareResult(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✖️
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 mb-2">✅ Link został utworzony pomyślnie!</p>
                  <div className="text-xs text-green-600">
                    <p>Uprawnienia: {shareResult.canEdit ? '📝 Odczyt i edycja' : '👁️ Tylko odczyt'}</p>
                    <p>Wygasa: {formatDate(shareResult.expiresAt)}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Link do udostępnienia:
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      value={shareResult.url}
                      readOnly
                      className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 bg-gray-50 text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(shareResult.url)}
                      className={`px-4 py-2 rounded-r-md border border-l-0 border-gray-300 transition-colors ${
                        shareResult.copied 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {shareResult.copied ? '✅' : '📋'}
                    </button>
                  </div>
                  {shareResult.copied && (
                    <p className="text-sm text-green-600 mt-1">Skopiowano do schowka!</p>
                  )}
                </div>

                <button
                  onClick={() => setShareResult(null)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  ✅ Gotowe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista udostępnionych notatek */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="mr-2">📋</span>
            Moje udostępnione notatki ({myShares.length})
          </h2>
        </div>

        <div className="p-6">
          {myShares.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔗</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Brak udostępnionych notatek
              </h3>
              <p className="text-gray-500 mb-6">
                Udostępnij swoje notatki tworząc bezpieczne linki
              </p>
              <button
                onClick={() => onViewChange('notes')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                📝 Przejdź do notatek
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myShares.map((share) => (
                <div
                  key={share.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    isExpired(share.expiresAt) 
                      ? 'border-red-200 bg-red-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {share.noteTitle}
                      </h4>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <span className="flex items-center">
                          <span className="mr-1">
                            {share.canEdit ? '📝' : '👁️'}
                          </span>
                          {share.canEdit ? 'Edycja dozwolona' : 'Tylko odczyt'}
                        </span>
                        <span className="flex items-center">
                          <span className="mr-1">📅</span>
                          Utworzony: {formatDate(share.createdAt)}
                        </span>
                        <span className={`flex items-center ${
                          isExpired(share.expiresAt) ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          <span className="mr-1">⏰</span>
                          {isExpired(share.expiresAt) ? 'Wygasł' : 'Wygasa'}: {formatDate(share.expiresAt)}
                        </span>
                      </div>

                      {!isExpired(share.expiresAt) && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={share.shareUrl}
                            readOnly
                            className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded px-2 py-1"
                          />
                          <button
                            onClick={() => copyToClipboard(share.shareUrl)}
                            className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded border hover:bg-blue-50"
                            title="Kopiuj link"
                          >
                            📋
                          </button>
                          <a
                            href={share.shareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-800 text-sm px-2 py-1 rounded border hover:bg-green-50"
                            title="Otwórz link"
                          >
                            🔗
                          </a>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => deleteShareLink(share.id)}
                      className="ml-4 text-red-500 hover:text-red-700 text-sm px-3 py-1 rounded border hover:bg-red-50 transition-colors"
                      title="Usuń link"
                    >
                      🗑️ Usuń
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instrukcja */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-medium text-blue-900 mb-3 flex items-center">
          <span className="mr-2">💡</span>
          Jak współdzielić notatkę?
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>Przejdź do listy swoich notatek</li>
          <li>Otwórz notatkę, którą chcesz udostępnić</li>
          <li>Kliknij przycisk "👥 Udostępnij" w edytorze</li>
          <li>Wybierz uprawnienia i czas wygaśnięcia</li>
          <li>Skopiuj utworzony link i wyślij go innym</li>
        </ol>
        
        <div className="mt-4 p-3 bg-blue-100 rounded">
          <p className="text-xs text-blue-700">
            <strong>🔒 Bezpieczeństwo:</strong> Linki automatycznie wygasają po określonym czasie. 
            Możesz je usunąć w każdej chwili. Osoby z linkiem mogą tylko przeglądać lub edytować 
            (w zależności od ustawień), ale nie mogą usuwać notatek.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShareNotesView;