import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";
import "./segmented-control";
import type { SegmentOption, SegmentValueChange } from "./segmented-control";

/*
 * <tc-mcp-connection-manager> – the MCP servers an app's agents can reach, each with its status and what it exposes.
 *   · each server is a row: a status dot, its name, transport and address, how many tools, resources and prompts it
 *     offers, and its action – Connect, Disconnect, Cancel while connecting, Retry after a failure
 *   · Inspect opens the row: tabs for Tools, Resources and Prompts (with counts) list what the server exposes, and
 *     Remove asks first, in a modal dialog that says what goes with it
 *   · Add server opens a short form: a name, the transport (stdio, HTTP or SSE – data, so an app can offer others),
 *     the URL or command it needs, auth and a credential reference; Test tries it before it's added
 * Nothing connects by itself: tc-connect and tc-test hand the app a server and an AbortSignal, and the app reports
 * back through `connections` (status, message, when, and what it found). Connecting… shows until it does; Cancel
 * aborts the signal. Disconnect fires tc-disconnect.
 *   · keyboard: Tab through the rows' buttons; Inspect is a disclosure (Enter / Space); the tabs inside take ←/→,
 *     Home and End; the remove dialog starts on Cancel, keeps Tab inside and closes on Escape, and focus goes back to
 *     Remove (or, once the server is gone, to the next row); in the add form, Enter in the address tests and Escape
 *     closes it
 * Standard is a white card on a gray tray, Add server on the tray below it; Clean is one white card, the button in its
 * last row, with quieter status and thinner icons.
 *
 *   <tc-mcp-connection-manager .value=${servers} .connections=${state}></tc-mcp-connection-manager>
 *
 * The list of servers is one value: adding or removing fires a cancelable tc-value-change ({ value, change }) – call
 * preventDefault() to control `value` yourself. With `name` it's a form control and the form gets the list as JSON.
 */

/** A way to reach a server */
export type McpTransportOption = {
  id: string;
  /** "stdio", "HTTP", "SSE" */
  label: string;
  /** What it needs: a URL, or a command the app runs */
  kind: "url" | "command";
  /** One line under the choice */
  description?: string;
};
/** How the app authenticates to a server */
export type McpAuthOption = {
  id: string;
  label: string;
  /** It needs a credential reference */
  credential?: boolean;
  /** One line under the select */
  description?: string;
};
/** A credential reference the app's server resolves – never the secret */
export type McpCredential = { id: string; label: string; /** The masked end, e.g. "9f1c" */ hint?: string };
/** A configured server */
export type McpServer = {
  id: string;
  name: string;
  /** The id of its transport */
  transport: string;
  /** The URL, or for a command transport the command line */
  target: string;
  /** The id of its auth option */
  auth: string;
  /** The id of its credential reference, when the auth needs one */
  credentialRef?: string;
};
export type McpStatus = "connected" | "connecting" | "disconnected" | "failed";
/** A tool, resource or prompt a server exposes */
export type McpCapability = {
  name: string;
  description?: string;
  /** A resource's URI */
  uri?: string;
};
/** What the app knows about a server's connection */
export type McpConnection = {
  status: McpStatus;
  /** Why it failed, or a note, in the app's words */
  message?: string;
  /** When the status last changed: a Date or epoch ms (shown as a time of day), or text as it is */
  at?: Date | number | string;
  tools?: McpCapability[];
  resources?: McpCapability[];
  prompts?: McpCapability[];
};
/** A server added or removed, or a form reset putting back the whole list */
export type McpValueChange = { value: McpServer[]; change: { type: "add" | "remove"; server: McpServer } | { type: "reset" } };
/** tc-connect: connect `server` (again, when `retry`); stop when `signal` aborts, then update `connections` */
export type McpConnectEvent = { server: McpServer; signal: AbortSignal; retry: boolean };
/** tc-test: try a server that isn't added yet; report on `connections[server.id]` */
export type McpTestEvent = { server: McpServer; signal: AbortSignal };
export type McpDisconnectEvent = { server: McpServer };

export const MCP_TRANSPORTS: McpTransportOption[] = [
  { id: "stdio", label: "stdio", kind: "command", description: "A local process the app starts and talks to over stdin and stdout" },
  { id: "http", label: "HTTP", kind: "url", description: "Streamable HTTP at a URL – most remote servers" },
  { id: "sse", label: "SSE", kind: "url", description: "Server-sent events at a URL – older remote servers" },
];
export const MCP_AUTH: McpAuthOption[] = [
  { id: "none", label: "None" },
  { id: "token", label: "Bearer token", credential: true },
  { id: "oauth", label: "OAuth", description: "The app signs in when it first connects" },
];
/** The statuses' names */
export const MCP_STATUS_LABELS: Record<McpStatus, string> = { connected: "Connected", connecting: "Connecting…", disconnected: "Not connected", failed: "Failed" };
type Tab = "tools" | "resources" | "prompts";
const TABS: { id: Tab; label: string; one: string }[] = [
  { id: "tools", label: "Tools", one: "tool" },
  { id: "resources", label: "Resources", one: "resource" },
  { id: "prompts", label: "Prompts", one: "prompt" },
];
const TIME = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });
const when = (at: McpConnection["at"]) => (at === undefined || at === "" ? "" : typeof at === "string" ? at : TIME.format(at));
const plural = (n: number, one: string) => `${n} ${n === 1 ? one : `${one}s`}`;
const list = (items: string[]) => (items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);
const isUrl = (s: string) => {
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};
let instances = 0;

