import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { formatDate, pick } from "./internal/util";

/*
 * <tc-access-request> – a person asks for access to one piece of data. The resource is shown first: its name, what
 * kind of thing it is (dataset, table, file, report, field), its owner or steward, its classification in words and
 * what the person already has. Then the form: the access level (View, Download, Edit – or the page's own), how long
 * (7 / 30 / 90 days, an end date, or permanent when allowed), a required justification with a counter, an optional
 * ticket or reference, and the fields needed when the page lists them. Submitting fires a cancelable tc-request.
 * After that the card shows where the request stands – pending (who decides, when it was sent, Cancel request),
 * approved (the level and when it ends, with the time left), denied (the reason, Request again) or expired – each in
 * words with an icon, never colour alone. `status` is the page's to own.
 *   · the level and the duration are radio groups (arrow keys move and pick); errors are said in words, tied to their
 *     field, and the first invalid field takes focus
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-access-request .resource=${{ name: "Sensor readings 2024", type: "dataset", owner: "Field Data team",
 *     classification: "internal" }}></tc-access-request>
 */

/** A key – Lucide (ISC, lucide.dev) */
const keyIcon = svg`<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"></path><path d="m21 2-9.6 9.6"></path><circle cx="7.5" cy="15.5" r="5.5"></circle>`;

export type AccessStatus = "draft" | "pending" | "approved" | "denied" | "expired";
export type AccessTone = "success" | "info" | "warning" | "danger" | "neutral";
export type AccessResourceType = "dataset" | "table" | "file" | "report" | "field";
export type AccessResource = {
  name: string;
  /** dataset, table, file, report or field – or the page's own word */
  type?: AccessResourceType | string;
  /** One quiet line about it */
  description?: string;
  /** Who owns it */
  owner?: string;
  /** Who looks after it day to day */
  steward?: string;
  /** A key of `classifications`: public, internal, confidential, restricted – or the page's own */
  classification?: string;
  /** What the person has now, in words: "View", "No access" */
  current?: string;
};
export type AccessLevel = { id: string; label: string; description?: string };
export type AccessDuration = { id: string; label: string; days: number };
/** "permanent" and "custom" are the two durations with no fixed number of days */
export type AccessDurationId = string;

/** Details of the events */
export type AccessRequestDetail = {
  level: string;
  duration: AccessDurationId;
  /** When access would end, epoch ms – null for permanent */
  until: number | null;
  justification: string;
  reference: string;
  /** The fields asked for – empty when the page lists none, or none were picked */
  fields: string[];
};
export type AccessStatusChange = { status: AccessStatus };
export type AccessCancel = { status: AccessStatus };

/** The levels offered when the page gives none */
export const defaultAccessLevels: AccessLevel[] = [
  { id: "view", label: "View", description: "See it and query it here" },
  { id: "download", label: "Download", description: "Export a copy" },
  { id: "edit", label: "Edit", description: "Change and add records" },
];
/** The fixed durations offered when the page gives none; an end date and permanent are added by the element */
export const defaultAccessDurations: AccessDuration[] = [
  { id: "7d", label: "7 days", days: 7 },
  { id: "30d", label: "30 days", days: 30 },
  { id: "90d", label: "90 days", days: 90 },
];
/** The classifications' names and tones used when the page gives none */
export const defaultAccessClassifications: Record<string, { label: string; tone: AccessTone }> = {
  public: { label: "Public", tone: "success" },
  internal: { label: "Internal", tone: "info" },
  confidential: { label: "Confidential", tone: "warning" },
  restricted: { label: "Restricted", tone: "danger" },
};
const TYPE_LABEL: Record<string, string> = { dataset: "Dataset", table: "Table", file: "File", report: "Report", field: "Field" };
const DAY = 86_400_000;

/** The wall clock – read only when `now` isn't given, in willUpdate and handlers, never while rendering */
const clock = () => Date.now();

let uidCount = 0;

