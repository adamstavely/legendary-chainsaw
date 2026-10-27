import { useEffect, useMemo, useRef, useState } from "react";
import type * as UI from "../../../src/elements/react";
import type { NotificationCategory, NotificationItem, NotificationsChange } from "../../../src/elements/react";
import { caption, surface, textButton } from "../demo-kit";

/* A workspace header with the notification bell, and the same notifications as a full page below it. A mention, a
   finished deploy, an access request to approve and an assignment are waiting; a couple of seconds in, Alex's
   comment arrives – the badge pulses and it's announced once. Approve the request, open or dismiss a notification,
   switch tabs, load the older page, or try the loading, error and empty states from the line underneath. */

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const CATEGORIES: NotificationCategory[] = [
  { id: "mentions", label: "Mentions" },
  { id: "assigned", label: "Assigned" },
  { id: "system", label: "System" },
];

/** A Lucide stroke icon as an element – the component clones it */
function glyph(paths: string) {
  const t = document.createElement("template");
  t.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  return t.content.firstElementChild as Element;
}

function start(now: number, icons: Record<string, Element>): NotificationItem[] {
  return [
    { id: "n1", actor: "Maya Chen", title: "mentioned you in Q3 roadmap", body: "@you can you check the launch dates before Friday’s review? Marketing wants to lock the campaign calendar.", time: now - 6 * MIN, category: "mentions", context: "Q3 roadmap", href: "#q3-roadmap" },
    { id: "n2", title: "Production deploy finished", body: "web-app v4.12.0 is live in eu-west-1 and us-east-1.", time: now - 42 * MIN, category: "system", context: "Deploys", icon: icons.rocket, tone: "success" },
    { id: "n3", actor: "Jordan Park", title: "requested access to Revenue dashboard", body: "Needs view access for the board pack.", time: now - 2 * HOUR, category: "assigned", context: "Access requests", actions: [{ id: "approve", label: "Approve", primary: true }, { id: "decline", label: "Decline" }] },
    { id: "n4", actor: "Priya Natarajan", title: "assigned you Fix invoice rounding", time: now - 5 * HOUR, category: "assigned", context: "Billing · BIL-482", href: "#bil-482", read: true },
    { id: "n5", title: "New sign-in from Safari on macOS", body: "Lisbon, Portugal. If this wasn’t you, reset your password.", time: now - DAY - 3 * HOUR, category: "system", context: "Security", icon: icons.shield, tone: "warning", dismissible: true },
    { id: "n6", actor: "Sam Lee", title: "replied to your comment", body: "Agreed – let’s keep the old export until the migration is done.", time: now - DAY - 6 * HOUR, category: "mentions", context: "Data migration", href: "#migration", read: true },
    { id: "n7", title: "Your weekly digest is ready", body: "12 updates across 4 projects.", time: now - 3 * DAY, category: "system", icon: icons.mail, read: true, dismissible: true },
  ];
}

function older(now: number, icons: Record<string, Element>): NotificationItem[] {
  return [
    { id: "o1", actor: "Ines Duarte", title: "shared Brand guidelines 2027 with you", time: now - 9 * DAY, context: "Files", href: "#brand", read: true },
    { id: "o2", title: "Invoice #1042 was paid", body: "€4,820.00 from Acme Logistics.", time: now - 12 * DAY, category: "system", context: "Billing", icon: icons.receipt, tone: "success", read: true },
    { id: "o3", actor: "Maya Chen", title: "mentioned you in Pricing review", time: now - 14 * DAY, category: "mentions", href: "#pricing", read: true },
  ];
}

