"use client";

/*
 * Command Menu – search and run anything from one field, in a single self-contained file.
 * Actions that use another tool carry its logo (Gmail, Slack, ClickUp …) and a ⌘1–⌘5 shortcut;
 * everyday commands use simple icons. Typing filters every group and offers to ask the assistant about it.
 * ↑ ↓ move row by row, ↵ runs, ⌘1–⌘5 run a suggestion straight away, Esc clears the search or closes,
 * ⌘K (Ctrl K on Windows) focuses the field from anywhere – change it or turn it off with `hotkey`. Tab is left to the browser, so focus can leave the menu.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: command-menu.tsx is Standard,
 * command-menu-clean.tsx is Clean). Clean has no tray – one white panel with hairline shadows, small uppercase
 * group labels, quiet key chips, finer icons and a last row with hints under a hairline; the row highlight fades
 * out while the pointer is outside the list.
 */
// Generated from src/components/command-menu.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent, type ReactNode, type Ref } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "clean";
const ROOT_CLASS = "ui-cm";

export type Command = {
  id: string;
  label: string;
  /** Lighter text after the label, e.g. a person, a channel or a page */
  hint?: string;
  /** "logo" sits on a small white tile; "icon" is a plain glyph */
  icon?: ReactNode;
  logo?: ReactNode;
  /** Keys shown on the right, e.g. ["G", "I"] – suggestions get ⌘1–⌘5 automatically */
  keys?: string[];
  /** Extra words that should find this command */
  keywords?: string;
};

export type CommandGroup = { id: string; label: string; commands: Command[] };

export type CommandMenuOwnProps = {
  groups?: CommandGroup[];
  placeholder?: string;
  /** Called with the command id; for the assistant fallback with "ask" and the typed text. May return a promise: the
   *  menu says it's running, confirms when it resolves and shows an error when it rejects (run it again to retry).
   *  The signal aborts when the menu unmounts. */
  onRun?: (id: string, query: string | undefined, options: { signal: AbortSignal }) => void | Promise<unknown>;
  /** The search text. Controlled when defined; otherwise the menu keeps its own, starting at `defaultQuery` */
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  /** Window shortcut that focuses the field: "mod+k" (⌘K on Apple devices, Ctrl K elsewhere) by default, any other
   *  combination like "ctrl+shift+p", or false for none. One listener per shortcut, however many menus are mounted;
   *  the most recently mounted menu takes it. */
  hotkey?: string | false;
  /** Runs on Esc in an empty search */
  onClose?: () => void;
  /** Focus the field when the menu appears */
  autoFocus?: boolean;
  /** Most rows rendered at once (default 200) – with more matches the menu shows the first ones and asks to keep
   *  typing, so very long lists stay fast */
  maxRows?: number;
  /** Visual style. Defaults to the file's look: Standard in command-menu.tsx, Clean in command-menu-clean.tsx */
  look?: Look;
  className?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

export type CommandMenuProps = Omit<ComponentPropsWithoutRef<"div">, keyof CommandMenuOwnProps> & CommandMenuOwnProps;

/* ---------- Icons ---------- */

const Glyph = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="ui-cm__glyph" aria-hidden="true">
    <path d={d} />
  </svg>
);
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

/* Brand marks – Simple Icons (CC0) and the products' own colors */
/** Unique ids for gradients, so several logos on one page don't clash */
const useSvgId = () => "lg" + useId().replace(/[^a-zA-Z0-9_-]/g, "");

const SparkTile = () => {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#7C5CFF" />
          <stop offset="1" stopColor="#2F9BFF" />
        </linearGradient>
      </defs>
      <path fill={`url(#${id})`} d="M12 2.5c.6 3.9 2.1 6.4 4.4 7.6 1.1.6 2.4.9 4.1 1.1v1.6c-4.6.6-7.3 3-8.5 8.7h-1.6c-.6-3.9-2.1-6.4-4.4-7.6-1.1-.6-2.4-.9-4.1-1.1v-1.6c4.6-.6 7.3-3 8.5-8.7z" />
    </svg>
  );
};