/* Database, table, file, chart, columns, lock, clock, check, x and history – Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const TYPE_ICON: Record<string, () => ReturnType<typeof lucide>> = {
  dataset: () => lucide(18, svg`<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5V19A9 3 0 0 0 21 19V5"></path><path d="M3 12A9 3 0 0 0 21 12"></path>`),
  table: () => lucide(18, svg`<path d="M12 3v18"></path><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M3 9h18"></path><path d="M3 15h18"></path>`),
  file: () => lucide(18, svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path>`),
  report: () => lucide(18, svg`<path d="M3 3v16a2 2 0 0 0 2 2h16"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path>`),
  field: () => lucide(18, svg`<rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M9 3v18"></path><path d="M15 3v18"></path>`),
};
const lockIcon = () => lucide(11, svg`<rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>`);
const STATUS_ICON: Record<Exclude<AccessStatus, "draft">, () => ReturnType<typeof lucide>> = {
  pending: () => lucide(18, svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>`),
  approved: () => lucide(18, svg`<circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path>`),
  denied: () => lucide(18, svg`<circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path>`),
  expired: () => lucide(18, svg`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l4 2"></path>`),
};
const STATUS_WORD: Record<Exclude<AccessStatus, "draft">, string> = { pending: "Waiting for approval", approved: "Access granted", denied: "Request denied", expired: "Access expired" };

/** A local date as a date input's value: 2026-10-29 */
const dayOf = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** "Priya", "Priya and Tom", "Priya, Tom and Ana" */
const names = (list: string[]) => (list.length < 2 ? (list[0] ?? "") : `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`);

/**
 * A request for access to one piece of data – the resource and its classification, the level, how long, a
 * justification – then where the request stands: pending, approved, denied or expired.
 * @tag tc-access-request
 * @fires tc-request - The form was sent ({ level, duration, until, justification, reference, fields }: AccessRequestDetail); cancelable – prevented, the form stays as it is
 * @fires tc-status-change - The status is about to change: pending after a request, draft after Cancel or Request again ({ status }: AccessStatusChange); cancelable – prevented, `status` stays as it was
 * @fires tc-cancel - Cancel request was used on a pending request ({ status }: AccessCancel); cancelable – prevented, the request stays pending
 */
export class TcAccessRequest extends TcElement {
  static override ui = "dar";

  /** The heading */
  @property() accessor heading = "Request access";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The data being asked for */
  @property({ attribute: false }) accessor resource: AccessResource | undefined = undefined;
  /** Classifications' names and tones, merged over the defaults (public, internal, confidential, restricted) */
  @property({ attribute: false }) accessor classifications: Record<string, { label: string; tone: AccessTone }> = {};
  /** The access levels to choose from */
  @property({ attribute: false }) accessor levels: AccessLevel[] = defaultAccessLevels;
  /** The picked level's id; by default the first level */
  @property() accessor level: string | undefined = undefined;
  /** The fixed durations to choose from; an end date is always offered, permanent only with `allow-permanent` */
  @property({ attribute: false }) accessor durations: AccessDuration[] = defaultAccessDurations;
  /** The picked duration: a duration's id, "custom" or "permanent"; by default the second duration (30 days) */
  @property() accessor duration: AccessDurationId | undefined = undefined;
  /** Offers Permanent as a duration */
  @property({ type: Boolean, attribute: "allow-permanent" }) accessor allowPermanent = false;
  /** The fewest characters a justification may have */
  @property({ type: Number, attribute: "min-justification" }) accessor minJustification = 20;
  /** The most characters a justification may have */
  @property({ type: Number, attribute: "max-justification" }) accessor maxJustification = 1000;
  /** The fields or columns that may be asked for; empty hides the choice */
  @property({ attribute: false }) accessor fields: string[] = [];
  /** The optional reference field's label; empty hides it */
  @property({ attribute: "reference-label" }) accessor referenceLabel = "Ticket or reference";
  /** Where the request stands. Changed by the element unless a tc-status-change listener calls preventDefault() */
  @property({ reflect: true }) accessor status: AccessStatus = "draft";
  /** Who decides, shown while pending */
  @property({ attribute: false }) accessor approvers: string[] = [];
  /** When the request was sent, epoch ms; set by the element when it sends one */
  @property({ type: Number, attribute: "submitted-at" }) accessor submittedAt: number | undefined = undefined;
  /** When granted access ends, epoch ms; unset while approved means permanent */
  @property({ type: Number, attribute: "expires-at" }) accessor expiresAt: number | undefined = undefined;
  /** Why the request was denied */
  @property() accessor reason: string | undefined = undefined;
  /** The clock for "time left", epoch ms – unset uses an internal clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** The language for dates, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  @state() private accessor justification = "";
  @state() private accessor reference = "";
  @state() private accessor until = "";
  @state() private accessor picked: string[] = [];
  @state() private accessor tried = false;
  @state() private accessor announce = "";
  /** The time used for "time left" and the end-date minimum, read in willUpdate */
  @state() private accessor tick = 0;

