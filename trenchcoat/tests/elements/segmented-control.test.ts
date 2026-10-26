/*
 * <tc-segmented-control> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/segmented-control";
import type { SegmentOption, SegmentValueChange, TcSegmentedControl } from "../../src/elements/segmented-control";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const options: SegmentOption[] = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
];
const radios = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
const checked = (el: Element) => el.querySelector('[role="radio"][aria-checked="true"]')?.textContent?.trim().charAt(0).toLowerCase();
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const pointer = (target: Element, type: string, x: number, y: number, init: PointerEventInit = {}) =>
  target.dispatchEvent(new PointerEvent(type, { button: 0, pointerId: 1, pointerType: "mouse", clientX: x, clientY: y, bubbles: true, cancelable: true, ...init }));

for (const look of ["standard", "clean"] as const) {
  describe(`tc-segmented-control ${look}`, () => {
    test("the host is the root; aria-label names the radiogroup inside", async () => {
      const el = await fixture<TcSegmentedControl>(html`<tc-segmented-control look=${look} aria-label="Pick" .options=${options}></tc-segmented-control>`);
      expect(el.dataset.ui).toBe("seg");
      expect(el.dataset.look).toBe(look);
      expect(el.dataset.size).toBe("md");
      expect(el.dataset.variant).toBe(look === "clean" ? "buttons" : "tray");
      const group = el.querySelector('[role="radiogroup"]')!;
      expect(group.getAttribute("aria-label")).toBe("Pick");
      expect(el.hasAttribute("aria-label")).toBe(false);
      // Unset value: the first enabled option
      expect(checked(el)).toBe("a");
    });

    test("buttons is Clean only – Standard shows it as tray", async () => {
      const el = await fixture<TcSegmentedControl>(html`<tc-segmented-control look=${look} variant="buttons" aria-label="Pick" .options=${options}></tc-segmented-control>`);
      expect(el.dataset.variant).toBe(look === "clean" ? "buttons" : "tray");
    });

    test("controlled value follows its property; a prevented change is reported, not applied", async () => {
      const onChange = vi.fn();
      const el = await fixture<TcSegmentedControl>(html`<tc-segmented-control
        look=${look}
        aria-label="Pick"
        value="a"
        .options=${options}
        @tc-value-change=${(e: CustomEvent<SegmentValueChange>) => {
          e.preventDefault();
          onChange(e.detail.value);
        }}
      ></tc-segmented-control>`);
      expect(checked(el)).toBe("a");
      radios(el)[1].click();
      await settle();
      expect(onChange).toHaveBeenCalledWith("b");
      expect(checked(el)).toBe("a");
      el.value = "b";
      await settle();
      expect(checked(el)).toBe("b");
    });

    test("an option swapped in after the first render (same count) is observed", async () => {
      const observed: Element[] = [];
      const Real = ResizeObserver;
      vi.stubGlobal(
        "ResizeObserver",
        class extends Real {
          override observe(target: Element, opts?: ResizeObserverOptions) {
            observed.push(target);
            super.observe(target, opts);
          }
        },
      );
      const el = await fixture<TcSegmentedControl>(html`<tc-segmented-control look=${look} aria-label="Pick" .options=${options}></tc-segmented-control>`);
      el.options = [options[0], { value: "c", label: "Gamma" }];
      await settle();
      const gamma = radios(el).find((r) => r.textContent!.includes("Gamma"))!;
      expect(observed).toContain(gamma);
      vi.unstubAllGlobals();
    });

    test("name renders a hidden input with the current value; disabled leaves it out of the form", async () => {
      const form = await fixture<HTMLFormElement>(html`<form><tc-segmented-control look=${look} aria-label="Pick" name="plan" value="b" .options=${options}></tc-segmented-control></form>`);
      const el = form.querySelector("tc-segmented-control")!;
      expect(new FormData(form).get("plan")).toBe("b");
      radios(el)[0].click();
      await settle();
      expect(new FormData(form).get("plan")).toBe("a");
      el.disabled = true;
      await settle();
      expect(new FormData(form).get("plan")).toBeNull();
      expect(el.hasAttribute("data-disabled")).toBe(true);
    });

    test("uncontrolled still moves, and keys during IME composition are ignored", async () => {
      const onChange = vi.fn();
      const el = await fixture<TcSegmentedControl>(html`<tc-segmented-control look=${look} aria-label="Pick" .options=${options} @tc-value-change=${(e: CustomEvent<SegmentValueChange>) => onChange(e.detail.value)}></tc-segmented-control>`);
      const group = el.querySelector('[role="radiogroup"]')!;
      key(group, "ArrowRight", { isComposing: true });
      expect(onChange).not.toHaveBeenCalled();
      key(group, "ArrowRight");
      await settle();
      expect(onChange).toHaveBeenCalledWith("b");
      expect(radios(el)[1].getAttribute("aria-checked")).toBe("true");
    });

    test("a mouse press picks on release, not on press (2.5.2)", async () => {
      const onChange = vi.fn();
      const el = await fixture<TcSegmentedControl>(html`<tc-segmented-control look=${look} aria-label="Pick" value="b" .options=${options} @tc-value-change=${(e: CustomEvent<SegmentValueChange>) => onChange(e.detail.value)}></tc-segmented-control>`);
      const track = el.querySelector('[role="radiogroup"]')!;
      const r = radios(el)[0].getBoundingClientRect();
      const x = r.left + 4;
      const y = r.top + r.height / 2;
      pointer(track, "pointerdown", x, y);
      expect(onChange).not.toHaveBeenCalled();
      pointer(track, "pointerup", x, y);
      expect(onChange).toHaveBeenCalledWith("a");
    });

    test("dragging across the options picks as it goes", async () => {
      const onChange = vi.fn();
      const el = await fixture<TcSegmentedControl>(html`<tc-segmented-control look=${look} aria-label="Pick" value="a" .options=${options} @tc-value-change=${(e: CustomEvent<SegmentValueChange>) => onChange(e.detail.value)}></tc-segmented-control>`);
      const track = el.querySelector('[role="radiogroup"]')!;
      const [a, b] = radios(el).map((r) => r.getBoundingClientRect());
      pointer(track, "pointerdown", a.left + 4, a.top + 4);
      expect(el.hasAttribute("data-pressed")).toBe(true);
      pointer(track, "pointermove", b.left + 6, b.top + 4);
      expect(onChange).toHaveBeenCalledWith("b");
      pointer(track, "pointerup", b.left + 6, b.top + 4);
      expect(el.hasAttribute("data-pressed")).toBe(false);
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    test("radiogroup keeps one tab stop; arrows, Home and End move focus with the selection", async () => {
      const el = await fixture<TcSegmentedControl>(html`<tc-segmented-control look=${look} aria-label="Pick" value="a" .options=${[...options, { value: "c", label: "Gamma", disabled: true }, { value: "d", label: "Delta" }]}></tc-segmented-control>`);
      const [alpha, beta, gamma, delta] = radios(el);
      expect(alpha.tabIndex).toBe(0);
      expect(beta.tabIndex).toBe(-1);
      alpha.focus();
      key(alpha, "ArrowRight");
      await settle();
      expect(document.activeElement).toBe(beta);
      expect(beta.getAttribute("aria-checked")).toBe("true");
      expect(beta.tabIndex).toBe(0);
      key(beta, "ArrowDown");
      await settle();
      // The disabled option is skipped
      expect(gamma.disabled).toBe(true);
      expect(document.activeElement).toBe(delta);
      key(delta, "Home");
      await settle();
      expect(document.activeElement).toBe(alpha);
      key(alpha, "End");
      await settle();
      expect(document.activeElement).toBe(delta);
      key(delta, "ArrowRight");
      await settle();
      expect(document.activeElement).toBe(alpha);
    });

    test("tabs: a tablist whose tabs say aria-selected and control their panel; up and down don't move", async () => {
      const el = await fixture<TcSegmentedControl>(html`<tc-segmented-control look=${look} kind="tabs" aria-label="Sections" value="a" .options=${options.map((o) => ({ ...o, controls: "panel" }))}></tc-segmented-control>`);
      const list = el.querySelector('[role="tablist"]')!;
      expect(list.getAttribute("aria-orientation")).toBe("horizontal");
      const tabs = [...el.querySelectorAll('[role="tab"]')];
      expect(tabs.map((t) => t.getAttribute("aria-selected"))).toEqual(["true", "false"]);
      expect(tabs[0].getAttribute("aria-controls")).toBe("panel");
      expect(tabs[0].hasAttribute("aria-checked")).toBe(false);
      key(list, "ArrowDown");
      await settle();
      expect(tabs[0].getAttribute("aria-selected")).toBe("true");
    });

    test("counts, badges, icons and element labels render; the pill sits under the active option", async () => {
      const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      icon.setAttribute("data-mine", "");
      const label = document.createElement("em");
      label.textContent = "Fancy";
      const el = await fixture<TcSegmentedControl>(html`<tc-segmented-control look=${look} aria-label="Pick" value="b" .options=${[{ value: "a", icon, ariaLabel: "Icon" }, { value: "b", label, count: 3, badge: "New" }]}></tc-segmented-control>`);
      await settle();
      const [a, b] = radios(el);
      expect(a.getAttribute("aria-label")).toBe("Icon");
      expect(a.querySelector("svg[data-mine]")).toBeTruthy();
      expect(b.querySelector("em")!.textContent).toBe("Fancy");
      expect(b.querySelector(".ui-seg__count")!.textContent).toBe("3");
      expect(b.querySelector(".ui-seg__badge")!.textContent).toBe("New");
      const pill = el.querySelector<HTMLElement>(".ui-seg__pill")!;
      expect(pill.style.opacity).toBe("1");
      expect(Math.abs(parseFloat(pill.style.left) - b.offsetLeft)).toBeLessThan(1);
    });
  });
}

test("removing the element stops its observers and timers", async () => {
  const disconnect = vi.spyOn(ResizeObserver.prototype, "disconnect");
  const el = await fixture<TcSegmentedControl>(html`<tc-segmented-control aria-label="Pick" .options=${options}></tc-segmented-control>`);
  el.remove();
  expect(disconnect).toHaveBeenCalled();
});

test("axe: no violations in either look, radio and tabs", async () => {
  const wrap = await fixture(html`<div>
    <tc-segmented-control aria-label="Standard" .options=${options}></tc-segmented-control>
    <tc-segmented-control look="clean" aria-label="Clean" .options=${options}></tc-segmented-control>
    <tc-segmented-control kind="tabs" variant="underline" aria-label="Tabs" .options=${options}></tc-segmented-control>
    <tc-segmented-control look="clean" kind="tabs" variant="underline" aria-label="Clean tabs" .options=${options}></tc-segmented-control>
  </div>`);
  await Promise.all(document.getAnimations().map((a) => a.finished));
  const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
});
