"use client";

/*
 * Prompt Library – saved prompt templates with variables, in one self-contained file.
 * A short list of templates sits on the left (on top when the card is narrow), with a search field and a tiny category tag.
 * The chosen template shows on the right:
 *   · its text with every {variable} as an inline field – type straight into the sentence
 *   · below it the finished prompt is assembled live; the part you just changed lights up for a moment
 *   · empty variables stay soft placeholders, and a counter says how many are filled
 *   · the gray tray rolls the token estimate as you type; Use stays off until every variable is filled, then pulses once
 *   · switching templates crossfades the content while the highlight slides along the list
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: prompt-library.tsx is Standard,
 * prompt-library-clean.tsx is Clean). Clean drops the gray tray: one white card with hairline shadows whose last
 * row holds the caption, Copy and Use, with 16px icons drawn in thin lines.
 */
// Generated from src/components/prompt-library.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { Fragment, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent, type ReactNode, type Ref } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "clean";
const ROOT_CLASS = "ui-pli";

export type PromptTone = "blue" | "violet" | "amber" | "green" | "red" | "gray";

export type PromptVariable = {
  /** What to put in – shown on the tray while the field is focused or hovered */
  description?: string;
  /** Starts filled with this value */
  default?: string;
};

export type PromptTemplate = {
  id: string;
  title: string;
  /** Small tag next to the title, e.g. "Sales" */
  category?: string;
  /** Color of the tag – by default each category gets its own color in the order they appear */
  tone?: PromptTone;
  /** The prompt with variables in curly braces, e.g. "Summarize this for {audience}" */
  body: string;
  /** Optional details per variable name */
  variables?: Record<string, PromptVariable>;
};

/** What has been typed into the variables: template id → variable name → value */
export type PromptValues = Record<string, Record<string, string>>;

type PromptLibraryOwnProps = {
  templates: PromptTemplate[];
  /** Id of the chosen template (controlled when defined) */
  value?: string;
  /** Id chosen at first when uncontrolled – defaults to the first template */
  defaultValue?: string;
  onSelect?: (id: string) => void;
  /**
   * The variables typed so far, per template (controlled when defined). A variable that's missing here shows its
   * template default
   */
  values?: PromptValues;
  /** The variables to start with when uncontrolled */
  defaultValues?: PromptValues;
  /** Every edit to a variable, with the values of every template */
  onValuesChange?: (values: PromptValues) => void;
  /**
   * Called with the finished prompt when Use is pressed (only possible once every variable is filled). Return a
   * promise to keep Use pending until it settles; a rejection says so on the tray and Use can be pressed again
   */
  onUse?: (prompt: string, template: PromptTemplate, values: Record<string, string>) => void | Promise<unknown>;
  /** Called once the finished prompt is on the clipboard – not when the clipboard refused it */
  onCopy?: (prompt: string) => void;
  title?: string;
  /** Label of the use button */
  useLabel?: string;
  /** Visual style. Defaults to the file's look: Standard in prompt-library.tsx, Clean in prompt-library-clean.tsx */
  look?: Look;
  className?: string;
};

export type PromptLibraryProps = Omit<ComponentPropsWithoutRef<"div">, keyof PromptLibraryOwnProps> &
  PromptLibraryOwnProps & {
    /** The root element */
    ref?: Ref<HTMLDivElement>;
  };

const NO_VALUES: PromptValues = {};
const isPromise = (value: unknown): value is Promise<unknown> =>
  !!value && typeof (value as Promise<unknown>).then === "function";

/* ---------- Helpers ---------- */

const TONES: PromptTone[] = ["blue", "violet", "amber", "green", "red", "gray"];
const VAR = /\{([A-Za-z0-9_-]+)\}/g;

/** A variable keeps the punctuation right after it (its tail), so a line never starts with "." */
type Part = { text: string } | { name: string; tail: string };
const parse = (body: string): Part[] => {
  const parts: Part[] = [];
  let last = 0;
  for (const m of body.matchAll(VAR)) {
    if (m.index > last) parts.push({ text: body.slice(last, m.index) });
    const end = m.index + m[0].length;
    const tail = /^[.,;:!?)\]"'’…]+/.exec(body.slice(end))?.[0] ?? "";
    parts.push({ name: m[1], tail });
    last = end + tail.length;
  }
  if (last < body.length) parts.push({ text: body.slice(last) });
  return parts;
};
const namesOf = (body: string) => [...new Set([...body.matchAll(VAR)].map((m) => m[1]))];
const fill = (body: string, values: Record<string, string>) =>
  body.replace(VAR, (whole, name: string) => (values[name]?.trim() ? values[name] : whole));
/** A rough estimate – about four characters per token */
const estimate = (text: string) => Math.max(1, Math.round(text.length / 4));
const defaults = (t: PromptTemplate) => {
  const v: Record<string, string> = {};
  for (const name of namesOf(t.body)) v[name] = t.variables?.[name]?.default ?? "";
  return v;
};

/**
 * A number that rolls from where it is to its target – without a commit per frame. React renders the returned value,
 * which changes only when a roll starts and when it ends; the frames in between write the rounded value into every
 * `[data-roll]` text under `root` (not into lines fading out).
 */
function useRollingText(root: { current: HTMLElement | null }, target: number, duration: number) {
  const [shown, setShown] = useState(target);
  const current = useRef(target);
  const paint = () => {
    root.current?.querySelectorAll<HTMLElement>("[data-roll]").forEach((n) => {
      const text = n.firstChild;
      if (!text || text.nodeType !== Node.TEXT_NODE || n.closest("[data-out]")) return;
      const next = String(Math.round(current.current));
      if (text.nodeValue !== next) text.nodeValue = next;
    });
  };
  // A commit in the middle of a roll renders `shown` – put the frame's value back before paint
  useLayoutEffect(paint);
  useEffect(() => {
    const from = current.current;
    if (reducedMotion() || from === target) {
      current.current = target;
      setShown(target);
      return;
    }
    setShown(Math.round(from));
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      current.current = from + (target - from) * easeOutQuart(t);
      if (t < 1) {
        paint();
        frame = requestAnimationFrame(step);
      } else setShown(target);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- paint only reads refs
  }, [target, duration]);
  return shown;
}

/**
 * Text that changes without a jump: the old line fades out underneath while the new one fades in.
 */
function Swap({ id, tone, children }: { id: string; tone?: string; children: ReactNode }) {
  type Line = { id: string; tone?: string; node: ReactNode };
  const last = useRef<Line>({ id, tone, node: children });
  const [shownId, setShownId] = useState(id);
  const [out, setOut] = useState<Line | null>(null);
  if (shownId !== id) {
    setShownId(id);
    setOut(last.current);
  }
  // What's on screen, recorded after commit – a render that's thrown away never becomes the line that fades out
  useLayoutEffect(() => {
    last.current = { id, tone, node: children };
  });
  useEffect(() => {
    if (!out) return;
    const timer = window.setTimeout(() => setOut(null), 260);
    return () => window.clearTimeout(timer);
  }, [out]);
  return (
    <span className="ui-pli__swap">
      {out && (
        <span key={`out-${out.id}`} className="ui-pli__swap-item" data-out="" data-tone={out.tone} aria-hidden="true">
          {out.node}
        </span>
      )}
      <span key={id} className="ui-pli__swap-item" data-tone={tone}>
        {children}
      </span>
    </span>
  );
}

