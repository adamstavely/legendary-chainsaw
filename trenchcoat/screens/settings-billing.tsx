"use client";

/*
 * Settings & Billing – the settings page of an AI product, in a single file.
 * Tabs for General, Members, Billing and API keys in a bar that stays at the top while the page scrolls.
 * Billing shows the current plan, usage (credits, seats, storage), the payment method and billing email,
 * a monthly/yearly plan comparison and the invoices. Every action works and answers with a short toast.
 * Sits in the Trenchcoat App Shell.
 * Imports: app-shell (AppShell, Dropdown, EmptyState, Icon, IconButton, MenuButton, Popover, Tabs, useToast), button,
 * segmented-control and usage-meter from `@/components/ui/<name>` – copy them alongside; icons from lucide-react 1.55.0.
 */

import { useCallback, useEffect, useRef, useState, type ComponentPropsWithoutRef, type CSSProperties, type FormEvent, type Ref, type RefObject } from "react";
import {
  ChartColumnBigIcon,
  CheckIcon,
  CopyIcon,
  CreditCardIcon,
  DownloadIcon,
  EllipsisIcon,
  FolderIcon,
  GlobeIcon,
  ImageUpIcon,
  KeyIcon,
  LayoutDashboardIcon,
  MailIcon,
  MessageCircleMoreIcon,
  PencilLineIcon,
  PlusIcon,
  SettingsIcon,
  TrashIcon,
  UserPlusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { UsageMeter, type UsageDay } from "@/components/ui/usage-meter";
import {
  AppShell,
  Dropdown,
  EmptyState,
  Icon,
  IconButton,
  MenuButton,
  Popover,
  Tabs,
  useToast,
  type AppShellProps,
  type ShellNavItem,
} from "@/components/ui/app-shell";

/* ---------- Sample content – replace with your own data ---------- */

const nav: ShellNavItem[] = [
  { label: "New chat", icon: PencilLineIcon },
  { label: "Chat", icon: MessageCircleMoreIcon },
  { label: "Folders", icon: FolderIcon },
  { label: "Integrations", icon: LayoutDashboardIcon },
  { label: "Analytics", icon: ChartColumnBigIcon },
  { label: "Settings", icon: SettingsIcon },
];

export type SettingsTab = "General" | "Members" | "Billing" | "API keys";
const tabs: SettingsTab[] = ["General", "Members", "Billing", "API keys"];

type Cycle = "monthly" | "yearly";
type Plan = { id: string; name: string; monthly: number; yearly: number; blurb: string; features: string[] };

/** Yearly prices are per month, billed once a year */
const plans: Plan[] = [
  { id: "starter", name: "Starter", monthly: 19, yearly: 15, blurb: "For individuals trying things out", features: ["10,000 credits / month", "3 seats", "10 GB storage"] },
  { id: "pro", name: "Pro", monthly: 49, yearly: 39, blurb: "For small teams shipping every day", features: ["50,000 credits / month", "10 seats", "100 GB storage", "Agents and API access"] },
  { id: "team", name: "Team", monthly: 99, yearly: 79, blurb: "For growing teams with more seats", features: ["150,000 credits / month", "25 seats", "1 TB storage", "SSO and audit log"] },
];

const RENEWS = "Nov 12, 2026";
/** The same date for the usage meter – one value, not a new Date on every render */
const RENEWS_AT = new Date(2026, 10, 12).getTime();

type Invoice = { id: string; date: string; amount: string; status: "Paid" | "Due" };
const invoices: Invoice[] = [
  { id: "INV-2026-0412", date: "Oct 12, 2026", amount: "$49.00", status: "Due" },
  { id: "INV-2026-0371", date: "Sep 12, 2026", amount: "$49.00", status: "Paid" },
  { id: "INV-2026-0329", date: "Aug 12, 2026", amount: "$69.00", status: "Paid" },
  { id: "INV-2026-0288", date: "Jul 12, 2026", amount: "$49.00", status: "Paid" },
  { id: "INV-2026-0240", date: "Jun 12, 2026", amount: "$49.00", status: "Paid" },
];

type Role = "Owner" | "Admin" | "Member" | "Viewer";
type Member = { id: string; name: string; email: string; role: Role; invited?: boolean };
const initialMembers: Member[] = [
  { id: "m1", name: "Alex Morgan", email: "alex@acme.com", role: "Owner" },
  { id: "m2", name: "Priya Shah", email: "priya@acme.com", role: "Admin" },
  { id: "m3", name: "Jonas Weber", email: "jonas@acme.com", role: "Member" },
  { id: "m4", name: "Mia Chen", email: "mia@acme.com", role: "Member" },
  { id: "m5", name: "Leo Martins", email: "leo@acme.com", role: "Viewer" },
];
const roles: { value: Role; label: string }[] = (["Admin", "Member", "Viewer"] as const).map((r) => ({ value: r, label: r }));

type ApiKey = { id: string; name: string; secret: string; created: string; lastUsed: string };
const initialKeys: ApiKey[] = [
  { id: "k1", name: "Production", secret: "sk-live-4f9a2c71d0e84b6a8F2q", created: "Mar 4, 2026", lastUsed: "2 minutes ago" },
  { id: "k2", name: "Staging", secret: "sk-test-91bd03e6aa7c4f12Lm7x", created: "May 18, 2026", lastUsed: "Yesterday" },
  { id: "k3", name: "Zapier sync", secret: "sk-live-0c6e57b2f1a948d3Qz4k", created: "Aug 2, 2026", lastUsed: "Sep 28, 2026" },
];

type Region = "eu" | "us" | "ap";
const regions: { value: Region; label: string }[] = [
  { value: "eu", label: "Europe (Frankfurt)" },
  { value: "us", label: "United States (Virginia)" },
  { value: "ap", label: "Asia Pacific (Singapore)" },
];

/** Credits per day this period – null for the days still to come */
const daily: UsageDay[] = Array.from({ length: 30 }, (_, i) => ({
  label: `Oct ${i + 1}`,
  value: i < 10 ? Math.round(900 + 650 * Math.abs(Math.sin(i * 1.3)) + i * 40) : null,
}));

const mask = (secret: string) => `${secret.slice(0, 8)}••••••••••••${secret.slice(-4)}`;
const initials = (name: string) =>
  name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

type SettingsBillingOwnProps = Pick<AppShellProps, "onNavigate" | "workspace" | "user"> & {
  /** Open tab – controlled; use `defaultTab` for a starting tab */
  tab?: SettingsTab;
  /** Tab that is open first when `tab` isn't controlled */
  defaultTab?: SettingsTab;
  /** Called when another tab is picked */
  onTabChange?: (tab: SettingsTab) => void;
};

/** `className`, other DOM props and `ref` go to the App Shell's root */
export type SettingsBillingScreenProps = Omit<ComponentPropsWithoutRef<"div">, keyof SettingsBillingOwnProps | "children"> &
  SettingsBillingOwnProps & { ref?: Ref<HTMLDivElement> };

export function SettingsBillingScreen({
  tab: tabProp,
  defaultTab = "Billing",
  onTabChange,
  onNavigate,
  workspace,
  user,
  ref,
  ...rest
}: SettingsBillingScreenProps) {
  const [tab, setTab] = useControllable(tabProp, defaultTab, onTabChange, "tab");
  const [toast, showToast] = useToast();
  const rootRef = useRef<HTMLDivElement>(null);
  // Removed rows hand focus to the row now in their place (or the section's main button), a closed edit form to its
  // Edit button, a button that turns disabled (the plan just picked, saved settings) to its card or form
  useFocusRescue(rootRef, (lost) => {
    const box = rootRef.current;
    if (!box) return null;
    const home = lost.closest("[data-focus-home]");
    if (home?.isConnected) return home;
    if (lost.closest(".ui-sb-inline")) return box.querySelector("[data-sb-edit]");
    const row = lost.closest<HTMLElement>("[data-row]");
    if (row) {
      const rows = [...box.querySelectorAll<HTMLElement>("[data-row]")];
      const next = rows[Math.min(Number(row.dataset.row), rows.length - 1)];
      return next?.querySelector("[data-row-action]") ?? box.querySelector("[data-sb-primary]");
    }
    return box.querySelector("[data-sb-primary]");
  });

  return (
    <AppShell {...rest} ref={ref} active="Settings" nav={nav} onNavigate={onNavigate} workspace={workspace} user={user}>
      <style href="ui-settings-billing" precedence="default">
        {css}
      </style>
      <div className="ui-sb" ref={rootRef}>
        <h1 className="ui-as-page-title">Settings</h1>
        <p className="ui-as-page-sub">Manage your workspace, your team, your plan and access to the API.</p>

        {/* Stays at the top while the page scrolls away underneath */}
        <div className="ui-as-toolbar ui-sb__bar">
          <Tabs items={tabs} value={tab} onChange={(t) => setTab(t as SettingsTab)} />
        </div>

        <div key={tab} className="ui-sb__body">
          {tab === "General" && <GeneralTab workspace={workspace ?? "Acme"} toast={showToast} />}
          {tab === "Members" && <MembersTab toast={showToast} />}
          {tab === "Billing" && <BillingTab toast={showToast} />}
          {tab === "API keys" && <KeysTab toast={showToast} />}
        </div>
      </div>
      {toast}
    </AppShell>
  );
}

type Toast = (text: string) => void;

/* ---------- Billing ---------- */

function BillingTab({ toast }: { toast: Toast }) {
  const [current, setCurrent] = useState<{ id: string; cycle: Cycle }>({ id: "pro", cycle: "monthly" });
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [canceled, setCanceled] = useState(false);
  const [email, setEmail] = useState("billing@acme.com");
  const [draft, setDraft] = useState<string | null>(null);
  const plansRef = useRef<HTMLElement>(null);

  const plan = plans.find((p) => p.id === current.id)!;
  const price = current.cycle === "monthly" ? `$${plan.monthly}/mo` : `$${plan.yearly * 12}/yr`;

  const saveEmail = (e: FormEvent) => {
    e.preventDefault();
    if (!draft?.includes("@")) return;
    setEmail(draft.trim());
    setDraft(null);
    toast("Billing email updated");
  };

  return (
    <>
      <div className="ui-sb-overview">
        <div className="ui-sb-usage ui-as-rise" style={{ "--i": 0 } as CSSProperties}>
          <UsageMeter
            layout="wide"
            title="Usage this period"
            plan={`${plan.name} plan`}
            total={50000}
            used={[
              { label: "Chat", value: 18400 },
              { label: "Agents", value: 9200 },
              { label: "API", value: 4100 },
              { label: "Images", value: 2300 },
            ]}
            limits={[
              { label: "Seats", used: 8, total: 10 },
              { label: "Storage", used: 42.6, total: 100, unit: "GB" },
            ]}
            daily={daily}
            resetAt={RENEWS_AT}
            onUpgrade={(state) => toast(state === "ok" ? "Opening plans" : "1,000 credits added")}
          />
        </div>
        <div className="ui-sb-stack">
          {/* Current plan */}
          <section className="ui-sb-card ui-sb-plan ui-as-rise" style={{ "--i": 1 } as CSSProperties}>
            <div className="ui-sb-plan__top">
              <span className="ui-sb-cap">Current plan</span>
              <span className="ui-sb-pill" data-tone={canceled ? "amber" : "green"}>
                {canceled ? "Cancels soon" : "Active"}
              </span>
            </div>
            <strong className="ui-sb-plan__name">
              {plan.name} <span>· {price}</span>
            </strong>
            <p className="ui-sb-muted">
              {canceled ? `Your plan ends on ${RENEWS}. You keep every feature until then.` : `Renews on ${RENEWS} · billed ${current.cycle}`}
            </p>
            <div className="ui-sb-actions">
              <Button size="sm" onClick={() => plansRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                Change plan
              </Button>
              {canceled ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setCanceled(false);
                    toast(`${plan.name} plan resumed`);
                  }}
                >
                  Resume plan
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setCanceled(true);
                    toast(`Plan canceled – active until ${RENEWS}`);
                  }}
                >
                  Cancel plan
                </Button>
              )}
            </div>
          </section>

          {/* Payment method and billing email */}
          <section className="ui-sb-card ui-sb-pay ui-as-rise" style={{ "--i": 2 } as CSSProperties}>
            <div className="ui-sb-pay__row">
              <span className="ui-sb-visa" aria-hidden="true">
                VISA
              </span>
              <span className="ui-sb-pay__text">
                <b>Visa •••• 4242</b>
                <span>Expires 08/2028</span>
              </span>
              <Button size="sm" variant="secondary" icon={<Icon icon={CreditCardIcon} size={14} />} onClick={() => toast("Payment method updated")}>
                Update
              </Button>
            </div>
            <div className="ui-sb-pay__row">
              <span className="ui-sb-tile" aria-hidden="true">
                <Icon icon={MailIcon} size={15} />
              </span>
              {draft === null ? (
                <>
                  <span className="ui-sb-pay__text">
                    <b>{email}</b>
                    <span>Invoices and receipts go here</span>
                  </span>
                  <Button size="sm" variant="secondary" data-sb-edit="" aria-label="Edit billing email" onClick={() => setDraft(email)}>
                    Edit
                  </Button>
                </>
              ) : (
                <form className="ui-sb-inline" onSubmit={saveEmail}>
                  <span className="ui-sb-field-box">
                  <input
                    className="ui-sb-input"
                    type="email"
                    autoFocus
                    value={draft}
                    aria-label="Billing email"
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Escape") return;
                      // Esc closes only the edit, not a surrounding dialog
                      e.stopPropagation();
                      setDraft(null);
                    }}
                  />
                  </span>
                  <Button size="sm" type="submit" disabled={!draft.includes("@")}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" type="button" onClick={() => setDraft(null)}>
                    Cancel
                  </Button>
                </form>
              )}
            </div>
          </section>
        </div>

      </div>

      {/* Plans */}
      <section ref={plansRef} className="ui-sb-section">
        <div className="ui-sb-section__head">
          <div>
            <h2 className="ui-sb-h2">Plans</h2>
            <p className="ui-sb-muted">Switch any time – we prorate the difference.</p>
          </div>
          <SegmentedControl<Cycle>
            size="sm"
            aria-label="Billing period"
            value={cycle}
            onChange={setCycle}
            options={[
              { value: "monthly", label: "Monthly" },
              { value: "yearly", label: "Yearly", badge: "−20%" },
            ]}
          />
        </div>
        <div className="ui-sb-plans">
          {plans.map((p, i) => {
            const isCurrent = p.id === current.id && cycle === current.cycle;
            const label = p.id === current.id ? `Switch to ${cycle}` : `Switch to ${p.name}`;
            return (
              <div
                key={p.id}
                className="ui-sb-card ui-sb-tier ui-as-rise"
                data-current={p.id === current.id || undefined}
                data-focus-home=""
                tabIndex={-1}
                aria-label={`${p.name} plan`}
                role="group"
                style={{ "--i": i } as CSSProperties}
              >
                <div className="ui-sb-tier__top">
                  <b>{p.name}</b>
                  {p.id === current.id && <span className="ui-sb-pill">Current</span>}
                </div>
                <div className="ui-sb-tier__price">
                  <strong key={cycle}>${cycle === "monthly" ? p.monthly : p.yearly}</strong>
                  <span>/ month{cycle === "yearly" ? ", billed yearly" : ""}</span>
                </div>
                <p className="ui-sb-muted">{p.blurb}</p>
                <ul className="ui-sb-tier__list">
                  {p.features.map((f) => (
                    <li key={f}>
                      <Icon icon={CheckIcon} size={14} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="ui-sb-tier__cta"
                  size="sm"
                  variant={isCurrent ? "secondary" : p.id === "team" ? "primary" : "secondary"}
                  disabled={isCurrent}
                  onClick={() => {
                    setCurrent({ id: p.id, cycle });
                    setCanceled(false);
                    toast(`Switched to ${p.name} · ${cycle}`);
                  }}
                >
                  {isCurrent ? "Current plan" : label}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Invoices */}
      <section className="ui-sb-section">
        <div className="ui-sb-section__head">
          <h2 className="ui-sb-h2">Invoices</h2>
          <Button size="sm" variant="secondary" icon={<Icon icon={DownloadIcon} size={14} />} onClick={() => toast("Downloading all invoices")}>
            Download all
          </Button>
        </div>
        <div className="ui-sb-table-wrap">
          <table className="ui-sb-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice</th>
                <th className="ui-sb-num">Amount</th>
                <th>Status</th>
                <th aria-label="Download" />
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.date}</td>
                  <td className="ui-sb-mono">{inv.id}</td>
                  <td className="ui-sb-num">{inv.amount}</td>
                  <td>
                    <span className="ui-sb-pill" data-tone={inv.status === "Paid" ? "green" : "amber"}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="ui-sb-end">
                    <IconButton icon={DownloadIcon} label={`Download ${inv.id}`} onClick={() => toast(`Downloaded ${inv.id}.pdf`)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

/* ---------- General ---------- */

function GeneralTab({ workspace, toast }: { workspace: string; toast: Toast }) {
  // What was saved last – state, not a ref, so "dirty" is worked out from render values only
  const [saved, setSaved] = useState({ name: workspace, region: "eu" as Region });
  const [name, setName] = useState(workspace);
  const [region, setRegion] = useState<Region>("eu");
  const dirty = name.trim() !== saved.name || region !== saved.region;

  return (
    <form
      className="ui-sb-tray ui-sb-form ui-as-rise"
      aria-label="Workspace settings"
      data-focus-home=""
      tabIndex={-1}
      onSubmit={(e) => {
        e.preventDefault();
        if (!dirty || !name.trim()) return;
        setSaved({ name: name.trim(), region });
        setName(name.trim());
        toast("Workspace settings saved");
      }}
    >
      <div className="ui-sb-card ui-sb-form__fields">
      <div className="ui-sb-field">
        <span className="ui-sb-field__label">
          <b>Logo</b>
          <span>Shown in the sidebar and on invites. Square, at least 128 px.</span>
        </span>
        <div className="ui-sb-logo-row">
          <span className="ui-sb-logo">{(name.trim() || "A")[0].toUpperCase()}</span>
          <Button type="button" size="sm" variant="secondary" icon={<Icon icon={ImageUpIcon} size={14} />} onClick={() => toast("Logo uploaded")}>
            Upload
          </Button>
        </div>
      </div>
      <label className="ui-sb-field">
        <span className="ui-sb-field__label">
          <b>Workspace name</b>
          <span>Your team sees this name everywhere.</span>
        </span>
        <span className="ui-sb-field-box">
          <input className="ui-sb-input" value={name} onChange={(e) => setName(e.target.value)} />
        </span>
      </label>
      <div className="ui-sb-field">
        <span className="ui-sb-field__label">
          <b>Data region</b>
          <span>Where chats, files and embeddings are stored.</span>
        </span>
        <div>
          <MenuButton value={region} options={regions} onChange={setRegion} icon={GlobeIcon} align="start" />
        </div>
      </div>
      </div>
      <div className="ui-sb-form__foot">
        <Button type="button" size="sm" variant="ghost" disabled={!dirty} onClick={() => (setName(saved.name), setRegion(saved.region))}>
          Discard
        </Button>
        <Button type="submit" size="sm" disabled={!dirty || !name.trim()}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

/* ---------- Members ---------- */

function MembersTab({ toast }: { toast: Toast }) {
  const [members, setMembers] = useState(initialMembers);
  // Ids from a counter: two invites in the same millisecond must not share one
  const nextId = useRef(initialMembers.length);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const valid = /^\S+@\S+\.\S+$/.test(email.trim());

  const invite = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    const address = email.trim();
    setMembers((list) => [...list, { id: `m${++nextId.current}`, name: address.split("@")[0], email: address, role: "Member", invited: true }]);
    setEmail("");
    setOpen(false);
    toast(`Invite sent to ${address}`);
  };

  return (
    <section className="ui-sb-section ui-sb-section--first">
      <div className="ui-sb-section__head">
        <div>
          <h2 className="ui-sb-h2">Members</h2>
          <p className="ui-sb-muted">{members.length} of 10 seats used</p>
        </div>
        <span className="ui-as-anchor">
          <Button size="sm" data-sb-primary="" aria-expanded={open} icon={<Icon icon={UserPlusIcon} size={14} />} onClick={() => setOpen((o) => !o)}>
            Invite
          </Button>
          <Popover open={open} onClose={() => setOpen(false)} align="end" className="ui-as-menu ui-sb-invite">
            <form onSubmit={invite}>
              <b>Invite a teammate</b>
              <span>They get an email with a link to join.</span>
              <span className="ui-sb-field-box">
                <input className="ui-sb-input" autoFocus type="email" value={email} placeholder="name@company.com" aria-label="Email address" onChange={(e) => setEmail(e.target.value)} />
              </span>
              <Button size="sm" type="submit" disabled={!valid}>
                Send invite
              </Button>
            </form>
          </Popover>
        </span>
      </div>
      <div className="ui-sb-tray">
      <div className="ui-sb-tray__head" aria-hidden="true">
        <span>Member</span>
        <span className="ui-sb-tray__end">Role</span>
      </div>
      <div className="ui-sb-card ui-sb-list">
        {members.map((m, i) => (
          <div key={m.id} className="ui-sb-row ui-as-rise" data-row={i} style={{ "--i": i } as CSSProperties}>
            <span className="ui-sb-avatar" data-tone={i % 4}>
              {initials(m.name)}
            </span>
            <span className="ui-sb-row__text">
              <b>
                {m.name}
                {m.invited && <span className="ui-sb-pill">Invited</span>}
              </b>
              <span>{m.email}</span>
            </span>
            {m.role === "Owner" ? (
              <span className="ui-sb-role">Owner</span>
            ) : (
              <MenuButton
                value={m.role}
                options={roles}
                onChange={(role) => {
                  setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, role } : x)));
                  toast(`${m.name} is now ${role.toLowerCase() === "admin" ? "an" : "a"} ${role}`);
                }}
              />
            )}
            {m.role === "Owner" ? (
              <span className="ui-sb-row__spacer" />
            ) : (
              <Dropdown
                align="end"
                items={[
                  ...(m.invited ? [{ label: "Resend invite", icon: MailIcon, onSelect: () => toast(`Invite resent to ${m.email}`) }] : []),
                  {
                    label: m.invited ? "Revoke invite" : "Remove from workspace",
                    icon: TrashIcon,
                    danger: true,
                    onSelect: () => {
                      setMembers((list) => list.filter((x) => x.id !== m.id));
                      toast(m.invited ? `Invite to ${m.email} revoked` : `${m.name} removed`);
                    },
                  },
                ]}
                trigger={({ open, toggle }) => (
                  <button type="button" className="ui-as-tool" data-row-action="" aria-label={`More for ${m.name}`} aria-expanded={open} aria-haspopup="menu" onClick={toggle}>
                    <Icon icon={EllipsisIcon} size={15} />
                  </button>
                )}
              />
            )}
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}

/* ---------- API keys ---------- */

function KeysTab({ toast }: { toast: Toast }) {
  const [keys, setKeys] = useState(initialKeys);
  const nextId = useRef(initialKeys.length);

  const create = () => {
    const n = keys.length + 1;
    const secret = `sk-live-${Array.from({ length: 20 }, () => "0123456789abcdefABCDEFxyz"[Math.floor(Math.random() * 25)]).join("")}`;
    setKeys((list) => [{ id: `k${++nextId.current}`, name: `New key ${n}`, secret, created: "Just now", lastUsed: "Never" }, ...list]);
    toast("API key created");
  };
  const copy = (k: ApiKey) => {
    navigator.clipboard?.writeText(k.secret).catch(() => {});
    toast(`${k.name} key copied`);
  };

  return (
    <section className="ui-sb-section ui-sb-section--first">
      <div className="ui-sb-section__head">
        <div>
          <h2 className="ui-sb-h2">API keys</h2>
          <p className="ui-sb-muted">Keys give full access to this workspace – keep them secret.</p>
        </div>
        <Button size="sm" data-sb-primary="" icon={<Icon icon={PlusIcon} size={14} />} onClick={create}>
          Create key
        </Button>
      </div>
      {keys.length === 0 ? (
        <div className="ui-as-rise">
          <EmptyState title="No API keys" text="Create a key to call the API from your own code." />
        </div>
      ) : (
        <div className="ui-sb-tray">
        <div className="ui-sb-tray__head" aria-hidden="true">
          <span>Name</span>
          <span className="ui-sb-tray__end ui-sb-tray__end--key">Key</span>
        </div>
        <div className="ui-sb-card ui-sb-list">
          {keys.map((k, i) => (
            <div key={k.id} className="ui-sb-row ui-as-rise" data-row={i} style={{ "--i": i } as CSSProperties}>
              <span className="ui-sb-tile" aria-hidden="true">
                <Icon icon={KeyIcon} size={15} />
              </span>
              <span className="ui-sb-row__text">
                <b>{k.name}</b>
                <span>
                  Created {k.created} · last used {k.lastUsed}
                </span>
              </span>
              <code className="ui-sb-key">{mask(k.secret)}</code>
              <IconButton icon={CopyIcon} label={`Copy ${k.name} key`} onClick={() => copy(k)} />
              <button
                type="button"
                className="ui-as-tool ui-sb-danger"
                data-row-action=""
                aria-label={`Revoke ${k.name} key`}
                title="Revoke"
                onClick={() => {
                  setKeys((list) => list.filter((x) => x.id !== k.id));
                  toast(`${k.name} key revoked`);
                }}
              >
                <Icon icon={TrashIcon} size={15} />
              </button>
            </div>
          ))}
        </div>
        </div>
      )}
    </section>
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

/* Settings & Billing – a centered column of cards on the panel */
.ui-sb {
  width: min(1040px, calc(100% - 64px));
  margin: 0 auto;
  padding: 40px 0 64px;
}
.ui-sb:focus { outline: none; }
.ui-sb__bar {
  position: sticky;
  top: 0;
  z-index: 5;
  margin: 10px -16px 0;
  padding: 18px 16px 12px;
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
}
/* Soft fade below the bar, so content dissolves instead of being cut by a line */
.ui-sb__bar::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  height: 24px;
  background: linear-gradient(to bottom, var(--tc-surface-raised, light-dark(#ffffff, #19191b)), transparent);
  pointer-events: none;
}
.ui-sb__body { margin-top: 14px; }

.ui-sb-card {
  border-radius: var(--tc-card-radius, 16px);
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
}
/* A card or form that holds focus after its button turned disabled */
.ui-sb [data-focus-home]:focus { outline: none; }
.ui-sb [data-focus-home]:focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); }
.ui-sb-cap { font-size: var(--tc-font-size-md, 13px); line-height: var(--tc-line-height-normal, 20px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-sb-muted { margin: 0; font-size: var(--tc-font-size-md, 13px); line-height: var(--tc-line-height-normal, 20px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-sb-h2 { margin: 0; font-size: var(--tc-font-size-lg-plus, 15px); line-height: var(--tc-line-height-relaxed, 22px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-sb-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }

/* Status pills (the pill pattern): neutral, green (paid, active), amber (due, canceling) – the word carries the state */
.ui-sb-pill {
  display: inline-flex;
  align-items: center;
  height: var(--tc-pill-h, 20px);
  padding: 0 var(--tc-pill-px, 8px);
  border-radius: var(--tc-pill-radius, 999px);
  background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)));
  font-size: var(--tc-pill-font-size, 11px);
  font-weight: var(--tc-pill-font-weight, 500);
  line-height: var(--tc-line-height-none, 1);
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
  white-space: nowrap;
}
.ui-sb-pill[data-tone="green"] { background: var(--tc-status-success-bg, light-dark(#e6f6ec, #12301f)); color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c)); }
.ui-sb-pill[data-tone="amber"] { background: var(--tc-status-warning-bg, light-dark(#fff3e0, #3a2410)); color: var(--tc-status-warning-fg, light-dark(#a35200, #ffa057)); }

/* Overview: usage across the full width (the Usage Meter's wide layout), plan and payment side by side below */
.ui-sb-overview { display: grid; gap: 16px; }
.ui-sb-stack { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 16px; align-items: stretch; }

.ui-sb-plan { display: grid; gap: 8px; padding: 16px 18px 18px; }
.ui-sb-plan__top { display: flex; align-items: center; justify-content: space-between; }
.ui-sb-plan__name { font-size: var(--tc-font-size-3xl, 24px); line-height: var(--tc-line-height-display, 32px); font-weight: var(--tc-font-weight-medium, 500); letter-spacing: var(--tc-tracking-tight, -0.02em); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-sb-plan__name span { color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); font-weight: var(--tc-font-weight-regular, 400); }
.ui-sb-plan .ui-sb-actions { margin-top: 8px; }

.ui-sb-pay { display: grid; padding: 4px 18px; }
.ui-sb-pay__row { display: flex; align-items: center; gap: 12px; min-height: 64px; }
.ui-sb-pay__row + .ui-sb-pay__row { border-top: var(--tc-hairline, 1px) solid var(--tc-divider, light-dark(#ececec, #2a2a2e)); }
.ui-sb-pay__text { display: grid; flex: 1; gap: 2px; min-width: 0; }
.ui-sb-pay__text b, .ui-sb-row__text b { display: flex; align-items: center; gap: 8px; overflow: hidden; font-size: var(--tc-font-size-md-plus, 13.5px); line-height: var(--tc-line-height-normal, 20px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); white-space: nowrap; text-overflow: ellipsis; }
.ui-sb-pay__text span, .ui-sb-row__text > span { overflow: hidden; font-size: var(--tc-font-size-sm-plus, 12.5px); line-height: var(--tc-line-height-snug, 18px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); white-space: nowrap; text-overflow: ellipsis; }
/* The card brand's own mark – the same in both themes */
.ui-sb-visa {
  display: grid;
  place-items: center;
  flex: none;
  width: 42px;
  height: 28px;
  border-radius: var(--tc-radius-sm, 6px);
  background: #1a1f71;
  font-size: var(--tc-font-size-xs, 11px);
  font-style: italic;
  font-weight: var(--tc-font-weight-semibold, 600);
  letter-spacing: 0.02em;
  color: #ffffff;
}
.ui-sb-tile {
  display: grid;
  place-items: center;
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: var(--tc-radius-md, 8px);
  background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)));
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
}
.ui-sb-pay .ui-sb-tile { width: 42px; height: 28px; border-radius: var(--tc-radius-sm, 6px); }
.ui-sb-inline { display: flex; flex: 1; align-items: center; gap: 6px; min-width: 0; }
.ui-sb-inline .ui-sb-field-box { flex: 1; }

/* Text fields: the field pattern, the ring on the wrapper (:focus-within) */
.ui-sb-field-box {
  display: flex;
  min-width: 0;
  height: var(--tc-field-h, 36px);
  border-radius: var(--tc-field-radius, 10px);
  background: var(--tc-field-bg, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-field-shadow, inset 0 0 0 1px light-dark(#858585, #7c7c82), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  transition: box-shadow var(--tc-duration-quick, 120ms) var(--tc-ease-standard, ease);
}
.ui-sb-field-box:hover { box-shadow: var(--tc-field-shadow-hover, inset 0 0 0 1px light-dark(#646464, #9a9aa1), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-sb-field-box:focus-within { box-shadow: var(--tc-field-shadow-focus, inset 0 0 0 1px light-dark(#2f68ff, #6b95ff), 0 0 0 3px color-mix(in srgb, light-dark(#2f68ff, #6b95ff) 24%, transparent)); }
.ui-sb-input {
  flex: 1;
  min-width: 0;
  padding: 0 var(--tc-field-px, 12px);
  border: 0;
  border-radius: inherit;
  background: none;
  font: inherit;
  font-size: var(--tc-field-font-size, 13.5px);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  outline: none;
}
.ui-sb-input::placeholder { color: var(--tc-text-placeholder, light-dark(#646464, #8e8e95)); }

/* Sections below the overview */
.ui-sb-section { margin-top: 40px; scroll-margin-top: 72px; }
.ui-sb-section--first { margin-top: 10px; }
.ui-sb-section__head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
.ui-sb-section__head .ui-sb-muted { margin-top: 2px; }

.ui-sb-plans { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.ui-sb-tier { display: flex; flex-direction: column; gap: 10px; padding: 16px 18px 18px; }
/* Current plan: the selected edge (≥ 3:1) and the "Current" pill – not only a tint */
.ui-sb-tier[data-current] { box-shadow: 0 0 0 1.5px var(--tc-border-selected, light-dark(#2f68ff, #6b95ff)), var(--tc-shadow-control, 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4))); }
.ui-sb-tier__top { display: flex; align-items: center; justify-content: space-between; min-height: 20px; }
.ui-sb-tier__top b { font-size: var(--tc-font-size-lg, 14px); line-height: var(--tc-line-height-normal, 20px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-sb-tier__price { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px; }
.ui-sb-tier__price strong { font-size: var(--tc-font-size-3xl, 24px); line-height: var(--tc-line-height-display, 32px); font-weight: var(--tc-font-weight-medium, 500); letter-spacing: var(--tc-tracking-tight, -0.02em); color: var(--tc-text-primary, light-dark(#171717, #ededed)); font-variant-numeric: tabular-nums; animation: ui-as-rise var(--tc-duration-slow, 320ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)) both; }
.ui-sb-tier__price span { font-size: var(--tc-font-size-sm-plus, 12.5px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-sb-tier__list { display: grid; gap: 7px; flex: 1; margin: 4px 0 6px; padding: 12px 0 0; border-top: var(--tc-hairline, 1px) solid var(--tc-divider, light-dark(#ececec, #2a2a2e)); list-style: none; }
.ui-sb-tier__list li { display: flex; align-items: center; gap: 8px; font-size: var(--tc-font-size-md, 13px); line-height: var(--tc-line-height-normal, 20px); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); }
.ui-sb-tier__list svg { flex: none; color: var(--tc-icon-muted, light-dark(#858585, #7c7c82)); }
.ui-sb-tier .ui-sb-tier__cta { width: 100%; }

/* Invoices: the header row sits on the tray, the rows in a card inside it */
.ui-sb-table-wrap { overflow-x: auto; padding: 0 var(--tc-tray-inset, 4px) var(--tc-tray-inset, 4px); border-radius: var(--tc-tray-radius, calc(16px + 4px)); background: var(--tc-surface-tray, light-dark(#f0f0f0, #19191b)); }
.ui-sb-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: var(--tc-font-size-md, 13px); line-height: var(--tc-line-height-normal, 20px); }
.ui-sb-table th {
  height: 38px;
  padding: 0 18px;
  font-size: var(--tc-font-size-sm, 12px);
  font-weight: var(--tc-font-weight-medium, 500);
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
  text-align: left;
  white-space: nowrap;
}
.ui-sb-table td { height: 52px; padding: 0 18px; background: var(--tc-surface-on-tray, light-dark(#ffffff, #232326)); color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc)); white-space: nowrap; transition: background-color var(--tc-duration-quick, 120ms) var(--tc-ease-standard, ease); }
.ui-sb-table tbody tr + tr td { border-top: var(--tc-hairline, 1px) solid var(--tc-divider, light-dark(#ececec, #2a2a2e)); }
.ui-sb-table tbody tr:first-child td { border-top: var(--tc-hairline, 1px) solid var(--tc-border-default, light-dark(#ececec, #2a2a2e)); }
.ui-sb-table tbody tr:last-child td { border-bottom: var(--tc-hairline, 1px) solid var(--tc-border-default, light-dark(#ececec, #2a2a2e)); }
.ui-sb-table tbody td:first-child { border-left: var(--tc-hairline, 1px) solid var(--tc-border-default, light-dark(#ececec, #2a2a2e)); }
.ui-sb-table tbody td:last-child { border-right: var(--tc-hairline, 1px) solid var(--tc-border-default, light-dark(#ececec, #2a2a2e)); }
.ui-sb-table tbody tr:first-child td:first-child { border-top-left-radius: var(--tc-card-radius, 16px); }
.ui-sb-table tbody tr:first-child td:last-child { border-top-right-radius: var(--tc-card-radius, 16px); }
.ui-sb-table tbody tr:last-child td:first-child { border-bottom-left-radius: var(--tc-card-radius, 16px); }
.ui-sb-table tbody tr:last-child td:last-child { border-bottom-right-radius: var(--tc-card-radius, 16px); }
.ui-sb-table tbody tr:hover td { background: var(--tc-fill-subtle, light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04))); }
.ui-sb-table .ui-sb-num { text-align: right; font-variant-numeric: tabular-nums; }
.ui-sb-table td.ui-sb-num { color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-sb-table .ui-sb-end { width: 1%; padding-right: 12px; }
.ui-sb-table td.ui-sb-mono { font-variant-numeric: tabular-nums; color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }

/* Tray around a card, like the library components: column labels or actions sit on the tray */
.ui-sb-tray { padding: 0 var(--tc-tray-inset, 4px) var(--tc-tray-inset, 4px); border-radius: var(--tc-tray-radius, calc(16px + 4px)); background: var(--tc-surface-tray, light-dark(#f0f0f0, #19191b)); }
.ui-sb-tray > .ui-sb-card { background: var(--tc-surface-on-tray, light-dark(#ffffff, #232326)); }
.ui-sb-tray__head { display: flex; align-items: center; justify-content: space-between; height: 38px; padding: 0 18px; font-size: var(--tc-font-size-sm, 12px); line-height: var(--tc-line-height-tight, 16px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-sb-tray__end { padding-right: 44px; }
.ui-sb-tray__end--key { padding-right: 258px; }

/* General: label on the left, control on the right */
.ui-sb-form { display: grid; padding: var(--tc-tray-inset, 4px); }
.ui-sb-form__fields { padding: 4px 22px; }
.ui-sb-field { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 24px; align-items: center; padding: 20px 0; }
.ui-sb-field + .ui-sb-field { border-top: var(--tc-hairline, 1px) solid var(--tc-divider, light-dark(#ececec, #2a2a2e)); }
.ui-sb-field__label { display: grid; gap: 3px; }
.ui-sb-field__label b { font-size: var(--tc-font-size-md-plus, 13.5px); line-height: var(--tc-line-height-normal, 20px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-sb-field__label span { font-size: var(--tc-font-size-sm-plus, 12.5px); line-height: var(--tc-line-height-snug, 18px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-sb-logo-row { display: flex; align-items: center; gap: 12px; }
.ui-sb-logo {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: var(--tc-radius-xl, 12px);
  background: var(--tc-surface-inverse, light-dark(#171717, #ededed));
  font-size: var(--tc-font-size-xl, 16px);
  font-weight: var(--tc-font-weight-semibold, 600);
  color: var(--tc-text-on-inverse, light-dark(#ffffff, #111113));
}
.ui-sb-form__foot { display: flex; justify-content: flex-end; gap: 6px; padding: 6px 2px 2px; }

/* Members and API keys: rows in one card */
.ui-sb-list { display: grid; padding: 4px 8px; }
.ui-sb-row { display: flex; align-items: center; gap: 12px; min-height: 60px; padding: 0 10px; }
.ui-sb-row + .ui-sb-row { border-top: var(--tc-hairline, 1px) solid var(--tc-divider, light-dark(#ececec, #2a2a2e)); }
.ui-sb-row__text { display: grid; flex: 1; gap: 2px; min-width: 0; }
.ui-sb-row__spacer { width: 32px; flex: none; }
.ui-sb-role { padding: 0 10px; font-size: var(--tc-font-size-md, 13px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-sb-avatar {
  display: grid;
  place-items: center;
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--tc-accent-subtle, light-dark(rgba(47, 107, 255, 0.08), rgba(79, 130, 255, 0.16)));
  font-size: var(--tc-font-size-sm, 12px);
  font-weight: var(--tc-font-weight-medium, 500);
  color: var(--tc-accent-text, light-dark(#2456d6, #8ab4ff));
}
.ui-sb-avatar[data-tone="1"] { background: var(--tc-tone-pink-bg, light-dark(rgba(236, 72, 153, 0.1), rgba(244, 114, 182, 0.16))); color: var(--tc-tone-pink-fg, light-dark(#be185d, #f9a8d4)); }
.ui-sb-avatar[data-tone="2"] { background: var(--tc-status-success-bg, light-dark(#e6f6ec, #12301f)); color: var(--tc-status-success-fg, light-dark(#18794e, #3dd68c)); }
.ui-sb-avatar[data-tone="3"] { background: var(--tc-status-warning-bg, light-dark(#fff3e0, #3a2410)); color: var(--tc-status-warning-fg, light-dark(#a35200, #ffa057)); }
.ui-sb-key {
  padding: 5px 9px;
  border-radius: var(--tc-radius-md, 8px);
  background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07)));
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: var(--tc-font-size-sm, 12px);
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
  white-space: nowrap;
}
.ui-sb-danger:hover, .ui-sb-danger:hover svg { color: var(--tc-status-danger-fg, light-dark(#c2331f, #ff977d)); }

.ui-sb-invite { width: 280px; padding: 14px; }
.ui-sb-invite form { display: grid; gap: 6px; }
.ui-sb-invite b { font-size: var(--tc-font-size-md-plus, 13.5px); line-height: var(--tc-line-height-normal, 20px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-sb-invite form > span:not(.ui-sb-field-box) { font-size: var(--tc-font-size-sm-plus, 12.5px); line-height: var(--tc-line-height-snug, 18px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-sb-invite .ui-sb-field-box { margin: 6px 0 4px; }

/* Narrower panels: overview and plans stack, fields put the label above */
@container ui-as-main (max-width: 900px) {
  .ui-sb-stack { grid-template-columns: minmax(0, 1fr); }
  .ui-sb-plans { grid-template-columns: minmax(0, 1fr); }
}
@container ui-as-main (max-width: 640px) {
  .ui-sb-field { grid-template-columns: minmax(0, 1fr); gap: 10px; }
  .ui-sb-key, .ui-sb-tray__end--key { display: none; }
  .ui-sb-section__head { flex-wrap: wrap; align-items: flex-start; }
}
@container ui-as (max-width: 900px) {
  .ui-sb { width: calc(100% - 48px); }
}
@container ui-as (max-width: 600px) {
  .ui-sb { width: calc(100% - 32px); padding: 52px 0 48px; }
  .ui-sb__bar { margin: 6px -12px 0; padding: 14px 12px 10px; overflow-x: auto; }
  .ui-sb-pay { padding: 4px 14px; }
  .ui-sb-pay__row { flex-wrap: wrap; padding: 12px 0; }
  .ui-sb-form__fields { padding: 4px 16px; }
  .ui-sb-tray__end { display: none; }
}
`;
