import { ArrowUpRight } from "lucide-react";

export function SwitchHero() {
  return (
    <div className="relative mx-auto flex aspect-[1.7/1] w-full max-w-md items-center justify-center">
      <div className="absolute inset-[8%] rounded-[999px] bg-mint shadow-[0_40px_80px_rgba(184,233,134,0.18)]" />
      <div className="absolute left-[18%] top-1/2 flex size-[38%] -translate-y-1/2 items-center justify-center rounded-full bg-black text-white shadow-2xl">
        <ArrowUpRight className="size-1/3" strokeWidth={1.25} />
      </div>
    </div>
  );
}
