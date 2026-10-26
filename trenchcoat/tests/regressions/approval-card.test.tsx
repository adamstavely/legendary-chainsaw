/*
 * approval-card: the countdown expires once per request, even when a controlled card stays pending and hover/focus
 * restart it; an onApprove promise that settles after unmount sets nothing.
 * Semantics kept: the countdown pauses while the card is hovered or focused; Escape anywhere in the card denies.
 * Phase 4: the countdown writes its text into the DOM once a second instead of re-rendering the card every frame.
 */
import { Profiler } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/approval-card";
import * as clean from "@components/approval-card-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const advance = async (ms: number, step = 16) => {
  for (let t = 0; t < ms; t += step) {
    await act(async () => {
      vi.advanceTimersByTime(step);
    });
  }
};

for (const [style, ui] of styles) {
  describe(`approval-card ${style}`, () => {
    test("controlled and left pending after the timeout: onExpire/onDeny fire once, not on every hover or focus", async () => {
      const onExpire = vi.fn();
      const onDeny = vi.fn();
      const props = { title: "Send campaign email", expiresIn: 1, onExpire, onDeny };
      const { rerender } = render(<ui.ApprovalCard {...props} status="pending" />);
      await advance(1500);
      expect(onExpire).toHaveBeenCalledTimes(1);
      expect(onDeny).toHaveBeenCalledWith({ reason: "timeout" });

      const card = screen.getByRole("group");
      for (let i = 0; i < 3; i++) {
        fireEvent.pointerEnter(card);
        fireEvent.pointerLeave(card);
        fireEvent.focus(screen.getByRole("button", { name: "Approve" }));
        fireEvent.blur(screen.getByRole("button", { name: "Approve" }));
        await advance(300);
      }
      expect(onExpire).toHaveBeenCalledTimes(1);
      expect(onDeny).toHaveBeenCalledTimes(1);

      // A fresh request (the parent moves it off pending and back) gets its own countdown
      rerender(<ui.ApprovalCard {...props} status="denied" />);
      rerender(<ui.ApprovalCard {...props} status="pending" />);
      await advance(1500);
      expect(onExpire).toHaveBeenCalledTimes(2);
    });

    test("the countdown counts down without re-rendering the card, and a render keeps the time left", async () => {
      let commits = 0;
      const card = (hint: string) => (
        <Profiler id="card" onRender={() => commits++}>
          <ui.ApprovalCard title="Send campaign email" description={hint} expiresIn={45} />
        </Profiler>
      );
      const { container, rerender } = render(card("a"));
      const expires = () => container.querySelector(".ui-ap__expires")!;
      const sr = () => container.querySelector('[id$="-timer"]')!.textContent;
      await advance(100);
      commits = 0;
      await advance(4000);
      expect(commits).toBe(0);
      expect(expires().textContent).toContain("0:41");
      expect(sr()).toContain("Expires in 41 seconds");
      // A render for something else draws the full time – the time left is put back before it shows
      rerender(card("b"));
      expect(expires().textContent).toContain("0:41");
      await advance(32_000);
      expect(expires().hasAttribute("data-low")).toBe(true);
      expect(expires().textContent).toContain("0:09");
    });

    test("the countdown pauses while hovered and runs out after", async () => {
      const onExpire = vi.fn();
      render(<ui.ApprovalCard title="Send campaign email" expiresIn={1} onExpire={onExpire} />);
      fireEvent.pointerEnter(screen.getByRole("group"));
      await advance(2000);
      expect(onExpire).not.toHaveBeenCalled();
      fireEvent.pointerLeave(screen.getByRole("group"));
      await advance(1500);
      expect(onExpire).toHaveBeenCalledTimes(1);
    });

    test("Escape anywhere in the card denies", () => {
      const onDeny = vi.fn();
      render(<ui.ApprovalCard title="Send campaign email" onDeny={onDeny} />);
      fireEvent.keyDown(screen.getByRole("button", { name: "Approve" }), { key: "Escape" });
      expect(onDeny).toHaveBeenCalledWith({ reason: "user" });
    });

    test("an approval that settles after unmount sets no state", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      let resolve!: () => void;
      const onApprove = vi.fn(() => new Promise<void>((r) => (resolve = r)));
      const { unmount } = render(<ui.ApprovalCard title="Send campaign email" onApprove={onApprove} />);
      fireEvent.click(screen.getByRole("button", { name: "Approve" }));
      expect(onApprove).toHaveBeenCalledTimes(1);
      unmount();
      await act(async () => resolve());
      expect(error).not.toHaveBeenCalled();
    });

    test("a rejected approval clears the spinner, shows an error and can be retried", async () => {
      let attempt = 0;
      const onApprove = vi.fn(() => (attempt++ === 0 ? Promise.reject(new Error("offline")) : Promise.resolve()));
      const onStatusChange = vi.fn();
      render(<ui.ApprovalCard title="Send campaign email" onApprove={onApprove} onStatusChange={onStatusChange} />);
      await act(async () => fireEvent.click(screen.getByRole("button", { name: "Approve" })));
      const group = screen.getByRole("group");
      expect(group.getAttribute("data-busy")).toBeNull();
      expect(group.getAttribute("data-status")).toBe("pending");
      expect(screen.getByRole("alert").textContent).toBe("Couldn't approve. Try again.");
      await act(async () => fireEvent.click(screen.getByRole("button", { name: "Approve" })));
      expect(screen.queryByRole("alert")).toBeNull();
      expect(group.getAttribute("data-status")).toBe("approved");
      expect(onStatusChange).toHaveBeenCalledWith("approved");
    });

    test("controlled status: a decision is reported through onStatusChange, not applied", () => {
      const onStatusChange = vi.fn();
      render(<ui.ApprovalCard title="Send campaign email" status="pending" onStatusChange={onStatusChange} />);
      fireEvent.click(screen.getByRole("button", { name: "Deny" }));
      expect(onStatusChange).toHaveBeenCalledWith("denied");
      expect(screen.getByRole("group").getAttribute("data-status")).toBe("pending");
    });

    test("the decision time is stamped after mount, not during render", async () => {
      render(<ui.ApprovalCard title="Send campaign email" defaultStatus="approved" />);
      await act(async () => {});
      expect(screen.getByRole("group").textContent).toContain("just now");
    });

    test("the IME composition Enter doesn't approve", () => {
      const onApprove = vi.fn();
      render(<ui.ApprovalCard title="Send campaign email" onApprove={onApprove} />);
      fireEvent.keyDown(screen.getByRole("group"), { key: "Enter", metaKey: true, isComposing: true });
      expect(onApprove).not.toHaveBeenCalled();
      fireEvent.keyDown(screen.getByRole("group"), { key: "Enter", metaKey: true });
      expect(onApprove).toHaveBeenCalledTimes(1);
    });
  });
}

