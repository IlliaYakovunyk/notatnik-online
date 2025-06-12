# 📝 Notatnik Online

Nowoczesna aplikacja webowa do zarządzania notatkami z obsługą Markdown, udostępnianiem i automatycznym zapisywaniem.

## 🌟 Główne funkcje

- ✅ **System autoryzacji** - Rejestracja i logowanie użytkowników
- ✅ **Edytor Markdown** - Pełna obsługa składni Markdown
- ✅ **Autozapis** - Automatyczne zapisywanie co 30 sekund
- ✅ **Wyszukiwanie notatek** - Szybkie wyszukiwanie w tytułach i treści
- ✅ **Eksport danych** - Eksport do formatów JSON, TXT, MD, CSV
- ✅ **Udostępnianie** - Tworzenie linków do udostępniania
- ✅ **Tryb ciemny** - Przełączanie między jasnym a ciemnym motywem
- ✅ **Responsywny design** - Działa na wszystkich urządzeniach
- ✅ **Statystyki** - Liczenie słów, znaków i czasu czytania

## 🛠 Stos technologiczny

### Backend
- **Node.js** + **Express.js** - Logika serwerowa
- **SQLite** - Baza danych do przechowywania notatek
- **JWT** - Autoryzacja i uwierzytelnianie
- **bcryptjs** - Hashowanie haseł
- **CORS** - Obsługa żądań międzydomenowych

### Frontend
- **React 18** - Interfejs użytkownika
- **Tailwind CSS** - Stylizacja i responsywny design
- **Edytor Markdown** - Edytor z podglądem na żywo
- **Axios** - Klient HTTP do żądań API

## 📋 Wymagania systemowe

- **Node.js** w wersji 16.0.0 lub wyższej
- **npm** w wersji 8.0.0 lub wyższej
- **Nowoczesna przeglądarka** (Chrome, Firefox, Safari, Edge)

## 🚀 Szybki start

### 1. Klonowanie repozytorium
```bash
git clone https://github.com/your-username/notatnik-online.git
cd notatnik-online
```

### 2. Konfiguracja Backend

```bash
# Przejdź do folderu backend
cd backend

# Zainstaluj zależności
npm install

# Utwórz plik konfiguracyjny
cp .env.example .env

# Edytuj plik .env
nano .env
```

**Zawartość pliku .env:**
```env
# Port serwera (domyślnie 5000)
PORT=5000

# Sekretny klucz dla JWT (OBOWIĄZKOWO zmień!)
JWT_SECRET=twoj-bardzo-sekretny-klucz-jwt-zmien-to

# Środowisko
NODE_ENV=development

# Ścieżka do bazy danych
DB_PATH=./database.db
```

```bash
# Uruchom serwer backend
npm start
```

Serwer uruchomi się na `http://localhost:5000`

### 3. Konfiguracja Frontend

```bash
# Otwórz nowy terminal i przejdź do folderu frontend
cd ../frontend

# Zainstaluj zależności
npm install

# Uruchom aplikację frontend
npm start
```

Aplikacja otworzy się w przeglądarce na `http://localhost:3000`

## 🔧 Szczegółowa konfiguracja

### Struktura projektu
```
notatnik-online/
├── backend/                 # Część serwerowa
│   ├── routes/             # Trasy API
│   │   ├── auth.js         # Autoryzacja
│   │   ├── notes.js        # Zarządzanie notatkami
│   │   └── sharing.js      # System udostępniania
│   ├── middleware/         # Oprogramowanie pośredniczące
│   │   └── auth.js         # Autoryzacja JWT
│   ├── database.js         # Konfiguracja bazy danych
│   ├── server.js           # Główny plik serwera
│   └── package.json        # Zależności backend
├── frontend/               # Część kliencka
│   ├── src/
│   │   ├── components/     # Komponenty React
│   │   ├── App.js          # Główny komponent
│   │   └── index.js        # Punkt wejścia
│   ├── public/
│   └── package.json        # Zależności frontend
└── README.md              # Dokumentacja
```

### Konfiguracja bazy danych

Aplikacja automatycznie utworzy bazę danych SQLite z następującymi tabelami:

- **users** - Użytkownicy systemu
- **notes** - Notatki użytkowników
- **shared_notes** - Linki do udostępniania

### Endpointy API

#### Autoryzacja
```
POST /api/auth/register   # Rejestracja
POST /api/auth/login      # Logowanie
GET  /api/auth/test       # Test API
```

#### Zarządzanie notatkami
```
GET    /api/notes              # Lista notatek
POST   /api/notes              # Utwórz notatkę
GET    /api/notes/:id          # Pobierz notatkę
PUT    /api/notes/:id          # Aktualizuj notatkę
DELETE /api/notes/:id          # Usuń notatkę
GET    /api/notes/search?q=    # Wyszukaj notatki
```

#### Statystyki i eksport
```
GET /api/notes/stats/summary   # Statystyki
GET /api/notes/export/json     # Eksport JSON
GET /api/notes/export/txt      # Eksport TXT
```

