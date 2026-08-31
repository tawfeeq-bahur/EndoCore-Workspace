import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const rawUrl = process.env.DATABASE_URL || "";
const dbUrl = rawUrl.startsWith("file:") ? rawUrl : "file:./dev.db";

const adapter = new PrismaBetterSqlite3({ url: dbUrl });
export const prisma = new PrismaClient({ adapter });


