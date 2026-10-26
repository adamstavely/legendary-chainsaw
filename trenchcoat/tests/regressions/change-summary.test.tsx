/* change-summary: WCAG + design pass – good/bad isn't colour only (1.4.1), truncated text keeps its full value in a
 * title, the tray and card use the tray/card pattern tokens */
import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import * as standard from "@components/change-summary";
import * as clean from "@components/change-summary-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const changes = [
  { label: "Active users", change: "Up 6.1% to 18.2K", tone: "good" as const },
  { label: "Churn", change: "Up 0.4 points", tone: "bad" as const, direction: "up" as const },
  { label: "Sessions", change: "No change" },
];

for (const [style, ui] of styles) {
  describe(`change-summary ${style}`, () => {
    test("the tone is said in words, not only by colour", () => {
      render(<ui.ChangeSummary changes={changes} />);
      const dds = screen.getAllByRole("definition");
      expect(dds[0].textContent).toBe("Good change: Up 6.1% to 18.2K");
      expect(dds[1].textContent).toBe("Bad change: Up 0.4 points");
      expect(dds[2].textContent).toBe("No change");
    });

    test("labels and changes that may be cut off carry their full text in a title", () => {
      render(<ui.ChangeSummary changes={changes} />);
      expect(screen.getByText("Active users").getAttribute("title")).toBe("Active users");
      expect(screen.getByText("Up 6.1% to 18.2K").getAttribute("title")).toBe("Up 6.1% to 18.2K");
    });

    test("styles: bad gets an outlined mark; the tray and card use the pattern tokens", () => {
      render(<ui.ChangeSummary changes={changes} />);
      const sheet = [...document.querySelectorAll("style")].map((x) => x.textContent).join("\n");
      expect(sheet).toMatch(/\.ui-cs__trend\[data-tone="bad"\] { box-shadow: inset 0 0 0 1px currentColor/);
      expect(sheet).toMatch(/padding: var\(--tc-tray-inset[,)]/);
      expect(sheet).toMatch(/border-radius: var\(--tc-card-radius[,)]/);
    });
  });
}
