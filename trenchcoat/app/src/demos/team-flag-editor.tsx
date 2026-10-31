import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { TeamFlag } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* An audit team decides what its flags mean, and how many files carry each one. */

const FLAGS: TeamFlag[] = [
  { id: "review", label: "Needs review", meaning: "A second auditor should read this before it's relied on.", color: "#CA8A04" },
  { id: "hold", label: "Legal hold", meaning: "Don't change or delete. Counsel has asked us to keep it as it is.", color: "#DC2626" },
  { id: "final", label: "Final", meaning: "Signed off, and the version to cite.", color: "#16A34A" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { TeamFlagEditor } = ui;
  const [flags, setFlags] = useState(FLAGS);
  return (
    <div style={{ width: "100%", maxWidth: 680, display: "grid", gap: 8 }}>
      <TeamFlagEditor flags={flags} onFlagsChange={setFlags} usage={{ review: 12, hold: 3, final: 48 }} description="What each flag means on this team's files" />
      <div style={{ ...caption, textAlign: "center" }}>Change a colour, or remove a flag that's on files to see it ask first.</div>
    </div>
  );
}
