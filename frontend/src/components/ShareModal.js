import React, { useState } from 'react';
import axios from 'axios';

const ShareModal = ({ note, isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [canEdit, setCanEdit] = useState(false);
  const [expiresIn, setExpiresIn] = useState(7);
  const [copied, setCopied] = useState(false);

  const createShareLink = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/notes/${note.id}/share`, {
        canEdit,
        expiresIn
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setShareLink(response.data.shareLink);
        onSuccess && onSuccess('Link utworzony pomyślnie! 🔗');
      }
    } catch (error) {
      console.error('Błąd tworzenia linka:', error);
      onSuccess && onSuccess('Błąd tworzenia linka', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback dla starszych przeglądarek
      const textArea = document.createElement('textarea');
      textArea.value = shareLink.url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setShareLink(null);
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        ></div>

        {/* Modal */}
        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="mr-2">🔗</span>
              Udostępnij notatkę
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="text-xl">✖️</span>
            </button>
          </div>

          {/* Note info */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-1">{note.title}</h4>
            <p className="text-sm text-gray-500">
              {note.content ? 
                (note.content.length > 100 ? 
                  note.content.substring(0, 100) + '...' : 
                  note.content
                ) : 
                'Pusta notatka'
              }
            </p>
          </div>

          {!shareLink ? (
            // Formularz tworzenia linka
            <div className="space-y-4">
              {/* Uprawnienia */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={canEdit}
                    onChange={(e) => setCanEdit(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Pozwól na edycję (tylko odczyt jeśli odznaczone)
                  </span>
                </label>
              </div>

              {/* Czas wygaśnięcia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link ważny przez:
                </label>
                <select
                  value={expiresIn}
                  onChange={(e) => setExpiresIn(parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1 dzień</option>
                  <option value={7}>7 dni</option>
                  <option value={30}>30 dni</option>
                  <option value={90}>90 dni</option>
                </select>
              </div>

              {/* Przycisk tworzenia */}
              <button
                onClick={createShareLink}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Tworzenie...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🔗</span>
                    Utwórz link
                  </>
                )}
              </button>
            </div>
          ) : (
            // Wyświetlanie gotowego linka
            <div className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800 mb-2">
                  ✅ Link utworzony pomyślnie!
                </p>
                <div className="text-xs text-green-600">
                  <p>Uprawnienia: {canEdit ? '📝 Odczyt i edycja' : '👁️ Tylko odczyt'}</p>
                  <p>Wygasa: {new Date(shareLink.expiresAt).toLocaleDateString('pl-PL')}</p>
                </div>
              </div>

              {/* Link */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Link do udostępnienia:
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={shareLink.url}
                    readOnly
                    className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 bg-gray-50 text-sm focus:outline-none"
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`px-4 py-2 rounded-r-md border border-l-0 border-gray-300 transition-colors ${
                      copied 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {copied ? '✅' : '📋'}
                  </button>
                </div>
                {copied && (
                  <p className="text-sm text-green-600">Skopiowano do schowka!</p>
                )}
              </div>

              {/* Przyciski */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShareLink(null)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  🔄 Nowy link
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  ✅ Gotowe
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;