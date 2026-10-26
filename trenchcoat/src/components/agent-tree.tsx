"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type ReactNode, type Ref } from "react";
import { useControllable } from "../internal/use-controllable";
import { reducedMotion } from "../internal/reduced-motion";
import { rescueFocus, useFocusRescue } from "../internal/use-focus-rescue";
import { useOnScreen } from "../internal/use-on-screen";
import { useRootRef } from "../internal/use-root-ref";

/*
 * Agent Tree – who started whom, in a single self-contained file.
 * An orchestrator splits a job and hands parts to sub-agents, which may start their own. The tree shows every agent
 * as a white card on a soft gray tray – model, status, what it was asked, its cost and time – joined by thin blue connectors with a
 * hollow dot where they leave the parent.
 *   · new agents grow in: the connector draws itself, then the card rises in – several at once, one after another
 *   · when the tree changes, cards glide to their new place and the connectors follow them frame by frame
 *   · agents that go – a folded branch, a new run – fade out a beat after each other, bottom first,
 *     while their connectors pull back into the parent
 *   · costs roll up – a branch with children shows what the whole branch cost
 *   · fold a branch to "+3"; the header sums up the whole run
 *   · the tools an agent works with sit as small overlapping tiles before what it does
 * Wide containers lay the first level out side by side, deeper levels hang below their parent;
 * narrow ones indent every level. The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: agent-tree.tsx is Standard,
 * agent-tree-clean.tsx is Clean). Clean draws each agent as one small card – no white card on a gray layer, so
 * who and what sit directly on it, next to the cost, time and folding.
 */

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-agt";

export type TreeAgentStatus = "queued" | "running" | "waiting" | "done" | "failed" | "stopped";

export type TreeAgent = {
  id: string;
  name: string;
  /** What it was asked to do */
  task: string;
  model?: string;
  /** A small mark, e.g. the model maker's logo – defaults to the initials */
  avatar?: ReactNode;
  /** Marks of the tools it works with, e.g. GitHub and Stripe – shown as small overlapping tiles */
  tools?: ReactNode[];
  status: TreeAgentStatus;
  /** Its own cost so far – the children's costs are added on top */
  cost?: number;
  /** What it waits for you to decide – shown when you open "needs you" */
  ask?: string;
  /** What went wrong – shown when you open "failed" */
  error?: string;
  /** When it started and ended (ms) – for the time it took */
  started?: number;
  ended?: number;
  children?: TreeAgent[];
};

type AgentTreeOwnProps = {
  /** Visual style. Defaults to the file's look: Standard in agent-tree.tsx, Clean in agent-tree-clean.tsx */
  look?: Look;
  root: TreeAgent;
  /** Ids of folded branches. Controlled when defined; otherwise the component keeps them, starting from
   *  `defaultCollapsed` */
  collapsed?: string[];
  defaultCollapsed?: string[];
  onCollapsedChange?: (collapsed: string[]) => void;
  /** An answer from the "needs you" or "failed" window: approve or reject a waiting agent, retry or dismiss a failed
   *  one. May return a promise: the answer's buttons wait, and if it rejects the window stays open and says so */
  onResolve?: (agent: TreeAgent, action: "approve" | "reject" | "retry" | "dismiss") => void | Promise<unknown>;
  /** A click on a card – e.g. to open its log */
  onSelect?: (agent: TreeAgent) => void;
  /** The clock for running times, in epoch ms – defaults to an internal clock */
  now?: number;
  /** Formats every cost – defaults to dollars, e.g. "$0.42" */
  formatCost?: (amount: number) => string;
  title?: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export type AgentTreeProps = Omit<ComponentPropsWithoutRef<"div">, keyof AgentTreeOwnProps> & AgentTreeOwnProps;

const NONE: string[] = [];

/* ---------- Helpers ---------- */

const STATUS: Record<TreeAgentStatus, string> = {
  queued: "Queued",
  running: "Running",
  waiting: "Needs you",
  done: "Done",
  failed: "Failed",
  stopped: "Stopped",
};
const dollars = (n: number) => `$${n < 10 ? n.toFixed(2) : Math.round(n).toLocaleString("en-US")}`;
const took = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
};
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
const walk = (a: TreeAgent): TreeAgent[] => [a, ...(a.children ?? []).flatMap(walk)];
const costOf = (a: TreeAgent): number => (a.cost ?? 0) + (a.children ?? []).reduce((sum, c) => sum + costOf(c), 0);

/** Position of an element inside the tree, from offsets – so transforms and zoom don't throw it off */
const place = (el: HTMLElement, box: HTMLElement) => {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== box) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
};

/* ---------- Icons ---------- */

const Spark = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <path d="M7 1.2c.4 2.9 1.9 4.4 4.8 4.8-2.9.4-4.4 1.9-4.8 4.8C6.6 7.9 5.1 6.4 2.2 6 5.1 5.6 6.6 4.1 7 1.2Z" fill="currentColor" />
    <circle cx="11.6" cy="11.4" r="1.1" fill="currentColor" opacity="0.55" />
  </svg>
);
/* Status glyphs check, triangle-alert and clock, chevron-down: Lucide (ISC, lucide.dev); the loader is a plain arc */
const StatusIcon = ({ status }: { status: TreeAgentStatus }) => {
  if (status === "running")
    return (
      <svg className="ui-agt__spin" width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
        <path d="M12 3.5A8.5 8.5 0 0 1 20.5 12" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5" />
      </svg>
    );
  if (status === "done")
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  if (status === "failed")
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
        <path d="M12 9v4" strokeWidth="2.2" />
        <path d="M12 17h.01" strokeWidth="2.6" />
      </svg>
    );
  if (status === "waiting")
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    );
  if (status === "stopped")
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="6" y="6" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="2.2" />
      </svg>
    );
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3.5" fill="currentColor" />
    </svg>
  );
};
/* chevron-down: Lucide (ISC, lucide.dev) */
const Chevron = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

type Link = { id: string; d: string; dot: [number, number]; muted: boolean; leaving?: number; enter: number };
/** An agent as it is shown: its sub-agents after folding, and – while it fades out – the delay it leaves with */
type Shown = { agent: TreeAgent; kids: Shown[]; leaving?: number };
type Ghost = { shown: Shown; parent: string; index: number };
type Dot = { at: [number, number]; muted: boolean; leaving?: number };
type Resolution = "approve" | "reject" | "retry" | "dismiss";

/** One dot per parent, faded out with the last of its connectors */
const dotsOf = (links: Link[]) => {
  const dots = new Map<string, Dot>();
  for (const l of links) {
    const key = l.dot.join(",");
    const d = dots.get(key);
    const leaving = l.leaving;
    if (!d) dots.set(key, { at: l.dot, muted: l.muted, leaving });
    else dots.set(key, { at: d.at, muted: d.muted && l.muted, leaving: d.leaving === undefined || leaving === undefined ? undefined : Math.max(d.leaving, leaving) });
  }
  return dots;
};

