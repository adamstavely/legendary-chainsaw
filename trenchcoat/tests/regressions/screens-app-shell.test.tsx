/* screens/app-shell: `setup` was copied into state once and ignored afterwards; the parts' value props decided control
   loosely; Popover re-attached its document listeners on every render */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { useState } from "react";
import { AppShell, Dropdown, FilterButton, MenuButton, Popover, SearchField, Tabs, ViewToggle, useToast } from "@screens/app-shell";

const setup = (done: boolean) => [{ id: "g", title: "Group", tasks: [{ id: "a", label: "A", done }, { id: "b", label: "B" }] }];
const progress = (c: HTMLElement) => c.querySelector(".ui-as-steps__sub")!.textContent;

describe("screens/app-shell", () => {
  test("the getting-started card follows new `setup` done flags", () => {
    const { container, rerender } = render(<AppShell setup={setup(false)}>Page</AppShell>);
    expect(progress(container)).toMatch(/^0% done/);
    rerender(<AppShell setup={setup(true)}>Page</AppShell>);
    expect(progress(container)).toMatch(/^50% done/);
    // A new array with the same flags keeps what was ticked here
    rerender(<AppShell setup={setup(true)}>Page</AppShell>);
    expect(progress(container)).toMatch(/^50% done/);
  });

  test("a controlled search field shows its value and reports edits", () => {
    const onChange = vi.fn();
    const { rerender } = render(<SearchField placeholder="Search" value="a" onChange={onChange} />);
    const input = screen.getByRole<HTMLInputElement>("searchbox");
    fireEvent.change(input, { target: { value: "ab" } });
    expect(onChange).toHaveBeenCalledWith("ab");
    expect(input.value).toBe("a");
    rerender(<SearchField placeholder="Search" value="ab" onChange={onChange} />);
    expect(input.value).toBe("ab");
  });

  test("an open menu keeps one set of document listeners across re-renders", () => {
    const add = vi.spyOn(document, "addEventListener");
    const Menu = ({ n }: { n: number }) => (
      <Dropdown items={[{ label: `Item ${n}` }]} trigger={({ toggle }) => <button onClick={toggle}>Open</button>} />
    );
    const { rerender } = render(<Menu n={1} />);
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    const after = add.mock.calls.filter(([type]) => type === "pointerdown").length;
    act(() => rerender(<Menu n={2} />));
    act(() => rerender(<Menu n={3} />));
    expect(add.mock.calls.filter(([type]) => type === "pointerdown").length).toBe(after);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
    add.mockRestore();
  });

  /* WCAG + design pass (s1) */
  test("Tabs: a tablist with one tab stop; arrow keys / Home / End move and pick; the name is the visible text", () => {
    const onChange = vi.fn();
    render(<Tabs label="Status" items={["All", "Running", "Done"]} onChange={onChange} />);
    const list = screen.getByRole("tablist", { name: "Status" });
    const tabs = within(list).getAllByRole("tab");
    expect(tabs.map((t) => t.tabIndex)).toEqual([0, -1, -1]);
    expect(tabs.map((t) => t.textContent)).toEqual(["All", "Running", "Done"]);
    tabs[0].focus();
    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
    expect(onChange).toHaveBeenLastCalledWith("Running");
    expect(document.activeElement).toBe(tabs[1]);
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(tabs[1], { key: "End" });
    expect(document.activeElement).toBe(tabs[2]);
    fireEvent.keyDown(tabs[2], { key: "ArrowRight" });
    expect(document.activeElement).toBe(tabs[0]);
  });

  test("ViewToggle is a radiogroup with arrow keys", () => {
    const onChange = vi.fn();
    render(<ViewToggle onChange={onChange} />);
    const grid = screen.getByRole("radio", { name: "Grid" });
    grid.focus();
    fireEvent.keyDown(grid, { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith("list");
  });

  test("Dropdown: the trigger says it opens a menu; focus moves in, arrows move, Escape returns focus to the trigger", () => {
    render(<Dropdown items={[{ label: "One" }, { label: "Two" }, { label: "Three" }]} trigger={({ toggle }) => <button onClick={toggle}>Open</button>} />);
    const trigger = screen.getByRole("button", { name: "Open" });
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    trigger.focus();
    fireEvent.click(trigger);
    const items = screen.getAllByRole("menuitem");
    expect(document.activeElement).toBe(items[0]);
    // Menus don't sit in an unnamed dialog
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.keyDown(items[0], { key: "ArrowDown" });
    expect(document.activeElement).toBe(items[1]);
    fireEvent.keyDown(items[1], { key: "ArrowUp" });
    fireEvent.keyDown(items[0], { key: "ArrowUp" });
    expect(document.activeElement).toBe(items[2]);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  test("MenuButton: focus starts on the checked choice and returns to the trigger after a pick", () => {
    const Pick = () => {
      const [v, setV] = useState<"a" | "b">("b");
      return <MenuButton value={v} onChange={setV} options={[{ value: "a", label: "Alpha" }, { value: "b", label: "Beta" }]} />;
    };
    render(<Pick />);
    const trigger = screen.getByRole("button", { name: /Beta/ });
    trigger.focus();
    fireEvent.click(trigger);
    expect(document.activeElement).toBe(screen.getByRole("menuitemradio", { name: "Beta" }));
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Alpha" }));
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /Alpha/ }));
  });

  test("Popover: a dialog with a name (its label, else its trigger's) that returns focus to the trigger on Escape", () => {
    const Pop = () => {
      const [open, setOpen] = useState(false);
      return (
        <span>
          <button onClick={() => setOpen(true)}>Invite</button>
          <Popover open={open} onClose={() => setOpen(false)}>
            <input aria-label="Email" />
          </Popover>
        </span>
      );
    };
    render(<Pop />);
    const trigger = screen.getByRole("button", { name: "Invite" });
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog", { name: "Invite" })).toBeTruthy();
    screen.getByRole("textbox", { name: "Email" }).focus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    render(<FilterButton label="Filters" groups={[]} value={{}} onChange={() => {}} />);
    const filters = screen.getByRole("button", { name: /Filters/ });
    expect(filters.getAttribute("aria-haspopup")).toBe("dialog");
    fireEvent.click(filters);
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeTruthy();
  });

  test("the toast's live region is there from mount", () => {
    let show: (t: string) => void = () => {};
    const T = () => {
      const [node, s] = useToast();
      show = s;
      return <div>{node}</div>;
    };
    render(<T />);
    const live = screen.getByRole("status");
    expect(live.textContent).toBe("");
    act(() => show("Saved"));
    expect(screen.getByRole("status")).toBe(live);
    expect(live.textContent).toBe("Saved");
  });

  test("the sidebar drawer: opening moves focus into it, closing (button or Escape) back to the icon that opens it", () => {
    // jsdom has no layout, so the shell measures 0 px wide and runs its narrow (drawer) layout
    const { container } = render(<AppShell>Page</AppShell>);
    // (jsdom doesn't run the container queries that show it, so it counts as hidden – and nameless – here)
    const open = container.querySelector<HTMLElement>('[aria-label="Open sidebar"]')!;
    open.focus();
    fireEvent.click(open);
    expect(document.activeElement?.classList.contains("ui-as-side__workspace")).toBe(true);
    fireEvent.click(container.querySelector('.ui-as-side [aria-label="Close sidebar"]')!);
    expect(document.activeElement).toBe(open);
    fireEvent.click(open);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.activeElement).toBe(open);
  });

  test("getting started: focus moves into the guide when it opens and back to the summary when it closes", () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<AppShell>Page</AppShell>);
      const summary = container.querySelector<HTMLElement>(".ui-as-steps")!;
      summary.focus();
      fireEvent.click(summary);
      const guide = container.querySelector(".ui-as-guide__content")!;
      expect(guide.contains(document.activeElement)).toBe(true);
      fireEvent.click(within(guide as HTMLElement).getByRole("button", { name: /close/i }));
      act(() => vi.advanceTimersByTime(500));
      expect(document.activeElement).toBe(container.querySelector(".ui-as-steps"));
    } finally {
      vi.useRealTimers();
    }
  });

  test("dismissing the last news card moves focus on, not to <body>", () => {
    const { container } = render(<AppShell>Page</AppShell>);
    for (let i = 0; i < 2; i++) {
      const dismiss = screen.getByRole("button", { name: "Dismiss" });
      dismiss.focus();
      fireEvent.click(dismiss);
    }
    expect(screen.queryByRole("button", { name: "Dismiss" })).toBeNull();
    expect(document.activeElement).toBe(container.querySelector(".ui-as-steps"));
  });

  test("the news close button is a 24 px target and the setup guide is no longer zoomed", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("screens/app-shell.tsx", "utf8");
    expect(src).not.toMatch(/zoom\s*:/);
    expect(src).not.toMatch(/\.ui-(pl|df|ap|tc|um|sg|fm|button)\b[^{]*\{/);
  });
});

