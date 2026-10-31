"use client";

/*
 * Case File – one case as a full app page: the Case Review block, with Donovan's read beside the evidence, and the case's
 * main file with its flag and entitlement-checked sharing below. Sample data; replace it with your own.
 * className, other DOM props and `ref` go to the App Shell's root.
 * Imports: App Shell (app-shell.tsx) from Trenchcoat screens; Case Review and File Details from `trenchcoat/react`.
 */

import { type ComponentPropsWithoutRef, type Ref } from "react";
import { CaseReview, FileDetails, type CaseDecision, type CaseRead, type FactSection, type ShareEntitlementCheck, type ShareRecipient, type TeamFlag, type TimelineCategory, type TimelineEvent } from "trenchcoat/react";
import { AppShell, type AppShellProps } from "@/components/ui/app-shell";

const at = (day: number, hour: number) => Date.UTC(2026, 9, day, hour);

const READ: CaseRead = {
  summary: "Two payments of the same amount went to one supplier three days apart, the second to a bank account added the day before.",
  points: ["Both reference invoice 88213", "The new account was added by a single approver", "The supplier hasn't confirmed the change"],
  suggestion: "escalate",
  confidence: "Moderately confident",
};
const FACTS: FactSection[] = [
  {
    id: "payment",
    title: "Payments",
    facts: [
      { id: "amount", label: "Amount, each", value: "$48,200", source: { label: "Ledger", grade: "A1" } },
      { id: "invoice", label: "Invoice", value: "88213", source: { label: "Accounts payable", grade: "A2" } },
      { id: "account", label: "Receiving account", value: "•••• 4471", source: { label: "Bank file", grade: "B2" }, alternatives: [{ value: "•••• 9023", source: { label: "Supplier record", grade: "B3" } }] },
    ],
  },
];
const CATEGORIES: TimelineCategory[] = [
  { id: "payment", label: "Payment", tone: "info" },
  { id: "change", label: "Change", tone: "warning" },
];
const EVENTS: TimelineEvent[] = [
  { id: "e3", date: at(29, 10), title: "Second payment sent", detail: "$48,200 to •••• 4471", category: "payment", flag: "Auto-flag" },
  { id: "e2", date: at(28, 16), title: "Bank account added", detail: "One approver, outside normal hours", category: "change" },
  { id: "e1", date: at(26, 9), title: "First payment sent", detail: "$48,200 to •••• 9023", category: "payment" },
];
const FLAGS: TeamFlag[] = [
  { id: "review", label: "Needs review", meaning: "A second reader should check this before it's relied on.", color: "#CA8A04" },
  { id: "hold", label: "Legal hold", meaning: "Don't change or delete it.", color: "#DC2626" },
];
const DIRECTORY: ShareRecipient[] = [
  { id: "maya", kind: "person", name: "Maya Lindqvist", detail: "Senior reviewer" },
  { id: "ops", kind: "group", name: "Payment operations", detail: "8 members" },
  { id: "intern", kind: "person", name: "Jo Tanaka", detail: "Contractor" },
];
const check: ShareEntitlementCheck = async (recipient) => {
  if (recipient.id === "intern") return { status: "denied", reason: "Contractors can't see case files." };
  if (recipient.id === "ops") return { status: "partial", allowed: 6, total: 8, reason: "2 members aren't cleared for fraud cases." };
  return { status: "allowed" };
};

type CaseFileOwnProps = Pick<AppShellProps, "onNavigate" | "workspace" | "user"> & {
  /** The decision on record – controlled when given */
  decision?: CaseDecision | null;
  /** A decision was recorded */
  onDecisionChange?: (decision: CaseDecision | null) => void;
};

/** `className`, other DOM props and `ref` go to the App Shell's root */
export type CaseFileScreenProps = Omit<ComponentPropsWithoutRef<"div">, keyof CaseFileOwnProps | "children"> & CaseFileOwnProps & { ref?: Ref<HTMLDivElement> };

export function CaseFileScreen({ decision, onDecisionChange, onNavigate, workspace, user, ref, ...rest }: CaseFileScreenProps) {
  return (
    <AppShell {...rest} ref={ref} active="Files" onNavigate={onNavigate} workspace={workspace} user={user}>
      <div className="ui-as-page" style={{ display: "grid", gap: "var(--tc-space-6, 24px)" }}>
        <CaseReview
          title="Case 4812: duplicate supplier payment"
          subject="Northwind Lab Supplies"
          severity="high"
          read={READ}
          assistantName="Donovan"
          assistantFace
          facts={FACTS}
          events={EVENTS}
          categories={CATEGORIES}
          decision={decision}
          onDecisionChange={onDecisionChange}
        />
        <FileDetails file={{ name: "Payment run 10-29.pdf", size: 412000, owner: "Payment operations", modified: at(29, 11) }} flags={FLAGS} defaultFlag="review" directory={DIRECTORY} checkEntitlement={check} />
      </div>
    </AppShell>
  );
}
