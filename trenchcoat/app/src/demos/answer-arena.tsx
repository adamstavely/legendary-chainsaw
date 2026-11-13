import { useEffect, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ArenaVote } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

const PROMPT = "Explain retrieval-augmented generation to a product manager in under 80 words.";
const A = {
  model: "Atlas",
  meta: "1.4s · 74 tokens",
  text: "**Retrieval-augmented generation** lets the model look things up before it answers.\n\nWhen a question comes in, we search your own documents, hand the best passages to the model, and it writes the answer from them. You get:\n- Answers grounded in your data, with sources\n- No retraining when the docs change\n- Fewer made-up facts",
};
const B = {
  model: "Nova",
  meta: "2.1s · 68 tokens",
  text: "Think of it as an open-book exam. Instead of answering from memory, the model first pulls the most relevant pages from your knowledge base, then writes its answer using them.\n\nFor a PM, that means fresher answers, citations you can check, and no fine-tuning project every time the help center changes.",
};

const C = {
  model: "Lumen",
  meta: "0.9s · 61 tokens",
  text: "The model checks a library before it answers. We index the audit team's documents; each question pulls the closest passages, and the model answers from those, citing them.\n\nWhy it matters: answers stay current as documents change, and reviewers can check every claim.",
};
const D = {
  model: "Quill",
  meta: "1.7s · 79 tokens",
  text: "RAG = search + write. Search your documents for the passages that match the question, then have the model write the answer from them.\n- Up to date without retraining\n- Sources you can show\n- Less guessing",
};
const SPEEDS = [3, 2, 4, 2];

/** Streams the answers together, a few words per tick, at slightly different speeds – then stops */
function useRace(run: number, texts: string[]) {
  const [shown, setShown] = useState<number[]>(texts.map(() => 0));
  const words = texts.map((t) => t.match(/\S+\s*/g) ?? []);
  useEffect(() => {
    const at = texts.map(() => 0);
    setShown([...at]);
    const id = window.setInterval(() => {
      words.forEach((w, i) => (at[i] = Math.min(w.length, at[i] + SPEEDS[i])));
      setShown([...at]);
      if (words.every((w, i) => at[i] >= w.length)) window.clearInterval(id);
    }, 120);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the script is fixed; a new run restarts it
  }, [run, texts.length]);
  return words.map((w, i) => ({ text: w.slice(0, shown[i] ?? 0).join(""), streaming: (shown[i] ?? 0) < w.length }));
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AnswerArena } = ui;
  const [run, setRun] = useState(0);
  const [vote, setVote] = useState<ArenaVote | null>(null);
  const [four, setFour] = useState(false);
  const models = four ? [A, B, C, D] : [A, B];
  const streams = useRace(run, models.map((m) => m.text));
  const winner = vote && vote.winner !== "tie" && vote.winner !== "bad" ? models["abcd".indexOf(vote.winner)] : undefined;
  const next = () => {
    setVote(null);
    setRun((r) => r + 1);
  };

  return (
    <div style={{ width: "100%", maxWidth: four ? 1100 : 820, display: "grid", gap: 8 }}>
      <AnswerArena
        prompt={PROMPT}
        blind
        answers={models.map((m, i) => ({ model: m.model, answer: streams[i]?.text ?? "", streaming: streams[i]?.streaming, meta: m.meta }))}
        value={vote}
        onChange={setVote}
      />
      <div style={{ ...caption, textAlign: "center", minHeight: 18 }}>
        {vote ? (
          <>
            {winner ? `${winner.model} wins` : vote.winner === "bad" ? "All bad" : four ? "All equally good" : "Tie"}
            {vote.reason ? ` · ${vote.reason}` : ""} ·{" "}
            <button type="button" style={textButton} onClick={next}>
              Next matchup
            </button>
          </>
        ) : (
          <>
            Blind mode – the model names show after you vote ·{" "}
            <button
              type="button"
              style={textButton}
              onClick={() => {
                setFour((f) => !f);
                next();
              }}
            >
              {four ? "Compare two models" : "Compare four models"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
