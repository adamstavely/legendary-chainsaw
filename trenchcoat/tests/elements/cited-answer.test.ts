/*
 * <tc-cited-answer> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/cited-answer";
import { TcCitedAnswer, type CitedSegment, type CitedSource } from "../../src/elements/cited-answer";
import { CitedAnswer } from "../../src/elements/react/cited-answer";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const segments: CitedSegment[] = [{ text: "Latency fell by half.", cite: ["s1"] }];
const sources: CitedSource[] = [{ id: "s1", title: "Latency notes", site: "Notes", quote: "Latency fell by half after the cache change." }];
const many: CitedSource[] = [
  { id: "s1", title: "Latency notes", site: "Notes", quote: "Latency fell by half." },
  { id: "s2", title: "Cache design", site: "Design doc", quote: "The cache." },
  { id: "s3", title: "Rollout log", site: "Rollout", quote: "Rolled out." },
];
const multi: CitedSegment[] = [
  { text: "Latency fell by half. ", cite: ["s1", "s2"] },
  { text: "The rollout was quiet.", cite: ["s3"] },
];
const fold = (el: Element) => el.querySelector(".ui-ca__fold")!;
const byText = (el: Element, sel: string, text: RegExp) => [...el.querySelectorAll<HTMLElement>(sel)].find((b) => text.test(b.getAttribute("aria-label") ?? b.textContent!))!;
const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r));
  await settle();
};

for (const look of ["standard", "clean"] as const) {
  describe(`tc-cited-answer (${look})`, () => {
    test("the host is the root and the group; page attributes stay on it", async () => {
      const el = await fixture<TcCitedAnswer>(html`<tc-cited-answer look=${look} class="mine" data-x="1" .segments=${segments} .sources=${sources} pages-read="14"></tc-cited-answer>`);
      expect(el.dataset.ui).toBe("ca");
      expect(el.dataset.look).toBe(look);
      expect(el.classList.contains("mine")).toBe(true);
      expect(el.dataset.x).toBe("1");
      expect(el.getAttribute("role")).toBe("group");
      expect(el.getAttribute("aria-label")).toBe("Answer with sources");
      expect(el.querySelector(".ui-ca__meta")!.textContent).toBe("1 source · 14 pages read");
      const named = await fixture<TcCitedAnswer>(html`<tc-cited-answer aria-label="Answer" .segments=${segments} .sources=${sources}></tc-cited-answer>`);
      expect(named.getAttribute("aria-label")).toBe("Answer");
    });

    test("Quote copied only after the clipboard write resolves", async () => {
      let resolve!: () => void;
      vi.spyOn(navigator.clipboard, "writeText").mockImplementation(() => new Promise<void>((r) => (resolve = r)));
      const el = await fixture<TcCitedAnswer>(html`<tc-cited-answer look=${look} .segments=${segments} .sources=${sources} .preview=${"s1"}></tc-cited-answer>`);
      byText(el, "button", /Copy quote/).click();
      await flush();
      expect(el.querySelector("[role=status]")!.textContent).toBe("");
      resolve();
      await flush();
      expect(el.querySelector("[role=status]")!.textContent).toBe("Quote copied");
      expect(byText(el, "button", /^Copied/)).toBeTruthy();
    });

    test("a failed clipboard write never says Quote copied", async () => {
      vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
      const el = await fixture<TcCitedAnswer>(html`<tc-cited-answer look=${look} .segments=${segments} .sources=${sources} .preview=${"s1"}></tc-cited-answer>`);
      byText(el, "button", /Copy quote/).click();
      await flush();
      expect(byText(el, "button", /^Copied/)).toBeUndefined();
      expect(el.querySelector("[role=status]")!.textContent).toBe("Couldn't copy the quote");
    });

    test("controlled preview: a prevented click is reported, not applied; the property opens it", async () => {
      const el = await fixture<TcCitedAnswer>(html`<tc-cited-answer look=${look} .segments=${segments} .sources=${sources}></tc-cited-answer>`);
      const changes = vi.fn();
      el.addEventListener("tc-preview-change", (e) => {
        e.preventDefault();
        changes((e as CustomEvent).detail.preview);
      });
      el.querySelector<HTMLElement>('.ui-ca__chip[data-source="s1"]')!.click();
      await settle();
      expect(changes).toHaveBeenCalledWith("s1");
      expect(fold(el).hasAttribute("data-open")).toBe(false);
      el.preview = "s1";
      await settle();
      expect(fold(el).hasAttribute("data-open")).toBe(true);
    });

    test("uncontrolled: Close closes it and reports null; an unknown id shows nothing", async () => {
      const el = await fixture<TcCitedAnswer>(html`<tc-cited-answer look=${look} .segments=${segments} .sources=${sources} .preview=${"s1"}></tc-cited-answer>`);
      const changes = vi.fn();
      el.addEventListener("tc-preview-change", (e) => changes((e as CustomEvent).detail.preview));
      expect(fold(el).hasAttribute("data-open")).toBe(true);
      byText(el, "button", /Close source/).click();
      await settle();
      expect(changes).toHaveBeenCalledWith(null);
      expect(fold(el).hasAttribute("data-open")).toBe(false);
      el.preview = "nope";
      await settle();
      expect(fold(el).hasAttribute("data-open")).toBe(false);
    });

    test("pointing at a chip lights the sentences that cite it and says so on the tray", async () => {
      const el = await fixture<TcCitedAnswer>(html`<tc-cited-answer look=${look} .segments=${multi} .sources=${many}></tc-cited-answer>`);
      el.querySelector<HTMLElement>('.ui-ca__chip[data-source="s3"]')!.focus();
      await settle();
      expect(el.dataset.hot).toBe("source");
      const segs = [...el.querySelectorAll(".ui-ca__seg")];
      expect(segs[0].hasAttribute("data-dim")).toBe(true);
      expect(segs[1].hasAttribute("data-hl")).toBe(true);
      expect(el.querySelector(".ui-ca__caption .ui-ca__swap-item:not([data-out])")!.textContent).toBe("Rollout · cited in 1 sentence");
    });

    test("Open source: a link by default; with open-handled it fires tc-open-source and doesn't navigate", async () => {
      const linked = [{ ...sources[0], url: "https://example.com/notes" }];
      const el = await fixture<TcCitedAnswer>(html`<tc-cited-answer look=${look} open-handled .segments=${segments} .sources=${linked} .preview=${"s1"}></tc-cited-answer>`);
      const opened = vi.fn();
      el.addEventListener("tc-open-source", (e) => opened((e as CustomEvent).detail.source.id));
      const link = el.querySelector<HTMLAnchorElement>("a.ui-ca__btn")!;
      expect(link.href).toBe("https://example.com/notes");
      const click = new MouseEvent("click", { bubbles: true, cancelable: true });
      link.dispatchEvent(click);
      expect(click.defaultPrevented).toBe(true);
      expect(opened).toHaveBeenCalledWith("s1");
      // No url and nobody to open it: no button
      const plain = await fixture<TcCitedAnswer>(html`<tc-cited-answer look=${look} .segments=${segments} .sources=${sources} .preview=${"s1"}></tc-cited-answer>`);
      expect(byText(plain, "button, a", /Open source/)).toBeUndefined();
    });

    test("the action fires tc-action", async () => {
      const el = await fixture<TcCitedAnswer>(html`<tc-cited-answer look=${look} action-label="Follow up" .segments=${segments} .sources=${sources}></tc-cited-answer>`);
      const action = vi.fn();
      el.addEventListener("tc-action", action);
      el.querySelector<HTMLButtonElement>(".ui-ca__action")!.click();
      expect(action).toHaveBeenCalledTimes(1);
    });
  });

  /* WCAG pass: a narrow status region (not the hover caption) from the start (4.1.3); closing returns focus to what
     opened the preview (2.4.3); chips and markers are named by what they show (2.5.3) */
  describe(`tc-cited-answer (${look}) – a11y`, () => {
    test("the status region is there from the start and ignores hover; the caption is not live", async () => {
      const el = await fixture<TcCitedAnswer>(html`<tc-cited-answer look=${look} .segments=${multi} .sources=${many}></tc-cited-answer>`);
      expect(el.querySelector("[aria-live]")).toBeNull();
      const status = el.querySelector("[role=status]")!;
      expect(status.textContent).toBe("");
      el.querySelector<HTMLElement>('.ui-ca__marker[data-source="s3"]')!.focus();
      await settle();
      expect(el.querySelector(".ui-ca__caption")!.textContent).toMatch(/Rollout/);
      expect(status.textContent).toBe("");
    });

    test("closing returns focus to the marker that opened the preview, with Esc or Close", async () => {
      const el = await fixture<TcCitedAnswer>(html`<tc-cited-answer look=${look} .segments=${multi} .sources=${many}></tc-cited-answer>`);
      const marker = el.querySelector<HTMLElement>('.ui-ca__marker[data-source="s2"]')!;
      marker.focus();
      marker.click();
      await settle();
      const close = byText(el, "button", /Close source/);
      close.focus();
      close.click();
      await settle();
      expect(document.activeElement).toBe(marker);
      marker.click();
      await settle();
      byText(el, "button", /Close source/).focus();
      document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
      await settle();
      expect(el.preview).toBeNull();
      expect(document.activeElement).toBe(marker);
    });

    test("a preview closed from outside while focus is in it hands focus back to its opener", async () => {
      const el = await fixture<TcCitedAnswer>(html`<tc-cited-answer look=${look} .segments=${multi} .sources=${many} .preview=${"s3"}></tc-cited-answer>`);
      byText(el, "button", /Close source/).focus();
      el.preview = null;
      await flush();
      expect(document.activeElement?.getAttribute("data-source")).toBe("s3");
      expect(el.contains(document.activeElement)).toBe(true);
    });

    test("markers and chips are named starting with what they show", async () => {
      const el = await fixture<TcCitedAnswer>(html`<tc-cited-answer look=${look} .segments=${multi} .sources=${many}></tc-cited-answer>`);
      const marker = el.querySelector<HTMLElement>('.ui-ca__marker[data-source="s1"]')!;
      expect(marker.hasAttribute("aria-label")).toBe(false);
      expect(marker.textContent).toMatch(/^1, source: Notes – Latency notes/);
      for (const chip of el.querySelectorAll(".ui-ca__chips .ui-ca__chip")) expect(chip.hasAttribute("aria-label")).toBe(false);
    });

    test("arrow keys walk along the chips", async () => {
      const el = await fixture<TcCitedAnswer>(html`<tc-cited-answer look=${look} .segments=${multi} .sources=${many}></tc-cited-answer>`);
      const chips = [...el.querySelectorAll<HTMLElement>(".ui-ca__chips .ui-ca__chip")];
      chips[0].focus();
      chips[0].dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true }));
      expect(document.activeElement).toBe(chips[chips.length - 1]);
      chips[2].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true, cancelable: true }));
      expect(document.activeElement).toBe(chips[1]);
    });
  });
}

