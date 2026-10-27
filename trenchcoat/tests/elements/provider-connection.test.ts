/*
 * <tc-provider-connection> in real browsers: the fields, the masked credential, the test (tc-test, its signal, cancel,
 * Escape, edits), every health state, stale checks, controlled use, the form, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/provider-connection";
import type { ProviderConnectionCheck, ProviderConnectionTestEvent, ProviderConnectionValue, TcProviderConnection } from "../../src/elements/provider-connection";
import { ProviderConnection } from "../../src/elements/react/provider-connection";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const PROVIDERS = [
  { id: "azure", label: "Azure", endpoint: "https://<resource>.example.com", deploymentLabel: "Deployment" },
  { id: "compatible", label: "Compatible", deploymentLabel: "Model" },
];
const CREDENTIALS = [
  { id: "kv/prod", label: "Production key", hint: "4f2a", expires: "Expires 14 Jan" },
  { id: "kv/old", label: "Old key", hint: "be17", expires: "Expired 30 Sep", expired: true },
];
const VALUE: ProviderConnectionValue = { provider: "azure", endpoint: "https://models.example.com", deployment: "assistant", credentialRef: "kv/prod" };
const MODELS = [
  { id: "assistant", label: "Large", detail: "128k context" },
  { id: "assistant-mini", label: "Small" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const on = (el: Element, name: string, fn: (e: CustomEvent<any>) => void) => el.addEventListener(name, fn as EventListener);
const open = async (el: TcProviderConnection) => {
  if (el.querySelector(".ui-prv__edit")!.getAttribute("aria-expanded") !== "true") el.querySelector<HTMLButtonElement>(".ui-prv__edit")!.click();
  await settle();
  return el;
};
const mount = async (look: "standard" | "clean" = "standard", value = VALUE) => open(await fixture<TcProviderConnection>(html`<tc-provider-connection look=${look} .providers=${PROVIDERS} .credentials=${CREDENTIALS} .value=${value}></tc-provider-connection>`));
const $ = <T extends Element = HTMLElement>(el: Element, sel: string) => el.querySelector<T>(sel)!;
const testBtn = (el: Element) => $<HTMLButtonElement>(el, ".ui-prv__test");
const pill = (el: Element) => $(el, ".ui-prv__pill").textContent!.trim();
const health = (el: Element) => [$(el, ".ui-prv__health-title").textContent, $(el, ".ui-prv__health-detail").textContent];
const status = (el: Element) => $(el, '[role="status"]').textContent;
const change = (field: HTMLInputElement | HTMLSelectElement, value: string) => {
  field.value = value;
  field.dispatchEvent(new Event("change", { bubbles: true }));
};
const endpoint = (el: Element) => $<HTMLInputElement>(el, ".ui-prv__endpoint");
/** Presses Test and returns the event's detail */
const runTest = async (el: TcProviderConnection) => {
  let detail: ProviderConnectionTestEvent | undefined;
  on(el, "tc-test", (e) => (detail ??= e.detail));
  testBtn(el).click();
  await settle();
  return detail!;
};

