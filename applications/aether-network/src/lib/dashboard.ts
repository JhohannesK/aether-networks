import { desc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { ensureHunters, listHunters, listOpportunities, listSessions } from "@/lib/agents/hunters";
import { recentEvents } from "@/lib/events";
import { listTasks } from "@/lib/market/tasks";
import { listWallets } from "@/lib/market/wallets";

export function snapshot() {
  ensureHunters();
  const db = getDb();
  return {
    hunters: listHunters(),
    opportunities: listOpportunities(),
    tasks: listTasks(),
    sessions: listSessions(),
    wallets: listWallets(),
    ledger: db.select().from(schema.ledger).orderBy(desc(schema.ledger.createdAt)).all(),
    events: recentEvents(24),
  };
}
