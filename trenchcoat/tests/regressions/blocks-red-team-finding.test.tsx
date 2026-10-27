/* blocks/red-team-finding: the findings are a listbox – arrows pick and the detail follows; the pick is controllable. */
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { RedTeamFinding, type Finding } from "@blocks/red-team-finding";

const finding = (id: string, title: string): Finding => ({
  id,
  title,
  severity: "critical",
  status: "open",
  opened: "1h ago",
  summary: `${title} happened.`,
  invariants: [{ id: "i", rule: `${id}.must-hold` }],
  scenario: { id: `scn-${id}`, description: "A scenario." },
});
const findings = [finding("a", "First"), finding("b", "Second"), finding("c", "Third")];
const title = (c: HTMLElement) => c.querySelector(".ui-rtf__title")?.textContent;

describe("blocks/red-team-finding", () => {
  test("arrow keys move the pick and the detail follows", () => {
    const { container } = render(<RedTeamFinding findings={findings} />);
    expect(title(container)).toBe("First");
    const list = container.querySelector('[role="listbox"]')!;
    fireEvent.keyDown(list, { key: "ArrowDown" });
    expect(title(container)).toBe("Second");
    fireEvent.keyDown(list, { key: "End" });
    expect(title(container)).toBe("Third");
    expect(document.activeElement?.getAttribute("aria-selected")).toBe("true");
  });

  test("controlled: a click reports the id and waits for the parent", () => {
    const onFindingChange = vi.fn();
    const { container } = render(<RedTeamFinding findings={findings} finding="a" onFindingChange={onFindingChange} />);
    fireEvent.click(container.querySelectorAll('[role="option"]')[2]);
    expect(onFindingChange).toHaveBeenCalledWith("c");
    expect(title(container)).toBe("First");
  });

  test("failed invariants and the empty states", () => {
    const { container } = render(<RedTeamFinding findings={[{ ...findings[0], invariants: [], evidence: [] }]} />);
    expect(container.textContent).toContain("Every invariant held.");
    expect(container.textContent).toContain("No evidence attached.");
  });
});
