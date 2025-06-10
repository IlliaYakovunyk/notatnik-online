import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const SearchView = ({ onSelectNote }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef(null);

  // Pobierz ostatnie wyszukiwania z localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Błąd parsowania ostatnich wyszukiwań:', error);
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
    if (term.trim().length < 2) return;
    
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Wykonaj wyszukiwanie
  const performSearch = async (term) => {
    if (term.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/notes/search?q=${encodeURIComponent(term)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setResults(response.data.results || []);
        saveToHistory(term);
      }
    } catch (error) {
      console.error('Błąd wyszukiwania:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      performSearch(searchTerm);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  // Wyróżnij wyszukiwane słowa
  const highlightText = (text, term) => {
    if (!term || !text) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark>
      ) : part
    );
  };

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

  const suggestions = [
    '📝 wszystkie notatki',
    '🌟 ważne',
    '📅 dzisiaj',
    '📋 projekty',
    '💡 pomysły'
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header wyszukiwania */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center mb-4">
          <div className="text-3xl mr-3">🔍</div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Wyszukaj w notatkach</h1>
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
              placeholder="Wpisz słowo kluczowe..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-xl">🔍</span>
            </div>
            {loading && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>

          {/* Sugestie */}
          {showSuggestions && (searchTerm.length === 0 || recentSearches.length > 0) && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
              {searchTerm.length === 0 && (
                <div className="p-3 border-b border-gray-100">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Sugestie wyszukiwania:</h3>
                  <div className="space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setSearchTerm(suggestion.substring(2))}
                        className="block w-full text-left px-2 py-1 rounded hover:bg-gray-50 text-sm text-gray-700"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {recentSearches.length > 0 && (
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Ostatnie wyszukiwania:</h3>
                  <div className="space-y-1">
                    {recentSearches.map((term, index) => (
                      <button
                        key={index}
                        onClick={() => setSearchTerm(term)}
                        className="block w-full text-left px-2 py-1 rounded hover:bg-gray-50 text-sm text-gray-700 flex items-center"
                      >
                        <span className="mr-2">🕒</span>
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Szybkie filtry */}
        <div className="mt-4 flex flex-wrap gap-2">
          {['dzisiaj', 'wczoraj', 'ten tydzień', 'ważne', 'długie'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSearchTerm(filter)}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm transition-colors"
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Wyniki wyszukiwania */}
      <div>
        {searchTerm.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {loading ? 'Wyszukiwanie...' : `Wyniki dla "${searchTerm}"`}
            </h2>
            {!loading && (
              <span className="text-sm text-gray-500">
                {results.length} {results.length === 1 ? 'wynik' : 'wyników'}
              </span>
            )}
          </div>
        )}

        {/* Lista wyników */}
        <div className="space-y-4">
          {results.length === 0 && searchTerm.length > 0 && !loading && (
            <div className="bg-white rounded-lg p-8 text-center border">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Brak wyników
              </h3>
              <p className="text-gray-500 mb-4">
                Nie znaleziono notatek zawierających "{searchTerm}"
              </p>
              <div className="text-sm text-gray-400">
                Spróbuj innych słów kluczowych lub sprawdź pisownię
              </div>
            </div>
          )}

          {results.map((note) => (
            <div
              key={note.id}
              onClick={() => onSelectNote(note)}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {highlightText(note.title, searchTerm)}
                  </h3>
                  
                  {note.content && (
                    <p className="text-gray-600 mb-3 line-clamp-3">
                      {highlightText(
                        note.content.length > 200 
                          ? note.content.substring(0, 200) + '...' 
                          : note.content, 
                        searchTerm
                      )}
                    </p>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-500 space-x-4">
                    <span className="flex items-center">
                      <span className="mr-1">📅</span>
                      {formatDate(note.updated_at)}
                    </span>
                    <span className="flex items-center">
                      <span className="mr-1">🔤</span>
                      {note.content?.length || 0} znaków
                    </span>
                  </div>
                </div>
                
                <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-2xl">▶️</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Placeholder gdy brak wyszukiwania */}
        {searchTerm.length === 0 && (
          <div className="bg-white rounded-lg p-8 text-center border">
            <div className="text-6xl mb-4">💡</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Rozpocznij wyszukiwanie
            </h3>
            <p className="text-gray-500 mb-4">
              Wpisz słowo kluczowe w polu powyżej, aby znaleźć swoje notatki
            </p>
            <div className="text-sm text-gray-400">
              Możesz wyszukiwać po tytule lub treści notatki
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchView;