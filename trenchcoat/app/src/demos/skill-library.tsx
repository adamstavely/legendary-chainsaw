import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { LibrarySkill } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* A research institute's skill library: built-in skills, the audit team's own, one from a plugin and one from the
   community. One has an update waiting. Flip a switch, search, or filter by source; Add skill and Update say what the
   app would do. Times are fixed so the thumbnail is stable. */

const NOW = Date.UTC(2026, 10, 12, 15, 0);
const H = 3_600_000;
const SKILLS: LibrarySkill[] = [
  { id: "report", name: "Audit report writer", description: "Drafts the annual audit report from the findings register, in the institute's house style.", group: "Your team", version: "2.3.0", enabled: true, lastUsed: NOW - 2 * H, triggers: "Runs when asked to draft or revise an audit report" },
  { id: "contract", name: "Contract reviewer", description: "Checks a supplier contract against the procurement playbook and flags clauses to negotiate.", group: "Your team", version: "1.4.0", update: "1.5.0", enabled: true, lastUsed: NOW - 26 * H, triggers: "Runs when asked to review a contract" },
  { id: "expense", name: "Expense policy checker", description: "Reads an expense claim and says which lines break the travel and expense policy.", group: "Your team", version: "0.9.2", enabled: false, triggers: "Runs when a claim or receipt is shared" },
  { id: "chart", name: "Chart from spreadsheet", description: "Turns a sheet into a clear chart with a title, labelled axes and a source line.", group: "Built-in", version: "3.1.0", enabled: true, lastUsed: NOW - 20 * 60_000, triggers: "Runs when asked to chart or visualise data" },
  { id: "pdf", name: "PDF tables", description: "Pulls the tables out of a PDF as clean rows.", group: "Built-in", version: "3.0.4", enabled: true, lastUsed: NOW - 5 * 24 * H, triggers: "Runs when a PDF with tables is attached" },
  { id: "minutes", name: "Meeting minutes", description: "Writes minutes with decisions and owners from a transcript.", group: "Document tools plugin", version: "1.2.0", enabled: false, triggers: "Runs when a meeting transcript is shared" },
  { id: "cite", name: "Citation formatter", description: "Formats references in APA, Harvard or Chicago.", group: "Community", version: "0.4.1", enabled: false, lastUsed: NOW - 40 * 24 * H, triggers: "Runs when asked to format references" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { SkillLibrary } = ui;
  const [skills, setSkills] = useState(SKILLS);
  const [note, setNote] = useState("Turn on the expense checker, or search for “contract”.");
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 8 }}>
      <SkillLibrary
        description="Halvorsen Research Institute · Audit workspace"
        now={NOW}
        skills={skills}
        onSkillsChange={(next, id) => {
          setSkills(next);
          const s = next.find((x) => x.id === id);
          if (s) setNote(`${s.name} is ${s.enabled ? "on" : "off"}.`);
        }}
        onUpdate={(_id, version, skill) => setNote(`The app would install ${skill.name} ${version}.`)}
        onAdd={(source) => setNote(source === "upload" ? "The app would ask for a .skill file." : source === "url" ? "The app would ask for a URL." : "The app would open the skill editor.")}
        onSkillOpen={(_id, skill) => setNote(`The app would open ${skill.name}.`)}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        {note}{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setSkills(SKILLS);
            setNote("Back to the start.");
          }}
        >
          Start again
        </button>
      </div>
    </div>
  );
}
