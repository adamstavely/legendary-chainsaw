import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { AiSearchScope, AiSearchSuggestion } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* The search box of a fictional case workspace: recent and suggested searches, the case as a scope, and AI mode with
   prompts to start from. The caption shows what each submit would send. */

const SUGGESTIONS: AiSearchSuggestion[] = [
  { label: "invoice 7741", kind: "recent", hint: "12 results" },
  { label: "Helios Holdings wire", kind: "recent", hint: "Yesterday" },
  { label: "wire transfer May", kind: "recent", hint: "In file contents" },
  { label: "Board minutes 2026", kind: "suggested", hint: "Files" },
  { label: "Vendor contracts expiring this quarter", kind: "suggested", hint: "Files" },
  { label: "Logistics budget approvals", kind: "suggested", hint: "People" },
];
const SCOPES: AiSearchScope[] = [{ id: "case", label: "Case 22-1187" }];
const EXAMPLES = ["Summarise what changed in the vendor contracts", "Who signed off the Q3 logistics budget?", "List every file that mentions Helios Holdings"];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AiSearch } = ui;
  const [sent, setSent] = useState<string | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 600, display: "grid", gap: 10, paddingBottom: 220 }}>
      <AiSearch
        suggestions={SUGGESTIONS}
        defaultScopes={SCOPES}
        examples={EXAMPLES}
        onSearch={(d) => setSent(`${d.mode === "ai" ? "Asked" : "Searched for"} “${d.query}”${d.contents ? " in file contents" : ""}${d.scopes.length ? ` · ${d.scopes.join(", ")}` : ""}`)}
      />
      <div style={{ ...caption, textAlign: "center" }}>{sent ?? "Focus the field (or press ⌘K / Ctrl K), pick a suggestion, or switch on AI mode."}</div>
    </div>
  );
}
