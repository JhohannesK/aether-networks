import { desc, gt } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { nowMs } from "@/lib/utils";

export function emit(
  level: "info" | "warn" | "error",
  message: string,
  payload?: unknown,
) {
  getDb()
    .insert(schema.events)
    .values({
      level,
      message,
      payloadJson: payload ? JSON.stringify(payload) : null,
      createdAt: nowMs(),
    })
    .run();
}

export function recentEvents(limit = 40) {
  return getDb()
    .select()
    .from(schema.events)
    .orderBy(desc(schema.events.id))
    .limit(limit)
    .all();
}

export function eventsAfter(id: number) {
  return getDb()
    .select()
    .from(schema.events)
    .where(gt(schema.events.id, id))
    .all();
}
