import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { reducedMotion } from "../internal/reduced-motion";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { isMac } from "./internal/util";
import type { AnswerSource } from "./ai-answer";
import type { AnswerClaim, ClaimSource, ClaimVerifyDetail } from "./claim-answer";
import { defaultChatModels, type ChatModel, type ChatPageContext, type ChatPageContextChange, type ChatSendDetails, type ChatSettingsChange } from "./chat-composer";
import type { ChatConversation, ChatConversationsChange, ChatValueChange } from "./chat-history";
import type { FeedbackKind, MessageActionKey } from "./message-actions";
import type { ModelSettingsModel, ModelSettingsValue } from "./model-settings";
import type { PromptTemplate } from "./prompt-library";
import type { PromptStarter, PromptStarterPick } from "./prompt-starters";
import type { ReflectionGatePhaseChange, ReflectionGateSkip, ReflectionGateSubmission, ReflectionMode, ReflectionPhase } from "./reflection-gate";
import "./ai-answer";
import "./button";
import "./chat-composer";
import "./chat-history";
import "./claim-answer";
import "./message-actions";
import "./prompt-starters";
import "./reflection-gate";

/*
 * <tc-ai-side-pane> – the Lit build of blocks/ai-side-pane.tsx: an assistant docked beside a page, holding a
 * conversation about what's on it. ai-answer and claim-answer for the answers, message-actions under every finished
 * answer, prompt-starters before the first message, chat-history in a panel, reflection-gate for answers the app
 * marks high-stakes, and the chat-composer with its toolbar – model, settings, prompts, page context – and the
 * disclaimer under it.
 * Standard: the header on the gray tray, the conversation and composer on a white card. Clean: one white surface, the
 * header its first row and a hairline from the page.
 *
 *   <tc-ai-side-pane heading="Assistant" .messages=${messages}>
 *     <article>… the host page …</article>
 *   </tc-ai-side-pane>
 *
 * The app owns the conversation: it passes `messages`, appends to them on tc-send, and streams an answer by growing
 * its `text` while `streaming` is set. The pane owns its chrome – open, collapsed to a rail, its width – each a
 * property with a cancelable `tc-<property>-change`, so a page may control it to remember it.
 *
 * Layout: the element's children are the host page; the pane docks beside them. Drag its edge (or focus the edge and
 * use the arrow keys) to resize it, collapse it to a narrow rail, or press the shortcut (⌘. / Ctrl+. by default) to
 * open it. Below `breakpoint` (the element's own width) it becomes an overlay sheet with a scrim.
 *
 * Docked, the pane is a complementary landmark named by its title; as a sheet it is a modal dialog that keeps focus
 * inside (Tab wraps, the page behind is inert) and closes on Escape or the scrim. Focus moves into the composer when
 * the pane opens and goes back to where it was (or the launcher) when it closes.
 *
 * The events of the parts inside bubble out as they are – tc-copy, tc-attach, tc-prompt-pick, tc-rename … – except
 * those the pane turns into its own (below), so a page never hears one event twice.
 */

export type SidePaneMessage = {
  id: string;
  role: "user" | "assistant";
  /** What the person wrote, or the answer – may grow while `streaming` is set */
  text: string;
  /** User messages: what was attached from the page, shown under the message, e.g. "Q3 report" */
  context?: string;
  /** Assistant: the sources the answer cites ([1] in the text is the first) – shown with ai-answer */
  sources?: AnswerSource[];
  /** Assistant: the answer as claims – when given, it's shown with claim-answer instead of ai-answer */
  claims?: AnswerClaim[];
  /** Assistant: the passages the claims rest on */
  claimSources?: ClaimSource[];
  /** Assistant (claims): the strongest case against the answer */
  counter?: string;
  /** Assistant: follow-up questions offered under the finished answer */
  followUps?: string[];
  /** Assistant: more text is still coming */
  streaming?: boolean;
  /** Assistant: a high-stakes answer – the reflection gate asks for this pause before it's relied on. "prior" hides the
   *  answer until the person has said what they expect */
  reflect?: ReflectionMode;
  /** Assistant: the answer failed – shown as an alert with Try again */
  error?: string;
};

export type SidePaneSend = { message: string; model: string; pageContext?: ChatPageContext };
export type SidePaneMessageRef = { id: string };
export type SidePaneFeedback = { id: string; value: FeedbackKind | null; reason?: string };
export type SidePaneVerify = { id: string; claim: AnswerClaim; sources: ClaimSource[] };
export type SidePaneReflect = { id: string; submission: ReflectionGateSubmission | null };
export type SidePaneOpenChange = { open: boolean };
export type SidePaneCollapsedChange = { collapsed: boolean };
export type SidePaneWidthChange = { width: number };
export type SidePaneConversationChange = { conversation: string | null };
export type SidePaneConversationsChange = { conversations: ChatConversation[] };
export type SidePaneModelChange = { model: string; choice: ChatModel };
export type SidePaneSettingsChange = { settings: ModelSettingsValue; changed: string[] };
export type SidePanePageContextChange = { pageContext: ChatPageContext; change: ChatPageContextChange["change"] };

const DISCLAIMER = "AI can make mistakes. Check important info.";
const RAIL = 52;
const PAGE_MIN = 280;

/* ---------- Shortcut ---------- */

export type PaneShortcut = { key: string; mod: boolean; meta: boolean; ctrl: boolean; alt: boolean; shift: boolean };

/** "mod+.", "mod+shift+k", "alt+a", "mod++" – mod is ⌘ on a Mac and Ctrl elsewhere */
export function parseShortcut(s: string | null | undefined): PaneShortcut | null {
  if (!s) return null;
  const parts = s.toLowerCase().split("+");
  // "mod++" ends in an empty part: the key is "+"
  const key = parts[parts.length - 1] === "" ? "+" : parts[parts.length - 1];
  const mods = new Set(parts.slice(0, parts[parts.length - 1] === "" ? -2 : -1));
  return { key, mod: mods.has("mod"), meta: mods.has("meta") || mods.has("cmd"), ctrl: mods.has("ctrl") || mods.has("control"), alt: mods.has("alt") || mods.has("option"), shift: mods.has("shift") };
}

const KEY_CODES: Record<string, string> = { ".": "Period", ",": "Comma", "/": "Slash", ";": "Semicolon", "'": "Quote", "[": "BracketLeft", "]": "BracketRight", "\\": "Backslash", "`": "Backquote", "-": "Minus", "=": "Equal" };

