import { createHash } from "node:crypto";
import { address, createKeyPairSignerFromBytes } from "@solana/kit";
import { Keypair } from "@solana/web3.js";
import { eq } from "drizzle-orm";
import { config } from "@/lib/config";
import { getDb, schema } from "@/lib/db";

export type WalletRole = "hunter" | "network" | "treasury";

function seedBytes(pathLabel: string) {
  return createHash("sha256")
    .update(`${config.masterSeed}/${pathLabel}`)
    .digest();
}

export function deriveKeypair(pathLabel: string) {
  return Keypair.fromSeed(seedBytes(pathLabel));
}

export async function deriveKitSigner(pathLabel: string) {
  const kp = deriveKeypair(pathLabel);
  const signer = await createKeyPairSignerFromBytes(kp.secretKey);
  return { signer, pubkey: String(address(kp.publicKey.toBase58())) };
}

export function ensureWallets() {
  const db = getDb();
  const existing = db.select().from(schema.wallets).all();
  if (existing.length > 0) return existing;

  const rows = [
    {
      id: "treasury",
      role: "treasury" as const,
      ownerId: null,
      path: "treasury",
    },
    {
      id: "network",
      role: "network" as const,
      ownerId: null,
      path: "network",
    },
    { id: "nyx", role: "hunter" as const, ownerId: "nyx", path: "hunter/nyx" },
    {
      id: "vesper",
      role: "hunter" as const,
      ownerId: "vesper",
      path: "hunter/vesper",
    },
    {
      id: "helix",
      role: "hunter" as const,
      ownerId: "helix",
      path: "hunter/helix",
    },
  ];

  for (const row of rows) {
    const kp = deriveKeypair(row.path);
    db.insert(schema.wallets)
      .values({
        id: row.id,
        role: row.role,
        ownerId: row.ownerId,
        pubkey: kp.publicKey.toBase58(),
        secret: Buffer.from(kp.secretKey).toString("base64"),
        solariCredits: row.role === "network" ? 12.5 : 0,
        withdrawable: row.role === "network" ? 2.5 : 0,
      })
      .run();
  }

  return db.select().from(schema.wallets).all();
}

export function listWallets() {
  ensureWallets();
  return getDb()
    .select({
      id: schema.wallets.id,
      role: schema.wallets.role,
      ownerId: schema.wallets.ownerId,
      pubkey: schema.wallets.pubkey,
      solariCredits: schema.wallets.solariCredits,
      withdrawable: schema.wallets.withdrawable,
    })
    .from(schema.wallets)
    .all();
}

export function getWallet(id: string) {
  ensureWallets();
  return (
    getDb().select().from(schema.wallets).where(eq(schema.wallets.id, id)).get() ??
    null
  );
}

export function keypairFromWallet(id: string) {
  const row = getWallet(id);
  if (!row) throw new Error(`wallet ${id} missing`);
  return Keypair.fromSecretKey(Buffer.from(row.secret, "base64"));
}
