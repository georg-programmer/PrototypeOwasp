import { loginUser } from "@/app/services/auth.service"
import { z } from "zod"

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown"

  const body = await request.json()
  const result = LoginSchema.safeParse(body)
  if (!result.success) {
    return Response.json({ errors: result.error.issues }, { status: 400 })
  }

  const { email, password } = result.data
  const response = await loginUser(email, password, ip)

  if (response.error) {
    return Response.json({ error: response.error }, { status: response.status })
  }
  return Response.json(response.data, { status: response.status })
}
