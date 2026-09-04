// A1: Broken Access Control — Rollenzugriff serverseitig prüfen

import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { logSecurityEvent } from "@/lib/security-log"

export async function getSecurityLogs(ip: string) {
  const user = await getCurrentUser()

  if (!user) {
    return { error: "Nicht angemeldet", status: 401 }
  }

  // Rolle kommt aus dem signierten Token → kann nicht gefälscht werden
  if (user.role !== "admin") {
    await logSecurityEvent("UNAUTHORIZED_ACCESS", user.userId, ip, "Admin-Route ohne Berechtigung")
    return { error: "Keine Berechtigung", status: 403 }
  }

  const logs = await prisma.securityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { email: true } } } // JOIN: E-Mail zum Log-Eintrag laden
  })

  return { data: logs, status: 200 }
}
