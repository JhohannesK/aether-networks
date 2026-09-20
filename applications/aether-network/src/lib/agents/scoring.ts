export type ScoreInput = {
  source: "dexscreener" | "github";
  title: string;
  url: string;
  liquidityUsd?: number;
  ageMinutes?: number;
  stars?: number;
  description?: string;
};

export type ScoreResult = {
  score: number;
  reasons: string[];
};

export function scoreOpportunity(input: ScoreInput): ScoreResult {
  const reasons: string[] = [];
  let score = 28;

  if (input.source === "dexscreener") {
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
  } else {
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
  }

  if (/solana|spl|usdc|pump/i.test(`${input.title} ${input.url}`)) {
    score += 8;
    reasons.push("Solana surface");
  }

  return { score: Math.max(1, Math.min(100, Math.round(score))), reasons };
}

export function scoreFromHtml(html: string, source: ScoreInput["source"]): ScoreResult {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 4000);
  const liqMatch = text.match(/\$[\s]?([\d,.]+)\s*(k|m)?/i);
  let liquidityUsd: number | undefined;
  if (liqMatch) {
    const n = Number(liqMatch[1].replace(/,/g, ""));
    const mult = (liqMatch[2] ?? "").toLowerCase() === "m" ? 1_000_000 : (liqMatch[2] ?? "").toLowerCase() === "k" ? 1_000 : 1;
    liquidityUsd = Number.isFinite(n) ? n * mult : undefined;
  }
  const starsMatch = text.match(/([\d,.]+)\s*stars?/i);
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  return scoreOpportunity({
    source,
    title: titleMatch?.[1] ?? "extracted page",
    url: source === "dexscreener" ? "https://dexscreener.com" : "https://github.com",
    liquidityUsd,
    stars: starsMatch ? Number(starsMatch[1].replace(/,/g, "")) : undefined,
    description: text.slice(0, 240),
  });
}

export const SANDBOX_SCORER = `
import json, re, sys
html = open(sys.argv[1], encoding="utf-8").read() if len(sys.argv) > 1 else sys.stdin.read()
text = re.sub(r"<[^>]+>", " ", html)
text = re.sub(r"\\s+", " ", text)[:4000]
liq = None
m = re.search(r"\\$[\\s]?([\\d,.]+)\\s*(k|m)?", text, re.I)
if m:
    n = float(m.group(1).replace(",", ""))
    mult = 1_000_000 if (m.group(2) or "").lower() == "m" else 1000 if (m.group(2) or "").lower() == "k" else 1
    liq = n * mult
score = 28
reasons = []
if liq is None:
    reasons.append("no liquidity printed")
elif liq >= 50000:
    score += 36; reasons.append("liquidity ≥ $50k")
elif liq >= 10000:
    score += 24; reasons.append("liquidity ≥ $10k")
else:
    score += 10; reasons.append("thin but listed liquidity")
if re.search(r"solana|spl|usdc|pump", text, re.I):
    score += 8; reasons.append("Solana surface")
print(json.dumps({"score": max(1, min(100, int(score))), "reasons": reasons}))
`;
