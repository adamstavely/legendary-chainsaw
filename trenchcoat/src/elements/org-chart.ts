import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { safeMediaUrl } from "./internal/safe-media";
import { initials } from "./internal/util";

/*
 * <tc-org-chart> – who reports to whom. Cards for people – picture or initials, name, title and team – joined by
 * reporting lines, top-down; each manager's "6 reports" button folds their branch away or opens it. Only open branches
 * are drawn, so a big organisation stays light. Several people without a manager make several trees side by side.
 *   · search by name, title or team: matches are marked, the branches above them open, the count shows, and Enter
 *     goes to the next one
 *   · pick a person (click, Enter) for a strip under the chart: their manager, them, and their reports, each a button
 *     that moves there
 *   · the drawing scrolls inside the card; drag empty space to pan, and − / + / Fit to zoom. In a narrow container
 *     (or with layout="list") it's an indented outline instead
 *   · the tree pattern's keys: ↑ ↓ between the people shown, → opens or goes to the first report, ← closes or goes to
 *     the manager, Home / End, * opens every sibling, Enter or Space picks
 *   · vacant roles are dashed, away people carry a dot and the word
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-org-chart .people=${[{ id: "ceo", name: "Ines Okafor", title: "Director" }, { id: "a", name: "Tomás Reyes", manager: "ceo" }]}></tc-org-chart>
 */

export type OrgChartPersonStatus = "active" | "away" | "vacant";
export type OrgChartPerson = {
  id: string;
  /** The person's name; for a vacant role, what to call the gap ("Open role") */
  name: string;
  title?: string;
  team?: string;
  /** The id of the person they report to */
  manager?: string;
  /** A picture URL; without one the card shows initials */
  avatar?: string;
  location?: string;
  status?: OrgChartPersonStatus;
};
export type OrgChartLayout = "auto" | "tree" | "list";

/** Details of the events */
export type OrgChartExpandedChange = { expanded: string[]; id: string; open: boolean };
export type OrgChartSelectedChange = { selected: string | null; person: OrgChartPerson | null };
export type OrgChartFilterChange = { filter: string };

let uidCount = 0;
const ZOOMS = [0.5, 0.67, 0.8, 1, 1.25];

