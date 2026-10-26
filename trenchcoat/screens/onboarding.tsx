"use client";

/*
 * Onboarding – the first-run flow of an AI workspace, in a single file.
 * A greeting, a four-part progress bar and one step at a time: name the workspace, connect tools,
 * invite the team, pick a first agent. A quiet "Getting started" card mirrors the progress beside it,
 * and finishing ends on a calm success state with next steps.
 * Sits in the Trenchcoat App Shell.
 * Imports: app-shell (AppShell, Icon, MenuButton, useToast), button and segmented-control from `@/components/ui/<name>` –
 * copy them alongside; icons from lucide-react 1.55.0; brand marks from Simple Icons (CC0).
 */

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import type { LucideIcon } from "lucide-react";
import {
  ChartColumnBigIcon,
  ChartColumnIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  HeadsetIcon,
  HouseIcon,
  LayoutDashboardIcon,
  LinkIcon,
  MessageCircleMoreIcon,
  UserSearchIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { AppShell, Icon, MenuButton, useToast, type AppShellProps, type ShellNavItem } from "@/components/ui/app-shell";

const nav: ShellNavItem[] = [
  { label: "Home", icon: HouseIcon },
  { label: "Chat", icon: MessageCircleMoreIcon },
  { label: "Analytics", icon: ChartColumnBigIcon },
  { label: "Integrations", icon: LayoutDashboardIcon },
];

/* ---------- Data ---------- */

const STEPS = [
  { id: "workspace", short: "Workspace", title: "Workspace", heading: "Set up your workspace", text: "Give it a name and an address your team will recognize.", time: "About 1 min" },
  { id: "tools", short: "Tools", title: "Connect your tools", heading: "Connect your tools", text: "Your agents can read from and act in the apps you connect. Change this anytime.", time: "About 1 min" },
  { id: "team", short: "Team", title: "Invite your team", heading: "Invite your team", text: "Work together on chats, folders and agents. They'll get an email invite.", time: "Under a minute" },
  { id: "agent", short: "Agent", title: "Your first agent", heading: "Create your first agent", text: "Start from a template – you can change its instructions and tools later.", time: "About 1 min" },
] as const;

type Tool = { id: string; name: string; description: string; logo: ReactNode; tile?: string };

const mark = (d: string, color: string) => (
  <svg viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d={d} />
  </svg>
);

const SlackLogo = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#E01E5A" d="M5.04 15.17a2.53 2.53 0 0 1-2.52 2.52A2.53 2.53 0 0 1 0 15.17a2.53 2.53 0 0 1 2.52-2.53h2.52zm1.27 0a2.53 2.53 0 0 1 2.53-2.53 2.53 2.53 0 0 1 2.52 2.53v6.31A2.53 2.53 0 0 1 8.84 24a2.53 2.53 0 0 1-2.53-2.52z" />
    <path fill="#36C5F0" d="M8.84 5.04a2.53 2.53 0 0 1-2.53-2.52A2.53 2.53 0 0 1 8.84 0a2.53 2.53 0 0 1 2.52 2.52v2.52zm0 1.27a2.53 2.53 0 0 1 2.52 2.53 2.53 2.53 0 0 1-2.52 2.52H2.52A2.53 2.53 0 0 1 0 8.84a2.53 2.53 0 0 1 2.52-2.53z" />
    <path fill="#2EB67D" d="M18.96 8.84a2.53 2.53 0 0 1 2.52-2.53A2.53 2.53 0 0 1 24 8.84a2.53 2.53 0 0 1-2.52 2.52h-2.52zm-1.27 0a2.53 2.53 0 0 1-2.53 2.52 2.53 2.53 0 0 1-2.52-2.52V2.52A2.53 2.53 0 0 1 15.16 0a2.53 2.53 0 0 1 2.53 2.52z" />
    <path fill="#ECB22E" d="M15.16 18.96a2.53 2.53 0 0 1 2.53 2.52A2.53 2.53 0 0 1 15.16 24a2.53 2.53 0 0 1-2.52-2.52v-2.52zm0-1.27a2.53 2.53 0 0 1-2.52-2.53 2.53 2.53 0 0 1 2.52-2.52h6.32A2.53 2.53 0 0 1 24 15.16a2.53 2.53 0 0 1-2.52 2.53z" />
  </svg>
);

const tools: Tool[] = [
  { id: "slack", name: "Slack", description: "Ask your agents from any channel and get their reports there.", logo: <SlackLogo /> },
  {
    id: "notion",
    name: "Notion",
    description: "Search pages while you chat and save answers as docs.",
    logo: mark(
      "M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z",
      "currentColor",
    ),
  },
  {
    id: "google-drive",
    name: "Google Drive",
    description: "Pick files from Drive and let agents read them for context.",
    logo: mark(
      "M12.01 1.485c-2.082 0-3.754.02-3.743.047.01.02 1.708 3.001 3.774 6.62l3.76 6.574h3.76c2.081 0 3.753-.02 3.742-.047-.005-.02-1.708-3.001-3.775-6.62l-3.76-6.574zm-4.76 1.73a789.828 789.861 0 0 0-3.63 6.319L0 15.868l1.89 3.298 1.885 3.297 3.62-6.335 3.618-6.33-1.88-3.287C8.1 4.704 7.255 3.22 7.25 3.214zm2.259 12.653-.203.348c-.114.198-.96 1.672-1.88 3.287a423.93 423.948 0 0 1-1.698 2.97c-.01.026 3.24.042 7.222.042h7.244l1.796-3.157c.992-1.734 1.85-3.23 1.906-3.323l.104-.167h-7.249z",
      "#1FA463",
    ),
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "Look up contacts and deals, and log what agents find.",
    logo: mark(
      "M18.164 7.93V5.084a2.198 2.198 0 001.267-1.978v-.067A2.2 2.2 0 0017.238.845h-.067a2.2 2.2 0 00-2.193 2.193v.067a2.196 2.196 0 001.252 1.973l.013.006v2.852a6.22 6.22 0 00-2.969 1.31l.012-.01-7.828-6.095A2.497 2.497 0 104.3 4.656l-.012.006 7.697 5.991a6.176 6.176 0 00-1.038 3.446c0 1.343.425 2.588 1.147 3.607l-.013-.02-2.342 2.343a1.968 1.968 0 00-.58-.095h-.002a2.033 2.033 0 102.033 2.033 1.978 1.978 0 00-.1-.595l.005.014 2.317-2.317a6.247 6.247 0 104.782-11.134l-.036-.005zm-.964 9.378a3.206 3.206 0 113.215-3.207v.002a3.206 3.206 0 01-3.207 3.207z",
      "#FF7A59",
    ),
  },
  {
    id: "linear",
    name: "Linear",
    description: "Turn requests from chat into issues and follow them to release.",
    tile: "#5E6AD2",
    logo: mark(
      "M2.886 4.18A11.982 11.982 0 0 1 11.99 0C18.624 0 24 5.376 24 12.009c0 3.64-1.62 6.903-4.18 9.105L2.887 4.18ZM1.817 5.626l16.556 16.556c-.524.33-1.075.62-1.65.866L.951 7.277c.247-.575.537-1.126.866-1.65ZM.322 9.163l14.515 14.515c-.71.172-1.443.282-2.195.322L0 11.358a12 12 0 0 1 .322-2.195Zm-.17 4.862 9.823 9.824a12.02 12.02 0 0 1-9.824-9.824Z",
      "#ffffff",
    ),
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Schedule agent runs and prepare briefs before meetings.",
    logo: mark(
      "M18.316 5.684H24v12.632h-5.684V5.684zM5.684 24h12.632v-5.684H5.684V24zM18.316 5.684V0H1.895A1.894 1.894 0 0 0 0 1.895v16.421h5.684V5.684h12.632zm-7.207 6.25v-.065c.272-.144.5-.349.687-.617s.279-.595.279-.982c0-.379-.099-.72-.3-1.025a2.05 2.05 0 0 0-.832-.714 2.703 2.703 0 0 0-1.197-.257c-.6 0-1.094.156-1.481.467-.386.311-.65.671-.793 1.078l1.085.452c.086-.249.224-.461.413-.633.189-.172.445-.257.767-.257.33 0 .602.088.816.264a.86.86 0 0 1 .322.703c0 .33-.12.589-.36.778-.24.19-.535.284-.886.284h-.567v1.085h.633c.407 0 .748.109 1.02.327.272.218.407.499.407.843 0 .336-.129.614-.387.832s-.565.327-.924.327c-.351 0-.651-.103-.897-.311-.248-.208-.422-.502-.521-.881l-1.096.452c.178.616.505 1.082.977 1.401.472.319.984.478 1.538.477a2.84 2.84 0 0 0 1.293-.291c.382-.193.684-.458.902-.794.218-.336.327-.72.327-1.149 0-.429-.115-.797-.344-1.105a2.067 2.067 0 0 0-.881-.689zm2.093-1.931l.602.913L15 10.045v5.744h1.187V8.446h-.827l-2.158 1.557zM22.105 0h-3.289v5.184H24V1.895A1.894 1.894 0 0 0 22.105 0zm-3.289 23.5l4.684-4.684h-4.684V23.5zM0 22.105C0 23.152.848 24 1.895 24h3.289v-5.184H0v3.289z",
      "#4285F4",
    ),
  },
];

