import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { JsonFlag, JsonValue } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* What a document reader pulled out of a supplier's invoice, laid out for the person who checks it before it's paid:
   the fields as a form, the line items as a table, one field already flagged. "Open as a dialog" shows the same
   document in the modal viewer, and "Broken JSON" what a syntax error looks like. All the data is made up. */

const INVOICE: JsonValue = {
  invoice_number: "INV-2207",
  status: "needs_review",
  issued_on: "2026-10-12",
  due_on: "2026-11-11",
  currency: "EUR",
  supplier: {
    name: "Harbour Lane Office Supply",
    vat_id: "NL004495445B01",
    email: "billing@harbourlane.example",
    website: "https://harbourlane.example",
    address: { street: "Kade 14", city: "Rotterdam", postcode: "3011 AA", country: "NL" },
  },
  bill_to: { name: "Northfield Research Institute", cost_centre: "LAB-0042", purchase_order: "PO-88315" },
  line_items: [
    { sku: "HL-2208", description: "Archive boxes, 50 pack", quantity: 4, unit_price: 38.5, amount: 154 },
    { sku: "HL-1190", description: "Printer paper A4, 5 reams", quantity: 10, unit_price: 21.9, amount: 219 },
    { sku: "HL-0431", description: "Desk lamp, LED", quantity: 3, unit_price: 64, amount: 192 },
    { sku: "HL-7712", description: "Delivery – next day", quantity: 1, unit_price: 25, amount: 25 },
  ],
  subtotal: 590,
  vat_rate: 0.21,
  vat: 123.9,
  total: 713.9,
  paid: false,
  payment_reference: null,
  tags: ["office", "Q4", "recurring"],
  extraction: { model_confidence: 0.94, pages: 2, checked_at: "2026-10-13T09:24:00Z" },
};

const FLAGS: JsonFlag[] = [{ path: "/line_items/1/unit_price", note: "Last order was €19.90 – check the price list" }];

const BROKEN = `{
  "invoice_number": "INV-2207",
  "total": 713.90,
  "paid": false,
  "tags": ["office", "Q4",]
}`;

export default function Demo({ ui }: { ui: typeof UI }) {
  const { JsonViewer } = ui;
  const [flags, setFlags] = useState<JsonFlag[]>(FLAGS);
  const [open, setOpen] = useState(false);
  const [broken, setBroken] = useState(false);
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 10 }}>
      <JsonViewer
        title="Invoice INV-2207"
        description="Extracted from harbour-lane-inv-2207.pdf · needs review"
        filename="inv-2207.json"
        value={broken ? undefined : INVOICE}
        source={broken ? BROKEN : undefined}
        flags={flags}
        onFlagsChange={setFlags}
        style={{ ["--tc-jsv-body-h" as string]: "440px" }}
      />
      <JsonViewer modal open={open} onOpenChange={setOpen} title="Invoice INV-2207" filename="inv-2207.json" value={INVOICE} flags={flags} onFlagsChange={setFlags} />
      <div style={{ ...caption, textAlign: "center" }}>
        Switch views, search “HL-”, or flag a field for a second look.{" "}
        <button type="button" style={textButton} onClick={() => setOpen(true)}>
          Open as a dialog
        </button>{" "}
        ·{" "}
        <button type="button" style={textButton} onClick={() => setBroken((b) => !b)}>
          {broken ? "Valid JSON" : "Broken JSON"}
        </button>
      </div>
    </div>
  );
}
