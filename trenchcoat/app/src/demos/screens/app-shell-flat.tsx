import { useState, type CSSProperties } from "react";
import type * as UI from "@screens/app-shell-flat";
import { Tabs, SectionHead, SearchField } from "@/components/ui/app-shell";

type Shell = typeof import("@/components/ui/app-shell");

const RUNS = [
  { name: "Weekly pipeline report", agent: "Analyst", status: "Done", when: "Today, 9:12" },
  { name: "Enrich 240 inbound leads", agent: "Researcher", status: "Running", when: "Today, 10:40" },
  { name: "Draft Q4 launch emails", agent: "Writer", status: "Needs review", when: "Yesterday" },
  { name: "Sync CRM contacts", agent: "Ops", status: "Done", when: "Yesterday" },
  { name: "Summarize customer calls", agent: "Analyst", status: "Running", when: "Oct 22" },
  { name: "Clean up stale deals", agent: "Ops", status: "Done", when: "Oct 21" },
];

// Status pill colours from the status tokens, with literal fallbacks (the gallery doesn't load tokens.css)
const tone: Record<string, CSSProperties> = {
  Done: { background: "var(--tc-status-success-bg, light-dark(#e6f6ec, #12301f))", color: "var(--tc-status-success-fg, light-dark(#18794e, #3dd68c))" },
  Running: { background: "var(--tc-status-info-bg, light-dark(#eaf1ff, #16243f))", color: "var(--tc-status-info-fg, light-dark(#2456d6, #8ab4ff))" },
  "Needs review": { background: "var(--tc-status-warning-bg, light-dark(#fff3e0, #3a2410))", color: "var(--tc-status-warning-fg, light-dark(#a35200, #ffa057))" },
};

const cell: CSSProperties = { padding: "11px 12px", borderBottom: "1px solid var(--tc-border-default, light-dark(#ececec, #2a2a2e))", textAlign: "left" };

function Page({ Tabs, SectionHead, SearchField }: Pick<Shell, "Tabs" | "SectionHead" | "SearchField">) {
  const [tab, setTab] = useState("All");
  const [query, setQuery] = useState("");
  const rows = RUNS.filter((r) => (tab === "All" || r.status === tab) && r.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="ui-as-page">
      <h1 className="ui-as-page-title">Q3 Campaign</h1>
      <p className="ui-as-page-sub">Everything the agents ran for this campaign this week, newest first.</p>
      <SectionHead
        title="Recent runs"
        left={<Tabs label="Filter runs by status" items={["All", "Running", "Needs review", "Done"]} value={tab} onChange={setTab} />}
        right={<SearchField placeholder="Search runs..." value={query} onChange={setQuery} />}
      />
      {/* Scrolls sideways on its own when the page is narrower than the table */}
      <div role="region" aria-label="Recent runs" tabIndex={0} style={{ overflowX: "auto", marginTop: 8 }}>
        <table style={{ width: "100%", minWidth: 480, borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))", fontSize: 12 }}>
              <th style={{ ...cell, fontWeight: 500 }}>Name</th>
              <th style={{ ...cell, fontWeight: 500 }}>Agent</th>
              <th style={{ ...cell, fontWeight: 500 }}>Status</th>
              <th style={{ ...cell, fontWeight: 500, textAlign: "right" }}>Started</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td style={{ ...cell, fontWeight: 500, color: "var(--tc-text-primary, light-dark(#171717, #ededed))" }}>{r.name}</td>
                <td style={{ ...cell, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))" }}>{r.agent}</td>
                <td style={cell}>
                  <span style={{ ...tone[r.status], display: "inline-flex", alignItems: "center", height: "var(--tc-pill-h, 20px)", padding: "0 var(--tc-pill-px, 8px)", borderRadius: "var(--tc-pill-radius, 999px)", fontSize: "var(--tc-pill-font-size, 11px)", fontWeight: "var(--tc-pill-font-weight, 500)", whiteSpace: "nowrap" }}>
                    {r.status}
                  </span>
                </td>
                <td style={{ ...cell, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))", textAlign: "right" }}>{r.when}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} style={{ ...cell, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))", textAlign: "center", padding: 32 }}>
                  No runs match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AppShellFlat } = ui;
  return (
    <div style={{ height: "100%" }}>
      <AppShellFlat active="Q3 Campaign" workspace="Northwind" user={{ name: "Maya Kim" }}>
        <Page Tabs={Tabs} SectionHead={SectionHead} SearchField={SearchField} />
      </AppShellFlat>
    </div>
  );
}
