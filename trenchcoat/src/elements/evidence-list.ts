import { ifDefined } from "lit/directives/if-defined.js";
import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { copyText, formatDate, isoDate } from "./internal/util";

/*
 * <tc-evidence-list> – the exhibits linked to a matter: each with its reference ("E-101"), title, type (photo,
 * document, audio, video, forensic image, financial record …) with an icon, where it came from with an Admiralty grade
 * tag (tinted and barred by confidence, as in tc-fact-sheet), its date, who holds it, and a status in words with a
 * mark (Sealed, In analysis, Decryption pending, Transcribed, Released – or the page's own). The header counts them and
 * says when they were last synced; an optional note says where the originals live. An exhibit opens onto its chain of
 * custody: every hand it passed through, in order – when, who, what (Collected, Sealed, Transferred …), where – with
 * the hash recorded at each step, copyable, and a line saying whether the hashes agree.
 *   · rows are buttons with one tab stop: ↑ / ↓ / Home / End move, Enter, Space or a click opens an exhibit's custody
 *     (or closes it), Escape closes it; opening fires a cancelable tc-selected-change
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-evidence-list .exhibits=${[{ id: "e1", ref: "E-101", title: "Signed lease", type: "document", status: "sealed" }]}></tc-evidence-list>
 */

/* Archive box, exhibit types, statuses, chevron, copy: Lucide (ISC, lucide.dev) */
const boxIcon = svg`<rect width="20" height="5" x="2" y="3" rx="1"></rect><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"></path><path d="M10 12h4"></path>`;
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export type ExhibitType = "photo" | "document" | "audio" | "video" | "forensic" | "financial" | "other";
export type ExhibitTone = "neutral" | "info" | "success" | "warning" | "danger";
export type ExhibitMark = "lock" | "flask" | "clock" | "check" | "out" | "dot";
/** How an exhibit's status is shown: its name, tone and mark */
export type ExhibitStatusDef = { label: string; tone?: ExhibitTone; mark?: ExhibitMark };
/** Where an exhibit came from, with an Admiralty grade (source reliability A–F, credibility 1–6), e.g. "A2" */
export type ExhibitSource = { label: string; grade?: string };
/** One hand the exhibit passed through */
export type CustodyEvent = {
  /** When, epoch ms */
  at: number;
  /** Who, e.g. "D. Mercer (case officer)" */
  actor: string;
  /** What happened, e.g. "Collected", "Sealed", "Transferred", "Checked out", "Returned", "Analysed" */
  action: string;
  /** Where, e.g. "Evidence room B" */
  location?: string;
  /** The hash recorded at this step, shown in full and copyable */
  hash?: string;
};
export type Exhibit = {
  id: string;
  /** The exhibit's reference, e.g. "E-101" */
  ref: string;
  title: string;
  type?: ExhibitType;
  source?: ExhibitSource;
  /** When it was collected or dated, epoch ms */
  date?: number;
  /** A key into `statuses` */
  status: string;
  /** Who holds it or where it is, e.g. "Lab", "Analyst K. Osei" */
  holder?: string;
  /** Every hand it passed through, oldest first */
  custody?: CustodyEvent[];
  /** Whether the hashes agree; unset works it out from `custody` (all equal → verified) */
  integrity?: "verified" | "mismatch" | "unchecked";
};

/** Details of the events */
export type EvidenceSelectedChange = { selected: string | null; exhibit?: Exhibit };
export type EvidenceCopy = { exhibit: string; hash: string };

