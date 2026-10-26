import type * as UI from "@screens/integrations";

export default function Demo({ ui }: { ui: typeof UI }) {
  return <ui.IntegrationsScreen />;
}
