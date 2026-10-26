import { useEffect, useRef } from "react";
import type * as UI from "../../../src/elements/react";
import type { BranchMessage } from "../../../src/elements/react";

const START: BranchMessage[] = [
  { id: "u1", role: "user", text: "Can you write the release note for v2.4? The big things are faster search and the new CSV export." },
  {
    id: "a1",
    role: "assistant",
    parentId: "u1",
    text: "v2.4 makes search up to 3× faster on large workspaces and adds CSV export to every table view. Both are on for all plans – no setup needed.",
  },
  { id: "u2", role: "user", parentId: "a1", text: "Keep it under 30 words." },
  { id: "a2", role: "assistant", parentId: "u2", text: "v2.4: search is up to 3× faster, and every table now exports to CSV. On for all plans today." },
  { id: "u3", role: "user", parentId: "a1", text: "Make it friendlier – this goes to customers, not engineers." },
  {
    id: "a3",
    role: "assistant",
    parentId: "u3",
    text: "Good news: finding things just got a lot quicker. Search is now up to 3× faster, even in your biggest workspaces.\n\nAnd you asked, we listened – any table can now be exported to CSV in one click. Enjoy!",
  },
];

/** Canned replies for new branches, in the product's voice */
const REPLIES = [
  "Here's a tighter take: v2.4 brings search that's up to 3× faster and one-click CSV export from any table – live for everyone now.",
  "Sure – v2.4 is all about speed and getting your data out: search is up to 3× faster, and every table view exports to CSV.",
  "v2.4 is here. Search keeps up with you (up to 3× faster), and CSV export is one click away on every table.",
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ConversationBranches } = ui;
  const timers = useRef<number[]>([]);
  const made = useRef(0);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  return (
    <div style={{ width: "100%", maxWidth: 520 }}>
      <ConversationBranches
        defaultMessages={START}
        onEdit={({ message }) =>
          new Promise<BranchMessage[]>((resolve) => {
            const reply = REPLIES[made.current++ % REPLIES.length];
            timers.current.push(window.setTimeout(() => resolve([{ id: `${message.id}-reply`, role: "assistant", text: reply }]), 1400));
          })
        }
      />
    </div>
  );
}
