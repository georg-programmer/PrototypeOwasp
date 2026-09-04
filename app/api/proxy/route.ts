import { fetchExternalUrl } from "@/app/services/proxy.service"
import { z } from "zod"

const ProxySchema = z.object({
  url: z.string().url()
})

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown"

  const body = await request.json()
  const result = ProxySchema.safeParse(body)
  if (!result.success) {
    return Response.json({ errors: result.error.issues }, { status: 400 })
  }

  const response = await fetchExternalUrl(result.data.url, ip)

  if (response.error) {
    return Response.json({ error: response.error }, { status: response.status })
  }
  return Response.json(response.data, { status: response.status })
}
