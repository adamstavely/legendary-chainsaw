/*
 * <tc-message-actions> Refine: a row of rewrites; a pick fires tc-refine, runs onRefine and the rewrite arrives as a
 * new version.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/message-actions";
import { defaultRefinements, type MessageRefineDetail, type TcMessageActions } from "../../src/elements/message-actions";
import { MessageActions } from "../../src/elements/react/message-actions";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => cleanup());

const ACTIONS = ["copy", "regenerate", "refine", "feedback"];
const refineBtn = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-ma__btn--refine")!;
const row = (el: Element) => el.querySelector<HTMLElement>(".ui-ma__refine")!;
const chip = (el: Element, id: string) => row(el).querySelector<HTMLButtonElement>(`[data-refinement="${id}"]`)!;
const tip = (el: Element) => refineBtn(el).parentElement!.querySelector(".ui-ma__tip")!.textContent!.trim();
const key = (t: Element, k: string) => t.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

for (const look of ["standard", "clean"] as const)
  describe(`tc-message-actions (${look}) – refine`, () => {
    test("opt-in: not in the default actions; a wand named Refine that opens the rewrites with focus on the first", async () => {
      const plain = await fixture<TcMessageActions>(html`<tc-message-actions look=${look} text="Hi"></tc-message-actions>`);
      expect(plain.querySelector(".ui-ma__btn--refine")).toBeNull();
      expect(plain.querySelector(".ui-ma__refine")).toBeNull();

      const el = await fixture<TcMessageActions>(html`<tc-message-actions look=${look} text="Hi" .actions=${ACTIONS}></tc-message-actions>`);
      const b = refineBtn(el);
      expect(b.getAttribute("aria-label")).toBe("Refine");
      expect(b.getAttribute("aria-expanded")).toBe("false");
      expect(b.getAttribute("aria-controls")).toBe(row(el).id);
      expect(row(el).inert).toBe(true);
      b.click();
      await settle();
      expect(b.getAttribute("aria-expanded")).toBe("true");
      expect(row(el).inert).toBe(false);
      const group = row(el).querySelector('[role="group"]')!;
      expect(document.getElementById(group.getAttribute("aria-labelledby")!)!.textContent).toBe("Rewrite this reply");
      expect([...row(el).querySelectorAll(".ui-ma__chip")].map((c) => c.textContent!.trim())).toEqual(defaultRefinements.map((r) => r.label));
      await expect.poll(() => document.activeElement).toBe(chip(el, "shorter"));
      // Esc closes them, with focus back on Refine
      key(chip(el, "shorter"), "Escape");
      await settle();
      expect(b.getAttribute("aria-expanded")).toBe("false");
      expect(document.activeElement).toBe(b);
    });

    test("a pick fires tc-refine and calls onRefine; prevented, nothing runs", async () => {
      const calls: string[] = [];
      const el = await fixture<TcMessageActions>(
        html`<tc-message-actions look=${look} text="Hi" .actions=${ACTIONS} .onRefine=${(id: string) => void calls.push(id)}></tc-message-actions>`,
      );
      const seen: MessageRefineDetail[] = [];
      let block = true;
      el.addEventListener("tc-refine", (e) => {
        seen.push((e as CustomEvent<MessageRefineDetail>).detail);
        if (block) e.preventDefault();
      });
      refineBtn(el).click();
      await settle();
      chip(el, "formal").click();
      await settle();
      expect(seen).toEqual([{ refinement: "formal" }]);
      expect(calls).toEqual([]);
      // Prevented, the row stays open
      expect(refineBtn(el).getAttribute("aria-expanded")).toBe("true");
      block = false;
      chip(el, "shorter").click();
      await settle();
      expect(calls).toEqual(["shorter"]);
      expect(refineBtn(el).getAttribute("aria-expanded")).toBe("false");
      expect(document.activeElement).toBe(refineBtn(el));
      expect(el.querySelector(".ui-ma__sr")!.textContent).toBe("Rewriting: Shorter");
    });

    test("a promise keeps the wand busy; a rejection says so; the rewrite arrives as a new version; abort on removal", async () => {
      let fail!: (e: Error) => void;
      let done!: () => void;
      let signal!: AbortSignal;
      let calls = 0;
      const onRefine = (_id: string, o: { signal: AbortSignal }) => {
        calls++;
        signal = o.signal;
        return new Promise<void>((resolve, reject) => {
          fail = reject;
          done = resolve;
        });
      };
      const el = await fixture<TcMessageActions>(html`<tc-message-actions look=${look} text="Hi" .actions=${ACTIONS} .versions=${["Hi"]} .onRefine=${onRefine}></tc-message-actions>`);
      refineBtn(el).click();
      await settle();
      chip(el, "simpler").click();
      await settle();
      expect(refineBtn(el).getAttribute("aria-busy")).toBe("true");
      expect(tip(el)).toContain("Rewriting…");
      // A second pick while one runs is ignored
      refineBtn(el).click();
      await settle();
      chip(el, "longer").click();
      expect(calls).toBe(1);
      fail(new Error("busy"));
      await settle();
      expect(refineBtn(el).hasAttribute("aria-busy")).toBe(false);
      expect(tip(el)).toContain("Couldn't rewrite");
      expect(el.querySelector(".ui-ma__sr")!.textContent).toBe("Couldn't rewrite");

      chip(el, "longer").click();
      await settle();
      el.versions = ["Hi", "Hello there – a longer reply."];
      done();
      await settle();
      expect(refineBtn(el).hasAttribute("aria-busy")).toBe(false);
      expect(el.querySelector(".ui-ma__count")!.getAttribute("aria-label")).toBe("Version 2 of 2");

      refineBtn(el).click();
      await settle();
      chip(el, "detail").click();
      el.remove();
      expect(signal.aborted).toBe(true);
    });

    test("refining (controlled) keeps the wand busy; refinements replace the rewrites; one panel at a time", async () => {
      const el = await fixture<TcMessageActions>(
        html`<tc-message-actions look=${look} text="Hi" refining .actions=${ACTIONS} .refinements=${[{ id: "plain", label: "Plain words" }, { id: "example", label: "Add an example" }]}></tc-message-actions>`,
      );
      expect(refineBtn(el).getAttribute("aria-busy")).toBe("true");
      expect(el.hasAttribute("data-active")).toBe(true);
      refineBtn(el).click();
      await settle();
      expect([...row(el).querySelectorAll(".ui-ma__chip")].map((c) => c.textContent!.trim())).toEqual(["Plain words", "Add an example"]);
      // Thumbs down opens its row and folds the rewrites away
      el.querySelector<HTMLButtonElement>(".ui-ma__btn--down")!.click();
      await settle();
      expect(refineBtn(el).getAttribute("aria-expanded")).toBe("false");
      expect(el.querySelector<HTMLElement>(`#${el.querySelector(".ui-ma__btn--down")!.getAttribute("aria-controls")}`)!.hasAttribute("data-open")).toBe(true);
      // …and Refine folds the feedback row away
      refineBtn(el).click();
      await settle();
      expect(el.querySelector(".ui-ma__btn--down")!.getAttribute("aria-expanded")).toBe("false");
    });
  });

test("React: onRefine runs and onRefinePick can cancel", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const ran: string[] = [];
  const picked: string[] = [];
  await act(async () =>
    root.render(
      React.createElement(MessageActions, {
        text: "Hi",
        actions: ["copy", "refine"],
        onRefine: (id: string) => void ran.push(id),
        onRefinePick: (id: string) => {
          picked.push(id);
          return id !== "casual";
        },
      }),
    ),
  );
  await settle();
  const el = host.querySelector<TcMessageActions>("tc-message-actions")!;
  refineBtn(el).click();
  await settle();
  chip(el, "casual").click();
  await settle();
  chip(el, "shorter").click();
  await settle();
  expect(picked).toEqual(["casual", "shorter"]);
  expect(ran).toEqual(["shorter"]);
  await act(async () => root.unmount());
  host.remove();
});

for (const theme of ["light", "dark"] as const)
  test(`axe (${theme}): the rewrites open in both looks, and a busy wand`, async () => {
    const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base); display: grid; gap: 16px">
      <tc-message-actions text="Hi" demo label="Actions for answer 1" .actions=${ACTIONS}></tc-message-actions>
      <tc-message-actions look="clean" text="Hi" demo label="Actions for answer 2" .actions=${ACTIONS}></tc-message-actions>
      <tc-message-actions text="Hi" demo refining label="Actions for answer 3" .actions=${ACTIONS}></tc-message-actions>
    </div>`);
    const [a, b] = [...wrap.querySelectorAll<TcMessageActions>("tc-message-actions")];
    for (const el of [a, b]) {
      refineBtn(el).click();
      await settle();
    }
    await finish(wrap);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
