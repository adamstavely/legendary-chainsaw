import type * as UI from "@screens/ds-releases";

export default function Demo({ ui }: { ui: typeof UI }) {
  return <ui.DesignSystemReleasesScreen />;
}
