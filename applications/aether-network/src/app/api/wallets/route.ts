import { listWallets } from "@/lib/market/wallets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ wallets: listWallets() });
}
