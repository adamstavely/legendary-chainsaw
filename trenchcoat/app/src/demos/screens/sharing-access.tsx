import type * as UI from "@screens/sharing-access";

export default function Demo({ ui }: { ui: typeof UI }) {
  return <ui.SharingAccessScreen />;
}
