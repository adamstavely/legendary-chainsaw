import { useMemo, useRef, useState } from "react";
import type * as UI from "@blocks/header-nav";
import type { AppPickerApp, NotificationItem, NotificationsChange } from "trenchcoat/react";
import { caption } from "../../demo-kit";

/* A product's header: the logo and a search field on the left, the Header Nav block on the right – notifications,
   the app picker and Ada's avatar. Open any of the three: the others close. Read or dismiss notifications, approve
   the access request, switch apps or pick an account action; what happened shows under the header. Narrow the stage
   (or view it at 320 px) and the search folds into an icon that opens it across the header. */

// A fixed clock, so "6m" and the day groups read the same on every load
const NOW = Date.UTC(2026, 9, 27, 9, 30);
const MIN = 60_000;
const HOUR = 60 * MIN;

/** A Lucide (ISC, lucide.dev) stroke icon as an element – the components clone it */
function glyph(paths: string) {
  const t = document.createElement("template");
  t.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  return t.content.firstElementChild as Element;
}

const ICONS = {
  projects: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/><path d="M8 10v4"/><path d="M12 10v2"/><path d="M16 10v6"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  drive: '<path d="M22 12H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><path d="M6 16h.01"/><path d="M10 16h.01"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  analytics: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  rocket:
    '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
};

function makeApps(): AppPickerApp[] {
  return [
    { id: "projects", name: "Projects", href: "#apps/projects", description: "Plans, milestones and status", icon: glyph(ICONS.projects), tone: "green" },
    { id: "mail", name: "Mail", href: "#apps/mail", description: "Your inbox and shared mailboxes", icon: glyph(ICONS.mail), tone: "blue", keywords: ["email", "inbox"] },
    { id: "calendar", name: "Calendar", href: "#apps/calendar", description: "Meetings, rooms and time off", icon: glyph(ICONS.calendar), tone: "rose" },
    { id: "docs", name: "Docs", href: "#apps/docs", description: "Write and review together" },
    { id: "drive", name: "Drive", href: "#apps/drive", description: "Files shared with your team", icon: glyph(ICONS.drive), tone: "amber" },
    { id: "chat", name: "Chat", href: "#apps/chat", description: "Channels and direct messages", icon: glyph(ICONS.chat), tone: "violet" },
    { id: "analytics", name: "Analytics", href: "#apps/analytics", description: "Dashboards and weekly reports", icon: glyph(ICONS.analytics), tone: "teal" },
    { id: "admin", name: "Admin console", href: "#apps/admin", description: "Users, security and settings" },
  ];
}

function makeNotifications(): NotificationItem[] {
  return [
    { id: "n1", actor: "Maya Chen", title: "mentioned you in Q3 roadmap", body: "Can you check the launch dates before Friday’s review?", time: NOW - 6 * MIN, context: "Q3 roadmap", href: "#q3-roadmap" },
    { id: "n2", actor: "Jordan Park", title: "requested access to Revenue dashboard", body: "Needs view access for the board pack.", time: NOW - 48 * MIN, context: "Access requests", actions: [{ id: "approve", label: "Approve", primary: true }, { id: "decline", label: "Decline" }] },
    { id: "n3", title: "Production deploy finished", body: "web-app v4.12.0 is live in every region.", time: NOW - 2 * HOUR, context: "Deploys", icon: glyph(ICONS.rocket), tone: "success" },
    { id: "n4", actor: "Priya Natarajan", title: "assigned you Fix invoice rounding", time: NOW - 26 * HOUR, context: "Billing · BIL-482", href: "#bil-482", read: true },
    { id: "n5", title: "New sign-in from Safari on macOS", body: "If this wasn’t you, reset your password.", time: NOW - 30 * HOUR, context: "Security", icon: glyph(ICONS.shield), tone: "warning", read: true, dismissible: true },
  ];
}

const SEARCH = '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>';
const CLOSE = '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>';
const Icon = ({ d }: { d: string }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: d }} />;

