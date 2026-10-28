/*
 * trenchcoat/generative and tc-generated-ui's component block in real browsers: the schema check (bad props dropped
 * and reported, unsafe links refused, sizes capped), a component placed by a block and its events passed on, an
 * unknown tag shown as text, tool definitions and mountComponent.
 */
import { html } from "lit";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/generated-ui";
import type { GeneratedUiComponentEvent, GeneratedUiSpecCheck, TcGeneratedUi } from "../../src/elements/generated-ui";
import type { TcStatusTracker } from "../../src/elements/status-tracker";
import { catalog, catalogPrompt, checkComponent, checkProps, isGeneratable, isLinkField, isResourceField, loadSchema, MAX_ITEMS, mountComponent, tagOfTool, toolDefinitions, toolName, type Schema } from "../../src/generative";
import { registry } from "../../src/generative/registry";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const STEPS = [
  { id: "g1", label: "Security review", status: "cleared" },
  { id: "g2", label: "Load test", status: "pending", attention: "p95 over budget", detail: { summary: "Runs nightly.", items: [{ label: "Report", href: "https://example.com/r" }] } },
  { id: "g3", label: "Launch", status: "not-reached" },
];

describe("trenchcoat/generative", () => {
  test("the catalogue and schemas: every catalogued tag has a schema; app-controlled elements aren't in it", async () => {
    expect(catalog.length).toBeGreaterThan(150);
    expect(isGeneratable("tc-status-tracker")).toBe(true);
    for (const tag of ["tc-dialog", "tc-chat-composer", "tc-look-provider", "tc-generated-ui"]) expect(isGeneratable(tag)).toBe(false);
    const schema = await loadSchema("tc-status-tracker");
    expect(schema?.properties?.steps).toBeTruthy();
    expect(schema?.properties).not.toHaveProperty("look");
    expect(await loadSchema("tc-dialog")).toBeNull();
  });

  test("checkComponent: what fits the schema is kept; the rest is left out and said why", async () => {
    const checked = await checkComponent("tc-status-tracker", {
      heading: "Release gates",
      noun: 7,
      steps: [...STEPS, { id: "bad", status: "cleared" }],
      colour: "red",
      orientation: "diagonal",
    });
    expect(checked!.props.heading).toBe("Release gates");
    // A step without its required label is left out; the others stay
    expect((checked!.props.steps as unknown[]).length).toBe(3);
    expect(checked!.props).not.toHaveProperty("noun");
    expect(checked!.props).not.toHaveProperty("colour");
    expect(checked!.props).not.toHaveProperty("orientation");
    const messages = checked!.issues.map((i) => `${i.path}: ${i.message}`);
    expect(messages).toEqual(
      expect.arrayContaining([expect.stringMatching(/^props\/noun: should be string/), expect.stringMatching(/^props\/colour: not a property/), expect.stringMatching(/^props\/orientation: should be one of/), expect.stringMatching(/^props\/steps\/3: needs label/)]),
    );
  });

  test("guardrails: links must be http(s), mailto or relative; lists and strings are capped", async () => {
    const steps = [{ ...STEPS[1], detail: { items: [{ label: "x", href: "javascript:alert(1)" }, { label: "y", href: "data:text/html,hi" }, { label: "z", href: "/docs" }, { label: "w", href: "mailto:a@b.co" }] } }];
    const checked = await checkComponent("tc-status-tracker", { steps });
    const items = (checked!.props.steps as { detail: { items: { href?: string }[] } }[])[0].detail.items;
    // An unsafe link is left out; its item stays, since href is optional
    expect(items.map((i) => i.href)).toEqual([undefined, undefined, "/docs", "mailto:a@b.co"]);
    expect(checked!.issues.filter((i) => /link must be/.test(i.message))).toHaveLength(2);
    // A long list is cut, a long string is cut, and props larger than the whole budget are left out
    const many = Array.from({ length: MAX_ITEMS + 5 }, (_, i) => ({ id: `s${i}`, label: "Gate", status: "cleared" }));
    const capped = await checkComponent("tc-status-tracker", { steps: many });
    expect(capped!.props.steps).toHaveLength(MAX_ITEMS);
    expect(capped!.issues.map((i) => i.message)).toEqual([`more than ${MAX_ITEMS} items – cut to ${MAX_ITEMS}`]);
    const long = await checkComponent("tc-status-tracker", { heading: "x".repeat(5000) });
    expect((long!.props.heading as string).length).toBe(4000);
    expect(long!.issues.map((i) => i.message)).toEqual(["longer than 4000 characters – cut"]);
    const huge = await checkComponent("tc-status-tracker", { steps: Array.from({ length: 100 }, (_, i) => ({ id: `s${i}`, label: "x".repeat(3000), status: "cleared" })) });
    expect(huge!.props).toEqual({});
    expect(huge!.issues.map((i) => i.message)).toEqual(["props are larger than 200 KB – left out"]);
  });

  test("tools: one per component, named show_…, with the schema as input_schema", async () => {
    const tools = await toolDefinitions(["tc-status-tracker", "tc-coverage-ring", "tc-dialog"]);
    expect(tools.map((t) => t.name)).toEqual(["show_status_tracker", "show_coverage_ring"]);
    expect(tools[0].input_schema.type).toBe("object");
    expect(tools[0].input_schema.properties).toHaveProperty("steps");
    expect(tools[0].description).toMatch(/^Show <tc-status-tracker>: /);
    expect(tagOfTool(toolName("tc-coverage-ring"))).toBe("tc-coverage-ring");
    const prompt = catalogPrompt(["tc-status-tracker"]);
    expect(prompt).toMatch(/"type": "component"/);
    expect(prompt).toMatch(/- tc-status-tracker: /);
    expect(prompt).not.toMatch(/tc-coverage-ring/);
  });

  test("mountComponent: loads the element and sets the checked props", async () => {
    const host = await fixture<HTMLDivElement>(html`<div></div>`);
    const out = await mountComponent(host, "tc-coverage-ring", { value: 0.61, unit: "topics", nope: 1 });
    expect(out!.element.localName).toBe("tc-coverage-ring");
    expect((out!.element as unknown as { value: number }).value).toBe(0.61);
    expect(out!.issues.map((i) => i.path)).toEqual(["props/nope"]);
    expect(await mountComponent(host, "tc-dialog", {})).toBeNull();
  });
});

