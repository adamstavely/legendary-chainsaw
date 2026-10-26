/*
 * <tc-integration-picker> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/integration-picker";
import { integrationPickerDefaults, type TcIntegrationPicker } from "../../src/elements/integration-picker";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const allOff = integrationPickerDefaults.map((i) => ({ ...i, connected: false }));
const sw = (el: Element) => el.querySelector<HTMLButtonElement>('[role="switch"]')!;
const input = (el: Element) => el.querySelector<HTMLInputElement>('[role="combobox"]')!;
const picked = (el: Element) => el.querySelector('[role="option"][aria-selected="true"]')?.getAttribute("data-id");
const key = (t: Element, init: KeyboardEventInit) => {
  const e = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
  t.dispatchEvent(e);
  return e;
};
const type = async (el: Element, text: string) => {
  const i = input(el);
  i.value = text;
  i.dispatchEvent(new InputEvent("input", { bubbles: true }));
  await settle();
};

describe("tc-integration-picker", () => {
  test("the host is the root; the list is grouped into Connected and Available", async () => {
    const el = await fixture<TcIntegrationPicker>(html`<tc-integration-picker></tc-integration-picker>`);
    expect(el.dataset.ui).toBe("ip");
    expect(el.dataset.look).toBe("standard");
    expect([...el.querySelectorAll('[role="group"]')].map((g) => g.getAttribute("aria-label"))).toEqual(["Connected", "Available"]);
    expect(el.querySelector(".ui-ip__count")!.textContent).toBe("3 of 10 connected");
    expect(picked(el)).toBe("linear");
    expect(el.querySelector("h3")!.textContent).toBe("Trenchcoat + Linear");
    expect(el.hasAttribute("data-on")).toBe(true);
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the integrations' connected flags are followed when a parent changes them`, async () => {
      const el = await fixture<TcIntegrationPicker>(html`<tc-integration-picker look=${look} selected="linear" .integrations=${allOff}></tc-integration-picker>`);
      expect(sw(el).getAttribute("aria-checked")).toBe("false");
      el.integrations = allOff.map((i) => (i.id === "linear" ? { ...i, connected: true } : i));
      await settle();
      expect(sw(el).getAttribute("aria-checked")).toBe("true");
    });

    test(`${look}: controlled connected only reports; onToggle and the event both hear it`, async () => {
      const onToggle = vi.fn();
      const seen: string[][] = [];
      const el = await fixture<TcIntegrationPicker>(html`<tc-integration-picker
        look=${look}
        selected="linear"
        .connected=${[]}
        .onToggle=${onToggle}
        @tc-connected-change=${(e: CustomEvent<{ connected: string[] }>) => (e.preventDefault(), seen.push(e.detail.connected))}
      ></tc-integration-picker>`);
      sw(el).click();
      await settle();
      expect(onToggle).toHaveBeenCalledWith("linear", true, expect.objectContaining({ signal: expect.any(AbortSignal) }));
      expect(seen).toEqual([["linear"]]);
      expect(sw(el).getAttribute("aria-checked")).toBe("false");
    });

    test(`${look}: an async toggle shows pending, flips on success, and says so on failure`, async () => {
      let s!: { resolve: () => void; reject: () => void };
      const onToggle = vi.fn(() => new Promise<void>((resolve, reject) => (s = { resolve, reject: () => reject(new Error("no")) })));
      const el = await fixture<TcIntegrationPicker>(html`<tc-integration-picker look=${look} selected="linear" .integrations=${allOff} .onToggle=${onToggle}></tc-integration-picker>`);
      sw(el).click();
      await settle();
      expect(sw(el).getAttribute("aria-busy")).toBe("true");
      expect(sw(el).getAttribute("aria-checked")).toBe("false");
      s.reject();
      await settle();
      expect(el.querySelector('[role="alert"]')!.textContent).toMatch(/Couldn't connect Linear/);
      expect(sw(el).getAttribute("aria-checked")).toBe("false");
      sw(el).click();
      s.resolve();
      await settle();
      await settle();
      expect(sw(el).getAttribute("aria-checked")).toBe("true");
      expect(el.querySelector('[role="alert"]')).toBeNull();
    });

    test(`${look}: the switch keeps its name; a status region there from the start announces the result`, async () => {
      const el = await fixture<TcIntegrationPicker>(html`<tc-integration-picker look=${look} selected="linear" .integrations=${allOff}></tc-integration-picker>`);
      const status = el.querySelector('[role="status"]')!;
      expect(status.textContent).toBe("");
      expect(sw(el).getAttribute("aria-label")).toBe("Connect Linear");
      sw(el).click();
      await settle();
      expect(sw(el).getAttribute("aria-label")).toBe("Connect Linear");
      expect(sw(el).getAttribute("aria-checked")).toBe("true");
      expect(el.querySelector('[role="status"]')).toBe(status);
      expect(status.textContent).toBe("Linear connected");
      expect(el.querySelector(".ui-ip__detail")!.closest("[aria-live]")).toBeNull();
      key(input(el), { key: "Enter" });
      await settle();
      expect(status.textContent).toBe("Linear disconnected");
    });
  }

  test("⌘/ uses one window listener for several pickers; hotkey false leaves it alone", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const wrap = await fixture(html`<div><tc-integration-picker></tc-integration-picker><tc-integration-picker></tc-integration-picker></div>`);
    expect(add.mock.calls.filter(([t]) => t === "keydown")).toHaveLength(1);
    add.mockRestore();
    expect(key(document.body, { key: "/", metaKey: true }).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(input(wrap.children[1]));
    cleanup();
    await fixture(html`<tc-integration-picker .hotkey=${false}></tc-integration-picker>`);
    expect(key(document.body, { key: "/", ctrlKey: true }).defaultPrevented).toBe(false);
  });

  test("Enter while an IME is composing doesn't toggle", async () => {
    const onToggle = vi.fn();
    const el = await fixture<TcIntegrationPicker>(html`<tc-integration-picker .onToggle=${onToggle}></tc-integration-picker>`);
    key(input(el), { key: "Enter", isComposing: true });
    expect(onToggle).not.toHaveBeenCalled();
    key(input(el), { key: "Enter" });
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  test("option ids don't contain the integrations' own ids", async () => {
    const el = await fixture<TcIntegrationPicker>(html`<tc-integration-picker .integrations=${[{ ...integrationPickerDefaults[0], id: 'odd id"x' }]}></tc-integration-picker>`);
    const option = el.querySelector('[role="option"]')!;
    expect(option.id).not.toContain("odd");
    expect(input(el).getAttribute("aria-activedescendant")).toBe(option.id);
  });

  test("the keyboard: ↑ ↓ move (wrapping), the search filters, Esc clears it then closes, ← goes back", async () => {
    const events: string[] = [];
    const el = await fixture<TcIntegrationPicker>(html`<tc-integration-picker
      back
      @tc-selected-change=${(e: CustomEvent<{ selected: string }>) => events.push(`selected:${e.detail.selected}`)}
      @tc-back=${() => events.push("back")}
      @tc-close=${() => events.push("close")}
    ></tc-integration-picker>`);
    // Connected first: linear, notion, stripe, then the rest
    key(input(el), { key: "ArrowDown" });
    await settle();
    expect(picked(el)).toBe("notion");
    key(input(el), { key: "ArrowUp" });
    key(input(el), { key: "ArrowUp" });
    await settle();
    expect(picked(el)).toBe("clickup");
    expect(input(el).getAttribute("aria-activedescendant")).toBe(el.querySelector('[aria-selected="true"]')!.id);
    key(input(el), { key: "ArrowLeft" });
    await type(el, "fig");
    expect([...el.querySelectorAll('[role="option"]')].map((o) => o.getAttribute("data-id"))).toEqual(["figma"]);
    await type(el, "zzz");
    expect(el.querySelector(".ui-ip__empty")!.textContent).toBe("No integrations match “zzz”");
    key(input(el), { key: "Escape" });
    await settle();
    expect(input(el).value).toBe("");
    key(input(el), { key: "Escape" });
    expect(events).toEqual(["selected:notion", "selected:linear", "selected:clickup", "back", "close"]);
  });

  test("controlled selection and search: preventDefault keeps the values", async () => {
    const el = await fixture<TcIntegrationPicker>(html`<tc-integration-picker
      selected="stripe"
      @tc-selected-change=${(e: Event) => e.preventDefault()}
      @tc-query-change=${(e: Event) => e.preventDefault()}
    ></tc-integration-picker>`);
    key(input(el), { key: "ArrowDown" });
    await settle();
    expect(picked(el)).toBe("stripe");
    await type(el, "x");
    expect(input(el).value).toBe("");
    el.selected = "figma";
    el.query = "fig";
    await settle();
    expect(picked(el)).toBe("figma");
    expect(input(el).value).toBe("fig");
  });

  test("a row doesn't jump groups while you switch it; a new search regroups", async () => {
    const el = await fixture<TcIntegrationPicker>(html`<tc-integration-picker selected="figma"></tc-integration-picker>`);
    const groupOf = (id: string) => el.querySelector(`[data-id="${id}"]`)!.closest('[role="group"]')!.getAttribute("aria-label");
    expect(groupOf("figma")).toBe("Available");
    sw(el).click();
    await settle();
    expect(groupOf("figma")).toBe("Available");
    await type(el, "f");
    expect(groupOf("figma")).toBe("Connected");
  });

  test("explore fires with the id; a custom app icon is cloned", async () => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("data-mine", "");
    const onExplore = vi.fn();
    const el = await fixture<TcIntegrationPicker>(html`<tc-integration-picker .appIcon=${icon} app-name="Acme" @tc-explore=${(e: CustomEvent<{ id: string }>) => onExplore(e.detail.id)}></tc-integration-picker>`);
    el.querySelector<HTMLButtonElement>(".ui-ip__explore")!.click();
    expect(onExplore).toHaveBeenCalledWith("linear");
    expect(el.querySelector(".ui-ip__tile--app svg[data-mine]")).toBeTruthy();
    expect(el.querySelector("h3")!.textContent).toBe("Acme + Linear");
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-integration-picker back></tc-integration-picker>
      <tc-integration-picker look="clean" back></tc-integration-picker>
    </div>`);
    await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {})));
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
