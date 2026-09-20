import { scoreFromHtml, SANDBOX_SCORER, type ScoreResult } from "@/lib/agents/scoring";
import { getSandbox } from "@/lib/solari/client";

let scoredOnce = false;

/**
 * Score extracted HTML inside a Solari sandbox exactly once per process.
 * Later calls reuse the local scorer so we do not burn a VM on every hunt.
 */
export async function scoreHtmlOnce(
  html: string,
  source: "dexscreener" | "github",
): Promise<{ result: ScoreResult; via: "sandbox" | "local" }> {
  if (scoredOnce) {
    return { result: scoreFromHtml(html, source), via: "local" };
  }

  const sandboxes = await getSandbox();
  if (!sandboxes) {
    scoredOnce = true;
    return { result: scoreFromHtml(html, source), via: "local" };
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
    const out = await sbx.commands.run("python3", {
      args: ["/tmp/score.py", "/tmp/page.html"],
    });
    await sbx.kill();
    const parsed = JSON.parse(out.stdout || "{}") as ScoreResult;
    if (typeof parsed.score === "number") {
      scoredOnce = true;
      return { result: parsed, via: "sandbox" };
    }
  } catch {
    // fall through to local
  }

  scoredOnce = true;
  return { result: scoreFromHtml(html, source), via: "local" };
}
