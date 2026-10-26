/*
 * <tc-dropzone> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/dropzone";
import type { TcDropzone, UploadItem } from "../../src/elements/dropzone";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

const pdf = (name = "report.pdf") => new File(["%PDF-1.7"], name, { type: "application/pdf" });
const png = (name = "shot.png") => new File(["x"], name, { type: "image/png" });
const drop = async (root: Element, files: File[]) => {
  const input = root.querySelector<HTMLInputElement>('input[type="file"]')!;
  const dt = new DataTransfer();
  files.forEach((f) => dt.items.add(f));
  input.files = dt.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  await settle();
};
const flushPromises = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
  await settle();
};
const rowNames = (el: Element) => [...el.querySelectorAll("li.ui-dz__row:not([data-removing]) .ui-dz__name")].map((n) => n.textContent);
const button = (el: Element, name: string) => [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent!.trim()) === name)!;
const area = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-dz__area")!;
const done = (id: string, name: string): UploadItem => ({ id, name, size: 4096, status: "done", progress: 1 });

/** An upload that never finishes on its own; it rejects when its signal aborts, like fetch does */
const hangingUpload = () => {
  const signals: AbortSignal[] = [];
  const onUpload = vi.fn((_file: File, _progress: (p: number) => void, signal: AbortSignal) => {
    signals.push(signal);
    return new Promise<void>((_, reject) => signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))));
  });
  return { onUpload, signals };
};

