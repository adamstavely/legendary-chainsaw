/*
 * <tc-quickstart> in real browsers: the language tabs and their keyboard, the four steps, the masked key with Reveal,
 * Copy with the real key and its warning, the snippets per language, Run it with the response, the remembered
 * language, renamed labels, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import "../../src/elements/quickstart";
import {
  maskKey,
  quickstartSnippet,
  type QuickstartCopy,
  type QuickstartEndpoint,
  type QuickstartLanguageChange,
  type QuickstartRun,
  type TcQuickstart,
} from "../../src/elements/quickstart";
import { Quickstart } from "../../src/elements/react/quickstart";
import { cleanup, finish, fixture, settle } from "./helpers";

const KEY = "sk-test-0000a1b2c3d4e5f60000";
const ENDPOINT: QuickstartEndpoint = { method: "POST", path: "/v1/records/search", body: { query: "travel policy", exact: false } };
const STORE = "tc-qks-test-language";

let writes: string[] = [];
beforeEach(() => {
  writes = [];
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => void writes.push(text) } });
  try {
    localStorage.removeItem(STORE);
  } catch {
    // ignore
  }
});
afterEach(cleanup);

const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcQuickstart>(html`<tc-quickstart look=${look} base-url="https://records.example.org/" .endpoint=${ENDPOINT} api-key=${KEY} env-var="RECORDS_API_KEY"></tc-quickstart>`);
const tabs = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
const code = (el: Element, step: string) => el.querySelector(`[data-step="${step}"] .ui-qks__pre`)!.textContent!;
const copyBtn = (el: Element, step: string) => el.querySelector<HTMLButtonElement>(`.ui-qks__copy[data-step="${step}"]`)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-quickstart", () => {
  test("maskKey and the snippets for each language", () => {
    expect(maskKey(KEY)).toBe("sk-test-••••••••0000");
    expect(maskKey("short")).toBe("•••••");
    expect(maskKey("")).toBe("");
    const curl = quickstartSnippet("curl", "https://records.example.org/", ENDPOINT, "RECORDS_API_KEY");
    expect(curl).toContain('curl -X POST "https://records.example.org/v1/records/search"');
    expect(curl).toContain('-H "Authorization: Bearer $RECORDS_API_KEY"');
    expect(curl).toContain("-d '{");
    expect(quickstartSnippet("curl", "https://a.example", { method: "GET", path: "v1/status" })).toBe('curl "https://a.example/v1/status" \\\n  -H "Authorization: Bearer $API_KEY"');
    const py = quickstartSnippet("python", "https://records.example.org", ENDPOINT, "RECORDS_API_KEY");
    expect(py).toContain("requests.post(");
    expect(py).toContain(`os.environ['RECORDS_API_KEY']`);
    expect(py).toContain('"exact": False');
    const ts = quickstartSnippet("typescript", "https://records.example.org", ENDPOINT);
    expect(ts).toContain('method: "POST"');
    expect(ts).toContain("process.env.API_KEY");
    expect(ts).toContain("JSON.stringify(");
    const go = quickstartSnippet("go", "https://records.example.org", ENDPOINT);
    expect(go).toContain('http.NewRequest("POST"');
    expect(go).toContain('"strings"');
    expect(quickstartSnippet("go", "https://a.example", { method: "GET", path: "/v1/status" })).not.toContain('"strings"');
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: tabs with one tab stop, four numbered steps, and the key masked`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("qks");
      expect(el.dataset.look).toBe(look);
      expect(tabs(el).map((t) => t.textContent!.trim())).toEqual(["cURL", "Python", "TypeScript", "Go"]);
      expect(tabs(el).filter((t) => t.tabIndex === 0)).toHaveLength(1);
      expect(tabs(el)[0].getAttribute("aria-selected")).toBe("true");
      const panel = el.querySelector('[role="tabpanel"]')!;
      expect(panel.getAttribute("aria-labelledby")).toBe(tabs(el)[0].id);
      expect(tabs(el)[0].getAttribute("aria-controls")).toBe(panel.id);
      expect([...el.querySelectorAll(".ui-qks__step-title")].map((h) => h.textContent)).toEqual([
        "Step 1: Install",
        "Step 2: Set your key",
        "Step 3: Send a request",
        "Step 4: See the response",
      ]);
      expect(code(el, "install")).toBe("curl --version");
      expect(code(el, "key")).toBe('export RECORDS_API_KEY="sk-test-••••••••0000"');
      expect(code(el, "request")).toContain("$RECORDS_API_KEY");
      expect(code(el, "request")).not.toContain(KEY);
      expect(copyBtn(el, "key").textContent!.replace(/\s+/g, " ").trim()).toBe("Copy Set your key");
      expect(el.querySelector(".ui-qks__response")!.textContent).toContain("Run the request to see its response here.");
    });
  }

  test("Reveal key toggles the key, and Copy copies the real key with a warning", async () => {
    const el = await make();
    const reveal = el.querySelector<HTMLButtonElement>(".ui-qks__reveal")!;
    expect(reveal.getAttribute("aria-pressed")).toBe("false");
    reveal.click();
    await settle();
    expect(reveal.getAttribute("aria-pressed")).toBe("true");
    expect(code(el, "key")).toBe(`export RECORDS_API_KEY="${KEY}"`);
    reveal.click();
    await settle();
    expect(code(el, "key")).toContain("••••");
    const copies: QuickstartCopy[] = [];
    el.addEventListener("tc-copy", (e) => copies.push((e as CustomEvent<QuickstartCopy>).detail));
    copyBtn(el, "key").click();
    await expect.poll(() => writes.length).toBe(1);
    expect(writes[0]).toBe(`export RECORDS_API_KEY="${KEY}"`);
    expect(copies[0]).toMatchObject({ step: "key", containsKey: true });
    await settle();
    expect(el.querySelector(".ui-qks__warning")!.textContent).toContain("this includes your API key");
    expect(el.querySelector('[role="status"]')!.textContent).toContain("this includes your API key");
    expect(copyBtn(el, "key").textContent).toContain("Copied");
    copyBtn(el, "install").click();
    await expect.poll(() => writes.length).toBe(2);
    expect(copies[1]).toMatchObject({ step: "install", text: "curl --version", containsKey: false });
    // Prevented: nothing is copied
    el.addEventListener("tc-copy", (e) => e.preventDefault(), { once: true });
    copyBtn(el, "request").click();
    await settle();
    expect(writes).toHaveLength(2);
  });

  test("tabs: arrows, Home and End move and select; tc-language-change is cancelable", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-language-change", (e) => seen.push((e as CustomEvent<QuickstartLanguageChange>).detail.language));
    tabs(el)[0].focus();
    const at = () => (document.activeElement as HTMLElement | null)?.dataset.language;
    key(document.activeElement!, "ArrowRight");
    await expect.poll(at).toBe("python");
    expect(el.language).toBe("python");
    expect(code(el, "install")).toBe("pip install requests");
    key(document.activeElement!, "End");
    await expect.poll(at).toBe("go");
    key(document.activeElement!, "ArrowRight");
    await expect.poll(at).toBe("curl");
    key(document.activeElement!, "ArrowLeft");
    await expect.poll(at).toBe("go");
    key(document.activeElement!, "Home");
    await expect.poll(at).toBe("curl");
    expect(seen).toEqual(["python", "go", "curl", "go", "curl"]);
    el.addEventListener("tc-language-change", (e) => e.preventDefault(), { once: true });
    tabs(el)[2].click();
    await settle();
    expect(el.language).toBe("curl");
    tabs(el)[2].click();
    await settle();
    expect(el.language).toBe("typescript");
    expect(code(el, "request")).toContain("await fetch(");
  });

  test("storage-key remembers the language", async () => {
    localStorage.setItem(STORE, "go");
    const el = await fixture<TcQuickstart>(html`<tc-quickstart storage-key=${STORE} .endpoint=${ENDPOINT}></tc-quickstart>`);
    expect(el.language).toBe("go");
    el.querySelector<HTMLButtonElement>('[data-language="python"]')!.click();
    await settle();
    expect(localStorage.getItem(STORE)).toBe("python");
    localStorage.setItem(STORE, "cobol");
    const el2 = await fixture<TcQuickstart>(html`<tc-quickstart storage-key=${STORE}></tc-quickstart>`);
    expect(el2.language).toBe("curl");
  });

  test("Run it: a cancelable tc-run with the request, running, then the response", async () => {
    const el = await make();
    const runs: QuickstartRun[] = [];
    el.addEventListener("tc-run", (e) => runs.push((e as CustomEvent<QuickstartRun>).detail));
    el.addEventListener("tc-run", (e) => e.preventDefault(), { once: true });
    const run = el.querySelector<HTMLButtonElement>(".ui-qks__run")!;
    run.click();
    await settle();
    expect(el.running).toBe(false);
    run.click();
    await settle();
    expect(el.running).toBe(true);
    expect(run.getAttribute("aria-disabled")).toBe("true");
    expect(el.querySelector(".ui-qks__response")!.getAttribute("aria-busy")).toBe("true");
    run.click();
    expect(runs).toHaveLength(2);
    expect(runs[1]).toEqual({ language: "curl", method: "POST", url: "https://records.example.org/v1/records/search", body: ENDPOINT.body });
    el.response = '{ "total": 0 }';
    el.responseStatus = "200 OK";
    el.running = false;
    await settle();
    expect(el.querySelector('.ui-qks__response [role="region"]')!.textContent).toBe('{ "total": 0 }');
    expect(el.querySelector(".ui-qks__status")!.textContent).toBe("200 OK");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Response received");
    el.hideRun = true;
    await settle();
    expect(el.querySelector(".ui-qks__run")).toBeNull();
    expect(el.querySelectorAll(".ui-qks__step")).toHaveLength(3);
  });

  test("renamed labels, a subset of languages, and no key", async () => {
    const el = await fixture<TcQuickstart>(html`<tc-quickstart .languages=${["python", "go"]} .labels=${{ languages: { go: "Golang" }, steps: { key: "Add your key" } }}></tc-quickstart>`);
    expect(tabs(el).map((t) => t.textContent!.trim())).toEqual(["Python", "Golang"]);
    expect(el.querySelector('[role="tab"][aria-selected="true"]')!.textContent!.trim()).toBe("Python");
    expect(el.querySelector('[data-step="key"] .ui-qks__step-title')!.textContent).toBe("Step 2: Add your key");
    expect(code(el, "key")).toBe('export API_KEY="YOUR_API_KEY"');
    expect(el.querySelector(".ui-qks__reveal")).toBeNull();
  });

  test("React wrapper: uncontrolled language survives re-renders; controlled stays; storage seeds the start", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(Quickstart, { title: "First call", endpoint: ENDPOINT, apiKey: KEY, onLanguageChange: (l) => void seen.push(l), "data-n": n } as React.ComponentProps<typeof Quickstart>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-quickstart")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("First call");
    el.querySelector<HTMLButtonElement>('[data-language="go"]')!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.language).toBe("go");
    expect(seen).toEqual(["go"]);
    await act(async () => root.unmount());

    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    let ran: QuickstartRun | null = null;
    await act(async () =>
      root2.render(
        React.createElement(Quickstart, {
          language: "python",
          onLanguageChange: (l) => void seen.push(l),
          onRun: (r) => {
            ran = r;
            return false;
          },
        }),
      ),
    );
    await settle();
    const el2 = host2.querySelector("tc-quickstart")!;
    el2.querySelector<HTMLButtonElement>('[data-language="go"]')!.click();
    await settle();
    expect(el2.language).toBe("python");
    expect(seen.at(-1)).toBe("go");
    el2.querySelector<HTMLButtonElement>(".ui-qks__run")!.click();
    await settle();
    expect(ran).not.toBeNull();
    expect(el2.running).toBe(false);
    await act(async () => root2.unmount());

    localStorage.setItem(STORE, "typescript");
    const host3 = document.createElement("div");
    document.body.append(host3);
    const root3 = createRoot(host3);
    await act(async () => root3.render(React.createElement(Quickstart, { storageKey: STORE })));
    await settle();
    expect(host3.querySelector("tc-quickstart")!.language).toBe("typescript");
    await act(async () => root3.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-quickstart .endpoint=${ENDPOINT} api-key=${KEY}></tc-quickstart>
        <tc-quickstart look="clean" .endpoint=${ENDPOINT} api-key=${KEY} language="go" .response=${'{ "total": 0 }'} response-status="200 OK"></tc-quickstart>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
