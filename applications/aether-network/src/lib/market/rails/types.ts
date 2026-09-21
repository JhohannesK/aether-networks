export type RailId = "solana-devnet";

export type PaymentRail = {
  id: RailId;
  resultHeaders: (task: { bountyUsdc: number }) => Record<string, string>;
  settle: (taskId: string) => Promise<unknown>;
};
