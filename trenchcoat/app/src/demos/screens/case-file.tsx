import type * as UI from "@screens/case-file";

export default function Demo({ ui }: { ui: typeof UI }) {
  return <ui.CaseFileScreen />;
}
