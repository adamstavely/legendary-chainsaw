/* data-table: Tab/Shift+Tab leave the grid (WCAG 2.1.2), and keys from the sort buttons and checkboxes inside it are theirs */
import { useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import * as standard from "@components/data-table";
import * as clean from "@components/data-table-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const columns = [
  { key: "name", label: "Name", type: "title" as const },
  { key: "seats", label: "Seats", type: "number" as const },
];
const rows = [
  { id: "a", name: "Northwind", seats: 12 },
  { id: "b", name: "Contoso", seats: 40 },
];

for (const [style, ui] of styles) {
  describe(`data-table ${style}`, () => {
    test("Shift+Tab isn't swallowed once a cell is active", () => {
      const { container } = render(<ui.DataTable title="Accounts" columns={columns} rows={rows} />);
      const grid = screen.getByRole("grid");
      fireEvent.keyDown(grid, { key: "ArrowDown" });
      expect(container.querySelector("[data-active]")).toBeTruthy();
      expect(fireEvent.keyDown(grid, { key: "Tab", shiftKey: true })).toBe(true);
      expect(fireEvent.keyDown(grid, { key: "Tab" })).toBe(true);
    });

    test("Enter on a sort button and Space on a row checkbox reach the control", () => {
      const { container } = render(<ui.DataTable title="Accounts" columns={columns} rows={rows} />);
      const grid = screen.getByRole("grid");
      const sort = screen.getByRole("button", { name: "Seats" });
      expect(fireEvent.keyDown(sort, { key: "Enter" })).toBe(true);
      // The grid didn't take it as "activate the first cell"
      expect(container.querySelector("[data-active]")).toBeNull();

      fireEvent.keyDown(grid, { key: "ArrowDown" });
      const box = screen.getByRole("checkbox", { name: "Select Northwind" });
      expect(fireEvent.keyDown(box, { key: " " })).toBe(true);
      // Space didn't start editing the active cell
      expect(container.querySelector("[data-editing]")).toBeNull();
    });
  });
}

/* Phase 3: rows, selection and sort are controllable; history works on the latest rows */
const seats = (container: HTMLElement) => [...container.querySelectorAll('tbody td[data-type="number"]')].map((td) => td.textContent);
const editSeats = (container: HTMLElement, row: number, value: string) => {
  fireEvent.doubleClick(container.querySelector(`[data-cell="${row}-1"]`)!);
  const input = screen.getByRole("textbox", { name: "Seats" });
  fireEvent.change(input, { target: { value } });
  fireEvent.keyDown(input, { key: "Enter" });
};

for (const [style, ui] of styles) {
  describe(`data-table ${style} contract`, () => {
    test("controlled rows: edits are reported, not applied; later rows from the parent show up", () => {
      const onRowsChange = vi.fn();
      const { container, rerender } = render(<ui.DataTable title="Accounts" columns={columns} rows={rows} onRowsChange={onRowsChange} />);
      editSeats(container, 0, "99");
      expect(onRowsChange.mock.lastCall![0][0]).toMatchObject({ id: "a", seats: 99 });
      expect(seats(container)).toEqual(["12", "40"]);
      // Server data arrives
      rerender(<ui.DataTable title="Accounts" columns={columns} rows={[...rows, { id: "c", name: "Fabrikam", seats: 7 }]} onRowsChange={onRowsChange} />);
      expect(seats(container)).toEqual(["12", "40", "7"]);
    });

    test("uncontrolled rows: edits apply, undo and redo step through them, two quick undos undo twice", () => {
      const onRowsChange = vi.fn();
      const { container } = render(<ui.DataTable title="Accounts" columns={columns} defaultRows={rows} onRowsChange={onRowsChange} />);
      editSeats(container, 0, "13");
      editSeats(container, 1, "41");
      expect(seats(container)).toEqual(["13", "41"]);
      const grid = screen.getByRole("grid");
      fireEvent.keyDown(grid, { key: "z", ctrlKey: true });
      fireEvent.keyDown(grid, { key: "z", ctrlKey: true });
      expect(seats(container)).toEqual(["12", "40"]);
      expect(onRowsChange.mock.lastCall![0]).toEqual(rows);
      fireEvent.click(screen.getByRole("button", { name: /^Redo/ }));
      expect(seats(container)).toEqual(["13", "40"]);
    });

    test("rows kept in parent state: edits round-trip and undo still works", () => {
      function Parent() {
        const [state, setState] = useState<standard.DataRow[]>(rows);
        return <ui.DataTable title="Accounts" columns={columns} rows={state} onRowsChange={setState} />;
      }
      const { container } = render(<Parent />);
      editSeats(container, 0, "13");
      expect(seats(container)).toEqual(["13", "40"]);
      fireEvent.click(screen.getByRole("button", { name: /^Undo/ }));
      expect(seats(container)).toEqual(["12", "40"]);
    });

    test("rows replaced from outside end the undo history", () => {
      let replace: (next: standard.DataRow[]) => void = () => {};
      function Parent() {
        const [state, setState] = useState<standard.DataRow[]>(rows);
        replace = setState;
        return <ui.DataTable title="Accounts" columns={columns} rows={state} onRowsChange={setState} />;
      }
      const { container } = render(<Parent />);
      const undoButton = () => screen.getByRole("button", { name: /^Undo/ }) as HTMLButtonElement;
      editSeats(container, 0, "13");
      expect(undoButton().disabled).toBe(false);
      act(() => replace([rows[1]]));
      expect(seats(container)).toEqual(["40"]);
      expect(undoButton().disabled).toBe(true);
    });

    test("controlled selection and sort report changes without applying them", () => {
      const onSelectionChange = vi.fn();
      const onSortChange = vi.fn();
      const { container } = render(
        <ui.DataTable title="Accounts" columns={columns} defaultRows={rows} selection={["b"]} onSelectionChange={onSelectionChange} sort={null} onSortChange={onSortChange} />,
      );
      expect(screen.getByText("1 selected")).toBeTruthy();
      fireEvent.click(screen.getByRole("checkbox", { name: "Select Northwind" }));
      expect(onSelectionChange).toHaveBeenCalledWith(["a", "b"]);
      expect(screen.getByText("1 selected")).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Seats" }));
      expect(onSortChange).toHaveBeenCalledWith({ key: "seats", dir: "asc" });
      expect(container.querySelector('[aria-sort="ascending"]')).toBeNull();
    });

    test("Enter while composing (IME) neither commits an edit nor starts one", () => {
      const onRowsChange = vi.fn();
      const { container } = render(<ui.DataTable title="Accounts" columns={columns} defaultRows={rows} onRowsChange={onRowsChange} />);
      fireEvent.doubleClick(container.querySelector('[data-cell="0-1"]')!);
      const input = screen.getByRole("textbox", { name: "Seats" });
      fireEvent.change(input, { target: { value: "5" } });
      fireEvent.keyDown(input, { key: "Enter", isComposing: true });
      expect(screen.queryByRole("textbox", { name: "Seats" })).toBeTruthy();
      expect(onRowsChange).not.toHaveBeenCalled();
    });
  });
}

