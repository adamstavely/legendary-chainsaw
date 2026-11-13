/*
 * <tc-recipe-card> in real browsers: scaling and formatting quantities, metric and imperial, ticking ingredients,
 * the current step, timers, controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/recipe-card";
import { convertQuantity, formatQuantity, stepTimer, type RecipeIngredient, type RecipeStep, type TcRecipeCard } from "../../src/elements/recipe-card";
import { RecipeCard } from "../../src/elements/react/recipe-card";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const INGREDIENTS: RecipeIngredient[] = [
  { id: "squash", quantity: 500, unit: "g", name: "butternut squash", note: "cubed" },
  { id: "milk", quantity: 400, unit: "ml", name: "coconut milk" },
  { id: "paste", quantity: 2, unit: "tbsp", name: "curry paste" },
  { id: "onion", quantity: 1, name: "onion" },
  { id: "salt", name: "salt" },
];
const STEPS: RecipeStep[] = ["Roast the squash at 200°C for 25 minutes.", "Soften the onion.", "Simmer for 2 seconds.", { text: "Rest the curry.", timer: 3 }];
const make = (look = "standard") =>
  fixture<TcRecipeCard>(
    html`<tc-recipe-card look=${look} heading="Curry" description="For four" prep-minutes="15" cook-minutes="40" base-servings="4" .ingredients=${INGREDIENTS} .steps=${STEPS}></tc-recipe-card>`,
  );
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
/** Each ingredient's quantity as shown (the visible, aria-hidden part) */
const shown = (el: Element) => [...el.querySelectorAll(".ui-rcpe__qty")].map((q) => text(q.querySelector('[aria-hidden="true"]') ?? q));
const spoken = (el: Element) => [...el.querySelectorAll(".ui-rcpe__qty .tc-sr-only")].map((q) => text(q));
const status = (el: Element) => text(el.querySelector('[role="status"]'));
const servingButtons = (el: Element) => el.querySelectorAll<HTMLButtonElement>(".ui-rcpe__servings button");

describe("formatting and converting", () => {
  test("quantities as cooks write them, and in words", () => {
    expect(formatQuantity(0.5)).toEqual({ text: "½", spoken: "1/2" });
    expect(formatQuantity(4 / 3)).toEqual({ text: "1⅓", spoken: "1 and 1/3" });
    expect(formatQuantity(2.97).text).toBe("3");
    expect(formatQuantity(0.04).text).toBe("0.1");
    expect(formatQuantity(12.4).text).toBe("12");
  });
  test("units convert, and spoons and counts stay", () => {
    expect(convertQuantity(500, "g", "imperial")[1]).toBe("lb");
    expect(convertQuantity(100, "g", "imperial")).toEqual([100 / 28.3495, "oz"]);
    expect(convertQuantity(480, "ml", "imperial")).toEqual([2, "cup"]);
    expect(convertQuantity(2, "cup", "metric")).toEqual([480, "ml"]);
    expect(convertQuantity(2, "tbsp", "imperial")).toEqual([2, "tbsp"]);
    expect(convertQuantity(1, undefined, "imperial")).toEqual([1, undefined]);
  });
  test("a step's timer from its words", () => {
    expect(stepTimer("Simmer for 20 minutes")).toBe(1200);
    expect(stepTimer("Bake 25–30 mins")).toBe(1500);
    expect(stepTimer("Rest for 1 hour")).toBe(3600);
    expect(stepTimer("Stir well")).toBeNull();
    expect(stepTimer({ text: "Rest", timer: 90 })).toBe(90);
  });
});