export function matchesShortcut(e: KeyboardEvent, s: PaneShortcut) {
  if (s.mod ? !(e.metaKey || e.ctrlKey) : e.metaKey !== s.meta || e.ctrlKey !== s.ctrl) return false;
  if (e.altKey !== s.alt || e.shiftKey !== s.shift) return false;
  const code = KEY_CODES[s.key] ?? (/^[a-z]$/.test(s.key) ? `Key${s.key.toUpperCase()}` : /^\d$/.test(s.key) ? `Digit${s.key}` : "");
  // The code covers layouts and Alt / Shift changing the character
  return e.key.toLowerCase() === s.key || (!!code && e.code === code);
}

/** How the shortcut reads, and its aria-keyshortcuts value */
export function describeShortcut(s: PaneShortcut | null, mac: boolean) {
  if (!s) return { label: "", aria: undefined };
  const key = s.key.length === 1 ? s.key.toUpperCase() : s.key[0].toUpperCase() + s.key.slice(1);
  const meta = s.meta || (s.mod && mac);
  const ctrl = s.ctrl || (s.mod && !mac);
  const aria = [ctrl && "Control", s.alt && "Alt", s.shift && "Shift", meta && "Meta", key].filter(Boolean).join("+");
  const label = mac
    ? [ctrl && "⌃", s.alt && "⌥", s.shift && "⇧", meta && "⌘", key].filter(Boolean).join("")
    : [ctrl && "Ctrl", s.alt && "Alt", s.shift && "Shift", meta && "Win", key].filter(Boolean).join("+");
  return { label, aria };
}

/* ---------- Focus ---------- */

const TABBABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

function tabbables(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>(TABBABLE)].filter((el) => el.tabIndex >= 0 && !el.closest("[inert], [hidden]") && el.getClientRects().length > 0);
}

/** A tc-button's inner button, or the element itself */
const focusable = (el: Element | null | undefined) => (el ? ((el.matches("tc-button") ? el.querySelector("button") : el) as HTMLElement | null) : null);

/** Focuses what `find` returns once it's there and showing – the parts inside render a frame after the pane */
function focusSoon(find: () => HTMLElement | null | undefined, tries = 8) {
  const el = find();
  el?.focus({ preventScroll: true });
  if (el && el.ownerDocument.activeElement === el) return;
  if (tries > 0) requestAnimationFrame(() => focusSoon(find, tries - 1));
}

/* ---------- Icons (Lucide, ISC) ---------- */

const glyph = (paths: unknown, slot = "icon") =>
  html`<svg slot=${slot} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const SPARKLE = svg`<path d="M9.94 14.06 4 12l5.94-2.06L12 4l2.06 5.94L20 12l-5.94 2.06L12 20z"></path>`;
const NEW_CHAT = svg`<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.4 2.6a2.1 2.1 0 1 1 3 3L12 15l-4 1 1-4z"></path>`;
const HISTORY = svg`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M12 7v5l4 2"></path>`;
const CLOSE = svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`;
const BACK = svg`<path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path>`;
const PAGE = svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path>`;
const panelIcon = (side: "left" | "right", open: boolean) =>
  svg`<rect width="18" height="18" x="3" y="3" rx="2"></rect><path d=${side === "right" ? "M15 3v18" : "M9 3v18"}></path><path d=${(side === "right") === open ? "m8 9 3 3-3 3" : side === "right" ? "m11 9-3 3 3 3" : "m16 15-3-3 3-3"}></path>`;

/** One row of actions under every finished answer */
const ACTIONS: MessageActionKey[] = ["copy", "regenerate", "feedback"];

/** The plain text of a claim answer, for Copy and Read aloud */
const claimText = (claims: AnswerClaim[]) => claims.map((c) => c.text).join("");

/** The parts the element renders itself – everything else in it is the host page */
const OWN = new Set(["ui-sp__handle", "ui-sp__scrim", "ui-sp__pane", "ui-sp__launcher"]);
const isOwn = (el: Element) => [...el.classList].some((c) => OWN.has(c));

let uidSeq = 0;

/**
 * An assistant docked beside a page: a conversation about what's on it, with history, starters, a reflection gate for
 * high-stakes answers and the full chat composer. Resizable, collapses to a rail, a sheet on narrow screens.
 * @tag tc-ai-side-pane
 * @slot - The host page – the pane docks beside it
 * @fires tc-send - A message was sent – append it and the answer to `messages` ({ message, model, pageContext }: SidePaneSend); `onSend` may return a promise to keep the text in the composer until it settles
 * @fires tc-stop - Stop was pressed while an answer was streaming ({ id }: SidePaneMessageRef)
 * @fires tc-regenerate - Regenerate, or Try again after an error ({ id }: SidePaneMessageRef); `onRegenerate` may return a promise
 * @fires tc-feedback - A thumb up or down on an answer, or cleared ({ id, value, reason }: SidePaneFeedback)
 * @fires tc-verify - A claim was sent to verification ({ id, claim, sources }: SidePaneVerify)
 * @fires tc-reflect - The reflection gate on a high-stakes answer was submitted, or skipped with `submission: null` ({ id, submission }: SidePaneReflect); cancelable – prevented, the gate stays open
 * @fires tc-new-chat - New chat was pressed – start an empty conversation; detail: null
 * @fires tc-conversation-change - A conversation was picked in History – load its messages ({ conversation }: SidePaneConversationChange); cancelable – prevented, `conversation` stays (History still closes)
 * @fires tc-conversations-change - History's list changed: a rename, pin, move or delete ({ conversations }: SidePaneConversationsChange); cancelable – prevented, `conversations` stays
 * @fires tc-model-change - A model was picked in the toolbar ({ model, choice }: SidePaneModelChange); cancelable – prevented, `model` stays
 * @fires tc-settings-change - The model settings changed ({ settings, changed }: SidePaneSettingsChange); cancelable – prevented, `settings` stays
 * @fires tc-page-context-change - The page-context chip was toggled, or an attached item removed ({ pageContext, change }: SidePanePageContextChange); cancelable – prevented, `pageContext` stays
 * @fires tc-open-change - The pane was opened or closed ({ open }: SidePaneOpenChange); cancelable – prevented, `open` stays
 * @fires tc-collapsed-change - The pane was collapsed to the rail or expanded ({ collapsed }: SidePaneCollapsedChange); cancelable – prevented, `collapsed` stays
 * @fires tc-width-change - The pane was resized – once a drag ends, and on every arrow-key step ({ width }: SidePaneWidthChange); cancelable – prevented, `width` stays
 */
export class TcAiSidePane extends TcElement {
  static override ui = "sp";