const GmailLogo = () => {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 56.4108 44.8722" fill="none" aria-hidden="true">
      <path
        d="M44.2255 5.76727H56.4051V41.0239C56.4051 43.148 54.683 44.8701 52.5589 44.8701H46.1486C45.8961 44.8701 45.646 44.8204 45.4127 44.7237C45.1794 44.6271 44.9674 44.4854 44.7888 44.3069C44.6102 44.1283 44.4686 43.9163 44.3719 43.683C44.2753 43.4497 44.2255 43.1996 44.2255 42.947V5.76727Z"
        fill={`url(#${id}-0)`}
      />
      <path
        d="M12.1796 5.76727H0V41.0239C0 43.148 1.72213 44.8701 3.84618 44.8701H10.2565C10.509 44.8701 10.7591 44.8204 10.9924 44.7237C11.2257 44.6271 11.4377 44.4854 11.6163 44.3069C11.7949 44.1283 11.9365 43.9163 12.0332 43.683C12.1298 43.4497 12.1796 43.1996 12.1796 42.947V5.76727Z"
        fill="#FC413D"
      />
      <path
        d="M10.0085 1.42778C7.43377 -0.736342 3.5924 -0.403647 1.42828 2.17105C-0.735843 4.74543 -0.403148 8.58681 2.17155 10.7512L26.5557 31.2479C27.0178 31.6362 27.602 31.8492 28.2056 31.8492C28.8091 31.8492 29.3934 31.6362 29.8554 31.2479L54.2396 10.7509C56.814 8.58681 57.1467 4.74543 54.9825 2.17073C52.8184 -0.403648 48.977 -0.736342 46.4027 1.42778L28.2054 16.724L10.0085 1.42778Z"
        fill={`url(#${id}-1)`}
      />
      <defs>
        <linearGradient
          id={`${id}-0`}
          x1="50.3153"
          y1="5.76727"
          x2="50.3153"
          y2="44.8701"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#60D673" />
          <stop offset="0.17" stopColor="#42C868" />
          <stop offset="0.39" stopColor="#0EBC5F" />
          <stop offset="0.62" stopColor="#00A9BB" />
          <stop offset="0.86" stopColor="#3C90FF" />
          <stop offset="1" stopColor="#3186FF" />
        </linearGradient>
        <linearGradient
          id={`${id}-1`}
          x1="6.04194e-05"
          y1="6.45153"
          x2="56.4107"
          y2="6.45153"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.08" stopColor="#FF63A0" />
          <stop offset="0.3" stopColor="#FC413D" />
          <stop offset="0.5" stopColor="#FC413D" />
          <stop offset="0.65" stopColor="#FC413D" />
          <stop offset="0.72" stopColor="#FC5C30" />
          <stop offset="0.86" stopColor="#FEB10C" />
          <stop offset="0.91" stopColor="#FEC700" />
          <stop offset="0.96" stopColor="#FFDB0F" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const SlackLogo = () => (
  <svg viewBox="0 0 49.883 49.877" fill="none" aria-hidden="true">
    <g transform="translate(0 0)">
      <path
        d="M18.3549 10.4784C15.4713 10.4784 13.1157 8.12279 13.1157 5.2392C13.1157 2.35561 15.4713 0 18.3549 0C21.2385 0 23.5941 2.35561 23.5941 5.2392V10.4784H18.3549Z"
        fill="#36C5F0"
      />
      <path
        d="M18.3575 13.12C21.2411 13.12 23.5967 15.4756 23.5967 18.3592C23.5967 21.2428 21.2411 23.5984 18.3575 23.5984H5.2392C2.35561 23.5984 0 21.2428 0 18.3592C0 15.4756 2.35561 13.12 5.2392 13.12H18.3575Z"
        fill="#36C5F0"
      />
    </g>
    <g transform="translate(26.28 0)">
      <path
        d="M13.1244 18.3592C13.1244 15.4756 15.48 13.12 18.3636 13.12C21.2472 13.12 23.6028 15.4756 23.6028 18.3592C23.6028 21.2428 21.2472 23.5984 18.3636 23.5984H13.1244V18.3592Z"
        fill="#2EB67D"
      />
      <path
        d="M10.4785 18.3575C10.4785 21.2411 8.12286 23.5967 5.23927 23.5967C2.35568 23.5967 7.4362e-05 21.2411 7.4362e-05 18.3575V5.2392C7.4362e-05 2.35561 2.35568 0 5.23927 0C8.12286 0 10.4785 2.35561 10.4785 5.2392V18.3575Z"
        fill="#2EB67D"
      />
    </g>
    <g transform="translate(0 26.28)">
      <path
        d="M10.4784 5.2392C10.4784 8.12279 8.12279 10.4784 5.2392 10.4784C2.35561 10.4784 0 8.12279 0 5.2392C0 2.35561 2.35561 0 5.2392 0H10.4784V5.2392Z"
        fill="#E01E5A"
      />
      <path
        d="M13.1157 5.2392C13.1157 2.35561 15.4713 0 18.3549 0C21.2385 0 23.5941 2.35561 23.5941 5.2392V18.3575C23.5941 21.2411 21.2385 23.5967 18.3549 23.5967C15.4713 23.5967 13.1157 21.2411 13.1157 18.3575V5.2392Z"
        fill="#E01E5A"
      />
    </g>
    <g transform="translate(26.28 26.28)">
      <path
        d="M5.23927 13.1157C8.12286 13.1157 10.4785 15.4713 10.4785 18.3549C10.4785 21.2385 8.12286 23.5941 5.23927 23.5941C2.35568 23.5941 7.4362e-05 21.2385 7.4362e-05 18.3549V13.1157H5.23927Z"
        fill="#ECB22E"
      />
      <path
        d="M5.23927 10.4784C2.35568 10.4784 7.4362e-05 8.12279 7.4362e-05 5.2392C7.4362e-05 2.35561 2.35568 0 5.23927 0H18.3576C21.2412 0 23.5968 2.35561 23.5968 5.2392C23.5968 8.12279 21.2412 10.4784 18.3576 10.4784H5.23927Z"
        fill="#ECB22E"
      />
    </g>
  </svg>
);

const ClickUpLogo = () => {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 49.7096 59.6884" fill="none" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 45.9002L9.1618 38.8247C14.0602 45.1745 19.2307 48.1679 24.9455 48.1679C30.6603 48.1679 35.7401 45.2652 40.3663 38.9154L49.7096 45.8094C42.997 54.8805 34.6516 59.6882 24.9455 59.6882C15.3301 59.6882 6.89403 54.8805 0 45.9002Z"
        fill={`url(#${id}-0)`}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24.9535 15.3301L8.62558 29.3903L1.09657 20.5914L25.0442 0L48.8105 20.5914L41.1908 29.2996L24.9535 15.3301Z"
        fill={`url(#${id}-1)`}
      />
      <defs>
        <linearGradient id={`${id}-0`} x1="0" y1="49.2666" x2="49.75" y2="49.2666" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8930FD" />
          <stop offset="1" stopColor="#49CCF9" />
        </linearGradient>
        <linearGradient
          id={`${id}-1`}
          x1="1.09231"
          y1="14.6901"
          x2="48.7603"
          y2="14.6901"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF02F0" />
          <stop offset="1" stopColor="#FFC800" />
        </linearGradient>
      </defs>
    </svg>
  );
};

const HubSpotLogo = () => (
  <svg viewBox="0 0 24 24" fill="#FF7A59" aria-hidden="true">
    <path d="M18.164 7.93V5.084a2.198 2.198 0 001.267-1.978v-.067A2.2 2.2 0 0017.238.845h-.067a2.2 2.2 0 00-2.193 2.193v.067a2.196 2.196 0 001.252 1.973l.013.006v2.852a6.22 6.22 0 00-2.969 1.31l.012-.01-7.828-6.095A2.497 2.497 0 104.3 4.656l-.012.006 7.697 5.991a6.176 6.176 0 00-1.038 3.446c0 1.343.425 2.588 1.147 3.607l-.013-.02-2.342 2.343a1.968 1.968 0 00-.58-.095h-.002a2.033 2.033 0 102.033 2.033 1.978 1.978 0 00-.1-.595l.005.014 2.317-2.317a6.247 6.247 0 104.782-11.134l-.036-.005zm-.964 9.378a3.206 3.206 0 113.215-3.207v.002a3.206 3.206 0 01-3.207 3.207z" />
  </svg>
);
const CalendarLogo = () => (
  <svg viewBox="0 0 24 24" fill="#4285F4" aria-hidden="true">
    <path d="M18.316 5.684H24v12.632h-5.684V5.684zM5.684 24h12.632v-5.684H5.684V24zM18.316 5.684V0H1.895A1.894 1.894 0 0 0 0 1.895v16.421h5.684V5.684h12.632zm-7.207 6.25v-.065c.272-.144.5-.349.687-.617s.279-.595.279-.982c0-.379-.099-.72-.3-1.025a2.05 2.05 0 0 0-.832-.714 2.703 2.703 0 0 0-1.197-.257c-.6 0-1.094.156-1.481.467-.386.311-.65.671-.793 1.078l1.085.452c.086-.249.224-.461.413-.633.189-.172.445-.257.767-.257.33 0 .602.088.816.264a.86.86 0 0 1 .322.703c0 .33-.12.589-.36.778-.24.19-.535.284-.886.284h-.567v1.085h.633c.407 0 .748.109 1.02.327.272.218.407.499.407.843 0 .336-.129.614-.387.832s-.565.327-.924.327c-.351 0-.651-.103-.897-.311-.248-.208-.422-.502-.521-.881l-1.096.452c.178.616.505 1.082.977 1.401.472.319.984.478 1.538.477a2.84 2.84 0 0 0 1.293-.291c.382-.193.684-.458.902-.794.218-.336.327-.72.327-1.149 0-.429-.115-.797-.344-1.105a2.067 2.067 0 0 0-.881-.689zm2.093-1.931l.602.913L15 10.045v5.744h1.187V8.446h-.827l-2.158 1.557zM22.105 0h-3.289v5.184H24V1.895A1.894 1.894 0 0 0 22.105 0zm-3.289 23.5l4.684-4.684h-4.684V23.5zM0 22.105C0 23.152.848 24 1.895 24h3.289v-5.184H0v3.289z" />
  </svg>
);
const NotionLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
  </svg>
);

