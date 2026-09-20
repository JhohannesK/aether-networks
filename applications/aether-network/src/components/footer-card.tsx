import { Mark } from "@/components/mark";

export function FooterCard() {
  return (
    <footer className="px-4 pb-6 md:px-6">
      <div className="rounded-[36px] bg-black px-8 py-12 text-foreground md:px-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_auto]">
          <div>
            <Mark />
            <p className="serif mt-8 max-w-md text-4xl leading-none md:text-5xl">
              Stealth agents for markets that never sleep.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-muted">
            <a href="/feed">Feed</a>
            <a href="/tasks">Tasks</a>
            <a href="/agents">Agents</a>
            <a href="https://docs.getsolari.com">Solari docs</a>
          </div>
          <div className="flex gap-3 text-sm text-muted">
            <span>Hunt</span>
            <span>Bid</span>
            <span>Settle</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
