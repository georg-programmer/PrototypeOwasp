import { prisma } from "@/lib/prisma"
import { hashPassword, verifyPassword, createToken, setSessionCookie, getCurrentUser, deleteSessionCookie } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rate-limit"
import { logSecurityEvent } from "@/lib/security-log"

const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 Minuten Sperre
const MAX_FAILED_ATTEMPTS = 5

export async function registerUser(email: string, password: string, ip: string) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: "E-Mail bereits registriert", status: 409 }
  }

  // A2: Passwort mit bcrypt hashen, nie im Klartext speichern
  const passwordHash = await hashPassword(password)

  const user = await prisma.user.create({
    data: { email, passwordHash }
  })

  await logSecurityEvent("REGISTER", user.id, ip)
  return { data: { id: user.id, email: user.email }, status: 201 }
}

export async function loginUser(email: string, password: string, ip: string) {
  // A4: Rate Limiting pro IP
  const rateCheck = checkRateLimit(ip)
  if (!rateCheck.allowed) {
    await logSecurityEvent("RATE_LIMITED", null, ip)
    return { error: "Zu viele Anfragen. Versuche es später erneut.", status: 429 }
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    // gleiche Meldung wie bei falschem PW → verhindert E-Mail-Enumeration
    await logSecurityEvent("LOGIN_FAILED", null, ip, `Unbekannte E-Mail: ${email}`)
    return { error: "Ungültige Anmeldedaten", status: 401 }
  }

  // A4: Account Lockout prüfen
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await logSecurityEvent("ACCOUNT_LOCKED", user.id, ip)
    return { error: "Konto gesperrt. Versuche es später erneut.", status: 423 }
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    const failedCount = user.failedLoginCount + 1

    // A4: nach 5 Fehlversuchen → Account sperren
    const lockData = failedCount >= MAX_FAILED_ATTEMPTS
      ? { failedLoginCount: failedCount, lockedUntil: new Date(Date.now() + LOCKOUT_DURATION) }
      : { failedLoginCount: failedCount }

    await prisma.user.update({ where: { id: user.id }, data: lockData })

    if (failedCount >= MAX_FAILED_ATTEMPTS) {
      await logSecurityEvent("ACCOUNT_LOCKED", user.id, ip, `${failedCount} Fehlversuche`)
    } else {
      await logSecurityEvent("LOGIN_FAILED", user.id, ip, `Fehlversuch ${failedCount}`)
    }

    return { error: "Ungültige Anmeldedaten", status: 401 }
  }

  // Fehlversuche zurücksetzen
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null }
  })

  // A7: Session in DB speichern + JWT in HttpOnly Cookie
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
  const session = await prisma.session.create({
    data: { userId: user.id, expiresAt }
  })

  const token = await createToken(user.id, user.role)
  await setSessionCookie(token)
  await logSecurityEvent("LOGIN_SUCCESS", user.id, ip)

  return { data: { message: "Erfolgreich angemeldet", sessionId: session.id }, status: 200 }
}

export async function logoutUser(ip: string) {
  const user = await getCurrentUser()

  if (user) {
    await prisma.session.deleteMany({ where: { userId: user.userId } })
    await logSecurityEvent("LOGOUT", user.userId, ip)
  }

  await deleteSessionCookie()
  return { data: { message: "Erfolgreich abgemeldet" }, status: 200 }
}

// A1: userId kommt aus dem signierten Token, nicht vom Client
export async function getSession() {
  const tokenUser = await getCurrentUser()
  if (!tokenUser) {
    return { error: "Nicht angemeldet", status: 401 }
  }

  // select: passwordHash wird nie ans Frontend geschickt
  const user = await prisma.user.findUnique({
    where: { id: tokenUser.userId },
    select: { id: true, email: true, role: true, createdAt: true }
  })

  if (!user) {
    return { error: "User nicht gefunden", status: 404 }
  }

  return { data: user, status: 200 }
}
