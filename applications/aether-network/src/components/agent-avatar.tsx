import { cn } from "@/lib/utils";

const fields = {
  lime: "bg-mint text-mint-ink",
  violet: "bg-violet text-white",
  butter: "bg-butter text-mint-ink",
} as const;

export function AgentAvatar({
  name,
  field,
  size = "md",
}: {
  name: string;
  field: keyof typeof fields | string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizes = {
    sm: "size-10 text-base",
    md: "size-16 text-xl",
    lg: "size-28 text-4xl",
    xl: "size-44 text-6xl md:size-56",
  };
  const tone = field in fields ? fields[field as keyof typeof fields] : fields.lime;
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-full",
        sizes[size],
        tone,
      )}
    >
      <svg viewBox="0 0 80 80" className="absolute inset-0 h-full w-full">
        <circle cx="40" cy="32" r="12" fill="currentColor" opacity="0.92" />
        <path
          d="M18 72c4-16 14-24 22-24s18 8 22 24"
          fill="currentColor"
          opacity="0.92"
        />
      </svg>
      <span className="sr-only">{name}</span>
    </div>
  );
}
