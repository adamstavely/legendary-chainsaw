"use client";

import { RedTeamFinding as Base, type Finding, type FindingEvidence, type FindingSeverity, type FindingStatus, type RedTeamFindingProps as BaseProps } from "trenchcoat/react";

/*
 * Red-team Finding – what an adversarial test broke, and what was done about it. A list of findings on the left (on
 * top when narrow); the picked one on the right: its severity, status and summary, the invariants it failed, the
 * scenario that found it and the evidence it left, and the response as the library's Agent Ledger with undo. It is the
 * <tc-red-team-finding> element through `trenchcoat/react` (install `trenchcoat` instead of copying files); every
 * framework gets the same element. The look follows the nearest <LookProvider>, or the `look` prop.
 *
 * Keyboard: the findings are a listbox – ↑ ↓ Home End move and pick (the detail follows), Tab moves on to the detail.
 */

export type { Finding, FindingEvidence, FindingSeverity, FindingStatus };
export type RedTeamFindingProps = BaseProps;

export function RedTeamFinding(props: RedTeamFindingProps) {
  return <Base {...props} />;
}