/* ---------- Icons ---------- */

/* Standard: 12–13px icons with 1.4px lines */
const stdLine = { stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const StdSearchIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
    <circle cx="5.8" cy="5.8" r="3.8" {...stdLine} />
    <path d="m8.6 8.6 2.4 2.4" {...stdLine} />
  </svg>
);
const StdCopyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <rect x="3.8" y="3.8" width="6.4" height="6.4" rx="1.6" {...stdLine} />
    <path d="M8.2 3.6V3.2A1.4 1.4 0 0 0 6.8 1.8H3.2a1.4 1.4 0 0 0-1.4 1.4v3.6a1.4 1.4 0 0 0 1.4 1.4h.4" {...stdLine} />
  </svg>
);
const StdDoneIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="m2.6 6.3 2.2 2.2 4.6-5" {...stdLine} strokeWidth={1.6} />
  </svg>
);
const StdArrowIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2.5 6h7M6.5 3l3 3-3 3" {...stdLine} />
  </svg>
);

/* Clean: 16px icons with thin lines */
const cleanLine = { stroke: "currentColor", strokeWidth: 1.1, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const CleanSearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="7.25" cy="7.25" r="4.25" {...cleanLine} />
    <path d="m10.5 10.5 3 3" {...cleanLine} />
  </svg>
);
const CleanCopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="5.5" y="5.5" width="8" height="8" rx="1.75" {...cleanLine} />
    <path d="M10.5 5.5V4.25A1.75 1.75 0 0 0 8.75 2.5h-4.5A1.75 1.75 0 0 0 2.5 4.25v4.5c0 .97.78 1.75 1.75 1.75H5.5" {...cleanLine} />
  </svg>
);
const CleanDoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="m3.5 8.25 3 3 6-6.5" {...cleanLine} strokeWidth={1.4} />
  </svg>
);
const CleanArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3.5 8h9M9 4.5 12.5 8 9 11.5" {...cleanLine} strokeWidth={1.25} />
  </svg>
);

const ICONS = {
  standard: { search: <StdSearchIcon />, copy: <StdCopyIcon />, done: <StdDoneIcon />, arrow: <StdArrowIcon /> },
  clean: { search: <CleanSearchIcon />, copy: <CleanCopyIcon />, done: <CleanDoneIcon />, arrow: <CleanArrowIcon /> },
} satisfies Record<Look, Record<string, ReactNode>>;

/* ---------- The template in the detail pane ---------- */

type PanelProps = {
  template: PromptTemplate;
  tone: PromptTone;
  values: Record<string, string>;
  flash: { name: string; n: number } | null;
  idBase: string;
  onChange?: (name: string, value: string) => void;
  onHint?: (name: string | null) => void;
  onEnter?: (name: string) => void;
  out?: boolean;
};

function Panel({ template, tone, values, flash, idBase, onChange, onHint, onEnter, out }: PanelProps) {
  // Parsed when the template changes, not on every keystroke
  const parts = useMemo(() => parse(template.body), [template.body]);
  const names = useMemo(() => namesOf(template.body), [template.body]);
  const filled = names.filter((n) => values[n]?.trim()).length;
  const flashOf = (name: string) =>
    flash && flash.name === name ? (flash.n % 2 ? "a" : "b") : undefined;

  return (
    <div
      className="ui-pli__panel"
      data-out={out ? "" : undefined}
      aria-hidden={out || undefined}
      inert={out}
    >
      <div className="ui-pli__panel-head">
        <span className="ui-pli__panel-title">{template.title}</span>
        {template.category && (
          <span className="ui-pli__tag" data-tone={tone}>
            {template.category}
          </span>
        )}
        {names.length > 0 && (
          <span className="ui-pli__count">
            <span className="ui-pli__bars" aria-hidden="true">
              {names.map((n) => (
                <span key={n} className="ui-pli__bar" data-on={values[n]?.trim() ? "" : undefined} />
              ))}
            </span>
            {filled} of {names.length} filled
          </span>
        )}
      </div>

      {/* The template itself – every variable is a field inside the sentence */}
      <p className="ui-pli__body">
        {parts.map((p, i) =>
          "text" in p ? (
            <Fragment key={i}>{p.text}</Fragment>
          ) : (
            <span key={i} className="ui-pli__glue">
              <span
                className="ui-pli__token"
                data-filled={values[p.name]?.trim() ? "" : undefined}
                data-flash={flashOf(p.name)}
                onPointerEnter={(e) => e.pointerType === "mouse" && onHint?.(p.name)}
                onPointerLeave={(e) => e.pointerType === "mouse" && onHint?.(null)}
              >
                <span className="ui-pli__sizer" aria-hidden="true">
                  {values[p.name] || p.name}
                </span>
                <input
                  className="ui-pli__input"
                  data-var={p.name}
                  size={1}
                  value={values[p.name] ?? ""}
                  placeholder={p.name}
                  aria-label={template.variables?.[p.name]?.description ? `${p.name} – ${template.variables[p.name].description}` : p.name}
                  spellCheck={false}
                  autoComplete="off"
                  onChange={(e) => onChange?.(p.name, e.target.value)}
                  onFocus={() => onHint?.(p.name)}
                  onBlur={() => onHint?.(null)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      onEnter?.(p.name);
                    }
                  }}
                />
              </span>
              {p.tail}
            </span>
          ),
        )}
      </p>

      <div className="ui-pli__label" id={`${idBase}-preview`}>
        Preview
      </div>
      <div className="ui-pli__preview" aria-labelledby={`${idBase}-preview`} role="region">
        {parts.map((p, i) =>
          "text" in p ? (
            <Fragment key={i}>{p.text}</Fragment>
          ) : (
            <span key={i} className="ui-pli__glue">
              {values[p.name]?.trim() ? (
                <span className="ui-pli__fill" data-flash={flashOf(p.name)}>
                  {values[p.name]}
                </span>
              ) : (
                <span className="ui-pli__hole">{`{${p.name}}`}</span>
              )}
              {p.tail}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

/** The templates: a search field, the list with a highlight that slides to the chosen one, arrow keys to move */
function TemplateList({
  uid,
  title,
  total,
  icon,
  query,
  onQuery,
  shown,
  selected,
  onSelect,
  toneOf,
}: {
  uid: string;
  title: string;
  total: number;
  icon: (typeof ICONS)[Look];
  query: string;
  onQuery: (query: string) => void;
  /** The templates matching the search */
  shown: PromptTemplate[];
  selected: PromptTemplate | undefined;
  onSelect: (id: string) => void;
  toneOf: (t: PromptTemplate) => PromptTone;
}) {
  // The highlight slides to the chosen item
  const listRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef(new Map<string, HTMLDivElement>());
  const [glide, setGlide] = useState<{ y: number; h: number; on: boolean; moved: boolean }>({ y: 0, h: 0, on: false, moved: false });
  const shownKey = shown.map((t) => t.id).join("|");
  const selectedKey = selected?.id;
  useLayoutEffect(() => {
    const measure = () => {
      const el = selectedKey === undefined ? undefined : optionRefs.current.get(selectedKey);
      setGlide((g) =>
        el
          ? { y: el.offsetTop, h: el.offsetHeight, on: true, moved: g.on }
          : { ...g, on: false, moved: false },
      );
    };
    measure();
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => ro.disconnect();
  }, [selectedKey, shownKey]);

  const onListKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!shown.length) return;
    const at = shown.findIndex((t) => t.id === selected?.id);
    let next = -1;
    if (e.key === "ArrowDown") next = at < 0 ? 0 : Math.min(shown.length - 1, at + 1);
    else if (e.key === "ArrowUp") next = at < 0 ? shown.length - 1 : Math.max(0, at - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = shown.length - 1;
    else return;
    e.preventDefault();
    onSelect(shown[next].id);
    optionRefs.current.get(shown[next].id)?.focus();
  };

  return (
    <div className="ui-pli__side">
      <div className="ui-pli__side-head">
        <span id={`${uid}-title`} className="ui-pli__title">
          {title}
        </span>
        <span className="ui-pli__total">{total}</span>
      </div>
      <label className="ui-pli__search">
        {icon.search}
        <input
          type="search"
          value={query}
          placeholder="Search templates"
          aria-label="Search templates"
          aria-controls={`${uid}-list`}
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && shown.length) {
              e.preventDefault();
              const target = shown.find((t) => t.id === selected?.id) ?? shown[0];
              onSelect(target.id);
              optionRefs.current.get(target.id)?.focus();
            } else if (e.key === "Escape" && query) {
              e.preventDefault();
              onQuery("");
            }
          }}
        />
      </label>

      <div
        ref={listRef}
        id={`${uid}-list`}
        className="ui-pli__list"
        role="listbox"
        aria-label="Templates"
        onKeyDown={onListKey}
      >
        <span
          className="ui-pli__glide"
          aria-hidden="true"
          data-on={glide.on ? "" : undefined}
          data-moved={glide.moved ? "" : undefined}
          style={{ transform: `translateY(${glide.y}px)`, height: glide.h }}
        />
        {shown.map((t) => {
          const isOn = t.id === selected?.id;
          const focusable = isOn || (!shown.some((s) => s.id === selected?.id) && t === shown[0]);
          return (
            <div
              key={t.id}
              ref={(el) => {
                if (el) optionRefs.current.set(t.id, el);
                else optionRefs.current.delete(t.id);
              }}
              className="ui-pli__option"
              role="option"
              aria-selected={isOn}
              tabIndex={focusable ? 0 : -1}
              onClick={() => onSelect(t.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(t.id);
                }
              }}
            >
              <span className="ui-pli__option-title">{t.title}</span>
              {t.category && (
                <span className="ui-pli__tag" data-tone={toneOf(t)}>
                  {t.category}
                </span>
              )}
            </div>
          );
        })}
        {shown.length === 0 && <div className="ui-pli__empty">No templates match</div>}
      </div>
    </div>
  );
}

