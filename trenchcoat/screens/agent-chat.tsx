"use client";

/*
 * Agent Chat – a chat with an orchestrating agent and a brief beside it, in a single file.
 * The thread shows the agent's answer and which agents are working; the composer sits at the bottom.
 * On the right a brief to fill in: selling angle, palette and formats, then one button to generate.
 * className, other DOM props and `ref` go to the App Shell's root.
 * Imports: App Shell (app-shell.tsx) and the composer and thread of Assistant Home (assistant-home.tsx) from
 * Trenchcoat screens; Button from Trenchcoat components; icons from lucide-react 1.55.0.
 */

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type CSSProperties } from "react";
import {
  BrainIcon,
  CalendarIcon,
  ChartColumnBigIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  ClipboardListIcon,
  createLucideIcon,
  DollarSignIcon,
  EllipsisIcon,
  FolderIcon,
  HouseIcon,
  ImageIcon,
  ListChecksIcon,
  MapPinIcon,
  MegaphoneIcon,
  MessageCircleMoreIcon,
  PaletteIcon,
  PanelRightIcon,
  PencilLineIcon,
  PinIcon,
  Share2Icon,
  ShirtIcon,
  ShoppingBagIcon,
  SparklesIcon,
  TargetIcon,
  TrashIcon,
  UsersIcon,
  WorkflowIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessages, Composer, useChatThread, type ChatReply } from "@/components/ui/assistant-home";
import { AppShell, Dropdown, Icon, Tabs, type AppShellProps, type ShellGroup, type ShellNavItem } from "@/components/ui/app-shell";

