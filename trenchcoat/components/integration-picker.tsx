"use client";

/*
 * Integration Picker – the integrations page of a command menu, in a single self-contained file.
 * A gray tray holds a white card: search on top, the services grouped into Connected and Available on the left,
 * the picked one on the right – your app and the service on two tiles, what it does, three capabilities and a switch.
 * ↑ ↓ move through the list, ↵ connects or disconnects, Esc clears the search or closes, ← in an empty search goes back,
 * ⌘/ (Ctrl / on Windows) jumps into the search from anywhere – change it or turn it off with `hotkey`.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: integration-picker.tsx is Standard,
 * integration-picker-clean.tsx is Clean). Clean has no tray – one white card with hairline shadows. Its search row
 * on top holds back, where you are and the field; a last row under a hairline says how many are connected and shows
 * the keys. The highlight steps to the picked row, icons are finer and a connected service says so by its domain.
 * Switching a service on or off is announced in a small status region; the switch keeps its name ("Connect X") and
 * says on/off through its state. The rings behind the tiles spread a few times after connecting, then rest.
 */
// Generated from src/components/integration-picker.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ComponentPropsWithoutRef, type KeyboardEvent, type ReactNode, type Ref } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-ip";

export type Integration = {
  id: string;
  name: string;
  /** Shown under the name in the details, e.g. "linear.app" */
  domain: string;
  /** Short label, e.g. "Project management" */
  category: string;
  description: string;
  /** Up to three short capabilities */
  features?: string[];
  /** Brand mark: a single SVG path on a 24 × 24 grid in `color` – or pass your own `icon` */
  path?: string;
  color?: string;
  /** Background of the logo tile – the brand color with a white mark, or white with a colored mark */
  tile?: string;
  icon?: ReactNode;
  /** Starts connected. Read again whenever the flags change (when `connected` isn't passed to the picker) */
  connected?: boolean;
};

export type IntegrationPickerOwnProps = {
  integrations?: Integration[];
  /** Your product's name in the details, e.g. "Trenchcoat + Linear" */
  appName?: string;
  /** Your product's mark on the black tile – the Trenchcoat mark by default */
  appIcon?: ReactNode;
  /** Id of the picked integration. Controlled when defined; otherwise starts at `defaultSelected` */
  selected?: string;
  /** Id of the integration that is picked first */
  defaultSelected?: string;
  onSelectedChange?: (id: string) => void;
  /** Ids of the connected integrations. Controlled when defined; otherwise starts at `defaultConnected`, or at the
   *  integrations marked `connected` (and follows those flags when they change) */
  connected?: string[];
  defaultConnected?: string[];
  onConnectedChange?: (ids: string[]) => void;
  /** The search text. Controlled when defined; otherwise starts at `defaultQuery` */
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  /** Called with the id and the new state when an integration is switched on or off. May return a promise (the
   *  real connect): the switch shows that it's working and flips when it resolves; a rejection leaves it as it was
   *  and says so, to try again. The signal aborts when the picker unmounts */
  onToggle?: (id: string, connected: boolean, options: { signal: AbortSignal }) => void | Promise<unknown>;
  /** Window shortcut that jumps into the search: "mod+/" (⌘/ on Apple devices, Ctrl / elsewhere) by default, any
   *  other combination, or false for none. One listener per shortcut, however many pickers are mounted; the most
   *  recently mounted picker takes it */
  hotkey?: string | false;
  onExplore?: (id: string) => void;
  /** Shows the back button and runs on ← in an empty search */
  onBack?: () => void;
  /** Runs on Esc in an empty search */
  onClose?: () => void;
  /** Visual style. Defaults to the file's look: Standard in integration-picker.tsx, Clean in integration-picker-clean.tsx */
  look?: Look;
  className?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

export type IntegrationPickerProps = Omit<ComponentPropsWithoutRef<"div">, keyof IntegrationPickerOwnProps> & IntegrationPickerOwnProps;

/* Marks in their own colors on dark tiles – Figma and ClickUp keep their multicolor logos */
const FigmaMark = () => (
  <svg viewBox="0 0 38 57" aria-hidden="true">
    <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0Z" fill="#1ABCFE" />
    <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0Z" fill="#0ACF83" />
    <path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19Z" fill="#FF7262" />
    <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5Z" fill="#F24E1E" />
    <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5Z" fill="#A259FF" />
  </svg>
);

function ClickUpMark() {
  const id = "ui-ip-cu" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-a`} x1="0" y1="1" x2="1" y2="0">
          <stop stopColor="#8930FD" />
          <stop offset="1" stopColor="#49CCF9" />
        </linearGradient>
        <linearGradient id={`${id}-b`} x1="0" y1="1" x2="1" y2="0">
          <stop stopColor="#FF02F0" />
          <stop offset="1" stopColor="#FFC800" />
        </linearGradient>
      </defs>
      <path fill={`url(#${id}-a)`} d="M2 18.439l3.69-2.828c1.961 2.56 4.044 3.739 6.363 3.739 2.307 0 4.33-1.166 6.203-3.704L22 18.405C19.298 22.065 15.941 24 12.053 24 8.178 24 4.788 22.078 2 18.439z" />
      <path fill={`url(#${id}-b)`} d="M12.04 6.15l-6.568 5.66-3.036-3.52L12.055 0l9.543 8.296-3.05 3.509z" />
    </svg>
  );
}

/* Airtable in its three colors */
const AirtableMark = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#FCB400" d="M11.992 1.966c-.434 0-.87.086-1.28.257L1.779 5.917c-.503.208-.49.908.012 1.116l8.982 3.558a3.266 3.266 0 0 0 2.454 0l8.982-3.558c.503-.196.503-.908.012-1.116l-8.957-3.694a3.255 3.255 0 0 0-1.272-.257z" />
    <path fill="#18BFFF" d="M23.4 8.056a.589.589 0 0 0-.222.045l-10.012 3.877a.612.612 0 0 0-.38.564v8.896a.6.6 0 0 0 .821.552L23.62 18.1a.583.583 0 0 0 .38-.551V8.653a.6.6 0 0 0-.6-.596z" />
    <path fill="#F82B60" d="M.676 8.095a.644.644 0 0 0-.48.19C.086 8.396 0 8.53 0 8.69v8.355c0 .442.515.737.908.54l6.27-3.006.307-.147 2.969-1.436c.466-.22.43-.908-.061-1.092L.883 8.138a.57.57 0 0 0-.207-.044z" />
  </svg>
);

const CUSTOM: Record<string, () => ReactNode> = { figma: () => <FigmaMark />, clickup: () => <ClickUpMark />, airtable: () => <AirtableMark /> };

/** The Trenchcoat mark (a half-filled circle) – the default for your app's tile */
const APP_MARK = "M53.5 3.5A50 50 0 1 1 53.5 103.5A50 50 0 1 1 53.5 3.5ZM53.5 13.5A40 40 0 1 0 53.5 93.5A40 40 0 1 0 53.5 13.5ZM53.5 13.5A40 40 0 0 0 53.5 93.5Z";

