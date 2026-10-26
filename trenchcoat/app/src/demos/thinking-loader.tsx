import { useEffect, useState } from "react";
import type * as UI from "@components/thinking-loader";
import { bubble } from "../demo-kit";

const phases = ["Thinking", "Searching the web", "Reading 12 sources", "Comparing prices", "Writing response"];
const INTERVAL = 1400;

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ThinkingLoader } = ui;
  const [run, setRun] = useState(0);
  const [done, setDone] = useState(false);

  // Walk through every phase, finish, hold the result, then start over
  useEffect(() => {
    setDone(false);
    const finish = window.setTimeout(() => setDone(true), phases.length * INTERVAL);
    const restart = window.setTimeout(() => setRun((r) => r + 1), phases.length * INTERVAL + 3200);
    return () => {
      window.clearTimeout(finish);
      window.clearTimeout(restart);
    };
  }, [run]);

  return (
    <div style={{ display: "grid", gap: 28, justifyItems: "center", width: "100%", maxWidth: 420 }}>
      <ThinkingLoader
        key={`pill-${run}`}
        phases={phases}
        interval={INTERVAL}
        done={done}
        doneLabel={(s) => `Thought for ${s}s`}
      />
      <div
        style={{
          justifySelf: "stretch",
          padding: "12px 14px",
          borderRadius: 14,
          ...bubble,
          display: "grid",
          gap: 8,
          fontSize: 14,
        }}
      >
        <ThinkingLoader
          key={`plain-${run}`}
          variant="plain"
          size="sm"
          phases={["Thinking", "Checking your calendar", "Drafting a reply"]}
          interval={INTERVAL * 1.5}
          done={done}
          doneLabel="Done"
        />
        <div style={{ color: done ? "var(--tc-text-primary, light-dark(#171717, #ededed))" : "var(--tc-text-muted, light-dark(#646464, #9a9aa1))" }}>
          {done ? "The cheapest flight on Friday leaves at 7:40 and costs $184." : "…"}
        </div>
      </div>
    </div>
  );
}