/** What only a render can change: which connectors and dots there are and how they look – not where they run */
const structure = (links: Link[]) =>
  JSON.stringify([links.map((l) => [l.id, l.muted, l.leaving ?? null, l.enter]), [...dotsOf(links).values()].map((d) => [d.muted, d.leaving ?? null])]);

/** Moves the drawn connectors and dots to where they run now – same ones, in the same order */
const paintLinks = (paths: SVGSVGElement | null, dots: SVGSVGElement | null, links: Link[]) => {
  paths?.querySelectorAll("path").forEach((el, i) => links[i] && el.getAttribute("d") !== links[i].d && el.setAttribute("d", links[i].d));
  const at = [...dotsOf(links).values()].map((d) => d.at);
  dots?.querySelectorAll("circle").forEach((el, i) => {
    if (!at[i]) return;
    el.setAttribute("cx", String(at[i][0]));
    el.setAttribute("cy", String(at[i][1]));
  });
};

/** Motion: how long cards take to leave and to move, and the beat between cards that go together */
const EXIT = 280;
const MOVE = 420;
const STAGGER = 60;
const EASE = "cubic-bezier(0.32, 0.72, 0.24, 1)";
const flat = (s: Shown): Shown[] => [s, ...s.kids.flatMap(flat)];

/** " · 1m 05s" – how long an agent took, or has been at it */
const timeText = (a: TreeAgent, now: number) =>
  a.started ? ` · ${took((a.ended ?? (a.status === "running" || a.status === "waiting" ? now : a.started)) - a.started)}` : "";

/* ---------- The running clock: written into the times, not rendered ---------- */

/**
 * Running and waiting agents' times tick once a second. React renders them with the time of the last render; this
 * writes the current one into each `[data-since]` time's text – right after every commit, then every second while
 * anything is live, the tree is on screen and the tab is visible. No re-render per tick.
 */
function useLiveClock(boxRef: { current: HTMLElement | null }, live: boolean) {
  const paint = useCallback(() => {
    const now = Date.now();
    boxRef.current?.querySelectorAll<HTMLElement>("[data-since]").forEach((el) => {
      const text = el.firstChild;
      const next = ` · ${took(now - Number(el.dataset.since))}`;
      if (text && text.nodeValue !== next) text.nodeValue = next;
    });
  }, [boxRef]);
  // After each commit: what React just wrote may be a tick behind
  useLayoutEffect(paint);
  useEffect(() => {
    const box = boxRef.current;
    if (!live || !box) return;
    let onScreen = true;
    let timer = 0;
    const sync = () => {
      const run = onScreen && document.visibilityState !== "hidden";
      if (run && !timer) {
        paint();
        timer = window.setInterval(paint, 1000);
      } else if (!run && timer) {
        window.clearInterval(timer);
        timer = 0;
      }
    };
    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver((entries) => {
            onScreen = entries[entries.length - 1].isIntersecting;
            sync();
          });
    io?.observe(box);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      io?.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.clearInterval(timer);
    };
  }, [live, boxRef, paint]);
}

/* ---------- The connectors, measured from the cards as they are drawn – so they follow every move ---------- */

function useConnectors({
  boxRef,
  nodes,
  shown,
  wide,
  enterDelay,
  onScreen,
}: {
  boxRef: { current: HTMLDivElement | null };
  nodes: { current: Map<string, HTMLElement> };
  shown: Shown;
  wide: boolean;
  enterDelay: { current: Map<string, number> };
  onScreen: boolean;
}) {
  const [links, setLinks] = useState<Link[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  // The connectors as last measured; the state above changes only with their structure, so a glide doesn't re-render
  const geo = useRef<Link[]>([]);
  const drawn = useRef(structure([]));
  // Set between a new structure and its commit – the paths on screen are still the old ones then
  const pending = useRef(false);
  const pathsRef = useRef<SVGSVGElement>(null);
  const dotsRef = useRef<SVGSVGElement>(null);
  const firstSeen = useRef(new Map<string, number>());

  const measure = () => {
    const box = boxRef.current;
    if (!box) return;
    const outer = box.getBoundingClientRect();
    const scale = box.offsetWidth ? outer.width / box.offsetWidth : 1;
    const at = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return { x: (r.left - outer.left) / scale, y: (r.top - outer.top) / scale, w: r.width / scale, h: r.height / scale };
    };
    const next: Link[] = [];
    const R = 8;
    // The bar under the root runs at one height for every child: halfway down to the row the cards sit in –
    // not to each card, which may still be rising in or gliding, or the bar would split into steps
    const row = box.querySelector<HTMLElement>(":scope > .ui-agt__entry > .ui-agt__level");
    const rowTop = row ? at(row).y : null;
    const visit = (s: Shown, depth: number) => {
      const pe = nodes.current.get(s.agent.id);
      for (const k of s.kids) {
        const ce = nodes.current.get(k.agent.id);
        if (pe && ce) {
          const p = at(pe);
          const q = at(ce);
          const muted = k.agent.status === "queued" || k.agent.status === "stopped";
          const base = { id: `${s.agent.id}>${k.agent.id}`, muted, leaving: k.leaving, enter: enterDelay.current.get(k.agent.id) ?? 0 };
          if (wide && depth === 0) {
            // First level, side by side: one straight stem down from the parent, a straight bar along,
            // and each child's drop leaves the bar with a rounded corner
            const x1 = p.x + p.w / 2;
            const y1 = p.y + p.h;
            const x2 = q.x + q.w / 2;
            const y2 = q.y;
            const mid = Math.round(y1 + ((rowTop ?? y2) - y1) / 2);
            const dx = x2 - x1;
            const r = Math.max(0, Math.min(R, Math.abs(dx) / 2, (y2 - mid) / 2));
            const sg = Math.sign(dx);
            // Each drop starts at the card, so it draws itself in one stroke from the top – no gap at the stem while both draw.
            // A muted drop starts at the bar instead, so its gray never covers the blue stem; a card a few pixels off center
            // (still gliding in) hangs straight down rather than with a tiny kink
            const from = muted ? `M${x1} ${mid}` : `M${x1} ${y1}V${mid}`;
            const d = Math.abs(dx) < 12 ? `${from}V${y2}` : `${from}H${x2 - sg * r}Q${x2} ${mid} ${x2} ${mid + r}V${y2}`;
            next.push({ ...base, d, dot: [x1, y1] });
            // The stem, once per parent – it stays while any child is still there
            const stem = `${s.agent.id}>stem`;
            const prev = next.find((l) => l.id === stem);
            if (!prev) next.push({ id: stem, d: `M${x1} ${y1}V${mid}`, dot: [x1, y1], muted, leaving: k.leaving, enter: base.enter });
            else {
              prev.muted = prev.muted && muted;
              prev.leaving = prev.leaving === undefined || k.leaving === undefined ? undefined : Math.max(prev.leaving, k.leaving);
              prev.enter = Math.min(prev.enter, base.enter);
            }
          } else {
            // Hanging below: down along the parent's left edge, then into the child's side
            const x1 = p.x + 21;
            const y1 = p.y + p.h;
            const x2 = q.x;
            const y2 = q.y + 20;
            const r = Math.max(0, Math.min(R, (x2 - x1) / 2, (y2 - y1) / 2));
            const d = x2 - x1 < 2 ? `M${x1} ${y1}V${q.y}` : `M${x1} ${y1}V${y2 - r}Q${x1} ${y2} ${x1 + r} ${y2}H${x2}`;
            next.push({ ...base, d, dot: [x1, y1] });
          }
        }
        visit(k, depth + 1);
      }
    };
    visit(shown, 0);
    // A connector that is gone draws itself again when it comes back
    for (const id of [...firstSeen.current.keys()]) if (!next.some((l) => l.id === id)) firstSeen.current.delete(id);
    geo.current = next;
    const sig = structure(next);
    if (sig !== drawn.current) {
      drawn.current = sig;
      pending.current = true;
      setLinks(next);
    } else if (!pending.current) paintLinks(pathsRef.current, dotsRef.current, next);
    const w = box.scrollWidth;
    const h = box.scrollHeight;
    setSize((z) => (z.w === w && z.h === h ? z : { w, h }));
  };
  // The latest measure, for the frame loop and the resize observer (kept after each commit, not during render)
  const latest = useRef(measure);
  useLayoutEffect(() => {
    latest.current = measure;
  });
  // After a commit the paths show what was measured last, even if a card moved since the structure changed
  useLayoutEffect(() => {
    pending.current = false;
    paintLinks(pathsRef.current, dotsRef.current, geo.current);
  }, [links]);

  // While cards rise, glide or leave, the connectors are measured every frame
  const until = useRef(0);
  const raf = useRef(0);
  const visible = useRef(onScreen);
  const follow = useCallback((ms: number) => {
    until.current = Math.max(until.current, performance.now() + ms);
    if (raf.current || !visible.current) return;
    const loop = () => {
      latest.current();
      raf.current = performance.now() < until.current && visible.current ? requestAnimationFrame(loop) : 0;
    };
    raf.current = requestAnimationFrame(loop);
  }, []);
  // Off screen the loop stops; back on screen the connectors are measured once (and follow what is still moving)
  useEffect(() => {
    if (visible.current === onScreen) return;
    visible.current = onScreen;
    if (!onScreen) return;
    latest.current();
    follow(0);
  }, [onScreen, follow]);
  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    },
    [],
  );

  // A connector drawn for the first time draws itself in, timed with its card
  // (a link is fresh until its draw is over: render only reads which ones have finished, timers mark them)
  const [drawnIn, setDrawnIn] = useState<Set<string>>(() => new Set());
  const linkKey = links.map((l) => `${l.id}:${l.enter}`).join("|");
  const drawTimers = useRef(new Set<number>());
  useEffect(() => {
    for (const l of links) {
      if (firstSeen.current.has(l.id)) continue;
      firstSeen.current.set(l.id, 1);
      const t = window.setTimeout(() => {
        drawTimers.current.delete(t);
        setDrawnIn((d) => new Set(d).add(l.id));
      }, 700 + l.enter);
      drawTimers.current.add(t);
    }
    // A link that went away draws itself in again when it comes back
    setDrawnIn((d) => {
      const kept = [...d].filter((id) => links.some((l) => l.id === id));
      return kept.length === d.size ? d : new Set(kept);
    });
  }, [linkKey]); // eslint-disable-line react-hooks/exhaustive-deps -- the key covers what matters in links
  useEffect(() => {
    const timers = drawTimers.current;
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, []);
  const fresh = new Set(links.filter((l) => !drawnIn.has(l.id)).map((l) => l.id));

  return { links, size, fresh, pathsRef, dotsRef, measure, latest, follow };
}

