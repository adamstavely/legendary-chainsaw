/* <tc-error-shake> in real browsers: no shake on load, one shake per change, the message as the only alert, aria on
 * the fields (and taken back), React, and axe in both themes. */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { TcErrorShake } from "../../src/elements/error-shake";
import { ErrorShake } from "../../src/elements/react/error-shake";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const field = (invalid = false) =>
  fixture<TcErrorShake>(html`<tc-error-shake ?invalid=${invalid} message="Enter a case number like FR-2041"><label>Case number <input aria-describedby="hint" /></label><p id="hint">Six characters</p></tc-error-shake>`);
const input = (el: Element) => el.querySelector("input")!;

describe("tc-error-shake", () => {
  test("starts quiet, and an element that loads invalid shows the error without shaking", async () => {
    const ok = await field();
    expect(ok.dataset.ui).toBe("esk");
    expect(ok.querySelector(".ui-esk__message")).toBeNull();
    expect(input(ok).hasAttribute("aria-invalid")).toBe(false);
    cleanup();
    const bad = await field(true);
    expect(bad.hasAttribute("data-shaking")).toBe(false);
    expect(bad.querySelector(".ui-esk__message")!.textContent).toContain("Enter a case number");
    expect(input(bad).getAttribute("aria-invalid")).toBe("true");
  });

  test("turning invalid shakes once, shows the alert and marks the field; turning valid takes it all back", async () => {
    expect(TcErrorShake.css).not.toMatch(/\binfinite\b/);
    const el = await field();
    el.invalid = true;
    await settle();
    expect(el.hasAttribute("data-shaking")).toBe(true);
    const shake = el.querySelector("label")!.getAnimations()[0]!;
    expect(shake.effect!.getComputedTiming().iterations).toBe(1);
    const message = el.querySelector(".ui-esk__message")!;
    expect(message.getAttribute("role")).toBe("alert");
    expect(el.querySelectorAll("[role='alert']")).toHaveLength(1);
    expect(input(el).getAttribute("aria-invalid")).toBe("true");
    expect(input(el).getAttribute("aria-describedby")).toBe(`hint ${message.id}`);
    await finish(el);
    await expect.poll(() => el.hasAttribute("data-shaking")).toBe(false);
    el.invalid = false;
    await settle();
    expect(el.querySelector(".ui-esk__message")).toBeNull();
    expect(input(el).hasAttribute("aria-invalid")).toBe(false);
    expect(input(el).getAttribute("aria-describedby")).toBe("hint");
  });

  test("a new shake key shakes again while invalid, and shake() works any time", async () => {
    const el = await field(true);
    el.shakeKey = 1;
    await settle();
    expect(el.hasAttribute("data-shaking")).toBe(false);
    el.shakeKey = 2;
    await settle();
    expect(el.hasAttribute("data-shaking")).toBe(true);
    await finish(el);
    await expect.poll(() => el.hasAttribute("data-shaking")).toBe(false);
    el.invalid = false;
    await settle();
    el.shake();
    expect(el.hasAttribute("data-shaking")).toBe(true);
  });

  test("no message: the outline and aria-invalid, no alert and no describedby", async () => {
    const el = await fixture<TcErrorShake>(html`<tc-error-shake invalid><input aria-label="Code" /></tc-error-shake>`);
    expect(el.querySelector("[role='alert']")).toBeNull();
    expect(input(el).getAttribute("aria-invalid")).toBe("true");
    expect(input(el).hasAttribute("aria-describedby")).toBe(false);
    expect(getComputedStyle(input(el)).borderTopColor).not.toBe("");
  });

  test("React wrapper: invalid and the shake key drive it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const render = (invalid: boolean, tries: number) =>
      act(async () => root.render(React.createElement(ErrorShake, { invalid, shakeKey: tries, message: "Wrong format" }, React.createElement("input", { "aria-label": "Case" }))));
    await render(false, 0);
    await settle();
    const el = host.querySelector("tc-error-shake")!;
    expect(el.querySelector("[role='alert']")).toBeNull();
    await render(true, 1);
    await settle();
    expect(el.hasAttribute("data-shaking")).toBe(true);
    expect(el.querySelector("[role='alert']")!.textContent).toContain("Wrong format");
    expect(el.querySelector("input")!.getAttribute("aria-invalid")).toBe("true");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations, valid and invalid`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base); color: var(--tc-text-primary); display: grid; gap: 16px">
        <tc-error-shake message="Enter a case number"><label>Case number <input /></label></tc-error-shake>
        <tc-error-shake invalid message="Enter a case number like FR-2041"><label>Case number <input value="FR 2041" /></label></tc-error-shake>
      </div>`);
      await finish(wrap);
      const { violations } = await axe.run(wrap);
      expect(violations.map((v) => v.id)).toEqual([]);
    });
  }
});
