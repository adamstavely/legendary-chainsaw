import type * as UI from "../../../../src/elements/react";

/* Every full-page and empty state, each at a moment in a fictional case-review app with the note a page would put
   beside it. nothing-found, something-wrong and no-access have no words of their own; the note says it instead. */

const NOTES = [
  ["nothing-found", "Nothing matches “card testing 2019”. Try other words, or clear the filters."],
  ["first-use", "Open your first case, or import cases from a spreadsheet."],
  ["offline", "Your changes are saved on this device and will sync when you're back online."],
  ["something-wrong", "The case list couldn't load. Retry, or check the status page."],
  ["not-found", "This page may have moved. Go to the case list."],
  ["link-expired", "Ask Noor Haddad for a new link to this case."],
  ["no-access", "You need the Fraud review role to see this case."],
  ["access-requested", "Noor Haddad will be asked; you'll get an email when they decide."],
  ["session-expired", "You were signed out after 30 minutes away. Sign in again to carry on."],
  ["limit-reached", "The workspace has used this month's 1,000 AI summaries. They reset on the 1st."],
  ["maintenance", "Case review is being upgraded. It'll be back by 02:00 UTC."],
  ["coming-soon", "Bulk reassignment arrives next month."],
  ["region-unavailable", "Case review isn't offered in this country yet."],
  ["ai-unavailable", "AI summaries are paused. Search, filters and case notes still work."],
] as const;

export default function Demo({ ui }: { ui: typeof UI }) {
  const { PageState } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 900, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, textAlign: "center", fontSize: 13, color: "var(--tc-text-secondary)" }}>
      {NOTES.map(([status, note]) => (
        <div key={status}>
          <PageState status={status} />
          <p style={{ margin: "4px 0 0" }}>{note}</p>
        </div>
      ))}
    </div>
  );
}
