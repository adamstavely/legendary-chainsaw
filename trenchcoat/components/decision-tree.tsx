"use client";

/*
 * Decision Tree – an agent that is stuck on a decision lays it out as a tree, in a single self-contained file.
 * A white card on a soft gray tray, a quiet bar on top: how many decisions wait and where you are.
 *   · on the left the question, with the agent, its model and how risky the call is
 *   · from it the options as branches, each with what it leads to – the agent's own pick marked
 *   · risky consequences are marked – point at one (or press F) for the agent's note and its source
 *   · a branch can lead to a follow-up question with its own options – the whole tree shows at once, the follow-ups
 *     quiet until it's their turn; the agent's pick runs through both levels as one route
 *   · options carry the logo of the tool they run with, consequences the logos of the systems they touch
 *   · point at a branch and its path lights up while the others step back; pick one (click or 1–4) and the
 *     others fade – a follow-up wakes up and is picked the same way – the path draws on to its outcome, and the
 *     next decision grows in
 *   · "Other…" opens a field that grows with what you write – your own instruction, Enter sends it
 * Narrow containers draw the tree top to bottom. The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: decision-tree.tsx is Standard,
 * decision-tree-clean.tsx is Clean). Clean is one quiet white card with hairlines: the risk tag sits above the agent
 * instead of beside its name, and the answer to your own "Other…" instruction appears beside it rather than under it.
 * Follow-up questions, option icons and app logos work in both looks.
 */
// Generated from src/components/decision-tree.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState, type CSSProperties, type ComponentPropsWithoutRef, type Dispatch, type KeyboardEvent, type ReactNode, type Ref, type RefObject, type SetStateAction } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-dct";

export type DecisionRisk = "high" | "medium" | "low";

/** A part of a consequence the agent isn't sure about – marked, its note shows on hover */
export type DecisionFlag = { text: string; note: string; source?: string };
/** Plain text, or text with flagged parts in it */
export type DecisionText = string | (string | DecisionFlag)[];

export type DecisionOption = {
  /** What to do, in a few words – e.g. "Roll back to #481" */
  label: string;
  /** The tool it runs with – a small logo before the label, e.g. the Vercel mark */
  icon?: ReactNode;
  /** What it leads to, one line each – e.g. "Refunds $147 · not reversible" */
  effects?: DecisionText[];
  /** The systems it touches – small logos beside its consequences */
  apps?: ReactNode[];
  /** The agent's own preference – marked "Agent's pick" */
  pick?: boolean;
  /** A follow-up question this branch leads to – picked right after it. One level deep: its options end the path */
  next?: DecisionStep;
};

/** A follow-up question with two to four options */
export type DecisionStep = { question: string; options: DecisionOption[] };

export type Decision = {
  id: string;
  /** The question, in one sentence – e.g. "3 customers have two subscriptions – how should I proceed?" */
  question: string;
  /** A line of context under it */
  context?: string;
  /** Who asks, e.g. "Billing agent" */
  agent: string;
  /** The model behind the agent – shown under its name */
  model?: string;
  /** A small mark, e.g. the model maker's logo – defaults to the agent's initial */
  icon?: ReactNode;
  /** High and medium show as a small tag next to the agent */
  risk?: DecisionRisk;
  /** Two to four options */
  options: DecisionOption[];
};

/** What you chose: one of the options, or your own instruction */
export type DecisionChoice = { index: number; option: DecisionOption; then?: { index: number; option: DecisionOption } } | { other: string };

/** Drive it from outside – e.g. your own shortcuts, or a demo */
export type DecisionTreeHandle = {
  /** Lights up the n-th branch (or, after a pick, the n-th option of its follow-up) as if pointed at – null lets go */
  hover: (index: number | null) => void;
  /** Picks the n-th option – or, after a pick, the n-th option of its follow-up; the index after the last option opens "Other…" */
  choose: (index: number) => void;
  /** Fills the "Other…" field */
  setOther: (text: string) => void;
  /** Sends the "Other…" field */
  send: () => void;
  next: () => void;
  previous: () => void;
  /** Shows the note of the n-th flagged part – null hides it */
  peek: (index: number | null) => void;
};

type DecisionTreeOwnProps = {
  /** Visual style. Defaults to the file's look: Standard in decision-tree.tsx, Clean in decision-tree-clean.tsx */
  look?: Look;
  /** Everything waiting for a call – decided ones leave on their own, new ids join at the end */
  decisions: Decision[];
  /** The id of the decision on show. Controlled when defined – pair it with `onDecisionChange` */
  decision?: string;
  /** The decision shown first when `decision` isn't controlled – defaults to the first one */
  defaultDecision?: string;
  /** Called with the id of the decision on show whenever it changes (paging, or the shown one was decided) */
  onDecisionChange?: (id: string) => void;
  /**
   * A branch was picked or an instruction written – return the agent's short answer to an instruction (or a promise
   * of it). A promise holds the picked path until it settles; a rejection lets go of the pick and says so, to try again
   */
  onChoose?: (decision: Decision, choice: DecisionChoice) => string | void | Promise<string | void>;
  /** Shows the "Other…" branch (default true) */
  allowOther?: boolean;
  title?: string;
  /** The imperative handle (the root element isn't exposed) */
  ref?: Ref<DecisionTreeHandle>;
  className?: string;
};

export type DecisionTreeProps = Omit<ComponentPropsWithoutRef<"div">, keyof DecisionTreeOwnProps> & DecisionTreeOwnProps;

/* ---------- Helpers ---------- */

const RISK: Record<DecisionRisk, string> = { high: "High risk", medium: "Medium risk", low: "Low risk" };
/** Motion: how long the picked path shows its outcome, and how long the tree takes to fade */
const HOLD = 1500;
const ANSWER_HOLD = 2600;
const FADE = 280;
const partsOf = (t?: DecisionText): (string | DecisionFlag)[] => (t === undefined ? [] : typeof t === "string" ? [t] : t);

type Link = { id: string; d: string; b: number; s?: number; kind: "branch" | "leaf" | "sub" | "out" };
/** `j` is the pick in the follow-up – a branch with a follow-up waits for it */
type Picked = { id: string; i: number; j?: number; other?: string; answer?: string; leaving?: boolean };
/** Every consequence in the order it shows – the flagged parts are numbered in this order */
const effectsOf = (d: Decision) => d.options.flatMap((o) => (o.next ? o.next.options.flatMap((s) => s.effects ?? []) : (o.effects ?? [])));

/* ---------- Icons ---------- */

/* check, triangle-alert and badge-check: Lucide (ISC, lucide.dev) */
const Tick = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const Alert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
    <path d="M12 9v4" strokeWidth="2" />
    <path d="M12 17h.01" strokeWidth="2.4" />
  </svg>
);
/* A small branching mark for the title (drawn for Trenchcoat) */
const Branches = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="3.5" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="12.5" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="12.5" cy="12.5" r="2" stroke="currentColor" strokeWidth="1.4" />
    <path d="M5.5 8H7.5C8.3 8 8.5 7.6 8.5 6.8V5C8.5 4 9 3.5 10 3.5H10.5M8.5 8.2V11C8.5 12 9 12.5 10 12.5H10.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
  </svg>
);
const Badge = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z" />
    <path d="m16 9-5.5 5.5L8 12" />
  </svg>
);

/* ---------- Layout ---------- */

type Els = { current: Map<string, HTMLElement> };

/** Narrow containers draw the tree top to bottom */
function useNarrow(rootRef: { current: HTMLElement | null }) {
  const [narrow, setNarrow] = useState(false);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver(() => setNarrow(root.clientWidth < 640));
    ro.observe(root);
    return () => ro.disconnect();
  }, [rootRef]);
  return narrow;
}

/**
 * The lines: question to branches, branches to consequences, the pick to its outcome. Measured when the tree changes
 * (another decision, a pick, "Other…" opening, the layout flipping) and whenever a card changes size – a
 * ResizeObserver per tree, not a measurement after every render.
 */
