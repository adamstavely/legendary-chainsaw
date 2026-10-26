import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { GeneratedUiActionDetail } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

// What an analytics assistant answered to “How did the spring campaign do?” – as the JSON it streams (a
// GeneratedUiSpec, plus one block type this app doesn't know)
const ANSWER = {
  blocks: [
    { type: "text", style: "heading", text: "Spring campaign, first two weeks" },
    { type: "text", text: "Sign-ups are well ahead of the last campaign, mostly from the referral offer. Paid search cost more per sign-up than planned." },
    {
      type: "group",
      layout: "row",
      children: [
        { type: "metric", label: "Sign-ups", value: "4,812", change: "Up 38% on winter", tone: "good" },
        { type: "metric", label: "Cost per sign-up", value: "$7.40", change: "Up $1.10", tone: "bad", direction: "up" },
        { type: "metric", label: "Trial to paid", value: "11.2%", change: "Flat", tone: "neutral" },
      ],
    },
    {
      type: "chart",
      title: "Daily sign-ups",
      value: "4,812",
      labels: ["Apr 1", "Apr 3", "Apr 5", "Apr 7", "Apr 9", "Apr 11", "Apr 13"],
      series: [
        { label: "Referral", values: [120, 180, 210, 260, 240, 300, 330] },
        { label: "Paid search", values: [90, 110, 105, 130, 120, 140, 135] },
      ],
      footer: "Compared with the first two weeks of the winter campaign",
    },
    {
      type: "table",
      title: "By channel",
      columns: [
        { key: "channel", label: "Channel" },
        { key: "signups", label: "Sign-ups", type: "number" },
        { key: "cost", label: "Cost per sign-up" },
        { key: "status", label: "Status", type: "tag" },
      ],
      rows: [
        { channel: "Referral", signups: 2140, cost: "$3.10", status: "On track" },
        { channel: "Paid search", signups: 1630, cost: "$12.80", status: "Over budget" },
        { channel: "Newsletter", signups: 712, cost: "$0.90", status: "On track" },
        { channel: "Partners", signups: 330, cost: "$9.20", status: "Watch" },
      ],
    },
    // A block this app doesn't support: drawn as its text
    { type: "map", title: "Sign-ups by region", note: "Most growth came from Lisbon and Porto." },
    {
      type: "callout",
      tone: "warning",
      title: "Paid search is 34% over its budget",
      text: "At this rate it runs out on April 22, eight days early.",
      actions: [
        { id: "cap-search", label: "Cap daily spend", primary: true },
        { id: "explain-search", label: "Why is it higher?" },
      ],
    },
    {
      type: "form",
      id: "schedule-report",
      title: "Send this as a weekly report",
      submitLabel: "Schedule",
      fields: [
        { name: "to", label: "Send to", kind: "email", required: true, placeholder: "name@company.com" },
        {
          name: "day",
          label: "Every",
          kind: "choice",
          required: true,
          value: "mon",
          options: [
            { value: "mon", label: "Monday", description: "Before the planning call" },
            { value: "fri", label: "Friday", description: "With the week's numbers" },
          ],
        },
        { name: "note", label: "Note for the team", kind: "textarea", placeholder: "Anything to add" },
      ],
    },
  ],
};

const TEXT = JSON.stringify(ANSWER, null, 1);
const CHUNK = 48;
const TICK_MS = 40;

export default function Demo({ ui }: { ui: typeof UI }) {
  const { GeneratedUi } = ui;
  const [run, setRun] = useState(0);
  const [shown, setShown] = useState(0);
  const [issues, setIssues] = useState(false);
  const [last, setLast] = useState<GeneratedUiActionDetail | null>(null);

  // The assistant streams its answer, then stops
  useEffect(() => {
    setShown(0);
    setLast(null);
    const t = setInterval(() => {
      setShown((n) => {
        const next = Math.min(TEXT.length, n + CHUNK);
        if (next >= TEXT.length) clearInterval(t);
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(t);
  }, [run]);

  const streaming = shown < TEXT.length;
  const said = last ? (last.kind === "submit" ? `Submitted “${last.action}”: ${JSON.stringify(last.values)}` : `Pressed “${last.action}”`) : "";
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 12 }}>
      <GeneratedUi spec={TEXT.slice(0, shown)} streaming={streaming} showIssues={issues} onAction={setLast} />
      <div style={{ ...caption, textAlign: "center" }}>
        {streaming ? "Writing the answer… " : said ? `${said}. ` : "Press an action or schedule the report. "}
        {!streaming && (
          <>
            <button type="button" style={textButton} onClick={() => setIssues((v) => !v)}>
              {issues ? "Hide issues" : "Show issues"}
            </button>
            {" · "}
            <button type="button" style={textButton} onClick={() => setRun((r) => r + 1)}>
              Answer again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
