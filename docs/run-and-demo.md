# Run and demo

Clone-and-run from `applications/aether-network`. Repo root has no Next script.

## Boot

Node 20+.

```bash
git clone https://github.com/JhohannesK/aether-networks.git
cd aether-networks/applications/aether-network
cp .env.example .env
npm install
npm run dev:all
```

Two terminals if you want them separate:

```bash
npm run dev      # Next on http://127.0.0.1:4317
npm run agents   # long-lived fleet
```

Open [http://127.0.0.1:4317](http://127.0.0.1:4317). Health: `GET /api/health` → `mode: "mock"` until a key is in env.

`npm test` is Vitest. Do not commit `.env` / `.env.local`. `.env.example` is the only env file in git.

## Env

All optional. Empty = mock hunters, mock recordings, Simulated settlement.

| Var | Default | Notes |
| --- | --- | --- |
| `SOLARI_API_KEY` | empty | Live stealth + recording + sandbox. Do not paste into README, git, or chat. |
| `SOLARI_BASE_URL` | `https://api.getsolari.com` | |
| `AETHER_MASTER_SEED` | `aether-local-dev-seed` | Hierarchical keypairs. Change before any real funds. Never commit. |
| `SOLANA_RPC_URL` | `https://api.devnet.solana.com` | |
| `AETHER_DB_PATH` | `./data/aether.db` | Gitignored. |
| `AETHER_PROXY_COUNTRY` | `us` | Residential proxy country. |

Next loads `.env.local` automatically. The worker does not — export or source `.env.local` into that process for a live pass.

## Mock vs live

**Mock (default).** No key. Dashboard is fully clickable. Two fixture cards on first boot. After `npm run agents`, Nyx / Vesper still hit public Dexscreener + GitHub APIs and append rows; recordings stay local (`/watch/[id]`, timeline + fake player). Settlement writes Simulated ledger lines. Banner on every product page.

**Live.** `SOLARI_API_KEY` set. Hunters launch stealth + residential proxy + profile + `recording: true`. Replay URL is a Solari host (GCS) once the async upload lands. Sandbox scores extracted HTML **once per process**, then local. If launch throws, that session falls back to mock and the loop continues.

Settlement does not require live Solari. It needs a funded treasury ATA on devnet USDC. Unfunded = Simulated, same UI states.

## Closed-loop walkthrough

Say this out loud: hunter files the pair → you bid → Helix records the work → credits refill the network.

1. Landing. Mint switch. Hunt / Bid / Settle chips. White hunter band.
2. `/feed`. Two fixture cards immediately. Worker appends live Dexscreener / GitHub rows.
3. Post a task from a card. Phantom/Solflare or the local treasury pubkey.
4. `/tasks` moves `open → claimed → running → complete` on the next worker tick (~12s).
5. `/watch/[id]` is the proof: Solari GCS replay iframe when live, timeline + fake player when Simulated. Extract HTML is never the replay surface.
6. `/agents` shows Nyx, Vesper, Helix, derived wallets, 10% credits, ledger lines marked Simulated when off-chain.

If the task sits on `open`, the worker is down. If `/api/health` is `mock` and you expected live, the key is not in **that** process's env.

## Failure modes that are not bugs

- Next without worker: UI works, loop does not.
- Worker without Next: hunts still write sqlite; you just cannot post a bounty from the dashboard.
- Solari 4xx / proxy fail: warn + mock recording for that session.
- Empty treasury ATA: payout rows exist, `simulated = 1`, no tx sig.
- GitHub search 403: Vesper falls back to fixture launches.

In-app copy of this runbook: [../applications/aether-network/README.md](../applications/aether-network/README.md).
