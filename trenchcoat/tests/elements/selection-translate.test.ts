/*
 * <tc-selection-translate> in real browsers: the host and both looks, the toolbar by pointer and by keyboard, the card
 * (loading, done, error and retry), tc-translate answered with respondWith or left to `resolveTranslate`, the cache, the
 * target select, Copy, Replace in place, Show original, focus, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/selection-translate";
import type { SelectionTranslateRequest, SelectionTranslateTextChange, SelectionTranslation, TcSelectionTranslate } from "../../src/elements/selection-translate";
import { rangeOf, textOf } from "../../src/elements/internal/selection";
import { SelectionTranslate } from "../../src/elements/react/selection-translate";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  document.getSelection()?.removeAllRanges();
  cleanup();
});

const TEXT = "Le colis est arrivé ce matin. Il manquait le câble d'alimentation.\n\nPouvez-vous nous en envoyer un ?";
const SENTENCE = "Il manquait le câble d'alimentation.";
const at = (phrase: string, text = TEXT) => ({ start: text.indexOf(phrase), end: text.indexOf(phrase) + phrase.length });
const looks = ["standard", "clean"] as const;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const frames = (n = 6) => new Promise<void>((r) => { const step = (k: number) => (k ? requestAnimationFrame(() => step(k - 1)) : r()); step(n); });
const plain = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const mac = /mac/i.test(navigator.userAgent);
const WORD = mac ? "Alt" : "Control";

const DICT: Record<string, Record<string, string>> = {
  en: { [SENTENCE]: "The power cable was missing.", "Le colis": "The parcel" },
  es: { [SENTENCE]: "Faltaba el cable de alimentación." },
};
/** A resolver that answers from DICT a tick later (or once `gate` settles), and records its calls */
const resolver = (calls: string[], fail = false, gate?: Promise<unknown>) => (text: string, target: string, signal: AbortSignal) =>
  new Promise<SelectionTranslation>((resolve, reject) => {
    calls.push(`${target}:${text}`);
    const answer = () => (fail ? reject(new Error("Service unavailable")) : resolve({ text: DICT[target]?.[text] ?? `[${target}] ${text}`, source: "fr" }));
    let t = 0;
    void (gate ?? Promise.resolve()).then(() => {
      if (!signal.aborted) t = window.setTimeout(answer, 80);
    });
    signal.addEventListener("abort", () => clearTimeout(t));
  });

const make = (o: { look?: string; editable?: boolean; calls?: string[]; fail?: boolean; noResolver?: boolean; gate?: Promise<unknown> } = {}) =>
  fixture<TcSelectionTranslate>(
    html`<tc-selection-translate style="width: 360px" lang="fr" look=${o.look ?? "standard"} ?editable=${!!o.editable} .text=${TEXT} .resolveTranslate=${o.noResolver ? undefined : resolver(o.calls ?? [], o.fail, o.gate)}></tc-selection-translate>`,
  );
const root = (el: Element) => el.querySelector<HTMLElement>(".ui-strn__text")!;
const pop = (el: Element) => el.querySelector<HTMLElement>(".ui-strn__pop");
const card = (el: Element) => el.querySelector<HTMLElement>(".ui-strn__card");
const btn = (el: Element, kind: string) => card(el)?.querySelector<HTMLButtonElement>(`.ui-strn__btn[data-kind="${kind}"]`) ?? null;
const status = (el: Element) => plain(el.querySelector('[role="status"]')!.textContent);
const pick = async (el: TcSelectionTranslate, start: number, end: number) => {
  root(el).focus();
  const r = rangeOf(root(el), start, end);
  document.getSelection()!.setBaseAndExtent(r.startContainer, r.startOffset, r.endContainer, r.endOffset);
  await frames();
  await el.updateComplete;
  await frames(2);
};
/** Selects a phrase and chooses Translate */
const translate = async (el: TcSelectionTranslate, phrase = SENTENCE) => {
  await pick(el, at(phrase, el.text).start, at(phrase, el.text).end);
  pop(el)!.querySelector<HTMLButtonElement>(".ui-strn__tool")!.click();
  await el.updateComplete;
  await frames(2);
};
/** Waits until the translation (or its failure) is in: the card stops being busy */
const answered = async (el: TcSelectionTranslate) => {
  await expect.poll(() => card(el)?.getAttribute("aria-busy"), { timeout: 3000 }).toBe("false");
  await el.updateComplete;
  await frames(2);
};

