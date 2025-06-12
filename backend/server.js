const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDatabase, closeDB } = require('./database');
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const sharingRoutes = require('./routes/sharing');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🔄 Inicjalizacja bazy danych...');
initDatabase();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Pliki statyczne
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
}

// Logowanie żądań
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/sharing', sharingRoutes);

// Endpoint sprawdzenia stanu
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Obsługa plików statycznych dla SPA
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// Obsługa 404 dla API
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint API nie został znaleziony',
    path: req.path 
  });
});

// Globalna obsługa błędów
app.use((err, req, res, next) => {
  console.error('❌ Błąd serwera:', err.stack);
  
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ 
      error: 'Wewnętrzny błąd serwera' 
    });
  } else {
    res.status(500).json({ 
      error: 'Wewnętrzny błąd serwera',
      details: err.message,
      stack: err.stack
    });
  }
});

// Uruchomienie serwera
const server = app.listen(PORT, () => {
  console.log(`🚀 Serwer uruchomiony na porcie ${PORT}`);
  console.log(`📝 Tryb: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
});

// Łagodne wyłączenie
process.on('SIGTERM', () => {
  console.log('🔄 Otrzymano sygnał SIGTERM, zamykanie...');
  server.close(() => {
    console.log('✅ Serwer HTTP zatrzymany');
    closeDB();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 Otrzymano sygnał SIGINT, zamykanie...');
  server.close(() => {
    console.log('✅ Serwer HTTP zatrzymany');
    closeDB();
    process.exit(0);
  });
});

// Obsługa nieobsłużonych wyjątków
process.on('uncaughtException', (err) => {
  console.error('💥 Nieobsłużony wyjątek:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Nieobsłużone odrzucenie Promise:', reason);
  process.exit(1);
});

module.exports = app;