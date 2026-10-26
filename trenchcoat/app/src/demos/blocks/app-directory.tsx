import type * as UI from "@blocks/app-directory";

export default function Demo({ ui }: { ui: typeof UI }) {
  return <ui.AppDirectory />;
}
