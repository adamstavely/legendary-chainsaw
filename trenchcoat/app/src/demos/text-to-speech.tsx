import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* Guide text from a fictional coastal museum. Reading uses the browser's own voices, so what it sounds like depends
   on the system. */

const GUIDE = `The Harrow Point light was first lit in 1871, after three ships were lost on the reef in a single winter. Its lens was ground in Paris and shipped in eleven crates, each packed in sawdust and seaweed.

For ninety years a keeper climbed the tower's 142 steps at dusk to wind the clockwork that turned the lens. The log books in the next room record every night it shone, and the six nights it did not.

The light was automated in 1962. Today it still flashes twice every fifteen seconds, and on a clear night it can be seen from twenty-two nautical miles away.`;

const SHORT = "The Harrow Point light was first lit in 1871. Today it still flashes twice every fifteen seconds.";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { TextToSpeech } = ui;
  const [text, setText] = useState(GUIDE);
  const [said, setSaid] = useState<string | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 600, display: "grid", gap: 8 }}>
      <TextToSpeech
        title="Harrow Point light"
        description="Gallery 2 · audio guide"
        text={text}
        lang="en"
        onReadStart={(s) => setSaid(`Reading from sentence ${s + 1}.`)}
        onReadEnd={(done) => setSaid(done ? "Finished the guide." : "Stopped.")}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {said ?? "Press Play, or click a sentence to read from there. Try a faster speed while it reads."}{" "}
        <button type="button" style={textButton} onClick={() => setText(text === GUIDE ? SHORT : GUIDE)}>
          {text === GUIDE ? "Shorter text" : "Full guide"}
        </button>
      </div>
    </div>
  );
}
