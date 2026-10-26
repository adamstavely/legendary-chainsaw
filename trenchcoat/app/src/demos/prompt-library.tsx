import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { PromptTemplate } from "../../../src/elements/react";
import { caption } from "../demo-kit";

const templates: PromptTemplate[] = [
  {
    id: "follow-up",
    title: "Sales follow-up",
    category: "Sales",
    body: "Write a short follow-up email to {name} at {company} after our demo on {date}. Mention {feature} and propose a call next week.",
    variables: {
      name: { description: "First name of the contact", default: "Dana" },
      company: { description: "Their company", default: "Fernway" },
      date: { description: "When the demo happened, e.g. Tuesday" },
      feature: { description: "The feature they cared about most" },
    },
  },
  {
    id: "summary",
    title: "Meeting summary",
    category: "Ops",
    body: "Summarize these notes for {audience} in {length} bullet points. Highlight decisions, owners and deadlines.",
    variables: {
      audience: { description: "Who reads it, e.g. the leadership team", default: "the leadership team" },
      length: { description: "How many bullets", default: "5" },
    },
  },
  {
    id: "release",
    title: "Release notes",
    category: "Product",
    body: "Turn this changelog into release notes for {product} version {version}. Keep a {tone} tone and lead with the biggest change.",
    variables: {
      product: { description: "Product name", default: "Atlas" },
      version: { description: "Version number, e.g. 2.4" },
      tone: { description: "Friendly, neutral or formal", default: "friendly" },
    },
  },
  {
    id: "review",
    title: "Code review",
    category: "Engineering",
    body: "Review this {language} pull request for bugs, performance and readability. Focus on {focus}, and suggest concrete fixes.",
    variables: {
      language: { description: "Programming language", default: "TypeScript" },
      focus: { description: "What matters most this time" },
    },
  },
  {
    id: "reply",
    title: "Support reply",
    category: "Support",
    body: "Draft a reply to a customer who reports {issue}. Apologize once, explain the fix and offer {gesture}.",
    variables: {
      issue: { description: "What went wrong" },
      gesture: { description: "e.g. a month free", default: "a month free" },
    },
  },
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { PromptLibrary } = ui;
  const [used, setUsed] = useState<string | null>(null);
  return (
    <div style={{ width: "100%", maxWidth: 640, display: "grid", gap: 10 }}>
      <PromptLibrary
        title="Prompts"
        templates={templates}
        useLabel="Use prompt"
        onSelect={() => setUsed(null)}
        onUse={(prompt) => setUsed(prompt)}
        onCopy={() => setUsed("Copied to clipboard")}
      />
      {used && <div style={{ ...caption, lineHeight: 1.5 }}>→ {used}</div>}
    </div>
  );
}