#### Udostępnianie
```
POST   /api/notes/:id/share    # Utwórz link
GET    /api/shared/:token      # Otwórz link
GET    /api/my-shares          # Moje linki
DELETE /api/shares/:id         # Usuń link
```

## 👤 Korzystanie z systemu

### Rejestracja i logowanie
1. Otwórz aplikację w przeglądarce
2. Kliknij "📝 Rejestruj" aby utworzyć konto
3. Wprowadź nazwę użytkownika, email i hasło
4. Lub zaloguj się danymi testowymi:
   - Email: `test@example.com`
   - Hasło: `password123`

### Tworzenie notatek
1. Kliknij "➕ Nowa Notatka"
2. Wprowadź tytuł
3. Napisz tekst z obsługą Markdown
4. Notatka automatycznie zapisuje się co 30 sekund
5. Lub kliknij "💾 Zapisz" dla ręcznego zapisu

### Wyszukiwanie notatek
1. Przejdź do sekcji "🔍 Wyszukaj"
2. Wprowadź słowa kluczowe
3. Wyniki pojawiają się automatycznie
4. Kliknij na notatkę aby ją edytować

### Udostępnianie
1. Otwórz notatkę
2. Kliknij przycisk "👥 Udostępnij"
3. Wybierz uprawnienia (tylko odczyt lub edycja)
4. Ustaw czas wygaśnięcia linku
5. Skopiuj i wyślij link

### Eksport danych
1. Przejdź do "⚙️ Ustawienia"
2. Kliknij "📤 Eksportuj notatki"
3. Wybierz format (JSON, TXT, MD, CSV)
4. Plik zostanie automatycznie pobrany

## 🔒 Bezpieczeństwo

- Hasła hashowane za pomocą bcrypt
- Tokeny JWT do autoryzacji
- Ochrona przed wstrzyknięciami SQL
- CORS skonfigurowany dla bezpieczeństwa
- Walidacja danych na serwerze
- Automatyczne usuwanie wygasłych linków

## 🐛 Rozwiązywanie problemów

### Backend się nie uruchamia
```bash
# Sprawdź wersję Node.js
node --version  # Powinno być >= 16.0.0

# Przeinstaluj zależności
rm -rf node_modules package-lock.json
npm install

# Sprawdź uprawnienia do plików
chmod 755 ./
```

### Frontend nie łączy się z Backend
```bash
# Upewnij się że backend działa na porcie 5000
curl http://localhost:5000/api/health

# Sprawdź proxy w package.json
"proxy": "http://localhost:5000"
```

### Błędy bazy danych
```bash
# Usuń bazę danych i utwórz ponownie
rm backend/database.db
# Uruchom ponownie backend - baza zostanie utworzona automatycznie
```

### Problemy z autoryzacją
```bash
# Wyczyść localStorage w przeglądarce
# Otwórz DevTools > Application > Storage > Clear Storage
```

## 📊 Wydajność

- **Backend**: Obsługuje do 1000 żądań na sekundę
- **Baza danych**: SQLite - optymalna dla do 100,000 notatek
- **Frontend**: React z optymalizacją renderowania
- **Rozmiar**: Backend ~50MB, Frontend ~2MB

## 🔄 Aktualizacje

### Wersja 1.0.0 (Obecna)
- ✅ Podstawowa funkcjonalność notatek
- ✅ System autoryzacji
- ✅ Edytor Markdown
- ✅ Wyszukiwanie i eksport
- ✅ System udostępniania

### Planowane funkcje v1.1.0
- 📁 Foldery do organizacji notatek
- 🏷️ System tagów
- 📱 Aplikacja mobilna
- 🔄 Synchronizacja między urządzeniami
- 👥 Praca zespołowa

## 🤝 Rozwój

### Rozwój lokalny
```bash
# Backend z automatycznym przeładowaniem
cd backend
npm install -g nodemon
nodemon server.js

# Frontend z hot reload
cd frontend  
npm start
```

### Struktura kodu
- **Architektura MVC** na backend
- **Architektura oparta na komponentach** na frontend
- **RESTful API** do komunikacji między częściami
- **Responsywny design** dla wszystkich urządzeń

### Testowanie
```bash
# Testy API backend
cd backend
npm test

# Testy komponentów frontend  
cd frontend
npm test
```

## 📄 Licencja

Licencja MIT - zobacz plik LICENSE dla szczegółów

## 👨‍💻 Autor

**Illia Yakovunyk** - Full Stack Developer

## 🙋‍♂️ Wsparcie

Jeśli masz pytania lub problemy:

1. **Sprawdź ten README** - większość pytań jest opisana powyżej
2. **Sprawdź logi** - `console.log` w przeglądarce i terminalu
3. **Utwórz Issue** - opisz problem szczegółowo
4. **Zrób Fork i ulepsz** - chętnie przyjmiemy ulepszenia!

