import { config } from "@/lib/config";
import { getSolari } from "@/lib/solari/client";

export type HunterLaunch = {
  profileName: string;
  proxySession: string;
  recording?: boolean;
};

/**
 * Launch a hunter browser. Never call this from a Next.js request.
 *
 * Gotchas encoded here (from the cookbook):
 * - `proxy` and `captcha` require `stealth: true`.
 * - `launch({ profileId })` puts state on `session.storageState` only. You must
 *   pass it to `newContext({ storageState })` or the run starts anonymous.
 * - A context you build yourself drops the pool timezone pin. Pass
 *   `timezoneId: browser.proxy?.timezoneId`.
 * - Recording is per session. Forget `recording: true` and replay 404s forever.
 * - Replay upload is async after close; poll ~30s.
 * - `@solarisdk/browser` needs Node TCP sockets. Edge / request-scoped launch
 *   will hang or throw.
 */
export async function launchHunter(input: HunterLaunch) {
  const solari = await getSolari();
  if (!solari) {
    throw new Error("SOLARI_API_KEY missing; use the mock path");
  }

  const existing = (await solari.profiles.list()).find(
    (profile) => profile.name === input.profileName,
  );
  const profile =
    existing ?? (await solari.profiles.create({ name: input.profileName }));

  const browser = await solari.launch({
    stealth: true,
    recording: input.recording ?? true,
    profileId: profile.id,
    proxy: {
      country: config.proxyCountry,
      tier: "residential",
      session: input.proxySession,
      sessionDuration: 15,
    },
  });

  const storageState = browser.session.storageState as
    | NonNullable<Parameters<typeof browser.newContext>[0]>["storageState"]
    | undefined;

  const context = await browser.newContext({
    storageState,
    timezoneId: browser.proxy?.timezoneId,
  });

  return { solari, browser, context, profile };
}

type SolariClient = NonNullable<Awaited<ReturnType<typeof getSolari>>>;

export async function persistProfile(
  solari: SolariClient,
  profileId: string,
  context: {
    storageState: () => Promise<unknown>;
  },
) {
  const state = await context.storageState();
  await solari.profiles.save(profileId, state as never);
}

export async function replayUrlAfterClose(solari: SolariClient, sessionId: string) {
  for (let i = 0; i < 15; i += 1) {
    try {
      const replay = await solari.sessions.getReplayUrl(sessionId);
      if (replay.url) return replay.url;
    } catch {
      // upload is async after release
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  return null;
}
