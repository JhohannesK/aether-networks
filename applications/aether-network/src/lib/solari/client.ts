import { config, isLiveSolari } from "@/lib/config";

export async function getSolari() {
  if (!isLiveSolari()) return null;
  const { Solari } = await import("@solarisdk/browser");
  return new Solari({
    apiKey: config.solariApiKey,
    baseUrl: config.solariBaseUrl,
  });
}

export async function getSandbox() {
  if (!isLiveSolari()) return null;
  const { SandboxClient } = await import("@solarisdk/sandbox");
  return new SandboxClient({
    apiKey: config.solariApiKey,
    baseUrl: config.solariBaseUrl,
  });
}
