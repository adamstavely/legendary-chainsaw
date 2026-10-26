import type * as UI from "@screens/assistant-home";

export default function Demo({ ui }: { ui: typeof UI }) {
  return <ui.AssistantHomeScreen />;
}
