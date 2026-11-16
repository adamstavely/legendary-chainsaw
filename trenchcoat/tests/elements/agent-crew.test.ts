/*
 * <tc-agent-crew> in real browsers: cards with status, doing, context, tools and last handoff; connectors; project
 * tabs; opening a card by click and keyboard with preventDefault; the detail (steer, pause, resume, Escape); handoff
 * lights and announcements; narrow layout; renamed labels; the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/agent-crew";
import type { AgentCrewOpenedChange, AgentCrewSteer, CrewProject, TcAgentCrew } from "../../src/elements/agent-crew";
import { AgentCrew } from "../../src/elements/react/agent-crew";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => cleanup());

const plain = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const GRANT: CrewProject = {
  id: "grant",
  name: "Library grant",
  lead: {
    id: "lead",
    name: "Lead",
    role: "Plans",
    status: "working",
    doing: "Merging",
    context: 0.48,
    tools: ["Docs"],
    task: "Write the application",
    model: "Atlas",
    tokens: 41200,
    cost: 0.62,
    children: [
      {
        id: "research",
        name: "Researcher",
        role: "Evidence",
        status: "working",
        doing: "Reading census tables",
        context: 0.81,
        tools: ["Web search", "Sheets", "PDF reader", "Notes"],
        children: [{ id: "facts", name: "Fact-checker", status: "resting", context: 0.12 }],
      },
      { id: "budget", name: "Budget", status: "waiting", doing: "Needs opening hours", context: 0.93, tools: ["Sheets"] },
      { id: "editor", name: "Editor", status: "paused", handed: "Writing guidance" },
    ],
  },
  handoffs: [{ id: "h1", from: "lead", to: "research", what: "Local need questions" }],
};
const REPORT: CrewProject = { id: "report", name: "Report", lead: { id: "r", name: "Solo", status: "done", doing: "Finished" } };

const make = (o: { look?: string; projects?: CrewProject[]; width?: number; opened?: string | null } = {}) =>
  fixture<TcAgentCrew>(
    html`<tc-agent-crew style=${`width: ${o.width ?? 900}px`} look=${o.look ?? "standard"} .projects=${o.projects ?? [GRANT]} .opened=${o.opened ?? null}></tc-agent-crew>`,
  );
const opens = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-crew__open")];
const card = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-crew__node[data-id="${id}"]`)!;

describe("tc-agent-crew", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: every agent as a card with status, doing, context, tools and what it was handed`, async () => {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("crew");
      expect(el.dataset.look).toBe(look);
      expect(plain(el.querySelector("h3")!.textContent)).toBe("Crew");
      expect(plain(el.querySelector(".ui-crew__count")!.textContent)).toBe("2 working");
      expect(opens(el).map((b) => plain(b.textContent))).toEqual([
        "Lead, Working",
        "Researcher, Working",
        "Fact-checker, Resting",
        "Budget, Needs you",
        "Editor, Paused",
      ]);
      const r = card(el, "research");
      expect(plain(r.querySelector(".ui-crew__doing")!.textContent)).toBe("Reading census tables");
      expect(plain(r.querySelector(".ui-crew__context-words")!.textContent)).toBe("81% of context");
      expect(r.querySelector(".ui-crew__context")!.getAttribute("data-tone")).toBe("warning");
      expect(card(el, "budget").querySelector(".ui-crew__context")!.getAttribute("data-tone")).toBe("danger");
      expect([...r.querySelectorAll(".ui-crew__tool")].map((t) => plain(t.textContent))).toEqual(["Web search", "Sheets", "PDF reader", "+1"]);
      // The newest handoff names what and from whom; otherwise the agent's own `handed`
      expect(plain(r.querySelector(".ui-crew__handed")!.textContent)).toBe("Last handed Local need questions · Lead");
      expect(plain(card(el, "editor").querySelector(".ui-crew__handed")!.textContent)).toBe("Last handed Writing guidance");
      // A resting agent without `doing` says so
      expect(plain(card(el, "facts").querySelector(".ui-crew__doing")!.textContent)).toBe("Resting");
      expect(card(el, "editor").querySelector(".ui-crew__context")).toBeNull();
    });
  }

  test("connectors join each agent to its sub-agents; wide puts the first level side by side", async () => {
    const el = await make();
    await expect.poll(() => el.querySelectorAll(".ui-crew__link").length).toBe(4);
    expect(el.hasAttribute("data-wide")).toBe(true);
    const tops = ["research", "budget", "editor"].map((id) => Math.round(card(el, id).getBoundingClientRect().top));
    expect(new Set(tops).size).toBe(1);
  });

  test("narrow: an indented list, every card full width", async () => {
    const el = await make({ width: 380 });
    await expect.poll(() => el.hasAttribute("data-wide")).toBe(false);
    const lead = card(el, "lead").getBoundingClientRect();
    const research = card(el, "research").getBoundingClientRect();
    expect(research.top).toBeGreaterThan(lead.bottom);
    expect(research.left).toBeGreaterThan(lead.left);
  });

  test("one tab stop; the arrow keys move in reading order, Home and End go to the ends", async () => {
    const el = await make();
    expect(opens(el).map((b) => b.tabIndex)).toEqual([0, -1, -1, -1, -1]);
    opens(el)[0].focus();
    await userEvent.keyboard("{ArrowDown}{ArrowRight}");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.id).toBe("facts");
    await userEvent.keyboard("{End}");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.id).toBe("editor");
    await userEvent.keyboard("{Home}{ArrowUp}");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.id).toBe("lead");
  });

  test("a card opens its detail by click or Enter; Escape closes it and focus returns; preventDefault keeps it shut", async () => {
    const el = await make();
    const seen: AgentCrewOpenedChange[] = [];
    el.addEventListener("tc-opened-change", (e) => seen.push((e as CustomEvent<AgentCrewOpenedChange>).detail));
    card(el, "lead").querySelector<HTMLElement>(".ui-crew__doing")!.click();
    await settle(el);
    expect(el.opened).toBe("lead");
    expect(opens(el)[0].getAttribute("aria-expanded")).toBe("true");
    const detail = el.querySelector(".ui-crew__detail")!;
    expect([...detail.querySelectorAll(".ui-crew__facts > div")].map((d) => [plain(d.querySelector("dt")!.textContent), plain(d.querySelector("dd")!.textContent)])).toEqual([
      ["Task", "Write the application"],
      ["Model", "Atlas"],
      ["Usage", "41,200 tokens · $0.62"],
      ["Tools", "Docs"],
    ]);
    detail.querySelector<HTMLInputElement>(".ui-crew__input")!.focus();
    await userEvent.keyboard("{Escape}");
    await settle(el);
    expect(el.opened).toBeNull();
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.id).toBe("lead");
    opens(el)[3].focus();
    await userEvent.keyboard("{Enter}");
    await settle(el);
    expect(el.opened).toBe("budget");
    expect(seen.map((d) => [d.opened, d.agent?.name ?? null])).toEqual([
      ["lead", "Lead"],
      [null, null],
      ["budget", "Budget"],
    ]);
    el.addEventListener("tc-opened-change", (e) => e.preventDefault());
    opens(el)[0].click();
    await settle(el);
    expect(el.opened).toBe("budget");
  });

  test("the detail steers, pauses and resumes; a prevented steer keeps the note", async () => {
    const el = await make({ opened: "research" });
    const steers: AgentCrewSteer[] = [];
    const paused: string[] = [];
    el.addEventListener("tc-steer", (e) => steers.push((e as CustomEvent<AgentCrewSteer>).detail));
    el.addEventListener("tc-pause", (e) => paused.push((e as CustomEvent<{ agent: { id: string } }>).detail.agent.id));
    const input = el.querySelector<HTMLInputElement>(".ui-crew__input")!;
    const steerBtn = () => el.querySelector<HTMLButtonElement>(".ui-crew__steer .ui-crew__btn--primary")!;
    expect(steerBtn().disabled).toBe(true);
    input.focus();
    await userEvent.keyboard("Use the 2025 tables{Enter}");
    await settle(el);
    expect(steers.map((s) => [s.agent.id, s.note])).toEqual([["research", "Use the 2025 tables"]]);
    expect(input.value).toBe("");
    el.addEventListener("tc-steer", (e) => e.preventDefault(), { once: true });
    await userEvent.keyboard("Keep this");
    steerBtn().click();
    await settle(el);
    expect(input.value).toBe("Keep this");
    const pause = [...el.querySelectorAll<HTMLButtonElement>(".ui-crew__steer .ui-crew__btn")].find((b) => plain(b.textContent) === "Pause")!;
    pause.click();
    expect(paused).toEqual(["research"]);
    el.opened = "editor";
    await settle(el);
    const resumes: string[] = [];
    el.addEventListener("tc-resume", (e) => resumes.push((e as CustomEvent<{ agent: { id: string } }>).detail.agent.id));
    [...el.querySelectorAll<HTMLButtonElement>(".ui-crew__steer .ui-crew__btn")].find((b) => plain(b.textContent) === "Resume")!.click();
    expect(resumes).toEqual(["editor"]);
  });

  test("a new handoff runs a light along the connector, lights the card it reaches and is announced", async () => {
    const el = await make();
    await expect.poll(() => el.querySelectorAll(".ui-crew__link").length).toBe(4);
    expect(el.querySelector(".ui-crew__light")).toBeNull();
    el.projects = [{ ...GRANT, handoffs: [...GRANT.handoffs!, { id: "h2", from: "research", to: "facts", what: "Figures to recheck" }] }];
    await settle(el);
    expect(plain(el.querySelector('[role="status"]')!.textContent)).toBe("Researcher handed Fact-checker: Figures to recheck");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) expect(el.querySelector(".ui-crew__light")).not.toBeNull();
    await expect.poll(() => card(el, "facts").hasAttribute("data-lit"), { timeout: 4000 }).toBe(true);
    expect(plain(card(el, "facts").querySelector(".ui-crew__handed")!.textContent)).toBe("Last handed Figures to recheck · Researcher");
    await expect.poll(() => card(el, "facts").hasAttribute("data-lit"), { timeout: 5000 }).toBe(false);
    expect(el.querySelector(".ui-crew__light")).toBeNull();
  });

  test("project tabs switch crews by click and arrow keys; preventDefault keeps the project", async () => {
    const el = await make({ projects: [GRANT, REPORT] });
    const tabs = () => [...el.querySelectorAll<HTMLButtonElement>(".ui-crew__tab")];
    expect(tabs().map((t) => [plain(t.textContent), t.getAttribute("aria-selected")])).toEqual([
      ["Library grant", "true"],
      ["Report", "false"],
    ]);
    tabs()[1].click();
    await settle(el);
    expect(el.project).toBe("report");
    expect(opens(el).map((b) => b.dataset.id)).toEqual(["r"]);
    tabs()[1].focus();
    await userEvent.keyboard("{ArrowRight}");
    await settle(el);
    expect(el.project).toBe("grant");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.id).toBe("grant");
    el.addEventListener("tc-project-change", (e) => e.preventDefault());
    tabs()[1].click();
    await settle(el);
    expect(el.project).toBe("grant");
  });

  test("no projects: the empty message; labels reword it", async () => {
    const el = await fixture<TcAgentCrew>(html`<tc-agent-crew .labels=${{ empty: "Keine Agenten" }}></tc-agent-crew>`);
    expect(plain(el.querySelector(".ui-crew__empty")!.textContent)).toBe("Keine Agenten");
    const de = await fixture<TcAgentCrew>(
      html`<tc-agent-crew .projects=${[GRANT]} .labels=${{ working: "Arbeitet", workingCount: "{count} aktiv", context: "{percent} % Kontext" }}></tc-agent-crew>`,
    );
    expect(plain(de.querySelector(".ui-crew__count")!.textContent)).toBe("2 aktiv");
    expect(plain(card(de, "lead").querySelector(".ui-crew__status")!.textContent)).toBe("Arbeitet");
    expect(plain(card(de, "lead").querySelector(".ui-crew__context-words")!.textContent)).toBe("48 % Kontext");
  });

  test("React: uncontrolled opening survives re-renders; controlled stays until the parent changes it", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: (string | null)[] = [];
    let rerender: (n: number) => void = () => {};
    function App({ controlled }: { controlled: boolean }) {
      const [, setN] = React.useState(0);
      rerender = setN;
      return React.createElement(AgentCrew, {
        projects: [GRANT],
        title: "Grant crew",
        ...(controlled ? { opened: "budget" } : { defaultOpened: "lead" }),
        onOpenedChange: (id) => seen.push(id),
      });
    }
    await act(async () => root.render(React.createElement(App, { controlled: false })));
    await settle();
    let el = host.querySelector<TcAgentCrew>("tc-agent-crew")!;
    expect(plain(el.querySelector("h3")!.textContent)).toBe("Grant crew");
    expect(el.opened).toBe("lead");
    await act(async () => opens(el)[1].click());
    await act(async () => rerender(1));
    await settle();
    expect(el.opened).toBe("research");
    await act(async () => root.render(React.createElement(App, { controlled: true })));
    await settle();
    el = host.querySelector<TcAgentCrew>("tc-agent-crew")!;
    expect(el.opened).toBe("budget");
    await act(async () => opens(el)[0].click());
    await settle();
    expect(el.opened).toBe("budget");
    expect(seen).toEqual(["research", "lead"]);
    await act(async () => root.unmount());
    host.remove();
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10; color-scheme: dark" : ""}>
        <tc-agent-crew style="width: 900px" .projects=${[GRANT, REPORT]} opened="research"></tc-agent-crew>
        <tc-agent-crew style="width: 380px" look="clean" .projects=${[GRANT]}></tc-agent-crew>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
