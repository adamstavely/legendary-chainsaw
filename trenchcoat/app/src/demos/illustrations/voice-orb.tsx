import { useState } from "react";
import type * as UI from "../../../../src/elements/react";
import type { VoiceOrbState, VoiceOrbVariant } from "../../../../src/elements/react";
import { caption, textButton } from "../../demo-kit";

const VARIANTS: VoiceOrbVariant[] = ["sphere", "ring", "wave", "bars", "blob", "orbit"];
const STATES: VoiceOrbState[] = ["idle", "listening", "thinking", "speaking"];

export default function Demo({ ui }: { ui: typeof UI }) {
  const [state, setState] = useState<VoiceOrbState>("speaking");
  return (
    <div style={{ width: "100%", maxWidth: 480, display: "grid", gap: 12, justifyItems: "center" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8, width: "100%", justifyItems: "center" }}>
        {VARIANTS.map((variant) => (
          <div key={variant} style={{ display: "grid", justifyItems: "center", gap: 2 }}>
            <ui.VoiceOrb variant={variant} state={state} size={130} label={false} />
            <div style={caption}>{variant}</div>
          </div>
        ))}
      </div>
      <div style={{ ...caption, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
        {STATES.map((s) => (
          <button key={s} type="button" aria-pressed={s === state} style={{ ...textButton, fontWeight: s === state ? 600 : undefined }} onClick={() => setState(s)}>
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}
