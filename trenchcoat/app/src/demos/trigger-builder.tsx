import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { TriggerEvent, TriggerField, TriggerValue } from "../../../src/elements/react";
import { buttonSm, caption } from "../demo-kit";

const icon = (d: string) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const Deal = () => icon("M2.5 5.5h11v7.75h-11zM5.75 5.5V3.75h4.5V5.5M2.5 8.75h11");
const Form = () => icon("M4 1.75h5l3 3v9.5H4zM9 1.75v3h3M6 8.5h4M6 11h2.5");
const Ticket = () => icon("M2 5.25a1.5 1.5 0 0 0 0 3v3.5h12v-3.5a1.5 1.5 0 0 1 0-3V4.25H2zM9.5 4.25v7.5");
const Invoice = () => icon("M3.5 1.75h9v12.5l-2-1.25-2.5 1.25L5.5 13l-2 1.25zM6 5.5h4M6 8h4");

const STAGES = ["Lead", "Qualified", "Proposal", "Won", "Lost"];

const EVENTS: TriggerEvent[] = [
  {
    id: "deal.stage",
    label: "Deal changes stage",
    phrase: "a deal changes stage",
    group: "Deals",
    hint: "CRM",
    icon: <Deal />,
    fields: [
      { id: "stage", label: "Stage", type: "select", options: STAGES },
      { id: "amount", label: "Amount", type: "number" },
      { id: "owner", label: "Owner", type: "text" },
    ],
  },
  { id: "deal.created", label: "Deal is created", phrase: "a deal is created", group: "Deals", hint: "CRM", icon: <Deal />, fields: [{ id: "amount", label: "Amount", type: "number" }, { id: "source", label: "Source", type: "select", options: ["Website", "Referral", "Outbound", "Event"] }] },
  {
    id: "form.submitted",
    label: "Form is submitted",
    phrase: "someone submits a form",
    group: "Website",
    icon: <Form />,
    fields: [
      { id: "form", label: "Form", type: "select", options: ["Demo request", "Contact sales", "Newsletter"] },
      { id: "country", label: "Country", type: "text" },
    ],
  },
  {
    id: "ticket.opened",
    label: "Ticket is opened",
    phrase: "a support ticket is opened",
    group: "Support",
    icon: <Ticket />,
    fields: [
      { id: "priority", label: "Priority", type: "select", options: ["Low", "Normal", "High", "Urgent"] },
      { id: "channel", label: "Channel", type: "select", options: ["Email", "Chat", "Phone"] },
    ],
  },
  { id: "invoice.overdue", label: "Invoice becomes overdue", phrase: "an invoice becomes overdue", group: "Billing", hint: "Stripe", icon: <Invoice />, fields: [{ id: "amount", label: "Amount", type: "number" }, { id: "days", label: "Days overdue", type: "number" }] },
];

/** What a scheduled run can check first */
const SCHEDULE_FIELDS: TriggerField[] = [
  { id: "open_deals", label: "Open deals", type: "number" },
  { id: "pipeline", label: "Pipeline", type: "select", options: ["New business", "Renewals", "Expansion"] },
];

const EXAMPLES: { label: string; value: TriggerValue }[] = [
  { label: "Every Monday at 9", value: { kind: "schedule", schedule: { frequency: "weekly", days: [1], time: "09:00" }, active: null, conditions: [], match: "all" } },
  {
    label: "When a big deal is won",
    value: {
      kind: "event",
      event: "deal.stage",
      conditions: [
        { field: "stage", operator: "is", value: "Won" },
        { field: "amount", operator: "gt", value: "10000" },
      ],
      match: "all",
    },
  },
  {
    label: "Month-end in Q4",
    value: { kind: "schedule", schedule: { frequency: "monthly", dayOfMonth: 31, time: "17:30" }, active: { start: "2026-10-01", end: "2026-12-31" }, conditions: [{ field: "open_deals", operator: "gt", value: "0" }], match: "all" },
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { TriggerBuilder } = ui;
  const [value, setValue] = useState<TriggerValue>(EXAMPLES[0].value);
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 12 }}>
      <TriggerBuilder title="Run this automation" events={EVENTS} scheduleFields={SCHEDULE_FIELDS} value={value} onChange={setValue} name="trigger" />
      <div style={{ ...caption, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        {EXAMPLES.map((x) => (
          <button key={x.label} type="button" style={buttonSm} onClick={() => setValue(x.value)}>
            {x.label}
          </button>
        ))}
      </div>
    </div>
  );
}
