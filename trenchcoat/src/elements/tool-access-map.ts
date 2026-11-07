import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { initials } from "./internal/util";

/*
 * <tc-tool-access-map> – one agent in the middle and every tool it can reach in a ring around it: which ones it has
 * used, which failed, which it is calling right now, which it hasn't touched and which it has no access to. Each tool
 * says so in words – "Last call 520ms", "Failed", "Running", "Not used yet", "No access" – with how many calls it took.
 *   · a line joins the agent to every tool it used; a running call sends a pulse along it, a failed one turns it red;
 *     tools without access are dashed and have no line
 *   · open a tool for its calls, newest first, with their arguments and results, and replay any of them on its own
 *     (tc-replay, and `onReplay` – the button is busy while its promise is pending)
 *   · calls come per tool, or as one feed (`calls`, each naming the tool in `to`) – the shape tc-agent-graph takes, so
 *     one feed can drive both
 *   · the tools are one tab stop: the arrows go round the ring, Home / End to the ends, Enter or Space opens a tool,
 *     Escape closes it
 *   · the ring scales down to a minimum size, then the calls drop below it; narrower still, the tools become a list
 *   · with several `agents`, tabs at the top switch between them (tc-agent-id-change – the page swaps the data)
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-tool-access-map .agent=${{ name: "Data steward", status: "running" }} .tools=${[…]}></tc-tool-access-map>
 */

/** A hub with spokes: Lucide's "network" (ISC, lucide.dev) */
const mapIcon = svg`<rect x="16" y="16" width="6" height="6" rx="1"></rect><rect x="2" y="16" width="6" height="6" rx="1"></rect><rect x="9" y="2" width="6" height="6" rx="1"></rect><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"></path><path d="M12 12V8"></path>`;

/** "error" and "pending" are tc-agent-graph's words for "failed" and "running" */
export type ToolAccessCallStatus = "ok" | "failed" | "running" | "error" | "pending";
export type ToolAccessCall = {
  id: string;
  /** When it was made (epoch ms) */
  at: number;
  /** How long it took (ms) */
  ms?: number;
  /** "ok" by default */
  status?: ToolAccessCallStatus;
  /** What was asked, in a few words: "query: stations updated since May" */
  label?: string;
  /** The arguments – a string, or anything JSON can show */
  args?: unknown;
  /** What came back – a string, or anything JSON can show */
  result?: unknown;
};
/** A call in the shared feed: `to` names the tool; `from`, when given, must be the agent's id */
export type ToolAccessFeedCall = ToolAccessCall & { to: string; from?: string };
export type ToolAccessTool = {
  id: string;
  name: string;
  /** A shorter name for the ring, e.g. "Search" for "Web search" */
  short?: string;
  /** Its mark (an element, cloned) – defaults to the initials */
  icon?: Element;
  /** "none" when the agent may not use it – "allowed" by default */
  access?: "allowed" | "none";
  /** What it is, one line in its panel */
  detail?: string;
  calls?: ToolAccessCall[];
};
export type ToolAccessAgentStatus = "idle" | "running" | "waiting" | "done" | "failed";
export type ToolAccessAgent = {
  /** Matches `from` in the call feed */
  id?: string;
  name: string;
  /** The model it runs on */
  model?: string;
  status?: ToolAccessAgentStatus;
  /** What it's working on */
  task?: string;
  /** Its mark (an element, cloned) – defaults to the initials */
  icon?: Element;
};
export type ToolAccessAgentTab = { id: string; name: string };

/** Details of the events */
export type ToolAccessSelectedChange = { selected: string | null; tool: ToolAccessTool | null };
export type ToolAccessAgentIdChange = { agentId: string };
export type ToolAccessReplay = { tool: ToolAccessTool; call: ToolAccessCall };

export type ToolAccessState = "ok" | "failed" | "running" | "unused" | "none";

export const defaultToolAccessAgentLabels: Record<ToolAccessAgentStatus, string> = {
  idle: "Idle",
  running: "Running",
  waiting: "Needs you",
  done: "Done",
  failed: "Failed",
};

/* The ring's geometry, in px: its size range, a tool tile, the agent in the middle, and the panel beside it */
const RING_MIN = 320;
const RING_MAX = 500;
// The panel goes beside the ring only when the ring keeps this much room – a tighter ring cuts the tools' names
const RING_BESIDE = 440;
const TILE_W = 116;
// On a roomy ring the tiles widen so full names and "Last call 520ms" fit
const TILE_W_WIDE = 144;
const TILE_H = 64;
const PANEL_W = 300;
const GAP = 16;
const LIST_BELOW = 360;

