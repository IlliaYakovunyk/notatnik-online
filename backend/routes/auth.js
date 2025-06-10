const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findUserByEmail, createUser } = require('../database');

const router = express.Router();

// Rejestracja użytkownika
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Walidacja danych
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Wszystkie pola są wymagane'
      });
    }

    // Sprawdź czy email już istnieje
    findUserByEmail(email, async (err, existingUser) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Błąd bazy danych'
        });
      }

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Użytkownik z tym emailem już istnieje'
        });
      }

      try {
        // Hashowanie hasła
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Tworzenie użytkownika
        createUser(username, email, hashedPassword, function(err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              return res.status(400).json({
                success: false,
                message: 'Użytkownik z tym emailem lub nazwą już istnieje'
              });
            }
            return res.status(500).json({
              success: false,
              message: 'Błąd podczas tworzenia użytkownika'
            });
          }

          res.status(201).json({
            success: true,
            message: 'Użytkownik utworzony pomyślnie',
            user: {
              id: this.lastID,
              username,
              email
            }
          });
        });
      } catch (hashError) {
        res.status(500).json({
          success: false,
          message: 'Błąd podczas hashowania hasła'
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Wewnętrzny błąd serwera'
    });
  }
});

// Logowanie użytkownika
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    // Walidacja danych
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email i hasło są wymagane'
      });
    }

    // Znajdź użytkownika
    findUserByEmail(email, async (err, user) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Błąd bazy danych'
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Nieprawidłowy email lub hasło'
        });
      }

      try {
        // Sprawdź hasło
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return res.status(401).json({
            success: false,
            message: 'Nieprawidłowy email lub hasło'
          });
        }

        // Tworzenie JWT tokenu
        const token = jwt.sign(
          { 
            userId: user.id, 
            email: user.email 
          },
          process.env.JWT_SECRET || 'fallback-secret-key',
          { expiresIn: '24h' }
        );

        res.json({
          success: true,
          message: 'Zalogowano pomyślnie',
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        });
      } catch (compareError) {
        res.status(500).json({
          success: false,
          message: 'Błąd podczas weryfikacji hasła'
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Wewnętrzny błąd serwera'
    });
  }
});

// Test endpoint - sprawdź czy API działa
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API autoryzacji działa!',
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login'
    }
  });
});

module.exports = router;