describe("tc-cited-answer (clean) – +N", () => {
  test("chips that don't fit go into +N; pressing it moves focus to the first chip it revealed", async () => {
    const el = await fixture<TcCitedAnswer>(html`<tc-cited-answer look="clean" style="width: 230px" .segments=${multi} .sources=${many}></tc-cited-answer>`);
    await flush();
    const more = el.querySelector<HTMLElement>(".ui-ca__chips .ui-ca__more")!;
    expect(more).not.toBeNull();
    const shown = el.querySelectorAll(".ui-ca__chips .ui-ca__chip").length;
    expect(shown).toBeLessThan(3);
    more.focus();
    more.click();
    await settle();
    expect(el.querySelector(".ui-ca__chips .ui-ca__more")).toBeNull();
    expect(document.activeElement).toBe(el.querySelectorAll(".ui-ca__chips .ui-ca__chip")[shown]);
  });
});

test("sentences and chips that step back keep readable text – muted, not disabled or faded", () => {
  const css = TcCitedAnswer.css;
  expect(css).toMatch(/\.ui-ca__seg\[data-dim\] \{ color: var\(--tc-text-muted[,)]/);
  // Only the glyph inside a dimmed chip may fade – never the element holding the text
  expect(css).not.toMatch(/\[data-dim\](?::not\([^)]*\))?\s*\{[^}]*opacity/);
});

