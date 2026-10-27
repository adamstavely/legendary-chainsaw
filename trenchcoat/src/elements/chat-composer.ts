import { html, render as litRender, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { live } from "lit/directives/live.js";
import { styleMap } from "lit/directives/style-map.js";
import "./context-tray";
import type { ContextTrayItem, ContextTrayItemsChange } from "./context-tray";
import { TcElement } from "./internal/base";
import "./mention-picker";
import type { MentionPickerGroup, MentionPickerItem, MentionPickerOpenChange, MentionPickerPick, MentionPickerTrigger, TcMentionPicker } from "./mention-picker";
import "./model-picker";
import type { PickerModel } from "./model-picker";
import "./model-settings";
import type { ModelSettingsChange, ModelSettingsModel, ModelSettingsValue } from "./model-settings";
import "./prompt-library";
import type { PromptTemplate, PromptValues } from "./prompt-library";
import { FocusRescueController, ToolbarController, rescueFocus } from "./internal/controllers";
import { compact } from "./internal/format";
import type { Look } from "./internal/look";
import { PopoverController } from "./internal/popover";

/*
 * <tc-chat-composer> – the Lit port of src/components/chat-composer.tsx: the message box of an AI chat, with a model
 * picker, voice input, attachments, "Connect apps" / "Select a project" and "Request approval".
 *
 *   <tc-chat-composer placeholder="Ask anything…" demo></tc-chat-composer>
 *
 * Standard is a white card on a gray tray that holds "Connect apps" / "Select a project" above it, and scales with
 * its width (calc(n * --u)); the message shows one line and grows to two. Clean is one white card with hairline
 * shadows and fixed px sizes: the message on top (growing up to four lines), the tools in a row below it, and a quiet
 * last row that connects apps and then lets you pick a project; its icons are 16px glyphs with thin lines and solid
 * shapes.
 *
 * The toolbar row (remediation 6.3) – every part optional and off by default, so a composer without them is unchanged.
 * It sits under the composer, with the disclaimer under it:
 *   · model – `model-switcher="toolbar"` moves the model switch out of the card into tc-model-picker's menu (same
 *     `models`, same cancelable tc-model-change)
 *   · settings – `settings` (a ModelSettingsValue) turns on a button that opens tc-model-settings in a popover; changes
 *     come as a cancelable tc-settings-change
 *   · prompts – `prompts` (PromptTemplate[]) turns on a button that opens tc-prompt-library in a popover; Use fires a
 *     cancelable tc-prompt-pick and, unless prevented, inserts the prompt at the caret (over any selection) and closes
 *   · page context – `pageContext` turns on a chip that connects or disconnects what's on the page; toggling it, or
 *     removing an attached item (shown in a tc-context-tray popover), is a cancelable tc-page-context-change
 *   · disclaimer – one quiet line under it all, which also describes the message field
 * Keyboard: the row is a WAI-ARIA toolbar – one Tab stop, ← → Home End. Popovers close on Escape and give focus back.
 * When the row doesn't fit (and always at 400px or less) the settings and prompts buttons and the model switch keep
 * only their icons (their names stay); when it still doesn't fit, settings and prompts move into a "More" menu.
 *
 * Skills (remediation 7.2) – `skills` (ChatSkill[]) turns on slash commands, through the same tc-mention-picker as
 * `mentions` (one popup; with both, @ mentions and / skills share it, and a "/" trigger in `mentions` gives way):
 *   · typing / at the start of a line opens the list – recent skills first (`recentSkills`, or the picks made in this
 *     composer), then the rest grouped by `source`; typing ranks one list by name start, word start, description
 *   · a pick puts "/name " at the start of the message, drawn as a token behind the text (a mirror layer under the
 *     text area), with the skill's `argumentHint` greyed after it until arguments are typed. Backspace right after
 *     the token, or Delete before it, removes it whole; typing inside it moves on past it
 *   · one skill per message: / on a later line, or / before the token, offers to replace it; closing that list
 *     without a pick puts the old token back
 *   · tc-skill-change is cancelable for picks, replacements and removals; tc-send and onSend carry `skill` and `args`
 *   · a "/" button by the attach button (hide-skills-button leaves it out) opens the list for people who don't know
 *     the shortcut; `searchSkills` finds skills on the app's side, with loading and error states
 * The text area stays the combobox; the token and the hint are read with it (aria-describedby) and picks are said.
 */

type Step = "idle" | "loading" | "done";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
  /** The model's logo, an element that's cloned */
  logo?: Element;
  /** In the toolbar's model menu: strengths from 1 to 5 (cost 5 is the most expensive) */
  speed?: number;
  quality?: number;
  cost?: number;
  /** In the toolbar's model menu: typical time to the first token, in milliseconds */
  latencyMs?: number;
  /** In the toolbar's model menu: price per million output tokens, in dollars */
  pricePerM?: number;
};

/** What's on the page the composer sits beside – the app decides what is actually sent */
export type ChatPageContext = {
  /** What the page is, e.g. "Q3 report" */
  title: string;
  /** Whether the model can see it */
  connected: boolean;
  /** How many items are attached – shown as "4 items" */
  count?: number;
  /** The app's token estimate – shown as "2.4k tokens" when there is no count */
  tokens?: number;
  /** The attached items; while connected, a button beside the chip shows them in a context tray */
  items?: ContextTrayItem[];
};
/** tc-page-context-change: the next page context and what changed */
export type ChatPageContextChange = { pageContext: ChatPageContext; change: "connect" | "disconnect" | "items" };
/** tc-prompt-pick: the finished prompt from the library, its template and the variables' values */
export type ChatPromptPick = { prompt: string; template: PromptTemplate; values: Record<string, string> };
/** tc-settings-change: the next settings and the parameter ids that changed */
export type ChatSettingsChange = ModelSettingsChange;

type Panel = "" | "settings" | "prompts" | "page" | "more";

/** An agent skill – a slash command a message can start with */
export type ChatSkill = {
  id: string;
  /** What follows the slash, e.g. "translate" – no spaces */
  name: string;
  /** One line on what it does */
  description?: string;
  /** Where it comes from – "Built-in", "Your team", a plugin's name. The list groups by it */
  source?: string;
  /** More words that should find it */
  keywords?: string;
  /** What to type after it, greyed after the token until something is typed, e.g. "<language>" */
  argumentHint?: string;
  /** An icon element, cloned per row */
  icon?: Element;
};
/** The picked skill as tc-send and onSend carry it */
export type ChatSkillRef = { id: string; name: string };
/** tc-skill-change: the skill now (null: none), the one before, and why. Cancelable for pick, replace and remove */
export type ChatSkillChange = { skill: ChatSkill | null; previous: ChatSkill | null; reason: "pick" | "replace" | "remove" | "edit" | "send" };
/** Finds skills for what's typed after the slash, on the app's side. The signal aborts when the query changes or the list closes */
export type ChatSkillSearch = (query: string, options: { signal: AbortSignal }) => ChatSkill[] | Promise<ChatSkill[]>;
/** tc-send's detail, and onSend's details plus the message: `message` is the whole text, the token included */
export type ChatSend = { message: string; model: string; skill: ChatSkillRef | null; args: string };
/** What onSend gets after the message */
export type ChatSendDetails = Omit<ChatSend, "message">;

/** The token a skill puts at the start of the message */
const tokenOf = (s: { name: string }) => `/${s.name}`;
/** Whether the text starts with the skill's token, followed by white space or nothing */
const hasToken = (text: string, s: { name: string }) => {
  const t = tokenOf(s);
  return text.startsWith(t) && (text.length === t.length || /\s/.test(text[t.length]));
};
/** An argument hint as a screen reader should say it: "<language>" → "language" */
const spoken = (hint: string) => hint.replace(/[<>[\]{}]/g, "").trim();
/** How many recent skills lead the list */
const RECENT_SKILLS = 5;

/** A live speech-to-text session: push the transcript and the input level; stop when `signal` aborts */
export type ChatDictationSession = {
  onTranscript: (text: string) => void;
  onLevel: (level: number) => void;
  signal: AbortSignal;
};

/** Shown in the picker when the models list is empty */
const NO_MODEL: ChatModel = { id: "", name: "No model", description: "" };

/** Number of samples in the audio trace next to the recording controls */
const TRACE = 16;
const silentTrace = () => Array.from({ length: TRACE }, () => 0);

/** Clean: the message grows with the text up to this many lines, then scrolls (Standard: up to two) */
const MAX_LINES = 4;

const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Warns once per page – not per instance or per feature – when a missing handler is simulated
let warnedSimulation = false;
const warnSimulation = (handler: string, what: string) => {
  if (warnedSimulation) return;
  warnedSimulation = true;
  console.warn(
    `ChatComposer: no ${handler} handler – simulating ${what}. Pass \`demo\` to keep the simulation, or the handler to wire it up. The simulation will be off by default in the next major version.`,
  );
};

/** One bar of the audio trace: silence is a dot, sound a bar */
const traceHeight = (clean: boolean, level: number) => (clean ? `${Math.max(2, level * 16)}px` : `calc(${Math.max(8, level * 64)} * var(--u))`);

/** The rectangle the menu has to stay in: the nearest ancestor that clips, otherwise the viewport */
function clippingFrame(from: HTMLElement) {
  for (let el = from.parentElement; el && el !== document.body; el = el.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(el);
    if (overflowX !== "visible" || overflowY !== "visible") return el.getBoundingClientRect();
  }
  return { top: 0, left: 0, right: window.innerWidth, bottom: window.innerHeight };
}

/* ---------- Icons ----------
 * Each icon draws itself in the look of the composer it sits in: Standard's stroke icons share one style,
 * Clean's are 16px glyphs with thin lines and solid shapes. Mic, chevron-down, arrow-up, sparkles, check and x:
 * Lucide (ISC, lucide.dev) */

