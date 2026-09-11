# OWASP Top 10 Prototyp

Maturaprojekt-Prototyp der die OWASP Top 10 Schwachstellen im Backend abdeckt.



## Projektstruktur

```
lib/                         Hilfsfunktionen
├── prisma.ts                DB-Verbindung (Singleton)
├── auth.ts                  JWT, bcrypt, Cookies
├── rate-limit.ts            Rate Limiting pro IP
├── security-log.ts          Security Events loggen
└── ssrf-guard.ts            URL-Allowlist (SSRF-Schutz)

app/services/                Geschäftslogik
├── auth.service.ts          Register, Login, Logout, Session
├── admin.service.ts         Security Logs (nur Admins)
└── proxy.service.ts         SSRF-geschützter URL-Proxy

app/api/                     API-Endpunkte
├── auth/register/route.ts   POST — Registrierung
├── auth/login/route.ts      POST — Login
├── auth/logout/route.ts     POST — Logout
├── auth/session/route.ts    GET  — Aktuelle Session
├── admin/route.ts           GET  — Security Logs (Admin)
└── proxy/route.ts           POST — Externe URL fetchen

prisma/
├── schema.prisma            DB-Schema (User, Session, SecurityLog)
└── migrations/              SQL-Migrationen
```

## OWASP Top 10 Abdeckung

| # | Schwachstelle | Umsetzung |
|---|---|---|
| A1 | Broken Access Control | Rollen-Check serverseitig aus signiertem JWT |
| A2 | Cryptographic Failures | bcrypt (12 Runden), HttpOnly Cookies |
| A3 | Injection | Zod-Validierung + Prisma parameterisierte Queries |
| A4 | Insecure Design | Rate Limiting, Account Lockout nach 5 Fehlversuchen |
| A5 | Security Misconfiguration | Security Headers (CSP, HSTS, X-Frame-Options) |
| A6 | Outdated Components | `npm audit` |
| A7 | Auth Failures | JWT-Signaturprüfung, sichere Session-Verwaltung |
| A8 | Supply Chain | `npm ci` in Production |
| A9 | Logging & Monitoring | Alle Security Events in SecurityLog-Tabelle |
| A10 | SSRF | URL-Allowlist, nur HTTPS, interne IPs blockiert |

## Tech Stack

- **Next.js 16** (App Router)
- **PostgreSQL** auf Render (Frankfurt)
- **Prisma 7** als ORM
- **bcryptjs** / **jose** / **zod** für Sicherheit

Siehe [TECHSTACK.md](./TECHSTACK.md) für Details.
