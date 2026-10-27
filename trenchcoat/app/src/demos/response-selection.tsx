import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ResponseEdit, ResponseEditRequest, ResponseQuote } from "../../../src/elements/react";
import { bubble, caption, surface, textButton } from "../demo-kit";

/* Someone asked the assistant about working abroad. A moment after the page opens they quote the 30-day rule, then
   ask for a shorter version of the long sentence about tax – the edit comes back as a diff to accept or reject.
   Select any passage to do the same: Reply collects quotes for the composer, Ask why asks a follow-up, Edit asks for
   a rewrite. The "assistant" here is a stand-in that rewrites a few phrases; "More formal" fails the first time, to
   show Retry. */

const ANSWER = `Yes – you can work from abroad for up to 30 days a year, as long as you tell your manager before you go and you stay within two hours of your team's working day.

Longer stays need approval from HR, because working from another country for more than a month can change where you pay tax and which employment laws apply to you.

Two countries are excluded for security reasons: you can't take company laptops to them at all. The full list is on the travel page.`;

const span = (text: string, phrase: string) => {
  const start = text.indexOf(phrase);
  return { start, end: start + phrase.length };
};

/** The stand-in assistant's rewrites */
function rewrite(passage: string, preset: string, instruction: string): string {
  const p = passage.trim();
  if (preset === "shorter") {
    const known: Record<string, string> = {
      "because working from another country for more than a month can change where you pay tax and which employment laws apply to you": "because a month abroad can change your tax and employment law",
      "as long as you tell your manager before you go and you stay within two hours of your team's working day": "if you tell your manager first and stay within two hours of your team",
    };
    return known[p] ?? p.replace(/\b(really|very|at all|full|for security reasons)\b\s?/g, "").replace(/\s+,/g, ",").replace(/\s{2,}/g, " ");
  }
  if (preset === "simpler") return p.replace(/approval from HR/g, "HR to say yes").replace(/employment laws/g, "work rules").replace(/excluded/g, "off-limits");
  if (preset === "formal") return p.replace(/can't/g, "cannot").replace(/you can/gi, (m) => (m[0] === "Y" ? "Employees may" : "employees may")).replace(/\byou\b/g, "the employee").replace(/\byour\b/g, "their");
  return `${p} (${instruction.replace(/\.$/, "").toLowerCase()})`;
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ResponseSelection, ChatComposer, defaultModels } = ui;
  const [text, setText] = useState(ANSWER);
  const [quotes, setQuotes] = useState<ResponseQuote[]>([]);
  const [edit, setEdit] = useState<ResponseEdit | null>(null);
  const [message, setMessage] = useState("");
  const [log, setLog] = useState("");
  const [scripted, setScripted] = useState(false);
  const failedOnce = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Once, a moment after the page opens: quote the 30-day rule, then ask for a shorter tax sentence
  useEffect(() => {
    if (scripted) return;
    const q = span(ANSWER, "up to 30 days a year");
    const long = span(ANSWER, "because working from another country for more than a month can change where you pay tax and which employment laws apply to you");
    const a = setTimeout(() => {
      setQuotes([{ id: "s1", ...q, text: ANSWER.slice(q.start, q.end) }]);
      setLog("Quoted “up to 30 days a year”");
    }, 900);
    const b = setTimeout(() => {
      setEdit({ ...long, replacement: rewrite(ANSWER.slice(long.start, long.end), "shorter", "") });
      setLog("Asked for a shorter version – accept or reject it in the text");
      setScripted(true);
    }, 1900);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [scripted]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onEditRequest = (req: ResponseEditRequest) => {
    clearTimeout(timer.current);
    setEdit(null);
    setLog(`Asked: “${req.instruction}”…`);
    timer.current = setTimeout(() => {
      if (req.signal.aborted) return;
      if (req.preset === "formal" && !failedOnce.current) {
        failedOnce.current = true;
        setEdit({ start: req.start, end: req.end, error: "The assistant timed out" });
        setLog("The rewrite failed – Retry asks again");
        return;
      }
      setEdit({ start: req.start, end: req.end, replacement: rewrite(req.passage, req.preset, req.instruction) });
      setLog("The rewrite is back");
    }, 1100);
    req.signal.addEventListener("abort", () => {
      clearTimeout(timer.current);
      setLog("Cancelled the rewrite");
    });
  };

  const reset = () => {
    clearTimeout(timer.current);
    setText(ANSWER);
    setQuotes([]);
    setEdit(null);
    setMessage("");
    setLog("");
    failedOnce.current = false;
    setScripted(false);
  };

  return (
    <div style={{ width: "100%", maxWidth: 620, display: "grid", gap: 12 }}>
      <div style={{ ...bubble, justifySelf: "end", maxWidth: "80%", padding: "8px 12px", borderRadius: 14, fontSize: 14, lineHeight: 1.45 }}>Can I work from abroad for a few weeks this summer?</div>
      <div style={{ ...surface, padding: 16, borderRadius: 14 }}>
        <ResponseSelection
          text={text}
          onTextChange={(next) => {
            setText(next);
            setEdit(null);
            setLog("Accepted the edit");
          }}
          quotes={quotes}
          onQuotesChange={(next) => setQuotes(next)}
          edit={edit}
          onEditRequest={onEditRequest}
          onEditReject={() => {
            setEdit(null);
            setLog("Kept the original wording");
          }}
          onAskWhy={(passage) => setLog(`Asked why: “${passage.slice(0, 60)}”`)}
          onReply={(qs) => {
            setMessage((m) => `${qs.map((q) => `> ${q.text}`).join("\n")}\n\n${m}`.trimEnd() + "\n");
            setLog(`Moved ${qs.length === 1 ? "1 quote" : `${qs.length} quotes`} into your message`);
          }}
        />
      </div>
      <ChatComposer placeholder="Reply to the assistant…" value={message} onValueChange={setMessage} models={defaultModels} onSend={() => setMessage("")} />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {log || "Select part of the answer to reply, ask why or request an edit"}{" "}
        <button type="button" style={textButton} onClick={reset}>
          Reset
        </button>
      </p>
    </div>
  );
}
