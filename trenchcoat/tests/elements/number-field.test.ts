import { html } from "lit";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/number-field";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);
const clear = async (el: HTMLInputElement) => {
  el.value = "";
  el.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
};
describe("tc-number-field", () => {
  test("clearing an optional field submits nothing instead of the previous value", async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form>
        <tc-number-field name="workers" .value=${4}></tc-number-field>
      </form>`,
    );
    const el = form.querySelector("tc-number-field")!;
    const changes: unknown[] = [];
    el.addEventListener("tc-value-change", (e) =>
      changes.push((e as CustomEvent<{ value: unknown }>).detail.value),
    );
    await clear(el.querySelector("input")!);
    expect(changes).toEqual([null]);
    expect(el.value).toBe(null);
    expect(el.querySelector("input")!.value).toBe("");
    expect(new FormData(form).has("workers")).toBe(false);
    expect(form.checkValidity()).toBe(true);
  });

  test("clearing a required field makes it invalid", async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form>
        <tc-number-field name="workers" required .value=${4}></tc-number-field>
      </form>`,
    );
    const el = form.querySelector("tc-number-field")!;
    expect(form.checkValidity()).toBe(true);
    await clear(el.querySelector("input")!);
    expect(form.checkValidity()).toBe(false);
    expect(el.reportValidity()).toBe(false);
    expect(new FormData(form).has("workers")).toBe(false);
  });
});
