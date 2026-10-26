import { useState } from "react";
import type * as UI from "@components/reaction-bar";
import { surface } from "../demo-kit";

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ReactionBar } = ui;
  const [last, setLast] = useState("Tap an action – counts roll digit by digit");

  return (
    <div style={{ display: "grid", gap: 20, justifyItems: "center", width: "100%", maxWidth: 440 }}>
      <article
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: 12,
          borderRadius: 16,
          ...surface,
          display: "grid",
          gap: 12,
          fontSize: 14,
        }}
      >
        <header style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            aria-hidden="true"
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #2563eb, #047857)",
              display: "grid",
              placeItems: "center",
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            JL
          </span>
          <span style={{ display: "grid", lineHeight: 1.25 }}>
            <strong style={{ fontWeight: 600 }}>Jonas Lindqvist</strong>
            <span style={{ fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))" }}>@jonasl · 2h</span>
          </span>
        </header>
        <p style={{ margin: 0, lineHeight: 1.5 }}>
          Shipped the new onboarding flow today. Time-to-first-project dropped from 9 minutes to under 3. Small details
          compound.
        </p>
        <ReactionBar
          reactions={{
            like: { count: 1299, active: false },
            comment: { count: 86 },
            repost: { count: 9 },
            share: { count: 41, active: true },
          }}
          onReact={(key, s) => setLast(`${key}: ${s.active ? "on" : "off"} · ${s.count.toLocaleString()}`)}
        />
      </article>

      <div style={{ display: "grid", gap: 6, justifyItems: "center" }}>
        <span style={{ fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))" }}>Only like and comment</span>
        <ReactionBar actions={["like", "comment"]} reactions={{ like: { count: 9999 }, comment: { count: 12 } }} />
      </div>

      <div style={{ fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))" }} aria-live="polite">
        {last}
      </div>
    </div>
  );
}
