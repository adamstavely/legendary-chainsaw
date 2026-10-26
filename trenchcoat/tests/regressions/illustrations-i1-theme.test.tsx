/*
 * illustrations (agent-team, cover-flow, empty-calendar, enrichment-orbit, ghosted-chat, glass-folder,
 * glow-keyboard, integration-beam, integration-flow, integration-grid): dark mode only worked with a .dark
 * class – their dark colours were .dark-scoped overrides, so data-tc-theme="dark", "system" and the OS setting kept
 * the light art (audit/design-review/themes-and-widths.md H1). Now every colour is light-dark() and each file sets
 * color-scheme for the whole selector list. Also: their decorative loops ran forever; now they're finite.
 * Only glass-folder is still a React file (screens import it); the others' checks moved to tests/elements/.
 */
import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { GlassFolder } from "@illustrations/glass-folder";

const cases: [string, () => ReactElement][] = [
  ["glass-folder", () => <GlassFolder />],
];

/** The component's own stylesheet (React hoists it into <head>) */
const styles = () => [...document.querySelectorAll("style")].map((el) => el.textContent ?? "").join("\n");

describe.each(cases)("%s", (_slug, element) => {
  test("dark follows .dark, data-theme, data-tc-theme and system alike: no theme-scoped rules below the root", () => {
    const { unmount } = render(element());
    const css = styles();
    expect(css).toContain(':where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }');
    expect(css).toContain(':where([data-tc-theme="system"]) { color-scheme: light dark; }');
    // Any rule whose selector names a dark theme may only set color-scheme
    for (const [, selector, body] of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
      if (/\.dark\b|data-(?:tc-)?theme="dark"/.test(selector.replace(/\/\*[\s\S]*?\*\//g, ""))) expect(body.trim()).toBe("color-scheme: dark;");
    }
    unmount();
  });

  test("no endless CSS loop except the ones that rest with the scene", () => {
    const { unmount } = render(element());
    const infinite = [...styles().matchAll(/animation:[^;]*\binfinite\b[^;]*;/g)].map((m) => m[0]);
    // glow-keyboard's floor and glow pause with [data-resting]; agent-team's caret blinks only while typing;
    // integration-beam's dot breathes only while a cycle syncs
    for (const rule of infinite) expect(rule).toMatch(/ui-gk-|ui-at-blink|ui-ib-breathe/);
    unmount();
  });
});
