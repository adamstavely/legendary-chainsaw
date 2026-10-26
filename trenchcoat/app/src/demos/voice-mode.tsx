import { useEffect, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { VoiceModeState, VoiceTurn } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

const OPENING: VoiceTurn[] = [
  { id: "u1", role: "user", text: "Can you move my three o'clock with Priya to tomorrow morning?" },
  { id: "a1", role: "assistant", text: "Sure – tomorrow at 9:30 is free for both of you. Should I send her the new invite?" },
];
/** The exchange the demo plays: the person answers, the assistant thinks and replies */
const SCRIPT: { role: VoiceTurn["role"]; text: string }[] = [
  { role: "user", text: "Yes, and add a note that I'll bring the Q3 numbers." },
  { role: "assistant", text: "Done. Priya has the invite for 9:30 tomorrow, with a note that you're bringing the Q3 numbers. Anything else?" },
];

/** Plays the script once: words stream in, the state follows – then it stops (no timers left running) */
function useConversation() {
  const [turns, setTurns] = useState<VoiceTurn[]>(OPENING);
  const [state, setState] = useState<VoiceModeState>("listening");
  const [run, setRun] = useState(0);
  const timers = useRef<number[]>([]);
  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => {
    if (run < 0) return;
    let at = 700;
    const later = (fn: () => void, wait: number) => {
      at += wait;
      timers.current.push(window.setTimeout(fn, at));
    };
    SCRIPT.forEach((line, n) => {
      const id = `s${run}-${n}`;
      const words = line.text.split(" ");
      if (line.role === "assistant") {
        later(() => setState("thinking"), 0);
        later(() => setState("speaking"), 1100);
      } else later(() => setState("listening"), 0);
      words.forEach((_, i) =>
        later(() => {
          const text = words.slice(0, i + 1).join(" ");
          setTurns((all) => [...all.filter((t) => t.id !== id), { id, role: line.role, text, partial: true }]);
        }, line.role === "user" ? 230 : 190),
      );
      later(() => setTurns((all) => all.map((t) => (t.id === id ? { ...t, partial: false } : t))), 400);
    });
    later(() => setState("listening"), 300);
    return clear;
  }, [run]);

  return {
    turns,
    state,
    /** Stop the assistant: what it said so far stays as a finished turn */
    interrupt: () => {
      clear();
      setTurns((all) => all.map((t) => (t.partial ? { ...t, text: `${t.text} –`, partial: false } : t)));
      setState("listening");
    },
    end: () => {
      clear();
      setTurns((all) => all.map((t) => (t.partial ? { ...t, partial: false } : t)));
      setState("idle");
      setRun(-1);
    },
    restart: () => {
      clear();
      setTurns(OPENING);
      setState("listening");
      setRun((r) => Math.abs(r) + 1);
    },
  };
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { VoiceMode } = ui;
  const talk = useConversation();
  const [note, setNote] = useState("");
  const ended = talk.state === "idle";

  return (
    <div style={{ width: "100%", maxWidth: 420, display: "grid", gap: 8 }}>
      <VoiceMode
        name="Atlas"
        state={talk.state}
        turns={talk.turns}
        onMutedChange={(m) => setNote(m ? "Muted – Atlas can't hear you." : "")}
        onInterrupt={() => {
          talk.interrupt();
          setNote("Interrupted – Atlas stopped talking.");
        }}
        onEnd={() => {
          talk.end();
          setNote("");
        }}
      />
      <div style={{ ...caption, textAlign: "center", minHeight: 18 }}>
        {ended ? (
          <>
            Call ended.{" "}
            <button type="button" style={textButton} onClick={() => talk.restart()}>
              Start again
            </button>
          </>
        ) : (
          note || (
            <>
              <button type="button" style={textButton} onClick={() => talk.restart()}>
                Replay
              </button>{" "}
              · Esc interrupts while Atlas speaks
            </>
          )
        )}
      </div>
    </div>
  );
}
