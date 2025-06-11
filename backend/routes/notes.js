const express = require('express');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Wszystkie routing notes wymagają autoryzacji
router.use(authenticateToken);

// Test endpoint - sprawdź czy API działa
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Notes API działa!',
    user: req.user,
    endpoints: {
      list: 'GET /api/notes',
      create: 'POST /api/notes',
      update: 'PUT /api/notes/:id',
      delete: 'DELETE /api/notes/:id',
      search: 'GET /api/notes/search?q=term'
    }
  });
});

// WAŻNE: Trasy wyszukiwania muszą być PRZED trasą /:id
// Wyszukiwanie notatek - PRZESUNIĘTE NA GÓRĘ
router.get('/search', (req, res) => {
  const userId = req.user.id;
  const searchTerm = req.query.q;
  
  console.log('🔍 Wyszukiwanie:', searchTerm, 'dla użytkownika:', userId);
  
  if (!searchTerm || searchTerm.trim().length < 1) {
    return res.status(400).json({
      success: false,
      message: 'Wyszukiwanie wymaga co najmniej 1 znak'
    });
  }
  
  const sql = `
    SELECT id, title, content, created_at, updated_at 
    FROM notes 
    WHERE user_id = ? AND (title LIKE ? OR content LIKE ?) 
    ORDER BY 
      CASE 
        WHEN title LIKE ? THEN 1 
        ELSE 2 
      END,
      updated_at DESC
    LIMIT 100
  `;
  
  const wzor = `%${searchTerm}%`;
  
  db.all(sql, [userId, wzor, wzor, wzor], (err, notatki) => {
    if (err) {
      console.error('Błąd wyszukiwania:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Błąd wyszukiwania w bazie danych' 
      });
    }
    
    console.log('📋 Znaleziono:', notatki?.length || 0, 'notatek dla:', searchTerm);
    
    res.json({ 
      success: true, 
      results: notatki || [], 
      count: notatki?.length || 0,
      searchTerm: searchTerm,
      message: `Znaleziono ${notatki?.length || 0} wyników`
    });
  });
});

// Statystyki użytkownika - TAKŻE PRZED /:id
router.get('/stats/summary', (req, res) => {
  const userId = req.user.id;
  
  console.log('📊 Pobieranie statystyk dla użytkownika:', userId);
  
  const sql = `
    SELECT 
      COUNT(*) as total_notes,
      COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as notes_today,
      COUNT(CASE WHEN DATE(created_at) >= DATE('now', '-7 days') THEN 1 END) as notes_this_week,
      COUNT(CASE WHEN DATE(created_at) >= DATE('now', '-30 days') THEN 1 END) as notes_this_month,
      SUM(LENGTH(content)) as total_characters,
      AVG(LENGTH(content)) as avg_note_length
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
    
    console.log('📊 Statystyki:', stats);
    
    res.json({
      success: true,
      stats: stats || { 
        total_notes: 0, 
        notes_today: 0, 
        notes_this_week: 0,
        notes_this_month: 0,
        total_characters: 0,
        avg_note_length: 0
      }
    });
  });
});

// Debug endpoint - TAKŻE PRZED /:id
router.get('/debug', (req, res) => {
  const userId = req.user.id;
  
  console.log('🐛 DEBUG dla użytkownika:', userId);
  
  const sql = 'SELECT id, title, content, created_at FROM notes WHERE user_id = ? ORDER BY created_at DESC LIMIT 10';
  
  db.all(sql, [userId], (err, notatki) => {
    if (err) {
      console.error('🐛 Błąd debug:', err);
      return res.status(500).json({ 
        success: false, 
        error: err.message 
      });
    }
    
    console.log('🐛 DEBUG - Ostatnie notatki użytkownika:', notatki?.length || 0);
    
    res.json({ 
      success: true, 
      user_id: userId,
      notatki: notatki || [], 
      count: notatki?.length || 0,
      message: `Znaleziono ${notatki?.length || 0} notatek w bazie`
    });
  });
});

// Export notatek do JSON
router.get('/export/json', (req, res) => {
  const userId = req.user.id;
  
  const sql = 'SELECT title, content, created_at, updated_at FROM notes WHERE user_id = ? ORDER BY created_at DESC';
  
  db.all(sql, [userId], (err, notatki) => {
    if (err) {
      console.error('Błąd eksportu:', err);
      return res.status(500).json({
        success: false,
        message: 'Błąd eksportu notatek'
      });
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="notatki_${new Date().toISOString().split('T')[0]}.json"`);
    res.json({
      exported_at: new Date().toISOString(),
      user_id: userId,
      notes: notatki,
      count: notatki.length
    });
  });
});

