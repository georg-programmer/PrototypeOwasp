// A9: Security Events in die DB loggen (Audit-Trail)

import { prisma } from "./prisma"

export type SecurityEvent =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "ACCOUNT_LOCKED"
  | "REGISTER"
  | "LOGOUT"
  | "UNAUTHORIZED_ACCESS"
  | "RATE_LIMITED"
  | "SSRF_BLOCKED"

export async function logSecurityEvent(
  eventType: SecurityEvent,
  userId: number | null,
  ip: string | null,
  details?: string
) {
  await prisma.securityLog.create({
    data: { eventType, userId, ip, details }
  })
}
