import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { copyText, formatDate } from "./internal/util";

/*
 * <tc-webhooks> – the webhook endpoints a workspace sends events to: each endpoint's address, what it's for, which
 * events it gets, whether it's on, and how its deliveries have gone lately, in words – "3 of 48 failed in the last 24
 * hours". An endpoint opens to its recent deliveries: when, which event, the HTTP status (or "No response"), how long
 * it took, which attempt, "Retrying at 14:05" while a retry waits, and Retry on a failed one.
 *   · the switch turns an endpoint on and off (tc-endpoint-toggle); Send test event, Edit (a form in place) and Delete
 *     (asks first) act on one endpoint
 *   · Add endpoint opens a form: an https address, a description and the events, with All events; it fires
 *     tc-endpoint-create, and the page adds the endpoint
 *   · with `secret`, an endpoint's signing secret shows masked, with Show and Copy
 *   · times are epoch ms; the element reads the clock when it updates unless `now` is given
 * It only shows and asks: the server sends, signs and retries.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-webhooks .endpoints=${endpoints} .eventTypes=${eventTypes}></tc-webhooks>
 */

export type WebhookDelivery = {
  id: string;
  /** Epoch ms */
  at: number;
  /** The event type's id */
  event: string;
  /** The HTTP status the endpoint answered with; null when it didn't answer */
  status: number | null;
  ok: boolean;
  durationMs?: number;
  attempt?: number;
  /** Epoch ms of the next try, while a retry waits */
  nextRetryAt?: number;
};
export type WebhookEndpoint = {
  id: string;
  url: string;
  description?: string;
  /** The event type ids it gets */
  events: string[];
  enabled: boolean;
  /** The signing secret, shown masked with Show and Copy */
  secret?: string;
  /** Recent deliveries, newest first */
  deliveries?: WebhookDelivery[];
};
export type WebhookEventType = { id: string; label: string; description?: string };
export type WebhookEndpointToggle = { id: string; enabled: boolean; endpoints: WebhookEndpoint[] };
export type WebhookEndpointCreate = { url: string; description: string; events: string[] };
export type WebhookEndpointUpdate = { id: string; url: string; description: string; events: string[]; endpoints: WebhookEndpoint[] };
export type WebhookEndpointDelete = { id: string; endpoints: WebhookEndpoint[] };
export type WebhookEndpointTest = { id: string };
export type WebhookDeliveryRetry = { endpointId: string; deliveryId: string };

/** The element's words, every one renameable through `labels` */
export type WebhooksLabels = {
  heading: string;
  add: string;
  /** {n} */
  count: string;
  enabled: string;
  paused: string;
  /** {failed} and {total} */
  health: string;
  /** {n} */
  allDelivered: string;
  quiet: string;
  noDeliveries: string;
  /** {n} */
  deliveries: string;
  delivered: string;
  failed: string;
  /** {time} */
  retrying: string;
  noResponse: string;
  /** {n} */
  attempt: string;
  retry: string;
  test: string;
  edit: string;
  remove: string;
  keep: string;
  confirmRemove: string;
  url: string;
  urlHint: string;
  urlInvalid: string;
  description: string;
  events: string;
  allEvents: string;
  eventsRequired: string;
  save: string;
  create: string;
  cancel: string;
  secret: string;
  show: string;
  hide: string;
  copy: string;
  copied: string;
  copyFailed: string;
  empty: string;
  emptyHint: string;
  /** {url} */
  announceDeleted: string;
  /** {url} */
  announceOn: string;
  /** {url} */
  announceOff: string;
  /** {url} */
  announceSaved: string;
};
export const defaultWebhooksLabels: WebhooksLabels = {
  heading: "Webhooks",
  add: "Add endpoint",
  count: "{n} endpoints",
  enabled: "Sending",
  paused: "Paused – events aren't sent",
  health: "{failed} of {total} failed in the last 24 hours",
  allDelivered: "All {n} delivered in the last 24 hours",
  quiet: "No deliveries in the last 24 hours",
  noDeliveries: "No deliveries yet",
  deliveries: "Recent deliveries ({n})",
  delivered: "Delivered",
  failed: "Failed",
  retrying: "Retrying at {time}",
  noResponse: "No response",
  attempt: "Attempt {n}",
  retry: "Retry",
  test: "Send test event",
  edit: "Edit",
  remove: "Delete",
  keep: "Keep",
  confirmRemove: "Events stop going to this address at once.",
  url: "Endpoint URL",
  urlHint: "An https:// address that answers with a 2xx status.",
  urlInvalid: "Use an https:// address.",
  description: "Description",
  events: "Events",
  allEvents: "All events",
  eventsRequired: "Pick at least one event.",
  save: "Save",
  create: "Add endpoint",
  cancel: "Cancel",
  secret: "Signing secret",
  show: "Show",
  hide: "Hide",
  copy: "Copy",
  copied: "Copied",
  copyFailed: "Couldn't copy the secret.",
  empty: "No endpoints yet.",
  emptyHint: "Add one to have events sent to another app.",
  announceDeleted: "Deleted {url}",
  announceOn: "Sending events to {url}",
  announceOff: "Paused {url}",
  announceSaved: "Saved {url}",
};