/** Sample services – company marks from Simple Icons (CC0) */
export const defaultIntegrations: Integration[] = [
  {
    id: "linear",
    name: "Linear",
    domain: "linear.app",
    category: "Project management",
    description: "Turn requests from chat into issues and keep their status in sync both ways.",
    features: ["Create issues from any message", "Two-way status sync", "Link issues to customers"], path: "M2.886 4.18A11.982 11.982 0 0 1 11.99 0C18.624 0 24 5.376 24 12.009c0 3.64-1.62 6.903-4.18 9.105L2.887 4.18ZM1.817 5.626l16.556 16.556c-.524.33-1.075.62-1.65.866L.951 7.277c.247-.575.537-1.126.866-1.65ZM.322 9.163l14.515 14.515c-.71.172-1.443.282-2.195.322L0 11.358a12 12 0 0 1 .322-2.195Zm-.17 4.862 9.823 9.824a12.02 12.02 0 0 1-9.824-9.824Z", color: "#ffffff", tile: "#5E6AD2",
    connected: true,
  },
  {
    id: "figma",
    tile: "#ffffff",
    name: "Figma",
    domain: "figma.com",
    category: "Design",
    description: "Preview frames where you talk about them and link designs to their tasks.",
    features: ["Live frame previews", "Comment threads in one place", "Link frames to tasks"],
    connected: false,
  },
  {
    id: "notion",
    name: "Notion",
    domain: "notion.so",
    category: "Docs & wiki",
    description: "Search your workspace while you write and save answers as pages.",
    features: ["Search pages and databases", "Save answers as pages", "Keep docs in sync"], path: "M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z", color: "currentColor", tile: "#ffffff",
    connected: true,
  },
  {
    id: "stripe",
    name: "Stripe",
    domain: "stripe.com",
    category: "Payments",
    description: "See customers, invoices and subscriptions next to every conversation.",
    features: ["Customer and invoice lookup", "Subscription changes as events", "Revenue per account"], path: "M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z", color: "#ffffff", tile: "#635BFF",
    connected: true,
  },
  {
    id: "hubspot",
    name: "HubSpot",
    domain: "hubspot.com",
    category: "CRM",
    description: "Keep contacts and deals current – notes and calls are logged for you.",
    features: ["Sync contacts and companies", "Log activity on deals", "Trigger workflows"], path: "M18.164 7.93V5.084a2.198 2.198 0 001.267-1.978v-.067A2.2 2.2 0 0017.238.845h-.067a2.2 2.2 0 00-2.193 2.193v.067a2.196 2.196 0 001.252 1.973l.013.006v2.852a6.22 6.22 0 00-2.969 1.31l.012-.01-7.828-6.095A2.497 2.497 0 104.3 4.656l-.012.006 7.697 5.991a6.176 6.176 0 00-1.038 3.446c0 1.343.425 2.588 1.147 3.607l-.013-.02-2.342 2.343a1.968 1.968 0 00-.58-.095h-.002a2.033 2.033 0 102.033 2.033 1.978 1.978 0 00-.1-.595l.005.014 2.317-2.317a6.247 6.247 0 104.782-11.134l-.036-.005zm-.964 9.378a3.206 3.206 0 113.215-3.207v.002a3.206 3.206 0 01-3.207 3.207z", color: "#ffffff", tile: "#FF7A59",
    connected: false,
  },
  {
    id: "shopify",
    name: "Shopify",
    domain: "shopify.com",
    category: "Commerce",
    description: "Answer customer questions with the real order, product and stock in view.",
    features: ["Order and refund lookup", "Low-stock alerts", "Product catalog search"], path: "M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z", color: "#ffffff", tile: "#95BF47",
    connected: false,
  },
  {
    id: "airtable",
    name: "Airtable",
    domain: "airtable.com",
    category: "Databases",
    description: "Read and update any base – rows and fields stay linked to your projects.",
    features: ["Read and write records", "Watch views for changes", "Map fields to properties"],
    tile: "#ffffff",
    connected: false,
  },
  {
    id: "webflow",
    name: "Webflow",
    domain: "webflow.com",
    category: "Website",
    description: "Publish CMS items and collect form submissions right from your workspace.",
    features: ["Publish CMS items", "Collect form submissions", "Schedule site updates"], path: "m24 4.515-7.658 14.97H9.149l3.205-6.204h-.144C9.566 16.713 5.621 18.973 0 19.485v-6.118s3.596-.213 5.71-2.435H0V4.515h6.417v5.278l.144-.001 2.622-5.277h4.854v5.244h.144l2.72-5.244H24Z", color: "#ffffff", tile: "#146EF5",
    connected: false,
  },
  {
    id: "vercel",
    name: "Vercel",
    domain: "vercel.com",
    category: "Developer tools",
    description: "Follow deployments, previews and failed builds without switching tabs.",
    features: ["Deployment status", "Preview links in threads", "Build failure alerts"], path: "m12 1.608 12 20.784H0Z", color: "currentColor", tile: "#000000",
    connected: false,
  },
  {
    id: "clickup",
    tile: "#ffffff",
    name: "ClickUp",
    domain: "clickup.com",
    category: "Project management",
    description: "Create tasks, assign owners and track due dates across your spaces.",
    features: ["Create and assign tasks", "Due date reminders", "Sync across spaces"],
    connected: false,
  },
];

/**
 * Three kinds of logo tile: the brand color with a white mark (stays the same in dark mode),
 * a light tile with the colored mark, and an ink tile (black in light mode) – the last two swap in dark mode.
 */
const tone = (item: Integration) => {
  const t = (item.tile ?? "").toLowerCase();
  if (!t || t === "#000" || t === "#000000") return "ink";
  if (t === "#fff" || t === "#ffffff") return "light";
  return "brand";
};
const tileProps = (item: Integration) => {
  const kind = tone(item);
  return { "data-tone": kind, style: kind === "brand" ? ({ "--tc-integration-picker-brand": item.tile } as CSSProperties) : undefined };
};

function Mark({ item }: { item: Integration }) {
  if (item.icon) return <>{item.icon}</>;
  const custom = CUSTOM[item.id];
  if (custom && !item.path) return <>{custom()}</>;
  return (
    <svg viewBox="0 0 24 24" fill={item.color ?? "#fff"} aria-hidden="true">
      <path d={item.path} />
    </svg>
  );
}

/** Apple devices show ⌘ – read in an effect, never during render */
const isApple = () => {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  return /Mac|iPhone|iPad|iOS/i.test(nav.userAgentData?.platform || nav.userAgent);
};

/* ---------- The shortcut's key chip ---------- */

/** The keys of a combination as shown on the key chip: "⌘/", "Ctrl /" */
const comboText = (combo: string, mod: string) =>
  combo
    .split("+")
    .map((p) => p.trim().toLowerCase())
    .map((p) => (p === "mod" ? mod : p === "ctrl" || p === "control" ? "Ctrl" : p === "meta" || p === "cmd" ? "⌘" : p === "shift" ? "⇧" : p === "alt" || p === "option" ? "⌥" : p.toUpperCase()))
    .join(mod === "⌘" ? "" : " ");

const sameIds = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

/* ---------- Parts ---------- */

type ListProps = {
  id: string;
  listRef: { current: HTMLDivElement | null };
  pill: { y: number; h: number } | null;
  groups: { label: string; items: Integration[] }[];
  current?: Integration;
  optionId: (item: Integration) => string;
  query: string;
  onPick: (item: Integration) => void;
};

/** The integrations, connected ones first, with the highlight on the picked row */
function List({ id, listRef, pill, groups, current, optionId, query, onPick }: ListProps) {
  return (
    <div ref={listRef} id={`${id}-list`} className="ui-ip__list" role="listbox" aria-label="Integrations">
      {pill && <span className="ui-ip__pill" style={{ transform: `translateY(${pill.y}px)`, height: pill.h }} aria-hidden="true" />}
      {groups.map((group) => (
        <div key={group.label} role="group" aria-label={group.label} className="ui-ip__group">
          <span className="ui-ip__label">{group.label}</span>
          {group.items.map((item) => (
            <button
              key={item.id}
              id={optionId(item)}
              data-id={item.id}
              type="button"
              role="option"
              aria-selected={item.id === current?.id}
              className="ui-ip__item"
              tabIndex={-1}
              onClick={() => onPick(item)}
            >
              <span className="ui-ip__logo" {...tileProps(item)}>
                <Mark item={item} />
              </span>
              <span className="ui-ip__name">
                <b>{item.name}</b>
                <small>{item.category}</small>
              </span>
            </button>
          ))}
        </div>
      ))}
      {!groups.length && (
        <p className="ui-ip__empty">
          No integrations match <b>“{query}”</b>
        </p>
      )}
    </div>
  );
}

type DetailProps = {
  item?: Integration;
  on: boolean;
  busy: boolean;
  failed: { to: boolean } | null;
  clean: boolean;
  appName: string;
  appIcon?: ReactNode;
  onToggle: () => void;
  onExplore: () => void;
};

/** The picked integration: your app and it, linked – what it does, and the switch. Not a live region: it changes on
 *  every arrow key – the results of switching are announced by the status region instead */
