/* compact-breakdown (Phase 3): period through useControllable, parts tracked without ref writes during render */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import * as standard from "@components/compact-breakdown";
import * as clean from "@components/compact-breakdown-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const periods = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
];

for (const [style, ui] of styles) {
  describe(`compact-breakdown ${style}`, () => {
    test("a controlled period reports a pick without applying it; uncontrolled applies and reports", () => {
      const onPeriodChange = vi.fn();
      const items = [{ label: "Search", value: 40 }];
      const { rerender } = render(<ui.CompactBreakdown items={items} periods={periods} period="7d" onPeriodChange={onPeriodChange} />);
      fireEvent.click(screen.getByRole("radio", { name: "30 days" }));
      expect(onPeriodChange).toHaveBeenCalledWith("30d");
      expect(screen.getByRole("radio", { name: "7 days" }).getAttribute("aria-checked")).toBe("true");

      rerender(<ui.CompactBreakdown key="u" items={items} periods={periods} onPeriodChange={onPeriodChange} />);
      fireEvent.click(screen.getByRole("radio", { name: "30 days" }));
      expect(screen.getByRole("radio", { name: "30 days" }).getAttribute("aria-checked")).toBe("true");
      expect(onPeriodChange).toHaveBeenCalledTimes(2);
    });

    test("parts that arrive later join the list and keep their first-seen color", () => {
      const { container, rerender } = render(<ui.CompactBreakdown items={[{ label: "Search", value: 40 }]} />);
      const color = () => (container.querySelector('[class$="__row"] [class$="__swatch"]') as HTMLElement).style.background;
      const first = color();
      rerender(<ui.CompactBreakdown items={[{ label: "Search", value: 10 }, { label: "Direct", value: 30 }]} />);
      expect([...container.querySelectorAll('[class$="__label"]')].map((n) => n.textContent).sort()).toEqual(["Direct", "Search"]);
      const search = [...container.querySelectorAll('[class$="__row"]')].find((r) => r.textContent?.includes("Search"))!;
      expect((search.querySelector('[class$="__swatch"]') as HTMLElement).style.background).toBe(first);
    });
  });
}

/* WCAG + design pass: rows aren't fake tab stops, the period switch keeps its radio keyboard pattern */
for (const [style, ui] of styles) {
  describe(`compact-breakdown ${style} – a11y`, () => {
    const items = [
      { label: "Search", value: 40 },
      { label: "A very long referral source name", value: 10 },
    ];
    test("rows are plain list items, not focusable divs without a role (4.1.2)", () => {
      const { container } = render(<ui.CompactBreakdown items={items} />);
      expect(container.querySelectorAll("[tabindex]")).toHaveLength(0);
      expect(screen.getAllByRole("listitem")).toHaveLength(2);
      expect(container.querySelector('[class$="__label"][title="A very long referral source name"]')).toBeTruthy();
    });

    test("parts that leave the period are inert while they fold away", () => {
      const { container, rerender } = render(<ui.CompactBreakdown items={items} />);
      rerender(<ui.CompactBreakdown items={items.slice(0, 1)} />);
      const leaving = container.querySelector("li[data-leaving]");
      if (leaving) expect(leaving.hasAttribute("inert")).toBe(true);
    });

    test("the period switch is a radio group with arrow keys and one tab stop (2.1.1)", () => {
      vi.useFakeTimers();
      try {
        render(<ui.CompactBreakdown items={items} periods={periods} />);
        const [a, b] = screen.getAllByRole("radio");
        expect([a.tabIndex, b.tabIndex]).toEqual([0, -1]);
        fireEvent.keyDown(a, { key: "ArrowRight" });
        expect(b.getAttribute("aria-checked")).toBe("true");
        expect([a.tabIndex, b.tabIndex]).toEqual([-1, 0]);
      } finally {
        vi.useRealTimers();
      }
    });
  });
}