function useTreeLinks({
  treeRef,
  els,
  current,
  picked,
  narrow,
  clean,
  allowOther,
  otherOpen,
}: {
  treeRef: { current: HTMLDivElement | null };
  els: Els;
  current?: Decision;
  picked: Picked | null;
  narrow: boolean;
  clean: boolean;
  allowOther: boolean;
  otherOpen: boolean;
}) {
  const [links, setLinks] = useState<Link[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const box = treeRef.current;
    if (!box || !current) return;
    const measure = () => {
      // Offsets up to the page, minus the box's own – they ignore transforms, so the lines land where the cards settle
      const page = (el: HTMLElement) => {
        let l = 0;
        let t = 0;
        for (let e: HTMLElement | null = el; e; e = e.offsetParent as HTMLElement | null) {
          l += e.offsetLeft;
          t += e.offsetTop;
        }
        return { l, t };
      };
      const origin = page(box);
      const R = (k: string) => {
        const el = els.current.get(k);
        // Folded away (narrow: a follow-up that isn't its turn yet) – no line to it. Standard checks only the
        // follow-up's own cards
        if (!el || ((clean || k.startsWith("s")) && !el.offsetParent)) return null;
        const p = page(el);
        const l = p.l - origin.l;
        const t = p.t - origin.t;
        return { l, t, r: l + el.offsetWidth, b: t + el.offsetHeight, h: el.offsetHeight };
      };
      const C = 8;
      // Wide: out of the right edge, a right-angled turn with small rounded corners, into the left edge
      const across = (x1: number, y1: number, x2: number, y2: number) => {
        const dy = y2 - y1;
        if (Math.abs(dy) < 2) return `M${x1} ${y1}H${x2}`;
        const mid = Math.round(x1 + (x2 - x1) / 2);
        const r = Math.min(C, Math.abs(dy) / 2, (x2 - x1) / 2);
        const sg = Math.sign(dy);
        return `M${x1} ${y1}H${mid - r}Q${mid} ${y1} ${mid} ${y1 + sg * r}V${y2 - sg * r}Q${mid} ${y2} ${mid + r} ${y2}H${x2}`;
      };
      // Narrow: down a rail on the left, a rounded corner, into the card's side
      const hang = (x1: number, y1: number, x2: number, y2: number) => {
        if (x2 - x1 < 2) return `M${x1} ${y1}V${y2}`;
        const r = Math.min(C, (y2 - y1) / 2, (x2 - x1) / 2);
        return `M${x1} ${y1}V${y2 - r}Q${x1} ${y2} ${x1 + r} ${y2}H${x2}`;
      };
      const root = R("root");
      if (!root) return;
      const next: Link[] = [];
      const n = current.options.length + (allowOther ? 1 : 0);
      for (let i = 0; i < n; i++) {
        const o = R(`opt:${i}`);
        if (!o) continue;
        // "Other…" is met at its first line, so it can grow downwards without dragging its line along
        const isOther = i === current.options.length;
        const oc = isOther ? o.t + 18 : o.t + o.h / 2;
        next.push({ id: `b${i}`, b: i, kind: "branch", d: narrow ? hang(root.l + 18, root.b, o.l, o.t + Math.min(18, o.h / 2)) : across(root.r, root.t + root.h / 2, o.l, oc) });
        const lf = R(`leaf:${i}`) ?? R(`subq:${i}`);
        if (lf) next.push({ id: `l${i}`, b: i, kind: "leaf", d: narrow ? hang(o.l + 16, o.b, lf.l, lf.t + Math.min(14, lf.h / 2)) : across(o.r, o.t + o.h / 2, lf.l, lf.t + lf.h / 2) });
        // A follow-up: its options hang off a rail under its question
        const sq = R(`subq:${i}`);
        const subs = current.options[i]?.next?.options ?? [];
        if (sq)
          subs.forEach((_, j) => {
            const so = R(`sopt:${i}:${j}`);
            if (so) next.push({ id: `s${i}-${j}`, b: i, s: j, kind: "sub", d: hang(sq.l + 14, sq.b, so.l, so.t + Math.min(16, so.h / 2)) });
          });
      }
      // The outcome hangs under the picked branch's last card
      const outEl = els.current.get("out");
      if (outEl && picked) {
        const from = (picked.j !== undefined ? R(`sopt:${picked.i}:${picked.j}`) : null) ?? R(`leaf:${picked.i}`) ?? R(`opt:${picked.i}`);
        if (from && picked.other !== undefined && !narrow && clean) {
          // Clean: your own instruction sits in the last row – its answer goes beside it, where the column is free
          outEl.style.left = `${from.r + 24}px`;
          outEl.style.top = `${from.t}px`;
          const oc = R("out")!;
          next.push({ id: "o", b: picked.i, kind: "out", d: across(from.r, from.t + 18, oc.l, oc.t + 18) });
        } else if (from) {
          outEl.style.left = `${from.l + 24}px`;
          outEl.style.top = `${from.b + 14}px`;
          const oc = R("out")!;
          next.push({ id: "o", b: picked.i, kind: "out", d: hang(from.l + 12, from.b, oc.l, oc.t + Math.min(16, oc.h / 2)) });
        }
      }
      const key = JSON.stringify(next);
      setLinks((prev) => (JSON.stringify(prev) === key ? prev : next));
      setSize((sz) => (sz.w === box.scrollWidth && sz.h === box.scrollHeight ? sz : { w: box.scrollWidth, h: box.scrollHeight }));
    };
    measure();
    // Every frame of a card's growth reports a new size – the lines follow it
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    for (const el of els.current.values()) ro.observe(el);
    return () => ro.disconnect();
  }, [treeRef, els, current, picked, narrow, clean, allowOther, otherOpen]);
  return { links, size };
}

/** "Other…": two lines when it opens, it grows to three, then it scrolls – measured when its text or width changes */
function useGrowingField(
  growRef: { current: HTMLDivElement | null },
  mirrorRef: { current: HTMLSpanElement | null },
  otherRef: { current: HTMLTextAreaElement | null },
  text: string,
  layout: unknown,
) {
  useLayoutEffect(() => {
    const box = growRef.current;
    const m = mirrorRef.current;
    const ta = otherRef.current;
    if (!box || !m || !ta) return;
    const line = 20;
    const pad = 12;
    // One read (the mirror sits outside the box's flow, so its height doesn't follow the box), then the writes
    const mh = m.offsetHeight;
    const h = Math.min(Math.max(mh, 2 * line + pad), 3 * line + pad);
    // It starts at one line, so opening is the first glide down to two
    if (!box.style.height) box.style.height = `${line + pad}px`;
    requestAnimationFrame(() => {
      box.style.height = `${h}px`;
    });
    const over = mh > 3 * line + pad;
    ta.style.overflowY = over ? "auto" : "hidden";
    if (over) ta.scrollTop = ta.scrollHeight;
  }, [growRef, mirrorRef, otherRef, text, layout]);
}

/** The agent's note on a flagged part: below it, above only when there's no room under it */
function useFlagTip(tipRef: { current: HTMLDivElement | null }, bodyRef: { current: HTMLDivElement | null }, flagEls: { current: Map<number, HTMLElement> }, tipIndex: number | null, layout: unknown) {
  useLayoutEffect(() => {
    const tip = tipRef.current;
    const body = bodyRef.current;
    const el = tipIndex !== null ? flagEls.current.get(tipIndex) : undefined;
    if (!tip || !body || !el) return;
    const b = body.getBoundingClientRect();
    const scale = body.offsetWidth ? b.width / body.offsetWidth : 1;
    const lines = el.getClientRects();
    const r = lines[0] ?? el.getBoundingClientRect();
    const rEnd = lines[lines.length - 1] ?? r;
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    const top = (r.top - b.top) / scale;
    const bottom = (rEnd.bottom - b.top) / scale;
    const center = (r.left + r.width / 2 - b.left) / scale;
    // Below the part by default – above only when there's no room under it
    const above = bottom + 8 + h > body.offsetHeight - 4 && top - h - 8 >= 4;
    const left = Math.max(10, Math.min(center - w / 2, body.offsetWidth - w - 10));
    tip.style.top = `${above ? top - h - 8 : bottom + 8}px`;
    tip.style.left = `${left}px`;
    tip.style.setProperty("--x", `${center - left}px`);
    tip.dataset.side = above ? "above" : "below";
  }, [tipRef, bodyRef, flagEls, tipIndex, layout]);
}

/* ---------- The tree of one decision ---------- */

type TreeProps = {
  d: Decision;
  clean: boolean;
  allowOther: boolean;
  picked: Picked | null;
  hover: number | null;
  setHover: Dispatch<SetStateAction<number | null>>;
  otherOpen: boolean;
  setOtherOpen: (open: boolean) => void;
  other: string;
  setOther: (text: string) => void;
  pressed: string | null;
  failed: boolean;
  failId: string;
  links: Link[];
  size: { w: number; h: number };
  tipIndex: number | null;
  /** Notes show until the path is complete */
  open: boolean;
  flagEnter: (i: number) => void;
  flagLeave: (i: number) => void;
  uid: string;
  choose: (i: number) => void;
  send: () => void;
  tref: (k: string) => (el: HTMLElement | null) => void;
  flagEls: { current: Map<number, HTMLElement> };
  treeRef: { current: HTMLDivElement | null };
  growRef: { current: HTMLDivElement | null };
  mirrorRef: { current: HTMLSpanElement | null };
  otherRef: { current: HTMLTextAreaElement | null };
  rootRef: { current: HTMLDivElement | null };
};