/* ---------- Motion: cards glide to their new place ---------- */

/**
 * When the layout changes (`layoutKey`: the tree's shape and what sizes its cards), every card that moved glides from
 * where it was. Positions are read once per such change – and refreshed, without a glide, when the tree is resized.
 */
function useGlide(
  boxRef: { current: HTMLDivElement | null },
  nodes: { current: Map<string, HTMLElement> },
  layoutKey: string,
  follow: (ms: number) => void,
) {
  const lastPos = useRef(new Map<string, { x: number; y: number }>());
  const record = useCallback(
    (glide: boolean) => {
      const box = boxRef.current;
      if (!box) return false;
      // Every read first; the glides (compositor-only animations) after
      const now = [...nodes.current].map(([id, el]) => [id, el, place(el, box)] as const);
      let moved = false;
      const still = reducedMotion();
      for (const [id, el, p] of now) {
        const before = lastPos.current.get(id);
        if (glide && !still && before && (Math.abs(before.x - p.x) > 0.5 || Math.abs(before.y - p.y) > 0.5)) {
          el.animate([{ translate: `${before.x - p.x}px ${before.y - p.y}px` }, { translate: "0px 0px" }], { duration: MOVE, easing: EASE });
          moved = true;
        }
        lastPos.current.set(id, p);
      }
      for (const id of [...lastPos.current.keys()]) if (!nodes.current.has(id)) lastPos.current.delete(id);
      return moved;
    },
    [boxRef, nodes],
  );
  useLayoutEffect(() => {
    if (record(true)) follow(MOVE + 40);
  }, [layoutKey, record, follow]);
  return record;
}

/* ---------- One agent ---------- */

