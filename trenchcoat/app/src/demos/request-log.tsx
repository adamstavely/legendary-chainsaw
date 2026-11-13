import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ProviderRequest } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The model requests behind a research institute's invoice matcher and Policy Q&A agents, on a generic provider. */

const T = Date.UTC(2026, 10, 3, 9, 14, 0);
const HEADERS = { "content-type": "application/json", authorization: "Bearer sk-live-7f3a9c", "x-request-id": "req_51c0" };
const OK = { "content-type": "application/json", "x-ratelimit-remaining": "412" };
const REQUESTS: ProviderRequest[] = [
  {
    id: "q1",
    at: T,
    provider: "Provider",
    model: "large-1",
    endpoint: "/v1/messages",
    status: 200,
    latency: 2_840,
    inputTokens: 8_120,
    outputTokens: 610,
    cost: 0.0532,
    cacheHit: true,
    requestHeaders: HEADERS,
    responseHeaders: OK,
    requestBody: { model: "large-1", max_tokens: 1024, messages: [{ role: "user", content: "Match invoice INV-20431 to its purchase order." }] },
    responseBody: { id: "msg_7781", stop_reason: "end_turn", content: [{ type: "text", text: "Matched to PO-2026-0412: 3 of 3 lines agree." }], usage: { input_tokens: 8120, output_tokens: 610 } },
  },
  { id: "q2", at: T + 3_100, provider: "Provider", model: "small-2", endpoint: "/v1/messages", status: 200, latency: 640, inputTokens: 1_480, outputTokens: 92, cost: 0.0009, cacheHit: false, requestHeaders: HEADERS, responseHeaders: OK, requestBody: { model: "small-2", messages: [{ role: "user", content: "Classify: travel or subsistence?" }] }, responseBody: { content: [{ type: "text", text: "travel" }] } },
  {
    id: "q3",
    at: T + 4_000,
    provider: "Provider",
    model: "large-1",
    endpoint: "/v1/messages",
    status: 429,
    latency: 180,
    requestHeaders: HEADERS,
    responseHeaders: { "content-type": "application/json", "retry-after": "12" },
    requestBody: { model: "large-1", messages: [{ role: "user", content: "Summarise the travel policy changes." }] },
    responseBody: { error: { type: "rate_limit_error", message: "Too many requests. Try again in 12 seconds." } },
  },
  { id: "q4", at: T + 16_500, provider: "Provider", model: "large-1", endpoint: "/v1/messages", status: 200, latency: 3_920, inputTokens: 9_870, outputTokens: 1_140, cost: 0.0741, cacheHit: true, requestHeaders: HEADERS, responseHeaders: OK, requestBody: { model: "large-1", messages: [{ role: "user", content: "Summarise the travel policy changes." }] }, responseBody: { content: [{ type: "text", text: "Three changes since March…" }] } },
  { id: "q5", at: T + 21_000, provider: "Provider", model: "embed-1", endpoint: "/v1/embeddings", status: 200, latency: 210, inputTokens: 2_300, outputTokens: 0, cost: 0.0002, requestHeaders: HEADERS, responseHeaders: OK, requestBody: { model: "embed-1", input: ["Per diem rates for Lisbon"] }, responseBody: "[1536 numbers]" },
  { id: "q6", at: T + 24_200, provider: "Provider", model: "large-1", endpoint: "/v1/messages", status: 503, latency: 30_000, requestHeaders: HEADERS, responseHeaders: { "content-type": "text/plain" }, requestBody: { model: "large-1", messages: [{ role: "user", content: "Match invoice INV-20437." }] }, responseBody: "upstream timed out" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RequestLog } = ui;
  const [only, setOnly] = useState(false);
  return (
    <div style={{ width: "100%", maxWidth: 860, display: "grid", gap: 8 }}>
      <RequestLog description="Halden Research Institute · production" baseUrl="https://api.provider.example" requests={REQUESTS} defaultSelected="q3" classes={only ? ["4xx", "5xx", "rate-limited"] : undefined} onCopyCurl={() => false} />
      <div style={{ ...caption, textAlign: "center" }}>
        Open a request for its bodies and headers – the API key is masked, in cURL too.{" "}
        <button type="button" style={textButton} onClick={() => setOnly(!only)}>
          {only ? "Show every request" : "Show only errors"}
        </button>
      </div>
    </div>
  );
}
