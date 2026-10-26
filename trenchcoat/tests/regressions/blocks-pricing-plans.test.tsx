/*
 * blocks/pricing-plans (WCAG + design pass): the billing switch was a radiogroup without arrow keys – it is now the
 * library SegmentedControl; the call to action and the details toggle are library Buttons (flat-ink primary);
 * the details toggle names what it controls; the rolling price had an aria-label on a role-less span; the
 * integration tiles had no text for assistive tech.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { PricingPlans } from "@blocks/pricing-plans";

describe("blocks/pricing-plans", () => {
  test("billing is a radiogroup that arrow keys move, with one tab stop", () => {
    const onBillingChange = vi.fn();
    const { container } = render(<PricingPlans onBillingChange={onBillingChange} />);
    const group = screen.getByRole("radiogroup", { name: "Billing period" });
    const radios = screen.getAllByRole("radio");
    expect(radios).toEqual([screen.getByRole("radio", { name: "Monthly" }), screen.getByRole("radio", { name: "Yearly" })]);
    expect(radios.filter((r) => r.tabIndex === 0)).toHaveLength(1);
    const yearly = screen.getByRole("radio", { name: "Yearly" });
    expect(yearly.getAttribute("aria-checked")).toBe("true");
    yearly.focus();
    fireEvent.keyDown(yearly, { key: "ArrowLeft" });
    expect(onBillingChange).toHaveBeenCalledWith("monthly");
    expect(screen.getByRole("radio", { name: "Monthly" }).getAttribute("aria-checked")).toBe("true");
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "Monthly" }));
    expect(container.querySelector(".ui-pp__switch")!.getAttribute("data-billing")).toBe("monthly");
    expect(group.closest(".ui-pp__switch")).not.toBeNull();
  });

  test("the call to action and the details toggle are library Buttons", () => {
    const onSelect = vi.fn();
    render(<PricingPlans plans={[{ id: "a", name: "A", price: { monthly: 10, yearly: 8 }, limits: [], sync: "Hourly", pick: 1, features: [], onSelect }]} />);
    const cta = screen.getByRole("button", { name: "Start free trial" });
    expect(cta.classList.contains("ui-button")).toBe(true);
    expect(cta.getAttribute("data-variant")).toBe("primary");
    fireEvent.click(cta);
    expect(onSelect).toHaveBeenCalledWith("yearly");
    const toggle = screen.getByRole("button", { name: "Hide details" });
    expect(toggle.classList.contains("ui-button")).toBe(true);
    expect(toggle.getAttribute("data-variant")).toBe("ghost");
  });

  test("the details toggle controls its region, which goes inert when collapsed", () => {
    render(<PricingPlans />);
    const [toggle] = screen.getAllByRole("button", { name: "Hide details" });
    const details = document.getElementById(toggle.getAttribute("aria-controls")!)!;
    expect(details).not.toBeNull();
    expect(details.hasAttribute("inert")).toBe(false);
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.textContent).toBe("Show details");
    expect(details.hasAttribute("inert")).toBe(true);
  });

  test("the rolling price is read once as text, with no aria-label on a role-less span", () => {
    const { container } = render(<PricingPlans />);
    fireEvent.click(screen.getByRole("radio", { name: "Monthly" }));
    const amount = container.querySelector(".ui-pp__amount")!;
    expect(amount.hasAttribute("aria-label")).toBe(false);
    expect(amount.querySelector(".ui-pp__sr")!.textContent).toBe("$29");
    expect([...amount.querySelectorAll(".ui-pp__digit")].every((d) => d.getAttribute("aria-hidden") === "true")).toBe(true);
  });

  test("integration tiles are a named list with text names", () => {
    render(<PricingPlans />);
    const [list] = screen.getAllByRole("list", { name: "Integrations" });
    expect([...list.querySelectorAll("li")].map((li) => li.textContent)).toContain("Stripe");
  });
});
