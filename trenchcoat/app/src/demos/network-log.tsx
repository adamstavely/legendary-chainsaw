import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { NetworkRequest } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The staging site of a research institute's grant portal, loading its applications page. */

const HOST = "https://staging.halden.example";
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const REQUESTS: NetworkRequest[] = [
  { id: "doc", method: "GET", url: `${HOST}/grants/applications`, status: 200, type: "document", size: 14_820, start: 0, duration: 182, responseHeaders: { "content-type": "text/html; charset=utf-8" }, body: "<!doctype html>\n<html lang=\"en\">\n  <head><title>Applications · Halden grants</title>…" },
  { id: "css", method: "GET", url: `${HOST}/static/app.css`, status: 200, type: "style", size: 38_400, start: 196, duration: 64 },
  { id: "js", method: "GET", url: `${HOST}/static/app.js`, status: 200, type: "script", size: 212_600, start: 198, duration: 241 },
  { id: "font", method: "GET", url: `${HOST}/static/fonts/inter-var.woff2`, status: 304, type: "font", size: 310, start: 262, duration: 22 },
  { id: "logo", method: "GET", url: `${HOST}/static/img/halden-logo.svg`, status: 404, type: "image", size: 412, start: 450, duration: 38, responseHeaders: { "content-type": "text/plain" }, body: "Not Found" },
  {
    id: "grants",
    method: "GET",
    url: `${HOST}/api/grants?round=2026-B`,
    status: 200,
    type: "fetch",
    size: 9_310,
    start: 470,
    duration: 168,
    requestHeaders: { accept: "application/json", "x-request-id": "8f2c-41d0" },
    responseHeaders: JSON_HEADERS,
    body: {
      round: "2026-B",
      total: 24,
      applications: [
        { id: "HG-2026-0412", title: "Soil carbon in upland peat", lead: "Dr. R. Okafor", requested: 182000, status: "in review" },
        { id: "HG-2026-0418", title: "Low-cost air sensors for schools", lead: "Dr. M. Lindqvist", requested: 64500, status: "submitted" },
      ],
    },
  },
  { id: "me", method: "GET", url: `${HOST}/api/session`, status: 200, type: "fetch", size: 640, start: 476, duration: 52, responseHeaders: JSON_HEADERS, body: { reviewer: true, panels: ["Environment", "Education"] } },
  { id: "save", method: "POST", url: `${HOST}/api/drafts`, status: 0, type: "fetch", start: 980, duration: 120, requestHeaders: { "content-type": "application/json" } },
];

const SAVED: NetworkRequest = { ...REQUESTS[REQUESTS.length - 1], status: 201, size: 220, duration: 146, responseHeaders: JSON_HEADERS, body: { id: "draft-77", savedAt: "2026-11-03T09:14:33Z" } };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { NetworkLog } = ui;
  const [requests, setRequests] = useState(REQUESTS);
  const saved = requests.some((r) => r === SAVED);
  return (
    <div style={{ width: "100%", maxWidth: 680, display: "grid", gap: 8 }}>
      <NetworkLog description="staging.halden.example/grants/applications" requests={requests} defaultSelected="grants" />
      <div style={{ ...caption, textAlign: "center" }}>
        Narrow by type, or open a request for its headers and response.{" "}
        <button type="button" style={textButton} onClick={() => setRequests(saved ? REQUESTS : REQUESTS.map((r) => (r.id === "save" ? SAVED : r)))}>
          {saved ? "Fail the save again" : "Retry the draft save"}
        </button>
      </div>
    </div>
  );
}