/* Server, plus, chevron-down, trash-2, rotate-cw, plug, terminal, globe: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const serverIcon = svg`<rect width="20" height="8" x="2" y="2" rx="2" ry="2"></rect><rect width="20" height="8" x="2" y="14" rx="2" ry="2"></rect><line x1="6" x2="6.01" y1="6" y2="6"></line><line x1="6" x2="6.01" y1="18" y2="18"></line>`;
const plusIcon = () => lucide(14, svg`<path d="M5 12h14"></path><path d="M12 5v14"></path>`);
const chevronIcon = () => lucide(14, svg`<path d="m6 9 6 6 6-6"></path>`);
const trashIcon = (size = 14) => lucide(size, svg`<path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>`);
const retryIcon = () => lucide(14, svg`<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path>`);
const chevronDown = html`<svg class="ui-mcs__chevron" viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M4.5 6.25 8 9.75l3.5-3.5"></path>`}</svg>`;

/**
 * MCP servers and their status: add one (transport, auth, test), inspect the tools, resources and prompts it exposes,
 * connect, disconnect, retry and remove – the app does the connecting.
 * @tag tc-mcp-connection-manager
 * @fires tc-value-change - A server was added or removed, or a form reset put the list back ({ value, change }: McpValueChange); cancelable – prevent it to control `value`
 * @fires tc-connect - Connect or Retry was pressed ({ server, signal, retry }: McpConnectEvent); connect, then update `connections`. Cancelable – prevented, nothing shows as connecting
 * @fires tc-disconnect - Disconnect was pressed ({ server }: McpDisconnectEvent); disconnect, then update `connections`
 * @fires tc-test - Test was pressed in the add form ({ server, signal }: McpTestEvent); try it and report on `connections[server.id]`. Cancelable
 */
export class TcMcpConnectionManager extends TcElement {
  static override ui = "mcs";
  static formAssociated = true;

  /** The servers. Changed by the user unless a tc-value-change listener calls preventDefault() */
  @property({ attribute: false }) accessor value: McpServer[] = [];
  /** What the app knows about each server's connection, by server id; a server without one is not connected */
  @property({ attribute: false }) accessor connections: Record<string, McpConnection> = {};
  /** The transports offered when adding a server */
  @property({ attribute: false }) accessor transports: McpTransportOption[] = MCP_TRANSPORTS;
  /** The auth options offered when adding a server */
  @property({ attribute: false }) accessor authOptions: McpAuthOption[] = MCP_AUTH;
  /** The credential references offered when the auth needs one */
  @property({ attribute: false }) accessor credentials: McpCredential[] = [];
  /** The statuses' names, merged over MCP_STATUS_LABELS */
  @property({ attribute: false }) accessor statusLabels: Partial<Record<McpStatus, string>> = {};
  /** Names the group, shown at the top */
  @property() accessor heading = "MCP servers";
  /** A quieter line under the heading */
  @property() accessor description = "";
  /** A quiet line beside Add server; empty hides it */
  @property() accessor note = "Which agents may use each tool is set in tool permissions.";
  /** Submitted with the form: the servers as JSON */
  @property({ reflect: true }) accessor name = "";
  /** Turns every control off and leaves the list out of the form; a disabled fieldset does the same */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;

  @state() private accessor expanded = new Set<string>();
  @state() private accessor tabs = new Map<string, Tab>();
  /** Connects and tests waiting on the app, by server id */
  @state() private accessor pending = new Map<string, { ctrl: AbortController; seen: McpConnection | undefined }>();
  @state() private accessor draft: McpServer | null = null;
  @state() private accessor draftTried = false;
  @state() private accessor removing: McpServer | null = null;
  @state() private accessor formDisabled = false;
  @state() private accessor announcement = "";

  private readonly internals: ElementInternals;
  private readonly uid = `tc-mcs${++instances}`;
  private initialValue: McpServer[] | null = null;
  private ownName = false;
  private drafts = 0;
  private opener: HTMLElement | null = null;

  constructor() {
    super();
    this.internals = this.attachInternals();
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-mcs__inspect, .ui-mcs__add"));
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    this.ownName ||= (this.hasAttribute("aria-label") && this.getAttribute("aria-label") !== this.heading) || this.hasAttribute("aria-labelledby");
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.abortAll();
    if (this.dialogEl?.open) this.dialogEl.close();
  }

  formResetCallback() {
    this.abortAll();
    this.draft = null;
    this.removing = null;
    const value = this.initialValue ?? [];
    // Through tc-value-change like any edit, so a controlled wrapper hears of it and keeps the value until it agrees
    if (this.emit<McpValueChange>("tc-value-change", { value, change: { type: "reset" } }, { cancelable: true })) this.value = value;
    else this.requestUpdate();
  }
  formDisabledCallback(disabled: boolean) {
    queueMicrotask(() => (this.formDisabled = disabled));
  }

