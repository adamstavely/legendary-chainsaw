/*
 * <tc-content-shield> in real browsers: content absent until revealed, from a template or tc-reveal, hiding again, focus,
 * revealable, controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/content-shield";
import type { ContentShieldReveal, TcContentShield } from "../../src/elements/content-shield";
import { ContentShield } from "../../src/elements/react/content-shield";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const shield = () =>
  fixture<TcContentShield>(html`<tc-content-shield reason="Flagged"
    ><template><p id="secret">Secret</p><button id="inside">Open</button></template></tc-content-shield
  >`);
const reveal = async (el: Element) => {
  el.querySelector<HTMLElement>(".ui-csh__reveal")!.click();
  await settle();
};

describe("tc-content-shield", () => {
  test("hidden content isn't in the page, and the reason and picture are", async () => {
    const el = await shield();
    expect(el.dataset.ui).toBe("csh");
    expect(document.getElementById("secret")).toBeNull();
    expect(el.querySelector("tc-content-hidden")).toBeTruthy();
    expect(el.querySelector(".ui-csh__reason")!.textContent).toBe("Flagged");
  });

  test("revealing clones the template and moves focus to its first control", async () => {
    const el = await shield();
    await reveal(el);
    expect(document.getElementById("secret")).toBeTruthy();
    expect(el.querySelector(".ui-csh__shield")).toBeNull();
    await expect.poll(() => document.activeElement?.id).toBe("inside");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Content shown");
  });

  test("hide removes the content and returns focus", async () => {
    const el = await shield();
    await reveal(el);
    el.querySelector<HTMLElement>(".ui-csh__hide")!.click();
    await settle();
    expect(document.getElementById("secret")).toBeNull();
    await expect.poll(() => document.activeElement).toBe(el.querySelector(".ui-csh__reveal"));
  });

  test("focus goes to Hide when the content has no control", async () => {
    const el = await fixture<TcContentShield>(html`<tc-content-shield><template><p>Text</p></template></tc-content-shield>`);
    await reveal(el);
    await expect.poll(() => document.activeElement).toBe(el.querySelector(".ui-csh__hide"));
  });

  test("tc-reveal gives a container to fill", async () => {
    const el = await fixture<TcContentShield>(html`<tc-content-shield></tc-content-shield>`);
    el.addEventListener("tc-reveal", (e) => {
      (e as CustomEvent<ContentShieldReveal>).detail.container.textContent = "Loaded";
    });
    await reveal(el);
    expect(el.querySelector(".ui-csh__content")!.textContent).toBe("Loaded");
  });

  test("preventDefault keeps it hidden", async () => {
    const el = await shield();
    el.addEventListener("tc-revealed-change", (e) => e.preventDefault());
    await reveal(el);
    expect(el.revealed).toBe(false);
    expect(document.getElementById("secret")).toBeNull();
  });

  test('revealable="false" offers no reveal and shows nothing, even if revealed is set', async () => {
    const el = await fixture<TcContentShield>(html`<tc-content-shield revealable="false" revealed><template><p id="secret">Secret</p></template></tc-content-shield>`);
    expect(el.querySelector(".ui-csh__reveal")).toBeNull();
    expect(el.querySelector(".ui-csh__unavailable")).toBeTruthy();
    expect(document.getElementById("secret")).toBeNull();
  });

  test("labels can be renamed", async () => {
    const el = await fixture<TcContentShield>(html`<tc-content-shield reveal-label="Show photo" hide-label="Hide photo"></tc-content-shield>`);
    expect(el.querySelector(".ui-csh__reveal")!.textContent).toBe("Show photo");
    await reveal(el);
    expect(el.querySelector(".ui-csh__hide")!.textContent).toBe("Hide photo");
  });
});

describe("React", () => {
  const mount = async (node: React.ReactElement) => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    await act(async () => root.render(node));
    await settle();
    return { host, root };
  };

  test("children render only once revealed, and survive a re-render", async () => {
    const node = () => React.createElement(ContentShield, null, React.createElement("p", { id: "kid" }, "Kid"));
    const { host, root } = await mount(node());
    const el = host.querySelector<TcContentShield>("tc-content-shield")!;
    expect(document.getElementById("kid")).toBeNull();
    await act(async () => reveal(el));
    await settle();
    await act(async () => root.render(node()));
    await settle();
    expect(document.getElementById("kid")).toBeTruthy();
    await act(async () => root.unmount());
    host.remove();
  });

  test("controlled stays hidden until the parent changes it", async () => {
    const seen: boolean[] = [];
    const { host, root } = await mount(React.createElement(ContentShield, { revealed: false, onRevealedChange: (r: boolean) => seen.push(r) }));
    const el = host.querySelector<TcContentShield>("tc-content-shield")!;
    await act(async () => reveal(el));
    expect(seen).toEqual([true]);
    expect(el.revealed).toBe(false);
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas`}><tc-content-shield reason="Flagged"></tc-content-shield></div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
