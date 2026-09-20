import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const hunters = sqliteTable("hunters", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  field: text("field").notNull(),
  source: text("source").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull(),
  profileId: text("profile_id"),
  proxySession: text("proxy_session").notNull(),
  walletId: text("wallet_id").notNull(),
  lastSeenAt: integer("last_seen_at"),
  deliveries: integer("deliveries").notNull().default(0),
});

export const wallets = sqliteTable("wallets", {
  id: text("id").primaryKey(),
  role: text("role").notNull(),
  ownerId: text("owner_id"),
  pubkey: text("pubkey").notNull(),
  secret: text("secret").notNull(),
  solariCredits: real("solari_credits").notNull().default(0),
  withdrawable: real("withdrawable").notNull().default(0),
});

export const opportunities = sqliteTable("opportunities", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  hunterId: text("hunter_id").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  score: real("score").notNull(),
  reasonsJson: text("reasons_json").notNull(),
  rawJson: text("raw_json").notNull(),
  sessionId: text("session_id"),
  createdAt: integer("created_at").notNull(),
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  bountyUsdc: real("bounty_usdc").notNull(),
  status: text("status").notNull(),
  posterWallet: text("poster_wallet"),
  hunterId: text("hunter_id"),
  resultJson: text("result_json"),
  sessionId: text("session_id"),
  opportunityId: text("opportunity_id"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  solariSessionId: text("solari_session_id"),
  hunterId: text("hunter_id").notNull(),
  kind: text("kind").notNull(),
  mode: text("mode").notNull(),
  replayUrl: text("replay_url"),
  title: text("title").notNull(),
  timelineJson: text("timeline_json").notNull(),
  htmlExcerpt: text("html_excerpt"),
  startedAt: integer("started_at").notNull(),
  endedAt: integer("ended_at"),
});

export const ledger = sqliteTable("ledger", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  amount: real("amount").notNull(),
  fromWallet: text("from_wallet"),
  toWallet: text("to_wallet"),
  taskId: text("task_id"),
  simulated: integer("simulated").notNull(),
  txSig: text("tx_sig"),
  note: text("note").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull(),
  payloadJson: text("payload_json").notNull(),
  status: text("status").notNull(),
  error: text("error"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  level: text("level").notNull(),
  message: text("message").notNull(),
  payloadJson: text("payload_json"),
  createdAt: integer("created_at").notNull(),
});
