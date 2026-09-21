import Link from "next/link";
import { CreateTaskDialog } from "@/components/create-task-dialog";
import { LiveDot } from "@/components/live-dot";
import { Nav } from "@/components/nav";
import { StatusBanner } from "@/components/status-banner";
import { snapshot } from "@/lib/dashboard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function FeedPage() {
  const data = snapshot();
  const treasury = data.wallets.find((wallet) => wallet.id === "treasury");

  return (
    <main className="min-h-screen">
      <Nav />
      <StatusBanner />
      <section className="px-5 pb-16 md:px-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <LiveDot label="Opportunity floor" />
            <h1 className="mt-3 text-5xl md:text-7xl">The feed</h1>
            <p className="mt-3 max-w-xl text-sm text-muted">
              Hunters file the floor. Post any https URL as a bounty and Helix
              records the run. Scores are sandbox-once, then local.
            </p>
          </div>
          <CreateTaskDialog demoPubkey={treasury?.pubkey} />
        </div>

        {data.opportunities.length === 0 ? (
          <EmptyFeed demoPubkey={treasury?.pubkey} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.opportunities.map((item) => {
              const reasons = JSON.parse(item.reasonsJson) as string[];
              return (
                <article key={item.id} className="rounded-[28px] bg-card p-6 hairline">
                  <div className="flex items-center justify-between text-[11px] tracking-[0.16em] uppercase text-muted">
                    <span>{item.source}</span>
                    <span className="text-mint">{item.hunterId}</span>
                  </div>
                  <h2 className="mt-4 text-3xl">{item.title}</h2>
                  <p className="mt-3 text-sm text-muted break-all">{item.url}</p>
                  <div className="mt-5 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-4xl text-mint">{Math.round(item.score)}</p>
                      <p className="text-xs text-muted">{reasons.join(" · ")}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {item.sessionId ? (
                        <Link href={`/watch/${item.sessionId}`} className="text-xs text-mint">
                          Replay
                        </Link>
                      ) : null}
                      <CreateTaskDialog
                        defaultTitle={`Work ${item.title}`}
                        defaultUrl={item.url}
                        opportunityId={item.id}
                        demoPubkey={treasury?.pubkey}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

function EmptyFeed({ demoPubkey }: { demoPubkey?: string }) {
  return (
    <div className="rounded-[32px] bg-card px-8 py-16 text-center hairline">
      <p className="serif text-4xl">Nothing on the floor yet.</p>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted">
        Post any https URL as a bounty. Or start `npm run agents` and let Nyx /
        Vesper file the first cards.
      </p>
      <div className="mt-6 flex justify-center">
        <CreateTaskDialog demoPubkey={demoPubkey} />
      </div>
    </div>
  );
}
