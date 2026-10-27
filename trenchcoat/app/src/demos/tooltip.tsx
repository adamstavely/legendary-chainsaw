import type * as UI from "../../../src/elements/react";
export default function Demo({ ui }: { ui: typeof UI }) {
  const { Tooltip } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 640 }}>
      <Tooltip
        label="About sampling"
        text="Temperature changes sampling variability."
      />
    </div>
  );
}
