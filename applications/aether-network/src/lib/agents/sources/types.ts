export type SourceId = "dexscreener" | "github" | "web";

export type ScoreInput = {
  source: SourceId;
  title: string;
  url: string;
  liquidityUsd?: number;
  ageMinutes?: number;
  stars?: number;
  description?: string;
  html?: string;
};

export type ScoreResult = {
  score: number;
  reasons: string[];
};

export type FoundOpportunity = ScoreInput & {
  raw: Record<string, unknown>;
  html: string;
};

export type SourcePlugin = {
  id: SourceId;
  hosts: string[];
  fetch?: () => Promise<FoundOpportunity[]>;
  parseHtml: (html: string, url: string) => ScoreInput;
  score: (input: ScoreInput) => ScoreResult;
};
