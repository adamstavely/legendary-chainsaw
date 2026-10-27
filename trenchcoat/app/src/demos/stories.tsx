import { useEffect, useMemo, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { StoryPerson, StorySeen } from "../../../src/elements/react";
import { caption } from "../demo-kit";

/* A product team's updates, as stories. Maya, Leo, Priya and Sam have something new (a gradient ring); Ana and Dev's
   have been seen (gray). Open one: items advance on their own, hold to pause, tap the sides or use ← → to step, and
   it moves on to the next person at the end. Every image is an inline SVG; Leo's clip is drawn on a canvas and
   recorded in the browser, so nothing loads from the network. */

const svgUrl = (body: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice">${body}</svg>`)}`;
const scene = (top: string, bottom: string, shapes: string) =>
  svgUrl(`<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="360" height="640" fill="url(#g)"/>${shapes}`);
const avatar = (a: string, b: string, skin: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="64" height="64" fill="url(#a)"/><circle cx="32" cy="26" r="11" fill="${skin}"/><path d="M12 64c2-14 10-21 20-21s18 7 20 21z" fill="${skin}"/></svg>`)}`;

const SUNRISE = scene("#ffb36b", "#6a3fb8", `<circle cx="250" cy="250" r="70" fill="#ffe2a8"/><path d="M0 430 Q90 360 180 420 T360 400 V640 H0z" fill="#3a2a6b"/><path d="M0 500 Q120 440 240 500 T360 480 V640 H0z" fill="#22184a"/>`);
const BOARD = scene("#e9eef7", "#c9d4e8", `<rect x="40" y="120" width="280" height="360" rx="18" fill="#ffffff"/><rect x="64" y="150" width="100" height="70" rx="10" fill="#ffd36e"/><rect x="180" y="150" width="116" height="70" rx="10" fill="#9fd3ff"/><rect x="64" y="236" width="232" height="70" rx="10" fill="#c4b5fd"/><rect x="64" y="322" width="150" height="70" rx="10" fill="#86efac"/><rect x="226" y="322" width="70" height="70" rx="10" fill="#fda4af"/>`);
const DESK = scene("#2b3a55", "#101626", `<rect x="50" y="300" width="260" height="170" rx="14" fill="#3b4c6e"/><rect x="66" y="316" width="228" height="136" rx="8" fill="#7dd3fc"/><rect x="150" y="470" width="60" height="40" fill="#3b4c6e"/><rect x="110" y="510" width="140" height="12" rx="6" fill="#3b4c6e"/><circle cx="292" cy="190" r="34" fill="#fde68a" opacity="0.85"/>`);
const PEAKS = scene("#7cc6ff", "#e0f2fe", `<path d="M0 470 L110 300 L190 420 L270 270 L360 410 V640 H0z" fill="#3f6b8f"/><path d="M110 300 L135 340 L95 330z M270 270 L295 312 L252 305z" fill="#ffffff"/><path d="M0 540 Q180 480 360 540 V640 H0z" fill="#2f5470"/>`);
const SPRINT = scene("#0f766e", "#134e4a", `<circle cx="180" cy="300" r="120" fill="none" stroke="#5eead4" stroke-width="18" stroke-dasharray="560 760" stroke-linecap="round" transform="rotate(-90 180 300)"/><circle cx="180" cy="300" r="120" fill="none" stroke="#ffffff" stroke-opacity="0.15" stroke-width="18"/>`);

const PEOPLE: StoryPerson[] = [
  {
    id: "maya",
    name: "Maya Chen",
    avatar: avatar("#f472b6", "#8b5cf6", "#ffe1cc"),
    items: [
      { id: "maya-1", kind: "image", src: SUNRISE, text: "A sunrise over purple hills", at: "2h" },
      { id: "maya-2", kind: "text", text: "New onboarding is live for 10% of sign-ups. Watch the funnel with me this week.", tone: "violet", at: "1h" },
      { id: "maya-3", kind: "image", src: BOARD, text: "The onboarding board, five cards in colour", at: "40m" },
    ],
  },
  {
    id: "leo",
    name: "Leo Park",
    avatar: avatar("#38bdf8", "#2563eb", "#f1c7a0"),
    items: [
      { id: "leo-2", kind: "text", text: "Search now answers in under 200 ms at p95.", tone: "teal", duration: 4000, at: "3h" },
    ],
  },
  {
    id: "priya",
    name: "Priya Shah",
    items: [
      { id: "priya-1", kind: "image", src: DESK, text: "A desk with a monitor at night", at: "5h" },
      { id: "priya-2", kind: "text", text: "On call until Friday. Page me for anything in billing.", tone: "amber", at: "4h" },
    ],
  },
  {
    id: "sam",
    name: "Sam Okafor",
    avatar: avatar("#fbbf24", "#f97316", "#8d5a3b"),
    items: [
      { id: "sam-1", kind: "image", src: SPRINT, text: "A progress ring, three-quarters full", at: "6h" },
      { id: "sam-2", kind: "text", text: "Sprint 14 is 74% done with two days to go.", tone: "blue", at: "6h" },
    ],
  },
  {
    id: "ana",
    name: "Ana Ruiz",
    avatar: avatar("#34d399", "#0d9488", "#c68a62"),
    items: [{ id: "ana-1", kind: "image", src: PEAKS, text: "Snowy peaks under a blue sky", at: "Yesterday" }],
  },
  {
    id: "dev",
    name: "Dev Patel",
    items: [
      { id: "dev-1", kind: "text", text: "Retro notes are in the team folder.", tone: "rose", at: "Yesterday" },
      { id: "dev-2", kind: "text", text: "Thanks for the kind words on the release.", tone: "pink", at: "Yesterday" },
    ],
  },
];
const START_SEEN = new Set(["priya-1", "ana-1", "dev-1", "dev-2"]);

/** Records a 3-second clip of a canvas animation, so the demo can show a video without loading one */
function recordClip(): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 360;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");
  if (typeof MediaRecorder === "undefined" || !ctx || typeof canvas.captureStream !== "function") return Promise.reject(new Error("unsupported"));
  const type = ["video/webm;codecs=vp9", "video/webm", "video/mp4"].find((t) => MediaRecorder.isTypeSupported(t));
  if (!type) return Promise.reject(new Error("unsupported"));
  const recorder = new MediaRecorder(canvas.captureStream(30), { mimeType: type });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => chunks.push(e.data);
  let raf = 0;
  let start = 0;
  const draw = (t: number) => {
    start ||= t;
    const k = (t - start) / 3000;
    const g = ctx.createLinearGradient(0, 0, 0, 640);
    g.addColorStop(0, "#0ea5e9");
    g.addColorStop(1, "#1e1b4b");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 360, 640);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = `rgba(255,255,255,${0.25 + i * 0.12})`;
      ctx.beginPath();
      ctx.arc(60 + i * 60, 320 + Math.sin(k * Math.PI * 4 + i) * 60, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);
  recorder.start();
  return new Promise((resolve) => {
    recorder.onstop = () => {
      cancelAnimationFrame(raf);
      resolve(URL.createObjectURL(new Blob(chunks, { type })));
    };
    setTimeout(() => recorder.stop(), 3000);
  });
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Stories } = ui;
  const [seen, setSeen] = useState<StorySeen>(START_SEEN);
  const [clip, setClip] = useState("");
  const [note, setNote] = useState("Open a story – hold to pause, tap the sides or use ← → to step.");
  useEffect(() => {
    let url = "";
    let live = true;
    recordClip().then(
      (u) => {
        if (live) setClip((url = u));
        else URL.revokeObjectURL(u);
      },
      () => {},
    );
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, []);
  // Leo's clip joins his stories once it's recorded (browsers without MediaRecorder show his text card only)
  const people = useMemo(
    () => (clip ? PEOPLE.map((p) => (p.id === "leo" ? { ...p, items: [{ id: "leo-1", kind: "video" as const, src: clip, text: "Dots bobbing on a blue gradient", duration: 3000, at: "3h" }, ...p.items] } : p)) : PEOPLE),
    [clip],
  );
  const fresh = people.filter((p) => p.items.some((i) => !(seen as Set<string>).has(i.id))).length;
  return (
    <div style={{ width: "100%", maxWidth: 560, display: "grid", gap: 8 }}>
      <Stories
        people={people}
        seen={seen}
        onSeenChange={(next, item, person) => {
          setSeen(next);
          setNote(`Seen: ${person.name}, ${person.items.indexOf(item) + 1} of ${person.items.length}.`);
        }}
        onAdd={() => setNote("Add story – the app opens its camera or file picker here.")}
        onReply={(text, _item, person) => setNote(`Reply to ${person.name}: “${text}”`)}
      />
      <div style={{ ...caption, display: "grid", gap: 2 }}>
        <span>{fresh === 1 ? "1 person has something new." : `${fresh} people have something new.`}</span>
        <span>{note}</span>
      </div>
    </div>
  );
}
