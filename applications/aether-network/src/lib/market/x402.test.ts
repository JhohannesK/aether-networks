import { describe, expect, it } from "vitest";
import {
  hasBountyPayment,
  isPrepaidDashboardRequest,
  PREPAID_HEADER,
  PREPAID_VALUE,
  resultGate,
} from "@/lib/market/x402";

describe("x402 resultGate", () => {
  it("should return 404 when the task is missing", () => {
    const gate = resultGate({
      task: null,
      prepaidDashboard: false,
      ledgerHasPayout: false,
    });
    expect(gate.status).toBe(404);
  });

  it("should return 402 when a complete task has no prepaid header", () => {
    const gate = resultGate({
      task: { bountyUsdc: 10, status: "complete" },
      prepaidDashboard: false,
      ledgerHasPayout: true,
    });
    expect(gate.status).toBe(402);
    expect(gate.required).toBe(true);
  });

  it("should return 200 when prepaid header and bounty are present", () => {
    const gate = resultGate({
      task: { bountyUsdc: 10, status: "complete" },
      prepaidDashboard: true,
      ledgerHasPayout: false,
    });
    expect(gate.status).toBe(200);
    expect(gate.required).toBe(false);
  });

  it("should return 402 when prepaid header is set but bounty is zero and no payout", () => {
    const gate = resultGate({
      task: { bountyUsdc: 0, status: "open" },
      prepaidDashboard: true,
      ledgerHasPayout: false,
    });
    expect(gate.status).toBe(402);
    expect(gate.required).toBe(true);
  });

  it("should treat X-Aether-Access prepaid as a dashboard request", () => {
    const ok = new Request("http://127.0.0.1/api/results/1", {
      headers: { [PREPAID_HEADER]: PREPAID_VALUE },
    });
    const missing = new Request("http://127.0.0.1/api/results/1");
    expect(isPrepaidDashboardRequest(ok)).toBe(true);
    expect(isPrepaidDashboardRequest(missing)).toBe(false);
  });

  it("should accept ledger payout as payment proof", () => {
    expect(
      hasBountyPayment({
        bountyUsdc: 12,
        status: "open",
        ledgerHasPayout: true,
      }),
    ).toBe(true);
  });
});