  private get isDisabled() {
    return this.disabled || this.formDisabled;
  }
  private statusLabel(s: McpStatus) {
    return this.statusLabels[s] ?? MCP_STATUS_LABELS[s];
  }
  /** The status shown for a server: connecting while the app hasn't answered, else what the app says */
  statusOf(id: string): McpStatus {
    return this.pending.has(id) ? "connecting" : (this.connections[id]?.status ?? "disconnected");
  }
  private transportOf(s: McpServer) {
    return this.transports.find((t) => t.id === s.transport);
  }
  private get dialogEl() {
    return this.querySelector<HTMLDialogElement>(".ui-mcs__dialog");
  }
  private focusLater(selector: string) {
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(selector)?.focus());
  }

  /* ---------- Connecting ---------- */

  private start(server: McpServer, type: "tc-connect" | "tc-test", retry = false) {
    if (this.isDisabled || this.pending.has(server.id)) return false;
    const ctrl = new AbortController();
    const detail = type === "tc-connect" ? { server, signal: ctrl.signal, retry } : { server, signal: ctrl.signal };
    // Taken before the event: an app that answers inside its listener has already changed it, and that answer counts
    const seen = this.connections[server.id];
    if (!this.emit(type, detail, { cancelable: true })) return false;
    this.pending = new Map(this.pending).set(server.id, { ctrl, seen });
    this.announcement = `${type === "tc-test" ? "Testing" : "Connecting to"} ${server.name}…`;
    return true;
  }
  /** Asks the app to connect a server, as Connect does */
  connect(id: string) {
    const server = this.value.find((s) => s.id === id);
    if (server) this.start(server, "tc-connect", this.connections[id]?.status === "failed");
  }
  /** Stops a connect or test in progress: its signal aborts */
  cancel(id: string) {
    const p = this.pending.get(id);
    if (!p) return;
    p.ctrl.abort();
    const next = new Map(this.pending);
    next.delete(id);
    this.pending = next;
    this.announcement = "Cancelled.";
  }
  private disconnect(server: McpServer) {
    if (this.isDisabled) return;
    this.cancel(server.id);
    this.emit<McpDisconnectEvent>("tc-disconnect", { server });
  }
  private abortAll() {
    for (const p of this.pending.values()) p.ctrl.abort();
    if (this.pending.size) this.pending = new Map();
  }

  /* ---------- Adding ---------- */

  private openDraft() {
    if (this.isDisabled || this.draft) return;
    const used = new Set(this.value.map((s) => s.id));
    let id = "";
    do id = `server-${++this.drafts}`;
    while (used.has(id));
    const transport = this.transports.find((t) => t.kind === "url") ?? this.transports[0];
    const auth = this.authOptions[0];
    this.draft = { id, name: "", transport: transport?.id ?? "", target: "", auth: auth?.id ?? "" };
    this.draftTried = false;
    this.focusLater(".ui-mcs__draft-name");
  }
  private closeDraft() {
    const d = this.draft;
    if (!d) return;
    this.cancel(d.id);
    // A test that connected is let go: the server was never added
    if (this.connections[d.id]?.status === "connected") this.emit<McpDisconnectEvent>("tc-disconnect", { server: this.clean(d) });
    this.draft = null;
    this.focusLater(".ui-mcs__add");
  }
  private patchDraft(patch: Partial<McpServer>) {
    if (!this.draft) return;
    // An edit stops a test of the old settings
    if (this.pending.has(this.draft.id)) this.cancel(this.draft.id);
    this.draft = { ...this.draft, ...patch };
  }
  private draftErrors(d: McpServer) {
    const errors: Partial<Record<"name" | "target" | "credential", string>> = {};
    const t = this.transportOf(d);
    if (!d.name.trim()) errors.name = "Give the server a name.";
    else if (this.value.some((s) => s.name.trim().toLowerCase() === d.name.trim().toLowerCase())) errors.name = "There's already a server with that name.";
    if (t?.kind === "command") {
      if (!d.target.trim()) errors.target = "Enter the command that starts the server.";
    } else if (!d.target.trim()) errors.target = "Enter the server's URL.";
    else if (!isUrl(d.target.trim())) errors.target = "Use an http:// or https:// URL.";
    if (this.authOptions.find((a) => a.id === d.auth)?.credential && !d.credentialRef) errors.credential = "Pick the credential to send.";
    return errors;
  }
  private clean(d: McpServer): McpServer {
    const needs = this.authOptions.find((a) => a.id === d.auth)?.credential;
    const { credentialRef, ...rest } = d;
    return { ...rest, name: d.name.trim(), target: d.target.trim(), ...(needs && credentialRef ? { credentialRef } : {}) };
  }
  private firstError() {
    const e = this.draft ? this.draftErrors(this.draft) : {};
    return e.name ? ".ui-mcs__draft-name" : e.target ? ".ui-mcs__draft-target" : e.credential ? ".ui-mcs__draft-cred" : "";
  }
  private testDraft() {
    if (!this.draft) return;
    this.draftTried = true;
    const bad = this.firstError();
    if (bad) return this.focusLater(bad);
    this.start(this.clean(this.draft), "tc-test");
  }
  private addDraft() {
    const d = this.draft;
    if (!d) return;
    this.draftTried = true;
    const bad = this.firstError();
    if (bad) return this.focusLater(bad);
    const server = this.clean(d);
    const value = [...this.value, server];
    if (!this.emit<McpValueChange>("tc-value-change", { value, change: { type: "add", server } }, { cancelable: true })) return;
    // A test still running carries on as the server's connect
    this.value = value;
    this.draft = null;
    this.announcement = `${server.name} added.`;
    this.focusLater(`[data-focus-key="action:${CSS.escape(server.id)}"], [data-focus-key="inspect:${CSS.escape(server.id)}"]`);
  }

  /* ---------- Removing ---------- */

  private askRemove(server: McpServer, opener: HTMLElement) {
    if (this.isDisabled) return;
    this.opener = opener;
    this.removing = server;
    void this.updateComplete.then(() => {
      const d = this.dialogEl;
      if (!d) return;
      if (!d.open) {
        if (typeof d.showModal === "function") d.showModal();
        else d.setAttribute("open", "");
      }
      d.querySelector<HTMLElement>(".ui-mcs__cancel")?.focus();
    });
  }
  private closeDialog(focus: HTMLElement | null = this.opener) {
    const d = this.dialogEl;
    if (d?.open) {
      if (typeof d.close === "function") d.close();
      else d.removeAttribute("open");
    }
    this.removing = null;
    this.opener = null;
    if (focus) void this.updateComplete.then(() => focus.isConnected && focus.focus());
  }
  private confirmRemove() {
    const server = this.removing;
    if (!server) return;
    const i = this.value.findIndex((s) => s.id === server.id);
    const value = this.value.filter((s) => s.id !== server.id);
    if (!this.emit<McpValueChange>("tc-value-change", { value, change: { type: "remove", server } }, { cancelable: true })) {
      this.closeDialog();
      return;
    }
    this.cancel(server.id);
    if (this.connections[server.id]?.status === "connected") this.emit<McpDisconnectEvent>("tc-disconnect", { server });
    this.value = value;
    const expanded = new Set(this.expanded);
    expanded.delete(server.id);
    this.expanded = expanded;
    this.announcement = `${server.name} removed.`;
    const next = value[i] ?? value[i - 1];
    this.closeDialog(null);
    this.focusLater(next ? `[data-focus-key="inspect:${CSS.escape(next.id)}"]` : ".ui-mcs__add");
  }
  private onDialogKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      this.closeDialog();
      return;
    }
    if (e.key !== "Tab") return;
    const items = [...(this.dialogEl?.querySelectorAll<HTMLElement>("button") ?? [])].filter((el) => !el.hasAttribute("disabled"));
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const at = document.activeElement;
    if (e.shiftKey && (at === first || !this.dialogEl?.contains(at))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && at === last) {
      e.preventDefault();
      first.focus();
    }
  };

  private toggle(id: string) {
    const next = new Set(this.expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.expanded = next;
  }

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // The reset baseline is what the first render shows, so props a framework sets after connecting (React does) count
    if (!this.hasUpdated) this.initialValue = this.value;
    this.toggleAttribute("data-disabled", this.isDisabled);
    if (changed.has("connections") && this.pending.size) {
      // The app answered for a server it was asked about: it isn't waiting any more
      const next = new Map(this.pending);
      for (const [id, p] of this.pending) {
        const now = this.connections[id];
        if (now !== p.seen && now?.status !== "connecting") {
          next.delete(id);
          const name = this.value.find((s) => s.id === id)?.name ?? this.draft?.name ?? "The server";
          this.announcement = now?.status === "connected" ? `${name} connected – ${this.counts(now)}.` : now?.status === "failed" ? `${name} failed to connect. ${now.message ?? ""}`.trim() : `${name}: ${this.statusLabel(now?.status ?? "disconnected")}.`;
        }
      }
      if (next.size !== this.pending.size) this.pending = next;
    }
    if (changed.has("value")) {
      // A server that's gone takes its pending connect with it
      const ids = new Set(this.value.map((s) => s.id));
      for (const id of this.pending.keys()) if (!ids.has(id) && id !== this.draft?.id) this.cancel(id);
    }
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (!this.ownName) this.setAttribute("aria-label", this.heading);
    if (typeof this.internals.setFormValue === "function") this.internals.setFormValue(this.name && !this.isDisabled ? JSON.stringify(this.value) : null);
  }

  /* ---------- Rendering ---------- */

  private counts(c: McpConnection | undefined) {
    if (!c || (!c.tools && !c.resources && !c.prompts)) return "";
    return list(TABS.map((t) => plural(c[t.id]?.length ?? 0, t.one)));
  }

  private renderAction(server: McpServer, status: McpStatus) {
    const key = `action:${server.id}`;
    const off = this.isDisabled;
    if (this.pending.has(server.id))
      return html`<button type="button" class="ui-mcs__btn ui-mcs__btn--secondary" data-focus-key=${key} aria-label=${`Cancel connecting to ${server.name}`} ?disabled=${off} @click=${() => this.cancel(server.id)}>Cancel</button>`;
    if (status === "connected")
      return html`<button type="button" class="ui-mcs__btn ui-mcs__btn--secondary" data-focus-key=${key} aria-label=${`Disconnect ${server.name}`} ?disabled=${off} @click=${() => this.disconnect(server)}>Disconnect</button>`;
    if (status === "failed")
      return html`<button type="button" class="ui-mcs__btn ui-mcs__btn--secondary" data-focus-key=${key} aria-label=${`Retry ${server.name}`} ?disabled=${off} @click=${() => this.start(server, "tc-connect", true)}>${retryIcon()}Retry</button>`;
    if (status === "connecting") return nothing;
    return html`<button type="button" class="ui-mcs__btn ui-mcs__btn--primary" data-focus-key=${key} aria-label=${`Connect ${server.name}`} ?disabled=${off} @click=${() => this.start(server, "tc-connect")}>Connect</button>`;
  }

  private renderPanel(server: McpServer, c: McpConnection | undefined, look: "standard" | "clean") {
    const id = `${this.uid}-${server.id}`;
    const tab = this.tabs.get(server.id) ?? "tools";
    const has = !!c && !!(c.tools || c.resources || c.prompts);
    const items = c?.[tab] ?? [];
    const meta = TABS.find((t) => t.id === tab)!;
    return html`<div class="ui-mcs__panel" id=${`${id}-panel`}>
      ${has
        ? html`<tc-segmented-control
              look=${look}
              class="ui-mcs__tabs"
              kind="tabs"
              size="sm"
              aria-label=${`What ${server.name} exposes`}
              .options=${TABS.map((t) => ({ value: t.id, label: t.label, count: c[t.id]?.length ?? 0, controls: `${id}-tab` })) as SegmentOption[]}
              .value=${tab}
              @tc-value-change=${(e: CustomEvent<SegmentValueChange>) => {
                e.stopPropagation();
                e.preventDefault();
                this.tabs = new Map(this.tabs).set(server.id, e.detail.value as Tab);
              }}
            ></tc-segmented-control>
            <div class="ui-mcs__tabpanel" id=${`${id}-tab`} role="tabpanel" aria-label=${meta.label} tabindex="0">
              ${items.length
                ? html`<ul class="ui-mcs__caps">
                    ${items.map(
                      (cap) => html`<li class="ui-mcs__cap">
                        <span class="ui-mcs__cap-name">${cap.name}</span>
                        ${cap.uri ? html`<span class="ui-mcs__cap-uri">${cap.uri}</span>` : nothing}
                        ${cap.description ? html`<span class="ui-mcs__cap-desc">${cap.description}</span>` : nothing}
                      </li>`,
                    )}
                  </ul>`
                : html`<p class="ui-mcs__none">No ${meta.label.toLowerCase()}.</p>`}
            </div>`
        : html`<p class="ui-mcs__none">${c?.status === "failed" ? "Nothing to show – it didn't connect." : "Connect to see its tools, resources and prompts."}</p>`}
      <div class="ui-mcs__panel-foot">
        <span class="ui-mcs__fact">${this.authOptions.find((a) => a.id === server.auth)?.label ?? server.auth} auth${server.credentialRef ? ` · ${this.credentials.find((k) => k.id === server.credentialRef)?.label ?? server.credentialRef}` : ""}</span>
        <button
          type="button"
          class="ui-mcs__btn ui-mcs__btn--ghost ui-mcs__remove"
          aria-haspopup="dialog"
          aria-label=${`Remove ${server.name}`}
          ?disabled=${this.isDisabled}
          @click=${(e: Event) => this.askRemove(server, e.currentTarget as HTMLElement)}
        >${trashIcon()}Remove</button>
      </div>
    </div>`;
  }

  /** What a server exposes, at a glance: the three counts and the first few tool names */
  private renderGlance(c: McpConnection) {
    const tools = c.tools ?? [];
    const shown = tools.slice(0, 4);
    return html`<span class="ui-mcs__glance">
      <span class="ui-mcs__sr">${this.counts(c)}</span>
      ${TABS.map((t) => html`<span class="ui-mcs__badge" data-kind=${t.id} aria-hidden="true"><span class="ui-mcs__badge-n">${c[t.id]?.length ?? 0}</span>${(c[t.id]?.length ?? 0) === 1 ? t.one : `${t.one}s`}</span>`)}
      ${shown.length
        ? html`<span class="ui-mcs__preview"><span class="ui-mcs__sr">Tools: </span>${shown.map((x) => html`<span class="ui-mcs__tool">${x.name}</span>`)}${tools.length > shown.length ? html`<span class="ui-mcs__more">+${tools.length - shown.length}<span class="ui-mcs__sr"> more</span></span>` : nothing}</span>`
        : nothing}
    </span>`;
  }

  private renderServer(server: McpServer, look: "standard" | "clean") {
    const c = this.connections[server.id];
    const status = this.statusOf(server.id);
    const open = this.expanded.has(server.id);
    const id = `${this.uid}-${server.id}`;
    const t = this.transportOf(server);
    const exposes = status !== "failed" && !!c && !!(c.tools || c.resources || c.prompts);
    const line = status === "failed" ? (c?.message ?? "It didn't connect.") : status === "connecting" ? "Waiting for the server to answer…" : (c?.message ?? "");
    const at = c && status !== "connecting" ? when(c.at) : "";
    return html`<li class="ui-mcs__server" data-status=${status} ?data-open=${open}>
      <div class="ui-mcs__row">
        <span class="ui-mcs__dot" aria-hidden="true"></span>
        <div class="ui-mcs__main">
          <span class="ui-mcs__name-line"><span class="ui-mcs__name" id=${`${id}-name`}>${server.name}</span><span class="ui-mcs__status">${this.statusLabel(status)}${at ? html`<span class="ui-mcs__at"> · ${at}</span>` : nothing}</span></span>
          <span class="ui-mcs__where"><span class="ui-mcs__transport">${t?.label ?? server.transport}</span><span class="ui-mcs__target">${server.target}</span></span>
          ${exposes ? this.renderGlance(c!) : nothing}
          ${line ? html`<span class="ui-mcs__line" ?data-error=${status === "failed"}>${line}</span>` : nothing}
        </div>
        <div class="ui-mcs__actions">
          ${this.renderAction(server, status)}
          <button
            type="button"
            class="ui-mcs__btn ui-mcs__btn--icon ui-mcs__inspect"
            data-focus-key=${`inspect:${server.id}`}
            aria-expanded=${open ? "true" : "false"}
            aria-controls=${`${id}-panel`}
            aria-label=${`Inspect ${server.name}`}
            @click=${() => this.toggle(server.id)}
          >${chevronIcon()}</button>
        </div>
      </div>
      ${open ? this.renderPanel(server, c, look) : html`<div id=${`${id}-panel`} hidden></div>`}
    </li>`;
  }

  private renderDraft(look: "standard" | "clean") {
    const d = this.draft!;
    const id = `${this.uid}-draft`;
    const errors = this.draftTried ? this.draftErrors(d) : {};
    const t = this.transportOf(d);
    const auth = this.authOptions.find((a) => a.id === d.auth);
    const pending = this.pending.has(d.id);
    const c = this.connections[d.id];
    const result = pending ? "connecting" : c?.status;
    const err = (key: keyof typeof errors) => (errors[key] ? html`<span class="ui-mcs__error" id=${`${id}-${key}-e`}>${errors[key]}</span>` : nothing);
    const described = (key: keyof typeof errors, hint?: string) => ifDefined([errors[key] ? `${id}-${key}-e` : "", hint ?? ""].filter(Boolean).join(" ") || undefined);
    return html`<section class="ui-mcs__draft" aria-labelledby=${`${id}-title`} @keydown=${(e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) {
        e.preventDefault();
        this.closeDraft();
      }
    }}>
      <h4 class="ui-mcs__draft-title" id=${`${id}-title`}>New server</h4>
      <div class="ui-mcs__field">
        <label class="ui-mcs__label" for=${`${id}-name`}>Name</label>
        <input id=${`${id}-name`} class="ui-mcs__input ui-mcs__draft-name" autocomplete="off" .value=${live(d.name)} aria-invalid=${errors.name ? "true" : "false"} aria-describedby=${described("name")} @input=${(e: Event) => this.patchDraft({ name: (e.target as HTMLInputElement).value })} />
        ${err("name")}
      </div>
      <div class="ui-mcs__field">
        <span class="ui-mcs__label" id=${`${id}-transport`}>Transport</span>
        <tc-segmented-control
          look=${look}
          size="sm"
          aria-labelledby=${`${id}-transport`}
          aria-describedby=${ifDefined(t?.description ? `${id}-transport-d` : undefined)}
          .options=${this.transports.map((x) => ({ value: x.id, label: x.label })) as SegmentOption[]}
          .value=${d.transport}
          @tc-value-change=${(e: CustomEvent<SegmentValueChange>) => {
            e.stopPropagation();
            e.preventDefault();
            this.patchDraft({ transport: e.detail.value });
          }}
        ></tc-segmented-control>
        ${t?.description ? html`<span class="ui-mcs__hint" id=${`${id}-transport-d`}>${t.description}</span>` : nothing}
      </div>
      <div class="ui-mcs__field">
        <label class="ui-mcs__label" for=${`${id}-target`}>${t?.kind === "command" ? "Command" : "URL"}</label>
        <input
          id=${`${id}-target`}
          class="ui-mcs__input ui-mcs__mono ui-mcs__draft-target"
          type=${t?.kind === "command" ? "text" : "url"}
          spellcheck="false"
          autocomplete="off"
          placeholder=${t?.kind === "command" ? "npx -y @scope/server" : "https://"}
          .value=${live(d.target)}
          aria-invalid=${errors.target ? "true" : "false"}
          aria-describedby=${described("target", t?.kind === "command" ? `${id}-target-d` : undefined)}
          @input=${(e: Event) => this.patchDraft({ target: (e.target as HTMLInputElement).value })}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === "Enter" && !e.isComposing) {
              e.preventDefault();
              this.testDraft();
            }
          }}
        />
        ${err("target")}${t?.kind === "command" ? html`<span class="ui-mcs__hint" id=${`${id}-target-d`}>The app runs it on its own host, after its own permission checks.</span>` : nothing}
      </div>
      <div class="ui-mcs__field-pair">
        <div class="ui-mcs__field">
          <label class="ui-mcs__label" for=${`${id}-auth`}>Auth</label>
          <span class="ui-mcs__select">
            <select id=${`${id}-auth`} class="ui-mcs__input" aria-describedby=${ifDefined(auth?.description ? `${id}-auth-d` : undefined)} @change=${(e: Event) => this.patchDraft({ auth: (e.target as HTMLSelectElement).value })}>
              ${this.authOptions.map((a) => html`<option value=${a.id} .selected=${live(a.id === d.auth)}>${a.label}</option>`)}
            </select>${chevronDown}
          </span>
          ${auth?.description ? html`<span class="ui-mcs__hint" id=${`${id}-auth-d`}>${auth.description}</span>` : nothing}
        </div>
        ${auth?.credential
          ? html`<div class="ui-mcs__field">
              <label class="ui-mcs__label" for=${`${id}-cred`}>Credential</label>
              <span class="ui-mcs__select">
                <select id=${`${id}-cred`} class="ui-mcs__input ui-mcs__draft-cred" aria-invalid=${errors.credential ? "true" : "false"} aria-describedby=${described("credential")} @change=${(e: Event) => this.patchDraft({ credentialRef: (e.target as HTMLSelectElement).value || undefined })}>
                  <option value="" .selected=${live(!d.credentialRef)}>Pick a credential</option>
                  ${this.credentials.map((k) => html`<option value=${k.id} .selected=${live(k.id === d.credentialRef)}>${k.label}${k.hint ? ` ···· ${k.hint}` : ""}</option>`)}
                </select>${chevronDown}
              </span>
              ${err("credential")}
            </div>`
          : nothing}
      </div>
      ${result
        ? html`<p class="ui-mcs__result" data-status=${result}><span class="ui-mcs__dot" aria-hidden="true"></span>${result === "connecting"
              ? "Testing…"
              : result === "connected"
                ? `It works – ${this.counts(c) || "connected"}.`
                : result === "failed"
                  ? `It didn't connect. ${c?.message ?? ""}`
                  : this.statusLabel(result)}</p>`
        : nothing}
      <div class="ui-mcs__draft-actions">
        <button type="button" class="ui-mcs__btn ui-mcs__btn--secondary ui-mcs__draft-test" @click=${() => (pending ? this.cancel(d.id) : this.testDraft())}>${pending ? "Stop test" : "Test"}</button>
        <span class="ui-mcs__spacer"></span>
        <button type="button" class="ui-mcs__btn ui-mcs__btn--ghost ui-mcs__draft-cancel" @click=${() => this.closeDraft()}>Cancel</button>
        <button type="button" class="ui-mcs__btn ui-mcs__btn--primary ui-mcs__draft-add" @click=${() => this.addDraft()}>Add server</button>
      </div>
    </section>`;
  }

  private renderDialog() {
    const s = this.removing;
    const id = this.uid;
    const c = s ? this.connections[s.id] : undefined;
    const counts = this.counts(c);
    return html`<dialog class="ui-mcs__dialog" role="alertdialog" aria-modal="true" aria-labelledby=${`${id}-dlg-title`} aria-describedby=${`${id}-dlg-desc`} @keydown=${this.onDialogKey} @cancel=${(e: Event) => {
      e.preventDefault();
      this.closeDialog();
    }}>
      ${s
        ? html`<div class="ui-mcs__dlg">
            <div class="ui-mcs__dlg-head">
              <span class="ui-mcs__dlg-icon" aria-hidden="true">${trashIcon(18)}</span>
              <h3 class="ui-mcs__dlg-title" id=${`${id}-dlg-title`}>Remove ${s.name}?</h3>
            </div>
            <p class="ui-mcs__dlg-desc" id=${`${id}-dlg-desc`}>${counts ? `Its ${counts} stop being available to agents.` : "Agents can no longer reach it."}${this.statusOf(s.id) === "connected" ? " It's disconnected first." : ""} You can add it again later.</p>
            <div class="ui-mcs__dlg-actions">
              <button type="button" class="ui-mcs__btn ui-mcs__btn--secondary ui-mcs__btn--md ui-mcs__cancel" @click=${() => this.closeDialog()}>Cancel</button>
              <button type="button" class="ui-mcs__btn ui-mcs__btn--danger ui-mcs__btn--md ui-mcs__confirm" @click=${() => this.confirmRemove()}>Remove</button>
            </div>
          </div>`
        : nothing}
    </dialog>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const connected = this.value.filter((s) => this.statusOf(s.id) === "connected").length;
    const failed = this.value.filter((s) => this.statusOf(s.id) === "failed").length;
    const id = this.uid;
    // The header (.tc-head): on the tray above the card in Standard, the card's first row in Clean
    return html`
      <span class="ui-mcs__sr" role="status">${this.announcement}</span>
      ${cardHead({
        icon: serverIcon,
        title: this.heading,
        id: `${id}-title`,
        subtitle: this.description || undefined,
        aside: this.value.length
          ? html`<span class="ui-mcs__pill" data-tone=${failed ? "warning" : connected ? "success" : "neutral"}>${connected} of ${this.value.length} connected${failed ? html`<span class="ui-mcs__sr">, ${failed} failed</span>` : nothing}</span>`
          : undefined,
      })}
      <div class="ui-mcs__card">
        ${this.value.length
          ? html`<ul class="ui-mcs__list" aria-labelledby=${`${id}-title`}>
              ${repeat(
                this.value,
                (s) => s.id,
                (s) => this.renderServer(s, look),
              )}
            </ul>`
          : html`<p class="ui-mcs__empty">No servers yet. Add one to give agents its tools.</p>`}
        ${this.draft ? this.renderDraft(look) : nothing}
      </div>
      <div class="ui-mcs__foot">
        ${this.note ? html`<p class="ui-mcs__foot-note">${this.note}</p>` : nothing}
        <button type="button" class="ui-mcs__btn ui-mcs__btn--secondary ui-mcs__btn--md ui-mcs__add" aria-expanded=${this.draft ? "true" : "false"} ?disabled=${this.isDisabled || !!this.draft} @click=${() => this.openDraft()}>${plusIcon()}Add server</button>
      </div>
      ${this.renderDialog()}
    `;
  }

  static override css = /* css */ `
[data-ui="mcs"] {
  position: relative;
  display: flow-root;
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 640px;
  min-width: 0;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="mcs"] *, [data-ui="mcs"] *::before, [data-ui="mcs"] *::after { box-sizing: border-box; }
:where([data-ui="mcs"]) :is(p, ul, h3, h4) { margin: 0; padding: 0; }
:where([data-ui="mcs"]) ul { list-style: none; }
[data-ui="mcs"] svg { display: block; flex: none; }
/* Standard: a gray tray around a white card; Add server sits on the tray */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="mcs"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *).ui-mcs__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* The card's first part needs no divider above it (Clean keeps the one under the header) */
:where([data-look="standard"], [data-look="standard"] *).ui-mcs__card > :first-child { border-top: 0; }
/* Clean: one white card; the button is its last row */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="mcs"] { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="mcs"] svg[stroke-width] { stroke-width: 1.5; }
.ui-mcs__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