  private uid = `tc-dar-${++uidCount}`;

  private get levelId() {
    return this.levels.find((l) => l.id === this.level)?.id ?? this.levels[0]?.id ?? "";
  }
  private get durationOptions(): { id: string; label: string }[] {
    return [...this.durations, { id: "custom", label: "End date" }, ...(this.allowPermanent ? [{ id: "permanent", label: "Permanent" }] : [])];
  }
  private get durationId() {
    const ids = this.durationOptions.map((d) => d.id);
    if (this.duration && ids.includes(this.duration)) return this.duration;
    return this.durations[1]?.id ?? ids[0];
  }
  private classOf(key: string | undefined) {
    if (!key) return null;
    return this.classifications[key] ?? defaultAccessClassifications[key] ?? { label: key[0].toUpperCase() + key.slice(1), tone: "neutral" as AccessTone };
  }
  /** When access would end, epoch ms, null for permanent, NaN when an end date is needed */
  private endOf(at: number) {
    const d = this.durationId;
    if (d === "permanent") return null;
    if (d === "custom") {
      const t = this.until ? new Date(`${this.until}T23:59:59`).getTime() : NaN;
      return t;
    }
    const fixed = this.durations.find((x) => x.id === d);
    return at + (fixed?.days ?? 30) * DAY;
  }

  /** Problems by field, in words */
  private get errors() {
    const out: Record<string, string> = {};
    const len = this.justification.trim().length;
    if (!len) out.why = "Say why you need this access.";
    else if (len < this.minJustification) out.why = `Say a little more – at least ${this.minJustification} characters (${this.minJustification - len} more).`;
    else if (len > this.maxJustification) out.why = `Keep it under ${this.maxJustification} characters.`;
    if (this.durationId === "custom") {
      const end = this.endOf(this.tick);
      if (!this.until || Number.isNaN(end)) out.until = "Pick the date access should end.";
      else if ((end as number) <= this.tick) out.until = "The end date has to be in the future.";
    }
    if (this.fields.length && !this.picked.length) out.fields = "Pick at least one field.";
    return out;
  }

  private setStatus(next: AccessStatus) {
    if (next === this.status) return true;
    if (!this.emit<AccessStatusChange>("tc-status-change", { status: next }, { cancelable: true })) return false;
    this.status = next;
    return true;
  }

