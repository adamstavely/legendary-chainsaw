/* date-range-picker: ranges with a time of day, Feb 29 a year back, PageUp/PageDown on long months (audit theme 10) */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/date-range-picker";
import * as clean from "@components/date-range-picker-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const cell = (container: HTMLElement, d: Date) =>
  container.querySelector<HTMLButtonElement>(`[data-day="${new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()}"]`)!;

for (const [style, ui] of styles) {
  describe(`date-range-picker ${style}`, () => {
    test("Previous year maps Feb 29 to Feb 28, not Mar 1", () => {
      const r = ui.compareRange({ start: new Date(2028, 1, 1), end: new Date(2028, 1, 29) }, "year")!;
      expect(r.start).toEqual(new Date(2027, 1, 1));
      expect(r.end).toEqual(new Date(2027, 1, 28));
    });

    test("a value with a time of day highlights its start day and matches presets", () => {
      const today = new Date(2026, 9, 8);
      // "Last 7 days" built from new Date() in the afternoon
      const value = { start: new Date(2026, 9, 2, 15, 30), end: new Date(2026, 9, 8, 15, 30) };
      const { container } = render(<ui.DateRangePicker value={value} today={today} defaultOpen />);
      expect(cell(container, value.start).parentElement!.hasAttribute("data-start")).toBe(true);
      expect(cell(container, value.end).parentElement!.hasAttribute("data-end")).toBe(true);
      expect(screen.getByRole("button", { name: "Last 7 days" }).getAttribute("aria-pressed")).toBe("true");
    });

    test("PageUp/PageDown keep the day, clamped to the target month's length", () => {
      const max = new Date(2027, 0, 1);
      const open = (end: Date) =>
        render(<ui.DateRangePicker defaultValue={{ start: new Date(end.getFullYear(), end.getMonth(), 1), end }} max={max} defaultOpen />);
      const cases: [from: Date, key: string, to: Date][] = [
        [new Date(2026, 2, 31), "PageDown", new Date(2026, 3, 30)], // was Apr 28
        [new Date(2026, 4, 31), "PageUp", new Date(2026, 3, 30)], // was Apr 28
        [new Date(2026, 0, 31), "PageDown", new Date(2026, 1, 28)],
      ];
      for (const [from, key, to] of cases) {
        const { container, unmount } = open(from);
        fireEvent.keyDown(cell(container, from), { key });
        expect(cell(container, to).tabIndex).toBe(0);
        unmount();
      }
    });
  });
}

