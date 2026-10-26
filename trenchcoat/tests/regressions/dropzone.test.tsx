/*
 * H9 dropzone: without onUpload it silently reported simulated uploads as uploaded, and onUpload got no
 * AbortSignal, so removing a row didn't cancel its upload.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/dropzone";
import * as clean from "@components/dropzone-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const advance = async (ms: number, step = 100) => {
  for (let t = 0; t < ms; t += step) {
    await act(async () => {
      vi.advanceTimersByTime(step);
    });
  }
};

const warnings = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls.filter(([m]) => String(m).startsWith("Dropzone:"));
const pdf = (name = "report.pdf") => new File(["%PDF-1.7"], name, { type: "application/pdf" });
const drop = (container: HTMLElement, files: File[]) =>
  container.querySelectorAll<HTMLInputElement>('input[type="file"]').forEach((input) => fireEvent.change(input, { target: { files } }));

/** An upload that never finishes on its own; it rejects when its signal aborts, like fetch does */
const hangingUpload = () => {
  const signals: AbortSignal[] = [];
  const onUpload = vi.fn((_file: File, _progress: (p: number) => void, signal: AbortSignal) => {
    signals.push(signal);
    return new Promise<void>((_, reject) => signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))));
  });
  return { onUpload, signals };
};

for (const [style, ui] of styles) {
  const { Dropzone } = ui;

  describe(`dropzone (${style})`, () => {
    // Runs first: the warning is once per page, so a later test would find it already spent
    test("simulated uploads: silent with demo, otherwise one warning", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const first = render(<Dropzone demo />);
      drop(first.container, [pdf()]);
      await advance(200);
      expect(warnings(warn)).toHaveLength(0);
      first.unmount();

      const { container } = render(
        <>
          <Dropzone />
          <Dropzone />
        </>,
      );
      drop(container, [pdf("a.pdf"), pdf("b.pdf")]);
      await advance(200);
      expect(warnings(warn)).toHaveLength(1);
    });

    test("removing a row aborts its upload, and the aborted upload reports no error", async () => {
      const { onUpload, signals } = hangingUpload();
      const { container } = render(<Dropzone onUpload={onUpload} />);
      drop(container, [pdf()]);
      await advance(200);
      expect(onUpload).toHaveBeenCalledTimes(1);
      expect(signals[0].aborted).toBe(false);
      fireEvent.click(screen.getByRole("button", { name: "Remove report.pdf" }));
      expect(signals[0].aborted).toBe(true);
      await advance(1000);
      expect(screen.queryByText(/Aborted|Upload failed/)).toBeNull();
      expect(screen.queryByRole("button", { name: "Retry report.pdf" })).toBeNull();
    });

    test("unmounting aborts running uploads", async () => {
      const { onUpload, signals } = hangingUpload();
      const { container, unmount } = render(<Dropzone onUpload={onUpload} />);
      drop(container, [pdf()]);
      await advance(200);
      unmount();
      expect(signals[0].aborted).toBe(true);
    });

    test("a failed upload still shows its error and can be retried with a fresh signal", async () => {
      const signals: AbortSignal[] = [];
      const onUpload = vi.fn((_f: File, _p: (p: number) => void, signal: AbortSignal) => {
        signals.push(signal);
        return signals.length === 1 ? Promise.reject(new Error("Server said no")) : Promise.resolve();
      });
      const { container } = render(<Dropzone onUpload={onUpload} />);
      drop(container, [pdf()]);
      await advance(200);
      expect(screen.getByText("Server said no")).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "Retry report.pdf" }));
      await advance(200);
      expect(onUpload).toHaveBeenCalledTimes(2);
      expect(signals[1]).not.toBe(signals[0]);
      expect(screen.queryByText("Server said no")).toBeNull();
    });
  });
}

/* Phase 3 – one API contract: a controllable list, MIME accept entries, form integration, disabled */
for (const [style, ui] of styles) {
  const { Dropzone } = ui;
  const png = (name = "shot.png") => new File(["x"], name, { type: "image/png" });
  const rowNames = (c: HTMLElement) => [...c.querySelectorAll('li[class*="__row"]:not([data-removing]) [class*="__name"]')].map((n) => n.textContent);

  describe(`dropzone (${style}) – contract`, () => {
    test("MIME types and wildcards in accept match by type, extensions still by name", async () => {
      const { container } = render(<Dropzone demo accept={["image/*", "application/pdf"]} />);
      expect(container.textContent).toContain("Images, PDF");
      drop(container, [png(), pdf(), new File(["x"], "notes.txt", { type: "text/plain" })]);
      await advance(100);
      expect(screen.queryByText(".png files aren't supported")).toBeNull();
      expect(screen.queryByText(".pdf files aren't supported")).toBeNull();
      expect(screen.getByText(".txt files aren't supported")).toBeTruthy();
    });

    test("a controlled list can be preloaded and cleared; changes are reported, not applied", async () => {
      const onChange = vi.fn();
      const preset = [{ id: "s1", name: "contract.pdf", size: 4096, status: "done" as const, progress: 1 }];
      const view = render(<Dropzone demo value={preset} onChange={onChange} />);
      expect(rowNames(view.container)).toEqual(["contract.pdf"]);
      drop(view.container, [png()]);
      await advance(100);
      expect(onChange).toHaveBeenLastCalledWith([preset[0], expect.objectContaining({ name: "shot.png", status: "uploading" })]);
      expect(rowNames(view.container)).toEqual(["contract.pdf"]);
      view.rerender(<Dropzone demo value={[]} onChange={onChange} />);
      expect(rowNames(view.container)).toEqual([]);
    });

    test("a parent dropping a row from value aborts its upload", async () => {
      const { onUpload, signals } = hangingUpload();
      let list: unknown[] = [];
      const view = render(<Dropzone onUpload={onUpload} onChange={(l) => (list = l)} />);
      drop(view.container, [pdf()]);
      await advance(200);
      expect(list).toHaveLength(1);
      view.rerender(<Dropzone onUpload={onUpload} value={[]} />);
      expect(signals[0].aborted).toBe(true);
    });

    test("required asks for a file; disabled blocks adding and removing", async () => {
      const view = render(
        <form>
          <Dropzone demo name="files" required />
        </form>,
      );
      const form = view.container.querySelector("form")!;
      expect(form.checkValidity()).toBe(false);
      drop(view.container, [pdf()]);
      await advance(100);
      expect(form.checkValidity()).toBe(true);
      view.rerender(
        <form>
          <Dropzone demo name="files" required disabled />
        </form>,
      );
      expect(view.container.querySelector<HTMLButtonElement>('[class*="__area"]')!.disabled).toBe(true);
      expect(screen.getByRole("button", { name: "Remove report.pdf" }).hasAttribute("disabled")).toBe(true);
    });

    test("ids come from useId, not the clock", async () => {
      let list: { id: string }[] = [];
      const { container } = render(<Dropzone demo onChange={(l) => (list = l)} />);
      drop(container, [pdf("a.pdf"), pdf("b.pdf")]);
      await advance(100);
      expect(new Set(list.map((i) => i.id)).size).toBe(2);
    });
  });
}