  private submit(e: Event) {
    e.preventDefault();
    this.tick = this.now ?? clock();
    this.tried = true;
    const errors = this.errors;
    const first = (["why", "until", "fields"] as const).find((k) => errors[k]);
    if (first) {
      this.announce = "";
      void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus());
      return;
    }
    const detail: AccessRequestDetail = {
      level: this.levelId,
      duration: this.durationId,
      until: this.endOf(this.tick),
      justification: this.justification.trim(),
      reference: this.reference.trim(),
      fields: this.fields.length ? this.fields.filter((f) => this.picked.includes(f)) : [],
    };
    if (!this.emit<AccessRequestDetail>("tc-request", detail, { cancelable: true })) return;
    if (!this.setStatus("pending")) return;
    if (this.submittedAt === undefined) this.submittedAt = this.tick;
    this.announce = "Request sent";
  }
  private cancelRequest() {
    if (!this.emit<AccessCancel>("tc-cancel", { status: this.status }, { cancelable: true })) return;
    if (this.setStatus("draft")) {
      this.submittedAt = undefined;
      this.announce = "Request cancelled";
    }
  }
  private requestAgain() {
    if (this.setStatus("draft")) {
      this.tried = false;
      this.submittedAt = undefined;
      this.announce = "";
    }
  }

  /** Arrow keys move and pick in a radio group */
  private radioKeys(ids: string[], current: string, set: (id: string) => void, group: string) {
    return (e: KeyboardEvent) => {
      const i = ids.indexOf(current);
      const to: Record<string, number> = { ArrowLeft: i - 1, ArrowUp: i - 1, ArrowRight: i + 1, ArrowDown: i + 1, Home: 0, End: ids.length - 1 };
      if (!(e.key in to)) return;
      e.preventDefault();
      const next = ids[(to[e.key] + ids.length) % ids.length];
      set(next);
      void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-${group}="${CSS.escape(next)}"]`)?.focus());
    };
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("now") || changed.has("status") || changed.has("expiresAt") || !this.tick) this.tick = this.now ?? clock();
    if (changed.has("fields")) this.picked = this.picked.filter((f) => this.fields.includes(f));
  }

  private renderResource(r: AccessResource) {
    const type = r.type ?? "dataset";
    const cls = this.classOf(r.classification);
    const who = [r.owner ? `Owner: ${r.owner}` : "", r.steward ? `Steward: ${r.steward}` : ""].filter(Boolean).join(" · ");
    return html`<div class="ui-dar__resource">
      <span class="ui-dar__type-icon" aria-hidden="true">${pick(TYPE_ICON, type, "dataset")()}</span>
      <span class="ui-dar__resource-main">
        <span class="ui-dar__resource-head">
          <span class="ui-dar__name">${r.name}</span>
          <span class="ui-dar__type">${TYPE_LABEL[type] ?? type}</span>
          ${cls ? html`<span class="ui-dar__class" data-tone=${cls.tone}>${lockIcon()}<span class="tc-sr-only">Classification: </span>${cls.label}</span>` : nothing}
        </span>
        ${r.description ? html`<span class="ui-dar__desc">${r.description}</span>` : nothing}
        ${who ? html`<span class="ui-dar__who">${who}</span>` : nothing}
        ${r.current ? html`<span class="ui-dar__current">You have: <strong>${r.current}</strong></span>` : nothing}
      </span>
    </div>`;
  }

  private renderForm() {
    const id = this.uid;
    const errors = this.tried ? this.errors : {};
    const level = this.levelId;
    const dur = this.durationId;
    const opts = this.durationOptions;
    const len = this.justification.trim().length;
    const levelIds = this.levels.map((l) => l.id);
    return html`<form class="ui-dar__form" novalidate @submit=${(e: Event) => this.submit(e)}>
      ${this.levels.length
        ? html`<div class="ui-dar__field">
            <span class="ui-dar__label" id=${`${id}-level`}>Access level</span>
            <div class="ui-dar__levels" role="radiogroup" aria-labelledby=${`${id}-level`} @keydown=${this.radioKeys(levelIds, level, (v) => (this.level = v), "level")}>
              ${this.levels.map(
                (l) => html`<button
                  type="button"
                  role="radio"
                  class="ui-dar__level"
                  data-level=${l.id}
                  aria-checked=${l.id === level ? "true" : "false"}
                  tabindex=${l.id === level ? 0 : -1}
                  @click=${() => (this.level = l.id)}
                ><span class="ui-dar__level-label">${l.label}</span>${l.description ? html`<span class="ui-dar__level-desc">${l.description}</span>` : nothing}</button>`,
              )}
            </div>
          </div>`
        : nothing}
      <div class="ui-dar__field">
        <span class="ui-dar__label" id=${`${id}-dur`}>For how long</span>
        <div class="ui-dar__chips" role="radiogroup" aria-labelledby=${`${id}-dur`} @keydown=${this.radioKeys(opts.map((o) => o.id), dur, (v) => (this.duration = v), "duration")}>
          ${opts.map(
            (o) => html`<button
              type="button"
              role="radio"
              class="ui-dar__chip"
              data-duration=${o.id}
              aria-checked=${o.id === dur ? "true" : "false"}
              tabindex=${o.id === dur ? 0 : -1}
              @click=${() => (this.duration = o.id)}
            >${o.label}</button>`,
          )}
        </div>
        ${dur === "custom"
          ? html`<label class="ui-dar__sub" for=${`${id}-until`}>Access ends on</label>
              <input
                class="ui-dar__input ui-dar__date"
                type="date"
                id=${`${id}-until`}
                data-field="until"
                min=${dayOf(this.tick + DAY)}
                .value=${this.until}
                aria-invalid=${errors.until ? "true" : "false"}
                aria-describedby=${ifDefined(errors.until ? `${id}-until-msg` : undefined)}
                @input=${(e: Event) => (this.until = (e.target as HTMLInputElement).value)}
              />
              ${errors.until ? html`<span class="ui-dar__msg" id=${`${id}-until-msg`}>${errors.until}</span>` : nothing}`
          : nothing}
      </div>
      ${this.fields.length
        ? html`<fieldset class="ui-dar__field ui-dar__fields" data-field="fields" tabindex="-1" aria-describedby=${ifDefined(errors.fields ? `${id}-fields-msg` : undefined)}>
            <legend class="ui-dar__label">Fields needed</legend>
            <div class="ui-dar__checks">
              ${this.fields.map(
                (f, i) => html`<label class="ui-dar__check" for=${`${id}-f${i}`}>
                  <input
                    type="checkbox"
                    id=${`${id}-f${i}`}
                    .checked=${this.picked.includes(f)}
                    @change=${(e: Event) => {
                      const on = (e.target as HTMLInputElement).checked;
                      this.picked = on ? [...this.picked, f] : this.picked.filter((x) => x !== f);
                    }}
                  /><span>${f}</span>
                </label>`,
              )}
            </div>
            ${errors.fields ? html`<span class="ui-dar__msg" id=${`${id}-fields-msg`}>${errors.fields}</span>` : nothing}
          </fieldset>`
        : nothing}
      <div class="ui-dar__field">
        <label class="ui-dar__label" for=${`${id}-why`}>Why you need it</label>
        <textarea
          class="ui-dar__input ui-dar__why"
          id=${`${id}-why`}
          data-field="why"
          rows="3"
          required
          aria-required="true"
          maxlength=${this.maxJustification}
          aria-invalid=${errors.why ? "true" : "false"}
          aria-describedby=${`${id}-why-count${errors.why ? ` ${id}-why-msg` : ""}`}
          placeholder="What you'll use it for, and why this level"
          .value=${this.justification}
          @input=${(e: Event) => (this.justification = (e.target as HTMLTextAreaElement).value)}
        ></textarea>
        <span class="ui-dar__count" id=${`${id}-why-count`}>${len < this.minJustification ? `${len} of at least ${this.minJustification} characters` : `${len} characters`}</span>
        ${errors.why ? html`<span class="ui-dar__msg" id=${`${id}-why-msg`}>${errors.why}</span>` : nothing}
      </div>
      ${this.referenceLabel
        ? html`<div class="ui-dar__field">
            <label class="ui-dar__label" for=${`${id}-ref`}>${this.referenceLabel} <span class="ui-dar__optional">(optional)</span></label>
            <input class="ui-dar__input" type="text" id=${`${id}-ref`} .value=${this.reference} @input=${(e: Event) => (this.reference = (e.target as HTMLInputElement).value)} />
          </div>`
        : nothing}
      <div class="ui-dar__actions">
        <button type="submit" class="ui-dar__btn ui-dar__btn--primary">Send request</button>
      </div>
    </form>`;
  }

  private timeLeft(until: number) {
    const ms = until - this.tick;
    if (ms <= 0) return "ended";
    const days = Math.floor(ms / DAY);
    if (days >= 1) return `${days} ${days === 1 ? "day" : "days"} left`;
    const hours = Math.max(1, Math.floor(ms / 3_600_000));
    return `${hours} ${hours === 1 ? "hour" : "hours"} left`;
  }

  private renderStatus(status: Exclude<AccessStatus, "draft">) {
    const levelLabel = this.levels.find((l) => l.id === this.levelId)?.label ?? "";
    const date = (ms: number) => formatDate(ms, this.locale, { day: "numeric", month: "short", year: "numeric" });
    const when = (ms: number) => formatDate(ms, this.locale, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
    let detail: unknown = nothing;
    let action: unknown = nothing;
    if (status === "pending") {
      detail = html`${levelLabel ? html`<span>${levelLabel} access requested${this.submittedAt !== undefined ? html` · sent ${when(this.submittedAt)}` : nothing}</span>` : nothing}
        ${this.approvers.length ? html`<span>Waiting for ${names(this.approvers)}</span>` : nothing}`;
      action = html`<button type="button" class="ui-dar__btn" @click=${() => this.cancelRequest()}>Cancel request</button>`;
    } else if (status === "approved") {
      detail = html`<span>${levelLabel ? `${levelLabel} access` : "Access"} ${this.expiresAt !== undefined ? html`until ${date(this.expiresAt)} · <span class="ui-dar__left">${this.timeLeft(this.expiresAt)}</span>` : "with no end date"}</span>`;
    } else if (status === "denied") {
      detail = this.reason ? html`<span class="ui-dar__reason">“${this.reason}”</span>` : nothing;
      action = html`<button type="button" class="ui-dar__btn" @click=${() => this.requestAgain()}>Request again</button>`;
    } else {
      detail = html`<span>${this.expiresAt !== undefined ? `Ended ${date(this.expiresAt)}` : "This access has ended"}</span>`;
      action = html`<button type="button" class="ui-dar__btn" @click=${() => this.requestAgain()}>Request again</button>`;
    }
    return html`<div class="ui-dar__status" data-status=${status}>
      <span class="ui-dar__status-icon">${STATUS_ICON[status]()}</span>
      <span class="ui-dar__status-text">
        <span class="ui-dar__status-word">${STATUS_WORD[status]}</span>
        <span class="ui-dar__status-detail">${detail}</span>
      </span>
      ${action}
    </div>`;
  }

  protected override render() {
    const id = this.uid;
    const status = (["draft", "pending", "approved", "denied", "expired"] as const).includes(this.status) ? this.status : "draft";
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      ${cardHead({ icon: keyIcon, title: this.heading, subtitle: this.description, id: `${id}-title` })}
      <div class="ui-dar__card" role="group" aria-labelledby=${`${id}-title`}>
        ${this.resource ? this.renderResource(this.resource) : nothing}
        ${status === "draft" ? this.renderForm() : this.renderStatus(status)}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="dar"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="dar"] {
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
[data-ui="dar"] { --tc-dar-status-icon: 18px; }
[data-ui="dar"] *, [data-ui="dar"] *::before, [data-ui="dar"] *::after { box-sizing: border-box; }
[data-ui="dar"] p { margin: 0; }
[data-ui="dar"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="dar"] svg[stroke-width] { stroke-width: 1.6; }
:where([data-look="standard"], [data-look="standard"] *).ui-dar__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-dar__card { border-top: var(--tc-hairline) solid var(--tc-divider); }
/* Tones */
[data-ui="dar"] [data-tone="success"] { --tc-dar-tone: var(--tc-status-success-fg); --tc-dar-tone-bg: var(--tc-status-success-bg); }
[data-ui="dar"] [data-tone="info"] { --tc-dar-tone: var(--tc-status-info-fg); --tc-dar-tone-bg: var(--tc-status-info-bg); }
[data-ui="dar"] [data-tone="warning"] { --tc-dar-tone: var(--tc-status-warning-fg); --tc-dar-tone-bg: var(--tc-status-warning-bg); }
[data-ui="dar"] [data-tone="danger"] { --tc-dar-tone: var(--tc-status-danger-fg); --tc-dar-tone-bg: var(--tc-status-danger-bg); }
[data-ui="dar"] [data-tone="neutral"] { --tc-dar-tone: var(--tc-text-muted); --tc-dar-tone-bg: var(--tc-fill-default); }
/* ----- The resource ----- */
.ui-dar__resource { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: start; gap: var(--tc-space-3); padding: var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-dar__type-icon { display: grid; place-items: center; width: 36px; height: 36px; border-radius: var(--tc-radius-md); background: var(--tc-fill-default); color: var(--tc-text-secondary); }
.ui-dar__resource-main { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-dar__resource-head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); }
.ui-dar__name { color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); overflow-wrap: anywhere; }
:where([data-look="standard"], [data-look="standard"] *).ui-dar__name { font-weight: var(--tc-font-weight-medium); }
.ui-dar__type { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-dar__class { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; background: var(--tc-dar-tone-bg); color: var(--tc-dar-tone); }
.ui-dar__desc { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
.ui-dar__who, .ui-dar__current { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-dar__current strong { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
/* ----- The form ----- */
.ui-dar__form { display: grid; gap: var(--tc-space-4); padding: var(--tc-space-4); }
.ui-dar__field { display: grid; gap: var(--tc-space-1-5); min-width: 0; margin: 0; padding: 0; border: 0; }
.ui-dar__fields:focus { outline: none; }
.ui-dar__fields:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-dar__label { padding: 0; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-dar__label { color: var(--tc-text-secondary); }
.ui-dar__optional { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-dar__sub { margin-top: var(--tc-space-1); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
/* Level: cards in a row, the chosen one ringed */
.ui-dar__levels { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: var(--tc-space-2); }
.ui-dar__level { display: grid; gap: var(--tc-space-0-5); align-content: start; min-height: var(--tc-control-h-lg); margin: 0; padding: var(--tc-space-2) var(--tc-space-3); border: 0; border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font: inherit; text-align: left; cursor: pointer; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-dar__level:hover { background: var(--tc-fill-subtle); }
.ui-dar__level[aria-checked="true"] { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 2px var(--tc-border-selected); }
.ui-dar__level:focus-visible, .ui-dar__chip:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-dar__level-label { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-dar__level-desc { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-dar__level[aria-checked="true"] .ui-dar__level-desc { color: var(--tc-text-secondary); }
/* Duration: chips, the chosen one ringed */
.ui-dar__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); }
.ui-dar__chip { height: var(--tc-control-h-sm); margin: 0; padding: 0 var(--tc-space-3); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-fill-default); font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); white-space: nowrap; cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-dar__chip:hover { background: var(--tc-fill-strong); }
.ui-dar__chip[aria-checked="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow), inset 0 0 0 1px var(--tc-border-selected); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
/* Fields needed */
.ui-dar__checks { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5) var(--tc-space-4); max-height: 160px; overflow: auto; }
.ui-dar__check { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-height: var(--tc-control-h-sm); font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); cursor: pointer; }
.ui-dar__check input { width: 16px; height: 16px; margin: 0; accent-color: var(--tc-action-primary-bg); }
/* Inputs: the field recipe */
.ui-dar__input { display: block; width: 100%; min-height: var(--tc-field-h); margin: 0; padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); outline: none; background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-field-font-size); color: var(--tc-text-primary); transition: box-shadow var(--tc-duration-quick) var(--tc-ease-standard); }
.ui-dar__input::placeholder { color: var(--tc-text-placeholder); }
.ui-dar__input:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-dar__input:focus { box-shadow: var(--tc-field-shadow-focus); }
.ui-dar__input[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-dar__input[aria-invalid="true"]:focus { box-shadow: var(--tc-field-shadow-invalid), 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
.ui-dar__why { min-height: calc(var(--tc-field-h) * 2.25); padding-top: var(--tc-space-2); padding-bottom: var(--tc-space-2); line-height: var(--tc-line-height-normal); resize: vertical; field-sizing: content; }
.ui-dar__date { width: auto; min-width: 180px; }
.ui-dar__count { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-dar__msg { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-status-danger-fg); }
/* Buttons: the secondary and primary recipes */
.ui-dar__actions { display: flex; justify-content: flex-end; }
.ui-dar__btn { display: inline-flex; flex: none; align-items: center; justify-content: center; height: var(--tc-control-h-md); margin: 0; padding: 0 var(--tc-control-px-md); border: 0; border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font: inherit; font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-quick) var(--tc-ease-standard); }
.ui-dar__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-dar__btn:active { transform: scale(0.98); }
.ui-dar__btn:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-dar__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-dar__btn--primary:hover { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
/* ----- Where it stands ----- */
.ui-dar__status { display: flex; align-items: flex-start; gap: var(--tc-space-3); padding: var(--tc-space-4); }
.ui-dar__status[data-status="pending"] { --tc-dar-tone: var(--tc-status-info-fg); }
.ui-dar__status[data-status="approved"] { --tc-dar-tone: var(--tc-status-success-fg); }
.ui-dar__status[data-status="denied"] { --tc-dar-tone: var(--tc-status-danger-fg); }
.ui-dar__status[data-status="expired"] { --tc-dar-tone: var(--tc-text-muted); }
.ui-dar__status-icon { margin-top: var(--tc-space-0-5); color: var(--tc-dar-tone); }
.ui-dar__status-text { display: grid; flex: 1; gap: var(--tc-space-0-5); min-width: 0; }
.ui-dar__status-word { font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-dar__status-detail { display: grid; gap: var(--tc-space-0-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-dar__left { color: var(--tc-text-primary); }
.ui-dar__reason { font-style: italic; }
@container (max-width: 420px) {
  .ui-dar__status { flex-wrap: wrap; }
  .ui-dar__status .ui-dar__btn { margin-left: calc(var(--tc-dar-status-icon) + var(--tc-space-3)); }
  .ui-dar__actions .ui-dar__btn { flex: 1; }
}
@media (forced-colors: active) {
  .ui-dar__class, .ui-dar__chip, .ui-dar__level { border: 1px solid ButtonText; }
  .ui-dar__chip[aria-checked="true"], .ui-dar__level[aria-checked="true"] { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="dar"] *, [data-ui="dar"] *::before, [data-ui="dar"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-access-request")) customElements.define("tc-access-request", TcAccessRequest);

declare global {
  interface HTMLElementTagNameMap {
    "tc-access-request": TcAccessRequest;
  }
}
