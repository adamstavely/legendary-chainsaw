import type * as UI from "@screens/analytics";

export default function Demo({ ui }: { ui: typeof UI }) {
  return <ui.AnalyticsScreen />;
}
