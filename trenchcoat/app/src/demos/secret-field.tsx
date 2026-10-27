import type * as UI from "../../../src/elements/react";
export default function Demo({ ui }: { ui: typeof UI }) {
  const { SecretField } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 640 }}>
      <SecretField label="API key" />
    </div>
  );
}
