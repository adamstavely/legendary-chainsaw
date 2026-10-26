/* kpi-chart: the axis range – NaN with no values, negative values drawn below the plot (audit theme 10) */
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import * as standard from "@components/kpi-chart";
import * as clean from "@components/kpi-chart-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

for (const [style, ui] of styles) {
  describe(`kpi-chart ${style}`, () => {
    test("niceRange always includes 0 and halves cleanly", () => {
      expect(ui.niceRange([])).toEqual([0, 2]);
      expect(ui.niceRange([NaN, Infinity])).toEqual([0, 2]);
      expect(ui.niceRange([4, 30, 12])).toEqual([0, 30]);
      expect(ui.niceRange([-3, -10])).toEqual([-10, 0]);
      const [min, max] = ui.niceRange([-3, 10]);
      expect(min).toBeLessThanOrEqual(-3);
      expect(max).toBeGreaterThanOrEqual(10);
    });

    test("empty data renders without NaN", () => {
      const { container } = render(<ui.KpiChart title="Revenue" value="$0" labels={[]} series={[{ label: "A", color: "red", values: [] }]} />);
      expect(container.innerHTML).not.toContain("NaN");
    });

    test("negative values stay inside the plot", () => {
      const { container } = render(
        <ui.KpiChart title="Net" value="$1" labels={["a", "b", "c"]} series={[{ label: "A", color: "red", values: [-8, 3, 12] }]} />,
      );
      const points = container.querySelector("polyline")!.getAttribute("points")!.split(" ");
      for (const p of points) {
        const y = Number(p.split(",")[1]);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(100);
      }
    });
  });
}

/* Phase 3: the highlighted point is controllable */
for (const [style, ui] of styles) {
  describe(`kpi-chart ${style} contract`, () => {
    const props = { title: "Revenue", value: "$9k", labels: ["Mar 3", "Mar 4", "Mar 5"], series: [{ label: "Subs", color: "#2f6bff", values: [3, 5, 4] }] };
    test("a controlled index reports arrow keys without moving; null hides the tooltip", () => {
      const onIndexChange = vi.fn();
      const { container, rerender } = render(<ui.KpiChart {...props} index={1} onIndexChange={onIndexChange} />);
      const plot = container.querySelector('[role="group"]')!;
      fireEvent.keyDown(plot, { key: "ArrowRight" });
      expect(onIndexChange).toHaveBeenCalledWith(2);
      expect(container.querySelector('[class$="__date"]')?.textContent).toBe("Mar 4");
      rerender(<ui.KpiChart {...props} index={null} defaultIndex={2} onIndexChange={onIndexChange} />);
      expect(container.querySelector('[class$="__tooltip"]')?.hasAttribute("data-open")).toBe(false);
    });

    test("uncontrolled: keys move the point and report it; leaving rests on defaultIndex", () => {
      const onIndexChange = vi.fn();
      const { container } = render(<ui.KpiChart {...props} defaultIndex={0} onIndexChange={onIndexChange} />);
      const plot = container.querySelector('[role="group"]')!;
      fireEvent.keyDown(plot, { key: "ArrowRight" });
      expect(onIndexChange).toHaveBeenLastCalledWith(1);
      expect(container.querySelector('[class$="__date"]')?.textContent).toBe("Mar 4");
      fireEvent.keyDown(plot, { key: "Escape" });
      expect(onIndexChange).toHaveBeenLastCalledWith(null);
      expect(container.querySelector('[class$="__date"]')?.textContent).toBe("Mar 3");
    });
  });
}

/* WCAG + design pass (f3): lines differ by more than colour, a legend names them, the tooltip isn't a live region,
 * arrow keys are announced through one persistent status, and hover content closes with Esc */
