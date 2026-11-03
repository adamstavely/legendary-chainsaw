/*
 * <tc-process-list> in real browsers: rows, statuses and words, uptime, meters, the row buttons and their events,
 * selection and keyboard, the empty state, narrow width, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/process-list";
import { formatUptime, type ProcessItem, type TcProcessList } from "../../src/elements/process-list";
import { ProcessList } from "../../src/elements/react/process-list";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = Date.UTC(2026, 9, 12, 9, 30);
const min = 60_000;
const PROCS: ProcessItem[] = [
  { id: "web", name: "web", command: "vite --port 5173", status: "running", port: 5173, pid: 41822, started: NOW - 47 * min, cpu: 6, memory: 182_000_000, lastLine: "\x1b[32m✓\x1b[0m page reload" },
  { id: "api", name: "api", command: "node server.mjs", status: "starting", port: 8080, url: "http://127.0.0.1:8080/health", started: new Date(NOW - 65 * min).toISOString() },
  { id: "tests", name: "tests", command: "vitest --watch", status: "stopped" },
  { id: "docs", name: "docs", status: "crashed", port: 6006, exitCode: 1, lastLine: "Error: Cannot find module" },
];
const make = (look: "standard" | "clean" = "standard") => fixture<TcProcessList>(html`<tc-process-list look=${look} .processes=${PROCS} .now=${NOW}></tc-process-list>`);
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-rproc__row[data-id="${id}"]`)!;
const btn = (el: Element, id: string, act: string) => row(el, id).querySelector<HTMLButtonElement>(`[data-act="${act}"]`)!;

describe("tc-process-list", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a named list of rows with one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("rproc");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector("ul")!.getAttribute("aria-label")).toBe("Processes");
      expect(el.querySelectorAll(".ui-rproc__row")).toHaveLength(4);
      const stops = [...el.querySelectorAll<HTMLElement>(".ui-rproc__list [data-at]")].filter((b) => b.tabIndex === 0);
      expect(stops).toHaveLength(1);
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Processes");
    });
  }

  test("each row says its status in words, with the exit code for a crash", async () => {
    const el = await make();
    expect(row(el, "web").querySelector(".ui-rproc__status")!.textContent!.trim()).toBe("Running");
    expect(row(el, "api").querySelector(".ui-rproc__status")!.textContent!.trim()).toBe("Starting");
    expect(row(el, "tests").querySelector(".ui-rproc__status")!.textContent!.trim()).toBe("Stopped");
    expect(row(el, "docs").querySelector(".ui-rproc__status")!.textContent!.trim()).toBe("Crashed · exit 1");
    expect(row(el, "docs").dataset.status).toBe("crashed");
    expect(getComputedStyle(row(el, "docs")).backgroundColor).not.toBe(getComputedStyle(row(el, "tests")).backgroundColor);
    // Renamed words
    el.labels = { running: "Läuft" };
    await settle();
    expect(row(el, "web").querySelector(".ui-rproc__status")!.textContent!.trim()).toBe("Läuft");
    expect(el.querySelector(".ui-rproc__count")!.textContent).toContain("2 läuft");
  });

  test("uptime from started and now; ISO or ms; escape codes dropped from the last line", async () => {
    const el = await make();
    expect(row(el, "web").querySelector(".ui-rproc__up")!.textContent).toBe("up 47m");
    expect(row(el, "api").querySelector(".ui-rproc__up")!.textContent).toBe("up 1h 5m");
    expect(row(el, "tests").querySelector(".ui-rproc__up")).toBeNull();
    expect(row(el, "web").querySelector(".ui-rproc__last")!.textContent).toBe("✓ page reload");
    expect(formatUptime(12_000)).toBe("12s");
    expect(formatUptime(3 * 3600_000)).toBe("3h");
    expect(formatUptime(50 * 3600_000)).toBe("2d 2h");
  });

  test("meters and port links: the port opens its url", async () => {
    const el = await make();
    const meters = row(el, "web").querySelector(".ui-rproc__meters")!.textContent!.replace(/\s+/g, " ").trim();
    expect(meters).toContain("6% CPU");
    expect(meters).toMatch(/174 MB memory/);
    expect(row(el, "tests").querySelector(".ui-rproc__port")).toBeNull();
    const seen: unknown[] = [];
    el.addEventListener("tc-open", (e) => seen.push((e as CustomEvent).detail));
    const web = row(el, "web").querySelector<HTMLElement>(".ui-rproc__port")!;
    expect(web.textContent).toBe("localhost:5173");
    web.click();
    const api = row(el, "api").querySelector<HTMLElement>(".ui-rproc__port")!;
    expect(api.textContent).toBe("localhost:8080");
    api.click();
    expect(seen).toEqual([
      { id: "web", process: PROCS[0], url: "http://localhost:5173" },
      { id: "api", process: PROCS[1], url: "http://127.0.0.1:8080/health" },
    ]);
  });

  test("Stop for live rows, Start for the rest; Restart and View output; each fires with its process", async () => {
    const el = await make();
    expect(btn(el, "web", "stop")).not.toBeNull();
    expect(btn(el, "api", "stop")).not.toBeNull();
    expect(btn(el, "tests", "start")).not.toBeNull();
    expect(btn(el, "docs", "start")).not.toBeNull();
    // Named by their words and the process
    expect(btn(el, "web", "stop").textContent!.replace(/\s+/g, " ").trim()).toBe("Stop web");
    const seen: string[] = [];
    for (const name of ["tc-stop", "tc-start", "tc-restart", "tc-logs"]) el.addEventListener(name, (e) => seen.push(`${name}:${(e as CustomEvent).detail.id}`));
    btn(el, "web", "stop").click();
    btn(el, "docs", "start").click();
    btn(el, "api", "restart").click();
    btn(el, "tests", "logs").click();
    expect(seen).toEqual(["tc-stop:web", "tc-start:docs", "tc-restart:api", "tc-logs:tests"]);
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Restart api");
    // Cancelable: nothing is announced when prevented
    el.addEventListener("tc-stop", (e) => e.preventDefault());
    btn(el, "web", "stop").click();
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Restart api");
  });

  test("Stop all shows while something runs; the count says how many", async () => {
    const el = await make();
    expect(el.querySelector(".ui-rproc__count")!.textContent).toBe("2 running");
    let fired = 0;
    el.addEventListener("tc-stop-all", () => fired++);
    el.querySelector<HTMLElement>('[data-head="stop-all"]')!.click();
    expect(fired).toBe(1);
    el.processes = PROCS.map((p) => ({ ...p, status: "stopped" as const }));
    await settle();
    expect(el.querySelector('[data-head="stop-all"]')).toBeNull();
    expect(el.querySelector(".ui-rproc__count")!.textContent).toBe("0 running");
  });

  test("pressing a row selects it; preventing keeps the selection", async () => {
    const el = await make();
    const seen: unknown[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent).detail.selected));
    row(el, "api").querySelector<HTMLElement>(".ui-rproc__main")!.click();
    await settle();
    expect(seen).toEqual(["api"]);
    expect(el.selected).toBe("api");
    expect(row(el, "api").querySelector(".ui-rproc__main")!.getAttribute("aria-current")).toBe("true");
    expect(row(el, "api").hasAttribute("data-selected")).toBe(true);
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    row(el, "web").querySelector<HTMLElement>(".ui-rproc__main")!.click();
    await settle();
    expect(el.selected).toBe("api");
  });

  test("keyboard: ↑ ↓ between rows, ← → between a row's buttons, Home / End", async () => {
    const el = await make();
    const first = el.querySelector<HTMLElement>('[data-at="0:0"]')!;
    first.focus();
    const key = (k: string) => (document.activeElement as HTMLElement).dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
    key("ArrowDown");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.at).toBe("1:0");
    key("ArrowRight");
    await expect.poll(() => (document.activeElement as HTMLElement).classList.contains("ui-rproc__port")).toBe(true);
    key("ArrowRight");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.act).toBe("stop");
    key("End");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.at).toBe("3:2");
    // The stopped row has no port, so the same column is its Restart
    key("ArrowUp");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.at).toBe("2:2");
    expect((document.activeElement as HTMLElement).dataset.act).toBe("restart");
    key("Home");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.at).toBe("0:2");
    expect([...el.querySelectorAll<HTMLElement>(".ui-rproc__list [data-at]")].filter((b) => b.tabIndex === 0)).toHaveLength(1);
  });

  test("empty: says so and offers to start a command", async () => {
    const el = await fixture<TcProcessList>(html`<tc-process-list></tc-process-list>`);
    expect(el.querySelector(".ui-rproc__empty")!.textContent).toContain("Nothing running");
    let fired = 0;
    el.addEventListener("tc-create", () => fired++);
    el.querySelector<HTMLElement>(".ui-rproc__create")!.click();
    expect(fired).toBe(1);
  });

  test("narrow: the command and meters hide, buttons keep their names, nothing overflows", async () => {
    const el = await make();
    el.style.width = "300px";
    await settle();
    await expect.poll(() => getComputedStyle(row(el, "web").querySelector(".ui-rproc__cmd")!).display).toBe("none");
    expect(getComputedStyle(row(el, "web").querySelector(".ui-rproc__meters")!).display).toBe("none");
    const word = btn(el, "web", "stop").querySelector<HTMLElement>(".ui-rproc__word")!;
    expect(word.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    expect(btn(el, "web", "stop").textContent).toContain("Stop");
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
  });

  test("its own clock runs when there's no now, and stops when disconnected", async () => {
    const el = await fixture<TcProcessList>(html`<tc-process-list .processes=${[{ id: "a", name: "a", status: "running", started: Date.now() - 5000 }]}></tc-process-list>`);
    await expect.poll(() => el.querySelector(".ui-rproc__up")?.textContent ?? "").toMatch(/^up \d+s$/);
    el.remove();
  });

  test("React: uncontrolled survives a re-render, controlled waits for the parent", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    const root = createRoot(wrap);
    const render = (props: Partial<React.ComponentProps<typeof ProcessList>>) => act(async () => root.render(React.createElement(ProcessList, { processes: PROCS, now: NOW, ...props })));
    await render({ defaultSelected: "web" });
    const el = wrap.querySelector<TcProcessList>("tc-process-list")!;
    await settle();
    expect(el.selected).toBe("web");
    await act(async () => row(el, "docs").querySelector<HTMLElement>(".ui-rproc__main")!.click());
    await render({ defaultSelected: "web", description: "Again" });
    await settle();
    expect(el.selected).toBe("docs");
    const seen: unknown[] = [];
    await render({ selected: "web", onSelectedChange: (s, p) => void seen.push([s, p?.name]) });
    await settle();
    await act(async () => row(el, "api").querySelector<HTMLElement>(".ui-rproc__main")!.click());
    await settle();
    expect(seen).toEqual([["api", "api"]]);
    await expect.poll(() => el.selected).toBe("web");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = document.body.appendChild(document.createElement("div"));
      wrap.style.colorScheme = theme;
      wrap.innerHTML = `<tc-process-list look="standard" heading="A"></tc-process-list><tc-process-list look="clean" heading="B"></tc-process-list><tc-process-list look="clean"></tc-process-list>`;
      wrap.querySelectorAll<TcProcessList>("tc-process-list").forEach((el, i) => {
        if (i < 2) {
          el.processes = PROCS;
          el.now = NOW;
          el.selected = "web";
        }
      });
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
