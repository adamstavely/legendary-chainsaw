import { useEffect, useMemo, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { AgentCursor, DocBlock, DocComment, DocSuggestion } from "../../../src/elements/react";

/* A scripted session: three agents edit a launch brief together. The script is a pure function of a tick,
   so it loops cleanly; accepting/rejecting suggestions is layered on top as demo state. */

const TICK = 110;
const END = 250; // last scripted tick
const LOOP = 300; // hold the end state a little, then restart

const IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c7d2fe"/><stop offset="1" stop-color="#fbcfe8"/></linearGradient></defs><rect width="320" height="180" fill="url(#g)"/><g fill="#6366f1" opacity=".75"><rect x="40" y="110" width="28" height="40" rx="4"/><rect x="84" y="90" width="28" height="60" rx="4"/><rect x="128" y="70" width="28" height="80" rx="4"/><rect x="172" y="52" width="28" height="98" rx="4"/><rect x="216" y="34" width="28" height="116" rx="4"/></g></svg>`,
  );

const P1 = "Orbit 2.0 ships on March 12 with offline sync, a faster editor and a brand new sharing model for teams of every size.";
const P2 = "Early customers report that onboarding takes roughly half as long as before, mostly thanks to the guided setup.";
const CODE = "if (plan.seats == 0) {\n  return upgradePrompt();\n}";

const S1_INSERT = "every team";
const S1_AT = P1.indexOf("teams of every size");
const S1_REMOVE = "teams of every size".length;
const S2_INSERT = "===";
const S2_AT = CODE.indexOf("==");
const C1_TEXT = "Can we cite the survey here? 41% faster in the March cohort.";

const baseBlocks = (imgLoading: boolean, imgWidth: number): DocBlock[] => [
  { id: "title", kind: "title", text: "Orbit 2.0 launch brief" },
  { id: "p1", kind: "paragraph", text: P1 },
  { id: "h1", kind: "heading", text: "What changed" },
  { id: "p2", kind: "paragraph", text: P2 },
  { id: "img", kind: "image", src: IMG, alt: "Adoption chart", text: "Weekly active teams, last five weeks", width: imgWidth, ratio: 16 / 9, loading: imgLoading },
  { id: "code", kind: "code", text: CODE },
];

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp(t, 0, 1);

