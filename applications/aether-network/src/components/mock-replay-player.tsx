import type { TimelineStep, ViewportSnapshot } from "@/lib/replay/surface";

export function MockReplayPlayer({
  targetUrl,
  viewport,
  timeline,
}: {
  targetUrl: string;
  viewport: ViewportSnapshot;
  timeline: TimelineStep[];
}) {
  const last = timeline[timeline.length - 1];
  const durationLabel = last ? `${(last.t / 1000).toFixed(1)}s` : "2.2s";
  const location = targetUrl || viewport.host;

  return (
    <div className="flex min-h-[320px] flex-col overflow-hidden rounded-3xl bg-black">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2 rounded-full bg-white/20" />
          <span className="size-2 rounded-full bg-white/20" />
          <span className="size-2 rounded-full bg-white/20" />
        </span>
        <p className="min-w-0 flex-1 truncate rounded-full bg-white/5 px-3 py-1 font-mono text-[11px] text-muted">
          {location}
        </p>
      </div>

      <div className="relative min-h-[220px] flex-1 overflow-hidden">
        <span className="replay-cursor pointer-events-none absolute z-10 size-3 rounded-full bg-mint shadow-[0_0_18px_rgba(184,233,134,0.7)]" />
        <FakeViewport viewport={viewport} />
      </div>

      <div className="flex items-center gap-3 border-t border-white/10 px-4 py-3">
        <span
          className="block size-0 border-y-[5px] border-l-[8px] border-y-transparent border-l-mint"
          aria-hidden
        />
        <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/10">
          <span className="replay-scrub absolute inset-y-0 left-0 w-full rounded-full bg-mint" />
        </div>
        <span className="font-mono text-[11px] text-muted">{durationLabel}</span>
      </div>
    </div>
  );
}

function FakeViewport({ viewport }: { viewport: ViewportSnapshot }) {
  switch (viewport.kind) {
    case "challenge":
    case "empty":
      return (
        <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-[11px] tracking-[0.16em] uppercase text-mint">Simulated viewport</p>
          <p className="serif text-3xl">{viewport.headline}</p>
          <p className="max-w-sm text-sm text-muted">{viewport.detail}</p>
        </div>
      );
    case "page":
      return (
        <div className="flex h-full min-h-[220px] flex-col px-5 py-5">
          <p className="text-[11px] tracking-[0.16em] uppercase text-mint">{viewport.host}</p>
          <p className="serif mt-3 text-2xl">{viewport.headline}</p>
          <p className="mt-2 text-sm text-muted">{viewport.detail}</p>
          <div className="mt-5 space-y-2">
            <div className="h-8 rounded-xl bg-white/[0.07]" />
            <div className="h-8 w-4/5 rounded-xl bg-white/[0.05]" />
            <div className="h-8 w-3/5 rounded-xl bg-white/[0.04]" />
          </div>
        </div>
      );
    default: {
      const _exhaustive: never = viewport.kind;
      return _exhaustive;
    }
  }
}