function AgentCard({
  shown: s,
  depth,
  look,
  folded,
  now,
  clock,
  delay,
  nodes,
  formatCost,
  onSelect,
  onToggle,
}: {
  shown: Shown;
  depth: number;
  look: Look;
  folded: boolean;
  now: number;
  /** The internal clock ticks this card's time (see useLiveClock) */
  clock: boolean;
  delay: number;
  nodes: { current: Map<string, HTMLElement> };
  formatCost: (amount: number) => string;
  onSelect?: (agent: TreeAgent) => void;
  onToggle: (id: string) => void;
}) {
  const a = s.agent;
  const kids = a.children ?? [];
  const branch = kids.length ? costOf(a) : a.cost ?? 0;
  const time = timeText(a, now);
  const ticking = clock && a.started !== undefined && a.ended === undefined && (a.status === "running" || a.status === "waiting");
  const hidden = folded ? walk(a).length - 1 : 0;
  const leaving = s.leaving !== undefined;
  const head = (
    <>
      <div className="ui-agt__top">
        <span className="ui-agt__avatar" data-logo={a.avatar ? "" : undefined} aria-hidden="true">
          {a.avatar ?? initials(a.name)}
        </span>
        <span className="ui-agt__who">
          {/* With onSelect the name is the card's keyboard target (the whole card stays clickable for a pointer) */}
          {onSelect ? (
            <button
              type="button"
              className="ui-agt__name ui-agt__select"
              data-focus-key={`select:${a.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(a);
              }}
            >
              {a.name}
            </button>
          ) : (
            <span className="ui-agt__name">{a.name}</span>
          )}
          {a.model && <span className="ui-agt__model">{a.model}</span>}
        </span>
        <span className="ui-agt__status" data-status={a.status}>
          <StatusIcon status={a.status} />
          {STATUS[a.status]}
        </span>
      </div>
      {/* What it does – led by the tools it uses as small overlapping tiles; a second line runs on under them */}
      <p className="ui-agt__task">
        {a.tools && a.tools.length > 0 && (
          <span className="ui-agt__tools" aria-hidden="true">
            {a.tools.slice(0, 4).map((tool, i) => (
              <span key={i} className="ui-agt__tool">
                {tool}
              </span>
            ))}
          </span>
        )}
        {a.task}
      </p>
    </>
  );
  return (
    <div
      className="ui-agt__node"
      data-status={a.status}
      data-depth={depth}
      data-leaving={leaving ? "" : undefined}
      inert={leaving || undefined}
      style={{ animationDelay: `${leaving ? s.leaving : delay}ms` }}
      ref={(el) => {
        if (el) nodes.current.set(a.id, el);
        else nodes.current.delete(a.id);
      }}
      onClick={onSelect && !leaving ? () => onSelect(a) : undefined}
      data-clickable={onSelect ? "" : undefined}
    >
      {/* Standard: who and what on a white card on the gray layer, with cost, time and folding on the layer below it.
          Clean: one card, who and what sit directly on it */}
      {look === "standard" ? <div className="ui-agt__card">{head}</div> : head}
      <div className="ui-agt__meta">
        <span className="ui-agt__cost" title={kids.length ? "This branch, with its sub-agents" : undefined}>
          <span className="ui-agt__amount" data-live={walk(a).some((x) => x.status === "running") ? "" : undefined}>
            {formatCost(branch)}
          </span>
          {time && (
            <span className="ui-agt__time" data-since={ticking ? a.started : undefined}>
              {time}
            </span>
          )}
        </span>
        {kids.length > 0 && (
          <button
            type="button"
            className="ui-agt__fold"
            aria-expanded={!folded}
            aria-label={`${folded ? `+${hidden}` : kids.length} sub-agents of ${a.name}`}
            data-focus-key={`fold:${a.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(a.id);
            }}
          >
            {folded ? `+${hidden}` : kids.length}
            <Chevron />
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- The bar: the run summed up, and the window behind "needs you" and "failed" ---------- */

function RunSummary({
  title,
  all,
  total,
  formatCost,
  onResolve,
}: {
  title: string;
  all: TreeAgent[];
  total: number;
  formatCost: (amount: number) => string;
  onResolve?: (agent: TreeAgent, action: Resolution) => void | Promise<unknown>;
}) {
  // Answers on their way (their buttons wait), and the ones that failed
  const [answering, setAnswering] = useState<Record<string, "pending" | "error">>({});
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // The "needs you" or "failed" window; a click elsewhere or Esc closes it
  const [opened, setOpened] = useState<"waiting" | "failed" | null>(null);
  const barRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!opened) return;
    const away = (e: PointerEvent) => {
      if (!barRef.current?.contains(e.target as Node)) setOpened(null);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [opened]);

  const running = all.filter((a) => a.status === "running").length;
  const waiting = all.filter((a) => a.status === "waiting").length;
  const failed = all.filter((a) => a.status === "failed").length;
  const openList = opened ? all.filter((a) => a.status === opened) : [];
  const resolve = (a: TreeAgent, action: Resolution) => {
    if (answering[a.id] === "pending") return;
    const last = openList.length <= 1;
    const done = onResolve?.(a, action);
    if (done && typeof (done as Promise<unknown>).then === "function") {
      setAnswering((m) => ({ ...m, [a.id]: "pending" }));
      (done as Promise<unknown>).then(
        () => {
          if (!alive.current) return;
          setAnswering(({ [a.id]: _done, ...others }) => others);
          if (last) setOpened(null);
        },
        () => alive.current && setAnswering((m) => ({ ...m, [a.id]: "error" })),
      );
      return;
    }
    setAnswering(({ [a.id]: _done, ...others }) => others);
    if (last) setOpened(null);
  };

  return (
    <header ref={barRef} className="ui-agt__bar">
      <span className="ui-agt__spark">
        <Spark />
      </span>
      <span className="ui-agt__title">{title}</span>
      {/* What changed for the run as a whole – who needs you, what failed, when it's over – not every cost tick */}
      <span className="ui-agt__sr" role="status">
        {[waiting > 0 && `${waiting} ${waiting === 1 ? "agent needs" : "agents need"} you`, failed > 0 && `${failed} failed`, running === 0 && waiting === 0 && "No agent running"]
          .filter(Boolean)
          .join(", ")}
      </span>
      <span className="ui-agt__sum">
        <span>{all.length === 1 ? "1 agent" : `${all.length} agents`}</span>
        {running > 0 && <span className="ui-agt__sum-run">{running} running</span>}
        {waiting > 0 && (
          <button type="button" className="ui-agt__sum-btn" data-kind="waiting" data-focus-key="sum:waiting" aria-expanded={opened === "waiting"} aria-haspopup="dialog" onClick={() => setOpened((o) => (o === "waiting" ? null : "waiting"))}>
            {waiting} needs you
            <Chevron />
          </button>
        )}
        {failed > 0 && (
          <button type="button" className="ui-agt__sum-btn" data-kind="failed" data-focus-key="sum:failed" aria-expanded={opened === "failed"} aria-haspopup="dialog" onClick={() => setOpened((o) => (o === "failed" ? null : "failed"))}>
            {failed} failed
            <Chevron />
          </button>
        )}
        <span className="ui-agt__sum-cost">
          <span className="ui-agt__amount" data-live={running > 0 ? "" : undefined}>
            {formatCost(total)}
          </span>
        </span>
      </span>

      {/* The window behind "needs you" and "failed": every such agent, with what to do about it */}
      {opened && openList.length > 0 && (
        <div
          className="ui-agt__pop"
          role="dialog"
          data-kind={opened}
          aria-label={opened === "waiting" ? "Agents that need you" : "Agents that failed"}
          onKeyDown={(e) => {
            if (e.key !== "Escape") return;
            e.stopPropagation();
            // Back to the button that opened it
            rescueFocus(e.currentTarget, [`[data-focus-key="sum:${opened}"]`], barRef.current ?? document);
            setOpened(null);
          }}
        >
          {openList.map((a, i) => (
            <div key={a.id} className="ui-agt__pop-item">
              <span className="ui-agt__pop-head">
                <span className="ui-agt__status" data-status={a.status}>
                  <StatusIcon status={a.status} />
                </span>
                <span className="ui-agt__pop-name">{a.name}</span>
                <span className="ui-agt__pop-task">{a.task}</span>
              </span>
              {(opened === "waiting" ? a.ask : a.error) && <span className="ui-agt__pop-text">{opened === "waiting" ? a.ask : a.error}</span>}
              {answering[a.id] === "error" && (
                <span className="ui-agt__pop-text ui-agt__pop-error" role="alert">
                  Didn't go through – try again
                </span>
              )}
              <span className="ui-agt__pop-actions" aria-busy={answering[a.id] === "pending" || undefined}>
                <button type="button" className="ui-agt__btn" data-focus-key={`pop:${opened}`} disabled={answering[a.id] === "pending"} onClick={() => resolve(a, opened === "waiting" ? "reject" : "dismiss")}>
                  {opened === "waiting" ? "Reject" : "Dismiss"}
                </button>
                <button type="button" className="ui-agt__btn ui-agt__btn--primary" data-focus-key={`pop:${opened}`} autoFocus={i === 0} disabled={answering[a.id] === "pending"} onClick={() => resolve(a, opened === "waiting" ? "approve" : "retry")}>
                  {opened === "waiting" ? "Approve" : "Retry"}
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}

export function AgentTree({
  look,
  root,
  collapsed,
  defaultCollapsed = NONE,
  onCollapsedChange,
  onSelect,
  onResolve,
  now: nowProp,
  formatCost = dollars,
  title = "Agents",
  className,
  ref,
  ...rest
}: AgentTreeProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const setRoot = useRootRef(rootRef, ref);
  const resolvedLook = look ?? DEFAULT_LOOK;
  const [folded, setFolded] = useControllable(collapsed, defaultCollapsed, onCollapsedChange, "collapsed");
  const toggle = (id: string) => setFolded(folded.includes(id) ? folded.filter((c) => c !== id) : [...folded, id]);

  const all = walk(root);
  const live = all.some((a) => a.status === "running");

  // Focus never drops to <body>: a card that folds away or leaves hands focus to its nearest shown ancestor's fold
  // button; an answered "needs you"/"failed" window to the next answer, then to the button that opened it
  useFocusRescue(rootRef, {
    fallback: (key) => {
      const box = rootRef.current;
      if (!box || !key) return null;
      const find = (k: string) => [...box.querySelectorAll<HTMLElement>(`[data-focus-key="${CSS.escape(k)}"]`)].find((el) => !el.closest("[inert]")) ?? null;
      const [kind, id] = [key.slice(0, key.indexOf(":")), key.slice(key.indexOf(":") + 1)];
      const other = id === "waiting" ? "failed" : "waiting";
      const firstCard = () => [...box.querySelectorAll<HTMLElement>(".ui-agt__select, .ui-agt__fold")].find((el) => !el.closest("[inert]")) ?? null;
      if (kind === "pop") return box.querySelector<HTMLElement>(".ui-agt__pop .ui-agt__btn--primary:not(:disabled)") ?? find(`sum:${id}`) ?? find(`sum:${other}`) ?? firstCard();
      if (kind === "sum") return find(`sum:${other}`) ?? firstCard();
      const path = (a: TreeAgent, trail: TreeAgent[]): TreeAgent[] | null =>
        a.id === id ? trail : (a.children ?? []).reduce<TreeAgent[] | null>((found, c) => found ?? path(c, [...trail, a]), null);
      for (const anc of (path(root, []) ?? []).reverse()) {
        const el = find(`fold:${anc.id}`) ?? find(`select:${anc.id}`);
        if (el) return el;
      }
      return firstCard();
    },
  });
  // 0 on the server and the first render (hydration-safe), read before the first paint; after that the running
  // times are ticked in the DOM (useLiveClock), not by re-rendering
  const [tick, setTick] = useState(0);
  useLayoutEffect(() => {
    if (nowProp === undefined) setTick(Date.now());
  }, [nowProp]);
  const now = nowProp ?? tick;
  useLiveClock(boxRef, live && nowProp === undefined);

  /* ---------- Wide or narrow: side by side, or every level indented ---------- */

  const [wide, setWide] = useState(true);

  /* ---------- What is shown: the open tree, plus cards that are on their way out ---------- */

  const toShown = (a: TreeAgent): Shown => ({ agent: a, kids: folded.includes(a.id) ? [] : (a.children ?? []).map(toShown) });
  const visible = toShown(root);
  const visibleIds = new Set(flat(visible).map((s) => s.agent.id));
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const leavingNow = ghosts.filter((g) => !visibleIds.has(g.shown.agent.id));
  const merge = (s: Shown): Shown => {
    const kids = s.kids.map(merge);
    leavingNow
      .filter((g) => g.parent === s.agent.id)
      .sort((a, b) => a.index - b.index)
      .forEach((g) => kids.splice(Math.min(g.index, kids.length), 0, g.shown));
    return { ...s, kids };
  };
  const shown = merge(visible);
  const shownAll = flat(shown);

  // Cards that appear together rise one after another; the delay sticks to the card until it leaves
  // (render works the new ones out; they are remembered after the commit)
  const enterDelay = useRef(new Map<string, number>());
  const mounted = useRef(false);
  let newcomers = 0;
  const newDelays = new Map<string, number>();
  for (const s of shownAll) {
    if (s.leaving !== undefined || enterDelay.current.has(s.agent.id) || newDelays.has(s.agent.id)) continue;
    newDelays.set(s.agent.id, s === shown ? 0 : (mounted.current ? 160 : 200) + newcomers++ * STAGGER);
  }
  const delayOf = (id: string) => enterDelay.current.get(id) ?? newDelays.get(id) ?? 0;

  const nodes = useRef(new Map<string, HTMLElement>());
  // Off screen the connectors stop following frame by frame (and the loops pause); they catch up on return
  const onScreen = useOnScreen(boxRef);
  const { links, size, fresh, pathsRef, dotsRef, measure, latest, follow } = useConnectors({ boxRef, nodes, shown, wide, enterDelay, onScreen });
  const shape = JSON.stringify([
    wide,
    folded,
    shownAll.map((s) => [s.agent.id, s.agent.status, s.leaving ?? "", s.kids.map((k) => k.agent.id)]),
  ]);
  // What moves cards: the shape, the depth and what sizes a card
  const layoutKey = JSON.stringify([shape, shownAll.map((s) => [s.agent.name, s.agent.model ?? "", s.agent.task, s.agent.tools?.length ?? 0])]);
  const recordPositions = useGlide(boxRef, nodes, layoutKey, follow);

  /* ---------- Motion: what leaves the tree fades out, a beat after each other, bottom first ---------- */

  const prevVisible = useRef<Shown | null>(null);
  useLayoutEffect(() => {
    const prev = prevVisible.current;
    prevVisible.current = visible;
    mounted.current = true;
    for (const [id, d] of newDelays) if (!enterDelay.current.has(id)) enterDelay.current.set(id, d);
    // Cards that are gone for good start over when they come back
    for (const id of [...enterDelay.current.keys()]) if (!shownAll.some((s) => s.agent.id === id && s.leaving === undefined)) enterDelay.current.delete(id);
    if (!prev || reducedMotion()) return;
    const removed: Ghost[] = [];
    const scan = (s: Shown) =>
      s.kids.forEach((k, index) => {
        if (!visibleIds.has(k.agent.id)) removed.push({ shown: k, parent: s.agent.id, index });
        else scan(k);
      });
    scan(prev);
    if (!removed.length) return;
    const order = removed.flatMap((g) => flat(g.shown)).reverse();
    const delay = new Map(order.map((s, i) => [s.agent.id, i * STAGGER]));
    const mark = (s: Shown): Shown => ({ ...s, leaving: delay.get(s.agent.id) ?? 0, kids: s.kids.map(mark) });
    const batch = removed.filter((g) => visibleIds.has(g.parent) || g.parent === root.id).map((g) => ({ ...g, shown: mark(g.shown) }));
    const ids = new Set(batch.map((g) => g.shown.agent.id));
    setGhosts((gs) => [...gs.filter((g) => !ids.has(g.shown.agent.id)), ...batch]);
    const total = EXIT + (order.length - 1) * STAGGER;
    window.setTimeout(() => setGhosts((gs) => gs.filter((g) => !ids.has(g.shown.agent.id))), total + 30);
    follow(total + MOVE + 60);
  });

  useLayoutEffect(() => {
    measure();
    follow(900 + newcomers * STAGGER);
  }, [shape]); // eslint-disable-line react-hooks/exhaustive-deps
  // One observer for size changes: it picks the layout, redraws the connectors and notes where the cards are now
  // (a width that flips the layout glides them on the re-render; any other resize just moves them)
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const ro = new ResizeObserver(() => {
      recordPositions(false);
      setWide(box.offsetWidth >= 560);
      latest.current();
    });
    ro.observe(box);
    return () => ro.disconnect();
  }, [recordPositions, latest]);

  /** A card with everything that hangs below it */
  const card = (s: Shown, depth: number) => (
    <AgentCard
      shown={s}
      depth={depth}
      look={resolvedLook}
      folded={folded.includes(s.agent.id)}
      now={now}
      clock={nowProp === undefined}
      delay={delayOf(s.agent.id)}
      nodes={nodes}
      formatCost={formatCost}
      onSelect={onSelect}
      onToggle={toggle}
    />
  );
  const hang = (s: Shown, depth: number): ReactNode => (
    <div className="ui-agt__hang" key={s.agent.id} role="listitem">
      {card(s, depth)}
      {s.kids.length > 0 && (
        <div className="ui-agt__below" role="list" aria-label={`Started by ${s.agent.name}`}>
          {s.kids.map((k) => hang(k, depth + 1))}
        </div>
      )}
    </div>
  );

  // The deepest level on screen – narrow trees size every card to fit it, so all cards are as wide
  const deepest = (s: Shown, d: number): number => Math.max(d, ...s.kids.map((k) => deepest(k, d + 1)));
  const depth = deepest(shown, 0);
  const dots = dotsOf(links);

  return (
    <div {...rest} ref={setRoot} className={[ROOT_CLASS, className].filter(Boolean).join(" ")} data-look={resolvedLook} data-wide={wide ? "" : undefined}>
      <style href="ui-agent-tree" precedence="default">
        {css}
      </style>

      <RunSummary title={title} all={all} total={costOf(root)} formatCost={formatCost} onResolve={onResolve} />

      <div ref={boxRef} className="ui-agt__tree" data-offscreen={onScreen ? undefined : ""} role="list" aria-label={title} style={{ ["--tc-agent-tree-depth" as string]: depth }}>
        <svg ref={pathsRef} className="ui-agt__links" width={size.w} height={size.h} aria-hidden="true">
          {links.map((l) => (
            <g key={l.id} data-muted={l.muted ? "" : undefined} data-fresh={fresh.has(l.id) && l.leaving === undefined && !reducedMotion() ? "" : undefined} data-leaving={l.leaving !== undefined ? "" : undefined}>
              <path
                d={l.d}
                pathLength={1}
                className="ui-agt__link"
                style={{ animationDelay: `${l.leaving !== undefined ? l.leaving : Math.max(0, l.enter - 160)}ms` }}
              />
            </g>
          ))}
        </svg>

        {/* The root on top, the first level side by side (or indented when narrow), the rest hanging below */}
        {/* Plain nested lists (who started whom). The root's entry is layout-neutral (display: contents), so the root
            and the first level stay items of the tree's grid */}
        <div className="ui-agt__entry" role="listitem">
          <div className="ui-agt__root">{card(shown, 0)}</div>
          {shown.kids.length > 0 && (
            <div className="ui-agt__level" role="list" aria-label={`Started by ${root.name}`}>
              {shown.kids.map((k) => hang(k, 1))}
            </div>
          )}
        </div>

        <svg ref={dotsRef} className="ui-agt__links ui-agt__dots" width={size.w} height={size.h} aria-hidden="true">
          {/* One hollow dot where the connectors leave a parent – on top of the card's edge */}
          {[...dots].map(([key, d]) => (
            <circle
              key={key}
              cx={d.at[0]}
              cy={d.at[1]}
              r={3.25}
              className="ui-agt__dot"
              data-muted={d.muted ? "" : undefined}
              data-leaving={d.leaving !== undefined ? "" : undefined}
              style={d.leaving !== undefined ? { animationDelay: `${d.leaving}ms` } : undefined}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Colors and motion as variables – override them on .ui-agt */
:where([data-look="standard"], [data-look="standard"] *).ui-agt {
  /* The connectors: a soft blue with hollow dots, as in the Project Flow illustration */
  --tc-agent-tree-link: light-dark(#82bcff, #4f8fdb);
  --tc-agent-tree-link-muted: var(--tc-border-strong);
  /* The gray layer and the white card on it: in dark the layer is a raised surface and the card an overlay */
  --tc-agent-tree-tray-bg: var(--tc-surface-tray);
  --tc-agent-tree-card-bg: var(--tc-surface-on-tray);
  --tc-agent-tree-dot-bg: var(--tc-surface-base);
  --tc-agent-tree-fold-hover-bg: light-dark(#e4e4e4, #2a2a2e);
  --tc-agent-tree-shine: light-dark(#c4c4c4, #6a6a70);
  --tc-agent-tree-card-w: 222px;
  --tc-agent-tree-indent: 24px;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: 4px 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
  letter-spacing: -0.006em;
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-agt */
:where([data-look="clean"], [data-look="clean"] *).ui-agt {
  /* The connectors: a soft blue with hollow dots, as in the Project Flow illustration */
  --tc-agent-tree-link: light-dark(#82bcff, #4f8fdb);
  --tc-agent-tree-link-muted: var(--tc-border-strong);
  --tc-agent-tree-shine: light-dark(rgba(0, 0, 0, 0.22), rgba(255, 255, 255, 0.35));
  --tc-agent-tree-card-w: 216px;
  --tc-agent-tree-indent: 32px;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
.ui-agt *, .ui-agt *::before, .ui-agt *::after { box-sizing: border-box; }
:where(.ui-agt) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-agt button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-agt p { margin: 0; }
.ui-agt svg { display: block; flex: none; }
.ui-agt__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* ----- The bar: title and the whole run in numbers ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-agt__bar { position: relative; z-index: 3; display: flex; align-items: center; gap: 8px; min-width: 0; margin: 0 4px 18px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__bar { position: relative; z-index: 3; display: flex; align-items: center; gap: 8px; min-width: 0; margin-bottom: 16px; }
.ui-agt__spark { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-accent-text); }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__title { flex: none; font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__sum { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: 4px 12px; margin-left: auto; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__title { flex: none; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__sum { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: 4px 10px; margin-left: auto; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-agt__sum-run { color: var(--tc-accent-text); }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__sum-cost { min-width: 46px; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-semibold); text-align: right; }
/* "needs you" and "failed" open a small window to deal with them */
:where([data-look="standard"], [data-look="standard"] *).ui-agt__sum-btn { display: inline-flex; align-items: center; gap: 2px; height: 24px; margin: -3px 0; padding: 0 6px 0 9px; border-radius: var(--tc-radius-badge); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); transition: filter var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__sum-cost { min-width: 44px; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); text-align: right; }
/* "needs you" and "failed" open a small window to deal with them */
:where([data-look="clean"], [data-look="clean"] *).ui-agt__sum-btn { display: inline-flex; align-items: center; gap: 2px; height: 22px; margin: -3px 0; padding: 0 4px 0 7px; border-radius: var(--tc-radius-badge); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-agt__sum-btn[data-kind="waiting"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-agt__sum-btn[data-kind="failed"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-agt__sum-btn:hover { filter: saturate(1.3) brightness(0.97); }
.ui-agt__sum-btn > svg { transition: transform var(--tc-duration-base) var(--tc-ease-move); }
.ui-agt__sum-btn[aria-expanded="true"] > svg { transform: rotate(180deg); }
/* The window behind "needs you" and "failed": a popover on the menu recipe */
.ui-agt__pop { position: absolute; top: calc(100% + 8px); right: 0; z-index: var(--tc-z-dropdown); display: grid; gap: 4px; max-width: 100%; padding: var(--tc-menu-padding); border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); box-shadow: var(--tc-menu-shadow); animation: ui-agt-pop var(--tc-duration-base) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__pop { width: 310px; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__pop-item { display: grid; gap: 4px; padding: 10px; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__pop-item + .ui-agt__pop-item { border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__pop { width: 300px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__pop-item { display: grid; gap: 4px; padding: 8px 8px 8px; border-radius: calc(var(--tc-menu-radius) - var(--tc-menu-padding)); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__pop-item + .ui-agt__pop-item { border-top: var(--tc-hairline) solid var(--tc-divider); border-radius: 0 0 calc(var(--tc-menu-radius) - var(--tc-menu-padding)) calc(var(--tc-menu-radius) - var(--tc-menu-padding)); }
.ui-agt__pop-head { display: flex; align-items: center; gap: 8px; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__pop-head .ui-agt__status { width: 22px; padding: 0; justify-content: center; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__pop-name { flex: none; font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__pop-task { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__pop-text { padding-left: 30px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-agt__pop-text.ui-agt__pop-error { color: var(--tc-status-danger-fg); }
.ui-agt__pop-actions[aria-busy] .ui-agt__btn { opacity: 0.6; cursor: progress; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__pop-actions { display: flex; justify-content: flex-end; gap: 6px; margin-top: 6px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__pop-head .ui-agt__status { width: 20px; padding: 0; justify-content: center; }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__pop-name { flex: none; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__pop-task { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__pop-text { padding-left: 28px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__pop-actions { display: flex; justify-content: flex-end; gap: 6px; margin-top: 4px; }
/* Reject/Dismiss and Approve/Retry: the library's secondary and primary buttons */
.ui-agt__btn { display: inline-flex; align-items: center; height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-agt__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-agt__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-agt__btn--primary:hover { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-agt__btn--primary:active { background: var(--tc-action-primary-bg-active); }
/* ----- The tree ----- */
.ui-agt__tree { position: relative; display: grid; justify-items: center; }
.ui-agt__links { position: absolute; top: 0; left: 0; overflow: visible; pointer-events: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__link { fill: none; stroke: var(--tc-agent-tree-link); stroke-width: 1.75; stroke-linecap: round; transition: stroke var(--tc-duration-moderate) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__link { fill: none; stroke: var(--tc-agent-tree-link); stroke-width: 1.5; stroke-linecap: round; transition: stroke var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-agt__links [data-muted] .ui-agt__link { stroke: var(--tc-agent-tree-link-muted); }
/* A new connector draws itself from the parent */
.ui-agt__links [data-fresh] .ui-agt__link { stroke-dasharray: 1 1; stroke-dashoffset: 1; animation: ui-agt-draw var(--tc-duration-slower) var(--tc-ease-move) both; }
.ui-agt__dots { z-index: 2; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__dot { fill: var(--tc-agent-tree-dot-bg); stroke: var(--tc-agent-tree-link); stroke-width: 1.75; transition: stroke var(--tc-duration-moderate) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__dot { fill: var(--tc-surface-raised); stroke: var(--tc-agent-tree-link); stroke-width: 1.5; transition: stroke var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-agt__dot[data-muted] { stroke: var(--tc-agent-tree-link-muted); }
/* Wide: the first level side by side under the root, each with its branch hanging below */
.ui-agt__entry { display: contents; }
.ui-agt__root { position: relative; z-index: 1; }
.ui-agt__level { position: relative; z-index: 1; display: flex; align-items: flex-start; justify-content: center; gap: 8px; width: 100%; margin-top: 40px; }
/* Every column as wide as a card plus its indent, and the root over the middle of the cards – so an odd middle connector runs straight down */
.ui-agt__level > .ui-agt__hang { flex: none; width: calc(var(--tc-agent-tree-card-w) + var(--tc-agent-tree-indent)); }
.ui-agt[data-wide] .ui-agt__root:has(+ .ui-agt__level) { margin-right: var(--tc-agent-tree-indent); }
.ui-agt__hang { display: grid; align-content: start; gap: 12px; }
.ui-agt__below { display: grid; gap: 12px; padding-left: var(--tc-agent-tree-indent); }
.ui-agt:not([data-wide]) .ui-agt__tree { justify-items: stretch; }
.ui-agt:not([data-wide]) .ui-agt__tree { container-type: inline-size; }
/* Every card is as wide as the others: a fixed width side by side, and room for the deepest level when indented */
.ui-agt__node { width: var(--tc-agent-tree-card-w); }
.ui-agt:not([data-wide]) .ui-agt__node { width: calc(100cqw - var(--tc-agent-tree-depth, 0) * var(--tc-agent-tree-indent)); }
.ui-agt:not([data-wide]) .ui-agt__level { display: grid; gap: 12px; margin-top: 12px; padding-left: var(--tc-agent-tree-indent); }
/* Narrow: the first level is a plain indented list – no fixed column width, no centering */
.ui-agt:not([data-wide]) .ui-agt__level { justify-content: stretch; }
.ui-agt:not([data-wide]) .ui-agt__level > .ui-agt__hang { width: auto; }
/* One agent: the gray tray with a white card on it, like every component of the library */
:where([data-look="standard"], [data-look="standard"] *).ui-agt__node { position: relative; display: grid; padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-agent-tree-tray-bg); animation: ui-agt-rise var(--tc-duration-slow) var(--tc-ease-move) both; transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__card { display: grid; gap: 6px; min-width: 0; padding: 9px 10px 10px 10px; border-radius: var(--tc-card-radius); background: var(--tc-agent-tree-card-bg); box-shadow: var(--tc-card-shadow); transition: box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
/* Leaving: the card fades and sinks a little, its connector pulls back into the parent */
.ui-agt__node[data-leaving] { animation: ui-agt-leave var(--tc-duration-moderate) var(--tc-ease-move) forwards; pointer-events: none; }
.ui-agt__links [data-leaving] .ui-agt__link { stroke-dasharray: 1 1; stroke-dashoffset: 0; animation: ui-agt-retract var(--tc-duration-moderate) var(--tc-ease-move) forwards; }
/* One agent: a small white card */
:where([data-look="clean"], [data-look="clean"] *).ui-agt__node { position: relative; display: grid; gap: 6px; padding: 10px 10px 8px; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); animation: ui-agt-rise var(--tc-duration-slow) var(--tc-ease-move) both; transition: box-shadow var(--tc-duration-base) var(--tc-ease-standard), opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-agt__dot[data-leaving] { animation: ui-agt-fade var(--tc-duration-moderate) var(--tc-ease-standard) forwards; }
.ui-agt__node[data-clickable] { cursor: pointer; }
/* The name is the card's keyboard target; the ring goes round the whole card */
.ui-agt__select { display: block; justify-self: start; min-width: 0; max-width: 100%; }
.ui-agt .ui-agt__select:focus-visible { outline: none; }
.ui-agt__node:has(.ui-agt__select:focus-visible) { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__node[data-clickable]:hover .ui-agt__card { box-shadow: var(--tc-card-shadow-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__node[data-clickable]:hover { box-shadow: var(--tc-card-shadow-hover); }
/* Queued and stopped agents step back – the marks fade, the text stays readable */
.ui-agt__node:is([data-status="queued"], [data-status="stopped"]) :is(.ui-agt__avatar, .ui-agt__tools) { opacity: 0.6; }
.ui-agt__top { display: flex; align-items: center; gap: 8px; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__avatar { display: grid; flex: none; place-items: center; width: var(--tc-avatar-md); height: var(--tc-avatar-md); border-radius: var(--tc-radius-md); background: var(--tc-agent-tree-card-bg); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__avatar[data-logo] > svg { width: 14px; height: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__avatar { display: grid; flex: none; place-items: center; width: 22px; height: 22px; border-radius: var(--tc-radius-sm); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__avatar[data-logo] > svg { width: 13px; height: 13px; }
.ui-agt__who { display: grid; flex: 1; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__name { overflow: hidden; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__name { overflow: hidden; font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-strong); white-space: nowrap; text-overflow: ellipsis; }
/* The tools: small white tiles, each slightly over the one before */
.ui-agt__tools { display: inline-flex; margin-right: 6px; vertical-align: top; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__tool { display: grid; flex: none; place-items: center; width: 17px; height: 17px; border-radius: var(--tc-radius-xs); background: var(--tc-agent-tree-card-bg); box-shadow: var(--tc-shadow-raised); }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__tool + .ui-agt__tool { margin-left: -5px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__tool { display: grid; flex: none; place-items: center; width: 16px; height: 16px; border-radius: var(--tc-radius-xs); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__tool + .ui-agt__tool { margin-left: -4px; }
.ui-agt__tool > svg { width: 10px; height: 10px; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__model { overflow: hidden; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__model { overflow: hidden; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
/* Status: an icon and the word on a subtle tone – the pill recipe */
.ui-agt__status { display: inline-flex; flex: none; align-self: start; align-items: center; gap: 3px; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px) 0 calc(var(--tc-pill-px) - 2px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__status { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__status { color: var(--tc-text-secondary); }
.ui-agt__status[data-status="running"] { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
.ui-agt__spin { animation: ui-agt-spin var(--tc-duration-reveal-slow) linear infinite; }
.ui-agt__status[data-status="waiting"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-agt__status[data-status="done"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-agt__status[data-status="failed"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
/* A little room around the text, so the tiles' hairline and shadow aren't clipped by the line clamp */
:where([data-look="standard"], [data-look="standard"] *).ui-agt__task { display: -webkit-box; overflow: hidden; margin: -2px -2px -3px !important; padding: 2px 2px 3px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__meta { display: flex; align-items: center; gap: 6px; min-height: 30px; padding: 0 4px 0 8px; }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__cost { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__task { display: -webkit-box; overflow: hidden; margin: -2px -2px -3px !important; padding: 2px 2px 3px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__meta { display: flex; align-items: center; gap: 6px; min-height: 20px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__cost { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
/* Costs that still climb: a light shine runs over the amount a few times, then rests (off screen it pauses) */
.ui-agt__amount[data-live] {
  background: linear-gradient(90deg, currentColor 0%, currentColor 38%, var(--tc-agent-tree-shine) 50%, currentColor 62%, currentColor 100%) 0 0 / 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ui-agt-shine var(--tc-duration-shimmer) linear 3;
}
.ui-agt__tree[data-offscreen] * { animation-play-state: paused !important; }
.ui-agt__time { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__fold { display: inline-flex; flex: none; align-items: center; gap: 2px; height: 24px; margin-right: -2px; padding: 0 4px 0 6px; border-radius: var(--tc-radius-badge); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-agt__fold:hover { background: var(--tc-agent-tree-fold-hover-bg); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__fold { display: inline-flex; flex: none; align-items: center; gap: 2px; height: 20px; padding: 0 4px 0 6px; border-radius: var(--tc-radius-badge); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__fold:hover { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-agt__fold > svg { transition: transform var(--tc-duration-base) var(--tc-ease-move); }
.ui-agt__fold[aria-expanded="false"] > svg { transform: rotate(-90deg); }
@keyframes ui-agt-shine { from { background-position: 100% 0; } to { background-position: 0 0; } }
@keyframes ui-agt-draw { to { stroke-dashoffset: 0; } }
@keyframes ui-agt-retract { to { stroke-dashoffset: 1; } }
@keyframes ui-agt-leave { to { opacity: 0; transform: translateY(4px) scale(0.97); } }
@keyframes ui-agt-fade { to { opacity: 0; } }
@keyframes ui-agt-rise { from { opacity: 0; transform: translateY(6px) scale(0.98); } }
@keyframes ui-agt-spin { to { transform: rotate(360deg); } }
@keyframes ui-agt-pop { from { opacity: 0; transform: translateY(-4px) scale(0.98); } }
@media (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-agt__fold { height: 32px; padding: 0 10px 0 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-agt__fold { height: 32px; padding: 0 8px 0 10px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-agt *, .ui-agt *::before, .ui-agt *::after { animation: none !important; transition: none !important; }
}
`;
