/*
 * <tc-background-tasks> in real browsers: the host and both looks, the indicator (counts, ring, check and alert),
 * the panel as a dialog (focus, Escape), the list's keyboard, the actions as cancelable events, announcements,
 * windowing, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/background-tasks";
import { taskTime, TcBackgroundTasks, type BackgroundTask, type BackgroundTaskActionDetail, type BackgroundTasksClearDetail } from "../../src/elements/background-tasks";
import { BackgroundTasks } from "../../src/elements/react/background-tasks";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const TASKS: BackgroundTask[] = [
  { id: "exp", label: "Export Q3 revenue", kind: "export", status: "running", detail: "CSV · 48,210 rows", progress: 0.4, remaining: 65000, elapsed: 12000 },
  { id: "up", label: "Upload assets", kind: "upload", status: "failed", error: "Connection lost", elapsed: 9000 },
  { id: "idx", label: "Reindex help center", kind: "index", status: "queued" },
  { id: "inv", label: "Download invoices", kind: "download", status: "done", elapsed: 42000, result: { label: "invoices.zip", href: "#invoices" } },
  { id: "sum", label: "Summarise tickets", kind: "agent", status: "running", progress: 0.2 },
];
const looks = ["standard", "clean"] as const;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const webkit = /AppleWebKit/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
const plain = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

const make = (o: { look?: string; tasks?: BackgroundTask[]; layout?: string } = {}) =>
  fixture<TcBackgroundTasks>(html`<tc-background-tasks look=${o.look ?? "standard"} layout=${o.layout ?? "indicator"} .tasks=${o.tasks ?? TASKS}></tc-background-tasks>`);
const trigger = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-bgt__trigger")!;
const pop = (el: Element) => el.querySelector<HTMLElement>(".ui-bgt__pop");
const rows = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-bgt__row")];
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-bgt__row[data-id="${id}"]`)!;
const actOf = (el: Element, id: string, kind: string) => row(el, id).querySelector<HTMLElement>(`[data-act="${kind}"]`);
const status = (el: Element) => plain(el.querySelector('[role="status"]')!.textContent);
const openPanel = async (el: TcBackgroundTasks) => {
  trigger(el).click();
  await settle();
};

describe("tc-background-tasks", () => {
  for (const look of looks) {
    test(`${look}: the host, the panel layout as a region with the card header and a count`, async () => {
      const el = await make({ look, layout: "panel" });
      expect(el.dataset.ui).toBe("bgt");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("region");
      const title = el.querySelector(".tc-head__title")!;
      expect(plain(title.textContent)).toBe("Background tasks");
      expect(el.getAttribute("aria-labelledby")).toBe(title.id);
      expect(plain(el.querySelector(".tc-head__aside")!.textContent)).toBe("3 active");
      expect(trigger(el)).toBeNull();
    });
  }

  test("sections in order – Running, Queued, Done, Failed – with counts, and each task's status line", async () => {
    const el = await make({ layout: "panel" });
    expect([...el.querySelectorAll(".ui-bgt__label")].map((h) => plain(h.textContent))).toEqual(["Running 2", "Queued 1", "Done 1", "Failed 1"]);
    expect(rows(el).map((r) => r.dataset.id)).toEqual(["exp", "sum", "idx", "inv", "up"]);
    const meta = (id: string) => plain(row(el, id).querySelector(".ui-bgt__meta")!.textContent);
    expect(meta("exp")).toBe("40% · 1m 05s left · 12s elapsed");
    expect(meta("idx")).toBe("Waiting to start");
    expect(meta("inv")).toBe("Done · took 42s");
    expect(meta("up")).toBe("Connection lost · after 9s");
    // The row is named by its label and described by its detail and status
    const r = row(el, "exp");
    expect(plain(document.getElementById(r.getAttribute("aria-labelledby")!)!.textContent)).toBe("Export Q3 revenue");
    expect(r.getAttribute("aria-describedby")!.split(" ")).toHaveLength(2);
    // The bar: determinate, or Working… when the app doesn't know
    const bar = r.querySelector('[role="progressbar"]')!;
    expect(bar.getAttribute("aria-valuenow")).toBe("40");
    el.tasks = [{ id: "w", label: "Agent run", kind: "agent", status: "running" }];
    await settle();
    const unknown = row(el, "w").querySelector('[role="progressbar"]')!;
    expect(unknown.hasAttribute("aria-valuenow")).toBe(false);
    expect(unknown.getAttribute("aria-valuetext")).toBe("Working");
    expect(plain(row(el, "w").querySelector(".ui-bgt__meta")!.textContent)).toBe("Working…");
  });

  test("taskTime: seconds, minutes, hours", () => {
    expect(taskTime(400)).toBe("0s");
    expect(taskTime(45_000)).toBe("45s");
    expect(taskTime(125_000)).toBe("2m 05s");
    expect(taskTime(3_900_000)).toBe("1h 05m");
  });

  test("actions by status: Cancel while running or queued, Retry when failed, Open when done with a result", async () => {
    const el = await make({ layout: "panel", tasks: [...TASKS, { id: "nores", label: "Sync", status: "done" }, { id: "fixed", label: "Locked job", status: "running", cancelable: false, progress: 0.5 }] });
    expect(actOf(el, "exp", "cancel")!.getAttribute("aria-label")).toBe("Cancel Export Q3 revenue");
    expect(actOf(el, "idx", "cancel")).not.toBeNull();
    expect(actOf(el, "up", "retry")!.getAttribute("aria-label")).toBe("Retry Upload assets");
    const open = actOf(el, "inv", "open")!;
    expect(open.tagName).toBe("A");
    expect(open.getAttribute("aria-label")).toBe("Open invoices.zip");
    expect(row(el, "nores").querySelector("[data-act]")).toBeNull();
    expect(row(el, "fixed").querySelector("[data-act]")).toBeNull();
  });

  test("the indicator: a button named with the counts, a badge, and a ring with the overall progress", async () => {
    const el = await make();
    const b = trigger(el);
    expect(b.getAttribute("aria-expanded")).toBe("false");
    expect(b.getAttribute("aria-haspopup")).toBe("dialog");
    expect(b.getAttribute("aria-label")).toBe("Background tasks, 3 active (2 running, 1 queued), 1 failed, 1 done");
    expect(plain(b.querySelector(".ui-bgt__badge")!.textContent)).toBe("3");
    expect(b.dataset.state).toBe("busy");
    expect(b.hasAttribute("data-alert")).toBe(true);
    // (0.4 + 0.2 + 0 queued) / 3 = 20% → offset 80
    expect(parseFloat(b.querySelector<SVGElement>(".ui-bgt__arc")!.style.strokeDashoffset)).toBe(80);
    expect(b.querySelector(".ui-bgt__ring")!.hasAttribute("data-spin")).toBe(false);
    // No running task knows its progress: the ring spins
    el.tasks = [{ id: "a", label: "Agent run", status: "running" }];
    await settle();
    expect(b.querySelector(".ui-bgt__ring")!.hasAttribute("data-spin")).toBe(true);
  });

  test("the indicator turns to a check when all are done and an alert when any failed – until the panel is opened", async () => {
    const el = await make({ tasks: [{ id: "a", label: "Export", status: "done" }] });
    expect(trigger(el).dataset.state).toBe("done");
    expect(trigger(el).querySelector(".ui-bgt__badge")).toBeNull();
    await openPanel(el);
    await userEvent.keyboard("{Escape}");
    await settle();
    expect(trigger(el).dataset.state).toBe("idle");
    el.tasks = [{ id: "a", label: "Export", status: "done" }, { id: "b", label: "Upload", status: "failed" }];
    await settle();
    expect(trigger(el).dataset.state).toBe("failed");
    expect(trigger(el).getAttribute("aria-label")).toBe("Background tasks, 1 failed, 1 done");
  });

  test("opening: a dialog labelled by its title, focus on the first task; Escape closes and returns focus", async () => {
    const el = await make();
    const events: boolean[] = [];
    el.addEventListener("tc-open-change", (e) => events.push((e as CustomEvent<{ open: boolean }>).detail.open));
    trigger(el).focus();
    await userEvent.keyboard("{Enter}");
    await settle();
    const p = pop(el)!;
    expect(p.getAttribute("role")).toBe("dialog");
    expect(plain(document.getElementById(p.getAttribute("aria-labelledby")!)!.textContent)).toBe("Background tasks");
    expect(trigger(el).getAttribute("aria-expanded")).toBe("true");
    expect(trigger(el).getAttribute("aria-controls")).toBe(p.id);
    expect(el.open).toBe(true);
    expect(document.activeElement).toBe(row(el, "exp"));
    await userEvent.keyboard("{Escape}");
    await settle();
    expect(pop(el)).toBeNull();
    expect(el.open).toBe(false);
    expect(document.activeElement).toBe(trigger(el));
    expect(events).toEqual([true, false]);
  });

  test("tc-open-change can be prevented, and a click outside closes the panel", async () => {
    const el = await make();
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener("tc-open-change", stop);
    await openPanel(el);
    expect(pop(el)).toBeNull();
    el.removeEventListener("tc-open-change", stop);
    await openPanel(el);
    expect(pop(el)).not.toBeNull();
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await settle();
    expect(pop(el)).toBeNull();
    expect(el.open).toBe(false);
  });

  test("keyboard: ↑ ↓ Home End move between tasks (one tab stop); Tab reaches the focused task's actions", async () => {
    const el = await make();
    await openPanel(el);
    expect(document.activeElement).toBe(row(el, "exp"));
    const tabStops = () => rows(el).filter((r) => r.tabIndex === 0).map((r) => r.dataset.id);
    expect(tabStops()).toEqual(["exp"]);
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(row(el, "sum"));
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(row(el, "up"));
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(row(el, "up"));
    await userEvent.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(row(el, "inv"));
    await userEvent.keyboard("{Home}");
    expect(document.activeElement).toBe(row(el, "exp"));
    await settle();
    expect(tabStops()).toEqual(["exp"]);
    // Only the focused task's actions are in the tab order
    expect([...el.querySelectorAll<HTMLElement>("[data-act]")].filter((b) => b.tabIndex === 0).map((b) => b.closest<HTMLElement>(".ui-bgt__row")!.dataset.id)).toEqual(["exp"]);
    // WebKit on macOS skips buttons with Tab by default; the order is checked where the browser tabs to them
    if (!webkit) {
      await userEvent.keyboard("{Tab}");
      expect(document.activeElement).toBe(actOf(el, "exp", "cancel"));
      await userEvent.keyboard("{Tab}");
      expect(document.activeElement).toBe(el.querySelector(".ui-bgt__clear"));
    }
    // An arrow from an action moves to the next task
    actOf(el, "exp", "cancel")!.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(row(el, "sum"));
  });

  test("Cancel: a cancelable event; unprevented it removes the task, focus moves to the next and it's announced", async () => {
    const el = await make({ layout: "panel" });
    const seen: BackgroundTaskActionDetail[] = [];
    el.addEventListener("tc-task-cancel", (e) => seen.push((e as CustomEvent<BackgroundTaskActionDetail>).detail));
    actOf(el, "exp", "cancel")!.focus();
    actOf(el, "exp", "cancel")!.click();
    await settle();
    expect(seen[0].task.id).toBe("exp");
    expect(seen[0].tasks.map((t) => t.id)).toEqual(["up", "idx", "inv", "sum"]);
    expect(row(el, "exp")).toBeNull();
    expect(document.activeElement).toBe(row(el, "sum"));
    expect(status(el)).toBe("Export Q3 revenue cancelled");
  });

  test("controlled: preventDefault() leaves the tasks as they are", async () => {
    const el = await make({ layout: "panel" });
    for (const name of ["tc-task-cancel", "tc-task-retry", "tc-clear-finished"]) el.addEventListener(name, (e) => e.preventDefault());
    actOf(el, "exp", "cancel")!.click();
    actOf(el, "up", "retry")!.click();
    el.querySelector<HTMLButtonElement>(".ui-bgt__clear")!.click();
    await settle();
    expect(el.tasks).toBe(TASKS);
    expect(rows(el)).toHaveLength(5);
  });

  test("Retry queues the failed task again; Clear finished removes done and failed tasks", async () => {
    const el = await make({ layout: "panel" });
    let retried: BackgroundTaskActionDetail | undefined;
    el.addEventListener("tc-task-retry", (e) => (retried = (e as CustomEvent<BackgroundTaskActionDetail>).detail));
    actOf(el, "up", "retry")!.focus();
    actOf(el, "up", "retry")!.click();
    await settle();
    expect(retried!.task.status).toBe("failed");
    expect(row(el, "up").dataset.status).toBe("queued");
    expect(row(el, "up").closest<HTMLElement>(".ui-bgt__section")!.dataset.status).toBe("queued");
    expect(document.activeElement).toBe(row(el, "up"));
    expect(el.tasks.find((t) => t.id === "up")!.error).toBeUndefined();
    let cleared: BackgroundTasksClearDetail | undefined;
    el.addEventListener("tc-clear-finished", (e) => (cleared = (e as CustomEvent<BackgroundTasksClearDetail>).detail));
    el.querySelector<HTMLButtonElement>(".ui-bgt__clear")!.click();
    await settle();
    expect(cleared!.cleared.map((t) => t.id)).toEqual(["inv"]);
    expect(rows(el).map((r) => r.dataset.id)).toEqual(["exp", "sum", "up", "idx"]);
    expect(el.querySelector(".ui-bgt__clear")).toBeNull();
    expect(status(el)).toBe("Cleared 1 finished task");
  });

  test("Open: tc-task-open; preventing it stops the result link", async () => {
    const el = await make({ layout: "panel" });
    let opened = "";
    let clickPrevented = false;
    el.addEventListener("tc-task-open", (e) => {
      opened = (e as CustomEvent<BackgroundTaskActionDetail>).detail.task.id;
      e.preventDefault();
    });
    document.addEventListener("click", (e) => (clickPrevented = e.defaultPrevented), { once: true });
    actOf(el, "inv", "open")!.click();
    expect(opened).toBe("inv");
    expect(clickPrevented).toBe(true);
    expect(location.hash).not.toBe("#invoices");
  });

  test("announcements: finished and failed tasks, politely; not progress ticks; not a list that arrives finished", async () => {
    const el = await make({ layout: "panel", tasks: [] });
    const region = el.querySelector('[role="status"]')!;
    el.tasks = [{ id: "old", label: "Old export", status: "done" }, { id: "e", label: "Export", status: "running", progress: 0.1 }, { id: "u", label: "Upload", status: "running", progress: 0.1 }];
    await settle();
    expect(status(el)).toBe("");
    el.tasks = el.tasks.map((t) => (t.status === "running" ? { ...t, progress: 0.6 } : t));
    await settle();
    expect(status(el)).toBe("");
    el.tasks = el.tasks.map((t) => (t.id === "e" ? { ...t, status: "done" } : t.id === "u" ? { ...t, status: "failed" } : t));
    await settle();
    expect(status(el)).toBe("Export ready. Upload failed");
    expect(region.closest("[aria-hidden]")).toBeNull();
    // The app can word it
    el.announce = (t) => `${t.label}: ${t.status}`;
    el.tasks = el.tasks.map((t) => (t.id === "u" ? { ...t, status: "running" } : t));
    await settle();
    el.tasks = el.tasks.map((t) => (t.id === "u" ? { ...t, status: "done" } : t));
    await settle();
    expect(status(el)).toBe("Upload: done");
  });

  test("windowing: a long list renders the rows near the viewport, and End still reaches the last task", async () => {
    const many: BackgroundTask[] = Array.from({ length: 300 }, (_, i) => ({ id: `t${i}`, label: `Export ${i}`, status: "queued" }));
    const el = await make({ tasks: many });
    await openPanel(el);
    await wait(100);
    await settle();
    expect(rows(el).length).toBeLessThan(120);
    await expect.poll(() => document.activeElement === row(el, "t0")).toBe(true);
    await userEvent.keyboard("{End}");
    // The window scrolls, renders the last rows, then focuses – a few frames when the machine is busy. The row is
    // looked up on each try: it doesn't exist until the window reaches it
    await expect.poll(() => document.activeElement === row(el, "t299"), { timeout: 5000 }).toBe(true);
  });

  test("reduced motion stops the ring's spin and the indeterminate bars", () => {
    const css = TcBackgroundTasks.css;
    const block = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(block).toMatch(/\.ui-bgt__ring\[data-spin\][^{]*\.ui-bgt__fill \{ animation: none; \}/);
  });

  test("the empty panel says so and still opens with focus inside", async () => {
    const el = await make({ tasks: [] });
    expect(trigger(el).getAttribute("aria-label")).toBe("Background tasks, none");
    await openPanel(el);
    expect(plain(el.querySelector(".ui-bgt__empty")!.textContent)).toBe("Nothing running in the background");
    expect(document.activeElement).toBe(pop(el));
  });

  test("the wrapper: uncontrolled tasks survive a parent re-render; callbacks fire", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const calls: string[] = [];
    let rerender: (n: number) => void = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      rerender = setN;
      return React.createElement(BackgroundTasks, {
        layout: "panel",
        title: `Jobs ${n}`,
        defaultTasks: TASKS,
        onCancel: (t) => calls.push(`cancel:${t.id}`),
        onTasksChange: (next, change) => calls.push(`${change.action}:${next.length}`),
      });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-background-tasks")!;
    actOf(el, "exp", "cancel")!.click();
    await act(async () => settle());
    await act(async () => rerender(1));
    await settle();
    expect(plain(el.querySelector(".tc-head__title")!.textContent)).toBe("Jobs 1");
    expect(row(el, "exp")).toBeNull();
    expect(calls).toEqual(["cancel:exp", "cancel:4"]);
    await act(async () => root.unmount());
  });

  test("the wrapper: controlled tasks only report; open is controlled; onOpen returning false stops the link", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const calls: string[] = [];
    await act(async () =>
      root.render(
        React.createElement("div", null,
          React.createElement(BackgroundTasks, { layout: "panel", tasks: TASKS, onRetry: (t) => calls.push(`retry:${t.id}`), onOpen: (t) => (calls.push(`open:${t.id}`), false) }),
          React.createElement(BackgroundTasks, { open: false, tasks: TASKS, onOpenChange: (o) => calls.push(`open-change:${o}`) }),
        ),
      ),
    );
    await settle();
    const [panel, indicator] = [...host.querySelectorAll<TcBackgroundTasks>("tc-background-tasks")];
    actOf(panel, "up", "retry")!.click();
    await act(async () => settle());
    expect(row(panel, "up").dataset.status).toBe("failed");
    let prevented = false;
    document.addEventListener("click", (e) => (prevented = e.defaultPrevented), { once: true });
    actOf(panel, "inv", "open")!.click();
    expect(prevented).toBe(true);
    trigger(indicator).click();
    await act(async () => settle());
    expect(pop(indicator)).toBeNull();
    expect(calls).toEqual(["retry:up", "open:inv", "open-change:true"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look, the indicator with its panel open and the panel inline (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10; color-scheme: dark" : ""}>
        <tc-background-tasks .tasks=${TASKS}></tc-background-tasks>
        <tc-background-tasks look="clean" .tasks=${[{ id: "d", label: "Export", status: "done" }, { id: "f", label: "Upload", status: "failed" }]}></tc-background-tasks>
        <tc-background-tasks layout="panel" .tasks=${TASKS}></tc-background-tasks>
        <tc-background-tasks layout="panel" look="clean" .tasks=${TASKS}></tc-background-tasks>
        <tc-background-tasks layout="panel" .tasks=${[]}></tc-background-tasks>
      </div>`);
      const [std, clean] = [...wrap.querySelectorAll<TcBackgroundTasks>("tc-background-tasks")];
      await openPanel(std);
      await wait(300);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      expect(pop(std)).not.toBeNull();
      expect(clean.querySelector(".ui-bgt__trigger")!.getAttribute("data-state")).toBe("failed");
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
