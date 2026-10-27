import type * as UI from "../../../src/elements/react";
export default function Demo({ ui }: { ui: typeof UI }) {
  const { Checkbox } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 640 }}>
      <Checkbox label="Include citations" defaultValue />
    </div>
  );
}