function Tree(props: TreeProps) {
  const { d, clean, allowOther, picked, hover, setHover, otherOpen, setOtherOpen, other, setOther, pressed, failed, failId, links, size, tipIndex, open } = props;
  const { flagEnter, flagLeave, uid, choose, send, tref, flagEls, treeRef, growRef, mirrorRef, otherRef, rootRef } = props;
  const counter = { n: 0 };
  const text = (t: DecisionText) =>
    partsOf(t).map((p, k) => {
      if (typeof p === "string") return <span key={k}>{p}</span>;
      const i = counter.n++;
      const on = tipIndex === i && open;
      // Not a tab stop (it can sit inside an option button): the note travels with the text for screen readers,
      // F shows it for the keyboard and pointing at the part shows it for the pointer
      return (
        <span key={k}>
          <mark
            ref={(el) => {
              if (el) flagEls.current.set(i, el);
              else flagEls.current.delete(i);
            }}
            className="ui-dct__flag"
            data-on={on ? "" : undefined}
            onMouseEnter={() => flagEnter(i)}
            onMouseLeave={() => flagLeave(i)}
          >
            {p.text}
          </mark>
          <span className="ui-dct__sr">
            {` (the agent is unsure: ${p.note}${p.source ? ` Source: ${p.source}` : ""})`}
          </span>
        </span>
      );
    });

  const p = picked?.id === d.id ? picked : null;
  const otherIndex = d.options.length;
  const dim = (i: number) => (p ? p.i !== i : hover !== null && hover !== i);
  const hot = (i: number) => (p ? p.i === i : hover === i);
  // The follow-up of the picked branch: its options answer to the pointer, the keys and the pick
  const live = (i: number) => !!p && p.i === i && p.other === undefined;
  const sdim = (i: number, j: number) => live(i) && (p!.j !== undefined ? p!.j !== j : hover !== null && hover !== j);
  const shot = (i: number, j: number) => live(i) && (p!.j !== undefined ? p!.j === j : hover === j);
  const asking = !!p && p.other === undefined && p.j === undefined && !!d.options[p.i]?.next;
  const final = !!p && !asking;
  const apps = (list?: ReactNode[]) =>
    !!list?.length && (
      <span className="ui-dct__apps" aria-hidden="true">
        {list.map((a, k) => (
          <span key={k} className="ui-dct__app">
            {a}
          </span>
        ))}
      </span>
    );
  const effects = (list?: DecisionText[]) =>
    (list ?? []).map((e, k) => (
      <span key={k} className="ui-dct__effect">
        {text(e)}
      </span>
    ));
  const label = (o: DecisionOption) => (
    <span className="ui-dct__label">
      {o.icon && (
        <span className="ui-dct__icon" aria-hidden="true">
          {o.icon}
        </span>
      )}
      {o.label}
    </span>
  );
  const risk = d.risk && d.risk !== "low" && (
    <span className="ui-dct__risk" data-risk={d.risk}>
      {RISK[d.risk]}
    </span>
  );
  const row = (i: number, content: ReactNode, leaf?: ReactNode) => (
    <div key={i} className="ui-dct__row" data-dim={dim(i) ? "" : undefined} style={{ "--i": i } as CSSProperties} onMouseEnter={() => !p && setHover(i)} onMouseLeave={() => !p && !otherOpen && setHover(null)}>
      {content}
      {leaf}
    </div>
  );
  return (
    <div ref={treeRef} className="ui-dct__tree" data-picked={p ? "" : undefined} data-final={final ? "" : undefined} data-leaving={p?.leaving ? "" : undefined}>
      <svg className="ui-dct__links" width={size.w} height={size.h} aria-hidden="true">
        {links.map((l) => {
          const o = d.options[l.b];
          const sub = l.s !== undefined ? o?.next?.options[l.s] : undefined;
          const pick = l.s !== undefined ? o?.pick && sub?.pick : o?.pick;
          return (
            <path
              key={l.id}
              pathLength={1}
              d={l.d}
              className="ui-dct__link"
              data-kind={l.kind}
              data-pick={pick ? "" : undefined}
              data-hot={(l.s !== undefined ? shot(l.b, l.s) : hot(l.b)) ? "" : undefined}
              data-dim={dim(l.b) ? "" : undefined}
              data-soft={l.s !== undefined && sdim(l.b, l.s) ? "" : undefined}
              data-live={l.s !== undefined && live(l.b) ? "" : undefined}
              style={{ "--i": l.b, "--j": l.s ?? 0 } as CSSProperties}
            />
          );
        })}
      </svg>
      <div ref={tref("root")} className="ui-dct__root">
        {/* The risk tag: above the agent in Clean, beside its name in Standard */}
        {clean && risk}
        <div className="ui-dct__who">
          <span className="ui-dct__avatar" aria-hidden="true">
            {d.icon ?? d.agent.slice(0, 1)}
          </span>
          <span className="ui-dct__meta">
            {clean ? (
              <span className="ui-dct__agent">{d.agent}</span>
            ) : (
              <span className="ui-dct__name">
                <span className="ui-dct__agent">{d.agent}</span>
                {risk}
              </span>
            )}
            {d.model && <span className="ui-dct__model">{d.model}</span>}
          </span>
        </div>
        <h3 className="ui-dct__q">{d.question}</h3>
        {d.context && <p className="ui-dct__context">{d.context}</p>}
      </div>
      <div className="ui-dct__branches" role="group" aria-label="How should the agent go on?">
        {d.options.map((o, i) =>
          row(
            i,
            <button
              ref={tref(`opt:${i}`)}
              type="button"
              className="ui-dct__opt"
              data-pick={o.pick ? "" : undefined}
              data-hot={hot(i) ? "" : undefined}
              data-pressed={pressed === `opt:${i}` ? "" : undefined}
              disabled={!!p}
              aria-keyshortcuts={String(i + 1)}
              aria-describedby={o.next ? `${uid}-subq-${i}` : o.effects?.length ? `${uid}-leaf-${i}` : undefined}
              onClick={() => choose(i)}
            >
              <kbd className="ui-dct__kbd" aria-hidden="true">
                {i + 1}
              </kbd>
              {label(o)}
              {o.pick && <span className="ui-dct__pick">Agent's pick</span>}
            </button>,
            o.next ? (
              // The follow-up: its question, its options hanging off a rail – quiet until this branch is picked
              <div className="ui-dct__sub" data-live={live(i) ? "" : undefined} data-asking={live(i) && asking ? "" : undefined}>
                <div ref={tref(`subq:${i}`)} id={`${uid}-subq-${i}`} className="ui-dct__subq">
                  {o.next.question}
                  {/* Narrow containers fold the options away until this branch is picked – this says what's inside */}
                  <span className="ui-dct__more">{o.next.options.length} options</span>
                </div>
                <div className="ui-dct__subopts" role="group" aria-label={o.next.question}>
                  {o.next.options.map((so, j) => (
                    <button
                      key={j}
                      ref={tref(`sopt:${i}:${j}`)}
                      type="button"
                      className="ui-dct__sopt"
                      data-pick={o.pick && so.pick ? "" : undefined}
                      data-hot={shot(i, j) ? "" : undefined}
                      data-soft={sdim(i, j) ? "" : undefined}
                      data-pressed={pressed === `sopt:${i}:${j}` ? "" : undefined}
                      style={{ "--j": j } as CSSProperties}
                      disabled={!(live(i) && asking)}
                      tabIndex={live(i) && asking ? undefined : -1}
                      aria-keyshortcuts={live(i) && asking ? String(j + 1) : undefined}
                      aria-labelledby={`${uid}-sopt-${i}-${j}`}
                      aria-describedby={so.effects?.length ? `${uid}-sfx-${i}-${j}` : undefined}
                      onMouseEnter={() => live(i) && asking && setHover(j)}
                      onMouseLeave={() => live(i) && asking && setHover(null)}
                      onClick={() => choose(j)}
                    >
                      <span className="ui-dct__sopt-top" id={`${uid}-sopt-${i}-${j}`}>
                        {live(i) && asking && (
                          <kbd className="ui-dct__kbd" aria-hidden="true">
                            {j + 1}
                          </kbd>
                        )}
                        {label(so)}
                        {o.pick && so.pick && <span className="ui-dct__pick">Agent's pick</span>}
                      </span>
                      {(!!so.effects?.length || !!so.apps?.length) && (
                        <span className="ui-dct__sopt-effects">
                          <span className="ui-dct__lines" id={`${uid}-sfx-${i}-${j}`}>
                            {effects(so.effects)}
                          </span>
                          {apps(so.apps)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              (!!o.effects?.length || !!o.apps?.length) && (
                <div ref={tref(`leaf:${i}`)} id={`${uid}-leaf-${i}`} className="ui-dct__leaf">
                  {/* Standard lists the lines straight in the card unless there are logos beside them */}
                  {clean || o.apps?.length ? (
                    <>
                      <span className="ui-dct__lines">{effects(o.effects)}</span>
                      {apps(o.apps)}
                    </>
                  ) : (
                    effects(o.effects)
                  )}
                </div>
              )
            ),
          ),
        )}
        {/* Other…: your own instruction, as a prompt for the agent */}
        {allowOther &&
          row(
            otherIndex,
            <div ref={tref(`opt:${otherIndex}`)} className="ui-dct__opt" data-other="" data-open={otherOpen || p?.other ? "" : undefined} data-hot={hot(otherIndex) ? "" : undefined}>
              {p?.other ? (
                <span className="ui-dct__said">{p.other}</span>
              ) : otherOpen ? (
                <div ref={growRef} className="ui-dct__grow">
                  {/* The mirror measures the text, so the box can glide to its height */}
                  <span ref={mirrorRef} className="ui-dct__mirror" aria-hidden="true">
                    {other || "Tell the agent what to do instead…"}
                    {"​"}
                  </span>
                  <textarea
                    ref={otherRef}
                    className="ui-dct__input"
                    value={other}
                    rows={2}
                    placeholder="Tell the agent what to do instead…"
                    aria-label={`Your own instruction for the ${d.agent.toLowerCase()} – Enter sends, Shift+Enter for a new line`}
                    aria-invalid={failed || undefined}
                    aria-describedby={failed ? failId : undefined}
                    onChange={(e) => setOther(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.stopPropagation();
                        // The field unmounts: hold focus on the card until the "Other…" button is back
                        rescueFocus(e.currentTarget, [rootRef.current]);
                        setOtherOpen(false);
                        setHover(null);
                        // Back to the "Other…" button it opened from (the root if that's gone)
                        requestAnimationFrame(() => (rootRef.current?.querySelector<HTMLElement>(".ui-dct__other") ?? rootRef.current)?.focus({ preventScroll: true }));
                        return;
                      }
                      if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
                      e.preventDefault();
                      send();
                    }}
                  />
                </div>
              ) : (
                <button type="button" className="ui-dct__other" data-pressed={pressed === "other" ? "" : undefined} disabled={!!p} aria-keyshortcuts={String(otherIndex + 1)} onClick={() => choose(otherIndex)}>
                  <kbd className="ui-dct__kbd" aria-hidden="true">
                    {otherIndex + 1}
                  </kbd>
                  <span className="ui-dct__label">Other…</span>
                </button>
              )}
              {/* Announced through the status region below – shown here, next to the field */}
              {failed && !p && otherOpen && (
                <span id={failId} className="ui-dct__failed">
                  Couldn't send – press Enter to try again.
                </span>
              )}
            </div>,
          )}
      </div>
      {final && p && (
        <div ref={tref("out")} className="ui-dct__out" data-kind={p.other !== undefined ? "replied" : "approved"}>
          {p.other !== undefined ? (
            <>
              <span className="ui-dct__out-head">
                <Tick />
                Sent to the {d.agent.toLowerCase()}
              </span>
              {p.answer ? (
                <span className="ui-dct__answer">{p.answer}</span>
              ) : (
                <span className="ui-dct__typing" role="img" aria-label={`${d.agent} is typing`}>
                  <span />
                  <span />
                  <span />
                </span>
              )}
            </>
          ) : (
            <span className="ui-dct__out-head">
              <Tick />
              Approved <span className="ui-dct__running">· running</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Small parts ---------- */

/** Timers that end with the component, and whether it's still mounted (for promises that settle later) */
function useTimers() {
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    const all = timers.current;
    return () => {
      alive.current = false;
      all.forEach((t) => window.clearTimeout(t));
    };
  }, []);
  return { later, alive };
}

/** The quiet bar on top: how many decisions wait and where you are */
function Header({ title, list, index, decided, total, showPager, locked, move }: { title: string; list: Decision[]; index: number; decided: number; total: number; showPager: boolean; locked: boolean; move: (step: number) => void }) {
  return (
    <header className="ui-dct__head">
      <span className="ui-dct__mark">
        <Branches />
      </span>
      <span className="ui-dct__heading">{title}</span>
      <span className="ui-dct__count">{list.length ? `${list.length} waiting for you` : `${decided} of ${total} decided`}</span>
      {showPager && (
        <span className="ui-dct__pager">
          <span className="ui-dct__dots" aria-hidden="true">
            {list.slice(0, 8).map((x, k) => (
              <span key={x.id} data-on={k === index ? "" : undefined} />
            ))}
          </span>
          <span className="ui-dct__of">
            <span className="ui-dct__sr">Decision </span>
            {index + 1} of {list.length}
          </span>
          {/* Paging for the pointer and screen readers – the keys (← → / j k) do the same. While a pick runs they're
              aria-disabled rather than disabled, so a focused one keeps the focus */}
          <span className="ui-dct__nav">
            <button type="button" className="ui-dct__step" aria-label="Previous decision" aria-keyshortcuts="ArrowLeft K" aria-disabled={locked || undefined} onClick={() => !locked && move(-1)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button type="button" className="ui-dct__step" aria-label="Next decision" aria-keyshortcuts="ArrowRight J" aria-disabled={locked || undefined} onClick={() => !locked && move(1)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </span>
        </span>
      )}
    </header>
  );
}

/** The note of a flagged part */
function FlagTip({ flag, id, tipRef, onEnter, onLeave }: { flag: DecisionFlag; id: string; tipRef: { current: HTMLDivElement | null }; onEnter: () => void; onLeave: () => void }) {
  // The note is in the text for screen readers already (after each flagged part) – this is its visual twin. It stays
  // while the pointer moves onto it, and Escape closes it
  return (
    <div ref={tipRef} id={id} className="ui-dct__tip" aria-hidden="true" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <span className="ui-dct__tip-head">
        <Alert />
        Agent's note
      </span>
      <p>{flag.note}</p>
      {flag.source && <span className="ui-dct__tip-source">{flag.source}</span>}
    </div>
  );
}

/** The keys under the tree: what to press next, or that the last pick didn't go through */
function Hints({ waiting, picked, pickFailed, count, more }: { waiting?: DecisionStep; picked: boolean; pickFailed: boolean; count: number; more: boolean }) {
  return (
    <>
      {waiting && (
        <p className="ui-dct__hint" aria-hidden="true" key="then">
          Then <kbd className="ui-dct__kbd">1</kbd>–<kbd className="ui-dct__kbd">{waiting.options.length}</kbd>
        </p>
      )}
      {!picked && pickFailed && (
        <p className="ui-dct__hint ui-dct__hint--failed" aria-hidden="true">
          Couldn't reach the agent – pick again.
        </p>
      )}
      {!picked && !pickFailed && (
        <p className="ui-dct__hint" aria-hidden="true">
          Pick a branch <kbd className="ui-dct__kbd">1</kbd>–<kbd className="ui-dct__kbd">{count}</kbd>
          {more && (
            <>
              <span>·</span> next <kbd className="ui-dct__kbd">→</kbd>
            </>
          )}
        </p>
      )}
    </>
  );
}

/* ---------- Component ---------- */

export function DecisionTree({
  look,
  decisions,
  decision: decisionProp,
  defaultDecision,
  onDecisionChange,
  onChoose,
  allowOther = true,
  title = "Decisions",
  ref,
  className,
  ...rest
}: DecisionTreeProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const clean = resolvedLook === "clean";
  const uid = useId();
  const tipId = `${uid}-tip`;
  const failId = `${useId()}-failed`;
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const otherRef = useRef<HTMLTextAreaElement>(null);
  const growRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLSpanElement>(null);
  const els = useRef(new Map<string, HTMLElement>());
  const flagEls = useRef(new Map<number, HTMLElement>());
  const { later, alive } = useTimers();
  const tref = (k: string) => (el: HTMLElement | null) => {
    if (el) els.current.set(k, el);
    else els.current.delete(k);
  };

  /* ---------- State ---------- */

  const [done, setDone] = useState<Record<string, true>>({});
  const [currentId, setCurrentId] = useControllable<string | null>(
    decisionProp,
    defaultDecision ?? null,
    onDecisionChange && ((id) => id !== null && onDecisionChange(id)),
    "decision",
  );
  const [hover, setHover] = useState<number | null>(null);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [otherOpen, setOtherOpen] = useState(false);
  const [other, setOther] = useState("");
  const [peek, setPeek] = useState<number | null>(null);
  const [hoverFlag, setHoverFlag] = useState<number | null>(null);
  const [pressed, setPressed] = useState<string | null>(null);
  const [said, setSaid] = useState("");
  // The last "Other…" instruction couldn't be sent – the field stays open with it, to try again
  const [failed, setFailed] = useState(false);
  // The last branch pick was rejected – the branches are open again
  const [pickFailed, setPickFailed] = useState(false);
  const narrow = useNarrow(rootRef);
  // The pointer is on the note itself – it stays open
  const onTip = useRef(false);

  const list = decisions.filter((d) => !done[d.id]);
  const lastIndex = useRef(0);
  const found = list.findIndex((d) => d.id === currentId);
  const index = found >= 0 ? found : Math.min(lastIndex.current, list.length - 1);
  const current = index >= 0 ? list[index] : undefined;
  const total = decisions.length;
  const decided = Object.keys(done).length;
  useLayoutEffect(() => {
    lastIndex.current = Math.max(0, index);
    if (current && current.id !== currentId) setCurrentId(current.id);
  });
  // A fresh decision starts clean
  useLayoutEffect(() => {
    setHover(null);
    setPicked(null);
    setOtherOpen(false);
    setOther("");
    setPeek(null);
    setHoverFlag(null);
    setFailed(false);
    setPickFailed(false);
  }, [current?.id]);

  /* ---------- Actions ---------- */

  const flash = (name: string) => {
    setPressed(name);
    later(() => setPressed((p) => (p === name ? null : p)), 220);
  };
  // The picked path holds a moment with its outcome, the tree fades, the next one grows in
  const finish = (d: Decision, hold: number) => {
    const fade = reducedMotion() ? 0 : FADE;
    later(() => setPicked((p) => (p && p.id === d.id ? { ...p, leaving: true } : p)), hold);
    later(() => {
      setDone((x) => ({ ...x, [d.id]: true }));
      const keep = rootRef.current?.contains(document.activeElement);
      if (keep) requestAnimationFrame(() => rootRef.current?.focus({ preventScroll: true }));
    }, hold + fade);
  };
  // A pick is passed on: a promise holds the path until it settles, a rejection lets go of the pick and says so
  const commit = (d: Decision, choice: DecisionChoice, label: string) => {
    setPickFailed(false);
    const failed = () => {
      if (!alive.current) return;
      setPicked((p) => (p && p.id === d.id && p.other === undefined ? null : p));
      setHover(null);
      setPickFailed(true);
      setSaid(`Couldn't pass “${label}” to the ${d.agent.toLowerCase()} – pick again.`);
    };
    let result: ReturnType<NonNullable<typeof onChoose>>;
    try {
      result = onChoose?.(d, choice);
    } catch {
      return failed();
    }
    if (result && typeof (result as Promise<unknown>).then === "function")
      (result as Promise<unknown>).then(() => alive.current && finish(d, HOLD), failed);
    else finish(d, HOLD);
  };
  // A branch with a follow-up is picked, its follow-up waits
  const waiting = current && picked?.id === current.id && picked.other === undefined && picked.j === undefined ? current.options[picked.i]?.next : undefined;
  const choose = (i: number) => {
    if (!current) return;
    const d = current;
    if (waiting && picked) {
      const s = waiting.options[i];
      if (!s) return;
      flash(`sopt:${picked.i}:${i}`);
      setHover(null);
      setPeek(null);
      setPicked({ ...picked, j: i });
      setSaid(`${s.label} – picked. ${d.agent} goes ahead.`);
      commit(d, { index: picked.i, option: d.options[picked.i], then: { index: i, option: s } }, s.label);
      return;
    }
    if (picked) return;
    if (allowOther && i === d.options.length) {
      flash("other");
      setOtherOpen(true);
      setHover(i);
      requestAnimationFrame(() => otherRef.current?.focus({ preventScroll: true }));
      return;
    }
    const o = d.options[i];
    if (!o) return;
    flash(`opt:${i}`);
    setHover(null);
    setPeek(null);
    setPickFailed(false);
    setPicked({ id: d.id, i });
    if (o.next) {
      setSaid(`${o.label} – picked. Next: ${o.next.question}`);
      return;
    }
    setSaid(`${o.label} – picked. ${d.agent} goes ahead.`);
    commit(d, { index: i, option: o }, o.label);
  };
  const send = () => {
    const text = other.trim();
    if (!current || !text || picked) return;
    const d = current;
    flash("send");
    setFailed(false);
    setPicked({ id: d.id, i: d.options.length, other: text });
    setSaid(`Sent to the ${d.agent.toLowerCase()}: ${text}`);
    // Called inside the promise chain, so a callback that throws is handled like one that rejects
    Promise.resolve()
      .then(() => onChoose?.(d, { other: text }))
      .then(
        (answer) => {
          later(() => {
            const reply = answer || "Got it – I'll take it from here.";
            setPicked((p) => (p && p.id === d.id ? { ...p, answer: reply } : p));
            setSaid(`${d.agent}: ${reply}`);
          }, 700);
          finish(d, ANSWER_HOLD);
        },
        () => {
          // Not sent: let go of the pick, keep the instruction in the open field and say so – the user can retry
          setPicked((p) => (p && p.id === d.id && p.other === text ? null : p));
          setOther(text);
          setOtherOpen(true);
          setFailed(true);
          setSaid(`Couldn't send to the ${d.agent.toLowerCase()}. Your instruction is still there – try again.`);
          requestAnimationFrame(() => otherRef.current?.focus({ preventScroll: true }));
        },
      );
  };
  const move = (step: number) => {
    if (list.length < 2 || !current || picked) return;
    setCurrentId(list[(index + step + list.length) % list.length].id);
  };
  // Pointing at a flagged part shows its note; leaving it closes the note unless the pointer moved onto the note
  const flagEnter = (i: number) => {
    onTip.current = false;
    setHoverFlag(i);
  };
  const flagLeave = (i: number) => later(() => !onTip.current && setHoverFlag((h) => (h === i ? null : h)), 150);
  const tipEnter = () => {
    onTip.current = true;
  };
  const tipLeave = () => {
    onTip.current = false;
    setHoverFlag(null);
  };
  const flags = current ? effectsOf(current).flatMap((e) => partsOf(e)).filter((p): p is DecisionFlag => typeof p !== "string") : [];
  const cycleFlag = () => flags.length && setPeek((p) => (p === null ? 0 : p + 1 >= flags.length ? null : p + 1));

  useImperativeHandle(ref, () => ({
    hover: (i: number | null) => (!picked || waiting) && setHover(i),
    choose,
    setOther: (text: string) => {
      if (!otherOpen) setOtherOpen(true);
      setOther(text);
    },
    send,
    next: () => move(1),
    previous: () => move(-1),
    peek: (i: number | null) => setPeek(i),
  }));

  /* ---------- Keyboard: numbers pick, arrows move, while the focus is anywhere inside ---------- */

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    rest.onKeyDown?.(e);
    if (e.defaultPrevented || e.nativeEvent.isComposing || !current) return;
    if ((e.target as HTMLElement).closest("textarea, input")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const run = (fn: () => void) => {
      e.preventDefault();
      fn();
    };
    const n = Number(e.key);
    const count = waiting ? waiting.options.length : current.options.length + (allowOther ? 1 : 0);
    if (n >= 1 && n <= count) return run(() => choose(n - 1));
    const keys: Record<string, () => void> = {
      arrowright: () => move(1),
      j: () => move(1),
      arrowleft: () => move(-1),
      k: () => move(-1),
      f: () => void cycleFlag(),
      escape: () => {
        if (peek !== null || hoverFlag !== null) {
          setPeek(null);
          setHoverFlag(null);
        } else setOtherOpen(false);
      },
    };
    const fn = keys[e.key.toLowerCase()];
    if (fn) run(fn);
  };

  /* ---------- Layout: the lines, the growing field, the note ---------- */

  const { links, size } = useTreeLinks({ treeRef, els, current, picked, narrow, clean, allowOther, otherOpen });
  useGrowingField(growRef, mirrorRef, otherRef, other, `${otherOpen}|${narrow}|${picked?.id}|${picked?.other}`);
  const tipIndex = hoverFlag ?? peek;
  // Notes show until the path is complete – also while a follow-up waits for its pick
  const open = !picked || !!waiting;
  const tipFlag = tipIndex !== null && open ? flags[tipIndex] : undefined;

  // A note opened by pointing closes with Escape wherever the focus is (WCAG 1.4.13)
  const hoverOpen = hoverFlag !== null;
  useEffect(() => {
    if (!hoverOpen) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setHoverFlag(null);
      setPeek(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hoverOpen]);

  // Focus never drops to <body>: a picked option is disabled while its follow-up opens – focus goes to the follow-up's
  // first option, otherwise to the card
  useFocusRescue(rootRef, {
    fallback: () => rootRef.current?.querySelector<HTMLElement>(".ui-dct__sub[data-asking] .ui-dct__sopt:not(:disabled)") ?? rootRef.current,
  });
  useFlagTip(tipRef, bodyRef, flagEls, tipIndex, `${tipFlag ? current?.id : ""}|${narrow}|${size.w}x${size.h}`);

  return (
    <div
      tabIndex={-1}
      {...rest}
      ref={rootRef}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={resolvedLook}
      onKeyDown={onKeyDown}
      onMouseDown={(e) => {
        rest.onMouseDown?.(e);
        // A click on plain content keeps the keys working
        if (!(e.target as HTMLElement).closest("button, a, input, textarea, mark")) requestAnimationFrame(() => rootRef.current?.focus({ preventScroll: true }));
      }}
    >
      <style href="ui-decision-tree" precedence="default">
        {css}
      </style>

      <Header title={title} list={list} index={index} decided={decided} total={total} showPager={!!current && list.length > 1} locked={!!picked} move={move} />

      <div ref={bodyRef} className="ui-dct__body" data-narrow={narrow ? "" : undefined}>
        {current ? (
          <Tree
            key={current.id}
            d={current}
            clean={clean}
            allowOther={allowOther}
            picked={picked}
            hover={hover}
            setHover={setHover}
            otherOpen={otherOpen}
            setOtherOpen={setOtherOpen}
            other={other}
            setOther={setOther}
            pressed={pressed}
            failed={failed}
            failId={failId}
            links={links}
            size={size}
            tipIndex={tipIndex}
            open={open}
            flagEnter={flagEnter}
            flagLeave={flagLeave}
            uid={uid}
            choose={choose}
            send={send}
            tref={tref}
            flagEls={flagEls}
            treeRef={treeRef}
            growRef={growRef}
            mirrorRef={mirrorRef}
            otherRef={otherRef}
            rootRef={rootRef}
          />
        ) : (
          <div className="ui-dct__empty">
            <span className="ui-dct__empty-mark">
              <Badge size={22} />
            </span>
            <b>All decided</b>
            <span>New decisions from your agents show up here.</span>
          </div>
        )}
        {tipFlag && <FlagTip key={tipIndex} flag={tipFlag} id={tipId} tipRef={tipRef} onEnter={tipEnter} onLeave={tipLeave} />}
        {current && <Hints waiting={waiting} picked={!!picked} pickFailed={pickFailed} count={current.options.length + (allowOther ? 1 : 0)} more={list.length > 1} />}
      </div>
      <div className="ui-dct__sr" aria-live="polite" aria-atomic="true">
        {said}
      </div>
    </div>
  );
}

/* ---------- Shared helpers (inlined from src/internal) ---------- */

const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

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

/** Connected, not inside something inert or hidden, not disabled */
const focusable = (el: Element | null | undefined): boolean =>
  !!el && el.isConnected && el instanceof HTMLElement && !el.closest("[inert],[hidden]") && !(el as HTMLButtonElement).disabled;

/**
 * Moves focus to the first usable target, but only if focus is inside `from` now (call it before removing, disabling
 * or inerting `from`). Targets may be elements, selectors (looked up inside `within`, default document) or functions.
 */
function rescueFocus(
  from: Element | null | undefined,
  targets: Array<Element | string | null | undefined | (() => Element | null | undefined)>,
  within: ParentNode = document,
) {
  const active = document.activeElement;
  if (!from || !active || !from.contains(active)) return false;
  for (const t of targets) {
    const el = typeof t === "function" ? t() : typeof t === "string" ? within.querySelector(t) : t;
    if (el !== active && focusable(el)) {
      (el as HTMLElement).focus({ preventScroll: true });
      return true;
    }
  }
  return false;
}

type Options = {
  /** Where focus goes when the control it was on is gone – gets that control's `data-focus-key` (if it had one) */
  fallback?: (key: string | null) => Element | null | undefined;
};

/**
 * Safety net for a component's root: when the focused element inside it is removed, disabled or made inert and
 * focus fell to <body>, focus moves (before paint) to
 *   1. an element with the same `data-focus-key` (the control was re-mounted, e.g. a card moved to another list),
 *   2. `fallback(key)`, e.g. the next row or the trigger,
 *   3. the root itself (made focusable with tabindex=-1 if it isn't).
 * Prefer moving focus explicitly with rescueFocus where the right target is known; this catches the rest.
 */
function useFocusRescue(root: RefObject<HTMLElement | null>, options: Options = {}) {
  const latest = useRef(options);
  latest.current = options;
  useEffect(() => {
    const el = root.current;
    if (!el || typeof MutationObserver !== "function") return;
    let last: HTMLElement | null = null;
    const onFocusIn = (e: FocusEvent) => {
      last = e.target instanceof HTMLElement ? e.target : null;
    };
    const check = () => {
      const prev = last;
      if (!prev || !el.isConnected) return;
      const gone = !focusable(prev);
      const active = document.activeElement;
      const lost = !active || active === document.body || active === prev;
      if (!lost || !gone) return;
      const key = prev.getAttribute("data-focus-key");
      const same = key ? [...el.querySelectorAll(`[data-focus-key="${CSS.escape(key)}"]`)].find((c) => c !== prev && focusable(c)) : null;
      const target = [same, latest.current.fallback?.(key)].find(focusable) as HTMLElement | undefined;
      last = null;
      if (target) target.focus({ preventScroll: true });
      else {
        if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
        el.focus({ preventScroll: true });
      }
    };
    const observer = new MutationObserver(check);
    observer.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ["disabled", "inert", "hidden"] });
    el.addEventListener("focusin", onFocusIn);
    return () => {
      observer.disconnect();
      el.removeEventListener("focusin", onFocusIn);
    };
  }, [root]);
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
.ui-dct:where([data-look="standard"]),
.ui-dct__portal:where([data-look="standard"]) {
  --_tc-accent-text: light-dark(#2456d6, #8ab4ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-action-ghost-fg: light-dark(#404040, #c8c8cc);
  --_tc-avatar-radius-agent: 6px;
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-border-strong: light-dark(#dedede, #3a3a40);
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-h-sm: 28px;
  --_tc-control-radius-sm: 8px;
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-eyebrow-font-size: 11px;
  --_tc-eyebrow-font-weight: 500;
  --_tc-eyebrow-line-height: 16px;
  --_tc-eyebrow-tracking: 0.04em;
  --_tc-eyebrow-transform: uppercase;
  --_tc-field-bg: light-dark(#ffffff, #232326);
  --_tc-field-shadow: inset 0 0 0 1px light-dark(#858585, #7c7c82), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-field-shadow-focus: inset 0 0 0 1px light-dark(#2f68ff, #6b95ff), 0 0 0 3px color-mix(in srgb, light-dark(#2f68ff, #6b95ff) 24%, transparent);
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xs: 11px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-font-weight-strong: 600;
  --_tc-hairline: 1px;
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
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-menu-radius: 12px;
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 20px;
  --_tc-pill-px: 8px;
  --_tc-pill-radius: 999px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-overlay: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-raised-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-10: 40px;
  --_tc-space-12: 48px;
  --_tc-space-14: 56px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-space-4-5: 18px;
  --_tc-space-5: 20px;
  --_tc-space-6: 24px;
  --_tc-space-7: 28px;
  --_tc-space-8: 32px;
  --_tc-status-danger-bg: light-dark(#fdecea, #3b1714);
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-bg: light-dark(#e6f6ec, #12301f);
  --_tc-status-success-border: color-mix(in srgb, light-dark(#1f8a4c, #3ec27a) 40%, transparent);
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-warning-bg: light-dark(#fff3e0, #3a2410);
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-surface-on-tray: light-dark(#ffffff, #232326);
  --_tc-surface-overlay: light-dark(#ffffff, #232326);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-tray: light-dark(#f0f0f0, #19191b);
  --_tc-text-disabled: light-dark(#a3a3a3, #5c5c63);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-placeholder: light-dark(#646464, #8e8e95);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
}
.ui-dct:where([data-look="clean"]),
.ui-dct__portal:where([data-look="clean"]) {
  --_tc-accent-text: light-dark(#0058cf, #70b8ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-action-ghost-fg: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-avatar-radius-agent: 6px;
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-border-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-h-sm: 24px;
  --_tc-control-radius-sm: 6px;
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-eyebrow-font-size: 10px;
  --_tc-eyebrow-font-weight: 500;
  --_tc-eyebrow-line-height: 16px;
  --_tc-eyebrow-tracking: 0.05em;
  --_tc-eyebrow-transform: uppercase;
  --_tc-field-bg: light-dark(#ffffff, #252527);
  --_tc-field-shadow: inset 0 0 0 1px light-dark(rgba(0, 0, 0, 0.48), rgba(255, 255, 255, 0.4));
  --_tc-field-shadow-focus: inset 0 0 0 1px light-dark(#0060e2, #5b9aff), 0 0 0 3px color-mix(in srgb, light-dark(#0060e2, #5b9aff) 24%, transparent);
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xs: 11px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-font-weight-strong: 500;
  --_tc-hairline: 0.5px;
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
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-menu-radius: 10px;
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 18px;
  --_tc-pill-px: 6px;
  --_tc-pill-radius: 5px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-overlay: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 12px 28px -10px light-dark(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.6)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-raised-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-10: 40px;
  --_tc-space-12: 48px;
  --_tc-space-14: 56px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-space-4-5: 18px;
  --_tc-space-5: 20px;
  --_tc-space-6: 24px;
  --_tc-space-7: 28px;
  --_tc-space-8: 32px;
  --_tc-status-danger-bg: light-dark(rgba(245, 43, 0, 0.094), rgba(255, 53, 35, 0.17));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-bg: light-dark(rgba(0, 164, 51, 0.1), rgba(0, 240, 74, 0.12));
  --_tc-status-success-border: color-mix(in srgb, light-dark(#1f8a4c, #3ec27a) 40%, transparent);
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-warning-bg: light-dark(rgba(255, 156, 0, 0.16), rgba(251, 106, 0, 0.15));
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-surface-on-tray: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-overlay: light-dark(#ffffff, #252527);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-tray: light-dark(#f7f7f7, #161618);
  --_tc-text-disabled: light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3));
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-placeholder: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.5));
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

/* Colors, sizes and motion as variables – override them on .ui-dct */
:where([data-look="standard"], [data-look="standard"] *).ui-dct {
  /* Lines: idle, the agent's pick, the path you point at or picked */
  --tc-decision-tree-link-pick: light-dark(#a9bff5, #36518f);
  --tc-decision-tree-link-pick-hot: light-dark(#7d9df0, #4d70c2);
  /* The agent's pick: a lift tinted blue, with a faint blue edge */
  --tc-decision-tree-option-shadow-picked: 0 0 0 1px light-dark(rgba(0, 96, 226, 0.2), rgba(91, 154, 255, 0.3)), 0 3px 8px -4px light-dark(rgba(0, 96, 226, 0.14), rgba(40, 100, 220, 0.24)), 0 1px 2px light-dark(rgba(0, 60, 140, 0.05), rgba(0, 0, 0, 0.3));
  --tc-decision-tree-option-shadow-picked-hover: 0 0 0 1px light-dark(rgba(0, 96, 226, 0.36), rgba(112, 170, 255, 0.5)), 0 8px 22px -6px light-dark(rgba(0, 96, 226, 0.34), rgba(60, 130, 255, 0.5)), 0 2px 4px -1px light-dark(rgba(0, 96, 226, 0.16), rgba(60, 130, 255, 0.25));
  --tc-decision-tree-link-hot: light-dark(#a3a3a3, #6a6a72);
  --tc-decision-tree-flag-bg: light-dark(#fff2d4, #3d2b0c);
  --tc-decision-tree-flag-edge: light-dark(#f0b44c, #a8741f);
  --tc-decision-tree-flag-hot: light-dark(#ffe2a6, #54390c);
  --tc-decision-tree-flag-ink: light-dark(#6e4300, #ffd28a);
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  background: var(--tc-surface-tray, var(--_tc-surface-tray));
  letter-spacing: -0.006em;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
}
/* Colors, sizes and motion as variables – override them on .ui-dct */
:where([data-look="clean"], [data-look="clean"] *).ui-dct {
  /* Lines: idle, the agent's pick, the path you point at or picked */
  --tc-decision-tree-link-pick: light-dark(rgba(0, 96, 226, 0.42), rgba(91, 154, 255, 0.5));
  --tc-decision-tree-link-pick-hot: light-dark(rgba(0, 96, 226, 0.6), rgba(112, 170, 255, 0.7));
  /* The agent's pick: a lift tinted blue, with a faint blue edge */
  --tc-decision-tree-option-shadow-picked: 0 0 0 0.5px light-dark(rgba(0, 96, 226, 0.24), rgba(91, 154, 255, 0.34)), 0 3px 8px -4px light-dark(rgba(0, 96, 226, 0.14), rgba(40, 100, 220, 0.24)), 0 1px 2px 0 light-dark(rgba(0, 60, 140, 0.05), rgba(0, 0, 0, 0.4));
  --tc-decision-tree-option-shadow-picked-hover: 0 0 0 0.5px light-dark(rgba(0, 96, 226, 0.42), rgba(112, 170, 255, 0.55)), 0 8px 22px -6px light-dark(rgba(0, 96, 226, 0.34), rgba(60, 130, 255, 0.5)), 0 2px 4px -1px light-dark(rgba(0, 96, 226, 0.16), rgba(60, 130, 255, 0.25));
  --tc-decision-tree-link-hot: light-dark(rgba(0, 0, 0, 0.38), rgba(255, 255, 255, 0.36));
  --tc-decision-tree-flag-bg: light-dark(rgba(255, 166, 0, 0.16), rgba(255, 170, 40, 0.16));
  --tc-decision-tree-flag-edge: light-dark(rgba(214, 130, 0, 0.55), rgba(255, 180, 70, 0.55));
  --tc-decision-tree-flag-hot: light-dark(rgba(255, 166, 0, 0.28), rgba(255, 170, 40, 0.28));
  --tc-decision-tree-flag-ink: light-dark(#8a4600, #ffcf8a);
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
}
.ui-dct {
  --tc-decision-tree-height: 400px;
  --tc-decision-tree-typing: 1100ms;
  /* Stagger steps: 40 / 60 / 80 ms off the duration ladder */
  --tc-decision-tree-step-xs: calc(var(--tc-duration-slow, var(--_tc-duration-slow)) / 8);
  --tc-decision-tree-step-sm: calc(var(--tc-duration-quick, var(--_tc-duration-quick)) / 2);
  --tc-decision-tree-step: calc(var(--tc-duration-slow, var(--_tc-duration-slow)) / 4);
  position: relative;
  box-sizing: border-box;
  width: 100%;
  container: ui-dct / inline-size;
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* The card itself takes the focus when the control that had it goes away – shown, never hidden */
.ui-dct:focus { outline: none; }
.ui-dct:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
.ui-dct *, .ui-dct *::before, .ui-dct *::after { box-sizing: border-box; }
:where(.ui-dct) :is(button, textarea) { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; letter-spacing: inherit; text-align: inherit; -webkit-tap-highlight-color: transparent; }
:where(.ui-dct) button { cursor: pointer; }
:where(.ui-dct) button:disabled, :where(.ui-dct) button[aria-disabled="true"] { cursor: default; }
.ui-dct button:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
:where(.ui-dct) :is(p, h3) { margin: 0; }
.ui-dct svg { display: block; flex: none; }
.ui-dct__kbd { display: inline-grid; place-items: center; min-width: var(--tc-kbd-h, var(--_tc-kbd-h)); height: var(--tc-kbd-h, var(--_tc-kbd-h)); padding: 0 var(--tc-kbd-px, var(--_tc-kbd-px)); border-radius: var(--tc-kbd-radius, var(--_tc-kbd-radius)); background: var(--tc-kbd-bg, var(--_tc-kbd-bg)); box-shadow: var(--tc-kbd-shadow, var(--_tc-kbd-shadow)); font-family: inherit; font-size: var(--tc-kbd-font-size, var(--_tc-kbd-font-size)); font-weight: var(--tc-kbd-font-weight, var(--_tc-kbd-font-weight)); line-height: var(--tc-line-height-none, var(--_tc-line-height-none)); color: var(--tc-kbd-fg, var(--_tc-kbd-fg)); letter-spacing: 0; }
.ui-dct__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* ----- The bar: what this is, how many wait, where you are ----- */
.ui-dct__head { display: flex; align-items: center; gap: var(--tc-space-2, var(--_tc-space-2)); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__head { padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3, var(--_tc-space-3)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__head { margin-bottom: var(--tc-space-4, var(--_tc-space-4)); }
.ui-dct__mark { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-accent-text, var(--_tc-accent-text)); }
.ui-dct__heading { flex: none; font-weight: var(--tc-font-weight-strong, var(--_tc-font-weight-strong)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
.ui-dct__count { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__count { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__count { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); }
.ui-dct__pager { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-2-5, var(--_tc-space-2-5)); margin-left: auto; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-dct__dots { display: flex; gap: var(--tc-space-1, var(--_tc-space-1)); }
.ui-dct__dots > span { width: 5px; height: 5px; border-radius: 50%; background: var(--tc-border-strong, var(--_tc-border-strong)); transition: background-color var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__dots > span { border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); }
.ui-dct__dots > span[data-on] { background: var(--tc-text-primary, var(--_tc-text-primary)); transform: scale(1.15); }
/* Previous / next decision: small square ghost buttons */
.ui-dct__nav { display: inline-flex; gap: var(--tc-space-0-5, var(--_tc-space-0-5)); margin: -6px -4px -6px 0; }
.ui-dct__step { display: grid; place-items: center; width: var(--tc-control-h-sm, var(--_tc-control-h-sm)); height: var(--tc-control-h-sm, var(--_tc-control-h-sm)); border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm)); color: var(--tc-action-ghost-fg, var(--_tc-action-ghost-fg)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-dct__step:hover:not([aria-disabled]) { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-dct__step[aria-disabled] { color: var(--tc-text-disabled, var(--_tc-text-disabled)); }
/* ----- The card with the tree ----- */
.ui-dct__body { position: relative; display: flex; align-items: center; justify-content: center; min-height: var(--tc-decision-tree-height); }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__body { padding: 44px var(--tc-space-7, var(--_tc-space-7)) var(--tc-space-14, var(--_tc-space-14)); border-radius: var(--tc-card-radius, var(--_tc-card-radius)); background: var(--tc-surface-on-tray, var(--_tc-surface-on-tray)); box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__body { padding: var(--tc-space-7, var(--_tc-space-7)) 0 44px; }
.ui-dct__tree { position: relative; isolation: isolate; display: grid; align-items: center; width: 100%; transition: opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__tree { grid-template-columns: minmax(0, 210px) minmax(0, 1fr); column-gap: 44px; max-width: 860px; }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__tree { grid-template-columns: minmax(0, 204px) minmax(0, 1fr); column-gap: var(--tc-space-7, var(--_tc-space-7)); max-width: 900px; }
.ui-dct__tree[data-leaving] { opacity: 0; }
.ui-dct__links { position: absolute; top: 0; left: 0; z-index: -1; overflow: visible; pointer-events: none; }
/* Thin neutral hairlines that draw themselves in – the agent's pick a quiet blue, the path you point at a little stronger */
.ui-dct__link { fill: none; stroke: var(--tc-border-strong, var(--_tc-border-strong)); stroke-width: var(--tc-hairline, var(--_tc-hairline)); stroke-linecap: round; stroke-dasharray: 1 1; animation: ui-dct-draw var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) calc(var(--tc-duration-instant, var(--_tc-duration-instant)) * 2 + var(--i, 0) * var(--tc-decision-tree-step)) both; transition: stroke var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)), stroke-width var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-dct__link[data-kind="leaf"] { animation-delay: calc(var(--tc-duration-instant, var(--_tc-duration-instant)) * 4 + var(--i, 0) * var(--tc-decision-tree-step)); }
.ui-dct__link[data-kind="out"] { animation: ui-dct-draw var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-quick, var(--_tc-duration-quick)) both; }
.ui-dct__link[data-kind="sub"] { animation-delay: calc(var(--tc-duration-moderate, var(--_tc-duration-moderate)) * 2 + var(--i, 0) * var(--tc-decision-tree-step) + var(--j, 0) * var(--tc-decision-tree-step-sm)); }
/* A follow-up's lines stay quiet until its branch is picked; then the ones you don't point at step back */
.ui-dct__link[data-kind="sub"]:not([data-live]) { opacity: 0.6; }
.ui-dct__link[data-soft] { opacity: 0.25; }
.ui-dct__tree[data-final] .ui-dct__link[data-soft] { opacity: 0; }
.ui-dct__link[data-pick] { stroke: var(--tc-decision-tree-link-pick); }
.ui-dct__link[data-hot] { stroke: var(--tc-decision-tree-link-hot); stroke-width: calc(var(--tc-hairline, var(--_tc-hairline)) * 2.5); }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__link[data-hot] { stroke-width: 1.5px; }
.ui-dct__link[data-pick][data-hot] { stroke: var(--tc-decision-tree-link-pick-hot); }
.ui-dct__link[data-dim] { opacity: 0.25; }
.ui-dct__tree[data-picked] .ui-dct__link[data-dim] { opacity: 0; }
/* The question */
.ui-dct__root { position: relative; display: grid; gap: var(--tc-space-2-5, var(--_tc-space-2-5)); padding: var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-4, var(--_tc-space-4)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); animation: ui-dct-node var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-decision-tree-step-xs) backwards; }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__root { border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__root { border-radius: var(--tc-radius-md, var(--_tc-radius-md)); }
/* Logo, then the agent's name with its model under it */
.ui-dct__who { display: flex; gap: var(--tc-space-2-5, var(--_tc-space-2-5)); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__who { align-items: flex-start; }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__who { align-items: center; }
.ui-dct__avatar { display: grid; flex: none; place-items: center; width: 28px; height: 28px; border-radius: var(--tc-avatar-radius-agent, var(--_tc-avatar-radius-agent)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
.ui-dct__avatar > svg { width: 14px; height: 14px; }
.ui-dct__meta { display: grid; flex: 1; gap: 1px; min-width: 0; }
/* The agent's name may wrap here – the question card is narrow */
.ui-dct__name { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-2, var(--_tc-space-2)); min-width: 0; }
.ui-dct__agent { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-strong, var(--_tc-font-weight-strong)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__agent { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-dct__model { overflow: hidden; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; }
/* The risk tag: a status pill, like the Live tag in Trace Waterfall – in Clean outside the card, just above its top left */
.ui-dct__risk { display: inline-flex; flex: none; align-items: center; height: var(--tc-pill-h, var(--_tc-pill-h)); padding: 0 var(--tc-pill-px, var(--_tc-pill-px)); border-radius: var(--tc-pill-radius, var(--_tc-pill-radius)); background: var(--tc-decision-tree-risk-bg); font-size: var(--tc-pill-font-size, var(--_tc-pill-font-size)); font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-decision-tree-risk-fg); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__risk { position: absolute; bottom: calc(100% + 6px); left: 2px; }
.ui-dct [data-risk="high"] { --tc-decision-tree-risk-bg: var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); --tc-decision-tree-risk-fg: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
.ui-dct [data-risk="medium"] { --tc-decision-tree-risk-bg: var(--tc-status-warning-bg, var(--_tc-status-warning-bg)); --tc-decision-tree-risk-fg: var(--tc-status-warning-fg, var(--_tc-status-warning-fg)); }
.ui-dct__q { font-weight: var(--tc-font-weight-strong, var(--_tc-font-weight-strong)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-strong, var(--_tc-text-strong)); text-wrap: pretty; }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__q { font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__q { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); }
.ui-dct__context { margin-top: -4px; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-text-muted, var(--_tc-text-muted)); text-wrap: pretty; }
/* The branches: an option card, then its consequences in muted text */
.ui-dct__branches { display: grid; gap: var(--tc-space-3-5, var(--_tc-space-3-5)); }
.ui-dct__row { display: grid; align-items: center; transition: opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)); animation: ui-dct-node var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) calc(var(--tc-duration-fast, var(--_tc-duration-fast)) + var(--i, 0) * var(--tc-decision-tree-step)) backwards; }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__row { grid-template-columns: minmax(0, 200px) minmax(0, 1fr); column-gap: var(--tc-space-8, var(--_tc-space-8)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__row { grid-template-columns: minmax(0, 184px) minmax(0, 1fr); column-gap: var(--tc-space-6, var(--_tc-space-6)); }
.ui-dct__row[data-dim] { opacity: 0.38; }
.ui-dct__tree[data-picked] .ui-dct__row[data-dim] { opacity: 0; pointer-events: none; }
.ui-dct__opt { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: var(--tc-space-0-5, var(--_tc-space-0-5)) var(--tc-space-2, var(--_tc-space-2)); min-width: 0; padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-3, var(--_tc-space-3)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); text-align: left; transition: box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__opt { border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__opt { border-radius: var(--tc-radius-md, var(--_tc-radius-md)); }
/* Highlighted boxes lift with a deeper shadow instead of a darker stroke */
button.ui-dct__opt:hover:not(:disabled), .ui-dct__opt[data-hot] { box-shadow: var(--tc-shadow-raised-hover, var(--_tc-shadow-raised-hover)); }
/* The agent's pick: the same lift, tinted blue, with a faint blue edge */
.ui-dct__opt[data-pick] { box-shadow: var(--tc-decision-tree-option-shadow-picked); }
button.ui-dct__opt[data-pick]:hover:not(:disabled), .ui-dct__opt[data-pick][data-hot] { box-shadow: var(--tc-decision-tree-option-shadow-picked-hover); }
.ui-dct__opt[data-pressed] { transform: scale(0.98); }
.ui-dct__label { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__label { display: inline-flex; align-items: center; gap: var(--tc-space-2, var(--_tc-space-2)); min-width: 0; }
/* The tool an option runs with: its logo on a small white tile */
.ui-dct__icon { display: grid; flex: none; place-items: center; width: 18px; height: 18px; border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); }
.ui-dct__icon > svg { width: 11px; height: 11px; }
/* The systems a consequence touches: a row of the same tiles, slightly overlapping */
.ui-dct__lines { display: grid; gap: 1px; min-width: 0; }
.ui-dct__apps { display: flex; flex: none; }
.ui-dct__app { display: grid; place-items: center; width: 20px; height: 20px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)), 0 0 0 1.5px var(--tc-surface-raised, var(--_tc-surface-raised)); }
.ui-dct__app + .ui-dct__app { margin-left: -3px; }
.ui-dct__app > svg { width: 12px; height: 12px; }
.ui-dct__pick { grid-column: 2; font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-accent-text, var(--_tc-accent-text)); }
.ui-dct__leaf { justify-self: start; min-width: 0; padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-3, var(--_tc-space-3)); animation: ui-dct-node var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) calc(var(--tc-duration-fast, var(--_tc-duration-fast)) * 2 + var(--i, 0) * var(--tc-decision-tree-step)) backwards; }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__leaf { display: grid; gap: var(--tc-space-1, var(--_tc-space-1)); border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-border-default, var(--_tc-border-default)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__leaf { display: flex; align-items: center; gap: var(--tc-space-3, var(--_tc-space-3)); border-radius: var(--tc-radius-md, var(--_tc-radius-md)); background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-border-default, var(--_tc-border-default)); }
.ui-dct__effect { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
/* A part the agent isn't sure about: a warm tint with a hairline underline – brighter while its note shows */
.ui-dct__flag { padding: 1px var(--tc-space-0-5, var(--_tc-space-0-5)); margin: 0 -1px; border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); background: var(--tc-decision-tree-flag-bg); color: var(--tc-decision-tree-flag-ink); cursor: help; -webkit-box-decoration-break: clone; box-decoration-break: clone; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__flag { box-shadow: inset 0 -1.5px 0 var(--tc-decision-tree-flag-edge); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__flag { box-shadow: inset 0 -1px 0 var(--tc-decision-tree-flag-edge); }
.ui-dct__flag:is(:hover, [data-on]) { background: var(--tc-decision-tree-flag-hot); box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-decision-tree-flag-edge); }
/* A follow-up: a small question card, its options hanging off a rail under it – quiet until its branch is picked */
.ui-dct__sub { display: grid; gap: var(--tc-space-2, var(--_tc-space-2)); justify-items: start; min-width: 0; transition: opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)); animation: ui-dct-node var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) calc(var(--tc-duration-fast, var(--_tc-duration-fast)) * 2 + var(--i, 0) * var(--tc-decision-tree-step)) backwards; }
.ui-dct__sub:not([data-live]) { opacity: 0.62; }
.ui-dct__subq { max-width: 100%; padding: var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-2-5, var(--_tc-space-2-5)); border-radius: var(--tc-radius-md, var(--_tc-radius-md)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-text-primary, var(--_tc-text-primary)); text-wrap: pretty; }
.ui-dct__subopts { display: grid; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); justify-items: start; padding-left: 22px; }
.ui-dct__sopt { display: grid; gap: var(--tc-space-0-5, var(--_tc-space-0-5)); min-width: 0; max-width: 100%; padding: var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2, var(--_tc-space-2)); border-radius: var(--tc-radius-md, var(--_tc-radius-md)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); text-align: left; transition: box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); animation: ui-dct-node var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) calc(var(--tc-duration-slowest, var(--_tc-duration-slowest)) + var(--i, 0) * var(--tc-decision-tree-step) + var(--j, 0) * var(--tc-decision-tree-step-sm)) backwards; }
.ui-dct__sopt[data-pick] { box-shadow: var(--tc-decision-tree-option-shadow-picked); }
button.ui-dct__sopt:hover:not(:disabled),
.ui-dct__sopt[data-hot] { box-shadow: var(--tc-shadow-raised-hover, var(--_tc-shadow-raised-hover)); }
button.ui-dct__sopt[data-pick]:hover:not(:disabled),
.ui-dct__sopt[data-pick][data-hot] { box-shadow: var(--tc-decision-tree-option-shadow-picked-hover); }
.ui-dct__sopt[data-pressed] { transform: scale(0.98); }
.ui-dct__sopt[data-soft] { opacity: 0.38; }
.ui-dct__tree[data-final] .ui-dct__sopt[data-soft] { opacity: 0; pointer-events: none; }
.ui-dct__sopt-top { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-0-5, var(--_tc-space-0-5)) var(--tc-space-2, var(--_tc-space-2)); }
.ui-dct__sopt .ui-dct__label { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); }
.ui-dct__sopt .ui-dct__pick { grid-column: auto; }
.ui-dct__sopt-effects { display: flex; align-items: center; gap: var(--tc-space-2-5, var(--_tc-space-2-5)); }
.ui-dct__sopt .ui-dct__effect { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); }
.ui-dct__more { display: none; margin-left: var(--tc-space-1-5, var(--_tc-space-1-5)); font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; }
/* While the follow-up waits for you, its question lifts a little */
.ui-dct__sub[data-asking] .ui-dct__subq { box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); }
/* Other…: a quiet outline; opened, a field (--tc-field-shadow) that grows with what you write – the field's focus
   ring sits on it while you type */
.ui-dct__opt[data-other] { padding: 0; background: transparent; box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-border-strong, var(--_tc-border-strong)); }
.ui-dct__opt[data-other][data-open] { background: var(--tc-field-bg, var(--_tc-field-bg)); box-shadow: var(--tc-field-shadow, var(--_tc-field-shadow)); }
.ui-dct__opt[data-other][data-open]:focus-within { box-shadow: var(--tc-field-shadow-focus, var(--_tc-field-shadow-focus)); }
.ui-dct__other { display: flex; align-items: center; gap: var(--tc-space-2, var(--_tc-space-2)); width: 100%; padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-3, var(--_tc-space-3)); border-radius: inherit; text-align: left; }
.ui-dct__other .ui-dct__label { font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
.ui-dct__grow { position: relative; height: 32px; overflow: hidden; transition: height var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)); }
.ui-dct__mirror { position: absolute; top: 0; right: 0; left: 0; padding: var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-3, var(--_tc-space-3)); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); white-space: pre-wrap; overflow-wrap: anywhere; visibility: hidden; pointer-events: none; }
.ui-dct__input { display: block; width: 100%; height: 100%; padding: var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-3, var(--_tc-space-3)); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-primary, var(--_tc-text-primary)); resize: none; overflow-y: hidden; outline: none; scrollbar-width: thin; }
.ui-dct__input::placeholder { color: var(--tc-text-placeholder, var(--_tc-text-placeholder)); }
.ui-dct__failed { grid-column: 1 / -1; padding: 0 var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-2, var(--_tc-space-2)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
.ui-dct__said { padding: var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-3, var(--_tc-space-3)); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: pre-wrap; }
/* The outcome under the picked path */
.ui-dct__out { position: absolute; z-index: 1; display: grid; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); max-width: 280px; padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-3, var(--_tc-space-3)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)), 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-status-success-border, var(--_tc-status-success-border)); animation: ui-dct-node var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-slow, var(--_tc-duration-slow)) backwards; }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__out { border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__out { border-radius: var(--tc-radius-md, var(--_tc-radius-md)); }
.ui-dct__out[data-kind="replied"] { box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); }
.ui-dct__out-head { display: inline-flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; }
.ui-dct__out-head > svg { width: 15px; height: 15px; color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
.ui-dct__running { font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
.ui-dct__answer { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); animation: ui-dct-fade-up var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) backwards; }
.ui-dct__typing { display: inline-flex; gap: var(--tc-space-1, var(--_tc-space-1)); justify-self: start; padding: var(--tc-space-1-5, var(--_tc-space-1-5)) 0 var(--tc-space-1, var(--_tc-space-1)); }
.ui-dct__typing > span { width: 5px; height: 5px; border-radius: 50%; background: var(--tc-text-muted, var(--_tc-text-muted)); animation: ui-dct-dot var(--tc-decision-tree-typing) var(--tc-ease-in-out, var(--_tc-ease-in-out)) infinite; }
.ui-dct__typing > span:nth-child(2) { animation-delay: var(--tc-duration-fast, var(--_tc-duration-fast)); }
.ui-dct__typing > span:nth-child(3) { animation-delay: calc(var(--tc-duration-fast, var(--_tc-duration-fast)) * 2); }
.ui-dct__hint { position: absolute; display: inline-flex; align-items: center; gap: var(--tc-space-1, var(--_tc-space-1)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); pointer-events: none; animation: ui-dct-fade var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)) calc(var(--tc-duration-base, var(--_tc-duration-base)) * 3) backwards; }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__hint { bottom: 16px; left: 24px; }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__hint { bottom: 8px; left: 0; }
.ui-dct__hint > span { margin: 0 var(--tc-space-1, var(--_tc-space-1)); color: var(--tc-text-disabled, var(--_tc-text-disabled)); }
.ui-dct__hint--failed { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
/* The agent's note on a flagged part – it can be hovered (to read or select it) and closes with Escape */
.ui-dct__tip { position: absolute; top: 0; left: 0; z-index: 6; display: grid; width: min(300px, calc(100% - 20px)); padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3, var(--_tc-space-3)); border-radius: var(--tc-menu-radius, var(--_tc-menu-radius)); background: var(--tc-surface-overlay, var(--_tc-surface-overlay)); box-shadow: var(--tc-shadow-overlay, var(--_tc-shadow-overlay)); transform-origin: var(--x, 50%) top; animation: ui-dct-tip var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__tip { gap: var(--tc-space-1, var(--_tc-space-1)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__tip { gap: var(--tc-space-0-5, var(--_tc-space-0-5)); }
.ui-dct__tip[data-side="above"] { transform-origin: var(--x, 50%) bottom; }
.ui-dct__tip-head { display: inline-flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); color: var(--tc-status-warning-fg, var(--_tc-status-warning-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__tip-head { font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs)); font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__tip-head { font-size: var(--tc-eyebrow-font-size, var(--_tc-eyebrow-font-size)); font-weight: var(--tc-eyebrow-font-weight, var(--_tc-eyebrow-font-weight)); line-height: var(--tc-eyebrow-line-height, var(--_tc-eyebrow-line-height)); letter-spacing: var(--tc-eyebrow-tracking, var(--_tc-eyebrow-tracking)); text-transform: var(--tc-eyebrow-transform, var(--_tc-eyebrow-transform)); }
.ui-dct__tip-head > svg { width: 12px; height: 12px; }
.ui-dct__tip p { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-text-primary, var(--_tc-text-primary)); text-wrap: pretty; }
.ui-dct__tip-source { justify-self: start; margin-top: var(--tc-space-0-5, var(--_tc-space-0-5)); padding: 1px var(--tc-space-2, var(--_tc-space-2)); border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); background: var(--tc-fill-default, var(--_tc-fill-default)); font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
.ui-dct__empty { display: grid; justify-items: center; gap: var(--tc-space-1, var(--_tc-space-1)); text-align: center; animation: ui-dct-fade-up var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
.ui-dct__empty-mark { display: grid; place-items: center; width: 44px; height: 44px; margin-bottom: var(--tc-space-2, var(--_tc-space-2)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)), 0 0 0 4px var(--tc-status-success-bg, var(--_tc-status-success-bg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__empty-mark { border-radius: var(--tc-radius-xl, var(--_tc-radius-xl)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__empty-mark { border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); }
.ui-dct__empty b { font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus)); font-weight: var(--tc-font-weight-strong, var(--_tc-font-weight-strong)); line-height: var(--tc-line-height-relaxed, var(--_tc-line-height-relaxed)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
.ui-dct__empty > span:last-child { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* ----- Narrow: top to bottom – the question, then each branch hanging off a rail with its consequences under it ----- */
@container ui-dct (max-width: 639px) {
:where([data-look="standard"], [data-look="standard"] *).ui-dct__body { min-height: 0; padding: var(--tc-space-5, var(--_tc-space-5)) var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-12, var(--_tc-space-12)); }
:where([data-look="clean"], [data-look="clean"] *).ui-dct__body { min-height: 0; padding: var(--tc-space-6, var(--_tc-space-6)) 0 var(--tc-space-10, var(--_tc-space-10)); }
.ui-dct__count { display: none; }
.ui-dct__tree { grid-template-columns: minmax(0, 1fr); row-gap: var(--tc-space-4-5, var(--_tc-space-4-5)); }
.ui-dct__branches { padding-left: 34px; }
.ui-dct__row { grid-template-columns: minmax(0, 1fr); row-gap: var(--tc-space-2, var(--_tc-space-2)); }
.ui-dct__leaf { margin-left: 26px; }
:where([data-look="standard"], [data-look="standard"] *).ui-dct__hint { left: 16px; bottom: 14px; }
.ui-dct__hint kbd:last-of-type,
.ui-dct__hint > span { display: none; }
.ui-dct__sub { margin-left: 26px; }
  /* A follow-up folds to its question until its branch is picked – then its options unfold */
.ui-dct__sub:not([data-live]) .ui-dct__subopts { display: none; }
.ui-dct__sub:not([data-live]) .ui-dct__more { display: inline; }
.ui-dct__sub[data-live] .ui-dct__sopt { animation-delay: calc(var(--tc-duration-quick, var(--_tc-duration-quick)) + var(--j, 0) * var(--tc-decision-tree-step-sm)); }
.ui-dct__link[data-kind="sub"] { animation-delay: calc(var(--tc-decision-tree-step) + var(--j, 0) * var(--tc-decision-tree-step-sm)); }
}
@container ui-dct (max-width: 380px) {
.ui-dct__of { display: none; }
.ui-dct__branches { padding-left: 26px; }
.ui-dct__leaf { margin-left: var(--tc-space-4-5, var(--_tc-space-4-5)); }
.ui-dct__sub { margin-left: var(--tc-space-4-5, var(--_tc-space-4-5)); }
}
@keyframes ui-dct-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes ui-dct-node { from { opacity: 0; transform: translateX(-8px); } }
@keyframes ui-dct-fade { from { opacity: 0; } }
@keyframes ui-dct-fade-up { from { opacity: 0; transform: translateY(6px); } }
@keyframes ui-dct-tip { from { opacity: 0; transform: translateY(4px) scale(0.96); } }
@keyframes ui-dct-dot { 0%, 60%, 100% { opacity: 0.35; } 30% { opacity: 1; } }
@media (pointer: coarse) {
  .ui-dct .ui-dct__kbd, .ui-dct__hint { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-dct *, .ui-dct *::before, .ui-dct *::after { animation: none !important; transition: none !important; }
}
`;
