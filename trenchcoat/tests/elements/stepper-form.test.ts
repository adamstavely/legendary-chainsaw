/*
 * <tc-stepper-form> and its building blocks in real browsers – the React component's contract and regression checks,
 * ported; plus the React wrapper (portals into the panes) on a real page.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/stepper-form";
import type { StepperContext, StepperFormStep, TcStepperForm } from "../../src/elements/stepper-form";
import { StepperField as RField, StepperForm as RForm, StepperInput as RInput, StepperTags as RTags, type Step as RStep } from "../../src/elements/react/stepper-form";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

type Values = { name: string; invites: string[]; plan: string };
const start: Values = { name: "", invites: ["a@b.co"], plan: "x" };

const steps: StepperFormStep<Values>[] = [
  {
    id: "name",
    title: "Name",
    validate: (v) => ({ name: v.name ? undefined : "Add a name" }),
    render: ({ values, setValues }: StepperContext<Values>) =>
      html`<tc-stepper-field name="name" label="Name" hint="Shown to your team"
        ><tc-stepper-input describedby="extra"
          ><input name="name" .value=${values.name} @input=${(e: Event) => setValues({ name: (e.target as HTMLInputElement).value })} /></tc-stepper-input
      ></tc-stepper-field>`,
  },
  {
    id: "more",
    title: "More",
    render: ({ values, setValues }: StepperContext<Values>) =>
      html`<tc-stepper-field name="invites" label="Invites"
          ><tc-stepper-tags name="invites" required .value=${values.invites} @tc-value-change=${(e: CustomEvent<{ value: string[] }>) => (e.preventDefault(), setValues({ invites: e.detail.value }))}></tc-stepper-tags></tc-stepper-field
        ><tc-stepper-choices
          name="plan"
          label="Plan"
          .value=${values.plan}
          .options=${[
            { value: "x", title: "X" },
            { value: "y", title: "Y", badge: "Popular", aside: "$5" },
          ]}
          @tc-value-change=${(e: CustomEvent<{ value: string }>) => (e.preventDefault(), setValues({ plan: e.detail.value }))}
        ></tc-stepper-choices>`,
  },
];

const form = (el: Element) => el.querySelector<HTMLFormElement>("form.ui-sf__card")!;
const current = (el: Element) => el.querySelector<HTMLElement>('[data-pane="current"]')!;
const currentStep = (el: Element) => [...el.querySelectorAll(".ui-sf__step")].findIndex((li) => li.getAttribute("aria-current") === "step");
const typeInto = (input: HTMLInputElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new InputEvent("input", { bubbles: true }));
};
const key = (t: Element, k: string, init: KeyboardEventInit = {}) => t.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const submit = async (el: Element) => {
  form(el).requestSubmit();
  await settle();
  await settle();
};
const tick = () => new Promise((r) => setTimeout(r, 0));

describe("tc-stepper-form", () => {
  test("the host is the root; the steps and the first pane show", async () => {
    const el = await fixture<TcStepperForm>(html`<tc-stepper-form .steps=${steps} .values=${start}></tc-stepper-form>`);
    expect(el.dataset.ui).toBe("sf");
    expect(el.dataset.look).toBe("standard");
    expect(el.style.getPropertyValue("--tc-stepper-form-n")).toBe("2");
    expect(currentStep(el)).toBe(0);
    expect(current(el).querySelector(".ui-sf__heading")!.textContent).toBe("Name");
    expect(form(el).getAttribute("aria-labelledby")).toBe(current(el).querySelector(".ui-sf__heading")!.id);
    expect(el.querySelector(".ui-sf__compact-text")!.textContent).toBe("Step 1 of 2·Name");
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: controlled values – typing is reported, the parent passes them back`, async () => {
      const seen: Values[] = [];
      const el = await fixture<TcStepperForm>(html`<tc-stepper-form look=${look} .steps=${steps} .values=${start}></tc-stepper-form>`);
      el.addEventListener("tc-values-change", (e) => {
        e.preventDefault();
        seen.push((e as CustomEvent<{ values: Values }>).detail.values);
        el.values = (e as CustomEvent<{ values: Values }>).detail.values;
      });
      const input = current(el).querySelector("input")!;
      typeInto(input, "Ada");
      await settle();
      expect(seen.at(-1)).toEqual({ ...start, name: "Ada" });
      expect(current(el).querySelector("input")!.value).toBe("Ada");
      // The building blocks follow the form's look
      expect(el.querySelector<HTMLElement>("tc-stepper-field")!.dataset.look).toBe(look);
    });

    test(`${look}: the input keeps its field wiring and the page's own description; autocomplete isn't forced`, async () => {
      const el = await fixture<TcStepperForm>(html`<tc-stepper-form look=${look} .steps=${steps} .values=${start}></tc-stepper-form>`);
      const input = current(el).querySelector("input")!;
      expect(input.hasAttribute("autocomplete")).toBe(false);
      expect(input.getAttribute("name")).toBe("name");
      expect(el.querySelector<HTMLLabelElement>(".ui-sf__label")!.htmlFor).toBe(input.id);
      expect(input.labels![0].textContent).toBe("Name");
      const described = input.getAttribute("aria-describedby")!.split(" ");
      expect(described).toContain("extra");
      expect(document.getElementById(described[0])!.textContent).toBe("Shown to your team");
    });

    test(`${look}: a failed Continue shows the message, focuses the field and scrolls it into view; the status says it`, async () => {
      const spy = vi.spyOn(Element.prototype, "scrollIntoView");
      const el = await fixture<TcStepperForm>(html`<tc-stepper-form look=${look} .steps=${steps} .values=${start}></tc-stepper-form>`);
      const status = el.querySelector('[role="status"]')!;
      expect(status.textContent).toBe("");
      await submit(el);
      await vi.waitFor(() => expect(document.activeElement).toBe(current(el).querySelector("input")));
      const input = current(el).querySelector("input")!;
      expect(input.getAttribute("aria-invalid")).toBe("true");
      expect(document.getElementById(input.getAttribute("aria-describedby")!.split(" ")[0])!.textContent).toBe("Add a name");
      expect(el.querySelector("tc-stepper-input")!.hasAttribute("data-invalid")).toBe(true);
      expect(spy).toHaveBeenCalledWith({ block: "nearest" });
      expect(status.textContent).toBe("Add a name");
      expect(currentStep(el)).toBe(0);
      expect(el.querySelector(".ui-sf__btn-primary")!.getAttribute("aria-disabled")).toBe("true");
    });
  }

  test("Continue moves on, focus follows, Back keeps everything, a done step can be jumped to", async () => {
    const el = await fixture<TcStepperForm>(html`<tc-stepper-form .steps=${steps} .values=${{ ...start, name: "Ada" }}></tc-stepper-form>`);
    await submit(el);
    expect(currentStep(el)).toBe(1);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Step 2 of 2: More");
    await vi.waitFor(() => expect(document.activeElement).toBe(current(el).querySelector(".ui-sf__tags-input")));
    expect(el.querySelector(".ui-sf__btn-label")!.textContent).toBe("Finish");
    // The first step is done and can be jumped to
    const first = el.querySelector<HTMLElement>('.ui-sf__step[data-state="done"] button')!;
    first.click();
    await settle();
    expect(currentStep(el)).toBe(0);
    expect(current(el).querySelector("input")!.value).toBe("Ada");
    // From an earlier step, Continue returns to where you came from
    expect(el.querySelector(".ui-sf__btn-label")!.textContent).toBe("Back to more");
    // Back is disabled on the first step
    expect(el.querySelector<HTMLButtonElement>(".ui-sf__btn-ghost")!.disabled).toBe(true);
  });

  test("controlled step: preventDefault keeps it", async () => {
    const el = await fixture<TcStepperForm>(html`<tc-stepper-form .steps=${steps} .values=${{ ...start, name: "Ada" }} @tc-step-change=${(e: Event) => e.preventDefault()}></tc-stepper-form>`);
    await submit(el);
    expect(currentStep(el)).toBe(0);
    el.step = 1;
    await settle();
    expect(currentStep(el)).toBe(1);
  });

  test("tags and choices submit through the form; Enter during IME composition doesn't add a tag", async () => {
    const el = await fixture<TcStepperForm>(html`<tc-stepper-form .steps=${steps} .values=${start} step="1"></tc-stepper-form>`);
    el.addEventListener("tc-values-change", (e) => (el.values = (e as CustomEvent<{ values: Values }>).detail.values));
    expect(new FormData(form(el)).get("invites")).toBe("a@b.co");
    expect(new FormData(form(el)).get("plan")).toBe("x");
    const tags = el.querySelector<HTMLInputElement>(".ui-sf__tags-input")!;
    expect(tags.getAttribute("aria-required")).toBe("true");
    typeInto(tags, "c@d.co");
    await settle();
    key(tags, "Enter", { isComposing: true });
    await settle();
    expect(new FormData(form(el)).get("invites")).toBe("a@b.co");
    key(tags, "Enter");
    await settle();
    expect(new FormData(form(el)).get("invites")).toBe("a@b.co,c@d.co");
    // Choices: arrow keys move the choice
    const x = el.querySelector<HTMLElement>('[role="radio"][data-value="x"]')!;
    x.focus();
    key(x, "ArrowRight");
    await settle();
    expect(new FormData(form(el)).get("plan")).toBe("y");
    expect(document.activeElement).toBe(el.querySelector('[data-value="y"]'));
    expect(el.querySelector('[data-value="y"]')!.getAttribute("aria-checked")).toBe("true");
    expect(el.querySelector('[role="radiogroup"]')!.getAttribute("aria-label")).toBe("Plan");
  });

  test("onComplete gets a signal that aborts when the form is removed, and nothing is set afterwards", async () => {
    let signal: AbortSignal | undefined;
    let resolve = () => {};
    const onComplete = (_: unknown, o: { signal: AbortSignal }) => {
      signal = o.signal;
      return new Promise<void>((r) => (resolve = r));
    };
    const el = await fixture<TcStepperForm>(html`<tc-stepper-form .steps=${steps} .values=${start} step="1" .onComplete=${onComplete}></tc-stepper-form>`);
    await submit(el);
    expect(el.querySelector(".ui-sf__btn-label")!.textContent).toBe("Creating…");
    expect(signal?.aborted).toBe(false);
    el.remove();
    expect(signal?.aborted).toBe(true);
    resolve();
    await tick();
    expect(el.querySelector(".ui-sf__success")).toBeNull();
  });

  test("a rejected onComplete shows an error and can be retried; then the success state takes over", async () => {
    const onComplete = vi.fn().mockRejectedValueOnce(new Error("Server said no")).mockResolvedValueOnce(undefined);
    const el = await fixture<TcStepperForm>(html`<tc-stepper-form .steps=${steps} .values=${start} step="1" .onComplete=${onComplete}></tc-stepper-form>`);
    await submit(el);
    await tick();
    await settle();
    expect(el.querySelector('[role="alert"]')!.textContent).toBe("Server said no");
    await submit(el);
    await tick();
    await settle();
    expect(onComplete).toHaveBeenCalledTimes(2);
    expect(el.querySelector('[role="alert"]')).toBeNull();
    expect(current(el).querySelector("tc-stepper-success .ui-sf__heading")!.textContent).toBe("All set");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("All done");
    expect(el.querySelector(".ui-sf__compact-text")!.textContent).toBe("All 2 steps done");
  });

  test("a tag that isn't an email is announced by the one status region, and shakes its field", async () => {
    const el = await fixture<TcStepperForm>(html`<tc-stepper-form .steps=${steps} .values=${{ ...start, invites: [] }} step="1"></tc-stepper-form>`);
    const status = el.querySelector('[role="status"]')!;
    const input = el.querySelector<HTMLInputElement>(".ui-sf__tags-input")!;
    typeInto(input, "nope");
    key(input, "Enter");
    await settle();
    expect(status.textContent).toBe("That doesn't look like an email address");
    expect(el.querySelectorAll('[role="status"]')).toHaveLength(1);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.value).toBe("nope");
  });

  test("removing a chip moves focus to the next chip's ×, then the previous one, then the text field", async () => {
    const el = await fixture<TcStepperForm>(html`<tc-stepper-form .steps=${steps} .values=${{ ...start, invites: ["a@b.co", "c@d.co", "e@f.co"] }} step="1"></tc-stepper-form>`);
    el.addEventListener("tc-values-change", (e) => (el.values = (e as CustomEvent<{ values: Values }>).detail.values));
    const x = (entry: string) => el.querySelector<HTMLButtonElement>(`[aria-label="Remove ${entry}"]`)!;
    x("a@b.co").focus();
    x("a@b.co").click();
    expect(document.activeElement).toBe(x("c@d.co"));
    x("e@f.co").focus();
    x("e@f.co").click();
    expect(document.activeElement).toBe(x("c@d.co"));
    x("c@d.co").click();
    expect(document.activeElement).toBe(el.querySelector(".ui-sf__tags-input"));
    await vi.waitFor(() => expect(el.querySelectorAll(".ui-sf__chip").length).toBe(0));
  });

  test("review rows and success are elements too", async () => {
    const onEdit = vi.fn();
    const wrap = await fixture(html`<div data-look="standard">
      <tc-stepper-review editable .rows=${[{ label: "Plan", value: "Team", step: "plan" }, { label: "Seats", value: "4" }]} @tc-edit=${(e: CustomEvent<{ step: string }>) => onEdit(e.detail.step)}></tc-stepper-review>
      <tc-stepper-success heading="Done" description="Saved."><button type="button">Again</button></tc-stepper-success>
    </div>`);
    const edit = wrap.querySelector<HTMLButtonElement>(".ui-sf__edit")!;
    expect(edit.getAttribute("aria-label")).toBe("Edit plan");
    edit.click();
    expect(onEdit).toHaveBeenCalledWith("plan");
    expect(wrap.querySelectorAll(".ui-sf__edit")).toHaveLength(1);
    const success = wrap.querySelector("tc-stepper-success")!;
    expect([...success.children].map((c) => c.className || c.tagName)).toEqual(["ui-sf__success-check", "ui-sf__heading", "ui-sf__desc", "BUTTON"]);
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-stepper-form .steps=${steps} .values=${start}></tc-stepper-form>
      <tc-stepper-form look="clean" .steps=${steps} .values=${start} step="1"></tc-stepper-form>
    </div>`);
    await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {})));
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});

/* The React wrapper: each step's React content is portaled into its pane, hooks and controlled inputs keep working */
describe("StepperForm (React wrapper)", () => {
  type V = { name: string; invites: string[] };
  const h = React.createElement;
  const rsteps: RStep<V>[] = [
    {
      id: "name",
      title: "Name",
      validate: (v) => ({ name: v.name ? undefined : "Add a name" }),
      render: ({ values, setValues }) =>
        h(RField, { name: "name", label: "Name", hint: "Shown to your team", children: h(RInput, { prefix: "@", value: values.name, onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValues({ name: e.target.value }) }) }),
    },
    {
      id: "team",
      title: "Team",
      render: ({ values, setValues }) => h(RField, { name: "invites", label: "Invites", children: h(RTags, { value: values.invites, name: "invites", onChange: (invites) => setValues({ invites }) }) }),
    },
  ];

  test("steps render with portals; typing, Continue and the deprecated initial* props work", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const onValuesChange = vi.fn();
    await act(async () => root.render(h(RForm<V>, { steps: rsteps, initialValues: { name: "", invites: [] }, onValuesChange })));
    await settle();
    await act(async () => {});
    const el = host.querySelector("tc-stepper-form")!;
    const input = current(el).querySelector<HTMLInputElement>(".ui-sf__control input")!;
    expect(input.labels![0].textContent).toBe("Name");
    expect(el.querySelector(".ui-sf__prefix")!.textContent).toBe("@");
    await act(async () => {
      input.focus();
      // React's onChange listens for input events through its value tracker
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      setter.call(input, "Ada");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(onValuesChange).toHaveBeenLastCalledWith({ name: "Ada", invites: [] });
    expect(input.value).toBe("Ada");
    await act(async () => form(el).requestSubmit());
    await settle();
    await act(async () => {});
    expect(currentStep(el)).toBe(1);
    await vi.waitFor(() => expect(current(el).querySelector(".ui-sf__tags-input")).toBeTruthy());
    // The name set as a property by React reaches the form
    expect(new FormData(form(el)).get("invites")).toBe("");
    act(() => root.unmount());
  });
});
