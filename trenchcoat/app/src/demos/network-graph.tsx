import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's co-authorship network: 40 researchers in five labs, linked by the papers they wrote together
   this year – close-knit labs, and a few people who bridge them. “Add visiting fellows” brings in six visitors who
   write with several labs, and the network glides to make room. Drag a researcher to pin them; double-click to let go. */

const LABS: Record<string, string[]> = {
  Genomics: ["I. Ko", "R. Mehta", "S. Varga", "T. Osei", "L. Brandt", "M. Ruiz", "A. Novak", "K. Lindqvist"],
  Imaging: ["P. Adeyemi", "J. Moreau", "E. Sato", "H. Kowalski", "D. Byrne", "N. Haddad", "C. Fischer", "Y. Tanaka"],
  Proteomics: ["F. Okonkwo", "B. Petrov", "G. Rossi", "W. Nakamura", "O. Larsen", "V. Duarte", "Z. Abara", "U. Holm"],
  Neuro: ["Q. Bauer", "X. Mensah", "R. Iqbal", "S. Ferreira", "T. Weiss", "L. Popescu", "M. Achebe", "A. Szabo"],
  Climate: ["K. Oduya", "P. Lindgren", "J. Castillo", "E. Moretti", "H. Berg", "N. Kimura", "C. Nwosu", "D. Hale"],
};
const FELLOWS = ["V. Arendt", "G. Mbeki", "I. Sorensen", "Y. Halloran", "B. Quist", "O. Teague"];

/** A deterministic stream of numbers in [0, 1) */
function stream(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function network(withFellows: boolean) {
  const rnd = stream(29);
  const nodes = Object.entries(LABS).flatMap(([group, people]) => people.map((id) => ({ id, group })));
  const links: { source: string; target: string; value: number }[] = [];
  // Inside a lab: each person writes with the next two, and now and then with someone further along
  for (const people of Object.values(LABS))
    people.forEach((a, i) => {
      for (const step of [1, 2]) if (rnd() < 0.8) links.push({ source: a, target: people[(i + step) % people.length], value: 1 + Math.floor(rnd() * 4) });
      if (rnd() < 0.3) links.push({ source: a, target: people[(i + 4) % people.length], value: 1 });
    });
  // Bridges between labs: a few shared papers
  const bridges: [string, string][] = [
    ["I. Ko", "P. Adeyemi"],
    ["R. Mehta", "F. Okonkwo"],
    ["S. Varga", "G. Rossi"],
    ["E. Sato", "Q. Bauer"],
    ["H. Kowalski", "X. Mensah"],
    ["B. Petrov", "R. Iqbal"],
    ["T. Weiss", "K. Oduya"],
    ["L. Brandt", "J. Castillo"],
    ["W. Nakamura", "N. Kimura"],
  ];
  for (const [a, b] of bridges) links.push({ source: a, target: b, value: 1 });
  if (withFellows) {
    const everyone = nodes.map((n) => n.id);
    FELLOWS.forEach((f, k) => {
      nodes.push({ id: f, group: "Visiting" });
      for (let j = 0; j < 3; j++) links.push({ source: f, target: everyone[(k * 7 + j * 13) % everyone.length], value: 1 + j });
    });
  }
  return { nodes, links };
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { NetworkGraph } = ui;
  const [fellows, setFellows] = useState(false);
  const { nodes, links } = network(fellows);
  return (
    <div style={{ width: "100%", maxWidth: 760, display: "grid", gap: 8 }}>
      <NetworkGraph title="Co-authors" description={fellows ? "Papers written together this year, with visiting fellows" : "Papers written together this year, by lab"} nodes={nodes} links={links} dragNodes />
      <div style={{ ...caption, textAlign: "center" }}>
        Point at a researcher, or Tab in and use the arrows; drag one to pin them.{" "}
        <button type="button" style={textButton} onClick={() => setFellows(!fellows)}>
          {fellows ? "Remove visiting fellows" : "Add visiting fellows"}
        </button>
      </div>
    </div>
  );
}
