import { useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { ScoreSurveySubmit } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* Riverside Library's quarterly app survey. The NPS question starts answered with an 8, so the band's follow-up shows;
   the CSAT question underneath waits for a pick. Submit swaps to the thank-you, and "Ask again" resets both. */

const FOLLOW_UPS = {
  detractor: "What would make the app more useful to you?",
  passive: "What's one thing we could do better?",
  promoter: "What do you like most about the app?",
};

export default function Demo({ ui }: { ui: typeof UI }) {
  const { ScoreSurvey } = ui;
  const [score, setScore] = useState<number | null>(8);
  const [sent, setSent] = useState<ScoreSurveySubmit | null>(null);
  const [round, setRound] = useState(0);
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 12 }}>
      <ScoreSurvey
        key={`nps-${round}`}
        title="Riverside Library app"
        kind="nps"
        question="How likely are you to recommend the Riverside Library app to a friend?"
        score={score}
        onScoreChange={setScore}
        followUps={FOLLOW_UPS}
        dismissible
        submitted={!!sent}
        onSubmit={setSent}
        onEdit={() => setSent(null)}
      />
      <ScoreSurvey key={`csat-${round}`} title="Your last visit" kind="csat" question="How satisfied were you with booking a study room?" followUp="Tell us more (optional)" look="clean" />
      <div style={{ ...caption, textAlign: "center", minHeight: 18 }}>
        {sent ? `Sent ${sent.score}${sent.comment ? ` with "${sent.comment}"` : ""}. ` : "Pick a score, or type a number. "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            setScore(null);
            setSent(null);
            setRound((r) => r + 1);
          }}
        >
          Ask again
        </button>
      </div>
    </div>
  );
}
