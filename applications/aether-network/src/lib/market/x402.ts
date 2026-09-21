import { getRail } from "@/lib/market/rails/registry";

export const PREPAID_HEADER = "X-Aether-Access";
export const PREPAID_VALUE = "prepaid";

export function isPrepaidDashboardRequest(request: Request): boolean {
  return request.headers.get(PREPAID_HEADER) === PREPAID_VALUE;
}

export function hasBountyPayment(input: {
  bountyUsdc: number;
  status: string;
  ledgerHasPayout: boolean;
}): boolean {
  if (input.bountyUsdc <= 0) return false;
  return (
    input.ledgerHasPayout ||
    input.status === "complete" ||
    input.status === "failed"
  );
}

export function resultGate(input: {
  task: { bountyUsdc: number; status: string } | null;
  prepaidDashboard: boolean;
  ledgerHasPayout: boolean;
}): { status: 404 | 402 | 200; required: boolean; reason: string } {
  if (!input.task) {
    return { status: 404, required: false, reason: "not found" };
  }

  if (!input.prepaidDashboard) {
    return {
      status: 402,
      required: true,
      reason:
        "Machine reads require payment. Dashboard reads send X-Aether-Access: prepaid because the bounty already escrowed.",
    };
  }

  if (
    !hasBountyPayment({
      bountyUsdc: input.task.bountyUsdc,
      status: input.task.status,
      ledgerHasPayout: input.ledgerHasPayout,
    })
  ) {
    return {
      status: 402,
      required: true,
      reason: "No prepaid bounty or ledger payout for this task.",
    };
  }

  return {
    status: 200,
    required: false,
    reason: "Dashboard prepaid via posted bounty.",
  };
}

export function resultPaymentHeaders(task: { bountyUsdc: number }, required: boolean) {
  return {
    ...getRail().resultHeaders(task),
    "X-402-Required": required ? "true" : "false",
  };
}
