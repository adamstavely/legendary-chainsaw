import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import "./button";

/*
 * <tc-agent-gallery> – a showcase: slim vertical panels side by side, each with the same soft gradient artwork in its
 * own colours. The panel in the middle is open and shows a product screen; pick a side panel (or use the arrows) and
 * it glides open in the middle while the current one folds into a slim panel at the side. The Lit port of
 * blocks/agent-gallery.tsx – one look for both looks, as the block had.
 * The list is laid out three times in a row and the track slides so the open panel sits in the middle: moving any
 * distance is one glide, and afterwards the position quietly jumps back into the middle copy.
 * Keyboard: ←/→ on the panels move one agent; each side panel is a button ("Show <agent>"); the arrow buttons below
 * do the same. Focus never drops to <body>: when the panel that had it opens or jumps, focus goes to the same agent's
 * button nearest the open panel, or into the open panel's screen. The caption is a polite live region.
 *
 *   <tc-agent-gallery .items=${[…]} index="2"></tc-agent-gallery>
 */

export type GalleryItem = {
  id: string;
  name: string;
  description: string;
  /** Two colours for the gradient artwork – strong, then soft */
  colors: [string, string];
  /** What the agent reacts to */
  trigger: string;
  /** Steps shown under Instructions */
  steps: string[];
  /** Skills shown as chips */
  skills: string[];
  /** A rule shown under Guardrails */
  guardrail: string;
};

/** Detail of tc-index-change */
export type GalleryIndexChange = { index: number; item: GalleryItem };

