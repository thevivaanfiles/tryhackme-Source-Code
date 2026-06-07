import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 reads connection + migration config from here (not the schema).
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
