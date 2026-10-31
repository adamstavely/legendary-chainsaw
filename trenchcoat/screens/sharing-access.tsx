"use client";

/*
 * Sharing & Access – an admin page for what a team shares and who can reach it: its flags, its access reviews and the
 * record of what happened, under three tabs. Sample data; replace it with your own.
 * className, other DOM props and `ref` go to the App Shell's root.
 * Imports: App Shell (app-shell.tsx) from Trenchcoat screens; Team Flag Editor, Access Review and Audit Trail from
 * `trenchcoat/react`.
 */

import { useState, type ComponentPropsWithoutRef, type Ref } from "react";
import { AccessReview, AuditTrail, TeamFlagEditor, type AccessReviewItem, type AuditEvent, type TeamFlag } from "trenchcoat/react";
import { AppShell, Tabs, type AppShellProps } from "@/components/ui/app-shell";

export type SharingAccessTab = "flags" | "review" | "audit";

const TABS: Record<SharingAccessTab, string> = { flags: "Team flags", review: "Access review", audit: "Audit trail" };
const tabIds = Object.keys(TABS) as SharingAccessTab[];
const FLAGS: TeamFlag[] = [
  { id: "review", label: "Needs review", meaning: "A second reader should check this before it's relied on.", color: "#CA8A04" },
  { id: "hold", label: "Legal hold", meaning: "Don't change or delete it. Counsel has asked us to keep it as it is.", color: "#DC2626" },
  { id: "final", label: "Final", meaning: "Signed off, and the version to cite.", color: "#16A34A" },
];
const DAY = 86_400_000;
const NOW = Date.UTC(2026, 9, 31);
const ITEMS: AccessReviewItem[] = [
  { id: "a", name: "Noor Haddad", resource: "Trial 12 results", level: "Can edit", status: "authorized", lastUsed: NOW - 2 * DAY },
  { id: "b", name: "Inês Costa", resource: "Trial 12 results", level: "Can view", status: "unauthorized", reason: "The Restricted data agreement ended in August.", lastUsed: NOW - 70 * DAY },
  { id: "c", name: "Biostatistics", kind: "group", resource: "Trial 12 raw data", level: "Can view", status: "authorized", lastUsed: NOW - 9 * DAY },
];
const EVENTS: AuditEvent[] = [
  { id: "1", at: NOW + 14 * 3_600_000, actor: "Noor Haddad", action: "shared", target: "Trial 12 results with Biostatistics", detail: "9 of 12 members can see it; 3 haven't completed data training." },
  { id: "2", at: NOW + 13 * 3_600_000, actor: "Noor Haddad", action: "tried to share", target: "Trial 12 results with Inês Costa", outcome: "denied", detail: "Not authorized: needs the Restricted data agreement." },
  { id: "3", at: NOW - 7 * 3_600_000, actor: "Tomás Rivera", action: "flagged", target: "Vendor contract 2041 as Legal hold" },
];

type SharingAccessOwnProps = Pick<AppShellProps, "onNavigate" | "workspace" | "user"> & {
  /** Open tab – controlled; use `defaultTab` for a starting tab */
  tab?: SharingAccessTab;
  /** Tab that is open first when `tab` isn't controlled */
  defaultTab?: SharingAccessTab;
  /** Called when another tab is picked */
  onTabChange?: (tab: SharingAccessTab) => void;
};

/** `className`, other DOM props and `ref` go to the App Shell's root */
export type SharingAccessScreenProps = Omit<ComponentPropsWithoutRef<"div">, keyof SharingAccessOwnProps | "children"> & SharingAccessOwnProps & { ref?: Ref<HTMLDivElement> };

export function SharingAccessScreen({ tab: tabProp, defaultTab = "flags", onTabChange, onNavigate, workspace, user, ref, ...rest }: SharingAccessScreenProps) {
  const [own, setOwn] = useState<SharingAccessTab>(defaultTab);
  const tab = tabProp ?? own;
  const pick = (label: string) => {
    const next = tabIds.find((id) => TABS[id] === label) ?? "flags";
    if (tabProp === undefined) setOwn(next);
    onTabChange?.(next);
  };
  return (
    <AppShell {...rest} ref={ref} active="Settings" onNavigate={onNavigate} workspace={workspace} user={user}>
      <div className="ui-as-page">
        <h1 className="ui-as-page-title">Sharing &amp; access</h1>
        <p className="ui-as-page-sub">What your team marks, who can reach it, and what's happened.</p>
        <div className="ui-as-toolbar">
          <Tabs items={Object.values(TABS)} value={TABS[tab]} onChange={pick} label="Sharing and access" />
        </div>
        {tab === "flags" && <TeamFlagEditor defaultFlags={FLAGS} usage={{ review: 12, hold: 3, final: 48 }} description="What each flag means on your team's files" />}
        {tab === "review" && <AccessReview title="Q4 access review" description="Restricted trial data, due November 14" items={ITEMS} />}
        {tab === "audit" && <AuditTrail description="Restricted trial data" events={EVENTS} />}
      </div>
    </AppShell>
  );
}
