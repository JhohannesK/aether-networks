import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const chips = [
  { label: "Hunt", tone: "bg-mint text-mint-ink", delay: "" },
  { label: "Bid", tone: "bg-butter text-mint-ink", delay: "floaty-slow" },
  { label: "Settle", tone: "bg-violet text-white", delay: "" },
];

export function ActionChips({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-56 md:h-72", className)}>
      {chips.map((chip, i) => (
        <div
          key={chip.label}
          className={cn(
            "absolute flex items-center gap-3 rounded-full py-2 pr-6 pl-2 floaty",
            chip.tone,
            chip.delay,
            i === 0 && "top-6 left-[18%]",
            i === 1 && "bottom-8 left-[8%]",
            i === 2 && "right-[12%] top-24",
          )}
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-black text-white">
            <ArrowUpRight className="size-4" />
          </span>
          <span className="text-xl tracking-tight md:text-2xl">{chip.label}</span>
          <span className="size-8 rounded-full bg-black/15" />
        </div>
      ))}
    </div>
  );
}