/** The statuses used when the page gives none */
export const defaultExhibitStatuses: Record<string, ExhibitStatusDef> = {
  sealed: { label: "Sealed", tone: "neutral", mark: "lock" },
  analysis: { label: "In analysis", tone: "info", mark: "flask" },
  pending: { label: "Decryption pending", tone: "warning", mark: "clock" },
  transcribed: { label: "Transcribed", tone: "success", mark: "check" },
  released: { label: "Released", tone: "neutral", mark: "out" },
};
const TYPE_LABEL: Record<ExhibitType, string> = { photo: "Photo", document: "Document", audio: "Audio", video: "Video", forensic: "Forensic image", financial: "Financial record", other: "Other" };
const TYPE_ICON: Record<ExhibitType, ReturnType<typeof svg>> = {
  photo: svg`<rect width="18" height="18" x="3" y="3" rx="2"></rect><circle cx="9" cy="9" r="2"></circle><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"></path>`,
  document: svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 13H8"></path><path d="M16 17H8"></path>`,
  audio: svg`<path d="M2 10v3"></path><path d="M6 6v11"></path><path d="M10 3v18"></path><path d="M14 8v7"></path><path d="M18 5v13"></path><path d="M22 10v3"></path>`,
  video: svg`<path d="m16 13 5.22 3.48a.5.5 0 0 0 .78-.42V7.87a.5.5 0 0 0-.76-.43L16 10.5"></path><rect x="2" y="6" width="14" height="12" rx="2"></rect>`,
  forensic: svg`<line x1="22" x2="2" y1="12" y2="12"></line><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path><line x1="6" x2="6.01" y1="16" y2="16"></line><line x1="10" x2="10.01" y1="16" y2="16"></line>`,
  financial: svg`<rect width="20" height="12" x="2" y="6" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path>`,
  other: svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path>`,
};
const MARK: Record<ExhibitMark, ReturnType<typeof svg>> = {
  lock: svg`<rect width="14" height="10" x="5" y="11" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path>`,
  flask: svg`<path d="M10 2v7.31"></path><path d="M14 9.3V2"></path><path d="M8.5 2h7"></path><path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path>`,
  clock: svg`<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>`,
  check: svg`<path d="M20 6 9 17l-5-5"></path>`,
  out: svg`<path d="M7 17 17 7"></path><path d="M7 7h10v10"></path>`,
  dot: svg`<circle cx="12" cy="12" r="4" fill="currentColor"></circle>`,
};
const chevron = svg`<path d="m9 18 6-6-6-6"></path>`;
const copyIcon = svg`<rect width="14" height="14" x="8" y="8" rx="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`;
const shieldOk = svg`<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path><path d="m9 12 2 2 4-4"></path>`;
const shieldBad = svg`<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path><path d="M12 8v4"></path><path d="M12 16h.01"></path>`;

/* The source tag's confidence band, from an Admiralty grade – the same reading as tc-fact-sheet */
type Band = "high" | "medium" | "low" | "unknown";
const BAND_LABEL: Record<Band, string> = { high: "High confidence", medium: "Medium confidence", low: "Low confidence", unknown: "Confidence unknown" };
const BAND_BARS: Record<Band, number> = { high: 3, medium: 2, low: 1, unknown: 0 };
function bandOf(grade: string | undefined): Band {
  const m = /^([A-F])([1-6])$/i.exec(grade?.trim() ?? "");
  if (!m) return "unknown";
  const r = m[1].toUpperCase();
  const c = m[2];
  if (r === "F" || c === "6") return "unknown";
  if ("DE".includes(r) || "45".includes(c)) return "low";
  if ("AB".includes(r) && "12".includes(c)) return "high";
  return "medium";
}
let uidCount = 0;

/** A recorded hash in a form that compares: "SHA256: ABCDEF" and "sha256:abcdef" are the same digest. Hex digests
 *  ignore case; anything else (base64) is compared as written */
function digest(hash: string) {
  const m = /^\s*([a-z][\w-]*)\s*:\s*(.*?)\s*$/i.exec(hash);
  const algo = m ? m[1].toLowerCase().replace(/[-_]/g, "") : "";
  const raw = (m ? m[2] : hash).trim();
  return raw ? { algo, hex: /^[\da-f]+$/i.test(raw) ? raw.toLowerCase() : raw } : undefined;
}

/**
 * Exhibits linked to a matter – reference, title, type, source with its grade, date, holder and status – each opening
 * onto its chain of custody with the hash at every step.
 * @tag tc-evidence-list
 * @fires tc-selected-change - An exhibit was opened or closed ({ selected, exhibit }: EvidenceSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-copy - A hash's Copy was pressed ({ exhibit, hash }: EvidenceCopy); cancelable – prevented, the element doesn't copy
 */
export class TcEvidenceList extends TcElement {
  static override ui = "evl";

  /** The heading, and the list's name */
  @property() accessor heading = "Linked evidence";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The exhibits, in the order given */
  @property({ attribute: false }) accessor exhibits: Exhibit[] = [];
  /** The statuses, merged over the defaults (sealed, analysis, pending, transcribed, released) */
  @property({ attribute: false }) accessor statuses: Record<string, ExhibitStatusDef> = {};
  /** When the list was last synced, epoch ms – shown in the header */
  @property({ type: Number }) accessor synced: number | undefined = undefined;
  /** A quiet line above the list, e.g. where the originals are kept */
  @property() accessor note: string | undefined = undefined;
  /** The open exhibit's id. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property() accessor selected: string | null = null;
  /** The language for dates, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  /** The row holding the tab stop */
  @state() private accessor active: string | null = null;
  @state() private accessor copied: string | null = null;
  @state() private accessor announce = "";

  private uid = `tc-evl-${++uidCount}`;
  private copiedTimer?: ReturnType<typeof setTimeout>;

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.copiedTimer);
  }

  /* ---------- The model ---------- */

  private statusOf(key: string): ExhibitStatusDef {
    return this.statuses[key] ?? defaultExhibitStatuses[key] ?? { label: key.charAt(0).toUpperCase() + key.slice(1), tone: "neutral", mark: "dot" };
  }
  private integrityOf(e: Exhibit): "verified" | "mismatch" | "unchecked" {
    if (e.integrity) return e.integrity;
    const hashes = (e.custody ?? []).map((c) => c.hash && digest(c.hash)).filter((h): h is { algo: string; hex: string } => !!h);
    if (hashes.length < 2) return "unchecked";
    // Different algorithms can't be compared – that's "not compared", never a mismatch. A hash without a prefix
    // compares with any
    if (new Set(hashes.map((h) => h.algo).filter(Boolean)).size > 1) return "unchecked";
    return hashes.every((h) => h.hex === hashes[0].hex) ? "verified" : "mismatch";
  }
  private day(ms: number) {
    return formatDate(ms, this.locale, { day: "numeric", month: "short", year: "numeric" });
  }
  private shortDay(ms: number) {
    return formatDate(ms, this.locale, { day: "numeric", month: "short" });
  }
  private stamp(ms: number) {
    return formatDate(ms, this.locale, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  /** The tab stop: the active row, else the open one, else the first */
  private get stop() {
    const ids = this.exhibits.map((e) => e.id);
    return [this.active, this.selected].find((id) => id && ids.includes(id)) ?? ids[0] ?? null;
  }

  private setSelected(next: string | null) {
    if (next === this.selected) return;
    const exhibit = next === null ? undefined : this.exhibits.find((e) => e.id === next);
    if (!this.emit<EvidenceSelectedChange>("tc-selected-change", { selected: next, exhibit }, { cancelable: true })) return;
    this.selected = next;
    this.announce = exhibit ? `${exhibit.ref}: chain of custody shown` : "Chain of custody closed";
  }

  private async copy(e: Exhibit, hash: string, key: string) {
    if (!this.emit<EvidenceCopy>("tc-copy", { exhibit: e.id, hash }, { cancelable: true })) return;
    if (!(await copyText(hash))) {
      this.announce = "Couldn't copy";
      return;
    }
    this.copied = key;
    this.announce = "Hash copied";
    clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => (this.copied = null), 1600);
  }

  /* ---------- Keyboard ---------- */

  private focusRow(id: string) {
    this.active = id;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-evl__row[data-id="${CSS.escape(id)}"]`)?.focus());
  }

  private onKey = (e: KeyboardEvent) => {
    const row = (e.target as Element).closest<HTMLElement>(".ui-evl__row");
    if (e.key === "Escape" && this.selected !== null && !e.isComposing) {
      e.preventDefault();
      const was = this.selected;
      this.setSelected(null);
      if (this.selected === null) this.focusRow(was);
      return;
    }
    if (!row || e.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;
    const ids = this.exhibits.map((x) => x.id);
    const at = ids.indexOf(row.dataset.id!);
    const last = ids.length - 1;
    const to = e.key === "ArrowDown" ? Math.min(last, at + 1) : e.key === "ArrowUp" ? Math.max(0, at - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : -1;
    if (to >= 0) {
      e.preventDefault();
      this.focusRow(ids[to]);
    }
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const ids = this.exhibits.map((e) => e.id);
    if (this.active !== null && !ids.includes(this.active)) this.active = null;
    if (this.selected !== null && !ids.includes(this.selected)) this.selected = null;
  }

  /* ---------- Rendering ---------- */

  private renderTag(source: ExhibitSource) {
    const band = bandOf(source.grade);
    const grade = source.grade?.toUpperCase();
    return html`<span class="ui-evl__tag" data-band=${band} title=${BAND_LABEL[band]}>
      <span class="ui-evl__tag-bars" aria-hidden="true">${[1, 2, 3].map((b) => html`<span class="ui-evl__tag-bar" ?data-on=${b <= BAND_BARS[band]}></span>`)}</span>
      <span aria-hidden="true">${source.label}${grade ? ` · ${grade}` : ""}</span>
    </span>`;
  }

  private renderStatus(key: string) {
    const s = this.statusOf(key);
    return html`<span class="ui-evl__status" data-tone=${s.tone ?? "neutral"} aria-hidden="true">${lucide(12, MARK[s.mark ?? "dot"])}${s.label}</span>`;
  }

  private renderCustody(e: Exhibit) {
    const custody = e.custody ?? [];
    const integrity = this.integrityOf(e);
    return html`<div class="ui-evl__custody" id=${`${this.uid}-c-${e.id}`} role="region" aria-label=${`Chain of custody for ${e.ref}`}>
      <div class="ui-evl__custody-head">
        <h4 class="ui-evl__custody-title">Chain of custody<span class="ui-evl__custody-n">${custody.length} ${custody.length === 1 ? "step" : "steps"}</span></h4>
        ${integrity === "unchecked"
          ? html`<span class="ui-evl__integrity" data-state="unchecked">Hashes not compared</span>`
          : html`<span class="ui-evl__integrity" data-state=${integrity}>${lucide(13, integrity === "verified" ? shieldOk : shieldBad)}${integrity === "verified" ? "Hash verified at every step" : "Hash mismatch – the hashes don't agree"}</span>`}
      </div>
      ${custody.length
        ? html`<ol class="ui-evl__steps">
            ${custody.map((c, i) => {
              const key = `${e.id}:${i}`;
              return html`<li class="ui-evl__step">
                <span class="ui-evl__step-dot" aria-hidden="true"></span>
                <div class="ui-evl__step-body">
                  <p class="ui-evl__step-line"><span class="ui-evl__step-action">${c.action}</span><span class="ui-evl__step-actor">${c.actor}</span></p>
                  <p class="ui-evl__step-meta"><time datetime=${ifDefined(isoDate(c.at))}>${this.stamp(c.at)}</time>${c.location ? html`<span>${c.location}</span>` : nothing}</p>
                  ${c.hash
                    ? html`<p class="ui-evl__hash">
                        <code class="ui-evl__hash-text">${c.hash}</code>
                        <button type="button" class="ui-evl__copy" aria-label=${`Copy the hash from step ${i + 1}`} @click=${() => void this.copy(e, c.hash!, key)}>
                          ${lucide(13, copyIcon)}<span aria-hidden="true">${this.copied === key ? "Copied" : "Copy"}</span>
                        </button>
                      </p>`
                    : nothing}
                </div>
              </li>`;
            })}
          </ol>`
        : html`<p class="ui-evl__none">No custody record yet.</p>`}
    </div>`;
  }

  private renderRow(e: Exhibit) {
    const isOpen = this.selected === e.id;
    const type = e.type ?? "other";
    const status = this.statusOf(e.status);
    const grade = e.source?.grade?.toUpperCase();
    const spoken = [
      e.title,
      TYPE_LABEL[type],
      e.source ? `source ${e.source.label}${grade ? `, grade ${grade}, ${BAND_LABEL[bandOf(grade)].toLowerCase()}` : ""}` : "",
      e.date !== undefined ? this.day(e.date) : "",
      status.label,
      e.holder ?? "",
    ]
      .filter(Boolean)
      .join(", ");
    return html`<li class="ui-evl__item" ?data-open=${isOpen}>
      <button
        type="button"
        class="ui-evl__row"
        data-id=${e.id}
        tabindex=${this.stop === e.id ? 0 : -1}
        aria-expanded=${isOpen ? "true" : "false"}
        aria-controls=${`${this.uid}-c-${e.id}`}
        @focus=${() => {
          if (this.active !== e.id) this.active = e.id;
        }}
        @click=${() => {
          this.active = e.id;
          this.setSelected(isOpen ? null : e.id);
        }}
      >
        <span class="ui-evl__type" data-type=${type} aria-hidden="true">${lucide(16, TYPE_ICON[type])}</span>
        <span class="ui-evl__main">
          <span class="ui-evl__title-line"><span class="ui-evl__ref">${e.ref}</span><span class="ui-evl__title">${e.title}</span></span>
          <span class="ui-evl__meta" aria-hidden="true">
            <span>${TYPE_LABEL[type]}</span>
            ${e.source ? this.renderTag(e.source) : nothing}
            ${e.date !== undefined ? html`<span>${this.shortDay(e.date)}</span>` : nothing}
            ${e.holder ? html`<span>${e.holder}</span>` : nothing}
          </span>
        </span>
        ${this.renderStatus(e.status)}
        <span class="ui-evl__chev" aria-hidden="true">${lucide(14, chevron)}</span>
        <span class="ui-evl__sr">, ${spoken}</span>
      </button>
      ${isOpen ? this.renderCustody(e) : nothing}
    </li>`;
  }

  protected override render() {
    const id = this.uid;
    const n = this.exhibits.length;
    return html`
      <span class="ui-evl__sr" role="status">${this.announce}</span>
      ${cardHead({
        icon: boxIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: html`<span class="ui-evl__count">${n} linked${this.synced !== undefined ? html` · synced ${this.shortDay(this.synced)}` : nothing}</span>`,
      })}
      <div class="ui-evl__card">
        ${this.note ? html`<p class="ui-evl__note">${this.note}</p>` : nothing}
        ${n
          ? html`<ul class="ui-evl__list" aria-labelledby=${`${id}-title`} @keydown=${this.onKey}>
              ${repeat(this.exhibits, (e) => e.id, (e) => this.renderRow(e))}
            </ul>`
          : html`<p class="ui-evl__empty">No exhibits linked yet.</p>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="evl"] {
  position: relative;
  display: block;
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="evl"] {
  position: relative;
  display: block;
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
/* The row's lead – avatar or type icon – which the open detail lines up after */
[data-ui="evl"] { --tc-evl-lead: 32px; }
[data-ui="evl"] *, [data-ui="evl"] *::before, [data-ui="evl"] *::after { box-sizing: border-box; }
:where([data-ui="evl"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="evl"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="evl"] ul, [data-ui="evl"] ol { margin: 0; padding: 0; list-style: none; }
[data-ui="evl"] p, [data-ui="evl"] h4 { margin: 0; }
.ui-evl__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-evl__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-evl__count { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-evl__note { margin: var(--tc-space-3) var(--tc-space-4) 0 !important; padding: var(--tc-space-2) var(--tc-space-3) !important; border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-evl__note { margin-top: var(--tc-space-1) !important; }
/* ----- Rows ----- */
.ui-evl__list { padding: var(--tc-space-1-5) !important; }
.ui-evl__item + .ui-evl__item { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-evl__row { display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; align-items: center; gap: var(--tc-space-3); width: 100%; padding: var(--tc-space-2-5); border-radius: var(--tc-radius-md); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-evl__row:hover { background: var(--tc-fill-subtle); }
[data-ui="evl"] .ui-evl__row:focus-visible { outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-evl__item[data-open] .ui-evl__row { background: var(--tc-fill-selected); }
.ui-evl__type { display: grid; place-items: center; width: var(--tc-evl-lead); height: var(--tc-evl-lead); border-radius: var(--tc-radius-md); background: var(--tc-surface-sunken); color: var(--tc-icon-muted); }
.ui-evl__main { display: grid; gap: var(--tc-space-1); min-width: 0; }
.ui-evl__title-line { display: flex; align-items: baseline; gap: var(--tc-space-2); min-width: 0; }
.ui-evl__ref { flex: none; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-evl__title { min-width: 0; overflow: hidden; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
.ui-evl__meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-evl__item[data-open] .ui-evl__meta { color: var(--tc-text-secondary); }
/* The source tag: mono, tinted by band, with a three-bar mark so the band isn't colour alone */
.ui-evl__tag { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-radius-badge); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-none); letter-spacing: var(--tc-tracking-caps); text-transform: uppercase; white-space: nowrap; }
.ui-evl__tag[data-band="high"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-evl__tag[data-band="medium"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-evl__tag[data-band="low"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-evl__tag[data-band="unknown"] { background: var(--tc-fill-default); color: var(--tc-text-secondary); }
.ui-evl__tag-bars { display: inline-flex; align-items: flex-end; gap: var(--tc-space-0-5); height: 9px; }
.ui-evl__tag-bar { width: 2px; border-radius: var(--tc-radius-2xs); background: currentColor; opacity: 0.25; }
.ui-evl__tag-bar:nth-child(1) { height: 4px; }
.ui-evl__tag-bar:nth-child(2) { height: 6.5px; }
.ui-evl__tag-bar:nth-child(3) { height: 9px; }
.ui-evl__tag-bar[data-on] { opacity: 1; }
/* Status: a mark and a word, tinted by tone */
.ui-evl__status { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-evl__status[data-tone="info"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-evl__status[data-tone="success"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-evl__status[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-evl__status[data-tone="danger"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-evl__chev { display: grid; place-items: center; color: var(--tc-icon-muted); transition: transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-evl__item[data-open] .ui-evl__chev { transform: rotate(90deg); }
/* ----- An exhibit's chain of custody ----- */
.ui-evl__custody { display: grid; gap: var(--tc-space-2-5); margin: 0 var(--tc-space-2-5) var(--tc-space-2-5) calc(var(--tc-evl-lead) + var(--tc-space-3) + var(--tc-space-2-5)); padding: var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-fill-subtle); animation: ui-evl-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-evl__custody-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2); }
.ui-evl__custody-title { display: flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-evl__custody-n { color: var(--tc-text-muted); text-transform: none; letter-spacing: normal; font-weight: var(--tc-font-weight-regular); }
.ui-evl__integrity { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-evl__integrity[data-state="verified"] { color: var(--tc-status-success-fg); }
.ui-evl__integrity[data-state="mismatch"] { color: var(--tc-status-danger-fg); }
.ui-evl__steps { position: relative; display: grid; gap: var(--tc-space-2-5); }
.ui-evl__steps::before { content: ""; position: absolute; top: var(--tc-space-1-5); bottom: var(--tc-space-1-5); left: 4px; border-left: var(--tc-hairline) solid var(--tc-border-strong); }
.ui-evl__step { position: relative; display: grid; grid-template-columns: 10px minmax(0, 1fr); gap: var(--tc-space-2-5); }
.ui-evl__step-dot { position: relative; width: 9px; height: 9px; margin-top: var(--tc-space-1); border-radius: var(--tc-radius-full); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 1.5px var(--tc-icon-muted); }
.ui-evl__step-body { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-evl__step-line { display: flex; flex-wrap: wrap; gap: 0 var(--tc-space-1-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-evl__step-action { font-weight: var(--tc-font-weight-medium); }
.ui-evl__step-actor { color: var(--tc-text-secondary); }
.ui-evl__step-meta { display: flex; flex-wrap: wrap; gap: 0 var(--tc-space-1-5); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-evl__step-meta > span::before { content: "·"; margin-right: var(--tc-space-1-5); }
.ui-evl__hash { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; margin-top: var(--tc-space-0-5) !important; }
.ui-evl__hash-text { min-width: 0; overflow: hidden; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-2xs); color: var(--tc-text-secondary); text-overflow: ellipsis; white-space: nowrap; }
.ui-evl__copy { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1-5) !important; border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-xs); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-evl__copy:hover { background: var(--tc-action-ghost-bg-hover); }
.ui-evl__none { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-evl__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@keyframes ui-evl-in { from { opacity: 0; transform: translateY(3px); } }
@container (max-width: 480px) {
  .ui-evl__row { grid-template-columns: auto minmax(0, 1fr) auto; }
  .ui-evl__chev { display: none; }
  .ui-evl__custody { margin-left: var(--tc-space-2-5); }
}
@media (forced-colors: active) {
  .ui-evl__tag, .ui-evl__status { border: 1px solid CanvasText; }
  .ui-evl__item[data-open] .ui-evl__row { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="evl"] *, [data-ui="evl"] *::before, [data-ui="evl"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-evidence-list")) customElements.define("tc-evidence-list", TcEvidenceList);

declare global {
  interface HTMLElementTagNameMap {
    "tc-evidence-list": TcEvidenceList;
  }
}