// Lucide dropped brand logos in 1.0; these two are its last brand glyphs (ISC licence), so they match the set
const FacebookIcon = createLucideIcon("Facebook", [["path", { d: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z", key: "1jg4f8" }]]);
const InstagramIcon = createLucideIcon("Instagram", [
  ["rect", { width: "20", height: "20", x: "2", y: "2", rx: "5", ry: "5", key: "2e1cvw" }],
  ["path", { d: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z", key: "9exkf1" }],
  ["line", { x1: "17.5", x2: "17.51", y1: "6.5", y2: "6.5", key: "r4j83e" }],
]);

/** Sample content – replace with your own data */
const nav: ShellNavItem[] = [
  { label: "Home", icon: HouseIcon },
  { label: "Chat", icon: MessageCircleMoreIcon },
  { label: "Analytics", icon: ChartColumnBigIcon },
  { label: "Plan", icon: ClipboardListIcon },
  { label: "Deliverables", icon: FolderIcon },
];
const groups: ShellGroup[] = [
  {
    label: "Tools",
    items: [
      { label: "Campaign", icon: MegaphoneIcon },
      { label: "Creatives", icon: ImageIcon },
      { label: "Briefs", icon: ListChecksIcon },
      { label: "Workflows", icon: WorkflowIcon },
    ],
  },
  { label: "Chats", items: [], empty: "No chats yet" },
];

const agents = [
  { label: "Campaign manager", icon: MegaphoneIcon },
  { label: "Brand research", icon: TargetIcon },
  { label: "Creative pipeline", icon: PaletteIcon },
  { label: "Audience research", icon: UsersIcon },
  { label: "Creative direction", icon: BrainIcon },
];

const angles = [
  { label: "Desire-driven", note: "The first warm evening", signal: 3 },
  { label: "Problem–solution", note: "Heat, itchy fabrics", signal: 2 },
  { label: "Social proof", note: "412 sold, top reviews", signal: 1 },
];
const palette = [
  { name: "Sand", hex: "#e3d3b8" },
  { name: "Olive", hex: "#7c8458" },
  { name: "Off-white", hex: "#f4f1ea" },
  { name: "Ink", hex: "#1f2328" },
];
const formats = [
  { label: "Feed", ratio: "1 / 1" },
  { label: "Story", ratio: "9 / 16" },
  { label: "Banner", ratio: "16 / 9" },
];
const sections = ["Brief", "Assets", "Activity"];
const ads = [
  { title: "The first warm evening", format: "Feed", channel: "Instagram", ratio: "1 / 1", bg: "#e3d3b8", ink: "#1f2328" },
  { title: "Made for July", format: "Story", channel: "Instagram", ratio: "1 / 1", bg: "#7c8458", ink: "#f4f1ea" },
  { title: "Linen, finally", format: "Feed", channel: "Instagram", ratio: "1 / 1", bg: "#f4f1ea", ink: "#1f2328" },
  { title: "412 people can't be wrong", format: "Story", channel: "Instagram", ratio: "1 / 1", bg: "#1f2328", ink: "#f4f1ea" },
  { title: "Breathe out", format: "Banner", channel: "Facebook", ratio: "1 / 1", bg: "#c9b48f", ink: "#1f2328" },
  { title: "Summer, unbuttoned", format: "Feed", channel: "Instagram", ratio: "1 / 1", bg: "#a3a77f", ink: "#1f2328" },
];
const audience = ["Women 25–34", "Urban", "Warm climates", "Linen & natural fabrics"];
const channels = [
  { label: "Instagram", note: "Feed and Stories", icon: InstagramIcon, on: true },
  { label: "Facebook", note: "Feed and Banner", icon: FacebookIcon, on: false },
];
const details = [
  { label: "Launch", value: "Mon, Jun 2", icon: CalendarIcon },
  { label: "Budget", value: "$2,400 / week", icon: DollarSignIcon },
  { label: "Markets", value: "US, UK, AU", icon: MapPinIcon },
];

type AgentChatScreenOwnProps = Pick<AppShellProps, "onNavigate" | "workspace" | "user" | "className" | "ref">;
export type AgentChatScreenProps = Omit<ComponentPropsWithoutRef<"div">, keyof AgentChatScreenOwnProps> & AgentChatScreenOwnProps;

type Generated = "no" | "busy" | "yes";

export function AgentChatScreen(props: AgentChatScreenProps) {
  const [angle, setAngle] = useState(angles[0].label);
  const [section, setSection] = useState(sections[0]);
  const [briefOpen, setBriefOpen] = useState(true);
  const briefToggle = useRef<HTMLButtonElement>(null);
  const briefRef = useRef<HTMLElement>(null);
  // Closing the brief from inside it: focus goes back to the button that opens it, not to <body>
  const closeBrief = () => {
    if (briefRef.current?.contains(document.activeElement)) briefToggle.current?.focus();
    setBriefOpen(false);
  };
  const [pinned, setPinned] = useState(false);
  const [generated, setGenerated] = useState<Generated>("no");
  const thread = useRef<HTMLDivElement>(null);
  // On a narrow panel the brief opens as a layer over the chat, so it starts closed there
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if ((root.current?.offsetWidth ?? Infinity) <= 900) setBriefOpen(false);
  }, []);

  // Prepared answers of the orchestrator – they pick up the angle chosen in the brief
  const chat = useChatThread((prompt): ChatReply => ({
    steps: [
      { kind: "step", label: "Reading the brief" },
      { kind: "step", label: "Checking 412 orders of the Linen Overshirt" },
      { kind: "step", label: "Lining up the creative pipeline" },
    ],
    paragraphs: /angle|desire|problem|proof/i.test(prompt)
      ? [
          `Good call. I'll go with ${angle.toLowerCase()} – it fits the bestseller and the summer launch.`,
          "Copy will lead with the moment, the product follows; every ad ends on the same offer.",
          "Hit Generate ads in the brief when you're ready – six ads take about two minutes.",
        ]
      : [
          `Noted: “${prompt}”. I've added it to the brief for the creative pipeline.`,
          `The angle stays ${angle.toLowerCase()}; Brand research is checking that the copy stays on brand.`,
          "Anything else before I generate the ads?",
        ],
  }));

  // The sample pipeline takes a moment, then shows the ads – cleared if the screen goes away first
  useEffect(() => {
    if (generated !== "busy") return;
    const t = window.setTimeout(() => {
      setGenerated("yes");
      setSection("Assets");
    }, 1600);
    return () => window.clearTimeout(t);
  }, [generated]);
  const generate = () => setGenerated((g) => (g === "busy" ? g : "busy"));

  const [active, setActive] = useState(() => new Set(channels.filter((c) => c.on).map((c) => c.label)));
  const toggle = (label: string) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });

  return (
    <AppShell active="Chat" nav={nav} groups={groups} {...props}>
      <style href="ui-screen-agent-chat" precedence="default">
        {css}
      </style>
      <div ref={root} className="ui-as-chat" data-brief={briefOpen || undefined}>
        <section className="ui-as-chat__main">
          <header className="ui-as-chat__bar">
            <span className="ui-as-chat__crumbs">
              <Icon icon={MessageCircleMoreIcon} size={15} />
              Chat <i>/</i> <b>Generate on-brand creative</b>
              <Dropdown
                items={[
                  { label: pinned ? "Unpin chat" : "Pin chat", icon: PinIcon, onSelect: () => setPinned((p) => !p) },
                  { label: "Rename", icon: PencilLineIcon },
                  { label: "Share", icon: Share2Icon },
                  { label: "Delete chat", icon: TrashIcon, danger: true },
                ]}
                trigger={({ open, toggle }) => (
                  <button type="button" className="ui-as-icon-btn" aria-label="Chat options" aria-expanded={open} onClick={toggle}>
                    <Icon icon={EllipsisIcon} size={15} />
                  </button>
                )}
              />
            </span>
            <span className="ui-as-chat__tools">
              <button type="button" className="ui-as-icon-btn" aria-label="Tasks">
                <Icon icon={ListChecksIcon} size={16} />
              </button>
              <button
                ref={briefToggle}
                type="button"
                className="ui-as-icon-btn"
                aria-label={briefOpen ? "Hide brief" : "Show brief"}
                aria-pressed={briefOpen}
                onClick={() => (briefOpen ? closeBrief() : setBriefOpen(true))}
              >
                <Icon icon={PanelRightIcon} size={16} />
              </button>
            </span>
          </header>

          <div ref={thread} className="ui-as-chat__thread">
            <div className="ui-as-chat__column">
              <OpeningAnswer />
              <ChatMessages messages={chat.messages} name="Orchestrator" scroller={thread} onDone={chat.finish} />
            </div>
          </div>

          <div className="ui-as-chat__composer">
            <span className="ui-as-chat__route">
              <span className="ui-as-chat__avatar">
                <Icon icon={BrainIcon} size={12} />
              </span>
              <b>Orchestrator</b> Routes each request
            </span>
            <Composer placeholder="Ask anything or @ to add context" onSend={chat.send} busy={chat.busy} />
          </div>
        </section>

        {/* Narrow only: dims the chat behind the brief layer; a tap closes it */}
        {briefOpen && <div className="ui-as-chat__scrim" aria-hidden="true" onClick={closeBrief} />}
        {briefOpen && (
          <aside ref={briefRef} className="ui-as-brief" aria-label="Brief">
            <header className="ui-as-chat__bar">
              <span className="ui-as-chat__crumbs">
                Brief <i>/</i> <b>Summer launch</b>
              </span>
              <button type="button" className="ui-as-icon-btn" aria-label="Close brief" onClick={closeBrief}>
                <Icon icon={XIcon} size={15} />
              </button>
            </header>

            <div className="ui-as-brief__body">
              <Tabs className="ui-as-brief__seg" fullWidth label="Brief sections" items={sections} value={section} onChange={(s) => setSection(s as typeof section)} />
              {section === "Brief" && (
                <BriefForm key="brief" angle={angle} onAngle={setAngle} active={active} onToggle={toggle} generated={generated} onGenerate={generate} />
              )}
              {section === "Assets" && <BriefAssets key="assets" angle={angle} generated={generated} onGenerate={generate} />}
              {section === "Activity" && <BriefActivity key="activity" angle={angle} generated={generated} />}
            </div>
          </aside>
        )}
      </div>
    </AppShell>
  );
}

/** The orchestrator's first answer, already in the thread when the chat opens */
function OpeningAnswer() {
  return (
    <>
      <p className="ui-as-chat__user">Desire-driven</p>

      <div className="ui-as-chat__answer">
        <span className="ui-as-chat__who">
          <span className="ui-as-chat__avatar">
            <Icon icon={BrainIcon} size={12} />
          </span>
          Orchestrator
        </span>
        <p>I&apos;ll pull your bestseller first, then line up the creative generation.</p>
        <span className="ui-as-chat__worked">
          <Icon icon={ChevronRightIcon} size={13} />
          Worked for 3m 38s
        </span>
        <p>
          Your bestseller is the Linen Overshirt (the only product synced so far – Shopify is still importing, so
          treat that ranking as provisional).
        </p>
        <p>
          Before I brief and generate the ads, I need one thing I can&apos;t infer, because it drives the whole copy
          structure: how should we sell this shirt?
        </p>

        <span className="ui-as-chat__label">Agents working</span>
        <div className="ui-as-chat__agents">
          {agents.map((a, i) => (
            <span key={a.label} className="ui-as-chat__agent" data-active={i === 0 || undefined}>
              <Icon icon={a.icon} size={14} />
              {a.label}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

/** The brief itself: product, selling angle, audience, channels, palette and formats, details, then Generate */
function BriefForm({
  angle,
  onAngle,
  active,
  onToggle,
  generated,
  onGenerate,
}: {
  angle: string;
  onAngle: (angle: string) => void;
  /** Channels switched on */
  active: Set<string>;
  onToggle: (channel: string) => void;
  generated: Generated;
  onGenerate: () => void;
}) {
  const uid = useId();
  return (
    <div className="ui-as-brief__panel">
      <div className="ui-as-brief__product">
        <span className="ui-as-brief__thumb">
          <Icon icon={ShirtIcon} size={18} />
        </span>
        <span className="ui-as-brief__pinfo">
          <b>Linen Overshirt</b>
          <span>$89 · 412 sold this month</span>
        </span>
        <span className="ui-as-brief__chip">Bestseller</span>
      </div>

      <section className="ui-as-brief__section">
        <span className="ui-as-brief__label" id={`${uid}-angle`}>
          Selling angle
        </span>
        {/* A radio group with the APG keys: one tab stop, arrows move and pick */}
        <div
          role="radiogroup"
          aria-labelledby={`${uid}-angle`}
          className="ui-as-brief__options"
          onKeyDown={(e) => {
            const i = angles.findIndex((a) => a.label === angle);
            const next = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: angles.length - 1 }[e.key];
            if (next === undefined) return;
            e.preventDefault();
            const n = (next + angles.length) % angles.length;
            onAngle(angles[n].label);
            e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[n]?.focus();
          }}
        >
          {angles.map((a) => (
            <button
              key={a.label}
              type="button"
              role="radio"
              aria-checked={angle === a.label}
              tabIndex={angle === a.label ? 0 : -1}
              className="ui-as-brief__option"
              onClick={() => onAngle(a.label)}
            >
              <span className="ui-as-brief__radio" aria-hidden="true" />
              <span className="ui-as-brief__name">
                {a.label}
                <small>{a.note}</small>
              </span>
              <span className="ui-as-brief__signal" aria-hidden="true">
                {[1, 2, 3].map((n) => (
                  <i key={n} data-on={n <= a.signal || undefined} />
                ))}
              </span>
              <span className="ui-as-sr">Signal {a.signal} of 3</span>
            </button>
          ))}
        </div>
      </section>

      <section className="ui-as-brief__section">
        <span className="ui-as-brief__label">Audience</span>
        <div className="ui-as-brief__pills">
          {audience.map((a) => (
            <span key={a}>{a}</span>
          ))}
        </div>
      </section>

      <section className="ui-as-brief__section">
        <span className="ui-as-brief__label">Channels</span>
        {channels.map((c) => (
          <label key={c.label} className="ui-as-brief__channel">
            <Icon icon={c.icon} size={16} />
            <span className="ui-as-brief__name">
              {c.label}
              <small>{c.note}</small>
            </span>
            <input type="checkbox" className="ui-as-switch" checked={active.has(c.label)} onChange={() => onToggle(c.label)} />
          </label>
        ))}
      </section>

      <section className="ui-as-brief__section ui-as-brief__section--split">
        <div>
          <span className="ui-as-brief__label">Palette</span>
          <div className="ui-as-brief__swatches">
            {palette.map((c) => (
              <span key={c.name}>
                <i style={{ background: c.hex }} />
                {c.name}
              </span>
            ))}
          </div>
        </div>
        <div>
          <span className="ui-as-brief__label">Formats</span>
          <div className="ui-as-brief__formats">
            {formats.map((f) => (
              <span key={f.label}>
                <i style={{ aspectRatio: f.ratio }} />
                {f.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="ui-as-brief__section">
        <span className="ui-as-brief__label">Details</span>
        <dl className="ui-as-brief__details">
          {details.map((d) => (
            <div key={d.label}>
              <dt>
                <Icon icon={d.icon} size={14} />
                {d.label}
              </dt>
              <dd>{d.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="ui-as-brief__go">
        <span className="ui-as-brief__tags">
          <span>6 ads</span>
          <span>~2 min</span>
        </span>
        {/* aria-disabled, not disabled: focus stays on the button while it works (generate ignores repeat clicks) */}
        <Button size="sm" onClick={onGenerate} aria-disabled={generated === "busy" || undefined}>
          {generated === "busy" ? "Generating…" : generated === "yes" ? "Generate again" : "Generate ads"}
        </Button>
      </div>
    </div>
  );
}

function BriefAssets({ angle, generated, onGenerate }: { angle: string; generated: Generated; onGenerate: () => void }) {
  return (
    <div className="ui-as-brief__panel ui-as-brief__assets">
      {generated === "yes" ? (
        <>
          <span className="ui-as-brief__label">6 ads · {angle}</span>
          <div className="ui-as-ads">
            {ads.map((ad, i) => (
              <figure key={ad.title} className="ui-as-ad ui-as-rise" style={{ "--i": i, "--ad": ad.bg, "--ad-ink": ad.ink } as CSSProperties}>
                <span className="ui-as-ad__art" style={{ aspectRatio: ad.ratio }}>
                  <Icon icon={ShirtIcon} size={22} />
                  <b>{ad.title}</b>
                </span>
                <figcaption>
                  {ad.format}
                  <span>{ad.channel}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </>
      ) : (
        <div className="ui-as-brief__empty ui-as-rise">
          <span>
            <Icon icon={SparklesIcon} size={18} />
          </span>
          <b>{generated === "busy" ? "Generating your ads…" : "No assets yet"}</b>
          <p>{generated === "busy" ? "The creative pipeline is on it – this takes a moment." : "Fill in the brief and generate ads – they show up here."}</p>
          {generated === "no" && (
            <Button size="sm" variant="secondary" onClick={onGenerate}>
              Generate ads
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function BriefActivity({ angle, generated }: { angle: string; generated: Generated }) {
  return (
    <ol className="ui-as-brief__panel ui-as-activity">
      {[
        ...(generated === "yes" ? [{ icon: SparklesIcon, text: `6 ads generated · ${angle}`, time: "Just now" }] : []),
        { icon: CircleCheckIcon, text: `Angle set to ${angle}`, time: "2 min ago" },
        { icon: TargetIcon, text: "Brand research checked the palette", time: "3 min ago" },
        { icon: ShoppingBagIcon, text: "Linen Overshirt picked as bestseller", time: "4 min ago" },
        { icon: MegaphoneIcon, text: "Shopify import started", time: "6 min ago" },
        { icon: ListChecksIcon, text: "Brief “Summer launch” created", time: "7 min ago" },
      ].map((item, i) => (
        <li key={item.text} className="ui-as-rise" style={{ "--i": i } as CSSProperties}>
          <span className="ui-as-activity__icon">
            <Icon icon={item.icon} size={14} />
          </span>
          <span className="ui-as-activity__text">
            {item.text}
            <small>{item.time}</small>
          </span>
        </li>
      ))}
    </ol>
  );
}


/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where([data-tc-theme="system"]) { color-scheme: light dark; }

/* Agent chat: thread and composer on the left, the brief as a panel on the right */
.ui-as-chat {
  /* The product thumbnail in the brief: a warm paper tile */
  --tc-agent-chat-thumb-bg: light-dark(#efe7da, #3a3329);
  --tc-agent-chat-thumb-fg: light-dark(#7c6a4f, #d9c6a5);
  display: flex;
  height: 100%;
  min-height: 0;
}
.ui-as-chat__main { display: flex; flex: 1; flex-direction: column; min-width: 0; }

.ui-as-chat__bar {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 12px 0 20px;
  border-bottom: 1px solid var(--tc-border-subtle, light-dark(#f0f0f0, rgba(255, 255, 255, 0.06)));
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
}
.ui-as-chat__crumbs { display: flex; align-items: center; gap: 8px; font-size: var(--tc-font-size-md-plus, 13.5px); }
.ui-as-chat__crumbs i { font-style: normal; color: var(--tc-icon-muted, light-dark(#858585, #7c7c82)); }
.ui-as-chat__crumbs b { font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-chat__crumbs .ui-as-icon-btn { width: 24px; height: 24px; margin-left: -2px; }
.ui-as-chat__tools { display: flex; gap: 2px; }
.ui-as-chat__tools .ui-as-icon-btn[aria-pressed="true"] { background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }

.ui-as-chat__thread { flex: 1; min-height: 0; overflow-y: auto; padding: 40px 32px 16px; }
.ui-as-chat__column { display: flex; flex-direction: column; gap: 22px; max-width: 680px; margin: 0 auto; }
.ui-as-chat__user {
  align-self: flex-end;
  margin: 0;
  padding: 8px 14px;
  border-radius: var(--tc-radius-2xl, 16px);
  background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)));
  font-size: var(--tc-font-size-lg, 14px);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
}
.ui-as-chat__answer {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  font-size: var(--tc-font-size-lg, 14px);
  line-height: var(--tc-line-height-relaxed, 22px);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
}
.ui-as-chat__answer p { margin: 0; }
.ui-as-chat__who, .ui-as-chat__route { display: flex; align-items: center; gap: 8px; font-weight: var(--tc-font-weight-medium, 500); }
.ui-as-chat__avatar {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)));
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
}
.ui-as-chat__worked { display: flex; align-items: center; gap: 6px; font-size: var(--tc-font-size-md, 13px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-as-chat__label { padding-top: 4px; font-size: var(--tc-font-size-sm-plus, 12.5px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-as-chat__agents { display: flex; flex-wrap: wrap; gap: 6px; margin-top: -6px; }
.ui-as-chat__agent {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 30px;
  padding: 0 12px 0 10px;
  border-radius: var(--tc-radius-full, 999px);
  box-shadow: inset 0 0 0 1px var(--tc-border-default, light-dark(#ececec, #2a2a2e));
  font-size: var(--tc-font-size-md, 13px);
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
}
.ui-as-chat__agent svg { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-as-chat__agent[data-active] { background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); box-shadow: none; color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-chat__agent[data-active] svg { color: var(--tc-text-primary, light-dark(#171717, #ededed)); }

.ui-as-chat__composer { display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 744px; margin: 0 auto; padding: 8px 32px 24px; }
.ui-as-chat__route { font-size: var(--tc-font-size-md, 13px); font-weight: var(--tc-font-weight-regular, 400); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-as-chat__route b { font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }

/* Brief panel: flat sections divided by fine lines, the generate row pinned to the bottom */
.ui-as-brief { display: flex; flex: none; flex-direction: column; width: 400px; border-left: 1px solid var(--tc-border-subtle, light-dark(#f0f0f0, rgba(255, 255, 255, 0.06))); }
.ui-as-brief__body { display: flex; flex: 1; flex-direction: column; min-height: 0; overflow-y: auto; }
.ui-as-brief__seg { margin: 20px 20px 0; }

.ui-as-brief__product { display: flex; align-items: center; gap: 12px; margin: 18px 20px 6px; }
.ui-as-brief__thumb {
  display: grid;
  flex: none;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--tc-radius-lg, 10px);
  background: var(--tc-agent-chat-thumb-bg);
  color: var(--tc-agent-chat-thumb-fg);
}
.ui-as-brief__pinfo { display: flex; flex: 1; flex-direction: column; min-width: 0; font-size: var(--tc-font-size-sm-plus, 12.5px); line-height: var(--tc-line-height-snug, 18px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-as-brief__pinfo b { font-size: var(--tc-font-size-lg, 14px); font-weight: var(--tc-font-weight-medium, 500); line-height: var(--tc-line-height-normal, 20px); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-brief__chip { padding: 2px 8px; border-radius: var(--tc-radius-full, 999px); background: var(--tc-status-success-bg, light-dark(#e6f6ec, #12301f)); font-size: var(--tc-font-size-sm, 12px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c)); }

.ui-as-brief__section { display: flex; flex-direction: column; padding: 18px 20px; border-top: 1px solid var(--tc-border-subtle, light-dark(#f0f0f0, rgba(255, 255, 255, 0.06))); }
.ui-as-brief__product + .ui-as-brief__section { margin-top: 14px; }
.ui-as-brief__section--split { flex-direction: row; justify-content: space-between; gap: 16px; }
.ui-as-brief__label { padding-bottom: 12px; font-size: var(--tc-font-size-sm-plus, 12.5px); font-weight: var(--tc-font-weight-medium, 500); line-height: var(--tc-line-height-tight, 16px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }

.ui-as-brief__option {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 46px;
  margin: 0 -10px;
  padding: 0 10px;
  border-radius: var(--tc-radius-lg, 10px);
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
  text-align: left;
  transition: background-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease), color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease), box-shadow var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-as-brief__option:hover { background: var(--tc-fill-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-brief__option[aria-checked="true"] { background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-brief__options { display: flex; flex-direction: column; }
.ui-as-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-as-brief__radio { flex: none; width: 14px; height: 14px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px var(--tc-border-control, light-dark(#858585, #7c7c82)); transition: box-shadow var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease); }
.ui-as-brief__option[aria-checked="true"] .ui-as-brief__radio { box-shadow: inset 0 0 0 4px var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-brief__name { display: flex; flex: 1; flex-direction: column; min-width: 0; font-size: var(--tc-font-size-md-plus, 13.5px); font-weight: var(--tc-font-weight-medium, 500); line-height: var(--tc-line-height-snug, 18px); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-brief__option .ui-as-brief__name { color: inherit; }
.ui-as-brief__name small { font-size: var(--tc-font-size-sm-plus, 12.5px); font-weight: var(--tc-font-weight-regular, 400); line-height: var(--tc-line-height-snug, 18px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-as-brief__signal { display: flex; align-items: flex-end; gap: 2px; height: 11px; }
.ui-as-brief__signal i { width: 3px; border-radius: var(--tc-radius-2xs, 2px); background: var(--tc-border-strong, light-dark(#dedede, #3a3a40)); }
.ui-as-brief__signal i:nth-child(1) { height: 5px; }
.ui-as-brief__signal i:nth-child(2) { height: 8px; }
.ui-as-brief__signal i:nth-child(3) { height: 11px; }
.ui-as-brief__signal i[data-on] { background: var(--tc-status-success-solid, light-dark(#1f8a4c, #3ec27a)); }

.ui-as-brief__pills { display: flex; flex-wrap: wrap; gap: 8px; }
.ui-as-brief__pills span { padding: 4px 10px; border-radius: var(--tc-radius-full, 999px); box-shadow: inset 0 0 0 1px var(--tc-border-default, light-dark(#ececec, #2a2a2e)); font-size: var(--tc-font-size-sm-plus, 12.5px); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }

.ui-as-brief__channel { display: flex; align-items: center; gap: 12px; min-height: 44px; cursor: pointer; }
.ui-as-brief__channel > svg { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
/* Small switch, drawn on the checkbox itself */
.ui-as-switch {
  appearance: none;
  position: relative;
  flex: none;
  width: var(--tc-switch-w, 32px);
  height: var(--tc-switch-h, 20px);
  margin: 0;
  border-radius: var(--tc-switch-radius, 999px);
  background: var(--tc-switch-off, light-dark(#858585, #7c7c82));
  cursor: pointer;
  transition: background-color var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease);
}
.ui-as-switch::after {
  content: "";
  position: absolute;
  top: calc((var(--tc-switch-h, 20px) - var(--tc-switch-knob, 16px)) / 2);
  left: calc((var(--tc-switch-h, 20px) - var(--tc-switch-knob, 16px)) / 2);
  width: var(--tc-switch-knob, 16px);
  height: var(--tc-switch-knob, 16px);
  border-radius: 50%;
  background: var(--tc-switch-knob-bg, #ffffff);
  box-shadow: var(--tc-shadow-control, 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  transition: translate var(--tc-duration-base, 200ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-as-switch:checked { background: var(--tc-switch-on, #2f68ff); }
.ui-as-switch:checked::after { translate: calc(var(--tc-switch-w, 32px) - var(--tc-switch-h, 20px)) 0; }
.ui-as-switch:focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); }

.ui-as-brief__swatches, .ui-as-brief__formats { display: flex; gap: 14px; font-size: var(--tc-font-size-sm, 12px); line-height: var(--tc-line-height-tight, 16px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-as-brief__swatches span, .ui-as-brief__formats span { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.ui-as-brief__swatches i { width: 22px; height: 22px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08); }
.ui-as-brief__formats span { justify-content: flex-end; height: 44px; }
.ui-as-brief__formats i { height: 24px; max-width: 36px; border: 1.5px solid var(--tc-icon-muted, light-dark(#858585, #7c7c82)); border-radius: var(--tc-radius-xs, 4px); }
.ui-as-brief__formats span:nth-child(3) i { width: 36px; height: auto; }

.ui-as-brief__details { display: grid; gap: 12px; margin: 0; }
.ui-as-brief__details div { display: flex; align-items: center; justify-content: space-between; font-size: var(--tc-font-size-md, 13px); }
.ui-as-brief__details dt { display: flex; align-items: center; gap: 8px; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-as-brief__details dd { margin: 0; font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); font-variant-numeric: tabular-nums; }

.ui-as-brief__panel { display: flex; flex: 1 0 auto; flex-direction: column; animation: ui-as-rise var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)) both; }
.ui-as-brief__assets { padding: 16px; }
.ui-as-ads { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.ui-as-ad { margin: 0; }
.ui-as-ad__art {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px;
  border-radius: var(--tc-radius-xl, 12px);
  background: var(--ad);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.06);
  color: var(--ad-ink);
}
.ui-as-ad__art b { font-size: var(--tc-font-size-lg-plus, 15px); font-weight: var(--tc-font-weight-semibold, 600); line-height: var(--tc-line-height-snug, 18px); letter-spacing: -0.01em; }
.ui-as-ad figcaption { display: flex; justify-content: space-between; margin-top: 6px; font-size: var(--tc-font-size-sm-plus, 12.5px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-ad figcaption span { font-weight: var(--tc-font-weight-regular, 400); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-as-brief__empty { display: flex; flex: 1; flex-direction: column; align-items: center; justify-content: center; gap: 6px; text-align: center; }
.ui-as-brief__empty > span { display: grid; place-items: center; width: 42px; height: 42px; margin-bottom: 8px; border-radius: var(--tc-radius-xl, 12px); background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-as-brief__empty b { font-size: var(--tc-font-size-lg, 14px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-brief__empty p { max-width: 240px; margin: 0 0 10px; font-size: var(--tc-font-size-md, 13px); line-height: var(--tc-line-height-normal, 20px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-as-activity { margin: 0; padding: 16px; list-style: none; }
.ui-as-activity li { position: relative; display: flex; gap: 12px; padding-bottom: 18px; }
/* A fine line joins the icons into a timeline */
.ui-as-activity li:not(:last-child)::before { content: ""; position: absolute; top: 28px; bottom: 2px; left: 13px; width: 1px; background: var(--tc-border-default, light-dark(#ececec, #2a2a2e)); }
.ui-as-activity__icon { display: grid; flex: none; place-items: center; width: 27px; height: 27px; border-radius: 50%; box-shadow: inset 0 0 0 1px var(--tc-border-default, light-dark(#ececec, #2a2a2e)); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-as-activity__text { display: flex; flex-direction: column; padding-top: 3px; font-size: var(--tc-font-size-md-plus, 13.5px); line-height: var(--tc-line-height-normal, 20px); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-activity__text small { font-size: var(--tc-font-size-sm-plus, 12.5px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }

.ui-as-brief__go {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding: 16px 20px 20px;
  border-top: 1px solid var(--tc-border-subtle, light-dark(#f0f0f0, rgba(255, 255, 255, 0.06)));
  /* Stays in view at the bottom when the brief is taller than the panel */
  position: sticky;
  bottom: 0;
  z-index: 1;
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
}
.ui-as-brief__tags { display: flex; gap: 4px; }
.ui-as-brief__tags span { padding: 3px 9px; border-radius: var(--tc-radius-full, 999px); box-shadow: inset 0 0 0 1px var(--tc-border-default, light-dark(#ececec, #2a2a2e)); font-size: var(--tc-font-size-sm-plus, 12.5px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }


/* Room for the sidebar icon while the sidebar is collapsed */
.ui-as-chat__main > .ui-as-chat__bar { transition: padding-left var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)); }
.ui-as-app[data-collapsed] .ui-as-chat__main > .ui-as-chat__bar { padding-left: 52px; }
.ui-as-chat__scrim { display: none; }

/* Narrow panels: the brief becomes a layer that slides in from the right over the chat */
@container ui-as-main (max-width: 900px) {
  .ui-as-brief {
    position: absolute;
    z-index: calc(var(--tc-z-sticky, 10) + 2);
    top: 0;
    right: 0;
    bottom: 0;
    width: min(400px, calc(100% - 32px));
    border-left: 0;
    border-radius: 0 var(--tc-app-shell-panel-radius) var(--tc-app-shell-panel-radius) 0;
    background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
    box-shadow: var(--tc-shadow-overlay, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6)));
    animation: ui-as-brief-in var(--tc-duration-slower, 420ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)) both;
  }
  .ui-as-chat__scrim {
    display: block;
    position: absolute;
    z-index: calc(var(--tc-z-sticky, 10) + 1);
    inset: 0;
    border-radius: inherit;
    background: var(--tc-scrim, light-dark(rgba(0, 0, 0, 0.32), rgba(0, 0, 0, 0.6)));
    animation: ui-as-brief-fade var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease) both;
  }
}
@keyframes ui-as-brief-in { from { transform: translateX(40px); opacity: 0; } to { transform: none; opacity: 1; } }
@keyframes ui-as-brief-fade { from { opacity: 0; } }
@container ui-as (max-width: 900px) {
  .ui-as-chat__main > .ui-as-chat__bar { padding-left: 52px; }
}
@container ui-as (max-width: 600px) {
  /* Only the chat's name stays in the bar */
  .ui-as-chat__main .ui-as-chat__crumbs { min-width: 0; }
  .ui-as-chat__main .ui-as-chat__crumbs > svg, .ui-as-chat__main .ui-as-chat__crumbs > i { display: none; }
  .ui-as-chat__main .ui-as-chat__crumbs { font-size: 0; }
  .ui-as-chat__main .ui-as-chat__crumbs > b { overflow: hidden; font-size: var(--tc-font-size-md-plus, 13.5px); white-space: nowrap; text-overflow: ellipsis; }
  .ui-as-chat__bar { padding-right: 8px; }
  .ui-as-brief .ui-as-chat__bar { padding-left: 52px; }
  .ui-as-chat__thread { padding: 24px 16px 12px; }
  .ui-as-chat__composer { padding: 6px 8px 8px; }
  .ui-as-chat__route { padding-left: 6px; }
  .ui-as-brief { width: 100%; border-radius: var(--tc-app-shell-panel-radius); }
  .ui-as-brief__seg { margin: 16px 16px 0; }
  .ui-as-brief__product { margin: 16px 16px 6px; }
  .ui-as-brief__section { padding: 16px; }
  .ui-as-brief__section--split { flex-wrap: wrap; }
  .ui-as-brief__go { padding: 14px 16px 16px; }
}
`;
