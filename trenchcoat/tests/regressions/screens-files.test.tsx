/* screens/files: Phase 5 review – the folder layout is controllable */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { FilesScreen } from "@screens/files";

const layout = () => document.querySelector(".ui-as-folders")?.getAttribute("data-view");

describe("files screen", () => {
  test("view: starts at defaultView, toggles and reports", () => {
    const onViewChange = vi.fn();
    render(<FilesScreen defaultView="list" onViewChange={onViewChange} />);
    expect(layout()).toBe("list");
    fireEvent.click(screen.getByRole("radio", { name: /grid/i }));
    expect(onViewChange).toHaveBeenCalledWith("grid");
    expect(layout()).toBe("grid");
  });

  test("view: controlled stays until the parent changes it", () => {
    const onViewChange = vi.fn();
    render(<FilesScreen view="grid" onViewChange={onViewChange} />);
    fireEvent.click(screen.getByRole("radio", { name: /list/i }));
    expect(onViewChange).toHaveBeenCalledWith("list");
    expect(layout()).toBe("grid");
  });
});

/* WCAG + design pass: folder names that may be cut off keep their full text */
describe("files screen – accessibility", () => {
  test("folder cards are buttons named by the folder, with the full name as a title", () => {
    render(<FilesScreen />);
    const card = screen.getAllByRole("button", { name: /Q3 Campaign/ }).find((b) => b.classList.contains("ui-as-folder-card"))!;
    expect(card.querySelector("b")?.getAttribute("title")).toBe("Q3 Campaign");
  });
});
