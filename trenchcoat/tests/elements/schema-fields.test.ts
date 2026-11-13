/*
 * <tc-schema-fields> in real browsers: fields from a JSON Schema (types, enums, defaults, limits, $refs), nesting and
 * Expand all, the filter, Copy link, the keyboard, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/schema-fields";
import { fieldTypeWords, schemaConstraints, schemaToFields, type JsonSchema, type TcSchemaFields } from "../../src/elements/schema-fields";
import { SchemaFields } from "../../src/elements/react/schema-fields";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const SCHEMA: JsonSchema = {
  type: "object",
  required: ["id", "owner"],
  properties: {
    id: { type: "string", pattern: "^REC-\\d{6}$", description: "The record's `id`." },
    title: { type: "string", minLength: 1, maxLength: 200 },
    classification: { type: "string", enum: ["public", "internal", "restricted"], default: "internal", description: "Who may see it. **Restricted** needs a [scope](https://example.org/scopes)." },
    owner: { $ref: "#/$defs/Person", description: "Who is accountable." },
    tags: { type: "array", items: { $ref: "#/$defs/Tag" } },
    archived: { type: "boolean", deprecated: true },
    link: { type: "string", description: "A [bad link](javascript:void0)." },
  },
  $defs: {
    Person: { type: "object", title: "Person", required: ["email"], properties: { email: { type: "string", format: "email" }, unit: { type: "string" } } },
    Tag: { type: "object", title: "Tag", properties: { label: { type: "string" } } },
  },
};

const make = (look: "standard" | "clean" = "standard", extra: Partial<TcSchemaFields> = {}) =>
  fixture<TcSchemaFields>(html`<tc-schema-fields look=${look} heading="Record" .schema=${SCHEMA} .expanded=${extra.expanded ?? []} search-threshold=${extra.searchThreshold ?? 8}></tc-schema-fields>`);
const paths = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-scf__row")].map((r) => r.dataset.path);
const row = (el: Element, path: string) => el.querySelector<HTMLElement>(`.ui-scf__row[data-path="${path}"]`)!;

describe("tc-schema-fields", () => {
  test("schemaToFields reads types, formats, enums, defaults, limits, $refs and nesting", () => {
    const fields = schemaToFields(SCHEMA);
    const by = Object.fromEntries(fields.map((f) => [f.name, f]));
    expect(fields.map((f) => f.name)).toEqual(["id", "title", "classification", "owner", "tags", "archived", "link"]);
    expect(by.id.required).toBe(true);
    expect(by.id.constraints).toEqual(["Pattern: ^REC-\\d{6}$"]);
    expect(by.title.constraints).toEqual(["1–200 characters"]);
    expect(by.classification.enum).toEqual(["public", "internal", "restricted"]);
    expect(by.classification.default).toBe("internal");
    expect(by.owner.type).toBe("Person");
    expect(by.owner.description).toBe("Who is accountable.");
    expect(by.owner.fields!.map((f) => [f.name, f.required ?? false, fieldTypeWords(f)])).toEqual([
      ["email", true, "string · email"],
      ["unit", false, "string"],
    ]);
    expect(fieldTypeWords(by.tags)).toBe("array of Tag");
    expect(by.tags.fields!.map((f) => f.name)).toEqual(["label"]);
    expect(by.archived.deprecated).toBe(true);
    expect(schemaConstraints({ minimum: 0, maximum: 9, minItems: 2, maxItems: 2, uniqueItems: true })).toEqual(["Exactly 2 items", "Minimum 0", "Maximum 9", "No repeats"]);
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a list of fields with types and words, one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("scf");
      expect(el.dataset.look).toBe(look);
      expect(paths(el)).toEqual(["id", "title", "classification", "owner", "tags", "archived", "link"]);
      expect(el.querySelector(".ui-scf__total")!.textContent).toBe("10 fields");
      expect(row(el, "id").querySelector(".ui-scf__req")!.textContent).toBe("Required");
      expect(row(el, "title").querySelector(".ui-scf__req")!.textContent).toBe("Optional");
      expect(row(el, "archived").querySelector(".ui-scf__req")!.textContent).toBe("Deprecated");
      expect(row(el, "tags").querySelector(".ui-scf__type")!.textContent).toBe("array of Tag");
      expect([...row(el, "classification").querySelectorAll(".ui-scf__chip")].map((c) => c.textContent)).toEqual(["public", "internal", "restricted"]);
      expect(row(el, "classification").querySelector(".ui-scf__meta")!.textContent).toContain("Default: internal");
      expect(el.querySelectorAll('.ui-scf__list [data-at][tabindex="0"]')).toHaveLength(1);
      expect(el.querySelector(".ui-scf__list")!.getAttribute("aria-labelledby")).toBe(el.querySelector(".tc-head__title")!.id);
    });
  }

  test("descriptions draw code, bold and safe links only", async () => {
    const el = await make();
    expect(row(el, "id").querySelector(".ui-scf__desc code")!.textContent).toBe("id");
    const cls = row(el, "classification").querySelector(".ui-scf__desc")!;
    expect(cls.querySelector("strong")!.textContent).toBe("Restricted");
    expect(cls.querySelector("a")!.getAttribute("href")).toBe("https://example.org/scopes");
    const bad = row(el, "link").querySelector(".ui-scf__desc")!;
    expect(bad.querySelector("a")).toBeNull();
    expect(bad.textContent).toBe("A bad link.");
  });

  test("a nested field opens and closes; Expand all opens every level; the event can be prevented", async () => {
    const el = await make();
    const seen: unknown[] = [];
    el.addEventListener("tc-expanded-change", (e) => seen.push((e as CustomEvent).detail));
    const toggle = row(el, "owner").querySelector<HTMLButtonElement>(".ui-scf__toggle")!;
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.textContent).toContain("2 fields");
    toggle.click();
    await settle();
    expect(paths(el)).toContain("owner.email");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    const group = el.querySelector<HTMLElement>(`#${toggle.getAttribute("aria-controls")}`)!;
    expect(group.classList.contains("ui-scf__group")).toBe(true);
    expect(row(el, "owner.email").closest(".ui-scf__group")).toBe(group);
    expect(seen).toEqual([{ expanded: ["owner"], path: "owner", open: true }]);
    el.querySelector<HTMLButtonElement>(".ui-scf__all")!.click();
    await settle();
    expect(el.expanded.sort()).toEqual(["owner", "tags"]);
    expect(el.querySelector(".ui-scf__all")!.textContent!.trim()).toBe("Collapse all");
    el.addEventListener("tc-expanded-change", (e) => e.preventDefault());
    el.querySelector<HTMLButtonElement>(".ui-scf__all")!.click();
    await settle();
    expect(el.expanded.sort()).toEqual(["owner", "tags"]);
  });

  test("the filter keeps matches and the fields above them, opened, and says how many match", async () => {
    const el = await make("standard", { searchThreshold: 0 });
    const input = el.querySelector<HTMLInputElement>(".ui-scf__input")!;
    input.value = "email";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(el.query).toBe("email");
    expect(paths(el)).toEqual(["owner", "owner.email"]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("2 fields match");
    input.value = "zzz";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(paths(el)).toEqual([]);
    expect(el.querySelector(".ui-scf__empty")!.textContent).toBe("No fields match");
  });

  test("the filter box appears at the threshold", async () => {
    const el = await make("standard", { searchThreshold: 11 });
    expect(el.querySelector(".ui-scf__search")).toBeNull();
    el.searchThreshold = 10;
    await settle();
    expect(el.querySelector(".ui-scf__search")).not.toBeNull();
  });

  test("each field has an anchor; Copy link fires tc-anchor-copy with the address, and can be prevented", async () => {
    const el = await make();
    el.anchorBase = "https://docs.example/records";
    await settle();
    expect(row(el, "title").id).toBe("field-title");
    let detail: unknown = null;
    el.addEventListener("tc-anchor-copy", (e) => {
      detail = (e as CustomEvent).detail;
      e.preventDefault();
    });
    const copy = row(el, "title").querySelector<HTMLButtonElement>(".ui-scf__copy")!;
    expect(copy.textContent!.trim()).toBe("Copy link to title");
    copy.click();
    await settle();
    expect(detail).toEqual({ id: "field-title", path: "title", url: "https://docs.example/records#field-title" });
    expect(el.querySelector('[role="status"]')!.textContent).toBe("");
  });

  test("keyboard: ↑ ↓ move, → opens then moves to Copy link, ← closes and climbs, Home and End", async () => {
    const el = await make();
    const at = () => (document.activeElement as HTMLElement).closest<HTMLElement>(".ui-scf__row")?.dataset.path;
    const key = (k: string) => document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
    el.querySelector<HTMLElement>('[data-at="0:0"]')!.focus();
    for (const path of ["title", "classification", "owner"]) {
      key("ArrowDown");
      await expect.poll(at).toBe(path);
    }
    key("ArrowRight");
    await expect.poll(() => el.expanded).toEqual(["owner"]);
    key("ArrowRight");
    await expect.poll(() => (document.activeElement as HTMLElement).classList.contains("ui-scf__copy")).toBe(true);
    key("ArrowLeft");
    await expect.poll(() => (document.activeElement as HTMLElement).classList.contains("ui-scf__toggle")).toBe(true);
    key("ArrowDown");
    await expect.poll(at).toBe("owner.email");
    key("ArrowLeft");
    await expect.poll(at).toBe("owner");
    key("ArrowLeft");
    await expect.poll(() => el.expanded).toEqual([]);
    key("End");
    await expect.poll(at).toBe("link");
    key("Home");
    await expect.poll(at).toBe("id");
    expect(el.querySelectorAll('.ui-scf__list [data-at][tabindex="0"]')).toHaveLength(1);
  });

  test("fields win over schema; empty says so; words can be renamed", async () => {
    const el = await make();
    el.fields = [{ name: "count", type: "integer", required: true }];
    el.labels = { required: "Must" };
    await settle();
    expect(paths(el)).toEqual(["count"]);
    expect(el.querySelector(".ui-scf__req")!.textContent).toBe("Must");
    el.fields = [];
    await settle();
    expect(el.querySelector(".ui-scf__empty")!.textContent).toBe("No fields");
  });

  test("React: expanded is kept across re-renders uncontrolled, and stays put when controlled", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    const root = createRoot(wrap);
    const seen: string[][] = [];
    const render = (props: Partial<React.ComponentProps<typeof SchemaFields>>) => act(async () => root.render(React.createElement(SchemaFields, { title: "Record", schema: SCHEMA, ...props })));
    await render({ onExpandedChange: (x) => void seen.push(x) });
    const el = wrap.querySelector<TcSchemaFields>("tc-schema-fields")!;
    await settle();
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Record");
    el.querySelector<HTMLButtonElement>('.ui-scf__row[data-path="owner"] .ui-scf__toggle')!.click();
    await settle();
    await render({ onExpandedChange: (x) => void seen.push(x) });
    await settle();
    expect(el.expanded).toEqual(["owner"]);
    expect(seen).toEqual([["owner"]]);
    await render({ expanded: [], onExpandedChange: (x) => void seen.push(x) });
    await settle();
    el.querySelector<HTMLButtonElement>('.ui-scf__row[data-path="owner"] .ui-scf__toggle')!.click();
    await settle();
    expect(el.expanded).toEqual([]);
    expect(seen).toEqual([["owner"], ["owner"]]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = document.body.appendChild(document.createElement("div"));
      wrap.style.cssText = `color-scheme: ${theme}`;
      wrap.innerHTML = `<tc-schema-fields look="standard" search-threshold="0"></tc-schema-fields><tc-schema-fields look="clean" id-prefix="b"></tc-schema-fields>`;
      wrap.querySelectorAll<TcSchemaFields>("tc-schema-fields").forEach((el) => {
        el.schema = SCHEMA;
        el.expanded = ["owner", "tags"];
      });
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
