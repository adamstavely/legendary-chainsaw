import type * as UI from "@blocks/metrics-dashboard";

export default function Demo({ ui }: { ui: typeof UI }) {
  return <ui.MetricsDashboard />;
}
