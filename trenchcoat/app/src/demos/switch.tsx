import type * as UI from "../../../src/elements/react";
export default function Demo({ ui }: { ui: typeof UI }) {
  const { Switch } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 640 }}>
      <Switch label="Enable caching" defaultValue />
    </div>
  );
}
