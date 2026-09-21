import { scoreOpportunity } from "@/lib/agents/scoring";
import type { FoundOpportunity, ScoreResult } from "@/lib/agents/sources/types";

export type {
  FoundOpportunity,
  ScoreInput,
  ScoreResult,
  SourceId,
  SourcePlugin,
} from "@/lib/agents/sources/types";
export { getSource, inferSource, listSources } from "@/lib/agents/sources/registry";
export { fetchDexscreener } from "@/lib/agents/sources/dexscreener";
export { fetchGithubLaunches } from "@/lib/agents/sources/github";

export function withScores(
  items: FoundOpportunity[],
): Array<FoundOpportunity & { scored: ScoreResult }> {
  return items.map((item) => ({ ...item, scored: scoreOpportunity(item) }));
}