function script(t: number) {
  const cursors: Record<string, AgentCursor | null> = {};
  const suggestions: DocSuggestion[] = [];
  const comments: DocComment[] = [];

  // --- Mira (editor): selects a phrase, then rewrites it as a suggestion, letter by letter
  if (t < 12) cursors.mira = { block: "title", at: 6, doing: "Reading the brief" };
  else if (t < 24) cursors.mira = { block: "p1", at: S1_AT, doing: "Tightening the wording" };
  else if (t < 40) cursors.mira = { block: "p1", at: S1_AT, select: Math.round(lerp(0, S1_REMOVE, (t - 24) / 10)), doing: "Tightening the wording" };
  else {
    const typed = clamp(Math.floor((t - 40) / 2), 0, S1_INSERT.length);
    suggestions.push({ id: "s1", agent: "mira", block: "p1", at: S1_AT, remove: S1_REMOVE, insert: S1_INSERT.slice(0, typed), note: "Shorter, and reads better aloud" });
    if (typed < S1_INSERT.length) cursors.mira = { block: "p1", at: typed, in: "s1", typing: true, doing: "Suggesting an edit" };
    else if (t < 120) cursors.mira = { block: "p2", at: 0, doing: "Reading on" };
    else if (t < 140) cursors.mira = { block: "p2", at: P2.indexOf("half"), select: 4, doing: "Checking the claim" };
    else cursors.mira = { block: "h1", at: 4, doing: "Waiting for review" };
  }

  // --- Theo (analyst): resizes the chart, then writes a comment
  const imgLoading = t < 26;
  let imgWidth = 1;
  if (t < 30) cursors.theo = { block: "img", doing: imgLoading ? "Rendering the chart" : "Looking at the chart" };
  else if (t < 60) {
    imgWidth = lerp(1, 0.62, (t - 34) / 22);
    cursors.theo = { block: "img", point: "corner", select: 1, press: t >= 34, doing: "Resizing the chart" };
  } else if (t < 72) {
    imgWidth = 0.62;
    cursors.theo = { block: "p2", at: P2.indexOf("roughly"), doing: "Looking for a source" };
  } else {
    imgWidth = 0.62;
    const typed = clamp(Math.floor((t - 76) * 1.2), 0, C1_TEXT.length);
    const writing = t >= 76 && typed < C1_TEXT.length;
    if (t >= 76) comments.push({ id: "c1", agent: "theo", block: "p2", at: P2.indexOf("half"), text: C1_TEXT.slice(0, typed), open: writing });
    cursors.theo = writing ? { block: "c1", at: typed, typing: true, doing: "Leaving a comment" } : t < 76 ? { block: "p2", at: P2.indexOf("half"), doing: "Leaving a comment" } : { block: "img", doing: "Watching usage" };
  }

  // --- Ada (engineer): arrives late and fixes the snippet
  if (t < 90) cursors.ada = null;
  else if (t < 110) cursors.ada = { block: "code", at: 0, doing: "Reviewing the snippet" };
  else if (t < 122) cursors.ada = { block: "code", at: S2_AT, select: 2, doing: "Loose equality" };
  else {
    const typed = clamp(Math.floor((t - 122) / 3), 0, S2_INSERT.length);
    suggestions.push({ id: "s2", agent: "ada", block: "code", at: S2_AT, remove: 2, insert: S2_INSERT.slice(0, typed), note: "Strict comparison – seats can be the string \"0\" from the API" });
    if (typed < S2_INSERT.length) cursors.ada = { block: "code", at: typed, in: "s2", typing: true, doing: "Fixing the check" };
    else if (t < 190) cursors.ada = { block: "code", at: CODE.indexOf("upgradePrompt"), select: 13, doing: "Tracing upgradePrompt()" };
    else cursors.ada = { block: "title", at: 0, doing: "Done – 1 suggestion" };
  }

  if (t >= END - 10) {
    cursors.theo = null;
  }

  const cost = (start: number, rate: number) => Math.max(0, (t - start) * rate);
  return {
    blocks: baseBlocks(imgLoading, imgWidth),
    suggestions,
    comments,
    cursors,
    costs: { mira: 0.04 + cost(0, 0.0021), theo: 0.02 + cost(0, 0.0017), ada: cost(90, 0.0031) },
  };
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AgentCursors, acceptSuggestion } = ui;
  const [tick, setTick] = useState(0);
  const [accepted, setAccepted] = useState<string[]>([]);
  const [rejected, setRejected] = useState<string[]>([]);
  const [resolved, setResolved] = useState<string[]>([]);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [following, setFollowing] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % LOOP), TICK);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (tick === 0) {
      setAccepted([]);
      setRejected([]);
      setResolved([]);
      setReplies({});
    }
  }, [tick]);

  const t = Math.min(tick, END);
  const frame = useMemo(() => script(t), [t]);

  let blocks = frame.blocks;
  let suggestions = frame.suggestions.filter((s) => !rejected.includes(s.id));
  for (const id of accepted) ({ blocks, suggestions } = acceptSuggestion(blocks, suggestions, id));
  const cursors = { ...frame.cursors };
  // An agent typing into a suggestion that is gone just rests in the text
  for (const [k, c] of Object.entries(cursors)) {
    if (c?.in && !suggestions.some((s) => s.id === c.in)) cursors[k] = { ...c, in: undefined, typing: false };
  }
  const comments = frame.comments
    .filter((c) => !resolved.includes(c.id))
    .map((c) => (replies[c.id] ? { ...c, text: `${c.text}\n\n↳ You: ${replies[c.id]}` } : c));

  const agents = [
    { id: "mira", name: "Mira", color: "#7c5cff", cost: frame.costs.mira },
    { id: "theo", name: "Theo", color: "#0ea5e9", cost: frame.costs.theo },
    { id: "ada", name: "Ada", color: "#f97316", cost: frame.costs.ada },
  ];

  return (
    <div style={{ width: "100%", maxWidth: 720 }}>
      <AgentCursors
        title="Orbit 2.0 launch brief"
        agents={agents}
        blocks={blocks}
        suggestions={suggestions}
        comments={comments}
        cursors={cursors}
        following={following}
        onFollowingChange={setFollowing}
        onAccept={(s) => setAccepted((a) => [...a, s.id])}
        onReject={(s) => setRejected((r) => [...r, s.id])}
        onAcceptAll={() => setAccepted((a) => [...a, ...suggestions.map((s) => s.id).filter((id) => !a.includes(id))])}
        onResolveComment={(c) => setResolved((r) => [...r, c.id])}
        onReply={(c, text) => setReplies((r) => ({ ...r, [c.id]: text }))}
        height={560}
      />
    </div>
  );
}
