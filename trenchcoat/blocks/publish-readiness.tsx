"use client";

import {
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type Ref,
} from "react";
import { Button, Dialog, ProgressTracker, type Look, type ProgressStep } from "trenchcoat/react";
import { lookContext } from "trenchcoat/look-provider";

/*
 * Publish Readiness – what must pass before something is released, in one self-contained file. A summary card says
 * how close the release is (checks passed, blockers left) and opens a dialog that walks through every check:
 *   · the checks as the library's Progress Tracker – sign-offs the person gives tick by hand; automated checks are
 *     read-only rows (passed, failed, or still to run)
 *   · each failing check with the blockers behind it, every blocker a link the app opens
 *   · checks still to run (e.g. during approval) and who approves; the publish action sits in the dialog's footer,
 *     held back while anything blocks
 * Built on the Trenchcoat elements through `trenchcoat/react` (Button, Dialog, ProgressTracker). The look follows
 * the nearest <LookProvider> – the same one the elements read – or the `look` prop. The styles are injected below and
 * use only the shared tokens.
 */

export type ReadinessState = "passed" | "failed" | "pending" | "manual";

export type ReadinessBlocker = {
  id: string;
  /** What blocks, e.g. "Step 4 has no reviewer" */
  label: string;
  /** Where it is, e.g. "Spec · step 4" */
  where?: string;
};

export type ReadinessCheck = {
  id: string;
  /** What must hold, e.g. "Spec is valid" */
  label: string;
  /** passed / failed (has blockers) / pending (runs later, e.g. during approval) / manual (a person signs it off) */
  state: ReadinessState;
  /** A line of detail – shown under the checklist for checks that run later, and in the blocker list */
  detail?: string;
  /** Why a failed check fails – each one opens with onOpenBlocker */
  blockers?: ReadinessBlocker[];
};

