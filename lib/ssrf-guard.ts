// A10: SSRF-Schutz — verhindert dass der Server interne Dienste aufruft

// Allowlist: nur diese Domains darf der Server aufrufen
const ALLOWED_DOMAINS = [
  "api.github.com",
  "jsonplaceholder.typicode.com"
]

export function validateUrl(urlString: string): { valid: boolean; error?: string } {
  let url: URL
  try {
    url = new URL(urlString)
  } catch {
    return { valid: false, error: "Ungültige URL" }
  }

  if (url.protocol !== "https:") {
    return { valid: false, error: "Nur HTTPS erlaubt" }
  }

  if (!ALLOWED_DOMAINS.includes(url.hostname)) {
    return { valid: false, error: `Domain '${url.hostname}' nicht erlaubt` }
  }

  // interne IPs blockieren (z.B. localhost, 192.168.x.x)
  const hostname = url.hostname
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("172.")
  ) {
    return { valid: false, error: "Interne Adressen nicht erlaubt" }
  }

  return { valid: true }
}
