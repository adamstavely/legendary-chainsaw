/*
 * blocks/client-context: sync / regenerate / focus timers outlived an unmount; "Regenerating…" showed on the
 * same-named report of every client; clients and their context were copied into state once and ignored afterwards.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { ClientContext, type ContextClient } from "@blocks/client-context";

const note = (id: string, text: string) => ({ id, kind: "note" as const, author: { name: "Jonas Weber" }, when: "1d ago", text });
const client = (id: string, name: string, context = [note(`${id}-1`, `${name} goal`)]): ContextClient => ({
  id,
  name,
  meta: `${name} Ltd`,
  mark: { letter: name[0], bg: "#1d4ed8", fg: "#ffffff" },
  kpis: [],
  reports: [{ name: "Monthly P&L", when: "2d ago", summary: "Fine." }],
  context,
});

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("blocks/client-context", () => {
  test("unmounting while syncing and regenerating leaves no timer behind", () => {
    const view = render(<ClientContext clients={[client("a", "Alpha")]} />);
    fireEvent.click(screen.getByRole("button", { name: /sync now$/ }));
    fireEvent.click(screen.getByRole("tab", { name: "Reports" }));
    fireEvent.click(screen.getByRole("button", { name: /Monthly P&L/ }));
    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));
    view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  test("regenerating a report only marks that client's report", () => {
    const { rerender } = render(<ClientContext clients={[client("a", "Alpha"), client("b", "Beta")]} client="a" onClientChange={() => {}} />);
    fireEvent.click(screen.getByRole("tab", { name: "Reports" }));
    fireEvent.click(screen.getByRole("button", { name: /Monthly P&L/ }));
    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));
    expect(screen.getAllByText("Regenerating…").length).toBeGreaterThan(0);
    rerender(<ClientContext clients={[client("a", "Alpha"), client("b", "Beta")]} client="b" onClientChange={() => {}} />);
    fireEvent.click(screen.getByRole("tab", { name: "Reports" }));
    expect(screen.queryByText("Regenerating…")).toBeNull();
  });

  test("context from the parent lands, replacing local edits for that client only", () => {
    const a = client("a", "Alpha");
    const { rerender } = render(<ClientContext clients={[a]} me={{ name: "Sofia Lind" }} />);
    fireEvent.change(screen.getByRole("textbox", { name: "New context" }), { target: { value: "Local note", selectionStart: 10 } });
    fireEvent.click(screen.getByRole("button", { name: "Add context" }));
    expect(screen.getByText("Local note")).toBeTruthy();
    // Same data again (a new array with equal content): the local note stays
    rerender(<ClientContext clients={[client("a", "Alpha")]} me={{ name: "Sofia Lind" }} />);
    expect(screen.getByText("Local note")).toBeTruthy();
    // New data from the server: it wins
    rerender(<ClientContext clients={[client("a", "Alpha", [note("srv", "From the server")])]} me={{ name: "Sofia Lind" }} />);
    expect(screen.getByText("From the server")).toBeTruthy();
    expect(screen.queryByText("Local note")).toBeNull();
  });

  test("picking a client reports it; a controlled client stays until the prop changes", async () => {
    const onClientChange = vi.fn();
    render(<ClientContext clients={[client("a", "Alpha"), client("b", "Beta")]} client="a" onClientChange={onClientChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Switch client" }));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: /Beta/ })));
    expect(onClientChange).toHaveBeenCalledWith("b");
    expect(document.querySelector(".ui-cx__name")!.textContent).toBe("Alpha");
  });
});

/* WCAG + design pass: names include the visible label, popovers have a keyboard and give focus back, focus never drops
   to <body>, collapsed report bodies are inert, results are announced in narrow regions present from mount */
describe("blocks/client-context – names, keyboard and focus", () => {
  const me = { name: "Sofia Lind" };
  const mine = (id: string, text: string) => ({ ...note(id, text), author: me });

  test("the sync button is named by what it shows (2.5.3); its result goes to a status region present from mount", () => {
    const { container } = render(<ClientContext clients={[client("a", "Alpha")]} />);
    const sync = screen.getByRole("button", { name: /^Synced 3m ago ?, sync now$/ });
    const status = container.querySelector(".ui-cx__head [role='status']")!;
    expect(status.textContent).toBe("");
    fireEvent.click(sync);
    act(() => vi.advanceTimersByTime(1000));
    expect(status.textContent).toBe("Synced just now");
  });

  test("the client popover takes focus, arrows move, Esc and a pick return focus to Switch client", () => {
    render(<ClientContext clients={[client("a", "Alpha"), client("b", "Beta")]} />);
    const trigger = screen.getByRole("button", { name: "Switch client" });
    fireEvent.click(trigger);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /Alpha/ }));
    fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: /Beta/ }));
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: /Beta/ }));
    expect(document.activeElement).toBe(trigger);
    expect(document.querySelector(".ui-cx__name")!.textContent).toBe("Beta");
  });

  test("removing a note moves focus to the next note's remove button, the last one to the note box", () => {
    render(<ClientContext clients={[client("a", "Alpha", [mine("x", "First"), mine("y", "Second")])]} me={me} />);
    const [first] = screen.getAllByRole("button", { name: "Remove this note" });
    first.focus();
    fireEvent.click(first);
    const [second] = screen.getAllByRole("button", { name: "Remove this note" });
    expect(document.activeElement).toBe(second);
    fireEvent.click(second);
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "New context" }));
  });

  test("removing a file chip focuses the next chip, then Attach; Attach stays focusable when every file is attached", () => {
    render(<ClientContext clients={[client("a", "Alpha")]} />);
    const attach = screen.getByRole("button", { name: "Attach a file" });
    for (let i = 0; i < 3; i++) fireEvent.click(attach);
    expect(attach.getAttribute("aria-disabled")).toBe("true");
    expect((attach as HTMLButtonElement).disabled).toBe(false);
    const remove = screen.getByRole("button", { name: "Remove board-deck-Q3.pdf" });
    remove.focus();
    fireEvent.click(remove);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Remove pipeline-export.csv" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove pipeline-export.csv" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove headcount.xlsx" }));
    expect(document.activeElement).toBe(attach);
  });

  test("Clear search keeps focus in the search field", () => {
    render(<ClientContext clients={[client("a", "Alpha")]} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Search context" }), { target: { value: "goal" } });
    const clear = screen.getByRole("button", { name: "Clear search" });
    clear.focus();
    fireEvent.click(clear);
    expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Search context" }));
  });

  test("the section tabs are the library tabs; a collapsed report body is inert", () => {
    const { container } = render(<ClientContext clients={[client("a", "Alpha")]} />);
    fireEvent.click(screen.getByRole("tab", { name: "Reports" }));
    expect(screen.getByRole("tab", { name: "Reports" }).getAttribute("aria-selected")).toBe("true");
    const body = container.querySelector(".ui-cx__report-body")!;
    expect(body.hasAttribute("inert")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /Monthly P&L/ }));
    expect(body.hasAttribute("inert")).toBe(false);
  });
});
