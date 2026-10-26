"use client";

/*
 * Evals – a prompt evaluation dashboard for teams shipping LLM features, in a single file.
 * A header with the prompt, its version and model, four key figures, the pass rate over the last
 * twelve versions next to the reviewable changes in the system prompt, then the test cases across
 * the full width. "Run eval" walks through
 * the cases one by one with a thin progress bar and ends with a toast.
 * Sits in the Trenchcoat App Shell.
 * Imports: app-shell (AppShell, Dropdown, Icon, useToast), button, kpi-chart, inline-diff and segmented-control from
 * `@/components/ui/<name>` – copy them alongside; icons from lucide-react 1.55.0.
 */

import { useCallback, useEffect, useRef, useState, type ComponentPropsWithoutRef, type CSSProperties, type Ref } from "react";
import {
  BanknoteArrowDownIcon,
  ChartColumnBigIcon,
  ChevronDownIcon,
  CpuIcon,
  DatabaseIcon,
  HouseIcon,
  MailIcon,
  MessageCircleMoreIcon,
  PlayIcon,
  TestTubeIcon,
  TicketIcon,
  UserPlusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiChart } from "@/components/ui/kpi-chart";
import { InlineDiff } from "@/components/ui/inline-diff";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { AppShell, Dropdown, Icon, useToast, type AppShellProps, type ShellGroup, type ShellNavItem } from "@/components/ui/app-shell";

/** Sample content – replace with your own data */
const nav: ShellNavItem[] = [
  { label: "Home", icon: HouseIcon },
  { label: "Chat", icon: MessageCircleMoreIcon },
  { label: "Evals", icon: TestTubeIcon, count: 3 },
  { label: "Datasets", icon: DatabaseIcon },
  { label: "Analytics", icon: ChartColumnBigIcon },
];
const groups: ShellGroup[] = [
  {
    label: "Prompts",
    items: [
      { label: "Support reply", icon: MailIcon },
      { label: "Ticket triage", icon: TicketIcon },
      { label: "Refund check", icon: BanknoteArrowDownIcon },
      { label: "Onboarding", icon: UserPlusIcon },
    ],
  },
];

const MODEL = "claude-sonnet-5-5";

/** Pass rate per version, oldest first – the last one is the current version */
const versions = ["v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8", "v9", "v10", "v11", "v12"];
const history = [61, 64, 70, 68, 74, 79, 77, 83, 85, 81, 88, 92];
const edited = ["Jan 8", "Jan 15", "Jan 22", "Feb 3", "Feb 11", "Feb 19", "Mar 2", "Mar 9", "Mar 18", "Mar 27", "Apr 6", "Today"];

/** The system prompt paragraph that changed between v11 and v12 */
const promptV11 =
  "You are a support agent for Acme. Answer the customer's question politely and in as much detail as possible. If you are not sure, apologize and escalate the ticket to a human. Always end with a friendly sign-off and a link to our blog.";
const promptV12 =
  "You are a support agent for Acme. Answer the customer's question in three sentences or fewer, in the customer's language. If the answer is not in the help center, say so and offer to hand the ticket to a human. Never promise refunds; link the refund policy instead.";

type Verdict = "pass" | "partial" | "fail";
type Case = { id: string; input: string; expected: string; prev: string; output: string; prevScore: number; score: number; ms: number };

/** Score 4–5 passes, 3 is partial, below fails */
const verdict = (score: number): Verdict => (score >= 4 ? "pass" : score === 3 ? "partial" : "fail");
const verdictLabel: Record<Verdict, string> = { pass: "Pass", partial: "Partial", fail: "Fail" };

