import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { initials } from "./internal/util";

/*
 * <tc-memory-graph> – what an agent knows and what it can reach, around it: the agent in the middle, its memories on
 * the left half of a ring and its tools on the right, each joined to it by a rounded connector.
 *   · a memory is a card with what it remembers and where that came from – a file, a chat or an email, by name – and a
 *     tool says what the agent may do with it and where ("Read · Exhibitions wiki")
 *   · the agent says what it's doing: "Using Spreadsheet" while `using` names a tool, "Learning…" while `learning` names
 *     a memory, "Recalling 2 memories" while `recalling` lists some – or the page's own words in `agent.activity`
 *   · a light runs out along the connector to the tool in use, in from a memory being recalled, and in from the tool a
 *     new memory came through, on through the agent and out to that memory – the cards it reaches light up. With
 *     reduced motion the connectors just turn the accent colour
 *   · six memory spots; with more, the last says "+N more" and opens the rest
 *   · open a card for its details: switch a memory or a tool off (tc-memories-change / tc-tools-change, the whole
 *     list), forget a memory (Undo stays for a few seconds), open where it came from
 *   · the agent is a button: it offers Add a file and Connect a tool (tc-action – the page does the work)
 *   · the cards are one tab stop: ↑ / ↓ move down a side, ← / → cross to the other side, Home / End go to the ends,
 *     Enter or Space opens a card, Escape closes it, Delete forgets a memory
 *   · narrower than the ring needs, the agent sits on top with memories and tools as two lists under it
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-memory-graph .agent=${{ name: "Assistant" }} .memories=${[…]} .tools=${[…]}></tc-memory-graph>
 */

/** A brain: Lucide's "brain" (ISC, lucide.dev) */
const headIcon = svg`<path d="M12 18V5"></path><path d="M15 13a4.17 4.17 0 0 1-3-4 4.17 4.17 0 0 1-3 4"></path><path d="M17.598 6.5A3 3 0 1 0 12 5a3 3 0 1 0-5.598 1.5"></path><path d="M17.997 5.125a4 4 0 0 1 2.526 5.77"></path><path d="M18 18a4 4 0 0 0 2-7.464"></path><path d="M19.967 17.483A4 4 0 1 1 12 18a4 4 0 1 1-7.967-.517"></path><path d="M6 18a4 4 0 0 1-2-7.464"></path><path d="M6.003 5.125a4 4 0 0 0-2.526 5.77"></path>`;

/* The kinds of source, as small marks: Lucide's "file-text", "message-square" and "mail" (ISC, lucide.dev) */
const KIND_ICONS = {
  file: svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 13H8"></path><path d="M16 17H8"></path>`,
  chat: svg`<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>`,
  email: svg`<path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect>`,
};
/** The agent's default mark: Lucide's "sparkles" (ISC, lucide.dev) */
const agentMark = svg`<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>`;

export type MemoryGraphSourceKind = "file" | "chat" | "email";
export type MemoryGraphArtifact = {
  /** Its name: "budget-q4.xlsx", "Standup notes" */
  name: string;
  /** "file" by default */
  kind?: MemoryGraphSourceKind;
  /** Its app's mark (an element, cloned) – defaults to the kind's mark */
  icon?: Element;
  /** Adds Open to the memory's details */
  href?: string;
};
export type MemoryGraphMemory = {
  id: string;
  /** What it remembers: "Prefers short answers" */
  text: string;
  /** A line on where it came from: "You asked for it twice" */
  source?: string;
  /** What kind of memory it is: "Preference", "Fact" */
  tag?: string;
  /** What it came from */
  artifact?: MemoryGraphArtifact;
  /** The id of the tool it was learned through – a memory being learned lights up the way in from that tool */
  via?: string;
  /** Switched off: kept, but not used */
  off?: boolean;
};
export type MemoryGraphTool = {
  id: string;
  name: string;
  /** Its mark (an element, cloned) – defaults to the initials */
  icon?: Element;
  /** What it may do: "Read", "Read & write" */
  access?: string;
  /** Where: "Exhibitions wiki", "Loans team calendar" */
  scope?: string;
  /** One line in its details: "Read today's standup notes" */
  note?: string;
  /** Switched off: the agent may not use it */
  off?: boolean;
};
export type MemoryGraphAgent = {
  name: string;
  /** A short line under the name, shown while it isn't doing anything */
  subtitle?: string;
  /** What it's doing, in the page's own words – overrides the words worked out from using, learning and recalling */
  activity?: string;
  /** Its mark (an element, cloned) */
  icon?: Element;
};

/** Details of the events */
export type MemoryGraphMemoriesChange = { memories: MemoryGraphMemory[]; memory: MemoryGraphMemory; change: "off" | "on" | "forgotten" | "restored" };
export type MemoryGraphToolsChange = { tools: MemoryGraphTool[]; tool: MemoryGraphTool; change: "off" | "on" };
export type MemoryGraphSelectedChange = { selected: string | null; memory: MemoryGraphMemory | null; tool: MemoryGraphTool | null };
export type MemoryGraphAction = { id: "add-file" | "connect-tool" };

export const defaultMemoryGraphKindLabels: Record<MemoryGraphSourceKind, string> = { file: "File", chat: "Chat", email: "Email" };

/** The "+N more" spot's id, as `selected` */
export const MEMORY_GRAPH_MORE = "__more";
/** How many memory spots the ring has; past this the last one holds "+N more" */
const SPOTS = 6;

/* The ring's geometry, in px */
const AGENT_W = 168;
// About how tall the agent is, so cards above and below it keep clear of it
const AGENT_H = 80;
const CARD_MIN = 136;
const CARD_MAX = 210;
// Room between the agent and the nearest cards for the connectors
const LINK = 44;
const CARD_H = 58;
const ROW_GAP = 26;
// The ring is this much taller than the outermost cards, so the top and bottom ones curve in towards the agent
const RING_SLACK = 1.2;
// The fewest rows the ring is laid out for, so a short list still makes a round ring
const MIN_ROWS = 4;

