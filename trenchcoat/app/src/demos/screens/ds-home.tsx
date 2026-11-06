import type * as UI from "@screens/ds-home";

export default function Demo({ ui }: { ui: typeof UI }) {
  return <ui.DesignSystemHomeScreen />;
}