const sizes = [
  { value: "1", label: "Just me" },
  { value: "2-10", label: "2–10" },
  { value: "11-50", label: "11–50" },
  { value: "51-200", label: "51–200" },
  { value: "200+", label: "200+" },
];

type Role = "member" | "admin" | "viewer";
const roles: { value: Role; label: string }[] = [
  { value: "member", label: "Member" },
  { value: "admin", label: "Admin" },
  { value: "viewer", label: "Viewer" },
];

const templates: { id: string; name: string; text: string; meta: string; icon: LucideIcon }[] = [
  { id: "weekly-report", name: "Weekly report", text: "Pulls numbers and updates from your tools into a short Monday summary.", meta: "Every Monday", icon: ChartColumnIcon },
  { id: "lead-research", name: "Lead research", text: "Researches new sign-ups and adds company notes to your CRM.", meta: "On new leads", icon: UserSearchIcon },
  { id: "support-triage", name: "Support triage", text: "Sorts incoming requests, drafts replies and flags anything urgent.", meta: "On new tickets", icon: HeadsetIcon },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);

/* ---------- Screen ---------- */

export type OnboardingValues = {
  workspace: string;
  slug: string;
  teamSize: string;
  tools: string[];
  invites: string[];
  role: Role;
  template: string;
};

/** 1–4 are the steps, 5 is the finished state */
export type OnboardingStep = 1 | 2 | 3 | 4 | 5;

type OnboardingOwnProps = Pick<AppShellProps, "onNavigate" | "workspace" | "user"> & {
  /** Step shown (1–4, 5 = finished) – controlled; use `defaultStep` for a starting step */
  step?: OnboardingStep;
  /** Step shown first (1–4) when `step` isn't controlled; the steps before it count as done */
  defaultStep?: 1 | 2 | 3 | 4;
  /** Called with the step the flow moves to */
  onStepChange?: (step: OnboardingStep) => void;
  /**
   * Called after "Create agent" (or skipping the last step) with everything that was entered. May return a promise:
   * the button shows "Creating agent" until it settles, and a rejection keeps the step open with the error to retry
   */
  onComplete?: (values: OnboardingValues) => void | Promise<unknown>;
};

/** `className`, other DOM props and `ref` go to the App Shell's root */
export type OnboardingScreenProps = Omit<ComponentPropsWithoutRef<"div">, keyof OnboardingOwnProps | "children"> &
  OnboardingOwnProps & { ref?: Ref<HTMLDivElement> };

type Status = "done" | "skipped";