function Detail({ item, on, busy, failed, clean, appName, appIcon, onToggle, onExplore }: DetailProps) {
  return (
    <section className="ui-ip__detail" aria-label={item ? `${item.name} details` : undefined}>
      {item ? (
        <>
          <div className="ui-ip__art" aria-hidden="true">
            <span className="ui-ip__rings">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span className="ui-ip__tile ui-ip__tile--app">
              {appIcon ?? (
                <svg viewBox="0 0 107 107" className="ui-ip__mark" fill="currentColor">
                  <path d={APP_MARK} />
                </svg>
              )}
            </span>
            <span className="ui-ip__link">
              {clean ? (
                <svg viewBox="0 0 16 16">
                  <path d="M2.5 6h10.5M10.5 3.5 13 6l-2.5 2.5M13.5 10H3M5.5 7.5 3 10l2.5 2.5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24">
                  <path d="M4 9h15m-4-4 4 4-4 4M20 15H5m4 4-4-4 4-4" />
                </svg>
              )}
            </span>
            <span key={item.id} className="ui-ip__tile ui-ip__tile--brand" {...tileProps(item)}>
              <Mark item={item} />
            </span>
          </div>

          <div className="ui-ip__info" key={`info-${item.id}`}>
            <div className="ui-ip__title">
              <div>
                <h3>
                  {appName} + {item.name}
                </h3>
                <span className="ui-ip__domain">
                  {item.domain}
                  {clean && on && <span className="ui-ip__state">Connected</span>}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-busy={busy || undefined}
                aria-label={`Connect ${item.name}`}
                className="ui-ip__switch"
                data-pending={busy || undefined}
                onClick={onToggle}
              />
            </div>
            {failed && (
              <p className="ui-ip__error" role="alert">
                Couldn't {failed.to ? "connect" : "disconnect"} {item.name} – try again
              </p>
            )}
            <p className="ui-ip__desc">{item.description}</p>
            {item.features?.length ? (
              <ul className="ui-ip__features">
                {item.features.slice(0, 3).map((f) => (
                  <li key={f}>
                    {clean ? (
                      <svg viewBox="0 0 16 16" aria-hidden="true">
                        <path d="m3.5 8.5 3 3 6-7" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m5 12.5 4.5 4.5L19 7.5" />
                      </svg>
                    )}
                    {f}
                  </li>
                ))}
              </ul>
            ) : null}
            <button type="button" className="ui-ip__explore" onClick={onExplore}>
              Explore integration
              {clean ? (
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M6.5 4 10.5 8l-4 4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              )}
            </button>
          </div>
        </>
      ) : (
        <p className="ui-ip__empty ui-ip__empty--detail">Pick an integration to see what it does</p>
      )}
    </section>
  );
}

/** Standard – the tray: where you are and how many are connected */
function TrayHead({ onBack, count, total }: { onBack?: () => void; count: number; total: number }) {
  return (
    <header className="ui-ip__head">
      {onBack && (
        <button type="button" className="ui-ip__back" aria-label="Back" onClick={onBack}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
      )}
      <span className="ui-ip__crumb">Integrations</span>
      <span className="ui-ip__count">
        {count} of {total} connected
      </span>
    </header>
  );
}

/** Clean – the last row, under a hairline: how many are connected and the keys */
function CleanFoot({ count, total }: { count: number; total: number }) {
  return (
    <footer className="ui-ip__foot">
      <span className="ui-ip__count">
        <i aria-hidden="true" />
        {count} of {total} connected
      </span>
      <span className="ui-ip__hints" aria-hidden="true">
        <kbd>↑</kbd>
        <kbd>↓</kbd>
        <span>to move</span>
        <kbd>↵</kbd>
        <span>to switch</span>
      </span>
    </footer>
  );
}

