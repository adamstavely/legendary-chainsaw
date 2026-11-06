import type * as UI from "@screens/ds-component";

export default function Demo({ ui }: { ui: typeof UI }) {
  return <ui.DesignSystemComponentScreen />;
}