test("axe: no violations in either look", async () => {
  const wrap = await fixture(html`<div>
    <tc-cited-answer action-label="Follow up" pages-read="3" .segments=${multi} .sources=${many} .preview=${"s1"}></tc-cited-answer>
    <tc-cited-answer look="clean" aria-label="Clean answer" action-label="Follow up" .segments=${multi} .sources=${many} .preview=${"s2"}></tc-cited-answer>
  </div>`);
  for (const a of document.getAnimations()) a.finish();
  const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
});

/* ---------- The source viewer ---------- */

const docSources: CitedSource[] = [
  { id: "a", title: "Annual audit report", site: "Audit office", url: "https://audit.example.org/report", quote: "Three grants were reported late.", document: "report" },
  { id: "b", title: "Annual audit report", site: "Audit office", quote: "the controls  worked as designed", document: "report" },
  { id: "c", title: "Board minutes", site: "Minutes", quote: "Not in the text at all." },
];
const docSegments: CitedSegment[] = [
  { text: "Three grants were late.", cite: ["a"] },
  { text: " Otherwise the controls held.", cite: ["b"] },
  { text: " The board agreed.", cite: ["c"] },
];
const REPORT = "Annual audit report\n\nOverall, the controls worked\nas designed through the year.\n\nThree grants were reported late. Each was under the reporting threshold.";
const viewer = (el: Element) => el.querySelector<HTMLDialogElement>(".ui-ca__viewer");
const viewBtn = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-ca__view");

