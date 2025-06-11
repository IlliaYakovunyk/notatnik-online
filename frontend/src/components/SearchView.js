import React, { useState, useEffect, useRef } from 'react';

const SearchView = ({ onSelectNote }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const searchInputRef = useRef(null);

  // Pobierz ostatnie wyszukiwania z localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecentSearches(parsed);
        setSearchHistory(parsed);
      } catch (error) {
        console.error('Błąd parsowania ostatnich wyszukiwań:', error);
        localStorage.removeItem('recentSearches');
      }
    }
  }, []);

  // Focus na input przy załadowaniu
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Zapisz wyszukiwanie do historii
  const saveToHistory = (term) => {
    if (!term || term.trim().length < 2) return;
    
    const cleanTerm = term.trim();
    const updated = [cleanTerm, ...recentSearches.filter(s => s !== cleanTerm)].slice(0, 8);
    setRecentSearches(updated);
    setSearchHistory(updated);
    
    try {
      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (error) {
      console.error('Błąd zapisywania historii wyszukiwań:', error);
    }
  };

  // Wykonaj wyszukiwanie
  const performSearch = async (term) => {
    if (!term || term.trim().length < 1) {
      setResults([]);
      setError('');
      return;
    }

    const cleanTerm = term.trim();
    console.log('🔍 Wykonywanie wyszukiwania dla:', cleanTerm);
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Brak autoryzacji. Zaloguj się ponownie.');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/notes/search?q=${encodeURIComponent(cleanTerm)}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('📋 Odpowiedź serwera:', data);

      if (response.ok && data.success) {
        setResults(data.results || []);
        setError('');
        
        // Zapisz do historii tylko jeśli są wyniki lub wyszukiwanie było dłuższe niż 1 znak
        if (cleanTerm.length >= 2) {
          saveToHistory(cleanTerm);
        }
      } else {
        setError(data.message || 'Błąd wyszukiwania');
        setResults([]);
      }
    } catch (error) {
      console.error('❌ Błąd wyszukiwania:', error);
      setError('Błąd połączenia z serwerem');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search - wykonuj wyszukiwanie po 500ms od ostatniej zmiany
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm.trim().length > 0) {
        performSearch(searchTerm);
      } else {
        setResults([]);
        setError('');
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  // Wyróżnij wyszukiwane słowa
  const highlightText = (text, term) => {
    if (!term || !text) return text;
    
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded font-medium">{part}</mark>
      ) : part
    );
  };

  // Formatuj datę
  const formatDate = (dateString) => {
    try {
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
    } catch (error) {
      return 'nieznana data';
    }
  };

  // Wyczyść historię wyszukiwań
  const clearSearchHistory = () => {
    setRecentSearches([]);
    setSearchHistory([]);
    localStorage.removeItem('recentSearches');
  };

  // Przedefiniowane sugestie
  const suggestions = [
    'dzisiaj',
    'wczoraj',
    'ten tydzień',
    'ważne',
    'projekt',
    'notatka',
    'pomysł',
    'zadanie'
  ];

  // Obsługa klawiatury
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSearchTerm('');
      setShowSuggestions(false);
    }
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      if (searchTerm.trim()) {
        performSearch(searchTerm);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header wyszukiwania */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center mb-6">
          <div className="text-4xl mr-4">🔍</div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Wyszukaj w notatkach</h1>
            <p className="text-gray-500">Znajdź swoje notatki po tytule lub treści</p>
          </div>
        </div>

        {/* Pole wyszukiwania */}
        <div className="relative">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={handleKeyDown}
              placeholder="Wpisz słowo kluczowe aby wyszukać..."
              className="w-full pl-12 pr-12 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg transition-all duration-200"
            />
            
            {/* Ikona wyszukiwania */}
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-gray-400 text-2xl">🔍</span>
            </div>
            
            {/* Loading spinner lub przycisk czyszczenia */}
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              {loading ? (
                <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              ) : searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setResults([]);
                    setError('');
                    searchInputRef.current?.focus();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-xl"
                  title="Wyczyść wyszukiwanie"
                >
                  ✖️
                </button>
              )}
            </div>
          </div>

          {/* Status wyszukiwania */}
          <div className="mt-3 flex items-center justify-between text-sm">
            <div className="text-gray-500">
              {searchTerm ? (
                loading ? (
                  <span className="flex items-center">
                    <span className="animate-pulse">🔍</span>
                    <span className="ml-1">Wyszukiwanie...</span>
                  </span>
                ) : (
                  <span>
                    {error ? (
                      <span className="text-red-600">❌ {error}</span>
                    ) : (
                      <span className="text-green-600">
                        ✅ Znaleziono {results.length} {results.length === 1 ? 'wynik' : 'wyników'}
                      </span>
                    )}
                  </span>
                )
              ) : (
                'Wprowadź tekst aby rozpocząć wyszukiwanie'
              )}
            </div>
            
            {searchHistory.length > 0 && (
              <button
                onClick={clearSearchHistory}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Wyczyść historię"
              >
                🗑️ Wyczyść historię
              </button>
            )}
          </div>

          {/* Sugestie i historia */}
          {showSuggestions && (searchTerm.length === 0 || recentSearches.length > 0) && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-y-auto">
              {searchTerm.length === 0 && (
                <>
                  {recentSearches.length > 0 && (
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                        <span className="mr-2">🕒</span>
                        Ostatnie wyszukiwania:
                      </h3>
                      <div className="space-y-1">
                        {recentSearches.map((term, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSearchTerm(term);
                              setShowSuggestions(false);
                            }}
                            className="block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                          >
                            <span className="mr-2">🔍</span>
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <span className="mr-2">💡</span>
                      Sugestie:
                    </h3>
                    <div className="grid grid-cols-2 gap-1">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSearchTerm(suggestion);
                            setShowSuggestions(false);
                          }}
                          className="text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                        >
                          <span className="mr-2">✨</span>
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Szybkie filtry */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">🏷️ Szybkie filtry:</h3>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 6).map((filter) => (
              <button
                key={filter}
                onClick={() => setSearchTerm(filter)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition-all duration-200 hover:scale-105"
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Wyniki wyszukiwania */}
      <div>
        {searchTerm.length > 0 && !loading && (
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="mr-2">📋</span>
              Wyniki dla: "{searchTerm}"
            </h2>
            <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {results.length} {results.length === 1 ? 'notatka' : 'notatek'}
            </div>
          </div>
        )}

        {/* Lista wyników */}
        <div className="space-y-4">
          {results.length === 0 && searchTerm.length > 0 && !loading && !error && (
            <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Brak wyników
              </h3>
              <p className="text-gray-500 mb-6">
                Nie znaleziono notatek zawierających "<strong>{searchTerm}</strong>"
              </p>
              <div className="space-y-2 text-sm text-gray-400">
                <p>💡 Spróbuj:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Sprawdzić pisownię</li>
                  <li>Użyć innych słów kluczowych</li>
                  <li>Skrócić wyszukiwane frazy</li>
                  <li>Sprawdzić czy masz notatki w systemie</li>
                </ul>
              </div>
            </div>
          )}

          {results.map((note) => (
            <div
              key={note.id}
              onClick={() => onSelectNote(note)}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group hover:border-blue-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {highlightText(note.title, searchTerm)}
                  </h3>
                  
                  {note.content && (
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {highlightText(
                        note.content.length > 250 
                          ? note.content.substring(0, 250) + '...' 
                          : note.content, 
                        searchTerm
                      )}
                    </p>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-500 space-x-6">
                    <span className="flex items-center">
                      <span className="mr-1">📅</span>
                      Aktualizowana {formatDate(note.updated_at)}
                    </span>
                    <span className="flex items-center">
                      <span className="mr-1">🔤</span>
                      {note.content?.length || 0} znaków
                    </span>
                    <span className="flex items-center">
                      <span className="mr-1">⏱️</span>
                      ~{Math.ceil((note.content?.split(' ').length || 0) / 200)} min czytania
                    </span>
                  </div>
                </div>
                
                <div className="ml-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
                  <span className="text-3xl">▶️</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Placeholder gdy brak wyszukiwania */}
        {searchTerm.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-gray-200">
            <div className="text-6xl mb-6">💡</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Rozpocznij wyszukiwanie
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Wpisz słowo kluczowe w polu powyżej, aby znaleźć swoje notatki. 
              Możesz wyszukiwać po tytule lub treści notatki.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl mb-2">🎯</div>
                <h4 className="font-medium text-blue-900 mb-1">Precyzyjne wyszukiwanie</h4>
                <p className="text-blue-700">Używaj konkretnych słów kluczowych</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl mb-2">⚡</div>
                <h4 className="font-medium text-green-900 mb-1">Szybkie rezultaty</h4>
                <p className="text-green-700">Wyniki pojawiają się podczas pisania</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl mb-2">📱</div>
                <h4 className="font-medium text-purple-900 mb-1">Historia wyszukiwań</h4>
                <p className="text-purple-700">Zapisujemy Twoje ostatnie wyszukiwania</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchView;