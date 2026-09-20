export function Mark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative flex size-8 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-mint" />
        <span className="relative font-serif text-lg leading-none text-mint-ink">
          æ
        </span>
      </span>
      <span className="text-sm tracking-[0.18em] uppercase">Aether</span>
    </span>
  );
}