  /** The pane's title, its landmark's and dialog's name */
  @property() accessor heading = "Assistant";
  /** The conversation, oldest first. The app owns it */
  @property({ attribute: false }) accessor messages: SidePaneMessage[] = [];
  /** Lets people skip the reflection gate */
  @property({ type: Boolean, attribute: "reflection-skippable" }) accessor reflectionSkippable = false;
  /** Suggestions before the first message – derive them from what's on the page */
  @property({ attribute: false }) accessor starters: PromptStarter[] = [];
  /** The heading over the suggestions – unset reads "From <page>" or "Suggestions" */
  @property({ attribute: "starters-title" }) accessor startersTitle: string | undefined = undefined;
  /** Past conversations for the History panel – unset hides History */
  @property({ attribute: false }) accessor conversations: ChatConversation[] | undefined = undefined;
  /** The open conversation's id */
  @property({ attribute: false }) accessor conversation: string | null = null;
  /** What's on the page – the composer's page-context chip; unset shows no chip */
  @property({ attribute: false }) accessor pageContext: ChatPageContext | undefined = undefined;
  /** The line under the composer; "" hides it */
  @property() accessor disclaimer = DISCLAIMER;
  /** The composer's placeholder */
  @property() accessor placeholder = "Ask about this page…";
  /** The models in the toolbar's menu – the composer's defaults when unset */
  @property({ attribute: false }) accessor models: ChatModel[] | undefined = undefined;
  /** The picked model's id – the first model when empty */
  @property() accessor model = "";
  /** The model settings in the toolbar's settings popover */
  @property({ attribute: false }) accessor settings: ModelSettingsValue | undefined = undefined;
  /** Which settings the model supports – the settings button shows only with it */
  @property({ attribute: false }) accessor settingsModel: ModelSettingsModel | undefined = undefined;
  /** Templates for the toolbar's prompt library – the prompts button shows only with them */
  @property({ attribute: false }) accessor prompts: PromptTemplate[] | undefined = undefined;
  /** Shows "Select a project" in the composer's menu (it fires tc-select-project) */
  @property({ type: Boolean, attribute: "select-project" }) accessor selectProject = false;
  /** Shows "Connect apps"; may return a promise the composer waits for */
  @property({ attribute: false }) accessor onConnectApps: (() => void | Promise<unknown>) | undefined = undefined;
  /** Shows "Request approval"; may return a promise the composer waits for */
  @property({ attribute: false }) accessor onRequestApproval: (() => void | Promise<unknown>) | undefined = undefined;
  /** Dictation – see the chat composer */
  @property({ attribute: false }) accessor onDictate: HTMLElementTagNameMap["tc-chat-composer"]["onDictate"] = undefined;
  /** The composer's demo mode: dictation and approval are simulated */
  @property({ type: Boolean }) accessor demo = false;
  /** Called with each sent message; return a promise to keep the text in the composer until it settles */
  @property({ attribute: false }) accessor onSend: ((message: string, details: { model: string; pageContext?: ChatPageContext }) => void | Promise<unknown>) | undefined = undefined;
  /** Called by Regenerate and Try again; return a promise to show the regenerating state until it settles */
  @property({ attribute: false }) accessor onRegenerate: ((id: string) => void | Promise<unknown>) | undefined = undefined;
  /** Open */
  @property({ type: Boolean, reflect: true }) accessor open = true;
  /** Collapsed to the rail */
  @property({ type: Boolean, reflect: true }) accessor collapsed = false;
  /** The docked width in px */
  @property({ type: Number }) accessor width = 400;
  /** The width Enter and a double-click on the edge go back to, in px */
  @property({ type: Number, attribute: "default-width" }) accessor defaultWidth = 400;
  /** The narrowest the pane can be dragged, in px */
  @property({ type: Number, attribute: "min-width" }) accessor minWidth = 320;
  /** The widest the pane can be dragged, in px */
  @property({ type: Number, attribute: "max-width" }) accessor maxWidth = 640;
  /** Opens the pane (or moves focus into it; pressed inside, closes it). "mod" is ⌘ on a Mac and Ctrl elsewhere; "" turns it off */
  @property() accessor shortcut = "mod+.";
  /** Below this width of the element, in px, the pane is an overlay sheet instead of docked */
  @property({ type: Number }) accessor breakpoint = 720;
  /** Which side it docks on */
  @property({ reflect: true }) accessor side: "left" | "right" = "right";
  /** A floating "Ask AI" button while the pane is closed – false if your page has its own */
  @property({ converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor launcher = true;

  /** @internal The message in the composer – kept here so a starter can fill it */
  @state() private accessor draft = "";
  /** @internal */
  @state() private accessor historyOpen = false;
  /** @internal Below the breakpoint */
  @state() private accessor overlay = false;
  /** @internal */
  @state() private accessor mac = false;
  /** @internal Where each reflection gate is */
  @state() private accessor phases: Record<string, ReflectionPhase> = {};

  private uid = `sp${++uidSeq}`;
  private shownFirst: string | null = null;
  private shownIds = new Set<string>();
  private ro?: ResizeObserver;
  private threadRo?: ResizeObserver;
  private observedInner: Element | null = null;
  private stick = true;
  private returnTo: HTMLElement | null = null;
  private drag: { x: number; w: number; next: number } | null = null;
  private inerted = new Set<Element>();
  private lastRole: string | undefined = undefined;
  private lastCount = 0;
  private wasOverlay = false;

  private get clampWidth() {
    return (w: number) => Math.round(Math.min(this.maxWidth, Math.max(this.minWidth, Number.isFinite(w) ? w : this.defaultWidth)));
  }
  private get rail() {
    return !this.overlay && this.collapsed;
  }
  private get showHistory() {
    return this.historyOpen && !this.rail && !!this.conversations;
  }
  private get pane() {
    return this.querySelector<HTMLElement>(":scope > .ui-sp__pane");
  }

  private onWindowKey = (e: KeyboardEvent) => {
    const pane = this.pane;
    const inside = e.target instanceof Node && !!pane?.contains(e.target);
    const sc = parseShortcut(this.shortcut);
    if (sc && matchesShortcut(e, sc)) {
      e.preventDefault();
      if (!this.open || this.rail) this.openPane();
      else if (inside) this.closePane();
      else {
        this.returnTo = document.activeElement as HTMLElement | null;
        this.focusComposer();
      }
      return;
    }
    // Window, bubble phase: menus and popovers inside the pane handle their own Escape first
    if (e.key !== "Escape" || e.defaultPrevented || !this.open) return;
    if (inside && this.showHistory) {
      e.preventDefault();
      this.toggleHistory(false);
    } else if (this.overlay && !this.rail) {
      e.preventDefault();
      this.closePane();
    }
  };

  override connectedCallback() {
    super.connectedCallback();
    this.mac = isMac();
    window.addEventListener("keydown", this.onWindowKey);
    this.ro = new ResizeObserver(([entry]) => this.measure(entry.contentRect.width));
    this.ro.observe(this);
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("keydown", this.onWindowKey);
    this.ro?.disconnect();
    this.threadRo?.disconnect();
    this.threadRo = undefined;
    this.observedInner = null;
  }

  /** Docked or overlay, from the element's own width – no layout (tests, hidden): stay docked */
  private measure(w: number) {
    if (w > 0) this.overlay = w < this.breakpoint;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // Docked or sheet before the first render, so the parts inside lay out once at their real width
    if (!this.hasUpdated) this.measure(this.getBoundingClientRect().width);
    if (!Array.isArray(this.messages)) this.messages = [];
    if (!Array.isArray(this.starters)) this.starters = [];
    // Answers already there when a conversation is shown appear at once; ones that arrive later stream in
    const first = this.messages[0]?.id ?? "";
    if (first !== this.shownFirst) {
      this.shownFirst = first;
      this.shownIds = new Set(this.messages.map((m) => m.id));
    }
    const width = this.clampWidth(this.width);
    this.dataset.side = this.side === "left" ? "left" : "right";
    this.toggleAttribute("data-overlay", this.overlay);
    this.toggleAttribute("data-open", this.open);
    if (!this.drag) this.style.setProperty("--sp-w", `${this.rail ? RAIL : width}px`);
    this.style.setProperty("--sp-page-min", `${PAGE_MIN}px`);
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    // The page behind a sheet is inert
    const sheet = this.overlay && this.open;
    for (const child of [...this.children]) {
      if (isOwn(child)) continue;
      if (sheet && !child.hasAttribute("inert")) {
        child.setAttribute("inert", "");
        this.inerted.add(child);
      } else if (!sheet && this.inerted.has(child)) {
        child.removeAttribute("inert");
        this.inerted.delete(child);
      }
    }
    // Follow the conversation while it grows, unless the reader scrolled up
    const inner = this.querySelector(".ui-sp__inner");
    if (inner && inner !== this.observedInner) {
      this.threadRo?.disconnect();
      this.threadRo = new ResizeObserver(() => {
        const thread = this.querySelector<HTMLElement>(".ui-sp__thread");
        if (thread && this.stick) thread.scrollTop = thread.scrollHeight;
      });
      this.threadRo.observe(inner);
      this.observedInner = inner;
    }
    // A message just sent: back to the bottom
    const lastRole = this.messages[this.messages.length - 1]?.role;
    if (this.messages.length !== this.lastCount || lastRole !== this.lastRole) {
      if (lastRole === "user" && this.messages.length > this.lastCount) {
        this.stick = true;
        const thread = this.querySelector<HTMLElement>(".ui-sp__thread");
        thread?.scrollTo({ top: thread.scrollHeight, behavior: reducedMotion() ? "auto" : "smooth" });
      }
      this.lastCount = this.messages.length;
      this.lastRole = lastRole;
    }
    // Becoming a sheet while open makes it modal: focus goes in
    if (this.overlay && !this.wasOverlay && this.open && !this.pane?.contains(document.activeElement)) this.focusComposer();
    this.wasOverlay = this.overlay;
  }

  /* ---------- Chrome: open, collapse, history, width ---------- */

  private setOpen(open: boolean) {
    if (open === this.open) return true;
    if (!this.emit<SidePaneOpenChange>("tc-open-change", { open }, { cancelable: true })) return false;
    this.open = open;
    return true;
  }
  private setCollapsed(collapsed: boolean) {
    if (collapsed === this.collapsed) return true;
    if (!this.emit<SidePaneCollapsedChange>("tc-collapsed-change", { collapsed }, { cancelable: true })) return false;
    this.collapsed = collapsed;
    return true;
  }
  private setWidth(width: number) {
    const w = this.clampWidth(width);
    if (w !== this.width && this.emit<SidePaneWidthChange>("tc-width-change", { width: w }, { cancelable: true })) this.width = w;
    // Back to the property (prevented, or unchanged after a drag)
    this.paint(this.clampWidth(this.width));
  }
  private paint(w: number) {
    this.style.setProperty("--sp-w", `${w}px`);
    const handle = this.querySelector(".ui-sp__handle");
    handle?.setAttribute("aria-valuenow", String(w));
    handle?.setAttribute("aria-valuetext", `${w} pixels wide`);
  }

  private focusComposer() {
    focusSoon(() => this.querySelector<HTMLElement>(".ui-sp__composer tc-chat-composer textarea"));
  }
  private openPane() {
    const active = document.activeElement as HTMLElement | null;
    if (active && !this.pane?.contains(active) && active !== document.body) this.returnTo = active;
    if (!this.setOpen(true)) return;
    this.setCollapsed(false);
    this.focusComposer();
  }
  private closePane() {
    const inside = !!this.pane?.contains(document.activeElement) || document.activeElement === document.body;
    if (!this.setOpen(false)) return;
    this.historyOpen = false;
    if (!inside) return;
    const back = this.returnTo;
    this.returnTo = null;
    // Back where focus was before the pane opened, else the launcher, else the page
    focusSoon(() =>
      back?.isConnected && !back.closest("[inert]") && back.getClientRects().length
        ? back
        : (this.querySelector<HTMLElement>(":scope > .ui-sp__launcher") ?? [...this.children].find((c): c is HTMLElement => !isOwn(c) && c instanceof HTMLElement)),
    );
  }
  private collapse(next: boolean) {
    if (!this.setCollapsed(next)) return;
    this.historyOpen = false;
    if (next) focusSoon(() => focusable(this.querySelector('[data-action="expand"]')));
    else this.focusComposer();
  }
  private toggleHistory(next: boolean) {
    this.historyOpen = next;
    if (next) focusSoon(() => this.querySelector<HTMLElement>(".ui-sp__history tc-chat-history input"));
    else focusSoon(() => focusable(this.querySelector('[data-action="history"]')));
  }
  private newChat() {
    this.historyOpen = false;
    this.setCollapsed(false);
    this.emit("tc-new-chat", null);
    this.focusComposer();
  }

  /** The sheet keeps Tab inside */
  private trapTab(e: KeyboardEvent) {
    if (e.key !== "Tab" || !this.overlay || !this.open || e.defaultPrevented) return;
    const pane = e.currentTarget as HTMLElement;
    const items = tabbables(pane);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !pane.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /* ---------- Resize ---------- */

  private onDragStart(e: PointerEvent) {
    if (e.button !== 0) return;
    e.preventDefault();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // A pointer the browser doesn't track (a synthetic event) – the drag still follows the moves on the edge
    }
    const w = this.pane?.getBoundingClientRect().width || this.clampWidth(this.width);
    this.drag = { x: e.clientX, w, next: Math.round(w) };
    this.setAttribute("data-resizing", "");
  }
  // While dragging only the CSS variable moves – no render per pointer move; the width is reported at the end
  private onDragMove(e: PointerEvent) {
    const d = this.drag;
    if (!d) return;
    const dx = e.clientX - d.x;
    d.next = this.clampWidth(d.w + (this.side === "right" ? -dx : dx));
    this.paint(d.next);
  }
  private onDragEnd() {
    const d = this.drag;
    if (!d) return;
    this.drag = null;
    this.removeAttribute("data-resizing");
    this.setWidth(d.next);
  }
  private onHandleKey(e: KeyboardEvent) {
    const step = e.shiftKey ? 64 : 16;
    const width = this.clampWidth(this.width);
    // The arrows move the edge: toward the page widens the pane
    const grow = this.side === "right" ? "ArrowLeft" : "ArrowRight";
    const shrink = this.side === "right" ? "ArrowRight" : "ArrowLeft";
    let next: number | null = null;
    if (e.key === grow) next = width + step;
    else if (e.key === shrink) next = width - step;
    else if (e.key === "Home") next = this.minWidth;
    else if (e.key === "End") next = this.maxWidth;
    else if (e.key === "Enter") next = this.defaultWidth;
    if (next === null) return;
    e.preventDefault();
    this.setWidth(next);
  }

  /* ---------- Conversation ---------- */

  private send(text: string, model = this.model) {
    const message = text.trim();
    if (!message) return;
    this.stick = true;
    const pageContext = this.pageContext?.connected ? this.pageContext : undefined;
    this.emit<SidePaneSend>("tc-send", { message, model, pageContext });
    return this.onSend?.(message, { model, pageContext });
  }
  private regenerate(id: string) {
    this.emit<SidePaneMessageRef>("tc-regenerate", { id });
    return this.onRegenerate?.(id);
  }
  /** Stops an inner part's event here: the pane reports it in its own words */
  private stop = (e: Event) => e.stopPropagation();

  private assistant(m: SidePaneMessage, last: boolean) {
    const look = this.resolvedLook;
    const phase = this.phases[m.id];
    const reflecting = !!m.reflect && !m.streaming && !m.error;
    const settled = phase === "done" || phase === "skipped";
    // "prior" asks for an expectation before the answer is shown
    const hidden = reflecting && m.reflect === "prior" && !settled;
    const gate = reflecting
      ? html`<div class="ui-sp__gate">
          <tc-reflection-gate
            look=${look}
            mode=${m.reflect!}
            answer=${m.text || (m.claims ? claimText(m.claims) : "")}
            .claims=${m.reflect === "checkpoint" && m.claims ? m.claims.filter((c) => c.source).map((c) => ({ id: c.id, text: c.text.trim() })) : []}
            phase=${phase ?? "open"}
            ?allow-skip=${this.reflectionSkippable}
            @tc-value-change=${this.stop}
            @tc-phase-change=${(e: CustomEvent<ReflectionGatePhaseChange>) => {
              e.stopPropagation();
              this.phases = { ...this.phases, [m.id]: e.detail.phase };
            }}
            @tc-submit=${(e: CustomEvent<ReflectionGateSubmission>) => {
              e.stopPropagation();
              if (!this.emit<SidePaneReflect>("tc-reflect", { id: m.id, submission: e.detail }, { cancelable: true })) e.preventDefault();
            }}
            @tc-skip=${(e: CustomEvent<ReflectionGateSkip>) => {
              e.stopPropagation();
              if (!this.emit<SidePaneReflect>("tc-reflect", { id: m.id, submission: null }, { cancelable: true })) e.preventDefault();
            }}
          ></tc-reflection-gate>
        </div>`
      : nothing;
    // One row of actions under every finished answer: ai-answer's own row is turned off for it
    const actions = (text: string) =>
      m.streaming
        ? nothing
        : html`<tc-message-actions
            look=${look}
            text=${text}
            .actions=${ACTIONS}
            .onRegenerate=${() => this.regenerate(m.id)}
            .onFeedback=${(value: FeedbackKind | null, reason?: string) => {
              this.emit<SidePaneFeedback>("tc-feedback", { id: m.id, value, reason });
            }}
            @tc-feedback=${this.stop}
          ></tc-message-actions>`;
    let answer: unknown = nothing;
    if (!hidden && m.claims) {
      answer = html`<tc-claim-answer
          look=${look}
          .claims=${m.claims}
          .sources=${m.claimSources ?? []}
          counter=${m.counter ?? ""}
          @tc-open-change=${this.stop}
          @tc-queued-change=${this.stop}
          @tc-verify=${(e: CustomEvent<ClaimVerifyDetail>) => {
            e.stopPropagation();
            this.emit<SidePaneVerify>("tc-verify", { id: m.id, claim: e.detail.claim, sources: e.detail.sources });
          }}
        ></tc-claim-answer>
        ${actions(claimText(m.claims))}
        ${last && !m.streaming && m.followUps?.length
          ? html`<tc-prompt-starters
              look=${look}
              variant="follow-ups"
              heading="Follow up"
              .hints=${false}
              .items=${m.followUps.map((q, i) => ({ id: `${m.id}-f${i}`, text: q }))}
              @tc-send=${(e: CustomEvent<PromptStarterPick>) => {
                e.stopPropagation();
                void this.send(e.detail.text);
              }}
              @tc-fill=${this.stop}
            ></tc-prompt-starters>`
          : nothing}`;
    } else if (!hidden && (m.text || m.streaming)) {
      answer = html`<tc-ai-answer
          look=${look}
          answer=${m.text}
          .sources=${m.sources ?? []}
          ?streaming=${!!m.streaming}
          .animated=${!this.shownIds.has(m.id)}
          hide-actions
          .followUps=${last ? (m.followUps ?? []) : []}
          @tc-follow-up=${(e: CustomEvent<{ question: string }>) => {
            e.stopPropagation();
            void this.send(e.detail.question);
          }}
          @tc-stop=${(e: Event) => {
            e.stopPropagation();
            this.emit<SidePaneMessageRef>("tc-stop", { id: m.id });
          }}
          @tc-feedback=${this.stop}
          @tc-feedback-change=${this.stop}
        ></tc-ai-answer>
        ${actions(m.text)}`;
    }
    return html`<article class="ui-sp__msg ui-sp__msg--ai" aria-label="Assistant" data-message=${m.id}>
      ${m.reflect === "prior" ? gate : nothing}${answer}${m.reflect !== "prior" ? gate : nothing}
      ${m.error
        ? html`<div class="ui-sp__error" role="alert">
            <span>${m.error}</span>
            <tc-button look=${look} variant="secondary" size="sm" data-action="retry" label="Try again" @click=${() => void this.regenerate(m.id)}></tc-button>
          </div>`
        : nothing}
    </article>`;
  }

  private user(m: SidePaneMessage) {
    return html`<article class="ui-sp__msg ui-sp__msg--user" aria-label="You" data-message=${m.id}>
      <p class="ui-sp__bubble">${m.text}</p>
      ${m.context
        ? html`<span class="ui-sp__attached"
            ><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PAGE}</svg
            ><span class="ui-sp__sr">Sent with </span>${m.context}</span
          >`
        : nothing}
    </article>`;
  }

  /* ---------- Render ---------- */

  override render() {
    const look = this.resolvedLook;
    const uid = this.uid;
    const titleId = `${uid}-title`;
    const paneId = `${uid}-pane`;
    const historyId = `${uid}-history`;
    const keys = describeShortcut(parseShortcut(this.shortcut), this.mac);
    const docked = !this.overlay;
    const rail = this.rail;
    const showHistory = this.showHistory;
    const sheet = this.overlay && this.open;
    const width = this.clampWidth(this.width);
    const messages = this.messages;
    const empty = messages.length === 0;
    const page = this.pageContext;
    const connected = !!page?.connected;
    const current = this.conversations?.find((c) => c.id === this.conversation);
    const side = this.side === "left" ? "left" : "right";

    const tools = html`<div class="ui-sp__tools">
      <tc-button look=${look} variant="ghost" size="sm" data-action="new-chat" hide-label label="New chat" @click=${() => this.newChat()}>${glyph(NEW_CHAT)}</tc-button>
      ${this.conversations
        ? html`<tc-button
            look=${look}
            variant="ghost"
            size="sm"
            hide-label
            data-action="history"
            label="History"
            aria-expanded=${showHistory ? "true" : "false"}
            aria-controls=${historyId}
            @click=${() => this.toggleHistory(!showHistory)}
            >${glyph(HISTORY)}</tc-button
          >`
        : nothing}
      ${docked
        ? html`<tc-button look=${look} variant="ghost" size="sm" data-action="collapse" hide-label label="Collapse to rail" @click=${() => this.collapse(true)}
            >${glyph(panelIcon(side, true))}</tc-button
          >`
        : nothing}
      <tc-button look=${look} variant="ghost" size="sm" data-action="close" hide-label label="Close ${this.heading}" aria-keyshortcuts=${ifDefined(keys.aria)} @click=${() => this.closePane()}
        >${glyph(CLOSE)}</tc-button
      >
    </div>`;

    const body = html`<div class="ui-sp__body" ?hidden=${rail}>
      <div class="ui-sp__thread" ?hidden=${showHistory} @scroll=${(e: Event) => {
        const t = e.currentTarget as HTMLElement;
        this.stick = t.scrollHeight - t.scrollTop - t.clientHeight < 48;
      }}>
        <div class="ui-sp__inner">
          ${empty
            ? html`<div class="ui-sp__empty">
                <p class="ui-sp__hello">${connected ? `Ask about ${page!.title}` : "Ask anything"}</p>
                <p class="ui-sp__hint">${connected ? "The assistant can see this page." : page ? "Page context is off – answers won't use this page." : "Answers appear here."}</p>
                ${this.starters.length
                  ? html`<tc-prompt-starters
                      look=${look}
                      heading=${this.startersTitle ?? (connected ? `From ${page!.title}` : "Suggestions")}
                      .items=${this.starters}
                      @tc-send=${(e: CustomEvent<PromptStarterPick>) => {
                        e.stopPropagation();
                        void this.send(e.detail.text);
                      }}
                      @tc-fill=${(e: CustomEvent<PromptStarterPick>) => {
                        e.stopPropagation();
                        this.draft = e.detail.text;
                        this.focusComposer();
                      }}
                    ></tc-prompt-starters>`
                  : nothing}
              </div>`
            : repeat(
                messages,
                (m) => m.id,
                (m, i) => (m.role === "user" ? this.user(m) : this.assistant(m, i === messages.length - 1)),
              )}
        </div>
      </div>
      ${this.conversations
        ? html`<div class="ui-sp__history" id=${historyId} role="region" aria-label="Chat history" ?hidden=${!showHistory}>
            <tc-button look=${look} variant="ghost" size="sm" data-action="back" label="Back to chat" @click=${() => this.toggleHistory(false)}>${glyph(BACK)}</tc-button>
            <tc-chat-history
              look=${look}
              .conversations=${this.conversations}
              .value=${this.conversation ?? null}
              .hints=${false}
              max-height="360"
              @tc-value-change=${(e: CustomEvent<ChatValueChange>) => {
                e.stopPropagation();
                // Prevented (a page controlling `conversation` loads it itself), the list keeps its value – either way
                // the picked chat is what comes next, so History closes
                if (this.emit<SidePaneConversationChange>("tc-conversation-change", { conversation: e.detail.value }, { cancelable: true })) this.conversation = e.detail.value;
                else e.preventDefault();
                this.historyOpen = false;
                this.focusComposer();
              }}
              @tc-conversations-change=${(e: CustomEvent<ChatConversationsChange>) => {
                e.stopPropagation();
                if (!this.emit<SidePaneConversationsChange>("tc-conversations-change", { conversations: e.detail.conversations }, { cancelable: true })) e.preventDefault();
                else this.conversations = e.detail.conversations;
              }}
              @tc-new-chat=${(e: Event) => {
                e.stopPropagation();
                this.newChat();
              }}
            ></tc-chat-history>
          </div>`
        : nothing}
      <div class="ui-sp__composer" ?hidden=${showHistory}>
        <tc-chat-composer
          look=${look}
          placeholder=${this.placeholder}
          .value=${this.draft}
          .models=${this.models ?? defaultChatModels}
          .model=${this.model}
          model-switcher="toolbar"
          .settings=${this.settings}
          .settingsModel=${this.settingsModel}
          .prompts=${this.prompts}
          .pageContext=${page}
          disclaimer=${this.disclaimer}
          .onSend=${(text: string, details: ChatSendDetails) => this.send(text, details.model)}
          .onConnectApps=${this.onConnectApps}
          .onRequestApproval=${this.onRequestApproval}
          .onDictate=${this.onDictate}
          ?hide-connect-apps=${!this.onConnectApps}
          ?hide-project=${!this.selectProject}
          ?hide-approval=${!this.onRequestApproval}
          ?demo=${this.demo}
          @tc-send=${this.stop}
          @tc-value-change=${(e: CustomEvent<{ value: string }>) => {
            e.stopPropagation();
            this.draft = e.detail.value;
          }}
          @tc-model-change=${(e: CustomEvent<{ model: string; choice: ChatModel }>) => {
            e.stopPropagation();
            if (!this.emit<SidePaneModelChange>("tc-model-change", { model: e.detail.model, choice: e.detail.choice }, { cancelable: true })) e.preventDefault();
            else this.model = e.detail.model;
          }}
          @tc-settings-change=${(e: CustomEvent<ChatSettingsChange>) => {
            e.stopPropagation();
            if (!this.emit<SidePaneSettingsChange>("tc-settings-change", { settings: e.detail.value, changed: e.detail.changed }, { cancelable: true })) e.preventDefault();
            else this.settings = e.detail.value;
          }}
          @tc-page-context-change=${(e: CustomEvent<ChatPageContextChange>) => {
            e.stopPropagation();
            if (!this.emit<SidePanePageContextChange>("tc-page-context-change", { pageContext: e.detail.pageContext, change: e.detail.change }, { cancelable: true })) e.preventDefault();
            else this.pageContext = e.detail.pageContext;
          }}
        ></tc-chat-composer>
      </div>
    </div>`;

    return html`${docked && this.open && !rail
        ? html`<div
            class="ui-sp__handle"
            role="separator"
            tabindex="0"
            aria-orientation="vertical"
            aria-label="Resize ${this.heading}"
            aria-controls=${paneId}
            aria-valuenow=${width}
            aria-valuemin=${this.minWidth}
            aria-valuemax=${this.maxWidth}
            aria-valuetext="${width} pixels wide"
            @pointerdown=${this.onDragStart}
            @pointermove=${this.onDragMove}
            @pointerup=${this.onDragEnd}
            @pointercancel=${this.onDragEnd}
            @lostpointercapture=${this.onDragEnd}
            @keydown=${this.onHandleKey}
            @dblclick=${() => this.setWidth(this.defaultWidth)}
          ></div>`
        : nothing}
      ${sheet ? html`<div class="ui-sp__scrim" aria-hidden="true" @click=${() => this.closePane()}></div>` : nothing}
      <div
        id=${paneId}
        class="ui-sp__pane"
        role=${sheet ? "dialog" : "complementary"}
        aria-modal=${ifDefined(sheet ? "true" : undefined)}
        aria-labelledby=${titleId}
        ?hidden=${!this.open}
        data-rail=${ifDefined(rail ? "" : undefined)}
        @keydown=${this.trapTab}
      >
        <div class="ui-sp__rail" ?hidden=${!rail}>
          <tc-button
            look=${look}
            variant="ghost"
            size="sm"
            hide-label
            data-action="expand"
            label="Expand ${this.heading}"
            aria-keyshortcuts=${ifDefined(keys.aria)}
            @click=${() => this.collapse(false)}
            >${glyph(panelIcon(side, false))}</tc-button
          >
          <tc-button look=${look} variant="ghost" size="sm" data-action="rail-new-chat" hide-label label="New chat" @click=${() => this.newChat()}>${glyph(NEW_CHAT)}</tc-button>
          <span class="ui-sp__rail-mark" aria-hidden="true">${glyph(SPARKLE, "")}</span>
        </div>
        <div class="ui-sp__frame" ?hidden=${rail}>
          ${cardHead({ icon: SPARKLE, title: this.heading, subtitle: current && !empty ? current.title : undefined, id: titleId, level: 2, aside: tools, keepAside: true })}
          ${body}
        </div>
      </div>
      ${this.launcher && !this.open
        ? html`<button
            type="button"
            class="ui-sp__launcher"
            aria-keyshortcuts=${ifDefined(keys.aria)}
            aria-controls=${paneId}
            aria-expanded="false"
            @click=${() => this.openPane()}
          >
            ${glyph(SPARKLE, "")}<span>Ask AI</span>${keys.label ? html`<kbd aria-hidden="true">${keys.label}</kbd>` : nothing}
          </button>`
        : nothing}`;
  }

  static override css = /* css */ `
[data-ui="sp"] {
  position: relative;
  isolation: isolate;
  box-sizing: border-box;
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="sp"][data-side="left"] { flex-direction: row-reverse; }
[data-ui="sp"] *, [data-ui="sp"] *::before, [data-ui="sp"] *::after { box-sizing: border-box; }
[data-ui="sp"] [hidden] { display: none !important; }
.ui-sp__sr { position: absolute; width: 1px; height: 1px; margin: 0; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

/* The host page: the element's own children */
[data-ui="sp"] > :not(.ui-sp__handle, .ui-sp__scrim, .ui-sp__pane, .ui-sp__launcher) { flex: 1 1 auto; min-width: 0; overflow: auto; }

/* The pane, docked */
.ui-sp__pane {
  flex: none;
  display: flex;
  flex-direction: column;
  width: min(var(--sp-w), calc(100% - var(--sp-page-min)));
  min-width: 0;
  height: 100%;
  overflow: hidden;
  transition: width var(--tc-duration-slow) var(--tc-ease-move);
}
.ui-sp__pane[data-rail] { width: var(--sp-w); }
[data-ui="sp"][data-resizing] .ui-sp__pane { transition: none; }
[data-ui="sp"][data-resizing] { cursor: col-resize; user-select: none; }
.ui-sp__frame { display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; }

/* Standard: the header on the gray tray, the conversation and composer on the white card */
[data-ui="sp"][data-look="standard"] .ui-sp__pane { background: var(--tc-surface-tray); padding: var(--tc-tray-inset); }
[data-ui="sp"][data-look="standard"] .ui-sp__body { background: var(--tc-surface-raised); border-radius: var(--tc-card-radius); box-shadow: var(--tc-card-shadow); }
[data-ui="sp"][data-look="standard"][data-side="right"]:not([data-overlay]) .ui-sp__pane { border-left: var(--tc-hairline) solid var(--tc-border-subtle); }
[data-ui="sp"][data-look="standard"][data-side="left"]:not([data-overlay]) .ui-sp__pane { border-right: var(--tc-hairline) solid var(--tc-border-subtle); }
/* Clean: one white surface – the header is its first row, a hairline from the page */
[data-ui="sp"][data-look="clean"] .ui-sp__pane { background: var(--tc-surface-raised); }
[data-ui="sp"][data-look="clean"][data-side="right"]:not([data-overlay]) .ui-sp__pane { box-shadow: calc(var(--tc-hairline) * -1) 0 0 var(--tc-border-default); }
[data-ui="sp"][data-look="clean"][data-side="left"]:not([data-overlay]) .ui-sp__pane { box-shadow: var(--tc-hairline) 0 0 var(--tc-border-default); }
[data-ui="sp"][data-look="clean"] .ui-sp__frame > .tc-head { border-bottom: var(--tc-hairline) solid var(--tc-border-subtle); }

/* The tools stay on the title's row, however narrow: the title gives way */
.ui-sp__frame > .tc-head { flex: none; flex-wrap: nowrap; }
.ui-sp__frame > .tc-head .tc-head__main { flex: 1 1 0; min-width: 0; }
.ui-sp__frame > .tc-head .tc-head__sub { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-sp__tools { flex: none; display: flex; align-items: center; gap: var(--tc-space-0-5); margin-left: auto; }

.ui-sp__body { position: relative; display: flex; flex-direction: column; flex: 1 1 auto; min-height: 0; overflow: hidden; }

/* The conversation */
.ui-sp__thread { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-gutter: stable; }
.ui-sp__inner { display: flex; flex-direction: column; gap: var(--tc-space-4); padding: var(--tc-space-4) var(--tc-space-3); }
.ui-sp__msg { display: flex; flex-direction: column; gap: var(--tc-space-2); min-width: 0; }
.ui-sp__msg--user { align-items: flex-end; }
.ui-sp__bubble {
  max-width: 88%;
  margin: 0;
  padding: var(--tc-space-2) var(--tc-space-3);
  border-radius: var(--tc-radius-xl);
  background: var(--tc-surface-sunken);
  color: var(--tc-text-primary);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
.ui-sp__attached { display: inline-flex; align-items: center; gap: var(--tc-space-1); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-sp__attached svg { width: 12px; height: 12px; }
.ui-sp__gate { min-width: 0; }
.ui-sp__error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2);
  padding: var(--tc-space-2) var(--tc-space-3);
  border-radius: var(--tc-radius-lg);
  box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-danger-border);
  color: var(--tc-text-primary);
  font-size: var(--tc-font-size-md);
}

/* Before the first message */
.ui-sp__empty { display: flex; flex-direction: column; gap: var(--tc-space-1); padding-top: var(--tc-space-2); }
.ui-sp__hello { margin: 0; color: var(--tc-title-color); font-size: var(--tc-title-font-size); font-weight: var(--tc-title-font-weight); line-height: var(--tc-title-line-height); letter-spacing: var(--tc-title-tracking); }
.ui-sp__hint { margin: 0 0 var(--tc-space-3); color: var(--tc-subtitle-color); font-size: var(--tc-subtitle-font-size); line-height: var(--tc-subtitle-line-height); }

/* History, in place of the conversation */
.ui-sp__history { display: flex; flex-direction: column; align-items: flex-start; gap: var(--tc-space-2); flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-3); }
.ui-sp__history > tc-chat-history { align-self: stretch; }

.ui-sp__composer { flex: none; padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2-5); }
[data-ui="sp"][data-look="clean"] .ui-sp__composer { padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-3); }

/* The rail */
.ui-sp__rail { display: flex; flex-direction: column; align-items: center; gap: var(--tc-space-1); flex: 1 1 auto; padding-top: var(--tc-space-2); }
.ui-sp__rail-mark { display: grid; place-items: center; width: var(--tc-head-icon-size); height: var(--tc-head-icon-size); margin-top: auto; margin-bottom: var(--tc-space-2); border-radius: var(--tc-head-icon-radius); background: var(--tc-head-icon-bg); box-shadow: var(--tc-head-icon-shadow); color: var(--tc-head-icon-fg); }
.ui-sp__rail-mark svg { width: var(--tc-head-glyph); height: var(--tc-head-glyph); }

/* The edge: a wide grab area with a line that shows on hover, focus and drag */
.ui-sp__handle {
  flex: none;
  position: relative;
  z-index: 2;
  width: var(--tc-space-2);
  margin-inline: calc(var(--tc-space-1) * -1);
  cursor: col-resize;
  touch-action: none;
  outline: none;
}
.ui-sp__handle::after {
  content: "";
  position: absolute;
  inset-block: 0;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  background: transparent;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-sp__handle:hover::after, [data-ui="sp"][data-resizing] .ui-sp__handle::after { background: var(--tc-border-strong); }
.ui-sp__handle:focus-visible::after { width: 3px; background: var(--tc-accent); }

/* Below the breakpoint: a sheet over the page */
[data-ui="sp"][data-overlay] .ui-sp__pane {
  position: absolute;
  inset-block: 0;
  right: 0;
  z-index: var(--tc-z-drawer);
  width: min(var(--sp-w), calc(100% - var(--tc-space-10)));
  box-shadow: var(--tc-shadow-overlay);
  animation: ui-sp-in var(--tc-duration-moderate) var(--tc-ease-emphasized);
}
[data-ui="sp"][data-overlay][data-side="left"] .ui-sp__pane { right: auto; left: 0; animation-name: ui-sp-in-left; }
@container (max-width: 480px) { [data-ui="sp"][data-overlay] .ui-sp__pane { width: 100%; } }
.ui-sp__scrim { position: absolute; inset: 0; z-index: var(--tc-z-drawer-scrim); background: var(--tc-scrim); animation: ui-sp-fade var(--tc-duration-moderate) var(--tc-ease-standard); }
@keyframes ui-sp-in { from { transform: translateX(100%); } }
@keyframes ui-sp-in-left { from { transform: translateX(-100%); } }
@keyframes ui-sp-fade { from { opacity: 0; } }

/* Closed: a floating launcher */
.ui-sp__launcher {
  position: absolute;
  bottom: var(--tc-space-4);
  right: var(--tc-space-4);
  z-index: var(--tc-z-sticky);
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2);
  height: var(--tc-control-h-md);
  margin: 0;
  padding: 0 var(--tc-control-px-md);
  border: 0;
  border-radius: var(--tc-radius-full);
  background: var(--tc-action-primary-bg);
  box-shadow: var(--tc-action-primary-shadow), var(--tc-shadow-overlay);
  color: var(--tc-action-primary-fg);
  font: inherit;
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  cursor: pointer;
}
[data-ui="sp"][data-side="left"] .ui-sp__launcher { right: auto; left: var(--tc-space-4); }
.ui-sp__launcher:hover { background: var(--tc-action-primary-bg-hover); }
.ui-sp__launcher:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-sp__launcher svg { width: 16px; height: 16px; }
.ui-sp__launcher kbd { font: inherit; font-size: var(--tc-font-size-xs); opacity: 0.7; }

@media (prefers-reduced-motion: reduce) {
  .ui-sp__pane, .ui-sp__handle::after { transition: none; }
  [data-ui="sp"][data-overlay] .ui-sp__pane, .ui-sp__scrim { animation: none; }
}
@media (forced-colors: active) {
  .ui-sp__pane { border-inline: 1px solid CanvasText; }
  .ui-sp__handle::after { background: CanvasText; }
  .ui-sp__bubble { border: 1px solid CanvasText; }
}
`;
}

if (!customElements.get("tc-ai-side-pane")) customElements.define("tc-ai-side-pane", TcAiSidePane);
declare global {
  interface HTMLElementTagNameMap {
    "tc-ai-side-pane": TcAiSidePane;
  }
}
