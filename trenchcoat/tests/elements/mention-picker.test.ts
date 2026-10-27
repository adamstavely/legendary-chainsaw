/*
 * <tc-mention-picker> in real browsers: attaching to a textarea / input / contenteditable, the trigger rules, the
 * combobox wiring on the field, the keyboard, insertion (token or chip), cancelable picks, async search, the wrapper,
 * and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/mention-picker";
import type { MentionPickerGroup, MentionPickerPick, MentionPickerTrigger, TcMentionPicker } from "../../src/elements/mention-picker";
import { MentionPicker } from "../../src/elements/react/mention-picker";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const people: MentionPickerGroup = {
  id: "people",
  label: "People",
  items: [
    { id: "maya", label: "Maya Chen", hint: "Design", avatar: true },
    { id: "priya", label: "Priya Shah", hint: "Billing eng", avatar: true },
    { id: "daniel", label: "Daniel Okafor", hint: "Product", avatar: true },
  ],
};
const files: MentionPickerGroup = {
  id: "files",
  label: "Files",
  items: [
    { id: "spec", label: "billing-spec.md", hint: "docs" },
    { id: "schema", label: "schema.prisma", hint: "packages/db" },
  ],
};
const commands: MentionPickerGroup = { id: "commands", label: "Commands", items: [{ id: "summarize", label: "summarize", hint: "Sum up the thread", token: "/summarize" }] };
const triggers: MentionPickerTrigger[] = [
  { char: "@", label: "People and files", groups: [files, people] },
  { char: "/", atLineStart: true, label: "Commands", groups: [commands] },
];

/** Types into a textarea or input the way a user would: value, caret at the end, an input event */
const type = async (field: HTMLTextAreaElement | HTMLInputElement, text: string) => {
  field.focus();
  field.value += text;
  field.setSelectionRange(field.value.length, field.value.length);
  field.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
  await settle();
};
const key = (target: Element, init: KeyboardEventInit) => {
  const e = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(e);
  return e;
};

async function setup(look: "standard" | "clean" = "standard", field = html`<textarea id="msg" aria-label="Message"></textarea>`) {
  const wrap = await fixture<HTMLElement>(html`<div>${field}<tc-mention-picker look=${look} for="msg" .triggers=${triggers}></tc-mention-picker></div>`);
  const picker = wrap.querySelector<TcMentionPicker>("tc-mention-picker")!;
  const input = wrap.querySelector<HTMLTextAreaElement>("#msg")!;
  await settle();
  return { wrap, picker, input };
}
const options = (p: Element) => [...p.querySelectorAll<HTMLElement>('[role="option"]')];
const activeText = (input: Element) => document.getElementById(input.getAttribute("aria-activedescendant") ?? "")?.querySelector(".ui-mnp__name")?.textContent;