const stdPlusIcon = html`<svg viewBox="0 0 68.155 68.155" fill="none" aria-hidden="true"><path d="M34.0812 11.3588V56.7954M56.7995 34.0771H11.3629" stroke="currentColor" stroke-width="4.25969" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
const stdHandIcon = html`<svg viewBox="0 0 68.155 68.155" fill="none" class="ui-chat-composer__hand" aria-hidden="true"><path d="M52.5305 32.6557V24.8463C52.5305 22.1016 54.7555 19.8766 57.5001 19.8766C60.2448 19.8766 62.4698 22.1016 62.4698 24.8463V42.027C62.4698 53.3194 53.3154 62.4735 42.0233 62.4735H34.2388M22.7127 39.7552L15.94 31.8537C14.8314 30.5602 13.2129 29.8159 11.5094 29.8159H11.1235C8.11379 29.8159 5.67395 32.2558 5.67395 35.2655C5.67395 36.3412 5.99241 37.393 6.58919 38.2881L16.4118 53.0221C20.3482 58.9269 26.9753 62.4735 34.0719 62.4735" stroke="currentColor" stroke-width="4.25969" stroke-linecap="round" stroke-linejoin="round"></path><path d="M52.534 24.1378V16.3284C52.534 13.5837 50.3091 11.3588 47.5644 11.3588C44.8197 11.3588 42.5948 13.5837 42.5948 16.3284V29.8174" stroke="currentColor" stroke-width="4.25969" stroke-linecap="round" stroke-linejoin="round"></path><path d="M42.5958 29.8198V10.6513C42.5958 7.90661 40.3708 5.68163 37.6262 5.68163C34.8815 5.68163 32.6565 7.90661 32.6565 10.6513V28.4" stroke="currentColor" stroke-width="4.25969" stroke-linecap="round" stroke-linejoin="round"></path><path d="M32.6576 28.3975V16.3284C32.6576 13.5837 30.4326 11.3588 27.6879 11.3588C24.9433 11.3588 22.7183 13.5837 22.7183 16.3284V39.7567" stroke="currentColor" stroke-width="4.25969" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
const stdShieldIcon = html`<svg viewBox="0 0 66.543 66.543" fill="none" class="ui-chat-composer__shield" aria-hidden="true"><path d="M33.2482 22.1795V33.27" stroke="#F44900" stroke-width="4.15894" stroke-linecap="round" stroke-linejoin="round"></path><path d="M33.5966 43.67H33.2501M33.9432 43.67C33.9432 44.0529 33.633 44.3631 33.2501 44.3631C32.8672 44.3631 32.5569 44.0529 32.5569 43.67C32.5569 43.2871 32.8672 42.9768 33.2501 42.9768C33.633 42.9768 33.9432 43.2871 33.9432 43.67Z" stroke="#F44900" stroke-width="4.15894" stroke-linecap="round" stroke-linejoin="round"></path><path d="M58.202 31.0087V22.9595C58.202 18.4124 58.202 16.1389 57.0816 14.6555C55.9612 13.1722 53.4278 12.452 48.3612 11.0118C44.8995 10.0278 41.848 8.84228 39.41 7.76002C36.0859 6.28445 34.4237 5.54666 33.2484 5.54666C32.0728 5.54666 30.4109 6.28445 27.0868 7.76002C24.6487 8.84228 21.5973 10.0278 18.1357 11.0118C13.069 12.452 10.5356 13.1722 9.4152 14.6555C8.29475 16.1389 8.29475 18.4124 8.29475 22.9595V31.0087C8.29475 46.605 22.3319 55.9626 29.3498 59.6666C31.0331 60.5549 31.8748 60.9991 33.2484 60.9991C34.622 60.9991 35.4635 60.5549 37.1467 59.6666C44.1648 55.9626 58.202 46.605 58.202 31.0087Z" stroke="#F44900" stroke-width="4.15894" stroke-linecap="round"></path></svg>`;
const stdMicIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19v3"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><rect x="9" y="2" width="6" height="13" rx="3"></rect></svg>`;
const stdChevronIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>`;
const stdArrowUpIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 7-7 7 7"></path><path d="M12 19V5"></path></svg>`;
const stdFolderIcon = html`<svg viewBox="0 0 67 67" fill="none" aria-hidden="true"><path d="M11.1704 15.3527V30.7069H55.837V23.7277C55.837 19.8732 52.7123 16.7485 48.8578 16.7485H33.5037L29.5778 10.8598C28.5423 9.30649 26.799 8.37352 24.9322 8.37352H18.1495C14.295 8.37352 11.1704 11.4982 11.1704 15.3527Z" fill="#00A1FF"></path><path d="M33.5037 16.7485L29.5778 10.8598C28.5423 9.30649 26.799 8.37352 24.9322 8.37352H18.1495C14.295 8.37352 11.1704 11.4982 11.1704 15.3527V30.7068H55.837V23.7277C55.837 19.8732 52.7123 16.7485 48.8578 16.7485H33.5037ZM33.5037 16.7485H23.7328" stroke="#00A1FF" stroke-width="4.1875" stroke-linecap="round" stroke-linejoin="round"></path><path opacity="0.4" d="M6.59197 42.3758C5.54336 37.1185 5.01906 34.4899 6.50878 32.7085C6.6081 32.5899 6.71315 32.4751 6.82359 32.3646C8.47975 30.71 11.4107 30.71 17.2725 30.71H49.7312C55.5931 30.71 58.5238 30.71 60.1801 32.3646C60.2904 32.4751 60.3957 32.5899 60.495 32.7085C61.9847 34.4899 61.4604 37.1185 60.4118 42.3758C58.9041 49.9348 58.15 53.7144 55.3073 56.0363C55.1133 56.1945 54.9134 56.3467 54.7076 56.4921C51.6932 58.6266 47.4792 58.6266 39.0506 58.6266H27.9531C19.5246 58.6266 15.3104 58.6266 12.296 56.4921C12.0904 56.3467 11.8904 56.1945 11.6965 56.0363C8.85353 53.7144 8.09969 49.9348 6.59197 42.3758Z" fill="#929292"></path><path d="M6.59197 42.3758C5.54336 37.1185 5.01906 34.4899 6.50878 32.7085C6.6081 32.5899 6.71315 32.4751 6.82359 32.3646C8.47975 30.71 11.4107 30.71 17.2725 30.71H49.7312C55.5931 30.71 58.5238 30.71 60.1801 32.3646C60.2904 32.4751 60.3957 32.5899 60.495 32.7085C61.9847 34.4899 61.4604 37.1185 60.4118 42.3758C58.9041 49.9348 58.15 53.7144 55.3073 56.0363C55.1133 56.1945 54.9134 56.3467 54.7076 56.4921C51.6932 58.6266 47.4792 58.6266 39.0506 58.6266H27.9531C19.5246 58.6266 15.3104 58.6266 12.296 56.4921C12.0904 56.3467 11.8904 56.1945 11.6965 56.0363C8.85353 53.7144 8.09969 49.9348 6.59197 42.3758Z" fill="#3CC7FF" stroke="#3CC7FF" stroke-width="4.1875"></path></svg>`;
const cleanPlusIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5c.28 0 .5.22.5.5v4.5H13a.5.5 0 0 1 0 1H8.5V13a.5.5 0 0 1-1 0V8.5H3a.5.5 0 0 1 0-1h4.5V3c0-.28.22-.5.5-.5Z"></path></svg>`;
const cleanHandIcon = html`<svg viewBox="0 0 68.155 68.155" fill="none" class="ui-chat-composer__hand" aria-hidden="true"><path d="M52.5305 32.6557V24.8463C52.5305 22.1016 54.7555 19.8766 57.5001 19.8766C60.2448 19.8766 62.4698 22.1016 62.4698 24.8463V42.027C62.4698 53.3194 53.3154 62.4735 42.0233 62.4735H34.2388M22.7127 39.7552L15.94 31.8537C14.8314 30.5602 13.2129 29.8159 11.5094 29.8159H11.1235C8.11379 29.8159 5.67395 32.2558 5.67395 35.2655C5.67395 36.3412 5.99241 37.393 6.58919 38.2881L16.4118 53.0221C20.3482 58.9269 26.9753 62.4735 34.0719 62.4735" stroke="currentColor" stroke-width="4.7" stroke-linecap="round" stroke-linejoin="round"></path><path d="M52.534 24.1378V16.3284C52.534 13.5837 50.3091 11.3588 47.5644 11.3588C44.8197 11.3588 42.5948 13.5837 42.5948 16.3284V29.8174" stroke="currentColor" stroke-width="4.7" stroke-linecap="round" stroke-linejoin="round"></path><path d="M42.5958 29.8198V10.6513C42.5958 7.90661 40.3708 5.68163 37.6262 5.68163C34.8815 5.68163 32.6565 7.90661 32.6565 10.6513V28.4" stroke="currentColor" stroke-width="4.7" stroke-linecap="round" stroke-linejoin="round"></path><path d="M32.6576 28.3975V16.3284C32.6576 13.5837 30.4326 11.3588 27.6879 11.3588C24.9433 11.3588 22.7183 13.5837 22.7183 16.3284V39.7567" stroke="currentColor" stroke-width="4.7" stroke-linecap="round" stroke-linejoin="round"></path></svg>`;
const cleanShieldIcon = html`<svg viewBox="0 0 66.543 66.543" fill="none" class="ui-chat-composer__shield" aria-hidden="true"><path d="M33.2482 22.1795V33.27" stroke="currentColor" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"></path><path d="M33.5966 43.67H33.2501M33.9432 43.67C33.9432 44.0529 33.633 44.3631 33.2501 44.3631C32.8672 44.3631 32.5569 44.0529 32.5569 43.67C32.5569 43.2871 32.8672 42.9768 33.2501 42.9768C33.633 42.9768 33.9432 43.2871 33.9432 43.67Z" stroke="currentColor" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"></path><path d="M58.202 31.0087V22.9595C58.202 18.4124 58.202 16.1389 57.0816 14.6555C55.9612 13.1722 53.4278 12.452 48.3612 11.0118C44.8995 10.0278 41.848 8.84228 39.41 7.76002C36.0859 6.28445 34.4237 5.54666 33.2484 5.54666C32.0728 5.54666 30.4109 6.28445 27.0868 7.76002C24.6487 8.84228 21.5973 10.0278 18.1357 11.0118C13.069 12.452 10.5356 13.1722 9.4152 14.6555C8.29475 16.1389 8.29475 18.4124 8.29475 22.9595V31.0087C8.29475 46.605 22.3319 55.9626 29.3498 59.6666C31.0331 60.5549 31.8748 60.9991 33.2484 60.9991C34.622 60.9991 35.4635 60.5549 37.1467 59.6666C44.1648 55.9626 58.202 46.605 58.202 31.0087Z" stroke="currentColor" stroke-width="4.6" stroke-linecap="round"></path></svg>`;
const cleanMicIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19v3"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><rect x="9" y="2" width="6" height="13" rx="3"></rect></svg>`;
const cleanChevronIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>`;
const cleanArrowUpIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 7-7 7 7"></path><path d="M12 19V5"></path></svg>`;
const cleanFolderIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4.25C2 3.56 2.56 3 3.25 3h2.88c.33 0 .65.13.88.37L8.13 4.5h4.62c.69 0 1.25.56 1.25 1.25v.75H2V4.25Z"></path><path d="M2 7.5h12v4.25c0 .69-.56 1.25-1.25 1.25h-9.5C2.56 13 2 12.44 2 11.75V7.5Z" opacity="0.72"></path></svg>`;
const cleanSparklesIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"></path><path d="M20 2v4"></path><path d="M22 4h-4"></path><circle cx="4" cy="20" r="2"></circle></svg>`;
const cleanTickIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>`;
const cleanCancelIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>`;
const chevronRightIcon = html`<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M8.14 5.73a.38.38 0 0 1 0 .54L5.4 9a.38.38 0 0 1-.53-.53L7.34 6 4.88 3.53a.38.38 0 0 1 .53-.53l2.73 2.73Z"></path></svg>`;
const gmailLogo = (id: string) => html`<svg viewBox="0 0 56.4108 44.8722" fill="none" aria-hidden="true"><path d="M44.2255 5.76727H56.4051V41.0239C56.4051 43.148 54.683 44.8701 52.5589 44.8701H46.1486C45.8961 44.8701 45.646 44.8204 45.4127 44.7237C45.1794 44.6271 44.9674 44.4854 44.7888 44.3069C44.6102 44.1283 44.4686 43.9163 44.3719 43.683C44.2753 43.4497 44.2255 43.1996 44.2255 42.947V5.76727Z" fill="url(#${id}-0)"></path><path d="M12.1796 5.76727H0V41.0239C0 43.148 1.72213 44.8701 3.84618 44.8701H10.2565C10.509 44.8701 10.7591 44.8204 10.9924 44.7237C11.2257 44.6271 11.4377 44.4854 11.6163 44.3069C11.7949 44.1283 11.9365 43.9163 12.0332 43.683C12.1298 43.4497 12.1796 43.1996 12.1796 42.947V5.76727Z" fill="#FC413D"></path><path d="M10.0085 1.42778C7.43377 -0.736342 3.5924 -0.403647 1.42828 2.17105C-0.735843 4.74543 -0.403148 8.58681 2.17155 10.7512L26.5557 31.2479C27.0178 31.6362 27.602 31.8492 28.2056 31.8492C28.8091 31.8492 29.3934 31.6362 29.8554 31.2479L54.2396 10.7509C56.814 8.58681 57.1467 4.74543 54.9825 2.17073C52.8184 -0.403648 48.977 -0.736342 46.4027 1.42778L28.2054 16.724L10.0085 1.42778Z" fill="url(#${id}-1)"></path><defs><linearGradient id="${id}-0" x1="50.3153" y1="5.76727" x2="50.3153" y2="44.8701" gradientUnits="userSpaceOnUse" ><stop stop-color="#60D673"></stop><stop offset="0.17" stop-color="#42C868"></stop><stop offset="0.39" stop-color="#0EBC5F"></stop><stop offset="0.62" stop-color="#00A9BB"></stop><stop offset="0.86" stop-color="#3C90FF"></stop><stop offset="1" stop-color="#3186FF"></stop></linearGradient><linearGradient id="${id}-1" x1="6.04194e-05" y1="6.45153" x2="56.4107" y2="6.45153" gradientUnits="userSpaceOnUse" ><stop offset="0.08" stop-color="#FF63A0"></stop><stop offset="0.3" stop-color="#FC413D"></stop><stop offset="0.5" stop-color="#FC413D"></stop><stop offset="0.65" stop-color="#FC413D"></stop><stop offset="0.72" stop-color="#FC5C30"></stop><stop offset="0.86" stop-color="#FEB10C"></stop><stop offset="0.91" stop-color="#FEC700"></stop><stop offset="0.96" stop-color="#FFDB0F"></stop></linearGradient></defs></svg>`;
const slackLogo = html`<svg viewBox="0 0 49.883 49.877" fill="none" aria-hidden="true"><g transform="translate(0 0)"><path d="M18.3549 10.4784C15.4713 10.4784 13.1157 8.12279 13.1157 5.2392C13.1157 2.35561 15.4713 0 18.3549 0C21.2385 0 23.5941 2.35561 23.5941 5.2392V10.4784H18.3549Z" fill="#36C5F0"></path><path d="M18.3575 13.12C21.2411 13.12 23.5967 15.4756 23.5967 18.3592C23.5967 21.2428 21.2411 23.5984 18.3575 23.5984H5.2392C2.35561 23.5984 0 21.2428 0 18.3592C0 15.4756 2.35561 13.12 5.2392 13.12H18.3575Z" fill="#36C5F0"></path></g><g transform="translate(26.28 0)"><path d="M13.1244 18.3592C13.1244 15.4756 15.48 13.12 18.3636 13.12C21.2472 13.12 23.6028 15.4756 23.6028 18.3592C23.6028 21.2428 21.2472 23.5984 18.3636 23.5984H13.1244V18.3592Z" fill="#2EB67D"></path><path d="M10.4785 18.3575C10.4785 21.2411 8.12286 23.5967 5.23927 23.5967C2.35568 23.5967 7.4362e-05 21.2411 7.4362e-05 18.3575V5.2392C7.4362e-05 2.35561 2.35568 0 5.23927 0C8.12286 0 10.4785 2.35561 10.4785 5.2392V18.3575Z" fill="#2EB67D"></path></g><g transform="translate(0 26.28)"><path d="M10.4784 5.2392C10.4784 8.12279 8.12279 10.4784 5.2392 10.4784C2.35561 10.4784 0 8.12279 0 5.2392C0 2.35561 2.35561 0 5.2392 0H10.4784V5.2392Z" fill="#E01E5A"></path><path d="M13.1157 5.2392C13.1157 2.35561 15.4713 0 18.3549 0C21.2385 0 23.5941 2.35561 23.5941 5.2392V18.3575C23.5941 21.2411 21.2385 23.5967 18.3549 23.5967C15.4713 23.5967 13.1157 21.2411 13.1157 18.3575V5.2392Z" fill="#E01E5A"></path></g><g transform="translate(26.28 26.28)"><path d="M5.23927 13.1157C8.12286 13.1157 10.4785 15.4713 10.4785 18.3549C10.4785 21.2385 8.12286 23.5941 5.23927 23.5941C2.35568 23.5941 7.4362e-05 21.2385 7.4362e-05 18.3549V13.1157H5.23927Z" fill="#ECB22E"></path><path d="M5.23927 10.4784C2.35568 10.4784 7.4362e-05 8.12279 7.4362e-05 5.2392C7.4362e-05 2.35561 2.35568 0 5.23927 0H18.3576C21.2412 0 23.5968 2.35561 23.5968 5.2392C23.5968 8.12279 21.2412 10.4784 18.3576 10.4784H5.23927Z" fill="#ECB22E"></path></g></svg>`;
const clickUpLogo = (id: string) => html`<svg viewBox="0 0 49.7096 59.6884" fill="none" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M0 45.9002L9.1618 38.8247C14.0602 45.1745 19.2307 48.1679 24.9455 48.1679C30.6603 48.1679 35.7401 45.2652 40.3663 38.9154L49.7096 45.8094C42.997 54.8805 34.6516 59.6882 24.9455 59.6882C15.3301 59.6882 6.89403 54.8805 0 45.9002Z" fill="url(#${id}-0)"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M24.9535 15.3301L8.62558 29.3903L1.09657 20.5914L25.0442 0L48.8105 20.5914L41.1908 29.2996L24.9535 15.3301Z" fill="url(#${id}-1)"></path><defs><linearGradient id="${id}-0" x1="0" y1="49.2666" x2="49.75" y2="49.2666" gradientUnits="userSpaceOnUse"><stop stop-color="#8930FD"></stop><stop offset="1" stop-color="#49CCF9"></stop></linearGradient><linearGradient id="${id}-1" x1="1.09231" y1="14.6901" x2="48.7603" y2="14.6901" gradientUnits="userSpaceOnUse" ><stop stop-color="#FF02F0"></stop><stop offset="1" stop-color="#FFC800"></stop></linearGradient></defs></svg>`;
const stdSparklesIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"></path><path d="M20 2v4"></path><path d="M22 4h-4"></path><circle cx="4" cy="20" r="2"></circle></svg>`;
const stdTickIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>`;
const stdCancelIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" color="#737373" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>`;
const claudeLogo = html`<svg viewBox="0 0 1200 1200" aria-hidden="true"><path fill="#D97757" d="M 233.959793 800.214905 L 468.644287 668.536987 L 472.590637 657.100647 L 468.644287 650.738403 L 457.208069 650.738403 L 417.986633 648.322144 L 283.892639 644.69812 L 167.597321 639.865845 L 54.926208 633.825623 L 26.577238 627.785339 L 3.3e-05 592.751709 L 2.73832 575.27533 L 26.577238 559.248352 L 60.724873 562.228149 L 136.187973 567.382629 L 249.422867 575.194763 L 331.570496 580.026978 L 453.261841 592.671082 L 472.590637 592.671082 L 475.328857 584.859009 L 468.724915 580.026978 L 463.570557 575.194763 L 346.389313 495.785217 L 219.543671 411.865906 L 153.100723 363.543762 L 117.181267 339.060425 L 99.060455 316.107361 L 91.248367 266.01355 L 123.865784 230.093994 L 167.677887 233.073853 L 178.872513 236.053772 L 223.248367 270.201477 L 318.040283 343.570496 L 441.825592 434.738342 L 459.946411 449.798706 L 467.194672 444.64447 L 468.080597 441.020203 L 459.946411 427.409485 L 392.617493 305.718323 L 320.778564 181.932983 L 288.80542 130.630859 L 280.348999 99.865845 C 277.369171 87.221436 275.194641 76.590698 275.194641 63.624268 L 312.322174 13.20813 L 332.8591 6.604126 L 382.389313 13.20813 L 403.248352 31.328979 L 434.013519 101.71814 L 483.865753 212.537048 L 561.181274 363.221497 L 583.812134 407.919434 L 595.892639 449.315491 L 600.40271 461.959839 L 608.214783 461.959839 L 608.214783 454.711609 L 614.577271 369.825623 L 626.335632 265.61084 L 637.771851 131.516846 L 641.718201 93.745117 L 660.402832 48.483276 L 697.530334 24.000122 L 726.52356 37.852417 L 750.362549 72 L 747.060486 94.067139 L 732.886047 186.201416 L 705.100708 330.52356 L 686.979919 427.167847 L 697.530334 427.167847 L 709.61084 415.087341 L 758.496704 350.174561 L 840.644348 247.490051 L 876.885925 206.738342 L 919.167847 161.71814 L 946.308838 140.29541 L 997.61084 140.29541 L 1035.38269 196.429626 L 1018.469849 254.416199 L 965.637634 321.422852 L 921.825562 378.201538 L 859.006714 462.765259 L 819.785278 530.41626 L 823.409424 535.812073 L 832.75177 534.92627 L 974.657776 504.724915 L 1051.328979 490.872559 L 1142.818848 475.167786 L 1184.214844 494.496582 L 1188.724854 514.147644 L 1172.456421 554.335693 L 1074.604126 578.496765 L 959.838989 601.449829 L 788.939636 641.879272 L 786.845764 643.409485 L 789.261841 646.389343 L 866.255127 653.637634 L 899.194702 655.409424 L 979.812134 655.409424 L 1129.932861 666.604187 L 1169.154419 692.537109 L 1192.671265 724.268677 L 1188.724854 748.429688 L 1128.322144 779.194641 L 1046.818848 759.865845 L 856.590759 714.604126 L 791.355774 698.335754 L 782.335693 698.335754 L 782.335693 703.731567 L 836.69812 756.885986 L 936.322205 846.845581 L 1061.073975 962.81897 L 1067.436279 991.490112 L 1051.409424 1014.120911 L 1034.496704 1011.704712 L 924.885986 929.234924 L 882.604126 892.107544 L 786.845764 811.48999 L 780.483276 811.48999 L 780.483276 819.946289 L 802.550415 852.241699 L 919.087341 1027.409424 L 925.127625 1081.127686 L 916.671204 1098.604126 L 886.469849 1109.154419 L 853.288696 1103.114136 L 785.073914 1007.355835 L 714.684631 899.516785 L 657.906067 802.872498 L 650.979858 806.81897 L 617.476624 1167.704834 L 601.771851 1186.147705 L 565.530212 1200 L 535.328857 1177.046997 L 519.302124 1139.919556 L 535.328857 1066.550537 L 554.657776 970.792053 L 570.362488 894.68457 L 584.536926 800.134277 L 592.993347 768.724976 L 592.429626 766.630859 L 585.503479 767.516968 L 514.22821 865.369263 L 405.825531 1011.865906 L 320.053711 1103.677979 L 299.516815 1111.812256 L 263.919525 1093.369263 L 267.221497 1060.429688 L 287.114136 1031.114136 L 405.825531 880.107361 L 477.422913 786.52356 L 523.651062 732.483276 L 523.328918 724.671265 L 520.590698 724.671265 L 205.288605 929.395935 L 149.154434 936.644409 L 124.993355 914.01355 L 127.973183 876.885986 L 139.409409 864.80542 L 234.201385 799.570435 L 233.879227 799.8927 Z"></path></svg>`;
const chatGPTLogo = html`<svg viewBox="0 0 68.614 68.002" aria-hidden="true"><path fill="currentColor" d="M26.3166 24.7525V18.2923C26.3166 17.7482 26.5208 17.3401 26.9966 17.0684L39.9853 9.5882C41.7533 8.56821 43.8615 8.09244 46.0372 8.09244C54.1973 8.09244 59.3658 14.4167 59.3658 21.1486C59.3658 21.6245 59.3658 22.1686 59.2976 22.7127L45.8331 14.8243C45.0172 14.3486 44.2009 14.3486 43.385 14.8243L26.3166 24.7525ZM56.6454 49.9134V34.4766C56.6454 33.5244 56.2371 32.8444 55.4213 32.3685L38.3529 22.4403L43.9291 19.244C44.405 18.9723 44.8131 18.9723 45.289 19.244L58.2776 26.7242C62.018 28.9005 64.5338 33.5244 64.5338 38.0122C64.5338 43.1802 61.4739 47.9406 56.6454 49.9128V49.9134ZM22.3045 36.3131L16.7284 33.0492C16.2526 32.7775 16.0484 32.3692 16.0484 31.8251V16.8649C16.0484 9.58891 21.6245 4.08038 29.1729 4.08038C32.0293 4.08038 34.6809 5.03262 36.9255 6.7326L23.5292 14.485C22.7134 14.9608 22.3052 15.6408 22.3052 16.5932V36.3137L22.3045 36.3131ZM34.307 43.2491L26.3166 38.7611V29.2412L34.307 24.7532L42.2968 29.2412V38.7611L34.307 43.2491ZM39.4411 63.9219C36.5848 63.9219 33.9333 62.9697 31.6886 61.2699L45.0848 53.5173C45.9007 53.0415 46.3089 52.3615 46.3089 51.4091V31.6886L51.9533 34.9525C52.4291 35.2242 52.6333 35.6324 52.6333 36.1766V51.1369C52.6333 58.4128 46.9889 63.9214 39.4411 63.9214V63.9219ZM23.3245 48.7576L10.3358 41.2775C6.59541 39.1011 4.07967 34.4773 4.07967 29.9894C4.07967 24.7532 7.2078 20.0612 12.0356 18.0889V33.5933C12.0356 34.5455 12.4439 35.2255 13.2597 35.7014L30.2605 45.5613L24.6844 48.7576C24.2086 49.0293 23.8003 49.0293 23.3245 48.7576ZM22.5769 59.9099C14.8926 59.9099 9.24834 54.1297 9.24834 46.9895C9.24834 46.4454 9.31651 45.9013 9.38411 45.3572L22.7804 53.1097C23.5962 53.5856 24.4127 53.5856 25.2284 53.1097L42.2968 43.2498V49.71C42.2968 50.2541 42.0927 50.6622 41.6168 50.9339L28.6283 58.4141C26.8601 59.4341 24.752 59.9099 22.5762 59.9099H22.5769ZM39.4411 68.0017C47.6694 68.0017 54.5372 62.1538 56.1019 54.4013C63.718 52.4291 68.6141 45.2889 68.6141 38.0129C68.6141 33.2526 66.5743 28.6288 62.9021 25.2966C63.2421 23.8685 63.4462 22.4403 63.4462 21.0129C63.4462 11.2887 55.5578 4.01207 46.4454 4.01207C44.6098 4.01207 42.8416 4.28375 41.0735 4.89614C38.0129 1.90392 33.7968 0 29.1729 0C20.9447 0 14.0769 5.84782 12.5122 13.6003C4.89614 15.5725 0 22.7127 0 29.9887C0 34.749 2.03983 39.3728 5.71204 42.705C5.37205 44.1331 5.16797 45.5613 5.16797 46.9889C5.16797 56.713 13.0563 63.9895 22.1686 63.9895C24.0044 63.9895 25.7725 63.7179 27.5407 63.1055C30.6005 66.0977 34.8166 68.0017 39.4411 68.0017Z"></path></svg>`;

const iconsFor = (clean: boolean) => ({
  plus: clean ? cleanPlusIcon : stdPlusIcon,
  hand: clean ? cleanHandIcon : stdHandIcon,
  shield: clean ? cleanShieldIcon : stdShieldIcon,
  mic: clean ? cleanMicIcon : stdMicIcon,
  chevron: clean ? cleanChevronIcon : stdChevronIcon,
  arrowUp: clean ? cleanArrowUpIcon : stdArrowUpIcon,
  folder: clean ? cleanFolderIcon : stdFolderIcon,
  sparkles: clean ? cleanSparklesIcon : stdSparklesIcon,
  tick: clean ? cleanTickIcon : stdTickIcon,
  cancel: clean ? cleanCancelIcon : stdCancelIcon,
});

