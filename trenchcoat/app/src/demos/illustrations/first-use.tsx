import type * as UI from "../../../../src/elements/react";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { FirstUse } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 360 }}>
      <FirstUse caption="No cases yet" />
    </div>
  );
}
