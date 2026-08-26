import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";

let adapter: any;

if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) {
  const pool = new pg.Pool({ connectionString: dbUrl });
  adapter = new PrismaPg(pool);
} else {
  const filePath = dbUrl.startsWith("file:") ? dbUrl.replace("file:", "") : dbUrl;
  adapter = new PrismaBetterSqlite3({ url: filePath });
}

export const prisma = new PrismaClient({ adapter });
