# Solari features

Aether is the contest slice that actually uses the SDK, not another cookbook one-call. Launch lives in `src/lib/solari/launch.ts`. Client is lazy-imported so `tsx worker.ts` does not die on `ERR_PACKAGE_PATH_NOT_EXPORTED`.

Never call `solari.launch()` from a Route Handler. The worker owns browsers.

## What we use

| Feature | Where | Why |
| --- | --- | --- |
| `@solarisdk/browser` `launch({ stealth: true })` | `src/lib/solari/launch.ts` | Fingerprint + headful pool. Proxy and captcha require stealth. |
| Residential proxy + sticky `session` | same | Same egress IP across a hunt. Rotate mid-flow and you look hijacked. `AETHER_PROXY_COUNTRY` (default `us`), `sessionDuration: 15`. |
| Persistent `profileId` | same | Named `aether-nyx` / `aether-vesper` / `aether-helix`. Create-or-reuse via `profiles.list`. |
| Session recording | same + `/watch/[id]` | Proof of work. `recording: true` on launch. Replay polled after `browser.close()`. |
| `@solarisdk/sandbox` | `src/lib/solari/sandbox.ts` | Score extracted HTML **once per process**, then local. `kill()`, not `close()`. |
| Mock fallback | `src/lib/agents/hunters.ts` | Same session objects, `mode: "mock"`, banner on every product page. |

Live gate is `SOLARI_API_KEY` nonempty (`isLiveSolari()`). Empty key never constructs a client.

## Launch gotchas encoded in code

These bit the cookbook. They are comments on `launchHunter`, not folklore.

- **`launch({ profileId })` does not seed the page.** State lands on `session.storageState`. Pass it to `newContext({ storageState })` or every run starts anonymous while looking logged in. `addCookies()` drops localStorage. A context you build yourself also drops the pool timezone pin — pass `timezoneId: browser.proxy?.timezoneId`.
- **Recording is per session.** Forget the flag and `getReplayUrl` 404s forever.
- **Replay upload is async after release.** `replayUrlAfterClose` polls ~30s (15 × 2s). If it never lands, UI keeps `/watch/{localId}`.
- **SDK is Node-only.** Playwright fork wants TCP sockets. Edge / request-scoped launch hangs or throws. That is why the process split exists.
- **`browser.close()` is enough to exit as of `@solarisdk/browser` 0.1.3.** We still `solari.close()` after a hunt to drop the client's pool.

## Sandbox-once

`scoreHtmlOnce` creates a `base` VM, writes `/tmp/page.html` + `/tmp/score.py`, runs `python3`, then `kill()`. First success sets `scoredOnce`. Later hunts use `scoreFromHtml` locally so we do not burn a VM per Dexscreener tick. Missing key or sandbox throw → local scorer, still labeled.

Scorer itself: liquidity / age for Dexscreener, stars + launch language for GitHub, clamp 1–100. Same function in-process and in the VM (`SANDBOX_SCORER`).

## Mock path

`captureSession` always writes a `sessions` row. Live branch: launch → `page.goto` → persist profile → close → poll replay. Any throw: warn `Live Solari failed, using mock recording` and keep the local timeline. Fixture feed (NYX/USDC + a GitHub card) seeds only when `opportunities` is empty.

Health: `GET /api/health` → `{ ok: true, mode: "live" | "mock" }`. Judges should look at that before arguing the iframe.

## What we do not use

Desktop / VNC, login handoff, CDP-from-Workers, snapshot-fork, Playwright test runner. Cookbook examples still cover those if someone wants a one-call, not a marketplace.