describe("tc-provider-connection", () => {
  for (const look of ["standard", "clean"] as const)
    test(`${look}: the host is a group named by the heading, with the fields and Not tested`, async () => {
      const el = await mount(look);
      expect(el.dataset.ui).toBe("prv");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("group");
      expect(el.getAttribute("aria-label")).toBe("Model provider");
      expect(el.dataset.state).toBe("untested");
      expect(pill(el)).toBe("Status: Not tested");
      expect(health(el)).toEqual(["Not tested yet", "Test the connection before anything relies on it."]);
      expect([...el.querySelectorAll(".ui-prv__label")].map((l) => l.textContent)).toEqual(["Provider", "Endpoint", "Deployment", "Credential"]);
      // Every field is named by its label
      for (const l of el.querySelectorAll<HTMLLabelElement>("label.ui-prv__label")) expect(document.getElementById(l.htmlFor)).toBeTruthy();
      expect(testBtn(el).textContent!.trim()).toBe("Test connection");
      expect(el.querySelector(".ui-prv__models")).toBeNull();
    });

  test("the summary is a path – your app, endpoint, credential, model – each hop with its health; the failed hop stands out", async () => {
    const el = await fixture<TcProviderConnection>(html`<tc-provider-connection .providers=${PROVIDERS} .credentials=${CREDENTIALS} .value=${VALUE}></tc-provider-connection>`);
    const path = $(el, ".ui-prv__path");
    expect(path.tagName).toBe("OL");
    expect(path.getAttribute("aria-label")).toBe("Connection path");
    expect($(el, ".ui-prv__origin").textContent!.trim()).toBe("Your app");
    // The fields are closed while there's an endpoint
    expect($(el, ".ui-prv__editor").hidden).toBe(true);
    expect(el.querySelector(".ui-prv__endpoint")).toBeNull();
    const hops = () => [...el.querySelectorAll<HTMLElement>(".ui-prv__hop")].map((h) => [h.dataset.hop, h.dataset.state, h.querySelector(".ui-prv__node-state")!.textContent!.replace(":", "").trim()]);
    const node = (hop: string) => $<HTMLButtonElement>(el, `.ui-prv__hop[data-hop="${hop}"] .ui-prv__node`);
    expect(node("endpoint").textContent!.replace(/\s+/g, " ").trim()).toBe("Edit Azure models.example.com : Not checked");
    expect(node("credential").textContent!.replace(/\s+/g, " ").trim()).toBe("Edit Credential Production key •••• 4f2a : Not checked");
    expect(node("model").textContent!.replace(/\s+/g, " ").trim()).toBe("Edit Deployment assistant : Not checked");
    const states: [ProviderConnectionCheck, string[][]][] = [
      [{ status: "healthy", latencyMs: 90, models: MODELS }, [["endpoint", "ok", "Reachable"], ["credential", "ok", "Accepted"], ["model", "ok", "Available"]]],
      [{ status: "unreachable" }, [["endpoint", "fail", "Not reachable"], ["credential", "unknown", "Not reached"], ["model", "unknown", "Not reached"]]],
      [{ status: "auth-failed" }, [["endpoint", "ok", "Reachable"], ["credential", "fail", "Refused"], ["model", "unknown", "Not reached"]]],
      [{ status: "expired" }, [["endpoint", "ok", "Reachable"], ["credential", "fail", "Expired"], ["model", "unknown", "Not reached"]]],
      [{ status: "model-unavailable", models: [MODELS[1]] }, [["endpoint", "ok", "Reachable"], ["credential", "ok", "Accepted"], ["model", "fail", "Not offered"]]],
    ];
    for (const [check, want] of states) {
      el.check = check;
      await settle();
      expect(hops()).toEqual(want);
    }
    expect($(el, '.ui-prv__hop[data-hop="model"]').dataset.tone).toBe("warning");
    el.check = { status: "auth-failed" };
    await settle();
    expect($(el, '.ui-prv__hop[data-hop="credential"]').dataset.tone).toBe("danger");
    el.check = { status: "healthy", latencyMs: 90.4 };
    await settle();
    expect($(el, ".ui-prv__latency").textContent).toBe("90 ms");
    testBtn(el).click();
    await settle();
    expect(hops().map((h) => h[2])).toEqual(["Checking…", "Checking…", "Checking…"]);
    el.originLabel = "Support app";
    await settle();
    expect($(el, ".ui-prv__origin").textContent!.trim()).toBe("Support app");
  });

  test("a hop opens the fields at its own field; Edit and Done toggle them; Escape closes them", async () => {
    const el = await fixture<TcProviderConnection>(html`<tc-provider-connection .credentials=${CREDENTIALS} .value=${VALUE}></tc-provider-connection>`);
    const edit = $<HTMLButtonElement>(el, ".ui-prv__edit");
    expect(edit.textContent!.trim()).toBe("Edit");
    expect(edit.getAttribute("aria-expanded")).toBe("false");
    expect(document.getElementById(edit.getAttribute("aria-controls")!)).toBe($(el, ".ui-prv__editor"));
    $<HTMLButtonElement>(el, '.ui-prv__hop[data-hop="credential"] .ui-prv__node').click();
    await settle();
    await settle();
    expect($(el, ".ui-prv__editor").hidden).toBe(false);
    expect(document.activeElement).toBe($(el, '[data-row="credential"] select'));
    expect(edit.getAttribute("aria-expanded")).toBe("true");
    expect($(el, '.ui-prv__hop[data-hop="credential"] .ui-prv__node').getAttribute("aria-expanded")).toBe("true");
    expect(edit.textContent!.trim()).toBe("Done");
    $(el, '[data-row="credential"] select').dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    await settle();
    await settle();
    expect($(el, ".ui-prv__editor").hidden).toBe(true);
    expect(document.activeElement).toBe(edit);
    $<HTMLButtonElement>(el, '.ui-prv__hop[data-hop="model"] .ui-prv__node').click();
    await settle();
    await settle();
    expect(document.activeElement).toBe($(el, '[data-row="deployment"] input'));
    edit.click();
    await settle();
    expect($(el, ".ui-prv__editor").hidden).toBe(true);
    // Nothing set yet: the fields are open from the start
    const blank = await fixture<TcProviderConnection>(html`<tc-provider-connection></tc-provider-connection>`);
    expect($(blank, ".ui-prv__editor").hidden).toBe(false);
    expect($(blank, '.ui-prv__hop[data-hop="endpoint"] .ui-prv__node-value').textContent).toBe("Not set");
  });

  test("heading, description and the provider's own words; no providers hides the row", async () => {
    const el = await mount();
    el.heading = "Support assistant";
    el.description = "Production";
    el.value = { ...VALUE, provider: "compatible" };
    await settle();
    expect(el.getAttribute("aria-label")).toBe("Support assistant");
    expect($(el, ".tc-head__sub").textContent).toBe("Production");
    expect($(el, '[data-row="deployment"] .ui-prv__label').textContent).toBe("Model");
    el.value = { ...VALUE, endpoint: "" };
    await settle();
    expect(endpoint(el).placeholder).toBe("https://<resource>.example.com");
    el.providers = [];
    await settle();
    expect(el.querySelector('[data-row="provider"]')).toBeNull();
    // An unknown provider asks for one
    el.providers = PROVIDERS;
    el.value = { ...VALUE, provider: "gone" };
    await settle();
    expect($<HTMLSelectElement>(el, "select").value).toBe("");
    expect($<HTMLSelectElement>(el, "select").options[0].textContent).toBe("Pick a provider");
  });

  test("every field commits a cancelable tc-value-change; the endpoint is checked once edited", async () => {
    const el = await mount();
    const seen: ProviderConnectionValue[] = [];
    on(el, "tc-value-change", (e) => seen.push(e.detail.value));
    change($<HTMLSelectElement>(el, "select"), "compatible");
    change(endpoint(el), "  https://other.example.com/v1  ");
    change($<HTMLInputElement>(el, '[data-row="deployment"] input'), "assistant-mini");
    change($<HTMLSelectElement>(el, '[data-row="credential"] select'), "kv/old");
    await settle();
    expect(seen.map((v) => [v.provider, v.endpoint, v.deployment, v.credentialRef])).toEqual([
      ["compatible", "https://models.example.com", "assistant", "kv/prod"],
      ["compatible", "https://other.example.com/v1", "assistant", "kv/prod"],
      ["compatible", "https://other.example.com/v1", "assistant-mini", "kv/prod"],
      ["compatible", "https://other.example.com/v1", "assistant-mini", "kv/old"],
    ]);
    // The same value again fires nothing
    change(endpoint(el), "https://other.example.com/v1");
    await settle();
    expect(seen).toHaveLength(4);
    expect(el.querySelector(".ui-prv__error")).toBeNull();
    change(endpoint(el), "ftp://files.example.com");
    await settle();
    expect(endpoint(el).getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(endpoint(el).getAttribute("aria-describedby")!)!.textContent).toBe("Use an http:// or https:// URL.");
    change(endpoint(el), "models");
    await settle();
    expect($(el, ".ui-prv__error").textContent).toBe("That isn't a URL – start with https://");
  });

  test("the credential is a reference shown masked; an expired one says so", async () => {
    const el = await mount();
    const select = $<HTMLSelectElement>(el, '[data-row="credential"] select');
    expect([...select.options].map((o) => o.textContent)).toEqual(["No credential", "Production key", "Old key"]);
    const key = $(el, ".ui-prv__key");
    expect(key.textContent!.replace(/\s+/g, " ").trim()).toBe("••••ending 4f2aExpires 14 Jan");
    expect(select.getAttribute("aria-describedby")!.split(" ").map((id) => document.getElementById(id)!.textContent!.replace(/\s+/g, " ").trim())).toEqual([
      "••••ending 4f2aExpires 14 Jan",
      "Your server looks the key up – it never reaches this page.",
    ]);
    change(select, "kv/old");
    await settle();
    expect($(el, ".ui-prv__key").hasAttribute("data-expired")).toBe(true);
    change(select, "");
    await settle();
    expect(el.value.credentialRef).toBe("");
    expect(el.querySelector(".ui-prv__key")).toBeNull();
    // A reference the list doesn't have stays visible rather than silently switching
    el.value = { ...VALUE, credentialRef: "kv/elsewhere" };
    await settle();
    expect(select.selectedOptions[0].textContent).toBe("kv/elsewhere (not found)");
  });

  test("without a list the reference is typed in, and a pasted key is refused – it never enters the value", async () => {
    const el = await fixture<TcProviderConnection>(html`<tc-provider-connection .value=${VALUE}></tc-provider-connection>`);
    await open(el);
    const input = $<HTMLInputElement>(el, '[data-row="credential"] input');
    const seen: string[] = [];
    on(el, "tc-value-change", (e) => seen.push(e.detail.value.credentialRef));
    change(input, "sk-proj-abcdEFGH1234ijklMNOP5678");
    await settle();
    expect(seen).toEqual([]);
    expect(el.value.credentialRef).toBe("kv/prod");
    expect(input.value).toBe("kv/prod");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect($(el, ".ui-prv__error").textContent).toContain("That looks like a key");
    expect(status(el)).toContain("That looks like a key");
    change(input, "a8F3kd93JdkLm20dkf93kdLm20dkf93kQ");
    await settle();
    expect(seen).toEqual([]);
    change(input, "vault://models/support");
    await settle();
    expect(seen).toEqual(["vault://models/support"]);
    expect(el.querySelector(".ui-prv__error")).toBeNull();
  });

  test("Test fires tc-test with the value and a signal, shows Testing… with Cancel, and ends when the app sets check", async () => {
    const el = await mount();
    const detail = await runTest(el);
    expect(detail.value).toEqual(VALUE);
    expect(detail.signal.aborted).toBe(false);
    expect(el.health).toBe("testing");
    expect(pill(el)).toBe("Status: Testing");
    expect(health(el)[0]).toBe("Testing the connection…");
    expect(status(el)).toBe("Testing the connection…");
    expect(testBtn(el).textContent!.trim()).toBe("Cancel");
    // A second press cancels rather than starting another test
    const check: ProviderConnectionCheck = { status: "healthy", at: "09:42", latencyMs: 182.4, models: MODELS };
    el.check = check;
    await settle();
    expect(detail.signal.aborted).toBe(false);
    expect(el.health).toBe("healthy");
    expect(el.dataset.state).toBe("healthy");
    expect(pill(el)).toBe("Status: Connected");
    expect(health(el)).toEqual(["Connected", "The endpoint answered and reports 2 models."]);
    expect($(el, ".ui-prv__meta").textContent).toBe("Checked 09:42 · 182 ms");
    expect(status(el)).toBe("Connected. The endpoint answered and reports 2 models.");
    const models = $(el, ".ui-prv__models");
    expect(document.getElementById(models.getAttribute("aria-labelledby")!)!.textContent).toBe("Models the endpoint reports2");
    expect([...models.querySelectorAll(".ui-prv__chip")].map((m) => m.textContent!.replace(/\s+/g, " ").trim())).toEqual(["Largeassistantin use", "Smallassistant-mini"]);
    expect(models.querySelector(".ui-prv__chip[data-current]")!.getAttribute("title")).toBe("128k context");
    expect(testBtn(el).textContent!.trim()).toBe("Test connection");
    // The deployment field offers the reported models
    const list = document.getElementById($<HTMLInputElement>(el, '[data-row="deployment"] input').getAttribute("list")!)!;
    expect([...list.querySelectorAll("option")].map((o) => o.value)).toEqual(["assistant", "assistant-mini"]);
  });

  test("Cancel, Escape, an edit and leaving the page each abort the test", async () => {
    const el = await mount();
    let d = await runTest(el);
    testBtn(el).click();
    await settle();
    expect(d.signal.aborted).toBe(true);
    expect(el.health).toBe("untested");
    expect(status(el)).toBe("Test cancelled.");
    d = await runTest(el);
    testBtn(el).focus();
    testBtn(el).dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    await settle();
    expect(d.signal.aborted).toBe(true);
    expect(el.health).toBe("untested");
    // Focus stays on the button, which reads Test connection again
    expect(document.activeElement).toBe(testBtn(el));
    d = await runTest(el);
    change($<HTMLInputElement>(el, '[data-row="deployment"] input'), "assistant-mini");
    await settle();
    expect(d.signal.aborted).toBe(true);
    expect(status(el)).toBe("Test cancelled – the connection changed.");
    d = await runTest(el);
    el.remove();
    expect(d.signal.aborted).toBe(true);
  });

  test("each health state reads plainly; the app's message wins; a missing deployment is listed as not offered", async () => {
    const el = await mount();
    const cases: [ProviderConnectionCheck, string, string, string][] = [
      [{ status: "auth-failed" }, "Auth failed", "Authentication failed", "The endpoint turned the credential down. Check that the reference points at the right key."],
      [{ status: "expired" }, "Credential expired", "The credential has expired", "Rotate the key in your secrets store, then test again."],
      [{ status: "unreachable" }, "Unreachable", "Can't reach the endpoint", "Nothing answered at that URL. Check it, and that your network allows the connection."],
      [{ status: "model-unavailable", models: [MODELS[1]] }, "Model unavailable", "Model unavailable", "The endpoint answered, but doesn't offer assistant."],
      [{ status: "auth-failed", message: "401 – the key isn't valid for this resource." }, "Auth failed", "Authentication failed", "401 – the key isn't valid for this resource."],
    ];
    for (const [check, label, title, detail] of cases) {
      el.check = check;
      await settle();
      expect([pill(el), ...health(el)]).toEqual([`Status: ${label}`, title, detail]);
      expect(testBtn(el).textContent!.trim()).toBe("Test again");
    }
    el.check = { status: "model-unavailable", models: [MODELS[1]] };
    await settle();
    const rows = [...el.querySelectorAll(".ui-prv__chip")];
    expect(rows[0].hasAttribute("data-missing")).toBe(true);
    expect(rows[0].textContent!.replace(/\s+/g, " ").trim()).toBe("assistantnot offered");
    expect($(el, ".ui-prv__health").dataset.tone).toBe("warning");
    // The app's names for the states
    el.stateLabels = { "model-unavailable": "Model missing" };
    await settle();
    expect(pill(el)).toBe("Status: Model missing");
    el.check = { status: "healthy", models: [] };
    await settle();
    expect($(el, ".ui-prv__empty").textContent).toBe("The endpoint reported no models.");
    expect(el.querySelector(".ui-prv__meta")).toBeNull();
  });

  test("a check belongs to the config it tested: an edit afterwards makes it stale", async () => {
    const el = await fixture<TcProviderConnection>(html`<tc-provider-connection .value=${VALUE} .check=${{ status: "healthy", at: "09:42", models: MODELS }}></tc-provider-connection>`);
    await open(el);
    expect(el.health).toBe("healthy");
    change(endpoint(el), "https://elsewhere.example.com");
    await settle();
    expect(el.health).toBe("untested");
    expect(health(el)).toEqual(["Not tested yet", "The connection changed after the last check – test it again."]);
    expect(el.querySelector(".ui-prv__models")).toBeNull();
    // Putting it back makes the check current again
    change(endpoint(el), VALUE.endpoint);
    await settle();
    expect(el.health).toBe("healthy");
  });

  test("Enter in the endpoint commits it and tests; an invalid endpoint is never tested", async () => {
    const el = await mount();
    const tests: ProviderConnectionValue[] = [];
    on(el, "tc-test", (e) => tests.push(e.detail.value));
    const input = endpoint(el);
    input.value = "https://typed.example.com";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    await settle();
    await settle();
    expect(el.value.endpoint).toBe("https://typed.example.com");
    expect(tests.map((v) => v.endpoint)).toEqual(["https://typed.example.com"]);
    el.cancel();
    el.value = { ...VALUE, endpoint: "" };
    await settle();
    testBtn(el).click();
    await settle();
    await settle();
    expect(tests).toHaveLength(1);
    expect(el.health).toBe("untested");
    expect($(el, ".ui-prv__error").textContent).toBe("Enter the endpoint's URL.");
    expect(document.activeElement).toBe(endpoint(el));
  });

  test("controlled: preventDefault keeps the value; a prevented tc-test shows nothing as testing", async () => {
    const el = await mount();
    on(el, "tc-value-change", (e) => e.preventDefault());
    change(endpoint(el), "https://other.example.com");
    change($<HTMLSelectElement>(el, '[data-row="credential"] select'), "kv/old");
    await settle();
    expect(el.value).toEqual(VALUE);
    expect(endpoint(el).value).toBe(VALUE.endpoint);
    expect($<HTMLSelectElement>(el, '[data-row="credential"] select').value).toBe("kv/prod");
    on(el, "tc-test", (e) => e.preventDefault());
    testBtn(el).click();
    await settle();
    expect(el.health).toBe("untested");
  });

  test("form: JSON value with references only, invalid endpoint, reset, disabled fieldset", async () => {
    const form = await fixture<HTMLFormElement>(html`<form><fieldset><tc-provider-connection name="conn" .credentials=${CREDENTIALS} .value=${VALUE}></tc-provider-connection></fieldset></form>`);
    const el = form.querySelector<TcProviderConnection>("tc-provider-connection")!;
    await open(el);
    expect(JSON.parse(new FormData(form).get("conn") as string)).toEqual(VALUE);
    expect(form.checkValidity()).toBe(true);
    change(endpoint(el), "not a url");
    await settle();
    expect(form.checkValidity()).toBe(false);
    await runTest(el);
    form.reset();
    await settle();
    expect(el.value).toEqual(VALUE);
    expect(el.health).toBe("untested");
    expect(el.querySelector(".ui-prv__error")).toBeNull();
    expect(form.checkValidity()).toBe(true);
    form.querySelector("fieldset")!.disabled = true;
    await settle();
    await settle();
    expect(el.hasAttribute("data-disabled")).toBe(true);
    expect(new FormData(form).get("conn")).toBeNull();
    expect(endpoint(el).disabled).toBe(true);
    expect(testBtn(el).disabled).toBe(true);
    expect(el.querySelector("select")!.disabled).toBe(true);
  });

  test("React wrapper: uncontrolled survives a re-render; onTest gets the value and signal; controlled stays with the app", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onChange = vi.fn();
    const onTest = vi.fn();
    let rerender: () => void = () => {};
    function App() {
      const [, set] = React.useState(0);
      rerender = () => set((n) => n + 1);
      return React.createElement(ProviderConnection, { title: "Support model", defaultValue: VALUE, credentials: CREDENTIALS, onChange, onTest });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcProviderConnection>("tc-provider-connection")!;
    await act(async () => void (await open(el)));
    expect(el.heading).toBe("Support model");
    await act(async () => change($<HTMLSelectElement>(el, '[data-row="credential"] select'), "kv/old"));
    await settle();
    expect(onChange).toHaveBeenCalledWith({ ...VALUE, credentialRef: "kv/old" });
    await act(async () => rerender());
    await settle();
    expect(el.value.credentialRef).toBe("kv/old");
    await act(async () => testBtn(el).click());
    expect(onTest).toHaveBeenCalledWith({ ...VALUE, credentialRef: "kv/old" }, expect.any(AbortSignal));
    await act(async () => root.render(React.createElement(ProviderConnection, { value: VALUE, onChange })));
    await settle();
    const ctl = host.querySelector<TcProviderConnection>("tc-provider-connection")!;
    await act(async () => void (await open(ctl)));
    await act(async () => change(endpoint(ctl), "https://other.example.com"));
    await settle();
    expect(onChange).toHaveBeenLastCalledWith({ ...VALUE, endpoint: "https://other.example.com" });
    expect(ctl.value).toEqual(VALUE);
    expect(endpoint(ctl).value).toBe(VALUE.endpoint);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const)
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-provider-connection .providers=${PROVIDERS} .credentials=${CREDENTIALS} .value=${VALUE} .check=${{ status: "healthy", at: "09:42", latencyMs: 120, models: MODELS }} description="Production"></tc-provider-connection>
        <tc-provider-connection look="clean" heading="Clean" .providers=${PROVIDERS} .credentials=${CREDENTIALS} .value=${{ ...VALUE, credentialRef: "kv/old" }} .check=${{ status: "model-unavailable", models: [MODELS[1]] }}></tc-provider-connection>
        <tc-provider-connection heading="Failed" .value=${{ ...VALUE, endpoint: "nope" }} .check=${{ status: "auth-failed" }}></tc-provider-connection>
        <tc-provider-connection look="clean" heading="Expired" .value=${VALUE} .check=${{ status: "expired" }}></tc-provider-connection>
      </div>`);
      const [, , failed] = wrap.querySelectorAll<TcProviderConnection>("tc-provider-connection");
      testBtn(failed).click();
      await settle();
      for (const a of document.getAnimations()) if (a.effect?.getTiming().iterations !== Infinity) a.finish();
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });

  test("theme and motion: no .dark colours; reduced motion turns animation and transitions off", () => {
    const css = (customElements.get("tc-provider-connection") as unknown as { css: string }).css;
    expect(css).not.toMatch(/\.dark|data-(?:tc-)?theme/);
    expect(css).toMatch(/prefers-reduced-motion[^{]*\{\s*\[data-ui="prv"\] \*[^{]*\{ animation: none !important; transition: none !important; \}/);
  });
});
