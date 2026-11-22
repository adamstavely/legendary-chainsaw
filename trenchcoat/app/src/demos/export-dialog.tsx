import { useEffect, useRef, useState, type CSSProperties } from "react";
import type * as UI from "../../../src/elements/react";
import type { ExportColumn, ExportRequest, ExportStatus } from "../../../src/elements/react";
import { caption, surface, textButton } from "../demo-kit";

/* Exporting fraud-review cases from a fictional case-review app, "Ledgerline": 12 cases are selected and the filters
   show 340 of 12,480. Export opens the dialog. The demo plays the server's part: preparing counts up, then the file is
   ready – a small CSV made on the spot – or, past 5,000 rows with Email me ticked, it says it'll be emailed. "Fail the
   next export" shows the failed state and Retry. */

const COLUMNS: ExportColumn[] = [
  { id: "case", label: "Case", required: true },
  { id: "opened", label: "Opened" },
  { id: "reviewer", label: "Reviewer" },
  { id: "risk", label: "Risk score" },
  { id: "status", label: "Status" },
  { id: "amount", label: "Amount" },
  { id: "merchant", label: "Merchant" },
  { id: "notes", label: "Notes" },
];
const SAMPLE = [
  ["LL-2041", "2026-11-18", "Noor Haddad", "72", "In review", "1,240.00", "Northwind Outfitters", ""],
  ["LL-2042", "2026-11-18", "Tomas Lind", "35", "Closed", "86.50", "Blue Harbor Books", "Customer confirmed"],
  ["LL-2043", "2026-11-19", "Priya Raman", "91", "Escalated", "4,980.00", "Kestrel Travel", "Second review"],
  ["LL-2044", "2026-11-20", "Ade Okafor", "58", "In review", "312.75", "Fernway Grocers", ""],
];
const COUNTS = { selected: 12, filtered: 340, all: 12480 };
const EMAIL = "noor.haddad@ledgerline.example";

const page: CSSProperties = { ...surface, display: "grid", gap: 12, padding: 18, borderRadius: 14, width: "100%", boxSizing: "border-box" };
const row: CSSProperties = { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "space-between" };
const exportBtn: CSSProperties = { height: 30, padding: "0 12px", borderRadius: 8, border: "1px solid var(--tc-border-default, light-dark(#e3e3e3, #2e2e33))", background: "transparent", color: "inherit", font: "inherit", fontSize: 13, cursor: "pointer" };
const muted: CSSProperties = { fontSize: 13, color: "var(--tc-text-secondary, light-dark(#666, #aaa))" };
const table: CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: 13 };
const cell: CSSProperties = { padding: "6px 8px 6px 0", borderTop: "1px solid var(--tc-border-subtle, light-dark(#eee, #2a2a2e))", textAlign: "left" };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ExportDialog } = ui;
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [file, setFile] = useState<{ url: string; name: string; size: number } | null>(null);
  const [failNext, setFailNext] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => () => clearInterval(timer.current), []);
  useEffect(
    () => () => {
      if (file) URL.revokeObjectURL(file.url);
    },
    [file],
  );

  const start = (r: ExportRequest) => {
    clearInterval(timer.current);
    setStatus("preparing");
    setProgress(0);
    let p = 0;
    timer.current = setInterval(() => {
      p += 0.17;
      if (p < 1) return setProgress(p);
      clearInterval(timer.current);
      if (failNext) {
        setFailNext(false);
        return setStatus("failed");
      }
      if (r.emailMe) return setStatus("emailed");
      const ids = COLUMNS.map((c) => c.id);
      const keep = r.columns.map((c) => ids.indexOf(c));
      const csv = [r.columns.map((c) => COLUMNS.find((x) => x.id === c)!.label), ...SAMPLE.map((s) => keep.map((k) => s[k]!))]
        .map((line) => line.map((v) => (/[",]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(","))
        .join("\r\n");
      const blob = new Blob([csv], { type: "text/csv" });
      setFile({ url: URL.createObjectURL(blob), name: `ledgerline-cases-${r.rows}.csv`, size: blob.size });
      setStatus("ready");
    }, 450);
  };

  const close = (o: boolean) => {
    setOpen(o);
    if (!o) {
      clearInterval(timer.current);
      setStatus("idle");
      setProgress(undefined);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: 620, display: "grid", gap: 10 }}>
      <div style={page}>
        <div style={row}>
          <div>
            <div style={{ fontWeight: 600 }}>Fraud-review cases</div>
            <div style={muted}>12 selected · the filters show 340 of 12,480</div>
          </div>
          <button type="button" style={exportBtn} onClick={() => close(true)}>
            Export…
          </button>
        </div>
        <table style={table}>
          <thead>
            <tr>
              {["Case", "Reviewer", "Risk", "Status"].map((h) => (
                <th key={h} style={{ ...cell, ...muted, borderTop: 0 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLE.map((s) => (
              <tr key={s[0]}>
                {[s[0], s[2], s[3], s[4]].map((v, i) => (
                  <td key={i} style={cell}>
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ExportDialog
        open={open}
        onOpenChange={close}
        description="Fraud-review cases"
        counts={COUNTS}
        columns={COLUMNS}
        email={EMAIL}
        status={status}
        progress={progress}
        downloadUrl={file?.url}
        fileName={file?.name}
        fileSize={file?.size}
        error="The export service took too long to answer. Nothing was sent."
        onExport={start}
        onExportCancel={() => close(false)}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Export opens the dialog; all 12,480 rows ticks “Email me”.{" "}
        <button type="button" style={textButton} onClick={() => setFailNext(!failNext)}>
          {failNext ? "The next export will fail – undo" : "Fail the next export"}
        </button>
      </div>
    </div>
  );
}
