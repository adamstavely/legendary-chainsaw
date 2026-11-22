import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { WebhookDelivery, WebhookEndpoint, WebhookEndpointCreate } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The webhook endpoints of a fictional case-review app, "Ledgerline", sending to made-up addresses at
   hooks.example.com. Retry and Send test event add a delivery that succeeds, so the health line moves. */

const NOW = Date.UTC(2026, 10, 20, 14, 2);
const MIN = 60_000;
const EVENT_TYPES = [
  { id: "case.created", label: "case.created", description: "A case is opened" },
  { id: "case.assigned", label: "case.assigned", description: "A case gets an owner" },
  { id: "case.closed", label: "case.closed", description: "A case is closed with an outcome" },
  { id: "report.ready", label: "report.ready", description: "A report finishes building" },
];

/** Deterministic deliveries: every n-th one fails, newest first */
function deliveries(prefix: string, count: number, every: number, events: string[]): WebhookDelivery[] {
  return Array.from({ length: count }, (_, i) => {
    const ok = (i + 1) % every !== 0;
    return { id: `${prefix}-${i}`, at: NOW - (i * 29 + 3) * MIN, event: events[i % events.length]!, status: ok ? 200 : i % 2 ? 503 : null, ok, durationMs: ok ? 80 + ((i * 37) % 260) : 10_000, attempt: ok ? 1 : 3 };
  });
}

const ENDPOINTS: WebhookEndpoint[] = [
  {
    id: "e1",
    url: "https://hooks.example.com/ledgerline/case-sync",
    description: "Keeps the reporting warehouse in step",
    events: ["case.created", "case.assigned", "case.closed"],
    enabled: true,
    secret: "whsec_test_4f1c9a07b2e8d3615c0a",
    deliveries: [{ id: "e1-p", at: NOW - 2 * MIN, event: "case.assigned", status: 502, ok: false, durationMs: 1240, attempt: 2, nextRetryAt: NOW + 3 * MIN }, ...deliveries("e1", 47, 16, ["case.created", "case.assigned", "case.closed"])],
  },
  { id: "e2", url: "https://hooks.example.com/ledgerline/reports", description: "Posts finished reports to the team channel", events: ["report.ready"], enabled: true, deliveries: deliveries("e2", 12, 99, ["report.ready"]) },
  { id: "e3", url: "https://hooks.example.com/ledgerline/legacy", events: ["case.closed"], enabled: false, deliveries: [] },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Webhooks } = ui;
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>(ENDPOINTS);
  const [n, setN] = useState(0);
  const deliver = (id: string, event: string) => {
    setN((x) => x + 1);
    setEndpoints((all) => all.map((e) => (e.id === id ? { ...e, deliveries: [{ id: `${id}-t${n}`, at: NOW, event, status: 200, ok: true, durationMs: 140, attempt: 1 }, ...(e.deliveries ?? [])] } : e)));
  };
  const create = (d: WebhookEndpointCreate) => {
    setN((x) => x + 1);
    setEndpoints((all) => [...all, { id: `new-${n}`, url: d.url, description: d.description || undefined, events: d.events, enabled: true, deliveries: [] }]);
  };
  return (
    <div style={{ width: "100%", maxWidth: 680, display: "grid", gap: 8 }}>
      <Webhooks
        description="Ledgerline · Fraud review workspace"
        endpoints={endpoints}
        onEndpointsChange={setEndpoints}
        eventTypes={EVENT_TYPES}
        onEndpointCreate={create}
        onEndpointTest={(id) => deliver(id, endpoints.find((e) => e.id === id)?.events[0] ?? "case.created")}
        onDeliveryRetry={({ endpointId, deliveryId }) =>
          setEndpoints((all) => all.map((e) => (e.id === endpointId ? { ...e, deliveries: e.deliveries?.map((d) => (d.id === deliveryId ? { ...d, ok: true, status: 200, durationMs: 160, attempt: (d.attempt ?? 1) + 1, nextRetryAt: undefined } : d)) } : e)))
        }
        now={NOW}
        locale="en-GB"
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Open an endpoint's health line for its deliveries; Retry a failed one.{" "}
        <button type="button" style={textButton} onClick={() => setEndpoints(ENDPOINTS)}>
          Reset
        </button>
      </div>
    </div>
  );
}
