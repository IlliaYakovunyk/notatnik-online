// ===============================================
// SKRYPT INICJALIZACJI I NAPRAWY BAZY DANYCH
// Plik: backend/database/init.js
// ===============================================

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Konfiguracja
const config = {
    dbPath: process.env.DB_PATH || path.join(__dirname, '../database.db'),
    backupPath: path.join(__dirname, '../kopie-zapasowe'),
    verbose: true
};

class ZarzadzanieBaza {
    constructor(sciezkaBazy = config.dbPath) {
        this.sciezkaBazy = sciezkaBazy;
        this.db = null;
    }

    // Połączenie z bazą danych
    polacz() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.sciezkaBazy, (err) => {
                if (err) {
                    this.log('❌ Błąd połączenia z bazą danych:', err.message);
                    reject(err);
                } else {
                    this.log('🔗 Połączono z bazą danych SQLite:', this.sciezkaBazy);
                    resolve();
                }
            });
        });
    }

    // Logowanie
    log(...args) {
        if (config.verbose) {
            console.log(...args);
        }
    }

    // Tworzenie kopii zapasowej
    async stworzKopieZapasowa() {
        if (!fs.existsSync(this.sciezkaBazy)) {
            this.log('ℹ️ Baza danych nie istnieje, kopia zapasowa nie jest wymagana');
            return;
        }

        const katalogKopii = config.backupPath;
        if (!fs.existsSync(katalogKopii)) {
            fs.mkdirSync(katalogKopii, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const sciezkaKopii = path.join(katalogKopii, `database_backup_${timestamp}.db`);

        try {
            fs.copyFileSync(this.sciezkaBazy, sciezkaKopii);
            this.log('✅ Kopia zapasowa utworzona:', sciezkaKopii);
        } catch (error) {
            this.log('❌ Błąd tworzenia kopii zapasowej:', error.message);
            throw error;
        }
    }

    // Wykonanie zapytania SQL
    wykonaj(zapytanie, parametry = []) {
        return new Promise((resolve, reject) => {
            this.db.run(zapytanie, parametry, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, zmiany: this.changes });
                }
            });
        });
    }

    // Pobieranie danych
    wszystkie(zapytanie, parametry = []) {
        return new Promise((resolve, reject) => {
            this.db.all(zapytanie, parametry, (err, wiersze) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(wiersze);
                }
            });
        });
    }

    // Pobieranie jednego rekordu
    pobierz(zapytanie, parametry = []) {
        return new Promise((resolve, reject) => {
            this.db.get(zapytanie, parametry, (err, wiersz) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(wiersz);
                }
            });
        });
    }

    // Sprawdzenie istnienia tabeli
    async tabelaIstnieje(nazwaTabeli) {
        const wynik = await this.pobierz(
            `SELECT name FROM sqlite_master WHERE type='table' AND name=?`, 
            [nazwaTabeli]
        );
        return !!wynik;
    }

    // Pobieranie informacji o kolumnach tabeli
    async pobierzKolumnyTabeli(nazwaTabeli) {
        return await this.wszystkie(`PRAGMA table_info(${nazwaTabeli})`);
    }

    // Sprawdzenie istnienia kolumny
    async kolumnaIstnieje(nazwaTabeli, nazwaKolumny) {
        const kolumny = await this.pobierzKolumnyTabeli(nazwaTabeli);
        return kolumny.some(kol => kol.name === nazwaKolumny);
    }

    // Tworzenie tabeli użytkowników
    async sprawdzTabeleUsers() {
        if (!(await this.tabelaIstnieje('users'))) {
            const zapytanie = `
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;
            await this.wykonaj(zapytanie);
            this.log('✅ Tabela users utworzona');
        } else {
            this.log('ℹ️ Tabela users już istnieje');
        }
    }

    // Tworzenie tabeli notatek
    async sprawdzTabeleNotes() {
        if (!(await this.tabelaIstnieje('notes'))) {
            const zapytanie = `
                CREATE TABLE notes (
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
            await this.wykonaj(zapytanie);
            this.log('✅ Tabela notes utworzona');
        } else {
            this.log('ℹ️ Tabela notes już istnieje');
        }
    }

    // Sprawdzenie i naprawa tabeli shared_notes
    async sprawdzTabeleSharedNotes() {
        if (!(await this.tabelaIstnieje('shared_notes'))) {
            const zapytanie = `
                CREATE TABLE shared_notes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    note_id INTEGER NOT NULL,
                    share_token TEXT UNIQUE NOT NULL,
                    can_edit BOOLEAN DEFAULT 0,
                    expires_at DATETIME NOT NULL,
                    created_by INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE,
                    FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE CASCADE
                )
            `;
            await this.wykonaj(zapytanie);
            this.log('✅ Tabela shared_notes utworzona');
        } else {
            this.log('ℹ️ Tabela shared_notes już istnieje');
            
            // Sprawdź czy ma wszystkie wymagane kolumny
            const kolumny = await this.pobierzKolumnyTabeli('shared_notes');
            const wymaganeKolumny = ['expires_at', 'can_edit', 'created_by'];
            
            for (const kolumna of wymaganeKolumny) {
                if (!kolumny.some(k => k.name === kolumna)) {
                    this.log(`⚠️ Brakuje kolumny ${kolumna} w tabeli shared_notes - dodaję...`);
                    
                    let typKolumny = 'TEXT';
                    let domyslnaWartosc = '';
                    
                    switch(kolumna) {
                        case 'expires_at':
                            typKolumny = 'DATETIME NOT NULL';
                            domyslnaWartosc = "DEFAULT (datetime('now', '+7 days'))";
                            break;
                        case 'can_edit':
                            typKolumny = 'BOOLEAN';
                            domyslnaWartosc = 'DEFAULT 0';
                            break;
                        case 'created_by':
                            typKolumny = 'INTEGER NOT NULL';
                            domyslnaWartosc = 'DEFAULT 1';
                            break;
                    }
                    
                    const alterQuery = `ALTER TABLE shared_notes ADD COLUMN ${kolumna} ${typKolumny} ${domyslnaWartosc}`;
                    try {
                        await this.wykonaj(alterQuery);
                        this.log(`✅ Dodano kolumnę ${kolumna}`);
                    } catch (error) {
                        this.log(`❌ Błąd dodawania kolumny ${kolumna}:`, error.message);
                    }
                }
            }
        }
    }

    // Napraw błąd z expires_at w funkcji cleanExpiredShares
    async naprawFunkcjeCleanExpiredShares() {
        try {
            // Test czy możemy wykonać zapytanie czyszczenia
            const testQuery = 'SELECT COUNT(*) as count FROM shared_notes WHERE expires_at <= CURRENT_TIMESTAMP';
            await this.pobierz(testQuery);
            this.log('✅ Funkcja cleanExpiredShares będzie działać poprawnie');
        } catch (error) {
            this.log('❌ Problem z funkcją cleanExpiredShares:', error.message);
            
            // Sprawdź czy istnieje tabela share_links (stara nazwa)
            if (await this.tabelaIstnieje('share_links')) {
                this.log('🔄 Znaleziono starą tabelę share_links - migruję dane...');
                await this.migrujZShareLinks();
            }
        }
    }

    // Migracja z starej tabeli share_links do shared_notes
    async migrujZShareLinks() {
        try {
            // Pobierz dane ze starej tabeli
            const stareDane = await this.wszystkie('SELECT * FROM share_links');
            
            if (stareDane.length > 0) {
                this.log(`🔄 Migruję ${stareDane.length} rekordów z share_links do shared_notes...`);
                
                for (const rekord of stareDane) {
                    const migrQuery = `
                        INSERT OR IGNORE INTO shared_notes 
                        (note_id, share_token, can_edit, expires_at, created_by, created_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `;
                    
                    const expires_at = rekord.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
                    const created_by = rekord.created_by || 1;
                    const can_edit = rekord.permissions === 'edit' ? 1 : 0;
                    
                    await this.wykonaj(migrQuery, [
                        rekord.note_id,
                        rekord.share_token,
                        can_edit,
                        expires_at,
                        created_by,
                        rekord.created_at || new Date().toISOString()
                    ]);
                }
                
                this.log('✅ Migracja zakończona pomyślnie');
                
                // Usuń starą tabelę po potwierdzeniu migracji
                const noweRekordy = await this.wszystkie('SELECT COUNT(*) as count FROM shared_notes');
                if (noweRekordy[0].count >= stareDane.length) {
                    await this.wykonaj('DROP TABLE share_links');
                    this.log('✅ Stara tabela share_links została usunięta');
                }
            }
        } catch (error) {
            this.log('❌ Błąd migracji:', error.message);
        }
    }

    // Tworzenie indeksów
    async stworzIndeksy() {
        const indeksy = [
            {
                nazwa: 'idx_shared_notes_token',
                zapytanie: 'CREATE INDEX IF NOT EXISTS idx_shared_notes_token ON shared_notes(share_token)'
            },
            {
                nazwa: 'idx_shared_notes_expires',
                zapytanie: 'CREATE INDEX IF NOT EXISTS idx_shared_notes_expires ON shared_notes(expires_at)'
            },
            {
                nazwa: 'idx_notes_user_id',
                zapytanie: 'CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)'
            },
            {
                nazwa: 'idx_notes_updated_at',
                zapytanie: 'CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at)'
            }
        ];

        for (const indeks of indeksy) {
            try {
                await this.wykonaj(indeks.zapytanie);
                this.log(`✅ Indeks ${indeks.nazwa} utworzony/sprawdzony`);
            } catch (error) {
                this.log(`❌ Błąd tworzenia indeksu ${indeks.nazwa}:`, error.message);
            }
        }
    }

    // Czyszczenie wygasłych linków (test funkcji)
    async wyczyścWygasleLinki() {
        try {
            const wynik = await this.wykonaj(
                'DELETE FROM shared_notes WHERE expires_at <= CURRENT_TIMESTAMP'
            );
            if (wynik.zmiany > 0) {
                this.log(`🧹 Usunięto ${wynik.zmiany} wygasłych linków`);
            } else {
                this.log('ℹ️ Brak wygasłych linków do usunięcia');
            }
            return wynik.zmiany;
        } catch (error) {
            this.log('❌ Błąd czyszczenia wygasłych linków:', error.message);
            throw error;
        }
    }

    // Główna funkcja naprawy
    async naprawBaze() {
        try {
            this.log('🚀 Rozpoczynam naprawę bazy danych...');
            
            // Stwórz kopię zapasową
            await this.stworzKopieZapasowa();
            
            // Połącz z bazą
            await this.polacz();
            
            // Włącz obsługę kluczy obcych
            await this.wykonaj('PRAGMA foreign_keys = ON');
            
            // Sprawdź i napraw tabele
            await this.sprawdzTabeleUsers();
            await this.sprawdzTabeleNotes();
            await this.sprawdzTabeleSharedNotes();
            
            // Napraw funkcję czyszczenia
            await this.naprawFunkcjeCleanExpiredShares();
            
            // Stwórz indeksy
            await this.stworzIndeksy();
            
            // Test czyszczenia wygasłych linków
            await this.wyczyścWygasleLinki();
            
            this.log('🎉 Naprawa bazy danych zakończona pomyślnie!');
            
        } catch (error) {
            this.log('❌ Błąd podczas naprawy bazy danych:', error.message);
            throw error;
        }
    }

    // Zamknięcie połączenia
    zamknij() {
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        this.log('❌ Błąd zamykania bazy danych:', err.message);
                    } else {
                        this.log('🔒 Połączenie z bazą danych zamknięte');
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    // Diagnostyka bazy danych
    async diagnostyka() {
        try {
            this.log('🔍 Diagnostyka bazy danych...');
            
            // Sprawdź wszystkie tabele
            const tabele = await this.wszystkie(
                "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
            );
            
            this.log('📋 Znalezione tabele:');
            for (const tabela of tabele) {
                const liczbRekordow = await this.pobierz(`SELECT COUNT(*) as count FROM ${tabela.name}`);
                this.log(`  - ${tabela.name}: ${liczbRekordow.count} rekordów`);
                
                if (tabela.name === 'shared_notes') {
                    const kolumny = await this.pobierzKolumnyTabeli('shared_notes');
                    this.log(`    Kolumny: ${kolumny.map(k => k.name).join(', ')}`);
                }
            }
            
            // Sprawdź wygasłe linki
            if (await this.tabelaIstnieje('shared_notes')) {
                const wygasle = await this.pobierz(
                    'SELECT COUNT(*) as count FROM shared_notes WHERE expires_at <= CURRENT_TIMESTAMP'
                );
                this.log(`🕐 Wygasłe linki: ${wygasle.count}`);
            }
            
        } catch (error) {
            this.log('❌ Błąd diagnostyki:', error.message);
        }
    }
}

// Funkcja do szybkiej naprawy
async function naprawBaze() {
    const manager = new ZarzadzanieBaza();
    try {
        await manager.naprawBaze();
        await manager.diagnostyka();
        return true;
    } catch (error) {
        console.error('❌ Nie udało się naprawić bazy danych:', error.message);
        return false;
    } finally {
        await manager.zamknij();
    }
}

// Eksport
module.exports = {
    ZarzadzanieBaza,
    naprawBaze
};

// Jeśli plik uruchomiony bezpośrednio
if (require.main === module) {
    naprawBaze().then(sukces => {
        process.exit(sukces ? 0 : 1);
    });
}