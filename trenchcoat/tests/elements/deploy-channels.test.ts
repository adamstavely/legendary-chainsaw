/*
 * <tc-deploy-channels> in real browsers: order and status words, versions and traffic, actions and their events, Pause
 * and Resume with focus and announcements, controlled use, narrow width, the React wrapper and axe in both looks and
 * both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/deploy-channels";
import { channelActions, orderChannels, type DeployChannel, type TcDeployChannels } from "../../src/elements/deploy-channels";
import { DeployChannels } from "../../src/elements/react/deploy-channels";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const CHANNELS: DeployChannel[] = [
  { id: "sms", kind: "sms", name: "Text messages", status: "not-set-up" },
  { id: "chat", kind: "chat", name: "Team chat", detail: "#policy-questions", status: "draft", version: "draft", traffic: [0, 0, 4, 9] },
  { id: "web", kind: "widget", name: "Intranet widget", status: "live", version: "live", traffic: [100, 200, 300, 400, 500, 600, 400] },
  { id: "email", kind: "email", name: "Email", status: "error", version: "live", error: "Reconnect the mailbox." },
  { id: "api", kind: "api", name: "API", status: "live", version: "live", traffic: [1000, 234] },
];
const make = (look: "standard" | "clean" = "standard", channels = CHANNELS) =>
  fixture<TcDeployChannels>(html`<tc-deploy-channels look=${look} heading="Where Policy Q&amp;A answers" .channels=${channels}></tc-deploy-channels>`);
const ids = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-dpc__row")].map((r) => r.dataset.id);
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-dpc__row[data-id="${id}"]`)!;
const btn = (el: Element, id: string, action: string) => row(el, id).querySelector<HTMLButtonElement>(`[data-action="${action}"]`)!;

describe("tc-deploy-channels", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a named list, live first, then errors, drafts and the ones not set up`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("dpc");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector("ul")!.getAttribute("aria-label")).toBe("Where Policy Q&A answers");
      expect(ids(el)).toEqual(["web", "api", "email", "chat", "sms"]);
      expect(el.querySelector("h3")!.textContent).toBe("Where Policy Q&A answers");
      // Only actions take focus
      expect(el.querySelectorAll("button").length).toBe(el.querySelectorAll(".ui-dpc__action").length);
    });
  }

  test("each status is a word, with the version, the traffic in words and the error", async () => {
    const el = await make();
    const status = (id: string) => row(el, id).querySelector(".ui-dpc__status")!.textContent!.trim();
    expect(["web", "email", "chat", "sms"].map(status)).toEqual(["Live", "Error", "Draft", "Not set up"]);
    expect(row(el, "chat").querySelector(".ui-dpc__version")!.textContent!.trim()).toBe("Draft version");
    expect(row(el, "sms").querySelector(".ui-dpc__version")!.textContent!.trim()).toBe("");
    expect(row(el, "web").querySelector(".ui-dpc__count")!.textContent).toBe("2,500 messages in the last 7 days");
    expect(row(el, "web").querySelector(".ui-dpc__spark")!.getAttribute("aria-hidden")).toBe("true");
    expect(row(el, "email").querySelector(".ui-dpc__count")!.textContent).toBe("No messages yet");
    expect(row(el, "sms").querySelector(".ui-dpc__traffic")!.textContent!.trim()).toBe("");
    expect(row(el, "email").querySelector(".ui-dpc__error")!.textContent).toBe("Reconnect the mailbox.");
    expect(el.querySelector(".ui-dpc__summary")!.textContent!.replace(/\s+/g, " ").trim()).toBe("2 live · 1 need attention");
  });

  test("actions follow the status and are named with their channel", async () => {
    expect(channelActions("not-set-up")).toEqual(["setup"]);
    expect(channelActions("live")).toEqual(["configure", "pause"]);
    expect(channelActions("paused")).toEqual(["configure", "resume"]);
    expect(channelActions("error")).toEqual(["configure"]);
    expect(orderChannels([CHANNELS[0], CHANNELS[2]]).map((c) => c.id)).toEqual(["web", "sms"]);
    const el = await make();
    expect(btn(el, "sms", "setup").textContent!.replace(/\s+/g, " ").trim()).toBe("Set up Text messages");
    expect(btn(el, "web", "pause").textContent!.replace(/\s+/g, " ").trim()).toBe("Pause Intranet widget");
    const seen: unknown[] = [];
    el.addEventListener("tc-channel-action", (e) => seen.push((e as CustomEvent).detail));
    btn(el, "sms", "setup").click();
    btn(el, "chat", "configure").click();
    expect(seen).toEqual([
      { id: "sms", action: "setup", channel: CHANNELS[0] },
      { id: "chat", action: "configure", channel: CHANNELS[1] },
    ]);
    // Nothing changes on its own for those
    expect(el.channels).toBe(CHANNELS);
  });

  test("Pause pauses the row, keeps focus on Resume and says so; Resume brings it back", async () => {
    const el = await make();
    const changes: unknown[] = [];
    el.addEventListener("tc-channels-change", (e) => changes.push((e as CustomEvent).detail.id));
    btn(el, "api", "pause").focus();
    btn(el, "api", "pause").click();
    await settle();
    expect(row(el, "api").dataset.status).toBe("paused");
    expect(row(el, "api").querySelector(".ui-dpc__status")!.textContent!.trim()).toBe("Paused");
    await expect.poll(() => document.activeElement === btn(el, "api", "resume")).toBe(true);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("API paused");
    expect(ids(el)).toEqual(["web", "email", "api", "chat", "sms"]);
    btn(el, "api", "resume").click();
    await settle();
    expect(row(el, "api").dataset.status).toBe("live");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("API is live again");
    expect(changes).toEqual(["api", "api"]);
  });

  test("preventing either event keeps the status", async () => {
    const el = await make();
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener("tc-channel-action", stop);
    btn(el, "web", "pause").click();
    await settle();
    expect(row(el, "web").dataset.status).toBe("live");
    el.removeEventListener("tc-channel-action", stop);
    el.addEventListener("tc-channels-change", stop);
    btn(el, "web", "pause").click();
    await settle();
    expect(row(el, "web").dataset.status).toBe("live");
    expect(el.channels).toBe(CHANNELS);
  });

  test("renamed words, an own icon, empty, and a narrow width that doesn't overflow", async () => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.dataset.mine = "1";
    const el = await make("standard", [{ id: "x", kind: "custom", name: "Kiosk", status: "live", icon }]);
    el.labels = { status: { live: "On air" }, action: { pause: "Hold" } };
    await settle();
    expect(row(el, "x").querySelector(".ui-dpc__status")!.textContent!.trim()).toBe("On air");
    expect(btn(el, "x", "pause").textContent).toContain("Hold");
    expect(row(el, "x").querySelector("[data-mine]")).not.toBeNull();
    el.channels = CHANNELS;
    el.style.width = "340px";
    await settle();
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
    const web = row(el, "web");
    expect(web.querySelector<HTMLElement>(".ui-dpc__actions")!.getBoundingClientRect().top).toBeGreaterThan(web.querySelector<HTMLElement>(".ui-dpc__name")!.getBoundingClientRect().bottom - 1);
    el.channels = [];
    await settle();
    expect(el.querySelector(".ui-dpc__empty")!.textContent).toBe("No channels yet");
  });

  test("React: uncontrolled keeps a pause across re-renders; controlled waits for the parent", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    const root = createRoot(wrap);
    const render = (props: Partial<React.ComponentProps<typeof DeployChannels>>) => act(async () => root.render(React.createElement(DeployChannels, props)));
    await render({ defaultChannels: CHANNELS });
    const el = wrap.querySelector<TcDeployChannels>("tc-deploy-channels")!;
    await settle();
    await act(async () => btn(el, "api", "pause").click());
    await settle();
    await render({ defaultChannels: CHANNELS, description: "Again" });
    await settle();
    expect(row(el, "api").dataset.status).toBe("paused");
    const seen: unknown[] = [];
    const actions: string[] = [];
    await render({ channels: CHANNELS, onChannelsChange: (c) => void seen.push(c), onChannelAction: (d) => void actions.push(d.action) });
    await settle();
    await act(async () => btn(el, "web", "pause").click());
    await settle();
    expect(actions).toEqual(["pause"]);
    expect(seen).toHaveLength(1);
    await expect.poll(() => row(el, "web").dataset.status).toBe("live");
    await render({ channels: CHANNELS, onChannelAction: () => false });
    await settle();
    await act(async () => btn(el, "web", "pause").click());
    await settle();
    expect(row(el, "web").dataset.status).toBe("live");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = document.body.appendChild(document.createElement("div"));
      wrap.style.colorScheme = theme;
      wrap.innerHTML = `<tc-deploy-channels look="standard" heading="A"></tc-deploy-channels><tc-deploy-channels look="clean" heading="B"></tc-deploy-channels>`;
      wrap.querySelectorAll<TcDeployChannels>("tc-deploy-channels").forEach((el) => {
        el.channels = [...CHANNELS, { id: "p", kind: "voice", name: "Phone line", status: "paused", version: "live", traffic: [3, 4] }];
      });
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
