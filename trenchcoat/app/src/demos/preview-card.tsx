import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The research institute's design-system site: an index of components, each tile a preview of the component itself. */

const sheet = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"><rect width="320" height="200" fill="#f7f8fa"/><rect x="40" y="20" width="240" height="180" rx="8" fill="#fff" stroke="#e4e7ec"/>` +
    `<rect x="60" y="40" width="120" height="9" rx="4.5" fill="#30343b"/><rect x="60" y="62" width="190" height="6" rx="3" fill="#e3e6eb"/><rect x="60" y="74" width="170" height="6" rx="3" fill="#e3e6eb"/>` +
    `<rect x="60" y="96" width="120" height="70" rx="6" fill="#e8eefc"/><rect x="72" y="140" width="14" height="20" fill="#9fb3e8"/><rect x="92" y="126" width="14" height="34" fill="#9fb3e8"/><rect x="112" y="118" width="14" height="42" fill="#9fb3e8"/><rect x="132" y="108" width="14" height="52" fill="#9fb3e8"/>` +
    `<rect x="170" y="88" width="98" height="40" rx="6" fill="#2a2a2e"/><rect x="180" y="98" width="60" height="5" rx="2.5" fill="#8a8d94"/><rect x="180" y="110" width="70" height="5" rx="2.5" fill="#5f626a"/></svg>`,
)}`;

export default function Demo({ ui }: { ui: typeof UI }) {
  const { PreviewCard, MeterRow } = ui;
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("Press a card to open it.");
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
        <PreviewCard
          title="Agent Cursors"
          description="Agents working in a document like teammates in a multiplayer editor"
          src={sheet}
          badge="New"
          loading={loading}
          onTcOpen={() => setNote("Opened: Agent Cursors")}
        />
        <PreviewCard title="Meter Row" description="A share of something used up, as a label, a bar and a number" fit="scale" previewWidth={360} loading={loading} onTcOpen={() => setNote("Opened: Meter Row")}>
          <div style={{ display: "grid", gap: 10, padding: 24, background: "var(--tc-surface-raised)" }}>
            <MeterRow label="Freezer space" value={0.62} />
            <MeterRow label="Sequencer hours" value={0.38} />
            <MeterRow label="Archive storage" value={0.17} />
          </div>
        </PreviewCard>
      </div>
      <PreviewCard
        orientation="horizontal"
        title="Bibliography"
        description="A reading list in the major citation styles, with live DOIs, tags and export"
        src={sheet}
        loading={loading}
        onTcOpen={() => setNote("Opened: Bibliography")}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        <span role="status">{note}</span>{" "}
        <button type="button" style={textButton} onClick={() => setLoading((v) => !v)}>
          {loading ? "Show the cards" : "Show loading"}
        </button>
      </div>
    </div>
  );
}
