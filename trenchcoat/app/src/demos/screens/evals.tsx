import type * as UI from "@screens/evals";

export default function Demo({ ui }: { ui: typeof UI }) {
  return <ui.EvalsScreen />;
}
