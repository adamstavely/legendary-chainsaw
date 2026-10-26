/*
 * <tc-code-block> in real browsers: the tokenizer, streaming without re-colouring, the line diff, Copy, Apply, the
 * toolbar's keyboard, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/code-block";
import { codeBlockDiff, codeBlockLanguageLabel, codeBlockTokens, type CodeBlockApply, type TcCodeBlock } from "../../src/elements/code-block";
import { CodeBlock } from "../../src/elements/react/code-block";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const CURRENT = `import { db } from "../db";

export async function getSession(token: string) {
  const session = await db.sessions.find(token);
  return session;
}
`;
const NEXT = `import { db } from "../db";

export async function getSession(token: string) {
  const session = await db.sessions.find(token);
  if (!session) return null;
  return session;
}
`;

/** The type of the first token with this text on the given line */
const typeOf = (code: string, language: string, text: string) => codeBlockTokens(code, language).flat().find((t) => t.text === text)?.type;
const rows = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-cblk__rows > .ui-cblk__row")];
const btn = (el: Element, name: string) => [...el.querySelectorAll<HTMLButtonElement>(".ui-cblk__tools button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent!).includes(name))!;
const axeRun = (node: Element) => axe.run(node, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });

describe("tc-code-block: tokenizer", () => {
  test("TypeScript: keywords, strings, numbers, comments, functions, types, punctuation", () => {
    const code = `// load it\nconst user: User = await getUser("ada", 42);\nconst t = \`multi\nline\`; /* a\nb */ return null;`;
    expect(typeOf(code, "ts", "// load it")).toBe("comment");
    expect(typeOf(code, "ts", "const")).toBe("keyword");
    expect(typeOf(code, "ts", "User")).toBe("type");
    expect(typeOf(code, "ts", "getUser")).toBe("function");
    expect(typeOf(code, "ts", `"ada"`)).toBe("string");
    expect(typeOf(code, "ts", "42")).toBe("number");
    expect(typeOf(code, "ts", "(")).toBe("punctuation");
    // A template literal and a block comment carry over to the next line
    const lines = codeBlockTokens(code, "typescript");
    expect(lines[3][0]).toEqual({ type: "string", text: "line`" });
    expect(lines[4][0]).toEqual({ type: "comment", text: "b */" });
    expect(lines[4].find((t) => t.text === "null")!.type).toBe("number");
  });

  test("Python: triple-quoted strings span lines, decorators and defs", () => {
    const code = `@cache\ndef load(path):\n    """Read it\n    all"""\n    return None  # nothing`;
    const lines = codeBlockTokens(code, "python");
    expect(lines[0][0]).toEqual({ type: "function", text: "@cache" });
    expect(typeOf(code, "py", "def")).toBe("keyword");
    expect(typeOf(code, "py", "load")).toBe("function");
    expect(lines[3].find((t) => t.type === "string")!.text).toBe(`    all"""`);
    expect(typeOf(code, "py", "None")).toBe("number");
    expect(typeOf(code, "py", "# nothing")).toBe("comment");
  });

  test("JSON keys are properties, values strings and literals", () => {
    const code = `{ "name": "trenchcoat", "private": true, "size": 12.5 }`;
    expect(typeOf(code, "json", `"name"`)).toBe("property");
    expect(typeOf(code, "json", `"trenchcoat"`)).toBe("string");
    expect(typeOf(code, "json", "true")).toBe("number");
    expect(typeOf(code, "json", "12.5")).toBe("number");
  });

  test("HTML: tags, attributes, values, comments across lines", () => {
    const code = `<!-- a\nnote --><a href="/docs" target='_blank'>Docs &amp; more</a>`;
    const lines = codeBlockTokens(code, "html");
    expect(lines[0][0]).toEqual({ type: "comment", text: "<!-- a" });
    expect(lines[1][0]).toEqual({ type: "comment", text: "note -->" });
    expect(typeOf(code, "html", "a")).toBe("tag");
    expect(typeOf(code, "html", "href")).toBe("property");
    expect(typeOf(code, "html", `"/docs"`)).toBe("string");
    expect(typeOf(code, "html", "&amp;")).toBe("number");
  });

  test("CSS: selectors, properties, numbers, functions, at-rules", () => {
    const code = `@media (min-width: 600px) {\n.card:hover { padding: 12px; color: var(--x) !important; }\n}`;
    expect(typeOf(code, "css", "@media")).toBe("keyword");
    expect(typeOf(code, "css", ".card")).toBe("type");
    expect(typeOf(code, "css", ":hover")).toBe("function");
    expect(typeOf(code, "css", "padding")).toBe("property");
    expect(typeOf(code, "css", "12px")).toBe("number");
    expect(typeOf(code, "css", "var")).toBe("function");
    expect(typeOf(code, "css", "!important")).toBe("keyword");
  });

  test("Shell: commands, flags, variables, strings, comments", () => {
    const code = `$ npm test -- --filter "$NAME" # again\nif [ -n "$CI" ]; then echo $HOME; fi`;
    expect(typeOf(code, "bash", "npm")).toBe("function");
    expect(typeOf(code, "bash", "--filter")).toBe("number");
    expect(typeOf(code, "bash", `"$NAME"`)).toBe("string");
    expect(typeOf(code, "bash", "# again")).toBe("comment");
    expect(typeOf(code, "bash", "if")).toBe("keyword");
    expect(typeOf(code, "bash", "$HOME")).toBe("property");
  });

  test("plain and unknown languages are one plain token per line; labels", () => {
    expect(codeBlockTokens("a = 1\nb", "brainfuck")).toEqual([[{ type: null, text: "a = 1" }], [{ type: null, text: "b" }]]);
    expect(codeBlockLanguageLabel("ts")).toBe("TypeScript");
    expect(codeBlockLanguageLabel("bash")).toBe("Bash");
    expect(codeBlockLanguageLabel("")).toBe("Text");
    expect(codeBlockLanguageLabel("Rust")).toBe("Rust");
  });

  test("the line diff: removed lines before added ones, both line numbers", () => {
    const d = codeBlockDiff("a\nb\nc\n", "a\nB\nc\nd\n");
    expect(d).toEqual([
      { kind: "same", text: "a", oldLine: 1, newLine: 1 },
      { kind: "removed", text: "b", oldLine: 2, newLine: null },
      { kind: "added", text: "B", oldLine: null, newLine: 2 },
      { kind: "same", text: "c", oldLine: 3, newLine: 3 },
      { kind: "added", text: "d", oldLine: null, newLine: 4 },
    ]);
    expect(codeBlockDiff("", "x").map((r) => r.kind)).toEqual(["added"]);
    expect(codeBlockDiff("x\ny", "").map((r) => r.kind)).toEqual(["removed", "removed"]);
    // Repeated lines are matched, not confused
    expect(codeBlockDiff("}\n}\n}", "}\nx\n}\n}").filter((r) => r.kind !== "same")).toEqual([{ kind: "added", text: "x", oldLine: null, newLine: 2 }]);
  });
});

describe("tc-code-block", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the host, the head and the coloured lines`, async () => {
      const el = await fixture<TcCodeBlock>(html`<tc-code-block look=${look} filename="src/db.ts" language="ts" .code=${NEXT}></tc-code-block>`);
      expect(el.dataset.ui).toBe("cblk");
      expect(el.dataset.look).toBe(look);
      // Standard: the head sits on the tray, above the card; Clean: it is the card's first row
      const head = el.querySelector(".ui-cblk__head")!;
      expect(head.parentElement === el).toBe(look === "standard");
      expect(el.querySelector(".ui-cblk__name")!.textContent).toBe("src/db.ts");
      expect(el.querySelector(".ui-cblk__lang")!.textContent).toBe("TypeScript");
      // The final newline doesn't show as an empty last line
      expect(rows(el)).toHaveLength(NEXT.split("\n").length - 1);
      expect(rows(el)[0].querySelector(".ui-cblk__no")!.textContent).toBe("1");
      expect(rows(el)[0].querySelector(".ui-cblk__t-k")!.textContent).toBe("import");
      const region = el.querySelector(".ui-cblk__scroll")!;
      expect(region.getAttribute("role")).toBe("region");
      expect(region.getAttribute("tabindex")).toBe("0");
      expect(region.getAttribute("aria-label")).toBe("src/db.ts");
      // Every token colour is a token from the theme
      const kw = getComputedStyle(rows(el)[0].querySelector(".ui-cblk__t-k")!).color;
      const str = getComputedStyle(rows(el)[0].querySelector(".ui-cblk__t-s")!).color;
      expect(kw).not.toBe(str);
    });
  }

  test("line numbers and wrapping are optional; without a file name the region says the language", async () => {
    const el = await fixture<TcCodeBlock>(html`<tc-code-block language="py" .code=${"print(1)"} .lineNumbers=${false} wrap></tc-code-block>`);
    expect(el.querySelector(".ui-cblk__no")).toBeNull();
    expect(el.querySelector(".ui-cblk__name")).toBeNull();
    expect(el.querySelector(".ui-cblk__scroll")!.getAttribute("aria-label")).toBe("Python code");
    expect(getComputedStyle(el.querySelector(".ui-cblk__lc")!).whiteSpace).toBe("pre-wrap");
  });

  test("streaming: only the line that grew is rendered again; a caret shows; Diff and Apply wait", async () => {
    const el = await fixture<TcCodeBlock>(html`<tc-code-block language="ts" streaming applyable .current=${CURRENT} .code=${NEXT.slice(0, 60)}></tc-code-block>`);
    const before = rows(el);
    const first = before[0];
    const firstHtml = first.innerHTML;
    const changed = new Set<Node>();
    const mo = new MutationObserver((records) => records.forEach((r) => changed.add(r.target)));
    mo.observe(el.querySelector(".ui-cblk__rows")!, { subtree: true, childList: true, characterData: true });
    for (let n = 61; n <= 120; n++) {
      el.code = NEXT.slice(0, n);
      await el.updateComplete;
    }
    await settle();
    mo.disconnect();
    expect(rows(el)[0]).toBe(first);
    expect(first.innerHTML).toBe(firstHtml);
    expect([...changed].some((t) => first.contains(t))).toBe(false);
    expect(el.hasAttribute("streaming")).toBe(true);
    expect(getComputedStyle(rows(el).at(-1)!.querySelector(".ui-cblk__lc")!, "::after").content).not.toBe("none");
    expect(el.querySelector(".ui-cblk__scroll")!.getAttribute("aria-busy")).toBe("true");
    expect(btn(el, "Diff").disabled).toBe(true);
    expect(btn(el, "Apply").disabled).toBe(true);
    expect(el.querySelector(".ui-cblk__writing")!.textContent).toContain("Writing");
    el.code = NEXT;
    el.streaming = false;
    await settle();
    expect(btn(el, "Diff").disabled).toBe(false);
    expect(btn(el, "Apply").disabled).toBe(false);
    expect(el.querySelector(".ui-cblk__writing")).toBeNull();
  });

  test("a capped body follows the end while streaming, until the reader scrolls up", async () => {
    const long = Array.from({ length: 80 }, (_, i) => `const line${i} = ${i};`).join("\n");
    const el = await fixture<TcCodeBlock>(html`<tc-code-block language="ts" streaming max-height="160" .code=${long.slice(0, 400)}></tc-code-block>`);
    const body = el.querySelector<HTMLElement>(".ui-cblk__scroll")!;
    expect(body.style.maxHeight).toBe("160px");
    el.code = long.slice(0, 1200);
    await settle();
    expect(body.scrollTop + body.clientHeight).toBeGreaterThanOrEqual(body.scrollHeight - 2);
    body.scrollTop = 0;
    body.dispatchEvent(new Event("scroll"));
    el.code = long;
    await settle();
    expect(body.scrollTop).toBe(0);
  });

  test("Diff: a toggle with the counts; the rows say added and removed in words; preventDefault keeps the code", async () => {
    const el = await fixture<TcCodeBlock>(html`<tc-code-block filename="src/db.ts" language="ts" .current=${CURRENT} .code=${NEXT}></tc-code-block>`);
    const diff = btn(el, "Diff");
    expect(diff.getAttribute("aria-pressed")).toBe("false");
    expect(diff.querySelector(".ui-cblk__stat")!.textContent).toBe("+1−0");
    const views: string[] = [];
    el.addEventListener("tc-view-change", (e) => views.push((e as CustomEvent).detail.view));
    diff.click();
    await settle();
    expect(views).toEqual(["diff"]);
    expect(el.view).toBe("diff");
    expect(diff.getAttribute("aria-pressed")).toBe("true");
    expect(el.querySelector(".ui-cblk__scroll")!.getAttribute("aria-label")).toBe("Changes to src/db.ts");
    const added = rows(el).filter((r) => r.dataset.kind === "added");
    expect(added).toHaveLength(1);
    expect(added[0].textContent).toContain("Added: ");
    expect(added[0].textContent).toContain("if (!session) return null;");
    expect(added[0].querySelector(".ui-cblk__t-k")).not.toBeNull();
    // Controlled: the app prevents and the view stays
    el.addEventListener("tc-view-change", (e) => e.preventDefault(), { once: true });
    diff.click();
    await settle();
    expect(el.view).toBe("diff");
    diff.click();
    await settle();
    expect(el.view).toBe("code");
  });

  test("long unchanged runs fold behind a button that unfolds them", async () => {
    const base = Array.from({ length: 40 }, (_, i) => `line ${i}`);
    const next = [...base];
    next[20] = "changed";
    const el = await fixture<TcCodeBlock>(html`<tc-code-block view="diff" .current=${base.join("\n")} .code=${next.join("\n")}></tc-code-block>`);
    const gaps = [...el.querySelectorAll<HTMLButtonElement>(".ui-cblk__gap")];
    expect(gaps.map((g) => g.textContent!.trim())).toEqual(["Show 17 unchanged lines", "Show 16 unchanged lines"]);
    expect(rows(el).filter((r) => r.dataset.kind === "same")).toHaveLength(6);
    gaps[0].click();
    await settle();
    expect(el.querySelectorAll(".ui-cblk__gap")).toHaveLength(1);
    expect(rows(el).filter((r) => r.dataset.kind === "same")).toHaveLength(23);
  });

  test("Copy puts the code on the clipboard, fires tc-copy and says so", async () => {
    const writes: string[] = [];
    if (navigator.clipboard) vi.spyOn(navigator.clipboard, "writeText").mockImplementation(async (t: string) => void writes.push(t));
    else Object.defineProperty(navigator, "clipboard", { value: { writeText: async (t: string) => void writes.push(t) }, configurable: true });
    const el = await fixture<TcCodeBlock>(html`<tc-code-block language="ts" .code=${NEXT}></tc-code-block>`);
    const copied: string[] = [];
    el.addEventListener("tc-copy", (e) => copied.push((e as CustomEvent).detail.text));
    btn(el, "Copy").click();
    await vi.waitFor(() => expect(copied).toEqual([NEXT]));
    expect(writes).toEqual([NEXT]);
    await settle();
    expect(btn(el, "Copy").hasAttribute("data-copied")).toBe(true);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Copied");
  });

  test("Apply fires tc-apply with the code; applied turns it into a disabled Applied", async () => {
    const el = await fixture<TcCodeBlock>(html`<tc-code-block filename="src/db.ts" language="ts" applyable .code=${NEXT}></tc-code-block>`);
    const got: CodeBlockApply[] = [];
    el.addEventListener("tc-apply", (e) => got.push((e as CustomEvent<CodeBlockApply>).detail));
    btn(el, "Apply").click();
    expect(got).toEqual([{ code: NEXT, filename: "src/db.ts", language: "ts" }]);
    el.applied = true;
    el.appliedLabel = "Saved";
    await settle();
    const done = btn(el, "Saved");
    expect(done.disabled).toBe(true);
    done.click();
    expect(got).toHaveLength(1);
    el.applyable = false;
    await settle();
    expect(btn(el, "Saved")).toBeUndefined();
  });

  test("the toolbar is one tab stop; arrows, Home and End move between its buttons", async () => {
    const el = await fixture<TcCodeBlock>(html`<tc-code-block language="ts" applyable .current=${CURRENT} .code=${NEXT}></tc-code-block>`);
    const toolbar = el.querySelector('[role="toolbar"]')!;
    expect(toolbar.getAttribute("aria-label")).toBe("Code actions");
    const [diff, copy, apply] = [...toolbar.querySelectorAll("button")];
    expect([diff, copy, apply].map((b) => b.tabIndex)).toEqual([0, -1, -1]);
    diff.focus();
    diff.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(document.activeElement).toBe(copy);
    copy.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    expect(document.activeElement).toBe(apply);
    apply.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(document.activeElement).toBe(diff);
    diff.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    expect(document.activeElement).toBe(apply);
    await settle();
    expect([diff, copy, apply].map((b) => b.tabIndex)).toEqual([-1, -1, 0]);
    apply.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    expect(document.activeElement).toBe(diff);
    // A disabled button is skipped and never the tab stop
    el.streaming = true;
    await settle();
    expect([diff, copy, apply].map((b) => b.tabIndex)).toEqual([-1, 0, -1]);
  });

  test("bare: no tray or card; the diff counts sit in the head instead of a Diff button", async () => {
    const el = await fixture<TcCodeBlock>(html`<tc-code-block bare view="diff" language="ts" .current=${CURRENT} .code=${NEXT}></tc-code-block>`);
    expect(getComputedStyle(el).backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(getComputedStyle(el.querySelector(".ui-cblk__card")!).boxShadow).toBe("none");
    expect(btn(el, "Diff")).toBeUndefined();
    expect(el.querySelector(".ui-cblk__title .ui-cblk__stat")!.textContent).toBe("+1−0");
  });

  test("timers stop when it leaves the page", async () => {
    if (navigator.clipboard) vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const el = await fixture<TcCodeBlock>(html`<tc-code-block .code=${"x"}></tc-code-block>`);
    const clear = vi.spyOn(window, "clearTimeout");
    el.remove();
    expect(clear).toHaveBeenCalled();
  });

  test("React wrapper: an uncontrolled view survives a parent re-render; onApply shows Apply; onCopy", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const applied: CodeBlockApply[] = [];
    const views: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(CodeBlock, { filename: "src/db.ts", language: "ts", code: NEXT, current: CURRENT, onApply: (a) => void applied.push(a), onViewChange: (v) => void views.push(v), "data-n": n } as React.ComponentProps<typeof CodeBlock>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-code-block")!;
    btn(el, "Diff").click();
    await settle();
    expect(views).toEqual(["diff"]);
    await act(async () => bump());
    await settle();
    expect(el.view).toBe("diff");
    btn(el, "Apply").click();
    expect(applied).toEqual([{ code: NEXT, filename: "src/db.ts", language: "ts" }]);
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled view stays until the app changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const views: string[] = [];
    await act(async () => root.render(React.createElement(CodeBlock, { language: "ts", code: NEXT, current: CURRENT, view: "code", onViewChange: (v) => void views.push(v) })));
    await settle();
    const el = host.querySelector("tc-code-block")!;
    expect(btn(el, "Apply")).toBeUndefined();
    btn(el, "Diff").click();
    await settle();
    expect(views).toEqual(["diff"]);
    expect(el.view).toBe("code");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, code and diff`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="width: 640px; background: var(--tc-surface-base)">
        <tc-code-block filename="src/db.ts" language="ts" applyable .current=${CURRENT} .code=${NEXT}></tc-code-block>
        <tc-code-block look="clean" filename="src/db.ts" language="ts" applyable view="diff" .current=${CURRENT} .code=${NEXT}></tc-code-block>
        <tc-code-block view="diff" language="ts" .current=${CURRENT} .code=${NEXT}></tc-code-block>
        <tc-code-block look="clean" language="bash" .code=${"$ npm test -- --filter session # once more"}></tc-code-block>
        <tc-code-block bare language="css" .code=${".card { padding: 12px; }"}></tc-code-block>
      </div>`);
      const result = await axeRun(wrap);
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
