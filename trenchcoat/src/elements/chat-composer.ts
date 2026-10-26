import { html, nothing, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { live } from "lit/directives/live.js";
import { styleMap } from "lit/directives/style-map.js";
import "./context-tray";
import type { ContextTrayItem } from "./context-tray";
import { TcElement } from "./internal/base";
import "./mention-picker";
import type { MentionPickerTrigger } from "./mention-picker";
import { FocusRescueController, rescueFocus } from "./internal/controllers";
import type { Look } from "./internal/look";

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
 */

type Step = "idle" | "loading" | "done";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
  /** The model's logo, an element that's cloned */
  logo?: Element;
};

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

let uid = 0;

/**
 * The message box of an AI chat: model picker, voice input, attachments, connecting apps and requesting approval.
 * @tag tc-chat-composer
 * @fires tc-value-change - The message changed (`{ value: string }`) – typing, dictation, clearing after a send; cancelable – prevent it to keep `value` (controlled use)
 * @fires tc-model-change - A model was picked in the menu (`{ model: string; choice: ChatModel }`); cancelable
 * @fires tc-send - A message was sent (`{ message: string; model: string }`); `onSend` may return a promise to keep it until it settles
 * @fires tc-attach - The plus button was pressed – open your own file or folder picker here
 * @fires tc-connect-apps - "Connect apps" was pressed; `onConnectApps` may return a promise it waits for
 * @fires tc-request-approval - "Request approval" was pressed; `onRequestApproval` may return a promise it waits for
 * @fires tc-select-project - "Select a project" was pressed
 */
export class TcChatComposer extends TcElement {
  static override ui = "chat-composer";

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
   * cleared when it resolves and kept, with an error, when it rejects
   */
  @property({ attribute: false }) accessor onSend: ((message: string, details: { model: string }) => void | Promise<unknown>) | undefined = undefined;
  /** Connects the user's apps; "Connect apps" keeps loading until a returned promise settles. Without it connecting is simulated */
  @property({ attribute: false }) accessor onConnectApps: (() => void | Promise<unknown>) | undefined = undefined;
  /** Requests unrestricted access – resolves, rejects and is simulated like onConnectApps */
  @property({ attribute: false }) accessor onRequestApproval: (() => void | Promise<unknown>) | undefined = undefined;

  /** Opt-in: the / and @ picker on the message (tc-mention-picker). Its tc-pick bubbles from the composer */
  @property({ attribute: false }) accessor mentions: MentionPickerTrigger[] | undefined = undefined;
  /** Opt-in: what's in context, as chips above the composer (tc-context-tray). Changes come as tc-items-change; the
   *  composer keeps the new list unless a listener prevents it */
  @property({ attribute: false }) accessor context: ContextTrayItem[] | undefined = undefined;
  /** The context window the tray measures against, in tokens */
  @property({ type: Number, attribute: "context-limit" }) accessor contextLimit = 0;
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

  private uid = `tc-cc-${++uid}`;
  private timers: number[] = [];
  private speaking: number[] = [];
  private dictating: AbortController | null = null;
  private levels = silentTrace();
  private modelWidth = 0;
  private shownModel: string | null = null;
  private ro?: ResizeObserver;
  private reveal = false;
  private wasShown = false;

  private onDocDown = (e: PointerEvent) => {
    const target = e.target as Node;
    if (this.panel?.contains(target) || this.modelButton?.contains(target)) return;
    this.closeMenu(false);
  };

  constructor() {
    super();
    // A control that goes inert or away while focused hands focus on (WCAG 2.4.3): the mic to Discard recording and
    // "Connect apps" to "Select a project" (same data-focus-key), anything else to the message
    new FocusRescueController(this, () => this.textarea);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.timers.forEach((t) => window.clearTimeout(t));
    this.timers = [];
    this.stopSpeaking();
    this.dictating?.abort();
    this.dictating = null;
    this.ro?.disconnect();
    this.ro = undefined;
    document.removeEventListener("pointerdown", this.onDocDown);
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
    return this.value.trim().length > 0 && !this.sending;
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
    if (this.emit("tc-value-change", { value: next }, { cancelable: true })) this.value = next;
    // Controlled: the text area goes back to `value`
    else this.requestUpdate();
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
      const current = this.value;
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
    const message = this.value.trim();
    const details = { model: this.current.id };
    this.emit("tc-send", { message, ...details });
    const result = this.onSend?.(message, details);
    this.textarea?.focus();
    if (!result || typeof (result as Promise<unknown>).then !== "function") {
      this.setMessage("");
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
      this.setMessage("");
      this.status = "Message sent.";
    } catch {
      if (!this.isConnected) return;
      this.fail("Your message wasn't sent. Try again.");
    } finally {
      if (this.isConnected) this.sending = false;
    }
  }

  /* ---------- The model menu ---------- */

