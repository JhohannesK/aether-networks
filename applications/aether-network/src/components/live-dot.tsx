export function LiveDot({ label = "Live" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] tracking-[0.16em] uppercase text-mint">
      <span className="relative flex size-2">
        <span className="absolute inset-0 animate-ping rounded-full bg-mint opacity-60" />
        <span className="relative size-2 rounded-full bg-mint" />
      </span>
      {label}
    </span>
  );
}