/** A webhook: Lucide (ISC, lucide.dev) */
const ICON = svg`<path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2"></path><path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06"></path><path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8"></path>`;
const CHEVRON = svg`<path d="m9 18 6-6-6-6"></path>`;
const DAY = 86_400_000;
let instances = 0;

/** Whether an address is one a webhook may be sent to: https, with a host */
export function webhookUrlOk(url: string) {
  try {
    const u = new URL(url.trim());
    return u.protocol === "https:" && !!u.hostname;
  } catch {
    return false;
  }
}

/** How an endpoint's last 24 hours went: deliveries, and how many of them failed (a waiting retry counts as failed) */
export function webhookHealth(endpoint: Pick<WebhookEndpoint, "deliveries">, now: number) {
  const all = endpoint.deliveries ?? [];
  const recent = all.filter((d) => d.at > now - DAY && d.at <= now);
  return { ever: all.length, total: recent.length, failed: recent.filter((d) => !d.ok).length };
}

type Draft = { url: string; description: string; events: string[] };

/**
 * A workspace's webhook endpoints: events, an on/off switch, delivery health in words, recent deliveries with Retry,
 * and Add, Edit, Send test event and Delete.
 * @tag tc-webhooks
 * @fires tc-endpoint-toggle - An endpoint's switch was flipped ({ id, enabled, endpoints }: WebhookEndpointToggle); cancelable – prevented, `endpoints` stays as it was
 * @fires tc-endpoint-create - Add endpoint was submitted ({ url, description, events }: WebhookEndpointCreate); cancelable – prevented, the form stays open. The page adds the endpoint
 * @fires tc-endpoint-update - An edit was saved ({ id, url, description, events, endpoints }: WebhookEndpointUpdate); cancelable – prevented, the form stays open and `endpoints` stays as it was
 * @fires tc-endpoint-delete - Delete was confirmed ({ id, endpoints }: WebhookEndpointDelete); cancelable – prevented, `endpoints` stays as it was
 * @fires tc-endpoint-test - Send test event was pressed ({ id }: WebhookEndpointTest)
 * @fires tc-delivery-retry - Retry was pressed on a failed delivery ({ endpointId, deliveryId }: WebhookDeliveryRetry)
 */
export class TcWebhooks extends TcElement {
  static override ui = "whe";

  /** The heading; by default "Webhooks" */
  @property() accessor heading = "";
  /** A line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The endpoints. Toggling, editing and deleting change it unless the event's listener calls preventDefault() */
  @property({ attribute: false }) accessor endpoints: WebhookEndpoint[] = [];
  /** The events an endpoint can get, offered as checkboxes and named on its chips */
  @property({ attribute: false }) accessor eventTypes: WebhookEventType[] = [];
  /** How many recent deliveries an open endpoint lists */
  @property({ type: Number, attribute: "max-deliveries" }) accessor maxDeliveries = 10;
  /** Hides Add, Edit, Delete and the switches, for people who may only look */
  @property({ type: Boolean, attribute: "read-only" }) accessor readOnly = false;
  /** "Now" in epoch ms; unset, the clock's */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** The locale for times */
  @property() accessor locale: string | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<WebhooksLabels> = {};

