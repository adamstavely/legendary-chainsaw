import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { BreadcrumbItem } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* Where a reader is in a fictional research library's digital archive. The full trail is long, so in a narrow space
   the middle folds into "…"; the second trail is capped at four items with `max`. Clicking a crumb here is routed by
   the demo (tc-navigate, prevented) instead of following a link. All the data is made up. */

const TRAIL: BreadcrumbItem[] = [
  { label: "Library", href: "#library", icon: "home" },
  { label: "Special collections", href: "#special" },
  { label: "Maritime archive", href: "#maritime", icon: "folder" },
  { label: "Harbour board records", href: "#harbour" },
  { label: "1920–1939", href: "#1920" },
  { label: "Survey of the north quay, with soundings and tide notes", icon: "file" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Breadcrumbs } = ui;
  const [at, setAt] = useState(TRAIL.length - 1);
  const trail = TRAIL.slice(0, at + 1).map((item, i) => (i === at ? { ...item, href: undefined } : item));
  return (
    <div style={{ display: "grid", gap: 20, width: "100%", maxWidth: 640 }}>
      <Breadcrumbs
        items={trail}
        copyPath
        onNavigate={(_, index, e) => {
          e.preventDefault();
          setAt(index);
        }}
      />
      <Breadcrumbs items={TRAIL} separator="slash" max={4} onNavigate={(_, __, e) => e.preventDefault()} />
      <p style={caption}>
        Narrow the window to fold the middle into “…”.{" "}
        <button type="button" style={textButton} onClick={() => setAt(TRAIL.length - 1)}>
          Back to the survey
        </button>
      </p>
    </div>
  );
}
