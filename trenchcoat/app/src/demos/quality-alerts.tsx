import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { QualityAlertRule } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's alerts on its Policy Q&A agent's quality. Change any part of a sentence; the preview of how
   often a rule would have fired is worked out again (here, a simple stand-in for the page's own query). */

const CHANNELS = [
  { id: "ops", label: "#ops-quality" },
  { id: "policy", label: "#policy-team" },
  { id: "email", label: "quality@institute.example" },
];
const METRICS = [
  { id: "correctness", label: "Correctness", min: 1, max: 5 },
  { id: "cites", label: "Cites policy", min: 0, max: 1, step: 0.05 },
  { id: "helpfulness", label: "Helpfulness", min: 1, max: 5 },
  { id: "tone", label: "Tone", min: 1, max: 5 },
];
const WINDOWS = [
  { id: "1h", label: "1 hour" },
  { id: "24h", label: "24 hours" },
  { id: "7d", label: "7 days" },
];
const NOW = Date.parse("2026-11-12T09:30:00");
const RULES: QualityAlertRule[] = [
  { id: "r1", channel: "ops", metric: "correctness", comparison: "below", threshold: 3.5, window: "24h", minChats: 50, enabled: true, lastTriggered: NOW - 3 * 3_600_000, preview: 4 },
  { id: "r2", channel: "policy", metric: "cites", comparison: "drops-by", threshold: 0.15, window: "7d", minChats: 200, enabled: true, preview: 1 },
  { id: "r3", channel: "email", metric: "tone", comparison: "below", threshold: 3, window: "1h", minChats: 20, enabled: false, preview: 0 },
];

/** Stands in for the page's query of the last 30 days */
function preview(rule: QualityAlertRule) {
  const strict = rule.comparison === "drops-by" ? 1 / Math.max(0.05, rule.threshold) : rule.threshold;
  return Math.max(0, Math.round(strict * 2 - rule.minChats / 40 + (rule.window === "1h" ? 3 : 0)));
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { QualityAlerts } = ui;
  const [rules, setRules] = useState(RULES);
  return (
    <div style={{ width: "100%", maxWidth: 680, display: "grid", gap: 8 }}>
      <QualityAlerts
        title="Quality alerts"
        description="Policy Q&A · judged chats"
        channels={CHANNELS}
        metrics={METRICS}
        windows={WINDOWS}
        now={NOW}
        rules={rules}
        onRulesChange={(next) => setRules(next.map((r) => (r.preview === undefined ? { ...r, preview: preview(r) } : r)))}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Change any part of a sentence; a threshold outside the scale is said in words.{" "}
        <button type="button" style={textButton} onClick={() => setRules(RULES)}>
          Reset
        </button>
      </div>
    </div>
  );
}
