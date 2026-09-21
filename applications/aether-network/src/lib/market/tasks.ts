import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { emit } from "@/lib/events";
import { nowMs } from "@/lib/utils";

export type TaskStatus =
  | "open"
  | "claimed"
  | "running"
  | "complete"
  | "failed";

export function listTasks() {
  return getDb()
    .select()
    .from(schema.tasks)
    .orderBy(desc(schema.tasks.createdAt))
    .all();
}

export function getTask(id: string) {
  return (
    getDb().select().from(schema.tasks).where(eq(schema.tasks.id, id)).get() ??
    null
  );
}

export type TaskRow = NonNullable<ReturnType<typeof getTask>>;

/** HTTP-safe task: omit resultJson so /api/tasks is not an x402 backdoor. */
export function publicTask(task: TaskRow) {
  const { resultJson: _resultJson, ...rest } = task;
  return { ...rest, resultJson: null as string | null };
}

export function createTask(input: {
  title: string;
  url: string;
  bountyUsdc: number;
  posterWallet?: string;
  opportunityId?: string;
}) {
  const id = crypto.randomUUID();
  const createdAt = nowMs();
  getDb()
    .insert(schema.tasks)
    .values({
      id,
      title: input.title,
      url: input.url,
      bountyUsdc: input.bountyUsdc,
      status: "open",
      posterWallet: input.posterWallet ?? null,
      opportunityId: input.opportunityId ?? null,
      createdAt,
      updatedAt: createdAt,
    })
    .run();
  getDb()
    .insert(schema.jobs)
    .values({
      id: crypto.randomUUID(),
      kind: "run-task",
      payloadJson: JSON.stringify({ taskId: id }),
      status: "queued",
      createdAt,
      updatedAt: createdAt,
    })
    .run();
  emit("info", `Task posted: ${input.title} · ${input.bountyUsdc} USDC`);
  return getTask(id);
}

export function setTaskStatus(
  id: string,
  status: TaskStatus,
  patch: Partial<{
    hunterId: string | null;
    resultJson: string | null;
    sessionId: string | null;
  }> = {},
) {
  getDb()
    .update(schema.tasks)
    .set({
      status,
      updatedAt: nowMs(),
      ...patch,
    })
    .where(eq(schema.tasks.id, id))
    .run();
}
