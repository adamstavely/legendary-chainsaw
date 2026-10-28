import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* Citation tallies for a Larkfield Institute paper, in both layouts. "Index name" puts a source line on top –
   your own index's name, never someone else's brand. */

const COUNTS = { publications: 522, supporting: 29, mentioning: 348, contrasting: 7 };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { CitationBadge } = ui;
  const [source, setSource] = useState(true);
  const [opened, setOpened] = useState(false);
  return (
    <div style={{ display: "grid", gap: 16, justifyItems: "center" }}>
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap", justifyContent: "center", paddingBottom: 120 }}>
        <CitationBadge
          counts={COUNTS}
          source={source ? "Larkfield Index" : undefined}
          openable
          onOpen={() => {
            setOpened(true);
            return false;
          }}
        />
        <CitationBadge counts={COUNTS} layout="compact" source={source ? "Larkfield Index" : undefined} />
      </div>
      <div style={{ ...caption, textAlign: "center" }}>
        {opened ? "Opened the details. " : "Hover or focus a badge for what each count means. "}
        <button type="button" style={textButton} onClick={() => setSource(!source)}>
          {source ? "Hide the index name" : "Show the index name"}
        </button>
      </div>
    </div>
  );
}
