import type * as UI from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A status update with pull requests named in it – merged, open, a draft and a closed one – and a compact one in a
   short list. Point at a link, or Tab to it, for its card. The links and people are made up. */

const HOUR = 3_600_000;
const NOW = Date.UTC(2026, 10, 5, 16, 0);

export default function Demo({ ui }: { ui: typeof UI }) {
  const { PrLink } = ui;
  const common = { repo: "halden/atlas", now: NOW } as const;
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 12, fontSize: 15, lineHeight: 1.6, color: "var(--tc-text-secondary)" }}>
      <p style={{ margin: 0 }}>
        The stage illustrations landed in{" "}
        <PrLink {...common} number={74} prTitle="Add five workflow stage illustrations" state="merged" href="https://code.example/halden/atlas/pull/74" author="noor" additions={4080} deletions={42} files={60} updatedAt={NOW - HOUR} />
        , and the overlay follows in{" "}
        <PrLink {...common} number={75} prTitle="Add the Breakpoint Overlay" state="open" href="https://code.example/halden/atlas/pull/75" author="sam" additions={1210} deletions={64} files={22} updatedAt={NOW - 12 * 60_000} />.
        The token rename is still a{" "}
        <PrLink {...common} number={71} prTitle="Rename the spacing tokens" state="draft" href="https://code.example/halden/atlas/pull/71" author="ines" additions={318} deletions={290} files={41} updatedAt={NOW - 26 * HOUR} />
        , and we dropped{" "}
        <PrLink {...common} number={69} prTitle="Try a second icon set" state="closed" href="https://code.example/halden/atlas/pull/69" author="sam" additions={96} deletions={0} files={1} updatedAt={NOW - 4 * 24 * HOUR} />.
      </p>
      <p style={{ margin: 0 }}>
        Also waiting: <PrLink {...common} compact number={76} prTitle="Soup Cans illustration" state="open" href="https://code.example/halden/atlas/pull/76" author="noor" additions={402} deletions={3} files={12} updatedAt={NOW - 5 * 60_000} />
      </p>
      <div style={{ ...caption, textAlign: "center" }}>Point at a link, or Tab to it, for its card.</div>
    </div>
  );
}
