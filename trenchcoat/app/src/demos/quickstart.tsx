import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional research institute's internal Records API. The key is an obvious test placeholder, and Run it answers
   with a canned response after a moment, so nothing leaves the page. */

const RESPONSE = JSON.stringify(
  {
    results: [
      { id: "rec_8f2a", title: "Travel and expenses policy, 2026", updated: "2026-09-14" },
      { id: "rec_51c0", title: "Conference travel – approval checklist", updated: "2026-06-02" },
    ],
    total: 2,
  },
  null,
  2,
);

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Quickstart } = ui;
  const [response, setResponse] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  return (
    <div style={{ width: "100%", maxWidth: 620, display: "grid", gap: 8 }}>
      <Quickstart
        title="Search records"
        description="Your first request to the Records API"
        baseUrl="https://records.example.org"
        endpoint={{ method: "POST", path: "/v1/records/search", body: { query: "travel policy", limit: 2 } }}
        apiKey="sk-test-0000a1b2c3d4e5f60000"
        envVar="RECORDS_API_KEY"
        defaultLanguage="python"
        response={response}
        responseStatus="200 OK"
        running={running}
        onRun={() => {
          setRunning(true);
          window.setTimeout(() => {
            setResponse(RESPONSE);
            setRunning(false);
          }, 600);
        }}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Switch languages, reveal or copy the key, then run it.{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setResponse(null);
            setRunning(false);
          }}
        >
          Clear the response
        </button>
      </div>
    </div>
  );
}