/* Phase 4: rows are memoised, and long tables render only the rows near the viewport */
const many = Array.from({ length: 500 }, (_, i) => ({ id: `r${i}`, name: `Account ${i}`, seats: i }));
const bodyRows = (container: HTMLElement) => [...container.querySelectorAll<HTMLElement>("tbody tr[aria-rowindex]")];

for (const [style, ui] of styles) {
  describe(`data-table ${style} – performance`, () => {
    test("a short table renders every row, with its place in the grid", () => {
      const { container } = render(<ui.DataTable title="Accounts" columns={columns} rows={rows} />);
      expect(screen.getByRole("grid").getAttribute("aria-rowcount")).toBe("3");
      expect(bodyRows(container).map((tr) => tr.getAttribute("aria-rowindex"))).toEqual(["2", "3"]);
      expect(container.querySelector("thead tr")?.getAttribute("aria-rowindex")).toBe("1");
    });

    test("above 200 rows only a window is rendered; aria-rowcount and aria-rowindex still describe the whole grid", () => {
      const { container } = render(<ui.DataTable title="Accounts" columns={columns} rows={many} />);
      const grid = screen.getByRole("grid");
      expect(grid.getAttribute("aria-rowcount")).toBe("501");
      const shown = bodyRows(container);
      expect(shown.length).toBeGreaterThan(0);
      expect(shown.length).toBeLessThan(100);
      expect(shown[0].getAttribute("aria-rowindex")).toBe("2");
      shown.forEach((tr, i) => expect(tr.getAttribute("aria-rowindex")).toBe(String(i + 2)));
    });

    test("the keyboard reaches rows outside the window: Ctrl+End brings the last row in and makes it active", () => {
      const { container } = render(<ui.DataTable title="Accounts" columns={columns} rows={many} />);
      const grid = screen.getByRole("grid");
      fireEvent.keyDown(grid, { key: "ArrowDown" });
      expect(container.querySelector('[data-cell="0-0"][data-active]')).toBeTruthy();
      act(() => {
        fireEvent.keyDown(grid, { key: "End", ctrlKey: true });
      });
      const last = container.querySelector('tr[aria-rowindex="501"]');
      expect(last).toBeTruthy();
      expect(last!.querySelector("[data-active]")?.getAttribute("data-cell")).toBe("499-1");
      expect(bodyRows(container).length).toBeLessThan(100);
      fireEvent.keyDown(grid, { key: "ArrowUp" });
      expect(container.querySelector('[data-cell="498-1"][data-active]')).toBeTruthy();
    });

    test("selecting a cell re-renders only the rows it touches", () => {
      // Row 10 counts how often its seats are read – i.e. how often it renders
      let reads = 0;
      const watched = { id: "w", name: "Watched" } as standard.DataRow;
      Object.defineProperty(watched, "seats", { enumerable: true, get: () => (reads++, 7) });
      const list = many.slice(0, 50).map((r, i) => (i === 10 ? watched : r));
      const { container } = render(<ui.DataTable title="Accounts" columns={columns} rows={list} />);
      expect(reads).toBeGreaterThan(0);
      reads = 0;
      fireEvent.pointerDown(container.querySelector('[data-cell="3-1"]')!, { button: 0 });
      fireEvent.keyDown(screen.getByRole("grid"), { key: "ArrowDown" });
      expect(container.querySelector('[data-cell="4-1"][data-active]')).toBeTruthy();
      expect(reads).toBe(0);
    });
  });
}

