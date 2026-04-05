import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROLES } from "../constants/roles.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, "../../data");
const dbPath = process.env.FINANCE_DB_PATH || path.join(dataDir, "finance.db");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

function ensureColumn(tableName, columnName, definition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK (role IN ('viewer', 'analyst', 'admin')),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS financial_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      category TEXT NOT NULL,
      entry_date TEXT NOT NULL,
      notes TEXT,
      created_by INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      deleted_at TEXT,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
  `);

  ensureColumn("financial_records", "deleted_at", "TEXT");

  const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;

  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (name, email, role, is_active)
      VALUES (?, ?, ?, ?)
    `);

    insertUser.run("Admin User", "admin@finance.local", ROLES.ADMIN, 1);
    insertUser.run("Analyst User", "analyst@finance.local", ROLES.ANALYST, 1);
    insertUser.run("Viewer User", "viewer@finance.local", ROLES.VIEWER, 1);
  }
}
