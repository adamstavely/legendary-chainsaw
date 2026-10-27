import type * as UI from "../../../src/elements/react";
export default function Demo({ ui }: { ui: typeof UI }) {
  const { SliderField } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 640 }}>
      <SliderField
        label="Temperature"
        defaultValue={0.7}
        min={0}
        max={2}
        step={0.01}
      />
    </div>
  );
}
