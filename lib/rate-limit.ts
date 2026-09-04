// A4: Rate Limiting — begrenzt Anfragen pro IP-Adresse

// Map speichert pro IP: wie viele Versuche und wann das Zeitfenster abläuft
const attempts = new Map<string, { count: number; resetAt: number }>()

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 Minuten

export function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = attempts.get(key)

  // kein Eintrag oder Zeitfenster abgelaufen → neues Fenster starten
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 }
  }

  entry.count++

  if (entry.count > MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0 }
  }

  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count }
}

export function resetRateLimit(key: string) {
  attempts.delete(key)
}
