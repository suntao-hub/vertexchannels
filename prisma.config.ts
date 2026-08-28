import { defineConfig } from "prisma/config";

export default defineConfig({
  migrate: {
    async adapter() {
      const { neon } = await import("@neondatabase/serverless");
      const { PrismaNeonHTTP } = await import("@prisma/adapter-neon");
      const sql = neon(process.env.DATABASE_URL!);
      return new PrismaNeonHTTP(sql);
    },
  },
});
