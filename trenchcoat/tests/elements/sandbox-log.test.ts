/*
 * <tc-sandbox-log> in real browsers: ANSI parsing, streaming, open/close, search, copy, windowing a 50,000-line log,
 * the keyboard, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/sandbox-log";
import { sandboxLogPlainText, type SandboxLogStep, type TcSandboxLog } from "../../src/elements/sandbox-log";
import { SandboxLog } from "../../src/elements/react/sandbox-log";
import { cleanup, fixture, settle } from "./helpers";

const clipboard = Object.getOwnPropertyDescriptor(Navigator.prototype, "clipboard");
afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
  delete (navigator as { clipboard?: unknown }).clipboard;
  if (clipboard) Object.defineProperty(Navigator.prototype, "clipboard", clipboard);
});

const E = "\x1b[";
const STEPS: SandboxLogStep[] = [
  { id: "install", command: "npm ci", label: "Install dependencies", output: `added 12 packages\n${E}33mwarn${E}39m deprecated glob@7`, exitCode: 0, duration: 1840 },
  { id: "test", command: "npm test", label: "Run the tests", output: `${E}32m✓${E}39m adds\n${E}31m✗${E}39m prorates\n${E}1mTests${E}22m 1 failed`, exitCode: 1, duration: 9240 },
  { id: "build", command: "npm run build", output: "building…", duration: 400 },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const on = (el: Element, name: string, fn: (e: CustomEvent<Record<string, any>>) => void) => el.addEventListener(name, fn as EventListener);
const mount = (steps: SandboxLogStep[] = STEPS, extra: Partial<TcSandboxLog> = {}) =>
  fixture<TcSandboxLog>(html`<tc-sandbox-log look=${extra.look ?? "standard"} .steps=${steps} .open=${extra.open} .maxHeight=${extra.maxHeight ?? 320}></tc-sandbox-log>`);
const toggles = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-sbl__toggle")];
const lineTexts = (el: Element, id: string) => [...el.querySelectorAll(`.ui-sbl__lines[data-step="${id}"] .ui-sbl__txt`)].map((t) => t.textContent);
const input = (el: Element) => el.querySelector<HTMLInputElement>(".ui-sbl__input")!;
const type = async (el: TcSandboxLog, text: string) => {
  const i = input(el);
  i.value = text;
  i.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
};
const key = (target: Element, k: string, opts: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...opts }));
const finishAnimations = () => {
  for (const a of document.getAnimations()) if (a.effect?.getTiming().iterations !== Infinity) a.finish();
};

describe("tc-sandbox-log", () => {
  test("the host is the root and a region named by the heading, in either look", async () => {
    const el = await mount();
    expect(el.dataset.ui).toBe("sbl");
    expect(el.dataset.look).toBe("standard");
    expect(el.getAttribute("role")).toBe("region");
    expect(el.getAttribute("aria-label")).toBe("Sandbox");
    expect(el.querySelector(".ui-sbl__card")).toBeTruthy();
    el.heading = "Build machine";
    el.environment = "ubuntu-24.04";
    el.look = "clean";
    await settle();
    expect(el.dataset.look).toBe("clean");
    expect(el.getAttribute("aria-label")).toBe("Build machine");
    expect(el.querySelector(".ui-sbl__env")!.textContent).toBe("ubuntu-24.04");
    // Clean is one card: no inner card
    expect(el.querySelector(".ui-sbl__card")).toBeNull();
  });

  test("a step shows its command, label, exit code and duration; status comes from the exit code", async () => {
    const el = await mount();
    const steps = [...el.querySelectorAll<HTMLElement>(".ui-sbl__step")];
    expect(steps.map((s) => s.dataset.status)).toEqual(["success", "error", "running"]);
    expect(steps[0].querySelector(".ui-sbl__cmd")!.textContent).toBe("$npm ci");
    expect(steps[0].querySelector(".ui-sbl__label")!.textContent).toBe("Install dependencies");
    expect(steps[0].querySelector(".ui-sbl__exit")!.textContent).toBe("exit 0");
    expect(steps[0].querySelector(".ui-sbl__time")!.textContent).toBe("1.8s");
    expect(steps[1].querySelector(".ui-sbl__exit")!.textContent).toBe("exit 1");
    expect(steps[2].querySelector(".ui-sbl__exit")!.textContent).toBe("running");
    expect(steps[2].querySelector(".ui-sbl__time")!.textContent).toBe("400ms");
    // The prompt is decoration
    expect(steps[0].querySelector(".ui-sbl__prompt")!.getAttribute("aria-hidden")).toBe("true");
    el.steps = [{ id: "q", command: "npm run e2e", status: "queued" }];
    await settle();
    expect(el.querySelector<HTMLElement>(".ui-sbl__step")!.dataset.status).toBe("queued");
    expect(el.querySelector(".ui-sbl__empty")!.textContent).toBe("Not started yet.");
  });

  test("ANSI colours, bold, dim, underline and resets become token classes; nothing is parsed as HTML", async () => {
    const output = [
      `${E}31mred${E}0m plain ${E}1;32mbold green${E}22m still green${E}39m`,
      `${E}2mdim${E}22m ${E}4munder${E}24m ${E}90mgray${E}m`,
      `${E}38;5;196m256 red${E}39m ${E}38;2;20;200;40mtrue green${E}39m ${E}44mon blue${E}49m`,
      `<img src=x onerror="window.__pwned = 1"> & <b>not bold</b>`,
      `Downloading 10%\rDownloading 100%`,
      `${E}2K${E}1Gcursor moves are dropped\x07`,
    ].join("\n");
    const el = await mount([{ id: "a", command: "x", output, exitCode: 1 }]);
    const lines = [...el.querySelectorAll(".ui-sbl__lines .ui-sbl__txt")];
    const spans = (n: number) => [...lines[n].querySelectorAll("span")].map((s) => [s.className, s.textContent]);
    expect(spans(0)).toEqual([
      ["ui-sbl__fg-red", "red"],
      ["ui-sbl__fg-green ui-sbl__b", "bold green"],
      ["ui-sbl__fg-green", " still green"],
    ]);
    expect(lines[0].textContent).toBe("red plain bold green still green");
    expect(spans(1)).toEqual([
      ["ui-sbl__fg-gray", "dim"],
      ["ui-sbl__u", "under"],
      ["ui-sbl__fg-gray", "gray"],
    ]);
    expect(spans(2)).toEqual([
      ["ui-sbl__fg-red", "256 red"],
      ["ui-sbl__fg-green", "true green"],
      ["ui-sbl__bg-blue", "on blue"],
    ]);
    expect(lines[3].textContent).toBe(`<img src=x onerror="window.__pwned = 1"> & <b>not bold</b>`);
    expect(el.querySelector(".ui-sbl__lines img, .ui-sbl__lines b")).toBeNull();
    expect((window as { __pwned?: number }).__pwned).toBeUndefined();
    expect(lines[4].textContent).toBe("Downloading 100%");
    expect(lines[5].textContent).toBe("cursor moves are dropped");
    // Colours are tokens
    const red = lines[0].querySelector(".ui-sbl__fg-red")!;
    const probe = document.createElement("span");
    probe.style.color = "var(--tc-status-danger-fg)";
    el.querySelector(".ui-sbl__lines")!.append(probe);
    expect(getComputedStyle(red).color).toBe(getComputedStyle(probe).color);
    probe.remove();
    expect(sandboxLogPlainText(output).split("\n")[0]).toBe("red plain bold green still green");
  });

  test("streaming: a longer output parses only its new lines, and the style carries across chunks", async () => {
    const steps = (output: string): SandboxLogStep[] => [{ id: "s", command: "npm test", output }];
    const el = await mount(steps(`one\n${E}32mtwo`));
    const before = el.linesOf("s");
    const first = before[0];
    expect(lineTexts(el, "s")).toEqual(["one", "two"]);
    el.steps = steps(`one\n${E}32mtwo\nthree${E}39m\nfour`);
    await settle();
    expect(lineTexts(el, "s")).toEqual(["one", "two", "three", "four"]);
    // The complete first line was kept, not parsed again
    expect(el.linesOf("s")[0]).toBe(first);
    expect(el.querySelectorAll(".ui-sbl__lines .ui-sbl__line")[2].querySelector(".ui-sbl__fg-green")!.textContent).toBe("three");
    // A replaced output starts over
    el.steps = steps("fresh");
    await settle();
    expect(lineTexts(el, "s")).toEqual(["fresh"]);
    // A trailing newline doesn't show an empty line
    el.steps = steps("a\nb\n");
    await settle();
    expect(lineTexts(el, "s")).toEqual(["a", "b"]);
  });

  test("unset, open shows the running and failed steps; a toggle fires a cancelable tc-open-change", async () => {
    const el = await mount();
    expect(toggles(el).map((t) => t.getAttribute("aria-expanded"))).toEqual(["false", "true", "true"]);
    const body = el.querySelector<HTMLElement>(`#${toggles(el)[0].getAttribute("aria-controls")}`)!;
    expect(body.inert).toBe(true);
    const seen: string[][] = [];
    on(el, "tc-open-change", (e) => seen.push(e.detail.open));
    toggles(el)[0].click();
    await settle();
    expect(seen).toEqual([["test", "build", "install"]]);
    expect(el.open).toEqual(["test", "build", "install"]);
    expect(body.inert).toBe(false);
    // Controlled: prevented, nothing changes until the app passes it back
    on(el, "tc-open-change", (e) => e.preventDefault());
    toggles(el)[1].click();
    await settle();
    expect(seen[1]).toEqual(["build", "install"]);
    expect(toggles(el)[1].getAttribute("aria-expanded")).toBe("true");
    el.open = [];
    await settle();
    expect(toggles(el).every((t) => t.getAttribute("aria-expanded") === "false")).toBe(true);
  });

  test("keyboard: ↑ ↓ Home End move between step headers; Enter and Space toggle (native buttons)", async () => {
    const el = await mount();
    const [a, b, c] = toggles(el);
    a.focus();
    key(a, "ArrowDown");
    expect(document.activeElement).toBe(b);
    key(b, "End");
    expect(document.activeElement).toBe(c);
    key(c, "ArrowDown");
    expect(document.activeElement).toBe(a);
    key(a, "ArrowUp");
    expect(document.activeElement).toBe(c);
    key(c, "Home");
    expect(document.activeElement).toBe(a);
    expect(a.localName).toBe("button");
    // ⌘F / Ctrl+F inside the log goes to its search
    const ev = new KeyboardEvent("keydown", { key: "f", ctrlKey: true, bubbles: true, cancelable: true });
    a.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(input(el));
  });

  test("search: counts matches across steps, marks them, ↵ / ⇧↵ move and open the step; Esc clears", async () => {
    const el = await mount();
    const seen: string[] = [];
    on(el, "tc-query-change", (e) => seen.push(e.detail.query));
    await type(el, "e");
    expect(seen).toEqual(["e"]);
    expect(el.query).toBe("e");
    // install: "packages", "deprecated" (×2)… counted on the plain text, case-insensitive
    const total = [...STEPS].reduce((n, s) => n + (sandboxLogPlainText(s.output ?? "").toLowerCase().match(/e/g)?.length ?? 0), 0);
    expect(el.querySelector(".ui-sbl__count")!.textContent).toBe(`1/${total}`);
    expect(el.querySelector('[role="status"]')!.textContent).toBe(`${total} matches`);
    // The first match is in a closed step: moving to it opens that step
    await type(el, "glob");
    expect(el.querySelector(".ui-sbl__count")!.textContent).toBe("1/1");
    key(input(el), "Enter");
    await settle();
    await settle();
    expect(toggles(el)[0].getAttribute("aria-expanded")).toBe("true");
    const current = el.querySelector(".ui-sbl__hit[data-current]")!;
    expect(current.textContent).toBe("glob");
    expect(current.closest(".ui-sbl__lines")!.getAttribute("data-step")).toBe("install");
    // Next / previous wrap around
    await type(el, "s");
    const count = () => el.querySelector(".ui-sbl__count")!.textContent;
    const n = Number(count()!.split("/")[1]);
    key(input(el), "Enter", { shiftKey: true });
    await settle();
    expect(count()).toBe(`${n}/${n}`);
    el.querySelector<HTMLButtonElement>('[aria-label="Next match"]')!.click();
    await settle();
    expect(count()).toBe(`1/${n}`);
    // A match that spans a colour change is marked in both runs
    await type(el, "✓ add");
    expect([...el.querySelectorAll(".ui-sbl__hit")].map((m) => m.textContent).join("")).toBe("✓ add");
    // Nothing found
    await type(el, "zzz");
    expect(count()).toBe("0/0");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("No matches");
    expect(el.querySelector<HTMLButtonElement>('[aria-label="Next match"]')!.disabled).toBe(true);
    // Esc clears
    key(input(el), "Escape");
    await settle();
    expect(el.query).toBe("");
    expect(el.querySelector(".ui-sbl__hit")).toBeNull();
  });

  test("search is controlled with preventDefault(): the field keeps the app's value", async () => {
    const el = await mount();
    on(el, "tc-query-change", (e) => e.preventDefault());
    await type(el, "abc");
    expect(el.query).toBe("");
    expect(input(el).value).toBe("");
    el.query = "npm";
    await settle();
    expect(input(el).value).toBe("npm");
  });

  test("copy: a step's plain text, or the whole log, and a tc-copy event", async () => {
    const writes: string[] = [];
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (t: string) => void writes.push(t) } });
    const el = await mount();
    const copies: unknown[] = [];
    on(el, "tc-copy", (e) => copies.push(e.detail));
    el.querySelector<HTMLButtonElement>('[aria-label="Copy output of npm test"]')!.click();
    await vi.waitFor(() => expect(copies).toHaveLength(1));
    expect(writes[0]).toBe("✓ adds\n✗ prorates\nTests 1 failed");
    expect(copies[0]).toEqual({ stepId: "test", text: writes[0] });
    await settle();
    expect(el.querySelector('[aria-label="Copy output of npm test"]')!.hasAttribute("data-copied")).toBe(true);
    el.querySelector<HTMLButtonElement>('[aria-label="Copy the whole log"]')!.click();
    await vi.waitFor(() => expect(copies).toHaveLength(2));
    expect(writes[1]).toContain("$ npm ci\nadded 12 packages\nwarn deprecated glob@7\n\n$ npm test\n");
    // A step without output has nothing to copy
    el.steps = [{ id: "e", command: "true", output: "", exitCode: 0 }];
    await settle();
    expect(el.querySelector<HTMLButtonElement>('[aria-label="Copy output of true"]')!.disabled).toBe(true);
    expect(el.querySelector(".ui-sbl__empty")!.textContent).toBe("No output.");
  });

  test("announces when a step finishes", async () => {
    const el = await mount([{ id: "t", command: "npm test", output: "…" }]);
    const status = el.querySelector('[role="status"]')!;
    expect(status.textContent).toBe("");
    el.steps = [{ id: "t", command: "npm test", output: "…", exitCode: 2 }];
    await settle();
    expect(status.textContent).toBe("npm test failed with exit code 2");
    expect(el.querySelector(".ui-sbl__summary")!.textContent).toBe("1 step · 1 failed");
  });

  test("windowing: 50,000 lines render only the rows near the viewport; search reaches any line", async () => {
    const output = Array.from({ length: 50_000 }, (_, i) => (i === 41_234 ? `${E}31mneedle${E}39m at ${i}` : `${E}2m[${i}]${E}22m transform src/mod${i % 97}.ts`)).join("\n");
    const t0 = performance.now();
    const el = await mount([{ id: "big", command: "npm run build", output, exitCode: 0 }], { open: ["big"] });
    const took = performance.now() - t0;
    expect(el.linesOf("big")).toHaveLength(50_000);
    const rows = () => el.querySelectorAll(".ui-sbl__lines .ui-sbl__line").length;
    expect(rows()).toBeGreaterThan(0);
    expect(rows()).toBeLessThan(400);
    // The spacers stand in for the rest: the scroller is as tall as 50,000 rows
    const out = el.querySelector<HTMLElement>(".ui-sbl__out")!;
    expect(out.scrollHeight).toBeGreaterThan(50_000 * 15);
    // It follows the end: the last line is rendered
    await vi.waitFor(() => expect(lineTexts(el, "big").at(-1)).toBe("[49999] transform src/mod44.ts"));
    // Scrolling to the middle renders the middle
    out.scrollTop = 20_000 * el.querySelector<HTMLElement>(".ui-sbl__line")!.offsetHeight;
    await vi.waitFor(() => expect(lineTexts(el, "big").some((t) => t?.startsWith("[20000]"))).toBe(true));
    expect(rows()).toBeLessThan(400);
    // Search finds the needle and moves the window to it
    await type(el, "needle");
    expect(el.querySelector(".ui-sbl__count")!.textContent).toBe("1/1");
    key(input(el), "Enter");
    await vi.waitFor(() => expect(el.querySelector(".ui-sbl__hit[data-current]")?.textContent).toBe("needle"));
    expect(el.querySelector(".ui-sbl__line[data-current] .ui-sbl__ln")!.textContent).toBe("41235");
    expect(rows()).toBeLessThan(400);
    // Generous: parsing and the first render of 50,000 lines take well under this in every browser
    expect(took).toBeLessThan(5000);
  });

  test("line numbers can be turned off; a step opened from the outside renders its lines", async () => {
    const el = await mount();
    expect(el.querySelector(".ui-sbl__ln")).toBeTruthy();
    el.lineNumbers = false;
    await settle();
    expect(el.querySelector(".ui-sbl__ln")).toBeNull();
    expect(el.querySelector(".ui-sbl__lines")!.hasAttribute("data-plain")).toBe(true);
  });

  test("focus on a step that goes away moves to the first step, not <body>", async () => {
    const el = await mount();
    toggles(el)[2].focus();
    el.steps = STEPS.slice(0, 2);
    await settle();
    await vi.waitFor(() => expect(document.activeElement).toBe(toggles(el)[0]));
  });

  test("React wrapper: title, uncontrolled open survives a parent re-render, onOpenChange / onQueryChange / onCopy fire", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onOpenChange = vi.fn();
    const onQueryChange = vi.fn();
    let rerender: () => void = () => {};
    function App() {
      const [, set] = React.useState(0);
      rerender = () => set((n) => n + 1);
      return React.createElement(SandboxLog, { title: "Runner", steps: STEPS, onOpenChange, onQueryChange, className: "mine" });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcSandboxLog>("tc-sandbox-log")!;
    expect(el.heading).toBe("Runner");
    expect(el.classList.contains("mine")).toBe(true);
    await act(async () => toggles(el)[0].click());
    await settle();
    expect(onOpenChange).toHaveBeenCalledWith(["test", "build", "install"]);
    await act(async () => rerender());
    await settle();
    expect(toggles(el)[0].getAttribute("aria-expanded")).toBe("true");
    await act(async () => type(el, "npm"));
    expect(onQueryChange).toHaveBeenCalledWith("npm");
    await act(async () => rerender());
    await settle();
    expect(input(el).value).toBe("npm");
    await act(async () => root.unmount());
  });

  test("React wrapper: controlled open and query stay with the app", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onOpenChange = vi.fn();
    await act(async () => root.render(React.createElement(SandboxLog, { steps: STEPS, open: [], query: "", onOpenChange, onQueryChange: () => {} })));
    await settle();
    const el = host.querySelector<TcSandboxLog>("tc-sandbox-log")!;
    expect(el.heading).toBe("Sandbox");
    await act(async () => toggles(el)[0].click());
    await settle();
    expect(onOpenChange).toHaveBeenCalledWith(["install"]);
    expect(toggles(el)[0].getAttribute("aria-expanded")).toBe("false");
    await act(async () => type(el, "x"));
    expect(input(el).value).toBe("");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const)
    test(`axe: no violations in either look (${theme}), with a search open`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme}>
        <tc-sandbox-log .steps=${STEPS} query="e"></tc-sandbox-log>
        <tc-sandbox-log look="clean" heading="Clean" environment="node 22" .steps=${STEPS} query="e"></tc-sandbox-log>
      </div>`);
      await settle();
      finishAnimations();
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });

  test("reduced motion and theme: no .dark colours, the spinner token, nothing endless but the running spinner", async () => {
    const css = (customElements.get("tc-sandbox-log") as unknown as { css: string }).css;
    expect(css).not.toMatch(/\.dark|data-(?:tc-)?theme/);
    expect(css).toContain("prefers-reduced-motion");
    for (const [rule] of css.matchAll(/animation:[^;]*\binfinite\b[^;]*;/g)) expect(rule).toMatch(/ui-sbl-spin/);
    // Disconnecting clears the copy timer
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    const el = await mount();
    el.remove();
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });
});
