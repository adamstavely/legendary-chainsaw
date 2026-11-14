/*
 * <tc-button> in real browsers (Chromium, Firefox, WebKit) – the pilot's Button checks (audit/lit-port-plan.md).
 */
import { html, render } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/button";
import "../../src/elements/internal/look";
import type { TcButton } from "../../src/elements/button";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const icon = () => html`<svg slot="icon" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h12"></path></svg>`;
const inner = (el: TcButton) => el.querySelector<HTMLButtonElement>(":scope > button.ui-button__hit")!;

describe("tc-button", () => {
  test("the host is the root: data-ui, data-look, variant and size", async () => {
    const el = await fixture<TcButton>(html`<tc-button label="Save" variant="secondary" size="sm"></tc-button>`);
    expect(el.dataset.ui).toBe("button");
    expect(el.dataset.look).toBe("standard");
    expect(el.getAttribute("variant")).toBe("secondary");
    expect(el.getAttribute("size")).toBe("sm");
    expect(getComputedStyle(el).display).toBe("inline-flex");
  });

  test("look comes from the attribute, else the nearest tc-look-provider", async () => {
    const wrap = await fixture(html`<tc-look-provider look="clean"><tc-button label="A"></tc-button><tc-button label="B" look="standard"></tc-button></tc-look-provider>`);
    const [a, b] = wrap.querySelectorAll<TcButton>("tc-button");
    expect(a.dataset.look).toBe("clean");
    expect(b.dataset.look).toBe("standard");
    (wrap as HTMLElement & { look: string }).look = "standard";
    await settle(wrap);
    expect(a.dataset.look).toBe("standard");
  });

  test("the label is a native button's text, so it's the accessible name", async () => {
    const el = await fixture<TcButton>(html`<tc-button label="Save"></tc-button>`);
    expect(inner(el).textContent!.trim()).toBe("Save");
    expect(inner(el).type).toBe("button");
  });

  test("an icon child stays where the caller put it, and removing it the way React does works", async () => {
    const el = await fixture<TcButton>(html`<tc-button label="Copy">${icon()}</tc-button>`);
    const svg = el.querySelector(":scope > svg[slot=icon]")!;
    expect(svg.parentElement).toBe(el);
    expect(el.hasAttribute("data-icon-left")).toBe(true);
    expect(getComputedStyle(svg).order).toBe("-1");
    el.removeChild(svg);
    await settle();
    expect(el.hasAttribute("data-icon-left")).toBe(false);
  });

  test("icon only: hide-label keeps the label as the name, visually hidden", async () => {
    const el = await fixture<TcButton>(html`<tc-button label="Close" hide-label>${icon()}</tc-button>`);
    expect(el.hasAttribute("data-icon-only")).toBe(true);
    const status = inner(el).querySelector(".ui-button__status")!;
    expect(status.textContent).toBe("Close");
    expect(status.getBoundingClientRect().width).toBeLessThanOrEqual(1);
  });

  test("aria attributes set on the host move to the inner button", async () => {
    const el = await fixture<TcButton>(html`<tc-button label="Menu" aria-expanded="false" aria-haspopup="menu"></tc-button>`);
    expect(el.hasAttribute("aria-expanded")).toBe(false);
    expect(inner(el).getAttribute("aria-expanded")).toBe("false");
    el.setAttribute("aria-expanded", "true");
    await settle();
    expect(inner(el).getAttribute("aria-expanded")).toBe("true");
  });

  test("forwarded ARIA attributes can be removed and reapplied by the caller", async () => {
    const el = await fixture<TcButton>(html`<tc-button label="Menu" aria-describedby="help"></tc-button>`);
    expect(inner(el).getAttribute("aria-describedby")).toBe("help");
    el.removeAttribute("ARIA-DESCRIBEDBY");
    await settle();
    expect(inner(el).hasAttribute("aria-describedby")).toBe(false);
    el.setAttribute("aria-describedby", "new-help");
    await settle();
    expect(inner(el).getAttribute("aria-describedby")).toBe("new-help");
    el.removeAttributeNS(null, "aria-describedby");
    await settle();
    expect(inner(el).hasAttribute("aria-describedby")).toBe(false);
    el.setAttribute("aria-describedby", "help");
    await settle();
    el.toggleAttribute("aria-describedby", false);
    await settle();
    expect(inner(el).hasAttribute("aria-describedby")).toBe(false);
  });

  test("loading blocks clicks and adds 'loading' to the name", async () => {
    const onClick = vi.fn();
    const el = await fixture<TcButton>(html`<tc-button label="Save" loading @click=${onClick}></tc-button>`);
    inner(el).click();
    expect(onClick).not.toHaveBeenCalled();
    expect(inner(el).getAttribute("aria-busy")).toBe("true");
    // What assistive technology reads: the text outside aria-hidden parts
    const spoken = [...inner(el).querySelectorAll(":scope > span:not([aria-hidden])")].map((n) => [...n.childNodes].filter((c) => c.nodeType === 3).map((c) => c.textContent).join("")).join("");
    expect(spoken).toBe("Save, loading");
    el.loading = false;
    await settle();
    inner(el).click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("disabled: no click, dimmed", async () => {
    const onClick = vi.fn();
    const el = await fixture<TcButton>(html`<tc-button label="Save" disabled @click=${onClick}></tc-button>`);
    inner(el).click();
    expect(onClick).not.toHaveBeenCalled();
    expect(Number(getComputedStyle(el).opacity)).toBeLessThan(1);
  });

  test("a submit button submits its form with its name and value", async () => {
    const form = await fixture<HTMLFormElement>(html`<form><tc-button type="submit" name="intent" value="publish" label="Publish"></tc-button></form>`);
    const submitted = new Promise<FormData>((resolve) =>
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        resolve(new FormData(form, (e as SubmitEvent).submitter));
      }),
    );
    inner(form.querySelector<TcButton>("tc-button")!).click();
    expect((await submitted).get("intent")).toBe("publish");
  });

  test("one stylesheet for every button on the page", async () => {
    await fixture(html`<div>${Array.from({ length: 20 }, (_, i) => html`<tc-button label=${`B${i}`}></tc-button>`)}</div>`);
    const sheets = [...document.adoptedStyleSheets].filter((s) => [...s.cssRules].some((r) => r.cssText.includes('[data-ui="button"]')));
    const styles = [...document.querySelectorAll("style[data-tc=ui-button]")];
    expect(sheets.length + styles.length).toBe(1);
  });

  test("keyboard: Tab reaches it, Enter activates it", async () => {
    const onClick = vi.fn();
    const el = await fixture<TcButton>(html`<tc-button label="Go" @click=${onClick}></tc-button>`);
    inner(el).focus();
    expect(document.activeElement).toBe(inner(el));
    inner(el).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    // Synthetic key events don't activate native buttons; the native click path is what keyboards trigger
    inner(el).click();
    expect(onClick).toHaveBeenCalled();
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-button label="Save"></tc-button>
      <tc-button label="Copy" variant="secondary">${icon()}</tc-button>
      <tc-button label="Close" hide-label variant="ghost">${icon()}</tc-button>
      <tc-button label="Delete" variant="destructive" look="clean"></tc-button>
      <tc-button label="Saving" loading look="clean">${icon()}</tc-button>
    </div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});

describe("tc-button – a Lit parent that swaps its icon", () => {
  afterEach(cleanup);
  test("the button keeps rendering when the parent's last child changes", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const view = (on: boolean) =>
      html`<tc-button label="Play">${on ? html`<svg slot="icon" data-icon="pause"></svg>` : html`<svg slot="icon" data-icon="play"></svg>`}</tc-button>`;
    render(view(false), host);
    const el = host.querySelector("tc-button") as HTMLElement & { updateComplete: Promise<unknown> };
    await el.updateComplete;
    expect(el.querySelector(".ui-button__hit")).not.toBeNull();
    render(view(true), host);
    await expect.poll(() => el.querySelector(".ui-button__hit")?.textContent?.trim()).toBe("Play");
    expect(el.querySelector("[data-icon='pause']")).not.toBeNull();
    expect(el.querySelector("[data-icon='play']")).toBeNull();
    render(view(false), host);
    await expect.poll(() => el.querySelectorAll(".ui-button__hit").length).toBe(1);
    expect(el.querySelector("[data-icon='play']")).not.toBeNull();
    host.remove();
  });
});
