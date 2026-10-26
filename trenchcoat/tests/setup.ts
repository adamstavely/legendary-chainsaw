/*
 * jsdom has no layout engine and lacks several browser APIs the libraries use.
 * These stand-ins are deliberately minimal: they let components mount and run their timers,
 * they don't simulate real layout. Anything that depends on real geometry belongs in a browser test.
 */
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => cleanup());

class NoopObserver {
  observe(_target?: Element) {}
  unobserve(_target?: Element) {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

// Reports every target as visible once, so lazily started animations do start
class VisibleIntersectionObserver extends NoopObserver {
  private targets = new Set<Element>();
  constructor(private callback: IntersectionObserverCallback) {
    super();
  }
  observe(target: Element) {
    this.targets.add(target);
    queueMicrotask(() => {
      // Like the real thing: nothing is reported for targets no longer observed
      if (!this.targets.has(target)) return;
      this.callback(
        [{ target, isIntersecting: true, intersectionRatio: 1 } as unknown as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
    });
  }
  unobserve(target: Element) {
    this.targets.delete(target);
  }
  disconnect() {
    this.targets.clear();
  }
}

const g = globalThis as Record<string, unknown>;
g.ResizeObserver ??= NoopObserver;
g.IntersectionObserver ??= VisibleIntersectionObserver;
g.PointerEvent ??= class PointerEvent extends MouseEvent {
  pointerId: number;
  pointerType: string;
  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 1;
    this.pointerType = init.pointerType ?? "mouse";
  }
};
g.DOMMatrix ??= class DOMMatrix {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;
  m41 = 0;
  m42 = 0;
};

window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  }) as MediaQueryList;

window.scrollTo = () => {};
Element.prototype.scrollTo ??= function () {};
Element.prototype.scrollIntoView ??= function () {};
Element.prototype.setPointerCapture ??= function () {};
Element.prototype.releasePointerCapture ??= function () {};
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.getAnimations ??= () => [];
document.elementFromPoint ??= () => null;

// Web Animations: resolve immediately, like an animation with zero duration
Element.prototype.animate ??= function () {
  const animation = {
    finished: Promise.resolve(),
    onfinish: null as null | (() => void),
    oncancel: null,
    playState: "finished",
    cancel() {},
    finish() {},
    play() {},
    pause() {},
    reverse() {},
    commitStyles() {},
    persist() {},
    addEventListener() {},
    removeEventListener() {},
    currentTime: 0,
    effect: null,
  };
  queueMicrotask(() => animation.onfinish?.());
  return animation as unknown as Animation;
};

if (!Range.prototype.getClientRects) {
  Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
  Range.prototype.getBoundingClientRect = () => new DOMRect();
}

Object.defineProperty(navigator, "clipboard", {
  configurable: true,
  value: { writeText: () => Promise.resolve(), readText: () => Promise.resolve("") },
});

HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;

// CSS.escape, as specified (https://drafts.csswg.org/cssom/#serialize-an-identifier), minus edge cases we don't hit
g.CSS ??= {};
(g.CSS as { escape?: (s: string) => string }).escape ??= (s: string) =>
  s.replace(/^-?\d/, (m) => m.replace(/\d/, (d) => `\\3${d} `)).replace(/[^\w-\u0080-￿]/g, (c) => `\\${c}`);

// SVG geometry: jsdom implements none of it
const svgProto = (g.SVGElement as typeof SVGElement).prototype as unknown as Record<string, unknown>;
svgProto.getTotalLength ??= () => 100;
svgProto.getPointAtLength ??= () => ({ x: 0, y: 0 });
svgProto.getBBox ??= () => ({ x: 0, y: 0, width: 0, height: 0 });