/** What the tray says: a note after Copy / Use, the variable pointed at, what's missing, or the token count */
function trayLine({
  note,
  hinted,
  description,
  hintedFilled,
  missing,
  count,
}: {
  note: { id: number; kind: "copied" | "copy-failed" | "used" | "use-failed" } | null;
  hinted: string | null;
  description?: string;
  hintedFilled: boolean;
  /** Variables still empty while Use is pointed at (0 otherwise) */
  missing: number;
  /** The token count as rendered – useRollingText rolls it in the DOM */
  count: number;
}): { caption: ReactNode; key: string; tone?: string } {
  if (note)
    return {
      caption:
        note.kind === "copied" ? "Copied to clipboard"
        : note.kind === "copy-failed" ? "Couldn't copy"
        : note.kind === "use-failed" ? "Couldn't use the prompt"
        : "Prompt sent",
      key: `${note.kind}-${note.id}`,
      tone: note.kind === "copy-failed" || note.kind === "use-failed" ? "error" : "ok",
    };
  if (hinted)
    return {
      caption: (
        <>
          <b>{hinted}</b> · {description ?? (hintedFilled ? "filled" : "fill this in")}
        </>
      ),
      key: `hint-${hinted}`,
    };
  if (missing) return { caption: `Fill ${missing} more to use`, key: "missing" };
  return {
    caption: (
      <>
        ~<span data-roll="">{count}</span> tokens
      </>
    ),
    key: "tokens",
  };
}

/* ---------- Prompt Library ---------- */

