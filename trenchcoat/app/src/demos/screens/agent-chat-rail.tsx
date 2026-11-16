import type * as UI from "@screens/agent-chat-rail";

export default function Demo({ ui }: { ui: typeof UI }) {
  return <ui.AgentChatRailScreen />;
}
