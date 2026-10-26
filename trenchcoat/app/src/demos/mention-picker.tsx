import { useEffect, useRef, useState, type CSSProperties } from "react";
import type * as UI from "../../../src/elements/react";
import type { MentionTrigger } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* The message box of a chat, as chat-composer draws it (a textarea): "@pr" types itself in and the picker opens on the
   files, people and sources that match. Pick one with ↑ ↓ and ↵ (or a click) and its token replaces what was typed;
   Esc closes; "/" at the start of a line offers commands. (In a contenteditable field the pick lands as a chip.) */

const Glyph = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const file = <Glyph d="M7 3h7l5 5v13H7zM14 3v5h5" />;
const code = <Glyph d="M7 3h7l5 5v13H7zM14 3v5h5M10.5 12 9 14l1.5 2M13.5 12l1.5 2-1.5 2" />;
const link = <Glyph d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />;
const issue = <Glyph d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 8v5M12 16h.01" />;
const spark = <Glyph d="M12 3.5c.5 3.6 1.9 5 5.5 5.5-3.6.5-5 1.9-5.5 5.5-.5-3.6-1.9-5-5.5-5.5 3.6-.5 5-1.9 5.5-5.5zM18 15l.6 1.9 1.9.6-1.9.6L18 20l-.6-1.9-1.9-.6 1.9-.6z" />;
const wrench = <Glyph d="M14.5 6.5a4 4 0 0 0 5 5l-8 8a2.1 2.1 0 0 1-3-3l8-8a4 4 0 0 0-2-2zM5 5l2 2" />;
const shrink = <Glyph d="M4 14h6v6M20 10h-6V4M14 10l6-6M4 20l6-6" />;

const TRIGGERS: MentionTrigger[] = [
  {
    char: "@",
    label: "People, files and sources",
    groups: [
      {
        id: "files",
        label: "Files",
        items: [
          { id: "spec", label: "billing-spec.md", hint: "docs/billing", icon: file },
          { id: "schema", label: "schema.prisma", hint: "packages/db", icon: code },
          { id: "invoice", label: "invoice.ts", hint: "apps/api/billing", icon: code },
          { id: "webhooks", label: "stripe-webhooks.log", hint: "logs · 31K tokens", icon: file },
        ],
      },
      {
        id: "people",
        label: "People",
        items: [
          { id: "maya", label: "Maya Chen", hint: "Design", avatar: true },
          { id: "priya", label: "Priya Shah", hint: "Billing eng", avatar: true },
          { id: "daniel", label: "Daniel Okafor", hint: "Product", avatar: true },
          { id: "sam", label: "Sam Rivera", hint: "Support", avatar: true },
        ],
      },
      {
        id: "sources",
        label: "Sources",
        items: [
          { id: "stripe", label: "Stripe API reference", hint: "stripe.com/docs", icon: link, keywords: "docs" },
          { id: "bil-142", label: "BIL-142 Proration is off by a day", hint: "Linear", icon: issue },
        ],
      },
    ],
  },
  {
    char: "/",
    atLineStart: true,
    label: "Commands",
    groups: [
      {
        id: "commands",
        label: "Commands",
        items: [
          { id: "summarize", label: "summarize", hint: "Sum up the thread so far", icon: spark, token: "/summarize" },
          { id: "explain", label: "explain", hint: "Walk through the selected code", icon: spark, token: "/explain" },
          { id: "tests", label: "tests", hint: "Write tests for a file", icon: wrench, token: "/tests" },
          { id: "compact", label: "compact", hint: "Shrink the conversation", icon: shrink, token: "/compact" },
        ],
      },
    ],
  },
];

const field: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: 96,
  padding: "12px 14px",
  borderRadius: 14,
  background: "var(--tc-surface-raised, light-dark(#ffffff, #19191b))",
  boxShadow: "var(--tc-field-shadow, 0 0 0 1px light-dark(#e4e4e7, #2a2a2e))",
  color: "var(--tc-text-primary, light-dark(#171717, #ededed))",
  fontSize: 14,
  lineHeight: 1.6,
  border: 0,
  outline: "none",
  resize: "none",
  fontFamily: "inherit",
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { MentionPicker } = ui;
  const ref = useRef<HTMLTextAreaElement>(null);
  const [last, setLast] = useState<string | null>(null);

  // The opening state: the start of a request, then "@pr" typed in, a key every 140ms – and nothing after. The caret
  // moves with setSelectionRange, which doesn't take focus
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.value = "Can you check @billing-spec.md against ";
    const typed = "@pr";
    let i = 0;
    const id = setInterval(() => {
      el.value += typed[i++];
      el.setSelectionRange(el.value.length, el.value.length);
      el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: typed[i - 1] }));
      if (i >= typed.length) clearInterval(id);
    }, 140);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: 520, minHeight: 440, display: "grid", alignContent: "start", gap: 10 }}>
      <textarea ref={ref} aria-label="Message" rows={3} spellCheck={false} style={field} />
      <MentionPicker
        target={ref}
        triggers={TRIGGERS}
        placement="below"
        onPick={(pick) => setLast(`Added ${pick.token}`)}
      />
      <div style={{ ...caption, minHeight: 18 }}>{last ?? "Type @ for files, people and sources · / at the start of a line for commands"}</div>
    </div>
  );
}