/* ---------- The header's pill: how many are connected ---------- */
.ui-mcs__pill { display: inline-flex; flex: none; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-mcs__pill[data-tone="neutral"] { background: var(--tc-fill-default); color: var(--tc-text-muted); }
.ui-mcs__pill[data-tone="success"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-mcs__pill[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-mcs__pill { padding: 0; background: none !important; }

/* ---------- Servers ---------- */
.ui-mcs__list { display: grid; border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-mcs__server + .ui-mcs__server { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-mcs__row { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: start; gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); }
.ui-mcs__dot { flex: none; width: 8px; height: 8px; margin: var(--tc-space-1-5) var(--tc-space-0-5) 0; border-radius: 50%; background: var(--tc-icon-muted); }
[data-status="connected"] > .ui-mcs__dot, [data-status="connected"] > .ui-mcs__row > .ui-mcs__dot { background: var(--tc-status-success-solid); box-shadow: 0 0 0 3px var(--tc-status-success-bg); }
[data-status="connecting"] > .ui-mcs__dot, [data-status="connecting"] > .ui-mcs__row > .ui-mcs__dot { background: var(--tc-status-info-solid); box-shadow: 0 0 0 3px var(--tc-status-info-bg); animation: ui-mcs-pulse var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite; }
[data-status="failed"] > .ui-mcs__dot, [data-status="failed"] > .ui-mcs__row > .ui-mcs__dot { background: var(--tc-status-danger-solid); box-shadow: 0 0 0 3px var(--tc-status-danger-bg); }
.ui-mcs__main { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-mcs__name-line { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 var(--tc-space-2); }
.ui-mcs__name { color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); overflow-wrap: anywhere; }
:where([data-look="standard"], [data-look="standard"] *).ui-mcs__name { font-weight: var(--tc-font-weight-medium); }
.ui-mcs__status { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
[data-status="connected"] .ui-mcs__status { color: var(--tc-status-success-fg); }
[data-status="failed"] .ui-mcs__status { color: var(--tc-status-danger-fg); }
[data-status="connecting"] .ui-mcs__status { color: var(--tc-status-info-fg); }
.ui-mcs__at { color: var(--tc-text-muted); }
.ui-mcs__where { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-mcs__transport { flex: none; display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-mcs__target { min-width: 0; overflow: hidden; font-family: var(--tc-font-mono); text-overflow: ellipsis; white-space: nowrap; }
/* At a glance: counts, then the first tools */
.ui-mcs__glance { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1); margin-top: var(--tc-space-1); }
.ui-mcs__badge { display: inline-flex; align-items: baseline; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); color: var(--tc-text-secondary); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h); white-space: nowrap; }
.ui-mcs__badge-n { color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-mcs__badge { background: none; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-mcs__preview { display: contents; }
.ui-mcs__tool { display: inline-flex; align-items: center; max-width: 12rem; height: var(--tc-pill-h); padding: 0 var(--tc-space-1-5); overflow: hidden; border-radius: var(--tc-radius-sm); color: var(--tc-text-muted); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); text-overflow: ellipsis; white-space: nowrap; }
.ui-mcs__badge + .ui-mcs__preview .ui-mcs__tool:first-of-type { margin-left: var(--tc-space-1); }
.ui-mcs__more { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
[data-status="disconnected"] .ui-mcs__glance { opacity: 0.7; }
.ui-mcs__line { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-mcs__line[data-error] { color: var(--tc-status-danger-fg); }
.ui-mcs__actions { display: flex; align-items: center; gap: var(--tc-space-1); }
.ui-mcs__empty { padding: var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-text-muted); }

/* Inspect: the server's tools, resources and prompts */
.ui-mcs__inspect > svg { transition: transform var(--tc-duration-base) var(--tc-ease-standard); }
.ui-mcs__inspect[aria-expanded="true"] > svg { transform: rotate(180deg); }
.ui-mcs__panel { display: grid; gap: var(--tc-space-2); margin: 0 var(--tc-space-4) var(--tc-space-3) calc(var(--tc-space-4) + var(--tc-space-3) + var(--tc-space-3)); animation: ui-mcs-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-mcs__tabs { max-width: 100%; justify-self: start; }
.ui-mcs__tabpanel { border-radius: var(--tc-radius-lg); }
:where([data-look="standard"], [data-look="standard"] *).ui-mcs__tabpanel { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-mcs__tabpanel { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); border-radius: var(--tc-radius-md); }
.ui-mcs__tabpanel:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-mcs__caps { display: grid; max-height: 16rem; overflow: auto; padding: var(--tc-space-1) var(--tc-space-3) !important; }
.ui-mcs__cap { display: grid; gap: var(--tc-space-0-5); padding: var(--tc-space-2) 0; }
.ui-mcs__cap + .ui-mcs__cap { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-mcs__cap-name { color: var(--tc-text-primary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); overflow-wrap: anywhere; }
.ui-mcs__cap-uri { color: var(--tc-text-muted); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); overflow-wrap: anywhere; }
.ui-mcs__cap-desc { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-mcs__none { padding: var(--tc-space-2) 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-mcs__tabpanel > .ui-mcs__none { padding: var(--tc-space-3); }
.ui-mcs__panel-foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2); }
.ui-mcs__fact { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }

/* ---------- Adding a server ---------- */
.ui-mcs__draft { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); animation: ui-mcs-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-mcs__draft { background: var(--tc-fill-subtle); }
.ui-mcs__draft-title { color: var(--tc-text-primary); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); font-weight: var(--tc-font-weight-medium); }
.ui-mcs__field { display: grid; gap: var(--tc-space-1-5); min-width: 0; align-content: start; justify-items: start; }
.ui-mcs__field > .ui-mcs__input, .ui-mcs__field > .ui-mcs__select { justify-self: stretch; }
.ui-mcs__field-pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--tc-space-3); }
.ui-mcs__label { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *).ui-mcs__label { color: var(--tc-text-muted); }
.ui-mcs__input { width: 100%; min-width: 0; height: var(--tc-field-h); margin: 0; padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); outline: 0; background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-field-font-size); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mcs__input:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-mcs__input:focus-visible { box-shadow: var(--tc-field-shadow-focus); }
.ui-mcs__input[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-mcs__input::placeholder { color: var(--tc-text-placeholder); }
.ui-mcs__mono { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); }
.ui-mcs__select { position: relative; display: block; }
.ui-mcs__select > select { padding-right: var(--tc-space-7); appearance: none; cursor: pointer; text-overflow: ellipsis; }
.ui-mcs__chevron { position: absolute; top: 50%; right: var(--tc-space-2); width: 14px; height: 14px; fill: none; stroke: var(--tc-icon-muted); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; transform: translateY(-50%); pointer-events: none; }
.ui-mcs__hint { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-mcs__error { color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-mcs__result { display: flex; align-items: flex-start; gap: var(--tc-space-2); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-mcs__result[data-status="connected"] { color: var(--tc-status-success-fg); }
.ui-mcs__result[data-status="failed"] { color: var(--tc-status-danger-fg); }
.ui-mcs__result > .ui-mcs__dot { margin-top: var(--tc-space-1); }
.ui-mcs__draft-actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); }
.ui-mcs__spacer { flex: 1; }

/* ---------- Buttons ---------- */
.ui-mcs__btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); margin: 0; padding: 0 var(--tc-control-px-sm); border: 0; border-radius: var(--tc-control-radius-sm); background: none; color: inherit; font: inherit; font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-quick) var(--tc-ease-standard); }
.ui-mcs__btn:active:not(:disabled) { transform: scale(0.98); }
.ui-mcs__btn:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-mcs__btn:disabled { cursor: not-allowed; opacity: 0.55; }
.ui-mcs__btn--md { height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); }
.ui-mcs__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-mcs__btn--primary:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); }
.ui-mcs__btn--secondary { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
.ui-mcs__btn--secondary:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-mcs__btn--ghost { color: var(--tc-action-ghost-fg); }
.ui-mcs__btn--ghost:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); }
.ui-mcs__remove { margin-right: calc(-1 * var(--tc-space-2)); color: var(--tc-status-danger-fg); }
.ui-mcs__remove:hover:not(:disabled) { background: var(--tc-status-danger-bg); }
.ui-mcs__btn--danger { background: var(--tc-action-danger-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-danger-fg); }
.ui-mcs__btn--danger:hover { background: var(--tc-action-danger-bg-hover); }
.ui-mcs__btn--icon { width: var(--tc-control-h-sm); padding: 0; color: var(--tc-icon-muted); }
.ui-mcs__btn--icon:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-mcs__btn--primary { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-mcs__btn--primary:hover:not(:disabled) { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-mcs__draft-add { background: var(--tc-action-primary-bg) !important; box-shadow: var(--tc-action-primary-shadow) !important; color: var(--tc-action-primary-fg) !important; }

/* ---------- Footer: Add server ---------- */
.ui-mcs__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-2) var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-mcs__foot { padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-mcs__foot { padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-mcs__foot-note { flex: 1 1 14rem; min-width: 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }

/* ---------- The remove confirmation ---------- */
.ui-mcs__dialog { width: min(420px, calc(100vw - 2 * var(--tc-space-4))); max-height: calc(100vh - 2 * var(--tc-space-4)); margin: auto; padding: 0; overflow: auto; border: 0; border-radius: var(--tc-card-radius); background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-overlay); color: var(--tc-text-secondary); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); text-align: left; }
.ui-mcs__dialog:not([open]) { display: none; }
.ui-mcs__dialog::backdrop { background: var(--tc-scrim); }
.ui-mcs__dialog[open] { animation: ui-mcs-pop var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-mcs__dlg { display: grid; gap: var(--tc-space-4); padding: var(--tc-space-5); }
.ui-mcs__dlg-head { display: flex; align-items: center; gap: var(--tc-space-3); }
.ui-mcs__dlg-icon { display: grid; place-items: center; width: 36px; height: 36px; border-radius: var(--tc-radius-lg); background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-mcs__dlg-title { color: var(--tc-text-primary); font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-snug); letter-spacing: var(--tc-tracking-snug); overflow-wrap: anywhere; }
.ui-mcs__dlg-desc { line-height: var(--tc-line-height-snug); }
.ui-mcs__dlg-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--tc-space-2); }