/* Phase 3 – one API contract: today read after mount, form value, disabled, controllable open/compare */
for (const [style, ui] of styles) {
  describe(`date-range-picker ${style} – contract`, () => {
    afterEach(() => vi.useRealTimers());

    test("the server render reads no clock; the client fills in the last 30 days after mount", () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(2026, 9, 8, 15));
      const html = renderToString(<ui.DateRangePicker name="p" />);
      expect(html).toContain("Last 30 days");
      expect(html).not.toContain("Oct 8");
      const { container } = render(<ui.DateRangePicker name="p" />);
      expect(container.querySelector<HTMLInputElement>('input[name="p"]')!.value).toBe("2026-09-09/2026-10-08");
      expect(container.textContent).toContain("Sep 9 – Oct 8, 2026");
    });

    test("defaultOpen without a today prop opens on the real day once it's known", () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(2026, 9, 8, 15));
      const { container } = render(<ui.DateRangePicker defaultOpen />);
      expect(container.querySelector('[role="dialog"]')).toBeTruthy();
      expect(cell(container, new Date(2026, 9, 8)).getAttribute("aria-current")).toBe("date");
    });

    test("name submits the applied range; disabled blocks the trigger and leaves the form", () => {
      const value = { start: new Date(2026, 9, 1), end: new Date(2026, 9, 8) };
      const view = render(
        <form>
          <ui.DateRangePicker value={value} name="period" today={new Date(2026, 9, 8)} />
        </form>,
      );
      const form = view.container.querySelector("form")!;
      expect(new FormData(form).get("period")).toBe("2026-10-01/2026-10-08");
      view.rerender(
        <form>
          <ui.DateRangePicker value={value} name="period" today={new Date(2026, 9, 8)} disabled defaultOpen />
        </form>,
      );
      expect(new FormData(form).get("period")).toBeNull();
      expect(view.container.querySelector<HTMLButtonElement>('[aria-haspopup="dialog"]')!.disabled).toBe(true);
      expect(view.container.querySelector('[role="dialog"]')).toBeNull();
    });

    test("controlled open only reports; Apply reports the range and the compare mode", () => {
      const onOpenChange = vi.fn();
      const onChange = vi.fn();
      const today = new Date(2026, 9, 8);
      const view = render(<ui.DateRangePicker today={today} open onOpenChange={onOpenChange} onChange={onChange} compareMode="off" />);
      fireEvent.click(screen.getByRole("button", { name: "Last 7 days" }));
      fireEvent.click(screen.getByRole("radio", { name: "Previous year" }));
      fireEvent.click(screen.getByRole("button", { name: "Apply" }));
      expect(onChange).toHaveBeenCalledWith({ start: new Date(2026, 9, 2), end: today }, { start: new Date(2025, 9, 2), end: new Date(2025, 9, 8) }, "year");
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(view.container.querySelector('[role="dialog"]')).toBeTruthy();
      // compareMode stays as passed until the parent changes it
      expect(view.container.querySelector('[class*="__trigger-compare"]')).toBeNull();
    });
  });
}

/* WCAG fix pass: presets were a listbox of tab stops with a non-option child (1.3.1), Compare was a radio group
   without arrow keys (S5), the picked range wasn't announced (4.1.3), focus didn't move into the dialog on open, and
   on narrow panels the arrow keys could strand focus in the hidden month */
for (const [style, ui] of styles) {
  describe(`date-range-picker ${style} – keyboard and announcements`, () => {
    const today = new Date(2026, 9, 8);
    const value = { start: new Date(2026, 9, 2), end: new Date(2026, 9, 8) };

    test("presets are toggle buttons in a group – no listbox", () => {
      render(<ui.DateRangePicker today={today} value={value} defaultOpen />);
      expect(screen.queryByRole("listbox")).toBeNull();
      expect(screen.getByRole("group", { name: "Presets" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Last 7 days" }).getAttribute("aria-pressed")).toBe("true");
    });

    test("Compare: one tab stop, arrow keys move and select", () => {
      render(<ui.DateRangePicker today={today} value={value} defaultOpen defaultCompare="off" />);
      const radios = () => screen.getAllByRole("radio");
      expect(radios().map((r) => r.tabIndex)).toEqual([0, -1, -1]);
      act(() => radios()[0].focus());
      fireEvent.keyDown(radios()[0], { key: "ArrowRight" });
      expect(radios()[1].getAttribute("aria-checked")).toBe("true");
      expect(document.activeElement).toBe(radios()[1]);
      fireEvent.keyDown(radios()[1], { key: "ArrowLeft" });
      fireEvent.keyDown(radios()[0], { key: "ArrowLeft" });
      expect(radios()[2].getAttribute("aria-checked")).toBe("true");
    });

    test("opening from the trigger moves focus onto the focused day; picks are announced", () => {
      const { container } = render(<ui.DateRangePicker today={today} value={value} />);
      fireEvent.click(screen.getByRole("button", { expanded: false }));
      expect(document.activeElement).toBe(cell(container, value.end));
      const said = () => [...container.querySelectorAll('[role="status"]')].map((r) => r.textContent);
      fireEvent.click(cell(container, new Date(2026, 9, 5)));
      expect(said()).toContain("Start Oct 5, 2026 – pick an end");
      fireEvent.click(cell(container, new Date(2026, 9, 7)));
      expect(said()).toContain("Oct 5 – Oct 7, 2026, 3 days");
    });
  });
}
