import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { FileTreeNode } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A research institute's sample tracker. */

const FILES: FileTreeNode[] = [
  { name: ".github", children: [{ name: "ci.yml" }] },
  {
    name: "docs",
    children: [{ name: "freezer-map.png" }, { name: "custody-policy.md", status: "modified" }, { name: "barcode-format.md" }],
  },
  {
    name: "src",
    children: [
      { name: "alerts", children: [{ name: "gaps.ts", status: "modified" }, { name: "channels.ts" }, { name: "legacy.ts", status: "deleted" }] },
      { name: "barcode.ts" },
      { name: "index.ts" },
    ],
  },
  { name: "tests", children: [{ name: "gaps.test.ts", status: "added" }] },
  { name: "package.json" },
  { name: "README.md" },
  { name: "tsconfig.json" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { FileTree } = ui;
  const [note, setNote] = useState("");
  return (
    <div style={{ width: "100%", maxWidth: 360, display: "grid", gap: 8 }}>
      <FileTree
        description="sample-tracker"
        nodes={FILES}
        searchable
        defaultExpanded={["docs", "src", "src/alerts"]}
        defaultSelected="src/alerts/gaps.ts"
        maxHeight={380}
        onTcOpen={(e) => setNote(`Open ${e.detail.path}.`)}
        onTcSearch={(e) => setNote(`Search inside files for “${e.detail.query}”.`)}
      />
      <div style={{ ...caption, textAlign: "center" }}>{note || "Type to filter, or ? and text then Enter to search inside files."}</div>
    </div>
  );
}
