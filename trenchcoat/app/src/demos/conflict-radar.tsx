import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ConflictAgent, ConflictFile } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* Three agents updating a research institute's sample tracker, each on its own branch. */

const AGENTS: ConflictAgent[] = [
  { id: "a", name: "Schema agent", branch: "schema-v3" },
  { id: "b", name: "Import agent", branch: "bulk-import" },
  { id: "c", name: "Docs agent", branch: "docs-refresh" },
];
const FILES: ConflictFile[] = [
  { path: "docs/samples.md", edits: [{ agent: "c", lines: [1, 80], kind: "rewrite" }] },
  { path: "src/importer.ts", edits: [{ agent: "b", lines: [10, 90], kind: "feature" }, { agent: "c", lines: [200, 210], kind: "comments" }] },
  { path: "src/samples/schema.ts", edits: [{ agent: "a", lines: [12, 60], kind: "refactor", approach: "Splits each sample's location into its own table, so moves keep their history." }, { agent: "b", lines: [48, 75], kind: "feature", approach: "Adds location columns to the sample table, which keeps bulk imports simple." }] },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ConflictRadar } = ui;
  const [note, setNote] = useState("");
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 8 }}>
      <ConflictRadar description="Sample tracker, 3 branches" agents={AGENTS} files={FILES} defaultSelected="src/samples/schema.ts" mergeable onResolve={(f) => setNote(`Resolving ${f.path}.`)} onTcMerge={() => setNote("Your merge tool would take over here.")} />
      <div style={{ ...caption, textAlign: "center" }}>{note || "Keep one way for the conflict, and Merge becomes available."}</div>
    </div>
  );
}
