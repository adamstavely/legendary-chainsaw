import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ResponseExample } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* GET /records/{id} on a fictional research institute's internal Records API: a record as JSON or CSV, then the errors
   a client should expect. */

const RECORD = {
  id: "REC-004812",
  title: "Annual audit 2026 – vendor contracts",
  classification: "internal",
  owner: { id: "s-2291", name: "Priya Shah", email: "priya.shah@institute.example", unit: "Finance" },
  tags: ["audit", "vendors", "2026"],
  created_at: "2026-03-02T09:14:00Z",
  retention: { years: 7, legal_hold: false },
};

const EXAMPLES: ResponseExample[] = [
  {
    status: 200,
    description: "The record, if you may see its classification.",
    headers: { "Content-Type": "application/json", ETag: '"r4812-v9"', "Cache-Control": "private, max-age=60" },
    bodies: [
      { mediaType: "application/json", body: RECORD },
      { mediaType: "text/csv", body: "id,title,classification,owner_email,created_at\nREC-004812,Annual audit 2026 – vendor contracts,internal,priya.shah@institute.example,2026-03-02T09:14:00Z" },
    ],
  },
  { status: 304, description: "Unchanged since the ETag you sent in If-None-Match.", headers: { ETag: '"r4812-v9"' } },
  { status: 404, description: "No record has that id, or it's restricted and you lack the scope.", body: { error: "not_found", message: "No record REC-004812 is visible to you." } },
  {
    status: 429,
    label: "Rate limited",
    description: "Too many requests from this key. Wait for Retry-After, then try again.",
    headers: { "Retry-After": "30", "X-RateLimit-Limit": "600", "X-RateLimit-Remaining": "0" },
    body: { error: "rate_limited", retry_after: 30 },
  },
  { status: 500, description: "Something failed on our side; it's safe to retry.", body: { error: "internal", request_id: "req_7f3a2c" } },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ResponseExamples } = ui;
  const [status, setStatus] = useState("200");
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 8 }}>
      <ResponseExamples title="GET /records/{id}" description="Records API" examples={EXAMPLES} status={status} onStatusChange={setStatus} headersOpen />
      <div style={{ ...caption, textAlign: "center" }}>
        Pick a status, open its headers, or switch the body to CSV.{" "}
        <button type="button" style={textButton} onClick={() => setStatus("429")}>
          Show the rate limit
        </button>
      </div>
    </div>
  );
}
