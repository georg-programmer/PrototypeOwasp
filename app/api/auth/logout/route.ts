import { logoutUser } from "@/app/services/auth.service"

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown"
  const response = await logoutUser(ip)
  return Response.json(response.data, { status: response.status })
}
