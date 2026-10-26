import { useEffect, useRef, useState } from "react";
import type * as UI from "@components/agent-inbox";
import type { AgentTask } from "@components/agent-inbox";

/* Background tasks that move on their own: running tasks gather steps and tool calls, one finishes,
   another stops to ask you. Approve / Reject / Retry update the list, and "New task" adds one. */

const MIN = 60_000;

function initialTasks(now: number): AgentTask[] {
  return [
    {
      id: "refund",
      title: "Refund duplicate charge for Acme Corp",
      description: "Found two identical charges of $1,240 on Oct 21. Ready to refund the second one to the card on file.",
      agent: "Opus 5.5",
      status: "waiting",
      startedAt: now - 4 * MIN - 12_000,
      tools: 6,
      sources: 3,
      steps: [
        { label: "Opened ticket #4821", time: "4m ago" },
        { label: "Looked up invoices in Stripe", time: "3m ago" },
        { label: "Matched duplicate charge", time: "2m ago" },
        { label: "Drafted refund of $1,240", time: "1m ago" },
      ],
    },
    {
      id: "migrate",
      title: "Migrate billing tests to Vitest",
      description: "Converting 38 Jest suites. 21 done, all green so far.",
      agent: "Sonnet 5",
      status: "running",
      startedAt: now - 11 * MIN,
      tools: 42,
      sources: 38,
      steps: [
        { label: "Scanned test folders", time: "11m ago" },
        { label: "Converted invoice.test.ts", time: "6m ago" },
        { label: "Converted tax.test.ts", time: "3m ago" },
      ],
    },
    {
      id: "digest",
      title: "Write the weekly customer digest",
      description: "Summarising 214 support conversations into themes for Monday's review.",
      agent: "Haiku 5",
      status: "running",
      startedAt: now - 2 * MIN - 30_000,
      tools: 9,
      sources: 214,
      steps: [
        { label: "Pulled conversations from Intercom", time: "2m ago" },
        { label: "Clustered into 7 themes", time: "1m ago" },
      ],
    },
    {
      id: "deps",
      title: "Upgrade React Router to v7",
      description: "Build failed on a type error in routes/settings.tsx after the upgrade.",
      agent: "Sonnet 5",
      status: "failed",
      elapsed: 7 * MIN + 41_000,
      tools: 17,
      sources: 12,
      steps: [
        { label: "Bumped package versions", time: "14:02" },
        { label: "Rewrote 9 route definitions", time: "14:06" },
        { label: "Build failed: TS2322 in settings.tsx", time: "14:09" },
      ],
    },
    {
      id: "seo",
      title: "Audit pricing page for SEO",
      description: "Fixed 4 missing meta tags and two broken canonical links.",
      agent: "Haiku 5",
      status: "done",
      elapsed: 3 * MIN + 5_000,
      tools: 11,
      sources: 6,
      steps: [
        { label: "Crawled /pricing", time: "13:40" },
        { label: "Opened PR #318", time: "13:43" },
      ],
    },
  ];
}

const MIGRATE_STEPS = ["Converted proration.test.ts", "Converted coupons.test.ts", "Converted webhooks.test.ts", "All 38 suites green"];
const DIGEST_STEPS = ["Wrote theme summaries", "Picked 3 quotes per theme"];

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AgentInbox } = ui;
  const [tasks, setTasks] = useState<AgentTask[]>(() => initialTasks(Date.now()));
  const step = useRef(0);
  const made = useRef(0);

  const patch = (id: string, fn: (t: AgentTask) => AgentTask) => setTasks((ts) => ts.map((t) => (t.id === id ? fn(t) : t)));
  const addStep = (t: AgentTask, label: string): AgentTask => ({ ...t, steps: [...(t.steps ?? []), { label, time: "just now" }], tools: (t.tools ?? 0) + 2 });
  const finish = (t: AgentTask, status: AgentTask["status"]): AgentTask => ({ ...t, status, elapsed: Date.now() - Number(t.startedAt ?? Date.now()) });

  // The script: one beat every 4s, looping after the last one
  useEffect(() => {
    const id = setInterval(() => {
      const n = step.current++;
      if (n < 4) patch("migrate", (t) => addStep(t, MIGRATE_STEPS[n]));
      if (n === 4) patch("migrate", (t) => ({ ...finish(t, "done"), description: "Converted all 38 suites – CI is green." }));
      if (n === 1) patch("digest", (t) => addStep(t, DIGEST_STEPS[0]));
      if (n === 3)
        patch("digest", (t) => ({
          ...addStep(t, DIGEST_STEPS[1]),
          status: "waiting",
          description: "Draft is ready. Post it to #customer-voice?",
        }));
      if (n >= 9) {
        step.current = 0;
        setTasks(initialTasks(Date.now()));
      }
    }, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ width: "100%", maxWidth: 860 }}>
      <AgentInbox
        title="Agent tasks"
        tasks={tasks}
        defaultView="board"
        onApprove={(t) => patch(t.id, (x) => ({ ...finish(x, "done"), tools: (x.tools ?? 0) + 1, steps: [...(x.steps ?? []), { label: "Approved by you", time: "just now" }] }))}
        onReject={(t) => patch(t.id, (x) => ({ ...finish(x, "failed"), description: "Rejected by you – nothing was changed.", steps: [...(x.steps ?? []), { label: "Rejected by you", time: "just now" }] }))}
        onRetry={(t) =>
          patch(t.id, (x) => ({
            ...x,
            status: "running",
            startedAt: Date.now(),
            elapsed: undefined,
            description: "Retrying with the type fix for settings.tsx.",
            steps: [...(x.steps ?? []), { label: "Retry started", time: "just now" }],
          }))
        }
        onOpen={() => {}}
        action={{
          label: "New task",
          onClick: () => {
            const id = `new${++made.current}`;
            setTasks((ts) => [
              { id, title: "Summarise yesterday's incidents", description: "Reading the on-call channel and PagerDuty timeline.", agent: "Haiku 5", status: "running", startedAt: Date.now(), tools: 0, sources: 0, steps: [{ label: "Started", time: "just now" }] },
              ...ts,
            ]);
          },
        }}
      />
    </div>
  );
}
