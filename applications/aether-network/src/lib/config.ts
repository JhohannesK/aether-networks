import path from "node:path";

function read(name: string, fallback = "") {
  const value = (process.env[name] ?? "").trim();
  return value.length > 0 ? value : fallback;
}

export const TAKE_RATE = 0.1;

export const config = {
  solariApiKey: read("SOLARI_API_KEY"),
  solariBaseUrl: read("SOLARI_BASE_URL", "https://api.getsolari.com"),
  masterSeed: read("AETHER_MASTER_SEED", "aether-local-dev-seed"),
  solanaRpcUrl: read("SOLANA_RPC_URL", "https://api.devnet.solana.com"),
  dbPath: path.resolve(
    process.cwd(),
    read("AETHER_DB_PATH", "./data/aether.db"),
  ),
  proxyCountry: read("AETHER_PROXY_COUNTRY", "us"),
};

export function isLiveSolari() {
  return config.solariApiKey.length > 0;
}

export const DEVNET_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