/* Toolbar icons (Lucide, ISC): sliders, book-open, eye, eye-off, ellipsis, chevron-up – Clean draws thinner lines */
const TOOL_PATHS = {
  settings: svg`<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"></path>`,
  prompts: svg`<path d="M12 7v14"></path><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"></path>`,
  on: svg`<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle>`,
  off: svg`<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"></path><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"></path><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"></path><path d="m2 2 20 20"></path>`,
  more: svg`<circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle>`,
  items: svg`<path d="m18 15-6-6-6 6"></path>`,
};
const toolIcon = (name: keyof typeof TOOL_PATHS, clean: boolean) =>
  html`<svg class="ui-chat-composer__tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=${clean ? 1.5 : 1.75} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TOOL_PATHS[name]}</svg>`;

/** The skills button: a slash in a rounded square (Lucide square-slash, ISC) – Clean draws a thinner line */
const slashIcon = (clean: boolean) =>
  html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=${clean ? 1.6 : 1.5} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"></rect><path d="M9.5 15.5 14.5 8.5"></path></svg>`;

/** The model picker's name in its trigger – hidden (for sight only) when the toolbar is narrow */
const PICKER_NAME = ".ui-mdp__name";

/** "4 items" · "2.4k tokens" – what the page context chip says is attached */
const pageMeta = (pc: ChatPageContext) => (pc.count !== undefined ? `${pc.count} ${pc.count === 1 ? "item" : "items"}` : pc.tokens !== undefined ? `${compact(pc.tokens)} tokens` : "");

/** The default models' logos draw themselves in the composer's look */
const BUILT_IN = new WeakMap<ChatModel, (clean: boolean) => TemplateResult>();

/** The models the composer offers when none are given */
export const defaultChatModels: ChatModel[] = [
  { id: "auto", name: "Auto", description: "Picks the best model for each task" },
  { id: "claude", name: "Claude", description: "Thoughtful writing and code" },
  { id: "chatgpt", name: "ChatGPT", description: "Quick answers for everyday tasks" },
];
BUILT_IN.set(defaultChatModels[0], (clean) => (clean ? cleanSparklesIcon : stdSparklesIcon));
BUILT_IN.set(defaultChatModels[1], () => claudeLogo);
BUILT_IN.set(defaultChatModels[2], () => chatGPTLogo);

/** @internal A default model's logo in a look – for the React wrapper's `defaultModels` */
export const chatModelLogo = (model: ChatModel, look: Look) => BUILT_IN.get(model)?.(look === "clean");

/** A default model's logo as an element, for tc-model-picker (which clones it) – made once per model and look */
const builtInLogos = new WeakMap<ChatModel, Partial<Record<Look, Element>>>();
function builtInLogo(model: ChatModel, look: Look): Element | undefined {
  const tpl = chatModelLogo(model, look);
  if (!tpl) return undefined;
  const byLook = builtInLogos.get(model) ?? {};
  builtInLogos.set(model, byLook);
  if (!byLook[look]) {
    const box = document.createElement("span");
    litRender(tpl, box);
    byLook[look] = box.querySelector("svg") ?? undefined;
  }
  return byLook[look];
}

let uid = 0;

/**
 * The message box of an AI chat: model picker, voice input, attachments, connecting apps and requesting approval.
 * @tag tc-chat-composer
 * @fires tc-value-change - The message changed (`{ value: string }`) – typing, dictation, clearing after a send; cancelable – prevent it to keep `value` (controlled use)
 * @fires tc-model-change - A model was picked in the menu (`{ model: string; choice: ChatModel }`); cancelable
 * @fires tc-send - A message was sent (`ChatSend`: `{ message, model, skill, args }` – `skill` is the picked skill's `{ id, name }` or null, `args` the text after its token); `onSend` may return a promise to keep it until it settles
 * @fires tc-skill-change - The message's skill changed (`ChatSkillChange`: `{ skill, previous, reason }`); cancelable when it was picked, replaced or removed – prevent it to keep the message as it is
 * @fires tc-attach - The plus button was pressed – open your own file or folder picker here
 * @fires tc-connect-apps - "Connect apps" was pressed; `onConnectApps` may return a promise it waits for
 * @fires tc-request-approval - "Request approval" was pressed; `onRequestApproval` may return a promise it waits for
 * @fires tc-select-project - "Select a project" was pressed
 * @fires tc-settings-change - The model settings changed in the settings popover (`ChatSettingsChange`: `{ value, changed }`); cancelable – prevent it to control `settings`
 * @fires tc-prompt-pick - A prompt was picked in the prompt library (`ChatPromptPick`: `{ prompt, template, values }`); cancelable – prevent it to place the prompt yourself
 * @fires tc-page-context-change - The page context chip was toggled, or an attached item removed (`ChatPageContextChange`: `{ pageContext, change }`); cancelable – prevent it to control `pageContext`
 */
export class TcChatComposer extends TcElement {
  static override ui = "chat-composer";

  /** Leave out "Connect apps"; "Select a project" (unless hidden too) is offered straight away */
  @property({ type: Boolean, attribute: "hide-connect-apps" }) accessor hideConnectApps = false;
  /** Leave out "Select a project"; once apps are connected the row folds away */
  @property({ type: Boolean, attribute: "hide-project" }) accessor hideProject = false;
  /** Leave out "Request approval" */
  @property({ type: Boolean, attribute: "hide-approval" }) accessor hideApproval = false;
  /** Placeholder of the message field */
  @property() accessor placeholder = "Start by typing...";
  /** The message */
  @property() accessor value = "";
  /** Models in the picker; the first one is selected by default. An empty list disables the picker */
  @property({ attribute: false }) accessor models: ChatModel[] = defaultChatModels;
  /** Id of the selected model – unset, or one that's no longer in the list, selects the first */
  @property() accessor model = "";
  /** How long "Connect apps" and "Request approval" load at least, in ms */
  @property({ type: Number, attribute: "load-ms" }) accessor loadMs = 1300;
  /** Sample transcript that appears word by word while recording when there's no onDictate */
  @property() accessor dictation = "Draft a short update for the team about this week's progress";
  /** Demo mode: connecting apps, requesting approval and dictation are simulated silently where their handlers are missing */
  @property({ type: Boolean }) accessor demo = false;
  /**
   * Live speech-to-text for the mic, called when recording starts. Push the transcript so far with `onTranscript`
   * (and the input level, 0–1, with `onLevel` for the trace); stop listening when `signal` aborts – on Discard,
   * Use recording or removal. A rejection ends the recording with an error. Without it a sample transcript plays
   */
  @property({ attribute: false }) accessor onDictate: ((session: ChatDictationSession) => void | Promise<unknown>) | undefined = undefined;
  /**
   * Sends the message. Return a promise to keep the message (and a pending send button) until it settles: it is
   * cleared when it resolves and kept, with an error, when it rejects. `details` has the model, and the skill and its
   * arguments when the message starts with one
   */
  @property({ attribute: false }) accessor onSend: ((message: string, details: ChatSendDetails) => void | Promise<unknown>) | undefined = undefined;
  /** Connects the user's apps; "Connect apps" keeps loading until a returned promise settles. Without it connecting is simulated */
  @property({ attribute: false }) accessor onConnectApps: (() => void | Promise<unknown>) | undefined = undefined;
  /** Requests unrestricted access – resolves, rejects and is simulated like onConnectApps */
  @property({ attribute: false }) accessor onRequestApproval: (() => void | Promise<unknown>) | undefined = undefined;

  /** Opt-in: the / and @ picker on the message (tc-mention-picker). Its tc-pick bubbles from the composer */
  @property({ attribute: false }) accessor mentions: MentionPickerTrigger[] | undefined = undefined;
  /** Opt-in: the skills (slash commands) a message can start with – / at the start of a line opens them */
  @property({ attribute: false }) accessor skills: ChatSkill[] | undefined = undefined;
  /** Ids of the skills used last, most recent first – listed first before anything is typed. Unset, the composer
   *  remembers the picks made in it */
  @property({ attribute: false }) accessor recentSkills: string[] | undefined = undefined;
  /** Finds skills on the app's side in place of the built-in filter over `skills` (see ChatSkillSearch) */
  @property({ attribute: false }) accessor searchSkills: ChatSkillSearch | undefined = undefined;
  /** Id of the message's skill ("" for none). Setting it puts that skill's token at the start of the message */
  @property() accessor skill = "";
  /** Leave out the "/" button that opens the skills list */
  @property({ type: Boolean, attribute: "hide-skills-button" }) accessor hideSkillsButton = false;
  /** The empty message's placeholder while skills are on – default: the placeholder plus "/ for skills" */
  @property({ attribute: "skills-placeholder" }) accessor skillsPlaceholder = "";
  /** Opt-in: what's in context, as chips above the composer (tc-context-tray). Changes come as tc-items-change; the
   *  composer keeps the new list unless a listener prevents it */
  @property({ attribute: false }) accessor context: ContextTrayItem[] | undefined = undefined;
  /** The context window the tray measures against, in tokens */
  @property({ type: Number, attribute: "context-limit" }) accessor contextLimit = 0;

  /** Where the model switch is: in the card (the default), or in the toolbar row as tc-model-picker's menu */
  @property({ attribute: "model-switcher" }) accessor modelSwitcher: "card" | "toolbar" = "card";
  /** Opt-in: the model settings (by parameter id), edited in a popover from the toolbar. Changes come as tc-settings-change */
  @property({ attribute: false }) accessor settings: ModelSettingsValue | undefined = undefined;
  /** The model the settings are for – only the parameters it supports are shown; unset shows them all */
  @property({ attribute: false }) accessor settingsModel: ModelSettingsModel | undefined = undefined;
  /** Opt-in: saved prompts, in a popover from the toolbar. A used prompt goes in at the caret (tc-prompt-pick) */
  @property({ attribute: false }) accessor prompts: PromptTemplate[] | undefined = undefined;
  /** Opt-in: what's on the page, as a chip in the toolbar that connects or disconnects it (tc-page-context-change) */
  @property({ attribute: false }) accessor pageContext: ChatPageContext | undefined = undefined;
  /** One quiet line under the composer, e.g. "AI can make mistakes. Check important info." – it also describes the message field */
  @property() accessor disclaimer = "";

  /** @internal The open toolbar popover */
  @state() accessor sheet: Panel = "";
  /** @internal How much the toolbar folds to fit: 0 everything with labels, 1 icons only, 2 settings and prompts in "More" */
  @state() accessor fold: 0 | 1 | 2 = 0;
  /** @internal The prompt library's chosen template and typed variables, kept while its popover is closed */
  @state() accessor promptChoice = "";
  /** @internal */ @state() accessor promptValues: PromptValues = {};
  /** @internal */ @state() accessor sending = false;
  /** @internal */ @state() accessor menuOpen = false;
  /** @internal */ @state() accessor status = "";
  /** @internal */ @state() accessor error = "";
  /** @internal */ @state() accessor apps: Step = "idle";
  /** @internal */ @state() accessor approval: Step = "idle";
  /** @internal */ @state() accessor recording = false;
  /** @internal Heard while recording – gray, not yet confirmed */
  @state() accessor heard = "";
  /** @internal */ @state() accessor lines = 1;
  /** @internal */ @state() accessor morph = false;
  /** @internal The menu's place, next to the model button */
  @state() accessor place = { top: 0, left: 0, up: true, fromTop: 0, fromLeft: 0, fromRadius: 0 };
  /** @internal */ @state() accessor menuVisible = false;
  /** @internal */ @state() accessor placing = false;
  /** @internal */ @state() accessor active = 0;
  /** @internal */ @state() accessor fill = { y: 0, h: 0, glide: false };
  /** @internal The fill only shows while the pointer is over a row (or the keyboard moves through the list) */
  @state() accessor shown = false;
  /** @internal Skills picked here, most recent first – the recent ones when `recentSkills` is unset */
  @state() accessor remembered: string[] = [];

  private uid = `tc-cc-${++uid}`;
  private timers: number[] = [];
  private speaking: number[] = [];
  private dictating: AbortController | null = null;
  private levels = silentTrace();
  private modelWidth = 0;
  private shownModel: string | null = null;
  private ro?: ResizeObserver;
  private reveal = false;
  /** Typed while controlled, waiting for the page's `value` (see setMessage) */
  private typed: string | null = null;
  private revert = 0;
  private wasShown = false;

  private onDocDown = (e: PointerEvent) => {
    const target = e.target as Node;
    if (this.panel?.contains(target) || this.modelButton?.contains(target)) return;
    this.closeMenu(false);
  };

  /** The toolbar row: one Tab stop, ← → Home End (the model picker's trigger is one of its items) */
  private tools = new ToolbarController(this, {
    items: () => [...this.querySelectorAll<HTMLElement>(".ui-chat-composer__bar .ui-mdp__trigger, .ui-chat-composer__bar > .ui-chat-composer__tool")],
  });
  /** The settings, prompts, page items and More popovers – one at a time, anchored to the button that opened it */
  private panelFrom: HTMLElement | null = null;
  private pop = new PopoverController(this, {
    popover: () => this.querySelector<HTMLElement>(".ui-chat-composer__pop"),
    anchor: () => this.panelFrom,
    side: "top",
    align: "start",
    // A panel (not the More menu): Shift + Tab from its first control back to its button, Tab from its last on past the toolbar
    tabBridge: () => this.sheet !== "more",
    onClose: () => {
      this.sheet = "";
    },
  });
  private barRo?: ResizeObserver;
  /** The width the toolbar needed at each fold when it last didn't fit – it unfolds once there's that much room again */
  private needs = [0, 0];
  /** Where a prompt goes: the caret (or selection) in the message when the prompt library opened */
  private caret: [number, number] | null = null;
  /** Every skill seen – in `skills` or in a search's results – by id, so a pick or an id finds its skill */
  private known = new Map<string, ChatSkill>();
  /** The skill `skill` was last set to from inside – a different value came from the page */
  private appliedSkill = "";
  /** A "/" the composer put at the start (the button, or / before the token): what to put back if the list closes
   *  without a pick – the old token, or nothing */
  private slash: { rest: string; restore: string } | null = null;
  /** A pick the page prevented: the typed "/query", removed if the page then sets `skill` */
  private prevented: { start: number; text: string } | null = null;

  constructor() {
    super();
    // A control that goes inert or away while focused hands focus on (WCAG 2.4.3): the mic to Discard recording and
    // "Connect apps" to "Select a project" (same data-focus-key), anything else to the message
    new FocusRescueController(this, () => this.textarea);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.barRo?.disconnect();
    this.barRo = undefined;
    this.timers.forEach((t) => window.clearTimeout(t));
    this.timers = [];
    this.stopSpeaking();
    this.dictating?.abort();
    this.dictating = null;
    this.ro?.disconnect();
    this.ro = undefined;
    document.removeEventListener("pointerdown", this.onDocDown);
    if (this.revert) cancelAnimationFrame(this.revert);
    this.revert = 0;
    this.typed = null;
  }

  private get textarea() {
    return this.querySelector<HTMLTextAreaElement>(".ui-chat-composer__message");
  }
  private get modelButton() {
    return this.querySelector<HTMLButtonElement>(".ui-chat-composer__model");
  }
  private get panel() {
    return this.querySelector<HTMLElement>(".ui-chat-composer__menu-panel");
  }
  private get body() {
    return this.querySelector<HTMLElement>(".ui-chat-composer__body");
  }
  /** The selected model; one that's no longer in the list falls back to the first */
  private get current(): ChatModel {
    return this.models.find((m) => m.id === this.model) ?? this.models[0] ?? NO_MODEL;
  }
  private get canSend() {
    return this.message.trim().length > 0 && !this.sending;
  }

  /* ---------- Saying what happened ---------- */

  /** True once the handler has resolved and loadMs has passed; false when it throws or rejects */
  private async settle(handler?: () => unknown) {
    try {
      await Promise.all([handler?.(), new Promise((r) => this.timers.push(window.setTimeout(() => r(null), this.loadMs)))]);
      return true;
    } catch {
      return false;
    }
  }
  // The alert announces it, so the live status line stays quiet
  private fail(message: string) {
    this.error = message;
    this.status = "";
  }

  private setMessage(next: string) {
    this.followText(next);
    if (this.emit("tc-value-change", { value: next }, { cancelable: true })) {
      this.typed = null;
      this.value = next;
      return;
    }
    // Controlled: the page answers with its next `value` – React, for one, after this event has returned. Until it
    // does, the text area keeps what was typed (going back to `value` at once would drop the next keystroke and move
    // the caret); a page that keeps `value` as it was gets it back in the next frame
    this.typed = next;
    if (this.revert) cancelAnimationFrame(this.revert);
    this.revert = requestAnimationFrame(() => {
      this.revert = 0;
      if (this.typed === null) return;
      this.typed = null;
      this.requestUpdate();
    });
    this.requestUpdate();
  }
  /** Apps count as connected: connected here, or "Connect apps" is left out */
  private get appsDone() {
    return this.hideConnectApps || this.apps === "done";
  }
  /** Which of the apps row's buttons there are */
  private get rows(): "both" | "connect" | "project" | "none" {
    if (this.hideConnectApps) return this.hideProject ? "none" : "project";
    return this.hideProject ? "connect" : "both";
  }
  /** The message as shown: what was just typed while a controlling page hasn't answered yet, else `value` */
  private get message() {
    return this.typed ?? this.value;
  }

  /* ---------- Connect apps and Request approval: idle → loading → done, or back to idle with an error ---------- */

  private async runStep(kind: "apps" | "approval") {
    if (this[kind] !== "idle") return;
    const apps = kind === "apps";
    const handler = apps ? this.onConnectApps : this.onRequestApproval;
    this[kind] = "loading";
    this.error = "";
    this.status = apps ? "Connecting apps…" : "Requesting approval…";
    this.emit(apps ? "tc-connect-apps" : "tc-request-approval", null);
    if (!handler && !this.demo) {
      if (apps) warnSimulation("onConnectApps", "connecting apps");
      else warnSimulation("onRequestApproval", "the approval");
    }
    const ok = await this.settle(handler);
    if (!this.isConnected) return;
    if (ok) {
      this[kind] = "done";
      this.status = apps ? "Apps connected. Select a project." : "Unrestricted access granted.";
    } else {
      this[kind] = "idle";
      this.fail(apps ? "Your apps couldn't be connected. Try again." : "Approval wasn't granted. Try again.");
    }
  }

  /* ---------- Voice input ---------- */

  /** The audio trace's levels, drawn straight into the DOM – no re-render for a new level */
  private paintTrace() {
    const clean = this.resolvedLook === "clean";
    this.querySelectorAll<HTMLElement>(".ui-chat-composer__trace > span").forEach((bar, i) => bar.style.setProperty("height", traceHeight(clean, this.levels[i] ?? 0)));
  }
  private pushLevel(level: number) {
    this.levels = [...this.levels.slice(1), level];
    this.paintTrace();
  }
  private stopSpeaking() {
    this.speaking.forEach((t) => window.clearInterval(t));
    this.speaking = [];
  }

