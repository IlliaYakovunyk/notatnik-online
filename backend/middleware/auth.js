const jwt = require('jsonwebtoken');
const { findUserById } = require('../database');

// Middleware do weryfikacji JWT tokenu
const authenticateToken = (req, res, next) => {
  // Pobierz token z nagłówka Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Brak tokenu dostępu. Zaloguj się.'
    });
  }

  // Weryfikuj token
  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key', (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token jest nieprawidłowy lub wygasł'
      });
    }

    // Sprawdź czy użytkownik nadal istnieje
    findUserById(decoded.userId, (dbErr, user) => {
      if (dbErr) {
        return res.status(500).json({
          success: false,
          message: 'Błąd bazy danych'
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Użytkownik nie istnieje'
        });
      }

      // Dodaj informacje o użytkowniku do requestu
      req.user = user;
      next();
    });
  });
};

// Middleware opcjonalny - nie wymaga logowania, ale sprawdza token jeśli jest
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key', (err, decoded) => {
    if (err) {
      req.user = null;
      return next();
    }

    findUserById(decoded.userId, (dbErr, user) => {
      req.user = dbErr || !user ? null : user;
      next();
    });
  });
};

module.exports = {
  authenticateToken,
  optionalAuth
};