// Pobierz wszystkie notatki użytkownika
router.get('/', (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  
  console.log('📝 Pobieranie notatek dla użytkownika:', userId, 'limit:', limit, 'offset:', offset);
  
  const sql = `
    SELECT id, title, content, created_at, updated_at 
    FROM notes 
    WHERE user_id = ? 
    ORDER BY updated_at DESC
    LIMIT ? OFFSET ?
  `;
  
  db.all(sql, [userId, limit, offset], (err, notes) => {
    if (err) {
      console.error('Błąd pobierania notatek:', err);
      return res.status(500).json({
        success: false,
        message: 'Błąd pobierania notatek'
      });
    }
    
    console.log('📝 Zwrócono:', notes?.length || 0, 'notatek');
    
    res.json({
      success: true,
      notes: notes || [],
      count: notes ? notes.length : 0,
      limit: limit,
      offset: offset
    });
  });
});

// Pobierz konkretną notatkę - TERAZ W ODPOWIEDNIM MIEJSCU
router.get('/:id', (req, res) => {
  const noteId = req.params.id;
  const userId = req.user.id;
  
  console.log('📖 Pobieranie notatki:', noteId, 'dla użytkownika:', userId);
  
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
    
    console.log('📖 Zwrócono notatkę:', note.title);
    
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
  
  console.log('📝 Tworzenie nowej notatki dla użytkownika:', userId, 'tytuł:', title);
  
  // Walidacja
  if (!title || title.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Tytuł notatki jest wymagany'
    });
  }
  
  const sql = `
    INSERT INTO notes (title, content, user_id, created_at, updated_at) 
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `;
  
  db.run(sql, [title.trim(), content || '', userId], function(err) {
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
      
      console.log('✅ Utworzono notatkę:', note.title, 'ID:', note.id);
      
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
  
  console.log('📝 Aktualizacja notatki:', noteId, 'dla użytkownika:', userId);
  
  // Walidacja
  if (!title || title.trim().length === 0) {
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
        message: 'Notatka nie znaleziona lub nie masz uprawnień'
      });
    }
    
    // Aktualizuj notatkę
    const updateSql = `
      UPDATE notes 
      SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND user_id = ?
    `;
    
    db.run(updateSql, [title.trim(), content || '', noteId, userId], function(updateErr) {
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
        
        console.log('✅ Zaktualizowano notatkę:', note.title);
        
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
  
  console.log('🗑️ Usuwanie notatki:', noteId, 'dla użytkownika:', userId);
  
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
        message: 'Notatka nie znaleziona lub nie masz uprawnień'
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
      
      console.log('🗑️ Usunięto notatkę:', existingNote.title);
      
      res.json({
        success: true,
        message: `Notatka "${existingNote.title}" została usunięta`,
        deletedNoteId: noteId,
        deletedNote: existingNote
      });
    });
  });
});

