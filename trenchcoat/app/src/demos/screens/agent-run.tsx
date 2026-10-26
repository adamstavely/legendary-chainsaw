import type * as UI from "@screens/agent-run";

export default function Demo({ ui }: { ui: typeof UI }) {
  return <ui.AgentRunScreen />;
}
