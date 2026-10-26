"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type ReactNode, type Ref } from "react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";

/*
 * Invoice & Credit Note – two billing documents in one block, in a single self-contained file.
 * The invoice and its credit note sit on top of each other like sheets of paper; switch between them,
 * or press “Credit invoice” to bring the credit note forward. Pick which lines to credit, adjust the
 * amounts, and the subtotal, tax and adjustment update as you type; then issue it.
 * The styles are injected below; the switch and the buttons are the library's SegmentedControl and Button (copy
 * `segmented-control.tsx` and `button.tsx` alongside). When a sheet goes behind the other, focus moves to the sheet
 * that came forward.
 */

export type DocParty = { name: string; lines: string[] };
export type InvoiceLine = { id: string; name: string; qty: number; rate: number; tax: number; group?: string };

export type InvoiceView = "invoice" | "credit";

type OwnProps = {
  seller?: DocParty;
  buyer?: DocParty;
  invoiceNo?: string;
  creditNo?: string;
  invoiceDate?: string;
  dueDate?: string;
  period?: string;
  lines?: InvoiceLine[];
  currency?: string;
  /** The sheet in front (controlled) – pass `onViewChange` with it. Leave undefined to start at `defaultView` */
  view?: InvoiceView;
  defaultView?: InvoiceView;
  onViewChange?: (view: InvoiceView) => void;
  /**
   * Called when the credit note is issued, with the credited amount per line (before tax). Return a promise to show
   * Issuing… until it settles; a rejection keeps the note editable and shows the error so it can be issued again
   */
  onIssue?: (credits: Record<string, number>, total: number) => void | Promise<unknown>;
  className?: string;
  /** The root <section> */
  ref?: Ref<HTMLElement>;
};

export type InvoiceCreditProps = Omit<ComponentPropsWithoutRef<"section">, keyof OwnProps> & OwnProps;

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

const defaultLines: InvoiceLine[] = [
  { id: "plan", name: "Growth plan", qty: 1, rate: 1250, tax: 0.2 },
  { id: "seats", name: "Extra seats", qty: 12, rate: 40, tax: 0.2 },
  { id: "api", name: "API calls (per 1k)", qty: 18420, rate: 0.42, tax: 0.2, group: "Metered usage" },
];

