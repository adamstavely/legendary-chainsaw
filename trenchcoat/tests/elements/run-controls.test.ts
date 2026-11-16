/*
 * <tc-run-controls> in real browsers: the states (idle, streaming, stopped, disconnected, done) and their buttons;
 * send, steer, queue, stop, resume, retry and dismiss with their details and preventDefault; mode and permissions;
 * the context ring; the narrow More menu; announcements; renamed labels; the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/run-controls";
import type { RunControlsState, TcRunControls } from "../../src/elements/run-controls";
import { RunControls } from "../../src/elements/react/run-controls";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => cleanup());

const plain = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const make = (o: { look?: string; state?: RunControlsState; width?: number; queue?: string[]; context?: number } = {}) =>
  fixture<TcRunControls>(
    html`<tc-run-controls
      style=${`width: ${o.width ?? 620}px`}
      look=${o.look ?? "standard"}
      state=${o.state ?? "idle"}
      partial="1240"
      .context=${o.context ?? 0.62}
      .queue=${o.queue ?? []}
    ></tc-run-controls>`,
  );
const field = (el: Element) => el.querySelector<HTMLTextAreaElement>(".ui-runc__field")!;
const round = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-runc__round")!;
const btn = (el: Element, name: string) => [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => plain(b.textContent) === name);
/** Every event the element fires, with its detail */
const record = (el: Element, names: string[]) => {
  const seen: [string, unknown][] = [];
  for (const n of names) el.addEventListener(n, (e) => seen.push([n, (e as CustomEvent).detail]));
  return seen;
};

