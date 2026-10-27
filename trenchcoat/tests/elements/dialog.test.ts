import { html, render } from "lit";
import axe from "axe-core";
import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/index";
import { Button, Dialog } from "../../src/elements/react";
import type { TcDialog } from "../../src/elements/dialog";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const buttons = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>("button")];
const named = (el: Element, text: string) => buttons(el).find((b) => b.textContent!.trim() === text);
const footer = (el: Element) => el.querySelector<HTMLElement>(".tc-dialog-footer")!;
const PROPS = ["height", "padding-top", "padding-left", "border-top-width", "border-radius", "box-shadow", "background-color", "color", "font-size", "font-weight", "margin-top", "width"];
const style = (el: Element) => {
  const cs = getComputedStyle(el);
  return Object.fromEntries(PROPS.map((p) => [p, cs.getPropertyValue(p)]));
};

describe("tc-dialog", () => {
  test("hosted content keeps its own styling: a tc-button and a progress tracker render as they do outside", async () => {
    const steps = [
      { id: "a", label: "Spec is valid" },
      { id: "b", label: "Reviewer assigned" },
    ];
    // The dialog sets the body text size; the outside copies get the same, so only leaks would differ
    const wrap = await fixture(html`<div style="font-size: var(--tc-font-size-md)">
      <tc-button label="Outside"></tc-button>
      <tc-progress-tracker title="Outside" .steps=${steps}></tc-progress-tracker>
      <tc-dialog label="Hosted" open></tc-dialog>
    </div>`);
    const dialog = wrap.querySelector<TcDialog>("tc-dialog")!;
    const content = document.createElement("div");
    render(
      html`<tc-button label="Outside"></tc-button><tc-progress-tracker title="Outside" .steps=${steps}></tc-progress-tracker>`,
      content,
    );
    dialog.content = content;
    await settle();
    const [outButton, inButton] = [...wrap.querySelectorAll("tc-button")].map((b) => b.querySelector("button")!);
    expect(inButton.closest("dialog")).not.toBe(null);
    expect(style(inButton)).toEqual(style(outButton));
    const rows = (i: number) => [...wrap.querySelectorAll("tc-progress-tracker")[i].querySelectorAll("li, [role='checkbox']")];
    expect(rows(1).length).toBeGreaterThan(0);
    const box = (el: Element) => ({ ...style(el), width: "", height: String(Math.round(el.getBoundingClientRect().height)) });
    expect(rows(1).map(box)).toEqual(rows(0).map(box));
  });

  test("a primitive placed in the dialog still gets its own styles", async () => {
    const wrap = await fixture(html`<div>
      <tc-switch label="Outside"></tc-switch>
      <tc-dialog label="Hosted" open></tc-dialog>
    </div>`);
    const dialog = wrap.querySelector<TcDialog>("tc-dialog")!;
    const inner = document.createElement("tc-switch");
    inner.setAttribute("label", "Inside");
    dialog.content = inner;
    await settle();
    const [a, b] = [...wrap.querySelectorAll("tc-switch")].map((s) => s.querySelector("input")!);
    expect(b.closest("dialog")).not.toBe(null);
    expect(style(b)).toEqual(style(a));
  });

  test("the primitives' own parts render exactly as with the unscoped rules", async () => {
    const wrap = await fixture(html`<div>
      <tc-number-field label="Workers" .value=${4}></tc-number-field>
      <tc-slider-field label="Temperature" .value=${0.4} .min=${0} .max=${1} .step=${0.1}></tc-slider-field>
      <tc-switch label="Streaming" .value=${true}></tc-switch>
      <tc-checkbox label="Remember" .value=${true}></tc-checkbox>
      <tc-radio-group label="Mode" .options=${[{ value: "a", label: "A" }, { value: "b", label: "B" }]} .value=${"a"}></tc-radio-group>
      <tc-secret-field label="Key" .value=${"sk-1"}></tc-secret-field>
      <tc-tooltip label="Help" text="More"></tc-tooltip>
      <tc-dialog label="Settings" description="Check these first" text="Body"></tc-dialog>
      <tc-number-field look="clean" label="Workers" .value=${4}></tc-number-field>
      <tc-checkbox look="clean" label="Remember" .value=${true}></tc-checkbox>
    </div>`);
    const all = [...wrap.querySelectorAll("*")];
    const snapshot = () => all.map((el) => JSON.stringify([style(el), getComputedStyle(el, "::before").getPropertyValue("background-color")]));
    await document.fonts.ready;
    const scoped = snapshot();
    expect(snapshot()).toEqual(scoped);
    const OWN = /:where\(:not\(\.tc-settings-host \*\), \.tc-settings-host \.tc-settings \*\)/g;
    const sheets = document.adoptedStyleSheets.filter((s) => [...s.cssRules].some((r) => r.cssText.includes("tc-settings-host")));
    expect(sheets.length).toBeGreaterThan(0);
    const before = sheets.map((s) => [...s.cssRules].map((r) => r.cssText).join("\n"));
    sheets.forEach((s, i) => s.replaceSync(before[i].replace(OWN, (_m, at: number, all: string) => (/\s$/.test(all.slice(0, at)) ? "*" : ""))));
    try {
      expect(snapshot()).toEqual(scoped);
    } finally {
      sheets.forEach((s, i) => s.replaceSync(before[i]));
    }
  });

  test("description names the dialog's purpose and describes it", async () => {
    const el = await fixture<TcDialog>(html`<tc-dialog label="Publish" description="Nothing goes live until every check passes." open></tc-dialog>`);
    const desc = el.querySelector("header p")!;
    expect(desc.textContent).toBe("Nothing goes live until every check passes.");
    expect(el.querySelector("dialog")!.getAttribute("aria-describedby")).toBe(desc.id);
    el.description = "";
    await settle();
    expect(el.querySelector("header p")).toBe(null);
    expect(el.querySelector("dialog")!.hasAttribute("aria-describedby")).toBe(false);
  });

  test("Close is primary alone, secondary beside actions, and can be relabelled or hidden", async () => {
    const el = await fixture<TcDialog>(html`<tc-dialog label="Publish" open></tc-dialog>`);
    expect(named(el, "Close")!.dataset.variant).toBe("primary");
    expect(footer(el).getBoundingClientRect().height).toBeGreaterThan(0);

    let published = 0;
    el.actions = html`<tc-button variant="primary" label="Publish" @click=${() => published++}></tc-button>`;
    el.closeLabel = "Cancel";
    await settle();
    expect(named(el, "Cancel")!.dataset.variant).toBe("secondary");
    const action = el.querySelector(".tc-dialog-actions tc-button")!;
    expect(action).not.toBe(null);
    // The app's button sits after Close and keeps its own look
    expect(named(el, "Cancel")!.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    action.querySelector("button")!.click();
    expect(published).toBe(1);

    el.closeButton = "primary";
    await settle();
    expect(named(el, "Cancel")!.dataset.variant).toBe("primary");

    el.closeButton = "hidden";
    await settle();
    expect(named(el, "Cancel")).toBe(undefined);
    expect(footer(el).getBoundingClientRect().height).toBeGreaterThan(0);

    el.actions = undefined;
    await settle();
    expect(getComputedStyle(footer(el)).display).toBe("none");
    // Escape still closes a dialog without a Close button
    el.querySelector("dialog")!.dispatchEvent(new Event("cancel", { cancelable: true }));
    await settle();
    expect(el.open).toBe(false);
  });

  test("close-button and close-label attributes", async () => {
    const el = await fixture<TcDialog>(html`<tc-dialog label="Publish" close-button="secondary" close-label="Not now" open></tc-dialog>`);
    expect(named(el, "Not now")!.dataset.variant).toBe("secondary");
  });

  test("React: actions render in the footer and Close turns secondary", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const log: string[] = [];
    function Demo() {
      const [open, setOpen] = React.useState(true);
      const [n, setN] = React.useState(0);
      return React.createElement(
        Dialog,
        {
          label: "Publish",
          description: "Every check must pass.",
          open,
          onOpenChange: setOpen,
          actions: React.createElement(Button, { variant: "primary", label: `Publish ${n}`, onClick: () => (log.push("publish"), setN((x) => x + 1)) }),
        },
        React.createElement("p", null, "Body"),
      );
    }
    flushSync(() => root.render(React.createElement(Demo)));
    await settle();
    await settle();
    const el = host.querySelector<TcDialog>("tc-dialog")!;
    expect(named(el, "Close")!.dataset.variant).toBe("secondary");
    const action = el.querySelector(".tc-dialog-actions tc-button")!;
    expect(action).not.toBe(null);
    action.querySelector("button")!.click();
    await settle();
    expect(log).toEqual(["publish"]);
    expect(el.querySelector(".tc-dialog-actions tc-button")).toBe(action);
    expect(el.querySelector("header p")!.textContent).toBe("Every check must pass.");
    named(el, "Close")!.click();
    await settle();
    expect(el.open).toBe(false);
    root.unmount();
  });

  for (const scheme of ["light", "dark"] as const)
    for (const look of ["standard", "clean"] as const)
      test(`axe: description, actions and a secondary Close (${look}, ${scheme})`, async () => {
        const wrap = await fixture(html`<div style=${`color-scheme: ${scheme}`}>
          <tc-dialog look=${look} label="Publish" description="Every check must pass." text="Ready to go." open
            .actions=${html`<tc-button variant="primary" label="Publish"></tc-button>`}></tc-dialog>
        </div>`);
        for (const a of document.getAnimations()) if (a.effect?.getTiming().iterations !== Infinity) a.finish();
        const result = await axe.run(wrap.querySelector("dialog")!, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.failureSummary).join("; ")}`)).toEqual([]);
      });
});
