"use client";

/*
 * Agent Ledger – everything an agent changed in your systems, each change with an undo, in a single
 * self-contained file. A soft gray tray with the agent and the count, a white card with a row per change –
 * newest first, new ones sliding in as the agent works.
 *   · every row keeps its height: the system's logo, what was done and to what, and before → after
 *   · point at a row and its time turns into "Undo"; point at Undo and every change that builds on it lights up –
 *     "Also undone" where it can be reversed, "Can't undo" where it can't (a sent email, a payout)
 *   · undo strikes the change through, its dependents a beat after each other; "Redo" brings them back, and with them
 *     any undone change they build on
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: agent-ledger.tsx is Standard,
 * agent-ledger-clean.tsx is Clean). Clean drops the gray tray for a plain bar above one quiet white panel:
 * smaller logo tiles, medium weights, 0.5px dividers, and Undo / Redo as flat text buttons instead of raised pills.
 */
// Generated from src/components/agent-ledger.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ComponentPropsWithoutRef, type ReactNode, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "clean";
const ROOT_CLASS = "ui-alg";

export type LedgerEntry = {
  id: string;
  /** What was done, in a few words – e.g. "Changed price" */
  action: string;
  /** To what – e.g. "Pro plan" */
  target?: string;
  /** Where – e.g. "Stripe"; shown after the time and in the labels */
  system: string;
  /** The system's logo */
  icon?: ReactNode;
  /** When it happened (epoch ms) */
  at: number;
  /** Before and after – e.g. ["$29", "$34"]; or a single line of detail */
  change?: [before: string, after: string];
  detail?: string;
  /** False for changes that can't be taken back – a sent email, a payout (default true) */
  reversible?: boolean;
  /** Ids of the changes this one builds on – undoing one of those undoes this one too */
  dependsOn?: string[];
};

type AgentLedgerOwnProps = {
  /** Visual style. Defaults to the file's look: Standard in agent-ledger.tsx, Clean in agent-ledger-clean.tsx */
  look?: Look;
  entries: LedgerEntry[];
  /** Who made the changes – e.g. "Launch agent" */
  agent?: string;
  /** The clock for "2m ago", in epoch ms – defaults to an internal clock */
  now?: number;
  /** Ids of undone changes. Controlled when defined; otherwise the component keeps them, starting from `defaultUndone` */
  undone?: string[];
  defaultUndone?: string[];
  /** Every change to the undone ids, as the whole new list */
  onUndoneChange?: (ids: string[]) => void;
  /** Undo sends the change and its reversible dependents, Redo the same set back – plus any undone changes that set
   *  builds on. Either may return a promise: the rows show the result at once and wait; if it rejects they go back
   *  and the bar says so */
  onUndo?: (ids: string[]) => void | Promise<unknown>;
  onRedo?: (ids: string[]) => void | Promise<unknown>;
  /** Lights up a change and what builds on it, as if its Undo were pointed at – e.g. for a walkthrough */
  pointAt?: string | null;
  title?: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export type AgentLedgerProps = Omit<ComponentPropsWithoutRef<"div">, keyof AgentLedgerOwnProps> & AgentLedgerOwnProps;

/* ---------- Helpers ---------- */

const ago = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
};

/**
 * The chains between changes, worked out once per list of entries: everything that builds on a change (directly or
 * through others, in the order it's reached) and everything it builds on (nearest first) – each chain walked once, the
 * first time it's asked for, instead of searching the whole list on every render
 */
const chainsOf = (entries: LedgerEntry[]) => {
  const byId = new Map(entries.map((e) => [e.id, e]));
  // Who builds directly on each change, in list order
  const builtOn = new Map<string, LedgerEntry[]>();
  for (const e of entries) for (const dep of e.dependsOn ?? []) if (!builtOn.get(dep)?.includes(e)) builtOn.set(dep, [...(builtOn.get(dep) ?? []), e]);
  const walk = (id: string, next: (cur: string) => LedgerEntry[]) => {
    const out: LedgerEntry[] = [];
    const seen = new Set([id]);
    const queue = [id];
    while (queue.length) {
      for (const e of next(queue.shift()!)) {
        if (seen.has(e.id)) continue;
        seen.add(e.id);
        out.push(e);
        queue.push(e.id);
      }
    }
    return out;
  };
  const down = new Map<string, LedgerEntry[]>();
  const up = new Map<string, LedgerEntry[]>();
  const cached = (cache: Map<string, LedgerEntry[]>, id: string, next: (cur: string) => LedgerEntry[]) => {
    let chain = cache.get(id);
    if (!chain) cache.set(id, (chain = walk(id, next)));
    return chain;
  };
  return {
    /** Everything that builds on a change, directly or through others */
    dependentsOf: (id: string) => cached(down, id, (cur) => builtOn.get(cur) ?? []),
    /** Everything a change builds on, directly or through others – nearest first */
    dependenciesOf: (id: string) => cached(up, id, (cur) => (byId.get(cur)?.dependsOn ?? []).flatMap((dep) => byId.get(dep) ?? [])),
  };
};

