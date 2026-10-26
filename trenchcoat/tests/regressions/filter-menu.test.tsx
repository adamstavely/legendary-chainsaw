/* filter-menu: Phase 3 contract – ids not built from user data, form integration, disabled, controllable groups */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import * as standard from "@components/filter-menu";
import * as clean from "@components/filter-menu-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const GROUPS = [
  { id: "status", label: "Status", options: [{ id: "new", label: "New" }, { id: "won", label: "Won" }] },
  { id: "my region", label: "Region", options: [{ id: "eu", label: "Europe" }] },
];

for (const [style, ui] of styles) {
  describe(`filter-menu ${style}`, () => {
    test("two menus with the same groups get distinct panel ids, none built from group ids", () => {
      const { container } = render(
        <>
          <ui.FilterMenu groups={GROUPS} defaultOpen={["status", "my region"]} />
          <ui.FilterMenu groups={GROUPS} defaultOpen={["status", "my region"]} />
        </>,
      );
      const ids = [...container.querySelectorAll('[role="group"][id]')].map((p) => p.id);
      expect(ids).toHaveLength(4);
      expect(new Set(ids).size).toBe(4);
      expect(ids.some((id) => id.includes("status") || id.includes("region"))).toBe(false);
      container.querySelectorAll("[aria-controls]").forEach((b) => expect(container.querySelector(`#${CSS.escape(b.getAttribute("aria-controls")!)}`)).toBeTruthy());
    });

    test("name submits one field per picked option; disabled leaves them out and blocks changes", () => {
      const onChange = vi.fn();
      const view = render(
        <form>
          <ui.FilterMenu groups={GROUPS} name="f" defaultValue={{ status: ["new", "won"], "my region": ["eu"] }} onChange={onChange} />
        </form>,
      );
      const form = view.container.querySelector("form")!;
      expect(new FormData(form).getAll("f[status]")).toEqual(["new", "won"]);
      expect(new FormData(form).getAll("f[my region]")).toEqual(["eu"]);
      view.rerender(
        <form>
          <ui.FilterMenu groups={GROUPS} name="f" defaultValue={{ status: ["new"] }} onChange={onChange} disabled />
        </form>,
      );
      expect([...new FormData(form).keys()]).toEqual([]);
      fireEvent.click(screen.getByRole("checkbox", { name: "Won" }));
      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: "Clear all" }).hasAttribute("disabled")).toBe(true);
    });

    test("controlled value and open groups only report", () => {
      const onChange = vi.fn();
      const onOpenChange = vi.fn();
      render(<ui.FilterMenu groups={GROUPS} value={{}} onChange={onChange} open={["status"]} onOpenChange={onOpenChange} />);
      fireEvent.click(screen.getByRole("checkbox", { name: "New" }));
      expect(onChange).toHaveBeenCalledWith({ status: ["new"] });
      expect(screen.getByRole("checkbox", { name: "New" }).getAttribute("aria-checked")).toBe("false");
      fireEvent.click(screen.getByRole("button", { name: /Region/ }));
      expect(onOpenChange).toHaveBeenCalledWith(["status", "my region"]);
      expect(screen.getByRole("button", { name: /Region/ }).getAttribute("aria-expanded")).toBe("false");
    });
  });
}

/* WCAG + design pass: inert folds, plain Tab order, focus rescue, one narrow status region */
import { act, waitFor } from "@testing-library/react";

for (const [style, ui] of styles) {
  describe(`filter-menu ${style} – a11y`, () => {
    test("a folded group's options are inert; heads and visible options are all in the Tab order", () => {
      const { container } = render(<ui.FilterMenu groups={GROUPS} defaultOpen={["status"]} />);
      const panels = container.querySelectorAll(".ui-fm__panel");
      expect(panels[0].hasAttribute("inert")).toBe(false);
      expect(panels[1].hasAttribute("inert")).toBe(true);
      container.querySelectorAll(".ui-fm__group-head, .ui-fm__option").forEach((b) => expect(b.getAttribute("tabindex")).toBeNull());
      fireEvent.click(screen.getByRole("button", { name: /Status/ }));
      expect(panels[0].hasAttribute("inert")).toBe(true);
    });

    test("no live region inside buttons or around the chips; a status region is there from mount and reports the count", () => {
      const { container } = render(<ui.FilterMenu groups={GROUPS} defaultOpen={["status"]} />);
      expect(container.querySelectorAll("[aria-live]")).toHaveLength(0);
      const status = screen.getByRole("status");
      expect(status.textContent).toBe("");
      fireEvent.click(screen.getByRole("checkbox", { name: "New" }));
      expect(status.textContent).toBe("1 filter active");
      expect(screen.getByRole("status")).toBe(status);
    });

    test("ArrowLeft on an option moves focus to its head before folding", () => {
      render(<ui.FilterMenu groups={GROUPS} defaultOpen={["status"]} />);
      const opt = screen.getByRole("checkbox", { name: "Won" });
      opt.focus();
      fireEvent.keyDown(opt, { key: "ArrowLeft" });
      const head = screen.getByRole("button", { name: /Status/ });
      expect(document.activeElement).toBe(head);
      expect(head.getAttribute("aria-expanded")).toBe("false");
    });

    test("folding from outside while an option has focus moves focus to the group head", async () => {
      const view = render(<ui.FilterMenu groups={GROUPS} open={["status"]} />);
      screen.getByRole("checkbox", { name: "Won" }).focus();
      view.rerender(<ui.FilterMenu groups={GROUPS} open={[]} />);
      await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: /Status/ })));
    });

    test("removing a chip moves focus to the next chip's ×, then the previous, then the first group head", async () => {
      render(<ui.FilterMenu groups={GROUPS} defaultValue={{ status: ["new", "won"], "my region": ["eu"] }} />);
      // Clean keeps chips on one line (jsdom measures 0 px, so all are behind "+N"): "+N" shows them all
      if (style === "clean") fireEvent.click(screen.getByRole("button", { name: /^Show 3 more/ }));
      const first = screen.getByRole("button", { name: "Remove New" });
      first.focus();
      act(() => first.click());
      await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "Remove Won" })));
      const lastX = screen.getByRole("button", { name: "Remove Europe" });
      lastX.focus();
      act(() => lastX.click());
      await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "Remove Won" })));
      act(() => (document.activeElement as HTMLElement).click());
      await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: /Status/ })));
    });

    test("Clear all (disabled once empty) hands focus to the first group head", async () => {
      render(<ui.FilterMenu groups={GROUPS} defaultValue={{ status: ["new"] }} />);
      const clear = screen.getByRole("button", { name: "Clear all" });
      clear.focus();
      act(() => clear.click());
      expect(clear.hasAttribute("disabled")).toBe(true);
      await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: /Status/ })));
    });
  });
}

describe("filter-menu clean – +N overflow", () => {
  test('"+N" is a button that shows every hidden chip (removable) and folds back', () => {
    render(<clean.FilterMenu groups={GROUPS} defaultValue={{ status: ["new", "won"] }} />);
    expect(screen.queryByRole("button", { name: "Remove New" })).toBeNull();
    const more = screen.getByRole("button", { name: "Show 2 more: New, Won" });
    expect(more.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(more);
    expect(screen.getByRole("button", { name: "Remove New" })).toBeTruthy();
    expect(more.getAttribute("aria-expanded")).toBe("true");
    expect(more.textContent).toBe("Show less");
    fireEvent.click(more);
    expect(screen.queryByRole("button", { name: "Remove New" })).toBeNull();
  });
});
