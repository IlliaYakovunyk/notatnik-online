const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ścieżka do bazy danych
const DB_PATH = process.env.DB_PATH || './database.db';

// Połączenie z bazą danych
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Błąd połączenia z bazą danych:', err.message);
  } else {
    console.log('✅ Połączono z bazą danych SQLite:', DB_PATH);
  }
});

// Tworzenie tabeli użytkowników
const createUsersTable = () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.run(createTableSQL, (err) => {
    if (err) {
      console.error('❌ Błąd tworzenia tabeli users:', err.message);
    } else {
      console.log('✅ Tabela users gotowa');
    }
  });
};

// Tworzenie tabeli notatek (rozszerzona)
const createNotesTable = () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      user_id INTEGER NOT NULL,
      folder_id INTEGER DEFAULT NULL,
      is_favorite BOOLEAN DEFAULT 0,
      tags TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `;

  db.run(createTableSQL, (err) => {
    if (err) {
      console.error('❌ Błąd tworzenia tabeli notes:', err.message);
    } else {
      console.log('✅ Tabela notes gotowa');
    }
  });
};

// Tworzenie tabeli współdzielenia
const createSharedNotesTable = () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS shared_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_id INTEGER NOT NULL,
      shared_with_email TEXT NOT NULL,
      can_edit BOOLEAN DEFAULT 0,
      shared_by INTEGER NOT NULL,
      shared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE,
      FOREIGN KEY (shared_by) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(note_id, shared_with_email)
    )
  `;

  db.run(createTableSQL, (err) => {
    if (err) {
      console.error('❌ Błąd tworzenia tabeli shared_notes:', err.message);
    } else {
      console.log('✅ Tabela shared_notes gotowa');
    }
  });
};

// Inicjalizacja bazy danych
const initDatabase = () => {
  createUsersTable();
  createNotesTable();
  createSharedNotesTable();
};

// Funkcje pomocnicze dla użytkowników
const findUserByEmail = (email, callback) => {
  const sql = 'SELECT * FROM users WHERE email = ?';
  db.get(sql, [email], callback);
};

const findUserById = (id, callback) => {
  const sql = 'SELECT id, username, email, created_at FROM users WHERE id = ?';
  db.get(sql, [id], callback);
};

const createUser = (username, email, hashedPassword, callback) => {
  const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
  db.run(sql, [username, email, hashedPassword], callback);
};

// Funkcje pomocnicze dla notatek
const getAllUserNotes = (userId, callback) => {
  const sql = `
    SELECT id, title, content, is_favorite, tags, created_at, updated_at 
    FROM notes 
    WHERE user_id = ? 
    ORDER BY updated_at DESC
  `;
  db.all(sql, [userId], callback);
};

const getNoteById = (noteId, userId, callback) => {
  const sql = `
    SELECT id, title, content, is_favorite, tags, created_at, updated_at 
    FROM notes 
    WHERE id = ? AND user_id = ?
  `;
  db.get(sql, [noteId, userId], callback);
};

const createNote = (title, content, userId, callback) => {
  const sql = `
    INSERT INTO notes (title, content, user_id, created_at, updated_at) 
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `;
  db.run(sql, [title, content, userId], callback);
};

const updateNote = (noteId, title, content, userId, callback) => {
  const sql = `
    UPDATE notes 
    SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ? AND user_id = ?
  `;
  db.run(sql, [title, content, noteId, userId], callback);
};

const deleteNote = (noteId, userId, callback) => {
  const sql = 'DELETE FROM notes WHERE id = ? AND user_id = ?';
  db.run(sql, [noteId, userId], callback);
};

// Funkcja wyszukiwania
const searchNotes = (userId, searchTerm, callback) => {
  const sql = `
    SELECT id, title, content, created_at, updated_at 
    FROM notes 
    WHERE user_id = ? AND (title LIKE ? OR content LIKE ?)
    ORDER BY updated_at DESC
  `;
  const searchPattern = `%${searchTerm}%`;
  db.all(sql, [userId, searchPattern, searchPattern], callback);
};

// Zamknięcie bazy danych
const closeDB = () => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        console.error('❌ Błąd zamykania bazy danych:', err.message);
        reject(err);
      } else {
        console.log('✅ Baza danych zamknięta');
        resolve();
      }
    });
  });
};

module.exports = {
  db,
  initDatabase,
  closeDB,
  // Funkcje użytkowników
  findUserByEmail,
  findUserById,
  createUser,
  // Funkcje notatek
  getAllUserNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  searchNotes
};