/** Sample commands – replace with your own */
export const defaultGroups: CommandGroup[] = [
  {
    id: "suggestions",
    label: "Suggestions",
    commands: [
      { id: "email", label: "Write an email", hint: "Gmail", logo: <GmailLogo />, keywords: "mail send compose" },
      { id: "ask", label: "Ask assistant", hint: "Summaries, drafts, answers", logo: <SparkTile />, keywords: "ai chat question" },
      { id: "task", label: "Create a task", hint: "ClickUp", logo: <ClickUpLogo />, keywords: "todo issue" },
      { id: "crm", label: "Add contact to CRM", hint: "HubSpot", logo: <HubSpotLogo />, keywords: "lead deal company" },
      { id: "meet", label: "Schedule a meeting", hint: "Google Calendar", logo: <CalendarLogo />, keywords: "call invite event" },
    ],
  },
  {
    id: "share",
    label: "Share",
    commands: [
      { id: "slack", label: "Post an update", hint: "#team-updates", logo: <SlackLogo />, keywords: "message channel" },
      { id: "notion", label: "Save as page", hint: "Notion · Meeting notes", logo: <NotionLogo />, keywords: "doc wiki" },
    ],
  },
  {
    id: "general",
    label: "General",
    commands: [
      { id: "new-doc", label: "New document", icon: <Glyph d={icons.doc} />, keys: ["N"] },
      { id: "invite", label: "Invite teammates", icon: <Glyph d={icons.person} />, keys: ["I"] },
      { id: "upload", label: "Upload files", icon: <Glyph d={icons.upload} />, keys: ["U"] },
      { id: "theme", label: "Switch to dark mode", icon: <Glyph d={icons.moon} />, keywords: "theme appearance light", keys: ["⇧", "D"] },
    ],
  },
  {
    id: "go",
    label: "Go to",
    commands: [
      { id: "home", label: "Home", icon: <Glyph d={icons.home} />, keys: ["G", "H"] },
      { id: "inbox", label: "Inbox", icon: <Glyph d={icons.inbox} />, keys: ["G", "I"] },
      { id: "reports", label: "Reports", icon: <Glyph d={icons.chart} />, keys: ["G", "R"] },
      { id: "settings", label: "Settings", icon: <Glyph d={icons.gear} />, keys: ["G", "S"] },
      { id: "help", label: "Help & feedback", icon: <Glyph d={icons.help} />, keys: ["?"] },
    ],
  },
];

