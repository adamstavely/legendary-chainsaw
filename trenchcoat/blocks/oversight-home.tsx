"use client";

import {
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type Ref,
} from "react";
import { Button, DataTable, KpiChart, SegmentedControl, type DataRow, type KpiSeries, type Look } from "trenchcoat/react";
import { lookContext } from "trenchcoat/look-provider";

/*
 * Oversight Home – the first screen for someone who oversees AI work, in one self-contained file. Each role gets its
 * own home; switch roles at the top right. A home has:
 *   · the day and the role, a headline that says what needs doing, and a line on what this home covers
 *   · the one thing that needs this person first, with a way in
 *   · the library's KPI Chart for each number the role watches – this week against the last
 *   · service posture: the library's Data Table, read only, with each service's state, availability and last event,
 *     and a filter by state – degraded and down services sort to the top
 * Built on the Trenchcoat elements through `trenchcoat/react` (Button, SegmentedControl, KpiChart, DataTable). The
 * look follows the nearest <LookProvider> – the same one the elements read – or the `look` prop. The styles are
 * injected below and use only the shared tokens.
 */

export type ServiceState = "normal" | "limited" | "down" | "unknown";

export type OversightKpi = {
  id: string;
  /** What is counted, e.g. "Decisions awaiting review" */
  label: string;
  /** The headline number, already formatted */
  value: string;
  /** Change against the last period, in percent – positive is up */
  delta?: number;
  /** A drop is good news (pending work, latency, incidents): the change shows green when it falls */
  lowerIsBetter?: boolean;
  /** One label per point, e.g. weekdays */
  labels: string[];
  /** This period, one value per label */
  values: number[];
  /** The period before, drawn as a second, dashed line */
  previous?: number[];
  /** A line under the chart, e.g. "3 overdue" */
  footer?: string;
  /** Line colours – this period, then the last: any CSS colour, tokens included (`var(--tc-chart-3, light-dark(#ec4899, #f472b6))`) */
  colors?: [string, string?];
};

export type OversightService = {
  id: string;
  name: string;
  state: ServiceState;
  /** e.g. "99.95%" */
  availability?: string;
  /** What happened last, e.g. "Health check passed · 4m ago" */
  lastEvent?: string;
};

export type OversightRole = {
  id: string;
  /** The role's name in the switcher, e.g. "Reviewer" */
  label: string;
  /** The kicker above the headline, e.g. "Friday · 12 June · Review" */
  eyebrow?: string;
  /** What needs doing, as a sentence – e.g. "5 decisions are waiting for you." */
  headline: string;
  /** What this home covers */
  summary?: string;
  /** The one thing that needs this person first */
  focus?: { label: string; detail?: string; action?: string };
  kpis: OversightKpi[];
  services: OversightService[];
  /** A line above the services, e.g. who can see what */
  servicesNote?: string;
};

