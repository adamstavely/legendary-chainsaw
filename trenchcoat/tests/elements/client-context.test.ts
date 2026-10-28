/*
 * <tc-client-context> in real browsers: structure in both looks, the client switcher and its keyboard, sync, the
 * timeline (search, filter, mentions, add, remove), reports, financials, settings, events and preventDefault, timers on
 * disconnect, narrow width, the React wrapper and axe in both looks and both themes. Ports the jsdom regressions of the
 * React block (tests/regressions/blocks-client-context.test.tsx).
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/client-context";
import {
  clientContextMatches,
  clientContextMentionStart,
  type ClientContextAdd,
  type ClientContextClientChange,
  type ContextClient,
  type ContextEntry,
  type TcClientContext,
} from "../../src/elements/client-context";
import { ClientContext } from "../../src/elements/react/client-context";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const me = { name: "Sofia Lind" };
const note = (id: string, text: string, author = { name: "Jonas Weber" }): ContextEntry => ({ id, kind: "note", author, when: "1d ago", text });
const client = (id: string, name: string, context: ContextEntry[] = [note(`${id}-1`, `${name} goal`)]): ContextClient => ({
  id,
  name,
  meta: `${name} Ltd`,
  mark: { letter: name[0], bg: "#1d4ed8", fg: "#ffffff" },
  kpis: [{ label: "MRR", value: "€1k", previous: "€0.9k", delta: 4.2, points: [1, 2, 3], color: "#2f6bff" }],
  reports: [{ name: "Monthly P&L", when: "2d ago", summary: "Fine." }],
  context,
});
const TWO = [client("a", "Alpha"), client("b", "Beta")];

const make = (look: "standard" | "clean" = "standard", clients = TWO) =>
  fixture<TcClientContext>(html`<tc-client-context look=${look} .clients=${clients} .me=${me}></tc-client-context>`);
const button = (el: Element, name: string | RegExp) =>
  [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => {
    const n = (b.getAttribute("aria-label") ?? b.textContent ?? "").replace(/\s+/g, " ").trim();
    return typeof name === "string" ? n === name : name.test(n);
  })!;
const tabName = (t: Element) => (t.querySelector(".ui-seg__text") ?? t).textContent!.trim();
const tab = (el: Element, name: string) => [...el.querySelectorAll<HTMLElement>("[role='tab']")].find((t) => tabName(t) === name)!;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const type = async (field: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  field.value = value;
  field.setSelectionRange?.(value.length, value.length);
  field.dispatchEvent(new Event("input", { bubbles: true }));
  await settle(field.closest("tc-client-context")!);
};

describe("tc-client-context", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: header, KPI cards, section tabs and the timeline`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("cx");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".ui-cx__name")!.textContent).toBe("Alpha");
      expect(el.querySelector(".ui-cx__meta")!.textContent).toBe("Alpha Ltd");
      expect(el.querySelectorAll(".ui-cx__kpi")).toHaveLength(1);
      expect([...el.querySelectorAll("[role='tab']")].map(tabName)).toEqual(["Context", "Reports", "Financials", "Settings"]);
      expect(tab(el, "Context").getAttribute("aria-selected")).toBe("true");
      const panel = el.querySelector("[role='tabpanel']")!;
      expect(panel.getAttribute("aria-label")).toBe("Context");
      expect(tab(el, "Context").getAttribute("aria-controls")).toBe(panel.id);
      expect(el.querySelectorAll(".ui-cx__item")).toHaveLength(1);
      expect(el.querySelector(".ui-cx__note")!.textContent).toBe("Alpha goal");
    });
  }

  test("the sync button is named by what it shows; its result goes to a status region present from the start", async () => {
    const el = await make();
    const sync = button(el, /^Synced 3m ago, sync now$/);
    const status = el.querySelector(".ui-cx__head [role='status']")!;
    expect(status.textContent).toBe("");
    sync.click();
    await settle(el);
    expect(button(el, "Syncing…, sync now")).toBeTruthy();
    await expect.poll(() => status.textContent, { timeout: 4000 }).toBe("Synced just now");
    expect(button(el, "Synced just now, sync now")).toBeTruthy();
  });

  test("the client menu takes focus, arrows move, Esc and a pick return focus to Switch client", async () => {
    const el = await make();
    const changes: string[] = [];
    el.addEventListener("tc-client-change", (e) => changes.push((e as CustomEvent<ClientContextClientChange>).detail.client));
    const trigger = button(el, "Switch client");
    trigger.click();
    await settle(el);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(button(el, /Alpha/));
    expect(document.activeElement!.getAttribute("aria-current")).toBe("true");
    key(document.activeElement!, "ArrowDown");
    expect(document.activeElement).toBe(button(el, /Beta/));
    key(document.activeElement!, "Escape");
    await settle(el);
    expect(el.querySelector(".ui-cx__menu")).toBeNull();
    expect(document.activeElement).toBe(trigger);
    trigger.click();
    await settle(el);
    button(el, /Beta/).click();
    await settle(el);
    expect(document.activeElement).toBe(button(el, "Switch client"));
    expect(el.querySelector(".ui-cx__name")!.textContent).toBe("Beta");
    expect(changes).toEqual(["b"]);
  });

  test("a prevented tc-client-change keeps the client (controlled use)", async () => {
    const el = await make();
    el.addEventListener("tc-client-change", (e) => e.preventDefault());
    button(el, "Switch client").click();
    await settle(el);
    button(el, /Beta/).click();
    await settle(el);
    expect(el.querySelector(".ui-cx__name")!.textContent).toBe("Alpha");
    el.client = "b";
    await settle(el);
    expect(el.querySelector(".ui-cx__name")!.textContent).toBe("Beta");
  });

  test("a pointer-down outside closes the menu", async () => {
    const el = await make();
    button(el, "Switch client").click();
    await settle(el);
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await settle(el);
    expect(el.querySelector(".ui-cx__menu")).toBeNull();
  });

  test("New client creates one, opens it and reports it", async () => {
    const el = await make();
    const created: string[] = [];
    el.addEventListener("tc-create-client", (e) => created.push((e as CustomEvent<{ name: string }>).detail.name));
    button(el, "Switch client").click();
    await settle(el);
    button(el, /New client/).click();
    await settle(el);
    const input = el.querySelector<HTMLInputElement>(".ui-cx__create input")!;
    expect(document.activeElement).toBe(input);
    await type(input, "Gamma");
    el.querySelector<HTMLFormElement>(".ui-cx__create")!.requestSubmit();
    await settle(el);
    expect(created).toEqual(["Gamma"]);
    expect(el.querySelector(".ui-cx__name")!.textContent).toBe("Gamma");
    expect(el.querySelector(".ui-cx__empty")!.textContent).toContain("No context yet");
  });

  test("context from the page lands, replacing local edits for that client only", async () => {
    const el = await make("standard", [client("a", "Alpha")]);
    const added: ClientContextAdd[] = [];
    el.addEventListener("tc-add-context", (e) => added.push((e as CustomEvent<ClientContextAdd>).detail));
    await type(el.querySelector("textarea")!, "Local note");
    button(el, "Add context").click();
    await settle(el);
    expect(added).toEqual([{ client: "a", text: "Local note", files: [] }]);
    expect(el.textContent).toContain("Local note");
    expect(document.activeElement).toBe(el.querySelector("textarea"));
    // Same data again (a new array with equal content): the local note stays
    el.clients = [client("a", "Alpha")];
    await settle(el);
    expect(el.textContent).toContain("Local note");
    // New data from the page: it wins
    el.clients = [client("a", "Alpha", [note("srv", "From the server")])];
    await settle(el);
    expect(el.textContent).toContain("From the server");
    expect(el.textContent).not.toContain("Local note");
  });

  test("a prevented tc-add-context isn't added; ⌘ Enter adds", async () => {
    const el = await make("standard", [client("a", "Alpha")]);
    const block = (e: Event) => e.preventDefault();
    el.addEventListener("tc-add-context", block);
    const box = el.querySelector("textarea")!;
    await type(box, "Kept out");
    key(box, "Enter", { metaKey: true, ctrlKey: true });
    await settle(el);
    expect(el.textContent).not.toContain("Kept out");
    el.removeEventListener("tc-add-context", block);
    key(box, "Enter", { metaKey: true, ctrlKey: true });
    await settle(el);
    expect(el.querySelector(".ui-cx__item[data-fresh] .ui-cx__note")!.textContent).toBe("Kept out");
  });

  test("removing a note moves focus to the next note's remove button, the last one to the note box", async () => {
    const mine = (id: string, text: string) => note(id, text, me);
    const el = await make("standard", [client("a", "Alpha", [mine("x", "First"), mine("y", "Second")])]);
    const [first] = el.querySelectorAll<HTMLButtonElement>(".ui-cx__remove");
    first.focus();
    first.click();
    await settle(el);
    const [second] = el.querySelectorAll<HTMLButtonElement>(".ui-cx__remove");
    expect(document.activeElement).toBe(second);
    second.click();
    await settle(el);
    expect(document.activeElement).toBe(el.querySelector("textarea"));
  });

  test("attaching files: chips, removal moves focus, Attach stays focusable when every file is attached", async () => {
    const el = await make("standard", [client("a", "Alpha")]);
    const attach = () => el.querySelector<HTMLButtonElement>(".ui-cx__attach button")!;
    for (let i = 0; i < 3; i++) {
      attach().click();
      await settle(el);
    }
    expect(attach().getAttribute("aria-disabled")).toBe("true");
    expect(attach().disabled).toBe(false);
    const remove = button(el, "Remove board-deck-Q3.pdf");
    remove.focus();
    remove.click();
    await settle(el);
    expect(document.activeElement).toBe(button(el, "Remove pipeline-export.csv"));
    button(el, "Remove pipeline-export.csv").click();
    await settle(el);
    button(el, "Remove headcount.xlsx").click();
    await settle(el);
    expect(document.activeElement).toBe(attach());
  });

  test("search highlights and filters; Clear keeps focus in the field; Show everything resets", async () => {
    const el = await make("standard", [client("a", "Alpha", [note("1", "Budget goal"), note("2", "Hiring plan")])]);
    const search = el.querySelector<HTMLInputElement>(".ui-cx__search input")!;
    await type(search, "budget");
    expect(el.querySelectorAll(".ui-cx__item")).toHaveLength(1);
    expect(el.querySelector(".ui-cx__item mark")!.textContent).toBe("Budget");
    const clear = button(el, "Clear search");
    clear.focus();
    clear.click();
    await settle(el);
    expect(document.activeElement).toBe(search);
    expect(el.querySelectorAll(".ui-cx__item")).toHaveLength(2);
    await type(search, "nothing like it");
    expect(el.querySelector(".ui-cx__empty")!.textContent).toContain("Nothing matches “nothing like it”");
    button(el, "Show everything").click();
    await settle(el);
    expect(document.activeElement).toBe(search);
    expect(el.querySelectorAll(".ui-cx__item")).toHaveLength(2);
  });

  test("the filter menu shows one kind with counts and returns focus to its button", async () => {
    const el = await make("standard", [client("a", "Alpha", [note("1", "Goal"), { id: "i", kind: "integration", when: "1w ago", app: "Stripe", connected: true }])]);
    const filter = () => el.querySelector<HTMLButtonElement>(".ui-cx__filter-btn button")!;
    expect(filter().getAttribute("aria-label")).toBe("Show: All");
    filter().click();
    await settle(el);
    expect(document.activeElement).toBe(button(el, /^All/));
    expect([...el.querySelectorAll(".ui-cx__menu-count")].map((c) => c.textContent)).toEqual(["2", "1", "0", "0", "1"]);
    button(el, /^Integrations/).click();
    await settle(el);
    expect(document.activeElement).toBe(filter());
    expect(filter().getAttribute("aria-label")).toBe("Show: Integrations");
    expect(el.querySelectorAll(".ui-cx__item")).toHaveLength(1);
  });

  test("@ suggests reports; Enter inserts the first; a mention chip opens the report", async () => {
    const el = await make("standard", [client("a", "Alpha", [note("1", "See the @Monthly P&L")])]);
    const box = el.querySelector("textarea")!;
    await type(box, "Check @Mon");
    expect(el.querySelector(".ui-cx__composer [role='status']")!.textContent).toBe("1 report to mention – Enter inserts Monthly P&L");
    key(box, "Enter");
    await settle(el);
    expect(box.value).toBe("Check @Monthly P&L ");
    el.querySelector<HTMLButtonElement>(".ui-cx__mention")!.click();
    await settle(el);
    expect(tab(el, "Reports").getAttribute("aria-selected")).toBe("true");
    expect(el.querySelector(".ui-cx__report-head")!.getAttribute("aria-expanded")).toBe("true");
  });

  test("a collapsed report body is inert; regenerating marks only that client's report", async () => {
    const el = await make();
    tab(el, "Reports").click();
    await settle(el);
    const body = el.querySelector<HTMLElement>(".ui-cx__report-body")!;
    expect(body.inert).toBe(true);
    button(el, /Monthly P&L/).click();
    await settle(el);
    expect(el.querySelector<HTMLElement>(".ui-cx__report-body")!.inert).toBe(false);
    el.querySelector<HTMLButtonElement>(".ui-cx__regen button")!.click();
    await settle(el);
    expect(el.textContent).toContain("Regenerating…");
    el.client = "b";
    await settle(el);
    tab(el, "Reports").click();
    await settle(el);
    expect(el.textContent).not.toContain("Regenerating…");
  });

  test("leaving the page while syncing and regenerating leaves no timer behind", async () => {
    const el = await make();
    let fired = 0;
    el.addEventListener("tc-add-context", () => fired++);
    button(el, /sync now$/).click();
    tab(el, "Reports").click();
    await settle(el);
    button(el, /Monthly P&L/).click();
    await settle(el);
    el.querySelector<HTMLButtonElement>(".ui-cx__regen button")!.click();
    await settle(el);
    const status = el.querySelector(".ui-cx__head [role='status']")!;
    el.remove();
    await new Promise((r) => setTimeout(r, 1300));
    expect(status.textContent).toBe("");
    expect(fired).toBe(0);
  });

  test("a KPI card opens its metric under Financials; tc-tab-change is cancelable", async () => {
    const el = await make();
    el.querySelector<HTMLButtonElement>(".ui-cx__kpi")!.click();
    await settle(el);
    expect(tab(el, "Financials").getAttribute("aria-selected")).toBe("true");
    expect(el.querySelector(".ui-cx__kpi")!.getAttribute("aria-pressed")).toBe("true");
    expect(el.querySelector(".ui-cx__fin[data-active] strong")!.textContent).toBe("MRR");
    expect(el.querySelector(".ui-cx__fin-value [data-trend='up']")!.textContent).toBe("+4.2%");
    el.addEventListener("tc-tab-change", (e) => e.preventDefault());
    tab(el, "Settings").click();
    await settle(el);
    expect(tab(el, "Financials").getAttribute("aria-selected")).toBe("true");
  });

  test("settings: Stripe connects and logs to the timeline; switches toggle per client", async () => {
    const el = await make("standard", [client("a", "Alpha", [])]);
    tab(el, "Settings").click();
    await settle(el);
    button(el, "Connect Stripe").click();
    await settle(el);
    expect(button(el, "Disconnect Stripe")).toBeTruthy();
    const digest = el.querySelector<HTMLButtonElement>("[role='switch'][aria-label='Daily digest']")!;
    expect(digest.getAttribute("aria-checked")).toBe("false");
    digest.click();
    await settle(el);
    expect(el.querySelector("[role='switch'][aria-label='Daily digest']")!.getAttribute("aria-checked")).toBe("true");
    tab(el, "Context").click();
    await settle(el);
    expect(el.querySelector(".ui-cx__item")!.textContent).toContain("Connected Stripe");
  });

  test("an avatar with an unsafe URL renders the initial instead", async () => {
    const el = await make("standard", [client("a", "Alpha", [note("1", "Hi", { name: "Eve", avatar: "javascript:alert(1)" } as never)])]);
    expect(el.querySelector(".ui-cx__item img")).toBeNull();
    expect(el.querySelector(".ui-cx__item .ui-cx__avatar--initial")!.textContent).toBe("E");
  });

  test("narrow: the KPI cards wrap to two columns and the toolbar stacks", async () => {
    const wrap = await fixture(html`<div style="width: 360px"><tc-client-context .clients=${defaultish()}></tc-client-context></div>`);
    const el = wrap.querySelector("tc-client-context")!;
    await settle(el);
    expect(getComputedStyle(el.querySelector(".ui-cx__kpis")!).gridTemplateColumns.split(" ")).toHaveLength(2);
    expect(getComputedStyle(el.querySelector(".ui-cx__toolbar")!).flexDirection).toBe("column");
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
  });

  test("pure helpers: matching and where a mention starts", () => {
    expect(clientContextMatches(note("1", "Budget goal"), "budget")).toBe(true);
    expect(clientContextMatches(note("1", "Budget goal"), "jonas")).toBe(true);
    expect(clientContextMatches({ id: "f", kind: "files", author: me, when: "", files: [{ name: "plan.pdf", type: "pdf" }] }, "plan")).toBe(true);
    expect(clientContextMatches(note("1", "Budget"), "zzz")).toBe(false);
    expect(clientContextMentionStart("Hi @Mon", 7)).toBe(3);
    expect(clientContextMentionStart("mail@x", 6)).toBe(null);
    expect(clientContextMentionStart("@a  b", 5)).toBe(null);
  });
});

function defaultish() {
  const four = client("a", "Alpha");
  four.kpis = ["MRR", "Cash", "Margin", "Burn"].map((label) => ({ label, value: "1", previous: "1", delta: 0, points: [1, 2], color: "#2f6bff" }));
  return [four];
}

describe("ClientContext (React)", () => {
  test("uncontrolled: picking a client sticks across parent re-renders and is reported", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const picked: string[] = [];
    let rerender = () => {};
    function App() {
      const [, set] = React.useState(0);
      rerender = () => set((n) => n + 1);
      return React.createElement(ClientContext, { clients: TWO, onClientChange: (id: string) => picked.push(id) });
    }
    await act(async () => root.render(React.createElement(App)));
    const el = host.querySelector("tc-client-context")!;
    await settle(el);
    button(el, "Switch client").click();
    await settle(el);
    await act(async () => button(el, /Beta/).click());
    await act(async () => rerender());
    await settle(el);
    expect(picked).toEqual(["b"]);
    expect(el.querySelector(".ui-cx__name")!.textContent).toBe("Beta");
    await act(async () => root.unmount());
  });

  test("controlled: the client stays until the prop changes; context adds are reported", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const picked: string[] = [];
    const added: string[] = [];
    const render = (id: string) =>
      root.render(
        React.createElement(ClientContext, { clients: TWO, client: id, onClientChange: (x: string) => picked.push(x), onAddContext: (_c: string, text: string) => added.push(text) }),
      );
    await act(async () => render("a"));
    const el = host.querySelector("tc-client-context")!;
    await settle(el);
    button(el, "Switch client").click();
    await settle(el);
    await act(async () => button(el, /Beta/).click());
    await settle(el);
    expect(picked).toEqual(["b"]);
    expect(el.querySelector(".ui-cx__name")!.textContent).toBe("Alpha");
    await act(async () => render("b"));
    await settle(el);
    expect(el.querySelector(".ui-cx__name")!.textContent).toBe("Beta");
    await type(el.querySelector("textarea")!, "Hello");
    await act(async () => button(el, "Add context").click());
    expect(added).toEqual(["Hello"]);
    await act(async () => root.unmount());
  });
});

describe("tc-client-context – axe", () => {
  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, Context and Reports open`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-client-context look="standard" .me=${me}></tc-client-context>
        <tc-client-context look="clean" .me=${me}></tc-client-context>
      </div>`);
      const [, clean] = wrap.querySelectorAll("tc-client-context");
      tab(clean, "Reports").click();
      await settle(wrap);
      button(clean, /Monthly P&L/).click();
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

/* blocks/client-context is a thin shell over the element: it keeps the React block's props and types and forwards
   them (it replaced tests/regressions/blocks-client-context.test.tsx, whose behaviour checks moved up this file) */
describe("blocks/client-context", () => {
  test("forwards the block's props, ref and callbacks", async () => {
    const { ClientContext: Block } = await import("@blocks/client-context");
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const ref = React.createRef<HTMLElement>();
    const added: string[] = [];
    await act(async () =>
      root.render(React.createElement(Block, { ref, className: "mine", clients: TWO, defaultClient: "b", me, onAddContext: (_c: string, text: string) => added.push(text) })),
    );
    const el = host.querySelector<TcClientContext>("tc-client-context")!;
    await settle(el);
    expect(ref.current).toBe(el);
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.querySelector(".ui-cx__name")!.textContent).toBe("Beta");
    await type(el.querySelector("textarea")!, "From the block");
    await act(async () => button(el, "Add context").click());
    expect(added).toEqual(["From the block"]);
    await act(async () => root.unmount());
  });
});
