const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDatabase, closeDB } = require('./database');
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const sharingRoutes = require('./routes/sharing');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🔄 Inicjalizacja bazy danych...');
initDatabase();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ 
    message: 'Notatnik Backend Server działa!',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      notes: '/api/notes/*'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API działa poprawnie',
    features: ['auth', 'notes']
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api', sharingRoutes);

app.get('/api/notes-test', (req, res) => {
  res.json({
    success: true,
    message: 'System notatek gotowy!',
    note: 'Wszystkie endpointy notatek wymagają autoryzacji'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Endpoint nie znaleziony',
    path: req.originalUrl
  });
});

const server = app.listen(PORT, () => {
  console.log('🚀 Serwer zapuszczony na porcie', PORT);
  console.log('📝 API: http://localhost:' + PORT);
  console.log('📋 Notes API: http://localhost:' + PORT + '/api/notes-test');
});

process.on('SIGINT', async () => {
  console.log('🛑 Zamykanie serwera...');
  server.close();
  await closeDB();
  process.exit(0);
});

module.exports = app;