describe("tc-recipe-card", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the heading, times, servings, units, ingredients and steps`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("rcpe");
      expect(el.dataset.look).toBe(look);
      expect(text(el.querySelector(".tc-head__title"))).toBe("Curry");
      expect(text(el.querySelector(".ui-rcpe__times"))).toBe("Prep 15 min · Cook 40 min");
      expect(text(el.querySelector(".ui-rcpe__count"))).toBe("4");
      expect(shown(el)).toEqual(["500 g", "400 ml", "2 tbsp", "1", "to taste"]);
      expect(el.querySelectorAll(".ui-rcpe__step")).toHaveLength(4);
      expect(el.querySelector(".ui-rcpe__step")!.getAttribute("aria-current")).toBe("step");
      // Steps that name a time get a timer; one with an explicit timer too
      expect([...el.querySelectorAll(".ui-rcpe__step")].map((s) => !!s.querySelector(".ui-rcpe__timer"))).toEqual([true, false, true, true]);
      expect(el.querySelector(".ui-rcpe__servings")!.getAttribute("role")).toBe("group");
      expect(el.querySelectorAll<HTMLInputElement>('.ui-rcpe__units input[type="radio"]')[0].checked).toBe(true);
    });
  }

  test("servings scale every quantity, within the limits; the event is cancelable", async () => {
    const el = await make();
    const seen: number[] = [];
    el.addEventListener("tc-servings-change", (e) => seen.push((e as CustomEvent<{ servings: number }>).detail.servings));
    const [fewer, more] = servingButtons(el);
    more.click();
    more.click();
    await settle();
    expect(seen).toEqual([5, 6]);
    expect(shown(el)).toEqual(["750 g", "600 ml", "3 tbsp", "1½", "to taste"]);
    expect(spoken(el)[3]).toBe("1 and 1/2");
    expect(status(el)).toBe("6 servings");
    el.addEventListener("tc-servings-change", (e) => e.preventDefault(), { once: true });
    fewer.click();
    await settle();
    expect(el.servings).toBe(6);
    el.servings = 1;
    await settle();
    expect(servingButtons(el)[0].disabled).toBe(true);
    expect(shown(el)[3]).toBe("¼");
  });

  test("imperial converts weights, volumes and oven temperatures; spoons stay", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-units-change", (e) => seen.push((e as CustomEvent<{ units: string }>).detail.units));
    const imperial = el.querySelectorAll<HTMLInputElement>('.ui-rcpe__units input[type="radio"]')[1];
    imperial.click();
    await settle();
    expect(seen).toEqual(["imperial"]);
    expect(el.units).toBe("imperial");
    expect(shown(el).slice(0, 3)).toEqual(["1⅛ lb", "1⅔ cups", "2 tbsp"]);
    expect(text(el.querySelector(".ui-rcpe__step-text"))).toBe("Roast the squash at 392°F for 25 minutes.");
    // Prevented, the units stay
    el.addEventListener("tc-units-change", (e) => e.preventDefault(), { once: true });
    el.querySelectorAll<HTMLInputElement>('.ui-rcpe__units input[type="radio"]')[0].click();
    await settle();
    expect(el.units).toBe("imperial");
    expect(el.querySelectorAll<HTMLInputElement>('.ui-rcpe__units input[type="radio"]')[1].checked).toBe(true);
  });

  test("ingredients tick off, with a count", async () => {
    const el = await make();
    const box = el.querySelectorAll<HTMLInputElement>('.ui-rcpe__ingredient input[type="checkbox"]')[1];
    expect(text(el.querySelector(".ui-rcpe__col--ingredients .ui-rcpe__aside"))).toBe("0 of 5");
    box.click();
    await settle();
    expect(el.checked).toEqual(["milk"]);
    expect(el.querySelectorAll(".ui-rcpe__ingredient")[1].hasAttribute("data-done")).toBe(true);
    expect(text(el.querySelector(".ui-rcpe__col--ingredients .ui-rcpe__aside"))).toBe("1 of 5");
    // Its label is the quantity in words, the name and the note
    expect(text(el.querySelector(".ui-rcpe__ing-text")).includes("butternut squash, cubed")).toBe(true);
  });

  test("the current step: by its number, Previous and Next; cancelable", async () => {
    const el = await make();
    const seen: number[] = [];
    el.addEventListener("tc-step-change", (e) => seen.push((e as CustomEvent<{ step: number }>).detail.step));
    el.querySelectorAll<HTMLButtonElement>(".ui-rcpe__num")[2].click();
    await settle();
    expect(el.step).toBe(2);
    expect(el.querySelectorAll(".ui-rcpe__step")[2].getAttribute("aria-current")).toBe("step");
    expect(el.querySelectorAll(".ui-rcpe__num")[2].getAttribute("aria-pressed")).toBe("true");
    const [prev, next] = el.querySelectorAll<HTMLButtonElement>(".ui-rcpe__nav button");
    next.click();
    await settle();
    expect(el.step).toBe(3);
    expect(next.disabled).toBe(true);
    prev.click();
    await settle();
    expect(seen).toEqual([2, 3, 2]);
    expect(status(el)).toBe("Step 3 of 4");
    el.addEventListener("tc-step-change", (e) => e.preventDefault(), { once: true });
    prev.click();
    await settle();
    expect(el.step).toBe(2);
  });

  test("a timer starts, pauses, resumes, finishes with an announcement, and resets", async () => {
    const el = await make();
    // A tick too slow to finish while the running state is checked, then a fast one to finish: an interval is set when
    // a timer starts, so the speed changes across a pause and resume, and nothing depends on how fast the runner is
    el.tickMs = 100000;
    await settle();
    const done: { step: number; text: string }[] = [];
    el.addEventListener("tc-timer-done", (e) => done.push((e as CustomEvent<{ step: number; text: string }>).detail));
    const timer = () => el.querySelectorAll(".ui-rcpe__step")[2].querySelector(".ui-rcpe__timer")!;
    const button = () => timer().querySelector<HTMLButtonElement>(".ui-rcpe__timer-btn")!;
    expect(text(button())).toBe("Start timer (0:02)");
    button().click();
    await settle();
    expect(timer().getAttribute("data-state")).toBe("running");
    expect(timer().querySelector('[role="timer"]')).not.toBeNull();
    expect(status(el)).toBe("Timer started: 2 s");
    button().click();
    await settle();
    expect(timer().getAttribute("data-state")).toBe("paused");
    el.tickMs = 20;
    button().click();
    await expect.poll(() => timer().getAttribute("data-state"), { timeout: 5000 }).toBe("done");
    expect(done).toEqual([{ step: 2, text: "Simmer for 2 seconds." }]);
    expect(status(el)).toBe("Timer done: step 3, Simmer for 2 seconds.");
    expect(text(timer().querySelector(".ui-rcpe__clock"))).toBe("Timer done");
    // Reset puts it back to the start
    timer().querySelector<HTMLButtonElement>(".ui-rcpe__icon-btn")!.click();
    await settle();
    expect(timer().getAttribute("data-state")).toBe("idle");
    // Pausing holds the time
    el.tickMs = 100000;
    const rest = () => el.querySelectorAll(".ui-rcpe__step")[3].querySelector(".ui-rcpe__timer")!;
    rest().querySelector<HTMLButtonElement>(".ui-rcpe__timer-btn")!.click();
    await settle();
    rest().querySelector<HTMLButtonElement>(".ui-rcpe__timer-btn")!.click();
    await settle();
    expect(rest().getAttribute("data-state")).toBe("paused");
    expect(text(rest().querySelector(".ui-rcpe__timer-btn"))).toBe("Resume");
    expect(text(rest().querySelector(".ui-rcpe__clock"))).toBe("0:03");
    expect(status(el)).toBe("Timer paused at 3 s");
  });

  test("timers stop when the element leaves the page; new steps clear them", async () => {
    const el = await make();
    el.tickMs = 100000;
    el.querySelectorAll(".ui-rcpe__step")[0].querySelector<HTMLButtonElement>(".ui-rcpe__timer-btn")!.click();
    await settle();
    el.steps = ["Stir for 1 minute."];
    await settle();
    expect(el.querySelector(".ui-rcpe__timer")!.getAttribute("data-state")).toBe("idle");
    expect(el.step).toBe(0);
    el.remove();
  });

  test("labels can be renamed; no steps or ingredients still renders", async () => {
    const el = await fixture<TcRecipeCard>(html`<tc-recipe-card heading="Empty" .labels=${{ ingredients: "You need", servings: "People" }}></tc-recipe-card>`);
    expect(text(el.querySelector(".ui-rcpe__col--ingredients .ui-rcpe__title"))).toBe("You need 0 of 0");
    expect(text(el.querySelector(".ui-rcpe__label"))).toBe("People");
    expect(el.querySelector(".ui-rcpe__nav")).toBeNull();
    expect(el.querySelector(".ui-rcpe__times")).toBeNull();
  });

  test("React wrapper: uncontrolled survives re-renders; controlled stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const servings: number[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(RecipeCard, {
        title: "Mine",
        baseServings: 4,
        ingredients: INGREDIENTS,
        steps: STEPS,
        onServingsChange: (s: number) => void servings.push(s),
        "data-n": n,
      } as React.ComponentProps<typeof RecipeCard>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-recipe-card")!;
    expect(text(el.querySelector(".tc-head__title"))).toBe("Mine");
    servingButtons(el)[1].click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(text(el.querySelector(".ui-rcpe__count"))).toBe("5");
    expect(servings).toEqual([5]);
    // Controlled: units stay until the parent changes them
    await act(async () => root.render(React.createElement(RecipeCard, { units: "metric", ingredients: INGREDIENTS, steps: STEPS })));
    await settle();
    const held = host.querySelector("tc-recipe-card")!;
    held.querySelectorAll<HTMLInputElement>('.ui-rcpe__units input[type="radio"]')[1].click();
    await settle();
    expect(held.units).toBe("metric");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-recipe-card heading="Curry" description="For four" prep-minutes="15" cook-minutes="40" .ingredients=${INGREDIENTS} .steps=${STEPS} .checked=${["milk"]}></tc-recipe-card>
        <tc-recipe-card look="clean" heading="Curry" units="imperial" step="2" .ingredients=${INGREDIENTS} .steps=${STEPS}></tc-recipe-card>
      </div>`);
      wrap.querySelectorAll<HTMLElement>("tc-recipe-card")[1].querySelector<HTMLButtonElement>(".ui-rcpe__timer-btn")!.click();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
