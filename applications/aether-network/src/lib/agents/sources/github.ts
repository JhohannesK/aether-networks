import type { FoundOpportunity, ScoreInput, ScoreResult, SourcePlugin } from "@/lib/agents/sources/types";

type GithubRepo = {
  full_name?: string;
  html_url?: string;
  description?: string;
  stargazers_count?: number;
  created_at?: string;
};

function clampScore(score: number): number {
  return Math.max(1, Math.min(100, Math.round(score)));
}

export function scoreGithub(input: ScoreInput): ScoreResult {
  const reasons: string[] = [];
  let score = 28;

  const stars = input.stars ?? 0;
  if (stars >= 20) {
    score += 30;
    reasons.push("repo already attracting stars");
  } else if (stars >= 3) {
    score += 18;
    reasons.push("early signal on GitHub");
  } else {
    score += 8;
    reasons.push("fresh Solana repo");
  }
  if (/launch|token|market|agent|pay/i.test(`${input.title} ${input.description ?? ""}`)) {
    score += 14;
    reasons.push("launch / market language");
  }

  if (/solana|spl|usdc|pump/i.test(`${input.title} ${input.url}`)) {
    score += 8;
    reasons.push("Solana surface");
  }

  return { score: clampScore(score), reasons };
}

export function parseGithubHtml(html: string, url: string): ScoreInput {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 4000);
  const starsMatch = text.match(/([\d,.]+)\s*stars?/i);
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  return {
    source: "github",
    title: titleMatch?.[1] ?? "extracted page",
    url,
    stars: starsMatch ? Number(starsMatch[1].replace(/,/g, "")) : undefined,
    description: text.slice(0, 240),
    html,
  };
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

export const githubPlugin: SourcePlugin = {
  id: "github",
  hosts: ["github.com"],
  fetch: fetchGithubLaunches,
  parseHtml: parseGithubHtml,
  score: scoreGithub,
};
