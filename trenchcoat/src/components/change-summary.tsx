"use client";

import type { ComponentPropsWithoutRef, ReactNode, Ref } from "react";

/*
 * Change Summary – what moved since last time, one metric per row, in a gray tray with a white card, in a single self-contained file.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: change-summary.tsx is Standard,
 * change-summary-clean.tsx is Clean). Clean has no tray – one white card with hairline shadows. The heading is the
 * first row of the card, each metric sits under a 0.5px line with a small tinted trend mark and quiet gray text,
 * and the icons are drawn with thinner lines.
 */
export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-cs";

export type MetricChange = {
  label: string;
  /** What happened, in words, e.g. "Up 6.1% to 18.2K" */
  change: string;
  /** good: green arrow · bad: red arrow · neutral: gray dash */
  tone?: "good" | "bad" | "neutral";
  /** Direction of the arrow – defaults to up for good, down for bad */
  direction?: "up" | "down";
};

type OwnProps = {
  /** Visual style. Defaults to the file's look: Standard in change-summary.tsx, Clean in change-summary-clean.tsx */
  look?: Look;
  title?: string;
  /** Small text on the right of the heading, e.g. "This week" */
  period?: string;
  icon?: ReactNode;
  changes: MetricChange[];
  className?: string;
  ref?: Ref<HTMLElement>;
};

export type ChangeSummaryProps = Omit<ComponentPropsWithoutRef<"section">, keyof OwnProps> & OwnProps;

export function ChangeSummary({ look, title = "What's changed", period, icon, changes, className, ref, ...rest }: ChangeSummaryProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const clean = resolvedLook === "clean";
  const headIcon = icon ?? <ChangesIcon look={resolvedLook} />;
  return (
    <>
      <style href="ui-change-summary" precedence="default">
        {css}
      </style>
      <section aria-label={title} {...rest} ref={ref} className={[ROOT_CLASS, className].filter(Boolean).join(" ")} data-look={resolvedLook}>
        <header className="ui-cs__head">
          <span className="ui-cs__title">
            {/* Clean centres the icon in a fixed 16px box */}
            {clean ? <span className="ui-cs__icon">{headIcon}</span> : headIcon}
            {clean ? (
              <span className="ui-cs__title-text" title={title}>
                {title}
              </span>
            ) : (
              title
            )}
          </span>
          {period && <span className="ui-cs__period">{period}</span>}
        </header>
        <dl className={clean ? "ui-cs__list" : "ui-cs__card"}>
          {changes.map((c, i) => {
            const tone = c.tone ?? "neutral";
            const direction = c.direction ?? (tone === "bad" ? "down" : "up");
            return (
              <div key={c.label} className="ui-cs__row" style={{ animationDelay: `${120 + i * 70}ms` }}>
                <dt className="ui-cs__label" title={c.label}>
                  {c.label}
                </dt>
                <dd className="ui-cs__change">
                  <span className="ui-cs__trend" data-tone={tone} aria-hidden="true">
                    {tone === "neutral" ? <DashIcon look={resolvedLook} /> : <ArrowIcon look={resolvedLook} down={direction === "down"} />}
                  </span>
                  {tone !== "neutral" && <span className="ui-cs__sr">{tone === "good" ? "Good change: " : "Bad change: "}</span>}
                  <span className="ui-cs__text" title={c.change}>
                    {c.change}
                  </span>
                </dd>
              </div>
            );
          })}
        </dl>
      </section>
    </>
  );
}

/* ---------- Icons (Clean: thinner lines) ---------- */

const ChangesIcon = ({ look }: { look: Look }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={look === "clean" ? 1.1 : 1.5} strokeLinecap="round" aria-hidden="true">
    <path d="M2.5 4h4M2.5 8h8M6.5 12h7M9.5 4h1" />
  </svg>
);

