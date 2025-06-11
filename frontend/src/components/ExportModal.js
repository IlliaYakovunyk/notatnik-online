import React, { useState } from 'react';
import axios from 'axios';

const ExportModal = ({ isOpen, onClose, onSuccess }) => {
  const [exporting, setExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('json');

  const exportFormats = [
    {
      value: 'json',
      label: 'JSON',
      icon: '📄',
      description: 'Strukturalne dane do importu',
      extension: '.json'
    },
    {
      value: 'txt',
      label: 'Tekst',
      icon: '📝',
      description: 'Zwykły tekst, łatwy do odczytu',
      extension: '.txt'
    },
    {
      value: 'md',
      label: 'Markdown',
      icon: '📋',
      description: 'Format Markdown z formatowaniem',
      extension: '.md'
    },
    {
      value: 'csv',
      label: 'CSV',
      icon: '📊',
      description: 'Dane tabelaryczne do Excel',
      extension: '.csv'
    }
  ];

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/export/${selectedFormat}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Tworzenie i pobieranie pliku
      const timestamp = new Date().toISOString().split('T')[0];
      const format = exportFormats.find(f => f.value === selectedFormat);
      const filename = `notatki_${timestamp}${format.extension}`;
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      onSuccess && onSuccess(`Notatki wyeksportowane do ${filename}! 📁`);
      onClose();
    } catch (error) {
      console.error('Błąd eksportu:', error);
      onSuccess && onSuccess('Błąd eksportu notatek', 'error');
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <span className="mr-2">📥</span>
              Eksportuj notatki
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="text-xl">✖️</span>
            </button>
          </div>

          {/* Opis */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              📦 Pobierz kopię wszystkich swoich notatek w wybranym formacie
            </p>
          </div>

          {/* Wybór formatu */}
          <div className="space-y-3 mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Wybierz format eksportu:</h4>
            {exportFormats.map((format) => (
              <label
                key={format.value}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedFormat === format.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  value={format.value}
                  checked={selectedFormat === format.value}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center w-full">
                  <span className="text-2xl mr-3">{format.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {format.label} <span className="text-sm text-gray-500">({format.extension})</span>
                    </div>
                    <div className="text-sm text-gray-600">{format.description}</div>
                  </div>
                  {selectedFormat === format.value && (
                    <span className="text-blue-500 text-xl">✅</span>
                  )}
                </div>
              </label>
            ))}
          </div>

          {/* Informacje o wybranym formacie */}
          <div className="mb-6 p-3 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-2">Co zostanie wyeksportowane:</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Wszystkie twoje notatki</li>
              <li>• Tytuły i treść notatek</li>
              <li>• Daty utworzenia i modyfikacji</li>
              {selectedFormat === 'json' && <li>• Metadane w formacie JSON</li>}
              {selectedFormat === 'csv' && <li>• Dane w formacie tabeli</li>}
              {selectedFormat === 'md' && <li>• Formatowanie Markdown</li>}
            </ul>
          </div>

          {/* Przyciski */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              ❌ Anuluj
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              {exporting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Eksportowanie...
                </>
              ) : (
                <>
                  <span className="mr-2">📥</span>
                  Pobierz {exportFormats.find(f => f.value === selectedFormat)?.label}
                </>
              )}
            </button>
          </div>

          {/* Dodatkowe informacje */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              💡 <strong>Wskazówka:</strong> Pliki zostaną pobrane do folderu Pobrane w przeglądarce
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;