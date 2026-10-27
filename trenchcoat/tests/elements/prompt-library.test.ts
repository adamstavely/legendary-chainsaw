/*
 * <tc-prompt-library> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/prompt-library";
import type { PromptTemplate, TcPromptLibrary } from "../../src/elements/prompt-library";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const on = (el: Element, name: string, fn: (e: CustomEvent<Record<string, any>>) => void) => el.addEventListener(name, fn as EventListener);
const byName = (el: Element, name: RegExp) => [...el.querySelectorAll("button")].find((b) => name.test(b.getAttribute("aria-label") ?? b.textContent!))!;
const field = (el: Element, name: string) => el.querySelector<HTMLInputElement>(`.ui-pli__panel:not([data-out]) [data-var="${name}"]`)!;
const type = async (input: HTMLInputElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new InputEvent("input", { bubbles: true }));
  await settle();
};
const text = (el: Element) => el.textContent!.replace(/\s+/g, " ");

const templates: PromptTemplate[] = [{ id: "t1", title: "Summary", body: "Summarize the meeting in three bullets." }];
const vars: PromptTemplate[] = [
  { id: "a", title: "Email", body: "Write to {name} about {topic}.", variables: { topic: { default: "pricing" } } },
  { id: "b", title: "Recap", body: "Recap for {team}." },
];

describe("tc-prompt-library", () => {
  test("the host is the root and a group named by the heading", async () => {
    const el = await fixture<TcPromptLibrary>(html`<tc-prompt-library .templates=${vars}></tc-prompt-library>`);
    expect(el.dataset.ui).toBe("pli");
    expect(el.dataset.look).toBe("standard");
    expect(el.getAttribute("role")).toBe("group");
    expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Prompts");
    el.heading = "Saved";
    el.look = "clean";
    await settle();
    expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Saved");
    expect(el.dataset.look).toBe("clean");
    expect(el.querySelector(".ui-pli__card > .ui-pli__foot")).toBeTruthy();
    // The header: the card's first row in Clean, on the tray above the card in Standard; the template count at its right
    expect(el.querySelector(".ui-pli__card > .tc-head:first-child .tc-head__aside > .ui-pli__total")!.textContent).toBe(String(vars.length));
    el.look = "standard";
    await settle();
    expect(el.querySelector(":scope > .tc-head + .ui-pli__card")).toBeTruthy();
  });

  test("a name the page gives stays", async () => {
    const el = await fixture<TcPromptLibrary>(html`<tc-prompt-library aria-label="Templates" .templates=${vars}></tc-prompt-library>`);
    expect(el.hasAttribute("aria-labelledby")).toBe(false);
  });

  for (const look of ["standard", "clean"] as const) {
    describe(look, () => {
      const make = (list: PromptTemplate[], extra: Partial<TcPromptLibrary> = {}) =>
        fixture<TcPromptLibrary>(html`<tc-prompt-library look=${look} .templates=${list} .values=${extra.values ?? {}} .value=${extra.value ?? ""} .onUse=${extra.onUse} use-label=${extra.useLabel ?? "Use prompt"}></tc-prompt-library>`);

      test("a failed clipboard write never says Copied and doesn't fire tc-copy", async () => {
        vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error("denied"));
        const el = await make(templates);
        const copied = vi.fn();
        on(el, "tc-copy", copied);
        byName(el, /Copy prompt/).click();
        await settle();
        await settle();
        expect(text(el)).not.toMatch(/Copied to clipboard/);
        expect(text(el)).toMatch(/Couldn't copy/);
        expect(copied).not.toHaveBeenCalled();
      });

      test("a successful copy says so and fires tc-copy", async () => {
        vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
        const el = await make(templates);
        const copied: unknown[] = [];
        on(el, "tc-copy", (e) => copied.push(e.detail.prompt));
        byName(el, /Copy prompt/).click();
        await settle();
        await settle();
        expect(text(el)).toMatch(/Copied to clipboard/);
        expect(copied).toEqual(["Summarize the meeting in three bullets."]);
      });

      test("Use sends the finished prompt", async () => {
        const onUse = vi.fn();
        const el = await make(templates, { onUse, useLabel: "Use it" });
        byName(el, /Use it/).click();
        expect(onUse).toHaveBeenCalledWith("Summarize the meeting in three bullets.", templates[0], expect.any(Object));
      });

      test("variable values are controllable: typing is reported with every template's values", async () => {
        const el = await make(vars, { values: { a: { name: "Ana" } } });
        const seen: unknown[] = [];
        on(el, "tc-values-change", (e) => {
          e.preventDefault();
          seen.push(e.detail.values);
        });
        expect(field(el, "name").value).toBe("Ana");
        expect(field(el, "topic").value).toBe("pricing"); // missing → template default
        await type(field(el, "name"), "Bo");
        expect(seen.at(-1)).toEqual({ a: { name: "Bo", topic: "pricing" } });
        expect(field(el, "name").value).toBe("Ana");
        el.values = { a: { name: "Cy", topic: "renewal" } };
        await settle();
        expect(field(el, "name").value).toBe("Cy");
        expect(field(el, "topic").value).toBe("renewal");
      });

      test("uncontrolled values are kept per template", async () => {
        const el = await make(vars, { values: { b: { team: "Ops" } } });
        const seen: unknown[] = [];
        on(el, "tc-values-change", (e) => seen.push(e.detail.values));
        await type(field(el, "name"), "Di");
        expect(field(el, "name").value).toBe("Di");
        el.querySelectorAll<HTMLElement>('[role="option"]')[1].click();
        await settle();
        expect(field(el, "team").value).toBe("Ops");
        expect(seen.at(-1)).toEqual({ b: { team: "Ops" }, a: { name: "Di", topic: "pricing" } });
      });

      test("the chosen template changes unless prevented, and follows its property", async () => {
        const el = await make(vars);
        const seen: unknown[] = [];
        on(el, "tc-value-change", (e) => seen.push(e.detail.value));
        const selected = () => el.querySelector('[role="option"][aria-selected="true"]')!.textContent;
        expect(selected()).toBe("Email");
        el.querySelectorAll<HTMLElement>('[role="option"]')[1].click();
        await settle();
        expect(seen).toEqual(["b"]);
        expect(selected()).toBe("Recap");
        on(el, "tc-value-change", (e) => e.preventDefault());
        el.querySelectorAll<HTMLElement>('[role="option"]')[0].click();
        await settle();
        expect(seen).toEqual(["b", "a"]);
        expect(selected()).toBe("Recap");
        el.value = "a";
        await settle();
        expect(selected()).toBe("Email");
      });

      test("keyboard: arrows move the choice and the focus; Escape clears the search", async () => {
        const el = await make(vars);
        const search = el.querySelector<HTMLInputElement>('input[type="search"]')!;
        search.focus();
        search.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
        await settle();
        const options = () => [...el.querySelectorAll<HTMLElement>('[role="option"]')];
        expect(document.activeElement).toBe(options()[0]);
        options()[0].dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }));
        await settle();
        expect(options()[1].getAttribute("aria-selected")).toBe("true");
        expect(document.activeElement).toBe(options()[1]);
        expect(options().map((o) => o.tabIndex)).toEqual([-1, 0]);
        await type(search, "recap");
        expect(options()).toHaveLength(1);
        search.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
        await settle();
        expect(search.value).toBe("");
        expect(options()).toHaveLength(2);
      });

      test("an async onUse keeps Use pending and says so when it fails", async () => {
        let fail!: (e: Error) => void;
        const onUse = vi.fn(() => new Promise((_, reject) => (fail = reject)));
        const el = await make(templates, { onUse });
        const use = () => byName(el, /Use prompt/);
        use().click();
        await settle();
        expect(use().getAttribute("aria-busy")).toBe("true");
        use().click();
        expect(onUse).toHaveBeenCalledTimes(1);
        fail(new Error("offline"));
        await settle();
        expect(use().hasAttribute("aria-busy")).toBe(false);
        expect(text(el)).toMatch(/Couldn't use the prompt/);
      });

      test("Enter while composing (IME) doesn't move on or use the prompt", async () => {
        const onUse = vi.fn();
        const el = await make([vars[1]], { onUse });
        await type(field(el, "team"), "営業");
        field(el, "team").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", isComposing: true, bubbles: true, cancelable: true }));
        expect(onUse).not.toHaveBeenCalled();
        field(el, "team").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
        expect(onUse).toHaveBeenCalledWith("Recap for 営業.", vars[1], { team: "営業" });
      });

      test("Enter moves on to the next empty field", async () => {
        const el = await make([{ id: "v", title: "Mail", body: "Write to {name} about {topic}." }]);
        field(el, "name").focus();
        field(el, "name").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
        expect(document.activeElement).toBe(field(el, "topic"));
      });

      test("the preview fills in as you type, and the counter follows", async () => {
        const el = await make([{ id: "v", title: "Mail", body: "Write to {name} about {topic}." }]);
        expect(text(el.querySelector(".ui-pli__preview")!)).toBe("Write to {name} about {topic}.");
        expect(text(el.querySelector(".ui-pli__count")!)).toBe("0 of 2 filled");
        await type(field(el, "name"), "Ana");
        expect(text(el.querySelector(".ui-pli__preview")!)).toBe("Write to Ana about {topic}.");
        expect(text(el.querySelector(".ui-pli__count")!)).toBe("1 of 2 filled");
        expect(el.querySelector(".ui-pli__fill")!.getAttribute("data-flash")).toMatch(/a|b/);
      });

      /* WCAG fix pass: the reason Use was off lived only in a hover caption; pressing it did nothing audible */
      const mail = [{ id: "v", title: "Mail", body: "Write to {name} about {topic}." }];

      test("Use, while off, is described by the reason and says it when pressed", async () => {
        const onUse = vi.fn();
        const el = await make(mail, { onUse });
        const use = byName(el, /Use prompt/);
        expect(use.getAttribute("aria-disabled")).toBe("true");
        expect(document.getElementById(use.getAttribute("aria-describedby")!)?.textContent).toBe("Fill 2 more variables to use");
        use.click();
        await settle();
        expect(onUse).not.toHaveBeenCalled();
        expect(el.querySelector('[role="status"]')!.textContent).toBe("Fill 2 more variables to use the prompt");
      });

      test("once every variable is filled, Use has no reason attached and works", async () => {
        const onUse = vi.fn();
        const el = await make(mail, { values: { v: { name: "Ana", topic: "Q3" } }, onUse });
        const use = byName(el, /Use prompt/);
        expect(use.getAttribute("aria-disabled")).toBe("false");
        expect(use.hasAttribute("aria-describedby")).toBe(false);
        use.click();
        expect(onUse).toHaveBeenCalledWith("Write to Ana about Q3.", mail[0], { name: "Ana", topic: "Q3" });
      });

      test("Use pulses once and says so when the last variable gets filled", async () => {
        const el = await make(mail, { values: { v: { name: "Ana" } } });
        expect(byName(el, /Use prompt/).hasAttribute("data-pulse")).toBe(false);
        await type(field(el, "topic"), "Q3");
        expect(byName(el, /Use prompt/).getAttribute("data-pulse")).toBe("a");
        expect(el.querySelector('[role="status"]')!.textContent).toBe("All variables filled");
      });

      test("the status region is there from the start", async () => {
        const el = await make(mail);
        expect(el.querySelector('[role="status"]')!.textContent).toBe("");
      });
    });
  }

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-prompt-library .templates=${vars}></tc-prompt-library>
      <tc-prompt-library look="clean" heading="Clean" .templates=${vars}></tc-prompt-library>
    </div>`);
    for (const a of document.getAnimations()) {
      try {
        a.finish();
      } catch {
        a.cancel();
      }
    }
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