type OwnProps = {
  roles: OversightRole[];
  /** Id of the role on show (controlled) */
  role?: string;
  /** The role at first when uncontrolled – the first one by default */
  defaultRole?: string;
  /** Called when another role is picked */
  onRoleChange?: (id: string) => void;
  /** The focus card's action was pressed */
  onOpenFocus?: (role: OversightRole) => void;
  /** Words for the service states – "Normal", "Limited", "Down", "Unknown" by default */
  stateLabels?: Partial<Record<ServiceState, string>>;
  /** Names of the two lines in each chart */
  currentLabel?: string;
  previousLabel?: string;
  /** "standard" or "clean"; unset follows the nearest LookProvider */
  look?: Look;
  className?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

export type OversightHomeProps = Omit<ComponentPropsWithoutRef<"div">, keyof OwnProps> & OwnProps;

const STATES: Record<ServiceState, string> = { normal: "Normal", limited: "Limited", down: "Down", unknown: "Unknown" };
const TONES = { normal: "green", limited: "amber", down: "pink", unknown: "gray" } as const;
const RANK: Record<ServiceState, number> = { down: 0, limited: 1, unknown: 2, normal: 3 };
/** The look's chart tokens: this period in the first series colour, the one before in the neutral */
const LINES: [string, string] = ["var(--tc-chart-1, light-dark(#2f68ff, #6b95ff))", "var(--tc-chart-neutral, light-dark(#a3a3a3, #5c5c63))"];
type Filter = "all" | ServiceState;
/** The change, in percent: "+6%", "−50%" */
const percent = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n)}%`;

export function OversightHome({
  roles,
  role: roleProp,
  defaultRole,
  onRoleChange,
  onOpenFocus,
  stateLabels,
  currentLabel = "This week",
  previousLabel = "Last week",
  look: lookProp,
  className,
  ref,
  ...rest
}: OversightHomeProps) {
  const uid = "ui-ovh" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [look, setLookNode] = useLook(lookProp);
  const setRoot = useCallback(
    (node: HTMLDivElement | null) => {
      setLookNode(node);
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
    },
    [ref, setLookNode],
  );
  const [roleId, setRole] = useControllable(roleProp, defaultRole ?? roles[0]?.id ?? "", onRoleChange, "role");
  const role = roles.find((r) => r.id === roleId) ?? roles[0];
  const [filter, setFilter] = useState<Filter>("all");
  const labels = useMemo(() => ({ ...STATES, ...stateLabels }), [stateLabels]);
  const tagTones = useMemo(() => Object.fromEntries((Object.keys(TONES) as ServiceState[]).map((s) => [labels[s], TONES[s]])), [labels]);

  const services = useMemo(() => role?.services ?? [], [role]);
  const rows: DataRow[] = useMemo(
    () =>
      services
        .filter((s) => filter === "all" || s.state === filter)
        .sort((a, b) => RANK[a.state] - RANK[b.state])
        .map((s) => ({ id: s.id, name: s.name, state: labels[s.state], availability: s.availability ?? "–", event: s.lastEvent ?? "" })),
    [services, filter, labels],
  );
  const present = (["normal", "limited", "down", "unknown"] as ServiceState[]).filter((s) => services.some((x) => x.state === s));
  const troubled = services.filter((s) => s.state === "down" || s.state === "limited").length;

  if (!role) return <div {...rest} ref={setRoot} className={["ui-ovh", className].filter(Boolean).join(" ")} />;

  return (
    <div {...rest} ref={setRoot} data-look={look} className={["ui-ovh", className].filter(Boolean).join(" ")}>
      <style href="ui-oversight-home" precedence="default">
        {css}
      </style>

      <header className="ui-ovh__intro">
        <div className="ui-ovh__intro-text">
          {role.eyebrow && <p className="ui-ovh__eyebrow">{role.eyebrow}</p>}
          <h2 className="ui-ovh__headline">{role.headline}</h2>
          {role.summary && <p className="ui-ovh__summary">{role.summary}</p>}
        </div>
        {roles.length > 1 && (
          <SegmentedControl
            look={look}
            aria-label="Role"
            value={role.id}
            onChange={(id) => {
              setRole(id);
              setFilter("all");
            }}
            options={roles.map((r) => ({ value: r.id, label: r.label }))}
          />
        )}
      </header>

      {role.focus && (
        <section className="ui-ovh__focus" aria-labelledby={`${uid}-focus`}>
          <span className="ui-ovh__focus-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1zM12 8v4M12 16h.01" />
            </svg>
          </span>
          <div className="ui-ovh__focus-text">
            <p className="ui-ovh__caption">Needs you first</p>
            <h3 id={`${uid}-focus`} className="ui-ovh__focus-title">
              {role.focus.label}
            </h3>
            {role.focus.detail && <p className="ui-ovh__focus-detail">{role.focus.detail}</p>}
          </div>
          {onOpenFocus && (
            <Button look={look} variant="primary" onClick={() => onOpenFocus(role)}>
              {role.focus.action ?? "Open"}
            </Button>
          )}
        </section>
      )}

      {role.kpis.length > 0 && (
        <div className="ui-ovh__kpis" key={role.id}>
          {role.kpis.map((k) => {
            const [now, before] = [k.colors?.[0] ?? LINES[0], k.colors?.[1] ?? LINES[1]];
            const series: KpiSeries[] = [{ label: currentLabel, color: now, values: k.values }];
            if (k.previous) series.push({ label: previousLabel, color: before, values: k.previous });
            return (
              <KpiChart
                key={k.id}
                look={look}
                fill
                title={k.label}
                value={k.value}
                delta={k.delta}
                deltaFormat={percent}
                lowerIsBetter={k.lowerIsBetter}
                labels={k.labels}
                series={series}
                footer={k.footer}
              />
            );
          })}
        </div>
      )}

      <section className="ui-ovh__posture" aria-labelledby={`${uid}-posture`}>
        <div className="ui-ovh__section-head">
          <h3 id={`${uid}-posture`} className="ui-ovh__section-title">
            Service posture
          </h3>
          <span className="ui-ovh__posture-note">
            {troubled ? `${troubled} of ${services.length} need attention` : `All ${services.length} running normally`}
          </span>
          {present.length > 1 && (
            <SegmentedControl<Filter>
              look={look}
              size="sm"
              aria-label="Filter services by state"
              value={filter}
              onChange={setFilter}
              options={[{ value: "all", label: "All" }, ...present.map((s) => ({ value: s, label: labels[s], badge: String(services.filter((x) => x.state === s).length) }))]}
            />
          )}
        </div>
        {role.servicesNote && <p className="ui-ovh__note">{role.servicesNote}</p>}
        <DataTable look={look} title="Services" editable={false} columns={COLUMNS} rows={rows} onRowsChange={() => {}} tagTones={tagTones} />
      </section>
    </div>
  );
}

const COLUMNS = [
  { key: "name", label: "Service", type: "text" as const },
  { key: "state", label: "State", type: "tag" as const, width: "116px" },
  { key: "availability", label: "Availability", type: "text" as const, width: "132px" },
  { key: "event", label: "Last event", type: "text" as const, width: "38%" },
];

/* ---------- Hooks ---------- */

/**
 * The block's look: the `look` prop, else the nearest <LookProvider> (asked through the same context the elements
 * use, and followed when it changes), else the page's data-tc-look. Unset, the page's tokens apply as they are.
 */
function useLook(own: Look | undefined) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [inherited, setInherited] = useState<Look | undefined>(undefined);
  useLayoutEffect(() => {
    if (own || !node) return;
    let stop: (() => void) | undefined;
    let answered = false;
    const request = Object.assign(new Event("context-request", { bubbles: true, composed: true }), {
      context: lookContext,
      contextTarget: node,
      subscribe: true,
      callback: (value: Look | undefined, unsubscribe?: () => void) => {
        answered = true;
        stop = unsubscribe;
        setInherited(value);
      },
    });
    node.dispatchEvent(request);
    if (!answered) {
      const page = node.parentElement?.closest("[data-look], [data-tc-look]");
      const value = page?.getAttribute("data-look") ?? page?.getAttribute("data-tc-look");
      setInherited(value === "clean" || value === "standard" ? value : undefined);
    }
    return () => stop?.();
  }, [own, node]);
  return [own ?? inherited, setNode] as const;
}

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
  const latest = useRef(current);
  latest.current = current;
  const report = useRef(onChange);
  report.current = onChange;
  const set = useCallback(
    (next: T) => {
      if (Object.is(next, latest.current)) return;
      if (!controlled) setOwn(next);
      latest.current = next;
      report.current?.(next);
    },
    [controlled],
  );
  return [current, set] as const;
}

/* ---------- Styles ---------- */

const css = /* css */ `
.ui-ovh {
  container-type: inline-size;
  width: 100%;
  min-width: 0;
  display: grid;
  gap: var(--tc-space-6, 24px);
  font-family: var(--tc-font-sans, "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: var(--tc-font-size-md, 13px);
  line-height: var(--tc-line-height-normal, 20px);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  -webkit-font-smoothing: antialiased;
}
.ui-ovh *, .ui-ovh *::before, .ui-ovh *::after { box-sizing: border-box; }

.ui-ovh__intro { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: var(--tc-space-4, 16px); }
.ui-ovh__intro-text { flex: 1 1 320px; display: grid; gap: var(--tc-space-1-5, 6px); min-width: 0; }
.ui-ovh__eyebrow { margin: 0; color: var(--tc-eyebrow-color, light-dark(#646464, #9a9aa1)); font-size: var(--tc-eyebrow-font-size, 11px); font-weight: var(--tc-eyebrow-font-weight, 500); line-height: var(--tc-eyebrow-line-height, 16px); letter-spacing: var(--tc-eyebrow-tracking, 0.04em); text-transform: var(--tc-eyebrow-transform, uppercase); }
/* Deliberately display-sized: the home's one sentence */
.ui-ovh__headline { margin: 0; color: var(--tc-text-strong, light-dark(#171717, #f5f5f5)); font-size: var(--tc-font-size-4xl, 28px); font-weight: var(--tc-font-weight-semibold, 600); line-height: var(--tc-line-height-display, 32px); letter-spacing: var(--tc-tracking-tight, -0.02em); text-wrap: balance; }
.ui-ovh[data-look="clean"] .ui-ovh__headline { font-weight: var(--tc-font-weight-medium, 500); }
@container (max-width: 520px) { .ui-ovh__headline { font-size: var(--tc-font-size-3xl, 24px); line-height: var(--tc-line-height-display-sm, 28px); } }
.ui-ovh__summary { margin: 0; max-width: 60ch; color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); font-size: var(--tc-font-size-lg, 14px); line-height: var(--tc-line-height-relaxed, 22px); }

/* The one thing first: a tinted band with a boxed icon */
.ui-ovh__focus { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-3, 12px) var(--tc-space-4, 16px); padding: var(--tc-space-4, 16px); border-radius: var(--tc-tray-radius, calc(16px + 4px)); background: var(--tc-status-warning-bg, light-dark(#fff3e0, #3a2410)); box-shadow: inset 0 0 0 var(--tc-hairline, 1px) var(--tc-status-warning-border, color-mix(in srgb, light-dark(#c2710c, #f5a524) 40%, transparent)); }
.ui-ovh__focus-icon { flex: none; display: grid; place-items: center; width: var(--tc-space-10, 40px); height: var(--tc-space-10, 40px); border-radius: var(--tc-radius-lg, 10px); background: var(--tc-surface-raised, light-dark(#ffffff, #19191b)); box-shadow: var(--tc-shadow-control, 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); color: var(--tc-status-warning-fg, light-dark(#a35200, #ffa057)); }
.ui-ovh__focus-icon svg { width: var(--tc-space-5, 20px); height: var(--tc-space-5, 20px); stroke-width: var(--tc-head-glyph-stroke, 1.75); }
.ui-ovh__focus-text { flex: 1 1 220px; min-width: 0; }
.ui-ovh__caption { margin: 0; color: var(--tc-status-warning-fg, light-dark(#a35200, #ffa057)); font-size: var(--tc-caption-font-size, 12px); font-weight: var(--tc-caption-font-weight, 500); line-height: var(--tc-caption-line-height, 16px); letter-spacing: var(--tc-caption-tracking, 0); text-transform: var(--tc-caption-transform, none); }
.ui-ovh__focus-title { margin: 0; color: var(--tc-title-color, light-dark(#171717, #ededed)); font-size: var(--tc-title-font-size, 14px); font-weight: var(--tc-title-font-weight, 600); line-height: var(--tc-title-line-height, 20px); letter-spacing: var(--tc-title-tracking, -0.006em); }
.ui-ovh__focus-detail { margin: 0; color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); font-size: var(--tc-font-size-sm, 12px); }

.ui-ovh__kpis { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr)); gap: var(--tc-space-4, 16px); animation: ui-ovh-in var(--tc-duration-moderate, 260ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)) both; }

.ui-ovh__posture { display: grid; gap: var(--tc-space-3, 12px); min-width: 0; }
.ui-ovh__section-head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2, 8px) var(--tc-space-3, 12px); }
.ui-ovh__section-title { margin: 0; color: var(--tc-text-strong, light-dark(#171717, #f5f5f5)); font-size: var(--tc-font-size-xl, 16px); font-weight: var(--tc-font-weight-semibold, 600); line-height: var(--tc-line-height-loose, 24px); letter-spacing: var(--tc-tracking-snug, -0.01em); }
.ui-ovh[data-look="clean"] .ui-ovh__section-title { font-weight: var(--tc-font-weight-medium, 500); }
.ui-ovh__posture-note { flex: 1 1 auto; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); font-size: var(--tc-font-size-sm, 12px); }
.ui-ovh__note { margin: 0; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); font-size: var(--tc-font-size-sm, 12px); }

@keyframes ui-ovh-in { from { opacity: 0; transform: translateY(4px); } }
@media (prefers-reduced-motion: reduce) { .ui-ovh__kpis { animation: none; } }
@media (forced-colors: active) { .ui-ovh__focus, .ui-ovh__focus-icon { border: 1px solid CanvasText; } }
`;
