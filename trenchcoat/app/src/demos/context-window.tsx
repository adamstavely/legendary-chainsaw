import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ContextPart } from "../../../src/elements/react";

/* The conversation keeps growing while you watch, so the percentage creeps toward the amber warning. Remove files
   or tools to free room, press Compact on the conversation (the cells shimmer for a moment), or New chat to start
   over. */

const Logo = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path d="M6 1c.35 2.5 1.6 3.65 4.6 4-3 .35-4.25 1.5-4.6 4.6C5.65 6.6 4.4 5.35 1.4 5 4.4 4.65 5.65 3.5 6 1Z" fill="#d97757" />
  </svg>
);

const initial = (): ContextPart[] => [
  { id: "system", label: "System prompt", tokens: 4200, locked: true },
  {
    id: "tools",
    label: "Tools",
    items: [
      { id: "github", label: "GitHub", tokens: 9800 },
      { id: "linear", label: "Linear", tokens: 6200 },
      { id: "browser", label: "Browser", tokens: 4400 },
      { id: "sql", label: "Postgres", tokens: 3100 },
    ],
  },
  {
    id: "files",
    label: "Files",
    items: [
      { id: "spec", label: "billing-spec.md", tokens: 18600 },
      { id: "schema", label: "schema.prisma", tokens: 7400 },
      { id: "invoice", label: "invoice.ts", tokens: 12900 },
      { id: "log", label: "stripe-webhooks.log", tokens: 31200 },
    ],
  },
  { id: "memory", label: "Memory", tokens: 5600 },
  { id: "chat", label: "Conversation", tokens: 24000, compact: 0.25 },
];

const LIMIT = 200_000;

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ContextWindow } = ui;
  const [parts, setParts] = useState<ContextPart[]>(initial);

  // Every turn adds to the conversation, up to just under the limit
  useEffect(() => {
    const id = setInterval(() => {
      setParts((ps) => {
        const used = ps.reduce((n, p) => n + (p.items ? p.items.reduce((m, i) => m + i.tokens, 0) : p.tokens ?? 0), 0);
        if (used > LIMIT * 0.97) return ps;
        const add = Math.round(1800 + Math.random() * 3200);
        return ps.map((p) => (p.id === "chat" ? { ...p, tokens: (p.tokens ?? 0) + add } : p));
      });
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: 480 }}>
      <ContextWindow
        title="Context window"
        model="Opus 5.5"
        modelIcon={<Logo />}
        parts={parts}
        limit={LIMIT}
        warnAt={0.8}
        onRemoveItem={(partId, itemId) =>
          setParts((ps) => ps.map((p) => (p.id === partId && p.items ? { ...p, items: p.items.filter((i) => i.id !== itemId) } : p)))
        }
        onCompact={(partId) =>
          new Promise<void>((resolve) =>
            setTimeout(() => {
              setParts((ps) => ps.map((p) => (p.id === partId ? { ...p, tokens: Math.round((p.tokens ?? 0) * 0.25) } : p)));
              resolve();
            }, 1600),
          )
        }
        action={{ label: "New chat", onClick: () => setParts(initial()) }}
      />
    </div>
  );
}
