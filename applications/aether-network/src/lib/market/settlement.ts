import {
  Connection,
  PublicKey,
  Transaction,
  type Keypair,
} from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  getMint,
} from "@solana/spl-token";
import { eq } from "drizzle-orm";
import { config, DEVNET_USDC_MINT, TAKE_RATE, isLiveSolari } from "@/lib/config";
import { getDb, schema } from "@/lib/db";
import { emit } from "@/lib/events";
import { getWallet, keypairFromWallet } from "@/lib/market/wallets";
import { nowMs, round2 } from "@/lib/utils";

export function splitBounty(bountyUsdc: number) {
  const take = round2(bountyUsdc * TAKE_RATE);
  const payout = round2(bountyUsdc - take);
  return { payout, take, takeRate: TAKE_RATE };
}

export async function settleTask(taskId: string) {
  const db = getDb();
  const task = db
    .select()
    .from(schema.tasks)
    .where(eq(schema.tasks.id, taskId))
    .get();
  if (!task) throw new Error(`task ${taskId} missing`);
  if (task.status !== "complete") {
    throw new Error(`task ${taskId} is ${task.status}, not complete`);
  }

  const already = db
    .select()
    .from(schema.ledger)
    .where(eq(schema.ledger.taskId, taskId))
    .all()
    .find((row) => row.type === "payout");
  if (already) return already;

  const { payout, take } = splitBounty(task.bountyUsdc);
  const treasury = getWallet("treasury");
  const network = getWallet("network");
  const worker = getWallet(task.hunterId ?? "helix");
  if (!treasury || !network || !worker) {
    throw new Error("marketplace wallets are not seeded");
  }

  const onchain = await tryUsdcTransfer({
    from: keypairFromWallet("treasury"),
    to: worker.pubkey,
    amount: payout,
  });

  const simulated = onchain.ok ? 0 : 1;
  const createdAt = nowMs();

  db.insert(schema.ledger)
    .values({
      id: crypto.randomUUID(),
      type: "payout",
      amount: payout,
      fromWallet: treasury.pubkey,
      toWallet: worker.pubkey,
      taskId,
      simulated,
      txSig: onchain.signature,
      note: `90% bounty to ${worker.id}`,
      createdAt,
    })
    .run();

  db.insert(schema.ledger)
    .values({
      id: crypto.randomUUID(),
      type: "take",
      amount: take,
      fromWallet: treasury.pubkey,
      toWallet: network.pubkey,
      taskId,
      simulated,
      txSig: onchain.signature,
      note: "10% network take-rate",
      createdAt,
    })
    .run();

  db.insert(schema.ledger)
    .values({
      id: crypto.randomUUID(),
      type: "credit",
      amount: take,
      fromWallet: network.pubkey,
      toWallet: network.pubkey,
      taskId,
      simulated: 1,
      txSig: null,
      note: "Solari credit top-up from take-rate",
      createdAt,
    })
    .run();

  db.update(schema.wallets)
    .set({
      solariCredits: network.solariCredits + take,
      withdrawable: network.withdrawable + take,
    })
    .where(eq(schema.wallets.id, "network"))
    .run();

  emit(
    "info",
    simulated
      ? `Settled ${task.title} on the Simulated ledger (+${take} credits)`
      : `Settled ${task.title} on devnet USDC (+${take} credits)`,
    { taskId, payout, take, simulated: Boolean(simulated) },
  );

  return { payout, take, simulated: Boolean(simulated), txSig: onchain.signature };
}

async function tryUsdcTransfer(input: {
  from: Keypair;
  to: string;
  amount: number;
}): Promise<{ ok: boolean; signature: string | null }> {
  if (!isLiveSolari() && !process.env.SOLANA_RPC_URL) {
    return { ok: false, signature: null };
  }
  try {
    const connection = new Connection(config.solanaRpcUrl, "confirmed");
    const mint = new PublicKey(DEVNET_USDC_MINT);
    const mintInfo = await getMint(connection, mint);
    const fromAta = getAssociatedTokenAddressSync(mint, input.from.publicKey);
    const toAta = getAssociatedTokenAddressSync(mint, new PublicKey(input.to));
    const balance = await connection.getTokenAccountBalance(fromAta);
    const units = Math.round(input.amount * 10 ** mintInfo.decimals);
    if (Number(balance.value.amount) < units) {
      return { ok: false, signature: null };
    }
    const tx = new Transaction().add(
      createTransferInstruction(fromAta, toAta, input.from.publicKey, units),
    );
    const signature = await connection.sendTransaction(tx, [input.from]);
    return { ok: true, signature };
  } catch {
    return { ok: false, signature: null };
  }
}

export function withdrawCredits(amount: number) {
  const network = getWallet("network");
  if (!network) throw new Error("network wallet missing");
  const take = Math.min(amount, network.withdrawable);
  if (take <= 0) throw new Error("nothing withdrawable");
  const db = getDb();
  db.update(schema.wallets)
    .set({
      withdrawable: round2(network.withdrawable - take),
    })
    .where(eq(schema.wallets.id, "network"))
    .run();
  db.insert(schema.ledger)
    .values({
      id: crypto.randomUUID(),
      type: "withdraw",
      amount: take,
      fromWallet: network.pubkey,
      toWallet: network.pubkey,
      taskId: null,
      simulated: 1,
      txSig: null,
      note: "Surplus credits marked withdrawn (Simulated)",
      createdAt: nowMs(),
    })
    .run();
  emit("info", `Withdrew ${take} surplus credits (Simulated)`);
  return take;
}
