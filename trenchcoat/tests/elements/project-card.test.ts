/*
 * <tc-project-card> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/project-card";
import type { ProjectTask, TcProjectCard } from "../../src/elements/project-card";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const tasks: ProjectTask[] = [
  { id: "a", label: "Write brief", done: false, assignee: "Ada" },
  { id: "b", label: "Review", done: true },
];
const members = [{ name: "Maya Chen" }, { name: "Jonas Weber" }];
const checkbox = (el: Element, name: RegExp) => [...el.querySelectorAll<HTMLElement>('[role="checkbox"]')].find((c) => name.test(c.textContent!))!;
const radio = (el: Element, name: string) => [...el.querySelectorAll<HTMLElement>('[role="radio"]')].find((c) => c.textContent!.trim() === name)!;
const statusBtn = (el: Element) => el.querySelector<HTMLElement>(".ui-pc__status")!;
const toggleBtn = (el: Element) => el.querySelector<HTMLElement>(".ui-pc__toggle")!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

for (const look of ["standard", "clean"] as const) {
  describe(`tc-project-card (${look})`, () => {
    test("the host is the root; page attributes stay on it; the head names the project", async () => {
      const el = await fixture<TcProjectCard>(html`<tc-project-card look=${look} class="mine" data-x="1" heading="Onboarding" due="Nov 14" .tasks=${tasks}></tc-project-card>`);
      expect(el.dataset.ui).toBe("pc");
      expect(el.dataset.look).toBe(look);
      expect(el.classList.contains("mine")).toBe(true);
      expect(el.dataset.x).toBe("1");
      expect(toggleBtn(el).getAttribute("aria-label")).toBe("Onboarding: 1 of 2 done, To do, due Nov 14");
      expect(toggleBtn(el).getAttribute("aria-controls")).toBe(el.querySelector(".ui-pc__fold:not(.ui-pc__fold--status):not(.ui-pc__fold--tray)")!.id);
    });

    test("open, status and tasks follow their properties", async () => {
      const el = await fixture<TcProjectCard>(html`<tc-project-card look=${look} heading="Onboarding" .tasks=${tasks}></tc-project-card>`);
      expect(toggleBtn(el).getAttribute("aria-expanded")).toBe("false");
      el.open = true;
      el.status = "review";
      el.tasks = [{ ...tasks[0], done: true }, tasks[1]];
      await settle();
      expect(el.hasAttribute("data-open")).toBe(true);
      expect(toggleBtn(el).getAttribute("aria-expanded")).toBe("true");
      expect(el.querySelector('[role="radio"][aria-checked="true"]')!.textContent!.trim()).toBe("In review");
      expect(checkbox(el, /Write brief/).getAttribute("aria-checked")).toBe("true");
    });

    test("uncontrolled: a tick applies and is reported", async () => {
      const el = await fixture<TcProjectCard>(html`<tc-project-card look=${look} open heading="Onboarding" .tasks=${tasks}></tc-project-card>`);
      const changes = vi.fn();
      el.addEventListener("tc-tasks-change", (e) => changes((e as CustomEvent).detail.tasks));
      checkbox(el, /Write brief/).click();
      await settle();
      expect(checkbox(el, /Write brief/).getAttribute("aria-checked")).toBe("true");
      expect(changes).toHaveBeenCalledWith([{ ...tasks[0], done: true }, tasks[1]]);
    });

    test("controlled tasks: a prevented tick is reported, and only the app's list shows", async () => {
      const el = await fixture<TcProjectCard>(html`<tc-project-card look=${look} open heading="Onboarding" .tasks=${tasks}></tc-project-card>`);
      const changes = vi.fn();
      el.addEventListener("tc-tasks-change", (e) => {
        e.preventDefault();
        changes();
      });
      checkbox(el, /Write brief/).click();
      await settle();
      expect(changes).toHaveBeenCalledTimes(1);
      expect(checkbox(el, /Write brief/).getAttribute("aria-checked")).toBe("false");
      el.tasks = [{ ...tasks[0], done: true }, tasks[1]];
      await settle();
      expect(checkbox(el, /Write brief/).getAttribute("aria-checked")).toBe("true");
    });

    test("a ring segment ticks its subtask", async () => {
      const el = await fixture<TcProjectCard>(html`<tc-project-card look=${look} open heading="Onboarding" .tasks=${tasks}></tc-project-card>`);
      el.querySelector<SVGElement>(".ui-pc__seg")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await settle();
      expect(checkbox(el, /Write brief/).getAttribute("aria-checked")).toBe("true");
      expect(el.querySelector(".ui-pc__num")!.textContent).toBe("2");
    });

    test("status starts from its property and reports picks", async () => {
      const el = await fixture<TcProjectCard>(html`<tc-project-card look=${look} open heading="Onboarding" status="review" .tasks=${tasks}></tc-project-card>`);
      const changes = vi.fn();
      el.addEventListener("tc-status-change", (e) => changes((e as CustomEvent).detail.status));
      expect(radio(el, "In review").getAttribute("aria-checked")).toBe("true");
      radio(el, "Done").click();
      await settle();
      expect(changes).toHaveBeenCalledWith("done");
      expect(radio(el, "Done").getAttribute("aria-checked")).toBe("true");
    });

    test("a press outside closes the open card; prevented, it stays open", async () => {
      const el = await fixture<TcProjectCard>(html`<tc-project-card look=${look} open heading="Onboarding" .tasks=${tasks}></tc-project-card>`);
      const changes = vi.fn();
      el.addEventListener("tc-open-change", (e) => {
        changes((e as CustomEvent).detail.open);
        e.preventDefault();
      });
      document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      await settle();
      expect(changes).toHaveBeenCalledWith(false);
      expect(el.open).toBe(true);
    });

    test("the head toggles the card; the action fires tc-action", async () => {
      const el = await fixture<TcProjectCard>(html`<tc-project-card look=${look} heading="Onboarding" action-label="Open" .tasks=${tasks}></tc-project-card>`);
      toggleBtn(el).click();
      await settle();
      expect(el.open).toBe(true);
      const action = vi.fn();
      el.addEventListener("tc-action", action);
      el.querySelector<HTMLButtonElement>(".ui-pc__action")!.click();
      expect(action).toHaveBeenCalledTimes(1);
    });

    test("the tray says what is left, a hint, or what you point at", async () => {
      const el = await fixture<TcProjectCard>(html`<tc-project-card look=${look} open heading="Onboarding" .tasks=${tasks}></tc-project-card>`);
      const caption = () => el.querySelector(".ui-pc__caption")!.textContent!.replace(/\s+/g, " ").trim();
      expect(caption()).toBe("1 left");
      checkbox(el, /Write brief/).focus();
      await settle();
      expect(caption()).toBe("Assigned to Ada");
      checkbox(el, /Write brief/).blur();
      el.hint = "Ship by Friday";
      await settle();
      expect(caption()).toBe("Ship by Friday");
    });

    describe("WCAG pass", () => {
      test("picking a status moves focus to the status tag before the row goes inert", async () => {
        const el = await fixture<TcProjectCard>(html`<tc-project-card look=${look} open heading="Onboarding" .tasks=${tasks}></tc-project-card>`);
        statusBtn(el).click();
        await settle();
        const option = radio(el, "In review");
        option.focus();
        option.click();
        await settle();
        expect(el.status).toBe("review");
        expect(el.querySelector(".ui-pc__fold--status")!.hasAttribute("inert")).toBe(true);
        expect(document.activeElement).toBe(statusBtn(el));
      });

      test("Esc in the status row returns focus to the tag; Esc again closes the card onto the head", async () => {
        const el = await fixture<TcProjectCard>(html`<tc-project-card look=${look} open heading="Onboarding" .tasks=${tasks}></tc-project-card>`);
        statusBtn(el).click();
        await settle();
        const option = radio(el, "To do");
        option.focus();
        key(option, "Escape");
        await settle();
        expect(document.activeElement).toBe(statusBtn(el));
        checkbox(el, /Write brief/).focus();
        key(document.activeElement!, "Escape");
        await settle();
        expect(el.open).toBe(false);
        expect(document.activeElement).toBe(toggleBtn(el));
      });

      test("closing the card while focus is in the body moves focus to the head", async () => {
        const el = await fixture<TcProjectCard>(html`<tc-project-card look=${look} open heading="Onboarding" .tasks=${tasks}></tc-project-card>`);
        checkbox(el, /Write brief/).focus();
        document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
        await settle();
        expect(el.open).toBe(false);
        expect(document.activeElement).toBe(toggleBtn(el));
      });

      test("status options follow the radio pattern: one tab stop, arrows choose", async () => {
        const el = await fixture<TcProjectCard>(html`<tc-project-card look=${look} open heading="Onboarding" .tasks=${tasks}></tc-project-card>`);
        const changes = vi.fn();
        el.addEventListener("tc-status-change", (e) => changes((e as CustomEvent).detail.status));
        statusBtn(el).click();
        await settle();
        const radios = [...el.querySelectorAll<HTMLElement>('[role="radio"]')];
        expect(radios.map((r) => r.tabIndex)).toEqual([0, -1, -1, -1]);
        radios[0].focus();
        key(radios[0], "ArrowRight");
        await settle();
        expect(changes).toHaveBeenCalledWith("progress");
        expect(document.activeElement).toBe(radios[1]);
        expect(radios[1].getAttribute("aria-checked")).toBe("true");
        expect(el.querySelector(".ui-pc__fold--status")!.hasAttribute("inert")).toBe(false);
      });

      test("people buttons are named by their content, the caption is not live; a person filters the rows", async () => {
        const el = await fixture<TcProjectCard>(html`<tc-project-card look=${look} open heading="Onboarding" .members=${members} .tasks=${[{ ...tasks[0], assignee: "Maya Chen" }, tasks[1]]}></tc-project-card>`);
        const maya = [...el.querySelectorAll<HTMLElement>(".ui-pc__member")].find((b) => b.textContent!.includes("Only Maya Chen's subtasks"))!;
        expect(maya.hasAttribute("aria-label")).toBe(false);
        expect(maya.querySelector(".ui-pc__avatar")!.getAttribute("aria-hidden")).toBe("true");
        expect(el.querySelector("[aria-live]")).toBeNull();
        maya.click();
        await settle();
        expect(maya.getAttribute("aria-pressed")).toBe("true");
        expect(checkbox(el, /Review/).hasAttribute("data-dim")).toBe(true);
        expect(checkbox(el, /Write brief/).hasAttribute("data-dim")).toBe(false);
      });
    });
  });
}

test("axe: no violations in either look", async () => {
  const wrap = await fixture(html`<div>
    <tc-project-card open heading="Onboarding" due="Nov 14" action-label="Open" .members=${members} .tasks=${tasks}></tc-project-card>
    <tc-project-card look="clean" open heading="Clean" action-label="Open" .members=${members} .tasks=${tasks}></tc-project-card>
  </div>`);
  for (const a of document.getAnimations()) a.finish();
  const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
});
