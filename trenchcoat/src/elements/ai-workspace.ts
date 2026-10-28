import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import type { Look } from "./internal/look";
import { safeMediaUrl } from "./internal/safe-media";
import { copyText } from "./internal/util";
import "./button";
import "./chat-composer";

/*
 * <tc-ai-workspace> – the Lit port of blocks/ai-workspace.tsx: a complete assistant app – sidebar, new-chat welcome,
 * conversations that stream in, and a projects overview, built on <tc-chat-composer>. Search chats, pin and rename
 * projects, create new ones, collapse the sidebar. Set `respond` to your model call.
 * Standard: the sidebar on a gray frame, the main panel a white card on it. Clean: the same frame, quieter – hairline
 * shadows and the Clean controls.
 *
 *   <tc-ai-workspace user-name="Lena" .respond=${(message, history) => callModel(message, history)}></tc-ai-workspace>
 *
 * Keyboard: menus follow the menu pattern (focus moves in, arrows / Home / End, Esc and choosing return to the trigger,
 * Tab closes); the dialog keeps focus inside and gives it back to the button that opened it. When a control goes away
 * (sidebar toggles, the welcome screen, a closing menu) focus moves to its stable counterpart, never <body>.
 */

export type AiWorkspaceMessage = { id: string; role: "user" | "assistant"; text: string };
export type AiWorkspaceConversation = { id: string; title: string; messages: AiWorkspaceMessage[] };
export type AiWorkspaceProject = { id: string; name: string; description: string; updatedDaysAgo: number; pinned?: boolean };
/** Your model call – resolve with the full answer; it streams in word by word. A rejection shows an error with Try again */
export type AiWorkspaceRespond = (message: string, history: AiWorkspaceMessage[]) => Promise<string>;

/** tc-conversations-change: the whole list after a message is sent or answered, or a chat is deleted */
export type AiWorkspaceConversationsChange = { conversations: AiWorkspaceConversation[] };
/** tc-projects-change: the whole list after a project is created, renamed, pinned or unpinned */
export type AiWorkspaceProjectsChange = { projects: AiWorkspaceProject[] };
/** tc-share-chat: Share chat was picked in the More menu (the open conversation, if any) */
export type AiWorkspaceShare = { conversation: AiWorkspaceConversation | null };

type View = { kind: "welcome" } | { kind: "chat"; id: string } | { kind: "projects" };

let seq = 0;
const nextId = (p: string) => `${p}-${(++seq).toString(36)}`;

/** Demo answers – swap for a real model via `respond` */
export async function aiWorkspaceDemoRespond(message: string) {
  const m = message.toLowerCase();
  await new Promise((r) => setTimeout(r, 900));
  if (/email|mail|announce/.test(m))
    return "Here's a short draft:\n\nSubject: Pricing is live\n\nHi everyone – our new plans are out today. Individual stays at $199 once, and teams now pay per seat. Existing customers keep their price. Reply here with any questions.";
  if (/summar|notes|interview/.test(m))
    return "Three themes stood out:\n\n1. People compare plans in a table before they read anything else.\n2. Seat pricing feels fair once the per-seat price is visible.\n3. Two interviewees asked for an annual invoice for their finance team.";
  if (/price|pricing|tier/.test(m))
    return "Keep three tiers. Free for discovery, Individual as a one-time purchase, Team priced per seat. Show the per-seat price right under the total – that's what people check first.";
  return "Good question. I'd start by writing down the outcome you want, then list the two or three steps that get you there. Want me to turn this into a checklist?";
}

/** The sample conversations shown when `conversations` isn't set */
export const defaultAiWorkspaceConversations: AiWorkspaceConversation[] = [
  {
    id: "c1",
    title: "Summarize interview notes",
    messages: [
      { id: "m1", role: "user", text: "Summarize the notes from this week's customer interviews." },
      {
        id: "m2",
        role: "assistant",
        text: "Three themes stood out:\n\n1. People compare plans in a table before they read anything else.\n2. Seat pricing feels fair once the per-seat price is visible.\n3. Two interviewees asked for an annual invoice for their finance team.",
      },
    ],
  },
  {
    id: "c2",
    title: "Draft launch email",
    messages: [
      { id: "m3", role: "user", text: "Draft a launch email for the new pricing." },
      { id: "m4", role: "assistant", text: "Subject: Pricing is live\n\nHi everyone – our new plans are out today. Existing customers keep their price." },
    ],
  },
  {
    id: "c3",
    title: "Rewrite onboarding copy",
    messages: [
      { id: "m5", role: "user", text: "Make the onboarding copy shorter." },
      { id: "m6", role: "assistant", text: "Here's a tighter version: “Create your first project – it takes a minute.”" },
    ],
  },
  {
    id: "c4",
    title: "Plan sprint goals",
    messages: [
      { id: "m7", role: "user", text: "Help me plan goals for the next sprint." },
      { id: "m8", role: "assistant", text: "Pick one outcome per team and two stretch goals. Want a template?" },
    ],
  },
];

/** The sample projects shown when `projects` isn't set */
export const defaultAiWorkspaceProjects: AiWorkspaceProject[] = [
  { id: "p1", name: "Brand Refresh", description: "Logo, colors and type for the new identity", updatedDaysAgo: 2 },
  { id: "p2", name: "Customer Research", description: "Interview notes and survey results", updatedDaysAgo: 5 },
  { id: "p3", name: "Pricing Page", description: "Plans, copy and the comparison table", updatedDaysAgo: 7 },
  { id: "p4", name: "Mobile App", description: "Navigation patterns and offline mode", updatedDaysAgo: 10 },
  { id: "p5", name: "Help Center", description: "Guides, FAQs and release notes", updatedDaysAgo: 12 },
  { id: "p6", name: "Q4 Planning", description: "Goals, budgets and the launch calendar", updatedDaysAgo: 14 },
];

const defaultPinned = ["Writing assistant", "Data analyst", "Knowledge base"];
const starters = ["Summarize my interview notes", "Draft the pricing announcement email", "Compare our pricing tiers"];
const reduced = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* One consistent set on the usual 24px grid, 1.75 stroke – shapes after Lucide (ISC) */
const paths = {
  plus: svg`<path d="M12 5v14" /><path d="M5 12h14" />`,
  search: svg`<path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" /><path d="m20 20-4-4" />`,
  chevronLeft: svg`<path d="m15 18-6-6 6-6" />`,
  chevronDown: svg`<path d="m6 9 6 6 6-6" />`,
  check: svg`<path d="M20 6 9 17l-5-5" />`,
  panel: svg`<path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M9 3v18" />`,
  folder: svg`<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />`,
  pin: svg`<path d="M12 17v5" /><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1Z" />`,
  pencil: svg`<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5Z" /><path d="m15 5 4 4" />`,
  settings: svg`<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" /><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />`,
  moreH: svg`<path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" /><path d="M19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" /><path d="M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />`,
  moreV: svg`<path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" /><path d="M12 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" /><path d="M12 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />`,
  copy: svg`<path d="M10 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />`,
  retry: svg`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />`,
};
const icon = (name: keyof typeof paths, size = 16, slot?: string) =>
  html`<svg class="ui-aw__icon" slot=${ifDefined(slot)} viewBox="0 0 24 24" width=${size} height=${size} aria-hidden="true">${paths[name]}</svg>`;

