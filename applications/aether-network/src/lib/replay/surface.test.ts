import { describe, expect, it } from "vitest";
import {
  humanExcerpt,
  isChallengeHtml,
  isHostedReplayUrl,
  replaySurfaceForSession,
  targetUrlFromTimeline,
  viewportFromExcerpt,
} from "@/lib/replay/surface";

const CLOUDFLARE_HTML = `<!DOCTYPE html><html lang="en-US"><head><title>Just a moment...</title><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=Edge"><meta name="robots" content="noindex,nofollow"><script src="/cdn-cgi/challenge-platform/h/b/orchestrate/chl_page/v1"></script></head><body>Enable JavaScript and cookies to continue</body></html>`;

const FIXTURE_HTML =
  "<html><title>NYX/USDC</title><body>Solana pair NYX/USDC liquidity $42800</body></html>";

const HELIX_TIMELINE = [
  { t: 0, action: "launch", detail: "mock stealth session" },
  {
    t: 400,
    action: "goto",
    detail: "https://dexscreener.com/solana/3fkduervunskkygtyx1hkijmjvbiytdwybwxyw19n28t",
  },
  { t: 1200, action: "extract", detail: "DOM + public APIs" },
];

describe("replay surface", () => {
  it("should treat GCS https urls as hosted replays and ignore local watch paths", () => {
    expect(
      isHostedReplayUrl(
        "https://storage.googleapis.com/solari-prod-replays-j489006/abc.ndjson.gz",
      ),
    ).toBe(true);
    expect(isHostedReplayUrl("/watch/094de745-072c-4982-8f4a-ad8138b19f9c")).toBe(false);
    expect(isHostedReplayUrl(null)).toBe(false);
  });

  it("should flag Cloudflare interstitials as challenge HTML", () => {
    expect(isChallengeHtml(CLOUDFLARE_HTML)).toBe(true);
    expect(isChallengeHtml(FIXTURE_HTML)).toBe(false);
  });

  it("should iframe a live Solari GCS replay even when extract is a Cloudflare page", () => {
    const gcs =
      "https://storage.googleapis.com/solari-prod-replays-j489006/b80cdd55-9e96-4ebb-bdc6-33fe3963cf34.ndjson.gz";
    const surface = replaySurfaceForSession({
      replayUrl: gcs,
      htmlExcerpt: CLOUDFLARE_HTML,
      timeline: HELIX_TIMELINE,
    });
    expect(surface).toEqual({ kind: "iframe", src: gcs });
  });

  it("should build a mock viewport for Helix mock tasks instead of dumping page source", () => {
    const surface = replaySurfaceForSession({
      replayUrl: "/watch/094de745-072c-4982-8f4a-ad8138b19f9c",
      htmlExcerpt: CLOUDFLARE_HTML,
      timeline: HELIX_TIMELINE,
    });
    expect(surface.kind).toBe("mock");
    if (surface.kind !== "mock") return;
    expect(surface.viewport.kind).toBe("challenge");
    expect(surface.viewport.headline).toBe("Bot wall");
    expect(surface.viewport.detail).not.toMatch(/DOCTYPE|Just a moment|cf-browser/i);
    expect(surface.viewport.title).not.toMatch(/<!DOCTYPE|<html/i);
    expect(surface.targetUrl).toBe(HELIX_TIMELINE[1]?.detail);
  });

  it("should reconstruct a readable page snapshot from fixture HTML", () => {
    const viewport = viewportFromExcerpt(FIXTURE_HTML, "https://dexscreener.com/solana/fixture-nyx");
    expect(viewport.kind).toBe("page");
    expect(viewport.headline).toBe("NYX/USDC");
    expect(viewport.detail).toMatch(/liquidity \$42800/i);
    expect(viewport.detail).not.toMatch(/<html|<title/i);
  });

  it("should pull the goto URL off the timeline", () => {
    expect(targetUrlFromTimeline(HELIX_TIMELINE)).toBe(HELIX_TIMELINE[1]?.detail);
    expect(targetUrlFromTimeline([{ t: 0, action: "launch", detail: "mock" }])).toBe("");
  });
});

const CARD_DUMP =
  "Just a moment... *{box-sizing:border-box;margin:0;padding:0}html{line-height:1.15;-webkit-text-size-adjust:100%;color:#313131;font-family:system-ui,-apple-";

describe("humanExcerpt", () => {
  it("should summarize Cloudflare HTML as a bot wall, never CSS", () => {
    const blurb = humanExcerpt(CLOUDFLARE_HTML, {
      reasons: ["no liquidity printed"],
    });
    expect(blurb).toBe("Bot wall");
    expect(blurb).not.toMatch(/box-sizing|webkit-|margin:0|DOCTYPE|<html/i);
  });

  it("should summarize the stripped tasks-card dump as a bot wall", () => {
    const blurb = humanExcerpt(CARD_DUMP, { reasons: ["no liquidity printed"] });
    expect(blurb).toBe("Bot wall");
    expect(blurb).not.toMatch(/Just a moment|box-sizing|\*|\{/);
  });

  it("should keep real opportunity text and prefer liquidity", () => {
    expect(humanExcerpt(FIXTURE_HTML)).toBe("liquidity $42800");
    const github = humanExcerpt(
      "<html><title>helix-labs/agent-market</title><body>Paid stealth agents 12 stars Solana launch</body></html>",
    );
    expect(github).toMatch(/Paid stealth agents 12 stars Solana launch/);
    expect(github).not.toMatch(/<html|<title|<|>/);
  });

  it("should use no-liquidity reasons when the extract is source soup", () => {
    expect(
      humanExcerpt("*{box-sizing:border-box;margin:0;padding:0}", {
        reasons: ["no liquidity printed", "Solana surface"],
      }),
    ).toBe("no liquidity printed");
  });

  it("should stay idempotent on already-human blurbs", () => {
    expect(humanExcerpt("Bot wall")).toBe("Bot wall");
    expect(humanExcerpt("no liquidity printed")).toBe("no liquidity printed");
    expect(humanExcerpt("")).toBe("No extract stored");
  });
});