describe("tc-run-controls", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: idle – the field, Send, Chat or Act, permissions and the context`, async () => {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("runc");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".ui-runc__status")).toBeNull();
      expect(field(el).placeholder).toBe("Ask anything");
      expect(plain(round(el).textContent)).toBe("Send");
      expect(round(el).disabled).toBe(true);
      expect([...el.querySelectorAll('[role="radio"]')].map((r) => [plain(r.textContent), r.getAttribute("aria-checked")])).toEqual([
        ["Chat", "true"],
        ["Act", "false"],
      ]);
      expect([...el.querySelectorAll("option")].map((o) => plain(o.textContent))).toEqual(["Ask before acting", "Auto-edit", "Full access"]);
      const meter = el.querySelector(".ui-runc__context")!;
      expect([meter.getAttribute("aria-label"), meter.getAttribute("aria-valuenow"), plain(meter.textContent)]).toEqual(["62% of context", "62", "62% of context"]);
    });
  }

  test("Enter sends: tc-send then tc-state-change to streaming; Shift+Enter is a new line; a prevented send keeps the text", async () => {
    const el = await make();
    const seen = record(el, ["tc-send", "tc-state-change"]);
    field(el).focus();
    await userEvent.keyboard("Draft the needs statement{Shift>}{Enter}{/Shift}please{Enter}");
    await settle(el);
    expect(seen).toEqual([
      ["tc-send", { text: "Draft the needs statement\nplease" }],
      ["tc-state-change", { state: "streaming" }],
    ]);
    expect(el.state).toBe("streaming");
    expect(field(el).value).toBe("");
    el.state = "done";
    await settle(el);
    el.addEventListener("tc-send", (e) => e.preventDefault(), { once: true });
    await userEvent.keyboard("Keep me");
    round(el).click();
    await settle(el);
    expect(field(el).value).toBe("Keep me");
    expect(el.state).toBe("done");
  });

  test("streaming: Stop with the partial count, Escape stops too; typing steers on Enter or queues", async () => {
    const el = await make({ state: "streaming" });
    expect(plain(el.querySelector(".ui-runc__status")!.textContent)).toBe("Answering…");
    expect(plain(round(el).textContent)).toBe("Stop");
    expect(field(el).placeholder).toBe("Steer it, or queue what's next");
    const seen = record(el, ["tc-steer", "tc-queue-change", "tc-stop", "tc-state-change"]);
    field(el).focus();
    await userEvent.keyboard("Cite the census{Enter}");
    await settle(el);
    expect(seen.shift()).toEqual(["tc-steer", { note: "Cite the census" }]);
    await userEvent.keyboard("Then shorten it");
    await settle(el);
    btn(el, "Queue")!.click();
    await settle(el);
    expect(seen.shift()).toEqual(["tc-queue-change", { queue: ["Then shorten it"] }]);
    expect(el.queue).toEqual(["Then shorten it"]);
    expect(plain(el.querySelector(".ui-runc__status")!.textContent)).toBe("Answering… · 1 queued");
    expect([...el.querySelectorAll(".ui-runc__chip")].map((c) => plain(c.textContent))).toEqual(["1Then shorten it Remove Then shorten it"]);
    field(el).focus();
    await userEvent.keyboard("{Escape}");
    await settle(el);
    expect(seen).toEqual([
      ["tc-stop", { partial: 1240 }],
      ["tc-state-change", { state: "stopped" }],
    ]);
    expect(el.state).toBe("stopped");
  });

  test("stopped and disconnected: the count in words, Resume from the partial, Retry and Dismiss", async () => {
    const el = await make({ state: "stopped" });
    expect(plain(el.querySelector(".ui-runc__halt")!.textContent)).toBe("Stopped at 1,240 characters");
    const seen = record(el, ["tc-resume", "tc-retry", "tc-dismiss", "tc-state-change"]);
    btn(el, "Resume")!.click();
    await settle(el);
    expect(seen.splice(0)).toEqual([
      ["tc-resume", { from: 1240 }],
      ["tc-state-change", { state: "streaming" }],
    ]);
    el.state = "disconnected";
    await settle(el);
    expect(plain(el.querySelector(".ui-runc__halt")!.textContent)).toBe("Connection lost at 1,240 characters");
    btn(el, "Retry")!.click();
    await settle(el);
    expect(seen.splice(0)).toEqual([
      ["tc-retry", {}],
      ["tc-state-change", { state: "streaming" }],
    ]);
    el.state = "stopped";
    await settle(el);
    btn(el, "Dismiss")!.click();
    await settle(el);
    expect(seen.splice(0)).toEqual([
      ["tc-dismiss", {}],
      ["tc-state-change", { state: "idle" }],
    ]);
    // Prevented, the state stays
    el.state = "stopped";
    await settle(el);
    el.addEventListener("tc-resume", (e) => e.preventDefault(), { once: true });
    btn(el, "Resume")!.click();
    await settle(el);
    expect(el.state).toBe("stopped");
    el.addEventListener("tc-state-change", (e) => e.preventDefault(), { once: true });
    btn(el, "Retry")!.click();
    await settle(el);
    expect(el.state).toBe("stopped");
  });

  test("queued asks: removed by their chip; preventDefault keeps them", async () => {
    const el = await make({ state: "streaming", queue: ["One", "Two"] });
    const x = () => [...el.querySelectorAll<HTMLButtonElement>(".ui-runc__chip-x")];
    expect(el.querySelector(".ui-runc__queue")!.getAttribute("aria-label")).toBe("2 queued");
    x()[0].click();
    await settle(el);
    expect(el.queue).toEqual(["Two"]);
    el.addEventListener("tc-queue-change", (e) => e.preventDefault());
    x()[0].click();
    await settle(el);
    expect(el.queue).toEqual(["Two"]);
  });

  test("Chat or Act by click and arrow keys, permissions by the select; preventDefault keeps them", async () => {
    const el = await make();
    const seen = record(el, ["tc-mode-change", "tc-permission-change"]);
    const radios = () => [...el.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
    radios()[1].click();
    await settle(el);
    expect(el.mode).toBe("act");
    radios()[1].focus();
    await userEvent.keyboard("{ArrowLeft}");
    await settle(el);
    expect(el.mode).toBe("chat");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.mode).toBe("chat");
    const select = el.querySelector<HTMLSelectElement>("select")!;
    select.value = "full";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle(el);
    expect(el.permission).toBe("full");
    expect(seen).toEqual([
      ["tc-mode-change", { mode: "act" }],
      ["tc-mode-change", { mode: "chat" }],
      ["tc-permission-change", { permission: "full" }],
    ]);
    el.addEventListener("tc-permission-change", (e) => e.preventDefault());
    select.value = "ask";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle(el);
    expect(el.permission).toBe("full");
    expect(select.value).toBe("full");
  });

  test("the context ring turns amber and red; unset hides it", async () => {
    const el = await make({ context: 0.8 });
    expect(el.querySelector(".ui-runc__context")!.getAttribute("data-tone")).toBe("warning");
    el.context = 0.95;
    await settle(el);
    expect(el.querySelector(".ui-runc__context")!.getAttribute("data-tone")).toBe("danger");
    el.context = undefined;
    await settle(el);
    expect(el.querySelector(".ui-runc__context")).toBeNull();
  });

  test("narrow: mode and permissions fold into More, which closes with Escape and gives focus back", async () => {
    const el = await make({ width: 360 });
    await expect.poll(() => !!el.querySelector(".ui-runc__more")).toBe(true);
    const pop = el.querySelector<HTMLElement>(".ui-runc__pop")!;
    expect(pop.hidden).toBe(true);
    expect(plain(el.querySelector(".ui-runc__context-words")!.textContent)).toBe("62%");
    const more = el.querySelector<HTMLButtonElement>(".ui-runc__more")!;
    more.click();
    await settle(el);
    expect(more.getAttribute("aria-expanded")).toBe("true");
    expect(pop.hidden).toBe(false);
    pop.querySelector<HTMLElement>('[role="radio"]')!.focus();
    await userEvent.keyboard("{Escape}");
    await settle(el);
    expect(pop.hidden).toBe(true);
    await expect.poll(() => document.activeElement).toBe(more);
  });

  test("state changes are announced; labels reword it", async () => {
    const el = await fixture<TcRunControls>(html`<tc-run-controls partial="12" .labels=${{ stopped: "Angehalten bei {count} Zeichen", send: "Senden" }}></tc-run-controls>`);
    const status = () => plain(el.querySelector('[role="status"]')!.textContent);
    expect(status()).toBe("");
    expect(plain(round(el).textContent)).toBe("Senden");
    el.state = "streaming";
    await settle(el);
    expect(status()).toBe("Answering…");
    el.state = "stopped";
    await settle(el);
    expect(status()).toBe("Angehalten bei 12 Zeichen");
  });

  test("React: uncontrolled state survives re-renders; controlled state stays until the parent changes it", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: RunControlsState[] = [];
    const stops: number[] = [];
    let rerender: (n: number) => void = () => {};
    function App({ controlled }: { controlled: boolean }) {
      const [, setN] = React.useState(0);
      rerender = setN;
      return React.createElement(RunControls, {
        partial: 99,
        ...(controlled ? { state: "streaming" as const } : { defaultState: "streaming" as const }),
        onStateChange: (s) => seen.push(s),
        onStop: (n) => stops.push(n),
      });
    }
    await act(async () => root.render(React.createElement(App, { controlled: false })));
    await settle();
    let el = host.querySelector<TcRunControls>("tc-run-controls")!;
    expect(el.state).toBe("streaming");
    await act(async () => round(el).click());
    await act(async () => rerender(1));
    await settle();
    expect(el.state).toBe("stopped");
    await act(async () => root.render(React.createElement(App, { controlled: true })));
    await settle();
    el = host.querySelector<TcRunControls>("tc-run-controls")!;
    expect(el.state).toBe("streaming");
    await act(async () => round(el).click());
    await settle();
    expect(el.state).toBe("streaming");
    expect(seen).toEqual(["stopped", "stopped"]);
    expect(stops).toEqual([99, 99]);
    await act(async () => root.unmount());
    host.remove();
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10; color-scheme: dark" : ""}>
        <tc-run-controls style="width: 620px" state="streaming" .context=${0.62} .queue=${["Then shorten the budget notes"]}></tc-run-controls>
        <tc-run-controls style="width: 620px" look="clean" state="stopped" partial="1240" heading="Assistant" .context=${0.93}></tc-run-controls>
        <tc-run-controls style="width: 360px" state="disconnected" partial="12"></tc-run-controls>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
