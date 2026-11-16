import type * as UI from "@screens/agent-orchestration";

export default function Demo({ ui }: { ui: typeof UI }) {
  return <ui.AgentOrchestrationScreen />;
}