type Spot = {
  key: string;
  kind: "memory" | "more" | "tool";
  x: number;
  y: number;
  side: "left" | "right";
  /** The connector from the agent out to the card */
  d?: string;
  /** Where the connector meets the card */
  end?: { x: number; y: number };
};
type Forgot = { memory: MemoryGraphMemory; index: number; key: number };

let uidCount = 0;

/**
 * What an agent remembers and the tools it can reach, around it – each memory with where it came from, each tool with
 * what it may do – with a light along the way it's using, switches and forget with Undo.
 * @tag tc-memory-graph
 * @fires tc-memories-change - A memory was switched off or on, forgotten or brought back ({ memories, memory, change }: MemoryGraphMemoriesChange); cancelable – prevented, `memories` stays as it was
 * @fires tc-tools-change - A tool was switched off or on ({ tools, tool, change }: MemoryGraphToolsChange); cancelable – prevented, `tools` stays as it was
 * @fires tc-selected-change - A card's details were opened or closed ({ selected, memory, tool }: MemoryGraphSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-action - Add a file or Connect a tool was chosen on the agent ({ id }: MemoryGraphAction)
 */
export class TcMemoryGraph extends TcElement {
  static override ui = "mgr";

  /** The heading */
  @property() accessor heading = "Memory";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The agent in the middle */
  @property({ attribute: false }) accessor agent: MemoryGraphAgent | null = null;
  /** What it remembers, on the left of the ring from the top. Ids are unique across memories and tools */
  @property({ attribute: false }) accessor memories: MemoryGraphMemory[] = [];
  /** The tools it can reach, on the right of the ring from the top */
  @property({ attribute: false }) accessor tools: MemoryGraphTool[] = [];
  /** The id of the tool it's using right now – a light runs out to it */
  @property() accessor using: string | null = null;
  /** The id of a memory it's learning right now – a light runs in from its `via` tool, through the agent, out to it */
  @property() accessor learning: string | null = null;
  /** The ids of memories it's recalling right now – a light runs in from each */
  @property({ attribute: false }) accessor recalling: string[] = [];
  /** The card whose details are open (a memory's or tool's id, or MEMORY_GRAPH_MORE). Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property({ attribute: false }) accessor selected: string | null = null;
  /** How long Undo stays after a memory is forgotten, in ms */
  @property({ type: Number, attribute: "undo-for" }) accessor undoFor = 5000;
  /** The source kinds' words, merged over defaultMemoryGraphKindLabels */
  @property({ attribute: false }) accessor kindLabels: Partial<Record<MemoryGraphSourceKind, string>> = {};

  @state() private accessor active: string | null = null;
  @state() private accessor width = 0;
  @state() private accessor menuOpen = false;
  @state() private accessor forgot: Forgot | null = null;
  @state() private accessor announce = "";

  private uid = `tc-mgr-${++uidCount}`;
  private observer: ResizeObserver | undefined;
  private forgotTimer = 0;
  private forgotTimerFor = -1;
  private forgets = 0;

  /* ---------- The model ---------- */

  private memoryOf(id: string | null) {
    return id ? this.memories.find((m) => m.id === id) : undefined;
  }
  private toolOf(id: string | null) {
    return id ? this.tools.find((t) => t.id === id) : undefined;
  }
  /** The memories with a spot of their own, and how many wait behind "+N more" */
  private get spots() {
    const all = this.memories;
    if (all.length <= SPOTS) return { shown: all, rest: [] as MemoryGraphMemory[] };
    return { shown: all.slice(0, SPOTS - 1), rest: all.slice(SPOTS - 1) };
  }
  /** Card keys in keyboard order: the memories (and "+N more") down the left, then the tools down the right */
  private get order() {
    const { shown, rest } = this.spots;
    return { left: [...shown.map((m) => m.id), ...(rest.length ? [MEMORY_GRAPH_MORE] : [])], right: this.tools.map((t) => t.id) };
  }
  private kindWord(k: MemoryGraphSourceKind | undefined) {
    const kind = k ?? "file";
    return this.kindLabels[kind] ?? defaultMemoryGraphKindLabels[kind];
  }
  private get recallingLive() {
    return this.recalling.filter((id) => this.memories.some((m) => m.id === id && !m.off));
  }
  /** What the agent says it's doing */
  private get activity() {
    const a = this.agent;
    if (a?.activity) return a.activity;
    if (this.memoryOf(this.learning)) return "Learning…";
    const using = this.toolOf(this.using);
    if (using && !using.off) return `Using ${using.name}`;
    const n = this.recallingLive.length;
    if (n) return `Recalling ${n} ${n === 1 ? "memory" : "memories"}`;
    return a?.subtitle ?? "";
  }
  /** Which cards a light reaches right now */
  private get lit() {
    const lit = new Set<string>();
    const using = this.toolOf(this.using);
    if (using && !using.off) lit.add(using.id);
    const learning = this.memoryOf(this.learning);
    if (learning) {
      lit.add(learning.id);
      if (learning.via && this.toolOf(learning.via)) lit.add(learning.via);
    }
    for (const id of this.recallingLive) lit.add(id);
    return lit;
  }
  /** How the space is used: the ring, or the agent above two lists */
  private layout() {
    const w = this.width || 760;
    const side = Math.floor((w - AGENT_W) / 2 - LINK);
    if (side < CARD_MIN) return { mode: "list" as const, cardW: 0, w };
    return { mode: "ring" as const, cardW: Math.min(CARD_MAX, side), w };
  }
  /**
   * The cards on an ellipse round the agent – memories down its left half, tools down its right – each with a curved
   * connector from the agent. Rows are evenly spaced; how far out a card sits follows the ellipse, so the top and
   * bottom ones curve in over and under the agent, never closer than clears it.
   */
  private place(cardW: number, w: number) {
    const { left, right } = this.order;
    const rows = Math.max(left.length, right.length, MIN_ROWS);
    const h = rows * (CARD_H + ROW_GAP) + ROW_GAP;
    const cx = w / 2;
    const cy = h / 2;
    const rx = w / 2 - cardW / 2;
    const reach = ((rows - 1) * (CARD_H + ROW_GAP)) / 2;
    const ry = Math.max(reach * RING_SLACK, 1);
    // A card this close to the agent's middle, up or down, has to sit beside it rather than over or under it
    const besideBand = AGENT_H / 2 + CARD_H / 2 + ROW_GAP / 2;
    const beside = AGENT_W / 2 + LINK + cardW / 2;
    const clear = cardW / 2 + ROW_GAP;
    const column = (keys: string[], side: "left" | "right"): Spot[] => {
      const n = keys.length;
      const dir = side === "left" ? -1 : 1;
      return keys.map((key, i) => {
        const dy = (i - (n - 1) / 2) * (CARD_H + ROW_GAP);
        let off = rx * Math.sqrt(Math.max(0, 1 - (dy / ry) ** 2));
        off = Math.max(off, Math.abs(dy) < besideBand ? beside : clear);
        const mx = cx + dir * off;
        const y = cy + dy;
        const kind = side === "right" ? "tool" : key === MEMORY_GRAPH_MORE ? "more" : "memory";
        // Beside the agent the connector leaves its side for the card's inner edge; above or below, it leaves its top
        // or bottom for the card's nearer edge
        const inner = mx - (dir * cardW) / 2;
        let d: string;
        let end: { x: number; y: number };
        if (dir * (inner - cx) >= AGENT_W / 2 + LINK / 2) {
          const sx = cx + (dir * AGENT_W) / 2;
          const sy = cy + Math.max(-AGENT_H / 4, Math.min(AGENT_H / 4, dy / 3));
          const k = Math.abs(inner - sx) / 2;
          end = { x: inner, y };
          d = `M${sx} ${sy}C${sx + dir * k} ${sy} ${inner - dir * k} ${y} ${inner} ${y}`;
        } else {
          const sg = Math.sign(dy) || 1;
          const sx = cx + dir * Math.min(AGENT_W / 2 - 24, off / 2);
          const sy = cy + (sg * AGENT_H) / 2;
          const ey = y - (sg * CARD_H) / 2;
          const k = Math.abs(ey - sy) / 2;
          end = { x: mx, y: ey };
          d = `M${sx} ${sy}C${sx} ${sy + sg * k} ${mx} ${ey - sg * k} ${mx} ${ey}`;
        }
        return { key, kind, x: mx - cardW / 2, y: y - CARD_H / 2, side, d, end };
      });
    };
    return { h, cx, cy, rx, ry, spots: [...column(left, "left"), ...column(right, "right")] };
  }

