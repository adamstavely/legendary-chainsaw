/*
 * Illustrations, themes and motion pass:
 * · dark colours lived in `.dark` / [data-theme="dark"] rules, so data-tc-theme="dark", "system" and the OS setting
 *   left the light art (tab-overload, lead-sourcing, outreach-branches, region-dach, world-map: 9–54 % of pixels).
 *   They are light-dark() values now, and every file's theme rule also knows data-tc-theme.
 * · decorative loops ran forever (WCAG 2.2.2); each one now stops by itself after a few cycles.
 */
import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { LayerStack } from "@illustrations/layer-stack";
import { LeadSourcing } from "@illustrations/lead-sourcing";
import { LogoCluster } from "@illustrations/logo-cluster";
import { ModelWheel } from "@illustrations/model-wheel";
import { OutreachBranches } from "@illustrations/outreach-branches";
import { ProjectFlow } from "@illustrations/project-flow";
import { RegionDach } from "@illustrations/region-dach";
import { SideFolder } from "@illustrations/side-folder";
import { TabOverload } from "@illustrations/tab-overload";
import { TeamInvite } from "@illustrations/team-invite";
import { VoiceOrb } from "@illustrations/voice-orb";
import { WorldMap } from "@illustrations/world-map";

const avatar = { src: "data:image/gif;base64,R0lGODlhAQABAAAAACw=" };
const all = [
  ["layer-stack", () => <LayerStack />],
  ["lead-sourcing", () => <LeadSourcing />],
  ["logo-cluster", () => <LogoCluster />],
  ["model-wheel", () => <ModelWheel />],
  ["outreach-branches", () => <OutreachBranches />],
  ["project-flow", () => <ProjectFlow />],
  ["region-dach", () => <RegionDach />],
  ["side-folder", () => <SideFolder />],
  ["tab-overload", () => <TabOverload />],
  ["team-invite", () => <TeamInvite avatars={[avatar, avatar, avatar]} />],
  ["voice-orb", () => <VoiceOrb />],
  ["world-map", () => <WorldMap />],
] as const;

/** The file's own stylesheet (React hoists it into <head> under its href) */
const styles = (slug: string) => document.head.querySelector(`style[data-href="ui-${slug}"], style[href="ui-${slug}"]`)?.textContent ?? "";

describe.each(all)("%s", (slug, element) => {
  test("no colour rule is scoped to .dark / [data-theme=dark]; data-tc-theme switches the scheme", () => {
    render(element());
    const css = styles(slug);
    expect(css, "stylesheet found").not.toBe("");
    // Only the theme rule itself may name the dark selectors – and it must include data-tc-theme
    const scoped = [...css.matchAll(/:where\(\.dark, \[data-theme="dark"\][^)]*\)\s*([^{]*)\{([^}]*)\}/g)];
    for (const [, selector, body] of scoped) {
      expect(selector.trim(), "a dark-scoped rule that isn't the theme rule").toBe("");
      expect(body.trim()).toBe("color-scheme: dark;");
    }
    expect(css).toContain('[data-tc-theme="dark"]) { color-scheme: dark; }');
    expect(css).toContain(':where([data-tc-theme="system"]) { color-scheme: light dark; }');
  });

  test("no endless CSS loop", () => {
    render(element());
    expect(styles(slug)).not.toMatch(/\binfinite\b/);
  });
});

test("the loops that remain stop after a few cycles", () => {
  for (const [, element] of all) render(element());
  const css = (slug: string) => styles(slug);
  expect(css("tab-overload")).toMatch(/animation: ui-to-shimmer var\(--tc-tab-overload-shimmer\) [^;]* 3;/);
  expect(css("team-invite")).toContain("--tc-team-invite-runs: 2.7;");
  expect(css("outreach-branches")).toContain("animation-iteration-count: 3;");
  expect(css("logo-cluster")).toMatch(/ui-lc-spin var\(--tc-logo-cluster-spin\) linear [^;]* 1;/);
  expect(css("region-dach")).toContain("--tc-region-dach-loops: 2;");
  expect(css("world-map")).toContain("--tc-world-map-loops: 2;");
});

test("lead-sourcing's SMIL shine runs three times and freezes", () => {
  const { container } = render(<LeadSourcing />);
  const animates = [...container.querySelectorAll("animate")];
  // jsdom matches no reduced motion, so the shine is there
  expect(animates.length).toBe(2);
  for (const a of animates) {
    expect(a.getAttribute("repeatCount")).toBe("3");
    expect(a.getAttribute("fill")).toBe("freeze");
  }
});