const cases: Case[] = [
  { id: "TC-01", input: "Where is my order #48213? It's been 9 days.", expected: "Look up the status, share the tracking link, apologize for the delay", prev: "Thank you so much for reaching out! We completely understand how frustrating it can be to wait for an order. Our team ships most orders within 5–7 business days…", output: "Sorry for the wait – order #48213 shipped on May 2 with DHL. Track it here: dhl.com/t/48213. It should arrive within two days.", prevScore: 4, score: 5, ms: 1180 },
  { id: "TC-02", input: "Can I get a refund for my annual plan?", expected: "Link the refund policy, no promise of a refund", prev: "Of course! I've gone ahead and issued a full refund for your annual plan. You'll see it on your card in 3–5 days.", output: "Annual plans can be refunded within 30 days of purchase – here's how it works: acme.com/refunds. Want me to open a request for you?", prevScore: 2, score: 5, ms: 1240 },
  { id: "TC-03", input: "Wie ändere ich meine Rechnungsadresse?", expected: "Answer in German with the settings path", prev: "To change your billing address, go to Settings → Billing → Address and click Edit.", output: "Unter Einstellungen → Abrechnung → Adresse auf „Bearbeiten“ klicken. Die neue Adresse gilt ab der nächsten Rechnung.", prevScore: 2, score: 5, ms: 1100 },
  { id: "TC-04", input: "My invoice shows the wrong VAT number.", expected: "Explain how to edit it, offer to reissue the invoice", prev: "I'm sorry about that! You can update your VAT number in Settings → Billing. Let us know if you need anything else.", output: "You can fix the VAT number in Settings → Billing. Once it's saved, I can reissue the last invoice with the right number.", prevScore: 4, score: 4, ms: 1350 },
  { id: "TC-05", input: "The app crashes when I upload a 200 MB file.", expected: "Mention the 100 MB limit and suggest compressing or splitting", prev: "We're sorry you're running into crashes! Could you try clearing your cache and restarting the app?", output: "Uploads are limited to 100 MB per file, which is why the upload stops. I've noted the crash for our team.", prevScore: 3, score: 3, ms: 1560 },
  { id: "TC-06", input: "How do I add a teammate to my workspace?", expected: "Settings → Members → Invite, mention seat pricing", prev: "Go to Settings → Members and click Invite. Each new member is billed as a seat.", output: "Go to Settings → Members → Invite and enter their email. Each member counts as one seat on your plan.", prevScore: 5, score: 5, ms: 980 },
  { id: "TC-07", input: "Cancel my subscription right now.", expected: "Give the cancel steps, no retention pitch", prev: "Before you go – did you know you can pause your plan for up to 3 months instead? Here are some options…", output: "Go to Settings → Billing → Cancel plan. You keep access until the end of the current period.", prevScore: 3, score: 5, ms: 1010 },
  { id: "TC-08", input: "Is my data stored in the EU?", expected: "Yes – Frankfurt region, link the DPA", prev: "Yes, all customer data is stored in the EU.", output: "Yes – workspaces on EU plans are hosted in Frankfurt. Details are in our data processing agreement: acme.com/dpa.", prevScore: 4, score: 5, ms: 1150 },
  { id: "TC-09", input: "Your product is useless. I want to speak to a manager.", expected: "Acknowledge, stay calm, hand off to a human", prev: "I'm really sorry to hear that. I'll pass this on to a manager who will get back to you.", output: "I'm sorry it's been this frustrating. I'm handing this to a team lead now – you'll hear back within 4 hours.", prevScore: 4, score: 4, ms: 1420 },
  { id: "TC-10", input: "Can you integrate with Salesforce?", expected: "No native integration – suggest Zapier or the API", prev: "We don't have a Salesforce integration yet, but it's on our roadmap!", output: "Yes! Our native Salesforce integration syncs contacts both ways. Turn it on under Settings → Integrations.", prevScore: 3, score: 2, ms: 1890 },
  { id: "TC-11", input: "I lost my phone – please reset my 2FA.", expected: "Ask for an identity check, never reset in chat", prev: "For your security we can't reset 2FA here. Please use a backup code or verify your identity at acme.com/verify.", output: "For your security I can't reset 2FA in chat. Use a backup code, or verify your identity at acme.com/verify.", prevScore: 5, score: 5, ms: 940 },
  { id: "TC-12", input: "Do you offer student discounts?", expected: "50% off with a school email", prev: "Yes, we offer discounts for students! Reach out to sales for details.", output: "Yes – students get 50% off with a school email address. Apply at acme.com/students.", prevScore: 4, score: 5, ms: 1080 },
  { id: "TC-13", input: "How can I export all my data as CSV?", expected: "Settings → Export, mention the email link", prev: "Go to Settings → Export and choose CSV. We'll email you a download link.", output: "Go to Settings → Export and pick CSV. A download link arrives by email within a few minutes.", prevScore: 5, score: 5, ms: 1050 },
  { id: "TC-14", input: "Why was I charged twice this month?", expected: "Explain the pending authorization, offer to check", prev: "Sorry about that! Double charges happen sometimes. Please contact your bank.", output: "One of the two is likely a pending authorization that drops off in 3–5 days. Want me to check your invoices to be sure?", prevScore: 3, score: 4, ms: 1270 },
  { id: "TC-15", input: "Delete my account and all of my data.", expected: "Link the deletion flow, say it can't be undone", prev: "You can delete your account in Settings → Account → Delete. This can't be undone.", output: "Delete it under Settings → Account → Delete workspace. This removes all data for good and can't be undone.", prevScore: 5, score: 5, ms: 1120 },
  { id: "TC-16", input: "Can I change plans in the middle of a billing cycle?", expected: "Yes, prorated", prev: "Yes, you can change plans anytime.", output: "Yes – upgrades apply right away and are prorated; downgrades start with the next billing cycle.", prevScore: 4, score: 5, ms: 1190 },
  { id: "TC-17", input: "Bonjour, avez-vous une API publique ?", expected: "Answer in French, link the API docs", prev: "Yes, we have a public REST API. You can find the docs at acme.com/api.", output: "Oui, nous avons une API REST publique. La documentation est ici : acme.com/api.", prevScore: 2, score: 5, ms: 1200 },
  { id: "TC-18", input: "The password reset email never arrived.", expected: "Check spam, resend, mention the sender address", prev: "Please check your spam folder for an email from no-reply@acme.com, then try again.", output: "Check your spam for no-reply@acme.com. I've sent a fresh link – it's valid for 30 minutes.", prevScore: 5, score: 5, ms: 1170 },
  { id: "TC-19", input: "Is there a dark mode?", expected: "Yes, Settings → Appearance", prev: "Yes! Go to Settings → Appearance and choose Dark.", output: "Yes – Settings → Appearance → Dark, or follow your system setting.", prevScore: 5, score: 5, ms: 820 },
  { id: "TC-20", input: "How many seats come with the Team plan?", expected: "25 seats, more on Business", prev: "The Team plan includes up to 20 seats. Contact sales for more.", output: "The Team plan includes up to 20 seats; for more, the Business plan has no limit.", prevScore: 3, score: 3, ms: 1310 },
  { id: "TC-21", input: "Can we pay by invoice instead of card?", expected: "Yes on annual plans over $1,000", prev: "Yes, we support invoices. Please contact our sales team.", output: "Yes – annual plans over $1,000 can be paid by invoice. Switch under Settings → Billing → Payment method.", prevScore: 4, score: 5, ms: 1480 },
  { id: "TC-22", input: "Our webhook keeps returning 401.", expected: "Check the signing secret, link the docs", prev: "A 401 means unauthorized. Please double-check your credentials.", output: "A 401 usually means the signing secret changed. Copy the current one from Settings → Webhooks – docs: acme.com/webhooks.", prevScore: 4, score: 5, ms: 2140 },
  { id: "TC-23", input: "Do you have a status page?", expected: "Link status.acme.com", prev: "Yes, check status.acme.com for live updates.", output: "Yes – status.acme.com shows live uptime and incidents. You can subscribe to updates there.", prevScore: 5, score: 5, ms: 1640 },
  { id: "TC-24", input: "How do I add SSO to our workspace?", expected: "SAML on Business, settings path", prev: "SSO is available! Go to Settings → Security to set it up.", output: "SAML SSO is part of the Business plan. Set it up under Settings → Security → SSO.", prevScore: 4, score: 5, ms: 1720 },
  { id: "TC-25", input: "Thanks, that fixed it!", expected: "Short, warm close – no upsell", prev: "Glad we could help! By the way, have you seen our new Business plan? It comes with…", output: "Great to hear! Have a good day.", prevScore: 3, score: 5, ms: 2480 },
];

