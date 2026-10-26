/*
 * cited-answer: "Quote copied" showed even when the clipboard refused the write.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as citedStandard from "@components/cited-answer";
import * as citedClean from "@components/cited-answer-clean";

const styles = <S, C>(standard: S, clean: C) =>
  [
    ["standard", standard],
    ["clean", clean],
  ] as const;

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const flush = () => act(async () => {});

const segments = [{ text: "Latency fell by half.", cite: ["s1"] }];
const sources = [{ id: "s1", title: "Latency notes", site: "Notes", quote: "Latency fell by half after the cache change." }];

for (const [style, ui] of styles(citedStandard, citedClean)) {
  const { CitedAnswer } = ui;
  describe(`cited-answer (${style})`, () => {
    test("Quote copied only after the clipboard write resolves", async () => {
      let resolve!: () => void;
      vi.spyOn(navigator.clipboard, "writeText").mockImplementation(() => new Promise<void>((r) => (resolve = r)));
      render(<CitedAnswer segments={segments} sources={sources} defaultOpen="s1" />);
      fireEvent.click(screen.getByRole("button", { name: /Copy quote/ }));
      await flush();
      expect(screen.queryByText("Quote copied")).toBeNull();
      await act(async () => resolve());
      expect(screen.getByRole("status").textContent).toBe("Quote copied");
    });

    test("a failed clipboard write never says Quote copied", async () => {
      vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
      render(<CitedAnswer segments={segments} sources={sources} defaultOpen="s1" />);
      fireEvent.click(screen.getByRole("button", { name: /Copy quote/ }));
      await flush();
      expect(screen.queryByText("Quote copied")).toBeNull();
      expect(screen.queryByRole("button", { name: /^Copied/ })).toBeNull();
      expect(screen.getByRole("status").textContent).toBe("Couldn't copy the quote");
    });

    /* Phase 3: the preview is controllable; defaultOpen stays as an alias */

    const fold = (c: HTMLElement) => c.querySelector(".ui-ca__fold")!;

    test("controlled preview: clicks are reported, not applied; the prop opens it", () => {
      const onPreviewChange = vi.fn();
      const { container, rerender } = render(<CitedAnswer segments={segments} sources={sources} preview={null} onPreviewChange={onPreviewChange} />);
      fireEvent.click(container.querySelector<HTMLElement>('.ui-ca__chip[data-source="s1"]')!);
      expect(onPreviewChange).toHaveBeenCalledWith("s1");
      expect(fold(container).hasAttribute("data-open")).toBe(false);
      rerender(<CitedAnswer segments={segments} sources={sources} preview="s1" onPreviewChange={onPreviewChange} />);
      expect(fold(container).hasAttribute("data-open")).toBe(true);
    });

    test("defaultPreview and the deprecated defaultOpen both open it at first; changes are reported", () => {
      const onPreviewChange = vi.fn();
      const a = render(<CitedAnswer segments={segments} sources={sources} defaultPreview="s1" onPreviewChange={onPreviewChange} />);
      expect(fold(a.container).hasAttribute("data-open")).toBe(true);
      fireEvent.click(a.getByRole("button", { name: "Close source" }));
      expect(onPreviewChange).toHaveBeenCalledWith(null);
      expect(fold(a.container).hasAttribute("data-open")).toBe(false);
      a.unmount();
      const b = render(<CitedAnswer segments={segments} sources={sources} defaultOpen="s1" />);
      expect(fold(b.container).hasAttribute("data-open")).toBe(true);
    });
  });
}

/* WCAG pass: a narrow status region (not the hover caption) from mount (4.1.3); closing returns focus to what opened
   the preview – marker or chip (2.4.3); Clean's "+N" hands focus to the first chip it reveals; dimmed sentences use
   readable muted text (1.4.3); chips and markers are named by what they show (2.5.3) */
