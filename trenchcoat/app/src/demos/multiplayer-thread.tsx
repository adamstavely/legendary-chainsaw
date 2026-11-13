import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { MultiplayerItem, MultiplayerPerson } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* Three analysts at a fictional research institute review a vendor's risk with the model. Times are fixed so the
 * thumbnail doesn't change; replies from the model are canned */

const MIN = 60_000;
const T = Date.UTC(2026, 10, 12, 14, 0);

const people: MultiplayerPerson[] = [
  { id: "ana", name: "Ana Ruiz", role: "Lead" },
  { id: "priya", name: "Priya Shah", role: "Analyst" },
  { id: "tom", name: "Tom Becker", role: "Analyst" },
];

const START: MultiplayerItem[] = [
  { id: "j1", kind: "join", personId: "priya", at: T },
  { id: "m1", authorId: "priya", at: T + 1 * MIN, text: "Vendor questionnaire for Lumen Payroll is in. Their SOC 2 report is from last year." },
  { id: "m2", authorId: "priya", at: T + 2 * MIN, text: "Also no mention of where backups are stored." },
  { id: "j2", kind: "join", personId: "tom", at: T + 3 * MIN },
  { id: "m3", authorId: "tom", at: T + 4 * MIN, text: "@Assistant what does our policy say about SOC 2 reports older than 12 months?" },
  {
    id: "m4",
    authorId: "model",
    replyTo: "tom",
    at: T + 4 * MIN + 20_000,
    text: "Policy VR-3 accepts a report up to 15 months old with a bridge letter from the vendor. Without one, the vendor is rated High until a current report arrives.",
  },
  { id: "m5", authorId: "ana", at: T + 6 * MIN, text: "Thanks. @Priya Shah can you ask them for a bridge letter and the backup location?" },
];

const REPLIES = [
  "Noted. I've drafted the request to Lumen Payroll for a bridge letter and their backup regions – it's in the vendor file for review.",
  "Based on the questionnaire so far, I'd hold the rating at Medium pending the bridge letter. The open item is backup location.",
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { MultiplayerThread } = ui;
  const [items, setItems] = useState<MultiplayerItem[]>(START);
  const [typing, setTyping] = useState<string[]>(["priya"]);
  const replies = useRef(0);
  const timer = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const send = (text: string, _mentions: string[], modelAnswers: boolean) => {
    const at = Date.now();
    setItems((list) => [...list, { id: `u${at}`, authorId: "ana", at, text }]);
    if (!modelAnswers) return;
    setTyping((t) => [...t.filter((id) => id !== "model"), "model"]);
    timer.current = window.setTimeout(() => {
      const reply = REPLIES[replies.current++ % REPLIES.length];
      setItems((list) => [...list, { id: `r${Date.now()}`, authorId: "model", replyTo: "ana", at: Date.now(), text: reply }]);
      setTyping((t) => t.filter((id) => id !== "model"));
    }, 1400);
  };

  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 10 }}>
      <MultiplayerThread
        title="Vendor review – Lumen Payroll"
        people={people}
        model={{ name: "Assistant" }}
        currentUser="ana"
        items={items}
        present={["ana", "priya", "tom", "model"]}
        typing={typing}
        onSend={send}
      />
      <div style={{ ...caption, display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8 }}>
        <span>Type @ to mention someone or the Assistant; switch it to answer every message.</span>
        <button
          type="button"
          style={textButton}
          onClick={() => {
            window.clearTimeout(timer.current);
            setItems(START);
            setTyping(["priya"]);
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