  /** @internal The endpoints showing their deliveries */
  @state() accessor openIds: string[] = [];
  /** "new", an endpoint's id, or null */
  @state() private accessor editing: string | null = null;
  @state() private accessor draft: Draft = { url: "", description: "", events: [] };
  @state() private accessor urlError = false;
  @state() private accessor eventsError = false;
  @state() private accessor confirming: string | null = null;
  @state() private accessor shown: string | null = null;
  @state() private accessor copied: string | null = null;
  @state() private accessor announce = "";
  private clock = 0;
  private readonly uid = `tc-whe-${++instances}`;

  private get words(): WebhooksLabels {
    return { ...defaultWebhooksLabels, ...this.labels };
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.clock = this.now ?? Date.now();
  }

  private focusOn(selector: string) {
    this.updateComplete.then(() => this.querySelector<HTMLElement>(selector)?.focus());
  }

  private sel(id: string, cls: string) {
    return `[data-endpoint="${CSS.escape(id)}"] ${cls}`;
  }

  private time(ms: number) {
    const sameDay = new Date(ms).toDateString() === new Date(this.clock).toDateString();
    return formatDate(ms, this.locale, sameDay ? { timeStyle: "short" } : { dateStyle: "medium", timeStyle: "short" });
  }

  private eventLabel(id: string) {
    return this.eventTypes.find((e) => e.id === id)?.label ?? id;
  }

  private toggle(ep: WebhookEndpoint) {
    const enabled = !ep.enabled;
    const endpoints = this.endpoints.map((e) => (e.id === ep.id ? { ...e, enabled } : e));
    if (!this.emit<WebhookEndpointToggle>("tc-endpoint-toggle", { id: ep.id, enabled, endpoints }, { cancelable: true })) return;
    this.endpoints = endpoints;
    this.announce = (enabled ? this.words.announceOn : this.words.announceOff).replace("{url}", ep.url);
  }

  private startForm(ep: WebhookEndpoint | null) {
    this.confirming = null;
    this.editing = ep ? ep.id : "new";
    this.draft = ep ? { url: ep.url, description: ep.description ?? "", events: [...ep.events] } : { url: "", description: "", events: [] };
    this.urlError = false;
    this.eventsError = false;
    this.focusOn(".ui-whe__url-input");
  }

  private closeForm() {
    const was = this.editing;
    this.editing = null;
    this.focusOn(was && was !== "new" ? this.sel(was, ".ui-whe__edit") : ".ui-whe__add");
  }

  private submit(e: Event) {
    e.preventDefault();
    const url = this.draft.url.trim();
    this.urlError = !webhookUrlOk(url);
    this.eventsError = this.draft.events.length === 0;
    if (this.urlError || this.eventsError) {
      this.focusOn(this.urlError ? ".ui-whe__url-input" : ".ui-whe__all-events");
      return;
    }
    const description = this.draft.description.trim();
    const events = this.eventTypes.length ? this.eventTypes.map((t) => t.id).filter((id) => this.draft.events.includes(id)) : [...this.draft.events];
    if (this.editing === "new") {
      if (!this.emit<WebhookEndpointCreate>("tc-endpoint-create", { url, description, events }, { cancelable: true })) return;
      this.editing = null;
      this.focusOn(".ui-whe__add");
      return;
    }
    const id = this.editing!;
    const endpoints = this.endpoints.map((x) => (x.id === id ? { ...x, url, description: description || undefined, events } : x));
    if (!this.emit<WebhookEndpointUpdate>("tc-endpoint-update", { id, url, description, events, endpoints }, { cancelable: true })) return;
    this.endpoints = endpoints;
    this.editing = null;
    this.announce = this.words.announceSaved.replace("{url}", url);
    this.focusOn(this.sel(id, ".ui-whe__edit"));
  }

  private removeEndpoint(ep: WebhookEndpoint) {
    this.confirming = null;
    const endpoints = this.endpoints.filter((e) => e.id !== ep.id);
    if (!this.emit<WebhookEndpointDelete>("tc-endpoint-delete", { id: ep.id, endpoints }, { cancelable: true })) {
      this.focusOn(this.sel(ep.id, ".ui-whe__remove"));
      return;
    }
    this.endpoints = endpoints;
    this.openIds = this.openIds.filter((x) => x !== ep.id);
    this.announce = this.words.announceDeleted.replace("{url}", ep.url);
    this.focusOn(".ui-whe__add");
  }

