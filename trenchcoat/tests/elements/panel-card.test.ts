/*
 * <tc-panel-card> in real browsers: folding, link mode, the aside, children surviving, the React wrapper and axe in both
 * looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/panel-card";
import type { TcPanelCard } from "../../src/elements/panel-card";
import { PanelCard } from "../../src/elements/react/panel-card";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const button = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-pnc__button")!;
const card = (look = "standard") =>
  fixture<TcPanelCard>(html`<tc-panel-card look=${look} heading="Reports" value="51"><p id="kid">Weekly</p><input id="field" aria-label="Find" /></tc-panel-card>`);

describe("tc-panel-card", () => {
  for (const look of ["standard", "clean"]) {
    test(`${look}: names the row and controls the card`, async () => {
      const el = await card(look);
      expect(el.dataset.ui).toBe("pnc");
      expect(el.dataset.look).toBe(look);
      expect(button(el).closest("h3")).toBeTruthy();
      expect(button(el).getAttribute("aria-expanded")).toBe("false");
      expect(button(el).getAttribute("aria-controls")).toBe(el.id);
      expect(button(el).textContent).toContain("Reports");
      expect(el.querySelector(".ui-pnc__value")!.textContent).toBe("51");
    });
  }

  test("shut content can't be reached, and open content keeps its state", async () => {
    const el = await card();
    const field = el.querySelector<HTMLInputElement>("#field")!;
    expect(getComputedStyle(field).display).toBe("none");
    button(el).click();
    await settle();
    expect(el.expanded).toBe(true);
    expect(getComputedStyle(field).display).not.toBe("none");
    field.value = "kept";
    button(el).click();
    await settle();
    button(el).click();
    await settle();
    expect(el.querySelector("#field")).toBe(field);
    expect(field.value).toBe("kept");
  });

  test("the card grows with its content, which sits inside the white surface", async () => {
    const el = await card();
    const shut = el.offsetHeight;
    el.expanded = true;
    await settle();
    await finish(el);
    expect(el.offsetHeight).toBeGreaterThan(shut);
    const surface = el.querySelector(".ui-pnc__card")!.getBoundingClientRect();
    const kid = el.querySelector("#kid")!.getBoundingClientRect();
    expect(surface.top).toBeLessThanOrEqual(kid.top);
    expect(surface.bottom).toBeGreaterThanOrEqual(kid.bottom);
    expect(surface.bottom).toBeLessThanOrEqual(el.getBoundingClientRect().bottom);
  });

  test("the event says what's next, and preventing it keeps the state", async () => {
    const el = await card();
    const seen: boolean[] = [];
    el.addEventListener("tc-expanded-change", (e) => {
      seen.push((e as CustomEvent).detail.expanded);
      e.preventDefault();
    });
    button(el).click();
    await settle();
    expect(seen).toEqual([true]);
    expect(el.expanded).toBe(false);
  });

  test("a link fires tc-open, has no expanded state and draws no content", async () => {
    const el = await fixture<TcPanelCard>(html`<tc-panel-card mode="link" heading="Reports" expanded><p id="kid">x</p></tc-panel-card>`);
    let opened = 0;
    el.addEventListener("tc-open", () => opened++);
    expect(button(el).hasAttribute("aria-expanded")).toBe(false);
    expect(getComputedStyle(el.querySelector("#kid")!).display).toBe("none");
    button(el).focus();
    button(el).click();
    expect(opened).toBe(1);
  });

  test("the aside stays outside the button, and shows when shut", async () => {
    const el = await fixture<TcPanelCard>(html`<tc-panel-card heading="Storage"><button slot="aside" id="a">Act</button></tc-panel-card>`);
    const aside = el.querySelector("#a")!;
    expect(button(el).contains(aside)).toBe(false);
    expect(getComputedStyle(aside).display).not.toBe("none");
    expect(aside.getBoundingClientRect().top).toBeLessThan(button(el).getBoundingClientRect().bottom);
  });

  test("keeps a page's own id, and bare drops the tray", async () => {
    const el = await fixture<TcPanelCard>(html`<tc-panel-card id="mine" heading="A" bare></tc-panel-card>`);
    expect(button(el).getAttribute("aria-controls")).toBe("mine");
    expect(getComputedStyle(el).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  });

  test("React: uncontrolled survives a re-render, controlled waits for the parent, children stay", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const changes: boolean[] = [];
    const draw = (expanded?: boolean) =>
      act(async () =>
        root.render(
          React.createElement(
            React.Fragment,
            null,
            React.createElement(PanelCard, { title: "A", id: "a" }, React.createElement("p", { id: "pa" }, "x")),
            React.createElement(PanelCard, { title: "B", id: "b", expanded, onExpandedChange: (v: boolean) => changes.push(v) }),
          ),
        ),
      );
    await draw(false);
    await settle();
    const a = host.querySelector<TcPanelCard>("#a")!;
    const b = host.querySelector<TcPanelCard>("#b")!;
    await act(async () => button(a).click());
    await settle();
    await draw(false);
    await settle();
    expect(a.expanded).toBe(true);
    expect(a.querySelector("#pa")).toBeTruthy();
    await act(async () => button(b).click());
    await settle();
    expect(changes).toEqual([true]);
    expect(b.expanded).toBe(false);
    await draw(true);
    await settle();
    expect(b.expanded).toBe(true);
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`axe: ${look}, ${scheme}`, async () => {
        document.documentElement.style.colorScheme = scheme;
        const wrap = await fixture<HTMLElement>(html`<div>
          <tc-panel-card look=${look} heading="Reports" value="51" expanded><p>Weekly</p></tc-panel-card>
          <tc-panel-card look=${look} heading="Storage" value="3 to recalibrate" mode="link"></tc-panel-card>
        </div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        document.documentElement.style.colorScheme = "";
        expect(violations.map((v) => v.id)).toEqual([]);
      });
    }
  }

  test("Standard's white surface sits behind the children, and they can be pressed", async () => {
    const el = await fixture<HTMLElement>(html`<tc-panel-card look="standard" heading="Freezers" expanded><button type="button" id="inside">Inside</button></tc-panel-card>`);
    await finish(el);
    const inside = el.querySelector<HTMLElement>("#inside")!;
    inside.scrollIntoView({ block: "center" });
    const box = inside.getBoundingClientRect();
    expect(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)).toBe(inside);
  });
});