const two = [
  { label: "Paid", color: "red", values: [1, 2, 3] },
  { label: "Organic", color: "blue", values: [3, 2, 1] },
];
for (const [style, ui] of styles) {
  describe(`kpi-chart ${style} – a11y`, () => {
    test("each line has its own stroke pattern and the legend names them (1.4.1)", () => {
      const { container } = render(<ui.KpiChart title="Visits" value="6" labels={["a", "b", "c"]} series={two} />);
      const dashes = [...container.querySelectorAll(".ui-kpi__lines polyline")].map((p) => p.getAttribute("stroke-dasharray"));
      expect(new Set(dashes).size).toBe(2);
      const legend = container.querySelector(".ui-kpi__legend")!;
      expect(legend.textContent).toContain("Paid");
      expect(legend.textContent).toContain("Organic");
    });

    test("the tooltip is not a live region; arrow keys speak through a status mounted from the start", () => {
      const { container } = render(<ui.KpiChart title="Visits" value="6" labels={["a", "b", "c"]} series={two} />);
      const tooltip = container.querySelector(".ui-kpi__tooltip")!;
      expect(tooltip.getAttribute("role")).toBeNull();
      expect(tooltip.getAttribute("aria-hidden")).toBe("true");
      const status = container.querySelector('[role="status"]')!;
      expect(status.textContent).toBe("");
      const plot = container.querySelector(".ui-kpi__plot")!;
      fireEvent.keyDown(plot, { key: "End" });
      expect(status.textContent).toBe("c: Paid 3, Organic 1");
      // Hovering changes the tooltip but says nothing
      fireEvent.keyDown(plot, { key: "Escape" });
      expect(status.textContent).toBe("");
    });

    test("Esc closes the hover tooltip without moving focus (1.4.13)", () => {
      const button = document.createElement("button");
      document.body.append(button);
      button.focus();
      const { container } = render(<ui.KpiChart title="Visits" value="6" labels={["a", "b", "c"]} series={two} />);
      const plot = container.querySelector<HTMLElement>(".ui-kpi__plot")!;
      plot.getBoundingClientRect = () => ({ left: 0, right: 100, top: 0, bottom: 100, width: 100, height: 100, x: 0, y: 0, toJSON() {} }) as DOMRect;
      fireEvent.pointerMove(plot, { clientX: 10 });
      expect(container.querySelector(".ui-kpi__tooltip[data-open]")).toBeTruthy();
      fireEvent.keyDown(window, { key: "Escape" });
      expect(container.querySelector(".ui-kpi__tooltip[data-open]")).toBeNull();
      expect(document.activeElement).toBe(button);
      button.remove();
    });
  });
}

for (const [style, ui] of styles) {
  test(`kpi-chart ${style}: a pointer over a plot with no width doesn't loop on NaN`, () => {
    const { container } = render(<ui.KpiChart title="Visits" value="6" labels={["a", "b", "c"]} series={two} />);
    fireEvent.pointerMove(container.querySelector(".ui-kpi__plot")!, { clientX: 10 });
    expect(container.querySelector(".ui-kpi__tooltip[data-open]")).toBeNull();
  });
}

/* fill: an opt-in way to fill the container (screens used to override .ui-kpi's internals for it) */
for (const [style, ui] of styles) {
  describe(`kpi-chart ${style} – fill`, () => {
    const props = { title: "Revenue", value: "$9k", labels: ["Mar 3", "Mar 4", "Mar 5"], series: [{ label: "Subs", color: "#2f6bff", values: [3, 5, 4] }] };
    const css = () => document.querySelector('style[data-href="ui-kpi-chart"], style[href="ui-kpi-chart"]')?.textContent ?? "";

    test("off by default: the root keeps its card size", () => {
      const { container } = render(<ui.KpiChart {...props} className="mine" />);
      const root = container.querySelector(".ui-kpi")!;
      expect(root.hasAttribute("data-fill")).toBe(false);
      expect(root.classList.contains("mine")).toBe(true);
    });

    test("fill marks the root, and the styles drop the max-width and let the plot row grow", () => {
      const { container } = render(<ui.KpiChart {...props} fill className="mine" />);
      const root = container.querySelector(".ui-kpi")!;
      expect(root.hasAttribute("data-fill")).toBe(true);
      expect(root.getAttribute("data-look")).toBe(style);
      expect(root.classList.contains("mine")).toBe(true);
      const sheet = css().replace(/\s+/g, " ");
      expect(sheet).toMatch(/\.ui-kpi\[data-fill\] \{[^}]*max-width: none/);
      expect(sheet).toMatch(/\.ui-kpi\[data-fill\] \.ui-kpi__chart \{ grid-template-rows: minmax\(\d+px, 1fr\)/);
    });
  });
}
