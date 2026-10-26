import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ExtractionField, ExtractionPage } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A two-page supplier invoice drawn here as SVG, 800 × 1035 px a page – the boxes below are in those pixels */

const W = 800;
const H = 1035;
type Text = { x: number; y: number; s: number; t: string; w?: number; c?: string; b?: boolean };

const ink = "#1d1d1f";
const soft = "#6b6b70";
const row = (y: number, item: string, qty: string, price: string, total: string): Text[] => [
  { x: 64, y, s: 15, t: item },
  { x: 470, y, s: 15, t: qty },
  { x: 560, y, s: 15, t: price },
  { x: 736, y, s: 15, t: total, w: 1 },
];

const PAGE_1: Text[] = [
  { x: 64, y: 92, s: 26, t: "Northwind Supply Co.", b: true },
  { x: 64, y: 120, s: 14, t: "48 Harbour Road · Leith · EH6 6LT", c: soft },
  { x: 736, y: 92, s: 30, t: "INVOICE", b: true, w: 1, c: "#c2453c" },
  { x: 64, y: 200, s: 12, t: "BILL TO", c: soft },
  { x: 64, y: 224, s: 16, t: "Halden Studio Ltd" },
  { x: 64, y: 246, s: 14, t: "12 Rose Street, Edinburgh", c: soft },
  { x: 500, y: 200, s: 12, t: "INVOICE NO.", c: soft },
  { x: 736, y: 200, s: 15, t: "INV-2041", w: 1 },
  { x: 500, y: 230, s: 12, t: "DATE", c: soft },
  { x: 736, y: 230, s: 15, t: "12 Oct 2026", w: 1 },
  { x: 500, y: 260, s: 12, t: "DUE", c: soft },
  { x: 736, y: 260, s: 15, t: "11 Nov 2026", w: 1, c: "#8a8a90" },
  { x: 500, y: 290, s: 12, t: "PO", c: soft },
  { x: 736, y: 290, s: 15, t: "PO-88213", w: 1 },
  { x: 64, y: 372, s: 12, t: "ITEM", c: soft },
  { x: 470, y: 372, s: 12, t: "QTY", c: soft },
  { x: 560, y: 372, s: 12, t: "PRICE", c: soft },
  { x: 736, y: 372, s: 12, t: "AMOUNT", c: soft, w: 1 },
  ...row(420, "Oak shelving, 1.8 m", "4", "185.00", "740.00"),
  ...row(460, "Wall brackets, steel", "16", "12.50", "200.00"),
  ...row(500, "Delivery and fitting", "1", "300.00", "300.00"),
  { x: 560, y: 600, s: 14, t: "Subtotal", c: soft },
  { x: 736, y: 600, s: 15, t: "1,240.00", w: 1 },
  { x: 560, y: 632, s: 14, t: "VAT 8%", c: soft },
  { x: 736, y: 632, s: 15, t: "99.20", w: 1 },
  { x: 560, y: 680, s: 16, t: "Total due", b: true },
  { x: 736, y: 680, s: 18, t: "£1,339.20", w: 1, b: true },
  { x: 64, y: 960, s: 12, t: "Thank you for your business. Payment details overleaf.", c: soft },
];
const PAGE_2: Text[] = [
  { x: 64, y: 92, s: 20, t: "Payment details", b: true },
  { x: 64, y: 160, s: 12, t: "TERMS", c: soft },
  { x: 64, y: 184, s: 15, t: "Net 30 days from the invoice date" },
  { x: 64, y: 240, s: 12, t: "BANK", c: soft },
  { x: 64, y: 264, s: 15, t: "Lothian Mutual Bank" },
  { x: 64, y: 320, s: 12, t: "ACCOUNT", c: soft },
  { x: 64, y: 344, s: 15, t: "GB29 •••• •••• 6819", c: "#8a8a90" },
  { x: 64, y: 960, s: 12, t: "Northwind Supply Co. · Registered in Scotland SC 482 113", c: soft },
];

