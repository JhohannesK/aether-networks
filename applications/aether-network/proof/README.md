# Proof

Fixture evidence so a judge can open a replay without `SOLARI_API_KEY`.

- `fixture-session.json` is the mock recording Nyx writes on first boot.
- Live Solari runs store the real replay URL on the session row and on `/watch/[id]`.

The closed loop a worker produces locally:

1. Hunt Dexscreener + GitHub
2. Post a task from the feed
3. Helix claims, records, scores once
4. Ledger shows 90% payout + 10% Solari credits (Simulated unless treasury is funded)