export function PromptLibrary({
  templates,
  value,
  defaultValue,
  onSelect,
  values: valuesProp,
  defaultValues = NO_VALUES,
  onValuesChange,
  onUse,
  onCopy,
  title = "Prompts",
  useLabel = "Use prompt",
  look,
  className,
  ref,
  ...rest
}: PromptLibraryProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const uid = useId();
  const [selectedId, setSelectedId] = useControllable(value, defaultValue ?? templates[0]?.id ?? "", onSelect);
  const selected = templates.find((t) => t.id === selectedId) ?? templates[0];

  const [query, setQuery] = useState("");
  const [all, setAll] = useControllable(valuesProp, defaultValues, onValuesChange);
  const valuesOf = (t: PromptTemplate) => ({ ...defaults(t), ...all[t.id] });
  const [flash, setFlash] = useState<{ name: string; n: number } | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [useHover, setUseHover] = useState(false);
  const [note, setNote] = useState<{ id: number; kind: "copied" | "copy-failed" | "used" | "use-failed" } | null>(null);
  const [using, setUsing] = useState(false);
  const notes = useRef(0);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const [said, setSaid] = useState("");

  // Category colors in the order the categories first appear
  const toneOf = useMemo(() => {
    const map = new Map<string, PromptTone>();
    for (const t of templates)
      if (t.category && !map.has(t.category)) map.set(t.category, TONES[map.size % TONES.length]);
    return (t: PromptTemplate): PromptTone => t.tone ?? map.get(t.category ?? "") ?? "gray";
  }, [templates]);

  const q = query.trim().toLowerCase();
  const shown = q
    ? templates.filter((t) => [t.title, t.category ?? "", t.body].some((s) => s.toLowerCase().includes(q)))
    : templates;

  /* ----- Selection ----- */

  const select = (id: string) => setSelectedId(id);

  // The outgoing template stays a moment and fades out underneath the new one
  const [leaving, setLeaving] = useState<{ id: string; key: number } | null>(null);
  const [lastId, setLastId] = useState(selected?.id);
  if (selected && lastId !== selected.id) {
    // Keyed by a count, not the clock: render stays pure. Reduced motion drops it before paint (below)
    if (lastId) setLeaving({ id: lastId, key: (leaving?.key ?? 0) + 1 });
    setLastId(selected.id);
    setHint(null);
    setFlash(null);
  }
  useLayoutEffect(() => {
    if (leaving && reducedMotion()) setLeaving(null);
  }, [leaving]);
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => setLeaving(null), 260);
    return () => window.clearTimeout(timer);
  }, [leaving]);
  const leavingTemplate = leaving ? templates.find((t) => t.id === leaving.id) : undefined;

  /* ----- Values ----- */

  const values = selected ? valuesOf(selected) : {};
  const names = selected ? namesOf(selected.body) : [];
  const missing = names.filter((n) => !values[n]?.trim());
  const ready = Boolean(selected) && missing.length === 0;
  const prompt = selected ? fill(selected.body, values) : "";
  const rootRef = useRef<HTMLDivElement | null>(null);
  const count = useRollingText(rootRef, estimate(prompt), 420);

  const change = (name: string, v: string) => {
    if (!selected) return;
    const id = selected.id;
    setAll((a) => ({ ...a, [id]: { ...defaults(selected), ...a[id], [name]: v } }));
    setFlash((f) => ({ name, n: (f?.n ?? 0) + 1 }));
  };

  // Use pulses once when the last variable gets filled
  const [pulse, setPulse] = useState(0);
  const wasReady = useRef(ready);
  const wasId = useRef(selected?.id);
  useEffect(() => {
    if (ready && !wasReady.current && wasId.current === selected?.id) {
      setPulse((p) => p + 1);
      setSaid("All variables filled");
    }
    wasReady.current = ready;
    wasId.current = selected?.id;
  }, [ready, selected?.id]);

  // The root is ours (Enter moves between fields, the token count rolls) and the consumer's
  const setRoot = useRootRef(rootRef, ref);
  const enter = (name: string) => {
    // Enter moves on to the next field that is still empty, or presses Use when all are filled
    const inputs = [...(rootRef.current?.querySelectorAll<HTMLInputElement>(".ui-pli__panel:not([data-out]) .ui-pli__input") ?? [])];
    const from = inputs.findIndex((i) => i.dataset.var === name);
    const next = [...inputs.slice(from + 1), ...inputs.slice(0, from)].find((i) => !i.value.trim());
    if (next) next.focus();
    else if (ready) sendPrompt();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      // Denied, or no clipboard at all (insecure page): say so instead of "Copied"
      if (!alive.current) return;
      setNote({ id: ++notes.current, kind: "copy-failed" });
      setSaid("Couldn't copy the prompt");
      return;
    }
    if (!alive.current) return;
    onCopy?.(prompt);
    setNote({ id: ++notes.current, kind: "copied" });
    setSaid("Prompt copied");
  };
  // Not named `use`: the hooks lint rule would take it for React's use()
  const sendPrompt = () => {
    // Pressed while off: say why (the reason is also its description), instead of doing nothing silently
    if (selected && !ready && !using) return setSaid(`Fill ${missing.length} more ${missing.length === 1 ? "variable" : "variables"} to use the prompt`);
    if (!ready || !selected || using) return;
    const result = onUse?.(prompt, selected, values);
    const done = () => {
      setNote({ id: ++notes.current, kind: "used" });
      setSaid(`${selected.title} used`);
    };
    if (!isPromise(result)) return done();
    setUsing(true);
    result.then(
      () => {
        if (!alive.current) return;
        setUsing(false);
        done();
      },
      () => {
        if (!alive.current) return;
        setUsing(false);
        setNote({ id: ++notes.current, kind: "use-failed" });
        setSaid("Couldn't use the prompt");
      },
    );
  };
  useEffect(() => {
    if (!note) return;
    const timer = window.setTimeout(() => setNote(null), 1800);
    return () => window.clearTimeout(timer);
  }, [note]);
  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 2000);
    return () => window.clearTimeout(timer);
  }, [said]);

  /* ----- What the tray says ----- */

  const hinted = hint && names.includes(hint) ? hint : null;
  const { caption, key: captionKey, tone: captionTone } = trayLine({
    note,
    hinted,
    description: hinted ? selected?.variables?.[hinted]?.description : undefined,
    hintedFilled: !!(hinted && values[hinted]?.trim()),
    missing: useHover && !ready ? missing.length : 0,
    count,
  });

  const clean = resolvedLook === "clean";
  const icon = ICONS[resolvedLook];

  // The list
  const sideEl = (
    <TemplateList
      uid={uid}
      title={title}
      total={templates.length}
      icon={icon}
      query={query}
      onQuery={setQuery}
      shown={shown}
      selected={selected}
      onSelect={select}
      toneOf={toneOf}
    />
  );

  // The chosen template
  const mainEl = (
    <div className="ui-pli__main">
      {leavingTemplate && (
        <Panel
          key={`out-${leaving!.key}`}
          template={leavingTemplate}
          tone={toneOf(leavingTemplate)}
          values={valuesOf(leavingTemplate)}
          flash={null}
          idBase={`${uid}-out`}
          out
        />
      )}
      {selected && (
        <Panel
          key={selected.id}
          template={selected}
          tone={toneOf(selected)}
          values={values}
          flash={flash}
          idBase={uid}
          onChange={change}
          onHint={setHint}
          onEnter={enter}
        />
      )}
    </div>
  );

  // The tray under the card (Standard) or the card's last row (Clean): caption, Copy and Use
  const footEl = (
    <div className="ui-pli__foot">
      <span className="ui-pli__caption">
        <Swap id={captionKey} tone={captionTone}>
          {caption}
        </Swap>
      </span>
      <button type="button" className="ui-pli__copy" onClick={copy} aria-label="Copy prompt" disabled={!selected}>
        <span className="ui-pli__copy-icon" key={note?.kind === "copied" ? "done" : "copy"} data-done={note?.kind === "copied" ? "" : undefined}>
          {note?.kind === "copied" ? icon.done : icon.copy}
        </span>
        <span className="ui-pli__copy-text">Copy</span>
      </button>
      <button
        type="button"
        className="ui-pli__use"
        aria-disabled={!ready || using}
        aria-busy={using || undefined}
        aria-describedby={!ready && selected ? `${uid}-why` : undefined}
        data-pulse={pulse ? (pulse % 2 ? "a" : "b") : undefined}
        onClick={sendPrompt}
        onPointerEnter={() => setUseHover(true)}
        onPointerLeave={() => setUseHover(false)}
        onFocus={() => setUseHover(true)}
        onBlur={() => setUseHover(false)}
      >
        {useLabel}
        {icon.arrow}
      </button>
      {/* Why Use is off – its description, always there (not only in the hover caption) */}
      {!ready && selected && (
        <span id={`${uid}-why`} className="ui-pli__sr">
          {`Fill ${missing.length} more ${missing.length === 1 ? "variable" : "variables"} to use`}
        </span>
      )}
    </div>
  );

  return (
    <div
      role="group"
      aria-labelledby={`${uid}-title`}
      {...rest}
      ref={setRoot}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={resolvedLook}
    >
      <style href="ui-prompt-library" precedence="default">
        {css}
      </style>

      <div className="ui-pli__card">
        {clean ? (
          <>
            <div className="ui-pli__cols">
              {sideEl}
              {mainEl}
            </div>
            {footEl}
          </>
        ) : (
          <>
            {sideEl}
            {mainEl}
          </>
        )}
      </div>

      {!clean && footEl}
      <span className="ui-pli__sr" role="status">
        {said}
      </span>
    </div>
  );
}

/* ---------- Shared helpers (inlined from src/internal) ---------- */

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

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

/* ---------- Styles ---------- */