describe("tc-dropzone", () => {
  // Runs first: the warning is once per page, so a later test would find it already spent
  test("simulated uploads: silent with demo, otherwise one warning", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const first = await fixture<TcDropzone>(html`<tc-dropzone demo></tc-dropzone>`);
    await drop(first, [pdf()]);
    expect(warn.mock.calls.filter(([m]) => String(m).startsWith("Dropzone:"))).toHaveLength(0);
    cleanup();
    const wrap = await fixture(html`<div><tc-dropzone></tc-dropzone><tc-dropzone></tc-dropzone></div>`);
    await drop(wrap.children[0], [pdf("a.pdf")]);
    await drop(wrap.children[1], [pdf("b.pdf")]);
    expect(warn.mock.calls.filter(([m]) => String(m).startsWith("Dropzone:"))).toHaveLength(1);
  });

  test("the host is the root; the hint says the types and size", async () => {
    const el = await fixture<TcDropzone>(html`<tc-dropzone demo .accept=${["image/*", "application/pdf"]}></tc-dropzone>`);
    expect(el.dataset.ui).toBe("dz");
    expect(el.dataset.look).toBe("standard");
    expect(el.querySelector(".ui-dz__hint")!.textContent).toBe("Images, PDF · up to 25 MB each");
    expect(el.querySelector(".ui-dz__foot")!.textContent!.trim()).toBe("No files yet");
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: removing a row aborts its upload, and the aborted upload reports no error`, async () => {
      const { onUpload, signals } = hangingUpload();
      const el = await fixture<TcDropzone>(html`<tc-dropzone look=${look} .onUpload=${onUpload}></tc-dropzone>`);
      await drop(el, [pdf()]);
      await flushPromises();
      expect(onUpload).toHaveBeenCalledTimes(1);
      expect(signals[0].aborted).toBe(false);
      button(el, "Remove report.pdf").click();
      expect(signals[0].aborted).toBe(true);
      await flushPromises();
      expect(el.textContent).not.toMatch(/Aborted|Upload failed/);
      expect(button(el, "Retry report.pdf")).toBeUndefined();
    });

    test(`${look}: a failed upload shows its error and can be retried with a fresh signal`, async () => {
      const signals: AbortSignal[] = [];
      const onUpload = vi.fn((_f: File, _p: (p: number) => void, signal: AbortSignal) => {
        signals.push(signal);
        return signals.length === 1 ? Promise.reject(new Error("Server said no")) : Promise.resolve();
      });
      const el = await fixture<TcDropzone>(html`<tc-dropzone look=${look} .onUpload=${onUpload}></tc-dropzone>`);
      await drop(el, [pdf()]);
      await flushPromises();
      expect(el.querySelector(".ui-dz__error")!.textContent).toBe("Server said no");
      expect(el.querySelector('[role="status"]')!.textContent).toBe("report.pdf: Server said no");
      button(el, "Retry report.pdf").click();
      await flushPromises();
      expect(onUpload).toHaveBeenCalledTimes(2);
      expect(signals[1]).not.toBe(signals[0]);
      expect(el.querySelector(".ui-dz__error")).toBeNull();
      expect(el.querySelector(".ui-dz__done")!.getAttribute("aria-label")).toBe("Uploaded");
    });
  }

  test("removing the element aborts running uploads", async () => {
    const { onUpload, signals } = hangingUpload();
    const el = await fixture<TcDropzone>(html`<tc-dropzone .onUpload=${onUpload}></tc-dropzone>`);
    await drop(el, [pdf()]);
    await flushPromises();
    el.remove();
    expect(signals[0].aborted).toBe(true);
  });

  test("progress reported by onUpload moves the bar and the sent part", async () => {
    let report!: (p: number) => void;
    const el = await fixture<TcDropzone>(html`<tc-dropzone .onUpload=${(_f: File, p: (n: number) => void) => ((report = p), new Promise<void>(() => {}))}></tc-dropzone>`);
    await drop(el, [new File([new Uint8Array(2 * 1024 * 1024)], "big.pdf", { type: "application/pdf" })]);
    await flushPromises();
    report(0.5);
    await new Promise((r) => requestAnimationFrame(r));
    expect(el.querySelector('[role="progressbar"]')!.getAttribute("aria-valuenow")).toBe("50");
    expect(el.querySelector('[data-part="sent"]')!.textContent).toBe("1.0 of 2.0 MB");
    expect(el.querySelector('[data-part="total"]')!.textContent).toBe("1.0 of 2.0 MB");
  });

  test("MIME types and wildcards in accept match by type, extensions still by name", async () => {
    const el = await fixture<TcDropzone>(html`<tc-dropzone demo .accept=${["image/*", "application/pdf"]}></tc-dropzone>`);
    await drop(el, [png(), pdf(), new File(["x"], "notes.txt", { type: "text/plain" })]);
    const errors = [...el.querySelectorAll(".ui-dz__error")].map((e) => e.textContent);
    expect(errors).toEqual([".txt files aren't supported"]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("notes.txt: .txt files aren't supported");
    // A rejected file never gets a bar
    expect(el.querySelectorAll('[role="progressbar"]').length).toBe(2);
  });

  test("too large files say so", async () => {
    const el = await fixture<TcDropzone>(html`<tc-dropzone demo max-size="4"></tc-dropzone>`);
    await drop(el, [pdf()]);
    expect(el.querySelector(".ui-dz__error")!.textContent).toBe("Too large – max 1 KB");
  });

  test("a controlled list can be preloaded and cleared; changes are reported, not applied", async () => {
    const seen: UploadItem[][] = [];
    const preset = [done("s1", "contract.pdf")];
    const el = await fixture<TcDropzone>(html`<tc-dropzone demo .value=${preset} @tc-value-change=${(e: CustomEvent<{ value: UploadItem[] }>) => (e.preventDefault(), seen.push(e.detail.value))}></tc-dropzone>`);
    expect(rowNames(el)).toEqual(["contract.pdf"]);
    await drop(el, [png()]);
    expect(seen.at(-1)).toEqual([preset[0], expect.objectContaining({ name: "shot.png", status: "uploading" })]);
    expect(rowNames(el)).toEqual(["contract.pdf"]);
    el.value = [];
    await settle();
    expect(rowNames(el)).toEqual([]);
  });

  test("a parent dropping a row from value aborts its upload", async () => {
    const { onUpload, signals } = hangingUpload();
    const el = await fixture<TcDropzone>(html`<tc-dropzone .onUpload=${onUpload}></tc-dropzone>`);
    await drop(el, [pdf()]);
    await flushPromises();
    expect(el.value).toHaveLength(1);
    el.value = [];
    await settle();
    expect(signals[0].aborted).toBe(true);
  });

  test("forms: required asks for a file, the files are submitted under name, reset brings back the first list", async () => {
    const form = await fixture<HTMLFormElement>(html`<form><tc-dropzone demo name="files" required></tc-dropzone></form>`);
    const el = form.querySelector("tc-dropzone")!;
    expect(form.checkValidity()).toBe(false);
    await drop(el, [pdf(), new File(["x"], "bad.exe")]);
    expect(form.checkValidity()).toBe(true);
    const files = new FormData(form).getAll("files") as File[];
    expect(files.map((f) => f.name)).toEqual(["report.pdf", "bad.exe"]);
    form.reset();
    await settle();
    expect(rowNames(el)).toEqual([]);
    expect(form.checkValidity()).toBe(false);
  });

  test("a name set as a property (as React does) reaches the form", async () => {
    const form = await fixture<HTMLFormElement>(html`<form><tc-dropzone demo .name=${"files"}></tc-dropzone></form>`);
    await drop(form.querySelector("tc-dropzone")!, [pdf()]);
    expect((new FormData(form).getAll("files") as File[]).map((f) => f.name)).toEqual(["report.pdf"]);
  });

  test("disabled blocks adding and removing; a disabled fieldset disables it", async () => {
    const form = await fixture<HTMLFormElement>(html`<form><fieldset><tc-dropzone demo .value=${[done("a", "report.pdf")]}></tc-dropzone></fieldset></form>`);
    const el = form.querySelector("tc-dropzone")!;
    el.disabled = true;
    await settle();
    expect(area(el).disabled).toBe(true);
    expect(button(el, "Remove report.pdf").disabled).toBe(true);
    expect(el.hasAttribute("data-disabled")).toBe(true);
    el.disabled = false;
    await settle();
    expect(area(el).disabled).toBe(false);
    form.querySelector("fieldset")!.disabled = true;
    await settle();
    expect(area(el).disabled).toBe(true);
  });

  test("ids are unique, not from the clock", async () => {
    let list: UploadItem[] = [];
    const el = await fixture<TcDropzone>(html`<tc-dropzone demo @tc-value-change=${(e: CustomEvent<{ value: UploadItem[] }>) => (list = e.detail.value)}></tc-dropzone>`);
    await drop(el, [pdf("a.pdf"), pdf("b.pdf")]);
    expect(new Set(list.map((i) => i.id)).size).toBe(2);
  });

  test("simulated bars move without a change event per tick, and finish", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "performance", "Date"] });
    const changes: UploadItem[][] = [];
    const el = await fixture<TcDropzone>(html`<tc-dropzone demo @tc-value-change=${(e: CustomEvent<{ value: UploadItem[] }>) => changes.push(e.detail.value)}></tc-dropzone>`);
    await drop(el, [new File([new Uint8Array(6 * 1024 * 1024)], "big.pdf", { type: "application/pdf" })]);
    const bar = () => Number(el.querySelector('[role="progressbar"]')!.getAttribute("aria-valuenow"));
    vi.advanceTimersByTime(100);
    await settle();
    const calls = changes.length;
    const first = bar();
    for (let t = 0; t < 900; t += 90) vi.advanceTimersByTime(90);
    await settle();
    expect(bar()).toBeGreaterThan(first);
    // ten ticks, at most one report of the progress
    expect(changes.length - calls).toBeLessThanOrEqual(1);
    expect(el.querySelector('[data-part="left"]')!.textContent).toMatch(/left|starting|almost/);
    for (let t = 0; t < 6000; t += 90) {
      vi.advanceTimersByTime(90);
      await el.updateComplete;
    }
    expect(changes.at(-1)).toEqual([expect.objectContaining({ status: "done", progress: 1 })]);
  });

  test("dragging files over says how many will drop", async () => {
    const el = await fixture<TcDropzone>(html`<tc-dropzone demo></tc-dropzone>`);
    const dt = new DataTransfer();
    dt.items.add(pdf("a.pdf"));
    dt.items.add(pdf("b.pdf"));
    area(el).dispatchEvent(new DragEvent("dragenter", { bubbles: true, cancelable: true, dataTransfer: dt }));
    await settle();
    expect(el.querySelector(".ui-dz__title")!.textContent).toBe("Release to upload 2 files");
    expect(area(el).hasAttribute("data-dragging")).toBe(true);
    area(el).dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt }));
    await settle();
    expect(rowNames(el)).toEqual(["a.pdf", "b.pdf"]);
    expect(area(el).hasAttribute("data-dragging")).toBe(false);
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: Remove moves focus to the next row's Remove, the last one to the previous row, then the drop area`, async () => {
      const el = await fixture<TcDropzone>(html`<tc-dropzone look=${look} demo .value=${[done("a", "a.pdf"), done("b", "b.pdf"), done("c", "c.pdf")]}></tc-dropzone>`);
      const removeOf = (n: string) => button(el, `Remove ${n}`);
      removeOf("a.pdf").focus();
      removeOf("a.pdf").click();
      expect(document.activeElement).toBe(removeOf("b.pdf"));
      await settle();
      removeOf("c.pdf").focus();
      removeOf("c.pdf").click();
      expect(document.activeElement).toBe(removeOf("b.pdf"));
      await settle();
      removeOf("b.pdf").click();
      expect(document.activeElement).toBe(area(el));
      await settle();
      // The folding rows are inert meanwhile
      expect(el.querySelectorAll("li[data-removing][inert]").length).toBe(3);
      await new Promise((r) => setTimeout(r, 600));
      await settle();
      expect(el.querySelectorAll("li").length).toBe(0);
      expect(document.activeElement).toBe(area(el));
    });

    test(`${look}: Clear moves focus to the drop area`, async () => {
      const el = await fixture<TcDropzone>(html`<tc-dropzone look=${look} demo .value=${[done("a", "a.pdf")]}></tc-dropzone>`);
      expect(el.querySelector(".ui-dz__summary-done")!.textContent).toBe("1 file uploaded");
      const clear = button(el, "Clear");
      clear.focus();
      clear.click();
      expect(document.activeElement).toBe(area(el));
    });

    test(`${look}: Retry moves focus to the row's Remove before it goes away`, async () => {
      const onUpload = vi.fn(() => Promise.reject(new Error("Nope")));
      const el = await fixture<TcDropzone>(html`<tc-dropzone look=${look} .onUpload=${onUpload}></tc-dropzone>`);
      await drop(el, [pdf()]);
      await flushPromises();
      const retry = button(el, "Retry report.pdf");
      retry.focus();
      retry.click();
      expect(document.activeElement).toBe(button(el, "Remove report.pdf"));
    });
  }

  test("names: the file input is labelled, Uploaded is an image, the announcer is a status from the start", async () => {
    const el = await fixture<TcDropzone>(html`<tc-dropzone demo .value=${[done("a", "a.pdf")]}></tc-dropzone>`);
    expect(el.querySelector('input[type="file"][aria-label="Choose files"]')).not.toBeNull();
    expect(el.querySelector('[role="img"][aria-label="Uploaded"]')).not.toBeNull();
    expect(el.querySelector('[role="status"]')).not.toBeNull();
    expect(area(el).getAttribute("aria-describedby")).toBe(el.querySelector(".ui-dz__hint")!.id);
  });

  test("axe: no violations in either look", async () => {
    const value: UploadItem[] = [done("a", "a.pdf"), { id: "b", name: "b.exe", size: 10, status: "error", progress: 0, error: ".exe files aren't supported" }];
    const wrap = await fixture(html`<div>
      <tc-dropzone demo .value=${value}></tc-dropzone>
      <tc-dropzone look="clean" demo .value=${value}></tc-dropzone>
    </div>`);
    await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {})));
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
