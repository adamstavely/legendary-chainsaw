/* <tc-collapse> in real browsers: shut and open, shut content out of reach, height following content, and axe. */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/collapse";
import type { TcCollapse } from "../../src/elements/collapse";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const collapse = (open = false) => fixture<TcCollapse>(html`<tc-collapse ?open=${open}><div><button>Inside</button><p style="height: 50px; margin: 0">Text</p></div></tc-collapse>`);

describe("tc-collapse", () => {
  test("shut content has no height and can't be reached", async () => {
    const el = await collapse();
    await finish(el);
    expect(el.dataset.ui).toBe("cps");
    expect(el.hasAttribute("inert")).toBe(true);
    expect(el.getBoundingClientRect().height).toBe(0);
    const button = el.querySelector("button")!;
    button.focus();
    expect(document.activeElement).not.toBe(button);
  });

  test("open content has its real height, and follows changes to it", async () => {
    const el = await collapse(true);
    await finish(el);
    expect(el.hasAttribute("inert")).toBe(false);
    const height = el.getBoundingClientRect().height;
    expect(height).toBeGreaterThan(50);
    el.querySelector("p")!.style.height = "100px";
    expect(el.getBoundingClientRect().height).toBeGreaterThan(height);
  });

  test("toggling updates it", async () => {
    const el = await collapse();
    el.open = true;
    await settle();
    await finish(el);
    expect(el.getBoundingClientRect().height).toBeGreaterThan(50);
    el.open = false;
    await settle();
    await finish(el);
    expect(el.getBoundingClientRect().height).toBe(0);
  });

  test("axe: no violations", async () => {
    const el = await collapse(true);
    const { violations } = await axe.run(el);
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});