export function OnboardingScreen({
  step: stepProp,
  defaultStep = 2,
  onStepChange,
  onComplete,
  onNavigate,
  workspace,
  user,
  ref,
  ...rest
}: OnboardingScreenProps) {
  const workspaceName = workspace ?? "Acme";
  const firstName = (user?.name ?? "Alex Morgan").split(" ")[0];

  // 0–3 are the steps, 4 is the finished state
  const [stepNo, setStepNo] = useControllable<OnboardingStep>(stepProp, defaultStep, onStepChange, "step");
  const step = Math.min(Math.max(stepNo, 1), 5) - 1;
  // Slide direction follows the step, wherever the change came from (adjusted during render, React's pattern)
  const [prevStep, setPrevStep] = useState(step);
  const [dir, setDir] = useState<"next" | "back">("next");
  if (step !== prevStep) {
    setPrevStep(step);
    setDir(step > prevStep ? "next" : "back");
  }
  const [status, setStatus] = useState<Record<number, Status>>(() =>
    Object.fromEntries(Array.from({ length: defaultStep - 1 }, (_, i) => [i, "done" as Status])),
  );

  // The name follows `workspace` until it's edited; the URL follows the name until it's edited
  const [nameDraft, setName] = useState<string | null>(null);
  const name = nameDraft ?? workspaceName;
  const [slugDraft, setSlug] = useState<string | null>(null);
  const slug = slugDraft ?? slugify(name);
  const [teamSize, setTeamSize] = useState("2-10");
  const [nameError, setNameError] = useState(false);

  const [connected, setConnected] = useState<Set<string>>(() => new Set(["slack"]));
  const [busy, setBusy] = useState<Set<string>>(() => new Set());

  const [invites, setInvites] = useState<string[]>(["jamie@acme.com"]);
  const [role, setRole] = useState<Role>("member");

  const [template, setTemplate] = useState("weekly-report");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [toast, showToast] = useToast();
  const rootRef = useRef<HTMLDivElement>(null);
  // A removed invite hands focus to the next one (or the field); a control that leaves with its step (Back on the
  // first step, the form after finishing, the finished state after "Start over") hands it to the new step's heading
  useFocusRescue(rootRef, (lost) => {
    const box = rootRef.current;
    if (!box) return null;
    if (lost.classList.contains("ui-ob-chip__remove")) {
      const left = [...box.querySelectorAll<HTMLElement>(".ui-ob-chip__remove")];
      return left[Math.min(Number(lost.dataset.index ?? 0), left.length - 1)] ?? box.querySelector(".ui-ob-chips input");
    }
    return box.querySelector(".ui-ob-card h2");
  });

  const timers = useRef<number[]>([]);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    const list = timers.current;
    return () => {
      alive.current = false;
      list.forEach((t) => window.clearTimeout(t));
    };
  }, []);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const values = (): OnboardingValues => ({ workspace: name.trim(), slug, teamSize, tools: [...connected], invites, role, template });

  const go = (to: number) => {
    if (to === step) return;
    setStepNo((to + 1) as OnboardingStep);
  };
  const setStepStatus = (i: number, s: Status) => setStatus((prev) => ({ ...prev, [i]: s }));

  // Hands the values over; a promise keeps "Creating agent" up until it settles, a rejection stays on the step
  const complete = (mark: () => void) => {
    const fail = (err: unknown) => {
      if (!alive.current) return;
      setCreating(false);
      setError(err instanceof Error && err.message ? err.message : "Something went wrong – try again.");
    };
    const succeed = () => {
      if (!alive.current) return;
      setCreating(false);
      mark();
      go(4);
    };
    let result: unknown;
    try {
      result = onComplete?.(values());
    } catch (err) {
      return fail(err);
    }
    if (result && typeof (result as PromiseLike<unknown>).then === "function") {
      setCreating(true);
      (result as PromiseLike<unknown>).then(succeed, fail);
    } else succeed();
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (creating) return;
    setError("");
    if (step === 0 && !name.trim()) {
      setNameError(true);
      return;
    }
    if (step === 3) {
      // Creating takes a moment – the button shimmers, then the success state
      setCreating(true);
      later(() => complete(() => setStepStatus(3, "done")), 1100);
      return;
    }
    setStepStatus(step, "done");
    go(step + 1);
  };

  const skip = () => {
    if (creating) return;
    setError("");
    const mark = () => {
      if (status[step] !== "done") setStepStatus(step, "skipped");
    };
    if (step === 3) return complete(mark);
    mark();
    go(step + 1);
  };

  const restart = () => {
    setStatus({});
    setError("");
    go(0);
  };

  const toggleTool = (tool: Tool) => {
    if (busy.has(tool.id)) return;
    if (connected.has(tool.id)) {
      setConnected((prev) => new Set([...prev].filter((id) => id !== tool.id)));
      return;
    }
    setBusy((prev) => new Set(prev).add(tool.id));
    later(() => {
      setBusy((prev) => new Set([...prev].filter((id) => id !== tool.id)));
      setConnected((prev) => new Set(prev).add(tool.id));
    }, 800);
  };

  const done = step === 4;
  const current = STEPS[Math.min(step, 3)];
  const chosen = templates.find((t) => t.id === template)!;

  const summary = (i: number) => {
    if (i === 0) return `${name.trim() || workspaceName} · ${teamSize === "1" ? "Just you" : `${sizes.find((s) => s.value === teamSize)?.label} people`}`;
    if (i === 1) return connected.size ? `${connected.size} ${connected.size === 1 ? "tool" : "tools"} connected` : "No tools yet";
    if (i === 2) return invites.length ? `${invites.length} ${invites.length === 1 ? "invite" : "invites"} sent` : "Just you for now";
    return chosen.name;
  };

  const continueLabel = step === 3 ? "Create agent" : step === 2 && invites.length > 0 ? "Send invites" : "Continue";

  return (
    <AppShell {...rest} ref={ref} active="Home" nav={nav} onNavigate={onNavigate} workspace={workspace} user={user}>
      <style href="ui-onboarding" precedence="default">
        {css}
      </style>
      <div className="ui-ob" ref={rootRef}>
        <header className="ui-ob-head">
          <span className="ui-ob-kicker">{done ? "All set" : `Step ${step + 1} of ${STEPS.length}`}</span>
          <h1 className="ui-ob-title">
            Welcome to {name.trim() || workspaceName}, {firstName}
          </h1>
          <p className="ui-ob-sub">{done ? "Your workspace is ready. Here's where to go next." : "A few quick steps and your workspace is ready – about two minutes."}</p>
          <ProgressSteps step={step} />
        </header>

        <div className="ui-ob-card">
          {done ? (
            <Success
              key="done"
              workspace={name.trim() || workspaceName}
              agent={chosen.name}
              tools={connected.size}
              invites={status[2] === "done" ? invites.length : 0}
              onNavigate={onNavigate}
              onRestart={restart}
            />
          ) : (
            <form className="ui-ob-form" onSubmit={submit} noValidate>
              <div key={step} className="ui-ob-step" data-dir={dir}>
                <div className="ui-ob-step__head">
                  <h2 className="ui-ob-step__title" tabIndex={-1}>
                    {current.heading}
                  </h2>
                  <p className="ui-ob-step__text">{current.text}</p>
                </div>

                {step === 0 && (
                  <WorkspaceStep
                    name={name}
                    nameError={nameError}
                    onName={(next) => {
                      setName(next);
                      setNameError(false);
                    }}
                    slug={slug}
                    onSlug={setSlug}
                    teamSize={teamSize}
                    onTeamSize={setTeamSize}
                  />
                )}

                {step === 1 && <ToolsStep connected={connected} busy={busy} onToggle={toggleTool} />}

                {step === 2 && (
                  <Invites
                    invites={invites}
                    onChange={setInvites}
                    role={role}
                    onRole={setRole}
                    link={`app.workspace.ai/${slug.replace(/-+$/, "") || "acme"}/join`}
                    onCopy={() => showToast("Invite link copied")}
                  />
                )}

                {step === 3 && <TemplateStep template={template} onTemplate={setTemplate} />}
              </div>

              <footer className="ui-ob-foot">
                <button type="button" className="ui-ob-skip" onClick={skip}>
                  Skip for now
                </button>
                <span className="ui-ob-foot__actions">
                  {/* Mounted from the start, so the error is announced when it comes */}
                  <span className="ui-ob-error" role="alert">
                    {error}
                  </span>
                  {step > 0 && (
                    <Button size="sm" variant="secondary" icon={<Icon icon={ChevronLeftIcon} size={14} />} onClick={() => go(step - 1)} disabled={creating}>
                      Back
                    </Button>
                  )}
                  <Button size="sm" type="submit" loading={creating} iconRight={step < 3 ? <Icon icon={ChevronRightIcon} size={14} /> : undefined}>
                    {creating ? "Creating agent" : continueLabel}
                  </Button>
                </span>
              </footer>
            </form>
          )}
        </div>

        <Checklist step={step} status={status} summary={summary} onPick={go} />
      </div>
      {toast}
    </AppShell>
  );
}

/* ---------- Progress ---------- */

