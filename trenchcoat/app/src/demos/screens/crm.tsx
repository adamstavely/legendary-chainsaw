import type * as UI from "@screens/crm";

export default function Demo({ ui }: { ui: typeof UI }) {
  return <ui.CrmScreen />;
}
