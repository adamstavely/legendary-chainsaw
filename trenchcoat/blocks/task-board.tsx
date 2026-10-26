"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import { Button } from "@/components/ui/button";

/*
 * Task Board – a kanban board for a sprint, in a single self-contained file.
 * Drag cards between columns and reorder them, add cards per column, open a card to change its status,
 * priority, labels and title, search, filter by label and switch to a compact view.
 * The styles are injected below, so no extra files are needed. Buttons come from the library's Button
 * (copy `button.tsx` alongside); everything else uses the shared pattern tokens.
 *
 * Keyboard: every card opens with Enter or Space; the detail panel changes status (the alternative to dragging),
 * Esc closes it and focus returns to the card. The label menu follows the menu pattern (arrows, Home/End, Esc).
 */

export type TaskStatus = { id: string; label: string; icon: ReactNode };
export type TaskLabel = { id: string; label: string; color: string };
export type TaskPerson = { id: string; name: string; avatar?: string };

export type Task = {
  id: string;
  /** Short reference, e.g. "NW-214" */
  key: string;
  title: string;
  status: string;
  /** 0 none · 1 low · 2 medium · 3 high · 4 urgent */
  priority: 0 | 1 | 2 | 3 | 4;
  estimate?: "XS" | "S" | "M" | "L" | "XL";
  labels: string[];
  assignee?: string;
  /** Days until due – negative when overdue */
  dueIn?: number;
  subtasks?: [done: number, total: number];
  pullRequest?: number;
  created: string;
};

type OwnProps = {
  /** The tasks (controlled) – pass `onTasksChange` with it. Leave undefined to start from `defaultTasks` */
  tasks?: Task[];
  defaultTasks?: Task[];
  /** Called with all tasks after every change */
  onTasksChange?: (tasks: Task[]) => void;
  statuses: TaskStatus[];
  labels: TaskLabel[];
  people: TaskPerson[];
  /** Breadcrumb above the board */
  path?: string[];
  /** @deprecated Use `onTasksChange` (same arguments) */
  onChange?: (tasks: Task[]) => void;
  className?: string;
  /** The root <section> */
  ref?: Ref<HTMLElement>;
};

export type TaskBoardProps = Omit<ComponentPropsWithoutRef<"section">, keyof OwnProps> & OwnProps;

const priorityNames = ["No priority", "Low", "Medium", "High", "Urgent"];

/**
 * State a parent may control: controlled when `value` is defined (changes are only reported through `onChange`),
 * otherwise kept here from `defaultValue` (and still reported). Whether `onChange` is passed never decides which.
 */
