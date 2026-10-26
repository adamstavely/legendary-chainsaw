import type * as UI from "@blocks/agent-gallery";

export default function Demo({ ui }: { ui: typeof UI }) {
  return <ui.AgentGallery />;
}