  /* ---------- Changes ---------- */

  private setSelected(next: string | null) {
    if (next === this.selected) return;
    const memory = this.memoryOf(next) ?? null;
    const tool = memory ? null : (this.toolOf(next) ?? null);
    if (!this.emit<MemoryGraphSelectedChange>("tc-selected-change", { selected: next, memory, tool }, { cancelable: true })) return;
    this.selected = next;
    this.announce = next === MEMORY_GRAPH_MORE ? "Opened the other memories" : memory ? `Opened “${memory.text}”` : tool ? `Opened ${tool.name}` : "Closed";
  }
  private commitMemories(memories: MemoryGraphMemory[], memory: MemoryGraphMemory, change: MemoryGraphMemoriesChange["change"]) {
    const ok = this.emit<MemoryGraphMemoriesChange>("tc-memories-change", { memories, memory, change }, { cancelable: true });
    if (ok) this.memories = memories;
    return ok;
  }
  private switchMemory(m: MemoryGraphMemory) {
    const off = !m.off;
    const next = { ...m, off };
    if (this.commitMemories(this.memories.map((x) => (x.id === m.id ? next : x)), next, off ? "off" : "on")) this.announce = `${off ? "Switched off" : "Switched on"} “${m.text}”`;
  }
  private switchTool(t: MemoryGraphTool) {
    const off = !t.off;
    const next = { ...t, off };
    const tools = this.tools.map((x) => (x.id === t.id ? next : x));
    if (!this.emit<MemoryGraphToolsChange>("tc-tools-change", { tools, tool: next, change: off ? "off" : "on" }, { cancelable: true })) return;
    this.tools = tools;
    this.announce = `${off ? "Switched off" : "Switched on"} ${t.name}`;
  }
  private forget(m: MemoryGraphMemory) {
    const index = this.memories.findIndex((x) => x.id === m.id);
    if (index < 0) return;
    // Focus goes on to the next card down the side, or back up when it was the last
    const keys = this.order.left;
    const at = keys.indexOf(m.id);
    const after = keys.filter((k) => k !== m.id)[Math.min(Math.max(at, 0), keys.length - 2)];
    this.commitMemories(
      this.memories.filter((x) => x.id !== m.id),
      m,
      "forgotten",
    );
    // Undo is offered whether the list changed here or the page owns it and is about to drop it
    this.forgot = { memory: m, index, key: ++this.forgets };
    if (this.selected === m.id) this.setSelected(null);
    this.announce = `Forgot “${m.text}”. Undo is under the graph.`;
    if (after) this.focusCard(after);
  }
  private undo() {
    const f = this.forgot;
    if (!f) return;
    this.forgot = null;
    if (this.memories.some((x) => x.id === f.memory.id)) return;
    const next = [...this.memories];
    next.splice(Math.min(f.index, next.length), 0, f.memory);
    this.commitMemories(next, f.memory, "restored");
    this.announce = `Brought back “${f.memory.text}”`;
    this.focusCard(this.spots.shown.some((m) => m.id === f.memory.id) ? f.memory.id : MEMORY_GRAPH_MORE);
  }
  private act(id: MemoryGraphAction["id"]) {
    this.menuOpen = false;
    this.emit<MemoryGraphAction>("tc-action", { id });
  }

