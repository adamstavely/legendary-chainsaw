import { useState } from "react";
import type * as UI from "../../../../src/elements/react";
import { button, caption } from "../../demo-kit";

/* A copy-link button whose icon turns into a check and back, and two toggles that swap their icons. Icons after Lucide (ISC, lucide.dev) */

const icon = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export default function Demo({ ui }: { ui: typeof UI }) {
  const { IconSwap } = ui;
  const [copy, setCopy] = useState("copy");
  const [playing, setPlaying] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <div style={{ display: "grid", gap: 16, justifyItems: "center" }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        <button type="button" style={{ ...button, gap: 6 }} onClick={() => setCopy("done")}>
          <IconSwap state={copy} onStateChange={setCopy} revertAfter={1600} announce>
            <svg {...icon} data-state="copy" data-label="Copy"><rect x="8" y="8" width="14" height="14" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
            <svg {...icon} data-state="done" data-label="Link copied"><path d="M20 6 9 17l-5-5" /></svg>
          </IconSwap>
          Copy link to case 2041
        </button>
        <button type="button" style={button} aria-pressed={playing} aria-label="Play the interview recording" onClick={() => setPlaying(!playing)}>
          <IconSwap state={playing ? "pause" : "play"}>
            <svg {...icon} data-state="play"><path d="m6 3 14 9-14 9V3z" /></svg>
            <svg {...icon} data-state="pause"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
          </IconSwap>
        </button>
        <button type="button" style={button} aria-expanded={open} aria-label="Menu" onClick={() => setOpen(!open)}>
          <IconSwap state={open ? "close" : "menu"}>
            <svg {...icon} data-state="menu"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            <svg {...icon} data-state="close"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </IconSwap>
        </button>
      </div>
      <div style={caption}>Copy the link – the check turns back after a moment. Play and Menu swap their icons both ways.</div>
    </div>
  );
}