function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void, name?: string) {
  const controlled = value !== undefined;
  const warned = useRef(false);
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.NODE_ENV;
  if (controlled && !onChange && !warned.current && env !== "production") {
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

const noTasks: Task[] = [];

export function TaskBoard({
  tasks: tasksProp,
  defaultTasks = noTasks,
  onTasksChange,
  statuses,
  labels,
  people,
  path = ["Northwind", "Launch", "Sprint 12"],
  onChange,
  className,
  ref,
  ...rest
}: TaskBoardProps) {
  const report = onTasksChange ?? onChange;
  const [tasks, setTasks] = useControllable(tasksProp, defaultTasks, report, "tasks");
  const [query, setQuery] = useState("");
  const [labelFilter, setLabelFilter] = useState<Set<string>>(new Set());
  const [compact, setCompact] = useState(false);
  const [menu, setMenu] = useState<"filter" | null>(null);
  const [starred, setStarred] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [drag, setDrag] = useState<{ id: string; over?: string; index?: number } | null>(null);
  const counter = useRef(tasks.length + 300);
  const menuRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement | null>(null);
  // Where focus goes after the next commit – a selector inside the board (a card, an add button, the panel)
  const focusNext = useRef<string | null>(null);
  const setRoot = useCallback(
    (node: HTMLElement | null) => {
      rootRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as { current: HTMLElement | null }).current = node;
    },
    [ref],
  );
  useLayoutEffect(() => {
    const selector = focusNext.current;
    if (!selector) return;
    focusNext.current = null;
    rootRef.current?.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
  });

  const update = (id: string, patch: Partial<Task>) => setTasks((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  useEffect(() => {
    if (!menu) return;
    const away = (e: PointerEvent) => !menuRef.current?.contains(e.target as Node) && setMenu(null);
    window.addEventListener("pointerdown", away);
    return () => window.removeEventListener("pointerdown", away);
  }, [menu]);

  /** Close the detail panel; focus goes back to the card it was opened from */
  const closeDetails = useCallback(() => {
    setOpenId((id) => {
      if (id) focusNext.current = `[data-card="${CSS.escape(id)}"]`;
      return null;
    });
  }, []);
  const openDetails = (id: string) => {
    focusNext.current = ".ui-tb__panel [data-autofocus]";
    setOpenId(id);
  };

  useEffect(() => {
    if (!openId) return;
    const esc = (e: globalThis.KeyboardEvent) => e.key === "Escape" && !e.defaultPrevented && closeDetails();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [openId, closeDetails]);

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (!q || `${t.key} ${t.title}`.toLowerCase().includes(q)) &&
          (labelFilter.size === 0 || t.labels.some((l) => labelFilter.has(l))),
      ),
    [tasks, q, labelFilter],
  );

  const person = (id?: string) => people.find((p) => p.id === id);
  const label = (id: string) => labels.find((l) => l.id === id);
  const open = tasks.find((t) => t.id === openId) ?? null;

  /* ---- drag and drop ---- */
  const onDragOver = (e: DragEvent, status: string) => {
    if (!drag) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    // Insert position: before the first card whose middle is below the pointer
    const cards = [...(e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>("[data-card]")].filter(
      (c) => c.dataset.card !== drag.id,
    );
    let index = cards.length;
    for (let i = 0; i < cards.length; i++) {
      const box = cards[i].getBoundingClientRect();
      if (e.clientY < box.top + box.height / 2) {
        index = i;
        break;
      }
    }
    if (drag.over !== status || drag.index !== index) setDrag({ ...drag, over: status, index });
  };
  const onDrop = (status: string) => {
    if (!drag) return;
    const moving = tasks.find((t) => t.id === drag.id);
    if (!moving) return setDrag(null);
    const others = tasks.filter((t) => t.id !== drag.id);
    const column = others.filter((t) => t.status === status && visible.some((v) => v.id === t.id));
    const before = column[drag.index ?? column.length];
    const moved = { ...moving, status };
    const at = before ? others.indexOf(before) : others.length;
    setTasks([...others.slice(0, at), moved, ...others.slice(at)]);
    setDrag(null);
  };

  /** Adds the drafted card; `keyboard` when Enter submitted it, so focus moves to the new card (or back to +) */
  const add = (status: string, keyboard = false) => {
    const title = draft.trim();
    setAdding(null);
    setDraft("");
    if (!title) {
      if (keyboard) focusNext.current = `[data-add="${CSS.escape(status)}"]`;
      return;
    }
    counter.current += 1;
    if (keyboard) focusNext.current = `[data-card="t-${counter.current}"]`;
    const task: Task = {
      id: `t-${counter.current}`,
      key: `NW-${counter.current}`,
      title,
      status,
      priority: 0,
      labels: [],
      created: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
    setTasks((list) => [task, ...list]);
  };

  return (
    <>
      <style href="ui-task-board" precedence="default">
        {css}
      </style>
      <section aria-label={path.join(" / ")} {...rest} ref={setRoot} className={["ui-tb", className].filter(Boolean).join(" ")} data-compact={compact || undefined}>
        <header className="ui-tb__top">
          <nav className="ui-tb__crumbs" aria-label="Breadcrumb">
            <span className="ui-tb__logo" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            {path.map((p, i) => (
              <span key={p} className="ui-tb__crumb" aria-current={i === path.length - 1 ? "page" : undefined}>
                {i > 0 && <Chevron />}
                {p}
              </span>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="ui-tb__icon"
              aria-pressed={starred}
              aria-label="Favorite"
              icon={<StarIcon filled={starred} />}
              onClick={() => setStarred((s) => !s)}
            />
          </nav>
        </header>

        <div className="ui-tb__bar">
          <span className="ui-tb__count" role="status">
            {visible.length} {visible.length === 1 ? "task" : "tasks"}
            {visible.length !== tasks.length && <span> of {tasks.length}</span>}
          </span>
          <div className="ui-tb__tools">
            <label className="ui-tb__search">
              <Icon d="M7 12.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM11 11l3.5 3.5" size={14} />
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search" aria-label="Search tasks" />
            </label>
            <LabelFilter
              labels={labels}
              filter={labelFilter}
              onFilter={setLabelFilter}
              open={menu === "filter"}
              onOpen={(open) => setMenu(open ? "filter" : null)}
              menuRef={menuRef}
            />
            <Button
              variant="ghost"
              size="sm"
              className="ui-tb__icon"
              aria-pressed={compact}
              aria-label="Compact cards"
              title="Compact cards"
              icon={<Icon d="M2.5 3.5h11v3h-11zM2.5 9.5h11v3h-11z" />}
              onClick={() => setCompact((c) => !c)}
            />
          </div>
        </div>

        <div className="ui-tb__columns">
          {statuses.map((status) => {
            const cards = visible.filter((t) => t.status === status.id);
            const isOver = drag?.over === status.id;
            return (
              <div
                key={status.id}
                className="ui-tb__column"
                data-over={isOver || undefined}
                onDragOver={(e) => onDragOver(e, status.id)}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node) && drag) setDrag({ id: drag.id });
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  onDrop(status.id);
                }}
              >
                <div className="ui-tb__col-head">
                  <span className="ui-tb__status">{status.icon}</span>
                  <span className="ui-tb__col-title">{status.label}</span>
                  <span className="ui-tb__col-count">{cards.length}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ui-tb__icon ui-tb__add"
                    data-add={status.id}
                    aria-label={`Add task to ${status.label}`}
                    icon={<Icon d="M8 3v10M3 8h10" size={14} />}
                    onClick={() => {
                      setAdding(status.id);
                      setDraft("");
                    }}
                  />
                </div>

                <div className="ui-tb__cards">
                  {adding === status.id && (
                    <form
                      className="ui-tb__new"
                      onSubmit={(e) => {
                        e.preventDefault();
                        add(status.id, true);
                      }}
                    >
                      <input
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={() => add(status.id)}
                        onKeyDown={(e) => {
                          if (e.key !== "Escape") return;
                          e.preventDefault();
                          focusNext.current = `[data-add="${CSS.escape(status.id)}"]`;
                          setAdding(null);
                          setDraft("");
                        }}
                        placeholder="Task title, then Enter"
                        aria-label={`New task in ${status.label}`}
                      />
                    </form>
                  )}
                  {cards.map((t, i) => {
                    return (
                      <div key={t.id} className="ui-tb__slot">
                        {isOver && drag?.index === i && <span className="ui-tb__drop" />}
                        <TaskCard
                          task={t}
                          status={status}
                          who={person(t.assignee)}
                          labelOf={label}
                          dragging={drag?.id === t.id}
                          onDragStart={() => setDrag({ id: t.id })}
                          onDragEnd={() => setDrag(null)}
                          onOpen={() => openDetails(t.id)}
                        />
                      </div>
                    );
                  })}
                  {isOver && drag?.index === cards.length && <span className="ui-tb__drop" />}
                  {cards.length === 0 && adding !== status.id && <p className="ui-tb__empty">Drop tasks here</p>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail panel: opens over the board from the right */}
        <div className="ui-tb__scrim" data-open={open ? true : undefined} onClick={closeDetails} aria-hidden="true" />
        <aside className="ui-tb__panel" data-open={open ? true : undefined} aria-label="Task details" inert={!open}>
          {open && (
            <TaskDetails
              task={open}
              statuses={statuses}
              labels={labels}
              people={people}
              onUpdate={(patch) => update(open.id, patch)}
              onClose={closeDetails}
              onDelete={() => {
                // Focus goes to the next card in the column (or the one before, or the column's + button)
                const column = visible.filter((t) => t.status === open.status);
                const at = column.findIndex((t) => t.id === open.id);
                const neighbour = column[at + 1] ?? column[at - 1];
                focusNext.current = neighbour ? `[data-card="${CSS.escape(neighbour.id)}"]` : `[data-add="${CSS.escape(open.status)}"]`;
                setTasks((list) => list.filter((t) => t.id !== open.id));
                setOpenId(null);
              }}
            />
          )}
        </aside>
      </section>
    </>
  );
}

/* ---------- Parts of the board ---------- */

/** The label filter button and its menu (menu pattern: focus moves in, arrows / Home / End, Esc and Tab close) */
function LabelFilter({
  labels,
  filter,
  onFilter,
  open,
  onOpen,
  menuRef,
}: {
  labels: TaskLabel[];
  filter: Set<string>;
  onFilter: (next: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  open: boolean;
  onOpen: (open: boolean) => void;
  menuRef: RefObject<HTMLDivElement | null>;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const items = () => [...(listRef.current?.querySelectorAll<HTMLElement>("[role^='menuitem']") ?? [])];
  const moveIn = useRef<"first" | "last" | null>(null);
  useLayoutEffect(() => {
    if (!open || !moveIn.current) return;
    const list = items();
    (moveIn.current === "last" ? list[list.length - 1] : list[0])?.focus();
    moveIn.current = null;
  }, [open]);

  const close = (refocus: boolean) => {
    onOpen(false);
    if (refocus) triggerRef.current?.focus();
  };
  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const list = items();
    const at = list.indexOf(document.activeElement as HTMLElement);
    const go = (i: number) => {
      e.preventDefault();
      list[(i + list.length) % list.length]?.focus();
    };
    if (e.key === "ArrowDown") go(at + 1);
    else if (e.key === "ArrowUp") go(at - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(list.length - 1);
    else if (e.key === "Escape") {
      e.preventDefault();
      close(true);
    } else if (e.key === "Tab") close(false);
  };

  return (
    <div className="ui-tb__menu-wrap" ref={menuRef}>
      <Button
        ref={triggerRef}
        variant="ghost"
        size="sm"
        className="ui-tb__icon"
        aria-label={filter.size > 0 ? `Filter by label, ${filter.size} selected` : "Filter by label"}
        aria-haspopup="menu"
        aria-expanded={open}
        data-active={filter.size > 0 || undefined}
        icon={<Icon d="M2.5 4.5h11M4.5 8h7M6.5 11.5h3" />}
        onClick={() => {
          moveIn.current = "first";
          onOpen(!open);
        }}
        onKeyDown={(e) => {
          if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
          e.preventDefault();
          moveIn.current = e.key === "ArrowUp" ? "last" : "first";
          if (open) {
            const list = items();
            (moveIn.current === "last" ? list[list.length - 1] : list[0])?.focus();
            moveIn.current = null;
          } else onOpen(true);
        }}
      />
      {filter.size > 0 && <span className="ui-tb__dot" aria-hidden="true" />}
      {open && (
        <div className="ui-tb__menu" role="menu" aria-label="Labels" ref={listRef} onKeyDown={onMenuKey}>
          <p className="ui-tb__menu-title" aria-hidden="true">
            Labels
          </p>
          {labels.map((l) => (
            <button
              key={l.id}
              type="button"
              role="menuitemcheckbox"
              tabIndex={-1}
              aria-checked={filter.has(l.id)}
              className="ui-tb__menu-item"
              onClick={() =>
                onFilter((f) => {
                  const next = new Set(f);
                  if (next.has(l.id)) next.delete(l.id);
                  else next.add(l.id);
                  return next;
                })
              }
            >
              <span className="ui-tb__swatch" style={{ background: l.color }} />
              {l.label}
              {filter.has(l.id) && <Icon d="m3.5 8.5 3 3 6-7" size={14} />}
            </button>
          ))}
          {filter.size > 0 && (
            <button
              type="button"
              role="menuitem"
              tabIndex={-1}
              className="ui-tb__menu-item ui-tb__menu-clear"
              onClick={() => {
                onFilter(new Set());
                // This item goes away with the filter – focus moves to the first label
                items()[0]?.focus();
              }}
            >
              Clear filter
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** A card on the board – drag it, or open it with a click, Enter or Space */
function TaskCard({
  task: t,
  status,
  who,
  labelOf,
  dragging,
  onDragStart,
  onDragEnd,
  onOpen,
}: {
  task: Task;
  status: TaskStatus;
  who?: TaskPerson;
  labelOf: (id: string) => TaskLabel | undefined;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onOpen: () => void;
}) {
  return (
    <article
      className="ui-tb__card"
      data-card={t.id}
      data-dragging={dragging || undefined}
      draggable
      tabIndex={0}
      aria-label={`${t.key} ${t.title}`}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", t.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="ui-tb__card-top">
        <span className="ui-tb__key">{t.key}</span>
        {who && <Avatar person={who} size={18} />}
      </div>
      <p className="ui-tb__card-title">
        <span className="ui-tb__status">{status.icon}</span>
        <span>{t.title}</span>
      </p>
      <div className="ui-tb__props">
        <span className="ui-tb__prop" title={priorityNames[t.priority]}>
          <PriorityIcon level={t.priority} />
        </span>
        {t.estimate && (
          <span className="ui-tb__prop" title="Estimate">
            <Icon d="M8 2.5 13.5 12h-11Z" size={12} />
            {t.estimate}
          </span>
        )}
        {t.dueIn !== undefined && (
          <span className="ui-tb__prop" data-tone={t.dueIn < 0 ? "late" : t.dueIn <= 2 ? "soon" : undefined}>
            <Icon d="M8 14.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM8 6v3l2 1.2M6.5 1.5h3" size={12} />
            {t.dueIn < 0 ? `${-t.dueIn}d late` : t.dueIn === 0 ? "Today" : `${t.dueIn}d`}
          </span>
        )}
        {t.subtasks && (
          <span className="ui-tb__prop">
            <Ring done={t.subtasks[0]} total={t.subtasks[1]} />
            {t.subtasks[0]}/{t.subtasks[1]}
          </span>
        )}
        {t.pullRequest && (
          <span className="ui-tb__prop">
            <Icon d="M4.5 4v8M4.5 4a1.5 1.5 0 1 0 0-.01M11.5 12a1.5 1.5 0 1 0 0 .01M11.5 10.5V6.5a2 2 0 0 0-2-2H7.5M8.5 3.5l-1 1 1 1" size={12} />#
            {t.pullRequest}
          </span>
        )}
        {t.labels.map((id) => {
          const l = labelOf(id);
          return l ? (
            <span key={id} className="ui-tb__prop">
              <span className="ui-tb__swatch ui-tb__swatch--dot" style={{ background: l.color }} />
              {l.label}
            </span>
          ) : null;
        })}
      </div>
      <p className="ui-tb__created">Created {t.created}</p>
    </article>
  );
}

/** The detail panel's contents: title, status, priority, labels and assignee */
function TaskDetails({
  task,
  statuses,
  labels,
  people,
  onUpdate,
  onClose,
  onDelete,
}: {
  task: Task;
  statuses: TaskStatus[];
  labels: TaskLabel[];
  people: TaskPerson[];
  onUpdate: (patch: Partial<Task>) => void;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <div className="ui-tb__panel-head">
        <span className="ui-tb__key">{task.key}</span>
        <Button variant="ghost" size="sm" className="ui-tb__icon" aria-label="Close details" data-autofocus icon={<Icon d="m4 4 8 8M12 4l-8 8" />} onClick={onClose} />
      </div>
      <textarea
        className="ui-tb__title-input"
        value={task.title}
        rows={2}
        onChange={(e) => onUpdate({ title: e.target.value })}
        aria-label="Title"
      />
      <dl className="ui-tb__fields">
        <dt>Status</dt>
        <dd className="ui-tb__choices">
          {statuses.map((s) => (
            <button
              key={s.id}
              type="button"
              className="ui-tb__choice"
              aria-pressed={task.status === s.id}
              onClick={() => onUpdate({ status: s.id })}
            >
              <span className="ui-tb__status">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </dd>
        <dt>Priority</dt>
        <dd className="ui-tb__choices">
          {[4, 3, 2, 1, 0].map((p) => (
            <button
              key={p}
              type="button"
              className="ui-tb__choice"
              aria-pressed={task.priority === p}
              onClick={() => onUpdate({ priority: p as Task["priority"] })}
            >
              <PriorityIcon level={p} />
              {priorityNames[p]}
            </button>
          ))}
        </dd>
        <dt>Labels</dt>
        <dd className="ui-tb__choices">
          {labels.map((l) => {
            const on = task.labels.includes(l.id);
            return (
              <button
                key={l.id}
                type="button"
                className="ui-tb__choice"
                aria-pressed={on}
                onClick={() =>
                  onUpdate({ labels: on ? task.labels.filter((x) => x !== l.id) : [...task.labels, l.id] })
                }
              >
                <span className="ui-tb__swatch ui-tb__swatch--dot" style={{ background: l.color }} />
                {l.label}
              </button>
            );
          })}
        </dd>
        <dt>Assignee</dt>
        <dd className="ui-tb__choices">
          {people.map((p) => (
            <button
              key={p.id}
              type="button"
              className="ui-tb__choice"
              aria-pressed={task.assignee === p.id}
              onClick={() => onUpdate({ assignee: task.assignee === p.id ? undefined : p.id })}
            >
              <Avatar person={p} size={16} />
              {p.name.split(" ")[0]}
            </button>
          ))}
        </dd>
      </dl>
      <div className="ui-tb__panel-foot">
        <span>Created {task.created}</span>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          Delete task
        </Button>
      </div>
    </>
  );
}

/* ---------- Small parts ---------- */

function Avatar({ person, size }: { person: TaskPerson; size: number }) {
  return person.avatar ? (
    <img className="ui-tb__avatar" src={person.avatar} alt={person.name} title={person.name} width={size} height={size} loading="lazy" />
  ) : (
    <span className="ui-tb__avatar ui-tb__avatar--initials" style={{ width: size, height: size }} title={person.name}>
      {person.name[0]}
    </span>
  );
}

/** Three rising bars – filled up to the level; urgent is a small alert square */
function PriorityIcon({ level }: { level: number }) {
  if (level === 4) {
    return (
      <svg className="ui-tb__prio" viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
        <rect x="1" y="1" width="12" height="12" rx="3" className="ui-tb__prio-urgent" />
        <path d="M7 3.8v4M7 9.9v.3" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className="ui-tb__prio" viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <rect key={i} x={2 + i * 4} y={9 - i * 3} width="2.4" height={3 + i * 3} rx="0.8" className={level > i ? "ui-tb__prio-on" : "ui-tb__prio-off"} />
      ))}
    </svg>
  );
}

function Ring({ done, total }: { done: number; total: number }) {
  const c = 2 * Math.PI * 5;
  return (
    <svg viewBox="0 0 14 14" width="12" height="12" aria-hidden="true">
      <circle className="ui-tb__ring-track" cx="7" cy="7" r="5" fill="none" strokeWidth="2" />
      <circle
        cx="7"
        cy="7"
        r="5"
        fill="none"
        className="ui-tb__ring-fill"
        strokeWidth="2"
        strokeDasharray={`${(done / Math.max(1, total)) * c} ${c}`}
        transform="rotate(-90 7 7)"
      />
    </svg>
  );
}

const Chevron = () => <Icon d="m6 4 4 4-4 4" size={12} />;
const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
    <path
      d="m8 1.8 1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6Z"
      className={filled ? "ui-tb__star-on" : undefined}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  </svg>
);
const Icon = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg viewBox="0 0 16 16" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: every colour is a token or a light-dark() fallback, so dark follows color-scheme – a .dark class,
   data-theme / data-tc-theme="dark" or the OS setting (data-tc-theme="system") */
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }

.ui-tb {
  position: relative;
  isolation: isolate;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  container-type: inline-size;
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  border: var(--tc-hairline, 1px) solid var(--tc-border-default, light-dark(#ececec, #2a2a2e));
  border-radius: var(--tc-radius-3xl, 20px);
  font-family: var(--tc-font-sans, "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  -webkit-font-smoothing: antialiased;
}
.ui-tb *, .ui-tb *::before, .ui-tb *::after { box-sizing: border-box; }
.ui-tb :where(button:not(.ui-button)) { margin: 0; font: inherit; color: inherit; cursor: pointer; }
.ui-tb button:focus-visible, .ui-tb [tabindex]:focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); }

.ui-tb__top {
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: 0 14px 0 18px;
  border-bottom: var(--tc-hairline, 1px) solid var(--tc-divider, light-dark(#ececec, #2a2a2e));
}
.ui-tb__crumbs { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: var(--tc-font-size-lg, 14px); }
.ui-tb__logo { display: inline-flex; align-items: flex-end; gap: 2px; height: 14px; margin-right: 4px; }
.ui-tb__logo i { width: 3px; border-radius: var(--tc-radius-2xs, 2px); background: var(--tc-accent, #2f68ff); }
.ui-tb__logo i:nth-child(1) { height: 6px; opacity: 0.45; }
.ui-tb__logo i:nth-child(2) { height: 10px; opacity: 0.7; }
.ui-tb__logo i:nth-child(3) { height: 14px; }
.ui-tb__crumb { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
/* Phone width: only the last two steps of the path, so the breadcrumb stays on one line */
@container (max-width: 420px) {
  .ui-tb__crumb:not(:nth-last-of-type(-n + 2)) { display: none; }
}
.ui-tb__crumb svg { color: var(--tc-icon-muted, light-dark(#858585, #7c7c82)); }
.ui-tb__crumb[aria-current] { color: var(--tc-text-primary, light-dark(#171717, #ededed)); font-weight: var(--tc-font-weight-medium, 500); }

/* Icon buttons are the library's ghost Button (28 px square); pressed / active adds the selected tint and ring */
.ui-tb .ui-tb__icon.ui-tb__icon[data-variant]:is([aria-pressed="true"], [data-active]) {
  --tc-button-fg: var(--tc-accent-text, light-dark(#2456d6, #8ab4ff));
  background: var(--tc-accent-subtle, light-dark(rgba(47, 107, 255, 0.08), rgba(79, 130, 255, 0.16)));
  box-shadow: inset 0 0 0 var(--tc-hairline, 1px) var(--tc-border-selected, light-dark(#2f68ff, #6b95ff));
}
.ui-tb__star-on { fill: var(--tc-status-warning-solid, light-dark(#c2710c, #f5a524)); stroke: var(--tc-status-warning-solid, light-dark(#c2710c, #f5a524)); }
.ui-tb__dot { position: absolute; top: 4px; right: 4px; width: 6px; height: 6px; border-radius: 50%; background: var(--tc-accent, #2f68ff); pointer-events: none; }

.ui-tb__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 46px;
  padding: 0 12px 0 18px;
}
.ui-tb__count { font-size: var(--tc-font-size-md, 13px); font-variant-numeric: tabular-nums; white-space: nowrap; color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-tb__count span { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-tb__tools { display: flex; align-items: center; gap: 4px; }
/* Toolbar search: the field pattern on the sunken fill, at the toolbar's control height */
.ui-tb__search {
  display: flex;
  align-items: center;
  gap: 6px;
  width: clamp(110px, 30vw, 170px);
  height: var(--tc-control-h-sm, 28px);
  margin-right: 4px;
  padding: 0 10px;
  border-radius: var(--tc-field-radius, 10px);
  background: var(--tc-field-bg-sunken, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)));
  box-shadow: var(--tc-field-shadow, inset 0 0 0 1px light-dark(#858585, #7c7c82), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
  transition: box-shadow var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease), background-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-tb__search:hover { box-shadow: var(--tc-field-shadow-hover, inset 0 0 0 1px light-dark(#646464, #9a9aa1), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-tb__search:focus-within { background: var(--tc-field-bg, light-dark(#ffffff, #232326)); box-shadow: var(--tc-field-shadow-focus, inset 0 0 0 1px light-dark(#2f68ff, #6b95ff), 0 0 0 3px color-mix(in srgb, light-dark(#2f68ff, #6b95ff) 24%, transparent)); }
.ui-tb__search input { flex: 1; min-width: 0; border: 0; outline: none; background: transparent; font: inherit; font-size: var(--tc-field-font-size, 13px); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-tb__search input::placeholder { color: var(--tc-text-placeholder, light-dark(#646464, #8e8e95)); }
.ui-tb__search input::-webkit-search-cancel-button { display: none; }
.ui-tb__menu-wrap { position: relative; }
.ui-tb__menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: var(--tc-z-dropdown, 30);
  display: grid;
  gap: 2px;
  min-width: 180px;
  padding: var(--tc-menu-padding, 4px);
  border-radius: var(--tc-menu-radius, 12px);
  background: var(--tc-menu-bg, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-menu-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6)));
  animation: ui-tb-drop var(--tc-duration-base, 200ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-tb__menu-title {
  margin: 0;
  padding: 6px var(--tc-menu-item-px, 10px) 2px;
  font-size: var(--tc-caption-font-size, 12px);
  font-weight: var(--tc-caption-font-weight, 500);
  line-height: var(--tc-caption-line-height, 16px);
  color: var(--tc-caption-color, light-dark(#646464, #9a9aa1));
}
.ui-tb__menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: var(--tc-menu-item-h, 32px);
  padding: 0 var(--tc-menu-item-px, 10px);
  border: 0;
  border-radius: var(--tc-menu-item-radius, 8px);
  background: transparent;
  font-size: var(--tc-menu-item-font-size, 13px);
  text-align: left;
}
.ui-tb__menu-item svg { margin-left: auto; color: var(--tc-menu-item-selected-fg, light-dark(#2456d6, #8ab4ff)); }
.ui-tb__menu-item:hover, .ui-tb__menu-item:focus-visible { background: var(--tc-menu-item-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); }
.ui-tb__menu-item[aria-checked="true"] { color: var(--tc-menu-item-selected-fg, light-dark(#2456d6, #8ab4ff)); }
.ui-tb .ui-tb__menu-item:focus-visible { outline-offset: calc(var(--tc-focus-ring-width, 2px) * -1); }
.ui-tb .ui-tb__menu-clear { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-tb__swatch { flex: none; width: 8px; height: 8px; border-radius: var(--tc-radius-2xs, 2px); }
.ui-tb__swatch--dot { border-radius: 50%; }
.ui-tb__prio-on { fill: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-tb__prio-off { fill: var(--tc-border-strong, light-dark(#dedede, #3a3a40)); }
.ui-tb__prio-urgent { fill: var(--tc-tone-pink-solid, light-dark(#ec4899, #f472b6)); }
.ui-tb__ring-track { stroke: var(--tc-border-default, light-dark(#ececec, #2a2a2e)); }
.ui-tb__ring-fill { stroke: var(--tc-accent, #2f68ff); }

/* Columns: gray lanes like our trays, white cards on top */
.ui-tb__columns {
  display: grid;
  grid-auto-columns: minmax(224px, 1fr);
  grid-auto-flow: column;
  gap: 10px;
  padding: 0 12px 12px;
  overflow-x: auto;
  scrollbar-width: thin;
}
.ui-tb__column {
  display: flex;
  flex-direction: column;
  min-height: 300px;
  padding: 4px 6px 6px;
  border-radius: var(--tc-radius-2xl, 16px);
  background: var(--tc-surface-sunken, light-dark(#f0f0f0, #111113));
  transition: background-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease), box-shadow var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-tb__column[data-over] { background: var(--tc-accent-subtle, light-dark(rgba(47, 107, 255, 0.08), rgba(79, 130, 255, 0.16))); box-shadow: inset 0 0 0 var(--tc-hairline, 1px) var(--tc-border-selected, light-dark(#2f68ff, #6b95ff)); }
.ui-tb__col-head { display: flex; align-items: center; gap: 8px; height: 38px; padding: 0 4px 0 8px; }
.ui-tb__col-title { font-size: var(--tc-font-size-md-plus, 13.5px); font-weight: var(--tc-font-weight-medium, 500); }
.ui-tb__col-count { font-size: var(--tc-font-size-sm-plus, 12.5px); font-variant-numeric: tabular-nums; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-tb__add { margin-left: auto; }
.ui-tb__status { display: grid; place-items: center; flex: none; width: 15px; height: 15px; }
.ui-tb__status svg { width: 15px; height: 15px; }
.ui-tb__cards { display: grid; align-content: start; gap: 6px; flex: 1; }
.ui-tb__slot { display: grid; gap: 6px; }

.ui-tb__card {
  padding: 10px 12px 11px;
  border-radius: var(--tc-radius-xl, 12px);
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  cursor: grab;
  animation: ui-tb-in var(--tc-duration-slow, 320ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)) both;
  transition: box-shadow var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease), opacity var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease), transform var(--tc-duration-base, 200ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-tb__card:hover { box-shadow: var(--tc-card-shadow-hover, 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6))); }
.ui-tb__card:active { cursor: grabbing; }
.ui-tb__card[data-dragging] { opacity: 0.35; transform: scale(0.98); }
.ui-tb__card-top { display: flex; align-items: center; justify-content: space-between; min-height: 18px; }
.ui-tb__key { font-size: var(--tc-font-size-sm, 12px); font-variant-numeric: tabular-nums; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-tb__avatar { flex: none; border-radius: 50%; object-fit: cover; box-shadow: 0 0 0 var(--tc-hairline, 1px) var(--tc-border-default, light-dark(#ececec, #2a2a2e)); }
.ui-tb__avatar--initials { display: grid; place-items: center; background: var(--tc-accent-subtle, light-dark(rgba(47, 107, 255, 0.08), rgba(79, 130, 255, 0.16))); font-size: 0.5625rem; font-weight: var(--tc-font-weight-semibold, 600); color: var(--tc-accent-text, light-dark(#2456d6, #8ab4ff)); }
.ui-tb__card-title { display: flex; gap: 8px; margin: 4px 0 0; font-size: var(--tc-font-size-md-plus, 13.5px); font-weight: var(--tc-font-weight-regular, 400); line-height: var(--tc-line-height-normal, 20px); }
.ui-tb__card-title .ui-tb__status { margin-top: 2px; }
.ui-tb__props { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 9px; }
/* Properties: the pill pattern (outlined) */
.ui-tb__prop {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: var(--tc-pill-h-lg, 22px);
  padding: 0 var(--tc-pill-px, 8px);
  border-radius: var(--tc-pill-radius, 999px);
  box-shadow: inset 0 0 0 var(--tc-hairline, 1px) var(--tc-border-default, light-dark(#ececec, #2a2a2e));
  font-size: var(--tc-font-size-xs-plus, 11.5px);
  font-weight: var(--tc-font-weight-regular, 400);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
}
.ui-tb__prop svg { flex: none; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-tb__prop[data-tone="soon"] { color: var(--tc-status-warning-fg, light-dark(#a35200, #ffa057)); }
.ui-tb__prop[data-tone="soon"] svg { color: var(--tc-status-warning-solid, light-dark(#c2710c, #f5a524)); }
.ui-tb__prop[data-tone="late"] { color: var(--tc-tone-pink-fg, light-dark(#be185d, #f9a8d4)); background: var(--tc-tone-pink-bg, light-dark(rgba(236, 72, 153, 0.1), rgba(244, 114, 182, 0.16))); box-shadow: inset 0 0 0 var(--tc-hairline, 1px) var(--tc-tone-pink-border, color-mix(in srgb, light-dark(#ec4899, #f472b6) 40%, transparent)); }
.ui-tb__prop[data-tone="late"] svg { color: var(--tc-tone-pink-solid, light-dark(#ec4899, #f472b6)); }
.ui-tb__created { margin: 9px 0 0; font-size: var(--tc-font-size-xs-plus, 11.5px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-tb[data-compact] .ui-tb__props, .ui-tb[data-compact] .ui-tb__created { display: none; }

.ui-tb__drop { display: block; height: 3px; margin: -1px 4px; border-radius: var(--tc-radius-2xs, 2px); background: var(--tc-accent, #2f68ff); animation: ui-tb-grow var(--tc-duration-fast, 150ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)); }
.ui-tb__empty {
  display: grid;
  place-items: center;
  min-height: 80px;
  margin: 0;
  border: var(--tc-hairline, 1px) dashed var(--tc-border-strong, light-dark(#dedede, #3a3a40));
  border-radius: var(--tc-radius-xl, 12px);
  font-size: var(--tc-font-size-sm-plus, 12.5px);
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
}
.ui-tb__new input {
  width: 100%;
  height: var(--tc-field-h, 36px);
  padding: 0 var(--tc-field-px, 12px);
  border: 0;
  border-radius: var(--tc-radius-xl, 12px);
  outline: none;
  background: var(--tc-field-bg, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-field-shadow-focus, inset 0 0 0 1px light-dark(#2f68ff, #6b95ff), 0 0 0 3px color-mix(in srgb, light-dark(#2f68ff, #6b95ff) 24%, transparent));
  font: inherit;
  font-size: var(--tc-field-font-size, 13px);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
}
.ui-tb__new input::placeholder { color: var(--tc-text-placeholder, light-dark(#646464, #8e8e95)); }

/* Detail panel */
.ui-tb__scrim {
  position: absolute;
  inset: 0;
  z-index: var(--tc-z-drawer-scrim, 40);
  background: light-dark(rgba(23, 23, 23, 0.08), rgba(0, 0, 0, 0.4));
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--tc-duration-moderate, 260ms) var(--tc-ease-standard, ease);
}
.ui-tb__scrim[data-open] { opacity: 1; pointer-events: auto; }
.ui-tb__panel {
  position: absolute;
  top: 8px;
  right: 8px;
  bottom: 8px;
  z-index: var(--tc-z-drawer, 50);
  display: flex;
  flex-direction: column;
  width: min(360px, calc(100% - 16px));
  padding: 14px 16px 14px;
  overflow-y: auto;
  border-radius: var(--tc-radius-2xl, 16px);
  background: var(--tc-surface-overlay, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-shadow-overlay, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6)));
  transform: translateX(calc(100% + 24px));
  transition: transform var(--tc-duration-slower, 420ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-tb__panel[data-open] { transform: none; }
.ui-tb__panel-head { display: flex; align-items: center; justify-content: space-between; }
.ui-tb__title-input {
  margin: 8px -6px 0;
  padding: 4px 6px;
  border: 0;
  border-radius: var(--tc-radius-md, 8px);
  outline: none;
  resize: none;
  background: transparent;
  font: inherit;
  font-size: var(--tc-font-size-xl, 16px);
  font-weight: var(--tc-font-weight-semibold, 600);
  line-height: var(--tc-line-height-loose, 24px);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  transition: box-shadow var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-tb__title-input:hover { background: var(--tc-fill-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); }
.ui-tb__title-input:focus { background: var(--tc-field-bg, light-dark(#ffffff, #232326)); box-shadow: var(--tc-field-shadow-focus, inset 0 0 0 1px light-dark(#2f68ff, #6b95ff), 0 0 0 3px color-mix(in srgb, light-dark(#2f68ff, #6b95ff) 24%, transparent)); }
.ui-tb__fields { display: grid; gap: 6px; margin: 14px 0 0; }
.ui-tb__fields dt { margin-top: 8px; font-size: var(--tc-caption-font-size, 12px); font-weight: var(--tc-caption-font-weight, 500); line-height: var(--tc-caption-line-height, 16px); color: var(--tc-caption-color, light-dark(#646464, #9a9aa1)); }
.ui-tb__fields dd { margin: 0; }
.ui-tb__choices { display: flex; flex-wrap: wrap; gap: 5px; }
/* Choices: the secondary button's surface; the chosen one gets the selected fill, a ring and the strong weight */
.ui-tb .ui-tb__choice {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: var(--tc-control-h-sm, 28px);
  padding: 0 9px;
  border: 0;
  border-radius: var(--tc-control-radius-sm, 8px);
  background: var(--tc-action-secondary-bg, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-action-secondary-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  font-size: var(--tc-font-size-sm-plus, 12.5px);
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
  transition: background-color var(--tc-duration-quick, 120ms) var(--tc-ease-standard, ease), box-shadow var(--tc-duration-quick, 120ms) var(--tc-ease-standard, ease);
}
.ui-tb .ui-tb__choice:hover { box-shadow: var(--tc-action-secondary-shadow-hover, 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6))); }
.ui-tb .ui-tb__choice[aria-pressed="true"] {
  background: var(--tc-fill-selected, light-dark(rgba(47, 107, 255, 0.08), rgba(91, 154, 255, 0.14)));
  box-shadow: inset 0 0 0 var(--tc-hairline, 1px) var(--tc-border-selected, light-dark(#2f68ff, #6b95ff));
  font-weight: var(--tc-font-weight-medium, 500);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
}
.ui-tb__panel-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 16px;
  font-size: var(--tc-font-size-sm, 12px);
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
}

@keyframes ui-tb-in { from { opacity: 0; transform: translateY(3px); } }
@keyframes ui-tb-drop { from { opacity: 0; transform: translateY(-4px) scale(0.98); } }
@keyframes ui-tb-grow { from { transform: scaleX(0.6); opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .ui-tb__card, .ui-tb__menu, .ui-tb__drop { animation: none; }
  .ui-tb__panel, .ui-tb__scrim, .ui-tb__card { transition: none; }
}

/* Text fields show their focus with the field ring (above), not a second outline – also against global
   :focus-visible rules of the host page */
.ui-tb input:not([type="checkbox"]):not([type="radio"]):focus-visible,
.ui-tb textarea:focus-visible { outline: none; }
`;
