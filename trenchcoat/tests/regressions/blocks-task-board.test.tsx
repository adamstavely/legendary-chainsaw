/* blocks/task-board: `tasks` was copied into state once – tasks passed later (server data, realtime) never showed */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { TaskBoard, type Task } from "@blocks/task-board";

const task = (id: string, title: string): Task => ({ id, key: id.toUpperCase(), title, status: "todo", priority: 0, labels: [], created: "Oct 1" });
const props = { statuses: [{ id: "todo", label: "Todo", icon: null }], labels: [], people: [] };
const titles = () => [...document.querySelectorAll(".ui-tb__card-title > span:last-child")].map((n) => n.textContent);

describe("blocks/task-board", () => {
  test("controlled tasks follow the prop; an edit is reported, not applied", () => {
    const onTasksChange = vi.fn();
    const { rerender } = render(<TaskBoard {...props} tasks={[task("a", "Alpha")]} onTasksChange={onTasksChange} />);
    rerender(<TaskBoard {...props} tasks={[task("a", "Alpha"), task("b", "Beta")]} onTasksChange={onTasksChange} />);
    expect(titles()).toEqual(["Alpha", "Beta"]);
    fireEvent.click(screen.getByRole("article", { name: "A Alpha" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete task" }));
    expect(onTasksChange).toHaveBeenCalledWith([task("b", "Beta")]);
    expect(titles()).toEqual(["Alpha", "Beta"]);
  });

  test("defaultTasks starts the board; the deprecated onChange still reports every change", () => {
    const onChange = vi.fn();
    render(<TaskBoard {...props} defaultTasks={[task("a", "Alpha")]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("article", { name: "A Alpha" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete task" }));
    expect(onChange).toHaveBeenCalledWith([]);
    expect(titles()).toEqual([]);
  });
});

/* WCAG + design pass: focus never drops to <body>, the label menu has its keyboard pattern, results are announced */
describe("blocks/task-board – keyboard and focus", () => {
  const board = () =>
    render(
      <TaskBoard
        statuses={[{ id: "todo", label: "Todo", icon: null }]}
        labels={[
          { id: "bug", label: "Bug", color: "#ef4444" },
          { id: "docs", label: "Docs", color: "#10b981" },
        ]}
        people={[]}
        defaultTasks={[task("a", "Alpha"), task("b", "Beta")]}
      />,
    );
  const card = (name: string) => screen.getByRole("article", { name });

  test("Esc closes the details and focus returns to the card; opening moves focus into the panel", () => {
    board();
    card("A Alpha").focus();
    fireEvent.keyDown(card("A Alpha"), { key: "Enter" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close details" }));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(document.activeElement).toBe(card("A Alpha"));
  });

  test("deleting a task moves focus to the next card, the last one to the column's + button", () => {
    board();
    fireEvent.click(card("A Alpha"));
    fireEvent.click(screen.getByRole("button", { name: "Delete task" }));
    expect(document.activeElement).toBe(card("B Beta"));
    fireEvent.click(card("B Beta"));
    fireEvent.click(screen.getByRole("button", { name: "Delete task" }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Add task to Todo" }));
  });

  test("quick add: Enter focuses the new card, Esc returns to the + button", () => {
    board();
    fireEvent.click(screen.getByRole("button", { name: "Add task to Todo" }));
    const input = screen.getByRole("textbox", { name: "New task in Todo" });
    fireEvent.change(input, { target: { value: "Gamma" } });
    fireEvent.submit(input.closest("form")!);
    expect((document.activeElement as HTMLElement).getAttribute("aria-label")).toMatch(/Gamma$/);
    fireEvent.click(screen.getByRole("button", { name: "Add task to Todo" }));
    fireEvent.keyDown(screen.getByRole("textbox", { name: "New task in Todo" }), { key: "Escape" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Add task to Todo" }));
  });

  test("label menu: focus moves in, arrows move, Esc returns to the trigger; Clear keeps focus in the menu", () => {
    board();
    const trigger = screen.getByRole("button", { name: "Filter by label" });
    fireEvent.click(trigger);
    const items = screen.getAllByRole("menuitemcheckbox");
    expect(document.activeElement).toBe(items[0]);
    fireEvent.keyDown(items[0], { key: "ArrowDown" });
    expect(document.activeElement).toBe(items[1]);
    fireEvent.keyDown(items[1], { key: "ArrowDown" });
    expect(document.activeElement).toBe(items[0]);
    fireEvent.click(items[0]);
    const clear = screen.getByRole("menuitem", { name: "Clear filter" });
    clear.focus();
    fireEvent.click(clear);
    expect(document.activeElement).toBe(screen.getAllByRole("menuitemcheckbox")[0]);
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Filter by label" }));
  });

  test("the result count is a status region from mount; the favourite toggle keeps its name", () => {
    board();
    expect(screen.getByRole("status").textContent).toBe("2 tasks");
    const star = screen.getByRole("button", { name: "Favorite" });
    fireEvent.click(star);
    expect(star.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Favorite" })).toBe(star);
  });
});
