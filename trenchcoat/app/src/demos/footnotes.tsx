import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { FootnoteNote } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* The notes under a research institute's publication charts: where the counts come from and what they leave out.
   A link's click is taken by the demo (as an app's router would) and named under the card. "Bulleted" switches the
   numbers off; "No notes" shows that an empty list renders nothing. */

const NOTES: FootnoteNote[] = [
  { id: "count", text: "Papers are counted once, by the first author's centre, in the month they were accepted.", href: "#method", linkLabel: "Method" },
  { id: "joint", text: "Joint papers have authors from two or more centres; unilateral papers have authors from one." },
  { id: "lag", text: "The last month is provisional: acceptances are often recorded up to three weeks late." },
  { id: "source", text: "Source: the institute's publications register, refreshed every Monday at 06:00.", href: "#register", linkLabel: "Register" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Footnotes } = ui;
  const [numbered, setNumbered] = useState(true);
  const [empty, setEmpty] = useState(false);
  const [note, setNote] = useState("");
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 8 }}>
      <Footnotes
        description="About the publication charts above"
        notes={empty ? [] : NOTES}
        numbered={numbered}
        onNavigate={(href, id, e) => {
          e.preventDefault();
          setNote(`Would open ${href} (note “${id}”).`);
        }}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {note || "Links are taken by the page, as a router would. "}
        <button type="button" style={textButton} onClick={() => setNumbered(!numbered)}>
          {numbered ? "Bulleted" : "Numbered"}
        </button>
        {" · "}
        <button type="button" style={textButton} onClick={() => setEmpty(!empty)}>
          {empty ? "Show the notes" : "No notes"}
        </button>
      </div>
    </div>
  );
}
