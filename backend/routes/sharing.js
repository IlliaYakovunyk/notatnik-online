const express = require('express');
const crypto = require('crypto');
const { db } = require('../database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Utwórz link do udostępnienia notatki
router.post('/notes/:id/share', authenticateToken, (req, res) => {
  const noteId = req.params.id;
  const userId = req.user.id;
  const { canEdit = false, expiresIn = 7 } = req.body; // expiresIn w dniach

  // Sprawdź czy notatka należy do użytkownika
  const checkSql = 'SELECT id, title FROM notes WHERE id = ? AND user_id = ?';
  db.get(checkSql, [noteId, userId], (err, note) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Błąd bazy danych' });
    }
    
    if (!note) {
      return res.status(404).json({ success: false, message: 'Notatka nie znaleziona' });
    }

    // Generuj unikalny token dla linka
    const shareToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresIn);

    // Zapisz w tabeli shared_notes
    const insertSql = `
      INSERT INTO shared_notes (note_id, share_token, can_edit, expires_at, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    
    db.run(insertSql, [noteId, shareToken, canEdit ? 1 : 0, expiresAt.toISOString(), userId], function(err) {
      if (err) {
        console.error('Błąd tworzenia linka:', err);
        return res.status(500).json({ success: false, message: 'Błąd tworzenia linka' });
      }

      const shareUrl = `${req.protocol}://${req.get('host')}/shared/${shareToken}`;
      
      res.json({
        success: true,
        shareLink: {
          id: this.lastID,
          url: shareUrl,
          token: shareToken,
          canEdit,
          expiresAt: expiresAt.toISOString(),
          noteTitle: note.title
        }
      });
    });
  });
});

// Pobierz udostępnioną notatkę (publiczny dostęp)
router.get('/shared/:token', optionalAuth, (req, res) => {
  const shareToken = req.params.token;
  
  const sql = `
    SELECT 
      n.id, n.title, n.content, n.created_at, n.updated_at,
      sn.can_edit, sn.expires_at, sn.created_by,
      u.username as shared_by_username
    FROM shared_notes sn
    JOIN notes n ON sn.note_id = n.id
    JOIN users u ON sn.created_by = u.id
    WHERE sn.share_token = ? AND sn.expires_at > CURRENT_TIMESTAMP
  `;
  
  db.get(sql, [shareToken], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Błąd bazy danych' });
    }
    
    if (!result) {
      return res.status(404).json({ 
        success: false, 
        message: 'Link wygasł lub nie istnieje' 
      });
    }

    res.json({
      success: true,
      note: {
        id: result.id,
        title: result.title,
        content: result.content,
        created_at: result.created_at,
        updated_at: result.updated_at,
        shared_by: result.shared_by_username,
        can_edit: !!result.can_edit,
        is_shared: true
      }
    });
  });
});

// Lista udostępnionych linków użytkownika
router.get('/my-shares', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  const sql = `
    SELECT 
      sn.id, sn.share_token, sn.can_edit, sn.expires_at, sn.created_at,
      n.title as note_title, n.id as note_id
    FROM shared_notes sn
    JOIN notes n ON sn.note_id = n.id
    WHERE sn.created_by = ? AND sn.expires_at > CURRENT_TIMESTAMP
    ORDER BY sn.created_at DESC
  `;
  
  db.all(sql, [userId], (err, shares) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Błąd bazy danych' });
    }
    
    const formattedShares = shares.map(share => ({
      id: share.id,
      noteId: share.note_id,
      noteTitle: share.note_title,
      shareUrl: `${req.protocol}://${req.get('host')}/shared/${share.share_token}`,
      canEdit: !!share.can_edit,
      expiresAt: share.expires_at,
      createdAt: share.created_at
    }));
    
    res.json({
      success: true,
      shares: formattedShares
    });
  });
});

// Usuń link do udostępnienia
router.delete('/shares/:id', authenticateToken, (req, res) => {
  const shareId = req.params.id;
  const userId = req.user.id;
  
  const deleteSql = 'DELETE FROM shared_notes WHERE id = ? AND created_by = ?';
  db.run(deleteSql, [shareId, userId], function(err) {
    if (err) {
      return res.status(500).json({ success: false, message: 'Błąd usuwania' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ success: false, message: 'Link nie znaleziony' });
    }
    
    res.json({ success: true, message: 'Link usunięty' });
  });
});

// Eksportuj notatki użytkownika
router.get('/export/:format', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const format = req.params.format.toLowerCase();
  
  if (!['json', 'txt', 'md', 'csv'].includes(format)) {
    return res.status(400).json({ success: false, message: 'Nieobsługiwany format' });
  }
  
  const sql = `
    SELECT id, title, content, created_at, updated_at 
    FROM notes 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `;
  
  db.all(sql, [userId], (err, notes) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Błąd bazy danych' });
    }
    
    const timestamp = new Date().toISOString().split('T')[0];
    let content, mimeType, filename;
    
    switch (format) {
      case 'json':
        content = JSON.stringify({
          exportDate: new Date().toISOString(),
          notesCount: notes.length,
          notes: notes
        }, null, 2);
        mimeType = 'application/json';
        filename = `notatki_${timestamp}.json`;
        break;
        
      case 'txt':
        content = notes.map(note => 
          `TYTUŁ: ${note.title}\n` +
          `DATA: ${new Date(note.created_at).toLocaleString('pl-PL')}\n` +
          `TREŚĆ:\n${note.content}\n` +
          `${'='.repeat(50)}\n\n`
        ).join('');
        mimeType = 'text/plain';
        filename = `notatki_${timestamp}.txt`;
        break;
        
      case 'md':
        content = notes.map(note => 
          `# ${note.title}\n\n` +
          `*Utworzono: ${new Date(note.created_at).toLocaleString('pl-PL')}*\n\n` +
          `${note.content}\n\n---\n\n`
        ).join('');
        mimeType = 'text/markdown';
        filename = `notatki_${timestamp}.md`;
        break;
        
      case 'csv':
        const csvHeader = 'ID,Tytuł,Treść,Data utworzenia,Data aktualizacji\n';
        const csvRows = notes.map(note => 
          `${note.id},"${note.title.replace(/"/g, '""')}","${note.content.replace(/"/g, '""')}","${note.created_at}","${note.updated_at}"`
        ).join('\n');
        content = csvHeader + csvRows;
        mimeType = 'text/csv';
        filename = `notatki_${timestamp}.csv`;
        break;
    }
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  });
});

module.exports = router;