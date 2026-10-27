import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { InstructionEditorValue, InstructionVariable, InstructionVersion } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A support team's reply assistant. The text has moved on since v3: it now uses {{tone}}, which the app doesn't
   define, and no longer uses {{order_id}}. Compare shows the edit word by word; Save makes v4. The token count is the
   demo's own estimate, standing in for the app's tokenizer. */

const VARIABLES: InstructionVariable[] = [
  { name: "company", description: "The company's trading name" },
  { name: "customer_name", description: "First name from the customer's profile" },
  { name: "order_id", description: "The order the conversation is about, when there is one" },
  { name: "policy_url", description: "Link to the current returns policy" },
];

const V1 = "You are the support assistant for {{company}}. Answer questions about orders and returns.";
const V2 = `You are the support assistant for {{company}}. Answer questions about orders, returns and delivery.

Greet {{customer_name}} by name. Look up order {{order_id}} before you answer.`;
const V3 = `You are the support assistant for {{company}}. Answer questions about orders, returns and delivery.

Greet {{customer_name}} by name. Look up order {{order_id}} before you answer.
Quote the returns policy only from {{policy_url}} – never from memory.
If the customer asks for a refund over the limit, hand over to a person.`;
const NOW = `You are the support assistant for {{company}}. Answer questions about orders, returns and delivery in a {{tone}} voice.

Greet {{customer_name}} by name.
Quote the returns policy only from {{policy_url}} – never from memory.
If the customer asks for a refund over $250, hand over to a person and say how long they'll wait.`;

const VERSIONS: InstructionVersion[] = [
  { id: "v1", label: "v1", value: { role: "system", text: V1 }, note: "First draft", by: "Priya Shah", at: "12 Oct" },
  { id: "v2", label: "v2", value: { role: "system", text: V2 }, note: "Greeting and order lookup", by: "Priya Shah", at: "19 Oct" },
  { id: "v3", label: "v3", value: { role: "system", text: V3 }, note: "Policy source and hand-over", by: "Marcus Lee", at: "Yesterday" },
];

const estimate = (text: string) => Math.ceil(text.length / 4);

export default function Demo({ ui }: { ui: typeof UI }) {
  const { InstructionEditor } = ui;
  const [value, setValue] = useState<InstructionEditorValue>({ role: "system", text: NOW });
  const [versions, setVersions] = useState(VERSIONS);
  const [tokens, setTokens] = useState(estimate(NOW));
  const [counting, setCounting] = useState(false);
  const [note, setNote] = useState("Edited since v3 – {{tone}} isn't defined and {{order_id}} is no longer used.");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 8 }}>
      <InstructionEditor
        title="Reply assistant"
        value={value}
        onChange={(next) => {
          setValue(next);
          setCounting(true);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => {
            setTokens(estimate(next.text));
            setCounting(false);
          }, 500);
        }}
        variables={VARIABLES}
        versions={versions}
        onSave={(version, list) => {
          setVersions(list.map((v) => (v.id === version.id ? { ...v, by: "You", at: "Just now" } : v)));
          setNote(`Saved ${version.label}${version.note ? ` – “${version.note}”` : ""}.`);
        }}
        tokenCount={tokens}
        tokenLimit={400}
        counting={counting}
      />
      <div style={{ ...caption, textAlign: "center" }}>{note}</div>
    </div>
  );
}