  private async copySecret(ep: WebhookEndpoint) {
    if (!ep.secret) return;
    if (await copyText(ep.secret)) {
      this.copied = ep.id;
      this.announce = this.words.copied;
    } else this.announce = this.words.copyFailed;
  }

  private healthText(ep: WebhookEndpoint) {
    const w = this.words;
    const h = webhookHealth(ep, this.clock);
    if (!h.ever) return { text: w.noDeliveries, tone: "none" };
    if (!h.total) return { text: w.quiet, tone: "none" };
    if (!h.failed) return { text: w.allDelivered.replace("{n}", String(h.total)), tone: "ok" };
    return { text: w.health.replace("{failed}", String(h.failed)).replace("{total}", String(h.total)), tone: h.failed / h.total >= 0.5 ? "bad" : "warn" };
  }

  private renderForm(ep: WebhookEndpoint | null) {
    const w = this.words;
    const id = ep ? ep.id : "new";
    const urlId = `${this.uid}-${id}-url`;
    const hintId = `${urlId}-hint`;
    const errId = `${urlId}-error`;
    const descId = `${this.uid}-${id}-desc`;
    const evErr = `${this.uid}-${id}-events-error`;
    const all = this.eventTypes.length > 0 && this.eventTypes.every((t) => this.draft.events.includes(t.id));
    const some = !all && this.draft.events.length > 0;
    return html`<form class="ui-whe__form" aria-label=${ep ? `${w.edit}, ${ep.url}` : w.create} novalidate @submit=${(e: Event) => this.submit(e)} @keydown=${(e: KeyboardEvent) => e.key === "Escape" && this.closeForm()}>
      <div class="ui-whe__field">
        <label class="ui-whe__label" for=${urlId}>${w.url}</label>
        <input
          id=${urlId}
          class="ui-whe__input ui-whe__url-input"
          type="url"
          inputmode="url"
          autocomplete="off"
          spellcheck="false"
          required
          placeholder="https://"
          aria-invalid=${this.urlError ? "true" : "false"}
          aria-describedby=${this.urlError ? `${errId} ${hintId}` : hintId}
          .value=${live(this.draft.url)}
          @input=${(e: Event) => {
            this.draft = { ...this.draft, url: (e.target as HTMLInputElement).value };
            if (this.urlError && webhookUrlOk(this.draft.url)) this.urlError = false;
          }}
        />
        ${this.urlError ? html`<p class="ui-whe__error" id=${errId}>${w.urlInvalid}</p>` : nothing}
        <p class="ui-whe__hint" id=${hintId}>${w.urlHint}</p>
      </div>
      <div class="ui-whe__field">
        <label class="ui-whe__label" for=${descId}>${w.description}</label>
        <input id=${descId} class="ui-whe__input" type="text" autocomplete="off" .value=${live(this.draft.description)} @input=${(e: Event) => (this.draft = { ...this.draft, description: (e.target as HTMLInputElement).value })} />
      </div>
      <fieldset class="ui-whe__group" aria-describedby=${this.eventsError ? evErr : nothing}>
        <legend class="ui-whe__label">${w.events}</legend>
        ${this.eventTypes.length > 1
          ? html`<label class="ui-whe__check ui-whe__check-all">
              <input
                class="ui-whe__all-events"
                type="checkbox"
                .checked=${live(all)}
                .indeterminate=${some}
                @change=${(e: Event) => {
                  this.draft = { ...this.draft, events: (e.target as HTMLInputElement).checked ? this.eventTypes.map((t) => t.id) : [] };
                  if (this.draft.events.length) this.eventsError = false;
                }}
              />
              <span>${w.allEvents}</span>
            </label>`
          : nothing}
        <div class="ui-whe__checks">
          ${this.eventTypes.map(
            (t, k) => html`<label class="ui-whe__check">
              <input
                class=${k === 0 && this.eventTypes.length <= 1 ? "ui-whe__all-events" : ""}
                type="checkbox"
                .checked=${live(this.draft.events.includes(t.id))}
                @change=${(e: Event) => {
                  const on = (e.target as HTMLInputElement).checked;
                  this.draft = { ...this.draft, events: on ? [...this.draft.events, t.id] : this.draft.events.filter((x) => x !== t.id) };
                  if (this.draft.events.length) this.eventsError = false;
                }}
              />
              <span class="ui-whe__check-text"><span class="ui-whe__event-id">${t.label}</span>${t.description ? html`<span class="ui-whe__hint">${t.description}</span>` : nothing}</span>
            </label>`,
          )}
        </div>
        ${this.eventsError ? html`<p class="ui-whe__error" id=${evErr}>${w.eventsRequired}</p>` : nothing}
      </fieldset>
      <div class="ui-whe__form-actions">
        <button type="button" class="tc-btn-sm ui-whe__cancel" @click=${() => this.closeForm()}>${w.cancel}</button>
        <button type="submit" class="tc-btn-sm ui-whe__submit">${ep ? w.save : w.create}</button>
      </div>
    </form>`;
  }

