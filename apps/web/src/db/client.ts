import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";

const defaultPath = path.join(process.cwd(), ".data", "openframe.db");
const dbFilePath = process.env.DATABASE_PATH ?? defaultPath;

fs.mkdirSync(path.dirname(dbFilePath), { recursive: true });

const sqlite = new Database(dbFilePath);

export const db = drizzle(sqlite, { schema });
