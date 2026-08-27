import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";

let prismaInstance: PrismaClient;

if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) {
  const pool = new pg.Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);
  prismaInstance = new PrismaClient({ adapter });
} else {
  const filePath = dbUrl.startsWith("file:") ? dbUrl : `file:${dbUrl}`;
  const adapter = new PrismaBetterSqlite3({ url: filePath });
  prismaInstance = new PrismaClient({ adapter });
}

export const prisma = prismaInstance;


