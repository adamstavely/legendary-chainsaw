import { useEffect, useMemo, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { AppPickerApp } from "../../../src/elements/react";
import { caption, surface, textButton } from "../demo-kit";

/* A suite header with the app launcher, and the same launcher shown inline below it. The list arrives after a short
   fetch (skeleton tiles); Mail and Calendar are pinned, Docs and Analytics were used last. Picking an app switches
   to it in place – the demo routes itself, as a single-page app would – and Edit pins changes what's pinned. "Fail
   the next load" shows the error state and its Retry. */

const LOAD_MS = 1200;

/** Lucide (ISC, lucide.dev) paths for a few apps' own icons */
const PATHS: Record<string, string[]> = {
  mail: ["M22 7 13.03 12.7a1.94 1.94 0 0 1-2.06 0L2 7", "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"],
  calendar: ["M8 2v4", "M16 2v4", "M3 10h18", "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"],
  drive: ["M22 12H2", "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z", "M6 16h.01", "M10 16h.01"],
  chat: ["M7.9 20A9 9 0 1 0 4 16.1L2 22Z"],
  analytics: ["M3 3v16a2 2 0 0 0 2 2h16", "M18 17V9", "M13 17V5", "M8 17v-3"],
};

function lucide(paths: string[]) {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.75");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  for (const d of paths) {
    const p = document.createElementNS(ns, "path");
    p.setAttribute("d", d);
    svg.append(p);
  }
  return svg;
}

/** A logo as an image URL – the way an app hands over a third-party product's mark */
const LOGO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#0f766e"/><path d="M11 27V13l9 9 9-9v14" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  );

function makeApps(): AppPickerApp[] {
  return [
    { id: "mail", name: "Mail", href: "#apps/mail", description: "Your inbox and shared mailboxes", icon: lucide(PATHS.mail), tone: "blue", keywords: ["email", "inbox"] },
    { id: "calendar", name: "Calendar", href: "#apps/calendar", description: "Meetings, rooms and time off", icon: lucide(PATHS.calendar), tone: "rose" },
    { id: "docs", name: "Docs", href: "#apps/docs", description: "Write and review together" },
    { id: "sheets", name: "Sheets", href: "#apps/sheets", description: "Budgets, trackers and models", tone: "green" },
    { id: "drive", name: "Drive", href: "#apps/drive", description: "Files shared with your team", icon: lucide(PATHS.drive), tone: "amber" },
    { id: "chat", name: "Chat", href: "#apps/chat", description: "Channels and direct messages", icon: lucide(PATHS.chat), tone: "violet" },
    { id: "analytics", name: "Analytics", href: "#apps/analytics", description: "Dashboards and weekly reports", icon: lucide(PATHS.analytics), tone: "teal", keywords: ["reports", "dashboards"] },
    { id: "meridian", name: "Meridian CRM", href: "#apps/crm", target: "_blank", description: "Accounts and pipeline – opens in a new tab", image: LOGO, keywords: ["sales", "customers"] },
    { id: "billing", name: "Billing", href: "#apps/billing", description: "Invoices, plans and payment methods" },
    { id: "tasks", name: "Tasks", href: "#apps/tasks", description: "Your to-dos across projects" },
    { id: "people", name: "People", href: "#apps/people", description: "Directory, teams and org chart" },
    { id: "admin", name: "Admin console", href: "#apps/admin", description: "Users, security and settings" },
  ];
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { AppPicker } = ui;
  const all = useMemo(makeApps, []);
  const [apps, setApps] = useState<AppPickerApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const failNext = useRef(false);
  const [run, setRun] = useState(0);
  const [current, setCurrent] = useState("mail");
  const [pinned, setPinned] = useState(["mail", "calendar"]);
  const [recent, setRecent] = useState(["docs", "analytics"]);
  const [last, setLast] = useState("");

  // The list is fetched: a short wait, then the apps (or an error, when asked for)
  useEffect(() => {
    setLoading(true);
    setError("");
    const t = setTimeout(() => {
      setLoading(false);
      if (failNext.current) {
        failNext.current = false;
        setApps([]);
        setError("Couldn't load your apps. Check your connection and try again.");
      } else setApps(all);
    }, LOAD_MS);
    return () => clearTimeout(t);
  }, [run, all]);

  const onSelect = (app: AppPickerApp) => {
    // A new-tab app is left to the browser; the rest are routed in place
    if (app.target === "_blank") {
      setLast(`Opened ${app.name} in a new tab`);
      return false;
    }
    setCurrent(app.id);
    setRecent((r) => [app.id, ...r.filter((id) => id !== app.id)].slice(0, 3));
    setLast(`Switched to ${app.name}`);
    return false;
  };
  const onPinnedChange = (next: string[]) => {
    const added = next.find((id) => !pinned.includes(id));
    const name = all.find((a) => a.id === (added ?? pinned.find((id) => !next.includes(id))))?.name;
    setPinned(next);
    if (name) setLast(`${added ? "Pinned" : "Unpinned"} ${name}`);
  };
  const shared = {
    apps,
    loading,
    error,
    current,
    pinned,
    recent,
    pinnable: true,
    footerHref: "#apps/manage",
    footerLabel: "Manage apps",
    onSelect,
    onPinnedChange,
    onRetry: () => setRun((n) => n + 1),
  };
  const app = all.find((a) => a.id === current);

  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 16, justifyItems: "center" }}>
      <header style={{ ...surface, width: "100%", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 12, height: 52, padding: "0 8px 0 16px", borderRadius: 12 }}>
        <strong style={{ fontSize: 14, whiteSpace: "nowrap" }}>Northwind</strong>
        <span style={{ ...caption, fontSize: 13, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app?.name ?? ""}</span>
        <span style={{ flex: 1, minWidth: 0 }} />
        <AppPicker {...shared} />
        <span aria-hidden="true" style={{ display: "grid", flexShrink: 0, placeItems: "center", width: 28, height: 28, borderRadius: "50%", background: "var(--tc-accent-subtle, light-dark(#e8efff, #1e2a44))", color: "var(--tc-accent-text, light-dark(#2456d6, #8ab4ff))", fontSize: 11, fontWeight: 600 }}>
          JP
        </span>
      </header>
      <AppPicker {...shared} layout="panel" />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {last || (loading ? "Loading your apps…" : "Pick an app, or open the launcher in the header")}{" "}
        <button type="button" style={textButton} onClick={() => setRun((n) => n + 1)}>
          Reload
        </button>{" "}
        ·{" "}
        <button
          type="button"
          style={textButton}
          onClick={() => {
            failNext.current = true;
            setRun((n) => n + 1);
          }}
        >
          Fail the next load
        </button>
      </p>
    </div>
  );
}
