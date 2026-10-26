import type * as UI from "@blocks/ai-workspace";

export default function Demo({ ui }: { ui: typeof UI }) {
  return <ui.AiWorkspace />;
}