/** A colour from data, or transparent – nothing that could end the declaration or load a URL */
const colour = (v: unknown) => (typeof v === "string" && /^[#\w(),.%\s/-]+$/.test(v) && !/url\(/i.test(v) ? v : "transparent");

/** ms – width and track glide together (--tc-agent-gallery-move in the styles) */
const MOVE = 620;

/**
 * A showcase of agents as slim gradient panels, one open in the middle with its product screen.
 * @tag tc-agent-gallery
 * @fires tc-index-change - Another agent was picked – a panel, an arrow button or an arrow key (`{ index, item }`: GalleryIndexChange); cancelable – prevented, `index` stays as it was
 */
export class TcAgentGallery extends TcElement {
  static override ui = "ag";

  /** The heading, and the carousel's name */
  @property() accessor heading = "Agents that run your playbook";
  /** The line under the heading */
  @property() accessor subtitle = "Give each agent its steps, tools and limits – then let it work inside the tools your team already uses.";
  /** The agents */
  @property({ attribute: false }) accessor items: GalleryItem[] = defaultGalleryItems;
  /** The open agent's index – unset, the middle one. The gallery glides there the short way round */
  @property({ type: Number }) accessor index: number | undefined = undefined;

  /** Where the track is, in the tripled strip */
  @state() private accessor pos = -1;
  /** The quiet jump back into the middle copy renders without transitions */
  @state() private accessor snap = false;

  #timer: ReturnType<typeof setTimeout> | undefined;
  #frames: number[] = [];
  #lastFocus: HTMLElement | null = null;
  #label: string | null = null;

  get #n() {
    return this.items.length;
  }
  #wrap(i: number) {
    const n = this.#n;
    return n ? ((i % n) + n) % n : 0;
  }
  /** The open agent's index */
  get activeIndex() {
    return this.#wrap(this.pos);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener("focusin", this.#remember);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("focusin", this.#remember);
    clearTimeout(this.#timer);
    this.#timer = undefined;
    for (const f of this.#frames) cancelAnimationFrame(f);
    this.#frames = [];
    // Back in the page, it settles in the middle copy without gliding
    if (this.#n && (this.pos < this.#n || this.pos >= 2 * this.#n)) this.pos = this.#n + this.activeIndex;
    this.snap = false;
  }

  #remember = (e: FocusEvent) => {
    if ((e.target as Element).closest?.(".ui-ag__viewport")) this.#lastFocus = e.target as HTMLElement;
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const n = this.#n;
    if (!this.hasAttribute("aria-roledescription")) this.setAttribute("aria-roledescription", "carousel");
    if (changed.has("heading") && (!this.hasAttribute("aria-label") || this.getAttribute("aria-label") === this.#label)) {
      this.setAttribute("aria-label", this.heading);
      this.#label = this.heading;
    }
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    if (!n) return;
    if (this.pos < 0 || changed.has("items")) this.pos = n + this.#wrap(this.index ?? Math.floor(n / 2));
    // Controlled: follow `index`, the short way round
    else if (changed.has("index") && this.index !== undefined && this.#wrap(this.index) !== this.activeIndex) {
      const ahead = this.#wrap(this.#wrap(this.index) - this.activeIndex);
      this.pos += ahead <= n / 2 ? ahead : ahead - n;
    }
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    const n = this.#n;
    if (changed.has("pos") && n) {
      this.#refocus();
      // Out of the middle copy: once the glide ends, jump back into it without transitions
      clearTimeout(this.#timer);
      if (this.pos < n || this.pos >= 2 * n)
        this.#timer = setTimeout(() => {
          this.#timer = undefined;
          this.snap = true;
          this.pos = this.pos < n ? this.pos + n : this.pos - n;
        }, MOVE + 40);
    }
    if (changed.has("snap") && this.snap) {
      // Two frames: the jump renders without transitions, then they switch back on
      const first = requestAnimationFrame(() => {
        const second = requestAnimationFrame(() => {
          this.#frames = this.#frames.filter((f) => f !== second);
          this.snap = false;
        });
        this.#frames = [...this.#frames.filter((f) => f !== first), second];
      });
      this.#frames.push(first);
    }
  }

  /** Focus never drops to <body>: the agent's own button nearest the open panel, else the open screen */
  #refocus() {
    const vp = this.querySelector<HTMLElement>(".ui-ag__viewport");
    const prev = this.#lastFocus;
    if (!vp || !prev) return;
    const active = this.ownerDocument.activeElement;
    const gone = !prev.isConnected || !!prev.closest('[aria-hidden="true"], [inert]');
    if (!gone || (active && active !== this.ownerDocument.body && active !== prev)) return;
    // The agent that just opened has no button any more – its screen takes focus
    const key = prev.getAttribute("data-focus-key");
    const same =
      key && key !== this.items[this.activeIndex]?.id
        ? [...vp.querySelectorAll<HTMLElement>(`[data-focus-key="${CSS.escape(key)}"]`)]
            .filter((b) => !b.closest('[aria-hidden="true"]'))
            .sort((a, b) => Math.abs(Number(a.dataset.j) - this.pos) - Math.abs(Number(b.dataset.j) - this.pos))[0]
        : undefined;
    const target = same ?? vp.querySelector<HTMLElement>(".ui-ag__panel[data-open] .ui-ag__screen");
    this.#lastFocus = target ?? null;
    target?.focus({ preventScroll: true });
  }

  #go(next: number) {
    const n = this.#n;
    if (!n) return;
    const to = Math.max(0, Math.min(3 * n - 1, next));
    const index = this.#wrap(to);
    if (index === this.activeIndex) return;
    if (!this.emit<GalleryIndexChange>("tc-index-change", { index, item: this.items[index] }, { cancelable: true })) return;
    this.pos = to;
    this.index = index;
  }

  #onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      this.#go(this.pos + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      this.#go(this.pos - 1);
    }
  };

  protected override render() {
    const items = this.items;
    const n = items.length;
    const current = items[this.activeIndex];
    const strip = n ? [...items, ...items, ...items].map((item, j) => ({ item, j })) : [];
    return html`
      <header class="ui-ag__head">
        <h2>${this.heading}</h2>
        <p>${this.subtitle}</p>
      </header>
      <div class="ui-ag__viewport" @keydown=${this.#onKey}>
        <div class="ui-ag__track" ?data-snap=${this.snap} style=${`--pos: ${this.pos}`}>
          ${repeat(
            strip,
            ({ item, j }) => `${Math.floor(j / n)}-${item.id}`,
            ({ item, j }) => {
              const open = j === this.pos;
              const distance = Math.abs(j - this.pos);
              return html`<div
                class="ui-ag__panel"
                ?data-open=${open}
                ?data-far=${distance >= 2}
                style=${`--a: ${colour(item.colors?.[0])}; --b: ${colour(item.colors?.[1])}`}
                aria-hidden=${ifDefined(distance > 3 ? "true" : undefined)}
              >
                <span class="ui-ag__art" aria-hidden="true"></span>
                ${
                  // Nearby panels keep their screen, so it can fade out as a panel folds and fade in as it opens
                  distance <= 3 ? screen(item, !open) : nothing
                }
                ${open
                  ? nothing
                  : html`<button
                      type="button"
                      class="ui-ag__pick"
                      aria-label=${`Show ${item.name}`}
                      data-focus-key=${item.id}
                      data-j=${j}
                      tabindex=${ifDefined(distance > 3 ? -1 : undefined)}
                      @click=${() => this.#go(j)}
                    >
                      <span class="ui-ag__label">${item.name}</span>
                    </button>`}
              </div>`;
            },
          )}
        </div>
      </div>
      <div class="ui-ag__foot">
        <!-- Kept from the start, so screen readers hear each newly opened agent; only the text inside fades in -->
        <p class="ui-ag__caption" aria-live="polite" aria-atomic="true">
          ${current
            ? repeat(
                [current],
                (c) => c.id,
                (c) => html`<span class="ui-ag__caption-text"><b>${c.name}.</b> ${c.description}</span>`,
              )
            : nothing}
        </p>
        <div class="ui-ag__arrows">
          <tc-button variant="secondary" label="Previous agent" hide-label @click=${() => this.#go(this.pos - 1)}
            >${svg`<svg slot="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m0 0 6-6m-6 6 6 6" /></svg>`}</tc-button
          >
          <tc-button variant="secondary" label="Next agent" hide-label @click=${() => this.#go(this.pos + 1)}
            >${svg`<svg slot="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m0 0-6-6m6 6-6 6" /></svg>`}</tc-button
          >
        </div>
      </div>
    `;
  }

  static override css = /* css */ `
[data-ui="ag"] {
  --tc-ag-space-36px: 36px;
  --tc-ag-space-22px: 22px;
  --tc-ag-space-7px: 7px;
  --tc-ag-space-5px: 5px;
  --tc-ag-space-560px: 560px;
  --tc-ag-space-400px: 400px;
  --tc-ag-space-1px: 1px;
  --tc-ag-space-3px: 3px;
  --tc-ag-space-9px: 9px;
  --tc-ag-space-26px: 26px;
  --tc-ag-fs-7_5px: 7.5px;
  --tc-ag-fs-9px: 9px;
  --tc-ag-fs-10_5px: 10.5px;
  --tc-ag-fs-8_5px: 8.5px;
  --tc-ag-track--0_025em: -0.025em;
  --tc-agent-gallery-base-top: light-dark(#f4f4f6, #232326);
  --tc-agent-gallery-base-bottom: light-dark(#e9e9ee, #1a1a1c);
  --tc-agent-gallery-shine: light-dark(rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.08));
  --tc-agent-gallery-screen-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 20px 50px -20px light-dark(rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.5));
  /* The glide: width and track move together (MOVE in the script) */
  --tc-agent-gallery-move: 620ms;
  --tc-agent-gallery-height: 560px;
  --tc-agent-gallery-side: 104px;
  --tc-agent-gallery-gap: 14px;
  --tc-agent-gallery-open: min(70cqw, 1120px);
  container-type: inline-size;
  overflow: hidden;
  padding: var(--tc-space-2) 0 var(--tc-space-1);
  font-family:  var(--tc-font-sans);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="ag"] *, [data-ui="ag"] *::before, [data-ui="ag"] *::after { box-sizing: border-box; }

.ui-ag__head { max-width: 620px; margin: 0 auto var(--tc-ag-space-36px); padding: 0 var(--tc-space-5); text-align: center; }
.ui-ag__head h2 { margin: 0; font-size: var(--tc-font-size-4xl); font-weight: var(--tc-font-weight-semibold); letter-spacing: var(--tc-ag-track--0_025em); line-height: var(--tc-line-height-display); }
.ui-ag__head p { margin: var(--tc-space-3) 0 0; font-size: var(--tc-font-size-xl); line-height: var(--tc-line-height-loose); color: var(--tc-text-muted); }

/* ---------- Track: slim panels, one open in the middle ---------- */

.ui-ag__viewport { overflow: hidden; }
/* The track slides so the open panel's centre lands in the middle of the block */
.ui-ag__track {
  display: flex;
  gap: var(--tc-agent-gallery-gap);
  width: max-content;
  height: var(--tc-agent-gallery-height);
  transform: translateX(calc(50cqw - var(--pos) * (var(--tc-agent-gallery-side) + var(--tc-agent-gallery-gap)) - var(--tc-agent-gallery-open) / 2));
  transition: transform var(--tc-agent-gallery-move) var(--tc-ease-in-out);
}
.ui-ag__track[data-snap],
.ui-ag__track[data-snap] * { transition: none !important; animation: none !important; }
.ui-ag__panel {
  position: relative;
  flex: 0 0 var(--tc-agent-gallery-side);
  overflow: hidden;
  border-radius: var(--tc-radius-3xl);
  transition: flex-basis var(--tc-agent-gallery-move) var(--tc-ease-in-out);
}
.ui-ag__panel[data-open] { flex-basis: var(--tc-agent-gallery-open); }
/* Hovering a side panel only brings its color up – the width stays */

/* One artwork for every panel – only the two colors change. Side panels are muted until hovered */
.ui-ag__art {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(118deg, transparent 38%, var(--tc-agent-gallery-shine) 47%, transparent 57%),
    radial-gradient(110% 80% at 0% 0%, color-mix(in srgb, var(--a) 70%, transparent) 0%, transparent 60%),
    radial-gradient(90% 70% at 100% 100%, var(--b) 0%, transparent 72%),
    radial-gradient(60% 50% at 30% 100%, color-mix(in srgb, var(--a) 28%, transparent) 0%, transparent 70%),
    linear-gradient(180deg, var(--tc-agent-gallery-base-top), var(--tc-agent-gallery-base-bottom));
  filter: saturate(0.35);
  transition: filter var(--tc-duration-slowest) var(--tc-ease-standard), transform var(--tc-duration-reveal-slow) var(--tc-ease-in-out);
}
.ui-ag__panel:hover .ui-ag__art { filter: none; }
.ui-ag__panel[data-open] .ui-ag__art { filter: none; }
.ui-ag__panel[data-far] .ui-ag__art { filter: saturate(0.12); }

.ui-ag__pick {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  padding: 0 0 var(--tc-ag-space-22px) var(--tc-space-4);
  margin: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  animation: ui-ag-fade var(--tc-duration-slower) var(--tc-ease-standard) var(--tc-duration-base) both;
}
/* The pick fills the whole panel, so its ring sits just inside the panel's rounded edge */
.ui-ag__pick:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width) - 2px); border-radius: var(--tc-radius-3xl); }
.ui-ag__screen:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-ag__label {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: var(--tc-font-size-xl);
  font-weight: var(--tc-font-weight-medium);
  letter-spacing: var(--tc-tracking-snug);
  white-space: nowrap;
  color: color-mix(in srgb, var(--a) 70%, var(--tc-text-secondary));
  opacity: 0.85;
}
.ui-ag__panel[data-far] .ui-ag__label { color: var(--tc-text-muted); }

/* ---------- Screen ---------- */

.ui-ag__screen {
  position: absolute;
  top: 44px;
  left: 44px;
  /* Fits the open panel side to side (cut only at the bottom); on small screens it runs off the right edge */
  width: max(640px, calc(100% - 88px));
  min-height: 620px;
  overflow: hidden;
  border-radius: var(--tc-radius-2xl);
  background: var(--tc-surface-sunken);
  box-shadow: var(--tc-agent-gallery-screen-shadow);
  font-size: var(--tc-font-size-xs);
  color: var(--tc-text-secondary);
  /* Folding away: fades and drifts off quickly while the panel narrows */
  opacity: 0;
  transform: translate(28px, 14px) scale(0.98);
  transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard), transform var(--tc-duration-slower) var(--tc-ease-in-out);
}
/* Opening: comes in once the panel has mostly widened */
.ui-ag__panel[data-open] .ui-ag__screen {
  opacity: 1;
  transform: none;
  transition: opacity var(--tc-duration-slower) var(--tc-ease-standard) var(--tc-duration-moderate), transform var(--tc-agent-gallery-move) var(--tc-ease-in-out) var(--tc-duration-base);
}
.ui-ag__screen svg { width: 13px; height: 13px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.ui-ag__screen u { text-decoration: underline; text-decoration-color: var(--tc-border-default); text-underline-offset: 3px; text-decoration-thickness: 1.5px; color: var(--tc-text-primary); }

/* App bar */
.ui-ag__bar { display: flex; align-items: center; gap: var(--tc-space-3); height: 48px; padding: 0 var(--tc-space-3-5); background: var(--tc-surface-raised); }
.ui-ag__brand { width: 18px; height: 18px; border-radius: var(--tc-radius-xs); background: var(--tc-text-primary); }
.ui-ag__switch {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-ag-space-7px);
  height: 28px;
  padding: 0 var(--tc-space-2) 0 var(--tc-space-1-5);
  border-radius: var(--tc-radius-md);
  box-shadow: inset 0 0 0 1px var(--tc-border-default);
  font-size: var(--tc-font-size-xs);
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-text-primary);
}
.ui-ag__switch svg { width: 12px; height: 12px; color: var(--tc-text-muted); }
.ui-ag__mark, .ui-ag__logo { border-radius: var(--tc-radius-xs); background: linear-gradient(135deg, var(--a), var(--b)); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35); }
.ui-ag__mark { width: 16px; height: 16px; }
.ui-ag__new {
  margin-left: auto;
  padding: var(--tc-ag-space-5px) var(--tc-space-2-5);
  border-radius: var(--tc-radius-md);
  box-shadow: var(--tc-action-secondary-shadow);
  font-size: var(--tc-font-size-xs);
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-text-primary);
}
.ui-ag__avatar {
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  flex: none;
  border-radius: 50%;
  background: var(--tc-fill-default);
  box-shadow: inset 0 0 0 1px var(--tc-border-default);
  font-size: var(--tc-ag-fs-7_5px);
  font-weight: var(--tc-avatar-font-weight);
  color: var(--tc-text-secondary);
}
.ui-ag__bar .ui-ag__avatar { width: 26px; height: 26px; font-size: var(--tc-ag-fs-9px); }

/* Page */
.ui-ag__page { padding: var(--tc-space-4) max(var(--tc-space-7), calc((100% - var(--tc-ag-space-560px)) / 2)) var(--tc-space-6); }
.ui-ag__hero { display: flex; align-items: flex-start; justify-content: space-between; }
.ui-ag__logo { width: 30px; height: 30px; border-radius: var(--tc-radius-md); }
.ui-ag__sync { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-ag__page h3 { margin: var(--tc-space-2) 0 var(--tc-space-0-5); font-size: var(--tc-font-size-lg-plus); font-weight: var(--tc-font-weight-semibold); letter-spacing: var(--tc-tracking-snug); color: var(--tc-text-primary); }
.ui-ag__sub { margin: 0 0 var(--tc-space-3); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-ag__kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-bottom: var(--tc-space-3); }
.ui-ag__kpis > div {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 54px;
  grid-template-areas: "label spark" "value spark";
  column-gap: var(--tc-space-2);
  padding: 0 var(--tc-space-3);
  border-left: 1px solid var(--tc-border-default);
}
.ui-ag__kpis > div:first-child { padding-left: 0; border-left: 0; }
.ui-ag__kpis span { grid-area: label; font-size: var(--tc-ag-fs-10_5px); color: var(--tc-text-muted); white-space: nowrap; }
.ui-ag__kpis b { grid-area: value; font-size: var(--tc-font-size-lg-plus); font-weight: var(--tc-font-weight-semibold); letter-spacing: var(--tc-tracking-tight); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-ag__screen .ui-ag__spark { grid-area: spark; align-self: end; width: 54px; height: 20px; margin-bottom: var(--tc-space-0-5); overflow: visible; }
.ui-ag__spark path { fill: none; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.ui-ag__tabs { display: flex; gap: var(--tc-space-4); margin: 0 calc(var(--tc-ag-space-400px) * -1) var(--tc-space-3-5); padding: 0 var(--tc-ag-space-400px); border-bottom: 1px solid var(--tc-border-default); }
.ui-ag__tabs > * { padding: 0 var(--tc-ag-space-1px) var(--tc-space-2); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-ag__tabs b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); box-shadow: inset 0 -1.5px 0 var(--tc-text-primary); }
.ui-ag__page h4 { margin: 0; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); }
.ui-ag__hint { margin: var(--tc-ag-space-3px) 0 var(--tc-space-3); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-ag__toolbar { display: flex; gap: var(--tc-space-1-5); margin-bottom: var(--tc-space-3-5); }
.ui-ag__search, .ui-ag__filter {
  display: flex;
  align-items: center;
  gap: var(--tc-ag-space-7px);
  height: 30px;
  padding: 0 var(--tc-space-2-5);
  border-radius: var(--tc-radius-lg);
  background: var(--tc-surface-raised);
  box-shadow: inset 0 0 0 1px var(--tc-border-default);
  font-size: var(--tc-font-size-xs);
  color: var(--tc-text-muted);
}
.ui-ag__search { flex: 1; }
.ui-ag__filter { color: var(--tc-text-primary); }

/* Feed: a thin line connects the icons on the left */
.ui-ag__feed { position: relative; display: grid; gap: var(--tc-space-3); margin: 0; padding: 0; list-style: none; }
.ui-ag__feed::before { content: ""; position: absolute; left: 12px; top: 24px; bottom: 8px; width: 1px; background: var(--tc-border-default); }
.ui-ag__feed li { position: relative; display: grid; grid-template-columns: 25px 1fr; gap: var(--tc-space-2-5); align-items: start; }
.ui-ag__compose .ui-ag__avatar { width: 25px; height: 25px; font-size: var(--tc-ag-fs-8_5px); }
.ui-ag__box {
  display: grid;
  gap: var(--tc-space-4-5);
  padding: var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-2) var(--tc-space-3);
  border-radius: var(--tc-radius-xl);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  color: var(--tc-text-muted);
}
.ui-ag__box-foot { display: flex; align-items: center; justify-content: space-between; }
.ui-ag__box-foot b { padding: var(--tc-space-1) var(--tc-ag-space-9px); border-radius: var(--tc-radius-md); background: var(--tc-fill-default); font-size: var(--tc-ag-fs-10_5px); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-ag__dot {
  display: grid;
  place-items: center;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  background: var(--tc-surface-sunken);
  box-shadow: inset 0 0 0 1px var(--tc-border-default);
  color: var(--tc-text-muted);
}
.ui-ag__dot svg { width: 12px; height: 12px; }
.ui-ag__dot--app { background: linear-gradient(135deg, var(--a), var(--b)); box-shadow: none; color: #fff; }
.ui-ag__line { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-ag-space-5px); margin: var(--tc-ag-space-5px) 0 0; color: var(--tc-text-muted); }
.ui-ag__line b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-ag__ext { width: 9px; height: 11px; border-radius: var(--tc-radius-2xs); background: #e5484d; }
.ui-ag__ext[data-kind="csv"] { background: #30a46c; }
.ui-ag__card {
  margin: var(--tc-ag-space-7px) 0 0;
  padding: var(--tc-ag-space-9px) var(--tc-space-3);
  border-radius: var(--tc-radius-lg);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  line-height: var(--tc-line-height-snug);
  color: var(--tc-text-primary);
}

/* ---------- Caption and arrows ---------- */

.ui-ag__foot {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--tc-space-6);
  width: var(--tc-agent-gallery-open);
  margin: var(--tc-ag-space-26px) auto 0;
}
.ui-ag__caption {
  max-width: 520px;
  margin: 0;
  font-size: var(--tc-font-size-2xl);
  line-height: var(--tc-line-height-display-sm);
  letter-spacing: var(--tc-tracking-snug);
  color: var(--tc-text-muted);
}
.ui-ag__caption-text { animation: ui-ag-fade var(--tc-duration-slower) var(--tc-ease-standard) both; }
.ui-ag__caption b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
/* The library's secondary Buttons, side by side */
.ui-ag__arrows { display: flex; flex: none; gap: var(--tc-space-1-5); }
.ui-ag__arrows svg { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }

@keyframes ui-ag-fade { from { opacity: 0; } }

/* ---------- Narrow: the open panel takes most of the width, one slim panel peeks on each side ---------- */

@container (max-width: 760px) {
  [data-ui="ag"] { --tc-agent-gallery-height: 400px; --tc-agent-gallery-side: 56px; --tc-agent-gallery-gap: 10px; }
  [data-ui="ag"] { --tc-agent-gallery-open: calc(100cqw - 2 * (var(--tc-agent-gallery-side) + var(--tc-agent-gallery-gap)) - 24px); }
  .ui-ag__label { font-size: var(--tc-font-size-lg); }
  .ui-ag__pick { padding: 0 0 var(--tc-space-4) var(--tc-space-2-5); }
  .ui-ag__screen { top: 40px; left: 22px; }
  .ui-ag__foot { width: calc(100cqw - 40px); }
  .ui-ag__caption { font-size: var(--tc-font-size-xl); }
  .ui-ag__head h2 { font-size: var(--tc-font-size-3xl); }
}

@media (prefers-reduced-motion: reduce) {
  .ui-ag__track, .ui-ag__panel, .ui-ag__art { transition: none; }
  .ui-ag__caption-text, .ui-ag__pick { animation: none; }
  .ui-ag__screen, .ui-ag__panel[data-open] .ui-ag__screen { transition: none; }
}
`;
}