export default function Demo({ ui }: { ui: typeof UI }) {
  const { Notifications } = ui;
  const now = useRef(Date.now()).current;
  const icons = useMemo(
    () => ({
      rocket: glyph('<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>'),
      shield: glyph('<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/>'),
      mail: glyph('<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>'),
      receipt: glyph('<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>'),
    }),
    [],
  );
  const [items, setItems] = useState<NotificationItem[]>(() => start(now, icons));
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [last, setLast] = useState("");
  const [arrived, setArrived] = useState(false);
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Alex's comment arrives once, a couple of seconds in
  useEffect(() => {
    if (arrived) return;
    const t = window.setTimeout(() => {
      setArrived(true);
      setItems((list) => [{ id: "n0", actor: "Alex Romero", title: "commented on Pricing page copy", body: "The second headline reads better – shipping it with this week’s release.", time: Date.now(), category: "mentions", context: "Website", href: "#pricing-copy" }, ...list]);
    }, 2500);
    return () => clearTimeout(t);
  }, [arrived]);

  const onItemsChange = (next: NotificationItem[], change: NotificationsChange) => {
    setItems(next);
    setLast(change.action === "read-all" ? "Marked all as read" : change.action === "dismiss" ? "Dismissed a notification" : `Marked ${change.ids.length} as ${change.action}`);
  };
  const onAction = (n: NotificationItem, action: string) => {
    setItems((list) => list.map((x) => (x.id === n.id ? { ...x, actions: undefined, read: true, body: action === "approve" ? "You approved view access." : "You declined the request." } : x)));
    setLast(`${action === "approve" ? "Approved" : "Declined"} – ${n.actor}`);
    // Marked read above, with the new body – the component needn't do it as well
    return false;
  };
  const onItemOpen = (n: NotificationItem) => {
    setLast(`Opened “${n.title}”`);
    return false;
  };
  const onLoadMore = () => {
    setLoadingMore(true);
    later(() => {
      setItems((list) => [...list, ...older(now, icons)]);
      setLoadingMore(false);
      setHasMore(false);
    }, 900);
  };
  const reload = () => {
    setError("");
    setLoading(true);
    later(() => {
      setLoading(false);
      setItems(start(now, icons));
      setHasMore(true);
    }, 1200);
  };
  const fail = () => {
    setItems([]);
    setLoading(false);
    setError("The notifications service didn’t respond.");
  };
  const replay = () => {
    timers.current.forEach(clearTimeout);
    setItems(start(now, icons));
    setHasMore(true);
    setLoadingMore(false);
    setLoading(false);
    setError("");
    setArrived(false);
    setLast("");
  };

  const shared = { items, onItemsChange, onAction, onItemOpen, onLoadMore, onRetry: reload, categories: CATEGORIES, hasMore, loadingMore, loading, error, settingsHref: "#notification-settings", now };

  return (
    <div style={{ width: "100%", maxWidth: 720, display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 16, justifyItems: "center" }}>
      <header style={{ ...surface, width: "100%", boxSizing: "border-box", display: "flex", alignItems: "center", gap: 16, height: 52, padding: "0 10px 0 16px", borderRadius: 12 }}>
        <strong style={{ fontSize: 14 }}>Northwind</strong>
        <nav style={{ ...caption, display: "flex", gap: 14, minWidth: 0, overflow: "hidden", fontSize: 13, whiteSpace: "nowrap" }} aria-label="Workspace">
          <span>Projects</span>
          <span>Reports</span>
          <span>Billing</span>
        </nav>
        <span style={{ flex: 1, minWidth: 0 }} />
        <Notifications {...shared} pulse />
        <span aria-hidden="true" style={{ display: "grid", flexShrink: 0, placeItems: "center", width: 28, height: 28, borderRadius: "50%", background: "var(--tc-accent-subtle, light-dark(#e8efff, #1e2a44))", color: "var(--tc-accent-text, light-dark(#2456d6, #8ab4ff))", fontSize: 11, fontWeight: 600 }}>
          JP
        </span>
      </header>
      <Notifications {...shared} inline style={{ ["--tc-notifications-max-height" as string]: "460px" }} />
      <p style={{ ...caption, margin: 0, textAlign: "center" }}>
        {last || (arrived ? "Open the bell, or work through the page" : "A new comment is on its way…")}{" "}
        <button type="button" style={textButton} onClick={reload}>
          Loading
        </button>{" "}
        ·{" "}
        <button type="button" style={textButton} onClick={fail}>
          Error
        </button>{" "}
        ·{" "}
        <button type="button" style={textButton} onClick={() => (setItems([]), setHasMore(false), setError(""))}>
          Empty
        </button>{" "}
        ·{" "}
        <button type="button" style={textButton} onClick={replay}>
          Replay
        </button>
      </p>
    </div>
  );
}