/* WCAG + design pass (f3): screen readers hear the active cell, one persistent status region, focus never drops to
 * <body>, the tag picker is a real listbox, link cells open by keyboard, and long tables are windowed early */
const tagColumns = [
  { key: "name", label: "Name", type: "title" as const },
  { key: "stage", label: "Stage", type: "tag" as const, options: ["Lead", "Won"] },
  { key: "site", label: "Site", type: "link" as const },
];
const tagRows = [{ id: "a", name: "Northwind", stage: "Lead", site: "northwind.com" }];

for (const [style, ui] of styles) {
  describe(`data-table ${style} – a11y`, () => {
    test("the grid points aria-activedescendant at the active cell (4.1.2)", () => {
      render(<ui.DataTable title="Accounts" columns={columns} rows={rows} />);
      const grid = screen.getByRole("grid");
      expect(grid.getAttribute("aria-activedescendant")).toBeNull();
      fireEvent.keyDown(grid, { key: "ArrowDown" });
      fireEvent.keyDown(grid, { key: "ArrowRight" });
      const id = grid.getAttribute("aria-activedescendant")!;
      const cell = document.getElementById(id)!;
      expect(cell.getAttribute("role")).toBe("gridcell");
      expect(cell.textContent).toBe("12");
    });

    test("a status region is there from mount and announces the checked count", () => {
      const { container } = render(<ui.DataTable title="Accounts" columns={columns} defaultRows={rows} />);
      const status = container.querySelector('[role="status"]')!;
      expect(status.textContent).toBe("");
      fireEvent.click(screen.getByRole("checkbox", { name: "Select Northwind" }));
      expect(container.querySelector('[role="status"]')).toBe(status);
      expect(status.textContent).toBe("1 row selected");
      // The hint names the keyboard way in
      fireEvent.click(screen.getByRole("button", { name: "Clear" }));
      expect(screen.getByText("Double-click or press Enter to edit")).toBeTruthy();
    });

    test("Delete in the bulk bar moves focus to the grid, not <body> (2.4.3)", async () => {
      render(<ui.DataTable title="Accounts" columns={columns} defaultRows={rows} />);
      fireEvent.click(screen.getByRole("checkbox", { name: "Select Northwind" }));
      const del = screen.getByRole("button", { name: "Delete" });
      del.focus();
      await act(async () => {
        fireEvent.click(del);
      });
      expect(document.activeElement).toBe(screen.getByRole("grid"));
    });

    test("tag picker: one tab stop, a check on the chosen tag, Tab closes it back to the grid", async () => {
      const { container } = render(<ui.DataTable title="Deals" columns={tagColumns} defaultRows={tagRows} />);
      fireEvent.doubleClick(container.querySelector('[data-cell="0-1"]')!);
      const list = screen.getByRole("listbox", { name: "Stage" });
      const [lead, won] = screen.getAllByRole("option");
      expect(lead.getAttribute("aria-selected")).toBe("true");
      expect(lead.tabIndex).toBe(0);
      expect(won.tabIndex).toBe(-1);
      expect(lead.querySelector(".ui-dt__option-check")).toBeTruthy();
      fireEvent.keyDown(lead, { key: "End" });
      expect(document.activeElement).toBe(won);
      expect(fireEvent.keyDown(won, { key: "Tab" })).toBe(false);
      expect(list.isConnected).toBe(false);
    });

    test("Ctrl/⌘+Enter on a link cell follows the link; Enter still edits", () => {
      const { container } = render(<ui.DataTable title="Deals" columns={tagColumns} defaultRows={tagRows} />);
      const grid = screen.getByRole("grid");
      fireEvent.keyDown(grid, { key: "ArrowDown" });
      fireEvent.keyDown(grid, { key: "End" });
      const link = container.querySelector<HTMLAnchorElement>('[data-cell="0-2"] a')!;
      const click = vi.fn((e: Event) => e.preventDefault());
      link.addEventListener("click", click);
      fireEvent.keyDown(grid, { key: "Enter", ctrlKey: true, metaKey: true });
      expect(click).toHaveBeenCalledTimes(1);
      fireEvent.keyDown(grid, { key: "Enter" });
      expect(screen.getByRole("textbox", { name: "Site" })).toBeTruthy();
    });

    test("a 150-row table is windowed (the virtualisation cliff moved from 200 to 60 rows)", () => {
      const many = Array.from({ length: 150 }, (_, i) => ({ id: `r${i}`, name: `Row ${i}`, seats: i }));
      const { container } = render(<ui.DataTable title="Accounts" columns={columns} rows={many} />);
      expect(container.querySelectorAll("tbody tr[aria-rowindex]").length).toBeLessThan(150);
    });
  });
}