type OwnProps = {
  /** What is being released, e.g. "Daily briefing" */
  subject: string;
  /** Its version, e.g. "v1.3" */
  version?: string;
  checks: ReadinessCheck[];
  /** Ids of the manual checks the person has signed off (controlled) */
  confirmed?: string[];
  /** Signed off at first when uncontrolled */
  defaultConfirmed?: string[];
  /** Called with every change to the signed-off ids */
  onConfirmedChange?: (ids: string[]) => void;
  /** Whether the dialog is open (controlled) */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** A blocker's link was followed – open the place it points at */
  onOpenBlocker?: (blocker: ReadinessBlocker, check: ReadinessCheck) => void;
  /** The release action – enabled once nothing blocks and every sign-off is given */
  onPublish?: () => void;
  /** The dialog's heading – "Ready to publish?" by default */
  title?: string;
  /** The line under the summary's title */
  description?: ReactNode;
  /** Who approves and what happens next – a note above the action */
  note?: ReactNode;
  /** The action's label – "Submit for approval" by default */
  publishLabel?: string;
  /** "standard" or "clean"; unset follows the nearest LookProvider */
  look?: Look;
  className?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

export type PublishReadinessProps = Omit<ComponentPropsWithoutRef<"div">, keyof OwnProps> & OwnProps;

const NONE: string[] = [];

export function PublishReadiness({
  subject,
  version,
  checks,
  confirmed: confirmedProp,
  defaultConfirmed = NONE,
  onConfirmedChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  onOpenBlocker,
  onPublish,
  title = "Ready to publish?",
  description,
  note,
  publishLabel = "Submit for approval",
  look: lookProp,
  className,
  ref,
  ...rest
}: PublishReadinessProps) {
  const uid = "ui-prd" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [look, setLookNode] = useLook(lookProp);
  const setRoot = useCallback(
    (node: HTMLDivElement | null) => {
      setLookNode(node);
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
    },
    [ref, setLookNode],
  );
  const [confirmed, setConfirmed] = useControllable(confirmedProp, defaultConfirmed, onConfirmedChange, "confirmed");
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange, "open");
  const [said, setSaid] = useState("");

  const manual = checks.filter((c) => c.state === "manual");
  const failed = checks.filter((c) => c.state === "failed");
  const pending = checks.filter((c) => c.state === "pending");
  const signed = manual.filter((c) => confirmed.includes(c.id));
  const passed = checks.filter((c) => c.state === "passed").length + signed.length;
  const blockers = failed.reduce((n, c) => n + Math.max(1, c.blockers?.length ?? 0), 0);
  const unsigned = manual.length - signed.length;
  const ready = blockers === 0 && unsigned === 0;
  const done = useMemo(() => [...checks.filter((c) => c.state === "passed").map((c) => c.id), ...signed.map((c) => c.id)], [checks, signed]);

  // The checklist: only sign-offs can be ticked by hand; automated checks are read-only rows – a failed one says so,
  // one still to run carries a clock
  const steps: ProgressStep[] = useMemo(
    () =>
      checks.map((c) => ({
        id: c.id,
        label: c.label,
        readonly: c.state !== "manual",
        state: c.state === "failed" ? ("failed" as const) : undefined,
        icon: c.state === "manual" || c.state === "pending" ? <StateIcon state={c.state} /> : undefined,
      })),
    [checks],
  );
  const onTick = (ids: string[]) => {
    const changed = checks.find((c) => ids.includes(c.id) !== done.includes(c.id));
    if (!changed || changed.state !== "manual") return;
    const on = ids.includes(changed.id);
    setConfirmed(on ? [...confirmed, changed.id] : confirmed.filter((id) => id !== changed.id));
    setSaid(on ? `Signed off: ${changed.label}` : `Sign-off withdrawn: ${changed.label}`);
  };

  const status = ready
    ? pending.length
      ? `Ready – ${pending.length} ${pending.length === 1 ? "check runs" : "checks run"} during approval`
      : "Ready to publish"
    : [blockers ? `${blockers} ${blockers === 1 ? "blocker" : "blockers"}` : "", unsigned ? `${unsigned} ${unsigned === 1 ? "sign-off" : "sign-offs"} to give` : ""].filter(Boolean).join(" · ");

  return (
    <div {...rest} ref={setRoot} data-look={look} className={["ui-prd", className].filter(Boolean).join(" ")}>
      <style href="ui-publish-readiness" precedence="default">
        {css}
      </style>

      <section className="ui-prd__card" aria-labelledby={`${uid}-title`}>
        <div className="ui-prd__head">
          <span className="ui-prd__head-icon" aria-hidden="true">
            <Glyph d={icons.send} />
          </span>
          <div className="ui-prd__head-text">
            <h3 id={`${uid}-title`} className="ui-prd__head-title">
              {subject}
              {version && <span className="ui-prd__version"> {version}</span>}
            </h3>
            {description && <p className="ui-prd__head-sub">{description}</p>}
          </div>
          <div className="ui-prd__head-aside">
            <span className="ui-prd__pill" data-tone={ready ? "success" : blockers ? "danger" : "warning"}>
              {ready ? "Ready" : blockers ? "Blocked" : "Needs sign-off"}
            </span>
          </div>
        </div>
        <div className="ui-prd__body">
          <div className="ui-prd__meter" role="meter" aria-label="Checks passed" aria-valuemin={0} aria-valuemax={checks.length} aria-valuenow={passed} aria-valuetext={`${passed} of ${checks.length} checks passed`}>
            {checks.map((c) => {
              const s = c.state === "manual" && confirmed.includes(c.id) ? "passed" : c.state;
              return <span key={c.id} className="ui-prd__tick" data-state={s} />;
            })}
          </div>
          <div className="ui-prd__summary">
            <p className="ui-prd__count">
              <b>{passed}</b> of {checks.length} checks passed
            </p>
            <p className="ui-prd__status" data-ready={ready || undefined}>
              {status}
            </p>
          </div>
          <Button look={look} variant={ready ? "primary" : "secondary"} onClick={() => setOpen(true)}>
            {ready ? "Publish…" : "Review checks"}
          </Button>
        </div>
      </section>

      <Dialog
        look={look}
        label={title}
        description="Releasing needs every check to pass – nothing goes live on its own."
        open={open}
        onOpenChange={setOpen}
        actions={
          <Button look={look} variant="primary" disabled={!ready || !onPublish} icon={<Glyph d={icons.send} />} onClick={() => onPublish?.()}>
            {publishLabel}
          </Button>
        }
      >
        <div className="ui-prd__portal" data-look={look}>
          <div className="ui-prd__dialog">
            <p className="ui-prd__eyebrow">
              {subject}
              {version ? ` · ${version}` : ""}
            </p>
            <ProgressTracker look={look} fit="fill" doneStyle="plain" title="Before release" steps={steps} done={done} onDoneChange={onTick} />
            <p className="ui-prd__said" role="status" aria-live="polite">
              {said}
            </p>

            {pending.length > 0 && (
              <ul className="ui-prd__later">
                {pending.map((c) => (
                  <li key={c.id}>
                    <Glyph d={icons.clock} />
                    <span>
                      <b>{c.label}</b> {c.detail ? `– ${c.detail}` : "– runs later"}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {failed.length > 0 && (
              <section className="ui-prd__blockers" aria-labelledby={`${uid}-blockers`}>
                <h4 id={`${uid}-blockers`} className="ui-prd__caption">
                  Blocking release
                </h4>
                <ul>
                  {failed.map((c) => (
                    <li key={c.id} className="ui-prd__blocker">
                      <span className="ui-prd__blocker-icon" aria-hidden="true">
                        <Glyph d={icons.alert} />
                      </span>
                      <div className="ui-prd__blocker-text">
                        <span className="ui-prd__blocker-check">
                          {c.label}
                          {c.detail && <span className="ui-prd__where"> · {c.detail}</span>}
                        </span>
                        {(c.blockers?.length ? c.blockers : [{ id: c.id, label: "Fails – see the check" }]).map((b) =>
                          onOpenBlocker && c.blockers?.length ? (
                            <button key={b.id} type="button" className="ui-prd__link" onClick={() => onOpenBlocker(b, c)}>
                              {b.label}
                              {b.where && <span className="ui-prd__where"> · {b.where}</span>}
                              <Glyph d={icons.arrow} />
                            </button>
                          ) : (
                            <span key={b.id} className="ui-prd__plain">
                              {b.label}
                              {b.where && <span className="ui-prd__where"> · {b.where}</span>}
                            </span>
                          ),
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {note && <div className="ui-prd__note">{note}</div>}
            {!ready && <p className="ui-prd__why">Publishing waits on: {status}</p>}
          </div>
        </div>
      </Dialog>
    </div>
  );
}

/* ---------- Pieces ---------- */

/** 24 px stroke icons (Lucide, ISC) */
const icons = {
  send: "M14.54 21.69a.5.5 0 0 0 .94-.03l6.5-19a.5.5 0 0 0-.64-.64l-19 6.5a.5.5 0 0 0-.03.94l7.93 3.18a2 2 0 0 1 1.11 1.11zM21.85 2.15 10.91 13.09",
  alert: "M12 8v4M12 16h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z",
  clock: "M12 6v6l4 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z",
  person: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
  arrow: "M7 17 17 7M7 7h10v10",
};

function Glyph({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/** The step's icon in the tracker: a person for a sign-off, a clock for a check that runs later – cloned by the element,
 *  so its colour rides along inline */
function StateIcon({ state }: { state: "manual" | "pending" }) {
  const d = state === "pending" ? icons.clock : icons.person;
  const color = "var(--tc-text-muted, light-dark(#646464, #9a9aa1))";
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color }} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

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
.ui-prd { container-type: inline-size; width: 100%; min-width: 0; }
.ui-prd, .ui-prd__portal {
  font-family: var(--tc-font-sans, "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  font-size: var(--tc-font-size-md, 13px);
  line-height: var(--tc-line-height-normal, 20px);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  -webkit-font-smoothing: antialiased;
}
.ui-prd *, .ui-prd *::before, .ui-prd *::after, .ui-prd__portal * { box-sizing: border-box; }

/* The summary card: Standard puts the header on the gray tray above the white card; Clean is one white card */
.ui-prd__card { max-width: 520px; padding: var(--tc-tray-inset, 4px); border-radius: var(--tc-tray-radius, calc(16px + 4px)); background: var(--tc-surface-tray, light-dark(#f0f0f0, #19191b)); }
.ui-prd__body { display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "meter meter" "summary action"; align-items: center; gap: var(--tc-space-3, 12px) var(--tc-space-4, 16px); padding: var(--tc-space-4, 16px); border-radius: var(--tc-card-radius, 16px); background: var(--tc-surface-on-tray, light-dark(#ffffff, #232326)); box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-prd__body > tc-button { grid-area: action; }
.ui-prd[data-look="clean"] .ui-prd__card { padding: 0; border-radius: var(--tc-card-radius, 16px); background: var(--tc-surface-raised, light-dark(#ffffff, #19191b)); box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-prd[data-look="clean"] .ui-prd__body { padding: 0 var(--tc-space-4, 16px) var(--tc-space-4, 16px); border-radius: 0; background: none; box-shadow: none; }
@container (max-width: 380px) { .ui-prd__body { grid-template-columns: minmax(0, 1fr); grid-template-areas: "meter" "summary" "action"; } }

.ui-prd__head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-head-gap, 10px); row-gap: var(--tc-space-2, 8px); padding: var(--tc-head-pad, 8px 10px 10px); }
.ui-prd__head-icon { flex: none; display: grid; place-items: center; width: var(--tc-head-icon-size, 28px); height: var(--tc-head-icon-size, 28px); border-radius: var(--tc-head-icon-radius, 8px); background: var(--tc-head-icon-bg, light-dark(#ffffff, #232326)); box-shadow: var(--tc-head-icon-shadow, 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); color: var(--tc-head-icon-fg, light-dark(#404040, #c8c8cc)); }
.ui-prd__head-icon svg { width: var(--tc-head-glyph, 16px); height: var(--tc-head-glyph, 16px); stroke-width: var(--tc-head-glyph-stroke, 1.75); }
.ui-prd__head-text { flex: 1 1 0; min-width: min(100%, 10rem); }
.ui-prd__head-title { margin: 0; color: var(--tc-title-color, light-dark(#171717, #ededed)); font-size: var(--tc-title-font-size, 14px); font-weight: var(--tc-title-font-weight, 600); line-height: var(--tc-title-line-height, 20px); letter-spacing: var(--tc-title-tracking, -0.006em); }
.ui-prd__version { font-family: var(--tc-font-mono, ui-monospace, "SF Mono", SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace); font-size: var(--tc-font-size-sm, 12px); font-weight: var(--tc-font-weight-regular, 400); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-prd__head-sub { margin: 0; color: var(--tc-subtitle-color, light-dark(#404040, #c8c8cc)); font-size: var(--tc-subtitle-font-size, 12px); line-height: var(--tc-subtitle-line-height, 16px); }
.ui-prd__head-aside { margin-left: auto; }
.ui-prd__pill { display: inline-flex; align-items: center; height: var(--tc-pill-h, 20px); padding: 0 var(--tc-pill-px, 8px); border-radius: var(--tc-pill-radius, 999px); font-size: var(--tc-pill-font-size, 11px); font-weight: var(--tc-pill-font-weight, 500); white-space: nowrap; }
.ui-prd__pill[data-tone="danger"] { background: var(--tc-status-danger-bg, light-dark(#fdecea, #3b1714)); color: var(--tc-status-danger-fg, light-dark(#c2331f, #ff977d)); }
.ui-prd__pill[data-tone="warning"] { background: var(--tc-status-warning-bg, light-dark(#fff3e0, #3a2410)); color: var(--tc-status-warning-fg, light-dark(#a35200, #ffa057)); }
.ui-prd__pill[data-tone="success"] { background: var(--tc-status-success-bg, light-dark(#e6f6ec, #12301f)); color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c)); }

/* One tick per check, coloured by its state */
.ui-prd__meter { grid-area: meter; display: flex; gap: var(--tc-space-1, 4px); }
.ui-prd__tick { flex: 1; height: var(--tc-meter-h, 4px); border-radius: var(--tc-meter-radius, 999px); background: var(--tc-meter-track, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); transition: background-color var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease); }
.ui-prd__tick[data-state="passed"] { background: var(--tc-status-success-solid, light-dark(#1f8a4c, #3ec27a)); }
.ui-prd__tick[data-state="failed"] { background: var(--tc-status-danger-solid, light-dark(#e5484d, #ff6369)); }
.ui-prd__tick[data-state="pending"] { background: repeating-linear-gradient(-45deg, var(--tc-meter-track, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))) 0 3px, var(--tc-border-strong, light-dark(#dedede, #3a3a40)) 3px 5px); }
.ui-prd__summary { grid-area: summary; min-width: 0; }
.ui-prd__count { margin: 0; color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-prd__count b { color: var(--tc-text-strong, light-dark(#171717, #f5f5f5)); font-weight: var(--tc-font-weight-semibold, 600); font-variant-numeric: tabular-nums; }
.ui-prd__status { margin: 0; color: var(--tc-status-danger-fg, light-dark(#c2331f, #ff977d)); font-size: var(--tc-font-size-sm, 12px); }
.ui-prd__status[data-ready] { color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c)); }

/* The dialog's body */
.ui-prd__dialog { display: grid; gap: var(--tc-space-3, 12px); width: 480px; max-width: 100%; }
.ui-prd__eyebrow { margin: 0; color: var(--tc-eyebrow-color, light-dark(#646464, #9a9aa1)); font-size: var(--tc-eyebrow-font-size, 11px); font-weight: var(--tc-eyebrow-font-weight, 500); line-height: var(--tc-eyebrow-line-height, 16px); letter-spacing: var(--tc-eyebrow-tracking, 0.04em); text-transform: var(--tc-eyebrow-transform, uppercase); }
.ui-prd__said { min-height: 0; margin: 0; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); font-size: var(--tc-font-size-sm, 12px); }
.ui-prd__said:empty { display: none; }
.ui-prd__caption { margin: 0 0 var(--tc-space-1-5, 6px); color: var(--tc-caption-color, light-dark(#646464, #9a9aa1)); font-size: var(--tc-caption-font-size, 12px); font-weight: var(--tc-caption-font-weight, 500); line-height: var(--tc-caption-line-height, 16px); letter-spacing: var(--tc-caption-tracking, 0); text-transform: var(--tc-caption-transform, none); }
.ui-prd__blockers ul { display: grid; gap: var(--tc-space-2, 8px); margin: 0; padding: 0; list-style: none; }
.ui-prd__blocker { display: flex; gap: var(--tc-space-2-5, 10px); padding: var(--tc-space-2-5, 10px) var(--tc-space-3, 12px); border-radius: var(--tc-radius-lg, 10px); background: var(--tc-status-danger-bg, light-dark(#fdecea, #3b1714)); box-shadow: inset 0 0 0 var(--tc-hairline, 1px) var(--tc-status-danger-border, color-mix(in srgb, light-dark(#e5484d, #ff6369) 40%, transparent)); }
.ui-prd__blocker-icon { flex: none; color: var(--tc-status-danger-fg, light-dark(#c2331f, #ff977d)); }
.ui-prd__blocker-icon svg { width: var(--tc-space-4, 16px); height: var(--tc-space-4, 16px); stroke-width: 2; margin-top: var(--tc-space-0-5, 2px); }
.ui-prd__blocker-text { display: grid; justify-items: start; gap: var(--tc-space-0-5, 2px); min-width: 0; }
.ui-prd__blocker-check { font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-strong, light-dark(#171717, #f5f5f5)); }
.ui-prd__link { justify-self: start; display: inline-flex; align-items: center; gap: var(--tc-space-1, 4px); margin: 0; padding: 0; border: 0; background: none; font: inherit; font-size: var(--tc-font-size-sm, 12px); color: var(--tc-status-danger-fg, light-dark(#c2331f, #ff977d)); text-align: left; text-decoration: underline; text-decoration-thickness: var(--tc-hairline, 1px); text-underline-offset: 2px; cursor: pointer; }
.ui-prd__link svg { flex: none; width: var(--tc-space-3, 12px); height: var(--tc-space-3, 12px); stroke-width: 2; }
.ui-prd__link:hover { text-decoration-thickness: 2px; }
.ui-prd__link:focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); border-radius: var(--tc-radius-2xs, 2px); }
.ui-prd__later { display: grid; gap: var(--tc-space-1, 4px); margin: calc(var(--tc-space-1, 4px) * -1) 0 0; padding: 0; list-style: none; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); font-size: var(--tc-font-size-sm, 12px); }
.ui-prd__later li { display: flex; align-items: flex-start; gap: var(--tc-space-1-5, 6px); }
.ui-prd__later svg { flex: none; width: var(--tc-space-3-5, 14px); height: var(--tc-space-3-5, 14px); margin-top: var(--tc-space-0-5, 2px); stroke-width: 2; }
.ui-prd__later b { color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); font-weight: var(--tc-font-weight-medium, 500); }
.ui-prd__plain { font-size: var(--tc-font-size-sm, 12px); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-prd__where { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-prd__note { padding: var(--tc-space-3, 12px); border-radius: var(--tc-radius-lg, 10px); background: var(--tc-surface-sunken, light-dark(#f0f0f0, #111113)); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); font-size: var(--tc-font-size-sm, 12px); line-height: var(--tc-line-height-normal, 20px); }
.ui-prd__note b, .ui-prd__note strong { color: var(--tc-text-strong, light-dark(#171717, #f5f5f5)); font-weight: var(--tc-font-weight-semibold, 600); }
.ui-prd__why { margin: 0; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); font-size: var(--tc-font-size-sm, 12px); }

@media (prefers-reduced-motion: reduce) { .ui-prd__tick { transition: none; } }
@media (forced-colors: active) {
  .ui-prd__tick { border: 1px solid CanvasText; }
  .ui-prd__tick[data-state="passed"], .ui-prd__tick[data-state="failed"] { background: CanvasText; }
  .ui-prd__blocker, .ui-prd__pill, .ui-prd__head-icon { border: 1px solid CanvasText; }
}
`;
