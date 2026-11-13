import { html, nothing, svg, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-deploy-channels> – where an agent can be reached, one row per place: a web widget, the API, team chat, email,
 * text messages, voice. Each row says whether it's live, a draft, paused, not set up or failing (a mark and a word),
 * which version of the agent it serves, how many messages it handled in the last 7 days, and what can be done:
 * Set up, Configure, Pause or Resume. Live channels come first, then the ones that need attention.
 *   · names are generic and the icons are Lucide's; a page with its own mark passes it as `icon`
 *   · Pause and Resume change the row's status themselves (tc-channels-change) unless a listener prevents it
 *   · narrow, a row's numbers and actions move under its name
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-deploy-channels .channels=${[{ id: "web", kind: "widget", name: "Intranet widget", status: "live" }]}></tc-deploy-channels>
 */

export type DeployChannelKind = "widget" | "api" | "chat" | "email" | "sms" | "voice" | "custom";
export type DeployChannelStatus = "live" | "error" | "paused" | "draft" | "not-set-up";
export type DeployChannelAction = "setup" | "configure" | "pause" | "resume";

export type DeployChannel = {
  id: string;
  kind: DeployChannelKind;
  /** What people call it: "Intranet widget", "Team chat" */
  name: string;
  /** A quieter line: where it is, an address or a number */
  detail?: string;
  status: DeployChannelStatus;
  /** Which version of the agent it answers with; unset for a channel that isn't set up */
  version?: "live" | "draft";
  /** Messages per day over the last 7 days, oldest first */
  traffic?: number[];
  /** What's wrong, for a channel whose status is "error" */
  error?: string;
  /** The page's own icon, in place of the kind's */
  icon?: Element;
};

/** Details of the events */
export type DeployChannelActionDetail = { id: string; action: DeployChannelAction; channel: DeployChannel };
export type DeployChannelsChange = { channels: DeployChannel[]; id: string };

export type DeployChannelsLabels = {
  status: Record<DeployChannelStatus, string>;
  action: Record<DeployChannelAction, string>;
  version: Record<"live" | "draft", string>;
  /** "{n} messages in the last 7 days" */
  traffic: string;
  noTraffic: string;
  /** Header summary: "{live} live" and "{attention} need attention" */
  live: string;
  attention: string;
  empty: string;
  /** Announced after Pause / Resume: "{name} paused", "{name} is live again" */
  paused: string;
  resumed: string;
};

export const defaultDeployChannelsLabels: DeployChannelsLabels = {
  status: { live: "Live", error: "Error", paused: "Paused", draft: "Draft", "not-set-up": "Not set up" },
  action: { setup: "Set up", configure: "Configure", pause: "Pause", resume: "Resume" },
  version: { live: "Live version", draft: "Draft version" },
  traffic: "{n} messages in the last 7 days",
  noTraffic: "No messages yet",
  live: "{n} live",
  attention: "{n} need attention",
  empty: "No channels yet",
  paused: "{name} paused",
  resumed: "{name} is live again",
};

export type DeployChannelsLabelsInput = Partial<Omit<DeployChannelsLabels, "status" | "action" | "version">> & {
  status?: Partial<DeployChannelsLabels["status"]>;
  action?: Partial<DeployChannelsLabels["action"]>;
  version?: Partial<DeployChannelsLabels["version"]>;
};

const RANK: Record<DeployChannelStatus, number> = { live: 0, error: 1, paused: 2, draft: 3, "not-set-up": 4 };

/** The actions a row offers, by status */
export function channelActions(status: DeployChannelStatus): DeployChannelAction[] {
  if (status === "not-set-up") return ["setup"];
  if (status === "live") return ["configure", "pause"];
  if (status === "paused") return ["configure", "resume"];
  return ["configure"];
}

/** The channels in the order shown: live first, then errors, paused, drafts and the ones not set up; stable within each */
export function orderChannels(channels: DeployChannel[]) {
  return channels.map((c, i) => ({ c, i })).sort((a, b) => RANK[a.c.status] - RANK[b.c.status] || a.i - b.i).map((x) => x.c);
}

/* The kinds' icons and the header's: Lucide (ISC, lucide.dev) */
const ICON: Record<Exclude<DeployChannelKind, "custom">, TemplateResult> = {
  widget: svg`<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>`,
  api: svg`<path d="m16 18 6-6-6-6"></path><path d="m8 6-6 6 6 6"></path>`,
  chat: svg`<path d="M4 9h16"></path><path d="M4 15h16"></path><path d="M10 3 8 21"></path><path d="m16 3-2 18"></path>`,
  email: svg`<rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>`,
  sms: svg`<rect width="14" height="20" x="5" y="2" rx="2"></rect><path d="M12 18h.01"></path>`,
  voice: svg`<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>`,
};
const CUSTOM = svg`<circle cx="12" cy="12" r="9"></circle>`;
const HEAD = svg`<path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path>`;

const fill = (s: string, values: Record<string, string>) => s.replace(/\{(\w+)\}/g, (m, k: string) => values[k] ?? m);

/**
 * Where an agent can be reached – one row per channel with its status in words, the version it serves, last week's traffic and Set up, Configure, Pause or Resume.
 * @tag tc-deploy-channels
 * @fires tc-channel-action - A row's action was pressed ({ id, action, channel }: DeployChannelActionDetail); cancelable – prevented, Pause and Resume leave the status as it was
 * @fires tc-channels-change - Pause or Resume changed a row's status ({ channels, id }: DeployChannelsChange); cancelable – prevented, `channels` stays as it was
 */
export class TcDeployChannels extends TcElement {
  static override ui = "dpc";

  /** The heading */
  @property() accessor heading = "Channels";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The channels. Pause and Resume change a row's status here unless a tc-channels-change listener prevents it */
  @property({ attribute: false }) accessor channels: DeployChannel[] = [];
  /** Words the component uses, merged over defaultDeployChannelsLabels */
  @property({ attribute: false }) accessor labels: DeployChannelsLabelsInput = {};
  /** The locale for numbers; unset follows the page */
  @property() accessor locale: string | undefined = undefined;

  @state() private accessor said = "";

  private get words(): DeployChannelsLabels {
    const l = this.labels ?? {};
    const d = defaultDeployChannelsLabels;
    return { ...d, ...l, status: { ...d.status, ...l.status }, action: { ...d.action, ...l.action }, version: { ...d.version, ...l.version } };
  }

  private act(channel: DeployChannel, action: DeployChannelAction) {
    if (!this.emit<DeployChannelActionDetail>("tc-channel-action", { id: channel.id, action, channel }, { cancelable: true })) return;
    if (action !== "pause" && action !== "resume") return;
    const status: DeployChannelStatus = action === "pause" ? "paused" : "live";
    const channels = this.channels.map((c) => (c.id === channel.id ? { ...c, status } : c));
    if (!this.emit<DeployChannelsChange>("tc-channels-change", { channels, id: channel.id }, { cancelable: true })) return;
    this.channels = channels;
    const w = this.words;
    this.said = fill(action === "pause" ? w.paused : w.resumed, { name: channel.name });
    // The pressed button is replaced by its opposite: keep focus there
    const next = action === "pause" ? "resume" : "pause";
    void this.updateComplete.then(() =>
      this.querySelector<HTMLElement>(`.ui-dpc__row[data-id="${CSS.escape(channel.id)}"] .ui-dpc__action[data-action="${next}"]`)?.focus(),
    );
  }

  private icon(c: DeployChannel) {
    if (c.icon) return html`<span class="ui-dpc__icon ui-dpc__icon--own" aria-hidden="true">${c.icon}</span>`;
    return html`<svg class="ui-dpc__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${c.kind === "custom" ? CUSTOM : ICON[c.kind]}</svg>`;
  }

  private spark(values: number[]) {
    const max = Math.max(1, ...values);
    const step = values.length > 1 ? 56 / (values.length - 1) : 0;
    const points = values.map((v, i) => `${(i * step).toFixed(1)},${(15 - (Math.max(0, v) / max) * 13).toFixed(1)}`).join(" ");
    return html`<svg class="ui-dpc__spark" viewBox="0 0 56 16" preserveAspectRatio="none" aria-hidden="true"><polyline points=${points} fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"></polyline></svg>`;
  }

  private renderRow(c: DeployChannel, w: DeployChannelsLabels, nf: Intl.NumberFormat) {
    const total = c.traffic?.reduce((a, b) => a + Math.max(0, b), 0);
    return html`<li class="ui-dpc__row" data-id=${c.id} data-status=${c.status}>
      ${this.icon(c)}
      <div class="ui-dpc__main">
        <span class="ui-dpc__name">${c.name}</span>
        ${c.detail ? html`<span class="ui-dpc__detail">${c.detail}</span>` : nothing}
        ${c.status === "error" && c.error ? html`<span class="ui-dpc__error">${c.error}</span>` : nothing}
      </div>
      <span class="ui-dpc__status"><span class="ui-dpc__mark" aria-hidden="true"></span>${w.status[c.status]}</span>
      <span class="ui-dpc__version">${c.version && c.status !== "not-set-up" ? w.version[c.version] : nothing}</span>
      <span class="ui-dpc__traffic">
        ${c.status === "not-set-up"
          ? nothing
          : total != null && c.traffic!.length
            ? html`${this.spark(c.traffic!)}<span class="ui-dpc__count">${fill(w.traffic, { n: nf.format(total) })}</span>`
            : html`<span class="ui-dpc__count">${w.noTraffic}</span>`}
      </span>
      <span class="ui-dpc__actions">
        ${channelActions(c.status).map(
          (a) => html`<button type="button" class=${`ui-dpc__action${a === "setup" ? " ui-dpc__action--primary" : ""}`} data-action=${a} @click=${() => this.act(c, a)}>
            ${w.action[a]}<span class="tc-sr-only"> ${c.name}</span>
          </button>`,
        )}
      </span>
    </li>`;
  }

  protected override render() {
    const w = this.words;
    const nf = new Intl.NumberFormat(this.locale);
    const rows = orderChannels(this.channels ?? []);
    const live = rows.filter((c) => c.status === "live").length;
    const attention = rows.filter((c) => c.status === "error").length;
    const aside = rows.length
      ? html`<span class="ui-dpc__summary">${fill(w.live, { n: nf.format(live) })}${attention ? html` · <span class="ui-dpc__summary-alert">${fill(w.attention, { n: nf.format(attention) })}</span>` : nothing}</span>`
      : nothing;
    return html`${cardHead({ icon: HEAD, title: this.heading, subtitle: this.description, aside })}
      <div class="ui-dpc__card">
        ${rows.length
          ? html`<ul class="ui-dpc__list" aria-label=${this.heading || "Channels"}>${repeat(rows, (c) => c.id, (c) => this.renderRow(c, w, nf))}</ul>`
          : html`<p class="ui-dpc__empty">${w.empty}</p>`}
      </div>
      <span class="tc-sr-only" role="status">${this.said}</span>`;
  }

  static override css = /* css */ `
[data-ui="dpc"] {
  --tc-dpc-spark-w: 56px;
  --tc-dpc-spark-h: 16px;
  --tc-dpc-mark: 8px;
  --tc-dpc-icon: 18px;
  container-type: inline-size;
}
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="dpc"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="dpc"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
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
[data-ui="dpc"] *, [data-ui="dpc"] *::before, [data-ui="dpc"] *::after { box-sizing: border-box; }
:where([data-ui="dpc"]) button { margin: 0; border: 0; font: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="dpc"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="dpc"] ul { margin: 0; padding: 0; list-style: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-dpc__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-dpc__summary { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); white-space: nowrap; }
.ui-dpc__summary-alert { color: var(--tc-status-danger-fg); }
.ui-dpc__list { display: grid; }
.ui-dpc__row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto auto auto;
  grid-template-areas: "icon main status version traffic actions";
  align-items: center;
  column-gap: var(--tc-space-3);
  row-gap: var(--tc-space-1);
  min-height: var(--tc-control-h-md);
  padding: var(--tc-space-3) var(--tc-space-4);
}
.ui-dpc__row + .ui-dpc__row { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-dpc__icon { grid-area: icon; display: block; width: var(--tc-dpc-icon); height: var(--tc-dpc-icon); color: var(--tc-icon-muted); }
.ui-dpc__icon--own { display: grid; place-items: center; }
.ui-dpc__icon--own > * { max-width: 100%; max-height: 100%; }
.ui-dpc__main { grid-area: main; display: grid; min-width: 0; }
.ui-dpc__name { overflow: hidden; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); text-overflow: ellipsis; white-space: nowrap; }
.ui-dpc__detail { overflow: hidden; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
.ui-dpc__error { color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-dpc__status {
  grid-area: status;
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1);
  height: var(--tc-pill-h);
  padding: 0 var(--tc-pill-px);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-fill-subtle);
  color: var(--tc-text-secondary);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-pill-font-weight);
  white-space: nowrap;
}
.ui-dpc__mark { width: var(--tc-dpc-mark); height: var(--tc-dpc-mark); border-radius: var(--tc-radius-full); border: var(--tc-hairline) solid currentColor; }
[data-status="live"] > .ui-dpc__status { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
[data-status="live"] .ui-dpc__mark { background: currentColor; }
[data-status="error"] > .ui-dpc__status { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
[data-status="error"] .ui-dpc__mark { background: currentColor; border-radius: var(--tc-radius-2xs); }
[data-status="paused"] > .ui-dpc__status { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
[data-status="draft"] > .ui-dpc__status { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
[data-status="not-set-up"] > .ui-dpc__status { color: var(--tc-text-muted); }
[data-status="not-set-up"] .ui-dpc__mark { border-style: dashed; }
.ui-dpc__version { grid-area: version; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); white-space: nowrap; }
.ui-dpc__traffic { grid-area: traffic; display: inline-flex; align-items: center; gap: var(--tc-space-2); min-width: 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-dpc__spark { flex: none; width: var(--tc-dpc-spark-w); height: var(--tc-dpc-spark-h); color: var(--tc-accent); }
.ui-dpc__count { white-space: nowrap; }
.ui-dpc__actions { grid-area: actions; display: inline-flex; justify-content: flex-end; gap: var(--tc-space-1); }
.ui-dpc__action {
  display: inline-flex;
  align-items: center;
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-control-px-sm);
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  color: var(--tc-action-secondary-fg);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  white-space: nowrap;
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-dpc__action:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-dpc__action--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-dpc__action--primary:hover { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-dpc__empty { margin: 0; padding: var(--tc-space-4); color: var(--tc-text-muted); text-align: center; }
/* Narrow: the version, traffic and actions go under the name */
@container (max-width: 640px) {
  .ui-dpc__row {
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-areas: "icon main status" ". version version" ". traffic traffic" ". actions actions";
  }
  .ui-dpc__actions { justify-content: flex-start; }
  .ui-dpc__version:empty { display: none; }
}
@media (prefers-reduced-motion: reduce) { .ui-dpc__action { transition: none; } }
@media (forced-colors: active) {
  .ui-dpc__icon, .ui-dpc__spark { color: CanvasText; }
  .ui-dpc__status { border: 1px solid CanvasText; }
  .ui-dpc__action { border: 1px solid ButtonText; }
}
`;
}

if (!customElements.get("tc-deploy-channels")) customElements.define("tc-deploy-channels", TcDeployChannels);
declare global {
  interface HTMLElementTagNameMap {
    "tc-deploy-channels": TcDeployChannels;
  }
}
