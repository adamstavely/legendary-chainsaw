/*
 * <tc-preview-frame> in real browsers: the toolbar and its events, the address and its icon, the sandboxed iframe and
 * children shown instead, phone and tablet widths zoomed to fit, loading, error and empty states, tabs, narrow width,
 * the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/preview-frame";
import { normalizePreviewUrl, previewSecurity, type PreviewTab, type TcPreviewFrame } from "../../src/elements/preview-frame";
import { PreviewFrame } from "../../src/elements/react/preview-frame";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const TABS: PreviewTab[] = [
  { id: "a", title: "Freezers", url: "about:blank" },
  { id: "b", title: "Samples", url: "about:blank" },
  { id: "c", title: "Racks", url: "about:blank" },
];
const page = () => html`<div class="mock-page"><h2>Freezers</h2><p>F4 is warm.</p></div>`;
const key = (k: string) => (document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const input = (el: Element) => el.querySelector<HTMLInputElement>(".ui-pvf__input")!;
const tool = (el: Element, name: string) => el.querySelector<HTMLButtonElement>(`[data-tool="${name}"]`)!;

describe("tc-preview-frame", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: named toolbar buttons, a labelled address and a viewport radio group with one tab stop`, async () => {
      const el = await fixture<TcPreviewFrame>(html`<tc-preview-frame look=${look} src="about:blank"></tc-preview-frame>`);
      expect(el.dataset.ui).toBe("pvf");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Preview");
      expect(tool(el, "back").textContent!.trim()).toBe("Back");
      expect(tool(el, "back").disabled).toBe(true);
      expect(tool(el, "forward").disabled).toBe(true);
      expect(tool(el, "reload").textContent!.trim()).toBe("Reload");
      expect(tool(el, "external").textContent!.trim()).toBe("Open in a new window");
      const label = el.querySelector<HTMLLabelElement>(`label[for="${input(el).id}"]`)!;
      expect(label.textContent).toBe("Address");
      const group = el.querySelector('[role="radiogroup"]')!;
      expect(group.getAttribute("aria-label")).toBe("Viewport");
      const radios = [...group.querySelectorAll<HTMLElement>('[role="radio"]')];
      expect(radios.map((r) => r.textContent!.trim())).toEqual(["Phone", "Tablet", "Desktop"]);
      expect(radios.filter((r) => r.tabIndex === 0).map((r) => r.dataset.vp)).toEqual(["desktop"]);
      expect(radios.find((r) => r.dataset.vp === "desktop")!.getAttribute("aria-checked")).toBe("true");
    });
  }

  test("the iframe: sandboxed, titled, http(s) or about:blank only", async () => {
    const el = await fixture<TcPreviewFrame>(html`<tc-preview-frame heading="Sample tracker" src="about:blank"></tc-preview-frame>`);
    let frame = el.querySelector<HTMLIFrameElement>("iframe.ui-pvf__frame")!;
    expect(frame.getAttribute("sandbox")).toBe("allow-scripts allow-forms allow-same-origin");
    expect(frame.title).toBe("Sample tracker");
    expect(frame.getAttribute("src")).toBe("about:blank");
    el.sandbox = "allow-scripts";
    await settle();
    frame = el.querySelector<HTMLIFrameElement>("iframe.ui-pvf__frame")!;
    expect(frame.getAttribute("sandbox")).toBe("allow-scripts");
    el.src = "javascript:alert(1)";
    await settle();
    expect(el.querySelector("iframe")).toBeNull();
    const alert = el.querySelector('[role="alert"]')!;
    expect(alert.textContent).toContain("Couldn't load");
    expect(alert.textContent).toContain("Only http and https addresses can be shown.");
  });

  test("children show instead of the iframe, and get the page area's size", async () => {
    const el = await fixture<TcPreviewFrame>(html`<tc-preview-frame src="about:blank" .height=${300}>${page()}</tc-preview-frame>`);
    expect(el.querySelector("iframe")).toBeNull();
    const child = el.querySelector<HTMLElement>(".mock-page")!;
    expect(child.parentElement).toBe(el);
    expect(child.style.getPropertyValue("--tc-pvf-stage-h")).toBe("300px");
    const stage = el.querySelector<HTMLElement>(".ui-pvf__stage")!;
    expect(Math.round(child.getBoundingClientRect().top)).toBe(Math.round(stage.getBoundingClientRect().top));
    expect(Math.round(child.getBoundingClientRect().height)).toBe(300);
    // The error state hides them
    el.error = "Connection refused";
    await settle();
    expect(getComputedStyle(child).display).toBe("none");
    expect(el.querySelector('[role="alert"]')!.textContent).toContain("Connection refused");
    // Children going away bring the iframe back
    el.error = "";
    child.remove();
    await expect.poll(() => el.querySelector("iframe") !== null).toBe(true);
  });

  test("the address: Enter fires tc-navigate with a scheme added; unless prevented the address and src change; Escape reverts", async () => {
    const el = await fixture<TcPreviewFrame>(html`<tc-preview-frame src="about:blank"></tc-preview-frame>`);
    const seen: string[] = [];
    el.addEventListener("tc-navigate", (e) => seen.push((e as CustomEvent).detail.url));
    const field = input(el);
    field.focus();
    field.value = "localhost:5173/freezers";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    key("Enter");
    await settle();
    expect(seen).toEqual(["http://localhost:5173/freezers"]);
    expect(el.url).toBe("http://localhost:5173/freezers");
    expect(el.src).toBe("http://localhost:5173/freezers");
    expect(el.querySelector(".ui-pvf__address")!.getAttribute("data-kind")).toBe("local");
    expect(el.querySelector(".ui-pvf__lock")!.textContent).toContain("Local");
    // Prevented: nothing changes
    el.addEventListener("tc-navigate", (e) => e.preventDefault(), { once: true });
    field.value = "example.org";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    key("Enter");
    await settle();
    expect(seen.at(-1)).toBe("https://example.org");
    expect(el.url).toBe("http://localhost:5173/freezers");
    // Escape goes back to the address
    key("Escape");
    await settle();
    expect(field.value).toBe("http://localhost:5173/freezers");
  });

  test("normalizing and the address's kind", () => {
    expect(normalizePreviewUrl("127.0.0.1:8080")).toBe("http://127.0.0.1:8080");
    expect(normalizePreviewUrl("app.localhost/a")).toBe("http://app.localhost/a");
    expect(normalizePreviewUrl("institute.example")).toBe("https://institute.example");
    expect(normalizePreviewUrl("https://a.example/x")).toBe("https://a.example/x");
    expect(normalizePreviewUrl("about:blank")).toBe("about:blank");
    expect(normalizePreviewUrl("  ")).toBe("");
    expect(previewSecurity("https://a.example")).toBe("secure");
    expect(previewSecurity("http://localhost:5173")).toBe("local");
    expect(previewSecurity("http://[::1]:3000")).toBe("local");
    expect(previewSecurity("http://a.example")).toBe("insecure");
    expect(previewSecurity("about:blank")).toBe("");
  });

  test("toolbar events: back and forward when allowed, reload, open externally, console", async () => {
    const el = await fixture<TcPreviewFrame>(html`<tc-preview-frame src="about:blank" url="http://localhost:5173/" can-go-back can-go-forward .consoleCount=${{ errors: 2, warnings: 1 }}></tc-preview-frame>`);
    const seen: unknown[] = [];
    for (const name of ["tc-back", "tc-forward", "tc-reload", "tc-open-external", "tc-console"]) el.addEventListener(name, (e) => seen.push([name, (e as CustomEvent).detail]));
    tool(el, "back").click();
    tool(el, "forward").click();
    tool(el, "reload").click();
    tool(el, "external").click();
    const badge = el.querySelector<HTMLButtonElement>(".ui-pvf__console")!;
    expect(badge.textContent!.replace(/\s+/g, " ").trim()).toBe("2 errors, 1 warning");
    expect(badge.hasAttribute("data-errors")).toBe(true);
    badge.click();
    expect(seen).toEqual([
      ["tc-back", null],
      ["tc-forward", null],
      ["tc-reload", null],
      ["tc-open-external", { url: "http://localhost:5173/" }],
      ["tc-console", null],
    ]);
  });

  test("loading: Reload spins, a bar runs and the page area is busy", async () => {
    const el = await fixture<TcPreviewFrame>(html`<tc-preview-frame src="about:blank"></tc-preview-frame>`);
    expect(el.querySelector(".ui-pvf__progress")).toBeNull();
    el.loading = true;
    await settle();
    expect(el.querySelector(".ui-pvf__reload")!.hasAttribute("data-spin")).toBe(true);
    expect(el.querySelector(".ui-pvf__progress")).not.toBeNull();
    expect(el.querySelector(".ui-pvf__stage")!.getAttribute("aria-busy")).toBe("true");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Loading");
  });

  test("viewport: click and arrows choose; prevented keeps it; a phone is drawn at 375 and zoomed to fit", async () => {
    const el = await fixture<TcPreviewFrame>(html`<tc-preview-frame src="about:blank" style="width: 1000px"></tc-preview-frame>`);
    const seen: string[] = [];
    el.addEventListener("tc-viewport-change", (e) => seen.push((e as CustomEvent).detail.viewport));
    el.querySelector<HTMLElement>('[data-vp="tablet"]')!.click();
    await settle();
    expect(el.viewport).toBe("tablet");
    expect(el.getAttribute("viewport")).toBe("tablet");
    let frame = el.querySelector<HTMLElement>(".ui-pvf__frame")!;
    await expect.poll(() => Math.round(frame.getBoundingClientRect().width)).toBe(768);
    expect(el.querySelector(".ui-pvf__size")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Tablet · 768 px");
    // Arrows move the choice and focus
    el.querySelector<HTMLElement>('[data-vp="tablet"]')!.focus();
    key("ArrowLeft");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.vp).toBe("phone");
    expect(el.viewport).toBe("phone");
    expect(seen).toEqual(["tablet", "phone"]);
    // Narrow: zoomed down to fit inside the page area, centred
    el.style.width = "320px";
    const stage = el.querySelector<HTMLElement>(".ui-pvf__stage")!;
    frame = el.querySelector<HTMLElement>(".ui-pvf__frame")!;
    await expect.poll(() => frame.getBoundingClientRect().width < 320).toBe(true);
    const s = stage.getBoundingClientRect();
    const f = frame.getBoundingClientRect();
    expect(f.left).toBeGreaterThanOrEqual(s.left);
    expect(f.right).toBeLessThanOrEqual(s.right + 1);
    expect(Math.abs(f.left - s.left - (s.right - f.right))).toBeLessThan(2);
    expect(f.bottom).toBeLessThanOrEqual(s.bottom + 1);
    expect(el.querySelector(".ui-pvf__size")!.textContent).toMatch(/375 px · \d+%/);
    // Prevented: stays
    el.addEventListener("tc-viewport-change", (e) => e.preventDefault());
    el.querySelector<HTMLElement>('[data-vp="desktop"]')!.click();
    await settle();
    expect(el.viewport).toBe("phone");
  });

  test("children at a phone width are zoomed like the iframe", async () => {
    const el = await fixture<TcPreviewFrame>(html`<tc-preview-frame viewport="phone" style="width: 300px">${page()}</tc-preview-frame>`);
    const child = el.querySelector<HTMLElement>(".mock-page")!;
    const stage = el.querySelector<HTMLElement>(".ui-pvf__stage")!;
    await expect.poll(() => Number(child.style.getPropertyValue("--tc-pvf-zoom")) < 1).toBe(true);
    const c = child.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    expect(c.width).toBeLessThan(s.width);
    expect(c.left).toBeGreaterThanOrEqual(s.left);
    expect(c.bottom).toBeLessThanOrEqual(s.bottom + 1);
  });

  test("tabs: a tab list; arrows choose; Delete and the close button close; New tab fires", async () => {
    const el = await fixture<TcPreviewFrame>(html`<tc-preview-frame .tabs=${TABS} active="a"></tc-preview-frame>`);
    const list = el.querySelector('[role="tablist"]')!;
    const tabs = () => [...list.querySelectorAll<HTMLElement>('[role="tab"]')];
    expect(tabs().map((t) => t.textContent!.trim())).toEqual(["Freezers", "Samples", "Racks"]);
    expect(tabs().filter((t) => t.tabIndex === 0)).toHaveLength(1);
    expect(tabs()[0].getAttribute("aria-selected")).toBe("true");
    const changes: string[] = [];
    el.addEventListener("tc-active-change", (e) => changes.push((e as CustomEvent).detail.active));
    tabs()[0].focus();
    key("ArrowRight");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.id).toBe("b");
    expect(el.active).toBe("b");
    key("End");
    await expect.poll(() => el.active).toBe("c");
    expect(changes).toEqual(["b", "c"]);
    // Delete closes the active tab and moves to its neighbour
    const closed: string[] = [];
    el.addEventListener("tc-close", (e) => closed.push((e as CustomEvent).detail.id));
    key("Delete");
    await settle();
    expect(closed).toEqual(["c"]);
    expect(el.tabs.map((t) => t.id)).toEqual(["a", "b"]);
    expect(el.active).toBe("b");
    // A prevented close keeps the tab
    el.addEventListener("tc-close", (e) => e.preventDefault(), { once: true });
    el.querySelector<HTMLElement>(".ui-pvf__tabwrap .ui-pvf__tabclose")!.click();
    await settle();
    expect(el.tabs).toHaveLength(2);
    // The close buttons are for the pointer: hidden from the tab order and screen readers
    const close = el.querySelector<HTMLElement>(".ui-pvf__tabclose")!;
    expect(close.tabIndex).toBe(-1);
    expect(close.getAttribute("aria-hidden")).toBe("true");
    let added = 0;
    el.addEventListener("tc-new-tab", () => added++);
    el.querySelector<HTMLElement>(".ui-pvf__newtab")!.click();
    expect(added).toBe(1);
    // The address follows the active tab
    el.tabs = [{ id: "x", title: "X", url: "https://x.example/" }];
    el.active = "x";
    await settle();
    expect(input(el).value).toBe("https://x.example/");
  });

  test("empty: says no preview is running, with Start when startable", async () => {
    const el = await fixture<TcPreviewFrame>(html`<tc-preview-frame></tc-preview-frame>`);
    expect(el.querySelector(".ui-pvf__notice")!.textContent).toContain("No preview running");
    expect(el.querySelector(".ui-pvf__btn")).toBeNull();
    el.startable = true;
    await settle();
    let started = 0;
    el.addEventListener("tc-start", () => started++);
    el.querySelector<HTMLElement>(".ui-pvf__btn")!.click();
    expect(started).toBe(1);
  });

  test("narrow: the address takes its own line and nothing overflows", async () => {
    const el = await fixture<TcPreviewFrame>(html`<tc-preview-frame src="about:blank" style="width: 300px" .consoleCount=${{ errors: 0, warnings: 2 }}></tc-preview-frame>`);
    const bar = el.querySelector<HTMLElement>(".ui-pvf__bar")!;
    const address = el.querySelector<HTMLElement>(".ui-pvf__address")!;
    await expect.poll(() => address.getBoundingClientRect().top > tool(el, "back").getBoundingClientRect().bottom - 1).toBe(true);
    expect(bar.scrollWidth).toBeLessThanOrEqual(bar.clientWidth + 1);
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
  });

  test("React: children render inside; uncontrolled viewport survives a re-render, controlled waits for the parent", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    const root = createRoot(wrap);
    const render = (props: Partial<React.ComponentProps<typeof PreviewFrame>>) =>
      act(async () => root.render(React.createElement(PreviewFrame, { ...props }, React.createElement("div", { className: "mock-page" }, "Freezers"))));
    await render({ defaultViewport: "tablet" });
    const el = wrap.querySelector<TcPreviewFrame>("tc-preview-frame")!;
    await settle();
    expect(el.querySelector(".mock-page")!.parentElement).toBe(el);
    expect(el.querySelector("iframe")).toBeNull();
    expect(el.viewport).toBe("tablet");
    await act(async () => el.querySelector<HTMLElement>('[data-vp="phone"]')!.click());
    await render({ defaultViewport: "tablet", description: "Again" });
    await settle();
    expect(el.viewport).toBe("phone");
    const seen: string[] = [];
    await render({ viewport: "desktop", onViewportChange: (v) => void seen.push(v) });
    await settle();
    await act(async () => el.querySelector<HTMLElement>('[data-vp="tablet"]')!.click());
    await settle();
    expect(seen).toEqual(["tablet"]);
    await expect.poll(() => el.viewport).toBe("desktop");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = document.body.appendChild(document.createElement("div"));
      wrap.style.colorScheme = theme;
      wrap.innerHTML = `
        <tc-preview-frame look="standard" heading="A" viewport="phone"><div class="mock-page"><h2>Freezers</h2></div></tc-preview-frame>
        <tc-preview-frame look="clean" heading="B" src="about:blank" loading></tc-preview-frame>
        <tc-preview-frame look="standard" heading="C" error="Connection refused" url="http://localhost:5173/"></tc-preview-frame>
        <tc-preview-frame look="clean" heading="" startable></tc-preview-frame>`;
      wrap.querySelectorAll<TcPreviewFrame>("tc-preview-frame").forEach((el, i) => {
        el.consoleCount = { errors: i, warnings: 2 };
        if (i < 2) el.tabs = TABS;
      });
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});

test("navigation belongs to its tab across selection, controlled changes, closing, and parent updates", async () => {
  const a="https://a.example/", b="https://b.example/", edited="https://edited.example/";
  const el = await fixture<TcPreviewFrame>(html`<tc-preview-frame .tabs=${[{id:"a",title:"A",url:a},{id:"b",title:"B",url:b}]} active="a"></tc-preview-frame>`);
  const navigate = async (url:string) => { const field=input(el);field.value=url;field.dispatchEvent(new Event("input",{bubbles:true}));field.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true}));await settle(); };
  await navigate(edited);
  expect(el.address).toBe(edited);
  expect(el.querySelector("iframe")!.getAttribute("src")).toBe(edited);
  el.querySelector<HTMLElement>('.ui-pvf__tab[data-id="b"]')!.click(); await settle();
  expect(el.address).toBe(b);expect(el.querySelector("iframe")!.getAttribute("src")).toBe(b);
  // An application-controlled tab update follows the same path.
  el.active="a";await settle();expect(el.address).toBe(edited);
  el.tabs=[{id:"a",title:"A",url:"https://server.example/"},{id:"b",title:"B",url:b}];await settle();expect(el.address).toBe("https://server.example/");
  await navigate(edited);
  el.querySelector<HTMLElement>('.ui-pvf__tab[data-id="a"]')!.dispatchEvent(new KeyboardEvent("keydown",{key:"Delete",bubbles:true}));await settle();
  expect(el.address).toBe(b);
});