/* Phase 4 – progress moves in the DOM; the list (and onChange) changes on status changes and about once a second */
for (const [style, ui] of styles) {
  const { Dropzone } = ui;
  test(`dropzone (${style}): bars move without a commit per tick`, async () => {
    const onChange = vi.fn();
    const { container } = render(<Dropzone demo onChange={onChange} />);
    drop(container, [new File([new Uint8Array(6 * 1024 * 1024)], "big.pdf", { type: "application/pdf" })]);
    await advance(100);
    const bar = () => Number(container.querySelector('[role="progressbar"]')!.getAttribute("aria-valuenow"));
    const calls = onChange.mock.calls.length;
    const first = bar();
    await advance(900, 90);
    expect(bar()).toBeGreaterThan(first);
    // ten ticks, at most one report of the progress
    expect(onChange.mock.calls.length - calls).toBeLessThanOrEqual(1);
    expect(container.querySelector('[data-part="left"]')!.textContent).toMatch(/left|starting|almost/);
    await advance(6000);
    expect(onChange).toHaveBeenLastCalledWith([expect.objectContaining({ status: "done", progress: 1 })]);
  });
}

/* WCAG fix pass: Remove, Retry and Clear dropped focus to <body> (2.4.3); the hidden file input had no name and
   "Uploaded" was an aria-label on a plain span (4.1.2); the live region wasn't a status */
for (const [style, ui] of styles) {
  const { Dropzone } = ui;
  const done = (id: string, name: string) => ({ id, name, size: 4096, status: "done" as const, progress: 1 });

  describe(`dropzone (${style}) – focus and names`, () => {
    test("Remove moves focus to the next row's Remove, the last one to the previous row, then the drop area", async () => {
      const { container } = render(<Dropzone demo defaultValue={[done("a", "a.pdf"), done("b", "b.pdf"), done("c", "c.pdf")]} />);
      const removeOf = (n: string) => screen.getByRole("button", { name: `Remove ${n}` });
      act(() => removeOf("a.pdf").focus());
      fireEvent.click(removeOf("a.pdf"));
      expect(document.activeElement).toBe(removeOf("b.pdf"));
      act(() => removeOf("c.pdf").focus());
      fireEvent.click(removeOf("c.pdf"));
      expect(document.activeElement).toBe(removeOf("b.pdf"));
      fireEvent.click(removeOf("b.pdf"));
      expect(document.activeElement).toBe(container.querySelector('[class*="__area"]'));
      // The folding rows are inert meanwhile
      expect(container.querySelectorAll("li[data-removing][inert]").length).toBe(3);
      await advance(600);
      expect(document.activeElement).toBe(container.querySelector('[class*="__area"]'));
    });

    test("Clear moves focus to the drop area", async () => {
      const { container } = render(<Dropzone demo defaultValue={[done("a", "a.pdf")]} />);
      const clear = screen.getByRole("button", { name: "Clear" });
      act(() => clear.focus());
      fireEvent.click(clear);
      expect(document.activeElement).toBe(container.querySelector('[class*="__area"]'));
    });

    test("Retry moves focus to the row's Remove before it goes away", async () => {
      const onUpload = vi.fn(() => Promise.reject(new Error("Nope")));
      const { container } = render(<Dropzone onUpload={onUpload} />);
      drop(container, [pdf()]);
      await advance(200);
      const retry = screen.getByRole("button", { name: "Retry report.pdf" });
      act(() => retry.focus());
      fireEvent.click(retry);
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Remove report.pdf" }));
    });

    test("names: the file input is labelled, Uploaded is an image, the announcer is a status from mount", () => {
      const { container } = render(<Dropzone demo defaultValue={[done("a", "a.pdf")]} />);
      expect(container.querySelector('input[type="file"][aria-label="Choose files"]')).not.toBeNull();
      expect(screen.getByRole("img", { name: "Uploaded" })).toBeTruthy();
      expect(container.querySelector('[role="status"]')).not.toBeNull();
    });
  });
}