  private pickModel(next: ChatModel) {
    if (next.id !== this.current.id) this.morph = true;
    if (this.emit("tc-model-change", { model: next.id, choice: next }, { cancelable: true })) this.model = next.id;
    this.menuOpen = false;
    this.status = `${next.name} selected.`;
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

  /* ---------- Lifecycle ---------- */

  protected override firstUpdated() {
    // The picker attaches to the message, which exists only after the first render
    if (this.mentions?.length) this.requestUpdate();
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

  /* ---------- Rendering ---------- */

  /** Clicking anywhere on the white card (Clean: the writing area) puts the caret in the text area */
  private focusMessage = (event: PointerEvent) => {
    if ((event.target as HTMLElement).closest("button, textarea, input")) return;
    event.preventDefault();
    this.textarea?.focus();
  };
  private onBodyKey = (event: KeyboardEvent) => {
    if (event.key === "Escape" && this.recording) {
      event.preventDefault();
      this.stopRecording(false);
    }
  };
  private onMessageKey = (event: KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      void this.send();
    }
  };

  private logoOf(m: ChatModel, clean: boolean) {
    return m.logo ? m.logo.cloneNode(true) : BUILT_IN.get(m)?.(clean);
  }

  /** The message and, while recording, the heard words in gray behind the confirmed text */
  private writing() {
    const message = this.value;
    const heard = this.heard;
    return html`<textarea
        class="ui-chat-composer__message"
        .value=${live(message)}
        @input=${(e: Event) => this.setMessage((e.target as HTMLTextAreaElement).value)}
        @keydown=${this.onMessageKey}
        placeholder=${this.placeholder}
        aria-label="Message"
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
    const done = this.apps === "done";
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

  /** Clean: the message on top, the tools in a row below it, and a last row for apps and the project */
  private cleanLayout(i: ReturnType<typeof iconsFor>) {
    return html`<div class="ui-chat-composer__write" @pointerdown=${this.focusMessage}>
        <div class="ui-chat-composer__field">${this.writing()}</div>
        <div class="ui-chat-composer__tools">
          <div class="ui-chat-composer__group">
            <button type="button" class="ui-chat-composer__icon-btn" aria-label="Add attachment" @click=${this.attach}>${i.plus}</button>
            ${this.approvalButton(true, i)}
          </div>
          <div class="ui-chat-composer__swap">
            <div class="ui-chat-composer__group ui-chat-composer__group--end" .inert=${this.recording}>
              ${this.modelButtonTemplate(true, i)}
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
      <div class="ui-chat-composer__foot">${this.connectButton(true)}${this.projectButton(true, i)}</div>`;
  }

  /** Standard: a gray tray with "Select a project" / "Connect apps", and the white card on top of it */
  private standardLayout(i: ReturnType<typeof iconsFor>) {
    return html`<div class="ui-chat-composer__tray">${this.projectButton(false, i)}${this.connectButton(false)}</div>
      <div class="ui-chat-composer__card" @pointerdown=${this.focusMessage}>
        ${this.writing()}
        <div class="ui-chat-composer__toolbar">
          <button type="button" class="ui-chat-composer__icon-btn" aria-label="Add attachment" @click=${this.attach}><span class="ui-chat-composer__icon">${i.plus}</span></button>
          ${this.approvalButton(false, i)}
        </div>
        <div class="ui-chat-composer__toolbar ui-chat-composer__toolbar--end" .inert=${this.recording}>
          ${this.modelButtonTemplate(false, i)}
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
        data-apps=${this.apps}
        data-approval=${this.approval}
        data-recording=${this.recording ? "true" : "false"}
        data-sending=${ifDefined(this.sending ? "true" : undefined)}
        style=${styleMap(clean ? { "--tc-chat-composer-lines": String(this.lines) } : { "--tc-chat-composer-grow": String((this.lines - 1) * 106.424) })}
        aria-label="Message composer"
        @keydown=${this.onBodyKey}
      >
        ${clean ? this.cleanLayout(i) : this.standardLayout(i)}${this.menu(clean, i)}
      </section>
      ${this.error ? html`<p class="ui-chat-composer__error" role="alert">${this.error}</p>` : nothing}
      <p class="ui-chat-composer__sr-only" aria-live="polite">${this.status}</p>
      <span id=${`${this.uid}-heard`} hidden>${heard ? `Heard so far: ${heard}` : "Nothing heard yet."}</span>
      ${this.mentions?.length
        ? html`<tc-mention-picker look=${this.resolvedLook} .target=${this.textarea} .triggers=${this.mentions}></tc-mention-picker>`
        : nothing}
    `;
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
  width: 28px;
  height: 28px;
  border-radius: var(--tc-radius-sm);
  color: var(--tc-icon-muted);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__icon-btn svg { width: 16px; height: 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__icon-btn svg:not([fill="none"]) { fill: currentColor; }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__icon-btn:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__icon-btn:active { transform: scale(0.94); }
/* Request approval: the tab-button look – a hairline, gray text */
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__approval {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: 28px;
  padding: 0 var(--tc-space-2-5) 0 var(--tc-space-2);
  border-radius: var(--tc-radius-sm);
  box-shadow: inset 0 0 0 0.5px var(--tc-border-default);
  font-weight: var(--tc-font-weight-medium);
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
  height: 28px;
  padding: 0 var(--tc-space-1-5) 0 var(--tc-space-2);
  overflow: clip;
  border-radius: var(--tc-radius-sm);
  font-weight: var(--tc-font-weight-medium);
  white-space: nowrap;
  color: var(--tc-text-secondary);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__model:hover,
:where([data-look="clean"], [data-look="clean"] *).ui-chat-composer__model[aria-expanded="true"] { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
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
  width: 28px;
  height: 28px;
  margin-left: var(--tc-space-0-5);
  border-radius: var(--tc-radius-sm);
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
  width: 28px;
  height: 28px;
  border-radius: var(--tc-radius-sm);
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
`;
}

if (!customElements.get("tc-chat-composer")) customElements.define("tc-chat-composer", TcChatComposer);

declare global {
  interface HTMLElementTagNameMap {
    "tc-chat-composer": TcChatComposer;
  }
}