/** The typed text, bold where it matches */
function Highlight({ text, query }: { text: string; query: string }) {
  const i = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

/** Apple devices show ⌘ – read in an effect, never during render */
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

/** Standard: the tray below the card · Clean: the panel's last row, under a hairline – a hint, or what just ran */
function MenuFooter({
  clean,
  status,
  ran,
  hotkey,
  mod,
}: {
  clean: boolean;
  status: { id: string; label: string; state: "pending" | "failed" } | null;
  ran: { id: string; label: string } | null;
  hotkey: string | false | null | undefined;
  mod: string;
}) {
  return (
  <footer className="ui-cm__foot">
    {status ? (
      <span className="ui-cm__done" key={status.state + status.label} data-state={status.state}>
        {status.state === "failed" &&
          (clean ? (
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <path d="M5 5l6 6M11 5l-6 6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 7l10 10M17 7 7 17" />
            </svg>
          ))}
        <span className="ui-cm__done-text">{status.state === "pending" ? `${status.label}…` : status.label}</span>
      </span>
    ) : ran ? (
      <span className="ui-cm__done" key={ran.label}>
        {clean ? (
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="m3.5 8.5 3 3 6-7" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        )}
        <span className="ui-cm__done-text">{ran.label}</span>
      </span>
    ) : (
      <span className="ui-cm__tip">
        <kbd>↑</kbd>
        <kbd>↓</kbd> to move, <kbd>↵</kbd> to run
      </span>
    )}
    {hotkey && (
      <span className="ui-cm__foot-right">
        <span className="ui-cm__keys">
          {comboKeys(hotkey, mod).map((k, i) => (
            <kbd key={i}>{k}</kbd>
          ))}
        </span>
        to open
      </span>
    )}
  </footer>
  );
}

/** One command in the list */
function CommandRow({
  id,
  cmd,
  query,
  keys,
  selected,
  ran,
  pending,
  onHover,
  onRun,
}: {
  id: string;
  cmd: Command;
  query: string;
  keys: string[] | undefined;
  selected: boolean;
  ran: boolean;
  pending: boolean;
  onHover: () => void;
  onRun: () => void;
}) {
  return (
    <button
      id={id}
      data-id={cmd.id}
      type="button"
      role="option"
      aria-selected={selected}
      data-ran={ran || undefined}
      data-pending={pending || undefined}
      className="ui-cm__item"
      tabIndex={-1}
      onMouseMove={onHover}
      onClick={onRun}
    >
      {cmd.logo ? <span className="ui-cm__logo">{cmd.logo}</span> : <span className="ui-cm__icon">{cmd.icon}</span>}
      <span className="ui-cm__text">
        <span className="ui-cm__name">
          <Highlight text={cmd.label} query={query} />
        </span>
        {cmd.hint && (
          <span className="ui-cm__hint">
            <Highlight text={cmd.hint} query={query} />
          </span>
        )}
      </span>
      {keys && (
        <span className="ui-cm__keys" aria-hidden="true">
          {keys.map((k, i) => (
            <kbd key={i}>{k}</kbd>
          ))}
        </span>
      )}
    </button>
  );
}

export function CommandMenu({
  groups = defaultGroups,
  placeholder = "Type a command or search…",
  onRun,
  onClose,
  autoFocus,
  maxRows = 200,
  query: queryProp,
  defaultQuery = "",
  onQueryChange,
  hotkey = "mod+k",
  look,
  className,
  ref,
  ...rest
}: CommandMenuProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const clean = resolvedLook === "clean";
  const id = "ui-cm" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const root = useRef<HTMLDivElement>(null);
  const rootRef = useRootRef(root, ref);
  const input = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const [query, setQuery] = useControllable(queryProp, defaultQuery, onQueryChange, "query");
  const [active, setActive] = useState<string | null>(null);
  const [ran, setRan] = useState<{ id: string; label: string } | null>(null);
  // A run that returned a promise: still going, or failed (shown until the next run)
  const [status, setStatus] = useState<{ id: string; label: string; state: "pending" | "failed" } | null>(null);
  const [pill, setPill] = useState<{ y: number; h: number } | null>(null);
  // What the persistent live regions say: a finished run (status) or a failed one (alert). Repeats of the same text
  // alternate a trailing no-break space, so they are announced again
  const [said, setSaid] = useState<{ text: string; alert: boolean; n: number }>({ text: "", alert: false, n: 0 });
  const say = (text: string, alert = false) => setSaid((p) => ({ text, alert, n: p.n + 1 }));
  // The highlight shows while the pointer is over the list or the keyboard moves – leaving the list fades it out
  // (only the Clean look's CSS fades it)
  const [lit, setLit] = useState(true);
  // "Ctrl" on the server and in the first render, "⌘" once mounted on an Apple device (before paint)
  const [mod, setMod] = useState("Ctrl");
  useLayoutEffect(() => {
    if (isApple()) setMod("⌘");
  }, []);

  const q = query.trim();
  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    const result = groups
      .map((g) => ({
        ...g,
        commands: g.commands.filter((c) => !needle || `${c.label} ${c.hint ?? ""} ${c.keywords ?? ""}`.toLowerCase().includes(needle)),
      }))
      .filter((g) => g.commands.length);
    // With text typed, the first row always offers to ask the assistant about it
    if (needle) result.unshift({ id: "ask-about", label: "Assistant", commands: [{ id: "ask-about", label: `Ask assistant about “${q}”`, logo: <SparkTile /> }] });
    // Very long lists: only the first `maxRows` rows are rendered – typing narrows them down
    const total = result.reduce((n, g) => n + g.commands.length, 0);
    if (total <= maxRows) return { groups: result, total, cut: false };
    let left = maxRows;
    const cut = result
      .map((g) => {
        const commands = g.commands.slice(0, Math.max(0, left));
        left -= commands.length;
        return { ...g, commands };
      })
      .filter((g) => g.commands.length);
    return { groups: cut, total, cut: true };
  }, [groups, q, maxRows]);
  const shown = filtered.groups;
  const order = shown.flatMap((g) => g.commands);
  const suggestions = shown.find((g) => g.id === "suggestions")?.commands ?? [];
  const current = order.find((c) => c.id === active) ?? order[0];

  // Keyboard moves keep the active row in view; the mouse never scrolls the list
  const byKeyboard = useRef(false);

  // The highlight glides to the active row
  useLayoutEffect(() => {
    const list = listRef.current;
    const row = list?.querySelector<HTMLElement>(`[data-id="${current?.id}"]`);
    if (!list || !row) return setPill(null);
    const y = row.offsetTop;
    const h = row.offsetHeight;
    // Once shown, the pill glides by a style write – only its first appearance is rendered
    const el = pillRef.current;
    if (el) {
      el.style.transform = `translateY(${y}px)`;
      el.style.height = `${h}px`;
    } else setPill({ y, h });
    if (!byKeyboard.current) return;
    byKeyboard.current = false;
    // Scroll only the list (never the page), keeping a little room and the group title above the first row in view
    const pad = 8;
    const label = row.previousElementSibling?.classList.contains("ui-cm__label") ? (row.previousElementSibling as HTMLElement).offsetHeight : 0;
    const top = row.offsetTop - pad - label;
    const bottom = row.offsetTop + row.offsetHeight + pad;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }, [current?.id, order.length]);

  // The list's height follows its rows (up to its max height), so searching makes the menu glide smaller, not jump
  useLayoutEffect(() => {
    const list = listRef.current;
    const inner = innerRef.current;
    if (!list || !inner) return;
    const measure = () => {
      const style = getComputedStyle(list);
      const pad = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
      const max = parseFloat(style.maxHeight) || Infinity;
      // Written straight to the list: a new height is a CSS transition, not a re-render
      const height = `${Math.min(inner.offsetHeight + pad, max)}px`;
      if (list.style.height !== height) list.style.height = height;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(inner);
    return () => ro.disconnect();
  }, []);

  // ⌘K / Ctrl K (or the chosen hotkey) focuses the field from anywhere
  useHotkey(hotkey, () => {
    input.current?.focus();
    input.current?.select();
  });

  // Runs still going when the menu unmounts are aborted, and never set state afterwards
  const runs = useRef(new Set<AbortController>());
  useEffect(() => {
    const live = runs.current;
    return () => {
      live.forEach((c) => c.abort());
      live.clear();
    };
  }, []);

  useEffect(() => {
    if (autoFocus) input.current?.focus();
  }, [autoFocus]);

  // A short confirmation in the tray after running a command
  useEffect(() => {
    if (!ran) return;
    const t = window.setTimeout(() => setRan(null), 1800);
    return () => window.clearTimeout(t);
  }, [ran]);

  const run = (cmd: Command) => {
    if (status?.state === "pending") return;
    setActive(cmd.id);
    const label = cmd.id === "ask-about" ? `Asked the assistant about “${q}”` : cmd.label;
    const controller = new AbortController();
    const result = cmd.id === "ask-about" ? onRun?.("ask", q, { signal: controller.signal }) : onRun?.(cmd.id, undefined, { signal: controller.signal });
    const done = cmd.id === "ask-about" ? label : `Ran “${cmd.label}”`;
    if (!(result instanceof Promise)) {
      setStatus(null);
      setRan({ id: cmd.id, label });
      say(done);
      return;
    }
    runs.current.add(controller);
    setRan(null);
    setStatus({ id: cmd.id, label: cmd.id === "ask-about" ? "Asking the assistant" : cmd.label, state: "pending" });
    result.then(
      () => {
        if (!runs.current.delete(controller)) return;
        setStatus(null);
        setRan({ id: cmd.id, label });
        say(done);
      },
      () => {
        if (!runs.current.delete(controller)) return;
        const failed = cmd.id === "ask-about" ? "Couldn't ask the assistant" : `Couldn't run “${cmd.label}”`;
        setStatus({ id: cmd.id, label: failed, state: "failed" });
        say(failed, true);
      },
    );
  };

  const move = (step: number) => {
    if (!order.length || !current) return;
    byKeyboard.current = true;
    setLit(true);
    const i = order.findIndex((c) => c.id === current.id);
    setActive(order[(i + step + order.length) % order.length].id);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Keys typed into an IME (picking a candidate with ↵, moving through it with arrows) belong to the IME
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      move(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Enter" && current) {
      e.preventDefault();
      run(current);
    } else if (e.key === "Escape") {
      if (query) setQuery("");
      else onClose?.();
    } else if ((e.metaKey || e.ctrlKey) && /^[1-5]$/.test(e.key)) {
      const cmd = suggestions[Number(e.key) - 1];
      if (cmd) {
        e.preventDefault();
        run(cmd);
      }
    }
  };

  // Standard: the tray below the card · Clean: the panel's last row, under a hairline – a hint, or what just ran
  const foot = <MenuFooter clean={clean} status={status} ran={ran} hotkey={hotkey} mod={mod} />;

  return (
    <div {...rest} ref={rootRef} className={[ROOT_CLASS, className].filter(Boolean).join(" ")} data-look={resolvedLook} aria-busy={status?.state === "pending" || undefined}>
      {/* React 19 hoists this into <head> once, no matter how many instances render */}
      <style href="ui-command-menu" precedence="default">
        {css}
      </style>

      <div className="ui-cm__card">
        <label className="ui-cm__search">
          {clean ? (
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="7.25" cy="7.25" r="4.75" />
              <path d="m13.5 13.5-2.9-2.9" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          )}
          <input
            ref={input}
            value={query}
            placeholder={placeholder}
            aria-label="Command"
            role="combobox"
            aria-expanded="true"
            aria-controls={`${id}-list`}
            aria-activedescendant={current ? `${id}-${current.id}` : undefined}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(null);
            }}
            onKeyDown={onKeyDown}
          />
          {clean ? (
            <kbd className="ui-cm__enter" aria-hidden="true">
              <svg viewBox="0 0 16 16">
                <path d="M12.5 4v3a2 2 0 0 1-2 2h-7M6 6.5 3.5 9 6 11.5" />
              </svg>
            </kbd>
          ) : (
            <span className="ui-cm__enter" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M19 6v5a3 3 0 0 1-3 3H6m4-4-4 4 4 4" />
              </svg>
              Enter
            </span>
          )}
        </label>

        <div
          ref={listRef}
          id={`${id}-list`}
          className="ui-cm__list"
          role="listbox"
          aria-label="Commands"
          onMouseLeave={() => setLit(false)}
        >
          {pill && <span ref={pillRef} className="ui-cm__pill" data-lit={lit || undefined} style={{ transform: `translateY(${pill.y}px)`, height: pill.h }} aria-hidden="true" />}
          <div ref={innerRef} className="ui-cm__inner">
          {shown.map((group) => (
            <div key={group.id} role="group" aria-label={group.label} className="ui-cm__group">
              {group.id !== "ask-about" && <span className="ui-cm__label">{group.label}</span>}
              {group.commands.map((cmd) => {
                const n = group.id === "suggestions" ? suggestions.indexOf(cmd) + 1 : 0;
                return (
                  <CommandRow
                    key={cmd.id}
                    id={`${id}-${cmd.id}`}
                    cmd={cmd}
                    query={q}
                    keys={n ? [mod, String(n)] : cmd.keys}
                    selected={cmd.id === current?.id}
                    ran={ran?.id === cmd.id}
                    pending={status?.state === "pending" && status.id === cmd.id}
                    onHover={() => {
                      setLit(true);
                      if (cmd.id !== current?.id) setActive(cmd.id);
                    }}
                    onRun={() => {
                      run(cmd);
                      input.current?.focus({ preventScroll: true });
                    }}
                  />
                );
              })}
            </div>
          ))}
          </div>
        </div>
        {filtered.cut && (
          <p className="ui-cm__more">
            Showing {order.length} of {filtered.total} – keep typing to narrow the list
          </p>
        )}
        {clean && foot}
      </div>
      {!clean && foot}
      {/* Mounted from the start, so screen readers announce what they say: final results only */}
      <span className="ui-cm__sr" role="status">
        {!said.alert && said.text ? said.text + (said.n % 2 ? "" : "\u00a0") : ""}
      </span>
      <span className="ui-cm__sr" role="alert">
        {said.alert ? said.text + (said.n % 2 ? "" : "\u00a0") : ""}
      </span>
    </div>
  );
}

