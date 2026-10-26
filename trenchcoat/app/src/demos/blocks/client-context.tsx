import type * as UI from "@blocks/client-context";

export default function Demo({ ui }: { ui: typeof UI }) {
  return <ui.ClientContext />;
}
