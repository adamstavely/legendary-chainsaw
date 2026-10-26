import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { CommentAuthor, PanelComment } from "../../../src/elements/react";

const MIN = 60_000;

export default function Demo({ ui }: { ui: typeof UI }) {
  const { CommentsPanel } = ui;
  const [now] = useState(() => Date.now());
  const [key, setKey] = useState(0);

  const you: CommentAuthor = { name: "Jordan Lee" };
  const comments: PanelComment[] = [
    { id: "c1", author: { name: "Maya Chen" }, createdAt: now - 3 * 60 * MIN, text: "Should the hero headline mention the free trial?" },
    { id: "c2", author: { name: "Sam Ortiz" }, createdAt: now - 95 * MIN, text: "/edit Shorten the intro paragraph to two sentences" },
    { id: "c3", author: { name: "Priya Nair" }, createdAt: now - 40 * MIN, text: "Love the new screenshots – much clearer than before." },
    { id: "c4", author: { name: "Maya Chen" }, createdAt: now - 18 * MIN, text: "/edit Replace “utilize” with “use” throughout" },
    { id: "c5", author: { name: "Alex Kim" }, createdAt: now - 4 * MIN, text: "Is the pricing link pointing at the new page?" },
  ];

  return (
    <div style={{ width: "100%", maxWidth: 400, display: "grid", justifyItems: "center" }}>
      <CommentsPanel
        key={key}
        title="Comments"
        comments={comments}
        currentUser={you}
        onRunEdit={() => new Promise<void>((r) => setTimeout(r, 1400))}
        onUndoEdit={() => new Promise<void>((r) => setTimeout(r, 600))}
        onClose={() => setKey((k) => k + 1)}
      />
    </div>
  );
}
