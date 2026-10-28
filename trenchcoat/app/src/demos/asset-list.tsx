import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { AssetGroup } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* The assets a fictional logistics company holds against one customer account in a fraud review: two vehicles on
   record and one reported by a depot camera, and the devices handed over for analysis. Identifiers stay masked until
   someone shows them; Open reports which asset to open. */

const GROUPS: AssetGroup[] = [
  {
    id: "vehicles",
    label: "Vehicles",
    assets: [
      { id: "v1", kind: "car", name: "Audi A6 Avant", identifier: "AB-441-KX", identifierLabel: "Plate", detail: "Black · 2023", link: "Registered to customer", status: "confirmed" },
      { id: "v2", kind: "car", name: "Range Rover Sport", identifier: "4471-MBA", identifierLabel: "Plate", detail: "Grey · 2022", link: "Reg. Aurelia Estates SL", status: "confirmed" },
      { id: "v3", kind: "motorcycle", name: "BMW R1250", identifierLabel: "Plate", detail: "Seen on depot camera, plate unread", link: "Unconfirmed", status: "suspected" },
    ],
  },
  {
    id: "devices",
    label: "Devices",
    assets: [
      { id: "d1", kind: "phone", name: "iPhone 15 Pro", identifier: "356938035643809", identifierLabel: "IMEI", detail: "Company phone", link: "Issued to account holder", status: "in-analysis" },
      { id: "d2", kind: "laptop", name: "MacBook Pro 14", identifier: "C02FK3QXMD6T", identifierLabel: "Serial", detail: "Returned at offboarding", link: "Company asset", status: "seized" },
      { id: "d3", kind: "drive", name: "USB drive · 256 GB", identifier: "AA00000000004471", identifierLabel: "Serial", detail: "Encrypted", link: "Found with the laptop", status: "in-analysis" },
      { id: "d4", kind: "phone", name: "Pixel 6", identifier: "354021117744120", identifierLabel: "IMEI", detail: "Replaced in 2024", link: "Issued to account holder", status: "retired" },
    ],
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AssetList } = ui;
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 680, display: "grid", gap: 8 }}>
      <AssetList title="Assets" description="Northwind Freight · account CUS-40218 review" groups={GROUPS} onOpen={(a) => setOpened(a.name)} />
      <div style={{ ...caption, textAlign: "center" }}>{opened ? `Opened ${opened}.` : "Show an identifier with the eye, or press Open."}</div>
    </div>
  );
}