export function InvoiceCredit({
  seller = { name: "Lumen Labs, Inc.", lines: ["48 Harbour Street", "Bristol", "BS1 4RN", "United Kingdom"] },
  buyer = { name: "Northwind Logistics GmbH", lines: ["Speicherstraße 12", "Hamburg", "20457", "Germany"] },
  invoiceNo = "INV-2041",
  creditNo = "CN-0117",
  invoiceDate = "1 Oct 2026",
  dueDate = "31 Oct 2026",
  period = "1 Sep – 30 Sep 2026",
  lines = defaultLines,
  currency = "$",
  view: viewProp,
  defaultView = "invoice",
  onViewChange,
  onIssue,
  className,
  ref,
  ...rest
}: InvoiceCreditProps) {
  const [view, setView] = useControllable(viewProp, defaultView, onViewChange, "view");
  // Only what was changed is kept, per line id: every line – including lines passed later – starts picked, in full
  const [pickedEdits, setPicked] = useState<Record<string, boolean>>({});
  const [creditEdits, setCredit] = useState<Record<string, number>>({});
  const picked = Object.fromEntries(lines.map((l) => [l.id, pickedEdits[l.id] ?? true]));
  const credit = Object.fromEntries(lines.map((l) => [l.id, Math.min(creditEdits[l.id] ?? Infinity, round(l.qty * l.rate))]));
  const [issued, setIssued] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const panelId = useId();
  const sheets = useRef<Record<InvoiceView, HTMLDivElement | null>>({ invoice: null, credit: null });
  // A control on the sheet that goes behind (Credit invoice, the related invoice link) hands focus to the other sheet
  const focusSheet = useRef<InvoiceView | null>(null);
  const show = (next: InvoiceView, moveFocus: boolean) => {
    if (moveFocus) focusSheet.current = next;
    setView(next);
  };
  useLayoutEffect(() => {
    const target = focusSheet.current;
    if (!target || target !== view) return;
    focusSheet.current = null;
    sheets.current[target]?.focus({ preventScroll: true });
  });
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const money = (n: number, sign = false) =>
    `${sign && n > 0 ? "-" : ""}${currency}${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Invoice totals
  const subtotal = lines.reduce((s, l) => s + round(l.qty * l.rate), 0);
  const tax = lines.reduce((s, l) => s + round(l.qty * l.rate) * l.tax, 0);
  const total = subtotal + tax;

  // Credit totals – only picked lines count
  const cSub = lines.reduce((s, l) => s + (picked[l.id] ? credit[l.id] : 0), 0);
  const cTax = lines.reduce((s, l) => s + (picked[l.id] ? credit[l.id] * l.tax : 0), 0);
  const cTotal = cSub + cTax;

  const issue = () => {
    if (issuing) return;
    setError(null);
    let result: unknown;
    try {
      result = onIssue?.(Object.fromEntries(lines.filter((l) => picked[l.id]).map((l) => [l.id, credit[l.id]])), round(cTotal));
    } catch (e) {
      result = Promise.reject(e);
    }
    if (!(result instanceof Promise)) return setIssued(true);
    setIssuing(true);
    result.then(
      () => {
        if (!mounted.current) return;
        setIssuing(false);
        setIssued(true);
      },
      (e: unknown) => {
        if (!mounted.current) return;
        setIssuing(false);
        setError(e instanceof Error && e.message ? e.message : "Couldn't issue the credit note.");
      },
    );
  };

  const groups = [...new Set(lines.map((l) => l.group ?? ""))];

  return (
    <section {...rest} ref={ref} className={["ui-iv", className].filter(Boolean).join(" ")} data-view={view}>
      <style href="ui-invoice-credit" precedence="default">
        {css}
      </style>

      {/* Toolbar on the tray */}
      <div className="ui-iv__bar">
        <SegmentedControl
          kind="tabs"
          aria-label="Document"
          value={view}
          onChange={(v) => show(v, false)}
          options={[
            { value: "invoice", label: "Invoice", controls: `${panelId}-invoice` },
            { value: "credit", label: "Credit note", controls: `${panelId}-credit` },
          ]}
        />
        <div className="ui-iv__actions">
          <Button variant="secondary" icon={<Icon d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14" />}>
            PDF
          </Button>
          {view === "invoice" && (
            <Button variant="secondary" className="ui-iv__credit" icon={<Icon d="M9 14 4.5 9.5 9 5M4.5 9.5h10a5 5 0 0 1 0 10H12" />} onClick={() => show("credit", true)}>
              Credit invoice
            </Button>
          )}
        </div>
      </div>

      {/* Two sheets: the one in front is the chosen document, the other peeks out behind it */}
      <div className="ui-iv__stack">
        <div
          ref={(el) => {
            sheets.current.invoice = el;
          }}
          id={`${panelId}-invoice`}
          role="tabpanel"
          aria-label="Invoice"
          tabIndex={-1}
          className="ui-iv__sheet"
          data-doc="invoice"
          data-behind={view !== "invoice" || undefined}
          aria-hidden={view !== "invoice" || undefined}
          inert={view !== "invoice" || undefined}
        >
          <header className="ui-iv__head">
            <div>
              <p className="ui-iv__big">{money(total)}</p>
              <p className="ui-iv__due">
                Due {dueDate}
                <a href="#pay" onClick={(e) => e.preventDefault()}>
                  Pay online
                </a>
              </p>
            </div>
            <Brand name={seller.name} />
          </header>

          <div className="ui-iv__parties">
            <Party title="From" party={seller} />
            <Party title="To" party={buyer} />
          </div>

          <Terms
            rows={[
              ["Invoice no", <span className="ui-iv__ref">{invoiceNo}</span>],
              ["Invoice date", invoiceDate],
              ["Due date", dueDate],
              ["Billing period", period],
            ]}
          />

          <table className="ui-iv__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Qty</th>
                <th className="ui-iv__num">Rate</th>
                <th className="ui-iv__num">Tax</th>
                <th className="ui-iv__num">Price</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <GroupRows key={g || "base"} title={g}>
                  {lines
                    .filter((l) => (l.group ?? "") === g)
                    .map((l) => (
                      <tr key={l.id} data-indent={g ? "" : undefined}>
                        <td>{l.name}</td>
                        <td>{l.qty.toLocaleString("en-US")}</td>
                        <td className="ui-iv__num">{money(l.rate)}</td>
                        <td className="ui-iv__num">{Math.round(l.tax * 100)}%</td>
                        <td className="ui-iv__num">{money(round(l.qty * l.rate))}</td>
                      </tr>
                    ))}
                </GroupRows>
              ))}
            </tbody>
          </table>

          <Totals
            rows={[
              ["Subtotal", money(subtotal)],
              ["Tax", money(tax)],
            ]}
            total={["Total", money(total)]}
          />
        </div>

        <div
          ref={(el) => {
            sheets.current.credit = el;
          }}
          id={`${panelId}-credit`}
          role="tabpanel"
          aria-label="Credit note"
          tabIndex={-1}
          className="ui-iv__sheet"
          data-doc="credit"
          data-behind={view !== "credit" || undefined}
          aria-hidden={view !== "credit" || undefined}
          inert={view !== "credit" || undefined}
        >
          <header className="ui-iv__head">
            <div>
              <p className="ui-iv__big">Credit note</p>
              <p className="ui-iv__due">
                {money(cTotal)} credited on {invoiceDate}
                <span className="ui-iv__live" role="status">
                  {issued && <span className="ui-iv__badge">Issued</span>}
                </span>
              </p>
            </div>
            <Brand name={seller.name} />
          </header>

          <Terms
            rows={[
              ["Credit note no", <span className="ui-iv__ref">{creditNo}</span>],
              [
                "Related invoice",
                <button type="button" className="ui-iv__ref" onClick={() => show("invoice", true)}>
                  {invoiceNo}
                </button>,
              ],
              ["Billing period", period],
              ["Date of issue", invoiceDate],
            ]}
          />

          {/* Pick lines and amounts in a gray tray with a white card, like the rest of the library */}
          <div className="ui-iv__tray">
            <p className="ui-iv__tray-title">Lines to credit</p>
            <div className="ui-iv__card">
              <div className="ui-iv__crow ui-iv__crow--head">
                <span />
                <span>Name</span>
                <span className="ui-iv__num">Total</span>
                <span className="ui-iv__num">Credit amount</span>
              </div>
              {lines.map((l) => {
                const max = round(l.qty * l.rate);
                const on = picked[l.id];
                return (
                  <div key={l.id} className="ui-iv__crow" data-off={on ? undefined : ""}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      aria-label={`Credit ${l.name}`}
                      className="ui-iv__check"
                      disabled={issued || issuing}
                      onClick={() => setPicked((p) => ({ ...p, [l.id]: !on }))}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m6 12.5 4 4 8-9" />
                      </svg>
                    </button>
                    <span className="ui-iv__cname">{l.name}</span>
                    <span className="ui-iv__num">{money(max)}</span>
                    <span className="ui-iv__num">
                      <Amount
                        value={credit[l.id]}
                        max={max}
                        currency={currency}
                        disabled={!on || issued || issuing}
                        label={`Credit amount for ${l.name}`}
                        onChange={(v) => setCredit((c) => ({ ...c, [l.id]: v }))}
                      />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <Totals
            rows={[
              ["Subtotal", money(cSub)],
              ["Tax", money(cTax)],
            ]}
            total={["Adjustment total", money(cTotal, true)]}
            note={["Applied to invoice", `${money(cTotal, true)} USD`]}
          />

          <div className="ui-iv__issue">
            {error && (
              <p className="ui-iv__error" role="alert">
                {error}
              </p>
            )}
            {/* One button for both states, so focus stays on it when the note is issued or reopened */}
            <Button
              size="lg"
              variant={issued ? "secondary" : "primary"}
              disabled={!issued && cTotal <= 0}
              loading={issuing}
              onClick={issued ? () => setIssued(false) : issue}
            >
              {issued ? "Edit credit note" : issuing ? "Issuing…" : error ? "Try again" : "Issue credit note"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Pieces ---------- */

const round = (n: number) => Math.round(n * 100) / 100;

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} />
  </svg>
);

/** A neutral brand mark in the accent blue, with the company name */
const Brand = ({ name }: { name: string }) => (
  <span className="ui-iv__brand">
    <span className="ui-iv__logo" aria-hidden="true" />
    {name}
  </span>
);

const Party = ({ title, party }: { title: string; party: DocParty }) => (
  <div className="ui-iv__party">
    <p className="ui-iv__label">{title}</p>
    <p>{party.name}</p>
    {party.lines.map((l) => (
      <p key={l}>{l}</p>
    ))}
  </div>
);

const Terms = ({ rows }: { rows: [string, ReactNode][] }) => (
  <div className="ui-iv__terms">
    <p className="ui-iv__label">Terms</p>
    <dl>
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  </div>
);

const GroupRows = ({ title, children }: { title: string; children: ReactNode }) => (
  <>
    {title && (
      <tr className="ui-iv__group">
        <td colSpan={5}>{title}</td>
      </tr>
    )}
    {children}
  </>
);

const Totals = ({ rows, total, note }: { rows: [string, string][]; total: [string, string]; note?: [string, string] }) => (
  <div className="ui-iv__totals">
    {rows.map(([k, v]) => (
      <div key={k}>
        <span>{k}</span>
        <span>{v}</span>
      </div>
    ))}
    <div className="ui-iv__total">
      <span>{total[0]}</span>
      <b>{total[1]}</b>
    </div>
    {note && (
      <div className="ui-iv__note">
        <span>{note[0]}</span>
        <span>{note[1]}</span>
      </div>
    )}
  </div>
);

function Amount({
  value,
  max,
  currency,
  disabled,
  label,
  onChange,
}: {
  value: number;
  max: number;
  currency: string;
  disabled: boolean;
  label: string;
  onChange: (v: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <label className="ui-iv__amount" data-disabled={disabled ? "" : undefined}>
      <span>{currency}</span>
      <input
        inputMode="decimal"
        aria-label={label}
        disabled={disabled}
        value={draft ?? value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        onFocus={() => setDraft(String(value))}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d.]/g, ""))}
        onBlur={() => {
          onChange(Math.max(0, Math.min(max, round(parseFloat(draft ?? "") || 0))));
          setDraft(null);
        }}
        onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent.isComposing && (e.target as HTMLInputElement).blur()}
      />
    </label>
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: every colour is a token or a light-dark() fallback, so dark follows color-scheme – a .dark class,
   data-theme / data-tc-theme="dark" or the OS setting (data-tc-theme="system") */
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }

/* The block is a tray: the sheets are the cards on it */
.ui-iv {
  container-type: inline-size;
  width: 100%;
  max-width: 760px;
  padding: var(--tc-tray-inset, 4px);
  border-radius: var(--tc-tray-radius, calc(16px + 4px));
  background: var(--tc-surface-tray, light-dark(#f0f0f0, #19191b));
  font-family: var(--tc-font-sans, "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  -webkit-font-smoothing: antialiased;
}
.ui-iv *, .ui-iv *::before, .ui-iv *::after { box-sizing: border-box; }
.ui-iv :where(button[class^="ui-iv__"], input) { font: inherit; color: inherit; margin: 0; }
.ui-iv button[class^="ui-iv__"] { cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-iv :focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); }
/* A sheet takes focus when it comes forward – its content is the target, no ring around the whole page */
.ui-iv__sheet:focus { outline: none; }
.ui-iv svg { width: 15px; height: 15px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.ui-iv p { margin: 0; }

/* ---------- Toolbar ---------- */

.ui-iv__bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 6px 12px 8px; }
.ui-iv__actions { display: flex; gap: 6px; }
.ui-iv__credit { animation: ui-iv-fade var(--tc-duration-moderate, 260ms) var(--tc-ease-standard, ease) both; }

/* ---------- Stacked sheets ---------- */

.ui-iv__stack { position: relative; isolation: isolate; display: grid; padding-top: 14px; }
.ui-iv__sheet {
  grid-area: 1 / 1;
  min-width: 0;
  padding: 44px 48px 36px;
  border-radius: var(--tc-card-radius, 16px);
  background: var(--tc-surface-on-tray, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  transition: transform var(--tc-duration-slowest, 560ms) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)), opacity var(--tc-duration-slower, 420ms) var(--tc-ease-standard, ease);
}
/* The sheet behind: a little higher and narrower, only its top edge shows */
.ui-iv__sheet[data-behind] {
  z-index: 0;
  transform: translateY(-14px) scale(0.96);
  transform-origin: top center;
  pointer-events: none;
}
.ui-iv__sheet[data-behind] > * { opacity: 0; transition: opacity var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease); }
.ui-iv__sheet:not([data-behind]) { z-index: 1; }
.ui-iv__sheet:not([data-behind]) > * { opacity: 1; transition: opacity var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease) var(--tc-duration-base, 200ms); }

.ui-iv__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 40px; }
/* The amount is a display figure, larger than the type scale on purpose */
.ui-iv__big { font-size: 2.5rem; font-weight: var(--tc-font-weight-medium, 500); letter-spacing: -0.035em; line-height: var(--tc-line-height-none, 1); font-variant-numeric: tabular-nums; }
.ui-iv .ui-iv__due { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 28px; margin-top: 12px; font-size: var(--tc-font-size-lg, 14px); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-iv__due a { color: var(--tc-accent-text, light-dark(#2456d6, #8ab4ff)); text-decoration: none; }
.ui-iv__due a:hover { text-decoration: underline; }
/* Empty until the note is issued – out of the flow, but in the accessibility tree from the start */
.ui-iv__live:empty { position: absolute; }
.ui-iv__live { margin-left: -16px; }
.ui-iv__badge {
  display: inline-flex;
  align-items: center;
  height: var(--tc-pill-h, 20px);
  padding: 0 var(--tc-pill-px, 8px);
  border-radius: var(--tc-pill-radius, 999px);
  background: var(--tc-status-success-bg, light-dark(#e6f6ec, #12301f));
  font-size: var(--tc-pill-font-size, 11px);
  font-weight: var(--tc-pill-font-weight, 500);
  color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c));
}
.ui-iv__brand { display: inline-flex; align-items: center; gap: 9px; padding-top: 8px; font-size: var(--tc-font-size-lg-plus, 15px); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); white-space: nowrap; }
.ui-iv__logo {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: conic-gradient(from 210deg, var(--tc-accent, #2f68ff), color-mix(in srgb, var(--tc-accent, #2f68ff) 50%, #ffffff), var(--tc-accent, #2f68ff));
  -webkit-mask: radial-gradient(circle, transparent 4px, #000 4.5px);
  mask: radial-gradient(circle, transparent 4px, #000 4.5px);
}

.ui-iv .ui-iv__label { margin-bottom: 8px; font-size: var(--tc-font-size-lg, 14px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-iv__parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 36px; }
.ui-iv__party p:not(.ui-iv__label) { font-size: var(--tc-font-size-lg, 14px); line-height: var(--tc-line-height-relaxed, 22px); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-iv__terms { margin-bottom: 36px; }
.ui-iv__terms dl { display: grid; gap: 7px; margin: 0; }
.ui-iv__terms dl > div { display: grid; grid-template-columns: 140px 1fr; font-size: var(--tc-font-size-lg, 14px); }
.ui-iv__terms dt { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-iv__terms dd { margin: 0; color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-iv .ui-iv__ref { padding: 0; border: 0; background: none; color: var(--tc-accent-text, light-dark(#2456d6, #8ab4ff)); font-variant-numeric: tabular-nums; }
button.ui-iv__ref:hover { text-decoration: underline; }

/* Invoice table */
.ui-iv__table { width: 100%; border-collapse: collapse; font-size: var(--tc-font-size-lg, 14px); }
.ui-iv__table th { padding: 0 0 12px; border-bottom: var(--tc-hairline, 1px) solid var(--tc-divider, light-dark(#ececec, #2a2a2e)); text-align: left; font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-iv__table td { padding: 14px 0; border-bottom: var(--tc-hairline, 1px) solid var(--tc-divider, light-dark(#ececec, #2a2a2e)); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); font-variant-numeric: tabular-nums; }
.ui-iv__table tr[data-indent] td:first-child { padding-left: 24px; }
.ui-iv__group td { color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-iv .ui-iv__num { text-align: right; }

/* Totals */
.ui-iv__totals { display: grid; gap: 12px; width: min(100%, 300px); margin: 22px 0 0 auto; font-size: var(--tc-font-size-lg, 14px); }
.ui-iv__totals > div { display: flex; justify-content: space-between; gap: 16px; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); font-variant-numeric: tabular-nums; }
.ui-iv__totals > div span:last-child { color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-iv__total { margin-top: 4px; padding-top: 14px; border-top: var(--tc-hairline, 1px) solid var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-iv__totals > .ui-iv__total span { font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-iv__total b { font-size: var(--tc-font-size-xl, 16px); font-weight: var(--tc-font-weight-semibold, 600); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-iv__note { margin-top: -4px; }

/* Credit lines: a tray with a card on it, like the rest of the library */
.ui-iv__tray { padding: 0 var(--tc-tray-inset, 4px) var(--tc-tray-inset, 4px); border-radius: var(--tc-tray-radius, calc(16px + 4px)); background: var(--tc-surface-tray, light-dark(#f0f0f0, #19191b)); }
.ui-iv__tray-title { padding: 14px 12px 12px; font-size: var(--tc-font-size-lg-plus, 15px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-iv__card { padding: 4px 14px; border-radius: var(--tc-card-radius, 16px); background: var(--tc-surface-on-tray, light-dark(#ffffff, #232326)); box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-iv__crow {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr) auto minmax(150px, 0.8fr);
  align-items: center;
  gap: 14px;
  min-height: 60px;
  border-bottom: var(--tc-hairline, 1px) solid var(--tc-divider, light-dark(#ececec, #2a2a2e));
  font-size: var(--tc-font-size-lg, 14px);
  transition: color var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease);
}
.ui-iv__crow:last-child { border-bottom: 0; }
.ui-iv__crow--head { min-height: 46px; font-size: var(--tc-font-size-md-plus, 13.5px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-iv__crow > .ui-iv__num { font-variant-numeric: tabular-nums; color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
/* A line that isn't credited: muted text (still readable), the empty checkbox is the cue */
.ui-iv__crow[data-off] .ui-iv__cname, .ui-iv__crow[data-off] > .ui-iv__num:nth-child(3) { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
/* Checkbox: the control border (3:1) when empty, the accent fill with a check when picked */
.ui-iv .ui-iv__check {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  border-radius: var(--tc-radius-sm, 6px);
  background: var(--tc-surface-control, light-dark(#ffffff, #232326));
  box-shadow: inset 0 0 0 var(--tc-hairline, 1px) var(--tc-border-control, light-dark(#858585, #7c7c82));
  color: var(--tc-text-on-accent, #ffffff);
  transition: background-color var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease), box-shadow var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease);
}
.ui-iv__check svg { width: 13px; height: 13px; stroke-width: 2.4; stroke-dasharray: 20; stroke-dashoffset: 20; transition: stroke-dashoffset var(--tc-duration-moderate, 260ms) var(--tc-ease-standard, ease); }
.ui-iv .ui-iv__check[aria-checked="true"] { background: var(--tc-accent, #2f68ff); box-shadow: inset 0 0 0 var(--tc-hairline, 1px) var(--tc-accent, #2f68ff); }
.ui-iv__check[aria-checked="true"] svg { stroke-dashoffset: 0; }
.ui-iv__check:disabled { cursor: default; opacity: 0.55; }
/* Amount: the field pattern */
.ui-iv__amount {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 220px;
  margin-left: auto;
  height: var(--tc-field-h, 36px);
  padding: 0 var(--tc-field-px, 12px);
  border-radius: var(--tc-field-radius, 10px);
  background: var(--tc-field-bg, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-field-shadow, inset 0 0 0 1px light-dark(#858585, #7c7c82), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  transition: box-shadow var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease), opacity var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease);
}
.ui-iv__amount:hover:not([data-disabled]) { box-shadow: var(--tc-field-shadow-hover, inset 0 0 0 1px light-dark(#646464, #9a9aa1), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-iv__amount:focus-within { box-shadow: var(--tc-field-shadow-focus, inset 0 0 0 1px light-dark(#2f68ff, #6b95ff), 0 0 0 3px color-mix(in srgb, light-dark(#2f68ff, #6b95ff) 24%, transparent)); }
.ui-iv__amount span { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-iv__amount input { flex: 1; min-width: 0; border: 0; background: none; outline: none; text-align: right; font-size: var(--tc-field-font-size, 13px); font-variant-numeric: tabular-nums; color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-iv__amount[data-disabled] { opacity: 0.5; }

.ui-iv__issue { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 12px; margin-top: 24px; }
.ui-iv__error { margin: 0; font-size: var(--tc-font-size-md, 13px); color: var(--tc-status-danger-fg, light-dark(#c2331f, #ff977d)); }

@keyframes ui-iv-fade { from { opacity: 0; } }

/* ---------- Narrow ---------- */

@container (max-width: 560px) {
  .ui-iv__sheet { padding: 28px 20px 24px; }
  .ui-iv__big { font-size: 1.875rem; }
  .ui-iv__head { flex-direction: column-reverse; margin-bottom: 28px; }
  .ui-iv__parties { grid-template-columns: 1fr; }
  .ui-iv__terms dl > div { grid-template-columns: 120px 1fr; }
  .ui-iv__table th:nth-child(4), .ui-iv__table td:nth-child(4), .ui-iv__table th:nth-child(3), .ui-iv__table td:nth-child(3) { display: none; }
  .ui-iv__table th + th, .ui-iv__table td + td { padding-left: 12px; }
  .ui-iv__crow { grid-template-columns: 22px minmax(0, 1fr) minmax(110px, 0.9fr); }
  .ui-iv__crow > :nth-child(3) { display: none; }
}
/* Phone width: tighter insets, so credit amounts keep enough room to show in full */
@container (max-width: 400px) {
  .ui-iv__sheet { padding: 24px 16px 20px; }
  .ui-iv__card { padding: 4px 10px; }
  .ui-iv__crow { gap: 10px; }
  .ui-iv__amount { gap: 4px; padding: 0 10px; }
  .ui-iv__terms dl > div { grid-template-columns: 112px 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .ui-iv .ui-iv__stack .ui-iv__sheet, .ui-iv .ui-iv__stack .ui-iv__sheet > *, .ui-iv__check svg { transition: none; }
  .ui-iv__credit { animation: none; }
}

/* The amount field shows its focus with the field ring (above), not a second outline – also against global
   :focus-visible rules of the host page */
.ui-iv .ui-iv__amount input:focus-visible { outline: none; }
`;