export default function Demo({ ui }: { ui: typeof UI }) {
  const { HeaderNav } = ui;
  const apps = useMemo(makeApps, []);
  const [items, setItems] = useState<NotificationItem[]>(makeNotifications);
  const [current, setCurrent] = useState("projects");
  const [pinned, setPinned] = useState(["projects", "mail", "calendar"]);
  const [searching, setSearching] = useState(false);
  const [last, setLast] = useState("");
  const searchBtn = useRef<HTMLButtonElement>(null);
  const app = apps.find((a) => a.id === current);

  return (
    <div className="demo-hn">
      <style>{demoCss}</style>
      <div className="demo-hn__window">
        <header className="demo-hn__bar" data-searching={searching || undefined}>
          <a className="demo-hn__brand" href="#home" aria-label="Northwind home" onClick={(e) => e.preventDefault()}>
            <svg className="demo-hn__logo" viewBox="0 0 24 24" aria-hidden="true">
              <rect width="24" height="24" rx="7" fill="currentColor" />
              <path d="M7 16.5V7.5l10 9V7.5" fill="none" stroke="var(--tc-surface-raised, #fff)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="demo-hn__name">Northwind</span>
          </a>
          <label className="demo-hn__search">
            <Icon d={SEARCH} />
            <input
              type="search"
              placeholder="Search projects, people, files"
              aria-label="Search"
              onKeyDown={(e) => {
                if (e.key === "Escape" && searching) {
                  setSearching(false);
                  searchBtn.current?.focus();
                }
              }}
              ref={(el) => {
                if (el && searching) el.focus();
              }}
            />
            <kbd>⌘K</kbd>
          </label>
          {searching ? (
            <button
              type="button"
              className="demo-hn__icon demo-hn__close"
              aria-label="Close search"
              onClick={() => {
                setSearching(false);
                requestAnimationFrame(() => searchBtn.current?.focus());
              }}
            >
              <Icon d={CLOSE} />
            </button>
          ) : (
            <>
              <button ref={searchBtn} type="button" className="demo-hn__icon demo-hn__searchbtn" aria-label="Search" onClick={() => setSearching(true)}>
                <Icon d={SEARCH} />
              </button>
              <span className="demo-hn__spacer" />
              <HeaderNav
                className="demo-hn__nav"
                user={{ name: "Ada Lovelace", email: "ada.lovelace@northwind.co", presence: "online", tone: "violet" }}
                notifications={{
                  items,
                  now: NOW,
                  settingsHref: "#notification-settings",
                  onItemsChange: (next: NotificationItem[], change: NotificationsChange) => {
                    setItems(next);
                    setLast(change.action === "read-all" ? "Marked all notifications as read" : change.action === "dismiss" ? "Dismissed a notification" : `Marked ${change.ids.length} as ${change.action}`);
                  },
                  onAction: (n: NotificationItem, action: string) => {
                    setItems((list) => list.map((x) => (x.id === n.id ? { ...x, actions: undefined, read: true, body: action === "approve" ? "You approved view access." : "You declined the request." } : x)));
                    setLast(`${action === "approve" ? "Approved" : "Declined"} ${n.actor}’s request`);
                    return false;
                  },
                  onItemOpen: (n: NotificationItem) => {
                    setLast(`Opened “${n.title}”`);
                    return false;
                  },
                }}
                apps={{
                  apps,
                  current,
                  pinned,
                  pinnable: true,
                  onPinnedChange: setPinned,
                  footerHref: "#apps/manage",
                  footerLabel: "Manage apps",
                  onSelect: (a: AppPickerApp) => {
                    setCurrent(a.id);
                    setLast(`Switched to ${a.name}`);
                    return false;
                  },
                }}
                setup={{ done: 3, total: 5, next: "Add a profile photo" }}
                onSetupContinue={(next: string) => setLast(`Next setup step: ${next}`)}
                onAccountSelect={(id: string) => setLast(id === "sign-out" ? "Signed out (not really)" : `Account: ${id}`)}
              />
            </>
          )}
        </header>
        <main className="demo-hn__page" aria-label={app?.name ?? "Page"}>
          <p className="demo-hn__eyebrow">{app?.name}</p>
          <div className="demo-hn__rows" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </main>
      </div>
      <p style={{ ...caption, margin: 0, minHeight: 18 }} role="status">
        {last}
      </p>
    </div>
  );
}

