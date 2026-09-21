import { desc, eq } from "drizzle-orm";
import { isLiveSolari } from "@/lib/config";
import { getDb, schema } from "@/lib/db";
import { emit } from "@/lib/events";
import { scoreHtmlOnce } from "@/lib/solari/sandbox";
import {
  launchHunter,
  persistProfile,
  replayUrlAfterClose,
} from "@/lib/solari/launch";
import {
  getSource,
  inferSource,
  withScores,
  type FoundOpportunity,
  type SourceId,
} from "@/lib/agents/sources";
import { ensureWallets } from "@/lib/market/wallets";
import { hostOf } from "@/lib/replay/surface";
import { nowMs } from "@/lib/utils";

export const HUNTER_DEFS = [
  {
    id: "nyx",
    name: "Nyx",
    field: "lime",
    source: "dexscreener",
    role: "hunter",
    proxySession: "aether-nyx",
  },
  {
    id: "vesper",
    name: "Vesper",
    field: "violet",
    source: "github",
    role: "hunter",
    proxySession: "aether-vesper",
  },
  {
    id: "helix",
    name: "Helix",
    field: "butter",
    source: "tasks",
    role: "worker",
    proxySession: "aether-helix",
  },
] as const;

export type HunterId = (typeof HUNTER_DEFS)[number]["id"];

export function ensureHunters() {
  ensureWallets();
  const db = getDb();
  for (const hunter of HUNTER_DEFS) {
    const row = db
      .select()
      .from(schema.hunters)
      .where(eq(schema.hunters.id, hunter.id))
      .get();
    if (row) continue;
    db.insert(schema.hunters)
      .values({
        id: hunter.id,
        name: hunter.name,
        field: hunter.field,
        source: hunter.source,
        role: hunter.role,
        status: "idle",
        profileId: null,
        proxySession: hunter.proxySession,
        walletId: hunter.id,
        deliveries: 0,
      })
      .run();
  }
  seedFixtureFeed();
}

export function listHunters() {
  ensureHunters();
  return getDb().select().from(schema.hunters).all();
}

export function listOpportunities() {
  return getDb()
    .select()
    .from(schema.opportunities)
    .orderBy(desc(schema.opportunities.createdAt))
    .all();
}

export function listSessions() {
  return getDb()
    .select()
    .from(schema.sessions)
    .orderBy(desc(schema.sessions.startedAt))
    .all();
}

export function getSession(id: string) {
  return (
    getDb()
      .select()
      .from(schema.sessions)
      .where(eq(schema.sessions.id, id))
      .get() ?? null
  );
}

function setHunter(id: string, status: string, patch: { profileId?: string | null } = {}) {
  getDb()
    .update(schema.hunters)
    .set({
      status,
      lastSeenAt: nowMs(),
      ...patch,
    })
    .where(eq(schema.hunters.id, id))
    .run();
}

export async function runHunt(hunterId: HunterId) {
  ensureHunters();
  const hunter = HUNTER_DEFS.find((item) => item.id === hunterId);
  if (!hunter || hunter.role !== "hunter") return [];

  setHunter(hunterId, "hunting");
  emit("info", `${hunter.name} is hunting ${hunter.source}`);

  const plugin = getSource(hunter.source as SourceId);
  if (!plugin.fetch) {
    setHunter(hunterId, "idle");
    return [];
  }
  const found = await plugin.fetch();

  const scored = withScores(found).sort((a, b) => b.scored.score - a.scored.score);
  const top = scored[0];
  if (!top) {
    setHunter(hunterId, "idle");
    return [];
  }

  const session = await captureSession({
    hunterId,
    kind: "hunt",
    title: `${hunter.name} · ${top.title}`,
    url: top.url,
    html: top.html,
    source: top.source,
  });

  const written = persistOpportunities(hunterId, scored, session.id);
  setHunter(hunterId, "idle", { profileId: session.profileId });
  emit("info", `${hunter.name} filed ${written} opportunities`);
  return written;
}

export async function runPaidTask(taskId: string) {
  ensureHunters();
  const db = getDb();
  const task = db.select().from(schema.tasks).where(eq(schema.tasks.id, taskId)).get();
  if (!task) return;
  if (task.status !== "open" && task.status !== "claimed") return;

  setHunter("helix", "working");
  db.update(schema.tasks)
    .set({ status: "claimed", hunterId: "helix", updatedAt: nowMs() })
    .where(eq(schema.tasks.id, taskId))
    .run();
  emit("info", `Helix claimed ${task.title}`);

  db.update(schema.tasks)
    .set({ status: "running", updatedAt: nowMs() })
    .where(eq(schema.tasks.id, taskId))
    .run();

  try {
    const html = await fetchPageHtml(task.url);
    const source = inferSource(task.url);
    const session = await captureSession({
      hunterId: "helix",
      kind: "task",
      title: `Helix · ${task.title}`,
      url: task.url,
      html,
      source,
    });

    const { result, via } = await scoreHtmlOnce(html, source, task.url);
    const payload = {
      title: task.title,
      url: task.url,
      score: result.score,
      reasons: result.reasons,
      scoredVia: via,
      replayPath: `/watch/${session.id}`,
      excerpt: html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 280),
    };

    db.update(schema.tasks)
      .set({
        status: "complete",
        resultJson: JSON.stringify(payload),
        sessionId: session.id,
        hunterId: "helix",
        updatedAt: nowMs(),
      })
      .where(eq(schema.tasks.id, taskId))
      .run();

    const helix = db.select().from(schema.hunters).where(eq(schema.hunters.id, "helix")).get();
    db.update(schema.hunters)
      .set({
        status: "idle",
        lastSeenAt: nowMs(),
        deliveries: (helix?.deliveries ?? 0) + 1,
      })
      .where(eq(schema.hunters.id, "helix"))
      .run();

    emit("info", `Helix completed ${task.title} · score ${result.score}`);
    return payload;
  } catch (error) {
    db.update(schema.tasks)
      .set({
        status: "failed",
        resultJson: JSON.stringify({ error: String(error) }),
        updatedAt: nowMs(),
      })
      .where(eq(schema.tasks.id, taskId))
      .run();
    setHunter("helix", "idle");
    emit("error", `Helix failed ${task.title}`);
    throw error;
  }
}

