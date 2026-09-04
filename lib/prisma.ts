import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

// Connection Pool: hält DB-Verbindungen offen statt jedes Mal neu aufzubauen
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // nötig für Render-gehostete DBs
})

const adapter = new PrismaPg(pool)

// Verhindert dass bei Hot-Reload im Dev-Modus jedes Mal ein neuer Client erstellt wird
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
