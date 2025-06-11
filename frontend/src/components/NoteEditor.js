import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const BeautifulNoteEditor = ({ note, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [wordCount, setWordCount] = useState({ words: 0, characters: 0, lines: 0 });
  const [lastSaved, setLastSaved] = useState(null);
  const [focusMode, setFocusMode] = useState(false);

  const contentRef = useRef(null);
  const titleRef = useRef(null);

  const getToken = () => localStorage.getItem('token');

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
    setLastSaved(null);
  }, [note]);

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    const characters = content.length;
    const lines = content.split('\n').length;
    setWordCount({ words, characters, lines });
  }, [content]);

  const saveNote = async (showNotification = true) => {
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
        response = await axios.put(`/api/notes/${note.id}`, {
          title: title.trim(),
          content: content.trim()
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        response = await axios.post('/api/notes', {
          title: title.trim(),
          content: content.trim()
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (response.data.success) {
        if (showNotification) {
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }
        setLastSaved(new Date());
        onSave(response.data.note);
      }
    } catch (error) {
      console.error('Błąd zapisywania notatki:', error);
      setError(error.response?.data?.message || 'Błąd zapisywania notatki');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!title && !content) return;

    const autoSaveTimer = setTimeout(() => {
      if (title.trim() && (note?.id || content.trim())) {
        saveNote(false);
      }
    }, 30000);

    return () => clearTimeout(autoSaveTimer);
  }, [title, content]);

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveNote();
    }
    
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      insertFormatting('**', '**');
    }
    
    if (e.ctrlKey && e.key === 'i') {
      e.preventDefault();
      insertFormatting('*', '*');
    }
    
    if (e.key === 'F11') {
      e.preventDefault();
      setIsFullscreen(!isFullscreen);
    }
    
    if (e.key === 'Escape') {
      if (isFullscreen) {
        setIsFullscreen(false);
      } else if (focusMode) {
        setFocusMode(false);
      }
    }
  };

  const insertFormatting = (before, after, placeholder = 'tekst') => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newContent = 
      content.substring(0, start) + 
      before + textToInsert + after + 
      content.substring(end);
    
    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.selectionStart = start + before.length;
        textarea.selectionEnd = start + before.length + selectedText.length;
      } else {
        textarea.selectionStart = textarea.selectionEnd = start + before.length + placeholder.length;
      }
    }, 0);
  };

  const formatLastSaved = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'teraz';
    if (diff < 3600) return `${Math.floor(diff / 60)} min temu`;
    return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMarkdownPreview = (text) => {
    if (!text) return '<div class="text-gray-400 text-center py-12"><div class="text-4xl mb-4">📝</div><p>Zacznij pisać, aby zobaczyć podgląd</p></div>';
    
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 mb-1">• $1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 mb-1">$1. $2</li>')
      .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold mb-4 mt-6 text-gray-900 border-b-2 border-blue-200 pb-2">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-semibold mb-3 mt-5 text-gray-800">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-xl font-medium mb-2 mt-4 text-gray-700">$1</h3>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-blue-400 pl-4 py-2 my-4 bg-blue-50 italic text-gray-700">$1</blockquote>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-red-600">$1</code>')
      .replace(/\n\n/g, '</p><p class="mb-4 text-gray-600 leading-relaxed">')
      .replace(/\n/g, '<br/>')
      .replace(/^(.+)$/, '<p class="mb-4 text-gray-600 leading-relaxed">$1</p>');
  };

  const toolbarButtons = [
    { icon: '𝐁', action: () => insertFormatting('**', '**'), title: 'Pogrubienie (Ctrl+B)', style: 'font-bold' },
    { icon: '𝐼', action: () => insertFormatting('*', '*'), title: 'Kursywa (Ctrl+I)', style: 'italic' },
    { icon: '—', action: () => insertFormatting('- ', ''), title: 'Lista punktowana' },
    { icon: '1.', action: () => insertFormatting('1. ', ''), title: 'Lista numerowana' },
    { icon: 'H₁', action: () => insertFormatting('# ', ''), title: 'Nagłówek główny' },
    { icon: 'H₂', action: () => insertFormatting('## ', ''), title: 'Podtytuł' },
    { icon: '""', action: () => insertFormatting('> ', ''), title: 'Cytat' },
    { icon: '</>', action: () => insertFormatting('`', '`'), title: 'Kod inline' },
  ];

  return (
    <div 
      className={`
        ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'} 
        ${focusMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'}
        flex flex-col transition-all duration-500 ease-in-out
      `}
      onKeyDown={handleKeyDown} 
      tabIndex={-1}
    >
      {/* Header */}
      <div className={`
        ${focusMode ? 'opacity-20 hover:opacity-100' : 'opacity-100'} 
        ${focusMode ? 'bg-gray-800 text-white' : 'bg-white/80 backdrop-blur-sm'} 
        border-b transition-all duration-300 ease-in-out shadow-sm
      `}>
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
            
            <h2 className={`text-xl font-semibold ${focusMode ? 'text-white' : 'text-gray-800'} transition-colors duration-300`}>
              {note ? '✏️ Edytuj Notatkę' : '📝 Nowa Notatka'}
            </h2>
            
            {lastSaved && (
              <div className={`
                ${saved ? 'scale-110' : 'scale-100'} 
                transition-all duration-300 ease-out
                ${focusMode ? 'text-green-400' : 'text-green-600'}
                text-sm flex items-center space-x-1
              `}>
                <span className={`${saved ? 'animate-pulse' : ''}`}>💾</span>
                <span>Zapisano {formatLastSaved(lastSaved)}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {saved && (
              <div className="animate-bounce">
                <span className="text-green-500 text-sm font-medium bg-green-100 px-3 py-1 rounded-full">
                  ✅ Zapisano!
                </span>
              </div>
            )}
            
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={`
                px-3 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105
                ${focusMode 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25' 
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }
              `}
              title="Tryb koncentracji"
            >
              {focusMode ? '🎯 Focus ON' : '🎯 Focus'}
            </button>
            
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`
                px-3 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105
                ${showPreview 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }
              `}
            >
              {showPreview ? '📝 Edycja' : '👁️ Podgląd'}
            </button>
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`
                px-3 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105
                ${isFullscreen 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
                  : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                }
              `}
              title="Pełny ekran (F11)"
            >
              {isFullscreen ? '🗗 Okno' : '🗖 Pełny'}
            </button>
            
            <button
              onClick={() => saveNote()}
              disabled={saving || !title.trim()}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all duration-300 transform
                ${saving || !title.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed scale-95'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-105'
                }
              `}
            >
              {saving ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Zapisywanie...</span>
                </div>
              ) : (
                '💾 Zapisz'
              )}
            </button>
            
            {!isFullscreen && (
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all duration-300 transform hover:scale-105"
              >
                ❌ Anuluj
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar formatowania */}
      {!showPreview && (
        <div className={`
          ${focusMode ? 'opacity-20 hover:opacity-100 bg-gray-800' : 'bg-white/60 backdrop-blur-sm'} 
          border-b transition-all duration-300 ease-in-out
        `}>
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center space-x-2">
              {toolbarButtons.map((btn, index) => (
                <button
                  key={index}
                  onClick={btn.action}
                  className={`
                    px-3 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-110
                    ${focusMode 
                      ? 'bg-gray-700 text-white hover:bg-gray-600' 
                      : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow-md'
                    }
                    ${btn.style || ''}
                  `}
                  title={btn.title}
                >
                  {btn.icon}
                </button>
              ))}
            </div>
            
            <div className={`text-sm ${focusMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>
              ⌨️ Skróty: Ctrl+S, Ctrl+B, Ctrl+I, F11, Esc
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="animate-slide-down">
          <div className="mx-4 mt-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-r-lg shadow-sm">
            <div className="flex items-center">
              <span className="text-xl mr-2">⚠️</span>
              {error}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 p-4 flex flex-col overflow-hidden">
        {/* Tytuł */}
        <div className="mb-4">
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Wprowadź tytuł swojej notatki..."
            className={`
              w-full px-6 py-4 text-2xl font-bold rounded-xl border-2 transition-all duration-300
              ${focusMode 
                ? 'bg-gray-800 text-white border-gray-600 placeholder-gray-400 focus:border-purple-500' 
                : 'bg-white/70 backdrop-blur-sm text-gray-800 border-gray-200 placeholder-gray-400 focus:border-blue-500 focus:bg-white'
              }
              focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-sm focus:shadow-lg transform focus:scale-[1.02]
            `}
          />
        </div>

        {/* Treść lub Podgląd */}
        <div className="flex-1 flex flex-col min-h-0">
          {showPreview ? (
            <div className={`
              flex-1 p-6 rounded-xl overflow-auto transition-all duration-300
              ${focusMode 
                ? 'bg-gray-800 text-white' 
                : 'bg-white/70 backdrop-blur-sm'
              }
              border-2 border-gray-200 shadow-sm
            `}>
              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: renderMarkdownPreview(content)
                }}
              />
            </div>
          ) : (
            <textarea
              ref={contentRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Zacznij pisać swoją historię...

✨ Wskazówki formatowania:
• **tekst** - pogrubienie
• *tekst* - kursywa  
• # Nagłówek - główny tytuł
• ## Podtytuł - mniejszy nagłówek
• - Lista - punkty
• > Cytat - wyróżniony tekst
• `kod` - fragment kodu

⌨️ Skróty klawiszowe:
• Ctrl+S - zapisz
• Ctrl+B - pogrubienie
• Ctrl+I - kursywa
• F11 - pełny ekran
• Esc - wyjście z trybów"
              className={`
                flex-1 w-full p-6 rounded-xl border-2 resize-none transition-all duration-300
                ${focusMode 
                  ? 'bg-gray-800 text-white border-gray-600 placeholder-gray-400 focus:border-purple-500' 
                  : 'bg-white/70 backdrop-blur-sm text-gray-800 border-gray-200 placeholder-gray-400 focus:border-blue-500 focus:bg-white'
                }
                focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-sm focus:shadow-lg
                font-mono text-base leading-relaxed
              `}
            />
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className={`
        ${focusMode ? 'opacity-20 hover:opacity-100 bg-gray-800 text-white' : 'bg-white/80 backdrop-blur-sm'} 
        border-t transition-all duration-300 ease-in-out
      `}>
        <div className="p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-1">
                <span className="text-2xl">📝</span>
                <span className="text-sm font-medium">
                  <span className="text-blue-600 font-bold">{wordCount.words}</span> słów
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <span className="text-2xl">🔤</span>
                <span className="text-sm font-medium">
                  <span className="text-green-600 font-bold">{wordCount.characters}</span> znaków
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <span className="text-2xl">📏</span>
                <span className="text-sm font-medium">
                  <span className="text-purple-600 font-bold">{wordCount.lines}</span> linii
                </span>
              </div>
              
              {content.length > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="text-2xl">⏱️</span>
                  <span className="text-sm font-medium">
                    ~<span className="text-orange-600 font-bold">{Math.ceil(wordCount.words / 200)}</span> min czytania
                  </span>
                </div>
              )}
            </div>
            
            <div className={`text-xs ${focusMode ? 'text-gray-400' : 'text-gray-500'} transition-colors duration-300`}>
              🔄 Auto-zapis aktywny • Ostatnio: {lastSaved ? formatLastSaved(lastSaved) : 'nigdy'}
            </div>
          </div>
          
          {note && (
            <div className={`flex justify-between items-center text-xs ${focusMode ? 'text-gray-500' : 'text-gray-400'} mt-3 pt-3 border-t border-gray-200 transition-colors duration-300`}>
              <div className="flex items-center space-x-4">
                <span>📅 Utworzona: {new Date(note.created_at).toLocaleDateString('pl-PL', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
                <span>🔄 Aktualizowana: {new Date(note.updated_at).toLocaleDateString('pl-PL', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
              
              <div>
                💡 Tryb koncentracji dostępny - naciśnij przycisk Focus
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
        
        textarea::-webkit-scrollbar {
          width: 8px;
        }
        
        textarea::-webkit-scrollbar-track {
          background: transparent;
        }
        
        textarea::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 4px;
        }
        
        textarea::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.8);
        }
      `}</style>
    </div>
  );
};

export default BeautifulNoteEditor;