function persistOpportunities(
  hunterId: string,
  items: Array<FoundOpportunity & { scored: { score: number; reasons: string[] } }>,
  sessionId: string,
) {
  const db = getDb();
  let written = 0;
  for (const item of items.slice(0, 5)) {
    const exists = db
      .select()
      .from(schema.opportunities)
      .all()
      .some((row) => row.url === item.url);
    if (exists) continue;
    db.insert(schema.opportunities)
      .values({
        id: crypto.randomUUID(),
        source: item.source,
        hunterId,
        title: item.title,
        url: item.url,
        score: item.scored.score,
        reasonsJson: JSON.stringify(item.scored.reasons),
        rawJson: JSON.stringify(item.raw),
        sessionId,
        createdAt: nowMs(),
      })
      .run();
    written += 1;
  }
  return written;
}

async function fetchPageHtml(url: string) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "aether-network-mvp" },
    });
    const html = await res.text();
    return html.slice(0, 20_000);
  } catch {
    const host = hostOf(url);
    return `<html><title>${host}</title><body>Recorded surface ${url}</body></html>`;
  }
}

async function captureSession(input: {
  hunterId: string;
  kind: "hunt" | "task";
  title: string;
  url: string;
  html: string;
  source: SourceId;
}) {
  const id = crypto.randomUUID();
  const startedAt = nowMs();
  const mode = isLiveSolari() ? "live" : "mock";
  const timeline = [
    { t: 0, action: "launch", detail: `${mode} stealth session` },
    { t: 400, action: "goto", detail: input.url },
    { t: 1200, action: "extract", detail: "DOM + public APIs" },
    { t: 1800, action: "score", detail: "sandbox once, then local" },
    { t: 2200, action: "close", detail: "persist profile + recording" },
  ];

  let solariSessionId: string | null = null;
  let replayUrl: string | null = `/watch/${id}`;
  let profileId: string | null = null;
  let excerpt = input.html;

  if (isLiveSolari()) {
    try {
      const launched = await launchHunter({
        profileName: `aether-${input.hunterId}`,
        proxySession: `aether-${input.hunterId}`,
        recording: true,
      });
      profileId = launched.profile.id;
      const page = await launched.context.newPage();
      await page.goto(input.url, { waitUntil: "domcontentloaded", timeout: 45_000 });
      excerpt = (await page.content()).slice(0, 20_000);
      solariSessionId = launched.browser.id;
      await persistProfile(launched.solari, launched.profile.id, launched.context);
      await launched.browser.close();
      replayUrl =
        (await replayUrlAfterClose(launched.solari, launched.browser.id)) ??
        `/watch/${id}`;
      await launched.solari.close();
    } catch (error) {
      emit("warn", `Live Solari failed, using mock recording: ${String(error)}`);
    }
  }

  await scoreHtmlOnce(excerpt, input.source, input.url);

  getDb()
    .insert(schema.sessions)
    .values({
      id,
      solariSessionId,
      hunterId: input.hunterId,
      kind: input.kind,
      mode: solariSessionId ? "live" : "mock",
      replayUrl,
      title: input.title,
      timelineJson: JSON.stringify(timeline),
      htmlExcerpt: excerpt.slice(0, 4000),
      startedAt,
      endedAt: nowMs(),
    })
    .run();

  return { id, profileId, replayUrl };
}

function seedFixtureFeed() {
  const db = getDb();
  if (db.select().from(schema.opportunities).all().length > 0) return;
  const sessionId = crypto.randomUUID();
  db.insert(schema.sessions)
    .values({
      id: sessionId,
      solariSessionId: null,
      hunterId: "nyx",
      kind: "hunt",
      mode: "mock",
      replayUrl: `/watch/${sessionId}`,
      title: "Nyx · fixture warmup",
      timelineJson: JSON.stringify([
        { t: 0, action: "launch", detail: "mock stealth session" },
        { t: 800, action: "goto", detail: "https://dexscreener.com" },
        { t: 1400, action: "extract", detail: "fixture pairs until the worker hunts" },
      ]),
      htmlExcerpt:
        "<html><title>NYX/USDC</title><body>Solana pair NYX/USDC liquidity $42800</body></html>",
      startedAt: nowMs(),
      endedAt: nowMs(),
    })
    .run();
  const fixtures = [
    {
      hunterId: "nyx",
      source: "dexscreener",
      title: "NYX/USDC",
      url: "https://dexscreener.com/solana/fixture-nyx",
      score: 86,
      reasons: ["liquidity ≥ $10k", "pair younger than 90m", "Solana surface"],
    },
    {
      hunterId: "vesper",
      source: "github",
      title: "helix-labs/agent-market",
      url: "https://github.com/solari-sdk/solari-cookbook",
      score: 68,
      reasons: ["early signal on GitHub", "launch / market language"],
    },
  ];
  for (const item of fixtures) {
    db.insert(schema.opportunities)
      .values({
        id: crypto.randomUUID(),
        source: item.source,
        hunterId: item.hunterId,
        title: item.title,
        url: item.url,
        score: item.score,
        reasonsJson: JSON.stringify(item.reasons),
        rawJson: JSON.stringify({ fixture: true }),
        sessionId,
        createdAt: nowMs(),
      })
      .run();
  }
}
