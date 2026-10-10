import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StatusBanner } from "@/components/status-banner";
import { isLiveSolari } from "@/lib/config";

vi.mock("@/lib/config", () => ({
  isLiveSolari: vi.fn(),
}));

const MOCK_COPY =
  "No SOLARI_API_KEY. Fleet is on the mock path. UI states stay real; replays and settlement are labeled Simulated.";
const LIVE_COPY =
  "Solari live. Hunters use stealth, residential proxy, persistent profile, and recording.";

describe("StatusBanner", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should show the mock-mode banner when SOLARI_API_KEY is missing", () => {
    vi.mocked(isLiveSolari).mockReturnValue(false);

    const html = renderToStaticMarkup(createElement(StatusBanner));

    expect(html).toContain(MOCK_COPY);
    expect(html).not.toContain(LIVE_COPY);
  });

  it("should show the live banner when Solari is configured", () => {
    vi.mocked(isLiveSolari).mockReturnValue(true);

    const html = renderToStaticMarkup(createElement(StatusBanner));

    expect(html).toContain(LIVE_COPY);
    expect(html).not.toContain("No SOLARI_API_KEY");
    expect(html).not.toContain("mock path");
  });
});
