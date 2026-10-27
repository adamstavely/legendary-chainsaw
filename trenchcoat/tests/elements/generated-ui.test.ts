/*
 * <tc-generated-ui> in real browsers: each block drawn as the library's own element, the spec checked with text
 * fallbacks, never HTML, streaming text, forms (validation, values, submit), actions as one event, the wrapper, and
 * axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/generated-ui";
import type { GeneratedUiActionDetail, GeneratedUiForm, GeneratedUiIssue, GeneratedUiSpec, TcGeneratedUi } from "../../src/elements/generated-ui";
import type { TcDataTable } from "../../src/elements/data-table";
import type { TcKpiChart } from "../../src/elements/kpi-chart";
import { GeneratedUi } from "../../src/elements/react/generated-ui";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const make = (spec: unknown, attrs: { streaming?: boolean; showIssues?: boolean; look?: string } = {}) =>
  fixture<TcGeneratedUi>(html`<tc-generated-ui look=${attrs.look ?? "standard"} .spec=${spec as GeneratedUiSpec} ?streaming=${!!attrs.streaming} ?show-issues=${!!attrs.showIssues}></tc-generated-ui>`);
const blocks = (el: Element) => [...el.querySelector(".ui-gui__blocks")!.children];
const text = (el: Element | null) => el!.textContent!.replace(/\s+/g, " ").trim();

const FORM: GeneratedUiForm = {
  type: "form",
  id: "invite",
  title: "Invite",
  submitLabel: "Send",
  fields: [
    { name: "email", label: "Email", kind: "email", required: true },
    { name: "seats", label: "Seats", kind: "number", min: 1, max: 10, value: 2 },
    { name: "role", label: "Role", kind: "select", required: true, options: [{ value: "admin", label: "Admin" }, { value: "member", label: "Member" }] },
    { name: "plan", label: "Plan", kind: "choice", value: "team", options: [{ value: "team", label: "Team" }, { value: "biz", label: "Business" }] },
    { name: "note", label: "Note", kind: "textarea" },
  ],
};

async function type(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
}

describe("tc-generated-ui", () => {
  test("the host is the root, in either look", async () => {
    for (const look of ["standard", "clean"]) {
      const el = await make({ type: "text", text: "Hi" }, { look });
      expect(el.dataset.ui).toBe("gui");
      expect(el.dataset.look).toBe(look);
    }
  });

  test("text: paragraphs, a heading with its level, muted text", async () => {
    const el = await make([
      { type: "text", style: "heading", text: "Summary" },
      { type: "text", text: "First.\n\nSecond." },
      { type: "text", style: "muted", text: "Small print" },
    ]);
    const [h, p, m] = blocks(el);
    expect(h.getAttribute("role")).toBe("heading");
    expect(h.getAttribute("aria-level")).toBe("3");
    expect([...p.querySelectorAll("p")].map((x) => x.textContent)).toEqual(["First.", "Second."]);
    expect(m.querySelector("p")!.hasAttribute("data-muted")).toBe(true);
    el.headingLevel = 2;
    await settle();
    expect(blocks(el)[0].getAttribute("aria-level")).toBe("2");
  });

  test("nothing in the spec becomes HTML", async () => {
    const evil = `<img src=x onerror="window.__pwned=1"><b>bold</b>`;
    const el = await make({ blocks: [{ type: "text", text: evil }, { type: "callout", title: evil, text: evil }, { type: "metric", label: evil, value: evil }, { type: "nope", note: evil }] });
    expect(el.querySelector("img, b")).toBe(null);
    expect(el.querySelector(".ui-gui__text")!.textContent).toBe(evil);
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined();
  });

  test("metric: a tile with change-summary's trend mark, said in words", async () => {
    const el = await make({ type: "group", layout: "row", children: [
      { type: "metric", label: "Revenue", value: "$412K", change: "Up 6%", tone: "good" },
      { type: "metric", label: "Churn", value: 41, change: "Up 3", tone: "bad", direction: "up" },
      { type: "metric", label: "NPS", value: 46 },
    ] });
    const tiles = [...el.querySelectorAll(".ui-gui__metric")];
    expect(tiles.map(text)).toEqual(["Revenue $412K Good change: Up 6%", "Churn 41 Bad change: Up 3", "NPS 46"]);
    expect(el.querySelector(".ui-gui__stack")!.getAttribute("data-layout")).toBe("row");
  });

  test("table: a read-only tc-data-table with the spec's columns and rows", async () => {
    const el = await make({ type: "table", title: "Accounts", columns: [{ key: "name", label: "Name" }, { key: "n", label: "Seats", type: "number" }, { key: "x", label: "Odd", type: "map" }], rows: [{ name: "Acme", n: 12, x: true }, { name: "Globex", n: null }] });
    const t = el.querySelector<TcDataTable>("tc-data-table")!;
    expect(t.readonly).toBe(true);
    expect(t.heading).toBe("Accounts");
    expect(t.columns.map((c) => [c.key, c.type, c.editable])).toEqual([["name", "text", false], ["n", "number", false], ["x", "text", false]]);
    expect(t.rows).toEqual([{ id: "r0", name: "Acme", n: 12, x: "Yes" }, { id: "r1", name: "Globex" }]);
  });

  test("chart: a tc-kpi-chart with the chart tokens as colours", async () => {
    const el = await make({ type: "chart", title: "Sign-ups", value: "4.8k", labels: ["Mon", "Tue"], series: [{ label: "A", values: [1, 2] }, { label: "B", values: [3, 4] }], footer: "Last week" });
    const c = el.querySelector<TcKpiChart>("tc-kpi-chart")!;
    expect([c.heading, c.value, c.footer]).toEqual(["Sign-ups", "4.8k", "Last week"]);
    expect(c.series.map((s) => s.color)).toEqual(["var(--tc-chart-1)", "var(--tc-chart-2)"]);
    // The lines take the token's colour, not black
    const line = c.querySelector("polyline")!;
    expect(getComputedStyle(line).stroke).not.toBe("none");
    expect(getComputedStyle(line).stroke).not.toBe("rgb(0, 0, 0)");
  });

  test("callout: tone said in words, nested blocks, actions", async () => {
    const actions: GeneratedUiActionDetail[] = [];
    const el = await make({ blocks: [{ type: "callout", tone: "warning", title: "Over budget", text: "Runs out early.", children: [{ type: "metric", label: "Spend", value: "$9K" }], actions: [{ id: "cap", label: "Cap spend", primary: true }, { id: "bad" }] }] });
    el.addEventListener("tc-action", (e) => actions.push((e as CustomEvent<GeneratedUiActionDetail>).detail));
    const callout = el.querySelector(".ui-gui__callout")!;
    expect(callout.getAttribute("data-tone")).toBe("warning");
    expect(text(callout)).toContain("Warning: Over budget Runs out early. Spend $9K Cap spend");
    expect(el.querySelectorAll(".ui-gui__btn")).toHaveLength(1);
    el.querySelector<HTMLButtonElement>(".ui-gui__btn")!.click();
    expect(actions).toEqual([{ kind: "action", action: "cap", block: "/blocks/0" }]);
    expect(el.issues).toEqual([{ path: "/blocks/0/actions/1", message: "an action needs an id and a label – left out" }]);
  });

  test("anything unknown or invalid falls back to its text, with the reason when asked", async () => {
    const spec = {
      blocks: [
        { type: "map", title: "Regions", note: "Lisbon grew most" },
        { type: "chart", title: "Bad", labels: ["a", "b"], series: [{ label: "x", values: [1] }] },
        { type: "table", columns: [], rows: [] },
        "just a string",
        { type: "group", children: [{ type: "group", children: [{ type: "group", children: [{ type: "group", children: [{ type: "group", children: [{ type: "group", children: [{ type: "text", text: "deep" }] }] }] }] }] }] },
      ],
    };
    const checks: GeneratedUiIssue[][] = [];
    const wrap = await fixture<HTMLElement>(html`<div @tc-spec-check=${(e: CustomEvent<{ issues: GeneratedUiIssue[] }>) => checks.push(e.detail.issues)}><tc-generated-ui .spec=${spec}></tc-generated-ui></div>`);
    const el = wrap.firstElementChild as TcGeneratedUi;
    const fallbacks = [...el.querySelectorAll(".ui-gui__fallback")];
    expect(fallbacks.map(text)).toEqual(["Regions · Lisbon grew most", "Bad · a · b · x · 1", "", "just a string", "deep"]);
    expect(el.issues.map((i) => i.path)).toEqual(["/blocks/0", "/blocks/1", "/blocks/2", "/blocks/3", "/blocks/4/children/0/children/0/children/0/children/0/children/0/children/0"]);
    expect(el.issues[0].message).toBe("unknown type “map”");
    expect(el.issues[1].message).toBe("series 1 needs one number per label (2)");
    expect(checks).toEqual([el.issues]);
    expect(el.querySelector(".ui-gui__reason")).toBe(null);
    el.showIssues = true;
    await settle();
    expect(el.querySelector(".ui-gui__reason")!.textContent).toBe("Shown as text: unknown type “map”");
  });

  test("the spec as text: JSON parsed, prose shown as it is", async () => {
    const el = await make(JSON.stringify({ blocks: [{ type: "text", text: "From JSON" }] }));
    expect(text(el.querySelector(".ui-gui__text"))).toBe("From JSON");
    el.spec = "Sorry, I can't chart that – here are the totals instead.";
    await settle();
    expect(text(el.querySelector(".ui-gui__text"))).toBe("Sorry, I can't chart that – here are the totals instead.");
    expect(el.issues[0].message).toMatch(/^not a spec/);
  });

  test("streaming text: closed blocks show, the one arriving is a placeholder", async () => {
    const full = JSON.stringify({ blocks: [{ type: "text", text: "One" }, { type: "metric", label: "Two", value: 2 }] });
    const cut = full.indexOf(`"label"`) + 10;
    const el = await make(full.slice(0, cut), { streaming: true });
    expect(el.querySelector(".ui-gui__blocks")!.getAttribute("aria-busy")).toBe("true");
    expect(blocks(el).map((b) => b.className)).toEqual(["ui-gui__prose", "ui-gui__pending"]);
    el.spec = full;
    await settle();
    // Still streaming: one placeholder for whatever comes next
    expect(blocks(el).map((b) => b.className)).toEqual(["ui-gui__prose", "ui-gui__metric", "ui-gui__pending"]);
    el.streaming = false;
    await settle();
    expect(blocks(el).map((b) => b.className)).toEqual(["ui-gui__prose", "ui-gui__metric"]);
    expect(el.querySelector(".ui-gui__blocks")!.hasAttribute("aria-busy")).toBe(false);
  });

  test("form: fields from stepper-form, labelled; required and format checks flag each field and focus the first", async () => {
    const actions: GeneratedUiActionDetail[] = [];
    const el = await make(FORM);
    el.addEventListener("tc-action", (e) => actions.push((e as CustomEvent<GeneratedUiActionDetail>).detail));
    const form = el.querySelector("form")!;
    expect(form.getAttribute("aria-labelledby")).toBe(el.querySelector(".ui-gui__form-title")!.id);
    const email = el.querySelector<HTMLInputElement>('input[name="email"]')!;
    const select = el.querySelector<HTMLSelectElement>('select[name="role"]')!;
    const note = el.querySelector<HTMLTextAreaElement>('textarea[name="note"]')!;
    // Every control is named by its field's label
    for (const [c, label] of [[email, "Email"], [select, "Role"], [note, "Note"]] as const) expect(document.querySelector(`label[for="${c.id}"]`)!.textContent).toContain(label);
    expect(el.querySelector<HTMLInputElement>('input[name="seats"]')!.value).toBe("2");
    el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await settle();
    await settle();
    expect(actions).toHaveLength(0);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("2 fields need attention");
    expect(document.activeElement).toBe(email);
    expect(email.getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(email.getAttribute("aria-describedby")!)!.textContent).toBe("Fill this in");
    expect(select.getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(select.getAttribute("aria-describedby")!)!.textContent).toBe("Choose one");
    await type(email, "not-an-email");
    await type(el.querySelector<HTMLInputElement>('input[name="seats"]')!, "40");
    select.value = "member";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(select.hasAttribute("aria-invalid")).toBe(false);
    el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await settle();
    await settle();
    expect(document.getElementById(email.getAttribute("aria-describedby")!)!.textContent).toBe("That doesn't look like an email address");
    expect(el.querySelector('tc-stepper-field[data-name="seats"] .ui-sf__msg')!.textContent).toBe("Must be 10 or less");
    await type(email, "ana@acme.io");
    await type(el.querySelector<HTMLInputElement>('input[name="seats"]')!, "4");
    await type(note, "Starts Monday");
    el.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await settle();
    await settle();
    expect(actions).toEqual([{ kind: "submit", action: "invite", block: "", values: { email: "ana@acme.io", seats: 4, role: "member", plan: "team", note: "Starts Monday" } }]);
  });

  test("form: a choice keeps its own keyboard; its change event stays inside", async () => {
    const outside = vi.fn();
    const wrap = await fixture<HTMLElement>(html`<div @tc-value-change=${outside}><tc-generated-ui .spec=${FORM}></tc-generated-ui></div>`);
    const el = wrap.firstElementChild as TcGeneratedUi;
    const radio = el.querySelector<HTMLElement>('tc-stepper-choices [role="radio"][aria-checked="true"]')!;
    radio.focus();
    radio.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
    await settle();
    expect(outside).not.toHaveBeenCalled();
    expect(el.formValues["#invite"].plan).toBe("biz");
  });

  test("what people typed survives a new spec with the same form", async () => {
    const el = await make({ blocks: [FORM] });
    await type(el.querySelector<HTMLInputElement>('input[name="email"]')!, "ana@acme.io");
    el.spec = { blocks: [FORM, { type: "text", text: "More" }] };
    await settle();
    expect(el.querySelector<HTMLInputElement>('input[name="email"]')!.value).toBe("ana@acme.io");
  });

  test("React wrapper: onAction, onSpecCheck; a re-render keeps typed values", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onAction = vi.fn();
    const onSpecCheck = vi.fn();
    const spec = { blocks: [{ type: "callout", text: "Go?", actions: [{ id: "go", label: "Go" }] }, FORM, { type: "unknown" }] } as unknown as GeneratedUiSpec;
    function App() {
      const [n, setN] = React.useState(0);
      return React.createElement("div", null, React.createElement("button", { id: "rr", onClick: () => setN(n + 1) }, `re-render ${n}`), React.createElement(GeneratedUi, { spec, onAction, onSpecCheck }));
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    expect(onSpecCheck).toHaveBeenCalledWith([{ path: "/blocks/2", message: "unknown type “unknown”" }]);
    const el = host.querySelector<TcGeneratedUi>("tc-generated-ui")!;
    await type(el.querySelector<HTMLInputElement>('input[name="email"]')!, "ana@acme.io");
    await act(async () => host.querySelector<HTMLButtonElement>("#rr")!.click());
    await settle();
    expect(el.querySelector<HTMLInputElement>('input[name="email"]')!.value).toBe("ana@acme.io");
    await act(async () => el.querySelector<HTMLButtonElement>(".ui-gui__callout .ui-gui__btn")!.click());
    expect(onAction).toHaveBeenCalledWith({ kind: "action", action: "go", block: "/blocks/0" });
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const)
    for (const look of ["standard", "clean"] as const)
      test(`axe: no violations (${look}, ${theme})`, async () => {
        const spec = {
          blocks: [
            { type: "text", style: "heading", text: "Spring campaign" },
            { type: "text", text: "Sign-ups are ahead." },
            { type: "group", title: "Numbers", layout: "row", children: [{ type: "metric", label: "Sign-ups", value: "4,812", change: "Up 38%", tone: "good" }, { type: "metric", label: "Cost", value: "$7.40", change: "Up $1.10", tone: "bad" }] },
            { type: "chart", title: "Daily", labels: ["a", "b", "c"], series: [{ label: "Referral", values: [1, 3, 2] }] },
            { type: "table", title: "By channel", columns: [{ key: "c", label: "Channel" }, { key: "n", label: "Sign-ups", type: "number" }], rows: [{ c: "Referral", n: 2140 }] },
            { type: "callout", tone: "danger", title: "Over budget", text: "Runs out early.", actions: [{ id: "cap", label: "Cap", primary: true }] },
            { type: "map", note: "Lisbon" },
            FORM,
          ],
        };
        const wrap = await fixture<HTMLElement>(html`<div data-tc-theme=${theme} style="background: var(--tc-surface-base); padding: 8px"><tc-generated-ui look=${look} show-issues .spec=${spec}></tc-generated-ui></div>`);
        wrap.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
        await settle();
        await settle();
        await new Promise((r) => setTimeout(r, 600));
        wrap.getAnimations({ subtree: true }).filter((a) => a.effect?.getTiming().iterations !== Infinity).forEach((a) => a.finish());
        const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ") + " " + n.failureSummary).join(", ")}`)).toEqual([]);
      });
});
