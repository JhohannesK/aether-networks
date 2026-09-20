import Link from "next/link";
import { notFound } from "next/navigation";
import { LiveDot } from "@/components/live-dot";
import { Nav } from "@/components/nav";
import { getSession } from "@/lib/agents/hunters";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function WatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = getSession(id);
  if (!session) notFound();
  const timeline = JSON.parse(session.timelineJson) as Array<{
    t: number;
    action: string;
    detail: string;
  }>;
  const external =
    session.replayUrl?.startsWith("http") ? session.replayUrl : null;

  return (
    <main className="min-h-screen">
      <Nav />
      <section className="px-5 pb-16 md:px-10">
        <LiveDot label={session.mode === "live" ? "Solari replay" : "Simulated replay"} />
        <h1 className="mt-3 max-w-4xl text-4xl md:text-6xl">{session.title}</h1>
        <p className="mt-3 text-sm text-muted">
          {session.hunterId} · {session.kind} · recording is the proof of work
        </p>

        <div className="mt-8 overflow-hidden rounded-[32px] bg-card hairline">
          {external ? (
            <iframe
              title="Solari session replay"
              src={external}
              className="h-[560px] w-full bg-black"
            />
          ) : (
            <div className="grid gap-6 p-8 md:grid-cols-[1.2fr_0.8fr]">
              <div>
                <p className="text-[11px] tracking-[0.16em] uppercase text-mint">
                  Timeline
                </p>
                <ol className="mt-4 space-y-4">
                  {timeline.map((step) => (
                    <li key={`${step.t}-${step.action}`} className="flex gap-4">
                      <span className="w-16 font-mono text-xs text-muted">{step.t}ms</span>
                      <div>
                        <p className="text-lg">{step.action}</p>
                        <p className="text-sm text-muted">{step.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
              <pre className="overflow-auto rounded-3xl bg-black p-4 text-xs text-mint/80">
                {(session.htmlExcerpt ?? "").slice(0, 1200)}
              </pre>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-4 text-sm">
          <Link href="/feed" className="text-mint">
            Back to feed
          </Link>
          <Link href={`/api/sessions/${session.id}/replay`} className="text-muted">
            Replay JSON
          </Link>
        </div>
      </section>
    </main>
  );
}
