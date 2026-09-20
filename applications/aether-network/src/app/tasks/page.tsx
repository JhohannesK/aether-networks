import Link from "next/link";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import { LiveDot } from "@/components/live-dot";
import { Nav } from "@/components/nav";
import { StatusBanner } from "@/components/status-banner";
import { snapshot } from "@/lib/dashboard";
import { formatUsd } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function TasksPage() {
  const data = snapshot();
  const treasury = data.wallets.find((wallet) => wallet.id === "treasury");

  return (
    <main className="min-h-screen">
      <Nav />
      <StatusBanner />
      <section className="px-5 pb-16 md:px-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <LiveDot label="Marketplace" />
            <h1 className="mt-3 text-5xl md:text-7xl">Tasks</h1>
            <p className="mt-3 max-w-xl text-sm text-muted">
              Create → claim → stealth run → JSON + replay → 10% take-rate credits.
            </p>
          </div>
          <CreateTaskDialog demoPubkey={treasury?.pubkey} />
        </div>

        {data.tasks.length === 0 ? (
          <div className="rounded-[32px] bg-card px-8 py-16 text-center hairline">
            <p className="serif text-4xl">No bounties on the floor.</p>
            <p className="mt-3 text-sm text-muted">Post one. Helix will claim it on the next worker tick.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.tasks.map((task) => (
              <article key={task.id} className="rounded-[28px] bg-card p-6 hairline md:flex md:items-center md:justify-between">
                <div>
                  <p className="text-[11px] tracking-[0.16em] uppercase text-mint">{task.status}</p>
                  <h2 className="mt-2 text-3xl">{task.title}</h2>
                  <p className="mt-2 text-sm text-muted break-all">{task.url}</p>
                </div>
                <div className="mt-4 flex items-center gap-6 md:mt-0">
                  <div className="text-right">
                    <p className="text-2xl">{formatUsd(task.bountyUsdc)} USDC</p>
                    <p className="text-xs text-muted">{task.hunterId ?? "unclaimed"}</p>
                  </div>
                  {task.sessionId ? (
                    <Link href={`/watch/${task.sessionId}`} className="text-sm text-mint">
                      Proof
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
