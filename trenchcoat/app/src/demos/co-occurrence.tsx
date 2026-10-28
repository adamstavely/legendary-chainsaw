import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { CoEntity, CoSource } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fraud team looking at one merchant account: which accounts, cards and devices keep turning up in the same
   logins, payments and shipments over 120 days. "Add this week's data" brings in a new device that's always there. */

const DAY = 86_400_000;
const NOW = new Date(2026, 9, 27, 12).getTime();

const SOURCES: CoSource[] = [
  { id: "login", label: "Logins" },
  { id: "pay", label: "Payments" },
  { id: "ship", label: "Shipments" },
  { id: "device", label: "Devices" },
];

const START: CoEntity[] = [
  {
    id: "dana",
    name: "Dana Okafor",
    detail: "ACC-4471-K",
    score: 92,
    together: 14,
    bySource: { login: 9, pay: 14, ship: 6, device: 4 },
    lastSeen: NOW - 2 * DAY,
    events: [
      { source: "login", label: "Same IP range, 02:14", at: NOW - 2 * DAY },
      { source: "login", label: "Same IP range, 23:51", at: NOW - 9 * DAY },
      { source: "pay", label: "Split payment, £4,800 + £4,750", at: NOW - 3 * DAY },
      { source: "pay", label: "Refund to the same card", at: NOW - 12 * DAY },
      { source: "ship", label: "Same drop address, Leeds", at: NOW - 5 * DAY },
      { source: "device", label: "Shared browser fingerprint", at: NOW - 2 * DAY },
    ],
  },
  {
    id: "card",
    name: "Card ending 0092",
    detail: "Prepaid · issued in CH",
    score: 74,
    together: 10,
    bySource: { pay: 11, login: 4 },
    lastSeen: NOW - 6 * DAY,
    events: [
      { source: "pay", label: "Top-up within 10 minutes of a payout", at: NOW - 6 * DAY },
      { source: "login", label: "Used right after a password reset", at: NOW - 20 * DAY },
    ],
  },
  { id: "rafa", name: "Rafael Reyes", detail: "ACC-1144-R", score: 61, together: 8, bySource: { ship: 8, pay: 3, login: 7 }, lastSeen: NOW - 25 * DAY },
  { id: "yusuf", name: "Yusuf Demir", detail: "ACC-3372-D", score: 44, together: 5, bySource: { login: 5, pay: 2, ship: 1, device: 3 }, lastSeen: NOW - 27 * DAY },
  { id: "claire", name: "Claire Beaumont", detail: "ACC-5560-B", score: 38, together: 6, bySource: { login: 9, ship: 2, device: 1 }, lastSeen: NOW - 19 * DAY },
];
const NEW_DEVICE: CoEntity = {
  id: "device",
  name: "Device fp-71c2",
  detail: "Android · emulator suspected",
  score: 88,
  together: 15,
  bySource: { login: 15, device: 15 },
  lastSeen: NOW - DAY,
  events: [{ source: "device", label: "Present at every login this week", at: NOW - DAY }],
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { CoOccurrence } = ui;
  const [entities, setEntities] = useState(START);
  const [selected, setSelected] = useState<string | null>("dana");
  const added = entities.includes(NEW_DEVICE);
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <CoOccurrence
        title="Seen together with ACC-2291"
        description="Accounts, cards and devices in the same events as this merchant account."
        window="120-day window"
        sources={SOURCES}
        entities={entities}
        events={17}
        selected={selected}
        onSelectedChange={setSelected}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {added ? "A new device is in almost every event. " : "Open a row to see the shared events, or change the sort. "}
        <button type="button" style={textButton} onClick={() => setEntities(added ? START : [...START, NEW_DEVICE])}>
          {added ? "Reset" : "Add this week's data"}
        </button>
      </div>
    </div>
  );
}
