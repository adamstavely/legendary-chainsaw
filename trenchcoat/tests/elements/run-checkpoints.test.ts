/*
 * <tc-run-checkpoints> in real browsers: the host and both looks, picking a step (listbox keyboard, pointer, strip),
 * what a pick shows, controlled use, restoring (sync, async, failing), focus, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/run-checkpoints";
import type { RunCheckpoint, TcRunCheckpoints } from "../../src/elements/run-checkpoints";
import { RunCheckpoints } from "../../src/elements/react/run-checkpoints";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const LIST: RunCheckpoint[] = [
  { id: "a", title: "Read the schema", tool: "read_files", at: 0, tokens: 1000, cost: 0.01, captured: [{ label: "Conversation", value: "2 messages" }] },
  { id: "b", title: "Write the migration", at: 9_000, files: ["db/0042.sql"], tokens: 2000, cost: 0.02 },
  { id: "c", title: "Run the tests", detail: "3 failed", at: 41_000, status: "failed", files: ["tests/a.py", "db/0042.sql"], tokens: 500, cost: 0.005 },
  { id: "d", title: "No snapshot here", at: 50_000, restorable: false },
  { id: "e", title: "Open a pull request", at: 66_000, status: "active", tokens: 300 },
];
const looks = ["standard", "clean"] as const;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const plain = (s: string | null | undefined) => (s ?? "").replace(/ /g, " ").trim();
const make = (attrs: { look?: string; selected?: string | null; status?: string } = {}) =>
  fixture<TcRunCheckpoints>(
    html`<tc-run-checkpoints look=${attrs.look ?? "standard"} heading="Move billing to Postgres" status=${attrs.status ?? "running"} .elapsed=${70_000} .selected=${attrs.selected ?? null} .checkpoints=${LIST}></tc-run-checkpoints>`,
  );
const rows = (el: Element) => [...el.querySelectorAll<HTMLElement>('[role="option"]')];
const key = async (target: Element, k: string) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  await settle();
};
const status = (el: Element) => plain(el.querySelector('[role="status"]')!.textContent);

describe("tc-run-checkpoints", () => {
  for (const look of looks) {
    test(`${look}: the host is the root and a region named by its heading`, async () => {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("rcp");
      expect(el.dataset.look).toBe(look);
      expect(el.dataset.status).toBe("running");
      expect(el.getAttribute("role")).toBe("region");
      expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Move billing to Postgres");
      expect(el.querySelector(".ui-rcp__state-label")!.textContent).toBe("Checkpoints · 5");
      expect(plain(el.querySelector(".ui-rcp__pill")!.textContent)).toBe("Live run");
      // Standard: the foot sits on the tray, below the card · Clean: the card's last row
      const foot = el.querySelector(".ui-rcp__foot")!;
      expect(foot.parentElement!.classList.contains("ui-rcp__card")).toBe(look === "clean");
    });
  }

  test("rows: numbers, a spinner while running, the failed mark, times and the no-snapshot step", async () => {
    const el = await make();
    const r = rows(el);
    expect(r.map((x) => x.querySelector(".ui-rcp__time")!.textContent)).toEqual(["0:00", "0:09", "0:41", "No snapshot", "1:06"]);
    expect(r[0].querySelector(".ui-rcp__num")!.textContent).toBe("1");
    expect(r[2].querySelector(".ui-rcp__mark")).not.toBeNull();
    expect(r[4].querySelector(".ui-rcp__spinner")).not.toBeNull();
    expect(r[4].getAttribute("aria-current")).toBe("step");
    expect(r[3].getAttribute("aria-disabled")).toBe("true");
    expect(r[1].querySelector(".ui-rcp__tool")).toBeNull();
    expect(r[0].querySelector(".ui-rcp__tool")!.textContent).toBe("read_files");
    // The strip: a dot per checkpoint at its time, a now mark while running, the run's length on the right
    const dots = [...el.querySelectorAll<HTMLElement>(".ui-rcp__dot")];
    expect(dots.map((d) => d.style.getPropertyValue("--x"))).toEqual(["0%", `${(9 / 70) * 100}%`, `${(41 / 70) * 100}%`, `${(50 / 70) * 100}%`, `${(66 / 70) * 100}%`]);
    expect(el.querySelector(".ui-rcp__now")).not.toBeNull();
    expect(el.querySelector(".ui-rcp__ticks")!.textContent).toBe("0:001:10");
    el.status = "done";
    await settle();
    expect(el.querySelector(".ui-rcp__now")).toBeNull();
    expect(plain(el.querySelector(".ui-rcp__pill")!.textContent)).toBe("Done run");
  });

  test("a pick shows what the checkpoint captured and what going back discards", async () => {
    const el = await make({ selected: "b" });
    expect(el.hasAttribute("data-picked")).toBe(true);
    const r = rows(el);
    expect(r[1].getAttribute("aria-selected")).toBe("true");
    expect(r.filter((x) => x.hasAttribute("data-discard")).map((x) => x.dataset.id)).toEqual(["c", "d", "e"]);
    const panel = el.querySelector(".ui-rcp__panel")!;
    expect(panel.hasAttribute("data-open")).toBe(true);
    const [kept, drop] = [...panel.querySelectorAll(".ui-rcp__col")];
    expect(kept.querySelector("h4")!.textContent).toBe("Captured before step 2");
    // No captures given: the workspace, from the files earlier steps changed
    expect(plain(kept.querySelector("li")!.textContent)).toBe("WorkspaceAs the run found it");
    const lines = [...drop.querySelectorAll("li")].map((li) => plain(li.textContent));
    expect(lines).toEqual(["Steps 2–54 steps", "File changes0042.sql, a.py", "Spent2.8k tokens · $0.03", "Live runStops, restarts"]);
    expect(plain(el.querySelector(".ui-rcp__foot .ui-rcp__hint")!.textContent)).toBe("Runs again from 0:09·discards 4 steps");
    expect(el.querySelector(".ui-rcp__btn")!.textContent).toContain("Go back to step 2");
    // The strip cuts at the pick
    expect(el.querySelector<HTMLElement>(".ui-rcp__strip")!.style.getPropertyValue("--tc-run-checkpoints-cut")).toBe(`${(9 / 70) * 100}%`);
    expect(el.querySelector(".ui-rcp__at")!.textContent).toBe("0:09");
    el.selected = "a";
    await settle();
    expect(plain(el.querySelector(".ui-rcp__col li")!.textContent)).toBe("Conversation2 messages");
    el.selected = null;
    await settle();
    expect(panel.hasAttribute("data-open")).toBe(false);
    expect((panel as HTMLElement).inert).toBe(true);
    expect(el.querySelector(".ui-rcp__btn")).toBeNull();
  });

  test("clicking a row or a dot picks it and fires a cancelable tc-selected-change; steps without a snapshot can't be picked", async () => {
    const el = await make();
    const seen: (string | null)[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent).detail.selected));
    rows(el)[2].click();
    await settle();
    expect(el.selected).toBe("c");
    el.querySelectorAll<HTMLElement>(".ui-rcp__dot")[0].click();
    await settle();
    expect(el.selected).toBe("a");
    rows(el)[3].click();
    await settle();
    expect(el.selected).toBe("a");
    expect(seen).toEqual(["c", "a"]);
    expect(status(el)).toBe("Step 1 picked. Going back discards 5 steps and 2 file changes.");
  });

  test("controlled: preventDefault keeps the pick until the app passes it back", async () => {
    const el = await make({ selected: "a" });
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    rows(el)[1].click();
    await settle();
    expect(el.selected).toBe("a");
    expect(rows(el)[0].getAttribute("aria-selected")).toBe("true");
    el.selected = "b";
    await settle();
    expect(rows(el)[1].getAttribute("aria-selected")).toBe("true");
  });

  test("keyboard: one tab stop; arrows, Home and End move and pick; the pick skips steps without a snapshot; Escape clears; Enter moves to the note", async () => {
    const el = await make();
    let r = rows(el);
    // Nothing picked: the newest restorable step takes Tab
    expect(r.filter((x) => x.tabIndex === 0).map((x) => x.dataset.id)).toEqual(["e"]);
    r[4].focus();
    await key(r[4], "ArrowUp");
    r = rows(el);
    expect(document.activeElement).toBe(r[3]);
    expect(el.selected).toBeNull();
    await key(r[3], "ArrowUp");
    expect(document.activeElement).toBe(r[2]);
    expect(el.selected).toBe("c");
    expect(rows(el).filter((x) => x.tabIndex === 0).map((x) => x.dataset.id)).toEqual(["c"]);
    await key(r[2], "Home");
    expect(document.activeElement).toBe(r[0]);
    expect(el.selected).toBe("a");
    await key(r[0], "End");
    expect(el.selected).toBe("e");
    await key(r[4], "Escape");
    expect(el.selected).toBeNull();
    expect(document.activeElement).toBe(r[4]);
    await key(r[4], "Enter");
    expect(el.selected).toBe("e");
    expect(document.activeElement).toBe(el.querySelector(".ui-rcp__note input"));
    // Escape in the note goes back to the row and keeps the pick
    await key(document.activeElement!, "Escape");
    expect(document.activeElement).toBe(rows(el)[4]);
    expect(el.selected).toBe("e");
  });

  test("going back fires tc-restore with the note and the discarded steps, then clears the pick; focus lands on the row", async () => {
    const el = await make({ selected: "c" });
    const restored: unknown[] = [];
    el.addEventListener("tc-restore", (e) => restored.push((e as CustomEvent).detail));
    const input = el.querySelector<HTMLInputElement>(".ui-rcp__note input")!;
    input.focus();
    input.value = "Fix the rounding, not the test";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await settle();
    expect(el.querySelector(".ui-rcp__btn")!.textContent).toContain("Go back to step 3");
    await key(input, "Enter");
    expect(restored).toEqual([{ checkpointId: "c", instruction: "Fix the rounding, not the test", discarded: ["c", "d", "e"] }]);
    expect(el.selected).toBeNull();
    expect(status(el)).toBe("Went back to step 3 with your note.");
    expect(document.activeElement).toBe(rows(el)[2]);
    // The note is cleared for the next pick
    el.selected = "b";
    await settle();
    expect(el.querySelector<HTMLInputElement>(".ui-rcp__note input")!.value).toBe("");
  });

  test("a restorer's promise: the button waits, a rejection says so and keeps the pick", async () => {
    const el = await make({ selected: "b" });
    let fail!: () => void;
    el.restorer = () => new Promise<void>((_, reject) => (fail = () => reject(new Error("nope"))));
    const btn = () => el.querySelector<HTMLButtonElement>(".ui-rcp__btn")!;
    btn().click();
    await settle();
    expect(btn().disabled).toBe(true);
    expect(btn().getAttribute("aria-busy")).toBe("true");
    fail();
    await wait(0);
    await settle();
    expect(btn().disabled).toBe(false);
    expect(el.querySelector('[role="alert"]')!.textContent).toBe("Couldn't go back – try again");
    expect(el.selected).toBe("b");
    let ok!: () => void;
    el.restorer = () => new Promise<void>((resolve) => (ok = resolve));
    btn().click();
    await settle();
    ok();
    await wait(0);
    await settle();
    expect(el.selected).toBeNull();
    expect(el.querySelector('[role="alert"]')).toBeNull();
  });

  test("a pick that disappears from the list closes the panel; an empty run says so", async () => {
    const el = await make({ selected: "e" });
    el.checkpoints = LIST.slice(0, 3);
    await settle();
    expect(el.querySelector(".ui-rcp__panel")!.hasAttribute("data-open")).toBe(false);
    el.checkpoints = [];
    await settle();
    expect(el.querySelector(".ui-rcp__empty")!.textContent).toBe("No checkpoints yet");
    expect(el.querySelector(".ui-rcp__strip")).toBeNull();
    expect(el.querySelector(".ui-rcp__hint")!.textContent).toBe("The agent saves a checkpoint before each step");
  });

  test("the wrapper: uncontrolled picks survive a parent re-render; callbacks fire; onRestore gets the discarded ids", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const picks: (string | null)[] = [];
    const restores: unknown[] = [];
    let rerender!: (n: number) => void;
    function App() {
      const [n, setN] = React.useState(0);
      rerender = setN;
      return React.createElement(RunCheckpoints, {
        title: `Run ${n}`,
        checkpoints: LIST,
        status: "running",
        onSelectedChange: (id) => picks.push(id),
        onRestore: (id, note, discarded) => void restores.push({ id, note, discarded }),
      });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-run-checkpoints")!;
    expect(el.querySelector("h3")!.textContent).toBe("Run 0");
    rows(el)[1].click();
    await act(async () => settle());
    await act(async () => rerender(1));
    await settle();
    expect(el.querySelector("h3")!.textContent).toBe("Run 1");
    expect(el.selected).toBe("b");
    expect(picks).toEqual(["b"]);
    el.querySelector<HTMLButtonElement>(".ui-rcp__btn")!.click();
    await act(async () => settle());
    expect(restores).toEqual([{ id: "b", note: "", discarded: ["b", "c", "d", "e"] }]);
    expect(el.selected).toBeNull();
    await act(async () => root.unmount());
  });

  test("the wrapper: controlled selected", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const picks: (string | null)[] = [];
    await act(async () => root.render(React.createElement(RunCheckpoints, { checkpoints: LIST, selected: "a", onSelectedChange: (id) => picks.push(id) })));
    await settle();
    const el = host.querySelector("tc-run-checkpoints")!;
    rows(el)[2].click();
    await act(async () => settle());
    expect(picks).toEqual(["c"]);
    expect(el.selected).toBe("a");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10; color-scheme: dark" : ""}>
        <tc-run-checkpoints heading="Standard" status="running" .elapsed=${70_000} .checkpoints=${LIST} selected="c"></tc-run-checkpoints>
        <tc-run-checkpoints look="clean" heading="Clean" status="done" .checkpoints=${LIST} selected="b"></tc-run-checkpoints>
        <tc-run-checkpoints look="clean" heading="Nothing picked" status="failed" .checkpoints=${LIST}></tc-run-checkpoints>
      </div>`);
      await wait(600);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