// The demo's own header: a white bar with a hairline under it, the search as a sunken field that folds into an icon
// button (the same round ghost button as the block's) when the header is narrow
const demoCss = `
.demo-hn { container-type: inline-size; width: 100%; max-width: 1040px; display: grid; gap: var(--tc-space-3); font-family: var(--tc-font-sans); color: var(--tc-text-primary); }
.demo-hn__window { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-base); box-shadow: var(--tc-card-shadow); }
.demo-hn__bar { display: flex; align-items: center; gap: var(--tc-space-3); height: 56px; padding: 0 var(--tc-space-3) 0 var(--tc-space-4); background: var(--tc-surface-raised); border-bottom: var(--tc-hairline) solid var(--tc-border-subtle); }
.demo-hn__brand { display: inline-flex; align-items: center; gap: var(--tc-space-2); flex: none; color: var(--tc-text-primary); text-decoration: none; border-radius: var(--tc-radius-md); }
.demo-hn__brand:focus-visible, .demo-hn__icon:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.demo-hn__logo { width: 24px; height: 24px; color: var(--tc-text-strong); }
.demo-hn__name { font-size: var(--tc-title-font-size); font-weight: var(--tc-title-font-weight); letter-spacing: var(--tc-title-tracking); }
.demo-hn__search { position: relative; display: flex; align-items: center; gap: var(--tc-space-2); flex: 0 1 360px; min-width: 0; height: var(--tc-field-h-sm); margin-left: var(--tc-space-3); padding: 0 var(--tc-space-2) 0 var(--tc-space-2-5); border-radius: var(--tc-field-radius); background: var(--tc-field-bg-sunken); color: var(--tc-text-muted); }
.demo-hn__search:focus-within { box-shadow: var(--tc-field-shadow-focus); background: var(--tc-field-bg); }
.demo-hn__search > svg, .demo-hn__icon svg { width: 16px; height: 16px; flex: none; stroke-width: 1.75; }
[data-look="clean"] .demo-hn__search > svg, [data-look="clean"] .demo-hn__icon svg { stroke-width: 1.5; }
.demo-hn__search input { flex: 1; min-width: 0; height: 100%; padding: 0; border: 0; background: none; outline: none; font: inherit; font-size: var(--tc-font-size-md); color: var(--tc-text-primary); }
.demo-hn__search input::placeholder { color: var(--tc-text-placeholder); }
.demo-hn__search input::-webkit-search-cancel-button { display: none; }
.demo-hn__search kbd { flex: none; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-sm); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.demo-hn__spacer { flex: 1; }
.demo-hn__icon { display: none; place-items: center; flex: none; width: var(--tc-control-h-md); height: var(--tc-control-h-md); margin: 0; padding: 0; border: 0; border-radius: var(--tc-radius-full); background: none; color: var(--tc-action-ghost-fg); cursor: pointer; }
.demo-hn__icon:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.demo-hn__icon svg { width: 18px; height: 18px; }
.demo-hn__page { display: grid; align-content: start; gap: var(--tc-space-3); min-height: 420px; padding: var(--tc-space-6) var(--tc-space-6); }
.demo-hn__eyebrow { margin: 0; font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-strong); }
.demo-hn__rows { display: grid; gap: var(--tc-space-3); }
.demo-hn__rows span { height: 64px; border-radius: var(--tc-radius-lg); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); }
.demo-hn__rows span:nth-child(2) { width: 82%; }
.demo-hn__rows span:nth-child(3) { width: 64%; }
/* Narrow: the search folds into an icon; opened, it takes the header's width with a close button */
@container (max-width: 640px) {
  .demo-hn__bar { gap: var(--tc-space-1); padding: 0 var(--tc-space-2) 0 var(--tc-space-3); }
  .demo-hn__brand { margin-right: var(--tc-space-1); }
  .demo-hn__search { display: none; }
  .demo-hn__searchbtn { display: inline-grid; }
  .demo-hn__page { padding: var(--tc-space-4); }
}
@container (max-width: 400px) {
  .demo-hn__name { display: none; }
}
.demo-hn__bar[data-searching] .demo-hn__brand { display: none; }
.demo-hn__bar[data-searching] .demo-hn__search { display: flex; flex: 1; margin-left: 0; }
.demo-hn__bar[data-searching] .demo-hn__close { display: inline-grid; }
`;
