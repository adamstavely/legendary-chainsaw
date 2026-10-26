/*
 * <tc-integration-beam> in real browsers – the illustration's contract and regression checks, ported (the loop stops
 * in a hidden tab and resumes; a few sync cycles, then it rests until it comes back), plus the tool toggles, the
 * keyboard, the stacked layout, theme and axe.
 */
import { html, render } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { TcIntegrationBeam, type IntegrationBeamTool } from "../../src/elements/integration-beam";
import { IntegrationBeam } from "../../src/elements/react/integration-beam";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const mark = (id: string) => {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  el.setAttribute("data-logo", id);
  return el;
};
const left: IntegrationBeamTool[] = [{ name: "In A", logo: mark("a") }, { name: "In B", logo: mark("b") }];
const right: IntegrationBeamTool[] = [{ name: "Out C", logo: mark("c") }];

describe("tc-integration-beam", () => {
  test("the host is the root and a group named by the product and its tools; default tools", async () => {
    const el = await fixture<TcIntegrationBeam>(html`<tc-integration-beam></tc-integration-beam>`);
    expect(el.dataset.ui).toBe("ib");
    expect(el.getAttribute("role")).toBe("group");
    expect(el.getAttribute("aria-label")).toBe("Acme connected to Slack, Notion, Gmail, HubSpot, Linear, Google Drive");
    const tools = [...el.querySelectorAll<HTMLButtonElement>(".ui-ib__tool")];
    expect(tools.map((t) => t.getAttribute("aria-label"))).toEqual(["Slack, connected", "Notion, connected", "Gmail, connected", "HubSpot, connected", "Linear, connected", "Google Drive, connected"]);
    expect(tools.every((t) => t.getAttribute("aria-pressed") === "true")).toBe(true);
    expect(el.querySelector(".ui-ib__status")!.textContent).toBe("6 connected");
    // A beam per tool, drawn from the measured tiles
    const lines = [...el.querySelectorAll(".ui-ib__line")];
    expect(lines).toHaveLength(6);
    expect(lines.every((l) => /^M[\d.]+ [\d.]+C/.test(l.getAttribute("d") ?? ""))).toBe(true);
  });

  test("tools, centre and label from properties; logos are cloned", async () => {
    const center = { name: "Hub", logo: mark("hub") };
    const el = await fixture<TcIntegrationBeam>(html`<tc-integration-beam .left=${left} .right=${right} .center=${center}></tc-integration-beam>`);
    expect(el.getAttribute("aria-label")).toBe("Hub connected to In A, In B, Out C");
    expect(el.querySelectorAll(".ui-ib__group--in .ui-ib__tool")).toHaveLength(2);
    expect(el.querySelectorAll(".ui-ib__group--out .ui-ib__tool")).toHaveLength(1);
    expect(el.querySelector(".ui-ib__tool [data-logo='a']")).toBeTruthy();
    expect(el.querySelector(".ui-ib__mark [data-logo='hub']")).toBeTruthy();
    expect(left[0].logo!.isConnected).toBe(false);
    expect(el.querySelectorAll(".ui-ib__line")).toHaveLength(3);
    el.label = "Data flow";
    await settle();
    expect(el.getAttribute("aria-label")).toBe("Data flow");
  });

  test("a click pauses a tool, says so, shows its tooltip, and a second click reconnects it", async () => {
    const el = await fixture<TcIntegrationBeam>(html`<tc-integration-beam .left=${left} .right=${right}></tc-integration-beam>`);
    const tool = el.querySelector<HTMLButtonElement>(".ui-ib__tool")!;
    tool.click();
    await settle();
    expect(tool.getAttribute("aria-pressed")).toBe("false");
    expect(tool.getAttribute("aria-label")).toBe("In A, paused");
    expect(tool.hasAttribute("data-off")).toBe(true);
    expect(tool.hasAttribute("data-tip")).toBe(true);
    expect(tool.querySelector(".ui-ib__tip")!.textContent).toBe("In A · Paused");
    expect(el.querySelector(".ui-ib__line")!.hasAttribute("data-off")).toBe(true);
    expect(el.querySelector(".ui-ib__sr")!.textContent).toBe("In A paused. 2 of 3 connected.");
    expect(el.querySelector(".ui-ib__status")!.textContent).toBe("2 connected");
    tool.click();
    await settle();
    expect(tool.getAttribute("aria-pressed")).toBe("true");
    expect(el.querySelector(".ui-ib__sr")!.textContent).toBe("In A connected. 3 of 3 connected.");
    await expect.poll(() => tool.hasAttribute("data-tip"), { timeout: 3000 }).toBe(false);
  });

  test("all paused: the status says so and the dot goes idle", async () => {
    const el = await fixture<TcIntegrationBeam>(html`<tc-integration-beam .left=${left} .right=${right}></tc-integration-beam>`);
    for (const tool of el.querySelectorAll<HTMLButtonElement>(".ui-ib__tool")) tool.click();
    await settle();
    expect(el.querySelector(".ui-ib__status")!.textContent).toBe("All paused");
    expect(el.querySelector(".ui-ib__dot")!.hasAttribute("data-idle")).toBe(true);
  });

  test("keyboard: each tool is a button – keyboard focus brings its beam forward, Enter and Space toggle it", async () => {
    const el = await fixture<TcIntegrationBeam>(html`<tc-integration-beam .left=${left} .right=${right}></tc-integration-beam>`);
    const tools = [...el.querySelectorAll<HTMLButtonElement>(".ui-ib__tool")];
    // Tab order is the browser's (WebKit on macOS skips buttons by default), so the tools are focused directly after a key press
    await userEvent.keyboard("{Shift>}{/Shift}");
    tools[0].focus();
    await settle();
    expect(el.hasAttribute("data-focus")).toBe(true);
    expect(el.querySelector(".ui-ib__line")!.hasAttribute("data-focus")).toBe(true);
    expect(tools[0].hasAttribute("data-tip")).toBe(true);
    await userEvent.keyboard("{Enter}");
    await settle();
    expect(tools[0].getAttribute("aria-pressed")).toBe("false");
    tools[1].focus();
    await userEvent.keyboard(" ");
    await settle();
    expect(tools[1].getAttribute("aria-pressed")).toBe("false");
    tools[1].blur();
    await settle();
    expect(el.hasAttribute("data-focus")).toBe(false);
  });

  test("narrow: the tools stack above and below and the beams turn vertical", async () => {
    const el = await fixture<TcIntegrationBeam>(html`<tc-integration-beam style="width: 360px"></tc-integration-beam>`);
    const scene = el.querySelector<HTMLElement>(".ui-ib__scene")!;
    expect(getComputedStyle(scene).getPropertyValue("--tc-integration-beam-stack").trim()).toBe("1");
    const [x0, y0, x1] = el.querySelector(".ui-ib__line")!.getAttribute("d")!.slice(1).split(/[ C]/).map(Number);
    // Vertical tangent: the first control point sits straight below the start
    expect(x1).toBe(x0);
    expect(y0).toBeLessThan(el.querySelector<HTMLElement>(".ui-ib__center")!.offsetTop);
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
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "performance"] });
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
    const mount = async () => {
      const host = document.body.appendChild(document.createElement("div"));
      render(html`<tc-integration-beam></tc-integration-beam>`, host);
      const el = host.firstElementChild as TcIntegrationBeam;
      await el.updateComplete;
      return el;
    };
    const advance = async (ms: number) => {
      for (let t = 0; t < ms; t += 16) vi.advanceTimersByTime(16);
      await Promise.resolve();
    };

    test("the loop stops while the tab is hidden and resumes when it's back", async () => {
      await mount();
      await advance(1000);
      expect(vi.getTimerCount()).toBeGreaterThan(0);
      hidden = true;
      document.dispatchEvent(new Event("visibilitychange"));
      await advance(100);
      expect(vi.getTimerCount()).toBe(0);
      hidden = false;
      document.dispatchEvent(new Event("visibilitychange"));
      expect(vi.getTimerCount()).toBeGreaterThan(0);
    });

    test("pulses travel and the status says it's syncing", async () => {
      const el = await mount();
      await advance(1000);
      expect(el.querySelector<SVGGElement>(".ui-ib__pulse")!.style.opacity).toBe("1");
      await advance(1000);
      await el.updateComplete;
      expect(el.querySelector(".ui-ib__status")!.textContent).toBe("Syncing…");
      expect(el.querySelector(".ui-ib__center")!.hasAttribute("data-syncing")).toBe(true);
    });

    test("runs a few sync cycles, then the loop stops until it comes back into view (WCAG 2.2.2)", async () => {
      const el = await mount();
      await advance(30000);
      expect(vi.getTimerCount()).toBe(0);
      await el.updateComplete;
      expect(el.querySelector(".ui-ib__status")!.textContent).toBe("6 connected");
      hidden = true;
      document.dispatchEvent(new Event("visibilitychange"));
      hidden = false;
      document.dispatchEvent(new Event("visibilitychange"));
      expect(vi.getTimerCount()).toBeGreaterThan(0);
    });

    test("leaving the page stops the loop", async () => {
      const el = await mount();
      await advance(500);
      expect(vi.getTimerCount()).toBeGreaterThan(0);
      el.remove();
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  test("dark follows color-scheme alone (no theme-scoped rules below the root); the only endless loop is the syncing dot", async () => {
    const css = TcIntegrationBeam.css;
    expect(css).toContain(':where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }');
    for (const [, selector, body] of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
      if (/\.dark\b|data-(?:tc-)?theme="dark"/.test(selector.replace(/\/\*[\s\S]*?\*\//g, ""))) expect(body.trim()).toBe("color-scheme: dark;");
    }
    for (const rule of css.match(/animation:[^;]*\binfinite\b[^;]*;/g) ?? []) expect(rule).toMatch(/ui-ib-breathe/);
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-integration-beam></tc-integration-beam></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-ib__line")!).stroke).toBe("rgb(46, 46, 51)");
  });

  test("React wrapper: className is merged, DOM props reach the host, the ref gets the host, React logos show", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcIntegrationBeam>();
    const logo = (id: string) => React.createElement("svg", { "data-react-logo": id });
    await act(async () =>
      root.render(
        React.createElement(IntegrationBeam, {
          className: "consumer-class",
          "data-consumer": "yes",
          "aria-describedby": "consumer",
          left: [{ name: "Alpha", logo: logo("a") }],
          right: [{ name: "Beta", logo: logo("b") }],
          center: { name: "Core", logo: logo("c") },
          ref,
        } as React.ComponentProps<typeof IntegrationBeam>),
      ),
    );
    await settle();
    const el = host.querySelector<TcIntegrationBeam>("tc-integration-beam")!;
    expect(el.classList.contains("consumer-class")).toBe(true);
    expect(el.dataset.ui).toBe("ib");
    expect(el.getAttribute("data-consumer")).toBe("yes");
    expect(el.getAttribute("aria-describedby")).toBe("consumer");
    expect(el.getAttribute("aria-label")).toBe("Core connected to Alpha, Beta");
    expect(ref.current).toBe(el);
    expect(el.querySelector(".ui-ib__tool [data-react-logo='a']")).toBeTruthy();
    expect(el.querySelector(".ui-ib__group--out [data-react-logo='b']")).toBeTruthy();
    expect(el.querySelector(".ui-ib__mark [data-react-logo='c']")).toBeTruthy();
    await act(async () => root.unmount());
  });

  test("axe: no violations, wide and narrow", async () => {
    const wrap = await fixture(html`<div><tc-integration-beam></tc-integration-beam><tc-integration-beam style="width: 360px" label="Data flow"></tc-integration-beam></div>`);
    // Let the status text finish fading in
    await new Promise((r) => setTimeout(r, 400));
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
