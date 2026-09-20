import { scoreOpportunity, type ScoreInput, type ScoreResult } from "@/lib/agents/scoring";

export type FoundOpportunity = ScoreInput & {
  raw: Record<string, unknown>;
  html: string;
};

type DexPair = {
  chainId?: string;
  url?: string;
  pairAddress?: string;
  baseToken?: { symbol?: string; name?: string };
  quoteToken?: { symbol?: string };
  liquidity?: { usd?: number };
  pairCreatedAt?: number;
};

type GithubRepo = {
  full_name?: string;
  html_url?: string;
  description?: string;
  stargazers_count?: number;
  created_at?: string;
};

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

export async function fetchGithubLaunches(): Promise<FoundOpportunity[]> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  try {
    const res = await fetch(
      `https://api.github.com/search/repositories?q=topic:solana+created:>${since}&sort=updated&per_page=8`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "aether-network-mvp",
        },
      },
    );
    if (!res.ok) throw new Error(`github ${res.status}`);
    const data = (await res.json()) as { items?: GithubRepo[] };
    return (data.items ?? []).map((repo) => {
      const title = repo.full_name ?? "solana-repo";
      const item: FoundOpportunity = {
        source: "github",
        title,
        url: repo.html_url ?? "https://github.com",
        stars: repo.stargazers_count,
        description: repo.description ?? "",
        raw: repo as Record<string, unknown>,
        html: `<html><title>${title}</title><body>${repo.description ?? ""} ${repo.stargazers_count ?? 0} stars Solana launch</body></html>`,
      };
      return item;
    });
  } catch {
    return fixtureGithub();
  }
}

export function withScores(items: FoundOpportunity[]): Array<FoundOpportunity & { scored: ScoreResult }> {
  return items.map((item) => ({ ...item, scored: scoreOpportunity(item) }));
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

function fixtureGithub(): FoundOpportunity[] {
  return [
    {
      source: "github",
      title: "helix-labs/agent-market",
      url: "https://github.com/solari-sdk/solari-cookbook",
      stars: 12,
      description: "Paid stealth agents that settle Solana USDC",
      raw: { fixture: true },
      html: "<html><title>helix-labs/agent-market</title><body>Paid stealth agents 12 stars Solana launch</body></html>",
    },
  ];
}
