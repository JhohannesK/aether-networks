import { describe, expect, it } from "vitest";
import { scoreFromHtml, scoreOpportunity } from "@/lib/agents/scoring";

describe("scoreOpportunity", () => {
  it("should score a liquid new pair higher than a thin one", () => {
    const hot = scoreOpportunity({
      source: "dexscreener",
      title: "NYX/USDC",
      url: "https://dexscreener.com/solana/nyx",
      liquidityUsd: 80_000,
      ageMinutes: 20,
    });
    const thin = scoreOpportunity({
      source: "dexscreener",
      title: "DUST/SOL",
      url: "https://dexscreener.com/solana/dust",
      liquidityUsd: 200,
      ageMinutes: 2_000,
    });
    expect(hot.score).toBeGreaterThan(thin.score);
    expect(hot.score).toBeLessThanOrEqual(100);
  });

  it("should read liquidity out of extracted HTML", () => {
    const result = scoreFromHtml(
      "<html><title>VESPER/SOL</title><body>Solana pair liquidity $12,400</body></html>",
      "dexscreener",
    );
    expect(result.score).toBeGreaterThan(40);
    expect(result.reasons.join(" ")).toMatch(/liquidity/i);
  });
});
