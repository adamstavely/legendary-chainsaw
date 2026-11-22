import { useId, useMemo, useState, type CSSProperties } from "react";
import type * as UI from "../../../src/elements/react";
import { caption, surface, textButton } from "../demo-kit";

/* Point-in-time help from a help center, in a fictional case-review app, "Ledgerline": a guide icon beside the page
   title (its guide was rewritten three days ago, so it carries the Updated dot), with words beside a bulk action, and
   beside a field's label (already read). The guides live on a made-up help center, so the demo stops each link and
   says where it would have gone – an app does the same with tc-guide-open to show a guide in its own panel. */

type Guide = { id: string; title: string; minutes: number; path: string };
const GUIDES: Guide[] = [
  { id: "rules", title: "Write a risk rule", minutes: 5, path: "guides/risk-rules" },
  { id: "reassign", title: "Reassign cases in bulk", minutes: 3, path: "guides/bulk-reassign" },
  { id: "window", title: "Choose an escalation window", minutes: 2, path: "guides/escalation-window" },
];
const HELP_CENTER = "https://help.example.com/";

const page: CSSProperties = { ...surface, display: "grid", gap: 18, padding: 20, borderRadius: 14, width: "100%", boxSizing: "border-box" };
const row: CSSProperties = { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" };
const fieldBox: CSSProperties = { display: "grid", gap: 6, maxWidth: 260 };
const control: CSSProperties = { height: 32, padding: "0 10px", borderRadius: 8, border: "1px solid var(--tc-border-default, light-dark(#e3e3e3, #2e2e33))", background: "transparent", color: "inherit", font: "inherit" };
const action: CSSProperties = { height: 30, padding: "0 12px", borderRadius: 8, border: "1px solid var(--tc-border-default, light-dark(#e3e3e3, #2e2e33))", background: "transparent", color: "inherit", font: "inherit", fontSize: 13 };

export default function Demo({ ui }: { ui: typeof UI }) {
  const { HelpGuide } = ui;
  const [read, setRead] = useState<Record<string, boolean>>({ window: true });
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  const [opened, setOpened] = useState<Guide | null>(null);
  const fieldId = useId();
  // The risk-rule guide was rewritten three days ago, so its icon carries the Updated dot for 14 days
  const updatedOn = useMemo(() => new Date(Date.now() - 3 * 86_400_000).toISOString().slice(0, 10), []);

  const props = (id: string) => {
    const g = GUIDES.find((x) => x.id === id)!;
    return {
      title: g.title,
      href: HELP_CENTER + g.path,
      minutes: g.minutes,
      read: !!read[id],
      onReadChange: (r: boolean) => setRead((all) => ({ ...all, [id]: r })),
      updateSeen: !!seen[id],
      onUpdateSeenChange: (s: boolean) => setSeen((all) => ({ ...all, [id]: s })),
      onGuideOpen: (_: unknown, e: Event) => {
        e.preventDefault();
        setOpened(g);
      },
    };
  };

  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 10 }}>
      <div style={page}>
        <div style={{ ...row, justifyContent: "space-between" }}>
          <h2 style={{ ...row, margin: 0, fontSize: 20 }}>
            Risk rules <HelpGuide {...props("rules")} updatedOn={updatedOn} />
          </h2>
          <div style={row}>
            <HelpGuide {...props("reassign")} label="Read the guide" size="sm" />
            <button type="button" style={action}>
              Reassign 12 cases
            </button>
          </div>
        </div>
        <div style={fieldBox}>
          <div style={{ ...row, gap: 4, fontSize: 13, fontWeight: 500 }}>
            <label htmlFor={fieldId}>Escalation window</label>
            <HelpGuide {...props("window")} size="sm" />
          </div>
          <select id={fieldId} style={control} defaultValue="48">
            <option value="24">24 hours</option>
            <option value="48">48 hours</option>
            <option value="72">72 hours</option>
          </select>
        </div>
      </div>
      <div style={{ ...caption, textAlign: "center" }} role="status">
        {opened ? `“${opened.title}” would open at ${HELP_CENTER}${opened.path}, in a new tab. ` : "Point at an icon for its guide; click it to open. "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setRead({ window: true });
            setSeen({});
            setOpened(null);
          }}
        >
          Reset read and updates
        </button>
      </div>
    </div>
  );
}
