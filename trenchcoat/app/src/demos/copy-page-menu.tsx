import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { CopyPageAssistant } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The top of a page in a fictional research institute's internal Records API docs, with its Copy page button. The
   assistants are made-up internal tools; the demo keeps their links from opening and logs what would happen. */

const MARKDOWN = `# List records

\`GET /v1/records\`

Returns the records you can read, newest first, 50 to a page.

## Query parameters

| Name | Type | Description |
|---|---|---|
| \`classification\` | string | Only records with this classification: \`public\`, \`internal\`, \`restricted\` |
| \`cursor\` | string | The \`next\` cursor from the previous page |

## Example

\`\`\`bash
curl https://records.halden.example/v1/records?classification=internal \\
  -H "Authorization: Bearer $RECORDS_TOKEN"
\`\`\`
`;

const ASSISTANTS: CopyPageAssistant[] = [
  { id: "institute", label: "Institute Assistant", urlTemplate: "https://assistant.halden.example/new?q={prompt}" },
  { id: "research", label: "Research Chat", urlTemplate: "https://chat.halden.example/?prompt={prompt}" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { CopyPageMenu } = ui;
  const [log, setLog] = useState("Copy the page, or open the menu for more.");
  const [open, setOpen] = useState(true);
  return (
    <div style={{ display: "grid", gap: 12, width: "100%", maxWidth: 560, minHeight: 360, alignContent: "start" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ display: "grid", gap: 4 }}>
          <span style={{ ...caption, fontFamily: "var(--tc-font-mono)" }}>GET /v1/records</span>
          <strong style={{ fontSize: 22, fontWeight: 600, color: "var(--tc-text-primary)" }}>List records</strong>
        </div>
        <CopyPageMenu
          markdown={MARKDOWN}
          url="https://docs.halden.example/records-api/list-records"
          pageTitle="List records"
          assistants={ASSISTANTS}
          open={open}
          onOpenChange={setOpen}
          onPageCopy={(kind) => setLog(kind === "link" ? "Copied the page's link." : "Copied the page as Markdown.")}
          onAssistantOpen={(id, href) => {
            setLog(`Would open ${ASSISTANTS.find((a) => a.id === id)?.label}: ${decodeURIComponent(href.split(/[?&](?:q|prompt)=/)[1] ?? "")}`);
            return false;
          }}
          onPageDownload={(filename) => setLog(`Saved ${filename}.`)}
        />
      </div>
      <p style={caption}>
        {log}{" "}
        {open ? null : (
          <button type="button" style={textButton} onClick={() => setOpen(true)}>
            Open the menu again
          </button>
        )}
      </p>
    </div>
  );
}
