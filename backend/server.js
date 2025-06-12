const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDatabase, closeDB } = require('./database');
const { naprawBaze } = require('./database/init'); // DODANE
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const sharingRoutes = require('./routes/sharing');

const app = express();
const PORT = process.env.PORT || 5000;

// ====== NOWA FUNKCJA STARTU Z NAPRAWĄ BAZY ======
async function uruchomSerwer() {
    try {
        console.log('🔧 Sprawdzam i naprawiam bazę danych...');
        
        // Najpierw napraw bazę danych
        const naprawaSukces = await naprawBaze();
        
        if (naprawaSukces) {
            console.log('✅ Baza danych gotowa');
        } else {
            console.log('⚠️ Problemy z bazą danych, ale kontynuuję...');
        }
        
        // Następnie zainicjuj tradycyjnie
        console.log('🔄 Inicjalizacja bazy danych...');
        initDatabase();

        // Konfiguruj middleware
        setupMiddleware();
        
        // Uruchom serwer
        const server = app.listen(PORT, () => {
            console.log('🎉 ===================================');
            console.log(`🚀 Serwer uruchomiony na porcie ${PORT}`);
            console.log(`📝 Tryb: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 URL: http://localhost:${PORT}`);
            console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
            console.log('🎉 ===================================');
        });

        setupGracefulShutdown(server);
        
    } catch (error) {
        console.error('💥 Błąd krytyczny podczas uruchamiania serwera:');
        console.error(error);
        
        console.log('\n🔧 Spróbuj uruchomić ręcznie:');
        console.log('npm run napraw-baze');
        console.log('npm run diagnostyka');
        
        process.exit(1);
    }
}

// ====== KONFIGURACJA MIDDLEWARE ======
function setupMiddleware() {
    // CORS
    app.use(cors({
        origin: process.env.NODE_ENV === 'production' 
            ? ['https://your-domain.com'] 
            : ['http://localhost:3000'],
        credentials: true
    }));

    // Parse JSON
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Pliki statyczne
    if (process.env.NODE_ENV === 'production') {
        app.use(express.static(path.join(__dirname, 'build')));
    }

    // Logowanie żądań z lepszym formatowaniem
    app.use((req, res, next) => {
        const timestamp = new Date().toLocaleString('pl-PL');
        const method = req.method.padEnd(4);
        const url = req.path;
        const userAgent = req.get('User-Agent') || 'Unknown';
        
        console.log(`📝 ${timestamp} ${method} ${url}`);
        
        // Loguj szczegóły dla API requests
        if (req.path.startsWith('/api/')) {
            console.log(`   👤 User-Agent: ${userAgent.substring(0, 50)}...`);
            if (req.body && Object.keys(req.body).length > 0) {
                console.log(`   📦 Body keys: ${Object.keys(req.body).join(', ')}`);
            }
        }
        
        next();
    });

    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/notes', notesRoutes);
    app.use('/api/sharing', sharingRoutes);

    // ====== ROZSZERZONY ENDPOINT HEALTH ======
    app.get('/api/health', async (req, res) => {
        const healthData = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: require('./package.json').version
        };

        // Sprawdź połączenie z bazą danych
        try {
            const { db } = require('./database');
            await new Promise((resolve, reject) => {
                db.get('SELECT 1', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            healthData.database = 'connected';
        } catch (error) {
            healthData.database = 'error';
            healthData.status = 'DEGRADED';
        }

        res.json(healthData);
    });

    // ====== NOWY ENDPOINT DIAGNOSTYKI ======
    app.get('/api/diagnostyka', async (req, res) => {
        try {
            const { ZarzadzanieBaza } = require('./database/init');
            const manager = new ZarzadzanieBaza();
            
            await manager.polacz();
            
            // Pobierz statystyki tabel
            const tabele = await manager.wszystkie(
                "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
            );
            
            const statystyki = {};
            for (const tabela of tabele) {
                const liczba = await manager.pobierz(`SELECT COUNT(*) as count FROM ${tabela.name}`);
                statystyki[tabela.name] = liczba.count;
            }
            
            await manager.zamknij();
            
            res.json({
                success: true,
                tabele: statystyki,
                timestamp: new Date().toISOString(),
                message: 'Diagnostyka zakończona pomyślnie'
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Błąd diagnostyki bazy danych'
            });
        }
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
            path: req.path,
            method: req.method,
            availableEndpoints: [
                'GET /api/health',
                'GET /api/diagnostyka',
                'POST /api/auth/register',
                'POST /api/auth/login',
                'GET /api/notes',
                'POST /api/notes'
            ]
        });
    });

    // Globalna obsługa błędów
    app.use((err, req, res, next) => {
        const timestamp = new Date().toISOString();
        console.error(`❌ ${timestamp} Błąd serwera:`, err.stack);
        
        if (process.env.NODE_ENV === 'production') {
            res.status(500).json({ 
                error: 'Wewnętrzny błąd serwera',
                timestamp: timestamp
            });
        } else {
            res.status(500).json({ 
                error: 'Wewnętrzny błąd serwera',
                details: err.message,
                stack: err.stack,
                timestamp: timestamp
            });
        }
    });
}

// ====== ŁAGODNE WYŁĄCZENIE ======
function setupGracefulShutdown(server) {
    const shutdown = (signal) => {
        console.log(`\n🔄 Otrzymano sygnał ${signal}, zamykanie...`);
        
        server.close(() => {
            console.log('✅ Serwer HTTP zatrzymany');
            
            try {
                closeDB();
                console.log('✅ Baza danych zamknięta');
            } catch (error) {
                console.error('❌ Błąd zamykania bazy danych:', error);
            }
            
            console.log('👋 Serwer wyłączony prawidłowo');
            process.exit(0);
        });
        
        // Wymuszenie wyjścia po 10 sekundach
        setTimeout(() => {
            console.error('❌ Wymuszenie wyjścia - serwer nie zamknął się w czasie');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Obsługa nieobsłużonych wyjątków
    process.on('uncaughtException', (err) => {
        console.error('💥 Nieobsłużony wyjątek:', err);
        console.error('Stack:', err.stack);
        process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
        console.error('💥 Nieobsłużone odrzucenie Promise:', reason);
        console.error('Promise:', promise);
        process.exit(1);
    });
}

// ====== URUCHOMIENIE SERWERA ======
uruchomSerwer();

module.exports = app;