/*
 * illustrations/enrichment-orbit: its CSS loop kept running off screen and in hidden tabs; it announced itself as an image
 * even when decorative (label="" gave an empty name); no className/DOM props/ref on the root.
 */
import { act, render } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { EnrichmentOrbit } from "@illustrations/enrichment-orbit";

let hidden = false;
Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (hidden ? "hidden" : "visible") });
afterEach(() => {
  hidden = false;
});

describe("illustrations/enrichment-orbit", () => {
  test("pauses while the tab is hidden", async () => {
    const { container } = render(<EnrichmentOrbit />);
    const root = container.querySelector<HTMLElement>(".ui-eo")!;
    expect(root.hasAttribute("data-paused")).toBe(false);
    hidden = true;
    await act(async () => document.dispatchEvent(new Event("visibilitychange")));
    expect(root.hasAttribute("data-paused")).toBe(true);
    hidden = false;
    await act(async () => document.dispatchEvent(new Event("visibilitychange")));
    expect(root.hasAttribute("data-paused")).toBe(false);
  });

  test("decorative by default, an image when labelled", () => {
    const { container, rerender } = render(<EnrichmentOrbit label="" />);
    const root = () => container.querySelector<HTMLElement>(".ui-eo")!;
    expect(root().getAttribute("aria-hidden")).toBe("true");
    expect(root().getAttribute("role")).toBeNull();
    rerender(<EnrichmentOrbit label="Nothing scheduled" />);
    expect(root().getAttribute("role")).toBe("img");
    expect(root().getAttribute("aria-hidden")).toBeNull();
  });
  test("the nodes orbit once and come to rest on their staggered spots (WCAG 2.2.2)", () => {
    const { container } = render(<EnrichmentOrbit />);
    const nodes = [...container.querySelectorAll<SVGGElement>(".ui-eo-orbit")];
    expect(nodes.map((n) => [n.style.animationDelay, n.style.animationIterationCount])).toEqual([
      ["0s", "1"],
      ["-7.33s", String(1 + 7.33 / 22)],
      ["-14.66s", String(1 + 14.66 / 22)],
    ]);
  });
});
