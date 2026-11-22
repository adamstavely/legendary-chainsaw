import { useId, useMemo, useState, type CSSProperties } from "react";
import type * as UI from "../../../src/elements/react";
import type { SavedView } from "../../../src/elements/saved-views";
import { caption, surface, textButton } from "../demo-kit";

/* Saved views above the case list of a fictional case-review app, "Ledgerline". Each view is a saved filter; the page
   owns the views and answers every request – save, save as new, reset, rename, duplicate, share, set as default and
   delete. Changing the filter chips marks the open view as edited. */

type Filter = { mine: boolean; risk: "any" | "high"; status: "open" | "waiting" | "any" };
type ViewDef = SavedView & { filter: Filter };
type Case = { id: string; title: string; owner: string; risk: "high" | "medium" | "low"; status: "open" | "waiting" | "closed" };

const ME = "Noor Haddad";
const CASES: Case[] = [
  { id: "CS-1041", title: "Card testing on new merchant", owner: ME, risk: "high", status: "open" },
  { id: "CS-1042", title: "Payee added from a new device", owner: "Tomas Lind", risk: "medium", status: "open" },
  { id: "CS-1043", title: "Refund loop on one account", owner: ME, risk: "high", status: "waiting" },
  { id: "CS-1044", title: "Address change before a large order", owner: "Priya Raman", risk: "low", status: "open" },
  { id: "CS-1045", title: "Velocity spike at checkout", owner: ME, risk: "medium", status: "open" },
  { id: "CS-1046", title: "Chargeback on a gift card", owner: "Ade Okafor", risk: "high", status: "waiting" },
  { id: "CS-1047", title: "Login from two countries", owner: "Mei Chen", risk: "medium", status: "closed" },
];
const matches = (c: Case, f: Filter) => (!f.mine || c.owner === ME) && (f.risk === "any" || c.risk === f.risk) && (f.status === "any" || c.status === f.status);
const same = (a: Filter, b: Filter) => a.mine === b.mine && a.risk === b.risk && a.status === b.status;

const START: ViewDef[] = [
  { id: "mine", name: "My open cases", isDefault: true, filter: { mine: true, risk: "any", status: "open" } },
  { id: "high", name: "High risk this week", shared: true, filter: { mine: false, risk: "high", status: "any" } },
  { id: "waiting", name: "Waiting on customer", shared: true, owner: "Tomas Lind", filter: { mine: false, risk: "any", status: "waiting" } },
  { id: "all", name: "All cases", filter: { mine: false, risk: "any", status: "any" } },
];

const page: CSSProperties = { ...surface, display: "grid", gap: 12, padding: 16, borderRadius: 14, width: "100%", boxSizing: "border-box" };
const chip = (on: boolean): CSSProperties => ({
  height: 26,
  padding: "0 10px",
  borderRadius: 999,
  border: "1px solid var(--tc-border-default, light-dark(#e3e3e3, #2e2e33))",
  background: on ? "var(--tc-fill-selected, light-dark(#ececef, #2a2a30))" : "transparent",
  color: "inherit",
  font: "inherit",
  fontSize: 12,
  cursor: "pointer",
});
const row: CSSProperties = { display: "grid", gridTemplateColumns: "72px 1fr auto", gap: 10, padding: "7px 4px", borderTop: "1px solid var(--tc-border-default, light-dark(#ececec, #2a2a2e))", fontSize: 13 };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SavedViews } = ui;
  const [views, setViews] = useState<ViewDef[]>(START);
  const [active, setActive] = useState<string | null>("mine");
  const open: ViewDef | undefined = views.find((v) => v.id === active);
  const [filter, setFilter] = useState<Filter>(START[0].filter);
  const tableId = useId();
  const dirty = !!open && !same(filter, open.filter);
  const shown = useMemo(() => CASES.filter((c) => matches(c, filter)), [filter]);
  const counted = views.map((v) => ({ ...v, count: CASES.filter((c) => matches(c, v.filter)).length }));
  let seq = views.length;

  const change = (id: string, f: (v: ViewDef) => ViewDef) => setViews((all) => all.map((v) => (v.id === id ? f(v) : v)));
  const openView = (id: string | null) => {
    setActive(id);
    const v = views.find((x) => x.id === id);
    if (v) setFilter(v.filter);
  };

  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 10 }}>
      <div style={page}>
        <SavedViews
          views={counted}
          active={active}
          dirty={dirty}
          controls={tableId}
          onActiveChange={openView}
          onViewSave={(id) => change(id, (v) => ({ ...v, filter }))}
          onViewReset={() => open && setFilter(open.filter)}
          onViewCreate={({ name, basis }) => {
            const id = `v${++seq}-${Date.now() % 1000}`;
            const f = basis === "current" ? filter : { mine: false, risk: "any" as const, status: "any" as const };
            setViews((all) => [...all, { id, name, filter: f }]);
            openView(id);
            setFilter(f);
          }}
          onViewRename={({ id, name }) => change(id, (v) => ({ ...v, name }))}
          onViewDuplicate={(id) => {
            const v = views.find((x) => x.id === id)!;
            setViews((all) => [...all, { ...v, id: `${id}-copy-${++seq}`, name: `${v.name} (copy)`, isDefault: false, shared: false, owner: undefined }]);
          }}
          onViewShare={({ id, shared }) => change(id, (v) => ({ ...v, shared }))}
          onViewDefault={(id) => setViews((all) => all.map((v) => ({ ...v, isDefault: v.id === id })))}
          onViewDelete={(id) => {
            const rest = views.filter((v) => v.id !== id);
            setViews(rest);
            if (id === active) openView(rest[0]?.id ?? null);
          }}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }} role="group" aria-label="Filters">
          <button type="button" style={chip(filter.mine)} aria-pressed={filter.mine} onClick={() => setFilter({ ...filter, mine: !filter.mine })}>
            Mine
          </button>
          <button type="button" style={chip(filter.risk === "high")} aria-pressed={filter.risk === "high"} onClick={() => setFilter({ ...filter, risk: filter.risk === "high" ? "any" : "high" })}>
            High risk
          </button>
          <button type="button" style={chip(filter.status === "waiting")} aria-pressed={filter.status === "waiting"} onClick={() => setFilter({ ...filter, status: filter.status === "waiting" ? "any" : "waiting" })}>
            Waiting
          </button>
          <button type="button" style={chip(filter.status === "open")} aria-pressed={filter.status === "open"} onClick={() => setFilter({ ...filter, status: filter.status === "open" ? "any" : "open" })}>
            Open
          </button>
        </div>
        <div id={tableId} role="region" aria-label="Cases">
          {shown.map((c) => (
            <div key={c.id} style={row}>
              <span style={{ fontVariantNumeric: "tabular-nums", opacity: 0.7 }}>{c.id}</span>
              <span>{c.title}</span>
              <span style={{ opacity: 0.7 }}>{c.owner}</span>
            </div>
          ))}
          {shown.length ? null : <div style={{ ...row, gridTemplateColumns: "1fr", opacity: 0.7 }}>No cases match</div>}
        </div>
      </div>
      <div style={{ ...caption, textAlign: "center" }}>
        Change a filter and the view shows Edited, with Save changes. The ⋯ button holds rename, share, default and delete.{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setViews(START);
            openView("mine");
            setFilter(START[0].filter);
          }}
        >
          Reset the demo
        </button>
      </div>
    </div>
  );
}