const many = [
  { id: "s1", title: "Latency notes", site: "Notes", quote: "Latency fell by half." },
  { id: "s2", title: "Cache design", site: "Design doc", quote: "The cache." },
  { id: "s3", title: "Rollout log", site: "Rollout", quote: "Rolled out." },
];
const multi = [
  { text: "Latency fell by half. ", cite: ["s1", "s2"] },
  { text: "The rollout was quiet.", cite: ["s3"] },
];
for (const [style, ui] of styles(citedStandard, citedClean)) {
  const { CitedAnswer } = ui;
  describe(`cited-answer (${style}) – a11y`, () => {
    test("the status region is there from mount and ignores hover; the caption is not live", () => {
      const { container } = render(<CitedAnswer segments={multi} sources={many} />);
      expect(container.querySelector("[aria-live]")).toBeNull();
      const status = screen.getByRole("status");
      expect(status.textContent).toBe("");
      fireEvent.focus(container.querySelector<HTMLElement>('.ui-ca__marker[data-source="s3"]')!);
      expect(container.querySelector(".ui-ca__caption")!.textContent).toMatch(/Rollout/);
      expect(status.textContent).toBe("");
    });

    test("closing returns focus to the marker that opened the preview, with Esc or Close", () => {
      const { container } = render(<CitedAnswer segments={multi} sources={many} />);
      const marker = container.querySelector<HTMLElement>('.ui-ca__marker[data-source="s2"]')!;
      marker.focus();
      fireEvent.click(marker);
      const close = screen.getByRole("button", { name: "Close source" });
      close.focus();
      fireEvent.click(close);
      expect(document.activeElement).toBe(marker);
      fireEvent.click(marker);
      screen.getByRole("button", { name: "Close source" }).focus();
      fireEvent.keyDown(document.activeElement!, { key: "Escape" });
      expect(document.activeElement).toBe(marker);
    });

    test("a preview closed from outside while focus is in it hands focus back to its opener", async () => {
      const { container, rerender } = render(<CitedAnswer segments={multi} sources={many} preview="s3" />);
      screen.getByRole("button", { name: "Close source" }).focus();
      rerender(<CitedAnswer segments={multi} sources={many} preview={null} />);
      await flush();
      expect(document.activeElement?.getAttribute("data-source")).toBe("s3");
      expect(container.contains(document.activeElement)).toBe(true);
    });

    test("markers and chips are named starting with what they show", () => {
      const { container } = render(<CitedAnswer segments={multi} sources={many} />);
      const marker = container.querySelector<HTMLElement>('.ui-ca__marker[data-source="s1"]')!;
      expect(marker.hasAttribute("aria-label")).toBe(false);
      expect(marker.textContent).toMatch(/^1, source: Notes – Latency notes/);
      for (const chip of container.querySelectorAll(".ui-ca__chips .ui-ca__chip")) expect(chip.hasAttribute("aria-label")).toBe(false);
    });
  });
}

describe("cited-answer (clean) – +N", () => {
  test("pressing +N moves focus to the first chip it revealed", () => {
    const { CitedAnswer } = citedClean;
    // jsdom has no layout: every chip measures 0 wide, the row 0 – so only one chip fits and the rest go into +N
    vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(80);
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(200);
    const { container } = render(<CitedAnswer segments={multi} sources={many} />);
    const more = container.querySelector<HTMLElement>(".ui-ca__chips .ui-ca__more")!;
    expect(more).not.toBeNull();
    const shown = container.querySelectorAll(".ui-ca__chips .ui-ca__chip").length;
    more.focus();
    fireEvent.click(more);
    expect(container.querySelector(".ui-ca__chips .ui-ca__more")).toBeNull();
    expect(document.activeElement).toBe(container.querySelectorAll(".ui-ca__chips .ui-ca__chip")[shown]);
  });
});

test("cited-answer: sentences and chips that step back keep readable text – muted, not disabled or faded", () => {
  render(<citedStandard.CitedAnswer segments={multi} sources={many} />);
  const css = document.querySelector('style[data-href="ui-cited-answer"]')!.textContent!;
  expect(css).toMatch(/\.ui-ca__seg\[data-dim\] \{ color: var\(--tc-text-muted[,)]/);
  // Only the glyph inside a dimmed chip may fade – never the element holding the text
  expect(css).not.toMatch(/\[data-dim\](?::not\([^)]*\))?\s*\{[^}]*opacity/);
});
