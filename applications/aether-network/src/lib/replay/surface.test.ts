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

const GENERIC_INTERSTITIALS = [
  "Checking your browser before accessing dexscreener.com.",
  "Verify you are human by completing the action below.",
  "Attention Required! | Cloudflare",
  "Sorry, you have been blocked",
  "DDoS protection by Cloudflare",
  "Performance & security by Cloudflare",
  "Performance &amp; security by Cloudflare",
  "Please enable cookies.",
  "Ray ID: 7f3abc",
  "dexscreener.com needs to review the security of your connection before proceeding.",
];

function normalPage(phrase: string): string {
  const lead = "Helix filed this Solana pair after reading the public page on the desk.";
  const body = "The pair showed volume, a mint, and a creator wallet on the public book. ".repeat(
    40,
  );
  const close = "We score once in the sandbox and then keep the local number on the card.";
  return `<html><title>Desk notes</title><body><p>${lead} ${phrase} ${body}${close}</p></body></html>`;
}

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

  it.each([
    "Just a moment…",
    "Just\u00a0a\u00a0moment\u2026",
    "Just&#32;a&#32;moment&#8230;",
    "Just&nbsp;a&nbsp;moment&hellip;",
    "Checking your browser before accessing dexscreener.com.",
    "Verify you are human by completing the action below.",
    "Attention Required! | Cloudflare",
    "Sorry, you have been blocked",
    "DDoS protection by Cloudflare",
    "Performance & security by Cloudflare",
    "Performance &amp; security by Cloudflare",
    "Please enable cookies.",
    "Ray ID: 7f3abc",
    "dexscreener.com needs to review the security of your connection before proceeding.",
  ])("should hide interstitial copy %s", (sample) => {
    const blurb = humanExcerpt(sample, {
      url: "https://dexscreener.com/solana/x",
      reasons: ["no liquidity printed"],
    });
    expect(blurb, sample).toBe("Bot wall");
    expect(blurb).not.toMatch(/just a moment|box-sizing|cloudflare|ray id|checking your browser|verify you are human|attention required|blocked|cookies/i);
  });

  it("should summarize a Cloudflare block page that has no challenge-platform script", () => {
    const block = `<!DOCTYPE html><html><head><title>Attention Required! | Cloudflare</title></head><body><h1>Sorry, you have been blocked</h1><p>You are unable to access dexscreener.com</p><p>Performance &amp; security by Cloudflare</p><p>Cloudflare Ray ID: <strong>7f3abc</strong></p></body></html>`;
    const blurb = humanExcerpt(block, { url: "https://dexscreener.com/solana/x" });
    expect(blurb).toBe("Bot wall");
    expect(isChallengeHtml(block)).toBe(true);
    expect(blurb).not.toMatch(/Attention Required|Ray ID|Sorry, you have been blocked|<h1/i);
  });

  it("should keep a real sentence that mentions Cloudflare", () => {
    const blurb = humanExcerpt(
      "Notes on using Cloudflare in front of a Solana launch checklist for agents",
    );
    expect(blurb).toMatch(/Solana launch checklist/);
    expect(blurb).not.toBe("Bot wall");
  });

  it.each(GENERIC_INTERSTITIALS)(
    "should keep a normal page that mentions %s",
    (phrase) => {
      const page = normalPage(phrase);
      expect(isChallengeHtml(page), phrase).toBe(false);
      const blurb = humanExcerpt(page, {
        url: "https://dexscreener.com/solana/nyx",
        reasons: ["Solana surface"],
      });
      expect(blurb, phrase).not.toBe("Bot wall");
      expect(blurb).toMatch(/Helix filed this Solana pair/);
    },
  );

  it("should flag a long page when boilerplate sits next to a Cloudflare challenge signal", () => {
    const page = normalPage("Please enable cookies.").replace(
      "</body>",
      '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js"></script></body>',
    );
    expect(isChallengeHtml(page)).toBe(true);
    expect(humanExcerpt(page)).toBe("Bot wall");
  });

  it("should keep strong challenge markers on a long page", () => {
    const page = normalPage("pair liquidity stays on the card").replace(
      "</body>",
      '<script src="/cdn-cgi/challenge-platform/h/b/orchestrate/chl_page/v1"></script><p>Just a moment...</p></body>',
    );
    expect(isChallengeHtml(page)).toBe(true);
    expect(humanExcerpt(page)).toBe("Bot wall");
  });

  it("should flag a stacked Cloudflare block page that is longer than one line", () => {
    const block = `<html><title>Attention Required! | Cloudflare</title><body>
      <h1>Sorry, you have been blocked</h1>
      <p>You are unable to access example.com</p>
      <h2>Why have I been blocked?</h2>
      <p>This website is using a security service to protect itself from online attacks. The action you just performed triggered the security solution. There are several actions that could trigger this block including submitting a certain word or phrase, a SQL command or malformed data.</p>
      <h2>What can I do to resolve this?</h2>
      <p>You can email the site owner to let them know you were blocked. Please include what you were doing when this page came up and the Cloudflare Ray ID found at the bottom of this page.</p>
      <p>Cloudflare Ray ID: 7f3abcde9f1a2b3c</p>
      <p>Performance &amp; security by Cloudflare</p>
    </body></html>`;
    expect(isChallengeHtml(block)).toBe(true);
    expect(humanExcerpt(block)).toBe("Bot wall");
  });
});