describe("tc-mention-picker", () => {
  for (const look of ["standard", "clean"] as const) {
    describe(look, () => {
      test("the host holds the list; the textarea keeps its role and points at the listbox", async () => {
        const { picker, input } = await setup(look);
        expect(picker.dataset.ui).toBe("mnp");
        expect(picker.dataset.look).toBe(look);
        expect(picker.attached).toBe(input);
        expect(input.hasAttribute("role")).toBe(false);
        expect(input.getAttribute("aria-autocomplete")).toBe("list");
        expect(document.getElementById(input.getAttribute("aria-controls")!)!.getAttribute("role")).toBe("listbox");
        expect(input.hasAttribute("aria-activedescendant")).toBe(false);
        expect(picker.open).toBe(false);
        // Standard sets the list on a card in a tray; Clean is one popover
        expect(!!picker.querySelector(".ui-mnp__card")).toBe(look === "standard");
      });

      test("@ opens grouped results; typing filters and marks the match; the active row is the field's active descendant", async () => {
        const { picker, input } = await setup(look);
        const opened = vi.fn();
        const queries: string[] = [];
        picker.addEventListener("tc-open-change", (e) => opened((e as CustomEvent).detail));
        picker.addEventListener("tc-query-change", (e) => queries.push((e as CustomEvent).detail.query));
        await type(input, "Ask @");
        expect(picker.open).toBe(true);
        expect(opened).toHaveBeenCalledWith({ open: true, trigger: "@", query: "" });
        expect([...picker.querySelectorAll(".ui-mnp__label")].map((l) => l.textContent)).toEqual(["Files", "People"]);
        expect(options(picker)).toHaveLength(5);
        expect(activeText(input)).toBe("billing-spec.md");
        expect(picker.querySelector('[role="listbox"]')!.getAttribute("aria-label")).toBe("People and files");
        await type(input, "pr");
        expect(queries).toEqual(["", "pr"]);
        // The group with the best match first: a label start (Priya), then a hint (Product); a word start (schema.prisma)
        expect(options(picker).map((o) => o.querySelector(".ui-mnp__name")!.textContent)).toEqual(["Priya Shah", "Daniel Okafor", "schema.prisma"]);
        expect(options(picker)[0].querySelector("mark")!.textContent).toBe("Pr");
        expect(picker.querySelector('[role="status"]')!.textContent!.trim()).toBe("3 suggestions");
        // Each option is in a group named by its caption
        const group = options(picker)[0].closest('[role="group"]')!;
        expect(document.getElementById(group.getAttribute("aria-labelledby")!)!.textContent).toBe("People");
      });

      test("↑ ↓ move and wrap; ↵ inserts the token, closes, and the field's own Enter handler never sees it", async () => {
        const { picker, input } = await setup(look);
        const send = vi.fn();
        input.addEventListener("keydown", (e) => e.key === "Enter" && send());
        await type(input, "Hi @");
        key(input, { key: "ArrowDown" });
        await settle();
        expect(activeText(input)).toBe("schema.prisma");
        key(input, { key: "ArrowUp" });
        key(input, { key: "ArrowUp" });
        await settle();
        expect(activeText(input)).toBe("Daniel Okafor");
        const changes = vi.fn();
        input.addEventListener("input", changes);
        const e = key(input, { key: "Enter" });
        await settle();
        expect(e.defaultPrevented).toBe(true);
        expect(send).not.toHaveBeenCalled();
        expect(input.value).toBe("Hi @Daniel Okafor ");
        expect(input.selectionStart).toBe(input.value.length);
        expect(changes).toHaveBeenCalledTimes(1);
        expect(picker.open).toBe(false);
        expect(input.hasAttribute("aria-activedescendant")).toBe(false);
        expect(picker.querySelector('[role="status"]')!.textContent!.trim()).toBe("Inserted @Daniel Okafor");
        // Closed, Enter is the field's again
        key(input, { key: "Enter" });
        expect(send).toHaveBeenCalledTimes(1);
      });

      test("Tab inserts too; a token in the middle of text keeps the following space", async () => {
        const { input } = await setup(look);
        input.value = "Ping  about this";
        input.focus();
        input.setSelectionRange(5, 5);
        input.value = "Ping @ma about this";
        input.setSelectionRange(8, 8);
        input.dispatchEvent(new InputEvent("input", { bubbles: true }));
        await settle();
        expect(key(input, { key: "Tab" }).defaultPrevented).toBe(true);
        expect(input.value).toBe("Ping @Maya Chen about this");
        expect(input.selectionStart).toBe("Ping @Maya Chen ".length);
      });

      test("Esc closes and stays closed for that trigger; a new trigger opens again", async () => {
        const { picker, input } = await setup(look);
        const outer = vi.fn();
        input.parentElement!.addEventListener("keydown", (e) => e.key === "Escape" && outer());
        await type(input, "@m");
        expect(key(input, { key: "Escape" }).defaultPrevented).toBe(true);
        await settle();
        expect(outer).not.toHaveBeenCalled();
        expect(picker.open).toBe(false);
        await type(input, "a");
        expect(picker.open).toBe(false);
        await type(input, " @");
        expect(picker.open).toBe(true);
      });

      test("triggers: not inside a word, / only at the start of a line, closes on a space or when the caret leaves", async () => {
        const { picker, input } = await setup(look);
        await type(input, "ana@");
        expect(picker.open).toBe(false);
        await type(input, " and/");
        expect(picker.open).toBe(false);
        await type(input, "\n  /");
        expect(picker.open).toBe(true);
        expect(options(picker).map((o) => o.textContent!.trim())).toEqual([expect.stringContaining("summarize")]);
        key(input, { key: "Enter" });
        await settle();
        expect(input.value.endsWith("\n  /summarize ")).toBe(true);
        await type(input, "@pri");
        expect(picker.open).toBe(true);
        await type(input, " ");
        expect(picker.open).toBe(false);
        await type(input, "@");
        input.setSelectionRange(0, 0);
        input.dispatchEvent(new KeyboardEvent("keyup", { key: "Home", bubbles: true }));
        await settle();
        expect(picker.open).toBe(false);
      });

      test("nothing matches: says so; ↵ then closes and goes through", async () => {
        const { picker, input } = await setup(look);
        await type(input, "@zzz");
        expect(options(picker)).toHaveLength(0);
        expect(picker.querySelector(".ui-mnp__empty")!.textContent).toContain("No matches for “zzz”");
        expect(picker.querySelector('[role="status"]')!.textContent!.trim()).toBe("No matches");
        expect(key(input, { key: "Enter" }).defaultPrevented).toBe(false);
        await settle();
        expect(picker.open).toBe(false);
      });

      test("a click picks without taking focus from the field; a press outside closes", async () => {
        const { picker, input } = await setup(look);
        await type(input, "@");
        const row = options(picker)[3];
        const down = new PointerEvent("pointerdown", { bubbles: true, cancelable: true });
        row.dispatchEvent(down);
        expect(down.defaultPrevented).toBe(true);
        row.click();
        await settle();
        expect(input.value).toBe("@Priya Shah ");
        expect(document.activeElement).toBe(input);
        await type(input, "@");
        expect(picker.open).toBe(true);
        document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
        await settle();
        expect(picker.open).toBe(false);
      });

      test("cancelable: preventDefault leaves the field alone (the app inserts it)", async () => {
        const { picker, input } = await setup(look);
        let detail: MentionPickerPick | null = null;
        picker.addEventListener("tc-pick", (e) => {
          detail = (e as CustomEvent<MentionPickerPick>).detail;
          e.preventDefault();
        });
        await type(input, "@sch");
        key(input, { key: "Enter" });
        await settle();
        expect(detail).toMatchObject({ trigger: "@", query: "sch", token: "@schema.prisma", item: { id: "schema" } });
        expect(input.value).toBe("@sch");
        expect(picker.open).toBe(false);
      });

      test("a contenteditable field becomes the combobox and gets a chip the caret steps over", async () => {
        const { picker } = await setup(look, html`<div id="msg" contenteditable="true" aria-label="Message"></div>`);
        const field = document.getElementById("msg")!;
        expect(field.getAttribute("role")).toBe("combobox");
        expect(field.getAttribute("aria-expanded")).toBe("false");
        field.focus();
        const text = document.createTextNode("Loop in @pri");
        field.append(text);
        const sel = getSelection()!;
        sel.removeAllRanges();
        const r = document.createRange();
        r.setStart(text, text.length);
        sel.addRange(r);
        field.dispatchEvent(new InputEvent("input", { bubbles: true }));
        await settle();
        expect(field.getAttribute("aria-expanded")).toBe("true");
        expect(activeText(field)).toBe("Priya Shah");
        key(field, { key: "Enter" });
        await settle();
        const chip = field.querySelector<HTMLElement>(".ui-mnp__chip")!;
        expect(chip.textContent).toBe("@Priya Shah");
        expect(chip.contentEditable).toBe("false");
        expect(chip.dataset.id).toBe("priya");
        expect(field.textContent).toBe("Loop in @Priya Shah ");
        expect(sel.isCollapsed).toBe(true);
        expect(sel.getRangeAt(0).comparePoint(chip, 0)).toBe(-1);
        expect(field.getAttribute("aria-expanded")).toBe("false");
        // Detaching gives the field its own attributes back
        picker.remove();
        expect(field.hasAttribute("role")).toBe(false);
        expect(field.hasAttribute("aria-controls")).toBe(false);
      });

      test("renderChip builds the chip; an <input> becomes a combobox", async () => {
        const { picker } = await setup(look, html`<div><input id="msg" aria-label="To" /></div>`);
        const input = document.getElementById("msg") as HTMLInputElement;
        expect(input.getAttribute("role")).toBe("combobox");
        await type(input, "@ma");
        expect(input.getAttribute("aria-expanded")).toBe("true");
        key(input, { key: "Enter" });
        expect(input.value).toBe("@Maya Chen ");
        picker.renderChip = (item) => Object.assign(document.createElement("b"), { textContent: item.label });
        expect(typeof picker.renderChip).toBe("function");
      });

      test("search: async results with a loading state; a newer query wins; a failure says so", async () => {
        const { picker, input } = await setup(look);
        const resolvers: Record<string, (g: MentionPickerGroup[]) => void> = {};
        const signals: AbortSignal[] = [];
        picker.search = vi.fn((q: string, _t: string, { signal }: { signal: AbortSignal }) => {
          signals.push(signal);
          if (q === "x") return Promise.reject(new Error("offline"));
          return new Promise<MentionPickerGroup[]>((res) => (resolvers[q] = res));
        });
        await type(input, "@m");
        expect(picker.querySelector('[data-state="loading"]')).toBeTruthy();
        expect(picker.querySelector('[role="listbox"]')!.getAttribute("aria-busy")).toBe("true");
        // Enter while loading does nothing (and doesn't send)
        expect(key(input, { key: "Enter" }).defaultPrevented).toBe(true);
        await type(input, "a");
        expect(signals[0].aborted).toBe(true);
        resolvers["m"]([people]);
        resolvers["ma"]([{ id: "r", label: "Remote", items: [{ id: "mo", label: "Mo Ade" }] }]);
        await settle();
        expect(options(picker).map((o) => o.textContent!.trim())).toEqual(["Mo Ade"]);
        await type(input, " @x");
        await settle();
        expect(picker.querySelector('[data-state="failed"]')!.textContent).toContain("Couldn't load suggestions");
        picker.remove();
        expect(signals[signals.length - 1].aborted).toBe(true);
      });

      test("disabled never opens; the list stays inside the viewport, under the trigger", async () => {
        const { picker, input } = await setup(look);
        picker.disabled = true;
        await type(input, "@");
        expect(picker.open).toBe(false);
        picker.disabled = false;
        await type(input, " @");
        const pop = picker.querySelector<HTMLElement>(".ui-mnp__pop")!;
        const box = pop.getBoundingClientRect();
        expect(box.width).toBeGreaterThan(200);
        expect(box.left).toBeGreaterThanOrEqual(0);
        expect(box.top).toBeGreaterThanOrEqual(input.getBoundingClientRect().top);
        // The active row's highlight sits on it
        const pill = picker.querySelector<HTMLElement>(".ui-mnp__pill")!;
        expect(pill.hidden).toBe(false);
        expect(pill.getBoundingClientRect().height).toBeGreaterThan(20);
      });
    });
  }

  test("a `for` field rendered after the picker is found; removing the picker detaches its listeners", async () => {
    const wrap = await fixture<HTMLElement>(html`<div><tc-mention-picker for="late" .triggers=${triggers}></tc-mention-picker></div>`);
    const input = Object.assign(document.createElement("textarea"), { id: "late" });
    input.setAttribute("aria-label", "Message");
    wrap.append(input);
    input.focus();
    await type(input, "@");
    const picker = wrap.querySelector<TcMentionPicker>("tc-mention-picker")!;
    expect(picker.open).toBe(true);
    picker.remove();
    expect(input.hasAttribute("aria-controls")).toBe(false);
    const e = key(input, { key: "ArrowDown" });
    expect(e.defaultPrevented).toBe(false);
  });

  test("React wrapper: a ref target, icons as nodes, onPick / onOpenChange; preventDefault through the event", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onPick = vi.fn((_p: MentionPickerPick, e: Event) => e.preventDefault());
    const onOpenChange = vi.fn();
    function App() {
      const ref = React.useRef<HTMLTextAreaElement>(null);
      const [n, setN] = React.useState(0);
      return React.createElement(
        "div",
        null,
        React.createElement("textarea", { ref, "aria-label": "Message" }),
        React.createElement("button", { onClick: () => setN(n + 1) }, `re-render ${n}`),
        React.createElement(MentionPicker, {
          target: ref,
          triggers: [{ char: "@", groups: [{ id: "f", label: "Files", items: [{ id: "a", label: "a.ts", icon: React.createElement("svg", { "data-mine": "" }) }] }] }],
          onPick,
          onOpenChange,
        }),
      );
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const input = host.querySelector("textarea")!;
    const picker = host.querySelector<TcMentionPicker>("tc-mention-picker")!;
    expect(picker.attached).toBe(input);
    await type(input, "@");
    expect(onOpenChange).toHaveBeenCalledWith(true, "@");
    expect(picker.querySelector(".ui-mnp__icon svg[data-mine]")).toBeTruthy();
    // A parent re-render keeps it attached and open
    await act(async () => host.querySelector("button")!.click());
    await settle();
    expect(picker.attached).toBe(input);
    key(input, { key: "Enter" });
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ token: "@a.ts" }), expect.any(Event));
    expect(input.value).toBe("@");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const)
    for (const look of ["standard", "clean"] as const)
      test(`axe: no violations while open (${look}, ${theme})`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-tc-theme=${theme} style="min-height:420px">
          <textarea id="a1" aria-label="Message"></textarea><tc-mention-picker look=${look} for="a1" .triggers=${triggers}></tc-mention-picker>
        </div>`);
        await settle();
        await type(wrap.querySelector<HTMLTextAreaElement>("#a1")!, "@");
        wrap.getAnimations({ subtree: true }).forEach((a) => a.finish());
        const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
});

describe("tc-mention-picker: ranking, recents and richer rows (Part 7.2)", () => {
  const skills: MentionPickerGroup[] = [
    {
      id: "built",
      label: "Built-in",
      items: [
        { id: "translate", label: "translate", description: "Translate into another language", keywords: "localise" },
        { id: "report", label: "create-report", description: "Build a report from the data" },
      ],
    },
    { id: "team", label: "Your team", items: [{ id: "review", label: "review-pr", description: "Review a pull request" }] },
  ];
  async function make(trigger: Partial<MentionPickerTrigger>, look: "standard" | "clean" = "standard") {
    const wrap = await fixture<HTMLElement>(html`<div><textarea id="m7" aria-label="Message"></textarea><tc-mention-picker look=${look} for="m7"></tc-mention-picker></div>`);
    const picker = wrap.querySelector<TcMentionPicker>("tc-mention-picker")!;
    picker.triggers = [{ char: "/", atLineStart: true, label: "Skills", groups: skills, ...trigger }];
    await settle();
    return { picker, input: wrap.querySelector<HTMLTextAreaElement>("#m7")! };
  }
  const names = (p: Element) => options(p).map((o) => o.querySelector(".ui-mnp__name")!.textContent);
  const status = (p: Element) => p.querySelector('[role="status"]')!.textContent!.trim();

  for (const look of ["standard", "clean"] as const)
    test(`${look}: the mark sits on the word that matched; a description is a second line and is matched too`, async () => {
      const { picker, input } = await make({}, look);
      await type(input, "/re");
      // "review-pr" starts with it; "create-report" has it at a word's start ("report"), not inside "create"
      expect(names(picker)).toEqual(["review-pr", "create-report"]);
      const report = options(picker).find((o) => o.textContent!.includes("create-report"))!;
      expect(report.querySelector(".ui-mnp__name")!.innerHTML.replace(/<!--[^>]*-->/g, "")).toBe("create-<mark>re</mark>port");
      expect(report.hasAttribute("data-two")).toBe(true);
      expect(report.querySelector(".ui-mnp__desc")!.textContent).toBe("Build a report from the data");
      await type(input, "\n/lang");
      // Only the description has it
      expect(names(picker)).toEqual(["translate"]);
      expect(options(picker)[0].querySelector(".ui-mnp__desc mark")!.textContent).toBe("lang");
    });

  test("rank order: whole label, start, word start, keywords, inside the label, then the description", async () => {
    const { picker, input } = await make({
      groups: [
        {
          id: "g",
          label: "All",
          items: [
            { id: "desc", label: "zeta", description: "about the loc file" },
            { id: "inside", label: "unlock" },
            { id: "kw", label: "omega", keywords: "local" },
            { id: "word", label: "big-loc" },
            { id: "start", label: "locale" },
            { id: "whole", label: "loc" },
          ],
        },
      ],
    });
    await type(input, "/loc");
    expect(names(picker)).toEqual(["loc", "locale", "big-loc", "omega", "unlock", "zeta"]);
  });

  test("recent items lead under their own heading until something is typed, and aren't listed twice", async () => {
    const { picker, input } = await make({ recent: ["review", "gone", "translate"], recentLabel: "Used lately" });
    await type(input, "/");
    expect([...picker.querySelectorAll(".ui-mnp__label")].map((l) => l.textContent)).toEqual(["Used lately", "Built-in"]);
    expect(names(picker)).toEqual(["review-pr", "translate", "create-report"]);
    await type(input, "tr");
    expect([...picker.querySelectorAll(".ui-mnp__label")].map((l) => l.textContent)).toEqual(["Built-in"]);
  });

  test("rankAcrossGroups: one ranked list, each row tagged with its group; showChar puts the character first; noun and note", async () => {
    const { picker, input } = await make({ rankAcrossGroups: true, showChar: true, noun: ["skill", "skills"], note: "Picking one replaces /draft" });
    await type(input, "/re");
    expect(names(picker)).toEqual(["/review-pr", "/create-report"]);
    expect(picker.querySelectorAll('[role="group"]')).toHaveLength(0);
    expect([...picker.querySelectorAll(".ui-mnp__tag")].map((t) => t.textContent)).toEqual(["Your team", "Built-in"]);
    expect(picker.querySelector(".ui-mnp__char")!.textContent).toBe("/");
    expect(picker.querySelector(".ui-mnp__note")!.textContent).toBe("Picking one replaces /draft");
    expect(status(picker)).toBe("2 skills. Picking one replaces /draft");
    key(input, { key: "Enter" });
    expect(input.value).toBe("/review-pr ");
  });

  test("emptyText and emptyHint word the empty state; maxResults cuts the list and says how many match", async () => {
    const { picker, input } = await make({ emptyText: "No skills match", emptyHint: "Try another word" });
    picker.maxResults = 2;
    await type(input, "/");
    expect(options(picker)).toHaveLength(2);
    expect(picker.querySelector(".ui-mnp__more")!.textContent).toBe("2 of 3 shown – type to narrow them down");
    await type(input, "zz");
    expect(picker.querySelector(".ui-mnp__empty")!.textContent).toContain("No skills match for “zz”");
    expect(picker.querySelector(".ui-mnp__empty-hint")!.textContent).toBe("Try another word");
    expect(status(picker)).toBe("No skills match");
  });

  test("a trigger's own search wins over the picker's; a failure tries again on ↵; sync() opens on a trigger set by script", async () => {
    let fail = true;
    const own = vi.fn((q: string) => (fail ? Promise.reject(new Error("offline")) : Promise.resolve([{ id: "r", label: "Remote", items: [{ id: "x", label: `x-${q}` }] }])));
    const { picker, input } = await make({ search: own });
    picker.search = vi.fn(() => []);
    await type(input, "/a");
    await settle();
    expect(picker.search).not.toHaveBeenCalled();
    expect(picker.querySelector('[data-state="failed"]')!.textContent).toContain("Press ↵ to try again");
    fail = false;
    expect(key(input, { key: "Enter" }).defaultPrevented).toBe(true);
    await settle();
    await settle();
    expect(names(picker)).toEqual(["x-a"]);
    key(input, { key: "Escape" });
    await settle();
    expect(picker.open).toBe(false);
    // A script puts the caret back after the "/": sync() reads it, even after Esc
    input.setSelectionRange(2, 2);
    picker.sync();
    await settle();
    expect(picker.open).toBe(true);
  });
});
