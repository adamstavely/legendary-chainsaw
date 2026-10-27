/* blocks/uncertainty-mix: the reading leads with the kind that weighs most and follows hidden kinds. */
import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { UncertaintyMix } from "@blocks/uncertainty-mix";

const sources = [
  { part: "Baseline", kind: "gap", amount: 2 },
  { part: "Forecast", kind: "model", amount: 6 },
  { part: "Forecast", kind: "chance", amount: 2 },
];
const reading = (c: HTMLElement) => c.querySelector(".ui-umix__reading")?.textContent ?? "";

describe("blocks/uncertainty-mix", () => {
  test("shares and the reading", () => {
    const { container } = render(<UncertaintyMix sources={sources} />);
    expect([...container.querySelectorAll(".ui-umix__share")].map((e) => e.textContent)).toEqual(["20%", "20%", "60%"]);
    expect(reading(container)).toContain("Most of the uncertainty – 60% – is model limits.");
    expect(reading(container)).toContain("Forecast carries the most (80%)");
  });

  test("hidden kinds leave the mix and the reading", () => {
    const { container } = render(<UncertaintyMix sources={sources} hidden={["model"]} onHiddenChange={() => {}} />);
    expect(container.querySelector(".ui-umix__bar")?.getAttribute("aria-label")).toBe("Missing information 50%, Inherent uncertainty 50%");
    expect(reading(container)).not.toContain("model limits");
  });

  test("empty", () => {
    const { container } = render(<UncertaintyMix sources={[]} />);
    expect(container.textContent).toContain("No uncertainty recorded for this answer.");
  });
});
