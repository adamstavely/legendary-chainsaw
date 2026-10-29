import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* Keywords for a record in a fictional research library's catalogue: free text with suggestions from the library's
   subject headings, at most eight, and no keyword shorter than three letters. The second field accepts only subject
   headings. All the data is made up. */

const HEADINGS = ["Archives", "Cartography", "Coastal erosion", "Harbours", "Hydrography", "Maritime history", "Navigation", "Shipbuilding", "Surveying", "Tides", "Trade routes", "Weather records"];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { TagInput } = ui;
  const [keywords, setKeywords] = useState(["Harbours", "Tides", "north quay"]);
  return (
    <div style={{ display: "grid", gap: 20, width: "100%", maxWidth: 440 }}>
      <TagInput
        label="Keywords"
        name="keywords"
        value={keywords}
        onChange={setKeywords}
        suggestions={HEADINGS}
        max={8}
        validate={(text) => (text.length < 3 ? "Keywords need at least three letters." : undefined)}
      />
      <TagInput label="Subject headings" name="headings" defaultValue={["Cartography"]} suggestions={HEADINGS} allowCustom={false} placeholder="Add a heading…" />
      <p style={caption}>
        Type and press Enter or a comma; paste “a, b, c” to add three.{" "}
        <button type="button" style={textButton} onClick={() => setKeywords([])}>
          Clear keywords
        </button>
      </p>
    </div>
  );
}
