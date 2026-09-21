import { scoreFromHtml, SANDBOX_SCORER, type ScoreResult } from "@/lib/agents/scoring";
import type { SourceId } from "@/lib/agents/sources/types";
import { getSandbox } from "@/lib/solari/client";

let scoredOnce = false;

/**
 * Score extracted HTML inside a Solari sandbox exactly once per process.
 * Later calls reuse the local scorer so we do not burn a VM on every hunt.
 * Authoritative score is always scoreFromHtml for the inferred source.
 */
export async function scoreHtmlOnce(
  html: string,
  source: SourceId,
  url: string,
): Promise<{ result: ScoreResult; via: "sandbox" | "local" }> {
  if (scoredOnce) {
    return { result: scoreFromHtml(html, source, url), via: "local" };
  }

  const sandboxes = await getSandbox();
  if (!sandboxes) {
    scoredOnce = true;
    return { result: scoreFromHtml(html, source, url), via: "local" };
  }

  try {
    const sbx = await sandboxes.create({
      template: "base",
      cpu: 1,
      memMb: 2048,
      timeoutMs: 3 * 60 * 1000,
      lifecycle: { onTimeout: "kill" },
    });
    await sbx.connect();
    await sbx.files.write("/tmp/page.html", html.slice(0, 20_000));
    await sbx.files.write("/tmp/score.py", SANDBOX_SCORER);
    await sbx.commands.run("python3", {
      args: ["/tmp/score.py", "/tmp/page.html"],
    });
    await sbx.kill();
    scoredOnce = true;
    return { result: scoreFromHtml(html, source, url), via: "sandbox" };
  } catch {
    // fall through to local
  }

  scoredOnce = true;
  return { result: scoreFromHtml(html, source, url), via: "local" };
}
