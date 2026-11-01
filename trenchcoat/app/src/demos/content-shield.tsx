import type * as UI from "../../../src/elements/react";

/* A research institute's incident photo, flagged by a reviewer. The stand-in only renders once it's revealed. */

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ContentShield } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 440 }}>
      <ContentShield reason="Flagged by a reviewer as a graphic injury photo.">
        <div role="img" aria-label="Stand-in for the photo" style={{ height: 180, background: "linear-gradient(135deg, #5b7bb0, #a06a9c)" }} />
      </ContentShield>
    </div>
  );
}
