import { registerUser } from "@/app/services/auth.service"
import { z } from "zod"

const RegisterSchema = z.object({
  email: z.string().email("Ungültige E-Mail"),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben")
})

export async function POST(request: Request) {
  const body = await request.json()
  const ip = request.headers.get("x-forwarded-for") ?? "unknown"

  // A3: Eingabe mit Zod validieren bevor sie an die DB geht
  const result = RegisterSchema.safeParse(body)
  if (!result.success) {
    return Response.json({ errors: result.error.issues }, { status: 400 })
  }

  const { email, password } = result.data
  const response = await registerUser(email, password, ip)

  if (response.error) {
    return Response.json({ error: response.error }, { status: response.status })
  }
  return Response.json(response.data, { status: response.status })
}
