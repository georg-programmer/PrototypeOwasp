import { getSession } from "@/app/services/auth.service"

export async function GET() {
  const response = await getSession()

  if (response.error) {
    return Response.json({ error: response.error }, { status: response.status })
  }
  return Response.json(response.data, { status: response.status })
}
