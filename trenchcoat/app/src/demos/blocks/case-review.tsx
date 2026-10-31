import type * as UI from "../../../../src/elements/react";
import { CASE_CATEGORIES, CASE_EVENTS, CASE_FACTS, CASE_READ } from "../case-data";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { CaseReview } = ui;
  return (
    <div style={{ width: "100%" }}>
      <CaseReview title="Case 4812: duplicate supplier payment" subject="Northwind Lab Supplies" severity="high" read={CASE_READ} facts={CASE_FACTS} events={CASE_EVENTS} categories={CASE_CATEGORIES} locale="en-GB" />
    </div>
  );
}
