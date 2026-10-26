import type * as UI from "@screens/settings-billing";

export default function Demo({ ui }: { ui: typeof UI }) {
  return <ui.SettingsBillingScreen />;
}
