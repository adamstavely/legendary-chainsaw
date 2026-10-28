import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { PlaceRecord } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A fictional business customer's places, from a know-your-customer review: the registered office, a warehouse the
   team hasn't verified yet, a former office and a site they visit for trade fairs. */

const at = (y: number, m: number) => new Date(y, m - 1, 1).getTime();

const PLACES: PlaceRecord[] = [
  { id: "p1", name: "Registered office", type: "work", status: "confirmed", address: "14 Harbour Row, Leith, Edinburgh EH6 6LP", coords: [55.9763, -3.1722], since: at(2021, 6), note: "Matches Companies House" },
  { id: "p2", name: "Warehouse 7", type: "frequent", status: "unverified", address: "Unit 7, Port Approach, Grangemouth FK3 8UL", coords: [56.0127, -3.6993], span: "Deliveries 2025 –" },
  { id: "p3", name: "Director's address", type: "residence", status: "confirmed", address: "3 Ravelston Park, Edinburgh EH4 3DX", since: at(2019, 3) },
  { id: "p4", name: "Former office", type: "former", status: "vacated", address: "Flat 22, 9 Marylebone Lane, London W1U 2HL", coords: [51.5161, -0.1494], since: at(2017, 2), until: at(2020, 11) },
  { id: "p5", name: "Trade fair site", type: "other", address: "Messe Frankfurt, Ludwig-Erhard-Anlage 1, Frankfurt", span: "Visits 2024 –" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { PlaceList } = ui;
  const [selected, setSelected] = useState<string | null>(null);
  const place = PLACES.find((p) => p.id === selected);
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 8 }}>
      <PlaceList title="Places" description="Leith Marine Supplies Ltd · KYC review" places={PLACES} selected={selected} onSelectedChange={setSelected} />
      <div style={{ ...caption, textAlign: "center" }}>{place ? `Show on the map: ${place.name}.` : "Pick a place to show it on a map."}</div>
    </div>
  );
}
