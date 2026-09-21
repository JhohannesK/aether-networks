import { dexscreenerPlugin } from "@/lib/agents/sources/dexscreener";
import { githubPlugin } from "@/lib/agents/sources/github";
import { webPlugin } from "@/lib/agents/sources/web";
import type { SourceId, SourcePlugin } from "@/lib/agents/sources/types";
import { hostOf } from "@/lib/replay/surface";

const sourceRegistry: Record<SourceId, SourcePlugin> = {
  dexscreener: dexscreenerPlugin,
  github: githubPlugin,
  web: webPlugin,
};

export function getSource(id: SourceId): SourcePlugin {
  return sourceRegistry[id];
}

export function inferSource(url: string): SourceId {
  const host = hostOf(url).toLowerCase();
  for (const plugin of Object.values(sourceRegistry)) {
    if (plugin.id === "web") continue;
    if (plugin.hosts.some((suffix) => host === suffix || host.endsWith(`.${suffix}`))) {
      return plugin.id;
    }
  }
  return "web";
}

export function listSources(): SourcePlugin[] {
  return Object.values(sourceRegistry);
}
