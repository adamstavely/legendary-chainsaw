import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { RateLimitRow } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A fictional research institute's assistants run on a generic model provider: two models on Tier 3 and a fallback
   on Tier 1. The clock is fixed, so the reset countdown reads the same every time. */

const NOW = new Date(2026, 10, 13, 10, 30, 0).getTime();

/** A seeded wobble, so the sparklines are the same on every render */
const noise = (i: number, seed: number) => {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
};
const hour = (base: number, swing: number, seed: number, end?: number) =>
  Array.from({ length: 30 }, (_, i) => (i === 29 && end != null ? end : Math.max(0.05, base + (noise(i, seed) - 0.5) * swing + (i / 29) * 0.12)));

const BUSY: RateLimitRow[] = [
  {
    id: "large-1",
    provider: "Model provider",
    model: "large-1",
    tier: "Tier 3",
    requests: { used: 4_620, limit: 5_000 },
    inputTokens: { used: 812_000, limit: 800_000 },
    outputTokens: { used: 96_000, limit: 160_000 },
    resetAt: NOW + 18_000,
    throttled: 37,
    history: hour(0.78, 0.25, 1, 1.02),
  },
  {
    id: "small-2",
    provider: "Model provider",
    model: "small-2",
    tier: "Tier 3",
    requests: { used: 3_900, limit: 10_000 },
    inputTokens: { used: 1_150_000, limit: 2_000_000 },
    outputTokens: { used: 140_000, limit: 400_000 },
    throttled: 0,
    history: hour(0.4, 0.2, 2),
  },
  {
    id: "fallback",
    provider: "Second provider",
    model: "general-3",
    tier: "Tier 1",
    requests: { used: 410, limit: 500 },
    inputTokens: { used: 61_000, limit: 90_000 },
    outputTokens: { used: 9_000, limit: 20_000 },
    throttled: 2,
    history: hour(0.62, 0.3, 3),
  },
];
const QUIET: RateLimitRow[] = BUSY.map((r) => ({
  ...r,
  requests: r.requests && { ...r.requests, used: Math.round(r.requests.used * 0.4) },
  inputTokens: r.inputTokens && { ...r.inputTokens, used: Math.round(r.inputTokens.used * 0.4) },
  outputTokens: r.outputTokens && { ...r.outputTokens, used: Math.round(r.outputTokens.used * 0.4) },
  resetAt: undefined,
  throttled: 0,
  history: r.history?.map((v) => v * 0.45),
}));

export default function Demo({ ui }: { ui: typeof UI }) {
  const { RateLimitStatus } = ui;
  const [busy, setBusy] = useState(true);
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 8 }}>
      <RateLimitStatus title="Rate limits" description="This minute, for the institute's assistants" rows={busy ? BUSY : QUIET} now={NOW} />
      <div style={{ ...caption, textAlign: "center" }}>
        {busy ? "large-1 is over its input-token limit. " : "A quiet minute. "}
        <button type="button" style={textButton} onClick={() => setBusy(!busy)}>
          {busy ? "Show a quiet minute" : "Show the busy minute"}
        </button>
      </div>
    </div>
  );
}