const css = /* css */ `
/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
.ui-pli:where([data-look="standard"]),
.ui-pli__portal:where([data-look="standard"]) {
  --_tc-accent: #2f68ff;
  --_tc-accent-subtle: light-dark(rgba(47, 107, 255, 0.08), rgba(79, 130, 255, 0.16));
  --_tc-accent-text: light-dark(#2456d6, #8ab4ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-action-ghost-fg: light-dark(#404040, #c8c8cc);
  --_tc-action-primary-bg: light-dark(#171717, #ededed);
  --_tc-action-primary-bg-active: light-dark(#0a0a0a, #c8c8cc);
  --_tc-action-primary-bg-hover: light-dark(#262626, #ffffff);
  --_tc-action-primary-fg: light-dark(#ffffff, #111113);
  --_tc-action-primary-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-bg: light-dark(#ffffff, #232326);
  --_tc-action-secondary-fg: light-dark(#171717, #ededed);
  --_tc-action-secondary-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-border-selected: light-dark(#2f68ff, #6b95ff);
  --_tc-border-strong: light-dark(#dedede, #3a3a40);
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 32px;
  --_tc-control-h-sm: 28px;
  --_tc-control-px-md: 12px;
  --_tc-control-px-sm: 10px;
  --_tc-control-radius-md: 10px;
  --_tc-control-radius-sm: 8px;
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-reveal-slow: 900ms;
  --_tc-duration-slow: 320ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-field-bg-sunken: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-field-radius: 10px;
  --_tc-field-shadow: inset 0 0 0 1px light-dark(#858585, #7c7c82), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-field-shadow-focus: inset 0 0 0 1px light-dark(#2f68ff, #6b95ff), 0 0 0 3px color-mix(in srgb, light-dark(#2f68ff, #6b95ff) 24%, transparent);
  --_tc-field-shadow-hover: inset 0 0 0 1px light-dark(#646464, #9a9aa1), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-2xs: 10px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-md-plus: 13.5px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-sm-plus: 12.5px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-line-height-display: 32px;
  --_tc-line-height-display-sm: 28px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-tight: 16px;
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 20px;
  --_tc-pill-px: 8px;
  --_tc-pill-radius: 999px;
  --_tc-radius-2xl: 16px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-3xl: 20px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-status-danger-bg: light-dark(#fdecea, #3b1714);
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-bg: light-dark(#e6f6ec, #12301f);
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-warning-bg: light-dark(#fff3e0, #3a2410);
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-sunken: light-dark(#f0f0f0, #111113);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-placeholder: light-dark(#646464, #8e8e95);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-tone-violet-bg: light-dark(rgba(105, 65, 198, 0.1), rgba(150, 110, 240, 0.16));
  --_tc-tone-violet-fg: light-dark(#6941c6, #b9a2f5);
}
.ui-pli:where([data-look="clean"]),
.ui-pli__portal:where([data-look="clean"]) {
  --_tc-accent: light-dark(#0060e2, #1a6cf0);
  --_tc-accent-subtle: light-dark(rgba(0, 96, 226, 0.06), rgba(77, 141, 255, 0.14));
  --_tc-accent-text: light-dark(#0058cf, #70b8ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-action-ghost-fg: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-action-primary-bg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-action-primary-bg-active: light-dark(rgba(0, 0, 0, 0.94), rgba(255, 255, 255, 0.74));
  --_tc-action-primary-bg-hover: light-dark(rgba(0, 0, 0, 0.8), rgba(255, 255, 255, 0.82));
  --_tc-action-primary-fg: light-dark(#fcfcfc, #161618);
  --_tc-action-primary-shadow: none;
  --_tc-action-secondary-bg: light-dark(#ffffff, #252527);
  --_tc-action-secondary-fg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-action-secondary-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-border-selected: light-dark(#0060e2, #5b9aff);
  --_tc-border-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 28px;
  --_tc-control-h-sm: 24px;
  --_tc-control-px-md: 10px;
  --_tc-control-px-sm: 8px;
  --_tc-control-radius-md: 6px;
  --_tc-control-radius-sm: 6px;
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-reveal-slow: 900ms;
  --_tc-duration-slow: 320ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-field-bg-sunken: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-field-radius: 8px;
  --_tc-field-shadow: inset 0 0 0 1px light-dark(rgba(0, 0, 0, 0.48), rgba(255, 255, 255, 0.4));
  --_tc-field-shadow-focus: inset 0 0 0 1px light-dark(#0060e2, #5b9aff), 0 0 0 3px color-mix(in srgb, light-dark(#0060e2, #5b9aff) 24%, transparent);
  --_tc-field-shadow-hover: inset 0 0 0 1px light-dark(rgba(0, 0, 0, 0.6), rgba(255, 255, 255, 0.52));
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-2xs: 10px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-md-plus: 13.5px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-sm-plus: 12.5px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-line-height-display: 32px;
  --_tc-line-height-display-sm: 28px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-tight: 16px;
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 18px;
  --_tc-pill-px: 6px;
  --_tc-pill-radius: 5px;
  --_tc-radius-2xl: 16px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-3xl: 20px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-status-danger-bg: light-dark(rgba(245, 43, 0, 0.094), rgba(255, 53, 35, 0.17));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-bg: light-dark(rgba(0, 164, 51, 0.1), rgba(0, 240, 74, 0.12));
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-warning-bg: light-dark(rgba(255, 156, 0, 0.16), rgba(251, 106, 0, 0.15));
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-sunken: light-dark(#f7f7f7, #161618);
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-placeholder: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.5));
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
  --_tc-tone-violet-bg: light-dark(rgba(91, 91, 214, 0.08), rgba(130, 120, 240, 0.15));
  --_tc-tone-violet-fg: light-dark(#5b45b8, #b7a6f5);
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

:where([data-look="standard"], [data-look="standard"] *).ui-pli {
  /* insets and hover fills: a light grey on the card, lighter than the card in dark mode */
  --tc-prompt-library-well: light-dark(#f4f4f5, #222225);
  /* the flash on a filled-in or inserted value: stronger than --tc-accent-subtle */
  --tc-prompt-library-flash: light-dark(rgba(47, 107, 255, 0.24), rgba(79, 130, 255, 0.36));
  box-sizing: border-box;
  width: 100%;
  max-width: 640px;
  min-width: 0;
  container-type: inline-size;
  padding: 4px;
  border-radius: var(--tc-radius-3xl, var(--_tc-radius-3xl));
  background: var(--tc-surface-sunken, var(--_tc-surface-sunken));
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-pli */
:where([data-look="clean"], [data-look="clean"] *).ui-pli {
  --tc-prompt-library-pulse: light-dark(rgba(0, 0, 0, 0.2), rgba(255, 255, 255, 0.25));
  /* the flash on a filled-in or inserted value: stronger than --tc-accent-subtle */
  --tc-prompt-library-flash: light-dark(rgba(0, 96, 226, 0.16), rgba(77, 141, 255, 0.3));
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  width: 100%;
  max-width: 640px;
  min-width: 0;
  container-type: inline-size;
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
.ui-pli *, .ui-pli *::before, .ui-pli *::after { box-sizing: border-box; }
:where(.ui-pli) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where(.ui-pli) input { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; outline: none; }
.ui-pli button:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
/* List rows: the ring sits inside the row, so its neighbours never cover it */
.ui-pli__option:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: calc(var(--tc-focus-ring-width, var(--_tc-focus-ring-width)) * -1); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-pli) svg { display: block; flex: none; }
.ui-pli b { font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-pli p { margin: 0; }
.ui-pli__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__card { display: grid; grid-template-columns: 220px minmax(0, 1fr); border-radius: var(--tc-radius-2xl, var(--_tc-radius-2xl)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); }
/* ----- List ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-pli__side { min-width: 0; padding: 12px 8px 8px; border-right: 1px solid var(--tc-border-default, var(--_tc-border-default)); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__side-head { display: flex; align-items: center; gap: 6px; height: 22px; padding: 0 6px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__title { overflow: hidden; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__total { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__search { display: flex; align-items: center; gap: 7px; height: 30px; margin-top: 8px; padding: 0 9px; border-radius: var(--tc-field-radius, var(--_tc-field-radius)); background: var(--tc-field-bg-sunken, var(--_tc-field-bg-sunken)); box-shadow: var(--tc-field-shadow, var(--_tc-field-shadow)); color: var(--tc-text-muted, var(--_tc-text-muted)); cursor: text; transition: box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-pli__search:hover { box-shadow: var(--tc-field-shadow-hover, var(--_tc-field-shadow-hover)); }
.ui-pli__search:focus-within { box-shadow: var(--tc-field-shadow-focus, var(--_tc-field-shadow-focus)); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__search input { flex: 1; min-width: 0; height: 100%; font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); color: var(--tc-text-primary, var(--_tc-text-primary)); -webkit-appearance: none; appearance: none; }
.ui-pli__search input::placeholder { color: var(--tc-text-placeholder, var(--_tc-text-placeholder)); }
/* One white card – the edge is a shadow, not a border; the last row sits inside it */
:where([data-look="clean"], [data-look="clean"] *).ui-pli__card { overflow: hidden; border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__cols { display: grid; grid-template-columns: 220px minmax(0, 1fr); }
/* ----- List ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-pli__side { min-width: 0; padding: 12px 8px 8px; border-right: 0.5px solid var(--tc-border-default, var(--_tc-border-default)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__side-head { display: flex; align-items: center; gap: 6px; height: 20px; padding: 0 8px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__title { overflow: hidden; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-strong, var(--_tc-text-strong)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__total { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__search { display: flex; align-items: center; gap: 6px; height: 28px; margin-top: 10px; padding: 0 8px 0 6px; border-radius: var(--tc-field-radius, var(--_tc-field-radius)); background: var(--tc-field-bg-sunken, var(--_tc-field-bg-sunken)); box-shadow: var(--tc-field-shadow, var(--_tc-field-shadow)); color: var(--tc-icon-muted, var(--_tc-icon-muted)); cursor: text; transition: box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__search input { flex: 1; min-width: 0; height: 100%; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); color: var(--tc-text-primary, var(--_tc-text-primary)); caret-color: var(--tc-accent, var(--_tc-accent)); -webkit-appearance: none; appearance: none; }
.ui-pli__search input::-webkit-search-cancel-button { -webkit-appearance: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__list { position: relative; display: flex; flex-direction: column; gap: 2px; margin-top: 6px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__glide { position: absolute; top: 0; left: 0; right: 0; border-radius: 9px; background: var(--tc-prompt-library-well); opacity: 0; pointer-events: none; transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__list { position: relative; isolation: isolate; display: flex; flex-direction: column; gap: 2px; margin-top: 8px; }
/* The chosen row's fill – a short, crisp move to the next row, no long glide */
:where([data-look="clean"], [data-look="clean"] *).ui-pli__glide { position: absolute; top: 0; left: 0; right: 0; z-index: -1; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); background: var(--tc-fill-default, var(--_tc-fill-default)); opacity: 0; pointer-events: none; transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-pli__glide[data-on] { opacity: 1; }
.ui-pli__glide { box-shadow: inset 2px 0 0 var(--tc-border-selected, var(--_tc-border-selected)); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__glide[data-moved] { transition: transform var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), height var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__option { position: relative; display: flex; align-items: center; gap: 8px; height: 34px; padding: 0 6px 0 8px; border-radius: 9px; color: var(--tc-text-secondary, var(--_tc-text-secondary)); cursor: pointer; user-select: none; transition: color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); -webkit-tap-highlight-color: transparent; }
.ui-pli__option::before { content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inherit; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__list { isolation: isolate; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__glide { z-index: -1; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__option:hover:not([aria-selected="true"])::before { background: color-mix(in srgb, var(--tc-prompt-library-well) 55%, transparent); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__option[aria-selected="true"] { color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__glide[data-moved] { transition: transform var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-move, var(--_tc-ease-move)), height var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__option { position: relative; display: flex; align-items: center; gap: 8px; height: 32px; padding: 0 6px 0 8px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); cursor: pointer; user-select: none; transition: color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); -webkit-tap-highlight-color: transparent; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__option:hover:not([aria-selected="true"])::before { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__option:hover,
:where([data-look="clean"], [data-look="clean"] *).ui-pli__option[aria-selected="true"] { color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-pli__option-title { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__empty { height: 34px; padding: 0 8px; font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); line-height: 34px; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__tag { flex: none; height: var(--tc-pill-h, var(--_tc-pill-h)); padding: 0 var(--tc-pill-px, var(--_tc-pill-px)); border-radius: var(--tc-pill-radius, var(--_tc-pill-radius)); font-size: var(--tc-pill-font-size, var(--_tc-pill-font-size)); font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight)); line-height: var(--tc-pill-h, var(--_tc-pill-h)); white-space: nowrap; color: var(--tc-text-secondary, var(--_tc-text-secondary)); background: var(--tc-fill-default, var(--_tc-fill-default)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__empty { height: 32px; padding: 0 8px; line-height: var(--tc-line-height-display, var(--_tc-line-height-display)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* Category tags: a light tint of their color */
:where([data-look="clean"], [data-look="clean"] *).ui-pli__tag { flex: none; height: var(--tc-pill-h, var(--_tc-pill-h)); padding: 0 var(--tc-pill-px, var(--_tc-pill-px)); border-radius: var(--tc-pill-radius, var(--_tc-pill-radius)); font-size: var(--tc-pill-font-size, var(--_tc-pill-font-size)); font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight)); line-height: var(--tc-pill-h, var(--_tc-pill-h)); white-space: nowrap; color: var(--tc-text-secondary, var(--_tc-text-secondary)); background: var(--tc-fill-default, var(--_tc-fill-default)); }
.ui-pli__tag[data-tone="blue"] { color: var(--tc-accent-text, var(--_tc-accent-text)); background: var(--tc-accent-subtle, var(--_tc-accent-subtle)); }
.ui-pli__tag[data-tone="violet"] { color: var(--tc-tone-violet-fg, var(--_tc-tone-violet-fg)); background: var(--tc-tone-violet-bg, var(--_tc-tone-violet-bg)); }
.ui-pli__tag[data-tone="amber"] { color: var(--tc-status-warning-fg, var(--_tc-status-warning-fg)); background: var(--tc-status-warning-bg, var(--_tc-status-warning-bg)); }
.ui-pli__tag[data-tone="green"] { color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); background: var(--tc-status-success-bg, var(--_tc-status-success-bg)); }
.ui-pli__tag[data-tone="red"] { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); }
/* ----- Chosen template: the old one fades out underneath while the new one fades in ----- */
.ui-pli__main { display: grid; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__panel { grid-area: 1 / 1; min-width: 0; padding: 12px 14px 14px; animation: ui-pli-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__panel { grid-area: 1 / 1; min-width: 0; padding: 12px 16px 16px; animation: ui-pli-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
.ui-pli__panel[data-out] { animation: ui-pli-out var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; pointer-events: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__panel-head { display: flex; align-items: center; gap: 8px; min-height: 22px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__panel-title { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-md-plus, var(--_tc-font-size-md-plus)); font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__count { display: inline-flex; flex: none; align-items: center; gap: 7px; margin-left: auto; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__panel-head { display: flex; align-items: center; gap: 8px; min-height: 20px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__panel-title { min-width: 0; overflow: hidden; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-strong, var(--_tc-text-strong)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__count { display: inline-flex; flex: none; align-items: center; gap: 8px; margin-left: auto; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-pli__bars { display: inline-flex; gap: 2px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__bar { width: 8px; height: 4px; border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); background: var(--tc-border-default, var(--_tc-border-default)); transition: background-color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__bar { width: 6px; height: 6px; border-radius: 1.5px; background: var(--tc-fill-default, var(--_tc-fill-default)); transition: background-color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-pli__bar[data-on] { background: var(--tc-accent, var(--_tc-accent)); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__body { margin-top: 10px !important; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: 26px; color: var(--tc-text-secondary, var(--_tc-text-secondary)); overflow-wrap: anywhere; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__body { margin-top: 10px !important; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-display-sm, var(--_tc-line-height-display-sm)); color: var(--tc-text-primary, var(--_tc-text-primary)); overflow-wrap: anywhere; }
.ui-pli__glue { white-space: nowrap; }
.ui-pli__preview .ui-pli__glue { white-space: inherit; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__token { position: relative; display: inline-grid; vertical-align: top; max-width: 100%; height: 22px; margin: 2px 0; padding: 0 6px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); background: var(--tc-prompt-library-well); box-shadow: inset 0 0 0 1px var(--tc-border-default, var(--_tc-border-default)); line-height: var(--tc-line-height-relaxed, var(--_tc-line-height-relaxed)); color: var(--tc-text-muted, var(--_tc-text-muted)); cursor: text; transition: background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__token:hover { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tc-text-muted, var(--_tc-text-muted)) 45%, transparent); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__token[data-filled] { background: var(--tc-accent-subtle, var(--_tc-accent-subtle)); box-shadow: none; color: var(--tc-accent-text, var(--_tc-accent-text)); }
.ui-pli__token:focus-within { box-shadow: var(--tc-field-shadow-focus, var(--_tc-field-shadow-focus)); }
/* A variable: an empty one is a soft field, a filled one a light accent tint */
:where([data-look="clean"], [data-look="clean"] *).ui-pli__token { position: relative; display: inline-grid; vertical-align: top; max-width: 100%; height: 22px; margin: 3px 0; padding: 0 6px; border-radius: 5px; background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); box-shadow: inset 0 0 0 0.5px var(--tc-border-strong, var(--_tc-border-strong)); line-height: var(--tc-line-height-relaxed, var(--_tc-line-height-relaxed)); color: var(--tc-text-primary, var(--_tc-text-primary)); cursor: text; transition: background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__token:hover { background: var(--tc-fill-default, var(--_tc-fill-default)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__token[data-filled] { background: var(--tc-accent-subtle, var(--_tc-accent-subtle)); box-shadow: inset 0 0 0 0.5px transparent; }
.ui-pli__token[data-flash="a"] { animation: ui-pli-flash-a var(--tc-duration-reveal-slow, var(--_tc-duration-reveal-slow)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)); }
.ui-pli__token[data-flash="b"] { animation: ui-pli-flash-b var(--tc-duration-reveal-slow, var(--_tc-duration-reveal-slow)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)); }
.ui-pli__sizer, .ui-pli__input { grid-area: 1 / 1; min-width: 2ch; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-relaxed, var(--_tc-line-height-relaxed)); white-space: pre; }
.ui-pli__sizer { padding-right: 1px; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); visibility: hidden; overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__input { width: 100%; height: 22px; color: inherit; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__input { width: 100%; height: 22px; color: inherit; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); text-overflow: ellipsis; caret-color: var(--tc-accent, var(--_tc-accent)); }
.ui-pli__input::placeholder { color: var(--tc-text-placeholder, var(--_tc-text-placeholder)); font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular)); opacity: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__label { margin-top: 12px; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__preview { margin-top: 4px; padding: 9px 11px; border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); background: var(--tc-prompt-library-well); font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); white-space: pre-wrap; overflow-wrap: anywhere; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__label { margin-top: 12px; font-size: var(--tc-font-size-2xs, var(--_tc-font-size-2xs)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); letter-spacing: 0.5px; text-transform: uppercase; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__preview { margin-top: 4px; padding: 8px 12px; border-radius: var(--tc-radius-md, var(--_tc-radius-md)); background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); box-shadow: inset 0 0 0 0.5px var(--tc-border-default, var(--_tc-border-default)); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); white-space: pre-wrap; overflow-wrap: anywhere; }
.ui-pli__fill { border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); color: var(--tc-text-primary, var(--_tc-text-primary)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); box-decoration-break: clone; -webkit-box-decoration-break: clone; }
.ui-pli__fill[data-flash="a"] { animation: ui-pli-mark-a 1100ms var(--tc-ease-decelerate, var(--_tc-ease-decelerate)); }
.ui-pli__fill[data-flash="b"] { animation: ui-pli-mark-b 1100ms var(--tc-ease-decelerate, var(--_tc-ease-decelerate)); }
/* An unfilled variable in the preview is real text: muted, not the disabled grey */
.ui-pli__hole { color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* ----- Tray ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-pli__foot { display: flex; align-items: center; gap: 4px; min-height: 40px; padding: 4px 2px 0 10px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__caption { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
/* ----- The last row: caption, Copy and Use ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-pli__foot { display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 8px 0 16px; border-top: 0.5px solid var(--tc-border-default, var(--_tc-border-default)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__caption { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.ui-pli__swap { display: grid; min-width: 0; }
.ui-pli__swap-item { grid-area: 1 / 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; animation: ui-pli-swap-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
.ui-pli__swap-item[data-out] { animation: ui-pli-swap-out var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
.ui-pli__swap-item[data-tone="error"] { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
.ui-pli__swap-item[data-tone="ok"] { color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__copy { display: inline-flex; flex: none; align-items: center; gap: 5px; height: var(--tc-control-h-sm, var(--_tc-control-h-sm)); padding: 0 calc(var(--tc-control-px-sm, var(--_tc-control-px-sm)) - 1px) 0 calc(var(--tc-control-px-sm, var(--_tc-control-px-sm)) - 2px); border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm)); font-size: var(--tc-control-font-size, var(--_tc-control-font-size)); font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight)); color: var(--tc-action-ghost-fg, var(--_tc-action-ghost-fg)); white-space: nowrap; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__copy:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__copy-icon { display: grid; place-items: center; width: 12px; height: 12px; animation: ui-pli-swap-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__use { position: relative; display: inline-flex; flex: none; align-items: center; gap: 5px; height: var(--tc-control-h-sm, var(--_tc-control-h-sm)); padding: 0 calc(var(--tc-control-px-sm, var(--_tc-control-px-sm)) - 1px) 0 var(--tc-control-px-sm, var(--_tc-control-px-sm)); border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm)); background: var(--tc-action-primary-bg, var(--_tc-action-primary-bg)); box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow)); font-size: var(--tc-control-font-size, var(--_tc-control-font-size)); font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight)); color: var(--tc-action-primary-fg, var(--_tc-action-primary-fg)); white-space: nowrap; transition: background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-pli__use svg { transition: transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)); }
/* Copy: the secondary button – white with the card's hairline */
:where([data-look="clean"], [data-look="clean"] *).ui-pli__copy { display: inline-flex; flex: none; align-items: center; gap: 6px; height: var(--tc-control-h-md, var(--_tc-control-h-md)); padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md)) 0 calc(var(--tc-control-px-md, var(--_tc-control-px-md)) - 2px); border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md)); background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg)); box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow)); font-size: var(--tc-control-font-size, var(--_tc-control-font-size)); font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight)); color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg)); white-space: nowrap; transition: box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__copy:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__copy-icon { display: grid; place-items: center; width: 16px; height: 16px; color: var(--tc-icon-muted, var(--_tc-icon-muted)); animation: ui-pli-swap-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__copy-icon[data-done] { color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
/* Use: the primary dark chip */
:where([data-look="clean"], [data-look="clean"] *).ui-pli__use { position: relative; display: inline-flex; flex: none; align-items: center; gap: 6px; height: var(--tc-control-h-md, var(--_tc-control-h-md)); padding: 0 calc(var(--tc-control-px-md, var(--_tc-control-px-md)) - 2px) 0 var(--tc-control-px-md, var(--_tc-control-px-md)); border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md)); background: var(--tc-action-primary-bg, var(--_tc-action-primary-bg)); box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow)); font-size: var(--tc-control-font-size, var(--_tc-control-font-size)); font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight)); color: var(--tc-action-primary-fg, var(--_tc-action-primary-fg)); white-space: nowrap; transition: background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-pli__use:hover:not([aria-disabled="true"]) { background: var(--tc-action-primary-bg-hover, var(--_tc-action-primary-bg-hover)); }
.ui-pli__use:active:not([aria-disabled="true"]) { background: var(--tc-action-primary-bg-active, var(--_tc-action-primary-bg-active)); }
.ui-pli__use:hover:not([aria-disabled="true"]) svg { transform: translateX(2px); }
.ui-pli__use[aria-disabled="true"] { background: var(--tc-fill-default, var(--_tc-fill-default)); box-shadow: none; color: var(--tc-text-muted, var(--_tc-text-muted)); cursor: default; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__use[data-pulse="a"] { animation: ui-pli-pulse-a 1400ms var(--tc-ease-decelerate, var(--_tc-ease-decelerate)); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__use[data-pulse="b"] { animation: ui-pli-pulse-b 1400ms var(--tc-ease-decelerate, var(--_tc-ease-decelerate)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__use[data-pulse="a"] { animation: ui-pli-pulse-a-clean 1400ms var(--tc-ease-decelerate, var(--_tc-ease-decelerate)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__use[data-pulse="b"] { animation: ui-pli-pulse-b-clean 1400ms var(--tc-ease-decelerate, var(--_tc-ease-decelerate)); }
@keyframes ui-pli-in { from { opacity: 0; filter: blur(2px); transform: translateY(3px); } }
@keyframes ui-pli-out { to { opacity: 0; filter: blur(2px); } }
@keyframes ui-pli-swap-in { from { opacity: 0; filter: blur(2px); } }
@keyframes ui-pli-swap-out { from { opacity: 1; } to { opacity: 0; filter: blur(2px); } }
@keyframes ui-pli-flash-a { from { background-color: var(--tc-prompt-library-flash); } }
@keyframes ui-pli-flash-b { from { background-color: var(--tc-prompt-library-flash); } }
@keyframes ui-pli-mark-a { from { background-color: var(--tc-prompt-library-flash); box-shadow: 0 0 0 2px var(--tc-prompt-library-flash); } to { background-color: transparent; box-shadow: 0 0 0 2px transparent; } }
@keyframes ui-pli-mark-b { from { background-color: var(--tc-prompt-library-flash); box-shadow: 0 0 0 2px var(--tc-prompt-library-flash); } to { background-color: transparent; box-shadow: 0 0 0 2px transparent; } }
@keyframes ui-pli-pulse-a { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--tc-text-primary, var(--_tc-text-primary)) 30%, transparent); } 60%, 100% { box-shadow: 0 0 0 8px transparent; } }
@keyframes ui-pli-pulse-b { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--tc-text-primary, var(--_tc-text-primary)) 30%, transparent); } 60%, 100% { box-shadow: 0 0 0 8px transparent; } }
/* Narrow: the list moves on top, the copy button keeps only its icon */
@container (max-width: 540px) {
:where([data-look="standard"], [data-look="standard"] *).ui-pli__card { grid-template-columns: minmax(0, 1fr); }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__side { border-right: 0; border-bottom: 1px solid var(--tc-border-default, var(--_tc-border-default)); }
}
@container (max-width: 360px) {
:where([data-look="standard"], [data-look="standard"] *).ui-pli__copy { width: 28px; padding: 0; justify-content: center; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__copy-text { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__count .ui-pli__bars { display: none; }
}
@media (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-pli__option { height: 40px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__search { height: 36px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__copy,
:where([data-look="standard"], [data-look="standard"] *).ui-pli__use { height: 34px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__body { line-height: 30px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pli__token,
:where([data-look="standard"], [data-look="standard"] *).ui-pli__input,
:where([data-look="standard"], [data-look="standard"] *).ui-pli__sizer { height: 26px; line-height: 26px; }
}
@keyframes ui-pli-pulse-a-clean { 0% { box-shadow: 0 0 0 0 var(--tc-prompt-library-pulse); } 60%, 100% { box-shadow: 0 0 0 6px transparent; } }
@keyframes ui-pli-pulse-b-clean { 0% { box-shadow: 0 0 0 0 var(--tc-prompt-library-pulse); } 60%, 100% { box-shadow: 0 0 0 6px transparent; } }
/* Narrow: the list moves on top, the copy button keeps only its icon */
@container (max-width: 540px) {
:where([data-look="clean"], [data-look="clean"] *).ui-pli__cols { grid-template-columns: minmax(0, 1fr); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__side { border-right: 0; border-bottom: 0.5px solid var(--tc-border-default, var(--_tc-border-default)); }
}
@container (max-width: 360px) {
:where([data-look="clean"], [data-look="clean"] *).ui-pli__copy { width: 28px; padding: 0; justify-content: center; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__copy-text { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__count .ui-pli__bars { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__panel { padding: 12px 12px 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__foot { padding-left: 12px; }
}
/* Touch screens: taller targets */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-pli__option { height: 40px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__search { height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__copy,
:where([data-look="clean"], [data-look="clean"] *).ui-pli__use { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__copy { padding-right: 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__foot { height: 50px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__body { line-height: var(--tc-line-height-display, var(--_tc-line-height-display)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pli__token,
:where([data-look="clean"], [data-look="clean"] *).ui-pli__input,
:where([data-look="clean"], [data-look="clean"] *).ui-pli__sizer { height: 26px; line-height: 26px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-pli *, .ui-pli *::before, .ui-pli *::after { animation: none !important; transition: none !important; }
}
`;
