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
import { catalog, catalogPrompt, checkComponent, isGeneratable, loadSchema, MAX_ITEMS, mountComponent, tagOfTool, toolDefinitions, toolName } from "../../src/generative";
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
});
