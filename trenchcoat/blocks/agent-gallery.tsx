"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent, type Ref } from "react";
import { Button } from "@/components/ui/button";

/*
 * Agent Gallery – a showcase block, in a single self-contained file.
 * Slim vertical panels sit side by side, each with the same soft gradient artwork in its own colors.
 * The panel in the middle is open and shows a product screen; pick a side panel (or use the arrows)
 * and it glides open in the middle while the current one folds into a slim panel at the side.
 * The arrow buttons are the library's Button (copy button.tsx alongside); the styles are injected below.
 */

export type GalleryItem = {
  id: string;
  name: string;
  description: string;
  /** Two colors for the gradient artwork – strong, then soft */
  colors: [string, string];
  /** What the agent reacts to */
  trigger: string;
  /** Steps shown under Instructions */
  steps: string[];
  /** Skills shown as chips */
  skills: string[];
  /** A rule shown under Guardrails */
  guardrail: string;
};

type OwnProps = {
  title?: string;
  subtitle?: string;
  items?: GalleryItem[];
  /** The open item (controlled) – the gallery glides there the short way round */
  index?: number;
  /** Item to open first when `index` isn't passed – by default the middle one */
  defaultIndex?: number;
  /** Called with the item a visitor picks (a panel, an arrow button or an arrow key) */
  onIndexChange?: (index: number) => void;
  className?: string;
  /** The root <section> */
  ref?: Ref<HTMLElement>;
};

export type AgentGalleryProps = Omit<ComponentPropsWithoutRef<"section">, keyof OwnProps> & OwnProps;

const defaultItems: GalleryItem[] = [
  {
    id: "triage",
    name: "Support triage",
    description: "Sorts new tickets by urgency and routes them to the right team.",
    colors: ["#8b5cf6", "#e9d5ff"],
    trigger: "Ticket created",
    steps: ["Read the ticket and detect the product area.", "Set priority from customer plan and sentiment.", "Assign the team and post a summary in the thread."],
    skills: ["Classify ticket", "Summarize thread"],
    guardrail: "Cannot close tickets",
  },
  {
    id: "enrich",
    name: "Lead enrichment",
    description: "Fills in company data for every new lead before sales picks it up.",
    colors: ["#2f6bff", "#c7d7ff"],
    trigger: "Lead added",
    steps: ["Look up the company by email domain.", "Add size, industry and location to the record.", "Score the lead and notify the owner above 80."],
    skills: ["Find company", "Score lead"],
    guardrail: "Cannot change lead owner",
  },
  {
    id: "recap",
    name: "Meeting recap",
    description: "Turns call transcripts into notes, decisions and next steps.",
    colors: ["#ec4899", "#fbcfe8"],
    trigger: "Call ended",
    steps: ["Pull the transcript from the recording.", "Write a short recap with decisions and owners.", "Create follow-up tasks and share the notes."],
    skills: ["Write recap", "Create tasks"],
    guardrail: "Cannot email external guests",
  },
  {
    id: "churn",
    name: "Churn watch",
    description: "Spots accounts that go quiet and suggests a save play.",
    colors: ["#f97316", "#fed7aa"],
    trigger: "Usage drops 30%",
    steps: ["Compare weekly usage against the last quarter.", "Check open tickets and recent NPS answers.", "Draft a check-in for the account manager."],
    skills: ["Read usage", "Draft check-in"],
    guardrail: "Cannot offer discounts",
  },
  {
    id: "onboard",
    name: "Onboarding coach",
    description: "Guides new customers through setup and nudges when they get stuck.",
    colors: ["#14b8a6", "#ccfbf1"],
    trigger: "Workspace created",
    steps: ["Send a welcome note with the first three steps.", "Watch for steps that stay open for two days.", "Offer a short call when setup stalls."],
    skills: ["Send nudge", "Book call"],
    guardrail: "Cannot change billing",
  },
  {
    id: "review",
    name: "Content review",
    description: "Checks drafts for tone, claims and brand terms before they ship.",
    colors: ["#6366f1", "#e0e7ff"],
    trigger: "Draft submitted",
    steps: ["Check tone against the brand guide.", "Flag claims that need a source.", "Suggest fixes inline and tag the author."],
    skills: ["Check tone", "Flag claims"],
    guardrail: "Cannot publish",
  },
  {
    id: "release",
    name: "Release notes",
    description: "Writes customer-facing notes from merged pull requests.",
    colors: ["#d946ef", "#f5d0fe"],
    trigger: "Release tagged",
    steps: ["Collect merged pull requests since the last tag.", "Group them into features, fixes and changes.", "Draft notes in plain language for review."],
    skills: ["Group changes", "Write notes"],
    guardrail: "Cannot post without review",
  },
];

