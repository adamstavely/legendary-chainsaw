/*
 * <tc-collection-card> in real browsers: the parts and their words, counts and labels, the names that fit in two lines,
 * the whole card as one target that keeps its words selectable, previews, the React wrapper and axe in both looks and
 * both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/collection-card";
import type { TcCollectionCard } from "../../src/elements/collection-card";
import { CollectionCard } from "../../src/elements/react/collection-card";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NAMES = Array.from({ length: 40 }, (_, i) => `Component number ${i + 1}`);
const card = (look = "standard") =>
  fixture<TcCollectionCard>(html`<tc-collection-card
    look=${look}
    heading="Components"
    count="273"
    files="273"
    subtitle="Building blocks"
    description="Self-contained pieces."
    .items=${["Agent Cursors", "Agent Findings"]}
  ></tc-collection-card>`);
const action = (el: Element) => el.querySelector<HTMLElement>(".ui-clc__action")!;

describe("tc-collection-card", () => {
  for (const look of ["standard", "clean"]) {
    test(`${look}: a heading with its counts, the words, and one link to tab to`, async () => {
      const el = await card(look);
      expect(el.dataset.ui).toBe("clc");
      expect(el.dataset.look).toBe(look);
      const title = el.querySelector(".ui-clc__title")!;
      expect(title.getAttribute("role")).toBe("heading");
      expect(title.getAttribute("aria-level")).toBe("3");
      expect(title.textContent).toBe("Components");
      expect(el.querySelector(".ui-clc__meta")!.textContent).toBe("273 items · 273 files");
      expect(el.querySelector(".ui-clc__subtitle")!.textContent).toBe("Building blocks");
      expect(el.querySelector(".ui-clc__description")!.textContent).toBe("Self-contained pieces.");
      expect(action(el).tagName).toBe("BUTTON");
      expect(action(el).textContent).toContain("Browse Components");
      expect(action(el).getAttribute("aria-describedby")).toBe(title.id);
      expect(el.querySelectorAll("a, button, [tabindex]")).toHaveLength(1);
    });
  }

  test("counts in the singular, renamed labels, written meta and the heading level", async () => {
    const el = await card();
    el.count = 1;
    el.files = undefined;
    el.headingLevel = 9;
    el.labels = { item: "{n} pattern", action: "See all {heading}" };
    await settle();
    expect(el.querySelector(".ui-clc__meta")!.textContent).toBe("1 pattern");
    expect(el.querySelector(".ui-clc__title")!.getAttribute("aria-level")).toBe("6");
    expect(action(el).textContent).toContain("See all Components");
    el.meta = "Updated weekly";
    el.actionLabel = "Open the library";
    await settle();
    expect(el.querySelector(".ui-clc__meta")!.textContent).toBe("Updated weekly");
    expect(action(el).textContent).toContain("Open the library");
  });

  test("the names show as many as fit in two lines, then … and how many more", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 320px"><tc-collection-card heading="Components" .items=${NAMES}></tc-collection-card></div>`);
    const el = wrap.querySelector<TcCollectionCard>("tc-collection-card")!;
    await expect.poll(() => el.querySelector(".ui-clc__more") !== null).toBe(true);
    const list = el.querySelector<HTMLElement>(".ui-clc__items")!;
    const line = parseFloat(getComputedStyle(list).lineHeight);
    const shown = el.querySelectorAll(".ui-clc__item").length;
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(NAMES.length);
    expect(list.scrollHeight).toBeLessThanOrEqual(line * 2 + 1);
    expect(el.querySelector(".ui-clc__more .tc-sr-only")!.textContent).toBe(`and ${NAMES.length - shown} more`);
    // wider, more of them fit
    wrap.style.width = "720px";
    await expect.poll(() => el.querySelectorAll(".ui-clc__item").length).toBeGreaterThan(shown);
    // all of them fit: no …
    el.items = NAMES.slice(0, 2);
    await expect.poll(() => el.querySelector(".ui-clc__more")).toBeNull();
    expect(el.querySelectorAll(".ui-clc__item")).toHaveLength(2);
  });

  test("a press anywhere on the card opens it, but not one that selects its words", async () => {
    const el = await card();
    const seen: unknown[] = [];
    el.addEventListener("tc-open", (e) => seen.push((e as CustomEvent).detail));
    el.querySelector<HTMLElement>(".ui-clc__description")!.click();
    expect(seen).toEqual([{ href: null }]);
    const words = el.querySelector(".ui-clc__description")!.firstChild!;
    document.getSelection()!.selectAllChildren(words.parentElement!);
    el.querySelector<HTMLElement>(".ui-clc__description")!.click();
    document.getSelection()!.removeAllRanges();
    expect(seen).toHaveLength(1);
    action(el).click();
    expect(seen).toHaveLength(2);
  });

  test("with href it's a link, and preventing tc-open keeps the page where it is", async () => {
    const el = await card();
    el.href = "#elsewhere";
    await settle();
    expect(action(el).tagName).toBe("A");
    expect(action(el).getAttribute("href")).toBe("#elsewhere");
    el.addEventListener("tc-open", (e) => e.preventDefault());
    let followed = true;
    el.addEventListener("click", (e) => (followed = !e.defaultPrevented));
    action(el).click();
    expect(followed).toBe(false);
    expect(location.hash).not.toBe("#elsewhere");
  });

  test("previews: pictures, live elements kept out of reach, placeholders, at most three", async () => {
    const live = document.createElement("button");
    live.textContent = "Live";
    const el = await card();
    el.previews = [{ src: "data:image/gif;base64,R0lGODlhAQABAAAAACw=", alt: "A checklist" }, { alt: "", content: live }, { alt: "Coming soon" }, { alt: "Fourth" }];
    await settle();
    const thumbs = el.querySelectorAll(".ui-clc__thumb");
    expect(thumbs).toHaveLength(3);
    expect(thumbs[0].querySelector("img")!.alt).toBe("A checklist");
    expect(thumbs[1].hasAttribute("inert")).toBe(true);
    expect(thumbs[1].getAttribute("aria-hidden")).toBe("true");
    expect(thumbs[1].contains(live)).toBe(true);
    expect(thumbs[2].getAttribute("role")).toBe("img");
    expect(thumbs[2].getAttribute("aria-label")).toBe("Coming soon");
  });

  test("React: props reach the element, and tc-open reaches the page", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const opened: unknown[] = [];
    await act(async () =>
      root.render(React.createElement(CollectionCard, { title: "Templates", count: 12, items: ["Report"], onTcOpen: (e: CustomEvent) => void opened.push(e.detail) })),
    );
    await settle();
    const el = host.querySelector<TcCollectionCard>("tc-collection-card")!;
    expect(el.querySelector(".ui-clc__title")!.textContent).toBe("Templates");
    expect(el.querySelector(".ui-clc__meta")!.textContent).toBe("12 items");
    await act(async () => action(el).click());
    expect(opened).toEqual([{ href: null }]);
    await act(async () => root.unmount());
    host.remove();
  });

  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`axe: ${look}, ${scheme}`, async () => {
        document.documentElement.style.colorScheme = scheme;
        const wrap = await fixture<HTMLElement>(html`<div>
          <tc-collection-card look=${look} heading="Components" count="273" files="273" subtitle="Building blocks" description="Self-contained pieces." href="#c"
            .items=${NAMES} .previews=${[{ src: "data:image/gif;base64,R0lGODlhAQABAAAAACw=", alt: "A checklist" }, { alt: "" }]}></tc-collection-card>
        </div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        document.documentElement.style.colorScheme = "";
        expect(violations.map((v) => v.id)).toEqual([]);
      });
    }
  }
});
