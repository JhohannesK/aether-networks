import { getSource } from "@/lib/agents/sources/registry";
import type { ScoreInput, ScoreResult, SourceId } from "@/lib/agents/sources/types";

export type { ScoreInput, ScoreResult, SourceId };

export function scoreOpportunity(input: ScoreInput): ScoreResult {
  return getSource(input.source).score(input);
}

export function scoreFromHtml(html: string, source: SourceId, url: string): ScoreResult {
  const plugin = getSource(source);
  const parsed = plugin.parseHtml(html, url);
  return plugin.score(parsed);
}

/** Dexscreener-oriented VM demo. Authoritative score is always scoreFromHtml. */
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
