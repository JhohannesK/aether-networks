import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { config } from "@/lib/config";
import * as schema from "@/lib/db/schema";

type Db = BetterSQLite3Database<typeof schema>;

const globalForDb = globalThis as unknown as {
  aetherSqlite?: Database.Database;
  aetherDrizzle?: Db;
};

function openSqlite() {
  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
  const sqlite = new Database(config.dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS hunters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      field TEXT NOT NULL,
      source TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL,
      profile_id TEXT,
      proxy_session TEXT NOT NULL,
      wallet_id TEXT NOT NULL,
      last_seen_at INTEGER,
      deliveries INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS wallets (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      owner_id TEXT,
      pubkey TEXT NOT NULL,
      secret TEXT NOT NULL,
      solari_credits REAL NOT NULL DEFAULT 0,
      withdrawable REAL NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS opportunities (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      hunter_id TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      score REAL NOT NULL,
      reasons_json TEXT NOT NULL,
      raw_json TEXT NOT NULL,
      session_id TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      bounty_usdc REAL NOT NULL,
      status TEXT NOT NULL,
      poster_wallet TEXT,
      hunter_id TEXT,
      result_json TEXT,
      session_id TEXT,
      opportunity_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      solari_session_id TEXT,
      hunter_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      mode TEXT NOT NULL,
      replay_url TEXT,
      title TEXT NOT NULL,
      timeline_json TEXT NOT NULL,
      html_excerpt TEXT,
      started_at INTEGER NOT NULL,
      ended_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS ledger (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      from_wallet TEXT,
      to_wallet TEXT,
      task_id TEXT,
      simulated INTEGER NOT NULL,
      tx_sig TEXT,
      note TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      status TEXT NOT NULL,
      error TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      payload_json TEXT,
      created_at INTEGER NOT NULL
    );
  `);
  return sqlite;
}

export function getSqlite() {
  if (!globalForDb.aetherSqlite) {
    globalForDb.aetherSqlite = openSqlite();
  }
  return globalForDb.aetherSqlite;
}

export function getDb() {
  if (!globalForDb.aetherDrizzle) {
    globalForDb.aetherDrizzle = drizzle(getSqlite(), { schema });
  }
  return globalForDb.aetherDrizzle;
}

export { schema };
