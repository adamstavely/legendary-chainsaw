import { useState } from "react";
import type * as UI from "@components/button";

const Plus = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M8 3v10M3 8h10" />
  </svg>
);

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Button } = ui;
  const [loading, setLoading] = useState(false);
  return (
    <div style={{ display: "grid", gap: 16, justifyItems: "center" }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <Button variant="primary" icon={<Plus />}>Create</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Delete</Button>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Button size="sm">Small</Button>
        <Button size="md">Medium</Button>
        <Button size="lg">Large</Button>
      </div>
      <Button
        loading={loading}
        onClick={() => {
          setLoading(true);
          setTimeout(() => setLoading(false), 2000);
        }}
      >
        {loading ? "Saving…" : "Click to load"}
      </Button>
    </div>
  );
}