/* network, search, minus, plus, maximize, chevron-down, arrow-right: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const orgIcon = svg`<rect x="16" y="16" width="6" height="6" rx="1"></rect><rect x="2" y="16" width="6" height="6" rx="1"></rect><rect x="9" y="2" width="6" height="6" rx="1"></rect><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"></path><path d="M12 12V8"></path>`;
const searchIcon = () => lucide(14, svg`<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>`);
const minusIcon = () => lucide(14, svg`<path d="M5 12h14"></path>`);
const plusIcon = () => lucide(14, svg`<path d="M5 12h14"></path><path d="M12 5v14"></path>`);
const fitIcon = () => lucide(14, svg`<path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M21 8V5a2 2 0 0 0-2-2h-3"></path><path d="M3 16v3a2 2 0 0 0 2 2h3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>`);
const chevron = () => lucide(12, svg`<path d="m6 9 6 6 6-6"></path>`);
const arrow = () => lucide(12, svg`<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>`);

/** A name's avatar colour: one of the tone families, the same for the same name */
const HUES = ["teal", "violet", "amber", "pink", "rose"];
const hue = (name: string) => HUES[[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % HUES.length];

/**
 * Who reports to whom: people's cards joined by reporting lines, branches that fold, search, a picked person's manager
 * and reports, pan and zoom, and an outline when narrow.
 * @tag tc-org-chart
 * @fires tc-expanded-change - A branch was opened or folded ({ expanded, id, open }: OrgChartExpandedChange); cancelable – prevented, `expanded` stays as it was
 * @fires tc-selected-change - A person was picked ({ selected, person }: OrgChartSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-filter-change - The search changed ({ filter }: OrgChartFilterChange); cancelable – prevented, `filter` stays as it was
 */
export class TcOrgChart extends TcElement {
  static override ui = "org";

  /** The heading, and the chart's name */
  @property() accessor heading = "Organisation";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** Everyone, in the order their manager lists them; `manager` joins them up */
  @property({ attribute: false }) accessor people: OrgChartPerson[] = [];
  /** The people whose reports are shown; null shows the top of each tree and one level under it. Changed by the user unless tc-expanded-change is prevented */
  @property({ attribute: false }) accessor expanded: string[] | null = null;
  /** The person picked. Changed by the user unless tc-selected-change is prevented */
  @property() accessor selected: string | null = null;
  /** What the search box holds. Changed by the user unless tc-filter-change is prevented */
  @property() accessor filter = "";
  /** "tree" draws cards top-down, "list" an indented outline; "auto" is the tree, the outline when narrow */
  @property({ reflect: true }) accessor layout: OrgChartLayout = "auto";

  @state() private accessor active: string | null = null;
  @state() private accessor zoom = 1;
  @state() private accessor matchAt = -1;
  @state() private accessor announce = "";
  @state() private accessor natural = { w: 0, h: 0 };

  private uid = `tc-org-${++uidCount}`;
  private resize: ResizeObserver | null = null;
  private pan: { x: number; y: number; left: number; top: number; id: number } | null = null;

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.resize?.disconnect();
    this.resize = null;
  }

  /* ---------- The model ---------- */

  private byId = new Map<string, OrgChartPerson>();
  private kids = new Map<string, OrgChartPerson[]>();
  private roots: OrgChartPerson[] = [];
  private hits: string[] = [];

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("people")) {
      this.byId = new Map(this.people.map((p) => [p.id, p]));
      this.kids = new Map();
      this.roots = [];
      for (const p of this.people) {
        // A manager that isn't in the list (or a loop back to themselves) makes them a root
        if (p.manager && p.manager !== p.id && this.byId.has(p.manager)) {
          const list = this.kids.get(p.manager) ?? [];
          list.push(p);
          this.kids.set(p.manager, list);
        } else this.roots.push(p);
      }
    }
    if (changed.has("people") || changed.has("filter")) {
      const q = this.filter.trim().toLowerCase();
      this.hits = q ? this.people.filter((p) => [p.name, p.title, p.team].some((x) => x?.toLowerCase().includes(q))).map((p) => p.id) : [];
      this.matchAt = -1;
    }
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    const canvas = this.querySelector<HTMLElement>(".ui-org__canvas");
    if (canvas && !this.resize) {
      this.resize = new ResizeObserver(() => {
        // offsetWidth/Height aren't scaled by the zoom's transform: the drawing's own size
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        if (w !== this.natural.w || h !== this.natural.h) this.natural = { w, h };
      });
      this.resize.observe(canvas);
    } else if (!canvas && this.resize) {
      this.resize.disconnect();
      this.resize = null;
    }
  }

  /** The managers whose reports show: `expanded`, or the roots by default */
  private get openSet(): Set<string> {
    const base = new Set(this.expanded ?? this.roots.map((r) => r.id));
    // Searching opens the way to every match
    for (const id of this.hits) for (let m = this.byId.get(id)?.manager; m && this.byId.has(m) && !base.has(m); m = this.byId.get(m)?.manager) base.add(m);
    return base;
  }

  /** Everyone shown, in reading order (depth first through open branches), with their depth */
  private get visible(): { p: OrgChartPerson; level: number }[] {
    const open = this.openSet;
    const out: { p: OrgChartPerson; level: number }[] = [];
    const walk = (p: OrgChartPerson, level: number, seen: Set<string>) => {
      if (seen.has(p.id)) return;
      seen.add(p.id);
      out.push({ p, level });
      if (open.has(p.id)) for (const k of this.kids.get(p.id) ?? []) walk(k, level + 1, seen);
    };
    const seen = new Set<string>();
    for (const r of this.roots) walk(r, 1, seen);
    return out;
  }

  private reports(id: string) {
    return this.kids.get(id) ?? [];
  }
  /** Everyone under a person, at any depth */
  private allUnder(id: string) {
    let n = 0;
    const walk = (x: string, seen: Set<string>) => {
      for (const k of this.reports(x)) {
        if (seen.has(k.id)) continue;
        seen.add(k.id);
        n++;
        walk(k.id, seen);
      }
    };
    walk(id, new Set([id]));
    return n;
  }

  /* ---------- Actions ---------- */

  private setOpen(id: string, open: boolean) {
    const now = this.openSet;
    if (now.has(id) === open || !this.reports(id).length) return;
    const base = new Set(this.expanded ?? this.roots.map((r) => r.id));
    if (open) base.add(id);
    else {
      base.delete(id);
      // Folding a branch the search opened: leave the search's way to it closed too
      for (const x of this.hits) for (let m = this.byId.get(x)?.manager; m && m !== id; m = this.byId.get(m)?.manager) if (this.isUnder(m, id)) base.delete(m);
    }
    const expanded = [...base];
    if (!this.emit<OrgChartExpandedChange>("tc-expanded-change", { expanded, id, open }, { cancelable: true })) return;
    this.expanded = expanded;
    if (!open && this.hits.some((h) => this.isUnder(h, id))) this.setFilter("");
    const n = this.reports(id).length;
    this.announce = open ? `${this.byId.get(id)?.name}: ${n} ${n === 1 ? "report" : "reports"} shown` : `${this.byId.get(id)?.name}'s reports folded`;
  }

  /** Whether `id` is somewhere under `boss` */
  private isUnder(id: string, boss: string) {
    const seen = new Set<string>();
    for (let m = this.byId.get(id)?.manager; m && !seen.has(m); m = this.byId.get(m)?.manager) {
      if (m === boss) return true;
      seen.add(m);
    }
    return false;
  }

  private select(id: string | null, focus = false) {
    if (id === this.selected) return;
    const person = id ? (this.byId.get(id) ?? null) : null;
    if (!this.emit<OrgChartSelectedChange>("tc-selected-change", { selected: id, person }, { cancelable: true })) return;
    this.selected = id;
    if (person) this.announce = `${person.name}${person.title ? `, ${person.title}` : ""}`;
    if (id && focus) this.focusPerson(id);
  }

  private setFilter(filter: string) {
    if (!this.emit<OrgChartFilterChange>("tc-filter-change", { filter }, { cancelable: true })) {
      this.requestUpdate();
      return;
    }
    this.filter = filter;
    const q = filter.trim().toLowerCase();
    const n = q ? this.people.filter((p) => [p.name, p.title, p.team].some((x) => x?.toLowerCase().includes(q))).length : 0;
    this.announce = q ? (n ? `${n} ${n === 1 ? "match" : "matches"}` : "No matches") : "";
  }

  private nextMatch(back = false) {
    if (!this.hits.length) return;
    this.matchAt = (this.matchAt + (back ? -1 : 1) + this.hits.length) % this.hits.length;
    const id = this.hits[this.matchAt];
    this.active = id;
    this.announce = `${this.byId.get(id)?.name}, match ${this.matchAt + 1} of ${this.hits.length}`;
    void this.updateComplete.then(() => this.itemOf(id)?.scrollIntoView({ block: "nearest", inline: "nearest" }));
  }

  private itemOf(id: string) {
    return this.querySelector<HTMLElement>(`.ui-org__card[data-id="${CSS.escape(id)}"]`);
  }
  private focusPerson(id: string) {
    this.active = id;
    void this.updateComplete.then(() => {
      const el = this.itemOf(id);
      el?.focus({ preventScroll: true });
      el?.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
  }

  private onTreeKey = (e: KeyboardEvent) => {
    const item = (e.target as HTMLElement).closest<HTMLElement>(".ui-org__card");
    if (!item || e.target !== item || e.altKey || e.ctrlKey || e.metaKey) return;
    const id = item.dataset.id!;
    const list = this.visible;
    const i = list.findIndex((v) => v.p.id === id);
    const p = this.byId.get(id)!;
    const open = this.openSet.has(id);
    const has = this.reports(id).length > 0;
    const go = (to: string | undefined) => {
      if (!to) return;
      e.preventDefault();
      this.focusPerson(to);
    };
    switch (e.key) {
      case "ArrowDown":
        go(list[i + 1]?.p.id);
        break;
      case "ArrowUp":
        go(list[i - 1]?.p.id);
        break;
      case "Home":
        go(list[0]?.p.id);
        break;
      case "End":
        go(list[list.length - 1]?.p.id);
        break;
      case "ArrowRight":
        e.preventDefault();
        if (has && !open) this.setOpen(id, true);
        else if (has) go(this.reports(id)[0]?.id);
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (has && open) this.setOpen(id, false);
        else if (p.manager && this.byId.has(p.manager)) go(p.manager);
        break;
      case "*": {
        e.preventDefault();
        const siblings = p.manager && this.byId.has(p.manager) ? this.reports(p.manager) : this.roots;
        for (const s of siblings) this.setOpen(s.id, true);
        break;
      }
      case "Enter":
      case " ":
        e.preventDefault();
        this.select(id);
        break;
    }
  };

  /* ---------- Pan and zoom ---------- */

  private setZoom(z: number) {
    this.zoom = Math.max(ZOOMS[0], Math.min(ZOOMS[ZOOMS.length - 1], Math.round(z * 100) / 100));
    this.announce = `Zoom ${Math.round(this.zoom * 100)}%`;
  }
  private stepZoom(dir: 1 | -1) {
    const at = ZOOMS.findIndex((z) => z >= this.zoom - 0.001);
    const i = dir > 0 ? (ZOOMS[at] > this.zoom + 0.001 ? at : at + 1) : at - 1;
    this.setZoom(ZOOMS[Math.max(0, Math.min(ZOOMS.length - 1, i))]);
  }
  private fit() {
    const view = this.querySelector<HTMLElement>(".ui-org__view");
    if (!view || !this.natural.w) return;
    const z = Math.min(1, (view.clientWidth - 8) / this.natural.w, (view.clientHeight - 8) / this.natural.h);
    this.setZoom(Math.max(ZOOMS[0], z));
    view.scrollTo({ left: 0, top: 0 });
  }

  private onPanDown = (e: PointerEvent) => {
    // Empty space only: cards and buttons keep their own clicks
    if (e.button !== 0 || (e.target as Element).closest(".ui-org__card, button")) return;
    const view = e.currentTarget as HTMLElement;
    this.pan = { x: e.clientX, y: e.clientY, left: view.scrollLeft, top: view.scrollTop, id: e.pointerId };
    view.setPointerCapture?.(e.pointerId);
    view.dataset.panning = "";
  };
  private onPanMove = (e: PointerEvent) => {
    if (!this.pan || e.pointerId !== this.pan.id) return;
    const view = e.currentTarget as HTMLElement;
    view.scrollLeft = this.pan.left - (e.clientX - this.pan.x);
    view.scrollTop = this.pan.top - (e.clientY - this.pan.y);
  };
  private onPanUp = (e: PointerEvent) => {
    if (!this.pan || e.pointerId !== this.pan.id) return;
    this.pan = null;
    delete (e.currentTarget as HTMLElement).dataset.panning;
  };

  /* ---------- Rendering ---------- */

  private hl(text: string) {
    const q = this.filter.trim();
    if (!q) return text;
    const at = text.toLowerCase().indexOf(q.toLowerCase());
    if (at < 0) return text;
    return html`${text.slice(0, at)}<mark class="ui-org__mark">${text.slice(at, at + q.length)}</mark>${text.slice(at + q.length)}`;
  }

  private avatar(p: OrgChartPerson, size: "md" | "sm" = "md") {
    if (p.status === "vacant") return html`<span class="ui-org__avatar" data-size=${size} data-vacant aria-hidden="true">${plusIcon()}</span>`;
    const src = safeMediaUrl(p.avatar);
    if (src) return html`<span class="ui-org__avatar" data-size=${size} aria-hidden="true"><img src=${src} alt="" loading="lazy" decoding="async" /></span>`;
    return html`<span class="ui-org__avatar" data-size=${size} data-hue=${hue(p.name)} aria-hidden="true">${initials(p.name)}</span>`;
  }

  private renderPerson(p: OrgChartPerson, level: number, pos: number, size: number, open: Set<string>, seen: Set<string>): TemplateResult {
    seen.add(p.id);
    const kids = this.reports(p.id).filter((k) => !seen.has(k.id));
    const isOpen = kids.length > 0 && open.has(p.id);
    const active = this.active && this.visibleIds.has(this.active) ? this.active : this.roots[0]?.id;
    const hit = this.hits.includes(p.id);
    const under = kids.length && !isOpen ? this.allUnder(p.id) : 0;
    // A flat tree (each card a treeitem with its level), drawn nested: the list markup is only layout, so a person is
    // named by their own card, not by everyone under them
    return html`<li class="ui-org__item" role="none" data-for=${p.id}>
      <div
        class="ui-org__card"
        role="treeitem"
        data-id=${p.id}
        aria-level=${level}
        aria-posinset=${pos}
        aria-setsize=${size}
        aria-expanded=${ifDefined(kids.length ? (isOpen ? "true" : "false") : undefined)}
        aria-selected=${this.selected === p.id ? "true" : "false"}
        tabindex=${p.id === active ? 0 : -1}
        ?data-match=${hit}
        ?data-current=${this.hits[this.matchAt] === p.id}
        ?data-vacant=${p.status === "vacant"}
        ?data-selected=${this.selected === p.id}
        @focus=${() => (this.active = p.id)}
        @click=${() => {
          this.active = p.id;
          this.select(p.id);
          this.itemOf(p.id)?.focus({ preventScroll: true });
        }}
      >
        ${this.avatar(p)}
        <span class="ui-org__who">
          <span class="ui-org__name">${this.hl(p.name)}${p.status === "vacant" ? html`<span class="tc-sr-only">, vacant</span>` : nothing}</span>
          ${p.title ? html`<span class="ui-org__title">${this.hl(p.title)}</span>` : nothing}
          <span class="ui-org__meta">
            ${p.team ? html`<span class="ui-org__team">${this.hl(p.team)}</span>` : nothing}
            ${p.status === "away" ? html`<span class="ui-org__away"><span class="ui-org__dot" aria-hidden="true"></span>Away</span>` : nothing}
          </span>
        </span>
        ${kids.length
          ? html`<button
              type="button"
              class="ui-org__fold"
              tabindex="-1"
              aria-hidden="true"
              ?data-open=${isOpen}
              @click=${(e: Event) => {
                e.stopPropagation();
                this.active = p.id;
                this.setOpen(p.id, !isOpen);
              }}
            >${kids.length} ${kids.length === 1 ? "report" : "reports"}${under > kids.length ? html`<span class="ui-org__under"> · ${under} in all</span>` : nothing}${chevron()}</button>`
          : nothing}
      </div>
      ${isOpen
        ? html`<ul class="ui-org__group" role="none">
            ${kids.map((k, i) => this.renderPerson(k, level + 1, i + 1, kids.length, open, seen))}
          </ul>`
        : nothing}
    </li>`;
  }

  private visibleIds = new Set<string>();

  private renderStrip() {
    const p = this.selected ? this.byId.get(this.selected) : undefined;
    if (!p) return nothing;
    const boss = p.manager ? this.byId.get(p.manager) : undefined;
    const kids = this.reports(p.id);
    const chip = (x: OrgChartPerson) =>
      html`<button type="button" class="ui-org__chip" @click=${() => {
        if (x.manager && !this.openSet.has(x.manager)) this.setOpen(x.manager, true);
        this.select(x.id, true);
      }}>${this.avatar(x, "sm")}<span>${x.name}</span></button>`;
    return html`<div class="ui-org__strip" role="group" aria-label=${`${p.name}'s place`}>
      ${boss ? html`<span class="ui-org__step"><span class="ui-org__step-label">Reports to</span>${chip(boss)}</span>${arrow()}` : nothing}
      <span class="ui-org__step"><span class="ui-org__step-label">${p.status === "vacant" ? "Vacant role" : "Picked"}</span><span class="ui-org__me">${this.avatar(p, "sm")}<span><strong>${p.name}</strong>${p.title ? html` · ${p.title}` : nothing}${p.location ? html` · ${p.location}` : nothing}</span></span></span>
      ${kids.length
        ? html`${arrow()}<span class="ui-org__step"><span class="ui-org__step-label">${kids.length} ${kids.length === 1 ? "report" : "reports"}</span><span class="ui-org__chips">${kids.slice(0, 6).map(chip)}${kids.length > 6 ? html`<span class="ui-org__more">+${kids.length - 6}</span>` : nothing}</span></span>`
        : nothing}
    </div>`;
  }

  protected override render() {
    const id = this.uid;
    const open = this.openSet;
    this.visibleIds = new Set(this.visible.map((v) => v.p.id));
    const q = this.filter.trim();
    const n = this.hits.length;
    const scale = this.zoom;
    const seen = new Set<string>();
    const total = this.people.filter((p) => p.status !== "vacant").length;
    const vacant = this.people.length - total;
    const sub = this.description ?? `${total} ${total === 1 ? "person" : "people"}${vacant ? ` · ${vacant} open ${vacant === 1 ? "role" : "roles"}` : ""}`;
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      ${cardHead({ icon: orgIcon, title: this.heading, subtitle: sub, id: `${id}-title` })}
      <div class="ui-org__card-wrap">
        <div class="ui-org__toolbar">
          <label class="ui-org__search">
            <span class="ui-org__search-icon" aria-hidden="true">${searchIcon()}</span>
            <span class="tc-sr-only">Find a person, title or team</span>
            <input
              type="search"
              class="ui-org__search-input"
              placeholder="Find a person, title or team"
              aria-describedby=${`${id}-count`}
              .value=${live(this.filter)}
              @input=${(e: Event) => this.setFilter((e.target as HTMLInputElement).value)}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  this.nextMatch(e.shiftKey);
                } else if (e.key === "Escape" && this.filter) {
                  e.preventDefault();
                  this.setFilter("");
                }
              }}
            />
            <span class="ui-org__count" id=${`${id}-count`}>${q ? (n ? `${this.matchAt >= 0 ? `${this.matchAt + 1} of ` : ""}${n} ${n === 1 ? "match" : "matches"}` : "No matches") : ""}</span>
          </label>
          <span class="ui-org__zoom" role="group" aria-label="Zoom">
            <button type="button" class="ui-org__tool" title="Zoom out" ?disabled=${scale <= ZOOMS[0]} @click=${() => this.stepZoom(-1)}>${minusIcon()}<span class="tc-sr-only">Zoom out</span></button>
            <span class="ui-org__pct" aria-hidden="true">${Math.round(scale * 100)}%</span>
            <button type="button" class="ui-org__tool" title="Zoom in" ?disabled=${scale >= ZOOMS[ZOOMS.length - 1]} @click=${() => this.stepZoom(1)}>${plusIcon()}<span class="tc-sr-only">Zoom in</span></button>
            <button type="button" class="ui-org__tool" title="Fit" @click=${() => this.fit()}>${fitIcon()}<span class="tc-sr-only">Fit the chart</span></button>
          </span>
        </div>
        <div class="ui-org__view" @pointerdown=${this.onPanDown} @pointermove=${this.onPanMove} @pointerup=${this.onPanUp} @pointercancel=${this.onPanUp}>
          ${this.people.length
            ? html`<div class="ui-org__sizer" style=${this.natural.w ? `width:${this.natural.w * scale}px;height:${this.natural.h * scale}px` : ""}>
                <div class="ui-org__canvas" style=${`--org-zoom:${scale}`}>
                  <ul class="ui-org__tree" role="tree" aria-labelledby=${`${id}-title`} @keydown=${this.onTreeKey}>
                    ${this.roots.map((r, i) => this.renderPerson(r, 1, i + 1, this.roots.length, open, seen))}
                  </ul>
                </div>
              </div>`
            : html`<p class="ui-org__empty">No one to show yet.</p>`}
        </div>
        ${this.renderStrip()}
      </div>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="clean"], [data-look="standard"] *, [data-look="clean"] *)[data-ui="org"] {
  --tc-org-card-w: 196px;
  --tc-org-gap: var(--tc-space-6);
  --tc-org-line: var(--tc-border-strong);
  --tc-org-view-h: 460px;
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 100%;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="org"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *).ui-org__card-wrap { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="org"] { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-org__card-wrap { border-top: var(--tc-hairline) solid var(--tc-divider); }
[data-ui="org"] *, [data-ui="org"] *::before, [data-ui="org"] *::after { box-sizing: border-box; }
:where([data-ui="org"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="org"] :is(button, input):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-ui="org"]) :is(p, ul) { margin: 0; padding: 0; }
[data-ui="org"] ul { list-style: none; }
[data-ui="org"] svg { display: block; flex: none; }
/* ----- Toolbar ----- */
.ui-org__toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-2); }
.ui-org__search { position: relative; display: flex; flex: 1 1 14rem; align-items: center; min-width: 0; max-width: 24rem; }
.ui-org__search-icon { position: absolute; left: var(--tc-space-2-5); color: var(--tc-icon-muted); pointer-events: none; }
.ui-org__search-input { width: 100%; height: var(--tc-control-h-md); padding: 0 calc(var(--tc-space-2-5) + 6rem) 0 calc(var(--tc-space-2-5) + var(--tc-space-5)); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-fill-subtle); font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); outline: none; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-org__search-input::placeholder { color: var(--tc-text-placeholder); }
.ui-org__search-input::-webkit-search-cancel-button { display: none; }
.ui-org__search-input:hover { background: var(--tc-fill-hover); }
.ui-org__search-input:focus-visible { background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow-focus); }
.ui-org__count { position: absolute; right: var(--tc-space-2-5); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; pointer-events: none; }
.ui-org__zoom { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); margin-left: auto; }
.ui-org__tool { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-text-secondary); }
.ui-org__tool:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-org__tool:disabled { color: var(--tc-text-disabled); cursor: not-allowed; }
.ui-org__pct { min-width: 3.25rem; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); text-align: center; font-variant-numeric: tabular-nums; }
/* ----- The drawing: scrolls inside the card, drag empty space to pan ----- */
.ui-org__view { position: relative; max-height: var(--tc-org-view-h); overflow: auto; overscroll-behavior: contain; padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-4); cursor: grab; scrollbar-width: thin; }
.ui-org__view[data-panning] { cursor: grabbing; user-select: none; }
.ui-org__sizer { position: relative; min-width: 100%; }
.ui-org__canvas { width: max-content; min-width: 100%; transform: scale(var(--org-zoom, 1)); transform-origin: 0 0; }
.ui-org__empty { padding: var(--tc-space-8) 0; color: var(--tc-text-muted); text-align: center; cursor: default; }
/* Tree: top-down, a reporting line from each manager to a bar over their reports */
.ui-org__tree { display: flex; justify-content: center; gap: var(--tc-space-6); }
.ui-org__item { position: relative; display: flex; flex-direction: column; align-items: center; outline: none; }
.ui-org__group { position: relative; display: flex; justify-content: center; padding-top: var(--tc-org-gap); }
.ui-org__group::before { content: ""; position: absolute; top: 0; left: 50%; height: calc(var(--tc-org-gap) / 2); border-left: 1px solid var(--tc-org-line); }
.ui-org__group > .ui-org__item { padding: calc(var(--tc-org-gap) / 2) var(--tc-space-2) 0; }
.ui-org__group > .ui-org__item::before { content: ""; position: absolute; top: 0; left: 0; right: 0; border-top: 1px solid var(--tc-org-line); }
.ui-org__group > .ui-org__item:first-child::before { left: 50%; }
.ui-org__group > .ui-org__item:last-child::before { right: 50%; }
.ui-org__group > .ui-org__item:only-child::before { display: none; }
.ui-org__group > .ui-org__item::after { content: ""; position: absolute; top: 0; left: 50%; height: calc(var(--tc-org-gap) / 2); border-left: 1px solid var(--tc-org-line); }
/* A card */
.ui-org__card { position: relative; display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: start; gap: var(--tc-space-2-5); width: var(--tc-org-card-w); padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised), 0 0 0 var(--tc-hairline) var(--tc-border-default); text-align: left; cursor: pointer; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-org__card:hover { box-shadow: var(--tc-shadow-raised), 0 0 0 1px var(--tc-border-strong); }
.ui-org__card[data-selected] { background: var(--tc-fill-selected); box-shadow: var(--tc-shadow-raised), 0 0 0 1.5px var(--tc-border-selected); }
.ui-org__card[data-vacant] { background: transparent; box-shadow: none; outline: 1.5px dashed var(--tc-border-strong); outline-offset: -1.5px; }
.ui-org__card:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-org__card[data-match] { box-shadow: var(--tc-shadow-raised), 0 0 0 1.5px var(--tc-tone-amber-solid); }
.ui-org__card[data-current] { box-shadow: var(--tc-shadow-raised), 0 0 0 2.5px var(--tc-tone-amber-solid); }
.ui-org__mark { border-radius: var(--tc-radius-2xs); background: var(--tc-tone-amber-bg); color: inherit; }
.ui-org__avatar { display: grid; flex: none; place-items: center; width: var(--tc-space-8); height: var(--tc-space-8); overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-surface-sunken); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-none); }
.ui-org__avatar[data-size="sm"] { width: var(--tc-space-6); height: var(--tc-space-6); font-size: var(--tc-font-size-xs); }
.ui-org__avatar > img { display: block; width: 100%; height: 100%; object-fit: cover; }
.ui-org__avatar[data-vacant] { background: transparent; box-shadow: inset 0 0 0 1.5px var(--tc-border-strong); color: var(--tc-icon-muted); }
.ui-org__avatar[data-hue="teal"] { background: var(--tc-tone-teal-bg); color: var(--tc-tone-teal-fg); }
.ui-org__avatar[data-hue="violet"] { background: var(--tc-tone-violet-bg); color: var(--tc-tone-violet-fg); }
.ui-org__avatar[data-hue="amber"] { background: var(--tc-tone-amber-bg); color: var(--tc-tone-amber-fg); }
.ui-org__avatar[data-hue="pink"] { background: var(--tc-tone-pink-bg); color: var(--tc-tone-pink-fg); }
.ui-org__avatar[data-hue="rose"] { background: var(--tc-tone-rose-bg); color: var(--tc-tone-rose-fg); }
.ui-org__who { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-org__name { overflow: hidden; font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); text-overflow: ellipsis; white-space: nowrap; }
.ui-org__card[data-vacant] .ui-org__name { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-org__title { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); text-overflow: ellipsis; white-space: nowrap; }
.ui-org__meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); margin-top: var(--tc-space-0-5); }
.ui-org__team { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); color: var(--tc-text-secondary); }
.ui-org__away { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-org__dot { width: var(--tc-space-1-5); height: var(--tc-space-1-5); border-radius: var(--tc-radius-full); background: var(--tc-status-warning-solid); }
.ui-org__fold { grid-column: 1 / -1; display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-1); height: var(--tc-pill-h-lg); margin: var(--tc-space-0-5) calc(-1 * var(--tc-space-1)) calc(-1 * var(--tc-space-1)); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-org__fold:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-org__fold svg { transition: transform var(--tc-duration-fast) var(--tc-ease-standard); transform: rotate(-90deg); }
.ui-org__fold[data-open] svg { transform: none; }
.ui-org__under { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
/* ----- The picked person: manager → them → reports ----- */
.ui-org__strip { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); font-size: var(--tc-font-size-sm); }
.ui-org__strip > svg { color: var(--tc-icon-muted); }
.ui-org__step { display: grid; gap: var(--tc-space-1); min-width: 0; }
.ui-org__step-label { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-org__me { display: inline-flex; align-items: center; gap: var(--tc-space-2); color: var(--tc-text-secondary); }
.ui-org__me strong { font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); }
.ui-org__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-org__chip { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2) 0 var(--tc-space-1); border-radius: var(--tc-radius-full); background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
.ui-org__chip:hover { background: var(--tc-fill-hover); }
.ui-org__more { align-self: center; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
/* ----- List: an indented outline, for narrow containers or layout="list" ----- */
@container (max-width: 560px) {
  [data-ui="org"][layout="auto"] .ui-org__tree, [data-ui="org"]:not([layout]) .ui-org__tree { display: block; }
  [data-ui="org"]:is([layout="auto"], :not([layout])) :is(.ui-org__item, .ui-org__group) { display: block; padding: 0; }
  [data-ui="org"]:is([layout="auto"], :not([layout])) .ui-org__group { margin-left: var(--tc-space-4); padding-left: var(--tc-space-3); border-left: 1px solid var(--tc-org-line); }
  [data-ui="org"]:is([layout="auto"], :not([layout])) :is(.ui-org__group, .ui-org__group > .ui-org__item)::before,
  [data-ui="org"]:is([layout="auto"], :not([layout])) .ui-org__group > .ui-org__item::after { display: none; }
  [data-ui="org"]:is([layout="auto"], :not([layout])) .ui-org__card { width: 100%; margin: var(--tc-space-1) 0; }
  [data-ui="org"]:is([layout="auto"], :not([layout])) .ui-org__canvas { width: auto; }
  [data-ui="org"]:is([layout="auto"], :not([layout])) .ui-org__zoom { display: none; }
  [data-ui="org"]:is([layout="auto"], :not([layout])) .ui-org__view { cursor: default; }
}
[data-ui="org"][layout="list"] .ui-org__tree { display: block; }
[data-ui="org"][layout="list"] :is(.ui-org__item, .ui-org__group) { display: block; padding: 0; }
[data-ui="org"][layout="list"] .ui-org__group { margin-left: var(--tc-space-4); padding-left: var(--tc-space-3); border-left: 1px solid var(--tc-org-line); }
[data-ui="org"][layout="list"] :is(.ui-org__group, .ui-org__group > .ui-org__item)::before,
[data-ui="org"][layout="list"] .ui-org__group > .ui-org__item::after { display: none; }
[data-ui="org"][layout="list"] .ui-org__card { width: 100%; max-width: 28rem; margin: var(--tc-space-1) 0; }
[data-ui="org"][layout="list"] .ui-org__canvas { width: auto; }
[data-ui="org"][layout="list"] .ui-org__zoom { display: none; }
[data-ui="org"][layout="list"] .ui-org__view { cursor: default; }
@media (forced-colors: active) {
  .ui-org__card { border: 1px solid CanvasText; }
  .ui-org__card:is([data-selected], [data-match]) { outline: 2px solid Highlight; }
  .ui-org__group::before, .ui-org__group > .ui-org__item::before, .ui-org__group > .ui-org__item::after { border-color: CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="org"] *, [data-ui="org"] *::before, [data-ui="org"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-org-chart")) customElements.define("tc-org-chart", TcOrgChart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-org-chart": TcOrgChart;
  }
}