  private renderDelivery(ep: WebhookEndpoint, d: WebhookDelivery) {
    const w = this.words;
    const pending = !d.ok && d.nextRetryAt !== undefined && d.nextRetryAt > this.clock;
    const state = d.ok ? "ok" : pending ? "pending" : "failed";
    return html`<li class="ui-whe__delivery" data-state=${state}>
      <span class="ui-whe__d-time">${this.time(d.at)}</span>
      <span class="ui-whe__d-event">${this.eventLabel(d.event)}</span>
      <span class="ui-whe__d-result" data-state=${state}><span class="ui-whe__dot" aria-hidden="true"></span>${d.ok ? w.delivered : pending ? w.retrying.replace("{time}", this.time(d.nextRetryAt!)) : w.failed}</span>
      <span class="ui-whe__d-meta">${d.status === null ? w.noResponse : `HTTP ${d.status}`}${d.durationMs !== undefined ? ` · ${d.durationMs} ms` : ""}${d.attempt && d.attempt > 1 ? ` · ${w.attempt.replace("{n}", String(d.attempt))}` : ""}</span>
      <span class="ui-whe__d-action">
        ${!d.ok && !this.readOnly
          ? html`<button type="button" class="tc-btn-sm ui-whe__retry" @click=${() => this.emit<WebhookDeliveryRetry>("tc-delivery-retry", { endpointId: ep.id, deliveryId: d.id })}>${w.retry}<span class="tc-sr-only">, ${this.eventLabel(d.event)} ${this.time(d.at)}</span></button>`
          : nothing}
      </span>
    </li>`;
  }

