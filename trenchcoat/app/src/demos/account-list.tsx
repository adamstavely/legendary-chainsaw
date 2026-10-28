import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { AccountRecord, AccountStat } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* The accounts linked to a fictional freight company in an anti-money-laundering review: its operating account,
   the director's personal account, an offshore-linked account under review and a holding company's account that
   has since closed. Identifiers stay masked until someone shows one; View reports which account to open. */

const ACCOUNTS: AccountRecord[] = [
  {
    id: "a1",
    institution: "Banque Rhône",
    branch: "Lyon",
    country: "France",
    type: "Business operating",
    number: "FR7630006000011234567890189",
    status: "flagged",
    amount: { value: 298000, label: "Flagged · 90 days" },
    note: "Three transfers to a newly registered holding company",
  },
  { id: "a2", institution: "Crédit Saône", branch: "Lyon", country: "France", type: "Personal current", number: "FR7614508000400556677881234", status: "monitored", amount: { value: 58000, label: "Flagged · 90 days" } },
  {
    id: "a3",
    institution: "Gulf Meridian Bank",
    branch: "Dubai",
    country: "UAE",
    type: "Offshore-linked",
    number: "AE070331234567890121180",
    status: "review",
    amount: { value: 120000, label: "Cash-in · 90 days", currency: "USD" },
  },
  { id: "a4", institution: "Limassol Trust", country: "Cyprus", type: "Holding company", number: "CY17002001280000001200527600", status: "closed", note: "Closed 2 May, after the last transfer" },
];

const STATS: AccountStat[] = [
  { id: "volume", label: "Flagged volume", value: "€428K", detail: "last 90 days" },
  { id: "linked", label: "Linked accounts", value: "4", detail: "across 3 countries" },
  { id: "shell", label: "Shell entities", value: "2", detail: "suspected" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AccountList } = ui;
  const [opened, setOpened] = useState<string | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 8 }}>
      <AccountList title="Linked accounts" description="Halden Freight SARL · AML review AR-2291" accounts={ACCOUNTS} stats={STATS} onOpen={(a) => setOpened(`${a.institution}, ${a.type}`)} />
      <div style={{ ...caption, textAlign: "center" }}>{opened ? `Opened ${opened}.` : "Show an identifier with the eye, or press View to open an account."}</div>
    </div>
  );
}
