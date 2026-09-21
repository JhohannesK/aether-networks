import type { FoundOpportunity, ScoreInput, ScoreResult, SourcePlugin } from "@/lib/agents/sources/types";

type DexPair = {
  chainId?: string;
  url?: string;
  pairAddress?: string;
  baseToken?: { symbol?: string; name?: string };
  quoteToken?: { symbol?: string };
  liquidity?: { usd?: number };
  pairCreatedAt?: number;
};

function clampScore(score: number): number {
  return Math.max(1, Math.min(100, Math.round(score)));
}

export function scoreDexscreener(input: ScoreInput): ScoreResult {
  const reasons: string[] = [];
  let score = 28;

  const liq = input.liquidityUsd ?? 0;
  if (liq >= 50_000) {
    score += 36;
    reasons.push("liquidity ≥ $50k");
  } else if (liq >= 10_000) {
    score += 24;
    reasons.push("liquidity ≥ $10k");
  } else if (liq > 0) {
    score += 10;
    reasons.push("thin but listed liquidity");
  } else {
    reasons.push("no liquidity printed");
  }

  const age = input.ageMinutes ?? 9999;
  if (age <= 90) {
    score += 22;
    reasons.push("pair younger than 90m");
  } else if (age <= 720) {
    score += 12;
    reasons.push("pair younger than 12h");
  }

  if (/solana|spl|usdc|pump/i.test(`${input.title} ${input.url}`)) {
    score += 8;
    reasons.push("Solana surface");
  }

  return { score: clampScore(score), reasons };
}

export function parseDexscreenerHtml(html: string, url: string): ScoreInput {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 4000);
  const liqMatch = text.match(/\$[\s]?([\d,.]+)\s*(k|m)?/i);
  let liquidityUsd: number | undefined;
  if (liqMatch) {
    const n = Number(liqMatch[1].replace(/,/g, ""));
    const mult =
      (liqMatch[2] ?? "").toLowerCase() === "m"
        ? 1_000_000
        : (liqMatch[2] ?? "").toLowerCase() === "k"
          ? 1_000
          : 1;
    liquidityUsd = Number.isFinite(n) ? n * mult : undefined;
  }
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  return {
    source: "dexscreener",
    title: titleMatch?.[1] ?? "extracted page",
    url,
    liquidityUsd,
    description: text.slice(0, 240),
    html,
  };
}

export async function fetchDexscreener(): Promise<FoundOpportunity[]> {
  try {
    const res = await fetch("https://api.dexscreener.com/latest/dex/search?q=solana", {
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`dexscreener ${res.status}`);
    const data = (await res.json()) as { pairs?: DexPair[] };
    const pairs = (data.pairs ?? [])
      .filter((pair) => (pair.chainId ?? "").toLowerCase() === "solana")
      .slice(0, 8);
    return pairs.map((pair) => {
      const title = `${pair.baseToken?.symbol ?? "???"}/${pair.quoteToken?.symbol ?? "???"}`;
      const created = pair.pairCreatedAt ?? Date.now();
      const item: FoundOpportunity = {
        source: "dexscreener",
        title,
        url: pair.url ?? `https://dexscreener.com/solana/${pair.pairAddress ?? ""}`,
        liquidityUsd: pair.liquidity?.usd,
        ageMinutes: Math.max(0, Math.round((Date.now() - created) / 60000)),
        raw: pair as Record<string, unknown>,
        html: `<html><title>${title}</title><body>Solana pair ${title} liquidity $${pair.liquidity?.usd ?? 0}</body></html>`,
      };
      return item;
    });
  } catch {
    return fixtureDex();
  }
}

function fixtureDex(): FoundOpportunity[] {
  return [
    {
      source: "dexscreener",
      title: "NYX/USDC",
      url: "https://dexscreener.com/solana/fixture-nyx",
      liquidityUsd: 42_800,
      ageMinutes: 18,
      raw: { fixture: true },
      html: "<html><title>NYX/USDC</title><body>Solana pair NYX/USDC liquidity $42800</body></html>",
    },
    {
      source: "dexscreener",
      title: "VESPER/SOL",
      url: "https://dexscreener.com/solana/fixture-vesper",
      liquidityUsd: 9_400,
      ageMinutes: 55,
      raw: { fixture: true },
      html: "<html><title>VESPER/SOL</title><body>Solana pair VESPER/SOL liquidity $9400</body></html>",
    },
  ];
}

export const dexscreenerPlugin: SourcePlugin = {
  id: "dexscreener",
  hosts: ["dexscreener.com"],
  fetch: fetchDexscreener,
  parseHtml: parseDexscreenerHtml,
  score: scoreDexscreener,
};
