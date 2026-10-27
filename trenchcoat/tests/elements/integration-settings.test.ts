/*
 * <tc-integration-settings> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/integration-settings";
import type { IntegrationValues, TcIntegrationSettings } from "../../src/elements/integration-settings";
import { IntegrationSettings } from "../../src/elements/react/integration-settings";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});
const fakeTimeouts = () => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
const advance = async (ms: number) => {
  vi.advanceTimersByTime(ms);
  await settle();
};
const flush = async () => {
  for (let i = 0; i < 3; i++) await Promise.resolve();
  await settle();
};

const button = (el: Element, name: string | RegExp) =>
  [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => {
    const label = b.getAttribute("aria-label") ?? b.textContent!.trim();
    return typeof name === "string" ? label === name : name.test(label);
  })!;
const site = (el: Element) => el.querySelector<HTMLInputElement>("input[inputmode=url]")!;
const type = (input: HTMLInputElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new InputEvent("input", { bubbles: true }));
};
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const make = (look: "standard" | "clean", props: Partial<TcIntegrationSettings> = {}) =>
  fixture<TcIntegrationSettings>(html`<tc-integration-settings
    look=${look}
    name="Shopify"
    ?demo=${props.demo ?? false}
    .values=${props.values ?? {}}
    .generateKey=${props.generateKey}
    .saveValues=${props.saveValues}
    .toggleEnabled=${props.toggleEnabled}
  ></tc-integration-settings>`);

describe("tc-integration-settings", () => {
  test("the host is the root and the region, named after the service", async () => {
    const logo = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    logo.setAttribute("data-logo", "");
    const el = await fixture<TcIntegrationSettings>(html`<tc-integration-settings name="Shopify" .logo=${logo} count="1284" meta="Connected"></tc-integration-settings>`);
    expect(el.dataset.ui).toBe("is");
    expect(el.dataset.look).toBe("standard");
    expect(el.getAttribute("role")).toBe("region");
    expect(el.getAttribute("aria-label")).toBe("Shopify settings");
    expect(el.querySelector(".tc-head__icon svg[data-logo]")).toBeTruthy();
    expect(logo.isConnected).toBe(false);
    expect(el.querySelector(".ui-is__count")!.textContent).toBe("1,284");
    expect(el.querySelector(".ui-is__meta")!.textContent!.trim()).toBe("Connected");
  });

  // Runs first: the warning is once per page, so a later test would find it already spent
  test("made-up keys: marked as demo keys, silent with demo, otherwise one warning", async () => {
    fakeTimeouts();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const warnings = () => warn.mock.calls.filter(([m]) => String(m).startsWith("IntegrationSettings:"));
    const demo = await make("standard", { demo: true });
    button(demo, "Generate a new API key").click();
    await advance(800);
    expect(warnings()).toHaveLength(0);
    expect(demo.querySelector("code")!.textContent).toMatch(/^sk_demo_/);
    cleanup();
    const wrap = await fixture(html`<div><tc-integration-settings name="A"></tc-integration-settings><tc-integration-settings name="B"></tc-integration-settings></div>`);
    for (const b of wrap.querySelectorAll<HTMLButtonElement>(".ui-is__generate")) b.click();
    await advance(800);
    expect(warnings()).toHaveLength(1);
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: values follow the property; fields that weren't edited follow new values`, async () => {
      const el = await make(look, { values: { enabled: true, siteUrl: "a.example.com" } });
      const sw = el.querySelector('[role="switch"]')!;
      expect(sw.getAttribute("aria-checked")).toBe("true");
      expect(site(el).value).toBe("a.example.com");
      el.values = { enabled: false, siteUrl: "b.example.com" };
      await settle();
      expect(sw.getAttribute("aria-checked")).toBe("false");
      expect(site(el).value).toBe("b.example.com");
      expect(el.hasAttribute("data-off")).toBe(true);
      el.values = { siteUrl: "", timeZone: "(GMT +00:00) London" };
      await settle();
      type(site(el), "mine.example.com");
      await settle();
      el.values = { siteUrl: "other.example.com", timeZone: "(GMT +09:00) Tokyo" };
      await settle();
      expect(site(el).value).toBe("mine.example.com");
      expect(el.querySelector(".ui-is__zone-value")!.textContent).toBe("(GMT +09:00) Tokyo");
    });

    test(`${look}: a rejected generateKey shows an error and the button works again`, async () => {
      let calls = 0;
      const generateKey = () => (++calls === 1 ? Promise.reject(new Error("quota")) : Promise.resolve("sk_test_123456789abc"));
      const el = await make(look, { generateKey });
      button(el, "Generate a new API key").click();
      await flush();
      expect(el.querySelector('[role="alert"]')!.textContent).toMatch(/couldn't be generated/);
      button(el, "Generate a new API key").click();
      await flush();
      expect(el.querySelector("code")!.textContent).toBe("sk_test_123456789abc");
      expect(el.querySelector('[role="alert"]')).toBeNull();
    });

    test(`${look}: a rejected save keeps the changes unsaved and shows an error`, async () => {
      let called = 0;
      const el = await make(look, { saveValues: () => (called++, Promise.reject(new Error("500"))) });
      type(site(el), "shop.example.com");
      await settle();
      button(el, "Save").click();
      await flush();
      expect(called).toBe(1);
      expect(el.querySelector('[role="alert"]')!.textContent).toMatch(/Couldn't save/);
      expect(button(el, "Save").disabled).toBe(false);
    });

    test(`${look}: a failed clipboard write never says the key was copied`, async () => {
      vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
      const el = await make(look, { generateKey: () => "sk_test_123456789abc" });
      button(el, "Generate a new API key").click();
      await flush();
      button(el, "Copy key").click();
      await flush();
      expect(el.textContent).not.toMatch(/Copied to the clipboard\./);
      expect(el.querySelector('[role="alert"]')!.textContent).toMatch(/Couldn't copy/);
    });

    test(`${look}: controlled values – Save is reported, not applied`, async () => {
      const el = await make(look, { values: { siteUrl: "a.example.com" }, saveValues: () => {} });
      const seen: IntegrationValues[] = [];
      el.addEventListener("tc-values-change", (e) => {
        e.preventDefault();
        seen.push((e as CustomEvent<{ values: IntegrationValues }>).detail.values);
      });
      type(site(el), "b.example.com");
      await settle();
      button(el, "Save").click();
      await flush();
      expect(seen[0]).toMatchObject({ siteUrl: "b.example.com" });
      expect(el.values).toEqual({ siteUrl: "a.example.com" });
    });

    test(`${look}: an async switch shows pending, stays put on failure and says so`, async () => {
      let fail!: () => void;
      const el = await make(look, { toggleEnabled: () => new Promise<void>((_, reject) => (fail = () => reject(new Error("x")))) });
      const sw = el.querySelector<HTMLButtonElement>('[role="switch"]')!;
      sw.click();
      await settle();
      expect(sw.getAttribute("aria-busy")).toBe("true");
      fail();
      await flush();
      expect(sw.getAttribute("aria-checked")).toBe("true");
      expect(sw.hasAttribute("aria-busy")).toBe(false);
      expect(el.querySelector('[role="alert"]')!.textContent).toMatch(/Couldn't pause Shopify/);
    });

    test(`${look}: the switch saves at once and folds the settings away`, async () => {
      const el = await make(look);
      const seen: IntegrationValues[] = [];
      el.addEventListener("tc-values-change", (e) => seen.push((e as CustomEvent<{ values: IntegrationValues }>).detail.values));
      el.querySelector<HTMLButtonElement>('[role="switch"]')!.click();
      await flush();
      expect(seen[0]).toMatchObject({ enabled: false });
      expect(el.querySelector<HTMLElement>(".ui-is__fold")!.inert).toBe(true);
      expect(el.querySelector(".ui-is__meta")!.textContent!.trim()).toBe("Paused – no data is synced");
    });

    test(`${look}: generateKey and saveValues get a signal that aborts on removal`, async () => {
      let signal!: AbortSignal;
      const el = await make(look, { generateKey: (o) => ((signal = o.signal), new Promise<string>(() => {})) });
      button(el, "Generate a new API key").click();
      expect(signal.aborted).toBe(false);
      el.remove();
      expect(signal.aborted).toBe(true);
    });

    test(`${look}: time zone – the trigger's name includes the value; menu keyboard pattern and focus return`, async () => {
      const el = await make(look, { demo: true, values: { timeZone: "(GMT +00:00) London" } });
      const trigger = el.querySelector<HTMLButtonElement>(".ui-is__zone-btn")!;
      const name = trigger
        .getAttribute("aria-labelledby")!
        .split(" ")
        .map((id) => document.getElementById(id)!.textContent!.trim())
        .join(" ");
      expect(name).toMatch(/Time zone.*London/);
      trigger.click();
      await settle();
      const search = el.querySelector<HTMLInputElement>('[role="combobox"]')!;
      expect(search.getAttribute("aria-label")).toBe("Search time zones");
      expect(document.activeElement).toBe(search);
      const list = el.querySelector('[role="listbox"]')!;
      expect(list.querySelector("button")).toBeNull();
      const active = () => document.getElementById(search.getAttribute("aria-activedescendant")!)?.textContent;
      expect(active()).toMatch(/London/);
      key(search, "ArrowDown");
      await settle();
      expect(active()).toMatch(/Berlin/);
      key(search, "Enter");
      await settle();
      expect(el.querySelector('[role="listbox"]')).toBeNull();
      expect(document.activeElement).toBe(trigger);
      expect(trigger.textContent).toMatch(/Berlin/);
      trigger.click();
      await settle();
      key(el.querySelector('[role="combobox"]')!, "Escape");
      await settle();
      expect(el.querySelector('[role="listbox"]')).toBeNull();
      expect(document.activeElement).toBe(trigger);
      trigger.click();
      await settle();
      key(el.querySelector('[role="combobox"]')!, "Tab");
      await settle();
      expect(el.querySelector('[role="listbox"]')).toBeNull();
      // Typing filters the list
      trigger.click();
      await settle();
      type(el.querySelector('[role="combobox"]')!, "tok");
      await settle();
      expect([...el.querySelectorAll('[role="option"]')].map((o) => o.textContent!.trim())).toEqual(["(GMT +09:00) Tokyo"]);
    });

    test(`${look}: Generate keeps focus while working, then Regenerate has it; busy Regenerate keeps a name`, async () => {
      fakeTimeouts();
      const el = await make(look, { demo: true });
      const gen = button(el, "Generate a new API key");
      gen.focus();
      gen.click();
      await settle();
      expect(gen.getAttribute("aria-disabled")).toBe("true");
      expect(document.activeElement).toBe(gen);
      await advance(800);
      await flush();
      const regen = button(el, "Regenerate");
      expect(document.activeElement).toBe(regen);
      regen.click();
      await settle();
      expect(regen.textContent).toMatch(/Regenerating/);
      expect(document.activeElement).toBe(regen);
    });

    test(`${look}: Discard and Save close the bar without dropping focus to <body>; results are announced`, async () => {
      const el = await make(look, { demo: true, saveValues: () => Promise.resolve() });
      const status = el.querySelector('[role="status"]')!;
      expect(status.textContent).toBe("");
      const field = site(el);
      type(field, "shop.com");
      await settle();
      const discard = button(el, "Discard");
      discard.focus();
      discard.click();
      await settle();
      expect(document.activeElement).toBe(field);
      expect(status.textContent).toBe("Changes discarded.");
      type(field, "shop.com");
      await settle();
      const save = button(el, "Save");
      save.focus();
      save.click();
      await flush();
      expect(document.activeElement).toBe(field);
      expect(status.textContent).toBe("Changes saved.");
    });

    test(`${look}: the address is validated on leaving the field, in a hint that is live from mount`, async () => {
      const el = await make(look, { demo: true });
      const field = site(el);
      const hint = document.getElementById(field.getAttribute("aria-describedby")!)!;
      expect(hint.getAttribute("aria-live")).toBe("polite");
      type(field, "not a domain");
      await settle();
      expect(field.getAttribute("aria-invalid")).toBe("false");
      expect(hint.textContent).not.toMatch(/doesn't look like a domain/);
      field.dispatchEvent(new FocusEvent("blur"));
      await settle();
      expect(field.getAttribute("aria-invalid")).toBe("true");
      expect(hint.textContent).toMatch(/doesn't look like a domain/);
      type(field, "shop.com");
      await settle();
      expect(field.getAttribute("aria-invalid")).toBe("false");
    });
  }

  test("React wrapper: defaultValues that arrive later are shown; uncontrolled saves survive a re-render", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: IntegrationValues[] = [];
    const render = (defaults: Partial<IntegrationValues>) =>
      act(async () => root.render(React.createElement(IntegrationSettings, { name: "Shopify", logo: React.createElement("i"), defaultValues: defaults, onValuesChange: (v) => void seen.push(v) })));
    await render({ siteUrl: "" });
    await settle();
    const el = host.querySelector("tc-integration-settings")!;
    expect(el.querySelector(".tc-head__icon i")).toBeTruthy();
    await render({ siteUrl: "shop.example.com" });
    await settle();
    expect(site(el).value).toBe("shop.example.com");
    el.querySelector<HTMLButtonElement>('[role="switch"]')!.click();
    await flush();
    expect(seen[0]).toMatchObject({ enabled: false, siteUrl: "shop.example.com" });
    await render({ siteUrl: "shop.example.com" });
    await settle();
    expect(el.querySelector('[role="switch"]')!.getAttribute("aria-checked")).toBe("false");
    await act(async () => root.unmount());
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-integration-settings name="Shopify" demo .values=${{ apiKey: "sk_test_123456789abc" }}></tc-integration-settings>
      <tc-integration-settings look="clean" name="Stripe" demo></tc-integration-settings>
    </div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
