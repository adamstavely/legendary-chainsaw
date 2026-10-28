import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { TimelineCategory, TimelineEvent } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A fictional fraud review of a business account: account changes, payments, sign-ins and documents, each with where
   it came from and how far to trust it. Pick a category to filter; open an event for its note and attachments. */

const CATEGORIES: TimelineCategory[] = [
  { id: "account", label: "Account", tone: "info" },
  { id: "payment", label: "Payment", tone: "warning" },
  { id: "access", label: "Sign-in", tone: "violet" },
  { id: "document", label: "Document", tone: "success" },
];

const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12).getTime();

const EVENTS: TimelineEvent[] = [
  {
    id: "e1",
    date: at(2026, 6, 9),
    title: "Payee details changed from a new device",
    detail: "Beneficiary account switched an hour before a scheduled payment run.",
    category: "access",
    source: { label: "Device intelligence", grade: "B2" },
    flag: "Auto-flag",
    body: "The change was made from a browser never seen on this account, after a password reset requested from the same device.",
    links: [{ label: "Session log SL-4471", href: "#session" }, { label: "Device fingerprint", href: "#device" }],
  },
  { id: "e2", date: at(2026, 6, 4), title: "Payment of €48,000 held", detail: "Held for review – first payment to the new beneficiary.", category: "payment", source: { label: "Payments engine", grade: "A1" } },
  {
    id: "e3",
    date: at(2026, 5, 31),
    title: "Director confirmed the change by phone",
    detail: "Callback to the number on file; the director says the change was expected.",
    category: "account",
    source: { label: "Call centre note", grade: "C3" },
    body: "Caller passed two of three security questions. Recommend written confirmation before releasing the held payment.",
  },
  { id: "e4", date: at(2026, 5, 15), title: "Wire of €240,000 to a new overseas account", detail: "Largest payment on the account in two years.", category: "payment", source: { label: "Payments engine", grade: "A2" }, flag: "Rule 14" },
  { id: "e5", date: at(2026, 4, 30), title: "Proof of address uploaded", detail: "Utility bill, March 2026.", category: "document", source: { label: "Document check", grade: "B1" }, links: [{ label: "DOC-2288.pdf", href: "#doc" }] },
  { id: "e6", date: at(2026, 2, 2), title: "Account opened", detail: "Opened online with a business registration from 2019.", category: "account", source: { label: "Core banking", grade: "A1" } },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { EntityTimeline } = ui;
  const [open, setOpen] = useState<string | null>("e1");
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 8 }}>
      <EntityTimeline title="Account timeline" description="Northwind Traders Ltd · fraud review FR-2291" events={EVENTS} categories={CATEGORIES} selected={open} onSelectedChange={setOpen} />
      <div style={{ ...caption, textAlign: "center" }}>Pick a category to filter, or open an event with Enter or a click.</div>
    </div>
  );
}
