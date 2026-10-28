/*
 * blocks/pricing-plans: the block is the <tc-pricing-plans> element through trenchcoat/react, so its behaviour – including every
 * regression this file used to cover – is tested in real browsers: tests/elements/pricing-plans.test.ts. In jsdom the Lit
 * wrappers don't receive their properties or attributes, so this only checks that the block still renders
 * the element.
 */
import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { PricingPlans } from "@blocks/pricing-plans";

describe("blocks/pricing-plans", () => {
  test("renders <tc-pricing-plans>", () => {
    const { container } = render(<PricingPlans />);
    const el = container.querySelector("tc-pricing-plans");
    expect(el).not.toBeNull();
  });
});