/* The props are untrusted model output: what someone could write to get a script, another site or a crash past the check */
describe("trenchcoat/generative: untrusted props", () => {
  const XSS = "javascript:alert(1)";

  test("__proto__ can't carry props past the check, or stand in for a required field", async () => {
    // As the SDK's JSON.parse hands it over: __proto__ as an own key
    const raw = JSON.parse(`{"events":[{"id":"a","date":1,"title":"t","__proto__":{"links":[{"label":"x","href":"${XSS}"}]}},{"__proto__":{"id":"b","date":2,"title":"u"}}]}`);
    const checked = await checkComponent("tc-entity-timeline", raw);
    const events = checked!.props.events as Record<string, unknown>[];
    // The first event keeps its own fields and an ordinary prototype; the second has nothing of its own, so it's left out
    expect(events).toHaveLength(1);
    expect(Object.getPrototypeOf(events[0])).toBe(Object.prototype);
    expect(events[0].links).toBeUndefined();
    expect(checked!.issues.map((i) => `${i.path}: ${i.message}`)).toEqual(
      expect.arrayContaining(["props/events/0/__proto__: not a property name – left out", expect.stringMatching(/^props\/events\/1: needs id, date, title/)]),
    );
    // At the top level too, and "constructor" is only a property when the schema has it
    const top = checkProps({ type: "object", properties: { a: { type: "string" } } }, JSON.parse(`{"__proto__":{"a":"x"},"constructor":{"a":"y"}}`));
    expect(top.props).toEqual({});
    expect(Object.getPrototypeOf(top.props)).toBe(Object.prototype);
    expect(top.issues.map((i) => i.path)).toEqual(["props/__proto__", "props/constructor"]);
  });

  test("a link is checked whatever it's called: …Href and …Url names, and fields the element binds to href or src", async () => {
    const notice = await checkComponent("tc-guardrail-notice", { policy: "P", policyHref: XSS });
    expect(notice!.props).toEqual({ policy: "P" });
    expect(notice!.issues.map((i) => i.path)).toEqual(["props/policyHref"]);
    // An avatar the element shows as an image is a link; a picture on a profile header too
    const header = await checkComponent("tc-profile-header", { name: "Maya", picture: "data:image/svg+xml,<svg onload=alert(1)>" });
    expect(header!.props).toEqual({ name: "Maya" });
  });

  test("protocol-relative and backslash links are another site, not a relative link", async () => {
    for (const href of ["//evil.example/x", "/\\evil.example/x", "\\\\evil.example", " JaVaScRiPt:alert(1)", "java\tscript:alert(1)", "vbscript:x"]) {
      const checked = await checkComponent("tc-guardrail-notice", { policy: "P", policyHref: href });
      expect(checked!.props, href).toEqual({ policy: "P" });
    }
    for (const href of ["/docs", "./a", "#x", "?q=1", "https://example.com", "mailto:a@b.co", "tel:+15551234"]) {
      const checked = await checkComponent("tc-guardrail-notice", { policy: "P", policyHref: href });
      expect(checked!.props.policyHref, href).toBe(href);
    }
  });

  test("every string an element binds to href or src is checked as a link (from the elements' own source)", async () => {
    const sources = import.meta.glob("../../src/elements/*.ts", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
    const BOUND = /(?:\s|\.)(href|src|xlink:href)=\$\{((?:[^{}]|\{[^{}]*\})*)\}/g;
    let checkedFields = 0;
    const unchecked: string[] = [];
    for (const { tag } of catalog) {
      const src = Object.entries(sources).find(([file, text]) => !/ \d+\.ts$/.test(file) && text.includes(`customElements.define("${tag}"`))?.[1];
      if (!src) continue;
      const names = new Map<string, boolean>();
      for (const m of src.matchAll(BOUND)) {
        if (m[2].trim().startsWith("`#")) continue;
        for (const id of m[2].matchAll(/\b([A-Za-z_]\w*)\b(?!\s*\()/g)) if (id[1] !== "this" && id[1] !== "content") names.set(id[1], names.get(id[1]) || m[1] === "src");
      }
      if (!names.size) continue;
      const schema = (await loadSchema(tag))!;
      const defs = schema.definitions ?? {};
      const strings = (node: Schema, seen = new Set<string>()): Schema[] => {
        if (node.$ref) {
          const name = decodeURIComponent(node.$ref.replace("#/definitions/", ""));
          return seen.has(name) ? [] : strings(defs[name] ?? {}, new Set([...seen, name]));
        }
        const own = [node.type].flat().includes("string") && !node.enum && !("const" in node) ? [node] : [];
        return [...own, ...(node.anyOf ?? node.oneOf ?? []).flatMap((n) => strings(n, seen)), ...[node.items ?? []].flat().flatMap((n) => strings(n, seen))];
      };
      const walk = (node: unknown) => {
        if (!node || typeof node !== "object") return;
        const n = node as Schema;
        for (const [k, v] of Object.entries(n.properties ?? {}))
          if (names.has(k))
            for (const leaf of strings(v)) {
              checkedFields++;
              if (!isLinkField(k, leaf)) unchecked.push(`${tag}.${k}`);
              else if (names.get(k) && !isResourceField(k, leaf)) unchecked.push(`${tag}.${k} (loads by itself)`);
            }
        Object.values(n).forEach(walk);
      };
      walk(schema);
    }
    expect(checkedFields).toBeGreaterThan(30);
    expect(unchecked).toEqual([]);
  });

  test("not: {} – a field the schema can't describe (an element) is left out, not copied as it is", async () => {
    const checked = await checkComponent("tc-agent-lanes", { tasks: [{ id: "t", agentId: "a", title: "T", status: "running", start: 1, tools: ["x", { cloneNode: 1 }] }] });
    const task = (checked!.props.tasks as { tools: unknown[] }[])[0];
    expect(task.tools).toEqual([]);
    expect(checked!.issues.filter((i) => i.message === "not allowed here – left out")).toHaveLength(2);
  });

  test("anyOf keeps the branch that keeps the most, and maps and nested values still get the guardrails", () => {
    const schema: Schema = { type: "object", properties: { v: { anyOf: [{ type: "array", items: { type: "string" } }, { type: "array", items: { type: "number" } }] }, any: { type: "object" } } };
    const checked = checkProps(schema, { v: [1, 2, 3], any: { deep: { href: XSS, ok: "fine" } } });
    expect(checked.props).toEqual({ v: [1, 2, 3], any: { deep: { ok: "fine" } } });
    expect(checked.issues.map((i) => i.path)).toEqual(["props/any/deep/href"]);
  });

  test("allowedOrigins holds images to the app's origins; clicked links aren't held", async () => {
    const props = { name: "Maya", picture: "https://attacker.example/p.png?d=secret", actions: [] };
    expect((await checkComponent("tc-profile-header", props))!.props.picture).toBe(props.picture);
    const held = await checkComponent("tc-profile-header", props, { allowedOrigins: ["https://cdn.example.com"] });
    expect(held!.props).not.toHaveProperty("picture");
    expect(held!.issues[0].message).toBe("loads from https://attacker.example, which isn't an allowed origin – left out");
    for (const picture of ["https://cdn.example.com/a.png", "/img/a.png"]) expect((await checkComponent("tc-profile-header", { name: "M", picture }, { allowedOrigins: ["https://cdn.example.com/"] }))!.props.picture).toBe(picture);
    const link = await checkComponent("tc-guardrail-notice", { policy: "P", policyHref: "https://anywhere.example" }, { allowedOrigins: ["https://cdn.example.com"] });
    expect(link!.props.policyHref).toBe("https://anywhere.example");
  });

  test("colours are colours: no url(), image() or anything else that loads", () => {
    const schema: Schema = { type: "object", properties: { color: { type: "string" }, colors: { type: "object", additionalProperties: { type: "string" } } } };
    const checked = checkProps(schema, { color: "url(https://evil.example/x)", colors: { ok: "oklch(0.6 0.1 200)", mix: "color-mix(in srgb, var(--tc-chart-1) 40%, white)", bad: "image-set('https://evil.example/x' 1x)", semi: "red; background: url(x)" } });
    expect(checked.props).toEqual({ colors: { ok: "oklch(0.6 0.1 200)", mix: "color-mix(in srgb, var(--tc-chart-1) 40%, white)" } });
    expect(checked.issues.map((i) => i.path)).toEqual(["props/color", "props/colors/bad", "props/colors/semi"]);
  });

  test("the schema's own limits: top-level required and additionalProperties, min/maxItems, tuples, numbers, date-time", async () => {
    const schema: Schema = {
      type: "object",
      required: ["id"],
      properties: { id: { type: "string", pattern: "^[a-z]+$" }, pair: { type: "array", items: [{ type: "number" }, { type: "number" }], minItems: 2, maxItems: 2 }, few: { type: "array", items: { type: "number", minimum: 0, maximum: 10 }, maxItems: 2 } },
      additionalProperties: { type: "boolean" },
    };
    expect(checkProps(schema, { pair: [1, 2] })).toEqual({ props: {}, issues: [{ path: "props", message: "needs id – left out" }] });
    const ok = checkProps(schema, { id: "a", pair: [1, "x"], few: [1, 20, 3, 4], extra: true, other: "no" });
    expect(ok.props).toEqual({ id: "a", few: [1], extra: true });
    expect(ok.issues.map((i) => i.path)).toEqual(["props/pair/1", "props/pair", "props/few", "props/few/1", "props/other"]);
    expect(checkProps(schema, { id: "A1" }).issues[0].message).toBe("doesn't have the expected form – left out");
    // A Date-typed field gets a Date, as the element expects – not the string
    const lanes = await checkComponent("tc-agent-lanes", { tasks: [{ id: "t", agentId: "a", title: "T", status: "running", start: "2026-10-28T09:00:00Z" }, { id: "u", agentId: "a", title: "U", status: "running", start: "next tuesday-ish" }] });
    const tasks = lanes!.props.tasks as { start: unknown }[];
    expect(tasks).toHaveLength(1);
    expect(tasks[0].start).toBeInstanceOf(Date);
    expect((tasks[0].start as Date).toISOString()).toBe("2026-10-28T09:00:00.000Z");
  });

  test("the size budget is in UTF-8 bytes, and props that aren't JSON are refused", async () => {
    // 70,000 characters, but 210,000 bytes
    const steps = Array.from({ length: 35 }, (_, i) => ({ id: `s${i}`, label: "€".repeat(2000), status: "cleared" }));
    expect((await checkComponent("tc-status-tracker", { steps }))!.issues.map((i) => i.message)).toEqual(["props are larger than 200 KB – left out"]);
    const cyclic: Record<string, unknown> = { heading: "x" };
    cyclic.self = cyclic;
    expect((await checkComponent("tc-status-tracker", cyclic))!.props).toEqual({});
  });
});

describe("tc-generated-ui: component blocks", () => {
  const mount = (spec: unknown) => fixture<TcGeneratedUi>(html`<tc-generated-ui .spec=${spec}></tc-generated-ui>`);
  const tracker = (el: Element) => el.querySelector<TcStatusTracker>("tc-status-tracker");

  test("a component block places the component with its checked props, and reports what it left out", async () => {
    const checks: GeneratedUiSpecCheck[] = [];
    const el = await fixture<TcGeneratedUi>(html`<tc-generated-ui @tc-spec-check=${(e: CustomEvent<GeneratedUiSpecCheck>) => checks.push(e.detail)}></tc-generated-ui>`);
    el.spec = { blocks: [{ type: "text", text: "Where the release stands:" }, { type: "component", tag: "tc-status-tracker", props: { heading: "Release gates", noun: "Gate", steps: STEPS, colour: "red" } }] };
    await expect.poll(() => tracker(el)?.steps?.length).toBe(3);
    const t = tracker(el)!;
    expect(t.heading).toBe("Release gates");
    expect(t.closest(".ui-gui__component")!.getAttribute("data-path")).toBe("/blocks/1");
    await expect.poll(() => el.issues.map((i) => i.path)).toEqual(["/blocks/1/props/colour"]);
    await expect.poll(() => checks.at(-1)?.issues.length).toBe(1);
  });

  test("a tag that isn't generatable, or no tag, falls back to text with the reason", async () => {
    const el = await mount([{ type: "component", tag: "tc-dialog", props: { heading: "Hi" } }, { type: "component", props: {} }]);
    await settle();
    expect(el.querySelectorAll(".ui-gui__fallback")).toHaveLength(2);
    expect(el.issues.map((i) => i.message)).toEqual(["“tc-dialog” isn't a component a model can place", "a component needs a tag"]);
    expect(el.querySelector("tc-dialog")).toBeNull();
  });

  test("the component's events come back as tc-component-event; preventing it prevents the component's own", async () => {
    const el = await mount({ blocks: [{ type: "component", tag: "tc-status-tracker", props: { noun: "Gate", steps: STEPS } }] });
    await expect.poll(() => tracker(el)?.querySelectorAll("button").length ?? 0).toBeGreaterThan(0);
    const seen: GeneratedUiComponentEvent[] = [];
    let block = false;
    el.addEventListener("tc-component-event", (e) => {
      seen.push((e as CustomEvent<GeneratedUiComponentEvent>).detail);
      if (block) e.preventDefault();
    });
    const outside: string[] = [];
    el.parentElement!.addEventListener("tc-selected-change", (e) => outside.push(e.type));
    const t = tracker(el)!;
    t.querySelector<HTMLButtonElement>("button")!.click();
    await settle();
    expect(seen).toEqual([{ block: "/blocks/0", tag: "tc-status-tracker", event: "tc-selected-change", detail: expect.objectContaining({ selected: "g1" }) }]);
    expect(t.selected).toBe("g1");
    // The component's own event doesn't also bubble past generated-ui
    expect(outside).toEqual([]);
    block = true;
    t.querySelectorAll<HTMLButtonElement>("button")[1].click();
    await settle();
    expect(t.selected).toBe("g1");
  });

  test("a component block streams like the others: it appears once its JSON closes", async () => {
    const el = await fixture<TcGeneratedUi>(html`<tc-generated-ui streaming></tc-generated-ui>`);
    el.spec = `{"blocks": [{"type": "component", "tag": "tc-coverage-ring", "props": {"value": 0.5`;
    await settle();
    expect(el.querySelector("tc-coverage-ring")).toBeNull();
    el.spec = `{"blocks": [{"type": "component", "tag": "tc-coverage-ring", "props": {"value": 0.5}}]}`;
    el.streaming = false;
    await expect.poll(() => (el.querySelector("tc-coverage-ring") as unknown as { value?: number } | null)?.value).toBe(0.5);
  });

  test("a revised answer that drops a property puts it back to the component's default", async () => {
    const el = await mount({ blocks: [{ type: "component", tag: "tc-status-tracker", props: { heading: "Release gates", noun: "Gate", steps: STEPS } }] });
    await expect.poll(() => tracker(el)?.heading).toBe("Release gates");
    const first = tracker(el);
    el.spec = { blocks: [{ type: "component", tag: "tc-status-tracker", props: { steps: STEPS, noun: 3 } }] };
    await expect.poll(() => tracker(el)?.heading).toBe("Status");
    // The same element, so what people did with it stays; a prop now left out is reset too
    expect(tracker(el)).toBe(first);
    expect(tracker(el)!.noun).toBe("Step");
  });

  test("a component whose module can't load says so, reports it, and is tried again on the next spec", async () => {
    const entry = registry["tc-coverage-ring"];
    const load = entry.load;
    entry.load = () => Promise.reject(new Error("offline"));
    try {
      const el = await mount({ blocks: [{ type: "component", tag: "tc-coverage-ring", props: { value: 0.5 } }] });
      await expect.poll(() => el.querySelector(".ui-gui__component-error")?.textContent).toBe("This coverage ring couldn't be shown.");
      expect(el.issues).toEqual([{ path: "/blocks/0", message: "tc-coverage-ring couldn't load – offline" }]);
      entry.load = load;
      el.spec = { blocks: [{ type: "component", tag: "tc-coverage-ring", props: { value: 0.5 } }] };
      await expect.poll(() => (el.querySelector("tc-coverage-ring") as unknown as { value?: number } | null)?.value).toBe(0.5);
      await expect.poll(() => el.issues).toEqual([]);
    } finally {
      entry.load = load;
    }
  });

  test("allowedOrigins on tc-generated-ui holds placed components' images to those origins", async () => {
    const el = await fixture<TcGeneratedUi>(html`<tc-generated-ui .allowedOrigins=${["https://cdn.example.com"]} .spec=${{ blocks: [{ type: "component", tag: "tc-profile-header", props: { name: "Maya", picture: "https://attacker.example/p.png" } }] }}></tc-generated-ui>`);
    await expect.poll(() => el.issues.map((i) => i.path)).toEqual(["/blocks/0/props/picture"]);
    const header = el.querySelector("tc-profile-header") as unknown as { name: string; picture?: string };
    expect(header.name).toBe("Maya");
    expect(header.picture).toBeFalsy();
  });
});
