import type * as UI from "../../../src/elements/react";
export default function Demo({ ui }: { ui: typeof UI }) {
  const { RadioGroup } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 640 }}>
      <RadioGroup
        label="Review mode"
        defaultValue="ask"
        options={[
          { value: "ask", label: "Ask first" },
          { value: "auto", label: "Automatic" },
        ]}
      />
    </div>
  );
}
