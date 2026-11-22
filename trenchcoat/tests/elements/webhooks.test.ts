/*
 * <tc-webhooks> in real browsers: endpoints with their events and switch, delivery health in words, the deliveries with
 * Retry, Add and Edit with their checks, Delete with its question, Send test event, the signing secret, narrow
 * widths, cancelable events, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/webhooks";
import {
  webhookHealth,
  webhookUrlOk,
  type TcWebhooks,
  type WebhookDelivery,
  type WebhookEndpoint,
  type WebhookEndpointCreate,
  type WebhookEndpointDelete,
  type WebhookEndpointToggle,
  type WebhookEndpointUpdate,
} from "../../src/elements/webhooks";
import { Webhooks } from "../../src/elements/react/webhooks";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = Date.UTC(2026, 10, 20, 14, 2);
const MIN = 60_000;
const DAY = 86_400_000;
const TYPES = [
  { id: "case.created", label: "case.created", description: "A case is opened" },
  { id: "case.closed", label: "case.closed" },
  { id: "report.ready", label: "report.ready" },
];
const okRun = (prefix: string, n: number): WebhookDelivery[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i}`, at: NOW - (i + 1) * 10 * MIN, event: "case.created", status: 200, ok: true, durationMs: 120, attempt: 1 }));
const ENDPOINTS: WebhookEndpoint[] = [
  {
    id: "a",
    url: "https://hooks.example.com/case-sync",
    description: "Keeps the warehouse in step",
    events: ["case.created", "case.closed"],
    enabled: true,
    secret: "whsec_test_4f1c9a07b2e8",
    deliveries: [
      { id: "p", at: NOW - 2 * MIN, event: "case.closed", status: 502, ok: false, durationMs: 1240, attempt: 2, nextRetryAt: NOW + 3 * MIN },
      { id: "f", at: NOW - 5 * MIN, event: "case.created", status: null, ok: false, durationMs: 10_000, attempt: 3 },
      ...okRun("o", 46),
      { id: "old", at: NOW - 2 * DAY, event: "case.created", status: 500, ok: false },
    ],
  },
  { id: "b", url: "https://hooks.example.com/reports", events: ["report.ready"], enabled: true, deliveries: okRun("r", 12) },
  { id: "c", url: "https://hooks.example.com/legacy", events: ["case.closed"], enabled: false, deliveries: [] },
  { id: "d", url: "https://hooks.example.com/quiet", events: ["case.closed"], enabled: true, deliveries: [{ id: "q", at: NOW - 3 * DAY, event: "case.closed", status: 200, ok: true }] },
];

const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const hooks = (list = ENDPOINTS) => fixture<TcWebhooks>(html`<tc-webhooks .endpoints=${list} .eventTypes=${TYPES} .now=${NOW} locale="en-GB"></tc-webhooks>`);
const ep = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-endpoint="${id}"]`)!;
const btn = (root: Element, cls: string) => root.querySelector<HTMLButtonElement>(cls)!;
const hhmm = (ms: number) => new Intl.DateTimeFormat("en-GB", { timeStyle: "short" }).format(ms);
const type = (input: HTMLInputElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new Event("input"));
};

describe("tc-webhooks", () => {
  for (const look of ["standard", "clean"]) {
    test(`renders in ${look}: the heading, Add endpoint and a list of endpoints`, async () => {
      const wrap = await fixture<HTMLElement>(html`<div><tc-webhooks look=${look} .endpoints=${ENDPOINTS} .eventTypes=${TYPES} .now=${NOW}></tc-webhooks></div>`);
      const el = wrap.querySelector<TcWebhooks>("tc-webhooks")!;
      expect(el.dataset.ui).toBe("whe");
      expect(el.dataset.look).toBe(look);
      expect(text(el.querySelector(".tc-head__title"))).toBe("Webhooks");
      expect(text(btn(el, ".ui-whe__add"))).toBe("Add endpoint");
      expect(el.querySelectorAll(".ui-whe__list > .ui-whe__endpoint")).toHaveLength(4);
      const sw = btn(ep(el, "a"), ".ui-whe__switch");
      expect(sw.getAttribute("role")).toBe("switch");
      expect(sw.getAttribute("aria-checked")).toBe("true");
      expect(text(sw)).toBe("Sending, https://hooks.example.com/case-sync");
      expect([...ep(el, "a").querySelectorAll(".ui-whe__chip")].map(text)).toEqual(["case.created", "case.closed"]);
    });
  }

  test("health in words: failures in the last 24 hours, all delivered, quiet and none yet", async () => {
    const el = await hooks();
    expect(webhookHealth(ENDPOINTS[0]!, NOW)).toEqual({ ever: 49, total: 48, failed: 2 });
    expect(text(ep(el, "a").querySelector(".ui-whe__health"))).toBe("2 of 48 failed in the last 24 hours");
    expect(ep(el, "a").querySelector(".ui-whe__health")!.getAttribute("data-tone")).toBe("warn");
    expect(text(ep(el, "b").querySelector(".ui-whe__health"))).toBe("All 12 delivered in the last 24 hours");
    expect(text(ep(el, "c").querySelector(".ui-whe__health"))).toBe("No deliveries yet");
    expect(text(ep(el, "d").querySelector(".ui-whe__health"))).toBe("No deliveries in the last 24 hours");
    expect(ep(el, "c").hasAttribute("data-paused")).toBe(true);
    expect(text(btn(ep(el, "c"), ".ui-whe__switch"))).toMatch(/^Paused – events aren't sent/);
    expect(btn(ep(el, "c"), ".ui-whe__test").disabled).toBe(true);
    expect(webhookUrlOk("https://hooks.example.com/x")).toBe(true);
    expect(webhookUrlOk("http://hooks.example.com/x")).toBe(false);
    expect(webhookUrlOk("hooks.example.com")).toBe(false);
  });

  test("the health line opens the deliveries: result in words, status, time, attempt and Retry", async () => {
    const el = await fixture<TcWebhooks>(html`<tc-webhooks .endpoints=${ENDPOINTS} .eventTypes=${TYPES} .now=${NOW} locale="en-GB" max-deliveries="4"></tc-webhooks>`);
    const toggle = btn(ep(el, "a"), ".ui-whe__toggle");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    const list = document.getElementById(toggle.getAttribute("aria-controls")!)!;
    expect(list.hidden).toBe(true);
    // Folded means not drawn, not just marked hidden
    expect(list.getClientRects()).toHaveLength(0);
    toggle.click();
    await settle();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(list.hidden).toBe(false);
    expect(list.getClientRects().length).toBeGreaterThan(0);
    const rows = [...list.querySelectorAll<HTMLElement>(".ui-whe__delivery")];
    expect(rows).toHaveLength(4);
    expect(text(rows[0]!.querySelector(".ui-whe__d-result"))).toBe(`Retrying at ${hhmm(NOW + 3 * MIN)}`);
    expect(text(rows[0]!.querySelector(".ui-whe__d-meta"))).toBe("HTTP 502 · 1240 ms · Attempt 2");
    expect(text(rows[0]!.querySelector(".ui-whe__d-time"))).toBe(hhmm(NOW - 2 * MIN));
    expect(text(rows[1]!.querySelector(".ui-whe__d-result"))).toBe("Failed");
    expect(text(rows[1]!.querySelector(".ui-whe__d-meta"))).toBe("No response · 10000 ms · Attempt 3");
    expect(text(rows[2]!.querySelector(".ui-whe__d-result"))).toBe("Delivered");
    expect(rows[2]!.querySelector(".ui-whe__retry")).toBeNull();
    const retried: unknown[] = [];
    el.addEventListener("tc-delivery-retry", (e) => retried.push((e as CustomEvent).detail));
    btn(rows[1]!, ".ui-whe__retry").click();
    expect(retried).toEqual([{ endpointId: "a", deliveryId: "f" }]);
    expect(text(btn(rows[1]!, ".ui-whe__retry"))).toMatch(/^Retry, case.created/);
  });

  test("the switch turns an endpoint off and on; prevented, it stays", async () => {
    const el = await hooks();
    const got: WebhookEndpointToggle[] = [];
    el.addEventListener("tc-endpoint-toggle", (e) => got.push((e as CustomEvent<WebhookEndpointToggle>).detail));
    btn(ep(el, "a"), ".ui-whe__switch").click();
    await settle();
    expect(got[0]!.id).toBe("a");
    expect(got[0]!.enabled).toBe(false);
    expect(got[0]!.endpoints.find((x) => x.id === "a")!.enabled).toBe(false);
    expect(btn(ep(el, "a"), ".ui-whe__switch").getAttribute("aria-checked")).toBe("false");
    expect(text(el.querySelector('[role="status"]'))).toBe("Paused https://hooks.example.com/case-sync");
    el.addEventListener("tc-endpoint-toggle", (e) => e.preventDefault());
    btn(ep(el, "b"), ".ui-whe__switch").click();
    await settle();
    expect(btn(ep(el, "b"), ".ui-whe__switch").getAttribute("aria-checked")).toBe("true");
  });

  test("Add endpoint: https only, at least one event, All events; then it fires and closes", async () => {
    const el = await hooks();
    const made: WebhookEndpointCreate[] = [];
    el.addEventListener("tc-endpoint-create", (e) => made.push((e as CustomEvent<WebhookEndpointCreate>).detail));
    btn(el, ".ui-whe__add").click();
    await settle();
    const form = el.querySelector<HTMLFormElement>(".ui-whe__card > .ui-whe__form")!;
    const url = form.querySelector<HTMLInputElement>(".ui-whe__url-input")!;
    expect(document.activeElement).toBe(url);
    type(url, "http://hooks.example.com/new");
    btn(form, ".ui-whe__submit").click();
    await settle();
    expect(made).toEqual([]);
    expect(url.getAttribute("aria-invalid")).toBe("true");
    expect(text(form.querySelector(".ui-whe__error"))).toBe("Use an https:// address.");
    type(url, "https://hooks.example.com/new");
    await settle();
    btn(form, ".ui-whe__submit").click();
    await settle();
    expect(made).toEqual([]);
    expect(text(form.querySelector(".ui-whe__error"))).toBe("Pick at least one event.");
    const all = form.querySelector<HTMLInputElement>(".ui-whe__all-events")!;
    all.click();
    await settle();
    expect([...form.querySelectorAll<HTMLInputElement>(".ui-whe__checks input")].every((c) => c.checked)).toBe(true);
    form.querySelectorAll<HTMLInputElement>(".ui-whe__checks input")[1]!.click();
    await settle();
    expect(all.indeterminate).toBe(true);
    type(form.querySelectorAll<HTMLInputElement>(".ui-whe__input")[1]!, " Mirror for audits ");
    btn(form, ".ui-whe__submit").click();
    await settle();
    expect(made).toEqual([{ url: "https://hooks.example.com/new", description: "Mirror for audits", events: ["case.created", "report.ready"] }]);
    expect(el.querySelector(".ui-whe__card > .ui-whe__form")).toBeNull();
  });

  test("Edit opens a filled form in place and saves the endpoint; a prevented save keeps it open", async () => {
    const el = await hooks();
    const saved: WebhookEndpointUpdate[] = [];
    el.addEventListener("tc-endpoint-update", (e) => saved.push((e as CustomEvent<WebhookEndpointUpdate>).detail));
    btn(ep(el, "b"), ".ui-whe__edit").click();
    await settle();
    const form = ep(el, "b").querySelector<HTMLFormElement>(".ui-whe__form")!;
    const url = form.querySelector<HTMLInputElement>(".ui-whe__url-input")!;
    expect(url.value).toBe("https://hooks.example.com/reports");
    type(url, "https://hooks.example.com/reports-v2");
    btn(form, ".ui-whe__submit").click();
    await settle();
    expect(saved[0]!.id).toBe("b");
    expect(saved[0]!.url).toBe("https://hooks.example.com/reports-v2");
    expect(el.endpoints.find((x) => x.id === "b")!.url).toBe("https://hooks.example.com/reports-v2");
    await expect.poll(() => document.activeElement).toBe(btn(ep(el, "b"), ".ui-whe__edit"));
    el.addEventListener("tc-endpoint-update", (e) => e.preventDefault());
    btn(ep(el, "b"), ".ui-whe__edit").click();
    await settle();
    btn(ep(el, "b"), ".ui-whe__submit").click();
    await settle();
    expect(ep(el, "b").querySelector(".ui-whe__form")).not.toBeNull();
  });

  test("Delete asks in place, then removes the endpoint; Send test event fires", async () => {
    const el = await hooks();
    const tests: string[] = [];
    el.addEventListener("tc-endpoint-test", (e) => tests.push((e as CustomEvent<{ id: string }>).detail.id));
    btn(ep(el, "b"), ".ui-whe__test").click();
    expect(tests).toEqual(["b"]);
    btn(ep(el, "b"), ".ui-whe__remove").click();
    await settle();
    const group = ep(el, "b").querySelector(".ui-whe__confirm")!;
    expect(group.getAttribute("aria-label")).toBe("Delete, https://hooks.example.com/reports");
    await expect.poll(() => document.activeElement).toBe(btn(ep(el, "b"), ".ui-whe__keep"));
    const gone: WebhookEndpointDelete[] = [];
    el.addEventListener("tc-endpoint-delete", (e) => gone.push((e as CustomEvent<WebhookEndpointDelete>).detail));
    btn(ep(el, "b"), ".ui-whe__confirm-remove").click();
    await settle();
    expect(gone[0]!.id).toBe("b");
    expect(gone[0]!.endpoints.map((x) => x.id)).toEqual(["a", "c", "d"]);
    expect(el.querySelector('[data-endpoint="b"]')).toBeNull();
  });

  test("the signing secret is masked until Show; read-only hides the controls; no endpoints says so", async () => {
    const el = await hooks();
    const value = ep(el, "a").querySelector(".ui-whe__secret-value")!;
    expect(text(value)).toBe("whsec_••••••••b2e8");
    const show = btn(ep(el, "a"), ".ui-whe__show");
    expect(show.getAttribute("aria-pressed")).toBe("false");
    show.click();
    await settle();
    expect(text(value)).toBe("whsec_test_4f1c9a07b2e8");
    expect(show.getAttribute("aria-pressed")).toBe("true");
    const ro = await fixture<TcWebhooks>(html`<tc-webhooks read-only .endpoints=${ENDPOINTS} .now=${NOW}></tc-webhooks>`);
    expect(ro.querySelector(".ui-whe__add, .ui-whe__switch, .ui-whe__edit, .ui-whe__retry")).toBeNull();
    expect(text(ro.querySelector(".ui-whe__count"))).toBe("4 endpoints");
    const none = await fixture<TcWebhooks>(html`<tc-webhooks .now=${NOW}></tc-webhooks>`);
    expect(text(none.querySelector(".ui-whe__empty"))).toBe("No endpoints yet. Add one to have events sent to another app.");
  });

  test("narrow, a delivery stacks into two columns", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 340px"><tc-webhooks .endpoints=${ENDPOINTS} .eventTypes=${TYPES} .now=${NOW}></tc-webhooks></div>`);
    const el = wrap.querySelector<TcWebhooks>("tc-webhooks")!;
    btn(ep(el, "a"), ".ui-whe__toggle").click();
    await settle();
    const row = ep(el, "a").querySelector<HTMLElement>(".ui-whe__delivery")!;
    await expect.poll(() => getComputedStyle(row).gridTemplateColumns.split(" ").length).toBe(2);
    expect(wrap.scrollWidth).toBeLessThanOrEqual(340);
  });
});

describe("React", () => {
  test("uncontrolled endpoints change on toggle; controlled ones wait for the parent", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    await act(async () => root.render(React.createElement(Webhooks, { defaultEndpoints: ENDPOINTS, eventTypes: TYPES, now: NOW })));
    await settle();
    let el = host.querySelector<TcWebhooks>("tc-webhooks")!;
    await act(async () => btn(ep(el, "a"), ".ui-whe__switch").click());
    await act(async () => root.render(React.createElement(Webhooks, { defaultEndpoints: ENDPOINTS, eventTypes: TYPES, now: NOW, title: "Hooks" })));
    await settle();
    expect(el.endpoints.find((x) => x.id === "a")!.enabled).toBe(false);
    expect(text(el.querySelector(".tc-head__title"))).toBe("Hooks");
    await act(async () => root.unmount());

    const root2 = createRoot(host);
    let changed: { endpoints: WebhookEndpoint[]; kind: string } | undefined;
    const node = (list: WebhookEndpoint[]) =>
      React.createElement(Webhooks, { endpoints: list, eventTypes: TYPES, now: NOW, onEndpointsChange: (endpoints: WebhookEndpoint[], change: { kind: string }) => (changed = { endpoints, kind: change.kind }) });
    await act(async () => root2.render(node(ENDPOINTS)));
    await settle();
    el = host.querySelector<TcWebhooks>("tc-webhooks")!;
    await act(async () => btn(ep(el, "b"), ".ui-whe__switch").click());
    await settle();
    expect(changed!.kind).toBe("toggle");
    expect(btn(ep(el, "b"), ".ui-whe__switch").getAttribute("aria-checked")).toBe("true");
    await act(async () => root2.render(node(changed!.endpoints)));
    await settle();
    expect(btn(ep(el, "b"), ".ui-whe__switch").getAttribute("aria-checked")).toBe("false");
    await act(async () => root2.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}, with deliveries and the form open`, async () => {
        const wrap = await fixture<HTMLElement>(
          html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas; color: CanvasText`}>
            <tc-webhooks look=${look} .endpoints=${ENDPOINTS} .eventTypes=${TYPES} .now=${NOW}></tc-webhooks>
          </div>`,
        );
        const el = wrap.querySelector<TcWebhooks>("tc-webhooks")!;
        btn(ep(el, "a"), ".ui-whe__toggle").click();
        btn(el, ".ui-whe__add").click();
        await settle();
        btn(el, ".ui-whe__submit").click();
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
