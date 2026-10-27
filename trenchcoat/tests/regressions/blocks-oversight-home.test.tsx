/* blocks/oversight-home: each role has its own home; the posture line counts services that need attention. */
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { OversightHome, type OversightRole } from "@blocks/oversight-home";

const roles: OversightRole[] = [
  {
    id: "reviewer",
    label: "Reviewer",
    headline: "5 decisions are waiting.",
    focus: { label: "5 decisions", action: "Start" },
    kpis: [],
    services: [
      { id: "a", name: "Queue", state: "normal" },
      { id: "b", name: "Verify", state: "limited" },
    ],
  },
  { id: "platform", label: "Platform", headline: "1 service is down.", kpis: [], services: [{ id: "c", name: "Tests", state: "down" }] },
];
const headline = (c: HTMLElement) => c.querySelector(".ui-ovh__headline")?.textContent;

describe("blocks/oversight-home", () => {
  test("the role's home and its posture", () => {
    const { container } = render(<OversightHome roles={roles} />);
    expect(headline(container)).toBe("5 decisions are waiting.");
    expect(container.querySelector(".ui-ovh__posture-note")?.textContent).toBe("1 of 2 need attention");
  });

  test("controlled role", () => {
    const { container, rerender } = render(<OversightHome roles={roles} role="platform" onRoleChange={() => {}} />);
    expect(headline(container)).toBe("1 service is down.");
    rerender(<OversightHome roles={roles} role="reviewer" onRoleChange={() => {}} />);
    expect(headline(container)).toBe("5 decisions are waiting.");
  });

  test("the focus action", () => {
    const onOpenFocus = vi.fn();
    const { container } = render(<OversightHome roles={roles} onOpenFocus={onOpenFocus} />);
    fireEvent.click(container.querySelector(".ui-ovh__focus tc-button")!);
    expect(onOpenFocus).toHaveBeenCalledWith(roles[0]);
  });
});
