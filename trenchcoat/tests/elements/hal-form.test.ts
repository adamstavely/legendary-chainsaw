/*
 * <tc-hal-form> in real browsers: the spec's rules with no UI (template choice, URI templates, choices, CSV, requests),
 * then the form – each type's control, options inline and linked, checking, sending in each encoding, targets, loading
 * and failing, controlled values, server messages, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/hal-form";
import { buildHalRequest, expandHalUri, parseHalChoices, parseHalCsv, pickHalTemplate } from "../../src/elements/hal-form";
import type { HalFormError, HalFormFetcher, HalFormResponse, HalFormSubmit, HalFormValuesChange, HalFormsDocument, HalFormsProperty, TcHalForm } from "../../src/elements/hal-form";
import { HalForm } from "../../src/elements/react/hal-form";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const TARGET = "https://api.example.org/tasks";
const doc = (properties: HalFormsProperty[], extra: Record<string, unknown> = {}): HalFormsDocument => ({
  _links: { self: { href: TARGET } },
  _templates: { default: { title: "New task", method: "POST", properties, ...extra } },
});
type Call = { url: string; init: RequestInit };
/** A fetcher that records its calls and answers from `routes`, else 201 */
function server(routes: Record<string, () => Response> = {}) {
  const calls: Call[] = [];
  const fetcher: HalFormFetcher = async (url, init) => {
    calls.push({ url, init });
    return routes[url]?.() ?? new Response("{}", { status: 201 });
  };
  return { calls, fetcher };
}
const make = (resource: HalFormsDocument, fetcher?: HalFormFetcher, look: "standard" | "clean" = "standard") =>
  fixture<TcHalForm>(html`<tc-hal-form look=${look} .resource=${resource} .fetcher=${fetcher}></tc-hal-form>`);
const field = (el: Element, name: string) => [...el.querySelectorAll<HTMLElement>("[data-field]")].find((f) => f.dataset.field === name)!;
const input = (el: Element, name: string) => field(el, name).querySelector<HTMLInputElement>("input,textarea")!;
const type = async (el: Element, name: string, value: string) => {
  const i = input(el, name);
  i.value = value;
  i.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
};
const submit = async (el: Element) => {
  el.querySelector<HTMLButtonElement>("button[type=submit]")!.click();
  await settle();
};
const problem = (el: Element, name: string) => field(el, name).querySelector(".ui-hal__error")?.textContent?.replace("!", "").trim();
const outcome = (el: Element) => el.querySelector(".ui-hal__outcome")!.textContent!.trim();

