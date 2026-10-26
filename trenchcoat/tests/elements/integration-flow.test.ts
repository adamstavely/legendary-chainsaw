/*
 * <tc-integration-flow> in real browsers – the illustration's contract and regression checks, ported: one cycle updates
 * the element only when the pills move on, the cycle stops in a hidden tab, the default description names the items
 * passed in, it rests after one round per integration, single-colour logos are painted through the pill's ink filter.
 */
import { html, render } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { TcIntegrationFlow, type IntegrationFlowItem } from "../../src/elements/integration-flow";
import { IntegrationFlow } from "../../src/elements/react/integration-flow";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

describe("tc-integration-flow", () => {
  test("the host is the root and an image with the default description; six pills, one in the centre", async () => {
    const el = await fixture<TcIntegrationFlow>(html`<tc-integration-flow></tc-integration-flow>`);
    expect(el.dataset.ui).toBe("if");
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Integrations like Slack, Okta and Snowflake sending data into a central data analysis hub");
    expect(el.querySelectorAll(".ui-if-pill")).toHaveLength(6);
    expect(el.querySelector(".ui-if-pill[data-phase='3'] .ui-if-sub")!.textContent).toBe("Slack");
    expect(el.querySelectorAll(".ui-if-blob")).toHaveLength(14);
    el.label = "Data flowing in";
    await settle();
    expect(el.getAttribute("aria-label")).toBe("Data flowing in");
  });

  test("the default description names the integrations passed in", async () => {
    const items: IntegrationFlowItem[] = [{ name: "Jira", icon: null }, { name: "Linear", icon: null }];
    const el = await fixture<TcIntegrationFlow>(html`<tc-integration-flow .items=${items}></tc-integration-flow>`);
    expect(el.getAttribute("aria-label")).toBe("Integrations like Jira and Linear sending data into a central data analysis hub");
  });

  test("the stage scales to the host's width", async () => {
    const el = await fixture<TcIntegrationFlow>(html`<tc-integration-flow style="width: 600px"></tc-integration-flow>`);
    const stage = el.querySelector<HTMLElement>(".ui-if-stage")!;
    await expect.poll(() => stage.style.transform).toBe("scale(0.25)");
    expect(el.getBoundingClientRect().height).toBeCloseTo(600 * (1490 / 2400), 0);
  });

  test("single-colour logos are painted through the pill's own ink filter, so dark mode needs no .dark rule", async () => {
    const el = await fixture<TcIntegrationFlow>(html`<tc-integration-flow></tc-integration-flow>`);
    const pill = el.querySelector<HTMLElement>(".ui-if-pill[data-fill='black']")!;
    const filter = pill.style.getPropertyValue("--tc-integration-flow-ink").match(/#([^)]+)\)/)![1];
    expect(pill.querySelector(`filter[id="${filter}"] .ui-if-ink`)).not.toBeNull();
  });

  test("cloned logos get their own gradient ids, and every reference stays inside the clone", async () => {
    const wrap = await fixture(html`<div><tc-integration-flow></tc-integration-flow><tc-integration-flow></tc-integration-flow></div>`);
    const ids = [...wrap.querySelectorAll(".ui-if-icon [id]")].map((n) => n.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    for (const icon of wrap.querySelectorAll(".ui-if-icon")) {
      for (const n of icon.querySelectorAll("[fill^='url(']")) {
        const ref = n.getAttribute("fill")!.match(/^url\(#(.+)\)$/)![1];
        expect(icon.querySelector(`[id="${ref}"]`), ref).toBeTruthy();
      }
    }
  });

  describe("with fake timers", () => {
    let hidden = false;
    class VisibleObserver {
      constructor(private callback: IntersectionObserverCallback) {}
      observe() {
        this.callback([{ isIntersecting: true } as unknown as IntersectionObserverEntry], this as unknown as IntersectionObserver);
      }
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      vi.stubGlobal("IntersectionObserver", VisibleObserver);
      hidden = false;
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (hidden ? "hidden" : "visible") });
    });
    afterEach(() => {
      vi.useRealTimers();
      vi.unstubAllGlobals();
      // @ts-expect-error – drop the own-property override, back to the browser's getter
      delete document.visibilityState;
    });
    const mount = async (items?: IntegrationFlowItem[]) => {
      const host = document.body.appendChild(document.createElement("div"));
      render(html`<tc-integration-flow .items=${items}></tc-integration-flow>`, host);
      const el = host.firstElementChild as TcIntegrationFlow;
      await el.updateComplete;
      return el;
    };
    const advance = async (ms: number) => {
      for (let t = 0; t < ms; t += 50) {
        vi.advanceTimersByTime(50);
        await Promise.resolve();
      }
    };

    test("one cycle updates the element only when the pills move on", async () => {
      const el = await mount();
      const renders = vi.spyOn(el as unknown as { render: () => unknown }, "render");
      // Into the charge: the centre pill glows without an update
      await advance(800);
      expect(el.querySelector(".ui-if-pills")!.classList.contains("ui-if-charged")).toBe(true);
      expect(renders).toHaveBeenCalledTimes(0);
      // Through one full cycle (3.2 s): the pills move on, and the exiting pill jumps back
      await advance(3200);
      await el.updateComplete;
      expect(el.querySelector(".ui-if-link")!.classList.contains("ui-if-sweeping")).toBe(true);
      expect(renders).toHaveBeenCalledTimes(2);
      expect(el.querySelector(".ui-if-pill[data-phase='3'] .ui-if-sub")!.textContent).toBe("Snowflake");
    });

    test("stops while the tab is hidden", async () => {
      const el = await mount();
      await advance(1000);
      hidden = true;
      document.dispatchEvent(new Event("visibilitychange"));
      await el.updateComplete;
      expect(vi.getTimerCount()).toBe(0);
      expect(el.hasAttribute("data-paused")).toBe(true);
      // Paused mid-cycle: the glows fade out rather than freeze lit
      expect(el.querySelector(".ui-if-pills")!.classList.contains("ui-if-charged")).toBe(false);
    });

    test("runs one round per integration, then rests on the centre pill (WCAG 2.2.2)", async () => {
      const items = [1, 2, 3, 4, 5].map((i) => ({ name: `Tool ${i}`, icon: null }));
      const el = await mount(items);
      // 0.7 s lead-in, then 5 cycles of 3.2 s
      await advance(700 + 5 * 3200 + 500);
      expect(vi.getTimerCount()).toBe(0);
      expect(el.querySelector(".ui-if-pill[data-phase='3']")).not.toBeNull();
    });

    test("leaving the page stops the cycle", async () => {
      const el = await mount();
      await advance(100);
      expect(vi.getTimerCount()).toBeGreaterThan(0);
      el.remove();
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  test("dark follows color-scheme alone (no theme-scoped rules below the root); no endless loops", async () => {
    const css = TcIntegrationFlow.css;
    expect(css).toContain(':where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }');
    for (const [, selector, body] of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
      if (/\.dark\b|data-(?:tc-)?theme="dark"/.test(selector.replace(/\/\*[\s\S]*?\*\//g, ""))) expect(body.trim()).toBe("color-scheme: dark;");
    }
    expect(css).not.toMatch(/\binfinite\b/);
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-integration-flow></tc-integration-flow></div>`);
    expect(getComputedStyle(wrap.querySelector("tc-integration-flow")!).backgroundColor).toBe("rgb(31, 31, 33)");
  });

  test("React wrapper: className is merged, DOM props reach the host, the ref gets the host, React icons show", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcIntegrationFlow>();
    const items = ["A", "B", "C", "D", "E"].map((name) => ({ name, icon: React.createElement("svg", { "data-react-icon": name }) }));
    await act(async () =>
      root.render(React.createElement(IntegrationFlow, { className: "consumer-class", "data-consumer": "yes", "aria-describedby": "consumer", items, ref } as React.ComponentProps<typeof IntegrationFlow>)),
    );
    await settle();
    const el = host.querySelector<TcIntegrationFlow>("tc-integration-flow")!;
    expect(el.classList.contains("consumer-class")).toBe(true);
    expect(el.dataset.ui).toBe("if");
    expect(el.getAttribute("data-consumer")).toBe("yes");
    expect(el.getAttribute("aria-describedby")).toBe("consumer");
    expect(el.getAttribute("aria-label")).toBe("Integrations like A, B and C sending data into a central data analysis hub");
    expect(ref.current).toBe(el);
    expect(el.querySelector(".ui-if-pill[data-phase='3'] [data-react-icon='C']")).toBeTruthy();
    await act(async () => root.unmount());
  });

  test("axe: no violations", async () => {
    const wrap = await fixture(html`<div><tc-integration-flow></tc-integration-flow></div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