for (const look of ["standard", "clean"] as const) {
  describe(`tc-cited-answer (${look}) – source viewer`, () => {
    test("View in document shows only when the document is available", async () => {
      const el = await fixture<TcCitedAnswer>(html`<tc-cited-answer look=${look} .segments=${docSegments} .sources=${docSources} .preview=${"a"}></tc-cited-answer>`);
      expect(viewBtn(el)).toBeNull();
      el.documents = { report: REPORT };
      await settle();
      expect(viewBtn(el)!.textContent).toMatch(/View in document/);
      el.preview = "c";
      await flush();
      expect(viewBtn(el)).toBeNull();
      el.loadDocument = async () => "Board minutes";
      await settle();
      expect(viewBtn(el)).not.toBeNull();
    });

    test("opens a modal at the cited passage, steps between passages, and Escape returns focus", async () => {
      const el = await fixture<TcCitedAnswer>(html`<tc-cited-answer look=${look} .segments=${docSegments} .sources=${docSources} .documents=${{ report: REPORT }} .preview=${"a"}></tc-cited-answer>`);
      const opened = vi.fn();
      el.addEventListener("tc-source-open", (e) => opened((e as CustomEvent).detail));
      const btn = viewBtn(el)!;
      btn.focus();
      btn.click();
      await flush();
      expect(opened).toHaveBeenCalledWith({ sourceId: "a" });
      const dlg = viewer(el)!;
      expect(dlg.open).toBe(true);
      expect(dlg.getAttribute("aria-labelledby")).toBeTruthy();
      expect(document.getElementById(dlg.getAttribute("aria-labelledby")!)!.textContent).toBe("Annual audit report");
      expect(document.activeElement).toBe(dlg.querySelector(".ui-ca__vw-doc"));
      // Both passages of the report are marked; the current one is a's, matched across the line break for b
      const marks = [...dlg.querySelectorAll<HTMLElement>(".ui-ca__passage")];
      expect(marks.map((m) => m.dataset.source)).toEqual(["b", "a"]);
      expect(dlg.querySelector(".ui-ca__passage[data-current]")!.getAttribute("data-source")).toBe("a");
      expect(dlg.querySelector(".ui-ca__vw-count")!.textContent).toBe("Passage 2 of 2");
      expect(dlg.querySelector("[role=status]")!.textContent).toBe("Passage 2 of 2 in Annual audit report");
      const [prev, next] = [...dlg.querySelectorAll<HTMLButtonElement>(".ui-ca__vw-step")];
      expect(prev.textContent).toMatch(/Previous passage/);
      expect(next.disabled).toBe(true);
      prev.click();
      await flush();
      expect(dlg.querySelector(".ui-ca__passage[data-current]")!.getAttribute("data-source")).toBe("b");
      expect(dlg.querySelector(".ui-ca__vw-count")!.textContent).toBe("Passage 1 of 2");
      expect(prev.disabled).toBe(true);
      // Escape closes the viewer, not the preview, and focus goes back to View in document
      dlg.querySelector<HTMLElement>(".ui-ca__vw-doc")!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
      dlg.dispatchEvent(new Event("cancel", { cancelable: true }));
      await flush();
      expect(dlg.open).toBe(false);
      expect(el.preview).toBe("a");
      expect(document.activeElement).toBe(btn);
    });

    test("a prevented tc-source-open keeps the viewer closed", async () => {
      const el = await fixture<TcCitedAnswer>(html`<tc-cited-answer look=${look} .segments=${docSegments} .sources=${docSources} .documents=${{ report: REPORT }} .preview=${"a"}></tc-cited-answer>`);
      el.addEventListener("tc-source-open", (e) => e.preventDefault());
      viewBtn(el)!.click();
      await flush();
      expect(viewer(el)?.open ?? false).toBe(false);
    });

    test("loadDocument: loading, then the text; a failure offers Try again; a passage that isn't there says so", async () => {
      let fail = true;
      let release!: () => void;
      const signals: AbortSignal[] = [];
      const load = vi.fn((id: string, signal: AbortSignal) => {
        signals.push(signal);
        return new Promise<string>((resolve, reject) => {
          release = () => (fail ? reject(new Error("offline")) : resolve(`Minutes for ${id}. The board agreed.`));
        });
      });
      const el = await fixture<TcCitedAnswer>(html`<tc-cited-answer look=${look} .segments=${docSegments} .sources=${docSources} .loadDocument=${load} .preview=${"c"}></tc-cited-answer>`);
      viewBtn(el)!.click();
      await flush();
      const dlg = viewer(el)!;
      expect(load).toHaveBeenCalledWith("c", expect.any(AbortSignal));
      expect(dlg.querySelector(".ui-ca__vw-doc")!.getAttribute("aria-busy")).toBe("true");
      expect(dlg.textContent).toMatch(/Loading the document/);
      release();
      await flush();
      expect(dlg.textContent).toMatch(/Couldn't load the document/);
      expect(dlg.querySelector("[role=status]")!.textContent).toBe("Couldn't load the document");
      fail = false;
      [...dlg.querySelectorAll<HTMLButtonElement>("button")].find((b) => /Try again/.test(b.textContent!))!.click();
      await flush();
      release();
      await flush();
      expect(dlg.textContent).toMatch(/Minutes for c/);
      expect(dlg.textContent).toMatch(/The cited passage wasn't found/);
      expect(dlg.querySelector(".ui-ca__vw-count")!.textContent).toBe("Passage not found");
      // Closing aborts a load that's still running
      el.loadDocument = () => new Promise<string>(() => {});
      dlg.querySelector<HTMLButtonElement>(".ui-ca__vw-close")!.click();
      await flush();
      expect(dlg.open).toBe(false);
    });

    test("a source that disappears closes the viewer", async () => {
      const el = await fixture<TcCitedAnswer>(html`<tc-cited-answer look=${look} .segments=${docSegments} .sources=${docSources} .documents=${{ report: REPORT }} .preview=${"a"}></tc-cited-answer>`);
      viewBtn(el)!.click();
      await flush();
      expect(viewer(el)!.open).toBe(true);
      el.sources = docSources.slice(1);
      await flush();
      expect(viewer(el)?.open ?? false).toBe(false);
    });
  });
}

test("React: onSourceOpen hears View in document, and preventDefault keeps the viewer closed", async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const seen: string[] = [];
  let block = false;
  await act(async () =>
    root.render(
      React.createElement(CitedAnswer, {
        segments: docSegments,
        // The test's sources have no icons, so they fit the React shape as they are
        sources: docSources as React.ComponentProps<typeof CitedAnswer>["sources"],
        documents: { report: REPORT },
        defaultPreview: "a",
        onSourceOpen: (id, e) => {
          seen.push(id);
          if (block) e.preventDefault();
        },
      }),
    ),
  );
  await settle();
  const el = host.querySelector("tc-cited-answer")!;
  block = true;
  viewBtn(el)!.click();
  await flush();
  expect(viewer(el)?.open ?? false).toBe(false);
  block = false;
  viewBtn(el)!.click();
  await flush();
  expect(viewer(el)!.open).toBe(true);
  expect(seen).toEqual(["a", "a"]);
  await act(async () => root.unmount());
  host.remove();
});

for (const theme of ["light", "dark"] as const) {
  for (const look of ["standard", "clean"] as const) {
    test(`axe (${theme}, ${look}): the open source viewer has no violations`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-cited-answer look=${look} .segments=${docSegments} .sources=${docSources} .documents=${{ report: REPORT }} .preview=${"a"}></tc-cited-answer>
      </div>`);
      const el = wrap.querySelector("tc-cited-answer")!;
      viewBtn(el)!.click();
      await flush();
      await finish(wrap);
      const result = await axe.run(viewer(el)!, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
}