/* ---------- The product screen inside the open panel: the agent's workspace with its context feed ---------- */

/** Stable sample numbers per agent, so every panel shows something different */
const seed = (id: string) => [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 7);

/** A tiny sparkline: a wavy line ending in a dot */
const spark = (n: number, color: string) => {
  const pts = Array.from({ length: 10 }, (_, i) => [i * 8, 15 - ((n * (i + 5) * 7 + i * 3) % 13)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  const [lx, ly] = pts[pts.length - 1];
  return svg`<svg class="ui-ag__spark" viewBox="-2 -2 78 20" aria-hidden="true"><path d=${d} style=${`stroke: ${color}`} /><circle cx=${lx} cy=${ly} r="2.2" style=${`fill: ${color}`} /></svg>`;
};

const avatar = (name: string) =>
  html`<span class="ui-ag__avatar" aria-hidden="true"
    >${name
      .split(" ")
      .map((p) => p[0])
      .join("")}</span
  >`;

const glyph = (d: string) => svg`<svg viewBox="0 0 24 24" aria-hidden="true"><path d=${d} /></svg>`;
const G = {
  note: "M5 6.5A1.5 1.5 0 0 1 6.5 5h11A1.5 1.5 0 0 1 19 6.5v8a1.5 1.5 0 0 1-1.5 1.5H10l-4 3v-3h-.5A.5.5 0 0 1 5 15.5Z",
  chart: "M6 18V11M10 18V7M14 18v-5M18 18V9",
  file: "M8 3.5h6l4 4v12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1ZM14 3.5v4h4",
  plug: "M9 4v4M15 4v4M7 8h10v3a5 5 0 0 1-10 0V8ZM12 16v4",
  search: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM20 20l-4.5-4.5",
  clip: "m15.5 7.5-6.4 6.4a1.8 1.8 0 0 0 2.5 2.5l6.7-6.7a3.5 3.5 0 0 0-5-5l-6.9 6.9a5.2 5.2 0 0 0 7.4 7.4l6-6",
  sync: "M19 12a7 7 0 0 1-12.3 4.6M5 12a7 7 0 0 1 12.3-4.6M17.5 4v3.5H14M6.5 20v-3.5H10",
  filter: "M5 7h14M8 12h8M11 17h2",
};

function screen(item: GalleryItem, hidden: boolean) {
  const n = seed(item.id);
  const kpis: [string, string, string][] = [
    ["Runs", `${40 + (n % 160)}`, "#22a06b"],
    ["Success", `${94 + (n % 6)}%`, "#2f9bd6"],
    ["Time saved", `${(2 + (n % 70) / 10).toFixed(1)}h`, "#8b5cf6"],
    ["Escalated", `${1 + (n % 7)}`, "#ec4899"],
  ];
  const steps = item.steps ?? [];
  return html`<div
    class="ui-ag__screen"
    role="group"
    aria-label=${`${item.name} workspace`}
    tabindex=${ifDefined(hidden ? undefined : -1)}
    aria-hidden=${ifDefined(hidden ? "true" : undefined)}
    .inert=${hidden}
  >
    <div class="ui-ag__bar">
      <span class="ui-ag__brand" aria-hidden="true"></span>
      <span class="ui-ag__switch"
        ><span class="ui-ag__mark" aria-hidden="true"></span>${item.name}${svg`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4-4 4 4M8 14l4 4 4-4" /></svg>`}</span
      >
      <span class="ui-ag__new">+ New agent</span>
      ${avatar("Lena Hart")}
    </div>
    <div class="ui-ag__page">
      <div class="ui-ag__hero">
        <span class="ui-ag__logo" aria-hidden="true"></span>
        <span class="ui-ag__sync">3m ago ${glyph(G.sync)}</span>
      </div>
      <h3>${item.name}</h3>
      <p class="ui-ag__sub">Triggered by “${item.trigger}” · Owner Lena Hart</p>
      <div class="ui-ag__kpis">
        ${kpis.map(([label, value, color], i) => html`<div><span>${label}</span><b>${value}</b>${spark(n + i * 13, color)}</div>`)}
      </div>
      <div class="ui-ag__tabs"><span>Runs</span><span>Tools</span><b>Context</b><span>Settings</span></div>
      <h4>Agent context</h4>
      <p class="ui-ag__hint">Goals, files and rules the agent uses on every run.</p>
      <div class="ui-ag__toolbar">
        <span class="ui-ag__search">${glyph(G.search)} Search context…</span>
        <span class="ui-ag__filter">${glyph(G.filter)} All</span>
      </div>
      <ol class="ui-ag__feed">
        <li class="ui-ag__compose">
          ${avatar("Lena Hart")}
          <div class="ui-ag__box">
            <span>Add context, e.g. “${item.guardrail}”</span>
            <span class="ui-ag__box-foot">${glyph(G.clip)}<b>Add context</b></span>
          </div>
        </li>
        <li>
          <span class="ui-ag__dot">${glyph(G.note)}</span>
          <div>
            <p class="ui-ag__line">${avatar("Jonas Weber")}<b>Jonas Weber</b> added context · today</p>
            <p class="ui-ag__card">${steps[0]}</p>
          </div>
        </li>
        <li>
          <span class="ui-ag__dot">${glyph(G.chart)}</span>
          <p class="ui-ag__line">${avatar("Mara Lindqvist")}<b>Mara Lindqvist</b> generated a <u>Weekly summary</u> · 1d ago</p>
        </li>
        <li>
          <span class="ui-ag__dot">${glyph(G.file)}</span>
          <p class="ui-ag__line">
            ${avatar("Mara Lindqvist")}<b>Mara Lindqvist</b> added <u>playbook.pdf</u><i class="ui-ag__ext" data-kind="pdf"></i> and <u>accounts.csv</u
            ><i class="ui-ag__ext" data-kind="csv"></i> · 2d ago
          </p>
        </li>
        <li>
          <span class="ui-ag__dot">${glyph(G.note)}</span>
          <div>
            <p class="ui-ag__line">${avatar("Jonas Weber")}<b>Jonas Weber</b> added context · 2d ago</p>
            <p class="ui-ag__card">${steps[1]} ${steps[2]}</p>
          </div>
        </li>
        <li>
          <span class="ui-ag__dot ui-ag__dot--app">${glyph(G.plug)}</span>
          <p class="ui-ag__line">Connected <u>Slack</u> and <u>HubSpot</u> · 3d ago</p>
        </li>
      </ol>
    </div>
  </div>`;
}

/** The default agents: seven made-up playbooks */
export const defaultGalleryItems: GalleryItem[] = [
  {
    id: "triage",
    name: "Support triage",
    description: "Sorts new tickets by urgency and routes them to the right team.",
    colors: ["#8b5cf6", "#e9d5ff"],
    trigger: "Ticket created",
    steps: ["Read the ticket and detect the product area.", "Set priority from customer plan and sentiment.", "Assign the team and post a summary in the thread."],
    skills: ["Classify ticket", "Summarize thread"],
    guardrail: "Cannot close tickets",
  },
  {
    id: "enrich",
    name: "Lead enrichment",
    description: "Fills in company data for every new lead before sales picks it up.",
    colors: ["#2f6bff", "#c7d7ff"],
    trigger: "Lead added",
    steps: ["Look up the company by email domain.", "Add size, industry and location to the record.", "Score the lead and notify the owner above 80."],
    skills: ["Find company", "Score lead"],
    guardrail: "Cannot change lead owner",
  },
  {
    id: "recap",
    name: "Meeting recap",
    description: "Turns call transcripts into notes, decisions and next steps.",
    colors: ["#ec4899", "#fbcfe8"],
    trigger: "Call ended",
    steps: ["Pull the transcript from the recording.", "Write a short recap with decisions and owners.", "Create follow-up tasks and share the notes."],
    skills: ["Write recap", "Create tasks"],
    guardrail: "Cannot email external guests",
  },
  {
    id: "churn",
    name: "Churn watch",
    description: "Spots accounts that go quiet and suggests a save play.",
    colors: ["#f97316", "#fed7aa"],
    trigger: "Usage drops 30%",
    steps: ["Compare weekly usage against the last quarter.", "Check open tickets and recent NPS answers.", "Draft a check-in for the account manager."],
    skills: ["Read usage", "Draft check-in"],
    guardrail: "Cannot offer discounts",
  },
  {
    id: "onboard",
    name: "Onboarding coach",
    description: "Guides new customers through setup and nudges when they get stuck.",
    colors: ["#14b8a6", "#ccfbf1"],
    trigger: "Workspace created",
    steps: ["Send a welcome note with the first three steps.", "Watch for steps that stay open for two days.", "Offer a short call when setup stalls."],
    skills: ["Send nudge", "Book call"],
    guardrail: "Cannot change billing",
  },
  {
    id: "review",
    name: "Content review",
    description: "Checks drafts for tone, claims and brand terms before they ship.",
    colors: ["#6366f1", "#e0e7ff"],
    trigger: "Draft submitted",
    steps: ["Check tone against the brand guide.", "Flag claims that need a source.", "Suggest fixes inline and tag the author."],
    skills: ["Check tone", "Flag claims"],
    guardrail: "Cannot publish",
  },
  {
    id: "release",
    name: "Release notes",
    description: "Writes customer-facing notes from merged pull requests.",
    colors: ["#d946ef", "#f5d0fe"],
    trigger: "Release tagged",
    steps: ["Collect merged pull requests since the last tag.", "Group them into features, fixes and changes.", "Draft notes in plain language for review."],
    skills: ["Group changes", "Write notes"],
    guardrail: "Cannot post without review",
  },
];

if (!customElements.get("tc-agent-gallery")) customElements.define("tc-agent-gallery", TcAgentGallery);
declare global {
  interface HTMLElementTagNameMap {
    "tc-agent-gallery": TcAgentGallery;
  }
}