/* ---------- Icons ---------- */

/* A small ledger mark for the title (drawn for Trenchcoat) */
const LedgerMark = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="2" y="1.8" width="12" height="12.4" rx="2.6" stroke="currentColor" strokeWidth="1.3" />
    <path d="M5 5.4h6M5 8h6M5 10.6h3.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);
/* undo-2, redo-2 and lock: Lucide (ISC, lucide.dev) */
const UndoIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11" />
  </svg>
);
const RedoIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m15 14 5-5-5-5" />
    <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5A5.5 5.5 0 0 0 9.5 20H13" />
  </svg>
);
const Lock = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const NONE: string[] = [];

export function AgentLedger({
  look,
  entries,
  agent,
  now: nowProp,
  undone: undoneProp,
  defaultUndone = NONE,
  onUndoneChange,
  onUndo,
  onRedo,
  pointAt = null,
  title = "Ledger",
  className,
  ref,
  ...rest
}: AgentLedgerProps) {
  const label = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const rootRefs = useRootRef(rootRef, ref);
  const onScreen = useOnScreen(rootRef);
  // If the focused Undo / Redo goes (its entry was removed), focus moves to the next row's action, not <body>
  useFocusRescue(rootRef, { fallback: () => rootRef.current?.querySelector(".ui-alg__act") });
  // The changes already there when the ledger appears just show – only the ones added later grow in
  const [initial] = useState(() => new Set(entries.map((e) => e.id)));
  const [undoneList, setUndone] = useControllable(
    undoneProp,
    defaultUndone,
    // onUndo and onRedo hear every change too, so any of them makes `undone` changeable
    onUndoneChange ?? (onUndo || onRedo ? () => {} : undefined),
    "undone",
  );
  const undone = new Set(undoneList);
  // An undo or redo on its way (its rows wait), or the one that failed
  const [pending, setPending] = useState<Set<string>>(() => new Set());
  const [failed, setFailed] = useState<"undo" | "redo" | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const [preview, setPreview] = useState<string | null>(null);
  // What the last undo or redo did, for screen readers – the cascade isn't only visual
  const [said, setSaid] = useState("");
  /** The order rows were struck through in, for the stagger */
  const [order, setOrder] = useState<Record<string, number>>({});
  // Undone from outside: the ones that just joined strike through in the order they're listed
  const before = useRef<string[]>(undoneProp ?? []);
  useEffect(() => {
    if (!undoneProp) return;
    const fresh = undoneProp.filter((id) => !before.current.includes(id));
    before.current = undoneProp;
    if (fresh.length) setOrder(Object.fromEntries(fresh.map((id, i) => [id, i])));
  }, [undoneProp]);

  // Without a clock from outside, "2m ago" keeps itself fresh – 0 on the server and the first render, read before paint.
  // Off screen or in a hidden tab it waits, and reads again on return
  const [tick, setTick] = useState(0);
  const own = nowProp === undefined;
  useLayoutEffect(() => {
    if (own) setTick(Date.now());
  }, [own]);
  const away = useRef(false);
  useEffect(() => {
    if (!own) return;
    if (!onScreen) {
      away.current = true;
      return;
    }
    const read = () => setTick(Date.now());
    if (away.current) {
      away.current = false;
      read();
    }
    const t = window.setInterval(read, 15000);
    return () => window.clearInterval(t);
  }, [own, onScreen]);
  const now = nowProp ?? tick;

  const sorted = useMemo(() => [...entries].sort((a, b) => b.at - a.at), [entries]);
  const { dependentsOf, dependenciesOf } = useMemo(() => chainsOf(entries), [entries]);
  const chainOf = (id: string) => dependentsOf(id).filter((e) => !undone.has(e.id));
  const lit = preview ?? pointAt;
  const previewChain = lit ? chainOf(lit) : [];
  const previewIds = new Map(previewChain.map((e) => [e.id, e.reversible !== false ? "also" : "kept"] as const));

  // The rows show the result at once; a promise holds them until it settles, and a rejection takes the step back
  const track = (kind: "undo" | "redo", ids: string[], done: void | Promise<unknown> | undefined, revert: () => void) => {
    setFailed(null);
    if (!done || typeof (done as Promise<unknown>).then !== "function") return;
    setPending((p) => new Set([...p, ...ids]));
    const settle = () => setPending((p) => new Set([...p].filter((id) => !ids.includes(id))));
    (done as Promise<unknown>).then(
      () => alive.current && settle(),
      () => {
        if (!alive.current) return;
        settle();
        revert();
        setFailed(kind);
      },
    );
  };
  const nameOf = (e: LedgerEntry) => `${e.action}${e.target ? ` ${e.target}` : ""}`;
  const say = (verb: string, e: LedgerEntry, ids: string[], kept = 0) => {
    const more = ids.length - 1;
    setSaid(`${verb}: ${nameOf(e)}${more ? `, and ${more} ${more === 1 ? "change" : "changes"} with it` : ""}${kept ? `. ${kept} can't be undone` : ""}`);
  };
  const undo = (e: LedgerEntry) => {
    if (pending.has(e.id)) return;
    const chain = chainOf(e.id);
    const ids = [e.id, ...chain.filter((d) => d.reversible !== false).map((d) => d.id)];
    say("Undone", e, ids, chain.length + 1 - ids.length);
    setOrder(Object.fromEntries(ids.map((id, i) => [id, i])));
    setUndone((u) => [...u, ...ids.filter((id) => !u.includes(id))]);
    setPreview(null);
    track("undo", ids, onUndo?.(ids), () => setUndone((u) => u.filter((id) => !ids.includes(id))));
  };
  const redo = (e: LedgerEntry) => {
    if (pending.has(e.id)) return;
    // Back with it come the ones that went with it – and the undone ones they build on, which they can't stand without
    const back = [e.id, ...dependentsOf(e.id).filter((d) => undone.has(d.id)).map((d) => d.id)];
    const needed = back.flatMap((id) => dependenciesOf(id).map((d) => d.id).reverse());
    const ids = [...new Set([...needed.filter((id) => undone.has(id)), ...back])];
    say("Redone", e, ids);
    setOrder({});
    setUndone((u) => u.filter((id) => !ids.includes(id)));
    track("redo", ids, onRedo?.(ids), () => setUndone((u) => [...u, ...ids.filter((id) => !u.includes(id))]));
  };

  const count = entries.length;
  const undoneCount = entries.filter((e) => undone.has(e.id)).length;

  return (
    <div {...rest} ref={rootRefs} className={[ROOT_CLASS, className].filter(Boolean).join(" ")} data-look={look ?? DEFAULT_LOOK}>
      <style href="ui-agent-ledger" precedence="default">
        {css}
      </style>

      <header className="ui-alg__bar">
        <span className="ui-alg__mark">
          <LedgerMark />
        </span>
        <span className="ui-alg__title" id={label}>
          {title}
        </span>
        {agent && (
          <span className="ui-alg__agent" title={agent}>
            {agent}
          </span>
        )}
        <span className="ui-alg__sum">
          <span>
            <b>{count}</b> {count === 1 ? "change" : "changes"}
          </span>
          {undoneCount > 0 && (
            <span className="ui-alg__sum-undone">
              <b>{undoneCount}</b> undone
            </span>
          )}
          {failed && (
            <span className="ui-alg__error" role="alert">
              {failed === "undo" ? "Couldn't undo" : "Couldn't redo"} – try again
            </span>
          )}
        </span>
        {/* Mounted from the start, so the first undo is announced too */}
        <span className="ui-alg__sr" role="status">
          {said}
        </span>
      </header>

      <ol className="ui-alg__panel" aria-labelledby={label}>
        {sorted.map((e) => {
          const isUndone = undone.has(e.id);
          const mark = previewIds.get(e.id);
          const blocked = e.reversible === false;
          const builds = isUndone || blocked ? 0 : chainOf(e.id).length;
          return (
            <li
              key={e.id}
              className="ui-alg__row"
              data-undone={isUndone ? "" : undefined}
              data-initial={initial.has(e.id) ? "" : undefined}
              data-pending={pending.has(e.id) ? "" : undefined}
              aria-busy={pending.has(e.id) || undefined}
              data-preview={lit === e.id ? "" : undefined}
              data-chain={mark}
              style={{ "--o": order[e.id] ?? 0 } as CSSProperties}
            >
              <span className="ui-alg__icon" aria-hidden="true">
                {e.icon ?? e.system.slice(0, 1)}
              </span>
              <div className="ui-alg__main">
                <span className="ui-alg__what">
                  <span className="ui-alg__action">{e.action}</span>
                  {e.target && (
                    <span className="ui-alg__target" title={e.target}>
                      {e.target}
                    </span>
                  )}
                  {/* The strike: a line drawn across what was done when it's undone */}
                  <span className="ui-alg__strike" aria-hidden="true" />
                </span>
                <span className="ui-alg__change">
                  {e.change ? (
                    <>
                      <span className="ui-alg__before">{e.change[0]}</span>
                      <span className="ui-alg__arrow" aria-hidden="true">
                        →
                      </span>
                      <span className="ui-alg__sr"> to </span>
                      <span className="ui-alg__after" title={e.change[1]}>
                        {e.change[1]}
                      </span>
                    </>
                  ) : (
                    <span className="ui-alg__detail" title={e.detail}>
                      {e.detail}
                    </span>
                  )}
                </span>
              </div>

              {/* On the right, always one slot: the time – or Undo, Redo, and what an undo would do to this row */}
              <div className="ui-alg__end">
                {mark ? (
                  <span className="ui-alg__flag" data-kind={mark}>
                    {mark === "also" ? (
                      "Also undone"
                    ) : (
                      <>
                        <Lock />
                        Can't undo
                      </>
                    )}
                  </span>
                ) : (
                  <>
                    <span className="ui-alg__time" data-hide={isUndone || !blocked ? "" : undefined}>
                      {isUndone ? (
                        "Undone"
                      ) : (
                        <>
                          {ago(now - e.at)}
                          <span className="ui-alg__sys"> · {e.system}</span>
                        </>
                      )}
                    </span>
                    {isUndone ? (
                      <button type="button" className="ui-alg__act" aria-disabled={pending.has(e.id) || undefined} onClick={() => redo(e)} aria-label={`Redo: ${e.action}${e.target ? ` ${e.target}` : ""}`}>
                        <RedoIcon />
                        <span className="ui-alg__act-label">Redo</span>
                      </button>
                    ) : blocked ? null : (
                      <button
                        type="button"
                        className="ui-alg__act"
                        aria-disabled={pending.has(e.id) || undefined}
                        onMouseEnter={() => setPreview(e.id)}
                        onMouseLeave={() => setPreview((p) => (p === e.id ? null : p))}
                        onFocus={() => setPreview(e.id)}
                        onBlur={() => setPreview((p) => (p === e.id ? null : p))}
                        onClick={() => undo(e)}
                        aria-label={`Undo: ${e.action}${e.target ? ` ${e.target}` : ""}${builds ? ` – and ${builds} that build on it` : ""}`}
                      >
                        <UndoIcon />
                        <span className="ui-alg__act-label">Undo</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const css = /* css */ `
/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
.ui-alg:where([data-look="standard"]),
.ui-alg__portal:where([data-look="standard"]) {
  --_tc-accent-subtle: light-dark(rgba(47, 107, 255, 0.08), rgba(79, 130, 255, 0.16));
  --_tc-accent-text: light-dark(#2456d6, #8ab4ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-action-ghost-fg: light-dark(#404040, #c8c8cc);
  --_tc-action-secondary-bg: light-dark(#ffffff, #232326);
  --_tc-action-secondary-fg: light-dark(#171717, #ededed);
  --_tc-action-secondary-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-sm: 28px;
  --_tc-control-px-sm: 10px;
  --_tc-control-radius-sm: 8px;
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-hairline: 1px;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-line-height-normal: 20px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-pill-font-size-lg: 12px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h-lg: 22px;
  --_tc-pill-px-lg: 10px;
  --_tc-pill-radius: 999px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-warning-bg: light-dark(#fff3e0, #3a2410);
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-surface-control: light-dark(#ffffff, #232326);
  --_tc-surface-on-tray: light-dark(#ffffff, #232326);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-tray: light-dark(#f0f0f0, #19191b);
  --_tc-text-disabled: light-dark(#a3a3a3, #5c5c63);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
}
.ui-alg:where([data-look="clean"]),
.ui-alg__portal:where([data-look="clean"]) {
  --_tc-accent-subtle: light-dark(rgba(0, 96, 226, 0.06), rgba(77, 141, 255, 0.14));
  --_tc-accent-text: light-dark(#0058cf, #70b8ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-action-ghost-fg: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-action-secondary-bg: light-dark(#ffffff, #252527);
  --_tc-action-secondary-fg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-action-secondary-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-sm: 24px;
  --_tc-control-px-sm: 8px;
  --_tc-control-radius-sm: 6px;
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-hairline: 0.5px;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-line-height-normal: 20px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-pill-font-size-lg: 12px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h-lg: 20px;
  --_tc-pill-px-lg: 8px;
  --_tc-pill-radius: 5px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-warning-bg: light-dark(rgba(255, 156, 0, 0.16), rgba(251, 106, 0, 0.15));
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-surface-control: light-dark(#ffffff, #252527);
  --_tc-surface-on-tray: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-tray: light-dark(#f7f7f7, #161618);
  --_tc-text-disabled: light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3));
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

/* Colors, sizes and motion as variables – override them on .ui-alg */
:where([data-look="standard"], [data-look="standard"] *).ui-alg {
  /* Three layers: the gray tray, the white panel on it and the tiles on the panel (lighter again in dark) */
  --tc-agent-ledger-tray-bg: var(--tc-surface-tray, var(--_tc-surface-tray));
  --tc-agent-ledger-panel-bg: var(--tc-surface-on-tray, var(--_tc-surface-on-tray));
  --tc-agent-ledger-card-bg: var(--tc-surface-control, var(--_tc-surface-control));
  /* Rows an undo would also revert (blue) or keep (amber) */
  --tc-agent-ledger-also-bg: light-dark(#f5f8ff, #1c2232);
  --tc-agent-ledger-also-chip-bg: light-dark(#e3ecff, #1d2b4d);
  --tc-agent-ledger-kept-bg: light-dark(#fff8ee, #2a2219);
  --tc-agent-ledger-row: 62px;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  background: var(--tc-agent-ledger-tray-bg);
  container: ui-alg / inline-size;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  letter-spacing: -0.006em;
  color: var(--tc-text-muted, var(--_tc-text-muted));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors, sizes and motion as variables – override them on .ui-alg */
:where([data-look="clean"], [data-look="clean"] *).ui-alg {
  /* The icon tiles sit a step lighter than the panel in dark */
  --tc-agent-ledger-card-bg: var(--tc-surface-control, var(--_tc-surface-control));
  --tc-agent-ledger-also-chip-bg: light-dark(rgba(0, 96, 226, 0.09), rgba(91, 154, 255, 0.16));
  /* Rows an undo would also revert (blue) or keep (amber) */
  --tc-agent-ledger-also-bg: light-dark(rgba(0, 96, 226, 0.045), rgba(91, 154, 255, 0.07));
  --tc-agent-ledger-kept-bg: light-dark(#ff9c0014, rgba(255, 160, 40, 0.09));
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  --tc-agent-ledger-row: 56px;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  container: ui-alg / inline-size;
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
.ui-alg *, .ui-alg *::before, .ui-alg *::after { box-sizing: border-box; }
:where(.ui-alg) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-look="standard"], [data-look="standard"] *):where(.ui-alg) button { letter-spacing: inherit; }
.ui-alg button:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
.ui-alg__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-alg svg { display: block; flex: none; }
/* ----- On the tray: whose changes, how many ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-alg__bar { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; min-width: 0; padding: 8px 12px 12px; }
/* ----- The bar: whose changes, how many ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-alg__bar { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; min-width: 0; margin-bottom: 16px; }
.ui-alg__mark { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-accent-text, var(--_tc-accent-text)); }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__title { flex: none; font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__agent { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__sum { display: flex; align-items: center; gap: 14px; margin-left: auto; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__sum b { font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__title { flex: none; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__agent { min-width: 0; overflow: hidden; color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__sum { display: flex; align-items: center; gap: 14px; margin-left: auto; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__sum b { font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-alg__sum-undone { animation: ui-alg-fade var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
.ui-alg__error { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); animation: ui-alg-fade var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
.ui-alg__row[data-pending] .ui-alg__act { cursor: progress; opacity: 0.6; }
/* ----- The white card: one row per change, newest first ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-alg__panel { display: grid; margin: 0; padding: 6px; overflow: hidden; border-radius: var(--tc-card-radius, var(--_tc-card-radius)); background: var(--tc-agent-ledger-panel-bg); box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow)); list-style: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__row { position: relative; display: grid; grid-template-columns: 32px minmax(0, 1fr) auto; align-items: center; column-gap: 12px; min-height: var(--tc-agent-ledger-row); padding: 10px 12px 10px 10px; border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); transition: background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); animation: ui-alg-grow var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-move, var(--_tc-ease-move)) backwards; }
/* A new change opens its row – the card grows smoothly instead of jumping – and then fades in */
:where([data-look="standard"], [data-look="standard"] *).ui-alg__row > * { animation: ui-alg-in var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-fast, var(--_tc-duration-fast)) backwards; }
/* ----- The white panel: one row per change, newest first ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-alg__panel { display: grid; margin: 0; padding: 4px; overflow: hidden; border-radius: var(--tc-card-radius, var(--_tc-card-radius)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow)); list-style: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__row { position: relative; display: grid; grid-template-columns: 28px minmax(0, 1fr) auto; align-items: center; column-gap: 12px; min-height: var(--tc-agent-ledger-row); padding: 9px 12px 9px 10px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); transition: background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); animation: ui-alg-grow var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-move, var(--_tc-ease-move)) backwards; }
/* A new change opens its row – the panel grows smoothly instead of jumping – and then fades in */
:where([data-look="clean"], [data-look="clean"] *).ui-alg__row > * { animation: ui-alg-in var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-fast, var(--_tc-duration-fast)) backwards; }
.ui-alg__row[data-initial], .ui-alg__row[data-initial] > * { animation: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__row + .ui-alg__row::before { content: ""; position: absolute; top: 0; right: 12px; left: 54px; height: var(--tc-hairline, var(--_tc-hairline)); background: var(--tc-divider, var(--_tc-divider)); }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__row:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__row + .ui-alg__row::before { content: ""; position: absolute; top: -0.25px; right: 12px; left: 50px; height: var(--tc-hairline, var(--_tc-hairline)); background: var(--tc-divider, var(--_tc-divider)); }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__row:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
/* Pointing at Undo: this row and every change built on it light up */
.ui-alg__row[data-preview] { background: var(--tc-accent-subtle, var(--_tc-accent-subtle)); }
.ui-alg__row[data-chain="also"] { background: var(--tc-agent-ledger-also-bg); }
.ui-alg__row[data-chain="kept"] { background: var(--tc-agent-ledger-kept-bg); }
.ui-alg__row:is([data-preview], [data-chain]) + .ui-alg__row::before, .ui-alg__row:is([data-preview], [data-chain])::before { opacity: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__icon { display: grid; place-items: center; width: 32px; height: 32px; border-radius: var(--tc-radius-md, var(--_tc-radius-md)); background: var(--tc-agent-ledger-card-bg); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); color: var(--tc-text-muted, var(--_tc-text-muted)); transition: opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)), filter var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__icon > svg { width: 16px; height: 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__icon { display: grid; place-items: center; width: 28px; height: 28px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); background: var(--tc-agent-ledger-card-bg); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); transition: opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)), filter var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__icon > svg { width: 14px; height: 14px; }
/* Two lines: what was done to what – then before → after */
.ui-alg__main { position: relative; display: grid; min-width: 0; }
.ui-alg__what { position: relative; display: flex; align-items: baseline; gap: 6px; justify-self: start; min-width: 0; max-width: 100%; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__action { flex: none; font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); color: var(--tc-text-primary, var(--_tc-text-primary)); transition: color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__target { min-width: 0; overflow: hidden; color: var(--tc-text-muted, var(--_tc-text-muted)); text-overflow: ellipsis; transition: color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__change { display: flex; align-items: baseline; gap: 6px; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__action { flex: none; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); transition: color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__target { min-width: 0; overflow: hidden; color: var(--tc-text-secondary, var(--_tc-text-secondary)); text-overflow: ellipsis; transition: color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__change { display: flex; align-items: baseline; gap: 6px; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; }
.ui-alg__before { flex: none; text-decoration: line-through; text-decoration-color: var(--tc-text-disabled, var(--_tc-text-disabled)); }
.ui-alg__arrow { flex: none; color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
.ui-alg__detail { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__after { min-width: 0; overflow: hidden; color: var(--tc-text-muted, var(--_tc-text-muted)); text-overflow: ellipsis; }
/* Undone: a line draws across what was done, a beat after each other down the chain, and the row goes quiet */
:where([data-look="standard"], [data-look="standard"] *).ui-alg__strike { position: absolute; top: 50%; left: -2px; width: calc(100% + 4px); height: 1.5px; border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); background: var(--tc-text-muted, var(--_tc-text-muted)); transform: scaleX(0); transform-origin: left; pointer-events: none; transition: transform var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) calc(var(--o, 0) * var(--tc-duration-quick, var(--_tc-duration-quick))); }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__after { min-width: 0; overflow: hidden; color: var(--tc-text-secondary, var(--_tc-text-secondary)); text-overflow: ellipsis; }
/* Undone: a line draws across the text, a beat after each other down the chain, and the row goes quiet */
:where([data-look="clean"], [data-look="clean"] *).ui-alg__strike { position: absolute; top: 50%; left: -2px; width: calc(100% + 4px); height: 1px; border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); background: var(--tc-text-muted, var(--_tc-text-muted)); transform: scaleX(0); transform-origin: left; pointer-events: none; transition: transform var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) calc(var(--o, 0) * var(--tc-duration-quick, var(--_tc-duration-quick))); }
.ui-alg__row[data-undone] .ui-alg__strike { transform: scaleX(1); }
.ui-alg__row[data-undone] :is(.ui-alg__action, .ui-alg__target, .ui-alg__after) { color: var(--tc-text-muted, var(--_tc-text-muted)); transition-delay: calc(var(--o, 0) * var(--tc-duration-quick, var(--_tc-duration-quick))); }
.ui-alg__row[data-undone] .ui-alg__icon { opacity: 0.5; filter: grayscale(1); transition-delay: calc(var(--o, 0) * var(--tc-duration-quick, var(--_tc-duration-quick))); }
/* On the right: one slot – the time, or Undo / Redo on hover, or what an undo does to this row */
:where([data-look="standard"], [data-look="standard"] *).ui-alg__end { position: relative; display: grid; justify-items: end; align-items: center; min-width: 120px; min-height: var(--tc-control-h-sm, var(--_tc-control-h-sm)); }
/* The time only shows – the buttons in the same slot sit on top and get every click */
:where([data-look="standard"], [data-look="standard"] *).ui-alg__time { grid-area: 1 / 1; pointer-events: none; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; font-variant-numeric: tabular-nums; transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
/* On the right: one slot – the time, or Undo / Redo on hover, or what an undo does to this row */
:where([data-look="clean"], [data-look="clean"] *).ui-alg__end { position: relative; display: grid; justify-items: end; align-items: center; min-width: 108px; min-height: var(--tc-control-h-sm, var(--_tc-control-h-sm)); }
/* The time only shows – the buttons in the same slot sit on top and get every click */
:where([data-look="clean"], [data-look="clean"] *).ui-alg__time { grid-area: 1 / 1; pointer-events: none; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; font-variant-numeric: tabular-nums; transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-alg__row[data-undone] .ui-alg__time { color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* Undo / Redo: Button's secondary recipe (Standard) and its ghost recipe (Clean), small size */
.ui-alg__act { position: relative; z-index: 1; grid-area: 1 / 1; display: inline-flex; align-items: center; min-height: var(--tc-control-h-sm, var(--_tc-control-h-sm)); border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm)); font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight)); white-space: nowrap; opacity: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__act { gap: 6px; margin-right: -4px; padding: 0 var(--tc-control-px-sm, var(--_tc-control-px-sm)) 0 calc(var(--tc-control-px-sm, var(--_tc-control-px-sm)) - 2px); background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg)); box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow)); font-size: var(--tc-control-font-size, var(--_tc-control-font-size)); color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg)); transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__act { gap: 5px; margin-right: -6px; padding: 0 var(--tc-control-px-sm, var(--_tc-control-px-sm)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-action-ghost-fg, var(--_tc-action-ghost-fg)); transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__row:is(:hover, :focus-within) .ui-alg__time[data-hide] { opacity: 0; }
.ui-alg__row:is(:hover, :focus-within, [data-preview]) .ui-alg__act { opacity: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__row:is(:hover, :focus-within) .ui-alg__time[data-hide],
:where([data-look="standard"], [data-look="standard"] *).ui-alg__row[data-preview] .ui-alg__time[data-hide] { opacity: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__act:hover { box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__row[data-preview] .ui-alg__act { color: var(--tc-accent-text, var(--_tc-accent-text)); }
/* What an undo does to this row: a status pill (header size) */
.ui-alg__flag { grid-area: 1 / 1; display: inline-flex; align-items: center; gap: 5px; min-height: var(--tc-pill-h-lg, var(--_tc-pill-h-lg)); padding: 0 var(--tc-pill-px-lg, var(--_tc-pill-px-lg)); border-radius: var(--tc-pill-radius, var(--_tc-pill-radius)); font-size: var(--tc-pill-font-size-lg, var(--_tc-pill-font-size-lg)); font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); white-space: nowrap; animation: ui-alg-fade var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
.ui-alg__flag[data-kind="also"] { background: var(--tc-agent-ledger-also-chip-bg); color: var(--tc-accent-text, var(--_tc-accent-text)); }
.ui-alg__flag[data-kind="kept"] { background: var(--tc-status-warning-bg, var(--_tc-status-warning-bg)); color: var(--tc-status-warning-fg, var(--_tc-status-warning-fg)); }
/* ----- Narrow: smaller gaps, the time stands alone ----- */
@container ui-alg (max-width: 480px) {
:where([data-look="standard"], [data-look="standard"] *).ui-alg__sum { flex-basis: 100%; justify-content: space-between; margin-left: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__row { column-gap: 10px; padding: 10px 8px 10px 8px; }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__row + .ui-alg__row::before { left: 50px; right: 8px; }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__end { min-width: 76px; }
  /* The logo already says where – the time stands alone */
:where([data-look="standard"], [data-look="standard"] *).ui-alg__sys { display: none; }
  /* Undo and Redo shrink to their icon – the label stays for screen readers */
:where([data-look="standard"], [data-look="standard"] *).ui-alg__act { width: var(--tc-control-h-sm, var(--_tc-control-h-sm)); justify-content: center; padding: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-alg__act-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
}
:where([data-look="clean"], [data-look="clean"] *).ui-alg__row[data-preview] .ui-alg__time[data-hide] { opacity: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__row[data-preview] .ui-alg__act { background: var(--tc-agent-ledger-also-chip-bg); color: var(--tc-accent-text, var(--_tc-accent-text)); }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__act:hover { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); }
/* ----- Narrow: smaller gaps, the system's name drops from the time ----- */
@container ui-alg (max-width: 480px) {
:where([data-look="clean"], [data-look="clean"] *).ui-alg__sum { flex-basis: 100%; justify-content: space-between; margin-left: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__row { column-gap: 10px; padding: 9px 8px 9px 8px; }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__row + .ui-alg__row::before { left: 46px; right: 8px; }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__end { min-width: 64px; }
  /* The logo already says where – the time stands alone */
:where([data-look="clean"], [data-look="clean"] *).ui-alg__sys { display: none; }
  /* Undo and Redo shrink to their icon – the label stays for screen readers */
:where([data-look="clean"], [data-look="clean"] *).ui-alg__act { width: var(--tc-control-h-sm, var(--_tc-control-h-sm)); justify-content: center; padding: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-alg__act-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
}
/* Touch screens can't point: Undo and Redo show on every row, in place of the time */
@media (hover: none) {
  .ui-alg__act { opacity: 1; }
  .ui-alg__time[data-hide] { opacity: 0; }
}
@keyframes ui-alg-grow { from { min-height: 0; height: 0; padding-top: 0; padding-bottom: 0; } to { height: var(--tc-agent-ledger-row); } }
@keyframes ui-alg-in { from { opacity: 0; transform: translateY(-4px); } }
@keyframes ui-alg-fade { from { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .ui-alg *, .ui-alg *::before, .ui-alg *::after { animation: none !important; transition: none !important; }
}
`;

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

/** True while `ref`'s element intersects the viewport and the tab is visible. Starts true; renders only on a change */
function useOnScreen(ref: RefObject<Element | null>) {
  const [onScreen, setOnScreen] = useState(true);
  useEffect(() => {
    const el = ref.current;
    let inView = true;
    let last = true;
    // Only a real change is set: the observer's first report (visible) costs no render
    const update = () => {
      const next = inView && document.visibilityState !== "hidden";
      if (next !== last) setOnScreen((last = next));
    };
    const io =
      el && typeof IntersectionObserver === "function"
        ? new IntersectionObserver((entries) => {
            inView = entries[entries.length - 1].isIntersecting;
            update();
          })
        : null;
    if (el) io?.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io?.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [ref]);
  return onScreen;
}

/** Connected, not inside something inert or hidden, not disabled */
const focusable = (el: Element | null | undefined): boolean =>
  !!el && el.isConnected && el instanceof HTMLElement && !el.closest("[inert],[hidden]") && !(el as HTMLButtonElement).disabled;

/**
 * Moves focus to the first usable target, but only if focus is inside `from` now (call it before removing, disabling
 * or inerting `from`). Targets may be elements, selectors (looked up inside `within`, default document) or functions.
 */
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
