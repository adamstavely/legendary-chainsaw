import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import "../../src/element";
import { AgentFace } from "../../src/element";
import { loopSize } from "../../src/element/loop";
import { FACE_STATES, MIN_HOLD_MS, type FaceState } from "../../src/engine";

const made: HTMLElement[] = [];
afterEach(() => {
  made.splice(0).forEach((el) => el.remove());
  vi.restoreAllMocks();
});

function face(attrs: Record<string, string> = {}): AgentFace {
  const el = document.createElement("agent-face");
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.append(el);
  made.push(el);
  return el;
}
const canvas = (el: AgentFace) => el.shadowRoot!.querySelector("canvas")!;
const pixels = (el: AgentFace) => {
  const c = canvas(el);
  return c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
};
const differs = (a: Uint8ClampedArray, b: Uint8ClampedArray) => {
  let n = 0;
  for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i]! - b[i]!) + Math.abs(a[i + 3]! - b[i + 3]!) > 40) n += 1;
  return n;
};
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const running = (el: AgentFace) => (el as unknown as { looping: boolean }).looping;

describe("drawing", () => {
  it("draws straight away, in Donovan's colours", () => {
    const data = pixels(face({ motion: "reduced" }));
    let painted = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i]! > 200) painted += 1;
    expect(painted).toBeGreaterThan(500);
  });

  it.each([64, 160])("every state looks different at %i px", (size) => {
    const shots = FACE_STATES.map((state) => pixels(face({ state, size: String(size), motion: "reduced" })));
    for (let i = 0; i < shots.length; i++) for (let j = i + 1; j < shots.length; j++) expect(differs(shots[i]!, shots[j]!), `${FACE_STATES[i]} vs ${FACE_STATES[j]}`).toBeGreaterThan(5);
  });

  it("is sharp on high-density screens", () => {
    vi.spyOn(window, "devicePixelRatio", "get").mockReturnValue(2);
    const c = canvas(face({ size: "64", motion: "reduced" }));
    expect(c.width).toBe(192);
    expect(c.getBoundingClientRect().width).toBeCloseTo(96, 0);
  });

  it("takes up its size in the layout, with the overhang outside it", () => {
    const box = face({ size: "26" }).getBoundingClientRect();
    expect([box.width, box.height]).toEqual([26, 26]);
  });

  it.each([["5", 16], ["9000", 256], ["nope", 64], ["-4", 64]])("treats size %s as %i", (size, expected) => {
    expect(face({ size }).getBoundingClientRect().width).toBe(expected);
  });

  it("white hands float outside the body at 64 px, and are gone at 26", () => {
    // Surprised raises both hands well clear of the body; look for white beside the head
    const whites = (el: AgentFace) => {
      const data = pixels(el);
      const c = canvas(el);
      let n = 0;
      for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width * 0.25; x++) {
        const i = (y * c.width + x) * 4;
        if (data[i]! > 240 && data[i + 1]! > 240 && data[i + 2]! > 240 && data[i + 3]! > 240) n += 1;
      }
      return n;
    };
    expect(whites(face({ state: "surprised", size: "64", motion: "reduced" }))).toBeGreaterThan(5);
    expect(whites(face({ state: "surprised", size: "26", motion: "reduced" }))).toBe(0);
  });

  it("nothing is cut off during a spin", async () => {
    const el = face({ size: "64", motion: "full" });
    el.playGesture("spin");
    await wait(420);
    const c = canvas(el);
    const data = pixels(el);
    for (let x = 0; x < c.width; x++) {
      expect(data[x * 4 + 3]).toBe(0);
      expect(data[(c.height - 1) * c.width * 4 + x * 4 + 3]).toBe(0);
    }
  });
});

describe("state", () => {
  it("falls back to idle for an unknown state", () => {
    expect(face({ state: "dancing" }).state).toBe("idle");
  });

  it("the picture changes when the state does", async () => {
    const el = face({ motion: "reduced" });
    const before = pixels(el);
    el.state = "error";
    await wait(50);
    expect(differs(before, pixels(el))).toBeGreaterThan(5);
  });

  it("holds a state before moving on, and the label follows what's shown", async () => {
    const el = face({ motion: "reduced", state: "idle" });
    el.state = "happy";
    el.state = "error";
    expect(canvas(el).getAttribute("aria-label")).toBe("Donovan is pleased");
    expect(el.shownState).toBe("happy");
    await expect.poll(() => el.shownState, { timeout: MIN_HOLD_MS.happy + 1000 }).toBe("error");
    expect(canvas(el).getAttribute("aria-label")).toBe("Donovan hit a problem");
  });
});

describe("screen readers", () => {
  it.each(FACE_STATES)("%s has a label and passes axe", async (state: FaceState) => {
    const el = face({ state, motion: "reduced" });
    expect(canvas(el).getAttribute("role")).toBe("img");
    expect(canvas(el).getAttribute("aria-label")).toContain("Donovan");
    const { violations } = await axe.run(el);
    expect(violations).toEqual([]);
  });

  it("uses name, labels and label, in that order of strength", () => {
    const el = face({ state: "thinking", name: "Ada" });
    expect(canvas(el).getAttribute("aria-label")).toBe("Ada is thinking");
    el.labels = { thinking: "Réflexion" };
    el.setAttribute("name", "Grace");
    expect(canvas(el).getAttribute("aria-label")).toBe("Réflexion");
    el.setAttribute("label", "Assistant");
    expect(canvas(el).getAttribute("aria-label")).toBe("Assistant");
  });

  it("says nothing on changes unless asked", async () => {
    const el = face({ motion: "reduced" });
    el.state = "thinking";
    await wait(30);
    const live = el.shadowRoot!.querySelector("span")!;
    expect(live.getAttribute("role")).toBeNull();
    expect(live.textContent).toBe("");
  });

  it("announces changes when asked, not on arrival", async () => {
    const el = face({ motion: "reduced", announce: "" });
    const live = el.shadowRoot!.querySelector("[role=status]")!;
    expect(live.textContent).toBe("");
    el.state = "thinking";
    await expect.poll(() => live.textContent).toBe("Donovan is thinking");
  });
});