export function IntegrationPicker({
  integrations = defaultIntegrations,
  appName = "Trenchcoat",
  appIcon,
  selected: selectedProp,
  defaultSelected,
  onSelectedChange,
  connected: connectedProp,
  defaultConnected,
  onConnectedChange,
  query: queryProp,
  defaultQuery = "",
  onQueryChange,
  onToggle,
  onExplore,
  onBack,
  onClose,
  hotkey = "mod+/",
  look,
  className,
  ref,
  ...rest
}: IntegrationPickerProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const clean = resolvedLook === "clean";
  const id = "ui-ip" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const root = useRef<HTMLDivElement>(null);
  const rootRef = useRootRef(root, ref);
  const input = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useControllable(queryProp, defaultQuery, onQueryChange, "query");
  const [selected, setSelected] = useControllable<string | undefined>(
    selectedProp,
    defaultSelected ?? integrations[0]?.id,
    onSelectedChange as ((id: string | undefined) => void) | undefined,
    "selected",
  );

  // Connected ids: the `connected` prop when passed; otherwise kept here – starting at defaultConnected or the
  // integrations' own flags, and following those flags whenever a parent changes them (server data, realtime)
  const flagged = integrations.filter((i) => i.connected).map((i) => i.id);
  const [ownConnected, setOwnConnected] = useState<string[]>(defaultConnected ?? flagged);
  const [lastFlagged, setLastFlagged] = useState(flagged);
  if (!sameIds(flagged, lastFlagged)) {
    setLastFlagged(flagged);
    if (connectedProp === undefined) setOwnConnected(flagged);
  }
  const connectedIds = connectedProp ?? ownConnected;
  const connected = new Set(connectedIds);
  const setConnected = (next: string[]) => {
    if (connectedProp === undefined) setOwnConnected(next);
    onConnectedChange?.(next);
  };
  // A switch whose onToggle returned a promise: still working, or failed (until the next try)
  const [toggling, setToggling] = useState<{ id: string; to: boolean; failed?: boolean } | null>(null);
  // What the status region says: the result of the last switch
  const [announce, setAnnounce] = useState("");
  const runs = useRef(new Set<AbortController>());
  useEffect(() => {
    const live = runs.current;
    return () => {
      live.forEach((c) => c.abort());
      live.clear();
    };
  }, []);

  // "Ctrl" on the server and in the first render, "⌘" once mounted on an Apple device (before paint)
  const [mod, setMod] = useState("Ctrl");
  useLayoutEffect(() => {
    if (isApple()) setMod("⌘");
  }, []);

  // Group membership is taken when the list is opened or searched, so a row doesn't jump away while you switch it
  const [grouped, setGrouped] = useState(connected);
  const [pill, setPill] = useState<{ y: number; h: number } | null>(null);
  // Swap animations only run once the pick has changed – the first render shows everything at once
  const [swapped, setSwapped] = useState(false);
  const firstPick = useRef<string | undefined>(undefined);

  const q = query.trim().toLowerCase();
  // A new search takes the groups again (adjusted while rendering, not in an effect)
  const [groupedFor, setGroupedFor] = useState(q);
  if (groupedFor !== q) {
    setGroupedFor(q);
    setGrouped(connected);
  }
  const matches = useMemo(
    () => integrations.filter((i) => !q || `${i.name} ${i.domain} ${i.category}`.toLowerCase().includes(q)),
    [integrations, q],
  );
  const groups = [
    { label: "Connected", items: matches.filter((i) => grouped.has(i.id)) },
    { label: "Available", items: matches.filter((i) => !grouped.has(i.id)) },
  ].filter((g) => g.items.length);
  const order = groups.flatMap((g) => g.items);
  const current = order.find((i) => i.id === selected) ?? order[0];
  const on = current ? connected.has(current.id) : false;
  // Each row's id from its place in the list – looked up, not searched for every row
  const orderIndex = new Map(order.map((item, i) => [item.id, i]));
  const optionId = (item: Integration) => `${id}-o${orderIndex.get(item.id) ?? -1}`;

  useLayoutEffect(() => {
    if (firstPick.current === undefined) firstPick.current = current?.id;
    else if (current?.id !== firstPick.current) setSwapped(true);
  }, [current?.id]);

  // Keyboard moves keep the picked row in view; clicks never scroll the list or the page
  const byKeyboard = useRef(false);

  // The highlight moves to the picked row (Standard: a gray glide · Clean: a short, crisp step)
  useLayoutEffect(() => {
    const list = listRef.current;
    const currentId = current?.id;
    const row = currentId !== undefined ? list?.querySelector<HTMLElement>(`[data-id="${CSS.escape(currentId)}"]`) : null;
    if (!list || !row) return setPill(null);
    setPill({ y: row.offsetTop, h: row.offsetHeight });
    if (!byKeyboard.current) return;
    byKeyboard.current = false;
    const pad = 8;
    const label = row.previousElementSibling?.classList.contains("ui-ip__label") ? (row.previousElementSibling as HTMLElement).offsetHeight : 0;
    const top = row.offsetTop - pad - label;
    const bottom = row.offsetTop + row.offsetHeight + pad;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }, [current?.id, order.length, groups.length]);

  // ⌘/ or Ctrl+/ (or the chosen hotkey) jumps into the search from anywhere on the page
  useHotkey(hotkey, () => input.current?.focus());

  // The rings only pulse while the picker is on screen
  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => el.toggleAttribute("data-paused", !e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const toggle = (item: Integration) => {
    if (toggling && !toggling.failed) return;
    const next = !connected.has(item.id);
    const apply = (ids: string[]) => setConnected(next ? [...ids.filter((x) => x !== item.id), item.id] : ids.filter((x) => x !== item.id));
    const controller = new AbortController();
    const result = onToggle?.(item.id, next, { signal: controller.signal });
    const done = `${item.name} ${next ? "connected" : "disconnected"}`;
    if (!(result instanceof Promise)) {
      setToggling(null);
      apply(connectedIds);
      setAnnounce(done);
      return;
    }
    setAnnounce(`${next ? "Connecting" : "Disconnecting"} ${item.name}…`);
    runs.current.add(controller);
    setToggling({ id: item.id, to: next });
    result.then(
      () => {
        if (!runs.current.delete(controller)) return;
        setToggling(null);
        apply(latestConnected.current);
        setAnnounce(done);
      },
      () => {
        if (!runs.current.delete(controller)) return;
        setToggling({ id: item.id, to: next, failed: true });
        // The failure is said by the error under the switch (role=alert)
        setAnnounce("");
      },
    );
  };
  // The newest connected ids, for a toggle that settles later
  const latestConnected = useRef(connectedIds);
  useEffect(() => {
    latestConnected.current = connectedIds;
  });
  const busy = !!toggling && !toggling.failed && toggling.id === current?.id;
  const failedHere = toggling?.failed && toggling.id === current?.id ? toggling : null;

  const move = (step: number) => {
    if (!order.length || !current) return;
    byKeyboard.current = true;
    const i = order.findIndex((x) => x.id === current.id);
    setSelected(order[(i + step + order.length) % order.length].id);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Keys typed into an IME (picking a candidate with ↵, moving through it with arrows) belong to the IME
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      move(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Enter" && current) {
      e.preventDefault();
      toggle(current);
    } else if (e.key === "Escape") {
      if (query) setQuery("");
      else onClose?.();
    } else if (e.key === "ArrowLeft" && !query && onBack) {
      e.preventDefault();
      onBack();
    }
  };

  const field = (
    <input
      ref={input}
      value={query}
      placeholder="Search integrations"
      aria-label="Search integrations"
      aria-controls={`${id}-list`}
      aria-activedescendant={current ? optionId(current) : undefined}
      role="combobox"
      aria-expanded="true"
      onChange={(e) => setQuery(e.target.value)}
      onKeyDown={onKeyDown}
    />
  );

  return (
    <div
      {...rest}
      ref={rootRef}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={resolvedLook}
      data-on={on || undefined}
      data-swapped={swapped || undefined}
    >
      {/* React 19 hoists this into <head> once, no matter how many instances render */}
      <style href="ui-integration-picker" precedence="default">
        {css}
      </style>

      {!clean && <TrayHead onBack={onBack} count={connected.size} total={integrations.length} />}

      <div className="ui-ip__card">
        {clean ? (
          // Search row: back, where you are, the field
          <div className="ui-ip__top">
            {onBack ? (
              <button type="button" className="ui-ip__back" aria-label="Back" onClick={onBack}>
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M10 3.5 5.5 8l4.5 4.5" />
                </svg>
              </button>
            ) : (
              <svg viewBox="0 0 16 16" className="ui-ip__lens" aria-hidden="true">
                <circle cx="7.25" cy="7.25" r="4.75" />
                <path d="m13.5 13.5-2.9-2.9" />
              </svg>
            )}
            <label className="ui-ip__search">
              <span className="ui-ip__crumb">Integrations</span>
              {field}
              {hotkey && <kbd className="ui-ip__kbd">{comboText(hotkey, mod)}</kbd>}
            </label>
          </div>
        ) : (
          <label className="ui-ip__search">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            {field}
            {hotkey && <kbd>{comboText(hotkey, mod)}</kbd>}
          </label>
        )}

        <div className="ui-ip__body">
          <List
            id={id}
            listRef={listRef}
            pill={pill}
            groups={groups}
            current={current}
            optionId={optionId}
            query={query}
            onPick={(item) => {
              setSelected(item.id);
              input.current?.focus({ preventScroll: true });
            }}
          />

          <Detail
            item={current}
            on={on}
            busy={busy}
            failed={failedHere}
            clean={clean}
            appName={appName}
            appIcon={appIcon}
            onToggle={() => current && toggle(current)}
            onExplore={() => current && onExplore?.(current.id)}
          />
        </div>

        {clean && <CleanFoot count={connected.size} total={integrations.length} />}
      </div>

      {/* Mounted from the start, so the first result is heard too */}
      <span className="ui-ip__live" role="status">
        {announce}
      </span>
    </div>
  );
}

/* ---------- Shared helpers (inlined from src/internal) ---------- */

// Written as the literal `process.env.NODE_ENV` so bundlers replace it and production builds skip the warning;
// without a bundler `process` doesn't exist and the warning stays off
declare const process: { env: { NODE_ENV?: string } };
const DEV = (() => {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
})();

/**
 * State that a parent may control. `value` defined → controlled: the component shows `value` and only asks for
 * changes through `onChange`. `value` undefined → uncontrolled: the component keeps its own state, starting at
 * `defaultValue`, and still reports changes. Whether `onChange` is passed never decides which – passing a callback
 * for analytics must not freeze the component.
 */
function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void, name?: string) {
  const controlled = value !== undefined;
  // Like React's <input value> without onChange: a controlled value nobody can change is almost always a
  // starting value passed to the wrong prop, so say so once (in development)
  const warned = useRef(false);
  if (controlled && !onChange && !warned.current && DEV) {
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

/** A ref callback that fills `own` and the caller's ref (object or callback, incl. React 19 cleanups) */
function useRootRef<T>(own: { current: T | null }, ref: Ref<T> | undefined) {
  return useCallback(
    (el: T | null) => {
      own.current = el;
      const cleanup = typeof ref === "function" ? ref(el) : (ref && (ref.current = el), undefined);
      return () => {
        own.current = null;
        if (typeof cleanup === "function") cleanup();
        else if (typeof ref === "function") ref(null);
        else if (ref) ref.current = null;
      };
    },
    [own, ref],
  );
}

type Combo = { key: string; mod: boolean; ctrl: boolean; meta: boolean; shift: boolean; alt: boolean };
/** "mod+k", "ctrl+shift+p", "F8" – mod is ⌘ on Apple devices and Ctrl elsewhere */
const parseCombo = (combo: string): Combo => {
  const parts = combo.toLowerCase().split("+").map((p) => p.trim());
  const key = parts.pop() || "+";
  const has = (m: string) => parts.includes(m);
  return { key, mod: has("mod"), ctrl: has("ctrl") || has("control"), meta: has("meta") || has("cmd"), shift: has("shift"), alt: has("alt") || has("option") };
};
const comboMatches = (e: globalThis.KeyboardEvent, c: Combo) => {
  if (e.key.toLowerCase() !== c.key && e.code.toLowerCase() !== c.key) return false;
  if (c.mod ? !(e.metaKey || e.ctrlKey) : (c.ctrl && !e.ctrlKey) || (c.meta && !e.metaKey)) return false;
  if (!c.mod && !c.ctrl && !c.meta && (e.ctrlKey || e.metaKey)) return false;
  return (!c.shift || e.shiftKey) && (!c.alt || e.altKey);
};

/** A handler may return false to say it didn't act – the next one (older instance) gets a turn */
type Handler = () => boolean | void;
type Entry = { handlers: Handler[]; listener: (e: globalThis.KeyboardEvent) => void };
// Kept on globalThis so every published file shares it: two menus from two files still mean one listener
const registry = ((globalThis as { [k: symbol]: Map<string, Entry> })[Symbol.for("trenchcoat.hotkeys")] ??= new Map<string, Entry>());

/**
 * Runs `run` when `combo` is pressed anywhere on the page. `false` registers nothing and never calls preventDefault.
 * The newest instance wins; IME composition and already-handled events are ignored.
 */
function useHotkey(combo: string | false | null | undefined, run: Handler) {
  const latest = useRef(run);
  latest.current = run;
  useEffect(() => {
    if (!combo) return;
    const name = combo.toLowerCase().replace(/\s+/g, "");
    let entry = registry.get(name);
    if (!entry) {
      const parsed = parseCombo(name);
      const handlers: Handler[] = [];
      const listener = (e: globalThis.KeyboardEvent) => {
        if (e.defaultPrevented || e.isComposing || !comboMatches(e, parsed)) return;
        for (let i = handlers.length - 1; i >= 0; i--) {
          if (handlers[i]() !== false) {
            e.preventDefault();
            return;
          }
        }
      };
      window.addEventListener("keydown", listener);
      registry.set(name, (entry = { handlers, listener }));
    }
    const own = entry;
    const handler: Handler = () => latest.current();
    own.handlers.push(handler);
    return () => {
      own.handlers.splice(own.handlers.indexOf(handler), 1);
      if (!own.handlers.length) {
        window.removeEventListener("keydown", own.listener);
        registry.delete(name);
      }
    };
  }, [combo]);
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
.ui-ip:where([data-look="standard"]),
.ui-ip__portal:where([data-look="standard"]) {
  --_tc-accent: #2f68ff;
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-action-secondary-bg: light-dark(#ffffff, #232326);
  --_tc-action-secondary-fg: light-dark(#171717, #ededed);
  --_tc-action-secondary-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-caption-color: light-dark(#646464, #9a9aa1);
  --_tc-caption-font-size: 12px;
  --_tc-caption-font-weight: 500;
  --_tc-caption-line-height: 16px;
  --_tc-caption-tracking: 0;
  --_tc-caption-transform: none;
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 32px;
  --_tc-control-h-sm: 28px;
  --_tc-control-px-md: 12px;
  --_tc-control-radius-md: 10px;
  --_tc-control-radius-sm: 8px;
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring: light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-strong: 600;
  --_tc-hairline: 1px;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-kbd-bg: light-dark(#ffffff, #19191b);
  --_tc-kbd-fg: light-dark(#404040, #c8c8cc);
  --_tc-kbd-font-size: 10.5px;
  --_tc-kbd-font-weight: 500;
  --_tc-kbd-h: 18px;
  --_tc-kbd-px: 4px;
  --_tc-kbd-radius: 5px;
  --_tc-kbd-shadow: inset 0 0 0 1px light-dark(#dedede, #3a3a40), 0 1px 0 light-dark(#ececec, #2a2a2e);
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 20px;
  --_tc-pill-px: 8px;
  --_tc-pill-radius: 999px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-badge: 999px;
  --_tc-radius-full: 999px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-shadow-control: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-space-4-5: 18px;
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-bg: light-dark(#e6f6ec, #12301f);
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-success-solid: light-dark(#1f8a4c, #3ec27a);
  --_tc-surface-inverse: light-dark(#171717, #ededed);
  --_tc-surface-on-tray: light-dark(#ffffff, #232326);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-tray: light-dark(#f0f0f0, #19191b);
  --_tc-switch-h: 20px;
  --_tc-switch-knob: 16px;
  --_tc-switch-knob-bg: #ffffff;
  --_tc-switch-off: light-dark(#858585, #7c7c82);
  --_tc-switch-on: #2f68ff;
  --_tc-switch-radius: 999px;
  --_tc-switch-w: 32px;
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-on-inverse: light-dark(#ffffff, #111113);
  --_tc-text-placeholder: light-dark(#646464, #8e8e95);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-tracking-snug: -0.01em;
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
}
.ui-ip:where([data-look="clean"]),
.ui-ip__portal:where([data-look="clean"]) {
  --_tc-accent: light-dark(#0060e2, #1a6cf0);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-action-secondary-bg: light-dark(#ffffff, #252527);
  --_tc-action-secondary-fg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-action-secondary-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-caption-color: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-caption-font-size: 10px;
  --_tc-caption-font-weight: 500;
  --_tc-caption-line-height: 16px;
  --_tc-caption-tracking: 0.05em;
  --_tc-caption-transform: uppercase;
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 28px;
  --_tc-control-h-sm: 24px;
  --_tc-control-px-md: 10px;
  --_tc-control-radius-md: 6px;
  --_tc-control-radius-sm: 6px;
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring: light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-strong: 500;
  --_tc-hairline: 0.5px;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-kbd-bg: light-dark(#ffffff, #1c1c1e);
  --_tc-kbd-fg: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-kbd-font-size: 10px;
  --_tc-kbd-font-weight: 500;
  --_tc-kbd-h: 16px;
  --_tc-kbd-px: 4px;
  --_tc-kbd-radius: 4px;
  --_tc-kbd-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 18px;
  --_tc-pill-px: 6px;
  --_tc-pill-radius: 5px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-badge: 5px;
  --_tc-radius-full: 999px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-shadow-control: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-space-4-5: 18px;
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-bg: light-dark(rgba(0, 164, 51, 0.1), rgba(0, 240, 74, 0.12));
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-success-solid: light-dark(#1f8a4c, #3ec27a);
  --_tc-surface-inverse: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-surface-on-tray: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-tray: light-dark(#f7f7f7, #161618);
  --_tc-switch-h: 16px;
  --_tc-switch-knob: 12px;
  --_tc-switch-knob-bg: #ffffff;
  --_tc-switch-off: light-dark(rgba(0, 0, 0, 0.48), rgba(255, 255, 255, 0.4));
  --_tc-switch-on: light-dark(#0060e2, #1a6cf0);
  --_tc-switch-radius: 5px;
  --_tc-switch-w: 28px;
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-on-inverse: light-dark(#fcfcfc, #161618);
  --_tc-text-placeholder: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.5));
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
  --_tc-tracking-snug: -0.01em;
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(10px + 4px);
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }
@media (forced-colors: active) {
  :where([data-look], [data-look] *):not(#tc-fc):is(button, [role="button"], [role="switch"], [role="combobox"], [role="checkbox"], [role="radio"], input:not([type="hidden"]), select, textarea):not([role="option"], [role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"], [role="tab"], [role="treeitem"], [role="gridcell"], [role="row"]) { border: 1px solid ButtonText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is(input, select, textarea) { border-color: FieldText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is([role="listbox"], [role="menu"], [role="dialog"], [role="tooltip"], [role="tablist"], [role="radiogroup"]) { outline: 1px solid CanvasText; }
  :where([data-look], [data-look] *):not(#tc-fc):is([aria-selected="true"], [aria-pressed="true"], [aria-checked="true"], [aria-current]:not([aria-current="false"])) { forced-color-adjust: none; background: Highlight !important; color: HighlightText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is([aria-selected="true"], [aria-pressed="true"], [aria-checked="true"], [aria-current]:not([aria-current="false"])) * { color: HighlightText !important; background: none !important; }
  :where([data-look], [data-look] *):not(#tc-fc)[role="switch"] span:empty { background: ButtonText !important; }
  :where([data-look], [data-look] *):not(#tc-fc)[role="switch"][aria-checked="true"] span:empty { background: HighlightText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is(:disabled, [aria-disabled="true"]) { color: GrayText !important; border-color: GrayText !important; }
}

/* Colors and motion as variables – override them on .ui-ip */
.ui-ip {
  /* Illustration art: your app's black tile and the rings behind the tiles */
  --tc-integration-picker-app-bg: #000000;
  --tc-integration-picker-app-fg: #ffffff;
  --tc-integration-picker-ring-border: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.07));
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  width: 100%;
  max-width: 660px;
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  -webkit-font-smoothing: antialiased;
}
/* A tray around the card: where you are and how many are connected */
:where([data-look="standard"], [data-look="standard"] *).ui-ip {
  --tc-integration-picker-app-ring: light-dark(rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.14));
  --tc-integration-picker-tile-shadow: 0 12px 14px -10px light-dark(rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.6));
  grid-template-rows: auto auto;
  padding: 0 var(--tc-tray-inset, var(--_tc-tray-inset)) var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  background: var(--tc-surface-tray, var(--_tc-surface-tray));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
:where([data-look="clean"], [data-look="clean"] *).ui-ip {
  --tc-integration-picker-app-ring: light-dark(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.14));
  --tc-integration-picker-tile-shadow: 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 8px 16px -8px light-dark(rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.6));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
.ui-ip *, .ui-ip *::before, .ui-ip *::after { box-sizing: border-box; }
/* Low-priority reset, so the parts below can set their own margins and colors */
:where(.ui-ip) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where(.ui-ip) svg { display: block; flex: none; }
.ui-ip button:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
.ui-ip__live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__head { display: flex; align-items: center; gap: var(--tc-space-2, var(--_tc-space-2)); height: 40px; padding: 0 var(--tc-space-2-5, var(--_tc-space-2-5)) 0 var(--tc-space-3, var(--_tc-space-3)); }
/* Back: a square ghost button */
.ui-ip__back { display: grid; place-items: center; flex: none; border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm)); color: var(--tc-icon-muted, var(--_tc-icon-muted)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-ip__back:hover { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__back { width: var(--tc-control-h-sm, var(--_tc-control-h-sm)); height: var(--tc-control-h-sm, var(--_tc-control-h-sm)); margin-left: -4px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__back svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__back { width: var(--tc-control-h-md, var(--_tc-control-h-md)); height: var(--tc-control-h-md, var(--_tc-control-h-md)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__crumb { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__count { margin-left: auto; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
/* The card */
.ui-ip__card { display: grid; min-height: 0; overflow: hidden; border-radius: var(--tc-card-radius, var(--_tc-card-radius)); box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__card { grid-template-rows: auto minmax(0, 1fr); background: var(--tc-surface-on-tray, var(--_tc-surface-on-tray)); }
/* Clean: one card – search row, list and details, the last row */
:where([data-look="clean"], [data-look="clean"] *).ui-ip__card { grid-template-rows: auto minmax(0, 1fr) auto; background: var(--tc-surface-raised, var(--_tc-surface-raised)); }
/* Search. No box of its own: the whole search row shows the focus ring while the field has focus */
.ui-ip__search { cursor: text; }
.ui-ip__search input { flex: 1; min-width: 0; padding: 0; border: 0; background: transparent; font: inherit; color: var(--tc-text-primary, var(--_tc-text-primary)); caret-color: var(--tc-accent, var(--_tc-accent)); outline: none; }
.ui-ip__search input::placeholder { color: var(--tc-text-placeholder, var(--_tc-text-placeholder)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__search { display: flex; align-items: center; gap: var(--tc-space-2-5, var(--_tc-space-2-5)); height: 46px; padding: 0 var(--tc-space-3-5, var(--_tc-space-3-5)); border-bottom: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__search > svg { width: 17px; height: 17px; fill: none; stroke: var(--tc-icon-muted, var(--_tc-icon-muted)); stroke-width: 1.8; stroke-linecap: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__search input { font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__search:focus-within,
:where([data-look="clean"], [data-look="clean"] *).ui-ip__top:has(.ui-ip__search:focus-within) { border-radius: var(--tc-card-radius, var(--_tc-card-radius)) var(--tc-card-radius, var(--_tc-card-radius)) 0 0; outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: calc(-1 * var(--tc-focus-ring-width, var(--_tc-focus-ring-width))); }
/* Search row: back, where you are, the field */
:where([data-look="clean"], [data-look="clean"] *).ui-ip__top { display: flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); height: 48px; padding: 0 var(--tc-space-3, var(--_tc-space-3)) 0 var(--tc-space-2-5, var(--_tc-space-2-5)); border-bottom: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__back svg, :where([data-look="clean"], [data-look="clean"] *).ui-ip__lens { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.1; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__lens { margin: 0 var(--tc-space-1, var(--_tc-space-1)) 0 var(--tc-space-1-5, var(--_tc-space-1-5)); color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__search { display: flex; flex: 1; align-items: center; gap: var(--tc-space-2, var(--_tc-space-2)); min-width: 0; height: 100%; }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__crumb { flex: none; padding: var(--tc-space-0-5, var(--_tc-space-0-5)) var(--tc-space-1-5, var(--_tc-space-1-5)); border-radius: var(--tc-radius-badge, var(--_tc-radius-badge)); background: var(--tc-fill-default, var(--_tc-fill-default)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__search input { height: 20px; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); }
/* Key chips: the shortcut in the search, the hints in Clean's last row */
.ui-ip kbd {
  display: inline-grid;
  place-items: center;
  flex: none;
  min-width: var(--tc-kbd-h, var(--_tc-kbd-h));
  height: var(--tc-kbd-h, var(--_tc-kbd-h));
  padding: 0 var(--tc-kbd-px, var(--_tc-kbd-px));
  border-radius: var(--tc-kbd-radius, var(--_tc-kbd-radius));
  background: var(--tc-kbd-bg, var(--_tc-kbd-bg));
  box-shadow: var(--tc-kbd-shadow, var(--_tc-kbd-shadow));
  font-family: inherit;
  font-size: var(--tc-kbd-font-size, var(--_tc-kbd-font-size));
  font-weight: var(--tc-kbd-font-weight, var(--_tc-kbd-font-weight));
  line-height: var(--tc-kbd-h, var(--_tc-kbd-h));
  color: var(--tc-kbd-fg, var(--_tc-kbd-fg));
}
/* Body: list on the left, the picked integration on the right. At least this tall on wide layouts, so the picker
   doesn't jump while you browse; it grows when the details need more room (large text, zoom) – the list scrolls */
.ui-ip__body { display: grid; grid-template-columns: minmax(0, 0.85fr) minmax(0, 1.15fr); }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__body { min-height: 350px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__body { min-height: 356px; }
/* contain: size – the list takes the body's height instead of setting it */
.ui-ip__list { position: relative; contain: size; overflow-y: auto; border-right: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); scrollbar-width: thin; }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__list { padding: var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2-5, var(--_tc-space-2-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__list { padding: 0 var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-1, var(--_tc-space-1)); }
.ui-ip__group { display: flex; flex-direction: column; }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__group { gap: var(--tc-space-0-5, var(--_tc-space-0-5)); }
.ui-ip__label {
  padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-1, var(--_tc-space-1));
  font-size: var(--tc-caption-font-size, var(--_tc-caption-font-size));
  font-weight: var(--tc-caption-font-weight, var(--_tc-caption-font-weight));
  line-height: var(--tc-caption-line-height, var(--_tc-caption-line-height));
  letter-spacing: var(--tc-caption-tracking, var(--_tc-caption-tracking));
  text-transform: var(--tc-caption-transform, var(--_tc-caption-transform));
  color: var(--tc-caption-color, var(--_tc-caption-color));
}
:where([data-look="standard"], [data-look="standard"] *).ui-ip__label { padding-bottom: var(--tc-space-1-5, var(--_tc-space-1-5)); }
/* The picked row (Standard: a gray glide · Clean: a short, crisp step). While the search has focus – ↑ ↓ move it,
   ↵ switches it – it also shows the focus ring */
.ui-ip__pill { position: absolute; top: 0; transition: transform var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)), height var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__pill { left: 8px; right: 8px; border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); background: var(--tc-fill-hover, var(--_tc-fill-hover)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__pill { left: 4px; right: 4px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); background: var(--tc-fill-default, var(--_tc-fill-default)); transition-duration: var(--tc-duration-instant, var(--_tc-duration-instant)), var(--tc-duration-instant, var(--_tc-duration-instant)), var(--tc-duration-fast, var(--_tc-duration-fast)); }
.ui-ip:has(.ui-ip__search input:focus-visible) .ui-ip__pill { box-shadow: inset 0 0 0 var(--tc-focus-ring-width, var(--_tc-focus-ring-width)) var(--tc-focus-ring, var(--_tc-focus-ring)); }
.ui-ip__item { position: relative; display: flex; flex: none; align-items: center; gap: var(--tc-space-2-5, var(--_tc-space-2-5)); padding: 0 var(--tc-space-2, var(--_tc-space-2)); text-align: left; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__item { height: 42px; border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__item:not([aria-selected="true"]):hover { background: var(--tc-fill-hover, var(--_tc-fill-hover)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__item { height: 44px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__item:not([aria-selected="true"]):hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
.ui-ip__name { display: grid; min-width: 0; }
.ui-ip__name b, .ui-ip__name small { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-ip__name b { color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-ip__name small { color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__name { line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__name b { font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__name small { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__name b { font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__name small { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); }
/* Logo tiles: brand color with a white mark · light with the colored mark · ink, the reverse of the page. Each has
   an edge, so a light tile doesn't glare in dark mode */
.ui-ip__logo { display: grid; place-items: center; flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__logo { width: 28px; height: 28px; border-radius: var(--tc-radius-md, var(--_tc-radius-md)); box-shadow: inset 0 0 0 1px var(--tc-integration-picker-logo-ring), var(--tc-shadow-control, var(--_tc-shadow-control)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__logo { width: 24px; height: 24px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); box-shadow: 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-integration-picker-logo-ring), var(--tc-shadow-control, var(--_tc-shadow-control)); }
:is(.ui-ip__logo, .ui-ip__tile--brand)[data-tone="brand"] { background: var(--tc-integration-picker-brand); color: #fff; }
:is(.ui-ip__logo, .ui-ip__tile--brand)[data-tone="light"] { --tc-integration-picker-logo-ring: var(--tc-border-default, var(--_tc-border-default)); background: var(--tc-fill-default, var(--_tc-fill-default)); }
:where([data-look="standard"], [data-look="standard"] *):is(.ui-ip__logo, .ui-ip__tile--brand)[data-tone="brand"] { --tc-integration-picker-logo-ring: rgba(255, 255, 255, 0.14); }
:where([data-look="standard"], [data-look="standard"] *):is(.ui-ip__logo, .ui-ip__tile--brand)[data-tone="light"] { color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *):is(.ui-ip__logo, .ui-ip__tile--brand)[data-tone="ink"] { --tc-integration-picker-logo-ring: rgba(255, 255, 255, 0.1); background: var(--tc-surface-inverse, var(--_tc-surface-inverse)); color: var(--tc-text-on-inverse, var(--_tc-text-on-inverse)); }
:where([data-look="clean"], [data-look="clean"] *):is(.ui-ip__logo, .ui-ip__tile--brand)[data-tone="brand"] { --tc-integration-picker-logo-ring: rgba(0, 0, 0, 0.06); }
:where([data-look="clean"], [data-look="clean"] *):is(.ui-ip__logo, .ui-ip__tile--brand)[data-tone="light"] { color: var(--tc-text-strong, var(--_tc-text-strong)); }
:where([data-look="clean"], [data-look="clean"] *):is(.ui-ip__logo, .ui-ip__tile--brand)[data-tone="ink"] { --tc-integration-picker-logo-ring: rgba(0, 0, 0, 0.06); background: var(--tc-text-strong, var(--_tc-text-strong)); color: var(--tc-text-on-inverse, var(--_tc-text-on-inverse)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__logo svg { width: 14px; height: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__logo svg { width: 13px; height: 13px; }
.ui-ip__empty { margin: 0; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__empty { padding: var(--tc-space-4-5, var(--_tc-space-4-5)) var(--tc-space-2-5, var(--_tc-space-2-5)); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__empty { padding: var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-2, var(--_tc-space-2)); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); }
.ui-ip__empty b { font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-ip__empty--detail { display: grid; place-items: center; height: 100%; }
.ui-ip__detail { display: flex; flex-direction: column; min-height: 0; }
/* Illustration: your app and the service on two tiles, rings behind them */
.ui-ip__art { position: relative; display: flex; flex: none; align-items: center; justify-content: center; height: 104px; overflow: hidden; margin: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2, var(--_tc-space-2)) 0; background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-border-default, var(--_tc-border-default)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__art { gap: var(--tc-space-4-5, var(--_tc-space-4-5)); border-radius: var(--tc-radius-xl, var(--_tc-radius-xl)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__art { gap: var(--tc-space-4, var(--_tc-space-4)); border-radius: var(--tc-radius-md, var(--_tc-radius-md)); }
.ui-ip__rings { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; }
.ui-ip__rings i { position: absolute; width: calc(90px + var(--tc-integration-picker-n, 0) * 56px); aspect-ratio: 1; border-radius: var(--tc-radius-full, var(--_tc-radius-full)); box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-integration-picker-ring-border); }
.ui-ip__rings i:nth-child(2) { --tc-integration-picker-n: 1; }
.ui-ip__rings i:nth-child(3) { --tc-integration-picker-n: 2; }
/* One ring spreads out from the middle a few times after connecting, then rests (decorative – 2.2.2) */
.ui-ip__rings i:nth-child(4) { opacity: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__rings i:nth-child(4) { box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-accent, var(--_tc-accent)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ip[data-on] .ui-ip__rings i:nth-child(4) { animation: ui-ip-spread var(--tc-integration-picker-spread) var(--tc-ease-out, var(--_tc-ease-out)) 3; }
:where([data-look="clean"], [data-look="clean"] *).ui-ip[data-on] .ui-ip__rings i:nth-child(4) { animation: ui-ip-spread-clean var(--tc-integration-picker-spread) var(--tc-ease-out, var(--_tc-ease-out)) 3; }
.ui-ip { --tc-integration-picker-spread: 2800ms; }
.ui-ip[data-paused] .ui-ip__rings i { animation-play-state: paused; }
@keyframes ui-ip-spread {
  0% { opacity: 0.9; transform: scale(0.9); }
  100% { opacity: 0; transform: scale(2.6); }
}
@keyframes ui-ip-spread-clean {
  0% { opacity: 0.5; transform: scale(0.9); }
  100% { opacity: 0; transform: scale(2.6); }
}
.ui-ip__tile { position: relative; z-index: 1; display: grid; place-items: center; }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__tile { width: 46px; height: 46px; border-radius: var(--tc-radius-xl, var(--_tc-radius-xl)); box-shadow: inset 0 0 0 1px var(--tc-integration-picker-logo-ring), var(--tc-integration-picker-tile-shadow); }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__tile svg { width: 22px; height: 22px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__tile--app { box-shadow: inset 0 0 0 1px var(--tc-integration-picker-app-ring), var(--tc-integration-picker-tile-shadow); }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__tile--app .ui-ip__mark { width: 20px; height: 20px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__tile { width: 44px; height: 44px; border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); box-shadow: 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-integration-picker-logo-ring), var(--tc-integration-picker-tile-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__tile svg { width: 20px; height: 20px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__tile--app { box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-integration-picker-app-ring), var(--tc-integration-picker-tile-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__tile--app .ui-ip__mark { width: 18px; height: 18px; }
.ui-ip__tile--app { background: var(--tc-integration-picker-app-bg); color: var(--tc-integration-picker-app-fg); }
.ui-ip[data-swapped] .ui-ip__tile--brand { animation: ui-ip-swap var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)); }
@keyframes ui-ip-swap {
  from { opacity: 0; transform: translateY(6px) scale(0.92); filter: blur(4px); }
  to { opacity: 1; transform: none; filter: none; }
}
.ui-ip__link { position: relative; z-index: 1; display: grid; place-items: center; color: var(--tc-icon-muted, var(--_tc-icon-muted)); transition: color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-move, var(--_tc-ease-move)); }
.ui-ip__link svg { fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__link { width: 30px; height: 30px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__link svg { width: 20px; height: 20px; stroke-width: 1.8; }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__link { width: 28px; height: 28px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__link svg { width: 16px; height: 16px; stroke-width: 1.1; }
/* Connected: the arrows turn once and take the accent color */
.ui-ip[data-on] .ui-ip__link { color: var(--tc-accent, var(--_tc-accent)); transform: rotate(180deg); }
/* Details */
.ui-ip__info { display: flex; flex: 1; flex-direction: column; }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__info { padding: var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-3-5, var(--_tc-space-3-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__info { padding: var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-4, var(--_tc-space-4)); }
.ui-ip[data-swapped] .ui-ip__info { animation: ui-ip-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); }
@keyframes ui-ip-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
.ui-ip__title { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--tc-space-3, var(--_tc-space-3)); }
.ui-ip__title > div { display: grid; min-width: 0; }
.ui-ip__title h3 { margin: 0; overflow: hidden; font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus)); font-weight: var(--tc-font-weight-strong, var(--_tc-font-weight-strong)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__title h3 { line-height: var(--tc-line-height-relaxed, var(--_tc-line-height-relaxed)); letter-spacing: var(--tc-tracking-snug, var(--_tc-tracking-snug)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__title h3 { line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
.ui-ip__domain { color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__domain { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__domain { display: flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); min-width: 0; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); }
/* "Connected": a small success tag */
:where([data-look="clean"], [data-look="clean"] *).ui-ip__state { display: inline-flex; align-items: center; height: var(--tc-pill-h, var(--_tc-pill-h)); padding: 0 var(--tc-pill-px, var(--_tc-pill-px)); border-radius: var(--tc-pill-radius, var(--_tc-pill-radius)); background: var(--tc-status-success-bg, var(--_tc-status-success-bg)); font-size: var(--tc-pill-font-size, var(--_tc-pill-font-size)); font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); animation: ui-ip-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)); }
.ui-ip__desc { margin: var(--tc-space-2, var(--_tc-space-2)) 0 0; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__desc { line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__desc { line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); }
.ui-ip__features { display: grid; margin: var(--tc-space-2-5, var(--_tc-space-2-5)) 0 0; padding: 0; list-style: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__features { gap: var(--tc-space-1, var(--_tc-space-1)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__features { gap: var(--tc-space-0-5, var(--_tc-space-0-5)); }
.ui-ip__features li { display: flex; align-items: center; }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__features li { gap: var(--tc-space-2, var(--_tc-space-2)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__features li { gap: var(--tc-space-2, var(--_tc-space-2)); min-width: 0; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
.ui-ip__features svg { fill: none; stroke: var(--tc-icon-muted, var(--_tc-icon-muted)); stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__features svg { width: 13px; height: 13px; stroke-width: 2.2; }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__features svg { width: 16px; height: 16px; stroke-width: 1.1; }
/* The switch: the off track is the control border (≥ 3:1), on is the accent; the target is at least 24px tall */
.ui-ip__switch { position: relative; flex: none; width: var(--tc-switch-w, var(--_tc-switch-w)); height: var(--tc-switch-h, var(--_tc-switch-h)); border-radius: var(--tc-switch-radius, var(--_tc-switch-radius)); background: var(--tc-switch-off, var(--_tc-switch-off)); transition: background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__switch { margin-top: 1px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__switch { margin-top: var(--tc-space-1, var(--_tc-space-1)); }
.ui-ip__switch::before { content: ""; position: absolute; top: 50%; left: 50%; width: max(100%, 24px); height: max(100%, 24px); transform: translate(-50%, -50%); }
.ui-ip__switch::after {
  content: "";
  position: absolute;
  top: calc((var(--tc-switch-h, var(--_tc-switch-h)) - var(--tc-switch-knob, var(--_tc-switch-knob))) / 2);
  left: calc((var(--tc-switch-h, var(--_tc-switch-h)) - var(--tc-switch-knob, var(--_tc-switch-knob))) / 2);
  width: var(--tc-switch-knob, var(--_tc-switch-knob));
  height: var(--tc-switch-knob, var(--_tc-switch-knob));
  border-radius: calc(var(--tc-switch-radius, var(--_tc-switch-radius)) - (var(--tc-switch-h, var(--_tc-switch-h)) - var(--tc-switch-knob, var(--_tc-switch-knob))) / 2);
  background: var(--tc-switch-knob-bg, var(--_tc-switch-knob-bg));
  box-shadow: var(--tc-shadow-control, var(--_tc-shadow-control));
  transition: transform var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move));
}
.ui-ip__switch[aria-checked="true"] { background: var(--tc-switch-on, var(--_tc-switch-on)); }
.ui-ip__switch[aria-checked="true"]::after { transform: translateX(calc(var(--tc-switch-w, var(--_tc-switch-w)) - var(--tc-switch-h, var(--_tc-switch-h)))); }
.ui-ip__switch[data-pending] { opacity: 0.6; cursor: progress; }
.ui-ip__error { margin: var(--tc-space-2, var(--_tc-space-2)) 0 0; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
/* Explore: a secondary button, like Button */
.ui-ip__explore {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--tc-space-1, var(--_tc-space-1));
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  margin-top: auto;
  padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md));
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg));
  box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow));
  font-size: var(--tc-control-font-size, var(--_tc-control-font-size));
  font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg));
  transition: box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-ip__explore:hover { box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__explore { align-self: flex-start; padding-right: calc(var(--tc-control-px-md, var(--_tc-control-px-md)) - 4px); }
.ui-ip__explore svg { fill: none; stroke-linecap: round; stroke-linejoin: round; transition: transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__explore svg { width: 15px; height: 15px; stroke: var(--tc-icon-muted, var(--_tc-icon-muted)); stroke-width: 2; }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__explore svg { width: 16px; height: 16px; stroke: var(--tc-icon-muted, var(--_tc-icon-muted)); stroke-width: 1.1; }
.ui-ip__explore:hover svg { transform: translateX(2px); }
/* The button sits at the bottom, at least 16px below the text */
.ui-ip__info > :nth-last-child(2) { margin-bottom: var(--tc-space-4, var(--_tc-space-4)); }
/* Clean: the last row of the card */
:where([data-look="clean"], [data-look="clean"] *).ui-ip__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3, var(--_tc-space-3)); height: 40px; padding: 0 var(--tc-space-3, var(--_tc-space-3)); border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__count { display: inline-flex; align-items: center; gap: var(--tc-space-2, var(--_tc-space-2)); min-width: 0; white-space: nowrap; font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__count i { width: 6px; height: 6px; border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); background: var(--tc-status-success-solid, var(--_tc-status-success-solid)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__hints { display: inline-flex; align-items: center; gap: var(--tc-space-0-5, var(--_tc-space-0-5)); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__hints span { margin: 0 var(--tc-space-2, var(--_tc-space-2)) 0 var(--tc-space-1, var(--_tc-space-1)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__hints span:last-child { margin-right: 0; }
/* Narrow (phones): list on top in a short scrolling area, details below; the whole picker grows with its content */
@container (max-width: 560px) {
  .ui-ip__body { grid-template-columns: minmax(0, 1fr); min-height: 0; }
  .ui-ip__list { contain: none; max-height: 196px; border-right: 0; border-bottom: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
  .ui-ip__art { height: 88px; }
  .ui-ip__info > :nth-last-child(2) { margin-bottom: var(--tc-space-3-5, var(--_tc-space-3-5)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__count { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__hints { display: none; }
}
@container (max-width: 400px) {
  .ui-ip__features { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-ip__search kbd { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__kbd { display: none; }
}
/* Touch screens: taller targets */
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-ip__top { height: 52px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__back { width: 32px; height: 32px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__item { height: 48px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ip__explore { height: 32px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-ip *, .ui-ip *::before, .ui-ip *::after { animation: none !important; transition: none !important; }
}
`;
