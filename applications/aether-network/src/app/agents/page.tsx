import Link from "next/link";
import { AgentAvatar } from "@/components/agent-avatar";
import { LiveDot } from "@/components/live-dot";
import { Nav } from "@/components/nav";
import { StatusBanner } from "@/components/status-banner";
import { snapshot } from "@/lib/dashboard";
import { formatUsd, shortAddr } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default function AgentsPage() {
  const data = snapshot();
  const network = data.wallets.find((wallet) => wallet.id === "network");

  return (
    <main className="min-h-screen">
      <Nav />
      <StatusBanner />
      <section className="px-5 pb-16 md:px-10">
        <LiveDot label="Fleet" />
        <h1 className="mt-3 text-5xl md:text-7xl">Agents</h1>
        <p className="mt-3 max-w-xl text-sm text-muted">
          Each hunter has stealth, a sticky residential proxy, a persistent profile, and
          recording. Wallets are derived from AETHER_MASTER_SEED and never committed.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {data.hunters.map((hunter) => {
            const wallet = data.wallets.find((item) => item.id === hunter.id);
            return (
              <article key={hunter.id} className="rounded-[28px] bg-card p-6 hairline">
                <div className="flex items-center justify-between">
                  <AgentAvatar name={hunter.name} field={hunter.field} size="lg" />
                  <LiveDot label={hunter.status} />
                </div>
                <h2 className="mt-6 text-4xl">{hunter.name}</h2>
                <p className="mt-2 text-sm text-muted">
                  {hunter.source} · {hunter.deliveries} deliveries
                </p>
                <p className="mt-4 font-mono text-xs text-muted">
                  {wallet ? shortAddr(wallet.pubkey, 6) : "—"}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <article className="rounded-[28px] bg-card p-6 hairline">
            <p className="text-[11px] tracking-[0.16em] uppercase text-muted">Self-funding</p>
            <h2 className="mt-3 text-4xl">Solari credits</h2>
            <p className="mt-6 text-5xl text-mint">{formatUsd(network?.solariCredits ?? 0)}</p>
            <p className="mt-2 text-sm text-muted">
              Withdrawable surplus {formatUsd(network?.withdrawable ?? 0)} · 10% take-rate
            </p>
            <form action="/api/credits/withdraw" method="post" className="mt-6">
              <button className="rounded-full bg-mint px-5 py-2 text-sm text-mint-ink">
                Withdraw surplus
              </button>
            </form>
          </article>
          <article className="rounded-[28px] bg-card p-6 hairline">
            <p className="text-[11px] tracking-[0.16em] uppercase text-muted">Wallets</p>
            <ul className="mt-4 space-y-3 text-sm">
              {data.wallets.map((wallet) => (
                <li key={wallet.id} className="flex justify-between gap-3">
                  <span className="uppercase tracking-[0.14em] text-muted">{wallet.role}</span>
                  <span className="font-mono text-xs">{shortAddr(wallet.pubkey, 5)}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <div className="mt-10">
          <h2 className="text-4xl">Sessions</h2>
          {data.sessions.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No recordings yet. Run the worker.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {data.sessions.map((session) => (
                <li key={session.id}>
                  <Link
                    href={`/watch/${session.id}`}
                    className="flex items-center justify-between rounded-full bg-card px-5 py-3 hairline"
                  >
                    <span>{session.title}</span>
                    <span className="text-xs uppercase tracking-[0.14em] text-mint">
                      {session.mode}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-10">
          <h2 className="text-4xl">Ledger</h2>
          {data.ledger.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Empty until a task settles.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {data.ledger.map((row) => (
                <li key={row.id} className="flex justify-between rounded-2xl bg-card px-4 py-3 hairline">
                  <span>
                    {row.type} · {row.note}
                    {row.simulated ? " · Simulated" : ""}
                  </span>
                  <span className="text-mint">{formatUsd(row.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
