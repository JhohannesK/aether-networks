export type TimelineStep = {
  t: number;
  action: string;
  detail: string;
};

export type ViewportKind = "page" | "challenge" | "empty";

export type ViewportSnapshot = {
  kind: ViewportKind;
  host: string;
  title: string;
  headline: string;
  detail: string;
};

export type ReplaySurface =
  | { kind: "iframe"; src: string }
  | { kind: "mock"; targetUrl: string; viewport: ViewportSnapshot };

const CHALLENGE_MARKERS = [
  /just a moment/i,
  /cf-browser-verification/i,
  /challenge-platform/i,
  /cdn-cgi\/challenge/i,
  /enable javascript and cookies to continue/i,
];

/**
 * Body copy from Cloudflare block / IUAM / Turnstile pages. These often
 * arrive without challenge-platform markup, so the structural markers miss.
 */
const INTERSTITIAL_COPY = [
  /checking your browser/i,
  /verify you are human/i,
  /attention required/i,
  /ddos protection by cloudflare/i,
  /performance\s*(?:&|and)\s*security by cloudflare/i,
  /sorry, you have been blocked/i,
  /security of your connection/i,
  /please enable cookies/i,
  /ray id\s*:/i,
];

export function isHostedReplayUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isChallengeHtml(html: string): boolean {
  if (CHALLENGE_MARKERS.some((marker) => marker.test(html))) return true;
  const text = visibleText(html);
  if (CHALLENGE_MARKERS.some((marker) => marker.test(text))) return true;
  return INTERSTITIAL_COPY.some((marker) => marker.test(text));
}

export function targetUrlFromTimeline(timeline: TimelineStep[], fallback = ""): string {
  const goto = timeline.find((step) => step.action === "goto");
  const detail = goto?.detail?.trim() ?? "";
  return isHostedReplayUrl(detail) ? detail : fallback;
}

export function hostOf(url: string): string {
  if (!url) return "session";
  try {
    return new URL(url).host || "session";
  } catch {
    return "session";
  }
}

function looksLikeSourceSoup(text: string): boolean {
  return /[{};<>]|box-sizing|webkit-|margin:0|DOCTYPE|cf-/.test(text);
}

function codePoint(code: number): string {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return "";
  return String.fromCodePoint(code);
}

function decodeEntities(value: string): string {
  const named: Record<string, string> = {
    nbsp: " ",
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    hellip: "...",
  };
  let current = value;
  for (let pass = 0; pass < 5; pass += 1) {
    const next = current
      .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => codePoint(Number.parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_, dec: string) => codePoint(Number.parseInt(dec, 10)))
      .replace(/&([a-z]+);/gi, (match, name: string) => named[name.toLowerCase()] ?? match);
    if (next === current) return current;
    current = next;
  }
  return current;
}

function visibleText(html: string): string {
  const stripped = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return decodeEntities(stripped)
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const NO_LIQUIDITY = /no liquidity/i;

/** Card/feed blurb. Never returns challenge CSS or raw HTML. */
export function humanExcerpt(
  raw: string | null | undefined,
  options: { reasons?: string[]; url?: string } = {},
): string {
  const reasons = options.reasons ?? [];
  const noLiq = reasons.find((reason) => NO_LIQUIDITY.test(reason));
  const source = (raw ?? "").trim();
  if (!source) return noLiq ?? reasons[0] ?? "No extract stored";

  if (isChallengeHtml(source)) return "Bot wall";

  const text = visibleText(source);
  if (isChallengeHtml(text)) return "Bot wall";

  const liq = text.match(/liquidity\s*\$[\s]?[\d,.]+(?:\s*[km])?/i);
  if (liq) return liq[0];

  if (looksLikeSourceSoup(text)) {
    const host = options.url ? hostOf(options.url) : "";
    return noLiq ?? (host ? `Recorded pass on ${host}` : "No readable extract");
  }

  return (text || noLiq || "Recorded pass").slice(0, 180);
}

export function viewportFromExcerpt(
  html: string | null | undefined,
  targetUrl: string,
): ViewportSnapshot {
  const host = hostOf(targetUrl);
  const raw = html ?? "";
  if (!raw.trim()) {
    return {
      kind: "empty",
      host,
      title: host,
      headline: "Stealth viewport",
      detail: "No extract was stored. The timeline is still the proof of work.",
    };
  }
  if (isChallengeHtml(raw)) {
    return {
      kind: "challenge",
      host,
      title: host,
      headline: "Bot wall",
      detail: `${host} served a challenge interstitial. Extract is not the page. This pane is a simulated viewport, not page source.`,
    };
  }

  const titleMatch = raw.match(/<title>([^<]+)<\/title>/i);
  const title = (titleMatch?.[1] ?? "").trim() || host;
  const text = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);
  const liq = text.match(/liquidity\s*\$[\s]?[\d,.]+(?:\s*[km])?/i);
  const fallback = `Recorded pass on ${host}`;
  const detail = looksLikeSourceSoup(text) ? fallback : liq?.[0] ?? (text || fallback);

  return {
    kind: "page",
    host,
    title,
    headline: title,
    detail,
  };
}

export function replaySurfaceForSession(input: {
  replayUrl: string | null;
  htmlExcerpt: string | null;
  timeline: TimelineStep[];
}): ReplaySurface {
  if (isHostedReplayUrl(input.replayUrl)) {
    return { kind: "iframe", src: input.replayUrl };
  }
  const targetUrl = targetUrlFromTimeline(input.timeline);
  return {
    kind: "mock",
    targetUrl,
    viewport: viewportFromExcerpt(input.htmlExcerpt, targetUrl),
  };
}
