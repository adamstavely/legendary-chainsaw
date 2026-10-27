import type * as UI from "@blocks/uncertainty-mix";

// "Will the new checkout lift conversion next quarter?" – where the answer's uncertainty comes from, part by part
const SOURCES: UI.UncertaintySource[] = [
  { part: "Baseline", kind: "gap", amount: 6, claim: "Mobile conversion before the change" },
  { part: "Baseline", kind: "model", amount: 2 },
  { part: "Customer behaviour", kind: "gap", amount: 14, claim: "Returning customers weren't in the test" },
  { part: "Customer behaviour", kind: "chance", amount: 7 },
  { part: "Customer behaviour", kind: "model", amount: 3 },
  { part: "Competitors", kind: "chance", amount: 12, claim: "A rival's holiday pricing isn't announced" },
  { part: "Competitors", kind: "gap", amount: 4 },
  { part: "Forecast", kind: "gap", amount: 21 },
  { part: "Forecast", kind: "chance", amount: 11 },
  { part: "Forecast", kind: "model", amount: 20, claim: "Seasonality beyond the model's two years of data" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { UncertaintyMix } = ui;
  return <UncertaintyMix sources={SOURCES} subtitle="“Will the new checkout lift conversion next quarter?”" chartTitle="By part of the answer" />;
}
