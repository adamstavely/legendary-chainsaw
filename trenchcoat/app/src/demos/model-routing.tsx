import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ModelRoutingValue, RouteTarget, RouteTargetHealth, RouteTestResult } from "../../../src/elements/react";
import { buttonSm, caption } from "../demo-kit";

/* A legal-tech product routes contract work. Long contracts go to the long-context model – but its breaker is open, so
   a test of a 140k-token contract matches rule 1, skips that target and falls back. Close the breaker and test again.
   The routing decision is the demo's own code standing in for the app's router. */

const TARGETS: RouteTarget[] = [
  { id: "atlas-long", label: "Atlas Long", detail: "1M context", region: "EU" },
  { id: "atlas-2", label: "Atlas 2", detail: "200k context", region: "EU" },
  { id: "swift", label: "Swift Mini", detail: "32k context", region: "EU" },
  { id: "atlas-2-us", label: "Atlas 2 (US)", detail: "200k context", region: "US" },
];

const START: ModelRoutingValue = {
  rules: [
    { id: "long", name: "Long inputs", conditions: ["Input is over 100k tokens"], target: "atlas-long" },
    { id: "quick", name: "Quick lookups", conditions: ["Task is classification", "Input is under 2k tokens"], target: "swift" },
    { id: "ent", name: "Enterprise", conditions: ["Plan is Enterprise"], target: "atlas-2" },
  ],
  fallbacks: ["atlas-2", "atlas-2-us"],
};

const OPEN: Record<string, RouteTargetHealth> = {
  "atlas-long": { status: "down", breaker: "open", note: "Opened 3 min ago after 5 timeouts" },
  "atlas-2": { status: "healthy", breaker: "closed", note: "p95 2.1s" },
  swift: { status: "healthy", breaker: "closed", note: "p95 0.6s" },
  "atlas-2-us": { status: "degraded", breaker: "half-open", note: "Letting test requests through" },
};
const CLOSED: Record<string, RouteTargetHealth> = { ...OPEN, "atlas-long": { status: "healthy", breaker: "closed", note: "p95 6.8s" } };

const SAMPLES: [string, string][] = [
  ["Long contract", "140k-token contract from an EU customer"],
  ["Short ticket", "Classify a 300-token support ticket"],
  ["Enterprise question", "Enterprise customer asks about clause 4"],
];

/** The app's router, in miniature */
function route(input: string, value: ModelRoutingValue, health: Record<string, RouteTargetHealth>, regions: string[]): RouteTestResult {
  const k = input.match(/(\d+)\s*k/i);
  const tokens = k ? Number(k[1]) * 1000 : Number(input.match(/(\d+)\s*-?\s*token/i)?.[1] ?? 800);
  const facts: Record<string, boolean> = {
    "Input is over 100k tokens": tokens > 100_000,
    "Input is under 2k tokens": tokens < 2000,
    "Task is classification": /classif/i.test(input),
    "Plan is Enterprise": /enterprise/i.test(input),
  };
  const reasons: string[] = [`Read as about ${tokens.toLocaleString("en-US")} tokens.`];
  const skipped: string[] = [];
  const name = (id: string) => TARGETS.find((t) => t.id === id)?.label ?? id;
  const usable = (id: string) => {
    const h = health[id];
    const region = TARGETS.find((t) => t.id === id)?.region;
    if (h?.breaker === "open") return `${name(id)}'s breaker is open – skipped.`;
    if (region && regions.length && !regions.includes(region)) return `${name(id)} runs in ${region}, outside the allowed regions – skipped.`;
    return null;
  };
  const rule = value.rules.find((r) => r.conditions.every((c) => facts[c]));
  if (rule) reasons.push(`${rule.name} matched: ${rule.conditions.map((c) => c.toLowerCase()).join(" and ")}.`);
  else reasons.push("No rule matched.");
  for (const id of [...(rule ? [rule.target] : []), ...value.fallbacks]) {
    const why = usable(id);
    if (!why) return { input, rule: rule?.id ?? null, target: id, reasons: [...reasons, `${name(id)} is available.`], skipped };
    skipped.push(id);
    reasons.push(why);
  }
  return { input, rule: rule?.id ?? null, target: null, reasons, skipped };
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ModelRouting } = ui;
  const [value, setValue] = useState(START);
  const [health, setHealth] = useState(OPEN);
  const [result, setResult] = useState<RouteTestResult | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const el = useRef<HTMLElementTagNameMap["tc-model-routing"]>(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const regions = ["EU"];
  const test = (input: string, v: ModelRoutingValue) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setResult(route(input, v, health, regions)), 700);
  };
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 12 }}>
      <ModelRouting ref={el} title="Contract review routing" targets={TARGETS} value={value} onChange={setValue} health={health} residency={regions} testResult={result} onTest={test} />
      <div style={{ ...caption, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        <span>Test:</span>
        {SAMPLES.map(([label, input]) => (
          <button key={label} type="button" style={buttonSm} onClick={() => el.current?.test(input)}>
            {label}
          </button>
        ))}
        <span style={{ flex: "1 1 auto" }} />
        <button type="button" style={buttonSm} aria-pressed={health === CLOSED} onClick={() => setHealth(health === OPEN ? CLOSED : OPEN)}>
          {health === OPEN ? "Close Atlas Long's breaker" : "Open Atlas Long's breaker"}
        </button>
      </div>
    </div>
  );
}
