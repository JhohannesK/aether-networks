import type { RailId } from "@/lib/market/rails/types";
import { settleTask } from "@/lib/market/settlement";

export const solanaDevnetRail = {
  id: "solana-devnet" as const satisfies RailId,
  resultHeaders(task: { bountyUsdc: number }) {
    return {
      "Payment-Protocol": "x402",
      "X-402-Asset": "USDC",
      "X-402-Network": "solana-devnet",
      "X-402-Amount": String(task.bountyUsdc),
    };
  },
  settle: settleTask,
};
