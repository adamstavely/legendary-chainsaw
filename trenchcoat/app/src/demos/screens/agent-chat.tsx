import type * as UI from "@screens/agent-chat";

export default function Demo({ ui }: { ui: typeof UI }) {
  return <ui.AgentChatScreen />;
}
