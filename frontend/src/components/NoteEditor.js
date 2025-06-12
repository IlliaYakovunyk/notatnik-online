import React, { useState, useEffect, useRef, useCallback } from 'react';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import 'highlight.js/styles/github.css';

const EnhancedNoteEditor = ({ note, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewMode, setPreviewMode] = useState('edit');
  const [wordCount, setWordCount] = useState({ words: 0, characters: 0, lines: 0 });
  const [lastSaved, setLastSaved] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);

  const titleRef = useRef(null);
  const autoSaveInterval = useRef(null);
  const saveTimeoutRef = useRef(null);

  const getToken = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Inicializuj dane przy ładowaniu notatki
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
    } else {
      setTitle('');
      setContent('# Nowa Notatka\n\nZacznij pisać swoją historię...\n\n## Przykładowe formatowanie:\n\n- **Pogrubiony tekst**\n- *Kursywa*\n- `Kod inline`\n\n```javascript\n// Blok kodu\nconsole.log("Hello World!");\n```\n\n> Cytat\n\n### Lista zadań:\n- [ ] Zadanie 1\n- [x] Ukończone zadanie\n- [ ] Zadanie 3');
    }
    setError('');
    setSaved(false);
    setLastSaved(null);
  }, [note]);

  // Oblicz statystyki tekstu
  useEffect(() => {
    const text = content || '';
    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const characters = text.length;
    const lines = text.split('\n').length;
    setWordCount({ words, characters, lines });
  }, [content]);

  // Focus na tytule przy nowej notatce
  useEffect(() => {
    if (!note && titleRef.current) {
      titleRef.current.focus();
    }
  }, [note]);

  // Zapisz notatkę
  const saveNote = useCallback(async (showNotification = true) => {
    if (!title.trim()) {
      setError('Tytuł notatki jest wymagany');
      return false;
    }

    try {
      setSaving(true);
      setError('');
      const token = getToken();

      if (!token) {
        setError('Brak autoryzacji. Zaloguj się ponownie.');
        return false;
      }

      const apiUrl = note?.id ? `/api/notes/${note.id}` : '/api/notes';
      const method = note?.id ? 'PUT' : 'POST';

      const response = await fetch(apiUrl, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        if (showNotification) {
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }
        setLastSaved(new Date());
        if (onSave) {
          onSave(data.note);
        }
        return true;
      } else {
        setError(data.message || 'Błąd zapisywania');
        return false;
      }
    } catch (error) {
      console.error('Błąd zapisywania notatki:', error);
      setError('Błąd połączenia z serwerem');
      return false;
    } finally {
      setSaving(false);
    }
  }, [title, content, note, onSave]);

  // Auto-save funkcjonalność
  useEffect(() => {
    if (autoSaveEnabled && (title.trim() || content.trim())) {
      // Wyczyść poprzedni timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Ustaw nowy timeout na 30 sekund
      saveTimeoutRef.current = setTimeout(() => {
        if (title.trim()) {
          saveNote(false);
        }
      }, 30000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content, autoSaveEnabled, saveNote]);

  // Skróty klawiszowe
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            saveNote();
            break;
          case 'b':
            e.preventDefault();
            insertMarkdown('**', '**', 'pogrubiony tekst');
            break;
          case 'i':
            e.preventDefault();
            insertMarkdown('*', '*', 'kursywa');
            break;
          case 'k':
            e.preventDefault();
            insertMarkdown('[', '](URL)', 'tekst linku');
            break;
          case 'Enter':
            if (e.shiftKey) {
              e.preventDefault();
              saveNote();
            }
            break;
          default:
            break;
        }
      }

      if (e.key === 'F11') {
        e.preventDefault();
        setIsFullscreen(!isFullscreen);
      }

      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [saveNote, isFullscreen]);

  // Wstaw formatowanie Markdown
  const insertMarkdown = (before, after, placeholder = 'tekst') => {
    const textarea = document.querySelector('.w-md-editor-text-textarea');
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

  // Format daty
  const formatDate = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return 'teraz';
    if (diff < 3600) return `${Math.floor(diff / 60)} min temu`;
    return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  };

  // Eksportuj do różnych formatów
  const exportNote = async (format) => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${title || 'notatka'}_${timestamp}`;
      
      switch (format) {
        case 'markdown':
          const mdContent = `# ${title}\n\n${content}`;
          downloadFile(mdContent, `${filename}.md`, 'text/markdown');
          break;
          
        case 'html':
          const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #333; }
    code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <pre>${content}</pre>
</body>
</html>`;
          downloadFile(htmlContent, `${filename}.html`, 'text/html');
          break;
          
        case 'txt':
          const txtContent = `${title}\n${'='.repeat(title.length)}\n\n${content}`;
          downloadFile(txtContent, `${filename}.txt`, 'text/plain');
          break;
          
        default:
          setError('Nieznany format eksportu');
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
      setError('Błąd eksportu pliku');
    }
  };

  // Pobierz plik
  const downloadFile = (content, filename, mimeType) => {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      setError('Błąd pobierania pliku');
    }
  };

  // Wstaw template
  const insertTemplate = (templateType) => {
    const templates = {
      meeting: `# Spotkanie - ${new Date().toLocaleDateString('pl-PL')}

