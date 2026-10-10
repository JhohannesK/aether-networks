import { isValidElement, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import LandingPage, { dynamic } from "@/app/page";
import { StatusBanner } from "@/components/status-banner";

function containsElementType(node: ReactNode, type: unknown): boolean {
  if (node == null || typeof node === "boolean") return false;
  if (Array.isArray(node)) {
    return node.some((child) => containsElementType(child, type));
  }
  if (!isValidElement(node)) return false;
  if (node.type === type) return true;
  const children = (node.props as { children?: ReactNode }).children;
  return containsElementType(children, type);
}

describe("landing page", () => {
  it("should mount the status banner on /", () => {
    expect(containsElementType(LandingPage(), StatusBanner)).toBe(true);
  });

  it("should render on each request so the banner follows runtime Solari mode", () => {
    expect(dynamic).toBe("force-dynamic");
  });
});
