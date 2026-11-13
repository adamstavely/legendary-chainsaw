/*
 * <tc-running-now> in real browsers: the host and both looks, the pill's words and ring, the panel (groups, focus,
 * keys, Escape), actions as a cancelable event, elapsed times from `now` and the own clock, debounced announcements,
 * "All done", the React wrapper and axe. Notify when done: opt-in bells on tasks still going, the cancelable
 * tc-notify-change, tc-notify when a watched task finishes, channels, the wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/running-now";
import { runningTime, TcRunningNow, type RunningTask } from "../../src/elements/running-now";
import { RunningNow } from "../../src/elements/react/running-now";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = Date.UTC(2026, 10, 10, 9, 0, 0);
const TASKS: RunningTask[] = [
  { id: "vendors", title: "Check vendor records", agent: "Records agent", status: "running", progress: 0.42, started: NOW - 6 * 60_000 },
  { id: "draft", title: "Draft the audit report", agent: "Report agent", status: "needs-you", started: NOW - 14 * 60_000 },
  { id: "export", title: "Export log sample", agent: "Records agent", status: "done", started: NOW - 31 * 60_000, ended: NOW - 24 * 60_000 },
  { id: "classify", title: "Classify contracts", status: "running", started: NOW - 45_000 },
  { id: "dedupe", title: "Find duplicates", status: "failed" },
];
const looks = ["standard", "clean"] as const;
const plain = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
/** The pill's words as seen: without the comma that's only for screen readers */
const seen = (el: Element) => plain([...pill(el).querySelectorAll(".ui-rnw__part, .ui-rnw__dot")].map((n) => n.textContent).join(" "));

const make = (o: { look?: string; tasks?: RunningTask[]; now?: number | null } = {}) =>
  fixture<TcRunningNow>(html`<tc-running-now look=${o.look ?? "standard"} .tasks=${o.tasks ?? TASKS} .now=${o.now === null ? undefined : (o.now ?? NOW)}></tc-running-now>`);
