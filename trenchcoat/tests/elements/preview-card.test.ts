/*
 * <tc-preview-card> in real browsers: the parts and their words, link or button, the whole card as the title's hit
 * area, live previews kept out of reach and scaled, the badge, loading, horizontal, the React wrapper and axe in both
 * looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/preview-card";
import type { TcPreviewCard } from "../../src/elements/preview-card";
import { PreviewCard } from "../../src/elements/react/preview-card";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const PIXEL = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";
const link = (el: Element) => el.querySelector<HTMLElement>(".ui-pvc__link")!;
const centre = (el: Element) => {
  const r = el.getBoundingClientRect();
  return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
};

describe("tc-preview-card", () => {
  for (const look of ["standard", "clean"]) {
    test(`${look}: a heading holding the one stop, the description and the picture`, async () => {
      const el = await fixture<TcPreviewCard>(html`<tc-preview-card look=${look} heading="Agent Cursors" description="Agents in a document" src=${PIXEL} alt=""></tc-preview-card>`);
      expect(el.dataset.ui).toBe("pvc");
      expect(el.dataset.look).toBe(look);
      const title = el.querySelector(".ui-pvc__title")!;
      expect(title.getAttribute("role")).toBe("heading");
      expect(title.getAttribute("aria-level")).toBe("3");
      expect(link(el).tagName).toBe("BUTTON");
      expect(link(el).textContent).toBe("Agent Cursors");
      expect(el.querySelector(".ui-pvc__description")!.textContent).toBe("Agents in a document");
      expect(el.querySelector<HTMLImageElement>(".ui-pvc__img")!.alt).toBe("");
      expect(el.querySelectorAll("a, button, [tabindex]")).toHaveLength(1);
    });
  }

  test("the whole card is the title's hit area, and tc-open says where it goes", async () => {
    const el = await fixture<TcPreviewCard>(html`<tc-preview-card heading="Agent Cursors" description="Agents in a document" style="width: 300px"></tc-preview-card>`);
    const seen: unknown[] = [];
    el.addEventListener("tc-open", (e) => seen.push((e as CustomEvent).detail));
    expect(centre(el.querySelector(".ui-pvc__frame")!)).toBe(link(el));
    expect(centre(el.querySelector(".ui-pvc__description")!)).toBe(link(el));
    link(el).click();
    expect(seen).toEqual([{ href: null }]);
  });

  test("with href it's a link, and preventing tc-open keeps the page where it is", async () => {
    const el = await fixture<TcPreviewCard>(html`<tc-preview-card heading="Agent Cursors" href="#cursors"></tc-preview-card>`);
    expect(link(el).tagName).toBe("A");
    el.addEventListener("tc-open", (e) => e.preventDefault());
    let followed = true;
    el.addEventListener("click", (e) => (followed = !e.defaultPrevented));
    link(el).click();
    expect(followed).toBe(false);
    expect(location.hash).not.toBe("#cursors");
  });

  test("live children are inert, unread and under the link; scale lays them out wide and shrinks them to the frame", async () => {
    const el = await fixture<TcPreviewCard>(html`<tc-preview-card heading="Meter" fit="scale" preview-width="800" style="width: 300px"
      ><div id="live" style="background: Canvas"><button id="inside">Inside</button></div></tc-preview-card>`);
    const live = el.querySelector<HTMLElement>("#live")!;
    expect(live.hasAttribute("inert")).toBe(true);
    expect(live.getAttribute("aria-hidden")).toBe("true");
    const frame = el.querySelector<HTMLElement>(".ui-pvc__frame")!;
    await expect.poll(() => Math.abs(live.getBoundingClientRect().width - frame.getBoundingClientRect().width)).toBeLessThan(1);
    expect(live.offsetWidth).toBe(800);
    expect(Math.abs(live.getBoundingClientRect().height - frame.getBoundingClientRect().height)).toBeLessThan(1);
    expect(centre(frame)).toBe(link(el));
    // a child added later is kept out of reach too
    const later = document.createElement("p");
    el.append(later);
    await expect.poll(() => later.hasAttribute("inert")).toBe(true);
  });

  test("the badge sits at the preview's top right", async () => {
    const el = await fixture<TcPreviewCard>(html`<tc-preview-card heading="A" badge="New" style="width: 300px"></tc-preview-card>`);
    const badge = el.querySelector(".ui-pvc__badge")!.getBoundingClientRect();
    const frame = el.querySelector(".ui-pvc__frame")!.getBoundingClientRect();
    expect(el.querySelector(".ui-pvc__badge")!.textContent).toBe("New");
    expect(badge.right).toBeLessThanOrEqual(frame.right);
    expect(badge.right).toBeGreaterThan(frame.left + frame.width / 2);
    expect(badge.top).toBeLessThan(frame.top + frame.height / 2);
  });

  test("loading shows placeholders and no link, and is busy", async () => {
    const el = await fixture<TcPreviewCard>(html`<tc-preview-card heading="A" description="B" badge="New" loading></tc-preview-card>`);
    expect(el.getAttribute("aria-busy")).toBe("true");
    expect(el.querySelector(".ui-pvc__link")).toBeNull();
    expect(el.querySelector(".ui-pvc__badge")).toBeNull();
    expect(el.querySelectorAll(".ui-pvc__bar")).toHaveLength(3);
    expect(el.querySelector(".ui-pvc__shimmer")).toBeTruthy();
    el.loading = false;
    await settle();
    expect(el.hasAttribute("aria-busy")).toBe(false);
    expect(link(el).textContent).toBe("A");
  });

  test("horizontal puts the preview beside the words", async () => {
    const el = await fixture<TcPreviewCard>(html`<tc-preview-card heading="A" description="B" orientation="horizontal" style="width: 520px"></tc-preview-card>`);
    const frame = el.querySelector(".ui-pvc__frame")!.getBoundingClientRect();
    const body = el.querySelector(".ui-pvc__body")!.getBoundingClientRect();
    expect(frame.right).toBeLessThanOrEqual(body.left + 1);
    expect(frame.top).toBeLessThan(body.bottom);
  });

  test("React: props and children reach the element, and tc-open reaches the page", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const opened: unknown[] = [];
    const draw = (title: string) =>
      act(async () =>
        root.render(React.createElement(PreviewCard, { title, fit: "scale", onTcOpen: (e: CustomEvent) => void opened.push(e.detail) }, React.createElement("div", { id: "kid" }, "x"))),
      );
    await draw("Meter Row");
    await settle();
    const el = host.querySelector<TcPreviewCard>("tc-preview-card")!;
    expect(link(el).textContent).toBe("Meter Row");
    expect(el.querySelector("#kid")!.hasAttribute("inert")).toBe(true);
    await draw("Meter Rows");
    await settle();
    expect(link(el).textContent).toBe("Meter Rows");
    expect(el.querySelectorAll("#kid")).toHaveLength(1);
    await act(async () => link(el).click());
    expect(opened).toEqual([{ href: null }]);
    await act(async () => root.unmount());
    host.remove();
  });

  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`axe: ${look}, ${scheme}`, async () => {
        document.documentElement.style.colorScheme = scheme;
        const wrap = await fixture<HTMLElement>(html`<div style="display: grid; gap: 8px; width: 320px">
          <tc-preview-card look=${look} heading="Agent Cursors" description="Agents in a document" src=${PIXEL} alt="" badge="New" href="#a"></tc-preview-card>
          <tc-preview-card look=${look} heading="Meter" fit="scale"><div><button>Inside</button></div></tc-preview-card>
          <tc-preview-card look=${look} heading="Loading" loading></tc-preview-card>
        </div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        document.documentElement.style.colorScheme = "";
        expect(violations.map((v) => v.id)).toEqual([]);
      });
    }
  }
});