describe("HAL-FORMS rules", () => {
  test("pickHalTemplate: the key asked for, else default, else the first; none is null", () => {
    const a = { title: "A" };
    const b = { title: "B" };
    expect(pickHalTemplate({ _templates: { a, default: b } })?.key).toBe("default");
    expect(pickHalTemplate({ _templates: { a, b } })?.key).toBe("a");
    expect(pickHalTemplate({ _templates: { a, b } }, "b")?.template).toBe(b);
    expect(pickHalTemplate({ _templates: { a } }, "gone")?.key).toBe("a");
    expect(pickHalTemplate({ _templates: {} })).toBeNull();
    expect(pickHalTemplate({})).toBeNull();
    expect(pickHalTemplate(null)).toBeNull();
  });

  test("expandHalUri: simple, reserved and query forms; a missing variable drops out", () => {
    const v = { id: "a b", path: "x/y", q: "1&2", n: 0, none: null };
    expect(expandHalUri("/t/{id}", v)).toBe("/t/a%20b");
    expect(expandHalUri("/{+path}", v)).toBe("/x/y");
    expect(expandHalUri("/s{?q,n,missing}", v)).toBe("/s?q=1%262&n=0");
    expect(expandHalUri("/s?a=1{&q}", v)).toBe("/s?a=1&q=1%262");
    expect(expandHalUri("/s{?none}/{missing}", v)).toBe("/s/");
  });

  test("parseHalChoices: plain values, prompt/value pairs, reference fields; a missing prompt is the value", () => {
    expect(parseHalChoices(["FedEx", 2])).toEqual([{ value: "FedEx", label: "FedEx" }, { value: "2", label: "2" }]);
    expect(parseHalChoices([{ prompt: "Federal Express", value: "FedEx" }, { value: "UPS" }, { prompt: "no value" }])).toEqual([
      { value: "FedEx", label: "Federal Express" },
      { value: "UPS", label: "UPS" },
    ]);
    expect(parseHalChoices([{ shipName: "DHL Express", shipCode: "DHL" }], { promptField: "shipName", valueField: "shipCode" })).toEqual([{ value: "DHL", label: "DHL Express" }]);
    expect(parseHalChoices({ not: "a list" })).toBeNull();
  });

  test("parseHalCsv: a value a line, or prompt then value, with CRLF and quotes", () => {
    expect(parseHalCsv("Fedex\r\nUPS\r\n")).toEqual([{ value: "Fedex", label: "Fedex" }, { value: "UPS", label: "UPS" }]);
    expect(parseHalCsv('Federal Express,FedEx\n"DHL, Express",DHL')).toEqual([
      { value: "FedEx", label: "Federal Express" },
      { value: "DHL", label: "DHL, Express" },
    ]);
  });

  test("buildHalRequest: JSON by default, form encoding repeats names, a query string without a body", () => {
    const values = { title: "A b", done: false, n: 3, ship: ["x", "y"], none: null };
    const json = buildHalRequest({ method: "post" }, TARGET, values);
    expect([json.method, json.url, json.headers["Content-Type"]]).toEqual(["POST", TARGET, "application/json"]);
    expect(JSON.parse(json.body!)).toEqual(values);
    // An unknown content type is treated as JSON
    expect(buildHalRequest({ method: "PUT", contentType: "text/weird" }, TARGET, {}).headers["Content-Type"]).toBe("application/json");
    const form = buildHalRequest({ method: "POST", contentType: "application/x-www-form-urlencoded; charset=utf-8" }, TARGET, values);
    expect(form.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    expect(form.body).toBe("title=A+b&done=false&n=3&ship=x&ship=y&none=");
    const get = buildHalRequest({ method: "GET" }, `${TARGET}?old=1`, { title: "A b", ship: ["x", "y"] });
    expect(get.url).toBe(`${TARGET}?title=A+b&ship=x&ship=y`);
    expect(get.body).toBeUndefined();
    expect(buildHalRequest({ method: "DELETE" }, TARGET, {}).url).toBe(TARGET);
    // Empty or not a method: a GET
    expect(buildHalRequest({}, TARGET, {}).method).toBe("GET");
    expect(buildHalRequest({ method: "no such!" }, TARGET, {}).method).toBe("GET");
  });
});

describe("tc-hal-form", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a form named by the template's title, its fields in order`, async () => {
      const el = await make(doc([{ name: "title", prompt: "Title", required: true }, { name: "more" }]), undefined, look);
      expect(el.dataset.ui).toBe("hal");
      expect(el.dataset.look).toBe(look);
      const form = el.querySelector("form")!;
      expect(document.getElementById(form.getAttribute("aria-labelledby")!)!.textContent).toBe("New task");
      expect(form.noValidate).toBe(true);
      expect([...el.querySelectorAll<HTMLElement>("[data-field]")].map((f) => f.dataset.field)).toEqual(["title", "more"]);
      // The prompt, and the name when there's none; required in words
      expect(field(el, "title").querySelector("label")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Title Required");
      expect(field(el, "more").querySelector("label")!.textContent!.trim()).toBe("more");
      expect(input(el, "title").required).toBe(true);
    });
  }

  test("each type draws its control; an unknown type is a text box; a nameless property is skipped", async () => {
    const types = ["text", "search", "tel", "url", "email", "password", "date", "month", "week", "time", "datetime-local", "number", "range", "color"];
    const el = await make(doc([...types.map((t) => ({ name: t, type: t })), { name: "long", type: "textarea", rows: 3, cols: 20 }, { name: "odd", type: "dropdown" }, { name: "flag", type: "checkbox" }, { name: "secret", type: "hidden", value: "v" }, { prompt: "No name" }]));
    // The attribute: Firefox and Safari draw month and week as text boxes
    for (const t of types) expect(input(el, t).getAttribute("type")).toBe(t);
    const area = field(el, "long").querySelector("textarea")!;
    expect([area.rows, area.cols]).toEqual([3, 20]);
    expect(input(el, "odd").type).toBe("text");
    expect(input(el, "flag").type).toBe("checkbox");
    expect(field(el, "secret")).toBeUndefined();
    expect(el.querySelectorAll("[data-field]")).toHaveLength(types.length + 3);
  });

  test("attributes reach the control; templated values expand; read-only stays and is sent", async () => {
    const { calls, fetcher } = server();
    const el = await fixture<TcHalForm>(
      html`<tc-hal-form
        .variables=${{ id: "42" }}
        .fetcher=${fetcher}
        .resource=${doc([
          { name: "a", placeholder: "Hint", regex: "[a-z]+", minLength: 1, maxLength: 9, value: "abc" },
          { name: "n", type: "number", min: 1, max: 9, step: 2, value: "3" },
          { name: "ref", readOnly: true, templated: true, value: "/items/{id}" },
          { name: "tick", type: "checkbox", readOnly: true, value: "true" },
        ])}
      ></tc-hal-form>`,
    );
    const a = input(el, "a");
    expect([a.placeholder, a.pattern, a.minLength, a.maxLength, a.value]).toEqual(["Hint", "[a-z]+", 1, 9, "abc"]);
    const n = input(el, "n");
    expect([n.min, n.max, n.step, n.value]).toEqual(["1", "9", "2", "3"]);
    expect([input(el, "ref").readOnly, input(el, "ref").value]).toEqual([true, "/items/42"]);
    expect([input(el, "tick").disabled, input(el, "tick").checked]).toEqual([true, true]);
    await submit(el);
    await expect.poll(() => calls.length).toBe(1);
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ a: "abc", n: 3, ref: "/items/42", tick: true });
  });

  test("checks: messages when left and on submit, focus on the first problem, nothing sent", async () => {
    const { calls, fetcher } = server();
    const el = await make(
      doc([
        { name: "title", required: true },
        { name: "code", regex: "[A-Z]{2}" },
        { name: "short", minLength: 3 },
        { name: "long", maxLength: 2 },
        { name: "n", type: "number", min: 2, max: 8, step: 2 },
        { name: "mail", type: "email" },
        { name: "agree", type: "checkbox", required: true },
        { name: "bad", regex: "(" },
      ]),
      fetcher,
    );
    expect(problem(el, "title")).toBeUndefined();
    await submit(el);
    expect(calls).toHaveLength(0);
    expect(problem(el, "title")).toBe("Complete this field.");
    expect(problem(el, "agree")).toBe("Complete this field.");
    // Empty and optional is fine
    expect(problem(el, "code")).toBeUndefined();
    expect(outcome(el)).toContain("2 fields need attention.");
    expect(document.activeElement).toBe(input(el, "title"));
    expect(input(el, "title").getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(input(el, "title").getAttribute("aria-describedby")!)!.textContent).toContain("Complete this field.");
    // Leaving a field checks it; fixing it clears the message as you type
    const leave = async (name: string, value: string) => {
      await type(el, name, value);
      input(el, name).dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
      await settle();
      return problem(el, name);
    };
    expect(await leave("code", "abc")).toBe("Use the format asked for.");
    expect(await leave("code", "AB")).toBeUndefined();
    expect(await leave("short", "ab")).toBe("Use at least 3 characters.");
    expect(await leave("long", "abc")).toBe("Use at most 2 characters.");
    expect(await leave("n", "1")).toBe("Enter 2 or more.");
    expect(await leave("n", "9")).toBe("Enter 8 or less.");
    expect(await leave("n", "3")).toBe("Use steps of 2.");
    expect(await leave("n", "4")).toBeUndefined();
    expect(await leave("mail", "nope")).toBe("Use the format asked for.");
    // An unreadable regex is ignored
    expect(await leave("bad", "anything")).toBeUndefined();
    await type(el, "title", "Done");
    expect(problem(el, "title")).toBeUndefined();
  });

  test("options inline: radios, checkboxes with limits, selectedValues; values sent as one or an array", async () => {
    const { calls, fetcher } = server();
    const el = await make(
      doc([
        { name: "ship", type: "radio", options: { selectedValues: ["UPS"], inline: [{ prompt: "United Parcel", value: "UPS" }, { prompt: "DHL Express", value: "DHL" }] } },
        { name: "extras", type: "checkbox", options: { minItems: 1, maxItems: 2, inline: ["a", "b", "c"], selectedValues: ["a"] } },
      ]),
      fetcher,
    );
    const radios = () => [...field(el, "ship").querySelectorAll<HTMLInputElement>("input")];
    const boxes = () => [...field(el, "extras").querySelectorAll<HTMLInputElement>("input")];
    expect(field(el, "ship").querySelector("legend")!.textContent).toContain("ship");
    expect(radios().map((r) => [r.type, r.checked])).toEqual([["radio", true], ["radio", false]]);
    expect(field(el, "ship").querySelectorAll("label")[1].textContent!.trim()).toBe("DHL Express");
    expect(boxes().map((b) => [b.type, b.checked])).toEqual([["checkbox", true], ["checkbox", false], ["checkbox", false]]);
    radios()[1].click();
    boxes()[1].click();
    await settle();
    boxes()[2].click();
    await settle();
    await submit(el);
    expect(problem(el, "extras")).toBe("Choose at most 2.");
    expect(calls).toHaveLength(0);
    boxes()[0].click();
    await settle();
    boxes()[1].click();
    boxes()[2].click();
    await settle();
    await submit(el);
    expect(problem(el, "extras")).toBe("Choose at least 1.");
    boxes()[2].click();
    await settle();
    await submit(el);
    await expect.poll(() => calls.length).toBe(1);
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ ship: "DHL", extras: ["c"] });
  });

  test("options without a checkbox or radio type: a searchable list, single unless maxItems says more", async () => {
    const { calls, fetcher } = server();
    const el = await make(
      doc([
        { name: "one", options: { inline: ["a", "b"], selectedValues: ["b"] } },
        { name: "two", required: true, options: { inline: ["x", "y", "z"], maxItems: 2 } },
      ]),
      fetcher,
    );
    const one = field(el, "one").querySelector("tc-combobox")!;
    const two = field(el, "two").querySelector("tc-combobox")!;
    expect([one.single, one.value, one.options.map((o) => o.label)]).toEqual([true, ["b"], ["a", "b"]]);
    expect([two.single, two.required]).toEqual([false, true]);
    // Named by the form's own label, and not labelled twice
    const named = two.querySelector("input")!.getAttribute("aria-labelledby")!;
    expect(document.getElementById(named)!.textContent!.replace(/\s+/g, " ").trim()).toBe("two Required");
    expect(two.querySelector(".ui-cbx__label")).toBeNull();
    await submit(el);
    expect(problem(el, "two")).toBe("Complete this field.");
    expect(two.invalid).toBe(true);
    // The combobox's own event stays inside; the form's goes out
    const outer: string[] = [];
    el.addEventListener("tc-value-change", () => outer.push("combobox"));
    el.addEventListener("tc-values-change", (e) => outer.push((e as CustomEvent<HalFormValuesChange>).detail.name));
    two.dispatchEvent(new CustomEvent("tc-value-change", { detail: { value: ["x", "z"], options: [] }, bubbles: true, cancelable: true }));
    await settle();
    expect(outer).toEqual(["two"]);
    expect(two.value).toEqual(["x", "z"]);
    expect(problem(el, "two")).toBeUndefined();
    await submit(el);
    await expect.poll(() => calls.length).toBe(1);
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ one: "b", two: ["x", "z"] });
  });

  test("the list by keyboard: Enter picks without sending the form", async () => {
    const { calls, fetcher } = server();
    const el = await make(doc([{ name: "who", required: true, options: { inline: ["Ana", "Ben"] } }]), fetcher);
    const combo = field(el, "who").querySelector("tc-combobox")!;
    const box = combo.querySelector("input")!;
    box.focus();
    const press = async (key: string) => {
      box.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
      await settle();
    };
    await press("ArrowDown");
    expect(combo.open).toBe(true);
    await press("Enter");
    await expect.poll(() => combo.value).toEqual(["Ana"]);
    expect(el.values.who).toBe("Ana");
    expect(combo.open).toBe(false);
    expect(calls).toHaveLength(0);
    await submit(el);
    await expect.poll(() => calls.length).toBe(1);
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ who: "Ana" });
  });

  test("options.link: fetched with its Accept, JSON with reference fields or CSV; a failure says so and retries", async () => {
    let healthy = false;
    const { calls, fetcher } = server({
      "https://api.example.org/ships?region=eu": () => new Response(JSON.stringify([{ n: "Federal", c: "FedEx" }]), { status: 200 }),
      "https://api.example.org/ships.csv": () => new Response("Federal,FedEx\nDHL Express,DHL\n", { status: 200 }),
      "https://api.example.org/flaky": () => (healthy ? new Response('["ok"]', { status: 200 }) : new Response("", { status: 500 })),
    });
    const errors: HalFormError[] = [];
    const wrap = await fixture(
      html`<div @tc-error=${(e: CustomEvent<HalFormError>) => errors.push(e.detail)}>
        <tc-hal-form
          .fetcher=${fetcher}
          .variables=${{ region: "eu" }}
          .resource=${doc([
            { name: "a", type: "radio", options: { link: { href: "/ships{?region}", templated: true }, promptField: "n", valueField: "c" } },
            { name: "b", type: "radio", options: { link: { href: "https://api.example.org/ships.csv", type: "text/csv" } } },
            { name: "c", type: "radio", options: { link: { href: "https://api.example.org/flaky" } } },
            { name: "d", options: { inline: ["inline wins"], link: { href: "https://api.example.org/never" } } },
          ], { target: TARGET })}
          src="https://api.example.org/form"
        ></tc-hal-form>
      </div>`,
    );
    const el = wrap.querySelector("tc-hal-form")!;
    await expect.poll(() => field(el, "a").querySelectorAll("input").length).toBe(1);
    await expect.poll(() => field(el, "b").querySelectorAll("input").length).toBe(2);
    await expect.poll(() => field(el, "c").querySelector(".ui-hal__note")?.textContent).toBe("The choices couldn't be loaded.");
    expect(field(el, "a").querySelector("label")!.textContent!.trim()).toBe("Federal");
    expect(field(el, "b").querySelectorAll("label")[1].textContent!.trim()).toBe("DHL Express");
    const accept = (url: string) => (calls.find((c) => c.url === url)!.init.headers as Record<string, string>).Accept;
    expect(accept("https://api.example.org/ships.csv")).toBe("text/csv");
    expect(accept("https://api.example.org/ships?region=eu")).toBe("application/json");
    expect(calls.some((c) => c.url.endsWith("/never"))).toBe(false);
    expect(errors.map((e) => [e.phase, e.name])).toEqual([["options", "c"]]);
    healthy = true;
    field(el, "c").querySelector<HTMLButtonElement>(".ui-hal__retry")!.click();
    await expect.poll(() => field(el, "c").querySelectorAll("input").length).toBe(1);
  });

  test("sends: JSON, form encoding and a query string; tc-submit then tc-response; a refusal gives the server's words", async () => {
    const { calls, fetcher } = server({
      [TARGET]: () => new Response(JSON.stringify({ title: "Bad", detail: "Title is taken" }), { status: 409 }),
    });
    const el = await make(doc([{ name: "title", value: "A b" }, { name: "n", type: "number" }, { name: "done", type: "checkbox" }]), fetcher);
    const submits: HalFormSubmit[] = [];
    const responses: HalFormResponse[] = [];
    el.addEventListener("tc-submit", (e) => submits.push((e as CustomEvent<HalFormSubmit>).detail));
    el.addEventListener("tc-response", (e) => responses.push((e as CustomEvent<HalFormResponse>).detail));
    await submit(el);
    await expect.poll(() => responses.length).toBe(1);
    expect(submits[0].method).toBe("POST");
    expect(submits[0].values).toEqual({ title: "A b", n: null, done: false });
    expect(submits[0].templateKey).toBe("default");
    expect(calls[0].url).toBe(TARGET);
    expect(calls[0].init.method).toBe("POST");
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ title: "A b", n: null, done: false });
    expect([responses[0].ok, responses[0].status]).toEqual([false, 409]);
    await expect.poll(() => outcome(el)).toContain("The server refused this (409): Title is taken");
    // The body is left for the page
    expect((await responses[0].response.json()).title).toBe("Bad");

    el.resource = doc([{ name: "title", value: "A b" }], { contentType: "application/x-www-form-urlencoded", target: "https://api.example.org/other" });
    await settle();
    await submit(el);
    await expect.poll(() => calls.length).toBe(2);
    expect(calls[1].url).toBe("https://api.example.org/other");
    expect(calls[1].init.body).toBe("title=A+b");
    await expect.poll(() => outcome(el)).toContain("Sent.");

    el.resource = doc([{ name: "q", value: "x" }], { method: "GET" });
    await settle();
    await submit(el);
    await expect.poll(() => calls.length).toBe(3);
    expect(calls[2].url).toBe(`${TARGET}?q=x`);
    expect(calls[2].init.body).toBeUndefined();
  });

  test("tc-submit prevented: nothing is sent; a failed send says so and fires tc-error; no double send", async () => {
    const seen: string[] = [];
    let release = () => {};
    const fetcher: HalFormFetcher = (url) => {
      seen.push(url);
      return new Promise((_ok, no) => (release = () => no(new Error("offline"))));
    };
    const el = await make(doc([{ name: "a" }]), fetcher);
    el.addEventListener("tc-submit", (e) => e.preventDefault(), { once: true });
    await submit(el);
    expect(seen).toHaveLength(0);
    const errors: HalFormError[] = [];
    el.addEventListener("tc-error", (e) => errors.push((e as CustomEvent<HalFormError>).detail));
    await submit(el);
    await expect.poll(() => seen.length).toBe(1);
    const button = el.querySelector<HTMLButtonElement>("button[type=submit]")!;
    expect([button.disabled, button.textContent, el.querySelector("form")!.getAttribute("aria-busy")]).toEqual([true, "Sending…", "true"]);
    el.querySelector("form")!.requestSubmit();
    await settle();
    expect(seen).toHaveLength(1);
    release();
    await expect.poll(() => outcome(el)).toContain("couldn't be sent");
    expect(errors[0].phase).toBe("submit");
    expect(button.disabled).toBe(false);
  });

  test("the target: _htarget, then target, then self, then src; a relative one resolves against src; none says so", async () => {
    const url = async (resource: HalFormsDocument, src?: string) => {
      const { calls, fetcher } = server();
      const el = await fixture<TcHalForm>(html`<tc-hal-form .resource=${resource} .fetcher=${fetcher} src=${src ?? ""}></tc-hal-form>`);
      await submit(el);
      return calls[0]?.url;
    };
    const props = { method: "POST" };
    expect(await url({ _templates: { default: { ...props, target: "https://a.example/t" } } }, "https://a.example/form?_htarget=https%3A%2F%2Fa.example%2Fover")).toBe("https://a.example/over");
    expect(await url({ _links: { self: { href: "https://a.example/self" } }, _templates: { default: { ...props, target: "https://a.example/t" } } })).toBe("https://a.example/t");
    expect(await url({ _links: { self: { href: "https://a.example/self" } }, _templates: { default: props } })).toBe("https://a.example/self");
    expect(await url({ _templates: { default: props } }, "https://a.example/form")).toBe("https://a.example/form");
    expect(await url({ _templates: { default: { ...props, target: "jobs" } } }, "https://a.example/api/form")).toBe("https://a.example/api/jobs");
    // Not http(s): ignored, and with nothing else there's nowhere to go
    const el = await fixture<TcHalForm>(html`<tc-hal-form .resource=${{ _templates: { default: { ...props, target: "javascript:alert(1)" } } }}></tc-hal-form>`);
    expect(el.querySelector("form")).toBeNull();
    expect(el.querySelector(".ui-hal__message")!.textContent).toContain("doesn't say where to send it");
  });

  test("src: fetched as HAL-FORMS, loading then the form; a failure offers a retry; not a document says so", async () => {
    let up = false;
    const calls: Call[] = [];
    const fetcher: HalFormFetcher = async (url, init) => {
      calls.push({ url, init });
      return up ? new Response(JSON.stringify(doc([{ name: "a" }])), { status: 200 }) : new Response("", { status: 503 });
    };
    const errors: HalFormError[] = [];
    const wrap = await fixture(html`<div @tc-error=${(e: CustomEvent<HalFormError>) => errors.push(e.detail)}><tc-hal-form src="https://a.example/form" .fetcher=${fetcher}></tc-hal-form></div>`);
    const el = wrap.querySelector("tc-hal-form")!;
    await expect.poll(() => el.querySelector(".ui-hal__message")?.textContent).toContain("couldn't be loaded");
    expect((calls[0].init.headers as Record<string, string>).Accept).toBe("application/prs.hal-forms+json");
    expect(el.querySelector(".ui-hal__message")!.getAttribute("role")).toBe("alert");
    expect(errors[0].phase).toBe("form");
    up = true;
    el.querySelector<HTMLButtonElement>(".ui-hal__retry")!.click();
    await expect.poll(() => el.querySelector("form") !== null).toBe(true);
    expect(el.querySelector("h3")!.textContent).toBe("New task");
    el.resource = {};
    await settle();
    expect(el.querySelector(".ui-hal__message")!.textContent).toContain("isn't a form");
  });

  test("values: over the template's, preventable; errors from the page show until the field is edited; template-key", async () => {
    const el = await fixture<TcHalForm>(
      html`<tc-hal-form
        template-key="edit"
        .values=${{ a: "from page" }}
        .errors=${{ b: "Already taken" }}
        .resource=${{
          _links: { self: { href: TARGET } },
          _templates: {
            default: { title: "Other", method: "POST", properties: [{ name: "zzz" }] },
            edit: { title: "Edit", method: "PUT", properties: [{ name: "a", value: "from template" }, { name: "b", value: "x" }] },
          },
        }}
      ></tc-hal-form>`,
    );
    expect(el.querySelector("h3")!.textContent).toBe("Edit");
    expect(input(el, "a").value).toBe("from page");
    expect(input(el, "b").value).toBe("x");
    expect(problem(el, "b")).toBe("Already taken");
    const seen: HalFormValuesChange[] = [];
    el.addEventListener("tc-values-change", (e) => seen.push((e as CustomEvent<HalFormValuesChange>).detail));
    await type(el, "b", "y");
    expect(seen[0]).toEqual({ values: { a: "from page", b: "y" }, name: "b", value: "y" });
    expect(problem(el, "b")).toBeUndefined();
    el.addEventListener("tc-values-change", (e) => e.preventDefault(), { once: true });
    await type(el, "b", "z");
    expect(input(el, "b").value).toBe("y");
    expect(el.values.b).toBe("y");
  });

  test("a template with no properties is just its button", async () => {
    const { calls, fetcher } = server();
    const el = await make(doc([], { method: "DELETE" }), fetcher);
    expect(el.querySelectorAll("[data-field]")).toHaveLength(0);
    await submit(el);
    await expect.poll(() => calls.length).toBe(1);
    expect([calls[0].init.method, calls[0].url]).toEqual(["DELETE", TARGET]);
  });

  test("React wrapper: uncontrolled keeps values through re-renders; controlled waits for the parent", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const resource = doc([{ name: "a", value: "start" }]);
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(HalForm, { title: "Heading", resource, "data-n": n } as React.ComponentProps<typeof HalForm>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-hal-form")!;
    expect(el.querySelector("h3")!.textContent).toBe("Heading");
    expect(input(el, "a").value).toBe("start");
    await type(el, "a", "typed");
    await act(async () => bump());
    await settle();
    expect(input(el, "a").value).toBe("typed");
    const seen: unknown[] = [];
    await act(async () => root.render(React.createElement(HalForm, { resource, values: { a: "held" }, onValuesChange: (v) => void seen.push(v) })));
    await settle();
    const controlled = host.querySelector("tc-hal-form")!;
    await type(controlled, "a", "nope");
    expect(seen).toEqual([{ a: "nope" }]);
    await expect.poll(() => input(controlled, "a").value).toBe("held");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, with messages showing`, async () => {
      const properties: HalFormsProperty[] = [
        { name: "title", prompt: "Title", required: true },
        { name: "notes", prompt: "Notes", type: "textarea" },
        { name: "when", prompt: "When", type: "date" },
        { name: "n", prompt: "How many", type: "range", min: 0, max: 5, value: "2" },
        { name: "ok", prompt: "Agree", type: "checkbox", required: true },
        { name: "ship", prompt: "Shipping", type: "radio", required: true, options: { inline: ["FedEx", "DHL"] } },
        { name: "extras", prompt: "Extras", type: "checkbox", options: { minItems: 1, inline: ["a", "b"] } },
        { name: "list", prompt: "Team", required: true, options: { inline: ["One", "Two"] } },
      ];
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="display: grid; gap: 16px; padding: 16px; background: var(--tc-surface-base)">
        <tc-hal-form description="From the API" .resource=${doc(properties)}></tc-hal-form>
        <tc-hal-form look="clean" .resource=${doc(properties)}></tc-hal-form>
      </div>`);
      for (const el of wrap.querySelectorAll("tc-hal-form")) await submit(el);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
