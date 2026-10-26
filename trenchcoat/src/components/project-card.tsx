"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type Ref,
} from "react";
import { useControllable } from "../internal/use-controllable";
import { rescueFocus, useFocusRescue } from "../internal/use-focus-rescue";
import { useRootRef } from "../internal/use-root-ref";

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

/* ---------- Styles ---------- */

const css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *).ui-pc {
  box-sizing: border-box;
  width: 100%;
  max-width: 320px;
  container-type: inline-size;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
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
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
.ui-pc *, .ui-pc *::before, .ui-pc *::after { box-sizing: border-box; }
:where(.ui-pc) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-pc button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where(.ui-pc) svg { display: block; flex: none; }
.ui-pc__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-pc b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
/* Status tags: the status and tone tokens – coloured text on a tint of the same colour */
.ui-pc [data-tone="red"] { --tc-project-card-tag-fg: var(--tc-status-danger-fg); --tc-project-card-tag-bg: var(--tc-status-danger-bg); }
.ui-pc [data-tone="amber"] { --tc-project-card-tag-fg: var(--tc-tone-amber-fg); --tc-project-card-tag-bg: var(--tc-tone-amber-bg); }
.ui-pc [data-tone="green"] { --tc-project-card-tag-fg: var(--tc-status-success-fg); --tc-project-card-tag-bg: var(--tc-status-success-bg); }
.ui-pc [data-tone="blue"] { --tc-project-card-tag-fg: var(--tc-status-info-fg); --tc-project-card-tag-bg: var(--tc-status-info-bg); }
.ui-pc [data-tone="violet"] { --tc-project-card-tag-fg: var(--tc-tone-violet-fg); --tc-project-card-tag-bg: var(--tc-tone-violet-bg); }
.ui-pc [data-tone="gray"] { --tc-project-card-tag-fg: var(--tc-text-secondary); --tc-project-card-tag-bg: var(--tc-fill-default); }
/* The card recipe */
.ui-pc__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
/* Everything that opens does it the same quiet way: it unfolds and fades, nothing travels */
.ui-pc__fold { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-emphasized), opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-pc__fold > * { min-height: 0; overflow: hidden; }
.ui-pc[data-open] > .ui-pc__fold,
.ui-pc[data-open] > .ui-pc__card > .ui-pc__fold,
.ui-pc__fold--status[data-open] { grid-template-rows: 1fr; opacity: 1; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-emphasized), opacity var(--tc-duration-slower) var(--tc-ease-standard) var(--tc-duration-quick); }
/* ----- Head: the same in both states ----- */
.ui-pc__head { position: relative; display: flex; align-items: center; gap: 10px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__head { padding: 10px 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__head { padding: 12px; }
.ui-pc__toggle { position: absolute; inset: 0; border-radius: var(--tc-card-radius); }
.ui-pc__head > :not(.ui-pc__toggle) { position: relative; pointer-events: none; }
.ui-pc[data-open] :is(.ui-pc__status, .ui-pc__member), .ui-pc__progress[data-live] .ui-pc__seg { pointer-events: auto; }
.ui-pc__progress { display: grid; flex: none; place-items: center; width: 32px; height: 32px; }
.ui-pc__progress > * { grid-area: 1 / 1; }
.ui-pc__seg { fill: none; stroke-width: 3; stroke-linecap: round; cursor: pointer; transition: stroke var(--tc-duration-moderate) var(--tc-ease-standard), stroke-width var(--tc-duration-moderate) var(--tc-ease-emphasized), opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__seg { stroke: var(--tc-border-strong); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__seg[data-done] { stroke: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__seg[data-hot] { stroke-width: 4.5; stroke: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__seg[data-done][data-hot] { stroke: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__seg { stroke: var(--tc-project-card-track); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__seg[data-done] { stroke: var(--tc-accent); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__seg[data-hot] { stroke-width: 4.25; stroke: var(--tc-project-card-track-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__seg[data-done][data-hot] { stroke: var(--tc-accent); }
.ui-pc__seg[data-dim] { opacity: 0.3; }
.ui-pc__num { font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-none); font-variant-numeric: tabular-nums; pointer-events: none; animation: ui-pc-num var(--tc-duration-slow) var(--tc-ease-emphasized) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__num { font-size: var(--tc-font-size-xs); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__num { font-size: var(--tc-font-size-sm); color: var(--tc-text-strong); }
.ui-pc__titles { display: grid; grid-template-columns: minmax(0, 1fr); flex: 1; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__name { overflow: hidden; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__name { overflow: hidden; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-strong); white-space: nowrap; text-overflow: ellipsis; }
/* The sub line keeps its 20px; the status button inside reaches 2px above and below it (a 24px target) */
.ui-pc__sub { display: flex; align-items: center; gap: 6px; min-width: 0; height: 24px; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__sub { margin: -1px 0 -2px; line-height: var(--tc-line-height-normal); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__sub { margin: -2px 0; line-height: var(--tc-line-height-tight); }
.ui-pc__status { display: inline-flex; flex: none; align-items: center; height: 24px; }
/* The tag: the pill recipe in the tone's colours */
.ui-pc__tag { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px) 0 calc(var(--tc-pill-px) - 2px); border-radius: var(--tc-radius-badge); background: var(--tc-project-card-tag-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-project-card-tag-fg); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__tag { gap: 4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__tag { gap: 5px; }
.ui-pc[data-open] .ui-pc__status:hover .ui-pc__tag,
.ui-pc__status[aria-expanded="true"] .ui-pc__tag { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tc-project-card-tag-fg) 40%, transparent); }
.ui-pc__due { min-width: 0; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
/* People: hover one to see only their subtasks, click to keep it – 24px targets side by side */
.ui-pc__people { display: flex; flex: none; }
.ui-pc__member { position: relative; display: grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; transition: transform var(--tc-duration-moderate) var(--tc-ease-emphasized), opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__member[data-on] { z-index: 1; transform: scale(1.12); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__member[data-on] { z-index: 1; transform: scale(1.1); }
.ui-pc__member[data-off] { opacity: 0.4; }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__member[aria-pressed="true"] .ui-pc__avatar { box-shadow: 0 0 0 1.5px var(--tc-surface-raised), 0 0 0 3px var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__member[aria-pressed="true"] .ui-pc__avatar { box-shadow: 0 0 0 1.5px var(--tc-surface-raised), 0 0 0 2.5px var(--tc-accent); }
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
  width: var(--tc-avatar-sm);
  height: var(--tc-avatar-sm);
  overflow: hidden;
  border-radius: 50%;
  background: var(--tc-project-card-avatar-bg);
  box-shadow: 0 0 0 1.5px var(--tc-surface-raised);
  font-size: var(--tc-avatar-font-size);
  font-weight: var(--tc-avatar-font-weight);
  line-height: var(--tc-line-height-none);
  color: var(--tc-project-card-avatar-fg);
  transition: box-shadow var(--tc-duration-base) var(--tc-ease-standard);
}
.ui-pc__avatar img { width: 100%; height: 100%; object-fit: cover; }
/* ----- Body ----- */
.ui-pc__body { padding: 0 12px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__options { display: flex; flex-wrap: wrap; gap: 4px; padding-bottom: 10px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__option { display: inline-flex; align-items: center; gap: 5px; height: 24px; padding: 0 9px 0 7px; border-radius: var(--tc-radius-sm); background: var(--tc-project-card-tag-bg); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-project-card-tag-fg); white-space: nowrap; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__option:hover { box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tc-project-card-tag-fg) 40%, transparent); }
/* The chosen status: a full-strength edge in its colour (≥ 3:1), not only a deeper tint */
:where([data-look="standard"], [data-look="standard"] *).ui-pc__option[aria-checked="true"] { box-shadow: inset 0 0 0 1px var(--tc-project-card-tag-fg); }
/* Status options: the switch-chip look – a soft fill and the selected edge mark the chosen one */
:where([data-look="clean"], [data-look="clean"] *).ui-pc__options { display: flex; gap: 4px; margin: -2px -12px 0; padding: 3px 12px 12px; overflow-x: auto; scrollbar-width: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__options::-webkit-scrollbar { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__option { display: inline-flex; flex: none; align-items: center; gap: 5px; height: 24px; padding: 2px 7px 2px 6px; border-radius: var(--tc-radius-sm); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-quick) var(--tc-ease-decelerate), color var(--tc-duration-quick) var(--tc-ease-decelerate); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__option svg { color: var(--tc-project-card-tag-fg); }
/* A small square in the tone's color – the full icon sits on the chosen tag in the head */
:where([data-look="clean"], [data-look="clean"] *).ui-pc__dot { flex: none; width: 6px; height: 6px; border-radius: var(--tc-radius-2xs); background: var(--tc-project-card-tag-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__option:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__option[aria-checked="true"] { background: var(--tc-fill-default); box-shadow: inset 0 0 0 1px var(--tc-border-selected); color: var(--tc-text-primary); }
.ui-pc__tasks { margin: 0; border-top: var(--tc-hairline) solid var(--tc-divider); list-style: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__tasks { padding: 8px 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__tasks { padding: 6px 0; }
.ui-pc__task { display: flex; align-items: center; width: calc(100% + 12px); margin: 0 -6px; padding: 0 6px; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard), opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__task { gap: 9px; height: 30px; border-radius: var(--tc-radius-md); color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__task[data-hot] { background: var(--tc-fill-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__task { gap: 10px; height: 32px; border-radius: var(--tc-radius-sm); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__task[data-hot] { background: var(--tc-fill-subtle); }
.ui-pc__task[data-dim] { opacity: 0.35; }
.ui-pc__label { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-pc__task .ui-pc__avatar { width: 18px; height: 18px; font-size: 8px; opacity: 0; transform: translateX(4px); transition: opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-moderate) var(--tc-ease-emphasized); }
.ui-pc__task:is([data-hot], :focus-visible) .ui-pc__avatar { opacity: 1; transform: none; }
/* The checkbox: its ring is a control edge (≥ 3:1); ticked, it fills – ink in Standard, the accent in Clean */
.ui-pc__ring { fill: none; stroke: var(--tc-border-control); transition: stroke var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__ring { stroke-width: 1.4; }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__ring { stroke-width: 1.1; }
.ui-pc__task[data-hot] .ui-pc__ring { stroke: var(--tc-border-control-hover); }
.ui-pc__disc { transform-origin: 8px 8px; transform: scale(0); transition: transform var(--tc-duration-slow) var(--tc-ease-emphasized); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__disc { fill: var(--tc-surface-inverse); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__disc { fill: var(--tc-accent); }
.ui-pc__tick { fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 9; stroke-dashoffset: 9; transition: stroke-dashoffset var(--tc-duration-moderate) var(--tc-ease-emphasized) 80ms; }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__tick { stroke: var(--tc-text-on-inverse); stroke-width: 1.6; }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__tick { stroke: var(--tc-text-on-accent); stroke-width: 1.5; }
.ui-pc__task[aria-checked="true"] .ui-pc__disc { transform: scale(1); }
.ui-pc__task[aria-checked="true"] .ui-pc__tick { stroke-dashoffset: 0; }
.ui-pc__task[aria-checked="true"] { color: var(--tc-text-muted); }
/* ----- Tray ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-pc__foot { display: flex; align-items: center; gap: 8px; height: 38px; padding: 4px 4px 0 10px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__caption { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
.ui-pc__caption > span { display: inline-block; animation: ui-pc-in var(--tc-duration-moderate) var(--tc-ease-emphasized) both; }
/* Standard: a ghost button on the tray, like Button's ghost */
:where([data-look="standard"], [data-look="standard"] *).ui-pc__action { display: inline-flex; align-items: center; gap: 4px; flex: none; height: var(--tc-control-h-sm); padding: 0 calc(var(--tc-control-px-sm) - 2px) 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-ghost-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-pc__action:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-pc__action svg { transition: transform var(--tc-duration-base) var(--tc-ease-emphasized); }
/* ----- The last row inside the card ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-pc__foot { display: flex; align-items: center; gap: 8px; height: 44px; padding: 0 8px 0 12px; border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__caption { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
/* Clean: the primary action, like Button's primary */
:where([data-look="clean"], [data-look="clean"] *).ui-pc__action { display: inline-flex; align-items: center; gap: 4px; flex: none; height: var(--tc-control-h-md); padding: 0 calc(var(--tc-control-px-md) - 3px) 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); font-size: var(--tc-control-font-size); line-height: var(--tc-line-height-normal); font-weight: var(--tc-control-font-weight); color: var(--tc-action-primary-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__action:hover { background: var(--tc-action-primary-bg-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-pc__action:active { background: var(--tc-action-primary-bg-active); }
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