/**
 * A complete assistant app – sidebar, welcome, streaming chat and projects, built on the Chat Composer.
 * @tag tc-ai-workspace
 * @fires tc-conversations-change - The conversations changed – a message sent or answered, a chat deleted (`AiWorkspaceConversationsChange`: `{ conversations }`); cancelable – prevented, `conversations` stays (controlled use)
 * @fires tc-projects-change - The projects changed – created, renamed, pinned or unpinned (`AiWorkspaceProjectsChange`: `{ projects }`); cancelable – prevented, `projects` stays (controlled use)
 * @fires tc-share-chat - Share chat was picked in the More menu (`AiWorkspaceShare`: `{ conversation }`)
 */
export class TcAiWorkspace extends TcElement {
  static override ui = "aw";

  /** The signed-in person's name – the welcome greets them */
  @property({ attribute: "user-name" }) accessor userName = "Lena";
  /** Their avatar's URL; their initial shows without one */
  @property({ attribute: "user-avatar" }) accessor userAvatar = "";
  /** The workspace's initial in the top-left tile */
  @property() accessor workspace = "N";
  /** Pinned items listed in the sidebar, above the pinned projects */
  @property({ attribute: false }) accessor pinned: string[] = defaultPinned;
  /** The conversations, newest first */
  @property({ attribute: false }) accessor conversations: AiWorkspaceConversation[] = defaultAiWorkspaceConversations;
  /** The projects */
  @property({ attribute: false }) accessor projects: AiWorkspaceProject[] = defaultAiWorkspaceProjects;
  /** Your model call – resolve with the full answer; a rejection shows an error with Try again. The demo answers without it */
  @property({ attribute: false }) accessor respond: AiWorkspaceRespond | undefined = undefined;

  @state() private accessor view: View = { kind: "welcome" };
  @state() private accessor collapsed = false;
  @state() private accessor search = "";
  /** The conversation that is answering */
  @state() private accessor busy: string | null = null;
  @state() private accessor failed: { chat: string; message: string; error: string } | null = null;
  @state() private accessor streaming: { chat: string; msg: string } | null = null;
  /** The open menu: "project", "more", "sort" or a project id */
  @state() private accessor menu: string | null = null;
  @state() private accessor modal = false;
  @state() private accessor current = "";
  @state() private accessor announcement = "";
  @state() private accessor renaming: string | null = null;
  @state() private accessor projectQuery = "";
  @state() private accessor sort: "recent" | "name" = "recent";
  @state() private accessor projectName = "";
  @state() private accessor copied: string | null = null;

  private readonly uid = nextId("ui-aw");
  /** Where focus goes after the next render – a selector inside the element */
  private focusNext: string | null = null;
  private shownMenu: string | null = null;
  private wasModal = false;
  /** The control that opened the dialog, to give focus back to */
  private opener: HTMLElement | null = null;
  private projectCount = -1;
  private typing = 0;
  private copyTimer = 0;

