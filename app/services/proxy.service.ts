// A10: SSRF-geschützter Proxy

import { getCurrentUser } from "@/lib/auth"
import { validateUrl } from "@/lib/ssrf-guard"
import { logSecurityEvent } from "@/lib/security-log"

export async function fetchExternalUrl(url: string, ip: string) {
  const user = await getCurrentUser()

  if (!user) {
    return { error: "Nicht angemeldet", status: 401 }
  }

  // URL wird geprüft BEVOR der Server sie aufruft
  const check = validateUrl(url)
  if (!check.valid) {
    await logSecurityEvent("SSRF_BLOCKED", user.userId, ip, `Blockierte URL: ${url} — ${check.error}`)
    return { error: check.error, status: 403 }
  }

  const response = await fetch(url)
  const data = await response.json()

  return { data, status: 200 }
}
