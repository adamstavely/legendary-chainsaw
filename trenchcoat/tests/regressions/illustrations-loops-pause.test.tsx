/*
 * illustrations (tab-overload, outreach-branches, team-invite, region-dach, world-map, project-flow, lead-sourcing):
 * their CSS / SMIL loops kept running while scrolled off screen or in a hidden tab. Now the root is marked
 * data-paused (the CSS holds the animations there) – and lead-sourcing's SMIL clock is paused.
 * Also: they were announced as images with a made-up description; now they're decorative unless given a label.
 */
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as tabOverload from "@illustrations/tab-overload";
import * as outreach from "@illustrations/outreach-branches";
import * as teamInvite from "@illustrations/team-invite";
import * as leadSourcing from "@illustrations/lead-sourcing";
import * as regionDach from "@illustrations/region-dach";
import * as worldMap from "@illustrations/world-map";
import * as projectFlow from "@illustrations/project-flow";

/** An IntersectionObserver the test reports through */
class ManualObserver {
  static all: ManualObserver[] = [];
  target: Element | null = null;
  constructor(private callback: IntersectionObserverCallback) {
    ManualObserver.all.push(this);
  }
  observe(target: Element) {
    this.target = target;
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
  report(isIntersecting: boolean) {
    this.callback([{ target: this.target, isIntersecting } as unknown as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

beforeEach(() => {
  ManualObserver.all = [];
  vi.stubGlobal("IntersectionObserver", ManualObserver);
});
afterEach(() => vi.unstubAllGlobals());

const avatar = (name?: string) => ({ src: "data:image/gif;base64,R0lGODlhAQABAAAAACw=", name });

const cases = [
  ["tab-overload", () => <tabOverload.TabOverload />],
  ["outreach-branches", () => <outreach.OutreachBranches />],
  ["team-invite", () => <teamInvite.TeamInvite avatars={[avatar(), avatar(), avatar()]} />],
  ["region-dach", () => <regionDach.RegionDach />],
  ["world-map", () => <worldMap.WorldMap />],
  ["project-flow", () => <projectFlow.ProjectFlow />],
] as const;

describe.each(cases)("%s", (_slug, element) => {
  test("the root is paused while off screen, and resumes when back", () => {
    const { container } = render(element());
    const root = container.firstElementChild!;
    const observer = ManualObserver.all.find((o) => o.target === root)!;
    expect(observer, "the root is observed").toBeTruthy();
    expect(root.hasAttribute("data-paused")).toBe(false);
    act(() => observer.report(false));
    expect(root.hasAttribute("data-paused")).toBe(true);
    act(() => observer.report(true));
    expect(root.hasAttribute("data-paused")).toBe(false);
  });

  test("a hidden tab pauses it too", () => {
    const { container } = render(element());
    const root = container.firstElementChild!;
    const hidden = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    try {
      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });
      expect(root.hasAttribute("data-paused")).toBe(true);
    } finally {
      hidden.mockRestore();
    }
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(root.hasAttribute("data-paused")).toBe(false);
  });
});

test("lead-sourcing pauses its SMIL shine with the SVG's own clock", () => {
  const pause = vi.fn();
  const unpause = vi.fn();
  const proto = SVGSVGElement.prototype as unknown as Record<string, unknown>;
  proto.pauseAnimations = pause;
  proto.unpauseAnimations = unpause;
  try {
    const { container } = render(<leadSourcing.LeadSourcing />);
    const observer = ManualObserver.all.find((o) => o.target === container.firstElementChild)!;
    act(() => observer.report(false));
    expect(pause).toHaveBeenCalledTimes(1);
    act(() => observer.report(true));
    expect(unpause).toHaveBeenCalled();
  } finally {
    delete proto.pauseAnimations;
    delete proto.unpauseAnimations;
  }
});

describe("decorative by default", () => {
  test.each([
    ["tab-overload", () => <tabOverload.TabOverload />, () => <tabOverload.TabOverload label="Windows" />],
    ["outreach-branches", () => <outreach.OutreachBranches />, () => <outreach.OutreachBranches label="Branches" />],
    ["lead-sourcing", () => <leadSourcing.LeadSourcing />, () => <leadSourcing.LeadSourcing label="Sourcing" />],
    ["team-invite", () => <teamInvite.TeamInvite avatars={[avatar(), avatar(), avatar()]} />, () => <teamInvite.TeamInvite avatars={[avatar("A"), avatar("B"), avatar("C")]} />],
  ] as const)("%s: aria-hidden without a label, an image with one", (_slug, plain, described) => {
    const a = render(plain()).container.firstElementChild!;
    expect(a.getAttribute("aria-hidden")).toBe("true");
    expect(a.getAttribute("role")).toBeNull();
    const b = render(described()).container.firstElementChild!;
    expect(b.getAttribute("role")).toBe("img");
    expect(b.getAttribute("aria-label")).toBeTruthy();
    expect(b.hasAttribute("aria-hidden")).toBe(false);
  });
});
