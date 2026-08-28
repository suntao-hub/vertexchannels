import { defineConfig } from "prisma/config";

export default defineConfig({
  migrate: {
    async adapter() {
      const { Pool } = await import("@neondatabase/serverless");
      const { PrismaNeon } = await import("@prisma/adapter-neon");
      const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
      return new PrismaNeon(pool);
    },
  },
});
