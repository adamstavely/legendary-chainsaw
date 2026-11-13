/*
 * <tc-request-log> in real browsers: columns, status words and classes, latency bars, chips, the details (bodies,
 * headers, masking), Copy as cURL, the keyboard, empty and narrow states, the React wrapper and axe in both looks and
 * both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/request-log";
import { curlCommand, redact, statusClass, statusWords, type ProviderRequest, type TcRequestLog } from "../../src/elements/request-log";
import { RequestLog } from "../../src/elements/react/request-log";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const T = Date.UTC(2026, 10, 3, 9, 14, 0);
const H = { "content-type": "application/json", Authorization: "Bearer sk-live-7f3a9c" };
const REQUESTS: ProviderRequest[] = [
  { id: "q1", at: T, provider: "Provider", model: "large-1", endpoint: "/v1/messages", status: 200, latency: 2_000, inputTokens: 8_120, outputTokens: 610, cost: 0.0532, cacheHit: true, requestHeaders: H, responseHeaders: { "x-ratelimit-remaining": "412" }, requestBody: { model: "large-1", api_key: "secret-1", messages: [{ role: "user", content: "Match it's invoice" }] }, responseBody: { id: "msg_1" } },
  { id: "q2", at: T + 3_000, provider: "Provider", model: "small-2", endpoint: "/v1/messages", status: 200, latency: 500, inputTokens: 1_480, outputTokens: 92, cost: 0.0009, cacheHit: false },
  { id: "q3", at: T + 4_000, provider: "Provider", model: "large-1", endpoint: "/v1/messages", status: 429, latency: 180, responseBody: "slow down" },
  { id: "q4", at: T + 5_000, provider: "Provider", model: "large-1", endpoint: "/v1/messages", status: 503, latency: 4_000 },
  { id: "q5", at: T + 6_000, provider: "Provider", model: "embed-1", endpoint: "/v1/embeddings", method: "POST", status: 400, latency: 100 },
];
const make = (look: "standard" | "clean" = "standard", requests = REQUESTS) => fixture<TcRequestLog>(html`<tc-request-log look=${look} locale="en-US" base-url="https://api.provider.example" .requests=${requests}></tc-request-log>`);
const rows = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-rqlg__row")];
const ids = (el: Element) => rows(el).map((r) => r.dataset.id);
const text = (el: Element | null) => el?.textContent!.replace(/\s+/g, " ").trim();
const chip = (el: Element, group: string, v: string) => el.querySelector<HTMLElement>(`.ui-rqlg__chips[data-group="${group}"] .ui-rqlg__chip[data-value="${v}"]`)!;
const key = async (el: TcRequestLog, k: string, target: Element = document.activeElement!) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  await el.updateComplete;
  await settle(el.parentElement!);
};

describe("tc-request-log", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a grid of requests, newest first, with status words and one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("rqlg");
      expect(el.dataset.look).toBe(look);
      const grid = el.querySelector('[role="grid"]')!;
      expect([...grid.querySelectorAll('[role="columnheader"]')].map(text)).toEqual(["Time", "Model", "Endpoint", "Status", "Latency", "Tokens in → out", "Cost", "Cache"]);
      expect(ids(el)).toEqual(["q5", "q4", "q3", "q2", "q1"]);
      const cells = (id: string) => [...el.querySelector(`.ui-rqlg__row[data-id="${id}"]`)!.querySelectorAll('[role="gridcell"]')].map(text);
      expect(cells("q1").slice(1)).toEqual(["Provider large-1", "POST /v1/messages", "200", "2 s", "8,120 → 610", "$0.05", "Hit"]);
      expect(cells("q3")[3]).toBe("429 Rate limited");
      expect(cells("q4")[3]).toBe("503 Unavailable");
      expect(cells("q2")[7]).toBe("Miss");
      expect(cells("q4")[5]).toBe("–");
      expect(rows(el).map((r) => r.dataset.tone)).toEqual(["warning", "danger", "warning", "success", "success"]);
      expect(el.querySelectorAll('.ui-rqlg__row[tabindex="0"]')).toHaveLength(1);
      expect(text(el.querySelector(".ui-rqlg__errors"))).toBe("3 errors");
      expect(text(el.querySelector(".ui-rqlg__foot"))!.replace(/\s*·\s*/g, " · ")).toBe("5 requests · 3 errors · 500 ms median · $0.05");
    });
  }

  test("latency bars scale to the slowest request", async () => {
    const el = await make();
    const bar = (id: string) => el.querySelector<HTMLElement>(`.ui-rqlg__row[data-id="${id}"] .ui-rqlg__bar`)!.style.width;
    expect([bar("q4"), bar("q1"), bar("q5")]).toEqual(["100%", "50%", "2.5%"]);
  });

  test("statusClass, statusWords and redact", () => {
    expect([200, 304, 400, 429, 500, 0].map(statusClass)).toEqual(["2xx", "2xx", "4xx", "rate-limited", "5xx", "5xx"]);
    expect([200, 401, 418, 0, 599].map(statusWords)).toEqual(["", "Unauthorized", "Client error", "No response", "Server error"]);
    expect(redact({ Authorization: "x", nested: [{ API_KEY: "y", keep: 1 }] })).toEqual({ Authorization: "[redacted]", nested: [{ API_KEY: "[redacted]", keep: 1 }] });
  });

  test("class and model chips filter, with counts; prevented stays", async () => {
    const el = await make();
    expect(text(chip(el, "classes", "rate-limited"))).toBe("Rate limited 1");
    let detail: unknown = null;
    el.addEventListener("tc-classes-change", (e) => (detail = (e as CustomEvent).detail), { once: true });
    chip(el, "classes", "5xx").click();
    await el.updateComplete;
    expect(detail).toEqual({ classes: ["5xx"] });
    expect(ids(el)).toEqual(["q4"]);
    chip(el, "classes", "5xx").click();
    chip(el, "models", "small-2").click();
    await el.updateComplete;
    expect(ids(el)).toEqual(["q2"]);
    el.addEventListener("tc-models-change", (e) => e.preventDefault(), { once: true });
    chip(el, "models", "small-2").click();
    await el.updateComplete;
    expect(ids(el)).toEqual(["q2"]);
  });

  test("opening a request shows masked bodies and headers in tabs; Esc closes back to its row", async () => {
    const el = await make();
    const opened: unknown[] = [];
    el.addEventListener("tc-request-open", (e) => opened.push((e as CustomEvent).detail.id));
    el.querySelector<HTMLElement>('.ui-rqlg__row[data-id="q1"]')!.click();
    await settle(el.parentElement!);
    expect(opened).toEqual(["q1"]);
    const row = el.querySelector('.ui-rqlg__row[data-id="q1"]')!;
    expect(row.getAttribute("aria-selected")).toBe("true");
    expect(el.querySelector(`#${row.getAttribute("aria-controls")}`)!.getAttribute("aria-label")).toBe("POST /v1/messages");
    const viewer = el.querySelector(".ui-rqlg__json") as HTMLElement & { value: unknown };
    expect((viewer.value as Record<string, unknown>).api_key).toBe("[redacted]");
    (el.querySelector('.ui-rqlg__tab[data-tab="request"]') as HTMLElement).focus();
    await key(el, "End");
    expect(document.activeElement).toBe(el.querySelector('.ui-rqlg__tab[data-tab="headers"]'));
    const pairs = [...el.querySelectorAll(".ui-rqlg__pair")].map((p) => `${text(p.querySelector("dt"))} ${text(p.querySelector("dd"))}`);
    expect(pairs).toContain("Authorization [redacted]");
    expect(pairs).toContain("x-ratelimit-remaining 412");
    el.querySelector<HTMLElement>('.ui-rqlg__row[data-id="q3"]')!.click();
    await settle(el.parentElement!);
    (el.querySelector('.ui-rqlg__tab[data-tab="headers"]') as HTMLElement).click();
    await el.updateComplete;
    expect(text(el.querySelector(".ui-rqlg__none"))).toBe("None");
    el.querySelector<HTMLElement>('.ui-rqlg__tab[data-tab="response"]')!.click();
    await el.updateComplete;
    expect(text(el.querySelector(".ui-rqlg__text"))).toBe("slow down");
    rows(el).find((r) => r.dataset.id === "q3")!.focus();
    await key(el, "Escape");
    expect(el.selected).toBeNull();
    expect(el.querySelector(".ui-rqlg__detail")).toBeNull();
  });

  test("Copy as cURL redacts the auth header and body keys, and says so", async () => {
    const el = await make();
    el.selected = "q1";
    await settle(el.parentElement!);
    let detail: { text: string; id: string } | null = null;
    el.addEventListener("tc-copy", (e) => {
      if (e.target !== el) return;
      detail = (e as CustomEvent).detail;
      e.preventDefault();
    });
    el.querySelector<HTMLButtonElement>(".ui-rqlg__curl")!.click();
    await expect.poll(() => el.querySelector(':scope > [role="status"]')!.textContent).toBe("cURL command copied.");
    expect(detail!.id).toBe("q1");
    expect(detail!.text).toContain("curl -X POST 'https://api.provider.example/v1/messages'");
    expect(detail!.text).toContain("-H 'Authorization: [redacted]'");
    expect(detail!.text).toContain(`"api_key":"[redacted]"`);
    expect(detail!.text).toContain(`Match it'\\''s invoice`);
    expect(detail!.text).not.toContain("sk-live");
    expect(curlCommand({ ...REQUESTS[2], url: "https://x.example/a" })).toBe("curl -X POST 'https://x.example/a'");
  });

  test("the keyboard moves between requests and opens one", async () => {
    const el = await make();
    rows(el)[0].focus();
    await key(el, "End");
    expect(document.activeElement).toBe(rows(el)[4]);
    await key(el, "ArrowUp");
    await key(el, "Enter");
    expect(el.selected).toBe("q2");
  });

  test("no requests, nothing matching, and narrow width", async () => {
    const empty = await make("standard", []);
    expect(text(empty.querySelector(".ui-rqlg__empty"))).toBe("No requests yet");
    const el = await make();
    el.models = ["nothing"];
    await el.updateComplete;
    expect(text(el.querySelector(".ui-rqlg__empty"))).toBe("No requests match");
    el.models = [];
    el.style.width = "380px";
    await settle(el.parentElement!);
    await expect.poll(() => getComputedStyle(rows(el)[0].querySelector(".ui-rqlg__endpoint")!).display).toBe("none");
    expect(getComputedStyle(rows(el)[0].querySelector(".ui-rqlg__latency")!).display).not.toBe("none");
  });

  test("React: uncontrolled classes survive re-renders; controlled selection stays; onRequestOpen still fires", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => root.render(React.createElement(RequestLog, { requests: REQUESTS })));
    const el = host.querySelector("tc-request-log") as TcRequestLog;
    await settle(host);
    await act(async () => chip(el, "classes", "2xx").click());
    await act(async () => root.render(React.createElement(RequestLog, { requests: REQUESTS, title: "Calls" })));
    expect(el.classes).toEqual(["2xx"]);
    const told: unknown[] = [];
    await act(async () => root.render(React.createElement(RequestLog, { requests: REQUESTS, selected: "q1", onSelectedChange: (s) => told.push(s), onRequestOpen: (id) => told.push(`open ${id}`) })));
    await settle(host);
    await act(async () => rows(el)[0].click());
    await settle(host);
    expect(el.selected).toBe("q1");
    expect(told).toEqual(["open q2", "q2"]);
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const)
    for (const theme of ["light", "dark"] as const)
      test(`axe: ${look} ${theme}`, async () => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.style.colorScheme = theme;
        const el = await make(look);
        el.selected = "q1";
        await finish(el.parentElement!);
        const r = await axe.run(el);
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "";
        expect(r.violations.flatMap((v) => [v.id, ...v.nodes.map((n) => n.target.join(" ") + " " + n.failureSummary)])).toEqual([]);
      });
});
