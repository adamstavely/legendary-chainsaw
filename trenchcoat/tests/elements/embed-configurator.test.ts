/*
 * <tc-embed-configurator> in real browsers: labelled settings, edits that fire a cancelable tc-value-change with the
 * field, starter prompts added, moved (focus kept, announced) and removed, the accent's contrast in words and the
 * colour picker under its swatch, the corner and radius, domains checked as host names, the live preview (and its
 * preview reply), the install snippet, the helpers, the React wrapper, and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/embed-configurator";
import {
  checkEmbedDomain,
  defaultEmbedConfig,
  describeEmbedAccent,
  embedSnippet,
  type EmbedConfig,
  type EmbedConfigChange,
  type TcEmbedConfigurator,
} from "../../src/elements/embed-configurator";
import type { TcEmbedWidget } from "../../src/elements/embed-widget";
import { EmbedConfigurator } from "../../src/elements/react/embed-configurator";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const config: EmbedConfig = {
  title: "Ask the Institute",
  greeting: "Hi! How can I help?",
  starters: ["Opening hours?", "Request a dataset", "Annual report"],
  accent: "#0f766e",
  position: "right",
  radius: 16,
  launcherLabel: "Chat with us",
  domains: ["institute.example.org"],
};

async function make(extra: { look?: string; value?: EmbedConfig } = {}) {
  return fixture<TcEmbedConfigurator>(
    html`<tc-embed-configurator look=${extra.look ?? "standard"} heading="Help widget" widget-id="inst-help" .value=${extra.value ?? config}></tc-embed-configurator>`,
  );
}

const byLabel = (el: Element, text: string) => {
  const label = [...el.querySelectorAll("label")].find((l) => l.textContent!.trim() === text)!;
  return el.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${CSS.escape(label.htmlFor)}`)!;
};
const typeInto = (input: HTMLInputElement | HTMLTextAreaElement, text: string) => {
  input.value = text;
  input.dispatchEvent(new Event("input", { bubbles: true }));
};
const widget = (el: Element) => el.querySelector<TcEmbedWidget>("tc-embed-widget")!;
const changes = (el: Element) => {
  const out: EmbedConfigChange[] = [];
  el.addEventListener("tc-value-change", (e) => {
    if (e.target === el) out.push((e as CustomEvent<EmbedConfigChange>).detail);
  });
  return out;
};
const starterInputs = (el: Element) => [...el.querySelectorAll<HTMLInputElement>(".ui-emc__starter input")];

describe("tc-embed-configurator", () => {
  test("the host is the root in either look; labelled fields filled from the value; the preview reflects it", async () => {
    for (const look of ["standard", "clean"]) {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("emc");
      expect(el.dataset.look).toBe(look);
      expect(byLabel(el, "Title").value).toBe("Ask the Institute");
      expect(byLabel(el, "Greeting").value).toBe("Hi! How can I help?");
      expect(byLabel(el, "Launcher label").value).toBe("Chat with us");
      expect((byLabel(el, "Corner radius") as HTMLInputElement).valueAsNumber).toBe(16);
      expect(starterInputs(el).map((i) => i.value)).toEqual(config.starters);
      const w = widget(el);
      expect(w.open).toBe(true);
      expect(w.theme).toMatchObject({ accent: "#0f766e", title: "Ask the Institute", radius: 16, position: "right" });
      expect(w.starters.map((s) => s.text)).toEqual(config.starters);
    }
  });

  test("editing a field fires tc-value-change with the whole value and the field; prevented, the value stays", async () => {
    const el = await make();
    const seen = changes(el);
    typeInto(byLabel(el, "Title"), "Help desk");
    await settle();
    expect(seen.at(-1)).toEqual({ value: { ...config, title: "Help desk" }, field: "title" });
    expect(el.value.title).toBe("Help desk");
    expect(widget(el).theme.title).toBe("Help desk");
    el.addEventListener("tc-value-change", (e) => e.preventDefault());
    typeInto(byLabel(el, "Launcher label"), "Ask us");
    await settle();
    expect(el.value.launcherLabel).toBe("Chat with us");
    expect(byLabel(el, "Launcher label").value).toBe("Chat with us");
  });

  test("radius from the slider, side from the segmented control", async () => {
    const el = await make();
    const seen = changes(el);
    const range = byLabel(el, "Corner radius") as HTMLInputElement;
    range.value = "8";
    range.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(el.value.radius).toBe(8);
    expect(range.getAttribute("aria-valuetext")).toBe("8 px");
    const left = [...el.querySelectorAll<HTMLElement>("tc-segmented-control [role='radio']")].find((r) => r.textContent!.includes("Left"))!;
    left.click();
    await settle();
    expect(el.value.position).toBe("left");
    expect(seen.map((c) => c.field)).toEqual(["radius", "position"]);
    expect(widget(el).dataset.side).toBe("left");
  });

  test("starter prompts: labelled per prompt; move keeps focus and is announced; remove and add move focus sensibly", async () => {
    const el = await make();
    const rows = [...el.querySelectorAll(".ui-emc__starter")];
    expect(rows[1].querySelector("label")!.textContent).toBe("Prompt 2");
    expect(rows[0].querySelector<HTMLButtonElement>('[id$="-up"]')!.disabled).toBe(true);
    // Move "Request a dataset" up
    rows[1].querySelector<HTMLButtonElement>('[id$="-up"]')!.click();
    await settle();
    expect(el.value.starters).toEqual(["Request a dataset", "Opening hours?", "Annual report"]);
    expect(el.querySelector('.ui-emc__sr[role="status"]')!.textContent).toBe("Moved to 1 of 3");
    // At the top its Move up is disabled, so focus is on its Move down
    await expect.poll(() => (document.activeElement as HTMLElement).id).toMatch(/-s0-down$/);
    // Remove the last one: focus goes to the new last field
    el.querySelectorAll<HTMLButtonElement>(".ui-emc__starter")[2].querySelectorAll("button")[2].click();
    await settle();
    expect(el.value.starters).toEqual(["Request a dataset", "Opening hours?"]);
    await expect.poll(() => document.activeElement).toBe(starterInputs(el)[1]);
    // Add: a new empty field, focused; four at most
    el.querySelector<HTMLButtonElement>(".ui-emc__add")!.click();
    await settle();
    expect(el.value.starters).toEqual(["Request a dataset", "Opening hours?", ""]);
    await expect.poll(() => document.activeElement).toBe(starterInputs(el)[2]);
    typeInto(starterInputs(el)[2], "Visit us");
    el.querySelector<HTMLButtonElement>(".ui-emc__add")!.click();
    await settle();
    expect(el.querySelector(".ui-emc__add")).toBeNull();
    expect(el.textContent).toContain("Up to 4 prompts");
    // Empty prompts don't reach the preview
    expect(widget(el).starters.map((s) => s.text)).toEqual(["Request a dataset", "Opening hours?", "Visit us"]);
  });

  test("accent: contrast in words, the picker under the swatch, and a picked colour", async () => {
    const el = await make();
    const checks = () => [...el.querySelectorAll(".ui-emc__checks li")].map((li) => [li.getAttribute("data-ok"), li.textContent!.trim()]);
    expect(checks()).toEqual([
      ["true", "White text on it: 5.4:1 – passes for text"],
      ["true", "On a white page: 5.4:1 – the launcher stands out"],
    ]);
    const change = el.querySelector<HTMLButtonElement>(".ui-emc__accent button")!;
    expect(change.getAttribute("aria-expanded")).toBe("false");
    expect(el.querySelector("tc-color-picker")).toBeNull();
    change.click();
    await settle();
    expect(change.getAttribute("aria-expanded")).toBe("true");
    const picker = el.querySelector("tc-color-picker")!;
    expect(picker.closest(".ui-emc__picker")!.id).toBe(change.getAttribute("aria-controls"));
    const seen = changes(el);
    const outer: Event[] = [];
    document.body.addEventListener("tc-value-change", (e) => outer.push(e));
    picker.dispatchEvent(new CustomEvent("tc-value-change", { detail: { value: "#f5c542", rgb: { r: 245, g: 197, b: 66, a: 1 }, cmyk: { c: 0, m: 0, y: 0, k: 0 } }, bubbles: true, cancelable: true }));
    await settle();
    expect(seen.at(-1)?.field).toBe("accent");
    expect(outer.map((e) => e.target)).toEqual([el]);
    expect(el.value.accent).toBe("#f5c542");
    expect(checks()).toEqual([
      ["true", "Dark text on it: 12.2:1 – passes for text"],
      ["false", "On a white page: 1.6:1 – the launcher is hard to see"],
    ]);
  });

  test("domains: host names only, lower-cased; a URL is refused with a reason", async () => {
    const el = await make();
    const input = el.querySelector<HTMLInputElement>("tc-tag-input input")!;
    expect(input.getAttribute("aria-labelledby")).toBeTruthy();
    expect(document.getElementById(input.getAttribute("aria-labelledby")!.split(" ")[0])!.textContent).toBe("Allowed domains");
    expect(checkEmbedDomain("Help.Example.org")).toBeUndefined();
    expect(checkEmbedDomain("*.example.org")).toBeUndefined();
    expect(checkEmbedDomain("localhost")).toBeUndefined();
    expect(checkEmbedDomain("https://example.org")).toBe("Enter the domain only, without https:// or a path.");
    expect(checkEmbedDomain("example.org/help")).toBe("Enter the domain only, without https:// or a path.");
    expect(checkEmbedDomain("not a domain")).toBe("Enter a domain such as help.example.org.");
    const tags = el.querySelector("tc-tag-input")!;
    tags.dispatchEvent(new CustomEvent("tc-value-change", { detail: { value: ["institute.example.org", "Data.Example.org"], added: ["Data.Example.org"], removed: [] }, bubbles: true, cancelable: true }));
    await settle();
    expect(el.value.domains).toEqual(["institute.example.org", "data.example.org"]);
  });

  test("the preview answers a test message as a preview, without firing tc-send out of the configurator", async () => {
    const el = await make();
    const sent: Event[] = [];
    document.body.addEventListener("tc-send", (e) => sent.push(e));
    const w = widget(el);
    const field = w.querySelector<HTMLTextAreaElement>(".ui-emw__field")!;
    typeInto(field, "Hello?");
    await settle();
    field.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    await settle();
    expect(sent).toEqual([]);
    expect(w.messages.map((m) => [m.from, m.text])).toEqual([
      ["visitor", "Hello?"],
      ["assistant", "This is a preview – on your site, the assistant answers here."],
    ]);
  });

  test("the install snippet carries the settings, escaped, and changes with them", async () => {
    const el = await make();
    const code = () => el.querySelector<HTMLElement & { code: string }>("tc-code-block")!.code;
    expect(code()).toBe(
      [
        '<script async src="https://cdn.example.org/assistant/embed.js"',
        '  data-widget="inst-help"',
        '  data-title="Ask the Institute"',
        '  data-greeting="Hi! How can I help?"',
        '  data-accent="#0f766e"',
        '  data-position="right"',
        '  data-radius="16"',
        '  data-launcher="Chat with us"',
        '  data-starters="[&quot;Opening hours?&quot;,&quot;Request a dataset&quot;,&quot;Annual report&quot;]"',
        '  data-domains="institute.example.org"></script>',
      ].join("\n"),
    );
    typeInto(byLabel(el, "Title"), 'Say "hi" <now>');
    await settle();
    expect(code()).toContain('data-title="Say &quot;hi&quot; &lt;now&gt;"');
    expect(embedSnippet(defaultEmbedConfig, { scriptSrc: "/w.js", widgetId: "w" })).toBe(
      ['<script async src="/w.js"', '  data-widget="w"', '  data-title="Assistant"', '  data-greeting="Hi! How can I help?"', '  data-accent="#2563eb"', '  data-position="right"', '  data-radius="16"', '  data-launcher="Chat with us"></script>'].join("\n"),
    );
  });

  test("describeEmbedAccent: null for a value that isn't a hex colour", () => {
    expect(describeEmbedAccent("teal")).toBeNull();
    expect(describeEmbedAccent("#18181b")!.textOk).toBe(true);
  });

  test("labels rename the words", async () => {
    const el = await make();
    el.labels = { title: "Name", addStarter: "New prompt", snippet: "Embed code" };
    await settle();
    expect(byLabel(el, "Name").value).toBe("Ask the Institute");
    expect(el.querySelector(".ui-emc__add")!.textContent).toContain("New prompt");
    expect(el.querySelector(".ui-emc__snippet h4")!.textContent).toBe("Embed code");
  });

  test("React wrapper: uncontrolled edits survive a re-render; controlled value stays until the parent changes it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onValueChange = vi.fn();
    function App() {
      const [n, setN] = React.useState(0);
      return React.createElement(
        "div",
        null,
        React.createElement("button", { id: "rr", onClick: () => setN(n + 1) }, `re-render ${n}`),
        React.createElement(EmbedConfigurator, { id: "u", title: "Widget", defaultValue: config, onValueChange }),
        React.createElement(EmbedConfigurator, { id: "c", value: config }),
      );
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const u = host.querySelector<TcEmbedConfigurator>("#u")!;
    const c = host.querySelector<TcEmbedConfigurator>("#c")!;
    expect(u.heading).toBe("Widget");
    await act(async () => typeInto(byLabel(u, "Title"), "Help desk"));
    await settle();
    expect(onValueChange).toHaveBeenCalledWith({ ...config, title: "Help desk" }, "title");
    await act(async () => host.querySelector<HTMLButtonElement>("#rr")!.click());
    await settle();
    expect(u.value.title).toBe("Help desk");
    await act(async () => typeInto(byLabel(c, "Title"), "Changed"));
    await settle();
    expect(c.value.title).toBe("Ask the Institute");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const)
    for (const look of ["standard", "clean"] as const)
      test(`axe: no violations (${look}, ${theme})`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-tc-theme=${theme} style="background: var(--tc-surface-base); padding: 8px">
          <tc-embed-configurator look=${look} heading="Help widget" description="Style the chat visitors see" .value=${{ ...config, accent: "#f5c542" }}></tc-embed-configurator>
        </div>`);
        wrap.querySelector<HTMLButtonElement>(".ui-emc__accent button")!.click();
        await settle();
        await finish(wrap);
        const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ") + " " + n.failureSummary).join(", ")}`)).toEqual([]);
      });
});
