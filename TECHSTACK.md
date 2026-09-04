# Technologien & Packages — OWASP Prototyp

## Framework
| Package | Version | Wofür |
|---------|---------|-------|
| next | 16.3.3 | React-Framework mit API-Routes (Backend + Frontend in einem Projekt) |
| react / react-dom | 19.2.8 | Frontend-Rendering (macht der Frontend-Developer) |
| typescript | 5.x | Typisierung für weniger Fehler im Code |

## Datenbank
| Package | Version | Wofür |
|---------|---------|-------|
| prisma | 7.10.0 | ORM — generiert SQL aus TypeScript, macht Migrationen |
| @prisma/client | 7.10.0 | Der generierte DB-Client den wir im Code verwenden |
| @prisma/adapter-pg | 7.10.0 | Verbindet Prisma mit dem pg Connection Pool |
| pg / @types/pg | 8.23.0 | PostgreSQL-Treiber für Node.js |
| dotenv | 17.4.2 | Lädt .env-Datei (DATABASE_URL, JWT_SECRET) |

## Sicherheit
| Package | Version | Wofür | OWASP |
|---------|---------|-------|-------|
| bcryptjs / @types/bcryptjs | 3.0.3 | Passwörter hashen (12 Runden) | A2 |
| jose | 6.x | JWT erstellen und verifizieren (leichtgewichtig, Edge-kompatibel) | A7 |
| zod | 4.5.4 | Input-Validierung (Request-Body prüfen bevor er an die DB geht) | A3 |

## Code-Generierung
| Package | Version | Wofür |
|---------|---------|-------|
| zod-prisma-types | 3.3.11 | Generiert Zod-Schemas aus dem Prisma-Schema |
| tsx | 4.23.13 | TypeScript direkt ausführen (für prisma seed) |

## Styling / Linting
| Package | Version | Wofür |
|---------|---------|-------|
| tailwindcss | 4.x | CSS-Framework (macht der Frontend-Developer) |
| @tailwindcss/postcss | 4.x | Tailwind als PostCSS-Plugin |
| eslint / eslint-config-next | 9.x | Code-Qualitätsprüfung |
| babel-plugin-react-compiler | 1.0.0 | React Compiler für bessere Performance |

## Externe Dienste
| Dienst | Wofür |
|--------|-------|
| Render PostgreSQL (Frankfurt) | Gehostete Datenbank (owasp_db) |

---

## Was ich (Backend) gemacht habe

### Datenbank
- Prisma-Schema mit 3 Tabellen: `User`, `Session`, `SecurityLog`
- Migration auf Render PostgreSQL (Frankfurt)
- DB-Client Singleton (`lib/prisma.ts`)

### Services (Geschäftslogik)
- `app/services/auth.service.ts` — Registrierung, Login mit Account Lockout, Logout, Session
- `app/services/admin.service.ts` — Security Logs abrufen (nur für Admins)
- `app/services/proxy.service.ts` — Externe URLs fetchen mit SSRF-Schutz

### Hilfsfunktionen
- `lib/auth.ts` — Passwort-Hashing (bcrypt), JWT erstellen/prüfen, HttpOnly Cookies
- `lib/rate-limit.ts` — Rate Limiting pro IP (max 5 Versuche / 15 Min)
- `lib/security-log.ts` — Security Events in die DB loggen
- `lib/ssrf-guard.ts` — URL-Allowlist und Protokoll-Validierung

### API-Routes
- `POST /api/auth/register` — Registrierung
- `POST /api/auth/login` — Login (setzt HttpOnly Cookie)
- `POST /api/auth/logout` — Logout (löscht Cookie + Sessions)
- `GET /api/auth/session` — Gibt aktuellen User zurück
- `GET /api/admin` — Security Logs (nur Admins)
- `POST /api/proxy` — Externe URL fetchen (SSRF-geschützt)

