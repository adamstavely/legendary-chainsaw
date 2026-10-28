import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* Where a Larkfield Institute paper is cited, by section of the citing paper. */

export default function Demo({ ui }: { ui: typeof UI }) {
  const { CitationSections } = ui;
  const [opened, setOpened] = useState(false);
  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <CitationSections
        source="Larkfield Index"
        counts={{ intro: 107, methods: 13, results: 11, discussion: 114, other: 120 }}
        openable
        onOpen={() => {
          setOpened(true);
          return false;
        }}
      />
      <div style={{ ...caption, textAlign: "center" }}>{opened ? "Opened the details." : "Point at a section, or move through the legend with the arrow keys."}</div>
    </div>
  );
}