/* ---------- Shared helpers (inlined from src/internal) ---------- */

// Written as the literal `process.env.NODE_ENV` so bundlers replace it and production builds skip the warning;
// without a bundler `process` doesn't exist and the warning stays off
declare const process: { env: { NODE_ENV?: string } };
const DEV = (() => {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
})();

/**
 * State that a parent may control. `value` defined → controlled: the component shows `value` and only asks for
 * changes through `onChange`. `value` undefined → uncontrolled: the component keeps its own state, starting at
 * `defaultValue`, and still reports changes. Whether `onChange` is passed never decides which – passing a callback
 * for analytics must not freeze the component.
 */
function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void, name?: string) {
  const controlled = value !== undefined;
  // Like React's <input value> without onChange: a controlled value nobody can change is almost always a
  // starting value passed to the wrong prop, so say so once (in development)
  const warned = useRef(false);
  if (controlled && !onChange && !warned.current && DEV) {
    warned.current = true;
    console.warn(
      `Trenchcoat: ${name ? `\`${name}\`` : "a value prop"} is set without its change handler, so it can't change. ` +
        "Pass the handler to control it, or use the default… prop for a starting value.",
    );
  }
  const [own, setOwn] = useState(defaultValue);
  const current = controlled ? value : own;
  // Read through refs so the setter is stable and never acts on a stale value
  const latest = useRef(current);
  latest.current = current;
  const report = useRef(onChange);
  report.current = onChange;
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(latest.current) : next;
      if (Object.is(resolved, latest.current)) return;
      if (!controlled) setOwn(resolved);
      latest.current = resolved;
      report.current?.(resolved);
    },
    [controlled],
  );
  return [current, set] as const;
}