const ArrowIcon = ({ look, down }: { look: Look; down?: boolean }) => (
  <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth={look === "clean" ? 1.25 : 1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {down ? <path d="M6 2.5v7M3 6.5l3 3 3-3" /> : <path d="M6 9.5v-7M3 5.5l3-3 3 3" />}
  </svg>
);

const DashIcon = ({ look }: { look: Look }) => (
  <svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth={look === "clean" ? 1.25 : 1.6} strokeLinecap="round" aria-hidden="true">
    <path d="M3 6h6" />
  </svg>
);

/* ---------- Styles ---------- */

const css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *).ui-cs {
  box-sizing: border-box;
  width: 100%;
  max-width: 480px;
  container-type: inline-size;
  /* Like the Chat Composer: a gray tray with the heading, the white card sits on top of it */
  background: var(--tc-surface-tray);
  /* The gray tray frames the white card on every side */
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  font-family: var(--tc-font-sans);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-cs */
:where([data-look="clean"], [data-look="clean"] *).ui-cs {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  width: 100%;
  max-width: 480px;
  container-type: inline-size;
  overflow: hidden;
  border-radius: var(--tc-radius-lg);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
.ui-cs *, .ui-cs *::before, .ui-cs *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *).ui-cs__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 18px 10px;
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
}
:where([data-look="standard"], [data-look="standard"] *).ui-cs__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-accent-text);
}
:where([data-look="standard"], [data-look="standard"] *).ui-cs__period { font-size: var(--tc-font-size-md); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-cs__card {
  margin: 0;
  overflow: hidden;
  background: var(--tc-surface-on-tray);
  border-radius: var(--tc-card-radius);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="standard"], [data-look="standard"] *).ui-cs__row {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  align-items: center;
  gap: 16px;
  min-height: 52px;
  padding: 0 20px;
  animation: ui-cs-in var(--tc-duration-slowest) var(--tc-ease-move) both;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-cs__row + .ui-cs__row { border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="standard"], [data-look="standard"] *).ui-cs__row:hover { background: var(--tc-fill-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-cs__label {
  overflow: hidden;
  font-size: var(--tc-font-size-lg);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
  white-space: nowrap;
  text-overflow: ellipsis;
}
:where([data-look="standard"], [data-look="standard"] *).ui-cs__change {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  margin: 0;
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
}
:where(.ui-cs[data-look="clean"]) svg { display: block; flex: none; }
/* Heading row: icon + title, the period on the right */
:where([data-look="clean"], [data-look="clean"] *).ui-cs__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 44px;
  padding: 0 16px;
}
:where([data-look="clean"], [data-look="clean"] *).ui-cs__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-weight: var(--tc-font-weight-medium);
  white-space: nowrap;
  color: var(--tc-text-strong);
}
:where([data-look="clean"], [data-look="clean"] *).ui-cs__title-text { overflow: hidden; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-cs__icon { display: grid; place-items: center; flex: none; width: 16px; height: 16px; color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-cs__period { flex: none; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
/* One row per metric, each under a hairline */
:where([data-look="clean"], [data-look="clean"] *).ui-cs__list { margin: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-cs__row {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  align-items: center;
  gap: 16px;
  min-height: 48px;
  padding: 0 16px;
  border-top: var(--tc-hairline) solid var(--tc-divider);
  animation: ui-cs-in var(--tc-duration-slowest) var(--tc-ease-move) both;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-cs__row:hover { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-cs__label {
  overflow: hidden;
  font-weight: var(--tc-font-weight-medium);
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--tc-text-primary);
}
:where([data-look="clean"], [data-look="clean"] *).ui-cs__change {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  margin: 0;
  color: var(--tc-text-secondary);
}
.ui-cs__text { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
/* Narrow: each metric stacks above its change, so the text wraps instead of being cut off */
@container (max-width: 400px) {
:where([data-look="standard"], [data-look="standard"] *).ui-cs__row { grid-template-columns: minmax(0, 1fr); gap: 4px; padding: 11px 16px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cs__label,
:where([data-look="standard"], [data-look="standard"] *).ui-cs__text { white-space: normal; }
:where([data-look="standard"], [data-look="standard"] *).ui-cs__change { align-items: flex-start; }
}
:where([data-look="standard"], [data-look="standard"] *).ui-cs__trend {
  display: grid;
  place-items: center;
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: var(--tc-radius-sm);
}
/* Trend mark: a small tinted square, no strokes */
:where([data-look="clean"], [data-look="clean"] *).ui-cs__trend {
  display: grid;
  place-items: center;
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: var(--tc-radius-badge);
}
.ui-cs__trend[data-tone="good"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-cs__trend[data-tone="bad"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
/* Bad is more than a colour (WCAG 1.4.1): its mark is outlined, and the row says "Bad change" to screen readers */
.ui-cs__trend[data-tone="bad"] { box-shadow: inset 0 0 0 1px currentColor; }
.ui-cs__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-cs__trend[data-tone="neutral"] { background: var(--tc-fill-default); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-cs__trend[data-tone="neutral"] { background: var(--tc-fill-subtle); color: var(--tc-icon-muted); }
/* Narrow: each metric stacks above its change, so the text wraps instead of being cut off */
@container (max-width: 400px) {
:where([data-look="clean"], [data-look="clean"] *).ui-cs__head { padding: 0 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cs__row { grid-template-columns: minmax(0, 1fr); gap: 4px; padding: 10px 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cs__label,
:where([data-look="clean"], [data-look="clean"] *).ui-cs__text { white-space: normal; }
:where([data-look="clean"], [data-look="clean"] *).ui-cs__change { align-items: flex-start; }
}
/* Touch screens: a little more room per row */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-cs__row { min-height: 52px; }
}
@keyframes ui-cs-in {
  from { opacity: 0; transform: translateY(4px); }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *).ui-cs__row { animation: none; }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="clean"], [data-look="clean"] *).ui-cs__row { animation: none; transition: none; }
}
`;
