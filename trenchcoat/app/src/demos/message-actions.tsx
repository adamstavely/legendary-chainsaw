import { useEffect, useRef, useState } from "react";
import type * as UI from "@components/message-actions";
import { bubble } from "../demo-kit";

const pool = [
  "The quickest fix is to memoize the filtered list with useMemo, keyed on the query and the items. That stops the table from re-sorting 5,000 rows on every keystroke.",
  "Wrap the filtering in useMemo so it only reruns when the query or the data changes – then debounce the input by about 150 ms. Typing should feel instant again.",
  "Move the filter out of render: compute it in useMemo, and render the rows with a virtualized list. Only the ~20 visible rows are mounted, so even 50k items stay smooth.",
  "Profile first – but in most cases the culprit is recomputing the filtered list on every render. useMemo plus a short debounce on the search box usually fixes it.",
];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { MessageActions, MessageText } = ui;
  const [versions, setVersions] = useState<string[]>([pool[0], pool[1]]);
  const [version, setVersion] = useState(1);
  const [regenerating, setRegenerating] = useState(false);
  const [status, setStatus] = useState("Hover the message to use its actions");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const regenerate = () => {
    if (regenerating) return;
    setRegenerating(true);
    setStatus("Writing a new version…");
    timer.current = window.setTimeout(() => {
      setVersions((v) => {
        const next = [...v, pool[v.length % pool.length]];
        setVersion(next.length - 1);
        return next;
      });
      setRegenerating(false);
      setStatus("New version added");
    }, 1600);
  };

  return (
    <div style={{ width: "100%", maxWidth: 480, display: "grid", gap: 12 }}>
      <div
        style={{
          justifySelf: "end",
          maxWidth: "80%",
          padding: "8px 12px",
          borderRadius: 14,
          ...bubble,
          fontSize: 14,
        }}
      >
        My search table lags when I type. How do I fix it?
      </div>
      <div data-ui-message="" style={{ display: "grid", gap: 6, fontSize: 14, lineHeight: 1.55 }}>
        <MessageText version={version}>
          <p style={{ margin: 0 }}>{versions[version]}</p>
        </MessageText>
        <MessageActions
          text={versions[version]}
          versions={versions}
          version={version}
          onVersionChange={setVersion}
          onRegenerate={regenerate}
          regenerating={regenerating}
          onCopy={() => setStatus("Copied to clipboard")}
          onFeedback={(kind, reason) =>
            setStatus(kind === null ? "Feedback removed" : reason ? `Thanks – “${reason}” sent` : kind === "up" ? "Marked helpful" : "Tell us what went wrong")
          }
          onSpeak={(p) => setStatus(p ? "Reading aloud…" : "Stopped reading")}
          speakDuration={4000}
        />
      </div>
      <div style={{ fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))" }}>{status}</div>
    </div>
  );
}
