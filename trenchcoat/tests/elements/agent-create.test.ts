/*
 * <tc-agent-create> in real browsers: describing, examples, Generate and streaming, editing every section of the
 * draft, Create and its checks, Start over, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/agent-create";
import type { AgentCreateCreate, AgentCreateDraftChange, AgentCreateGenerate, AgentDraft, TcAgentCreate } from "../../src/elements/agent-create";
import { AgentCreate } from "../../src/elements/react/agent-create";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const DRAFT: AgentDraft = {
  name: "Expense checker",
  instructions: "Check each claim against the travel policy.",
  tools: [
    { id: "claims", label: "Expense claims", description: "Read new claims", enabled: true },
    { id: "email", label: "Email", enabled: false },
  ],
  model: "model-s",
  triggers: [{ id: "t1", label: "A claim is submitted" }],
  questions: [{ id: "q1", question: "Who approves claims over the limit?" }],
};
const MODELS = [
  { id: "model-s", label: "Model S" },
  { id: "model-m", label: "Model M" },
];
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const q = <T extends Element = HTMLElement>(el: Element, s: string) => el.querySelector<T>(s)!;
const type = async (field: HTMLInputElement | HTMLTextAreaElement, value: string) => {
  field.value = value;
  field.dispatchEvent(new InputEvent("input", { bubbles: true }));
  await settle();
};
const withDraft = () => fixture<TcAgentCreate>(html`<tc-agent-create prompt="Check claims" .draft=${structuredClone(DRAFT)} .models=${MODELS}></tc-agent-create>`);

describe("tc-agent-create", () => {
  test("starts with the description and examples, and no draft", async () => {
    const el = await fixture<TcAgentCreate>(html`<tc-agent-create .examples=${["Match invoices", "Answer policy questions"]}></tc-agent-create>`);
    expect(el.dataset.ui).toBe("agcr");
    expect(text(q(el, `label[for="${q(el, ".ui-agcr__prompt").id}"]`))).toBe("What should this agent do?");
    expect([...el.querySelectorAll(".ui-agcr__chip")].map(text)).toEqual(["Match invoices", "Answer policy questions"]);
    expect(el.querySelector(".ui-agcr__draft")).toBeNull();
    expect(q(el, ".ui-agcr__generate").getAttribute("aria-disabled")).toBe("true");
  });

  test("an example fills the field and focuses it", async () => {
    const el = await fixture<TcAgentCreate>(html`<tc-agent-create .examples=${["Match invoices"]}></tc-agent-create>`);
    q(el, ".ui-agcr__chip").click();
    await settle();
    expect(el.prompt).toBe("Match invoices");
    await expect.poll(() => document.activeElement).toBe(q(el, ".ui-agcr__prompt"));
    expect(q(el, ".ui-agcr__generate").getAttribute("aria-disabled")).toBe("false");
  });

  test("Generate with nothing described says why and focuses the field", async () => {
    const el = await fixture<TcAgentCreate>(html`<tc-agent-create></tc-agent-create>`);
    let fired = false;
    el.addEventListener("tc-generate", () => (fired = true));
    q(el, ".ui-agcr__generate").click();
    await settle();
    expect(fired).toBe(false);
    const field = q<HTMLTextAreaElement>(el, ".ui-agcr__prompt");
    expect(field.getAttribute("aria-invalid")).toBe("true");
    expect(text(q(el, `#${field.getAttribute("aria-describedby")}`))).toBe("Describe the agent first.");
    expect(document.activeElement).toBe(field);
    await type(field, "Check claims");
    expect(field.getAttribute("aria-invalid")).toBe("false");
  });

  test("Generate fires with the description and streams until the page is done; Ctrl/⌘+Enter generates too", async () => {
    const el = await fixture<TcAgentCreate>(html`<tc-agent-create prompt="  Check expense claims  "></tc-agent-create>`);
    const seen: AgentCreateGenerate[] = [];
    el.addEventListener("tc-generate", (e) => seen.push((e as CustomEvent<AgentCreateGenerate>).detail));
    q(el, ".ui-agcr__prompt").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, metaKey: true, bubbles: true, cancelable: true }));
    await settle();
    expect(seen).toEqual([{ description: "Check expense claims" }]);
    expect(el.streaming).toBe(true);
    expect(text(q(el, '[role="status"]'))).toBe("Writing the draft…");
    el.draft = { ...DRAFT, instructions: "", tools: [], triggers: [], questions: [] };
    await settle();
    expect(q(el, ".ui-agcr__draft").getAttribute("aria-busy")).toBe("true");
    expect(q(el, ".ui-agcr__create").getAttribute("aria-disabled")).toBe("true");
    expect(text(q(el, `#${q(el, ".ui-agcr__create").getAttribute("aria-describedby")}`))).toBe("Wait for the draft to finish.");
    el.draft = structuredClone(DRAFT);
    el.streaming = false;
    await settle();
    expect(text(q(el, '[role="status"]'))).toBe("Draft ready. Check each section before you create the agent.");
    expect(q(el, ".ui-agcr__draft").getAttribute("aria-busy")).toBe("false");
    expect(text(q(el, ".ui-agcr__generate"))).toBe("Generate again");
  });

  test("a prevented Generate doesn't start streaming", async () => {
    const el = await fixture<TcAgentCreate>(html`<tc-agent-create prompt="Check claims"></tc-agent-create>`);
    el.addEventListener("tc-generate", (e) => e.preventDefault());
    q(el, ".ui-agcr__generate").click();
    await settle();
    expect(el.streaming).toBe(false);
  });

  test("every section of the draft is editable, each edit firing tc-draft-change", async () => {
    const el = await withDraft();
    const seen: AgentCreateDraftChange[] = [];
    el.addEventListener("tc-draft-change", (e) => seen.push((e as CustomEvent<AgentCreateDraftChange>).detail));
    await type(q(el, ".ui-agcr__name"), "Claim checker");
    await type(q(el, ".ui-agcr__instructions"), "Check claims.");
    const email = q(el, '.ui-agcr__switch[data-tool="email"]');
    expect(email.getAttribute("role")).toBe("switch");
    email.click();
    await settle();
    const model = q<HTMLSelectElement>(el, ".ui-agcr__model");
    model.value = "model-m";
    model.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    await type(q(el, ".ui-agcr__answer"), "Finance");
    expect(seen.map((s) => s.field)).toEqual(["name", "instructions", "tools", "model", "questions"]);
    expect(el.draft).toMatchObject({ name: "Claim checker", instructions: "Check claims.", model: "model-m", questions: [{ answer: "Finance" }] });
    expect(el.draft!.tools.find((t) => t.id === "email")!.enabled).toBe(true);
    expect(email.getAttribute("aria-checked")).toBe("true");
  });

  test("triggers can be added with Enter and removed, focus staying in the section", async () => {
    const el = await withDraft();
    const input = q<HTMLInputElement>(el, ".ui-agcr__trigger-input");
    await type(input, "Every Friday at 17:00");
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    await settle();
    expect(el.draft!.triggers.map((t) => t.label)).toEqual(["A claim is submitted", "Every Friday at 17:00"]);
    expect(input.value).toBe("");
    const removes = () => [...el.querySelectorAll<HTMLElement>(".ui-agcr__trigger-remove")];
    expect(text(removes()[0])).toBe("Remove: A claim is submitted");
    removes()[0]!.click();
    await settle();
    expect(el.draft!.triggers.map((t) => t.label)).toEqual(["Every Friday at 17:00"]);
    await expect.poll(() => document.activeElement).toBe(removes()[0]);
    removes()[0]!.click();
    await settle();
    expect(text(q(el, ".ui-agcr__draft .ui-agcr__none"))).toContain("No triggers yet");
    await expect.poll(() => document.activeElement).toBe(q(el, ".ui-agcr__trigger-input"));
  });

  test("a prevented draft change keeps the draft", async () => {
    const el = await withDraft();
    el.addEventListener("tc-draft-change", (e) => e.preventDefault());
    q(el, '.ui-agcr__switch[data-tool="email"]').click();
    await settle();
    expect(el.draft!.tools.find((t) => t.id === "email")!.enabled).toBe(false);
    expect(q(el, '.ui-agcr__switch[data-tool="email"]').getAttribute("aria-checked")).toBe("false");
  });

  test("Create fires with the draft, but not without a name", async () => {
    const el = await withDraft();
    const created: AgentCreateCreate[] = [];
    el.addEventListener("tc-create", (e) => created.push((e as CustomEvent<AgentCreateCreate>).detail));
    await type(q(el, ".ui-agcr__name"), "  ");
    expect(q(el, ".ui-agcr__create").getAttribute("aria-disabled")).toBe("true");
    q(el, ".ui-agcr__create").click();
    await settle();
    expect(created).toHaveLength(0);
    expect(q(el, ".ui-agcr__name").getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(q(el, ".ui-agcr__name"));
    await type(q(el, ".ui-agcr__name"), "Expense checker");
    q(el, ".ui-agcr__create").click();
    await settle();
    expect(created[0]!.draft.name).toBe("Expense checker");
  });

  test("Start over clears the draft and the description, unless prevented", async () => {
    const el = await withDraft();
    el.addEventListener("tc-reset", (e) => e.preventDefault(), { once: true });
    q(el, ".ui-agcr__start-over").click();
    await settle();
    expect(el.draft).not.toBeNull();
    q(el, ".ui-agcr__start-over").click();
    await settle();
    expect(el.draft).toBeNull();
    expect(el.prompt).toBe("");
    await expect.poll(() => document.activeElement).toBe(q(el, ".ui-agcr__prompt"));
  });

  test("offers the draft's own model when it isn't in the list", async () => {
    const el = await fixture<TcAgentCreate>(html`<tc-agent-create .draft=${{ ...DRAFT, model: "model-x" }} .models=${MODELS}></tc-agent-create>`);
    expect([...el.querySelectorAll<HTMLOptionElement>(".ui-agcr__model option")].map((o) => o.value)).toEqual(["model-s", "model-m", "model-x"]);
    expect(q<HTMLSelectElement>(el, ".ui-agcr__model").value).toBe("model-x");
  });

  test("fits a narrow column", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 300px"><tc-agent-create prompt="Check claims" .draft=${DRAFT} .examples=${["Match supplier invoices to purchase orders"]}></tc-agent-create></div>`);
    const inner = wrap.querySelector<HTMLElement>(".ui-agcr__card")!;
    expect(inner.scrollWidth).toBeLessThanOrEqual(inner.clientWidth + 1);
  });
});

describe("React", () => {
  test("an uncontrolled draft survives re-renders, and a controlled one stays until the parent changes it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const generated: string[] = [];
    const node = (extra = {}) => React.createElement(AgentCreate, { defaultPrompt: "Check claims", defaultDraft: DRAFT, models: MODELS, onGenerate: (d: string) => (generated.push(d), false), ...extra });
    await act(async () => root.render(node()));
    await settle();
    const el = host.querySelector<TcAgentCreate>("tc-agent-create")!;
    await act(async () => type(q(el, ".ui-agcr__name"), "Claim checker"));
    await act(async () => root.render(node()));
    await settle();
    expect(el.draft!.name).toBe("Claim checker");
    await act(async () => root.render(node({ draft: DRAFT })));
    await settle();
    await act(async () => type(q(el, ".ui-agcr__name"), "Something else"));
    await settle();
    expect(el.draft!.name).toBe("Expense checker");
    await act(async () => q(el, ".ui-agcr__generate").click());
    await settle();
    expect(generated).toEqual(["Check claims"]);
    expect(el.streaming).toBe(false);
    expect(el.heading).toBe("New agent");
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(
          html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas`}><tc-agent-create prompt="Check claims" .examples=${["Match invoices"]} .draft=${DRAFT} .models=${MODELS}></tc-agent-create></div>`,
        );
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