  /* ---------- Keyboard ---------- */

  private card(key: string) {
    return this.querySelector<HTMLElement>(`[data-card="${CSS.escape(key)}"]`);
  }
  private focusCard(key: string | undefined) {
    if (!key) return;
    this.active = key;
    void this.updateComplete.then(() => this.card(key)?.focus({ preventScroll: true }));
  }
  private onKey = (e: KeyboardEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-card]");
    if (!el || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const key = el.dataset.card!;
    const { left, right } = this.order;
    const onLeft = left.includes(key);
    const col = onLeft ? left : right;
    const other = onLeft ? right : left;
    const i = col.indexOf(key);
    const all = [...left, ...right];
    const cross = () => (other.length ? other[Math.min(i, other.length - 1)] : undefined);
    const moves: Record<string, () => string | undefined> = {
      ArrowDown: () => col[Math.min(i + 1, col.length - 1)],
      ArrowUp: () => col[Math.max(i - 1, 0)],
      ArrowLeft: () => (onLeft ? undefined : cross()),
      ArrowRight: () => (onLeft ? cross() : undefined),
      Home: () => all[0],
      End: () => all.at(-1),
    };
    if (moves[e.key]) {
      e.preventDefault();
      this.focusCard(moves[e.key]());
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.setSelected(this.selected === key ? null : key);
    } else if (e.key === "Escape" && this.selected) {
      e.preventDefault();
      this.setSelected(null);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      const m = this.memoryOf(key);
      if (!m) return;
      e.preventDefault();
      this.forget(m);
    }
  };

  /* ---------- Size and timers ---------- */

