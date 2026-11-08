/*
 * <tc-session-panel> in real browsers: sections left out when empty, folding, rows that open elsewhere, inner events and
 * state kept in step, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/session-panel";
import type { TcSessionPanel } from "../../src/elements/session-panel";
import { SessionPanel } from "../../src/elements/react/session-panel";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const TOOLS = [{ id: "files", label: "Files", icon: "M4 4h16v16H4z" }];
const WHERE = [
  { id: "repo", kind: "repo" as const, label: "institute/sample-tracker" },
  { id: "remote", kind: "computer" as const, label: "Remote control", toggle: true },
];
const CHANGES = [{ id: "a", title: "Alert on freezer gaps", repo: "sample-tracker", number: 214, state: "open" as const, additions: 3, deletions: 1 }];
const NOW = Date.UTC(2026, 10, 2, 15, 0);
const SUBAGENTS = [
  { id: "tests", name: "Write tests for notify()", status: "waiting" as const, activity: "awaiting command message", startedAt: NOW - 86_000 },
  { id: "lint", name: "Lint sweep", status: "done" as const, endedAt: NOW - 20_000 },
];

const full = (look = "standard") =>
  fixture<TcSessionPanel>(html`<tc-session-panel look=${look} .tools=${TOOLS} .environment=${WHERE} .context=${0.17} connectors="3 to reconnect" outputs="51" .subagents=${SUBAGENTS} .now=${NOW} .changes=${CHANGES} background="4 running"></tc-session-panel>`);
const section = (el: Element, name: string) => el.querySelector<HTMLElement>(`[data-section="${name}"]`)!;
const head = (el: Element, name: string) => section(el, name).querySelector<HTMLButtonElement>(".ui-pnc__button")!;

describe("tc-session-panel", () => {
  for (const look of ["standard", "clean"]) {
    test(`draws every section in ${look}`, async () => {
      const el = await full(look);
      expect(el.getAttribute("data-ui")).toBe("ssp");
      expect(el.getAttribute("data-look")).toBe(look);
      expect(el.querySelector('[role="toolbar"]')).not.toBeNull();
      for (const name of ["environment", "context", "connectors", "outputs", "subagents", "changes", "background"]) expect(section(el, name), name).not.toBeNull();
      expect(section(el, "connectors").textContent).toContain("3 to reconnect");
      expect(el.querySelector('[role="meter"]')?.getAttribute("aria-valuenow")).toBeTruthy();
      expect(el.textContent).toContain("institute/sample-tracker");
      expect(el.textContent).toContain("Alert on freezer gaps");
    });
  }

  test("leaves out a section with nothing to show", async () => {
    const el = await fixture<TcSessionPanel>(html`<tc-session-panel outputs="2"></tc-session-panel>`);
    expect(el.querySelectorAll("[data-section]").length).toBe(1);
    expect(el.querySelector('[role="toolbar"]')).toBeNull();
    expect(section(el, "outputs")).not.toBeNull();
  });

  test("folds a section, keeping its contents, and says so", async () => {
    const el = await full();
    const seen: unknown[] = [];
    el.addEventListener("tc-sections-change", (e) => seen.push((e as CustomEvent).detail));
    expect(head(el, "changes").getAttribute("aria-expanded")).toBe("true");
    head(el, "changes").click();
    await settle(el);
    expect(seen).toEqual([{ sections: ["environment", "subagents"], section: "changes", expanded: false }]);
    expect(el.sections).toEqual(["environment", "subagents"]);
    await expect.poll(() => head(el, "changes").getAttribute("aria-expanded")).toBe("false");
    head(el, "changes").click();
    await settle(el);
    await expect.poll(() => head(el, "changes").getAttribute("aria-expanded")).toBe("true");
    expect(el.textContent).toContain("Alert on freezer gaps");
  });

  test("a prevented fold stays as it was", async () => {
    const el = await full();
    el.addEventListener("tc-sections-change", (e) => e.preventDefault());
    head(el, "environment").click();
    await settle(el);
    expect(el.sections).toContain("environment");
    expect(head(el, "environment").getAttribute("aria-expanded")).toBe("true");
  });

  test("a row opens elsewhere, as tc-section-open and not tc-open", async () => {
    const el = await full();
    const opened: unknown[] = [];
    let plain = 0;
    el.addEventListener("tc-section-open", (e) => opened.push((e as CustomEvent).detail));
    el.addEventListener("tc-open", () => plain++);
    head(el, "outputs").click();
    head(el, "context").click();
    expect(opened).toEqual([{ section: "outputs" }, { section: "context" }]);
    expect(plain).toBe(0);
  });

  test("a change's own tc-open reaches the page", async () => {
    const el = await full();
    const opened: string[] = [];
    el.addEventListener("tc-open", (e) => opened.push((e as CustomEvent).detail.id));
    section(el, "changes").querySelector<HTMLElement>("[data-ui='chl'] button")!.click();
    expect(opened).toEqual(["a"]);
  });

  test("a tool and a switch keep their state, unless prevented", async () => {
    const el = await full();
    el.querySelector<HTMLButtonElement>('[role="toolbar"] button')!.click();
    await expect.poll(() => el.tool).toBe("files");
    const toggle = section(el, "environment").querySelector<HTMLElement>("[data-ui='enl'] [role='switch']")!;
    toggle.click();
    await expect.poll(() => el.toggles.remote).toBe(true);
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener("tc-toggles-change", stop);
    section(el, "environment").querySelector<HTMLElement>("[data-ui='enl'] [role='switch']")!.click();
    await settle(el);
    expect(el.toggles.remote).toBe(true);
  });

  test("new data reaches sections, after folding too", async () => {
    const el = await full();
    head(el, "changes").click();
    await settle(el);
    head(el, "changes").click();
    el.changes = [{ id: "b", title: "Second change", repo: "sample-tracker", state: "draft" }];
    await settle(el);
    await expect.poll(() => el.textContent).toContain("Second change");
  });

  test("Subagents: open by default, a bare list inside, the active count as its value, and the panel's clock", async () => {
    const el = await full();
    expect(head(el, "subagents").getAttribute("aria-expanded")).toBe("true");
    const value = () => section(el, "subagents").querySelector(".ui-pnc__value")?.textContent?.trim();
    expect(value()).toBe("1 active");
    const list = section(el, "subagents").querySelector("tc-subagent-list")!;
    expect(list.hasAttribute("bare")).toBe(true);
    expect(list.querySelector("h3")).toBeNull();
    expect([...list.querySelectorAll(".ui-sba__time")].map((t) => t.textContent)).toEqual(["1m 26s", "just now"]);
    el.labels = { subagentsActive: "{count} läuft" };
    await settle(el);
    expect(value()).toBe("1 läuft");
    el.subagents = SUBAGENTS.map((a) => ({ ...a, status: "done" as const, endedAt: NOW }));
    await settle(el);
    expect(value()).toBe("2");
  });

  test("choosing a subagent fires tc-subagent-change, never tc-selected-change at the panel; preventDefault keeps the old one", async () => {
    const el = await full();
    const heard: string[] = [];
    el.addEventListener("tc-selected-change", () => heard.push("selected"));
    el.addEventListener("tc-subagent-change", (e) => heard.push(`subagent:${(e as CustomEvent).detail.subagent}:${(e as CustomEvent).detail.agent.name}`));
    const rows = () => [...section(el, "subagents").querySelectorAll<HTMLButtonElement>(".ui-sba__row")];
    rows()[1].click();
    await settle(el);
    expect(heard).toEqual(["subagent:lint:Lint sweep"]);
    expect(el.subagent).toBe("lint");
    expect(rows()[1].getAttribute("aria-current")).toBe("true");
    el.addEventListener("tc-subagent-change", (e) => e.preventDefault());
    rows()[0].click();
    await settle(el);
    expect(el.subagent).toBe("lint");
    expect(rows()[0].getAttribute("aria-current")).toBe("false");
  });

  test("React: onSubagentChange hears the choice and onToolChange doesn't", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const tools: (string | null)[] = [];
    const agents: string[] = [];
    await act(async () =>
      root.render(
        React.createElement(SessionPanel, { tools: TOOLS, subagents: SUBAGENTS, now: NOW, onToolChange: (t) => void tools.push(t), onSubagentChange: (id, a) => void agents.push(`${id}:${a?.name}`) }),
      ),
    );
    const el = host.querySelector("tc-session-panel") as TcSessionPanel;
    await settle(el);
    await act(async () => section(el, "subagents").querySelector<HTMLButtonElement>(".ui-sba__row")!.click());
    await settle(el);
    expect(agents).toEqual(["tests:Write tests for notify()"]);
    expect(tools).toEqual([]);
    expect(el.subagent).toBe("tests");
    await act(async () => root.unmount());
    host.remove();
  });

  test("React: uncontrolled survives a re-render, and controlled stays until the parent changes it", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const uncontrolled = (n: number) => React.createElement(SessionPanel, { key: "u", outputs: String(n), environment: WHERE });
    await act(async () => root.render(uncontrolled(1)));
    const el = host.querySelector("tc-session-panel") as TcSessionPanel;
    await settle(el);
    await act(async () => head(el, "environment").click());
    await act(async () => root.render(uncontrolled(2)));
    expect(el.sections).not.toContain("environment");
    const heard: string[][] = [];
    await act(async () => root.render(React.createElement(SessionPanel, { key: "c", sections: ["environment"], environment: WHERE, onSectionsChange: (s) => heard.push(s) })));
    const held = host.querySelector("tc-session-panel") as TcSessionPanel;
    await settle(held);
    await act(async () => head(held, "environment").click());
    expect(heard).toEqual([[]]);
    expect(held.sections).toEqual(["environment"]);
    await act(async () => root.unmount());
    host.remove();
  });

  test("React: a tool from the rail and a switch from the list reach the page – the parts' events are the panel's own", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const tools: (string | null)[] = [];
    const toggles: Record<string, boolean>[] = [];
    await act(async () =>
      root.render(React.createElement(SessionPanel, { tools: TOOLS, environment: WHERE, onToolChange: (t) => void tools.push(t), onTogglesChange: (t) => void toggles.push(t) })),
    );
    const el = host.querySelector("tc-session-panel") as TcSessionPanel;
    await settle(el);
    await act(async () => el.querySelector<HTMLButtonElement>('.ui-irl__button[data-id="files"]')!.click());
    await expect.poll(() => el.tool).toBe("files");
    expect(tools).toEqual(["files"]);
    await act(async () => el.querySelector<HTMLElement>('[role="switch"]')!.click());
    await expect.poll(() => el.toggles.remote).toBe(true);
    expect(toggles).toEqual([{ remote: true }]);
    await act(async () => root.unmount());
    host.remove();
  });

  for (const look of ["standard", "clean"]) {
    for (const dark of [false, true]) {
      test(`axe: ${look}, ${dark ? "dark" : "light"}`, async () => {
        document.documentElement.classList.toggle("dark", dark);
        document.documentElement.style.colorScheme = dark ? "dark" : "light";
        try {
          const el = await full(look);
          await finish(el);
          const result = await axe.run(el);
          expect(result.violations.map((v) => v.id)).toEqual([]);
        } finally {
          document.documentElement.classList.remove("dark");
          document.documentElement.style.colorScheme = "";
        }
      });
    }
  }
});
