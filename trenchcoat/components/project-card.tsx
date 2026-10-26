"use client";

/*
 * Project Card – a two-line summary that quietly grows into the full picture, in a single self-contained file.
 * The progress is a ring cut into one segment per subtask. Nothing flies around when the card opens: the head stays
 * where it is and the list unfolds below it. The life is inside the open card instead –
 *   · hover a subtask and its segment lights up in the ring (and the other way round); click either to tick it
 *   · hover a person to see only their subtasks, click to keep that view
 *   · click the status to pick another one from a row that unfolds in place
 *   · the line on the gray tray always says what you are pointing at
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: project-card.tsx is Standard,
 * project-card-clean.tsx is Clean). Clean has no tray – one white card with hairline shadows, quiet gray type,
 * tinted tags, a plain colored dot in front of each status option, thinner status icons, and the caption and
 * action as the card's last row instead of on the gray tray.
 */
// Generated from src/components/project-card.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent, type PointerEvent, type ReactNode, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-pc";

export type ProjectTask = {
  id: string;
  label: string;
  done?: boolean;
  /** Name of a member – shows their avatar on the row and powers the people filter */
  assignee?: string;
};
export type ProjectMember = {
  name: string;
  /** Image URL – initials on a soft color when left out */
  avatar?: string;
};
export type ProjectTone = "red" | "amber" | "green" | "blue" | "violet" | "gray";
export type ProjectOption = {
  id: string;
  label: string;
  /** Color of the tag – also picks its icon: violet or gray = not started, amber = in progress, blue = in review, green = done, red = blocked */
  tone?: ProjectTone;
  /** Replaces the icon that comes with the tone */
  icon?: ReactNode;
};