const took = (ms: number) => (ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`);
const norm = (s: ToolAccessCallStatus | undefined): "ok" | "failed" | "running" => (s === "failed" || s === "error" ? "failed" : s === "running" || s === "pending" ? "running" : "ok");
const show = (v: unknown) => (typeof v === "string" ? v : JSON.stringify(v, null, 2));

type Row = { t: ToolAccessTool; calls: ToolAccessCall[]; st: ToolAccessState; word: string };

let uidCount = 0;


/*
 * Where the tiles go round the ring. Equal angles crowd the top and bottom, where neighbours sit side by side and need
 * a tile's width, while at the sides they stack and need only its height – so each stretch of the ellipse gets tiles
 * in proportion to the room it has, and the ring grows taller until no two tiles touch.
 */
function ringSpots(n: number, w: number, tileW: number, tileH: number) {
  const gap = 8;
  const overlaps = (pts: { x: number; y: number }[]) =>
    pts.some((p, i) => pts.some((q, j) => j > i && Math.abs(p.x - q.x) < tileW + gap && Math.abs(p.y - q.y) < tileH + gap));
  let h = w;
  let pts: { x: number; y: number }[] = [];
  for (let tries = 0; tries < 40; tries++) {
    const rx = w / 2 - tileW / 2;
    const ry = h / 2 - tileH / 2;
    // How many tiles fit per radian at angle a: the larger of what the width and the height allow there
    const room = (a: number) => Math.max((rx * Math.abs(Math.sin(a))) / (tileW + gap), (ry * Math.abs(Math.cos(a))) / (tileH + gap), 1e-3);
    const steps = 720;
    const cum = [0];
    for (let k = 1; k <= steps; k++) cum.push(cum[k - 1] + room(-Math.PI / 2 + ((k - 0.5) / steps) * Math.PI * 2));
    const total = cum[steps];
    pts = Array.from({ length: n }, (_, i) => {
      const want = (i / Math.max(1, n)) * total;
      let k = 0;
      while (k < steps && cum[k + 1] < want) k++;
      const a = -Math.PI / 2 + ((k + (want - cum[k]) / Math.max(1e-9, cum[k + 1] - cum[k])) / steps) * Math.PI * 2;
      return { x: w / 2 + rx * Math.cos(a), y: h / 2 + ry * Math.sin(a) };
    });
    if (!overlaps(pts)) break;
    h += 16;
  }
  return { pts, h };
}

/**
 * One agent in the middle and every tool it can reach around it – used, failed, running, unused or off limits – with
 * each tool's calls and a replay.
 * @tag tc-tool-access-map
 * @fires tc-selected-change - A tool was opened or closed ({ selected, tool }: ToolAccessSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-agent-id-change - An agent tab was chosen ({ agentId }: ToolAccessAgentIdChange); cancelable – prevented, `agentId` stays as it was
 * @fires tc-replay - Replay was pressed on a call ({ tool, call }: ToolAccessReplay); cancelable – prevented, `onReplay` isn't called
 */
export class TcToolAccessMap extends TcElement {
  static override ui = "tam";

  /** The heading */
  @property() accessor heading = "Tool access";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The agent in the middle */
  @property({ attribute: false }) accessor agent: ToolAccessAgent | null = null;
  /** Every tool it can reach, clockwise from the top */
  @property({ attribute: false }) accessor tools: ToolAccessTool[] = [];
  /** Calls as one feed, each naming its tool in `to` – added to the tools' own `calls` */
  @property({ attribute: false }) accessor calls: ToolAccessFeedCall[] = [];
  /** The open tool. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property({ attribute: false }) accessor selected: string | null = null;
  /** Agents to switch between, as tabs over the map – leave empty for none */
  @property({ attribute: false }) accessor agents: ToolAccessAgentTab[] = [];
  /** The chosen agent tab. Changed by the user unless a tc-agent-id-change listener calls preventDefault() */
  @property({ attribute: "agent-id" }) accessor agentId: string | null = null;
  /** Called on Replay (after tc-replay, unless it was prevented). May return a promise: the button is busy until it settles */
  @property({ attribute: false }) accessor onReplay: ((tool: ToolAccessTool, call: ToolAccessCall) => unknown) | undefined = undefined;
  /** The agent's status words, merged over defaultToolAccessAgentLabels */
  @property({ attribute: false }) accessor statusLabels: Partial<Record<ToolAccessAgentStatus, string>> = {};
  /** Locale for call times */
  @property() accessor locale: string | undefined = undefined;

  @state() private accessor active: string | null = null;
  @state() private accessor width = 0;
  @state() private accessor busy: ReadonlySet<string> = new Set();
  @state() private accessor announce = "";

  private uid = `tc-tam-${++uidCount}`;
  private observer: ResizeObserver | undefined;

  /* ---------- The model ---------- */

  /** A tool's calls, oldest first, from its own list and the feed */
  private callsOf(t: ToolAccessTool): ToolAccessCall[] {
    const feed = this.calls.filter((c) => c.to === t.id && (!c.from || !this.agent?.id || c.from === this.agent.id));
    return [...(t.calls ?? []), ...feed].sort((a, b) => a.at - b.at);
  }
  private stateOf(t: ToolAccessTool, calls: ToolAccessCall[]): ToolAccessState {
    if (t.access === "none") return "none";
    if (!calls.length) return "unused";
    if (calls.some((c) => norm(c.status) === "running")) return "running";
    return norm(calls.at(-1)!.status) === "failed" ? "failed" : "ok";
  }
  private word(st: ToolAccessState, calls: ToolAccessCall[]) {
    if (st === "none") return "No access";
    if (st === "unused") return "Not used yet";
    if (st === "running") return "Running";
    if (st === "failed") return "Failed";
    const ms = calls.at(-1)?.ms;
    return ms === undefined ? "Used" : `Last call ${took(ms)}`;
  }
  private get model(): Row[] {
    return this.tools.map((t) => {
      const calls = this.callsOf(t);
      const st = this.stateOf(t, calls);
      return { t, calls, st, word: this.word(st, calls) };
    });
  }
  private time(ms: number) {
    return new Intl.DateTimeFormat(this.locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(ms);
  }
  /** How the space is used: the ring with the panel beside it, the panel under the ring, or a plain list */
  private layoutFor(open: boolean) {
    const w = this.width || 720;
    const inner = w - GAP * 2;
    if (inner < LIST_BELOW) return { mode: "list" as const, ring: 0 };
    const beside = inner - PANEL_W - GAP;
    if (!open) return { mode: "ring" as const, ring: Math.max(RING_MIN, Math.min(RING_MAX, inner)) };
    if (beside >= RING_BESIDE) return { mode: "side" as const, ring: Math.min(RING_MAX, beside) };
    return { mode: "stack" as const, ring: Math.max(RING_MIN, Math.min(RING_MAX, inner)) };
  }

  private setSelected(next: string | null) {
    if (next === this.selected) return;
    const tool = next ? (this.tools.find((t) => t.id === next) ?? null) : null;
    if (!this.emit<ToolAccessSelectedChange>("tc-selected-change", { selected: next, tool }, { cancelable: true })) return;
    this.selected = next;
    this.announce = tool ? `Opened ${tool.name}` : "Closed";
  }
  private setAgent(id: string) {
    if (id === this.agentId) return;
    if (!this.emit<ToolAccessAgentIdChange>("tc-agent-id-change", { agentId: id }, { cancelable: true })) return;
    this.agentId = id;
  }
  private async replay(tool: ToolAccessTool, call: ToolAccessCall) {
    if (this.busy.has(call.id)) return;
    if (!this.emit<ToolAccessReplay>("tc-replay", { tool, call }, { cancelable: true })) return;
    const result = this.onReplay?.(tool, call);
    if (!(result instanceof Promise)) {
      this.announce = `Replaying the call to ${tool.name}`;
      return;
    }
    this.busy = new Set([...this.busy, call.id]);
    this.announce = `Replaying the call to ${tool.name}`;
    try {
      await result;
      this.announce = `Replayed the call to ${tool.name}`;
    } catch {
      this.announce = `The replay to ${tool.name} failed`;
    } finally {
      const next = new Set(this.busy);
      next.delete(call.id);
      this.busy = next;
    }
  }

  /* ---------- Keyboard ---------- */

  private tile(id: string) {
    return this.querySelector<HTMLElement>(`[data-tool="${CSS.escape(id)}"]`);
  }
  private focusTool(id: string | undefined) {
    if (!id) return;
    this.active = id;
    void this.updateComplete.then(() => this.tile(id)?.focus({ preventScroll: true }));
  }
  private onKey = (e: KeyboardEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-tool]");
    if (!el || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const ids = this.tools.map((t) => t.id);
    const i = ids.indexOf(el.dataset.tool!);
    const n = ids.length;
    const moves: Record<string, () => string> = {
      ArrowRight: () => ids[(i + 1) % n],
      ArrowDown: () => ids[(i + 1) % n],
      ArrowLeft: () => ids[(i - 1 + n) % n],
      ArrowUp: () => ids[(i - 1 + n) % n],
      Home: () => ids[0],
      End: () => ids[n - 1],
    };
    if (moves[e.key]) {
      e.preventDefault();
      this.focusTool(moves[e.key]());
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.setSelected(this.selected === ids[i] ? null : ids[i]);
    } else if (e.key === "Escape" && this.selected) {
      e.preventDefault();
      this.setSelected(null);
    }
  };
  private onTabKey = (e: KeyboardEvent) => {
    const ids = this.agents.map((a) => a.id);
    const at = ids.indexOf((e.target as HTMLElement).dataset.agent ?? "");
    if (at < 0) return;
    const n = ids.length;
    const to = { ArrowRight: (at + 1) % n, ArrowLeft: (at - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    this.setAgent(ids[to]);
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-agent="${CSS.escape(ids[to])}"]`)?.focus());
  };

  /* ---------- Size ---------- */

  override connectedCallback() {
    super.connectedCallback();
    if (typeof ResizeObserver !== "undefined") {
      this.observer = new ResizeObserver((entries) => {
        const w = Math.round(entries[0]?.contentRect.width ?? 0);
        if (w && w !== this.width) this.width = w;
      });
      void this.updateComplete.then(() => {
        const body = this.querySelector(".ui-tam__body");
        if (body) this.observer?.observe(body);
      });
    }
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.observer?.disconnect();
  }

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (this.selected && !this.tools.some((t) => t.id === this.selected)) this.selected = null;
    if (this.active && !this.tools.some((t) => t.id === this.active)) this.active = null;
  }
  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("look")) {
      const body = this.querySelector(".ui-tam__body");
      if (body && this.observer) {
        this.observer.disconnect();
        this.observer.observe(body);
      }
    }
  }

  /* ---------- Rendering ---------- */

  private face(icon: Element | undefined, name: string) {
    return icon ? icon.cloneNode(true) : html`<span class="ui-tam__initials">${initials(name)}</span>`;
  }

  private renderTile(m: Row, stop: string | null, style: string | undefined) {
    const { t, calls, st, word } = m;
    const open = this.selected === t.id;
    return html`<div
      class="ui-tam__tool"
      role="option"
      data-tool=${t.id}
      data-state=${st}
      ?data-selected=${open}
      aria-selected=${open ? "true" : "false"}
      tabindex=${stop === t.id ? 0 : -1}
      style=${ifDefined(style)}
      @focus=${() => (this.active = t.id)}
      @click=${() => {
        this.active = t.id;
        this.setSelected(open ? null : t.id);
      }}
    >
      <span class="ui-tam__tool-icon" aria-hidden="true">${this.face(t.icon, t.name)}</span>
      <span class="ui-tam__tool-text">
        <span class="ui-tam__tool-name"><span class="ui-tam__full">${t.name}</span>${t.short ? html`<span class="ui-tam__short" aria-hidden="true">${t.short}</span>` : nothing}</span>
        <span class="ui-tam__word">${word}</span>
      </span>
      ${calls.length ? html`<span class="ui-tam__badge"><span aria-hidden="true">${calls.length}×</span><span class="ui-tam__sr">, ${calls.length} ${calls.length === 1 ? "call" : "calls"}</span></span>` : nothing}
    </div>`;
  }

  private renderAgent() {
    const a = this.agent;
    if (!a) return nothing;
    const st = a.status ?? "idle";
    return html`<div class="ui-tam__agent" data-status=${st}>
      <span class="ui-tam__agent-icon" aria-hidden="true">${this.face(a.icon, a.name)}</span>
      <span class="ui-tam__agent-name">${a.name}</span>
      ${a.model ? html`<span class="ui-tam__agent-model">${a.model}</span>` : nothing}
      <span class="ui-tam__agent-status"><span class="ui-tam__dot" aria-hidden="true"></span>${this.statusLabels[st] ?? defaultToolAccessAgentLabels[st]}</span>
      ${a.task ? html`<span class="ui-tam__agent-task">${a.task}</span>` : nothing}
    </div>`;
  }

  private renderPanel(m: Row) {
    const { t, calls, st, word } = m;
    const id = `${this.uid}-panel`;
    const newest = [...calls].reverse();
    return html`<section class="ui-tam__panel" id=${id} aria-labelledby=${`${id}-title`}>
      <div class="ui-tam__panel-head">
        <span class="ui-tam__tool-icon" aria-hidden="true">${this.face(t.icon, t.name)}</span>
        <div class="ui-tam__panel-text">
          <h4 class="ui-tam__panel-title" id=${`${id}-title`}>${t.name}</h4>
          <span class="ui-tam__panel-sub" data-state=${st}>${word}${calls.length ? ` · ${calls.length} ${calls.length === 1 ? "call" : "calls"}` : ""}</span>
        </div>
        <button
          type="button"
          class="ui-tam__close"
          @click=${() => {
            const back = t.id;
            this.setSelected(null);
            this.focusTool(back);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg><span class="ui-tam__sr">Close</span>
        </button>
      </div>
      ${t.detail ? html`<p class="ui-tam__detail">${t.detail}</p>` : nothing}
      ${st === "none"
        ? html`<p class="ui-tam__note">${this.agent?.name ?? "This agent"} has no access to ${t.name}.</p>`
        : !calls.length
          ? html`<p class="ui-tam__note">No calls yet.</p>`
          : html`<ol class="ui-tam__calls">
              ${repeat(newest, (c) => c.id, (c, i) => {
                const s = norm(c.status);
                const busy = this.busy.has(c.id);
                const n = calls.length - i;
                return html`<li class="ui-tam__call" data-status=${s}>
                  <div class="ui-tam__call-head">
                    <span class="ui-tam__call-status" data-status=${s}>${s === "failed" ? "Failed" : s === "running" ? "Running" : "OK"}</span>
                    <span class="ui-tam__call-label">${c.label ?? `Call ${n}`}</span>
                    <span class="ui-tam__call-meta">${c.ms !== undefined ? took(c.ms) : ""}${c.ms !== undefined ? " · " : ""}<time datetime=${new Date(c.at).toISOString()}>${this.time(c.at)}</time></span>
                  </div>
                  ${c.args !== undefined ? html`<div class="ui-tam__io"><span class="ui-tam__io-label">Arguments</span><pre class="ui-tam__code">${show(c.args)}</pre></div>` : nothing}
                  ${c.result !== undefined ? html`<div class="ui-tam__io"><span class="ui-tam__io-label">${s === "failed" ? "Error" : "Result"}</span><pre class="ui-tam__code" data-status=${s}>${show(c.result)}</pre></div>` : nothing}
                  ${s !== "running"
                    ? html`<button type="button" class="ui-tam__replay" aria-disabled=${busy ? "true" : "false"} @click=${() => void this.replay(t, c)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>${busy ? "Replaying…" : "Replay"}<span class="ui-tam__sr"> call ${n} to ${t.name}</span>
                      </button>`
                    : nothing}
                </li>`;
              })}
            </ol>`}
    </section>`;
  }

  protected override render() {
    const id = this.uid;
    const model = this.model;
    const open = model.find((m) => m.t.id === this.selected);
    const { mode, ring } = this.layoutFor(!!open);
    const allowed = model.filter((m) => m.st !== "none").length;
    const callCount = model.reduce((n, m) => n + m.calls.length, 0);
    const running = model.reduce((n, m) => n + m.calls.filter((c) => norm(c.status) === "running").length, 0);
    const stop = this.active && model.some((m) => m.t.id === this.active) ? this.active : open ? open.t.id : (model[0]?.t.id ?? null);
    const aside = model.length
      ? html`<span class="ui-tam__summary">${allowed}/${model.length} tools · ${callCount} ${callCount === 1 ? "call" : "calls"}${running ? html` · <span class="ui-tam__running">${running} running</span>` : nothing}</span>`
      : nothing;
    const n = model.length;
    const tileW = ring >= RING_BESIDE ? TILE_W_WIDE : TILE_W;
    const { pts, h: ringH } = mode === "list" ? { pts: [], h: 0 } : ringSpots(n, ring, tileW, TILE_H);
    const spot = (i: number) => pts[i];
    const listbox = (tiles: unknown) =>
      html`<div class="ui-tam__tools" role="listbox" aria-labelledby=${`${id}-title`} aria-describedby=${`${id}-keys`} @keydown=${this.onKey}>${tiles}</div>`;
    return html`
      <span class="ui-tam__sr" role="status">${this.announce}</span>
      <span class="ui-tam__sr" id=${`${id}-keys`}>Arrow keys move between tools; Enter opens a tool's calls</span>
      ${cardHead({ icon: mapIcon, title: this.heading, subtitle: this.description, id: `${id}-title`, aside })}
      <div class="ui-tam__card">
        ${this.agents.length > 1
          ? html`<div class="ui-tam__tabs" role="tablist" aria-label="Agents" @keydown=${this.onTabKey}>
              ${this.agents.map((a, i) => {
                const on = (this.agentId ?? this.agents[0].id) === a.id;
                return html`<button type="button" role="tab" class="ui-tam__tab" data-agent=${a.id} aria-selected=${on ? "true" : "false"} tabindex=${on || (!this.agentId && i === 0) ? 0 : -1} @click=${() => this.setAgent(a.id)}>${a.name}</button>`;
              })}
            </div>`
          : nothing}
        <div class="ui-tam__body" data-mode=${mode}>
          ${!model.length && !this.agent
            ? html`<p class="ui-tam__empty">No agent or tools to show.</p>`
            : mode === "list"
              ? html`${this.renderAgent()}${listbox(repeat(model, (m) => m.t.id, (m) => this.renderTile(m, stop, undefined)))}`
              : html`<div class="ui-tam__stage" style=${`width: ${ring}px; height: ${ringH}px`}>
                  <svg class="ui-tam__links" aria-hidden="true" width=${ring} height=${ringH} viewBox=${`0 0 ${ring} ${ringH}`}>
                    ${repeat(
                      model.map((m, i) => ({ m, p: spot(i) })).filter(({ m }) => m.st === "ok" || m.st === "failed" || m.st === "running"),
                      ({ m }) => m.t.id,
                      ({ m, p }) => svg`<line class="ui-tam__link" data-to=${m.t.id} data-state=${m.st} x1=${ring / 2} y1=${ringH / 2} x2=${p.x} y2=${p.y}></line>${
                        m.st === "running" ? svg`<line class="ui-tam__pulse" data-to=${m.t.id} pathLength="100" x1=${ring / 2} y1=${ringH / 2} x2=${p.x} y2=${p.y}></line>` : nothing
                      }`,
                    )}
                  </svg>
                  ${this.renderAgent()}
                  ${listbox(
                    repeat(model, (m) => m.t.id, (m, i) => {
                      const p = spot(i);
                      return this.renderTile(m, stop, `left: ${p.x - tileW / 2}px; top: ${p.y - TILE_H / 2}px; width: ${tileW}px; height: ${TILE_H}px`);
                    }),
                  )}
                </div>`}
          ${open ? this.renderPanel(open) : nothing}
        </div>
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="tam"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tam"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* The links' colours and how long a pulse takes to reach a tool – override on the element */
[data-ui="tam"] { --tc-tam-link: var(--tc-border-strong); --tc-tam-running: var(--tc-accent-solid); --tc-tam-failed: var(--tc-status-danger-solid); --tc-tam-pulse: var(--tc-duration-shimmer); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="tam"] { --tc-tam-bg: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tam"] { --tc-tam-bg: var(--tc-surface-raised); }
[data-ui="tam"] *, [data-ui="tam"] *::before, [data-ui="tam"] *::after { box-sizing: border-box; }
:where([data-ui="tam"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="tam"] :is(button, [role="option"]):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="tam"] :is(h4, p, ol, pre) { margin: 0; }
[data-ui="tam"] ol { padding: 0; list-style: none; }
[data-ui="tam"] svg { display: block; flex: none; }
.ui-tam__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-tam__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-tam__summary { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-tam__running { color: var(--tc-accent-text); font-weight: var(--tc-font-weight-medium); }
/* ----- Agent tabs ----- */
.ui-tam__tabs { display: flex; gap: var(--tc-space-1); padding: var(--tc-space-3) var(--tc-space-4) 0; overflow-x: auto; scrollbar-width: none; }
.ui-tam__tab { flex: none; height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm) !important; border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tam__tab:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-tam__tab[aria-selected="true"] { background: var(--tc-fill-default); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
/* ----- The body: the ring, then the panel beside or below it ----- */
.ui-tam__body { display: flex; flex-direction: column; align-items: center; gap: var(--tc-space-4); padding: var(--tc-space-4); }
.ui-tam__body[data-mode="side"] { flex-direction: row; align-items: flex-start; justify-content: center; }
.ui-tam__body[data-mode="list"] { align-items: stretch; gap: var(--tc-space-3); padding: var(--tc-space-3); }
.ui-tam__stage { position: relative; flex: none; isolation: isolate; }
.ui-tam__links { position: absolute; inset: 0; z-index: 0; overflow: visible; pointer-events: none; }
.ui-tam__link { stroke: var(--tc-tam-link); stroke-width: 1.25px; transition: stroke var(--tc-duration-base) var(--tc-ease-standard); }
.ui-tam__link[data-state="failed"] { stroke: var(--tc-tam-failed); stroke-dasharray: 4 3; }
.ui-tam__link[data-state="running"] { stroke: var(--tc-tam-running); }
/* A pulse running out along the link while a call is in flight */
.ui-tam__pulse { stroke: var(--tc-tam-running); stroke-width: 3px; stroke-linecap: round; stroke-dasharray: 8 92; stroke-dashoffset: 100; animation: tc-tam-pulse var(--tc-tam-pulse) linear infinite; }
@keyframes tc-tam-pulse { to { stroke-dashoffset: 0; } }
.ui-tam__tools { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
.ui-tam__body[data-mode="list"] .ui-tam__tools { position: static; display: grid; gap: var(--tc-space-1); pointer-events: auto; }
/* ----- The agent in the middle ----- */
.ui-tam__agent { position: absolute; top: 50%; left: 50%; z-index: 1; display: grid; justify-items: center; gap: var(--tc-space-0-5); width: 9.5rem; padding: var(--tc-space-3); transform: translate(-50%, -50%); border-radius: var(--tc-radius-lg); background: var(--tc-tam-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default), var(--tc-shadow-raised); text-align: center; }
.ui-tam__body[data-mode="list"] .ui-tam__agent { position: static; width: auto; transform: none; grid-template-columns: auto 1fr auto; justify-items: start; align-items: center; column-gap: var(--tc-space-2); text-align: left; }
.ui-tam__body[data-mode="list"] .ui-tam__agent-icon { grid-row: span 2; }
.ui-tam__body[data-mode="list"] .ui-tam__agent-task { grid-column: 1 / -1; }
.ui-tam__agent-icon { display: grid; place-items: center; width: 32px; height: 32px; border-radius: var(--tc-radius-full); background: var(--tc-surface-sunken); color: var(--tc-text-secondary); }
.ui-tam__agent-icon > svg { width: 18px; height: 18px; }
.ui-tam__agent-name { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-tam__agent-model { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-tam__agent-status { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-tam__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--tc-icon-muted); }
.ui-tam__agent[data-status="running"] .ui-tam__dot { background: var(--tc-tam-running); }
.ui-tam__agent[data-status="waiting"] .ui-tam__dot { background: var(--tc-status-warning-solid); }
.ui-tam__agent[data-status="done"] .ui-tam__dot { background: var(--tc-status-success-solid); }
.ui-tam__agent[data-status="failed"] .ui-tam__dot { background: var(--tc-tam-failed); }
.ui-tam__agent-task { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
/* ----- A tool ----- */
.ui-tam__tool { position: absolute; display: flex; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-2); border-radius: var(--tc-radius-md); background: var(--tc-tam-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); pointer-events: auto; cursor: pointer; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-tam__body[data-mode="list"] .ui-tam__tool { position: relative; min-height: var(--tc-control-h-md); }
.ui-tam__tool:hover { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); }
.ui-tam__tool[data-state="failed"] { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-danger-border); }
.ui-tam__tool[data-state="running"] { box-shadow: inset 0 0 0 1.5px var(--tc-tam-running); }
/* No access: dashed and quiet, with text that keeps its contrast */
.ui-tam__tool[data-state="none"] { background: var(--tc-surface-sunken); box-shadow: none; outline: var(--tc-hairline) dashed var(--tc-border-strong); outline-offset: calc(-1 * var(--tc-hairline)); }
.ui-tam__tool[data-state="none"]:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-tam__tool[data-selected] { box-shadow: inset 0 0 0 1.5px var(--tc-border-selected), var(--tc-shadow-raised); }
.ui-tam__tool-icon { display: grid; flex: none; place-items: center; width: 24px; height: 24px; border-radius: var(--tc-radius-sm); background: var(--tc-surface-sunken); color: var(--tc-text-secondary); }
.ui-tam__tool-icon > svg { width: 14px; height: 14px; }
.ui-tam__tool[data-state="none"] .ui-tam__tool-icon { background: var(--tc-fill-default); color: var(--tc-text-muted); }
.ui-tam__initials { font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-none); }
.ui-tam__tool-text { display: grid; flex: 1; gap: var(--tc-space-0-5); min-width: 0; }
.ui-tam__tool-name { overflow: hidden; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); text-overflow: ellipsis; white-space: nowrap; }
.ui-tam__short { display: none; }
.ui-tam__word { overflow: hidden; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.ui-tam__tool[data-state="failed"] .ui-tam__word { color: var(--tc-status-danger-fg); font-weight: var(--tc-font-weight-medium); }
.ui-tam__tool[data-state="running"] .ui-tam__word { color: var(--tc-accent-text); font-weight: var(--tc-font-weight-medium); }
.ui-tam__tool[data-state="none"] .ui-tam__tool-name { color: var(--tc-text-secondary); }
.ui-tam__badge { position: absolute; top: calc(-1 * var(--tc-space-1-5)); right: calc(-1 * var(--tc-space-1-5)); padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-full); background: var(--tc-tam-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-tam__body[data-mode="list"] .ui-tam__badge { position: static; flex: none; }
/* ----- The open tool's calls ----- */
.ui-tam__panel { display: grid; align-content: start; gap: var(--tc-space-3); width: 100%; max-width: 36rem; padding: var(--tc-space-3) var(--tc-space-4); border-radius: var(--tc-radius-md); background: var(--tc-surface-sunken); }
.ui-tam__body[data-mode="side"] .ui-tam__panel { flex: none; width: 300px; max-height: 500px; overflow-y: auto; }
.ui-tam__panel-head { display: flex; align-items: center; gap: var(--tc-space-2); }
.ui-tam__panel-head .ui-tam__tool-icon { background: var(--tc-tam-bg); }
.ui-tam__panel-text { display: grid; flex: 1; min-width: 0; }
.ui-tam__panel-title { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-tam__panel-sub { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-tam__panel-sub[data-state="failed"] { color: var(--tc-status-danger-fg); }
.ui-tam__close { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tam__close:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-tam__close svg { width: 16px; height: 16px; }
.ui-tam__detail, .ui-tam__note { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); }
.ui-tam__calls { display: grid; gap: var(--tc-space-2); }
.ui-tam__call { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-tam-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-tam__call-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-1) var(--tc-space-2); }
.ui-tam__call-status { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-success-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-status-success-fg); }
.ui-tam__call-status[data-status="failed"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-tam__call-status[data-status="running"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-tam__call-label { flex: 1; min-width: 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-tam__call-meta { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-tam__io { display: grid; gap: var(--tc-space-1); }
.ui-tam__io-label { font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-tracking-caps); text-transform: uppercase; color: var(--tc-text-muted); }
.ui-tam__code { max-height: 10rem; padding: var(--tc-space-2); overflow: auto; border-radius: var(--tc-radius-sm); background: var(--tc-surface-sunken); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); white-space: pre-wrap; overflow-wrap: anywhere; }
.ui-tam__code[data-status="failed"] { color: var(--tc-status-danger-fg); }
.ui-tam__replay { display: inline-flex; justify-self: start; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm) !important; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg) !important; box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-font-size-xs); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tam__replay:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-tam__replay svg { width: 13px; height: 13px; }
.ui-tam__replay[aria-disabled="true"] { cursor: progress; color: var(--tc-text-muted); }
.ui-tam__replay[aria-disabled="true"] svg { animation: tc-tam-spin var(--tc-duration-shimmer) linear infinite; }
@keyframes tc-tam-spin { to { transform: rotate(-1turn); } }
.ui-tam__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
/* A smaller ring: tools use their short names */
@container (max-width: 560px) {
  .ui-tam__short { display: inline; }
  .ui-tam__tool-name:has(.ui-tam__short) .ui-tam__full { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
}
@media (forced-colors: active) {
  .ui-tam__link { stroke: CanvasText; }
  .ui-tam__link[data-state="failed"], .ui-tam__pulse { stroke: Highlight; }
  .ui-tam__tool, .ui-tam__agent { border: 1px solid CanvasText; }
  .ui-tam__tool[data-selected] { border: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-tam__pulse { display: none; }
  [data-ui="tam"] *, [data-ui="tam"] *::before, [data-ui="tam"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-tool-access-map")) customElements.define("tc-tool-access-map", TcToolAccessMap);

declare global {
  interface HTMLElementTagNameMap {
    "tc-tool-access-map": TcToolAccessMap;
  }
}