describe("tc-selection-translate", () => {
  for (const look of looks) {
    test(`${look}: the host is the text, with no card around it`, async () => {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("strn");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head")).toBeNull();
      expect(textOf(root(el))).toBe(TEXT);
      expect(root(el).getAttribute("role")).toBe("document");
      expect(root(el).getAttribute("aria-label")).toBe("Text");
    });
  }

  test("a selection opens a toolbar with Translate; Translate opens the card, loading, then the translation", async () => {
    const calls: string[] = [];
    // The answer waits until the loading state has been checked, however slow the browser is
    let release!: () => void;
    const el = await make({ calls, gate: new Promise<void>((r) => (release = r)) });
    await pick(el, at(SENTENCE).start, at(SENTENCE).end);
    const bar = pop(el)!;
    expect(bar.getAttribute("role")).toBe("toolbar");
    expect(plain(bar.textContent)).toBe("Translate");
    bar.querySelector<HTMLButtonElement>(".ui-strn__tool")!.click();
    await el.updateComplete;
    await frames(2);
    expect(pop(el)).toBeNull();
    const c = card(el)!;
    expect(c.getAttribute("role")).toBe("dialog");
    expect(document.getElementById(c.getAttribute("aria-labelledby")!)!.textContent).toBe("Translation");
    expect(c.getAttribute("aria-busy")).toBe("true");
    expect(plain(c.querySelector(".ui-strn__from")!.textContent)).toBe("Detecting…");
    expect(status(el)).toBe("Translating to English…");
    // Focus moves into the card, onto the language select
    expect(document.activeElement).toBe(c.querySelector(".ui-strn__select"));
    // The passage is marked while the card is open
    expect(plain(el.querySelector(".ui-strn__mark")!.textContent)).toBe(`Translating: ${SENTENCE}`);
    expect(textOf(root(el))).toBe(TEXT);
    release();
    await answered(el);
    expect(calls).toEqual([`en:${SENTENCE}`]);
    expect(card(el)!.getAttribute("aria-busy")).toBe("false");
    expect(card(el)!.querySelector(".ui-strn__out")!.textContent).toBe("The power cable was missing.");
    expect(card(el)!.querySelector(".ui-strn__out")!.getAttribute("lang")).toBe("en");
    expect(plain(card(el)!.querySelector(".ui-strn__from")!.textContent)).toBe("Detected: French");
    expect(status(el)).toBe("Translated from French to English: The power cable was missing.");
    // Not editable: no Replace
    expect([...card(el)!.querySelectorAll(".ui-strn__btn")].map((b) => plain(b.textContent))).toEqual(["Copy", "Show original"]);
  });

  test("tc-translate answered with respondWith wins over the resolver; prevented without an answer closes the card", async () => {
    const calls: string[] = [];
    const el = await make({ calls });
    const seen: SelectionTranslateRequest[] = [];
    let mode: "answer" | "elsewhere" = "answer";
    el.addEventListener("tc-translate", (e) => {
      const d = (e as CustomEvent<SelectionTranslateRequest>).detail;
      seen.push(d);
      if (mode === "answer") d.respondWith({ text: "The power cable was missing!", source: "French" });
      else e.preventDefault();
    });
    await translate(el);
    await answered(el);
    expect(seen[0]).toMatchObject({ text: SENTENCE, target: "en", ...at(SENTENCE) });
    expect(seen[0].signal).toBeInstanceOf(AbortSignal);
    expect(calls).toEqual([]);
    expect(card(el)!.querySelector(".ui-strn__out")!.textContent).toBe("The power cable was missing!");
    expect(plain(card(el)!.querySelector(".ui-strn__from")!.textContent)).toBe("Detected: French");
    mode = "elsewhere";
    await userEvent.keyboard("{Escape}");
    await el.updateComplete;
    await translate(el, "Pouvez-vous");
    expect(card(el)).toBeNull();
    expect(calls).toEqual([]);
  });

  test("no translator: the card says so, with Retry", async () => {
    const el = await make({ noResolver: true });
    await translate(el);
    await answered(el);
    expect(plain(card(el)!.querySelector(".ui-strn__error")!.textContent)).toBe("Couldn't translate: No translator is connected");
    expect(btn(el, "retry")).not.toBeNull();
  });

  test("an error shows Retry; Retry asks again and succeeds", async () => {
    const calls: string[] = [];
    let fail = true;
    const el = await make({ calls });
    el.resolveTranslate = (text, target, signal) => (fail ? resolver(calls, true) : resolver(calls))(text, target, signal);
    await translate(el);
    await answered(el);
    expect(plain(card(el)!.querySelector(".ui-strn__error")!.textContent)).toBe("Couldn't translate: Service unavailable");
    expect(status(el)).toBe("Couldn't translate: Service unavailable. Retry is in the card");
    expect(btn(el, "copy")).toBeNull();
    fail = false;
    btn(el, "retry")!.click();
    await el.updateComplete;
    expect(card(el)!.getAttribute("aria-busy")).toBe("true");
    await answered(el);
    expect(card(el)!.querySelector(".ui-strn__out")!.textContent).toBe("The power cable was missing.");
    expect(calls).toHaveLength(2);
  });

  test("the cache: the same text and target are translated once; a new target asks again (tc-target-change)", async () => {
    const calls: string[] = [];
    const el = await make({ calls });
    const targets: string[] = [];
    el.addEventListener("tc-target-change", (e) => targets.push((e as CustomEvent).detail.target));
    await translate(el);
    await answered(el);
    await userEvent.keyboard("{Escape}");
    await el.updateComplete;
    await translate(el);
    expect(card(el)!.querySelector(".ui-strn__out")!.textContent).toBe("The power cable was missing.");
    expect(calls).toHaveLength(1);
    const select = card(el)!.querySelector<HTMLSelectElement>(".ui-strn__select")!;
    expect(select.value).toBe("en");
    select.value = "es";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await el.updateComplete;
    expect(targets).toEqual(["es"]);
    expect(el.target).toBe("es");
    expect(status(el)).toBe("Translating to Spanish…");
    await answered(el);
    expect(card(el)!.querySelector(".ui-strn__out")!.textContent).toBe("Faltaba el cable de alimentación.");
    expect(calls).toEqual([`en:${SENTENCE}`, `es:${SENTENCE}`]);
  });

  test("controlled target: tc-target-change prevented keeps the target and the select", async () => {
    const el = await make();
    el.addEventListener("tc-target-change", (e) => e.preventDefault());
    await translate(el);
    const select = card(el)!.querySelector<HTMLSelectElement>(".ui-strn__select")!;
    select.value = "es";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await el.updateComplete;
    expect(el.target).toBe("en");
    expect(select.value).toBe("en");
  });

  test("closing the card aborts the request; a stale answer is ignored", async () => {
    const el = await make({ noResolver: true });
    const seen: SelectionTranslateRequest[] = [];
    // The answer comes only once the card is closed, however slow the browser is
    let release!: () => void;
    el.addEventListener("tc-translate", (e) => {
      const d = (e as CustomEvent<SelectionTranslateRequest>).detail;
      seen.push(d);
      d.respondWith(new Promise((r) => (release = () => r({ text: "late" }))));
    });
    await translate(el);
    card(el)!.querySelector<HTMLButtonElement>(".ui-strn__close")!.click();
    await el.updateComplete;
    expect(seen[0].signal.aborted).toBe(true);
    expect(card(el)).toBeNull();
    expect(document.activeElement).toBe(root(el));
    release();
    // The late answer is dropped: nothing comes back
    await wait(140);
    await el.updateComplete;
    await frames(2);
    expect(card(el)).toBeNull();
    expect(el.querySelector(".ui-strn__mark")).toBeNull();
  });

  test("Copy fires a cancelable tc-copy; Show original opens the passage under the translation", async () => {
    const el = await make();
    const copies: unknown[] = [];
    el.addEventListener("tc-copy", (e) => {
      copies.push((e as CustomEvent).detail);
      e.preventDefault();
    });
    await translate(el);
    await answered(el);
    btn(el, "copy")!.click();
    await el.updateComplete;
    expect(copies).toEqual([{ text: "The power cable was missing." }]);
    const show = btn(el, "original")!;
    expect(show.getAttribute("aria-expanded")).toBe("false");
    show.click();
    await el.updateComplete;
    expect(btn(el, "original")!.getAttribute("aria-expanded")).toBe("true");
    expect(plain(btn(el, "original")!.textContent)).toBe("Hide original");
    const orig = document.getElementById(btn(el, "original")!.getAttribute("aria-controls")!)!;
    expect(plain(orig.textContent)).toBe(`Original · French ${SENTENCE}`);
    expect(orig.querySelector("p")!.getAttribute("lang")).toBe("fr");
  });

  test("editable: Replace puts the translation in place (cancelable tc-text-change); focus returns to the text", async () => {
    const el = await make({ editable: true });
    const changes: SelectionTranslateTextChange[] = [];
    el.addEventListener("tc-text-change", (e) => changes.push((e as CustomEvent<SelectionTranslateTextChange>).detail));
    await translate(el);
    await answered(el);
    expect(btn(el, "replace")).not.toBeNull();
    btn(el, "replace")!.click();
    await el.updateComplete;
    await frames(2);
    const next = TEXT.replace(SENTENCE, "The power cable was missing.");
    expect(changes).toEqual([{ text: next, previous: TEXT, ...at(SENTENCE), replacement: "The power cable was missing.", target: "en" }]);
    expect(el.text).toBe(next);
    expect(card(el)).toBeNull();
    expect(document.activeElement).toBe(root(el));
    expect(status(el)).toBe("Replaced with the English translation");
  });

  test("keyboard: Shift + arrows select, Tab reaches Translate, Enter opens the card; Esc closes it and returns to the text", async () => {
    const el = await make();
    root(el).focus();
    await userEvent.keyboard(`{Shift>}{${WORD}>}{ArrowRight}{ArrowRight}{/${WORD}}{/Shift}`);
    await el.updateComplete;
    await frames(2);
    expect(status(el)).toBe("Selected “Le colis”. Tab to translate");
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(pop(el)!.querySelector(".ui-strn__tool"));
    await userEvent.keyboard("{Enter}");
    await el.updateComplete;
    await frames(2);
    expect(document.activeElement).toBe(card(el)!.querySelector(".ui-strn__select"));
    await answered(el);
    expect(card(el)!.querySelector(".ui-strn__out")!.textContent).toBe("The parcel");
    await userEvent.keyboard("{Escape}");
    await el.updateComplete;
    await frames(2);
    expect(card(el)).toBeNull();
    expect(document.activeElement).toBe(root(el));
  });

  test("the wrapper: uncontrolled text survives a parent re-render; the target is remembered through onTargetChange", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const rootEl = createRoot(host);
    const calls: string[] = [];
    let rerender: (n: number) => void = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      const [target, setTarget] = React.useState("en");
      rerender = setN;
      return React.createElement(SelectionTranslate, {
        textLabel: `Message ${n}`,
        defaultText: TEXT,
        editable: true,
        target,
        onTargetChange: (t) => (calls.push(`target:${t}`), setTarget(t)),
        onTextChange: () => calls.push("text"),
        resolveTranslate: resolver(calls),
      });
    }
    await act(async () => rootEl.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcSelectionTranslate>("tc-selection-translate")!;
    await translate(el);
    await answered(el);
    const select = card(el)!.querySelector<HTMLSelectElement>(".ui-strn__select")!;
    select.value = "es";
    await act(async () => void select.dispatchEvent(new Event("change", { bubbles: true })));
    await settle();
    expect(el.target).toBe("es");
    await answered(el);
    btn(el, "replace")!.click();
    await act(async () => settle());
    await act(async () => rerender(1));
    await settle();
    expect(root(el).getAttribute("aria-label")).toBe("Message 1");
    expect(el.text).toContain("Faltaba el cable");
    expect(calls).toEqual([`en:${SENTENCE}`, "target:es", `es:${SENTENCE}`, "text"]);
    await act(async () => rootEl.unmount());
  });

  test("the wrapper: onTranslate answers; onCopy returning false stops the clipboard write", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const rootEl = createRoot(host);
    const calls: string[] = [];
    await act(async () =>
      rootEl.render(
        React.createElement(SelectionTranslate, {
          text: TEXT,
          onTranslate: (req) => req.respondWith({ text: `EN ${req.text}`, source: "fr" }),
          onCopy: (t) => (calls.push(`copy:${t}`), false),
        }),
      ),
    );
    await settle();
    const el = host.querySelector<TcSelectionTranslate>("tc-selection-translate")!;
    await translate(el, "Le colis");
    await answered(el);
    let prevented = false;
    el.addEventListener("tc-copy", (e) => (prevented = e.defaultPrevented));
    btn(el, "copy")!.click();
    await act(async () => settle());
    expect(calls).toEqual(["copy:EN Le colis"]);
    expect(prevented).toBe(true);
    await act(async () => rootEl.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look, with the toolbar and the card open – loading, done with the original, error (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${`display: grid; gap: 8px; ${theme === "dark" ? "color-scheme: dark" : ""}`}>
        <tc-selection-translate style="width: 360px; background: var(--tc-surface-raised)" lang="fr" editable .text=${TEXT} .resolveTranslate=${resolver([])}></tc-selection-translate>
        <tc-selection-translate style="width: 360px; background: var(--tc-surface-raised)" look="clean" lang="fr" .text=${TEXT} .resolveTranslate=${resolver([], true)}></tc-selection-translate>
        <tc-selection-translate style="width: 320px; background: var(--tc-surface-raised)" lang="fr" .text=${TEXT}></tc-selection-translate>
      </div>`);
      const [std, clean, narrow] = [...wrap.querySelectorAll<TcSelectionTranslate>("tc-selection-translate")];
      await translate(std);
      await answered(std);
      btn(std, "original")!.click();
      await translate(clean);
      await answered(clean);
      await pick(narrow, 0, 8);
      await wait(400);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ") + " " + n.failureSummary).join(", ")}`)).toEqual([]);
    });
  }
});
