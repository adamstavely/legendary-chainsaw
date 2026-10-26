import { useEffect, useState } from "react";
import type * as UI from "@components/ai-answer";
import type { AnswerSource } from "@components/ai-answer";
import { caption } from "../demo-kit";

const Tile = ({ bg, ch }: { bg: string; ch: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <rect width="16" height="16" rx="4" fill={bg} />
    <text x="8" y="11.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff" fontFamily="system-ui, sans-serif">{ch}</text>
  </svg>
);

const SOURCES: AnswerSource[] = [
  {
    title: "Remote work policy (2026)",
    name: "Notion",
    href: "https://www.notion.so",
    icon: <Tile bg="#111" ch="N" />,
    snippet: "Employees may work from another country for up to 30 working days per calendar year, with manager approval.",
  },
  {
    title: "Re: Working from Lisbon in December",
    name: "Slack",
    href: "https://slack.com",
    icon: <Tile bg="#4a154b" ch="S" />,
    snippet: "HR here – stays over 30 days need a tax check first, because of permanent-establishment risk.",
  },
  {
    title: "Travel & equipment guidelines",
    name: "Google Drive",
    href: "https://drive.google.com",
    icon: <Tile bg="#1a73e8" ch="D" />,
    snippet: "Company laptops may be taken abroad. VPN must be on at all times outside the office network.",
  },
];

type QA = { question: string; answer: string; followUps: string[] };

const QAS: QA[] = [
  {
    question: "Can I work from abroad for a few weeks?",
    answer:
      "Yes – you can work from another country for **up to 30 working days a year**, as long as your manager approves it [1].\n\nA few things to sort out first:\n- Stays longer than 30 days need a **tax check with HR** before you go [2]\n- You can bring your company laptop, but keep the VPN on the whole time [3]\n- Tell your team which time zone you'll be in\n\nIf you're planning more than a month, start the HR check early – it usually takes about two weeks [2].",
    followUps: ["How do I request manager approval?", "Which countries need a tax check?", "Can I use my own laptop instead?"],
  },
  {
    question: "How do I request manager approval?",
    answer:
      "Send your manager a short request in the **#time-off** workflow with the dates and the country [1]. Approval usually comes within two working days.\n\nIf the stay is longer than 30 days, attach the HR tax check to the same request [2].",
    followUps: ["Which countries need a tax check?", "Can I use my own laptop instead?"],
  },
];

/** Feeds the answer in a few words at a time, like a model streaming its reply */
function useStream(text: string) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    const words = text.match(/\S+\s*/g) ?? [];
    let i = 0;
    // wait for the sources to pop in before the first chunk
    let id = 0;
    const start = window.setTimeout(() => {
      id = window.setInterval(() => {
        i = Math.min(words.length, i + 3 + Math.floor(Math.random() * 4));
        setShown(words.slice(0, i).join(""));
        if (i >= words.length) window.clearInterval(id);
      }, 160);
    }, 900);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(id);
    };
  }, [text]);
  return { shown, streaming: shown.length < text.length };
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AIAnswer } = ui;
  const [index, setIndex] = useState(0);
  const [note, setNote] = useState("");
  const qa = QAS[index];
  const { shown, streaming } = useStream(qa.answer);

  return (
    <div style={{ width: "100%", maxWidth: 600, display: "grid", gap: 8 }}>
      <AIAnswer
        question={qa.question}
        sources={SOURCES}
        answer={shown}
        streaming={streaming}
        followUps={qa.followUps}
        onFollowUp={(q) => {
          const next = QAS.findIndex((x) => x.question === q);
          setIndex(next >= 0 ? next : 0);
          setNote(next >= 0 ? "" : `“${q}” – this demo loops back to the first answer.`);
        }}
        onFeedback={(v, reason) => setNote(v === "up" ? "Thanks for the feedback." : `Feedback: ${reason ?? "thumbs down"}`)}
        onCopy={() => setNote("Copied with sources.")}
      />
      <div style={{ ...caption, textAlign: "center", minHeight: 16 }}>{note}</div>
    </div>
  );
}