function page(texts: Text[], lines: number[]) {
  const t = texts
    .map((x) => `<text x="${x.x}" y="${x.y}" font-size="${x.s}" fill="${x.c ?? ink}"${x.w ? ' text-anchor="end"' : ""}${x.b ? ' font-weight="600"' : ""}>${x.t}</text>`)
    .join("");
  const rules = lines.map((y) => `<path d="M64 ${y}H736" stroke="#e3e3e6"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Helvetica, Arial, sans-serif"><rect width="${W}" height="${H}" fill="#fff"/>${rules}${t}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const PAGES: ExtractionPage[] = [
  { src: page(PAGE_1, [150, 388, 540, 654]), width: W, height: H, alt: "Page 1 of invoice INV-2041: supplier, dates, line items and totals" },
  { src: page(PAGE_2, [120]), width: W, height: H, alt: "Page 2 of invoice INV-2041: payment terms and bank details" },
];

/** A box around right-aligned text ending at x, or left-aligned text starting at x */
const at = (p: number, x: number, y: number, w: number, s: number, end = false) => ({ page: p, x: (end ? x - w : x) - 6, y: y - s - 4, width: w + 12, height: s + 12 });

const EXTRACTED: ExtractionField[] = [
  { id: "vendor", label: "Supplier", value: "Northwind Supply Co.", confidence: 0.97, box: at(1, 64, 92, 262, 26) },
  { id: "number", label: "Invoice number", value: "INV-2041", confidence: 0.99, box: at(1, 736, 200, 74, 15, true) },
  { id: "date", label: "Invoice date", value: "12 Oct 2026", confidence: 0.94, box: at(1, 736, 230, 84, 15, true) },
  { id: "due", label: "Due date", value: "11 Nov 2026", confidence: 0.62, box: at(1, 736, 260, 86, 15, true) },
  { id: "po", label: "Purchase order", value: "PO-88213", confidence: 0.88, box: at(1, 736, 290, 74, 15, true) },
  { id: "subtotal", label: "Subtotal", value: "1,204.00", confidence: 0.71, box: at(1, 736, 600, 64, 15, true) },
  { id: "vat", label: "VAT", value: "99.20", confidence: 0.93, box: at(1, 736, 632, 40, 15, true) },
  { id: "total", label: "Total due", value: "1,339.20", confidence: 0.96, box: at(1, 736, 680, 92, 18, true) },
  { id: "terms", label: "Payment terms", value: "Net 30", confidence: 0.9, box: at(2, 64, 184, 238, 15) },
  { id: "account", label: "Bank account", value: "GB29 •••• •••• 6819", confidence: 0.58, box: at(2, 64, 344, 168, 15) },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ExtractionReview } = ui;
  const [fields, setFields] = useState<ExtractionField[]>([]);
  const [run, setRun] = useState(0);
  const [note, setNote] = useState("↑ ↓ move field by field · A accepts · R rejects · Enter corrects");

  // The extraction arrives a field at a time, then stops
  useEffect(() => {
    if (fields.length >= EXTRACTED.length) return;
    const t = setTimeout(() => setFields((list) => EXTRACTED.slice(0, list.length + 1)), 140);
    return () => clearTimeout(t);
  }, [fields.length, run]);

  const replay = () => {
    setFields([]);
    setNote("↑ ↓ move field by field · A accepts · R rejects · Enter corrects");
    setRun((n) => n + 1);
  };

  return (
    <div style={{ width: "100%", maxWidth: 860, display: "grid", gap: 10 }}>
      <ExtractionReview
        title="Invoice INV-2041"
        source="northwind-inv-2041.pdf"
        pages={PAGES}
        fields={fields}
        onFieldsChange={(list, field, action) => {
          setFields(list);
          setNote(action === "correct" ? `${field.label} corrected – was ${field.original}` : action === "undo" ? `${field.label} is back to review` : `${field.label} ${action === "accept" ? "accepted" : "rejected"}`);
        }}
        onConfirm={(list) => setNote(`Sent ${list.filter((f) => f.status !== "rejected").length} fields to accounts payable`)}
      />
      <div style={{ ...caption, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span>{note}</span>
        <button type="button" onClick={replay} style={textButton}>
          Replay
        </button>
      </div>
    </div>
  );
}