/** Four steps in a row: a check once done, a dark ring on the current one */
function ProgressSteps({ step }: { step: number }) {
  const done = step === 4;
  return (
    <ol className="ui-ob-steps" aria-label="Onboarding progress">
      {STEPS.map((s, i) => {
        const st = done || i < step ? "done" : i === step ? "current" : "next";
        return (
          <li key={s.id} className="ui-ob-steps__item" data-state={st} aria-current={st === "current" ? "step" : undefined}>
            <span className="ui-ob-steps__mark" aria-hidden="true">
              {st === "done" ? <Icon key="done" icon={CheckIcon} size={11} stroke={2.4} /> : i + 1}
            </span>
            <span className="ui-ob-steps__label">
              {s.short}
              <span className="ui-ob-sr">{st === "done" ? ", done" : st === "current" ? ", current step" : ""}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** The "Setup checklist" beside the steps: what's done, skipped or next – each item opens its step */
function Checklist({
  step,
  status,
  summary,
  onPick,
}: {
  step: number;
  status: Record<number, Status>;
  summary: (i: number) => string;
  onPick: (i: number) => void;
}) {
  const doneCount = Object.values(status).filter((s) => s === "done").length;
  return (
    <aside className="ui-ob-aside" aria-label="Setup checklist">
      <div className="ui-ob-check">
        <div className="ui-ob-check__head">
          <b>Setup checklist</b>
          <span className="ui-ob-check__count">
            <span key={doneCount}>{doneCount}</span>/{STEPS.length}
          </span>
        </div>
        <span className="ui-ob-check__bar" aria-hidden="true">
          <i style={{ transform: `scaleX(${doneCount / STEPS.length})` }} />
        </span>
        <ol className="ui-ob-check__list">
          {STEPS.map((s, i) => {
            const st = status[i] ?? (i === step ? "current" : "todo");
            return (
              <li key={s.id}>
                <button type="button" className="ui-ob-check__item" data-state={st} aria-current={i === step ? "step" : undefined} onClick={() => onPick(i)}>
                  <span className="ui-ob-check__mark" aria-hidden="true">
                    {st === "done" ? <Icon key="done" icon={CheckIcon} size={11} stroke={2.6} /> : st === "skipped" ? <i className="ui-ob-dash" /> : null}
                  </span>
                  <span className="ui-ob-check__text">
                    <span className="ui-ob-check__label">{s.title}</span>
                    <span className="ui-ob-check__sub">
                      {st === "done" ? summary(i) : st === "skipped" ? "Skipped – pick it up anytime" : st === "current" ? "In progress" : s.time}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      <button type="button" className="ui-ob-help">
        <span className="ui-ob-help__icon">
          <Icon icon={HeadsetIcon} size={15} />
        </span>
        <span>
          <b>Need a hand?</b>
          <span>Book a free 15-minute setup call</span>
        </span>
      </button>
    </aside>
  );
}

/* ---------- Workspace step ---------- */

function WorkspaceStep({
  name,
  nameError,
  onName,
  slug,
  onSlug,
  teamSize,
  onTeamSize,
}: {
  name: string;
  nameError: boolean;
  onName: (name: string) => void;
  slug: string;
  onSlug: (slug: string) => void;
  teamSize: string;
  onTeamSize: (size: string) => void;
}) {
  const sizeLabel = useId();
  const nameHint = useId();
  return (
    <div className="ui-ob-fields">
      <label className="ui-ob-field">
        <span className="ui-ob-label">Workspace name</span>
        <input
          className="ui-ob-input"
          value={name}
          aria-invalid={nameError || undefined}
          aria-describedby={nameError ? nameHint : undefined}
          placeholder="e.g. Acme"
          onChange={(e) => onName(e.target.value)}
        />
        {nameError && (
          <span className="ui-ob-error" id={nameHint}>
            Give your workspace a name to continue.
          </span>
        )}
      </label>
      <label className="ui-ob-field">
        <span className="ui-ob-label">Workspace URL</span>
        <span className="ui-ob-input ui-ob-input--prefix">
          <span className="ui-ob-prefix">app.workspace.ai/</span>
          <input
            value={slug}
            placeholder="acme"
            aria-label="Workspace URL"
            onChange={(e) => onSlug(slugify(e.target.value) + (e.target.value.endsWith("-") ? "-" : ""))}
          />
        </span>
        <span className="ui-ob-hint">
          {slug ? (
            <>
              Your team signs in at <b>app.workspace.ai/{slug.replace(/-+$/, "")}</b>
            </>
          ) : (
            "Letters, numbers and dashes"
          )}
        </span>
      </label>
      <div className="ui-ob-field">
        <span className="ui-ob-label" id={sizeLabel}>
          How many people will use it?
        </span>
        <SegmentedControl options={sizes} value={teamSize} onChange={onTeamSize} fullWidth aria-labelledby={sizeLabel} />
      </div>
    </div>
  );
}

/* ---------- Tools step ---------- */

function ToolsStep({ connected, busy, onToggle }: { connected: Set<string>; busy: Set<string>; onToggle: (tool: Tool) => void }) {
  return (
    <ul className="ui-ob-tools">
      {tools.map((tool, i) => {
        const on = connected.has(tool.id);
        const loading = busy.has(tool.id);
        return (
          <li key={tool.id} className="ui-ob-tool" style={{ "--i": i } as CSSProperties}>
            <span className="ui-ob-logo" style={tool.tile ? { background: tool.tile, boxShadow: "none" } : undefined}>
              {tool.logo}
            </span>
            <span className="ui-ob-tool__text">
              <span className="ui-ob-tool__name">
                {tool.name}
                {on && <span className="ui-ob-tool__state">Connected</span>}
              </span>
              <span className="ui-ob-tool__desc">{tool.description}</span>
            </span>
            {loading && <span className="ui-ob-spinner" aria-hidden="true" />}
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-busy={loading || undefined}
              aria-label={`Connect ${tool.name}`}
              className="ui-ob-switch"
              data-busy={loading || undefined}
              onClick={() => onToggle(tool)}
            />
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- Agent step ---------- */

function TemplateStep({ template, onTemplate }: { template: string; onTemplate: (id: string) => void }) {
  // A radio group: one tab stop (the checked card), arrow keys move the choice and focus together
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = templates.length;
    const at = Math.max(0, templates.findIndex((t) => t.id === template));
    const moves: Record<string, number> = { ArrowRight: at + 1, ArrowDown: at + 1, ArrowLeft: at - 1 + n, ArrowUp: at - 1 + n, Home: 0, End: n - 1 };
    if (!(e.key in moves)) return;
    e.preventDefault();
    const next = moves[e.key] % n;
    onTemplate(templates[next].id);
    e.currentTarget.querySelectorAll<HTMLElement>("[role=radio]")[next]?.focus();
  };
  return (
    <div className="ui-ob-templates" role="radiogroup" aria-label="Agent template" onKeyDown={onKey}>
      {templates.map((t, i) => (
        <button
          key={t.id}
          type="button"
          role="radio"
          aria-checked={template === t.id}
          tabIndex={template === t.id ? 0 : -1}
          className="ui-ob-template"
          style={{ "--i": i } as CSSProperties}
          onClick={() => onTemplate(t.id)}
        >
          <span className="ui-ob-template__top">
            <span className="ui-ob-template__icon">
              <Icon icon={t.icon} size={17} />
            </span>
            <span className="ui-ob-template__check" aria-hidden="true">
              <Icon icon={CheckIcon} size={12} stroke={2.4} />
            </span>
          </span>
          <b className="ui-ob-template__name">{t.name}</b>
          <span className="ui-ob-template__text">{t.text}</span>
          <span className="ui-ob-template__meta">{t.meta}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------- Invite step ---------- */

function Invites({
  invites,
  onChange,
  role,
  onRole,
  link,
  onCopy,
}: {
  invites: string[];
  onChange: (invites: string[]) => void;
  role: Role;
  onRole: (role: Role) => void;
  link: string;
  onCopy: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const label = useId();
  const hint = useId();

  // Adds every valid address in the text; whatever isn't an email stays in the field with a hint
  const commit = (text: string) => {
    const parts = text.split(/[\s,;]+/).filter(Boolean);
    if (!parts.length) return true;
    const good = parts.filter((p) => EMAIL.test(p));
    const bad = parts.filter((p) => !EMAIL.test(p));
    const fresh = good.map((p) => p.toLowerCase()).filter((p, i, a) => !invites.includes(p) && a.indexOf(p) === i);
    if (fresh.length) onChange([...invites, ...fresh]);
    setDraft(bad.join(" "));
    setError(bad.length ? `“${bad[0]}” doesn't look like an email address.` : "");
    return bad.length === 0;
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === "," || e.key === " " || e.key === "Tab") && draft.trim()) {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Enter") {
      // An empty field: Enter continues as usual
    } else if (e.key === "Backspace" && !draft && invites.length) {
      onChange(invites.slice(0, -1));
    }
  };

  return (
    <div className="ui-ob-fields">
      <div className="ui-ob-field">
        <span className="ui-ob-label" id={label}>
          Email addresses
        </span>
        <div className="ui-ob-invite-row">
          <div className="ui-ob-chips" data-invalid={error ? true : undefined} onClick={() => input.current?.focus()}>
            {invites.map((email, i) => (
              <span key={email} className="ui-ob-chip">
                <span className="ui-ob-chip__avatar" aria-hidden="true">
                  {email[0].toUpperCase()}
                </span>
                {email}
                <button
                  type="button"
                  className="ui-ob-chip__remove"
                  data-index={i}
                  aria-label={`Remove ${email}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(invites.filter((x) => x !== email));
                  }}
                >
                  <Icon icon={XIcon} size={11} stroke={2.2} />
                </button>
              </span>
            ))}
            <input
              ref={input}
              value={draft}
              aria-labelledby={label}
              aria-describedby={hint}
              aria-invalid={error ? true : undefined}
              placeholder={invites.length ? "Add more…" : "name@company.com"}
              onChange={(e) => {
                setDraft(e.target.value);
                if (error) setError("");
              }}
              onKeyDown={onKey}
              onBlur={() => draft.trim() && commit(draft)}
              onPaste={(e) => {
                const text = e.clipboardData.getData("text");
                if (/[\s,;]/.test(text.trim())) {
                  e.preventDefault();
                  commit(draft + " " + text);
                }
              }}
            />
          </div>
          <MenuButton value={role} options={roles} onChange={onRole} className="ui-ob-role" />
        </div>
        {error ? (
          <span className="ui-ob-error" id={hint}>
            {error}
          </span>
        ) : (
          <span className="ui-ob-hint" id={hint}>
            Separate several addresses with a comma or space.
          </span>
        )}
      </div>

      <div className="ui-ob-link">
        <span className="ui-ob-link__icon" aria-hidden="true">
          <Icon icon={LinkIcon} size={15} />
        </span>
        <span className="ui-ob-link__text">
          <b>Or share an invite link</b>
          <span>{link}</span>
        </span>
        <span className="ui-ob-link__action">
          <Button
            variant="secondary"
            size="sm"
            icon={<Icon icon={CopyIcon} size={14} />}
            onClick={() => {
              navigator.clipboard?.writeText(`https://${link}`).catch(() => {});
              onCopy();
            }}
          >
            Copy link
          </Button>
        </span>
      </div>
    </div>
  );
}

/* ---------- Finished ---------- */

function Success({
  workspace,
  agent,
  tools,
  invites,
  onNavigate,
  onRestart,
}: {
  workspace: string;
  agent: string;
  tools: number;
  invites: number;
  onNavigate?: (label: string) => void;
  onRestart: () => void;
}) {
  const next = [
    { label: `Say hello to your ${agent} agent`, text: "Open a chat and give it its first task.", icon: MessageCircleMoreIcon, to: "Chat" },
    { label: tools ? "Connect more tools" : "Connect your first tool", text: tools ? `${tools} connected – add the rest when you need them.` : "Agents get far more useful with your data.", icon: LayoutDashboardIcon, to: "Integrations" },
    { label: "See how your workspace is doing", text: invites ? `${invites} ${invites === 1 ? "teammate is" : "teammates are"} on the way.` : "Usage, agent runs and time saved.", icon: ChartColumnBigIcon, to: "Analytics" },
  ];
  return (
    <div className="ui-ob-success">
      <div className="ui-ob-success__body">
      <span className="ui-ob-success__badge" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M6.5 12.5l3.5 3.5 7.5-8" pathLength={1} />
        </svg>
      </span>
      <h2 className="ui-ob-step__title" tabIndex={-1}>
        {workspace} is ready
      </h2>
      <p className="ui-ob-step__text">Your {agent} agent is set up and waiting for its first task.</p>
      <ul className="ui-ob-next">
        {next.map((n, i) => (
          <li key={n.label} style={{ "--i": i } as CSSProperties}>
            <button type="button" className="ui-ob-next__item" onClick={() => onNavigate?.(n.to)}>
              <span className="ui-ob-next__icon">
                <Icon icon={n.icon} size={16} />
              </span>
              <span className="ui-ob-next__text">
                <b>{n.label}</b>
                <span>{n.text}</span>
              </span>
              <Icon icon={ChevronRightIcon} size={14} />
            </button>
          </li>
        ))}
      </ul>
      </div>
      <footer className="ui-ob-foot">
        <button type="button" className="ui-ob-skip" onClick={onRestart}>
          Start over
        </button>
        <Button size="sm" iconRight={<Icon icon={ChevronRightIcon} size={14} />} onClick={() => onNavigate?.("Chat")}>
          Open chat
        </Button>
      </footer>
    </div>
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

/** Connected, not inside something inert or hidden, not disabled */
const usable = (el: Element | null | undefined): el is HTMLElement =>
  !!el && el.isConnected && el instanceof HTMLElement && !el.closest("[inert],[hidden]") && !(el as HTMLButtonElement).disabled;

/**
 * Focus never drops to <body> (Trenchcoat's useFocusRescue, trimmed): when the focused control inside `root` is
 * removed or disabled, focus moves to the trigger of the menu or popover it was in (when that is still there), else
 * to `fallback(lost control)`, else to `root` itself.
 */
function useFocusRescue(root: RefObject<HTMLElement | null>, fallback: (lost: HTMLElement) => Element | null | undefined) {
  const latest = useRef(fallback);
  useEffect(() => {
    latest.current = fallback;
  });
  useEffect(() => {
    const el = root.current;
    if (!el || typeof MutationObserver !== "function") return;
    let last: HTMLElement | null = null;
    // The menu or popover anchor the focus is in, looked up while it is still attached
    let anchor: Element | null = null;
    const onFocusIn = (e: FocusEvent) => {
      last = e.target instanceof HTMLElement ? e.target : null;
      anchor = last?.closest(".ui-as-popover")?.parentElement ?? null;
    };
    const check = () => {
      const prev = last;
      if (!prev || usable(prev)) return;
      const active = document.activeElement;
      if (active && active !== document.body && active !== prev) return;
      last = null;
      const trigger = anchor?.isConnected ? anchor.querySelector("button") : null;
      const target = usable(trigger) ? trigger : latest.current(prev);
      if (usable(target)) target.focus({ preventScroll: true });
      else {
        if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
        el.focus({ preventScroll: true });
      }
    };
    const observer = new MutationObserver(check);
    observer.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ["disabled", "inert", "hidden"] });
    el.addEventListener("focusin", onFocusIn);
    return () => {
      observer.disconnect();
      el.removeEventListener("focusin", onFocusIn);
    };
  }, [root]);
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where(.dark, [data-theme="dark"]) { color-scheme: dark; }
:where([data-theme="light"]) { color-scheme: light; }

/* Onboarding – greeting and progress on top, the step card in a centered column, the checklist beside it */

.ui-ob {
  display: grid;
  grid-template-columns: minmax(0, 640px) 264px;
  grid-template-areas: "head ." "card aside";
  justify-content: center;
  align-items: start;
  column-gap: 40px;
  padding: 52px 40px 64px;
}
.ui-ob:focus { outline: none; }
.ui-ob-head { grid-area: head; }
.ui-ob-card { grid-area: card; min-width: 0; }
.ui-ob-aside { grid-area: aside; position: sticky; top: 24px; display: grid; gap: 10px; }

.ui-ob-kicker { font-size: var(--tc-font-size-sm-plus, 12.5px); line-height: var(--tc-line-height-tight, 16px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-ob-title {
  margin: 8px 0 0;
  font-size: var(--tc-font-size-4xl, 28px);
  line-height: var(--tc-line-height-display, 32px);
  font-weight: var(--tc-font-weight-semibold, 600);
  letter-spacing: -0.025em;
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
}
.ui-ob-sub { margin: 6px 0 0; font-size: var(--tc-font-size-lg, 14px); line-height: var(--tc-line-height-normal, 20px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }

/* Step row: marker + short label, joined by hairlines that darken once a step is done */
.ui-ob-steps { display: flex; align-items: center; margin: 22px 0 24px; padding: 0; list-style: none; }
.ui-ob-steps__item { display: flex; align-items: center; gap: 8px; min-width: 0; font-size: var(--tc-font-size-md, 13px); line-height: var(--tc-line-height-tight, 16px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-ob-steps__item:not(:last-child) { flex: 1; }
.ui-ob-steps__item:not(:last-child)::after {
  content: "";
  flex: 1;
  min-width: 12px;
  height: var(--tc-hairline, 1px);
  margin: 0 4px 0 6px;
  background: var(--tc-border-default, light-dark(#ececec, #2a2a2e));
  transition: background-color var(--tc-duration-slower, 420ms) var(--tc-ease-standard, ease);
}
.ui-ob-steps__item[data-state="done"]::after { background: var(--tc-border-strong, light-dark(#dedede, #3a3a40)); }
.ui-ob-steps__mark {
  display: grid;
  place-items: center;
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px var(--tc-border-default, light-dark(#ececec, #2a2a2e));
  font-size: var(--tc-font-size-xs, 11px);
  font-weight: var(--tc-font-weight-medium, 500);
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
  transition: background-color var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease), box-shadow var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease), color var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease);
}
.ui-ob-steps__item[data-state="done"] .ui-ob-steps__mark { background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); box-shadow: none; color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
/* Current step: an ink ring, the label in the strong weight – not a colour alone */
.ui-ob-steps__item[data-state="current"] { color: var(--tc-text-primary, light-dark(#171717, #ededed)); font-weight: var(--tc-font-weight-medium, 500); }
.ui-ob-steps__item[data-state="current"] .ui-ob-steps__mark { box-shadow: inset 0 0 0 1.5px var(--tc-text-primary, light-dark(#171717, #ededed)); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-ob-steps__label { white-space: nowrap; }
.ui-ob-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

/* The step card: a tray around a card; the actions sit on the tray below it, like the library components */
.ui-ob-card {
  padding: var(--tc-tray-inset, 4px);
  border-radius: var(--tc-tray-radius, calc(16px + 4px));
  background: var(--tc-surface-tray, light-dark(#f0f0f0, #19191b));
}
.ui-ob-form { display: grid; }
.ui-ob-step,
.ui-ob-success__body {
  border-radius: var(--tc-card-radius, 16px);
  background: var(--tc-surface-on-tray, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
}
.ui-ob-step { padding: 26px 28px 26px; animation: ui-ob-in-next var(--tc-duration-slower, 420ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)) both; }
.ui-ob-success__body { padding: 30px 0 22px; }
.ui-ob-step[data-dir="back"] { animation-name: ui-ob-in-back; }
@keyframes ui-ob-in-next { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: none; } }
@keyframes ui-ob-in-back { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: none; } }
.ui-ob-step__head { margin-bottom: 22px; }
.ui-ob-step__title { margin: 0; font-size: var(--tc-font-size-xl, 16px); line-height: var(--tc-line-height-loose, 24px); font-weight: var(--tc-font-weight-semibold, 600); letter-spacing: var(--tc-tracking-snug, -0.01em); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
/* The heading takes focus when the step it belongs to replaces the control that had it */
.ui-ob-step__title:focus { outline: none; }
.ui-ob-step__title:focus-visible { border-radius: var(--tc-radius-xs, 4px); outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); }
.ui-ob-step__text { margin: 4px 0 0; font-size: var(--tc-font-size-md-plus, 13.5px); line-height: var(--tc-line-height-normal, 20px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }

.ui-ob-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 52px;
  padding: 6px 6px 2px 16px;
}
.ui-ob-foot__actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
.ui-ob-foot__actions > .ui-ob-error { align-self: center; }
.ui-ob-foot__actions > .ui-ob-error:empty { display: contents; }
.ui-ob-skip {
  border-radius: var(--tc-radius-xs, 4px);
  font-size: var(--tc-font-size-md, 13px);
  line-height: var(--tc-line-height-normal, 20px);
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
  text-decoration: underline;
  text-decoration-color: transparent;
  text-underline-offset: 3px;
  transition: color var(--tc-duration-quick, 120ms) var(--tc-ease-standard, ease), text-decoration-color var(--tc-duration-quick, 120ms) var(--tc-ease-standard, ease);
}
.ui-ob-skip:hover { color: var(--tc-text-primary, light-dark(#171717, #ededed)); text-decoration-color: var(--tc-border-strong, light-dark(#dedede, #3a3a40)); }
:is(.ui-ob-skip, .ui-ob-check__item, .ui-ob-help, .ui-ob-next__item, .ui-ob-template, .ui-ob-switch, .ui-ob-chip__remove):focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); }

/* Fields: the text field pattern, the ring on the wrapper */
.ui-ob-fields { display: grid; gap: 20px; }
.ui-ob-field { display: grid; gap: 7px; min-width: 0; }
.ui-ob-label { font-size: var(--tc-font-size-md, 13px); line-height: var(--tc-line-height-snug, 18px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-ob-hint, .ui-ob-error { font-size: var(--tc-font-size-sm-plus, 12.5px); line-height: var(--tc-line-height-snug, 18px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-ob-hint b { font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-ob-error { color: var(--tc-status-danger-fg, light-dark(#c2331f, #ff977d)); }
.ui-ob-input, .ui-ob-chips {
  display: flex;
  align-items: center;
  min-height: var(--tc-field-h, 36px);
  border-radius: var(--tc-field-radius, 10px);
  background: var(--tc-field-bg, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-field-shadow, inset 0 0 0 1px light-dark(#858585, #7c7c82), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  transition: box-shadow var(--tc-duration-quick, 120ms) var(--tc-ease-standard, ease);
}
.ui-ob-input:hover, .ui-ob-chips:hover { box-shadow: var(--tc-field-shadow-hover, inset 0 0 0 1px light-dark(#646464, #9a9aa1), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-ob-input:focus-within, .ui-ob-chips:focus-within { box-shadow: var(--tc-field-shadow-focus, inset 0 0 0 1px light-dark(#2f68ff, #6b95ff), 0 0 0 3px color-mix(in srgb, light-dark(#2f68ff, #6b95ff) 24%, transparent)); }
.ui-ob-input[aria-invalid], .ui-ob-chips[data-invalid] { box-shadow: var(--tc-field-shadow-invalid, inset 0 0 0 1px light-dark(#e5484d, #ff6369)); }
input.ui-ob-input { width: 100%; padding: 0 var(--tc-field-px, 12px); }
.ui-ob-input, .ui-ob-input input, .ui-ob-chips input {
  border: 0;
  outline: none;
  font: inherit;
  font-size: var(--tc-field-font-size, 13.5px);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
}
.ui-ob-input input, .ui-ob-chips input { flex: 1; min-width: 0; height: calc(var(--tc-field-h, 36px) - 2px); padding: 0 var(--tc-field-px, 12px) 0 0; background: none; }
.ui-ob-input::placeholder, .ui-ob-input input::placeholder, .ui-ob-chips input::placeholder { color: var(--tc-text-placeholder, light-dark(#646464, #8e8e95)); }
.ui-ob-prefix { padding: 0 1px 0 var(--tc-field-px, 12px); font-size: var(--tc-field-font-size, 13.5px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); white-space: nowrap; }

/* Tools: a list of rows, each with a switch */
.ui-ob-tools { display: grid; margin: -6px -10px 0; padding: 0; list-style: none; }
.ui-ob-tool {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 0 10px;
  border-radius: var(--tc-radius-xl, 12px);
  transition: background-color var(--tc-duration-quick, 120ms) var(--tc-ease-standard, ease);
  animation: ui-ob-rise var(--tc-duration-slower, 420ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)) both;
  animation-delay: calc(var(--i, 0) * 30ms);
}
.ui-ob-tool:hover { background: var(--tc-fill-subtle, light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04))); }
@keyframes ui-ob-rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.ui-ob-logo {
  display: grid;
  place-items: center;
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: var(--tc-radius-md, 8px);
  background: var(--tc-surface-overlay, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-shadow-raised, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
}
.ui-ob-logo svg { width: 17px; height: 17px; }
.ui-ob-tool__text { display: grid; gap: 2px; flex: 1; min-width: 0; }
.ui-ob-tool__name { display: flex; align-items: center; gap: 8px; font-size: var(--tc-font-size-lg, 14px); line-height: var(--tc-line-height-normal, 20px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
/* "Connected": the status pill pattern */
.ui-ob-tool__state {
  display: inline-flex;
  align-items: center;
  height: var(--tc-pill-h, 20px);
  padding: 0 var(--tc-pill-px, 8px);
  border-radius: var(--tc-pill-radius, 999px);
  background: var(--tc-status-success-bg, light-dark(#e6f6ec, #12301f));
  font-size: var(--tc-pill-font-size, 11px);
  line-height: var(--tc-line-height-none, 1);
  font-weight: var(--tc-pill-font-weight, 500);
  color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c));
  animation: ui-ob-fade var(--tc-duration-moderate, 260ms) var(--tc-ease-standard, ease) both;
}
@keyframes ui-ob-fade { from { opacity: 0; } }
.ui-ob-tool__desc { overflow: hidden; font-size: var(--tc-font-size-md, 13px); line-height: var(--tc-line-height-snug, 18px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); white-space: nowrap; text-overflow: ellipsis; }

/* The switch pattern */
.ui-ob-switch {
  position: relative;
  flex: none;
  width: var(--tc-switch-w, 32px);
  height: var(--tc-switch-h, 20px);
  border-radius: var(--tc-switch-radius, 999px);
  background: var(--tc-switch-off, light-dark(#858585, #7c7c82));
  transition: background-color var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease);
}
.ui-ob-switch::after {
  content: "";
  position: absolute;
  top: calc((var(--tc-switch-h, 20px) - var(--tc-switch-knob, 16px)) / 2);
  left: calc((var(--tc-switch-h, 20px) - var(--tc-switch-knob, 16px)) / 2);
  width: var(--tc-switch-knob, 16px);
  height: var(--tc-switch-knob, 16px);
  border-radius: 50%;
  background: var(--tc-switch-knob-bg, #ffffff);
  box-shadow: var(--tc-shadow-control, 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  transition: translate var(--tc-duration-moderate, 260ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-ob-switch[aria-checked="true"] { background: var(--tc-switch-on, #2f68ff); }
.ui-ob-switch[aria-checked="true"]::after, .ui-ob-switch[data-busy]::after { translate: calc(var(--tc-switch-w, 32px) - var(--tc-switch-h, 20px)) 0; }
.ui-ob-switch[data-busy] { background: var(--tc-icon-muted, light-dark(#858585, #7c7c82)); }
.ui-ob-spinner {
  flex: none;
  width: 14px;
  height: 14px;
  border: 2px solid var(--tc-border-default, light-dark(#ececec, #2a2a2e));
  border-top-color: var(--tc-text-primary, light-dark(#171717, #ededed));
  border-radius: 50%;
  animation: ui-ob-spin var(--tc-duration-reveal, 700ms) linear infinite;
}
@keyframes ui-ob-spin { to { transform: rotate(360deg); } }

/* Invites: chips in a field, the role next to it, a link below */
.ui-ob-invite-row { display: flex; align-items: flex-start; gap: 8px; }
.ui-ob-chips { flex: 1; flex-wrap: wrap; gap: 6px; min-width: 0; padding: 4px 4px 4px 6px; cursor: text; }
.ui-ob-chips input { min-width: 120px; height: 28px; padding-left: 4px; }
.ui-ob-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  height: 28px;
  padding: 0 4px 0 4px;
  border-radius: var(--tc-radius-md, 8px);
  background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)));
  font-size: var(--tc-font-size-md, 13px);
  line-height: var(--tc-line-height-normal, 20px);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  animation: ui-as-pop var(--tc-duration-base, 200ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-ob-chip__avatar {
  display: grid;
  place-items: center;
  flex: none;
  width: var(--tc-avatar-sm, 20px);
  height: var(--tc-avatar-sm, 20px);
  border-radius: var(--tc-radius-sm, 6px);
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  box-shadow: inset 0 0 0 var(--tc-hairline, 1px) var(--tc-border-default, light-dark(#ececec, #2a2a2e));
  font-size: var(--tc-font-size-2xs, 10px);
  font-weight: var(--tc-font-weight-semibold, 600);
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
}
.ui-ob-chip__remove { display: grid; flex: none; place-items: center; width: 20px; height: 20px; border-radius: var(--tc-radius-sm, 6px); color: var(--tc-icon-muted, light-dark(#858585, #7c7c82)); transition: background-color var(--tc-duration-quick, 120ms) var(--tc-ease-standard, ease), color var(--tc-duration-quick, 120ms) var(--tc-ease-standard, ease); }
.ui-ob-chip__remove:hover { background: var(--tc-fill-strong, light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.12))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
/* The role picker keeps its own look; the screen only gives it room */
.ui-ob-role { min-width: 104px; justify-content: space-between; }

.ui-ob-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 12px 12px 14px;
  border-radius: var(--tc-radius-xl, 12px);
  background: var(--tc-surface-sunken, light-dark(#f0f0f0, #111113));
  box-shadow: var(--tc-shadow-sunken, inset 0 0 0 1px light-dark(#f0f0f0, rgba(255, 255, 255, 0.06)));
}
.ui-ob-link__icon { display: grid; place-items: center; flex: none; width: 30px; height: 30px; border-radius: var(--tc-radius-md, 8px); background: var(--tc-surface-raised, light-dark(#ffffff, #19191b)); box-shadow: 0 0 0 var(--tc-hairline, 1px) var(--tc-border-default, light-dark(#ececec, #2a2a2e)); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-ob-link__text { display: grid; gap: 1px; flex: 1; min-width: 0; }
.ui-ob-link__text b { font-size: var(--tc-font-size-md-plus, 13.5px); line-height: var(--tc-line-height-normal, 20px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-ob-link__text span { overflow: hidden; font-size: var(--tc-font-size-sm-plus, 12.5px); line-height: var(--tc-line-height-snug, 18px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); white-space: nowrap; text-overflow: ellipsis; }
.ui-ob-link__action { flex: none; }

/* Templates: three cards to pick from */
.ui-ob-templates { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.ui-ob-template {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 14px 14px 13px;
  border-radius: var(--tc-radius-xl, 12px);
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  box-shadow: var(--tc-shadow-raised, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  text-align: left;
  transition: box-shadow var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease), background-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
  animation: ui-ob-rise var(--tc-duration-slower, 420ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)) both;
  animation-delay: calc(var(--i, 0) * 40ms);
}
.ui-ob-template:hover { box-shadow: var(--tc-shadow-raised-hover, 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6))); }
/* Picked: an ink edge and a filled check – not a tint alone */
.ui-ob-template[aria-checked="true"] { background: var(--tc-fill-subtle, light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04))); box-shadow: 0 0 0 1.5px var(--tc-text-primary, light-dark(#171717, #ededed)), var(--tc-shadow-control, 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-ob-template__top { display: flex; align-self: stretch; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }
.ui-ob-template__icon { display: grid; place-items: center; width: 32px; height: 32px; border-radius: var(--tc-radius-md, 8px); background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-ob-template__check {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1.5px var(--tc-border-control, light-dark(#858585, #7c7c82));
  color: transparent;
  transition: background-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease), box-shadow var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease), color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-ob-template[aria-checked="true"] .ui-ob-template__check { background: var(--tc-surface-inverse, light-dark(#171717, #ededed)); box-shadow: none; color: var(--tc-text-on-inverse, light-dark(#ffffff, #111113)); }
.ui-ob-template__name { font-size: var(--tc-font-size-lg, 14px); line-height: var(--tc-line-height-normal, 20px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-ob-template__text { font-size: var(--tc-font-size-sm-plus, 12.5px); line-height: var(--tc-line-height-snug, 18px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-ob-template__meta { margin-top: auto; padding-top: 10px; font-size: var(--tc-font-size-sm, 12px); line-height: var(--tc-line-height-tight, 16px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }

/* Finished */
.ui-ob-success { animation: ui-ob-in-next var(--tc-duration-slower, 420ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)) both; }
.ui-ob-success__body > .ui-ob-step__title, .ui-ob-success__body > .ui-ob-step__text { margin-left: 28px; margin-right: 28px; }
.ui-ob-success__badge {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin: 0 28px 16px;
  border-radius: 50%;
  background: var(--tc-surface-inverse, light-dark(#171717, #ededed));
  animation: ui-as-pop var(--tc-duration-slow, 320ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)) both;
}
.ui-ob-success__badge svg { width: 20px; height: 20px; fill: none; stroke: var(--tc-text-on-inverse, light-dark(#ffffff, #111113)); stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
.ui-ob-success__badge path { stroke-dasharray: 1; stroke-dashoffset: 1; animation: ui-ob-draw var(--tc-duration-slower, 420ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)) var(--tc-duration-base, 200ms) forwards; }
@keyframes ui-ob-draw { to { stroke-dashoffset: 0; } }
.ui-ob-next { display: grid; margin: 20px 18px 0; padding: 0; list-style: none; }
.ui-ob-next li { animation: ui-ob-rise var(--tc-duration-slower, 420ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)) both; animation-delay: calc(200ms + var(--i, 0) * 50ms); }
.ui-ob-next__item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 56px;
  padding: 0 10px;
  border-radius: var(--tc-radius-xl, 12px);
  text-align: left;
  transition: background-color var(--tc-duration-quick, 120ms) var(--tc-ease-standard, ease);
}
.ui-ob-next__item:hover { background: var(--tc-fill-subtle, light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04))); }
.ui-ob-next__item > svg { flex: none; color: var(--tc-icon-muted, light-dark(#858585, #7c7c82)); transition: translate var(--tc-duration-base, 200ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)), color var(--tc-duration-quick, 120ms) var(--tc-ease-standard, ease); }
.ui-ob-next__item:hover > svg { color: var(--tc-text-primary, light-dark(#171717, #ededed)); translate: 2px 0; }
.ui-ob-next__icon { display: grid; place-items: center; flex: none; width: 32px; height: 32px; border-radius: var(--tc-radius-md, 8px); background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-ob-next__text { display: grid; gap: 1px; flex: 1; min-width: 0; }
.ui-ob-next__text b { font-size: var(--tc-font-size-lg, 14px); line-height: var(--tc-line-height-normal, 20px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-ob-next__text span { font-size: var(--tc-font-size-md, 13px); line-height: var(--tc-line-height-snug, 18px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }

/* Checklist beside the card: a well */
.ui-ob-check {
  padding: 16px 8px 8px;
  border-radius: var(--tc-card-radius, 16px);
  background: var(--tc-surface-sunken, light-dark(#f0f0f0, #111113));
  box-shadow: var(--tc-shadow-sunken, inset 0 0 0 1px light-dark(#f0f0f0, rgba(255, 255, 255, 0.06)));
}
.ui-ob-check__head { display: flex; align-items: baseline; justify-content: space-between; padding: 0 8px; }
.ui-ob-check__head b { font-size: var(--tc-font-size-md-plus, 13.5px); line-height: var(--tc-line-height-normal, 20px); font-weight: var(--tc-font-weight-semibold, 600); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-ob-check__count { font-size: var(--tc-font-size-sm-plus, 12.5px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); font-variant-numeric: tabular-nums; }
.ui-ob-check__count span { display: inline-block; color: var(--tc-text-primary, light-dark(#171717, #ededed)); animation: ui-ob-rise var(--tc-duration-slow, 320ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)); }
.ui-ob-check__bar { display: block; height: var(--tc-meter-h, 4px); margin: 12px 8px 8px; overflow: hidden; border-radius: var(--tc-meter-radius, 999px); background: var(--tc-fill-strong, light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.12))); }
.ui-ob-check__bar i { display: block; height: 100%; border-radius: inherit; background: var(--tc-surface-inverse, light-dark(#171717, #ededed)); transform-origin: left; transition: transform var(--tc-duration-slowest, 560ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)); }
.ui-ob-check__list { display: grid; gap: 1px; margin: 0; padding: 0; list-style: none; }
.ui-ob-check__item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 8px;
  border-radius: var(--tc-radius-md, 8px);
  text-align: left;
  transition: background-color var(--tc-duration-quick, 120ms) var(--tc-ease-standard, ease);
}
.ui-ob-check__item:hover { background: var(--tc-fill-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); }
.ui-ob-check__item[aria-current] { background: var(--tc-surface-raised, light-dark(#ffffff, #19191b)); box-shadow: var(--tc-shadow-raised, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-ob-check__mark {
  display: grid;
  place-items: center;
  flex: none;
  width: 16px;
  height: 16px;
  margin-top: 1px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1.5px var(--tc-border-strong, light-dark(#dedede, #3a3a40));
  color: var(--tc-text-on-inverse, light-dark(#ffffff, #111113));
  transition: background-color var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease), box-shadow var(--tc-duration-base, 200ms) var(--tc-ease-standard, ease);
}
.ui-ob-check__mark svg { animation: ui-as-pop var(--tc-duration-moderate, 260ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)); }
.ui-ob-check__item[data-state="current"] .ui-ob-check__mark { box-shadow: inset 0 0 0 1.5px var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-ob-check__item[data-state="done"] .ui-ob-check__mark { background: var(--tc-surface-inverse, light-dark(#171717, #ededed)); box-shadow: none; }
.ui-ob-dash { display: block; width: 6px; height: 1.5px; border-radius: var(--tc-radius-2xs, 2px); background: var(--tc-icon-muted, light-dark(#858585, #7c7c82)); }
.ui-ob-check__text { display: grid; gap: 1px; min-width: 0; }
.ui-ob-check__label { font-size: var(--tc-font-size-md, 13px); line-height: var(--tc-line-height-snug, 18px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-ob-check__item[data-state="todo"] .ui-ob-check__label { color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); font-weight: var(--tc-font-weight-regular, 400); }
.ui-ob-check__item[data-state="done"] .ui-ob-check__label { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-ob-check__sub { overflow: hidden; font-size: var(--tc-font-size-sm, 12px); line-height: var(--tc-line-height-tight, 16px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); white-space: nowrap; text-overflow: ellipsis; }

.ui-ob-help {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--tc-radius-xl, 12px);
  text-align: left;
  transition: background-color var(--tc-duration-quick, 120ms) var(--tc-ease-standard, ease);
}
.ui-ob-help:hover { background: var(--tc-fill-hover, light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05))); }
.ui-ob-help__icon { display: grid; place-items: center; flex: none; width: 28px; height: 28px; border-radius: var(--tc-radius-md, 8px); background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-ob-help > span:last-child { display: grid; gap: 1px; }
.ui-ob-help b { font-size: var(--tc-font-size-md, 13px); line-height: var(--tc-line-height-snug, 18px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-ob-help > span:last-child > span { font-size: var(--tc-font-size-sm, 12px); line-height: var(--tc-line-height-tight, 16px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }

/* Narrower panels: one column, the checklist moves below the card */
@container ui-as-main (max-width: 1000px) {
  .ui-ob {
    grid-template-columns: minmax(0, 640px);
    grid-template-areas: "head" "card" "aside";
    row-gap: 16px;
    padding: 44px 32px 56px;
  }
  .ui-ob-head .ui-ob-steps { margin-bottom: 8px; }
  .ui-ob-aside { position: static; grid-template-columns: minmax(0, 1fr); }
}
@container ui-as-main (max-width: 620px) {
  .ui-ob-templates { grid-template-columns: minmax(0, 1fr); }
  .ui-ob-template__meta { padding-top: 6px; }
  .ui-ob-invite-row { flex-direction: column; align-items: stretch; }
  .ui-ob-invite-row > .ui-as-anchor, .ui-ob-role { width: 100%; }
  .ui-ob-tool__desc { white-space: normal; }
  .ui-ob-tool { padding-top: 8px; padding-bottom: 8px; }
}
@container ui-as (max-width: 600px) {
  .ui-ob { padding: 56px 16px 40px; }
  .ui-ob-title { font-size: var(--tc-font-size-3xl, 24px); line-height: var(--tc-line-height-display, 32px); }
  .ui-ob-step { padding: 22px 18px 22px; }
  .ui-ob-foot { padding: 6px 4px 2px 12px; }
  .ui-ob-success__body > .ui-ob-step__title, .ui-ob-success__body > .ui-ob-step__text { margin-left: 18px; margin-right: 18px; }
  /* Narrow: only the current step keeps its label */
  .ui-ob-steps__item:not([data-state="current"]) .ui-ob-steps__label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
  .ui-ob-success__badge { margin-left: 18px; margin-right: 18px; }
  .ui-ob-next { margin: 16px 8px 0; }
}

@media (prefers-reduced-motion: reduce) {
  .ui-ob *, .ui-ob *::before, .ui-ob *::after { animation-duration: 1ms !important; animation-delay: 0ms !important; transition-duration: 1ms !important; }
  .ui-ob-success__badge path { stroke-dashoffset: 0; }
}
`;
