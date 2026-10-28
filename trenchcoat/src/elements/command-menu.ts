import { html, nothing, svg, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { HotkeyController } from "./internal/controllers";

/*
 * <tc-command-menu> – the Lit port of src/components/command-menu.tsx: search and run anything from one field.
 * Actions that use another tool carry its logo and a ⌘1–⌘5 shortcut; everyday commands use simple icons. Typing
 * filters every group and offers to ask the assistant about it.
 * ↑ ↓ move row by row, ↵ runs, ⌘1–⌘5 run a suggestion, Esc clears the search or closes, ⌘K (Ctrl K elsewhere)
 * focuses the field from anywhere – change it or turn it off with `hotkey`. Tab is left to the browser.
 *
 * Standard sits on a gray tray with the hints under the card; Clean is one white panel with hairline shadows and the
 * hints as its last row.
 *
 *   <tc-command-menu .groups=${groups} .onRun=${(id, query) => …} @tc-close=${…}></tc-command-menu>
 *
 * Logos and icons are elements, cloned per row; ids inside a clone (gradients) are made unique, so several menus on
 * one page never share them.
 */

export type CommandMenuCommand = {
  id: string;
  label: string;
  /** Lighter text after the label, e.g. a person, a channel or a page */
  hint?: string;
  /** "logo" sits on a small white tile; "icon" is a plain glyph (both cloned) */
  icon?: Element;
  logo?: Element;
  /** Keys shown on the right, e.g. ["G", "I"] – suggestions get ⌘1–⌘5 automatically */
  keys?: string[];
  /** Extra words that should find this command */
  keywords?: string;
};

export type CommandMenuGroup = { id: string; label: string; commands: CommandMenuCommand[] };

/** Runs a command: the command id, or "ask" and the typed text for the assistant fallback. May return a promise – the
 *  menu says it's running, confirms when it resolves and shows an error when it rejects. The signal aborts when the
 *  menu disconnects */
export type CommandMenuRun = (id: string, query: string | undefined, options: { signal: AbortSignal }) => void | Promise<unknown>;

/* ---------- Icons ---------- */

/** An SVG from markup. Gradients carry data-gradient – a template id, made unique in every clone (see `mark`) */
const svgEl = (markup: string) => {
  const t = document.createElement("template");
  t.innerHTML = markup;
  for (const g of t.content.querySelectorAll("[data-gradient]")) {
    g.id = g.getAttribute("data-gradient")!;
    g.removeAttribute("data-gradient");
  }
  return t.content.firstElementChild!;
};
const glyph = (d: string) => svgEl(`<svg viewBox="0 0 24 24" class="ui-cm__glyph" aria-hidden="true"><path d="${d}"></path></svg>`);
/** A command whose logo or icon is made the first time it's read – nothing touches `document` when the module loads,
 *  so it imports on a server (SSR) */
const lazyMark = <C extends Omit<CommandMenuCommand, "logo" | "icon">>(command: C, key: "logo" | "icon", make: () => Element) => {
  let el: Element | undefined;
  return Object.defineProperty(command, key, { get: () => (el ??= make()), enumerable: true, configurable: true }) as C & CommandMenuCommand;
};
const icons = {
  doc: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h4",
  person: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0M19 8v4M17 10h4",
  inbox: "M4 13l2.5-8h11L20 13v6H4zM4 13h4.5a3.5 3.5 0 0 0 7 0H20",
  home: "M4 11l8-7 8 7v9h-5v-6H9v6H4z",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 13.5l1.6 1.2-2 3.4-1.9-.7a7 7 0 0 1-1.7 1L15 20.5h-4l-.4-2.1a7 7 0 0 1-1.7-1l-1.9.7-2-3.4 1.6-1.2a7 7 0 0 1 0-3l-1.6-1.2 2-3.4 1.9.7a7 7 0 0 1 1.7-1L11 3.5h4l.4 2.1a7 7 0 0 1 1.7 1l1.9-.7 2 3.4-1.6 1.2a7 7 0 0 1 0 3z",
  moon: "M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z",
  help: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01",
  upload: "M12 16V4M7 9l5-5 5 5M5 20h14",
  chart: "M5 20V10M12 20V4M19 20v-7",
};

/* Brand marks – Simple Icons (CC0) and the products' own colors. Gradient ids are made unique per clone */
const SPARK = `<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient data-gradient="spark" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#7C5CFF"></stop><stop offset="1" stop-color="#2F9BFF"></stop></linearGradient></defs><path fill="url(#spark)" d="M12 2.5c.6 3.9 2.1 6.4 4.4 7.6 1.1.6 2.4.9 4.1 1.1v1.6c-4.6.6-7.3 3-8.5 8.7h-1.6c-.6-3.9-2.1-6.4-4.4-7.6-1.1-.6-2.4-.9-4.1-1.1v-1.6c4.6-.6 7.3-3 8.5-8.7z"></path></svg>`;
const GMAIL = `<svg viewBox="0 0 56.4108 44.8722" fill="none" aria-hidden="true"><path d="M44.2255 5.76727H56.4051V41.0239C56.4051 43.148 54.683 44.8701 52.5589 44.8701H46.1486C45.8961 44.8701 45.646 44.8204 45.4127 44.7237C45.1794 44.6271 44.9674 44.4854 44.7888 44.3069C44.6102 44.1283 44.4686 43.9163 44.3719 43.683C44.2753 43.4497 44.2255 43.1996 44.2255 42.947V5.76727Z" fill="url(#gm-0)"></path><path d="M12.1796 5.76727H0V41.0239C0 43.148 1.72213 44.8701 3.84618 44.8701H10.2565C10.509 44.8701 10.7591 44.8204 10.9924 44.7237C11.2257 44.6271 11.4377 44.4854 11.6163 44.3069C11.7949 44.1283 11.9365 43.9163 12.0332 43.683C12.1298 43.4497 12.1796 43.1996 12.1796 42.947V5.76727Z" fill="#FC413D"></path><path d="M10.0085 1.42778C7.43377 -0.736342 3.5924 -0.403647 1.42828 2.17105C-0.735843 4.74543 -0.403148 8.58681 2.17155 10.7512L26.5557 31.2479C27.0178 31.6362 27.602 31.8492 28.2056 31.8492C28.8091 31.8492 29.3934 31.6362 29.8554 31.2479L54.2396 10.7509C56.814 8.58681 57.1467 4.74543 54.9825 2.17073C52.8184 -0.403648 48.977 -0.736342 46.4027 1.42778L28.2054 16.724L10.0085 1.42778Z" fill="url(#gm-1)"></path><defs><linearGradient data-gradient="gm-0" x1="50.3153" y1="5.76727" x2="50.3153" y2="44.8701" gradientUnits="userSpaceOnUse"><stop stop-color="#60D673"></stop><stop offset="0.17" stop-color="#42C868"></stop><stop offset="0.39" stop-color="#0EBC5F"></stop><stop offset="0.62" stop-color="#00A9BB"></stop><stop offset="0.86" stop-color="#3C90FF"></stop><stop offset="1" stop-color="#3186FF"></stop></linearGradient><linearGradient data-gradient="gm-1" x1="6.04194e-05" y1="6.45153" x2="56.4107" y2="6.45153" gradientUnits="userSpaceOnUse"><stop offset="0.08" stop-color="#FF63A0"></stop><stop offset="0.3" stop-color="#FC413D"></stop><stop offset="0.5" stop-color="#FC413D"></stop><stop offset="0.65" stop-color="#FC413D"></stop><stop offset="0.72" stop-color="#FC5C30"></stop><stop offset="0.86" stop-color="#FEB10C"></stop><stop offset="0.91" stop-color="#FEC700"></stop><stop offset="0.96" stop-color="#FFDB0F"></stop></linearGradient></defs></svg>`;
const SLACK = `<svg viewBox="0 0 49.883 49.877" fill="none" aria-hidden="true"><g transform="translate(0 0)"><path d="M18.3549 10.4784C15.4713 10.4784 13.1157 8.12279 13.1157 5.2392C13.1157 2.35561 15.4713 0 18.3549 0C21.2385 0 23.5941 2.35561 23.5941 5.2392V10.4784H18.3549Z" fill="#36C5F0"></path><path d="M18.3575 13.12C21.2411 13.12 23.5967 15.4756 23.5967 18.3592C23.5967 21.2428 21.2411 23.5984 18.3575 23.5984H5.2392C2.35561 23.5984 0 21.2428 0 18.3592C0 15.4756 2.35561 13.12 5.2392 13.12H18.3575Z" fill="#36C5F0"></path></g><g transform="translate(26.28 0)"><path d="M13.1244 18.3592C13.1244 15.4756 15.48 13.12 18.3636 13.12C21.2472 13.12 23.6028 15.4756 23.6028 18.3592C23.6028 21.2428 21.2472 23.5984 18.3636 23.5984H13.1244V18.3592Z" fill="#2EB67D"></path><path d="M10.4785 18.3575C10.4785 21.2411 8.12286 23.5967 5.23927 23.5967C2.35568 23.5967 7.4362e-05 21.2411 7.4362e-05 18.3575V5.2392C7.4362e-05 2.35561 2.35568 0 5.23927 0C8.12286 0 10.4785 2.35561 10.4785 5.2392V18.3575Z" fill="#2EB67D"></path></g><g transform="translate(0 26.28)"><path d="M10.4784 5.2392C10.4784 8.12279 8.12279 10.4784 5.2392 10.4784C2.35561 10.4784 0 8.12279 0 5.2392C0 2.35561 2.35561 0 5.2392 0H10.4784V5.2392Z" fill="#E01E5A"></path><path d="M13.1157 5.2392C13.1157 2.35561 15.4713 0 18.3549 0C21.2385 0 23.5941 2.35561 23.5941 5.2392V18.3575C23.5941 21.2411 21.2385 23.5967 18.3549 23.5967C15.4713 23.5967 13.1157 21.2411 13.1157 18.3575V5.2392Z" fill="#E01E5A"></path></g><g transform="translate(26.28 26.28)"><path d="M5.23927 13.1157C8.12286 13.1157 10.4785 15.4713 10.4785 18.3549C10.4785 21.2385 8.12286 23.5941 5.23927 23.5941C2.35568 23.5941 7.4362e-05 21.2385 7.4362e-05 18.3549V13.1157H5.23927Z" fill="#ECB22E"></path><path d="M5.23927 10.4784C2.35568 10.4784 7.4362e-05 8.12279 7.4362e-05 5.2392C7.4362e-05 2.35561 2.35568 0 5.23927 0H18.3576C21.2412 0 23.5968 2.35561 23.5968 5.2392C23.5968 8.12279 21.2412 10.4784 18.3576 10.4784H5.23927Z" fill="#ECB22E"></path></g></svg>`;
const CLICKUP = `<svg viewBox="0 0 49.7096 59.6884" fill="none" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M0 45.9002L9.1618 38.8247C14.0602 45.1745 19.2307 48.1679 24.9455 48.1679C30.6603 48.1679 35.7401 45.2652 40.3663 38.9154L49.7096 45.8094C42.997 54.8805 34.6516 59.6882 24.9455 59.6882C15.3301 59.6882 6.89403 54.8805 0 45.9002Z" fill="url(#cu-0)"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M24.9535 15.3301L8.62558 29.3903L1.09657 20.5914L25.0442 0L48.8105 20.5914L41.1908 29.2996L24.9535 15.3301Z" fill="url(#cu-1)"></path><defs><linearGradient data-gradient="cu-0" x1="0" y1="49.2666" x2="49.75" y2="49.2666" gradientUnits="userSpaceOnUse"><stop stop-color="#8930FD"></stop><stop offset="1" stop-color="#49CCF9"></stop></linearGradient><linearGradient data-gradient="cu-1" x1="1.09231" y1="14.6901" x2="48.7603" y2="14.6901" gradientUnits="userSpaceOnUse"><stop stop-color="#FF02F0"></stop><stop offset="1" stop-color="#FFC800"></stop></linearGradient></defs></svg>`;
const HUBSPOT = `<svg viewBox="0 0 24 24" fill="#FF7A59" aria-hidden="true"><path d="M18.164 7.93V5.084a2.198 2.198 0 001.267-1.978v-.067A2.2 2.2 0 0017.238.845h-.067a2.2 2.2 0 00-2.193 2.193v.067a2.196 2.196 0 001.252 1.973l.013.006v2.852a6.22 6.22 0 00-2.969 1.31l.012-.01-7.828-6.095A2.497 2.497 0 104.3 4.656l-.012.006 7.697 5.991a6.176 6.176 0 00-1.038 3.446c0 1.343.425 2.588 1.147 3.607l-.013-.02-2.342 2.343a1.968 1.968 0 00-.58-.095h-.002a2.033 2.033 0 102.033 2.033 1.978 1.978 0 00-.1-.595l.005.014 2.317-2.317a6.247 6.247 0 104.782-11.134l-.036-.005zm-.964 9.378a3.206 3.206 0 113.215-3.207v.002a3.206 3.206 0 01-3.207 3.207z"></path></svg>`;
const CALENDAR = `<svg viewBox="0 0 24 24" fill="#4285F4" aria-hidden="true"><path d="M18.316 5.684H24v12.632h-5.684V5.684zM5.684 24h12.632v-5.684H5.684V24zM18.316 5.684V0H1.895A1.894 1.894 0 0 0 0 1.895v16.421h5.684V5.684h12.632zm-7.207 6.25v-.065c.272-.144.5-.349.687-.617s.279-.595.279-.982c0-.379-.099-.72-.3-1.025a2.05 2.05 0 0 0-.832-.714 2.703 2.703 0 0 0-1.197-.257c-.6 0-1.094.156-1.481.467-.386.311-.65.671-.793 1.078l1.085.452c.086-.249.224-.461.413-.633.189-.172.445-.257.767-.257.33 0 .602.088.816.264a.86.86 0 0 1 .322.703c0 .33-.12.589-.36.778-.24.19-.535.284-.886.284h-.567v1.085h.633c.407 0 .748.109 1.02.327.272.218.407.499.407.843 0 .336-.129.614-.387.832s-.565.327-.924.327c-.351 0-.651-.103-.897-.311-.248-.208-.422-.502-.521-.881l-1.096.452c.178.616.505 1.082.977 1.401.472.319.984.478 1.538.477a2.84 2.84 0 0 0 1.293-.291c.382-.193.684-.458.902-.794.218-.336.327-.72.327-1.149 0-.429-.115-.797-.344-1.105a2.067 2.067 0 0 0-.881-.689zm2.093-1.931l.602.913L15 10.045v5.744h1.187V8.446h-.827l-2.158 1.557zM22.105 0h-3.289v5.184H24V1.895A1.894 1.894 0 0 0 22.105 0zm-3.289 23.5l4.684-4.684h-4.684V23.5zM0 22.105C0 23.152.848 24 1.895 24h3.289v-5.184H0v3.289z"></path></svg>`;
const NOTION = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"></path></svg>`;

/** Sample commands – replace with your own */
export const defaultCommandGroups: CommandMenuGroup[] = [
  {
    id: "suggestions",
    label: "Suggestions",
    commands: [
      lazyMark({ id: "email", label: "Write an email", hint: "Gmail", keywords: "mail send compose" }, "logo", () => svgEl(GMAIL)),
      lazyMark({ id: "ask", label: "Ask assistant", hint: "Summaries, drafts, answers", keywords: "ai chat question" }, "logo", () => svgEl(SPARK)),
      lazyMark({ id: "task", label: "Create a task", hint: "ClickUp", keywords: "todo issue" }, "logo", () => svgEl(CLICKUP)),
      lazyMark({ id: "crm", label: "Add contact to CRM", hint: "HubSpot", keywords: "lead deal company" }, "logo", () => svgEl(HUBSPOT)),
      lazyMark({ id: "meet", label: "Schedule a meeting", hint: "Google Calendar", keywords: "call invite event" }, "logo", () => svgEl(CALENDAR)),
    ],
  },
  {
    id: "share",
    label: "Share",
    commands: [
      lazyMark({ id: "slack", label: "Post an update", hint: "#team-updates", keywords: "message channel" }, "logo", () => svgEl(SLACK)),
      lazyMark({ id: "notion", label: "Save as page", hint: "Notion · Meeting notes", keywords: "doc wiki" }, "logo", () => svgEl(NOTION)),
    ],
  },
  {
    id: "general",
    label: "General",
    commands: [
      lazyMark({ id: "new-doc", label: "New document", keys: ["N"] }, "icon", () => glyph(icons.doc)),
      lazyMark({ id: "invite", label: "Invite teammates", keys: ["I"] }, "icon", () => glyph(icons.person)),
      lazyMark({ id: "upload", label: "Upload files", keys: ["U"] }, "icon", () => glyph(icons.upload)),
      lazyMark({ id: "theme", label: "Switch to dark mode", keywords: "theme appearance light", keys: ["⇧", "D"] }, "icon", () => glyph(icons.moon)),
    ],
  },
  {
    id: "go",
    label: "Go to",
    commands: [
      lazyMark({ id: "home", label: "Home", keys: ["G", "H"] }, "icon", () => glyph(icons.home)),
      lazyMark({ id: "inbox", label: "Inbox", keys: ["G", "I"] }, "icon", () => glyph(icons.inbox)),
      lazyMark({ id: "reports", label: "Reports", keys: ["G", "R"] }, "icon", () => glyph(icons.chart)),
      lazyMark({ id: "settings", label: "Settings", keys: ["G", "S"] }, "icon", () => glyph(icons.gear)),
      lazyMark({ id: "help", label: "Help & feedback", keys: ["?"] }, "icon", () => glyph(icons.help)),
    ],
  },
];
let sparkTile: Element | undefined;

/** The typed text, bold where it matches */
const highlight = (text: string, query: string): TemplateResult | string => {
  const i = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (i < 0) return text;
  return html`${text.slice(0, i)}<mark>${text.slice(i, i + query.length)}</mark>${text.slice(i + query.length)}`;
};

/** Apple devices show ⌘ */
const isApple = () => {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  return /Mac|iPhone|iPad|iOS/i.test(nav.userAgentData?.platform || nav.userAgent);
};

/** The keys of a combination as shown on key chips */
const comboKeys = (combo: string, mod: string) =>
  combo
    .split("+")
    .map((p) => p.trim().toLowerCase())
    .map((p) => (p === "mod" ? mod : p === "ctrl" || p === "control" ? "Ctrl" : p === "meta" || p === "cmd" ? "⌘" : p === "shift" ? "⇧" : p === "alt" || p === "option" ? "⌥" : p.toUpperCase()));

let uid = 0;
let cloneId = 0;

type RunStatus = { id: string; label: string; state: "pending" | "failed" };

/**
 * Search and run anything from one field.
 * @tag tc-command-menu
 * @fires tc-query-change - The search text changes; detail `{ query }`. Cancelable: preventDefault() keeps the
 *   current text (controlled use)
 * @fires tc-close - Esc in an empty search; detail: null
 */
export class TcCommandMenu extends TcElement {
  static override ui = "cm";

  /** The commands, in titled groups; a group with the id "suggestions" gets ⌘1–⌘5 */
  @property({ attribute: false }) accessor groups: CommandMenuGroup[] = defaultCommandGroups;
  /** Placeholder text in the search field */
  @property() accessor placeholder = "Type a command or search…";
  /** The search text */
  @property() accessor query = "";
  /** Runs a command (see CommandMenuRun); may return a promise */
  @property({ attribute: false }) accessor onRun: CommandMenuRun | undefined = undefined;
  /** Window shortcut that focuses the field: "mod+k" (⌘K on Apple devices, Ctrl K elsewhere), any other combination
   *  like "ctrl+shift+p", or false for none. The most recently connected menu takes it */
  @property({ attribute: false }) accessor hotkey: string | false = "mod+k";
  /** Focus the field when the menu appears */
  @property({ type: Boolean, attribute: "autofocus" }) accessor autoFocus = false;
  /** Most rows rendered at once – with more matches the menu shows the first ones and asks to keep typing */
  @property({ type: Number, attribute: "max-rows" }) accessor maxRows = 200;

  /** @internal */
  @state() private accessor active: string | null = null;
  /** @internal What just ran – shown for a moment */
  @state() private accessor ran: { id: string; label: string } | null = null;
  /** @internal A run that returned a promise: still going, or failed */
  @state() private accessor status: RunStatus | null = null;
  /** @internal What the live regions say; repeats alternate a trailing no-break space, so they're announced again */
  @state() private accessor said: { text: string; alert: boolean; n: number } = { text: "", alert: false, n: 0 };
  /** @internal The highlight shows while the pointer is over the list or the keyboard moves (Clean fades it) */
  @state() private accessor lit = true;
  /** @internal "Ctrl", or "⌘" on Apple devices */
  @state() private accessor mod = "Ctrl";

  /** @internal */
  private baseId = `tc-cm-${++uid}`;
  /** @internal Keyboard moves keep the active row in view; the mouse never scrolls the list */
  private byKeyboard = false;
  /** @internal Runs still going: aborted on disconnect */
  private runs = new Set<AbortController>();
  private ranTimer = 0;
  private ro?: ResizeObserver;
  /** @internal Clones of logos and icons, per element, so gradient ids stay unique and nodes aren't re-cloned on every update */
  private clones = new WeakMap<Element, Element>();

  constructor() {
    super();
    // ⌘K / Ctrl K (or the chosen hotkey) focuses the field from anywhere
    // (only while connected: HotkeyController binds again in hostUpdated, which can run after a disconnect)
    new HotkeyController(
      this,
      () => this.isConnected && this.hotkey,
      () => {
        const input = this.input;
        input?.focus();
        input?.select();
      },
    );
  }

  /** @internal */
  private get input() {
    return this.querySelector<HTMLInputElement>(".ui-cm__search input");
  }

  override connectedCallback() {
    super.connectedCallback();
    if (isApple()) this.mod = "⌘";
    if (this.hasUpdated) this.observeHeight();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.ro?.disconnect();
    this.ro = undefined;
    window.clearTimeout(this.ranTimer);
    this.runs.forEach((c) => c.abort());
    this.runs.clear();
  }

  /** @internal A cloned mark whose ids (gradients) are unique on the page */
  private mark(el: Element) {
    let copy = this.clones.get(el);
    if (copy) return copy;
    copy = el.cloneNode(true) as Element;
    const tag = `-tc${++cloneId}`;
    for (const node of copy.querySelectorAll("[id]")) {
      const old = node.id;
      node.id = old + tag;
      for (const ref of copy.querySelectorAll("*")) {
        for (const attr of ["fill", "stroke", "clip-path", "mask", "filter", "href", "xlink:href"]) {
          const value = ref.getAttribute(attr);
          if (value && value.includes(`#${old}`)) ref.setAttribute(attr, value.split(`url(#${old})`).join(`url(#${old}${tag})`).replace(new RegExp(`^#${old}$`), `#${old}${tag}`));
        }
      }
    }
    this.clones.set(el, copy);
    return copy;
  }

  /** @internal The list's height follows its rows (up to its max height), so searching glides rather than jumps */
  private observeHeight() {
    const list = this.querySelector<HTMLElement>(".ui-cm__list");
    const inner = this.querySelector<HTMLElement>(".ui-cm__inner");
    if (!list || !inner) return;
    const measure = () => {
      const style = getComputedStyle(list);
      const pad = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
      const max = parseFloat(style.maxHeight) || Infinity;
      const height = `${Math.min(inner.offsetHeight + pad, max)}px`;
      if (list.style.height !== height) list.style.height = height;
    };
    measure();
    this.ro?.disconnect();
    if (typeof ResizeObserver !== "function") return;
    this.ro = new ResizeObserver(measure);
    this.ro.observe(inner);
  }

  /** @internal The rows that match the search */
  private filter() {
    const q = this.query.trim();
    const needle = q.toLowerCase();
    const result = this.groups
      .map((g) => ({ ...g, commands: g.commands.filter((c) => !needle || `${c.label} ${c.hint ?? ""} ${c.keywords ?? ""}`.toLowerCase().includes(needle)) }))
      .filter((g) => g.commands.length);
    // With text typed, the first row always offers to ask the assistant about it
    if (needle) result.unshift({ id: "ask-about", label: "Assistant", commands: [{ id: "ask-about", label: `Ask assistant about “${q}”`, logo: (sparkTile ??= svgEl(SPARK)) }] });
    const total = result.reduce((n, g) => n + g.commands.length, 0);
    if (total <= this.maxRows) return { q, groups: result, total, cut: false };
    let left = this.maxRows;
    const cut = result
      .map((g) => {
        const commands = g.commands.slice(0, Math.max(0, left));
        left -= commands.length;
        return { ...g, commands };
      })
      .filter((g) => g.commands.length);
    return { q, groups: cut, total, cut: true };
  }

  /** @internal */
  private view() {
    const filtered = this.filter();
    const order = filtered.groups.flatMap((g) => g.commands);
    const suggestions = filtered.groups.find((g) => g.id === "suggestions")?.commands ?? [];
    const current = order.find((c) => c.id === this.active) ?? order[0];
    return { filtered, order, suggestions, current };
  }

  /** @internal */
  private say(text: string, alert = false) {
    this.said = { text, alert, n: this.said.n + 1 };
  }

  /** @internal */
  private showRan(ran: { id: string; label: string } | null) {
    this.ran = ran;
    window.clearTimeout(this.ranTimer);
    // A short confirmation after running a command
    if (ran) this.ranTimer = window.setTimeout(() => (this.ran = null), 1800);
  }

  /** @internal */
  private setQuery(query: string) {
    if (this.emit("tc-query-change", { query }, { cancelable: true })) this.query = query;
    else this.requestUpdate();
  }

  /** @internal */
  private run(cmd: CommandMenuCommand) {
    if (this.status?.state === "pending") return;
    const q = this.query.trim();
    this.active = cmd.id;
    const label = cmd.id === "ask-about" ? `Asked the assistant about “${q}”` : cmd.label;
    const controller = new AbortController();
    const result = cmd.id === "ask-about" ? this.onRun?.("ask", q, { signal: controller.signal }) : this.onRun?.(cmd.id, undefined, { signal: controller.signal });
    const done = cmd.id === "ask-about" ? label : `Ran “${cmd.label}”`;
    if (!(result instanceof Promise)) {
      this.status = null;
      this.showRan({ id: cmd.id, label });
      this.say(done);
      return;
    }
    this.runs.add(controller);
    this.showRan(null);
    this.status = { id: cmd.id, label: cmd.id === "ask-about" ? "Asking the assistant" : cmd.label, state: "pending" };
    result.then(
      () => {
        if (!this.runs.delete(controller)) return;
        this.status = null;
        this.showRan({ id: cmd.id, label });
        this.say(done);
      },
      () => {
        if (!this.runs.delete(controller)) return;
        const failed = cmd.id === "ask-about" ? "Couldn't ask the assistant" : `Couldn't run “${cmd.label}”`;
        this.status = { id: cmd.id, label: failed, state: "failed" };
        this.say(failed, true);
      },
    );
  }

  /** @internal */
  private move(step: number) {
    const { order, current } = this.view();
    if (!order.length || !current) return;
    this.byKeyboard = true;
    this.lit = true;
    const i = order.findIndex((c) => c.id === current.id);
    this.active = order[(i + step + order.length) % order.length].id;
  }

  /** @internal */
  private onKeyDown = (e: KeyboardEvent) => {
    // Keys typed into an IME belong to the IME
    if (e.isComposing || e.keyCode === 229) return;
    const { current, suggestions } = this.view();
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      this.move(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Enter" && current) {
      e.preventDefault();
      this.run(current);
    } else if (e.key === "Escape") {
      if (this.query) this.setQuery("");
      else this.emit("tc-close", null);
    } else if ((e.metaKey || e.ctrlKey) && /^[1-5]$/.test(e.key)) {
      const cmd = suggestions[Number(e.key) - 1];
      if (cmd) {
        e.preventDefault();
        this.run(cmd);
      }
    }
  };

  protected override firstUpdated() {
    this.observeHeight();
  }

  protected override updated(changed: Map<PropertyKey, unknown>) {
    if (this.status?.state === "pending") this.setAttribute("aria-busy", "true");
    else this.removeAttribute("aria-busy");
    if (changed.has("autoFocus") && this.autoFocus) this.input?.focus();
    // The highlight glides to the active row – a style write, not a render
    const { current } = this.view();
    const list = this.querySelector<HTMLElement>(".ui-cm__list");
    const pill = this.querySelector<HTMLElement>(".ui-cm__pill");
    const row = current ? list?.querySelector<HTMLElement>(`[data-id="${CSS.escape(current.id)}"]`) : null;
    if (!list || !pill) return;
    if (!row) {
      pill.hidden = true;
      return;
    }
    pill.hidden = false;
    pill.style.transform = `translateY(${row.offsetTop}px)`;
    pill.style.height = `${row.offsetHeight}px`;
    if (!this.byKeyboard) return;
    this.byKeyboard = false;
    // Scroll only the list (never the page), keeping a little room and the group title above the first row in view
    const pad = 8;
    const label = row.previousElementSibling?.classList.contains("ui-cm__label") ? (row.previousElementSibling as HTMLElement).offsetHeight : 0;
    const top = row.offsetTop - pad - label;
    const bottom = row.offsetTop + row.offsetHeight + pad;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }

  /** @internal Standard: the tray below the card · Clean: the panel's last row – a hint, or what just ran */
  private footer(clean: boolean) {
    const { status, ran, hotkey, mod } = this;
    const cross = clean ? html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M5 5l6 6M11 5l-6 6"></path>`}</svg>` : html`<svg viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M7 7l10 10M17 7 7 17"></path>`}</svg>`;
    const check = clean ? html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="m3.5 8.5 3 3 6-7"></path>`}</svg>` : html`<svg viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="m5 12.5 4.5 4.5L19 7.5"></path>`}</svg>`;
    return html`<footer class="ui-cm__foot">
      ${status
        ? keyed(
            `s:${status.state}${status.label}`,
            html`<span class="ui-cm__done" data-state=${status.state}>${status.state === "failed" ? cross : nothing}<span class="ui-cm__done-text">${status.state === "pending" ? `${status.label}…` : status.label}</span></span>`,
          )
        : ran
          ? keyed(`r:${ran.label}`, html`<span class="ui-cm__done">${check}<span class="ui-cm__done-text">${ran.label}</span></span>`)
          : html`<span class="ui-cm__tip"><kbd>↑</kbd><kbd>↓</kbd> to move, <kbd>↵</kbd> to run</span>`}
      ${hotkey
        ? html`<span class="ui-cm__foot-right"><span class="ui-cm__keys">${comboKeys(hotkey, mod).map((k) => html`<kbd>${k}</kbd>`)}</span>to open</span>`
        : nothing}
    </footer>`;
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const id = this.baseId;
    const { filtered, order, suggestions, current } = this.view();
    const q = filtered.q;
    const foot = this.footer(clean);
    const said = this.said;

    return html`
      <div class="ui-cm__card">
        <label class="ui-cm__search">
          ${clean
            ? html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<circle cx="7.25" cy="7.25" r="4.75"></circle><path d="m13.5 13.5-2.9-2.9"></path>`}</svg>`
            : html`<svg viewBox="0 0 24 24" aria-hidden="true">${svg`<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path>`}</svg>`}
          <input
            .value=${live(this.query)}
            placeholder=${this.placeholder}
            aria-label="Command"
            role="combobox"
            aria-expanded="true"
            aria-controls=${`${id}-list`}
            aria-activedescendant=${ifDefined(current ? `${id}-${current.id}` : undefined)}
            @input=${(e: Event) => {
              this.active = null;
              this.setQuery((e.target as HTMLInputElement).value);
            }}
            @keydown=${this.onKeyDown}
          />
          ${clean
            ? html`<kbd class="ui-cm__enter" aria-hidden="true"><svg viewBox="0 0 16 16">${svg`<path d="M12.5 4v3a2 2 0 0 1-2 2h-7M6 6.5 3.5 9 6 11.5"></path>`}</svg></kbd>`
            : html`<span class="ui-cm__enter" aria-hidden="true"><svg viewBox="0 0 24 24">${svg`<path d="M19 6v5a3 3 0 0 1-3 3H6m4-4-4 4 4 4"></path>`}</svg>Enter</span>`}
        </label>

        <div id=${`${id}-list`} class="ui-cm__list" role="listbox" aria-label="Commands" @mouseleave=${() => (this.lit = false)}>
          ${order.length ? html`<span class="ui-cm__pill" ?data-lit=${this.lit} aria-hidden="true"></span>` : nothing}
          <div class="ui-cm__inner">
            ${repeat(
              filtered.groups,
              (g) => g.id,
              (group) => html`<div role="group" aria-label=${group.label} class="ui-cm__group">
                ${group.id !== "ask-about" ? html`<span class="ui-cm__label">${group.label}</span>` : nothing}
                ${repeat(
                  group.commands,
                  (c) => c.id,
                  (cmd) => {
                    const n = group.id === "suggestions" ? suggestions.indexOf(cmd) + 1 : 0;
                    const keys = n ? [this.mod, String(n)] : cmd.keys;
                    return html`<button
                      id=${`${id}-${cmd.id}`}
                      data-id=${cmd.id}
                      type="button"
                      role="option"
                      aria-selected=${cmd.id === current?.id ? "true" : "false"}
                      ?data-ran=${this.ran?.id === cmd.id}
                      ?data-pending=${this.status?.state === "pending" && this.status.id === cmd.id}
                      class="ui-cm__item"
                      tabindex="-1"
                      @mousemove=${() => {
                        this.lit = true;
                        if (cmd.id !== this.view().current?.id) this.active = cmd.id;
                      }}
                      @click=${() => {
                        this.run(cmd);
                        this.input?.focus({ preventScroll: true });
                      }}
                    >
                      ${cmd.logo ? html`<span class="ui-cm__logo">${this.mark(cmd.logo)}</span>` : html`<span class="ui-cm__icon">${cmd.icon ? this.mark(cmd.icon) : nothing}</span>`}
                      <span class="ui-cm__text">
                        <span class="ui-cm__name">${highlight(cmd.label, q)}</span>
                        ${cmd.hint ? html`<span class="ui-cm__hint">${highlight(cmd.hint, q)}</span>` : nothing}
                      </span>
                      ${keys ? html`<span class="ui-cm__keys" aria-hidden="true">${keys.map((k) => html`<kbd>${k}</kbd>`)}</span>` : nothing}
                    </button>`;
                  },
                )}
              </div>`,
            )}
          </div>
        </div>
        ${filtered.cut ? html`<p class="ui-cm__more">Showing ${order.length} of ${filtered.total} – keep typing to narrow the list</p>` : nothing}
        ${clean ? foot : nothing}
      </div>
      ${!clean ? foot : nothing}
      <span class="ui-cm__sr" role="status">${!said.alert && said.text ? said.text + (said.n % 2 ? "" : " ") : ""}</span>
      <span class="ui-cm__sr" role="alert">${said.alert ? said.text + (said.n % 2 ? "" : " ") : ""}</span>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="cm"] {
  box-sizing: border-box;
  position: relative;
  container-type: inline-size;
  display: grid;
  width: 100%;
  max-width: 600px;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  color: var(--tc-text-secondary);
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="cm"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cm"] {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift, like a popover */
  box-sizing: border-box;
  position: relative;
  container-type: inline-size;
  display: grid;
  width: 100%;
  max-width: 600px;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="cm"] *, [data-ui="cm"] *::before, [data-ui="cm"] *::after { box-sizing: border-box; }
:where([data-ui="cm"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where([data-ui="cm"]) svg { display: block; flex: none; }
/* The white card: search and results */
:where([data-look="standard"], [data-look="standard"] *).ui-cm__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="standard"], [data-look="standard"] *).ui-cm__search { display: flex; align-items: center; gap: var(--tc-space-2-5); height: 52px; padding: 0 var(--tc-space-4); border-bottom: 1px solid var(--tc-border-default); cursor: text; }
:where([data-look="standard"], [data-look="standard"] *).ui-cm__search > svg { width: 18px; height: 18px; fill: none; stroke: var(--tc-text-muted); stroke-width: 1.8; stroke-linecap: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-cm__search input { flex: 1; min-width: 0; padding: 0; border: 0; background: transparent; font: inherit; font-size: var(--tc-font-size-lg-plus); color: var(--tc-text-primary); outline: none; }
/* One white panel: search, results and the last row – the edge is a shadow, not a border */
:where([data-look="clean"], [data-look="clean"] *).ui-cm__card { overflow: hidden; border-radius: var(--tc-radius-xl); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-overlay); }
/* Search row */
:where([data-look="clean"], [data-look="clean"] *).ui-cm__search { display: flex; align-items: center; gap: var(--tc-space-3); height: 48px; padding: 0 var(--tc-space-3) 0 var(--tc-space-3-5); border-bottom: 0.5px solid var(--tc-border-default); cursor: text; }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__search > svg { width: 16px; height: 16px; fill: none; stroke: var(--tc-icon-muted); stroke-width: 1.1; stroke-linecap: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__search input { flex: 1; min-width: 0; height: 20px; padding: 0; border: 0; background: transparent; font: inherit; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); caret-color: var(--tc-accent); outline: none; }
.ui-cm__search input::placeholder { color: var(--tc-text-muted); }
/* The field's focus ring goes round the whole panel (the search field is its first row); the input itself draws none */
.ui-cm__card:has(input:focus-visible) { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-look="standard"], [data-look="standard"] *).ui-cm__enter { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); letter-spacing: var(--tc-tracking-caps); text-transform: uppercase; color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-cm__enter svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-cm__list { position: relative; max-height: 340px; padding: var(--tc-space-1) var(--tc-space-1-5) var(--tc-space-2); overflow-y: auto; scrollbar-width: thin; transition: height var(--tc-duration-slow) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__enter svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.1; stroke-linecap: round; stroke-linejoin: round; }
/* Results */
:where([data-look="clean"], [data-look="clean"] *).ui-cm__list { position: relative; max-height: 360px; padding: 0 var(--tc-space-1) var(--tc-space-1); overflow-y: auto; scrollbar-width: thin; transition: height var(--tc-duration-slow) var(--tc-ease-move); }
.ui-cm__group { display: flex; flex-direction: column; }
.ui-cm__label { padding: var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-1); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
:where([data-look="standard"], [data-look="standard"] *).ui-cm__pill {
  position: absolute;
  top: 0;
  left: 6px;
  right: 6px;
  border-radius: var(--tc-radius-lg);
  background: var(--tc-fill-default);
  transition: transform var(--tc-duration-base) var(--tc-ease-move), height var(--tc-duration-base) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-cm__item { position: relative; display: flex; align-items: center; gap: var(--tc-space-3); height: 40px; padding: 0 var(--tc-space-2-5); border-radius: var(--tc-radius-lg); text-align: left; }
:where([data-look="standard"], [data-look="standard"] *).ui-cm__logo {
  display: grid;
  place-items: center;
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: var(--tc-radius-sm);
  background: var(--tc-surface-overlay);
  box-shadow: inset 0 0 0 1px var(--tc-border-default);
  color: var(--tc-text-primary);
}
:where([data-look="standard"], [data-look="standard"] *).ui-cm__logo svg { width: 14px; height: 14px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cm__icon { display: grid; place-items: center; flex: none; width: 26px; height: 26px; color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-cm__glyph { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__label { padding: var(--tc-space-2-5) var(--tc-space-2) var(--tc-space-1); }
/* With text typed, the assistant row sits on top without a label */
:where([data-look="clean"], [data-look="clean"] *).ui-cm__group:first-child:not(:has(.ui-cm__label)) { padding-top: var(--tc-space-1); }
/* The highlight follows the active row */
:where([data-look="clean"], [data-look="clean"] *).ui-cm__pill {
  position: absolute;
  top: 0;
  left: 4px;
  right: 4px;
  border-radius: var(--tc-radius-sm);
  background: var(--tc-fill-default);
  opacity: 0;
  /* A short, crisp move between rows – no long glide; it fades out when the pointer leaves the list */
  transition: transform var(--tc-duration-instant) var(--tc-ease-move), height var(--tc-duration-instant) var(--tc-ease-move), opacity var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-cm__pill[data-lit] { opacity: 1; }
/* While the field has focus the active row is the Enter target: it stays lit and gets a ≥3:1 edge, not only a faint fill */
[data-ui="cm"]:has(input:focus) .ui-cm__pill { opacity: 1; box-shadow: inset 0 0 0 1px var(--tc-border-selected); }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__item { position: relative; display: flex; align-items: center; gap: var(--tc-space-2-5); height: 36px; padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-sm); text-align: left; }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__logo {
  display: grid;
  place-items: center;
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: var(--tc-radius-xs);
  background: var(--tc-surface-overlay);
  box-shadow: 0 0 0 0.5px var(--tc-border-strong), var(--tc-shadow-control);
  color: var(--tc-text-strong);
}
:where([data-look="clean"], [data-look="clean"] *).ui-cm__logo svg { width: 12px; height: 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__icon { display: grid; place-items: center; flex: none; width: 20px; height: 20px; color: var(--tc-icon-muted); transition: color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.1; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__glyph path { vector-effect: non-scaling-stroke; }
.ui-cm__item[aria-selected="true"] .ui-cm__icon { color: var(--tc-text-primary); }
.ui-cm__text { display: flex; flex: 1; align-items: baseline; gap: var(--tc-space-2); min-width: 0; }
.ui-cm__name { overflow: hidden; color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
.ui-cm__hint { overflow: hidden; color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
[data-ui="cm"] mark { border-radius: var(--tc-radius-2xs); background: var(--tc-accent-highlight); color: inherit; }
:where([data-look="standard"], [data-look="standard"] *).ui-cm__keys { display: inline-flex; flex: none; gap: var(--tc-space-1); }
[data-ui="cm"] kbd {
  display: inline-grid;
  place-items: center;
  min-width: var(--tc-kbd-h);
  height: var(--tc-kbd-h);
  padding: 0 var(--tc-kbd-px);
  border-radius: var(--tc-kbd-radius);
  background: var(--tc-kbd-bg);
  box-shadow: var(--tc-kbd-shadow);
  font-family: inherit;
  font-size: var(--tc-kbd-font-size);
  font-weight: var(--tc-kbd-font-weight);
  line-height: var(--tc-line-height-none);
  color: var(--tc-kbd-fg);
  transition: color var(--tc-duration-fast) var(--tc-ease-standard);
}
/* Keyboard hints: small chips with an inset hairline */
:where([data-look="clean"], [data-look="clean"] *).ui-cm__keys { display: inline-flex; flex: none; gap: var(--tc-space-0-5); }
.ui-cm__item[aria-selected="true"] kbd { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__enter { padding: 0 var(--tc-space-1); color: var(--tc-icon-muted); }
/* A short flash on the row that just ran */
.ui-cm__item[data-ran] { animation: ui-cm-ran var(--tc-duration-slowest) var(--tc-ease-move); }
@keyframes ui-cm-ran { 30% { transform: scale(0.985); } }
/* The tray below the card */
:where([data-look="standard"], [data-look="standard"] *).ui-cm__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); height: 38px; padding: 0 var(--tc-space-3); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-cm__foot > span { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
/* The last row of the panel */
:where([data-look="clean"], [data-look="clean"] *).ui-cm__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3);
  height: 40px;
  padding: 0 var(--tc-space-3);
  border-top: 0.5px solid var(--tc-border-default);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  color: var(--tc-text-muted);
}
:where([data-look="clean"], [data-look="clean"] *).ui-cm__foot > span { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; white-space: nowrap; }
.ui-cm__done { color: var(--tc-text-primary); animation: ui-cm-in var(--tc-duration-moderate) var(--tc-ease-move); }
:where([data-look="standard"], [data-look="standard"] *).ui-cm__done svg { width: 14px; height: 14px; fill: none; stroke: var(--tc-status-success-solid); stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__done-text { overflow: hidden; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__done svg { width: 16px; height: 16px; fill: none; stroke: var(--tc-status-success-solid); stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__foot-right { flex: none; }
.ui-cm__done[data-state="pending"] { color: var(--tc-text-muted); }
.ui-cm__done[data-state="failed"] { color: var(--tc-status-danger-fg); }
.ui-cm__done[data-state="failed"] svg { stroke: var(--tc-status-danger-solid); }
@keyframes ui-cm-in { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }
/* Narrow (phones): no shortcut keys – there's no keyboard to use them with. Hints stay (they ellipsize) */
@container (max-width: 480px) {
.ui-cm__item .ui-cm__keys,
.ui-cm__foot > .ui-cm__foot-right,
.ui-cm__foot > .ui-cm__tip,
.ui-cm__enter { display: none; }
.ui-cm__list { max-height: 360px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cm__item { height: 44px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__item { height: 40px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__foot:not(:has(.ui-cm__done)) { display: none; }
}
/* Touch screens: taller rows */
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-cm__item { height: 44px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__search { height: 52px; }
}
.ui-cm__more { margin: 0; padding: var(--tc-space-2) var(--tc-space-3-5) var(--tc-space-2-5); border-top: var(--tc-hairline) solid var(--tc-divider); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-cm__sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
@media (prefers-reduced-motion: reduce) {
  [data-ui="cm"] *, [data-ui="cm"] *::before, [data-ui="cm"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-command-menu")) customElements.define("tc-command-menu", TcCommandMenu);

declare global {
  interface HTMLElementTagNameMap {
    "tc-command-menu": TcCommandMenu;
  }
}
