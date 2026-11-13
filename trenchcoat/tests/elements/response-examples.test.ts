/*
 * <tc-response-examples> in real browsers: a tab per status with its class in a mark and a word, the panel's
 * description, headers and body, media types, the keyboard, controlled status, the React wrapper and axe in both looks
 * and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/response-examples";
import { responseBodyText, responseReason, responseStatusClass, type ResponseExample, type TcResponseExamples } from "../../src/elements/response-examples";
import { ResponseExamples } from "../../src/elements/react/response-examples";
import type { TcCodeBlock } from "../../src/elements/code-block";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const EXAMPLES: ResponseExample[] = [
  {
    status: 200,
    description: "The record.",
    headers: { "Content-Type": "application/json", ETag: '"v9"' },
    bodies: [
      { mediaType: "application/json", body: { id: "REC-1", tags: ["a"] } },
      { mediaType: "text/csv", body: "id,title\nREC-1,Audit" },
    ],
  },
  { status: 304, description: "Unchanged." },
  { status: 404, body: '{"error":"not_found"}' },
  { status: 429, label: "Rate limited", headers: { "Retry-After": "30" }, body: { error: "rate_limited" } },
  { status: 503, body: { error: "unavailable" } },
];

const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcResponseExamples>(html`<tc-response-examples look=${look} heading="GET /records/{id}" .examples=${EXAMPLES}></tc-response-examples>`);
const tabs = (el: Element) => [...el.querySelectorAll<HTMLElement>('[role="tab"]')];
const code = (el: Element) => el.querySelector<TcCodeBlock>("tc-code-block");

describe("tc-response-examples", () => {
  test("helpers: status classes, reason phrases and pretty bodies", () => {
    expect(["101", 204, 302, 404, 503].map(responseStatusClass)).toEqual(["info", "success", "redirect", "client", "server"]);
    expect(responseReason(429)).toBe("Too many requests");
    expect(responseReason(299)).toBe("");
    expect(responseBodyText({ mediaType: "application/json", body: '{"a":1}' })).toBe('{\n  "a": 1\n}');
    expect(responseBodyText({ mediaType: "application/problem+json", body: "not json" })).toBe("not json");
    expect(responseBodyText({ mediaType: "text/plain", body: "hi" })).toBe("hi");
    expect(responseBodyText({ mediaType: "application/json", body: [1] })).toBe("[\n  1\n]");
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a tab per status with its class in words; the first shows`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("rex");
      expect(el.dataset.look).toBe(look);
      const t = tabs(el);
      expect(t.map((x) => x.textContent!.replace(/\s+/g, " ").trim())).toEqual([
        "200 OK , Success",
        "304 Not modified , Redirect",
        "404 Not found , Client error",
        "429 Rate limited , Client error",
        "503 Service unavailable , Server error",
      ]);
      expect(t.map((x) => x.dataset.class)).toEqual(["success", "redirect", "client", "client", "server"]);
      expect(t.filter((x) => x.tabIndex === 0)).toHaveLength(1);
      expect(t[0].getAttribute("aria-selected")).toBe("true");
      const panel = el.querySelector<HTMLElement>('[role="tabpanel"]')!;
      expect(panel.id).toBe(t[0].getAttribute("aria-controls"));
      expect(panel.getAttribute("aria-labelledby")).toBe(t[0].id);
      expect(el.querySelector('[role="tablist"]')!.getAttribute("aria-labelledby")).toBe(el.querySelector(".tc-head__title")!.id);
      expect(panel.querySelector(".ui-rex__desc")!.textContent).toBe("The record.");
      expect(code(el)!.code).toBe('{\n  "id": "REC-1",\n  "tags": [\n    "a"\n  ]\n}');
      expect(code(el)!.language).toBe("json");
      expect(code(el)!.bare).toBe(true);
    });
  }

  test("headers fold behind a disclosure", async () => {
    const el = await make();
    const toggle = el.querySelector<HTMLButtonElement>(".ui-rex__headers-toggle")!;
    const list = el.querySelector<HTMLElement>(`#${toggle.getAttribute("aria-controls")}`)!;
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(list.hidden).toBe(true);
    expect(toggle.textContent!.replace(/\s+/g, " ").trim()).toBe("Headers2");
    toggle.click();
    await settle();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(list.hidden).toBe(false);
    expect([...list.querySelectorAll("dt")].map((d) => d.textContent)).toEqual(["Content-Type", "ETag"]);
  });

  test("a media type select switches the body, and can be prevented", async () => {
    const el = await make();
    const select = el.querySelector<HTMLSelectElement>(".ui-rex__select")!;
    expect([...select.options].map((o) => o.value)).toEqual(["application/json", "text/csv"]);
    expect(el.querySelector(`label[for="${select.id}"]`)!.textContent).toBe("Media type");
    const seen: unknown[] = [];
    el.addEventListener("tc-media-type-change", (e) => seen.push((e as CustomEvent).detail));
    select.value = "text/csv";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(seen).toEqual([{ mediaType: "text/csv", status: "200" }]);
    expect(el.mediaType).toBe("text/csv");
    expect(code(el)!.code).toBe("id,title\nREC-1,Audit");
    expect(code(el)!.language).toBe("plain");
    el.addEventListener("tc-media-type-change", (e) => e.preventDefault());
    const now = el.querySelector<HTMLSelectElement>(".ui-rex__select")!;
    now.value = "application/json";
    now.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.mediaType).toBe("text/csv");
    expect(el.querySelector<HTMLSelectElement>(".ui-rex__select")!.value).toBe("text/csv");
  });

  test("a status with no body says so; one body has no select", async () => {
    const el = await make();
    tabs(el)[1].click();
    await settle();
    expect(el.status).toBe("304");
    expect(el.querySelector(".ui-rex__nobody")!.textContent).toBe("No body");
    expect(code(el)).toBeNull();
    tabs(el)[2].click();
    await settle();
    expect(el.querySelector(".ui-rex__select")).toBeNull();
    expect(code(el)!.code).toBe('{\n  "error": "not_found"\n}');
  });

  test("keyboard: ← → move and show with wrap, Home and End; one tab stop", async () => {
    const el = await make();
    const key = (k: string) => document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
    const at = () => (document.activeElement as HTMLElement).dataset.status;
    tabs(el)[0].focus();
    key("ArrowLeft");
    await expect.poll(at).toBe("503");
    expect(el.status).toBe("503");
    key("ArrowRight");
    await expect.poll(at).toBe("200");
    key("End");
    await expect.poll(at).toBe("503");
    key("Home");
    await expect.poll(at).toBe("200");
    key("ArrowRight");
    await expect.poll(at).toBe("304");
    expect(tabs(el).filter((x) => x.tabIndex === 0).map((x) => x.dataset.status)).toEqual(["304"]);
  });

  test("tc-status-change carries the status; prevented, the tab stays", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-status-change", (e) => {
      seen.push((e as CustomEvent).detail.status);
      e.preventDefault();
    });
    tabs(el)[3].click();
    await settle();
    expect(seen).toEqual(["429"]);
    expect(el.status).toBe("");
    expect(tabs(el)[0].getAttribute("aria-selected")).toBe("true");
  });

  test("status picks the tab; unknown falls back to the first; empty says so; words can be renamed", async () => {
    const el = await make();
    el.status = "429";
    await settle();
    expect(tabs(el)[3].getAttribute("aria-selected")).toBe("true");
    el.status = "999";
    el.labels = { client: "Your mistake" };
    await settle();
    expect(tabs(el)[0].getAttribute("aria-selected")).toBe("true");
    expect(tabs(el)[2].textContent).toContain("Your mistake");
    el.examples = [];
    await settle();
    expect(el.querySelector(".ui-rex__nobody")!.textContent).toBe("No example responses");
  });

  test("React: an uncontrolled tab survives re-renders; a controlled one stays until the parent changes it", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    const root = createRoot(wrap);
    const seen: string[] = [];
    const render = (props: Partial<React.ComponentProps<typeof ResponseExamples>>) =>
      act(async () => root.render(React.createElement(ResponseExamples, { title: "GET /records", examples: EXAMPLES, onStatusChange: (s: string) => void seen.push(s), ...props })));
    await render({});
    const el = wrap.querySelector<TcResponseExamples>("tc-response-examples")!;
    await settle();
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("GET /records");
    tabs(el)[2].click();
    await settle();
    await render({});
    await settle();
    expect(el.status).toBe("404");
    await render({ status: "200" });
    await settle();
    tabs(el)[4].click();
    await settle();
    expect(el.status).toBe("200");
    expect(seen).toEqual(["404", "503"]);
    await render({ status: "503" });
    await settle();
    expect(tabs(el)[4].getAttribute("aria-selected")).toBe("true");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = document.body.appendChild(document.createElement("div"));
      wrap.style.cssText = `color-scheme: ${theme}`;
      wrap.innerHTML = `<tc-response-examples look="standard" headers-open></tc-response-examples><tc-response-examples look="clean" status="429" headers-open></tc-response-examples>`;
      wrap.querySelectorAll<TcResponseExamples>("tc-response-examples").forEach((el) => (el.examples = EXAMPLES));
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