@keyframes ui-mcs-in { from { opacity: 0; transform: translateY(-3px); } }
@keyframes ui-mcs-pop { from { opacity: 0; transform: translateY(6px) scale(0.98); } }
@keyframes ui-mcs-pulse { 50% { opacity: 0.4; } }
/* Narrow: actions under the name, fields one per row */
@container (max-width: 460px) {
  .ui-mcs__row { grid-template-columns: auto minmax(0, 1fr) auto; padding: var(--tc-space-3); }
  .ui-mcs__actions { grid-column: 2 / -1; justify-content: space-between; }
  .ui-mcs__panel { margin-left: var(--tc-space-3); margin-right: var(--tc-space-3); }
  .ui-mcs__draft { padding: var(--tc-space-3); }
  .ui-mcs__field-pair { grid-template-columns: minmax(0, 1fr); }
  .ui-mcs__foot .ui-mcs__add { flex: 1 1 100%; }
}
@media (max-width: 400px) {
  .ui-mcs__dlg { padding: var(--tc-space-4); }
  .ui-mcs__dlg-actions > .ui-mcs__btn { flex: 1 1 0; }
}
@media (pointer: coarse) {
  .ui-mcs__btn, .ui-mcs__input { height: 40px; }
  .ui-mcs__btn--icon { width: 40px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="mcs"] *, [data-ui="mcs"] *::before, [data-ui="mcs"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-mcp-connection-manager")) customElements.define("tc-mcp-connection-manager", TcMcpConnectionManager);

declare global {
  interface HTMLElementTagNameMap {
    "tc-mcp-connection-manager": TcMcpConnectionManager;
  }
}
