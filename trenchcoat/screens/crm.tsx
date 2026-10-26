"use client";

/*
 * CRM – a company list with pipelines, open views as tabs and an editable table, in a single file.
 * A path with a favorite star on top, then the open views as tabs, then the Data Table from the library
 * filling the rest of the panel. Sits in the Trenchcoat App Shell.
 * Imports: app-shell (AppShell, Dropdown, FileCard, Icon, useToast), button and data-table from `@/components/ui/<name>` –
 * copy them alongside; icons from lucide-react 1.55.0; company logos from Simple Icons (CC0).
 */

import { useCallback, useEffect, useRef, useState, type ComponentPropsWithoutRef, type CSSProperties, type Ref } from "react";
import {
  BuildingIcon,
  CalendarIcon,
  ChartColumnBigIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  DollarSignIcon,
  FilePlusIcon,
  FolderIcon,
  HouseIcon,
  LayoutGridIcon,
  LinkIcon,
  RotateCwIcon,
  SquareKanbanIcon,
  StarIcon,
  TableIcon,
  TagIcon,
  TargetIcon,
  TextAlignStartIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataColumn, type DataRow, type TagTone } from "@/components/ui/data-table";
import { AppShell, Dropdown, FileCard, Icon, fileKind, useToast, type AppShellProps, type FileItem, type ShellGroup, type ShellNavItem } from "@/components/ui/app-shell";

/** Sample content – replace with your own data */
const nav: ShellNavItem[] = [
  { label: "Home", icon: HouseIcon },
  { label: "Companies", icon: BuildingIcon, count: 284 },
  { label: "Contacts", icon: UsersIcon },
  { label: "Deals", icon: DollarSignIcon },
  { label: "Reports", icon: ChartColumnBigIcon },
];
const groups: ShellGroup[] = [
  {
    label: "Pipelines",
    items: [
      { label: "New business", icon: TargetIcon },
      { label: "Renewals", icon: RotateCwIcon },
      { label: "Partnerships", icon: UsersIcon },
    ],
  },
];

