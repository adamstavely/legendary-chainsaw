import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/index";
import type { TcNumberField } from "../../src/elements/number-field";
import type { TcDialog } from "../../src/elements/dialog";
import type { TcSecretField } from "../../src/elements/secret-field";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);
const input = async (
  el: HTMLInputElement | HTMLTextAreaElement,
  value: string,
) => {
  el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
};
const button = (el: Element, text: string) =>
  [...el.querySelectorAll<HTMLButtonElement>("button")].find(
    (b) => b.textContent!.trim() === text,
  )!;
describe("settings controls", () => {
  test("number field: a rejected edit restores the visible value; native form reset restores the initial value", async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form>
        <tc-number-field
          name="workers"
          label="Workers"
          .value=${4}
          .min=${1}
          .max=${32}
        ></tc-number-field>
      </form>`,
    );
    const el = form.querySelector<TcNumberField>("tc-number-field")!;
    const reject = (e: Event) => e.preventDefault();
    el.addEventListener("tc-value-change", reject);
    await input(el.querySelector("input")!, "8");
    expect(el.value).toBe(4);
    expect(el.querySelector("input")!.value).toBe("4");
    el.removeEventListener("tc-value-change", reject);
    await input(el.querySelector("input")!, "8");
    expect(new FormData(form).get("workers")).toBe("8");
    form.reset();
    await settle();
    expect(el.value).toBe(4);
    const fieldset = document.createElement("fieldset");
    form.append(fieldset);
    fieldset.append(el);
    fieldset.disabled = true;
    await settle();
    expect(new FormData(form).has("workers")).toBe(false);
    expect(el.querySelector("fieldset")!.disabled).toBe(true);
  });

  test("slider and number stay synchronized; radio groups submit only their public name", async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form>
        <tc-slider-field
          label="Temperature"
          .value=${0.7}
          .max=${2}
          .step=${0.01}
        ></tc-slider-field
        ><tc-radio-group
          name="mode"
          label="Mode"
          .value=${"ask"}
          .options=${[
            { value: "ask", label: "Ask" },
            { value: "auto", label: "Automatic" },
          ]}
        ></tc-radio-group>
      </form>`,
    );
    const slider = form.querySelector(
      'input[type="range"]',
    ) as HTMLInputElement;
    await input(slider, "1.2");
    expect(
      (form.querySelector('input[type="number"]') as HTMLInputElement).value,
    ).toBe("1.2");
    form.querySelector<HTMLInputElement>('input[value="auto"]')!.click();
    await settle();
    expect([...new FormData(form)]).toEqual([["mode", "auto"]]);
  });

  test("boolean controls respect required and disabled states", async () => {
    const form = await fixture<HTMLFormElement>(
      html`<form>
        <tc-checkbox name="accepted" label="Accept terms" required></tc-checkbox
        ><tc-switch name="enabled" label="Enabled"></tc-switch>
      </form>`,
    );
    expect(form.checkValidity()).toBe(false);
    form.querySelector<HTMLInputElement>("tc-checkbox input")!.click();
    await settle();
    expect(form.checkValidity()).toBe(true);
    expect(new FormData(form).get("accepted")).toBe("true");
  });

  test("secrets start masked, reveal explicitly and mask again after removal", async () => {
    const el = await fixture<TcSecretField>(
      html`<tc-secret-field
        label="API key"
        .value=${"secret"}
      ></tc-secret-field>`,
    );
    expect(el.querySelector("input")!.type).toBe("password");
    button(el, "Show API key").click();
    await settle();
    expect(el.querySelector("input")!.type).toBe("text");
    el.remove();
    document.body.append(el);
    await settle();
    expect(el.querySelector("input")!.type).toBe("password");
  });

  test("tooltip opens on focus, dismisses with Escape and supports pointer hover", async () => {
    const el = await fixture(
      html`<tc-tooltip
        label="Sampling help"
        text="About temperature"
      ></tc-tooltip>`,
    );
    const trigger = el.querySelector("button")!;
    trigger.focus();
    await settle();
    expect((el.querySelector('[role="tooltip"]') as HTMLElement).hidden).toBe(
      false,
    );
    trigger.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    await settle();
    expect((el.querySelector('[role="tooltip"]') as HTMLElement).hidden).toBe(
      true,
    );
  });

  test("dialog contains focus, supports controlled close cancellation, and restores the opener", async () => {
    const wrap = await fixture(
      html`<div>
        <button>Open</button
        ><tc-dialog label="Settings" text="Review configuration"></tc-dialog>
      </div>`,
    );
    const opener = wrap.querySelector("button")!;
    opener.focus();
    const el = wrap.querySelector<TcDialog>("tc-dialog")!;
    el.open = true;
    await settle();
    expect(el.querySelector("dialog")!.open).toBe(true);
    expect(el.contains(document.activeElement)).toBe(true);
    const reject = (e: Event) => e.preventDefault();
    el.addEventListener("tc-open-change", reject);
    button(el, "Close").click();
    await settle();
    expect(el.open).toBe(true);
    el.removeEventListener("tc-open-change", reject);
    button(el, "Close").click();
    await settle();
    expect(el.open).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  const tags = [
    "number-field",
    "slider-field",
    "switch",
    "checkbox",
    "radio-group",
    "secret-field",
    "tooltip",
    "dialog",
  ];
  for (const look of ["standard", "clean"])
    test.each(tags)(`%s: accessible in ${look}`, async (slug) => {
      const el = document.createElement(`tc-${slug}`);
      el.setAttribute("look", look);
      document.body.append(el);
      await settle();
      const result = await axe.run(el, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
        },
        resultTypes: ["violations"],
      });
      expect(
        result.violations.map(
          (v) => `${v.id}: ${v.nodes.map((n) => n.failureSummary).join("; ")}`,
        ),
      ).toEqual([]);
    });
});