## Uczestnicy
- 
- 

## Agenda
1. 
2. 
3. 

## Notatki
- 

## Akcje do wykonania
- [ ] 
- [ ] 

## Następne kroki
- `,
      
      article: `# Tytuł artykułu

## Wprowadzenie
Krótkie wprowadzenie do tematu...

## Główna treść

### Podsekcja 1
Treść...

### Podsekcja 2
Treść...

## Podsumowanie
Główne wnioski...

## Źródła
- [Link 1](URL)
- [Link 2](URL)`,

      todo: `# Lista zadań - ${new Date().toLocaleDateString('pl-PL')}

## Priorytet wysoki 🔥
- [ ] 
- [ ] 

## Priorytet średni ⚡
- [ ] 
- [ ] 

## Priorytet niski 📝
- [ ] 
- [ ] 

## Ukończone ✅
- [x] Przykład ukończonego zadania`,

      project: `# Projekt: [Nazwa]

## Opis
Krótki opis projektu...

## Cele
- [ ] Cel 1
- [ ] Cel 2
- [ ] Cel 3

## Timeline
- **Faza 1**: Data - Data
- **Faza 2**: Data - Data
- **Faza 3**: Data - Data

## Zasoby
- **Budget**: 
- **Zespół**: 
- **Narzędzia**: 