  private renderEndpoint(ep: WebhookEndpoint) {
    const w = this.words;
    const open = this.openIds.includes(ep.id);
    const listId = `${this.uid}-${ep.id}-deliveries`;
    const h = this.healthText(ep);
    const deliveries = (ep.deliveries ?? []).slice(0, this.maxDeliveries);
    if (this.editing === ep.id) return html`<li class="ui-whe__endpoint" data-endpoint=${ep.id}>${this.renderForm(ep)}</li>`;
    const masked = ep.secret ? `${ep.secret.slice(0, 6)}${"•".repeat(8)}${ep.secret.slice(-4)}` : "";
    return html`<li class="ui-whe__endpoint" data-endpoint=${ep.id} ?data-paused=${!ep.enabled}>
      <div class="ui-whe__top">
        <div class="ui-whe__who">
          <span class="ui-whe__url">${ep.url}</span>
          ${ep.description ? html`<span class="ui-whe__desc">${ep.description}</span>` : nothing}
        </div>
        ${this.readOnly
          ? html`<span class="ui-whe__state">${ep.enabled ? w.enabled : w.paused}</span>`
          : html`<button type="button" class="ui-whe__switch" role="switch" aria-checked=${ep.enabled ? "true" : "false"} @click=${() => this.toggle(ep)}>
              <span class="ui-whe__track" aria-hidden="true"><span class="ui-whe__knob"></span></span>
              <span class="ui-whe__switch-text">${ep.enabled ? w.enabled : w.paused}</span><span class="tc-sr-only">, ${ep.url}</span>
            </button>`}
      </div>
      <ul class="ui-whe__events" aria-label=${w.events}>${ep.events.map((id) => html`<li class="ui-whe__chip">${this.eventLabel(id)}</li>`)}</ul>
      ${ep.secret
        ? html`<div class="ui-whe__secret">
            <span class="ui-whe__label">${w.secret}</span>
            <code class="ui-whe__secret-value">${this.shown === ep.id ? ep.secret : masked}</code>
            <button type="button" class="tc-btn-sm ui-whe__show" aria-pressed=${this.shown === ep.id ? "true" : "false"} @click=${() => (this.shown = this.shown === ep.id ? null : ep.id)}>${this.shown === ep.id ? w.hide : w.show}<span class="tc-sr-only"> ${w.secret.toLowerCase()}, ${ep.url}</span></button>
            <button type="button" class="tc-btn-sm ui-whe__copy" @click=${() => this.copySecret(ep)}>${this.copied === ep.id ? w.copied : w.copy}<span class="tc-sr-only"> ${w.secret.toLowerCase()}, ${ep.url}</span></button>
          </div>`
        : nothing}
      <div class="ui-whe__bottom">
        ${deliveries.length
          ? html`<button type="button" class="ui-whe__toggle" aria-expanded=${open ? "true" : "false"} aria-controls=${listId} @click=${() => (this.openIds = open ? this.openIds.filter((x) => x !== ep.id) : [...this.openIds, ep.id])}>
              <svg class="ui-whe__chevron" viewBox="0 0 24 24" aria-hidden="true">${CHEVRON}</svg>
              <span class="ui-whe__health" data-tone=${h.tone}>${h.text}</span>
              <span class="tc-sr-only">. ${w.deliveries.replace("{n}", String(deliveries.length))}, ${ep.url}</span>
            </button>`
          : html`<span class="ui-whe__health ui-whe__health-plain" data-tone=${h.tone}>${h.text}</span>`}
        ${this.readOnly
          ? nothing
          : html`<span class="ui-whe__actions">
              <button type="button" class="tc-btn-sm ui-whe__test" ?disabled=${!ep.enabled} @click=${() => this.emit<WebhookEndpointTest>("tc-endpoint-test", { id: ep.id })}>${w.test}<span class="tc-sr-only">, ${ep.url}</span></button>
              <button type="button" class="tc-btn-sm ui-whe__edit" @click=${() => this.startForm(ep)}>${w.edit}<span class="tc-sr-only">, ${ep.url}</span></button>
              <button type="button" class="tc-btn-sm ui-whe__remove" @click=${() => {
                this.confirming = ep.id;
                this.focusOn(this.sel(ep.id, ".ui-whe__keep"));
              }}>${w.remove}<span class="tc-sr-only">, ${ep.url}</span></button>
            </span>`}
      </div>
      ${this.confirming === ep.id
        ? html`<div class="ui-whe__confirm" role="group" aria-label=${`${w.remove}, ${ep.url}`}>
            <span>${w.confirmRemove}</span>
            <button type="button" class="tc-btn-sm ui-whe__keep" @click=${() => {
              this.confirming = null;
              this.focusOn(this.sel(ep.id, ".ui-whe__remove"));
            }}>${w.keep}</button>
            <button type="button" class="tc-btn-sm ui-whe__confirm-remove" @click=${() => this.removeEndpoint(ep)}>${w.remove}<span class="tc-sr-only">, ${ep.url}</span></button>
          </div>`
        : nothing}
      ${deliveries.length ? html`<ol class="ui-whe__deliveries" id=${listId} ?hidden=${!open} aria-label=${w.deliveries.replace("{n}", String(deliveries.length))}>${deliveries.map((d) => this.renderDelivery(ep, d))}</ol>` : nothing}
    </li>`;
  }

