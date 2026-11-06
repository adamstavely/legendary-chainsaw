import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's researchers by the labs they work in: most belong to one, some split their time between two,
   a few between all three. “Add Metabolomics” adds a fourth lab – the three largest are drawn and a note says so. */

const THREE = [
  { sets: ["Genomics"], size: 64 },
  { sets: ["Imaging"], size: 48 },
  { sets: ["Proteomics"], size: 36 },
  { sets: ["Genomics", "Imaging"], size: 14 },
  { sets: ["Genomics", "Proteomics"], size: 11 },
  { sets: ["Imaging", "Proteomics"], size: 8 },
  { sets: ["Genomics", "Imaging", "Proteomics"], size: 4 },
];
const FOUR = [...THREE, { sets: ["Metabolomics"], size: 22 }, { sets: ["Genomics", "Metabolomics"], size: 6 }];
const TWO = [
  { sets: ["Wet lab"], size: 92 },
  { sets: ["Computational"], size: 58 },
  { sets: ["Wet lab", "Computational"], size: 21 },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { VennDiagram } = ui;
  const [four, setFour] = useState(false);
  return (
    <div style={{ width: "100%", maxWidth: 980, display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
        <VennDiagram title="Researchers by lab" description="Who works in which labs, this year" data={four ? FOUR : THREE} />
        <VennDiagram title="Methods" description="Researchers by the methods they use" data={TWO} />
      </div>
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a region, or Tab in and use the arrows.{" "}
        <button type="button" style={textButton} onClick={() => setFour(!four)}>
          {four ? "Remove Metabolomics" : "Add Metabolomics"}
        </button>
      </div>
    </div>
  );
}
