import { PrismaClient } from "@/app/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function makeClient() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? makeClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
