/*
 * <tc-mcp-connection-manager> in real browsers: rows at a glance, connect / cancel / retry / disconnect, inspecting
 * tools, resources and prompts (tabs), adding a server (transport, auth, test), the remove dialog with its focus, the
 * form, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/mcp-connection-manager";
import type { McpConnectEvent, McpConnection, McpServer, McpTestEvent, McpValueChange, TcMcpConnectionManager } from "../../src/elements/mcp-connection-manager";
import { McpConnectionManager } from "../../src/elements/react/mcp-connection-manager";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const SERVERS: McpServer[] = [
  { id: "gh", name: "GitHub", transport: "http", target: "https://mcp.example.com/gh", auth: "token", credentialRef: "vault/gh" },
  { id: "db", name: "Database", transport: "stdio", target: "npx db-server", auth: "none" },
  { id: "docs", name: "Docs", transport: "sse", target: "https://docs.example.com/sse", auth: "none" },
];
const GH: McpConnection = {
  status: "connected",
  at: "08:58",
  tools: [
    { name: "search_issues", description: "Find issues" },
    { name: "create_issue", description: "Open an issue" },
    { name: "list_commits" },
    { name: "get_pr" },
    { name: "review" },
  ],
  resources: [{ name: "README", uri: "repo://a/README.md" }],
  prompts: [],
};
const CONNECTIONS: Record<string, McpConnection> = { gh: GH, docs: { status: "failed", at: "09:12", message: "401 – token rejected" } };
const CREDENTIALS = [{ id: "vault/gh", label: "GitHub token", hint: "9f1c" }];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const on = (el: Element, name: string, fn: (e: CustomEvent<any>) => void) => el.addEventListener(name, fn as EventListener);
const mount = (look: "standard" | "clean" = "standard") =>
  fixture<TcMcpConnectionManager>(html`<tc-mcp-connection-manager look=${look} .value=${SERVERS} .connections=${CONNECTIONS} .credentials=${CREDENTIALS}></tc-mcp-connection-manager>`);
const $ = <T extends Element = HTMLElement>(el: Element, sel: string) => el.querySelector<T>(sel)!;
const row = (el: Element, i: number) => el.querySelectorAll<HTMLElement>(".ui-mcs__server")[i];
const action = (el: Element, id: string) => $<HTMLButtonElement>(el, `[data-focus-key="action:${id}"]`);
const inspect = (el: Element, id: string) => $<HTMLButtonElement>(el, `[data-focus-key="inspect:${id}"]`);
const status = (el: Element) => $(el, '[role="status"]').textContent;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const twice = async () => {
  await settle();
  await settle();
};
const input = (field: HTMLInputElement, value: string) => {
  field.value = value;
  field.dispatchEvent(new Event("input", { bubbles: true }));
};

describe("tc-mcp-connection-manager", () => {
  for (const look of ["standard", "clean"] as const)
    test(`${look}: the host, and each server's status and what it exposes at a glance`, async () => {
      const el = await mount(look);
      expect(el.dataset.ui).toBe("mcs");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("group");
      expect(el.getAttribute("aria-label")).toBe("MCP servers");
      // The header first (on the tray in Standard, the card's first row in Clean), the pill at its right
      expect(el.querySelector(":scope > .ui-mcs__sr + .tc-head + .ui-mcs__card")).toBeTruthy();
      expect($(el, ".tc-head__aside > .ui-mcs__pill").textContent!.replace(/\s+/g, " ").trim()).toBe("1 of 3 connected, 1 failed");
      const list = $(el, ".ui-mcs__list");
      expect(document.getElementById(list.getAttribute("aria-labelledby")!)!.textContent).toBe("MCP servers");
      expect([...el.querySelectorAll<HTMLElement>(".ui-mcs__server")].map((r) => r.dataset.status)).toEqual(["connected", "disconnected", "failed"]);
      expect($(row(el, 0), ".ui-mcs__status").textContent).toBe("Connected · 08:58");
      expect($(row(el, 0), ".ui-mcs__transport").textContent).toBe("HTTP");
      expect($(row(el, 0), ".ui-mcs__target").textContent).toBe("https://mcp.example.com/gh");
      const glance = $(row(el, 0), ".ui-mcs__glance");
      expect($(glance, ".ui-mcs__sr").textContent).toBe("5 tools, 1 resource and 0 prompts");
      expect([...glance.querySelectorAll(".ui-mcs__badge")].map((b) => b.textContent)).toEqual(["5tools", "1resource", "0prompts"]);
      expect([...glance.querySelectorAll(".ui-mcs__tool")].map((b) => b.textContent)).toEqual(["search_issues", "create_issue", "list_commits", "get_pr"]);
      expect($(glance, ".ui-mcs__more").textContent).toBe("+1 more");
      expect(row(el, 1).querySelector(".ui-mcs__glance")).toBeNull();
      expect($(row(el, 2), ".ui-mcs__line").textContent).toBe("401 – token rejected");
      expect([action(el, "gh"), action(el, "db"), action(el, "docs")].map((b) => b.getAttribute("aria-label"))).toEqual(["Disconnect GitHub", "Connect Database", "Retry Docs"]);
      expect($(el, ".ui-mcs__foot-note").textContent).toBe("Which agents may use each tool is set in tool permissions.");
    });

  test("Connect fires tc-connect with a signal and shows Connecting… with Cancel until the app answers", async () => {
    const el = await mount();
    const seen: McpConnectEvent[] = [];
    on(el, "tc-connect", (e) => seen.push(e.detail));
    action(el, "db").click();
    await settle();
    expect(seen[0].server).toEqual(SERVERS[1]);
    expect(seen[0].retry).toBe(false);
    expect(el.statusOf("db")).toBe("connecting");
    expect($(row(el, 1), ".ui-mcs__status").textContent).toBe("Connecting…");
    expect(action(el, "db").getAttribute("aria-label")).toBe("Cancel connecting to Database");
    expect(status(el)).toBe("Connecting to Database…");
    el.connections = { ...CONNECTIONS, db: { status: "connected", tools: [{ name: "query" }], resources: [], prompts: [] } };
    await settle();
    expect(seen[0].signal.aborted).toBe(false);
    expect(el.statusOf("db")).toBe("connected");
    expect(status(el)).toBe("Database connected – 1 tool, 0 resources and 0 prompts.");
    // Cancel aborts
    action(el, "docs").click();
    await settle();
    expect(seen[1].retry).toBe(true);
    action(el, "docs").click();
    await settle();
    expect(seen[1].signal.aborted).toBe(true);
    expect(el.statusOf("docs")).toBe("failed");
    // A failure comes back as Retry
    action(el, "docs").click();
    await settle();
    el.connections = { ...el.connections, docs: { status: "failed", message: "Still no" } };
    await settle();
    expect(status(el)).toBe("Docs failed to connect. Still no");
    // Prevented, nothing shows as connecting
    on(el, "tc-connect", (e) => e.preventDefault());
    action(el, "docs").click();
    await settle();
    expect(el.statusOf("docs")).toBe("failed");
  });

  test("Disconnect fires tc-disconnect; leaving the page aborts what's pending", async () => {
    const el = await mount();
    const off: string[] = [];
    on(el, "tc-disconnect", (e) => off.push(e.detail.server.id));
    action(el, "gh").click();
    await settle();
    expect(off).toEqual(["gh"]);
    let signal: AbortSignal | undefined;
    on(el, "tc-connect", (e) => (signal = e.detail.signal));
    action(el, "db").click();
    await settle();
    el.remove();
    expect(signal!.aborted).toBe(true);
  });

  test("Inspect is a disclosure; inside, tabs list tools, resources and prompts", async () => {
    const el = await mount();
    const btn = inspect(el, "gh");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(btn.getAttribute("aria-label")).toBe("Inspect GitHub");
    btn.click();
    await settle();
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    const panel = document.getElementById(btn.getAttribute("aria-controls")!)!;
    const tabs = [...panel.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    // Standard draws each label twice (an aria-hidden bold copy keeps the width)
    expect(tabs.map((t) => [t.querySelector(".ui-seg__text")!.textContent, t.querySelector(".ui-seg__count")!.textContent])).toEqual([["Tools", "5"], ["Resources", "1"], ["Prompts", "0"]]);
    const tabpanel = $(panel, '[role="tabpanel"]');
    expect(tabs[0].getAttribute("aria-controls")).toBe(tabpanel.id);
    expect(tabpanel.getAttribute("aria-label")).toBe("Tools");
    expect([...tabpanel.querySelectorAll(".ui-mcs__cap-name")].map((n) => n.textContent)).toEqual(["search_issues", "create_issue", "list_commits", "get_pr", "review"]);
    // Arrow keys move along the tabs (the segmented control's tablist)
    tabs[0].focus();
    key(tabs[0], "ArrowRight");
    await twice();
    expect($(panel, '[role="tabpanel"]').getAttribute("aria-label")).toBe("Resources");
    expect($(panel, ".ui-mcs__cap-uri").textContent).toBe("repo://a/README.md");
    panel.querySelectorAll<HTMLButtonElement>('[role="tab"]')[2].click();
    await settle();
    expect($(panel, ".ui-mcs__none").textContent).toBe("No prompts.");
    expect($(panel, ".ui-mcs__fact").textContent).toBe("Bearer token auth · GitHub token");
    // The tab change stays inside
    const outer: string[] = [];
    document.body.addEventListener("tc-value-change", (e) => outer.push((e.target as Element).tagName));
    panel.querySelectorAll<HTMLButtonElement>('[role="tab"]')[0].click();
    await settle();
    expect(outer).toEqual([]);
    inspect(el, "db").click();
    await settle();
    expect($(row(el, 1), ".ui-mcs__none").textContent).toBe("Connect to see its tools, resources and prompts.");
    btn.click();
    await settle();
    expect(btn.getAttribute("aria-expanded")).toBe("false");
  });

  test("Remove asks first in a modal dialog; Cancel and Escape return focus; confirming removes and moves focus on", async () => {
    const el = await mount();
    const seen: McpValueChange[] = [];
    const off: string[] = [];
    on(el, "tc-value-change", (e) => seen.push(e.detail));
    on(el, "tc-disconnect", (e) => off.push(e.detail.server.id));
    inspect(el, "gh").click();
    await settle();
    const remove = $<HTMLButtonElement>(el, ".ui-mcs__remove");
    expect(remove.getAttribute("aria-haspopup")).toBe("dialog");
    remove.click();
    await twice();
    const dialog = $<HTMLDialogElement>(el, ".ui-mcs__dialog");
    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute("role")).toBe("alertdialog");
    expect(document.getElementById(dialog.getAttribute("aria-labelledby")!)!.textContent).toBe("Remove GitHub?");
    expect(document.getElementById(dialog.getAttribute("aria-describedby")!)!.textContent).toBe("Its 5 tools, 1 resource and 0 prompts stop being available to agents. It's disconnected first. You can add it again later.");
    expect(document.activeElement).toBe($(dialog, ".ui-mcs__cancel"));
    // Tab wraps inside
    key($(dialog, ".ui-mcs__confirm"), "Tab");
    $<HTMLButtonElement>(dialog, ".ui-mcs__confirm").focus();
    key($(dialog, ".ui-mcs__confirm"), "Tab");
    expect(document.activeElement).toBe($(dialog, ".ui-mcs__cancel"));
    key(dialog, "Escape");
    await twice();
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(remove);
    remove.click();
    await twice();
    $<HTMLButtonElement>(el, ".ui-mcs__confirm").click();
    await twice();
    expect(seen[0].change).toEqual({ type: "remove", server: SERVERS[0] });
    expect(el.value.map((s) => s.id)).toEqual(["db", "docs"]);
    expect(off).toEqual(["gh"]);
    expect(document.activeElement).toBe(inspect(el, "db"));
    expect(status(el)).toBe("GitHub removed.");
  });

  test("adding a server: transport choice, the address it needs, auth with a credential, Test, then Add", async () => {
    const el = await mount();
    const add = $<HTMLButtonElement>(el, ".ui-mcs__add");
    add.click();
    await twice();
    expect(add.getAttribute("aria-expanded")).toBe("true");
    expect(add.disabled).toBe(true);
    const draft = $(el, ".ui-mcs__draft");
    expect(document.getElementById(draft.getAttribute("aria-labelledby")!)!.textContent).toBe("New server");
    expect(document.activeElement).toBe($(el, ".ui-mcs__draft-name"));
    // Add with nothing filled in shows what's missing and focuses the first
    $<HTMLButtonElement>(el, ".ui-mcs__draft-add").click();
    await twice();
    expect([...draft.querySelectorAll(".ui-mcs__error")].map((e) => e.textContent)).toEqual(["Give the server a name.", "Enter the server's URL."]);
    expect(document.activeElement).toBe($(el, ".ui-mcs__draft-name"));
    input($(el, ".ui-mcs__draft-name"), "github");
    await settle();
    expect($(draft, ".ui-mcs__error").textContent).toBe("There's already a server with that name.");
    input($(el, ".ui-mcs__draft-name"), "Linear");
    // stdio asks for a command; HTTP and SSE for a URL
    const opts = [...draft.querySelectorAll<HTMLButtonElement>('tc-segmented-control [role="radio"]')];
    expect(opts.map((o) => o.getAttribute("aria-checked"))).toEqual(["false", "true", "false"]);
    opts[0].click();
    await settle();
    expect($(draft, `label[for="${$(el, ".ui-mcs__draft-target").id}"]`).textContent).toBe("Command");
    opts[1].click();
    await settle();
    input($(el, ".ui-mcs__draft-target"), "mcp.linear.example");
    const auth = $<HTMLSelectElement>(draft, "select");
    auth.value = "token";
    auth.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    const tests: McpTestEvent[] = [];
    on(el, "tc-test", (e) => tests.push(e.detail));
    $<HTMLButtonElement>(el, ".ui-mcs__draft-test").click();
    await twice();
    expect(tests).toEqual([]);
    expect([...draft.querySelectorAll(".ui-mcs__error")].map((e) => e.textContent)).toEqual(["Use an http:// or https:// URL.", "Pick the credential to send."]);
    input($(el, ".ui-mcs__draft-target"), " https://mcp.linear.example ");
    const cred = $<HTMLSelectElement>(el, ".ui-mcs__draft-cred");
    cred.value = "vault/gh";
    cred.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    // Enter in the address tests
    $(el, ".ui-mcs__draft-target").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    await settle();
    expect(tests[0].server).toEqual({ id: "server-1", name: "Linear", transport: "http", target: "https://mcp.linear.example", auth: "token", credentialRef: "vault/gh" });
    expect($(draft, ".ui-mcs__result").textContent!.trim()).toBe("Testing…");
    expect($(el, ".ui-mcs__draft-test").textContent).toBe("Stop test");
    el.connections = { ...CONNECTIONS, "server-1": { status: "connected", tools: [{ name: "list_issues" }], resources: [], prompts: [] } };
    await settle();
    expect($(draft, ".ui-mcs__result").textContent!.trim()).toBe("It works – 1 tool, 0 resources and 0 prompts.");
    const seen: McpValueChange[] = [];
    on(el, "tc-value-change", (e) => seen.push(e.detail));
    $<HTMLButtonElement>(el, ".ui-mcs__draft-add").click();
    await twice();
    expect(seen[0].change.type).toBe("add");
    expect(el.value.map((s) => s.id)).toEqual(["gh", "db", "docs", "server-1"]);
    expect(el.querySelector(".ui-mcs__draft")).toBeNull();
    expect(el.statusOf("server-1")).toBe("connected");
    expect(document.activeElement).toBe(action(el, "server-1"));
  });

  test("Escape or Cancel closes the form; a draft that tested connected is let go", async () => {
    const el = await mount();
    const off: string[] = [];
    on(el, "tc-disconnect", (e) => off.push(e.detail.server.id));
    $<HTMLButtonElement>(el, ".ui-mcs__add").click();
    await twice();
    key($(el, ".ui-mcs__draft-name"), "Escape");
    await twice();
    expect(el.querySelector(".ui-mcs__draft")).toBeNull();
    expect(document.activeElement).toBe($(el, ".ui-mcs__add"));
    $<HTMLButtonElement>(el, ".ui-mcs__add").click();
    await twice();
    input($(el, ".ui-mcs__draft-name"), "Temp");
    input($(el, ".ui-mcs__draft-target"), "https://x.example.com");
    await settle();
    let signal: AbortSignal | undefined;
    on(el, "tc-test", (e) => (signal = e.detail.signal));
    $<HTMLButtonElement>(el, ".ui-mcs__draft-test").click();
    await settle();
    // An edit stops the test of the old settings
    input($(el, ".ui-mcs__draft-target"), "https://y.example.com");
    await settle();
    expect(signal!.aborted).toBe(true);
    el.connections = { ...CONNECTIONS, "server-2": { status: "connected" } };
    await settle();
    $<HTMLButtonElement>(el, ".ui-mcs__draft-cancel").click();
    await twice();
    expect(off).toEqual(["server-2"]);
  });

  test("empty, controlled, form and disabled", async () => {
    const form = await fixture<HTMLFormElement>(html`<form><fieldset><tc-mcp-connection-manager name="servers" .value=${SERVERS}></tc-mcp-connection-manager></fieldset></form>`);
    const el = form.querySelector<TcMcpConnectionManager>("tc-mcp-connection-manager")!;
    expect(JSON.parse(new FormData(form).get("servers") as string)).toEqual(SERVERS);
    on(el, "tc-value-change", (e) => e.preventDefault());
    inspect(el, "db").click();
    await settle();
    $<HTMLButtonElement>(el, ".ui-mcs__remove").click();
    await twice();
    $<HTMLButtonElement>(el, ".ui-mcs__confirm").click();
    await twice();
    expect(el.value).toEqual(SERVERS);
    form.querySelector("fieldset")!.disabled = true;
    await twice();
    expect(new FormData(form).get("servers")).toBeNull();
    expect(action(el, "db").disabled).toBe(true);
    expect($<HTMLButtonElement>(el, ".ui-mcs__add").disabled).toBe(true);
    const empty = await fixture<TcMcpConnectionManager>(html`<tc-mcp-connection-manager note=""></tc-mcp-connection-manager>`);
    expect($(empty, ".ui-mcs__empty").textContent).toBe("No servers yet. Add one to give agents its tools.");
    expect(empty.querySelector(".ui-mcs__pill")).toBeNull();
    expect(empty.querySelector(".ui-mcs__foot-note")).toBeNull();
  });

  test("React wrapper: onChange gets the list and the change; onConnect, onDisconnect; uncontrolled survives a re-render", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onChange = vi.fn();
    const onConnect = vi.fn();
    const onDisconnect = vi.fn();
    let rerender: () => void = () => {};
    function App() {
      const [, set] = React.useState(0);
      rerender = () => set((n) => n + 1);
      return React.createElement(McpConnectionManager, { title: "Tools", defaultValue: SERVERS, connections: CONNECTIONS, onChange, onConnect, onDisconnect });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcMcpConnectionManager>("tc-mcp-connection-manager")!;
    expect(el.heading).toBe("Tools");
    await act(async () => action(el, "db").click());
    expect(onConnect).toHaveBeenCalledWith(SERVERS[1], expect.any(AbortSignal), false);
    await act(async () => action(el, "gh").click());
    expect(onDisconnect).toHaveBeenCalledWith(SERVERS[0]);
    await act(async () => inspect(el, "docs").click());
    await settle();
    await act(async () => $<HTMLButtonElement>(el, ".ui-mcs__remove").click());
    await twice();
    await act(async () => $<HTMLButtonElement>(el, ".ui-mcs__confirm").click());
    await twice();
    expect(onChange).toHaveBeenCalledWith(SERVERS.slice(0, 2), { type: "remove", server: SERVERS[2] });
    await act(async () => rerender());
    await settle();
    expect(el.value.map((s) => s.id)).toEqual(["gh", "db"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const)
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-mcp-connection-manager .value=${SERVERS} .connections=${CONNECTIONS} .credentials=${CREDENTIALS} description="Engineering"></tc-mcp-connection-manager>
        <tc-mcp-connection-manager look="clean" heading="Clean" .value=${SERVERS} .connections=${CONNECTIONS} .credentials=${CREDENTIALS}></tc-mcp-connection-manager>
      </div>`);
      const [a, b] = wrap.querySelectorAll<TcMcpConnectionManager>("tc-mcp-connection-manager");
      inspect(a, "gh").click();
      action(b, "db").click();
      $<HTMLButtonElement>(b, ".ui-mcs__add").click();
      await twice();
      const auth = $<HTMLSelectElement>(b, ".ui-mcs__draft select");
      auth.value = "token";
      auth.dispatchEvent(new Event("change", { bubbles: true }));
      $<HTMLButtonElement>(b, ".ui-mcs__draft-add").click();
      await twice();
      for (const x of document.getAnimations()) if (x.effect?.getTiming().iterations !== Infinity) x.finish();
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });

  test("theme and motion: no .dark colours; reduced motion turns animation and transitions off", () => {
    const css = (customElements.get("tc-mcp-connection-manager") as unknown as { css: string }).css;
    expect(css).not.toMatch(/\.dark|data-(?:tc-)?theme/);
    expect(css).toMatch(/prefers-reduced-motion[^{]*\{\s*\[data-ui="mcs"\] \*[^{]*\{ animation: none !important; transition: none !important; \}/);
  });
});
