import type * as UI from "../../../src/elements/react";
export default function Demo({ ui }: { ui: typeof UI }) {
  const { NumberField } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 640 }}>
      <NumberField label="Worker limit" defaultValue={4} min={1} max={32} />
    </div>
  );
}