/*
 * WCAG + design pass (f7): the time limit can be turned off (2.2.1), pauses while focused, hovered or the tab is
 * hidden, warns once at 20 s through a status region mounted from the start; the countdown uses a one-second timer
 * (no animation frames); Escape inside the preview content belongs to that content; the "Always allow" checkbox
 * stays in the card's focus order.
 */
for (const [style, ui] of styles) {
  describe(`approval-card ${style} – a11y pass`, () => {
    test("Stop timer turns the time limit off, keeps focus in the card and the request never expires", async () => {
      const onExpire = vi.fn();
      const { container } = render(<ui.ApprovalCard title="Send campaign email" expiresIn={2} onExpire={onExpire} />);
      const stop = screen.getByRole("button", { name: "Stop" });
      stop.focus();
      await act(async () => fireEvent.click(stop));
      expect(screen.queryByRole("button", { name: "Stop" })).toBeNull();
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Approve" }));
      expect(container.textContent).toContain("No time limit");
      expect(screen.getByRole("group").getAttribute("aria-describedby") ?? "").not.toMatch(/-timer/);
      (document.activeElement as HTMLElement).blur();
      await advance(4000, 250);
      expect(onExpire).not.toHaveBeenCalled();
    });

    test("allowStopTimer={false} hides the control", () => {
      render(<ui.ApprovalCard title="Send campaign email" expiresIn={30} allowStopTimer={false} />);
      expect(screen.queryByRole("button", { name: "Stop" })).toBeNull();
    });

    test("the countdown pauses while focus is inside the card", async () => {
      const onExpire = vi.fn();
      render(<ui.ApprovalCard title="Send campaign email" expiresIn={1} onExpire={onExpire} />);
      fireEvent.focus(screen.getByRole("button", { name: "Deny" }));
      await advance(2000, 100);
      expect(onExpire).not.toHaveBeenCalled();
    });

    test("the countdown pauses while the tab is hidden", async () => {
      const onExpire = vi.fn();
      render(<ui.ApprovalCard title="Send campaign email" expiresIn={1} onExpire={onExpire} />);
      const spy = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
      await act(async () => {
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await advance(2000, 100);
      expect(onExpire).not.toHaveBeenCalled();
      spy.mockReturnValue("visible");
      await act(async () => {
        document.dispatchEvent(new Event("visibilitychange"));
      });
      await advance(1500, 100);
      expect(onExpire).toHaveBeenCalledTimes(1);
    });

    test("a status region is mounted from the start and announces 20 seconds left once – not every second", async () => {
      const { container } = render(<ui.ApprovalCard title="Send campaign email" expiresIn={25} />);
      const regions = [...container.querySelectorAll('[role="status"]')];
      expect(regions.length).toBe(2);
      const warn = regions[1];
      expect(warn.textContent).toBe("");
      await advance(4000, 250);
      expect(warn.textContent).toBe("");
      await advance(1000, 250);
      expect(warn.textContent).toContain("20 seconds left to decide: Send campaign email");
      const text = warn.textContent;
      await advance(5000, 250);
      expect(warn.textContent).toBe(text);
    });

    test("the countdown runs on a one-second timer, not animation frames", async () => {
      const raf = vi.spyOn(window, "requestAnimationFrame");
      render(<ui.ApprovalCard title="Send campaign email" expiresIn={30} />);
      await advance(3000, 250);
      expect(raf).not.toHaveBeenCalled();
    });

    test("Escape pressed inside the preview content doesn't deny", () => {
      const onDeny = vi.fn();
      render(<ui.ApprovalCard title="Send campaign email" onDeny={onDeny} preview={<input aria-label="Note" />} />);
      fireEvent.keyDown(screen.getByRole("textbox", { name: "Note" }), { key: "Escape" });
      expect(onDeny).not.toHaveBeenCalled();
      fireEvent.keyDown(screen.getByRole("checkbox"), { key: "Escape" });
      expect(onDeny).toHaveBeenCalledWith({ reason: "user" });
    });

    test("deciding moves focus to the resolved row, never to <body>", async () => {
      render(<ui.ApprovalCard title="Send campaign email" />);
      const deny = screen.getByRole("button", { name: "Deny" });
      deny.focus();
      await act(async () => fireEvent.click(deny));
      expect(document.activeElement).not.toBe(document.body);
      expect((document.activeElement as HTMLElement).classList.contains("ui-ap__resolved")).toBe(true);
    });
  });
}