const sec = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
const passRate = (list: Case[]) =>
  list.length ? Math.round((list.reduce((n, c) => n + (verdict(c.score) === "pass" ? 1 : verdict(c.score) === "partial" ? 0.5 : 0), 0) / list.length) * 100) : 0;
const avgScore = (list: Case[]) => (list.length ? list.reduce((n, c) => n + c.score, 0) / list.length : 0);

type Filter = "all" | Verdict;
type Status = Verdict | "queued" | "running";

type EvalsOwnProps = Pick<AppShellProps, "onNavigate" | "workspace" | "user"> & {
  /** Prompt version shown, e.g. "v11" – controlled; use `defaultVersion` for a starting version */
  version?: string;
  /** Version shown first when `version` isn't controlled (default: the current one) */
  defaultVersion?: string;
  /** Called with the version picked from the version menu */
  onVersionChange?: (version: string) => void;
};

/** `className`, other DOM props and `ref` go to the App Shell's root */
export type EvalsScreenProps = Omit<ComponentPropsWithoutRef<"div">, keyof EvalsOwnProps | "children"> & EvalsOwnProps & { ref?: Ref<HTMLDivElement> };

export function EvalsScreen({
  version: versionProp,
  defaultVersion = versions[versions.length - 1],
  onVersionChange,
  onNavigate,
  workspace,
  user,
  ref,
  ...rest
}: EvalsScreenProps) {
  const [version, setVersion] = useControllable(versionProp, defaultVersion, onVersionChange, "version");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState("TC-10");
  /** Cases finished in the current run – null while no run is going */
  const [done, setDone] = useState<number | null>(null);
  const [lastRun, setLastRun] = useState("2 hours ago");
  const [toast, showToast] = useToast();
  const scroller = useRef<HTMLDivElement>(null);
  // The run's timer effect only restarts when the run moves on; the toast is read through a ref
  const announce = useRef(showToast);
  useEffect(() => {
    announce.current = showToast;
  });

  const running = done !== null;
  const status = (i: number): Status => (done === null || i < done ? verdict(cases[i].score) : i === done ? "running" : "queued");
  const finished = running ? cases.slice(0, done) : cases;

  // One case after the other; the toast comes when the last one is in
  useEffect(() => {
    if (done === null) return;
    if (done >= cases.length) {
      setDone(null);
      setLastRun("just now");
      announce.current(`Eval finished · ${passRate(cases)}% of ${cases.length} cases passed`);
      return;
    }
    const t = window.setTimeout(() => setDone((d) => (d === null ? d : d + 1)), 150 + (cases[done].ms % 7) * 22);
    return () => window.clearTimeout(t);
  }, [done]);

  // Keep the case being run in view – inside the table only, the page stays where it is
  useEffect(() => {
    if (done === null || filter !== "all") return;
    const box = scroller.current;
    const row = box?.querySelector<HTMLElement>(`[data-i="${done}"]`);
    if (!box || !row) return;
    const head = 34;
    if (row.offsetTop + row.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = row.offsetTop + row.offsetHeight - box.clientHeight + 8;
    else if (row.offsetTop - head < box.scrollTop) box.scrollTop = row.offsetTop - head;
  }, [done, filter]);

  const run = () => {
    if (running) return;
    setFilter("all");
    scroller.current?.scrollTo({ top: 0 });
    setDone(0);
  };

  // An unknown version (e.g. a controlled value from elsewhere) shows the current one
  const vIndex = versions.includes(version) ? versions.indexOf(version) : versions.length - 1;
  const isCurrent = vIndex === versions.length - 1;
  const rate = isCurrent ? passRate(finished) : history[vIndex];
  const rateDelta = isCurrent ? 4 : history[vIndex] - (history[vIndex - 1] ?? history[vIndex]);

  const counts = { pass: 0, partial: 0, fail: 0 };
  cases.forEach((c) => counts[verdict(c.score)]++);
  const shown = cases.map((c, i) => ({ c, i })).filter(({ c }) => filter === "all" || verdict(c.score) === filter);

  const stats: { label: string; value: string; unit?: string; delta: string; good: boolean; note: string }[] = [
    { label: "Pass rate", value: running && done === 0 ? "–" : `${rate}%`, delta: `${rateDelta >= 0 ? "+" : "−"}${Math.abs(rateDelta)}`, good: rateDelta >= 0, note: `vs ${versions[Math.max(vIndex - 1, 0)]}` },
    { label: "Avg score", value: running && done === 0 ? "–" : avgScore(finished).toFixed(1), unit: "/5", delta: "+0.3", good: true, note: "vs v11" },
    { label: "Latency p50", value: "1.2", unit: "s", delta: "−0.2s", good: true, note: "vs v11" },
    { label: "Cost per 1k runs", value: "$1.84", delta: "+$0.06", good: false, note: "vs v11" },
  ];

  return (
    <AppShell {...rest} ref={ref} active="Evals" nav={nav} groups={groups} onNavigate={onNavigate} workspace={workspace} user={user}>
      <style href="ui-evals" precedence="default">
        {css}
      </style>
      <div className="ui-ev">
        <header className="ui-ev__head">
          <div className="ui-ev__title">
            <h1>
              <Icon icon={MailIcon} size={17} />
              Support reply prompt
            </h1>
            <Dropdown
              title="Versions"
              items={[...versions].reverse().slice(0, 6).map((v) => {
                const i = versions.indexOf(v);
                return {
                  label: v,
                  description: `${i === versions.length - 1 ? "Current" : edited[i]} · ${history[i]}% pass`,
                  checked: i === vIndex,
                  onSelect: () => setVersion(v),
                };
              })}
              trigger={({ open, toggle }) => (
                <button type="button" className="ui-ev__chip ui-ev__chip--btn" aria-expanded={open} aria-haspopup="menu" onClick={toggle}>
                  {versions[vIndex]}
                  {isCurrent && <span className="ui-ev__current">current</span>}
                  <Icon icon={ChevronDownIcon} size={13} />
                </button>
              )}
            />
            <span className="ui-ev__chip ui-ev__chip--model" title={MODEL}>
              <Icon icon={CpuIcon} size={14} />
              <span className="ui-ev__trunc">{MODEL}</span>
            </span>
          </div>
          <div className="ui-ev__actions">
            <span className="ui-ev__meta">{running ? `Running ${Math.min(done + 1, cases.length)} of ${cases.length}…` : `Last run ${lastRun}`}</span>
            <Button size="sm" onClick={run} loading={running} icon={running ? undefined : <Icon icon={PlayIcon} size={14} />}>
              {running ? "Running" : "Run eval"}
            </Button>
          </div>
          <span className="ui-ev__progress" data-on={running || undefined} aria-hidden="true">
            <i style={{ width: `${((done ?? 0) / cases.length) * 100}%` }} />
          </span>
        </header>

        <div className="ui-ev__content">
          <div className="ui-ev__stats">
            {stats.map((s, i) => (
              <div key={s.label} className="ui-ev__card ui-ev__stat ui-as-rise" style={{ "--i": i } as CSSProperties}>
                <span className="ui-ev__cap">{s.label}</span>
                <strong>
                  {s.value}
                  {s.unit && <small>{s.unit}</small>}
                </strong>
                <span className="ui-ev__delta" data-good={s.good || undefined}>
                  {s.delta} <span>{s.note}</span>
                </span>
              </div>
            ))}
          </div>

          <KpiChart
            className="ui-ev__chart"
            fill
            title="Pass rate by version"
            value={`${history[vIndex]}%`}
            delta={rateDelta}
            format={(n) => `${Math.round(n)}%`}
            labels={versions}
            tooltipLabels={versions.map((v, i) => `${v} · ${edited[i]}`)}
            series={[{ label: "Pass rate", color: "#2f6bff", values: history }]}
            defaultIndex={isCurrent ? undefined : vIndex}
            footer={`Last 12 versions · ${cases.length} test cases · ${MODEL}`}
          />

          <InlineDiff
            className="ui-ev__diff"
            fill
            label="Changes in v12 · system prompt, edited by Mara Klein"
            original={promptV11}
            suggested={promptV12}
            onDone={() => showToast("Prompt changes reviewed")}
          />

          <section className="ui-ev__cases">
            <div className="ui-ev__cases-head">
              <h2>
                Test cases <span>{cases.length}</span>
              </h2>
              <SegmentedControl<Filter>
                size="sm"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "all", label: "All" },
                  { value: "pass", label: "Pass", count: counts.pass },
                  { value: "partial", label: "Partial", count: counts.partial },
                  { value: "fail", label: "Fail", count: counts.fail },
                ]}
              />
            </div>
            <div className="ui-ev__scroll" ref={scroller}>
              <table className="ui-ev__table">
                <thead>
                  <tr>
                    <th>Input</th>
                    <th>Expected</th>
                    <th>v12 output</th>
                    <th>Score</th>
                    <th>Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map(({ c, i }) => {
                    const st = status(i);
                    return (
                      <tr
                        key={c.id}
                        data-i={i}
                        aria-selected={c.id === selected}
                        data-state={st}
                        tabIndex={0}
                        onClick={() => setSelected(c.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelected(c.id);
                          }
                        }}
                      >
                        <td>
                          <span className="ui-ev__in">
                            <span className="ui-ev__id">{c.id}</span>
                            <span className="ui-ev__trunc">{c.input}</span>
                          </span>
                        </td>
                        <td>
                          <span className="ui-ev__trunc ui-ev__soft">{c.expected}</span>
                        </td>
                        <td>
                          <span className="ui-ev__trunc ui-ev__soft">{st === "queued" || st === "running" ? "…" : c.output}</span>
                        </td>
                        <td>
                          <Pill status={st} score={c.score} />
                        </td>
                        <td className="ui-ev__num">{st === "queued" || st === "running" ? "–" : sec(c.ms)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
      {toast}
    </AppShell>
  );
}

function Pill({ status, score }: { status: Status; score: number }) {
  if (status === "queued") return <span className="ui-ev__pill" data-v="queued">Queued</span>;
  if (status === "running")
    return (
      <span className="ui-ev__pill" data-v="running">
        <i className="ui-ev__spin" aria-hidden="true" />
        Running
      </span>
    );
  return (
    <span className="ui-ev__pill" data-v={status} key={status + score}>
      <i aria-hidden="true" />
      {verdictLabel[status]}
      <span>{score}/5</span>
    </span>
  );
}

/* ---------- Helpers (inlined so the file stays self-contained) ---------- */

/**
 * State that a parent may control (Trenchcoat's useControllable). `value` defined → controlled: the screen shows it
 * and asks for changes through `onChange`. `value` undefined → uncontrolled: kept here, starting at `defaultValue`,
 * and changes are still reported.
 */
function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void, name?: string) {
  const controlled = value !== undefined;
  // Like React's <input value> without onChange: a controlled value nobody can change is almost always a
  // starting value passed to the wrong prop, so say so once (in development)
  const warned = useRef(false);
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.NODE_ENV;
  if (controlled && !onChange && !warned.current && env !== "production") {
    warned.current = true;
    console.warn(
      `Trenchcoat: ${name ? `\`${name}\`` : "a value prop"} is set without its change handler, so it can't change. ` +
        "Pass the handler to control it, or use the default… prop for a starting value.",
    );
  }
  const [own, setOwn] = useState(defaultValue);
  const current = controlled ? value : own;
  // Read through refs so the setter is stable and never acts on a stale value
  const latest = useRef(current);
  latest.current = current;
  const report = useRef(onChange);
  report.current = onChange;
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(latest.current) : next;
      if (Object.is(resolved, latest.current)) return;
      if (!controlled) setOwn(resolved);
      latest.current = resolved;
      report.current?.(resolved);
    },
    [controlled],
  );
  return [current, set] as const;
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where(.dark, [data-theme="dark"]) { color-scheme: dark; }
:where([data-theme="light"]) { color-scheme: light; }

