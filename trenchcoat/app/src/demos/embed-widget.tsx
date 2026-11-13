import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { EmbedMessage, EmbedStarter, EmbedTheme } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

// The public help widget of a fictional research institute
const STARTERS: EmbedStarter[] = [
  { id: "hours", text: "When is the reading room open?" },
  { id: "data", text: "How do I request a dataset?" },
  { id: "report", text: "Where is the 2025 annual report?" },
];

const REPLIES: Record<string, string> = {
  "When is the reading room open?": "The reading room is open Monday to Friday, 9:00 to 17:30. Bring a visitor pass from the front desk.",
  "How do I request a dataset?": "Fill in the data request form on the Research Data page. Most requests are answered within five working days.",
  "Where is the 2025 annual report?": "It's on the Publications page, under Annual reports – a PDF of 48 pages.",
};

const START: EmbedMessage[] = [
  { id: "m1", from: "visitor", text: "How do I request a dataset?" },
  { id: "m2", from: "assistant", text: REPLIES["How do I request a dataset?"] },
  { id: "m3", from: "visitor", text: "Can someone check the status of request DR-2291?" },
  { id: "m4", from: "handoff", text: "Priya from the data desk joined" },
  { id: "m5", from: "human", name: "Priya · Data desk", text: "Hi! DR-2291 was approved this morning – you'll get a download link by email." },
];

const THEMES: EmbedTheme[] = [
  { accent: "#0f766e", radius: 16, position: "right" },
  { accent: "#f5c542", radius: 6, position: "left", launcherLabel: "Ask us" },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { EmbedWidget } = ui;
  const [messages, setMessages] = useState<EmbedMessage[]>(START);
  const [typing, setTyping] = useState(false);
  const [theme, setTheme] = useState(0);
  const n = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const send = (text: string) => {
    const i = ++n.current;
    setMessages((m) => [...m, { id: `v${i}`, from: "visitor", text }]);
    setTyping(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { id: `a${i}`, from: "assistant", text: REPLIES[text] ?? "Thanks – I've passed that to the help desk, and they'll reply here." }]);
    }, 900);
  };

  return (
    <div style={{ width: "100%", maxWidth: 420, display: "grid", gap: 12 }}>
      <EmbedWidget
        title="Ask the Institute"
        subtitle="Typically replies in a minute"
        greeting="Hi! I can help with visits, data requests and publications."
        defaultOpen
        starters={STARTERS}
        messages={messages}
        typing={typing}
        unread={2}
        theme={THEMES[theme]}
        privacyHref="#privacy"
        onSend={send}
      />
      <div style={{ ...caption, textAlign: "center" }}>
        Ask a question or close and reopen it.{" "}
        <button type="button" style={textButton} onClick={() => setMessages([])}>
          Start over
        </button>{" "}
        ·{" "}
        <button type="button" style={textButton} onClick={() => setTheme((t) => (t + 1) % THEMES.length)}>
          Try another theme
        </button>
      </div>
    </div>
  );
}
