import { html } from "lit";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/slider-field";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);
const clear = async (el: HTMLInputElement) => {
  el.value = "";
  el.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
};
describe("tc-slider-field", () => {
  test("clearing the number box of an optional field submits nothing instead of the previous value", async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form>
        <tc-slider-field name="temperature" .value=${40}></tc-slider-field>
      </form>`,
    );
    const el = form.querySelector("tc-slider-field")!;
    const changes: unknown[] = [];
    el.addEventListener("tc-value-change", (e) =>
      changes.push((e as CustomEvent<{ value: unknown }>).detail.value),
    );
    await clear(el.querySelector('input[type="number"]')!);
    expect(changes).toEqual([null]);
    expect(el.value).toBe(null);
    expect(el.querySelector<HTMLInputElement>('input[type="number"]')!.value).toBe("");
    expect(new FormData(form).has("temperature")).toBe(false);
    expect(form.checkValidity()).toBe(true);
    const range = el.querySelector<HTMLInputElement>('input[type="range"]')!;
    range.value = "60";
    range.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(new FormData(form).get("temperature")).toBe("60");
  });

  test("clearing a required field makes it invalid", async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form>
        <tc-slider-field name="temperature" required .value=${40}></tc-slider-field>
      </form>`,
    );
    const el = form.querySelector("tc-slider-field")!;
    expect(form.checkValidity()).toBe(true);
    await clear(el.querySelector('input[type="number"]')!);
    expect(form.checkValidity()).toBe(false);
    expect(el.reportValidity()).toBe(false);
    expect(new FormData(form).has("temperature")).toBe(false);
  });
});
