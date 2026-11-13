/*
 * <tc-endpoint-bar> in real browsers: the method badge, the base URL or environment select, the path with its
 * parameters described, Copy URL and Try it with their events, the badges, renamed labels, narrow width, the React
 * wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import "../../src/elements/endpoint-bar";
import { endpointPathParts, type EndpointCopy, type EndpointEnvironmentChange, type EndpointTry, type TcEndpointBar } from "../../src/elements/endpoint-bar";
import { EndpointBar } from "../../src/elements/react/endpoint-bar";
import { cleanup, finish, fixture, settle } from "./helpers";

const ENVS = [
  { id: "prod", label: "Production", baseUrl: "https://records.example.org/" },
  { id: "staging", label: "Staging", baseUrl: "https://staging.records.example.org" },
];
const PARAMS = [{ name: "record_id", type: "string", description: "The record's ID, e.g. rec_8f2a" }];

let writes: string[] = [];
beforeEach(() => {
  writes = [];
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => void writes.push(text) } });
});
afterEach(cleanup);

const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcEndpointBar>(html`<tc-endpoint-bar look=${look} method="GET" path="/v1/records/{record_id}" .params=${PARAMS} .environments=${ENVS} summary="Get a record"></tc-endpoint-bar>`);
const select = (el: Element) => el.querySelector<HTMLSelectElement>(".ui-epb__env-select")!;
const pick = async (el: Element, value: string) => {
  select(el).value = value;
  select(el).dispatchEvent(new Event("change", { bubbles: true }));
  await settle();
};

describe("tc-endpoint-bar", () => {
  test("endpointPathParts cuts out each {param}", () => {
    expect(endpointPathParts("/v1/records/{record_id}/notes/{note_id}")).toEqual([
      { text: "/v1/records/" },
      { text: "{record_id}", param: "record_id" },
      { text: "/notes/" },
      { text: "{note_id}", param: "note_id" },
    ]);
    expect(endpointPathParts("/v1/status")).toEqual([{ text: "/v1/status" }]);
    expect(endpointPathParts("{id}")).toEqual([{ text: "{id}", param: "id" }]);
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: method, environment, path with a described parameter, summary and actions`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("epb");
      expect(el.dataset.look).toBe(look);
      const method = el.querySelector(".ui-epb__method")!;
      expect(method.textContent).toBe("GET");
      expect(method.getAttribute("data-tone")).toBe("success");
      expect(select(el).value).toBe("prod");
      expect(el.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(select(el).id)}"]`)!.textContent).toBe("Environment");
      expect(el.querySelector(".ui-epb__base")!.textContent).toBe("https://records.example.org");
      expect(el.querySelector(".ui-epb__path")!.textContent!.replace(/\s+/g, "")).toContain("/v1/records/");
      const param = el.querySelector<HTMLButtonElement>(".ui-epb__param")!;
      expect(param.dataset.param).toBe("record_id");
      const tip = el.querySelector(`#${CSS.escape(param.getAttribute("aria-describedby")!)}`)!;
      expect(tip.getAttribute("aria-hidden")).toBe("true");
      expect(tip.textContent).toContain("The record's ID, e.g. rec_8f2a");
      expect(tip.textContent).toContain("string");
      expect(param.querySelector(".tc-sr-only")!.textContent).toBe("Path parameter ");
      expect(el.querySelector(".ui-epb__summary")!.textContent).toBe("Get a record");
      expect(el.querySelector(".ui-epb__copy")!.textContent!.trim()).toBe("Copy URL");
      expect(el.querySelector(".ui-epb__try")!.textContent!.trim()).toBe("Try it");
      expect(el.url).toBe("https://records.example.org/v1/records/{record_id}");
    });
  }

  test("the environment select fires a cancelable tc-environment-change, and the URL follows", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-environment-change", (e) => seen.push((e as CustomEvent<EndpointEnvironmentChange>).detail.environment));
    await pick(el, "staging");
    expect(el.environment).toBe("staging");
    expect(el.url).toBe("https://staging.records.example.org/v1/records/{record_id}");
    expect(el.querySelector(".ui-epb__base")!.textContent).toBe("https://staging.records.example.org");
    el.addEventListener("tc-environment-change", (e) => e.preventDefault(), { once: true });
    await pick(el, "prod");
    expect(el.environment).toBe("staging");
    expect(select(el).value).toBe("staging");
    expect(seen).toEqual(["staging", "prod"]);
  });

  test("Copy URL copies the full URL (cancelable) and Try it fires tc-try with the request", async () => {
    const el = await make();
    const copies: string[] = [];
    const tries: EndpointTry[] = [];
    el.addEventListener("tc-copy", (e) => copies.push((e as CustomEvent<EndpointCopy>).detail.text));
    el.addEventListener("tc-try", (e) => tries.push((e as CustomEvent<EndpointTry>).detail));
    el.querySelector<HTMLButtonElement>(".ui-epb__copy")!.click();
    await expect.poll(() => writes).toEqual(["https://records.example.org/v1/records/{record_id}"]);
    await settle();
    expect(el.querySelector(".ui-epb__copy")!.textContent!.trim()).toBe("Copied");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Copied: https://records.example.org/v1/records/{record_id}");
    el.addEventListener("tc-copy", (e) => e.preventDefault(), { once: true });
    el.querySelector<HTMLButtonElement>(".ui-epb__copy")!.click();
    await settle();
    expect(writes).toHaveLength(1);
    expect(copies).toHaveLength(2);
    el.querySelector<HTMLButtonElement>(".ui-epb__try")!.click();
    expect(tries).toEqual([{ method: "GET", url: "https://records.example.org/v1/records/{record_id}", environment: "prod" }]);
  });

  test("Escape hides a parameter's tooltip until the next hover or focus", async () => {
    const el = await make();
    const param = el.querySelector<HTMLButtonElement>(".ui-epb__param")!;
    param.focus();
    param.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(param.hasAttribute("data-hush")).toBe(true);
    param.blur();
    param.focus();
    expect(param.hasAttribute("data-hush")).toBe(false);
  });

  test("one environment or a plain base URL, method tones, badges, hide-try and renamed labels", async () => {
    const el = await fixture<TcEndpointBar>(html`<tc-endpoint-bar method="DELETE" path="/v1/records/{id}/drafts" base-url="https://a.example/" deprecated beta hide-try></tc-endpoint-bar>`);
    expect(el.querySelector(".ui-epb__env-select")).toBeNull();
    expect(el.querySelector(".ui-epb__base")!.textContent).toBe("https://a.example");
    expect(el.querySelector(".ui-epb__method")!.getAttribute("data-tone")).toBe("danger");
    expect([...el.querySelectorAll(".ui-epb__badge")].map((b) => b.textContent!.trim())).toEqual(["Deprecated", "Beta"]);
    expect(el.querySelector(".ui-epb__try")).toBeNull();
    expect(el.url).toBe("https://a.example/v1/records/{id}/drafts");
    el.method = "POST";
    el.labels = { copy: "Copy link", deprecated: "Retiring" };
    el.environments = [ENVS[1]];
    await settle();
    expect(el.querySelector(".ui-epb__method")!.getAttribute("data-tone")).toBe("info");
    expect(el.querySelector(".ui-epb__copy")!.textContent!.trim()).toBe("Copy link");
    expect(el.querySelector(".ui-epb__badge")!.textContent!.trim()).toBe("Retiring");
    expect(el.querySelector(".ui-epb__env-select")).toBeNull();
    expect(el.querySelector(".ui-epb__base")!.textContent).toBe("https://staging.records.example.org");
    // A parameter with no description still names itself
    expect(el.querySelector(".ui-epb__tip")!.textContent).toBe("id");
  });

  test("narrow: the actions take their own line", async () => {
    const wrap = await fixture<HTMLDivElement>(html`<div style="width: 340px"><tc-endpoint-bar method="GET" path="/v1/records/{record_id}/attachments/{attachment_id}" base-url="https://records.example.org"></tc-endpoint-bar></div>`);
    const el = wrap.querySelector("tc-endpoint-bar")!;
    const line = el.querySelector(".ui-epb__line")!.getBoundingClientRect();
    const actions = el.querySelector(".ui-epb__actions")!.getBoundingClientRect();
    expect(actions.top).toBeGreaterThanOrEqual(line.bottom - 1);
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
  });

  test("React wrapper: uncontrolled environment survives re-renders; controlled stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(EndpointBar, {
        method: "GET",
        path: "/v1/records/{record_id}",
        environments: ENVS,
        onEnvironmentChange: (env) => void seen.push(env),
        onTry: (r) => void seen.push(`try ${r.environment}`),
        "data-n": n,
      } as React.ComponentProps<typeof EndpointBar>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-endpoint-bar")!;
    await pick(el, "staging");
    await act(async () => bump());
    await settle();
    expect(el.environment).toBe("staging");
    el.querySelector<HTMLButtonElement>(".ui-epb__try")!.click();
    expect(seen).toEqual(["staging", "try staging"]);
    await act(async () => root.unmount());

    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    await act(async () =>
      root2.render(React.createElement(EndpointBar, { method: "GET", path: "/v1/x", environments: ENVS, environment: "prod", onEnvironmentChange: (env) => void seen.push(env), onCopyUrl: () => false })),
    );
    await settle();
    const el2 = host2.querySelector("tc-endpoint-bar")!;
    await pick(el2, "staging");
    expect(el2.environment).toBe("prod");
    expect(seen.at(-1)).toBe("staging");
    el2.querySelector<HTMLButtonElement>(".ui-epb__copy")!.click();
    await settle();
    expect(writes).toEqual([]);
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base); display: grid; gap: 8px">
        <tc-endpoint-bar method="GET" path="/v1/records/{record_id}" .params=${PARAMS} .environments=${ENVS} summary="Get a record"></tc-endpoint-bar>
        <tc-endpoint-bar look="clean" method="POST" path="/v1/records/search" base-url="https://records.example.org" beta></tc-endpoint-bar>
        <tc-endpoint-bar look="clean" method="PATCH" path="/v1/records/{id}" base-url="https://records.example.org" deprecated></tc-endpoint-bar>
        <tc-endpoint-bar method="DELETE" path="/v1/records/{id}" base-url="https://records.example.org" hide-try></tc-endpoint-bar>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
