import { useState } from "react";
import type * as UI from "@components/comment-thread";
import type { ThreadAuthor, ThreadMessage } from "@components/comment-thread";

const MIN = 60_000;

export default function Demo({ ui }: { ui: typeof UI }) {
  const { CommentThread, AssistantMark } = ui;
  const [now] = useState(() => Date.now());
  const [key, setKey] = useState(0);

  const maya: ThreadAuthor = { name: "Maya Chen" };
  const you: ThreadAuthor = { name: "Jordan Lee" };
  const assistant: ThreadAuthor = { name: "Assistant", assistant: true, avatar: <AssistantMark /> };

  const messages: ThreadMessage[] = [
    {
      id: "m1",
      author: maya,
      createdAt: now - 42 * MIN,
      text: "The pricing table still lists the old annual discount. @Assistant can you update it to 20% and fix the totals?",
    },
    {
      id: "m2",
      author: assistant,
      createdAt: now - 41 * MIN,
      text: "Done – I updated the discount and recalculated every plan.",
      status: "Edited 3 cells in Pricing",
      details: ["Starter: $96 → $86.40 / yr", "Team: $288 → $259.20 / yr", "Business: $720 → $648 / yr"],
    },
    {
      id: "m3",
      author: you,
      createdAt: now - 12 * MIN,
      text: "Looks right. Let's also double-check the footnote mentions the change.",
    },
  ];

  const onReply = (text: string): Promise<ThreadMessage> =>
    new Promise((resolve) => {
      const mentioned = /footnote/i.test(text);
      setTimeout(
        () =>
          resolve({
            id: `r-${Date.now()}`,
            author: assistant,
            createdAt: Date.now(),
            text: mentioned
              ? "I rewrote the footnote so it mentions the new 20% annual discount."
              : "Got it – I checked the section and applied your note.",
            status: mentioned ? "Edited 1 paragraph" : "Reviewed 2 paragraphs",
            details: mentioned
              ? ["Footnote ¹: “Annual plans save 20% compared to monthly billing.”"]
              : ["Read “Pricing”", "Read “Plans & limits”"],
          }),
        1800,
      );
    });

  return (
    <div style={{ width: "100%", maxWidth: 420, display: "grid", gap: 10, justifyItems: "center" }}>
      <CommentThread
        key={key}
        title="Pricing table"
        messages={messages}
        currentUser={you}
        assistant={assistant}
        onReply={onReply}
        onClose={() => setKey((k) => k + 1)}
      />
    </div>
  );
}
