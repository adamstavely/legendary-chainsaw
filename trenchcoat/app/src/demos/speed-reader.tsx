import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A short history of lighthouses, from a fictional maritime museum's leaflet. It starts paused a few sentences in, so
   the frame and the sentence around the word both show. */

const HISTORY = `For most of history, sailors found their way home by fires lit on headlands. The Pharos of Alexandria, finished around 280 BC, was the most famous of them, and its name still means lighthouse in several languages.

Early towers burned wood, then coal, then candles and whale oil. Each was dim, smoky and hard to keep alight through a storm. Everything changed in 1823, when Augustin Fresnel showed that rings of glass prisms could gather a lamp's light into a single beam visible for miles.

Keepers lived at the lights with their families, trimming wicks, polishing lenses and logging the weather. Most lights are automated now, but many towers still stand, and each one flashes its own pattern so that a ship can tell exactly where it is.`;

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SpeedReader } = ui;
  const [position, setPosition] = useState(31);
  const [said, setSaid] = useState<string | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 600, display: "grid", gap: 8 }}>
      <SpeedReader
        title="A short history of lighthouses"
        description="Leaflet · about 150 words"
        text={HISTORY}
        defaultWpm={350}
        position={position}
        onPositionChange={setPosition}
        onFinish={(n) => setSaid(`Finished all ${n} words.`)}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {said ?? "Press Play, or focus the frame and use Space and the arrow keys."}{" "}
        <button type="button" style={textButton} onClick={() => setPosition(0)}>
          Back to the start
        </button>
      </div>
    </div>
  );
}