  private startRecording() {
    this.menuOpen = false;
    this.heard = "";
    this.levels = silentTrace();
    this.paintTrace();
    this.recording = true;
    this.error = "";
    this.status = "Recording. Press Escape to discard.";
    const onDictate = this.onDictate;
    if (!onDictate) {
      if (!this.demo) warnSimulation("onDictate", "dictation");
      // Simulated take: words arrive one by one and the trace scrolls with a made-up input level
      const words = this.dictation.split(/\s+/).filter(Boolean);
      let count = 0;
      this.stopSpeaking();
      this.speaking.push(
        window.setInterval(() => {
          count = Math.min(words.length, count + 1);
          this.heard = words.slice(0, count).join(" ");
        }, 320),
        window.setInterval(() => {
          const talking = count < words.length;
          this.pushLevel(talking && Math.random() > 0.3 ? 0.3 + Math.random() * 0.7 : 0);
        }, 120),
      );
      return;
    }
    // Live take: your speech-to-text pushes the words and the level until the signal aborts
    const controller = new AbortController();
    this.dictating?.abort();
    this.dictating = controller;
    const { signal } = controller;
    const live = () => this.isConnected && !signal.aborted;
    Promise.resolve()
      .then(() =>
        onDictate({
          signal,
          onTranscript: (text) => {
            if (live()) this.heard = text;
          },
          onLevel: (level) => {
            if (live()) this.pushLevel(Math.min(1, Math.max(0, level)));
          },
        }),
      )
      .catch(() => {
        if (!live()) return;
        this.dictating = null;
        this.recording = false;
        this.heard = "";
        this.fail("Dictation stopped working. Try again.");
      });
  }

  private stopRecording(keep: boolean) {
    this.dictating?.abort();
    this.dictating = null;
    this.stopSpeaking();
    this.recording = false;
    const heard = this.heard;
    if (keep && heard) {
      const current = this.message;
      this.setMessage(current.trim() ? `${current.trimEnd()} ${heard}` : heard);
      this.status = "Recording added to your message.";
    } else {
      this.status = "Recording discarded.";
    }
    this.heard = "";
    this.textarea?.focus();
  }

  /* ---------- Sending ---------- */

  private async send() {
    if (!this.canSend) return;
    const text = this.message;
    const message = text.trim();
    const picked = this.pickedSkill;
    const skill = picked && hasToken(text, picked) ? picked : null;
    const details: ChatSendDetails = { model: this.current.id, skill: skill ? { id: skill.id, name: skill.name } : null, args: skill ? text.slice(tokenOf(skill).length).trim() : message };
    this.emit<ChatSend>("tc-send", { message, ...details });
    const result = this.onSend?.(message, details);
    this.textarea?.focus();
    if (!result || typeof (result as Promise<unknown>).then !== "function") {
      this.clearSent();
      this.status = "Message sent.";
      return;
    }
    // Async send: the message stays (read-only) until the handler settles, and comes back editable on failure
    this.sending = true;
    this.error = "";
    this.status = "Sending…";
    try {
      await result;
      if (!this.isConnected) return;
      this.clearSent();
      this.status = "Message sent.";
    } catch {
      if (!this.isConnected) return;
      this.fail("Your message wasn't sent. Try again.");
    } finally {
      if (this.isConnected) this.sending = false;
    }
  }

  /** After a send: the message is cleared, and its skill with it */
  private clearSent() {
    if (this.skill) this.changeSkill(null, "send", null);
    this.setMessage("");
  }

  /* ---------- Skills ---------- */

  private get hasSkills() {
    return !!this.skills?.length || !!this.searchSkills;
  }

  /** The message's skill, from its id – a skill the composer hasn't seen is named by its id */
  get pickedSkill(): ChatSkill | null {
    const id = this.skill;
    if (!id) return null;
    return this.known.get(id) ?? this.skills?.find((s) => s.id === id) ?? { id, name: id };
  }

  private skillByName(name: string) {
    return this.skills?.find((s) => s.name === name) ?? [...this.known.values()].find((s) => s.name === name);
  }

  /**
   * Changes the skill, and with `text` the message too (the caret at `caret`, default after the token). Returns false
   * when a listener prevented a cancelable change
   */
  private changeSkill(next: ChatSkill | null, reason: ChatSkillChange["reason"], text: string | null, caret?: number) {
    const previous = this.pickedSkill;
    const cancelable = reason === "pick" || reason === "replace" || reason === "remove";
    if (!this.emit<ChatSkillChange>("tc-skill-change", { skill: next, previous, reason }, { cancelable }) && cancelable) return false;
    if (next) {
      this.known.set(next.id, next);
      if (reason === "pick" || reason === "replace") this.remembered = [next.id, ...this.remembered.filter((id) => id !== next.id)].slice(0, 20);
    }
    this.skill = this.appliedSkill = next?.id ?? "";
    this.prevented = null;
    if (text !== null) {
      this.setMessage(text);
      const at = caret ?? (next ? tokenOf(next).length + 1 : 0);
      void this.updateComplete.then(() => this.textarea?.setSelectionRange(at, at));
    }
    if (reason === "pick") this.status = `${tokenOf(next!)} added.${next!.argumentHint ? ` Then type ${spoken(next!.argumentHint)}.` : ""}`;
    else if (reason === "replace") this.status = `${tokenOf(next!)} replaces ${tokenOf(previous!)}.`;
    else if (reason === "remove" && previous) this.status = `${tokenOf(previous)} removed.`;
    return true;
  }

  /** The text changed: a broken token drops its skill; "/name " typed out in full becomes that skill */
  private followText(text: string) {
    if (!this.hasSkills || this.slash) return;
    const s = this.pickedSkill;
    if (s) {
      if (!hasToken(text, s)) this.changeSkill(null, "edit", null);
      return;
    }
    const typed = /^\/(\S+)\s/.exec(text);
    const found = typed && this.skillByName(typed[1]);
    if (found) this.changeSkill(found, "edit", null);
  }

  /** The page set `skill`: its token goes at the start of the message, in place of the old one */
  private applySkill() {
    const next = this.pickedSkill;
    const previous = this.appliedSkill ? (this.known.get(this.appliedSkill) ?? this.skills?.find((s) => s.id === this.appliedSkill) ?? null) : null;
    this.appliedSkill = this.skill;
    let text = this.message;
    // A pick the page prevented and then made itself: the typed "/query" goes
    const p = this.prevented;
    if (p && text.slice(p.start, p.start + p.text.length) === p.text) text = text.slice(0, p.start) + text.slice(p.start + p.text.length);
    this.prevented = null;
    if (next && hasToken(text, next)) return text === this.message ? undefined : this.setMessage(text);
    if (previous && hasToken(text, previous)) text = text.slice(tokenOf(previous).length);
    text = text.replace(/^[ \t]+/, "");
    this.setMessage(next ? `${tokenOf(next)} ${text}` : text);
  }

  /** The list's / trigger: grouped by source, recent ones first, with a note when picking would replace the skill */
  private triggerCache: { deps: unknown[]; trigger: MentionPickerTrigger } | null = null;
  private itemCache = new WeakMap<ChatSkill, MentionPickerItem>();
  private item(s: ChatSkill) {
    let it = this.itemCache.get(s);
    if (!it) this.itemCache.set(s, (it = { id: s.id, label: s.name, description: s.description, keywords: s.keywords, icon: s.icon, token: tokenOf(s) }));
    return it;
  }
  private groupsOf(list: ChatSkill[]): MentionPickerGroup[] {
    const groups = new Map<string, MentionPickerGroup>();
    for (const s of list) {
      this.known.set(s.id, s);
      const label = s.source ?? "Skills";
      let g = groups.get(label);
      if (!g) groups.set(label, (g = { id: `source:${label}`, label, items: [] }));
      g.items.push(this.item(s));
    }
    return [...groups.values()];
  }
  private get skillTrigger(): MentionPickerTrigger | null {
    if (!this.hasSkills) return null;
    const recent = (this.recentSkills ?? this.remembered).slice(0, RECENT_SKILLS);
    const current = this.pickedSkill;
    const deps = [this.skills, this.searchSkills, recent.join("\u0000"), current?.name];
    const cached = this.triggerCache;
    if (cached && cached.deps.every((d, i) => d === deps[i])) return cached.trigger;
    const trigger: MentionPickerTrigger = {
      char: "/",
      atLineStart: true,
      label: "Skills",
      groups: this.groupsOf(this.skills ?? []),
      recent,
      showChar: true,
      rankAcrossGroups: true,
      noun: ["skill", "skills"],
      emptyText: "No skills match",
      emptyHint: "Try another word, or press Esc to type it as text",
      note: current ? `Picking one replaces ${tokenOf(current)}` : undefined,
      search: this.searchSkills ? this.findSkills : undefined,
    };
    this.triggerCache = { deps, trigger };
    return trigger;
  }
  /** The app's search, its results turned into the picker's groups */
  private findSkills = (query: string, _char: string, options: { signal: AbortSignal }) => {
    const found = this.searchSkills!(query, options);
    return found instanceof Promise ? found.then((list) => this.groupsOf(list)) : this.groupsOf(found);
  };

  /** What the picker offers: the mentions, and the skills on / (a / in `mentions` gives way to them) */
  private triggersCache: { mentions: unknown; skills: unknown; triggers: MentionPickerTrigger[] } | null = null;
  private get triggers(): MentionPickerTrigger[] {
    const mentions = this.mentions ?? [];
    const skills = this.skillTrigger;
    const c = this.triggersCache;
    if (c && c.mentions === mentions && c.skills === skills) return c.triggers;
    const triggers = skills ? [...mentions.filter((t) => t.char !== "/"), skills] : mentions;
    this.triggersCache = { mentions, skills, triggers };
    return triggers;
  }
  private get picker() {
    return this.querySelector<TcMentionPicker>("tc-mention-picker");
  }

  /** A skill picked in the list: the typed "/query" goes, and the skill's token takes the start of the message */
  private onPick = (e: CustomEvent<MentionPickerPick>) => {
    if (!this.hasSkills || e.detail.trigger !== "/") return;
    // Not a mention: the composer inserts it, and says so with tc-skill-change
    e.stopPropagation();
    e.preventDefault();
    const skill = this.known.get(e.detail.item.id);
    if (!skill) return;
    const text = this.message;
    const typed = `/${e.detail.query}`;
    const caret = this.textarea?.selectionEnd ?? text.length;
    const start = text.slice(caret - typed.length, caret) === typed ? caret - typed.length : text.lastIndexOf(typed, caret);
    let rest = start < 0 ? text : text.slice(0, start) + text.slice(start + typed.length);
    const previous = this.pickedSkill;
    if (previous && hasToken(rest, previous)) rest = rest.slice(tokenOf(previous).length);
    rest = rest.replace(/^[ \t]+/, "");
    const slash = this.slash;
    this.slash = null;
    if (!this.changeSkill(skill, previous ? "replace" : "pick", `${tokenOf(skill)} ${rest}`)) {
      this.slash = slash;
      if (start >= 0) this.prevented = { start, text: typed };
    }
  };

  /** The list closed: a "/" the composer put there and nothing typed after it goes back to what was there */
  private onPickerOpen = (e: CustomEvent<MentionPickerOpenChange>) => {
    if (e.detail.open || !this.slash) return;
    const { rest, restore } = this.slash;
    this.slash = null;
    if (this.message === `/${rest}`) {
      this.setMessage(restore + rest);
      void this.updateComplete.then(() => this.textarea?.setSelectionRange(restore.length + (restore ? 1 : 0), restore.length + (restore ? 1 : 0)));
    } else this.followText(this.message);
  };

  /** "/" at the very start – from the button, or typed before the token: a "/" takes the token's place and the list opens */
  private startSlash() {
    const t = this.textarea;
    if (!t) return;
    const text = this.message;
    const current = this.pickedSkill;
    const restore = current && hasToken(text, current) ? tokenOf(current) : "";
    const rest = text.slice(restore.length);
    this.slash = { rest, restore };
    t.focus();
    this.setMessage(`/${rest}`);
    void this.updateComplete.then(() => {
      t.setSelectionRange(1, 1);
      this.picker?.sync();
    });
  }
  private openSkills = () => this.startSlash();

  /** Keys around the token: Backspace after it or Delete before it removes it whole; typing inside it moves past it */
  private onTokenKey(event: KeyboardEvent) {
    const s = this.pickedSkill;
    const t = event.target as HTMLTextAreaElement;
    const text = this.message;
    if (!s || !hasToken(text, s) || t.selectionStart !== t.selectionEnd || event.ctrlKey || event.metaKey || event.altKey) return;
    const at = t.selectionStart;
    const token = tokenOf(s);
    const after = text[token.length] === " " ? token.length + 1 : token.length;
    if ((event.key === "Backspace" && at > 0 && at <= after && at >= token.length) || (event.key === "Delete" && at === 0)) {
      event.preventDefault();
      this.changeSkill(null, "remove", text.slice(after), 0);
    } else if (event.key === "/" && at === 0) {
      event.preventDefault();
      this.startSlash();
    } else if (event.key.length === 1 && at <= token.length) {
      // Inside the token (or right after it with no space): the key lands after the token and its space
      if (after === token.length) t.setRangeText(" ", token.length, token.length, "end");
      t.setSelectionRange(token.length + 1, token.length + 1);
    }
  }

  /* ---------- The model menu ---------- */

  private pickModel(next: ChatModel) {
    if (next.id !== this.current.id) this.morph = true;
    if (this.emit("tc-model-change", { model: next.id, choice: next }, { cancelable: true })) this.model = next.id;
    this.menuOpen = false;
    // The toolbar's model picker says it itself
    if (this.modelSwitcher !== "toolbar") this.status = `${next.name} selected.`;
    this.modelButton?.focus();
  }
  private closeMenu(refocus: boolean) {
    this.menuOpen = false;
    if (refocus) this.modelButton?.focus();
  }