/** A ref callback that fills `own` and the caller's ref (object or callback, incl. React 19 cleanups) */
function useRootRef<T>(own: { current: T | null }, ref: Ref<T> | undefined) {
  return useCallback(
    (el: T | null) => {
      own.current = el;
      const cleanup = typeof ref === "function" ? ref(el) : (ref && (ref.current = el), undefined);
      return () => {
        own.current = null;
        if (typeof cleanup === "function") cleanup();
        else if (typeof ref === "function") ref(null);
        else if (ref) ref.current = null;
      };
    },
    [own, ref],
  );
}

type Combo = { key: string; mod: boolean; ctrl: boolean; meta: boolean; shift: boolean; alt: boolean };
/** "mod+k", "ctrl+shift+p", "F8" – mod is ⌘ on Apple devices and Ctrl elsewhere */
const parseCombo = (combo: string): Combo => {
  const parts = combo.toLowerCase().split("+").map((p) => p.trim());
  const key = parts.pop() || "+";
  const has = (m: string) => parts.includes(m);
  return { key, mod: has("mod"), ctrl: has("ctrl") || has("control"), meta: has("meta") || has("cmd"), shift: has("shift"), alt: has("alt") || has("option") };
};
const comboMatches = (e: globalThis.KeyboardEvent, c: Combo) => {
  if (e.key.toLowerCase() !== c.key && e.code.toLowerCase() !== c.key) return false;
  if (c.mod ? !(e.metaKey || e.ctrlKey) : (c.ctrl && !e.ctrlKey) || (c.meta && !e.metaKey)) return false;
  if (!c.mod && !c.ctrl && !c.meta && (e.ctrlKey || e.metaKey)) return false;
  return (!c.shift || e.shiftKey) && (!c.alt || e.altKey);
};

/** A handler may return false to say it didn't act – the next one (older instance) gets a turn */
type Handler = () => boolean | void;
type Entry = { handlers: Handler[]; listener: (e: globalThis.KeyboardEvent) => void };
// Kept on globalThis so every published file shares it: two menus from two files still mean one listener
const registry = ((globalThis as { [k: symbol]: Map<string, Entry> })[Symbol.for("trenchcoat.hotkeys")] ??= new Map<string, Entry>());

/**
 * Runs `run` when `combo` is pressed anywhere on the page. `false` registers nothing and never calls preventDefault.
 * The newest instance wins; IME composition and already-handled events are ignored.
 */