### Konfiguration
- `next.config.ts` — Security Headers (X-Frame-Options, CSP, HSTS, etc.)
- `prisma.config.ts` — Prisma-Konfiguration mit DB-URL
- `.env` — Umgebungsvariablen (DATABASE_URL, JWT_SECRET)

### OWASP Top 10 Abdeckung
| # | Schwachstelle | Wo umgesetzt |
|---|---|---|
| A1 | Broken Access Control | `admin.service.ts`, `auth.service.ts` (Rollen-Check) |
| A2 | Cryptographic Failures | `lib/auth.ts` (bcrypt, HttpOnly Cookies) |
| A3 | Injection | Zod-Validierung in allen Routes + Prisma parameterisierte Queries |
| A4 | Insecure Design | `lib/rate-limit.ts`, Account Lockout in `auth.service.ts` |
| A5 | Security Misconfiguration | `next.config.ts` (Security Headers, Source Maps aus) |
| A7 | Auth Failures | `lib/auth.ts` (JWT-Signatur, sichere Sessions) |
| A9 | Logging & Monitoring | `lib/security-log.ts` → SecurityLog-Tabelle |
| A10 | SSRF | `lib/ssrf-guard.ts`, `proxy.service.ts` |

---

## Was der Frontend-Developer machen muss

### Seiten
- **Login-Seite** (`app/login/page.tsx`) — Formular mit E-Mail + Passwort, ruft `POST /api/auth/login` auf
- **Register-Seite** (`app/register/page.tsx`) — Formular, ruft `POST /api/auth/register` auf
- **Dashboard** (`app/page.tsx`) — Zeigt User-Daten, ruft `GET /api/auth/session` auf
- **Admin-Dashboard** (`app/admin/page.tsx`) — Zeigt Security Logs, ruft `GET /api/admin` auf
- **Proxy-Demo** (`app/proxy/page.tsx`) — URL-Eingabefeld, ruft `POST /api/proxy` auf

### Wichtig zu wissen
- **Kein Token-Handling nötig** — Login setzt automatisch ein HttpOnly Cookie, das bei jeder Anfrage mitgeschickt wird
- **Fehler kommen als JSON** — z.B. `{ error: "Ungültige Anmeldedaten" }` mit HTTP-Status 401
- **Session prüfen** — Beim Laden jeder geschützten Seite `GET /api/auth/session` aufrufen, bei 401 → redirect zu `/login`
- **Logout** — Einfach `POST /api/auth/logout` aufrufen, Cookie wird serverseitig gelöscht

### API-Übersicht für den Frontend-Developer

```
POST /api/auth/register
  Body: { "email": "test@mail.com", "password": "12345678" }
  Erfolg: 201 { "id": 1, "email": "test@mail.com" }
  Fehler: 400 (Validierung) | 409 (E-Mail existiert)

POST /api/auth/login
  Body: { "email": "test@mail.com", "password": "12345678" }
  Erfolg: 200 { "message": "Erfolgreich angemeldet", "sessionId": "..." }
  Fehler: 400 (Validierung) | 401 (falsche Daten) | 423 (gesperrt) | 429 (Rate Limit)

POST /api/auth/logout
  Body: (leer)
  Erfolg: 200 { "message": "Erfolgreich abgemeldet" }

GET /api/auth/session
  Erfolg: 200 { "id": 1, "email": "test@mail.com", "role": "user", "createdAt": "..." }
  Fehler: 401 (nicht angemeldet)

GET /api/admin
  Erfolg: 200 [{ "id": 1, "eventType": "LOGIN_SUCCESS", "ip": "...", ... }]
  Fehler: 401 (nicht angemeldet) | 403 (kein Admin)

POST /api/proxy
  Body: { "url": "https://api.github.com/users/octocat" }
  Erfolg: 200 (JSON von der externen URL)
  Fehler: 400 (Validierung) | 401 (nicht angemeldet) | 403 (URL blockiert)
```