/** Company marks (Simple Icons, CC0): [color, path] on a 24 × 24 grid */
const LOGOS: Record<string, [string, string]> = {
  notion: ["#171717", "M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"],
  linear: ["#5E6AD2", "M2.886 4.18A11.982 11.982 0 0 1 11.99 0C18.624 0 24 5.376 24 12.009c0 3.64-1.62 6.903-4.18 9.105L2.887 4.18ZM1.817 5.626l16.556 16.556c-.524.33-1.075.62-1.65.866L.951 7.277c.247-.575.537-1.126.866-1.65ZM.322 9.163l14.515 14.515c-.71.172-1.443.282-2.195.322L0 11.358a12 12 0 0 1 .322-2.195Zm-.17 4.862 9.823 9.824a12.02 12.02 0 0 1-9.824-9.824Z"],
  figma: ["#F24E1E", "M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.014-4.49-4.49S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117V8.981H8.148zM8.172 24c-2.489 0-4.515-2.014-4.515-4.49s2.014-4.49 4.49-4.49h4.588v4.441c0 2.503-2.047 4.539-4.563 4.539zm-.024-7.51a3.023 3.023 0 0 0-3.019 3.019c0 1.665 1.365 3.019 3.044 3.019 1.705 0 3.093-1.376 3.093-3.068v-2.97H8.148zm7.704 0h-.098c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h.098c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.49-4.49 4.49zm-.097-7.509c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h.098c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-.098z"],
  stripe: ["#635BFF", "M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"],
  shopify: ["#7AB55C", "M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z"],
  airtable: ["#18BFFF", "M11.992 1.966c-.434 0-.87.086-1.28.257L1.779 5.917c-.503.208-.49.908.012 1.116l8.982 3.558a3.266 3.266 0 0 0 2.454 0l8.982-3.558c.503-.196.503-.908.012-1.116l-8.957-3.694a3.255 3.255 0 0 0-1.272-.257zM23.4 8.056a.589.589 0 0 0-.222.045l-10.012 3.877a.612.612 0 0 0-.38.564v8.896a.6.6 0 0 0 .821.552L23.62 18.1a.583.583 0 0 0 .38-.551V8.653a.6.6 0 0 0-.6-.596zM.676 8.095a.644.644 0 0 0-.48.19C.086 8.396 0 8.53 0 8.69v8.355c0 .442.515.737.908.54l6.27-3.006.307-.147 2.969-1.436c.466-.22.43-.908-.061-1.092L.883 8.138a.57.57 0 0 0-.207-.044z"],
  hubspot: ["#FF7A59", "M18.164 7.93V5.084a2.198 2.198 0 001.267-1.978v-.067A2.2 2.2 0 0017.238.845h-.067a2.2 2.2 0 00-2.193 2.193v.067a2.196 2.196 0 001.252 1.973l.013.006v2.852a6.22 6.22 0 00-2.969 1.31l.012-.01-7.828-6.095A2.497 2.497 0 104.3 4.656l-.012.006 7.697 5.991a6.176 6.176 0 00-1.038 3.446c0 1.343.425 2.588 1.147 3.607l-.013-.02-2.342 2.343a1.968 1.968 0 00-.58-.095h-.002a2.033 2.033 0 102.033 2.033 1.978 1.978 0 00-.1-.595l.005.014 2.317-2.317a6.247 6.247 0 104.782-11.134l-.036-.005zm-.964 9.378a3.206 3.206 0 113.215-3.207v.002a3.206 3.206 0 01-3.207 3.207z"],
  webflow: ["#146EF5", "m24 4.515-7.658 14.97H9.149l3.205-6.204h-.144C9.566 16.713 5.621 18.973 0 19.485v-6.118s3.596-.213 5.71-2.435H0V4.515h6.417v5.278l.144-.001 2.622-5.277h4.854v5.244h.144l2.72-5.244H24Z"],
  vercel: ["#171717", "m12 1.608 12 20.784H0Z"],
  clickup: ["#7B68EE", "M2 18.439l3.69-2.828c1.961 2.56 4.044 3.739 6.363 3.739 2.307 0 4.33-1.166 6.203-3.704L22 18.405C19.298 22.065 15.941 24 12.053 24 8.178 24 4.788 22.078 2 18.439zM12.04 6.15l-6.568 5.66-3.036-3.52L12.055 0l9.543 8.296-3.05 3.509z"],
};

const Logo = ({ id }: { id: string }) => (
  <span className="ui-as-crm__logo">
    <svg viewBox="0 0 24 24" fill={LOGOS[id][0]} aria-hidden="true">
      <path d={LOGOS[id][1]} />
    </svg>
  </span>
);

/** Coloured tiles for the view tabs – never white: brand colour with a white mark, or the full-colour mark on black */
const FigmaMark = () => (
  <svg viewBox="0 0 38 57" aria-hidden="true">
    <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0Z" fill="#1ABCFE" />
    <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0Z" fill="#0ACF83" />
    <path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19Z" fill="#FF7262" />
    <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5Z" fill="#F24E1E" />
    <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5Z" fill="#A259FF" />
  </svg>
);
const TabMark = ({ id }: { id: string }) =>
  id === "figma" ? (
    <span className="ui-as-crm__tab-logo" style={{ background: "#1e1e1e" }}>
      <FigmaMark />
    </span>
  ) : (
    <span className="ui-as-crm__tab-logo" style={{ background: id === "notion" ? "#171717" : LOGOS[id][0] }}>
      <svg viewBox="0 0 24 24" fill="#ffffff" aria-hidden="true">
        <path d={LOGOS[id][1]} />
      </svg>
    </span>
  );

