import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import { bubble } from "../demo-kit";

const pool = [
  "The quickest fix is to memoize the filtered list with useMemo, keyed on the query and the items. That stops the table from re-sorting 5,000 rows on every keystroke.",
  "Wrap the filtering in useMemo so it only reruns when the query or the data changes – then debounce the input by about 150 ms. Typing should feel instant again.",
  "Move the filter out of render: compute it in useMemo, and render the rows with a virtualized list. Only the ~20 visible rows are mounted, so even 50k items stay smooth.",
  "Profile first – but in most cases the culprit is recomputing the filtered list on every render. useMemo plus a short debounce on the search box usually fixes it.",
];

/* What each Refine rewrite returns, so the demo can show one without a model */
const rewrites: Record<string, string> = {
  shorter: "Memoize the filtered list with useMemo and debounce the search box.",
  longer:
    "The table re-sorts all 5,000 rows on every keystroke because the filter runs in render. Wrap it in useMemo, keyed on the query and the items, so it only reruns when one of them changes. Then debounce the input by about 150 ms so a burst of typing triggers one filter instead of ten. If the list keeps growing, render it with a virtualized list so only the visible rows are mounted.",
  simpler: "Your table redoes all its work every time you type. Save the result with useMemo and wait a moment before filtering.",
  formal: "The latency is caused by recomputing the filtered list on every render. Memoizing it with useMemo, together with a short debounce on the input, should resolve the issue.",
  casual: "Yeah, it's re-filtering everything on each keystroke. Throw it in useMemo and debounce the input – done.",
  detail:
    "Wrap the filter in useMemo with [query, items] as dependencies, and debounce the input by ~150 ms (a small useDebouncedValue hook works). In the React profiler, the table's render should drop from ~40 ms to under 5 ms per keystroke.",
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { MessageActions, MessageText } = ui;
  const [versions, setVersions] = useState<string[]>([pool[0], pool[1]]);
  const [version, setVersion] = useState(1);
  const [regenerating, setRegenerating] = useState(false);
  const [refining, setRefining] = useState(false);
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

  const refine = (id: string) => {
    if (refining) return;
    setRefining(true);
    setStatus("Rewriting…");
    timer.current = window.setTimeout(() => {
      setVersions((v) => {
        const next = [...v, rewrites[id] ?? v[v.length - 1]];
        setVersion(next.length - 1);
        return next;
      });
      setRefining(false);
      setStatus("Rewrite added as a new version");
    }, 1400);
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
          actions={["copy", "regenerate", "refine", "feedback", "speak"]}
          onRefine={refine}
          refining={refining}
          onCopy={() => setStatus("Copied to clipboard")}
          onFeedback={(kind, reason) =>
            setStatus(kind === null ? "Feedback removed" : reason ? `Thanks – “${reason}” sent` : kind === "up" ? "Marked helpful" : "Tell us what went wrong")
          }
          onSpeak={(p) => setStatus(p ? "Reading aloud…" : "Stopped reading")}
          speakDuration={4000}
          reportable
          onReport={(r) => setStatus(`Reported for review: ${r.reason}${r.details ? ` – “${r.details}”` : ""}`)}
          onReportUndo={() => setStatus("Report withdrawn")}
        />
      </div>
      <div style={{ fontSize: 12, color: "var(--tc-text-muted, light-dark(#646464, #9a9aa1))" }}>{status}</div>
    </div>
  );
}