const pill = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-rnw__pill")!;
const pop = (el: Element) => el.querySelector<HTMLElement>(".ui-rnw__pop");
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-rnw__row[data-id="${id}"]`)!;
const status = (el: Element) => plain(el.querySelector('[role="status"]')!.textContent);
const openPanel = async (el: TcRunningNow) => {
  pill(el).click();
  await settle();
};

describe("tc-running-now", () => {
  for (const look of looks) {
    test(`${look}: the host and the pill – its words, its state and its description`, async () => {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("rnw");
      expect(el.dataset.look).toBe(look);
      expect(seen(el)).toBe("2 running · 1 needs you");
      expect(pill(el).dataset.state).toBe("attention");
      expect(pill(el).getAttribute("aria-haspopup")).toBe("dialog");
      expect(pill(el).getAttribute("aria-expanded")).toBe("false");
      expect(plain(document.getElementById(pill(el).getAttribute("aria-describedby")!)!.textContent)).toBe("Running now");
      expect(pop(el)).toBeNull();
    });
  }

  test("the words: \"need you\" in the plural, left out at none; nothing running; the ring turns when no task can tell", async () => {
    const el = await make({ tasks: [...TASKS, { id: "x", title: "X", status: "needs-you" }] });
    expect(seen(el)).toBe("2 running · 2 need you");
    el.tasks = TASKS.filter((t) => t.status !== "needs-you");
    await settle();
    expect(seen(el)).toBe("2 running");
    expect(pill(el).dataset.state).toBe("busy");
    expect(el.querySelector(".ui-rnw__pill .ui-rnw__ring")!.hasAttribute("data-spin")).toBe(false);
    el.tasks = [{ id: "c", title: "Classify", status: "running" }];
    await settle();
    expect(el.querySelector(".ui-rnw__pill .ui-rnw__ring")!.hasAttribute("data-spin")).toBe(true);
    el.tasks = [];
    await settle();
    expect(seen(el)).toBe("Nothing running");
    expect(pill(el).dataset.state).toBe("idle");
    expect(runningTime(45_000)).toBe("45s");
    expect(runningTime(125_000)).toBe("2m 05s");
    expect(runningTime(3_900_000)).toBe("1h 05m");
  });

  test("\"All done\" when the last one finishes", async () => {
    const el = await make({ tasks: [{ id: "a", title: "A", status: "running", progress: 0.9 }] });
    el.tasks = [{ id: "a", title: "A", status: "done" }];
    await settle();
    expect(seen(el)).toBe("All done");
    expect(pill(el).dataset.state).toBe("done");
  });

  test("the panel: a dialog, grouped Needs you / Running / Recently done, focus on the first task, keys, Escape", async () => {
    const el = await make();
    const events: unknown[] = [];
    el.addEventListener("tc-open-change", (e) => events.push((e as CustomEvent).detail.open));
    await openPanel(el);
    expect(el.open).toBe(true);
    const p = pop(el)!;
    expect(p.getAttribute("role")).toBe("dialog");
    expect(pill(el).getAttribute("aria-controls")).toBe(p.id);
    expect([...p.querySelectorAll(".ui-rnw__label")].map((l) => plain(l.textContent))).toEqual(["Needs you 1", "Running 2", "Recently done 2"]);
    expect([...p.querySelectorAll<HTMLElement>(".ui-rnw__row")].map((r) => r.dataset.id)).toEqual(["draft", "vendors", "classify", "export", "dedupe"]);
    await expect.poll(() => document.activeElement).toBe(row(el, "draft"));
    expect([...p.querySelectorAll<HTMLElement>(".ui-rnw__row")].filter((r) => r.tabIndex === 0)).toHaveLength(1);
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(row(el, "vendors"));
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(row(el, "dedupe"));
    await userEvent.keyboard("{Home}");
    expect(document.activeElement).toBe(row(el, "draft"));
    await userEvent.keyboard("{Escape}");
    await settle();
    expect(el.open).toBe(false);
    expect(pop(el)).toBeNull();
    expect(document.activeElement).toBe(pill(el));
    expect(events).toEqual([true, false]);
  });

  test("each task's line: agent, progress or Working, elapsed from `now`; the action by status", async () => {
    const el = await make();
    await openPanel(el);
    const meta = (id: string) => plain(row(el, id).querySelector(".ui-rnw__meta")!.textContent);
    expect(meta("vendors")).toBe("Records agent · 42% · 6m 00s");
    expect(meta("classify")).toBe("Working · 45s");
    expect(meta("draft")).toBe("Report agent · 14m 00s");
    expect(meta("export")).toBe("Records agent · 7m 00s");
    expect(meta("dedupe")).toBe("Failed");
    const act = (id: string) => row(el, id).querySelector<HTMLButtonElement>(".ui-rnw__act")!;
    expect([act("draft"), act("vendors"), act("export")].map((b) => [b.dataset.act, plain(b.textContent)])).toEqual([
      ["review", "Review Draft the audit report"],
      ["stop", "Stop Check vendor records"],
      ["open", "Open Export log sample"],
    ]);
    const bar = row(el, "vendors").querySelector(".ui-rnw__arc") as SVGElement;
    expect(parseFloat(bar.style.strokeDashoffset)).toBe(58);
  });

  test("actions: a cancelable tc-task-action; Review and Open close the panel unless prevented, Stop keeps it", async () => {
    const el = await make();
    const seen: unknown[] = [];
    el.addEventListener("tc-task-action", (e) => seen.push((({ id, action }) => ({ id, action }))((e as CustomEvent).detail)));
    await openPanel(el);
    row(el, "vendors").querySelector<HTMLButtonElement>(".ui-rnw__act")!.click();
    await settle();
    expect(el.open).toBe(true);
    const block = (e: Event) => e.preventDefault();
    el.addEventListener("tc-task-action", block);
    row(el, "draft").querySelector<HTMLButtonElement>(".ui-rnw__act")!.click();
    await settle();
    expect(el.open).toBe(true);
    el.removeEventListener("tc-task-action", block);
    row(el, "draft").querySelector<HTMLButtonElement>(".ui-rnw__act")!.click();
    await settle();
    expect(el.open).toBe(false);
    expect(seen).toEqual([{ id: "vendors", action: "stop" }, { id: "draft", action: "review" }, { id: "draft", action: "review" }]);
  });

  test("prevented tc-open-change keeps the panel as it is", async () => {
    const el = await make();
    el.addEventListener("tc-open-change", (e) => e.preventDefault());
    await openPanel(el);
    expect(el.open).toBe(false);
    expect(pop(el)).toBeNull();
  });

  test("its own clock: without `now`, elapsed times count while the panel is open", async () => {
    const started = Date.now() - 65_000;
    const el = await make({ now: null, tasks: [{ id: "a", title: "A", status: "running", progress: 0.5, started }] });
    await openPanel(el);
    const meta = () => plain(row(el, "a").querySelector(".ui-rnw__meta")!.textContent);
    expect(meta()).toMatch(/^50% · 1m 0[5-9]s$/);
    const first = meta();
    await expect.poll(() => meta(), { timeout: 4000 }).not.toBe(first);
  });

  test("announcements: a task that needs you or finished, once things settle; never a progress tick", async () => {
    const el = await make();
    el.tasks = TASKS.map((t) => (t.id === "vendors" ? { ...t, progress: 0.6 } : t));
    await settle();
    el.tasks = TASKS.map((t) => (t.id === "vendors" ? { ...t, status: "needs-you" } : t.id === "classify" ? { ...t, status: "done" } : t));
    await settle();
    expect(status(el)).toBe("");
    await expect.poll(() => status(el)).toBe("Check vendor records needs you. Classify contracts done");
  });

  test("the wrapper: open is controlled; onTaskAction returning false keeps the panel open", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const calls: string[] = [];
    function App() {
      const [open, setOpen] = React.useState(false);
      return React.createElement("div", null,
        React.createElement(RunningNow, { tasks: TASKS, now: NOW, open, onOpenChange: (o) => (calls.push(`open:${o}`), setOpen(o)), onTaskAction: (a, t) => (calls.push(`${a}:${t.id}`), false) }),
        React.createElement(RunningNow, { tasks: TASKS, now: NOW, open: false, onOpenChange: (o) => calls.push(`held:${o}`) }),
      );
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const [free, held] = [...host.querySelectorAll<TcRunningNow>("tc-running-now")];
    pill(held).click();
    await act(async () => settle());
    expect(pop(held)).toBeNull();
    pill(free).click();
    await act(async () => settle());
    expect(pop(free)).not.toBeNull();
    row(free, "draft").querySelector<HTMLButtonElement>(".ui-rnw__act")!.click();
    await act(async () => settle());
    expect(free.open).toBe(true);
    expect(calls).toEqual(["held:true", "open:true", "review:draft"]);
    await act(async () => root.unmount());
  });

  describe("notify when done", () => {
    const makeN = (o: { look?: string; channels?: string[]; notify?: string[] } = {}) =>
      fixture<TcRunningNow>(
        html`<tc-running-now look=${o.look ?? "standard"} notifiable .tasks=${TASKS} .now=${NOW} .notify=${o.notify ?? []} .notifyChannels=${o.channels ?? []}></tc-running-now>`,
      );
    const bell = (el: Element, id: string) => row(el, id).querySelector<HTMLButtonElement>(".ui-rnw__bell");

    test("opt-in: without `notifiable` there are no bells; with it, only tasks still going get one", async () => {
      const plainEl = await make();
      await openPanel(plainEl);
      expect(plainEl.querySelectorAll(".ui-rnw__bell")).toHaveLength(0);
      const el = await makeN();
      await openPanel(el);
      expect([...el.querySelectorAll<HTMLElement>(".ui-rnw__row")].filter((r) => r.querySelector(".ui-rnw__bell")).map((r) => r.dataset.id)).toEqual(["draft", "vendors", "classify"]);
      const b = bell(el, "vendors")!;
      expect(plain(b.textContent)).toBe("Notify me when Check vendor records finishes");
      expect(b.getAttribute("aria-pressed")).toBe("false");
      expect(b.hasAttribute("aria-expanded")).toBe(false);
      // One tab stop for the list: the active row's bell and action take part, the others' don't
      expect(bell(el, "draft")!.tabIndex).toBe(0);
      expect(b.tabIndex).toBe(-1);
      await expect.poll(() => document.activeElement).toBe(row(el, "draft"));
      await userEvent.keyboard("{Tab}");
      expect(document.activeElement).toBe(bell(el, "draft"));
      await userEvent.keyboard("{Enter}");
      await settle();
      expect(el.notify).toEqual(["draft"]);
    });

    test("the bell: a cancelable tc-notify-change, pressed while on, announced; tc-notify once a watched task finishes", async () => {
      const el = await makeN();
      await openPanel(el);
      const changes: unknown[] = [];
      const notices: unknown[] = [];
      el.addEventListener("tc-notify-change", (e) => changes.push((e as CustomEvent).detail));
      el.addEventListener("tc-notify", (e) => notices.push((e as CustomEvent).detail));
      bell(el, "vendors")!.click();
      await settle();
      expect(changes).toEqual([{ notify: ["vendors"], id: "vendors", on: true, notifyVia: {} }]);
      expect(el.notify).toEqual(["vendors"]);
      expect(bell(el, "vendors")!.getAttribute("aria-pressed")).toBe("true");
      expect(bell(el, "vendors")!.hasAttribute("data-on")).toBe(true);
      expect(status(el)).toBe("You'll be told when Check vendor records finishes");
      const stop = (e: Event) => e.preventDefault();
      el.addEventListener("tc-notify-change", stop);
      bell(el, "classify")!.click();
      await settle();
      expect(el.notify).toEqual(["vendors"]);
      expect(bell(el, "classify")!.getAttribute("aria-pressed")).toBe("false");
      el.removeEventListener("tc-notify-change", stop);
      // The watched one finishes: tc-notify, and the bell goes with its state; the unwatched one finishing is quiet
      el.tasks = TASKS.map((t) => (t.id === "vendors" ? { ...t, status: "done", ended: NOW } : t.id === "classify" ? { ...t, status: "failed" } : t));
      await settle();
      expect(notices).toEqual([{ id: "vendors", status: "done", task: el.tasks[0], channels: undefined }]);
      expect(bell(el, "vendors")).toBeNull();
      await expect.poll(() => status(el)).toBe("Check vendor records done. Classify contracts failed");
      el.tasks = [...el.tasks];
      await settle();
      expect(notices).toHaveLength(1);
      bell(el, "draft")!.click();
      await settle();
      bell(el, "draft")!.click();
      await settle();
      expect(el.notify).toEqual(["vendors"]);
      expect(status(el)).toBe("No longer watching Draft the audit report");
    });

    test("channels: the bell opens a list of checkboxes; each one is a change; Escape closes the list, not the panel", async () => {
      const el = await makeN({ channels: ["In app", "Email", "Push"] });
      await openPanel(el);
      const changes: { notify: string[]; channels?: string[]; notifyVia: Record<string, string[]> }[] = [];
      const notices: unknown[] = [];
      el.addEventListener("tc-notify-change", (e) => changes.push((e as CustomEvent).detail));
      el.addEventListener("tc-notify", (e) => notices.push((e as CustomEvent).detail));
      const b = bell(el, "vendors")!;
      expect(b.getAttribute("aria-expanded")).toBe("false");
      expect(b.hasAttribute("aria-pressed")).toBe(false);
      b.click();
      await settle();
      const list = row(el, "vendors").querySelector<HTMLFieldSetElement>(".ui-rnw__channels")!;
      expect(b.getAttribute("aria-expanded")).toBe("true");
      expect(b.getAttribute("aria-controls")).toBe(list.id);
      expect(plain(list.querySelector("legend")!.textContent)).toBe("Tell me about Check vendor records by");
      const boxes = [...list.querySelectorAll<HTMLInputElement>("input[type=checkbox]")];
      expect(boxes.map((x) => plain(x.parentElement!.textContent))).toEqual(["In app", "Email", "Push"]);
      await expect.poll(() => document.activeElement).toBe(boxes[0]);
      boxes[1].click();
      await settle();
      boxes[2].click();
      await settle();
      expect(changes.map((c) => [c.notify, c.channels])).toEqual([
        [["vendors"], ["Email"]],
        [["vendors"], ["Email", "Push"]],
      ]);
      expect(el.notifyVia).toEqual({ vendors: ["Email", "Push"] });
      expect(plain(b.textContent)).toBe("Notify me when Check vendor records finishes: Email, Push");
      expect(status(el)).toBe("You'll be told by Email, Push when Check vendor records finishes");
      // Arrow keys in the list don't move between tasks
      boxes[2].focus();
      await userEvent.keyboard("{ArrowDown}");
      expect(document.activeElement).toBe(boxes[2]);
      await userEvent.keyboard("{Escape}");
      await settle();
      expect(el.open).toBe(true);
      expect(row(el, "vendors").querySelector(".ui-rnw__channels")).toBeNull();
      await expect.poll(() => document.activeElement).toBe(bell(el, "vendors"));
      el.tasks = TASKS.map((t) => (t.id === "vendors" ? { ...t, status: "done", ended: NOW } : t));
      await settle();
      expect(notices).toEqual([{ id: "vendors", status: "done", task: el.tasks[0], channels: ["Email", "Push"] }]);
      // Every channel off is not watching
      el.tasks = TASKS;
      await settle();
      bell(el, "vendors")!.click();
      await settle();
      for (const x of row(el, "vendors").querySelectorAll<HTMLInputElement>(".ui-rnw__channels input:checked")) {
        x.click();
        await settle();
      }
      expect(el.notify).toEqual([]);
      expect(el.notifyVia).toEqual({});
    });

    test("the wrapper: watched tasks survive a re-render uncontrolled, stay put controlled; onNotify", async () => {
      const host = document.createElement("div");
      document.body.append(host);
      const root = createRoot(host);
      const calls: unknown[] = [];
      const render = (n: number, tasks = TASKS) =>
        root.render(
          React.createElement("div", null,
            React.createElement(RunningNow, { title: `Free ${n}`, tasks, now: NOW, defaultOpen: true, notifiable: true, onNotifyChange: (next) => calls.push(["free", next]), onNotify: (t, st) => calls.push(["done", t.id, st]) }),
            React.createElement(RunningNow, { tasks, now: NOW, notifiable: true, notify: ["draft"], onNotifyChange: (next) => calls.push(["held", next]) }),
          ),
        );
      await act(async () => render(0));
      await settle();
      const [free, held] = [...host.querySelectorAll<TcRunningNow>("tc-running-now")];
      bell(free, "vendors")!.click();
      await act(async () => settle());
      await act(async () => render(1));
      await settle();
      expect(free.notify).toEqual(["vendors"]);
      await act(async () => render(2, TASKS.map((t) => (t.id === "vendors" ? { ...t, status: "done" as const } : t))));
      await settle();
      pill(held).click();
      await act(async () => settle());
      bell(held, "classify")!.click();
      await act(async () => settle());
      expect(held.notify).toEqual(["draft"]);
      expect(bell(held, "classify")!.getAttribute("aria-pressed")).toBe("false");
      expect(calls).toEqual([["free", ["vendors"]], ["done", "vendors", "done"], ["held", ["draft", "classify"]]]);
      await act(async () => root.unmount());
    });
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look, with the panel open (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10; color-scheme: dark; padding: 8px" : "padding: 8px"}>
        <tc-running-now .tasks=${TASKS} .now=${NOW}></tc-running-now>
        <tc-running-now look="clean" .tasks=${TASKS} .now=${NOW}></tc-running-now>
        <tc-running-now .tasks=${[]}></tc-running-now>
        <tc-running-now notifiable .notify=${["vendors"]} .tasks=${TASKS} .now=${NOW}></tc-running-now>
        <tc-running-now look="clean" notifiable .notifyChannels=${["In app", "Email"]} .notifyVia=${{ vendors: ["Email"] }} .notify=${["vendors"]} .tasks=${TASKS} .now=${NOW}></tc-running-now>
      </div>`);
      const [std, clean] = [...wrap.querySelectorAll<TcRunningNow>("tc-running-now")];
      await openPanel(clean);
      await finish(wrap);
      let result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      clean.open = false;
      await settle();
      await openPanel(std);
      await finish(wrap);
      result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      // With bells, and a channel list open
      const [, , , bells, chans] = [...wrap.querySelectorAll<TcRunningNow>("tc-running-now")];
      for (const [shown, hidden] of [
        [bells, std],
        [chans, bells],
      ] as const) {
        hidden.open = false;
        await settle();
        await openPanel(shown);
      }
      chans.querySelector<HTMLButtonElement>('.ui-rnw__row[data-id="vendors"] .ui-rnw__bell')!.click();
      await settle();
      await finish(wrap);
      result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