const companies = [
  { id: "notion", name: "Notion", category: "Productivity", domain: "notion.so", owner: "Mara Klein", value: 48000, stage: "Negotiation", contact: "Today" },
  { id: "linear", name: "Linear", category: "Planning", domain: "linear.app", owner: "Jonas Weber", value: 12500, stage: "Proposal", contact: "Yesterday" },
  { id: "figma", name: "Figma", category: "Design", domain: "figma.com", owner: "Mara Klein", value: 86000, stage: "Won", contact: "Mar 6" },
  { id: "stripe", name: "Stripe", category: "Payments", domain: "stripe.com", owner: "Lea Braun", value: 124000, stage: "Qualified", contact: "Mar 5" },
  { id: "shopify", name: "Shopify", category: "E-commerce", domain: "shopify.com", owner: "Jonas Weber", value: 9800, stage: "New", contact: "Mar 4" },
  { id: "vercel", name: "Vercel", category: "Developer Tools", domain: "vercel.com", owner: "Lea Braun", value: 62000, stage: "Proposal", contact: "Mar 3" },
  { id: "airtable", name: "Airtable", category: "Productivity", domain: "airtable.com", owner: "Mara Klein", value: 37500, stage: "Qualified", contact: "Mar 1" },
  { id: "hubspot", name: "HubSpot", category: "CRM", domain: "hubspot.com", owner: "Tom Fischer", value: 21000, stage: "New", contact: "Feb 27" },
  { id: "clickup", name: "ClickUp", category: "Planning", domain: "clickup.com", owner: "Tom Fischer", value: 6400, stage: "Lost", contact: "Feb 25" },
  { id: "webflow", name: "Webflow", category: "Design", domain: "webflow.com", owner: "Lea Braun", value: 18900, stage: "Negotiation", contact: "Feb 24" },
];

const columns: DataColumn[] = [
  { key: "company", label: "Company", icon: <Icon icon={TextAlignStartIcon} size={15} />, type: "title", width: "16%" },
  { key: "category", label: "Category", icon: <Icon icon={TagIcon} size={15} />, type: "tag", width: "14%" },
  { key: "domain", label: "Domain", icon: <Icon icon={LinkIcon} size={15} />, type: "link", width: "14%" },
  { key: "owner", label: "Owner", icon: <Icon icon={UserIcon} size={15} />, type: "text", width: "12%" },
  { key: "value", label: "Value", icon: <Icon icon={DollarSignIcon} size={15} />, type: "number", width: "12%" },
  { key: "stage", label: "Stage", icon: <Icon icon={SquareKanbanIcon} size={15} />, type: "tag", width: "12%" },
  { key: "contact", label: "Last contact", icon: <Icon icon={CalendarIcon} size={15} />, type: "text" },
];

const rows: DataRow[] = companies.map((c) => ({
  id: c.id,
  company: c.name,
  logo: <Logo id={c.id} />,
  category: c.category,
  domain: `https://${c.domain}`,
  owner: c.owner,
  value: c.value,
  stage: c.stage,
  contact: c.contact,
}));

const tones: Record<string, TagTone> = {
  Productivity: "gray",
  Planning: "blue",
  Design: "pink",
  Payments: "violet",
  "E-commerce": "amber",
  "Developer Tools": "gray",
  CRM: "blue",
  New: "gray",
  Qualified: "blue",
  Proposal: "violet",
  Negotiation: "amber",
  Won: "green",
  Lost: "pink",
};

/** Open views, each marked with the tool it lives in */
const tabs = [
  { label: "Company CRM", logo: "hubspot" },
  { label: "Team strategy", logo: "linear" },
  { label: "Pixel integration", logo: "figma" },
  { label: "Sales docs", logo: "notion" },
];

const stages = ["New", "Qualified", "Proposal", "Negotiation", "Won"];
const money = (n: number) => `$${n.toLocaleString("en-US")}`;

const docs: (FileItem & { owner: string })[] = [
  { name: "Sales-Playbook", type: "DOC", edited: "Today", owner: "Mara Klein" },
  { name: "Pricing-2025", type: "PDF", edited: "Yesterday", owner: "Lea Braun" },
  { name: "Pipeline-Forecast", type: "XLS", edited: "3 days ago", owner: "Jonas Weber" },
  { name: "Objection-Handling", type: "DOC", edited: "Last week", owner: "Tom Fischer" },
];

