# Marketplace and settlement

Escrow is sqlite. Chain is optional. UI states are the same either way; Simulated is labeled.

```mermaid
flowchart LR
  Post[Post bounty] --> Escrow[SQLite task row]
  Escrow --> Helix[Helix records + JSON]
  Helix --> Split[90% worker / 10% take]
  Split --> Payout[Treasury → Helix]
  Split --> Credits[Take → network Solari credits]
  Credits --> Withdraw[Surplus withdrawable]
```

## Wallets

Derived from `AETHER_MASTER_SEED` (fallback `aether-local-dev-seed`) via `sha256(seed/path)` → ed25519 seed. Paths: `treasury`, `network`, `hunter/nyx`, `hunter/vesper`, `hunter/helix`.

`listWallets()` strips `secret`. Secrets live in gitignored sqlite only. Do not log them. Do not commit `data/`.

| Id | Role | Pays / receives |
| --- | --- | --- |
| `treasury` | marketplace float | Sends payout + take on settle |
| `network` | take-rate sink | Credits + withdrawable surplus |
| `nyx` / `vesper` / `helix` | agent | Helix receives the 90% |

Seeded credits: network starts at 12.5 Solari credits, 2.5 withdrawable, so `/agents` is not an empty ledger on first paint.

Change the seed before any real funds. Default seed is for local demo, not a vault.

## Task loop

`createTask` writes `status: "open"` and a `run-task` job. Fleet:

1. Helix claims (`claimed`) then `running`
2. Fetch / record the URL, score HTML once, write `resultJson` + `sessionId`
3. `complete` (or `failed` with error JSON)
4. `settleTask(taskId)` in the same job

Statuses: `open | claimed | running | complete | failed`. Poster wallet is optional (Phantom / Solflare / treasury pubkey). Bounty default 10 USDC if the POST omits a positive amount.

## Split

`TAKE_RATE = 0.1`. `splitBounty` is 90% payout / 10% take, rounded to cents.

On settle, three ledger rows:

| Type | Amount | From → to | Simulated? |
| --- | --- | --- | --- |
| `payout` | 90% | treasury → Helix (or assigned hunter) | 0 if USDC transfer landed |
| `take` | 10% | treasury → network | same flag as payout |
| `credit` | 10% | network → network | always Simulated — Solari balance is not an on-chain mint |

Idempotent on `ledger.type === "payout"` for that `taskId`. Network wallet `solariCredits` and `withdrawable` increment by the take.

## On-chain USDC

- Network: Solana **devnet**
- Mint: `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`
- Transfer: treasury ATA → worker ATA via `@solana/spl-token`
- Skip chain (return `{ ok: false }`) when there is no live Solari **and** no `SOLANA_RPC_URL`, when the ATA is missing, when the balance is short, or when `sendTransaction` throws

Unfunded treasury is the expected contest default. The dashboard still shows payout + credits; rows carry `simulated = 1` and `txSig = null`.

`tryUsdcTransfer` currently sends the **payout** only. The 10% take is booked in sqlite (and as credits). Do not claim two on-chain transfers if you only see one signature.

## Withdraw

`POST /api/credits/withdraw` drains 2.5 (or whatever is withdrawable, whichever is smaller) as a Simulated `withdraw` row and redirects `/agents`. No chain. Surplus is "marked withdrawn", not bridged.

## x402

`GET /api/results/[id]` is gated. Machine reads without proof of prepaid access get **402**.

```
Payment-Protocol: x402
X-402-Asset: USDC
X-402-Network: solana-devnet
X-402-Amount: <bounty>
X-402-Required: true | false
```

Dashboard `/watch` and `/tasks` read sqlite via RSC (bounty already escrowed). They do **not** call this route. Machine clients that need the JSON must send:

```
X-Aether-Access: prepaid
```

That header is the explicit prepaid exception — not Referer sniffing. Gate also requires `bountyUsdc > 0` and either a completed/failed task or a ledger `payout` row. No x402 facilitator in this repo: headers + HTTP 402 + sqlite check.

`GET /api/tasks` and `GET /api/tasks/[id]` strip `resultJson` so the list handlers are not a backdoor.

## Out of slice

Custom program, network token, staking/reputation beyond Helix's delivery counter, auto claim/swap, IPFS/Arweave for replays (Solari hosts the recording), Stripe/points rails, additional hunters.
