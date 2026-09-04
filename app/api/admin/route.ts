import { getSecurityLogs } from "@/app/services/admin.service"

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown"
  const response = await getSecurityLogs(ip)

  if (response.error) {
    return Response.json({ error: response.error }, { status: response.status })
  }
  return Response.json(response.data, { status: response.status })
}
