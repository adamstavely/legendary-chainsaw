import { createComponent, type EventName } from "@lit/react";
import * as React from "react";
import { TcRedTeamFinding, type Finding as ElementFinding, type FindingChange, type FindingEvidence, type FindingEvidenceOpen, type FindingRerun } from "../red-team-finding";
import type { LedgerEntry as ElementEntry } from "../agent-ledger";
import { h, isNode, useStaged } from "./internal";

export { defaultFindingStatusLabels, defaultSeverityLabels } from "../red-team-finding";
export type { FindingEvidence, FindingSeverity, FindingStatus } from "../red-team-finding";

const RawRedTeamFinding = createComponent({
  tagName: "tc-red-team-finding",
  elementClass: TcRedTeamFinding,
  react: React,
  events: {
    onTcFindingChange: "tc-finding-change" as EventName<CustomEvent<FindingChange>>,
    onTcEvidenceOpen: "tc-evidence-open" as EventName<CustomEvent<FindingEvidenceOpen>>,
    onTcRerun: "tc-rerun" as EventName<CustomEvent<FindingRerun>>,
  },
});
type RawProps = React.ComponentProps<typeof RawRedTeamFinding>;

/** A response; its icon may be an element or a React node */
export type FindingResponse = Omit<ElementEntry, "icon"> & { icon?: Element | React.ReactNode };
/** A finding; its responses' icons may be React nodes */
export type Finding = Omit<ElementFinding, "responses"> & { responses?: FindingResponse[] };

export type RedTeamFindingOwnProps = {
  /** The findings in the list, newest first */
  findings: Finding[];
  /** Id of the finding on show (controlled) */
  finding?: string;
  /** The finding on show at first – the first one by default */
  defaultFinding?: string;
  /** Called with the id of the finding picked in the list */
  onFindingChange?: (id: string) => void;
  /** Undo in the ledger; may return a promise (see AgentLedger) */
  onUndo?: (ids: string[], finding: Finding) => void | Promise<unknown>;
  /** Redo in the ledger; may return a promise */
  onRedo?: (ids: string[], finding: Finding) => void | Promise<unknown>;
  /** An evidence row was opened; without it the rows are plain text */
  onOpenEvidence?: (evidence: FindingEvidence, finding: Finding) => void;
  /** Shows "Run again" in the detail */
  onRerun?: (finding: Finding) => void;
  /** The list's heading – "Findings" by default */
  title?: string;
};
export type RedTeamFindingProps = Omit<RawProps, keyof RedTeamFindingOwnProps | "heading" | "openEvidence" | "rerun" | "onTcFindingChange" | "onTcEvidenceOpen" | "onTcRerun" | "children"> & RedTeamFindingOwnProps;

export function RedTeamFinding({ findings, finding, defaultFinding, onFindingChange, onUndo, onRedo, onOpenEvidence, onRerun, title, ...props }: RedTeamFindingProps) {
  const controlled = finding !== undefined;
  const [own, setOwn] = React.useState(defaultFinding ?? findings[0]?.id);
  const nodes: [string, React.ReactNode][] = [];
  findings.forEach((f) => f.responses?.forEach((r) => isNode(r.icon) && nodes.push([`${f.id}:${r.id}`, r.icon as React.ReactNode])));
  const { stage, els } = useStaged(nodes);
  const list = React.useMemo(
    () => findings.map((f) => ({ ...f, responses: f.responses?.map((r) => ({ ...r, icon: isNode(r.icon) ? els[`${f.id}:${r.id}`] : (r.icon as Element | undefined) })) as ElementEntry[] | undefined })) as ElementFinding[],
    [findings, els],
  );
  const original = (f: ElementFinding) => findings.find((x) => x.id === f.id) ?? (f as Finding);
  return h(
    React.Fragment,
    null,
    stage,
    h(RawRedTeamFinding, {
      ...props,
      heading: title ?? "Findings",
      findings: list,
      finding: controlled ? finding : own,
      openEvidence: !!onOpenEvidence,
      rerun: !!onRerun,
      onUndo: onUndo ? (ids: string[], f: ElementFinding) => onUndo(ids, original(f)) : undefined,
      onRedo: onRedo ? (ids: string[], f: ElementFinding) => onRedo(ids, original(f)) : undefined,
      onTcFindingChange: (e: CustomEvent<FindingChange>) => {
        if (controlled) e.preventDefault();
        else setOwn(e.detail.finding);
        onFindingChange?.(e.detail.finding);
      },
      onTcEvidenceOpen: (e: CustomEvent<FindingEvidenceOpen>) => onOpenEvidence?.(e.detail.evidence, original(e.detail.finding)),
      onTcRerun: (e: CustomEvent<FindingRerun>) => onRerun?.(original(e.detail.finding)),
    }),
  );
}
