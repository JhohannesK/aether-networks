import { isChallengeHtml } from "@/lib/replay/surface";
import type { ScoreInput, ScoreResult, SourcePlugin } from "@/lib/agents/sources/types";

function clampScore(score: number): number {
  return Math.max(1, Math.min(100, Math.round(score)));
}

export function scoreWeb(input: ScoreInput): ScoreResult {
  const reasons: string[] = [];
  let score = 28;

  const title = input.title?.trim() ?? "";
  if (title && title !== "extracted page") {
    score += 8;
    reasons.push("page title present");
  }

  const text = (input.html ?? input.description ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const len = text.length;
  if (len < 200) {
    reasons.push("thin page body");
  } else if (len <= 2000) {
    score += 12;
    reasons.push("readable page body");
  } else {
    score += 22;
    reasons.push("dense page body");
  }

  if (isChallengeHtml(input.html ?? "")) {
    score -= 20;
    reasons.push("challenge interstitial");
  }

  return { score: clampScore(score), reasons };
}

export function parseWebHtml(html: string, url: string): ScoreInput {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 4000);
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  return {
    source: "web",
    title: titleMatch?.[1]?.trim() || "extracted page",
    url,
    description: text.slice(0, 240),
    html,
  };
}

export const webPlugin: SourcePlugin = {
  id: "web",
  hosts: [],
  parseHtml: parseWebHtml,
  score: scoreWeb,
};