  private onMenuKey = (event: KeyboardEvent) => {
    const models = this.models;
    const last = models.length - 1;
    const moves: Record<string, number> = { ArrowDown: Math.min(last, this.active + 1), ArrowUp: Math.max(0, this.active - 1), Home: 0, End: last };
    if (event.key in moves) {
      event.preventDefault();
      this.active = moves[event.key];
      this.shown = true;
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.pickModel(models[this.active]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      this.closeMenu(true);
    } else if (event.key === "Tab") {
      // The list closes (and goes inert): Tab moves on from the model button instead of from nowhere
      rescueFocus(this.panel, [this.modelButton]);
      this.closeMenu(false);
    }
  };

  /**
   * Places the menu next to the model button, always inside the visible frame (the nearest clipping ancestor, or the
   * viewport). It opens in two steps: first the closed shape moves to the button, then it morphs open.
   */
  private placeMenu() {
    const anchor = this.modelButton;
    const container = this.body;
    const panel = this.panel;
    if (!anchor || !container || !panel) return;
    const button = anchor.getBoundingClientRect();
    const box = container.getBoundingClientRect();
    const frame = clippingFrame(container);
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    const gap = 8;
    const inset = 8;
    const roomAbove = button.top - gap - (frame.top + inset);
    const roomBelow = frame.bottom - inset - (button.bottom + gap);
    const up = roomAbove >= height || roomAbove >= roomBelow;
    const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));
    const top = clamp(up ? button.top - gap - height : button.bottom + gap, frame.top + inset, frame.bottom - inset - height);
    const left = clamp(button.right - width, frame.left + inset, frame.right - inset - width);
    // The morph starts as a button-sized piece in the corner closest to the button
    const fromLeft = clamp(button.left - left, 0, width - 1);
    const fromTop = up ? clamp(height - button.height, 0, height - 1) : 0;
    this.place = { top: top - box.top, left: left - box.left, up, fromTop, fromLeft, fromRadius: this.resolvedLook === "clean" ? 6 : button.height / 2 };
    this.active = Math.max(0, this.models.findIndex((m) => m.id === this.current.id));
    this.shown = false;
    this.placing = true;
    this.reveal = true;
  }

  /* ---------- The toolbar row ---------- */

  private get hasToolbar() {
    return this.modelSwitcher === "toolbar" || this.settings !== undefined || this.prompts !== undefined || this.pageContext !== undefined;
  }
  private get bar() {
    return this.querySelector<HTMLElement>(".ui-chat-composer__bar");
  }

  /** The toolbar's model picker reports a pick; the composer's own cancelable tc-model-change decides */
  private onPickerValue = (e: CustomEvent<{ value: string }>) => {
    // Its tc-value-change would read as a change to the message
    e.stopPropagation();
    e.preventDefault();
    const next = this.models.find((m) => m.id === e.detail.value);
    if (next) this.pickModel(next);
  };

  /** Opens a toolbar popover from `from`, or closes it when it's already the open one */
  private openPanel(which: Exclude<Panel, "">, from: HTMLElement | null) {
    if (this.sheet === which && this.pop.open && from === this.panelFrom) {
      this.pop.close();
      return;
    }
    if (which === "prompts") {
      const t = this.textarea;
      this.caret = t ? [t.selectionStart, t.selectionEnd] : null;
    }
    // From the More menu: focus waits on More while the menu gives way to the panel, so it never drops to <body>
    if (this.sheet === "more" && this.pop.open) from?.focus({ preventScroll: true });
    this.panelFrom = from;
    this.sheet = which;
    this.pop.show();
    // Focus goes in once the panel's component has rendered its controls
    void this.updateComplete.then(async () => {
      const inner = this.querySelector<HTMLElement & { updateComplete?: Promise<unknown> }>(".ui-chat-composer__pop > *");
      await inner?.updateComplete;
      if (!this.pop.open || this.sheet !== which) return;
      this.pop.focusFirst();
      // Focusing scrolls the panel to its first control; keep its heading in view when that control still shows
      const pop = this.querySelector<HTMLElement>(".ui-chat-composer__pop");
      const focused = document.activeElement;
      if (!pop || !focused || !pop.scrollTop) return;
      const was = pop.scrollTop;
      pop.scrollTop = 0;
      if (focused.getBoundingClientRect().bottom > pop.getBoundingClientRect().bottom) pop.scrollTop = was;
    });
  }

  private onSettingsChange = (e: CustomEvent<ModelSettingsChange>) => {
    e.stopPropagation();
    if (this.emit<ChatSettingsChange>("tc-settings-change", e.detail, { cancelable: true })) this.settings = e.detail.value;
    // Controlled: the settings stay as the page gave them
    else e.preventDefault();
  };

  /** The prompt library's own changes stay inside the composer; it keeps them while the popover is closed */
  private onPromptChoice = (e: CustomEvent<{ value: string }>) => {
    e.stopPropagation();
    this.promptChoice = e.detail.value;
  };
  private onPromptValues = (e: CustomEvent<{ values: PromptValues }>) => {
    e.stopPropagation();
    this.promptValues = e.detail.values;
  };

  /** The prompt library's Use: the prompt goes in at the caret (or over the selection) unless the page prevents it */
  private usePrompt = (prompt: string, template: PromptTemplate, values: Record<string, string>) => {
    const place = this.emit<ChatPromptPick>("tc-prompt-pick", { prompt, template, values }, { cancelable: true });
    this.pop.close();
    if (!place) return;
    const current = this.message;
    const [from, to] = this.caret ?? [current.length, current.length];
    const before = current.slice(0, from);
    const after = current.slice(to);
    const head = `${before}${before && !/\s$/.test(before) ? " " : ""}${prompt}`;
    this.setMessage(`${head}${after && !/^\s/.test(after) ? " " : ""}${after}`);
    this.status = `${template.title} added to your message.`;
    void this.updateComplete.then(() => {
      const t = this.textarea;
      if (!t) return;
      t.focus();
      t.setSelectionRange(head.length, head.length);
    });
  };

  private togglePage() {
    const pc = this.pageContext;
    if (!pc) return;
    const next = { ...pc, connected: !pc.connected };
    if (this.emit<ChatPageContextChange>("tc-page-context-change", { pageContext: next, change: next.connected ? "connect" : "disconnect" }, { cancelable: true })) this.pageContext = next;
  }

  /** An item removed (or restored) in the page items tray */
  private onPageItems = (e: CustomEvent<ContextTrayItemsChange>) => {
    e.stopPropagation();
    const pc = this.pageContext;
    if (!pc) return;
    const next = { ...pc, items: e.detail.items };
    if (this.emit<ChatPageContextChange>("tc-page-context-change", { pageContext: next, change: "items" }, { cancelable: true })) this.pageContext = next;
    else e.preventDefault();
  };

  /**
   * Folds the toolbar until it fits – first to icons only, then settings and prompts into "More" – and unfolds a step
   * once there's room for it again. Each fold re-renders and is measured again (updated() → watchBar)
   */
  private measureBar = () => {
    const bar = this.bar;
    if (!bar) return;
    const room = bar.clientWidth;
    const gap = parseFloat(getComputedStyle(bar).columnGap) || 0;
    const kids = [...bar.children] as HTMLElement[];
    const needed = kids.reduce((sum, el) => sum + el.offsetWidth, 0) + gap * Math.max(0, kids.length - 1);
    const max = this.settings !== undefined || this.prompts !== undefined ? 2 : 1;
    if (needed > room + 0.5 && this.fold < max) {
      this.needs[this.fold] = needed;
      this.fold = (this.fold + 1) as 1 | 2;
    } else if (this.fold > 0 && room >= this.needs[this.fold - 1]) this.fold = (this.fold - 1) as 0 | 1;
  };

  private onMoreKey = (e: KeyboardEvent) => {
    const items = [...(e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('[role="menuitem"]')];
    const at = items.indexOf(e.target as HTMLElement);
    const last = items.length - 1;
    const to = e.key === "ArrowDown" ? (at + 1) % items.length : e.key === "ArrowUp" ? (at <= 0 ? last : at - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : -1;
    if (to < 0) return;
    e.preventDefault();
    items[to]?.focus();
  };

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    // The page answered with what was typed
    if (changed.has("value") && this.value === this.typed) this.typed = null;
    // The page set the skill: its token takes the start of the message. Then text the page set may break or make one
    if (changed.has("skill") && this.skill !== this.appliedSkill) this.applySkill();
    if (changed.has("value") && this.typed === null) this.followText(this.value);
    // Turning the page context on or off is said, whoever does it (the chip, or the page through `pageContext`)
    const before = changed.get("pageContext");
    const pc = this.pageContext;
    if (changed.has("pageContext") && before && pc && before.connected !== pc.connected) this.status = pc.connected ? `Page context on: ${pc.title}.` : "Page context off.";
  }

  protected override firstUpdated() {
    // The picker attaches to the message, which exists only after the first render
    if (this.triggers.length) this.requestUpdate();
    // The model button's width is kept current, so it's only measured when the model changes
    const el = this.modelButton;
    if (!el) return;
    this.shownModel = this.current.id;
    if (typeof ResizeObserver === "undefined") {
      this.modelWidth = el.getBoundingClientRect().width;
      return;
    }
    this.ro = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0];
      this.modelWidth = box ? box.inlineSize : el.getBoundingClientRect().width;
    });
    this.ro.observe(el);
  }

  protected override updated(changed: PropertyValues<this>) {
    this.watchBar(changed);
    this.onMessageScroll();
    // The toolbar's model picker renders its trigger after this update – the toolbar's tab stop is set again then
    const picker = this.querySelector<HTMLElement & { hasUpdated: boolean; updateComplete: Promise<unknown> }>(".ui-chat-composer__picker");
    if (picker && !picker.hasUpdated) void picker.updateComplete.then(() => this.requestUpdate());
    const clean = this.resolvedLook === "clean";
    // The message starts with one line and grows with the text, up to 4 lines (Clean) or 2 (Standard)
    if (changed.has("value") || changed.has("heard") || changed.has("look") || changed.has("contextLook") || !this.hasMeasured) {
      this.hasMeasured = true;
      const el = this.textarea;
      if (el) {
        const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 1;
        const prev = el.style.height;
        el.style.height = "0px";
        const content = el.scrollHeight;
        el.style.height = prev;
        const lines = Math.min(clean ? MAX_LINES : 2, Math.max(1, Math.round(content / lineHeight)));
        if (lines !== this.lines) this.lines = lines;
      }
    }
    // Model switch morph: the button glides to its new width while logo and name blur in (not on first render)
    const button = this.modelButton;
    if (button && this.shownModel !== null && this.shownModel !== this.current.id) {
      this.shownModel = this.current.id;
      const from = this.modelWidth;
      const to = button.getBoundingClientRect().width;
      this.modelWidth = to;
      if (this.morph && from && Math.abs(from - to) >= 0.5 && !reducedMotion()) button.animate([{ width: `${from}px` }, { width: `${to}px` }], { duration: 460, easing: "cubic-bezier(0.25, 1, 0.5, 1)" });
    }
    // The menu: placed and set on the selected model each time it opens; then it morphs open from there
    const open = this.menuOpen && this.models.length > 0;
    if (changed.has("menuOpen") || changed.has("models")) {
      if (!open) {
        this.menuVisible = false;
        this.reveal = false;
        document.removeEventListener("pointerdown", this.onDocDown);
      } else if (changed.has("menuOpen")) {
        this.placeMenu();
        document.addEventListener("pointerdown", this.onDocDown);
      }
    } else if (open && this.reveal && changed.has("place") && this.panel) {
      // Once the closed shape sits at the button, apply it, then open – so the browser has a start shape to morph from
      void getComputedStyle(this.panel).clipPath;
      this.reveal = false;
      this.placing = false;
      this.menuVisible = true;
    }
    if (changed.has("menuVisible") && this.menuVisible) this.panel?.focus({ preventScroll: true });
    // One fill glides between rows; when it first appears it fades in on the spot
    if (changed.has("active") || changed.has("menuOpen") || changed.has("shown")) {
      const row = this.querySelectorAll<HTMLElement>(".ui-chat-composer__option")[this.active];
      if (row) {
        const fill = { y: row.offsetTop, h: row.offsetHeight, glide: this.wasShown && this.shown };
        if (fill.y !== this.fill.y || fill.h !== this.fill.h || fill.glide !== this.fill.glide) this.fill = fill;
      }
      this.wasShown = this.shown;
    }
  }
  private hasMeasured = false;

  /** The toolbar row is measured when it's resized or what's in it changes */
  private watchedBar: HTMLElement | null = null;
  private watchBar(changed: PropertyValues<this>) {
    const bar = this.bar;
    if (bar !== this.watchedBar) {
      this.barRo?.disconnect();
      this.barRo = undefined;
      this.watchedBar = bar;
      if (bar && typeof ResizeObserver !== "undefined") {
        this.barRo = new ResizeObserver(() => this.measureBar());
        this.barRo.observe(bar);
      }
    }
    if (bar && (["pageContext", "settings", "prompts", "modelSwitcher", "model", "models", "look", "contextLook", "fold"] as const).some((k) => changed.has(k))) this.measureBar();
  }

  /* ---------- Rendering ---------- */

  /** Clicking anywhere on the white card (Clean: the writing area) puts the caret in the text area */
  private focusMessage = (event: PointerEvent) => {
    if ((event.target as HTMLElement).closest("button, textarea, input")) return;
    event.preventDefault();
    this.textarea?.focus();
  };
  /** The token's layer scrolls with the text */
  private onMessageScroll = () => {
    const mirror = this.querySelector<HTMLElement>(".ui-chat-composer__mirror");
    const t = this.textarea;
    if (mirror && t && mirror.scrollTop !== t.scrollTop) mirror.scrollTop = t.scrollTop;
  };
  private onBodyKey = (event: KeyboardEvent) => {
    if (event.key === "Escape" && this.recording) {
      event.preventDefault();
      this.stopRecording(false);
    }
  };
  private onMessageKey = (event: KeyboardEvent) => {
    if (this.skill && !event.isComposing) this.onTokenKey(event);
    if (event.defaultPrevented) return;
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      void this.send();
    }
  };

  private logoOf(m: ChatModel, clean: boolean) {
    return m.logo ? m.logo.cloneNode(true) : BUILT_IN.get(m)?.(clean);
  }

  /** The placeholder: with skills on, it says / opens them */
  private get shownPlaceholder() {
    if (!this.hasSkills) return this.placeholder;
    return this.skillsPlaceholder || `${this.placeholder.replace(/[\s.…]+$/, "")} · / for skills`;
  }

  /** The skill's token, drawn behind the text it starts with, and its argument hint greyed after it until typed over */
  private mirror(message: string) {
    const s = this.pickedSkill;
    if (!s || !hasToken(message, s)) return nothing;
    const token = tokenOf(s);
    const rest = message.slice(token.length);
    const hint = s.argumentHint && !rest.trim() ? html`${rest ? "" : " "}<span class="ui-chat-composer__arg">${s.argumentHint}</span>` : nothing;
    return html`<div class="ui-chat-composer__mirror" aria-hidden="true"><span class="ui-chat-composer__token">${token}</span>${rest}${hint}</div>`;
  }

  /** The message and, while recording, the heard words in gray behind the confirmed text */
  private writing() {
    const message = this.message;
    const heard = this.heard;
    const s = this.pickedSkill;
    const described = [s && hasToken(message, s) ? `${this.uid}-skill` : "", this.disclaimer ? `${this.uid}-disclaimer` : ""].filter(Boolean).join(" ");
    return html`${this.mirror(message)}<textarea
        class="ui-chat-composer__message"
        .value=${live(message)}
        @input=${(e: Event) => this.setMessage((e.target as HTMLTextAreaElement).value)}
        @keydown=${this.onMessageKey}
        @scroll=${this.onMessageScroll}
        placeholder=${this.shownPlaceholder}
        aria-label="Message"
        aria-describedby=${ifDefined(described || undefined)}
        spellcheck="false"
        ?readonly=${this.recording || this.sending}
      ></textarea>
      <div class="ui-chat-composer__draft" aria-hidden="true">${message}${message && heard && !/\s$/.test(message) ? " " : ""}<span class="ui-chat-composer__heard">${heard}</span></div>`;
  }

  /** The loading shimmer's copy of a label (decorative) */
  private shine(text: string) {
    return html`<span class="ui-chat-composer__shine" aria-hidden="true"><span>${text}</span></span>`;
  }

  /** "Request approval", which turns into "Unrestricted access" once granted */
  private approvalButton(clean: boolean, i: ReturnType<typeof iconsFor>) {
    if (this.hideApproval) return nothing;
    const approval = this.approval;
    return html`<button type="button" class="ui-chat-composer__approval" @click=${() => void this.runStep("approval")} aria-busy=${approval === "loading" ? "true" : "false"} aria-disabled=${approval !== "idle" ? "true" : "false"}>
      ${clean ? nothing : html`<span class="ui-chat-composer__wash" aria-hidden="true"></span>`}
      <span class=${clean ? "ui-chat-composer__approval-icon" : "ui-chat-composer__icon"} aria-hidden="true">${i.hand}${i.shield}</span>
      <span class="ui-chat-composer__approval-text">
        <span class="ui-chat-composer__request ui-chat-composer__shimmer" aria-hidden=${approval === "done" ? "true" : "false"}>Request approval${this.shine("Request approval")}</span>
        <span class="ui-chat-composer__granted" aria-hidden=${approval !== "done" ? "true" : "false"}>Unrestricted access</span>
      </span>
    </button>`;
  }

  /** The selected model – opens the menu */
  private modelButtonTemplate(clean: boolean, i: ReturnType<typeof iconsFor>) {
    const model = this.current;
    const logo = model.id !== "auto" ? this.logoOf(model, clean) : undefined;
    return html`<button
      type="button"
      class="ui-chat-composer__model"
      aria-haspopup="listbox"
      aria-expanded=${this.menuOpen ? "true" : "false"}
      ?disabled=${this.models.length === 0}
      @click=${() => (this.menuOpen = !this.menuOpen)}
      @keydown=${(e: KeyboardEvent) => {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          this.menuOpen = true;
        }
      }}
    >
      ${keyed(
        model.id,
        html`<span class="ui-chat-composer__model-face" data-morph=${ifDefined(this.morph ? "true" : undefined)}>${logo ? html`<span class="ui-chat-composer__model-logo" aria-hidden="true">${logo}</span>` : nothing}<span class=${ifDefined(clean ? undefined : "ui-chat-composer__label")}>${model.name}</span></span>`,
      )}
      <span class=${clean ? "ui-chat-composer__chevron" : "ui-chat-composer__icon ui-chat-composer__icon--chevron"} aria-hidden="true">${i.chevron}</span>
    </button>`;
  }

  /** Audio trace: it scrolls in from the right. Rendered silent; new levels are written to the bars */
  private trace(clean: boolean) {
    return html`<span class="ui-chat-composer__trace" aria-hidden="true">${Array.from({ length: TRACE }, () => html`<span style=${styleMap({ height: traceHeight(clean, 0) })}></span>`)}</span>`;
  }

  private connectButton(clean: boolean) {
    if (this.hideConnectApps) return nothing;
    const apps = this.apps;
    const logos = clean
      ? html`<span class="ui-chat-composer__logo">${gmailLogo(`${this.uid}-g`)}</span><span class="ui-chat-composer__logo">${slackLogo}</span><span class="ui-chat-composer__logo">${clickUpLogo(`${this.uid}-c`)}</span>`
      : html`<span class="ui-chat-composer__logo ui-chat-composer__logo--gmail">${gmailLogo(`${this.uid}-g`)}</span><span class="ui-chat-composer__logo ui-chat-composer__logo--slack">${slackLogo}</span><span class="ui-chat-composer__logo ui-chat-composer__logo--clickup">${clickUpLogo(`${this.uid}-c`)}</span>`;
    return html`<button type="button" class="ui-chat-composer__row ui-chat-composer__connect" data-focus-key="apps" @click=${() => void this.runStep("apps")} .inert=${apps === "done"} aria-busy=${apps === "loading" ? "true" : "false"}>
      <span class="ui-chat-composer__logos" aria-hidden="true">${logos}</span>
      <span class=${clean ? "ui-chat-composer__shimmer" : "ui-chat-composer__label ui-chat-composer__shimmer"}>Connect apps${this.shine("Connect apps")}</span>
    </button>`;
  }

  private projectButton(clean: boolean, i: ReturnType<typeof iconsFor>) {
    if (this.hideProject) return nothing;
    const done = this.appsDone;
    return html`<button
      type="button"
      class="ui-chat-composer__row ui-chat-composer__project"
      data-focus-key="apps"
      @click=${() => this.emit("tc-select-project", null)}
      .inert=${!done}
      aria-hidden=${done ? "false" : "true"}
    >
      ${clean
        ? html`<span class="ui-chat-composer__folder" aria-hidden="true">${i.folder}</span><span>Select a project</span><span class="ui-chat-composer__row-chevron" aria-hidden="true">${chevronRightIcon}</span>`
        : html`<span class="ui-chat-composer__icon ui-chat-composer__icon--folder">${i.folder}</span><span class="ui-chat-composer__label">Select a project</span>`}
    </button>`;
  }

  private attach = () => this.emit("tc-attach", null);

  /** "/" next to attach: opens the skills list for people who don't know the shortcut */
  private skillsButton(clean: boolean) {
    if (!this.hasSkills || this.hideSkillsButton) return nothing;
    return html`<button type="button" class="ui-chat-composer__icon-btn ui-chat-composer__skills" aria-label="Use a skill" @click=${this.openSkills}>
      ${clean ? slashIcon(true) : html`<span class="ui-chat-composer__icon">${slashIcon(false)}</span>`}
    </button>`;
  }

  /** Clean: the message on top, the tools in a row below it, and a last row for apps and the project */
  private cleanLayout(i: ReturnType<typeof iconsFor>) {
    return html`<div class="ui-chat-composer__write" @pointerdown=${this.focusMessage}>
        <div class="ui-chat-composer__field">${this.writing()}</div>
        <div class="ui-chat-composer__tools">
          <div class="ui-chat-composer__group">
            <button type="button" class="ui-chat-composer__icon-btn" aria-label="Add attachment" @click=${this.attach}>${i.plus}</button>
            ${this.skillsButton(true)}${this.approvalButton(true, i)}
          </div>
          <div class="ui-chat-composer__swap">
            <div class="ui-chat-composer__group ui-chat-composer__group--end" .inert=${this.recording}>
              ${this.modelSwitcher === "toolbar" ? nothing : this.modelButtonTemplate(true, i)}
              <button type="button" class="ui-chat-composer__icon-btn" aria-label="Voice input" data-focus-key="voice" @click=${() => this.startRecording()}>${i.mic}</button>
              <button type="button" class="ui-chat-composer__send" aria-label="Send message" ?disabled=${!this.canSend} aria-busy=${ifDefined(this.sending ? "true" : undefined)} @click=${() => void this.send()}>${i.arrowUp}</button>
            </div>
            <div class="ui-chat-composer__group ui-chat-composer__group--end ui-chat-composer__group--voice" .inert=${!this.recording}>
              ${this.trace(true)}
              <button type="button" class="ui-chat-composer__button" aria-label="Discard recording" data-focus-key="voice" @click=${() => this.stopRecording(false)}>${i.cancel}</button>
              <button type="button" class="ui-chat-composer__send" aria-label="Use recording" aria-describedby=${`${this.uid}-heard`} @click=${() => this.stopRecording(true)}>${i.tick}</button>
            </div>
          </div>
        </div>
      </div>
      ${this.rows === "none" ? nothing : html`<div class="ui-chat-composer__foot">${this.connectButton(true)}${this.projectButton(true, i)}</div>`}`;
  }

  /** Standard: a gray tray with "Select a project" / "Connect apps", and the white card on top of it */
  private standardLayout(i: ReturnType<typeof iconsFor>) {
    return html`<div class="ui-chat-composer__tray">${this.projectButton(false, i)}${this.connectButton(false)}</div>
      <div class="ui-chat-composer__card" @pointerdown=${this.focusMessage}>
        ${this.writing()}
        <div class="ui-chat-composer__toolbar">
          <button type="button" class="ui-chat-composer__icon-btn" aria-label="Add attachment" @click=${this.attach}><span class="ui-chat-composer__icon">${i.plus}</span></button>
          ${this.skillsButton(false)}${this.approvalButton(false, i)}
        </div>
        <div class="ui-chat-composer__toolbar ui-chat-composer__toolbar--end" .inert=${this.recording}>
          ${this.modelSwitcher === "toolbar" ? nothing : this.modelButtonTemplate(false, i)}
          <button type="button" class="ui-chat-composer__icon-btn" aria-label="Voice input" data-focus-key="voice" @click=${() => this.startRecording()}><span class="ui-chat-composer__icon">${i.mic}</span></button>
          <button type="button" class="ui-chat-composer__send" aria-label="Send message" ?disabled=${!this.canSend} aria-busy=${ifDefined(this.sending ? "true" : undefined)} @click=${() => void this.send()}>${i.arrowUp}</button>
        </div>
        <div class="ui-chat-composer__toolbar ui-chat-composer__toolbar--end ui-chat-composer__toolbar--voice" .inert=${!this.recording}>
          ${this.trace(false)}
          <button type="button" class="ui-chat-composer__square" aria-label="Discard recording" data-focus-key="voice" @click=${() => this.stopRecording(false)}>${i.cancel}</button>
          <button type="button" class="ui-chat-composer__square" aria-label="Use recording" aria-describedby=${`${this.uid}-heard`} @click=${() => this.stopRecording(true)}>${i.tick}</button>
        </div>
      </div>`;
  }

  /* ---------- Model picker: opens upward, or downward when there is no room above ---------- */
  private menu(clean: boolean, i: ReturnType<typeof iconsFor>) {
    const place = this.place;
    const selected = this.current;
    const visible = this.menuVisible;
    return html`<div
      class="ui-chat-composer__menu"
      data-open=${visible ? "true" : "false"}
      data-placing=${this.placing ? "true" : "false"}
      data-up=${place.up ? "true" : "false"}
      style=${styleMap({
        top: `${place.top}px`,
        left: `${place.left}px`,
        "--from-top": `${place.fromTop}px`,
        "--from-left": `${place.fromLeft}px`,
        "--from-bottom": place.up ? "0px" : `calc(100% - ${place.fromRadius * 2}px)`,
        "--from-radius": `${place.fromRadius}px`,
      })}
      .inert=${!visible}
    >
      <div
        class="ui-chat-composer__menu-panel"
        role="listbox"
        tabindex="-1"
        aria-label="Select a model"
        aria-activedescendant=${`${this.uid}-opt-${this.active}`}
        @keydown=${this.onMenuKey}
        @pointerleave=${() => (this.shown = false)}
      >
        <span
          class="ui-chat-composer__menu-fill"
          aria-hidden="true"
          data-glide=${this.fill.glide ? "true" : "false"}
          style=${styleMap({ transform: `translateY(${this.fill.y}px)`, height: `${this.fill.h}px`, opacity: this.shown ? "1" : "0" })}
        ></span>
        ${this.models.map(
          (m, n) => html`<div
            id=${`${this.uid}-opt-${n}`}
            role="option"
            aria-selected=${m.id === selected.id ? "true" : "false"}
            class="ui-chat-composer__option"
            @pointerenter=${() => {
              this.active = n;
              this.shown = true;
            }}
            @click=${() => this.pickModel(m)}
          >
            <span class="ui-chat-composer__option-logo" aria-hidden="true">${this.logoOf(m, clean) ?? nothing}</span>
            <span class="ui-chat-composer__option-text"><span class="ui-chat-composer__option-name">${m.name}</span><span class="ui-chat-composer__option-desc">${m.description}</span></span>
            <span class="ui-chat-composer__option-check" aria-hidden="true">${i.tick}</span>
          </div>`,
        )}
      </div>
    </div>`;
  }

  /* ---------- Toolbar row ---------- */

  /** The models as tc-model-picker takes them – made again only when the list or the look changes */
  private pickerCache: { models: ChatModel[]; look: Look; list: PickerModel[] } | null = null;
  private get pickerModels(): PickerModel[] {
    const look = this.resolvedLook;
    if (this.pickerCache?.models !== this.models || this.pickerCache.look !== look) {
      const list = this.models.map((m) => ({ id: m.id, name: m.name, description: m.description || undefined, icon: m.logo ?? builtInLogo(m, look), speed: m.speed, quality: m.quality, cost: m.cost, latencyMs: m.latencyMs, pricePerM: m.pricePerM }));
      this.pickerCache = { models: this.models, look, list };
    }
    return this.pickerCache.list;
  }

  /** Whether the popover open now came from the toolbar button `tool` */
  private expanded(tool: string) {
    return this.pop.open && this.panelFrom?.dataset.tool === tool ? "true" : "false";
  }

  private toolButton(which: "settings" | "prompts", clean: boolean) {
    return html`<button
      type="button"
      class="ui-chat-composer__tool"
      data-tool=${which}
      aria-label=${ifDefined(which === "settings" ? "Model settings" : undefined)}
      aria-haspopup="dialog"
      aria-expanded=${this.expanded(which)}
      @click=${(e: Event) => this.openPanel(which, e.currentTarget as HTMLElement)}
    >
      ${toolIcon(which, clean)}<span class="ui-chat-composer__tool-label">${which === "settings" ? "Settings" : "Prompts"}</span>
    </button>`;
  }

  private pageChip(pc: ChatPageContext, clean: boolean) {
    const meta = pageMeta(pc);
    const items = pc.connected ? (pc.items?.length ?? 0) : 0;
    return html`<button
        type="button"
        class="ui-chat-composer__tool ui-chat-composer__page"
        data-tool="page"
        data-on=${pc.connected ? "true" : "false"}
        aria-label=${pc.connected ? `Page context on: ${pc.title}${meta ? `, ${meta}` : ""}` : `Page context: ${pc.title}, off`}
        aria-describedby=${`${this.uid}-page-hint`}
        @click=${() => this.togglePage()}
      >
        ${toolIcon(pc.connected ? "on" : "off", clean)}<span class="ui-chat-composer__page-title">${pc.title}</span>
        ${pc.connected && !meta ? nothing : html`<span class="ui-chat-composer__page-meta">${pc.connected ? meta : "Off"}</span>`}
      </button>
      ${items
        ? html`<button
            type="button"
            class="ui-chat-composer__tool ui-chat-composer__page-items"
            data-tool="page-items"
            aria-label=${`Show what's attached from the page (${items})`}
            aria-haspopup="dialog"
            aria-expanded=${this.expanded("page-items")}
            @click=${(e: Event) => this.openPanel("page", e.currentTarget as HTMLElement)}
          >
            ${toolIcon("items", clean)}
          </button>`
        : nothing}`;
  }

  /** The row under the composer: model, settings, prompts (or More), and the page context chip at the end */
  private toolbar(clean: boolean) {
    const pc = this.pageContext;
    const more = this.fold === 2 && (this.settings !== undefined || this.prompts !== undefined);
    return html`<div class="ui-chat-composer__extras" data-fold=${this.fold}>
      <div class="ui-chat-composer__bar" role="toolbar" aria-label="Message options" @keydown=${this.tools.onKeyDown} @focusin=${this.tools.onFocusIn}>
        ${this.modelSwitcher === "toolbar"
          ? html`<tc-model-picker
              class="ui-chat-composer__picker"
              look=${this.resolvedLook}
              side="top"
              .models=${this.pickerModels}
              .value=${this.current.id}
              @tc-value-change=${this.onPickerValue}
            ></tc-model-picker>`
          : nothing}
        ${more
          ? html`<button type="button" class="ui-chat-composer__tool" data-tool="more" aria-label="More" aria-haspopup="menu" aria-expanded=${this.expanded("more")} @click=${(e: Event) => this.openPanel("more", e.currentTarget as HTMLElement)}>
              ${toolIcon("more", clean)}
            </button>`
          : html`${this.settings !== undefined ? this.toolButton("settings", clean) : nothing}${this.prompts !== undefined ? this.toolButton("prompts", clean) : nothing}`}
        ${pc ? this.pageChip(pc, clean) : nothing}
      </div>
      ${pc ? html`<span id=${`${this.uid}-page-hint`} hidden>${pc.connected ? "The model can see this page. Press to disconnect it." : "The model can't see this page. Press to connect it."}</span>` : nothing}
      ${this.panelTemplate(clean)}
    </div>`;
  }

  /** The open toolbar popover: the More menu, model settings, the prompt library or the page's attached items */
  private panelTemplate(clean: boolean) {
    const panel = this.sheet;
    if (!this.pop.open || !panel) return nothing;
    const look = this.resolvedLook;
    if (panel === "more")
      return html`<div class="tc-pop ui-chat-composer__pop" data-panel="more" role="menu" aria-label="More options" @keydown=${this.onMoreKey}>
        ${this.settings !== undefined
          ? html`<button type="button" role="menuitem" class="ui-chat-composer__more-item" @click=${() => this.openPanel("settings", this.panelFrom)}>${toolIcon("settings", clean)}Model settings</button>`
          : nothing}
        ${this.prompts !== undefined
          ? html`<button type="button" role="menuitem" class="ui-chat-composer__more-item" @click=${() => this.openPanel("prompts", this.panelFrom)}>${toolIcon("prompts", clean)}Prompts</button>`
          : nothing}
      </div>`;
    const pc = this.pageContext;
    const label = panel === "settings" ? "Model settings" : panel === "prompts" ? "Prompts" : `Attached from ${pc?.title ?? "the page"}`;
    return html`<div class="tc-pop ui-chat-composer__pop" data-panel=${panel} role="dialog" aria-label=${label}>
      ${panel === "settings"
        ? html`<tc-model-settings look=${look} .model=${this.settingsModel} .value=${this.settings ?? {}} @tc-value-change=${this.onSettingsChange}></tc-model-settings>`
        : panel === "prompts"
          ? html`<tc-prompt-library
              look=${look}
              .templates=${this.prompts ?? []}
              .value=${this.promptChoice}
              .values=${this.promptValues}
              .onUse=${this.usePrompt}
              @tc-value-change=${this.onPromptChoice}
              @tc-values-change=${this.onPromptValues}
            ></tc-prompt-library>`
          : html`<tc-context-tray look=${look} heading=${pc?.title ?? "Page"} .items=${pc?.items ?? []} limit=${this.contextLimit} @tc-items-change=${this.onPageItems}></tc-context-tray>`}
    </div>`;
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const i = iconsFor(clean);
    const heard = this.heard;
    return html`
      ${this.context
        ? html`<tc-context-tray
            class="ui-chat-composer__context"
            look=${this.resolvedLook}
            .items=${this.context}
            limit=${this.contextLimit}
            @tc-items-change=${this.onContextChange}
          ></tc-context-tray>`
        : nothing}
      <section
        class="ui-chat-composer__body"
        data-apps=${this.appsDone ? "done" : this.apps}
        data-rows=${this.rows}
        data-approval=${this.approval}
        data-recording=${this.recording ? "true" : "false"}
        data-sending=${ifDefined(this.sending ? "true" : undefined)}
        style=${styleMap(clean ? { "--tc-chat-composer-lines": String(this.lines) } : { "--tc-chat-composer-grow": String((this.lines - 1) * 106.424) })}
        aria-label="Message composer"
        @keydown=${this.onBodyKey}
      >
        ${clean ? this.cleanLayout(i) : this.standardLayout(i)}${this.modelSwitcher === "toolbar" ? nothing : this.menu(clean, i)}
      </section>
      ${this.hasToolbar ? this.toolbar(clean) : nothing}
      ${this.error ? html`<p class="ui-chat-composer__error" role="alert">${this.error}</p>` : nothing}
      ${this.disclaimer ? html`<p class="ui-chat-composer__disclaimer" id=${`${this.uid}-disclaimer`}>${this.disclaimer}</p>` : nothing}
      <p class="ui-chat-composer__sr-only" aria-live="polite">${this.status}</p>
      <span id=${`${this.uid}-heard`} hidden>${heard ? `Heard so far: ${heard}` : "Nothing heard yet."}</span>
      ${this.skillNote()}
      ${this.triggers.length
        ? html`<tc-mention-picker look=${this.resolvedLook} .target=${this.textarea} .triggers=${this.triggers} @tc-pick=${this.onPick} @tc-open-change=${this.onPickerOpen}></tc-mention-picker>`
        : nothing}
    `;
  }

  /** What a screen reader hears with the message while it starts with a skill: the token and what to type after it */
  private skillNote() {
    const s = this.pickedSkill;
    if (!s || !hasToken(this.message, s)) return nothing;
    const hint = s.argumentHint ? spoken(s.argumentHint) : "";
    return html`<span id=${`${this.uid}-skill`} hidden>Skill ${tokenOf(s)}${s.description ? `: ${s.description}` : ""}.${hint && !this.message.slice(tokenOf(s).length).trim() ? ` Type ${hint}.` : ""}</span>`;
  }

  /** The tray's change reaches the page first (it bubbles); the composer keeps it unless the page prevented it */
  private onContextChange = (e: CustomEvent<{ items: ContextTrayItem[] }>) => {
    queueMicrotask(() => {
      if (!e.defaultPrevented) this.context = e.detail.items;
    });
  };

  static override css = /* css */ `

/* Chat Composer – authored in design units (--u), so it scales with the composer width */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="chat-composer"] {
  --tc-chat-composer-shimmer: light-dark(rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.95));
  --tc-chat-composer-alert: var(--tc-status-danger-fg);
  --tc-chat-composer-alert-bg: var(--tc-status-danger-bg);

  --tc-chat-composer-load: 650ms; /* one shimmer sweep; loading runs two */
  --tc-chat-composer-swap: 620ms; /* gray layer switch; the label fades scale with it */
  --tc-chat-composer-ease-swap: cubic-bezier(0.72, 0, 0.1, 1);

  container-type: inline-size;
  position: relative;
  width: 100%;
  max-width: 680px;
}
/* The opt-in context tray sits above the composer */
.ui-chat-composer__context { margin-bottom: var(--tc-space-2); }
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body {
  /* 1 unit grows with the width up to 0.27px, so a wider composer keeps compact controls. It never drops below the
     size where the smallest (59.428-unit) labels are 13px (the type floor; the send button is then 24px), and both ends are in
     rem, so the user's font size scales it (WCAG 1.4.4) */
  --u: clamp(calc(0.8125rem / 59.428), calc(100cqw / var(--tc-chat-composer-span, 1900)), calc(0.27rem / 16));
  /* The gray tray frames the white card on every side, like the other components */
  --tc-chat-composer-frame: 20;
  --tc-chat-composer-inset: calc(var(--tc-chat-composer-frame) * var(--u));
  /* The card starts with one text line and grows by one more while typing (set from the script) */
  --tc-chat-composer-card-h: calc(453.576 + var(--tc-chat-composer-grow, 0));
  position: relative;
  /* card + 169 strip + the frame above and below */
  height: calc((var(--tc-chat-composer-card-h) + 169 + 2 * var(--tc-chat-composer-frame)) * var(--u));
  transition: height var(--tc-chat-composer-swap) var(--tc-chat-composer-ease-swap);
  font-family: var(--tc-font-sans);
  font-weight: var(--tc-font-weight-regular);
  font-synthesis: none;
  color: var(--tc-text-muted);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-tap-highlight-color: transparent;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body button {
  appearance: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  letter-spacing: inherit;
  text-align: left;
  cursor: pointer;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body svg {
  display: block;
  max-width: none;
}
/* ---------- Gray layer ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__tray {
  position: absolute;
  inset: 0;
  background: var(--tc-surface-sunken);
  border-radius: calc(92.758 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__row {
  position: absolute;
  /* Shifted by the frame, so the rows keep lining up with the card's content */
  left: calc(84 * var(--u) + var(--tc-chat-composer-inset));
  display: flex;
  align-items: center;
  white-space: nowrap;
}
/* The strip next to the card is 169 units plus the frame, so the rows sit half a frame lower to stay centered */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__project {
  top: calc(50.4 * var(--u) + var(--tc-chat-composer-inset) / 2); /* text optically centered in the strip */
  left: calc(78.5 * var(--u) + var(--tc-chat-composer-inset)); /* the folder glyph has 5.5 units of air on the left */
  height: calc(67 * var(--u));
  gap: calc(26.752 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__connect {
  top: calc((var(--tc-chat-composer-card-h) + 50.4) * var(--u) + var(--tc-chat-composer-inset) * 1.5);
  transition: top var(--tc-chat-composer-swap) var(--tc-chat-composer-ease-swap);
  height: calc(68.155 * var(--u));
  gap: calc(27.213 * var(--u));
  border-radius: calc(24 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__label {
  position: relative;
  display: block;
  font-size: calc(60.453 * var(--u));
  line-height: calc(60.453 * var(--u));
  letter-spacing: calc(-0.5634 * var(--u));
  transition: color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__project .ui-chat-composer__label {
  font-size: calc(59.428 * var(--u));
  line-height: calc(59.428 * var(--u));
  letter-spacing: calc(-0.5539 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__icon {
  position: relative;
  flex: none;
  width: calc(68.155 * var(--u));
  height: calc(68.155 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__icon--folder {
  width: calc(67 * var(--u));
  height: calc(67 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__icon--chevron {
  width: calc(52 * var(--u));
  height: calc(52 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__icon > svg,
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__logo > svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
/* Line icons draw with currentColor */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__icon > svg {
  color: var(--tc-text-muted);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__logos {
  display: flex;
  align-items: center;
  gap: calc(27.213 * var(--u));
  height: calc(59.688 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__logo {
  position: relative;
  flex: none;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__logo--gmail {
  width: calc(56.411 * var(--u));
  height: calc(44.872 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__logo--slack {
  width: calc(49.883 * var(--u));
  height: calc(49.877 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__logo--clickup {
  width: calc(49.71 * var(--u));
  height: calc(59.688 * var(--u));
}
/* ---------- White text area ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__card {
  position: absolute;
  left: var(--tc-chat-composer-inset);
  top: var(--tc-chat-composer-inset);
  box-sizing: border-box;
  width: calc(100% - 2 * var(--tc-chat-composer-inset));
  height: calc(var(--tc-chat-composer-card-h) * var(--u));
  background: var(--tc-surface-raised);
  border: calc(4 * var(--u)) solid var(--tc-border-default);
  border-radius: calc(66 * var(--u));
  box-shadow: var(--tc-shadow-control);
  overflow: clip;
  cursor: text;
  transition:
    transform var(--tc-chat-composer-swap) var(--tc-chat-composer-ease-swap),
    height var(--tc-chat-composer-swap) var(--tc-chat-composer-ease-swap);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__message {
  position: absolute;
  left: calc(66 * var(--u)) /* text starts 73 units from the card edge, like the reference */;
  right: calc(69 * var(--u));
  top: calc(83.2 * var(--u)); /* cap height sits 113 units below the card edge */
  box-sizing: border-box;
  height: calc((106.424 + var(--tc-chat-composer-grow, 0)) * var(--u));
  transition: height var(--tc-chat-composer-swap) var(--tc-chat-composer-ease-swap);
  margin: 0;
  padding: 0;
  border: 0;
  outline: 0;
  background: transparent;
  resize: none;
  overflow-y: auto;
  scrollbar-width: none;
  font: inherit;
  font-size: calc(73.396 * var(--u));
  line-height: calc(106.424 * var(--u));
  letter-spacing: calc(-1.4679 * var(--u));
  color: var(--tc-text-primary);
  caret-color: var(--tc-text-primary);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__message::-webkit-scrollbar {
  display: none;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__message::placeholder {
  color: var(--tc-text-placeholder);
  opacity: 1;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__toolbar {
  position: absolute;
  left: calc(95.2 * var(--u)); /* bottom row centers sit 133 units from the edges */
  top: calc((282.476 + var(--tc-chat-composer-grow, 0)) * var(--u));
  height: calc(68.155 * var(--u));
  display: flex;
  align-items: center;
  gap: calc(46.678 * var(--u));
  transform-origin: 0 50%;
  transition:
    transform var(--tc-chat-composer-swap) var(--tc-chat-composer-ease-swap),
    top var(--tc-chat-composer-swap) var(--tc-chat-composer-ease-swap);
}
/* Right side: model picker, voice and send */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__toolbar--end {
  left: auto;
  right: calc(73 * var(--u));
  gap: calc(40 * var(--u));
  transform-origin: 100% 50%;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__icon-btn,
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model {
  display: flex;
  align-items: center;
  border-radius: calc(24 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model {
  gap: calc(10 * var(--u));
  white-space: nowrap;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__icon-btn svg,
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model svg {
  transition: color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__send {
  position: relative;
  flex: none;
  display: grid;
  place-items: center;
  width: calc(112 * var(--u));
  height: calc(112 * var(--u));
  border-radius: 50%;
  background: var(--tc-action-primary-bg) !important;
  box-shadow: var(--tc-action-primary-shadow);
  transition:
    opacity var(--tc-duration-base) var(--tc-ease-decelerate),
    transform var(--tc-duration-base) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__send svg {
  width: calc(60 * var(--u));
  height: calc(60 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__send:disabled {
  opacity: 0.18;
  cursor: default;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__send:not(:disabled):active {
  transform: scale(0.94);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__approval {
  position: relative;
  display: flex;
  align-items: center;
  gap: calc(21.783 * var(--u));
  border-radius: calc(33.156 * var(--u));
  white-space: nowrap;
  transition: padding var(--tc-duration-slower) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__wash {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--tc-chat-composer-alert-bg);
  opacity: 0;
  transition: opacity var(--tc-duration-base) var(--tc-ease-decelerate);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__approval .ui-chat-composer__icon > svg {
  transition:
    opacity var(--tc-duration-base) var(--tc-ease-decelerate),
    transform var(--tc-duration-slow) var(--tc-ease-move),
    color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__hand {
  transform-origin: 50% 90%;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__shield {
  opacity: 0;
  transform: scale(0.4);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__approval-text {
  position: relative;
  display: grid;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__approval-text > span {
  grid-area: 1 / 1;
  font-size: calc(60.453 * var(--u));
  line-height: calc(60.453 * var(--u));
  letter-spacing: calc(-0.5634 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__request {
  transition:
    color var(--tc-duration-fast) var(--tc-ease-standard),
    opacity var(--tc-duration-base) var(--tc-ease-decelerate),
    filter var(--tc-duration-base) var(--tc-ease-decelerate);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__granted {
  color: var(--tc-chat-composer-alert);
  opacity: 0;
  filter: blur(8px);
  transition:
    opacity var(--tc-duration-base) var(--tc-ease-decelerate),
    filter var(--tc-duration-base) var(--tc-ease-decelerate);
}
/* Loading shimmer: a dark band sweeps once per --load across a copy of the label */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__card:has(.ui-chat-composer__message:focus-visible) {
  outline: var(--tc-focus-outline);
  outline-offset: var(--tc-focus-ring-offset);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body button:focus-visible {
  outline: var(--tc-focus-outline);
  outline-offset: var(--tc-focus-ring-offset);
}
/* ---------- States ---------- */

/* Hover, only while actionable */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-apps="idle"] .ui-chat-composer__connect:hover .ui-chat-composer__label,
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-approval="idle"] .ui-chat-composer__approval:hover .ui-chat-composer__request,
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-apps="done"] .ui-chat-composer__project:hover .ui-chat-composer__label,
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model:hover .ui-chat-composer__label {
  color: var(--tc-text-secondary);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-approval="idle"] .ui-chat-composer__approval:hover .ui-chat-composer__hand,
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__icon-btn:hover svg,
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model:hover .ui-chat-composer__icon svg {
  color: var(--tc-text-secondary);
}
/* Loading */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-apps="loading"] .ui-chat-composer__logo {
  animation: ui-chat-composer-hop var(--tc-chat-composer-load) var(--tc-ease-in-out) 2;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-apps="loading"] .ui-chat-composer__logo--slack {
  animation-delay: var(--tc-duration-instant);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-apps="loading"] .ui-chat-composer__logo--clickup {
  animation-delay: var(--tc-duration-base);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-approval="loading"] .ui-chat-composer__hand {
  animation: ui-chat-composer-wave var(--tc-chat-composer-load) var(--tc-ease-in-out) 2;
}
@keyframes ui-chat-composer-hop {
  0%,
  70%,
  100% {
    transform: translateY(0);
  }
  32% {
    transform: translateY(calc(-13 * var(--u)));
  }
}
@keyframes ui-chat-composer-wave {
  0%,
  76%,
  100% {
    transform: rotate(0deg);
  }
  18% {
    transform: rotate(16deg);
  }
  38% {
    transform: rotate(-10deg);
  }
  58% {
    transform: rotate(7deg);
  }
}
/* Apps connected: the card slides down, the gray layer switches from bottom to top.
   Label timings are fractions of --swap, so the whole switch speeds up or slows down together. */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__connect {
  transition:
    opacity calc(var(--tc-chat-composer-swap) * 0.55) var(--tc-ease-decelerate) calc(var(--tc-chat-composer-swap) * 0.38),
    transform calc(var(--tc-chat-composer-swap) * 0.75) var(--tc-ease-move) calc(var(--tc-chat-composer-swap) * 0.33);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__project {
  opacity: 0;
  transform: translateY(calc(-18 * var(--u)));
  transition:
    opacity calc(var(--tc-chat-composer-swap) * 0.23) var(--tc-ease-decelerate),
    transform calc(var(--tc-chat-composer-swap) * 0.55) var(--tc-chat-composer-ease-swap);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-apps="done"] .ui-chat-composer__connect {
  opacity: 0;
  transform: translateY(calc(18 * var(--u)));
  pointer-events: none;
  transition:
    opacity calc(var(--tc-chat-composer-swap) / 3) var(--tc-ease-decelerate),
    transform calc(var(--tc-chat-composer-swap) * 2 / 3) var(--tc-chat-composer-ease-swap);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-apps="done"] .ui-chat-composer__project {
  opacity: 1;
  transform: none;
  transition:
    opacity calc(var(--tc-chat-composer-swap) / 2) var(--tc-ease-decelerate) calc(var(--tc-chat-composer-swap) * 0.15),
    transform calc(var(--tc-chat-composer-swap) * 0.8) var(--tc-ease-move) calc(var(--tc-chat-composer-swap) * 0.14);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-apps="done"] .ui-chat-composer__card {
  transform: translateY(calc(169 * var(--u)));
}
/* No apps row (hide-connect-apps with hide-project, or hide-project once apps are connected): no strip under the card */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body:is([data-rows="none"], [data-rows="connect"][data-apps="done"]) {
  height: calc((var(--tc-chat-composer-card-h) + 2 * var(--tc-chat-composer-frame)) * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body:is([data-rows="none"], [data-rows="connect"][data-apps="done"]) .ui-chat-composer__card {
  transform: none;
}
/* Approval granted: pill "Unrestricted access" */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-approval="done"] .ui-chat-composer__approval {
  padding: calc(22.104 * var(--u));
  cursor: default;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-approval="done"] .ui-chat-composer__wash {
  opacity: 1;
  transition: opacity var(--tc-duration-slow) var(--tc-ease-decelerate);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-approval="done"] .ui-chat-composer__hand {
  opacity: 0;
  transform: scale(0.4) rotate(-14deg);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-approval="done"] .ui-chat-composer__shield {
  opacity: 1;
  transform: none;
  transition:
    opacity var(--tc-duration-base) var(--tc-ease-decelerate) var(--tc-duration-instant),
    transform var(--tc-duration-slowest) var(--tc-ease-spring) var(--tc-duration-instant);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-approval="done"] .ui-chat-composer__request {
  opacity: 0;
  filter: blur(8px);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-approval="done"] .ui-chat-composer__granted {
  opacity: 1;
  filter: blur(0);
  transition:
    opacity var(--tc-duration-slow) var(--tc-ease-decelerate) var(--tc-duration-instant),
    filter var(--tc-duration-slow) var(--tc-ease-decelerate) var(--tc-duration-instant);
}
/* A failed connect, approval or dictation, said under the composer */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__error {
  margin: var(--tc-space-2) 0 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  text-align: center;
  color: var(--tc-status-danger-fg);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *)[data-ui="chat-composer"] *,
:where([data-look="standard"], [data-look="standard"] *)[data-ui="chat-composer"] *::after {
    transition-duration: 1ms !important;
    transition-delay: 0ms !important;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__logo,
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__hand {
    animation: none !important;
}
}
/* ---------- Pressed feedback for every button ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__icon-btn,
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model {
  transition: transform var(--tc-duration-fast) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-apps="done"] .ui-chat-composer__project:active,
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__icon-btn:active,
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model:active {
  transform: scale(0.96);
}
/* ---------- Model button ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model {
  overflow: clip;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model-face {
  display: inline-flex;
  align-items: center;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model-face[data-morph] {
  animation: ui-chat-composer-model-in var(--tc-duration-slower) var(--tc-ease-move) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model-face[data-morph] .ui-chat-composer__model-logo {
  animation: ui-chat-composer-logo-in var(--tc-duration-slowest) var(--tc-ease-move) both;
}
@keyframes ui-chat-composer-model-in {
  from {
    opacity: 0;
    filter: blur(3px);
    transform: translateY(30%);
  }
}
@keyframes ui-chat-composer-logo-in {
  from {
    opacity: 0;
    transform: scale(0.6) rotate(-12deg);
  }
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model-logo {
  display: grid;
  place-items: center;
  width: calc(50 * var(--u));
  height: calc(50 * var(--u));
  margin-right: calc(6 * var(--u));
  color: var(--tc-text-primary);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model-logo svg {
  width: 100%;
  height: 100%;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model[aria-expanded="true"] .ui-chat-composer__label {
  color: var(--tc-text-secondary);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model[aria-expanded="true"] .ui-chat-composer__icon--chevron svg {
  transform: rotate(180deg);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__icon--chevron svg {
  transition:
    transform var(--tc-duration-base) var(--tc-ease-move),
    color var(--tc-duration-fast) var(--tc-ease-standard);
}
/* ---------- Model menu ----------
   Opening morphs the panel out of the corner next to the model button:
   a clip-path grows from a button-sized piece to the full panel. */
/* Moving the closed shape to the button happens instantly, otherwise the opening would start mid-way */
/* The rows fade in once the shape has opened up, and out first when closing */
/* ---------- Voice recording ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__send svg {
  color: var(--tc-action-primary-fg);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__toolbar--end {
  transition:
    opacity var(--tc-duration-base) var(--tc-ease-decelerate),
    transform var(--tc-duration-slow) var(--tc-ease-move);
}
/* Heard words: the draft sits exactly on top of the text area */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__draft {
  position: absolute;
  left: calc(66 * var(--u));
  right: calc(69 * var(--u));
  top: calc(83.2 * var(--u));
  height: calc((106.424 + var(--tc-chat-composer-grow, 0)) * var(--u));
  overflow: hidden;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  font-size: calc(73.396 * var(--u));
  line-height: calc(106.424 * var(--u));
  letter-spacing: calc(-1.4679 * var(--u));
  color: var(--tc-text-primary);
  pointer-events: none;
  visibility: hidden;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__heard {
  color: var(--tc-text-muted);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-recording="true"] .ui-chat-composer__draft {
  visibility: visible;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-recording="true"] .ui-chat-composer__message {
  color: transparent;
  caret-color: transparent;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-recording="true"] .ui-chat-composer__message::placeholder {
  color: transparent;
}
/* Audio trace: silence is a dot, sound a bar – it scrolls in from the right */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__trace {
  display: flex;
  align-items: center;
  gap: calc(14 * var(--u));
  height: calc(68 * var(--u));
  margin-right: calc(10 * var(--u));
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__trace > span {
  flex: none;
  width: calc(8 * var(--u));
  border-radius: var(--tc-radius-full);
  background: var(--tc-text-secondary);
  transition: height var(--tc-duration-quick) var(--tc-ease-decelerate);
}
/* Discard and confirm: white squares with the card's line, like the send button in size */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__square {
  flex: none;
  display: grid !important;
  place-items: center;
  box-sizing: border-box;
  width: calc(112 * var(--u));
  height: calc(112 * var(--u));
  border: 0 !important;
  border-radius: calc(32 * var(--u)) !important;
  background: var(--tc-action-secondary-bg) !important;
  box-shadow: var(--tc-action-secondary-shadow);
  color: var(--tc-action-secondary-fg) !important;
  transition:
    box-shadow var(--tc-duration-fast) var(--tc-ease-standard),
    transform var(--tc-duration-fast) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__square:hover {
  box-shadow: var(--tc-action-secondary-shadow-hover);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__square:active {
  transform: scale(0.95);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__square svg {
  width: calc(56 * var(--u));
  height: calc(56 * var(--u));
  color: var(--tc-text-primary);
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__toolbar--voice {
  gap: calc(24 * var(--u));
  opacity: 0;
  transform: translateY(calc(16 * var(--u)));
  pointer-events: none;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-recording="true"] .ui-chat-composer__toolbar--end:not(.ui-chat-composer__toolbar--voice) {
  opacity: 0;
  transform: translateY(calc(-16 * var(--u)));
  pointer-events: none;
}
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-recording="true"] .ui-chat-composer__toolbar--voice {
  opacity: 1;
  transform: none;
  pointer-events: auto;
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model-face[data-morph],
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__model-face[data-morph] .ui-chat-composer__model-logo {
    animation: none;
}
}
/* Text fields: no focus box while typing – also against global :focus-visible rules of the host page */
/* Colors and motion as variables – override them on [data-ui="chat-composer"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="chat-composer"] {
  /* the shimmer band over the label: brighter than --tc-shimmer, so it reads on light text in dark mode */
  --tc-chat-composer-shimmer: light-dark(rgba(255, 255, 255, 0.82), #ffffff);
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  --tc-chat-composer-load: 650ms; /* one shimmer sweep; loading runs two */
  position: relative;
  container-type: inline-size;
  width: 100%;
  max-width: 560px;
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body {
  position: relative;
  border-radius: var(--tc-radius-lg);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-secondary);
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body *,
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body *::before,
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body *::after { box-sizing: border-box; }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-chat-composer__body) button {
  appearance: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body svg { display: block; flex: none; max-width: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body:has(.ui-chat-composer__message:focus-visible) { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* ---------- Writing area ---------- */
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__write { padding: var(--tc-space-3-5) var(--tc-space-2-5) var(--tc-space-2-5); cursor: text; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__field { position: relative; padding: 0 var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__message,
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__draft {
  display: block;
  width: 100%;
  height: calc(var(--tc-chat-composer-lines, 1) * 20px);
  margin: 0;
  padding: 0;
  border: 0;
  font: inherit;
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-strong);
  white-space: pre-wrap;
  overflow-wrap: break-word;
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__message {
  outline: 0;
  background: transparent;
  resize: none;
  overflow-y: auto;
  scrollbar-width: none;
  caret-color: var(--tc-accent);
  transition: height var(--tc-duration-moderate) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__message::-webkit-scrollbar { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__message::placeholder { color: var(--tc-text-placeholder); opacity: 1; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__draft { position: absolute; inset: 0 4px; width: auto; overflow: hidden; pointer-events: none; visibility: hidden; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__heard { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-recording="true"] .ui-chat-composer__draft { visibility: visible; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-recording="true"] .ui-chat-composer__message { color: transparent; caret-color: transparent; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-recording="true"] .ui-chat-composer__message::placeholder { color: transparent; }
/* ---------- Tools under the message ---------- */
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__tools { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2); margin-top: var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__group { display: flex; align-items: center; gap: var(--tc-space-1); min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__swap { display: grid; justify-items: end; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__swap > * { grid-area: 1 / 1; }
/* Ghost icon buttons: 28px, icon in the gray of the reference */
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__icon-btn {
  display: grid;
  place-items: center;
  width: var(--tc-control-h-md);
  height: var(--tc-control-h-md);
  border-radius: var(--tc-control-radius-md);
  color: var(--tc-icon-muted);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__icon-btn svg { width: 16px; height: 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__icon-btn svg:not([fill="none"]) { fill: currentColor; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__icon-btn:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__icon-btn:active { transform: scale(0.94); }
/* Request approval: the tab-button look – a hairline, gray text */
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__approval {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-space-2-5) 0 var(--tc-space-2);
  border-radius: var(--tc-control-radius-md);
  box-shadow: inset 0 0 0 0.5px var(--tc-border-default);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  white-space: nowrap;
  color: var(--tc-text-secondary);
  transition: background-color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-approval="idle"] .ui-chat-composer__approval:hover { background: var(--tc-fill-default); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__approval-icon { position: relative; width: 16px; height: 16px; color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__approval-icon svg { position: absolute; inset: 0; width: 100%; height: 100%; transition: opacity var(--tc-duration-base) var(--tc-ease-decelerate), transform var(--tc-duration-slow) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__hand { transform-origin: 50% 90%; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__shield { color: var(--tc-status-danger-fg); opacity: 0; transform: scale(0.4); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__approval-text { position: relative; display: grid; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__approval-text > span { grid-area: 1 / 1; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__request { transition: opacity var(--tc-duration-base) var(--tc-ease-decelerate), filter var(--tc-duration-base) var(--tc-ease-decelerate); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__granted { color: var(--tc-status-danger-fg); opacity: 0; filter: blur(6px); transition: opacity var(--tc-duration-base) var(--tc-ease-decelerate), filter var(--tc-duration-base) var(--tc-ease-decelerate); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-approval="done"] .ui-chat-composer__approval { background: var(--tc-status-danger-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-danger-border); cursor: default; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-approval="done"] .ui-chat-composer__hand { opacity: 0; transform: scale(0.4) rotate(-14deg); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-approval="done"] .ui-chat-composer__shield { opacity: 1; transform: none; transition: opacity var(--tc-duration-base) var(--tc-ease-decelerate) var(--tc-duration-instant), transform var(--tc-duration-slowest) var(--tc-ease-spring) var(--tc-duration-instant); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-approval="done"] .ui-chat-composer__request { opacity: 0; filter: blur(6px); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-approval="done"] .ui-chat-composer__granted { opacity: 1; filter: none; transition: opacity var(--tc-duration-slow) var(--tc-ease-decelerate) var(--tc-duration-instant), filter var(--tc-duration-slow) var(--tc-ease-decelerate) var(--tc-duration-instant); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-approval="loading"] .ui-chat-composer__hand { animation: ui-chat-composer-wave-clean var(--tc-chat-composer-load) var(--tc-ease-in-out) 2; }
/* Model: a quiet button – logo, name and a small chevron */
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__model {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1);
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-space-1-5) 0 var(--tc-space-2);
  overflow: clip;
  border-radius: var(--tc-control-radius-md);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  white-space: nowrap;
  color: var(--tc-action-ghost-fg);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__model:hover,
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__model[aria-expanded="true"] { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__model:active { transform: scale(0.97); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__model-face { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__model-face[data-morph] { animation: ui-chat-composer-model-in-clean var(--tc-duration-slower) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__model-face[data-morph] .ui-chat-composer__model-logo { animation: ui-chat-composer-logo-in-clean var(--tc-duration-slowest) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__model-logo { display: grid; place-items: center; width: 14px; height: 14px; color: var(--tc-text-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__model-logo svg { width: 100%; height: 100%; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__chevron { display: grid; place-items: center; width: 16px; height: 16px; color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__chevron svg { width: 14px; height: 14px; transition: transform var(--tc-duration-base) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__model[aria-expanded="true"] .ui-chat-composer__chevron svg { transform: rotate(180deg); }
/* Send: the dark chip of the reference; empty, it falls back to a gray tile */
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__send {
  display: grid;
  place-items: center;
  flex: none;
  width: var(--tc-control-h-md);
  height: var(--tc-control-h-md);
  margin-left: var(--tc-space-0-5);
  border-radius: var(--tc-control-radius-md);
  background: var(--tc-action-primary-bg) !important;
  color: var(--tc-action-primary-fg);
  transition: background-color var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__send svg { width: 16px; height: 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__send:disabled { background: var(--tc-fill-default) !important; color: var(--tc-text-disabled); cursor: default; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__send:not(:disabled):active { transform: scale(0.94); }
/* Recording: the trace, discard and keep take the place of the right group */
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__group--end { transition: opacity var(--tc-duration-base) var(--tc-ease-decelerate), transform var(--tc-duration-slow) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__group--voice { gap: var(--tc-space-1-5); opacity: 0; transform: translateY(6px); pointer-events: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-recording="true"] .ui-chat-composer__group--end:not(.ui-chat-composer__group--voice) { opacity: 0; transform: translateY(-6px); pointer-events: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-recording="true"] .ui-chat-composer__group--voice { opacity: 1; transform: none; pointer-events: auto; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__trace { display: flex; align-items: center; gap: var(--tc-space-1); height: 20px; margin-right: var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__trace > span { flex: none; width: 2px; border-radius: var(--tc-radius-full); background: var(--tc-accent); transition: height var(--tc-duration-quick) var(--tc-ease-decelerate); }
/* Discard: the white button with the hairline shadow */
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__button {
  display: grid;
  place-items: center;
  width: var(--tc-control-h-md);
  height: var(--tc-control-h-md);
  border-radius: var(--tc-control-radius-md);
  background: var(--tc-action-secondary-bg) !important;
  box-shadow: var(--tc-action-secondary-shadow);
  color: var(--tc-action-secondary-fg);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__button:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__button:active { transform: scale(0.94); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__button svg { width: 16px; height: 16px; }
/* ---------- Last row: connect apps → select a project ---------- */
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__foot {
  display: grid;
  height: 36px;
  padding: 0 var(--tc-space-2);
  border-top: var(--tc-hairline) solid var(--tc-divider);
  overflow: hidden;
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__row {
  grid-area: 1 / 1;
  align-self: center;
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2);
  height: 26px;
  padding: 0 var(--tc-space-2) 0 var(--tc-space-1-5);
  border-radius: var(--tc-radius-sm);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  white-space: nowrap;
  color: var(--tc-text-secondary);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-slow) var(--tc-ease-decelerate), transform var(--tc-duration-slower) var(--tc-ease-move), filter var(--tc-duration-slow) var(--tc-ease-decelerate);
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-apps="idle"] .ui-chat-composer__connect:hover,
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-apps="done"] .ui-chat-composer__project:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__logos { display: flex; align-items: center; gap: var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__logo { position: relative; display: grid; place-items: center; width: 14px; height: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__logo svg { width: 13px; height: 13px; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__folder { width: 16px; height: 16px; color: var(--tc-accent); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__folder svg { width: 100%; height: 100%; fill: currentColor; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__row-chevron { width: 12px; height: 12px; margin-left: -2px; color: var(--tc-text-disabled); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__row-chevron svg { width: 100%; height: 100%; fill: currentColor; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__project { opacity: 0; transform: translateY(10px); filter: blur(3px); pointer-events: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-apps="done"] .ui-chat-composer__connect { opacity: 0; transform: translateY(-10px); filter: blur(3px); pointer-events: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-apps="done"] .ui-chat-composer__project { opacity: 1; transform: none; filter: none; pointer-events: auto; transition-delay: 0ms, 0ms, var(--tc-duration-quick), var(--tc-duration-quick), var(--tc-duration-quick); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-rows="connect"][data-apps="done"] .ui-chat-composer__foot { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-apps="loading"] .ui-chat-composer__logo { animation: ui-chat-composer-hop-clean var(--tc-chat-composer-load) var(--tc-ease-in-out) 2; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-apps="loading"] .ui-chat-composer__logo:nth-child(2) { animation-delay: var(--tc-duration-instant); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__body[data-apps="loading"] .ui-chat-composer__logo:nth-child(3) { animation-delay: var(--tc-duration-base); }
/* Loading shimmer: a dark band sweeps across a copy of the label */
/* ---------- Model menu: grows out of the corner next to the model button ---------- */
/* A failed connect, approval or dictation, said under the composer */
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__error {
  margin: var(--tc-space-2) 0 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  text-align: center;
  color: var(--tc-status-danger-fg);
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__sr-only { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
@keyframes ui-chat-composer-hop-clean { 0%, 70%, 100% { transform: none; } 32% { transform: translateY(-3px); } }
@keyframes ui-chat-composer-wave-clean { 0%, 76%, 100% { transform: rotate(0deg); } 18% { transform: rotate(16deg); } 38% { transform: rotate(-10deg); } 58% { transform: rotate(7deg); } }
@keyframes ui-chat-composer-model-in-clean { from { opacity: 0; filter: blur(3px); transform: translateY(30%); } }
@keyframes ui-chat-composer-logo-in-clean { from { opacity: 0; transform: scale(0.6) rotate(-12deg); } }
/* Narrow containers: the approval button keeps just its icon */
@container (max-width: 400px) {
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__approval { padding: 0; width: 28px; justify-content: center; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__approval-text { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
}
/* Touch screens: taller hit targets */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__icon-btn,
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__send,
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__button { width: 34px; height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__model,
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__approval { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__foot { height: 42px; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__row { height: 32px; }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="clean"], [data-look="clean"] *)[data-ui="chat-composer"] *,
:where([data-look="clean"], [data-look="clean"] *)[data-ui="chat-composer"] *::after { animation: none !important; transition-duration: 1ms !important; transition-delay: 0ms !important; }
}
/* Text fields: no focus box while typing – also against global :focus-visible rules of the host page */
/* ---------- Model menu (both looks): the menu pattern tokens ----------
   Opening morphs the panel out of the corner next to the model button: a clip-path grows from a button-sized
   piece to the full panel. */
.ui-chat-composer__menu {
  --morph: var(--tc-duration-slower) var(--tc-ease-emphasized);
  position: absolute;
  z-index: var(--tc-z-dropdown);
  width: 260px;
  max-width: calc(100cqw - 16px);
  transition: visibility 0s linear 0s;
}
.ui-chat-composer__menu[data-open="false"] {
  visibility: hidden;
  pointer-events: none;
  transition: visibility 0s linear var(--tc-duration-slow);
}
.ui-chat-composer__menu-panel {
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: var(--tc-menu-padding);
  border-radius: var(--tc-menu-radius);
  background: var(--tc-menu-bg);
  box-shadow: var(--tc-menu-shadow);
  outline: none;
  font-family: var(--tc-font-sans);
  letter-spacing: 0;
  /* open: room around the panel so the shadow isn't clipped */
  clip-path: inset(-40px -40px -40px -40px round var(--tc-menu-radius));
  transition: clip-path var(--morph);
}
/* Moving the closed shape to the button happens instantly, otherwise the opening would start mid-way */
.ui-chat-composer__menu[data-placing="true"] .ui-chat-composer__menu-panel {
  transition: none !important;
}
.ui-chat-composer__menu[data-open="false"] .ui-chat-composer__menu-panel {
  clip-path: inset(var(--from-top) 0 var(--from-bottom) var(--from-left) round var(--from-radius));
  transition: clip-path var(--tc-duration-moderate) var(--tc-ease-in-out);
}
/* The rows fade in once the shape has opened up, and out first when closing */
.ui-chat-composer__menu-panel > * {
  transition:
    opacity var(--tc-duration-base) var(--tc-ease-decelerate) var(--tc-duration-instant),
    transform var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-instant);
}
.ui-chat-composer__menu[data-open="false"] .ui-chat-composer__menu-panel > * {
  opacity: 0;
  transition: opacity var(--tc-duration-quick) var(--tc-ease-in);
}
.ui-chat-composer__menu[data-open="false"] .ui-chat-composer__option {
  transform: translateY(4px);
}
.ui-chat-composer__menu[data-open="false"][data-up="false"] .ui-chat-composer__option {
  transform: translateY(-4px);
}
/* The active row: a fill that glides between rows. With the keyboard it is always shown and gets the focus ring,
   since the list itself holds focus (aria-activedescendant) */
.ui-chat-composer__menu-fill {
  position: absolute;
  left: var(--tc-menu-padding);
  right: var(--tc-menu-padding);
  top: 0;
  border-radius: var(--tc-menu-item-radius);
  background: var(--tc-menu-item-hover);
  pointer-events: none;
  transition:
    transform var(--tc-duration-base) var(--tc-ease-move),
    height var(--tc-duration-base) var(--tc-ease-move),
    opacity var(--tc-duration-fast) var(--tc-ease-decelerate);
}
.ui-chat-composer__menu-fill[data-glide="false"] {
  transition: opacity var(--tc-duration-fast) var(--tc-ease-decelerate);
}
.ui-chat-composer__menu-panel:focus-visible .ui-chat-composer__menu-fill {
  opacity: 1 !important;
  box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring);
}
.ui-chat-composer__option {
  position: relative;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  min-height: var(--tc-menu-item-h);
  padding: 6px var(--tc-menu-item-px);
  border-radius: var(--tc-menu-item-radius);
  cursor: pointer;
}
.ui-chat-composer__option-logo {
  display: grid;
  place-items: center;
  flex: none;
  width: 16px;
  height: 16px;
  color: var(--tc-text-primary);
}
.ui-chat-composer__option-logo svg {
  width: 100%;
  height: 100%;
}
.ui-chat-composer__option-text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.ui-chat-composer__option-name {
  font-size: var(--tc-menu-item-font-size);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
}
.ui-chat-composer__option-desc {
  overflow: hidden;
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--tc-text-secondary);
}
/* Selected: accent name and a ✓ (not colour alone) */
.ui-chat-composer__option[aria-selected="true"] .ui-chat-composer__option-name {
  color: var(--tc-menu-item-selected-fg);
}
.ui-chat-composer__option-check {
  flex: none;
  width: 16px;
  height: 16px;
  color: var(--tc-menu-item-selected-fg);
  opacity: 0;
  transform: scale(0.6);
  transition:
    opacity var(--tc-duration-fast) var(--tc-ease-decelerate),
    transform var(--tc-duration-moderate) var(--tc-ease-spring);
}
.ui-chat-composer__option-check svg {
  width: 100%;
  height: 100%;
}
.ui-chat-composer__option[aria-selected="true"] .ui-chat-composer__option-check {
  opacity: 1;
  transform: none;
}
@media (prefers-reduced-motion: reduce) {
  .ui-chat-composer__menu-panel,
  .ui-chat-composer__menu-panel > *,
  .ui-chat-composer__menu-fill,
  .ui-chat-composer__option-check {
    transition-duration: 1ms !important;
    transition-delay: 0ms !important;
  }
}
/* ---------- Focus (both looks) ----------
   The message field shows the focus ring on its card while you type (WCAG 2.4.7); the field itself draws none */
.ui-chat-composer__message:focus-visible {
  outline: none;
}
/* ---------- Loading shimmer (both looks) ----------
   A band of brighter label sweeps twice across the label: the window slides one way and the copy inside it the
   other way, so only transform animates (composited) */
.ui-chat-composer__shimmer {
  position: relative;
}
.ui-chat-composer__shine {
  position: absolute;
  inset: 0;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
  -webkit-mask-image: linear-gradient(90deg, transparent, black 50%, transparent);
  mask-image: linear-gradient(90deg, transparent, black 50%, transparent);
}
.ui-chat-composer__shine > span {
  display: block;
  white-space: nowrap;
  color: var(--tc-chat-composer-shimmer);
}
.ui-chat-composer__body[data-apps="loading"] .ui-chat-composer__connect .ui-chat-composer__shine,
.ui-chat-composer__body[data-approval="loading"] .ui-chat-composer__request .ui-chat-composer__shine {
  opacity: 1;
  animation: ui-chat-composer-sweep var(--tc-chat-composer-load) linear 2 both;
}
.ui-chat-composer__body[data-apps="loading"] .ui-chat-composer__connect .ui-chat-composer__shine > span,
.ui-chat-composer__body[data-approval="loading"] .ui-chat-composer__request .ui-chat-composer__shine > span {
  animation: ui-chat-composer-sweep-text var(--tc-chat-composer-load) linear 2 both;
}
@keyframes ui-chat-composer-sweep {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(100%);
  }
}
@keyframes ui-chat-composer-sweep-text {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(-100%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .ui-chat-composer__shine {
    display: none;
  }
}
/* Standard, narrow: at the type floor the toolbars would meet – "Request approval" keeps just its icon (its name
   stays for screen readers), like Clean below 400px */
@container (max-width: 420px) {
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-approval="idle"] .ui-chat-composer__approval-text,
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__body[data-approval="loading"] .ui-chat-composer__approval-text {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
}
}

/* ---------- Skills: the token behind the text and the argument hint after it ----------
   The mirror sits under the text area with the same box and type; its text is transparent, so only the token's tint
   and the hint (where the text area has no text yet) show through */
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__mirror {
  position: absolute;
  /* The text area's box, widened by the padding that lets the token's tint show at its edge */
  left: calc(66 * var(--u) - var(--tc-space-1));
  right: calc(69 * var(--u) - var(--tc-space-1));
  padding: 0 var(--tc-space-1);
  top: calc(83.2 * var(--u));
  height: calc((106.424 + var(--tc-chat-composer-grow, 0)) * var(--u));
  transition: height var(--tc-chat-composer-swap) var(--tc-chat-composer-ease-swap);
  font-size: calc(73.396 * var(--u));
  line-height: calc(106.424 * var(--u));
  letter-spacing: calc(-1.4679 * var(--u));
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__mirror { position: absolute; inset: 0; padding: 0 var(--tc-space-1); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); }
/* Clean: the text area is positioned too, so it paints over the mirror before it */
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__message { position: relative; }
.ui-chat-composer__mirror { overflow: hidden; color: transparent; white-space: pre-wrap; overflow-wrap: break-word; pointer-events: none; }
.ui-chat-composer__body[data-recording="true"] .ui-chat-composer__mirror { visibility: hidden; }
/* The token: a tint behind "/name" – a spread shadow widens it without moving the text */
.ui-chat-composer__token { border-radius: var(--tc-radius-xs); background: var(--tc-accent-subtle); box-shadow: 0 0 0 var(--tc-space-0-5) var(--tc-accent-subtle); }
.ui-chat-composer__mirror { box-sizing: border-box; }
.ui-chat-composer__arg { color: var(--tc-text-placeholder); }
@media (forced-colors: active) {
  .ui-chat-composer__token { outline: var(--tc-hairline) solid CanvasText; }
  .ui-chat-composer__arg { color: GrayText; }
}

/* ---------- Toolbar row under the composer (opt-in): model, settings, prompts, page context ---------- */
.ui-chat-composer__extras { container-type: inline-size; margin-top: var(--tc-space-2); font-family: var(--tc-font-sans); }
.ui-chat-composer__bar { display: flex; align-items: center; gap: var(--tc-space-1); min-width: 0; }
.ui-chat-composer__picker { flex: none; }
/* The model picker's trigger takes the row's height */
.ui-chat-composer__picker .ui-mdp__trigger { height: var(--tc-control-h-sm); font-size: var(--tc-control-font-size); }
.ui-chat-composer__tool {
  appearance: none;
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-control-h-sm);
  margin: 0;
  padding: 0 var(--tc-control-px-sm);
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  background: none;
  font: inherit;
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-chat-composer__tool:focus-visible, .ui-chat-composer__more-item:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-chat-composer__tool:hover, .ui-chat-composer__tool[aria-expanded="true"] { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-chat-composer__tool-icon { display: block; flex: none; width: 16px; height: 16px; }
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__tool { color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__tool { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__tool .ui-chat-composer__tool-icon { color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__tool:hover .ui-chat-composer__tool-icon { color: currentColor; }
/* Page context: a chip at the end of the row. On, it's tinted with an open eye; off, a dashed outline, a crossed eye
   and "Off" – so the state never rests on colour alone */
.ui-chat-composer__page { flex: 0 1 auto; margin-left: auto; border-radius: var(--tc-radius-full); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-chat-composer__page[data-on="false"] { box-shadow: none; outline: var(--tc-hairline) dashed var(--tc-border-strong); outline-offset: calc(-1 * var(--tc-hairline)); }
.ui-chat-composer__page[data-on="false"]:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-chat-composer__page-title { min-width: var(--tc-space-12); overflow: hidden; text-overflow: ellipsis; color: var(--tc-text-primary); }
.ui-chat-composer__page-meta { flex: none; color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-chat-composer__page[data-on="false"] .ui-chat-composer__page-title { color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__page[data-on="true"] { background: var(--tc-accent-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-info-border); }
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__page[data-on="true"] .ui-chat-composer__tool-icon { color: var(--tc-accent-text); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__page[data-on="true"] { background: var(--tc-surface-control); box-shadow: var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__page[data-on="true"] .ui-chat-composer__tool-icon { color: var(--tc-accent); }
.ui-chat-composer__page-items { width: var(--tc-control-h-sm); padding: 0; justify-content: center; border-radius: var(--tc-radius-full); }
/* The disclaimer: one quiet line under it all */
.ui-chat-composer__disclaimer { margin: var(--tc-space-2) 0 0; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-normal); text-align: center; color: var(--tc-text-muted); }
/* The popovers (internal/popover.ts places them): settings and prompts hold their own card, so the surface is theirs */
.ui-chat-composer__pop[role="dialog"] { width: min(420px, calc(100vw - var(--tc-space-4))); max-height: min(560px, calc(100vh - var(--tc-space-8))); overflow: auto; padding: 0; background: none; overscroll-behavior: contain; }
:where([data-look="standard"], [data-look="standard"] *).ui-chat-composer__pop[role="dialog"] { border-radius: var(--tc-tray-radius); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__pop[role="dialog"] { border-radius: var(--tc-card-radius); }
.ui-chat-composer__pop[role="dialog"] > * { max-width: none; }
.ui-chat-composer__pop[role="menu"] { display: grid; min-width: 180px; }
.ui-chat-composer__more-item {
  appearance: none;
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  height: var(--tc-menu-item-h);
  margin: 0;
  padding: 0 var(--tc-menu-item-px);
  border: 0;
  border-radius: var(--tc-menu-item-radius);
  background: none;
  font: inherit;
  font-size: var(--tc-menu-item-font-size);
  color: var(--tc-text-primary);
  text-align: left;
  cursor: pointer;
}
.ui-chat-composer__more-item:hover, .ui-chat-composer__more-item:focus-visible { background: var(--tc-menu-item-hover); }
.ui-chat-composer__more-item .ui-chat-composer__tool-icon { color: var(--tc-icon-muted); }
/* Folded (a side pane, or a row that doesn't fit): the tools keep only their icons – their names stay for screen
   readers – and the model switch only its glyph; the page context chip keeps its title, which says what's attached.
   Up to 400px wide it starts folded; wider, the script folds it when the row doesn't fit */
.ui-chat-composer__extras:not([data-fold="0"]) :is(.ui-chat-composer__tool-label, .ui-chat-composer__picker ${PICKER_NAME}, .ui-chat-composer__page[data-on="true"] .ui-chat-composer__page-meta) { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-chat-composer__extras:not([data-fold="0"]) .ui-chat-composer__tool:not(.ui-chat-composer__page) { width: var(--tc-control-h-sm); padding: 0; justify-content: center; }
@container (max-width: 400px) {
  :is(.ui-chat-composer__tool-label, .ui-chat-composer__picker ${PICKER_NAME}, .ui-chat-composer__page[data-on="true"] .ui-chat-composer__page-meta) { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .ui-chat-composer__tool:not(.ui-chat-composer__page) { width: var(--tc-control-h-sm); padding: 0; justify-content: center; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-chat-composer__tool { transition: none; }
}
@media (forced-colors: active) {
  .ui-chat-composer__page[data-on="true"] { outline: var(--tc-hairline) solid CanvasText; }
}
`;
}

if (!customElements.get("tc-chat-composer")) customElements.define("tc-chat-composer", TcChatComposer);

declare global {
  interface HTMLElementTagNameMap {
    "tc-chat-composer": TcChatComposer;
  }
}
