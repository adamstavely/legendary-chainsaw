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

/** Streams both answers together, a few words per tick, at slightly different speeds – then stops */
function useDuel(run: number) {
  const [shown, setShown] = useState<[number, number]>([0, 0]);
  const words = [A.text.match(/\S+\s*/g) ?? [], B.text.match(/\S+\s*/g) ?? []];
  useEffect(() => {
    setShown([0, 0]);
    let a = 0;
    let b = 0;
    const id = window.setInterval(() => {
      a = Math.min(words[0].length, a + 3);
      b = Math.min(words[1].length, b + 2);
      setShown([a, b]);
      if (a >= words[0].length && b >= words[1].length) window.clearInterval(id);
    }, 120);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the script is fixed; a new run restarts it
  }, [run]);
  return [0, 1].map((i) => ({ text: words[i].slice(0, shown[i]).join(""), streaming: shown[i] < words[i].length }));
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AnswerArena } = ui;
  const [run, setRun] = useState(0);
  const [vote, setVote] = useState<ArenaVote | null>(null);
  const [a, b] = useDuel(run);

  return (
    <div style={{ width: "100%", maxWidth: 820, display: "grid", gap: 8 }}>
      <AnswerArena
        prompt={PROMPT}
        blind
        answers={[
          { model: A.model, answer: a.text, streaming: a.streaming, meta: A.meta },
          { model: B.model, answer: b.text, streaming: b.streaming, meta: B.meta },
        ]}
        value={vote}
        onChange={setVote}
      />
      <div style={{ ...caption, textAlign: "center", minHeight: 18 }}>
        {vote ? (
          <>
            {vote.winner === "tie" ? "Tie" : `${vote.winner === "a" ? A.model : B.model} wins`}
            {vote.reason ? ` · ${vote.reason}` : ""} ·{" "}
            <button
              type="button"
              style={textButton}
              onClick={() => {
                setVote(null);
                setRun((r) => r + 1);
              }}
            >
              Next matchup
            </button>
          </>
        ) : (
          "Blind mode – the model names show after you vote."
        )}
      </div>
    </div>
  );
}