router.get('/export/txt', (req, res) => {
  const userId = req.user.id;
  
  console.log('📤 Eksportowanie notatek do TXT dla użytkownika:', userId);
  
  const sql = 'SELECT title, content, created_at, updated_at FROM notes WHERE user_id = ? ORDER BY created_at DESC';
  
  db.all(sql, [userId], (err, notatki) => {
    if (err) {
      console.error('Błąd eksportu TXT:', err);
      return res.status(500).json({
        success: false,
        message: 'Błąd eksportu notatek'
      });
    }
    
    // Tworzenie zawartości pliku TXT
    let txtContent = `NOTATKI - EKSPORT z ${new Date().toLocaleString('pl-PL')}\n`;
    txtContent += `Użytkownik: ${req.user.username} (${req.user.email})\n`;
    txtContent += `Liczba notatek: ${notatki.length}\n`;
    txtContent += '='.repeat(80) + '\n\n';
    
    notatki.forEach((nota, index) => {
      txtContent += `${index + 1}. ${nota.title}\n`;
      txtContent += `Utworzona: ${new Date(nota.created_at).toLocaleString('pl-PL')}\n`;
      txtContent += `Zaktualizowana: ${new Date(nota.updated_at).toLocaleString('pl-PL')}\n`;
      txtContent += '-'.repeat(50) + '\n';
      txtContent += nota.content || '(Pusta notatka)';
      txtContent += '\n\n' + '='.repeat(80) + '\n\n';
    });
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="notatki_${new Date().toISOString().split('T')[0]}.txt"`);
    res.send(txtContent);
    
    console.log('✅ Wyeksportowano', notatki.length, 'notatek do TXT');
  });
});

// Bulk operations - oznacz jako ulubione
router.post('/bulk/favorite', (req, res) => {
  const userId = req.user.id;
  const { noteIds, favorite } = req.body;
  
  if (!Array.isArray(noteIds) || noteIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Wymagana jest lista ID notatek'
    });
  }
  
  const placeholders = noteIds.map(() => '?').join(',');
  const sql = `UPDATE notes SET is_favorite = ? WHERE user_id = ? AND id IN (${placeholders})`;
  const params = [favorite ? 1 : 0, userId, ...noteIds];
  
  db.run(sql, params, function(err) {
    if (err) {
      console.error('Błąd bulk update:', err);
      return res.status(500).json({
        success: false,
        message: 'Błąd aktualizacji notatek'
      });
    }
    
    res.json({
      success: true,
      message: `Zaktualizowano ${this.changes} notatek`,
      changes: this.changes,
      action: favorite ? 'added_to_favorites' : 'removed_from_favorites'
    });
  });
});

// Bulk delete
router.post('/bulk/delete', (req, res) => {
  const userId = req.user.id;
  const { noteIds } = req.body;
  
  if (!Array.isArray(noteIds) || noteIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Wymagana jest lista ID notatek'
    });
  }
  
  const placeholders = noteIds.map(() => '?').join(',');
  const sql = `DELETE FROM notes WHERE user_id = ? AND id IN (${placeholders})`;
  const params = [userId, ...noteIds];
  
  db.run(sql, params, function(err) {
    if (err) {
      console.error('Błąd bulk delete:', err);
      return res.status(500).json({
        success: false,
        message: 'Błąd usuwania notatek'
      });
    }
    
    res.json({
      success: true,
      message: `Usunięto ${this.changes} notatek`,
      deletedCount: this.changes
    });
  });
});

// Pobierz notatki z filtrami
router.get('/filter', (req, res) => {
  const userId = req.user.id;
  const { favorite, dateFrom, dateTo, sortBy, order } = req.query;
  
  let sql = 'SELECT id, title, content, is_favorite, created_at, updated_at FROM notes WHERE user_id = ?';
  let params = [userId];
  
  // Dodaj filtry
  if (favorite === 'true') {
    sql += ' AND is_favorite = 1';
  }
  
  if (dateFrom) {
    sql += ' AND DATE(created_at) >= ?';
    params.push(dateFrom);
  }
  
  if (dateTo) {
    sql += ' AND DATE(created_at) <= ?';
    params.push(dateTo);
  }
  
  // Sortowanie
  const validSortFields = ['created_at', 'updated_at', 'title'];
  const validOrders = ['ASC', 'DESC'];
  
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'updated_at';
  const sortOrder = validOrders.includes(order?.toUpperCase()) ? order.toUpperCase() : 'DESC';
  
  sql += ` ORDER BY ${sortField} ${sortOrder}`;
  
  console.log('🔍 Filtrowanie notatek:', { favorite, dateFrom, dateTo, sortBy, order });
  
  db.all(sql, params, (err, notes) => {
    if (err) {
      console.error('Błąd filtrowania:', err);
      return res.status(500).json({
        success: false,
        message: 'Błąd filtrowania notatek'
      });
    }
    
    res.json({
      success: true,
      notes: notes || [],
      count: notes?.length || 0,
      filters: { favorite, dateFrom, dateTo, sortBy, order }
    });
  });
});

// Statystyki szczegółowe
router.get('/stats/detailed', (req, res) => {
  const userId = req.user.id;
  
  const sql = `
    SELECT 
      COUNT(*) as total_notes,
      COUNT(CASE WHEN is_favorite = 1 THEN 1 END) as favorite_notes,
      COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as notes_today,
      COUNT(CASE WHEN DATE(created_at) >= DATE('now', '-7 days') THEN 1 END) as notes_this_week,
      COUNT(CASE WHEN DATE(created_at) >= DATE('now', '-30 days') THEN 1 END) as notes_this_month,
      COUNT(CASE WHEN DATE(created_at) >= DATE('now', '-1 year') THEN 1 END) as notes_this_year,
      SUM(LENGTH(content)) as total_characters,
      AVG(LENGTH(content)) as avg_note_length,
      MAX(LENGTH(content)) as longest_note,
      MIN(LENGTH(content)) as shortest_note,
      COUNT(CASE WHEN LENGTH(content) = 0 THEN 1 END) as empty_notes,
      MIN(created_at) as first_note_date,
      MAX(updated_at) as last_update_date
    FROM notes 
    WHERE user_id = ?
  `;
  
  db.get(sql, [userId], (err, stats) => {
    if (err) {
      console.error('Błąd szczegółowych statystyk:', err);
      return res.status(500).json({
        success: false,
        message: 'Błąd pobierania statystyk'
      });
    }
    
    // Oblicz dodatkowe statystyki
    const processedStats = {
      ...stats,
      avg_note_length: Math.round(stats.avg_note_length || 0),
      words_total: Math.round((stats.total_characters || 0) / 5), // Przybliżona liczba słów
      reading_time_minutes: Math.round((stats.total_characters || 0) / 1000), // Przybliżony czas czytania
      notes_per_day: stats.total_notes && stats.first_note_date ? 
        Math.round(stats.total_notes / Math.max(1, Math.ceil((new Date() - new Date(stats.first_note_date)) / (1000 * 60 * 60 * 24)))) : 0
    };
    
    res.json({
      success: true,
      stats: processedStats
    });
  });
});

// Backup database endpoint (tylko dla development)
router.get('/backup/create', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      message: 'Backup dostępny tylko w trybie development'
    });
  }
  
  const userId = req.user.id;
  
  const sql = `
    SELECT n.*, u.username, u.email 
    FROM notes n 
    JOIN users u ON n.user_id = u.id 
    WHERE n.user_id = ?
    ORDER BY n.created_at DESC
  `;
  
  db.all(sql, [userId], (err, notes) => {
    if (err) {
      console.error('Błąd tworzenia backupu:', err);
      return res.status(500).json({
        success: false,
        message: 'Błąd tworzenia backupu'
      });
    }
    
    const backup = {
      created_at: new Date().toISOString(),
      user: {
        id: userId,
        username: notes[0]?.username,
        email: notes[0]?.email
      },
      notes: notes.map(note => ({
        id: note.id,
        title: note.title,
        content: note.content,
        is_favorite: note.is_favorite,
        created_at: note.created_at,
        updated_at: note.updated_at
      })),
      stats: {
        total_notes: notes.length,
        backup_size: JSON.stringify(notes).length
      }
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="backup_${userId}_${new Date().toISOString().split('T')[0]}.json"`);
    res.json(backup);
  });
});

module.exports = router;