type OwnProps = {
  /** Visual style. Defaults to the file's look: Standard in project-card.tsx, Clean in project-card-clean.tsx */
  look?: Look;
  title: string;
  /**
   * Subtasks – one ring segment and one row each (controlled): ticks are only reported through `onTasksChange`, so
   * pass the new list back. Use `defaultTasks` to let the card keep the ticks itself
   */
  tasks?: ProjectTask[];
  /** Starting subtasks when `tasks` isn't controlled */
  defaultTasks?: ProjectTask[];
  /** Called with the full list after a subtask was ticked or unticked */
  onTasksChange?: (tasks: ProjectTask[]) => void;
  /** Options of the status picker */
  statuses?: ProjectOption[];
  /** The chosen status id (controlled) */
  status?: string;
  /** Starting status id when `status` isn't controlled – defaults to the first option */
  defaultStatus?: string;
  onStatusChange?: (id: string) => void;
  /** Ready-to-show due date, e.g. "Oct 24" */
  due?: string;
  members?: ProjectMember[];
  /** A button on the tray of the open card (Clean: in its last row), e.g. { label: "Open", onClick } */
  action?: { label: string; onClick: () => void };
  /** Replaces the line on the tray (Clean: in the last row) while nothing is hovered */
  hint?: ReactNode;
  /** "hover" opens under the pointer (taps and the keyboard still toggle), "click" only on click */
  trigger?: "hover" | "click";
  /** Controlled open state */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export type ProjectCardProps = Omit<ComponentPropsWithoutRef<"div">, keyof OwnProps> & OwnProps;

/* ---------- Helpers ---------- */

const NO_TASKS: ProjectTask[] = [];
const DEFAULT_STATUSES: ProjectOption[] = [
  { id: "todo", label: "To do", tone: "violet" },
  { id: "progress", label: "In progress", tone: "amber" },
  { id: "review", label: "In review", tone: "blue" },
  { id: "done", label: "Done", tone: "green" },
];
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
/** A steady soft color per name */
const hue = (name: string) =>
  [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

/** One arc of the ring, from `from` to `to` (0–1 around the circle, starting at the top) */
function arc(from: number, to: number, r: number, c: number) {
  const point = (t: number) => {
    const a = t * Math.PI * 2 - Math.PI / 2;
    return `${(c + r * Math.cos(a)).toFixed(2)} ${(c + r * Math.sin(a)).toFixed(2)}`;
  };
  return `M ${point(from)} A ${r} ${r} 0 ${to - from > 0.5 ? 1 : 0} 1 ${point(to)}`;
}

/** The icon in front of a status – one per tone, so custom statuses get a fitting one for free */
function ToneIcon({ look, tone }: { look: Look; tone: ProjectTone }) {
  // Clean draws thinner lines
  const line = { stroke: "currentColor", strokeWidth: look === "clean" ? 1.2 : 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      {(tone === "gray" || tone === "violet") && <circle cx="6" cy="6" r="4.25" {...line} strokeDasharray="2.2 2.25" />}
      {tone === "amber" && (
        <>
          <circle cx="6" cy="6" r="4.25" {...line} />
          <path d="M6 3.4a2.6 2.6 0 0 1 0 5.2V3.4Z" fill="currentColor" />
        </>
      )}
      {tone === "blue" && (
        <>
          <path d="M1.2 6S3 2.7 6 2.7 10.8 6 10.8 6 9 9.3 6 9.3 1.2 6 1.2 6Z" {...line} />
          <circle cx="6" cy="6" r="1.4" fill="currentColor" />
        </>
      )}
      {tone === "green" && (
        <>
          <circle cx="6" cy="6" r="4.25" {...line} />
          <path d="m4.1 6.1 1.3 1.3 2.5-2.7" {...line} />
        </>
      )}
      {tone === "red" && (
        <>
          <circle cx="6" cy="6" r="4.25" {...line} />
          <path d="M6 3.8v2.6M6 8.2v.01" {...line} />
        </>
      )}
    </svg>
  );
}
const ArrowIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M2.5 6h7M6.5 3l3 3-3 3"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const CheckMark = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
  >
    <circle className="ui-pc__ring" cx="8" cy="8" r="6.3" />
    <circle className="ui-pc__disc" cx="8" cy="8" r="7" />
    <path className="ui-pc__tick" d="m5.2 8.2 1.9 1.9 3.7-4" />
  </svg>
);

function Avatar({ member }: { member: ProjectMember }) {
  return (
    <span
      className="ui-pc__avatar"
      aria-hidden="true"
      style={{ ["--tc-project-card-hue" as string]: hue(member.name) }}
    >
      {member.avatar ? (
        <img src={member.avatar} alt="" />
      ) : (
        initials(member.name)
      )}
    </span>
  );
}

type Subtask = ProjectTask & { done: boolean };

/** What the tray says: the subtask or the person you point at, else how much is left */
function trayCaption(list: Subtask[], hot: string | null, person: string | null, hint: ReactNode) {
  const hotTask = list.find((t) => t.id === hot);
  const left = list.length - list.filter((t) => t.done).length;
  if (hotTask) {
    return {
      caption: hotTask.assignee ? (
        <>
          {hotTask.done ? "Done by" : "Assigned to"} <b>{hotTask.assignee}</b>
        </>
      ) : hotTask.done ? (
        "Done"
      ) : (
        "Nobody on it yet"
      ),
      captionKey: `task-${hotTask.id}`,
    };
  }
  if (person) {
    const own = list.filter((t) => t.assignee === person);
    return {
      caption: (
        <>
          <b>{person}</b> · {own.filter((t) => t.done).length} of {own.length}{" "}
          done
        </>
      ),
      captionKey: `person-${person}`,
    };
  }
  return { caption: hint ?? (left === 0 ? "All done" : `${left} left`), captionKey: "rest" };
}

/** The ring: one segment per subtask, with a small gap in between – and the count of done ones in it */
function ProgressRing({
  list,
  doneCount,
  isOpen,
  hot,
  theirs,
  onHot,
  onToggle,
}: {
  list: Subtask[];
  doneCount: number;
  isOpen: boolean;
  hot: string | null;
  theirs: (t: ProjectTask) => boolean;
  onHot: (id: string | null) => void;
  onToggle: (id: string) => void;
}) {
  const SIZE = 32;
  const R = 12.5;
  const gap = list.length > 1 ? 0.055 : 0;
  const slice = 1 / Math.max(list.length, 1);
  return (
    <span className="ui-pc__progress" data-live={isOpen ? "" : undefined}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        fill="none"
        aria-hidden="true"
        onPointerLeave={() => onHot(null)}
      >
        {list.length === 1 ? (
          <circle
            className="ui-pc__seg"
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            data-done={list[0].done ? "" : undefined}
            data-hot={hot === list[0].id ? "" : undefined}
            onPointerEnter={() => onHot(list[0].id)}
            onClick={() => onToggle(list[0].id)}
          />
        ) : (
          list.map((t, i) => (
            <path
              key={t.id}
              className="ui-pc__seg"
              d={arc(i * slice + gap / 2, (i + 1) * slice - gap / 2, R, SIZE / 2)}
              data-done={t.done ? "" : undefined}
              data-hot={hot === t.id ? "" : undefined}
              data-dim={theirs(t) ? undefined : ""}
              onPointerEnter={() => onHot(t.id)}
              onClick={() => onToggle(t.id)}
            />
          ))
        )}
      </svg>
      <span className="ui-pc__num" key={doneCount}>
        {doneCount}
      </span>
    </span>
  );
}

/** The people: point at one to see only their subtasks, click to keep it */
function PeopleRow({
  members,
  person,
  pinned,
  isOpen,
  onPeek,
  onPin,
}: {
  members: ProjectMember[];
  person: string | null;
  pinned: string | null;
  isOpen: boolean;
  onPeek: (name: string | null) => void;
  onPin: (update: (p: string | null) => string | null) => void;
}) {
  return (
    <span className="ui-pc__people" onPointerLeave={() => onPeek(null)}>
      {members.map((m) => (
        <button
          key={m.name}
          type="button"
          className="ui-pc__member"
          aria-pressed={pinned === m.name}
          data-on={person === m.name ? "" : undefined}
          data-off={person && person !== m.name ? "" : undefined}
          tabIndex={isOpen ? 0 : -1}
          onPointerEnter={(e) => e.pointerType === "mouse" && onPeek(m.name)}
          onFocus={() => onPeek(m.name)}
          onBlur={() => onPeek(null)}
          onClick={() => onPin((p) => (p === m.name ? null : m.name))}
        >
          {/* The name in words, the initials only as a picture – so the visible text never contradicts the name */}
          <span className="ui-pc__sr">Only {m.name}'s subtasks</span>
          <Avatar member={m} />
        </button>
      ))}
    </span>
  );
}

/** The status picker – unfolds in place */
function StatusPicker({
  id,
  statuses,
  current,
  choosing,
  look,
  onPick,
  onMove,
}: {
  id: string;
  statuses: ProjectOption[];
  current?: string;
  choosing: boolean;
  look: Look;
  /** A click, Enter or Space: choose and fold the row */
  onPick: (id: string) => void;
  /** The arrow keys: choose and stay (the radio pattern) */
  onMove: (id: string) => void;
}) {
  const at = Math.max(0, statuses.findIndex((o) => o.id === current));
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    const to = e.key === "Home" ? 0 : e.key === "End" ? statuses.length - 1 : step ? (at + step + statuses.length) % statuses.length : -1;
    if (to < 0 || !statuses.length) return;
    e.preventDefault();
    onMove(statuses[to].id);
    e.currentTarget.querySelectorAll<HTMLElement>("[role=radio]")[to]?.focus();
  };
  return (
    <div id={id} className="ui-pc__fold ui-pc__fold--status" data-open={choosing ? "" : undefined} inert={!choosing}>
      <div className="ui-pc__clip">
        {/* A radiogroup with the radio pattern: one tab stop, arrow keys choose, a click or Enter chooses and folds */}
        <div className="ui-pc__options" role="radiogroup" aria-label="Status" onKeyDown={onKeyDown}>
          {statuses.map((o, i) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={o.id === current}
              tabIndex={i === at ? 0 : -1}
              className="ui-pc__option"
              data-tone={o.tone ?? "gray"}
              onClick={() => onPick(o.id)}
            >
              {/* Standard: the tone's icon · Clean: a plain colored dot */}
              {o.icon ?? (look === "clean" ? <span className="ui-pc__dot" aria-hidden="true" /> : <ToneIcon look={look} tone={o.tone ?? "gray"} />)}
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The subtasks as checkboxes, each with its owner */
function TaskList({
  list,
  members,
  hot,
  theirs,
  onHot,
  onToggle,
}: {
  list: Subtask[];
  members: ProjectMember[];
  hot: string | null;
  theirs: (t: ProjectTask) => boolean;
  onHot: (id: string | null) => void;
  onToggle: (id: string) => void;
}) {
  return (
    <ul className="ui-pc__tasks" onPointerLeave={() => onHot(null)}>
      {list.map((t) => {
        const owner = members.find((m) => m.name === t.assignee);
        return (
          <li key={t.id}>
            <button
              type="button"
              className="ui-pc__task"
              role="checkbox"
              aria-checked={t.done}
              data-hot={hot === t.id ? "" : undefined}
              data-dim={theirs(t) ? undefined : ""}
              onPointerEnter={(e) => e.pointerType === "mouse" && onHot(t.id)}
              onFocus={() => onHot(t.id)}
              onBlur={() => onHot(null)}
              onClick={() => onToggle(t.id)}
            >
              <CheckMark />
              <span className="ui-pc__label">{t.label}</span>
              {owner && <Avatar member={owner} />}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function ProjectCard({
  look,
  title,
  tasks: tasksProp,
  defaultTasks = NO_TASKS,
  onTasksChange,
  statuses = DEFAULT_STATUSES,
  status: statusProp,
  defaultStatus,
  onStatusChange,
  due,
  members = [],
  action,
  hint,
  trigger = "hover",
  open,
  defaultOpen = false,
  onOpenChange,
  className,
  ref,
  onPointerEnter,
  onPointerLeave,
  onKeyDown: onKeyDownProp,
  ...rest
}: ProjectCardProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const uid = useId();
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);

  // Ticks and status: controlled when their value prop is defined, kept here otherwise – reported either way
  const [tasks, setTasks] = useControllable(tasksProp, defaultTasks, onTasksChange);
  const [status, setStatus] = useControllable<string | undefined>(statusProp, defaultStatus, (id) => id !== undefined && onStatusChange?.(id));
  const list = tasks.map((t) => ({ ...t, done: Boolean(t.done) }));
  const doneCount = list.filter((t) => t.done).length;
  const statusNow = statuses.find((o) => o.id === status) ?? statuses[0];

  /** The subtask under the pointer (row or ring segment) */
  const [hot, setHot] = useState<string | null>(null);
  /** The person under the pointer, and the one that was clicked to stay */
  const [peek, setPeek] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [choosing, setChoosing] = useState(false);
  const person = peek ?? pinned;
  const theirs = (t: ProjectTask) => !person || t.assignee === person;

  const rootRef = useRef<HTMLDivElement | null>(null);
  // The root goes to our own ref and to the consumer's
  const setRoot = useRootRef(rootRef, ref);
  const statusBtn = () => rootRef.current?.querySelector<HTMLElement>(".ui-pc__status");
  const toggleBtn = () => rootRef.current?.querySelector<HTMLElement>(".ui-pc__toggle");
  /** Before the status row folds (inert): focus that was in it goes back to the status tag */
  const closePicker = () => {
    rescueFocus(rootRef.current?.querySelector(".ui-pc__fold--status"), [statusBtn]);
    setChoosing(false);
  };
  // Anything else that folds away with focus in it (the pointer left, a press outside): back to the head
  useFocusRescue(rootRef, { fallback: () => toggleBtn() });

  /* ---------- Opening and closing ---------- */

  const timer = useRef(0);
  const change = (next: boolean) => {
    window.clearTimeout(timer.current);
    if (!next) {
      // The body and tray go inert: focus inside them goes to the head first
      rescueFocus(rootRef.current?.querySelector(`[id="${uid}-body"]`), [toggleBtn]);
      rescueFocus(rootRef.current?.querySelector(".ui-pc__fold--tray"), [toggleBtn]);
      setChoosing(false);
      setHot(null);
      setPeek(null);
    }
    setOpen(next);
  };
  const later = (next: boolean, ms: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => change(next), ms);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const hover = trigger === "hover";
  const onEnter = (e: PointerEvent<HTMLDivElement>) => {
    onPointerEnter?.(e);
    if (hover && e.pointerType === "mouse") later(true, 90);
  };
  const onLeave = (e: PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(e);
    if (hover && e.pointerType === "mouse") later(false, 220);
  };

  // While open, a press outside closes it
  useEffect(() => {
    if (!isOpen) return;
    const down = (e: globalThis.PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return;
      window.clearTimeout(timer.current);
      setChoosing(false);
      setHot(null);
      setPeek(null);
      setOpen(false);
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  }, [isOpen, setOpen]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDownProp?.(e);
    if (e.key !== "Escape" || !isOpen) return;
    e.stopPropagation();
    if (choosing) return closePicker();
    change(false);
    toggleBtn()?.focus({ preventScroll: true });
  };

  /* ---------- Editing ---------- */

  const toggle = (id: string) => setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const pick = (id: string) => {
    setStatus(id);
    closePicker();
  };

  /* ---------- What the tray says ---------- */

  const { caption, captionKey } = trayCaption(list, hot, person, hint);

  // Standard: the gray tray under the card · Clean: the last row inside the card. Either way it says what you are
  // pointing at, and holds the action
  const tray = (
    <div className="ui-pc__fold ui-pc__fold--tray" inert={!isOpen}>
      <div className="ui-pc__clip">
        <div className="ui-pc__foot">
          {/* Not live: it follows the pointer, and every change it describes is announced by its own control */}
          <span className="ui-pc__caption">
            <span key={captionKey}>{caption}</span>
          </span>
          {action && (
            <button
              type="button"
              className="ui-pc__action"
              onClick={action.onClick}
            >
              {action.label}
              <ArrowIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div
      {...rest}
      ref={setRoot}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={resolvedLook}
      data-open={isOpen ? "" : undefined}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onKeyDown={onKeyDown}
    >
      <style href="ui-project-card" precedence="default">
        {css}
      </style>

      <div className="ui-pc__card">
        <div className="ui-pc__head">
          {/* The whole head toggles; what sits on top of it only reacts once the card is open */}
          <button
            type="button"
            className="ui-pc__toggle"
            aria-expanded={isOpen}
            aria-controls={`${uid}-body`}
            aria-label={`${title}: ${doneCount} of ${list.length} done, ${statusNow?.label ?? ""}${due ? `, due ${due}` : ""}`}
            onClick={() => change(!isOpen)}
          />

          <ProgressRing list={list} doneCount={doneCount} isOpen={isOpen} hot={hot} theirs={theirs} onHot={setHot} onToggle={toggle} />

          <span className="ui-pc__titles">
            <span className="ui-pc__name" title={title}>
              {title}
            </span>
            <span className="ui-pc__sub">
              <button
                type="button"
                className="ui-pc__status"
                data-tone={statusNow?.tone ?? "gray"}
                aria-expanded={choosing}
                aria-controls={`${uid}-status`}
                tabIndex={isOpen ? 0 : -1}
                onClick={() => (choosing ? closePicker() : setChoosing(true))}
              >
                {/* A 24px target around the 20px tag */}
                <span className="ui-pc__tag">
                  {statusNow?.icon ?? <ToneIcon look={resolvedLook} tone={statusNow?.tone ?? "gray"} />}
                  {statusNow?.label}
                </span>
              </button>
              {due && (
                <span className="ui-pc__due">
                  <span className="ui-pc__due-word">Due </span>
                  {due}
                </span>
              )}
            </span>
          </span>

          {members.length > 0 && <PeopleRow members={members} person={person} pinned={pinned} isOpen={isOpen} onPeek={setPeek} onPin={setPinned} />}
        </div>

        <div id={`${uid}-body`} className="ui-pc__fold" inert={!isOpen}>
          <div className="ui-pc__body">
            {/* The status picker unfolds in place */}
            <StatusPicker id={`${uid}-status`} statuses={statuses} current={statusNow?.id} choosing={choosing} look={resolvedLook} onPick={pick} onMove={setStatus} />

            {list.length > 0 && <TaskList list={list} members={members} hot={hot} theirs={theirs} onHot={setHot} onToggle={toggle} />}
          </div>
        </div>
        {/* Clean: the last row of the card */}
        {resolvedLook === "clean" && tray}
      </div>

      {/* Standard: the tray under the card */}
      {resolvedLook !== "clean" && tray}
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
.ui-pc:where([data-look="standard"]),
.ui-pc__portal:where([data-look="standard"]) {
  --_tc-accent: #2f68ff;
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-action-ghost-fg: light-dark(#404040, #c8c8cc);
  --_tc-action-primary-bg: light-dark(#171717, #ededed);
  --_tc-action-primary-bg-active: light-dark(#0a0a0a, #c8c8cc);
  --_tc-action-primary-bg-hover: light-dark(#262626, #ffffff);
  --_tc-action-primary-fg: light-dark(#ffffff, #111113);
  --_tc-action-primary-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-avatar-font-size: 9px;
  --_tc-avatar-font-weight: 600;
  --_tc-avatar-sm: 20px;
  --_tc-border-control: light-dark(#858585, #7c7c82);
  --_tc-border-control-hover: light-dark(#646464, #9a9aa1);
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-border-selected: light-dark(#2f68ff, #6b95ff);
  --_tc-border-strong: light-dark(#dedede, #3a3a40);
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 32px;
  --_tc-control-h-sm: 28px;
  --_tc-control-px-md: 12px;
  --_tc-control-px-sm: 10px;
  --_tc-control-radius-md: 10px;
  --_tc-control-radius-sm: 8px;
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-emphasized: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-md: 13px;
  --_tc-font-size-md-plus: 13.5px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-sm-plus: 12.5px;
  --_tc-font-size-xs-plus: 11.5px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-strong: 600;
  --_tc-hairline: 1px;
  --_tc-line-height-none: 1;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-tight: 16px;
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 20px;
  --_tc-pill-px: 8px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-badge: 999px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-status-danger-bg: light-dark(#fdecea, #3b1714);
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-info-bg: light-dark(#eaf1ff, #16243f);
  --_tc-status-info-fg: light-dark(#2456d6, #8ab4ff);
  --_tc-status-success-bg: light-dark(#e6f6ec, #12301f);
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-surface-inverse: light-dark(#171717, #ededed);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-tray: light-dark(#f0f0f0, #19191b);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-on-accent: #ffffff;
  --_tc-text-on-inverse: light-dark(#ffffff, #111113);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-tone-amber-bg: light-dark(rgba(245, 165, 36, 0.12), rgba(245, 165, 36, 0.14));
  --_tc-tone-amber-fg: light-dark(#a35200, #ffa057);
  --_tc-tone-violet-bg: light-dark(rgba(105, 65, 198, 0.1), rgba(150, 110, 240, 0.16));
  --_tc-tone-violet-fg: light-dark(#6941c6, #b9a2f5);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
}
.ui-pc:where([data-look="clean"]),
.ui-pc__portal:where([data-look="clean"]) {
  --_tc-accent: light-dark(#0060e2, #1a6cf0);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-action-ghost-fg: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-action-primary-bg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-action-primary-bg-active: light-dark(rgba(0, 0, 0, 0.94), rgba(255, 255, 255, 0.74));
  --_tc-action-primary-bg-hover: light-dark(rgba(0, 0, 0, 0.8), rgba(255, 255, 255, 0.82));
  --_tc-action-primary-fg: light-dark(#fcfcfc, #161618);
  --_tc-action-primary-shadow: none;
  --_tc-avatar-font-size: 9px;
  --_tc-avatar-font-weight: 500;
  --_tc-avatar-sm: 20px;
  --_tc-border-control: light-dark(rgba(0, 0, 0, 0.48), rgba(255, 255, 255, 0.4));
  --_tc-border-control-hover: light-dark(rgba(0, 0, 0, 0.6), rgba(255, 255, 255, 0.52));
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-border-selected: light-dark(#0060e2, #5b9aff);
  --_tc-border-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 28px;
  --_tc-control-h-sm: 24px;
  --_tc-control-px-md: 10px;
  --_tc-control-px-sm: 8px;
  --_tc-control-radius-md: 6px;
  --_tc-control-radius-sm: 6px;
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-emphasized: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-md: 13px;
  --_tc-font-size-md-plus: 13.5px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-sm-plus: 12.5px;
  --_tc-font-size-xs-plus: 11.5px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-strong: 500;
  --_tc-hairline: 0.5px;
  --_tc-line-height-none: 1;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-tight: 16px;
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 18px;
  --_tc-pill-px: 6px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-badge: 5px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-status-danger-bg: light-dark(rgba(245, 43, 0, 0.094), rgba(255, 53, 35, 0.17));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-info-bg: light-dark(rgba(0, 143, 245, 0.1), rgba(0, 119, 255, 0.23));
  --_tc-status-info-fg: light-dark(#0058cf, #70b8ff);
  --_tc-status-success-bg: light-dark(rgba(0, 164, 51, 0.1), rgba(0, 240, 74, 0.12));
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-surface-inverse: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-tray: light-dark(#f7f7f7, #161618);
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-on-accent: #ffffff;
  --_tc-text-on-inverse: light-dark(#fcfcfc, #161618);
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
  --_tc-tone-amber-bg: light-dark(rgba(245, 165, 36, 0.12), rgba(245, 165, 36, 0.13));
  --_tc-tone-amber-fg: light-dark(#a35200, #ffa057);
  --_tc-tone-violet-bg: light-dark(rgba(91, 91, 214, 0.08), rgba(130, 120, 240, 0.15));
  --_tc-tone-violet-fg: light-dark(#5b45b8, #b7a6f5);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(10px + 4px);
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

:where([data-look="standard"], [data-look="standard"] *).ui-pc {
  box-sizing: border-box;
  width: 100%;
  max-width: 320px;
  container-type: inline-size;
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  background: var(--tc-surface-tray, var(--_tc-surface-tray));
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-pc */
:where([data-look="clean"], [data-look="clean"] *).ui-pc {
  /* The progress ring's open segments */
  --tc-project-card-track: light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.1));
  --tc-project-card-track-hover: light-dark(rgba(0, 0, 0, 0.2), rgba(255, 255, 255, 0.26));
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  width: 100%;
  max-width: 320px;
  container-type: inline-size;
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
.ui-pc *, .ui-pc *::before, .ui-pc *::after { box-sizing: border-box; }
:where(.ui-pc) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-pc button:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
:where(.ui-pc) svg { display: block; flex: none; }
.ui-pc__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-pc b { font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* Status tags: the status and tone tokens – coloured text on a tint of the same colour */
.ui-pc [data-tone="red"] { --tc-project-card-tag-fg: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); --tc-project-card-tag-bg: var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); }
.ui-pc [data-tone="amber"] { --tc-project-card-tag-fg: var(--tc-tone-amber-fg, var(--_tc-tone-amber-fg)); --tc-project-card-tag-bg: var(--tc-tone-amber-bg, var(--_tc-tone-amber-bg)); }
.ui-pc [data-tone="green"] { --tc-project-card-tag-fg: var(--tc-status-success-fg, var(--_tc-status-success-fg)); --tc-project-card-tag-bg: var(--tc-status-success-bg, var(--_tc-status-success-bg)); }
.ui-pc [data-tone="blue"] { --tc-project-card-tag-fg: var(--tc-status-info-fg, var(--_tc-status-info-fg)); --tc-project-card-tag-bg: var(--tc-status-info-bg, var(--_tc-status-info-bg)); }
.ui-pc [data-tone="violet"] { --tc-project-card-tag-fg: var(--tc-tone-violet-fg, var(--_tc-tone-violet-fg)); --tc-project-card-tag-bg: var(--tc-tone-violet-bg, var(--_tc-tone-violet-bg)); }
.ui-pc [data-tone="gray"] { --tc-project-card-tag-fg: var(--tc-text-secondary, var(--_tc-text-secondary)); --tc-project-card-tag-bg: var(--tc-fill-default, var(--_tc-fill-default)); }
/* The card recipe */
.ui-pc__card { border-radius: var(--tc-card-radius, var(--_tc-card-radius)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow)); }
/* Everything that opens does it the same quiet way: it unfolds and fades, nothing travels */
.ui-pc__fold { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-emphasized, var(--_tc-ease-emphasized)), opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-pc__fold > * { min-height: 0; overflow: hidden; }
.ui-pc[data-open] > .ui-pc__fold,
.ui-pc[data-open] > .ui-pc__card > .ui-pc__fold,
.ui-pc__fold--status[data-open] { grid-template-rows: 1fr; opacity: 1; transition: grid-template-rows var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-emphasized, var(--_tc-ease-emphasized)), opacity var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-standard, var(--_tc-ease-standard)) var(--tc-duration-quick, var(--_tc-duration-quick)); }
/* ----- Head: the same in both states ----- */
.ui-pc__head { position: relative; display: flex; align-items: center; gap: 10px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__head { padding: 10px 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__head { padding: 12px; }
.ui-pc__toggle { position: absolute; inset: 0; border-radius: var(--tc-card-radius, var(--_tc-card-radius)); }
.ui-pc__head > :not(.ui-pc__toggle) { position: relative; pointer-events: none; }
.ui-pc[data-open] :is(.ui-pc__status, .ui-pc__member), .ui-pc__progress[data-live] .ui-pc__seg { pointer-events: auto; }
.ui-pc__progress { display: grid; flex: none; place-items: center; width: 32px; height: 32px; }
.ui-pc__progress > * { grid-area: 1 / 1; }
.ui-pc__seg { fill: none; stroke-width: 3; stroke-linecap: round; cursor: pointer; transition: stroke var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)), stroke-width var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-emphasized, var(--_tc-ease-emphasized)), opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__seg { stroke: var(--tc-border-strong, var(--_tc-border-strong)); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__seg[data-done] { stroke: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__seg[data-hot] { stroke-width: 4.5; stroke: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__seg[data-done][data-hot] { stroke: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__seg { stroke: var(--tc-project-card-track); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__seg[data-done] { stroke: var(--tc-accent, var(--_tc-accent)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__seg[data-hot] { stroke-width: 4.25; stroke: var(--tc-project-card-track-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__seg[data-done][data-hot] { stroke: var(--tc-accent, var(--_tc-accent)); }
.ui-pc__seg[data-dim] { opacity: 0.3; }
.ui-pc__num { font-weight: var(--tc-font-weight-strong, var(--_tc-font-weight-strong)); line-height: var(--tc-line-height-none, var(--_tc-line-height-none)); font-variant-numeric: tabular-nums; pointer-events: none; animation: ui-pc-num var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-emphasized, var(--_tc-ease-emphasized)) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__num { font-size: var(--tc-font-size-xs-plus, var(--_tc-font-size-xs-plus)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__num { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
.ui-pc__titles { display: grid; grid-template-columns: minmax(0, 1fr); flex: 1; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__name { overflow: hidden; font-size: var(--tc-font-size-md-plus, var(--_tc-font-size-md-plus)); font-weight: var(--tc-font-weight-strong, var(--_tc-font-weight-strong)); color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__name { overflow: hidden; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); font-weight: var(--tc-font-weight-strong, var(--_tc-font-weight-strong)); color: var(--tc-text-strong, var(--_tc-text-strong)); white-space: nowrap; text-overflow: ellipsis; }
/* The sub line keeps its 20px; the status button inside reaches 2px above and below it (a 24px target) */
.ui-pc__sub { display: flex; align-items: center; gap: 6px; min-width: 0; height: 24px; overflow: hidden; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__sub { margin: -1px 0 -2px; line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__sub { margin: -2px 0; line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); }
.ui-pc__status { display: inline-flex; flex: none; align-items: center; height: 24px; }
/* The tag: the pill recipe in the tone's colours */
.ui-pc__tag { display: inline-flex; align-items: center; height: var(--tc-pill-h, var(--_tc-pill-h)); padding: 0 var(--tc-pill-px, var(--_tc-pill-px)) 0 calc(var(--tc-pill-px, var(--_tc-pill-px)) - 2px); border-radius: var(--tc-radius-badge, var(--_tc-radius-badge)); background: var(--tc-project-card-tag-bg); font-size: var(--tc-pill-font-size, var(--_tc-pill-font-size)); font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-project-card-tag-fg); transition: box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__tag { gap: 4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__tag { gap: 5px; }
.ui-pc[data-open] .ui-pc__status:hover .ui-pc__tag,
.ui-pc__status[aria-expanded="true"] .ui-pc__tag { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tc-project-card-tag-fg) 40%, transparent); }
.ui-pc__due { min-width: 0; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
/* People: hover one to see only their subtasks, click to keep it – 24px targets side by side */
.ui-pc__people { display: flex; flex: none; }
.ui-pc__member { position: relative; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; transition: transform var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-emphasized, var(--_tc-ease-emphasized)), opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__member[data-on] { z-index: 1; transform: scale(1.12); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__member[data-on] { z-index: 1; transform: scale(1.1); }
.ui-pc__member[data-off] { opacity: 0.4; }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__member[aria-pressed="true"] .ui-pc__avatar { box-shadow: 0 0 0 1.5px var(--tc-surface-raised, var(--_tc-surface-raised)), 0 0 0 3px var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__member[aria-pressed="true"] .ui-pc__avatar { box-shadow: 0 0 0 1.5px var(--tc-surface-raised, var(--_tc-surface-raised)), 0 0 0 2.5px var(--tc-accent, var(--_tc-accent)); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__avatar {
  --tc-project-card-avatar-bg: light-dark(hsl(var(--tc-project-card-hue) 70% 90%), hsl(var(--tc-project-card-hue) 30% 26%));
  --tc-project-card-avatar-fg: light-dark(hsl(var(--tc-project-card-hue) 45% 34%), hsl(var(--tc-project-card-hue) 70% 82%));
}
:where([data-look="clean"], [data-look="clean"] *).ui-pc__avatar {
  --tc-project-card-avatar-bg: light-dark(hsl(var(--tc-project-card-hue) 60% 92%), hsl(var(--tc-project-card-hue) 26% 26%));
  --tc-project-card-avatar-fg: light-dark(hsl(var(--tc-project-card-hue) 40% 36%), hsl(var(--tc-project-card-hue) 60% 82%));
}
.ui-pc__avatar {
  display: grid;
  flex: none;
  place-items: center;
  width: var(--tc-avatar-sm, var(--_tc-avatar-sm));
  height: var(--tc-avatar-sm, var(--_tc-avatar-sm));
  overflow: hidden;
  border-radius: 50%;
  background: var(--tc-project-card-avatar-bg);
  box-shadow: 0 0 0 1.5px var(--tc-surface-raised, var(--_tc-surface-raised));
  font-size: var(--tc-avatar-font-size, var(--_tc-avatar-font-size));
  font-weight: var(--tc-avatar-font-weight, var(--_tc-avatar-font-weight));
  line-height: var(--tc-line-height-none, var(--_tc-line-height-none));
  color: var(--tc-project-card-avatar-fg);
  transition: box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-pc__avatar img { width: 100%; height: 100%; object-fit: cover; }
/* ----- Body ----- */
.ui-pc__body { padding: 0 12px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__options { display: flex; flex-wrap: wrap; gap: 4px; padding-bottom: 10px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__option { display: inline-flex; align-items: center; gap: 5px; height: 24px; padding: 0 9px 0 7px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); background: var(--tc-project-card-tag-bg); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-project-card-tag-fg); white-space: nowrap; transition: box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__option:hover { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tc-project-card-tag-fg) 40%, transparent); }
/* The chosen status: a full-strength edge in its colour (≥ 3:1), not only a deeper tint */
:where([data-look="standard"], [data-look="standard"] *).ui-pc__option[aria-checked="true"] { box-shadow: inset 0 0 0 1px var(--tc-project-card-tag-fg); }
/* Status options: the switch-chip look – a soft fill and the selected edge mark the chosen one */
:where([data-look="clean"], [data-look="clean"] *).ui-pc__options { display: flex; gap: 4px; margin: -2px -12px 0; padding: 3px 12px 12px; overflow-x: auto; scrollbar-width: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__options::-webkit-scrollbar { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__option { display: inline-flex; flex: none; align-items: center; gap: 5px; height: 24px; padding: 2px 7px 2px 6px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-border-default, var(--_tc-border-default)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); white-space: nowrap; transition: background-color var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)), color var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__option svg { color: var(--tc-project-card-tag-fg); }
/* A small square in the tone's color – the full icon sits on the chosen tag in the head */
:where([data-look="clean"], [data-look="clean"] *).ui-pc__dot { flex: none; width: 6px; height: 6px; border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); background: var(--tc-project-card-tag-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__option:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__option[aria-checked="true"] { background: var(--tc-fill-default, var(--_tc-fill-default)); box-shadow: inset 0 0 0 1px var(--tc-border-selected, var(--_tc-border-selected)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-pc__tasks { margin: 0; border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); list-style: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__tasks { padding: 8px 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__tasks { padding: 6px 0; }
.ui-pc__task { display: flex; align-items: center; width: calc(100% + 12px); margin: 0 -6px; padding: 0 6px; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__task { gap: 9px; height: 30px; border-radius: var(--tc-radius-md, var(--_tc-radius-md)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__task[data-hot] { background: var(--tc-fill-hover, var(--_tc-fill-hover)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__task { gap: 10px; height: 32px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__task[data-hot] { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
.ui-pc__task[data-dim] { opacity: 0.35; }
.ui-pc__label { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-pc__task .ui-pc__avatar { width: 18px; height: 18px; font-size: 8px; opacity: 0; transform: translateX(4px); transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-emphasized, var(--_tc-ease-emphasized)); }
.ui-pc__task:is([data-hot], :focus-visible) .ui-pc__avatar { opacity: 1; transform: none; }
/* The checkbox: its ring is a control edge (≥ 3:1); ticked, it fills – ink in Standard, the accent in Clean */
.ui-pc__ring { fill: none; stroke: var(--tc-border-control, var(--_tc-border-control)); transition: stroke var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__ring { stroke-width: 1.4; }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__ring { stroke-width: 1.1; }
.ui-pc__task[data-hot] .ui-pc__ring { stroke: var(--tc-border-control-hover, var(--_tc-border-control-hover)); }
.ui-pc__disc { transform-origin: 8px 8px; transform: scale(0); transition: transform var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-emphasized, var(--_tc-ease-emphasized)); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__disc { fill: var(--tc-surface-inverse, var(--_tc-surface-inverse)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__disc { fill: var(--tc-accent, var(--_tc-accent)); }
.ui-pc__tick { fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 9; stroke-dashoffset: 9; transition: stroke-dashoffset var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-emphasized, var(--_tc-ease-emphasized)) 80ms; }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__tick { stroke: var(--tc-text-on-inverse, var(--_tc-text-on-inverse)); stroke-width: 1.6; }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__tick { stroke: var(--tc-text-on-accent, var(--_tc-text-on-accent)); stroke-width: 1.5; }
.ui-pc__task[aria-checked="true"] .ui-pc__disc { transform: scale(1); }
.ui-pc__task[aria-checked="true"] .ui-pc__tick { stroke-dashoffset: 0; }
.ui-pc__task[aria-checked="true"] { color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* ----- Tray ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-pc__foot { display: flex; align-items: center; gap: 8px; height: 38px; padding: 4px 4px 0 10px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__caption { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; }
.ui-pc__caption > span { display: inline-block; animation: ui-pc-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-emphasized, var(--_tc-ease-emphasized)) both; }
/* Standard: a ghost button on the tray, like Button's ghost */
:where([data-look="standard"], [data-look="standard"] *).ui-pc__action { display: inline-flex; align-items: center; gap: 4px; flex: none; height: var(--tc-control-h-sm, var(--_tc-control-h-sm)); padding: 0 calc(var(--tc-control-px-sm, var(--_tc-control-px-sm)) - 2px) 0 var(--tc-control-px-sm, var(--_tc-control-px-sm)); border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm)); font-size: var(--tc-control-font-size, var(--_tc-control-font-size)); font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight)); color: var(--tc-action-ghost-fg, var(--_tc-action-ghost-fg)); white-space: nowrap; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__action:hover { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-pc__action svg { transition: transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-emphasized, var(--_tc-ease-emphasized)); }
/* ----- The last row inside the card ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-pc__foot { display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 8px 0 12px; border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__caption { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
/* Clean: the primary action, like Button's primary */
:where([data-look="clean"], [data-look="clean"] *).ui-pc__action { display: inline-flex; align-items: center; gap: 4px; flex: none; height: var(--tc-control-h-md, var(--_tc-control-h-md)); padding: 0 calc(var(--tc-control-px-md, var(--_tc-control-px-md)) - 3px) 0 var(--tc-control-px-md, var(--_tc-control-px-md)); border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md)); background: var(--tc-action-primary-bg, var(--_tc-action-primary-bg)); box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow)); font-size: var(--tc-control-font-size, var(--_tc-control-font-size)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight)); color: var(--tc-action-primary-fg, var(--_tc-action-primary-fg)); white-space: nowrap; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__action:hover { background: var(--tc-action-primary-bg-hover, var(--_tc-action-primary-bg-hover)); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__action:active { background: var(--tc-action-primary-bg-active, var(--_tc-action-primary-bg-active)); }
.ui-pc__action:hover svg { transform: translateX(2px); }
@keyframes ui-pc-in { from { opacity: 0; transform: translateY(3px); } }
@keyframes ui-pc-num { from { opacity: 0; transform: scale(0.8); } }
/* Narrow cards (small phones, tight columns): the date loses its word, so nothing is cut */
@container (max-width: 290px) {
  .ui-pc__due-word { display: none; }
  .ui-pc .ui-pc__head { gap: 8px; }
  .ui-pc .ui-pc__sub { gap: 4px; }
  :where([data-look="clean"], [data-look="clean"] *).ui-pc__head { padding: 10px; }
  :where([data-look="clean"], [data-look="clean"] *).ui-pc__body { padding: 0 10px; }
  :where([data-look="clean"], [data-look="clean"] *).ui-pc__options { margin: -2px -10px 0; padding: 3px 10px 10px; }
  :where([data-look="clean"], [data-look="clean"] *).ui-pc__option { padding: 2px 6px; }
  :where([data-look="clean"], [data-look="clean"] *).ui-pc__dot { display: none; }
  :where([data-look="clean"], [data-look="clean"] *).ui-pc__foot { padding: 0 8px 0 10px; }
}
@media (pointer: coarse) {
  .ui-pc__task .ui-pc__avatar { opacity: 1; transform: none; }
  :where([data-look="standard"], [data-look="standard"] *).ui-pc__task { height: 36px; }
  :where([data-look="standard"], [data-look="standard"] *).ui-pc__option { height: 30px; }
  :where([data-look="standard"], [data-look="standard"] *).ui-pc__action { height: 30px; }
  :where([data-look="clean"], [data-look="clean"] *).ui-pc__task { height: 38px; }
  :where([data-look="clean"], [data-look="clean"] *).ui-pc__option { height: 32px; padding: 0 7px 0 6px; }
  :where([data-look="clean"], [data-look="clean"] *).ui-pc__foot { height: 52px; }
  :where([data-look="clean"], [data-look="clean"] *).ui-pc__action { height: 34px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-pc *, .ui-pc *::before, .ui-pc *::after { animation: none !important; transition: none !important; }
}
`;
