/*
 * <tc-retrieval-settings> in real browsers: the pipeline, every control, filters and focus, controlled use, the form,
 * the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/retrieval-settings";
import { retrievalSettingsProblem, type RetrievalFilterField, type RetrievalSettingsChange, type RetrievalSettingsValue, type TcRetrievalSettings } from "../../src/elements/retrieval-settings";
import { RetrievalSettings } from "../../src/elements/react/retrieval-settings";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const FIELDS: RetrievalFilterField[] = [
  { id: "lang", label: "Language", type: "choice", options: ["English", "German"] },
  { id: "updated", label: "Updated", type: "date" },
  { id: "product", label: "Product" },
];
const MODELS = [
  { id: "small", label: "Small reranker" },
  { id: "large", label: "Large reranker" },
];
const VALUE: RetrievalSettingsValue = {
  chunkSize: 512,
  chunkOverlap: 64,
  topK: 40,
  threshold: 0.35,
  hybrid: 0.7,
  rerank: true,
  rerankModel: "small",
  topN: 8,
  filters: [
    { id: "a", field: "lang", operator: "is", value: "English" },
    { id: "b", field: "product", operator: "contains", value: "Billing" },
  ],
};

const mount = (value: RetrievalSettingsValue = VALUE, look: "standard" | "clean" = "standard") =>
  fixture<TcRetrievalSettings>(html`<tc-retrieval-settings look=${look} .value=${value} .filterFields=${FIELDS} .rerankModels=${MODELS}></tc-retrieval-settings>`);
const changes = (el: Element) => {
  const seen: RetrievalSettingsValue[] = [];
  el.addEventListener("tc-value-change", (e) => seen.push((e as CustomEvent<RetrievalSettingsChange>).detail.value));
  return seen;
};
const num = (el: Element, key: string) => el.querySelector<HTMLInputElement>(`.ui-rset__in[data-key="${key}"]`)!;
const setInput = (input: HTMLInputElement | HTMLSelectElement, value: string, type = "change") => {
  input.value = value;
  input.dispatchEvent(new Event(type, { bubbles: true }));
};
const stages = (el: Element) => [...el.querySelectorAll(".ui-rset__stage")].map((s) => s.textContent!.replace(/\s+/g, " ").replace(/ ,/g, ",").trim());
const filterRow = (el: Element, id: string) => el.querySelector(`[data-filter="${id}"]`)!;
const tab = (el: Element, stage: string) => el.querySelector<HTMLButtonElement>(`.ui-rset__stage[data-stage="${stage}"]`)!;
const openStage = async (el: Element, stage: string) => {
  tab(el, stage).click();
  await settle();
};
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("retrievalSettingsProblem", () => {
  test("overlap, context and unfinished filters", () => {
    expect(retrievalSettingsProblem(VALUE)).toBeNull();
    expect(retrievalSettingsProblem({ ...VALUE, chunkOverlap: 512 })?.[1]).toBe("overlap");
    expect(retrievalSettingsProblem({ ...VALUE, topN: 41 })?.[1]).toBe("context");
    expect(retrievalSettingsProblem({ ...VALUE, filters: [{ id: "x", field: "lang", operator: "is", value: "" }] })?.[1]).toBe("filters");
  });
});

describe("tc-retrieval-settings", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the host is a group named by the heading, and the pipeline reads the settings`, async () => {
      const el = await mount(VALUE, look);
      expect(el.dataset.ui).toBe("rset");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("group");
      expect(el.getAttribute("aria-label")).toBe("Retrieval");
      expect(!!el.querySelector(".ui-rset__card")).toBe(look === "standard");
      expect(el.querySelector(".ui-rset__tabs")!.getAttribute("role")).toBe("tablist");
      expect(el.querySelector(".ui-rset__tabs")!.getAttribute("aria-label")).toBe("Pipeline");
      expect(stages(el)).toEqual(["Query, As asked", "Retrieve 40, 70% vector", "Filter, Score ≥ 0.35 · 2 rules", "Rerank, Small reranker", "8 into context, 8 chunks"]);
      expect(el.querySelector(".ui-rset__estimate")).toBeNull();
    });
  }

  test("the pipeline follows the value: rerank off, keyword only, no rules; the estimate shows per stage and at the foot", async () => {
    const el = await mount({ ...VALUE, rerank: false, hybrid: 0, filters: [] });
    expect(stages(el)).toEqual(["Query, As asked", "Retrieve 40, Keyword only", "Filter, Score ≥ 0.35", "Rerank, Off", "8 into context, 8 chunks"]);
    expect(el.querySelector('.ui-rset__stage[data-stage="rerank"]')!.hasAttribute("data-off")).toBe(true);
    el.estimate = { latencyMs: 168, cost: 0.0021, contextTokens: 3800, note: "Reranking is most of the wait.", stages: { retrieve: 84, rerank: 74 } };
    el.value = { ...VALUE, hybrid: 1 };
    await settle();
    expect(stages(el)).toEqual(["Query, As asked", "Retrieve 40, Vector only, 84ms", "Filter, Score ≥ 0.35 · 2 rules", "Rerank, Small reranker, 74ms", "8 into context, ≈ 3.8k tokens"]);
    expect([...el.querySelectorAll(".ui-rset__fact")].map((f) => f.textContent!.trim())).toEqual(["≈ 168ms a query", "$0.002 a query", "≈ 3.8k tokens of context"]);
    expect(el.querySelector(".ui-rset__estimate-note")!.textContent).toBe("Reranking is most of the wait.");
    el.value = { ...VALUE, hybrid: 0.5 };
    await settle();
    expect(stages(el)[1]).toContain("Even keyword and vector");
  });

  test("the stages are tabs: arrows move, Enter or a click opens one, its panel shows its settings; tc-stage-change is cancelable", async () => {
    const el = await mount();
    const seen: string[] = [];
    el.addEventListener("tc-stage-change", (e) => seen.push((e as CustomEvent).detail.stage));
    const retrieve = tab(el, "retrieve");
    expect(retrieve.getAttribute("aria-selected")).toBe("true");
    expect(retrieve.tabIndex).toBe(0);
    expect(tab(el, "filter").tabIndex).toBe(-1);
    const panel = el.querySelector(".ui-rset__panel")!;
    expect(panel.getAttribute("role")).toBe("tabpanel");
    expect(panel.getAttribute("aria-labelledby")).toBe(retrieve.id);
    expect(retrieve.getAttribute("aria-controls")).toBe(panel.id);
    // The query isn't a tab
    expect(el.querySelector('.ui-rset__stage[data-stage="query"]')!.getAttribute("role")).toBeNull();
    retrieve.focus();
    key(retrieve, "ArrowRight");
    expect(document.activeElement).toBe(tab(el, "filter"));
    key(document.activeElement!, "End");
    expect(document.activeElement).toBe(tab(el, "context"));
    key(document.activeElement!, "ArrowRight");
    expect(document.activeElement).toBe(retrieve);
    key(document.activeElement!, "ArrowLeft");
    // Moving doesn't open: manual activation
    expect(el.stage).toBe("retrieve");
    tab(el, "context").click();
    await settle();
    expect(el.stage).toBe("context");
    expect(el.querySelector(".ui-rset__panel")!.getAttribute("aria-labelledby")).toBe(tab(el, "context").id);
    expect(num(el, "topN")).toBeTruthy();
    expect(num(el, "topK")).toBeNull();
    // The summary on the stage updates live
    setInput(num(el, "topN"), "5");
    await settle();
    expect(stages(el)[4]).toBe("5 into context, 5 chunks");
    el.addEventListener("tc-stage-change", (e) => e.preventDefault());
    tab(el, "rerank").click();
    await settle();
    expect(el.stage).toBe("context");
    expect(seen).toEqual(["context", "rerank"]);
  });

  test("numbers commit on change, rounded and clamped; the overlap visual and its hint follow", async () => {
    const el = await mount();
    const seen = changes(el);
    setInput(num(el, "chunkSize"), "1000.4");
    await settle();
    expect(el.value.chunkSize).toBe(1000);
    setInput(num(el, "topK"), "9999");
    await settle();
    expect(el.value.topK).toBe(500);
    setInput(num(el, "chunkOverlap"), "-3");
    await settle();
    expect(el.value.chunkOverlap).toBe(0);
    expect(el.querySelector(".ui-rset__chunks")!.children).toHaveLength(3);
    expect(el.querySelector('[data-field="chunks"] .ui-rset__hint')!.textContent).toBe("Each chunk shares 0% with the next.");
    // Not a number: put back, nothing fires
    await openStage(el, "context");
    setInput(num(el, "topN"), "");
    await settle();
    expect(num(el, "topN").value).toBe("8");
    expect(seen.map((v) => [v.chunkSize, v.topK, v.chunkOverlap])).toEqual([
      [1000, 40, 64],
      [1000, 500, 64],
      [1000, 500, 0],
    ]);
    expect(num(el, "topN").getAttribute("aria-label")).toBe("Chunks into context");
  });

  test("an overlap as big as the chunk and more into context than retrieved are errors, described and invalid", async () => {
    const el = await mount({ ...VALUE, chunkOverlap: 600 });
    const overlap = num(el, "chunkOverlap");
    expect(overlap.getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(overlap.getAttribute("aria-describedby")!)!.textContent).toBe("Overlap has to be smaller than the chunk.");
    el.value = { ...VALUE, topN: 50 };
    await settle();
    // Its stage carries a dot until it's opened
    expect(tab(el, "context").hasAttribute("data-invalid")).toBe(true);
    expect(tab(el, "context").textContent).toContain("needs a fix");
    await openStage(el, "context");
    const ctx = num(el, "topN");
    expect(ctx.getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(ctx.getAttribute("aria-describedby")!)!.textContent).toBe("Context can't take more chunks than retrieval returns.");
    expect(tab(el, "retrieve").hasAttribute("data-invalid")).toBe(false);
  });

  test("the keyword ↔ vector balance and the threshold are native ranges with spoken values", async () => {
    const el = await mount();
    const seen = changes(el);
    const hybrid = el.querySelector<HTMLInputElement>(".ui-rset__hybrid")!;
    expect(hybrid.type).toBe("range");
    expect(document.getElementById(hybrid.getAttribute("aria-labelledby")!)!.textContent).toBe("Keyword ↔ vector");
    expect(hybrid.getAttribute("aria-valuetext")).toBe("70% vector");
    setInput(hybrid, "25", "input");
    await settle();
    expect(el.value.hybrid).toBe(0.25);
    expect(hybrid.getAttribute("aria-valuetext")).toBe("75% keyword");
    await openStage(el, "filter");
    const threshold = el.querySelector<HTMLInputElement>(".ui-rset__threshold")!;
    expect(document.getElementById(threshold.getAttribute("aria-labelledby")!)!.textContent).toBe("Keep if the score is at least");
    setInput(threshold, "0.55", "input");
    await settle();
    expect(el.value.threshold).toBe(0.55);
    expect(threshold.getAttribute("aria-valuetext")).toBe("Score at least 0.55");
    expect(seen).toHaveLength(2);
  });

  test("rerank: a switch named by its label; the model select is off while rerank is", async () => {
    const el = await mount({ ...VALUE, rerank: false, rerankModel: "" });
    await openStage(el, "rerank");
    const sw = el.querySelector<HTMLButtonElement>(".ui-rset__switch")!;
    expect(sw.getAttribute("role")).toBe("switch");
    expect(sw.getAttribute("aria-checked")).toBe("false");
    expect(document.getElementById(sw.getAttribute("aria-labelledby")!)!.textContent).toBe("Rerank the kept chunks");
    const select = el.querySelector<HTMLSelectElement>(".ui-rset__model select")!;
    expect(select.disabled).toBe(true);
    sw.click();
    await settle();
    // Turning it on picks the first model when none is set
    expect(el.value.rerank).toBe(true);
    expect(el.value.rerankModel).toBe("small");
    expect(select.disabled).toBe(false);
    setInput(select, "large");
    await settle();
    expect(el.value.rerankModel).toBe("large");
    expect(stages(el)[3]).toBe("Rerank, Large reranker");
    await openStage(el, "context");
    expect(el.querySelector('[data-field="context"] .ui-rset__hint')!.textContent).toBe("The best after reranking go into the prompt – 8 of the 40 retrieved.");
    // The k retrieved, the first n lit
    expect(el.querySelectorAll(".ui-rset__cells > span")).toHaveLength(40);
    expect(el.querySelectorAll(".ui-rset__cells > span[data-on]")).toHaveLength(8);
  });

  test("filters: structured rows; the field picks the operators and the value control", async () => {
    const el = await mount();
    await openStage(el, "filter");
    const rows = el.querySelectorAll(".ui-rset__filter");
    expect(rows).toHaveLength(2);
    const a = filterRow(el, "a");
    expect(a.querySelector(".ui-rset__f-field")!.getAttribute("aria-label")).toBe("Filter 1: field");
    expect([...a.querySelectorAll<HTMLOptionElement>(".ui-rset__f-op option")].map((o) => o.textContent)).toEqual(["is", "is not"]);
    expect(a.querySelector(".ui-rset__f-value")!.tagName).toBe("SELECT");
    // A text field: is, is not, contains and a text box
    const b = filterRow(el, "b");
    expect([...b.querySelectorAll<HTMLOptionElement>(".ui-rset__f-op option")].map((o) => o.textContent)).toEqual(["is", "is not", "contains"]);
    expect(b.querySelector<HTMLInputElement>(".ui-rset__f-value")!.type).toBe("text");
    // Switching the field to a date resets the value and keeps a fitting operator
    setInput(b.querySelector<HTMLSelectElement>(".ui-rset__f-field")!, "updated");
    await settle();
    expect(el.value.filters[1]).toEqual({ id: "b", field: "updated", operator: "after", value: "" });
    expect(filterRow(el, "b").querySelector<HTMLInputElement>(".ui-rset__f-value")!.type).toBe("date");
    // Unfinished: the value is invalid and the list says why
    const value = filterRow(el, "b").querySelector<HTMLInputElement>(".ui-rset__f-value")!;
    expect(value.getAttribute("aria-invalid")).toBe("true");
    const list = el.querySelector(".ui-rset__filters")!;
    expect(document.getElementById(list.getAttribute("aria-describedby")!)!.textContent).toBe("Finish or remove the unfinished filter.");
    setInput(value, "2026-01-01");
    await settle();
    expect(el.value.filters[1].value).toBe("2026-01-01");
    setInput(filterRow(el, "b").querySelector<HTMLSelectElement>(".ui-rset__f-op")!, "before");
    await settle();
    expect(el.value.filters[1].operator).toBe("before");
    expect(list.hasAttribute("aria-describedby")).toBe(false);
  });

  test("Add filter focuses the new row's field; Remove moves focus to the next filter, else the one before, else Add filter", async () => {
    const el = await mount();
    await openStage(el, "filter");
    el.querySelector<HTMLButtonElement>(".ui-rset__add")!.click();
    await settle();
    expect(el.value.filters).toHaveLength(3);
    const added = el.value.filters[2];
    expect(added).toMatchObject({ field: "lang", operator: "is", value: "" });
    expect(document.activeElement).toBe(filterRow(el, added.id).querySelector(".ui-rset__f-field"));
    expect(filterRow(el, added.id).querySelector(".ui-rset__remove")!.getAttribute("aria-label")).toBe("Remove filter 3");
    filterRow(el, "a").querySelector<HTMLButtonElement>(".ui-rset__remove")!.click();
    await settle();
    expect(document.activeElement).toBe(filterRow(el, "b").querySelector(".ui-rset__f-field"));
    filterRow(el, added.id).querySelector<HTMLButtonElement>(".ui-rset__remove")!.click();
    await settle();
    expect(document.activeElement).toBe(filterRow(el, "b").querySelector(".ui-rset__f-field"));
    filterRow(el, "b").querySelector<HTMLButtonElement>(".ui-rset__remove")!.click();
    await settle();
    expect(el.value.filters).toEqual([]);
    expect(document.activeElement).toBe(el.querySelector(".ui-rset__add"));
    expect(el.querySelector('[data-field="filters"] .ui-rset__hint')!.textContent).toContain("Every chunk is eligible");
  });

  test("without filter fields, a filter's field is typed in", async () => {
    const el = await fixture<TcRetrievalSettings>(html`<tc-retrieval-settings stage="filter"></tc-retrieval-settings>`);
    el.querySelector<HTMLButtonElement>(".ui-rset__add")!.click();
    await settle();
    const field = el.querySelector<HTMLInputElement>(".ui-rset__f-field")!;
    expect(field.tagName).toBe("INPUT");
    setInput(field, "region");
    await settle();
    expect(el.value.filters[0].field).toBe("region");
    // No models: Rerank is a switch only
    await openStage(el, "rerank");
    expect(el.querySelector(".ui-rset__model")).toBeNull();
  });

  test("controlled: preventDefault() keeps the value; a removal that's prevented keeps focus", async () => {
    const el = await mount();
    el.addEventListener("tc-value-change", (e) => e.preventDefault());
    setInput(num(el, "topK"), "12");
    await settle();
    expect(el.value).toBe(VALUE);
    expect(num(el, "topK").value).toBe("40");
    await openStage(el, "filter");
    const remove = filterRow(el, "a").querySelector<HTMLButtonElement>(".ui-rset__remove")!;
    remove.focus();
    remove.click();
    await settle();
    expect(el.value.filters).toHaveLength(2);
    expect(document.activeElement).toBe(remove);
    await openStage(el, "rerank");
    el.querySelector<HTMLButtonElement>(".ui-rset__switch")!.click();
    await settle();
    expect(el.querySelector(".ui-rset__switch")!.getAttribute("aria-checked")).toBe("true");
  });

  test("a different chunking from the index says the sources will be re-indexed", async () => {
    const el = await mount();
    el.indexed = { chunkSize: 512, chunkOverlap: 64 };
    await settle();
    expect(el.querySelector(".ui-rset__note")).toBeNull();
    setInput(num(el, "chunkSize"), "1024");
    await settle();
    expect(el.querySelector(".ui-rset__note")!.textContent).toBe("Sources are indexed at 512 / 64 – saving re-indexes them.");
  });

  test("forms: the config as JSON under name, validity, reset, and a disabled fieldset", async () => {
    const form = await fixture<HTMLFormElement>(html`<form><fieldset><tc-retrieval-settings name="rag" .value=${VALUE} .filterFields=${FIELDS}></tc-retrieval-settings></fieldset></form>`);
    const el = form.querySelector("tc-retrieval-settings")!;
    expect(JSON.parse(new FormData(form).get("rag") as string)).toEqual(VALUE);
    expect(form.checkValidity()).toBe(true);
    setInput(num(el, "chunkOverlap"), "700");
    await settle();
    expect(form.checkValidity()).toBe(false);
    form.reset();
    await settle();
    expect(el.value).toBe(VALUE);
    expect(form.checkValidity()).toBe(true);
    // Retrieve's fields and Filter's Add filter, both off once the fieldset is
    const topK = num(el, "topK");
    form.querySelector("fieldset")!.disabled = true;
    await settle();
    await settle();
    expect(new FormData(form).get("rag")).toBeNull();
    expect(el.hasAttribute("data-disabled")).toBe(true);
    expect(topK.disabled).toBe(true);
    el.stage = "filter";
    await settle();
    expect(el.querySelector<HTMLButtonElement>(".ui-rset__add")!.disabled).toBe(true);
  });

  test("flat drops the card and the header; a page's own name is kept", async () => {
    const el = await fixture<TcRetrievalSettings>(html`<tc-retrieval-settings flat aria-label="Index settings"></tc-retrieval-settings>`);
    expect(el.querySelector(".ui-rset__card")).toBeNull();
    expect(el.querySelector(".tc-head")).toBeNull();
    expect(el.getAttribute("aria-label")).toBe("Index settings");
  });

  test("React wrapper: an uncontrolled value survives parent re-renders; title and onChange", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: number[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(RetrievalSettings, { title: "Help centre", defaultValue: VALUE, onChange: (v) => void seen.push(v.topK), "data-n": n } as React.ComponentProps<typeof RetrievalSettings>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-retrieval-settings")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Help centre");
    setInput(num(el, "topK"), "24");
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.value.topK).toBe(24);
    expect(seen).toEqual([24]);
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled value stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: RetrievalSettingsValue[] = [];
    await act(async () => root.render(React.createElement(RetrievalSettings, { value: VALUE, onChange: (v) => void asked.push(v) })));
    await settle();
    const el = host.querySelector("tc-retrieval-settings")!;
    setInput(num(el, "topK"), "24");
    await settle();
    expect(asked.map((v) => v.topK)).toEqual([24]);
    expect(el.value.topK).toBe(40);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, with an error and an estimate showing`, async () => {
      const estimate = { latencyMs: 168, cost: 0.002, contextTokens: 3800, note: "Reranking is most of the wait.", stages: { retrieve: 84, filter: 10, rerank: 74 } };
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-retrieval-settings .value=${{ ...VALUE, topN: 60 }} .filterFields=${FIELDS} .rerankModels=${MODELS} .estimate=${estimate} .indexed=${{ chunkSize: 256, chunkOverlap: 32 }}></tc-retrieval-settings>
        <tc-retrieval-settings look="clean" .value=${{ ...VALUE, rerank: false, filters: [{ id: "z", field: "product", operator: "is", value: "" }] }} .filterFields=${FIELDS} .rerankModels=${MODELS} .estimate=${estimate}></tc-retrieval-settings>
      </div>`);
      for (const a of wrap.getAnimations?.({ subtree: true }) ?? []) a.finish();
      await settle();
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
