import type * as UI from "@screens/files";

export default function Demo({ ui }: { ui: typeof UI }) {
  return <ui.FilesScreen />;
}
