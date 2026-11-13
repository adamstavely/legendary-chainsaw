import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { EndpointTry } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* Two endpoints of a fictional research institute's internal Records API, with a production and a staging
   environment. */

const ENVIRONMENTS = [
  { id: "prod", label: "Production", baseUrl: "https://records.example.org" },
  { id: "staging", label: "Staging", baseUrl: "https://staging.records.example.org" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { EndpointBar } = ui;
  const [environment, setEnvironment] = useState("prod");
  const [tried, setTried] = useState<EndpointTry | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 8 }}>
      <EndpointBar
        method="GET"
        path="/v1/records/{record_id}"
        params={[{ name: "record_id", type: "string", description: "The record's ID, e.g. rec_8f2a" }]}
        environments={ENVIRONMENTS}
        environment={environment}
        onEnvironmentChange={setEnvironment}
        summary="Get a record"
        onTry={setTried}
      />
      <EndpointBar
        method="POST"
        path="/v1/records/search"
        environments={ENVIRONMENTS}
        environment={environment}
        onEnvironmentChange={setEnvironment}
        summary="Search records"
        beta
        onTry={setTried}
      />
      <EndpointBar method="DELETE" path="/v1/records/{record_id}/drafts" params={[{ name: "record_id", type: "string", description: "The record whose drafts to discard" }]} baseUrl="https://records.example.org" deprecated hideTry />
      <div style={{ ...caption, textAlign: "center" }}>
        {tried ? `Try it: ${tried.method} ${tried.url}. ` : "Point at {record_id} to see what it is. "}
        <button type="button" style={textButton} onClick={() => setEnvironment(environment === "prod" ? "staging" : "prod")}>
          Switch to {environment === "prod" ? "staging" : "production"}
        </button>
      </div>
    </div>
  );
}
