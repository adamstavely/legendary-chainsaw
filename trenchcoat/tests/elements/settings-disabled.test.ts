/*
 * Settings controls disabled and then enabled again, as an app does while it saves, can be used again.
 */
import { html } from "lit";
import { afterEach, expect, test } from "vitest";
import "../../src/elements/index";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

test.each(["tc-switch", "tc-checkbox", "tc-select", "tc-number-field"])("%s enabled again can be used", async (tag) => {
  if (!customElements.get(tag)) return;
  const form = await fixture<HTMLFormElement>(html`<form></form>`);
  const el = document.createElement(tag) as HTMLElement & { disabled: boolean };
  el.setAttribute("label", "Setting");
  form.append(el);
  await settle();
  const controls = () => [...el.querySelectorAll<HTMLInputElement | HTMLButtonElement | HTMLFieldSetElement>("input, button, select, fieldset")];
  el.disabled = true;
  await settle();
  expect(controls().some((c) => c.disabled)).toBe(true);
  el.disabled = false;
  await settle();
  expect(controls().filter((c) => c.disabled)).toEqual([]);
});
