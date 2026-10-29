import type * as UI from "../../../src/elements/react";
import type { TodoItem } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* The week before a research institute's open day. Add a to-do, tick some off, click one's words to change them, or
   remove one and Undo. */

const ITEMS: TodoItem[] = [
  { id: "venue", text: "Confirm the lecture hall booking", done: true },
  { id: "posters", text: "Send the poster files to the printer", done: true },
  { id: "rota", text: "Draw up the volunteer rota" },
  { id: "badges", text: "Order name badges for 40 guests" },
  { id: "tour", text: "Walk the lab tour route with facilities" },
  { id: "survey", text: "Set up the feedback survey" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { TodoList } = ui;
  return (
    <div style={{ width: "100%", maxWidth: 520, display: "grid", gap: 10 }}>
      <TodoList title="Open day prep" description="Due Friday" defaultItems={ITEMS} />
      <div style={{ ...caption, textAlign: "center" }}>Add a to-do, tick one off, click its words to edit, or Alt + ↑ / ↓ to move it.</div>
    </div>
  );
}