const snippet = `<script async src="https://cdn.acme.com/pixel.js"></script>
<script>
  window.acme = window.acme || [];
  acme.push(["init", "px_4f9a21"]);
  acme.push(["track", "page_view"]);
</script>`;

type CrmOwnProps = Pick<AppShellProps, "onNavigate" | "workspace" | "user"> & {
  /** Open view (its label, e.g. "Company CRM") – controlled; use `defaultTab` for a starting view */
  tab?: string;
  /** View open first when `tab` isn't controlled */
  defaultTab?: string;
  /** Called with the view's label when another view is picked */
  onTabChange?: (tab: string) => void;
};

/** `className`, other DOM props and `ref` go to the App Shell's root */
export type CrmScreenProps = Omit<ComponentPropsWithoutRef<"div">, keyof CrmOwnProps | "children"> & CrmOwnProps & { ref?: Ref<HTMLDivElement> };

export function CrmScreen({ tab: tabProp, defaultTab = tabs[0].label, onTabChange, onNavigate, workspace, user, ref, ...rest }: CrmScreenProps) {
  const [tab, setTab] = useControllable(tabProp, defaultTab, onTabChange, "tab");
  const [starred, setStarred] = useState(false);
  const [view, setView] = useState("Head of Sales");
  const [copied, setCopied] = useState(false);
  const [verify, setVerify] = useState<"idle" | "busy" | "ok">("idle");
  const [toast, showToast] = useToast();
  const later = useLater();

  const copy = () => {
    navigator.clipboard?.writeText(snippet).catch(() => {});
    setCopied(true);
    // Copying again restarts the "Copied" time instead of an older timer cutting it short
    later("copied", () => setCopied(false), 1600);
  };
  const check = () => {
    if (verify === "busy") return;
    setVerify("busy");
    later("verify", () => setVerify("ok"), 1400);
  };

  return (
    <AppShell {...rest} ref={ref} active="Companies" nav={nav} groups={groups} onNavigate={onNavigate} workspace={workspace} user={user}>
      <style href="ui-screen-crm" precedence="default">
        {css}
      </style>
      <div className="ui-as-crm">
        <header className="ui-as-crm__top">
          <span className="ui-as-crm__path">
            <Icon icon={FolderIcon} size={15} />
            <span>Sales</span>
            <i>/</i>
            <Dropdown
              title="Views"
              items={["Head of Sales", "Account executive", "Partner manager"].map((v) => ({ label: v, checked: v === view, onSelect: () => setView(v) }))}
              trigger={({ open, toggle }) => (
                <button type="button" className="ui-as-crm__view" aria-expanded={open} aria-haspopup="menu" onClick={toggle}>
                  {view}
                  <Icon icon={ChevronDownIcon} size={13} />
                </button>
              )}
            />
          </span>
          <button
            type="button"
            className="ui-as-icon-btn ui-as-crm__star"
            aria-label={starred ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={starred}
            onClick={() => {
              setStarred((s) => !s);
              showToast(starred ? "Removed from favorites" : "Added to favorites");
            }}
          >
            <Icon icon={StarIcon} size={15} />
          </button>
        </header>

        <nav className="ui-as-crm__tabs" aria-label="Open views">
          <button type="button" className="ui-as-icon-btn" aria-label="New view">
            <Icon icon={FilePlusIcon} size={16} />
          </button>
          <button type="button" className="ui-as-icon-btn" aria-label="All views">
            <Icon icon={LayoutGridIcon} size={16} />
          </button>
          <span className="ui-as-crm__sep" aria-hidden="true" />
          {tabs.map((t) => (
            <button
              key={t.label}
              type="button"
              className="ui-as-crm__tab"
              aria-current={tab === t.label ? "page" : undefined}
              onClick={(e) => {
                setTab(t.label);
                // On a narrow screen the views scroll sideways – bring the picked one fully into view
                const el = e.currentTarget;
                const bar = el.parentElement;
                if (!bar || bar.scrollWidth <= bar.clientWidth) return;
                const left = Math.min(el.offsetLeft - 14, Math.max(bar.scrollLeft, el.offsetLeft + el.offsetWidth + 14 - bar.clientWidth));
                bar.scrollTo({ left, behavior: "smooth" });
              }}
            >
              <TabMark id={t.logo} />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="ui-as-crm__table" key={tab} data-bare={tab === "Company CRM" || undefined}>
          {tab === "Company CRM" && (
            <DataTable title="Company CRM" icon={<Icon icon={TableIcon} size={16} />} columns={columns} defaultRows={rows} tagTones={tones} />
          )}

          {tab === "Team strategy" && (
            <div className="ui-as-board">
              {stages.map((stage, si) => {
                const deals = companies.filter((c) => c.stage === stage);
                return (
                  <section key={stage} className="ui-as-board__col ui-as-rise" style={{ "--i": si } as CSSProperties}>
                    <header>
                      <span className="ui-as-board__dot" data-tone={tones[stage]} aria-hidden="true" />
                      {stage}
                      <span className="ui-as-board__count">{deals.length}</span>
                      <span className="ui-as-board__sum">{money(deals.reduce((n, d) => n + d.value, 0))}</span>
                    </header>
                    {deals.map((d) => (
                      <article key={d.id} className="ui-as-board__card">
                        <span className="ui-as-board__name">
                          <span className="ui-as-board__logo">
                            <Logo id={d.id} />
                          </span>
                          {d.name}
                        </span>
                        <b>{money(d.value)}</b>
                        <span className="ui-as-board__meta">
                          {d.owner} · {d.contact}
                        </span>
                      </article>
                    ))}
                  </section>
                );
              })}
            </div>
          )}

          {tab === "Pixel integration" && (
            <div className="ui-as-pixel">
              <h2 className="ui-as-rise">Install the tracking pixel</h2>
              <p className="ui-as-rise" style={{ "--i": 1 } as CSSProperties}>
                Add this snippet to every page, right before the closing &lt;/head&gt; tag. Visits and sign-ups then show up on each company.
              </p>
              <div className="ui-as-pixel__code ui-as-rise" style={{ "--i": 2 } as CSSProperties}>
                <span className="ui-as-pixel__copy">
                  <Button size="sm" variant="secondary" icon={<Icon icon={copied ? CheckIcon : CopyIcon} size={14} />} onClick={copy}>
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </span>
                {/* Scrolls sideways on a narrow screen – focusable so the keyboard can scroll it too */}
                <pre tabIndex={0} aria-label="Tracking snippet">
                  {snippet}
                </pre>
              </div>
              {/* Mounted from the start, so the copy is announced when it happens */}
              <span className="ui-as-crm-sr" role="status">
                {copied ? "Snippet copied" : ""}
              </span>
              <div className="ui-as-pixel__status ui-as-rise" style={{ "--i": 3 } as CSSProperties} data-state={verify}>
                <span className="ui-as-pixel__light" aria-hidden="true" />
                <span role="status">
                  <b>{verify === "ok" ? "Pixel is live" : verify === "busy" ? "Checking…" : "Waiting for the first event"}</b>
                  {verify === "ok" ? "Last event: page_view on acme.com, just now" : "Install the snippet, then check the connection."}
                </span>
                {/* Loading keeps the button focusable (aria-disabled), so focus stays on it while the check runs */}
                <Button size="sm" variant="secondary" loading={verify === "busy"} onClick={check}>
                  {verify === "ok" ? "Check again" : "Check connection"}
                </Button>
              </div>
            </div>
          )}

          {tab === "Sales docs" && (
            <div className="ui-as-crm-docs ui-as-file-grid">
              {docs.map((d, i) => (
                <div key={d.name} className="ui-as-rise" style={{ "--i": i } as CSSProperties}>
                  <FileCard file={d} meta={<>{fileKind[d.type]} · {d.owner} · {d.edited}</>} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {toast}
    </AppShell>
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

/** Named timeouts: setting one again replaces it, and all are cleared on unmount */
function useLater() {
  const timers = useRef(new Map<string, number>());
  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => window.clearTimeout(t));
      map.clear();
    };
  }, []);
  return useCallback((key: string, fn: () => void, ms: number) => {
    const map = timers.current;
    window.clearTimeout(map.get(key));
    map.set(
      key,
      window.setTimeout(() => {
        map.delete(key);
        fn();
      }, ms),
    );
  }, []);
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where(.dark, [data-theme="dark"]) { color-scheme: dark; }
:where([data-theme="light"]) { color-scheme: light; }

/* CRM: path and tabs on the panel, the open view below */
.ui-as-crm { display: flex; flex-direction: column; height: 100%; min-height: 0; padding: 0 0 12px; }
.ui-as-crm__top { display: flex; flex: none; align-items: center; gap: 6px; height: 52px; padding: 0 16px 0 20px; }
.ui-as-crm__path { display: flex; align-items: center; gap: 8px; min-width: 0; font-size: var(--tc-font-size-md-plus, 13.5px); line-height: var(--tc-line-height-normal, 20px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-as-crm__path i { font-style: normal; color: var(--tc-icon-muted, light-dark(#858585, #7c7c82)); }
/* The view picker: a ghost control */
.ui-as-crm__view {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: var(--tc-control-h-sm, 28px);
  margin-left: -6px;
  padding: 0 6px;
  border-radius: var(--tc-control-radius-sm, 8px);
  font-weight: var(--tc-font-weight-medium, 500);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  white-space: nowrap;
  transition: background-color var(--tc-duration-quick, 120ms) var(--tc-ease-standard, ease);
}
.ui-as-crm__view:hover, .ui-as-crm__view[aria-expanded="true"] { background: var(--tc-action-ghost-bg-hover, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); }
.ui-as-crm__view:focus-visible, .ui-as-crm__tab:focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); }
.ui-as-crm__star[aria-pressed="true"] { color: var(--tc-status-warning-solid, light-dark(#c2710c, #f5a524)); }
.ui-as-crm__star[aria-pressed="true"] path { fill: currentColor; }

/* Open views: ghost controls, the open one filled and in the strong weight */
.ui-as-crm__tabs { display: flex; flex: none; align-items: center; gap: 4px; padding: 0 14px 12px; }
.ui-as-crm__sep { flex: none; width: var(--tc-hairline, 1px); height: 18px; margin: 0 6px; background: var(--tc-divider, light-dark(#ececec, #2a2a2e)); }
.ui-as-crm__tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: var(--tc-control-h-md, 32px);
  padding: 0 var(--tc-control-px-md, 12px) 0 10px;
  border-radius: var(--tc-control-radius-md, 10px);
  font-size: var(--tc-control-font-size, 13px);
  line-height: var(--tc-line-height-normal, 20px);
  color: var(--tc-action-ghost-fg, light-dark(#404040, #c8c8cc));
  white-space: nowrap;
  transition: background-color var(--tc-duration-quick, 120ms) var(--tc-ease-standard, ease), color var(--tc-duration-quick, 120ms) var(--tc-ease-standard, ease);
}
.ui-as-crm__tab:hover { color: var(--tc-text-primary, light-dark(#171717, #ededed)); background: var(--tc-action-ghost-bg-hover, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); }
.ui-as-crm__tab[aria-current="page"] { background: var(--tc-fill-default, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); color: var(--tc-text-primary, light-dark(#171717, #ededed)); font-weight: var(--tc-font-weight-strong, 600); }

/* The open view: a card inset from the panel; the Data Table brings its own tray and card, so it sits bare */
.ui-as-crm__table {
  flex: 1;
  min-height: 0;
  margin: 0 12px;
  overflow: auto;
  border-radius: var(--tc-card-radius, 16px);
  background: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
}
.ui-as-crm__table[data-bare] { border-radius: 0; background: none; box-shadow: none; }
.ui-as-crm__table > * { animation: ui-as-rise var(--tc-duration-slower, 420ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)) both; }

/* Team strategy: deals as a board by stage */
.ui-as-board { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; padding: 16px; }
.ui-as-board__col { display: flex; flex-direction: column; gap: 8px; min-width: 0; padding: var(--tc-tray-inset, 4px); padding-top: 10px; border-radius: var(--tc-tray-radius, calc(16px + 4px)); background: var(--tc-surface-tray, light-dark(#f0f0f0, #19191b)); }
.ui-as-board__col header { display: flex; align-items: center; gap: 7px; padding: 0 8px 4px; font-size: var(--tc-font-size-md, 13px); line-height: var(--tc-line-height-normal, 20px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-board__dot { flex: none; width: 7px; height: 7px; border-radius: 50%; background: var(--tc-icon-muted, light-dark(#858585, #7c7c82)); }
.ui-as-board__dot[data-tone="blue"] { background: var(--tc-status-info-solid, light-dark(#2f68ff, #6b95ff)); }
.ui-as-board__dot[data-tone="violet"] { background: var(--tc-tone-violet-solid, light-dark(#8b5cf6, #a78bfa)); }
.ui-as-board__dot[data-tone="amber"] { background: var(--tc-status-warning-solid, light-dark(#c2710c, #f5a524)); }
.ui-as-board__dot[data-tone="green"] { background: var(--tc-status-success-solid, light-dark(#1f8a4c, #3ec27a)); }
.ui-as-board__count { font-weight: var(--tc-font-weight-regular, 400); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-as-board__sum { margin-left: auto; font-size: var(--tc-font-size-sm, 12px); font-weight: var(--tc-font-weight-regular, 400); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); font-variant-numeric: tabular-nums; }
.ui-as-board__card {
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  border-radius: var(--tc-card-radius, 16px);
  background: var(--tc-surface-on-tray, light-dark(#ffffff, #232326));
  box-shadow: var(--tc-card-shadow, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)));
  transition: box-shadow var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease), transform var(--tc-duration-base, 200ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-as-board__card:hover { transform: translateY(-1px); box-shadow: var(--tc-card-shadow-hover, 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6))); }
.ui-as-board__name { display: flex; align-items: center; gap: 8px; min-width: 0; font-size: var(--tc-font-size-md-plus, 13.5px); line-height: var(--tc-line-height-normal, 20px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-board__logo { display: block; flex: none; width: 20px; height: 20px; }
.ui-as-board__card b { font-size: var(--tc-font-size-lg, 14px); line-height: var(--tc-line-height-normal, 20px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); font-variant-numeric: tabular-nums; }
.ui-as-board__meta { overflow: hidden; font-size: var(--tc-font-size-sm, 12px); line-height: var(--tc-line-height-tight, 16px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); white-space: nowrap; text-overflow: ellipsis; }

/* Pixel integration: setup steps with a code snippet and a live status */
.ui-as-pixel { padding: 28px 28px 32px; }
.ui-as-pixel h2 { margin: 0; font-size: var(--tc-font-size-xl, 16px); line-height: var(--tc-line-height-loose, 24px); font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
/* Text keeps a readable line length; code block and status run the full width */
.ui-as-pixel p { max-width: 640px; margin: 6px 0 0; font-size: var(--tc-font-size-md-plus, 13.5px); line-height: var(--tc-line-height-normal, 20px); color: var(--tc-text-muted, light-dark(#646464, #9a9aa1)); }
.ui-as-pixel__code { position: relative; margin-top: 18px; border-radius: var(--tc-radius-xl, 12px); background: var(--tc-surface-sunken, light-dark(#f0f0f0, #111113)); box-shadow: var(--tc-shadow-sunken, inset 0 0 0 1px light-dark(#f0f0f0, rgba(255, 255, 255, 0.06))); }
.ui-as-pixel__code pre { margin: 0; padding: 16px 18px; overflow-x: auto; border-radius: inherit; font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: var(--tc-font-size-sm-plus, 12.5px); line-height: var(--tc-line-height-normal, 20px); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-pixel__code pre:focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); }
.ui-as-pixel__copy { position: absolute; top: 10px; right: 10px; }
.ui-as-pixel__status {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: var(--tc-radius-xl, 12px);
  box-shadow: inset 0 0 0 var(--tc-hairline, 1px) var(--tc-border-default, light-dark(#ececec, #2a2a2e));
  font-size: var(--tc-font-size-md, 13px);
  line-height: var(--tc-line-height-normal, 20px);
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
}
.ui-as-pixel__status > span:nth-child(2) { display: grid; flex: 1; gap: 1px; }
.ui-as-pixel__status b { font-weight: var(--tc-font-weight-medium, 500); color: var(--tc-text-primary, light-dark(#171717, #ededed)); }
.ui-as-pixel__light { flex: none; width: 9px; height: 9px; border-radius: 50%; background: var(--tc-status-warning-solid, light-dark(#c2710c, #f5a524)); box-shadow: 0 0 0 4px color-mix(in srgb, var(--tc-status-warning-solid, light-dark(#c2710c, #f5a524)) 15%, transparent); }
/* Blinks only while a check runs (about a second and a half) */
.ui-as-pixel__status[data-state="busy"] .ui-as-pixel__light { animation: ui-as-blink var(--tc-duration-reveal, 700ms) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)) infinite alternate; }
.ui-as-pixel__status[data-state="ok"] .ui-as-pixel__light { background: var(--tc-status-success-solid, light-dark(#1f8a4c, #3ec27a)); box-shadow: 0 0 0 4px color-mix(in srgb, var(--tc-status-success-solid, light-dark(#1f8a4c, #3ec27a)) 15%, transparent); }
@keyframes ui-as-blink { to { opacity: 0.3; } }
.ui-as-crm-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

/* Sales docs */
.ui-as-crm-docs { display: flex; flex-wrap: wrap; gap: 12px; padding: 18px; }

/* Company mark on a small white tile – brand marks keep their own colours in both themes */
.ui-as-crm__logo {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border-radius: var(--tc-radius-xs, 4px);
  background: #ffffff;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}
.ui-as-crm__logo svg { width: 64%; height: 64%; }
.ui-as-crm__tab-logo { display: grid; flex: none; place-items: center; width: 18px; height: 18px; border-radius: var(--tc-radius-xs, 4px); }
.ui-as-crm__tab-logo svg { width: 11px; height: 11px; }

/* Room for the sidebar icon while the sidebar is collapsed */
.ui-as-crm__top { transition: padding-left var(--tc-duration-slower, 420ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)); }
.ui-as-app[data-collapsed] .ui-as-crm__top { padding-left: 52px; }

/* Narrow: the views scroll sideways, the board scrolls inside its card (the Data Table scrolls itself) */
@container ui-as (max-width: 900px) {
  .ui-as-crm__top { padding-left: 52px; }
  .ui-as-crm__path > span:first-of-type { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .ui-as-crm__tabs { position: relative; overflow-x: auto; scrollbar-width: none; }
  .ui-as-crm__tabs::-webkit-scrollbar { display: none; }
  .ui-as-crm__tabs > * { flex: none; }
  .ui-as-board { grid-template-columns: repeat(5, 232px); width: max-content; }
}
@container ui-as (max-width: 600px) {
  .ui-as-crm { padding-bottom: 6px; }
  .ui-as-crm__top { padding-right: 8px; }
  .ui-as-crm__tabs { padding: 0 8px 10px; }
  .ui-as-crm__table { margin: 0 6px; }
  .ui-as-board { grid-template-columns: repeat(5, 216px); padding: 12px; }
  .ui-as-pixel { padding: 20px 16px 24px; }
  .ui-as-pixel__code pre { padding-top: 56px; }
  .ui-as-pixel__status { flex-wrap: wrap; }
  .ui-as-pixel__status > span:nth-child(2) { flex-basis: calc(100% - 30px); }
  .ui-as-crm-docs { padding: 14px; }
}
`;
