import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { TreeOption, TreeSelectValue } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional research library's subject catalogue: file a new acquisition under one subject, and pick the subjects a
   reading list covers. Optics is filed already; the reading list has two subjects of Earth sciences checked, so its
   parent shows a dash. All the data is made up. */

const SUBJECTS: TreeOption[] = [
  {
    id: "sciences",
    label: "Sciences",
    children: [
      { id: "physics", label: "Physics", children: [{ id: "optics", label: "Optics" }, { id: "acoustics", label: "Acoustics" }, { id: "thermo", label: "Thermodynamics" }] },
      {
        id: "earth",
        label: "Earth sciences",
        children: [
          { id: "geology", label: "Geology" },
          { id: "oceanography", label: "Oceanography" },
          { id: "meteorology", label: "Meteorology", description: "Weather records" },
        ],
      },
      { id: "botany", label: "Botany" },
    ],
  },
  {
    id: "humanities",
    label: "Humanities",
    children: [
      { id: "history", label: "History", children: [{ id: "maritime", label: "Maritime history" }, { id: "local", label: "Local history" }] },
      { id: "linguistics", label: "Linguistics" },
      { id: "restricted", label: "Restricted collections", disabled: true, description: "By appointment" },
    ],
  },
  { id: "maps", label: "Maps & atlases", children: [{ id: "charts", label: "Nautical charts" }, { id: "surveys", label: "Survey maps" }] },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { TreeSelect } = ui;
  const [subject, setSubject] = useState<TreeSelectValue>("optics");
  const [cover, setCover] = useState<TreeSelectValue>(["geology", "oceanography"]);
  return (
    <div style={{ display: "grid", gap: 20, width: "100%", maxWidth: 440 }}>
      <TreeSelect label="Subject" name="subject" options={SUBJECTS} value={subject} onChange={setSubject} />
      <TreeSelect label="Reading list covers" name="covers" multiple options={SUBJECTS} value={cover} onChange={setCover} placeholder="Choose subjects…" />
      <p style={caption}>
        Open a field and type to filter – parents of a match stay. ← → fold and unfold, Enter picks.{" "}
        <button type="button" style={textButton} onClick={() => setCover(["sciences", "physics", "optics", "acoustics", "thermo", "earth", "geology", "oceanography", "meteorology", "botany"])}>
          Check all of Sciences
        </button>
      </p>
    </div>
  );
}
