import { isLiveSolari } from "@/lib/config";

export function StatusBanner() {
  const live = isLiveSolari();
  return (
    <div className="mx-5 mb-6 rounded-full px-4 py-2 text-xs text-muted hairline md:mx-10">
      {live
        ? "Solari live. Hunters use stealth, residential proxy, persistent profile, and recording."
        : "No SOLARI_API_KEY. Fleet is on the mock path. UI states stay real; replays and settlement are labeled Simulated."}
    </div>
  );
}