function useHotkey(combo: string | false | null | undefined, run: Handler) {
  const latest = useRef(run);
  latest.current = run;
  useEffect(() => {
    if (!combo) return;
    const name = combo.toLowerCase().replace(/\s+/g, "");
    let entry = registry.get(name);
    if (!entry) {
      const parsed = parseCombo(name);
      const handlers: Handler[] = [];
      const listener = (e: globalThis.KeyboardEvent) => {
        if (e.defaultPrevented || e.isComposing || !comboMatches(e, parsed)) return;
        for (let i = handlers.length - 1; i >= 0; i--) {
          if (handlers[i]() !== false) {
            e.preventDefault();
            return;
          }
        }
      };
      window.addEventListener("keydown", listener);
      registry.set(name, (entry = { handlers, listener }));
    }
    const own = entry;
    const handler: Handler = () => latest.current();
    own.handlers.push(handler);
    return () => {
      own.handlers.splice(own.handlers.indexOf(handler), 1);
      if (!own.handlers.length) {
        window.removeEventListener("keydown", own.listener);
        registry.delete(name);
      }
    };
  }, [combo]);
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
.ui-cm:where([data-look="standard"]),
.ui-cm__portal:where([data-look="standard"]) {
  --_tc-accent: #2f68ff;
  --_tc-accent-highlight: light-dark(rgba(47, 107, 255, 0.16), rgba(109, 139, 255, 0.26));
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-border-selected: light-dark(#2f68ff, #6b95ff);
  --_tc-border-strong: light-dark(#dedede, #3a3a40);
  --_tc-caption-color: light-dark(#646464, #9a9aa1);
  --_tc-caption-font-size: 12px;
  --_tc-caption-font-weight: 500;
  --_tc-caption-line-height: 16px;
  --_tc-caption-tracking: 0;
  --_tc-caption-transform: none;
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xs: 11px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-hairline: 1px;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-kbd-bg: light-dark(#ffffff, #19191b);
  --_tc-kbd-fg: light-dark(#404040, #c8c8cc);
  --_tc-kbd-font-size: 10.5px;
  --_tc-kbd-font-weight: 500;
  --_tc-kbd-h: 18px;
  --_tc-kbd-px: 4px;
  --_tc-kbd-radius: 5px;
  --_tc-kbd-shadow: inset 0 0 0 1px light-dark(#dedede, #3a3a40), 0 1px 0 light-dark(#ececec, #2a2a2e);
  --_tc-line-height-none: 1;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-tight: 16px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-lg: 10px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-control: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-overlay: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-danger-solid: light-dark(#e5484d, #ff6369);
  --_tc-status-success-solid: light-dark(#1f8a4c, #3ec27a);
  --_tc-surface-on-tray: light-dark(#ffffff, #232326);
  --_tc-surface-overlay: light-dark(#ffffff, #232326);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-tray: light-dark(#f0f0f0, #19191b);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
}
.ui-cm:where([data-look="clean"]),
.ui-cm__portal:where([data-look="clean"]) {
  --_tc-accent: light-dark(#0060e2, #1a6cf0);
  --_tc-accent-highlight: light-dark(rgba(0, 96, 226, 0.12), rgba(77, 141, 255, 0.24));
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-border-selected: light-dark(#0060e2, #5b9aff);
  --_tc-border-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-caption-color: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-caption-font-size: 10px;
  --_tc-caption-font-weight: 500;
  --_tc-caption-line-height: 16px;
  --_tc-caption-tracking: 0.05em;
  --_tc-caption-transform: uppercase;
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xs: 11px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-hairline: 0.5px;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-kbd-bg: light-dark(#ffffff, #1c1c1e);
  --_tc-kbd-fg: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-kbd-font-size: 10px;
  --_tc-kbd-font-weight: 500;
  --_tc-kbd-h: 16px;
  --_tc-kbd-px: 4px;
  --_tc-kbd-radius: 4px;
  --_tc-kbd-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-line-height-none: 1;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-tight: 16px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-lg: 10px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-control: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-overlay: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 12px 28px -10px light-dark(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.6)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-danger-solid: light-dark(#e5484d, #ff6369);
  --_tc-status-success-solid: light-dark(#1f8a4c, #3ec27a);
  --_tc-surface-on-tray: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-overlay: light-dark(#ffffff, #252527);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-tray: light-dark(#f7f7f7, #161618);
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(10px + 4px);
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }
@media (forced-colors: active) {
  :where([data-look], [data-look] *):not(#tc-fc):is(button, [role="button"], [role="switch"], [role="combobox"], [role="checkbox"], [role="radio"], input:not([type="hidden"]), select, textarea):not([role="option"], [role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"], [role="tab"], [role="treeitem"], [role="gridcell"], [role="row"]) { border: 1px solid ButtonText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is(input, select, textarea) { border-color: FieldText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is([role="listbox"], [role="menu"], [role="dialog"], [role="tooltip"], [role="tablist"], [role="radiogroup"]) { outline: 1px solid CanvasText; }
  :where([data-look], [data-look] *):not(#tc-fc):is([aria-selected="true"], [aria-pressed="true"], [aria-checked="true"], [aria-current]:not([aria-current="false"])) { forced-color-adjust: none; background: Highlight !important; color: HighlightText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is([aria-selected="true"], [aria-pressed="true"], [aria-checked="true"], [aria-current]:not([aria-current="false"])) * { color: HighlightText !important; background: none !important; }
  :where([data-look], [data-look] *):not(#tc-fc)[role="switch"] span:empty { background: ButtonText !important; }
  :where([data-look], [data-look] *):not(#tc-fc)[role="switch"][aria-checked="true"] span:empty { background: HighlightText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is(:disabled, [aria-disabled="true"]) { color: GrayText !important; border-color: GrayText !important; }
}

:where([data-look="standard"], [data-look="standard"] *).ui-cm {
  box-sizing: border-box;
  position: relative;
  container-type: inline-size;
  display: grid;
  width: 100%;
  max-width: 600px;
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  background: var(--tc-surface-tray, var(--_tc-surface-tray));
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-cm */
:where([data-look="clean"], [data-look="clean"] *).ui-cm {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift, like a popover */
  box-sizing: border-box;
  position: relative;
  container-type: inline-size;
  display: grid;
  width: 100%;
  max-width: 600px;
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
}
.ui-cm *, .ui-cm *::before, .ui-cm *::after { box-sizing: border-box; }
:where(.ui-cm) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where(.ui-cm) svg { display: block; flex: none; }
/* The white card: search and results */
:where([data-look="standard"], [data-look="standard"] *).ui-cm__card { overflow: hidden; border-radius: var(--tc-card-radius, var(--_tc-card-radius)); background: var(--tc-surface-on-tray, var(--_tc-surface-on-tray)); box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cm__search { display: flex; align-items: center; gap: var(--tc-space-2-5, var(--_tc-space-2-5)); height: 52px; padding: 0 var(--tc-space-4, var(--_tc-space-4)); border-bottom: 1px solid var(--tc-border-default, var(--_tc-border-default)); cursor: text; }
:where([data-look="standard"], [data-look="standard"] *).ui-cm__search > svg { width: 18px; height: 18px; fill: none; stroke: var(--tc-text-muted, var(--_tc-text-muted)); stroke-width: 1.8; stroke-linecap: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-cm__search input { flex: 1; min-width: 0; padding: 0; border: 0; background: transparent; font: inherit; font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus)); color: var(--tc-text-primary, var(--_tc-text-primary)); outline: none; }
/* One white panel: search, results and the last row – the edge is a shadow, not a border */
:where([data-look="clean"], [data-look="clean"] *).ui-cm__card { overflow: hidden; border-radius: var(--tc-radius-xl, var(--_tc-radius-xl)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-overlay, var(--_tc-shadow-overlay)); }
/* Search row */
:where([data-look="clean"], [data-look="clean"] *).ui-cm__search { display: flex; align-items: center; gap: var(--tc-space-3, var(--_tc-space-3)); height: 48px; padding: 0 var(--tc-space-3, var(--_tc-space-3)) 0 var(--tc-space-3-5, var(--_tc-space-3-5)); border-bottom: 0.5px solid var(--tc-border-default, var(--_tc-border-default)); cursor: text; }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__search > svg { width: 16px; height: 16px; fill: none; stroke: var(--tc-icon-muted, var(--_tc-icon-muted)); stroke-width: 1.1; stroke-linecap: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__search input { flex: 1; min-width: 0; height: 20px; padding: 0; border: 0; background: transparent; font: inherit; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-primary, var(--_tc-text-primary)); caret-color: var(--tc-accent, var(--_tc-accent)); outline: none; }
.ui-cm__search input::placeholder { color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* The field's focus ring goes round the whole panel (the search field is its first row); the input itself draws none */
.ui-cm__card:has(input:focus-visible) { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cm__enter { display: inline-flex; align-items: center; gap: var(--tc-space-1, var(--_tc-space-1)); font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); letter-spacing: 0.04em; text-transform: uppercase; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cm__enter svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-cm__list { position: relative; max-height: 340px; padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-2, var(--_tc-space-2)); overflow-y: auto; scrollbar-width: thin; transition: height var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__enter svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.1; stroke-linecap: round; stroke-linejoin: round; }
/* Results */
:where([data-look="clean"], [data-look="clean"] *).ui-cm__list { position: relative; max-height: 360px; padding: 0 var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-1, var(--_tc-space-1)); overflow-y: auto; scrollbar-width: thin; transition: height var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); }
.ui-cm__group { display: flex; flex-direction: column; }
.ui-cm__label { padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-1, var(--_tc-space-1)); font-size: var(--tc-caption-font-size, var(--_tc-caption-font-size)); font-weight: var(--tc-caption-font-weight, var(--_tc-caption-font-weight)); line-height: var(--tc-caption-line-height, var(--_tc-caption-line-height)); letter-spacing: var(--tc-caption-tracking, var(--_tc-caption-tracking)); text-transform: var(--tc-caption-transform, var(--_tc-caption-transform)); color: var(--tc-caption-color, var(--_tc-caption-color)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cm__pill {
  position: absolute;
  top: 0;
  left: 6px;
  right: 6px;
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg));
  background: var(--tc-fill-default, var(--_tc-fill-default));
  transition: transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)), height var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="standard"], [data-look="standard"] *).ui-cm__item { position: relative; display: flex; align-items: center; gap: var(--tc-space-3, var(--_tc-space-3)); height: 40px; padding: 0 var(--tc-space-2-5, var(--_tc-space-2-5)); border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); text-align: left; }
:where([data-look="standard"], [data-look="standard"] *).ui-cm__logo {
  display: grid;
  place-items: center;
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  background: var(--tc-surface-overlay, var(--_tc-surface-overlay));
  box-shadow: inset 0 0 0 1px var(--tc-border-default, var(--_tc-border-default));
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
:where([data-look="standard"], [data-look="standard"] *).ui-cm__logo svg { width: 14px; height: 14px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cm__icon { display: grid; place-items: center; flex: none; width: 26px; height: 26px; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cm__glyph { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__label { padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-1, var(--_tc-space-1)); }
/* With text typed, the assistant row sits on top without a label */
:where([data-look="clean"], [data-look="clean"] *).ui-cm__group:first-child:not(:has(.ui-cm__label)) { padding-top: var(--tc-space-1, var(--_tc-space-1)); }
/* The highlight follows the active row */
:where([data-look="clean"], [data-look="clean"] *).ui-cm__pill {
  position: absolute;
  top: 0;
  left: 4px;
  right: 4px;
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  background: var(--tc-fill-default, var(--_tc-fill-default));
  opacity: 0;
  /* A short, crisp move between rows – no long glide; it fades out when the pointer leaves the list */
  transition: transform var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-move, var(--_tc-ease-move)), height var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-cm__pill[data-lit] { opacity: 1; }
/* While the field has focus the active row is the Enter target: it stays lit and gets a ≥3:1 edge, not only a faint fill */
.ui-cm:has(input:focus) .ui-cm__pill { opacity: 1; box-shadow: inset 0 0 0 1px var(--tc-border-selected, var(--_tc-border-selected)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__item { position: relative; display: flex; align-items: center; gap: var(--tc-space-2-5, var(--_tc-space-2-5)); height: 36px; padding: 0 var(--tc-space-2, var(--_tc-space-2)); border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); text-align: left; }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__logo {
  display: grid;
  place-items: center;
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: var(--tc-radius-xs, var(--_tc-radius-xs));
  background: var(--tc-surface-overlay, var(--_tc-surface-overlay));
  box-shadow: 0 0 0 0.5px var(--tc-border-strong, var(--_tc-border-strong)), var(--tc-shadow-control, var(--_tc-shadow-control));
  color: var(--tc-text-strong, var(--_tc-text-strong));
}
:where([data-look="clean"], [data-look="clean"] *).ui-cm__logo svg { width: 12px; height: 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__icon { display: grid; place-items: center; flex: none; width: 20px; height: 20px; color: var(--tc-icon-muted, var(--_tc-icon-muted)); transition: color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.1; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__glyph path { vector-effect: non-scaling-stroke; }
.ui-cm__item[aria-selected="true"] .ui-cm__icon { color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-cm__text { display: flex; flex: 1; align-items: baseline; gap: var(--tc-space-2, var(--_tc-space-2)); min-width: 0; }
.ui-cm__name { overflow: hidden; color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; text-overflow: ellipsis; }
.ui-cm__hint { overflow: hidden; color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; }
.ui-cm mark { border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); background: var(--tc-accent-highlight, var(--_tc-accent-highlight)); color: inherit; }
:where([data-look="standard"], [data-look="standard"] *).ui-cm__keys { display: inline-flex; flex: none; gap: var(--tc-space-1, var(--_tc-space-1)); }
.ui-cm kbd {
  display: inline-grid;
  place-items: center;
  min-width: var(--tc-kbd-h, var(--_tc-kbd-h));
  height: var(--tc-kbd-h, var(--_tc-kbd-h));
  padding: 0 var(--tc-kbd-px, var(--_tc-kbd-px));
  border-radius: var(--tc-kbd-radius, var(--_tc-kbd-radius));
  background: var(--tc-kbd-bg, var(--_tc-kbd-bg));
  box-shadow: var(--tc-kbd-shadow, var(--_tc-kbd-shadow));
  font-family: inherit;
  font-size: var(--tc-kbd-font-size, var(--_tc-kbd-font-size));
  font-weight: var(--tc-kbd-font-weight, var(--_tc-kbd-font-weight));
  line-height: var(--tc-line-height-none, var(--_tc-line-height-none));
  color: var(--tc-kbd-fg, var(--_tc-kbd-fg));
  transition: color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
/* Keyboard hints: small chips with an inset hairline */
:where([data-look="clean"], [data-look="clean"] *).ui-cm__keys { display: inline-flex; flex: none; gap: var(--tc-space-0-5, var(--_tc-space-0-5)); }
.ui-cm__item[aria-selected="true"] kbd { color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__enter { padding: 0 var(--tc-space-1, var(--_tc-space-1)); color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
/* A short flash on the row that just ran */
.ui-cm__item[data-ran] { animation: ui-cm-ran var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-move, var(--_tc-ease-move)); }
@keyframes ui-cm-ran { 30% { transform: scale(0.985); } }
/* The tray below the card */
:where([data-look="standard"], [data-look="standard"] *).ui-cm__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3, var(--_tc-space-3)); height: 38px; padding: 0 var(--tc-space-3, var(--_tc-space-3)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cm__foot > span { display: inline-flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); }
/* The last row of the panel */
:where([data-look="clean"], [data-look="clean"] *).ui-cm__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3, var(--_tc-space-3));
  height: 40px;
  padding: 0 var(--tc-space-3, var(--_tc-space-3));
  border-top: 0.5px solid var(--tc-border-default, var(--_tc-border-default));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
:where([data-look="clean"], [data-look="clean"] *).ui-cm__foot > span { display: inline-flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); min-width: 0; white-space: nowrap; }
.ui-cm__done { color: var(--tc-text-primary, var(--_tc-text-primary)); animation: ui-cm-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="standard"], [data-look="standard"] *).ui-cm__done svg { width: 14px; height: 14px; fill: none; stroke: var(--tc-status-success-solid, var(--_tc-status-success-solid)); stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__done-text { overflow: hidden; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__done svg { width: 16px; height: 16px; fill: none; stroke: var(--tc-status-success-solid, var(--_tc-status-success-solid)); stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-cm__foot-right { flex: none; }
.ui-cm__done[data-state="pending"] { color: var(--tc-text-muted, var(--_tc-text-muted)); }
.ui-cm__done[data-state="failed"] { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
.ui-cm__done[data-state="failed"] svg { stroke: var(--tc-status-danger-solid, var(--_tc-status-danger-solid)); }
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
.ui-cm__more { margin: 0; padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-2-5, var(--_tc-space-2-5)); border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
.ui-cm__sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
@media (prefers-reduced-motion: reduce) {
  .ui-cm *, .ui-cm *::before, .ui-cm *::after { animation: none !important; transition: none !important; }
}
`;
