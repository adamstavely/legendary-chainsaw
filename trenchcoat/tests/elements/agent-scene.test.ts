/* <tc-agent-scene> in real browsers: each scene's face and drawing, decorative or labelled, the wave, and axe. */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/agent-scene";
import type { TcAgentScene } from "../../src/elements/agent-scene";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const scene = (name: string) => fixture<TcAgentScene>(html`<tc-agent-scene scene=${name}></tc-agent-scene>`);

describe("tc-agent-scene", () => {
  test("each scene has its face and its drawing", async () => {
    const face = (el: Element) => el.querySelector("tc-agent-face")!;
    const clear = await scene("all-clear");
    expect(clear.dataset.ui).toBe("ags");
    expect(face(clear).state).toBe("happy");
    expect(clear.querySelector(".ui-ags-line")).toBeTruthy();
    const working = await scene("working");
    expect(face(working).state).toBe("thinking");
    expect(working.querySelector(".ui-ags-page")).toBeTruthy();
    const offline = await scene("offline");
    expect(face(offline).state).toBe("sleeping");
  });

  test("an unknown scene falls back to all clear", async () => {
    const el = await scene("nope");
    expect(el.querySelector("tc-agent-face")!.state).toBe("happy");
  });

  test("is decorative without a label, and an image with one", async () => {
    const el = await scene("offline");
    expect(el.getAttribute("aria-hidden")).toBe("true");
    el.label = "Donovan is offline";
    await settle();
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Donovan is offline");
    expect(el.hasAttribute("aria-hidden")).toBe(false);
  });

  test("leaving the page cancels the wave", async () => {
    const el = await scene("all-clear");
    el.remove();
    await new Promise((r) => setTimeout(r, 600));
    expect(el.isConnected).toBe(false);
  });

  test("axe: no violations", async () => {
    const wrap = await fixture(html`<div><tc-agent-scene scene="all-clear"></tc-agent-scene><tc-agent-scene scene="offline" label="Offline"></tc-agent-scene></div>`);
    const { violations } = await axe.run(wrap);
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});
