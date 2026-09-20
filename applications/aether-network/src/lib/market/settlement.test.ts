import { describe, expect, it } from "vitest";
import { splitBounty } from "@/lib/market/settlement";

describe("splitBounty", () => {
  it("should keep 10% for the network when bounty is 10", () => {
    expect(splitBounty(10)).toEqual({ payout: 9, take: 1, takeRate: 0.1 });
  });

  it("should round fractional take to cents", () => {
    expect(splitBounty(12.5)).toEqual({ payout: 11.25, take: 1.25, takeRate: 0.1 });
  });
});
