import { useEffect, useId, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { LiveViewAction, LiveViewControl } from "../../../src/elements/react";
import { caption, textButton } from "../demo-kit";

/* An agent books a table on a (made-up) reservations site. The "screen" is a mock browser drawn in SVG at 960×600 –
   the actions are in the same pixels. The script steps through frames with one timeout at a time, and stops while
   paused, while you have control, and at the end. */

type Page = {
  view: "search" | "venue" | "booked";
  query: string;
  focus: boolean;
  suggest: boolean;
  scroll: number;
  party?: number;
  date?: string;
  time?: string;
  pressed?: "suggest" | "reserve";
};
type Frame = { ms: number; step: number; actions: LiveViewAction[]; page: Page; ended?: boolean };

const QUERY = "Lupa Osteria";
const PARTY = [2, 3, 4, 5, 6];
const DATES = ["Thu 29", "Fri 30", "Sat 31"];
const TIMES = ["6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM"];
const SCROLL = 160;
const STEPS = 8;

function build(): Frame[] {
  const out: Frame[] = [];
  let actions: LiveViewAction[] = [];
  let page: Page = { view: "search", query: "", focus: false, suggest: false, scroll: 0 };
  let n = 0;
  const push = (ms: number, step: number, action?: Omit<LiveViewAction, "id">, patch?: Partial<Page>, ended = false) => {
    if (action) actions = [...actions.slice(-4), { id: `a${n++}`, ...action }];
    if (patch) page = { ...page, ...patch };
    out.push({ ms, step, actions, page, ended });
  };
  push(500, 1, { kind: "move", x: 480, y: 170, caption: "Opening tablefor.app" });
  push(600, 2, { kind: "click", x: 300, y: 264, caption: "Searching for the restaurant" }, { focus: true });
  for (let i = 1; i <= QUERY.length; i++) push(140, 2, { kind: "type", x: 300, y: 264, text: QUERY.slice(0, i), caption: "Searching for the restaurant" }, { query: QUERY.slice(0, i), suggest: i >= 3 });
  push(600, 3, { kind: "click", x: 420, y: 322, caption: "Opening Lupa Osteria" }, { pressed: "suggest" });
  push(500, 3, undefined, { view: "venue", pressed: undefined, focus: false });
  push(900, 4, { kind: "scroll", x: 640, y: 380, delta: SCROLL, caption: "Finding the booking form" }, { scroll: SCROLL });
  push(800, 5, { kind: "click", x: 60 + 2 * 64 + 26, y: 374 - SCROLL, caption: "Choosing a party of 4" }, { party: 4 });
  push(800, 6, { kind: "click", x: 60 + 104 + 46, y: 448 - SCROLL, caption: "Picking Friday, October 30" }, { date: "Fri 30" });
  push(800, 7, { kind: "click", x: 60 + 104 + 46, y: 518 - SCROLL, caption: "Taking the 7:00 PM table" }, { time: "7:00 PM" });
  push(800, 8, { kind: "click", x: 170, y: 592 - SCROLL, caption: "Reserving the table" }, { pressed: "reserve" });
  push(0, 8, { kind: "move", x: 480, y: 300, caption: "Booked: Friday, Oct 30 at 7:00 PM for 4" }, { view: "booked", pressed: undefined }, true);
  return out;
}
const SCRIPT = build();

const INK = "#111827";
const MUTED = "#6b7280";
const LINE = "#e5e7eb";
const BRAND = "#e11d48";
const FONT = "Inter, ui-sans-serif, system-ui, sans-serif";

function Chip({ x, y, w, label, on }: { x: number; y: number; w: number; label: string; on: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={36} rx={18} fill={on ? INK : "#fff"} stroke={on ? INK : "#d1d5db"} />
      <text x={x + w / 2} y={y + 23} textAnchor="middle" fontSize={14} fontWeight={500} fill={on ? "#fff" : INK}>{label}</text>
    </g>
  );
}

function MockPage({ page }: { page: Page }) {
  const s = page.scroll;
  const id = useId().replace(/:/g, "");
  const url = page.view === "search" ? "tablefor.app" : page.view === "venue" ? "tablefor.app/new-york/lupa-osteria" : "tablefor.app/bookings/LUP-4821";
  return (
    <svg viewBox="0 0 960 600" role="img" aria-label={`A browser showing ${url}`} fontFamily={FONT} style={{ background: "#fff" }}>
      <defs>
        <clipPath id={`${id}-page`}><rect x="0" y="76" width="960" height="524" /></clipPath>
        <linearGradient id={`${id}-hero`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fde68a" /><stop offset="1" stopColor="#fda4af" /></linearGradient>
      </defs>
      {/* Browser chrome */}
      <rect width="960" height="76" fill="#f3f4f6" />
      {["#f87171", "#fbbf24", "#34d399"].map((c, i) => <circle key={c} cx={22 + i * 18} cy={20} r={5.5} fill={c} />)}
      <path d="M84 36V14a6 6 0 0 1 6-6h204a6 6 0 0 1 6 6v22z" fill="#fff" />
      <text x={100} y={27} fontSize={12} fill={INK}>{page.view === "search" ? "tablefor – Find a table" : "Lupa Osteria · tablefor"}</text>
      <rect y="36" width="960" height="40" fill="#fff" />
      <path d="M26 56l-6-6 6-6M50 44l6 6-6 6" stroke={MUTED} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <rect x={84} y={44} width={792} height={24} rx={12} fill="#f3f4f6" />
      <path d="M100 55.5h7v6h-7zM101.5 55.5v-2a2 2 0 0 1 4 0v2" stroke={MUTED} strokeWidth={1.3} fill="none" />
      <text x={116} y={60.5} fontSize={12.5} fill="#374151">{url}</text>
      <line x1="0" x2="960" y1="75.5" y2="75.5" stroke={LINE} />

      <g clipPath={`url(#${id}-page)`}>
        {page.view === "search" && (
          <g>
            <text x={60} y={124} fontSize={20} fontWeight={700} fill={BRAND}>tablefor</text>
            <text x={900} y={122} fontSize={14} textAnchor="end" fill={INK}>Sign in</text>
            <text x={480} y={206} fontSize={30} fontWeight={700} textAnchor="middle" fill={INK}>Find a table</text>
            <rect x={250} y={240} width={460} height={48} rx={10} fill="#fff" stroke={page.focus ? BRAND : "#d1d5db"} strokeWidth={page.focus ? 2 : 1} />
            <text x={272} y={270} fontSize={16} fill={page.query ? INK : "#9ca3af"}>{page.query || "Restaurant, cuisine or neighborhood"}</text>
            <text x={60} y={392} fontSize={16} fontWeight={600} fill={INK}>Popular tonight</text>
            {[["Osteria Nove", "Italian · West Village", "#fecaca"], ["Little Fern", "Vegetarian · Nolita", "#bbf7d0"], ["Saltwater", "Seafood · Tribeca", "#bfdbfe"]].map(([name, meta, c], i) => (
              <g key={name} transform={`translate(${60 + i * 286} 410)`}>
                <rect width={268} height={110} rx={10} fill={c} />
                <text y={142} fontSize={15} fontWeight={600} fill={INK}>{name}</text>
                <text y={162} fontSize={13} fill={MUTED}>{meta}</text>
              </g>
            ))}
            {page.suggest && (
              <g>
                <rect x={250} y={294} width={460} height={58} rx={10} fill="#fff" stroke={LINE} />
                <rect x={256} y={300} width={448} height={46} rx={7} fill={page.pressed === "suggest" ? "#ffe4e6" : "#f9fafb"} />
                <text x={272} y={320} fontSize={15} fontWeight={600} fill={INK}>Lupa Osteria</text>
                <text x={272} y={338} fontSize={12.5} fill={MUTED}>Italian · Greenwich Village · ★ 4.7</text>
              </g>
            )}
          </g>
        )}
        {page.view === "venue" && (
          <g transform={`translate(0 ${-s})`} style={{ transition: "transform 420ms ease" }}>
            <rect x={0} y={76} width={960} height={160} fill={`url(#${id}-hero)`} />
            <text x={60} y={290} fontSize={28} fontWeight={700} fill={INK}>Lupa Osteria</text>
            <text x={60} y={316} fontSize={14} fill={MUTED}>Italian · $$ · Greenwich Village · ★ 4.7 (2,318)</text>
            <text x={60} y={348} fontSize={13} fontWeight={600} fill={INK}>Party size</text>
            {PARTY.map((p, i) => <Chip key={p} x={60 + i * 64} y={356} w={52} label={p === 6 ? "6+" : String(p)} on={page.party === p} />)}
            <text x={60} y={420} fontSize={13} fontWeight={600} fill={INK}>Date</text>
            {DATES.map((d, i) => <Chip key={d} x={60 + i * 104} y={430} w={92} label={d} on={page.date === d} />)}
            <text x={60} y={490} fontSize={13} fontWeight={600} fill={INK}>Time</text>
            {TIMES.map((t, i) => <Chip key={t} x={60 + i * 104} y={500} w={92} label={t} on={page.time === t} />)}
            <rect x={60} y={570} width={220} height={44} rx={10} fill={page.pressed === "reserve" ? "#be123c" : BRAND} />
            <text x={170} y={598} fontSize={15} fontWeight={600} textAnchor="middle" fill="#fff">Reserve table</text>
            <text x={600} y={348} fontSize={13} fontWeight={600} fill={INK}>About</text>
            {[0, 1, 2, 3].map((r) => <rect key={r} x={600} y={362 + r * 18} width={r === 3 ? 180 : 300} height={8} rx={4} fill="#f3f4f6" />)}
            <rect x={600} y={448} width={300} height={166} rx={10} fill="#eef2f7" />
            <circle cx={750} cy={526} r={9} fill={BRAND} />
          </g>
        )}
        {page.view === "booked" && (
          <g>
            <circle cx={480} cy={250} r={34} fill="#dcfce7" />
            <path d="M465 251l10 10 20-21" stroke="#16a34a" strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <text x={480} y={330} fontSize={26} fontWeight={700} textAnchor="middle" fill={INK}>You're booked</text>
            <text x={480} y={360} fontSize={15} textAnchor="middle" fill={MUTED}>Lupa Osteria · Fri, Oct 30 · 7:00 PM · 4 people</text>
            <text x={480} y={388} fontSize={13} textAnchor="middle" fill={MUTED}>Confirmation LUP-4821</text>
          </g>
        )}
      </g>
    </svg>
  );
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { LiveView } = ui;
  const [at, setAt] = useState(0);
  const [paused, setPaused] = useState(false);
  const [control, setControl] = useState<LiveViewControl>("agent");
  const [note, setNote] = useState("");
  const frame = SCRIPT[at];
  const done = at >= SCRIPT.length - 1;

  useEffect(() => {
    if (done || paused || control === "user") return;
    const id = setTimeout(() => setAt((n) => n + 1), frame.ms);
    return () => clearTimeout(id);
  }, [at, done, paused, control, frame.ms]);

  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gap: 10 }}>
      <LiveView
        title="Book a table for 4 at Lupa, Friday 7 PM"
        agent="Operator"
        frameWidth={960}
        frameHeight={600}
        actions={frame.actions}
        step={frame.step}
        steps={STEPS}
        ended={!!frame.ended}
        paused={paused}
        onPausedChange={setPaused}
        control={control}
        onControlChange={(c) => {
          setControl(c);
          setNote(c === "user" ? "The screen is yours – click anywhere on it." : "");
        }}
        onScreenClick={(p) => setNote(`You clicked at ${p.x}, ${p.y} – the app forwards it to the agent's browser.`)}
        screen={<MockPage page={frame.page} />}
      />
      <div style={{ ...caption, textAlign: "center", minHeight: 18 }}>
        {done ? (
          <>
            Booked in 8 steps.{" "}
            <button type="button" style={textButton} onClick={() => setAt(0)}>
              Watch again
            </button>
          </>
        ) : (
          note
        )}
      </div>
    </div>
  );
}
