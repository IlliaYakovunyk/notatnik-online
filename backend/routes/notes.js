const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Wszystkie routing notes wymagają autoryzacji
router.use(authenticateToken);

// Pobierz wszystkie notatki użytkownika
router.get('/', (req, res) => {
  const userId = req.user.id;
  
  const sql = `
    SELECT id, title, content, created_at, updated_at 
    FROM notes 
    WHERE user_id = ? 
    ORDER BY updated_at DESC
  `;
  
  db.all(sql, [userId], (err, notes) => {
    if (err) {
      console.error('Błąd pobierania notatek:', err);
      return res.status(500).json({
        success: false,
        message: 'Błąd pobierania notatek'
      });
    }
    
    res.json({
      success: true,
      notes: notes || [],
      count: notes ? notes.length : 0
    });
  });
});

// Pobierz konkretną notatkę
router.get('/:id', (req, res) => {
  const noteId = req.params.id;
  const userId = req.user.id;
  
  const sql = `
    SELECT id, title, content, created_at, updated_at 
    FROM notes 
    WHERE id = ? AND user_id = ?
  `;
  
  db.get(sql, [noteId, userId], (err, note) => {
    if (err) {
      console.error('Błąd pobierania notatki:', err);
      return res.status(500).json({
        success: false,
        message: 'Błąd pobierania notatki'
      });
    }
    
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Notatka nie znaleziona'
      });
    }
    
    res.json({
      success: true,
      note
    });
  });
});

// Utwórz nową notatkę
router.post('/', (req, res) => {
  const { title, content } = req.body;
  const userId = req.user.id;
  
  // Walidacja
  if (!title) {
    return res.status(400).json({
      success: false,
      message: 'Tytuł notatki jest wymagany'
    });
  }
  
  const sql = `
    INSERT INTO notes (title, content, user_id, created_at, updated_at) 
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `;
  
  db.run(sql, [title, content || '', userId], function(err) {
    if (err) {
      console.error('Błąd tworzenia notatki:', err);
      return res.status(500).json({
        success: false,
        message: 'Błąd tworzenia notatki'
      });
    }
    
    // Pobierz utworzoną notatkę
    const selectSql = 'SELECT id, title, content, created_at, updated_at FROM notes WHERE id = ?';
    db.get(selectSql, [this.lastID], (selectErr, note) => {
      if (selectErr) {
        console.error('Błąd pobierania utworzonej notatki:', selectErr);
        return res.status(500).json({
          success: false,
          message: 'Notatka utworzona, ale błąd pobierania'
        });
      }
      
      res.status(201).json({
        success: true,
        message: 'Notatka utworzona pomyślnie',
        note
      });
    });
  });
});

// Aktualizuj notatkę
router.put('/:id', (req, res) => {
  const noteId = req.params.id;
  const { title, content } = req.body;
  const userId = req.user.id;
  
  // Walidacja
  if (!title) {
    return res.status(400).json({
      success: false,
      message: 'Tytuł notatki jest wymagany'
    });
  }
  
  // Sprawdź czy notatka należy do użytkownika
  const checkSql = 'SELECT id FROM notes WHERE id = ? AND user_id = ?';
  db.get(checkSql, [noteId, userId], (checkErr, existingNote) => {
    if (checkErr) {
      console.error('Błąd sprawdzania notatki:', checkErr);
      return res.status(500).json({
        success: false,
        message: 'Błąd sprawdzania notatki'
      });
    }
    
    if (!existingNote) {
      return res.status(404).json({
        success: false,
        message: 'Notatka nie znaleziona'
      });
    }
    
    // Aktualizuj notatkę
    const updateSql = `
      UPDATE notes 
      SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND user_id = ?
    `;
    
    db.run(updateSql, [title, content || '', noteId, userId], function(updateErr) {
      if (updateErr) {
        console.error('Błąd aktualizacji notatki:', updateErr);
        return res.status(500).json({
          success: false,
          message: 'Błąd aktualizacji notatki'
        });
      }
      
      // Pobierz zaktualizowaną notatkę
      const selectSql = 'SELECT id, title, content, created_at, updated_at FROM notes WHERE id = ?';
      db.get(selectSql, [noteId], (selectErr, note) => {
        if (selectErr) {
          console.error('Błąd pobierania zaktualizowanej notatki:', selectErr);
          return res.status(500).json({
            success: false,
            message: 'Notatka zaktualizowana, ale błąd pobierania'
          });
        }
        
        res.json({
          success: true,
          message: 'Notatka zaktualizowana pomyślnie',
          note
        });
      });
    });
  });
});

// Usuń notatkę
router.delete('/:id', (req, res) => {
  const noteId = req.params.id;
  const userId = req.user.id;
  
  // Sprawdź czy notatka należy do użytkownika
  const checkSql = 'SELECT id, title FROM notes WHERE id = ? AND user_id = ?';
  db.get(checkSql, [noteId, userId], (checkErr, existingNote) => {
    if (checkErr) {
      console.error('Błąd sprawdzania notatki:', checkErr);
      return res.status(500).json({
        success: false,
        message: 'Błąd sprawdzania notatki'
      });
    }
    
    if (!existingNote) {
      return res.status(404).json({
        success: false,
        message: 'Notatka nie znaleziona'
      });
    }
    
    // Usuń notatkę
    const deleteSql = 'DELETE FROM notes WHERE id = ? AND user_id = ?';
    db.run(deleteSql, [noteId, userId], function(deleteErr) {
      if (deleteErr) {
        console.error('Błąd usuwania notatki:', deleteErr);
        return res.status(500).json({
          success: false,
          message: 'Błąd usuwania notatki'
        });
      }
      
      res.json({
        success: true,
        message: `Notatka "${existingNote.title}" została usunięta`,
        deletedNoteId: noteId
      });
    });
  });
});

// Statystyki użytkownika
router.get('/stats/summary', (req, res) => {
  const userId = req.user.id;
  
  const sql = `
    SELECT 
      COUNT(*) as total_notes,
      COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as notes_today,
      COUNT(CASE WHEN DATE(created_at) >= DATE('now', '-7 days') THEN 1 END) as notes_this_week
    FROM notes 
    WHERE user_id = ?
  `;
  
  db.get(sql, [userId], (err, stats) => {
    if (err) {
      console.error('Błąd pobierania statystyk:', err);
      return res.status(500).json({
        success: false,
        message: 'Błąd pobierania statystyk'
      });
    }
    
    res.json({
      success: true,
      stats: stats || { total_notes: 0, notes_today: 0, notes_this_week: 0 }
    });
  });
});

module.exports = router;