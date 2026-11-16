import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-agent-crew> – a lead agent and its sub-agents as one live tree of cards, where every agent stays on screen.
 * Each card says who the agent is, what it does right now (or that it's resting), how full its context is – in words
 * and a bar – the tools it works with, and the last thing it was handed. When one agent hands work to another, a
 * light runs along the connector between them and the card it reaches lights up for a moment; with reduced motion
 * the card only lights up. Choosing a card opens its detail under the tree – task, model, usage and tools – with a
 * note to steer it and Pause or Resume. Several projects' crews can be passed; a row of tabs switches between them.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 * Wide, the lead sits over its sub-agents side by side, each one's own helpers hanging below it; narrow, every level
 * is an indented list.
 *
 *   <tc-agent-crew .projects=${[{ id: "grant", name: "Library grant", lead, handoffs }]}></tc-agent-crew>
 *
 * Keyboard. The agents' names are one tab stop: the arrow keys move through the crew in reading order, Home and End
 * go to the ends, Enter or Space opens the agent. In the detail, Escape closes it and focus returns to the card.
 * The project tabs are a tablist: ← and → move and choose.
 */

/** What an agent is doing */
export type CrewAgentStatus = "working" | "resting" | "waiting" | "paused" | "failed" | "done";
/** One agent of the crew; sub-agents nest in `children` */
export type CrewAgent = {
  id: string;
  name: string;
  /** Its job in the crew – "Researcher" */
  role?: string;
  status: CrewAgentStatus;
  /** What it does right now – "Reading the 2025 census tables"; resting agents can leave it out */
  doing?: string;
  /** How full its context window is, 0–1 */
  context?: number;
  /** The tools it works with – "Web search", "Sheets" */
  tools?: string[];
  /** The last thing it was handed, when no handoff in `handoffs` says so */
  handed?: string;
  /** What it was asked to do, in the detail */
  task?: string;
  /** The model it runs on, in the detail */
  model?: string;
  /** Tokens used so far, in the detail */
  tokens?: number;
  /** What it has cost so far, in the detail */
  cost?: number;
  children?: CrewAgent[];
};
/** Work passed from one agent to another, oldest first; a new one runs a light along the connector */
export type CrewHandoff = { id: string; from: string; to: string; what: string };
/** One project's crew */
export type CrewProject = { id: string; name: string; lead: CrewAgent; handoffs?: CrewHandoff[] };
/** tc-project-change: the chosen project's id */
export type AgentCrewProjectChange = { project: string; item: CrewProject };
/** tc-opened-change: the agent whose detail is open, or null */
export type AgentCrewOpenedChange = { opened: string | null; agent: CrewAgent | null };
/** tc-steer: a note for an agent */
export type AgentCrewSteer = { agent: CrewAgent; note: string };
/** tc-pause and tc-resume */
export type AgentCrewAgentEvent = { agent: CrewAgent };
/** The words it uses, to translate or reword */
export type AgentCrewLabels = Record<CrewAgentStatus, string> & {
  /** "{percent}% of context" */
  context: string;
  handed: string;
  noTools: string;
  projects: string;
  task: string;
  model: string;
  usage: string;
  tools: string;
  steer: string;
  steerPlaceholder: string;
  pause: string;
  resume: string;
  close: string;
  /** Announced when work is handed over: {from}, {to}, {what} */
  handoff: string;
  /** The header's count: "{count} working" */
  workingCount: string;
  empty: string;
};

export const defaultAgentCrewLabels: AgentCrewLabels = {
  working: "Working",
  workingCount: "{count} working",
  resting: "Resting",
  waiting: "Needs you",
  paused: "Paused",
  failed: "Failed",
  done: "Done",
  context: "{percent}% of context",
  handed: "Last handed",
  noTools: "No tools",
  projects: "Projects",
  task: "Task",
  model: "Model",
  usage: "Usage",
  tools: "Tools",
  steer: "Steer",
  steerPlaceholder: "Tell it what to do differently",
  pause: "Pause",
  resume: "Resume",
  close: "Close",
  handoff: "{from} handed {to}: {what}",
  empty: "No agents yet",
};

const walk = (a: CrewAgent): CrewAgent[] => [a, ...(a.children ?? []).flatMap(walk)];
const reducedMotion = () => !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
const dollars = (n: number) => `$${n.toFixed(2)}`;
/** How long the card a handoff reaches stays lit, and how long the light takes along the connector */
const LIT = 1400;
const RUN = 900;

/* Lucide "users" (ISC – lucide.dev) */
const headIcon = svg`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>`;
/* Status marks: Lucide check, pause, triangle-alert, clock (ISC – lucide.dev); working is a plain arc, resting a dot */
const MARKS: Record<CrewAgentStatus, TemplateResult> = {
  working: svg`<circle cx="12" cy="12" r="8.5" stroke-opacity="0.3"></circle><path d="M12 3.5A8.5 8.5 0 0 1 20.5 12"></path>`,
  resting: svg`<circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"></circle>`,
  waiting: svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>`,
  paused: svg`<rect x="6" y="5" width="4" height="14" rx="1"></rect><rect x="14" y="5" width="4" height="14" rx="1"></rect>`,
  failed: svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4M12 17h.01"></path>`,
  done: svg`<path d="M20 6 9 17l-5-5"></path>`,
};

type Link = { id: string; from: string; to: string; d: string };
type Light = { key: string; d: string; reverse: boolean };

let instances = 0;

/**
 * A lead agent and its sub-agents as one live tree of cards – what each does now, its context, tools and last handoff.
 * @tag tc-agent-crew
 * @fires tc-project-change - A project tab was chosen ({ project, item }: AgentCrewProjectChange); cancelable – prevented, `project` stays as it was
 * @fires tc-opened-change - An agent's detail was opened or closed ({ opened, agent }: AgentCrewOpenedChange); cancelable – prevented, `opened` stays as it was
 * @fires tc-steer - A note to steer an agent was sent ({ agent, note }: AgentCrewSteer); cancelable – prevented, the note stays in the field
 * @fires tc-pause - Pause was pressed for an agent ({ agent }: AgentCrewAgentEvent)
 * @fires tc-resume - Resume was pressed for an agent ({ agent }: AgentCrewAgentEvent)
 */
export class TcAgentCrew extends TcElement {
  static override ui = "crew";

  /** The heading; empty leaves the header out */
  @property() accessor heading = "Crew";
  /** One crew per project; with more than one, tabs switch between them */
  @property({ attribute: false }) accessor projects: CrewProject[] = [];
  /** The shown project's id – the first when unset. Changed by the tabs unless tc-project-change is prevented */
  @property() accessor project: string | null = null;
  /** The agent whose detail is open, or null. Changed by the cards unless tc-opened-change is prevented */
  @property() accessor opened: string | null = null;
  /** Formats costs in the detail – defaults to dollars, "$0.42" */
  @property({ attribute: false }) accessor formatCost: (amount: number) => string = dollars;
  /** The words it uses, merged over the defaults */
  @property({ attribute: false }) accessor labels: Partial<AgentCrewLabels> = {};

  /** @internal Side by side (wide) or an indented list */
  @state() accessor wide = true;
  /** @internal The connectors, as measured */
  @state() accessor links: Link[] = [];
  /** @internal Lights running along connectors */
  @state() accessor lights: Light[] = [];
  /** @internal Cards lit up by a handoff */
  @state() accessor lit: string[] = [];
  /** @internal The card that holds the tab stop */
  @state() accessor focusId: string | null = null;
  /** @internal What the status region says */
  @state() accessor said = "";
  /** @internal The steering note being written */
  @state() accessor note = "";

  private readonly uid = `tc-crew${++instances}`;
  private ro?: ResizeObserver;
  private seen = new Map<string, Set<string>>();
  private timers = new Set<number>();
  private started = new Set<string>();

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.ro?.disconnect();
    this.ro = undefined;
    this.timers.forEach((t) => window.clearTimeout(t));
    this.timers.clear();
  }

  private word(key: keyof AgentCrewLabels, vars: Record<string, string> = {}) {
    const text = this.labels[key] ?? defaultAgentCrewLabels[key];
    return text.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
  }

  /** The project shown */
  get current(): CrewProject | undefined {
    return this.projects.find((p) => p.id === this.project) ?? this.projects[0];
  }

  private get agents() {
    const p = this.current;
    return p ? walk(p.lead) : [];
  }

  /** The last thing handed to an agent: the newest handoff to it, else its own `handed` */
  private handedTo(a: CrewAgent) {
    const h = [...(this.current?.handoffs ?? [])].reverse().find((x) => x.to === a.id);
    if (!h) return a.handed;
    const from = this.agents.find((x) => x.id === h.from)?.name;
    return from ? `${h.what} · ${from}` : h.what;
  }

  /* ---------- Choosing ---------- */

  private chooseProject(p: CrewProject) {
    if (p.id === this.current?.id) return;
    if (!this.emit<AgentCrewProjectChange>("tc-project-change", { project: p.id, item: p }, { cancelable: true })) return;
    this.project = p.id;
  }

  private setOpened(id: string | null) {
    if (id === this.opened) return;
    const agent = id ? (this.agents.find((a) => a.id === id) ?? null) : null;
    if (!this.emit<AgentCrewOpenedChange>("tc-opened-change", { opened: id, agent }, { cancelable: true })) return;
    this.opened = id;
    this.note = "";
  }

  private toggle(a: CrewAgent) {
    this.focusId = a.id;
    this.setOpened(this.opened === a.id ? null : a.id);
  }

  private focusCard(id: string) {
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-crew__open[data-id="${CSS.escape(id)}"]`)?.focus());
  }

  private close() {
    const id = this.opened;
    this.setOpened(null);
    if (id && this.opened === null) this.focusCard(id);
  }

  private steer(a: CrewAgent) {
    const note = this.note.trim();
    if (!note) return;
    if (!this.emit<AgentCrewSteer>("tc-steer", { agent: a, note }, { cancelable: true })) return;
    this.note = "";
  }

  private onCardKey = (e: KeyboardEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>(".ui-crew__open");
    if (!btn || e.altKey || e.metaKey || e.ctrlKey) return;
    const list = this.agents;
    const i = list.findIndex((a) => a.id === btn.dataset.id);
    const to = { ArrowUp: i - 1, ArrowLeft: i - 1, ArrowDown: i + 1, ArrowRight: i + 1, Home: 0, End: list.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    const next = list[Math.max(0, Math.min(list.length - 1, to))];
    if (!next) return;
    this.focusId = next.id;
    this.focusCard(next.id);
  };

  private onTabKey = (e: KeyboardEvent) => {
    const list = this.projects;
    const i = list.findIndex((p) => p.id === this.current?.id);
    const to = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: list.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    const next = list[(to + list.length) % list.length];
    if (!next) return;
    this.chooseProject(next);
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-crew__tab[data-id="${CSS.escape(this.current?.id ?? "")}"]`)?.focus());
  };

  private onDetailKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    e.stopPropagation();
    this.close();
  };

  /* ---------- Connectors and handoff lights ---------- */

  private measure = () => {
    const box = this.querySelector<HTMLElement>(".ui-crew__tree");
    const lead = this.current?.lead;
    if (!box || !lead) {
      if (this.links.length) this.links = [];
      return;
    }
    const outer = box.getBoundingClientRect();
    const at = (id: string) => {
      const el = this.querySelector<HTMLElement>(`.ui-crew__node[data-id="${CSS.escape(id)}"]`);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left - outer.left, y: r.top - outer.top, w: r.width, h: r.height };
    };
    const row = box.querySelector<HTMLElement>(":scope > .ui-crew__level");
    const rowTop = row ? row.getBoundingClientRect().top - outer.top : 0;
    const R = 8;
    const next: Link[] = [];
    const visit = (a: CrewAgent, depth: number) => {
      const p = at(a.id);
      for (const c of a.children ?? []) {
        const q = at(c.id);
        if (p && q) {
          let d: string;
          if (this.wide && depth === 0) {
            const x1 = p.x + p.w / 2;
            const y1 = p.y + p.h;
            const x2 = q.x + q.w / 2;
            const mid = Math.round(y1 + (rowTop - y1) / 2);
            const dx = x2 - x1;
            const r = Math.max(0, Math.min(R, Math.abs(dx) / 2, (q.y - mid) / 2));
            const sg = Math.sign(dx);
            d = Math.abs(dx) < 2 ? `M${x1} ${y1}V${q.y}` : `M${x1} ${y1}V${mid - r}Q${x1} ${mid} ${x1 + sg * r} ${mid}H${x2 - sg * r}Q${x2} ${mid} ${x2} ${mid + r}V${q.y}`;
          } else {
            const x1 = p.x + 20;
            const y1 = p.y + p.h;
            const y2 = q.y + 22;
            const r = Math.max(0, Math.min(R, (q.x - x1) / 2, (y2 - y1) / 2));
            d = q.x - x1 < 2 ? `M${x1} ${y1}V${q.y}` : `M${x1} ${y1}V${y2 - r}Q${x1} ${y2} ${x1 + r} ${y2}H${q.x}`;
          }
          next.push({ id: `${a.id}>${c.id}`, from: a.id, to: c.id, d: d.replace(/\d+\.\d+/g, (n) => String(Math.round(Number(n) * 10) / 10)) });
        }
        visit(c, depth + 1);
      }
    };
    visit(lead, 0);
    if (JSON.stringify(next) !== JSON.stringify(this.links)) this.links = next;
  };

  private later(fn: () => void, ms: number) {
    const t = window.setTimeout(() => {
      this.timers.delete(t);
      fn();
    }, ms);
    this.timers.add(t);
  }

  private light(id: string) {
    this.lit = [...this.lit.filter((x) => x !== id), id];
    this.later(() => (this.lit = this.lit.filter((x) => x !== id)), LIT);
  }

  /** New handoffs since the last update: a light along the connector, then the card it reaches lights up */
  private runHandoffs() {
    const p = this.current;
    if (!p) return;
    const known = this.seen.get(p.id);
    const all = p.handoffs ?? [];
    this.seen.set(p.id, new Set(all.map((h) => h.id)));
    if (!known) return;
    const fresh = all.filter((h) => !known.has(h.id));
    if (!fresh.length) return;
    const byId = new Map(this.agents.map((a) => [a.id, a]));
    const said: string[] = [];
    for (const h of fresh) {
      const from = byId.get(h.from);
      const to = byId.get(h.to);
      if (!from || !to) continue;
      said.push(this.word("handoff", { from: from.name, to: to.name, what: h.what }));
      const link = this.links.find((l) => (l.from === h.from && l.to === h.to) || (l.from === h.to && l.to === h.from));
      if (!link || reducedMotion()) {
        this.light(h.to);
        continue;
      }
      const key = `${h.id}`;
      this.lights = [...this.lights, { key, d: link.d, reverse: link.from !== h.from }];
      this.later(() => {
        this.lights = this.lights.filter((l) => l.key !== key);
        this.light(h.to);
      }, RUN);
    }
    if (said.length) this.said = this.said === said.join(". ") ? `${said.join(". ")} ` : said.join(". ");
  }

  /* ---------- Update ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.toggleAttribute("data-wide", this.wide);
    const ids = this.agents.map((a) => a.id);
    if (!this.focusId || !ids.includes(this.focusId)) this.focusId = this.opened && ids.includes(this.opened) ? this.opened : (ids[0] ?? null);
  }

  protected override firstUpdated() {
    const scroll = this.querySelector<HTMLElement>(".ui-crew__scroll");
    if (!scroll || typeof ResizeObserver === "undefined") return;
    this.ro = new ResizeObserver(() => {
      this.wide = scroll.clientWidth >= 560;
      this.measure();
    });
    this.ro.observe(scroll);
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!changed.has("links") || changed.size > 1) this.measure();
    if (changed.has("projects") || changed.has("project")) this.runHandoffs();
    // Each light runs once along its connector
    for (const el of this.querySelectorAll<SVGPathElement>(".ui-crew__light")) {
      const key = el.dataset.key!;
      if (this.started.has(key)) continue;
      this.started.add(key);
      const reverse = el.dataset.reverse === "true";
      if (typeof el.animate === "function")
        el.animate([{ strokeDashoffset: reverse ? -100 : 16 }, { strokeDashoffset: reverse ? 16 : -100 }], { duration: RUN, easing: "linear", fill: "forwards" });
    }
  }

  /* ---------- Render ---------- */

  private renderNode(a: CrewAgent, depth: number): TemplateResult {
    const kids = a.children ?? [];
    return html`<li class=${depth === 1 ? "ui-crew__col" : "ui-crew__item"}>
      ${this.renderCard(a)}
      ${kids.length ? html`<ul class="ui-crew__below">${repeat(kids, (k) => k.id, (k) => this.renderNode(k, depth + 1))}</ul>` : nothing}
    </li>`;
  }

  private renderCard(a: CrewAgent) {
    const pct = a.context === undefined ? null : Math.round(Math.max(0, Math.min(1, a.context)) * 100);
    const tone = pct === null ? "" : pct >= 90 ? "danger" : pct >= 75 ? "warning" : "";
    const tools = a.tools ?? [];
    const handed = this.handedTo(a);
    const open = this.opened === a.id;
    const status = this.word(a.status);
    return html`<div
      class="ui-crew__node"
      data-id=${a.id}
      data-status=${a.status}
      ?data-lit=${this.lit.includes(a.id)}
      ?data-open=${open}
      @click=${(e: MouseEvent) => {
        if (!(e.target as HTMLElement).closest(".ui-crew__open")) this.toggle(a);
      }}
    >
      <div class="ui-crew__card">
        <div class="ui-crew__top">
          <span class="ui-crew__avatar" aria-hidden="true">${initials(a.name)}</span>
          <span class="ui-crew__who">
            <button
              type="button"
              class="ui-crew__open"
              data-id=${a.id}
              tabindex=${this.focusId === a.id ? "0" : "-1"}
              aria-expanded=${open ? "true" : "false"}
              aria-controls=${`${this.uid}-detail`}
              @click=${() => this.toggle(a)}
              @focus=${() => (this.focusId = a.id)}
            >${a.name}<span class="tc-sr-only">, ${status}</span></button>
            ${a.role ? html`<span class="ui-crew__role">${a.role}</span>` : nothing}
          </span>
          <span class="ui-crew__status" data-status=${a.status} aria-hidden="true"
            ><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${MARKS[a.status]}</svg>${status}</span
          >
        </div>
        <p class="ui-crew__doing" ?data-resting=${!a.doing}>${a.doing ?? this.word("resting")}</p>
        ${pct === null
          ? nothing
          : html`<div
              class="ui-crew__context"
              data-tone=${tone}
              .role=${"meter"}
              aria-label=${`${a.name}: ${this.word("context", { percent: String(pct) })}`}
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow=${pct}
            >
              <span class="ui-crew__context-words">${this.word("context", { percent: String(pct) })}</span>
              <span class="ui-crew__bar" aria-hidden="true"><span class="ui-crew__fill" style=${styleMap({ "--tc-crew-fill": String(pct / 100) })}></span></span>
            </div>`}
        ${tools.length
          ? html`<ul class="ui-crew__tools" aria-label=${`${a.name}: ${this.word("tools")}`}>
              ${tools.slice(0, 3).map((t) => html`<li class="ui-crew__tool">${t}</li>`)}${tools.length > 3 ? html`<li class="ui-crew__tool" data-more>+${tools.length - 3}</li>` : nothing}
            </ul>`
          : nothing}
        ${handed ? html`<p class="ui-crew__handed"><span class="ui-crew__handed-label">${this.word("handed")}</span> ${handed}</p>` : nothing}
      </div>
    </div>`;
  }

  private renderDetail() {
    const a = this.opened ? this.agents.find((x) => x.id === this.opened) : undefined;
    if (!a) return html`<div id=${`${this.uid}-detail`} hidden></div>`;
    const canPause = a.status === "working" || a.status === "waiting" || a.status === "resting";
    const canResume = a.status === "paused";
    const usage = [a.tokens !== undefined ? `${a.tokens.toLocaleString("en-US")} tokens` : "", a.cost !== undefined ? this.formatCost(a.cost) : ""].filter(Boolean).join(" · ");
    const noteId = `${this.uid}-note`;
    return html`<section class="ui-crew__detail" id=${`${this.uid}-detail`} aria-labelledby=${`${this.uid}-detail-title`} @keydown=${this.onDetailKey}>
      <div class="ui-crew__detail-head">
        <p class="ui-crew__detail-title" id=${`${this.uid}-detail-title`}>${a.name}${a.role ? html`<span class="ui-crew__role"> · ${a.role}</span>` : nothing}</p>
        <button type="button" class="ui-crew__btn ui-crew__btn--ghost" @click=${() => this.close()}>${this.word("close")}</button>
      </div>
      <dl class="ui-crew__facts">
        ${a.task ? html`<div><dt>${this.word("task")}</dt><dd>${a.task}</dd></div>` : nothing}
        ${a.model ? html`<div><dt>${this.word("model")}</dt><dd>${a.model}</dd></div>` : nothing}
        ${usage ? html`<div><dt>${this.word("usage")}</dt><dd>${usage}</dd></div>` : nothing}
        <div><dt>${this.word("tools")}</dt><dd>${a.tools?.length ? a.tools.join(", ") : this.word("noTools")}</dd></div>
      </dl>
      <form
        class="ui-crew__steer"
        @submit=${(e: Event) => {
          e.preventDefault();
          this.steer(a);
        }}
      >
        <label class="tc-sr-only" for=${noteId}>${this.word("steer")} ${a.name}</label>
        <input
          id=${noteId}
          class="ui-crew__input"
          .value=${this.note}
          placeholder=${this.word("steerPlaceholder")}
          @input=${(e: Event) => (this.note = (e.target as HTMLInputElement).value)}
        />
        <button type="submit" class="ui-crew__btn ui-crew__btn--primary" ?disabled=${!this.note.trim()}>${this.word("steer")}</button>
        ${canPause
          ? html`<button type="button" class="ui-crew__btn" @click=${() => this.emit<AgentCrewAgentEvent>("tc-pause", { agent: a })}>${this.word("pause")}</button>`
          : canResume
            ? html`<button type="button" class="ui-crew__btn" @click=${() => this.emit<AgentCrewAgentEvent>("tc-resume", { agent: a })}>${this.word("resume")}</button>`
            : nothing}
      </form>
    </section>`;
  }

  protected override render() {
    const p = this.current;
    const agents = this.agents;
    const working = agents.filter((a) => a.status === "working").length;
    const aside = agents.length ? html`<span class="ui-crew__count">${this.word("workingCount", { count: String(working) })}</span>` : nothing;
    const lead = p?.lead;
    const tabs =
      this.projects.length > 1
        ? html`<div class="ui-crew__tabs" role="tablist" aria-label=${this.word("projects")} @keydown=${this.onTabKey}>
            ${this.projects.map(
              (x) =>
                html`<button
                  type="button"
                  role="tab"
                  class="ui-crew__tab"
                  data-id=${x.id}
                  aria-selected=${x.id === p?.id ? "true" : "false"}
                  tabindex=${x.id === p?.id ? "0" : "-1"}
                  @click=${() => this.chooseProject(x)}
                >${x.name}</button>`,
            )}
          </div>`
        : nothing;
    return html`${this.heading ? cardHead({ icon: headIcon, title: this.heading, id: `${this.uid}-title`, aside }) : nothing}
      <div class="ui-crew__body">
        ${tabs}
        <div class="ui-crew__scroll">
          ${lead
            ? html`<div class="ui-crew__tree" @keydown=${this.onCardKey}>
                <svg class="ui-crew__links" aria-hidden="true">
                  ${this.links.map((l) => svg`<path class="ui-crew__link" d=${l.d}></path>`)}
                  ${repeat(
                    this.lights,
                    (l) => l.key,
                    (l) => svg`<path class="ui-crew__light" data-key=${l.key} data-reverse=${String(l.reverse)} d=${l.d} pathLength="100"></path>`,
                  )}
                </svg>
                <div class="ui-crew__lead">${this.renderCard(lead)}</div>
                ${lead.children?.length
                  ? html`<ul class="ui-crew__level" aria-label=${lead.name}>${repeat(lead.children, (k) => k.id, (k) => this.renderNode(k, 1))}</ul>`
                  : nothing}
              </div>`
            : html`<p class="ui-crew__empty">${this.word("empty")}</p>`}
        </div>
        ${this.renderDetail()}
      </div>
      <span class="tc-sr-only" role="status">${this.said}</span>`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="crew"] {
  --tc-crew-card-w: 220px;
  --tc-crew-indent: var(--tc-space-6);
  --tc-crew-link: var(--tc-accent-solid);
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="crew"] {
  --tc-crew-card-w: 214px;
  --tc-crew-indent: var(--tc-space-7);
  --tc-crew-link: var(--tc-accent-solid);
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="crew"] *, [data-ui="crew"] *::before, [data-ui="crew"] *::after { box-sizing: border-box; }
:where([data-ui="crew"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="crew"] button:focus-visible, [data-ui="crew"] input:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-ui="crew"]) :is(p, ul, dl, dd) { margin: 0; padding: 0; }
[data-ui="crew"] ul { list-style: none; }
.ui-crew__count { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-crew__body { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-crew__body { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-3); min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-crew__body { padding-top: 0; }
/* ----- Project tabs ----- */
.ui-crew__tabs { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-crew__tab { min-height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-crew__tab:hover { background: var(--tc-fill-hover); }
.ui-crew__tab[aria-selected="true"] { background: var(--tc-fill-selected); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
/* ----- The tree ----- */
.ui-crew__scroll { min-width: 0; overflow-x: auto; }
.ui-crew__tree { position: relative; display: grid; justify-items: center; width: max-content; min-width: 100%; padding: var(--tc-space-1); }
[data-ui="crew"]:not([data-wide]) .ui-crew__tree { justify-items: stretch; width: 100%; }
.ui-crew__links { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.ui-crew__link { fill: none; stroke: var(--tc-crew-link); stroke-opacity: 0.55; stroke-width: 1.5; stroke-linecap: round; }
.ui-crew__light { fill: none; stroke: var(--tc-crew-link); stroke-width: 3; stroke-linecap: round; stroke-dasharray: 16 200; stroke-dashoffset: 16; filter: drop-shadow(0 0 3px var(--tc-crew-link)); }
.ui-crew__lead { position: relative; z-index: 1; }
.ui-crew__level { position: relative; z-index: 1; display: flex; align-items: flex-start; justify-content: center; gap: var(--tc-space-3); margin-top: var(--tc-space-10); }
.ui-crew__col { display: grid; align-content: start; gap: var(--tc-space-3); width: calc(var(--tc-crew-card-w) + var(--tc-crew-indent)); }
.ui-crew__col > .ui-crew__node { margin-right: var(--tc-crew-indent); }
.ui-crew__below { display: grid; gap: var(--tc-space-3); padding-left: var(--tc-crew-indent); }
.ui-crew__item { display: grid; gap: var(--tc-space-3); }
.ui-crew__node { width: var(--tc-crew-card-w); }
[data-ui="crew"]:not([data-wide]) .ui-crew__level { display: grid; gap: var(--tc-space-3); margin-top: var(--tc-space-3); padding-left: var(--tc-crew-indent); }
[data-ui="crew"]:not([data-wide]) .ui-crew__col { width: auto; }
[data-ui="crew"]:not([data-wide]) .ui-crew__col > .ui-crew__node { margin-right: 0; }
[data-ui="crew"]:not([data-wide]) .ui-crew__node { width: auto; }
/* ----- One agent ----- */
.ui-crew__node { position: relative; border-radius: var(--tc-card-radius); cursor: pointer; transition: box-shadow var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-crew__card { display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-2-5); border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); transition: box-shadow var(--tc-duration-moderate) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-crew__card { background: var(--tc-surface-raised); }
.ui-crew__node:hover .ui-crew__card { box-shadow: var(--tc-card-shadow-hover); }
.ui-crew__node[data-open] .ui-crew__card { box-shadow: 0 0 0 1.5px var(--tc-accent-solid), var(--tc-card-shadow); }
/* A handoff reaches the card: it glows for a moment */
.ui-crew__node[data-lit] .ui-crew__card { box-shadow: 0 0 0 2px var(--tc-crew-link), var(--tc-shadow-raised-hover); background: var(--tc-accent-subtle); }
.ui-crew__node:has(.ui-crew__open:focus-visible) { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="crew"] .ui-crew__open:focus-visible { outline: none; }
.ui-crew__top { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: var(--tc-space-2); }
.ui-crew__avatar { display: grid; place-items: center; width: var(--tc-space-7); height: var(--tc-space-7); border-radius: var(--tc-radius-full); background: var(--tc-fill-default); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-semibold); }
.ui-crew__who { display: grid; min-width: 0; }
.ui-crew__open { overflow: hidden; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
.ui-crew__role { overflow: hidden; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
.ui-crew__status { display: inline-flex; align-items: center; gap: var(--tc-space-1); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); white-space: nowrap; }
.ui-crew__status svg { width: var(--tc-space-3); height: var(--tc-space-3); flex: none; }
.ui-crew__status[data-status="working"] { color: var(--tc-accent-text); }
.ui-crew__status[data-status="working"] svg { animation: ui-crew-spin var(--tc-duration-shimmer) linear infinite; }
.ui-crew__status[data-status="waiting"] { color: var(--tc-status-warning-fg); }
.ui-crew__status[data-status="failed"] { color: var(--tc-status-danger-fg); }
.ui-crew__status[data-status="done"] { color: var(--tc-status-success-fg); }
.ui-crew__doing { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-crew__doing[data-resting] { color: var(--tc-text-muted); }
.ui-crew__context { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: var(--tc-space-2); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-crew__bar { display: block; height: var(--tc-space-1); overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-border-default); }
.ui-crew__fill { display: block; width: calc(var(--tc-crew-fill) * 100%); height: 100%; border-radius: inherit; background: var(--tc-accent-solid); transition: width var(--tc-duration-base) var(--tc-ease-move); }
.ui-crew__context[data-tone="warning"] { color: var(--tc-status-warning-fg); }
.ui-crew__context[data-tone="warning"] .ui-crew__fill { background: var(--tc-status-warning-solid); }
.ui-crew__context[data-tone="danger"] { color: var(--tc-status-danger-fg); }
.ui-crew__context[data-tone="danger"] .ui-crew__fill { background: var(--tc-status-danger-solid); }
.ui-crew__tools { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-crew__tool { padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-badge); background: var(--tc-fill-default); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-normal); }
.ui-crew__handed { overflow: hidden; color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
.ui-crew__handed-label { color: var(--tc-text-muted); }
.ui-crew__empty { padding: var(--tc-space-4); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); text-align: center; }
/* ----- Detail ----- */
.ui-crew__detail { display: grid; gap: var(--tc-space-2-5); padding: var(--tc-space-3); border-radius: var(--tc-card-radius); background: var(--tc-surface-sunken); animation: ui-crew-in var(--tc-duration-base) var(--tc-ease-move) both; }
.ui-crew__detail-head { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2); }
.ui-crew__detail-title { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-crew__facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: var(--tc-space-2) var(--tc-space-4); font-size: var(--tc-font-size-sm); }
.ui-crew__facts dt { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-crew__facts dd { color: var(--tc-text-primary); }
.ui-crew__steer { display: flex; flex-wrap: wrap; gap: var(--tc-space-2); }
.ui-crew__input { flex: 1 1 200px; min-width: 0; height: var(--tc-control-h-md); padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-field-font-size); }
.ui-crew__input::placeholder { color: var(--tc-text-placeholder); }
[data-ui="crew"] .ui-crew__input:focus-visible { outline: none; box-shadow: var(--tc-field-shadow-focus); }
.ui-crew__btn { display: inline-flex; align-items: center; height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; }
.ui-crew__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-crew__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-crew__btn--primary:hover { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-crew__btn--ghost { height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); background: none; box-shadow: none; color: var(--tc-action-ghost-fg); }
.ui-crew__btn--ghost:hover { background: var(--tc-action-ghost-bg-hover); box-shadow: none; }
.ui-crew__btn:disabled { opacity: 0.5; cursor: not-allowed; }
@keyframes ui-crew-spin { to { transform: rotate(360deg); } }
@keyframes ui-crew-in { from { opacity: 0; transform: translateY(-4px); } }
@media (forced-colors: active) {
  .ui-crew__link, .ui-crew__light { stroke: CanvasText; }
  .ui-crew__fill { background: CanvasText; }
  .ui-crew__node[data-lit] .ui-crew__card, .ui-crew__node[data-open] .ui-crew__card { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-crew__status[data-status="working"] svg, .ui-crew__detail { animation: none; }
  .ui-crew__node, .ui-crew__card, .ui-crew__fill { transition: none; }
}
`;
}

if (!customElements.get("tc-agent-crew")) customElements.define("tc-agent-crew", TcAgentCrew);

declare global {
  interface HTMLElementTagNameMap {
    "tc-agent-crew": TcAgentCrew;
  }
}
