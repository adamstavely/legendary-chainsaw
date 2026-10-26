import type * as UI from "@screens/folder";

export default function Demo({ ui }: { ui: typeof UI }) {
  return <ui.FolderScreen />;
}
