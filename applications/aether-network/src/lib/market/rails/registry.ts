import { solanaDevnetRail } from "@/lib/market/rails/solana-devnet";
import type { PaymentRail, RailId } from "@/lib/market/rails/types";

const rails: Record<RailId, PaymentRail> = {
  "solana-devnet": solanaDevnetRail,
};

export function getRail(id: RailId = "solana-devnet"): PaymentRail {
  return rails[id];
}
