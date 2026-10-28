/*
 * <tc-query-builder> in real browsers: conditions and a nested group, operators by type, the read-back in words and
 * as a query string, AND / OR, adding and removing, controlled use, Run, the React wrapper and axe in both looks and
 * both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/query-builder";
import type { QueryField, QueryGroup, QuerySubmit, QueryValueChange, TcQueryBuilder } from "../../src/elements/query-builder";
import { QueryBuilder } from "../../src/elements/react/query-builder";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const FIELDS: QueryField[] = [
  { id: "type", label: "Type", type: "enum", options: [{ value: "document", label: "Document" }, { value: "image", label: "Image" }, { value: "audio", label: "Audio" }] },
  { id: "owner", label: "Owner", type: "text" },
  { id: "updated", label: "Updated", type: "date" },
  { id: "pages", label: "Pages", type: "number" },
];
const QUERY: QueryGroup = {
  kind: "group",
  id: "root",
  join: "and",
  children: [
    { kind: "condition", id: "c1", field: "type", operator: "is", value: "document" },
    {
      kind: "group",
      id: "g1",
      join: "or",
      children: [
        { kind: "condition", id: "c2", field: "owner", operator: "is", value: "K. Osei" },
        { kind: "condition", id: "c3", field: "updated", operator: "after", value: "2026-06-01" },
      ],
    },
  ],
};

const dateWords = (y: number, m: number, d: number) => new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(new Date(y, m - 1, d));
const cond = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-node="${id}"]`)!;
const make = (look: "standard" | "clean" = "standard", value: QueryGroup = QUERY) =>
  fixture<TcQueryBuilder>(html`<tc-query-builder look=${look} description="Find files." .fields=${FIELDS} .value=${value}></tc-query-builder>`);
const change = (el: HTMLInputElement | HTMLSelectElement, value: string) => {
  el.value = value;
  el.dispatchEvent(new Event("change", { bubbles: true }));
};

describe("tc-query-builder", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the host, the conditions with labelled controls, the nested group and the read-back`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("qb");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelectorAll(".ui-qb__cond")).toHaveLength(3);
      expect(el.querySelectorAll(".ui-qb__group[data-nested]")).toHaveLength(1);
      expect(cond(el, "c1").querySelector("select")!.getAttribute("aria-label")).toBe("Field, condition 1");
      expect(cond(el, "c3").querySelector("input")!.getAttribute("aria-label")).toBe("Value, condition 3");
      expect(el.summary).toBe(`Type is Document AND (Owner is “K. Osei” OR Updated after ${dateWords(2026, 6, 1)})`);
      expect(el.query).toBe('type:document AND (owner:"K. Osei" OR updated:>2026-06-01)');
      expect(el.querySelector(".ui-qb__query")!.textContent).toBe(el.query);
    });
  }

  test("operators fit the field's type; changing the field resets the operator and value; any-of picks options as chips", async () => {
    const el = await make();
    const ops = (id: string) => [...cond(el, id).querySelectorAll<HTMLOptionElement>(".ui-qb__op option")].map((o) => o.value);
    expect(ops("c1")).toEqual(["is", "is-not", "any-of"]);
    expect(ops("c2")).toEqual(["is", "is-not", "contains", "starts-with"]);
    expect(ops("c3")).toEqual(["is", "before", "after", "between"]);
    change(cond(el, "c2").querySelector<HTMLSelectElement>(".ui-qb__field")!, "pages");
    await settle();
    expect(ops("c2")).toEqual(["is", "is-not", "gt", "lt", "between"]);
    expect(cond(el, "c2").querySelector<HTMLInputElement>(".ui-qb__value input")!.type).toBe("number");
    // An incomplete condition is left out of the read-back
    expect(el.query).toBe("type:document AND updated:>2026-06-01");
    change(cond(el, "c1").querySelector<HTMLSelectElement>(".ui-qb__op")!, "any-of");
    await settle();
    const chips = [...cond(el, "c1").querySelectorAll<HTMLButtonElement>(".ui-qb__chip")];
    expect(chips.map((c) => c.textContent!.trim())).toEqual(["Document", "Image", "Audio"]);
    chips[0].click();
    await settle();
    cond(el, "c1").querySelectorAll<HTMLButtonElement>(".ui-qb__chip")[2].click();
    await settle();
    expect(cond(el, "c1").querySelectorAll('.ui-qb__chip[aria-pressed="true"]')).toHaveLength(2);
    expect(el.query).toBe("type:(document OR audio) AND updated:>2026-06-01");
    expect(el.summary.startsWith("Type is any of Document, Audio AND")).toBe(true);
  });

  test("between takes two values; text operators quote and wildcard; is-not negates", async () => {
    const el = await make("standard", {
      kind: "group",
      id: "root",
      join: "or",
      children: [
        { kind: "condition", id: "a", field: "pages", operator: "between", value: ["10", "40"] },
        { kind: "condition", id: "b", field: "owner", operator: "contains", value: "Osei" },
        { kind: "condition", id: "c", field: "owner", operator: "starts-with", value: "K" },
        { kind: "condition", id: "d", field: "type", operator: "is-not", value: "image" },
      ],
    });
    expect(el.query).toBe("pages:10..40 OR owner:*Osei* OR owner:K* OR -type:image");
    expect(el.summary).toBe("Pages between 10 and 40 OR Owner contains “Osei” OR Owner starts with “K” OR Type is not Image");
    expect([...cond(el, "a").querySelectorAll("input")].map((i) => i.getAttribute("aria-label"))).toEqual(["From, condition 1", "To, condition 1"]);
  });

  test("AND / OR per group, adding conditions and a group, removing them; tc-value-change each time", async () => {
    const el = await make();
    const seen: QueryGroup[] = [];
    el.addEventListener("tc-value-change", (e) => seen.push((e as CustomEvent<QueryValueChange>).detail.value));
    const nestedOr = el.querySelector<HTMLInputElement>('[data-node="g1"] .ui-qb__join input[value="and"]')!;
    nestedOr.click();
    await settle();
    expect(el.query).toBe('type:document AND (owner:"K. Osei" AND updated:>2026-06-01)');
    el.querySelector<HTMLInputElement>('[data-node="root"] > .ui-qb__group-head input[value="or"]')!.click();
    await settle();
    expect(el.value.join).toBe("or");
    // Add a condition to the top group: it takes the first field, and focus goes to its field
    const adds = [...el.querySelectorAll<HTMLButtonElement>('[data-node="root"] > .ui-qb__adds .ui-qb__add')];
    expect(adds.map((b) => b.textContent!.trim())).toEqual(["Condition", "Group"]);
    adds[0].click();
    await settle();
    expect(el.value.children).toHaveLength(3);
    await expect.poll(() => document.activeElement?.classList.contains("ui-qb__field")).toBe(true);
    adds[1].click();
    await settle();
    expect(el.querySelectorAll(".ui-qb__group[data-nested]")).toHaveLength(2);
    // A nested group can't hold another group
    expect(el.querySelectorAll('[data-node="g1"] .ui-qb__add')).toHaveLength(1);
    // Remove the first condition and the first group
    cond(el, "c1").querySelector<HTMLButtonElement>(".ui-qb__remove")!.click();
    await settle();
    el.querySelector<HTMLButtonElement>('[data-node="g1"] .ui-qb__remove--group')!.click();
    await settle();
    expect(el.value.children.map((n) => n.kind)).toEqual(["condition", "group"]);
    expect(seen).toHaveLength(6);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Group removed");
  });

  test("controlled: preventDefault() keeps the value, and the controls show it again", async () => {
    const el = await make();
    el.addEventListener("tc-value-change", (e) => e.preventDefault());
    const input = cond(el, "c2").querySelector<HTMLInputElement>(".ui-qb__value input")!;
    change(input, "Someone else");
    await settle();
    expect(el.value).toBe(QUERY);
    expect(input.value).toBe("K. Osei");
  });

  test("Run fires tc-submit with the tree and the query string; an empty builder reads as everything", async () => {
    const el = await make();
    const got: QuerySubmit[] = [];
    el.addEventListener("tc-submit", (e) => got.push((e as CustomEvent<QuerySubmit>).detail));
    el.querySelector<HTMLButtonElement>(".ui-qb__run")!.click();
    expect(got).toEqual([{ value: QUERY, query: el.query }]);
    const empty = await fixture<TcQueryBuilder>(html`<tc-query-builder .fields=${FIELDS}></tc-query-builder>`);
    expect(empty.querySelector(".ui-qb__summary-empty")!.textContent).toContain("Everything");
    expect(empty.querySelector<HTMLButtonElement>(".ui-qb__copy")!.disabled).toBe(true);
    expect(empty.querySelector(".ui-qb__empty")).toBeTruthy();
  });

  test("React wrapper: uncontrolled edits survive parent re-renders; onValueChange and onRun get the query", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const changes: QueryGroup[] = [];
    const runs: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(QueryBuilder, {
        title: "Find files",
        fields: FIELDS,
        defaultValue: QUERY,
        onValueChange: (v) => void changes.push(v),
        onRun: (_v, q) => void runs.push(q),
        "data-n": n,
      } as React.ComponentProps<typeof QueryBuilder>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-query-builder")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Find files");
    el.querySelector<HTMLInputElement>('[data-node="root"] > .ui-qb__group-head input[value="or"]')!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.value.join).toBe("or");
    expect(changes).toHaveLength(1);
    el.querySelector<HTMLButtonElement>(".ui-qb__run")!.click();
    expect(runs).toEqual(['type:document OR (owner:"K. Osei" OR updated:>2026-06-01)']);
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled value stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: QueryGroup[] = [];
    await act(async () => root.render(React.createElement(QueryBuilder, { fields: FIELDS, value: QUERY, onValueChange: (v) => void asked.push(v) })));
    await settle();
    const el = host.querySelector("tc-query-builder")!;
    el.querySelector<HTMLInputElement>('[data-node="root"] > .ui-qb__group-head input[value="or"]')!.click();
    await settle();
    expect(asked).toHaveLength(1);
    expect(el.value.join).toBe("and");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-query-builder description="Find files." .fields=${FIELDS} .value=${QUERY}></tc-query-builder>
        <tc-query-builder look="clean" .fields=${FIELDS} .value=${{ ...QUERY, children: [{ kind: "condition", id: "x", field: "type", operator: "any-of", value: ["image"] }] }}></tc-query-builder>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
