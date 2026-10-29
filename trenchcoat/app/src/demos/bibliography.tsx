import type * as UI from "../../../src/elements/react";
import type { Reference } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A fictional research institute's reading list on coral reef restoration – made-up authors, journals and DOIs
   (10.5555/…, a test prefix) and example.org links. Switch the style, tick a few and export them. */

const REFS: Reference[] = [
  {
    id: "okafor2021",
    type: "article",
    authors: [
      { family: "Okafor", given: "Miriam" },
      { family: "Tran", given: "Linh" },
    ],
    title:
      "Rubble stabilisation and early coral recruitment on degraded reef flats",
    container: "Journal of Reef Restoration",
    year: 2021,
    volume: 14,
    issue: 2,
    pages: "112-129",
    doi: "10.5555/jrr.2021.0142",
    tags: ["substrate", "recruitment"],
  },
  {
    id: "haddad2019",
    type: "book",
    authors: [{ family: "Haddad", given: "Rami" }],
    title: "Gardening the sea: A practical guide to coral nurseries",
    publisher: "Harbour Lane Press",
    year: 2019,
    tags: ["nurseries"],
  },
  {
    id: "silva2023",
    type: "article",
    authors: [
      { family: "Silva", given: "João Pedro" },
      { family: "Mensah", given: "Ama" },
      { family: "Lindqvist", given: "Mira" },
      { family: "Okafor", given: "Miriam" },
    ],
    title:
      "Heat-tolerant fragments outgrow nursery controls after a marine heatwave",
    container: "Coral Ecology Letters",
    year: 2023,
    volume: 8,
    issue: 4,
    pages: "455-470",
    doi: "10.5555/cel.2023.0084",
    tags: ["heat tolerance", "bleaching"],
  },
  {
    id: "tran2020",
    type: "chapter",
    authors: [{ family: "Tran", given: "Linh" }],
    title: "Monitoring restored reefs with photogrammetry",
    container: "Methods in Reef Science",
    publisher: "Northfield Academic",
    year: 2020,
    pages: "77-98",
    tags: ["monitoring"],
  },
  {
    id: "institute2022",
    type: "report",
    authors: [{ family: "Northfield Research Institute" }],
    title: "Reef restoration field programme: Year one report",
    publisher: "Northfield Research Institute",
    year: 2022,
    url: "https://example.org/reports/reef-year-one",
    tags: ["programme"],
  },
  {
    id: "mensah2024",
    type: "web",
    authors: [{ family: "Mensah", given: "Ama" }],
    title: "Training volunteer divers for nursery maintenance",
    container: "Reef Volunteers Network",
    year: 2024,
    url: "https://example.org/guides/volunteer-divers",
    accessed: "2026-09-14",
    tags: ["volunteers"],
  },
  {
    id: "lindqvist2018",
    type: "thesis",
    authors: [{ family: "Lindqvist", given: "Mira" }],
    title: "Larval settlement cues on artificial reef structures",
    publisher: "University of Northfield",
    year: 2018,
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Bibliography } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 820, display: "grid", gap: 10 }}>
      <Bibliography
        title="Reading list – reef restoration"
        description="Field programme team · 7 sources"
        references={REFS}
        defaultSelected={["okafor2021", "silva2023"]}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Switch the citation style, search, tick references and export them as
        BibTeX, RIS or text.
      </div>
    </div>
  );
}
