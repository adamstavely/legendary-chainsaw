import axe from "axe-core";
import { html } from "lit";
import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/agent-face";
import { TcAgentFace } from "../../src/elements/agent-face";
import { AgentFace } from "../../src/elements/react/agent-face";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const inner = (el: TcAgentFace) => el.querySelector("agent-face")!;
const label = (el: TcAgentFace) => inner(el).shadowRoot!.querySelector("canvas")!.getAttribute("aria-label");

describe("tc-agent-face", () => {
  test("draws the face, named for its state", async () => {
    const el = await fixture<TcAgentFace>(html`<tc-agent-face state="thinking" motion="reduced"></tc-agent-face>`);
    await settle(el);
    expect(el.dataset.ui).toBe("afc");
    expect(el.dataset.look).toBeUndefined();
    expect(inner(el).classList.contains("ui-afc__face")).toBe(true);
    expect(label(el)).toBe("Donovan is thinking");
    expect(el.getBoundingClientRect().width).toBe(64);
  });

  test("follows changes to its properties", async () => {
    const el = await fixture<TcAgentFace>(html`<tc-agent-face motion="reduced"></tc-agent-face>`);
    el.state = "error";
    el.size = 26;
    el.name = "Ada";
    await settle(el);
    expect(inner(el).state).toBe("error");
    expect(el.getBoundingClientRect().width).toBe(26);
    expect(label(el)).toBe("Ada hit a problem");
  });

  test("passes labels, the label, announce and amplitude through", async () => {
    const el = await fixture<TcAgentFace>(html`<tc-agent-face motion="reduced" .labels=${{ idle: "Prêt" }} .amplitude=${0.4} announce></tc-agent-face>`);
    await settle(el);
    expect(label(el)).toBe("Prêt");
    expect(inner(el).amplitude).toBe(0.4);
    expect(inner(el).shadowRoot!.querySelector("[role=status]")).not.toBeNull();
    el.label = "Assistant";
    await settle(el);
    expect(label(el)).toBe("Assistant");
  });

  test("plays gestures, except under reduced motion", async () => {
    const full = await fixture<TcAgentFace>(html`<tc-agent-face motion="full"></tc-agent-face>`);
    await settle(full);
    expect(full.playGesture("nod")).toBe(true);
    const still = await fixture<TcAgentFace>(html`<tc-agent-face motion="reduced"></tc-agent-face>`);
    await settle(still);
    expect(still.playGesture("nod")).toBe(false);
  });

  test("takes no tab stop", async () => {
    const el = await fixture<TcAgentFace>(html`<tc-agent-face></tc-agent-face>`);
    await settle(el);
    expect(el.querySelector("[tabindex], button, a")).toBeNull();
  });

  test("works from React, with the element on its ref", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const ref = React.createRef<TcAgentFace>();
    flushSync(() => root.render(React.createElement(AgentFace, { ref, state: "happy", size: 26, motion: "reduced" })));
    await settle(ref.current!);
    expect(ref.current!.tagName).toBe("TC-AGENT-FACE");
    expect(label(ref.current!)).toBe("Donovan is pleased");
    root.unmount();
    host.remove();
  });

  test.each(["light", "dark"])("passes axe in %s", async (theme) => {
    const el = await fixture<TcAgentFace>(html`<div class=${theme}><tc-agent-face state="error" motion="reduced"></tc-agent-face></div>`);
    await settle(el);
    const { violations } = await axe.run(el);
    expect(violations).toEqual([]);
  });
});