  override connectedCallback() {
    super.connectedCallback();
    if (typeof ResizeObserver !== "undefined") {
      this.observer = new ResizeObserver((entries) => {
        const w = Math.round(entries[0]?.contentRect.width ?? 0);
        if (w && w !== this.width) this.width = w;
      });
      void this.updateComplete.then(() => this.observe());
    }
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.observer?.disconnect();
    clearTimeout(this.forgotTimer);
    this.forgotTimerFor = -1;
  }
  private observe() {
    const body = this.querySelector(".ui-mgr__body");
    if (!body || !this.observer) return;
    this.observer.disconnect();
    this.observer.observe(body);
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const keys = new Set([...this.memories.map((m) => m.id), ...this.tools.map((t) => t.id), ...(this.memories.length > SPOTS ? [MEMORY_GRAPH_MORE] : [])]);
    if (this.selected && !keys.has(this.selected)) this.selected = null;
    if (this.active && !keys.has(this.active)) this.active = null;
  }
  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("look")) this.observe();
    // Undo stays for `undoFor`, then goes
    const want = this.forgot && Number.isFinite(this.undoFor) ? this.forgot.key : -1;
    if (want !== this.forgotTimerFor) {
      clearTimeout(this.forgotTimer);
      this.forgotTimerFor = want;
      if (want >= 0) this.forgotTimer = window.setTimeout(() => (this.forgot = null), this.undoFor);
    }
  }

  /* ---------- Rendering ---------- */

  private face(icon: Element | undefined, name: string) {
    return icon ? icon.cloneNode(true) : html`<span class="ui-mgr__initials">${initials(name)}</span>`;
  }
  private kindMark(a: MemoryGraphArtifact | undefined) {
    if (a?.icon) return a.icon.cloneNode(true);
    return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${KIND_ICONS[a?.kind ?? "file"]}</svg>`;
  }
  private sourceLine(m: MemoryGraphMemory) {
    return m.artifact ? `${m.artifact.name} · ${this.kindWord(m.artifact.kind)}` : (m.source ?? "");
  }

  private renderCard(s: Spot, stop: string | null, style: string | undefined, lit: Set<string>, rest: number) {
    const open = this.selected === s.key;
    const common = (cls: string, body: unknown, off = false) => html`<div
      class=${`ui-mgr__node ${cls}`}
      role="option"
      data-card=${s.key}
      ?data-off=${off}
      ?data-lit=${lit.has(s.key)}
      ?data-selected=${open}
      aria-selected=${open ? "true" : "false"}
      tabindex=${stop === s.key ? 0 : -1}
      style=${ifDefined(style)}
      @focus=${() => (this.active = s.key)}
      @click=${() => {
        this.active = s.key;
        this.setSelected(open ? null : s.key);
      }}
    >
      ${body}
    </div>`;
    if (s.kind === "more")
      return common(
        "ui-mgr__more",
        html`<span class="ui-mgr__more-count">+${rest} more</span> <span class="ui-mgr__sub">${rest === 1 ? "memory" : "memories"}</span>`,
      );
    if (s.kind === "memory") {
      const m = this.memoryOf(s.key)!;
      return common(
        "ui-mgr__memory",
        html`<span class="ui-mgr__icon" aria-hidden="true">${this.kindMark(m.artifact)}</span>
          <span class="ui-mgr__text">
            <span class="ui-mgr__name">${m.text}</span>
            <span class="ui-mgr__sub">${m.off ? html`<span class="ui-mgr__off">Off</span> · ` : nothing}${this.sourceLine(m)}</span>
          </span>`,
        !!m.off,
      );
    }
    const t = this.toolOf(s.key)!;
    const line = [t.access, t.scope].filter(Boolean).join(" · ");
    return common(
      "ui-mgr__tool",
      html`<span class="ui-mgr__icon" aria-hidden="true">${this.face(t.icon, t.name)}</span>
        <span class="ui-mgr__text">
          <span class="ui-mgr__name">${t.name}</span>
          <span class="ui-mgr__sub">${t.off ? html`<span class="ui-mgr__off">Off</span>${line ? " · " : ""}` : nothing}${line}</span>
        </span>`,
      !!t.off,
    );
  }

  private renderAgent() {
    const a = this.agent;
    if (!a) return nothing;
    const id = this.uid;
    const activity = this.activity;
    const busy = !!(a.activity || this.lit.size);
    return html`<div class="ui-mgr__agent" ?data-busy=${busy}>
      <button
        type="button"
        class="ui-mgr__agent-btn"
        aria-expanded=${this.menuOpen ? "true" : "false"}
        aria-controls=${`${id}-menu`}
        @click=${() => (this.menuOpen = !this.menuOpen)}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === "Escape" && this.menuOpen) {
            e.preventDefault();
            this.menuOpen = false;
          }
        }}
      >
        <span class="ui-mgr__agent-icon" aria-hidden="true"
          >${a.icon ? a.icon.cloneNode(true) : html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${agentMark}</svg>`}</span
        >
        <span class="ui-mgr__agent-name">${a.name}</span>
        ${activity ? html`<span class="ui-mgr__agent-activity">${activity}</span>` : nothing}
        <span class="ui-mgr__sr">, add a file or connect a tool</span>
      </button>
      <div
        class="ui-mgr__menu"
        id=${`${id}-menu`}
        ?hidden=${!this.menuOpen}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key !== "Escape") return;
          e.preventDefault();
          this.menuOpen = false;
          void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-mgr__agent-btn")?.focus());
        }}
      >
        <button type="button" class="ui-mgr__menu-item" data-action="add-file" @click=${() => this.act("add-file")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${KIND_ICONS.file}</svg>Add a file
        </button>
        <button type="button" class="ui-mgr__menu-item" data-action="connect-tool" @click=${() => this.act("connect-tool")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22v-5"></path><path d="M9 8V2"></path><path d="M15 8V2"></path><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"></path></svg>Connect a tool
        </button>
      </div>
    </div>`;
  }

  private renderSwitch(on: boolean, label: string, toggle: () => void) {
    return html`<button type="button" role="switch" class="ui-mgr__switch" aria-checked=${on ? "true" : "false"} @click=${toggle}>
      <span class="ui-mgr__track" aria-hidden="true"><span class="ui-mgr__thumb"></span></span>${label}
    </button>`;
  }

  private renderPanel(rest: MemoryGraphMemory[]) {
    const key = this.selected;
    if (!key) return nothing;
    const id = `${this.uid}-panel`;
    const close = html`<button
      type="button"
      class="ui-mgr__close"
      @click=${() => {
        this.setSelected(null);
        this.focusCard(key);
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg><span class="ui-mgr__sr">Close</span>
    </button>`;
    const head = (title: string, sub: string, icon: unknown) => html`<div class="ui-mgr__panel-head">
      <span class="ui-mgr__icon" aria-hidden="true">${icon}</span>
      <div class="ui-mgr__panel-text">
        <h4 class="ui-mgr__panel-title" id=${`${id}-title`}>${title}</h4>
        ${sub ? html`<span class="ui-mgr__sub">${sub}</span>` : nothing}
      </div>
      ${close}
    </div>`;
    let body: unknown = nothing;
    if (key === MEMORY_GRAPH_MORE) {
      body = html`${head(`${rest.length} more ${rest.length === 1 ? "memory" : "memories"}`, "", html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${headIcon}</svg>`)}
        <ul class="ui-mgr__rest">
          ${repeat(
            rest,
            (m) => m.id,
            (m) => html`<li>
              <button type="button" class="ui-mgr__rest-item" ?data-off=${m.off} data-memory=${m.id} @click=${() => this.setSelected(m.id)}>
                <span class="ui-mgr__name">${m.text}</span>
                <span class="ui-mgr__sub">${m.off ? "Off · " : ""}${this.sourceLine(m)}</span>
              </button>
            </li>`,
          )}
        </ul>`;
    } else {
      const m = this.memoryOf(key);
      const t = m ? undefined : this.toolOf(key);
      if (m) {
        const via = this.toolOf(m.via ?? null);
        body = html`${head(m.text, m.source ?? "", this.kindMark(m.artifact))}
          <dl class="ui-mgr__facts">
            ${m.artifact
              ? html`<div class="ui-mgr__fact">
                  <dt>From</dt>
                  <dd>
                    ${m.artifact.name} · ${this.kindWord(m.artifact.kind)}${m.artifact.href
                      ? html` <a class="ui-mgr__link" href=${m.artifact.href} target="_blank" rel="noopener">Open<span class="ui-mgr__sr"> ${m.artifact.name}</span></a>`
                      : nothing}
                  </dd>
                </div>`
              : nothing}
            ${via ? html`<div class="ui-mgr__fact"><dt>Learned through</dt><dd>${via.name}</dd></div>` : nothing}
            ${m.tag ? html`<div class="ui-mgr__fact"><dt>Kind</dt><dd>${m.tag}</dd></div>` : nothing}
          </dl>
          <div class="ui-mgr__panel-actions">
            ${this.renderSwitch(!m.off, "Use this memory", () => this.switchMemory(m))}
            <button type="button" class="ui-mgr__forget" @click=${() => this.forget(m)}>Forget<span class="ui-mgr__sr"> “${m.text}”</span></button>
          </div>`;
      } else if (t) {
        const who = this.agent?.name ?? "the agent";
        body = html`${head(t.name, [t.access, t.scope].filter(Boolean).join(" · "), this.face(t.icon, t.name))}
          ${t.note ? html`<p class="ui-mgr__note">${t.note}</p>` : nothing}
          <div class="ui-mgr__panel-actions">${this.renderSwitch(!t.off, `Let ${who} use ${t.name}`, () => this.switchTool(t))}</div>`;
      } else return nothing;
    }
    return html`<section class="ui-mgr__panel" id=${id} aria-labelledby=${`${id}-title`}>${body}</section>`;
  }

  protected override render() {
    const id = this.uid;
    const { rest } = this.spots;
    const { mode, cardW, w } = this.layout();
    const lit = this.lit;
    const { left, right } = this.order;
    const keys = [...left, ...right];
    const stop = this.active && keys.includes(this.active) ? this.active : this.selected && keys.includes(this.selected) ? this.selected : (keys[0] ?? null);
    const on = this.memories.filter((m) => !m.off).length;
    const toolsOn = this.tools.filter((t) => !t.off).length;
    const aside = this.memories.length || this.tools.length
      ? html`<span class="ui-mgr__summary">${on === this.memories.length ? this.memories.length : `${on}/${this.memories.length}`} ${this.memories.length === 1 ? "memory" : "memories"} · ${toolsOn === this.tools.length ? this.tools.length : `${toolsOn}/${this.tools.length}`} ${this.tools.length === 1 ? "tool" : "tools"}</span>`
      : nothing;
    const group = (label: string, cls: string, cards: unknown) => html`<div class=${`ui-mgr__group ${cls}`} role="group" aria-label=${label}>${cards}</div>`;
    const listbox = (memoryCards: unknown, toolCards: unknown) =>
      html`<div class="ui-mgr__cards" role="listbox" aria-labelledby=${`${id}-title`} aria-describedby=${`${id}-keys`} @keydown=${this.onKey}>
        ${left.length ? group("Memories", "ui-mgr__group--memories", memoryCards) : nothing}${right.length ? group("Tools", "ui-mgr__group--tools", toolCards) : nothing}
      </div>`;
    let stage: unknown;
    if (!this.memories.length && !this.tools.length && !this.agent) stage = html`<p class="ui-mgr__empty">Nothing remembered and no tools yet.</p>`;
    else if (mode === "list") {
      const spot = (key: string, side: "left" | "right"): Spot => ({ key, kind: side === "right" ? "tool" : key === MEMORY_GRAPH_MORE ? "more" : "memory", x: 0, y: 0, side });
      stage = html`${this.renderAgent()}${listbox(
        left.map((k) => this.renderCard(spot(k, "left"), stop, undefined, lit, rest.length)),
        right.map((k) => this.renderCard(spot(k, "right"), stop, undefined, lit, rest.length)),
      )}`;
    } else {
      const { h, cx, cy, rx, ry, spots } = this.place(cardW, w);
      const learning = this.memoryOf(this.learning);
      const using = this.toolOf(this.using);
      const recalling = new Set(this.recallingLive);
      // Which way a light runs along each connector: out from the agent, or in towards it
      const flow = (s: Spot): "out" | "in" | null => {
        if (s.kind === "tool") {
          if (learning?.via === s.key) return "in";
          return using?.id === s.key && !using.off ? "out" : null;
        }
        if (learning?.id === s.key) return "out";
        return recalling.has(s.key) ? "in" : null;
      };
      const offOf = (s: Spot) => (s.kind === "memory" ? !!this.memoryOf(s.key)?.off : s.kind === "tool" ? !!this.toolOf(s.key)?.off : false);
      const pos = (s: Spot) => `left: ${s.x}px; top: ${s.y}px; width: ${cardW}px; height: ${CARD_H}px`;
      stage = html`<div class="ui-mgr__stage" style=${`width: ${w}px; height: ${h}px`}>
        <svg class="ui-mgr__links" aria-hidden="true" width=${w} height=${h} viewBox=${`0 0 ${w} ${h}`}>
          <ellipse class="ui-mgr__orbit" cx=${cx} cy=${cy} rx=${rx} ry=${ry}></ellipse>
          ${repeat(
            spots,
            (s) => s.key,
            (s) => {
              const d = s.d ?? "";
              const f = flow(s);
              return svg`<path class="ui-mgr__link" data-to=${s.key} ?data-off=${offOf(s)} ?data-active=${!!f} d=${d}></path>${
                f ? svg`<path class="ui-mgr__pulse" data-to=${s.key} data-flow=${f} pathLength="100" d=${d}></path>` : nothing
              }${s.end ? svg`<circle class="ui-mgr__joint" ?data-active=${!!f} cx=${s.end.x} cy=${s.end.y} r="3"></circle>` : nothing}`;
            },
          )}
        </svg>
        ${this.renderAgent()}
        ${listbox(
          spots.filter((s) => s.side === "left").map((s) => this.renderCard(s, stop, pos(s), lit, rest.length)),
          spots.filter((s) => s.side === "right").map((s) => this.renderCard(s, stop, pos(s), lit, rest.length)),
        )}
      </div>`;
    }
    const forgot = this.forgot;
    return html`
      <span class="ui-mgr__sr" role="status">${this.announce}</span>
      <span class="ui-mgr__sr" id=${`${id}-keys`}>Up and down move along a side, left and right cross to the other side; Enter opens a card; Delete forgets a memory</span>
      ${cardHead({ icon: headIcon, title: this.heading, subtitle: this.description, id: `${id}-title`, aside })}
      <div class="ui-mgr__card">
        <div class="ui-mgr__body" data-mode=${mode}>
          ${stage}
          ${this.renderPanel(rest)}
          ${forgot
            ? html`<div class="ui-mgr__undo">
                <span class="ui-mgr__undo-text">Forgot “${forgot.memory.text}”</span>
                <button type="button" class="ui-mgr__undo-btn" @click=${() => this.undo()}>Undo</button>
              </div>`
            : nothing}
        </div>
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="mgr"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="mgr"] {
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
/* The connectors' colours and how long a light takes to run along one – override on the element */
[data-ui="mgr"] { --tc-mgr-link: var(--tc-border-strong); --tc-mgr-light: var(--tc-accent-solid); --tc-mgr-pulse: var(--tc-duration-shimmer); --tc-mgr-track-w: var(--tc-space-7); --tc-mgr-track-h: var(--tc-space-4); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="mgr"] { --tc-mgr-bg: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="mgr"] { --tc-mgr-bg: var(--tc-surface-raised); }
[data-ui="mgr"] *, [data-ui="mgr"] *::before, [data-ui="mgr"] *::after { box-sizing: border-box; }
:where([data-ui="mgr"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="mgr"] :is(button, a, [role="option"]):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="mgr"] :is(h4, p, ul, dl, dd) { margin: 0; }
[data-ui="mgr"] ul { padding: 0; list-style: none; }
[data-ui="mgr"] svg { display: block; flex: none; }
.ui-mgr__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-mgr__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-mgr__summary { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
/* ----- The body: the ring, then the open card's details and Undo ----- */
.ui-mgr__body { display: flex; flex-direction: column; align-items: center; gap: var(--tc-space-4); padding: var(--tc-space-4); }
.ui-mgr__body[data-mode="list"] { align-items: stretch; gap: var(--tc-space-3); padding: var(--tc-space-3); }
.ui-mgr__stage { position: relative; flex: none; max-width: 100%; isolation: isolate; }
.ui-mgr__links { position: absolute; inset: 0; z-index: 0; overflow: visible; pointer-events: none; }
.ui-mgr__link { fill: none; stroke: var(--tc-mgr-link); stroke-width: 1.25px; transition: stroke var(--tc-duration-base) var(--tc-ease-standard); }
.ui-mgr__link[data-off] { stroke-dasharray: 3 4; }
/* The ring the cards sit on, faint behind them, and a dot where each connector meets its card */
.ui-mgr__orbit { fill: none; stroke: var(--tc-border-default); stroke-width: 1px; stroke-dasharray: 2 6; }
.ui-mgr__joint { fill: var(--tc-mgr-bg); stroke: var(--tc-mgr-link); stroke-width: 1.25px; }
.ui-mgr__joint[data-active] { fill: var(--tc-mgr-light); stroke: var(--tc-mgr-light); }
.ui-mgr__link[data-active] { stroke: var(--tc-mgr-light); }
/* A light running along a connector – out to a tool or memory, or in towards the agent */
.ui-mgr__pulse { fill: none; stroke: var(--tc-mgr-light); stroke-width: 3px; stroke-linecap: round; stroke-dasharray: 8 92; stroke-dashoffset: 100; animation: tc-mgr-out var(--tc-mgr-pulse) linear infinite; }
.ui-mgr__pulse[data-flow="in"] { stroke-dashoffset: 0; animation-name: tc-mgr-in; }
@keyframes tc-mgr-out { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
@keyframes tc-mgr-in { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 100; } }
.ui-mgr__cards { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
.ui-mgr__body[data-mode="list"] .ui-mgr__cards { position: static; display: grid; gap: var(--tc-space-3); pointer-events: auto; }
.ui-mgr__body[data-mode="list"] .ui-mgr__group { display: grid; gap: var(--tc-space-1); }
.ui-mgr__body[data-mode="list"] .ui-mgr__group::before { content: attr(aria-label); padding: 0 var(--tc-space-1); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-tracking-caps); text-transform: uppercase; color: var(--tc-text-muted); }
/* ----- The agent in the middle ----- */
.ui-mgr__agent { position: absolute; top: 50%; left: 50%; z-index: 2; width: ${AGENT_W}px; transform: translate(-50%, -50%); }
.ui-mgr__body[data-mode="list"] .ui-mgr__agent { position: relative; top: auto; left: auto; width: auto; transform: none; }
.ui-mgr__agent-btn { display: grid; justify-items: center; gap: var(--tc-space-0-5); width: 100%; padding: var(--tc-space-3) !important; border-radius: var(--tc-radius-lg); background: var(--tc-mgr-bg) !important; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default), var(--tc-shadow-raised); text-align: center !important; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mgr__agent-btn:hover { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong), var(--tc-shadow-raised); }
.ui-mgr__agent[data-busy] .ui-mgr__agent-btn { box-shadow: inset 0 0 0 1.5px var(--tc-mgr-light), var(--tc-shadow-raised); }
.ui-mgr__body[data-mode="list"] .ui-mgr__agent-btn { grid-template-columns: auto 1fr; justify-items: start; align-items: center; column-gap: var(--tc-space-2); text-align: left !important; }
.ui-mgr__body[data-mode="list"] .ui-mgr__agent-icon { grid-row: span 2; }
.ui-mgr__agent-icon { display: grid; place-items: center; width: 32px; height: 32px; border-radius: var(--tc-radius-full); background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
.ui-mgr__agent-icon > svg { width: 18px; height: 18px; }
.ui-mgr__agent[data-busy] .ui-mgr__agent-icon > svg { animation: tc-mgr-twinkle var(--tc-mgr-pulse) var(--tc-ease-standard) infinite; }
@keyframes tc-mgr-twinkle { 50% { transform: scale(0.82) rotate(12deg); } }
.ui-mgr__agent-name { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-mgr__agent-activity { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
.ui-mgr__agent[data-busy] .ui-mgr__agent-activity { color: var(--tc-accent-text); font-weight: var(--tc-font-weight-medium); }
.ui-mgr__menu { position: absolute; top: calc(100% + var(--tc-space-1)); left: 50%; z-index: 3; display: grid; gap: var(--tc-space-0-5); min-width: 11rem; padding: var(--tc-space-1); transform: translateX(-50%); border-radius: var(--tc-radius-md); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default), var(--tc-shadow-overlay); }
.ui-mgr__menu[hidden] { display: none; }
.ui-mgr__menu-item { display: flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2) !important; border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); }
.ui-mgr__menu-item:hover { background: var(--tc-action-ghost-bg-hover); }
.ui-mgr__menu-item svg { width: 15px; height: 15px; color: var(--tc-icon-muted); }
/* ----- A card: a memory, a tool or "+N more" ----- */
.ui-mgr__node { position: absolute; display: flex; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-2); border-radius: var(--tc-radius-md); background: var(--tc-mgr-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); pointer-events: auto; cursor: pointer; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-mgr__body[data-mode="list"] .ui-mgr__node { position: relative; min-height: var(--tc-control-h-lg); }
.ui-mgr__node:hover { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); }
/* Reached by a light: the accent ring and a soft accent fill */
.ui-mgr__node[data-lit] { background: var(--tc-accent-subtle); box-shadow: inset 0 0 0 1.5px var(--tc-mgr-light); }
/* Off: dashed and quiet, with text that keeps its contrast */
.ui-mgr__node[data-off] { background: var(--tc-surface-sunken); box-shadow: none; outline: var(--tc-hairline) dashed var(--tc-border-strong); outline-offset: calc(-1 * var(--tc-hairline)); }
.ui-mgr__node[data-off]:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-mgr__node[data-selected] { box-shadow: inset 0 0 0 1.5px var(--tc-border-selected), var(--tc-shadow-raised); }
.ui-mgr__more { flex-direction: column; justify-content: center; align-items: flex-start; gap: 0; background: var(--tc-surface-sunken); }
.ui-mgr__more-count { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); }
.ui-mgr__icon { display: grid; flex: none; place-items: center; width: 28px; height: 28px; border-radius: var(--tc-radius-sm); background: var(--tc-surface-sunken); color: var(--tc-text-secondary); }
.ui-mgr__icon > svg { width: 15px; height: 15px; }
.ui-mgr__node[data-lit] .ui-mgr__icon { background: var(--tc-mgr-bg); color: var(--tc-accent-text); }
.ui-mgr__initials { font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-none); }
.ui-mgr__text { display: grid; flex: 1; gap: var(--tc-space-0-5); min-width: 0; }
.ui-mgr__name { overflow: hidden; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); text-overflow: ellipsis; white-space: nowrap; }
.ui-mgr__sub { overflow: hidden; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.ui-mgr__node[data-off] .ui-mgr__name { color: var(--tc-text-secondary); }
.ui-mgr__off { font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-secondary); }
/* ----- The open card's details ----- */
.ui-mgr__panel { display: grid; align-content: start; gap: var(--tc-space-3); width: 100%; max-width: 36rem; padding: var(--tc-space-3) var(--tc-space-4); border-radius: var(--tc-radius-md); background: var(--tc-surface-sunken); }
.ui-mgr__panel-head { display: flex; align-items: center; gap: var(--tc-space-2); }
.ui-mgr__panel-head .ui-mgr__icon { background: var(--tc-mgr-bg); }
.ui-mgr__panel-text { display: grid; flex: 1; min-width: 0; }
.ui-mgr__panel-text .ui-mgr__sub { white-space: normal; }
.ui-mgr__panel-title { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-mgr__close { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mgr__close:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-mgr__close svg { width: 16px; height: 16px; }
.ui-mgr__facts { display: grid; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-mgr__fact { display: grid; grid-template-columns: 8rem 1fr; gap: var(--tc-space-2); }
.ui-mgr__fact dt { color: var(--tc-text-muted); }
.ui-mgr__fact dd { min-width: 0; color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-mgr__link { color: var(--tc-accent-text); font-weight: var(--tc-font-weight-medium); text-decoration: underline; text-underline-offset: 2px; }
.ui-mgr__note { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); }
.ui-mgr__panel-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2); }
.ui-mgr__switch { display: inline-flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); }
.ui-mgr__track { position: relative; flex: none; width: var(--tc-mgr-track-w); height: var(--tc-mgr-track-h); border-radius: var(--tc-radius-full); background: var(--tc-fill-strong); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mgr__thumb { position: absolute; top: var(--tc-space-0-5); left: var(--tc-space-0-5); width: calc(var(--tc-mgr-track-h) - var(--tc-space-1)); height: calc(var(--tc-mgr-track-h) - var(--tc-space-1)); border-radius: var(--tc-radius-full); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-control); transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mgr__switch[aria-checked="true"] .ui-mgr__track { background: var(--tc-action-primary-bg); }
.ui-mgr__switch[aria-checked="true"] .ui-mgr__thumb { transform: translateX(calc(var(--tc-mgr-track-w) - var(--tc-mgr-track-h))); }
.ui-mgr__forget, .ui-mgr__undo-btn { display: inline-flex; align-items: center; height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm) !important; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg) !important; box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-font-size-sm); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mgr__forget:hover, .ui-mgr__undo-btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-mgr__forget { color: var(--tc-status-danger-fg); }
.ui-mgr__rest { display: grid; gap: var(--tc-space-1); }
.ui-mgr__rest-item { display: grid; gap: var(--tc-space-0-5); width: 100%; min-height: var(--tc-control-h-md); padding: var(--tc-space-1-5) var(--tc-space-2) !important; border-radius: var(--tc-radius-md); background: var(--tc-mgr-bg) !important; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-mgr__rest-item:hover { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); }
/* ----- Undo after forgetting ----- */
.ui-mgr__undo { display: flex; align-items: center; gap: var(--tc-space-3); max-width: 100%; padding: var(--tc-space-1-5) var(--tc-space-1-5) var(--tc-space-1-5) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-surface-sunken); font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); animation: tc-mgr-rise var(--tc-duration-base) var(--tc-ease-out); }
.ui-mgr__undo-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
@keyframes tc-mgr-rise { from { transform: translateY(var(--tc-space-1)); } }
.ui-mgr__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@media (forced-colors: active) {
  .ui-mgr__link { stroke: CanvasText; }
  .ui-mgr__link[data-active], .ui-mgr__pulse { stroke: Highlight; }
  .ui-mgr__node, .ui-mgr__agent-btn { border: 1px solid CanvasText; }
  .ui-mgr__node[data-selected], .ui-mgr__node[data-lit] { border: 2px solid Highlight; }
  .ui-mgr__switch[aria-checked="true"] .ui-mgr__track { background: Highlight; forced-color-adjust: none; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-mgr__pulse { display: none; }
  [data-ui="mgr"] *, [data-ui="mgr"] *::before, [data-ui="mgr"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-memory-graph")) customElements.define("tc-memory-graph", TcMemoryGraph);

declare global {
  interface HTMLElementTagNameMap {
    "tc-memory-graph": TcMemoryGraph;
  }
}