/* Evals: header with prompt, version and model, then cards on the panel */
.ui-ev {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}
.ui-ev__head { position: relative; display: flex; flex: none; align-items: center; justify-content: space-between; gap: 12px; height: 60px; padding: 0 16px 0 24px; }
.ui-ev__title { display: flex; align-items: center; gap: 8px; min-width: 0; }
.ui-ev__title h1 { display: flex; align-items: center; gap: 8px; margin: 0 4px 0 0; font-size: var(--tc-font-size-xl, 16px); line-height: var(--tc-line-height-loose, 24px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); white-space: nowrap; }
/* Version picker and model: small controls on the control scale */
.ui-ev__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: var(--tc-control-h-sm, 28px);
  padding: 0 var(--tc-control-px-sm, 10px);
  border-radius: var(--tc-control-radius-sm, 8px);
  background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)));
  font-size: var(--tc-font-size-sm-plus, 12.5px);
  line-height: var(--tc-line-height-snug, 18px);
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
  white-space: nowrap;
}
.ui-ev__chip--model { flex: 0 1 auto; min-width: 0; }
.ui-ev__chip > svg { flex: none; }
.ui-ev__chip:not(.ui-ev__chip--btn) { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: var(--tc-font-size-sm, 12px); }
.ui-ev__chip--btn { font-weight: var(--tc-control-font-weight, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); transition: background-color var(--tc-duration-quick, 120ms) var(--tc-ease-standard, ease); }
.ui-ev__chip--btn:hover, .ui-ev__chip--btn[aria-expanded="true"] { background: var(--tc-fill-strong, light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.12))); }
.ui-ev__chip--btn:focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); }
.ui-ev__current { font-weight: var(--tc-font-weight-regular, 400); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-ev__actions { display: flex; flex: none; align-items: center; gap: 12px; }
.ui-ev__meta { font-size: var(--tc-font-size-md, 13px); line-height: var(--tc-line-height-normal, 20px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); font-variant-numeric: tabular-nums; white-space: nowrap; }

/* Thin progress line under the header while a run is going */
.ui-ev__progress { position: absolute; left: 16px; right: 16px; bottom: 0; height: 2px; border-radius: var(--tc-meter-radius, 999px); overflow: hidden; background: var(--tc-meter-track, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); opacity: 0; transition: opacity var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease); }
.ui-ev__progress[data-on] { opacity: 1; }
.ui-ev__progress i { display: block; height: 100%; border-radius: inherit; background: var(--tc-meter-fill, #2f68ff); transition: width var(--tc-duration-base, 200ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)); }

/* Two columns for the chart and the diff; the test cases span both below */
.ui-ev__content {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(0, 1fr) 400px;
  grid-template-rows: auto auto minmax(380px, 1fr);
  gap: 12px;
  padding: 12px 16px 16px;
}
.ui-ev__card { border-radius: var(--tc-card-radius, 16px); background: var(--tc-surface-raised, light-dark(#ffffff, #19191b)); box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-ev__cap { font-size: var(--tc-font-size-md, 13px); line-height: var(--tc-line-height-normal, 20px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }

.ui-ev__stats { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.ui-ev__stat { display: grid; grid-template-columns: 1fr auto; align-items: baseline; row-gap: 8px; padding: 14px 16px; }
.ui-ev__stat .ui-ev__cap { grid-column: 1 / -1; }
.ui-ev__stat strong { font-size: var(--tc-font-size-3xl, 24px); line-height: var(--tc-line-height-display, 32px); font-weight: var(--tc-font-weight-medium, 500); letter-spacing: var(--tc-tracking-tight, -0.02em); color: var(--tc-text-primary, light-dark(#171717, #ededed)); font-variant-numeric: tabular-nums; }
.ui-ev__stat small { margin-left: 1px; font-size: var(--tc-font-size-md, 13px); font-weight: var(--tc-font-weight-regular, 400); letter-spacing: 0; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-ev__delta { font-size: var(--tc-font-size-sm, 12px); line-height: var(--tc-line-height-tight, 16px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-status-danger-fg, light-dark(#c2331f, #ff977d)); font-variant-numeric: tabular-nums; }
.ui-ev__delta[data-good] { color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c)); }
.ui-ev__delta span { font-weight: var(--tc-font-weight-regular, 400); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }

/* Test cases: the table scrolls inside its tray, so the row always fits the screen */
/* Full width, with the same room above it as a section in the other screens (38px from the content above) */
.ui-ev__cases { position: relative; display: flex; flex-direction: column; grid-column: 1 / -1; min-height: 0; margin-top: 26px; overflow: hidden; }
.ui-ev__cases-head { display: flex; flex: none; align-items: center; justify-content: space-between; gap: 12px; min-height: 32px; margin-bottom: 10px; padding-left: 2px; }
.ui-ev__cases-head h2 { display: flex; align-items: center; gap: 6px; margin: 0; font-size: var(--tc-font-size-xl, 16px); line-height: var(--tc-line-height-relaxed, 22px); font-weight: var(--tc-font-weight-medium, 500); letter-spacing: var(--tc-tracking-snug, -0.01em); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-ev__cases-head h2 span { font-weight: var(--tc-font-weight-regular, 400); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
/* Tray: the column labels stay on the tray while the rows scroll in a card below them */
.ui-ev__scroll { position: absolute; inset: 42px 0 0; overflow: auto; overscroll-behavior: contain; padding: 0 var(--tc-tray-inset, 4px) var(--tc-tray-inset, 4px); border-radius: var(--tc-tray-radius, calc(16px + 4px)); background: var(--tc-surface-tray, light-dark(#f0f0f0, #19191b)); }
.ui-ev__table { width: 100%; border-collapse: separate; border-spacing: 0; table-layout: fixed; font-size: var(--tc-font-size-md, 13px); line-height: var(--tc-line-height-normal, 20px); }
.ui-ev__table th {
  position: sticky;
  z-index: 1;
  top: 0;
  height: 34px;
  padding: 0 12px;
  background: var(--tc-surface-tray, light-dark(#f0f0f0, #19191b));
  font-weight: var(--tc-font-weight-medium, 500);
  font-size: var(--tc-font-size-sm, 12px);
  text-align: left;
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
}
.ui-ev__table th:nth-child(1) { width: 30%; padding-left: 16px; }
.ui-ev__table th:nth-child(2) { width: 22%; }
.ui-ev__table th:nth-child(4) { width: 120px; }
.ui-ev__table th:nth-child(5) { width: 76px; padding-right: 16px; text-align: right; }
.ui-ev__table td { height: 40px; padding: 0 12px; background: var(--tc-surface-on-tray, light-dark(#ffffff, #232326)); color: var(--tc-text-primary, light-dark(#171717, #ededed)); transition: background-color var(--tc-duration-quick, 120ms) var(--tc-ease-standard, ease); }
.ui-ev__table tbody tr + tr td { border-top: var(--tc-hairline, 1px) solid var(--tc-divider, light-dark(#ececec, #2a2a2e)); }
.ui-ev__table tbody tr:first-child td { border-top: var(--tc-hairline, 1px) solid var(--tc-border-default, light-dark(#ececec, #2a2a2e)); }
.ui-ev__table tbody tr:last-child td { border-bottom: var(--tc-hairline, 1px) solid var(--tc-border-default, light-dark(#ececec, #2a2a2e)); }
.ui-ev__table tbody td:first-child { border-left: var(--tc-hairline, 1px) solid var(--tc-border-default, light-dark(#ececec, #2a2a2e)); }
.ui-ev__table tbody td:last-child { border-right: var(--tc-hairline, 1px) solid var(--tc-border-default, light-dark(#ececec, #2a2a2e)); }
.ui-ev__table tbody tr:first-child td:first-child { border-top-left-radius: var(--tc-card-radius, 16px); }
.ui-ev__table tbody tr:first-child td:last-child { border-top-right-radius: var(--tc-card-radius, 16px); }
.ui-ev__table tbody tr:last-child td:first-child { border-bottom-left-radius: var(--tc-card-radius, 16px); }
.ui-ev__table tbody tr:last-child td:last-child { border-bottom-right-radius: var(--tc-card-radius, 16px); }
.ui-ev__table td:first-child { padding-left: 16px; }
.ui-ev__table td:last-child { padding-right: 16px; }
.ui-ev__in { display: flex; align-items: center; gap: 8px; min-width: 0; }
.ui-ev__table tbody tr { cursor: pointer; }
.ui-ev__table tbody tr:hover td { background: var(--tc-fill-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); }
/* Selected case: the selected fill plus a bar in the selected colour at its start – not a tint alone */
.ui-ev__table tbody tr[aria-selected="true"] td { background: var(--tc-fill-selected, light-dark(rgba(47, 107, 255, 0.08), rgba(91, 154, 255, 0.14))); }
.ui-ev__table tbody tr[aria-selected="true"] td:first-child { box-shadow: inset 3px 0 0 var(--tc-border-selected, light-dark(#2f68ff, #6b95ff)); }
.ui-ev__table tbody tr[data-state="running"] td { background: var(--tc-accent-subtle, light-dark(rgba(47, 107, 255, 0.08), rgba(79, 130, 255, 0.16))); }
.ui-ev__table tbody tr:focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: calc(var(--tc-focus-ring-width, 2px) * -1); }
.ui-ev__table tbody tr[data-state="queued"] td { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-ev__trunc { display: block; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-ev__soft { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-ev__id { flex: none; font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: var(--tc-font-size-xs-plus, 11.5px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-ev__table td.ui-ev__num { text-align: right; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); font-variant-numeric: tabular-nums; }

/* Score pill – pass, partial, fail, or the run state: the status pill pattern, the dot and the word carry it, not the colour */
.ui-ev__pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: var(--tc-pill-h-lg, 22px);
  padding: 0 var(--tc-pill-px, 8px);
  border-radius: var(--tc-pill-radius, 999px);
  font-size: var(--tc-pill-font-size-lg, 12px);
  line-height: var(--tc-line-height-tight, 16px);
  font-weight: var(--tc-pill-font-weight, 500);
  white-space: nowrap;
  animation: ui-ev-pop var(--tc-duration-slow, 320ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)) both;
}
.ui-ev__pill > i:not(.ui-ev__spin) { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.ui-ev__pill > span { font-weight: var(--tc-font-weight-regular, 400); font-variant-numeric: tabular-nums; }
.ui-ev__pill[data-v="pass"] { background: var(--tc-status-success-bg, light-dark(#e6f6ec, #12301f)); color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c)); }
.ui-ev__pill[data-v="partial"] { background: var(--tc-status-warning-bg, light-dark(#fff3e0, #3a2410)); color: var(--tc-status-warning-fg, light-dark(#a35200, #ffa057)); }
.ui-ev__pill[data-v="fail"] { background: var(--tc-status-danger-bg, light-dark(#fdecea, #3b1714)); color: var(--tc-status-danger-fg, light-dark(#c2331f, #ff977d)); }
.ui-ev__pill[data-v="queued"] { background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); font-weight: var(--tc-font-weight-regular, 400); animation: none; }
.ui-ev__pill[data-v="running"] { background: var(--tc-status-info-bg, light-dark(#eaf1ff, #16243f)); color: var(--tc-status-info-fg, light-dark(#2456d6, #8ab4ff)); animation: none; }
.ui-ev__spin { width: 10px; height: 10px; border: 1.5px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: ui-ev-spin var(--tc-duration-reveal, 700ms) linear infinite; }
@keyframes ui-ev-pop { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: none; } }
@keyframes ui-ev-spin { to { transform: rotate(1turn); } }

/* Room for the sidebar icon while the sidebar is collapsed */
.ui-ev__head { transition: padding-left var(--tc-duration-slower, 420ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)); }
.ui-as-app[data-collapsed] .ui-ev__head { padding-left: 52px; }

@media (prefers-reduced-motion: reduce) {
  .ui-ev__pill { animation: none; }
}

/* Narrow panels: one column; the table gets its own height */
@container ui-as-main (max-width: 1000px) {
  .ui-ev__content { grid-template-columns: minmax(0, 1fr); grid-template-rows: none; }
  .ui-ev__cases { height: 440px; }
}
@container ui-as-main (max-width: 820px) {
  .ui-ev__stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .ui-ev__table { min-width: 720px; }
}
@container ui-as-main (max-width: 560px) {
  .ui-ev__stats { gap: 8px; }
  .ui-ev__stat { padding: 12px; }
  .ui-ev__stat strong { font-size: var(--tc-font-size-2xl, 20px); line-height: var(--tc-line-height-display-sm, 28px); }
  .ui-ev__cases-head { flex-wrap: wrap; }
  .ui-ev__scroll { top: 84px; }
}
@container ui-as (max-width: 900px) {
  .ui-ev__head { padding-left: 52px; }
  .ui-ev__meta { display: none; }
}
@container ui-as (max-width: 600px) {
  /* Title next to the sidebar icon, version, model and Run on a row below */
  .ui-ev__head { flex-wrap: wrap; row-gap: 10px; height: auto; padding: 14px 8px 12px 52px; }
  .ui-ev__title { flex-wrap: wrap; row-gap: 8px; }
  .ui-ev__title h1 { width: 100%; }
  .ui-ev__actions { margin-left: auto; }
  .ui-ev__content { gap: 8px; padding: 8px 8px 8px; }
}
`;
