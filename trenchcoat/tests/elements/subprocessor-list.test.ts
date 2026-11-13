/*
 * <tc-subprocessor-list> in real browsers: the table and its statuses in words, search and filters with their events,
 * Export CSV, Subscribe with its checks, the narrow card layout, controlled use, the React wrapper and axe in both
 * looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/subprocessor-list";
import { subprocessorCsv, type Subprocessor, type SubprocessorCategoryChange, type SubprocessorExport, type SubprocessorSubscribe, type TcSubprocessorList } from "../../src/elements/subprocessor-list";
import { SubprocessorList } from "../../src/elements/react/subprocessor-list";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const SUBS: Subprocessor[] = [
  { id: "nh", name: "Northwind Hosting", purpose: "Cloud hosting", categories: ["Account data", "Customer content"], location: "Ireland", transfer: "Within the EEA", added: Date.UTC(2023, 2, 1, 12), status: "active" },
  { id: "qm", name: "Quanta Models", purpose: "Model inference", categories: ["Customer content"], location: "United States", transfer: "Standard Contractual Clauses", status: "active" },
  { id: "am", name: "Atlas Mail", purpose: "Transactional email", categories: ["Account data"], location: "Germany", status: "new", effective: Date.UTC(2026, 11, 1, 12) },
  { id: "pb", name: "Pinecrest Billing", purpose: "Invoicing", categories: ["Billing data"], location: "United States", status: "removed", effective: Date.UTC(2026, 6, 31, 12) },
];

const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-sbp__row[data-id="${id}"]`)!;
const ids = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-sbp__row")].map((r) => r.dataset.id);
const choose = (select: HTMLSelectElement, value: string) => {
  select.value = value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
};
const type = (input: HTMLInputElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
};
const make = (look: "standard" | "clean" = "standard") => fixture<TcSubprocessorList>(html`<tc-subprocessor-list look=${look} description="Quanta Workspace." .subprocessors=${SUBS}></tc-subprocessor-list>`);

describe("tc-subprocessor-list", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a table named by the heading, a row per subprocessor, column headers and statuses in words`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("sbp");
      expect(el.dataset.look).toBe(look);
      const table = el.querySelector("table")!;
      expect(document.getElementById(table.getAttribute("aria-labelledby")!)!.textContent).toBe("Subprocessors");
      expect([...table.querySelectorAll("thead th")].map((th) => th.textContent)).toEqual(["Subprocessor", "Purpose", "Data", "Location", "Transfer", "Added", "Status"]);
      expect(ids(el)).toEqual(["nh", "qm", "am", "pb"]);
      expect(row(el, "nh").querySelector("th")!.textContent).toBe("Northwind Hosting");
      expect([...row(el, "nh").querySelectorAll(".ui-sbp__chip")].map((c) => c.textContent)).toEqual(["Account data", "Customer content"]);
      expect(row(el, "nh").querySelector(".ui-sbp__pill")!.textContent!.trim()).toBe("Active");
      expect(row(el, "am").querySelector(".ui-sbp__pill")!.textContent!.trim()).toMatch(/^New from /);
      expect(row(el, "pb").querySelector(".ui-sbp__pill")!.textContent!.trim()).toMatch(/^Removed on /);
      expect(row(el, "qm").querySelector(".ui-sbp__added")!.textContent).toContain("–");
      expect(el.querySelector(".ui-sbp__count")!.textContent!.replace(/\s+/g, " ").trim()).toBe("4 subprocessors · 1 new");
    });
  }

  test("search matches names, purposes, locations and categories, and announces the count", async () => {
    const el = await make();
    const q = el.querySelector<HTMLInputElement>(".ui-sbp__query")!;
    type(q, "billing");
    await settle();
    expect(ids(el)).toEqual(["pb"]);
    expect(el.query).toBe("billing");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("1 subprocessor");
    type(q, "zzz");
    await settle();
    expect(el.querySelector(".ui-sbp__empty")!.textContent).toBe("No subprocessors match.");
    expect(el.querySelector<HTMLButtonElement>(".ui-sbp__export")!.disabled).toBe(true);
  });

  test("filters: data category and location, each a cancelable change event with its value", async () => {
    const el = await make();
    const cat = el.querySelector<HTMLSelectElement>(".ui-sbp__category")!;
    expect([...cat.options].map((o) => o.text)).toEqual(["All", "Account data", "Billing data", "Customer content"]);
    const seen: SubprocessorCategoryChange[] = [];
    el.addEventListener("tc-category-change", (e) => seen.push((e as CustomEvent<SubprocessorCategoryChange>).detail));
    choose(cat, "Customer content");
    await settle();
    expect(seen).toEqual([{ category: "Customer content" }]);
    expect(ids(el)).toEqual(["nh", "qm"]);
    choose(el.querySelector<HTMLSelectElement>(".ui-sbp__location")!, "United States");
    await settle();
    expect(ids(el)).toEqual(["qm"]);
    el.addEventListener("tc-category-change", (e) => e.preventDefault());
    choose(cat, "");
    await settle();
    expect(el.category).toBe("Customer content");
    expect(cat.value).toBe("Customer content");
  });

  test("Export CSV fires tc-export with the rows shown; formulas are neutralised and commas quoted", async () => {
    const el = await make();
    const seen: SubprocessorExport[] = [];
    el.addEventListener("tc-export", (e) => {
      seen.push((e as CustomEvent<SubprocessorExport>).detail);
      e.preventDefault();
    });
    choose(el.querySelector<HTMLSelectElement>(".ui-sbp__location")!, "Ireland");
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-sbp__export")!.click();
    expect(seen[0].rows.map((r) => r.id)).toEqual(["nh"]);
    expect(seen[0].filename).toBe("subprocessors.csv");
    expect(seen[0].csv.split("\r\n")).toEqual(["Name,Purpose,Data categories,Location,Transfer,Added,Status,Effective", "Northwind Hosting,Cloud hosting,Account data; Customer content,Ireland,Within the EEA,2023-03-01,active,"]);
    expect(subprocessorCsv([{ id: "x", name: "=SUM(A1)", purpose: 'Say "hi", then', categories: [], location: "-", status: "active" }]).split("\r\n")[1]).toBe(`'=SUM(A1),"Say ""hi"", then",,'-,,,active,`);
  });

  test("Subscribe: an empty or bad email is said in words and focused; a good one fires tc-subscribe and confirms", async () => {
    const el = await make();
    const field = el.querySelector<HTMLInputElement>(".ui-sbp__email")!;
    const submit = el.querySelector<HTMLButtonElement>(".ui-sbp__sub-btn")!;
    const seen: SubprocessorSubscribe[] = [];
    el.addEventListener("tc-subscribe", (e) => seen.push((e as CustomEvent<SubprocessorSubscribe>).detail));
    submit.click();
    await settle();
    expect(el.querySelector(".ui-sbp__error")!.textContent).toBe("Enter an email address.");
    expect(field.getAttribute("aria-invalid")).toBe("true");
    expect(field.getAttribute("aria-describedby")!.split(" ")).toContain(el.querySelector(".ui-sbp__error")!.id);
    await expect.poll(() => document.activeElement).toBe(field);
    type(field, "priya@");
    submit.click();
    await settle();
    expect(el.querySelector(".ui-sbp__error")!.textContent).toBe("Enter an email address like name@example.org.");
    expect(seen).toEqual([]);
    type(field, " priya@halvorsen.example ");
    await settle();
    expect(el.querySelector(".ui-sbp__error")).toBeNull();
    submit.click();
    await settle();
    expect(seen).toEqual([{ email: "priya@halvorsen.example" }]);
    expect(el.querySelector(".ui-sbp__done")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Subscribed – we'll email priya@halvorsen.example when this list changes.");
  });

  test("Subscribe prevented: the form stays; hide-subscribe leaves it out", async () => {
    const el = await make();
    el.addEventListener("tc-subscribe", (e) => e.preventDefault());
    type(el.querySelector<HTMLInputElement>(".ui-sbp__email")!, "a@b.org");
    el.querySelector<HTMLButtonElement>(".ui-sbp__sub-btn")!.click();
    await settle();
    expect(el.querySelector(".ui-sbp__subscribe")).toBeTruthy();
    el.hideSubscribe = true;
    await settle();
    expect(el.querySelector(".ui-sbp__subscribe")).toBeNull();
  });

  test("empty: says so; narrow: each subprocessor becomes a card with its labels shown", async () => {
    const empty = await fixture<TcSubprocessorList>(html`<tc-subprocessor-list></tc-subprocessor-list>`);
    expect(empty.querySelector(".ui-sbp__empty")!.textContent).toBe("No subprocessors listed.");
    cleanup();
    const wrap = await fixture<HTMLElement>(html`<div style="width: 340px"><tc-subprocessor-list .subprocessors=${SUBS}></tc-subprocessor-list></div>`);
    const el = wrap.querySelector("tc-subprocessor-list")!;
    expect(el.getBoundingClientRect().width).toBeLessThanOrEqual(341);
    const label = row(el, "nh").querySelector<HTMLElement>(".ui-sbp__label")!;
    expect(getComputedStyle(label).display).not.toBe("none");
    expect(row(el, "nh").getBoundingClientRect().right).toBeLessThanOrEqual(el.getBoundingClientRect().right + 1);
    expect(el.querySelector("table")!.getAttribute("role")).toBe("table");
  });

  test("React wrapper: an uncontrolled search survives re-renders; controlled filters stay until the parent changes them", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(SubprocessorList, {
        title: "Vendors",
        subprocessors: SUBS,
        location: null,
        onLocationChange: (l) => void seen.push(l),
        onQueryChange: (q) => void seen.push(q),
        onSubscribe: (email) => (seen.push(email), false),
        "data-n": n,
      } as React.ComponentProps<typeof SubprocessorList>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-subprocessor-list")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Vendors");
    type(el.querySelector<HTMLInputElement>(".ui-sbp__query")!, "mail");
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.query).toBe("mail");
    choose(el.querySelector<HTMLSelectElement>(".ui-sbp__location")!, "Germany");
    await settle();
    expect(el.location).toBeNull();
    type(el.querySelector<HTMLInputElement>(".ui-sbp__email")!, "a@b.org");
    el.querySelector<HTMLButtonElement>(".ui-sbp__sub-btn")!.click();
    await settle();
    expect(el.querySelector(".ui-sbp__subscribe")).toBeTruthy();
    expect(seen).toEqual(["mail", "Germany", "a@b.org"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, wide and narrow`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-subprocessor-list .subprocessors=${SUBS}></tc-subprocessor-list>
        <div style="width: 340px"><tc-subprocessor-list look="clean" .subprocessors=${SUBS}></tc-subprocessor-list></div>
      </div>`);
      const bad = wrap.querySelector("tc-subprocessor-list")!;
      bad.querySelector<HTMLButtonElement>(".ui-sbp__sub-btn")!.click();
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
