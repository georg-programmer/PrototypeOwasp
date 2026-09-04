import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

// JWT_SECRET als Byte-Array kodiert, weil jose das für die Signatur braucht
const secret = new TextEncoder().encode(process.env.JWT_SECRET)
const SESSION_COOKIE = "session_token"

// A2: bcrypt mit 12 Runden — je höher desto langsamer = sicherer gegen Brute-Force
export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

// A7: JWT erstellen — enthält userId und role, signiert mit dem Secret
export async function createToken(userId: number, role: string) {
  return new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret)
}

// Token entschlüsseln UND Signatur prüfen — wirft Fehler bei Manipulation
export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret)
  return payload as { userId: number; role: string }
}

// A2: HttpOnly Cookie — JavaScript im Browser kann den Cookie nicht lesen (XSS-Schutz)
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,                                    // nicht per JS auslesbar
    secure: process.env.NODE_ENV === "production",     // nur über HTTPS
    sameSite: "lax",                                   // CSRF-Schutz
    maxAge: 3600,                                      // 1 Stunde in Sekunden
    path: "/"
  })
}

export async function getSessionCookie() {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE)?.value
}

export async function deleteSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

// A1: User-Identität aus dem serverseitigen Token ableiten, nicht vom Client vertrauen
export async function getCurrentUser() {
  const token = await getSessionCookie()
  if (!token) return null
  try {
    return await verifyToken(token)
  } catch {
    return null
  }
}
