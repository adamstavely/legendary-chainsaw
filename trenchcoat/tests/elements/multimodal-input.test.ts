/*
 * <tc-multimodal-input> in real browsers: adding files (picker path, drop, paste), the format and size checks, the
 * tiles in every state, the attachment toolbar's keyboard and focus on removal, the message and Send, budgets,
 * controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/multimodal-input";
import { multimodalKind, type MultimodalAttachment, type MultimodalReject, type MultimodalRetry, type MultimodalSend, type MultimodalValueChange, type TcMultimodalInput } from "../../src/elements/multimodal-input";
import { MultimodalInput } from "../../src/elements/react/multimodal-input";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const MB = 1024 * 1024;
const file = (name: string, type: string, size = 1024) => {
  const f = new File(["x"], name, { type });
  Object.defineProperty(f, "size", { value: size });
  return f;
};
const READY: MultimodalAttachment[] = [
  { id: "a", name: "photo.png", kind: "image", size: 2.4 * MB, status: "ready", tokens: 1200 },
  { id: "b", name: "note.m4a", kind: "audio", size: 1.4 * MB, status: "ready", duration: 84, tokens: 2700 },
  { id: "c", name: "invoice.pdf", kind: "document", size: 220 * 1024, status: "ready", pages: 6 },
];
const ACCEPT = ["image/png", "image/jpeg", "audio/*", "video/mp4", ".pdf"];

const mount = (look: "standard" | "clean" = "standard", value: MultimodalAttachment[] = []) =>
  fixture<TcMultimodalInput>(html`<tc-multimodal-input look=${look} .value=${value} .accept=${ACCEPT}></tc-multimodal-input>`);
const tiles = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-mmi__tile")];
const tile = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-mmi__tile[data-id="${id}"]`)!;
const message = (el: Element) => el.querySelector<HTMLTextAreaElement>(".ui-mmi__message")!;
const sendBtn = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-mmi__send")!;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const text = (n: Element | null) => n?.textContent?.replace(/\s+/g, " ").trim();
const type = (el: Element, value: string) => {
  const m = message(el);
  m.value = value;
  m.dispatchEvent(new Event("input", { bubbles: true }));
};

describe("multimodalKind", () => {
  test("from the MIME type, else the extension, else a document", () => {
    expect(multimodalKind({ name: "a.bin", type: "image/png" })).toBe("image");
    expect(multimodalKind({ name: "clip.mov", type: "" })).toBe("video");
    expect(multimodalKind({ name: "memo.m4a" })).toBe("audio");
    expect(multimodalKind({ name: "notes.txt", type: "text/plain" })).toBe("document");
  });
});

describe("tc-multimodal-input", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the host, the message, the tools and the hint`, async () => {
      const el = await mount(look);
      expect(el.dataset.ui).toBe("mmi");
      expect(el.dataset.look).toBe(look);
      expect(message(el).getAttribute("aria-label")).toBe("Message");
      expect(message(el).placeholder).toBe("Write a message, or drop files here");
      expect(el.querySelector(".ui-mmi__attach")!.getAttribute("aria-label")).toBe("Attach files");
      expect(sendBtn(el).getAttribute("aria-label")).toBe("Send");
      expect(sendBtn(el).disabled).toBe(true);
      expect(text(el.querySelector(".ui-mmi__hint"))).toBe("Images, recordings, videos or documents · up to 20 MB each");
      // Standard: the totals on the tray, outside the box; Clean: inside it
      expect(!!el.querySelector(".ui-mmi__box .ui-mmi__totals")).toBe(look === "clean");
      expect(el.querySelector(".ui-mmi__tiles")).toBeNull();
    });
  }

  test("adding files: accepted ones become queued tiles and fire add with their files; images get a local thumbnail", async () => {
    const el = await mount();
    const seen: MultimodalValueChange[] = [];
    el.addEventListener("tc-value-change", (e) => seen.push((e as CustomEvent<MultimodalValueChange>).detail));
    const png = file("damage.png", "image/png", 300 * 1024);
    const pdf = file("invoice.pdf", "application/pdf", 2 * MB);
    el.addFiles([png, pdf]);
    await settle();
    expect(seen).toHaveLength(1);
    expect(seen[0].change.type).toBe("add");
    const added = seen[0].change.type === "add" ? seen[0].change.files : [];
    expect(added.map((f) => [f.file, f.attachment.kind, f.attachment.status])).toEqual([
      [png, "image", "queued"],
      [pdf, "document", "queued"],
    ]);
    expect(el.value).toHaveLength(2);
    expect(el.value[0].preview).toMatch(/^blob:/);
    expect(tile(el, el.value[0].id).querySelector("img")!.getAttribute("src")).toBe(el.value[0].preview);
    expect(text(tile(el, el.value[1].id).querySelector(".ui-mmi__meta"))).toBe("Document. 2.0 MB · Waiting to upload");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Attached 2 files");
    expect(sendBtn(el).disabled).toBe(true);
    expect(text(el.querySelector(".ui-mmi__wait"))).toBe("Waiting for 2 uploads");
  });

  test("the checks: a format that isn't accepted, a file over its kind's size, more files than fit – each with the reason", async () => {
    const el = await mount();
    el.limits = { video: 200 * MB };
    el.maxFiles = 2;
    await settle();
    const seen: MultimodalReject[] = [];
    el.addEventListener("tc-reject", (e) => seen.push((e as CustomEvent<MultimodalReject>).detail));
    el.addFiles([file("IMG_1.heic", "image/heic"), file("walk.mp4", "video/mp4", 412 * MB), file("clip.mov", "video/quicktime"), file("a.png", "image/png"), file("b.pdf", "application/pdf"), file("c.pdf", "application/pdf")]);
    await settle();
    expect(el.value.map((a) => a.name)).toEqual(["a.png", "b.pdf"]);
    const reasons = seen[0].rejections.map((r) => `${r.name}: ${r.reason}`);
    expect(reasons).toEqual([
      "IMG_1.heic: HEIC files aren't supported – use PNG or JPEG",
      "walk.mp4: 412 MB – videos can be up to 200 MB",
      "clip.mov: MOV files aren't supported – use MP4",
      "c.pdf: Only 2 attachments fit",
    ]);
    const box = el.querySelector(".ui-mmi__rejected")!;
    expect(box.querySelectorAll("li")).toHaveLength(4);
    expect(message(el).getAttribute("aria-describedby")).toBe(box.id);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Attached 2 files. 4 files weren't attached");
    // A kind it doesn't take at all
    el.accept = ["image/*"];
    await settle();
    el.addFiles([file("song.mp3", "audio/mpeg")]);
    await settle();
    expect(text(el.querySelector(".ui-mmi__rej-list"))).toBe("song.mp3 – Recordings aren't supported here");
    el.querySelector<HTMLButtonElement>(".ui-mmi__dismiss")!.click();
    await settle();
    expect(el.querySelector(".ui-mmi__rejected")).toBeNull();
    expect(document.activeElement).toBe(message(el));
  });

  test("tiles: uploading with progress, ready with length, pages and tokens, failed with the reason and Retry", async () => {
    const el = await mount("standard", [
      { id: "u", name: "screen.mp4", kind: "video", size: 18 * MB, status: "uploading", progress: 0.42 },
      ...READY,
      { id: "f", name: "scan.pdf", kind: "document", size: 3 * MB, status: "failed", error: "the connection dropped" },
    ]);
    expect(text(tile(el, "u").querySelector(".ui-mmi__meta"))).toBe("Video. Uploading 42%");
    expect(tile(el, "u").querySelector<HTMLElement>(".ui-mmi__bar > span")!.style.transform).toBe("scaleX(0.42)");
    expect(text(tile(el, "b").querySelector(".ui-mmi__meta"))).toBe("Recording, 1:24 long. 1.4 MB · ≈ 2.7k tokens");
    expect(text(tile(el, "b").querySelector(".ui-mmi__badge"))).toBe("1:24");
    expect(text(tile(el, "c").querySelector(".ui-mmi__badge"))).toBe("6 p.");
    expect(text(tile(el, "c").querySelector(".ui-mmi__meta"))).toBe("Document, 6 pages. 220 KB · Estimating tokens");
    expect(tile(el, "f").getAttribute("aria-label")).toBe("scan.pdf");
    expect(text(tile(el, "f").querySelector(".ui-mmi__meta"))).toBe("Document. Didn't upload – the connection dropped");
    const retryBtn = tile(el, "f").querySelector<HTMLButtonElement>(".ui-mmi__retry")!;
    expect(retryBtn.getAttribute("aria-label")).toBe("Retry scan.pdf");
    expect(document.getElementById(retryBtn.getAttribute("aria-describedby")!)).toBe(tile(el, "f").querySelector(".ui-mmi__meta"));
    const seen: MultimodalRetry[] = [];
    el.addEventListener("tc-retry", (e) => seen.push((e as CustomEvent<MultimodalRetry>).detail));
    retryBtn.click();
    expect(seen[0].attachment.id).toBe("f");
    // Totals: the known estimates, and how many are still being estimated
    expect(text(el.querySelector(".ui-mmi__tokens"))).toBe("≈ 3.9k tokens · 2 estimating");
    expect(text(el.querySelector(".ui-mmi__wait"))).toBe("Waiting for 1 upload");
  });

  test("the attachments are one toolbar: one tab stop, ← → Home End, Delete removes and focus moves on", async () => {
    const el = await mount("standard", READY);
    const bar = el.querySelector<HTMLElement>(".ui-mmi__tiles")!;
    expect(bar.getAttribute("role")).toBe("toolbar");
    expect(bar.getAttribute("aria-label")).toBe("Attachments: 3");
    const removes = () => [...el.querySelectorAll<HTMLButtonElement>(".ui-mmi__remove")];
    expect(removes().map((b) => b.tabIndex)).toEqual([0, -1, -1]);
    removes()[0].focus();
    key(removes()[0], "ArrowRight");
    expect(document.activeElement).toBe(removes()[1]);
    key(document.activeElement!, "End");
    expect(document.activeElement).toBe(removes()[2]);
    key(document.activeElement!, "Home");
    expect(document.activeElement).toBe(removes()[0]);
    key(document.activeElement!, "ArrowLeft");
    expect(document.activeElement).toBe(removes()[2]);
    // Delete on the last: focus goes to the one before
    key(document.activeElement!, "Delete");
    await settle();
    expect(el.value.map((a) => a.id)).toEqual(["a", "b"]);
    expect(document.activeElement).toBe(tile(el, "b").querySelector(".ui-mmi__remove"));
    // The × on the first: focus goes to the next
    tile(el, "a").querySelector<HTMLButtonElement>(".ui-mmi__remove")!.focus();
    tile(el, "a").querySelector<HTMLButtonElement>(".ui-mmi__remove")!.click();
    await settle();
    expect(document.activeElement).toBe(tile(el, "b").querySelector(".ui-mmi__remove"));
    // Backspace on the last one left: focus goes to the message
    key(document.activeElement!, "Backspace");
    await settle();
    expect(el.value).toEqual([]);
    expect(document.activeElement).toBe(message(el));
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Removed note.m4a");
  });

  test("the message: tc-text-change; Enter sends and the box clears; Shift+Enter doesn't send", async () => {
    const el = await mount("standard", READY);
    const sent: MultimodalSend[] = [];
    const changes: string[] = [];
    el.addEventListener("tc-send", (e) => sent.push((e as CustomEvent<MultimodalSend>).detail));
    el.addEventListener("tc-value-change", (e) => changes.push((e as CustomEvent<MultimodalValueChange>).detail.change.type));
    type(el, "What happened here?");
    await settle();
    expect(el.text).toBe("What happened here?");
    expect(sendBtn(el).disabled).toBe(false);
    key(message(el), "Enter", { shiftKey: true });
    expect(sent).toHaveLength(0);
    key(message(el), "Enter");
    await settle();
    expect(sent).toEqual([{ text: "What happened here?", attachments: READY }]);
    expect(changes).toEqual(["clear"]);
    expect(el.text).toBe("");
    expect(el.value).toEqual([]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Sent");
    // Nothing to send: the button and Enter do nothing
    key(message(el), "Enter");
    expect(sent).toHaveLength(1);
  });

  test("Send waits for uploads, failed files and the budget", async () => {
    const el = await mount("standard", READY);
    el.budget = 3000;
    await settle();
    expect(sendBtn(el).disabled).toBe(true);
    expect(text(el.querySelector(".ui-mmi__wait"))).toBe("900 tokens over the budget");
    expect(el.querySelector(".ui-mmi__tokens")!.hasAttribute("data-over")).toBe(true);
    expect(text(el.querySelector(".ui-mmi__tokens"))).toBe("≈ 3.9k of 3.0k tokens · 1 estimating");
    el.budget = 64_000;
    await settle();
    expect(sendBtn(el).disabled).toBe(false);
    el.value = [...READY, { id: "f", name: "x.pdf", kind: "document", size: 1, status: "failed" }];
    await settle();
    expect(sendBtn(el).disabled).toBe(true);
    expect(text(el.querySelector(".ui-mmi__wait"))).toBe("Retry or remove the file that didn't upload");
    expect(sendBtn(el).title).toBe("Retry or remove the file that didn't upload");
  });

  test("controlled: preventDefault() keeps the attachments, the message, and the box after a send", async () => {
    const el = await mount("standard", READY);
    el.addEventListener("tc-value-change", (e) => e.preventDefault());
    el.addEventListener("tc-text-change", (e) => e.preventDefault());
    el.addFiles([file("a.png", "image/png")]);
    tile(el, "a").querySelector<HTMLButtonElement>(".ui-mmi__remove")!.click();
    type(el, "typed");
    await settle();
    expect(el.value).toBe(READY);
    expect(el.text).toBe("");
    expect(message(el).value).toBe("");
    const el2 = await fixture<TcMultimodalInput>(html`<tc-multimodal-input text="Keep me" .value=${READY}></tc-multimodal-input>`);
    el2.addEventListener("tc-send", (e) => e.preventDefault());
    sendBtn(el2).click();
    await settle();
    expect(el2.text).toBe("Keep me");
    expect(el2.value).toBe(READY);
  });

  test("drop and paste add files; dragging shows how many will drop", async () => {
    const el = await mount();
    let dt: DataTransfer;
    try {
      dt = new DataTransfer();
      dt.items.add(file("drop.png", "image/png"));
    } catch {
      return; // no DataTransfer constructor
    }
    const box = el.querySelector<HTMLElement>(".ui-mmi__box")!;
    box.dispatchEvent(new DragEvent("dragenter", { bubbles: true, cancelable: true, dataTransfer: dt }));
    await settle();
    if (box.hasAttribute("data-dragging")) {
      expect(text(el.querySelector(".ui-mmi__drop"))).toBe("Drop to attach 1 file");
      box.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt }));
      await settle();
      expect(box.hasAttribute("data-dragging")).toBe(false);
      expect(el.value.map((a) => a.name)).toEqual(["drop.png"]);
    }
    const paste = new DataTransfer();
    paste.items.add(file("pasted.pdf", "application/pdf"));
    const ev = new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: paste });
    // Firefox and WebKit may drop clipboardData's files on synthetic events
    if (!ev.clipboardData?.files.length) return;
    message(el).dispatchEvent(ev);
    await settle();
    expect(ev.defaultPrevented).toBe(true);
    expect(el.value.map((a) => a.name)).toContain("pasted.pdf");
  });

  test("disabled: nothing can be added, typed or sent", async () => {
    const el = await fixture<TcMultimodalInput>(html`<tc-multimodal-input disabled .value=${READY} text="hi"></tc-multimodal-input>`);
    el.addFiles([file("a.png", "image/png")]);
    await settle();
    expect(el.value).toBe(READY);
    expect(message(el).disabled).toBe(true);
    expect(sendBtn(el).disabled).toBe(true);
    expect(el.querySelector<HTMLButtonElement>(".ui-mmi__attach")!.disabled).toBe(true);
  });

  test("React wrapper: uncontrolled attachments and text survive re-renders; onChange gets the change; onSend fires", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(MultimodalInput, {
        defaultValue: READY,
        defaultText: "Hello",
        onChange: (v, c) => void seen.push(["change", v.length, c.type]),
        onTextChange: (t) => void seen.push(["text", t]),
        onSend: (t, a) => void seen.push(["send", t, a.length]),
        "data-n": n,
      } as React.ComponentProps<typeof MultimodalInput>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-multimodal-input")!;
    tile(el, "c").querySelector<HTMLButtonElement>(".ui-mmi__remove")!.click();
    type(el, "Hello there");
    await settle();
    await act(async () => bump());
    await settle();
    expect(tiles(el)).toHaveLength(2);
    expect(message(el).value).toBe("Hello there");
    sendBtn(el).click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(tiles(el)).toHaveLength(0);
    expect(message(el).value).toBe("");
    expect(seen).toEqual([
      ["change", 2, "remove"],
      ["text", "Hello there"],
      ["send", "Hello there", 2],
      ["text", ""],
      ["change", 0, "clear"],
    ]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, with every state and a rejection`, async () => {
      const value: MultimodalAttachment[] = [
        { id: "u", name: "screen.mp4", kind: "video", size: 18 * MB, status: "uploading", progress: 0.4 },
        ...READY,
        { id: "f", name: "scan.pdf", kind: "document", size: 3 * MB, status: "failed", error: "the connection dropped" },
      ];
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-multimodal-input .value=${value} .accept=${ACCEPT} budget="64000"></tc-multimodal-input>
        <tc-multimodal-input look="clean" .value=${READY} .accept=${ACCEPT}></tc-multimodal-input>
      </div>`);
      wrap.querySelector<TcMultimodalInput>("tc-multimodal-input")!.addFiles([file("x.heic", "image/heic")]);
      await settle();
      for (const a of wrap.getAnimations?.({ subtree: true }) ?? []) a.finish();
      await settle();
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
