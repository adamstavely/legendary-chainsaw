/* reaction-bar: the state was built once from the first `actions`/`reactions` – an action added later crashed and
 * later prop values were ignored (Phase 3) */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import * as standard from "@components/reaction-bar";
import * as clean from "@components/reaction-bar-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

for (const [style, ui] of styles) {
  describe(`reaction-bar ${style}`, () => {
    test("an action added after mount renders and toggles", () => {
      const { rerender } = render(<ui.ReactionBar actions={["like"]} reactions={{ like: { count: 1 }, share: { count: 5 } }} />);
      rerender(<ui.ReactionBar actions={["like", "share"]} reactions={{ like: { count: 1 }, share: { count: 5 } }} />);
      const share = screen.getByRole("button", { name: "Share, 5 shares" });
      fireEvent.click(share);
      expect(share.getAttribute("aria-pressed")).toBe("true");
      expect(share.getAttribute("aria-label")).toBe("Share, 6 shares");
    });

    test("taps apply locally while the prop stays the same, and a new prop value wins", () => {
      const onReact = vi.fn();
      const view = (count: number) => <ui.ReactionBar actions={["like"]} reactions={{ like: { count } }} onReact={onReact} />;
      const { rerender } = render(view(1));
      fireEvent.click(screen.getByRole("button", { name: "Like, 1 like" }));
      expect(onReact).toHaveBeenCalledWith("like", { active: true, count: 2 });
      rerender(view(1)); // a fresh object with the same value keeps the tap
      expect(screen.getByRole("button").getAttribute("aria-label")).toBe("Like, 2 likes");
      rerender(view(10));
      expect(screen.getByRole("button").getAttribute("aria-label")).toBe("Like, 10 likes");
      expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe("false");
    });
    /* WCAG + design pass */
    test("the name contains the count as shown (2.5.3); the exact count is in the title", () => {
      render(<ui.ReactionBar actions={["like"]} reactions={{ like: { count: 1299 } }} />);
      const like = screen.getByRole("button", { name: "Like, 1.3K likes" });
      expect(like.getAttribute("title")).toBe("1,299 likes");
    });

    test("styles: pressed has a non-colour cue and focus uses the ring token", () => {
      render(<ui.ReactionBar actions={["like"]} />);
      const sheet = [...document.querySelectorAll("style")].map((x) => x.textContent).join("\n");
      expect(sheet).toMatch(/\.ui-rb__btn:focus-visible\s*{\s*outline: var\(--tc-focus-outline/);
      expect(sheet).toMatch(/\[aria-pressed="true"\] \.ui-rb__icon svg\s*{\s*stroke-width/);
      expect(sheet).toMatch(/\[aria-pressed="true"\][^{]*{[^}]*box-shadow: inset 0 0 0 1px var\(--tc-border-selected/);
    });
  });
}