const MOVE = 620; // ms – width and track glide together (--tc-agent-gallery-move in the styles)

export function AgentGallery({
  title = "Agents that run your playbook",
  subtitle = "Give each agent its steps, tools and limits – then let it work inside the tools your team already uses.",
  items = defaultItems,
  index,
  defaultIndex,
  onIndexChange,
  className,
  ref,
  ...rest
}: AgentGalleryProps) {
  const n = items.length;
  const wrap = (i: number) => ((i % n) + n) % n;
  // The list is laid out three times in a row and the track slides so the open panel sits in the middle.
  // Moving any distance is one smooth glide; afterwards the position quietly jumps back into the middle copy.
  const [pos, setPos] = useState(() => n + wrap(index ?? defaultIndex ?? Math.floor(n / 2)));
  const [snap, setSnap] = useState(false);
  const active = wrap(pos);
  // Controlled: follow the index prop, the short way round
  if (index !== undefined && n > 0 && wrap(index) !== active) {
    const ahead = wrap(wrap(index) - active);
    setPos(pos + (ahead <= n / 2 ? ahead : ahead - n));
  }
  const current = items[active];
  const strip = [...items, ...items, ...items];

  // Focus never drops to <body>: a picked panel's button goes away as it opens, and the quiet jump back into the
  // middle copy hides the panel that had focus – focus moves to the same agent's button nearest the open panel,
  // or into the open panel's screen
  const viewport = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const vp = viewport.current;
    const prev = lastFocus.current;
    if (!vp || !prev) return;
    const active = document.activeElement;
    const gone = !prev.isConnected || !!prev.closest('[aria-hidden="true"], [inert]');
    if (!gone || (active && active !== document.body && active !== prev)) return;
    // The agent that just opened has no button any more – its screen takes focus
    const key = prev.getAttribute("data-focus-key");
    const same = key && key !== items[wrap(pos)]?.id
      ? [...vp.querySelectorAll<HTMLElement>(`[data-focus-key="${CSS.escape(key)}"]`)]
          .filter((b) => !b.closest('[aria-hidden="true"]'))
          .sort((a, b) => Math.abs(Number(a.dataset.j) - pos) - Math.abs(Number(b.dataset.j) - pos))[0]
      : undefined;
    const target = same ?? vp.querySelector<HTMLElement>(".ui-ag__panel[data-open] .ui-ag__screen");
    lastFocus.current = target ?? null;
    target?.focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs after every move; items and wrap are read fresh
  }, [pos]);

  useEffect(() => {
    if (pos >= n && pos < 2 * n) return;
    const t = window.setTimeout(() => {
      setSnap(true);
      setPos((p) => (p < n ? p + n : p - n));
    }, MOVE + 40);
    return () => window.clearTimeout(t);
  }, [pos, n]);

  useEffect(() => {
    if (!snap) return;
    // Two frames: the jump renders without transitions, then they switch back on
    let raf = requestAnimationFrame(() => (raf = requestAnimationFrame(() => setSnap(false))));
    return () => cancelAnimationFrame(raf);
  }, [snap]);

  const go = (next: number) => {
    const to = Math.max(0, Math.min(3 * n - 1, next));
    if (index === undefined) setPos(to);
    if (wrap(to) !== active) onIndexChange?.(wrap(to));
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(pos + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(pos - 1);
    }
  };

  return (
    <section aria-roledescription="carousel" aria-label={title} {...rest} ref={ref} className={["ui-ag", className].filter(Boolean).join(" ")}>
      <style href="ui-agent-gallery" precedence="default">
        {css}
      </style>

      <header className="ui-ag__head">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </header>

      <div
        ref={viewport}
        className="ui-ag__viewport"
        onKeyDown={onKey}
        onFocus={(e) => {
          lastFocus.current = e.target;
        }}
      >
        <div className="ui-ag__track" data-snap={snap ? "" : undefined} style={{ ["--pos" as string]: pos }}>
          {strip.map((item, j) => {
            const open = j === pos;
            const distance = Math.abs(j - pos);
            return (
              <div
                key={`${Math.floor(j / n)}-${item.id}`}
                className="ui-ag__panel"
                data-open={open ? "" : undefined}
                data-far={distance >= 2 ? "" : undefined}
                style={{ ["--a" as string]: item.colors[0], ["--b" as string]: item.colors[1] }}
                aria-hidden={distance > 3 || undefined}
              >
                <span className="ui-ag__art" aria-hidden="true" />
                {/* Nearby panels keep their screen, so it can fade out as a panel folds and fade in as it opens */}
                {distance <= 3 && <Screen item={item} hidden={!open} />}
                {!open && (
                  <button
                    type="button"
                    className="ui-ag__pick"
                    aria-label={`Show ${item.name}`}
                    data-focus-key={item.id}
                    data-j={j}
                    tabIndex={distance > 3 ? -1 : undefined}
                    onClick={() => go(j)}
                  >
                    <span className="ui-ag__label">{item.name}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="ui-ag__foot">
        {/* Mounted once and kept, so screen readers hear each newly opened agent; only the text inside fades in */}
        <p className="ui-ag__caption" aria-live="polite" aria-atomic="true">
          <span key={current.id} className="ui-ag__caption-text">
            <b>{current.name}.</b> {current.description}
          </span>
        </p>
        <div className="ui-ag__arrows">
          <Button
            variant="secondary"
            aria-label="Previous agent"
            icon={
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 12H5m0 0 6-6m-6 6 6 6" />
              </svg>
            }
            onClick={() => go(pos - 1)}
          />
          <Button
            variant="secondary"
            aria-label="Next agent"
            icon={
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14m0 0-6-6m6 6-6 6" />
              </svg>
            }
            onClick={() => go(pos + 1)}
          />
        </div>
      </div>
    </section>
  );
}

/* ---------- The product screen inside the open panel: the agent's workspace with its context feed ---------- */

// Stable sample numbers per agent, so every panel shows something different
const seed = (id: string) => [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 7);

/** A tiny sparkline: a wavy line ending in a dot */
function Spark({ n, color }: { n: number; color: string }) {
  const pts = Array.from({ length: 10 }, (_, i) => [i * 8, 15 - ((n * (i + 5) * 7 + i * 3) % 13)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg className="ui-ag__spark" viewBox="-2 -2 78 20" aria-hidden="true">
      <path d={d} style={{ stroke: color }} />
      <circle cx={lx} cy={ly} r="2.2" style={{ fill: color }} />
    </svg>
  );
}

const Avatar = ({ name }: { name: string }) => (
  <span className="ui-ag__avatar" aria-hidden="true">
    {name
      .split(" ")
      .map((p) => p[0])
      .join("")}
  </span>
);

const Glyph = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} />
  </svg>
);
const G = {
  note: "M5 6.5A1.5 1.5 0 0 1 6.5 5h11A1.5 1.5 0 0 1 19 6.5v8a1.5 1.5 0 0 1-1.5 1.5H10l-4 3v-3h-.5A.5.5 0 0 1 5 15.5Z",
  chart: "M6 18V11M10 18V7M14 18v-5M18 18V9",
  file: "M8 3.5h6l4 4v12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1ZM14 3.5v4h4",
  plug: "M9 4v4M15 4v4M7 8h10v3a5 5 0 0 1-10 0V8ZM12 16v4",
  search: "M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM20 20l-4.5-4.5",
  clip: "m15.5 7.5-6.4 6.4a1.8 1.8 0 0 0 2.5 2.5l6.7-6.7a3.5 3.5 0 0 0-5-5l-6.9 6.9a5.2 5.2 0 0 0 7.4 7.4l6-6",
  sync: "M19 12a7 7 0 0 1-12.3 4.6M5 12a7 7 0 0 1 12.3-4.6M17.5 4v3.5H14M6.5 20v-3.5H10",
  filter: "M5 7h14M8 12h8M11 17h2",
};

function Screen({ item, hidden }: { item: GalleryItem; hidden: boolean }) {
  const n = seed(item.id);
  const kpis: [string, string, string][] = [
    ["Runs", `${40 + (n % 160)}`, "#22a06b"],
    ["Success", `${94 + (n % 6)}%`, "#2f9bd6"],
    ["Time saved", `${(2 + (n % 70) / 10).toFixed(1)}h`, "#8b5cf6"],
    ["Escalated", `${1 + (n % 7)}`, "#ec4899"],
  ];
  return (
    <div
      className="ui-ag__screen"
      role="group"
      aria-label={`${item.name} workspace`}
      tabIndex={hidden ? undefined : -1}
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
    >
      {/* App bar */}
      <div className="ui-ag__bar">
        <span className="ui-ag__brand" aria-hidden="true" />
        <span className="ui-ag__switch">
          <span className="ui-ag__mark" aria-hidden="true" />
          {item.name}
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m8 10 4-4 4 4M8 14l4 4 4-4" />
          </svg>
        </span>
        <span className="ui-ag__new">+ New agent</span>
        <Avatar name="Lena Hart" />
      </div>

      <div className="ui-ag__page">
        {/* Header: mark, name, sync and a row of numbers with sparklines */}
        <div className="ui-ag__hero">
          <span className="ui-ag__logo" aria-hidden="true" />
          <span className="ui-ag__sync">
            3m ago
            <Glyph d={G.sync} />
          </span>
        </div>
        <h3>{item.name}</h3>
        <p className="ui-ag__sub">Triggered by “{item.trigger}” · Owner Lena Hart</p>
        <div className="ui-ag__kpis">
          {kpis.map(([label, value, color], i) => (
            <div key={label}>
              <span>{label}</span>
              <b>{value}</b>
              <Spark n={n + i * 13} color={color} />
            </div>
          ))}
        </div>
        <div className="ui-ag__tabs">
          <span>Runs</span>
          <span>Tools</span>
          <b>Context</b>
          <span>Settings</span>
        </div>

        {/* Context feed */}
        <h4>Agent context</h4>
        <p className="ui-ag__hint">Goals, files and rules the agent uses on every run.</p>
        <div className="ui-ag__toolbar">
          <span className="ui-ag__search">
            <Glyph d={G.search} />
            Search context…
          </span>
          <span className="ui-ag__filter">
            <Glyph d={G.filter} />
            All
          </span>
        </div>
        <ol className="ui-ag__feed">
          <li className="ui-ag__compose">
            <Avatar name="Lena Hart" />
            <div className="ui-ag__box">
              <span>Add context, e.g. “{item.guardrail}”</span>
              <span className="ui-ag__box-foot">
                <Glyph d={G.clip} />
                <b>Add context</b>
              </span>
            </div>
          </li>
          <li>
            <span className="ui-ag__dot">
              <Glyph d={G.note} />
            </span>
            <div>
              <p className="ui-ag__line">
                <Avatar name="Jonas Weber" />
                <b>Jonas Weber</b> added context · today
              </p>
              <p className="ui-ag__card">{item.steps[0]}</p>
            </div>
          </li>
          <li>
            <span className="ui-ag__dot">
              <Glyph d={G.chart} />
            </span>
            <p className="ui-ag__line">
              <Avatar name="Mara Lindqvist" />
              <b>Mara Lindqvist</b> generated a <u>Weekly summary</u> · 1d ago
            </p>
          </li>
          <li>
            <span className="ui-ag__dot">
              <Glyph d={G.file} />
            </span>
            <p className="ui-ag__line">
              <Avatar name="Mara Lindqvist" />
              <b>Mara Lindqvist</b> added <u>playbook.pdf</u>
              <i className="ui-ag__ext" data-kind="pdf" /> and <u>accounts.csv</u>
              <i className="ui-ag__ext" data-kind="csv" /> · 2d ago
            </p>
          </li>
          <li>
            <span className="ui-ag__dot">
              <Glyph d={G.note} />
            </span>
            <div>
              <p className="ui-ag__line">
                <Avatar name="Jonas Weber" />
                <b>Jonas Weber</b> added context · 2d ago
              </p>
              <p className="ui-ag__card">
                {item.steps[1]} {item.steps[2]}
              </p>
            </div>
          </li>
          <li>
            <span className="ui-ag__dot ui-ag__dot--app">
              <Glyph d={G.plug} />
            </span>
            <p className="ui-ag__line">
              Connected <u>Slack</u> and <u>HubSpot</u> · 3d ago
            </p>
          </li>
        </ol>
      </div>
    </div>
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where(.dark, [data-theme="dark"]) { color-scheme: dark; }
:where([data-theme="light"]) { color-scheme: light; }

.ui-ag {
  --tc-agent-gallery-base-top: light-dark(#f4f4f6, #232326);
  --tc-agent-gallery-base-bottom: light-dark(#e9e9ee, #1a1a1c);
  --tc-agent-gallery-shine: light-dark(rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.08));
  --tc-agent-gallery-screen-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 20px 50px -20px light-dark(rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.5));
  /* The glide: width and track move together (MOVE in the script) */
  --tc-agent-gallery-move: 620ms;
  --tc-agent-gallery-height: 560px;
  --tc-agent-gallery-side: 104px;
  --tc-agent-gallery-gap: 14px;
  --tc-agent-gallery-open: min(70cqw, 1120px);
  container-type: inline-size;
  overflow: hidden;
  padding: 8px 0 4px;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  -webkit-font-smoothing: antialiased;
}
.ui-ag *, .ui-ag *::before, .ui-ag *::after { box-sizing: border-box; }

.ui-ag__head { max-width: 620px; margin: 0 auto 36px; padding: 0 20px; text-align: center; }
.ui-ag__head h2 { margin: 0; font-size: var(--tc-font-size-4xl, 28px); font-weight: var(--tc-font-weight-semibold, 600); letter-spacing: -0.025em; line-height: var(--tc-line-height-display, 32px); }
.ui-ag__head p { margin: 12px 0 0; font-size: var(--tc-font-size-xl, 16px); line-height: var(--tc-line-height-loose, 24px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }

/* ---------- Track: slim panels, one open in the middle ---------- */

.ui-ag__viewport { overflow: hidden; }
/* The track slides so the open panel's centre lands in the middle of the block */
.ui-ag__track {
  display: flex;
  gap: var(--tc-agent-gallery-gap);
  width: max-content;
  height: var(--tc-agent-gallery-height);
  transform: translateX(calc(50cqw - var(--pos) * (var(--tc-agent-gallery-side) + var(--tc-agent-gallery-gap)) - var(--tc-agent-gallery-open) / 2));
  transition: transform var(--tc-agent-gallery-move) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1));
}
.ui-ag__track[data-snap],
.ui-ag__track[data-snap] * { transition: none !important; animation: none !important; }
.ui-ag__panel {
  position: relative;
  flex: 0 0 var(--tc-agent-gallery-side);
  overflow: hidden;
  border-radius: var(--tc-radius-3xl, 20px);
  transition: flex-basis var(--tc-agent-gallery-move) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1));
}
.ui-ag__panel[data-open] { flex-basis: var(--tc-agent-gallery-open); }
/* Hovering a side panel only brings its color up – the width stays */

/* One artwork for every panel – only the two colors change. Side panels are muted until hovered */
.ui-ag__art {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(118deg, transparent 38%, var(--tc-agent-gallery-shine) 47%, transparent 57%),
    radial-gradient(110% 80% at 0% 0%, color-mix(in srgb, var(--a) 70%, transparent) 0%, transparent 60%),
    radial-gradient(90% 70% at 100% 100%, var(--b) 0%, transparent 72%),
    radial-gradient(60% 50% at 30% 100%, color-mix(in srgb, var(--a) 28%, transparent) 0%, transparent 70%),
    linear-gradient(180deg, var(--tc-agent-gallery-base-top), var(--tc-agent-gallery-base-bottom));
  filter: saturate(0.35);
  transition: filter var(--tc-duration-slowest, 560ms) var(--tc-ease-standard, ease), transform var(--tc-duration-reveal-slow, 900ms) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1));
}
.ui-ag__panel:hover .ui-ag__art { filter: none; }
.ui-ag__panel[data-open] .ui-ag__art { filter: none; }
.ui-ag__panel[data-far] .ui-ag__art { filter: saturate(0.12); }

.ui-ag__pick {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  padding: 0 0 22px 16px;
  margin: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  animation: ui-ag-fade var(--tc-duration-slower, 420ms) var(--tc-ease-standard, ease) var(--tc-duration-base, 200ms) both;
}
/* The pick fills the whole panel, so its ring sits just inside the panel's rounded edge */
.ui-ag__pick:focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: calc(-1 * var(--tc-focus-ring-width, 2px) - 2px); border-radius: var(--tc-radius-3xl, 20px); }
.ui-ag__screen:focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); }
.ui-ag__label {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: var(--tc-font-size-xl, 16px);
  font-weight: var(--tc-font-weight-medium, 500);
  letter-spacing: -0.01em;
  white-space: nowrap;
  color: color-mix(in srgb, var(--a) 70%, var(--tc-text-secondary, light-dark(#404040, #c8c8cc)));
  opacity: 0.85;
}
.ui-ag__panel[data-far] .ui-ag__label { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }

/* ---------- Screen ---------- */

.ui-ag__screen {
  position: absolute;
  top: 44px;
  left: 44px;
  /* Fits the open panel side to side (cut only at the bottom); on small screens it runs off the right edge */
  width: max(640px, calc(100% - 88px));
  min-height: 620px;
  overflow: hidden;
  border-radius: var(--tc-radius-2xl, 16px);
  background: var(--tc-surface-sunken, light-dark(#f0f0f0, #111113));
  box-shadow: var(--tc-agent-gallery-screen-shadow);
  font-size: var(--tc-font-size-xs-plus, 11.5px);
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
  /* Folding away: fades and drifts off quickly while the panel narrows */
  opacity: 0;
  transform: translate(28px, 14px) scale(0.98);
  transition: opacity var(--tc-duration-moderate, 260ms) var(--tc-ease-standard, ease), transform var(--tc-duration-slower, 420ms) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1));
}
/* Opening: comes in once the panel has mostly widened */
.ui-ag__panel[data-open] .ui-ag__screen {
  opacity: 1;
  transform: none;
  transition: opacity var(--tc-duration-slower, 420ms) var(--tc-ease-standard, ease) var(--tc-duration-moderate, 260ms), transform var(--tc-agent-gallery-move) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)) var(--tc-duration-base, 200ms);
}
.ui-ag__screen svg { width: 13px; height: 13px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.ui-ag__screen u { text-decoration: underline; text-decoration-color: var(--tc-border-default, light-dark(#ececec, #2a2a2e)); text-underline-offset: 3px; text-decoration-thickness: 1.5px; color: var(--tc-text-primary, light-dark(#171717, #ededed)); }

/* App bar */
.ui-ag__bar { display: flex; align-items: center; gap: 12px; height: 48px; padding: 0 14px; background: var(--tc-surface-raised, light-dark(#ffffff, #19191b)); }
.ui-ag__brand { width: 18px; height: 18px; border-radius: var(--tc-radius-xs, 4px); background: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-ag__switch {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 28px;
  padding: 0 8px 0 6px;
  border-radius: var(--tc-radius-md, 8px);
  box-shadow: inset 0 0 0 1px var(--tc-border-default, light-dark(#ececec, #2a2a2e));
  font-size: var(--tc-font-size-xs-plus, 11.5px);
  font-weight: var(--tc-font-weight-medium, 500);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
}
.ui-ag__switch svg { width: 12px; height: 12px; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-ag__mark, .ui-ag__logo { border-radius: var(--tc-radius-xs, 4px); background: linear-gradient(135deg, var(--a), var(--b)); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35); }
.ui-ag__mark { width: 16px; height: 16px; }
.ui-ag__new {
  margin-left: auto;
  padding: 5px 10px;
  border-radius: var(--tc-radius-md, 8px);
  box-shadow: var(--tc-action-secondary-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  font-size: var(--tc-font-size-xs, 11px);
  font-weight: var(--tc-font-weight-medium, 500);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
}
.ui-ag__avatar {
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  flex: none;
  border-radius: 50%;
  background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)));
  box-shadow: inset 0 0 0 1px var(--tc-border-default, light-dark(#ececec, #2a2a2e));
  font-size: 7.5px;
  font-weight: var(--tc-avatar-font-weight, 600);
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
}
.ui-ag__bar .ui-ag__avatar { width: 26px; height: 26px; font-size: 9px; }

/* Page */
.ui-ag__page { padding: 16px max(28px, calc((100% - 560px) / 2)) 24px; }
.ui-ag__hero { display: flex; align-items: flex-start; justify-content: space-between; }
.ui-ag__logo { width: 30px; height: 30px; border-radius: var(--tc-radius-md, 8px); }
.ui-ag__sync { display: inline-flex; align-items: center; gap: 6px; font-size: var(--tc-font-size-xs, 11px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-ag__page h3 { margin: 8px 0 2px; font-size: var(--tc-font-size-lg-plus, 15px); font-weight: var(--tc-font-weight-semibold, 600); letter-spacing: -0.01em; color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-ag__sub { margin: 0 0 12px; font-size: var(--tc-font-size-xs, 11px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-ag__kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-bottom: 12px; }
.ui-ag__kpis > div {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 54px;
  grid-template-areas: "label spark" "value spark";
  column-gap: 8px;
  padding: 0 12px;
  border-left: 1px solid var(--tc-border-default, light-dark(#ececec, #2a2a2e));
}
.ui-ag__kpis > div:first-child { padding-left: 0; border-left: 0; }
.ui-ag__kpis span { grid-area: label; font-size: 10.5px; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); white-space: nowrap; }
.ui-ag__kpis b { grid-area: value; font-size: var(--tc-font-size-lg-plus, 15px); font-weight: var(--tc-font-weight-semibold, 600); letter-spacing: -0.02em; color: var(--tc-text-primary, light-dark(#171717, #ededed)); font-variant-numeric: tabular-nums; }
.ui-ag__screen .ui-ag__spark { grid-area: spark; align-self: end; width: 54px; height: 20px; margin-bottom: 2px; overflow: visible; }
.ui-ag__spark path { fill: none; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.ui-ag__tabs { display: flex; gap: 16px; margin: 0 -400px 14px; padding: 0 400px; border-bottom: 1px solid var(--tc-border-default, light-dark(#ececec, #2a2a2e)); }
.ui-ag__tabs > * { padding: 0 1px 8px; font-size: var(--tc-font-size-xs-plus, 11.5px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-ag__tabs b { font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); box-shadow: inset 0 -1.5px 0 var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-ag__page h4 { margin: 0; font-size: var(--tc-font-size-md, 13px); font-weight: var(--tc-font-weight-semibold, 600); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-ag__hint { margin: 3px 0 12px; font-size: var(--tc-font-size-xs, 11px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-ag__toolbar { display: flex; gap: 6px; margin-bottom: 14px; }
.ui-ag__search, .ui-ag__filter {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 30px;
  padding: 0 10px;
  border-radius: var(--tc-radius-lg, 10px);
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  box-shadow: inset 0 0 0 1px var(--tc-border-default, light-dark(#ececec, #2a2a2e));
  font-size: var(--tc-font-size-xs, 11px);
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
}
.ui-ag__search { flex: 1; }
.ui-ag__filter { color: var(--tc-text-primary, light-dark(#171717, #ededed)); }

/* Feed: a thin line connects the icons on the left */
.ui-ag__feed { position: relative; display: grid; gap: 12px; margin: 0; padding: 0; list-style: none; }
.ui-ag__feed::before { content: ""; position: absolute; left: 12px; top: 24px; bottom: 8px; width: 1px; background: var(--tc-border-default, light-dark(#ececec, #2a2a2e)); }
.ui-ag__feed li { position: relative; display: grid; grid-template-columns: 25px 1fr; gap: 10px; align-items: start; }
.ui-ag__compose .ui-ag__avatar { width: 25px; height: 25px; font-size: 8.5px; }
.ui-ag__box {
  display: grid;
  gap: 18px;
  padding: 10px 10px 8px 12px;
  border-radius: var(--tc-radius-xl, 12px);
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  box-shadow: var(--tc-shadow-raised, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
}
.ui-ag__box-foot { display: flex; align-items: center; justify-content: space-between; }
.ui-ag__box-foot b { padding: 4px 9px; border-radius: var(--tc-radius-md, 8px); background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); font-size: 10.5px; font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-ag__dot {
  display: grid;
  place-items: center;
  width: 25px;
  height: 25px;
  border-radius: 50%;
  background: var(--tc-surface-sunken, light-dark(#f0f0f0, #111113));
  box-shadow: inset 0 0 0 1px var(--tc-border-default, light-dark(#ececec, #2a2a2e));
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
}
.ui-ag__dot svg { width: 12px; height: 12px; }
.ui-ag__dot--app { background: linear-gradient(135deg, var(--a), var(--b)); box-shadow: none; color: #fff; }
.ui-ag__line { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; margin: 5px 0 0; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-ag__line b { font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-ag__ext { width: 9px; height: 11px; border-radius: var(--tc-radius-2xs, 2px); background: #e5484d; }
.ui-ag__ext[data-kind="csv"] { background: #30a46c; }
.ui-ag__card {
  margin: 7px 0 0;
  padding: 9px 12px;
  border-radius: var(--tc-radius-lg, 10px);
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  box-shadow: var(--tc-shadow-raised, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  line-height: var(--tc-line-height-snug, 18px);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
}

/* ---------- Caption and arrows ---------- */

.ui-ag__foot {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  width: var(--tc-agent-gallery-open);
  margin: 26px auto 0;
}
.ui-ag__caption {
  max-width: 520px;
  margin: 0;
  font-size: var(--tc-font-size-2xl, 20px);
  line-height: var(--tc-line-height-display-sm, 28px);
  letter-spacing: -0.01em;
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
}
.ui-ag__caption-text { animation: ui-ag-fade var(--tc-duration-slower, 420ms) var(--tc-ease-standard, ease) both; }
.ui-ag__caption b { font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
/* The library's secondary Buttons, side by side */
.ui-ag__arrows { display: flex; flex: none; gap: 6px; }
.ui-ag__arrows svg { width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }

@keyframes ui-ag-fade { from { opacity: 0; } }

/* ---------- Narrow: the open panel takes most of the width, one slim panel peeks on each side ---------- */

@container (max-width: 760px) {
  .ui-ag { --tc-agent-gallery-height: 400px; --tc-agent-gallery-side: 56px; --tc-agent-gallery-gap: 10px; }
  .ui-ag { --tc-agent-gallery-open: calc(100cqw - 2 * (var(--tc-agent-gallery-side) + var(--tc-agent-gallery-gap)) - 24px); }
  .ui-ag__label { font-size: var(--tc-font-size-lg, 14px); }
  .ui-ag__pick { padding: 0 0 16px 10px; }
  .ui-ag__screen { top: 40px; left: 22px; }
  .ui-ag__foot { width: calc(100cqw - 40px); }
  .ui-ag__caption { font-size: var(--tc-font-size-xl, 16px); }
  .ui-ag__head h2 { font-size: var(--tc-font-size-3xl, 24px); }
}

@media (prefers-reduced-motion: reduce) {
  .ui-ag__track, .ui-ag__panel, .ui-ag__art { transition: none; }
  .ui-ag__caption-text, .ui-ag__pick { animation: none; }
  .ui-ag__screen, .ui-ag__panel[data-open] .ui-ag__screen { transition: none; }
}
`;