  private readonly away = (e: PointerEvent) => {
    if (!(e.target as HTMLElement).closest?.("[data-popover]")) this.menu = null;
  };
  private readonly esc = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    this.menu = null;
    this.modal = false;
  };

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.stopTyping();
    window.clearTimeout(this.copyTimer);
    window.removeEventListener("pointerdown", this.away);
    window.removeEventListener("keydown", this.esc);
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // A framework that drops a prop sets it to undefined: fall back to the default
    this.userName ??= "Lena";
    this.userAvatar ??= "";
    this.workspace ??= "N";
    this.pinned ??= defaultPinned;
    this.conversations ??= defaultAiWorkspaceConversations;
    this.projects ??= defaultAiWorkspaceProjects;
    this.toggleAttribute("data-collapsed", this.collapsed);
    // A new project goes to the top, so show recent first again
    if (changed.has("projects")) {
      if (this.projectCount >= 0 && this.projects.length > this.projectCount) this.sort = "recent";
      this.projectCount = this.projects.length;
    }
  }

  protected override firstUpdated() {
    // On narrow screens the sidebar is an overlay – start with it closed
    if ((this.offsetWidth || 1000) <= 720) this.collapsed = true;
  }

  private get chat() {
    const v = this.view;
    return v.kind === "chat" ? this.conversations.find((c) => c.id === v.id) : undefined;
  }

  /** Reports the next conversations; kept here unless the page prevents it (it then passes them back) */
  private setChats(change: (list: AiWorkspaceConversation[]) => AiWorkspaceConversation[]) {
    const next = change(this.conversations);
    if (this.emit<AiWorkspaceConversationsChange>("tc-conversations-change", { conversations: next }, { cancelable: true })) this.conversations = next;
  }
  private setProjects(change: (list: AiWorkspaceProject[]) => AiWorkspaceProject[]) {
    const next = change(this.projects);
    if (this.emit<AiWorkspaceProjectsChange>("tc-projects-change", { projects: next }, { cancelable: true })) this.projects = next;
  }

  private toggleSidebar(next: boolean) {
    this.focusNext = next ? "[data-sidebar-open]" : "[data-sidebar-collapse]";
    this.collapsed = next;
  }

  /** Sends a message: a new conversation from the welcome screen, else a reply in the open one */
  async send(text: string) {
    const message = text.trim();
    if (!message || this.busy) return;
    // Sent from the welcome screen or the error's Try again – both go away, so focus moves to the reply box
    if ((document.activeElement as HTMLElement | null)?.closest?.(".ui-aw__welcome, .ui-aw__failed")) this.focusNext = ".ui-aw__composer--dock textarea";
    const open = this.chat;
    let chatId = open?.id;
    const userMsg: AiWorkspaceMessage = { id: nextId("m"), role: "user", text: message };
    if (!chatId) {
      const id = nextId("c");
      chatId = id;
      const title = message.length > 38 ? `${message.slice(0, 36)}…` : message;
      this.setChats((list) => [{ id, title, messages: [userMsg] }, ...list]);
      this.view = { kind: "chat", id };
    } else {
      const id = chatId;
      this.setChats((list) => list.map((c) => (c.id === id ? { ...c, messages: [...c.messages, userMsg] } : c)));
    }
    this.failed = null;
    this.busy = chatId;
    this.announcement = "Thinking…";
    const history = [...(open?.messages ?? []), userMsg];
    let answer: string;
    try {
      answer = await (this.respond ? this.respond(message, history) : aiWorkspaceDemoRespond(message));
    } catch (error) {
      if (!this.isConnected) return;
      this.busy = null;
      this.announcement = "";
      this.failed = { chat: chatId, message, error: error instanceof Error && error.message ? error.message : "Something went wrong." };
      return;
    }
    if (!this.isConnected) return;
    const msgId = nextId("m");
    const id = chatId;
    this.setChats((list) => list.map((c) => (c.id === id ? { ...c, messages: [...c.messages, { id: msgId, role: "assistant", text: answer }] } : c)));
    this.busy = null;
    this.announcement = answer;
    // The answer types itself in, a few words at a time (written straight into its text, without a render per step)
    this.streaming = { chat: id, msg: msgId };
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("menu") || changed.has("modal")) {
      const listen = Boolean(this.menu || this.modal);
      if (listen) {
        window.addEventListener("pointerdown", this.away);
        window.addEventListener("keydown", this.esc);
      } else {
        window.removeEventListener("pointerdown", this.away);
        window.removeEventListener("keydown", this.esc);
      }
    }
    // A menu that opened takes focus (the checked item, else the first); one that closed with focus inside gives it
    // back to its trigger
    if (this.menu !== this.shownMenu) {
      if (this.menu) {
        const m = this.querySelector(".ui-aw__menu");
        (m?.querySelector<HTMLElement>("[aria-checked='true']") ?? this.menuItems(m)[0])?.focus({ preventScroll: true });
      }
      this.shownMenu = this.menu;
    }
    if (this.modal !== this.wasModal) {
      this.wasModal = this.modal;
      const dialog = this.querySelector<HTMLElement>(".ui-aw__dialog");
      if (this.modal) {
        this.opener = document.activeElement as HTMLElement | null;
        this.querySelector<HTMLInputElement>(".ui-aw__field")?.focus({ preventScroll: true });
      } else {
        const back = this.opener;
        this.opener = null;
        const active = document.activeElement;
        if (back?.isConnected && (!active || active === document.body || dialog?.contains(active))) back.focus({ preventScroll: true });
      }
    }
    if (changed.has("renaming") && this.renaming) this.querySelector<HTMLInputElement>(".ui-aw__rename")?.focus();
    if (changed.has("streaming") && this.streaming) this.startTyping(this.streaming.msg);
    if (changed.has("view") || changed.has("conversations") || changed.has("busy") || changed.has("failed")) this.follow(true);
    const target = this.focusNext;
    if (target) {
      this.focusNext = null;
      void this.focusWhenRendered(target);
    }
  }

  /** Focuses a control that may sit inside an element rendered in this update (a tc-button, the composer's box) */
  private async focusWhenRendered(selector: string) {
    for (let i = 0; i < 3; i++) {
      const pending = [...this.querySelectorAll("*")].filter((e) => "updateComplete" in e) as unknown as { updateComplete: Promise<unknown> }[];
      await Promise.all(pending.map((e) => e.updateComplete));
    }
    if (this.isConnected) this.focusIn(this.querySelector(selector));
  }

  /** Follow the conversation while it grows */
  private follow(smooth: boolean) {
    const box = this.querySelector<HTMLElement>(".ui-aw__messages");
    box?.scrollTo?.({ top: box.scrollHeight, behavior: smooth && !reduced() ? "smooth" : "auto" });
  }

  /** Types the answer into its paragraph's text, three words every 40 ms; reduced motion shows it at once */
  private startTyping(msg: string) {
    this.stopTyping();
    const p = this.querySelector(`[data-msg="${CSS.escape(msg)}"] .ui-aw__ai-body p`);
    const node = [...(p?.childNodes ?? [])].find((n) => n.nodeType === Node.TEXT_NODE && n.nodeValue);
    const text = node?.nodeValue ?? "";
    if (!node || reduced()) {
      this.streaming = null;
      return;
    }
    const words = text.split(/(\s+)/);
    let shown = 0;
    node.nodeValue = "";
    this.typing = window.setInterval(() => {
      shown += 3;
      node.nodeValue = words.slice(0, shown).join("");
      this.follow(false);
      if (shown >= words.length) {
        this.stopTyping();
        this.streaming = null;
      }
    }, 40);
    this.stopText = () => (node.nodeValue = text);
  }
  private stopText: (() => void) | null = null;
  private stopTyping() {
    window.clearInterval(this.typing);
    this.typing = 0;
    this.stopText?.();
    this.stopText = null;
  }

  private menuItems(menu: Element | null) {
    return [...(menu?.querySelectorAll<HTMLElement>("[role^='menuitem']:not(:disabled)") ?? [])];
  }
  /** Closes the open menu; focus inside it goes back to its trigger (the [aria-haspopup] button beside it) */
  private closeMenu() {
    const m = this.querySelector(".ui-aw__menu");
    if (m?.contains(document.activeElement)) {
      const trigger = m.parentElement?.querySelector<HTMLElement>("[aria-haspopup]");
      this.focusIn(trigger);
    }
    this.menu = null;
  }
  private focusIn(el: Element | null | undefined) {
    const target = el?.matches("tc-button") ? el.querySelector("button") : el;
    (target as HTMLElement | null | undefined)?.focus({ preventScroll: true });
  }
  private menuKeys(e: KeyboardEvent) {
    const list = this.menuItems(e.currentTarget as Element);
    const at = list.indexOf(document.activeElement as HTMLElement);
    const go = (i: number) => {
      e.preventDefault();
      list[(i + list.length) % list.length]?.focus();
    };
    if (e.key === "ArrowDown") go(at + 1);
    else if (e.key === "ArrowUp") go(at - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(list.length - 1);
    else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.closeMenu();
    } else if (e.key === "Tab") this.closeMenu();
  }
  private renderMenu(label: string, right: boolean, items: unknown) {
    return html`<div class=${right ? "ui-aw__menu ui-aw__menu--right" : "ui-aw__menu"} role="menu" aria-label=${label} @keydown=${(e: KeyboardEvent) => this.menuKeys(e)}>${items}</div>`;
  }

  /* ---------- Render ---------- */

  protected override render() {
    const look = this.resolvedLook;
    const q = this.search.trim().toLowerCase();
    const recents = this.conversations.filter((c) => !q || c.title.toLowerCase().includes(q));
    const pinned = [...this.pinned, ...this.projects.filter((p) => p.pinned).map((p) => p.name)].filter((p) => !q || p.toLowerCase().includes(q));
    // The picked project – the first one when the picked one is gone
    const project = this.projects.find((p) => p.id === this.current) ?? this.projects[0];
    const chat = this.chat;
    const crumb = this.view.kind === "projects" ? "All projects" : (chat?.title ?? "New chat");
    return html`
      ${this.renderSidebar(look, pinned, recents)}
      <main class="ui-aw__main">
        <header class="ui-aw__bar">
          ${this.collapsed
            ? html`<tc-button look=${look} variant="ghost" size="sm" data-sidebar-open label="Open sidebar" hide-label @click=${() => this.toggleSidebar(false)}
                >${icon("panel", 16, "icon")}</tc-button
              >`
            : nothing}
          <div class="ui-aw__crumbs" data-popover>
            <button
              type="button"
              class="ui-aw__crumb-btn"
              aria-haspopup="menu"
              aria-expanded=${this.menu === "project" ? "true" : "false"}
              @click=${() => (this.menu = this.menu === "project" ? null : "project")}
            >
              <span class="ui-aw__muted">${project?.name ?? "Workspace"}</span>
              <span class="ui-aw__slash">/</span>
              <span class="ui-aw__ellipsis">${crumb}</span>
              ${icon("chevronDown", 14)}
            </button>
            ${this.menu === "project"
              ? this.renderMenu(
                  "Switch project",
                  false,
                  html`<p class="ui-aw__menu-title" aria-hidden="true">Switch project</p>
                    ${this.projects.slice(0, 6).map(
                      (p) => html`<button
                        type="button"
                        role="menuitemradio"
                        aria-checked=${p.id === project?.id ? "true" : "false"}
                        class="ui-aw__menu-item"
                        @click=${() => {
                          this.current = p.id;
                          this.closeMenu();
                        }}
                      >
                        ${p.name}${p.id === project?.id ? icon("check", 14) : nothing}
                      </button>`,
                    )}`,
                )
              : nothing}
          </div>
          <div class="ui-aw__more" data-popover>
            <tc-button
              look=${look}
              variant="ghost"
              size="sm"
              label="More"
              hide-label
              aria-haspopup="menu"
              aria-expanded=${this.menu === "more" ? "true" : "false"}
              @click=${() => (this.menu = this.menu === "more" ? null : "more")}
              >${icon("moreH", 16, "icon")}</tc-button
            >
            ${this.menu === "more"
              ? this.renderMenu(
                  "More",
                  true,
                  html`<button
                      type="button"
                      role="menuitem"
                      class="ui-aw__menu-item"
                      @click=${() => {
                        this.emit<AiWorkspaceShare>("tc-share-chat", { conversation: chat ?? null });
                        this.closeMenu();
                      }}
                    >
                      Share chat
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      class="ui-aw__menu-item ui-aw__danger"
                      ?disabled=${!chat}
                      @click=${() => {
                        if (chat) this.setChats((list) => list.filter((c) => c.id !== chat.id));
                        this.view = { kind: "welcome" };
                        this.closeMenu();
                      }}
                    >
                      Delete chat
                    </button>`,
                )
              : nothing}
          </div>
        </header>
        ${this.view.kind === "welcome" ? keyed("welcome", this.renderWelcome(look)) : nothing}
        ${chat ? keyed(chat.id, this.renderChat(chat, look)) : nothing}
        ${this.view.kind === "projects" ? this.renderProjects(look) : nothing}
        <p class="tc-sr-only" role="status">${this.announcement}</p>
        ${this.renderDialog(look)}
      </main>
    `;
  }

  /** The sidebar: search, New chat and Projects, pinned items, recent chats and the signed-in person */
  private renderSidebar(look: Look, pinned: string[], recents: AiWorkspaceConversation[]) {
    const v = this.view;
    const avatar = safeMediaUrl(this.userAvatar);
    return html`<aside class="ui-aw__side" aria-label="Workspace" .inert=${this.collapsed}>
      <div class="ui-aw__side-head">
        <span class="ui-aw__ws">${this.workspace}</span>
        <tc-button look=${look} variant="ghost" size="sm" data-sidebar-collapse label="Collapse sidebar" hide-label @click=${() => this.toggleSidebar(true)}
          >${icon("chevronLeft", 16, "icon")}</tc-button
        >
      </div>
      <label class="ui-aw__search">
        ${icon("search", 15)}
        <input type="search" .value=${live(this.search)} @input=${(e: Event) => (this.search = (e.target as HTMLInputElement).value)} placeholder="Search chats…" aria-label="Search chats" />
      </label>
      <nav class="ui-aw__nav">
        <button type="button" class="ui-aw__item" aria-current=${ifDefined(v.kind === "welcome" ? "true" : undefined)} @click=${() => (this.view = { kind: "welcome" })}>
          ${icon("plus")}New chat
        </button>
        <button type="button" class="ui-aw__item" aria-current=${ifDefined(v.kind === "projects" ? "true" : undefined)} @click=${() => (this.view = { kind: "projects" })}>
          ${icon("folder")}Projects
        </button>
      </nav>
      ${pinned.length
        ? html`<p class="ui-aw__group">Pinned</p>
            <div class="ui-aw__nav">
              ${pinned.map(
                (p) => html`<button type="button" class="ui-aw__item" @click=${() => (this.view = { kind: "welcome" })}>${icon("pin", 15)}<span class="ui-aw__ellipsis">${p}</span></button>`,
              )}
            </div>`
        : nothing}
      <p class="ui-aw__group">Recents</p>
      <div class="ui-aw__nav ui-aw__recents">
        ${recents.length ? nothing : html`<p class="ui-aw__none">No chats match.</p>`}
        ${repeat(
          recents,
          (c) => c.id,
          (c) => html`<button
            type="button"
            class="ui-aw__item ui-aw__item--plain"
            aria-current=${ifDefined(v.kind === "chat" && v.id === c.id ? "true" : undefined)}
            @click=${() => (this.view = { kind: "chat", id: c.id })}
          >
            <span class="ui-aw__ellipsis">${c.title}</span>
          </button>`,
        )}
      </div>
      <div class="ui-aw__user">
        ${avatar ? html`<img src=${avatar} alt="" width="24" height="24" />` : html`<span class="ui-aw__user-dot" aria-hidden="true">${this.userName.charAt(0)}</span>`}
        <span>${this.userName}</span>
        <tc-button look=${look} variant="ghost" size="sm" label="Settings" hide-label>${icon("settings", 16, "icon")}</tc-button>
      </div>
    </aside>`;
  }

  private renderWelcome(look: Look) {
    return html`<section class="ui-aw__welcome">
      <h2 class="ui-aw__hello">Hello ${this.userName}</h2>
      <p class="ui-aw__sub">What can I help you with today?</p>
      <div class="ui-aw__composer">
        <tc-chat-composer look=${look} placeholder="How can I help you today?" .onSend=${(text: string) => this.send(text)}></tc-chat-composer>
      </div>
      <div class="ui-aw__starters">
        ${starters.map((s) => html`<button type="button" class="ui-aw__starter" @click=${() => this.send(s)}>${s}</button>`)}
      </div>
      <p class="ui-aw__disclaimer">AI can make mistakes – please double-check important answers.</p>
    </section>`;
  }

  private renderChat(chat: AiWorkspaceConversation, look: Look) {
    const lastAsk = () => chat.messages.filter((x) => x.role === "user").at(-1)?.text ?? "";
    return html`<section class="ui-aw__chat">
      <div class="ui-aw__messages">
        ${repeat(
          chat.messages,
          (m) => m.id,
          (m) =>
            m.role === "user"
              ? html`<div class="ui-aw__msg ui-aw__msg--user" data-msg=${m.id}><p>${m.text}</p></div>`
              : html`<div class="ui-aw__msg ui-aw__msg--ai" data-msg=${m.id}>
                  <span class="ui-aw__mark" aria-hidden="true"></span>
                  <div class="ui-aw__ai-body">
                    <p>${m.text}</p>
                    ${this.streaming?.msg === m.id
                      ? nothing
                      : html`<div class="ui-aw__actions">
                          <tc-button
                            look=${look}
                            variant="ghost"
                            size="sm"
                            label="Copy answer"
                            hide-label
                            @click=${async () => {
                              if (!(await copyText(m.text)) || !this.isConnected) return;
                              this.copied = m.id;
                              window.clearTimeout(this.copyTimer);
                              this.copyTimer = window.setTimeout(() => (this.copied = null), 1400);
                            }}
                            >${icon(this.copied === m.id ? "check" : "copy", 15, "icon")}</tc-button
                          >
                          <tc-button look=${look} variant="ghost" size="sm" label="Ask again" hide-label @click=${() => this.send(lastAsk())}>${icon("retry", 15, "icon")}</tc-button>
                          <span class="tc-sr-only" role="status">${this.copied === m.id ? "Copied" : ""}</span>
                        </div>`}
                  </div>
                </div>`,
        )}
        ${this.busy === chat.id
          ? html`<div class="ui-aw__msg ui-aw__msg--ai">
              <span class="ui-aw__mark ui-aw__mark--busy" aria-hidden="true"></span>
              <p class="ui-aw__thinking">Thinking…</p>
            </div>`
          : nothing}
        ${this.failed?.chat === chat.id
          ? html`<div class="ui-aw__msg ui-aw__msg--ai ui-aw__failed" role="alert">
              <span class="ui-aw__mark" aria-hidden="true"></span>
              <div class="ui-aw__ai-body">
                <p class="ui-aw__error">No answer – ${this.failed.error}</p>
                <div class="ui-aw__actions">
                  <tc-button look=${look} variant="secondary" size="sm" label="Try again" @click=${() => this.failed && this.send(this.failed.message)}></tc-button>
                </div>
              </div>
            </div>`
          : nothing}
      </div>
      <div class="ui-aw__composer ui-aw__composer--dock">
        <tc-chat-composer look=${look} placeholder="Reply…" .onSend=${(text: string) => this.send(text)}></tc-chat-composer>
        <p class="ui-aw__disclaimer">AI can make mistakes – please double-check important answers.</p>
      </div>
    </section>`;
  }

  /** The projects overview: search, sort, and a card per project with rename and pin */
  private renderProjects(look: Look) {
    const pq = this.projectQuery.trim().toLowerCase();
    const shown = this.projects
      .filter((p) => !pq || `${p.name} ${p.description}`.toLowerCase().includes(pq))
      .sort((a, b) => (this.sort === "name" ? a.name.localeCompare(b.name) : a.updatedDaysAgo - b.updatedDaysAgo));
    return html`<section class="ui-aw__projects">
      <div class="ui-aw__projects-head">
        <span class="ui-aw__tile">${icon("folder")}</span>
        <div>
          <h2 class="ui-aw__title">Projects</h2>
          <p class="ui-aw__sub ui-aw__sub--left">Keep chats, files and notes for each piece of work together.</p>
        </div>
        <tc-button look=${look} class="ui-aw__create" data-create-project label="Create project" @click=${() => (this.modal = true)}>${icon("plus", 14, "icon")}</tc-button>
      </div>
      <label class="ui-aw__search ui-aw__search--wide">
        ${icon("search", 15)}
        <input type="search" .value=${live(this.projectQuery)} @input=${(e: Event) => (this.projectQuery = (e.target as HTMLInputElement).value)} placeholder="Search projects…" aria-label="Search projects" />
      </label>
      <div class="ui-aw__list-head">
        <span>All projects (${shown.length})</span>
        <div class="ui-aw__sort" data-popover>
          <button type="button" class="ui-aw__sort-btn" aria-haspopup="menu" aria-expanded=${this.menu === "sort" ? "true" : "false"} @click=${() => (this.menu = this.menu === "sort" ? null : "sort")}>
            Sort by <strong>${this.sort === "recent" ? "Recent activity" : "Name"}</strong>${icon("chevronDown", 14)}
          </button>
          ${this.menu === "sort"
            ? this.renderMenu(
                "Sort by",
                true,
                (["recent", "name"] as const).map(
                  (s) => html`<button
                    type="button"
                    role="menuitemradio"
                    aria-checked=${this.sort === s ? "true" : "false"}
                    class="ui-aw__menu-item"
                    @click=${() => {
                      this.sort = s;
                      this.closeMenu();
                    }}
                  >
                    ${s === "recent" ? "Recent activity" : "Name"}${this.sort === s ? icon("check", 14) : nothing}
                  </button>`,
                ),
              )
            : nothing}
        </div>
      </div>
      <ul class="ui-aw__grid">
        ${repeat(
          shown,
          (p) => p.id,
          (p) => html`<li class="ui-aw__project">
            <div class="ui-aw__project-card">
              <div class="ui-aw__project-top">
                ${icon("folder")}
                ${this.renaming === p.id
                  ? html`<input
                      class="ui-aw__rename"
                      .value=${p.name}
                      aria-label="Project name"
                      @blur=${(e: FocusEvent) => {
                        const name = (e.target as HTMLInputElement).value.trim();
                        if (name && name !== p.name) this.setProjects((list) => list.map((x) => (x.id === p.id ? { ...x, name } : x)));
                        this.renaming = null;
                      }}
                      @keydown=${(e: KeyboardEvent) => {
                        if (e.isComposing || (e.key !== "Enter" && e.key !== "Escape")) return;
                        e.preventDefault();
                        e.stopPropagation();
                        // The field goes away – focus returns to the card's options button (Enter keeps the name, Esc drops it)
                        const input = e.currentTarget as HTMLInputElement;
                        if (e.key === "Escape") input.value = p.name;
                        this.focusIn(input.closest(".ui-aw__project")?.querySelector(".ui-aw__dots"));
                      }}
                    />`
                  : html`<span class="ui-aw__project-name">${p.name}</span>`}
                ${p.pinned ? html`<span class="ui-aw__pinned">${icon("pin", 15)}</span>` : nothing}
                <div class="ui-aw__card-menu" data-popover>
                  <tc-button
                    look=${look}
                    variant="ghost"
                    size="sm"
                    class="ui-aw__dots"
                    label=${`${p.name} options`}
                    hide-label
                    aria-haspopup="menu"
                    aria-expanded=${this.menu === p.id ? "true" : "false"}
                    @click=${() => (this.menu = this.menu === p.id ? null : p.id)}
                    >${icon("moreV", 16, "icon")}</tc-button
                  >
                  ${this.menu === p.id
                    ? this.renderMenu(
                        `${p.name} options`,
                        true,
                        html`<button
                            type="button"
                            role="menuitem"
                            class="ui-aw__menu-item"
                            @click=${() => {
                              this.menu = null;
                              this.renaming = p.id;
                            }}
                          >
                            ${icon("pencil", 14)}Rename
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            class="ui-aw__menu-item"
                            @click=${() => {
                              this.setProjects((list) => list.map((x) => (x.id === p.id ? { ...x, pinned: !x.pinned } : x)));
                              this.closeMenu();
                            }}
                          >
                            ${icon("pin", 15)}${p.pinned ? "Unpin" : "Pin"}
                          </button>`,
                      )
                    : nothing}
                </div>
              </div>
              <p class="ui-aw__project-desc">${p.description}</p>
            </div>
            <p class="ui-aw__project-foot">${p.updatedDaysAgo === 0 ? "Updated just now" : `Updated ${p.updatedDaysAgo} day${p.updatedDaysAgo === 1 ? "" : "s"} ago`}</p>
          </li>`,
        )}
      </ul>
      ${shown.length ? nothing : html`<p class="ui-aw__none ui-aw__none--center">No projects match your search.</p>`}
    </section>`;
  }

  /** The Create project dialog – it stays in the page so it can fade in and out; Tab stays inside */
  private renderDialog(look: Look) {
    const titleId = `${this.uid}-dialog`;
    const create = () => {
      const name = this.projectName.trim();
      if (!name) return;
      this.setProjects((list) => [{ id: nextId("p"), name, description: "New project – add files and chats to it", updatedDaysAgo: 0 }, ...list]);
      this.projectName = "";
      this.modal = false;
    };
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const all = [...(e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>("input, button:not(:disabled)")];
      const first = all[0];
      const last = all[all.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    return html`<div class="ui-aw__backdrop" ?data-open=${this.modal} @click=${() => (this.modal = false)} aria-hidden="true"></div>
      <div class="ui-aw__dialog" ?data-open=${this.modal} role="dialog" aria-modal="true" aria-labelledby=${titleId} .inert=${!this.modal} @keydown=${trap}>
        <div class="ui-aw__dialog-card">
          <h3 id=${titleId} class="ui-aw__dialog-title">Create project</h3>
          <input
            class="ui-aw__field"
            .value=${live(this.projectName)}
            @input=${(e: Event) => (this.projectName = (e.target as HTMLInputElement).value)}
            @keydown=${(e: KeyboardEvent) => e.key === "Enter" && !e.isComposing && create()}
            placeholder="Project name"
            aria-label="Project name"
          />
        </div>
        <div class="ui-aw__dialog-foot">
          <tc-button look=${look} variant="secondary" label="Cancel" @click=${() => (this.modal = false)}></tc-button>
          <tc-button look=${look} label="Create" ?disabled=${!this.projectName.trim()} @click=${create}></tc-button>
        </div>
      </div>`;
  }

  static override css = /* css */ `
/* Standard: the sidebar on a sunken frame, the main panel a white card on it. Clean: the same, with hairline shadows */
[data-ui="aw"] {
  --tc-aw-side: 240px;
  --tc-aw-h: 640px;
  --tc-aw-chat-w: 620px;
  --tc-aw-page-w: 640px;
  position: relative;
  isolation: isolate;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: var(--tc-aw-side) minmax(0, 1fr);
  width: 100%;
  height: var(--tc-aw-h);
  padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) 0;
  overflow: hidden;
  container-type: inline-size;
  background: var(--tc-surface-sunken);
  border-radius: var(--tc-radius-3xl);
  box-shadow: 0 0 0 var(--tc-hairline) var(--tc-border-default);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  transition: grid-template-columns var(--tc-duration-slower) var(--tc-ease-move), padding var(--tc-duration-slower) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="aw"] { background: var(--tc-surface-tray); border-radius: var(--tc-card-radius); box-shadow: var(--tc-card-shadow); }
[data-ui="aw"][data-collapsed] { grid-template-columns: 0px minmax(0, 1fr); padding-left: var(--tc-space-2); }
[data-ui="aw"] *, [data-ui="aw"] *::before, [data-ui="aw"] *::after { box-sizing: border-box; }
/* Only this element's own buttons – the Chat Composer and Button style themselves */
:where([data-ui="aw"]) :where(button[class^="ui-aw__"]) { margin: 0; font: inherit; color: inherit; cursor: pointer; }
[data-ui="aw"] button[class^="ui-aw__"]:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-ui="aw"]) :where(p, h2, h3) { margin: 0; }
.ui-aw__icon { display: block; flex: none; fill: none; stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-aw__icon { stroke-width: 1.6; }
.ui-aw__ellipsis { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; min-width: 0; }
.ui-aw__muted { color: var(--tc-text-muted); }

/* Sidebar */
.ui-aw__side { display: flex; flex-direction: column; min-width: 0; padding: var(--tc-space-1-5) var(--tc-space-2) var(--tc-space-1); overflow: hidden; transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
[data-ui="aw"][data-collapsed] .ui-aw__side { opacity: 0; }
.ui-aw__side-head { display: flex; align-items: center; justify-content: space-between; height: 40px; padding: 0 var(--tc-space-0-5) 0 var(--tc-space-1-5); }
/* The workspace tile: the primary action's flat ink */
.ui-aw__ws { display: grid; place-items: center; width: 28px; height: 28px; border-radius: var(--tc-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); color: var(--tc-action-primary-fg); }
/* Search: the field pattern on the sunken fill */
.ui-aw__search { display: flex; align-items: center; gap: var(--tc-space-2); height: var(--tc-field-h); margin: var(--tc-space-1-5) 0 var(--tc-space-2); padding: 0 var(--tc-field-px); border-radius: var(--tc-field-radius); background: var(--tc-field-bg-sunken); box-shadow: var(--tc-field-shadow); color: var(--tc-text-muted); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-aw__search:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-aw__search:focus-within { background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow-focus); }
.ui-aw__search input { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; font: inherit; font-size: var(--tc-field-font-size); color: var(--tc-text-primary); }
.ui-aw__search input::placeholder { color: var(--tc-text-placeholder); }
.ui-aw__search input::-webkit-search-cancel-button { display: none; }
.ui-aw__nav { display: grid; gap: calc(var(--tc-space-0-5) / 2); }
[data-ui="aw"] .ui-aw__item { display: flex; align-items: center; gap: var(--tc-space-2-5); height: var(--tc-menu-item-h); padding: 0 var(--tc-space-2-5); border: 0; border-radius: var(--tc-radius-md); background: transparent; font-size: var(--tc-font-size-md); text-align: left; color: var(--tc-text-secondary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-aw__item svg { color: var(--tc-text-muted); }
[data-ui="aw"] .ui-aw__item:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
[data-ui="aw"] .ui-aw__item[aria-current] { background: var(--tc-fill-default); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-aw__group { margin: var(--tc-space-4) var(--tc-space-2-5) var(--tc-space-1); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); color: var(--tc-caption-color); }
.ui-aw__recents { overflow-y: auto; min-height: 0; flex: 1; align-content: start; scrollbar-width: none; }
.ui-aw__none { margin: var(--tc-space-1) var(--tc-space-2-5); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-aw__none--center { text-align: center; margin-top: var(--tc-space-6); }
.ui-aw__user { display: flex; align-items: center; gap: var(--tc-space-2-5); height: 44px; padding: 0 var(--tc-space-0-5) 0 var(--tc-space-2); font-size: var(--tc-font-size-md); }
.ui-aw__user img, .ui-aw__user-dot { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; }
.ui-aw__user-dot { display: grid; place-items: center; background: var(--tc-accent-subtle); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-semibold); color: var(--tc-accent-text); }
.ui-aw__user > span:not(.ui-aw__user-dot) { flex: 1; }

/* Main panel */
.ui-aw__main { position: relative; display: flex; flex-direction: column; min-width: 0; min-height: 0; overflow: hidden; background: var(--tc-surface-raised); border: var(--tc-hairline) solid var(--tc-border-default); border-radius: var(--tc-radius-2xl); box-shadow: var(--tc-shadow-control); }
:where([data-look="clean"], [data-look="clean"] *) .ui-aw__main { border: 0; border-radius: var(--tc-radius-xl); box-shadow: var(--tc-card-shadow); }
.ui-aw__bar { display: flex; align-items: center; gap: var(--tc-space-2); height: 48px; padding: 0 var(--tc-space-2-5) 0 var(--tc-space-3); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-aw__crumbs, .ui-aw__more, .ui-aw__sort, .ui-aw__card-menu { position: relative; }
.ui-aw__crumbs { min-width: 0; }
/* Menu triggers with a label: the ghost button's geometry and hover */
[data-ui="aw"] .ui-aw__crumb-btn { display: flex; align-items: center; gap: var(--tc-space-1-5); max-width: 100%; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-control-radius-sm); background: transparent; font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-medium); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="aw"] .ui-aw__crumb-btn:hover, [data-ui="aw"] .ui-aw__sort-btn:hover { background: var(--tc-action-ghost-bg-hover); }
.ui-aw__crumb-btn svg { color: var(--tc-text-muted); }
.ui-aw__slash { color: var(--tc-icon-muted); font-weight: var(--tc-font-weight-regular); }
/* Project and chat name stay on one line each and shorten together when the bar gets narrow */
.ui-aw__crumb-btn > .ui-aw__muted { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-aw__more { margin-left: auto; }
.ui-aw__menu { position: absolute; top: calc(100% + var(--tc-space-1-5)); left: 0; z-index: var(--tc-z-dropdown); display: grid; gap: var(--tc-space-0-5); min-width: 190px; padding: var(--tc-menu-padding); border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); box-shadow: var(--tc-menu-shadow); animation: ui-aw-drop var(--tc-duration-base) var(--tc-ease-move); }
.ui-aw__menu--right { left: auto; right: 0; }
.ui-aw__menu-title { margin: var(--tc-space-0-5) var(--tc-menu-item-px) var(--tc-space-1); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); color: var(--tc-caption-color); }
[data-ui="aw"] .ui-aw__menu-item { display: flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-menu-item-h); padding: 0 var(--tc-menu-item-px); border: 0; border-radius: var(--tc-menu-item-radius); background: transparent; font-size: var(--tc-menu-item-font-size); text-align: left; white-space: nowrap; }
[data-ui="aw"] .ui-aw__menu-item:is(:hover, :focus-visible):not(:disabled) { background: var(--tc-menu-item-hover); }
[data-ui="aw"] .ui-aw__menu-item:focus-visible { outline-offset: calc(var(--tc-focus-ring-width) * -1); }
[data-ui="aw"] .ui-aw__menu-item:disabled { color: var(--tc-text-disabled); cursor: default; }
.ui-aw__menu-item svg:last-child:not(:first-child) { margin-left: auto; color: var(--tc-menu-item-selected-fg); }
[data-ui="aw"] .ui-aw__menu-item[aria-checked="true"] { color: var(--tc-menu-item-selected-fg); font-weight: var(--tc-font-weight-medium); }
[data-ui="aw"] .ui-aw__danger:not(:disabled) { color: var(--tc-status-danger-fg); }

/* Welcome */
.ui-aw__welcome { display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center; padding: var(--tc-space-6); animation: ui-aw-in var(--tc-duration-slower) var(--tc-ease-move); }
.ui-aw__hello { font-size: var(--tc-font-size-4xl); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-display); letter-spacing: var(--tc-tracking-tight); }
.ui-aw__sub { margin-top: var(--tc-space-1-5); font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-muted); text-align: center; }
.ui-aw__sub--left { text-align: left; line-height: var(--tc-line-height-normal); }
.ui-aw__composer { width: min(640px, 100%); margin-top: var(--tc-space-6); }
.ui-aw__starters { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--tc-space-1-5); max-width: 640px; margin-top: var(--tc-space-3-5); }
/* Starters: secondary buttons in the pill shape */
[data-ui="aw"] .ui-aw__starter { height: var(--tc-control-h-sm); padding: 0 var(--tc-space-3); border: 0; border-radius: var(--tc-radius-full); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); max-width: 100%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="aw"] .ui-aw__starter:hover { box-shadow: var(--tc-action-secondary-shadow-hover); color: var(--tc-text-primary); }
.ui-aw__disclaimer { margin-top: var(--tc-space-3-5); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); text-align: center; color: var(--tc-text-muted); }

/* Chat */
.ui-aw__chat { display: flex; flex: 1; flex-direction: column; min-height: 0; animation: ui-aw-in var(--tc-duration-slow) var(--tc-ease-move); }
.ui-aw__messages { display: grid; align-content: start; gap: var(--tc-space-5); flex: 1; min-height: 0; padding: var(--tc-space-7) max(var(--tc-space-6), calc((100% - var(--tc-aw-chat-w)) / 2)) var(--tc-space-4); overflow-y: auto; scrollbar-width: thin; }
.ui-aw__msg { animation: ui-aw-in var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-aw__msg p { white-space: pre-wrap; font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-relaxed); }
.ui-aw__msg--user { justify-self: end; max-width: 78%; padding: var(--tc-space-2-5) var(--tc-space-3-5); border-radius: var(--tc-radius-2xl) var(--tc-radius-2xl) var(--tc-radius-xs) var(--tc-radius-2xl); background: var(--tc-fill-default); }
.ui-aw__msg--ai { display: flex; gap: var(--tc-space-3); color: var(--tc-text-secondary); }
.ui-aw__mark { flex: none; width: 16px; height: 16px; position: relative; top: 3.5px; border-radius: 50%; background: radial-gradient(circle at 30% 26%, rgba(255, 255, 255, 0.85) 0, rgba(255, 255, 255, 0) 42%), linear-gradient(140deg, var(--tc-blue-300) 0%, var(--tc-accent-solid) 48%, var(--tc-blue-600) 100%); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25), var(--tc-shadow-control); }
/* While thinking the orb breathes (transform only); reduced motion keeps it still */
.ui-aw__mark--busy { animation: ui-aw-orb var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite; }
.ui-aw__ai-body { min-width: 0; }
.ui-aw__thinking { color: var(--tc-text-muted); }
.ui-aw__actions { display: flex; gap: var(--tc-space-0-5); margin: var(--tc-space-1-5) 0 0 calc(var(--tc-space-1-5) * -1); }
.ui-aw__error { color: var(--tc-status-danger-fg); }
.ui-aw__error + .ui-aw__actions { margin: var(--tc-space-2-5) 0 0; }
.ui-aw__composer--dock { align-self: center; margin: 0; padding: var(--tc-space-1) 0 var(--tc-space-3-5); }
.ui-aw__composer--dock .ui-aw__disclaimer { margin-top: var(--tc-space-2); }

/* Projects */
.ui-aw__projects { flex: 1; min-height: 0; padding: var(--tc-space-7) max(var(--tc-space-6), calc((100% - var(--tc-aw-page-w)) / 2)) var(--tc-space-6); overflow-y: auto; animation: ui-aw-in var(--tc-duration-slow) var(--tc-ease-move); scrollbar-width: thin; }
.ui-aw__projects-head { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: var(--tc-space-3-5); }
.ui-aw__tile { display: grid; place-items: center; width: 44px; height: 44px; border-radius: var(--tc-radius-xl); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
.ui-aw__title { font-size: var(--tc-font-size-2xl); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-display-sm); letter-spacing: var(--tc-tracking-tight); }
.ui-aw__search--wide { margin: var(--tc-space-5) 0 var(--tc-space-4); }
.ui-aw__list-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--tc-space-2-5); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); }
[data-ui="aw"] .ui-aw__sort-btn { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1-5); border: 0; border-radius: var(--tc-control-radius-sm); background: transparent; font-size: var(--tc-font-size-md); color: var(--tc-text-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-aw__sort-btn strong { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-aw__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--tc-space-3); margin: 0; padding: 0; list-style: none; }
/* Project cards: a card on top of the tray's footer – the same tray as the other components */
.ui-aw__project { border-radius: var(--tc-radius-2xl); background: var(--tc-surface-tray); animation: ui-aw-in var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-aw__project-card { padding: var(--tc-space-3-5) var(--tc-space-3-5) var(--tc-space-3-5) var(--tc-space-4); border-radius: var(--tc-radius-2xl); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-aw__project-top { display: flex; align-items: center; gap: var(--tc-space-2-5); min-height: 28px; }
.ui-aw__project-top > svg { color: var(--tc-text-secondary); }
.ui-aw__project-name { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-medium); white-space: nowrap; text-overflow: ellipsis; }
.ui-aw__pinned { display: grid; color: var(--tc-accent-text); }
/* The options button shows on hover, while its menu is open and on keyboard focus */
.ui-aw__dots { opacity: 0; }
.ui-aw__project:hover .ui-aw__dots, .ui-aw__dots[aria-expanded="true"], .ui-aw__dots:has([aria-expanded="true"]), .ui-aw__dots:focus-within { opacity: 1; }
@media (hover: none) { .ui-aw__dots { opacity: 1; } }
.ui-aw__rename { flex: 1; min-width: 0; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-control-radius-sm); outline: none; background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow-focus); font: inherit; font-size: var(--tc-font-size-lg); color: var(--tc-text-primary); }
.ui-aw__project-desc { margin: var(--tc-space-1) 0 0 var(--tc-space-6); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); }
.ui-aw__project-foot { padding: var(--tc-space-2) var(--tc-space-4) var(--tc-space-2-5); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }

/* Dialog: a tray with the card on top and the actions below */
.ui-aw__backdrop { position: absolute; inset: 0; z-index: var(--tc-z-modal-scrim); background: var(--tc-scrim); opacity: 0; pointer-events: none; transition: opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-aw__backdrop[data-open] { opacity: 1; pointer-events: auto; }
.ui-aw__dialog { position: absolute; top: 50%; left: 50%; z-index: var(--tc-z-modal); width: min(380px, calc(100% - 32px)); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); box-shadow: var(--tc-shadow-overlay); opacity: 0; pointer-events: none; transform: translate(-50%, -46%) scale(0.98); transition: opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-slow) var(--tc-ease-move); }
.ui-aw__dialog[data-open] { opacity: 1; pointer-events: auto; transform: translate(-50%, -50%); }
.ui-aw__dialog-card { padding: var(--tc-space-4-5); border-radius: var(--tc-tray-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-aw__dialog-title { margin: 0 0 var(--tc-space-3-5); font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-loose); }
.ui-aw__field { width: 100%; height: var(--tc-field-h); padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); outline: none; background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-field-font-size); color: var(--tc-text-primary); }
.ui-aw__field::placeholder { color: var(--tc-text-placeholder); }
.ui-aw__field:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-aw__field:focus { box-shadow: var(--tc-field-shadow-focus); }
.ui-aw__dialog-foot { display: flex; justify-content: flex-end; gap: var(--tc-space-1-5); padding: var(--tc-space-2-5); }

/* Narrow containers: the sidebar becomes an overlay that starts closed */
@container (max-width: 720px) {
  [data-ui="aw"] { grid-template-columns: 0px minmax(0, 1fr); padding-left: var(--tc-space-2); }
  [data-ui="aw"]:not([data-collapsed]) .ui-aw__side { position: absolute; inset: var(--tc-space-2) auto var(--tc-space-2) var(--tc-space-2); z-index: var(--tc-z-drawer); width: var(--tc-aw-side); border-radius: var(--tc-radius-2xl); background: var(--tc-surface-sunken); box-shadow: var(--tc-shadow-overlay); }
  .ui-aw__grid { grid-template-columns: minmax(0, 1fr); }
  .ui-aw__projects-head { grid-template-columns: auto 1fr; }
  .ui-aw__projects-head .ui-aw__create { grid-column: 1 / -1; justify-self: start; }
}
/* Phone width: less padding around the welcome */
@container (max-width: 560px) {
  .ui-aw__welcome { padding: var(--tc-space-6) var(--tc-space-4); }
}
@keyframes ui-aw-in { from { opacity: 0; transform: translateY(4px); } }
@keyframes ui-aw-drop { from { opacity: 0; transform: translateY(-4px) scale(0.98); } }
@keyframes ui-aw-orb { 50% { transform: scale(0.82); } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="aw"], .ui-aw__side, .ui-aw__dialog, .ui-aw__backdrop { transition: none; }
  .ui-aw__welcome, .ui-aw__chat, .ui-aw__projects, .ui-aw__msg, .ui-aw__project, .ui-aw__menu, .ui-aw__mark--busy { animation: none; }
}
@media (forced-colors: active) {
  .ui-aw__mark { background: CanvasText; }
  [data-ui="aw"] .ui-aw__item[aria-current] { outline: 2px solid Highlight; }
}
/* Text fields show their focus with the field ring (above), not a second outline */
[data-ui="aw"] :is(.ui-aw__search input, .ui-aw__field, .ui-aw__rename):focus-visible { outline: none; }
`;
}

if (!customElements.get("tc-ai-workspace")) customElements.define("tc-ai-workspace", TcAiWorkspace);
declare global {
  interface HTMLElementTagNameMap {
    "tc-ai-workspace": TcAiWorkspace;
  }
}
