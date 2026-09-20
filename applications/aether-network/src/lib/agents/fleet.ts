import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { emit } from "@/lib/events";
import { runHunt, runPaidTask, ensureHunters } from "@/lib/agents/hunters";
import { settleTask } from "@/lib/market/settlement";
import { nowMs } from "@/lib/utils";

let busy = false;

export async function startFleet() {
  ensureHunters();
  emit("info", "Aether fleet online");
  await tick();
  setInterval(() => {
    void tick();
  }, 12_000);
}

async function tick() {
  if (busy) return;
  busy = true;
  try {
    await processJobs();
    await huntIfQuiet();
  } catch (error) {
    emit("error", `Fleet tick failed: ${String(error)}`);
  } finally {
    busy = false;
  }
}

async function processJobs() {
  const db = getDb();
  const queued = db
    .select()
    .from(schema.jobs)
    .where(eq(schema.jobs.status, "queued"))
    .all();

  for (const job of queued) {
    db.update(schema.jobs)
      .set({ status: "running", updatedAt: nowMs() })
      .where(eq(schema.jobs.id, job.id))
      .run();
    try {
      const payload = JSON.parse(job.payloadJson) as {
        taskId?: string;
        hunterId?: "nyx" | "vesper";
      };
      const kind = readJobKind(job.kind);
      switch (kind) {
        case "hunt":
          await runHunt(payload.hunterId === "vesper" ? "vesper" : "nyx");
          break;
        case "run-task":
          if (payload.taskId) {
            await runPaidTask(payload.taskId);
            await settleTask(payload.taskId);
          }
          break;
        case "settle":
          if (payload.taskId) await settleTask(payload.taskId);
          break;
        default: {
          const _never: never = kind;
          throw new Error(`unknown job ${_never}`);
        }
      }
      db.update(schema.jobs)
        .set({ status: "done", updatedAt: nowMs() })
        .where(eq(schema.jobs.id, job.id))
        .run();
    } catch (error) {
      db.update(schema.jobs)
        .set({ status: "error", error: String(error), updatedAt: nowMs() })
        .where(eq(schema.jobs.id, job.id))
        .run();
    }
  }
}

async function huntIfQuiet() {
  const recent = getDb()
    .select()
    .from(schema.jobs)
    .all()
    .filter((job) => job.kind === "hunt" && Date.now() - job.createdAt < 25_000);
  if (recent.length > 0) return;

  const which = Date.now() % 2 === 0 ? "nyx" : "vesper";
  getDb()
    .insert(schema.jobs)
    .values({
      id: crypto.randomUUID(),
      kind: "hunt",
      payloadJson: JSON.stringify({ hunterId: which }),
      status: "queued",
      createdAt: nowMs(),
      updatedAt: nowMs(),
    })
    .run();
}

type JobKind = "hunt" | "run-task" | "settle";

function readJobKind(kind: string): JobKind {
  if (kind === "hunt" || kind === "run-task" || kind === "settle") return kind;
  throw new Error(`unknown job ${kind}`);
}

export function enqueueHunt(hunterId: "nyx" | "vesper") {
  getDb()
    .insert(schema.jobs)
    .values({
      id: crypto.randomUUID(),
      kind: "hunt",
      payloadJson: JSON.stringify({ hunterId }),
      status: "queued",
      createdAt: nowMs(),
      updatedAt: nowMs(),
    })
    .run();
}
