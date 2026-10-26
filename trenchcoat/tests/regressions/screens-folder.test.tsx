/* screens/folder: Phase 5 review – file cards were keyed by name + index, so every upload rebuilt them all */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { FolderScreen } from "@screens/folder";

afterEach(() => vi.restoreAllMocks());

const upload = (...names: string[]) => {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
  fireEvent.change(input, { target: { files: names.map((n) => new File(["x"], n)) } });
};
const card = (name: string) => screen.getByText(name).closest(".ui-as-rise");

describe("folder screen", () => {
  test("uploading keeps the cards already there", () => {
    render(<FolderScreen folder="Research" />);
    const before = card("Market-Study");
    upload("Notes.docx");
    expect(screen.getByText("Notes")).toBeTruthy();
    expect(card("Market-Study")).toBe(before);
  });

  test("files with the same name get cards of their own", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<FolderScreen folder="Research" />);
    upload("Notes.docx");
    upload("Notes.docx");
    expect(screen.getAllByText("Notes")).toHaveLength(2);
    expect(error.mock.calls.flat().join(" ")).not.toMatch(/same key/);
  });

  test("uploads start over in another folder", () => {
    const { rerender } = render(<FolderScreen folder="Research" />);
    upload("Notes.docx");
    rerender(<FolderScreen folder="Hiring" />);
    expect(screen.queryByText("Notes")).toBeNull();
  });
});

/* WCAG + design pass: the More menu says it's a menu and whether it's open */
describe("folder screen – accessibility", () => {
  test("More reports its menu and open state", () => {
    render(<FolderScreen folder="Research" />);
    const more = screen.getByRole("button", { name: "More" });
    expect(more.getAttribute("aria-haspopup")).toBe("menu");
    expect(more.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(more);
    expect(more.getAttribute("aria-expanded")).toBe("true");
  });
});