describe("the loop stops when there's nothing to do", () => {
  it("a reduced-motion face schedules no frames", async () => {
    const el = face({ motion: "reduced" });
    await wait(50);
    expect(running(el)).toBe(false);
    const raf = vi.spyOn(window, "requestAnimationFrame");
    await wait(300);
    expect(raf).not.toHaveBeenCalled();
  });

  it("an idle face fades to rest, then schedules no frames", async () => {
    const el = face({ "rest-after": "100" });
    expect(running(el)).toBe(true);
    await expect.poll(() => running(el), { timeout: 8000 }).toBe(false);
    await wait(50);
    const raf = vi.spyOn(window, "requestAnimationFrame");
    await wait(300);
    expect(raf).not.toHaveBeenCalled();
  });

  it("a busy face keeps moving", async () => {
    const el = face({ state: "thinking", "rest-after": "50" });
    await wait(1500);
    expect(running(el)).toBe(true);
  });

  it("a resting face wakes on a new state or gesture", async () => {
    const el = face({ "rest-after": "50" });
    await expect.poll(() => running(el), { timeout: 8000 }).toBe(false);
    el.state = "thinking";
    expect(running(el)).toBe(true);
    el.state = "idle";
    await expect.poll(() => running(el), { timeout: 8000 }).toBe(false);
    expect(el.playGesture("nod")).toBe(true);
    expect(running(el)).toBe(true);
  });

  it("stops off screen and picks up again on screen", async () => {
    const el = face({ state: "thinking" });
    el.style.cssText = "position:fixed;top:-500px;left:0";
    await expect.poll(() => running(el), { timeout: 3000 }).toBe(false);
    el.style.cssText = "";
    await expect.poll(() => running(el), { timeout: 3000 }).toBe(true);
  });

  it("stops when the tab is hidden", async () => {
    const el = face({ state: "thinking" });
    const spy = vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    document.dispatchEvent(new Event("visibilitychange"));
    expect(running(el)).toBe(false);
    spy.mockReturnValue("visible");
    document.dispatchEvent(new Event("visibilitychange"));
    expect(running(el)).toBe(true);
  });

  it("leaves the loop when removed, and comes back when re-added", () => {
    const el = face({ state: "thinking" });
    el.remove();
    expect(running(el)).toBe(false);
    document.body.append(el);
    expect(running(el)).toBe(true);
  });

  it("leaves no frame pending when the last face goes", () => {
    const cancel = vi.spyOn(window, "cancelAnimationFrame");
    const el = face({ state: "thinking" });
    el.remove();
    expect(loopSize()).toBe(0);
    expect(cancel).toHaveBeenCalled();
  });

  it("many faces share one frame", async () => {
    const before = loopSize();
    for (let i = 0; i < 20; i++) face({ state: "thinking" });
    expect(loopSize()).toBe(before + 20);
    const raf = vi.spyOn(window, "requestAnimationFrame");
    let frames = 0;
    const stop = performance.now() + 300;
    await new Promise<void>((done) => {
      const count = () => {
        frames += 1;
        if (performance.now() < stop) requestAnimationFrame(count);
        else done();
      };
      requestAnimationFrame(count);
    });
    // Ours plus the counter's own, so about two a frame rather than twenty-one
    expect(raf.mock.calls.length).toBeLessThanOrEqual(frames * 2 + 2);
  });
});

describe("motion", () => {
  it("reduced refuses gestures", () => {
    expect(face({ motion: "reduced" }).playGesture("spin")).toBe(false);
  });

  it("follows the system setting, live", () => {
    const listeners: (() => void)[] = [];
    const query = { matches: true, addEventListener: (_: string, fn: () => void) => listeners.push(fn), removeEventListener: () => {} };
    vi.spyOn(window, "matchMedia").mockReturnValue(query as unknown as MediaQueryList);
    const el = face();
    expect(el.playGesture("hop")).toBe(false);
    query.matches = false;
    listeners.forEach((fn) => fn());
    expect(el.playGesture("hop")).toBe(true);
  });

  it("the attribute beats the system setting", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true, addEventListener() {}, removeEventListener() {} } as unknown as MediaQueryList);
    expect(face({ motion: "full" }).playGesture("hop")).toBe(true);
  });

  it("a gesture before joining the page does nothing", () => {
    expect(document.createElement("agent-face").playGesture("hop")).toBe(false);
  });
});

describe("amplitude", () => {
  it("moves the mouth while speaking", async () => {
    const el = face({ state: "speaking", size: "160", seed: "1" });
    el.amplitude = 0;
    await wait(500);
    const shut = pixels(el);
    el.amplitude = 1;
    await wait(500);
    expect(differs(shut, pixels(el))).toBeGreaterThan(50);
  });

  it("a value set before joining the page is kept", () => {
    const el = document.createElement("agent-face");
    el.amplitude = 0.5;
    document.body.append(el);
    made.push(el);
    expect(el.amplitude).toBe(0.5);
  });
});