## Postęp
- [ ] Zadanie 1
- [ ] Zadanie 2
- [ ] Zadanie 3`
    };

    setContent(templates[templateType] || '');
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <>
      <div 
        className={`${
          isFullscreen ? 'fixed inset-0 z-50' : 'h-full'
        } ${
          darkMode ? 'bg-gray-900' : 'bg-gray-50'
        } flex flex-col transition-all duration-300`}
        data-color-mode={darkMode ? 'dark' : 'light'}
      >
        {/* Header */}
        <div className={`
          ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
          border-b shadow-sm transition-all duration-300
        `}>
          <div className="flex justify-between items-center p-4">
            <div className="flex items-center space-x-4">
              <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {note ? '✏️ Edytuj Notatkę' : '📝 Nowa Notatka'}
              </h2>
              
              {lastSaved && (
                <div className={`
                  ${saved ? 'scale-110 animate-slide-down' : 'scale-100'} 
                  transition-all duration-300 ease-out
                  ${darkMode ? 'text-green-400' : 'text-green-600'}
                  text-sm flex items-center space-x-1
                `}>
                  <span className={`${saved ? 'animate-pulse' : ''}`}>💾</span>
                  <span>Zapisano {formatDate(lastSaved)}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Notification */}
              {saved && (
                <div className="animate-bounce">
                  <span className="text-green-500 text-sm font-medium bg-green-100 px-3 py-1 rounded-full">
                    ✅ Zapisano!
                  </span>
                </div>
              )}

              {/* Templates */}
              <div className="relative group">
                <button
                  className={`
                    px-3 py-2 rounded-lg font-medium transition-all duration-300
                    ${darkMode 
                      ? 'bg-purple-600 text-white hover:bg-purple-700' 
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }
                  `}
                  title="Szablony"
                >
                  📋 Szablony
                </button>
                
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="p-2">
                    {[
                      { key: 'meeting', label: '🤝 Spotkanie', desc: 'Notatki ze spotkania' },
                      { key: 'article', label: '📄 Artykuł', desc: 'Struktura artykułu' },
                      { key: 'todo', label: '✅ Lista zadań', desc: 'Organizacja zadań' },
                      { key: 'project', label: '🚀 Projekt', desc: 'Plan projektu' }
                    ].map(template => (
                      <button
                        key={template.key}
                        onClick={() => insertTemplate(template.key)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 transition-colors"
                      >
                        <div className="font-medium text-sm">{template.label}</div>
                        <div className="text-xs text-gray-500">{template.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Export */}
              <div className="relative group">
                <button
                  className={`
                    px-3 py-2 rounded-lg font-medium transition-all duration-300
                    ${darkMode 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }
                  `}
                  title="Eksportuj"
                >
                  📤 Eksport
                </button>
                
                <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="p-2">
                    {[
                      { format: 'markdown', label: '📝 Markdown', ext: '.md' },
                      { format: 'html', label: '🌐 HTML', ext: '.html' },
                      { format: 'txt', label: '📄 Tekst', ext: '.txt' }
                    ].map(exportOption => (
                      <button
                        key={exportOption.format}
                        onClick={() => exportNote(exportOption.format)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 transition-colors text-sm"
                      >
                        {exportOption.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Settings */}
              <button
                onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                className={`
                  px-3 py-2 rounded-lg font-medium transition-all duration-300
                  ${autoSaveEnabled
                    ? (darkMode ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700')
                    : (darkMode ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700')
                  }
                `}
                title={`Auto-zapis: ${autoSaveEnabled ? 'włączony' : 'wyłączony'}`}
              >
                {autoSaveEnabled ? '💾 Auto' : '💾 Ręcznie'}
              </button>

              {/* Dark mode toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`
                  px-3 py-2 rounded-lg font-medium transition-all duration-300
                  ${darkMode 
                    ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
                title="Tryb ciemny"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>

              {/* Fullscreen */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={`
                  px-3 py-2 rounded-lg font-medium transition-all duration-300
                  ${isFullscreen 
                    ? (darkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700')
                    : (darkMode ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700')
                  }
                `}
                title="Pełny ekran (F11)"
              >
                {isFullscreen ? '🗗' : '🗖'}
              </button>
              
              {/* Save button */}
              <button
                onClick={() => saveNote()}
                disabled={saving || !title.trim()}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-all duration-300 transform
                  ${saving || !title.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed scale-95'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:scale-105'
                  }
                `}
              >
                {saving ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Zapisywanie...</span>
                  </div>
                ) : (
                  '💾 Zapisz (Ctrl+S)'
                )}
              </button>
              
              {!isFullscreen && (
                <button
                  onClick={handleCancel}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-all duration-300
                    ${darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }
                  `}
                >
                  ❌ Anuluj
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-r-lg shadow-sm animate-slide-down">
            <div className="flex items-center">
              <span className="text-xl mr-2">⚠️</span>
              {error}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 p-4 flex flex-col overflow-hidden">
          {/* Title */}
          <div className="mb-4">
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Wprowadź tytuł swojej notatki..."
              className={`
                w-full px-6 py-4 text-2xl font-bold rounded-xl border-2 transition-all duration-300
                ${darkMode 
                  ? 'bg-gray-800 text-white border-gray-600 placeholder-gray-400 focus:border-purple-500' 
                  : 'bg-white text-gray-800 border-gray-200 placeholder-gray-400 focus:border-blue-500'
                }
                focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-sm focus:shadow-lg
              `}
            />
          </div>

          {/* Markdown Editor */}
          <div className="flex-1 flex flex-col min-h-0">
            <MDEditor
              value={content}
              onChange={(val) => setContent(val || '')}
              preview={previewMode}
              hideToolbar={false}
              visibleDragBar={false}
              height={400}
              data-color-mode={darkMode ? 'dark' : 'light'}
              textareaProps={{
                placeholder: `Zacznij pisać swoją notatkę...

💡 Wskazówki Markdown:
• **pogrubiony tekst** lub __pogrubiony tekst__
• *kursywa* lub _kursywa_
• # Nagłówek H1
• ## Nagłówek H2
• ### Nagłówek H3
• [link](URL)
• ![obraz](URL)
• \`kod inline\`
• > cytat
• - lista punktowana
• 1. lista numerowana
• - [ ] zadanie do wykonania
• - [x] ukończone zadanie

⌨️ Skróty:
• Ctrl+S - zapisz
• Ctrl+B - pogrubienie
• Ctrl+I - kursywa
• Ctrl+K - link
• F11 - pełny ekran`,
                style: {
                  fontSize: '16px',
                  lineHeight: '1.6',
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
                }
              }}
            />
          </div>
        </div>

        {/* Status Bar */}
        <div className={`
          ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200'} 
          border-t transition-all duration-300
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

                <div className="flex items-center space-x-1">
                  <span className="text-2xl">{autoSaveEnabled ? '🔄' : '💾'}</span>
                  <span className="text-sm font-medium">
                    {autoSaveEnabled ? 'Auto-zapis włączony' : 'Zapis ręczny'}
                  </span>
                </div>
              </div>
              
              <div className={`flex items-center space-x-4 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <span>💡 Markdown obsługiwany</span>
                <span>🔄 Ostatnio: {lastSaved ? formatDate(lastSaved) : 'nigdy'}</span>
                <button
                  onClick={() => setShowMetadata(!showMetadata)}
                  className="hover:underline"
                >
                  {showMetadata ? '📊 Ukryj info' : '📊 Pokaż info'}
                </button>
              </div>
            </div>
            
            {/* Metadata panel */}
            {showMetadata && note && (
              <div className={`mt-3 pt-3 border-t border-gray-200 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} grid grid-cols-2 gap-4`}>
                <div>
                  <span className="font-medium">📅 Utworzona:</span> {new Date(note.created_at).toLocaleString('pl-PL')}
                </div>
                <div>
                  <span className="font-medium">🔄 Zaktualizowana:</span> {new Date(note.updated_at).toLocaleString('pl-PL')}
                </div>
                <div>
                  <span className="font-medium">🆔 ID notatki:</span> {note.id}
                </div>
                <div>
                  <span className="font-medium">📝 Typ:</span> Markdown
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom CSS Styles */}
      <style>{`
        .animate-slide-down {
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default EnhancedNoteEditor;