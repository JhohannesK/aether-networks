import { describe, expect, it } from "vitest";
import { scoreFromHtml, scoreOpportunity } from "@/lib/agents/scoring";
import { getSource, inferSource } from "@/lib/agents/sources";

const CLOUDFLARE_HTML = `<!DOCTYPE html><html lang="en-US"><head><title>Just a moment...</title><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=Edge"><meta name="robots" content="noindex,nofollow"><script src="/cdn-cgi/challenge-platform/h/b/orchestrate/chl_page/v1"></script></head><body>Enable JavaScript and cookies to continue</body></html>`;

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
      "https://dexscreener.com/solana/vesper",
    );
    expect(result.score).toBeGreaterThan(40);
    expect(result.reasons.join(" ")).toMatch(/liquidity/i);
  });

  it("should score github with stars and launch language, not liquidity", () => {
    const result = scoreOpportunity({
      source: "github",
      title: "helix-labs/agent-market",
      url: "https://github.com/helix-labs/agent-market",
      stars: 12,
      description: "Paid stealth agents that settle Solana USDC launch",
    });
    expect(result.reasons.join(" ")).toMatch(/stars|GitHub|launch/i);
    expect(result.reasons.join(" ")).not.toMatch(/liquidity/i);
  });

  it("should score a dense titled web page above an empty one", () => {
    const dense = scoreFromHtml(
      `<html><title>Research note</title><body>${"word ".repeat(400)}</body></html>`,
      "web",
      "https://news.ycombinator.com/item?id=1",
    );
    const empty = scoreFromHtml(
      "<html><body></body></html>",
      "web",
      "https://example.com",
    );
    expect(dense.score).toBeGreaterThan(empty.score);
    expect(dense.reasons.join(" ")).toMatch(/title|body/i);
  });

  it("should drop web score when the extract is a challenge interstitial", () => {
    const clean = scoreFromHtml(
      `<html><title>Ok</title><body>${"word ".repeat(300)}</body></html>`,
      "web",
      "https://example.com",
    );
    const challenged = scoreFromHtml(CLOUDFLARE_HTML, "web", "https://example.com");
    expect(challenged.score).toBeLessThan(clean.score);
    expect(challenged.reasons.join(" ")).toMatch(/challenge/i);
  });
});

describe("inferSource", () => {
  it("should map known hosts and fall back to web", () => {
    expect(inferSource("https://dexscreener.com/solana/x")).toBe("dexscreener");
    expect(inferSource("https://github.com/a/b")).toBe("github");
    expect(inferSource("https://news.ycombinator.com/item?id=1")).toBe("web");
  });

  it("should leave web without a fetch adapter", () => {
    expect(getSource("web").fetch).toBeUndefined();
  });
});

describe("Helix source inference", () => {
  it("should not score a GitHub task URL with liquidity reasons", () => {
    const url = "https://github.com/solari-sdk/solari-cookbook";
    const source = inferSource(url);
    expect(source).toBe("github");
    const result = scoreFromHtml(
      "<html><title>solari-sdk/solari-cookbook</title><body>Paid stealth agents 12 stars Solana launch</body></html>",
      source,
      url,
    );
    expect(result.reasons.join(" ")).not.toMatch(/liquidity/i);
  });
});