  protected override render() {
    const w = this.words;
    const titleId = `${this.uid}-title`;
    return html`${cardHead({
        icon: ICON,
        title: this.heading || w.heading,
        subtitle: this.description,
        id: titleId,
        aside: this.readOnly
          ? html`<span class="ui-whe__count">${w.count.replace("{n}", String(this.endpoints.length))}</span>`
          : html`<button type="button" class="tc-btn-sm ui-whe__add" aria-expanded=${this.editing === "new" ? "true" : "false"} @click=${() => (this.editing === "new" ? this.closeForm() : this.startForm(null))}>${w.add}</button>`,
      })}
      <div class="ui-whe__card">
        ${this.editing === "new" ? this.renderForm(null) : nothing}
        ${this.endpoints.length
          ? html`<ul class="ui-whe__list" aria-labelledby=${titleId}>${repeat(this.endpoints, (e) => e.id, (e) => this.renderEndpoint(e))}</ul>`
          : this.editing === "new"
            ? nothing
            : html`<div class="ui-whe__empty">
                <p>${w.empty}</p>
                ${this.readOnly ? nothing : html`<p class="ui-whe__hint">${w.emptyHint}</p>`}
              </div>`}
      </div>
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="whe"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="whe"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
[data-ui="whe"] *, [data-ui="whe"] *::before, [data-ui="whe"] *::after { box-sizing: border-box; }
[data-ui="whe"] :where(p, ul, ol, fieldset) { margin: 0; }
[data-ui="whe"] :where(ul, ol) { padding: 0; list-style: none; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="whe"] .ui-whe__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); overflow: hidden; }
.ui-whe__count { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-whe__list { display: grid; }
.ui-whe__endpoint { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4); }
.ui-whe__endpoint:not(:first-child), .ui-whe__form + .ui-whe__list > .ui-whe__endpoint:first-child { box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-whe__endpoint > .ui-whe__form { margin: calc(var(--tc-space-3) * -1) calc(var(--tc-space-4) * -1); }
.ui-whe__top { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--tc-space-3); }
.ui-whe__who { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-whe__url { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-whe__endpoint[data-paused] .ui-whe__url { color: var(--tc-text-secondary); }
.ui-whe__desc { color: var(--tc-text-secondary); }
.ui-whe__state { flex: none; color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-whe__switch { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); margin: 0; padding: 0 var(--tc-space-1); border: 0; border-radius: var(--tc-control-radius-sm); background: transparent; color: var(--tc-text-secondary); font: inherit; font-size: var(--tc-font-size-xs); cursor: pointer; }
.ui-whe__track { position: relative; display: inline-block; flex: none; width: var(--tc-switch-w); height: var(--tc-switch-h); border-radius: var(--tc-switch-radius); background: var(--tc-switch-off); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-whe__knob { position: absolute; top: 50%; left: calc((var(--tc-switch-h) - var(--tc-switch-knob)) / 2); width: var(--tc-switch-knob); height: var(--tc-switch-knob); border-radius: var(--tc-radius-full); background: var(--tc-switch-knob-bg); transform: translateY(-50%); transition: left var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-whe__switch[aria-checked="true"] { color: var(--tc-text-primary); }
.ui-whe__switch[aria-checked="true"] .ui-whe__track { background: var(--tc-switch-on); }
.ui-whe__switch[aria-checked="true"] .ui-whe__knob { left: calc(var(--tc-switch-w) - var(--tc-switch-knob) - (var(--tc-switch-h) - var(--tc-switch-knob)) / 2); }
.ui-whe__events { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-whe__chip { padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-sm); background: var(--tc-fill-hover); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-relaxed); }
.ui-whe__secret { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); }
.ui-whe__secret-value { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); overflow-wrap: anywhere; }
.ui-whe__bottom { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2); }
.ui-whe__toggle { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-height: var(--tc-control-h-sm); margin: 0 0 0 calc(var(--tc-space-1-5) * -1); padding: 0 var(--tc-space-1-5); border: 0; border-radius: var(--tc-control-radius-sm); background: transparent; color: inherit; font: inherit; font-size: var(--tc-font-size-xs); text-align: left; cursor: pointer; }
.ui-whe__toggle:hover { background: var(--tc-fill-hover); }
.ui-whe__chevron { flex: none; width: var(--tc-space-3-5); height: var(--tc-space-3-5); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-whe__toggle[aria-expanded="true"] .ui-whe__chevron { transform: rotate(90deg); }
.ui-whe__health { font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); }
.ui-whe__health[data-tone="ok"] { color: var(--tc-status-success-fg); }
.ui-whe__health[data-tone="warn"] { color: var(--tc-status-warning-fg); }
.ui-whe__health[data-tone="bad"] { color: var(--tc-status-danger-fg); }
.ui-whe__actions { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-whe__remove, .ui-whe__confirm-remove { color: var(--tc-status-danger-fg); }
.ui-whe__confirm { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-control-radius-md); background: var(--tc-fill-hover); }
.ui-whe__confirm > span { flex: 1 1 14em; }
.ui-whe__deliveries { display: grid; border-radius: var(--tc-control-radius-md); background: var(--tc-field-bg-sunken); }
.ui-whe__deliveries[hidden] { display: none; }
.ui-whe__delivery { display: grid; grid-template-columns: minmax(4.5em, auto) minmax(0, 1fr) auto minmax(0, auto) auto; align-items: center; gap: var(--tc-space-1) var(--tc-space-3); min-height: var(--tc-control-h-md); padding: var(--tc-space-1) var(--tc-space-3); font-size: var(--tc-font-size-xs); }
.ui-whe__delivery:not(:first-child) { box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-whe__d-time { color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-whe__d-event { font-family: var(--tc-font-mono); overflow-wrap: anywhere; }
.ui-whe__d-result { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-weight: var(--tc-font-weight-medium); white-space: nowrap; }
.ui-whe__d-result[data-state="ok"] { color: var(--tc-status-success-fg); }
.ui-whe__d-result[data-state="pending"] { color: var(--tc-status-warning-fg); }
.ui-whe__d-result[data-state="failed"] { color: var(--tc-status-danger-fg); }
.ui-whe__dot { width: var(--tc-space-1-5); height: var(--tc-space-1-5); border-radius: var(--tc-radius-full); background: currentColor; }
.ui-whe__d-meta { color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-whe__d-action { display: flex; justify-content: flex-end; }
.ui-whe__form { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); background: var(--tc-fill-hover); }
.ui-whe__field, .ui-whe__group { display: grid; gap: var(--tc-space-1-5); min-width: 0; padding: 0; border: 0; }
.ui-whe__label { padding: 0; color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-whe__input { height: var(--tc-field-h-sm); padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; }
.ui-whe__input:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-whe__input:focus { outline: 0; box-shadow: var(--tc-field-shadow-focus); }
.ui-whe__input[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-whe__url-input { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); }
.ui-whe__error { color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-xs); }
.ui-whe__hint { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-whe__checks { display: grid; grid-template-columns: repeat(auto-fill, minmax(12em, 1fr)); gap: 0 var(--tc-space-3); }
.ui-whe__check { display: flex; align-items: flex-start; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); cursor: pointer; }
.ui-whe__check input { flex: none; margin: var(--tc-space-1) 0 0; accent-color: var(--tc-action-primary-bg); }
.ui-whe__check-text { display: grid; gap: var(--tc-space-0-5); padding-top: var(--tc-space-0-5); }
.ui-whe__check-all { font-weight: var(--tc-font-weight-medium); }
.ui-whe__check-all span { padding-top: var(--tc-space-0-5); }
.ui-whe__event-id { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); }
.ui-whe__form-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--tc-space-1); }
.ui-whe__submit { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-whe__submit:hover { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-whe__empty { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-secondary); text-align: center; }
[data-ui="whe"] :is(button, input):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
@container (max-width: 480px) {
  .ui-whe__top { flex-direction: column; gap: var(--tc-space-1); }
  .ui-whe__delivery { grid-template-columns: minmax(0, 1fr) auto; }
  .ui-whe__d-event { grid-column: 1 / -1; grid-row: 2; }
  .ui-whe__d-meta { grid-column: 1; }
  .ui-whe__d-action { grid-column: 2; grid-row: 1 / span 3; align-self: center; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-whe__chevron, .ui-whe__track, .ui-whe__knob { transition: none; }
}
@media (forced-colors: active) {
  .ui-whe__dot { forced-color-adjust: none; background: CanvasText; }
  .ui-whe__track { forced-color-adjust: none; border: 1px solid ButtonText; background: Canvas; }
  .ui-whe__switch[aria-checked="true"] .ui-whe__track { background: Highlight; }
  .ui-whe__knob { background: ButtonText; }
}
`;
}

if (!customElements.get("tc-webhooks")) customElements.define("tc-webhooks", TcWebhooks);

declare global {
  interface HTMLElementTagNameMap {
    "tc-webhooks": TcWebhooks;
  }
}
